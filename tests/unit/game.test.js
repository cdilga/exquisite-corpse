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
  it('should generate unique room codes', async () => {
    const id1 = env.GAME_ROOM.idFromName('TEST');
    const stub1 = env.GAME_ROOM.get(id1);

    const request = new Request('http://localhost/info');
    const response = await stub1.fetch(request);
    const data = await response.json();

    expect(data.roomCode).toBeDefined();
    expect(data.roomCode.length).toBe(4);
    expect(data.playerCount).toBe(0);
    expect(data.gameStarted).toBe(false);
  });

  it('should handle WebSocket upgrade requests', async () => {
    const id = env.GAME_ROOM.idFromName('WS01');
    const stub = env.GAME_ROOM.get(id);

    const request = new Request('http://localhost/', {
      headers: {
        'Upgrade': 'websocket',
      },
    });

    const response = await stub.fetch(request);
    expect(response.status).toBe(101);
    expect(response.webSocket).toBeDefined();
  });
});
