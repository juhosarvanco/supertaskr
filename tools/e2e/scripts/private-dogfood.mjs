#!/usr/bin/env node
/** Explicit real-board checks. Ordinary test discovery never invokes this. */
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveWorkspace } from "./workspace.mjs";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
/** @param {string} productRoot @param {string} productRevision */
function selected(productRoot, productRevision) {
  const redirected = ["GIT_DIR", "GIT_COMMON_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY", "GIT_ALTERNATE_OBJECT_DIRECTORIES", "GIT_NAMESPACE"].filter(name => process.env[name] !== undefined);
  if (redirected.length) throw new Error(`ambient Git repository selectors are not an explicit project context: ${redirected.join(", ")}`);
  if (!/^[0-9a-f]{40}$/.test(productRevision)) throw new Error("an explicit full product revision is required");
  const head = execFileSync("git", ["-C", productRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== productRevision) throw new Error("selected product HEAD differs from the requested source revision");
  const workspace = resolveWorkspace({ productRoot, mode: "development", commit: productRevision });
  if (workspace.layout !== "split") throw new Error("real-board dogfood requires an explicit split binding; no colocated fallback");
  return Object.freeze({ productRoot: workspace.productRoot, recordsRoot: workspace.recordsRoot, productRevision });
}

/** Test-side entry requires the explicit caller's verified context.
 * @returns {{productRoot:string,recordsRoot:string,productRevision:string}} */
export function privateDogfoodContext() {
  const raw = process.env.SUPERTASKR_PRIVATE_DOGFOOD_CONTEXT;
  if (!raw) throw new Error("private dogfood was not explicitly selected; use the private-dogfood command");
  const context = JSON.parse(raw);
  if (!context || typeof context.productRoot !== "string" || typeof context.recordsRoot !== "string" || typeof context.productRevision !== "string") throw new Error("invalid private dogfood context");
  const current = selected(context.productRoot, context.productRevision);
  if (current.productRoot !== sourceRoot) throw new Error("dogfood test source differs from selected product origin");
  if (current.recordsRoot !== context.recordsRoot) throw new Error("selected private records origin changed");
  return current;
}

/** @param {string[]} argv */
export function main(argv) {
  try {
    const [suite, productFlag, product, revisionFlag, revision, ...extra] = argv;
    if (!["parser", "app", "e2e", "native-provenance", "graph", "method-evals", "range-history"].includes(suite ?? "") || productFlag !== "--product" || !product || revisionFlag !== "--at" || !revision || extra.length) {
      console.error("usage: private-dogfood.mjs <parser|app|e2e|native-provenance|graph|method-evals|range-history> --product <source checkout> --at <full revision>");
      return 2;
    }
    const context = selected(product, revision);
    if (context.productRoot !== sourceRoot) throw new Error("dogfood runner and selected product source checkout differ");
    console.log(`private dogfood: product ${context.productRoot} @ ${revision}; records ${context.recordsRoot}`);
    if (suite === "range-history") {
      console.error("CANNOT RUN: range-history still requires separated RECORDS policy and PRODUCT historical derivation origins; obligation retained before activation");
      return 3;
    }
    if (suite === "method-evals") {
      console.error("CANNOT RUN: model-eval private policy provenance still requires its separated configured producer/context route; obligation retained before activation");
      return 3;
    }
    if (suite === "graph") {
      console.error("CANNOT RUN: committed private graph currency requires the separated native producer/check route; obligation retained before activation");
      return 3;
    }
    if (suite === "native-provenance") {
      const result = spawnSync("cargo", ["test", "--features", "private-dogfood", "--test", "agent_runner", "private_provenance_"], { cwd: path.join(context.productRoot, "app/src-tauri"), stdio: "inherit", env: { ...process.env, SUPERTASKR_PRIVATE_DOGFOOD_CONTEXT: JSON.stringify(context) } });
      return result.status ?? 3;
    }
    const cwd = path.join(context.productRoot, suite === "parser" ? "lib/parser" : suite === "app" ? "app" : "tools/e2e");
    const result = spawnSync("npm", ["run", "test:dogfood"], {
      cwd, stdio: "inherit", env: { ...process.env, SUPERTASKR_PRIVATE_DOGFOOD_CONTEXT: JSON.stringify(context) },
    });
    return result.status ?? 3;
  } catch (error) {
    console.error(`private dogfood REFUSED: ${error instanceof Error ? error.message : String(error)}`);
    return 3;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
