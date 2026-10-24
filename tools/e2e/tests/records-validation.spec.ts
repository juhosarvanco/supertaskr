import * as cp from "node:child_process";
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { captureRecordCandidateInputs, evaluateRecordCandidate, RECORD_INDEX_INPUTS } from "../scripts/records-validation.mjs";
import { captureRawCommittedInputs, captureCommittedInputs, readCommittedBoard } from "../scripts/records.mjs";
import { INDEXED_DOCS, INDEX_RULING, renderDocsIndex, renderDocsIndexFromSource } from "../scripts/docs-scan.mjs";
import { measureProductIdentity, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";

const ENV = { ...process.env, GIT_AUTHOR_NAME: "Candidate fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Candidate fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
const CARD = "docs/tasks/T-901-one.md";
const SECOND = "docs/tasks/T-902-two.md";
const CHAPTER = "docs/conventions/one.md";
const SUBJECT = new URL("../scripts/records-validation.mjs", import.meta.url).href;
function git(root: string, args: string[]) {
  return cp.execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function put(root: string, rel: string, content: string | Buffer) {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), content);
}
function commit(root: string, note: string) { git(root, ["add", "."]); git(root, ["commit", "-qm", note]); return git(root, ["rev-parse", "HEAD"]); }
function card(id = "T-901", extra = "") {
  return `---\nid: ${id}\ntitle: Candidate task\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: M\nstatus: planned\ntouches: [safe/file]\n${extra}---\n\nTask contract.\n\n## Acceptance criteria\n\n- Valid fixture.\n`;
}
function doc(heading: string, body = "The contract: Selected input.") { return `# ${heading}\n\n${body}\n\n## First\n\nText.\n`; }
function edit(relativePath: string, content: string, operation: "add" | "edit" = "edit") {
  return { operation, path: relativePath, type: "blob", mode: "100644", bytes: Buffer.from(content) };
}
function fixture() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "candidate-T-350-s1-")));
  // Sibling prefix collisions are intentional; selection uses canonical roots, not startsWith.
  const product = path.join(dir, "home"); const records = path.join(dir, "home-records");
  for (const root of [product, records]) {
    fs.mkdirSync(root); git(root, ["init", "-q", "--initial-branch=main"]);
    put(root, CARD, card("T-901", root === product ? "title_decoy: PRODUCT\n" : ""));
    for (const rel of INDEXED_DOCS) put(root, rel, doc(`${root === product ? "PRODUCT" : "RECORDS"} ${path.basename(rel)}`));
    put(root, "docs/ROADMAP.md", doc(root === product ? "PRODUCT roadmap" : "RECORDS roadmap") + "\n## Backbone\n\n- F-01: Selected feature — selected records lineage\n");
    put(root, "docs/CONVENTIONS.md", doc(root === product ? "PRODUCT conventions" : "RECORDS conventions") + `\n  - ${CHAPTER} — RULE\n`);
    put(root, CHAPTER, doc(root === product ? "PRODUCT chapter" : "RECORDS chapter") + "\n- RULE: fixture.\n");
    put(root, INDEX_RULING.file, root === product ? "PRODUCT RULING DECOY" : doc("Ruling") + `${INDEX_RULING.phrase} ROADMAP, ARCHITECTURE, CONVENTIONS and CAPABILITIES; unchanged set.\n`);
    commit(root, "independent input root");
  }
  const binding = { version: 1, projectId: "candidate-T-350-s1", productRoot: product, recordsRoot: records };
  put(product, WORKSPACE_BINDING_REL_PATH, JSON.stringify(binding));
  const identity = measureProductIdentity(product);
  put(records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify({ version: 1, projectId: binding.projectId,
    product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } }));
  const recordsRevision = commit(records, "portable association"); const productRevision = git(product, ["rev-parse", "HEAD"]);
  return { dir, product, records, options: { productRoot: product, recordsRevision, productRevision } };
}
function accepted(fx: ReturnType<typeof fixture>) {
  const capture = captureRecordCandidateInputs(fx.options);
  const result = evaluateRecordCandidate(capture, []);
  expect(result.failures).toEqual([]); expect(result.introducedDiagnostics).toEqual([]); expect(result.accepted).toBe(true);
  return capture;
}

