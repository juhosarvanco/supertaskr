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
import {
  blank,
  fieldList,
  fieldScalar,
  frontmatterFields,
  liveProv,
  note,
  treeProv,
  value,
} from "./dispatch-brief.mjs";
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
      "every slash-carrying path token whose first segment exists at HEAD, resolved against " +
      "the tracked tree (the verdict's first correction: narrower than 'every path', stated so)",
    refuses:
      "a path named in the frontmatter or the acceptance criteria that does not exist and " +
      "is not inside this card's own fence, so it cannot be a creation target either",
    cannot:
      "a glob, a truncated token, a git-ignored build artefact, anything inside a fenced " +
      "or indented transcript block (the prose reading blanks them), a token whose FIRST " +
      "segment is not a top-level entry at HEAD (a deleted or renamed top-level directory " +
      "is this staleness class at its largest and is invisible here), a leading-./ token, " +
      "and a root file with no slash",
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
      "another card's LIVE LANE holds a fence, which is read against the live lane list. A card the " +
      "board's schedule does not draw at all has no ruling here, and this command REFUSES rather " +
      "than reporting the other classes as though they were the whole answer",
  },
  {
    key: "refs",
    checks: "every commit-ref stamp the card carries, resolved with git rev-parse",
    refuses: "a stamp this checkout can no longer resolve to a commit",
    cannot:
      "whether the stamped ref is still the RIGHT one — only that it still exists — and a " +
      "commit written in any form but the published stamp: prose like 'at commit <hash>' is " +
      "invisible, only the '@ <hash>' spelling is read (the verdict's first correction)",
  },
  {
    key: "quotes",
    checks:
      "every CARD CLAIM marker — a quoted string plus the tracked file the card names as its " +
      "source — read against that file's own bytes at HEAD, whitespace collapsed on both sides " +
      "so a hard-wrapped document still matches, and compared with the capitals the card wrote",
    refuses:
      "a marked quote the named file does not contain, a marker whose source is not a tracked " +
      "file at HEAD, and a marker no quoted string can be read out of",
    cannot:
      "any assertion the card did not MARK, and the unmarked ones are COUNTED and LISTED rather " +
      "than passed over: a quoted sentence beside a path the card names could have been marked " +
      "and was not, and a quoted sentence naming no source at all — an assertion about a " +
      "platform, a version or a runtime — is not a string in any file, so it belongs to the " +
      "verifier's phase-one ground truth and is reported here rather than settled. It opens ONE " +
      "named file and never the tree, so a true quote under a wrong file name is a finding and " +
      "not a pass; and it judges OCCURRENCE, never meaning. THE FRONTMATTER IS READ IN ONE " +
      "DIRECTION ONLY: a MARKER is taken from the BODY's prose alone, so one written into a " +
      "frontmatter field is reported as a SIGHTING and is never read as a claim, while the " +
      "frontmatter's SCALAR values ARE scanned for unmarked quoted runs — one field at a time, " +
      "with YAML's own quoting unwrapped first — and its LIST values are not scanned at all. A " +
      "quoted run shorter than the floor is COUNTED and not listed; a run that SPANS this " +
      "repository's hard wrap IS read, because the paragraph is FOLDED on a single space before " +
      "the needle is matched, the way the frontmatter title is folded; and a run that OPENS IN " +
      "ONE PARAGRAPH AND CLOSES IN ANOTHER stays unseen, because a blank line ends the unit and " +
      "pairing a quote across one would read the typesetting rather than the sentence. AND THE " +
      "FOLD RE-PAIRS WHAT THE LINE ONCE BOUNDED: an odd quote character now reaches across the " +
      "join, so a run the line-scoped reading paired can be swallowed into a longer one instead " +
      "of listed on its own — the fold reaches far more than it drops, and what it drops is not " +
      "none",
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

/* ────────────────────────────────────────────────────────────────────
 * THE MARKED CLAIM (T-230) — the one shape this preflight can settle
 * about a card's SENTENCES rather than its structure.
 *
 * THE CARD CHOSE THE CHEAP SHAPE ON PURPOSE, and said what it does not
 * reach: *"the cheap shape is a quoted string plus the file it claims to
 * be in; the expensive shape is parsing prose. Prefer the cheap one and
 * say what it does not reach."* So a card ASKS for a check by writing
 * one plain body line:
 *
 *     CARD CLAIM (docs/CONVENTIONS.md): "an edit script's success is a GATE"
 *
 * ── WHY OPT-IN IS WHAT MAKES IT ABLE TO REFUSE ───────────────────────
 * The other arms here are automatic and therefore had to be measured
 * narrow before they could refuse anything. This one is written by the
 * author, so refusing on it costs nobody an unasked-for refusal: the
 * marker IS the request. That is the whole of why the CHECKED half
 * refuses and the UNMARKED half only reports.
 *
 * ── AND THE GRAMMAR IS THE RULING'S, NOT A SECOND ONE ────────────────
 * `PREFLIGHT RULING (<date>):` already publishes this shape — a
 * parenthesised SOURCE, a colon, a payload — so this is a second member
 * of one family rather than a new dialect. The bracketed half is a date
 * there and a file here, which is exactly the difference between the two
 * questions.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The marker, read from the PROSE reading — so a marker written inside a
 * fenced or indented block is NOT a claim.
 *
 * **THAT IS THE OPPOSITE CHOICE FROM `card-figures.mjs`'s `card:` STAMP,
 * AND THE REASON IS THE HAZARD EACH ONE ACTUALLY HAS.** A `card:` stamp
 * is audited inside transcripts because nobody quotes one by accident. A
 * marker of this shape gets quoted constantly — by the notes that
 * document it, by the card that filed it, by any room arguing about it —
 * so reading raw blocks would turn documentation ABOUT the marker into
 * live claims. A fenced or indented block is how a document says *this
 * is an example*, and the escape-hatch that opens is closed by REPORTING
 * every sighting the prose reader could not see rather than by widening
 * the reader (see `unseenMarkers`).
 *
 * A leading list bullet and surrounding emphasis are accepted, because
 * the ruling's own history is that the natural way to write one is the
 * way that silently does nothing (T-160's verdict, correction four).
 */
export const CARD_CLAIM = /^\s{0,3}(?:[-*]\s+)?\**CARD CLAIM \(([^)\n]{1,200})\):\s*(\S.*)$/;

