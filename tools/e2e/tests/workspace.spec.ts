import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { measureProductIdentity, resolveResource, resolveWorkspace, validateAssociation,
  WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";

const SUBJECT = new URL("../scripts/workspace.mjs", import.meta.url).href;
const ENV = { ...process.env, GIT_AUTHOR_NAME: "Workspace fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Workspace fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
function git(root: string, args: string[]): string {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function repository(root: string): void {
  mkdirSync(path.join(root, "safe"), { recursive: true });
  git(root, ["init", "-q", "--initial-branch=main"]);
  writeFileSync(path.join(root, "safe/existing.txt"), "tracked control\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "fixture root"]);
}
function fixture() {
  const dir = realTemp();
  const product = path.join(dir, "product");
  const records = path.join(dir, "records");
  repository(product);
  repository(records);
  return { dir, product, records };
}
function realTemp(): string {
  // macOS's temporary directory may itself be a symlink; the asserted roots
  // are canonical paths, independently of the resolver's output.
  return realpathSync(mkdtempSync(path.join(os.tmpdir(), "workspace-T-347-")));
}
function bind(fx: ReturnType<typeof fixture>) {
  mkdirSync(path.join(fx.product, ".supertaskr"), { recursive: true });
  const binding = { version: 1, projectId: "fixture-project", productRoot: fx.product, recordsRoot: fx.records };
  writeFileSync(path.join(fx.product, WORKSPACE_BINDING_REL_PATH), JSON.stringify(binding));
  const identity = measureProductIdentity(fx.product);
  const association = { version: 1, projectId: binding.projectId, product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } };
  writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(association));
  return { binding, association, identity };
}

test("workspace import performs no command or write, with live instrumentation controls", () => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import fs from 'node:fs'; import cp from 'node:child_process'; import {syncBuiltinESMExports} from 'node:module';
    const calls=[]; const trap=(name)=>(...args)=>{calls.push(name);throw Error('instrumented '+name)};
    for(const name of ['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork']) cp[name]=trap(name);
    for(const name of ['writeFileSync','appendFileSync','mkdirSync','renameSync','unlinkSync','rmSync','chmodSync']) fs[name]=trap(name);
    const open=fs.openSync;fs.openSync=(file,flags,...args)=>flags==='r'?open(file,flags,...args):trap('openSync')(file,flags,...args);
    syncBuiltinESMExports(); await import(${JSON.stringify(SUBJECT)});
    if(calls.length) throw Error('import side effect');
    for(const control of [()=>cp.spawnSync('true'),()=>fs.writeFileSync('never-written','x')]) {
      try {control();throw Error('control did not fire')} catch(err){if(!String(err).includes('instrumented')) throw err}
    }
    console.log(JSON.stringify(calls));
  `], { encoding: "utf8", env: { ...process.env, FORCE_COLOR: undefined, NO_COLOR: "1" } });
  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual(["spawnSync", "writeFileSync"]);
});

test("workspace absent binding preserves colocated roots and overlapping safe new resource locations", () => {
  const fx = fixture();
  try {
    const workspace = resolveWorkspace({ productRoot: fx.product });
    expect(workspace).toMatchObject({ productRoot: fx.product, recordsRoot: fx.product, runtimeRoot: path.join(fx.product, ".supertaskr"), layout: "colocated" });
    expect(workspace.association.status).toBe("unconfigured");
    expect(() => readFileSync(path.join(fx.product, WORKSPACE_BINDING_REL_PATH))).toThrow();
    const product = resolveResource(workspace, { role: "product", path: "safe/new.txt" });
    const records = resolveResource(workspace, { role: "records", path: "safe/new.txt" });
    expect(product.physicalPath).toBe(records.physicalPath);
    expect(product.key).not.toBe(records.key);
    expect(product.colocatedOverlap).toBe(true);
    expect(product.authority).toContain("no write ownership");
    expect(() => resolveWorkspace({ productRoot: path.join(fx.product, "safe") })).toThrow(/product-root-nested/);
    mkdirSync(path.join(fx.product, ".supertaskr/.git"), { recursive: true });
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/runtime-repository/);
    rmSync(path.join(fx.product, ".supertaskr/.git"), { recursive: true });
    expect(resolveWorkspace({ productRoot: fx.product }).layout).toBe("colocated");
    git(path.join(fx.product, ".supertaskr"), ["init", "--bare", "-q"]);
    expect(git(path.join(fx.product, ".supertaskr"), ["rev-parse", "--is-bare-repository"])).toBe("true");
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/runtime-repository/);
  } finally { removeGitFixture(fx.dir, "workspace colocated T-347"); }
});

test("workspace split association compares exact normalized complete root sets at the selected product commit", () => {
  const fx = fixture();
  try {
    const original = git(fx.product, ["rev-parse", "HEAD"]);
    git(fx.product, ["checkout", "-q", "--orphan", "extra"]);
    git(fx.product, ["commit", "-qm", "independent root"]);
    git(fx.product, ["merge", "--allow-unrelated-histories", "-qm", "union", "main"]);
    const { association, identity } = bind(fx);
    expect(identity.rootCommits).toHaveLength(2);
    association.product.rootCommits = [...identity.rootCommits].reverse().map((r: string) => r.toUpperCase()).concat(identity.rootCommits[0]!);
    writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(association));
    const workspace = resolveWorkspace({ productRoot: fx.product });
    expect(workspace).toMatchObject({ layout: "split", recordsRoot: fx.records, association: { status: "verified", projectId: "fixture-project" } });
    expect(workspace.association.assurance).toContain("not authentication");
    const captured = JSON.parse(JSON.stringify(association));
    rmSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH));
    expect(validateAssociation(captured, identity, { projectId: "fixture-project", source: "commit:captured" }).source).toBe("commit:captured");
    expect(() => validateAssociation({ ...captured, product: { ...captured.product, rootCommits: [original] } }, identity, { projectId: "fixture-project" })).toThrow(/association-root-commits-mismatch/);
    expect(() => validateAssociation(captured, measureProductIdentity(fx.product, { commit: original }), { projectId: "fixture-project" })).toThrow(/association-root-commits-mismatch/);
    const copy = path.join(fx.dir, "copy");
    git(fx.records, ["add", "."]); git(fx.records, ["commit", "--allow-empty", "-qm", "records snapshot"]);
    writeFileSync(path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify(captured));
    git(fx.records, ["add", "."]); git(fx.records, ["commit", "-qm", "portable association"]);
    git(fx.dir, ["clone", "-q", fx.records, copy]);
    const portable = readFileSync(path.join(copy, WORKSPACE_ASSOCIATION_REL_PATH), "utf8");
    expect(portable).not.toContain(fx.dir);
    expect(JSON.parse(portable)).toEqual(captured);
  } finally { removeGitFixture(fx.dir, "workspace split T-347"); }
});

test("workspace association and binding refusals are named and never use a stale colocated records copy", () => {
  const fx = fixture();
  try {
    const { association, binding, identity } = bind(fx);
    mkdirSync(path.join(fx.product, "docs/tasks"), { recursive: true });
    writeFileSync(path.join(fx.product, "docs/tasks/T-999-stale.md"), "stale board");
    expect(resolveWorkspace({ productRoot: fx.product }).association.status).toBe("verified");
    const invalid: Array<[object, RegExp]> = [
      [{ ...association, projectId: "other-project" }, /association-project-mismatch/],
      [{ ...association, version: 2 }, /association-version-unsupported/],
      [{ ...association, hostname: "host.example" }, /association-schema/],
      [{ ...association, product: { ...association.product, objectFormat: "unsupported" } }, /association-object-format-unsupported/],
      [{ ...association, product: { objectFormat: "sha256", rootCommits: ["a".repeat(64)] } }, /association-object-format-mismatch/],
      [{ ...association, product: { ...association.product, rootCommits: [...identity.rootCommits, "a".repeat(40)] } }, /association-root-commits-mismatch/],
    ];
    for (const [data, refusal] of invalid) expect(() => validateAssociation(data, identity, { projectId: binding.projectId })).toThrow(refusal);
    expect(() => validateAssociation({ version: 1, projectId: binding.projectId }, identity, { projectId: binding.projectId })).toThrow(/association-schema/);
    const assocPath = path.join(fx.records, WORKSPACE_ASSOCIATION_REL_PATH);
    rmSync(assocPath);
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/association-missing/);
    mkdirSync(assocPath);
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/association-unreadable/);
    rmSync(assocPath, { recursive: true });
    writeFileSync(assocPath, "{");
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/association-malformed/);
    rmSync(assocPath); symlinkSync(path.join(fx.dir, "absent-association"), assocPath);
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/association-unreadable/);
    const bindingPath = path.join(fx.product, WORKSPACE_BINDING_REL_PATH);
    writeFileSync(bindingPath, "{");
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/binding-malformed/);
    writeFileSync(bindingPath, JSON.stringify({ ...binding, version: 2 }));
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/binding-version-unsupported/);
    writeFileSync(bindingPath, JSON.stringify({ version: 1, productRoot: fx.product, recordsRoot: fx.records }));
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/binding-schema/);
    writeFileSync(bindingPath, JSON.stringify({ ...binding, productRoot: fx.records }));
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/binding-product-mismatch/);
    writeFileSync(bindingPath, JSON.stringify({ ...binding, recordsRoot: fx.product }));
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/binding-layout-mismatch/);
    writeFileSync(bindingPath, JSON.stringify({ ...binding, recordsRoot: path.join(fx.records, "safe") }));
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/records-root-nested/);
    writeFileSync(bindingPath, JSON.stringify({ ...binding, recordsRoot: path.join(fx.dir, "absent") }));
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/records-root-unreadable/);
    rmSync(bindingPath); symlinkSync(path.join(fx.dir, "absent-binding"), bindingPath);
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/binding-unreadable/);
  } finally { removeGitFixture(fx.dir, "workspace invalid T-347"); }
});

test("workspace product-only mode never opens private records and hostname changes do not affect resolution", () => {
  const fx = fixture();
  try {
    bind(fx);
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
      import fs from 'node:fs'; import cp from 'node:child_process'; import os from 'node:os'; import {syncBuiltinESMExports} from 'node:module';
      const mod=await import(${JSON.stringify(SUBJECT)}); const privateRoot=${JSON.stringify(fx.records)};
      for(const name of ['lstatSync','readFileSync','realpathSync']) {const original=fs[name];fs[name]=(...args)=>{if(String(args[0]).startsWith(privateRoot)) throw Error('PRIVATE RECORDS OPENED');return original(...args)}}
      const exec=cp.execFileSync;cp.execFileSync=(cmd,args,opts)=>{if(args.includes(privateRoot))throw Error('PRIVATE RECORDS OPENED');return exec(cmd,args,opts)};
      syncBuiltinESMExports(); os.hostname=()=> 'host-one'; const first=mod.resolveWorkspace({productRoot:${JSON.stringify(fx.product)},mode:'product-only'});
      os.hostname=()=> 'host-two'; const second=mod.resolveWorkspace({productRoot:${JSON.stringify(fx.product)},mode:'product-only'});
      if(JSON.stringify(first)!==JSON.stringify(second)) throw Error('hostname affected resolution');
      try {mod.resolveWorkspace({productRoot:${JSON.stringify(fx.product)}});throw Error('control failed')}catch(err){if(!String(err).includes('PRIVATE RECORDS OPENED'))throw err}
      console.log(JSON.stringify(first));
    `], { encoding: "utf8", env: { ...process.env, FORCE_COLOR: undefined, NO_COLOR: "1" } });
    expect(result.stderr).toBe(""); expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ layout: "split", association: { status: "unverified" } });
    rmSync(fx.records, { recursive: true });
    const workspace = resolveWorkspace({ productRoot: fx.product, mode: "product-only" });
    expect(workspace.recordsRoot).toBe(fx.records);
    expect(() => resolveResource(workspace, { role: "records", path: "safe/existing.txt" })).toThrow(/resource-records-unverified/);
    expect(resolveResource(workspace, { role: "product", path: "safe/existing.txt" }).root).toBe(fx.product);
  } finally { removeGitFixture(fx.dir, "workspace private T-347"); }
});

