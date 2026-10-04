import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { capturePlanningContext, normalizeContextRequest, readContextRequest } from "../scripts/records-context.mjs";
import { measureProductIdentity, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

const ENV = { ...process.env, GIT_AUTHOR_NAME: "Planning fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Planning fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
const CARD = "docs/tasks/T-999-selected.md";
const COMPONENT = "docs/architecture/components/C-01-mixed.md";
const SUPPORT = "docs/architecture/components/C-02-support.md";
function git(root: string, args: string[]) {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function put(root: string, file: string, content: string|Buffer) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), content);
}
function commit(root: string, message: string) {
  git(root, ["add", ".", ":(exclude).supertaskr"]); git(root, ["commit", "-qm", message]); return git(root, ["rev-parse", "HEAD"]);
}
function card(title = "PRIVATE RECORDS CONTRACT", touches = "mixed, legacy/file, records::docs/tasks/T-999-selected.md, product::docs/tasks/T-999-selected.md") {
  return `---\nid: T-999\ntitle: ${title}\nfeature: F-03\nmilestone: 4\npriority: 1\nsize: M\nstatus: planned\ntouches: [${touches}]\narchived_grant: PRIVATE FRONTMATTER ARCHIVE\n---\n\nSelected specification ${title}\n\n## Finding and reconciliation\n\nCurrent context.\n\n## Acceptance criteria\n\n- WHEN read THE packet SHALL identify every input.\n\n## Implementation notes\n\nPRIVATE NOTES\n\n\`\`\`md\n## Counterfeit contract\nPRIVATE FENCED NOTES\n\`\`\`\n\n## Verdicts\n\nPRIVATE VERDICT\n`;
}
function request() {
  return { version: 1, legacyTokenMap: { "legacy/file": "product" }, inputs: [
    { role: "records", path: "docs/POLICY.md", selector: { kind: "section", depth: 2, heading: "Fence" } },
    { role: "product", path: "docs/POLICY.md", selector: { kind: "section", depth: 2, heading: "Fence" } },
    { role: "product", path: "method/roles/executor.md", selector: { kind: "whole" } },
  ] };
}
function fixture(recordsLeaf = "records") {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "records-context-T-350-")));
  const product = path.join(dir, "product"); const records = path.join(dir, recordsLeaf);
  for (const root of [product, records]) {
    mkdirSync(root, { recursive: true }); git(root, ["init", "-q", "--initial-branch=main"]);
    put(root, CARD, card(root === product ? "STALE PRODUCT CONTRACT" : undefined));
    put(root, "docs/POLICY.md", `# Policy\n\n## Fence\n${root === product ? "PRODUCT BASE POLICY" : "RECORDS COMMIT POLICY"}\n\n### Child\nKept child.\n\n## Other\nUNSELECTED POLICY\n`);
    put(root, "method/roles/executor.md", root === product ? "PRODUCT METHOD CONTEXT\n" : "WRONG RECORDS METHOD\n");
    put(root, COMPONENT, root === product ? "STALE PRODUCT REGISTRY" : "---\nid: C-01\nname: Mixed\npaths: [\"product::src/**\", \"records::rules/**\"]\ntouch_slugs: [mixed]\ndepends_on: [C-02]\n---\nPRIVATE COMPONENT BODY\n");
    put(root, SUPPORT, "---\nid: C-02\nname: Support\npaths: [\"product::other/**\"]\ntouch_slugs: [unused]\n---\nUNRELATED COMPONENT BODY\n");
    commit(root, "independent fixture root");
  }
  mkdirSync(path.join(product, ".supertaskr"));
  const binding = { version: 1, projectId: "planning-fixture", productRoot: product, recordsRoot: records };
  put(product, WORKSPACE_BINDING_REL_PATH, JSON.stringify(binding));
  const identity = measureProductIdentity(product);
  const association = { version: 1, projectId: binding.projectId, product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } };
  put(records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify(association));
  const recordsCommit = commit(records, "association"); const productBase = git(product, ["rev-parse", "main"]);
  const options = { productRoot: product, recordsRevision: "main", productRevision: "main", taskId: "T-999", request: request() };
  return { dir, product, records, recordsCommit, productBase, binding, association, options };
}

