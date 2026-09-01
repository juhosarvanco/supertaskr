/**
 * THE VERDICT TOKEN (T-203) — the artifact that makes "I ran the gates" a
 * FACT rather than a claim.
 *
 * ── WHY A FILE AT ALL, WHEN T-202 ALREADY PRINTS A VERDICT LINE ──────
 * `gate-run.mjs` prints `gate-verdict suite=… exit=… bodies=… ref=…` and
 * that line is trustworthy — but it is trustworthy to whoever is READING
 * THE TERMINAL. Nothing downstream can consult it, so the push that
 * follows is still taking the seat's word. Three commits landed on this
 * project in one night after a gate that had already failed, each time
 * because the exit was read AFTER the commit had run. This file is where
 * the runner's own verdict is left so a later, unrelated process can ask.
 *
 * ── WHERE IT LIVES, AND WHY IT MAY NEVER BE COMMITTABLE ──────────────
 * `.nputer/` at the checkout root — the runtime directory T-154 already
 * created for the lane fence manifest, carrying a self-ignoring
 * `.gitignore` (`*`). The card asked this to be argued rather than
 * assumed, and the argument is the amend: A TOKEN IN THE TREE CAN BE
 * STALE-BUT-MATCHING. Commit a green token, amend the commit to change a
 * source file, and the token is still there, still parses, and now
 * describes a tree that no longer exists — while its own presence in the
 * tree has changed the tree it would be compared against. A runtime file
 * cannot do that: it is written by a run, it is never carried by a
 * commit, and a fresh clone has none, which is the honest state (nothing
 * has been measured here yet).
 *
 * ── THE KEY IS THE TREE HASH, NOT THE COMMIT ─────────────────────────
 * The card's second decision. `git rev-parse HEAD^{tree}` names the
 * CONTENT the suites actually ran against, and the three cases fall out
 * of that one choice rather than needing a rule each:
 *
 *   AMEND THAT CHANGES ONLY THE MESSAGE — the tree is unchanged, so the
 *   token stays VALID. That is honest: the suites graded that content and
 *   the content is what a suite can grade. A commit-keyed token would
 *   have refused here and taught the seat that the guard cries wolf.
 *
 *   AMEND OR REBASE THAT CHANGES CONTENT — a different tree, so the token
 *   is STALE and the push is refused. No exception for "it was only a
 *   comment": this guard does not judge which edits matter, which is the
 *   whole reason it can be trusted about the ones that do.
 *
 *   REBASE THAT REORDERS COMMITS ONTO THE SAME FINAL TREE — the token
 *   stays valid, and this is a STATED LIMIT rather than an oversight. A
 *   tree hash cannot see history; what the suites graded is what the
 *   working tree contained, and that is unchanged. Anyone needing the
 *   HISTORY graded wants a different instrument than a suite runner.
 *
 * The token records a tree PER SUITE, not one for the whole file, so a
 * battery run across two commits reports exactly which halves are stale
 * instead of collapsing to a single yes/no.
 *
 * ── NOTHING BUT NODE BUILTINS ────────────────────────────────────────
 * `push-guard.mjs` imports this at module load and its `Bash` matcher
 * fires on EVERY tool call in a session, so this file may cost node's
 * startup and nothing else. In particular it does NOT import
 * `gate-run.mjs`: `REQUIRED_SUITES` below is held here and COMPARED
 * against that registry by a body, which is the treatment `LANE_BRANCH_RE`
 * and `GRAPH_REL_PATH` already get one file over — a constant checked
 * against the program that owns the fact reds a body by name when the
 * fact moves, instead of going quiet.
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/** The runtime directory T-154 established. Self-ignoring; never committed. */
export const RUNTIME_DIR = ".nputer";

/** The token, relative to the checkout root. */
export const TOKEN_REL_PATH = `${RUNTIME_DIR}/gate-verdict.json`;

/**
 * The token's own version. A token this reader does not recognise is
 * treated as ABSENT rather than as a pass — an unreadable claim is not a
 * measurement, and this guard's whole subject is the difference.
 */
export const TOKEN_VERSION = 1;

/**
 * Every suite a green token must carry, and the reason it is ALL of them.
 *
 * A token that records one suite is not a lie — it says exactly what it
 * measured. It is the READER that would lie, by accepting "the gates are
 * green" from a claim about a quarter of them. So the required set is the
 * whole graded registry, and a token missing an entry is refused as
 * INCOMPLETE with the missing suites named.
 *
 * HELD HERE AND COMPARED RATHER THAN TRUSTED: `gate-run.spec.ts` asserts
 * this equals `Object.keys(GRADED_SUITES)`. Adding a graded suite without
 * updating this line reds that body by name.
 */
