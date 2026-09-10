/**
 * MF-11 — a room entry recorded under the propose-before-record rule
 * PARAPHRASES: it carries no quotation of the owner's own message, and
 * it names no person.
 *
 * THE RULE THIS HOLDS, and it is stated in the method rather than here
 * (T-057: a rule with two statements is two chances to disagree).
 * `method/rooms/ROOM-FORMAT.md` says a turn or a Resolution recording
 * what the owner settled says what was settled and when, in the room's
 * own words — never a quotation of the owner's message and never the
 * owner's name; `method/roles/orchestrator.md` owns the other half, the
 * act of showing the entry to the owner before appending it. This eval
 * holds the WORDING half, because that is the half a program can see: a
 * seat's ask happens in a conversation no file records, while the entry
 * it produced is a file that can be read.
 *
 * WHY THE WORDING IS A REAL FAILURE AND NOT A STYLE PREFERENCE. A room
 * is the archive a later reader inherits instead of replaying the
 * conversation (ROOM-FORMAT's own "readers read the Resolution and
 * stop"), and this project's repository is meant to become public. A
 * pasted chat message reaches that reader stripped of the exchange that
 * made it make sense, and a personal name reaches them as a person
 * rather than as the role that ruled. Both are unrecoverable once the
 * history ships: an append-only archive cannot be cleaned up afterwards
 * without becoming an archive nobody can cite.
 *
 * ── THE DATE FLOOR, AND WHY IT IS THE DAY *AFTER* THE RULE LANDED ────
 * The rule is FORWARD-LOOKING by its own words: entries written before
 * a project adopted it are records and are never restyled to comply. So
 * this eval reads only entries dated on or after `FLOOR`. The card
 * (T-307) proposed the floor be the day the rule lands, 2026-09-10 —
 * and the tree refuses that value: measured at this ref, three rooms
 * carry entries dated 2026-09-10 itself, several in exactly the shape
 * below (`@human (2026-09-10): "..."`), because the sitting that ASKED
 * for the rule is the sitting that wrote them. A floor of 2026-09-10
 * therefore reds on the records the rule exists to protect, which is
 * the one outcome the card forbids. The floor is the first day whose
 * entries are all written under the rule.
 *
 * ── WHAT IS DELIBERATELY NOT COUNTED, each because counting it would
 *    produce a red that is wrong rather than a red that is news ───────
 *   1. AN UNDATED ENTRY in a room opened before the floor. There is no
 *      date to compare, and inheriting the file's newest date would
 *      pull every old section of a still-active room into scope. A new
 *      entry that carries no date at all is therefore invisible here —
 *      the rule requires a date, so this hole and the "date it" half of
 *      the rule close each other (filed as a suggestion on T-307).
 *   2. A NAME INSIDE A MACHINE FACT — a path, an email address, a
 *      hostname (`/Users/<name>/...`, a `Something-MacBook.local`
 *      stamp) or anything inside backticks. Those are measurements, not
 *      attributions, and the rule is about who a ruling is credited to.
 *   3. A QUOTED RUN OF UNDER `MIN_QUOTED_WORDS` WORDS. A quoted term of
 *      art beside the owner's name ("later", "the owner's yes") is
 *      vocabulary, not a message; a pasted message is a sentence.
 *   4. A QUOTED RUN WITH NO ATTRIBUTION NEAR IT. Rooms quote documents,
 *      commands and each other constantly, and a check that reddened on
 *      every quotation mark would be a check nobody could keep green.
 *      The shape this refuses is a quotation ATTRIBUTED to the owner.
 *
 * ── WHERE THE FORBIDDEN NAMES COME FROM, since nothing may type one ──
 * The owner's name is exactly what must not gain another copy in this
 * tree, so this eval TYPES NO NAME. It derives the set from the
 * repository's own commit identities — author names and the local part
 * of author emails — and then drops:
 *   · machine identities (a `[bot]` name, a `noreply` address), which
 *     are not people;
 *   · any token the METHOD's own text already uses as a word. method/
 *     is product-agnostic by charter and names no person, so a token
 *     found there is a role, a tool or a model, never this project's
 *     owner: that is what keeps `verifier` and `claude` — both real
 *     author identities in this repository's history — out of the set.
 * An empty set after that filtering is a CANNOT_RUN and not a pass: the
 * name half would be silently vacuous, which is the failure this suite
 * exists to refuse.
 *
 * ── WHY THE CHECK CARRIES ITS OWN DISCRIMINATION PAIR ────────────────
 * On the day this lands the in-scope set is EMPTY — the floor is
 * tomorrow — and an audit over zero entries reports a green that means
 * nothing (`method/roles/executor.md`, Run hygiene: an exit 0 over zero
 * bodies is not a pass). So `check()` also runs the same audit over two
 * synthetic entries dated after the floor: one written the way the
 * sitting on 2026-09-10 wrote them, which must be caught on BOTH counts,
 * and its paraphrased twin, which must come back clean. If the pair ever
 * stops discriminating this eval FAILS saying so, rather than riding an
 * empty live scope to a green. `app/src-tauri/src/agent/kit.rs`'s skill
 * body is the same shape and states the same reason: a test that only
 * shows the good case accepted cannot tell "the contract is satisfied"
 * from "this checker accepts anything".
 *
 * ── THE TRIGGER GAP, DISCLOSED ──────────────────────────────────────
 * The METHOD EVAL GATE fires on a `method/**` diff. This eval's SUBJECT
 * is `docs/rooms/**`, so a room entry can land in a docs-only commit
 * without the gate that runs this eval firing at all. Widening the
 * trigger is docs/CONVENTIONS.md's write and outside T-307's fence;
 * filed as a suggestion on that card.
 */

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { control, degraded, readCorpus } from "../lib/corpus.mjs";
import { repoRoot } from "../lib/fixture-root.mjs";

