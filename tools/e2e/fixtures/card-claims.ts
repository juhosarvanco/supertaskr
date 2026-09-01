/**
 * THE THREE DATED INSTANCES T-230 WAS FILED OVER, AS FIXTURES.
 *
 * On 2026-09-01 four cards were dispatched in one sitting. Three carried
 * a false assertion about this repository and all four preflights ran
 * GREEN, because `brief.mjs --preflight` re-derived every card's
 * STRUCTURE and nothing at all about its SENTENCES. The card's fourth
 * acceptance criterion is that those three become fixtures: *"Each is a
 * real, dated, reproducible false assertion, and a checker that cannot
 * catch the cases that motivated it has not been measured."*
 *
 * ── THE THIRD ONE IS NOT CAUGHT, AND THAT IS THE MEASUREMENT ─────────
 * Two of the three are string claims about a tracked file and the
 * checker settles them. The third is a claim about a PLATFORM, and the
 * card rules that class out by name one section up: *"A claim about a
 * platform's behaviour is not, and the honest answer for that class is
 * to route it to the verifier's phase-1 ground truth rather than pretend
 * a scanner can settle it."* So its fixture asserts the honest
 * disposition — REPORTED, counted apart from what was checked, never
 * passed over in silence — and a checker that quietly counted it as
 * sound would be the census defect the second criterion names.
 *
 * ── WHY THE CONTENT IS PLANTED AND THE PATHS ARE MOSTLY REAL ─────────
 * `card-preflight.spec.ts`'s own rule is that no body reads a live card,
 * because the live board churns and a body about the PREFLIGHT would
 * then red naming a card nobody touched. Each instance therefore carries
 * the bytes its source file holds IN THE FIXTURE TREE. Two of the paths
 * are the real ones, since planting content at them inside a temporary
 * repository pins nothing here.
 *
 * The one that moves is the second: its real source is
 * `docs/CONVENTIONS.md`, which the fixture repository copies from this
 * one because `context()` reads the lane spellings out of it. Overwriting
 * that copy would break the fixture world, and asserting against the live
 * document would pin a governing document that is edited nightly — the
 * exact churn the spec's founding rule refuses. So the second instance
 * names a governing document of its own, and keeps everything else: a
 * card claiming a document ALREADY SAYS a sentence the document does not
 * carry.
 */

/** What the preflight owes an instance. */
export type Disposition = "REFUSED" | "REPORTED";

export interface DatedInstance {
  /** The card the false assertion was measured on. */
  readonly card: string;
  /** When it was measured. */
  readonly date: string;
  /** The assertion, in the words T-230's own table gives it. */
  readonly assertion: string;
  /** The measurement that refuted it. */
  readonly measurement: string;
  /** The tracked file the claim rests on, "" where it rests on none. */
  readonly source: string;
  /** The bytes that file holds in the fixture tree, "" where there is no file. */
  readonly sourceText: string;
  /** The marker a card writes to ask for the check, "" where none can be written. */
  readonly marker: string;
  /** The sentence as a card writes it when it cannot be marked. */
  readonly prose: string;
  /** What this preflight owes it. */
  readonly disposition: Disposition;
  /** The string a body looks for in the answer. */
  readonly needle: string;
}

/**
 * A frozen flag list, in the shape the real one has: a card claiming a
 * flag exists is claiming a string is in this file, and an unknown flag
 * exits before it reaches anything.
 */
const FROZEN_FLAGS = [
  "const FLAGS = Object.freeze([",
  '  "--task",',
  '  "--state",',
  '  "--dispatch",',
  '  "--card",',
  '  "--audit",',
  '  "--preflight",',
  '  "--write-fence",',
  '  "--root",',
  '  "--help",',
  "]);",
  "",
  "// An argument outside that list is a usage error and exits two: the",
  "// list is the whole vocabulary, so a flag absent from it is absent",
  "// from the command.",
  "",
].join("\n");

