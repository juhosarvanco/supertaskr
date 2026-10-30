import { existsSync, readFileSync, renameSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateGit, privateRecordFixture, putPrivate } from "./private-record-fixture";
import { testToolRuntime } from "../fixtures/tool-runtime";

import {configuredVerificationFixture as fixture} from "./configured-verification-fixture";

test("installed external configured preparation seals the original TOOL verifier role and cold strict start consumes it", async () => {
  test.setTimeout(180_000); const f = await fixture();
  try {
    expect(existsSync(path.join(f.product, "method"))).toBe(false); expect(existsSync(path.join(f.bench.product, "method"))).toBe(false);
    const snapshot = () => [f.product, f.records].map(root => ({ head: privateGit(root, ["rev-parse", "HEAD"]), index: readFileSync(path.join(root, ".git/index")), refs: privateGit(root, ["show-ref"]) }));
    const before = snapshot();
    const prepared = await f.review.prepareQualifiedVerification(f.product, { attempt: f.attempt, assignment: f.verifier, candidate: JSON.stringify(f.candidates) });
    const role = f.checks.readInstalledMethodAsset(f.toolHandle, "method/roles/verifier.md");
    expect(prepared.preparation.authority.role).toEqual({ text: role.text, digest: role.sha256 });
    expect(prepared.preparation.authority.roleSource).toEqual({ kind: "installed-method", path: "method/roles/verifier.md", sha256: role.sha256,
      tool: { manifestDigest: f.toolHandle.manifestDigest, methodDigest: f.toolHandle.methodDigest, methodVersion: f.toolHandle.methodVersion } });
    expect(prepared.phase1).toContain("T-901");
    const source = f.runs.readRecord(f.product, f.attempt), authority = prepared.preparation.authority;
    expect(() => f.review.validateQualifiedRoleSource(source, authority)).not.toThrow();
    for (const changed of [{ ...authority, roleSource: undefined }, { ...authority, role: { ...authority.role, text: "a different role" } },
      { ...authority, roleSource: { ...authority.roleSource, tool: { ...authority.roleSource.tool, manifestDigest: "0".repeat(64) } } }]) {
      expect(() => f.review.validateQualifiedRoleSource(source, changed)).toThrow(/QUALIFIED_REVIEW_ROLE_SOURCE/);
    }
    const attack = path.join(f.dir, "ordinary-attack-set.md"); putPrivate(f.dir, "ordinary-attack-set.md", "Inspect the criterion against both actual candidates and original configured policy.\n");
    const sealed = await f.review.sealQualifiedVerification(f.product, { executorAttempt: f.attempt, preparationDigest: prepared.preparation.digest, attackSetFile: attack });
    expect(sealed.seal.inputs.roleDigest).toBe(role.sha256); expect(sealed.phase2).toContain(prepared.preparation.digest);
    expect(f.review.readQualifiedPreparation(f.product, f.attempt, prepared.preparation.digest).entry.seal.digest).toBe(sealed.seal.digest);
    const configured = await import(f.module("configured-dispatch")), captured = await configured.captureConfiguredDispatchForRun(f.product, f.attempt, { tool: f.toolHandle });
    const selected = structuredClone(prepared.assignment);
    expect(() => f.review.qualifiedVerifierAdmission(f.product, selected)).toThrow(/QUALIFIED_REVIEW_CONFIGURED_REQUIRED/);
    let unrecognized: unknown;
    try { f.review.qualifiedVerifierAdmission(f.product, selected, {}); } catch (error) { unrecognized = error; }
    expect(unrecognized).toMatchObject({ code: "configured-dispatch-unrecognized" });
    expect(f.review.qualifiedVerifierAdmission(f.product, selected, captured.handle).entry.digest).toBe(prepared.preparation.digest);
    const selectedFile = path.join(f.dir, "prepared-verifier.json"); putPrivate(f.dir, "prepared-verifier.json", JSON.stringify(selected));
    const started = f.start(selectedFile); expect(started.status, started.stdout + started.stderr).toBe(0);
    const rec = f.runs.readRecord(f.product, JSON.parse(started.stdout).attempt);
    expect(rec.native.qualified.verification.authority.roleSource).toEqual(authority.roleSource);
    expect(rec.native.qualified.verification.digest).toBe(prepared.preparation.digest);
    expect(f.review.readQualifiedPreparation(f.product, f.attempt, prepared.preparation.digest).entry.consumedBy).toBe(rec.attempt);
    const event = (name: string, id: string, command: string) => ({ hook_event_name: name, agent_id: "external-verifier-agent", session_id: selected.native.sessionId,
      turn_id: "external-verifier-turn", tool_name: "Bash", tool_use_id: id, tool_input: { command } });
    expect(f.native.handleNativeEvent(f.product, event("SubagentStart", "start", "")).disposition).toBe("start-recorded");
    expect(f.native.handleNativeEvent(f.product, event("PreToolUse", "probe", f.native.NATIVE_IDENTITY_PROBE)).disposition).toBe("identity-probe-pre");
    expect(f.native.handleNativeEvent(f.product, { ...event("PostToolUse", "probe", f.native.NATIVE_IDENTITY_PROBE), tool_response: "external-verifier-agent" }).disposition).toBe("identity-probe-post");
    f.runs.bindRun(f.product, { attempt: rec.attempt, harnessId: "external-verifier-agent" });
    const grades = await import(f.module("configured-dispatch-grade")), gradeChecks = await import(f.module("qualified-configured-grades"));
    const policy = rec.native.qualified.origins.configuredDispatch.gatePolicy;
    const originalIgnored = structuredClone(rec.native.qualified.ignored);
    const greenAuthority = await grades.captureConfiguredDispatchGradeAuthority(f.product, rec.attempt, { tool: f.toolHandle });
    const green = grades.runConfiguredDispatchGrade(greenAuthority);
    expect(green).toMatchObject({ code: 0, tokenWritten: false, capture: { complete: true, candidate: { productRoot: f.bench.product, commit: f.candidates.product } },
      reading: { role: "product", commit: f.candidates.product, exit: 0, bodies: 1 } });
    expect(await gradeChecks.assertQualifiedConfiguredGrade(green.reading, policy, { tool: f.toolHandle })).toMatchObject({ exit: 0, commit: f.candidates.product });
    // An actual different scoped candidate fails its original real test body;
    // the producer retains that RED reading and cannot label it complete.
    const command = `cd -- ${f.native.nativeShellQuote(f.bench.product)} && true`;
    expect(f.native.handleNativeEvent(f.product, event("PreToolUse", "correction", command)).disposition).toBe("pre-admitted");
    putPrivate(f.bench.product, "hello.py", "RESULT = 0\n"); privateGit(f.bench.product, ["add", "hello.py"]); privateGit(f.bench.product, ["commit", "-qm", "Actual failing scoped candidate"]);
    expect(f.native.handleNativeEvent(f.product, event("PostToolUse", "correction", command)).disposition).toBe("post-clean");
    expect(() => grades.runConfiguredDispatchGrade(greenAuthority)).toThrow(/CANDIDATE_CHANGED/);
    const redAuthority = await grades.captureConfiguredDispatchGradeAuthority(f.product, rec.attempt, { tool: f.toolHandle }), red = grades.runConfiguredDispatchGrade(redAuthority);
    expect(red).toMatchObject({ code: 1, tokenWritten: false, capture: { complete: false }, reading: { exit: 1, bodies: 1 } });
    expect(red.reading.commit).not.toBe(green.reading.commit);
    expect(await gradeChecks.assertQualifiedConfiguredGrade(red.reading, policy, { tool: f.toolHandle })).toMatchObject({ exit: 1, commit: red.reading.commit });
    expect(f.runs.readRecord(f.product, rec.attempt).native.qualified.ignored).toEqual(originalIgnored);
    expect(privateGit(f.bench.product, ["status", "--porcelain", "--untracked-files=all"])).toBe("");
    const manifest = path.join(f.installed.runtimeRoot, "tool-manifest.json"); renameSync(manifest, `${manifest}.held`);
    try { expect(f.review.readQualifiedPreparation(f.product, f.attempt, prepared.preparation.digest).entry.authority.role).toEqual(authority.role); }
    finally { renameSync(`${manifest}.held`, manifest); }
    expect(snapshot()).toEqual(before);
  } finally { f.cleanup(); }
});


