import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../scripts/docs-scan.mjs";

test("capability generation counts each inline or named string pair as one behavior without executing the spec", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "supertaskr-census-pairs-"));
  try {
    const scripts = path.join(root, "tools/e2e/scripts"), tests = path.join(root, "tools/e2e/tests");
    mkdirSync(scripts, { recursive: true }); mkdirSync(tests); mkdirSync(path.join(root, "docs"));
    const entry = path.join(scripts, "capabilities.mjs");
    writeFileSync(entry, readFileSync(path.join(repoRoot, "tools/e2e/scripts/capabilities.mjs")));
    writeFileSync(path.join(tests, "pairs.spec.ts"), [
      'throw new Error("Capability extraction must not execute this spec");',
      'for (const [owner,importer] of [["first-owner","first-importer"],["second-owner","second-importer"]]) {',
      '  test(`inline ${owner} from ${importer}`,()=>{});',
      '}',
      'const NAMED = [["third-owner","third-importer"],["fourth-owner","fourth-importer"],];',
      'for (const [owner,importer] of NAMED) {',
      '  test(`named ${owner} from ${importer}`,()=>{});',
      '}',
    ].join("\n"));
    const generated = spawnSync(process.execPath, [entry], { encoding: "utf8" });
    expect(generated.status, generated.stderr).toBe(0);
    const output = readFileSync(path.join(root, "docs/CAPABILITIES.md"), "utf8");
    expect(output).toContain("Census: **4 behaviours** — 4 extracted sentences + 0 named-not-extracted");
    for (const line of ["inline first-owner from first-importer", "inline second-owner from second-importer", "named third-owner from third-importer", "named fourth-owner from fourth-importer"]) expect(output).toContain(`- ${line}`);
    expect(output).not.toContain("Not extracted");
    const checked = spawnSync(process.execPath, [entry, "--check"], { encoding: "utf8" });
    expect(checked.status, checked.stderr).toBe(0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
