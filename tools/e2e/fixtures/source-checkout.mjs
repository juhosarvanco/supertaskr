import { execFileSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

/** Copy the actual current working source, with explicit product documents
 * and prepared public artifacts. No private corpus or workspace binding.
 * @param {{productRoot:string,destination?:string,gitOptions?:readonly string[]}} options
 * @returns {string} */
export function copySourceCheckout({productRoot, destination, gitOptions = []}) {
  const root = realpathSync(destination ?? mkdtempSync(path.join(tmpdir(), "supertaskr-source-only-")));
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: productRoot, encoding: "utf8" }).split("\0").filter(Boolean);
  for (const file of files) {
    if (file.startsWith("docs/") && file !== "docs/CAPABILITIES.md" && !file.startsWith("docs/guide/") && (!file.startsWith("docs/reference/") || file === "docs/reference/14-versions.md") || file.startsWith(".supertaskr/")) continue;
    try { lstatSync(path.join(productRoot, file)); }
    catch (error) { if (/** @type {{code?:string}} */ (error).code === "ENOENT") continue; throw error; }
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(productRoot, file), target);
  }
  cpSync(path.join(productRoot, "lib/parser/dist"), path.join(root, "lib/parser/dist"), { recursive: true });
  for (const dir of ["tools/e2e", "lib/parser", "app", "cli"]) {
    const deps = path.join(productRoot, dir, "node_modules");
    if (existsSync(deps)) symlinkSync(deps, path.join(root, dir, "node_modules"), "dir");
  }
  execFileSync("git", [...gitOptions, "init", "-q", "-b", "main"], { cwd: root });
  // Directory-only project ignore rules do not match dependency symlinks.
  // They are an execution facility, never fixture source or tracked input.
  writeFileSync(path.join(root, ".git/info/exclude"), ["/cli/node_modules", "/lib/parser/node_modules", "/tools/e2e/node_modules", "/app/node_modules", ""].join("\n"));
  execFileSync("git", ["add", "."], { cwd: root });
  return root;
}
