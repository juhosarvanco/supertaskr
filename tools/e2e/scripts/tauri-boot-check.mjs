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
 * T-061 changes two things and nothing else about the shape.
 *   1. THE OVERLAY IS DERIVED from the committed values rather than
 *      emitted from nothing (T-046-s4): the committed `beforeDevCommand`
 *      gains the port flags, and only the PORT of the committed `devUrl`
 *      is rewritten. So a renamed or broken committed script, a dead
 *      committed host and a wrong committed scheme are all still caught;
 *      only a wrong committed PORT is masked, which is the one thing this
 *      override is entitled to change.
 *   2. THE CHILD-EXIT PATH CLEANS UP (T-046-s1). It used to print its
 *      report and exit with nothing signalled, leaving an orphaned vite
 *      listener — on the default path, on 1420. It now signals the
 *      process group CAPTURED AT SPAWN, and only while a zero-signal
 *      liveness probe on that group still succeeds. `scripts/orphan-
 *      drill.mjs` is the shipped procedure that proves it.
 *
 * Failure modes, each loud (criterion 4):
 *   exit 3  REFUSED before anything is probed or spawned: NPUTER_BOOT_PORT
 *           is 1420 or not a port at all, or the committed build config
 *           the scratch-port overlay is DERIVED from cannot be read. There
 *           is deliberately no fallback for the latter — the only value to
 *           fall back to is the committed port, and here that is 1420.
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
  isSignalableGroup,
  readCommittedBuildConfig,
  resolveBootPort,
  tauriDevArgs,
} from "./boot-port.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const appDir = path.join(repoRoot, "app");

const TIMEOUT_MS = Number(process.env.NPUTER_BOOT_TIMEOUT_MS ?? 20 * 60 * 1000);
const QUIET_MS = Number(process.env.NPUTER_BOOT_QUIET_MS ?? 5 * 60 * 1000);

/**
 * How long the CHILD-EXIT path waits for a SIGTERM'd process group to empty
 * before escalating to SIGKILL (T-061). Deliberately short: by that point
 * the check has already decided its verdict and is only cleaning up.
 * `finish()`'s own 10 s grace is UNCHANGED — that path is waiting on a live
 * child's `exit` event, this one has no event left to wait for.
 */
const ORPHAN_GRACE_MS = Number(process.env.NPUTER_BOOT_ORPHAN_GRACE_MS ?? 3000);

const NEEDLES = ["[nputer] project folder:", '[nputer] window "main" created'];

/** How many trailing child-output lines a failure report carries. */
const TAIL_LINES = 40;

/** @param {string} line */
const log = (line) => console.log(`[boot-check] ${line}`);

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Bind-probe one address; resolves true when bindable.
 *
 * @param {string} host
 * @param {number} port
 * @returns {Promise<boolean>}
 */
