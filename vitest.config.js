import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    // Only include unit tests, exclude e2e tests (run by Playwright)
    include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        isolatedStorage: true,
      },
    },
  },
});
