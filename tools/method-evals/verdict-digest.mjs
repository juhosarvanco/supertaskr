#!/usr/bin/env node
/**
 * THE VERDICT-DIGEST CHECKER (T-205-s1) — MF-09's refusal, RUN against a
 * real verdict instead of demonstrated against fixtures.
 *
 * THE ONE SPELLING, run from the repo ROOT:
 *
 *   node tools/method-evals/verdict-digest.mjs
 *   node tools/method-evals/verdict-digest.mjs --scratch <dir>
 *   node tools/method-evals/verdict-digest.mjs --scratch <dir> docs/tasks/T-249-….md
 *
 * WHAT T-205 LEFT AND WHY THIS EXISTS. `roles/orchestrator.md` 5d says
 * phase 1's return is saved and hashed before phase 2 is spawned, that
 * phase 2's verdict cites that digest, and that **a verdict citing a hash
 * that does not match the saved file is REFUSED**. `MF-09` holds that
 * refusal and DEMONSTRATES it — five matrix rows and three degraded judges
 * — and until this file existed **nothing invoked it**. The comparison was
 * proved and never performed. `docs/CONVENTIONS.md`'s bench bullet says so
 * in as many words: *"WHAT IS STILL A HAND STEP IS THE WIRING."*
 *
 * THE COMPARISON IS NOT RE-IMPLEMENTED HERE, AND THAT IS THE CARD'S FIFTH
 * CRITERION (T-057, a rule with two statements is two chances to
 * disagree). `judge` and the citation grammar are IMPORTED from
 * `evals/mf-09-attack-set-digest-refusal.mjs`. This file is the WALK and
 * the RESOLUTION — which cards, which lines, which file on disk — and
 * hands each citation to MF-09's judge unchanged. If the two ever have to
 * disagree, the import breaks loudly rather than drifting quietly.
 *
 * THE THREE OUTCOMES, AND THE MIDDLE ONE IS THE WHOLE DESIGN:
 *
 *   VERIFIED     the file the citation names was read and hashes to the
 *                digest the verdict cites.
 *   REFUSED      we could look and the answer is NO — a mismatch, a
 *                pointed-at file that would not read (MF-09's MISSING
 *                row), a digest that is not 64 hex (its PREFIX row), or a
 *                digest citing no file at all, which nobody can ever
 *                check. Exit 1.
 *   UNAVAILABLE  we could NOT look. The citation names a bare filename,
 *                the file lives in the dispatching session's scratchpad
 *                under the SCRATCH RULE, and no root was named at the
 *                call. Exit 3 — never 0, and never a skip.
 *
 * **UNAVAILABLE IS NOT MISSING, AND COLLAPSING THEM WOULD BE THE DEFECT.**
 * MF-09's MISSING row already rules that a saved file we were POINTED at
 * and could not read is a refusal, because otherwise deleting the file is
 * the bypass — and that row is enforced here, unchanged, by the same
 * judge. UNAVAILABLE is the different case this card was written about:
 * `method/lane-protocol.md` rule 4 says a machine-scoped surface is
 * DERIVED from the lane and never defaulted, and a checkout that guessed
 * at somebody else's scratchpad path would be inventing the very default
 * that rule forbids. So the checker refuses to guess, says where the
 * method expects the file, and exits 3: **this run is not a claim about
 * that verdict at all**, which is the house meaning of 3 (`lib/exit.mjs`).
 *
 * HOW THE INVOCATION REACHES A FILE OUTSIDE THE TREE, WITHOUT DEFAULTING
 * ONE (the card's fourth criterion). Three roots, every one of them NAMED
 * rather than assumed:
 *
 *   1. the citation's own path, when it is ABSOLUTE — a verdict is free to
 *      cite one and several do;
 *   2. every `--scratch <dir>` on the command line, in the order given;
 *   3. `SUPERTASKR_ATTACK_SET_DIR`, split on the platform path delimiter.
 *
 * With none of the three, a bare filename is UNAVAILABLE and the run says
 * so. **There is no fourth root and no built-in guess.** The day the
 * project rules a home in the tree for sealed sets — the card's own design
 * question 2, which is the architect's to answer and not a lane's — that
 * home is one more `--scratch` root and nothing here changes.
 *
 * ZERO DEPENDENCIES, like the suite beside it: it must run on a bare
 * checkout with no `node_modules` anywhere.
 *
 * EXIT CODES — the house four, imported from `lib/exit.mjs` rather than
 * re-typed:
 *   0  every citation found was VERIFIED, and there was at least one.
 *   1  FOUND: a citation was REFUSED. Read the lines.
 *   2  called wrong.
 *   3  COULD NOT RUN: a citation's file is unreachable from this checkout,
 *      or no card carried a citation at all. **An exit 0 over zero bodies
 *      is not a pass**, so an empty walk is 3 and says what it walked.
 *
 * **3 OUTRANKS 1**, the same ordering `run.mjs --bump` takes and for the
 * same reason: *"I could not tell you"* is worse news than *"I found it"*.
 * Both counts are printed either way, so the ordering never hides a row.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CITATION,
  judge,
} from "./evals/mf-09-attack-set-digest-refusal.mjs";
import { EXIT } from "./lib/exit.mjs";
import { repoRoot } from "./lib/fixture-root.mjs";

/**
 * A CITATION SITE: `attack set: sha256:` opening a line of its own, which
 * is how `docs/CONVENTIONS.md`'s bench bullet spells it — *"CITES that
 * digest on a line of its own"*.
 *
 * **THE ANCHOR IS LOAD-BEARING IN BOTH DIRECTIONS.** Without it, prose
 * that QUOTES the grammar becomes a malformed citation: two cards on the
 * board today write `` `attack set: sha256:<hex>` `` mid-sentence while
 * discussing the rule, and a checker that read those as verdicts would red
 * for a card doing nothing wrong. With it, a citation that is merely
 * MALFORMED — a truncated digest, a digest naming no file — is still SEEN,
 * which is the fail-open the strict grammar alone would leave: MF-09's
 * judge refuses a truncated digest only when it is HANDED the line, and a
 * collector keyed on the strict grammar would never hand it over.
 */