test("frozen candidates evaluate exact explicit role revisions with detached identity and renderer bytes after live roots disappear", () => {
  const fx = fixture();
  try {
    const captured = accepted(fx);
    expect(captured.receipt).toMatchObject({ recordsCommit: fx.options.recordsRevision, productBase: fx.options.productRevision });
    expect(captured.identity.inputs.some((i: any) => i.role === "product" && i.path === "docs/CAPABILITIES.md")).toBe(true);
    const overlay = [edit("docs/ARCHITECTURE.md", doc("Private candidate architecture"))];
    const first = evaluateRecordCandidate(captured, overlay);
    expect(first.accepted).toBe(true); expect(first.outputs).toHaveLength(1);
    expect(first.outputs?.[0]?.content).toContain("Private candidate architecture");
    expect(first.outputs?.[0]?.content).toContain("PRODUCT CAPABILITIES.md");
    expect(first.outputs?.[0]?.content).not.toContain("RECORDS CAPABILITIES.md");
    expect(first.outputs?.[0]?.content).toContain("RECORDS roadmap");
    first.outputs?.[0]?.bytes.fill(0); expect(first.outputs?.[0]?.bytes.toString()).toContain("Private candidate architecture");
    expect(evaluateRecordCandidate(captured, [edit(CARD, card().replace("Candidate task", "Edited task"))]).accepted).toBe(true);
    const roadmap = fs.readFileSync(path.join(fx.records, "docs/ROADMAP.md"), "utf8").replace("F-01:", "F-02:");
    expect(evaluateRecordCandidate(captured, [edit("docs/ROADMAP.md", roadmap), edit(CARD, card().replace("F-01", "F-02"))]).accepted).toBe(true);
    put(fx.records, "docs/ROADMAP.md", "LIVE BROKEN INPUT"); commit(fx.records, "later records");
    put(fx.product, "docs/CAPABILITIES.md", "LIVE PRODUCT INPUT"); commit(fx.product, "later product");
    expect(captureRecordCandidateInputs(fx.options).digest).toBe(captured.digest);
    fs.rmSync(fx.records, { recursive: true }); fs.rmSync(fx.product, { recursive: true });
    const after = evaluateRecordCandidate(captured, overlay);
    expect(after).toEqual(first); expect(after.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(() => { (captured.identity.paths.records as any).push("decoy"); }).toThrow();
    overlay[0]!.bytes.fill(0); expect(evaluateRecordCandidate(captured, [edit("docs/ARCHITECTURE.md", doc("Private candidate architecture"))]).digest).toBe(first.digest);
  } finally { removeGitFixture(fx.dir, "candidate frozen T-350-s1"); }
});

test("raw historical malformed debt survives canonical comparison while repair succeeds and new malformed duplicate or unusable dependencies refuse", () => {
  const fx = fixture();
  const historical = "docs/tasks/T-903-history.md";
  try {
    put(fx.records, historical, "historical malformed card");
    fx.options.recordsRevision = commit(fx.records, "malformed historical debt");
    expect(() => captureCommittedInputs(fx.options)).toThrow(/records-card-malformed/);
    const raw = captureRawCommittedInputs(fx.options); expect(raw.read("records", historical).content).toBe("historical malformed card");
    const captured = accepted(fx);
    const unrelated = evaluateRecordCandidate(captured, [edit(CARD, card().replace("Candidate task", "Valid edit"))]);
    expect(unrelated.baselineDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "missing-frontmatter", file: historical })]));
    expect(unrelated.accepted).toBe(true);
    const rewrittenMalformed = evaluateRecordCandidate(captured, [edit(historical, "different malformed bytes")]);
    expect(rewrittenMalformed.accepted).toBe(false); expect(rewrittenMalformed.outputs).toBeUndefined();
    const repaired = evaluateRecordCandidate(captured, [edit(historical, card("T-903"))]);
    expect(repaired.accepted).toBe(true); expect(repaired.resolvedDiagnostics).toHaveLength(1);
    for (const overlay of [[edit(SECOND, "new malformed", "add")], [edit(SECOND, card("T-901"), "add")]]) {
      const result = evaluateRecordCandidate(captured, overlay); expect(result.accepted).toBe(false); expect(result.outputs).toBeUndefined(); expect(result.introducedDiagnostics.length).toBeGreaterThan(0);
    }
    put(fx.records, historical, card("T-903", "priority: wrong\n").replace("priority: 1\n", ""));
    fx.options.recordsRevision = commit(fx.records, "retained unusable target");
    const withDebt = accepted(fx);
    const dependency = evaluateRecordCandidate(withDebt, [edit(CARD, card("T-901", "blocked_by: [T-903]\n"))]);
    expect(dependency.accepted).toBe(false);
    expect(dependency.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "unusable-reference", file: CARD, field: "blocked_by", id: "T-903" })]));
    expect(dependency.outputs).toBeUndefined();
    const partiallyInvalid = card("T-903", "priority: wrong\nmilestone: wrong\n").replace("priority: 1\n", "").replace("milestone: 1\n", "");
    put(fx.records, historical, partiallyInvalid); put(fx.records, CARD, card("T-901", "blocked_by: [T-903]\n"));
    fx.options.recordsRevision = commit(fx.records, "two historical target failures with an existing reference");
    const partialCapture = accepted(fx);
    const mixed = semanticCase(partialCapture, [edit("docs/tasks/T-903-mixed-duplicate.md", card("T-903"), "add")], false, "mixed ordinary and new grouped target debt reports its actual group cause");
    const mixedReferences = mixed.introducedDiagnostics.filter((i: any) => i.kind === "unusable-reference");
    expect(mixedReferences.length).toBeGreaterThan(0);
    expect(mixedReferences.flatMap((i: any) => i.targets.flatMap((t: any) => t.issues)).every((i: any) => i.kind === "duplicate-id")).toBe(true);
    const partial = evaluateRecordCandidate(partialCapture, [edit(historical, partiallyInvalid.replace("milestone: wrong", "milestone: 1"))]);
    expect(partial.accepted).toBe(true); expect(partial.introducedDiagnostics).toEqual([]);
    const swappedTargetDebt = evaluateRecordCandidate(partialCapture, [edit(historical, partiallyInvalid.replace("milestone: wrong", "milestone: 1").replace("size: M", "size: wrong"))]);
    expect(swappedTargetDebt.accepted).toBe(false);
    expect(swappedTargetDebt.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "invalid-field", file: historical, field: "size" })]));
    put(fx.records, "docs/ROADMAP.md", doc("Historical roadmap without a backbone"));
    fx.options.recordsRevision = commit(fx.records, "unavailable feature reference space");
    const contextDebt = accepted(fx);
    const newFeature = evaluateRecordCandidate(contextDebt, [edit(CARD, card().replace("F-01", "F-02"))]);
    expect(newFeature.accepted).toBe(false);
    expect(newFeature.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "unavailable-reference-context", file: CARD, field: "feature", id: "F-02" })]));
    put(fx.records, "docs/ROADMAP.md", doc("Historical roadmap without a backbone") + "\n<!-- unclosed");
    fx.options.recordsRevision = commit(fx.records, "two unavailable reference context failures");
    const partialContext = evaluateRecordCandidate(accepted(fx), [edit("docs/ROADMAP.md", doc("Historical roadmap without a backbone"))]);
    expect(partialContext.accepted).toBe(true); expect(partialContext.introducedDiagnostics).toEqual([]);
  } finally { removeGitFixture(fx.dir, "candidate debt T-350-s1"); }
});

