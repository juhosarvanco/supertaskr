/** One immutable TOOL snapshot per test worker. This runs the real package
 * builder on a source-only copy, never on the delivery lane's frozen stage. */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { sourceOnlyCheckout } from "./source-only";
import { repoRoot } from "../preflight";
import { removeGitFixture } from "../tests/git-fixture";
let cached: {sourceRoot:string,packageRoot:string,runtimeRoot:string,observationRoots:string[],privateNamespaces:string[]} | undefined;
export function testToolRuntime() {
  if (cached) return cached;
  const sourceRoot=sourceOnlyCheckout();
  process.once("exit",()=>removeGitFixture(sourceRoot,"configured TOOL snapshot"));
  // Product generation is explicit in this copied package fixture. The real
  // checkout's stale-output checks and generated artifacts are untouched.
  execFileSync(process.execPath,[path.join(sourceRoot,"tools/e2e/scripts/interview-skill.mjs")],{cwd:sourceRoot,stdio:"pipe"});
  execFileSync(process.execPath,[path.join(sourceRoot,"cli/build-package.mjs")],{cwd:sourceRoot,stdio:"pipe",env:{...process.env,CARGO_TARGET_DIR:path.join(repoRoot,"app/src-tauri/target")}});
  cached={sourceRoot,packageRoot:path.join(sourceRoot,"cli"),runtimeRoot:path.join(sourceRoot,"cli/dist"),
    observationRoots:[sourceRoot,repoRoot],privateNamespaces:[path.resolve(repoRoot,"../supertaskr-evidence")]};
  return cached;
}
