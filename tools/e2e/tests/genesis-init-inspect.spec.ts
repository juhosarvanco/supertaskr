import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { discoverProjectInitializations, inspectProjectInitialization } from "../scripts/genesis-init-inspect.mjs";
import { prepareGenesisInitialization } from "../scripts/genesis-init-plan.mjs";
import { executeProjectInitialization } from "../scripts/project-init-operation.mjs";
import { acceptedOperationPath } from "../scripts/durable-operation.mjs";
import { verifyInstalledRecordTool } from "../scripts/records-check.mjs";
import { genesisFixture, genesisInput, withGenesisIdentity } from "./genesis-init-fixture";
import { privateGit, putPrivate } from "./private-record-fixture";

function planned(f: ReturnType<typeof genesisFixture>) { return withGenesisIdentity(() => prepareGenesisInitialization(genesisInput(f))); }
function policy(f: ReturnType<typeof genesisFixture>) { return () => { verifyInstalledRecordTool(f.toolHandle); return true; }; }
function initialized(f: ReturnType<typeof genesisFixture>) {
  const plan = planned(f);
  const receipt = executeProjectInitialization(f.product, plan.request, { authorize: policy(f) });
  return { plan, receipt };
}
function inspect(f: ReturnType<typeof genesisFixture>) { return inspectProjectInitialization({ productRoot: f.product, tool: f.toolHandle }); }
function commit(root: string, file: string) {
  privateGit(root, ["add", "--", file]); privateGit(root, ["commit", "-qm", "Later local fixture work"]);
  return privateGit(root, ["rev-parse", "HEAD"]);
}

test("cold setup discovery is read-only before Git/settings and never skips malformed owned operations", () => {
  const f = genesisFixture();
  try {
    expect(discoverProjectInitializations(f.product)).toEqual({ status: "initializations", initializations: [] });
    expect(readdirSync(f.product)).toEqual([]);
    const runs = path.join(f.product, ".supertaskr/runs"); mkdirSync(path.join(runs, "ordinary-note"), { recursive: true });
    expect(discoverProjectInitializations(f.product).initializations).toEqual([]);
    mkdirSync(path.join(runs, "OP-not-canonical"));
    expect(() => discoverProjectInitializations(f.product)).toThrow("OPERATION_RECORD");
    expect(existsSync(path.join(f.product, ".git"))).toBe(false); expect(readdirSync(f.records)).toEqual([]);
  } finally { f.cleanup(); }
});

test("a durably captured setup is discoverable before its first Git/file effect without changing its record", () => {
  const f = genesisFixture();
  try {
    const plan = planned(f);
    expect(() => executeProjectInitialization(f.product, plan.request, { authorize: policy(f), onBoundary(at) {
      if (at === "captured") throw new Error("ordinary captured-boundary stop");
    } })).toThrow("ordinary captured-boundary stop");
    const record = acceptedOperationPath(f.product, plan.request.operationId), bytes = readFileSync(record), inode = statSync(record).ino;
    const result = discoverProjectInitializations(f.product);
    expect(result.initializations).toHaveLength(1);
    expect(result.initializations[0]).toMatchObject({ operationId: plan.request.operationId, state: "pending", originStatus: "matched",
      phase: { productStage: "captured", recordsStage: "captured", bindingAccepted: false } });
    expect(result.initializations[0]).not.toHaveProperty("receipt");
    expect(JSON.stringify(result)).not.toMatch(/base64|author|committer|identity|settings/);
    expect(Object.isFrozen(result.initializations[0])).toBe(true);
    expect(readFileSync(record)).toEqual(bytes); expect(statSync(record).ino).toBe(inode);
    expect(existsSync(path.join(f.product, ".git"))).toBe(false); expect(readdirSync(f.records)).toEqual([]);
    // An unavailable original home must not turn a copied canonical record
    // into recovery metadata owned by another selected PRODUCT.
    const foreign = path.join(f.dir, "foreign-product"), foreignRecord = path.join(foreign, path.relative(f.product, record));
    mkdirSync(path.dirname(foreignRecord), { recursive: true }); cpSync(record, foreignRecord);
    const held = `${f.records}-held`; renameSync(f.records, held);
    expect(() => discoverProjectInitializations(foreign)).toThrow("genesis-init-coordinator-mismatch");
    renameSync(held, f.records);
  } finally { f.cleanup(); }
});