const SITE = /^[ \t]*attack set:[ \t]*sha256:/i;

/**
 * The full line a well-formed citation is: the digest, then the file —
 * **BUILT FROM MF-09's OWN GRAMMAR AND NOT RETYPED BESIDE IT** (`T-057`).
 * All this file adds is the line ANCHOR and the `(<file>)` half; what a
 * digest looks like is spelled in exactly one place, so the two cannot
 * drift into disagreeing about 64 hex characters.
 *
 * Group 1 is MF-09's digest capture; group 2 is the file.
 */
const WELL_FORMED = new RegExp(`^[ \\t]*${CITATION.source}[ \\t]*\\(([^)]+)\\)`, "i");

/** The two halves of WELL_FORMED, probed separately so a refusal SAYS WHICH. */
const FULL_DIGEST = new RegExp(`^[ \\t]*${CITATION.source}`, "i");
const FILE_PART = /\(([^)]+)\)/;

/** Where the method says the saved file lives, printed at every UNAVAILABLE. */
export const WHERE_THE_METHOD_EXPECTS_IT = [
  "docs/CONVENTIONS.md's bench bullet saves phase 1's return under the SCRATCH RULE as",
  "`attack-set-<card id>.md` in the DISPATCHING SESSION's scratchpad — a machine-scoped",
  "surface, so method/lane-protocol.md rule 4 says DERIVE it from the lane and never",
  "default it. Name the directory: --scratch <dir> (repeatable), or SUPERTASKR_ATTACK_SET_DIR.",
].join("\n  ");

