import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { expect, test } from "@playwright/test";
import { NO_BACKGROUND_MAINTENANCE, removeGitFixture } from "./git-fixture";
import { sourceOnlyCheckout, observed } from "../fixtures/source-only";

test("source CI selector and its spawned adapter run with only the owed job's parser dependencies", () => {
  test.setTimeout(120_000);
  const root = sourceOnlyCheckout();
  const git = (args: string[]) => execFileSync("git", [...NO_BACKGROUND_MAINTENANCE,
    "-c", "user.name=Source CI fixture", "-c", "user.email=source-ci@example.invalid", ...args],
    { cwd: root, encoding: "utf8" }).trim();
  try {
    // The real owed job builds lib/parser, but does not install app, cli or
    // tools/e2e. Remove only this fixture's dependency links, never their targets.
    for (const dir of ["app", "cli", "tools/e2e"]) {
      const link = path.join(root, dir, "node_modules");
      if (existsSync(link)) unlinkSync(link);
    }
    expect(existsSync(path.join(root, "lib/parser/node_modules"))).toBe(true);
    git(["commit", "-qm", "source baseline"]);
    const base = git(["rev-parse", "HEAD"]);
    const parserSource = path.join(root, "lib/parser/src/index.ts");
    writeFileSync(parserSource, readFileSync(parserSource, "utf8") + "\n// Source CI cold-runner fixture.\n");
    git(["add", "--", "lib/parser/src/index.ts"]);
    git(["commit", "-qm", "parser input"]);
    const tip = git(["rev-parse", "HEAD"]), range = `${base}..${tip}`;
    const adapterPath = path.join(root, "tools/e2e/scripts/source-ci-owed.mjs");
    const run = (entry: string, args: string[], extraEnv: Record<string, string> = {}) => spawnSync(process.execPath, [entry, ...args], {
      cwd: root, encoding: "utf8", timeout: 60_000, maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "", ...extraEnv },
    });
    const adapter = run(adapterPath, ["--owed-set", "--range", range, "--tree", root]);
    expect(adapter.status, adapter.stderr + adapter.stdout).toBe(0);
    const owed = JSON.parse(adapter.stdout);
    expect(owed.problem).toBeUndefined();
    expect(owed.range).toBe(range);
    expect(owed.suites).toContain("parser");
    expect(owed.changed).toEqual(["lib/parser/src/index.ts"]);

    const output = path.join(root, "ci-job-output.txt");
    const sender = run(path.join(root, "tools/e2e/scripts/ci-owed.mjs"), [], {
      CI_OWED_TREE: root, GITHUB_EVENT_NAME: "pull_request", CI_PR_BASE_SHA: base,
      GITHUB_SHA: tip, GITHUB_OUTPUT: output,
    });
    expect(sender.status, sender.stderr + sender.stdout).toBe(0);
    expect(sender.stderr).not.toContain("could not answer");
    expect(sender.stdout).toContain(`range=${range}\n`);
    expect(sender.stdout).toContain(`suites=${[...owed.suites].sort().join(",")}\n`);
    expect(sender.stdout).toContain("run-parser=true\n");
    expect(readFileSync(output, "utf8")).toBe(sender.stdout);

    // A real refusal still owes all suites in the caller, rather than turning
    // the now-light import graph into a false successful empty selection.
    const missing = "f".repeat(40);
    const refused = run(adapterPath, ["--owed-set", "--range", `${missing}..${tip}`, "--tree", root]);
    expect(refused.status, refused.stderr + refused.stdout).toBe(2);
    expect(JSON.parse(refused.stdout).problem).toBeTruthy();
    const fallback = run(path.join(root, "tools/e2e/scripts/ci-owed.mjs"), [], {
      CI_OWED_TREE: root, GITHUB_EVENT_NAME: "pull_request", CI_PR_BASE_SHA: missing,
      GITHUB_SHA: tip, GITHUB_OUTPUT: "",
    });
    expect(fallback.status, fallback.stderr + fallback.stdout).toBe(0);
    expect(fallback.stderr).toContain("could not answer");
    expect(fallback.stdout).toContain("whole=true\n");
    for (const suite of ["parser", "app", "rust", "e2e"]) expect(fallback.stdout).toContain(`run-${suite}=true\n`);
  } finally { removeGitFixture(root, "source CI cold runner"); }
});