test("current setup inspection preserves the original receipt across later commits and ignores dirty working settings", () => {
  const f = genesisFixture();
  try {
    const { receipt } = initialized(f);
    expect(discoverProjectInitializations(f.product).initializations[0]).toMatchObject({ state: "initialized", originStatus: "matched", receipt });
    const first = inspect(f); expect(first.receipt).toEqual(receipt);
    expect(first.planning.pristineSeed).toBe(true);
    expect(first.planner).toMatchObject({status:"ready",selection:{role:"planner",harness:"claude",model:"claude-opus-5",vehicle:"subagent"},provenance:{
      configurationDigest:first.settingsProvenance.configDigest,productRevision:first.current.productRevision,toolManifestDigest:first.settingsProvenance.tool.manifestDigest}});
    expect(first.planner.provenance.toolManifestDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(first.installation).toEqual({ runtimeKit: "verified", skills: "not-installed", hooks: "not-installed" });
    expect(first.settings.languages).toEqual([]); expect(first).not.toHaveProperty("yaml");
    putPrivate(f.product, "README.md", "# Later local project work\n"); const p = commit(f.product, "README.md");
    putPrivate(f.records, "docs/rooms/later.md", "# Later private note\n"); const r = commit(f.records, "docs/rooms/later.md");
    writeFileSync(path.join(f.product, "supertaskr.yaml"), "dirty: invalid working configuration\n");
    const current = inspect(f);
    expect(current.receipt).toEqual(receipt); expect(current.current.productRevision).toBe(p); expect(current.current.recordsRevision).toBe(r);
    expect(current.settingsProvenance).toMatchObject({ kind: "committed", productRoot: f.product, productRevision: p });
    expect(current.settings.languages).toEqual([]); expect(Object.isFrozen(current)).toBe(true);
    expect(current.planning.pristineSeed).toBe(false);
    const nextSettings = structuredClone(current.settings); nextSettings.roles.planner = "codex/gpt-6.1-sol@fresh";
    putPrivate(f.product,"supertaskr.yaml",JSON.stringify(nextSettings)); const unsupported = commit(f.product,"supertaskr.yaml");
    const refusedPlanner = inspect(f); expect(refusedPlanner.current.productRevision).toBe(unsupported);
    expect(refusedPlanner.planner).toMatchObject({status:"cannot-run",code:3,reason:"project-role-harness-unsupported"});
    expect(refusedPlanner.receipt).toEqual(receipt);
  } finally { f.cleanup(); }
});

test("only the exact accepted initial docs and index qualify a pristine first-start seed", () => {
  const f = genesisFixture();
  try {
    initialized(f); const file=path.join(f.records,"docs/ROADMAP.md"), original=readFileSync(file), mode=statSync(file).mode&0o777;
    expect(inspect(f).planning.pristineSeed).toBe(true);
    writeFileSync(file,Buffer.concat([original,Buffer.from("\nOwner's new plan\n")])); expect(inspect(f).planning.pristineSeed).toBe(false);
    writeFileSync(file,original); expect(inspect(f).planning.pristineSeed).toBe(true);
    const extra=path.join(f.records,"docs/tasks/extra.md");writeFileSync(extra,"# Existing owner work\n"); expect(inspect(f).planning.pristineSeed).toBe(false);
    unlinkSync(extra); expect(inspect(f).planning.pristineSeed).toBe(true);
    chmodSync(file,0o700); expect(inspect(f).planning.pristineSeed).toBe(false); chmodSync(file,mode);expect(inspect(f).planning.pristineSeed).toBe(true);
    writeFileSync(file,Buffer.concat([original,Buffer.from("\nStaged owner plan\n")]));privateGit(f.records,["add","--","docs/ROADMAP.md"]);writeFileSync(file,original);
    expect(inspect(f).planning.pristineSeed).toBe(false);privateGit(f.records,["restore","--staged","--","docs/ROADMAP.md"]);expect(inspect(f).planning.pristineSeed).toBe(true);
    privateGit(f.records,["update-index","--assume-unchanged","--","docs/ROADMAP.md"]);expect(inspect(f).planning.pristineSeed).toBe(false);
    privateGit(f.records,["update-index","--no-assume-unchanged","--","docs/ROADMAP.md"]);expect(inspect(f).planning.pristineSeed).toBe(true);
    const held=path.join(f.dir,"held-seed.md");renameSync(file,held);symlinkSync(held,file);expect(inspect(f).planning.pristineSeed).toBe(false);
    unlinkSync(file);renameSync(held,file);expect(inspect(f).planning.pristineSeed).toBe(true);
  } finally { f.cleanup(); }
});

test("equal-history replacement RECORDS cannot acquire the original current setup receipt", () => {
  const f = genesisFixture();
  try {
    const { receipt } = initialized(f), binding = path.join(f.product, ".supertaskr/workspace.json"), bytes = readFileSync(binding);
    const replacement = path.join(f.dir, "equal-notes"); cpSync(f.records, replacement, { recursive: true });
    writeFileSync(binding, JSON.stringify({ ...JSON.parse(bytes.toString()), recordsRoot: replacement }));
    expect(discoverProjectInitializations(f.product).initializations[0].receipt).toEqual(receipt);
    expect(() => inspect(f)).toThrow("genesis-init-current-receipt-required");
    writeFileSync(binding, bytes); expect(inspect(f).receipt).toEqual(receipt);
  } finally { f.cleanup(); }
});

test("missing original homes retain only unavailable metadata, and kit changes refuse until restored", () => {
  const f = genesisFixture();
  try {
    const { receipt } = initialized(f), held = `${f.records}-held`; renameSync(f.records, held);
    const missing = discoverProjectInitializations(f.product).initializations[0];
    expect(missing).toMatchObject({ operationId: receipt.operationId, state: "initialized", originStatus: "unavailable" });
    expect(missing).not.toHaveProperty("receipt"); renameSync(held, f.records);
    expect(inspect(f).receipt).toEqual(receipt);
    const foreign = path.join(f.product, ".supertaskr/genesis/kit/foreign.md"); writeFileSync(foreign, "unplanned kit bytes\n");
    expect(() => inspect(f)).toThrow("genesis-init-kit-changed"); rmSync(foreign);
    expect(inspect(f).receipt).toEqual(receipt);
    const member = path.join(f.product, ".supertaskr/genesis/kit/roles/planner.md"), bytes = readFileSync(member);
    writeFileSync(member, "changed method\n"); expect(() => inspect(f)).toThrow("genesis-init-kit-changed");
    writeFileSync(member, bytes); expect(inspect(f).receipt).toEqual(receipt);
  } finally { f.cleanup(); }
});
