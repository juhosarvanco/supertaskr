import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { activeTaskContract, captureTaskSnapshot, readCommittedBoard } from "../scripts/records.mjs";
import { measureProductIdentity, resolveWorkspace, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";

const SUBJECT = new URL("../scripts/records.mjs", import.meta.url).href;
const ENV = { ...process.env, GIT_AUTHOR_NAME: "Records fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Records fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
const CARD = "docs/tasks/T-999-selected.md";
function cardText(title = "Committed records task", id = "T-999"): string {
  return `---\nid: ${id}\ntitle: ${title}\nstatus: planned\ntouches: [safe/file]\nextra: {nested: [fixed]}\n---\n\nActive contract ${title}\n\n## Acceptance criteria\n\n- WHEN read THE snapshot SHALL stay fixed.\n\n## Implementation notes\n\nPRIVATE ARCHIVED GRANT HISTORY\n\n## Verdicts\n`;
}
function commit(root: string, note: string): string {
  git(root, ["add", "."]); git(root, ["commit", "--allow-empty", "-qm", note]); return git(root, ["rev-parse", "HEAD"]);
}
function fixture(empty = false, recordsLeaf = "records") {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "records-T-348-")));
  const product = path.join(dir, "product"); const records = path.join(dir, recordsLeaf);
  for (const root of [product, records]) {
    mkdirSync(path.join(root, "docs/tasks"), { recursive: true });
    git(root, ["init", "-q", "--initial-branch=main"]);
    writeFileSync(path.join(root, "sentinel"), root);
    if (root === product || !empty) writeFileSync(path.join(root, CARD), cardText(root === product ? "STALE PRODUCT COPY" : "Committed records task"));
    commit(root, "independent root");
  }
  mkdirSync(path.join(product, ".supertaskr"));
  const binding = { version: 1, projectId: "records-fixture", productRoot: product, recordsRoot: records };
  writeFileSync(path.join(product, WORKSPACE_BINDING_REL_PATH), JSON.stringify(binding));
  const identity = measureProductIdentity(product);
  const association = { version: 1, projectId: binding.projectId, product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } };
  writeFileSync(path.join(records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(association));
  const recordsCommit = commit(records, "committed association"); const productBase = git(product, ["rev-parse", "HEAD"]);
  const options = { productRoot: product, recordsRevision: "main", productRevision: "main", taskId: "T-999" };
  return { dir, product, records, binding, association, recordsCommit, productBase, options };
}