const ROOMS = "docs/rooms";

/**
 * The first day whose room entries are written under the rule. The
 * header says why this is the day AFTER the rule landed and not the day
 * of it; it is a project fact, so it lives here rather than in the
 * product-agnostic method text.
 */
export const FLOOR = "2026-09-11";

/** A quoted run of fewer words than this is a term, not a message. */
const MIN_QUOTED_WORDS = 4;

/** How much text may sit between the attribution and the opening quote. */
const GLUE_MAX = 60;

const ISO_DATE = /\b20\d{2}-\d{2}-\d{2}\b/g;
const ATTRIBUTION = /@human|the owner|the human/gi;
/**
 * A quoted run, OF ANY LENGTH. The shape this rule refuses is a pasted
 * message, and a pasted message is the long one rather than the short
 * one: a ceiling here exempts exactly the entry the rule exists for.
 */
const QUOTED = /"([^"]+)"|“([^”]+)”/g;
const SAYING =
  /\b(said|says|saying|ask|asks|asked|wrote|writes|ruled|ruling|rules|message|messages|word|words|question|questions|proposal|proposed|reply|replied|answer|answered|told|verbatim|put it|call|called|quote|quoted)\b/i;

/** Machine identities: not people, so not names. */
const MACHINE_IDENTITY = /\[bot\]|\bbot\b|^no-?reply$/i;

/** @param {string} s */
const flatten = (s) => s.split(/\s+/).join(" ");

/**
 * @typedef {object} Entry
 * @property {string} rel    the room file, root-relative
 * @property {string} label  the entry's own heading, for the finding
 * @property {string | null} date  the entry's date, or null if it has none
 * @property {string} text
 */

/**
 * A room file's entries: the opening block, then one per `##` heading.
 *
 * THE DATE CASCADE, in order: the date written in the entry's own
 * heading (which is where the turn format puts it), else the newest date
 * anywhere in the entry, else the room's `opened:` field, else none.
 *
 * @param {string} rel
 * @param {string} text
 * @returns {Entry[]}
 */
export function entriesOf(rel, text) {
  const frontmatter = text.startsWith("---\n") ? text.slice(0, text.indexOf("\n---", 4) + 4) : "";
  const opened = /^opened:\s*(20\d{2}-\d{2}-\d{2})/m.exec(frontmatter);
  const lines = text.split("\n");
  /** @type {Entry[]} */
  const entries = [];
  /** @type {string[]} */
  let block = [];
  let heading = "";
  const flush = () => {
    if (block.length === 0 && heading === "") return;
    const body = block.join("\n");
    const inHeading = heading.match(ISO_DATE);
    const inBody = body.match(ISO_DATE);
    const date =
      inHeading !== null
        ? /** @type {string} */ (inHeading[0])
        : inBody !== null
          ? /** @type {string} */ ([...inBody].sort().pop())
          : opened !== null
            ? /** @type {string} */ (opened[1])
            : null;
    entries.push({
      rel,
      label: heading === "" ? "the opening block" : flatten(heading).slice(0, 90),
      date,
      text: `${heading}\n${body}`,
    });
  };
  for (const line of lines) {
    if (line.startsWith("## ")) {
      flush();
      heading = line;
      block = [];
    } else block.push(line);
  }
  flush();
  return entries;
}

/**
 * The two findings one entry can carry.
 *
 * @param {Entry} entry
 * @param {string[]} identities
 * @returns {string[]}
 */
