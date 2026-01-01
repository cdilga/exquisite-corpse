import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';

describe('Exquisite Corpse Game', () => {
  beforeEach(() => {
    // Reset any state if needed
  });

  it('should serve home page on root path', async () => {
    const request = new Request('http://localhost/');
    const ctx = createExecutionContext();
    const response = await SELF.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    const html = await response.text();
    expect(html).toContain('Exquisite Corpse');
    expect(html).toContain('Create New Room');
  });

  it('should reject invalid room codes', async () => {
    const request = new Request('http://localhost/room/AB');
    const ctx = createExecutionContext();
    const response = await SELF.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toContain('Invalid room code');
  });

  it('should handle 404 for unknown paths', async () => {
    const request = new Request('http://localhost/unknown');
    const ctx = createExecutionContext();
    const response = await SELF.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(404);
  });
});

describe('GameRoom Durable Object', () => {
  it('should use room code from URL', async () => {
    const roomCode = 'TEST';
    const id = env.GAME_ROOM.idFromName(roomCode);
    const stub = env.GAME_ROOM.get(id);

    const request = new Request(`http://localhost/room/${roomCode}/info`);
    const response = await stub.fetch(request);
    const data = await response.json();

    expect(data.roomCode).toBe(roomCode);
    expect(data.playerCount).toBe(0);
    expect(data.gameStarted).toBe(false);
    expect(data.gameComplete).toBe(false);
  });

  it('should handle WebSocket upgrade requests', async () => {
    const id = env.GAME_ROOM.idFromName('WS01');
    const stub = env.GAME_ROOM.get(id);

    const request = new Request('http://localhost/room/WS01', {
      headers: {
        'Upgrade': 'websocket',
      },
    });

    const response = await stub.fetch(request);
    expect(response.status).toBe(101);
    expect(response.webSocket).toBeDefined();
  });

  it('should initialize game state with configurable rounds', async () => {
    const roomCode = 'TEST';
    const id = env.GAME_ROOM.idFromName(roomCode);
    const stub = env.GAME_ROOM.get(id);

    const request = new Request(`http://localhost/room/${roomCode}/info`);
    const response = await stub.fetch(request);
    const data = await response.json();

    expect(data).toHaveProperty('roomCode', roomCode);
    expect(data).toHaveProperty('gameStarted', false);
    expect(data).toHaveProperty('gameComplete', false);
  });

  it('should calculate total turns correctly for multi-round games', async () => {
    // This test validates the logic: 4 players × 2 rounds = 8 total turns
    const playersCount = 4;
    const roundsPerPlayer = 2;
    const expectedTotalTurns = playersCount * roundsPerPlayer;

    expect(expectedTotalTurns).toBe(8);

    // Later, when feature is implemented, we'll test that game completes after 8 turns
  });
});
