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
 * NPUTER_BOOT_PORT (T-046) moves the whole check to a scratch port so it
 * can run BESIDE that live app — the reason it guarded nothing at merge
 * time (T-020-s3: exit 2 whenever the human's app is open is not a gate;
 * T-040: the regression no other gate could see). Set it and the matching
 * `--config` overlay is threaded through to `tauri dev` — devUrl AND
 * beforeDevCommand, CLI flags only, tauri.conf.json never edited. Setting
 * it to 1420 REFUSES (scripts/boot-port.mjs): the override must never
 * become a second way to contend for the human's app.
 *
 * Failure modes, each loud (criterion 4):
 *   exit 3  NPUTER_BOOT_PORT refused — 1420, or not a port at all.
 *           Refused BEFORE anything is probed or spawned.
 *   exit 2  the port is busy (the bind-probe abort above)
 *   exit 1  overall timeout (NPUTER_BOOT_TIMEOUT_MS, default 20 min —
 *           debug cargo dominates cold builds), no-output watchdog
 *           (NPUTER_BOOT_QUIET_MS, default 5 min), spawn failure, or the
 *           child exiting before both lines — always naming which lines
 *           were and were not seen. `cargo run`'s two-binary ambiguity
 *           (T-040) lands here: the child dies before either line.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOOT_PORT_ENV,
  BootPortRefusal,
  DEFAULT_TAURI_PORT,
  EXIT_REFUSED,
  bootConfigJson,
  resolveBootPort,
  tauriDevArgs,
} from "./boot-port.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const appDir = path.join(repoRoot, "app");

const TIMEOUT_MS = Number(process.env.NPUTER_BOOT_TIMEOUT_MS ?? 20 * 60 * 1000);
const QUIET_MS = Number(process.env.NPUTER_BOOT_QUIET_MS ?? 5 * 60 * 1000);

const NEEDLES = ["[nputer] project folder:", '[nputer] window "main" created'];

/** How many trailing child-output lines a failure report carries. */
const TAIL_LINES = 40;

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
async function portFree(port) {
  if (!(await bindable("::1", port))) return false;
  return bindable("127.0.0.1", port);
}

function seenReport(seen) {
  return NEEDLES.map((n) => `  ${seen.has(n) ? "SEEN " : "MISSING"}  ${n}`).join("\n");
}

async function main() {
  // FIRST act, before any probe or spawn: resolve the port. A refused
  // override never touches the network at all — in particular, asking for
  // 1420 does not even bind-probe it.
  let resolved;
  try {
    resolved = resolveBootPort(process.env[BOOT_PORT_ENV]);
  } catch (err) {
    if (!(err instanceof BootPortRefusal)) throw err;
    console.error(`[boot-check] REFUSED: ${err.message}`);
    process.exit(EXIT_REFUSED);
  }
  const { port, overridden } = resolved;

  if (!(await portFree(port))) {
    console.error(
      port === DEFAULT_TAURI_PORT
        ? "[boot-check] ABORT: port 1420 is in use — the human's live app? " +
            "The boot check must not contend for it (tauri dev owns 1420 via " +
            "app/vite.config.ts strictPort). Nothing was spawned. " +
            `Set ${BOOT_PORT_ENV} to a free scratch port to run beside it.`
        : `[boot-check] ABORT: port ${port} (${BOOT_PORT_ENV}) is in use — the ` +
            "boot check must own the port it boots on, so it will not contend " +
            "for someone else's server. Nothing was spawned. Pick a free port.",
    );
    process.exit(2);
  }

  const args = tauriDevArgs(resolved);
  log(`port ${port} free — spawning \`npm ${args.join(" ")}\` in ${appDir}`);
  if (overridden) {
    // Loud on purpose: the overlay is the only thing standing between this
    // run and the human's 1420, so it is printed in full, not summarised.
    log(`${BOOT_PORT_ENV}=${port} — threading --config ${bootConfigJson(port)}`);
  }
  log(`overall timeout ${TIMEOUT_MS} ms, no-output watchdog ${QUIET_MS} ms`);

  // detached: own process group, so the WHOLE tree (npm -> tauri CLI ->
  // cargo -> app binary + vite) dies with one group signal.
  const child = spawn("npm", args, {
    cwd: appDir,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const seen = new Set();
  let buffered = "";
  let killing = false;
  let lastOutputAt = Date.now();
  /** Rolling tail of the child's merged output, printed on failure only. */
  const recent = [];
  const pushLine = (line) => {
    const text = line.replace(/\s+$/, "");
    if (text === "") return;
    recent.push(text);
    if (recent.length > TAIL_LINES) recent.shift();
  };

  /**
   * The child's last words, verbatim (T-046). Without this the gate can
   * only say "exited before both lines" and the integrator has to re-run
   * by hand to learn WHY — which for T-040 was one specific sentence,
   * `cargo run` refusing to choose between two binaries. A gate whose
   * failure is not legible is half a gate.
   */
  const tailReport = () => {
    // Flush the partial last line — a crashing child often dies mid-line,
    // and that line is usually the interesting one. Cleared so a second
    // (discarded) report cannot duplicate it.
    if (buffered.trim() !== "") {
      pushLine(buffered);
      buffered = "";
    }
    if (recent.length === 0) return "\n  (the child produced no output at all)";
    return (
      `\n  last ${recent.length} line(s) of \`npm run tauri dev\` output, verbatim:\n` +
      recent.map((l) => `  | ${l}`).join("\n")
    );
  };

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
      pushLine(line);
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
        seenReport(seen) +
        tailReport(),
    );
    process.exit(1);
  });

  const overall = setInterval(() => {
    if (Date.now() - lastOutputAt > QUIET_MS) {
      clearInterval(overall);
      finish(
        1,
        `no output for ${QUIET_MS} ms (watchdog) — startup lines so far:\n` +
          seenReport(seen) +
          tailReport(),
      );
    }
  }, 250);
  overall.unref?.();

  setTimeout(() => {
    clearInterval(overall);
    finish(
      1,
      `timed out after ${TIMEOUT_MS} ms waiting for the startup lines:\n` +
        seenReport(seen) +
        tailReport(),
    );
  }, TIMEOUT_MS).unref?.();
}

main();
