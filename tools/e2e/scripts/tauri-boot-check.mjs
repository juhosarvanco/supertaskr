#!/usr/bin/env node
/**
 * Tauri boot check (T-020 plan §7, the Linux half of T-001/T-003's
 * criteria): spawn `npm run tauri dev` (cwd app/), scan merged
 * stdout/stderr for BOTH startup lines —
 *
 *     [nputer] project folder:
 *     [nputer] window "main" created
 *
 * — then kill the process tree and exit 0. In CI this runs as
 * `xvfb-run -a node tools/e2e/scripts/tauri-boot-check.mjs` against
 * webkit2gtk; on macOS a real run briefly opens a window (the T-001
 * precedent — the app opening its own window is not screen control; this
 * script never injects OS input and never screenshots). It is deliberately
 * OUTSIDE `npm test` — the lane itself stays headless.
 *
 * Port discipline: `tauri dev` starts vite on 1420 (app/vite.config.ts,
 * strictPort). 1420 is the human's live app when one is running, so the
 * FIRST act is a bind-probe — bind, not connect: a failed bind exchanges
 * zero packets with whatever is listening. Busy -> abort loudly without
 * spawning anything.
 *
 * Failure modes, each loud (criterion 4):
 *   exit 2  port 1420 busy (the abort above)
 *   exit 1  overall timeout (NPUTER_BOOT_TIMEOUT_MS, default 20 min —
 *           debug cargo dominates cold builds), no-output watchdog
 *           (NPUTER_BOOT_QUIET_MS, default 5 min), spawn failure, or the
 *           child exiting before both lines — always naming which lines
 *           were and were not seen.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const appDir = path.join(repoRoot, "app");

const TAURI_PORT = 1420;
const TIMEOUT_MS = Number(process.env.NPUTER_BOOT_TIMEOUT_MS ?? 20 * 60 * 1000);
const QUIET_MS = Number(process.env.NPUTER_BOOT_QUIET_MS ?? 5 * 60 * 1000);

const NEEDLES = ["[nputer] project folder:", '[nputer] window "main" created'];

const log = (line) => console.log(`[boot-check] ${line}`);

/** Bind-probe one address; resolves true when bindable. */
function bindable(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

/** vite binds "localhost" (host: false), which may resolve to ::1 or
 * 127.0.0.1 — probe BOTH families so a live app on either is seen. */
async function port1420Free() {
  if (!(await bindable("::1", TAURI_PORT))) return false;
  return bindable("127.0.0.1", TAURI_PORT);
}

function seenReport(seen) {
  return NEEDLES.map((n) => `  ${seen.has(n) ? "SEEN " : "MISSING"}  ${n}`).join("\n");
}

async function main() {
  if (!(await port1420Free())) {
    console.error(
      "[boot-check] ABORT: port 1420 is in use — the human's live app? " +
        "The boot check must not contend for it (tauri dev owns 1420 via " +
        "app/vite.config.ts strictPort). Nothing was spawned.",
    );
    process.exit(2);
  }

  log(`port ${TAURI_PORT} free — spawning \`npm run tauri dev\` in ${appDir}`);
  log(`overall timeout ${TIMEOUT_MS} ms, no-output watchdog ${QUIET_MS} ms`);

  // detached: own process group, so the WHOLE tree (npm -> tauri CLI ->
  // cargo -> app binary + vite) dies with one group signal.
  const child = spawn("npm", ["run", "tauri", "dev"], {
    cwd: appDir,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const seen = new Set();
  let buffered = "";
  let killing = false;
  let lastOutputAt = Date.now();

  const killTree = (signal) => {
    try {
      process.kill(-child.pid, signal);
    } catch {
      try {
        child.kill(signal);
      } catch {
        /* already gone */
      }
    }
  };

  const finish = (code, message) => {
    if (killing) return;
    killing = true;
    if (message !== undefined) console.error(`[boot-check] ${message}`);
    log("stopping the tauri dev process tree (SIGTERM, then SIGKILL after 10s)");
    killTree("SIGTERM");
    const hardKill = setTimeout(() => killTree("SIGKILL"), 10_000);
    child.once("exit", (exitCode, signal) => {
      clearTimeout(hardKill);
      log(`process tree stopped (exit=${exitCode ?? "null"} signal=${signal ?? "null"})`);
      process.exit(code);
    });
  };

  const onChunk = (chunk) => {
    lastOutputAt = Date.now();
    const text = chunk.toString("utf8");
    buffered += text;
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop() ?? "";
    for (const line of lines) {
      if (line.includes("[nputer]")) log(`app: ${line.trim()}`);
      for (const needle of NEEDLES) {
        if (!seen.has(needle) && line.includes(needle)) {
          seen.add(needle);
          log(`detected startup line ${seen.size}/${NEEDLES.length}: ${needle}`);
        }
      }
    }
    if (seen.size === NEEDLES.length) {
      finish(0, undefined);
    }
  };

  child.stdout.on("data", onChunk);
  child.stderr.on("data", onChunk);

  child.once("error", (err) => {
    console.error(`[boot-check] FAILED to spawn npm run tauri dev: ${String(err)}`);
    process.exit(1);
  });

  child.once("exit", (code, signal) => {
    if (killing) return;
    killing = true;
    console.error(
      `[boot-check] tauri dev exited on its own (exit=${code ?? "null"} ` +
        `signal=${signal ?? "null"}) before both startup lines appeared:\n` +
        seenReport(seen),
    );
    process.exit(1);
  });

  const overall = setInterval(() => {
    if (Date.now() - lastOutputAt > QUIET_MS) {
      clearInterval(overall);
      finish(
        1,
        `no output for ${QUIET_MS} ms (watchdog) — startup lines so far:\n` + seenReport(seen),
      );
    }
  }, 250);
  overall.unref?.();

  setTimeout(() => {
    clearInterval(overall);
    finish(
      1,
      `timed out after ${TIMEOUT_MS} ms waiting for the startup lines:\n` + seenReport(seen),
    );
  }, TIMEOUT_MS).unref?.();
}

main();
