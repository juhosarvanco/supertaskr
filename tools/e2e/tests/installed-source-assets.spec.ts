import { cpSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { listInstalledRuntimeAssets, loadInstalledRecordTool, readInstalledRuntimeAssets } from "../scripts/records-check.mjs";
import { privateRecordFixture, putPrivate, sha } from "./private-record-fixture";

test("runtime source batches return detached frozen exact verified bytes and require captured membership", () => {
  const f = privateRecordFixture();
  try {
    const tool = loadInstalledRecordTool(f.manifestPath), members = listInstalledRuntimeAssets(tool);
    const selected = ["tools/e2e/scripts/gate-run.mjs", "cli/lane-fence.mjs"];
    const rows = readInstalledRuntimeAssets(tool, selected);
    expect(rows.map(row => row.path)).toEqual(selected);
    for (const row of rows) {
      const bytes = readFileSync(path.join(f.tool, "dist", row.path));
      expect(row.text).toBe(bytes.toString("utf8")); expect(row.sha256).toBe(sha(bytes)); expect(Object.isFrozen(row)).toBe(true);
    }
    expect(Object.isFrozen(rows)).toBe(true); expect(Object.isFrozen(members)).toBe(true);
    expect(members.every(row => Object.isFrozen(row))).toBe(true);
    expect(listInstalledRuntimeAssets(tool)).not.toBe(members);
    expect(() => readInstalledRuntimeAssets(structuredClone(tool), selected)).toThrow(/context-required/);
    for (const request of [[], [selected[0], selected[0]], ["../gate-run.mjs"], ["tools/e2e/scripts/not-installed.mjs"]]) {
      expect(() => readInstalledRuntimeAssets(tool, request as string[])).toThrow(/runtime-members?-required/);
    }
    const original = readFileSync(f.manifestPath, "utf8"), manifest = JSON.parse(original);
    manifest.runtime.files = manifest.runtime.files.filter((row: any) => row.path !== selected[0]); manifest.runtime.buildHash = sha(JSON.stringify(manifest.runtime.files));
    putPrivate(f.tool, "dist/tool-manifest.json", JSON.stringify(manifest));
    expect(readFileSync(path.join(f.tool, "dist", selected[0]!))).toBeTruthy();
    expect(() => readInstalledRuntimeAssets(loadInstalledRecordTool(f.manifestPath), selected)).toThrow(/runtime-member-required/);
    expect(() => readInstalledRuntimeAssets(tool, [selected[1]!])).toThrow(/context-changed/);
    putPrivate(f.tool, "dist/tool-manifest.json", original);
    expect(readInstalledRuntimeAssets(tool, selected)).toEqual(rows);
  } finally { f.cleanup(); }
});

test("runtime source reads repeat whole TOOL verification and refuse missing, changed or linked physical members", () => {
  for (const change of ["missing", "changed", "symlink", "ancestor"] as const) {
    const f = privateRecordFixture();
    try {
      const tool = loadInstalledRecordTool(f.manifestPath), relative = "cli/lane-fence.mjs", file = path.join(f.tool, "dist", relative), bytes = readFileSync(file);
      expect(readInstalledRuntimeAssets(tool, [relative])[0]?.sha256).toBe(sha(bytes));
      if (change === "ancestor") {
        const foreign = path.join(f.dir, "foreign-cli");
        // A symlinked ancestor to a complete byte-identical tree still refuses.
        cpSync(path.dirname(file), foreign, { recursive: true }); rmSync(path.dirname(file), { recursive: true }); symlinkSync(foreign, path.dirname(file));
      } else {
        rmSync(file);
        if (change === "changed") putPrivate(f.tool, `dist/${relative}`, "changed source\n");
        if (change === "symlink") { putPrivate(f.product, "external-source.mjs", bytes); symlinkSync(path.join(f.product, "external-source.mjs"), file); }
      }
      // Even a different, intact requested member cannot avoid full verification.
      expect(() => readInstalledRuntimeAssets(tool, ["tools/e2e/scripts/gate-run.mjs"])).toThrow(/records-tool-/);
      expect(() => listInstalledRuntimeAssets(tool)).toThrow(/records-tool-/);
    } finally { f.cleanup(); }
  }
});

test("listed binary runtime bytes cannot be silently decoded as replacement UTF-8 text", () => {
  const f = privateRecordFixture();
  try {
    const relative = "native/linux-x64/supertaskr-index", bytes = Buffer.from([0xff, 0xfe, 0x61]), manifest = JSON.parse(readFileSync(f.manifestPath, "utf8"));
    putPrivate(f.tool, `dist/${relative}`, bytes); manifest.runtime.files.push({ path: relative, sha256: sha(bytes) });
    manifest.runtime.files.sort((a: any, b: any) => a.path < b.path ? -1 : 1); manifest.runtime.buildHash = sha(JSON.stringify(manifest.runtime.files));
    putPrivate(f.tool, "dist/tool-manifest.json", JSON.stringify(manifest));
    const tool = loadInstalledRecordTool(f.manifestPath);
    expect(listInstalledRuntimeAssets(tool)).toContainEqual({ path: relative, sha256: sha(bytes) });
    expect(() => readInstalledRuntimeAssets(tool, [relative])).toThrow(/records-tool-assets-unavailable/);
    expect(readInstalledRuntimeAssets(tool, ["cli/lane-fence.mjs"])[0]?.text).toContain("export");
  } finally { f.cleanup(); }
});
