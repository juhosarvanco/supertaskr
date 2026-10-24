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
    put(fx.records, "docs/ROADMAP.md", doc("Historical roadmap without a backbone"));
    fx.options.recordsRevision = commit(fx.records, "unavailable feature reference space");
    const contextDebt = accepted(fx);
    const newFeature = evaluateRecordCandidate(contextDebt, [edit(CARD, card().replace("F-01", "F-02"))]);
    expect(newFeature.accepted).toBe(false);
    expect(newFeature.introducedDiagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "unavailable-reference-context", file: CARD, field: "feature", id: "F-02" })]));
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