test("ordinary capability and skill entrypoints avoid private reads and writes with absent and defective private records", () => {
  const root = sourceOnlyCheckout();
  const privateHome = mkdtempSync(path.join(tmpdir(), "supertaskr-private-canary-"));
  try {
    for (const args of [["scripts/capabilities.mjs"], ["scripts/interview-skill.mjs"], ["scripts/capabilities.mjs", "--check"], ["scripts/interview-skill.mjs", "--check"]]) {
      const result = observed(root, args, [privateHome]);
      expect(result.output).not.toContain("GATE COULD NOT RUN");
      expect(result.code, result.output).toBe(0);
      expect(result.observedProcesses).toBeGreaterThan(0);
      expect(result.accesses, args.join(" ")).toEqual([]);
    }
    mkdirSync(path.join(root, "docs/tasks"), { recursive: true });
    writeFileSync(path.join(root, "docs/tasks/T-900-broken.md"), "---\nstatus: [broken\n");
    writeFileSync(path.join(root, "docs/INDEX.md"), "stale private INDEX\n");
    writeFileSync(path.join(root, "docs/ROADMAP.md"), "defective private roadmap\n");
    const before = readFileSync(path.join(root, "docs/INDEX.md"), "utf8");
    const clean = observed(root, ["scripts/capabilities.mjs", "--check"]);
    expect(clean.code, clean.output).toBe(0);
    expect(clean.accesses).toEqual([]);
    expect(readFileSync(path.join(root, "docs/INDEX.md"), "utf8")).toBe(before);
    const control = observed(root, ["--input-type=module", "-e", "import {readFile} from 'node:fs/promises'; await readFile(process.argv[1]);", path.join(root, "docs/INDEX.md")]);
    expect(control.code).toBe(0);
    expect(control.accesses.some(hit => hit.path === path.join(root, "docs/INDEX.md"))).toBe(true);
    const childControl = observed(root, ["--input-type=module", "-e", "import {spawnSync} from 'node:child_process'; const child=spawnSync(process.execPath,['-e',\"require('node:fs').readFileSync(process.argv[1])\",process.argv[1]],{stdio:'inherit'});process.exit(child.status);", path.join(root, "docs/ROADMAP.md")]);
    expect(childControl.code).toBe(0);
    expect(childControl.accesses.some(hit => hit.path === path.join(root, "docs/ROADMAP.md"))).toBe(true);
    const canary = path.join(privateHome, "private-record.md");
    writeFileSync(canary, "authored private access calibration\n");
    const alias = path.join(root, "private-alias.md");
    symlinkSync(canary, alias);
    const externalControl = observed(root, ["-e", "require('node:fs').readFile(process.argv[1],e=>{if(e)throw e})", alias], [privateHome]);
    expect(externalControl.code, externalControl.output).toBe(0);
    expect(externalControl.accesses.some(hit => hit.path === alias)).toBe(true);
    const nativeControl = observed(root, ["-e", "require('node:fs').realpathSync.native(process.argv[1])", alias], [privateHome]);
    expect(nativeControl.code, nativeControl.output).toBe(0);
    expect(nativeControl.accesses.some(hit => hit.path === alias && hit.operation === "realpathSync.native")).toBe(true);
  } finally { removeGitFixture(root, "product command isolation"); rmSync(privateHome, { recursive: true, force: true }); }
});

test("product census and interview freshness failures remain active without private records", () => {
  const root = sourceOnlyCheckout();
  try {
    expect(observed(root, ["scripts/capabilities.mjs"]).code).toBe(0);
    writeFileSync(path.join(root, "docs/CAPABILITIES.md"), "stale product census\n");
    const stale = observed(root, ["scripts/capabilities.mjs", "--check"]);
    expect(stale.code, stale.output).toBe(1);
    expect(stale.output).toContain("STALE");
    expect(stale.accesses).toEqual([]);
    const skill = path.join(root, "method/skills/supertaskr-interview/SKILL.md");
    writeFileSync(skill, readFileSync(skill, "utf8") + "\nstale seed\n");
    const kit = observed(root, ["scripts/interview-skill.mjs", "--check"]);
    expect(kit.code, kit.output).toBe(1);
    expect(kit.output).toContain("STALE");
    expect(kit.accesses).toEqual([]);
  } finally { removeGitFixture(root, "product freshness isolation"); }
});

