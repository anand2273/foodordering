import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    if (!env.VITE_API_BASE_URL) {
      throw new Error(
        "VITE_API_BASE_URL must be set for production builds — set it in " +
          "the Vercel project's Environment Variables (Production) before deploying.",
      );
    }
  }

  return {
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
  };
});