test("failure identities retain incoming references duplicate participants occurrence debt aliases cycles and assignments", () => {
  const fx = fixture();
  try {
    put(fx.records, SECOND, card("T-902", "blocked_by: [T-901]\n"));
    fx.options.recordsRevision = commit(fx.records, "incoming reference");
    const captured = accepted(fx);
    const deletion = evaluateRecordCandidate(captured, [{ operation: "delete", path: CARD }]);
    expect(deletion.accepted).toBe(false);
    expect(deletion.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "dangling-reference", file: SECOND, field: "blocked_by", id: "T-901" })]));
    const idChange = evaluateRecordCandidate(captured, [edit(CARD, card("T-904"))]); expect(idChange.accepted).toBe(false);
    for (const overlay of [[edit(CARD, card("T-901", "blocked_by: [T-902]\n"))],
      [edit("docs/tasks/T-0901-alias.md", card("T-0901"), "add")],
      [edit(CARD, card("T-901", "builder: required-model\nbuilt_by: other-model\n"))]]) {
      const r = evaluateRecordCandidate(captured, overlay); expect(r.accepted).toBe(false); expect(r.introducedDiagnostics.length).toBeGreaterThan(0);
    }
    put(fx.records, SECOND, card("T-902", "blocked_by: [T-999]\n")); fx.options.recordsRevision = commit(fx.records, "old dangling debt");
    const debt = accepted(fx);
    const swapped = evaluateRecordCandidate(debt, [edit(SECOND, card("T-902", "blocked_by: [T-998]\n"))]);
    expect(swapped.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "dangling-reference", id: "T-998" })])); expect(swapped.accepted).toBe(false);
    const sameTargetNewSource = evaluateRecordCandidate(debt, [edit(SECOND, card("T-902")), edit(CARD, card("T-901", "blocked_by: [T-999]\n"))]);
    expect(sameTargetNewSource.accepted).toBe(false);
    expect(sameTargetNewSource.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "dangling-reference", file: CARD, field: "blocked_by", id: "T-999" })]));
    const worsened = evaluateRecordCandidate(debt, [edit(SECOND, card("T-902", "blocked_by: [T-999, T-999]\n"))]);
    expect(worsened.introducedDiagnostics).toHaveLength(1); expect(worsened.accepted).toBe(false);
    put(fx.records, "docs/tasks/T-901-duplicate.md", card()); fx.options.recordsRevision = commit(fx.records, "old duplicate debt");
    const duplicate = accepted(fx);
    const third = evaluateRecordCandidate(duplicate, [edit("docs/tasks/T-901-third.md", card(), "add")]);
    const replacedParticipant = evaluateRecordCandidate(duplicate, [{ operation: "delete", path: "docs/tasks/T-901-duplicate.md" }, edit("docs/tasks/T-901-third.md", card(), "add")]);
    expect(replacedParticipant.accepted).toBe(false);
    expect(third.accepted).toBe(false); expect(third.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "duplicate-id", files: expect.arrayContaining(["docs/tasks/T-901-third.md"]) })]));
    put(fx.records, SECOND, card("T-902", "blocked_by: [T-901]\n")); put(fx.records, "docs/tasks/T-901-third.md", card());
    fx.options.recordsRevision = commit(fx.records, "three historical duplicate participants with incoming references");
    const duplicateDebt = accepted(fx);
    const removal = evaluateRecordCandidate(duplicateDebt, [{ operation: "delete", path: "docs/tasks/T-901-third.md" }]);
    expect(removal.accepted).toBe(true); expect(removal.introducedDiagnostics).toEqual([]);
    const fourth = evaluateRecordCandidate(duplicateDebt, [edit("docs/tasks/T-901-fourth.md", card(), "add")]);
    expect(fourth.accepted).toBe(false);
    expect(fourth.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "duplicate-id", files: expect.arrayContaining(["docs/tasks/T-901-fourth.md"]) })]));
    const newDuplicateDependency = evaluateRecordCandidate(duplicateDebt, [edit("docs/tasks/T-904-new-reference.md", card("T-904", "blocked_by: [T-901]\n"), "add")]);
    expect(newDuplicateDependency.accepted).toBe(false);
    expect(newDuplicateDependency.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "unusable-reference", file: "docs/tasks/T-904-new-reference.md", id: "T-901" })]));
  } finally { removeGitFixture(fx.dir, "candidate identities T-350-s1"); }
});

