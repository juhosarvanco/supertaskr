/**
 * THE CARD PREFLIGHT (T-160) — plain node, zero deps, no I/O at import.
 * The runnable half is `brief.mjs --preflight` beside this file; this
 * module holds the derivation and executes nothing.
 *
 * ── THE GAP THIS SITS IN ─────────────────────────────────────────────
 * The dispatch derivation (`brief.mjs --dispatch`) checks that a card is
 * STARTABLE: it exists, its status is legal, its blockers read satisfied,
 * its fence is disjoint. `method/roles/executor.md` step 1 checks that
 * the card MAKES SENSE — but after dispatch, inside the lane, at lane
 * prices. **Between the two, nothing re-derives what the card CLAIMS
 * against the tree it is about to be built on.** "Derive at your own ref,
 * never quote" is a gated property for the governing documents and a
 * prose rule for cards.
 *
 * ── IT CONSUMES; IT DOES NOT RE-DERIVE ───────────────────────────────
 * T-057 forbids a second copy of a derivation this repository already
 * owns, and every input below is imported rather than re-spelled:
 *
 *   - the board, the slug map, the lane list and the ref — `context()`
 *     in `dispatch-brief.mjs`, one read, handed in;
 *   - the card's FENCE and its blocker ruling — the parser's own
 *     `readDispatchOrder`, through `dispatchContext`, which is the same
 *     expansion `--write-fence` stamps into the manifest;
 *   - containment — `within` from `.claude/hooks/lane-fence.mjs`, the
 *     function the guard itself applies at every write;
 *   - the figure ledger — `auditCard` / `derivedTexts` in
 *     `card-figures.mjs`, which already RE-RUNS a stamped figure's
 *     deriver and compares the line character for character;
 *   - the prose reading — `cardBody` / `proseOnly`, same module.
 *
 * ── THE VERDICT SPLIT, AND WHY IT IS NOT TWO-VALUED ──────────────────
 * Every arm answers in three parts, and the third is a criterion rather
 * than a courtesy: what it CHECKED and found sound, what it FOUND (a
 * finding, which refuses the dispatch), and what it CANNOT CHECK. The
 * capabilities generator is the precedent — a census that omits its own
 * blind spots reads as coverage.
 *
 * ── EVERY THRESHOLD HERE WAS MEASURED OVER THE LIVE BOARD ────────────
 * The arms are narrow because the wide versions were tried against
 * `docs/tasks/` first and refuted, exactly as `card-figures.mjs`'s own
 * header refutes an adjacency lint. RE-DERIVE THESE AT YOUR OWN REF
 * rather than trusting the shape of the sentence: the scans are all one
 * command over the corpus.
 *
 *   - A path token scan over every live card's PROSE names path-shaped
 *     tokens in the thousands and misses in the hundreds, almost all of
 *     them globs, build artefacts and illustrative near-misses. Scoped
 *     to the ACCEPTANCE CRITERIA and the frontmatter, and after globs,
 *     truncations and git-ignored paths are subtracted, the residual is
 *     a handful of tokens over a handful of cards — and several of those
 *     are the real thing.
 *   - "The fence must cover every path the criteria name" is a LIE on
 *     this corpus: a criterion routinely CITES a file it only reads, and
 *     the uncovered set runs to three figures across a quarter of the
 *     board. So coverage is REPORTED, never refused on — and the two
 *     shapes that cannot be a citation are what refuse instead.
 *   - "The stated blocking reason no longer holds" fires on `after
 *     T-NNN` constantly and wrongly, because a satisfied blocker is the
 *     NORMAL case. The HELD-BY-A-LIVE-LANE claim is the derivable one,
 *     it fires in the low single digits over the whole board, and every
 *     hit at the ref this module was written at was genuinely stale —
 *     including the one on this card's own file.
 *
 * ── WHAT IT WILL NOT DO ──────────────────────────────────────────────
 * It does not judge DESIRABILITY. Whether the work is still wanted is a
 * seat's call; this surfaces stale facts. And it never EXECUTES a shell
 * command a card quotes: a figure is re-run through the closed
 * `CARD_DERIVERS` vocabulary or it is reported as unrunnable, because a
 * tool that ran arbitrary text out of a markdown body would be a worse
 * hazard than the one it is here to remove.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { within } from "../../../.claude/hooks/lane-fence.mjs";
import {
  FINDING_VERDICTS,
  auditCard,
  cardBody,
  derivedTexts,
  proseOnly,
} from "./card-figures.mjs";
import { blank, fieldList, fieldScalar, liveProv, note, treeProv, value } from "./dispatch-brief.mjs";
import { trackedFiles } from "./docs-scan.mjs";
import { dispatchContext } from "./dispatch-order.mjs";

/**
 * A problem this command could not answer AT ALL — never a fact about
 * the card. The split is `lane-fence.mjs`'s and it is the house exit
 * contract: a stale claim is a FINDING about the repository and answers
 * 1, while a card that cannot be read, a parser that will not load or a
 * git that will not run is this command being unable to tell you
 * anything and answers 3. A preflight that reported "nothing stale"
 * because it could not look is the exact failure it exists to remove.
 */
export class CardPreflightError extends Error {}

