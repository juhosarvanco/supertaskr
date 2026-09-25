import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  NATIVE_CODEX_HARNESS,
  NATIVE_IDENTITY_PROBE,
  NATIVE_TRANSACTION_WAIT_MS,
  NativeCodexFinding,
  activeNativeHolds,
  collectNativeWorkspace,
  explicitResourceProblem,
  handleNativeEvent,
  nativeShellQuote,
  prepareNativeRecord,
  readNativeRecord,
  withNativeTransaction,
  writeNativeRecord,
} from "../scripts/native-codex.mjs";
import {
  RunRecordFinding,
  bindRun,
  collectRun,
  continueRun,
  observeRun,
  readReservation,
  startRun,
} from "../scripts/run-record.mjs";
import type { Assignment, RunIo, RunRecord } from "../scripts/run-record.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

const WORK = "T-915";
const AT = "2026-09-24T12:00:00.000Z";

interface NativeBench {
  dir: string;
  root: string;
  lane: string;
  scratch: string;
  base: string;
  cleanup: () => void;
}

function git(cwd: string, args: string[]): string {
  const result = spawnSync("git", ["-C", cwd, ...NO_BACKGROUND_MAINTENANCE, ...args], {
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

function bench(stem: string): NativeBench {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), `t315-${stem}-`)));
  const root = path.join(dir, "seat");
  const lane = path.join(dir, "lane");
  const scratch = path.join(dir, "scratch");
  mkdirSync(root, { recursive: true });
  mkdirSync(lane, { recursive: true });
  mkdirSync(scratch, { recursive: true });
  git(lane, ["init", "-q"]);
  git(lane, ["config", "user.email", "fixture@example.invalid"]);
  git(lane, ["config", "user.name", "fixture"]);
  writeFileSync(path.join(lane, ".gitignore"), ".supertaskr/\nignored/\ngenerated.txt\n");
  writeFileSync(path.join(lane, "allowed.txt"), "allowed\n");
  writeFileSync(path.join(lane, "outside.txt"), "outside\n");
  writeFileSync(path.join(lane, "generated.txt"), "tracked generated\n");
  git(lane, ["add", ".gitignore", "allowed.txt", "outside.txt"]);
  git(lane, ["add", "-f", "generated.txt"]);
  git(lane, ["commit", "-qm", "base"]);
  const base = git(lane, ["rev-parse", "HEAD"]);
  mkdirSync(path.join(lane, ".supertaskr"), { recursive: true });
  writeFileSync(
    path.join(lane, ".supertaskr", "lane-fence.json"),
    `${JSON.stringify(
      {
        version: 1,
        taskId: WORK,
        ref: base,
        worktree: lane,
        paths: ["allowed.txt"],
        alwaysWritable: ["docs/tasks"],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(path.join(scratch, `brief-${WORK}.txt`), `native brief for ${WORK}\n`);
  return {
    dir,
    root,
    lane,
    scratch,
    base,
    cleanup: () => {
      removeGitFixture(dir, `native-codex ${stem}`);
    },
  };
}

function assignment(b: NativeBench, sessionId = "parent-session", taskName = "/root/native"): Assignment {
  return {
    kind: "card",
    id: WORK,
    role: "executor",
    resource: b.lane,
    harness: NATIVE_CODEX_HARNESS,
    model: "gpt-5.6-sol",
    effort: "xhigh",
    base: b.base,
    brief: path.join(b.scratch, `brief-${WORK}.txt`),
    cwd: b.lane,
    deadline: "none",
    budget: "none",
    native: { taskName, sessionId, coordinatorTurnId: "turn-1", ignoredOutputs: ["ignored/allowed"] },
  };
}

function io(over: Partial<RunIo> = {}): RunIo {
  return {
    now: () => AT,
    identity: () => null,
    listening: () => false,
    git: (cwd, args) => git(cwd, args),
    ...over,
  };
}

function event(
  hook_event_name: string,
  over: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    hook_event_name,
    session_id: "parent-session",
    turn_id: "turn-1",
    agent_id: "agent-1",
    cwd: "/shared/parent/cwd",
    permission_mode: "dontAsk",
    ...over,
  };
}

function commandFor(b: NativeBench, body = "true"): string {
  return `cd -- ${nativeShellQuote(b.lane)} && ${body}`;
}

function firstOutputBeforeCompletion(
  child: ReturnType<typeof spawn>,
  completion: Promise<number | null>,
): Promise<string> {
  if (!child.stdout) throw new Error("yielded process stdout is not piped");
  return Promise.race([
    new Promise<string>((resolve, reject) => {
      child.once("error", reject);
      child.stdout?.once("data", (chunk) => resolve(String(chunk)));
    }),
    completion.then((code) => {
      throw new Error(`yielded process exited before stdout (code ${String(code)})`);
    }),
  ]);
}

const nativeModuleUrl = new URL("../scripts/native-codex.mjs", import.meta.url).href;
const callbackProcessSource = String.raw`
import { existsSync, writeFileSync } from "node:fs";
const [moduleUrl, mode, root, eventText, at, ready, release, contended, waitText] = process.argv.slice(1);
const { handleNativeEvent } = await import(moduleUrl);
const event = JSON.parse(eventText);
const waitMs = Number(waitText);
let result;
try {
  if (mode === "holder") {
    result = handleNativeEvent(root, event, { at, waitMs, onAcquired: () => {
      writeFileSync(ready, "ready\n");
      while (!existsSync(release)) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    }});
  } else {
    result = handleNativeEvent(root, event, {
      at,
      waitMs,
      onContention: () => writeFileSync(contended, "contended\n"),
    });
  }
} catch (error) {
  result = { threw: true, name: error?.name, code: error?.code, message: error?.message };
}
process.stdout.write(JSON.stringify(result));
`;
const recoveryProcessSource = String.raw`
import { existsSync, writeFileSync } from "node:fs";
const [moduleUrl, root, eventText, at, barriersText, waitText] = process.argv.slice(1);
const { handleNativeEvent } = await import(moduleUrl);
const event = JSON.parse(eventText);
const barriers = JSON.parse(barriersText);
const pause = (ready, release) => {
  if (ready) writeFileSync(ready, "ready\n");
  if (release) {
    while (!existsSync(release)) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  }
};
let result;
try {
  result = handleNativeEvent(root, event, {
    at,
    waitMs: Number(waitText),
    onDeadOwnerObserved: () => pause(barriers.deadReady, barriers.deadRelease),
    onRecoveryClaimed: () => pause(barriers.recoveryReady, barriers.recoveryRelease),
    onRecoveryChecked: () => pause(barriers.checkedReady, barriers.checkedRelease),
    onAcquired: () => pause(barriers.acquiredReady, barriers.acquiredRelease),
  });
} catch (error) {
  result = { threw: true, name: error?.name, code: error?.code, message: error?.message };
}
process.stdout.write(JSON.stringify(result));
`;
const coordinatorProcessSource = String.raw`
import { writeFileSync } from "node:fs";
const [nativeUrl, runUrl, root, attempt, at, contended] = process.argv.slice(1);
const { observeRun } = await import(runUrl);
let result;
try {
  void nativeUrl;
  const record = observeRun(root, {
    attempt,
    evidence: "RUN-DONE ok",
    at,
    transaction: { waitMs: 5000, onContention: () => writeFileSync(contended, "contended\n") },
  }).record;
  result = { state: record.state, receipts: record.native.receipts, holds: record.native.holds };
} catch (error) {
  result = { threw: true, name: error?.name, code: error?.code, message: error?.message };
}
process.stdout.write(JSON.stringify(result));
`;

function completedChild(child: ReturnType<typeof spawn>): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.once("error", reject);
    child.once("close", (code) => {
      if (code !== 0) {
        reject(new Error(`callback child exited ${String(code)}: ${stderr}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`callback child returned unreadable JSON: ${stdout}\n${stderr}\n${String(error)}`));
      }
    });
  });
}