test("candidate input modes paths operations and missing selected context fail explicitly with no role fallback", () => {
  const fx = fixture();
  try {
    const captured = accepted(fx);
    for (const mode of ["120000", "160000", "040000", "100600"]) {
      const r = evaluateRecordCandidate(captured, [{ ...edit(CARD, card()), mode }]);
      expect(r.accepted).toBe(false); expect(r.failures[0]?.code).toBe("records-overlay-not-regular"); expect(r.outputs).toBeUndefined();
    }
    for (const operation of [{ ...edit(CARD, card()), type: "tree" }, { ...edit(CARD, card()), bytes: undefined },
      edit("../docs/tasks/T-903.md", card()), edit("docs/CAPABILITIES.md", doc("decoy")), edit("docs/tasks/T-903.md", card()),
      { operation: "delete", path: CARD, mode: "100644" }, edit(CARD, card(), "add")]) {
      const r = evaluateRecordCandidate(captured, [operation as any]); expect(r.accepted).toBe(false); expect(r.failures.length).toBeGreaterThan(0);
    }
    expect(evaluateRecordCandidate(captured, [edit(CARD, card()), edit(CARD, card())]).failures[0]?.code).toBe("records-overlay-duplicate-path");
    const typedMetadata = new Uint8Array([1]);
    const typedRejection = evaluateRecordCandidate(captured, [{ operation: "edit", path: "docs/INDEX.md", type: typedMetadata } as any]);
    expect(typedRejection.accepted).toBe(false); expect(typedRejection.failures[0]?.code).toBe("records-overlay-path-unselected");
    expect([...typedMetadata]).toEqual([1]);
    const plainMetadata = { nested: { marker: 1 } };
    for (const field of ["type", "mode"]) {
      const rejected = evaluateRecordCandidate(captured, [{ ...edit(CARD, card()), [field]: plainMetadata } as any]);
      expect(rejected.accepted).toBe(false); expect(rejected.failures[0]?.code).toBe("records-overlay-not-regular");
      expect(Object.isFrozen(plainMetadata)).toBe(false); expect(Object.isFrozen(plainMetadata.nested)).toBe(false);
    }
    plainMetadata.nested.marker = 2; expect(plainMetadata.nested.marker).toBe(2);
    expect(() => evaluateRecordCandidate({} as any, [])).toThrow(/records-candidate-not-materialized/);
    expect(() => captureRawCommittedInputs({ ...fx.options, productRoot: undefined } as any)).toThrow(/records-explicit-inputs-required/);
    expect(() => captureRawCommittedInputs(fx.options).paths("decoy" as any)).toThrow(/records-input-role-invalid/);
    fs.rmSync(path.join(fx.records, "docs/ARCHITECTURE.md")); fx.options.recordsRevision = commit(fx.records, "missing selected records document");
    expect(() => captureRecordCandidateInputs(fx.options)).toThrow(/records-input-missing.*records:docs\/ARCHITECTURE.md/);
    put(fx.records, "docs/ARCHITECTURE.md", doc("restored")); fs.rmSync(path.join(fx.product, "docs/CAPABILITIES.md")); fx.options.productRevision = commit(fx.product, "missing selected product input");
    fx.options.recordsRevision = commit(fx.records, "restore records");
    expect(() => captureRecordCandidateInputs(fx.options)).toThrow(/records-input-missing.*product:docs\/CAPABILITIES.md/);
    put(fx.product, "docs/CAPABILITIES.md", doc("product restored")); fx.options.productRevision = commit(fx.product, "restore product");
    fs.rmSync(path.join(fx.records, CARD)); fs.symlinkSync("../ROADMAP.md", path.join(fx.records, CARD)); fx.options.recordsRevision = commit(fx.records, "unsupported captured symlink");
    expect(() => captureRecordCandidateInputs(fx.options)).toThrow(/records-entry-not-regular/);
    fs.rmSync(path.join(fx.records, CARD)); put(fx.records, CARD, card());
    fx.options.recordsRevision = commit(fx.records, "restore regular card");
    git(fx.records, ["update-index", "--cacheinfo", `160000,${fx.options.recordsRevision},${CARD}`]); git(fx.records, ["commit", "-qm", "captured gitlink"]);
    const gitlinkRevision = git(fx.records, ["rev-parse", "HEAD"]);
    expect(() => captureRecordCandidateInputs({ ...fx.options, recordsRevision: gitlinkRevision })).toThrow(/records-entry-not-regular/);
    git(fx.records, ["reset", "--hard", fx.options.recordsRevision]);
    fs.rmSync(path.join(fx.records, "docs/conventions"), { recursive: true }); put(fx.records, "docs/conventions", "not a directory");
    fx.options.recordsRevision = commit(fx.records, "unavailable chapter namespace");
    expect(() => captureRecordCandidateInputs(fx.options)).toThrow(/records-entry-not-regular.*docs\/conventions/);
  } finally { removeGitFixture(fx.dir, "candidate input boundaries T-350-s1"); }
});

