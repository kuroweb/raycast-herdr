import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@raycast/api": fileURLToPath(new URL("./tests/support/raycast-api.ts", import.meta.url)),
    },
  },
});
