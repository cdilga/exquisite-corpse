// Split HTML generation into clean, manageable pieces
export function getHomePage() {
  const head = getHeadSection();
  const body = getBodySection();
  const script = getScriptSection();

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>
<body class="p-4">
${body}
<script>
${script}
</script>
</body>
</html>`;
}

function getHeadSection() {
  return `  <meta charset="UTF-8">
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
    .button-press {
      transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .button-press:active {
      transform: scale(0.95);
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(124, 58, 237, 0.2);
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .pulse-animation {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .confetti {
      position: fixed;
      width: 10px;
      height: 10px;
      pointer-events: none;
    }
    .reconnection-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #dc2626, #991b1b);
      color: white;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      z-index: 1000;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
    .reconnection-banner.success {
      background: linear-gradient(90deg, #10b981, #059669);
    }
    .reconnection-spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .offline-badge {
      display: inline-block;
    }
  </style>`;
}

function getBodySection() {
  return `  <!-- Reconnection Banner -->
  <div id="reconnection-banner" class="hidden reconnection-banner">
    <div class="flex items-center gap-3 flex-1">
      <div class="reconnection-spinner"></div>
      <span id="reconnection-status-text">Reconnecting...</span>
    </div>
    <button id="manual-reconnect-btn" class="bg-white text-red-600 font-bold px-4 py-2 rounded hover:bg-gray-100 transition text-sm">
      Reconnect Now
    </button>
  </div>

  <div class="max-w-2xl mx-auto">
    <!-- Landing Screen -->
    <div id="landing-screen" class="bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <h1 class="text-4xl font-bold text-center mb-2 text-gray-800">📝 Exquisite Corpse</h1>
      <p class="text-center text-gray-600 mb-8">A hilarious collaborative storytelling game</p>

      <div class="space-y-4 mb-8">
        <button id="create-room-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 button-press">
          Create Your Own Story
        </button>
        <div class="w-full border-t border-gray-300"></div>
        <div class="text-center text-gray-500">
          <span class="px-2 bg-white text-gray-500">or</span>
        </div>
        <div class="space-y-2">
          <input id="room-code-input" type="text" placeholder="ENTER 4-LETTER ROOM CODE" class="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 text-center text-2xl tracking-widest font-bold" maxlength="4">
          <button id="join-room-btn" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 button-press">
            Join Room
          </button>
        </div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4 text-sm text-gray-700">
        <h3 class="font-bold text-purple-900 mb-2">How to Play:</h3>
        <ol class="list-decimal list-inside space-y-1 text-gray-700">
          <li>Create a room and share the code with friends</li>
          <li>Configure game length (sentences per player)</li>
          <li>Each player writes a sentence, seeing only the previous one</li>
          <li>Hear the complete story read aloud together!</li>
          <li>Share your masterpiece with the world</li>
        </ol>
      </div>
    </div>

    <!-- Lobby Screen -->
    <div id="lobby-screen" class="hidden bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <div class="mb-6">
        <h2 class="text-3xl font-bold text-gray-800 mb-2">Room Code</h2>
        <div class="text-6xl font-bold text-purple-600 tracking-widest" id="room-code-display">----</div>
        <p class="text-gray-600 mt-2">Share this code with your friends!</p>
      </div>

      <div class="mb-6">
        <h3 class="font-bold text-gray-700 mb-3">Players in Lobby:</h3>
        <div id="players-list" class="space-y-2"></div>
      </div>

      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 class="font-bold text-purple-900 mb-3">⚙️ Game Settings</h3>
        <div class="space-y-3">
          <label class="block">
            <span class="text-sm text-purple-800 font-medium">Sentences per Player:</span>
            <div class="flex gap-2 mt-2">
              <button class="rounds-btn px-4 py-2 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition button-press" data-rounds="1">1</button>
              <button class="rounds-btn px-4 py-2 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition button-press" data-rounds="2">2</button>
              <button class="rounds-btn px-4 py-2 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition button-press" data-rounds="3">3</button>
            </div>
          </label>
          <p class="text-xs text-gray-500">
            <span id="total-turns-preview">? total turns</span>
            (<span id="story-length-preview">? sentences</span> story)
          </p>
        </div>
        <p class="text-xs text-gray-500 mt-2">Only the host can change game settings</p>
      </div>

      <button id="start-game-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105 button-press hidden">
        Start Game
      </button>
      <p class="text-center text-sm text-gray-500 mt-4">Waiting for host to start the game...</p>
    </div>

    <!-- Game Screen -->
    <div id="game-screen" class="hidden bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <div id="your-turn" class="hidden">
        <div class="mb-4">
          <h2 class="text-2xl font-bold text-gray-800">Your Turn!</h2>
          <p class="text-sm text-gray-500">Round <span id="turn-round">1</span>/<span id="total-rounds">1</span></p>
        </div>

        <div id="previous-sentence-container" class="hidden mb-4 p-4 bg-purple-50 rounded-lg">
          <p class="text-sm text-purple-700 font-semibold mb-1">Previous sentence:</p>
          <p id="previous-sentence" class="text-gray-800 italic"></p>
        </div>

        <div id="first-sentence-hint" class="hidden mb-4 p-4 bg-green-50 rounded-lg">
          <p class="text-green-800">You're starting the story! Write the first sentence...</p>
        </div>

        <textarea id="sentence-input" placeholder="Write your sentence here..." class="w-full h-32 px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 resize-none"
        ></textarea>

        <div class="flex justify-between items-center mt-4">
          <div class="text-sm text-gray-500">Turn <span id="turn-number">1</span> of <span id="total-turns">?</span></div>
          <button id="submit-sentence-btn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition button-press">
            Submit
          </button>
        </div>
      </div>

      <div id="waiting-turn" class="hidden text-center">
        <div class="text-6xl mb-4 pulse-animation">⏳</div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Waiting for <span id="current-player-name">player</span>...</h2>
        <p class="text-sm text-gray-600 mb-2">Round <span id="waiting-round">1</span>/<span id="waiting-total-rounds">1</span></p>
        <p class="text-gray-600">Turn <span id="waiting-turn-number">1</span> of <span id="waiting-total-turns">?</span></p>
      </div>
    </div>

    <!-- Results Screen -->
    <div id="results-screen" class="hidden bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-2">🎉 The Complete Story!</h2>
      <p class="text-center text-gray-600 mb-6">Everyone's contribution to the masterpiece</p>

      <div id="story-container" class="space-y-4 mb-8"></div>

      <!-- Audio Controls -->
      <div id="audio-controls" class="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
        <p class="text-sm text-blue-800 font-semibold mb-3">🔊 Hear Your Story:</p>
        <div class="flex gap-2 flex-wrap">
          <button id="play-audio-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition button-press text-sm">▶️ Play</button>
          <button id="pause-audio-btn" class="hidden bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition button-press text-sm">⏸️ Pause</button>
          <button id="stop-audio-btn" class="hidden bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition button-press text-sm">⏹️ Stop</button>
          <select id="voice-selector" class="px-3 py-2 border border-gray-300 rounded-lg text-sm"></select>
        </div>
      </div>

      <!-- Export Options -->
      <div class="bg-orange-50 rounded-lg p-4 mb-6 border-l-4 border-orange-500">
        <p class="text-sm text-orange-800 font-semibold mb-3">📤 Share Your Story:</p>
        <div class="flex gap-2 flex-wrap">
          <button id="copy-clipboard-btn" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition button-press text-sm">📋 Copy</button>
          <button id="download-txt-btn" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition button-press text-sm">⬇️ TXT</button>
          <button id="download-html-btn" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition button-press text-sm">⬇️ HTML</button>
          <button id="generate-link-btn" class="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg transition button-press text-sm">
            🔗 Share Link
          </button>
        </div>

        <div id="share-link-result" class="hidden mt-3 p-3 bg-white rounded border-2 border-pink-300">
          <p class="text-sm text-gray-700 mb-2">Shareable link created:</p>
          <div class="flex gap-2">
            <input id="share-link-url" type="text" readonly class="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm" />
            <button id="copy-share-link-btn" class="bg-pink-600 text-white px-3 py-2 rounded hover:bg-pink-700 text-sm button-press">
              Copy
            </button>
          </div>
        </div>
      </div>

      <button id="play-again-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105 button-press">
        Play Again
      </button>
    </div>

    <!-- Error Display -->
    <div id="error-message" class="hidden mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded fade-in"></div>
  </div>`;
}

function getScriptSection() {
  // This returns the raw JavaScript code
  return `
    let ws = null;
    let playerId = null;
    let playerName = null;
    let roomCode = null;
    let isHost = false;
    let selectedRounds = 1;
    let sessionId = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000;
    let reconnectionTimer = null;
    let isConnected = false;
    let offlinePlayers = new Set();
    let currentStory = [];
    let ttsPlaying = false;
    let currentSentenceIndex = 0;
    let selectedVoice = null;

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
      turnRound: document.getElementById('turn-round'),
      totalRounds: document.getElementById('total-rounds'),
      currentPlayerName: document.getElementById('current-player-name'),
      waitingTurnNumber: document.getElementById('waiting-turn-number'),
      waitingTotalTurns: document.getElementById('waiting-total-turns'),
      waitingRound: document.getElementById('waiting-round'),
      waitingTotalRounds: document.getElementById('waiting-total-rounds'),
      storyContainer: document.getElementById('story-container'),
      playAgainBtn: document.getElementById('play-again-btn'),
      errorMessage: document.getElementById('error-message'),
      reconnectionBanner: document.getElementById('reconnection-banner'),
      reconnectionStatusText: document.getElementById('reconnection-status-text'),
      manualReconnectBtn: document.getElementById('manual-reconnect-btn'),
      gameSettings: document.getElementById('game-settings'),
      playAudioBtn: document.getElementById('play-audio-btn'),
      pauseAudioBtn: document.getElementById('pause-audio-btn'),
      stopAudioBtn: document.getElementById('stop-audio-btn'),
      voiceSelector: document.getElementById('voice-selector'),
      copyClipboardBtn: document.getElementById('copy-clipboard-btn'),
      downloadTxtBtn: document.getElementById('download-txt-btn'),
      downloadHtmlBtn: document.getElementById('download-html-btn'),
      generateLinkBtn: document.getElementById('generate-link-btn'),
      shareLinkResult: document.getElementById('share-link-result'),
      shareLinkUrl: document.getElementById('share-link-url'),
      copyShareLinkBtn: document.getElementById('copy-share-link-btn'),
    };

    // Event Listeners
    elements.createRoomBtn.addEventListener('click', createRoom);
    elements.joinRoomBtn.addEventListener('click', () => joinRoom(elements.roomCodeInput.value));
    elements.startGameBtn.addEventListener('click', startGame);
    elements.submitSentenceBtn.addEventListener('click', submitSentence);
    elements.playAgainBtn.addEventListener('click', () => location.reload());
    elements.manualReconnectBtn.addEventListener('click', forceReconnect);

    document.querySelectorAll('.rounds-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        selectedRounds = parseInt(this.dataset.rounds);
        updateTurnsPreview();
      });
    });

    // Placeholder functions - will be filled in next
    function createRoom() {
      const name = prompt('Enter your name:');
      if (!name) return;
      playerName = name;
      const code = generateRoomCode();
      roomCode = code;
      sessionId = crypto.randomUUID();
      localStorage.setItem('ec-session-' + code, sessionId);
      showScreen('lobby');
      elements.roomCodeDisplay.textContent = code;
      connectToRoom(code);
    }

    function generateRoomCode() {
      return Array.from({length: 4}, () => String.fromCharCode(65 + Math.random() * 26)).join('');
    }

    function joinRoom(code) {
      if (code.length !== 4) {
        showError('Room code must be 4 characters');
        return;
      }
      const name = prompt('Enter your name:');
      if (!name) return;
      playerName = name;
      roomCode = code;
      sessionId = crypto.randomUUID();
      localStorage.setItem('ec-session-' + code, sessionId);
      showScreen('lobby');
      connectToRoom(code);
    }

    function connectToRoom(code) {
      const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = protocol + '://' + location.host + '/room/' + code;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isConnected = true;
        ws.send(JSON.stringify({
          type: 'join',
          playerName: playerName,
          sessionId: sessionId
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMessage(message);
      };

      ws.onerror = () => {
        showError('Connection error');
      };

      ws.onclose = () => {
        isConnected = false;
      };
    }

    function handleMessage(message) {
      console.log('Message:', message.type);
      // TODO: Implement message handlers
    }

    function startGame() {
      if (!ws) return;
      ws.send(JSON.stringify({ type: 'start_game' }));
    }

    function submitSentence() {
      const sentence = elements.sentenceInput.value.trim();
      if (!sentence) {
        showError('Please write a sentence');
        return;
      }
      if (!ws) return;
      ws.send(JSON.stringify({ type: 'submit_sentence', sentence }));
      elements.sentenceInput.value = '';
    }

    function forceReconnect() {
      if (ws) ws.close();
      setTimeout(() => connectToRoom(roomCode), 1000);
    }

    function showScreen(screenName) {
      Object.values(screens).forEach(s => s.classList.add('hidden'));
      screens[screenName].classList.remove('hidden');
    }

    function showError(message) {
      elements.errorMessage.textContent = message;
      elements.errorMessage.classList.remove('hidden');
      setTimeout(() => elements.errorMessage.classList.add('hidden'), 5000);
    }

    function updateTurnsPreview() {
      const totalTurns = selectedRounds * 2; // Assuming 2 players for now
      elements.document.getElementById('total-turns-preview').textContent = totalTurns + ' total turns';
      elements.document.getElementById('story-length-preview').textContent = totalTurns + ' sentences';
    }

    console.log('✅ Game script loaded');
  `;
}