test("captured renderer preserves legacy bytes and chapter order while overlay addition deletion and malformed inputs are atomic", () => {
  const fx = fixture();
  try {
    const captured = accepted(fx);
    const legacy = renderDocsIndex(fx.records);
    const files = new Map([...INDEXED_DOCS, CHAPTER].map((rel) => [rel, fs.readFileSync(path.join(fx.records, rel), "utf8")]));
    expect(renderDocsIndexFromSource({ read: (rel) => files.get(rel)!, paths: () => [...files.keys()] })).toBe(legacy);
    // Equal classified inputs must yield exactly the same legacy bytes.
    put(fx.product, "docs/CAPABILITIES.md", files.get("docs/CAPABILITIES.md")!); fx.options.productRevision = commit(fx.product, "equal product input");
    const equal = captureRecordCandidateInputs(fx.options);
    const nextChapter = "docs/conventions/two.md";
    const convention = files.get("docs/CONVENTIONS.md")! + `\n  - ${nextChapter} — NEXT\n`;
    const added = evaluateRecordCandidate(equal, [edit("docs/CONVENTIONS.md", convention), edit(nextChapter, doc("New chapter") + "\n- NEXT: fixture.\n", "add")]);
    expect(added.accepted).toBe(true); expect(added.outputs?.[0]?.content).toContain("New chapter");
    expect(added.outputs?.[0]?.content.indexOf("RECORDS chapter")).toBeLessThan(added.outputs?.[0]?.content.indexOf("New chapter") ?? 0);
    const deleted = evaluateRecordCandidate(captured, [edit("docs/CONVENTIONS.md", doc("Conventions without chapters")), { operation: "delete", path: CHAPTER }]);
    expect(deleted.accepted).toBe(true); expect(deleted.outputs?.[0]?.content).not.toContain(CHAPTER);
    const missing = evaluateRecordCandidate(captured, [{ operation: "delete", path: CHAPTER }]);
    expect(missing.accepted).toBe(false); expect(missing.outputs).toBeUndefined(); expect(missing.failures[0]?.message).toContain(CHAPTER);
    const malformed = evaluateRecordCandidate(captured, [edit("docs/ARCHITECTURE.md", "no heading or prose")]);
    expect(malformed.accepted).toBe(false); expect(malformed.outputs).toBeUndefined(); expect(malformed.failures[0]?.message).toContain("docs/ARCHITECTURE.md");
    expect(RECORD_INDEX_INPUTS.map((i) => i.path)).toEqual(INDEXED_DOCS);
    expect(evaluateRecordCandidate(equal, [edit("docs/ARCHITECTURE.md", files.get("docs/ARCHITECTURE.md")!)]).outputs).toEqual([]);
    put(fx.records, "docs/ARCHITECTURE.md", "malformed baseline"); fx.options.recordsRevision = commit(fx.records, "unavailable baseline index");
    const unavailable = evaluateRecordCandidate(captureRecordCandidateInputs(fx.options), [edit("docs/ARCHITECTURE.md", doc("repair"))]);
    expect(unavailable.accepted).toBe(false); expect(unavailable.failures[0]?.kind).toBe("baseline-context-unavailable");
  } finally { removeGitFixture(fx.dir, "candidate chapters T-350-s1"); }
});

