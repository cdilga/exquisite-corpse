/**
 * GameRoom Durable Object
 * Manages state and WebSocket connections for a single game room
 */
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // playerId -> WebSocket
  }

  async fetch(request) {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Handle HTTP requests for room info
    const url = new URL(request.url);
    if (url.pathname.endsWith('/info')) {
      const state = await this.getGameState();
      return new Response(JSON.stringify({
        roomCode: state.roomCode,
        playerCount: state.players.length,
        gameStarted: state.gameStarted,
        gameComplete: state.gameComplete,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleSession(webSocket) {
    webSocket.accept();

    const playerId = crypto.randomUUID();
    this.sessions.set(playerId, webSocket);

    // Send connection confirmation
    webSocket.send(JSON.stringify({
      type: 'connected',
      playerId: playerId,
    }));

    // Handle incoming messages
    webSocket.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        await this.handleMessage(playerId, data);
      } catch (error) {
        webSocket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
        }));
      }
    });

    // Handle disconnection
    webSocket.addEventListener('close', async () => {
      this.sessions.delete(playerId);
      await this.handlePlayerDisconnect(playerId);
    });
  }

  async handleMessage(playerId, data) {
    const state = await this.getGameState();

    switch (data.type) {
      case 'join':
        await this.handleJoin(playerId, data.playerName);
        break;

      case 'start_game':
        await this.handleStartGame(playerId);
        break;

      case 'submit_sentence':
        await this.handleSubmitSentence(playerId, data.sentence);
        break;

      default:
        this.sendToPlayer(playerId, {
          type: 'error',
          message: 'Unknown message type',
        });
    }
  }

  async handleJoin(playerId, playerName) {
    const state = await this.getGameState();

    if (state.gameStarted) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Game already started',
      });
      return;
    }

    // Add player if not already joined
    const existingPlayer = state.players.find(p => p.id === playerId);
    if (!existingPlayer) {
      state.players.push({
        id: playerId,
        name: playerName || `Player ${state.players.length + 1}`,
      });
      await this.saveGameState(state);
    }

    // Send updated state to all players
    this.broadcast({
      type: 'player_joined',
      players: state.players,
      roomCode: state.roomCode,
    });
  }

  async handleStartGame(playerId) {
    const state = await this.getGameState();

    // Only first player (host) can start
    if (state.players.length === 0 || state.players[0].id !== playerId) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Only the host can start the game',
      });
      return;
    }

    if (state.players.length < 2) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Need at least 2 players to start',
      });
      return;
    }

    state.gameStarted = true;
    state.currentTurnIndex = 0;
    state.story = [];
    await this.saveGameState(state);

    // Notify all players game has started
    this.broadcast({
      type: 'game_started',
      players: state.players,
      currentPlayer: state.players[0],
    });

    // Tell first player it's their turn
    this.sendToPlayer(state.players[0].id, {
      type: 'your_turn',
      previousSentence: null,
      turnNumber: 1,
      totalPlayers: state.players.length,
    });
  }

  async handleSubmitSentence(playerId, sentence) {
    const state = await this.getGameState();

    if (!state.gameStarted || state.gameComplete) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Game is not in progress',
      });
      return;
    }

    // Verify it's this player's turn
    const currentPlayer = state.players[state.currentTurnIndex];
    if (currentPlayer.id !== playerId) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Not your turn',
      });
      return;
    }

    if (!sentence || sentence.trim().length === 0) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Sentence cannot be empty',
      });
      return;
    }

    // Add sentence to story
    state.story.push({
      playerId: playerId,
      playerName: currentPlayer.name,
      sentence: sentence.trim(),
    });

    // Move to next turn
    state.currentTurnIndex++;

    // Check if game is complete (everyone has gone)
    if (state.currentTurnIndex >= state.players.length) {
      state.gameComplete = true;
      await this.saveGameState(state);

      // Broadcast complete story to everyone
      this.broadcast({
        type: 'game_complete',
        story: state.story,
      });
    } else {
      await this.saveGameState(state);

      const nextPlayer = state.players[state.currentTurnIndex];
      const previousSentence = state.story[state.story.length - 1].sentence;

      // Tell next player it's their turn (with only previous sentence)
      this.sendToPlayer(nextPlayer.id, {
        type: 'your_turn',
        previousSentence: previousSentence,
        turnNumber: state.currentTurnIndex + 1,
        totalPlayers: state.players.length,
      });

      // Tell everyone else to wait
      state.players.forEach(player => {
        if (player.id !== nextPlayer.id) {
          this.sendToPlayer(player.id, {
            type: 'waiting_for_turn',
            currentPlayerName: nextPlayer.name,
            turnNumber: state.currentTurnIndex + 1,
            totalPlayers: state.players.length,
          });
        }
      });
    }
  }

  async handlePlayerDisconnect(playerId) {
    const state = await this.getGameState();

    // Remove player from list if game hasn't started
    if (!state.gameStarted) {
      state.players = state.players.filter(p => p.id !== playerId);
      await this.saveGameState(state);

      this.broadcast({
        type: 'player_left',
        players: state.players,
      });
    }
  }

  async getGameState() {
    let state = await this.state.storage.get('gameState');
    if (!state) {
      // Initialize new room
      state = {
        roomCode: this.generateRoomCode(),
        players: [],
        story: [],
        currentTurnIndex: 0,
        gameStarted: false,
        gameComplete: false,
      };
      await this.state.storage.put('gameState', state);
    }
    return state;
  }

  async saveGameState(state) {
    await this.state.storage.put('gameState', state);
  }

  generateRoomCode() {
    // Generate 4-character room code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  sendToPlayer(playerId, message) {
    const ws = this.sessions.get(playerId);
    if (ws && ws.readyState === WebSocket.READY_STATE_OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.sessions.forEach((ws) => {
      if (ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(messageStr);
      }
    });
  }
}