function auditEntry(entry, identities) {
  /** @type {string[]} */
  const findings = [];
  const flat = flatten(entry.text);
  const where = `${entry.rel} — ${entry.label} (dated ${String(entry.date)})`;

  for (const m of flat.matchAll(QUOTED)) {
    const run = /** @type {string} */ (m[1] ?? m[2]);
    if (run.trim().split(/\s+/).filter((w) => w !== "").length < MIN_QUOTED_WORDS) continue;
    const before = flat.slice(Math.max(0, m.index - (GLUE_MAX + 16)), m.index);
    const attributions = [...before.matchAll(ATTRIBUTION)];
    const last = attributions[attributions.length - 1];
    if (last === undefined) continue;
    const glue = before.slice(/** @type {number} */ (last.index) + last[0].length);
    if (glue.length > GLUE_MAX || glue.includes('"') || glue.includes("”")) continue;
    // Either the attribution runs straight into the quote through
    // punctuation and a date, or the words between them are words of
    // SAYING. Anything else is this entry quoting something that is not
    // the owner's message.
    if (/[A-Za-z]/.test(glue) && !SAYING.test(glue)) continue;
    findings.push(
      `${where} QUOTES a message attributed to ${last[0].trim()} — ` +
        `"${run.slice(0, 70)}${run.length > 70 ? "…" : ""}". Paraphrase the ruling and date it.`,
    );
  }

  // The name half runs over PROSE only: fenced blocks and code spans are
  // machine text, and a token carrying `/`, `@` or `.` is a path, an
  // address or a hostname rather than an attribution.
  const prose = entry.text.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  /** @type {Set<string>} */
  const seen = new Set();
  for (const raw of prose.split(/\s+/)) {
    // A LEADING AT-SIGN IS AN ATTRIBUTION, NOT AN ADDRESS. The skip below
    // is for machine facts — a path, an address, a hostname — and a bare
    // handle is none of them: it is the name, spelled the way a chat
    // spells it, and it walked past BOTH halves of this audit at once.
    const token = raw.startsWith("@") ? raw.slice(1) : raw;
    if (token.includes("/") || token.includes("@") || token.includes(".")) continue;
    for (const id of identities) {
      if (seen.has(id) || !new RegExp(`\\b${id}\\b`, "i").test(token)) continue;
      seen.add(id);
      findings.push(
        `${where} NAMES a person (${token}) — in a room the owner appears as the owner.`,
      );
    }
  }
  return findings;
}

/**
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @param {string[]} identities
 * @returns {{ findings: string[]; rooms: number; entries: number; inScope: number }}
 */
export function auditWithCoverage(corpus, identities) {
  /** @type {string[]} */
  const findings = [];
  let rooms = 0;
  let entries = 0;
  let inScope = 0;
  for (const [rel, text] of corpus) {
    if (!rel.startsWith(`${ROOMS}/`) || !rel.endsWith(".md")) continue;
    rooms += 1;
    for (const entry of entriesOf(rel, text)) {
      entries += 1;
      if (entry.date === null || entry.date < FLOOR) continue;
      inScope += 1;
      findings.push(...auditEntry(entry, identities));
    }
  }
  return { findings, rooms, entries, inScope };
}

