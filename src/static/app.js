/**
 * Exquisite Corpse - Client Application
 * Collaborative storytelling game with WebSocket real-time updates
 */

// Game state
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

// DOM Elements
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
console.log('Setting up event listeners...');
console.log('Create button:', elements.createRoomBtn);

if (!elements.createRoomBtn) {
  console.error('Create room button not found!');
} else {
  elements.createRoomBtn.addEventListener('click', createRoom);
  console.log('Create room listener attached');
}

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

// Room Management Functions
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

// WebSocket Connection
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

// Message Handler
function handleMessage(message) {
  console.log('Message:', message.type, message);

  switch(message.type) {
    case 'join_success':
      playerId = message.playerId;
      isHost = message.isHost;
      displayLobby(message.players);
      console.log('Joined as', playerId, 'Host:', isHost);
      break;

    case 'player_joined':
      roomCode = message.roomCode;
      elements.roomCodeDisplay.textContent = roomCode;
      updatePlayersList(message.players);
      showScreen('lobby');

      if (message.roundsPerPlayer !== undefined) {
        selectedRounds = message.roundsPerPlayer;
      }
      updateRoundsPreview(message.players.length);

      if (isHost) {
        elements.gameSettings.classList.remove('hidden');
        document.querySelectorAll('.rounds-btn').forEach(b => {
          b.classList.remove('bg-purple-500', 'text-white', 'border-purple-500');
          b.classList.add('bg-white', 'border-purple-300');
          if (parseInt(b.dataset.rounds) === selectedRounds) {
            b.classList.add('bg-purple-500', 'text-white', 'border-purple-500');
          }
        });
      } else {
        elements.gameSettings.classList.add('hidden');
      }
      break;

    case 'game_settings_updated':
      selectedRounds = message.roundsPerPlayer;
      updateRoundsPreview();
      break;

    case 'player_left':
      displayLobby(message.players);
      showError(message.playerName + ' left the room');
      break;

    case 'game_started':
      showScreen('game');
      break;

    case 'your_turn':
      showScreen('game');
      displayYourTurn(message);
      break;

    case 'waiting_turn':
      showScreen('game');
      displayWaitingTurn(message);
      break;

    case 'story_complete':
      showScreen('results');
      displayStory(message.story);
      break;

    case 'error':
      showError(message.message);
      break;
  }
}

// Display Functions
function displayLobby(players) {
  elements.playersList.innerHTML = players.map((player, index) => `
    <div class="flex items-center justify-between p-4 bg-slate-800 rounded-lg shadow-md border border-slate-700 hover:border-red-600/50 transition">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${index === 0 ? '👑' : '👤'}</span>
        <span class="font-medium text-gray-200">${player.name}</span>
      </div>
      ${index === 0 ? '<span class="text-xs bg-red-900 text-red-200 px-2 py-1 rounded font-bold">Host</span>' : ''}
    </div>
  `).join('');

  if (isHost) {
    elements.startGameBtn.classList.remove('hidden');
  } else {
    elements.startGameBtn.classList.add('hidden');
  }
}

function displayYourTurn(data) {
  elements.yourTurn.classList.remove('hidden');
  elements.waitingTurn.classList.add('hidden');

  if (data.previousSentence) {
    elements.previousSentence.textContent = data.previousSentence;
    elements.previousSentenceContainer.classList.remove('hidden');
    elements.firstSentenceHint.classList.add('hidden');
  } else {
    elements.firstSentenceHint.classList.remove('hidden');
    elements.previousSentenceContainer.classList.add('hidden');
  }

  elements.turnNumber.textContent = data.turnNumber;
  elements.totalTurns.textContent = data.totalTurns;
  elements.turnRound.textContent = data.currentRound;
  elements.totalRounds.textContent = data.totalRounds;
  elements.sentenceInput.focus();
}

