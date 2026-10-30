import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import ts from "typescript";
import { INSTALLED_PARSER_MODULES, loadInstalledRecordTool } from "../scripts/records-check.mjs";
import { privateRecordFixture, putPrivate, sha } from "./private-record-fixture";

/** Test-only compiler AST inventory, not a shipping JavaScript loader/parser.
 * Fail unknown dynamic imports or local escapes rather than guessing a root. */
function staticClosure(root: string, entry: string, read = (file: string) => readFileSync(path.join(root, file), "utf8")) {
  const local = new Set<string>(), external = new Set<string>(), pending = [entry];
  while (pending.length) {
    const file = pending.pop()!; if (local.has(file)) continue; local.add(file);
    const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require")) throw Error(`Unqualified dynamic parser dependency in ${file}`);
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        if (specifier !== undefined) {
          if (!ts.isStringLiteral(specifier)) throw Error(`Unknown parser import in ${file}`);
          if (specifier.text.startsWith(".")) {
            const relative = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier.text));
            if (!relative.endsWith(".js") || relative.startsWith("../") || path.posix.isAbsolute(relative)) throw Error(`Parser import escapes its compiled owner: ${relative}`);
            pending.push(relative);
          } else external.add(specifier.text);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return { local: [...local].sort(), external: [...external].sort() };
}

test("mandatory owned parser members equal the actual compiled pure-barrel static closure", () => {
  const root = path.resolve(import.meta.dirname, "../../../lib/parser/dist"), closure = staticClosure(root, "pure.js");
  expect([...INSTALLED_PARSER_MODULES].sort()).toEqual(closure.local); expect(new Set(INSTALLED_PARSER_MODULES).size).toBe(INSTALLED_PARSER_MODULES.length);
  expect(closure.local).toContain("component.js"); expect(closure.local).toContain("id-slot.js"); expect(closure.local).toContain("inert-spans.js"); expect(closure.local).not.toContain("project.js");
  expect(closure.external).toEqual(["yaml"]);
  const manifest = JSON.parse(readFileSync(new URL("../../../cli/package.json", import.meta.url), "utf8")); expect(manifest.dependencies).toHaveProperty("yaml");
  const authored = new Map([["pure.js", 'export { answer } from "./helper.js";'], ["helper.js", 'export const answer = 42;']]);
  expect(staticClosure("unused", "pure.js", file => authored.get(file)!)).toEqual({ local: ["helper.js", "pure.js"], external: [] });
  authored.set("helper.js", 'export const answer = () => import("./late.js");'); expect(() => staticClosure("unused", "pure.js", file => authored.get(file)!)).toThrow(/dynamic/);
  authored.set("helper.js", 'export { secret } from "../outside.js";'); expect(() => staticClosure("unused", "pure.js", file => authored.get(file)!)).toThrow(/escapes/);
});

test("each executed owned parser module must remain a captured member even when its file is present", () => {
  const f = privateRecordFixture();
  try {
    const original = readFileSync(f.manifestPath, "utf8"), intact = JSON.parse(original);
    expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
    for (const module of INSTALLED_PARSER_MODULES) {
      const member = `lib/parser/dist/${module}`, manifest = structuredClone(intact);
      expect(existsSync(path.join(f.tool, "dist", member)), member).toBe(true);
      expect(manifest.parser.files.some((row: any) => row.path === member), member).toBe(true);
      manifest.parser.files = manifest.parser.files.filter((row: any) => row.path !== member);
      putPrivate(f.tool, "dist/tool-manifest.json", JSON.stringify(manifest));
      expect(() => loadInstalledRecordTool(f.manifestPath), member).toThrow(/records-tool-runtime-mismatch/);
      putPrivate(f.tool, "dist/tool-manifest.json", original); expect(loadInstalledRecordTool(f.manifestPath).parserVersion).toBe(intact.parser.version);
    }
    // Hash-valid installed module bytes must still pair with the actually
    // loaded owner. A changed descriptor cannot excuse a different module.
    const member = "lib/parser/dist/component.js", bytes = readFileSync(path.join(f.tool, "dist", member)), changed = Buffer.concat([bytes, Buffer.from("\n// Different installed build\n")]), manifest = structuredClone(intact);
    putPrivate(f.tool, `dist/${member}`, changed); manifest.parser.files.find((row: any) => row.path === member).sha256 = sha(changed); putPrivate(f.tool, "dist/tool-manifest.json", JSON.stringify(manifest));
    expect(() => loadInstalledRecordTool(f.manifestPath)).toThrow(/records-tool-runtime-mismatch/);
    putPrivate(f.tool, `dist/${member}`, bytes); putPrivate(f.tool, "dist/tool-manifest.json", original); expect(loadInstalledRecordTool(f.manifestPath).package.name).toBe("supertaskr");
  } finally { f.cleanup(); }
});
