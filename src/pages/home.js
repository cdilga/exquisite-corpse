export function getHomePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exquisite Corpse - Collaborative Story Game</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .fade-in {
      animation: fadeIn 0.3s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .pulse-animation {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body class="p-4">
  <div class="max-w-2xl mx-auto">
    <!-- Landing Screen -->
    <div id="landing-screen" class="bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <h1 class="text-4xl font-bold text-center mb-2 text-gray-800">📝 Exquisite Corpse</h1>
      <p class="text-center text-gray-600 mb-8">A hilarious collaborative storytelling game</p>

      <div class="space-y-4">
        <button id="create-room-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105">
          Create New Room
        </button>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <div class="flex gap-2">
          <input
            type="text"
            id="room-code-input"
            placeholder="Enter 4-letter room code"
            maxlength="4"
            class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 uppercase text-center text-2xl font-bold tracking-wider"
          />
          <button id="join-room-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-lg transition">
            Join
          </button>
        </div>
      </div>

      <div class="mt-8 p-4 bg-purple-50 rounded-lg">
        <h3 class="font-bold text-purple-900 mb-2">How to Play:</h3>
        <ol class="text-sm text-purple-800 space-y-1 list-decimal list-inside">
          <li>Create a room and share the code with friends</li>
          <li>Each player writes one sentence, seeing only the previous one</li>
          <li>After everyone's turn, the full story is revealed!</li>
        </ol>
      </div>
    </div>

    <!-- Lobby Screen -->
    <div id="lobby-screen" class="hidden bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <div class="text-center mb-6">
        <h2 class="text-3xl font-bold text-gray-800 mb-2">Room Code</h2>
        <div class="text-6xl font-bold text-purple-600 tracking-widest" id="room-code-display">----</div>
        <p class="text-gray-600 mt-2">Share this code with your friends!</p>
      </div>

      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 class="font-bold text-gray-700 mb-3">Players in Lobby:</h3>
        <div id="players-list" class="space-y-2"></div>
      </div>

      <button id="start-game-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105">
        Start Game
      </button>

      <p class="text-center text-sm text-gray-500 mt-4">Waiting for host to start the game...</p>
    </div>

    <!-- Game Screen -->
    <div id="game-screen" class="hidden bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <!-- Your Turn -->
      <div id="your-turn" class="hidden">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Your Turn!</h2>

        <div id="previous-sentence-container" class="hidden mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
          <p class="text-sm text-purple-700 font-semibold mb-1">Previous sentence:</p>
          <p id="previous-sentence" class="text-gray-800 italic"></p>
        </div>

        <div id="first-sentence-hint" class="hidden mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
          <p class="text-green-800">You're starting the story! Write the first sentence...</p>
        </div>

        <textarea
          id="sentence-input"
          rows="4"
          placeholder="Write your sentence here..."
          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
        ></textarea>

        <div class="flex justify-between items-center mt-4">
          <p class="text-sm text-gray-500">Turn <span id="turn-number">1</span> of <span id="total-turns">?</span></p>
          <button id="submit-sentence-btn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105">
            Submit
          </button>
        </div>
      </div>

      <!-- Waiting Screen -->
      <div id="waiting-turn" class="hidden text-center py-12">
        <div class="text-6xl mb-4 pulse-animation">⏳</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Waiting for <span id="current-player-name">player</span>...</h2>
        <p class="text-gray-600">Turn <span id="waiting-turn-number">1</span> of <span id="waiting-total-turns">?</span></p>
      </div>
    </div>

    <!-- Results Screen -->
    <div id="results-screen" class="hidden bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-6">🎉 The Complete Story!</h2>

      <div id="story-container" class="space-y-4 mb-8"></div>

      <button id="play-again-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105">
        Play Again
      </button>
    </div>

    <!-- Error Display -->
    <div id="error-message" class="hidden mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded fade-in"></div>
  </div>

  <script>
    // WebSocket connection
    let ws = null;
    let playerId = null;
    let playerName = null;
    let roomCode = null;
    let isHost = false;

    // UI Elements
    const screens = {
      landing: document.getElementById('landing-screen'),
      lobby: document.getElementById('lobby-screen'),
      game: document.getElementById('game-screen'),
      results: document.getElementById('results-screen'),
    };

    const elements = {
      createRoomBtn: document.getElementById('create-room-btn'),
      joinRoomBtn: document.getElementById('join-room-btn'),
      roomCodeInput: document.getElementById('room-code-input'),
      roomCodeDisplay: document.getElementById('room-code-display'),
      playersList: document.getElementById('players-list'),
      startGameBtn: document.getElementById('start-game-btn'),
      yourTurn: document.getElementById('your-turn'),
      waitingTurn: document.getElementById('waiting-turn'),
      sentenceInput: document.getElementById('sentence-input'),
      submitSentenceBtn: document.getElementById('submit-sentence-btn'),
      previousSentence: document.getElementById('previous-sentence'),
      previousSentenceContainer: document.getElementById('previous-sentence-container'),
      firstSentenceHint: document.getElementById('first-sentence-hint'),
      turnNumber: document.getElementById('turn-number'),
      totalTurns: document.getElementById('total-turns'),
      currentPlayerName: document.getElementById('current-player-name'),
      waitingTurnNumber: document.getElementById('waiting-turn-number'),
      waitingTotalTurns: document.getElementById('waiting-total-turns'),
      storyContainer: document.getElementById('story-container'),
      playAgainBtn: document.getElementById('play-again-btn'),
      errorMessage: document.getElementById('error-message'),
    };

    // Event Listeners
    elements.createRoomBtn.addEventListener('click', createRoom);
    elements.joinRoomBtn.addEventListener('click', () => joinRoom(elements.roomCodeInput.value));
    elements.roomCodeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
    elements.roomCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') joinRoom(elements.roomCodeInput.value);
    });
    elements.startGameBtn.addEventListener('click', startGame);
    elements.submitSentenceBtn.addEventListener('click', submitSentence);
    elements.sentenceInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitSentence();
      }
    });
    elements.playAgainBtn.addEventListener('click', () => location.reload());

    // Functions
    function showScreen(screenName) {
      Object.values(screens).forEach(screen => screen.classList.add('hidden'));
      screens[screenName].classList.remove('hidden');
      screens[screenName].classList.add('fade-in');
    }

    function showError(message) {
      elements.errorMessage.textContent = message;
      elements.errorMessage.classList.remove('hidden');
      setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
      }, 5000);
    }

    function createRoom() {
      // Generate random room code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      roomCode = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      isHost = true;

      // Get player name
      playerName = prompt('Enter your name:') || 'Anonymous';

      connectToRoom(roomCode);
    }

    function joinRoom(code) {
      if (!code || code.length !== 4) {
        showError('Please enter a valid 4-character room code');
        return;
      }

      roomCode = code.toUpperCase();
      isHost = false;

      // Get player name
      playerName = prompt('Enter your name:') || 'Anonymous';

      connectToRoom(roomCode);
    }

    function connectToRoom(code) {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = \`\${protocol}//\${location.host}/room/\${code}\`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to room:', code);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMessage(message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showError('Connection error. Please try again.');
      };

      ws.onclose = () => {
        console.log('Disconnected from room');
      };
    }

    function handleMessage(message) {
      console.log('Received:', message);

      switch (message.type) {
        case 'connected':
          playerId = message.playerId;
          // Send join message
          ws.send(JSON.stringify({
            type: 'join',
            playerName: playerName,
          }));
          break;

        case 'player_joined':
          roomCode = message.roomCode;
          elements.roomCodeDisplay.textContent = roomCode;
          updatePlayersList(message.players);
          showScreen('lobby');
          break;

        case 'player_left':
          updatePlayersList(message.players);
          break;

        case 'game_started':
          showScreen('game');
          elements.yourTurn.classList.add('hidden');
          elements.waitingTurn.classList.add('hidden');
          break;

        case 'your_turn':
          elements.yourTurn.classList.remove('hidden');
          elements.waitingTurn.classList.add('hidden');
          elements.sentenceInput.value = '';
          elements.sentenceInput.focus();
          elements.turnNumber.textContent = message.turnNumber;
          elements.totalTurns.textContent = message.totalPlayers;

          if (message.previousSentence) {
            elements.previousSentence.textContent = message.previousSentence;
            elements.previousSentenceContainer.classList.remove('hidden');
            elements.firstSentenceHint.classList.add('hidden');
          } else {
            elements.previousSentenceContainer.classList.add('hidden');
            elements.firstSentenceHint.classList.remove('hidden');
          }
          break;

        case 'waiting_for_turn':
          elements.yourTurn.classList.add('hidden');
          elements.waitingTurn.classList.remove('hidden');
          elements.currentPlayerName.textContent = message.currentPlayerName;
          elements.waitingTurnNumber.textContent = message.turnNumber;
          elements.waitingTotalTurns.textContent = message.totalPlayers;
          break;

        case 'game_complete':
          showScreen('results');
          displayStory(message.story);
          break;

        case 'error':
          showError(message.message);
          break;
      }
    }

    function updatePlayersList(players) {
      elements.playersList.innerHTML = players.map((player, index) => \`
        <div class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
          <div class="flex items-center gap-2">
            <span class="text-2xl">\${index === 0 ? '👑' : '👤'}</span>
            <span class="font-medium">\${player.name}</span>
          </div>
          \${index === 0 ? '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Host</span>' : ''}
        </div>
      \`).join('');
    }

    function startGame() {
      if (!isHost) {
        showError('Only the host can start the game');
        return;
      }

      ws.send(JSON.stringify({
        type: 'start_game',
      }));
    }

    function submitSentence() {
      const sentence = elements.sentenceInput.value.trim();

      if (!sentence) {
        showError('Please write a sentence');
        return;
      }

      ws.send(JSON.stringify({
        type: 'submit_sentence',
        sentence: sentence,
      }));

      // Show waiting state
      elements.yourTurn.classList.add('hidden');
      elements.waitingTurn.classList.remove('hidden');
    }

    function displayStory(story) {
      elements.storyContainer.innerHTML = story.map((entry, index) => \`
        <div class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg font-bold text-purple-600">\${index + 1}.</span>
            <span class="text-sm font-semibold text-gray-700">\${entry.playerName}</span>
          </div>
          <p class="text-gray-800 text-lg">\${entry.sentence}</p>
        </div>
      \`).join('');
    }
  </script>
</body>
</html>`;
}