test("records import performs no command or write and its process/write controls fire", () => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import fs from 'node:fs'; import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module';
    const calls=[]; const trap=(name)=>(...args)=>{calls.push(name);throw Error('instrumented '+name)};
    for(const name of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork']) cp[name]=trap(name);
    for(const name of ['writeFileSync','appendFileSync','mkdirSync','renameSync','unlinkSync','rmSync','chmodSync']) fs[name]=trap(name);
    syncBuiltinESMExports(); await import(${JSON.stringify(SUBJECT)});
    if(calls.length) throw Error('import side effect');
    for(const control of [()=>cp.spawnSync('true'),()=>fs.writeFileSync('never-written','x')]) {
      try {control();throw Error('control did not fire')} catch(err){if(!String(err).includes('instrumented')) throw err}
    }
    console.log(JSON.stringify(calls));
  `], { encoding: "utf8", env: ENV });
  expect(result.status, result.stderr).toBe(0); expect(JSON.parse(result.stdout)).toEqual(["spawnSync", "writeFileSync"]);
});

test("records snapshots select one committed records tree and independent same-name product refs with immutable captures", () => {
  const fx = fixture();
  try {
    writeFileSync(path.join(fx.records, CARD), cardText("UNCOMMITTED RECORDS"));
    rmSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH));
    const original = captureTaskSnapshot(fx.options);
    expect(original.receipt.recordsCommit).toBe(fx.recordsCommit);
    expect(original.receipt.productBase).toBe(fx.productBase);
    expect(fx.productBase).not.toBe(fx.recordsCommit);
    expect(original.receipt).toMatchObject({ projectId: "records-fixture", repositoryRole: "records", cardPath: CARD, objectFormat: "sha1" });
    expect(original.receipt.cardBlobId).toBe(git(fx.records, ["rev-parse", `${fx.recordsCommit}:${CARD}`]));
    expect(original.receipt.association.blobId).toBe(git(fx.records, ["rev-parse", `${fx.recordsCommit}:${WORKSPACE_ASSOCIATION_REL_PATH}`]));
    expect(original.content).toBe(cardText()); expect(original.bytes.equals(Buffer.from(cardText()))).toBe(true);
    expect(activeTaskContract(original)).toContain("Active contract Committed records task");
    expect(activeTaskContract(original)).not.toContain("PRIVATE ARCHIVED GRANT HISTORY");
    const exposed = original.bytes; exposed.fill(0);
    const exposedTask = original.task.bytes; exposedTask.fill(1);
    expect(original.bytes.toString()).toBe(cardText());
    expect(() => { (original.receipt.association.values.product.rootCommits as string[]).push("bad"); }).toThrow();
    expect(() => { (original.task.fields.extra.nested as string[])[0] = "bad"; }).toThrow();
    expect(() => { (original.receipt as any).recordsCommit = "bad"; }).toThrow();
    fx.options.recordsRevision = "absent"; fx.binding.projectId = "changed";
    writeFileSync(path.join(fx.product, WORKSPACE_BINDING_REL_PATH), JSON.stringify(fx.binding));
    writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify({ ...fx.association, projectId: "changed" }));
    const nextCommit = commit(fx.records, "records-only advance");
    const next = captureTaskSnapshot({ ...fx.options, recordsRevision: "main" });
    expect(next.receipt.recordsCommit).toBe(nextCommit); expect(next.receipt.productBase).toBe(fx.productBase);
    expect(next.content).toContain("UNCOMMITTED RECORDS"); expect(next.receipt.projectId).toBe("changed");
    expect(original.receipt.recordsCommit).toBe(fx.recordsCommit); expect(original.receipt.projectId).toBe("records-fixture");
    expect(original.bytes.toString()).toBe(cardText());
    expect(() => captureTaskSnapshot({ ...fx.options, recordsRevision: nextCommit, productRevision: nextCommit })).toThrow(/product-commit-unavailable/);
  } finally { removeGitFixture(fx.dir, "records immutable T-348"); }
});

test("records missing inputs malformed cards duplicate ids mismatched paths and unsafe selectors refuse by name", () => {
  const fx = fixture();
  try {
    expect(() => captureTaskSnapshot({ ...fx.options, productRevision: "" })).toThrow(/records-product-base-required/);
    expect(() => captureTaskSnapshot({ ...fx.options, recordsRevision: "missing" })).toThrow(/records-commit-unavailable/);
    expect(() => captureTaskSnapshot({ ...fx.options, taskId: "T-888" })).toThrow(/records-task-missing/);
    for (const cardPath of ["../docs/tasks/T-999.md", "/docs/tasks/T-999.md", "docs/tasks/../T-999.md", "docs/tasks/T-999\\bad.md"]) {
      expect(() => captureTaskSnapshot({ productRoot: fx.product, recordsRevision: "main", productRevision: "main", cardPath })).toThrow(/records-card-path-unsafe/);
    }
    expect(captureTaskSnapshot({ productRoot: fx.product, recordsRevision: "main", productRevision: "main", cardPath: CARD }).content).toBe(cardText());
    writeFileSync(path.join(fx.records, "docs/tasks/T-999-duplicate.md"), cardText("duplicate")); commit(fx.records, "duplicate id");
    expect(() => captureTaskSnapshot(fx.options)).toThrow(/records-task-duplicate.*T-999/);
    rmSync(path.join(fx.records, "docs/tasks/T-999-duplicate.md"));
    writeFileSync(path.join(fx.records, CARD), cardText("mismatch", "T-888")); commit(fx.records, "path id mismatch");
    expect(() => captureTaskSnapshot(fx.options)).toThrow(/records-task-id-mismatch.*T-888/);
    for (const malformed of ["not a card", "---\nid: [bad\n---\n", "---\n- item\n---\n", "---\nid: T-999\ntitle: 7\nstatus: planned\n---\n"]) {
      writeFileSync(path.join(fx.records, CARD), malformed); commit(fx.records, "malformed card");
      expect(() => readCommittedBoard(fx.options)).toThrow(/records-card-malformed/);
    }
    rmSync(fx.records, { recursive: true });
    expect(() => readCommittedBoard(fx.options)).toThrow(/records-repository-unavailable/);
  } finally { removeGitFixture(fx.dir, "records refusals T-348"); }
});

test("records association is required at the same commit and validates the captured binding and actual selected product lineage", () => {
  const fx = fixture();
  try {
    expect(() => captureTaskSnapshot({ ...fx.options, recordsRevision: `${fx.recordsCommit}^` })).toThrow(/records-association-missing/);
    for (const association of [{ ...fx.association, projectId: "wrong" }, { ...fx.association, product: { objectFormat: "sha1", rootCommits: ["a".repeat(40)] } }]) {
      writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(association)); commit(fx.records, "association mismatch");
      expect(() => captureTaskSnapshot(fx.options)).toThrow(/association-(?:project|root-commits)-mismatch/);
    }
    writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), "{"); commit(fx.records, "malformed association");
    expect(() => captureTaskSnapshot(fx.options)).toThrow(/records-association-malformed/);
    writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(fx.association)); commit(fx.records, "restore association");
    git(fx.product, ["checkout", "-q", "--orphan", "foreign"]); git(fx.product, ["commit", "-qm", "foreign lineage"]);
    expect(() => captureTaskSnapshot({ ...fx.options, productRevision: "foreign" })).toThrow(/association-root-commits-mismatch/);
    expect(captureTaskSnapshot(fx.options).receipt.productBase).toBe(fx.productBase);
  } finally { removeGitFixture(fx.dir, "records committed association T-348"); }
});

test("records reject committed symlink and gitlink card association and board entries by name", () => {
  const fx = fixture();
  try {
    for (const target of [CARD, WORKSPACE_ASSOCIATION_REL_PATH]) {
      git(fx.records, ["reset", "--hard", fx.recordsCommit]);
      rmSync(path.join(fx.records, target)); symlinkSync("sentinel", path.join(fx.records, target)); commit(fx.records, "symlink entry");
      expect(() => captureTaskSnapshot(fx.options)).toThrow(new RegExp(`records-entry-not-regular.*${target}`));
      git(fx.records, ["reset", "--hard", fx.recordsCommit]);
      git(fx.records, ["update-index", "--cacheinfo", `160000,${fx.recordsCommit},${target}`]);
      git(fx.records, ["commit", "-qm", "gitlink entry"]);
      expect(() => captureTaskSnapshot(fx.options)).toThrow(new RegExp(`records-entry-not-regular.*${target}`));
    }
    git(fx.records, ["reset", "--hard", fx.recordsCommit]);
    rmSync(path.join(fx.records, "docs/tasks"), { recursive: true }); symlinkSync("../sentinel", path.join(fx.records, "docs/tasks")); commit(fx.records, "board symlink");
    expect(() => readCommittedBoard(fx.options)).toThrow(/records-entry-not-regular.*docs\/tasks/);
  } finally { removeGitFixture(fx.dir, "records Git modes T-348"); }
});

test("records empty committed boards are explicit and product-only inspection never requires private records", () => {
  const fx = fixture(true);
  try {
    const empty = readCommittedBoard(fx.options);
    expect(empty.tasks).toEqual([]); expect(empty.receipt.recordsCommit).toBe(fx.recordsCommit);
    expect(() => readCommittedBoard({ ...fx.options, recordsRevision: "absent" })).toThrow(/records-commit-unavailable/);
    // Colocated discovery is supported only with a committed portable association.
    rmSync(path.join(fx.product, WORKSPACE_BINDING_REL_PATH));
    writeFileSync(path.join(fx.product, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(fx.association)); commit(fx.product, "colocated association");
    expect(readCommittedBoard({ productRoot: fx.product, recordsRevision: "HEAD" }).tasks[0]?.fields.title).toBe("STALE PRODUCT COPY");
    writeFileSync(path.join(fx.product, WORKSPACE_BINDING_REL_PATH), JSON.stringify(fx.binding));
    rmSync(fx.records, { recursive: true });
    expect(resolveWorkspace({ productRoot: fx.product, mode: "product-only" }).association.status).toBe("unverified");
    expect(() => readCommittedBoard(fx.options)).toThrow(/records-repository-unavailable/);
    expect(readFileSync(path.join(fx.product, WORKSPACE_BINDING_REL_PATH), "utf8")).toBe(JSON.stringify(fx.binding));
  } finally { removeGitFixture(fx.dir, "records empty board T-348"); }
});

test("T-348 VC1 — committed records preserve legal trailing whitespace in the selected root", () => {
  for (const recordsLeaf of ["records", "records "]) {
    const fx = fixture(false, recordsLeaf);
    try {
      const discovery = resolveWorkspace({ productRoot: fx.product });
      expect(discovery.recordsRoot).toBe(fx.records);
      expect(discovery.association.status).toBe("verified");
      const snapshot = captureTaskSnapshot(fx.options);
      expect(snapshot.receipt.recordsRoot).toBe(fx.records);
      expect(snapshot.receipt.recordsCommit).toBe(fx.recordsCommit);
      expect(snapshot.receipt.productBase).toBe(fx.productBase);
      expect(snapshot.content).toBe(cardText());
    } finally { removeGitFixture(fx.dir, "records root whitespace T-348"); }
  }
});

test("T-348 VC2 — active contract and selected CLI omit historical sections while retaining committed bytes and criteria", () => {
  const fx = fixture();
  const marker = "ARCHIVED-GRANT-HISTORY-CONTROL-T348";
  try {
    for (const heading of ["History", "Reports", "Archived grant history"]) {
      for (const beforeCriteria of [false, true]) {
        const insertion = beforeCriteria ? "## Acceptance criteria" : "## Implementation notes";
        const text = cardText().replace(insertion, `## ${heading}\n\n${marker}\n\n${insertion}`);
        writeFileSync(path.join(fx.records, CARD), text);
        const recordsCommit = commit(fx.records, "historical section fixture");
        const snapshot = captureTaskSnapshot(fx.options);
        expect(snapshot.bytes.equals(Buffer.from(text))).toBe(true);
        expect(snapshot.receipt.recordsCommit).toBe(recordsCommit);
        expect(activeTaskContract(snapshot)).toContain("## Acceptance criteria");
        expect(activeTaskContract(snapshot)).toContain("WHEN read THE snapshot SHALL stay fixed.");
        expect(activeTaskContract(snapshot), marker).not.toContain(marker);
        const cli = spawnSync(process.execPath, [new URL("../scripts/brief.mjs", import.meta.url).pathname,
          "--root", fx.product, "--records", "T-999", "--records-revision", "main", "--product-base", "main"], { encoding: "utf8", env: ENV });
        expect(cli.status, cli.stderr).toBe(0);
        const answer = JSON.parse(cli.stdout);
        expect(answer.receipt.recordsCommit).toBe(recordsCommit);
        expect(answer.contract).toContain("## Acceptance criteria");
        expect(answer.contract, marker).not.toContain(marker);
        expect(snapshot.bytes.equals(Buffer.from(text))).toBe(true);
      }
    }
  } finally { removeGitFixture(fx.dir, "records active history T-348"); }
});

