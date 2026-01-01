export function getHomePage() {
  const html = `<!DOCTYPE html>
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

    /* Screen Transitions */
    .fade-in {
      animation: fadeIn 0.3s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Loading Spinner */
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

    /* Pulse Animation */
    .pulse-animation {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Confetti */
    .confetti {
      position: fixed;
      width: 10px;
      height: 10px;
      pointer-events: none;
      animation: confettiFall 3s linear forwards;
    }
    @keyframes confettiFall {
      to {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }

    /* Story Reveal */
    .story-reveal {
      animation: storyReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      opacity: 0;
    }
    @keyframes storyReveal {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }

    /* Active Player Glow */
    .active-player-glow {
      animation: pulseGlow 2s ease-in-out infinite;
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.4); }
      50% { box-shadow: 0 0 30px rgba(124, 58, 237, 0.8); }
    }

    /* Button Press Effect */
    .button-press {
      transition: transform 0.1s ease;
    }
    .button-press:active {
      transform: scale(0.95);
    }

    /* Reconnection Banner */
    .reconnection-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #f59e0b 0%, #dc2626 100%);
      color: white;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      z-index: 1000;
      animation: slideDown 0.3s ease-out;
    }
    @keyframes slideDown {
      from {
        transform: translateY(-100%);
      }
      to {
        transform: translateY(0);
      }
    }

    .reconnection-banner.success {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }

    .reconnection-spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    }

    .offline-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Respect prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body class="p-4">
  <!-- Reconnection Banner -->
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

      <div class="space-y-4">
        <button id="create-room-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105 button-press">
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
          <button id="join-room-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-lg transition button-press">
            Join
          </button>
        </div>
      </div>

      <div class="mt-8 p-4 bg-purple-50 rounded-lg">
        <h3 class="font-bold text-purple-900 mb-2">How to Play:</h3>
        <ol class="text-sm text-purple-800 space-y-1 list-decimal list-inside">
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
      <div class="text-center mb-6">
        <h2 class="text-3xl font-bold text-gray-800 mb-2">Room Code</h2>
        <div class="text-6xl font-bold text-purple-600 tracking-widest" id="room-code-display">----</div>
        <p class="text-gray-600 mt-2">Share this code with your friends!</p>
      </div>

      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 class="font-bold text-gray-700 mb-3">Players in Lobby:</h3>
        <div id="players-list" class="space-y-2"></div>
      </div>

      <!-- Game Settings (Host Only) -->
      <div id="game-settings" class="bg-purple-50 rounded-lg p-4 mb-6">
        <h3 class="font-bold text-purple-900 mb-3">⚙️ Game Settings</h3>

        <div class="space-y-3">
          <label class="block">
            <span class="text-sm text-purple-800 font-medium">Sentences per Player:</span>
            <div class="flex gap-2 mt-2 flex-wrap">
              <button class="rounds-btn px-4 py-2 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition button-press" data-rounds="1">1</button>
              <button class="rounds-btn px-4 py-2 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition button-press" data-rounds="2">2</button>
              <button class="rounds-btn px-4 py-2 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition button-press" data-rounds="3">3</button>
              <input type="number" id="custom-rounds" min="1" max="10" placeholder="Custom" class="w-24 px-3 py-2 border-2 border-purple-300 rounded-lg text-center button-press" />
            </div>
          </label>

          <p class="text-xs text-purple-700">
            <span id="total-turns-preview">? total turns</span>
            (<span id="story-length-preview">? sentences</span> story)
          </p>
        </div>

        <p class="text-xs text-gray-500 mt-2">Only the host can change game settings</p>
      </div>

      <button id="start-game-btn" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition transform hover:scale-105 button-press">
        Start Game
      </button>

      <p class="text-center text-sm text-gray-500 mt-4">Waiting for host to start the game...</p>
    </div>

    <!-- Game Screen -->
    <div id="game-screen" class="hidden bg-white rounded-2xl shadow-2xl p-8 fade-in">
      <!-- Your Turn -->
      <div id="your-turn" class="hidden">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-gray-800">Your Turn!</h2>
          <p class="text-sm text-gray-500">Round <span id="turn-round">1</span>/<span id="total-rounds">1</span></p>
        </div>

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
          <button id="submit-sentence-btn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105 button-press">
            Submit
          </button>
        </div>
      </div>

      <!-- Waiting Screen -->
      <div id="waiting-turn" class="hidden text-center py-12">
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
          <button id="play-audio-btn" class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition button-press">
            🔊 Play Story
          </button>
          <button id="pause-audio-btn" class="hidden flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition button-press">
            ⏸️ Pause
          </button>
          <button id="stop-audio-btn" class="hidden flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition button-press">
            ⏹️ Stop
          </button>
          <select id="voice-selector" class="px-3 py-2 border-2 border-blue-300 rounded-lg bg-white button-press">
            <option>Select voice...</option>
          </select>
        </div>
      </div>

      <!-- Export Options -->
      <div id="export-options" class="bg-orange-50 rounded-lg p-4 mb-6 border-l-4 border-orange-500">
        <p class="text-sm text-orange-800 font-semibold mb-3">📤 Share Your Story:</p>
        <div class="grid grid-cols-2 gap-3">
          <button id="copy-clipboard-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition button-press text-sm">
            📋 Copy Text
          </button>

          <button id="download-txt-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition button-press text-sm">
            📄 Download .txt
          </button>

          <button id="download-html-btn" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition button-press text-sm">
            🎨 Download HTML
          </button>

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
  </div>

  <script>
    // WebSocket connection
    let ws = null;
    let playerId = null;
    let playerName = null;
    let roomCode = null;
    let isHost = false;
    let selectedRounds = 1;
    let sessionId = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000; // 2 seconds
    let reconnectionTimer = null;
    let isConnected = false;
    let offlinePlayers = new Set();

    // TTS variables
    let currentStory = [];
    let ttsPlaying = false;
    let currentSentenceIndex = 0;
    let selectedVoice = null;

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
      // Reconnection elements
      reconnectionBanner: document.getElementById('reconnection-banner'),
      reconnectionStatusText: document.getElementById('reconnection-status-text'),
      manualReconnectBtn: document.getElementById('manual-reconnect-btn'),
      // New elements
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
    // Manual reconnect button
    elements.manualReconnectBtn.addEventListener('click', forceReconnect);

    // Rounds selector
    document.querySelectorAll('.rounds-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        selectedRounds = parseInt(this.dataset.rounds);

        document.querySelectorAll('.rounds-btn').forEach(b => {
          b.classList.remove('bg-purple-500', 'text-white', 'border-purple-500');
          b.classList.add('bg-white', 'border-purple-300');
        });
        this.classList.add('bg-purple-500', 'text-white', 'border-purple-500');

        document.getElementById('custom-rounds').value = '';
        updateRoundsPreview();

        if (isHost) {
          ws.send(JSON.stringify({
            type: 'update_game_settings',
            roundsPerPlayer: selectedRounds,
          }));
        }
      });
    });

    document.getElementById('custom-rounds').addEventListener('change', function() {
      const customValue = parseInt(this.value);
      if (customValue >= 1 && customValue <= 10) {
        selectedRounds = customValue;

        document.querySelectorAll('.rounds-btn').forEach(b => {
          b.classList.remove('bg-purple-500', 'text-white', 'border-purple-500');
          b.classList.add('bg-white', 'border-purple-300');
        });

        updateRoundsPreview();

        if (isHost) {
          ws.send(JSON.stringify({
            type: 'update_game_settings',
            roundsPerPlayer: selectedRounds,
          }));
        }
      }
    });

    // Audio and export listeners
    elements.playAudioBtn.addEventListener('click', playStoryAudio);
    elements.pauseAudioBtn.addEventListener('click', pauseAudio);
    elements.stopAudioBtn.addEventListener('click', stopAudio);
    elements.copyClipboardBtn.addEventListener('click', copyToClipboard);
    elements.downloadTxtBtn.addEventListener('click', downloadTxt);
    elements.downloadHtmlBtn.addEventListener('click', downloadHtml);
    elements.generateLinkBtn.addEventListener('click', generateShareLink);
    elements.copyShareLinkBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(elements.shareLinkUrl.value);
      showSuccess('Link copied to clipboard!');
    });

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

    function showSuccess(message) {
      const successEl = document.createElement('div');
      successEl.className = 'fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded fade-in z-50';
      successEl.textContent = message;
      document.body.appendChild(successEl);
      setTimeout(() => {
        successEl.remove();
      }, 3000);
    }

    function showReconnectionBanner(attempt) {
      elements.reconnectionBanner.classList.remove('hidden', 'success');
      elements.reconnectionBanner.classList.add('reconnection-banner');
      elements.reconnectionStatusText.textContent = \`Reconnecting... (attempt \${attempt}/\${MAX_RECONNECT_ATTEMPTS})\`;
    }

    function hideReconnectionBanner() {
      elements.reconnectionBanner.classList.add('hidden');
    }

    function showReconnectionSuccess() {
      elements.reconnectionBanner.classList.remove('hidden');
      elements.reconnectionBanner.classList.add('success');
      elements.reconnectionStatusText.textContent = 'Reconnected!';
      setTimeout(() => {
        elements.reconnectionBanner.classList.add('hidden');
      }, 3000);
    }

    function forceReconnect() {
      if (reconnectionTimer) {
        clearTimeout(reconnectionTimer);
      }
      reconnectAttempts = 0;
      console.log('Forcing immediate reconnection...');
      connectToRoom(roomCode);
    }

    function createRoom() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      roomCode = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      isHost = true;
      selectedRounds = 1;

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
      selectedRounds = 1;

      playerName = prompt('Enter your name:') || 'Anonymous';
      connectToRoom(roomCode);
    }

    function connectToRoom(code) {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = \`\${protocol}//\${location.host}/room/\${code}\`;

      // Generate or retrieve sessionId from localStorage
      const storageKey = \`ec-session-\${code}\`;
      let storedSessionId = localStorage.getItem(storageKey);

      if (!storedSessionId) {
        // Generate new sessionId for first connection
        sessionId = crypto.randomUUID();
        localStorage.setItem(storageKey, sessionId);
      } else {
        sessionId = storedSessionId;
      }

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to room:', code);
        isConnected = true;
        reconnectAttempts = 0; // Reset attempts on successful connection
        hideReconnectionBanner();
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleMessage(message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnected = false;
        if (reconnectAttempts === 0) {
          showError('Connection error. Attempting to reconnect...');
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from room');
        isConnected = false;
        // Attempt to reconnect if game is in progress
        if (roomCode && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          showReconnectionBanner(reconnectAttempts + 1);
          reconnectionTimer = setTimeout(() => {
            console.log(\`Attempting to reconnect... (attempt \${reconnectAttempts + 1}/\${MAX_RECONNECT_ATTEMPTS})\`);
            reconnectAttempts++;
            connectToRoom(roomCode);
          }, RECONNECT_DELAY);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          showError('Failed to reconnect. Please refresh the page to try again.');
        }
      };
    }

    function handleMessage(message) {
      console.log('Received:', message);

      switch (message.type) {
        case 'connected':
          playerId = message.playerId;
          ws.send(JSON.stringify({
            type: 'join',
            playerName: playerName,
            sessionId: sessionId,
            isReconnection: !!sessionId, // Mark as reconnection if session exists
          }));
          break;

        case 'player_joined':
          roomCode = message.roomCode;
          elements.roomCodeDisplay.textContent = roomCode;
          updatePlayersList(message.players);
          showScreen('lobby');
          updateRoundsPreview(message.players.length);

          // Show settings only for host
          if (isHost) {
            elements.gameSettings.classList.remove('hidden');
          } else {
            elements.gameSettings.classList.add('hidden');
          }
          break;

        case 'game_settings_updated':
          selectedRounds = message.roundsPerPlayer;
          updateRoundsPreview();
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
          elements.totalTurns.textContent = message.totalTurns;

          if (message.roundInfo) {
            elements.turnRound.textContent = message.roundInfo.currentRound;
            elements.totalRounds.textContent = message.roundInfo.totalRounds;
          }

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

          // Show offline indicator if current player is offline
          const isCurrentPlayerOffline = message.currentPlayerId && offlinePlayers.has(message.currentPlayerId);
          const playerNameDisplay = isCurrentPlayerOffline ?
            \`<span class="text-2xl">🔌</span> \${message.currentPlayerName} <span class="text-xs bg-gray-400 text-white px-2 py-1 rounded ml-2">Offline</span>\` :
            message.currentPlayerName;

          elements.currentPlayerName.innerHTML = playerNameDisplay;
          elements.waitingTurnNumber.textContent = message.turnNumber;
          elements.waitingTotalTurns.textContent = message.totalTurns;

          if (message.roundInfo) {
            elements.waitingRound.textContent = message.roundInfo.currentRound;
            elements.waitingTotalRounds.textContent = message.roundInfo.totalRounds;
          }
          break;

        case 'game_complete':
          showScreen('results');
          displayStory(message.story);
          triggerConfetti();
          break;

        case 'tts_playback_start':
          handleTTSPlayback(message);
          break;

        case 'reconnected':
          // Handle reconnection - restore game state
          handleReconnection(message.gameState);
          break;

        case 'player_disconnected':
          // Another player disconnected - show indicator
          console.log(\`\${message.playerName} has disconnected\`);
          if (message.playerId) {
            offlinePlayers.add(message.playerId);
          }
          updatePlayersList(message.players);
          showError(\`\${message.playerName} has disconnected\`);
          break;

        case 'player_reconnected':
          // Another player reconnected
          console.log(\`\${message.playerName} has reconnected\`);
          if (message.playerId) {
            offlinePlayers.delete(message.playerId);
          }
          updatePlayersList(message.players);
          showSuccess(\`\${message.playerName} has reconnected\`);
          break;

        case 'error':
          showError(message.message);
          break;
      }
    }

    function handleReconnection(gameState) {
      // Restore game state after reconnection
      console.log('Reconnected! Restoring game state:', gameState);
      showReconnectionSuccess();

      // Update offline players set from server state
      if (gameState.offlinePlayers) {
        offlinePlayers = new Set(gameState.offlinePlayers);
      }

      if (!gameState.gameStarted) {
        // Game in lobby - show lobby screen
        showScreen('lobby');
        updatePlayersList(gameState.players);
        elements.roomCodeDisplay.textContent = gameState.roomCode;
      } else if (gameState.currentTurn) {
        // It's this player's turn
        showScreen('game');
        elements.yourTurn.classList.remove('hidden');
        elements.waitingTurn.classList.add('hidden');
        elements.sentenceInput.value = '';
        elements.sentenceInput.focus();
        elements.turnNumber.textContent = gameState.turnNumber;
        elements.totalTurns.textContent = gameState.totalTurns;

        if (gameState.roundInfo) {
          elements.turnRound.textContent = gameState.roundInfo.currentRound;
          elements.totalRounds.textContent = gameState.roundInfo.totalRounds;
        }

        if (gameState.previousSentence) {
          elements.previousSentence.textContent = gameState.previousSentence;
          elements.previousSentenceContainer.classList.remove('hidden');
          elements.firstSentenceHint.classList.add('hidden');
        } else {
          elements.previousSentenceContainer.classList.add('hidden');
          elements.firstSentenceHint.classList.remove('hidden');
        }
      } else if (gameState.gameComplete) {
        // Game complete - show results
        showScreen('results');
        displayStory(gameState.story);
      } else {
        // Waiting for another player's turn
        showScreen('game');
        elements.yourTurn.classList.add('hidden');
        elements.waitingTurn.classList.remove('hidden');

        // Show offline indicator if current player is offline
        const isCurrentPlayerOffline = gameState.currentPlayerId && offlinePlayers.has(gameState.currentPlayerId);
        const playerNameDisplay = isCurrentPlayerOffline ?
          \`<span class="text-2xl">🔌</span> \${gameState.currentPlayerName} <span class="text-xs bg-gray-400 text-white px-2 py-1 rounded ml-2">Offline</span>\` :
          gameState.currentPlayerName;

        elements.currentPlayerName.innerHTML = playerNameDisplay;
        elements.waitingTurnNumber.textContent = gameState.turnNumber;
        elements.waitingTotalTurns.textContent = gameState.totalTurns;

        if (gameState.roundInfo) {
          elements.waitingRound.textContent = gameState.roundInfo.currentRound;
          elements.waitingTotalRounds.textContent = gameState.roundInfo.totalRounds;
        }
      }
    }

    function updatePlayersList(players) {
      const isCurrentHost = players.length > 0 && players[0].id === playerId;
      isHost = isCurrentHost;

      elements.playersList.innerHTML = players.map((player, index) => {
        const isOffline = offlinePlayers.has(player.id);
        const offlineBadge = isOffline ?
          '<span class="offline-badge bg-gray-400" title="Offline">❌ Offline</span>' :
          '';

        return \`
          <div class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm \${isOffline ? 'opacity-60' : ''}">
            <div class="flex items-center gap-2">
              <span class="text-2xl">\${isOffline ? '🔌' : (index === 0 ? '👑' : '👤')}</span>
              <span class="font-medium">\${player.name}</span>
              \${offlineBadge}
            </div>
            <div class="flex gap-2">
              \${index === 0 ? '<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Host</span>' : ''}
            </div>
          </div>
        \`;
      }).join('');

      // Update rounds selector state
      const shouldEnable = isCurrentHost;
      document.querySelectorAll('.rounds-btn, #custom-rounds').forEach(el => {
        el.disabled = !shouldEnable;
        if (!shouldEnable) {
          el.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          el.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      });
    }

    function updateRoundsPreview(playerCount = null) {
      const count = playerCount || document.querySelectorAll('#players-list > div').length;
      const totalTurns = count * selectedRounds;
      document.getElementById('total-turns-preview').textContent = \`\${totalTurns} total turns\`;
      document.getElementById('story-length-preview').textContent = \`\${totalTurns} sentences\`;
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

      elements.yourTurn.classList.add('hidden');
      elements.waitingTurn.classList.remove('hidden');
    }

    function displayStory(story) {
      currentStory = story;
      elements.storyContainer.innerHTML = story.map((entry, index) => \`
        <div class="story-reveal p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500" style="animation-delay: \${index * 0.1}s">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg font-bold text-purple-600">\${index + 1}.</span>
            <span class="text-sm font-semibold text-gray-700">\${entry.playerName}</span>
            <span class="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Round \${entry.roundNumber || 1}</span>
          </div>
          <p class="text-gray-800 text-lg">\${entry.sentence}</p>
        </div>
      \`).join('');

      initializeTTS();
    }

    // TTS Functions
    function initializeTTS() {
      if (!window.speechSynthesis) {
        elements.playAudioBtn.disabled = true;
        showError('Text-to-speech not supported in this browser');
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      elements.voiceSelector.innerHTML = '<option>Select voice...</option>' +
        voices.filter(v => v.lang && v.lang.startsWith('en')).map(v =>
          \`<option value="\${v.name}">\${v.name} (\${v.lang})</option>\`
        ).join('');

      selectedVoice = voices.find(v => v.default) || voices[0];

      elements.voiceSelector.addEventListener('change', (e) => {
        selectedVoice = voices.find(v => v.name === e.target.value);
      });
    }

    function playStoryAudio() {
      if (ttsPlaying) return;

      ttsPlaying = true;
      currentSentenceIndex = 0;

      elements.playAudioBtn.classList.add('hidden');
      elements.pauseAudioBtn.classList.remove('hidden');
      elements.stopAudioBtn.classList.remove('hidden');

      ws.send(JSON.stringify({
        type: 'start_tts_playback',
        timestamp: Date.now(),
      }));
    }

    function handleTTSPlayback(message) {
      const delay = Math.max(0, message.startTime - Date.now());
      setTimeout(() => {
        speakNextSentence();
      }, delay);
    }

    function speakNextSentence() {
      if (!ttsPlaying || currentSentenceIndex >= currentStory.length) {
        stopAudio();
        return;
      }

      const sentence = currentStory[currentSentenceIndex];

      document.querySelectorAll('.story-reveal').forEach((el, idx) => {
        if (idx === currentSentenceIndex) {
          el.classList.add('ring-4', 'ring-purple-500', 'bg-purple-100');
        } else {
          el.classList.remove('ring-4', 'ring-purple-500', 'bg-purple-100');
        }
      });

      const utterance = new SpeechSynthesisUtterance(sentence.sentence);
      utterance.voice = selectedVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        currentSentenceIndex++;
        ws.send(JSON.stringify({
          type: 'tts_sentence_complete',
          sentenceIndex: currentSentenceIndex - 1,
        }));
        speakNextSentence();
      };

      utterance.onerror = (error) => {
        console.error('TTS Error:', error);
        currentSentenceIndex++;
        speakNextSentence();
      };

      window.speechSynthesis.speak(utterance);
    }

    function pauseAudio() {
      window.speechSynthesis.pause();
      elements.pauseAudioBtn.textContent = '▶️ Resume';
      elements.pauseAudioBtn.onclick = () => {
        window.speechSynthesis.resume();
        elements.pauseAudioBtn.textContent = '⏸️ Pause';
        elements.pauseAudioBtn.onclick = pauseAudio;
      };
    }

    function stopAudio() {
      window.speechSynthesis.cancel();
      ttsPlaying = false;
      currentSentenceIndex = 0;

      elements.playAudioBtn.classList.remove('hidden');
      elements.pauseAudioBtn.classList.add('hidden');
      elements.stopAudioBtn.classList.add('hidden');
      elements.pauseAudioBtn.textContent = '⏸️ Pause';
      elements.pauseAudioBtn.onclick = pauseAudio;

      document.querySelectorAll('.story-reveal').forEach(el => {
        el.classList.remove('ring-4', 'ring-purple-500', 'bg-purple-100');
      });
    }

    // Export Functions
    function formatStoryAsText() {
      let text = '=== EXQUISITE CORPSE STORY ===\\n\\n';
      currentStory.forEach((entry, index) => {
        text += \`\${index + 1}. [\${entry.playerName}] \${entry.sentence}\\n\\n\`;
      });
      text += \`\\n=== Created with Exquisite Corpse ===\\n\`;
      text += \`Generated on \${new Date().toLocaleDateString()}\`;
      return text;
    }

    function copyToClipboard() {
      const text = formatStoryAsText();
      navigator.clipboard.writeText(text).then(() => {
        showSuccess('Story copied to clipboard!');
      }).catch(err => {
        showError('Failed to copy');
      });
    }

    function downloadTxt() {
      const text = formatStoryAsText();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`exquisite-corpse-\${Date.now()}.txt\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Story downloaded!');
    }

    function formatStoryAsHTML() {
      return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exquisite Corpse Story</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
  </style>
</head>
<body class="p-8">
  <div class="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
    <h1 class="text-4xl font-bold text-center mb-2 text-gray-800">📝 Exquisite Corpse</h1>
    <p class="text-center text-gray-600 mb-8">A Collaborative Story</p>

    <div class="space-y-4 mb-8">
      \${currentStory.map((entry, index) => \`
        <div class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg font-bold text-purple-600">\${index + 1}.</span>
            <span class="text-sm font-semibold text-gray-700">\${entry.playerName}</span>
            <span class="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Round \${entry.roundNumber || 1}</span>
          </div>
          <p class="text-gray-800 text-lg">\${entry.sentence}</p>
        </div>
      \`).join('')}
    </div>

    <div class="text-center">
      <a href="/" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition inline-block">
        Create Your Own Story
      </a>
    </div>

    <div class="mt-8 text-center text-sm text-gray-500">
      <p>Created \${new Date().toLocaleDateString()}</p>
      <p class="mt-2">Made with ❤️ using Exquisite Corpse</p>
    </div>
  </div>
</body>
</html>\`;
    }

    function downloadHtml() {
      const html = formatStoryAsHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`exquisite-corpse-\${Date.now()}.html\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('HTML story downloaded!');
    }

    async function generateShareLink() {
      elements.generateLinkBtn.disabled = true;
      elements.generateLinkBtn.innerHTML = '⏳ Generating...';

      try {
        const response = await fetch('/api/share-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            story: currentStory,
            roomCode: roomCode,
            createdAt: Date.now(),
          }),
        });

        if (!response.ok) throw new Error('Failed to generate link');

        const data = await response.json();
        const shareUrl = \`\${location.origin}/story/\${data.storyId}\`;

        elements.shareLinkResult.classList.remove('hidden');
        elements.shareLinkUrl.value = shareUrl;

        showSuccess('Share link generated!');
        elements.generateLinkBtn.innerHTML = '✅ Link Created!';
        setTimeout(() => {
          elements.generateLinkBtn.disabled = false;
          elements.generateLinkBtn.innerHTML = '🔗 Share Link';
        }, 3000);

      } catch (error) {
        showError('Failed to generate share link');
        elements.generateLinkBtn.disabled = false;
        elements.generateLinkBtn.innerHTML = '🔗 Share Link';
      }
    }

    function triggerConfetti() {
      const colors = ['#7c3aed', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
      }
    }
  </script>
</body>
</html>`;

  return html;
}
