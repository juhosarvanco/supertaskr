import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { measureProductIdentity, WORKSPACE_ASSOCIATION_REL_PATH, WORKSPACE_BINDING_REL_PATH } from "../scripts/workspace.mjs";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { seedProjectSettings } from "../scripts/project-settings.mjs";
import { GENERIC_RECORD_PROFILE } from "../scripts/records-validation.mjs";

export const SOURCE = path.resolve(import.meta.dirname, "../../..");
export const FIXTURE_ENV = { ...process.env, GIT_AUTHOR_NAME: "Private record fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "Private record fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" };
export const sha = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
export function fixtureProjectSettings(fixture: {manifestPath:string}) {
  const seed = seedProjectSettings({ tool: loadInstalledRecordTool(fixture.manifestPath), recordsValidation: GENERIC_RECORD_PROFILE });
  if (seed.status !== "ready") throw Error(seed.diagnostics.join("\n"));
  return seed.yaml;
}
export function privateGit(root: string, args: string[], input?: string) {
  return execFileSync("git", ["-C", root, "-c", "maintenance.auto=false", "-c", "gc.auto=0", ...args],
    { encoding: "utf8", env: FIXTURE_ENV, ...(input === undefined ? {} : { input }), stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"] }).replace(/\n$/, "");
}
export function putPrivate(root: string, file: string, text: string | Uint8Array) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), text);
}
export function commitPrivate(root: string, at?: string) {
  privateGit(root, ["add", ".", ":(exclude).supertaskr"]);
  execFileSync("git", ["-C", root, "commit", "-qm", "Private fixture snapshot"], { env: { ...FIXTURE_ENV,
    ...(at === undefined ? {} : { GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at }) }, stdio: ["ignore", "pipe", "pipe"] });
  return privateGit(root, ["rev-parse", "HEAD"]);
}
export function privateRecordFixture() {
  const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), "private-record-service-")));
  const product = path.join(dir, "python-project"), records = path.join(dir, "private-records"), tool = path.join(dir, "installed-tool");
  for (const root of [product, records]) {
    mkdirSync(root); privateGit(root, ["init", "-q", "--initial-branch=main"]);
    privateGit(root, ["config", "user.name", "Private fixture"]); privateGit(root, ["config", "user.email", "fixture@example.invalid"]);
  }
  putPrivate(product, "hello.py", "print('independent Python product')\n"); const productRevision = commitPrivate(product);
  for (const name of ["ROADMAP.md", "ARCHITECTURE.md", "CONVENTIONS.md", "NORTH_STAR.md", "STATE.md"]) {
    putPrivate(records, `docs/${name}`, readFileSync(path.join(SOURCE, "method/docs-templates", name)));
  }
  putPrivate(records, "docs/rooms/note.md", "# Private note\n\nOriginal private text.\n");
  putPrivate(product, WORKSPACE_BINDING_REL_PATH, JSON.stringify({ version: 1, projectId: "external-python", productRoot: product, recordsRoot: records }));
  const identity = measureProductIdentity(product);
  putPrivate(records, WORKSPACE_ASSOCIATION_REL_PATH, JSON.stringify({ version: 1, projectId: "external-python",
    product: { objectFormat: identity.objectFormat, rootCommits: identity.rootCommits } }));
  const recordsRevision = commitPrivate(records);
  const dist = path.join(tool, "dist"); mkdirSync(dist, { recursive: true });
  const parserPackage = JSON.parse(readFileSync(path.join(SOURCE, "lib/parser/package.json"), "utf8"));
  const packageBytes = readFileSync(path.join(SOURCE, "cli/package.json")), toolVersion = JSON.parse(packageBytes.toString("utf8")).version;
  const entryBytes = readFileSync(path.join(SOURCE, "cli/supertaskr.mjs"));
  putPrivate(tool, "package.json", packageBytes); putPrivate(tool, "supertaskr.mjs", entryBytes);
  // Actual staged child entries need the package's declared dependency too;
  // pure in-process checker fixtures previously resolved it from this harness.
  cpSync(path.join(SOURCE,"tools/e2e/node_modules/yaml"),path.join(tool,"node_modules/yaml"),{recursive:true});
  cpSync(path.join(SOURCE, "lib/parser/dist"), path.join(dist, "lib/parser/dist"), { recursive: true });
  putPrivate(dist, "lib/parser/package.json", readFileSync(path.join(SOURCE, "lib/parser/package.json")));
  const parserFiles: { path: string; sha256: string }[] = [];
  function collect(relative: string) {
    for (const name of readdirSync(path.join(dist, relative), { withFileTypes: true })) {
      const file = `${relative}/${name.name}`;
      if (name.isDirectory()) collect(file);
      else if (name.name.endsWith(".js")) parserFiles.push({ path: file, sha256: sha(readFileSync(path.join(dist, file))) });
    }
  }
  collect("lib/parser/dist"); parserFiles.push({ path: "lib/parser/package.json", sha256: sha(readFileSync(path.join(dist, "lib/parser/package.json"))) });
  parserFiles.sort((a, b) => a.path < b.path ? -1 : 1);
  const methodFiles = ["docs-protocol.md", "tasks/TASK-FORMAT.md", "runtime/process-schema.yaml", "runtime/supertaskr.yaml"].map((file) => {
    const bytes = readFileSync(path.join(SOURCE, "method", file)); putPrivate(dist, `method/${file}`, bytes);
    return { path: `method/${file}`, sha256: sha(bytes) };
  }).sort((a, b) => a.path < b.path ? -1 : 1);
  const methodVersion = /METHOD_SNAPSHOT_VERSION[^=]*=\s*"([^"]+)"/.exec(readFileSync(path.join(SOURCE, "app/src-tauri/src/agent/kit.rs"), "utf8"))?.[1];
  if (!methodVersion) throw Error("fixture requires the actual method version");
  const runtimePaths = readdirSync(path.join(SOURCE, "tools/e2e/scripts")).filter((file) => file.endsWith(".mjs")).map((file) => `tools/e2e/scripts/${file}`);
  runtimePaths.push(...["lane-fence", "gate-token", "expand-fence", "hook-install", "pre-push-guard", "push-guard", "landing-gate", "configured-gate-reader", "hook-git-context", "is-main"].map((name) => `cli/${name}.mjs`), "tools/e2e/package.json");
  const runtimeFiles = runtimePaths.sort().map((file) => { const bytes = readFileSync(path.join(SOURCE, file)); putPrivate(dist, file, bytes); return { path: file, sha256: sha(bytes) }; });
  const manifest = { version: 2, package: { name: "supertaskr", version: toolVersion, sha256: sha(packageBytes), entrySha256: sha(entryBytes) }, parser: { version: parserPackage.version, files: parserFiles },
    method: { version: methodVersion, packHash: sha(JSON.stringify(methodFiles)), files: methodFiles },
    runtime: { buildHash: sha(JSON.stringify(runtimeFiles)), files: runtimeFiles } };
  const manifestPath = path.join(dist, "tool-manifest.json"); writeFileSync(manifestPath, JSON.stringify(manifest));
  return { dir, product, records, tool, manifestPath, options: { productRoot: product, productRevision, recordsRevision },
    cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}