test("workspace shallow and incomplete product history cannot masquerade as a root-commit set", () => {
  const fx = fixture();
  try {
    const root = measureProductIdentity(fx.product).rootCommits[0]!;
    git(fx.product, ["commit", "--allow-empty", "-qm", "second commit"]);
    expect(measureProductIdentity(fx.product).rootCommits).toEqual([root]);
    const shallow = path.join(fx.dir, "shallow");
    git(fx.dir, ["clone", "-q", "--depth=1", `file://${fx.product}`, shallow]);
    expect(() => measureProductIdentity(shallow)).toThrow(/product-history-shallow/);
    git(fx.product, ["commit-graph", "write", "--reachable"]);
    expect(existsSync(path.join(fx.product, ".git/objects/info/commit-graph"))).toBe(true);
    const object = path.join(fx.product, ".git/objects", root.slice(0, 2), root.slice(2));
    rmSync(object);
    expect(() => measureProductIdentity(fx.product)).toThrow(/product-history-incomplete/);
  } finally { removeGitFixture(fx.dir, "workspace history T-347"); }
});

test("workspace resource keys use explicit roles and sources while path controls reject existing and new escapes", () => {
  const fx = fixture();
  try {
    bind(fx); const workspace = resolveWorkspace({ productRoot: fx.product });
    const product = resolveResource(workspace, { role: "product", path: "safe/existing.txt" });
    const records = resolveResource(workspace, { role: "records", path: "safe/existing.txt" });
    expect(product.relativePath).toBe(records.relativePath);
    expect(product.physicalPath).not.toBe(records.physicalPath);
    expect(product.key).not.toBe(records.key);
    expect(resolveResource(workspace, { role: "product", path: "safe/existing.txt", source: "commit:captured" }).key).not.toBe(product.key);
    const legacy = { "safe/only-records.txt": "product" };
    writeFileSync(path.join(fx.records, "safe/only-records.txt"), "exists only in records");
    expect(resolveResource(workspace, { token: "safe/only-records.txt" }, { legacyTokenMap: legacy }).root).toBe(fx.product);
    expect(() => resolveResource(workspace, { token: "safe/existing.txt" })).toThrow(/resource-legacy-unmapped/);
    expect(() => resolveResource(workspace, { token: "safe/existing.txt" }, { legacyTokenMap: { "safe/existing.txt": ["product", "records"] } })).toThrow(/resource-legacy-ambiguous/);
    expect(() => resolveResource(workspace, { role: "unknown", path: "safe/new.txt" })).toThrow(/resource-role-unknown/);
    expect(() => resolveResource(workspace, { token: "safe/existing.txt" }, { legacyTokenMap: { "safe/existing.txt": "unknown" } })).toThrow(/resource-role-unknown/);
    expect(() => resolveResource({ ...workspace, productRoot: "" }, { role: "product", path: "safe/new.txt" })).toThrow(/resource-root-unknown/);
    for (const token of ["/tmp/absolute", "C:\\absolute", "../escape", "safe/../escape", "safe\\escape", ".git/config", ".supertaskr/holder.json"]) {
      expect(() => resolveResource(workspace, { role: "product", path: token })).toThrow(/resource-(absolute|traversal|control)/);
    }
    symlinkSync(path.join(fx.product, "safe"), path.join(fx.product, "inside"));
    expect(resolveResource(workspace, { role: "product", path: "inside/new.txt" }).physicalPath).toBe(path.join(fx.product, "safe/new.txt"));
    symlinkSync(fx.records, path.join(fx.product, "outside"));
    for (const token of ["outside/safe/existing.txt", "outside/new/nested.txt"]) {
      expect(() => resolveResource(workspace, { role: "product", path: token })).toThrow(/resource-symlink-escape/);
    }
    symlinkSync(path.join(fx.product, ".git"), path.join(fx.product, "control"));
    expect(() => resolveResource(workspace, { role: "product", path: "control/new.txt" })).toThrow(/resource-control-path/);
  } finally { removeGitFixture(fx.dir, "workspace resources T-347"); }
});

