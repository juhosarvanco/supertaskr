#!/usr/bin/env node
/** Finite configured PRODUCT entry. No private discovery or source defaults. */
import { spawnSync } from "node:child_process";
import { createProjectRuntime } from "./project-runtime.mjs";
import { loadInstalledRecordTool, requireInstalledRuntimeAssets } from "./records-check.mjs";
import { isMain } from "../../../cli/is-main.mjs";

/** @param {string[]} argv @param {{out?:(text:string)=>void,err?:(text:string)=>void}} [io] */
export function main(argv, io = {}) {
  const out = io.out ?? (text => process.stdout.write(text)), err = io.err ?? (text => process.stderr.write(text));
  const usage = "supertaskr smoke | names | guard-class <PRODUCT path>... [--at <exact commit>] [--root <PRODUCT>]";
  try {
    let root = process.cwd(), revision;
    const args = [...argv];
    for (const flag of ["--root", "--at"]) {
      const at = args.indexOf(flag);
      if (at === -1) continue;
      const value = args[at + 1];
      if (!value || value.startsWith("--") || args.lastIndexOf(flag) !== at) { err(`${usage}\n`); return 2; }
      if (flag === "--root") root = value; else revision = value;
      args.splice(at, 2);
    }
    const action = args.shift();
    if (!["smoke", "names", "guard-class"].includes(action ?? "") || ["smoke", "names"].includes(action ?? "") && args.length || action === "guard-class" && (!args.length || args.some(value => value.startsWith("--")))) { err(`${usage}\n`); return 2; }
    const head = revision === undefined ? spawnSync("git", ["-C", root, "rev-parse", "--verify", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) : undefined;
    if (head && head.status !== 0) { err("project-runtime: project-revision-unavailable\n"); return 3; }
    const tool = loadInstalledRecordTool();
    requireInstalledRuntimeAssets(tool, ["tools/e2e/scripts/project-command.mjs"]);
    const runtime = createProjectRuntime({ productRoot: root, productRevision: revision ?? /** @type {string} */ (head?.stdout).replace(/\n$/, ""), tool });
    if (action === "names") { const result = runtime.names(); out(`${JSON.stringify(result)}\n`); return result.findings.length ? 1 : 0; }
    if (action === "smoke") {
      const result = runtime.smoke(); out(result.stdout); err(result.stderr);
      if (result.problem) err(`smoke: ${result.problem}\n`);
      out(`smoke: ${result.code === 0 ? "completed" : result.code === 1 ? "failed" : "cannot-run"} at ${result.productRevision}\n`);
      return result.code;
    }
    const hits = runtime.classify(args); out(`${JSON.stringify({ paths: args, guarded: hits.length > 0, hits })}\n`); return 0;
  } catch (error) {
    const value = /** @type {any} */ (error); err(`project-runtime: ${value?.code ?? "cannot-run"}: ${error instanceof Error ? error.message : String(error)}\n`); return 3;
  }
}
if (isMain(import.meta)) process.exitCode = main(process.argv.slice(2));
