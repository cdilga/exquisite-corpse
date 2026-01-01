/**
 * Story Sharing Module
 * Handles story export and sharing via KV storage
 */

/**
 * Generate a unique 8-character alphanumeric story ID
 */
function generateStoryId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Store story in KV and return share ID
 */
async function handleShareStory(request, env) {
  try {
    const data = await request.json();

    // Validate story data
    if (!data.story || !Array.isArray(data.story) || data.story.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Story must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate each story entry has required fields
    for (const entry of data.story) {
      if (!entry.playerName || !entry.sentence) {
        return new Response(
          JSON.stringify({ error: 'Each story entry must have playerName and sentence' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate unique ID
    let storyId = generateStoryId();
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness (very unlikely to collide, but be safe)
    while (attempts < maxAttempts) {
      const existing = await env.SHARED_STORIES.get(storyId);
      if (!existing) break;
      storyId = generateStoryId();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate unique story ID' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Store story in KV with 30-day TTL (2,592,000 seconds)
    const storyData = {
      id: storyId,
      story: data.story,
      roomCode: data.roomCode || 'UNKNOWN',
      createdAt: data.createdAt || Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    await env.SHARED_STORIES.put(storyId, JSON.stringify(storyData), {
      expirationTtl: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    // Return story ID and share URL
    const shareUrl = `${new URL(request.url).origin}/story/${storyId}`;

    return new Response(
      JSON.stringify({
        storyId,
        shareUrl,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sharing story:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to share story' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Retrieve and render shared story as HTML
 */
async function handleViewSharedStory(storyId, env) {
  try {
    // Get story from KV
    const storyJson = await env.SHARED_STORIES.get(storyId);

    if (!storyJson) {
      return new Response('Story not found', { status: 404 });
    }

    const storyData = JSON.parse(storyJson);

    // Generate HTML page
    const html = generateStoryHTML(storyData);

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error viewing story:', error);
    return new Response('Error retrieving story', { status: 500 });
  }
}

/**
 * Generate beautiful HTML page for shared story
 */
function generateStoryHTML(storyData) {
  const { story, createdAt } = storyData;

  const storyHTML = story
    .map(
      (entry, index) =>
        `
    <div class="story-item">
      <div class="story-meta">
        <span class="story-number">${index + 1}.</span>
        <span class="player-name">${escapeHtml(entry.playerName)}</span>
        ${entry.roundNumber ? `<span class="round-badge">Round ${entry.roundNumber}</span>` : ''}
      </div>
      <p class="story-text">${escapeHtml(entry.sentence)}</p>
    </div>
  `
    )
    .join('');

  const createdDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exquisite Corpse - Shared Story</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .story-item {
      animation: slideIn 0.6s ease-out forwards;
      opacity: 0;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .story-item:nth-child(1) { animation-delay: 0.1s; }
    .story-item:nth-child(2) { animation-delay: 0.2s; }
    .story-item:nth-child(3) { animation-delay: 0.3s; }
    .story-item:nth-child(4) { animation-delay: 0.4s; }
    .story-item:nth-child(5) { animation-delay: 0.5s; }
    .story-item:nth-child(n+6) { animation-delay: 0.6s; }

    .story-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .story-number {
      font-weight: bold;
      color: #7c3aed;
      font-size: 1.125rem;
    }

    .player-name {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .round-badge {
      font-size: 0.75rem;
      background-color: #ddd6fe;
      color: #7c3aed;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
    }

    .story-text {
      color: #1f2937;
      font-size: 1.0625rem;
      line-height: 1.6;
    }

    .story-item {
      padding: 1rem;
      background: linear-gradient(to right, #f3f0ff 0%, #faf5ff 100%);
      border-left: 4px solid #7c3aed;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  </style>
</head>
<body class="p-4 sm:p-8">
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mb-8">
      <h1 class="text-4xl sm:text-5xl font-bold text-center mb-2 text-gray-800">📝 Exquisite Corpse</h1>
      <p class="text-center text-gray-600 mb-4">A Collaborative Story</p>
      <p class="text-center text-sm text-gray-500">Created ${createdDate}</p>
    </div>

    <!-- Story Content -->
    <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 mb-8">
      <div class="space-y-4">
        ${storyHTML}
      </div>
    </div>

    <!-- Footer with Call to Action -->
    <div class="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">🎮 Ready to Create Your Own?</h2>
      <a href="/" class="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-lg transition transform hover:scale-105">
        Create Your Own Story
      </a>
      <p class="text-sm text-gray-500 mt-4">Share your hilarious stories with the world!</p>
    </div>

    <!-- Attribution -->
    <div class="text-center mt-8 text-white text-sm opacity-75">
      <p>Made with 💜 using Exquisite Corpse</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters for safe rendering
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export { generateStoryId, handleShareStory, handleViewSharedStory };
