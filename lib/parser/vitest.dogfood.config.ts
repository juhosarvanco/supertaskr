import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["dogfood/**/*.test.ts"] } });
