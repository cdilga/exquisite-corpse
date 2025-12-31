# CLAUDE.md

Welcome to your freshly-minted, auto-provisioned project! This file is your guide to understanding what you're building and how to build it with style.

## 🎯 Project Mission

**exquisite-corpse** - In this collaborative writing game, players take turns adding a sentence to a story while seeing only the previous line. The result is a disjointed, hilarious, and nonsensical masterpiece revealed at the end.

This project was summoned into existence by the mystical powers of [the-ultimate-bootstrap](https://github.com/cdilga/the-ultimate-bootstrap), which means you're already ahead of the game with automated deployments, secret management, and a Claude-powered development workflow.

## 🎭 What You're Building

### Core Requirements

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

### Technology Stack

- Default to Cloudflare stack
- Vanilla JS for simplicity
- Tailwind CSS for styling

### Deployment Target

**Platform**: Cloudflare Workers (serverless functions)

This project deploys automatically to Cloudflare when you push to `main`. The deployment pipeline is already configured and ready to roll.

### Required Features

- Database/persistence
- API endpoints
- Real-time updates

## 🛠️ Development Philosophy

**Keep it minimal, keep it working, keep it fun.**

- **Minimal**: Don't over-engineer. Build what's needed, not what might be needed someday.
- **Working**: Every commit should leave the project in a deployable state.
- **Fun**: Add personality to the code. Comments can be witty. Variable names can be descriptive AND amusing. Error messages can make people smile.

### Code Style Guidelines

1. **Clarity over cleverness**: Write code that's easy to understand, even if it's slightly verbose.
2. **Comments with character**: When you need a comment, make it helpful AND entertaining.
3. **Fail gracefully**: Error messages should be informative and maybe even slightly apologetic.
4. **Test the happy path**: Focus on making the main use case bulletproof before handling edge cases.

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run locally with Wrangler
npm run dev

# Deploy to Cloudflare
npm run deploy

# Run tests (if you've added them)
npm test
```

## 🔐 Secrets & Environment Variables

The following secrets are already configured in GitHub Actions:
- `CLOUDFLARE_API_TOKEN` - For deploying to Cloudflare Workers/Pages
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account identifier
- `CLAUDE_CODE_OAUTH_TOKEN` - For Claude Code GitHub integration


### Additional API Keys/Secrets

You may need to configure these additional secrets:

_No response_

Ask the repo owner to add these via GitHub Settings → Secrets if needed.

## 📱 Development Environment

**Mobile-Friendly Development**: This project should support mobile development. Keep the dev environment lightweight and ensure all tooling works on mobile devices.

## 🎨 Implementation Guidelines

### For Claude (that's you!)

When implementing features:

1. **Start with the skeleton**: Get the basic structure working first, then add flesh to the bones.
2. **One feature at a time**: Don't try to build everything in one commit.
3. **Deploy early, deploy often**: If it works locally, deploy it. Cloudflare deployments are fast and free.
4. **Document as you go**: Update the README with actual usage examples, not placeholder text.
5. **Make it entertaining**: This project should make people smile. Add easter eggs, fun error messages, or delightful animations.

### What "Minimal but Working" Means

- ✅ A simple UI that does the job (even if it's just clean HTML/CSS)
- ✅ Core functionality that works reliably
- ✅ Error handling for common failure cases
- ✅ Clear documentation of how to use it
- ❌ Complex state management for a simple form
- ❌ Over-abstracted code that's "ready for scale"
- ❌ Premature optimization
- ❌ Features nobody asked for

### Humor & Personality Examples

```javascript
// Good: Informative AND fun
const greetUser = (name) => {
  if (!name) {
    return "Hello, mysterious stranger!";
  }
  return `Hello, ${name}! Ready to do something amazing?`;
};

// Also good: Error messages with character
throw new Error("Oops! That API key seems to be on vacation. Please provide a valid one.");

// Perfect: Comments that make you smile
// This function does the impossible: it makes sense of user input
function parseUserWishes(input) {
  // TODO: Add telepathy support
}
```

## 🧪 Testing Strategy

This project comes with a complete testing setup:

### Unit Tests (Vitest + Cloudflare Workers Pool)
Run unit tests with the Cloudflare Workers runtime:
```bash
npm test                # Run all unit tests
npm run test:watch      # Watch mode for development
npm run test:ui         # Interactive UI for debugging tests
```

Unit tests live in `tests/unit/` and use Vitest with `@cloudflare/vitest-pool-workers` to test your Worker code in a real Cloudflare Workers environment. This means you can test Workers-specific APIs like KV, Durable Objects, etc.

### E2E Tests (Playwright)
Run end-to-end tests against the actual deployed site:
```bash
npm run test:e2e        # Run E2E tests (starts local dev server)
npm run test:e2e:ui     # Interactive UI for debugging E2E tests
npm run test:local      # Test against local wrangler dev server
npm run test:deployed   # Test against production deployment
```

E2E tests live in `tests/e2e/` and use Playwright to test the actual HTTP endpoints. You can:
- Test against local development server (`npm run test:e2e`)
- Test against deployed production site (`npm run test:deployed`)

### Testing Guidelines
1. **Test the main feature**: Make sure the core functionality works
2. **Test error handling**: Verify graceful failure when things go wrong
3. **Test edge cases**: Only if they're likely to happen
4. **Test deployed site**: Use `npm run test:deployed` to verify production works

Don't test every possible combination of inputs unless this is mission-critical software (it's probably not).

## 📦 Deployment Pipeline

Every push to `main` triggers:
1. Automated tests (if you've written any)
2. Deployment to Cloudflare
3. URL posted in the commit status

Pull requests get preview deployments so you can test before merging.

## 🎪 Project-Specific Notes

**Project Type**: cloudflare-worker

Cloudflare Workers are serverless functions that run at the edge. Keep responses fast (under 50ms if possible) and stateless. Use KV for simple storage or Durable Objects for stateful needs.

## 🤝 Working with Claude

I'm here to help build this project! Here's how we work best together:

- **Be specific**: "Add a button" vs "Add a big red button that says 'Launch Confetti' in the top-right corner"
- **Iterate**: If you don't like something I built, just say so. No feelings will be hurt (I don't have any).
- **Ask questions**: Not sure how something works? Ask! I can explain any part of the codebase.
- **Give feedback**: "Make it funnier" or "This is too complex" are totally valid requests.

### Tools and Capabilities

I have full access to:
- **Bash commands**: Install packages (`npm install`), run tests, deploy, manage git
- **Web search**: Look up documentation, find solutions, research best practices
- **File operations**: Read, write, edit any files in the repository
- **Code intelligence**: Navigate code, find references, understand structure
- **Testing**: Run unit tests, E2E tests, and test against deployed sites
- **Deployment**: Deploy to Cloudflare, check deployment status

This means I can:
- Install dependencies and run build commands
- Search for documentation and examples online
- Run tests locally and against production
- Deploy changes and verify they work
- Research solutions to problems we encounter

## 📚 Useful Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Parent Bootstrap Repo](https://github.com/cdilga/the-ultimate-bootstrap)

## 🎉 Final Words

This project is meant to be **fun**, **functional**, and **finished quickly**. Don't overthink it. Build something cool, deploy it, and iterate if needed.

Remember: Done is better than perfect, but done AND delightful is better than both.

Now go build something awesome! 🚀