test("pure evaluation observes no command write or ref effects on accepted and rejected results and its effect controls discriminate", () => {
  const fx = fixture();
  try {
    accepted(fx);
    const before = [fx.product, fx.records].map((root) => ({ head: git(root, ["rev-parse", "HEAD"]), refs: git(root, ["show-ref"]), status: git(root, ["status", "--porcelain"]), index: fs.readFileSync(path.join(root, ".git/index")).toString("base64") }));
    const result = cp.spawnSync(process.execPath, ["--input-type=module", "-e", `
      import fs from 'node:fs'; import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module';
      const api=await import(${JSON.stringify(SUBJECT)});
      const captured=api.captureRecordCandidateInputs(${JSON.stringify(fx.options)});
      const calls=[];const trap=name=>(...args)=>{calls.push(name);throw Error('EFFECT '+name)};
      for(const name of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork'])cp[name]=trap(name);
      for(const name of ['writeFileSync','appendFileSync','mkdirSync','renameSync','unlinkSync','rmSync','chmodSync','openSync','readFileSync','readdirSync','statSync','realpathSync'])fs[name]=trap(name);
      for(const name of ['writeFile','appendFile','mkdir','rename','unlink','rm','chmod','open','readFile','readdir','stat','realpath'])fs.promises[name]=trap('promises.'+name);
      syncBuiltinESMExports();
      const good=api.evaluateRecordCandidate(captured,[]);
      const bad=api.evaluateRecordCandidate(captured,[{operation:'edit',path:${JSON.stringify(CARD)},type:'blob',mode:'100644',bytes:Buffer.from('bad')}]);
      if(!good.accepted||bad.accepted||bad.outputs!==undefined||calls.length)throw Error('pure evaluation boundary '+JSON.stringify({good,bad,calls}));
      for(const control of [()=>cp.spawnSync('git',['status']),()=>fs.writeFileSync(${JSON.stringify(path.join(fx.product, "effect-control"))},'x')]){
        try{control();throw Error('missed effect')}catch(err){if(!String(err).includes('EFFECT'))throw err}
      }
      console.log(JSON.stringify({good:good.accepted,bad:bad.accepted,calls}));
    `], { encoding: "utf8", env: ENV });
    expect(result.status, result.stderr).toBe(0); expect(JSON.parse(result.stdout)).toEqual({ good: true, bad: false, calls: ["spawnSync", "writeFileSync"] });
    const after = [fx.product, fx.records].map((root) => ({ head: git(root, ["rev-parse", "HEAD"]), refs: git(root, ["show-ref"]), status: git(root, ["status", "--porcelain"]), index: fs.readFileSync(path.join(root, ".git/index")).toString("base64") }));
    expect(after).toEqual(before); expect(fs.existsSync(path.join(fx.product, "effect-control"))).toBe(false);
    expect(readCommittedBoard(fx.options).tasks).toHaveLength(1);
  } finally { removeGitFixture(fx.dir, "candidate effects T-350-s1"); }
});

function component(id: string, suffix: string, extra = "") {
  return `---\nid: ${id}\nname: Fixture ${suffix}\npaths: [safe/${id}-${suffix}]\n${extra}---\n`;
}
function semanticCase(captured: ReturnType<typeof captureRecordCandidateInputs>, overlay: any, expected: boolean, label: string) {
  const r = evaluateRecordCandidate(captured, overlay);
  console.log("semantic-case", JSON.stringify({ label, expected, accepted: r.accepted, failures: r.failures,
    baselineDiagnostics: r.baselineDiagnostics, candidateDiagnostics: r.candidateDiagnostics,
    introducedDiagnostics: r.introducedDiagnostics, resolvedDiagnostics: r.resolvedDiagnostics }));
  expect(r.accepted, label).toBe(expected);
  if (expected) expect(r.introducedDiagnostics, label).toEqual([]);
  else expect(r.introducedDiagnostics.length, label).toBeGreaterThan(0);
  return r;
}

test("typed duplicate groups preserve first middle last removal and ordering while new participants references and occurrences reject", () => {
  for (const space of ["task", "component"] as const) {
    const fx = fixture();
    try {
      const root = space === "task" ? "docs/tasks" : "docs/architecture/components";
      const id = space === "task" ? "T-901" : "C-901";
      const ref = `${root}/${space === "task" ? "T-902" : "C-902"}-reference.md`;
      const make = (suffix: string) => space === "task" ? card(id) : component(id, suffix);
      const reference = (twice = false) => space === "task" ? card("T-902", `blocked_by: [${id}${twice ? `, ${id}` : ""}]\n`)
        : component("C-902", "reference", `depends_on: [${id}${twice ? `, ${id}` : ""}]\n`);
      if (space === "task") fs.rmSync(path.join(fx.records, CARD));
      const members = ["a", "b", "c"].map((suffix) => `${root}/${id}-${suffix}.md`);
      for (const [i, member] of members.entries()) put(fx.records, member, make(String(i)));
      put(fx.records, ref, reference()); fx.options.recordsRevision = commit(fx.records, `${space} duplicate matrix`);
      const captured = accepted(fx);
      for (const member of members) semanticCase(captured, [{ operation: "delete", path: member }], true, `${space} remove ${member}`);
      const deletion = { operation: "delete", path: members[0] };
      const a = semanticCase(captured, [deletion, edit(members[1]!, make("1"))], true, `${space} delete/edit order`);
      const b = semanticCase(captured, [edit(members[1]!, make("1")), deletion], true, `${space} edit/delete order`);
      expect(a.candidateDiagnostics).toEqual(b.candidateDiagnostics);
      const fourth = edit(`${root}/${id}-d.md`, make("d"), "add");
      semanticCase(captured, [fourth], false, `${space} fourth participant`);
      semanticCase(captured, [deletion, fourth], false, `${space} replacement participant`);
      semanticCase(captured, [deletion, edit(ref, reference(true))], false, `${space} shrinking group cannot pay for reference occurrence`);
      const newcomer = space === "task" ? card("T-904", `blocked_by: [${id}]\n`) : component("C-904", "new", `depends_on: [${id}]\n`);
      semanticCase(captured, [deletion, edit(`${root}/${space === "task" ? "T-904" : "C-904"}-new.md`, newcomer, "add")], false, `${space} new reference to retained group`);
    } finally { removeGitFixture(fx.dir, "duplicate semantic matrix T-350-s1"); }
  }
});