/** Every room file, root-relative — the corpus's `extra` list. */
export function roomPaths() {
  let names;
  try {
    names = readdirSync(path.join(repoRoot, ROOMS));
  } catch (cause) {
    throw new Error(
      `${ROOMS}/ could not be read, so no room entry was examined — ` +
        `${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
  return names.filter((f) => f.endsWith(".md")).sort().map((f) => `${ROOMS}/${f}`);
}

/** @type {string[] | null} */
let identityCache = null;

/**
 * The names a room entry may not carry, derived from this repository's
 * own commit identities. The header argues every filter; nothing here is
 * typed, because the name is the one string this tree must not gain
 * another copy of.
 *
 * @param {import("../lib/corpus.mjs").Corpus} corpus
 * @returns {string[]}
 */
export function ownerIdentities(corpus) {
  if (identityCache !== null) return identityCache;
  let log;
  try {
    log = execFileSync("git", ["-C", repoRoot, "log", "--max-count=5000", "--format=%an%n%ae"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (cause) {
    throw new Error(
      "the repository's own commit identities could not be read, so the name half of this " +
        `audit has nothing to look for — git log failed: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
  const methodText = [...corpus]
    .filter(([rel]) => rel.startsWith("method/"))
    .map(([, t]) => t)
    .join("\n")
    .toLowerCase();
  /** @type {Set<string>} */
  const tokens = new Set();
  const lines = log.split("\n");
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const name = /** @type {string} */ (lines[i]);
    const local = /** @type {string} */ (lines[i + 1]).split("@")[0] ?? "";
    if (MACHINE_IDENTITY.test(name) || MACHINE_IDENTITY.test(local)) continue;
    for (const token of `${name} ${local}`.split(/[^A-Za-z]+/)) {
      const t = token.toLowerCase();
      if (t.length < 4) continue;
      if (new RegExp(`\\b${t}\\b`).test(methodText)) continue;
      tokens.add(t);
    }
  }
  identityCache = [...tokens].sort();
  return identityCache;
}

/** The date both synthetic entries carry: after the floor, forever. */
const FIXTURE_DATE = "2026-09-12";
const FIXTURE_REL = `${ROOMS}/the-discrimination-pair.md`;

/** Written the way the sitting that asked for the rule wrote them. */
const PLANTED = [
  `## The ruling on the second option (${FIXTURE_DATE})`,
  "",
  `@human (${FIXTURE_DATE}): "just build the second one, the first is a waste of a whole`,
  'sitting". Recorded by <OWNER> after the call.',
].join("\n");

/** The same ruling, recorded the way the rule asks for. */
const PARAPHRASED = [
  `## The ruling on the second option (${FIXTURE_DATE})`,
  "",
  `The owner ruled on ${FIXTURE_DATE} that the second option is built and the first is`,
  "dropped, the reason given being the cost of a sitting.",
].join("\n");

/**
 * The discrimination pair: the planted entry must be caught on both
 * counts and its paraphrased twin must come back clean.
 *
 * @param {string[]} identities
 * @returns {{ ok: true; detail: string } | { ok: false; detail: string; lines: string[] }}
 */
function discriminates(identities) {
  const one = (/** @type {string} */ text) =>
    auditWithCoverage(new Map([[FIXTURE_REL, text]]), identities).findings;
  const planted = one(PLANTED.replace(/<OWNER>/g, /** @type {string} */ (identities[0])));
  const clean = one(PARAPHRASED);
  const quoted = planted.filter((f) => f.includes("QUOTES")).length;
  const named = planted.filter((f) => f.includes("NAMES")).length;
  if (quoted === 0 || named === 0 || clean.length > 0) {
    return {
      ok: false,
      detail:
        "THE DISCRIMINATION PAIR NO LONGER DISCRIMINATES, so a green over the live rooms " +
        `would mean nothing: the planted entry was caught on ${quoted} quote(s) and ` +
        `${named} name(s), and its paraphrased twin produced ${clean.length} finding(s)`,
      lines: [...planted, ...clean],
    };
  }
  return { ok: true, detail: `the planted entry is caught on ${quoted + named} counts` };
}

/** @type {import("../lib/harness.mjs").ModelFreeEval} */
export default {
  id: "MF-11",
  kind: "model-free",
  title: "a room entry paraphrases the ruling — it quotes no owner message and names no person",
  contract:
    `${ROOMS}/**.md — every entry dated on or after ${FLOOR}, against ` +
    "method/rooms/ROOM-FORMAT.md's entry rule",
  reads: [`${ROOMS}/`, "method/rooms/ROOM-FORMAT.md", "method/roles/orchestrator.md"],

  async check() {
    const corpus = readCorpus(roomPaths());
    const identities = ownerIdentities(corpus);
    if (identities.length === 0) {
      throw new Error(
        "no owner identity survived the filters, so the name half of this audit would look " +
          "for nothing — a vacuous half is not a passing half",
      );
    }
    const pair = discriminates(identities);
    if (!pair.ok) return pair;
    const { findings, rooms, entries, inScope } = auditWithCoverage(corpus, identities);
    if (findings.length > 0) {
      return {
        ok: false,
        detail: `${findings.length} finding(s) in ${inScope} entr(ies) dated on or after ${FLOOR}`,
        lines: findings,
      };
    }
    return {
      ok: true,
      detail:
        `${rooms} rooms, ${entries} entries, ${inScope} of them dated on or after ${FLOOR} ` +
        `and audited; ${identities.length} owner identit(ies) looked for; ${pair.detail}`,
    };
  },

  async degrade() {
    const clean = readCorpus(roomPaths());
    const identities = ownerIdentities(clean);
    const subject = roomPaths()[0];
    if (subject === undefined) throw new Error(`${ROOMS}/ holds no room to degrade`);
    // THE DEGRADATION IS THE ENTRY SOMEBODY WOULD ACTUALLY WRITE: a new
    // dated section appended to a live room, carrying the owner's own
    // words the way every entry carried them the day before the rule.
    const broken = degraded(clean, subject, (t) => `${t}\n${PLANTED.replace(/<OWNER>/g, "the owner")}\n`);
    return control({
      clean,
      broken,
      audit: (c) => auditWithCoverage(c, identities).findings,
      names: (f) => f.includes("QUOTES") && f.includes(String(subject)),
      what: "a new dated room entry quoting the owner's message",
    });
  },
};