export const REQUIRED_SUITES = Object.freeze(["app", "e2e", "parser", "rust"]);

/** The one verdict word a suite entry may carry and still be green. */
export const GREEN = "GREEN";

/**
 * @typedef {object} SuiteEntry
 * @property {string} suite
 * @property {number} exit     the graded command's own status, as DATA
 * @property {number} bodies   test bodies the run actually executed
 * @property {number} targets
 * @property {string} verdict  GREEN | RED | REFUSED
 * @property {string} reason
 * @property {string} ref      the commit HEAD pointed at
 * @property {string} tree     the TREE that commit named — the honest key
 * @property {string} at       ISO time the entry was written
 */

/**
 * @typedef {object} Token
 * @property {number} version
 * @property {string} writtenAt
 * @property {string} writtenFrom
 * @property {Record<string, SuiteEntry>} suites
 */

/** @param {string} root @returns {string} */
export function tokenPath(root) {
  return path.join(root, TOKEN_REL_PATH);
}

/**
 * The tree HEAD names, or `undefined` when git cannot say.
 *
 * A checkout with no commits has no tree, and neither has one where git
 * cannot be run. Both are answered `undefined` and NEVER a fabricated
 * key: a guard that invented a key would compare two things it made up.
 *
 * @param {string} root
 * @returns {string | undefined}
 */
