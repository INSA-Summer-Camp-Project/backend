import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",

    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],

    // Keep test files isolated from each other.
    fileParallelism: true,

    // Let Vitest choose an appropriate worker count.
    pool: "forks",

    // Timeouts
    testTimeout: 30_000,
    hookTimeout: 30_000,

    // Tests within a file run sequentially by default.
    sequence: {
      concurrent: false,
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