/* ────────────────────────────────────────────────────────────────────
 * The claim classes — printed on EVERY run, sound or not.
 *
 * THIS IS A CRITERION, NOT A HEADER. The card's third acceptance
 * criterion requires the tool's own output to say which claim classes it
 * checked and which it cannot, so this table is emitted whether or not
 * anything was found. No entry may carry a DIGIT: these go out through
 * `note()`, whose whole job is to be closed to figures.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} ClaimClass
 * @property {string} key
 * @property {string} checks   what this arm re-derives at HEAD
 * @property {string} refuses  the shape that makes it a finding
 * @property {string} cannot   what it does NOT see, stated in place
 */

/** @type {readonly ClaimClass[]} */
export const CLAIM_CLASSES = Object.freeze([
  {
    key: "paths",
    checks:
      "every repository path the card names, resolved against the tracked tree at HEAD",
    refuses:
      "a path named in the frontmatter or the acceptance criteria that does not exist and " +
      "is not inside this card's own fence, so it cannot be a creation target either",
    cannot:
      "a glob, a truncated token, a git-ignored build artefact, and anything inside a fenced " +
      "or indented transcript block, which the prose reading blanks",
  },
  {
    key: "fence",
    checks:
      "the card's touches, expanded through the live slug map by the parser's own fence module",
    refuses:
      "an entry that reserves no tracked file at all, an entry this expansion cannot resolve, and " +
      "a path the criteria name that a DECLARED component owns and this fence does not carry",
    cannot:
      "whether a path under NO component ought to be inside the fence — a criterion cites far more " +
      "files than it writes, and outside the slug map this tool cannot tell a citation from a " +
      "write target",
  },
  {
    key: "figures",
    checks: "every figure carrying a card deriver stamp, re-run through that deriver at HEAD",
    refuses: "a stamped figure the deriver no longer produces, an unrunnable provenance, a census claim",
    cannot:
      "an unstamped number, and any shell command the card quotes — this tool never executes text " +
      "out of a markdown body",
  },
  {
    key: "blockers",
    checks:
      "every blocked_by entry against the live board, and the parser's own startability ruling",
    refuses: "a blocker with no live card, and a card the parser rules blocked or waiting",
    cannot:
      "a blocking reason stated as prose with no machine form; the one exception is the claim that " +
      "another card's LIVE LANE holds a fence, which is read against the live lane list",
  },
  {
    key: "refs",
    checks: "every commit-ref stamp the card carries, resolved with git rev-parse",
    refuses: "a stamp this checkout can no longer resolve to a commit",
    cannot: "whether the stamped ref is still the RIGHT one — only that it still exists",
  },
]);

/**
 * WHAT NO ARM ABOVE COVERS, said once and in the tool's own voice. The
 * card rules desirability out by name, and a reader who cannot see the
 * boundary will assume a green preflight means the work is wanted.
 */
export const NOT_A_CLAIM_CLASS = Object.freeze([
  "whether the work is still WANTED — desirability is a seat's call and this tool takes none",
  "whether the criteria are the RIGHT criteria, or the design behind them still holds",
  "any figure a card states with no provenance at all",
  "anything a session would have to run the suite to know",
]);

/* ────────────────────────────────────────────────────────────────────
 * Readers.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * A path token: at least one slash, no whitespace, and a first segment
 * that is a real top-level entry of this repository. **BOTH HALVES ARE
 * LOAD-BEARING** and the second is the discriminator — without it every
 * `foo/bar` in prose, every `and/or`, every date and every regexp
 * fragment reads as a path claim. It is the same shape `docs-scan.mjs`
 * gives its docs-site rule, one directory up.
 */
export const REPO_PATH_TOKEN =
  /(?<![\w/.@-])((?:\.?[A-Za-z0-9_][A-Za-z0-9_.-]*)(?:\/[A-Za-z0-9_.*-]+)+)/g;

/**
 * THE REF STAMP, in the form this repository publishes: `@ <hash>`, the
 * tail of `dispatch-brief.mjs`'s own tree provenance and the shape
 * docs/STATE.md's contract names ("a figure appears here only with its
 * derive command or a ref stamp").
 *
 * NARROW ON PURPOSE, AND THE NARROWNESS IS MEASURED. A bare hex run in
 * backticks matches a port number, a millisecond timestamp, an md5 and a
 * binary literal — over a hundred non-commits across the live board,
 * every one of which would have "failed to resolve". The `@` is what
 * makes the token a CLAIM about a commit rather than a hex-shaped word.
 */
export const REF_STAMP = /@\s+`?([0-9a-f]{7,40})`?(?![0-9a-zA-Z])/g;

/**
 * THE ONE BLOCKING REASON THAT IS DERIVABLE: a claim that another card's
 * LIVE LANE holds something. It is a live-environment fact — a worktree,
 * like a pid or a port holder — so it is read against the lane list and
 * never against a commit.
 */
