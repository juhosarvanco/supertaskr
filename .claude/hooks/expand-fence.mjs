#!/usr/bin/env node
/**
 * THE FENCE EXPANSION, RUN WHERE A HOOK CAN REACH IT (T-212).
 *
 * `landing-gate.mjs` has to expand a card's `touches:` at PUSH time, and
 * `.claude/hooks/` runs under a dependency budget that `lane-fence.mjs`'s
 * header states and this file keeps: a lane worktree ninety seconds old
 * has no `node_modules` and no `lib/parser/dist` (docs/CONVENTIONS.md,
 * "A FRESH WORKTREE HAS NOTHING INSTALLED AND NOTHING BUILT"). That is
 * why `tools/e2e/scripts/lane-fence.mjs` expands ONCE at dispatch and
 * leaves the answer in a manifest.
 *
 * ── SO WHY NOT READ THAT MANIFEST ────────────────────────────────────
 * Because T-212's whole subject is that the manifest LIVES IN THE LANE.
 * A gate that reads it lets a lane widen its own gate by editing a JSON
 * file, and lane-protocol rule 5 forbids exactly that — "a fence is not
 * widened from inside the lane it fences". The gate must expand for
 * itself, from the card as committed on main.
 *
 * ── AND WHY THIS IS NOT A SECOND IMPLEMENTATION ──────────────────────
 * It imports `expandFence` and `UNFENCEABLE_PATHS` from
 * `lib/parser/src/fence.ts` — the SAME function `expandFence` the board,
 * `brief.mjs --dispatch` and `--write-fence` spend. Nothing here
 * normalises a token, compares a path or decides a verdict; the whole
 * file is a pipe from stdin to that function and back out as JSON.
 * lane-protocol rule 5: "THE EXPANSION READS ONE SOURCE AND MUST NEVER
 * GROW A SECOND."
 *
 * THE SOURCE IS IMPORTED, NOT THE BUILD, and that is what makes it
 * reachable with nothing installed: `fence.ts` carries exactly ONE import
 * and it is an `import type`, erased before execution. Node strips types
 * on a `.ts` entry point by default from 22.18, so this module has no
 * runtime dependency at all — not `yaml`, not `dist/`, not
 * `node_modules`. Where the stripping is unavailable this file fails to
 * LOAD, exits non-zero, and `landing-gate.mjs` answers CANNOT COMPARE
 * rather than guessing a fence.
 *
 * ── RESOLVED RELATIVE TO THIS FILE, WHICH IS THE POINT ───────────────
 * `../../lib/parser/src/fence.ts` is the parser of the checkout THIS HOOK
 * LOADS FROM, which `.claude/settings.json` roots at
 * `CLAUDE_PROJECT_DIR` — the dispatching checkout, not the lane
 * (docs/STATE.md: "the hook loads from the DISPATCHING checkout, so a
 * lane never arms its own fix"). A lane fencing `lib/parser` therefore
 * cannot edit the algorithm that judges it, for the same reason it cannot
 * edit the guard.
 *
 * ── A SUBPROCESS AND NOT AN IMPORT, FOR ONE MEASURED REASON ──────────
 * A `.ts` module can only be reached through `await import()`, and
 * `push-guard.mjs`'s `decide` is SYNCHRONOUS and is paid on EVERY `Bash`
 * tool call in the session. Making it async to serve an arm that fires
 * only on a lane push would spend the whole session's budget on the rare
 * path. `runCheck` in that same file already spawns a far heavier program
 * for the same reason; this one costs a node start and is reached only
 * after the command is known to be a push from a lane.
 *
 * ── THE PROTOCOL ─────────────────────────────────────────────────────
 * stdin:  {"touches": string[], "id"?: string, "file"?: string}
 * stdout: {"paths": string[], "excluded": string[], "unusable": string[],
 *          "unfenceable": string[]}
 * exit 0 expanded, 3 could not run — the house's split between "I derived
 * it" and "I could not tell you", which every gate in this project keeps.
 */
import { readFileSync } from "node:fs";
import { expandFence, UNFENCEABLE_PATHS } from "../../lib/parser/src/fence.ts";

/** @param {string} why @returns {never} */
function cannotRun(why) {
  process.stderr.write(`expand-fence: ${why}\n`);
  process.exit(3);
}

/** @type {unknown} */
let request;
try {
  request = JSON.parse(readFileSync(0, "utf8"));
} catch (err) {
  cannotRun(`its request was not readable JSON (${err instanceof Error ? err.message : String(err)})`);
}
if (request === null || typeof request !== "object" || Array.isArray(request)) {
  cannotRun("its request was not an object");
}
const obj = /** @type {Record<string, unknown>} */ (request);
const touches = obj["touches"];
if (!Array.isArray(touches) || !touches.every((t) => typeof t === "string")) {
  cannotRun("its request carried no `touches` array of strings");
}
const id = obj["id"];
const file = obj["file"];

// `components: []` IS THE HONEST ARGUMENT AND NOT AN OMISSION. The slug
// map is each component file's own `touch_slugs:` field, and reading it
// needs the frontmatter parser, which needs `yaml`, which is outside this
// budget. `expandFence` answers `unresolved` for a token it cannot
// resolve and the fence's `unusable` list carries it out — rule 5's THIRD
// verdict, produced by the parser rather than invented by the caller. A
// caller that treated an unresolved token as reserving nothing would be a
// fence answering "no overlap" when it means "I do not know", which is
// the defect `fence.ts` exists to remove.
const fence = expandFence(
  {
    touches: /** @type {string[]} */ (touches),
    ...(typeof id === "string" && id !== "" ? { id } : {}),
    ...(typeof file === "string" && file !== "" ? { file } : {}),
  },
  [],
);

process.stdout.write(
  `${JSON.stringify({
    paths: fence.paths,
    excluded: fence.excluded,
    unusable: fence.unusable,
    unfenceable: [...UNFENCEABLE_PATHS],
  })}\n`,
);
