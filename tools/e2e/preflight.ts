import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Lane preflight (T-020 plan §3): runs at CONFIG LOAD — before Playwright
 * launches the webServer — so every precondition fails loudly with its
 * reason (criterion 4) instead of surfacing as a confusing downstream
 * error. Deliberately at module scope, not in a globalSetup hook:
 * Playwright starts the webServer before globalSetup runs, so a
 * globalSetup port probe would find the port taken by our own server.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
/** Repo root: tools/e2e -> tools -> root. */
export const repoRoot = path.resolve(here, "..", "..");
export const appDir = path.join(repoRoot, "app");

/**
 * The lane's dev-server port: NPUTER_E2E_PORT or 14520.
 *
 * 1420 THROWS, always: 1420 is the human's live `tauri dev` app on this
 * machine (vite.config.ts owns it). The lane runs its OWN server and
 * must never bind or contact the human's — the standing order as code.
 */
export function resolveLanePort(): number {
  const raw = process.env.NPUTER_E2E_PORT;
  const port = raw === undefined || raw === "" ? 14520 : Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `NPUTER_E2E_PORT=${JSON.stringify(raw)} is not a valid port number`,
    );
  }
  if (port === 1420) {
    throw new Error(
      "NPUTER_E2E_PORT is 1420 — refusing: 1420 is the human's live app " +
        "(app/vite.config.ts). The E2E lane always runs its own dev server " +
        "on its own port (default 14520) and never contacts 1420.",
    );
  }
  return port;
}

/** Fail-loud preconditions, each with its reason (criterion 4).
 *
 * Runs in the RUNNER process only: Playwright worker processes re-import
 * the config after the lane's own webServer is already listening, so a
 * worker-side bind probe would collide with our own server. (The 1420
 * throw in resolveLanePort still runs everywhere — it has no side
 * effects and must never be skipped.) */
export function assertLanePreconditions(port: number): void {
  if (process.env.TEST_WORKER_INDEX !== undefined) return;
  if (!existsSync(path.join(appDir, "node_modules"))) {
    throw new Error(
      "app/node_modules is missing — run `npm ci` in app/ first " +
        "(after lib/parser: see the ADR-011 build order below).",
    );
  }
  if (!existsSync(path.join(repoRoot, "lib", "parser", "dist", "pure.js"))) {
    throw new Error(
      "lib/parser/dist is missing — ADR-011 build order: lib/parser FIRST " +
        "(`npm ci` + `npm run build` from lib/parser/), then app/. The app " +
        "resolves @nputer/parser via file:../lib/parser and the dev bundle " +
        "imports its built dist/pure.js.",
    );
  }
  // Bind-and-release probe on the LANE port (never 1420 — the throw above
  // ran first). Synchronous via a child process so it can run at config
  // load; vite's strictPort would also fail loudly, but this names the
  // cause before any server spawns.
  const probe = spawnSync(
    process.execPath,
    [
      "-e",
      "const net=require('node:net');const port=Number(process.argv[1]);" +
        "const s=net.createServer();" +
        "s.on('error',(e)=>{console.error(e.code??String(e));process.exit(1);});" +
        "s.listen(port,'127.0.0.1',()=>{s.close(()=>process.exit(0));});",
      String(port),
    ],
    { encoding: "utf8" },
  );
  if (probe.status !== 0) {
    throw new Error(
      `lane port ${port} is not bindable on 127.0.0.1 ` +
        `(${(probe.stderr ?? "").trim() || "probe failed"}) — something else ` +
        "is listening. Set NPUTER_E2E_PORT to a free port (never 1420).",
    );
  }
}