async function waitForPath(file: string): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (!existsSync(file)) {
    if (Date.now() >= deadline) throw new Error(`timed out waiting for callback barrier ${file}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function waitForPathOrChild(
  file: string,
  childDone: Promise<Record<string, any>>,
): Promise<{ barrier: true } | { barrier: false; result: Record<string, any> }> {
  let childResult: Record<string, any> | undefined;
  let childError: unknown;
  let childSettled = false;
  void childDone.then(
    (result) => {
      childResult = result;
      childSettled = true;
    },
    (error) => {
      childError = error;
      childSettled = true;
    },
  );
  const deadline = Date.now() + 5_000;
  while (!existsSync(file)) {
    if (childSettled) {
      if (childError !== undefined) throw childError;
      return { barrier: false, result: childResult as Record<string, any> };
    }
    if (Date.now() >= deadline) throw new Error(`timed out waiting for callback barrier ${file}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return { barrier: true };
}

function callbackChild(
  mode: "holder" | "contender",
  root: string,
  nativeEvent: Record<string, unknown>,
  at: string,
  ready: string,
  release: string,
  contended: string,
  waitMs = 5_000,
): ReturnType<typeof spawn> {
  return spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      callbackProcessSource,
      nativeModuleUrl,
      mode,
      root,
      JSON.stringify(nativeEvent),
      at,
      ready,
      release,
      contended,
      String(waitMs),
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
}

function recoveryChild(
  root: string,
  nativeEvent: Record<string, unknown>,
  at: string,
  barriers: Record<string, string>,
  waitMs = 5_000,
): ReturnType<typeof spawn> {
  return spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      recoveryProcessSource,
      nativeModuleUrl,
      root,
      JSON.stringify(nativeEvent),
      at,
      JSON.stringify(barriers),
      String(waitMs),
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
}

function coordinatorChild(root: string, attempt: string, at: string, contended: string): ReturnType<typeof spawn> {
  return spawn(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      coordinatorProcessSource,
      nativeModuleUrl,
      new URL("../scripts/run-record.mjs", import.meta.url).href,
      root,
      attempt,
      at,
      contended,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
}

async function concurrentCallbacks(
  b: NativeBench,
  stem: string,
  first: Record<string, unknown>,
  second: Record<string, unknown>,
): Promise<[Record<string, any>, Record<string, any>]> {
  const ready = path.join(b.dir, `${stem}-ready`);
  const release = path.join(b.dir, `${stem}-release`);
  const contended = path.join(b.dir, `${stem}-contended`);
  const holder = callbackChild("holder", b.root, first, AT, ready, release, contended);
  const holderDone = completedChild(holder);
  const holderState = await waitForPathOrChild(ready, holderDone);
  if (!holderState.barrier) {
    throw new Error(`callback handler completed before acquiring its transaction: ${JSON.stringify(holderState.result)}`);
  }
  const contender = callbackChild(
    "contender",
    b.root,
    second,
    "2026-09-24T12:00:00.001Z",
    ready,
    release,
    contended,
  );
  const contenderDone = completedChild(contender);
  await waitForPath(contended);
  writeFileSync(release, "release\n");
  const firstResult = await holderDone;
  const secondResult = await contenderDone;
  return [firstResult, secondResult];
}

function startNative(
  b: NativeBench,
  over: { agentId?: string; sessionId?: string; taskName?: string; proveMismatch?: boolean } = {},
): RunRecord {
  const agentId = over.agentId ?? "agent-1";
  const sessionId = over.sessionId ?? "parent-session";
  const taskName = over.taskName ?? "/root/native";
  const started = startRun(b.root, {
    assignment: assignment(b, sessionId, taskName),
    at: AT,
    io: io(),
  });
  const attempt = started.record.attempt;
  expect(
    handleNativeEvent(
      b.root,
      event("SubagentStart", { agent_id: agentId, session_id: sessionId, turn_id: "turn-1" }),
      { at: "2026-09-24T12:00:01.000Z" },
    ).disposition,
  ).toBe("start-recorded");
  handleNativeEvent(
    b.root,
    event("PreToolUse", {
      agent_id: agentId,
      session_id: sessionId,
      tool_name: "Bash",
      tool_use_id: "probe-1",
      tool_input: { command: NATIVE_IDENTITY_PROBE },
    }),
    { at: "2026-09-24T12:00:02.000Z" },
  );
  handleNativeEvent(
    b.root,
    event("PostToolUse", {
      agent_id: agentId,
      session_id: sessionId,
      tool_name: "Bash",
      tool_use_id: "probe-1",
      tool_input: { command: NATIVE_IDENTITY_PROBE },
      tool_response: { output: `${agentId}\n` },
    }),
    { at: "2026-09-24T12:00:03.000Z" },
  );
  if (over.proveMismatch === true) {
    expect(() =>
      bindRun(b.root, {
        attempt,
        harnessId: `${agentId}-impostor`,
        at: "2026-09-24T12:00:03.500Z",
        io: io(),
      }),
    ).toThrow(NativeCodexFinding);
  }
  return bindRun(b.root, {
    attempt,
    harnessId: agentId,
    at: "2026-09-24T12:00:04.000Z",
    io: io(),
  });
}

test("the project hook is portable and synchronously covers the native identity, tool, stop and interrupt events", () => {
  // KILLED BY: a machine-specific bootstrap path, an asynchronous checker,
  // or omission of one lifecycle event that the bridge depends on.
  const text = readFileSync(path.join(repoRoot, ".codex", "hooks.json"), "utf8");
  const config = JSON.parse(text);
  expect(text).not.toContain("/Users/");
  expect(text).toContain("$(git rev-parse --show-toplevel)/tools/e2e/scripts/native-codex-hook.mjs");
  expect(Object.keys(config.hooks).sort()).toEqual(
    ["Interrupt", "PostToolUse", "PreToolUse", "SubagentStart", "SubagentStop", "UserPromptSubmit"].sort(),
  );
  expect(NATIVE_TRANSACTION_WAIT_MS).toBeLessThan(config.hooks.Interrupt[0].hooks[0].timeout * 1_000);
  for (const eventName of Object.keys(config.hooks)) {
    for (const group of config.hooks[eventName]) {
      for (const hook of group.hooks) expect(hook.async).not.toBe(true);
    }
  }
  const empty = mkdtempSync(path.join(os.tmpdir(), "t315-empty-seat-"));
  try {
    expect(handleNativeEvent(empty, event("PreToolUse", { agent_id: null })).disposition).toBe(
      "no-native-attempt-for-parent-session",
    );
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

test("exact callback plus completed identity probe bind one attempt, and parent session/cwd/task labels cannot route a worker event", () => {
  // KILLED BY: routing on parent session_id, cwd, task label or transcript text;
  // accepting a bind without the exact callback/probe identity tuple.
  const b = bench("exact-routing");
  try {
    const bound = startNative(b, { proveMismatch: true });
    expect(bound.native?.binding.agentId).toBe("agent-1");
    expect(bound.native?.binding.correlationMethod).toContain("callback agent_id");

    const parent = handleNativeEvent(b.root, event("PreToolUse", { agent_id: null }));
    expect(parent.disposition).toBe("parent-event-not-worker-authority");

    const missing = handleNativeEvent(
      b.root,
      event("PreToolUse", { agent_id: null, turn_id: "unrecognized-parent-turn" }),
    );
    expect(missing.disposition).toBe("missing-agent-held");

    const impostor = handleNativeEvent(
      b.root,
      event("PreToolUse", {
        agent_id: "agent-impostor",
        tool_name: "Bash",
        tool_use_id: "impostor-1",
        tool_input: { command: commandFor(b) },
      }),
    );
    expect(impostor.disposition).toBe("unknown-held");
  } finally {
    b.cleanup();
  }
});

test("an unbound child may perform only the exact identity probe and every other supported operation persists a registration hold", () => {
  // KILLED BY: allowing a writer operation before binding, accepting a
  // near-match probe, or returning a denial without persisting its hold.
  const b = bench("unbound");
  try {
    const started = startRun(b.root, { assignment: assignment(b), at: AT, io: io() });
    handleNativeEvent(b.root, event("SubagentStart"));
    const denied = handleNativeEvent(
      b.root,
      event("PreToolUse", {
        tool_name: "Bash",
        tool_use_id: "write-before-bind",
        tool_input: { command: commandFor(b, "touch allowed.txt") },
      }),
    );
    expect(denied.disposition).toBe("unbound-held");
    expect(activeNativeHolds(readNativeRecord(b.root, started.record.attempt)).map((hold: any) => hold.code)).toContain(
      "registration-pending",
    );
  } finally {
    b.cleanup();
  }
});

test("T-311 refuses a conflicting native writer reservation before spawn", () => {
  // KILLED BY: checking then writing the reservation, preparing native
  // state before admission, or exempting native writers from T-311.
  const b = bench("writer-collision");
  try {
    const first = startRun(b.root, { assignment: assignment(b), at: AT, io: io() });
    let refused: unknown;
    try {
      startRun(b.root, {
        assignment: assignment(b, "other-parent", "/root/other"),
        at: "2026-09-24T12:00:01.000Z",
        io: io(),
      });
    } catch (error) {
      refused = error;
    }
    expect(refused).toBeInstanceOf(RunRecordFinding);
    expect((refused as RunRecordFinding).code).toBe("RESOURCE_RESERVED");
    expect(readReservation(b.root, b.lane)?.attempt).toBe(first.record.attempt);
  } finally {
    b.cleanup();
  }
});

test("canonical native resource aliases share one atomic T-311 reservation", () => {
  // KILLED BY: keying reservations on a lexical path before native
  // admission canonicalizes the assigned Git root.
  const b = bench("writer-alias-collision");
  const alias = path.join(b.dir, "lane-alias");
  symlinkSync(b.lane, alias, "dir");
  try {
    const first = startRun(b.root, { assignment: assignment(b), at: AT, io: io() });
    let refused: unknown;
    try {
      startRun(b.root, {
        assignment: {
          ...assignment(b, "other-parent", "/root/other"),
          resource: alias,
          cwd: alias,
        },
        at: "2026-09-24T12:00:01.000Z",
        io: io(),
      });
    } catch (error) {
      refused = error;
    }
    expect(refused).toBeInstanceOf(RunRecordFinding);
    expect((refused as RunRecordFinding).code).toBe("RESOURCE_RESERVED");
    expect(readReservation(b.root, b.lane)?.attempt).toBe(first.record.attempt);
    expect(readReservation(b.root, alias)?.attempt).toBe(first.record.attempt);
  } finally {
    b.cleanup();
  }
});

test("two disjoint native identities route simultaneous callbacks to their own records", () => {
  // KILLED BY: a singleton current-worker slot or routing by shared cwd.
  const left = bench("disjoint-left");
  const right = bench("disjoint-right");
  try {
    const sharedRoot = left.root;
    right.root = sharedRoot;
    const one = startNative(left, { agentId: "agent-left", sessionId: "parent-session", taskName: "/root/left" });
    const two = startNative(right, { agentId: "agent-right", sessionId: "parent-session", taskName: "/root/right" });
    const beforeTwo = readNativeRecord(sharedRoot, two.attempt).native.receipts.length;
    const pre = handleNativeEvent(
      sharedRoot,
      event("PreToolUse", {
        session_id: "parent-session",
        agent_id: "agent-left",
        tool_name: "Bash",
        tool_use_id: "left-op",
        tool_input: { command: commandFor(left) },
      }),
    );
    expect(pre.disposition).toBe("pre-admitted");
    const post = handleNativeEvent(
      sharedRoot,
      event("PostToolUse", {
        session_id: "parent-session",
        agent_id: "agent-left",
        tool_name: "Bash",
        tool_use_id: "left-op",
        tool_input: { command: commandFor(left) },
        tool_response: { output: "ok" },
      }),
    );
    expect(post.disposition).toBe("post-clean");
    expect(readNativeRecord(sharedRoot, one.attempt).native.receipts).toHaveLength(1);
    expect(readNativeRecord(sharedRoot, two.attempt).native.receipts).toHaveLength(beforeTwo);
  } finally {
    left.cleanup();
    right.cleanup();
  }
});

test("separate callback processes serialize the full read-modify-write transaction and retain both completions plus a late hold", async () => {
  // KILLED BY: locking only atomic rename or publishing either callback's
  // stale pre-transaction snapshot after the other callback completes.
  const b = bench("callback-transaction");
  try {
    const bound = startNative(b);
    const firstPre = event("PreToolUse", {
      tool_name: "Bash",
      tool_use_id: "parallel-a",
      tool_input: { command: commandFor(b) },
    });
    const secondPre = event("PreToolUse", {
      tool_name: "Bash",
      tool_use_id: "parallel-b",
      tool_input: { command: commandFor(b) },
    });
    const [preA, preB] = await concurrentCallbacks(b, "pre", firstPre, secondPre);
    expect([preA.disposition, preB.disposition]).toEqual(["pre-admitted", "pre-admitted"]);
    expect(readNativeRecord(b.root, bound.attempt).native.inflight.map((entry: any) => entry.toolUseId).sort()).toEqual([
      "parallel-a",
      "parallel-b",
    ]);

    writeFileSync(path.join(b.lane, "late.tmp"), "late\n");
    const firstPost = event("PostToolUse", {
      tool_name: "Bash",
      tool_use_id: "parallel-a",
      tool_input: { command: commandFor(b) },
      tool_response: { output: "a" },
    });
    const secondPost = event("PostToolUse", {
      tool_name: "Bash",
      tool_use_id: "parallel-b",
      tool_input: { command: commandFor(b) },
      tool_response: { output: "b" },
    });
    const [postA, postB] = await concurrentCallbacks(b, "post", firstPost, secondPost);
    expect([postA.disposition, postB.disposition]).toEqual(["post-held", "post-held"]);
    const final = readNativeRecord(b.root, bound.attempt);
    expect(final.native.inflight).toEqual([]);
    expect(final.native.receipts.map((receipt: any) => receipt.pre.toolUseId).sort()).toEqual([
      "parallel-a",
      "parallel-b",
    ]);
    expect(activeNativeHolds(final)).toContainEqual(
      expect.objectContaining({
        code: "cumulative-check-failed",
        findings: expect.arrayContaining([expect.objectContaining({ path: "late.tmp" })]),
      }),
    );
  } finally {
    b.cleanup();
  }
});

test("a competing coordinator observation cannot publish a stale lifecycle record over a callback completion", async () => {
  // KILLED BY: serializing event writers while leaving coordinator
  // observe/reconcile outside the same transaction protocol.
  const b = bench("callback-versus-observe");
  try {
    const bound = startNative(b);
    const pre = handleNativeEvent(
      b.root,
      event("PreToolUse", {
        tool_name: "Bash",
        tool_use_id: "callback-before-observe",
        tool_input: { command: commandFor(b) },
      }),
    );
    expect(pre.disposition).toBe("pre-admitted");
    writeFileSync(path.join(b.lane, "late.tmp"), "late\n");

    const ready = path.join(b.dir, "observe-ready");
    const release = path.join(b.dir, "observe-release");
    const ignored = path.join(b.dir, "observe-holder-contended");
    const callback = callbackChild(
      "holder",
      b.root,
      event("PostToolUse", {
        tool_name: "Bash",
        tool_use_id: "callback-before-observe",
        tool_input: { command: commandFor(b) },
        tool_response: { output: "done" },
      }),
      AT,
      ready,
      release,
      ignored,
    );
    const callbackDone = completedChild(callback);
    const callbackState = await waitForPathOrChild(ready, callbackDone);
    if (!callbackState.barrier) {
      throw new Error(`callback handler completed before acquiring its transaction: ${JSON.stringify(callbackState.result)}`);
    }
    const coordinatorContended = path.join(b.dir, "observe-contended");
    const coordinator = coordinatorChild(
      b.root,
      bound.attempt,
      "2026-09-24T12:00:01.000Z",
      coordinatorContended,
    );
    const coordinatorDone = completedChild(coordinator);
    const coordinatorState = await waitForPathOrChild(coordinatorContended, coordinatorDone);
    writeFileSync(release, "release\n");
    expect((await callbackDone).disposition).toBe("post-held");
    expect(coordinatorState.barrier, "coordinator observe completed without entering transaction contention").toBe(true);
    const observed = coordinatorState.barrier ? await coordinatorDone : coordinatorState.result;
    expect(observed.state).toBe("finished");

    const final = readNativeRecord(b.root, bound.attempt);
    expect(final.state).toBe("finished");
    expect(final.native.inflight).toEqual([]);
    expect(final.native.receipts).toContainEqual(
      expect.objectContaining({ pre: expect.objectContaining({ toolUseId: "callback-before-observe" }) }),
    );
    expect(activeNativeHolds(final)).toContainEqual(
      expect.objectContaining({
        code: "cumulative-check-failed",
        findings: expect.arrayContaining([expect.objectContaining({ path: "late.tmp" })]),
      }),
    );
    expect(readReservation(b.root, b.lane)?.attempt).toBe(bound.attempt);
  } finally {
    b.cleanup();
  }
});

test("transaction contention is bounded and durable, and exception cleanup releases ownership", async () => {
  // KILLED BY: last-writer-wins contention evidence, time-based lock theft,
  // clearing an unknown transaction refusal at collection, or leaking a lock
  // when a transaction body throws.
  const b = bench("transaction-lifecycle");
  try {
    const bound = startNative(b);
    const ready = path.join(b.dir, "contention-ready");
    const release = path.join(b.dir, "contention-release");
    const holderContended = path.join(b.dir, "holder-contended");
    const holder = callbackChild(
      "holder",
      b.root,
      event("SubagentStop"),
      AT,
      ready,
      release,
      holderContended,
      5_000,
    );
    const holderDone = completedChild(holder);
    await waitForPath(ready);

    const contenderOnePath = path.join(b.dir, "contender-one");
    const contenderTwoPath = path.join(b.dir, "contender-two");
    const refusedEvent = event("PreToolUse", {
      tool_name: "Bash",
      tool_use_id: "refused-by-lock",
      tool_input: { command: commandFor(b) },
    });
    const contenderOne = callbackChild(
      "contender",
      b.root,
      refusedEvent,
      "2026-09-24T12:00:00.010Z",
      ready,
      release,
      contenderOnePath,
      80,
    );
    const contenderOneDone = completedChild(contenderOne);
    await waitForPath(contenderOnePath);
    const contenderTwo = callbackChild(
      "contender",
      b.root,
      refusedEvent,
      "2026-09-24T12:00:00.020Z",
      ready,
      release,
      contenderTwoPath,
      80,
    );
    const contenderTwoDone = completedChild(contenderTwo);
    await waitForPath(contenderTwoPath);
    const refusalOne = await contenderOneDone;
    const refusalTwo = await contenderTwoDone;
    const refusalDir = path.join(
      b.root,
      ".supertaskr",
      "runs",
      "reservations",
      "native-transaction-refusals",
    );
    const refusalNamesBeforeRelease = readdirSync(refusalDir).filter((name) => name.endsWith(".json"));
    const recordFile = path.join(b.root, ".supertaskr", "runs", WORK, `${bound.attempt}.json`);
    const readableRecord = readFileSync(recordFile, "utf8");
    writeFileSync(recordFile, "{ interrupted absorption\n");
    writeFileSync(release, "release\n");
    const holderResult = await holderDone;
    expect([refusalOne.code, refusalTwo.code]).toEqual(["NATIVE_TRANSACTION_BUSY", "NATIVE_TRANSACTION_BUSY"]);
    expect(holderResult.threw).toBe(true);
    expect(refusalNamesBeforeRelease).toHaveLength(2);
    expect(readdirSync(refusalDir).filter((name) => name.endsWith(".json")).sort()).toEqual(
      refusalNamesBeforeRelease.sort(),
    );

    writeFileSync(recordFile, readableRecord);
    expect(
      handleNativeEvent(b.root, {
        ...refusedEvent,
        tool_use_id: "after-contention",
      }).disposition,
    ).toBe("held-before-tool");
    expect(readdirSync(refusalDir).filter((name) => name.endsWith(".json"))).toEqual([]);
    expect(activeNativeHolds(readNativeRecord(b.root, bound.attempt)).filter((hold: any) => hold.code === "native-transaction-refusal")).toHaveLength(2);

    const terminal = observeRun(b.root, {
      attempt: bound.attempt,
      evidence: "RUN-DONE ok",
      at: "2026-09-24T12:00:01.000Z",
      io: io(),
    }).record;
    expect(terminal.state).toBe("finished");
    expect(readReservation(b.root, b.lane)?.attempt).toBe(bound.attempt);
    expect(() =>
      collectRun(b.root, {
        attempt: bound.attempt,
        ref: b.base,
        at: "2026-09-24T12:00:02.000Z",
        io: io(),
      }),
    ).toThrow(NativeCodexFinding);

    expect(
      withNativeTransaction(b.root, { operation: "fixture-nested-outer", waitMs: 100 }, () =>
        withNativeTransaction(b.root, { operation: "fixture-nested-inner", waitMs: 100 }, () => "nested"),
      ),
    ).toBe("nested");
    expect(() =>
      withNativeTransaction(b.root, { operation: "fixture-throws", waitMs: 100 }, () => {
        throw new Error("fixture transaction failure");
      }),
    ).toThrow("fixture transaction failure");
    expect(withNativeTransaction(b.root, { operation: "fixture-after-throw", waitMs: 100 }, () => "released")).toBe(
      "released",
    );

  } finally {
    b.cleanup();
  }
});

test("two dead-owner reclaimers cannot remove a successor lock after observing stale ownership", async () => {
  // KILLED BY: revalidating the dead PID without excluding a successor,
  // or renaming/removing the lock pathname from a stale owner snapshot.
  const b = bench("transaction-recovery-race");
  const emergencyReleases: string[] = [];
  const children: ReturnType<typeof spawn>[] = [];
  try {
    const bound = startNative(b);
    const dead = spawn(process.execPath, ["-e", ""]);
    const deadPid = dead.pid;
    await new Promise<void>((resolve, reject) => {
      dead.once("error", reject);
      dead.once("close", () => resolve());
    });
    if (deadPid === undefined) throw new Error("dead-owner fixture had no pid");

    const reservationDir = path.join(b.root, ".supertaskr", "runs", "reservations");
    const lock = path.join(reservationDir, ".native-transaction.lock");
    const recovery = `${lock}.recovery`;
    mkdirSync(lock);
    writeFileSync(
      path.join(lock, "owner.json"),
      `${JSON.stringify({
        version: 1,
        pid: deadPid,
        token: "dead-owner-token",
        operation: "dead-owner-fixture",
        acquiredAt: AT,
      })}\n`,
    );
    const abandonedTemp = path.join(
      b.root,
      ".supertaskr",
      "runs",
      WORK,
      `${bound.attempt}.json.${deadPid}.1.1.tmp`,
    );
    writeFileSync(abandonedTemp, "incomplete\n");

    const staleObserved = path.join(b.dir, "stale-observed");
    const releaseStale = path.join(b.dir, "release-stale");
    const staleRecoveryClaimed = path.join(b.dir, "stale-recovery-claimed");
    const staleRecoveryChecked = path.join(b.dir, "stale-recovery-checked");
    const staleAcquired = path.join(b.dir, "stale-acquired");
    const releaseStaleOwner = path.join(b.dir, "release-stale-owner");
    emergencyReleases.push(releaseStale, releaseStaleOwner);
    const stale = recoveryChild(
      b.root,
      event("PreToolUse", {
        tool_name: "Bash",
        tool_use_id: "stale-reclaimer",
        tool_input: { command: commandFor(b) },
      }),
      "2026-09-24T12:00:05.000Z",
      {
        deadReady: staleObserved,
        deadRelease: releaseStale,
        recoveryReady: staleRecoveryClaimed,
        checkedReady: staleRecoveryChecked,
        acquiredReady: staleAcquired,
        acquiredRelease: releaseStaleOwner,
      },
    );
    children.push(stale);
    const staleDone = completedChild(stale);
    await waitForPath(staleObserved);

    const successorRecoveryClaimed = path.join(b.dir, "successor-recovery-claimed");
    const successorAcquired = path.join(b.dir, "successor-acquired");
    const releaseSuccessor = path.join(b.dir, "release-successor");
    emergencyReleases.push(releaseSuccessor);
    const successor = recoveryChild(
      b.root,
      event("PreToolUse", {
        tool_name: "Bash",
        tool_use_id: "successor-reclaimer",
        tool_input: { command: commandFor(b) },
      }),
      "2026-09-24T12:00:05.001Z",
      {
        recoveryReady: successorRecoveryClaimed,
        acquiredReady: successorAcquired,
        acquiredRelease: releaseSuccessor,
      },
    );
    children.push(successor);
    const successorDone = completedChild(successor);
    await waitForPath(successorRecoveryClaimed);
    await waitForPath(successorAcquired);
    expect(existsSync(abandonedTemp)).toBe(false);

    writeFileSync(releaseStale, "release\n");
    await waitForPath(staleRecoveryClaimed);
    await waitForPath(staleRecoveryChecked);
    const successorOwner = JSON.parse(readFileSync(path.join(lock, "owner.json"), "utf8"));
    expect(successorOwner.pid).toBe(successor.pid);
    expect(existsSync(staleAcquired), "stale reclaimer acquired while the successor was live").toBe(false);
    expect(existsSync(recovery), "stale recovery gate remained after reconciliation").toBe(false);

    writeFileSync(releaseSuccessor, "release\n");
    expect((await successorDone).disposition).toBe("pre-admitted");
    await waitForPath(staleAcquired);
    writeFileSync(releaseStaleOwner, "release\n");
    expect((await staleDone).disposition).toBe("pre-admitted");

    const final = readNativeRecord(b.root, bound.attempt);
    expect(final.native.inflight.map((entry: any) => entry.toolUseId).sort()).toEqual([
      "stale-reclaimer",
      "successor-reclaimer",
    ]);
    expect(existsSync(lock)).toBe(false);
    expect(existsSync(recovery)).toBe(false);
  } finally {
    for (const release of emergencyReleases) writeFileSync(release, "emergency release\n");
    for (const child of children) {
      if (child.exitCode === null) child.kill("SIGTERM");
    }
    b.cleanup();
  }
});

test("a duplicate native identity claimed while another attempt is pending holds both attempts", () => {
  const left = bench("duplicate-bound-left");
  const right = bench("duplicate-pending-right");
  try {
    const sharedRoot = left.root;
    right.root = sharedRoot;
    const bound = startNative(left, {
      agentId: "agent-left",
      sessionId: "parent-session",
      taskName: "/root/left",
    });
    const pending = startRun(sharedRoot, {
      assignment: assignment(right, "parent-session", "/root/right"),
      at: "2026-09-24T12:00:05.000Z",
      io: io(),
    }).record;

    const conflict = handleNativeEvent(
      sharedRoot,
      event("SubagentStart", {
        agent_id: "agent-left",
        session_id: "parent-session",
        turn_id: "turn-conflict",
      }),
      { at: "2026-09-24T12:00:06.000Z" },
    );
    expect(conflict.disposition).toBe("start-held");
    expect(activeNativeHolds(readNativeRecord(sharedRoot, bound.attempt)).map((hold: any) => hold.code)).toContain(
      "duplicate-agent-attribution",
    );
    expect(activeNativeHolds(readNativeRecord(sharedRoot, pending.attempt)).map((hold: any) => hold.code)).toContain(
      "duplicate-agent-attribution",
    );
  } finally {
    left.cleanup();
    right.cleanup();
  }
});

test("shared cwd cannot select a resource and Bash must visibly name the assigned root in its guaranteed command payload", () => {
  // KILLED BY: trusting event.cwd, an undocumented tool_input.workdir, or
  // accepting an absolute path that is not the assigned command prefix.
  const b = bench("shared-cwd");
  try {
    const bound = startNative(b);
    const denied = handleNativeEvent(
      b.root,
      event("PreToolUse", {
        cwd: b.lane,
        tool_name: "Bash",
        tool_use_id: "implicit-workdir",
        tool_input: { command: "touch allowed.txt", workdir: b.lane },
      }),
    );
    expect(denied.disposition).toBe("pre-held");
    expect(activeNativeHolds(readNativeRecord(b.root, bound.attempt)).map((hold: any) => hold.code)).toContain(
      "writer-resource-not-explicit",
    );
  } finally {
    b.cleanup();
  }
});

test("apply_patch checks every absolute source and move destination against the assigned resource", () => {
  // KILLED BY: checking only the source, accepting relative paths, or
  // overlooking a Move-to endpoint outside the lane.
  const b = bench("patch-endpoints");
  try {
    const outside = path.join(b.dir, "escaped.txt");
    const problem = explicitResourceProblem(
      event("PreToolUse", {
        tool_name: "apply_patch",
        tool_input: {
          command:
            `*** Begin Patch\n*** Update File: ${path.join(b.lane, "allowed.txt")}\n` +
            `*** Move to: ${outside}\n*** End Patch`,
        },
      }),
      b.lane,
    );
    expect(problem).toContain("outside assigned resource");
    expect(
      explicitResourceProblem(
        event("PreToolUse", {
          tool_name: "apply_patch",
          tool_input: { command: "*** Begin Patch\n*** Update File: allowed.txt\n*** End Patch" },
        }),
        b.lane,
      ),
    ).toContain("not absolute");
  } finally {
    b.cleanup();
  }
});

test("actual PostToolUse finds shell-created untracked and unexpected ignored paths while named ignored output stays governed", () => {
  // KILLED BY: checking only tracked diffs, treating all ignored paths as
  // allowed, or trusting the PreToolUse snapshot as completion evidence.
  const untracked = bench("shell-untracked");
  const ignored = bench("shell-ignored");
  try {
    const a = startNative(untracked);
    handleNativeEvent(
      untracked.root,
      event("PreToolUse", {
        tool_name: "Bash",
        tool_use_id: "shell-new",
        tool_input: { command: commandFor(untracked) },
      }),
    );
    writeFileSync(path.join(untracked.lane, "escaped.tmp"), "new\n");
    const blocked = handleNativeEvent(
      untracked.root,
      event("PostToolUse", {
        tool_name: "Bash",
        tool_use_id: "shell-new",
        tool_input: { command: commandFor(untracked) },
        tool_response: { output: "done" },
      }),
    );
    expect(blocked.disposition).toBe("post-held");
    expect(
      activeNativeHolds(readNativeRecord(untracked.root, a.attempt)).flatMap((hold: any) => hold.findings ?? []),
    ).toContainEqual(expect.objectContaining({ code: "untracked-out-of-fence", path: "escaped.tmp" }));

    const b = startNative(ignored);
    handleNativeEvent(
      ignored.root,
      event("PreToolUse", {
        tool_name: "Bash",
        tool_use_id: "ignored-new",
        tool_input: { command: commandFor(ignored) },
      }),
    );
    mkdirSync(path.join(ignored.lane, "ignored"), { recursive: true });
    writeFileSync(path.join(ignored.lane, "ignored", "unexpected.log"), "ignored but not governed\n");
    handleNativeEvent(
      ignored.root,
      event("PostToolUse", {
        tool_name: "Bash",
        tool_use_id: "ignored-new",
        tool_input: { command: commandFor(ignored) },
        tool_response: { output: "done" },
      }),
    );
    expect(
      activeNativeHolds(readNativeRecord(ignored.root, b.attempt)).flatMap((hold: any) => hold.findings ?? []),
    ).toContainEqual(expect.objectContaining({ code: "unexpected-ignored-output", path: "ignored/unexpected.log" }));
  } finally {
    untracked.cleanup();
    ignored.cleanup();
  }
});

test("a yielded Bash operation is checked at actual PostToolUse and its late violation persists a hold", async () => {
  // KILLED BY: treating early output as completion or omitting the
  // cumulative workspace scan from the actual PostToolUse callback.
  const b = bench("yielded-late-write");
  try {
    const rec = startNative(b);
    const toolUseId = "yielded-late-write";
    const command = commandFor(b, "printf yielded; sleep 0.2; printf late > late.tmp");
    expect(
      handleNativeEvent(
        b.root,
        event("PreToolUse", {
          tool_name: "Bash",
          tool_use_id: toolUseId,
          tool_input: { command },
        }),
      ).disposition,
    ).toBe("pre-admitted");

    const child = spawn("/bin/sh", ["-c", command], { stdio: ["ignore", "pipe", "pipe"] });
    let completed = false;
    const completion = new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code) => {
        completed = true;
        resolve(code);
      });
    });
    const yielded = await firstOutputBeforeCompletion(child, completion);
    expect(yielded).toContain("yielded");
    expect(completed, "early output was incorrectly treated as process completion").toBe(false);
    expect(await completion).toBe(0);

    const post = handleNativeEvent(
      b.root,
      event("PostToolUse", {
        tool_name: "Bash",
        tool_use_id: toolUseId,
        tool_input: { command },
        tool_response: { output: yielded },
      }),
    );
    expect(post.disposition).toBe("post-held");
    expect(
      activeNativeHolds(readNativeRecord(b.root, rec.attempt)).flatMap((hold: any) => hold.findings ?? []),
    ).toContainEqual(expect.objectContaining({ code: "untracked-out-of-fence", path: "late.tmp" }));

    const failed = bench("yielded-spawn-error");
    try {
      const missing = spawn("/definitely-missing-native-test-shell", ["-c", "true"], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      const failedCompletion = new Promise<number | null>((resolve, reject) => {
        missing.once("error", reject);
        missing.once("close", resolve);
      });
      await expect(firstOutputBeforeCompletion(missing, failedCompletion)).rejects.toThrow("ENOENT");
    } finally {
      failed.cleanup();
    }
    expect(existsSync(failed.dir), "spawn-error fixture cleanup did not run").toBe(false);
  } finally {
    b.cleanup();
  }
});

test("tracked generated output is never hidden by ignored-output policy and raw layers retain mode/type and both rename endpoints", () => {
  // KILLED BY: applying ignored policy to tracked files, name-only diff,
  // or inspecting only the rename destination.
  const b = bench("tracked-generated");
  try {
    const rec = startNative(b);
    writeFileSync(path.join(b.lane, "generated.txt"), "tracked generated changed\n");
    const check = collectNativeWorkspace(readNativeRecord(b.root, rec.attempt));
    expect(check.findings).toContainEqual(
      expect.objectContaining({ code: "tracked-out-of-fence", path: "generated.txt", layer: "unstaged" }),
    );
    expect(check.tracked[0]).toEqual(
      expect.objectContaining({ oldType: "file", newType: "file", paths: ["generated.txt"] }),
    );
    git(b.lane, ["checkout", "--", "generated.txt"]);
    unlinkSync(path.join(b.lane, "outside.txt"));
    symlinkSync("allowed.txt", path.join(b.lane, "outside.txt"));
    const retyped = collectNativeWorkspace(readNativeRecord(b.root, rec.attempt));
    expect(retyped.tracked).toContainEqual(
      expect.objectContaining({ oldType: "file", newType: "symlink", paths: ["outside.txt"] }),
    );
    git(b.lane, ["checkout", "--", "outside.txt"]);
    git(b.lane, ["mv", "outside.txt", "allowed-renamed.txt"]);
    const renamed = collectNativeWorkspace(readNativeRecord(b.root, rec.attempt));
    expect(renamed.tracked.flatMap((entry) => entry.paths)).toEqual(
      expect.arrayContaining(["outside.txt", "allowed-renamed.txt"]),
    );
    expect(renamed.findings).toContainEqual(expect.objectContaining({ path: "outside.txt" }));
  } finally {
    b.cleanup();
  }
});

test("checker failure, missing completion and unreadable hold authority remain refusals", () => {
  // KILLED BY: converting checker errors to clean, accepting a Post without
  // its exact Pre, or defaulting malformed hold state to an empty array.
  const checker = bench("checker-error");
  const missing = bench("missing-post");
  try {
    const a = startNative(checker);
    handleNativeEvent(
      checker.root,
      event("PreToolUse", {
        tool_name: "Bash",
        tool_use_id: "break-checker",
        tool_input: { command: commandFor(checker) },
      }),
    );
    unlinkSync(path.join(checker.lane, ".supertaskr", "lane-fence.json"));
    handleNativeEvent(
      checker.root,
      event("PostToolUse", {
        tool_name: "Bash",
        tool_use_id: "break-checker",
        tool_input: { command: commandFor(checker) },
        tool_response: { output: "done" },
      }),
    );
    expect(activeNativeHolds(readNativeRecord(checker.root, a.attempt)).map((hold: any) => hold.code)).toContain(
      "checker-error",
    );

    const b = startNative(missing);
    const post = handleNativeEvent(
      missing.root,
      event("PostToolUse", {
        tool_name: "Bash",
        tool_use_id: "never-pre",
        tool_input: { command: commandFor(missing) },
        tool_response: { output: "done" },
      }),
    );
    expect(post.disposition).toBe("post-held");
    const corrupted = readNativeRecord(missing.root, b.attempt);
    corrupted.native.holds = "unknown";
    writeFileSync(
      path.join(missing.root, ".supertaskr", "runs", WORK, `${b.attempt}.json`),
      `${JSON.stringify(corrupted)}\n`,
    );
    expect(() => readNativeRecord(missing.root, b.attempt)).toThrow(NativeCodexFinding);
    const emergency = path.join(
      missing.root,
      ".supertaskr",
      "runs",
      WORK,
      `${b.attempt}.json.native-hold`,
    );
    expect(existsSync(emergency), "read-only inspection wrote a sidecar").toBe(false);
    expect(() => handleNativeEvent(missing.root, event("PreToolUse"))).toThrow(NativeCodexFinding);
    expect(existsSync(emergency), "the unreadable authority refusal was not made durable").toBe(true);

    corrupted.native.holds = [];
    writeFileSync(
      path.join(missing.root, ".supertaskr", "runs", WORK, `${b.attempt}.json`),
      `${JSON.stringify(corrupted)}\n`,
    );
    const recovered = readNativeRecord(missing.root, b.attempt);
    expect(activeNativeHolds(recovered).map((hold: any) => hold.code)).toContain("unreadable-authority");
    expect(existsSync(emergency), "read-only inspection consumed the fail-closed sidecar").toBe(true);
    expect(
      handleNativeEvent(
        missing.root,
        event("PreToolUse", {
          tool_name: "Bash",
          tool_use_id: "after-repair",
          tool_input: { command: commandFor(missing) },
        }),
      ).disposition,
    ).toBe("held-before-tool");
    expect(existsSync(emergency), "the locked writer did not absorb the sidecar").toBe(false);
    expect(activeNativeHolds(readNativeRecord(missing.root, b.attempt)).map((hold: any) => hold.code)).toContain(
      "unreadable-authority",
    );
  } finally {
    checker.cleanup();
    missing.cleanup();
  }
});

test("yielded native completion releases only after an independent clean check, while interrupt with a live owned job proves no cessation", () => {
  // KILLED BY: treating SubagentStop/Interrupt as terminal, trusting a clean
  // callback receipt as the final gate, or ignoring an attempt-owned port.
  const yielded = bench("yielded");
  const interrupted = bench("interrupted-job");
  try {
    const done = startNative(yielded);
    handleNativeEvent(
      yielded.root,
      event("PreToolUse", {
        tool_name: "Bash",
        tool_use_id: "yield-without-post",
        tool_input: { command: commandFor(yielded) },
      }),
    );
    const stop = handleNativeEvent(yielded.root, event("SubagentStop"));
    expect(stop.disposition).toBe("stop-observed-only");
    expect(readReservation(yielded.root, yielded.lane)?.attempt).toBe(done.attempt);
    const finished = observeRun(yielded.root, {
      attempt: done.attempt,
      evidence: "RUN-DONE ok",
      at: "2026-09-24T12:01:00.000Z",
      io: io(),
    });
    expect(finished.record.state).toBe("finished");
    expect(readReservation(yielded.root, yielded.lane)).toBeNull();
    expect(readNativeRecord(yielded.root, done.attempt).native.receipts).toContainEqual(
      expect.objectContaining({ actualPostCallback: false, outcome: "unknown" }),
    );

    const live = startNative(interrupted);
    const withJob = readNativeRecord(interrupted.root, live.attempt);
    withJob.ownedJobs = [{ kind: "port", id: "15315" }];
    writeNativeRecord(interrupted.root, withJob);
    const interrupt = handleNativeEvent(interrupted.root, event("Interrupt", { agent_id: null }));
    expect(interrupt.disposition).toBe("interrupt-observed");
    const observed = observeRun(interrupted.root, {
      attempt: live.attempt,
      evidence: "RUN-DONE ok",
      at: "2026-09-24T12:01:00.000Z",
      io: io({ listening: (port) => port === 15315 }),
    });
    expect(observed.record.state).not.toBe("finished");
    expect(readReservation(interrupted.root, interrupted.lane)?.attempt).toBe(live.attempt);
    expect(readNativeRecord(interrupted.root, live.attempt).native.interruptObservations[0]).toEqual(
      expect.objectContaining({ terminalStateClaimed: false, ownedJobsReconciled: false }),
    );
  } finally {
    yielded.cleanup();
    interrupted.cleanup();
  }
});

test("native admission refuses pre-existing ignored residue that no coordinator policy names", () => {
  // A frozen ignored baseline is evidence of what existed at admission;
  // it is not a second, unnamed output policy.
  const b = bench("ignored-at-admission");
  try {
    mkdirSync(path.join(b.lane, "ignored"), { recursive: true });
    writeFileSync(path.join(b.lane, "ignored", "unexpected.log"), "present before admission\n");
    expect(() => startRun(b.root, { assignment: assignment(b), at: AT, io: io() })).toThrow(NativeCodexFinding);
  } finally {
    b.cleanup();
  }
});

test("completion of the bound worker does not reconcile a hold created by an unknown second identity", () => {
  // The lifecycle evidence below answers only for agent-1. It says
  // nothing about whether agent-impostor or its jobs have stopped.
  const b = bench("unknown-identity-hold");
  try {
    const bound = startNative(b);
    const unknown = handleNativeEvent(
      b.root,
      event("PreToolUse", {
        agent_id: "agent-impostor",
        tool_name: "Bash",
        tool_use_id: "impostor-op",
        tool_input: { command: commandFor(b) },
      }),
    );
    expect(unknown.disposition).toBe("unknown-held");
    expect(activeNativeHolds(readNativeRecord(b.root, bound.attempt)).map((hold: any) => hold.code)).toContain(
      "unknown-worker",
    );

    observeRun(b.root, {
      attempt: bound.attempt,
      evidence: "RUN-DONE ok",
      at: "2026-09-24T12:01:00.000Z",
      io: io(),
    });
    expect(readReservation(b.root, b.lane)?.attempt).toBe(bound.attempt);
    expect(activeNativeHolds(readNativeRecord(b.root, bound.attempt)).map((hold: any) => hold.code)).toContain(
      "unknown-worker",
    );
  } finally {
    b.cleanup();
  }
});

test("native collect and continue independently require the exact reported commit after lifecycle reconciliation", () => {
  // KILLED BY: trusting the clean Post callback, defaulting the reported
  // ref from HEAD, or allowing collect/continue to skip their fresh scan.
  const b = bench("final-ref");
  try {
    const running = startNative(b);
    observeRun(b.root, {
      attempt: running.attempt,
      evidence: "RUN-DONE ok",
      at: "2026-09-24T12:01:00.000Z",
      io: io(),
    });
    expect(() =>
      collectRun(b.root, {
        attempt: running.attempt,
        at: "2026-09-24T12:02:00.000Z",
        io: io(),
      }),
    ).toThrow(NativeCodexFinding);
    const collected = collectRun(b.root, {
      attempt: running.attempt,
      ref: b.base,
      at: "2026-09-24T12:03:00.000Z",
      io: io(),
    });
    expect(collected.collected.refs).toContain(b.base);

    expect(() =>
      continueRun(b.root, {
        attempt: running.attempt,
        evidence: "RUN-DONE gone",
        at: "2026-09-24T12:04:00.000Z",
        io: io(),
      }),
    ).toThrow(NativeCodexFinding);
    const resumed = continueRun(b.root, {
      attempt: running.attempt,
      evidence: "RUN-DONE gone",
      ref: b.base,
      at: "2026-09-24T12:05:00.000Z",
      io: io(),
    });
    expect(resumed.record.state).toBe("reserved");
    expect(
      resumed.record.native?.holds.filter((hold: any) => hold.code === "reported-ref-required"),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ clearedAt: expect.any(String) })]));
  } finally {
    b.cleanup();
  }
});