test("typed alias participants and actual cyclic reference occurrences retain shrinking historical groups without hiding new debt", () => {
  for (const space of ["task", "component"] as const) {
    const fx = fixture();
    try {
      const root = space === "task" ? "docs/tasks" : "docs/architecture/components";
      const ids = space === "task" ? ["T-901", "T-0901", "T-00901"] : ["C-901", "C-0901", "C-00901"];
      if (space === "task") fs.rmSync(path.join(fx.records, CARD));
      const members = ids.map((id) => `${root}/${id}-alias.md`);
      for (const [i, id] of ids.entries()) put(fx.records, members[i]!, space === "task" ? card(id) : component(id, String(i)));
      const ref = `${root}/${space === "task" ? "T-902" : "C-902"}-reference.md`;
      const reference = (twice = false) => space === "task" ? card("T-902", `blocked_by: [${ids[1]}${twice ? `, ${ids[1]}` : ""}]\n`)
        : component("C-902", "reference", `depends_on: [${ids[1]}${twice ? `, ${ids[1]}` : ""}]\n`);
      put(fx.records, ref, reference()); fx.options.recordsRevision = commit(fx.records, `${space} alias matrix`);
      const captured = accepted(fx);
      // Keep the exact referenced spelling; removing that identity would be a new dangling reference.
      for (const member of [members[0]!, members[2]!]) semanticCase(captured, [{ operation: "delete", path: member }], true, `${space} alias shrink ${member}`);
      const deletion = { operation: "delete", path: members[0] };
      semanticCase(captured, [deletion, edit(ref, reference(true))], false, `${space} alias shrink plus extra occurrence`);
      const id = space === "task" ? "T-000901" : "C-000901";
      semanticCase(captured, [deletion, edit(`${root}/${id}-new.md`, space === "task" ? card(id) : component(id, "new"), "add")], false, `${space} alias participant swap`);
    } finally { removeGitFixture(fx.dir, "alias semantic matrix T-350-s1"); }
  }
  const fx = fixture();
  try {
    const ids = ["T-901", "T-902", "T-903"];
    const paths = [CARD, SECOND, "docs/tasks/T-903-third.md"];
    const ref = "docs/tasks/T-904-reference.md";
    const graph = (id: string, remaining = ids) => card(id, `blocked_by: [${remaining.filter((x) => x !== id).join(", ")}]\n`);
    for (const [i, id] of ids.entries()) put(fx.records, paths[i]!, graph(id));
    put(fx.records, ref, card("T-904", `blocked_by: [${ids.join(", ")}]\n`));
    fx.options.recordsRevision = commit(fx.records, "complete historical SCC with incoming references"); const captured = accepted(fx);
    for (const [i, removed] of ids.entries()) {
      const remaining = ids.filter((id) => id !== removed);
      const overlay = [{ operation: "delete", path: paths[i] }, ...remaining.map((id) => edit(paths[ids.indexOf(id)]!, graph(id, remaining))),
        edit(ref, card("T-904", `blocked_by: [${remaining.join(", ")}]\n`))];
      semanticCase(captured, overlay, true, `SCC remove ${removed} with retained references`);
      semanticCase(captured, [...overlay.slice(0, -1), edit(ref, card("T-904", `blocked_by: [${remaining[0]}, ${remaining.join(", ")}]\n`))], false, `SCC shrink plus extra incoming occurrence ${removed}`);
    }
    semanticCase(captured, [edit(CARD, card("T-901", "blocked_by: [T-901, T-902, T-903]\n"))], false, "SCC same vertices plus new cyclic self edge");
    semanticCase(captured, [edit("docs/tasks/T-905-new.md", card("T-905", "blocked_by: [T-902]\n"), "add")], false, "new reference to retained SCC");
  } finally { removeGitFixture(fx.dir, "cycle semantic matrix T-350-s1"); }
});

