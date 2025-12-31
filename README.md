# Exquisite Corpse 📝

A collaborative writing game where players take turns adding sentences to a story while seeing only the previous line. The result is a hilariously disjointed masterpiece revealed at the end!

## 🌐 Live Deployment

🚀 **Production**: [https://exquisite-corpse.dilger.dev](https://exquisite-corpse.dilger.dev)

## 🎮 How to Play

1. **Create a Room**: Click "Create New Room" to start a game and get a 4-character room code
2. **Share the Code**: Give the room code to your friends (works on mobile and desktop!)
3. **Write Your Sentence**: When it's your turn, you'll see only the previous player's sentence
4. **Enjoy the Chaos**: After everyone has written, the complete story is revealed!

## ✨ Features

- **Real-time Multiplayer**: Uses WebSockets for instant updates
- **Mobile-Friendly**: Responsive design works on all devices
- **Privacy-First**: Players only see the previous sentence, not the full story
- **Simple 4-Character Room Codes**: Easy to share and remember
- **No Registration Required**: Just enter your name and play

## 🏗️ Technical Architecture

### Tech Stack

- **Cloudflare Durable Objects**: Manages game room state and WebSocket connections
- **Cloudflare Workers**: Serverless edge functions for routing
- **Vanilla JavaScript**: No frameworks, just clean WebSocket API
- **Tailwind CSS**: Utility-first CSS for responsive design

### Architecture Overview

```
┌─────────────┐
│   Browser   │──── WebSocket ───┐
└─────────────┘                  │
                                 ▼
┌─────────────┐          ┌──────────────┐
│   Browser   │──────────│   Durable    │
└─────────────┘          │    Object    │
                         │  (Game Room) │
┌─────────────┐          └──────────────┘
│   Browser   │──────────        │
└─────────────┘                  │
                                 ▼
                         ┌──────────────┐
                         │  Game State  │
                         │   Storage    │
                         └──────────────┘
```

### State Management

Each game room is a Durable Object instance that maintains:
- **Full Story Array**: Complete list of all sentences (server-side only)
- **Player List**: Names, IDs, and turn order
- **Current Turn Index**: Tracks whose turn it is
- **Game Status**: Lobby, in-progress, or complete

**Privacy Layer**: When sending turn notifications, the server only transmits the previous sentence to the next player, ensuring the "exquisite corpse" mechanic works correctly.

### WebSocket Message Types

**Client → Server:**
- `join`: Player joins with their name
- `start_game`: Host starts the game
- `submit_sentence`: Player submits their sentence

**Server → Client:**
- `connected`: Connection established, playerId assigned
- `player_joined`: Player list updated
- `game_started`: Game begins
- `your_turn`: It's your turn (includes previous sentence)
- `waiting_for_turn`: Wait for another player
- `game_complete`: Full story revealed
- `error`: Error message

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/cdilga/exquisite-corpse.git
cd exquisite-corpse

# Install dependencies
npm install

# Run locally
npm run dev

# Open http://localhost:8787
```

## 📦 Deployment

This project automatically deploys to Cloudflare Workers when you push to the `main` branch.

### Manual Deployment

```bash
# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy to beta
npm run deploy:beta
```

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests (with Cloudflare Workers runtime)
npm test

# Watch mode
npm run test:watch

# Interactive UI
npm run test:ui
```

### E2E Tests

```bash
# Run E2E tests against local server
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# Test deployed production site
npm run test:deployed
```

## 🛠️ Development

### Project Structure

```
exquisite-corpse/
├── src/
│   ├── index.js           # Worker entry point & routing
│   ├── GameRoom.js        # Durable Object for game state
│   └── pages/
│       └── home.js        # Frontend HTML/CSS/JS
├── tests/
│   ├── unit/
│   │   └── game.test.js   # Unit tests
│   └── e2e/
│       └── game.spec.js   # E2E tests
├── wrangler.toml          # Cloudflare configuration
└── package.json
```

### Key Files

- **`src/GameRoom.js`**: Durable Object class that handles WebSocket connections and game logic
- **`src/index.js`**: Worker that routes requests to Durable Objects
- **`src/pages/home.js`**: Complete frontend application (HTML/CSS/JS in one file)
- **`wrangler.toml`**: Cloudflare Workers configuration

### Environment Variables

The following secrets are configured in GitHub Actions:
- `CLOUDFLARE_API_TOKEN`: For deploying to Cloudflare
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## 🎯 Core Game Logic

### Turn-Based Privacy Implementation

The magic happens in `GameRoom.js` in the `handleSubmitSentence` function:

```javascript
// Add sentence to full story (server-side only)
state.story.push({
  playerId: playerId,
  playerName: currentPlayer.name,
  sentence: sentence.trim(),
});

// Send ONLY the previous sentence to next player
const previousSentence = state.story[state.story.length - 1].sentence;

this.sendToPlayer(nextPlayer.id, {
  type: 'your_turn',
  previousSentence: previousSentence,  // Only one sentence!
  turnNumber: state.currentTurnIndex + 1,
});
```

This ensures each player only sees the previous sentence, maintaining the "exquisite corpse" mechanic.

## 🐛 Troubleshooting

### WebSocket Connection Issues

If WebSocket connections fail locally:
1. Make sure you're using `wrangler dev` (not a simple HTTP server)
2. Check that Durable Objects are properly configured in `wrangler.toml`

### Room Code Not Working

Room codes are case-insensitive and stored using Durable Object names. Each unique code maps to a unique Durable Object instance.

## 🤝 Contributing

This is a fun project! Feel free to add features like:
- Adjustable number of rounds (multiple sentences per player)
- Room passwords for private games
- Story export/sharing functionality
- Themed prompts or story starters
- Vote for favorite sentence

## 📄 License

MIT

## 🤖 Created with Claude

This project was automatically generated and implemented using [the-ultimate-bootstrap](https://github.com/cdilga/the-ultimate-bootstrap) and Claude AI.

Built with ❤️ using Cloudflare Workers and Durable Objects.