/**
 * A governing document that does NOT carry the sentence the second
 * instance claims it already carries. It says a neighbouring thing, which
 * is what makes the instance faithful: the card's author had read the
 * document and remembered a rule it did not state.
 */
const GOVERNING = [
  "# The governing document",
  "",
  "## Gotchas",
  "",
  "- READ A SCRIPTED EDIT BACK BEFORE YOU BUILD ON IT. A substitution",
  "  count is not a diff, and a count that is right over text that is",
  "  wrong is the shape this rule was earned on.",
  "",
  "- A GATE READ THROUGH A PIPE REPORTS THE PIPE, so a hard failure reads",
  "  as a clean pass. Redirect to a file, capture the status, then look.",
  "",
].join("\n");

/**
 * THE SAME DOCUMENT ONCE THE RULE LANDED — IN ITS OWN CAPITALS.
 *
 * The second instance is not the absence it was filed as, and the
 * dispatching seat corrected its own audit note before this lane
 * finished: the sentence T-203 claimed the document ALREADY SAID is in
 * that document today, as a heading, in capitals. Case-sensitively a
 * search reads zero; case-folded it reads one. So the instance is a CASE
 * POLICY question rather than an absence, and both readings are wrong to
 * leave silent — the first would report a discrepancy with no clue what
 * it was, and the second would report HELD for a document saying it in a
 * different voice.
 */
const GOVERNING_TODAY = [
  GOVERNING.trimEnd(),
  "",
  "- AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP: never chain a commit",
  "  after a scripted edit, read the diff back first.",
  "",
].join("\n");

/**
 * The three, in the order T-230's table gives them.
 *
 * The first two are marked, so the checker settles them and REFUSES. The
 * third is unmarked because nothing could mark it — there is no file
 * whose bytes decide what a platform does — so it is REPORTED under the
 * count of quotes that name no source at all.
 */
export const DATED_INSTANCES: readonly DatedInstance[] = Object.freeze([
  Object.freeze({
    card: "T-211",
    date: "2026-09-01",
    assertion: "T-209's intersection is reachable as an --intersect flag",
    measurement: "the command freezes its flag list; no such flag. An unknown flag exits 2.",
    source: "tools/e2e/scripts/brief.mjs",
    sourceText: FROZEN_FLAGS,
    marker: "CARD CLAIM (tools/e2e/scripts/brief.mjs): `--intersect`",
    prose: "The intersection is reachable as `--intersect`, which the command already carries.",
    disposition: "REFUSED",
    needle: "--intersect",
  }),
  Object.freeze({
    card: "T-203",
    date: "2026-09-01",
    assertion: "the governing document ALREADY SAYS an edit script's success is a GATE",
    measurement:
      "zero occurrences AS WRITTEN, at base and at tip - and one case-folded, which the card was " +
      "dispatched not saying. See T203_CASE below: the instance is a case policy, not an absence.",
    source: "docs/GOVERNING.md",
    sourceText: GOVERNING,
    marker: 'CARD CLAIM (docs/GOVERNING.md): "an edit script\'s success is a GATE"',
    prose: 'The document ALREADY SAYS IT: "an edit script\'s success is a GATE".',
    disposition: "REFUSED",
    needle: "an edit script's success is a GATE",
  }),
  Object.freeze({
    card: "T-210",
    date: "2026-09-01",
    assertion: 'the design "EACCES-fails the checkpoint sync"',
    measurement:
      "at git 2.50.1 it does not - git unlinks and recreates, and the file returns at umask default",
    source: "",
    sourceText: "",
    marker: "",
    prose: 'The design "EACCES-fails the checkpoint sync", so the sync has to be reordered.',
    disposition: "REPORTED",
    needle: "EACCES-fails the checkpoint sync",
  }),
]);

