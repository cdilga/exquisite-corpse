import { GameRoom } from './GameRoom.js';
import { getHomePage } from './pages/home.js';

export { GameRoom };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route to game room Durable Object
    if (url.pathname.startsWith('/room/')) {
      const roomCode = url.pathname.split('/')[2];
      return await handleRoom(request, env, roomCode);
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