test("feature duplicate and alias declaration payload multisets survive line shifts and reordering but retain multiplicity and new participant rejection", () => {
  const fx = fixture();
  try {
    const declarations = ["- F-01: A — alpha", "- F-01: B — beta", "- F-01: C — gamma"];
    const roadmap = (lines: string[]) => doc("Feature matrix") + `\n## Backbone\n\n${lines.join("\n")}\n`;
    put(fx.records, "docs/ROADMAP.md", roadmap(declarations)); fx.options.recordsRevision = commit(fx.records, "feature duplicate declarations");
    const captured = accepted(fx);
    for (let i = 0; i < declarations.length; i++) semanticCase(captured, [edit("docs/ROADMAP.md", roadmap(declarations.filter((_, j) => i !== j)))], true, `feature remove declaration ${i}`);
    semanticCase(captured, [edit("docs/ROADMAP.md", roadmap([declarations[2]!, declarations[0]!, declarations[1]!]))], true, "feature reorder complete declarations");
    semanticCase(captured, [edit("docs/ROADMAP.md", roadmap([...declarations, "- F-01: D — delta"]))], false, "feature fourth declaration");
    semanticCase(captured, [edit("docs/ROADMAP.md", roadmap([declarations[0]!, declarations[2]!, "- F-01: D — delta"]))], false, "feature declaration payload swap");
    semanticCase(captured, [edit("docs/ROADMAP.md", roadmap(declarations.slice(1))), edit(SECOND, card("T-902"), "add")], false, "feature shrink plus new reference");
    put(fx.records, "docs/ROADMAP.md", roadmap([declarations[0]!, declarations[0]!, declarations[0]!]));
    fx.options.recordsRevision = commit(fx.records, "identical feature declaration occurrences"); const repeated = accepted(fx);
    semanticCase(repeated, [edit("docs/ROADMAP.md", roadmap([declarations[0]!, declarations[0]!]))], true, "identical feature occurrence removal");
    semanticCase(repeated, [edit("docs/ROADMAP.md", roadmap([declarations[0]!, declarations[0]!, declarations[0]!, declarations[0]!]))], false, "identical feature occurrence worsening");
    const aliases = ["- F-1: A — alpha", "- F-01: B — beta", "- F-001: C — gamma"];
    put(fx.records, "docs/ROADMAP.md", roadmap(aliases)); fx.options.recordsRevision = commit(fx.records, "feature aliases"); const aliased = accepted(fx);
    for (const i of [0, 2]) semanticCase(aliased, [edit("docs/ROADMAP.md", roadmap(aliases.filter((_, j) => i !== j)))], true, `feature alias remove ${i}`);
    semanticCase(aliased, [edit("docs/ROADMAP.md", roadmap([aliases[2]!, aliases[1]!, aliases[0]!]))], true, "feature alias line-only reorder");
    semanticCase(aliased, [edit("docs/ROADMAP.md", roadmap([aliases[1]!, aliases[2]!, "- F-0001: D — delta"]))], false, "feature alias participant replacement");
  } finally { removeGitFixture(fx.dir, "feature semantic matrix T-350-s1"); }
});

test("rejected unevaluated overlays report no resolved debt while completed diagnostics survive a later rendering refusal", () => {
  const fx = fixture();
  try {
    put(fx.records, CARD, card("T-901", "blocked_by: [T-902]\n")); put(fx.records, SECOND, card("T-902").replace("priority: 1", "priority: wrong"));
    fx.options.recordsRevision = commit(fx.records, "historical target debt for rejected-input reporting"); const captured = accepted(fx);
    for (const overlay of [null, [{ ...edit(CARD, card()), mode: "160000" }], [edit(SECOND, card("T-902")), edit("docs/INDEX.md", "bad")]]) {
      const r = evaluateRecordCandidate(captured, overlay as any);
      expect(r.accepted).toBe(false); expect(r.failures.length).toBeGreaterThan(0); expect(r.baselineDiagnostics.length).toBeGreaterThan(0);
      expect(r.candidateDiagnostics).toEqual([]); expect(r.resolvedDiagnostics).toEqual([]);
    }
    const late = evaluateRecordCandidate(captured, [edit(SECOND, card("T-902")), edit(CHAPTER, "# Missing required rule\n")]);
    expect(late.accepted).toBe(false); expect(late.failures.length).toBeGreaterThan(0); expect(late.candidateDiagnostics).toEqual([]);
    expect(late.resolvedDiagnostics).toEqual(late.baselineDiagnostics); expect(late.outputs).toBeUndefined();
  } finally { removeGitFixture(fx.dir, "unevaluated reporting T-350-s1"); }
});


test("T-350-s1 VC1 — captured document bytes retain the legacy BOM refusal", () => {
  const fx = fixture();
  try {
    accepted(fx);
    expect(renderDocsIndex(fx.records)).toContain("RECORDS ARCHITECTURE.md");
    put(fx.records, "docs/ARCHITECTURE.md", "\uFEFF" + doc("BOM architecture"));
    fx.options.recordsRevision = commit(fx.records, "BOM captured document");
    expect(() => renderDocsIndex(fx.records)).toThrow(/docs\/ARCHITECTURE\.md has no top-level heading/);
    const result = evaluateRecordCandidate(captureRecordCandidateInputs(fx.options), []);
    expect(result.accepted, "captured BOM document must retain legacy renderer refusal").toBe(false);
    expect(result.outputs).toBeUndefined();
    expect(result.failures).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "baseline-context-unavailable" })]));
  } finally { removeGitFixture(fx.dir, "verifier captured BOM compatibility T-350-s1"); }
});

test("T-350-s1 VC2 — overlay document bytes retain the legacy BOM refusal", () => {
  const fx = fixture();
  try {
    const captured = accepted(fx);
    expect(renderDocsIndex(fx.records)).toContain("RECORDS ARCHITECTURE.md");
    const document = "\uFEFF" + doc("BOM architecture");
    put(fx.records, "docs/ARCHITECTURE.md", document);
    expect(() => renderDocsIndex(fx.records)).toThrow(/docs\/ARCHITECTURE\.md has no top-level heading/);
    const result = evaluateRecordCandidate(captured, [edit("docs/ARCHITECTURE.md", document)]);
    expect(result.accepted, "overlay BOM document must retain legacy renderer refusal").toBe(false);
    expect(result.outputs).toBeUndefined();
    expect(result.failures).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "candidate-input-invalid" })]));
  } finally { removeGitFixture(fx.dir, "verifier overlay BOM compatibility T-350-s1"); }
});
