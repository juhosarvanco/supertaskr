import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
/** Authored ordinary examples, with reusable method bytes from the product.
 * @param {string} root @param {string} productRoot */
export function seedExampleProject(root, productRoot) {
  cpSync(path.join(productRoot, "tools/e2e/fixtures/project"), root, { recursive: true });
  if (path.resolve(root) !== path.resolve(productRoot)) cpSync(path.join(productRoot, "method"), path.join(root, "method"), { recursive: true });
  const contract = readFileSync(path.join(productRoot, "CONTRIBUTING.md"), "utf8");
  const commands = contract.split("## Build & test\n")[1]?.split("\n## ")[0];
  if (!commands) throw new Error("example fixture requires the product contributor command contract");
  writeFileSync(path.join(root, "docs/conventions/commands.md"), "# Commands\n\n" + commands);
  const pointers = ["commands", "policy"].flatMap(name =>
    readFileSync(path.join(root, `docs/conventions/${name}.md`), "utf8").split("\n")
      .filter(line => line.startsWith("- ")).map(line => `  - docs/conventions/${name}.md — ${line.slice(2)}`));
  writeFileSync(path.join(root, "docs/CONVENTIONS.md"), "# Conventions\n\nThe contract: authored example rules for product tests.\n\n## Build & test\n\n" + pointers.join("\n") + "\n");
  for (const dir of ["app", "lib/parser", "tools/e2e", ".github"]) mkdirSync(path.join(root, dir), { recursive: true });
}
/** One independent mutable root per caller; no private records are read.
 * @param {string} productRoot @returns {string} */
export function createExampleProject(productRoot) {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-example-project-"));
  seedExampleProject(root, productRoot);
  process.once("exit", () => rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 }));
  return root;
}
