/**
 * SESSION ECONOMICS (T-157) — THE RECOMMENDED SEAT, derived from the
 * card and from nothing else.
 *
 * ADR-020 adopted the habit of measuring what a session costs. Its
 * companion card asks the dispatch brief to carry a recommended-model
 * line "derived from the card's own `size:` and kind — the know-vs-try
 * heuristic made mechanical". This module is that derivation;
 * `brief.mjs` prints it under the contract rows.
 *
 * ── THREE THINGS IT IS NOT, EACH FOR A RECORDED REASON ───────────────
 *
 * 1. IT IS NOT A CONTRACT ROW. `method/roles/executor.md`'s table is
 *    normative — "a change here is a method version bump" — so this
 *    line is printed BELOW the rows, labelled advisory, and never
 *    enters `DERIVERS`. dispatch-brief.mjs reports "a deriver whose row
 *    the table no longer carries" as a finding, and it is right to: a
 *    second row set is the defect the row set is read to avoid. A line
 *    that wants to be a row asks the method for one.
 *
 * 2. IT NAMES NO MODEL. ADR-003 settles that this project never passes
 *    `--model` — the operator's own CLI default IS the model — and the
 *    dispatch technical plan's D5 (`model@session`) is DELIBERATELY
 *    HELD pending a north-star question. A tool that printed a vendor's
 *    model name would answer a question this project has ruled it will
 *    not answer yet, and would rot on the day the operator changed
 *    harnesses. So the recommendation is a SEAT STRENGTH — reach for
 *    the strongest seat available, or a standard one is sufficient —
 *    and the mapping from that to a binary belongs to whoever runs the
 *    CLI.
 *
 * 3. IT IS NOT AUTHORITY, IN TWO DIRECTIONS. The card's `builder:`
 *    field wins over it (the D3 ruling of 2026-08-20: the app may write
 *    exactly `builder:` and `verifier:`, because the card is the only
 *    channel that reaches an agent on another machine), and the role
 *    file's own run-hygiene text wins over it too. Where that text
 *    exists this module QUOTES it above its own verdict; where it does
 *    not, it says so in as many words rather than letting silence read
 *    as agreement. T-157's third criterion is exactly that ordering.
 *
 * ── HOW THE SIGNALS COMBINE, AND WHY IT IS A MAJORITY ───────────────
 * KNOW needs a MAJORITY of the signals; a tie goes to TRY. The tie-break
 * is the asymmetry and it is the whole of the asymmetry: an
 * under-powered session that needed exploration is paid for in a
 * rejection arc — a second build pass AND a second verification, four
 * seats where two were budgeted — while an over-powered session on known
 * work costs one lane's tokens once. The two errors are not the same
 * size, so an even split goes to the one that is cheaper to be wrong
 * about.
 *
 * THE FIRST DRAFT WAS STRICTER AND THE BOARD SAID SO. It answered TRY
 * unless EVERY signal said KNOW, which is the same argument taken one
 * step further — and measured against every live card at `88890d0` it
 * answered TRY for 311 of 324, against 257 of 324 for the majority rule
 * (the split by TRY-signal count: 13 / 54 / 69 / 188). A recommendation
 * that says "the strongest seat" to almost every card is not
 * conservative, it is uninformative, and an advisory line nobody can
 * act on differently is one nobody reads. Re-measure that spread before
 * moving this rule; the numbers above are a function of a board and go
 * stale the way any figure does.
 *
 * ── PROVENANCE, AND ONE DELIBERATE OMISSION ─────────────────────────
 * Every citation below names a ruling by its id and never by its path.
 * That is not laziness about paths: docs-scan.mjs derives the DOCS
 * GATE's reader set from docs-shaped literals in the source corpus, so
 * a `docs/…` string written here purely to CITE a decision would enrol
 * this file as a READER of that directory and make the gate fire on
 * documents nothing here opens. A citation is not a read, and the
 * census should not be told otherwise.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ceremonyRows,
  expandFenceEntry,
  fieldList,
  fieldScalar,
  note,
  taskFormatText,
  treeProv,
  value,
} from "./dispatch-brief.mjs";

/** The two arms of the know-vs-try heuristic. Closed vocabulary. */
export const KNOW = "KNOW";
export const TRY = "TRY";

/**
 * WHAT EACH ARM RECOMMENDS, as named constants rather than as a ternary
 * inside the renderer.
 *
 * They are constants because of a drill. A mutant that pushed a vendor's
 * model name into the TRY phrase SURVIVED the body written to forbid
 * exactly that: the body read the recommendation off a live card, that
 * card is a KNOW card, and the TRY branch it never rendered was never
 * inspected. The rule an ADR states about EVERY recommendation cannot be
 * checked through whichever branch today's board happens to take. Here
 * the whole vocabulary is one value, and a body can assert over all of
 * it at once.
 */
