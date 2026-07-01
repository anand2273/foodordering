import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/api/**/*.ts",
        "src/context/CartContext.tsx",
        "src/lib/**/*.ts",
        "src/components/Feedback.tsx",
        "src/components/MenuCard.tsx",
        "src/components/OrderCard.tsx",
      ],
      exclude: ["src/**/*.test.{ts,tsx}"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
});