test("planning capture freezes independent same-named refs dirty inputs receipts active projection and caller byte views", async () => {
  const fx = fixture();
  try {
    put(fx.records, CARD, card("DIRTY RECORDS")); rmSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH));
    put(fx.records, "docs/POLICY.md", "DIRTY POLICY"); put(fx.product, "method/roles/executor.md", "DIRTY METHOD");
    const packet = await capturePlanningContext(fx.options);
    expect(packet.view).toBe("Selected planning context");
    expect(packet.contract.fields.title).toBe("PRIVATE RECORDS CONTRACT");
    expect(packet.contract.text).toContain("Current context.");
    expect(packet.context.map((input: any) => input.text)).toEqual([
      "## Fence\nRECORDS COMMIT POLICY\n\n### Child\nKept child.\n\n", "## Fence\nPRODUCT BASE POLICY\n\n### Child\nKept child.\n\n", "PRODUCT METHOD CONTEXT\n",
    ]);
    const rendered = JSON.stringify(packet);
    for (const privateText of ["PRIVATE NOTES", "PRIVATE FENCED NOTES", "PRIVATE VERDICT", "PRIVATE FRONTMATTER ARCHIVE", "STALE PRODUCT", "UNSELECTED POLICY", "UNRELATED COMPONENT BODY", "DIRTY"]) expect(rendered).not.toContain(privateText);
    expect(packet.limits.join(" ")).toContain("input selection is not proof of complete execution-rule coverage");
    expect(packet.receipt).toMatchObject({ projectId: "planning-fixture", recordsCommit: fx.recordsCommit, productBase: fx.productBase,
      repositories: { product: { filesystemRoot: fx.product, gitCommonDirectory: realpathSync(path.join(fx.product, ".git")) }, records: { filesystemRoot: fx.records, gitCommonDirectory: realpathSync(path.join(fx.records, ".git")) } } });
    expect(fx.productBase).not.toBe(fx.recordsCommit);
    expect(packet.receipt.inputs).toHaveLength(7);
    for (const input of packet.receipt.inputs) {
      const root = input.role === "product" ? fx.product : fx.records;
      const ref = input.role === "product" ? fx.productBase : fx.recordsCommit;
      expect(input).toMatchObject({ repository: root, commit: ref, blobId: git(root, ["rev-parse", `${ref}:${input.path}`]) });
      expect(packet.inputBytes(input.index).equals(execFileSync("git", ["-C", root, "cat-file", "blob", input.blobId]))).toBe(true);
    }
    expect(packet.inputBytes(1).toString()).toContain("PRIVATE NOTES");
    packet.inputBytes(1).fill(0); expect(packet.inputBytes(1).toString()).toBe(card());
    expect(() => { packet.context[0].selector.heading = "changed"; }).toThrow();
    expect(() => { packet.receipt.repositories.product.filesystemRoot = "changed"; }).toThrow();
    expect(() => { packet.contract.fields.touches.push("changed"); }).toThrow();
    fx.options.request.inputs[0]!.selector.heading = "Other"; fx.options.recordsRevision = "absent";
    put(fx.records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify(fx.association)); commit(fx.records, "advance records");
    commit(fx.product, "advance product");
    put(fx.product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ ...fx.binding, recordsRoot: fx.product }));
    expect(JSON.stringify(packet)).toBe(rendered); expect(packet.inputBytes(1).toString()).toBe(card());
    expect(() => packet.inputBytes(99)).toThrow(/planning-input-index-invalid/);
    await expect(capturePlanningContext({ ...fx.options, recordsRevision: fx.recordsCommit, productRevision: fx.recordsCommit })).rejects.toThrow();
    rmSync(fx.records, { recursive: true }); rmSync(fx.product, { recursive: true });
    expect(JSON.stringify(packet)).toBe(rendered); expect(packet.inputBytes(1).toString()).toBe(card());
  } finally { removeGitFixture(fx.dir, "planning frozen T-350"); }
});

