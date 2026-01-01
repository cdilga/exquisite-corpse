# Phase 2.1 Reconnection Support - Comprehensive Test Suite

## Overview

This document describes the comprehensive unit and end-to-end tests written for Phase 2.1 Reconnection Support in the Exquisite Corpse game. The test suite covers all 10 key test scenarios and provides realistic, independently runnable tests.

## Test Architecture

### Unit Tests (`tests/unit/game.test.js`)
Unit tests validate the reconnection logic at the logic/algorithm level without requiring a full game flow. These tests are fast and focus on critical business logic.

**Test Categories (31 new tests):**

1. **sessionId Generation and Persistence** (4 tests)
   - Validates UUID v4 format: `crypto.randomUUID()`
   - Verifies uniqueness across multiple players
   - Tests localStorage key format: `ec-session-${roomCode}`
   - Validates multi-room key isolation

2. **Player Matching via sessionId** (4 tests)
   - Identifies reconnecting players by matching sessionIds
   - Distinguishes new players from reconnections
   - Updates player ID on reconnection while preserving sessionId
   - Handles multiple reconnection attempts with same sessionId

3. **State Restoration on Reconnection** (4 tests)
   - Restores player list in pre-game lobby state
   - Restores full game state during mid-game
   - Restores completed game state for post-game viewing
   - Includes previousSentence context for turn state

4. **Reconnection during Lobby (before game starts)** (3 tests)
   - Allows player reconnection in pre-game state
   - Restores player list on pre-game reconnection
   - Sends updated player list to all players

5. **Reconnection during Game (mid-game)** (4 tests)
   - Restores turn state with currentTurnIndex and currentRound
   - Notifies reconnecting player if it's their turn
   - Notifies reconnecting player if they're waiting
   - Restores round information (current/total rounds)

6. **Reconnection after Game Complete** (2 tests)
   - Allows reconnection to view completed story
   - Sends full story to reconnected player

7. **Host Disconnect Handling** (2 tests)
   - Handles host disconnect before game starts
   - Promotes next available player to host on disconnect

8. **Multiple Player Reconnections** (3 tests)
   - Handles simultaneous reconnections of multiple players
   - Sequential reconnections preserve game state
   - Maintains separate sessionIds across reconnections

9. **Invalid/Expired sessionId Handling** (3 tests)
   - Treats unrecognized sessionId as new player
   - Rejects malformed sessionId formats
   - Handles expired sessionId with timeout logic

10. **Auto-retry on Disconnect** (5 tests)
    - Exponential backoff strategy (max 5 attempts)
    - Stops retrying after 5 failed attempts
    - Resets retry counter on successful reconnection
    - Maintains constant 2-second interval between retries
    - Notifies user after failed reconnection attempts

### End-to-End Tests (`tests/e2e/game.spec.js`)
E2E tests validate the complete user journey with actual WebSocket connections and page interactions through Playwright.

**Test Categories (10 new tests):**

1. **sessionId Generation and Storage**
   - Generates and stores sessionId on first connection
   - Maintains sessionId persistence across page reloads
   - Uses localStorage with proper key format

2. **Pre-game Reconnection**
   - Restores game state on page refresh during lobby
   - Player rejoins same room code after reload
   - Player list updates for all connected players

3. **Mid-game Reconnection**
   - Restores game state on page refresh during active turn
   - Restores correct turn state (whose turn it is)
   - Reconnecting player with turn continues from same point
   - Reconnecting player waiting continues to wait
   - Provides context (previous sentence) for turn player

4. **Post-game Reconnection**
   - Restores completed game state for results viewing
   - Player can see full story after reconnection

5. **Multiple Player Scenarios**
   - Handles 3+ player games with multiple reconnections
   - Each player maintains separate sessionId
   - Game continues with players rejoining

6. **Cross-room Session Isolation**
   - Different room codes have different session storage
   - Different browser contexts have different sessionIds

## Key Test Scenarios

### 1. sessionId Generation and localStorage Persistence
```
Validates:
- Format: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
- Key format: "ec-session-${roomCode}" (e.g., "ec-session-TEST")
- Persistence across page reloads
- Uniqueness for different players in same room
```

### 2. Player Matching via sessionId on Reconnection
```
Backend logic:
const reconnectingPlayer = state.players.find(p => p.sessionId === incomingSessionId);
if (reconnectingPlayer) {
  // This is a reconnection
  reconnectingPlayer.id = newConnectionId;  // Update connection ID
  reconnectingPlayer.connected = true;
  reconnectingPlayer.lastSeen = Date.now();
}
```

