#!/usr/bin/env node
/**
 * THE ORPHAN DRILL (T-061, absorbing T-046-s1) — a shipped procedure, not
 * a transcript in somebody's verdict.
 *
 * WHAT IT PROVES. `tauri-boot-check.mjs` spawns `npm run tauri dev`
 * `detached: true` so the whole tree — npm -> tauri CLI -> cargo -> app
 * binary + vite -> esbuild — dies with one signal to the process GROUP.
 * Three of its four terminal paths do that. The fourth, `child.once
 * ("exit", …)`, is the T-040 case and every future "the app failed to
 * boot" case, and until T-061 it printed its report and exited with
 * NOTHING signalled. T-046's verifier reproduced the consequence by hand:
 * SIGKILL the tauri CLI mid-boot, denying it the chance to tear down its
 * own `beforeDevCommand`, and the check exits 1 with a perfectly legible
 * report while leaving a live vite listener and an orphaned esbuild
 * helper. On the DEFAULT path that listener is on 1420 — the human's
 * port, and the thing this gate exists to protect.
 *
 * So this drill reproduces exactly that, and asserts the group is empty
 * afterwards.
 *
 * HOW TO RUN IT (from tools/e2e/, and never without the port):
 *
 *     SUPERTASKR_BOOT_PORT=<free scratch port> npm run boot:orphan-drill
 *
 * Exit 0  the check cleaned up — no member of its process group survived.
 * Exit 1  THE LEAK: members survived. They are named, and then reaped by
 *         this drill, because a drill that deliberately manufactures an
 *         orphan must not leave one behind.
 * Exit 2  called wrong — no SUPERTASKR_BOOT_PORT, or the port is busy.
 * Exit 3  THE DRILL COULD NOT RUN — the port was refused, the boot check's
 *         child could not be identified, `detached` did not produce the
 *         process group this drill's safety rests on, or the tauri CLI
 *         never appeared. Not a verdict about the check.
 *
 * THE SAFETY RULE, and it is the reason this file is long. This drill
 * SIGKILLs things beside a human's live app. EVERY signal it sends is
 * addressed either to the negated PROCESS GROUP ID it captured from the
 * boot check's own direct child, or to a pid whose PGID it has just read
 * back and compared against that same group. It never matches a process
 * by NAME alone, it never uses `pkill` or `killall`, it refuses to run on
 * 1420 at all, and it refuses any group id that is not an integer greater
 * than 1 — because `kill(-0, …)` is this process's OWN group and
 * `kill(-1, …)` is the POSIX broadcast, and in JavaScript `-0 === 0`.
 */
import { execFileSync, spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BOOT_PORT_ENV,
  BootPortRefusal,
  isSignalableGroup,
  resolveBootPort,
} from "./boot-port.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const bootCheck = path.join(here, "tauri-boot-check.mjs");

const EXIT_CLEAN = 0;
const EXIT_LEAK = 1;
const EXIT_CALLED_WRONG = 2;
const EXIT_CANNOT_RUN = 3;

/** How long to wait for vite AND the tauri CLI to both be up. */
const ARM_TIMEOUT_MS = Number(process.env.SUPERTASKR_ORPHAN_ARM_MS ?? 180_000);
/** How long to wait for the boot check to exit after the CLI is killed. */
const EXIT_TIMEOUT_MS = Number(process.env.SUPERTASKR_ORPHAN_EXIT_MS ?? 60_000);

/** @param {string} line */
const log = (line) => console.log(`[orphan-drill] ${line}`);
/** @param {number} ms @returns {Promise<void>} */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @typedef {{ pid: number, ppid: number, pgid: number, command: string }} Proc
 */

/**
 * Every process on the machine, as structured rows. Read-only, and the
 * ONLY way this drill learns about processes — nothing here greps a name
 * out of a shell pipeline.
 *
 * @returns {Proc[]}
 */
function processTable() {
  const raw = execFileSync("/bin/ps", ["-Ao", "pid=,ppid=,pgid=,command="], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  /** @type {Proc[]} */
  const rows = [];
  for (const line of raw.split("\n")) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/.exec(line);
    if (m === null) continue;
    rows.push({
      pid: Number(m[1]),
      ppid: Number(m[2]),
      pgid: Number(m[3]),
      command: /** @type {string} */ (m[4]),
    });
  }
  return rows;
}

/**
 * The members of one process group, by PGID and by nothing else.
 *
 * @param {number} pgid
 * @returns {Proc[]}
 */
function groupMembers(pgid) {
  return processTable().filter((p) => p.pgid === pgid);
}

