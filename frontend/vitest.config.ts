import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    // Vitest's fork pool gives each file a separate child process. This keeps
    // jsdom/MUI state isolated and avoids retaining one file's DOM runtime in
    // the next file, while the CI shard keeps worker counts bounded.
    fileParallelism: true,
    // A test that fills a form types one character at a time and re-renders a
    // MUI tree on each. That is comfortably under a second on its own and
    // several seconds when the whole suite runs its files side by side, so the
    // budget is set for the loaded case rather than the quiet one.
    testTimeout: 35_000,
  },
});