/** @typedef {"VERIFIED" | "REFUSED" | "UNAVAILABLE"} Outcome */

/**
 * @typedef {object} Citation
 * @property {string} card     the card path, as it was walked
 * @property {number} line     1-based line number of the citation
 * @property {string} raw      the citation line, trimmed
 * @property {string | null} name  the file the citation names, or null
 * @property {Outcome} outcome
 * @property {string} reason   one line, said plainly
 * @property {string | null} resolved  the absolute path that was hashed, if any
 */

/**
 * Every `.md` under `docs/tasks/` at the repository root, sorted.
 *
 * @param {string} [root]
 * @returns {string[]}  absolute paths
 */
export function boardCards(root = repoRoot) {
  const dir = path.join(root, "docs", "tasks");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => path.join(dir, f));
}

/**
 * Find every citation SITE in one card's text.
 *
 * @param {string} text
 * @returns {{ line: number; raw: string; name: string | null; wellFormed: boolean }[]}
 */
export function sites(text) {
  /** @type {{ line: number; raw: string; name: string | null; wellFormed: boolean }[]} */
  const found = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const raw = /** @type {string} */ (lines[i]);
    if (!SITE.test(raw)) continue;
    const m = WELL_FORMED.exec(raw);
    // GROUP 2, because group 1 belongs to MF-09's imported grammar.
    const name = m === null ? null : /** @type {string} */ (m[2]).trim();
    found.push({ line: i + 1, raw: raw.trim(), name, wellFormed: m !== null });
  }
  return found;
}

/**
 * The roots a bare filename may be resolved against — NAMED, never guessed.
 *
 * @param {string[]} scratch  every `--scratch <dir>`, in order
 * @param {NodeJS.ProcessEnv} env
 * @returns {string[]}
 */
export function resolutionRoots(scratch, env) {
  const fromEnv = (env.SUPERTASKR_ATTACK_SET_DIR ?? "")
    .split(path.delimiter)
    .map((s) => s.trim())
    .filter((s) => s !== "");
  return [...scratch, ...fromEnv].map((d) => path.resolve(d));
}

/**
 * Resolve the file a citation names.
 *
 * An ABSOLUTE path resolves to itself whether or not it exists — that is
 * deliberate. We were POINTED at a file, so an unreadable one is MF-09's
 * MISSING row and belongs to the judge, not to this function. Only a bare
 * name with no root that holds it is unreachable.
 *
 * @param {string} name
 * @param {string[]} roots
 * @returns {string | null}
 */
export function resolveCited(name, roots) {
  if (path.isAbsolute(name)) return name;
  for (const root of roots) {
    const candidate = path.join(root, name);
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Not here. Try the next root; an exhausted list is UNAVAILABLE.
    }
  }
  return null;
}

/**
 * THE DEFAULTS `inspect` USES WHEN NOTHING OVERRIDES THEM, exported so
 * MF-10 can assert BY IDENTITY that the production path judges with
 * MF-09's own judge. The seam below exists for the positive control, and
 * `docs/CONVENTIONS.md`'s LIFTING A SAFETY GUARD TO DISCRIMINATE is why it
 * is asserted rather than trusted: a seam that can weaken the real path is
 * a seam somebody must be able to check.
 */
export const INSPECT_DEFAULTS = Object.freeze({ judge, collect: sites });

/**
 * Walk cards, classify every citation.
 *
 * @param {object} spec
 * @param {string[]} spec.cards   absolute or cwd-relative card paths
 * @param {string[]} spec.roots   resolution roots, from `resolutionRoots`
 * @param {typeof judge} [spec.judge]  THE COMPARISON SEAM. Defaults to
 *   MF-09's judge and is never passed by `main`.
 * @param {typeof sites} [spec.collect]  THE COLLECTOR SEAM, for the same
 *   reason and under the same rule: the pipeline refuses a truncated digest
 *   at the COLLECTOR, before any judge is consulted, so a control that only
 *   degrades the judge cannot reach that row.
 * @returns {{ citations: Citation[]; cardsWalked: number }}
 */
