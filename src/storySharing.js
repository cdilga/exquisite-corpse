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
    :root {
      --dark-bg: #0f172a;
      --dark-card: #1e293b;
      --dark-secondary: #334155;
      --crimson: #dc2626;
      --crimson-dark: #b91c1c;
      --crimson-light: #ef4444;
      --text-light: #f1f5f9;
      --text-muted: #cbd5e1;
      --border-glow: #991b1b;
    }

    body {
      background: linear-gradient(135deg, #0f172a 0%, #1a1f35 50%, #16213e 100%);
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      color: var(--text-light);
      position: relative;
    }

    /* Sinister background texture */
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

    .max-w-3xl {
      position: relative;
      z-index: 1;
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
      color: var(--crimson);
      font-size: 1.125rem;
    }

    .player-name {
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.875rem;
    }

    .round-badge {
      font-size: 0.75rem;
      background-color: rgba(220, 38, 38, 0.2);
      color: var(--crimson-light);
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid var(--border-glow);
    }

    .story-text {
      color: var(--text-light);
      font-size: 1.0625rem;
      line-height: 1.6;
    }

    .story-item {
      padding: 1rem;
      background: linear-gradient(135deg, var(--dark-card) 0%, var(--dark-secondary) 100%);
      border-left: 4px solid var(--crimson);
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .header-card, .content-card, .cta-card {
      background: linear-gradient(135deg, var(--dark-card) 0%, var(--dark-secondary) 100%);
      border: 2px solid var(--border-glow);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }

    .header-card h1 {
      background: linear-gradient(to right, var(--crimson-light), var(--crimson-dark));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-card p {
      color: var(--text-muted);
    }

    .cta-card h2 {
      color: var(--text-light);
    }

    .cta-link {
      background: linear-gradient(to right, var(--crimson) var(--crimson-dark));
      transition: all 0.3s ease;
    }

    .cta-link:hover {
      background: linear-gradient(to right, var(--crimson-dark) var(--crimson));
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);
    }

    .cta-card p {
      color: var(--text-muted);
    }

    .attribution {
      color: var(--text-muted);
      opacity: 0.75;
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
    <div class="header-card rounded-2xl p-6 sm:p-8 mb-8">
      <h1 class="text-4xl sm:text-5xl font-bold text-center mb-2">📝 Exquisite Corpse</h1>
      <p class="text-center mb-4">A Collaborative Tale Woven in Shadows</p>
      <p class="text-center text-sm">Created ${createdDate}</p>
    </div>

    <!-- Story Content -->
    <div class="content-card rounded-2xl p-6 sm:p-8 mb-8">
      <div class="space-y-4">
        ${storyHTML}
      </div>
    </div>

    <!-- Footer with Call to Action -->
    <div class="cta-card rounded-2xl p-6 sm:p-8 text-center">
      <h2 class="text-2xl font-bold mb-4">🎮 Weave Your Own Tale?</h2>
      <a href="/" class="cta-link inline-block text-white font-bold py-3 px-8 rounded-lg transition transform">
        Begin a New Story
      </a>
      <p class="mt-4">Share your twisted tales with the world!</p>
    </div>

    <!-- Attribution -->
    <div class="attribution text-center mt-8 text-sm">
      <p>Made with 🖤 using Exquisite Corpse</p>
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