function displayWaitingTurn(data) {
  elements.yourTurn.classList.add('hidden');
  elements.waitingTurn.classList.remove('hidden');
  elements.currentPlayerName.textContent = data.currentPlayerName;
  elements.waitingTurnNumber.textContent = data.turnNumber;
  elements.waitingTotalTurns.textContent = data.totalTurns;
  elements.waitingRound.textContent = data.currentRound;
  elements.waitingTotalRounds.textContent = data.totalRounds;
}

function displayStory(story) {
  currentStory = story;
  elements.storyContainer.innerHTML = story.map((entry, index) => `
    <div class="story-reveal p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border-l-4 border-red-600 shadow-lg hover:shadow-red-900/30 transition" style="animation-delay: ${index * 0.1}s">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg font-bold text-red-500">${index + 1}.</span>
        <span class="text-sm font-semibold text-gray-300">${entry.playerName}</span>
        <span class="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">Round ${entry.roundNumber || 1}</span>
      </div>
      <p class="text-gray-100 text-lg">${entry.sentence}</p>
    </div>
  `).join('');

  initializeTTS();
}

// TTS Functions
function initializeTTS() {
  if (!window.speechSynthesis) {
    elements.playAudioBtn.disabled = true;
    showError('Text-to-speech not supported in this browser');
    return;
  }

  const populateVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;

    const englishVoices = voices.filter(v => v.lang && v.lang.startsWith('en'));
    if (englishVoices.length === 0) return;

    elements.voiceSelector.innerHTML = '<option>Select voice...</option>' +
      englishVoices.map(v =>
        `<option value="${v.name}">${v.name} (${v.lang})</option>`
      ).join('');

    selectedVoice = englishVoices.find(v => v.default) || englishVoices[0];

    elements.voiceSelector.onchange = (e) => {
      selectedVoice = voices.find(v => v.name === e.target.value) || selectedVoice;
    };
  };

  populateVoices();
  window.speechSynthesis.onvoiceschanged = populateVoices;
}

function speakNextSentence() {
  if (!ttsPlaying || currentSentenceIndex >= currentStory.length) {
    ttsPlaying = false;
    document.querySelectorAll('.story-reveal').forEach(el => {
      el.classList.remove('ring-4', 'ring-red-600', 'bg-red-900/20');
    });
    return;
  }

  const sentence = currentStory[currentSentenceIndex];

  document.querySelectorAll('.story-reveal').forEach((el, idx) => {
    if (idx === currentSentenceIndex) {
      el.classList.add('ring-4', 'ring-red-600', 'bg-red-900/20');
    } else {
      el.classList.remove('ring-4', 'ring-red-600', 'bg-red-900/20');
    }
  });

  const utterance = new SpeechSynthesisUtterance(sentence.sentence);
  utterance.voice = selectedVoice;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    currentSentenceIndex++;
    speakNextSentence();
  };

  utterance.onerror = (error) => {
    console.error('TTS Error:', error);
    currentSentenceIndex++;
    speakNextSentence();
  };

  window.speechSynthesis.speak(utterance);
}

// Game Actions
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
  ws.send(JSON.stringify({
    type: 'submit_sentence',
    sentence: sentence
  }));
  elements.sentenceInput.value = '';
}

function forceReconnect() {
  if (ws) ws.close();
  setTimeout(() => connectToRoom(roomCode), 1000);
}

// UI Helpers
function showScreen(screenName) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[screenName].classList.remove('hidden');
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.classList.remove('hidden');
  setTimeout(() => elements.errorMessage.classList.add('hidden'), 5000);
}

function showSuccess(message) {
  console.log('✅', message);
}

function updateTurnsPreview() {
  // Implementation for updating turns preview
}

function updateRoundsPreview(playerCount) {
  // Implementation for updating rounds preview
}

function updatePlayersList(players) {
  displayLobby(players);
}

// Export Functions
function formatStoryAsText() {
  let text = '=== EXQUISITE CORPSE STORY ===\n\n';
  currentStory.forEach((entry, i) => {
    text += (i + 1) + '. [' + entry.playerName + '] ' + entry.sentence + '\n\n';
  });
  text += '\n=== Created with Exquisite Corpse ===\n';
  text += 'Generated on ' + new Date().toLocaleDateString();
  return text;
}