test("planning section selection ignores fenced and indented headings and refuses missing or ambiguous exact matches", async () => {
  const fx = fixture();
  try {
    const policy = "# Root\n```md\n## Fence\n```\n    ## Fence\n## Fence ##\nKEPT\n~~~\n## Stop\n~~~\n    ## Stop\n### Child\nCHILD\n## Stop\nOMITTED\n";
    put(fx.records, "docs/POLICY.md", policy); commit(fx.records, "section structure");
    const packet = await capturePlanningContext(fx.options);
    expect(packet.context[0].text).toBe("## Fence ##\nKEPT\n~~~\n## Stop\n~~~\n    ## Stop\n### Child\nCHILD\n");
    for (const selector of [{ kind: "section", depth: 3, heading: "Fence" }, { kind: "section", depth: 2, heading: "fence" }]) {
      await expect(capturePlanningContext({ ...fx.options, request: { ...request(), inputs: [{ role: "records", path: "docs/POLICY.md", selector }] } })).rejects.toThrow(/planning-section-missing.*docs\/POLICY.md/);
    }
    put(fx.records, "docs/POLICY.md", `${policy}\n## Fence\nSECOND\n`); commit(fx.records, "ambiguous section");
    await expect(capturePlanningContext(fx.options)).rejects.toThrow(/planning-section-ambiguous.*Fence/);
    const whole = await capturePlanningContext({ ...fx.options, request: { ...request(), inputs: [{ role: "records", path: "docs/POLICY.md", selector: { kind: "whole" } }] } });
    expect(whole.context[0].text).toContain("SECOND");
    put(fx.records, "docs/POLICY.md", "# Root\r\nROOT\r\n###### Deep\r\nEOF"); commit(fx.records, "heading boundaries");
    for (const [depth, heading, expected] of [[1, "Root", "# Root\r\nROOT\r\n###### Deep\r\nEOF"], [6, "Deep", "###### Deep\r\nEOF"]] as const) {
      const selected = await capturePlanningContext({ ...fx.options, request: { ...request(), inputs: [{ role: "records", path: "docs/POLICY.md", selector: { kind: "section", depth, heading } }] } });
      expect(selected.context[0].text).toBe(expected);
    }
  } finally { removeGitFixture(fx.dir, "planning sections T-350"); }
});

test("planning request contract refuses unknown fields paths selectors duplicate selections and conflicting ownership before capture", async () => {
  expect(normalizeContextRequest(request()).inputs).toHaveLength(3);
  const base = request();
  const bad: any[] = [{ ...base, unexpected: true }, { ...base, version: 2 }, { ...base, legacyTokenMap: [] },
    { ...base, inputs: [base.inputs[0], base.inputs[0]] }, { ...base, legacyTokenMap: { "legacy/file": ["product", "records"] } },
    { ...base, legacyTokenMap: { "legacy/file": ["product", "product"] } }, { ...base, legacyTokenMap: { "product::src/file": "records" } }];
  for (const file of ["/absolute", "../escape", "docs/../escape", "C:\\escape", ".git/config", ".supertaskr/dispatch-grant.yaml", "docs/tasks/T-888-other.md", "workspace-association.json", "a\u0085b"]) bad.push({ ...base, inputs: [{ ...base.inputs[0], path: file }] });
  for (const selector of [{ kind: "whole", extra: true }, { kind: "section", depth: 0, heading: "Fence" }, { kind: "section", depth: 7, heading: "Fence" }, { kind: "section", depth: 2, heading: "Fence\nOther" }, { kind: "section", depth: 2, heading: " Fence" }, { kind: "unknown" }]) bad.push({ ...base, inputs: [{ ...base.inputs[0], selector }] });
  bad.push({ ...base, inputs: [{ ...base.inputs[0], role: "other" }] }, { ...base, inputs: [{ ...base.inputs[0], extra: true }] });
  for (const request of bad) {
    expect(() => normalizeContextRequest(request), JSON.stringify(request)).toThrow(/planning-/);
    await expect(capturePlanningContext({ productRoot: "unavailable", recordsRevision: "main", productRevision: "main", taskId: "T-999", request })).rejects.toThrow(/planning-/);
  }
});