export function headTree(root) {
  try {
    const out = spawnSync("git", ["-C", root, "rev-parse", "HEAD^{tree}"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    if (out.status !== 0) return undefined;
    const tree = String(out.stdout ?? "").trim();
    return /^[0-9a-f]{40}$/.test(tree) ? tree : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Read the token, or say why not.
 *
 * EVERY FAILURE IS A `problem`, never an empty token. A caller handed
 * `{ suites: {} }` for a file that would not parse cannot tell "nothing
 * was measured" from "the measurement is unreadable", and this file
 * exists because those two were being told apart by nobody.
 *
 * @param {string} root
 * @returns {{ token: Token } | { problem: string }}
 */
export function readToken(root) {
  const file = tokenPath(root);
  /** @type {string} */
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (err) {
    const e = /** @type {NodeJS.ErrnoException} */ (err);
    return {
      problem:
        e && e.code === "ENOENT"
          ? `no verdict token at ${TOKEN_REL_PATH} — nothing has been measured in this checkout`
          : `${TOKEN_REL_PATH} could not be read (${e?.message ?? String(err)})`,
    };
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      problem: `${TOKEN_REL_PATH} is not JSON (${err instanceof Error ? err.message : String(err)})`,
    };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { problem: `${TOKEN_REL_PATH} is not a JSON object` };
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  if (obj["version"] !== TOKEN_VERSION) {
    return {
      problem:
        `${TOKEN_REL_PATH} is version ${JSON.stringify(obj["version"])}, and this guard reads ` +
        `version ${TOKEN_VERSION} — an unreadable claim is not a measurement`,
    };
  }
  const suites = obj["suites"];
  if (suites === null || typeof suites !== "object" || Array.isArray(suites)) {
    return { problem: `${TOKEN_REL_PATH} carries no \`suites\` object` };
  }
  return {
    token: {
      version: TOKEN_VERSION,
      writtenAt: typeof obj["writtenAt"] === "string" ? obj["writtenAt"] : "",
      writtenFrom: typeof obj["writtenFrom"] === "string" ? obj["writtenFrom"] : "",
      suites: /** @type {Record<string, SuiteEntry>} */ (suites),
    },
  };
}

/**
 * Merge these verdicts into the checkout's token, and return what was
 * written.
 *
 * MERGE RATHER THAN REPLACE, because the battery is run in pieces: a seat
 * that runs `parser` and then `rust` has measured two suites at one tree,
 * and a writer that replaced would have thrown the first away. An entry
 * for a suite is simply overwritten by its newer run — a re-run is the
 * later measurement of that suite, never a second one.
 *
 * A PRIOR TOKEN THAT WILL NOT PARSE IS DISCARDED, not merged into. There
 * is nothing in it to keep, and refusing to write would leave the
 * checkout permanently unable to record a green run.
 *
 * @param {string} root
 * @param {{ suite: string, exit: number, bodies: number, targets: number, verdict: string, reason: string, ref: string }[]} verdicts
 * @param {{ tree?: string, now?: () => string }} [opts]
 * @returns {{ path: string, token: Token }}
 */
export function writeToken(root, verdicts, opts = {}) {
  const now = opts.now ?? (() => new Date().toISOString());
  const tree = opts.tree ?? headTree(root) ?? "";
  const prior = readToken(root);
  /** @type {Record<string, SuiteEntry>} */
  const suites = "token" in prior ? { ...prior.token.suites } : {};
  const at = now();
  for (const v of verdicts) {
    suites[v.suite] = {
      suite: v.suite,
      exit: v.exit,
      bodies: v.bodies,
      targets: v.targets,
      verdict: v.verdict,
      reason: v.reason,
      ref: v.ref,
      tree,
      at,
    };
  }
  /** @type {Token} */
  const token = { version: TOKEN_VERSION, writtenAt: at, writtenFrom: root, suites };
  const file = tokenPath(root);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(token, null, 2)}\n`);
  return { path: file, token };
}

/**
 * @typedef {object} TokenJudgement
 * @property {"fresh"|"missing"|"incomplete"|"stale"|"red"} state
 * @property {string} code    a stable, greppable name for WHY
 * @property {string} detail  the sentence a refused seat reads
 */

/**
 * Judge a token against the tree a push would carry.
 *
 * ── THE ORDER IS THE ARGUMENT ────────────────────────────────────────
 * MISSING, then INCOMPLETE, then STALE, then RED — and STALE is reported
 * before RED deliberately. A suite that failed at a tree which is no
 * longer HEAD's tells the seat NOTHING about what it is pushing; leading
 * with "your suite is red" would send it to debug a result that describes
 * different content. Both refuse, so the ordering costs nothing but the
 * first sentence, and the first sentence is the one that gets acted on.
 *
 * It computes no suite result of its own and never re-runs anything: the
 * verdict in the token is `gate-run.mjs`'s, and this function only asks
 * whether it is present, complete, current and green. That prohibition is
 * `push-guard.mjs`'s own about `index --check`, for its reason — a second
 * opinion about whether a suite passed would be a guard the seat learns
 * to override.
 *
 * @param {{ token?: Token, problem?: string, tree: string, required?: readonly string[] }} input
 * @returns {TokenJudgement}
 */
export function judgeToken({ token, problem, tree, required = REQUIRED_SUITES }) {
  if (token === undefined) {
    return {
      state: "missing",
      code: "token-missing",
      detail: problem ?? `no readable verdict token at ${TOKEN_REL_PATH}`,
    };
  }
  const missing = required.filter((s) => {
    const e = token.suites[s];
    return e === undefined || e === null || typeof e !== "object";
  });
  if (missing.length > 0) {
    return {
      state: "incomplete",
      code: "token-incomplete",
      detail:
        `the verdict token records no run of ${missing.join(", ")} — it is a claim about ` +
        `${required.length - missing.length} of ${required.length} graded suites, and "the gates ` +
        'are green" is not one of the things it says',
    };
  }
  /** @type {string[]} */
  const stale = [];
  for (const s of required) {
    const entry = /** @type {SuiteEntry} */ (token.suites[s]);
    if (entry.tree !== tree) {
      stale.push(`${s} ran against tree ${entry.tree || "(none recorded)"}`);
    }
  }
  if (stale.length > 0) {
    return {
      state: "stale",
      code: "token-stale",
      detail:
        `the verdict token is STALE against HEAD's tree ${tree}: ${stale.join("; ")}. ` +
        "The tree hash is the key because it names the CONTENT the suites graded — an amend " +
        "that changed only a commit message keeps a token valid, and one that changed a file " +
        "does not",
    };
  }
  /** @type {string[]} */
  const red = [];
  for (const s of required) {
    const entry = /** @type {SuiteEntry} */ (token.suites[s]);
    if (entry.verdict !== GREEN) {
      red.push(
        `${s} is ${entry.verdict || "(no verdict)"} (exit=${entry.exit} bodies=${entry.bodies} ` +
          `reason=${entry.reason})`,
      );
    }
  }
  if (red.length > 0) {
    return {
      state: "red",
      code: "token-red",
      detail: `the verdict token records a suite that is not ${GREEN}: ${red.join("; ")}`,
    };
  }
  return {
    state: "fresh",
    code: "token-green",
    detail:
      `${required.length} graded suite(s) recorded ${GREEN} against HEAD's own tree ${tree} ` +
      `(${required.map((s) => `${s}=${/** @type {SuiteEntry} */ (token.suites[s]).bodies}`).join(" ")} bodies)`,
  };
}