test("the ordinary product docs gate keeps reader, owed-suite and root-anchor failures without reading private records", () => {
  const root = sourceOnlyCheckout();
  const write = (rel: string, source: string) => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), source);
    execFileSync("git", ["add", "--", rel], { cwd: root });
  };
  try {
    const clean = observed(root, ["scripts/docs-gate.mjs", "--census"]);
    expect(clean.code, clean.output).toBe(0);
    expect(clean.output).toContain("unqualified records context");
    expect(clean.accesses).toEqual([]);
    // A product reader has an actual product documentation input. Its diff
    // owes the owning suite even though no private board is available.
    const reader = "app/test/isolation-reader.ts";
    write(reader, "import {readFileSync} from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url'; const root=fileURLToPath(new URL('../../',import.meta.url)); readFileSync(path.join(root,'docs','CAPABILITIES.md'),'utf8');\n");
    const owed = observed(root, ["scripts/docs-gate.mjs", "--root", root, path.join(root, "docs/CAPABILITIES.md")]);
    expect(owed.code, owed.output).toBe(1);
    expect(owed.output).toContain("FIRES");
    expect(owed.output).toContain(reader);
    expect(owed.output).toContain("npm test from app/");
    expect(owed.accesses).toEqual([]);
    rmSync(path.join(root, reader));
    execFileSync("git", ["rm", "--cached", "--", reader], { cwd: root });
    const malformed = "app/test/isolation-malformed.ts";
    write(malformed, "import path from 'node:path'; import {fileURLToPath} from 'node:url'; const root=fileURLToPath(new URL('../../',import.meta.url)); path.join(opaqueRoot(),'docs','CAPABILITIES.md');\n");
    const unresolved = observed(root, ["scripts/docs-gate.mjs", "--census"]);
    expect(unresolved.code, unresolved.output).toBe(1);
    expect(unresolved.output).toContain(malformed);
    expect(unresolved.output).toContain("could not link");
    expect(unresolved.accesses).toEqual([]);
    rmSync(path.join(root, malformed));
    execFileSync("git", ["rm", "--cached", "--", malformed], { cwd: root });
    const anchor = "app/test/isolation-anchor.ts";
    write(anchor, "import {fileURLToPath} from 'node:url'; const root=fileURLToPath(new URL('../../',import.meta.url)); console.log(root);\n");
    const unaccounted = observed(root, ["scripts/docs-gate.mjs", "--census"]);
    expect(unaccounted.code, unaccounted.output).toBe(1);
    expect(unaccounted.output).toContain("root-anchor ACCOUNT and the tree disagree");
    expect(unaccounted.output).toContain(anchor);
    expect(unaccounted.accesses).toEqual([]);
    rmSync(path.join(root, anchor));
    execFileSync("git", ["rm", "--cached", "--", anchor], { cwd: root });

    // Accounted owners are not exempt: adding their first actual source docs
    // read changes the derived set and therefore invalidates their ledger row.
    const accounted = "tools/e2e/tests/workflow-permissions.spec.ts";
    const original = readFileSync(path.join(root, accounted), "utf8");
    write(accounted, original + "\nrequire('node:fs').readFileSync(path.join(repoRoot,'docs','CAPABILITIES.md'),'utf8');\n");
    const changedOwner = observed(root, ["scripts/docs-gate.mjs", "--census"]);
    expect(changedOwner.code, changedOwner.output).toBe(1);
    expect(changedOwner.output).toContain(`${accounted} — argued, no longer in the set`);
    write(accounted, original);

    const meterOwner = "tools/e2e/scripts/health-bands.mjs";
    const meter = readFileSync(path.join(root, meterOwner), "utf8");
    write(meterOwner, meter.replace("export function metersFromTree(root = repoRoot)", "export function metersFromTree(root = opaqueRoot())"));
    const staleContext = observed(root, ["scripts/docs-gate.mjs", "--census"]);
    expect(staleContext.code, staleContext.output).toBe(1);
    expect(staleContext.output).toContain("exact unadapted records-context account is stale");
    expect(staleContext.output).toContain("health-bands.mjs::metersFromTree");
    write(meterOwner, meter.replace("export function metersFromTree(root = repoRoot) {", "export function metersFromTree(root = repoRoot) {\n  path.join(opaqueRoot(), 'docs', 'new-own-source.md');"));
    const unmatched = observed(root, ["scripts/docs-gate.mjs", "--census"]);
    expect(unmatched.code, unmatched.output).toBe(1);
    expect(unmatched.output).toContain("could not link");
    expect(unmatched.output).toContain(meterOwner);
    expect(unmatched.accesses).toEqual([]);
  } finally { removeGitFixture(root, "product docs isolation"); }
});