export const SEAT_PHRASE = Object.freeze({
  [TRY]: "the STRONGEST seat available to this operator",
  [KNOW]: "a STANDARD seat is sufficient",
});

/**
 * The document that owns the EARS patterns. READ, never transcribed:
 * the five patterns live in one place and a sixth added there is
 * honoured here with no edit — and a renamed step is a throw by name
 * rather than an empty keyword set that calls every criterion
 * malformed.
 */
export const DECOMPOSITION_FILE = "method/interview/decomposition.md";

/** The phrase that locates the EARS step. A locator, not a summary. */
export const EARS_ANCHOR = "EARS notation";

/**
 * The heading word that locates a role file's run-hygiene text. It is a
 * WORD rather than a whole heading because the method has not written
 * that section yet (it rides the next method bump), and a locator that
 * only matches a heading nobody has typed would report "absent" forever
 * after the text lands.
 */
export const HYGIENE_WORD = "hygiene";

/**
 * The five EARS keywords, read off the decomposition step's own bullets.
 *
 * @param {string} md `method/interview/decomposition.md`
 * @returns {string[]}
 */
export function earsKeywords(md) {
  const lines = md.split(/\r?\n/);
  const at = lines.findIndex((l) => l.includes(EARS_ANCHOR));
  if (at < 0) {
    throw new Error(
      `session-economics: ${DECOMPOSITION_FILE} no longer names ${JSON.stringify(EARS_ANCHOR)} — ` +
        "this module reads the criterion patterns rather than restating them, so a moved step is " +
        "a hard failure and never an empty pattern set.",
    );
  }
  /** @type {string[]} */
  const out = [];
  for (let i = at + 1; i < lines.length; i += 1) {
    const m = /^\s*-\s+[^:]+:\s+([A-Z][A-Z]+)\b/.exec(/** @type {string} */ (lines[i]));
    if (m === null) {
      if (out.length > 0) break;
      continue;
    }
    out.push(/** @type {string} */ (m[1]));
  }
  if (out.length === 0) {
    throw new Error(
      `session-economics: ${DECOMPOSITION_FILE} names ${JSON.stringify(EARS_ANCHOR)} but the step ` +
        "below it carries no `- Label: KEYWORD …` pattern bullets — a keyword set that silently " +
        "became empty would call every acceptance criterion malformed.",
    );
  }
  return out;
}

/**
 * A `## ` section's body, or null where the card has no such section.
 *
 * dispatch-brief.mjs's `section()` THROWS on a missing heading, which is
 * right for the documents it quotes — a renamed contract heading is a
 * hard failure. It is wrong here: a card with no acceptance criteria is
 * an ordinary (and very informative) reading of a card, and it must
 * arrive as a SIGNAL rather than as a crash.
 *
 * @param {string} md
 * @param {string} heading
 * @returns {string | null}
 */
export function optionalSection(md, heading) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) return null;
  /** @type {string[]} */
  const held = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (/^#{1,2} /.test(line)) break;
    held.push(line);
  }
  return held.join("\n").trim();
}

/** The heading the task format gives the criteria section. */
export const CRITERIA_HEADING = "## Acceptance criteria";

/**
 * The card's acceptance criteria, one collapsed string each.
 *
 * @param {string} cardText
 * @returns {string[]}
 */
export function acceptanceCriteria(cardText) {
  const sec = optionalSection(cardText, CRITERIA_HEADING);
  if (sec === null) return [];
  return sec
    .split(/\n(?=\s*- )/)
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter((b) => b.startsWith("- "))
    .map((b) => b.slice(2).trim())
    .filter((b) => b !== "");
}

/**
 * Is one criterion EARS-shaped? It opens with one of the patterns'
 * keywords AND carries `SHALL`, which every one of the five patterns
 * does. Both halves are required: an opening `IF` with no `SHALL` is a
 * sentence about a condition, not a requirement, and `SHALL` buried in
 * free prose is not a pattern.
 *
 * @param {string} criterion
 * @param {string[]} keywords
 * @returns {boolean}
 */
