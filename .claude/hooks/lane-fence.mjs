/**
 * THE FENCE AT THE MOMENT OF THE WRITE (T-154) — the decision half.
 *
 * `method/lane-protocol.md` rule 5 says an executor whose work reaches
 * outside its own `touches:` has found a dispatch error rather than a
 * licence. That was a discipline, and three logged incidents went through
 * it. This module makes it a PROPERTY of the write: a PreToolUse hook on
 * the file-writing tools asks this function, and the answer is what the
 * tool call is allowed to do.
 *
 * ── ZERO DEPENDENCIES, AND THAT IS THE WHOLE DESIGN ──────────────────
 * The first draft of this card expanded the fence AT HOOK TIME through
 * `@nputer/parser`, which cannot work: a fresh lane worktree has nothing
 * installed and nothing built (docs/CONVENTIONS.md, "A FRESH WORKTREE HAS
 * NOTHING INSTALLED AND NOTHING BUILT"), so a fail-closed hook needing
 * `lib/parser/dist` blocks the executor's FIRST LEGAL WRITE, and every
 * escape hatch is worse — fail-open guts the guard, and a parser-free
 * re-implementation of the fence is the T-057 sin.
 *
 * So the expansion happens ONCE, at dispatch, where a built parser exists
 * by definition (`tools/e2e/scripts/lane-fence.mjs`), and this file only
 * ever READS the result. Nothing here imports anything but node builtins:
 * no `node_modules`, no build step, no `lib/parser/dist`, no `git`
 * subprocess. It runs against a checkout that was cut ninety seconds ago.
 *
 * ── WHAT THIS FILE DELIBERATELY DOES NOT RE-SPELL ────────────────────
 * The fence VOCABULARY — slug expansion, the unfenceable directory, the
 * card's own-file carve-out, normalisation — is `lib/parser/src/fence.ts`
 * and stays there. The manifest carries the ANSWER (`paths`,
 * `alwaysWritable`), so the only path rule in this file is containment on
 * an already-normalised domain, which is the minimum a reader can do and
 * still be a reader. The two constants this file cannot avoid holding —
 * the manifest's location and the lane branch spelling — are COMPARED
 * against their authorities by `tools/e2e/tests/lane-fence.spec.ts`
 * rather than trusted, which is docs/ARCHITECTURE.md's own treatment of
 * its slug block one layer over.
 *
 * ── HOW IT ANSWERS, AND WHY ALLOW IS SILENT ──────────────────────────
 * BLOCK is exit 2 with the reason on stderr — the documented mechanism
 * that blocks by EXIT CODE and overrides any JSON, so a harness that does
 * not understand a structured verdict still refuses the write. A guard
 * whose refusal depends on a payload shape being recognised is a guard
 * that fails OPEN on the day the shape moves.
 *
 * ALLOW is exit 0 with NOTHING PRINTED, and that is not laziness: an
 * explicit `permissionDecision: "allow"` would SHORT-CIRCUIT the harness's
 * own permission flow and auto-approve writes the human would otherwise
 * be asked about. This hook exists to subtract permission, never to grant
 * it. So it refuses, or it stands aside.
 *
 * ── THE HONEST LIMITS, DECLARED RATHER THAN DISCOVERED ───────────────
 * 1. BASH-MEDIATED WRITES ARE NOT COVERED. A `sed -i`, a `>` redirect or
 *    a `git checkout` reaches the disk without an Edit or a Write, and
 *    v1 leaves those to the protocol. Widening the matcher to `Bash`
 *    means parsing shell to find a write target, which answers
 *    confidently and wrongly — the failure `fence.ts` refuses one layer
 *    up.
 * 2. A PATH OUTSIDE THE LANE'S OWN CHECKOUT IS ALLOWED. The scratchpad,
 *    `/tmp`, a drill worktree and a SIBLING LANE'S TREE all sit outside,
 *    and the manifest's domains are repository-relative, so there is
 *    nothing to judge them against. Blocking every out-of-tree write
 *    would break the poison drill this project requires.
 * 3. IT PROTECTS THE LANE, NOT THE FENCE. The guard is armed by the
 *    WRITING session's own branch, so a session in the integration
 *    checkout editing a file some other live lane holds is not seen —
 *    which is the shape of two of the three incidents the card cites.
 *    Answering that needs every live lane's manifest, not this one's.
 * 4. IT IS ADVICE TO A COOPERATING HARNESS. A session that can edit
 *    `.claude/settings.json` can disarm it; the fence forbids exactly
 *    that for every lane whose `touches:` does not carry `.claude/`,
 *    which is the property this file has and not a proof.
 */

import { readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * The manifest, relative to the checkout root it governs.
 *
 * `.nputer/` is the runtime directory ADR-017 already confines app-side
 * writes to, and the writer drops a self-ignoring `.gitignore` beside
 * this file so a lane can never commit its own fence into the tree
 * everyone else then reads.
 */
export const MANIFEST_REL_PATH = ".nputer/lane-fence.json";

/**
 * The manifest schema this reader understands. A manifest stamped with
 * anything else BLOCKS rather than being read optimistically: a reader
 * that guesses at an unknown shape is a reader that under-reserves.
 */
export const MANIFEST_VERSION = 1;

/**
 * The lane branch spelling, as a matcher over the FULL ref.
 *
 * THE AUTHORITY IS docs/CONVENTIONS.md's lane bullet, which publishes
 * `task/T-NNN-<slug>`, and `dispatch-brief.mjs`'s `laneSpellings` derives
 * a matcher from it for every other consumer. This file cannot call that
 * derivation — it would have to read and parse CONVENTIONS on every
 * keystroke, with no dependency budget to do it well — so it holds the
 * matcher and the spec COMPARES the two, which is the treatment
 * docs/ARCHITECTURE.md gives its own slug block. A change to the
 * published spelling reds `lane-fence.spec.ts` by name.
 *
 * THE OLDER `tNNN-…` SPELLING IS DELIBERATELY NOT MATCHED. CONVENTIONS
 * records both as live and neither as a mistake, but the old set stops at
 * T-050 and nothing dispatches into it; a lane on one is simply not
 * guarded, which is the pre-T-154 state and not a regression.
 */
export const LANE_BRANCH_RE = /^refs\/heads\/task\/T-(\d+)-.+$/;

/**
 * Where a file-writing tool puts its target path.
 *
 * TWO SPELLINGS ARE ACCEPTED ON PURPOSE. The harness's own hook examples
 * read `tool_input.file_path` while its tool reference documents `path`,
 * and a guard that picked one and was wrong would answer "I cannot read
 * this request" on every write. Both are read, first present wins, and
 * the case where NEITHER is present is a refusal rather than a shrug —
 * see `decide`.
 */
export const WRITE_TOOL_PATH_FIELDS = Object.freeze([
  "file_path",
  "path",
  "notebook_path",
]);

/**
 * @typedef {object} Decision
 * @property {"allow" | "block"} verdict
 * @property {string} code   a stable, greppable name for WHY
 * @property {string} reason the sentence the blocked session reads
 */

/**
 * @param {string} code
 * @param {string} reason
 * @returns {Decision}
 */
function allow(code, reason) {
  return { verdict: "allow", code, reason };
}

/**
 * @param {string} code
 * @param {string} reason
 * @returns {Decision}
 */
function block(code, reason) {
  return { verdict: "block", code, reason };
}

/**
 * Walk up from `start` to the first directory holding a `.git` entry.
 *
 * A LANE WORKTREE'S `.git` IS A FILE, NOT A DIRECTORY, which is why this
 * tests for existence rather than for a directory: `git worktree add`
 * leaves a one-line `gitdir:` pointer, and a check for a directory would
 * walk straight past every lane this guard exists for and find the main
 * checkout instead.
 *
 * @param {string} start
 * @returns {string | undefined} the checkout root, or `undefined` when
 *   there is no repository above `start` at all
 */
export function findCheckoutRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    try {
      statSync(path.join(dir, ".git"));
      return dir;
    } catch {
      /* keep climbing */
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * The full symbolic ref this checkout's HEAD names, read off disk.
 *
 * NO `git` SUBPROCESS, for the reason at the top of this file: the hook
 * runs on every write and a spawn per keystroke is a tax the guard has to
 * justify. `HEAD` is one small file in both shapes — a `.git` DIRECTORY
 * in an ordinary checkout, and the `gitdir:` pointer a worktree carries.
 *
 * Returns `undefined` for a DETACHED head (the content is a bare object
 * id, not a `ref:` line) and for anything unreadable. Both mean the same
 * thing to the caller: this checkout names no branch, so it is not a lane.
 *
 * @param {string} root
 * @returns {string | undefined}
 */
export function readHeadRef(root) {
  let gitPath = path.join(root, ".git");
  let stat;
  try {
    stat = statSync(gitPath);
  } catch {
    return undefined;
  }
  if (!stat.isDirectory()) {
    let pointer;
    try {
      pointer = readFileSync(gitPath, "utf8");
    } catch {
      return undefined;
    }
    const m = /^gitdir:\s*(.+?)\s*$/m.exec(pointer);
    if (m === null) return undefined;
    const target = /** @type {string} */ (m[1]);
    gitPath = path.isAbsolute(target) ? target : path.resolve(root, target);
  }
  let head;
  try {
    head = readFileSync(path.join(gitPath, "HEAD"), "utf8");
  } catch {
    return undefined;
  }
  const ref = /^ref:\s*(\S+)\s*$/m.exec(head);
  return ref === null ? undefined : /** @type {string} */ (ref[1]);
}

/**
 * The card's `touches:` line, verbatim, from a card's frontmatter.
 *
 * ONE EXTRACTION, TWO CALLERS, AND THE SPEC PROVES THEY AGREE. The writer
 * stamps what IT read; this reads the card again at write time and
 * compares the two strings. A second implementation of "which line is the
 * touches line" would be two chances to disagree, so
 * `lane-fence.spec.ts` runs both over EVERY live card and requires
 * character-identical answers.
 *
 * Scoped to the frontmatter block on purpose: a card's BODY routinely
 * quotes a `touches:` line (this one does), and a body match would make
 * the stamp compare against prose.
 *
 * @param {string} text the card file's whole content
 * @returns {string | undefined} the line, trimmed of trailing whitespace
 */
export function touchesLineOf(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") return undefined;
  for (let i = 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (line === "---") return undefined;
    if (line.startsWith("touches:")) return line.replace(/\s+$/, "");
  }
  return undefined;
}

/**
 * Is `rel` inside the path domain `domain`?
 *
 * Containment IS the rule, and equality is its degenerate case: a fence
 * naming `tools/e2e` reserves `tools/e2e/tests/x.spec.ts`. Both sides
 * arrive already normalised — the domains from `expandFence`, `rel` from
 * `path.relative` — so this function normalises nothing and is not a
 * second copy of `normalizeFenceToken`.
 *
 * @param {string} rel
 * @param {string} domain
 * @returns {boolean}
 */
export function within(rel, domain) {
  return rel === domain || rel.startsWith(`${domain}/`);
}

/**
 * @typedef {object} Manifest
 * @property {number} version
 * @property {string} taskId
 * @property {string} branch
 * @property {string} card
 * @property {string} touchesLine
 * @property {string[]} paths
 * @property {string[]} alwaysWritable
 */

/**
 * Read and shape-check the manifest.
 *
 * EVERY FAILURE IS A REFUSAL AND NONE IS A SHRUG. A manifest that is
 * absent, unparseable, of an unknown version or missing a field is a
 * manifest this reader cannot enforce, and a guard that cannot enforce
 * says so — `fence.ts`'s own three-verdict rule, one layer down.
 *
 * @param {string} root
 * @returns {{ manifest: Manifest } | { problem: string }}
 */
export function readManifest(root) {
  const file = path.join(root, MANIFEST_REL_PATH);
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return { problem: `no fence manifest at ${MANIFEST_REL_PATH}` };
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      problem:
        `the fence manifest at ${MANIFEST_REL_PATH} is not readable JSON ` +
        `(${err instanceof Error ? err.message : String(err)})`,
    };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { problem: `the fence manifest at ${MANIFEST_REL_PATH} is not an object` };
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  if (obj["version"] !== MANIFEST_VERSION) {
    return {
      problem:
        `the fence manifest at ${MANIFEST_REL_PATH} is version ` +
        `${JSON.stringify(obj["version"])}, and this hook reads version ${MANIFEST_VERSION}`,
    };
  }
  /** @param {unknown} v @returns {v is string[]} */
  const isStrings = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
  const { taskId, branch, card, touchesLine, paths, alwaysWritable } = obj;
  if (
    typeof taskId !== "string" ||
    typeof branch !== "string" ||
    typeof card !== "string" ||
    typeof touchesLine !== "string" ||
    !isStrings(paths) ||
    !isStrings(alwaysWritable)
  ) {
    return {
      problem:
        `the fence manifest at ${MANIFEST_REL_PATH} is missing a field this hook needs ` +
        "(taskId, branch, card, touchesLine, paths, alwaysWritable)",
    };
  }
  return { manifest: { version: MANIFEST_VERSION, taskId, branch, card, touchesLine, paths, alwaysWritable } };
}

/** The route a blocked session takes, quoted in every fence refusal. */
export const ROUTE =
  "A fence is not widened from inside the lane it fences " +
  "(method/lane-protocol.md rule 5). Either the work belongs to another card — " +
  "file it as a `status: suggested` card under docs/tasks/ with `suggested_by:` set and " +
  "build the part that fits — or the fence itself is wrong, which is a dispatch error for " +
  "triage to rule on and never this hook's to decide.";

/**
 * @typedef {object} Request
 * @property {string} [toolName]
 * @property {Record<string, unknown>} [toolInput]
 * @property {string} [cwd]
 */

/**
 * The whole decision.
 *
 * READ THE ORDER, IT IS THE MECHANISM. Lane-ness is settled FIRST and
 * from the BRANCH alone, so every non-lane context — the integration
 * checkout, a detached drill worktree, the human's own app checkout,
 * a directory that is not a repository at all — is answered before a
 * manifest is looked for. That is the positive control the card asks
 * for: an allow here is a decision this function made, not a mechanism
 * that failed to arm.
 *
 * IT IS ALSO WHY A STRAY MANIFEST CANNOT LOCK ANYONE OUT. A manifest
 * sitting in a non-lane checkout is never consulted, so the worst a
 * misplaced file can do is nothing — and the guard is still tight,
 * because a lane cannot escape by deleting its own manifest (that is the
 * second arm) and cannot rewrite it either (the manifest is outside every
 * fence, so writing to it is the fourth arm).
 *
 * @param {Request} request
 * @returns {Decision}
 */
export function decide(request) {
  const cwd = typeof request.cwd === "string" && request.cwd !== "" ? request.cwd : process.cwd();
  const root = findCheckoutRoot(cwd);
  if (root === undefined) {
    return allow("not-a-repository", `${cwd} sits in no git checkout, so it is not a lane`);
  }
  const headRef = readHeadRef(root);
  if (headRef === undefined || !LANE_BRANCH_RE.test(headRef)) {
    return allow(
      "not-a-lane",
      `${root} is on ${headRef ?? "a detached HEAD"}, which is not a ${"task/T-NNN-<slug>"} lane branch`,
    );
  }
  const branch = headRef.replace(/^refs\/heads\//, "");

  const read = readManifest(root);
  if ("problem" in read) {
    return block(
      "no-manifest",
      `LANE FENCE: ${read.problem}. This checkout is on the lane branch ${branch}, so every write ` +
        "here is fenced — and the fence is expanded ONCE, at dispatch, by " +
        "`node tools/e2e/scripts/brief.mjs --task <T-NNN> --write-fence <worktree>` run from the " +
        "integration checkout. A lane branch with no readable manifest means that step was " +
        "skipped or its output was damaged; ask the dispatcher to re-run it rather than editing " +
        "the manifest by hand.",
    );
  }
  const manifest = read.manifest;

  let cardText;
  try {
    cardText = readFileSync(path.join(root, manifest.card), "utf8");
  } catch {
    return block(
      "stale-stamp",
      `LANE FENCE: the manifest was expanded from ${manifest.card}, which this checkout cannot ` +
        "read. Re-expand the fence (`brief.mjs --task " +
        `${manifest.taskId} --write-fence <worktree>\`) — this hook compares the card's own ` +
        "`touches:` line against the manifest's stamp and will not guess which side moved.",
    );
  }
  const live = touchesLineOf(cardText);
  if (live !== manifest.touchesLine) {
    return block(
      "stale-stamp",
      `LANE FENCE: ${manifest.card}'s touches line is now ${JSON.stringify(live ?? null)} and the ` +
        `manifest was stamped from ${JSON.stringify(manifest.touchesLine)}. Re-expand the fence ` +
        `(\`brief.mjs --task ${manifest.taskId} --write-fence <worktree>\`) from a checkout with a ` +
        "built parser. A fence is not widened from inside the lane it fences, so editing the " +
        "card's own `touches:` here does not move the fence — it stops the hook being able to " +
        "read one.",
    );
  }

  /** @type {string | undefined} */
  let target;
  for (const field of WRITE_TOOL_PATH_FIELDS) {
    const v = request.toolInput?.[field];
    if (typeof v === "string" && v !== "") {
      target = v;
      break;
    }
  }
  if (target === undefined) {
    return block(
      "unreadable-request",
      `LANE FENCE: ${request.toolName ?? "this tool"} was called with no path this hook can read ` +
        `(it looks for ${WRITE_TOOL_PATH_FIELDS.join(", ")}). Inside a lane an unreadable request ` +
        "is a refusal and never a shrug: a fence that answers `no overlap` when it means `I do " +
        "not know` is worse than one that refuses (lib/parser/src/fence.ts).",
    );
  }

  const abs = path.resolve(root, target);
  const rel = path.relative(root, abs).split(path.sep).join("/");
  if (rel === "" || rel.startsWith("../")) {
    return allow(
      "outside-the-checkout",
      `${abs} is outside ${root}, and this manifest's domains are repository-relative — there is ` +
        "nothing here to judge it against (limit 2 in this file's header)",
    );
  }

  for (const domain of manifest.alwaysWritable) {
    if (within(rel, domain)) {
      return allow(
        "always-writable",
        `${rel} is under ${domain}, which no card may fence and every card writes to`,
      );
    }
  }
  for (const domain of manifest.paths) {
    if (within(rel, domain)) {
      return allow("inside-the-fence", `${rel} is inside the fence domain ${domain}`);
    }
  }

  return block(
    "outside-the-fence",
    `LANE FENCE: ${rel} is outside ${manifest.taskId}'s fence.\n` +
      `  the fence (${manifest.touchesLine}) expands to:\n` +
      manifest.paths.map((p) => `    ${p}\n`).join("") +
      `  always writable: ${manifest.alwaysWritable.join(", ")}\n` +
      `  the path refused: ${rel}\n` +
      `  ${ROUTE}`,
  );
}