/**
 * THE SECOND INSTANCE AS IT ACTUALLY STANDS, WHICH IS THE CASE NEAR MISS.
 *
 * The card was dispatched saying the T-203 quote is absent from the
 * governing document, and the dispatching seat corrected that from the
 * integration branch while this lane built: the sentence is there, in
 * capitals, so `grep -c` reads zero and `grep -ic` reads one. The
 * decision this fixture carries is the one the checker makes — MATCH
 * CASE-SENSITIVELY, and REPORT the folded answer in the finding's detail
 * — and the argument is that the capitals are load-bearing here. A card
 * claiming a document "already says" a sentence has claimed something
 * about what the document says; a heading in capitals and a lowercase
 * rule in running prose are not the same claim, and a folded matcher
 * would call them one. The error a case-sensitive matcher makes is
 * VISIBLE and dischargeable by a dated ruling on the card; the error a
 * folded one makes is silent, which is the whole failure this card
 * exists to end.
 *
 * THE FIXTURE PLANTS IT RATHER THAN POINTING AT THE LIVE DOCUMENT, and
 * that is the same correction's other half: the spec's fixture helper
 * copies the LIVE governing document into every fixture repository, so a
 * body written against it would pass or fail with tonight's edits rather
 * than with the case it means to pin.
 */
export const T203_CASE = Object.freeze({
  source: "docs/GOVERNING.md",
  /** The document carrying the sentence in ITS OWN capitals. */
  sourceText: GOVERNING_TODAY,
  /** The sentence as the card quoted it. */
  quote: "an edit script's success is a GATE",
  marker: 'CARD CLAIM (docs/GOVERNING.md): "an edit script\'s success is a GATE"',
  /** The same sentence in the document's own capitals, which HOLDS. */
  asWritten: "AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP",
  markerAsWritten:
    'CARD CLAIM (docs/GOVERNING.md): "AN EDIT SCRIPT\'S SUCCESS IS A GATE, NOT A STEP"',
});

/**
 * THE NEAR MISS — a TRUE quote under the WRONG file name.
 *
 * The card's fifth criterion asks for it by name: *"a card whose quoted
 * claim is true but whose NAMED FILE is wrong — the near-miss that a
 * substring search over the whole tree would pass and a file-scoped one
 * would catch."* Both files below are planted and both are real files in
 * the fixture tree; the string is in the FIRST and the marker names the
 * SECOND, so the only thing separating a pass from a finding is whether
 * the checker opened one file or searched the tree.
 */
export const NEAR_MISS = Object.freeze({
  /** The file that really holds the sentence. */
  holder: "docs/GOVERNING.md",
  /** The file the card names instead, which is real and does not hold it. */
  named: "docs/NOT-THE-HOLDER.md",
  namedText: [
    "# A second governing document",
    "",
    "It exists, it is tracked, and it says nothing about scripted edits.",
    "",
  ].join("\n"),
  holderText: GOVERNING,
  /** True of the holder, false of the named file. */
  quote: "A GATE READ THROUGH A PIPE REPORTS THE PIPE",
  marker: 'CARD CLAIM (docs/NOT-THE-HOLDER.md): "A GATE READ THROUGH A PIPE REPORTS THE PIPE"',
  /** The same claim, correctly sourced — the positive control beside it. */
  correctMarker: 'CARD CLAIM (docs/GOVERNING.md): "A GATE READ THROUGH A PIPE REPORTS THE PIPE"',
});

/**
 * A TRUE marked claim, for the positive control the third criterion
 * demands: the check has to still PASS a card whose quoted claim is
 * true, or a validator that flags every card is indistinguishable from
 * one that works.
 *
 * It quotes across a HARD WRAP on purpose. The sentence sits on two
 * lines in the file and on one line in the card, which is how every
 * quotation from a document in this repository is written, and a matcher
 * that did not collapse whitespace would refuse it.
 */
export const TRUE_CLAIM = Object.freeze({
  source: "docs/GOVERNING.md",
  sourceText: GOVERNING,
  quote: "A substitution count is not a diff",
  marker: 'CARD CLAIM (docs/GOVERNING.md): "A substitution count is not a diff"',
});
