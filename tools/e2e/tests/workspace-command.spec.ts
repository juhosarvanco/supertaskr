import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";
import { inspectWorkspace, workspaceMain } from "../scripts/workspace-command.mjs";
import { measureProductIdentity, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";

const ENV = { ...process.env, GIT_AUTHOR_NAME: "Workspace command fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Workspace command fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
function git(root: string, args: string[]) {
  return execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { env: ENV, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function fixture() {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "workspace-command-")));
  const product = path.join(dir, "code"), records = path.join(dir, "private");
  for (const root of [product, records]) {
    mkdirSync(root); git(root, ["init", "-q", "--initial-branch=main"]);
    writeFileSync(path.join(root, "initial.txt"), root === product ? "code\n" : "private\n");
    git(root, ["add", "."]); git(root, ["commit", "-qm", "Initial fixture"]);
  }
  const first = git(product, ["rev-parse", "HEAD"]);
  const identity = measureProductIdentity(product);
  mkdirSync(path.join(product, ".supertaskr"));
  const binding = path.join(product, WORKSPACE_BINDING_REL_PATH);
  writeFileSync(binding, JSON.stringify({ version: 1, projectId: "fixture", productRoot: product, recordsRoot: records }));
  writeFileSync(path.join(records, WORKSPACE_ASSOCIATION_REL_PATH), JSON.stringify({ version: 1, projectId: "fixture",
    product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } }));
  return { dir, product, records, binding, first, cleanup() { removeGitFixture(dir, "workspace command"); } };
}
function run(args: string[]) {
  let out = "", err = "";
  const status = workspaceMain(args, { out(text) { out += text; }, err(text) { err += text; } });
  return { status, out, err };
}

test("standalone helper reports the actual split roots and leaves their files, index and refs unchanged", () => {
  const fx = fixture();
  try {
    const before = [fx.product, fx.records].map(root => ({ head: git(root, ["rev-parse", "HEAD"]), index: readFileSync(path.join(root, ".git/index")) }));
    const helper = new URL("../scripts/workspace-command.mjs", import.meta.url);
    const result = spawnSync(process.execPath, [fileURLToPath(helper), "--root", fx.product], { cwd: fx.dir, env: ENV, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0); expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({ productRoot: fx.product, recordsRoot: fx.records,
      runtimeRoot: path.join(fx.product, ".supertaskr"), layout: "split", association: { status: "verified" } });
    for (const [position, root] of [fx.product, fx.records].entries()) {
      expect(git(root, ["rev-parse", "HEAD"])).toBe(before[position]?.head);
      expect(readFileSync(path.join(root, ".git/index"))).toEqual(before[position]?.index);
    }
    expect(existsSync(path.join(fx.product, ".supertaskr/runs"))).toBe(false);
  } finally { fx.cleanup(); }
});

test("product-only inspection does not need the unavailable private repository and development does", () => {
  const fx = fixture();
  try {
    rmSync(fx.records, { recursive: true, force: true });
    expect(inspectWorkspace(["--root", fx.product, "--product-only", "--at", fx.first])).toMatchObject({ layout: "split", recordsRoot: fx.records,
      association: { status: "unverified" } });
    const failed = run(["--root", fx.product]);
    expect(failed.status).toBe(3); expect(failed.out).toBe(""); expect(failed.err).toContain("records-root-unreadable");
    expect(existsSync(fx.records)).toBe(false);
  } finally { fx.cleanup(); }
});

test("an exact earlier product commit selects its lineage instead of the incompatible current HEAD", () => {
  const fx = fixture();
  try {
    git(fx.product, ["checkout", "-q", "--orphan", "unrelated"]);
    writeFileSync(path.join(fx.product, "initial.txt"), "different lineage\n"); git(fx.product, ["add", "."]); git(fx.product, ["commit", "-qm", "Other fixture lineage"]);
    expect(run(["--root", fx.product]).err).toContain("association-root-commits-mismatch");
    expect(inspectWorkspace(["--at", fx.first, "--root", fx.product]).association.productIdentity?.selectedCommit).toBe(fx.first);
    expect(() => inspectWorkspace(["--root", fx.product, "--at", "0".repeat(40)])).toThrow("product-commit-unavailable");
  } finally { fx.cleanup(); }
});

test("malformed explicit bindings refuse even product-only and never become colocated", () => {
  const fx = fixture();
  try {
    writeFileSync(fx.binding, "invalid explicit binding\n");
    for (const modifiers of [[], ["--product-only"]]) {
      const failed = run(["--root", fx.product, ...modifiers]);
      expect(failed.status).toBe(3); expect(failed.out).toBe(""); expect(failed.err).toContain("binding-malformed");
    }
    expect(readFileSync(fx.binding, "utf8")).toBe("invalid explicit binding\n");
    expect(existsSync(path.join(fx.product, "docs"))).toBe(false);
  } finally { fx.cleanup(); }
});

test("unknown, duplicated and moving revision arguments are usage refusals, while absence preserves the legacy view", () => {
  const fx = fixture();
  try {
    for (const args of [["--at", "HEAD"], ["--at", fx.first.slice(0, 12)], ["--root"], ["--root", fx.product, "--root", fx.records],
      ["--product-only", "--product-only"], ["--records-root", fx.records], ["--help", "--write"]]) {
      const failed = run(args); expect(failed.status, args.join(" ")).toBe(2); expect(failed.out).toBe("");
    }
    rmSync(fx.binding);
    expect(inspectWorkspace(["--root", fx.product, "--at", fx.first])).toMatchObject({ layout: "colocated", recordsRoot: fx.product });
    const help = run(["--help"]); expect(help.status).toBe(0); expect(help.out).toContain("supertaskr workspace");
  } finally { fx.cleanup(); }
});

test("physical alias entry judges invalid arguments beside canonical success and remains inert on import", () => {
  const fx = fixture(), helper = new URL("../scripts/workspace-command.mjs", import.meta.url);
  try {
    const canonical = spawnSync(process.execPath, [fileURLToPath(helper), "--root", fx.product], { cwd: fx.dir, env: ENV, encoding: "utf8" });
    expect(canonical.status, canonical.stderr).toBe(0);
    expect(JSON.parse(canonical.stdout)).toMatchObject({ productRoot: fx.product, recordsRoot: fx.records, layout: "split" });
    const linked = path.join(fx.dir, "workspace-entry.mjs"); symlinkSync(fileURLToPath(helper), linked);
    const alias = linked.startsWith("/private/var/") ? linked.slice("/private".length) : linked;
    expect(existsSync(alias)).toBe(true);
    const invalid = spawnSync(process.execPath, [alias, "--root", fx.product, "--at", "HEAD"], { cwd: fx.dir, env: ENV, encoding: "utf8" });
    expect(invalid.status, invalid.stderr).toBe(2); expect(invalid.stdout).toBe("");
    expect(invalid.stderr).toContain("workspace-command-exact-commit");
    const imported = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(alias).href)});process.stdout.write('import-inert');`], { cwd: fx.dir, env: ENV, encoding: "utf8" });
    expect(imported.status, imported.stderr).toBe(0); expect(imported.stdout).toBe("import-inert"); expect(imported.stderr).toBe("");
    expect(existsSync(path.join(fx.product, ".supertaskr/runs"))).toBe(false);
  } finally { fx.cleanup(); }
});
