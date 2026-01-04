# Shared Task Notes

## Completed Work (2026-01-04)

### Build & Deployment Fixed
- Fixed KV namespace parsing in GitHub Actions deploy workflow to use `wrangler kv namespace list --json` with jq parsing
- Production deployment now works correctly with proper KV namespace binding
- All E2E tests pass against production: https://exquisite-corpse.dilger.dev

### JavaScript Fixes
- Added null checks for DOM elements before attaching event listeners (was causing errors with missing elements like `manualReconnectBtn`)
- Fixed rounds button styling to use dark theme classes (`bg-red-900` instead of `bg-purple-500`)
- Multi-round games now work correctly (rounds button sends `update_game_settings` via WebSocket)

### Test Status
- Unit tests: 67 passing, 1 skipped (WebSocket behavior)
- E2E tests: 7 passing including:
  - 1-round and 2-round game flows
  - Download TXT/HTML functionality
  - Share link generation
  - TTS play button visibility

## Known Issues / Future Work
1. **Tailwind CDN warning** - Production uses tailwindcss CDN which shows a console warning. Consider using PostCSS/CLI build for production CSS.
2. **Share API latency** - The local KV simulation is slow (~18s). Production is faster but tests use 30s timeout.
3. **Missing reconnection UI** - The `manualReconnectBtn` and `reconnection-banner` elements don't exist in HTML (removed null checks work around this)

## How to Run Tests
```bash
# Unit tests
npm test

# E2E tests (starts local wrangler dev)
npm run test:e2e

# E2E against production
DEPLOYED_URL=https://exquisite-corpse.dilger.dev npx playwright test
```

## Architecture Notes
- Build system: `scripts/build.js` combines CSS/JS/HTML into `src/pages/home.generated.js`
- Always run `npm run build` before testing/deploying
- KV namespace for production is auto-created by GitHub Actions
