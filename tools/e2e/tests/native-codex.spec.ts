import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
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
  NativeCodexFinding,
  activeNativeHolds,
  collectNativeWorkspace,
  explicitResourceProblem,
  handleNativeEvent,
  nativeShellQuote,
  prepareNativeRecord,
  readNativeRecord,
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
    expect(existsSync(emergency), "the unreadable authority refusal was not made durable").toBe(true);
    expect(() => handleNativeEvent(missing.root, event("PreToolUse"))).toThrow(NativeCodexFinding);

    corrupted.native.holds = [];
    writeFileSync(
      path.join(missing.root, ".supertaskr", "runs", WORK, `${b.attempt}.json`),
      `${JSON.stringify(corrupted)}\n`,
    );
    const recovered = readNativeRecord(missing.root, b.attempt);
    expect(activeNativeHolds(recovered).map((hold: any) => hold.code)).toContain("unreadable-authority");
    expect(existsSync(emergency), "the sidecar was not absorbed into the attempt record").toBe(false);
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
