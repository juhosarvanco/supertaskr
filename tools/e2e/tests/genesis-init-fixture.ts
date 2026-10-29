import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { privateRecordFixture, SOURCE, FIXTURE_ENV, sha } from "./private-record-fixture";

/** Actual source TOOL bytes in an isolated installed-layout ordinary fixture. */
export function genesisFixture(omit?: string) {
  const base = privateRecordFixture(), dist = path.join(base.tool, "dist");
  cpSync(path.join(SOURCE, "method"), path.join(dist, "method"), { recursive: true });
  const files: { path: string; sha256: string }[] = [];
  const walk = (relative: string) => {
    for (const member of readdirSync(path.join(dist, relative), { withFileTypes: true })) {
      const file = `${relative}/${member.name}`;
      if (member.isDirectory()) walk(file);
      else if (file !== omit) files.push({ path: file, sha256: sha(readFileSync(path.join(dist, file))) });
    }
  };
  walk("method"); files.sort((a, b) => a.path < b.path ? -1 : 1);
  const manifest = JSON.parse(readFileSync(base.manifestPath, "utf8"));
  manifest.method.files = files; manifest.method.packHash = sha(JSON.stringify(files));
  writeFileSync(base.manifestPath, JSON.stringify(manifest));
  const product = path.join(base.dir, "new-code  "), records = path.join(base.dir, "new-notes"); mkdirSync(product); mkdirSync(records);
  return { ...base, product, records, methodFiles: files, toolHandle: loadInstalledRecordTool(base.manifestPath) };
}
export function genesisInput(f: ReturnType<typeof genesisFixture>) {
  return { productRoot: f.product, recordsRoot: f.records, operationId: "init-plan-fixture", projectId: "project-fixture", tool: f.toolHandle };
}
export function withGenesisIdentity<T>(body: () => T) {
  const keys = ["GIT_AUTHOR_NAME", "GIT_AUTHOR_EMAIL", "GIT_COMMITTER_NAME", "GIT_COMMITTER_EMAIL"] as const;
  const previous = keys.map(key => process.env[key]);
  try { keys.forEach(key => { process.env[key] = FIXTURE_ENV[key]; }); return body(); }
  finally { keys.forEach((key, at) => { if (previous[at] === undefined) delete process.env[key]; else process.env[key] = previous[at]; }); }
}
