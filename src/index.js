import { Hono } from 'hono';
import { GameRoom } from './GameRoom.js';
import { getHomePage } from './pages/home.js';
import { handleShareStory, handleViewSharedStory } from './storySharing.js';

const app = new Hono();

export { GameRoom };

// Middleware to attach environment
app.use('*', (c, next) => {
  c.env = c.env || {};
  return next();
});

// Home page
app.get('/', (c) => {
  return c.html(getHomePage());
});

// API: Share story
app.post('/api/share-story', async (c) => {
  const request = c.req.raw;
  const env = c.env;
  return handleShareStory(request, env);
});

// View shared story
app.get('/story/:storyId', async (c) => {
  const storyId = c.req.param('storyId');
  const env = c.env;
  return handleViewSharedStory(storyId, env);
});

// Game room WebSocket/HTTP endpoint
app.all('/room/:roomCode', async (c) => {
  const roomCode = c.req.param('roomCode');
  const env = c.env;
  const request = c.req.raw;

  if (!roomCode || roomCode.length !== 4) {
    return c.text('Invalid room code', 400);
  }

  // Get Durable Object ID from room code
  const id = env.GAME_ROOM.idFromName(roomCode);
  const stub = env.GAME_ROOM.get(id);

  // Forward request to Durable Object
  return stub.fetch(request);
});

// 404 handler
app.notFound((c) => {
  return c.text('Not Found', 404);
});

export default app;
