import { defineConfig } from "vitest/config";
import ordinary from "./vitest.config";
export default defineConfig({ ...ordinary, test: { ...ordinary.test, include: ["dogfood/**/*.test.{ts,tsx}"] } });
