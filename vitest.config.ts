import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path("./"),
      "server-only": path("./tests/server-only-stub.ts"),
    },
  },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