export const HELD_CLAIM =
  /(?:is\s+)?HELD by\s+`?(T-\d+(?:-s\d+)?)`?|`?(T-\d+(?:-s\d+)?)`?['’]s\s+live lane/g;

/** The heading whose section carries the claims a dispatch is bought on. */
export const CRITERIA_HEADING = /^#{2,}\s+Acceptance criteria\s*$/i;

/**
 * THE OTHER HALF OF THE REFUSAL, and the card's second criterion says it
 * in as many words: a dispatch does not proceed *"until the card is
 * corrected OR the discrepancy is ruled acceptable ON THE CARD, dated"*.
 * Without this the only way past a finding is to edit the evidence, and
 * a card's founding instance is worth more intact than tidy.
 *
 * **THE DATE IS IN THE PATTERN BECAUSE "DATED" IS PART OF THE RULE.** An
 * undated ruling is a sentence somebody wrote once; a dated one can be
 * read against the ref it was written at.
 *
 * **AND IT BINDS BY SUBJECT RATHER THAN BY CLASS.** A ruling discharges
 * a finding only when it NAMES that finding's subject — the path, the
 * commit stamp, the card id, the figure's own line — so it cannot become
 * a blanket amnesty for a claim class. Every discharge is printed with
 * the ruling that made it, because a suppression nobody sees is a guard
 * that permits.
 */
export const PREFLIGHT_RULING = /^\s*PREFLIGHT RULING \((\d{4}-\d{2}-\d{2})\):\s*(\S.*)$/;

/**
 * WHICH SLUG OWNS A PATH — the live slug map, read the other way round.
 *
 * **THIS IS WHAT MAKES THE UNCOVERED-CRITERION ARM NARROW ENOUGH TO
 * REFUSE ON.** A criterion names paths for two different reasons: it
 * CITES a document it reads, and it names a file the card will WRITE.
 * Nothing in the prose separates them — but a path a DECLARED COMPONENT
 * owns is a path the card could have fenced by naming that component's
 * slug, and did not. A path under no component at all (a governing
 * document, a method file, a root adapter) can only ever be a citation.
 *
 * **MEASURED, AND ITS FOUNDING INSTANCE REPRODUCES.** Over the whole
 * live board the plain uncovered set runs to three figures across a
 * quarter of the cards; adding the ownership condition cuts it to single
 * digits — and `T-127-s1` is in that residual, naming BOTH dogfood
 * fixtures, each owned by the `app-map` slug its fence never carried.
 * That is the card this whole preflight was filed over, caught by the
 * rule, at the ref the rule was written at.
 *
 * @param {Map<string, string[]>} slugs slug -> component ids
 * @param {import("./dispatch-brief.mjs").Component[]} comps
 * @returns {Map<string, string[]>} path domain -> the slugs that reserve it
 */
export function componentOwners(slugs, comps) {
  /** @type {Map<string, string[]>} */
  const owners = new Map();
  for (const [slug, ids] of slugs) {
    for (const c of comps) {
      if (!ids.includes(c.id)) continue;
      for (const p of c.paths) {
        // A component's `paths:` are written as GLOBS (`app/src/x/**`)
        // and containment is a path rule, so the trailing wildcard comes
        // off first — the same normalisation `fenceWeight` applies one
        // module over, spelled the same way so the two cannot drift into
        // different answers about one component.
        const domain = p.replace(/\*+$/, "").replace(/\/$/, "");
        if (domain === "") continue;
        owners.set(domain, [...new Set([...(owners.get(domain) ?? []), slug])].sort());
      }
    }
  }
  return owners;
}

/**
 * The slugs whose declared paths contain this one.
 *
 * @param {Map<string, string[]>} owners
 * @param {string} rel
 * @returns {string[]}
 */
export function ownersOf(owners, rel) {
  /** @type {string[]} */
  const found = [];
  for (const [domain, slugList] of owners) {
    if (within(rel, domain)) found.push(...slugList);
  }
  return [...new Set(found)].sort();
}

/**
 * @typedef {object} Ruling
 * @property {number} line
 * @property {string} date
 * @property {string} text
 */

/**
 * Every dated ruling the card's prose carries.
 *
 * @param {string} cardText
 * @returns {Ruling[]}
 */
export function rulings(cardText) {
  /** @type {Ruling[]} */
  const out = [];
  for (const { line, text } of cardLines(cardText).lines) {
    const m = PREFLIGHT_RULING.exec(text);
    if (m === null) continue;
    out.push({ line, date: /** @type {string} */ (m[1]), text: /** @type {string} */ (m[2]).trim() });
  }
  return out;
}

/**
 * The ruling that discharges this finding, if any.
 *
 * @param {Ruling[]} ruled
 * @param {string} subject the token a ruling has to NAME to discharge it
 * @returns {Ruling | undefined}
 */
export function dischargedBy(ruled, subject) {
  if (subject === "") return undefined;
  return ruled.find((r) => r.text.includes(subject));
}

/**
 * @typedef {object} PathOracle
 * @property {Set<string>} tracked every tracked file
 * @property {Set<string>} dirs    every directory prefix of one
 * @property {Set<string>} tops    the first segment of either
 */

/**
 * The tracked tree, as the three sets the path arm asks it about.
 *
 * The PREFIXES are the same ones `knownPathOracle` builds and for the
 * same reason: `git ls-files` lists files, so `docs` never appears in it
 * and a bare directory token would resolve to nothing without them.
 *
 * @param {string} root
 * @returns {PathOracle}
 */
export function pathOracle(root) {
  /** @type {Set<string>} */
  const tracked = new Set();
  /** @type {Set<string>} */
  const dirs = new Set();
  for (const rel of trackedFiles(root)) {
    tracked.add(rel);
    const parts = rel.split("/");
    for (let i = 1; i < parts.length; i += 1) dirs.add(parts.slice(0, i).join("/"));
  }
  const tops = new Set([...tracked, ...dirs].map((p) => /** @type {string} */ (p.split("/")[0])));
  return { tracked, dirs, tops };
}

/**
 * Which tokens THIS repository ignores. A build artefact is not a claim
 * about the tracked tree — `lib/parser/dist` and `app/dist` are named by
 * cards constantly and exist only after a build — so the question is
 * asked of git rather than answered from a list that would go stale the
 * day `.gitignore` moves.
 *
 * `check-ignore` exits 1 when it matched nothing, which is an ANSWER and
 * not a failure; only a status above one is this command being unable to
 * run.
 *
 * @param {string} root
 * @param {string[]} tokens
 * @returns {Set<string>}
 */
export function ignoredTokens(root, tokens) {
  if (tokens.length === 0) return new Set();
  const probe = spawnSync("git", ["-C", root, "check-ignore", "--stdin"], {
    input: tokens.join("\n"),
    encoding: "utf8",
  });
  if (probe.error !== undefined) throw probe.error;
  if (probe.status !== 0 && probe.status !== 1) {
    throw new CardPreflightError(
      `card-preflight: git check-ignore answered ${String(probe.status)} in ${root} — the path arm ` +
        "cannot tell a build artefact from a stale claim without it, and reporting every ignored " +
        "path as missing would be a refusal built out of noise.",
    );
  }
  const out = (probe.stdout ?? "").trim();
  return new Set(out === "" ? [] : out.split(/\r?\n/));
}

/**
 * Does this checkout still resolve the stamp to a commit?
 *
 * `--verify --quiet` with `^{commit}` for the reason `resolveIntegrationRef`
 * gives: it answers with a code and no stderr, and refuses a ref that
 * resolves to something other than a commit rather than handing back a
 * tree for a later command to fail on.
 *
 * @param {string} root
 * @param {string} hash
 * @returns {boolean}
 */
export function refResolves(root, hash) {
  const probe = spawnSync("git", ["-C", root, "rev-parse", "--verify", "--quiet", `${hash}^{commit}`], {
    encoding: "utf8",
  });
  if (probe.error !== undefined) throw probe.error;
  return probe.status === 0;
}

/* ────────────────────────────────────────────────────────────────────
 * The card, read as lines that know which section they are in.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} CardLine
 * @property {number} line   1-based, into the card FILE
 * @property {string} text   the PROSE reading — fenced and indented
 *   blocks arrive blank, so line numbers survive
 * @property {"criteria" | "body"} scope
 */

/**
 * The card's prose, line by line, each line knowing whether it sits in
 * the acceptance criteria.
 *
 * **THE SCOPE IS WHAT KEEPS THIS ARM FROM OVER-FIRING.** A card body is
 * full of illustrative paths — fixtures, near-misses, paths that
 * deliberately do not exist — and refusing a dispatch on one of those
 * would make this gate the thing nobody runs. The criteria are the
 * claims the dispatch is actually bought on.
 *
 * @param {string} cardText
 * @returns {{ lines: CardLine[], hasCriteria: boolean }}
 */
export function cardLines(cardText) {
  const body = cardBody(cardText);
  const offset = cardText.slice(0, cardText.length - body.length).split(/\r?\n/).length - 1;
  const prose = proseOnly(body).split(/\r?\n/);
  /** @type {CardLine[]} */
  const lines = [];
  let inCriteria = false;
  let hasCriteria = false;
  for (let i = 0; i < prose.length; i += 1) {
    const text = /** @type {string} */ (prose[i]);
    if (/^#{2,}\s/.test(text)) {
      inCriteria = CRITERIA_HEADING.test(text.trim());
      if (inCriteria) hasCriteria = true;
    }
    lines.push({ line: offset + i + 1, text, scope: inCriteria ? "criteria" : "body" });
  }
  return { lines, hasCriteria };
}

/**
 * @typedef {object} PathClaim
 * @property {number} line
 * @property {string} token   as the card wrote it
 * @property {string} normal  trailing slash removed
 * @property {"frontmatter" | "criteria" | "body"} scope
 * @property {"exists" | "missing" | "pattern" | "truncated" | "ignored"} state
 * @property {boolean} inFence whether the card's own fence reserves it
 */

/**
 * Every repository path the card names, classified.
 *
 * @param {string} cardText
 * @param {string[]} touches the frontmatter's own entries
 * @param {PathOracle} oracle
 * @param {string[]} fencePaths the card's expanded fence
 * @param {(tokens: string[]) => Set<string>} ignoreOf
 * @returns {PathClaim[]}
 */
export function pathClaims(cardText, touches, oracle, fencePaths, ignoreOf) {
  const { lines } = cardLines(cardText);
  /** @type {{ line: number, token: string, scope: "frontmatter" | "criteria" | "body" }[]} */
  const raw = [];
  for (const entry of touches) {
    if (!entry.includes("/")) continue; // a SLUG — the fence arm's, not this one's
    raw.push({ line: 0, token: entry, scope: "frontmatter" });
  }
  for (const { line, text, scope } of lines) {
    for (const m of text.matchAll(REPO_PATH_TOKEN)) {
      const token = /** @type {string} */ (m[1]).replace(/[.,;:)\]}`'"]+$/, "");
      if (!oracle.tops.has(/** @type {string} */ (token.split("/")[0]))) continue;
      raw.push({ line, token, scope });
    }
  }
  /** @type {Map<string, { line: number, token: string, scope: "frontmatter" | "criteria" | "body" }>} */
  const first = new Map();
  const rank = { frontmatter: 0, criteria: 1, body: 2 };
  for (const r of raw) {
    const held = first.get(r.token);
    if (held === undefined || rank[r.scope] < rank[held.scope]) first.set(r.token, r);
  }
  const candidates = [...first.values()];
  const ignored = ignoreOf(
    candidates.filter((c) => !c.token.includes("*")).map((c) => c.token),
  );
  /** @type {PathClaim[]} */
  const out = [];
  for (const c of candidates) {
    const normal = c.token.replace(/\/+$/, "");
    const inFence = fencePaths.some((d) => within(normal, d));
    /** @type {PathClaim["state"]} */
    let state;
    if (c.token.includes("*")) state = "pattern";
    else if (/-$/.test(normal)) state = "truncated";
    else if (oracle.tracked.has(normal) || oracle.dirs.has(normal)) state = "exists";
    else if (ignored.has(c.token)) state = "ignored";
    else state = "missing";
    out.push({ line: c.line, token: c.token, normal, scope: c.scope, state, inFence });
  }
  return out.sort((a, b) => a.line - b.line || a.token.localeCompare(b.token));
}

/**
 * Every `@ <hash>` stamp the card's prose carries, deduped by hash.
 *
 * @param {string} cardText
 * @returns {{ line: number, hash: string }[]}
 */
export function refClaims(cardText) {
  const { lines } = cardLines(cardText);
  /** @type {Map<string, { line: number, hash: string }>} */
  const seen = new Map();
  for (const { line, text } of lines) {
    for (const m of text.matchAll(REF_STAMP)) {
      const hash = /** @type {string} */ (m[1]);
      if (!seen.has(hash)) seen.set(hash, { line, hash });
    }
  }
  return [...seen.values()];
}

/**
 * Every claim the card makes that another card's LIVE LANE holds
 * something, deduped by the id it names.
 *
 * @param {string} cardText
 * @returns {{ line: number, taskId: string, text: string }[]}
 */
export function heldClaims(cardText) {
  const { lines } = cardLines(cardText);
  // A claim can wrap across the hard wrap every document here uses, so
  // the scan runs over the COLLAPSED text and dates each hit by the line
  // its id sits on. Searching line by line would miss exactly the claims
  // this repository writes (docs/CONVENTIONS.md, A CITATION NAMES A
  // SYMBOL: "a hard wrap across the phrase").
  const joined = lines.map((l) => l.text).join("\n");
  /** @type {Map<string, { line: number, taskId: string, text: string }>} */
  const seen = new Map();
  for (const m of joined.matchAll(HELD_CLAIM)) {
    const taskId = /** @type {string} */ (m[1] ?? m[2]);
    if (seen.has(taskId)) continue;
    const before = joined.slice(0, m.index ?? 0).split("\n").length - 1;
    seen.set(taskId, {
      line: /** @type {CardLine} */ (lines[before] ?? lines[0] ?? { line: 0 }).line,
      taskId,
      text: /** @type {string} */ (m[0]).replace(/\s+/g, " ").trim(),
    });
  }
  return [...seen.values()];
}

/* ────────────────────────────────────────────────────────────────────
 * The preflight itself.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} PreflightResult
 * @property {import("./dispatch-brief.mjs").Rec[]} recs
 * @property {string[]} findings
 */

/** @param {import("./dispatch-brief.mjs").Ctx} ctx @param {string} via */
function tree(ctx, via) {
  return treeProv(ctx.ref, via);
}

/** @param {import("./dispatch-brief.mjs").Ctx} ctx @param {string} via */
function live(ctx, via) {
  return liveProv(ctx.at, ctx.host, via);
}

/**
 * ARM `--preflight`. Re-derive, at HEAD, every claim of the card's that
 * IS derivable, and refuse the dispatch on any that no longer holds.
 *
 * THE ORDER OF THE SIDE EFFECTS IS THE POINT: this reads and prints. It
 * writes no manifest, moves no ref and stamps nothing, so a dispatcher
 * can run it before deciding whether to spend a seat at all.
 *
 * @param {import("./dispatch-brief.mjs").Ctx} ctx
 * @param {{ order?: any }} [options] the parser's DispatchOrder, injectable
 *   so a spec can drive one ruling set through two readings
 * @returns {Promise<PreflightResult>}
 */
export async function preflight(ctx, options = {}) {
  const card = ctx.card;
  if (card === undefined) {
    throw new CardPreflightError(
      "card-preflight: no card was named, so there is no claim set to re-derive. This command " +
        "answers about ONE card and will not preflight the board.",
    );
  }
  const cardFile = path.join(ctx.root, card.file);
  let cardText;
  try {
    cardText = readFileSync(cardFile, "utf8");
  } catch (err) {
    throw new CardPreflightError(
      `card-preflight: ${card.file} is on the board and could not be read at ${cardFile} — ` +
        `${err instanceof Error ? err.message : String(err)}. This run is not a claim about the ` +
        "card; it is a claim about this checkout.",
    );
  }

  const order =
    options.order ??
    (
      await dispatchContext({
        root: ctx.root,
        porcelain: ctx.porcelain,
        at: ctx.at,
        host: ctx.host,
        conventions: ctx.conventions,
      })
    ).order;
  const ruling = order.all.find(/** @param {{ id: string }} r */ (r) => r.id === card.id);
  if (ruling === undefined) {
    throw new CardPreflightError(
      `card-preflight: the parser's dispatch order carries no ruling for ${card.id}, so this ` +
        "command has neither its fence nor its blocker verdict. Both are the parser's own — this " +
        "module will not re-spell either (T-057).",
    );
  }
  const fence = ruling.fence;
  const fencePaths = [...fence.paths];

  const oracle = pathOracle(ctx.root);
  const touches = fieldList(card.fields, "touches");
  const claims = pathClaims(cardText, touches, oracle, fencePaths, (tokens) =>
    ignoredTokens(ctx.root, tokens),
  );
  const { hasCriteria } = cardLines(cardText);

  /**
   * Every discrepancy this run raised, each carrying the SUBJECT a
   * ruling would have to name to discharge it. Nothing is a finding
   * until the card's own rulings have been read against it.
   *
   * @type {{ subject: string, message: string }[]}
   */
  const raised = [];
  /** @param {string} subject @param {string} message */
  const raise = (subject, message) => raised.push({ subject, message });
  /** @type {import("./dispatch-brief.mjs").Rec[]} */
  const recs = [
    note("THE CARD PREFLIGHT — every derivable claim re-derived at HEAD, before a seat is paid for"),
    value(`card: ${card.file}`, tree(ctx, "flat docs/tasks/T-*.md")),
    value(`HEAD in full: ${ctx.ref}`, tree(ctx, "git rev-parse HEAD")),
    value(
      `card status: ${fieldScalar(card.fields, "status")} / size ${fieldScalar(card.fields, "size")}`,
      tree(ctx, `${card.file} frontmatter`),
    ),
    blank(),
  ];

  /* ── CLASS ONE — the paths ──────────────────────────────────────── */
  recs.push(note("CLAIM CLASS paths — every repository path this card names, resolved at HEAD"));
  if (!hasCriteria) {
    recs.push(
      note("  this card carries no acceptance-criteria heading, so every path in it is read as"),
      note("  body scope and NOTHING in this class can refuse the dispatch. Say so rather than"),
      note("  reporting a clean class: an absent section is not a sound one."),
    );
  }
  const byState = /** @param {string} s */ (s) => claims.filter((c) => c.state === s);
  const viaPaths = `${card.file} prose and frontmatter, over git ls-files`;
  for (const state of ["exists", "missing", "pattern", "truncated", "ignored"]) {
    recs.push(value(`paths ${state}: ${byState(state).length}`, tree(ctx, viaPaths)));
  }
  const stale = claims.filter(
    (c) => c.state === "missing" && c.scope !== "body" && !c.inFence,
  );
  const creations = claims.filter((c) => c.state === "missing" && c.scope !== "body" && c.inFence);
  const illustrative = claims.filter((c) => c.state === "missing" && c.scope === "body");
  for (const c of stale) {
    recs.push(
      value(
        `STALE PATH line ${c.line}: ${c.token} — named in the ${c.scope} and absent from the tree`,
        tree(ctx, viaPaths),
      ),
      note("  and this card's own fence does not reserve it, so it cannot be a creation target"),
      note("  either. Correct the card, or widen the fence on the card and re-run."),
    );
    raise(
      c.token,
      `STALE PATH at ${card.file} line ${c.line}: ${c.token} is named in the ${c.scope} and no ` +
        "such tracked path exists at HEAD, and the card's own fence does not reserve it, so it " +
        "cannot be a creation target either.",
    );
  }
  for (const c of creations) {
    recs.push(
      value(
        `creation target line ${c.line}: ${c.token} — absent, and inside this card's own fence`,
        tree(ctx, viaPaths),
      ),
    );
  }
  for (const c of illustrative) {
    recs.push(
      value(
        `absent, body scope line ${c.line}: ${c.token} — reported, never refused on`,
        tree(ctx, viaPaths),
      ),
    );
  }
  recs.push(blank());

  /* ── CLASS TWO — the fence ──────────────────────────────────────── */
  recs.push(note("CLAIM CLASS fence — the card's touches, expanded through the live slug map"));
  const viaFence = `${card.file} field touches, expanded by the parser's fence module`;
  recs.push(
    value(`fence entries: ${touches.length}`, tree(ctx, viaFence)),
    value(`fence reserves: ${fencePaths.join(" ") || "nothing"}`, tree(ctx, viaFence)),
  );
  for (const token of fence.unusable) {
    recs.push(value(`UNUSABLE fence token: ${token}`, tree(ctx, viaFence)));
    raise(
      token,
      `UNUSABLE FENCE TOKEN at ${card.file}: ${JSON.stringify(token)} is neither a component slug ` +
        "nor a path this expansion can read. An unresolved token is not disjoint from everything " +
        "(method/lane-protocol.md rule 5), and --write-fence will refuse to write a manifest around it.",
    );
  }
  for (const token of fence.tokens) {
    if (token.kind !== "slug" && token.kind !== "path") continue;
    const held = [...oracle.tracked].filter((rel) =>
      token.paths.some(/** @param {string} d */ (d) => within(rel, d)),
    );
    recs.push(
      value(
        `fence ${token.raw} reserves tracked files: ${held.length}`,
        tree(ctx, `${viaFence}, counted over git ls-files`),
      ),
    );
    if (held.length > 0) continue;
    recs.push(
      note(`  and that is a DEAD entry — it reserves a path set nothing in the tree sits under`),
    );
    raise(
      token.raw,
      `DEAD FENCE ENTRY at ${card.file}: ${JSON.stringify(token.raw)} expands to ` +
        `${token.paths.join(" ") || "no path at all"} and no tracked file is under it at HEAD. A ` +
        "fence true when the card was written and empty at dispatch is the shape that cost T-127-s1 " +
        "a whole lane.",
    );
  }
  const cited = claims.filter((c) => c.state === "exists" && c.scope === "criteria" && !c.inFence);
  const owners = componentOwners(ctx.slugs, ctx.comps);
  const uncovered = cited.map((c) => ({ claim: c, owners: ownersOf(owners, c.normal) }));
  recs.push(
    value(
      `criteria name paths the fence does NOT reserve: ${cited.length}`,
      tree(ctx, `${viaFence}, against the criteria's own path tokens`),
    ),
  );
  for (const u of uncovered) {
    if (u.owners.length === 0) {
      recs.push(
        value(
          `  outside the fence, under no component, line ${u.claim.line}: ${u.claim.token}`,
          tree(ctx, viaPaths),
        ),
      );
      continue;
    }
    recs.push(
      value(
        `UNCOVERED CRITERION PATH line ${u.claim.line}: ${u.claim.token} — reserved by ` +
          `${u.owners.join(", ")}, which this fence does not carry`,
        tree(ctx, `${viaPaths}, against the live slug map`),
      ),
    );
    raise(
      u.claim.token,
      `UNCOVERED CRITERION PATH at ${card.file} line ${u.claim.line}: ${u.claim.token} is named in ` +
        `the acceptance criteria, exists at HEAD, and is reserved by the ${u.owners.join(", ")} ` +
        `slug — which this card's touches do not carry. A fence true when the card was written and ` +
        "wrong at dispatch is T-127-s1's shape: that lane's own criteria named both dogfood " +
        "fixtures after an intervening merge had moved them under another slug, and it stopped " +
        "honestly at lane prices.",
    );
  }
  recs.push(
    note("  A PATH UNDER NO COMPONENT IS NEVER REFUSED ON, and the reason is measured: a criterion"),
    note("  cites far more files than it writes, so on this board the plain uncovered set is large"),
    note("  and mostly correct. What refuses is a path a DECLARED component owns — the card could"),
    note("  have fenced it by naming that slug, so its absence is a fence claim and not a citation."),
    blank(),
  );

  /* ── CLASS THREE — the figures ──────────────────────────────────── */
  recs.push(note("CLAIM CLASS figures — every stamped figure, re-run through its own deriver"));
  const figures = auditCard(cardText, derivedTexts(ctx));
  recs.push(
    value(
      `figures claiming a provenance or making a census claim: ${figures.length}`,
      tree(ctx, `${card.file}, audited against this checkout's derivers`),
    ),
  );
  for (const f of figures) {
    recs.push(
      value(
        `${f.verdict} line ${f.line}: ${f.text}`,
        tree(ctx, `${card.file}, audited against this checkout's derivers`),
      ),
      note(`  ${f.detail}`),
    );
    if (FINDING_VERDICTS.includes(f.verdict)) {
      raise(f.text, `${f.verdict} at ${card.file} line ${f.line}: ${f.text} — ${f.detail}`);
    }
  }
  recs.push(
    note("  A FIGURE STATED WITH A DERIVE COMMAND IS RE-RUN THROUGH THE DERIVER THAT STAMP NAMES,"),
    note("  never by executing text out of the card. The closed vocabulary is card-figures.mjs's"),
    note("  own CARD_DERIVERS; a provenance outside it is reported unrunnable rather than obeyed."),
    blank(),
  );

  /* ── CLASS FOUR — the blockers ──────────────────────────────────── */
  recs.push(note("CLAIM CLASS blockers — every blocked_by entry, and the stated reason where derivable"));
  const blockedBy = fieldList(card.fields, "blocked_by");
  const viaBoard = "flat docs/tasks/T-*.md frontmatter fields id and status";
  recs.push(
    value(
      `blocked_by: ${blockedBy.length === 0 ? "nothing" : blockedBy.join(", ")}`,
      tree(ctx, `${card.file} frontmatter field blocked_by`),
    ),
  );
  for (const id of blockedBy) {
    const other = ctx.cards.get(id);
    if (other === undefined) {
      recs.push(value(`blocker ${id}: NO LIVE CARD`, tree(ctx, viaBoard)));
      raise(
        id,
        `BLOCKER WITH NO CARD at ${card.file}: blocked_by names ${id} and no live card declares ` +
          "that id, so this card's wait can never be satisfied and no seat can tell it has been.",
      );
      continue;
    }
    recs.push(
      value(`blocker ${id}: ${fieldScalar(other.fields, "status")}`, tree(ctx, viaBoard)),
    );
  }
  recs.push(
    value(`the parser rules this card: ${ruling.state}`, live(ctx, "the parser's readDispatchOrder, against the live lane list")),
    value(`  ${ruling.reason}`, live(ctx, "the parser's readDispatchOrder, against the live lane list")),
  );
  if (ruling.state === "blocked" || ruling.state === "waits") {
    raise(
      `${card.id} ${ruling.state}`,
      `NOT STARTABLE at ${card.file}: the parser rules ${card.id} ${ruling.state} — ${ruling.reason}. ` +
        "A card dispatched over an unmet blocker is a seat spent on work that cannot land.",
    );
  }
  const held = heldClaims(cardText);
  for (const h of held) {
    const laneLive = ctx.lanes.some(/** @param {{ taskId: string }} l */ (l) => l.taskId === h.taskId);
    const other = ctx.cards.get(h.taskId);
    recs.push(
      value(
        `stated reason line ${h.line}: "${h.text}" — ${h.taskId} lane live now: ${laneLive ? "YES" : "NO"}` +
          `, board says ${other === undefined ? "no live card" : fieldScalar(other.fields, "status")}`,
        live(ctx, "git worktree list --porcelain, filtered on the branch, joined to the board"),
      ),
    );
    if (laneLive) continue;
    raise(
      h.taskId,
      `STATED REASON NO LONGER HOLDS at ${card.file} line ${h.line}: "${h.text}", and no live lane ` +
        `is on ${h.taskId} now. A lane is a LIVE fact — it carries the time it was read at and never ` +
        "a commit — so a card holding one from its filing is quoting a worktree that has gone.",
    );
  }
  recs.push(
    note("  A blocking reason written as ordinary prose is NOT checked, and the boundary is"),
    note("  measured rather than chosen: the phrase this class reads is a claim about a LIVE LANE,"),
    note("  which the lane list answers. An `after such-and-such lands` sentence is satisfied by"),
    note("  the blocker being done, so reading those would refuse on the normal case."),
    blank(),
  );

  /* ── CLASS FIVE — the refs ──────────────────────────────────────── */
  recs.push(note("CLAIM CLASS refs — every commit-ref stamp the card carries, resolved here"));
  const refs = refClaims(cardText);
  recs.push(
    value(`ref stamps: ${refs.length}`, tree(ctx, `${card.file}, the published @ stamp form`)),
  );
  for (const r of refs) {
    const ok = refResolves(ctx.root, r.hash);
    recs.push(
      value(
        `ref ${r.hash} at line ${r.line}: ${ok ? "resolves" : "DOES NOT RESOLVE"}`,
        live(ctx, "git rev-parse --verify, in this checkout"),
      ),
    );
    if (ok) continue;
    raise(
      r.hash,
      `DANGLING REF at ${card.file} line ${r.line}: @ ${r.hash} resolves to no commit in this ` +
        "checkout, so every figure stamped with it is a figure nobody can re-derive.",
    );
  }
  recs.push(blank());

  /* ── THE RULINGS ────────────────────────────────────────────────── */
  const ruled = rulings(cardText);
  recs.push(
    note("THE CARD'S OWN RULINGS — a discrepancy may be corrected, or ruled acceptable and dated"),
  );
  const viaRuling = `${card.file}, its dated PREFLIGHT RULING lines`;
  recs.push(value(`rulings on this card: ${ruled.length}`, tree(ctx, viaRuling)));
  /** @type {string[]} */
  const findings = [];
  /** @type {Set<Ruling>} */
  const spent = new Set();
  for (const r of raised) {
    const by = dischargedBy(ruled, r.subject);
    if (by === undefined) {
      findings.push(r.message);
      continue;
    }
    spent.add(by);
    recs.push(
      value(
        `RULED (${by.date}) line ${by.line}: ${r.message}`,
        tree(ctx, `${viaRuling}, matched on the subject it names`),
      ),
      note(`  discharged by the ruling on that line, which names this finding's subject.`),
    );
  }
  for (const r of ruled) {
    if (spent.has(r)) continue;
    recs.push(
      value(
        `ruling line ${r.line} (${r.date}) discharges nothing at this ref: ${r.text}`,
        tree(ctx, viaRuling),
      ),
    );
  }
  recs.push(
    note("  A RULING DISCHARGES ONE FINDING BY NAMING ITS SUBJECT, never a whole claim class, and"),
    note("  every discharge is printed above with the line that made it. A suppression nobody can"),
    note("  see is a guard that permits, which is the failure this whole arm exists to remove."),
    blank(),
  );

  /* ── THE HONEST OMISSION ────────────────────────────────────────── */
  recs.push(
    note("WHAT THIS PREFLIGHT CHECKED AND WHAT IT CANNOT — printed on every run, sound or not"),
  );
  for (const c of CLAIM_CLASSES) {
    recs.push(
      note(`  ${c.key}`),
      note(`    checks:  ${c.checks}`),
      note(`    refuses: ${c.refuses}`),
      note(`    cannot:  ${c.cannot}`),
    );
  }
  recs.push(note("  and no class above covers any of these:"));
  for (const line of NOT_A_CLAIM_CLASS) recs.push(note(`    ${line}`));
  recs.push(
    blank(),
    note("A GREEN PREFLIGHT MEANS THE CARD'S DERIVABLE CLAIMS STILL HOLD. It does not mean the"),
    note("work is wanted, that the criteria are right, or that the design behind them survives."),
  );
  return { recs, findings };
}
