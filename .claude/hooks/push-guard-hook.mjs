#!/usr/bin/env node
/**
 * THE PUSH ASKS THE GRAPH MECHANICALLY (T-167-s8) — the runner.
 *
 * `.claude/settings.json` points a `PreToolUse` matcher on `Bash` at this
 * file. It reads the harness's request off stdin, asks `push-guard.mjs`,
 * and answers with an EXIT CODE:
 *
 *   0  stand aside — the harness's own permission flow runs untouched.
 *   2  refuse, with the reason on stderr, which is the documented
 *      blocking mechanism and the one that does not depend on a
 *      structured payload being recognised.
 *
 * The split is `lane-fence-hook.mjs`'s and exists for its reason:
 * execution here, decision in the module beside it, so importing the
 * decision is side-effect-free.
 *
 * ── AN UNREADABLE REQUEST STANDS ASIDE, WHICH IS THE OPPOSITE OF THE
 *    FENCE HOOK, AND THE ASYMMETRY IS DELIBERATE ────────────────────
 * `lane-fence-hook.mjs` falls through to `{}` and lets `decide` REFUSE,
 * because a lane may be stopped. This guard's only refusal is a graph the
 * check itself called STALE, and a request this file could not parse is
 * not that — it is a guard that could not run, and this card's third
 * criterion says in as many words that those two must not be collapsed.
 * So a mangled stdin costs a push nothing and the guard's silence is
 * recorded in `decide`'s own `no-command-to-read` arm rather than here.
 *
 * ── IT MUST BE CHEAP ON EVERY OTHER BASH CALL ────────────────────────
 * This matcher fires on every `Bash` tool call in the session, so the
 * common path — a command that is not a push — must cost only node's
 * startup and a regex. `decide` reaches that answer before it touches
 * the filesystem, and nothing heavier than `lane-fence.mjs` is imported
 * at module load. THE MEASUREMENT IS ON THE CARD.
 */
import { readFileSync } from "node:fs";
import { ANNOUNCED_ALLOW_CODES, decide } from "./push-guard.mjs";

/**
 * The request, or an empty one.
 *
 * @returns {import("./push-guard.mjs").Request}
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
// AN ALLOW THAT LEFT THE GRAPH UNVERIFIED SAYS SO — at exit 0, so that
// saying it can never become refusing it. See `ANNOUNCED_ALLOW_CODES`.
if (ANNOUNCED_ALLOW_CODES.includes(decision.code)) {
  process.stderr.write(`${decision.reason}\n`);
}
process.exit(0);
