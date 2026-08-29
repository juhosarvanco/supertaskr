#!/usr/bin/env node
/**
 * THE FENCE AT THE MOMENT OF THE WRITE (T-154) — the runner.
 *
 * `.claude/settings.json` points a PreToolUse matcher at this file. It
 * reads the harness's request off stdin, asks `lane-fence.mjs`, and
 * answers with an EXIT CODE:
 *
 *   0  stand aside — silently, so the harness's own permission flow runs
 *      untouched. This hook subtracts permission and never grants it.
 *   2  refuse, with the reason on stderr, which is the documented
 *      blocking mechanism and the one that does not depend on a
 *      structured payload being recognised.
 *
 * Execution lives HERE and the decision lives in the module beside it, so
 * importing the decision is side-effect-free — the `lint-tokens.mjs`
 * shape, for the reason that file gives: an
 * `import.meta.url === process.argv[1]` guard disagrees with itself under
 * symlinked checkouts and turns a gate into a silent exit 0.
 *
 * NOTHING BUT NODE BUILTINS, on either side of that split. A lane
 * worktree ninety seconds old has no `node_modules` anywhere in it.
 */
import { readFileSync } from "node:fs";
import { decide } from "./lane-fence.mjs";

/**
 * The request, or an empty one.
 *
 * AN UNREADABLE REQUEST IS NOT AN EXCUSE TO STAND ASIDE. Falling through
 * with `{}` is deliberate and is the fail-closed route, not a lenient
 * one: `decide` allows every non-lane context on the BRANCH alone and
 * never needs this payload to do it, and inside a lane a request with no
 * readable path is refused by name. So a mangled stdin costs an
 * integrator nothing and buys an executor nothing.
 *
 * @returns {import("./lane-fence.mjs").Request}
 */
function request() {
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  const toolName = obj["tool_name"];
  const toolInput = obj["tool_input"];
  const cwd = obj["cwd"];
  return {
    ...(typeof toolName === "string" ? { toolName } : {}),
    ...(toolInput !== null && typeof toolInput === "object" && !Array.isArray(toolInput)
      ? { toolInput: /** @type {Record<string, unknown>} */ (toolInput) }
      : {}),
    ...(typeof cwd === "string" && cwd !== ""
      ? { cwd }
      : typeof process.env["CLAUDE_PROJECT_DIR"] === "string" &&
          process.env["CLAUDE_PROJECT_DIR"] !== ""
        ? { cwd: /** @type {string} */ (process.env["CLAUDE_PROJECT_DIR"]) }
        : {}),
  };
}

const decision = decide(request());
if (decision.verdict === "block") {
  process.stderr.write(`${decision.reason}\n`);
  process.exit(2);
}
process.exit(0);