test("configured dispatch requires both actual native preparation owners even when omitted files remain present", async () => {
  test.setTimeout(120_000); const f = privateRecordFixture();
  try {
    const installed = testToolRuntime(), module = (name: string) => pathToFileURL(path.join(installed.runtimeRoot, "tools/e2e/scripts", `${name}.mjs`)).href;
    const [checks, settingsOwner, configured, review] = await Promise.all(["records-check", "project-settings", "configured-dispatch", "qualified-verification"].map(name => import(module(name))));
    await review.loadQualifiedReviewConsumers();
    const tool = checks.loadInstalledRecordTool(), seed = settingsOwner.seedProjectSettings({ tool, recordsValidation: GENERIC_RECORD_PROFILE });
    if (seed.status !== "ready") throw Error(JSON.stringify(seed));
    const settings = structuredClone(seed.settings);
    settings.languages = ["python"];
    settings.suites = [{ id: "python", cwd: ".", sentinel: "hello.py", argv: ["python3", "-m", "unittest", "-v"], family: "unittest", solo: false, why: "Constructor ownership only; no suite run claimed" }];
    putPrivate(f.product, ".gitignore", ".supertaskr/\n"); putPrivate(f.product, "supertaskr.yaml", JSON.stringify(settings));
    privateGit(f.product, ["add", "."]); privateGit(f.product, ["commit", "-qm", "Explicit constructor settings"]);
    putPrivate(f.records, "docs/tasks/T-902-owner.md", "---\nid: T-902\ntitle: Native owner constructor\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: planned\ntouches: [\"product::hello.py\"]\n---\n\n## Acceptance criteria\n\n- WHEN captured THE constructor SHALL require its loaded owners.\n");
    privateGit(f.records, ["add", "."]); privateGit(f.records, ["commit", "-qm", "Authored constructor contract"]);
    const selection = { authorityRoot: f.product, projectId: "external-python", taskId: "T-902", revisions: { product: privateGit(f.product, ["rev-parse", "HEAD"]), records: privateGit(f.records, ["rev-parse", "HEAD"]) }, legacyTokenMap: {} };
    const handle = configured.captureConfiguredDispatch({ ...selection, tool }), original = handle.capsule;
    const role = configured.configuredDispatchVerifierRole(handle), source = { native: { qualified: { origins: { configuredDispatch: original } } } };
    const authority = { role: role.role, roleSource: role.source };
    expect(() => review.validateQualifiedRoleSource(source, authority)).not.toThrow();
    expect(() => review.validateQualifiedRoleSource({ native: { qualified: { origins: { configuredDispatch: { ...original, digest: "0".repeat(64) } } } } }, authority)).toThrow(/QUALIFIED_REVIEW_ROLE_SOURCE/);
    expect(() => review.validateQualifiedRoleSource({ native: { qualified: { origins: {} } } }, { role: role.role })).not.toThrow();
    expect(() => review.validateQualifiedRoleSource({ native: { qualified: { origins: {} } } }, authority)).toThrow(/QUALIFIED_REVIEW_ROLE_SOURCE/);
    const manifest = path.join(installed.runtimeRoot, "tool-manifest.json"), originalManifest = readFileSync(manifest, "utf8");
    for (const member of ["qualified-native", "qualified-verification"].map(name => `tools/e2e/scripts/${name}.mjs`)) {
      try {
        const omitted = JSON.parse(originalManifest); omitted.runtime.files = omitted.runtime.files.filter((row: any) => row.path !== member);
        omitted.runtime.buildHash = createHash("sha256").update(JSON.stringify(omitted.runtime.files)).digest("hex");
        putPrivate(installed.runtimeRoot, "tool-manifest.json", JSON.stringify(omitted));
        expect(existsSync(path.join(installed.runtimeRoot, member))).toBe(true);
        const omittedTool = checks.loadInstalledRecordTool(manifest);
        expect(() => configured.captureConfiguredDispatch({ ...selection, tool: omittedTool })).toThrow(/runtime-member-required/);
      } finally { putPrivate(installed.runtimeRoot, "tool-manifest.json", originalManifest); }
      expect(configured.captureConfiguredDispatch({ ...selection, tool }).capsule).toEqual(original);
    }
  } finally { f.cleanup(); }
});