test("T-348 attacks — exact CRLF bytes subordinate ids noncommit refs and retained captures remain distinct", () => {
  const fx = fixture();
  try {
    const subordinatePath = "docs/tasks/T-999-s1-subordinate.md";
    const raw = Buffer.from(cardText("Subordinate committed task", "T-999-s1").replace(/\n/g, "\r\n") + " \t\r\n");
    writeFileSync(path.join(fx.records, subordinatePath), raw);
    const capturedCommit = commit(fx.records, "subordinate CRLF capture");
    const options = { ...fx.options, recordsRevision: capturedCommit, taskId: "T-999-s1" };
    const original = captureTaskSnapshot(options);
    expect(original.receipt.cardPath).toBe(subordinatePath);
    expect(original.bytes.equals(raw)).toBe(true);
    expect(original.task.bytes.equals(raw)).toBe(true);
    const exposed = original.bytes; exposed.fill(0);
    expect(original.bytes.equals(raw)).toBe(true);
    expect(() => { (original.task as any).content = "changed"; }).toThrow();
    expect(() => { (original.receipt.localBinding as any).projectId = "changed"; }).toThrow();
    expect(() => { (readCommittedBoard(options).tasks as any[]).pop(); }).toThrow();
    writeFileSync(path.join(fx.records, subordinatePath), cardText("Later task", "T-999-s1"));
    const laterCommit = commit(fx.records, "later subordinate records");
    expect(captureTaskSnapshot(options).receipt.recordsCommit).toBe(capturedCommit);
    expect(captureTaskSnapshot(options).bytes.equals(raw)).toBe(true);
    const later = captureTaskSnapshot({ ...options, recordsRevision: laterCommit });
    expect(later.receipt.recordsCommit).toBe(laterCommit);
    expect(later.content).toContain("Later task");
    expect(later.receipt.productBase).toBe(original.receipt.productBase);
    expect(() => captureTaskSnapshot({ ...options, recordsRevision: original.receipt.cardBlobId })).toThrow(/records-commit-unavailable/);
    expect(() => captureTaskSnapshot({ ...options, recordsRevision: `${capturedCommit}^{tree}` })).toThrow(/records-commit-unavailable/);
    expect(() => captureTaskSnapshot({ ...options, recordsRevision: fx.productBase })).toThrow(/records-commit-unavailable/);
    expect(() => captureTaskSnapshot({ ...options, productRevision: capturedCommit })).toThrow(/product-commit-unavailable/);
    expect(() => captureTaskSnapshot({ ...options, cardPath: subordinatePath })).toThrow(/records-task-selector-invalid/);
    expect(captureTaskSnapshot({ productRoot: fx.product, recordsRevision: capturedCommit, productRevision: "main", cardPath: subordinatePath }).bytes.equals(raw)).toBe(true);
  } finally { removeGitFixture(fx.dir, "records raw boundaries T-348"); }
});

