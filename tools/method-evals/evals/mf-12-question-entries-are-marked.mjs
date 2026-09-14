/**
 * MF-12 — a question entry in a room is MARKED AS A QUESTION, carries the
 * id everything else finds it by, names the cards it holds, and does not
 * change its state without the evidence that settled it.
 *
 * THE RULE THIS HOLDS IS STATED IN THE METHOD AND NOT HERE (T-057: a rule
 * with two statements is two chances to disagree).
 * `method/rooms/ROOM-FORMAT.md`'s question-entry section owns the shape;
 * `method/roles/orchestrator.md` 5g owns the act of writing one instead
 * of stopping the loop. This eval holds the SHAPE half, because that is
 * the half a program can see: the seat's decision to ask rather than stop
 * happens in a session no file records, and the entry it produced is a
 * file that can be read.
 *
 * ── WHY EACH FAILURE IS A REAL FAILURE AND NOT A STYLE PREFERENCE ────
 *
 *   THE MARKER. A room is the archive a later reader inherits instead of
 *   replaying the conversation, and this project's repository is meant to
 *   become public. An entry that lost its marker reads to that reader as
 *   a settled thing — which is the seat putting a decision in the owner's
 *   mouth, the failure MF-11 holds from the wording side arriving here
 *   from the other direction. Unrecoverable once the history ships, for
 *   MF-11's own reason: an append-only archive cannot be tidied later
 *   without becoming an archive nobody can cite.
 *
 *   THE ID. The dispatch order names it on every card the entry holds and
 *   the LANE CUT refuses those cards by the same state. An id a reader
 *   cannot tell from prose is a hold nothing can lift.
 *
 *   THE CARDS HELD. A card gains no field for this: the link lives in the
 *   entry and nowhere else. An entry that names no card is a hold whose
 *   subject only its author knows.
 *
 *   THE RESOLUTION'S EVIDENCE. A state that moved to `resolved` with
 *   nothing behind it is the seat settling a decision it does not hold —
 *   the one thing the entry exists not to be.
 *
 * ── WHAT IS DELIBERATELY NOT COUNTED ────────────────────────────────
 * An entry that is not a question entry. The subject here is a heading
 * that ANNOUNCES itself as a question — `— QUESTION Q-nnn (state)` in the
 * turn heading, or the marker sentence in a turn's body — so an ordinary
 * turn that happens to ask something is out of scope and stays out. That
 * is deliberate: rooms are where roles ask each other things, and a check
 * that reddened on every question mark would be a check nobody could keep
 * green. A HEADING that claims the question shape and a BODY that carries
 * the marker are both in scope, and an entry with one and not the other
 * is exactly what this refuses — a half-marked entry is how the marker
 * goes missing in practice.
 *
 * ── WHY IT CARRIES ITS OWN DISCRIMINATION PAIR ──────────────────────
 * On the day this lands the live scope is EMPTY: no room carries a
 * question entry yet, and an audit over zero entries reports a green that
 * means nothing (`method/roles/executor.md`, Run hygiene: an exit 0 over
 * zero bodies is not a pass). So `check()` also runs the same audit over
 * FOUR synthetic entries — a well-formed pending one and a well-formed
 * resolved one, which must both come back clean, and two broken ones,
 * each of which must be caught. If the set ever stops discriminating this
 * eval FAILS saying so rather than riding an empty live scope to a green.
 * MF-11 states the same reason for the same shape one room over.
 *
 * ── AND THE SHAPE IS THE RENDERER'S, NOT A SECOND OPINION ───────────
 * `tools/e2e/scripts/dispatch-brief.mjs` RENDERS a question entry and
 * READS one back, and the end-to-end suite drives that round trip. This
 * eval is deliberately a separate reader over the room text, because the
 * failure it exists for is an entry a PERSON wrote — by hand, in a room,
 * the way every other turn is written — and a check that reused the
 * renderer could only ever see entries the renderer made.
 *
 * ── THE TRIGGER GAP, DISCLOSED ──────────────────────────────────────
 * The METHOD EVAL GATE fires on a `method/**` diff. This eval's SUBJECT
 * is `docs/rooms/**`, so a room entry can land in a docs-only commit
 * without the gate that runs this eval firing at all. That is MF-11's own
 * disclosed gap, unchanged and shared: widening the trigger is
 * docs/CONVENTIONS.md's write, and T-307's suggestion carries it.
 */

import { control, degraded, readCorpus } from "../lib/corpus.mjs";
import { roomPaths } from "./mf-11-room-entries-paraphrase.mjs";

const ROOMS = "docs/rooms";