/** The marker's opening, loose, for the sighting report. */
export const CARD_CLAIM_LOOSE = /CARD CLAIM\s*\(/;

/**
 * A quoted run: straight or typographic double quotes. **THE NEEDLE THIS
 * FINDS IS THE FIRST ONE IN THE PAYLOAD**, stated rather than left to be
 * discovered, so a marker carrying two quoted runs has one deterministic
 * reading.
 *
 * **THE CLASS IS BOUNDED BY THE UNIT AND NO LONGER BY THE LINE**
 * (T-230-s7). It read `[^"\n]+`, and every card in docs/tasks/ is
 * hard-wrapped at seventy columns, so the ordinary shape of a quoted
 * acceptance criterion — a sentence crossing one line break — arrived as
 * two half-runs of which neither opened and closed. Its caller now hands
 * in a FOLDED unit (`unmarkedQuotes` joins a paragraph's lines on a
 * single space; a frontmatter scalar is one line already), so the
 * newline was a bound the caller has already removed and keeping it
 * would be a second answer to the question the fold settles. **THE FOLD
 * IS THE REPAIR AND THIS IS ITS SPELLING**: on a folded unit the two
 * classes cannot be told apart, which is exactly why only one of them
 * should be written down.
 */
export const QUOTED_RUN = /"([^"]+)"|“([^”]+)”/g;

/**
 * The same question asked of a MARKER's payload, where a backticked run
 * counts too.
 *
 * **TWO CONSTANTS FOR ONE-LOOKING QUESTION, WITH THE REASON MEASURED**
 * (T-057 forbids a second copy of one derivation; these are two
 * derivations). Inside a marker the author has already said *this is the
 * needle*, and this repository writes a flag or an identifier in
 * backticks — the `T-211` instance is exactly that shape. In ORDINARY
 * PROSE a backticked run is how this project writes every path, command
 * and symbol it mentions: over the live board the double-quoted runs
 * number in the thousands and the backticked ones would swamp them, so
 * the unmarked report would be unreadable and therefore unread.
 */
export const MARKED_NEEDLE = /"([^"\n]+)"|“([^”\n]+)”|`([^`\n]+)`/g;

/**
 * WHERE A MARKER'S PAYLOAD ENDS — the LAST line of it, which is not
 * always the line the marker opens on.
 *
 * **A MARKER WRAPS LIKE EVERYTHING ELSE IN A SEVENTY-COLUMN DOCUMENT,
 * AND ITS CONTINUATION LINE IS NOT ITSELF A MARKER LINE** (V-T-230-s7,
 * attack A4). Ending the marked segment at the marker LINE left the
 * needle's orphan closing quote on the next line, which joined the NEXT
 * unit — and under a class bounded by the unit rather than the line that
 * orphan pairs with the following run's OPENING quote. The author's real
 * assertion was swallowed and a run nobody wrote was listed in its
 * place: a false-negative census AND a fabricated listing, on a line a
 * dispatcher decides on. This is the exact leak the fold's marker branch
 * was built to prevent, one line further down than the branch reached.
 *
 * **BALANCE IS THE TEST, AND THE END OF THE PARAGRAPH IS THE FLOOR.**
 * The segment grows while the marker's own quoting is open — an odd
 * number of straight quotes, or a typographic pair still unclosed — and
 * stops the moment it closes. A marker whose quoting NEVER closes inside
 * its paragraph is malformed, and the answer there is to consume only
 * its own line, exactly as before: swallowing the rest of the paragraph
 * would drop real assertions in silence, which is the failure this
 * whole class exists against. Backticks are not balanced here on
 * purpose — a backticked needle is a needle to `MARKED_NEEDLE` but not
 * to `QUOTED_RUN`, so an orphan backtick cannot corrupt this census.
 *
 * @param {CardLine[]} para  the paragraph, in order
 * @param {number} at        the index of the marker line
 * @returns {number} the index of the payload's last line, never before `at`
 */