test("planning request files preserve duplicate member conflicts escaped identities and strict UTF-8 refusals", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "planning-request-T-350-"));
  const file = path.join(dir, "context-inputs-T-350.json");
  try {
    writeFileSync(file, JSON.stringify(request()));
    expect(readContextRequest(file).inputs).toHaveLength(3);
    for (const text of [
      '{"version":1,"legacyTokenMap":{"legacy/file":"product","legacy/file":"records"},"inputs":[]}',
      String.raw`{"version":1,"legacyTokenMap":{"legacy/file":"product","legacy\u002ffile":"records"},"inputs":[]}`,
      '{"version":1,"version":1,"legacyTokenMap":{},"inputs":[]}',
      '{"version":1,"legacyTokenMap":{},"inputs":[{"role":"product","role":"records","path":"docs/POLICY.md","selector":{"kind":"whole"}}]}',
    ]) {
      writeFileSync(file, text); expect(() => readContextRequest(file)).toThrow(/planning-request-duplicate-member/);
    }
    for (const content of ["{", Buffer.from([0xff])]) {
      writeFileSync(file, content); expect(() => readContextRequest(file)).toThrow(/planning-request-unreadable/);
    }
    writeFileSync(file, '{"version":1,"legacyTokenMap":{"__proto__":"product","constructor":"records"},"inputs":[]}');
    const normalized = readContextRequest(file);
    expect(Object.getPrototypeOf(normalized.legacyTokenMap)).toBeNull();
    expect(Object.keys(normalized.legacyTokenMap)).toEqual(["__proto__", "constructor"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("planning captures the complete committed component set and expands mixed roles with exact ownership through the public parser", async () => {
  const fx = fixture();
  try {
    const packet = await capturePlanningContext(fx.options);
    expect(packet.components.map((component: any) => component.id)).toEqual(["C-01"]);
    expect(packet.receipt.inputs.filter((input: any) => input.selector.kind === "component-registry").map((input: any) => input.path)).toEqual([COMPONENT, SUPPORT]);
    expect(packet.fence.paths.map((entry: any) => [entry.role, entry.domain, entry.component, entry.rule])).toEqual([
      ["product", "src", "C-01", "qualified"], ["records", "rules", "C-01", "qualified"],
      ["product", "legacy/file", undefined, "legacy-map"], ["product", CARD, undefined, "qualified"],
    ]);
    expect(packet.fence.excluded).toEqual([{ filesystemRoot: fx.records, domain: CARD }]);
    await expect(capturePlanningContext({ ...fx.options, request: { ...request(), legacyTokenMap: {} } })).rejects.toThrow(/planning-fence-unusable.*missing-ownership/);
    // A caller never supplies a partial registry: even the unused file is parsed.
    put(fx.records, SUPPORT, "---\nid: C-02\nname: Support\npaths: []\n---\n"); commit(fx.records, "invalid unused component");
    await expect(capturePlanningContext(fx.options)).rejects.toThrow(/planning-registry-invalid.*C-02-support/);
    git(fx.records, ["reset", "--hard", fx.recordsCommit]);
    put(fx.records, CARD, card(undefined, "unknown-slug")); commit(fx.records, "unusable fence");
    await expect(capturePlanningContext(fx.options)).rejects.toThrow(/planning-fence-unusable.*unresolved-slug/);
  } finally { removeGitFixture(fx.dir, "planning registry T-350"); }
});

test("planning committed context inputs and registry require present regular UTF-8 blobs at their selected role commit", async () => {
  const fx = fixture();
  try {
    expect((await capturePlanningContext(fx.options)).context[1].text).toContain("PRODUCT BASE POLICY");
    for (const [root, file] of [[fx.records, "docs/POLICY.md"], [fx.product, "method/roles/executor.md"], [fx.records, SUPPORT]] as [string, string][]) {
      const original = git(root, ["rev-parse", "HEAD"]);
      rmSync(path.join(root, file)); symlinkSync("missing", path.join(root, file)); commit(root, "symlink input");
      await expect(capturePlanningContext(fx.options)).rejects.toThrow(/records-entry-not-regular/);
      git(root, ["reset", "--hard", original]);
      git(root, ["update-index", "--cacheinfo", `160000,${original},${file}`]); git(root, ["commit", "-qm", "gitlink input"]);
      await expect(capturePlanningContext(fx.options)).rejects.toThrow(/records-entry-not-regular/);
      git(root, ["reset", "--hard", original]);
      put(root, file, Buffer.from([0xff])); commit(root, "invalid encoding");
      await expect(capturePlanningContext(fx.options)).rejects.toThrow(/records-encoding-invalid/);
      git(root, ["reset", "--hard", original]);
    }
    rmSync(path.join(fx.records, "docs/POLICY.md")); commit(fx.records, "missing selected input");
    await expect(capturePlanningContext(fx.options)).rejects.toThrow(/records-input-missing.*records:docs\/POLICY.md/);
    expect((await capturePlanningContext({ ...fx.options, recordsRevision: fx.recordsCommit })).context[0].text).toContain("RECORDS COMMIT POLICY");
  } finally { removeGitFixture(fx.dir, "planning modes T-350"); }
});

test("planning measures actual linked-worktree and nested-repository identities and refuses unsupported physical topology", async () => {
  const fx = fixture();
  try {
    expect((await capturePlanningContext(fx.options)).fence.usable).toBe(true);
    const linked = path.join(fx.dir, "linked-T-350");
    git(fx.product, ["worktree", "add", "--detach", linked, fx.productBase]);
    put(linked, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify(fx.association));
    put(fx.product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ ...fx.binding, recordsRoot: linked }));
    await expect(capturePlanningContext({ ...fx.options, recordsRevision: fx.productBase })).rejects.toThrow(/records-association-missing/);
    // Commit a valid association on the real linked worktree; refusal must be topology.
    put(linked, CARD, card());
    for (const file of [COMPONENT, SUPPORT]) put(linked, file, git(fx.records, ["show", `${fx.recordsCommit}:${file}`]));
    commit(linked, "linked association");
    await expect(capturePlanningContext({ ...fx.options, recordsRevision: git(linked, ["rev-parse", "HEAD"]) })).rejects.toThrow(/planning-fence-unusable.*shared-common-directory/);
    git(fx.product, ["worktree", "remove", "--force", linked]);
  } finally { removeGitFixture(fx.dir, "planning linked T-350"); }
  const nested = fixture("product/private-records");
  try { await expect(capturePlanningContext(nested.options)).rejects.toThrow(/planning-fence-unusable.*nested-roots/); }
  finally { removeGitFixture(nested.dir, "planning nested T-350"); }
});

test("planning import has no effects and capture admits actual Git reads while process and write controls remain discriminating", () => {
  const fx = fixture();
  try {
    const subject = new URL("../scripts/records-context.mjs", import.meta.url).href;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import fs from 'node:fs'; import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module';
      const real=cp.execFileSync;let reads=0;const effects=[];
      const trap=name=>(...args)=>{effects.push(name);throw Error('CONTROL '+name)};
      for(const name of ['writeFileSync','appendFileSync','mkdirSync','renameSync','unlinkSync','rmSync','chmodSync']) fs[name]=trap(name);
      for(const name of ['spawn','spawnSync','exec','execSync','execFile','fork']) cp[name]=trap(name);
      cp.execFileSync=(file,args,opts)=>{let at=0;while(at<args.length){if(args[at]==='--no-replace-objects')at++;else if(['-C','-c'].includes(args[at]))at+=2;else break}if(file!=='git'||!['rev-parse','rev-list','ls-tree','cat-file'].includes(args[at]))return trap('process')(file,args);reads++;return real(file,args,opts)};
      syncBuiltinESMExports(); const consumer=await import(${JSON.stringify(subject)});
      if(reads||effects.length)throw Error('import effect');
      const packet=await consumer.capturePlanningContext(${JSON.stringify(fx.options)});
      if(!reads||effects.length||packet.context[0].text.indexOf('RECORDS COMMIT POLICY')<0)throw Error('real read missing');
      for(const control of [()=>cp.execFileSync('npm',['test']),()=>fs.writeFileSync('never-written','x')]) {
        try{control();throw Error('missing control')}catch(err){if(!String(err).includes('CONTROL'))throw err}
      }
      console.log(JSON.stringify({reads,effects}));
    `], { encoding: "utf8", env: ENV });
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ effects: ["process", "writeFileSync"] });
    expect(JSON.parse(result.stdout).reads).toBeGreaterThan(0);
  } finally { removeGitFixture(fx.dir, "planning controls T-350"); }
});
