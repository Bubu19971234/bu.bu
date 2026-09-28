import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['./src/global-setup.ts'],
    // Tests share one database; each test runs inside a rolled-back transaction.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