export function inspect({
  cards,
  roots,
  judge: judgeFn = INSPECT_DEFAULTS.judge,
  collect = INSPECT_DEFAULTS.collect,
}) {
  /** @type {Citation[]} */
  const citations = [];
  for (const card of cards) {
    /** @type {string} */
    let text;
    try {
      text = readFileSync(card, "utf8");
    } catch (cause) {
      citations.push({
        card,
        line: 0,
        raw: "",
        name: null,
        outcome: "REFUSED",
        reason: `the card could not be read: ${cause instanceof Error ? cause.message : String(cause)}`,
        resolved: null,
      });
      continue;
    }
    for (const site of collect(text)) {
      if (!site.wellFormed) {
        // SAY WHICH HALF FAILED, and read it off the RAW LINE rather than
        // off the collector's own fields: a degraded collector is exactly
        // what MF-10 drives through here, and a refusal whose reason came
        // from the degradation would be describing the mutation.
        const digestOk = FULL_DIGEST.test(site.raw);
        const named = FILE_PART.test(site.raw);
        citations.push({
          card,
          line: site.line,
          raw: site.raw,
          name: site.name,
          outcome: "REFUSED",
          reason:
            !digestOk && !named
              ? "the cited digest is not 64 lowercase hex and the citation names no file"
              : !digestOk
                ? "the cited digest is not 64 lowercase hex, so it is a resemblance and not a digest"
                : "the citation names a digest and no file, so nobody can ever check it",
          resolved: null,
        });
        continue;
      }
      // A WELL-FORMED SITE WITH NO FILE IS STILL UNCHECKABLE. The grammar
      // above cannot produce one; a DEGRADED collector can, and the
      // production path must refuse it rather than crash on it.
      if (site.name === null || site.name.trim() === "") {
        citations.push({
          card,
          line: site.line,
          raw: site.raw,
          name: null,
          outcome: "REFUSED",
          reason: "the citation names a digest and no file, so nobody can ever check it",
          resolved: null,
        });
        continue;
      }
      const name = /** @type {string} */ (site.name);
      const resolved = resolveCited(name, roots);
      if (resolved === null) {
        citations.push({
          card,
          line: site.line,
          raw: site.raw,
          name,
          outcome: "UNAVAILABLE",
          reason: `${name} is not in this checkout and no named root holds it`,
          resolved: null,
        });
        continue;
      }
      // THE COMPARISON ITSELF IS MF-09'S, HANDED THE LINE AND THE FILE.
      const answer = judgeFn(site.raw, resolved);
      citations.push({
        card,
        line: site.line,
        raw: site.raw,
        name,
        outcome: answer.verdict === "ACCEPT" ? "VERIFIED" : "REFUSED",
        reason: answer.reason,
        resolved,
      });
    }
  }
  return { citations, cardsWalked: cards.length };
}

/**
 * @param {Citation[]} citations
 * @returns {{ verified: number; refused: number; unavailable: number; cited: number }}
 */
export function tally(citations) {
  return {
    cited: citations.length,
    verified: citations.filter((c) => c.outcome === "VERIFIED").length,
    refused: citations.filter((c) => c.outcome === "REFUSED").length,
    unavailable: citations.filter((c) => c.outcome === "UNAVAILABLE").length,
  };
}

/**
 * The exit code a tally earns.
 *
 * @param {ReturnType<typeof tally>} counts
 * @param {object} [opts]
 * @param {boolean} [opts.unavailableIsClean]  THE THIRD DEGRADATION SEAM —
 *   the fail-open this whole card exists to forbid. Never passed by `main`.
 * @returns {0 | 1 | 2 | 3}
 */