function bindable(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

/** vite binds "localhost" (host: false), which may resolve to ::1 or
 * 127.0.0.1 — probe BOTH families so a live app on either is seen.
 *
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function portFree(port) {
  if (!(await bindable("::1", port))) return false;
  return bindable("127.0.0.1", port);
}

/**
 * @param {Set<string>} seen
 * @returns {string}
 */
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

  // SECOND act, still before any probe or spawn: derive the overlay from
  // the COMMITTED build config (T-061, absorbing T-046-s4). Only the
  // override path needs it — the default path threads no overlay and so
  // still tests both committed keys for real. A committed config the
  // overlay cannot be derived from is refused here, with the same
  // "nothing was probed and nothing was spawned" guarantee as a refused
  // port, because the alternative — falling back to no overlay — would
  // boot this check on the COMMITTED port, which on this repository is
  // the human's 1420.
  /** @type {import("./boot-port.mjs").CommittedBuild | undefined} */
  let committed;
  /** @type {string[]} */
  let args;
  try {
    if (overridden) committed = readCommittedBuildConfig(repoRoot);
    args = tauriDevArgs(resolved, committed);
  } catch (err) {
    if (!(err instanceof BootPortRefusal)) throw err;
    console.error(`[boot-check] REFUSED: ${err.message}`);
    process.exit(EXIT_REFUSED);
  }

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

  log(`port ${port} free — spawning \`npm ${args.join(" ")}\` in ${appDir}`);
  if (overridden && committed !== undefined) {
    // Loud on purpose: the overlay is the only thing standing between this
    // run and the human's 1420, so it is printed in full, not summarised.
    log(`${BOOT_PORT_ENV}=${port} — threading --config ${bootConfigJson(port, committed)}`);
  }
  log(`overall timeout ${TIMEOUT_MS} ms, no-output watchdog ${QUIET_MS} ms`);

  // detached: own process group, so the WHOLE tree (npm -> tauri CLI ->
  // cargo -> app binary + vite) dies with one group signal.
  const child = spawn("npm", args, {
    cwd: appDir,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  /**
   * THE PGID, CAPTURED AT SPAWN (T-061, absorbing T-046-s1). `detached:
   * true` is `setsid(2)` on POSIX, which makes the child a session AND
   * process-group leader, so the group id IS the child's pid. Capturing it
   * here rather than reading `child.pid` at kill time is the whole point:
   * on the child-exit path node has already REAPED the child, and a reaped
   * pid is a pid the kernel may hand to somebody else.
   *
   * `isSignalableGroup` is the guard, and it lives in boot-port.mjs so
   * the lane can assert it: `kill(-0, …)` is this process's OWN group and
   * `kill(-1, …)` is the POSIX broadcast, neither of which may ever be one
   * typo away in the code that kills process trees beside a live app.
   *
   * @type {number | undefined}
   */
  const pgid = isSignalableGroup(child.pid) ? child.pid : undefined;
  if (pgid === undefined) {
    log("WARNING: no usable child pid — group signalling is disabled for this run");
  } else {
    log(`child pid ${pgid}; captured process group ${pgid} (detached: setsid, so pgid == pid)`);
  }

  /** @type {Set<string>} */
  const seen = new Set();
  let buffered = "";
  let killing = false;
  let lastOutputAt = Date.now();
  /**
   * Rolling tail of the child's merged output, printed on failure only.
   * @type {string[]}
   */
  const recent = [];
  /** @param {string} line */
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

  /**
   * Does the captured group still have MEMBERS? Signal 0 performs the
   * kernel's error checking and delivers nothing, so this asks the
   * question without answering it in the destructive direction.
   *
   * POSIX reserves a process-group id for as long as the group has a
   * member, so a true answer here means the id still names THIS tree even
   * though its leader has been reaped — measured on this machine: a
   * detached `sh` that forks a `sleep` and exits leaves `kill(-pgid, 0)`
   * succeeding, and it fails with ESRCH the moment the sleep is reaped.
   * A false answer means the group is empty, and an empty group is
   * precisely when the id becomes recyclable — which is why the answer is
   * "signal nothing", never "signal anyway".
   *
   * @returns {boolean}
   */
  const groupAlive = () => {
    if (pgid === undefined) return false;
    try {
      process.kill(-pgid, 0);
      return true;
    } catch {
      // ESRCH: the group is empty. EPERM: it is not ours to signal. Both
      // are answered the same way, and both answers are "do not signal".
      return false;
    }
  };

  /**
   * Signal the captured group, but ONLY while the zero-probe still says it
   * exists.
   *
   * @param {NodeJS.Signals} signal
   * @returns {boolean} whether the group was signalled
   */
  const signalGroup = (signal) => {
    if (pgid === undefined || !groupAlive()) return false;
    try {
      process.kill(-pgid, signal);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * @param {NodeJS.Signals} signal
   * @returns {boolean} whether the group was signalled
   */
  const killTree = (signal) => {
    if (signalGroup(signal)) return true;
    // The group is empty, or signalling it failed. Fall back to the child
    // HANDLE, which node addresses through its own record of the spawn: it
    // returns false once the child has been reaped rather than reaching a
    // recycled pid (measured — `child.kill()` after the `exit` event
    // returns false and signals nothing).
    try {
      child.kill(signal);
    } catch {
      /* already gone */
    }
    return false;
  };

  /**
   * THE CHILD-EXIT PATH'S CLEANUP (T-061). Three of the four terminal
   * paths reach `finish()`, which signals a group whose leader is still
   * alive. This is the fourth — the T-040 case and every future "the app
   * failed to boot" case — and until T-061 it printed its report and
   * called `process.exit(1)` with NOTHING signalled. T-046's verifier
   * reproduced the consequence: SIGKILL the tauri CLI mid-boot, denying it
   * the chance to tear down its own `beforeDevCommand`, and the check
   * exits 1 leaving a live vite listener and an orphaned esbuild helper.
   * On the DEFAULT path that listener is on 1420 — the human's port, and
   * the thing this gate exists to protect.
   *
   * The naive fix, `killTree("SIGTERM")` right here, is NOT sufficient and
   * this is the reason: by the time `exit` fires node has reaped the
   * child, so `-child.pid` names a group whose LEADER is gone, and if that
   * group is also empty the kernel is free to hand the pid to somebody
   * else. Hence `groupAlive()` first: signal only a group that still has
   * members, because a group that still has members is a group whose id is
   * still reserved.
   *
   * @returns {Promise<void>}
   */
  const reapOrphanedGroup = async () => {
    if (pgid === undefined) return;
    if (!groupAlive()) {
      log(`child process group ${pgid} is already empty — nothing to signal`);
      return;
    }
    log(
      `child process group ${pgid} still has members after the child exited — ` +
        "SIGTERM to the group (orphaned vite/esbuild is the known case)",
    );
    signalGroup("SIGTERM");
    const deadline = Date.now() + ORPHAN_GRACE_MS;
    while (Date.now() < deadline) {
      await delay(50);
      if (!groupAlive()) {
        log(`child process group ${pgid} is empty — no orphan survives this check`);
        return;
      }
    }
    log(`child process group ${pgid} outlived SIGTERM by ${ORPHAN_GRACE_MS} ms — SIGKILL`);
    signalGroup("SIGKILL");
    const hardDeadline = Date.now() + 1000;
    while (Date.now() < hardDeadline) {
      await delay(50);
      if (!groupAlive()) {
        log(`child process group ${pgid} is empty — no orphan survives this check`);
        return;
      }
    }
    console.error(
      `[boot-check] WARNING: process group ${pgid} survived SIGKILL. Survivors are ` +
        `findable with \`ps -Ao pid,pgid,command | awk '$2==${pgid}'\`.`,
    );
  };

  /**
   * @param {number} code
   * @param {string | undefined} message
   */
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

  /** @param {Buffer} chunk */
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
    // The report is byte-identical to the pre-T-061 one and is printed
    // FIRST, before any cleanup line, so the diagnosis a reader came for
    // is still the last thing on stderr's failure block.
    console.error(
      `[boot-check] tauri dev exited on its own (exit=${code ?? "null"} ` +
        `signal=${signal ?? "null"}) before both startup lines appeared:\n` +
        seenReport(seen) +
        tailReport(),
    );
    // T-061: signal the group before exiting. `void`-free on purpose —
    // the exit is INSIDE the continuation, so the process cannot leave
    // before the reap has had its say.
    reapOrphanedGroup().then(
      () => process.exit(1),
      (err) => {
        console.error(`[boot-check] WARNING: group cleanup threw: ${String(err)}`);
        process.exit(1);
      },
    );
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
