/** Supertaskr's explicit source-CI derivation, outside configured user gates. */
import { isMain } from "../../../cli/is-main.mjs";
import { owedForRange, OWED_SET_FLAG, RANGE_FLAG, TREE_FLAG, repoRoot } from "./gate-run.mjs";
import { SOURCE_CI_SUITES } from "./source-ci-contract.mjs";
/** @param {string[]} argv */
export function main(argv) {
  let range, root = repoRoot, ask = false, valid = true;
  const seen = new Set();
  for (let at = 0; at < argv.length; at++) {
    const flag = argv[at];
    if (seen.has(flag)) { valid = false; break; }
    seen.add(flag);
    if (flag === OWED_SET_FLAG) { ask = true; continue; }
    if (flag !== RANGE_FLAG && flag !== TREE_FLAG || !argv[at + 1] || argv[at + 1]?.startsWith("--")) { valid = false; break; }
    const value = /** @type {string} */ (argv[++at]);
    if (flag === RANGE_FLAG) range = value; else root = value;
  }
  if (!valid || !ask || range === undefined) { process.stdout.write(JSON.stringify({ problem: "Source CI requires --owed-set --range <base>..<tip> [--tree <source>]" }) + "\n"); return 2; }
  const owed = owedForRange(range, root, SOURCE_CI_SUITES);
  process.stdout.write(JSON.stringify(owed) + "\n"); return "problem" in owed ? 2 : 0;
}
if (isMain(import.meta)) process.exitCode = main(process.argv.slice(2));