export function exitFor(counts, { unavailableIsClean = false } = {}) {
  if (counts.cited === 0) return EXIT.CANNOT_RUN;
  if (counts.unavailable > 0 && !unavailableIsClean) return EXIT.CANNOT_RUN;
  if (counts.refused > 0) return EXIT.FOUND;
  return EXIT.CLEAN;
}

const USAGE = [
  "usage: node tools/method-evals/verdict-digest.mjs [--scratch <dir>]... [--] [<card>...]",
  "  --scratch <dir>  a directory to resolve a bare-filename citation in. Repeatable,",
  "                   tried in order, and NEVER defaulted — see this file's header.",
  "  <card>...        cards to walk; with none, every docs/tasks/*.md at the repo root.",
  "",
  "  SUPERTASKR_ATTACK_SET_DIR adds roots too, split on the path delimiter.",
].join("\n");

/**
 * @param {string[]} argv
 * @param {NodeJS.ProcessEnv} env
 * @param {(s: string) => void} out
 * @param {(s: string) => void} err
 * @returns {0 | 1 | 2 | 3}
 */
export function main(argv, env, out, err) {
  /** @type {string[]} */
  const scratch = [];
  /** @type {string[]} */
  const cards = [];
  let onlyPositional = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = /** @type {string} */ (argv[i]);
    if (onlyPositional) {
      cards.push(a);
    } else if (a === "--") {
      onlyPositional = true;
    } else if (a === "--scratch") {
      const value = argv[i + 1];
      i += 1;
      if (value === undefined || value.startsWith("--")) {
        err("verdict-digest: --scratch wants a directory");
        err(USAGE);
        return EXIT.USAGE;
      }
      scratch.push(value);
    } else if (a.startsWith("--")) {
      err(`verdict-digest: unknown argument ${a}`);
      err(USAGE);
      return EXIT.USAGE;
    } else {
      cards.push(a);
    }
  }

  const roots = resolutionRoots(scratch, env);
  const walked = cards.length > 0 ? cards.map((c) => path.resolve(c)) : boardCards();
  const { citations } = inspect({ cards: walked, roots });
  const counts = tally(citations);

  for (const c of citations) {
    const where = path.relative(repoRoot, c.card);
    out(`${c.outcome.padEnd(11)} ${where}:${c.line}  ${c.reason}`);
  }
  out(
    `verdict-digest: ${counts.cited} citation(s) in ${walked.length} card(s) — ` +
      `${counts.verified} verified, ${counts.refused} REFUSED, ${counts.unavailable} unavailable`,
  );

  const code = exitFor(counts);
  if (counts.cited === 0) {
    err(
      `verdict-digest: NO CARD WALKED CITES AN ATTACK SET, so this run measured nothing. ` +
        `An exit 0 over zero bodies is not a pass, which is why this is ${EXIT.CANNOT_RUN}.`,
    );
  }
  if (counts.refused > 0) {
    err(`verdict-digest: ${counts.refused} citation(s) REFUSED — named above, by card and line.`);
  }
  if (counts.unavailable > 0) {
    err(
      `verdict-digest: ${counts.unavailable} citation(s) UNAVAILABLE — the saved file is not ` +
        `reachable from this checkout, so this run is NOT a claim about those verdicts.`,
    );
    err(`  ${WHERE_THE_METHOD_EXPECTS_IT}`);
    if (roots.length === 0) err("  No root was named at this call: no --scratch, no SUPERTASKR_ATTACK_SET_DIR.");
    else for (const r of roots) err(`  Root tried: ${r}`);
  }
  return code;
}

// THE WRAPPER RUNS; THE MODULE DOES NOT. Importing this file to drive it
// from MF-10 must not walk a board or set an exit code — the same
// side-effect-free shape `run.mjs` keeps for `lib/harness.mjs`.
if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = main(
    process.argv.slice(2),
    process.env,
    (s) => console.log(s),
    (s) => console.error(s),
  );
}
