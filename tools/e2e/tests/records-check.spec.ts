import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { createRecordChecker, checkedRecordWriteSet, loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";
import { privateRecordFixture, putPrivate, commitPrivate, sha } from "./private-record-fixture";

const edit = (file: string, text: string, operation = "edit") => ({ operation, path: file, type: "blob", mode: "100644", bytes: Buffer.from(text) });
test("generic private checks use an independent Python product and verified installed method context without dogfood files", () => {
  const f = privateRecordFixture();
  try {
    const tool = loadInstalledRecordTool(f.manifestPath), checker = createRecordChecker({ profile: GENERIC_RECORD_PROFILE, tool });
    const capture = checker.capture(f.options);
    expect(existsSync(path.join(f.product, "lib/parser"))).toBe(false); expect(existsSync(path.join(f.product, "docs"))).toBe(false);
    expect(existsSync(path.join(f.records, "docs/CAPABILITIES.md"))).toBe(false);
    const result = checker.evaluate(capture, [edit("docs/rooms/note.md", "# Private note\n\nChanged private text.\n")]);
    expect(result.accepted).toBe(true); expect(result.tool.methodVersion).toMatch(/^\d+\./);
    expect(result.baselineIndexStale).toBe(true); expect(result.derivations).toEqual([expect.objectContaining({ path: "docs/INDEX.md" })]);
    const writes = checkedRecordWriteSet(result).writes;
    expect(writes.map((w: any) => w.path)).toEqual(["docs/rooms/note.md", "docs/INDEX.md"]);
    expect(writes[1]?.bytes.toString()).toContain("**Architecture**");
    rmSync(f.product, { recursive: true }); rmSync(f.records, { recursive: true }); rmSync(f.tool, { recursive: true });
    expect(checker.evaluate(capture, [edit("docs/reviews/new-review.md", "# Draft review\n\nUnapproved draft.\n", "add")]).accepted).toBe(true);
  } finally { f.cleanup(); }
});

test("generic configuration is complete and protected while installed missing or changed assets refuse", () => {
  const f = privateRecordFixture();
  try {
    const tool = loadInstalledRecordTool(f.manifestPath);
    expect(() => createRecordChecker({ profile: { ...GENERIC_RECORD_PROFILE, indexInputs: ["docs/ROADMAP.md"] }, tool })).toThrow(/records-profile-invalid/);
    const checker = createRecordChecker({ profile: GENERIC_RECORD_PROFILE, tool });
    expect(() => checker.capture({ ...f.options, profile: GENERIC_RECORD_PROFILE } as any)).toThrow(/records-check-request/);
    putPrivate(f.tool, "dist/method/docs-protocol.md", "changed installed method\n");
    expect(() => checker.capture(f.options)).toThrow(/records-tool-asset-changed/);
    expect(() => loadInstalledRecordTool(path.join(f.dir, "absent-manifest.json"))).toThrow(/records-tool-assets-unavailable/);
  } finally { f.cleanup(); }
});

test("installed runtime owners and entry bytes are paired even when package versions are unchanged", () => {
  const f = privateRecordFixture();
  try {
    const before = loadInstalledRecordTool(f.manifestPath), manifest = JSON.parse(readFileSync(f.manifestPath, "utf8"));
    expect(before.runtimeDigest).toMatch(/^[0-9a-f]{64}$/);
    const file = "tools/e2e/scripts/records-save.mjs", changed = readFileSync(path.join(f.tool, "dist", file), "utf8") + "\n// Another same-version build.\n";
    putPrivate(f.tool, `dist/${file}`, changed);
    expect(() => loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-asset-changed/);
    manifest.runtime.files.find((entry: any) => entry.path === file).sha256 = sha(changed);
    manifest.runtime.buildHash = sha(JSON.stringify(manifest.runtime.files));
    putPrivate(f.tool, "dist/tool-manifest.json", JSON.stringify(manifest));
    expect(() => loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
  } finally { f.cleanup(); }
});

test("private checks compose complete finite creation rename and exact derived writes while protecting generated inputs", () => {
  const f = privateRecordFixture();
  try {
    const checker = createRecordChecker({ profile: GENERIC_RECORD_PROFILE, tool: loadInstalledRecordTool(f.manifestPath) }), capture = checker.capture(f.options);
    const candidate = [
      { operation: "delete", path: "docs/rooms/note.md" },
      edit("docs/rooms/moved.md", readFileSync(path.join(f.records, "docs/rooms/note.md"), "utf8"), "add"),
      edit("docs/plans/new-plan.md", "# Draft plan\n\nPlanning text.\n", "add"),
      edit("docs/reviews/new-review.md", "# Draft review\n\nReview text.\n", "add"),
      edit("docs/decisions/099-draft.md", "# Draft decision\n\nAwaiting owner disposition.\n", "add"),
      ...["docs/VERSIONS.md", "docs/future.md", "docs/design/plan.md", "docs/guide/usage.md", "docs/reference/note.md", "docs/research/captures/note.md", "docs/business/plan.md", "docs/benches/README.md", "docs/architecture/explanation.md"].map((file) => edit(file, "# Private draft\n\nExplicit text class.\n", "add")),
    ];
    const result = checker.evaluate(capture, candidate);
    expect(result.accepted).toBe(true); expect(checkedRecordWriteSet(result).writes).toHaveLength(candidate.length + 1);
    expect(result.procedural.some((entry: any) => entry.kind === "owner-voice")).toBe(true);
    for (const file of ["docs/INDEX.md", "docs/CAPABILITIES.md", "docs/assets/file.md", ".supertaskr/grant.md"]) {
      expect(checker.evaluate(capture, [edit(file, "unsupported", "add")]).accepted).toBe(false);
    }
    const suggested = "---\nstatus: suggested\ntitle: Proposed task\nsuggested_by: fixture user\n---\n\nA draft suggestion.\n";
    expect(checker.evaluate(capture, [edit("docs/tasks/T-999-suggestion.md", suggested, "add")]).accepted).toBe(true);
  } finally { f.cleanup(); }
});

test("candidate budgets and checkpoint freshness distinguish blocking edits retained debt and procedural amendments", () => {
  const f = privateRecordFixture();
  try {
    const profile = { ...GENERIC_RECORD_PROFILE, budgets: { "docs/rooms/note.md": { warn: 40, fail: 80 } } };
    putPrivate(f.records, "docs/rooms/note.md", "# Private note\n\n" + "old debt ".repeat(30));
    f.options.recordsRevision = commitPrivate(f.records);
    const checker = createRecordChecker({ profile, tool: loadInstalledRecordTool(f.manifestPath) }), capture = checker.capture(f.options);
    const unrelated = checker.evaluate(capture, [edit("docs/reviews/new.md", "# Draft\n\nReview notes.\n", "add")]);
    expect(unrelated.accepted).toBe(true); expect(unrelated.retained.some((entry: any) => entry.kind === "document-budget")).toBe(true);
    expect(checker.evaluate(capture, [edit("docs/rooms/note.md", "# Oversized\n\n" + "new ".repeat(40))]).accepted).toBe(false);
    const checkpoint = edit("docs/checkpoints/2026-10-29-test.md", "# Checkpoint\n\nRecorded result.\n", "add");
    const missing = checker.evaluate(capture, [checkpoint]); expect(missing.accepted).toBe(false);
    expect(missing.blocking.some((entry: any) => entry.kind === "checkpoint-state-required")).toBe(true);
    const state = readFileSync(path.join(f.records, "docs/STATE.md"), "utf8");
    expect(checker.evaluate(capture, [checkpoint, edit("docs/STATE.md", state + "\nNew state fact.\n")]).accepted).toBe(true);
  } finally { f.cleanup(); }
});

test("checkpoint history stays at the selected records commit and reads creation rather than latest append", () => {
  const f = privateRecordFixture();
  try {
    const record = "docs/checkpoints/2026-10-30-one.md";
    putPrivate(f.records, record, "# Checkpoint\n\nOriginal integration.\n");
    putPrivate(f.records, "docs/STATE.md", "# State\n\nCurrent checkpoint facts.\n");
    const selected = commitPrivate(f.records, "2026-10-30T10:00:00Z");
    const checker = createRecordChecker({ profile: GENERIC_RECORD_PROFILE, tool: loadInstalledRecordTool(f.manifestPath) });
    const frozen = checker.capture({ ...f.options, recordsRevision: selected });
    putPrivate(f.records, record, "# Checkpoint\n\nOriginal integration.\n\nLater reading appended.\n");
    const amended = commitPrivate(f.records, "2026-10-31T10:00:00Z");
    const afterAppend = checker.capture({ ...f.options, recordsRevision: amended });
    const result = checker.evaluate(afterAppend, [edit("docs/reviews/unrelated.md", "# Review\n\nDraft text.\n", "add")]);
    expect(result.retained.some((entry: any) => entry.kind === "state-stale")).toBe(false);
    const amendment = checker.evaluate(afterAppend, [edit(record, readFileSync(path.join(f.records, record), "utf8") + "\nAnother reading.\n")]);
    expect(amendment.procedural.some((entry: any) => entry.kind === "state-fact-amendment")).toBe(true);
    putPrivate(f.records, "docs/checkpoints/2026-11-01-unregenerated.md", "# Later checkpoint\n\nMissing state update.\n");
    const later = commitPrivate(f.records, "2026-11-01T10:00:00Z");
    expect(checker.evaluate(frozen, [edit("docs/reviews/frozen.md", "# Review\n\nFrozen context.\n", "add")]).retained.some((entry: any) => entry.kind === "state-stale")).toBe(false);
    const current = checker.evaluate(checker.capture({ ...f.options, recordsRevision: later }), [edit("docs/reviews/current.md", "# Review\n\nUnrelated draft.\n", "add")]);
    expect(current.accepted).toBe(true); expect(current.retained.some((entry: any) => entry.kind === "state-stale")).toBe(true);
  } finally { f.cleanup(); }
});


test("canonical numeric-slot and inert-span owners require paired manifest membership even when installed files exist",()=>{
 const f=privateRecordFixture();
 try{
  const original=readFileSync(f.manifestPath);
  expect(loadInstalledRecordTool(f.manifestPath).version).toBe(2);
  for(const name of ["id-slot.js","inert-spans.js"]){
   const module=path.join(f.tool,"dist/lib/parser/dist",name),bytes=readFileSync(module),missing=JSON.parse(original.toString());
   missing.parser.files=missing.parser.files.filter((entry:any)=>entry.path!==`lib/parser/dist/${name}`);
   writeFileSync(f.manifestPath,JSON.stringify(missing));expect(existsSync(module)).toBe(true);expect(readFileSync(module)).toEqual(bytes);
   expect(()=>loadInstalledRecordTool(f.manifestPath),name).toThrow("records-tool-runtime-mismatch");
   writeFileSync(f.manifestPath,original);expect(loadInstalledRecordTool(f.manifestPath).version).toBe(2);
   writeFileSync(module,Buffer.concat([bytes,Buffer.from("\n// changed installed owner\n")]));expect(()=>loadInstalledRecordTool(f.manifestPath),name).toThrow(/records-tool-/);
   writeFileSync(module,bytes);expect(loadInstalledRecordTool(f.manifestPath).version).toBe(2);
  }
 }finally{f.cleanup();}
});
