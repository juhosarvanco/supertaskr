import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { copySourceCheckout } from "./source-checkout.mjs";
import { repoRoot } from "../preflight";
import { NO_BACKGROUND_MAINTENANCE } from "../tests/git-fixture";

// Real product entrypoints, with their actual import graph and package aliases.
// Filled root docs/state are excluded; authored nested test fixtures remain.
export function sourceOnlyCheckout(destination?: string): string {
  return copySourceCheckout({ productRoot: repoRoot, gitOptions: NO_BACKGROUND_MAINTENANCE, ...(destination === undefined ? {} : { destination }) });
}

export function observed(root: string, argv: string[], privateNamespaces: string[] = []) {
  const log = path.join(root, "private-access.jsonl");
  writeFileSync(log, "");
  const result = spawnSync(process.execPath, argv, {
    cwd: path.join(root, "tools/e2e"), encoding: "utf8", timeout: 120_000,
    env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: `--require=${path.join(root, "tools/e2e/fixtures/private-access-observer.cjs")}`,
      SUPERTASKR_OBSERVE_PRIVATE_LOG: log, SUPERTASKR_OBSERVE_PRIVATE_ROOTS: JSON.stringify([root, repoRoot]),
      SUPERTASKR_OBSERVE_PRIVATE_NAMESPACES: JSON.stringify([path.resolve(repoRoot, "../supertaskr-evidence"), ...privateNamespaces]) },
  });
  const events = readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
  const accesses = events.filter(event => event.kind !== "observer-installed");
  return { code: result.status, output: result.stdout + result.stderr, accesses, observedProcesses: events.filter(event => event.kind === "observer-installed").length };
}