test("T-347 VC1 — workspace runtime aliases of actual Git metadata refuse by physical identity", () => {
  const fx = fixture();
  try {
    const control = path.join(fx.product, "git-control-storage");
    git(fx.product, ["init", "-q", "--separate-git-dir", control]);
    expect(git(fx.product, ["rev-parse", "--absolute-git-dir"])).toBe(control);
    expect(resolveWorkspace({ productRoot: fx.product }).runtimeRoot).toBe(path.join(fx.product, ".supertaskr"));
    symlinkSync(control, path.join(fx.product, ".supertaskr"));
    expect(() => resolveWorkspace({ productRoot: fx.product })).toThrow(/runtime-(control-path|repository)/);
  } finally { removeGitFixture(fx.dir, "workspace Git runtime alias T-347"); }
});

test("T-347 VC2 — workspace resources refuse physical runtime storage through direct and symlink aliases", () => {
  const fx = fixture();
  try {
    const storage = path.join(fx.product, "runtime-storage");
    mkdirSync(storage);
    writeFileSync(path.join(storage, "existing.json"), "{}");
    symlinkSync(storage, path.join(fx.product, ".supertaskr"));
    symlinkSync(storage, path.join(fx.product, "runtime-alias"));
    const workspace = resolveWorkspace({ productRoot: fx.product });
    expect(resolveResource(workspace, { role: "product", path: "safe/new.txt" }).physicalPath).toBe(path.join(fx.product, "safe/new.txt"));
    for (const role of ["product", "records"]) {
      for (const token of ["runtime-storage/existing.json", "runtime-storage/new/record.json", "runtime-alias/existing.json", "runtime-alias/new/record.json"]) {
        expect(() => resolveResource(workspace, { role, path: token }), `${role}:${token}`).toThrow(/resource-control-path/);
      }
    }
  } finally { removeGitFixture(fx.dir, "workspace physical runtime resources T-347"); }
});