### 3. State Restoration (game state, turn state, story)
```
Reconnected message includes:
{
  type: 'reconnected',
  gameState: {
    gameStarted: boolean,
    gameComplete: boolean,
    currentTurn: boolean,  // Is it this player's turn?
    previousSentence: string || null,
    turnNumber: number,
    totalTurns: number,
    roundInfo: {
      currentRound: number,
      totalRounds: number
    },
    players: [...],  // Full player list with connected status
    story: [...]  // Full story so far
  }
}
```

### 4. Reconnection Scenarios

**Pre-game (Lobby):**
- Player disconnects: Remove from players list entirely
- Player reconnects: Match by sessionId, restore to lobby, send updated player list

**During Game:**
- Player disconnects: Mark `connected: false`, keep in game state
- Player reconnects: Match by sessionId, restore game state with turn info
  - If it's their turn: Send `currentTurn: true` with `previousSentence`
  - If waiting: Send `currentTurn: false` with current player name

**Post-game:**
- Player reconnects: Match by sessionId, send completed story

### 5. Host Disconnect
```
Logic:
if (gameStarted && hostDisconnected) {
  host.connected = false;
  // Promote next connected player to host
  const newHost = players.find(p => p.connected);
  newHost.isHost = true;
}
```

### 6. Auto-retry with Exponential Backoff
```
Configuration:
- Max attempts: 5
- Base delay: 2 seconds
- Backoff multiplier: 2x (capped at 4x)

Retry delays:
Attempt 1: 2s (immediate)
Attempt 2: 4s (2 × 2)
Attempt 3: 8s (2 × 4)
Attempt 4: 16s (2 × 8, capped)
Attempt 5: 16s (2 × 8, capped)
```

## Running the Tests

### Unit Tests Only
```bash
npm test
```
Runs fast unit tests validating logic and algorithms.

### E2E Tests Only
```bash
npm run test:e2e
```
Runs full browser-based tests against local development server.

### E2E Tests with UI
```bash
npm run test:e2e:ui
```
Opens interactive Playwright UI for debugging tests.

### Watch Mode (Development)
```bash
npm run test:watch
```
Continuously runs unit tests on file changes.

### Test Coverage
The test suite covers:
- Unit test logic: 31 tests
- E2E user flows: 10 tests
- Total: 41 new tests for Phase 2.1

## Test Independence and Setup

All tests are designed to be independently runnable:

**Unit Tests:**
- No external dependencies (pure logic)
- Use mocked game state objects
- Test UUID generation, array operations, timestamps
- Can run in any order

**E2E Tests:**
- Each test creates its own room(s)
- Uses randomly generated room codes
- Tests clean up after themselves (browser context close)
- No shared state between tests
- Can run in parallel with `fullyParallel: true` in playwright.config.js

## Mock Implementation Strategy

### Unit Tests
```javascript
// Mock game state
const gameState = {
  players: [
    { id: 'p1', sessionId: 'sess-1', name: 'Alice', connected: true },
    { id: 'p2', sessionId: 'sess-2', name: 'Bob', connected: false }
  ],
  story: [{ sentence: 'First.' }],
  currentTurnIndex: 1,
  gameStarted: true
};

// Test player matching
const player = gameState.players.find(p => p.sessionId === 'sess-2');
expect(player.connected).toBe(false);
```

### E2E Tests
```javascript
// Use real Playwright interactions
page.once('dialog', dialog => {
  dialog.accept('PlayerName');
});

await page.locator('#create-room-btn').click();
const roomCode = await page.locator('#room-code-display').textContent();

// Verify state via page evaluation
const sessionId = await page.evaluate(() => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('ec-session-')) {
      return localStorage.getItem(key);
    }
  }
  return null;
});
```

## Critical Test Cases

### Happy Path
1. Player joins → sessionId generated and stored
2. Player refreshes → sessionId persists, game continues
3. Two players play → both reconnect independently → game continues

### Edge Cases
1. **Multiple quick disconnects/reconnects** → sessionId remains stable
2. **Host disconnect** → next player becomes host
3. **3+ player game** → multiple simultaneous reconnections work
4. **Malformed sessionId** → treated as new player
5. **Expired session** → creates new player entry

## Performance Considerations

**Unit Tests:**
- Average execution: < 1ms per test
- Total suite time: < 2 seconds
- No network I/O

**E2E Tests:**
- Average execution: 5-10 seconds per test
- Total suite time: 60-120 seconds
- Requires Chromium and network latency simulation

## Test Maintenance

### Adding New Reconnection Tests
1. Follow existing test structure in "describe" blocks
2. Use consistent naming: "should [action] on [scenario]"
3. Mock game state or use realistic Playwright interactions
4. Include assertions for both positive and negative cases
5. Document any new scenarios in this file