function copyToClipboard() {
  const text = formatStoryAsText();
  navigator.clipboard.writeText(text).then(() => {
    showSuccess('Story copied to clipboard!');
  }).catch(() => {
    showError('Failed to copy to clipboard');
  });
}

function downloadTxt() {
  const text = formatStoryAsText();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exquisite-corpse-' + Date.now() + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showSuccess('Story downloaded as TXT!');
}

function formatStoryAsHTML() {
  const storyHtml = currentStory.map((entry, index) => `
    <div class="p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border-l-4 border-red-600 shadow-lg">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg font-bold text-red-500">${index + 1}.</span>
        <span class="text-sm font-semibold text-gray-300">${entry.playerName}</span>
        <span class="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">Round ${entry.roundNumber || 1}</span>
      </div>
      <p class="text-gray-100 text-lg">${entry.sentence}</p>
    </div>
  `).join('');

  // Note: SCRIPT_CLOSE_TAG is a placeholder that the build script replaces
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exquisite Corpse Story</title>
  <script src="https://cdn.tailwindcss.com">SCRIPT_CLOSE_TAG
  <style>
    body {
      background: linear-gradient(135deg, #0f172a 0%, #1a1f35 50%, #16213e 100%);
      min-height: 100vh;
      color: #f1f5f9;
    }
    body::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(139, 0, 0, 0.03) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }
  </style>
</head>
<body class="p-8">
  <div class="max-w-3xl mx-auto rounded-2xl shadow-2xl p-8 border-2 border-red-900 bg-slate-900 relative z-10">
    <h1 class="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">📝 Exquisite Corpse</h1>
    <p class="text-center text-gray-400 mb-8 italic">A twisted tale woven in darkness</p>

    <div class="space-y-4 mb-8">
      ${storyHtml}
    </div>

    <div class="text-center">
      <a href="/" class="bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold py-3 px-6 rounded-lg transition inline-block shadow-lg">
        Weave Another Tale
      </a>
    </div>

    <div class="mt-8 text-center text-sm text-gray-500">
      <p>Created ${new Date().toLocaleDateString()}</p>
      <p class="mt-2">Made with ❤️ using Exquisite Corpse</p>
    </div>
  </div>
</body>
</html>`;
}

function downloadHtml() {
  const html = formatStoryAsHTML();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exquisite-corpse-' + Date.now() + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showSuccess('Story downloaded as HTML!');
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
    const shareUrl = location.origin + '/story/' + data.storyId;

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
  const colors = ['#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#ef4444'];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
    confetti.style.boxShadow = '0 0 8px rgba(220, 38, 38, 0.6)';
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 5000);
  }
}

// Wire up export buttons
if (elements.copyClipboardBtn) {
  elements.copyClipboardBtn.addEventListener('click', copyToClipboard);
}
if (elements.downloadTxtBtn) {
  elements.downloadTxtBtn.addEventListener('click', downloadTxt);
}
if (elements.downloadHtmlBtn) {
  elements.downloadHtmlBtn.addEventListener('click', downloadHtml);
}
if (elements.generateLinkBtn) {
  elements.generateLinkBtn.addEventListener('click', generateShareLink);
}
if (elements.copyShareLinkBtn) {
  elements.copyShareLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(elements.shareLinkUrl.value);
    showSuccess('Link copied!');
  });
}
if (elements.playAudioBtn) {
  elements.playAudioBtn.addEventListener('click', () => {
    ttsPlaying = true;
    currentSentenceIndex = 0;
    speakNextSentence();
  });
}
if (elements.pauseAudioBtn) {
  elements.pauseAudioBtn.addEventListener('click', () => {
    window.speechSynthesis.pause();
  });
}
if (elements.stopAudioBtn) {
  elements.stopAudioBtn.addEventListener('click', () => {
    ttsPlaying = false;
    window.speechSynthesis.cancel();
    document.querySelectorAll('.story-reveal').forEach(el => {
      el.classList.remove('ring-4', 'ring-red-600', 'bg-red-900/20');
    });
  });
}
