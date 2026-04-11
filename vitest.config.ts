import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    css: false,
    setupFiles: ["./test/setup.ts"],
  },
});