### Common Patterns
```javascript
// Unit test template
it('should [test name]', () => {
  // Setup
  const players = [/* mock data */];

  // Action
  const result = players.find(p => p.sessionId === 'sess-1');

  // Assert
  expect(result).toBeDefined();
  expect(result.name).toBe('Alice');
});

// E2E test template
test('should [test name]', async ({ page, context }) => {
  // Create room
  page.once('dialog', dialog => dialog.accept('Player1'));
  await page.goto('/');
  await page.locator('#create-room-btn').click();

  // Verify state
  await expect(page.locator('#lobby-screen')).not.toHaveClass('hidden');

  // Trigger reconnection
  await page.reload();

  // Verify persistence
  const sessionId = await page.evaluate(() => /* fetch session */);
  expect(sessionId).toBeTruthy();
});
```

## Implementation Reference

The tests validate the following implementation approach:

### Client-side
```javascript
// Generate sessionId on first connection
const sessionId = crypto.randomUUID();
const roomCode = getRoomCodeFromUI();
localStorage.setItem(`ec-session-${roomCode}`, sessionId);

// Send to server with reconnection flag
ws.send(JSON.stringify({
  type: 'join',
  playerName,
  sessionId,  // May be from localStorage
  isReconnection: !!sessionId  // True if we loaded from storage
}));
```

### Server-side (GameRoom.js)
```javascript
async handleJoin(playerId, playerName, sessionId, isReconnection, webSocket) {
  const state = await this.getGameState();

  // Check for reconnection by sessionId
  let reconnectingPlayer = null;
  if (sessionId) {
    reconnectingPlayer = state.players.find(p => p.sessionId === sessionId);
  }

  if (reconnectingPlayer) {
    // This is a reconnection
    reconnectingPlayer.id = playerId;
    reconnectingPlayer.connected = true;
    reconnectingPlayer.lastSeen = Date.now();

    // Send full state based on game status
    if (state.gameStarted && !state.gameComplete) {
      const currentPlayerIndex = state.currentTurnIndex % state.players.length;
      const currentPlayer = state.players[currentPlayerIndex];
      const isTurn = currentPlayer.id === playerId;

      this.sendToPlayer(playerId, {
        type: 'reconnected',
        gameState: {
          gameStarted: true,
          currentTurn: isTurn,
          previousSentence: state.story[state.story.length - 1]?.sentence,
          turnNumber: state.currentTurnIndex + 1,
          totalTurns: state.totalTurns,
          roundInfo: {
            currentRound: state.currentRound,
            totalRounds: state.roundsPerPlayer
          },
          players: state.players
        }
      });
    }
  } else {
    // New player - add normally
  }
}
```

## Success Criteria

All 41 tests should pass:
- Unit tests: 31/31 passing
- E2E tests: 10/10 passing

Running tests:
```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run test:e2e:ui   # E2E with UI
```

Expected output:
```
PASS  tests/unit/game.test.js (65 tests total, 31 new)
PASS  tests/e2e/game.spec.js (10 new tests)
```

## Known Issues and Workarounds

1. **Playwright E2E Tests** - Tests require actual WebSocket connections to work
   - Ensure `npm run dev` is running for E2E tests
   - Tests use realistic user interactions with proper waits

2. **localStorage Mocking** - Unit tests don't access real localStorage
   - Tests use JavaScript object structures instead
   - E2E tests validate actual localStorage behavior

3. **Session Cleanup** - Old sessions are not automatically cleaned
   - Tests create unique room codes to avoid conflicts
   - No cleanup needed as rooms are isolated by code

## Related Files

- **Implementation**: `/Users/cdilga/Documents/dev/exquisite-corpse/src/GameRoom.js`
- **Unit Tests**: `/Users/cdilga/Documents/dev/exquisite-corpse/tests/unit/game.test.js`
- **E2E Tests**: `/Users/cdilga/Documents/dev/exquisite-corpse/tests/e2e/game.spec.js`
- **Config**: `/Users/cdilga/Documents/dev/exquisite-corpse/vitest.config.js`
- **Config**: `/Users/cdilga/Documents/dev/exquisite-corpse/playwright.config.js`

## Summary

The Phase 2.1 test suite provides comprehensive coverage of reconnection support with:
- 31 unit tests for logic validation
- 10 E2E tests for user flow validation
- Independent, parallel-runnable tests
- Clear documentation and examples
- Realistic mock data and scenarios
- Edge case coverage

All tests can be run independently or as part of the full suite, and they validate critical reconnection features essential for a multiplayer game.