export function markerEnd(para, at) {
  let straight = 0;
  let opened = 0;
  let closed = 0;
  for (let i = at; i < para.length; i += 1) {
    const text = /** @type {CardLine} */ (para[i]).text;
    straight += (text.match(/"/g) ?? []).length;
    opened += (text.match(/\u201c/g) ?? []).length;
    closed += (text.match(/\u201d/g) ?? []).length;
    if (straight % 2 === 0 && opened === closed) return i;
  }
  return at;
}

/**
 * The shortest quoted run the unmarked report treats as an assertion.
 * Measured over the live board: below this the hits are initials, single
 * words and punctuation samples rather than sentences anybody meant as a
 * claim.
 */
export const MIN_QUOTE_CHARS = 4;

/**
 * Whitespace collapsed, both sides of every comparison.
 *
 * **THIS IS LOAD-BEARING AND THE RULE IS THIS REPOSITORY'S OWN.** Every
 * governing document here is hard-wrapped at about seventy columns, so a
 * phrase search is a search for a line break nobody chose — docs/
 * CONVENTIONS.md's A CITATION NAMES A SYMBOL, NOT A LINE carries the
 * measurement and the remedy in one sentence: *"search the COLLAPSED
 * text, the way every mechanical reader of this file does before it
 * matches anything."* Without this the arm would refuse a card quoting a
 * sentence that IS in the file, which is the one failure a guard may not
 * have.
 *
 * @param {string} text
 * @returns {string}
 */
export function collapse(text) {
  return text.replace(/\s+/g, " ").trim();
}

/** How much of a quoted run the unmarked listing prints before eliding. */
export const QUOTE_CLIP_CHARS = 72;

/**
 * A quoted run, cut to one printed line.
 *
 * **THE ELISION IS A DISPLAY RULE AND IS MARKED AS ONE.** The listing is
 * a census of what was NOT checked, so the reader needs one line per
 * claim more than they need the whole sentence; nothing compares against
 * this string, and every string that IS compared — the marked needles —
 * is printed whole.
 *
 * @param {string} text
 * @returns {string}
 */
export function clip(text) {
  return text.length <= QUOTE_CLIP_CHARS ? text : `${text.slice(0, QUOTE_CLIP_CHARS)}...`;
}

/* ────────────────────────────────────────────────────────────────────
 * THE FRONTMATTER, AS A SCOPE (T-230-s3).
 *
 * `cardBody` strips the frontmatter and every reader in this class took
 * its output, so a card's TITLE was the one place none of them looked —
 * and one of this arm's own founding instances states its claim there.
 * The two halves below are what the scope needs and no more: the values,
 * and the rule for reading a YAML wrapper off one.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * A frontmatter scalar with YAML's OWN quoting taken off.
 *
 * **THE UNWRAP IS THE WHOLE OF WHY THIS SCOPE IS READABLE, AND IT IS
 * MEASURED RATHER THAN ASSUMED.** `frontmatterFields` hands back the
 * value as written, wrapper included, so a field spelled
 * `suggested_by: "verifier … at <hash>"` presents its ENTIRE value as
 * one quoted run — a quotation mark that is YAML syntax read as an
 * author's assertion. Over the live board at `f5bad14` the raw reading
 * finds 171 quoted runs across the frontmatter of 448 cards and 131 of
 * them are exactly that wrapper; unwrapping first leaves 40, of which 39
 * sit in `title:` and every one is an assertion somebody wrote.
 *
 * **THE GUARD IS WHAT KEEPS IT FROM EATING A REAL PAIR.** A value that
 * merely BEGINS and ENDS with a quote is not necessarily wrapped —
 * `"a" and "b"` is two runs, not one wrapper — so the pair is taken off
 * only when the quote character does not occur again between them, and
 * anything else is left exactly as written. The conservative direction
 * is to leave it: an un-stripped wrapper costs one listed line, and a
 * wrongly stripped one silently loses an assertion.
 *
 * @param {string} raw
 * @returns {string}
 */
export function unwrapScalar(raw) {
  const t = raw.trim();
  if (t.length < 2) return t;
  const q = t[0];
  if (q !== '"' && q !== "'") return t;
  if (!t.endsWith(q)) return t;
  const inner = t.slice(1, -1);
  return inner.includes(q) ? t : inner;
}

/**
 * A frontmatter key and everything after its colon, AS WRITTEN — the same
 * shape `frontmatterFields` matches, minus the inline-comment strip it
 * applies afterwards. Read `frontmatterScalars` for why this arm cannot
 * take that strip.
 */
export const FRONTMATTER_SCALAR = /^([A-Za-z_][A-Za-z0-9_]*):[ \t]*(.*)$/;

/**
 * @typedef {object} ScalarField
 * @property {number} line  1-based, into the card FILE
 * @property {string} key   the field name
 * @property {string} value the scalar, YAML's own quoting removed
 */

/**
 * Every SCALAR frontmatter field of a card, with the line it sits on.
 *
 * **THE FIELD SET COMES FROM `frontmatterFields`; ONLY THE SCALAR'S OWN
 * TEXT AND ITS LINE ARE READ HERE** (T-057 where it applies, T-230-s11
 * for the exception). That function is already this repository's answer
 * to "what is a frontmatter field", the path arm already spends it on
 * `touches:`, and re-parsing the block here would be a second reading
 * able to disagree with it. A key it returns as an ARRAY is a list value
 * and is not a scalar, so it is skipped rather than flattened — a fence
 * entry is the fence arm's claim, not a sentence anybody asserted.
 *
 * **THE VALUE IS READ RAW OFF THE KEY'S OWN LINE, AND THAT IS A
 * DELIBERATE DEPARTURE** (T-230-s11). `frontmatterFields` strips an
 * inline comment by cutting the value at the first space-hash, and it
 * does so WITHOUT KNOWING ABOUT QUOTES — the component registry it was
 * written for carries comments on its `paths:` items and no quoted
 * assertions at all. On a card that rule truncates a title mid-needle:
 * a hash inside a quoted assertion ends the value, the run never closes,
 * and the assertion disappears with no listing, no sighting and no floor
 * count. So the field set stays the parser's and the TEXT is this
 * module's, which is the smallest departure that answers it.
 * **dispatch-brief.mjs IS NOT CHANGED** — the strip is right for the
 * caller that needs it, and this is the caller that cannot afford it.
 * The cost is a genuine trailing comment joining the scanned text, which
 * is the conservative direction and `unwrapScalar`'s own: one extra
 * listed line against an assertion lost in silence.
 *
 * @param {string} cardText
 * @returns {ScalarField[]}
 */
export function frontmatterScalars(cardText) {
  const body = cardBody(cardText);
  const head = cardText.slice(0, cardText.length - body.length);
  if (head === "") return [];
  const lines = head.split(/\r?\n/);
  /** @type {ScalarField[]} */
  const out = [];
  for (const [key, parsed] of Object.entries(frontmatterFields(cardText))) {
    if (typeof parsed !== "string") continue;
    const at = lines.findIndex((l) => l.startsWith(`${key}:`));
    const raw = at === -1 ? null : FRONTMATTER_SCALAR.exec(/** @type {string} */ (lines[at] ?? ""));
    const value = unwrapScalar(raw === null ? parsed : /** @type {string} */ (raw[2]));
    if (value === "") continue;
    out.push({ line: at === -1 ? 0 : at + 1, key, value });
  }
  return out;
}

/**
 * @typedef {object} MarkedClaim
 * @property {number} line
 * @property {string} source  the path the marker names, backticks stripped
 * @property {string} quote   the needle, "" when no quoted run was found
 * @property {string} payload everything after the colon, as written
 */

/**
 * Every CARD CLAIM marker the card's prose carries.
 *
 * @param {string} cardText
 * @returns {MarkedClaim[]}
 */
export function cardClaims(cardText) {
  /** @type {MarkedClaim[]} */
  const out = [];
  for (const { line, text } of cardLines(cardText).lines) {
    const m = CARD_CLAIM.exec(text);
    if (m === null) continue;
    const payload = /** @type {string} */ (m[2]).trim();
    const first = [...payload.matchAll(MARKED_NEEDLE)][0];
    const quote = first === undefined ? "" : (first[1] ?? first[2] ?? first[3] ?? "");
    out.push({
      line,
      source: /** @type {string} */ (m[1]).trim().replace(/^`+|`+$/g, ""),
      quote: collapse(quote),
      payload,
    });
  }
  return out;
}

/**
 * Every line that LOOKS like a marker and is not read as one — a marker
 * inside a fenced or indented block, or one whose punctuation missed.
 *
 * **A SIGHTING IS REPORTED AND NEVER REFUSED ON**, because the same
 * shape is how this marker gets documented, and a guard that refuses its
 * own documentation is a guard somebody turns off. What it removes is
 * the SILENCE: T-160's verdict recorded that a ruling written as a list
 * item is invisible to its reader and the author cannot tell, and that
 * failure is the reason this function exists one card later.
 *
 * **AND THE FRONTMATTER IS THE THIRD PLACE A MARKER CAN HIDE** (T-230-s3).
 * `cardClaims` reads the BODY's prose, so EVERY marker-shaped line in a
 * frontmatter field is unseen by construction — and it was unseen in the
 * worse sense too, since nothing looked there at all and the author was
 * told nothing. It stays a SIGHTING rather than becoming a claim: a
 * frontmatter key is a FIELD with its own owner (`method/tasks/
 * TASK-FORMAT.md`, and it is why `cardBody` strips the block), so a
 * marker there is a request written in the wrong place, which is
 * precisely what a sighting is for.
 *
 * @param {string} cardText
 * @returns {{ line: number, text: string }[]}
 */
export function unseenMarkers(cardText) {
  const body = cardBody(cardText);
  const head = cardText.slice(0, cardText.length - body.length);
  const offset = head.split(/\r?\n/).length - 1;
  const raw = body.split(/\r?\n/);
  const prose = proseOnly(body).split(/\r?\n/);
  /** @type {{ line: number, text: string }[]} */
  const out = [];
  if (head !== "") {
    const headLines = head.split(/\r?\n/);
    for (let i = 0; i < headLines.length; i += 1) {
      const line = /** @type {string} */ (headLines[i] ?? "");
      if (!CARD_CLAIM_LOOSE.test(line)) continue;
      out.push({ line: i + 1, text: collapse(line) });
    }
  }
  for (let i = 0; i < raw.length; i += 1) {
    const line = /** @type {string} */ (raw[i] ?? "");
    if (!CARD_CLAIM_LOOSE.test(line)) continue;
    if (CARD_CLAIM.test(/** @type {string} */ (prose[i] ?? ""))) continue;
    out.push({ line: offset + i + 1, text: collapse(line) });
  }
  return out;
}

/**
 * @typedef {object} LooseQuote
 * @property {number} line
 * @property {string} field the frontmatter key it came from, "" in the body
 * @property {string} text
 * @property {boolean} nearPath a repository path sits in the same unit
 * @property {boolean} belowFloor shorter than `MIN_QUOTE_CHARS`
 */

/**
 * Every quoted run the card did NOT mark, split by whether a repository
 * path sits in the same unit.
 *
 * **THE PARAGRAPH IS THE UNIT AND THE HARD WRAP IS WHY.** A card wrapped
 * at seventy columns puts the quote on one line and the file it is about
 * on the next, so a line-scoped join answers about the typesetting. Both
 * were measured over the live board: paragraph scope names roughly
 * half of all quoted runs, at a per-card median a reader can act on,
 * where the line-scoped join names a fifth of them and drops the ones
 * the wrap split.
 *
 * **IN THE FRONTMATTER THE UNIT IS THE FIELD** (T-230-s3), and that is
 * the same rule rather than a second one: the paragraph is the smallest
 * block that holds one thought, a frontmatter scalar is never wrapped
 * across lines, so the field IS its paragraph. Reading the whole block
 * as one unit would make every card's `touches:` a path beside every
 * card's title, which is a join about the FORMAT and not about the
 * sentence — the exact error the line-scoped body join makes.
 *
 * **AND NOTHING IS DROPPED FOR BEING SHORT ANY MORE.** A run below the
 * floor is FLAGGED rather than discarded, because the class's own report
 * says the unmarked ones are *counted and listed rather than passed
 * over*, and a silent drop made that sentence false. The floor still
 * decides what is LISTED — initials and punctuation samples are not
 * assertions — so what the flag buys is the count.
 *
 * **AND THE UNIT IS FOLDED BEFORE THE NEEDLE IS MATCHED** (T-230-s7).
 * The nearness decision was already the paragraph's while the extraction
 * was still line by line against a class that stopped at the newline, so
 * a quoted run crossing this repository's own hard wrap — the ordinary
 * shape of a quoted acceptance criterion, and the larger blind spot of
 * the two by an order of magnitude — was two half-runs to the extractor
 * and neither of them opened and closed. The paragraph's lines are now
 * joined on a SINGLE SPACE, the way the parser folds a card's own
 * frontmatter title, and the needle is matched over that. A run keeps
 * the line it OPENS on, carried through the fold, so a listing still
 * names a place in the file rather than the top of a paragraph.
 *
 * **A MARKER BREAKS THE FOLD RATHER THAN JOINING IT, AND IT BREAKS IT AT
 * THE NEEDLE RATHER THAN AT THE LINE.** A marker's own needle belongs to
 * the MARKED half, which is why the line was skipped before the fold
 * existed; folding across it would carry a needle the author asked to
 * have CHECKED into the census of what was not, and would also pair
 * quotes on either side of it that no author wrote as a pair. So the
 * lines around a marker are two units — and the boundary between them is
 * where the marker's PAYLOAD ends, because a marker wraps like every
 * other sentence here and its continuation line is not a marker line.
 * `markerEnd` is that boundary and carries the measurement.
 *
 * **A RUN THAT OPENS IN ONE PARAGRAPH AND CLOSES IN ANOTHER STAYS
 * UNSEEN, AND THE CLASS SAYS SO IN WORDS.** A blank line ends the unit.
 * Pairing a quote across one would be a reading of the typesetting
 * rather than of a sentence — the same error the line-scoped join made
 * one size down — so the fold stops where the thought does, and the
 * `cannot` line carries the omission rather than leaving the numbers to
 * read as a closed census.
 *
 * @param {string} cardText
 * @param {PathOracle} oracle
 * @returns {LooseQuote[]}
 */
export function unmarkedQuotes(cardText, oracle) {
  const { lines } = cardLines(cardText);
  /** @type {LooseQuote[]} */
  const out = [];
  /** @param {string} text @returns {boolean} */
  const namesAPath = (text) => {
    for (const m of text.matchAll(REPO_PATH_TOKEN)) {
      const token = /** @type {string} */ (m[1]).replace(/[.,;:)\]}`'"]+$/, "");
      if (oracle.tops.has(/** @type {string} */ (token.split("/")[0]))) return true;
    }
    return false;
  };
  /**
   * Harvest one UNIT. Everything that reaches here is a single line by
   * construction — a folded paragraph, or a frontmatter scalar, which is
   * never wrapped — so the needle is bounded by the unit.
   *
   * @param {string} text
   * @param {string} field
   * @param {boolean} nearPath
   * @param {(index: number) => number} lineOf the FILE line an offset sits on
   */
  const take = (text, field, nearPath, lineOf) => {
    for (const m of text.matchAll(QUOTED_RUN)) {
      const run = collapse(/** @type {string} */ (m[1] ?? m[2] ?? ""));
      out.push({
        line: lineOf(m.index ?? 0),
        field,
        text: run,
        nearPath,
        belowFloor: run.length < MIN_QUOTE_CHARS,
      });
    }
  };
  for (const s of frontmatterScalars(cardText)) {
    take(s.value, s.key, namesAPath(s.value), () => s.line);
  }
  /** @type {CardLine[]} */
  let para = [];
  /** @type {CardLine[]} */
  let unit = [];
  /**
   * Fold the lines gathered so far and read them as ONE. The joiner is a
   * single space and the offsets are kept, so the run that crosses a
   * wrap is one run and still knows the line it opened on.
   *
   * @param {boolean} nearPath
   */
  const fold = (nearPath) => {
    if (unit.length === 0) return;
    let text = "";
    /** @type {{ from: number, line: number }[]} */
    const starts = [];
    for (const l of unit) {
      if (text !== "") text += " ";
      starts.push({ from: text.length, line: l.line });
      text += l.text;
    }
    const head = /** @type {{ from: number, line: number }} */ (starts[0]);
    take(text, "", nearPath, (index) => {
      let line = head.line;
      for (const s of starts) {
        if (s.from > index) break;
        line = s.line;
      }
      return line;
    });
    unit = [];
  };
  const flush = () => {
    if (para.length === 0) return;
    // THE NEARNESS DECISION IS THE WHOLE PARAGRAPH'S, unchanged: a card
    // wrapped at seventy columns puts the quote on one line and the file
    // it is about on the next, and a marker line is part of that reading
    // even though it is not part of any fold.
    const nearPath = namesAPath(para.map((l) => l.text).join("\n"));
    for (let i = 0; i < para.length; i += 1) {
      const l = /** @type {CardLine} */ (para[i]);
      if (!CARD_CLAIM.test(l.text)) {
        unit.push(l);
        continue;
      }
      // THE SEGMENT ENDS AT THE NEEDLE, NOT AT THE LINE. `markerEnd`
      // carries the reason; skipping to it is what keeps a wrapped
      // marker's orphan closing quote out of the next unit.
      fold(nearPath);
      i = markerEnd(para, i);
    }
    fold(nearPath);
    para = [];
  };
  for (const l of lines) {
    if (l.text.trim() === "") {
      flush();
      continue;
    }
    para.push(l);
  }
  flush();
  return out;
}

/**
 * @typedef {object} ClaimVerdict
 * @property {"held" | "false" | "unreadable" | "untracked" | "directory"} state
 * @property {string} detail
 */

/**
 * Does the file the marker names contain the string the marker quotes?
 *
 * **CASE-SENSITIVE, AND THE DIRECTION OF THE ERROR IS THE ARGUMENT.**
 * This repository's capitals are load-bearing — docs/CONVENTIONS.md asks
 * a citation to carry *"its ORDINAL and its own capitals"* — and the
 * founding instance turns on exactly that: the sentence a card claimed a
 * governing document *"ALREADY SAYS"* is today in that document in a
 * different voice, so a case-folded matcher would report HELD for a
 * document that says something else. A case difference is a real
 * discrepancy, it is dischargeable by a dated ruling on the card, and
 * the alternative error is silent. The case-insensitive answer is
 * reported in the DETAIL, so the author is told which of the two they
 * are looking at rather than left to search.
 *
 * @param {string} root
 * @param {PathOracle} oracle
 * @param {MarkedClaim} claim
 * @returns {ClaimVerdict}
 */
export function checkClaim(root, oracle, claim) {
  if (claim.quote === "") {
    return {
      state: "unreadable",
      detail:
        "the marker carries no quoted string, so there is no needle to look for. A check the " +
        "author asked for and nobody could read is not a check that passed.",
    };
  }
  const rel = claim.source.replace(/^\.\//, "").replace(/\/+$/, "");
  if (!oracle.tracked.has(rel)) {
    if (oracle.dirs.has(rel)) {
      return {
        state: "directory",
        detail: "the source names a directory, and a directory holds no string to be quoted from.",
      };
    }
    return {
      state: "untracked",
      detail:
        "no tracked file sits at that path at HEAD, so the source this claim rests on cannot be " +
        "opened. An untracked source is not a file whose contents this checkout can vouch for.",
    };
  }
  let haystack;
  try {
    haystack = readFileSync(path.join(root, rel), "utf8");
  } catch (err) {
    throw new CardPreflightError(
      `card-preflight: ${rel} is tracked at HEAD and could not be read — ` +
        `${err instanceof Error ? err.message : String(err)}. This run is not a claim about the ` +
        "card; it is a claim about this checkout.",
    );
  }
  const flat = collapse(haystack);
  if (flat.includes(claim.quote)) {
    return { state: "held", detail: `the named file contains it at HEAD, whitespace collapsed.` };
  }
  const folded = flat.toLowerCase().includes(claim.quote.toLowerCase());
  return {
    state: "false",
    detail: folded
      ? "the named file does not contain it as written — a case-insensitive search DOES find it, " +
        "so the capitals are the discrepancy. Quote the document's own capitals, or rule the " +
        "difference on the card."
      : "the named file does not contain it at HEAD, whitespace collapsed on both sides. Only " +
        "that ONE file was opened: a string that lives somewhere else in the tree is exactly the " +
        "near miss this arm exists to catch.",
  };
}

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
  // T-160's VERDICT, correction 3: a bare substring over-discharged —
  // a ruling naming `event-names.ts.map` discharged the finding about
  // `event-names.ts`, and `T-153` inside `T-153-s5` is the same trap
  // on ids. The subject must end at a boundary: the character after
  // the match may not extend the token (word chars, dot, hyphen, or
  // slash all keep it going).
  /** @param {string} text @param {number} idx @returns {boolean} */
  const boundaryOk = (text, idx) => {
    const i = idx + subject.length;
    const after = text[i];
    if (after === undefined) return true;
    if (/[\w\-/]/.test(after)) return false;
    // A dot extends the token only when a word character follows it —
    // `.map` extends, a sentence-ending period does not.
    const afterDot = text[i + 1];
    if (after === "." && afterDot !== undefined && /\w/.test(afterDot)) return false;
    return true;
  };
  return ruled.find((r) => {
    let from = 0;
    for (;;) {
      const idx = r.text.indexOf(subject, from);
      if (idx === -1) return false;
      if (boundaryOk(r.text, idx)) return true;
      from = idx + 1;
    }
  });
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
    // A CARD THE SCHEDULE DOES NOT DRAW CANNOT BE PREFLIGHTED, AND THIS
    // REFUSAL NAMES THE REASON RATHER THAN THE SYMPTOM. The board's
    // schedule draws the statuses it draws — an untriaged `suggested`
    // finding is not a dispatch candidate — and this command takes its
    // fence and its blocker verdict from that ruling rather than
    // re-spelling either (T-057). Answering 3 is the point: "I could not
    // check this card" and "this card's claims hold" are different
    // sentences and must never share a number.
    throw new CardPreflightError(
      `card-preflight: the parser's dispatch order carries no ruling for ${card.id}, whose status ` +
        `is ${JSON.stringify(fieldScalar(card.fields, "status"))} — the schedule draws dispatch ` +
        "candidates, so a card outside that set has no expanded fence and no blocker verdict here. " +
        "Both are the parser's own and this module will not re-spell either (T-057). Preflight the " +
        "card when it is a dispatch candidate; until then this run is a claim about the command " +
        "and not about the card.",
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

  /* ── CLASS SIX — the quoted claims (T-230) ──────────────────────── */
  recs.push(
    note("CLAIM CLASS quotes — every MARKED quote, read against the one file the card names"),
  );
  /* EVERY DISPLAY SITE IN THIS ARM ESCAPES THE AUTHOR'S OWN STRING, AND
   * EVERY `raise()` SUBJECT STAYS RAW (T-230-s9). A source, a needle and
   * a sighting's line text are all strings the CARD wrote: they can carry
   * a space, a stray quote or a trailing character that runs into the
   * sentence around them, and the line is what a dispatcher decides on.
   * The SUBJECT is the one member of the class that must not be escaped —
   * `dischargedBy` matches a dated ruling against exactly that string, and
   * a ruling is written in the published form, so wrapping it would stop
   * every such ruling discharging, silently and in the direction that
   * RE-OPENS what a seat already ruled on. */
  const viaQuotes = `${card.file}, its CARD CLAIM markers, against the named file at HEAD`;
  const marked = cardClaims(cardText).map((claim) => ({
    claim,
    verdict: checkClaim(ctx.root, oracle, claim),
  }));
  const heldClaimsList = marked.filter((m) => m.verdict.state === "held");
  const falseClaims = marked.filter((m) => m.verdict.state === "false");
  const uncheckable = marked.filter(
    (m) => m.verdict.state !== "held" && m.verdict.state !== "false",
  );
  recs.push(
    value(`marked claims: ${marked.length}`, tree(ctx, viaQuotes)),
    value(`  CHECKED and HELD: ${heldClaimsList.length}`, tree(ctx, viaQuotes)),
    value(`  CHECKED and FALSE: ${falseClaims.length}`, tree(ctx, viaQuotes)),
    value(`  NOT CHECKABLE: ${uncheckable.length}`, tree(ctx, viaQuotes)),
    note("  THREE COUNTS AND NEVER ONE. A census that adds what it checked to what it could not"),
    note("  check reports coverage it does not have, which is the defect this project has already"),
    note("  paid for twice — and a sum would hide the whole of what this arm cannot reach."),
  );
  for (const m of heldClaimsList) {
    recs.push(
      value(
        `CHECKED and HELD line ${m.claim.line}: ${JSON.stringify(m.claim.source)} contains ` +
          `${JSON.stringify(m.claim.quote)}`,
        tree(ctx, viaQuotes),
      ),
    );
  }
  for (const m of falseClaims) {
    recs.push(
      value(
        `QUOTED CLAIM NOT IN FILE line ${m.claim.line}: ${JSON.stringify(m.claim.source)} does ` +
          `not contain ${JSON.stringify(m.claim.quote)}`,
        tree(ctx, viaQuotes),
      ),
      note(`  ${m.verdict.detail}`),
    );
    raise(
      // RAW, and the comment above says why: this is the SUBJECT.
      m.claim.quote,
      `QUOTED CLAIM NOT IN FILE at ${card.file} line ${m.claim.line}: the card marks ` +
        `${JSON.stringify(m.claim.quote)} as a quote from ${JSON.stringify(m.claim.source)}, ` +
        `and ${m.verdict.detail}`,
    );
  }
  for (const m of uncheckable) {
    recs.push(
      value(
        `NOT CHECKABLE line ${m.claim.line}: ${m.verdict.state} source ` +
          // ESCAPED, THE WAY THE FINDING BESIDE IT ALREADY IS. The
          // source is a string the CARD wrote: it can carry spaces, be
          // empty, or end in a character that eats the boundary, and
          // bare interpolation hands the reader a line where the value
          // and the sentence around it cannot be told apart.
          `${JSON.stringify(m.claim.source)}`,
        tree(ctx, viaQuotes),
      ),
      note(`  ${m.verdict.detail}`),
    );
    raise(
      m.claim.source === "" ? m.claim.payload : m.claim.source,
      `UNCHECKABLE CARD CLAIM at ${card.file} line ${m.claim.line}: the marker names ` +
        `${JSON.stringify(m.claim.source)} and ${m.verdict.detail} A marker is a REQUEST for a ` +
        "check, so one nobody can evaluate is counted NOT CHECKABLE and refuses as well — the " +
        "alternative is a card that asks to be checked, is not, and reads as though it were.",
    );
  }
  for (const s of unseenMarkers(cardText)) {
    recs.push(
      value(
        `marker-shaped line the prose reader does not see, line ${s.line}: ` +
          `${JSON.stringify(s.text)}`,
        tree(ctx, `${card.file}, its raw body against its prose reading`),
      ),
      note("  an example in a block reads as an example and is not a claim, and a marker written"),
      note("  into a frontmatter field is a request in the wrong place; a marker meant as a claim"),
      note("  has to be a plain body line. Reported rather than refused on, because this is also"),
      note("  exactly how the marker gets documented."),
    );
  }
  const loose = unmarkedQuotes(cardText, oracle);
  const viaLoose = `${card.file} prose and frontmatter scalars, unit-scoped against git ls-files`;
  const listed = loose.filter((q) => !q.belowFloor);
  const short = loose.filter((q) => q.belowFloor);
  const besidePath = listed.filter((q) => q.nearPath);
  const noSource = listed.filter((q) => !q.nearPath);
  /** @param {LooseQuote} q @returns {string} */
  const where = (q) => (q.field === "" ? `line ${q.line}` : `frontmatter ${q.field}, line ${q.line}`);
  recs.push(
    value(
      `quoted and NOT marked, beside a path this card names: ${besidePath.length}`,
      tree(ctx, viaLoose),
    ),
    value(`quoted and NOT marked, naming no source at all: ${noSource.length}`, tree(ctx, viaLoose)),
    value(`below the quote floor: ${short.length}`, tree(ctx, viaLoose)),
  );
  for (const q of besidePath) {
    recs.push(
      value(
        `NOT CHECKED, a path is named nearby, ${where(q)}: ${JSON.stringify(clip(q.text))}`,
        tree(ctx, viaLoose),
      ),
    );
  }
  for (const q of noSource) {
    recs.push(
      value(
        `NOT CHECKED, no source named, ${where(q)}: ${JSON.stringify(clip(q.text))}`,
        tree(ctx, viaLoose),
      ),
    );
  }
  recs.push(
    note("  EVERY UNMARKED QUOTE IS LISTED AND NONE OF THEM IS REFUSED ON. The first set could"),
    note("  have named a source and did not: mark it and this arm will settle it. The second set"),
    note("  names none, and some of it never could — an assertion about a platform, a version or"),
    note("  a runtime is not a string in a file, and the honest answer for that class is the"),
    note("  verifier's phase-one ground truth rather than a scanner pretending to settle it."),
    note("  This list carries quotations as well as assertions and does not separate them, which"),
    note("  is the prose parsing the cheap shape was chosen to avoid."),
    note("  A RUN IN A FRONTMATTER FIELD IS NAMED BY ITS FIELD AND CANNOT BE MARKED AWAY: the"),
    note("  marker is read from the body's prose, so the repair for one of these is to move the"),
    note("  sentence into the body and mark it there, never to mark the field."),
    note("  AND THE RUNS BELOW THE FLOOR ARE COUNTED RATHER THAN DROPPED. The floor decides what"),
    note("  is LISTED — initials and punctuation samples are not assertions — and a run discarded"),
    note("  without a number would make this class's own counted-and-listed sentence false."),
    blank(),
  );

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
