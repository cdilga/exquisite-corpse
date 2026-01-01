import { GameRoom } from './GameRoom.js';
import { getHomePage } from './pages/home.js';

export { GameRoom };

// Simple in-memory story storage for share links (in production, use KV)
const sharedStories = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route to game room Durable Object
    if (url.pathname.startsWith('/room/')) {
      const roomCode = url.pathname.split('/')[2];
      return await handleRoom(request, env, roomCode);
    }

    // Handle share link generation
    if (url.pathname === '/api/share-story' && request.method === 'POST') {
      return await handleShareStory(request);
    }

    // Retrieve shared story
    if (url.pathname.startsWith('/story/')) {
      const storyId = url.pathname.split('/')[2];
      return await handleRetrieveStory(storyId);
    }

    // Serve home page
    if (url.pathname === '/') {
      return new Response(getHomePage(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleRoom(request, env, roomCode) {
  if (!roomCode || roomCode.length !== 4) {
    return new Response('Invalid room code', { status: 400 });
  }

  // Get Durable Object ID from room code
  const id = env.GAME_ROOM.idFromName(roomCode);
  const stub = env.GAME_ROOM.get(id);

  // Forward request to Durable Object
  return stub.fetch(request);
}

async function handleShareStory(request) {
  try {
    const body = await request.json();
    const { story, roomCode, createdAt } = body;

    if (!story || !Array.isArray(story) || story.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid story data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique story ID
    const storyId = generateStoryId();

    // Store story (for now, in memory - in production use KV)
    sharedStories.set(storyId, {
      story,
      roomCode,
      createdAt,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return new Response(
      JSON.stringify({ storyId }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Share story error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate share link' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function handleRetrieveStory(storyId) {
  const storyData = sharedStories.get(storyId);

  if (!storyData) {
    return new Response('Story not found', { status: 404 });
  }

  // Check if story has expired
  if (storyData.expiresAt < Date.now()) {
    sharedStories.delete(storyId);
    return new Response('Story has expired', { status: 404 });
  }

  // Return HTML page with the story
  const html = generateStoryPage(storyData.story);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

function generateStoryId() {
  // Generate a unique ID for the story
  return 'story_' + Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

function generateStoryPage(story) {
  const storyHTML = story.map((entry, index) => `
    <div class="p-4 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border-l-4 border-red-600 mb-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-lg font-bold text-red-500">${index + 1}.</span>
        <span class="text-sm font-semibold text-gray-300">${entry.playerName}</span>
        <span class="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">Round ${entry.roundNumber || 1}</span>
      </div>
      <p class="text-gray-100 text-lg">${entry.sentence}</p>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exquisite Corpse Story</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #16213e 100%);
      min-height: 100vh;
      color: #e0e0e0;
    }
  </style>
</head>
<body class="p-8">
  <div class="max-w-3xl mx-auto">
    <div class="rounded-2xl shadow-2xl p-8 border-2 border-red-600 bg-gray-900">
      <h1 class="text-5xl font-bold text-center mb-2 text-red-500">📝 Exquisite Corpse</h1>
      <p class="text-center text-gray-400 mb-8 italic">A twisted tale from the depths...</p>

      <div class="space-y-3 mb-8">
        ${storyHTML}
      </div>

      <div class="text-center border-t border-red-600 pt-6">
        <a href="/" class="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition">
          Create Your Own Twisted Tale
        </a>
      </div>

      <div class="mt-8 text-center text-sm text-gray-500">
        <p>Created ${new Date().toLocaleDateString()}</p>
        <p class="mt-2">Made with ❤️ using Exquisite Corpse</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