test("T-348 attacks — committed association schemas normalized roots shallow and missing parent histories refuse distinctly", () => {
  const fx = fixture();
  try {
    const normalized = { ...fx.association, product: { ...fx.association.product,
      rootCommits: [...fx.association.product.rootCommits, ...fx.association.product.rootCommits.map((root: string) => root.toUpperCase())] } };
    writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(normalized)); commit(fx.records, "normalized association roots");
    expect(captureTaskSnapshot(fx.options).receipt.association.validation.status).toBe("verified");
    for (const association of [{ ...fx.association, role: "product" }, { ...fx.association, version: 2 },
      { ...fx.association, product: { objectFormat: "sha256", rootCommits: ["a".repeat(64)] } }]) {
      writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(association)); commit(fx.records, "association schema boundary");
      expect(() => captureTaskSnapshot(fx.options)).toThrow(/association-(?:schema|version-unsupported|object-format-mismatch)/);
    }
    writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(fx.association)); commit(fx.records, "restore association");
    writeFileSync(path.join(fx.product, "product-advance"), "new product commit");
    const laterProduct = commit(fx.product, "product history advance");
    const shallowRoot = path.join(fx.dir, "shallow-product");
    execFileSync("git", ["-c", "maintenance.auto=false", "clone", "--quiet", "--depth=1", `file://${fx.product}`, shallowRoot], { env: ENV });
    mkdirSync(path.join(shallowRoot, ".supertaskr"), { recursive: true });
    writeFileSync(path.join(shallowRoot, WORKSPACE_BINDING_REL_PATH), JSON.stringify({ ...fx.binding, productRoot: shallowRoot }));
    expect(() => captureTaskSnapshot({ ...fx.options, productRoot: shallowRoot })).toThrow(/product-history-shallow/);
    expect(captureTaskSnapshot(fx.options).receipt.productBase).toBe(laterProduct);
    const parentObject = path.join(fx.product, ".git/objects", fx.productBase.slice(0, 2), fx.productBase.slice(2));
    const retained = readFileSync(parentObject);
    rmSync(parentObject);
    try { expect(() => captureTaskSnapshot(fx.options)).toThrow(/product-history-incomplete/); }
    finally { writeFileSync(parentObject, retained); }
    expect(captureTaskSnapshot(fx.options).receipt.productBase).toBe(laterProduct);
  } finally { removeGitFixture(fx.dir, "records association history edges T-348"); }
});