/**
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

/**
 * Free on BOTH families — an IPv4-only probe of a v6 listener reports free
 * (CONVENTIONS, PORT RULE), and vite's `host: false` may land on either.
 *
 * @param {number} port
 * @returns {Promise<boolean>}
 */
async function portFree(port) {
  if (!(await bindable("::1", port))) return false;
  return bindable("127.0.0.1", port);
}

/**
 * Does this process group still have members? Signal 0 delivers nothing.
 *
 * @param {number} pgid
 * @returns {boolean}
 */
function groupAlive(pgid) {
  if (!isSignalableGroup(pgid)) return false;
  try {
    process.kill(-pgid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Reap a group this drill is responsible for, SIGTERM then SIGKILL, each
 * guarded by the zero-probe. Used only on the FAILING path, where the
 * drill has manufactured the orphan the check failed to clean up.
 *
 * @param {number} pgid
 * @returns {Promise<Proc[]>} whatever is still alive at the end
 */
async function reapGroup(pgid) {
  for (const signal of /** @type {NodeJS.Signals[]} */ (["SIGTERM", "SIGKILL"])) {
    if (!groupAlive(pgid)) break;
    log(`reaping process group ${pgid} with ${signal} (this drill's own mess)`);
    try {
      process.kill(-pgid, signal);
    } catch {
      /* raced us to it */
    }
    for (let i = 0; i < 40 && groupAlive(pgid); i += 1) await delay(50);
  }
  return groupMembers(pgid);
}

/** @param {Proc[]} procs @returns {string} */
const describe = (procs) =>
  procs.map((p) => `    ${p.pid} (pgid ${p.pgid}) ${p.command}`).join("\n");

async function main() {
  const raw = process.env[BOOT_PORT_ENV];
  if (raw === undefined || raw === "") {
    console.error(
      `[orphan-drill] ${BOOT_PORT_ENV} is not set. This drill deliberately ` +
        "manufactures an orphaned vite listener, so it will not run on the default " +
        "port — that port is 1420, the human's live app, and an orphan there is " +
        "the exact accident the boot check exists to prevent. Pass a free scratch " +
        "port. Nothing was probed and nothing was spawned.",
    );
    process.exit(EXIT_CALLED_WRONG);
  }
  /** @type {{ port: number, overridden: boolean }} */
  let resolved;
  try {
    resolved = resolveBootPort(raw);
  } catch (err) {
    if (!(err instanceof BootPortRefusal)) throw err;
    console.error(`[orphan-drill] REFUSED: ${err.message}`);
    process.exit(EXIT_CANNOT_RUN);
  }
  const { port } = resolved;

  if (!(await portFree(port))) {
    console.error(
      `[orphan-drill] ABORT: port ${port} is in use. The drill must own the port ` +
        "it boots on. Nothing was spawned.",
    );
    process.exit(EXIT_CALLED_WRONG);
  }

  log(`port ${port} free on both families — starting the boot check under the drill`);
  const check = spawn(process.execPath, [bootCheck], {
    env: { ...process.env, [BOOT_PORT_ENV]: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let checkOutput = "";
  /** @param {Buffer} c */
  const collect = (c) => {
    checkOutput += c.toString("utf8");
  };
  check.stdout.on("data", collect);
  check.stderr.on("data", collect);
  /** @type {Promise<{ code: number | null, signal: NodeJS.Signals | null }>} */
  const checkExited = new Promise((resolve) =>
    check.once("exit", (code, signal) => resolve({ code, signal })),
  );

  const checkPid = check.pid;
  if (typeof checkPid !== "number") {
    console.error("[orphan-drill] COULD NOT RUN: the boot check did not start.");
    process.exit(EXIT_CANNOT_RUN);
  }

  // ---- Arm: wait until the tauri CLI and vite are BOTH up in one group.
  /** @type {number | undefined} */
  let pgid;
  /** @type {Proc | undefined} */
  let cli;
  const armDeadline = Date.now() + ARM_TIMEOUT_MS;
  let checkDiedEarly = false;
  while (Date.now() < armDeadline) {
    const table = processTable();
    const spawned = table.filter((p) => p.ppid === checkPid);
    if (spawned.length === 1) {
      const npm = /** @type {Proc} */ (spawned[0]);
      // THE PROPERTY THIS DRILL'S SAFETY RESTS ON, read back rather than
      // assumed: `detached: true` is setsid(2), so the child leads a new
      // group whose id IS its pid. If that is ever untrue, every "only my
      // own group" claim below is void and the drill refuses to continue.
      if (npm.pgid !== npm.pid) {
        console.error(
          `[orphan-drill] COULD NOT RUN: the boot check's child ${npm.pid} is in ` +
            `group ${npm.pgid}, not its own. This drill signals BY GROUP and will ` +
            "not guess which processes are its own. Nothing was signalled.",
        );
        process.exit(EXIT_CANNOT_RUN);
      }
      pgid = npm.pid;
    }
    if (pgid !== undefined) {
      const members = table.filter((p) => p.pgid === pgid);
      cli = members.find((p) => /node_modules\/\.bin\/tauri(\s|$)/.test(p.command));
      const vite = members.find((p) => /node_modules\/\.bin\/vite(\s|$)/.test(p.command));
      if (cli !== undefined && vite !== undefined && !(await portFree(port))) {
        log(`group ${pgid} armed: tauri CLI ${cli.pid}, vite ${vite.pid} listening on ${port}`);
        break;
      }
      cli = undefined;
    }
    if (check.exitCode !== null || check.signalCode !== null) {
      checkDiedEarly = true;
      break;
    }
    await delay(200);
  }

  if (checkDiedEarly || cli === undefined || pgid === undefined) {
    const why = checkDiedEarly
      ? "the boot check exited before vite came up"
      : "the tauri CLI and a live vite listener never appeared together";
    console.error(
      `[orphan-drill] COULD NOT RUN: ${why}. This is not a verdict about the ` +
        `check's cleanup.\n--- boot check output ---\n${checkOutput}`,
    );
    if (pgid !== undefined && groupAlive(pgid)) await reapGroup(pgid);
    if (check.exitCode === null && check.signalCode === null) check.kill("SIGKILL");
    process.exit(EXIT_CANNOT_RUN);
  }

  // ---- Fire: SIGKILL the tauri CLI, and NOTHING else. The pid is one this
  // drill has just read back as a member of the group it captured.
  const cliMembership = groupMembers(pgid).find((p) => p.pid === cli.pid);
  if (cliMembership === undefined) {
    console.error(
      `[orphan-drill] COULD NOT RUN: pid ${cli.pid} left group ${pgid} between ` +
        "the census and the signal. Nothing was signalled.",
    );
    await reapGroup(pgid);
    process.exit(EXIT_CANNOT_RUN);
  }
  log(
    `SIGKILL the tauri CLI, pid ${cli.pid} (pgid ${cliMembership.pgid}, verified == ` +
      `${pgid}) — it gets no chance to tear down its own beforeDevCommand`,
  );
  process.kill(cli.pid, "SIGKILL");

  // ---- Observe: the check's verdict, then the group.
  /** @type {{ code: number | null, signal: NodeJS.Signals | null } | undefined} */
  let outcome;
  await Promise.race([
    checkExited.then((o) => {
      outcome = o;
    }),
    delay(EXIT_TIMEOUT_MS),
  ]);
  if (outcome === undefined) {
    console.error(
      `[orphan-drill] COULD NOT RUN: the boot check did not exit within ` +
        `${EXIT_TIMEOUT_MS} ms of the CLI being killed.\n--- boot check output ---\n` +
        checkOutput,
    );
    check.kill("SIGKILL");
    await reapGroup(pgid);
    process.exit(EXIT_CANNOT_RUN);
  }
  log(`boot check exited (code=${outcome.code ?? "null"} signal=${outcome.signal ?? "null"})`);

  const survivors = groupMembers(pgid);
  const listenerHeld = !(await portFree(port));

  if (survivors.length === 0 && !listenerHeld) {
    log(`process group ${pgid} is EMPTY and port ${port} is free on both families`);
    // The check's own transcript IS the evidence, so it is printed on the
    // passing path too rather than only when something went wrong.
    console.log(`--- boot check output ---\n${checkOutput}`);
    log("PASS: the child-exit path signalled its group before exiting");
    process.exit(EXIT_CLEAN);
  }

  console.error(
    `[orphan-drill] LEAK: the boot check exited ${outcome.code ?? "by signal"} and left ` +
      `${survivors.length} process(es) in group ${pgid}` +
      (listenerHeld ? `, with port ${port} STILL HELD` : "") +
      (survivors.length > 0 ? `:\n${describe(survivors)}` : "") +
      "\n  On the DEFAULT path that listener is on 1420 — the human's live app.",
  );
  const left = await reapGroup(pgid);
  if (left.length === 0) log(`process group ${pgid} reaped by the drill; nothing survives`);
  else console.error(`[orphan-drill] WARNING: still alive after SIGKILL:\n${describe(left)}`);
  console.error(`--- boot check output ---\n${checkOutput}`);
  process.exit(EXIT_LEAK);
}

main();