export function isEars(criterion, keywords) {
  const stripped = criterion.replace(/[*_`]/g, "").trim();
  const first = /^([A-Z]+)\b/.exec(stripped);
  if (first === null) return false;
  if (!keywords.includes(/** @type {string} */ (first[1]))) return false;
  return /\bSHALL\b/.test(stripped);
}

/**
 * The LIGHTEST ceremony tier, read off the ceremony table's first row.
 *
 * THE ORDER IS THE CLAIM, and it is stated rather than assumed silently:
 * the table is written lightest-first — its own closing sentence is
 * "the default path must feel lighter than not using the system" — so
 * its first row names the tier that buys the least ceremony. A table
 * reordered without that intent would change this line's meaning, which
 * is why the limit is printed with the signal rather than buried here.
 *
 * @param {string} taskFormatMd
 * @returns {string}
 */
export function lightestTier(taskFormatMd) {
  const rows = ceremonyRows(taskFormatMd);
  const first = /** @type {{ size: string }} */ (rows[0]).size;
  const letter = /^\s*([A-Za-z]+)/.exec(first);
  if (letter === null) {
    throw new Error(
      `session-economics: the ceremony table's first row is headed ${JSON.stringify(first)}, ` +
        "which names no tier — the lightest tier is read from that row rather than typed here.",
    );
  }
  return /** @type {string} */ (letter[1]);
}

/**
 * The closed arm vocabulary, as a type: a verdict is one of two words
 * and never an arbitrary string, so `SEAT_PHRASE[verdict]` is a total
 * lookup rather than a hope.
 *
 * @typedef {"KNOW" | "TRY"} SeatArm
 */

/**
 * @typedef {object} Signal
 * @property {string} id
 * @property {SeatArm} verdict
 * @property {string} detail   what was read, in the reader's own words
 */

/**
 * @typedef {object} SeatVerdict
 * @property {SeatArm} verdict
 * @property {Signal[]} signals
 * @property {number} tries
 */

/**
 * THE HEURISTIC. Every input is a fact about the CARD; nothing here
 * reads an environment variable, a config file or a session dial, and
 * the spec beside this file drives that both ways — absurd model-shaped
 * environment leaves the verdict untouched, and a changed card moves it.
 *
 * @param {object} inputs
 * @param {string} inputs.size          the card's `size:`
 * @param {string} inputs.lightest      the ceremony table's lightest tier
 * @param {{ entry: string, kind: string, paths: string[] }[]} inputs.fence
 * @param {string[]} inputs.criteria
 * @param {string[]} inputs.keywords
 * @returns {SeatVerdict}
 */
export function seatVerdict({ size, lightest, fence, criteria, keywords }) {
  /** @type {Signal[]} */
  const signals = [];

  signals.push({
    id: "size",
    verdict: size === lightest ? KNOW : TRY,
    detail:
      size === ""
        ? "the card states no size, so its ceremony is unknown"
        : `size ${size} against the lightest ceremony tier ${lightest}`,
  });

  const slugEntries = fence.filter((f) => f.kind === "slug");
  signals.push({
    id: "fence",
    verdict: fence.length > 0 && slugEntries.length === 0 ? KNOW : TRY,
    detail:
      fence.length === 0
        ? "the card fences nothing, so its blast radius is unbounded by the card"
        : `${fence.length} fence entr${fence.length === 1 ? "y" : "ies"} of which ` +
          `${slugEntries.length} name a component SLUG, expanding to ` +
          `${new Set(fence.flatMap((f) => f.paths)).size} path(s) in all`,
  });

  const ears = criteria.filter((c) => isEars(c, keywords));
  signals.push({
    id: "criteria",
    verdict: criteria.length > 0 && ears.length === criteria.length ? KNOW : TRY,
    detail:
      criteria.length === 0
        ? "the card carries no acceptance criteria, so there is nothing to build against"
        : `${ears.length} of ${criteria.length} acceptance criteria are EARS-shaped`,
  });

  const tries = signals.filter((s) => s.verdict === TRY).length;
  // A MAJORITY of KNOWs, with the tie going to TRY. Written as
  // `knows > tries` rather than as a threshold so it holds for any
  // number of signals a later card adds — a fourth signal would turn a
  // hardcoded `tries <= 1` into a silent change of rule.
  const knows = signals.length - tries;
  return { verdict: knows > tries ? KNOW : TRY, signals, tries };
}

/**
 * The role file's run-hygiene text, where it carries any.
 *
 * @param {string} roleMd
 * @returns {{ heading: string, body: string } | null}
 */
