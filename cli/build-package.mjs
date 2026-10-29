/** Generated package assembly only: runtime rules remain in their source owners.
 * Keep the source-relative layout for static and dynamic imports. The package
 * contains no project docs, operational state, hook registrations or hook entries.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import ts from "typescript";

const cli = path.dirname(fileURLToPath(import.meta.url));
const source = path.dirname(cli);
const stage = path.join(cli, "dist");
rmSync(stage, { recursive: true, force: true });
if (!process.argv.includes("--clean")) {
  // Preserve the existing skill's canonical-source freshness check before
  // carrying its committed output into the independently rooted package.
  execFileSync(process.execPath, [path.join(source, "tools/e2e/scripts/interview-skill.mjs"), "--check"], {
    cwd: source, stdio: ["ignore", "pipe", "pipe"],
  });
  mkdirSync(stage, { recursive: true });
  const copy = (from, to) => {
    const target = path.join(stage, to);
    mkdirSync(path.dirname(target), { recursive: true });
    cpSync(path.join(source, from), target, { recursive: true });
  };
  for (const file of readdirSync(path.join(source, "tools/e2e/scripts"))) {
    if (file.endsWith(".mjs")) copy(`tools/e2e/scripts/${file}`, `tools/e2e/scripts/${file}`);
  }
  for (const name of ["lane-fence", "gate-token", "expand-fence", "hook-install", "pre-push-guard", "push-guard", "landing-gate", "configured-gate-reader", "is-main"]) {
    copy(`cli/${name}.mjs`, `cli/${name}.mjs`);
  }
  // Hooks load the parser's dependency-free TypeScript source in a fresh
  // checkout. Node forbids type stripping inside node_modules, so the packed
  // expander reads the same source's generated JavaScript instead.
  const expander = path.join(stage, "cli/expand-fence.mjs");
  writeFileSync(expander, readFileSync(expander, "utf8").replace('from "../lib/parser/src/fence.ts"', 'from "../lib/parser/dist/fence.js"'));
  const parser = path.join(stage, "lib/parser/dist");
  mkdirSync(parser, { recursive: true });
  for (const file of readdirSync(path.join(source, "lib/parser/src"))) {
    if (!file.endsWith(".ts") || file.endsWith(".d.ts")) continue;
    const input = readFileSync(path.join(source, "lib/parser/src", file), "utf8");
    const output = ts.transpileModule(input, { fileName: file, reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
    const errors = output.diagnostics?.filter((d) => d.category === ts.DiagnosticCategory.Error) ?? [];
    if (errors.length) throw new Error(`Cannot stage parser ${file}: ${errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n")).join("\n")}`);
    writeFileSync(path.join(parser, file.replace(/\.ts$/, ".js")), output.outputText);
  }
  copy("lib/parser/package.json", "lib/parser/package.json");
  copy("method", "method");
  // The existing installer already consumes this carried-skills location.
  copy("method/skills", "tools/e2e/dist/method/skills");
  // Build the TOOL's standalone indexer, never the selected project's code.
  // A local package is specific to its host; no target-project Rust layout or
  // checkout-relative executable is part of the installed command contract.
  const rustHost = /^host: (.+)$/m.exec(execFileSync("rustc", ["-vV"], {encoding:"utf8"}))?.[1];
  const architecture = process.arch === "arm64" ? "aarch64" : process.arch === "x64" ? "x86_64" : null;
  const operatingSystem = process.platform === "darwin" ? "apple-darwin" : process.platform === "linux" ? "linux" : process.platform === "win32" ? "windows" : null;
  if (!rustHost || !architecture || !operatingSystem || !rustHost.startsWith(`${architecture}-`) || !rustHost.includes(operatingSystem)) {
    throw new Error("The Rust host target does not match this package's Node platform and architecture");
  }
  const buildOutput = execFileSync("cargo", ["build", "--locked", "--release", "--target", rustHost,
    "--message-format=json", "-p", "supertaskr-index"], {
    cwd: path.join(source, "app/src-tauri"), stdio: ["ignore", "pipe", "pipe"],encoding:"utf8",maxBuffer:32*1024*1024,
  });
  const binary = `supertaskr-index${process.platform === "win32" ? ".exe" : ""}`;
  const expectedSource = path.join(source,"app/src-tauri/crates/supertaskr-index/src/bin/supertaskr-index.rs");
  const artifacts = buildOutput.split("\n").filter(Boolean).map(line => JSON.parse(line)).filter(message =>
    message.reason === "compiler-artifact" && message.target?.name === "supertaskr-index" &&
    message.target.kind?.includes("bin") && message.target.src_path === expectedSource && typeof message.executable === "string");
  if (artifacts.length !== 1) throw new Error("Cargo did not identify the tool's exact native indexer artifact");
  const artifact = artifacts[0].executable;
  const target = path.join(stage,`native/${process.platform}-${process.arch}/${binary}`);
  mkdirSync(path.dirname(target),{recursive:true});cpSync(artifact,target);
  // The nested script owner is a runtime layout, not a second npm package.
  // Its metadata keeps Node's .js interpretation explicit without shipping
  // development dependencies or another bin.
  writeFileSync(path.join(stage, "tools/e2e/package.json"), JSON.stringify({ type: "module" }) + "\n");
  if (!existsSync(path.join(parser, "pure.js"))) throw new Error("Missing staged parser pure entry");
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  const describe = (rel) => ({ path: rel, sha256: digest(readFileSync(path.join(stage, rel))) });
  const filesIn = (rel) => readdirSync(path.join(stage, rel), { withFileTypes: true }).flatMap((entry) => {
    const child = `${rel}/${entry.name}`;
    return entry.isDirectory() ? filesIn(child) : [child];
  }).sort();
  const parserMetadata = JSON.parse(readFileSync(path.join(stage, "lib/parser/package.json"), "utf8"));
  const methodVersion = /pub const METHOD_SNAPSHOT_VERSION: &str = "([^"]+)";/.exec(
    readFileSync(path.join(source, "app/src-tauri/src/agent/kit.rs"), "utf8"))?.[1];
  if (!methodVersion) throw new Error("Cannot derive the bundled method snapshot version");
  const methodFiles = filesIn("method").map(describe);
  const runtimeFiles = [...filesIn("tools/e2e/scripts"), ...filesIn("cli"), ...filesIn("native"), "tools/e2e/package.json"].sort().map(describe);
  const manifest = { version: 2, package: { name: "supertaskr", version: JSON.parse(readFileSync(path.join(cli, "package.json"), "utf8")).version,
      sha256: digest(readFileSync(path.join(cli, "package.json"))), entrySha256: digest(readFileSync(path.join(cli, "supertaskr.mjs"))) },
    parser: { version: parserMetadata.version, files: ["lib/parser/package.json", ...filesIn("lib/parser/dist")].sort().map(describe) },
    method: { version: methodVersion, packHash: digest(JSON.stringify(methodFiles)), files: methodFiles },
    runtime: { buildHash: digest(JSON.stringify(runtimeFiles)), files: runtimeFiles } };
  writeFileSync(path.join(stage, "tool-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
}
