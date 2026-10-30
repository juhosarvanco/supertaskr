import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { acceptedOperationPath, captureOperationRepository, executeAcceptedOperation, readAcceptedOperation, replayAcceptedOperation, withAcceptedOperation } from "../scripts/durable-operation.mjs";
import { allRecords, readRecord, readReservation } from "../scripts/run-record.mjs";
import { operationDigest, validOperationRecord } from "../scripts/operation-record.mjs";

const SUBJECT = new URL("../scripts/durable-operation.mjs", import.meta.url).href;
const ENV = { ...process.env, GIT_AUTHOR_NAME: "Operation fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Operation fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
function git(root: string, args: string[], input?: string) {
  return execFileSync("git", ["-C", root, "-c", "maintenance.auto=false", "-c", "gc.auto=0", ...args],
    { encoding: "utf8", env: ENV, ...(input === undefined ? {} : { input }), stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"] }).trimEnd();
}
function fixture(suffix = "") {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "durable-operation-T355-")));
  const product = path.join(dir, "product"), records = path.join(dir, `records${suffix}`);
  for (const root of [product, records]) {
    mkdirSync(root); git(root, ["init", "-q", "--initial-branch=main"]);
    git(root, ["config", "user.name", "Operation fixture"]); git(root, ["config", "user.email", "fixture@example.invalid"]);
    writeFileSync(path.join(root, "note.md"), `initial ${path.basename(root)}\n`);
    git(root, ["add", "."]); git(root, ["commit", "-qm", "Initial fixture"]);
  }
  const base = git(records, ["rev-parse", "HEAD"]);
  function tree(text: string) {
    const blob = git(records, ["hash-object", "-w", "--stdin"], text);
    return git(records, ["mktree"], `100644 blob ${blob}\tnote.md\n`);
  }
  function request(id: string, expectedRevision = base, text = "accepted private note\n") {
    return { operationId: id, kind: "records-save", repositoryRoot: records, targetRef: "refs/heads/main", expectedRevision,
      acceptedTree: tree(text), payloadDigest: `sha256:${createHash("sha256").update(text).digest("hex")}`, message: `Save ${id}` };
  }
  return { dir, product, records, base, request, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
function runChild(root: string, input: any, boundary?: string) {
  return spawnSync(process.execPath, ["--input-type=module", "-e", `
    import {executeAcceptedOperation} from ${JSON.stringify(SUBJECT)};
    const result=executeAcceptedOperation(${JSON.stringify(root)},${JSON.stringify(input)},{authorize(){return true;},onBoundary(at){
      if(at===${JSON.stringify(boundary)})process.exit(72);
    }});process.stdout.write(JSON.stringify(result));
  `], { encoding: "utf8", env: ENV });
}

test("ordinary accepted operation persists exact commit/ref correlation without a worker or product/index/worktree effect", () => {
  const f = fixture();
  try {
    const input = f.request("note-one"), beforeProduct = git(f.product, ["rev-parse", "HEAD"]);
    const beforeIndex = readFileSync(path.join(f.records, ".git/index")), beforeWork = readFileSync(path.join(f.records, "note.md"));
    const checked: string[] = [];
    const result = executeAcceptedOperation(f.product, input, { authorize(context) {
      checked.push(context.phase); expect(context.request.acceptedTree).toBe(input.acceptedTree);
      expect(git(f.records, ["rev-parse", "HEAD"])).toBe(f.base);
      return true;
    } });
    expect(checked).toEqual(["objects", "objects", "ref"]); expect(result.status).toBe("accepted");
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(result.commit);
    expect(git(f.records, ["rev-parse", `${result.commit}^{tree}`])).toBe(input.acceptedTree);
    expect(git(f.records, ["rev-parse", `${result.commit}^`])).toBe(f.base);
    expect(git(f.product, ["rev-parse", "HEAD"])).toBe(beforeProduct);
    expect(readFileSync(path.join(f.records, ".git/index"))).toEqual(beforeIndex);
    expect(readFileSync(path.join(f.records, "note.md"))).toEqual(beforeWork);
    const rec = readAcceptedOperation(f.product, input.operationId);
    expect(validOperationRecord(rec)).toBe(true); expect(allRecords(f.product)).toHaveLength(1);
    expect(rec.assignment.kind).toBe("operation"); expect(rec.admission).toBeNull(); expect(rec.execution).toBeNull();
    expect(() => readRecord(f.product, rec.attempt)).toThrow(/RECORD_OPERATION/);
    expect(readReservation(f.product, f.records)).toBeNull();
    expect(git(f.product, ["for-each-ref", "--format=%(refname)", "refs/supertaskr"])).toBe("");
  } finally { f.cleanup(); }
});

test("accepted commit before result recovers in a new process after a later legitimate save advances the branch", () => {
  const f = fixture();
  try {
    const firstInput = f.request("first"), crashed = runChild(f.product, firstInput, "ref-accepted");
    expect(crashed.status, crashed.stderr).toBe(72);
    const firstCommit = git(f.records, ["rev-parse", "HEAD"]);
    expect(firstCommit).not.toBe(f.base); expect(readAcceptedOperation(f.product, "first").operation.acceptance).toBeNull();
    const secondInput = f.request("second", firstCommit, "second private save\n"), secondRun = runChild(f.product, secondInput);
    expect(secondRun.status, secondRun.stderr).toBe(0);
    const second = JSON.parse(secondRun.stdout); expect(second.commit).not.toBe(firstCommit);
    const before = git(f.records, ["rev-list", "--count", "HEAD"]), retried = runChild(f.product, firstInput);
    expect(retried.status, retried.stderr).toBe(0);
    expect(JSON.parse(retried.stdout)).toMatchObject({ operationId: "first", commit: firstCommit, recovered: true });
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(second.commit);
    expect(git(f.records, ["rev-list", "--count", "HEAD"])).toBe(before);
  } finally { f.cleanup(); }
});

test("durable intent alone has no acceptance and restart reuses the exact intended commit", () => {
  const f = fixture();
  try {
    const input = f.request("pending"), crashed = runChild(f.product, input, "intent-persisted");
    expect(crashed.status, crashed.stderr).toBe(72); expect(git(f.records, ["rev-parse", "HEAD"])).toBe(f.base);
    const intended = readAcceptedOperation(f.product, "pending").operation.intent.commit;
    const restarted = runChild(f.product, input);
    expect(restarted.status, restarted.stderr).toBe(0); expect(JSON.parse(restarted.stdout).commit).toBe(intended);
  } finally { f.cleanup(); }
});

test("reachable planned commit without its exact correlation witness remains uncertain and never repeats the ref effect", () => {
  const f = fixture();
  try {
    const input = f.request("missing-correlation"), crashed = runChild(f.product, input, "ref-accepted");
    expect(crashed.status, crashed.stderr).toBe(72);
    const pending = readAcceptedOperation(f.product, input.operationId), commit = git(f.records, ["rev-parse", "HEAD"]);
    expect(pending.operation.acceptance).toBeNull();
    git(f.records, ["update-ref", "-d", pending.operation.intent.correlationRef]);
    const retry = runChild(f.product, input);
    expect(retry.status).toBe(1); expect(retry.stderr).toContain("OPERATION_ACCEPTANCE_UNCERTAIN");
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(commit);
    expect(readAcceptedOperation(f.product, input.operationId).operation.acceptance).toBeNull();
  } finally { f.cleanup(); }
});

test("partial correlation without the intended destination update remains uncertain without repeating either ref", () => {
  const f = fixture();
  try {
    const input = f.request("partial-ref"), crashed = runChild(f.product, input, "intent-persisted");
    expect(crashed.status, crashed.stderr).toBe(72);
    const pending = readAcceptedOperation(f.product, input.operationId), intended = pending.operation.intent;
    git(f.records, ["update-ref", intended.correlationRef, intended.commit]);
    const retry = runChild(f.product, input);
    expect(retry.status).toBe(1); expect(retry.stderr).toContain("OPERATION_ACCEPTANCE_UNCERTAIN");
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(f.base);
    expect(git(f.records, ["rev-parse", intended.correlationRef])).toBe(intended.commit);
    expect(readAcceptedOperation(f.product, input.operationId).operation.acceptance).toBeNull();
  } finally { f.cleanup(); }
});

test("operation identity cannot change payload and current policy refusal prevents ref acceptance", () => {
  const f = fixture();
  try {
    const input = f.request("same");
    expect(() => executeAcceptedOperation(f.product, input, { authorize() { throw Error("ordinary record authority refused"); } })).toThrow(/authority refused/);
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(f.base);
    expect(() => executeAcceptedOperation(f.product, f.request("same", f.base, "different\n"), { authorize() { return true; } })).toThrow(/OPERATION_CHANGED/);
    expect(readAcceptedOperation(f.product, input.operationId).state).toBe("failed");
    expect(readReservation(f.product, f.records)).toBeNull();
    expect(() => executeAcceptedOperation(f.product, input, { authorize() { return true; } })).toThrow(/OPERATION_PREPARATION_REFUSED/);
    const acceptedInput = f.request("next");
    const accepted = executeAcceptedOperation(f.product, acceptedInput, { authorize() { return true; } });
    expect(executeAcceptedOperation(f.product, acceptedInput, { authorize() { throw Error("later policy is not historical acceptance"); } }).commit).toBe(accepted.commit);
    expect(() => executeAcceptedOperation(f.product, { ...input, kind: "qualified-delivery" }, { authorize() { return true; } })).toThrow(/OPERATION_REQUEST/);
  } finally { f.cleanup(); }
});

test("ordinary preparation holds the same reservation through materialization and the checked ref effect", () => {
  const f = fixture();
  try {
    const input = f.request("prepared"), checkpoints: string[] = [];
    const result = withAcceptedOperation(f.product, input, { authorize(context) {
      expect(readReservation(f.product, f.records)?.role).toBe("records-save"); checkpoints.push(`policy:${context.phase}`); return true;
    } }, (context) => {
      checkpoints.push("prepare");
      expect(readReservation(f.product, f.records)?.attempt).toBe(readAcceptedOperation(f.product, input.operationId).attempt);
      expect(context.intent.tree).toBe(input.acceptedTree);
      expect(() => executeAcceptedOperation(f.product, input, { authorize() { return true; } })).toThrow(/OPERATION_OWNER_LIVE/);
      writeFileSync(path.join(f.records, "note.md"), "accepted private note\n");
      expect(() => executeAcceptedOperation(f.product, f.request("competing"), { authorize() { return true; } })).toThrow(/OPERATION_RESOURCE_RESERVED/);
    });
    expect(checkpoints).toEqual(["policy:objects", "policy:objects", "policy:working", "prepare", "policy:ref"]);
    expect(readReservation(f.product, f.records)).toBeNull();
    expect(withAcceptedOperation(f.product, input, { authorize() { throw Error("unexpected historical policy"); } }, () => {
      throw Error("unexpected historical materialization");
    }).commit).toBe(result.commit);
  } finally { f.cleanup(); }
});

test("foreign, corrupt and stale operation inputs refuse without another ref effect", () => {
  const f = fixture();
  try {
    const input = f.request("one"), accepted = executeAcceptedOperation(f.product, input, { authorize() { return true; } });
    expect(() => executeAcceptedOperation(f.product, f.request("stale"), { authorize() { return true; } })).toThrow(/OPERATION_STALE_REF/);
    const file = acceptedOperationPath(f.product, "one"), saved = readFileSync(file, "utf8");
    writeFileSync(file, saved.replace('"recordKind": "operation"', '"recordKind": "unknown"'));
    expect(() => executeAcceptedOperation(f.product, input, { authorize() { return true; } })).toThrow(/OPERATION_RECORD/);
    writeFileSync(file, saved);
    git(f.records, ["update-ref", readAcceptedOperation(f.product, "one").operation.intent.correlationRef, f.base]);
    expect(() => executeAcceptedOperation(f.product, input, { authorize() { return true; } })).toThrow(/OPERATION_CORRELATION_FOREIGN/);
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(accepted.commit);
  } finally { f.cleanup(); }
});

test("ordinary operation requires explicit synchronous policy acceptance before preparation and again before the ref effect", () => {
  const f = fixture();
  try {
    let prepared = false;
    for (const [at, denied] of [false, undefined].entries()) {
      expect(() => withAcceptedOperation(f.product, f.request(`policy-${at}`), { authorize() { return denied; } }, () => { prepared = true; })).toThrow(/OPERATION_POLICY_REFUSED/);
      expect(prepared).toBe(false); expect(git(f.records, ["rev-parse", "HEAD"])).toBe(f.base);
    }
    const phases:string[]=[];
    expect(() => withAcceptedOperation(f.product, f.request("policy-effects"), { authorize(context) { phases.push(context.phase);return context.phase!=="ref"; } }, () => { prepared = true; })).toThrow(/OPERATION_POLICY_REFUSED/);
    expect(prepared).toBe(true);expect(phases).toContain("objects");expect(phases).toContain("working");expect(phases.at(-1)).toBe("ref");
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(f.base);
  } finally { f.cleanup(); }
});

test("ordinary operation refuses inherited Git routing, active hooks and alternate object stores", () => {
  const f = fixture();
  try {
    const old = process.env.GIT_DIR;
    try { process.env.GIT_DIR = path.join(f.product, ".git"); expect(() => captureOperationRepository(f.records, f.base)).toThrow(/OPERATION_GIT_ENVIRONMENT/); }
    finally { if (old === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = old; }
    const hook = path.join(f.records, ".git/hooks/reference-transaction");
    writeFileSync(hook, "#!/bin/sh\nexit 0\n"); chmodSync(hook, 0o755);
    expect(() => executeAcceptedOperation(f.product, f.request("hook"), { authorize() { return true; } })).toThrow(/OPERATION_ACTIVE_HOOK/);
    expect(existsSync(hook)).toBe(true); rmSync(hook);
    writeFileSync(path.join(f.records, ".git/objects/info/alternates"), path.join(f.product, ".git/objects"));
    expect(() => captureOperationRepository(f.records, f.base)).toThrow(/OPERATION_OBJECT_ROUTING/);
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(f.base);
  } finally { f.cleanup(); }
});

test("historical accepted retry returns the original result before changed current hook policy", () => {
  const f = fixture();
  try {
    const input = f.request("historical-hook"), accepted = executeAcceptedOperation(f.product, input, { authorize() { return true; } });
    const hook = path.join(f.records, ".git/hooks/reference-transaction"), marker = path.join(f.dir, "hook-ran");
    writeFileSync(hook, `#!/bin/sh\ntouch '${marker}'\nexit 1\n`); chmodSync(hook, 0o755);
    expect(executeAcceptedOperation(f.product, input, { authorize() { return false; } }).commit).toBe(accepted.commit);
    expect(existsSync(marker)).toBe(false); expect(git(f.records, ["rev-parse", "HEAD"])).toBe(accepted.commit);
    expect(() => executeAcceptedOperation(f.product, f.request("new-hook", accepted.commit), { authorize() { return true; } })).toThrow(/OPERATION_ACTIVE_HOOK/);
  } finally { f.cleanup(); }
});

test("finite captured operation payload is detached, hash-bound and replayed without a second request ledger", () => {
  const f = fixture();
  try {
    const payload = { edits: [{ path: "docs/rooms/note.md", mode: "100644", bytes: Buffer.from("private exact note\n").toString("base64") }], context: { version: 1 } };
    const input = { ...f.request("captured-payload"), payload, payloadDigest: operationDigest(payload) };
    const result = executeAcceptedOperation(f.product, input, { authorize() { return true; }, onBoundary(boundary) {
      if (boundary === "prepared") payload.edits[0]!.bytes = "changed caller memory";
    } });
    expect(readAcceptedOperation(f.product, input.operationId).operation.request.payload.edits[0].bytes).not.toBe(payload.edits[0]!.bytes);
    expect(replayAcceptedOperation(f.product, input.operationId, { authorize() { return false; } }).commit).toBe(result.commit);
    expect(() => executeAcceptedOperation(f.product, input, { authorize() { return true; } })).toThrow(/OPERATION_PAYLOAD_DIGEST/);
    expect(() => executeAcceptedOperation(f.product, { ...f.request("invalid-payload"), payload: { invalid: undefined } }, { authorize() { return true; } })).toThrow(/OPERATION_PAYLOAD/);
  } finally { f.cleanup(); }
});

test("ordinary operation preserves legal trailing root whitespace and refuses replacement directory identity at the effect", () => {
  const f = fixture(" ");
  try {
    const input = f.request("trailing-root");
    expect(captureOperationRepository(f.records, f.base).root).toBe(f.records);
    const result = executeAcceptedOperation(f.product, input, { authorize() { return true; } });
    const later = f.request("replaced-root", result.commit, "later\n");
    expect(() => executeAcceptedOperation(f.product, later, { authorize() { return true; }, onBoundary(boundary) {
      if (boundary !== "intent-persisted") return;
      const original = `${f.records}-original`;
      renameSync(f.records, original); cpSync(original, f.records, { recursive: true });
    } })).toThrow(/OPERATION_REPOSITORY_CHANGED/);
    expect(git(f.records, ["rev-parse", "HEAD"])).toBe(result.commit);
  } finally { f.cleanup(); }
});

 test("denied pre-effect policy retains a terminal immutable refusal and releases ownership for a corrected new save", () => {
  const f = fixture();
  try {
    const input = f.request("denied-policy"), beforeObjects = git(f.records, ["cat-file", "--batch-all-objects", "--batch-check"]), beforeIndex = readFileSync(path.join(f.records, ".git/index")), beforeWork = readFileSync(path.join(f.records, "note.md"));
    expect(() => executeAcceptedOperation(f.product, input, { authorize() { return false; } })).toThrow(/OPERATION_POLICY_REFUSED/);
    const rec = readAcceptedOperation(f.product, input.operationId);
    expect(rec.state).toBe("failed"); expect(validOperationRecord(rec)).toBe(true);
    expect(git(f.records, ["cat-file", "--batch-all-objects", "--batch-check"])).toBe(beforeObjects); expect(readReservation(f.product, f.records)).toBeNull();
    expect(readFileSync(path.join(f.records, ".git/index"))).toEqual(beforeIndex); expect(readFileSync(path.join(f.records, "note.md"))).toEqual(beforeWork);
    expect(() => executeAcceptedOperation(f.product, input, { authorize() { throw Error("must not retry"); } })).toThrow(/OPERATION_POLICY_REFUSED/);
    for (const change of [(r: any) => r.events.splice(1, 1), (r: any) => r.events.splice(2, 0, {at: r.operation.createdAt, op: "objects-start"}), (r: any) => r.operation.intent = {commit:f.base}]) {
      const corrupt = structuredClone(rec); change(corrupt); expect(validOperationRecord(corrupt)).toBe(false);
    }
    const positive = executeAcceptedOperation(f.product, f.request("corrected-policy"), {authorize() {return true;}});
    expect(positive.status).toBe("accepted");
  } finally {f.cleanup();}
});