export function hygieneSection(roleMd) {
  const lines = roleMd.split(/\r?\n/);
  const at = lines.findIndex(
    (l) => /^#{2,3} /.test(l) && l.toLowerCase().includes(HYGIENE_WORD),
  );
  if (at < 0) return null;
  const heading = /** @type {string} */ (lines[at]).replace(/^#+\s*/, "").trim();
  /** @type {string[]} */
  const held = [];
  for (let i = at + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (/^#{1,3} /.test(line)) break;
    held.push(line);
  }
  return { heading, body: held.join("\n").replace(/\s+/g, " ").trim() };
}

/**
 * THE ADVISORY BLOCK, as records. Records rather than strings for the
 * reason dispatch-brief.mjs gives: a `value` without a provenance throws
 * at render and a `note` may not carry a digit, so no figure leaves this
 * module unstamped.
 *
 * @param {import("./dispatch-brief.mjs").Ctx} ctx
 * @returns {import("./dispatch-brief.mjs").Rec[]}
 */
export function seatRecs(ctx) {
  if (ctx.card === undefined) {
    throw new Error(
      "session-economics: the recommended seat is derived FROM A CARD, and this context holds " +
        "none — the caller asks for it only under --task.",
    );
  }
  const card = ctx.card;
  const cardText = readFileSync(path.join(ctx.root, card.file), "utf8");
  const size = fieldScalar(card.fields, "size");
  const builder = fieldScalar(card.fields, "builder");
  const entries = fieldList(card.fields, "touches");
  const fence = entries.map((e) => expandFenceEntry(e, ctx.slugs, ctx.comps));
  const keywords = earsKeywords(
    readFileSync(path.join(ctx.root, DECOMPOSITION_FILE), "utf8"),
  );
  const criteria = acceptanceCriteria(cardText);
  const lightest = lightestTier(taskFormatText(ctx.root));
  const { verdict, signals, tries } = seatVerdict({
    size,
    lightest,
    fence,
    criteria,
    keywords,
  });

  /** @param {string} via */
  const tree = (via) => treeProv(ctx.ref, via);

  /** @type {import("./dispatch-brief.mjs").Rec[]} */
  const recs = [
    value(
      "ADVISORY — THE RECOMMENDED SEAT, and it is NOT one of the rows above",
      tree(`method/roles/${ctx.role}.md's contract table carries no such row`),
    ),
    note(
      "every input below is a fact about the card; this command reads no model dial of its own, " +
        "and holds none",
    ),
    value(
      `the card it read: ${card.file}`,
      tree("the card named by --task, and nothing else"),
    ),
  ];

  for (const s of signals) {
    recs.push(
      value(
        `signal ${s.id}: ${s.detail} — ${s.verdict}`,
        tree(
          s.id === "size"
            ? `${card.file} field size, against method/tasks/TASK-FORMAT.md's ceremony table (its FIRST row is read as its lightest)`
            : s.id === "fence"
              ? `${card.file} field touches, expanded through the component registry's own touch_slugs`
              : `${card.file} section Acceptance criteria, against ${DECOMPOSITION_FILE}'s pattern keywords`,
        ),
      ),
    );
  }

  recs.push(
    value(
      `RECOMMENDED SEAT: ${SEAT_PHRASE[verdict]} — ${tries} of ${signals.length} signals say ${TRY}`,
      tree(
        "the signals above, combined by session-economics.mjs's rule: KNOW needs a majority, and a tie goes to TRY",
      ),
    ),
    note(
      "the tie goes to the stronger seat: an under-powered session is paid for in a rejection " +
        "arc — a second build pass AND a second verification — while an over-powered one costs " +
        "one lane's tokens once",
    ),
    value(
      builder === ""
        ? "the card's builder: is EMPTY, so the operator's own default applies and this line is the only advice on offer"
        : `the card's builder: ${builder} — AUTHORITATIVE, and this line is advice about a field already filled`,
      tree(
        `${card.file} field builder — the D3 ruling of 2026-08-20 makes the card the channel that reaches another machine`,
      ),
    ),
  );

  const hygiene = hygieneSection(ctx.roleMd);
  if (hygiene === null) {
    recs.push(
      value(
        `no run-hygiene section in method/roles/${ctx.role}.md at this ref, so this line cites nothing above itself`,
        tree(`method/roles/${ctx.role}.md, searched for a heading naming run hygiene`),
      ),
    );
  } else {
    recs.push(
      value(
        `THE METHOD TEXT IS THE AUTHORITY AND THIS LINE YIELDS TO IT — ${hygiene.heading}: ${hygiene.body}`,
        tree(`method/roles/${ctx.role}.md section ${hygiene.heading}`),
      ),
    );
  }

  recs.push(
    note(
      "what this line cannot see, said rather than left to be discovered: whether the work is " +
        "genuinely novel, how much of the card's body is prose a session must re-derive before it " +
        "can start, whether the ceremony table is still written lightest-first, and which seats " +
        "this operator actually has",
    ),
  );
  return recs;
}
