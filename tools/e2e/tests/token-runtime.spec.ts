import { existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { armRuntimeDir, readToken, writeToken } from "../../../cli/gate-token.mjs";

const verdict = (suite: string) => ({ suite, exit: 0, bodies: 1, targets: 1, verdict: "GREEN", reason: "authored token-unit data", ref: "r", tree: "t", dirty: false });
const options = { tree: "t", treeAtWrite: "t", dirty: false };
function fixture() {
  const home = mkdtempSync(path.join(tmpdir(), "token-runtime-")), root = path.join(home, "product"), outside = path.join(home, "outside");
  mkdirSync(root); mkdirSync(outside);
  return { home, root, outside, runtime: path.join(root, ".supertaskr"), cleanup: () => rmSync(home, { recursive: true, force: true }) };
}

test("plain runtime arming preserves existing ignore bytes and plain tokens still merge", () => {
  const f = fixture(); try {
    const ignore = armRuntimeDir(f.root); expect(readFileSync(ignore, "utf8")).toContain("*");
    writeFileSync(ignore, "# existing owner bytes\n*\n"); const original = lstatSync(ignore).ino;
    const first = writeToken(f.root, [verdict("python")], options); expect(first.token.suites.python?.bodies).toBe(1);
    const second = writeToken(f.root, [verdict("checks")], options); expect(Object.keys(second.token.suites).sort()).toEqual(["checks", "python"]);
    expect(lstatSync(ignore).ino).toBe(original); expect(readFileSync(ignore, "utf8")).toBe("# existing owner bytes\n*\n");
    expect(readToken(f.root)).toHaveProperty("token");
  } finally { f.cleanup(); }
});

test("a linked runtime directory refuses arming and token writing without changing external canaries", () => {
  const f = fixture(); try {
    const outsideIgnore = path.join(f.outside, ".gitignore"), outsideToken = path.join(f.outside, "gate-verdict.json");
    writeFileSync(outsideIgnore, "external ignore canary\n"); writeFileSync(outsideToken, "external token canary\n");
    symlinkSync(f.outside, f.runtime, "dir");
    expect(() => armRuntimeDir(f.root)).toThrow(/token-runtime-path-unsafe/);
    expect(() => writeToken(f.root, [verdict("python")], options)).toThrow(/token-runtime-path-unsafe/);
    expect(readToken(f.root)).toMatchObject({ problem: expect.stringContaining("token-runtime-path-unsafe") });
    expect(readFileSync(outsideIgnore, "utf8")).toBe("external ignore canary\n"); expect(readFileSync(outsideToken, "utf8")).toBe("external token canary\n");
    expect(readdirSync(f.outside).sort()).toEqual([".gitignore", "gate-verdict.json"]);
  } finally { f.cleanup(); }
});

for (const leaf of [".gitignore", "gate-verdict.json"]) {
  for (const kind of ["symlink", "hardlink"] as const) {
    test(`${kind} ${leaf} refuses before bookkeeping or token writes and preserves its external canary`, () => {
      const f = fixture(); try {
        mkdirSync(f.runtime); const canary = path.join(f.outside, "canary.txt"), leafPath = path.join(f.runtime, leaf);
        writeFileSync(canary, "external plain canary\n");
        if (kind === "symlink") symlinkSync(canary, leafPath); else linkSync(canary, leafPath);
        expect(() => armRuntimeDir(f.root)).toThrow(/token-runtime-path-unsafe/);
        expect(() => writeToken(f.root, [verdict("python")], options)).toThrow(/token-runtime-path-unsafe/);
        expect(readFileSync(canary, "utf8")).toBe("external plain canary\n");
        expect(lstatSync(leafPath).isSymbolicLink()).toBe(kind === "symlink");
        expect(readdirSync(f.runtime)).toEqual([leaf]);
      } finally { f.cleanup(); }
    });
  }
}

test("a dangling ignore link cannot create its external target", () => {
  const f = fixture(); try {
    mkdirSync(f.runtime); const missing = path.join(f.outside, "must-stay-absent"); symlinkSync(missing, path.join(f.runtime, ".gitignore"));
    expect(() => armRuntimeDir(f.root)).toThrow(/token-runtime-path-unsafe/);
    expect(() => writeToken(f.root, [verdict("python")], options)).toThrow(/token-runtime-path-unsafe/);
    expect(existsSync(missing)).toBe(false); expect(readdirSync(f.outside)).toEqual([]);
  } finally { f.cleanup(); }
});
