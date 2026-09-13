import { spawnSync } from "node:child_process";
import { mkdirSync, symlinkSync } from "node:fs";
import path from "node:path";

/**
 * THE STAND-IN HARNESS, SHARED BY EVERY SPEC THAT NEEDS A SESSION
 * IDENTITY (T-314-s6, sharing what T-238 wrote twice).
 *
 * ── WHY A SPEC CANNOT REST ON THE REAL ANCESTRY ──────────────────────
 * `sessionIdentity` (tools/e2e/scripts/checkout-currency.mjs) walks the
 * process table upward and answers with the nearest ancestor that IS the
 * harness. On a developer's laptop every test process has one, because
 * the suite was started from a harness; on a CI runner the chain is
 * `node <- bash <- Runner` and there is none. So a body that spawns a
 * seat verb straight from the test process measures THE MACHINE: green
 * here, and on the runner the verb answers COULD NOT RUN (exit 3) and
 * the body reds for a fact about where it ran. That is what happened —
 * CI run 34772159066, e2e shard 2, main red at 8d26c8c5, two bodies of
 * tools/e2e/tests/push-guard.spec.ts, `Expected: 0`/`Received: 3` and
 * `Expected: 1`/`Received: 3` — while the lane, the bench and the
 * closing check were all green.
 *
 * ── THE FIXTURE, AND WHY IT NEEDS NO PRODUCTION FLAG ─────────────────
 * `fakeHarness` is a SYMLINK TO THIS NODE NAMED `claude`. The
 * derivation's first arm reads the program's BASENAME, so a process
 * started through that link is a harness to it on any machine — with no
 * production switch and no environment override that could later be
 * used to silence the guard, which is the whole reason the derivation
 * reads the process table rather than a variable.
 *
 * **THE NAME IS A LITERAL HERE ON PURPOSE** (T-210): importing the
 * basename constant from the module under test would move the fixture
 * and the derivation together, and a mutant that renamed the program
 * would stay green in every body that rests on this helper. The link
 * name is stated independently, and a rename that this file does not
 * follow is a red rather than a silence.
 *
 * ── WHAT IS PARAMETERISED, AND WHY IT HAD TO BE ──────────────────────
 * These three functions were local to tools/e2e/tests/card-preflight.spec.ts
 * and read that spec's own CLI path and no-session checkout from module
 * constants, so the only way to reuse them was to copy them — and a
 * recipe in two places is two chances to disagree (T-057). Both now
 * arrive as arguments, and a caller supplies its own.
 */

/**
 * The directory entry's name — what `path.basename` of the running
 * program answers for a process started through the link.
 */
export const HARNESS_LINK_NAME = "claude";

/** A stand-in harness: a symlink to this node, named the way the real one is. */
export function fakeHarness(dir: string): string {
  mkdirSync(dir, { recursive: true });
  const link = path.join(dir, HARNESS_LINK_NAME);
  symlinkSync(process.execPath, link);
  return link;
}

/** What the stand-in harness reports back about the command it ran. */
export interface HarnessRun {
  status: number | null;
  out: string;
  err: string;
  harnessPid: number;
}

/** One call for the stand-in harness to make on the caller's behalf. */
export interface HarnessCall {
  /** The script the harness spawns — the caller's own CLI path. */
  cli: string;
  /** Its arguments. */
  args: string[];
  /** The working directory it is spawned in. */
  cwd: string;
  /** `CLAUDE_PROJECT_DIR` for the call — the caller's no-session checkout. */
  projectDir: string;
  /** Keep the harness alive this long after reporting, to hold a seat. */
  holdMs?: number;
  /** Output headroom, in bytes, for the call and for the report carrying it. */
  maxBuffer?: number;
}

/** The script a stand-in harness runs: spawn the CLI, report what it said. */
export function harnessScript(call: HarnessCall): string {
  const { cli, args, cwd, projectDir, holdMs = 0, maxBuffer } = call;
  return (
    `const {spawnSync}=require("node:child_process");` +
    `const r=spawnSync(process.execPath,${JSON.stringify([cli, ...args])},` +
    `{cwd:${JSON.stringify(cwd)},encoding:"utf8",` +
    (maxBuffer === undefined ? "" : `maxBuffer:${String(maxBuffer)},`) +
    `env:{...process.env,CLAUDE_PROJECT_DIR:${JSON.stringify(projectDir)}}});` +
    `process.stdout.write(JSON.stringify({status:r.status,out:r.stdout,err:r.stderr,harnessPid:process.pid}));` +
    (holdMs > 0 ? `setTimeout(()=>{},${String(holdMs)});` : "")
  );
}

/** Run the CLI as a child of a stand-in harness, and wait for it. */
export function underHarness(harness: string, call: HarnessCall): HarnessRun {
  const outer = spawnSync(harness, ["-e", harnessScript(call)], {
    encoding: "utf8",
    ...(call.maxBuffer === undefined ? {} : { maxBuffer: call.maxBuffer }),
  });
  const text = String(outer.stdout ?? "");
  if (text === "") throw new Error(`the stand-in harness produced nothing: ${String(outer.stderr)}`);
  return JSON.parse(text) as HarnessRun;
}
