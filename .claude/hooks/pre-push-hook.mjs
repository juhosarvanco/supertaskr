#!/usr/bin/env node
/**
 * THE PUSH IS JUDGED BY GIT ITSELF (T-314) — the runner.
 *
 * `.claude/hooks/pre-push` is the file git executes; it does nothing but
 * `exec` node on this module, which reads the proposed updates off
 * standard input, asks `pre-push-guard.mjs`, and answers with an EXIT
 * CODE:
 *
 *   0  the push proceeds.
 *   1  refuse, with the reason on stderr. Git prints whatever a hook
 *      writes to stderr and abandons the push on any non-zero exit, so
 *      this is the whole blocking mechanism and it depends on nothing
 *      being recognised.
 *
 * The split is `push-guard-hook.mjs`'s and exists for its reason:
 * execution here, decision in the module beside it, so a body can import
 * the decision without running it.
 *
 * ── AN UNREADABLE STANDARD INPUT DOES NOT STAND ASIDE, WHICH IS THE
 *    OPPOSITE OF `push-guard-hook.mjs`, AND THE ASYMMETRY IS DELIBERATE ─
 * That hook falls through to `{}` and lets `decide` allow, because a
 * `PreToolUse` payload it cannot parse may not even be a push. THIS
 * hook is only ever run by git, at a push, and its input is the list of
 * things about to leave the machine. An input that cannot be read is a
 * push nothing could be judged about, which is T-216-s8's case exactly —
 * so it is carried to `decidePrePush` as `stdinReadable: false` and
 * refused there by name rather than allowed here in silence.
 *
 * IT IS A FLAG AND NOT THE EMPTY STRING, deliberately. Git runs this hook
 * with EMPTY input when every ref is already up to date, which is an
 * allow; handing a failed read over as that same empty string makes the
 * refusal above unreachable and the sentence claiming it false.
 *
 * ── GIT'S OWN ARGV IS PASSED THROUGH AND NOT PARSED ─────────────────
 * A `pre-push` hook is handed the remote's NAME and its URL. This guard
 * judges objects and ranges, never a remote, so both are carried into the
 * decision for its refusals to quote and neither is read for a verdict.
 * A remote-aware rule is a different card's, and inventing one here would
 * be a convention written at a read site.
 */
import { readFileSync } from "node:fs";
import { decidePrePush } from "./pre-push-guard.mjs";

/** The proposed updates, and whether standard input could be read at all. */
function updates() {
  try {
    return { stdin: readFileSync(0, "utf8"), stdinReadable: true };
  } catch {
    return { stdin: "", stdinReadable: false };
  }
}

const decision = decidePrePush({
  cwd: process.cwd(),
  ...updates(),
  ...(typeof process.argv[2] === "string" ? { remote: process.argv[2] } : {}),
});

// NOTICES ARE SAID WHATEVER THE VERDICT IS, and before it — a landing
// gate that could not compare, a seat nobody claimed, a graph that was
// not asked are all statements that part of this push went UNJUDGED, and
// they must reach the seat whether the arms below then allowed or
// refused (T-212).
for (const notice of decision.notices ?? []) process.stderr.write(`${notice}\n`);
if (decision.verdict === "block") {
  process.stderr.write(`${decision.reason}\n`);
  process.exit(1);
}
// AN ALLOW THAT LEFT SOMETHING UNVERIFIED SAYS SO — at exit 0, so that
// saying it can never become refusing it. The list is the one
// `push-guard.mjs` publishes, plus this file's own two.
if (decision.code === "no-updates-proposed") process.stderr.write(`${decision.reason}\n`);
process.exit(0);