test("T-347 VC3 — workspace resources refuse separately named Git controls with safe-file positive controls", () => {
  const fx = fixture();
  try {
    const control = path.join(fx.product, "git-control-storage");
    git(fx.product, ["init", "-q", "--separate-git-dir", control]);
    expect(git(fx.product, ["rev-parse", "--absolute-git-dir"])).toBe(control);
    symlinkSync(control, path.join(fx.product, "git-alias"));
    const workspace = resolveWorkspace({ productRoot: fx.product });
    expect(resolveResource(workspace, { role: "product", path: "safe/new.txt" }).physicalPath).toBe(path.join(fx.product, "safe/new.txt"));
    for (const role of ["product", "records"]) {
      for (const token of ["git-control-storage/config", "git-control-storage/new/record.json", "git-alias/config", "git-alias/new/record.json"]) {
        expect(() => resolveResource(workspace, { role, path: token }), `${role}:${token}`).toThrow(/resource-control-path/);
      }
    }
  } finally { removeGitFixture(fx.dir, "workspace physical Git resources T-347"); }
});


test("T-347 VC4 — workspace repository roots preserve legal trailing whitespace", () => {
  const dir = realTemp();
  const safe = path.join(dir, "ordinary-product");
  const fx = { dir, product: path.join(dir, "product "), records: path.join(dir, "records ") };
  try {
    repository(safe); repository(fx.product); repository(fx.records);
    expect(resolveWorkspace({ productRoot: safe }).productRoot).toBe(safe);
    const actualTop = execFileSync("git", ["-C", fx.product, "rev-parse", "--show-toplevel"], {
      encoding: "utf8", env: ENV, stdio: ["ignore", "pipe", "pipe"],
    });
    expect(actualTop).toBe(`${fx.product}\n`);
    expect(resolveWorkspace({ productRoot: fx.product }).productRoot).toBe(fx.product);
    bind(fx);
    const workspace = resolveWorkspace({ productRoot: fx.product });
    expect(workspace).toMatchObject({ productRoot: fx.product, recordsRoot: fx.records, layout: "split", association: { status: "verified" } });
    expect(resolveResource(workspace, { role: "records", path: "safe/new.txt" }).physicalPath).toBe(path.join(fx.records, "safe/new.txt"));
  } finally { removeGitFixture(dir, "workspace trailing whitespace T-347"); }
});
