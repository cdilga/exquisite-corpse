/**
 * GameRoom Durable Object
 * Manages state and WebSocket connections for a single game room
 */
export class GameRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // playerId -> WebSocket
    this.roomCode = null; // Will be set from URL
  }

  async fetch(request) {
    // Extract room code from URL path (/room/ABCD)
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const urlRoomCode = pathParts[2]; // Get ABCD from /room/ABCD
    this.roomCode = urlRoomCode.toUpperCase();

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

      case 'update_game_settings':
        await this.handleUpdateGameSettings(playerId, data);
        break;

      case 'start_game':
        await this.handleStartGame(playerId);
        break;

      case 'submit_sentence':
        await this.handleSubmitSentence(playerId, data.sentence);
        break;

      case 'start_tts_playback':
        await this.handleStartTTS(playerId);
        break;

      case 'tts_sentence_complete':
        await this.handleTTSSentenceComplete(playerId, data.sentenceIndex);
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
      roundsPerPlayer: state.roundsPerPlayer, // Include current rounds setting
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
    state.currentRound = 1;
    state.story = [];
    // Calculate total turns based on players and rounds
    state.totalTurns = state.players.length * state.roundsPerPlayer;
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
      totalTurns: state.totalTurns,
      roundInfo: {
        currentRound: 1,
        totalRounds: state.roundsPerPlayer,
      },
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
    const currentPlayerIndex = state.currentTurnIndex % state.players.length;
    const currentPlayer = state.players[currentPlayerIndex];
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

    // Add sentence to story with round tracking
    const currentRound = Math.floor(state.currentTurnIndex / state.players.length) + 1;
    state.story.push({
      playerId: playerId,
      playerName: currentPlayer.name,
      sentence: sentence.trim(),
      roundNumber: currentRound,
      turnNumber: state.currentTurnIndex + 1,
    });

    // Move to next turn
    state.currentTurnIndex++;

    // Check if game is complete (all rounds done)
    if (state.currentTurnIndex >= state.totalTurns) {
      state.gameComplete = true;
      await this.saveGameState(state);

      // Broadcast complete story to everyone
      this.broadcast({
        type: 'game_complete',
        story: state.story,
      });
    } else {
      // Calculate current round for next turn
      state.currentRound = Math.floor(state.currentTurnIndex / state.players.length) + 1;
      await this.saveGameState(state);

      const nextPlayerIndex = state.currentTurnIndex % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];
      const previousSentence = state.story[state.story.length - 1].sentence;

      // Tell next player it's their turn (with only previous sentence)
      this.sendToPlayer(nextPlayer.id, {
        type: 'your_turn',
        previousSentence: previousSentence,
        turnNumber: state.currentTurnIndex + 1,
        totalTurns: state.totalTurns,
        roundInfo: {
          currentRound: state.currentRound,
          totalRounds: state.roundsPerPlayer,
        },
      });

      // Tell everyone else to wait
      state.players.forEach(player => {
        if (player.id !== nextPlayer.id) {
          this.sendToPlayer(player.id, {
            type: 'waiting_for_turn',
            currentPlayerName: nextPlayer.name,
            turnNumber: state.currentTurnIndex + 1,
            totalTurns: state.totalTurns,
            roundInfo: {
              currentRound: state.currentRound,
              totalRounds: state.roundsPerPlayer,
            },
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

  async handleUpdateGameSettings(playerId, data) {
    const state = await this.getGameState();

    // Only host can update settings
    if (state.players.length === 0 || state.players[0].id !== playerId) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Only the host can change game settings',
      });
      return;
    }

    if (state.gameStarted) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Cannot change settings after game has started',
      });
      return;
    }

    const rounds = parseInt(data.roundsPerPlayer);
    if (!rounds || rounds < 1 || rounds > 10) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Invalid number of rounds (1-10)',
      });
      return;
    }

    state.roundsPerPlayer = rounds;
    await this.saveGameState(state);

    this.broadcast({
      type: 'game_settings_updated',
      roundsPerPlayer: rounds,
      totalTurns: state.players.length * rounds,
    });
  }

  async handleStartTTS(playerId) {
    const state = await this.getGameState();

    if (!state.gameComplete) {
      this.sendToPlayer(playerId, {
        type: 'error',
        message: 'Game must be complete to play audio',
      });
      return;
    }

    const startTime = Date.now() + 1000; // 1 second buffer for sync

    state.ttsState = {
      isPlaying: true,
      startedBy: playerId,
      startTime: startTime,
      currentSentenceIndex: 0,
    };

    await this.saveGameState(state);

    this.broadcast({
      type: 'tts_playback_start',
      startTime: startTime,
    });
  }

  async handleTTSSentenceComplete(playerId, sentenceIndex) {
    const state = await this.getGameState();

    state.ttsState.currentSentenceIndex = sentenceIndex + 1;
    await this.saveGameState(state);
  }

  async getGameState() {
    let state = await this.state.storage.get('gameState');
    if (!state) {
      // Initialize new room with room code from URL
      state = {
        roomCode: this.roomCode, // Use room code from URL path
        players: [],
        story: [],
        currentTurnIndex: 0,
        gameStarted: false,
        gameComplete: false,
        // NEW: Configurable rounds
        roundsPerPlayer: 1,
        currentRound: 0,
        totalTurns: 0,
        // NEW: TTS state
        ttsState: {
          isPlaying: false,
          startedBy: null,
          startTime: null,
          currentSentenceIndex: 0,
        },
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
