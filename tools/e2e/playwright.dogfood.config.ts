import { defineConfig } from "@playwright/test";
// Explicit Node-only private provenance checks. The ordinary config discovers
// tests/ only and never loads this directory or starts a private-board run.
export default defineConfig({ testDir: "./dogfood", workers: 1, retries: 0, forbidOnly: true, reporter: "list" });