/** The marker that makes an entry a question rather than a ruling. */
export const MARKER = "QUESTION — not a ruling";

/** A question entry's heading tail: the id and the state it declares. */
const HEADING = /^##\s+.*—\s*QUESTION\s+(\S+)\s*\(([^)]*)\)\s*$/;

/** The id shape everything else finds the entry by. */
const ID = /^Q-\d{3,}$/;

/** The two states an entry may declare. */
const STATES = ["pending", "resolved"];

/**
 * A room's question entries — a heading that claims the shape, or a body
 * that carries the marker. Both are in scope, and an entry with one and
 * not the other is the finding rather than a miss.
 *
 * @param {string} rel
 * @param {string} text
 * @returns {{ rel: string, heading: string, body: string }[]}
 */
export function questionEntriesOf(rel, text) {
  const lines = String(text).split("\n");
  /** @type {{ rel: string, heading: string, body: string }[]} */
  const out = [];
  /** @type {string[]} */
  let block = [];
  let heading = "";
  const flush = () => {
    const body = block.join("\n");
    if (heading !== "" && (HEADING.test(heading) || body.includes(MARKER))) {
      out.push({ rel, heading, body });
    }
  };
  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush();
      heading = line;
      block = [];
    } else block.push(line);
  }
  flush();
  return out;
}

/**
 * The findings one entry can carry.
 *
 * @param {{ rel: string, heading: string, body: string }} entry
 * @returns {string[]}
 */
export function auditEntry(entry) {
  /** @type {string[]} */
  const findings = [];
  const where = `${entry.rel} — ${entry.heading.slice(0, 90)}`;
  const head = HEADING.exec(entry.heading);
  if (head === null) {
    findings.push(
      `${where} carries the question MARKER in its body and does not announce itself in its ` +
        "HEADING. The heading is what a reader scanning a room sees, so an entry marked only " +
        "inside is an entry the scan misses.",
    );
  }
  if (!entry.body.includes(MARKER)) {
    findings.push(
      `${where} is a question entry and does NOT carry "${MARKER}". Without it the entry reads ` +
        "to a later reader as something the owner settled, which is the seat putting a decision " +
        "in the owner's mouth.",
    );
  }
  const id = head === null ? "" : String(head[1]);
  if (head !== null && !ID.test(id)) {
    findings.push(
      `${where} declares the id ${JSON.stringify(id)}, which is not Q- followed by at least three ` +
        "digits. The dispatch order names that id on every card the entry holds and the lane cut " +
        "refuses by it, so an id nothing can match is a hold nothing can lift.",
    );
  }
  const declared = head === null ? "" : String(head[2]).trim();
  if (head !== null && !STATES.includes(declared)) {
    findings.push(
      `${where} declares the state ${JSON.stringify(declared)}, which is not ${STATES.join(" or ")}.`,
    );
  }
  const cards = /^Cards held:\s*(.+?)\s*$/m.exec(entry.body);
  if (cards === null || String(cards[1]).trim() === "") {
    findings.push(
      `${where} names no cards held. A card gains no field for this — the link lives in the entry ` +
        "and nowhere else — so an entry with no cards is a hold whose subject only its author knows.",
    );
  }
  const state = /^State:\s*(pending|resolved)\s*(?:—\s*(.+?)\s*)?$/m.exec(entry.body);
  if (state === null) {
    findings.push(`${where} carries no "State:" line, so nothing can tell whether it still holds.`);
  } else if (String(state[1]) === "resolved" && String(state[2] ?? "").trim() === "") {
    findings.push(
      `${where} is RESOLVED and carries no evidence for the resolution. A state that changed with ` +
        "nothing behind it is the seat settling a decision it does not hold.",
    );
  }
  return findings;
}

/**
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {{ findings: string[], rooms: number, entries: number }}
 */
export function auditWithCoverage(corpus) {
  /** @type {string[]} */
  const findings = [];
  let rooms = 0;
  let entries = 0;
  for (const [rel, text] of corpus) {
    if (!rel.startsWith(`${ROOMS}/`) || !rel.endsWith(".md")) continue;
    rooms += 1;
    for (const entry of questionEntriesOf(rel, text)) {
      entries += 1;
      findings.push(...auditEntry(entry));
    }
  }
  return { findings, rooms, entries };
}

const FIXTURE_REL = `${ROOMS}/the-discrimination-set.md`;

/** Well formed, pending: must come back clean. */
const CLEAN_PENDING = [
  "## @orchestrator (a-model @a-session) — 2026-09-14 — QUESTION Q-001 (pending)",
  "",
  `**${MARKER}.** Whether the express path admits a card whose fence names a guard-class path is a`,
  "product ruling, and nothing here can make it (docs/tasks/T-900-a-fixture-card.md)",
  "",
  "Cards held: T-900, T-901",
  "State: pending",
].join("\n");

