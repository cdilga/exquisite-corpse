# exquisite-corpse

In this collaborative writing game, players take turns adding a sentence to a story while seeing only the previous line. The result is a disjointed, hilarious, and nonsensical masterpiece revealed at the end.

## 🌐 Live Deployment

🚀 **Production**: [https://exquisite-corpse.dilger.dev](https://exquisite-corpse.dilger.dev)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/cdilga/exquisite-corpse.git
cd exquisite-corpse

# Install dependencies
npm install

# Run locally
npm run dev
```

## 📦 Deployment

This project automatically deploys to Cloudflare Workers when you push to the main branch.

### Manual Deployment
```bash
npm run deploy
```

## 🛠️ Development

### Local Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables
- `CLOUDFLARE_API_TOKEN`: Used for deployment (set in GitHub Secrets)

## 📝 Requirements

Act as a Senior Full-Stack Developer and Game Designer.
The Project: I want to build a web-based, multiplayer version of "Exquisite Corpse" (The Blind Fold Narrative).
Core Gameplay Loop:
Lobby System: A Host creates a room and receives a unique 4-character Room Code.
Multi-Device Join: Other players (on mobile or desktop) enter the Room Code to join the lobby.
Turn-Based Logic: The game manages a turn order.
Player 1 writes the first sentence.
Player 2's device updates to show only Player 1's sentence.
Player 3's device updates to show only Player 2's sentence.
The Reveal: Once all turns are complete, the full story is pushed to all connected devices simultaneously.
The Requirement: Please design the technical architecture and provide the core code structure for this application.
Specifics to Cover:
Tech Stack: Recommend a lightweight stack (e.g., Node.js with Socket.io, Python/Flask, or Firebase) that handles real-time state synchronization.
State Management: How to store the "Hidden Story" vs. the "Visible Context" on the server.
Frontend Logic: How to handle the "Waiting for Turn" screen vs. the "Input" screen.
Code Snippets: Write the core server-side logic (e.g., the socket.on('submit_sentence') handler) that manages the privacy of the previous turns.
Please start by proposing the best Tech Stack for this specific mechanic.

## 🤖 Created with Claude

This project was automatically generated using [the-ultimate-bootstrap](https://github.com/cdilga/the-ultimate-bootstrap).