/** Well formed, resolved with its evidence: must come back clean. */
const CLEAN_RESOLVED = [
  "## @orchestrator (a-model @a-session) — 2026-09-14 — QUESTION Q-002 (resolved)",
  "",
  `**${MARKER}.** Whether a repair card inherits its parent's tier (docs/tasks/T-902-a-fixture-card.md)`,
  "",
  "Cards held: T-902",
  "State: resolved — the owner ruled on 2026-09-15 that a repair is classified on its own fence,",
  "recorded in docs/decisions/026 and carried onto the card",
].join("\n");

/** The marker gone: the entry now reads as a ruling. Must be caught. */
const UNMARKED = [
  "## @orchestrator (a-model @a-session) — 2026-09-14 — QUESTION Q-003 (pending)",
  "",
  "The express path admits a card whose fence names a guard-class path.",
  "",
  "Cards held: T-903",
  "State: pending",
].join("\n");

/** Resolved with nothing behind it: the seat settling what it does not hold. Must be caught. */
const BARE_RESOLUTION = [
  "## @orchestrator (a-model @a-session) — 2026-09-14 — QUESTION Q-004 (resolved)",
  "",
  `**${MARKER}.** Whether the bench may be cut late (docs/tasks/T-904-a-fixture-card.md)`,
  "",
  "Cards held: T-904",
  "State: resolved",
].join("\n");

/**
 * The discrimination set: two well-formed entries that must come back
 * clean and two broken ones that must each be caught by name.
 *
 * @returns {{ ok: true, detail: string } | { ok: false, detail: string, lines: string[] }}
 */
function discriminates() {
  const one = (/** @type {string} */ text) =>
    auditWithCoverage(new Map([[FIXTURE_REL, text]])).findings;
  const clean = [...one(CLEAN_PENDING), ...one(CLEAN_RESOLVED)];
  const unmarked = one(UNMARKED);
  const bare = one(BARE_RESOLUTION);
  const caughtMarker = unmarked.some((f) => f.includes(MARKER));
  const caughtBare = bare.some((f) => f.includes("nothing behind it"));
  if (clean.length > 0 || !caughtMarker || !caughtBare) {
    return {
      ok: false,
      detail:
        "THE DISCRIMINATION SET NO LONGER DISCRIMINATES, so a green over the live rooms would " +
        `mean nothing: the two well-formed entries produced ${String(clean.length)} finding(s), ` +
        `the unmarked entry was ${caughtMarker ? "caught" : "MISSED"} and the bare resolution was ` +
        `${caughtBare ? "caught" : "MISSED"}`,
      lines: [...clean, ...unmarked, ...bare],
    };
  }
  return { ok: true, detail: "two well-formed entries pass and two broken ones are each caught" };
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-12",
  kind: "model-free",
  title: "a question entry is marked as a question, carries its id and cards, and resolves with evidence",
  contract: `${ROOMS}/**.md — every question entry, against method/rooms/ROOM-FORMAT.md's question-entry section`,
  reads: [`${ROOMS}/`, "method/rooms/ROOM-FORMAT.md", "method/roles/orchestrator.md"],

  async check() {
    const pair = discriminates();
    if (!pair.ok) return pair;
    const corpus = readCorpus(roomPaths());
    const { findings, rooms, entries } = auditWithCoverage(corpus);
    if (findings.length > 0) {
      return {
        ok: false,
        detail: `${findings.length} finding(s) over ${entries} question entr(ies) in ${rooms} rooms`,
        lines: findings,
      };
    }
    return {
      ok: true,
      detail:
        `${rooms} rooms, ${entries} question entr(ies) audited; ${pair.detail} — so this green is ` +
        "a measurement even while no room carries one yet",
    };
  },

  async degrade() {
    const clean = readCorpus(roomPaths());
    const subject = roomPaths()[0];
    if (subject === undefined) throw new Error(`${ROOMS}/ holds no room to degrade`);
    // THE DEGRADATION IS THE ENTRY SOMEBODY WOULD ACTUALLY WRITE: a
    // question appended to a live room with its marker left off, which is
    // how a question becomes a ruling in an archive nobody can tidy.
    const broken = degraded(clean, subject, (t) => `${t}\n${UNMARKED}\n`);
    return control({
      clean,
      broken,
      audit: (c) => auditWithCoverage(c).findings,
      names: (f) => f.includes(MARKER) && f.includes(String(subject)),
      what: "a question entry appended to a live room with its marker left off",
    });
  },
};
