/**
 * THE DISPATCH BRIEF, DERIVED (T-133) — plain node, zero deps, no I/O at
 * import. The runnable half is `brief.mjs` beside this file; this module
 * holds the derivation and executes nothing.
 *
 * ── WHY A COMMAND AND NOT A RULE ─────────────────────────────────────
 * `method/roles/orchestrator.md` step 5b already requires that a brief be
 * "assembled to the contract in roles/executor.md — every row, from the
 * sources that row names", and `executor.md`'s table already names one
 * source per row. Every dispatch brief written on 2026-08-25 broke it —
 * not by dropping rows but by filling them from the dispatcher's memory
 * instead of from the named source. The prose was read closely enough to
 * be QUOTED and still did not bind. So the remedy is not a sharper
 * sentence; it is making the derived answer cheaper than the remembered
 * one.
 *
 * ── THE CONTRACT ─────────────────────────────────────────────────────
 * 1. THE ROW SET IS READ FROM `executor.md`, NEVER TRANSCRIBED HERE.
 *    A second list of rows is a second implementation (T-057) and it
 *    would go stale exactly the way the briefs did. What this module
 *    holds is a set of DERIVERS keyed by the row's own bold LABEL; the
 *    numbers, the wording and the `Assembled from` cell are all read off
 *    the file at the caller's ref. The coverage runs BOTH ways: a row
 *    with no deriver is reported as NOT DERIVED and names its source, and
 *    a deriver whose label the table no longer carries is a finding.
 * 2. EVERY EMITTED FIGURE CARRIES THE PROVENANCE THAT PRODUCED IT, AND
 *    THE PROVENANCE CANNOT BE STRIPPED. Output is built as RECORDS, not
 *    as strings. A `value` record without a provenance THROWS at render,
 *    and a `note` record may not contain a digit at all — so the only
 *    way a figure leaves this tool is attached to its ref or to its
 *    reading time. The consumer is a reader who will paste this into a
 *    brief, and the worst brief error on record was not a stale figure
 *    but a confident sentence about a lane, lifted from a conversation
 *    and written as though it sat in the committed record.
 * 3. TREE FACTS AND LIVE FACTS CARRY DIFFERENT STAMPS, because
 *    `executor.md`'s own rule says so: "A count, a hash, a path list and
 *    a range are all functions of a tree", while "a pid, a port holder, a
 *    listening socket is not a function of a tree, so it carries the time
 *    and host it was READ at — never a commit ref". A worktree's
 *    existence is a live fact by that test (docs/CONVENTIONS.md says so
 *    in as many words), so the LANE LIST is stamped with a clock and a
 *    host and never with a commit. **AND SO IS A READ OF A MUTABLE REF.**
 *    The base commit and the integration tip are reads of the integration
 *    BRANCH, not functions of the tree they sit beside; this module
 *    stamped them `@ <ref>` until a verifier watched that branch move
 *    three times inside one pass and print three values under one
 *    identical stamp. The test is not "is it a hash" — a hash is the
 *    shape a tree fact usually has — it is "does the stamped ref
 *    DETERMINE it". See `integrationRefs`.
 * 4. THE LANE LIST IS FILTERED ON THE BRANCH, NEVER THE PATH, and the
 *    branch pattern is itself derived from the spelling CONVENTIONS
 *    publishes rather than typed here. Detached scratch worktrees sit at
 *    lane-shaped paths — one named after a card sat beside its lane on
 *    the night this card was written — so a path filter answers the
 *    wrong question with the right-looking rows.
 * 5. WHERE TWO COPIES OF ONE FACT DIVERGE, THE AUTHORITATIVE ONE WINS AND
 *    THE DIVERGENCE IS A FINDING. Row 5 rules each component file's
 *    `touch_slugs:` FIELD authoritative over the architecture doc's prose
 *    block, "because the block is prose that goes stale the day a
 *    component is added". This module derives both and compares them.
 * 6. IT WRITES NOTHING. Every git call is a read, the one port command is
 *    the only one docs/CONVENTIONS.md permits for the human's app, and a
 *    dispatcher with no lane can run it from the integration checkout.
 *
 * ── WHAT IS DELIBERATELY NOT DERIVED ─────────────────────────────────
 * The judgement half. Which ceremony ROW an `S` card falls on (the table
 * gives two and only a reader can say whether the diff touches shipped
 * code); the lane's SLUG in its branch name; whether a discipline applies
 * to this card. Those are emitted as the document states them, with the
 * choice named and left to the dispatcher, because a tool that guesses
 * them produces exactly the confident wrong sentence this card exists to
 * stop.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  INDEXED_DOCS,
  conventionsText,
  frontmatterBlock,
  liveTaskCards,
  repoRoot,
  trackedFiles,
} from "./docs-scan.mjs";
import { isRecordablePid, processRow } from "./checkout-currency.mjs";
import { rawBullet } from "./range-rule.mjs";
// T-320 — THE OWNING-SPEC DERIVATION, borrowed rather than re-derived.
// The express path's eligibility asks whether a keeper or an owning spec
// already covers each fenced path, and `gate-run.mjs` answers exactly
// that question from the static import graph WITHOUT running a suite. It
// imports node builtins and `docs-scan.mjs` and nothing from here, so the
// dependency runs one way; `merge.mjs` already reaches it the same way.
import { deriveOwning } from "./gate-run.mjs";
// THE RUNTIME DIRECTORY'S NAME, FROM THE ONE FILE THAT DECLARES IT
// (T-324). The admission arm reads an owner-written pause record that
// lives beside T-238's holder record, and a second spelling of that
// directory here would be the duplication every other reader of it
// avoids by importing this constant.
import { RUNTIME_DIR, RUNTIME_DIR_IGNORE } from "../../../.claude/hooks/lane-fence.mjs";

/* ────────────────────────────────────────────────────────────────────
 * THE PROCESS SETTINGS READER, IMPORTED FROM THE PARSER LIBRARY (T-317).
 *
 * WHY THE BUILT ENTRY, AND WHY BY PATH. `tools/e2e` is the repository's
 * THIRD npm package and declares no dependency on the parser (ADR-011
 * family; its own manifest says it "imports neither app nor parser"), so
 * the parser's BUILT browser-safe entry is loaded by relative path —
 * the same spelling `dispatch-order.mjs` uses for `dist/index.js`, and
 * the same artefact `preflight.ts` already asserts into existence for
 * this package. A missing build is a LOUD REFUSAL NAMING THE ORDER,
 * never a silent half-answer, and it fires at load because every arm in
 * this file reads the settings.
 * ──────────────────────────────────────────────────────────────────── */

const processPure = await import("../../../lib/parser/dist/pure.js").catch((err) => {
  throw new Error(
    "dispatch-brief: cannot load the process settings reader from lib/parser/dist/pure.js — " +
      "ADR-011 build order: lib/parser FIRST (`npm ci` + `npm run build` from lib/parser/), then " +
      "app/. The schema parser, the section reader, the resolver, the ledger and the constraint " +
      "findings are that library's since T-317 and this arm re-exports them rather than keeping a " +
      `second spelling of them. (${err instanceof Error ? err.message : String(err)})`,
  );
});

const { PROCESS_SCHEMA, PROCESS_SECTION, RUNTIME_TEMPLATE, SWITCH_FIELDS, SWITCH_TYPES } = processPure;

/** @typedef {import("../../../lib/parser/dist/pure.js").ProcessSchema} ProcessSchema */
/** @typedef {import("../../../lib/parser/dist/pure.js").ProcessSwitch} ProcessSwitch */
/** @typedef {import("../../../lib/parser/dist/pure.js").ProcessSection} ProcessSection */
/** @typedef {import("../../../lib/parser/dist/pure.js").ProcessSettings} ProcessSettings */
/** @typedef {import("../../../lib/parser/dist/pure.js").LedgerRow} LedgerRow */

export const EXIT = Object.freeze({ CLEAN: 0, FOUND: 1, USAGE: 2, CANNOT_RUN: 3 });

/** The role whose brief this assembles when none is named. */
export const DEFAULT_ROLE = "executor";

/**
 * The sentence that identifies the DISPATCHING role — the seat row 12's
 * second source belongs to. A locator, like the contract table's column
 * names: the role is found by asking which file claims the act, never by
 * naming `orchestrator` here, because the act is what row 12 is about
 * and a second copy of that name is a second row set.
 */
export const DISPATCHER_PHRASE = "assembled to the contract in roles/";

/**
 * The contract table's four column headings, used to FIND the table and
 * never to describe it. A locator, not a transcription of its contents:
 * if the headings move, the parse throws by name instead of returning an
 * empty row set, which is the failure `executor.md` row 13 exists to stop.
 */
export const CONTRACT_COLUMNS = Object.freeze([
  "#",
  "The brief carries",
  "Assembled from",
  "If it is absent",
]);

/* ────────────────────────────────────────────────────────────────────
 * Small readers — every one of them a READ, and every one taking the
 * root the same way `conventionsText` does so a drill can point the
 * whole module at another checkout of this repository.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @param {string} root
 * @param {string[]} args
 * @returns {string}
 */
export function git(root, args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** @param {string} rel @param {string} root @returns {string} */
export function readDoc(rel, root = repoRoot) {
  return readFileSync(path.join(root, rel), "utf8");
}

/** `method/roles/<role>.md`, the file row 1 names. */
/** @param {string} role @param {string} root @returns {string} */
export function roleText(role, root = repoRoot) {
  if (!/^[a-z][a-z-]*$/.test(role)) {
    throw new Error(
      `dispatch-brief: ${JSON.stringify(role)} is not a role name — a role is the basename of ` +
        "a file under method/roles/, and this module will not build a path out of anything else.",
    );
  }
  return readDoc(`method/roles/${role}.md`, root);
}

/** `method/lane-protocol.md` — row 4's rules half. */
/** @param {string} root @returns {string} */
export function laneProtocolText(root = repoRoot) {
  return readDoc("method/lane-protocol.md", root);
}

/** `method/tasks/TASK-FORMAT.md` — row 11's ceremony table. */
/** @param {string} root @returns {string} */
export function taskFormatText(root = repoRoot) {
  return readDoc("method/tasks/TASK-FORMAT.md", root);
}

/** `docs/STATE.md` — arm two's subject. */
/** @param {string} root @returns {string} */
export function stateText(root = repoRoot) {
  return readDoc("docs/STATE.md", root);
}

/** `docs/ARCHITECTURE.md` — the slug block row 5 rules NON-authoritative. */
/** @param {string} root @returns {string} */
export function architectureText(root = repoRoot) {
  return readDoc("docs/ARCHITECTURE.md", root);
}

/* ────────────────────────────────────────────────────────────────────
 * Frontmatter — a MINIMAL reader for the three field shapes this
 * repository actually uses, kept zero-dependency so the command runs
 * from a checkout with nothing installed. The spec cross-checks every
 * field it produces against the `yaml` package over every live card and
 * every component file, so this is one implementation measured against
 * the authority rather than a second opinion (T-057).
 * ──────────────────────────────────────────────────────────────────── */

/**
 * A trailing `# …` comment, removed. THE LEADING CASE IS THE ONE THAT
 * BIT: four component files write `paths:` followed by a comment and
 * then a block sequence, and a stripper that only looked for " #" read
 * the comment as the field's VALUE and dropped every path under it. The
 * spec measures this reader against `yaml` over the whole tree, which is
 * how that was found rather than shipped.
 *
 * @param {string} s
 * @returns {string}
 */
function stripInlineComment(s) {
  const t = s.trim();
  if (t.startsWith("#")) return "";
  const at = t.indexOf(" #");
  return (at < 0 ? t : t.slice(0, at)).trim();
}

/** @param {string} s @returns {string[]} */
function parseFlowSequence(s) {
  const inner = s.slice(1, s.lastIndexOf("]"));
  return inner
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/**
 * The frontmatter fields of one document: scalars as strings, flow
 * sequences and block sequences as arrays. Comments are stripped, which
 * is what the component registry needs — its `paths:` items carry them.
 *
 * @param {string} content
 * @returns {Record<string, string | string[]>}
 */
export function frontmatterFields(content) {
  const block = frontmatterBlock(content);
  /** @type {Record<string, string | string[]>} */
  const out = {};
  if (block === null) return out;
  const lines = block.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*):[ \t]*(.*)$/.exec(/** @type {string} */ (lines[i]));
    if (m === null) continue;
    const key = /** @type {string} */ (m[1]);
    const rest = stripInlineComment(/** @type {string} */ (m[2]));
    if (rest.startsWith("[")) {
      out[key] = parseFlowSequence(rest);
      continue;
    }
    if (rest !== "") {
      out[key] = rest;
      continue;
    }
    /** @type {string[]} */
    const items = [];
    let j = i + 1;
    for (; j < lines.length; j += 1) {
      const line = /** @type {string} */ (lines[j]);
      const item = /^[ \t]+-[ \t]+(.*)$/.exec(line);
      if (item !== null) {
        items.push(stripInlineComment(/** @type {string} */ (item[1])));
        continue;
      }
      if (/^[ \t]*(#.*)?$/.test(line)) continue;
      break;
    }
    if (items.length > 0) {
      out[key] = items;
      i = j - 1;
      continue;
    }
    out[key] = "";
  }
  return out;
}

/** @param {Record<string, string | string[]>} f @param {string} key @returns {string[]} */
export function fieldList(f, key) {
  const v = f[key];
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v !== "") return [v];
  return [];
}

/** @param {Record<string, string | string[]>} f @param {string} key @returns {string} */
export function fieldScalar(f, key) {
  const v = f[key];
  return typeof v === "string" ? v : "";
}

/* ────────────────────────────────────────────────────────────────────
 * The contract table — READ from executor.md.
 * ──────────────────────────────────────────────────────────────────── */

/** @param {string} line @returns {string[] | undefined} */
function tableCells(line) {
  const t = line.trim();
  if (!t.startsWith("|") || !t.endsWith("|") || t.length < 2) return undefined;
  return t
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
}

/**
 * @typedef {object} ContractRow
 * @property {number} n
 * @property {string} label
 * @property {string} key
 * @property {string} carries
 * @property {string} source
 * @property {string} absent
 */

/**
 * The brief's row set, parsed out of the role file's normative table.
 *
 * Throws on anything it cannot read: a missing table, a renamed column,
 * a row with the wrong cell count, a row with no bold label, a duplicate
 * label, or numbering that is not 1..k. An expectation that quietly
 * becomes empty passes everything and nothing points at it.
 *
 * @param {string} md
 * @returns {ContractRow[]}
 */
export function contractRows(md) {
  const lines = md.split(/\r?\n/);
  /** @type {number[]} */
  const headers = [];
  for (let i = 0; i < lines.length; i += 1) {
    const cells = tableCells(/** @type {string} */ (lines[i]));
    if (cells === undefined) continue;
    if (cells.length !== CONTRACT_COLUMNS.length) continue;
    if (cells.every((c, k) => c === CONTRACT_COLUMNS[k])) headers.push(i);
  }
  if (headers.length !== 1) {
    throw new Error(
      `dispatch-brief: found ${headers.length} tables headed ` +
        `${CONTRACT_COLUMNS.join(" / ")}, expected exactly one — the brief's row set is READ ` +
        "from this table, so a renamed or duplicated heading is a hard failure and never an " +
        "empty contract.",
    );
  }
  const start = /** @type {number} */ (headers[0]);
  const sep = tableCells(/** @type {string} */ (lines[start + 1]));
  if (sep === undefined || !sep.every((c) => /^:?-{2,}:?$/.test(c))) {
    throw new Error(
      "dispatch-brief: the contract table's heading is not followed by a separator row — " +
        "this is not the table this module knows how to read.",
    );
  }
  /** @type {ContractRow[]} */
  const rows = [];
  for (let i = start + 2; i < lines.length; i += 1) {
    const cells = tableCells(/** @type {string} */ (lines[i]));
    if (cells === undefined) break;
    if (cells.length !== CONTRACT_COLUMNS.length) {
      throw new Error(
        `dispatch-brief: contract row ${rows.length + 1} has ${cells.length} cells, expected ` +
          `${CONTRACT_COLUMNS.length} — a row this module cannot read is a row a brief would ` +
          "fill by guessing.",
      );
    }
    const num = Number(/** @type {string} */ (cells[0]));
    const carries = /** @type {string} */ (cells[1]);
    const bold = /^\*\*(.+?)\*\*/.exec(carries);
    if (!Number.isInteger(num) || num !== rows.length + 1) {
      throw new Error(
        `dispatch-brief: contract rows must be numbered consecutively from one; row ` +
          `${rows.length + 1} reads ${JSON.stringify(cells[0])}.`,
      );
    }
    if (bold === null) {
      throw new Error(
        `dispatch-brief: contract row ${num} opens with no bold label, so this module has no ` +
          "key to bind a deriver to. The label is the row's NAME; a row without one cannot be " +
          "answered from a named source.",
      );
    }
    const label = /** @type {string} */ (bold[1]).trim();
    const row = {
      n: num,
      label,
      key: label.toLowerCase(),
      carries,
      source: /** @type {string} */ (cells[2]),
      absent: /** @type {string} */ (cells[3]),
    };
    if (rows.some((r) => r.key === row.key)) {
      throw new Error(
        `dispatch-brief: two contract rows carry the label ${JSON.stringify(label)} — a label ` +
          "that names two rows cannot key a deriver.",
      );
    }
    if (row.source === "") {
      throw new Error(
        `dispatch-brief: contract row ${num} (${label}) names no source. Every row is assembled ` +
          "FROM something; a row with an empty source column is the defect this card exists for.",
      );
    }
    rows.push(row);
  }
  if (rows.length === 0) {
    throw new Error("dispatch-brief: the contract table has no rows");
  }
  return rows;
}

/**
 * One numbered step of a role file, collapsed. Throws if the step is
 * absent — every quotation in this module is a transcription, and a
 * transcription that silently becomes empty is a paraphrase.
 *
 * @param {string} md
 * @param {number | string} n the step's own label — `1`, or a lettered one like `5b`
 * @returns {string}
 */
export function numberedStep(md, n) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`${n}. `));
  if (start < 0) {
    throw new Error(`dispatch-brief: this role file has no step ${String(n)}`);
  }
  /** @type {string[]} */
  const held = [/** @type {string} */ (lines[start])];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (/^\d+[a-z]?\. /.test(line) || line.startsWith("## ")) break;
    held.push(line);
  }
  return held.join(" ").replace(/\s+/g, " ").trim();
}

/* ────────────────────────────────────────────────────────────────────
 * CITING A LONG RULE INSTEAD OF TRANSCRIBING IT (T-225-s2, taking
 * `T-215-s4`).
 *
 * TWO PASSAGES IN THIS COMMAND'S ANSWER ARE SCREENS OF PROSE AND BOTH ARE
 * FUNCTIONS OF A DOCUMENT RATHER THAN OF THE CARD: docs/CONVENTIONS.md's
 * THE LANE PROTOCOL bullet, and method/lane-protocol.md's rule four.
 * Measured at `09526da` on this repository, flattened and rendered the way
 * this command renders them, they were 10,155 and 13,078 bytes — 23,233 of
 * an 82,476-byte `--task --state --full` answer against a 65,536-byte
 * line. **THE ROW SET GROWS WITH THE DOCUMENTS**, so every correction to
 * either bullet pushed that arm further past a buffer, and the growth is
 * not a function of the card the brief is about.
 *
 * **THE REPLACEMENT IS AN ADDRESS AND NOT A SUMMARY**, which is the whole
 * of why it is allowed here. `docs/CONVENTIONS.md`'s A CITATION NAMES A
 * SYMBOL, NOT A LINE asks for a path plus something searchable, and this
 * emits exactly that: the file, the passage's own ordinal or capitals, the
 * flattened SIZE at this ref so a reader knows what they are being sent
 * for, and a command that finds it. Nothing is paraphrased, because
 * nothing is restated at all — the brief contract's *"a brief is a
 * TRANSCRIPTION, not a summary"* bans the middle option, and this is the
 * far side of it rather than the middle.
 *
 * **THE NEEDLE IS CONSTRUCTED AGAINST THE HARD WRAP, NEVER TYPED.** Every
 * governing document here is wrapped at about 70 columns, so a phrase
 * search is a search for a line break nobody chose (`docs/CONVENTIONS.md`,
 * A MISS IS NOT A REFUTATION, cause THREE). The needle is therefore
 * EXTENDED word by word only while the RAW file still contains it: what is
 * printed is findable by construction rather than by luck, and a reflow
 * shortens the needle instead of breaking it.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The longest prefix of `opening` that the RAW document still contains, so
 * the command this module prints cannot be defeated by a line break.
 *
 * A word carrying a backtick or a double quote ends the extension: the
 * needle is spent inside a shell string, and `docs/CONVENTIONS.md`'s NEVER
 * PUT A BACKTICK INSIDE A SHELL STRING is a rule about the syscall rather
 * than about the intent.
 *
 * @param {string} raw      the document as it sits on disk, wrapped
 * @param {string} opening  the flattened opening this cites
 * @returns {string}
 */
export function findableNeedle(raw, opening) {
  const words = opening.split(" ").filter((w) => w !== "");
  if (words.length === 0) {
    throw new Error(
      "dispatch-brief: a citation was asked for a needle out of an empty opening — a citation " +
        "with nothing to search for is worse than the transcription it replaced.",
    );
  }
  let best = "";
  for (let i = 1; i <= Math.min(words.length, 12); i += 1) {
    const word = /** @type {string} */ (words[i - 1]);
    if (word.includes("`") || word.includes('"')) break;
    const candidate = words.slice(0, i).join(" ");
    if (!raw.includes(candidate)) break;
    best = candidate;
  }
  if (best === "") {
    throw new Error(
      `dispatch-brief: no prefix of ${JSON.stringify(opening.slice(0, 60))} occurs in the ` +
        "document it was read from, so this citation would send a reader to a phrase that is " +
        "not there.",
    );
  }
  return best;
}

/**
 * The opening SYMBOL of a rule or bullet: its own leading run, up to the
 * first sentence end or em dash, with the markdown scaffolding removed.
 *
 * @param {string} flat  the flattened passage
 * @returns {string}
 */
export function citedOpening(flat) {
  const stripped = flat
    .replace(/^\d+[a-z]?\.\s*/, "")
    .replace(/^-\s*/, "")
    .replace(/\*\*/g, "")
    .trim();
  const cut = /^(.*?)(?:\.\s|\s—\s|$)/.exec(stripped);
  const head = (cut === null ? stripped : /** @type {string} */ (cut[1])).trim();
  return (head === "" ? stripped : head).slice(0, 150).trim();
}

/**
 * One cited passage, as the stamped value that stands where its
 * transcription stood.
 *
 * @param {Ctx} ctx
 * @param {{ label: string, source: string, file: string, raw: string, flat: string }} opts
 * @returns {Rec}
 */
function citedRule(ctx, opts) {
  const flat = opts.flat.replace(/\s+/g, " ").trim();
  if (flat === "") {
    throw new Error(
      `dispatch-brief: ${opts.source} read as empty, so this row would cite a passage that is ` +
        "not there. A citation of nothing is the one thing worse than a transcription.",
    );
  }
  const opening = citedOpening(flat);
  const needle = findableNeedle(opts.raw, opening);
  return value(
    `${opts.label}: CITED, NOT TRANSCRIBED (T-225-s2) — ${opts.source}, ` +
      `${Buffer.byteLength(flat, "utf8")} bytes flattened at this ref, opening ` +
      `${JSON.stringify(opening)}. READ IT: command grep -n "${needle}" ${opts.file}`,
    tree(ctx, opts.source),
  );
}

/**
 * A `## `-delimited section of a markdown file, raw.
 *
 * @param {string} md
 * @param {string} heading
 * @returns {string}
 */
export function section(md, heading) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) {
    throw new Error(
      `dispatch-brief: no section headed ${JSON.stringify(heading)} — this module quotes that ` +
        "section rather than restating it, so a renamed heading is a hard failure.",
    );
  }
  /** @type {string[]} */
  const held = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (/^#{1,2} /.test(line)) break;
    held.push(line);
  }
  return held.join("\n").trim();
}

/**
 * An INDENTED sub-bullet of a collapsed CONVENTIONS bullet, found by a
 * phrase it carries. `rawBullet` splits on column-zero `- ` only, so the
 * lane bullet's own sub-bullets arrive inside it.
 *
 * @param {string} bullet
 * @param {string} phrase
 * @returns {string}
 */
export function subBullet(bullet, phrase) {
  const parts = bullet
    .split(/\n(?=\s+- )/)
    .map((p) => p.replace(/\s+/g, " ").trim().replace(/^- /, ""))
    .filter((p) => p.includes(phrase));
  if (parts.length !== 1) {
    throw new Error(
      `dispatch-brief: ${parts.length} sub-bullets carry ${JSON.stringify(phrase)}, expected ` +
        "exactly one.",
    );
  }
  return /** @type {string} */ (parts[0]);
}

/* ────────────────────────────────────────────────────────────────────
 * The lane list — a LIVE fact, filtered on the BRANCH.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} WorktreeEntry
 * @property {string} path
 * @property {string} head
 * @property {string} branch  the full ref, or "" for a detached entry
 * @property {boolean} bare   git's own `bare` marker — a repository with NO working tree
 */

/**
 * `git worktree list --porcelain`, parsed. PURE — it takes the text, so
 * the pin that drives a detached worktree at a lane-shaped path can feed
 * it a fixture without creating one on disk.
 *
 * THE `bare` MARKER IS READ AND NOT DROPPED (T-179). It is the one shape
 * in which the first entry names a directory that is NOT a working tree,
 * and `mainWorktree` below has to be able to refuse rather than hand back
 * a repository directory as though it were a checkout.
 *
 * @param {string} porcelain
 * @returns {WorktreeEntry[]}
 */
export function parseWorktreePorcelain(porcelain) {
  /** @type {WorktreeEntry[]} */
  const out = [];
  /** @type {WorktreeEntry | undefined} */
  let cur;
  for (const line of porcelain.split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
      if (cur !== undefined) out.push(cur);
      cur = { path: line.slice("worktree ".length).trim(), head: "", branch: "", bare: false };
      continue;
    }
    if (cur === undefined) continue;
    if (line.startsWith("HEAD ")) cur.head = line.slice("HEAD ".length).trim();
    else if (line.startsWith("branch ")) cur.branch = line.slice("branch ".length).trim();
    else if (line.trim() === "bare") cur.bare = true;
  }
  if (cur !== undefined) out.push(cur);
  return out;
}

/**
 * @typedef {object} MainWorktree
 * @property {string} path    the repository's main working tree, or "" when it could not be derived
 * @property {string} reason  why it could not be derived — "" when it could
 * @property {string} via     the command that answered, for the provenance
 */

/**
 * THE REPOSITORY'S OWN ROOT — the MAIN worktree, never the checkout this
 * command happens to have run in (T-179).
 *
 * ── THE DEFECT THIS EXISTS TO REMOVE ─────────────────────────────────
 * `docs/CONVENTIONS.md` publishes the lane worktree as `../supertaskr-T-NNN`,
 * a RELATIVE path. Row 4 resolved it against `ctx.root` — the checkout the
 * command ran in — and printed the answer under the heading "absolute, per
 * lane-protocol rule three". From the integration checkout that lands on
 * the intended sibling. From a NESTED worktree it lands one level inside
 * `.claude/worktrees/`, which is the case rule three exists to forbid, and
 * the row announced the rule while breaking it. The architect/integrator
 * seat runs from a nested worktree by construction in this harness, so
 * every brief that seat emitted on 2026-08-30 carried the wrong path;
 * FOUR executors read it, four reported it, and the dispatching seat
 * corrected each by hand. A lane is a sibling of the REPOSITORY, not of
 * whoever dispatched it.
 *
 * ── WHY THE PORCELAIN'S FIRST ENTRY AND NOT `--git-common-dir` ────────
 * Both were measured on this repository from all three checkout shapes
 * (integration, nested worktree, lane) and both answered
 * `/Users/ujju/Projects/supertaskr`. The porcelain wins on three counts.
 * It is GIT'S OWN ANSWER rather than a derivation from one — git-worktree(1)
 * lists the main working tree first, by contract, while the parent of
 * `--git-common-dir` is a guess that holds only where `.git` is a
 * directory at the top of the main worktree and is WRONG under
 * `git init --separate-git-dir`, under an exported `GIT_DIR`, and for a
 * bare repository. It SAYS `bare` instead of quietly handing back a
 * directory that has no working tree. And `context()` ALREADY reads it —
 * `ctx.porcelain` — so this costs no new git call, no new failure mode,
 * and row 4's base is derived from the same text row 5's lane list is,
 * which means the two rows cannot disagree about where the repository is.
 *
 * PURE, and it takes the text: every refusal below is drivable from a
 * fixture rather than from a checkout somebody has to build.
 *
 * @param {string} porcelain
 * @returns {MainWorktree}
 */
export function mainWorktree(porcelain) {
  const via = "git worktree list --porcelain, first entry — git lists the MAIN worktree first";
  const entries = parseWorktreePorcelain(porcelain);
  const first = entries[0];
  if (first === undefined || first.path === "") {
    return {
      path: "",
      reason:
        "`git worktree list --porcelain` named no worktree, so this command cannot tell where the " +
        "repository's own root is. It will not fall back to the checkout it ran in: that fallback " +
        "is the defect T-179 removed.",
      via,
    };
  }
  if (first.bare) {
    return {
      path: "",
      reason:
        `the repository's first worktree entry (${first.path}) is BARE, so the repository has no ` +
        "main working tree for a sibling path to be a sibling OF.",
      via,
    };
  }
  return { path: first.path, reason: "", via };
}

/**
 * Does `candidate` lie INSIDE `root`? The containment test lane-protocol
 * rule three is about, spelled the way `docs-scan.mjs` already spells it
 * for the DOCS GATE's own root check — one relative path, and a `..`
 * segment or an absolute answer means it escaped.
 *
 * The root ITSELF counts as inside: rule three asks for a SIBLING
 * directory, and the repository is not a sibling of itself.
 *
 * @param {string} root
 * @param {string} candidate
 * @returns {boolean}
 */
export function insideRepository(root, candidate) {
  const rel = path.relative(path.resolve(root), path.resolve(candidate));
  if (rel === "") return true;
  if (path.isAbsolute(rel)) return false;
  return rel !== ".." && !rel.startsWith(`..${path.sep}`);
}

/**
 * The branch and worktree SPELLINGS, read off the project's own lane
 * bullet rather than typed here — so the filter below cannot drift from
 * the pattern the project publishes.
 *
 * @typedef {object} LaneSpellings
 * @property {string} integrationBranch
 * @property {string} branchPattern
 * @property {string} worktreePattern
 * @property {string} createCommand
 * @property {RegExp} branchRe   matches a full `refs/heads/...` ref, capturing the task number
 */

/** @param {string} conventionsMd @returns {LaneSpellings} */
export function laneSpellings(conventionsMd) {
  const bullet = rawBullet(conventionsMd, "THE LANE PROTOCOL").replace(/\s+/g, " ");
  /**
   * The label must not be the TAIL of a longer one — "integration
   * branch" ends in "branch", and reading the integration branch as the
   * lane pattern is exactly the kind of near-miss a brief assembled from
   * memory makes. The lookbehind is the whole guard, and two matches
   * throw for the same reason zero does.
   *
   * @param {string} label
   * @returns {string}
   */
  const backticked = (label) => {
    const found = [
      ...bullet.matchAll(new RegExp(`(?<![A-Za-z]\\s)${label} \`([^\`]+)\``, "g")),
    ].map((m) => /** @type {string} */ (m[1]));
    if (found.length !== 1) {
      throw new Error(
        `dispatch-brief: the lane bullet spells ${JSON.stringify(label)} followed by a backticked ` +
          `name ${found.length} times, expected exactly one. Every lane spelling in this module is ` +
          "READ from that bullet; a missing or ambiguous one is a hard failure, never a default.",
      );
    }
    return /** @type {string} */ (found[0]);
  };
  const integrationBranch = backticked("integration branch");
  const branchPattern = backticked("branch");
  const worktreePattern = backticked("worktree");
  const createCommand = backticked("Created with");
  const idToken = "T-NNN";
  if (!branchPattern.includes(idToken)) {
    throw new Error(
      `dispatch-brief: the published branch pattern ${JSON.stringify(branchPattern)} carries no ` +
        `${idToken} placeholder, so this module cannot derive a branch filter from it.`,
    );
  }
  // The pattern is turned into a matcher by replacing the two
  // placeholders the document uses and escaping everything else. The
  // filter is therefore the published spelling, not a copy of it.
  const escaped = branchPattern.replace(/[.*+?^${}()|\\]/g, "\\$&");
  // `task/T-153-s5-clock-...` is ambiguous under the published
  // `task/T-NNN-<slug>`: id T-153 with slug `s5-clock-...`, or id
  // T-153-s5 with slug `clock-...`. The board's id vocabulary
  // (tasks/TASK-FORMAT.md) makes suffixed ids real cards, so the
  // matcher prefers the suffixed reading — the unsuffixed one joined a
  // lane to its PARENT card and printed the parent's fence as the
  // lane's (T-143's class, seen live at the T-153-s2 lane, whose
  // manifest carried T-153's fence for its whole run).
  const source = `^refs/heads/${escaped
    .replace(idToken, "T-(\\d+(?:-s\\d+)?)")
    .replace("<slug>", ".+")}$`;
  return {
    integrationBranch,
    branchPattern,
    worktreePattern,
    createCommand,
    branchRe: new RegExp(source),
  };
}

/**
 * @typedef {object} Lane
 * @property {string} taskId
 * @property {string} branch
 * @property {string} path
 * @property {string} head
 */

/**
 * THE LANE LIST. A lane is an entry ON A TASK BRANCH — never an entry at
 * a lane-shaped PATH. A detached worktree named after a card is not a
 * lane and holds no fence, and one sat beside its own lane on the night
 * this card was written, so the distinction is the card's first
 * criterion rather than a nicety.
 *
 * @param {string} porcelain
 * @param {LaneSpellings} spellings
 * @returns {Lane[]}
 */
export function laneWorktrees(porcelain, spellings) {
  /** @type {Lane[]} */
  const lanes = [];
  for (const entry of parseWorktreePorcelain(porcelain)) {
    if (entry.branch === "") continue;
    const m = spellings.branchRe.exec(entry.branch);
    if (m === null) continue;
    lanes.push({
      taskId: `T-${/** @type {string} */ (m[1])}`,
      branch: entry.branch,
      path: entry.path,
      head: entry.head,
    });
  }
  return lanes.sort((a, b) => a.taskId.localeCompare(b.taskId));
}

/**
 * THE CANDIDATE SPELLINGS OF ONE BRANCH, IN THE ORDER A CHECKOUT SHOULD
 * BE ASKED FOR THEM (T-153-s9). The project publishes ONE integration
 * branch name and that name is right; what is not guaranteed is that the
 * checkout this command runs in holds it as a LOCAL branch.
 *
 * THE BARE NAME IS FIRST AND THAT ORDERING IS THE WHOLE SAFETY PROPERTY.
 * Where the local branch exists — every developer checkout, every
 * `push`-event runner — the first candidate resolves and this module
 * spends exactly the revision it always spent, so nothing the derivations
 * prove on such a checkout is weakened by the fallbacks behind it. A
 * remote-tracking ref can sit at a DIFFERENT commit from the local branch
 * of the same name; preferring it would silently answer a question about
 * this checkout with a fact about the remote.
 *
 * **AND THIS LIST HAS A SECOND CONSUMER THAT IS A GUARD, SO THE ORDER IS
 * A GUARD SURFACE TOO** (`T-223`). `.claude/hooks/landing-gate.mjs`
 * carries a hook-budget copy of this function, spends it to decide WHICH
 * commit's card declares a lane's fence, and `landing-gate.spec.ts`'s
 * *"the integration-ref candidates are dispatch-brief's, spelling for
 * spelling"* pins the two lists together — so a reorder here is a
 * reorder there, and it moves what that gate enforces. `T-223` weighed
 * putting `refs/remotes/origin/<branch>` first, because a lane can move
 * the LOCAL ref with `git update-ref` where `git branch -f` refuses it,
 * and REFUSED the reorder: measured at git 2.50.1, `git update-ref
 * refs/remotes/origin/<branch>` and a plain `git fetch .
 * +<sha>:refs/remotes/origin/<branch>` both exit 0 from inside a lane
 * worktree, so a remote-tracking ref carries no checked-out-elsewhere
 * guard at all and the reorder would trade a partly-guarded ref for an
 * unguarded one. The account, and the widening route it would have
 * broken, are in that hook's header; the ordering above is unchanged and
 * is now load-bearing for both readers.
 *
 * @param {string} branch
 * @returns {string[]}
 */
export function integrationRefCandidates(branch) {
  return [branch, `origin/${branch}`, `refs/remotes/origin/${branch}`];
}

/**
 * @typedef {object} IntegrationRef
 * @property {string} rev     the revision THIS checkout can actually spend
 * @property {string} commit  what it resolves to at the moment it was asked
 * @property {string[]} tried every candidate in order, so a refusal names them
 */

/**
 * THE INTEGRATION REF, RESOLVED RATHER THAN ASSUMED (T-153-s9).
 *
 * ── THE MEASUREMENT ──────────────────────────────────────────────────
 * `actions/checkout` on a `pull_request` event leaves the workspace
 * DETACHED at the PR's merge ref and creates no local branch. The name
 * `main` — a local branch in every developer checkout and on a
 * push-to-main runner — then resolves to nothing, and the bare-revision
 * read below died with `fatal: ambiguous argument 'main'` on TWENTY-NINE
 * e2e bodies that were green at the same body index on the same
 * repository's push run. The spelling was never wrong; its RESOLUTION is
 * event-dependent, which is why no local run and no push run had seen it.
 *
 * **THAT IS NOT A CI DETAIL — IT IS THE ONE INSTRUMENT A LANE HAS.**
 * `ci.yml` triggers on push-to-main, on `pull_request` and on
 * `workflow_dispatch`; a lane may not push main, so a draft PR is the CI
 * a dispatch brief hands an executor. A derivation that only works on the
 * event a lane cannot fire manufactures reds the merge will not
 * reproduce, which docs/CONVENTIONS.md's RANGE RULE calls the worse of
 * its two failures — arriving through CI instead of through a diff.
 *
 * ── WHY A RESOLVER AND NOT A SECOND SPELLING ─────────────────────────
 * `origin/main` written at the read site would fix the PR run and break
 * every checkout with no remote — a fresh `git init` fixture, a clone
 * whose remote is named something else, this repository before its first
 * push. The question is not which name is right; it is which name THIS
 * CHECKOUT HOLDS, and that is a live fact to be READ. One resolver, at
 * the one place the log is read, rather than a fix per call site (T-057).
 *
 * ── AND IT REFUSES RATHER THAN INVENTS ───────────────────────────────
 * Where no candidate resolves, this throws by name and the wrapper turns
 * that into the house's COULD-NOT-RUN code — the same four-code
 * discipline `index --check`, `boot:check` and the DOCS GATE keep, so "I
 * derived it" and "I could not tell you" are never the same number. A
 * fallback that quietly answered with HEAD would give a brief a base
 * commit off the lane's own branch, and lane-protocol rule 2 wants that
 * hash precisely because a wrong one is invisible.
 *
 * @param {string} root
 * @param {string} branch
 * @returns {IntegrationRef}
 */
export function resolveIntegrationRef(root, branch) {
  const tried = integrationRefCandidates(branch);
  for (const rev of tried) {
    // `--verify --quiet` answers with a code and no stderr, and
    // `^{commit}` refuses a ref that is not a commit rather than handing
    // back a tag or a tree object for `git log` to fail on later.
    const probe = spawnSync("git", ["-C", root, "rev-parse", "--verify", "--quiet", `${rev}^{commit}`], {
      encoding: "utf8",
    });
    if (probe.error !== undefined) throw probe.error;
    const out = (probe.stdout ?? "").trim();
    if (probe.status === 0 && /^[0-9a-f]{40}$/.test(out)) return { rev, commit: out, tried };
  }
  throw new Error(
    `dispatch-brief: this checkout holds no revision spelling the integration branch ` +
      `${JSON.stringify(branch)} — asked git rev-parse --verify for ${tried.join(", ")} and it ` +
      "resolved none of them. The base commit, the tip and the history counts are all reads of " +
      "that branch, so this command has no answer to give and will not substitute HEAD or any " +
      "other revision for it.",
  );
}

/**
 * THE TWO FIGURES ROW 4 TAKES FROM THE INTEGRATION BRANCH — the base
 * commit and the tip — out of ONE read of that branch. **Both are LIVE
 * facts.** They are reads of a MUTABLE REF, so neither is a function of
 * the tree the rest of the brief is stamped at: re-derive them at that
 * ref and you get different commits. Measured rather than argued — the
 * integration branch moved FOUR times while this card was built, twice
 * inside one verification pass, and the same command in the same checkout
 * at the same HEAD printed different values under an identical stamp.
 * **A figure carrying a ref that does not determine it is worse than a
 * bare figure**, which is this card's own argument; row 4's base is the
 * hash that feeds `git worktree add`, and lane-protocol rule 2 asks for a
 * hash there precisely because "latest" names a different commit for
 * every reader.
 *
 * PURE, and separated from the read for the same reason
 * `laneWorktrees(porcelain, spellings)` is: the pin drives one ctx at ONE
 * ref through TWO reads of the branch, which is the only way to show that
 * these figures move while the ref they would be stamped at does not.
 *
 * @param {string} logText  `git log --first-parent --format=%H %s <branch>`
 * @param {string} branch
 * @returns {{ tip: string, base: string }}
 */
export function integrationRefs(logText, branch) {
  const lines = logText.split(/\r?\n/).filter((l) => l.trim() !== "");
  const first = lines[0] ?? "";
  if (!/^[0-9a-f]{40} /.test(first)) {
    throw new Error(
      `dispatch-brief: the first-parent log of ${branch} does not open with a line of the shape ` +
        "`<40 hex> <subject>`, so this module cannot read a tip or a base from it. An empty read " +
        "here would print an empty hash into a `git worktree add` command.",
    );
  }
  const checkpoint = lines.find((l) => l.slice(41).startsWith("Checkpoint:"));
  if (checkpoint === undefined) {
    throw new Error(
      `dispatch-brief: no "Checkpoint:" commit on ${branch} — the base rule names one, and this ` +
        "module will not substitute a different commit for it.",
    );
  }
  return { tip: first.slice(0, 40), base: checkpoint.slice(0, 40) };
}

/**
 * THE COMMIT A LIVE LANE WAS ACTUALLY CUT AT, read out of the repository
 * rather than out of this render (T-300-s7, absorbing T-311-s6).
 *
 * ── THE DEFECT THIS ANSWERS ──────────────────────────────────────────
 * Row 4 printed the newest `Checkpoint:` commit under the label `base
 * commit:` while the arm's own step 4 cut the lane at the integration
 * checkout's HEAD **after the dispatch stamp** — a different commit
 * whenever the stamp wrote one, and a different commit again whenever the
 * stamp wrote nothing and the checkout's tip had moved past the
 * checkpoint. So one brief carried two commits called the base and the
 * executor had to resolve it by reading the repository. The base rule
 * PERMITS that cut; what it does not permit is quoting the rule's anchor
 * as if it were the cut.
 *
 * ── WHY THE MERGE BASE AND NOT A RECORDED FIELD ──────────────────────
 * The cut is a fact about the lane's BRANCH, and the branch carries it:
 * the lane is cut with `git worktree add -b <branch> <base>` and never
 * merges the integration branch back into itself, so the newest commit
 * the two share IS the commit the cut used. That answer does not move
 * when the lane commits, and it does not move when the integration branch
 * advances — which is exactly what a brief rendered a second time has to
 * survive. A field written into a file at dispatch would have to be
 * trusted; this is re-derivable by one command, and the row prints that
 * command as its provenance.
 *
 * It is a LIVE fact for the reason every other figure row 4 takes off the
 * integration branch is: it is a read of two mutable refs, so it carries
 * the time and host it was read at and never a commit ref.
 *
 * @param {string} root
 * @param {string} branch the lane's own ref, as the worktree porcelain spells it
 * @param {string} integrationRef the revision this checkout spells the integration branch with
 * @returns {string | null} the 40-hex cut, or null where this checkout cannot answer
 */
export function laneCutCommit(root, branch, integrationRef) {
  const probe = spawnSync("git", ["-C", root, "merge-base", branch, integrationRef], {
    encoding: "utf8",
  });
  if (probe.error !== undefined && probe.error !== null) return null;
  const out = (probe.stdout ?? "").trim();
  return probe.status === 0 && /^[0-9a-f]{40}$/.test(out) ? out : null;
}

/**
 * @typedef {object} BaseVerdict
 * @property {string} tip
 * @property {string} checkpoint  the newest `Checkpoint:` commit — the rule's ANCHOR
 * @property {string | null} cut  the commit a live lane was cut at, where there is one
 * @property {string} base        what row 4 calls the base: the cut where there is one
 * @property {boolean} coincide   the cut and the anchor are the SAME commit
 * @property {string} why         why this base is the one the base rule admits
 * @property {string | null} finding  a cut the base rule does NOT admit
 */

/**
 * WHICH COMMIT ROW 4 CALLS THE BASE, AND WHY — the pure half.
 *
 * The condition on the coincidence line is `cut === checkpoint` and
 * nothing else (the amendment of 2026-09-13, superseding the absorbed
 * card's "no stamp follows the checkpoint"). The two are not the same
 * question: an arm that writes no stamp because the card already carries
 * every stamped field still cuts at the integration checkout's HEAD, and
 * where that HEAD has moved past the checkpoint the cut and the anchor
 * are DIFFERENT commits while no stamp was written at all.
 *
 * @param {{ logText: string, branch: string, cut: string | null }} opts
 * @returns {BaseVerdict}
 */
export function baseVerdict({ logText, branch, cut }) {
  const { tip, base: checkpoint } = integrationRefs(logText, branch);
  if (cut === null) {
    return {
      tip,
      checkpoint,
      cut: null,
      base: checkpoint,
      coincide: false,
      why:
        "no lane worktree is cut for this card in this checkout, so there is no cut to name and " +
        "the base above is the rule's ANCHOR rather than a report of one: a dispatch that stamps " +
        "the card cuts at the commit its own stamp makes, which is later than this.",
      finding: null,
    };
  }
  if (cut === checkpoint) {
    return {
      tip,
      checkpoint,
      cut,
      base: cut,
      coincide: true,
      why:
        "the cut and the rule's anchor are ONE commit here — the lane was cut at the newest " +
        "`Checkpoint:` itself — so nothing later had to qualify.",
      finding: null,
    };
  }
  const lines = logText.split(/\r?\n/).filter((l) => l.trim() !== "");
  const cutAt = lines.findIndex((l) => l.startsWith(`${cut} `));
  const anchorAt = lines.findIndex((l) => l.startsWith(`${checkpoint} `));
  if (cutAt < 0) {
    return {
      tip,
      checkpoint,
      cut,
      base: cut,
      coincide: false,
      why:
        `the cut is not on ${branch}'s first-parent line at all, so the base rule's own argument ` +
        "for a later commit — that it carries the checkpoint's graph — cannot be made about it.",
      finding:
        `the lane for this card was cut at ${cut}, which is not a first-parent commit of ` +
        `${branch}. The base rule's permission for a commit later than the checkpoint rests on ` +
        "that commit carrying the checkpoint's regenerated graph, and a commit off the " +
        "first-parent line carries no such guarantee.",
    };
  }
  const subject = (lines[cutAt] ?? "").slice(41);
  const distance = anchorAt - cutAt;
  if (distance <= 0) {
    return {
      tip,
      checkpoint,
      cut,
      base: cut,
      coincide: false,
      why:
        `the cut sits ${String(-distance)} commit(s) BEHIND the newest \`Checkpoint:\` on ` +
        `${branch}, so it is an older commit rather than a later one and the base rule's ` +
        "permission does not reach it.",
      finding:
        `the lane for this card was cut at ${cut}, which is OLDER than the newest \`Checkpoint:\` ` +
        `commit ${checkpoint} on ${branch}. A lane cut behind the checkpoint carries a graph the ` +
        "checkpoint has since regenerated, which is the red the base rule exists to prevent.",
    };
  }
  const merge = subject.startsWith("Merge ");
  return {
    tip,
    checkpoint,
    cut,
    base: cut,
    coincide: false,
    // THE REASON IS DERIVED FROM THE COMMIT — how far past the anchor it
    // sits and whether it is a merge — and it does NOT quote that commit's
    // subject. The subject is the one thing here that is a message rather
    // than a fact about the history, and a brief value that moved with it
    // would move between two dispatches of one card that differ in nothing
    // else (the end-to-end ritual body compares exactly that). The
    // FINDING below quotes it, because a refusal has to say what it saw.
    why: merge
      ? `the cut is ${String(distance)} commit(s) newer than the anchor on ${branch}'s ` +
        "first-parent line and is a MERGE commit, which lane-protocol rule two bans by name."
      : `the cut is ${String(distance)} commit(s) newer than the anchor on ${branch}'s ` +
        "first-parent line and is not a merge commit, which is what the base rule admits: a " +
        "non-merge commit later than the checkpoint carries the checkpoint's graph, and is " +
        "trusted for its OWN green gates rather than for being a checkpoint — a claim this row " +
        "states and does not measure.",
    finding: merge
      ? `the lane for this card was cut at ${cut}, whose subject is ${JSON.stringify(subject)} — a ` +
        `MERGE commit on ${branch}. method/lane-protocol.md rule two bans exactly that: a merge ` +
        "commit carries a graph the checkpoint has not regenerated yet, so a lane cut from one " +
        "inherits a red gate it did not cause and its fence usually forbids it to fix."
      : null,
  };
}

/* ────────────────────────────────────────────────────────────────────
 * Cards, components and the fence.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} Card
 * @property {string} id
 * @property {string} file
 * @property {string} title
 * @property {Record<string, string | string[]>} fields
 */

/** Every live task card, keyed by the id in its own frontmatter. */
/** @param {string} root @returns {Map<string, Card>} */
export function cardIndex(root = repoRoot) {
  /** @type {Map<string, Card>} */
  const out = new Map();
  for (const entry of liveTaskCards(root)) {
    const fields = frontmatterFields(entry.content);
    const id = fieldScalar(fields, "id");
    if (id === "") continue;
    if (out.has(id)) {
      throw new Error(
        `dispatch-brief: two live cards declare id ${id} — a fence derived from an ambiguous ` +
          "id is a fence about the wrong card.",
      );
    }
    out.set(id, { id, file: entry.path, title: fieldScalar(fields, "title"), fields });
  }
  return out;
}

/**
 * @typedef {object} Component
 * @property {string} id
 * @property {string} file
 * @property {string[]} slugs
 * @property {string[]} paths
 */

/** @param {string} root @returns {Component[]} */
export function components(root = repoRoot) {
  const dir = "docs/architecture/components";
  return trackedFiles(root)
    .filter((rel) => rel.startsWith(`${dir}/`) && /\/C-[^/]+\.md$/.test(rel))
    .map((rel) => {
      const fields = frontmatterFields(readDoc(rel, root));
      return {
        id: fieldScalar(fields, "id"),
        file: rel,
        slugs: fieldList(fields, "touch_slugs"),
        paths: fieldList(fields, "paths"),
      };
    })
    .filter((c) => c.id !== "");
}

/**
 * THE SLUG MAP, from the authoritative side: each component file's own
 * `touch_slugs:` FIELD. Row 5 rules this over the architecture doc's
 * prose block, "because the block is prose that goes stale the day a
 * component is added" — and it has, twice.
 *
 * @param {Component[]} comps
 * @returns {Map<string, string[]>}
 */
export function slugMapFromFields(comps) {
  /** @type {Map<string, string[]>} */
  const map = new Map();
  for (const c of comps) {
    for (const slug of c.slugs) {
      const held = map.get(slug) ?? [];
      held.push(c.id);
      map.set(slug, held);
    }
  }
  for (const [slug, ids] of map) map.set(slug, ids.sort());
  return new Map([...map].sort((a, b) => a[0].localeCompare(b[0])));
}

/**
 * THE SAME MAP off the architecture doc's prose block — the copy row 5
 * rules NON-authoritative. Derived so the two can be compared; a
 * divergence is a finding and never a silent preference.
 *
 * @param {string} archMd
 * @returns {Map<string, string[]>}
 */
export function slugMapFromProse(archMd) {
  /** @type {Map<string, string[]>} */
  const map = new Map();
  for (const line of archMd.split(/\r?\n/)) {
    if (!line.startsWith("    ")) continue;
    for (const m of line.matchAll(/([a-z][a-z-]*)\s+->\s+((?:C-\d+)(?:,\s*C-\d+)*)/g)) {
      const slug = /** @type {string} */ (m[1]);
      const ids = /** @type {string} */ (m[2]).split(",").map((s) => s.trim());
      map.set(slug, ids.sort());
    }
  }
  return new Map([...map].sort((a, b) => a[0].localeCompare(b[0])));
}

/**
 * A fence entry expanded to the path set it reserves. A slug expands
 * through the authoritative map to its components' declared `paths:`; a
 * path entry is itself. Everything is compared as a PREFIX, which is how
 * `docs/architecture/components/` fences a directory.
 *
 * @param {string} entry
 * @param {Map<string, string[]>} slugs
 * @param {Component[]} comps
 * @returns {{ entry: string, kind: string, paths: string[] }}
 */
export function expandFenceEntry(entry, slugs, comps) {
  const ids = slugs.get(entry);
  if (ids === undefined) return { entry, kind: "path", paths: [entry] };
  /** @type {string[]} */
  const paths = [];
  for (const c of comps) {
    if (!ids.includes(c.id)) continue;
    for (const p of c.paths) paths.push(p);
  }
  return { entry, kind: "slug", paths: [...new Set(paths)].sort() };
}

/** @param {string} a @param {string} b @returns {boolean} */
function pathsOverlap(a, b) {
  const na = a.replace(/\*+$/, "").replace(/\/$/, "");
  const nb = b.replace(/\*+$/, "").replace(/\/$/, "");
  if (na === nb) return true;
  return na.startsWith(`${nb}/`) || nb.startsWith(`${na}/`);
}

/**
 * @typedef {object} FenceOverlap
 * @property {string} left
 * @property {string} right
 * @property {string} why
 */

/**
 * Are two fences disjoint? Checked as SETS on both faces — the declared
 * entries and the paths they expand to — because two fences naming
 * different slugs can still claim the same component, which is exactly
 * how `app-board` and `app-shell` were never disjoint.
 *
 * @param {{ id: string, entries: string[] }} a
 * @param {{ id: string, entries: string[] }} b
 * @param {Map<string, string[]>} slugs
 * @param {Component[]} comps
 * @returns {FenceOverlap[]}
 */
export function fenceOverlaps(a, b, slugs, comps) {
  /** @type {FenceOverlap[]} */
  const found = [];
  for (const ea of a.entries) {
    const xa = expandFenceEntry(ea, slugs, comps);
    for (const eb of b.entries) {
      const xb = expandFenceEntry(eb, slugs, comps);
      if (ea === eb) {
        found.push({ left: `${a.id} ${ea}`, right: `${b.id} ${eb}`, why: "the same entry" });
        continue;
      }
      for (const pa of xa.paths) {
        for (const pb of xb.paths) {
          if (!pathsOverlap(pa, pb)) continue;
          found.push({
            left: `${a.id} ${ea}`,
            right: `${b.id} ${eb}`,
            why: `both reserve ${pa === pb ? pa : `${pa} and ${pb}`}`,
          });
        }
      }
    }
  }
  return found;
}

/* ────────────────────────────────────────────────────────────────────
 * Records — the only way a figure leaves this module.
 * ──────────────────────────────────────────────────────────────────── */

/** @typedef {{ kind: "tree", ref: string, via: string }} TreeProv */
/** @typedef {{ kind: "live", at: string, host: string, via: string }} LiveProv */
/** @typedef {TreeProv | LiveProv} Prov */

/**
 * @typedef {{ kind: "note", text: string }
 *   | { kind: "blank" }
 *   | { kind: "value", text: string, prov: Prov }} Rec
 */

/** A TREE fact: a count, a hash, a path list, a range. Carries its ref. */
/** @param {string} ref @param {string} via @returns {TreeProv} */
export function treeProv(ref, via) {
  if (typeof ref !== "string" || ref === "" || typeof via !== "string" || via === "") {
    throw new Error(
      `dispatch-brief: a tree provenance needs a ref and a source, and got ${String(JSON.stringify(ref))} ` +
        `with ${String(JSON.stringify(via))}`,
    );
  }
  return { kind: "tree", ref, via };
}

/**
 * A LIVE-ENVIRONMENT fact: a worktree, a pid, a port holder. Carries the
 * time and host it was READ at and never a commit, because it is not a
 * function of a tree — `executor.md`'s figure rule names this exception
 * rather than tripping over it.
 *
 * @param {string} at
 * @param {string} host
 * @param {string} via
 * @returns {LiveProv}
 */
export function liveProv(at, host, via) {
  if (
    typeof at !== "string" ||
    at === "" ||
    typeof host !== "string" ||
    host === "" ||
    typeof via !== "string" ||
    via === ""
  ) {
    throw new Error(
      "dispatch-brief: a live provenance needs a time, a host and a source, and got " +
        `${String(JSON.stringify(at))} on ${String(JSON.stringify(host))} via ${String(JSON.stringify(via))}`,
    );
  }
  return { kind: "live", at, host, via };
}

/**
 * The stamp. Twelve hex characters name the commit unambiguously on a
 * repository this size and keep the line readable; the FULL ref is
 * printed once, as its own stamped value, at the top of every report.
 *
 * THE VOCABULARY IS CLOSED, and it is closed here rather than trusted.
 * This was a ternary, so every kind that was not exactly `"tree"` went
 * down the LIVE branch: the realistic authoring slip — an object literal
 * instead of the constructor — rendered
 * `<- read undefined on undefined ; ...` and SLIPPED `unstampedLines()`,
 * the provenance floor rule 2 is built on. The floor was structural
 * against OMISSION and merely careful against MALFORMATION. Latent, since
 * every call site goes through `treeProv`/`liveProv`, which validate —
 * and a latent hole in the one mechanism the rest of this module leans on
 * is worth one `default`.
 *
 * THE SHAPE IS RE-VALIDATED THROUGH THE CONSTRUCTORS THEMSELVES rather
 * than by a second copy of what a provenance is: a closed KIND alone
 * still lets `{ kind: "live" }` render `read undefined on undefined`, and
 * two definitions of one rule is the defect this module reads its row set
 * to avoid.
 *
 * @param {Prov} prov
 * @returns {string}
 */
export function stamp(prov) {
  switch (prov?.kind) {
    case "tree": {
      const { ref, via } = treeProv(prov.ref, prov.via);
      return `<- @ ${ref.slice(0, 12)} ; ${via}`;
    }
    case "live": {
      const { at, host, via } = liveProv(prov.at, prov.host, prov.via);
      return `<- read ${at} on ${host} ; ${via}`;
    }
    default:
      throw new Error(
        `dispatch-brief: ${String(JSON.stringify(prov))} is not a provenance — a record carries a ` +
          "TREE fact from treeProv() or a LIVE fact from liveProv(), and nothing else. Any other " +
          "shape used to render as a live stamp reading `read undefined on undefined`, which the " +
          "provenance floor accepts, so the malformation left this tool looking stamped.",
      );
  }
}

/**
 * The tool's own prose. It may not contain a DIGIT: a figure that leaves
 * this module has to leave through a stamped value, so the note channel
 * is closed to figures by construction rather than by care.
 *
 * @param {string} text
 * @returns {Rec}
 */
export function note(text) {
  if (/\d/.test(text)) {
    throw new Error(
      `dispatch-brief: a note may not carry a digit — ${JSON.stringify(text)}. Every figure this ` +
        "tool emits must be a stamped value, because a figure with no ref is the defect this " +
        "command exists to stop.",
    );
  }
  return { kind: "note", text };
}

/** @returns {Rec} */
export function blank() {
  return { kind: "blank" };
}

/** @param {string} text @param {Prov} prov @returns {Rec} */
export function value(text, prov) {
  if (prov === undefined || prov === null) {
    throw new Error(`dispatch-brief: no provenance for ${JSON.stringify(text)}`);
  }
  return { kind: "value", text, prov };
}

/** The rendered report. Values render as ONE line ending in their stamp. */
/** @param {Rec[]} recs @returns {string} */
export function render(recs) {
  return recs
    .map((r) => {
      if (r.kind === "blank") return "";
      if (r.kind === "note") return `# ${r.text}`;
      return `${r.text}  ${stamp(r.prov)}`;
    })
    .join("\n");
}

/**
 * The two stamp shapes, as ONE pattern, so the detector cannot recognise
 * a tree stamp and quietly miss a live one — which it did on its first
 * run here, because an alternation had picked up a leading space and
 * every worktree line came back unstamped.
 */
export const STAMP_PATTERN = / <- (?:@ [0-9a-f]{7,}|read \S+ on \S+) ; \S/;

/**
 * The provenance floor, as a predicate rather than as a habit: every
 * rendered line that is not blank and not a `#` note ends in a stamp.
 * The spec drives it against a mutated renderer.
 *
 * @param {string} rendered
 * @returns {string[]}
 */
export function unstampedLines(rendered) {
  return rendered
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.startsWith("# "))
    .filter((l) => !STAMP_PATTERN.test(l));
}

/* ────────────────────────────────────────────────────────────────────
 * THE MARGIN — this command's own size, disclosed in its own output
 * (T-225, borrowing `T-167-s5`'s shape).
 * ──────────────────────────────────────────────────────────────────── */

/**
 * ONE PIPE BUFFER ON THIS PLATFORM, and the reference this disclosure
 * measures against.
 *
 * It is not a limit this command enforces and it is not a promise about
 * any particular reader. It is the size of the transfer a writer gets for
 * free: up to one buffer, the whole answer is sitting in the kernel when
 * the writer finishes, and past it arrival depends on the READER draining
 * while the writer is still alive. `tests/brief-flush.spec.ts` derives its
 * own loss point at run time for exactly that reason and labels it with
 * the reader it belongs to; this constant is the FLOOR both readers
 * measured there share, and the only number about this that does not move
 * with who is reading.
 *
 * **WHICH READER IT IS THE FLOOR FOR IS NOW PRINTED BESIDE IT** — the
 * half this comment carried while the disclosure emitted the number bare
 * (T-225-s1). A figure whose owner lives in a comment is a figure the
 * reader holding the decision never meets, which is the whole argument
 * for this block existing.
 */
export const PIPE_BUFFER_BYTES = 65_536;

/**
 * THE SECOND CEILING, AND THE ONE THAT ACTUALLY TRUNCATES THE CALLER
 * THIS REPOSITORY READS WITH — node's own `maxBuffer` default for
 * `spawnSync`, an order of magnitude away from the buffer above (T-225-s1).
 *
 * A caller past it is NOT handed a quiet prefix. The child is killed and
 * the result carries `status: null`, `signal: "SIGTERM"` and an `error`
 * whose `code` is `ENOBUFS` — loud, in a field most callers never read.
 * And the stdout that comes back OVERRUNS the number the caller set: it
 * is whatever node had already read when the limit tripped, quantised to
 * node's own read chunks rather than to the caller's figure. HOW MUCH IS
 * A RACE and is asserted nowhere — a fast producer's whole answer and a
 * slow one's part-way kill both come back over the limit, so `>` is the
 * claim and an equality would be a flake wearing a measurement.
 *
 * **AND THIS NUMBER IS NODE'S, NOT THIS MODULE'S, SO IT IS BRACKETED
 * RATHER THAN TRUSTED.** It was TRANSCRIBED until `V-225-s1` doubled it
 * and watched the command print *"spawnSync at its 2097152-byte DEFAULT
 * maxBuffer"* to a dispatcher, false about node, with every body green:
 * a figure with no keeper, in the module whose contract is that a figure
 * never leaves it detached from its source. `brief.spec.ts`'s OVER-arm
 * body now spawns a producer of exactly this many bytes and one of
 * exactly one more, and requires the first clean and the second
 * `ENOBUFS` — which brackets the default from BOTH sides, so a constant
 * too large fails the first assertion and one too small fails the
 * second. **The boundary is a property of the CHILD's size, not of the
 * reader's timing**: node trips when what it has accumulated EXCEEDS the
 * limit, and a producer writing exactly N never accumulates past N. Two
 * spawns, no race.
 *
 * **EVERY CLAIM IN THIS PARAGRAPH AND IN THE ARMS BELOW IS DRIVEN AND
 * NOT ASSERTED**, by that same body, which builds its needles AND its
 * banned phrases out of the measurement and reds when the sentence and
 * the measurement disagree — in either direction, a true clause missing
 * or a retired one restored beside it. No figure from that measurement
 * is transcribed here.
 */
export const SPAWNSYNC_DEFAULT_MAXBUFFER = 1024 * 1024;

/**
 * THE NUMBER THIS COMMAND USED NOT TO PRINT — how big its own answer is,
 * against the buffer a caller collects it in.
 *
 * WHY IT EXISTS. `T-225`'s board could not carry a correct triage
 * because the queue's capacity turned out to be a function of the bytes
 * this command prints per card rather than of the work: seven cards were
 * triaged PROMOTE on their merits and three were held BY ARITHMETIC.
 * Nothing in this command's own output said so. The margin was computed —
 * accurately — by a SPEC, so a dispatcher who never runs the e2e lane
 * never met it, which is the difference between a measurement that exists
 * and one that reaches the person holding the decision.
 *
 * WHY IT IS PRINTED FIRST AND NOT LAST, which is the opposite of where
 * `supertaskr-index` puts its budget line: a truncation eats the TAIL. A
 * disclosure at the foot of an answer too big to arrive is lost in
 * exactly the case it was written for, so the caller in `brief.mjs`
 * renders the whole answer, measures it, and emits this ahead of it.
 *
 * WHY IT PRINTS WHETHER OR NOT IT IS NEAR THE LINE, the way `budget_line`
 * does: a disclosure that appears only past some threshold cannot be told
 * from one that is broken, and this project has paid for that
 * distinction more than once. Over is not an error and must not read like
 * one — the answer is complete either way, and what changes is who has to
 * drain it.
 *
 * AND WHAT CHANGES FOR WHOM IS NOW SAID PER CALLER, MEASURED (T-225-s1).
 * The OVER arm used to end *"a caller collecting into a fixed buffer of
 * that size receives a prefix with no error"*. **THAT SENTENCE IS TRUE,
 * AND IT NAMED NOBODY** — which is the whole defect. It is true of a
 * reader doing ONE fixed-size read and stopping, and false of the reader
 * this repository itself uses: `spawnSync` past its `maxBuffer` is
 * killed, loudly, with an error the sentence promised was absent. A
 * figure detached from its source is the defect this module exists
 * against; a CONSEQUENCE detached from the caller it belongs to is the
 * same defect one level up, and it is worse, because the reader cannot
 * even tell which of the two claims was meant for them.
 *
 * So each arm names its callers and says what each one does, and NO
 * outcome below is written from memory: `brief.spec.ts` drives every
 * named caller against this command's own answer in the same run, builds
 * its needles out of what it measured, and reds when the sentence and the
 * measurement disagree — with the retired sentence itself as the planted
 * control, because a checker that has only ever seen the true text cannot
 * be told from one that decides nothing.
 *
 * AND THE BLOCK DECLARES ITS OWN COST (T-225-s2, taking `T-225-s8`).
 * This disclosure is not free, and the resource it discloses is the one it
 * spends: measured at `482be56`, the UNDER arm's block went 342 → 1,141
 * bytes and the OVER arm's 500 → 2,183 when T-225-s1 gave each caller its
 * own line. **THE ANSWER TO THAT IS A FIGURE, NOT A DELETION** — the
 * symmetry rule this block already stands on (a disclosure that appears
 * only past a threshold cannot be told from one that is broken) is exactly
 * why the per-caller lines print in both arms, and a block that quietly
 * grew the thing it measures while saying nothing about it would be the
 * defect this whole module is against. So the split is stated: how many of
 * the bytes above are the derivation, and how many are this block.
 *
 * IT IS EXACT AND COSTS NO SECOND FIXED POINT. `withMargin` knows the
 * derivation's own size before it starts iterating, so the block's size is
 * `bytes - body` at every candidate and is right at the one that settles —
 * no search, no rounding, and no figure a reader has to adjust.
 *
 * @param {{ bytes: number, at: string, host: string, buffer?: number,
 *   what?: string, body?: number, units?: { count: number, label: string } }} opts
 * @returns {Rec[]}
 */
export function marginRecs(opts) {
  const buffer = opts.buffer ?? PIPE_BUFFER_BYTES;
  const bytes = opts.bytes;
  if (!Number.isInteger(bytes) || bytes < 0 || !Number.isInteger(buffer) || buffer <= 0) {
    throw new Error(
      `dispatch-brief: a margin needs a byte count and a positive buffer, and got ${String(bytes)} ` +
        `against ${String(buffer)} — a disclosure that guesses its own size is the figure with no ` +
        "keeper this command exists to remove.",
    );
  }
  const via = "this command's own rendered answer, measured before it was written";
  const prov = liveProv(opts.at, opts.host, via);
  const percent = ((bytes * 100) / buffer).toFixed(1);
  const what = opts.what ?? "output";
  /**
   * THE FIGURE NAMES ITS OWNER. One pipe buffer is the floor for the
   * reader that takes ONE fixed read and stops, and for nobody else — the
   * arms below are the consequences OF crossing it, and they are not the
   * same consequences — so the number and the reader it belongs to travel
   * on one line and are never printed apart.
   */
  const bufferProv = liveProv(
    opts.at,
    opts.host,
    "one pipe buffer here, and the reader this figure is the floor for",
  );
  /**
   * WHAT EACH NAMED CALLER DOES, on the side of the line this answer is
   * actually on. Both arms speak, because a disclosure that appears only
   * past a threshold cannot be told from one that is broken — the same
   * reason the block itself prints at every run.
   */
  const readerProv = liveProv(
    opts.at,
    opts.host,
    "what each named caller does at this size, measured by brief.spec.ts's OVER-arm body",
  );
  /** @type {Rec[]} */
  const recs = [
    note("THE MARGIN — this answer's own size against one buffer, disclosed here because a"),
    note("truncation eats the TAIL and the caller that meets a ceiling is told in a field it may not read"),
    value(
      bytes > buffer
        ? `${what}: ${bytes} of ${buffer} bytes (${percent}%) - OVER by ${bytes - buffer}`
        : `${what}: ${bytes} of ${buffer} bytes (${percent}%) - ${buffer - bytes} left`,
      prov,
    ),
    value(
      `buffer: ${buffer} bytes is ONE PIPE BUFFER here — the floor for a reader that takes ONE ` +
        "fixed-size read and stops, the transfer this writer completes before it must stay " +
        "alive, and no other reader's limit; tests/brief-flush.spec.ts derives each named " +
        "reader's own point per run",
      bufferProv,
    ),
  ];
  if (bytes > buffer) {
    recs.push(
      value(
        "past it, a pipe reader that keeps reading: receives every byte however slowly it " +
          "drains, because this writer stays alive until stdout has drained rather than exiting " +
          "on the tail",
        readerProv,
      ),
      value(
        `past it, a reader taking ONE fixed read of that size (dd bs=${buffer} count=1): a ` +
          "PREFIX of at most one buffer and NO error on the reader's side at all — this is the " +
          "caller the figure above is the floor for, and the only one that meets the line as a " +
          "cut nobody is told about",
        readerProv,
      ),
      value(
        "past it, spawnSync at a maxBuffer this answer exceeds: the child is KILLED — status " +
          "null, signal SIGTERM, error.code ENOBUFS — and the stdout handed back OVERRUNS that " +
          "maxBuffer by however much node had already read, so the caller's own number bounds " +
          "nothing",
        readerProv,
      ),
      value(
        `past it, spawnSync at its ${SPAWNSYNC_DEFAULT_MAXBUFFER}-byte DEFAULT maxBuffer: this ` +
          (bytes > SPAWNSYNC_DEFAULT_MAXBUFFER
            ? "answer is OVER that default too, so a caller that configured nothing meets that " +
              "same ENOBUFS"
            : "answer is UNDER that default, so a caller that configured nothing receives the " +
              "whole answer at status 0 with no error"),
        readerProv,
      ),
    );
  } else {
    recs.push(
      value(
        "under it: this answer fits inside the transfer the writer completes unaided, so no " +
          "named caller meets a ceiling here — not the one-read fixed-buffer reader, not " +
          "spawnSync at any maxBuffer this size does not exceed, and not spawnSync at its " +
          `${SPAWNSYNC_DEFAULT_MAXBUFFER}-byte default`,
        readerProv,
      ),
    );
  }
  /**
   * THIS BLOCK'S OWN COST, IN BOTH ARMS AND WHETHER OR NOT IT IS COUNTED
   * (T-225-s2, taking `T-225-s8`). A disclosure that spends the resource
   * it discloses owes the split, and the arm that CANNOT count itself says
   * that rather than going quiet — the same symmetry the two arms above
   * stand on, applied to the block instead of to the answer.
   */
  const body = opts.body;
  recs.push(
    value(
      body === undefined
        ? "this block: NOT COUNTED — the figure above is the derivation's own size, so these " +
            "disclosure bytes sit OUTSIDE it and a reader adding them gets the whole write"
        : `this block: ${bytes - body} of those bytes are this disclosure and ${body} are the ` +
            "derivation — the block is counted INSIDE the figure it declares, so what is above " +
            "is what `wc -c` gives",
      prov,
    ),
  );
  if (opts.units !== undefined && opts.units.count > 0) {
    /**
     * THE PROJECTION, derived here and never quoted — `floor_line`'s own
     * argument. The per-unit cost moves with the provenance this tool
     * prints, with the lane count and with how long a title anybody
     * writes, so a document that wrote it down would be wrong by the next
     * merge and a report that prints it at every run cannot be.
     */
    const per = bytes / opts.units.count;
    recs.push(
      value(
        `per ${opts.units.label}: ${per.toFixed(0)} bytes at this answer's own density, so one ` +
          `buffer holds about ${Math.floor(buffer / per)} of them`,
        prov,
      ),
    );
  }
  return recs;
}

/**
 * The disclosure ahead of the answer it measures, at a FIXED POINT: the
 * size it declares INCLUDES the block declaring it, so the figure is the
 * one `wc -c` gives and not one a reader has to adjust.
 *
 * THE ITERATION TERMINATES BY CONSTRUCTION rather than by a bound alone.
 * Each pass declares a candidate total and asks whether the block that
 * renders it makes that total true; a pass that agrees is exact. The
 * block's own length moves only when a digit count moves, so the answer
 * is reached in a pass or two — but the `left` field SHRINKS as the body
 * grows, so the length is not monotone and a knife edge could refuse to
 * settle. THAT CASE IS LABELLED RATHER THAN ROUNDED: an unsettled run
 * discloses the DERIVATION's size, which is exact and is a different
 * measurement, instead of declaring a total that is off by a byte.
 *
 * **THE KNIFE EDGE IS REAL AND IT IS THE UNDER ARM'S ALONE** (T-225-s1,
 * which drove this branch instead of reasoning about it). A two-cycle
 * needs the block to get SHORTER by exactly one byte as the candidate
 * total grows by one, and `left` is the only field that shrinks: over the
 * line every field — the total, the percentage, `OVER by` — grows with
 * the body, so the OVER arm cannot oscillate at all. Under the line the
 * widths that oscillate are REAL rather than contrived, one per digit
 * boundary of `left`, and each is a single body width; `brief.spec.ts`'s
 * unsettled body DERIVES them at run time rather than pinning them,
 * because every one of those widths moves with every byte of this block's
 * own prose.
 *
 * @param {string} body   the rendered answer, newline-terminated
 * @param {{ at: string, host: string, buffer?: number,
 *   units?: { count: number, label: string } }} opts
 * @returns {{ text: string, bytes: number, whole: boolean }}
 */
export function withMargin(body, opts) {
  const bodyBytes = Buffer.byteLength(body, "utf8");
  // THE DERIVATION'S OWN SIZE TRAVELS WITH THE CANDIDATE TOTAL, so the
  // block can state what it itself cost without a second search: the
  // disclosure is `bytes - body` at every candidate, and it is exact at
  // the one that settles (T-225-s2, taking `T-225-s8`).
  const head = (/** @type {number} */ n) =>
    `${render(marginRecs({ ...opts, bytes: n, body: bodyBytes }))}\n\n`;
  let total = bodyBytes;
  for (let pass = 0; pass < 8; pass += 1) {
    const text = head(total);
    const settled = bodyBytes + Buffer.byteLength(text, "utf8");
    if (settled === total) return { text: text + body, bytes: total, whole: true };
    total = settled;
  }
  const text = `${render([
    note("THE MARGIN — the total including this block did not settle, so what is disclosed is"),
    note("the DERIVATION below, which this block measures exactly"),
    // The label is this block's own; everything the arm says about the
    // figure travels with it. FILTERED BY KIND rather than by a count of
    // leading notes — an arm that gains a sentence must not silently take
    // a stamped value away from the honest answer.
    ...marginRecs({ ...opts, bytes: bodyBytes, what: "derivation below" }).filter(
      (r) => r.kind !== "note",
    ),
  ])}\n\n`;
  return { text: text + body, bytes: bodyBytes, whole: false };
}

/* ────────────────────────────────────────────────────────────────────
 * The derivers — one per contract row, keyed by the row's own label.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} Ctx
 * @property {string} root
 * @property {string} ref            the tree these figures are functions of
 * @property {string} at             ISO time the live facts were read
 * @property {string} host
 * @property {string} role
 * @property {string} taskId
 * @property {Card | undefined} card
 * @property {Map<string, Card>} cards
 * @property {Component[]} comps
 * @property {Map<string, string[]>} slugs
 * @property {Lane[]} lanes
 * @property {string} porcelain
 * @property {string} integrationRef  the revision THIS checkout spells the
 *   integration branch with — the bare name where it exists, a
 *   remote-tracking spelling where the event type left none. Live, not a
 *   function of the tree: see `resolveIntegrationRef`
 * @property {string} integrationLog  one read of the integration BRANCH, held
 *   beside the porcelain and for the same reason: it is a read of something
 *   MUTABLE, so the figures taken from it are live facts and a pin has to be
 *   able to drive a second read of it at one ref
 * @property {string | null} laneCut  the commit THIS card's live lane was cut
 *   at, where one is live and this checkout can answer — see `laneCutCommit`.
 *   Held beside the log for the same reason and read once, so a pin can drive
 *   a second answer at one ref
 * @property {LaneSpellings} spellings
 * @property {string} conventions
 * @property {string} roleMd
 * @property {string} archMd
 * @property {boolean} full
 * @property {LoadedProcess | null} process  this project's resolved process
 *   switches, or null where the tree carries no schema or no `process:`
 *   section — a tree that predates the settings is not a misconfiguration
 * @property {string[]} findings
 */

/** @param {Ctx} ctx @param {string} via @returns {Prov} */
function tree(ctx, via) {
  return treeProv(ctx.ref, via);
}

/** @param {Ctx} ctx @param {string} via @returns {Prov} */
function live(ctx, via) {
  return liveProv(ctx.at, ctx.host, via);
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveRole(ctx) {
  const file = `method/roles/${ctx.role}.md`;
  const lines = ctx.roleMd.split(/\r?\n/);
  const heading = lines.find((l) => l.startsWith("# ")) ?? "";
  const opening = lines.find((l) => l.trim() !== "" && !l.startsWith("#")) ?? "";
  if (opening === "") {
    throw new Error(`dispatch-brief: ${file} has no opening line to quote as its one-line summary`);
  }
  return [
    value(`role file: ${file}`, tree(ctx, file)),
    value(`heading: ${heading}`, tree(ctx, `${file} first heading`)),
    value(`one line: ${opening}`, tree(ctx, `${file} opening line`)),
    // THE MODEL THIS SEAT RUNS ON, AND IT IS ROW ONE'S BUSINESS (T-298).
    // Row one names WHICH ROLE this session takes; which model takes it is
    // the same row's question, and putting it here rather than in a row of
    // its own is what keeps the contract table at thirteen rows — a
    // fourteenth would be a method version bump and this is not one.
    ...roleModelRecs(ctx),
  ];
}

/**
 * The model row 1 prints, read from the runtime template, and the
 * ABSENCE printed just as plainly.
 *
 * A READ ARM NEVER THROWS OVER THIS, and that is the difference between
 * this and the dispatch. `--task` answers questions about a card in
 * whatever checkout it is pointed at, and a checkout with no template —
 * a scratch fixture, a project mid-genesis — still has thirteen rows
 * worth answering. So the absence becomes a printed line AND a finding,
 * which is how every other unanswerable row in this file behaves; the
 * REFUSAL belongs to `dispatchLanePlan`, where a seat is about to be
 * paid for.
 *
 * @param {Ctx} ctx
 * @returns {Rec[]}
 */
function roleModelRecs(ctx) {
  const via = `${RUNTIME_TEMPLATE}, its roles block (ADR-024 decision 5)`;
  // WHERE THE MODEL COMES FROM IS ITSELF A SETTING (T-299, ADR-024
  // decision 6). At `by-hand` this arm names no model at all and says
  // so — which is the ceremony as it stood before T-298, and the row
  // has to be able to render it rather than quietly reading the
  // template anyway.
  if (ctx.process !== null) {
    const how = switchValue(ctx.process.settings, "dispatch.model_per_role");
    if (how === "by-hand") {
      return [
        value(
          "model: NAMED BY HAND — dispatch.model_per_role is by-hand, so this arm reads no " +
            "default and the seat names the model for this dispatch",
          tree(ctx, `${PROCESS_SCHEMA}, the switch dispatch.model_per_role`),
        ),
      ];
    }
  }
  try {
    const { model, key } = roleModel(roleModels(runtimeTemplateText(ctx.root)), ctx.role);
    return [value(`model: ${model} — read from ${RUNTIME_TEMPLATE} as roles.${key}`, tree(ctx, via))];
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    ctx.findings.push(why);
    return [value(`model: NOT READ — ${why}`, tree(ctx, via))];
  }
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveTask(ctx) {
  const card = ctx.card;
  if (card === undefined) {
    return [
      note("no task named, so this row is unanswered — pass the task id"),
      value(
        `live cards on the board: ${ctx.cards.size}`,
        tree(ctx, "git ls-files, flat docs/tasks/T-*.md"),
      ),
    ];
  }
  const confirm = /Confirm your understanding[^.]*\./.exec(numberedStep(ctx.roleMd, 1));
  if (confirm === null) {
    throw new Error(
      `dispatch-brief: method/roles/${ctx.role}.md step 1 no longer carries a "Confirm your ` +
        'understanding" sentence — this row transcribes it rather than restating it.',
    );
  }
  return [
    value(`task: ${card.id}`, tree(ctx, `${card.file} frontmatter field id`)),
    value(`card: ${card.file}`, tree(ctx, "git ls-files, flat docs/tasks/T-*.md")),
    value(`title: ${card.title}`, tree(ctx, `${card.file} frontmatter field title`)),
    value(
      `size ${fieldScalar(card.fields, "size")} / status ${fieldScalar(card.fields, "status")} / ` +
        `feature ${fieldScalar(card.fields, "feature")} / milestone ${fieldScalar(card.fields, "milestone")}`,
      tree(ctx, `${card.file} frontmatter`),
    ),
    value(
      `read it IN FULL, then: ${/** @type {string} */ (confirm[0])}`,
      tree(ctx, `method/roles/${ctx.role}.md step 1`),
    ),
  ];
}

/**
 * Every `docs/<NAME>.md` a text names, in order, first mention winning.
 *
 * ONE SPELLING, spent by the adapter read and by the subtraction reader
 * below, because the two have to agree about what a document reference
 * IS: a role file that writes the path backticked — verifier.md does —
 * has to subtract the same string the adapter added.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function docsNamed(text) {
  return [...new Set([...text.matchAll(/\bdocs\/[A-Za-z0-9_./-]*\.md\b/g)].map((m) => m[0]))];
}

/** Every backtick-delimited run in a line, in order. */
/** @param {string} line @returns {string[]} */
export function backtickRuns(line) {
  return [...line.matchAll(/`([^`]+)`/g)].map((m) => /** @type {string} */ (m[1]));
}

/**
 * The documents the brief's own role file REMOVES from the adapter's list.
 *
 * DERIVED from that file's own sentence, and the DOCUMENT is never
 * written down in this module — only the grammar of the sentence is.
 * executor.md writes *"You do NOT read <doc>"* bare; verifier.md writes
 * the same subtraction with the path backticked, which is why the two
 * readers below share one spelling of what a document reference is. **A
 * role file carrying no such sentence subtracts nothing, and the
 * adapter's list stands unchanged** — which is what keeps this from being
 * a constant wearing a function's clothes, and is the positive control
 * the card demands.
 *
 * WHOLE-FILE, not step one. The subtraction lives in step 1 of
 * executor.md and in step 0 of verifier.md, so a scan bounded to a
 * numbered step reads one role file and misses the other. The phrase is
 * the grammar of the sentence; the DOCUMENT it names is never written
 * down in this module.
 *
 * @param {string} roleMd
 * @returns {string[]}
 */
export function readSubtractions(roleMd) {
  /** @type {string[]} */
  const out = [];
  for (const line of roleMd.split(/\r?\n/)) {
    const at = line.indexOf("do NOT read ");
    if (at === -1) continue;
    // FIRST MENTION ON THAT LINE ONLY. The sentence continues past the
    // path it subtracts — *"and that is a deliberate subtraction"* — and a
    // later line's document is a later line's business. A "do NOT read"
    // naming no document at all subtracts nothing: verifier.md's second
    // one forbids the executor's NOTES, which is not a path.
    const [doc] = docsNamed(line.slice(at + "do NOT read ".length));
    if (doc !== undefined && !out.includes(doc)) out.push(doc);
  }
  return out;
}

/**
 * The documents the brief's own role file ADDS to the adapter's list.
 *
 * DERIVED the same way, from its *"ADDITION TO THAT SET IS ..."* sentence
 * and that sentence's own backticked path. The addition is quoted in the
 * role file's OWN spelling rather than resolved to a repository path: a
 * brief is a transcription, and the file that requires the document is
 * the file that gets to spell it.
 *
 * @param {string} roleMd
 * @returns {string[]}
 */
export function readAdditions(roleMd) {
  /** @type {string[]} */
  const out = [];
  for (const line of roleMd.split(/\r?\n/)) {
    const at = line.indexOf("ADDITION TO THAT SET IS ");
    if (at === -1) continue;
    const [doc] = backtickRuns(line.slice(at + "ADDITION TO THAT SET IS ".length));
    if (doc !== undefined && !out.includes(doc)) out.push(doc);
  }
  return out;
}

/**
 * Row 3's source is the project's OWN root adapter — the filled-in file
 * at the repository root, not the template it was copied from. Which
 * files those are is derived from the adapters template directory rather
 * than named here.
 *
 * **AND THE ROLE FILE'S READING STEP IS APPLIED TO THAT LIST, NOT PRINTED
 * BESIDE IT** (T-112-s3). Row 3's source column says so in as many words,
 * and the table's own rules give this row as the worked example of *"a
 * brief that is internally inconsistent while every row is individually
 * faithful to its source"*: the adapter is addressed to every seat and
 * the role file to one, so where they differ the ROLE FILE WINS. Printed
 * beside, every brief this command emitted told an executor to read the
 * one document its role file subtracts, and never named the one it
 * requires. The adapter's own list stays on the report — a reader has to
 * be able to see WHICH document was removed and which was added — and
 * both halves of the difference are derived from the role file's text.
 *
 * @param {Ctx} ctx
 * @returns {Rec[]}
 */
function deriveReadFirst(ctx) {
  const templates = trackedFiles(ctx.root)
    .filter((rel) => rel.startsWith("method/adapters/") && rel.endsWith(".md"))
    .map((rel) => path.basename(rel));
  const roots = trackedFiles(ctx.root).filter(
    (rel) => !rel.includes("/") && templates.includes(rel),
  );
  if (roots.length === 0) {
    throw new Error(
      "dispatch-brief: this repository has no filled-in root adapter matching a name under " +
        "method/adapters/ — row 3's source does not exist, and the read-first set cannot be " +
        "invented from the template directory.",
    );
  }
  const roleFile = `method/roles/${ctx.role}.md`;
  const subtractions = readSubtractions(ctx.roleMd);
  const additions = readAdditions(ctx.roleMd);
  /** @type {Rec[]} */
  const recs = [];
  /** @type {Map<string, string[]>} */
  const sets = new Map();
  for (const rel of roots) {
    const docs = docsNamed(readDoc(rel, ctx.root));
    sets.set(rel, docs);
    recs.push(value(`${rel} names: ${docs.join(" ")}`, tree(ctx, rel)));
  }
  for (const gone of subtractions) {
    recs.push(value(`the role file SUBTRACTS: ${gone}`, tree(ctx, `${roleFile} reading step`)));
  }
  for (const gained of additions) {
    recs.push(value(`the role file ADDS: ${gained}`, tree(ctx, `${roleFile} reading step`)));
  }
  // ONE APPLIED LINE PER DISTINCT ADAPTER SET, so the normal case — every
  // root adapter naming the same documents — emits exactly one, and a
  // repository whose adapters disagree gets the difference APPLIED on both
  // sides rather than a union nobody wrote. The finding below still fires.
  /** @type {Map<string, string[]>} */
  const applied = new Map();
  for (const [rel, docs] of sets) {
    const kept = docs.filter((d) => !subtractions.includes(d));
    const list = [...kept, ...additions.filter((a) => !kept.includes(a))].join(" ");
    applied.set(list, [...(applied.get(list) ?? []), rel]);
  }
  for (const [list, from] of applied) {
    recs.push(
      value(
        `READ FIRST, the role file's reading step APPLIED: ${list}`,
        tree(ctx, `${from.join(" + ")}, with ${roleFile}'s reading step applied to it`),
      ),
    );
  }
  if (subtractions.length === 0 && additions.length === 0) {
    recs.push(
      note(
        `${roleFile} states no subtraction and no addition, so the adapter's list stands unchanged`,
      ),
    );
  }
  const distinct = new Set([...sets.values()].map((v) => v.join(" ")));
  if (distinct.size > 1) {
    ctx.findings.push(
      `the root adapters disagree about the read-first set: ${[...sets]
        .map(([f, v]) => `${f} names ${v.join(" ")}`)
        .join(" ; ")}. Row 3 names ONE source; two that disagree is two facts, not one fact checked twice.`,
    );
  }
  return recs;
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveLane(ctx) {
  const s = ctx.spellings;
  // THE COMMAND THAT ACTUALLY RAN, not the one the document names. Where
  // the two differ the difference is the whole point: a reader re-deriving
  // this figure on a checkout like this one needs the revision that
  // answers, and a provenance naming a revision the checkout does not hold
  // is a provenance nobody can re-run.
  const logVia = `git log --first-parent --format=%H %s ${ctx.integrationRef}`;
  // THE BASE IS THE COMMIT THE CUT USED, and the checkpoint stands beside
  // it as the rule's anchor (T-300-s7, absorbing T-311-s6). Where no lane
  // is cut there is no cut to report and the anchor IS the base — which
  // is what this row printed for every card before, correctly for a card
  // with no lane and wrongly for every card with one.
  const laneRef = ctx.lanes.find((l) => l.taskId === ctx.taskId);
  const verdict = baseVerdict({
    logText: ctx.integrationLog,
    branch: ctx.integrationRef,
    cut: ctx.laneCut,
  });
  const { tip } = verdict;
  const base = verdict.base;
  if (verdict.finding !== null) ctx.findings.push(verdict.finding);
  const cutVia =
    laneRef === undefined
      ? logVia
      : `git merge-base ${laneRef.branch} ${ctx.integrationRef} — the newest commit the lane's ` +
        "branch and the integration branch share, which is the commit `git worktree add` was " +
        "given and does not move when either advances";
  const laneBullet = rawBullet(ctx.conventions, "THE LANE PROTOCOL");
  const dispatchBullet = rawBullet(ctx.conventions, "DISPATCH FROM THE LAST CHECKPOINT").replace(
    /\s+/g,
    " ",
  );
  const rule2 = numberedStep(laneProtocolText(ctx.root), 2);
  const rule3 = numberedStep(laneProtocolText(ctx.root), 3);
  const branch = ctx.taskId === "" ? s.branchPattern : s.branchPattern.replace("T-NNN", ctx.taskId);
  const worktree =
    ctx.taskId === "" ? s.worktreePattern : s.worktreePattern.replace("T-NNN", ctx.taskId);
  // THE BASE THE PUBLISHED SPELLING IS RESOLVED AGAINST — the REPOSITORY's
  // own main worktree, not this checkout. See `mainWorktree` for the
  // defect, the measurement and why the porcelain's first entry is the
  // honest answer. When it cannot be derived this row REFUSES with its
  // source, which is the shape this command already uses for a contract
  // row it has no deriver for: a confident wrong path is worse.
  const repo = mainWorktree(ctx.porcelain);
  const derivedWorktree = repo.path === "";
  const absolute = derivedWorktree ? "" : path.resolve(repo.path, worktree);
  const create =
    ctx.taskId === ""
      ? s.createCommand
      : s.createCommand.split("T-NNN").join(ctx.taskId).replace("<base>", base);
  // AND THE COMMAND IS SPELLED ABSOLUTELY TOO, because the command is the
  // ACT and the row above is only the report. Rule three's own remedy is
  // "STATE THE PATH ABSOLUTELY, OR VERIFY THE WORKING DIRECTORY FIRST",
  // and its own stated failure is a relative path in exactly this command:
  // "`git` has no opinion about where a worktree lands, and there is no
  // error — so a sibling path typed one directory too deep silently
  // creates the inside case this rule forbids." A pasted line that carries
  // the absolute path cannot land one directory too deep.
  // AND ONLY WHERE A CARD IS NAMED, which the suite caught rather than the
  // author: with no task the create line is the document's own text,
  // `T-NNN` and `<base>` placeholders and all, and a transcription is a
  // TREE fact. Substituting a machine path into a placeholder line would
  // put a live stamp on a tree fact — this card's own defect facing the
  // other way, and `a figure read from the MOVING integration ref…`
  // reddened on it.
  const spelledAbsolutely = !derivedWorktree && ctx.taskId !== "" && create.includes(worktree);
  const createLine = spelledAbsolutely ? create.replace(worktree, absolute) : create;
  // DERIVED, not assumed: whether this line carries the moving hash is
  // what decides its stamp. With no task named it is the document's own
  // text, `<base>` placeholder and all, and a transcription is a tree fact.
  // The path substitution moves it the same way — where it fired, the line
  // is no longer a function of the tree alone.
  const carriesBase = createLine.includes(base);
  /** @type {Rec[]} */
  const worktreeRecs = derivedWorktree
    ? [
        value(
          `worktree (absolute, per lane-protocol rule three): NOT DERIVED — ${repo.reason} ` +
            `The published spelling is ${worktree}; resolve it yourself against the repository root.`,
          live(ctx, repo.via),
        ),
      ]
    : [
        // A LIVE FACT, AND IT ALWAYS WAS. Where the repository sits on a
        // disk is not determined by the commit this checkout holds — the
        // same tree answers `/Users/ujju/Projects/supertaskr` here and
        // something else on a runner — so stamping it `@ <ref>` was the
        // module's own contract rule 3 broken in the row that cites rule
        // three. The SPELLING is the tree's; the resolved path is the
        // machine's, and the provenance now names both.
        value(
          `worktree (absolute, per lane-protocol rule three): ${absolute}`,
          live(
            ctx,
            `docs/CONVENTIONS.md lane bullet worktree spelling ${JSON.stringify(worktree)}, ` +
              `resolved against the repository's main worktree from ${repo.via}`,
          ),
        ),
      ];
  // THE ROW CHECKS ITSELF AGAINST THE RULE IT CITES. Fixing the base makes
  // the path right for the spelling this project publishes today; it does
  // not make it right for every spelling the document could publish
  // tomorrow. A worktree pattern that resolved INSIDE the repository would
  // print here under rule three's own heading, exactly as it did before —
  // so the containment is measured rather than argued.
  if (!derivedWorktree && insideRepository(repo.path, absolute)) {
    ctx.findings.push(
      `the lane worktree this row derives (${absolute}) is INSIDE the repository ` +
        `(${repo.path}), and method/lane-protocol.md rule three says "The worktree is a sibling ` +
        `directory, never a path inside the repository." The spelling docs/CONVENTIONS.md ` +
        `publishes is ${JSON.stringify(s.worktreePattern)}; a lane cut there is a second copy of ` +
        "every file to everything that walks the tree.",
    );
  }
  return [
    value(`integration branch: ${s.integrationBranch}`, tree(ctx, "docs/CONVENTIONS.md lane bullet")),
    // WHICH SPELLING OF THAT BRANCH THIS CHECKOUT HOLDS. A live fact by
    // executor.md's own test — the same tree answers one way on a
    // push-event runner and another on a detached `pull_request` merge
    // ref — and emitted rather than hidden, because a brief that read a
    // remote-tracking ref while saying nothing about it would be a figure
    // whose source the reader cannot reproduce.
    value(
      `integration ref this checkout resolves: ${ctx.integrationRef}`,
      live(
        ctx,
        `git rev-parse --verify, first that resolves of: ${integrationRefCandidates(
          s.integrationBranch,
        ).join(" ")}`,
      ),
    ),
    value(`branch: ${branch}`, tree(ctx, "docs/CONVENTIONS.md lane bullet branch spelling")),
    ...worktreeRecs,
    // THE THREE MOVING FIGURES. Each is a read of the integration REF, so
    // each carries the time and host it was read at and never a commit —
    // see `integrationRefs`. The create command is the third because the
    // base is SUBSTITUTED INTO IT: the document it is otherwise a
    // transcription of cannot produce that hash, and the line a dispatcher
    // pastes is the one rule 2 is about.
    value(
      `base commit: ${base}${
        verdict.cut === null
          ? " — NO CUT WAS DERIVED for this card here (no lane is cut, or the derivation could not answer its merge base: T-300-s12), so this is the rule's ANCHOR (the newest `Checkpoint:`) and not a report of a cut"
          : verdict.coincide
            ? " — the commit the CUT used, and the rule's anchor is the same commit: the two COINCIDE here"
            : " — the commit the CUT used, which is NOT the rule's anchor; the anchor is on the line below"
      }`,
      live(ctx, verdict.cut === null ? `${logVia}, newest Checkpoint` : cutVia),
    ),
    value(
      `the rule's anchor, the newest Checkpoint: on ${s.integrationBranch}: ${verdict.checkpoint}`,
      live(ctx, `${logVia}, newest Checkpoint`),
    ),
    value(`why this base is the one the rule admits: ${verdict.why}`, live(ctx, cutVia)),
    value(`integration tip right now: ${tip}`, live(ctx, logVia)),
    value(
      `create: ${createLine}`,
      carriesBase || spelledAbsolutely
        ? live(
            ctx,
            "docs/CONVENTIONS.md lane bullet create command" +
              (carriesBase ? `, base substituted from ${cutVia}` : "") +
              (spelledAbsolutely
                ? `, worktree path spelled absolutely against the repository's main worktree from ${repo.via}`
                : ""),
          )
        : tree(ctx, "docs/CONVENTIONS.md lane bullet create command"),
    ),
    value(`lane-protocol rule two: ${rule2}`, tree(ctx, "method/lane-protocol.md rule two")),
    value(`lane-protocol rule three: ${rule3}`, tree(ctx, "method/lane-protocol.md rule three")),
    value(`base rule: ${dispatchBullet}`, tree(ctx, "docs/CONVENTIONS.md dispatch bullet")),
    // THE LANE BULLET IS CITED RATHER THAN TRANSCRIBED (T-225-s2, taking
    // `T-215-s4`). It was 10,155 bytes of an 82,476-byte `--full` answer
    // at `09526da`, against a 65,536-byte line — and it is the document's
    // own text, reachable in one command from the address printed here.
    ...(ctx.full
      ? [
          citedRule(ctx, {
            label: "lane bullet",
            source: "docs/CONVENTIONS.md lane bullet",
            file: "docs/CONVENTIONS.md",
            raw: ctx.conventions,
            flat: laneBullet,
          }),
        ]
      : []),
    note("the slug in the branch name is the dispatcher's; this tool leaves the document's placeholder rather than inventing one"),
  ];
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveFence(ctx) {
  /** @type {Rec[]} */
  const recs = [];
  const via = "git worktree list --porcelain, filtered on the branch";
  recs.push(
    value(
      `lanes live right now: ${ctx.lanes.length === 0 ? "none" : ctx.lanes.map((l) => l.taskId).join(" ")}`,
      live(ctx, via),
    ),
  );
  /** @type {{ id: string, entries: string[] }[]} */
  const fences = [];
  /** @type {string[]} */
  const blind = [];
  for (const lane of ctx.lanes) {
    const card = ctx.cards.get(lane.taskId);
    if (card === undefined) {
      ctx.findings.push(
        `${lane.taskId} holds a worktree on ${lane.branch} and no live card declares that id — ` +
          "a lane whose fence cannot be read is a fence nobody can be disjoint from.",
      );
      recs.push(value(`${lane.taskId}: no live card, fence UNKNOWN`, live(ctx, via)));
      if (!blind.includes(lane.taskId)) blind.push(lane.taskId);
      continue;
    }
    const entries = fieldList(card.fields, "touches");
    fences.push({ id: lane.taskId, entries });
    recs.push(
      value(`${lane.taskId} branch ${lane.branch}`, live(ctx, via)),
      value(`${lane.taskId} worktree ${lane.path}`, live(ctx, via)),
      value(`${lane.taskId} tip ${lane.head}`, live(ctx, `git worktree list --porcelain HEAD line`)),
      value(
        `${lane.taskId} touches: ${entries.join(", ")}`,
        tree(ctx, `${card.file} frontmatter field touches`),
      ),
      value(
        `${lane.taskId} board status: ${fieldScalar(card.fields, "status")} — the BRANCH is what says what a lane is doing`,
        tree(ctx, `${card.file} frontmatter field status`),
      ),
    );
  }
  if (ctx.card !== undefined && !ctx.lanes.some((l) => l.taskId === ctx.taskId)) {
    fences.push({ id: ctx.taskId, entries: fieldList(ctx.card.fields, "touches") });
    recs.push(
      value(
        `${ctx.taskId} touches: ${fieldList(ctx.card.fields, "touches").join(", ")} (no worktree yet)`,
        tree(ctx, `${ctx.card.file} frontmatter field touches`),
      ),
    );
  }
  /** @type {string[]} */
  const overlapLines = [];
  for (let i = 0; i < fences.length; i += 1) {
    for (let j = i + 1; j < fences.length; j += 1) {
      const a = /** @type {{ id: string, entries: string[] }} */ (fences[i]);
      const b = /** @type {{ id: string, entries: string[] }} */ (fences[j]);
      const found = fenceOverlaps(a, b, ctx.slugs, ctx.comps);
      if (found.length === 0) {
        overlapLines.push(`${a.id} and ${b.id}: DISJOINT`);
        continue;
      }
      for (const o of found) {
        overlapLines.push(`${a.id} and ${b.id}: OVERLAP — ${o.left} against ${o.right}, ${o.why}`);
        ctx.findings.push(
          `fences are not disjoint: ${o.left} against ${o.right} — ${o.why} (lane-protocol rule five).`,
        );
      }
    }
  }
  if (fences.length < 2) {
    // AND IT SAYS WHICH "FEWER" IT IS (T-143 criterion 2). "Fewer than
    // two fences to compare" is a claim about the WORLD, and with a lane
    // whose card this checkout cannot read it is false in the one
    // direction a fence exists to prevent: there ARE two lanes, and one
    // of them could not be expanded.
    // NUMBER AGREEMENT IS NOT DECORATION HERE (T-143's verdict,
    // correction one — the sibling in lanes.ts carries the same rule
    // in the same words): "T-901, T-902 is live … about it" reads as
    // a claim about one lane while naming two.
    overlapLines.push(
      blind.length === 0
        ? "fewer than two fences to compare"
        : `fewer than two READABLE fences to compare — ${blind.join(", ")} ` +
          `${blind.length === 1 ? "is" : "are"} live and could not be expanded at all, ` +
          `so nothing below is a claim about ${blind.length === 1 ? "it" : "them"}`,
    );
  }
  // `DISJOINT` IS THE SAME CLASS OF WORD AS `FREE` — a claim about the
  // whole world, unreachable while part of the world could not be read
  // (T-143 criterion 2). The parser's `fenced` reason already carries
  // this residual beside a PROVED overlap; the pairwise verdicts here
  // carried none, so a lane this checkout cannot read left the word
  // `DISJOINT` standing over ground nobody compared.
  if (blind.length > 0) {
    const many = blind.length > 1;
    overlapLines.push(
      `AND EVERY VERDICT ABOVE IS PARTIAL: ${blind.join(", ")} could not be compared at all — ` +
        `this checkout has no card for ${many ? "them" : "it"} — so no line above rules out an ` +
        `overlap with ${many ? "those lanes" : "that lane"}`,
    );
  }
  for (const line of overlapLines) {
    recs.push(value(line, tree(ctx, "each card's touches, expanded through the slug map")));
  }
  recs.push(note("the slug map, from each component file's own touch_slugs FIELD:"));
  for (const [slug, ids] of ctx.slugs) {
    recs.push(
      value(
        `${slug} -> ${ids.join(", ")}`,
        tree(ctx, "docs/architecture/components/C-*.md field touch_slugs"),
      ),
    );
  }
  const prose = slugMapFromProse(ctx.archMd);
  /** @type {string[]} */
  const divergence = [];
  for (const [slug, ids] of ctx.slugs) {
    const other = prose.get(slug);
    if (other === undefined) divergence.push(`${slug} is absent from the prose block`);
    else if (other.join(",") !== ids.join(","))
      divergence.push(`${slug}: field says ${ids.join(", ")} and the prose block says ${other.join(", ")}`);
  }
  for (const [slug] of prose) {
    if (!ctx.slugs.has(slug)) divergence.push(`${slug} is in the prose block and no component claims it`);
  }
  if (divergence.length === 0) {
    recs.push(
      value(
        "the architecture doc's prose block agrees with the fields today",
        tree(ctx, "docs/ARCHITECTURE.md derived slug block"),
      ),
    );
  } else {
    for (const d of divergence) {
      recs.push(value(`prose block diverges: ${d}`, tree(ctx, "docs/ARCHITECTURE.md derived slug block")));
      ctx.findings.push(
        `the slug map's two copies disagree — ${d}. Row 5 rules the FIELD authoritative; the ` +
          "prose block is a signpost and goes stale the day a component is added.",
      );
    }
  }
  return recs;
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveSetup(ctx) {
  const order = rawBullet(ctx.conventions, "Fresh-clone ORDER").replace(/\s+/g, " ").replace(/^- /, "");
  const laneBullet = rawBullet(ctx.conventions, "THE LANE PROTOCOL");
  const fresh = subBullet(laneBullet, "A FRESH WORKTREE HAS NOTHING INSTALLED");
  return [
    value(`build order: ${order}`, tree(ctx, "docs/CONVENTIONS.md fresh-clone ORDER bullet")),
    value(
      `what a fresh worktree lacks: ${fresh}`,
      tree(ctx, "docs/CONVENTIONS.md lane bullet, fresh-worktree sub-bullet"),
    ),
  ];
}

/**
 * @typedef {object} PackageCommands
 * @property {string} dir
 * @property {string[]} commands
 */

/**
 * The per-package command bullets, read the way the document says they
 * are read: segments separated by the middle dot, taken only while a
 * segment opens with a backtick. That stopping rule is CONVENTIONS' own,
 * stated in the CI bullet, and copying it here is what keeps this
 * derivation and the lane's parity spec answering the same question.
 *
 * @param {string} conventionsMd
 * @returns {PackageCommands[]}
 */
export function packageCommands(conventionsMd) {
  const MIDDLE_DOT = String.fromCharCode(0xb7);
  /** @type {PackageCommands[]} */
  const out = [];
  for (const bullet of conventionsMd.split(/\n(?=- )/)) {
    if (!bullet.startsWith("- ")) continue;
    const flat = bullet.replace(/\s+/g, " ");
    const marker = /run from ([A-Za-z0-9_./-]+)\/:/.exec(flat);
    if (marker === null) continue;
    const dir = /** @type {string} */ (marker[1]);
    const tail = flat.slice(/** @type {number} */ (marker.index) + /** @type {string} */ (marker[0]).length);
    /** @type {string[]} */
    const commands = [];
    for (const seg of tail.split(MIDDLE_DOT)) {
      const trimmed = seg.trim();
      if (!trimmed.startsWith("`")) break;
      const cmd = /^`([^`]+)`/.exec(trimmed);
      if (cmd === null) break;
      commands.push(/** @type {string} */ (cmd[1]));
    }
    if (commands.length > 0) out.push({ dir, commands });
  }
  if (out.length === 0) {
    throw new Error(
      "dispatch-brief: no per-package command bullets found in docs/CONVENTIONS.md — row 7 is a " +
        "transcription of that section, and an empty transcription is a brief filled from memory.",
    );
  }
  return out;
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveCommands(ctx) {
  /** @type {Rec[]} */
  const recs = [];
  for (const pkg of packageCommands(ctx.conventions)) {
    for (const cmd of pkg.commands) {
      recs.push(
        value(
          `from ${pkg.dir}/: ${cmd}`,
          tree(ctx, "docs/conventions/commands.md Build and test, verbatim"),
        ),
      );
    }
  }
  recs.push(
    note("every package the full suite spans, not only the fenced ones — a remembered command is a different command"),
  );
  return recs;
}

/**
 * @typedef {object} GateBullet
 * @property {string} name
 * @property {string} trigger
 */

/**
 * The standing gates, ENUMERATED rather than listed: a column-zero
 * bullet whose opening capitals name a GATE or a REGEN, and which
 * declares a merge-diff trigger. A bullet that names a gate and declares
 * no such trigger is reported by name rather than dropped — the second
 * filter is what keeps a policy paragraph out without a hand list
 * deciding which paragraphs count.
 *
 * @param {string} conventionsMd
 * @returns {{ gates: GateBullet[], named: string[] }}
 */
export function standingGates(conventionsMd) {
  const TRIGGER = "at any merge whose diff touches";
  /** @type {GateBullet[]} */
  const gates = [];
  /** @type {string[]} */
  const named = [];
  for (const bullet of conventionsMd.split(/\n(?=- )/)) {
    if (!bullet.startsWith("- ")) continue;
    const flat = bullet.replace(/\s+/g, " ");
    const opener = /^- ([A-Z][A-Z0-9 ]*\b(?:GATE|REGEN))\b/.exec(flat);
    if (opener === null) continue;
    const name = /** @type {string} */ (opener[1]).trim();
    const at = flat.indexOf(TRIGGER);
    if (at < 0) {
      named.push(name);
      continue;
    }
    const rest = flat.slice(at);
    const stop = [" — ", ", run ", ", regenerate ", ". "]
      .map((t) => rest.indexOf(t))
      .filter((i) => i > 0)
      .sort((a, b) => a - b)[0];
    gates.push({ name, trigger: (stop === undefined ? rest : rest.slice(0, stop)).trim() });
  }
  if (gates.length === 0) {
    throw new Error(
      "dispatch-brief: docs/CONVENTIONS.md declares no standing gate with a merge-diff trigger — " +
        "row 8 enumerates those bullets, and an empty enumeration is a brief that skips gates in " +
        "silence.",
    );
  }
  return { gates, named };
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveGates(ctx) {
  const { gates, named } = standingGates(ctx.conventions);
  /** @type {Rec[]} */
  const recs = gates.map((g) =>
    value(`${g.name} fires ${g.trigger}`, tree(ctx, "docs/CONVENTIONS.md gate bullet, verbatim")),
  );
  for (const n of named) {
    recs.push(
      value(
        `${n} names a gate and declares no merge-diff trigger, so it is not one of these`,
        tree(ctx, "docs/CONVENTIONS.md, bullet opener"),
      ),
    );
  }
  recs.push(note("DERIVE fire or not-owed from your own diff; a gate you were TOLD about is a gate nobody checked"));
  return recs;
}

/**
 * The named disciplines: a column-zero Gotchas bullet whose opener is an
 * ALL-CAPS phrase of at least two words. That is the file's own
 * convention for naming a rule, so the enumeration follows the document's
 * shape rather than a list that goes stale. It is deliberately WIDER
 * than "disciplines" strictly are — over-inclusion is the safe direction
 * here for the same reason a gate trigger is wider than its walk.
 *
 * @param {string} conventionsMd
 * @param {string[]} exclude
 * @returns {{ name: string, opening: string }[]}
 */
export function namedDisciplines(conventionsMd, exclude) {
  /** @type {{ name: string, opening: string }[]} */
  const out = [];
  for (const bullet of conventionsMd.split(/\n(?=- )/)) {
    if (!bullet.startsWith("- ")) continue;
    const flat = bullet.replace(/\s+/g, " ");
    const opener = /^- ([A-Z][A-Z0-9'’/&,. -]*[A-Z])(?=[^A-Za-z]|$)/.exec(flat);
    if (opener === null) continue;
    const name = /** @type {string} */ (opener[1]).replace(/[,.\s]+$/, "").trim();
    const letters = name.replace(/[^A-Z]/g, "").length;
    if (name.split(/\s+/).length < 2 || letters < 6) continue;
    // Prefix, not equality: the gate enumeration captures the opener up
    // to GATE or REGEN, so `AUDIT GATE POLICY` and `AUDIT GATE` are the
    // same bullet under two spellings and a set difference by equality
    // lists it twice.
    if (exclude.some((x) => name === x || name.startsWith(`${x} `))) continue;
    const sentence = /^- ([^.]*\.)/.exec(flat) ?? /^- (.{0,220})/.exec(flat);
    out.push({ name, opening: (sentence === null ? flat : /** @type {string} */ (sentence[1])).trim() });
  }
  return out;
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveDisciplines(ctx) {
  const { gates, named } = standingGates(ctx.conventions);
  const skip = [...gates.map((g) => g.name), ...named];
  const found = namedDisciplines(ctx.conventions, skip);
  /** @type {Rec[]} */
  const recs = found.map((d) =>
    value(
      ctx.full ? `${d.name}: ${d.opening}` : d.name,
      tree(ctx, "docs/CONVENTIONS.md, named bullet"),
    ),
  );
  recs.push(note("read each bullet in full before you rely on it — this row names them, it does not summarise them"));
  return recs;
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveProhibitions(ctx) {
  const portBullet = rawBullet(ctx.conventions, "PORT RULE:").replace(/\s+/g, " ");
  const portMatch = /PORT RULE: (\d+) belongs to the human/.exec(portBullet);
  if (portMatch === null) {
    throw new Error(
      "dispatch-brief: the PORT RULE bullet no longer opens by naming the human's port, so this " +
        "row cannot derive which port to read. It will not fall back to a number typed here.",
    );
  }
  const port = /** @type {string} */ (portMatch[1]);
  const readCommand = /`(lsof [^`]*iTCP:<port>[^`]*)`/.exec(portBullet);
  const spelling =
    readCommand === null
      ? `lsof -nP -iTCP:${port} -sTCP:LISTEN`
      : /** @type {string} */ (readCommand[1]).replace("<port>", port);
  /** @type {Rec[]} */
  const recs = [
    value(
      `the human's app holds port ${port}; the ONE permitted command is ${spelling}`,
      tree(ctx, "docs/conventions/dispatch-and-scratch.md PORT RULE bullet"),
    ),
    // RULE FOUR IS CITED RATHER THAN TRANSCRIBED (T-225-s2, taking
    // `T-215-s4`) — 13,078 bytes at `09526da`, in EVERY `--task` arm and
    // not only under `--full`, which is the half `T-215-s4` did not say.
    // It is the longest single line this command has ever emitted and it
    // is a function of a document rather than of the card.
    citedRule(ctx, {
      label: "never touch the integration branch",
      source: "method/lane-protocol.md rule four",
      file: "method/lane-protocol.md",
      raw: laneProtocolText(ctx.root),
      flat: numberedStep(laneProtocolText(ctx.root), 4),
    }),
  ];
  const probe = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
  const holder =
    probe.error !== undefined || probe.status === null
      ? "could not read the port holder on this machine"
      : (probe.stdout ?? "")
          .split(/\r?\n/)
          .slice(1)
          .filter((l) => l.trim() !== "")
          .map((l) => l.replace(/\s+/g, " ").trim())
          .join(" ; ") || "nothing is listening";
  recs.push(value(`port ${port} holder: ${holder}`, live(ctx, spelling)));
  for (const entry of parseWorktreePorcelain(ctx.porcelain)) {
    if (path.resolve(entry.path) === path.resolve(ctx.root)) continue;
    const kind = entry.branch === "" ? "detached, NOT a lane" : `on ${entry.branch}`;
    recs.push(
      value(
        `another checkout exists and is not yours: ${entry.path} (${kind})`,
        live(ctx, "git worktree list --porcelain"),
      ),
    );
  }
  recs.push(
    note("a live fact carries the time and host it was read at, never a commit — re-read it at dispatch"),
  );
  return recs;
}

/**
 * @typedef {object} CeremonyRow
 * @property {string} size
 * @property {string} pipeline
 */

/** @param {string} taskFormatMd @returns {CeremonyRow[]} */
export function ceremonyRows(taskFormatMd) {
  const lines = taskFormatMd.split(/\r?\n/);
  const head = lines.findIndex((l) => {
    const cells = tableCells(l);
    return cells !== undefined && cells.length === 2 && cells[0] === "Size" && cells[1] === "Pipeline";
  });
  if (head < 0) {
    throw new Error(
      "dispatch-brief: method/tasks/TASK-FORMAT.md has no ceremony table headed Size / Pipeline — " +
        "row 11 reads its ROW rather than reasoning from the tier letter, so a missing table is a " +
        "hard failure.",
    );
  }
  /** @type {CeremonyRow[]} */
  const rows = [];
  for (let i = head + 2; i < lines.length; i += 1) {
    const cells = tableCells(/** @type {string} */ (lines[i]));
    if (cells === undefined || cells.length !== 2) break;
    rows.push({ size: /** @type {string} */ (cells[0]), pipeline: /** @type {string} */ (cells[1]) });
  }
  if (rows.length === 0) throw new Error("dispatch-brief: the ceremony table has no rows");
  return rows;
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveDeliverable(ctx) {
  const rows = ceremonyRows(taskFormatText(ctx.root));
  const size = ctx.card === undefined ? "" : fieldScalar(ctx.card.fields, "size");
  const matching =
    size === "" ? rows : rows.filter((r) => r.size === size || r.size.startsWith(`${size},`));
  /** @type {Rec[]} */
  const recs = [];
  if (size === "") recs.push(note("no card named, so every ceremony row is printed"));
  for (const r of matching) {
    recs.push(value(`ceremony row ${r.size}: ${r.pipeline}`, tree(ctx, "method/tasks/TASK-FORMAT.md ceremony table")));
  }
  if (matching.length > 1) {
    recs.push(
      note(
        "more than one row matches this tier — WHICH row is a reading of the diff, not of the letter, and this tool will not guess it",
      ),
    );
  }
  if (matching.length === 0 && size !== "") {
    ctx.findings.push(
      `the ceremony table has no row for size ${size}, so this card's ceremony cannot be derived.`,
    );
  }
  recs.push(
    value(`status to stamp: ${numberedStep(ctx.roleMd, 6)}`, tree(ctx, `method/roles/${ctx.role}.md step 6`)),
    value(
      `who merges and who removes the worktree: ${numberedStep(laneProtocolText(ctx.root), 6)}`,
      tree(ctx, "method/lane-protocol.md rule six"),
    ),
  );
  return recs;
}

/** @param {Ctx} ctx @returns {Rec[]} */
function deriveReport(ctx) {
  const spec = section(ctx.roleMd, "## The report");
  const bullets = [...spec.matchAll(/^- \*\*(.+?)\*\*/gm)].map((m) => /** @type {string} */ (m[1]));
  if (bullets.length === 0) {
    throw new Error(
      `dispatch-brief: method/roles/${ctx.role}.md's report section names no bold items — this ` +
        "row transcribes them.",
    );
  }
  const roles = trackedFiles(ctx.root).filter(
    (rel) => rel.startsWith("method/roles/") && rel.endsWith(".md"),
  );
  // COLLAPSED BEFORE SEARCHING, and that is not tidiness: the sentence
  // wraps in orchestrator.md, so a raw `includes` finds nothing and the
  // row silently loses its second source. Measured here on the first run.
  const dispatchers = roles.filter((rel) =>
    readDoc(rel, ctx.root).replace(/\s+/g, " ").includes(DISPATCHER_PHRASE),
  );
  /** @type {Rec[]} */
  const recs = bullets.map((b) =>
    value(`report: ${b}`, tree(ctx, `method/roles/${ctx.role}.md section The report`)),
  );
  if (dispatchers.length === 0) {
    ctx.findings.push(
      "no role file says it assembles the brief to this contract, so row 12's second source — " +
        "the dispatching role's report spec — cannot be located.",
    );
  }
  for (const d of dispatchers) {
    recs.push(value(`report also to the dispatching role: ${d}`, tree(ctx, `${d} names the brief contract`)));
  }
  if (ctx.full) {
    recs.push(value(`report spec in full: ${spec.replace(/\s+/g, " ")}`, tree(ctx, `method/roles/${ctx.role}.md`)));
  }
  return recs;
}

/**
 * One `- ` bullet of a section, found by a phrase it carries. Throws on
 * anything but exactly one, for the reason every other locator in this
 * module does.
 *
 * @param {string} sectionText
 * @param {string} phrase
 * @returns {string}
 */
export function sectionBullet(sectionText, phrase) {
  const found = sectionText
    .split(/\n(?=- )/)
    .filter((b) => b.startsWith("- "))
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter((b) => b.includes(phrase));
  if (found.length !== 1) {
    throw new Error(
      `dispatch-brief: ${found.length} bullets carry ${JSON.stringify(phrase)}, expected exactly ` +
        "one — a transcription that silently becomes empty is a paraphrase.",
    );
  }
  return /** @type {string} */ (found[0]);
}

/** @param {Ctx} ctx @param {ContractRow} row @returns {Rec[]} */
function deriveCorrection(ctx, row) {
  const rules = section(ctx.roleMd, "### Rules that govern the whole brief");
  const evidence = sectionBullet(rules, "A brief is evidence, never authority");
  const figures = sectionBullet(rules, "Every figure carries the ref it was measured at");
  return [
    value(
      `the clause, from the row itself: ${row.carries}`,
      tree(ctx, `method/roles/${ctx.role}.md contract row ${row.n}`),
    ),
    value(`and the rule behind it: ${evidence}`, tree(ctx, `method/roles/${ctx.role}.md rules section`)),
    value(`and the figure rule this tool obeys: ${figures}`, tree(ctx, `method/roles/${ctx.role}.md rules section`)),
  ];
}

/* ────────────────────────────────────────────────────────────────────
 * THE CONTEXT PACK (T-254).
 *
 * AN EXECUTOR'S STANDING READ IS ITS CARD PLUS docs/STATE.md,
 * docs/ARCHITECTURE.md AND docs/CONVENTIONS.md — and three quarters of
 * that is the last document, most of which is rules a GATE enforces. A
 * rule a gate enforces does not have to be READ to be obeyed: the fence
 * hook refuses the write, the landing gate refuses the merge, the push
 * guard refuses the push, whatever the seat happened to remember. So the
 * pack names the bullets that actually bind THIS card and leaves the rest
 * to the architect, and **THE SAFETY NET IS THE GATES RATHER THAN THE
 * READING** — a bullet the pack omits still refuses, loudly, and that
 * refusal is reported as a PACK GAP rather than quietly absorbed.
 *
 * **THE BULLET SET IS DERIVED, NEVER HAND-LISTED**, and the derivation is
 * the gates' OWN CITATIONS: every tracked `.mjs` under `.claude/hooks/`
 * and `tools/e2e/scripts/` — the files that ARE the gates in this
 * repository — is searched for each bullet's own HEADING, and the
 * headings are themselves read off docs/CONVENTIONS.md by `standingGates`
 * and `namedDisciplines` above rather than typed here. A hand list would
 * go stale the day a gate stops citing a rule and would never say so;
 * this one moves with both documents at once, and an EMPTY answer is
 * reported rather than filled in.
 *
 * **AND A LONG BULLET IS CITED RATHER THAN TRANSCRIBED**, by the law the
 * two long passages above already keep (T-225-s2): a pack that copies a
 * fifteen-kilobyte bullet into the brief has MOVED the cost rather than
 * removed it, and the brief is the thing the seat reads first. Short
 * bullets are transcribed FLATTENED, the way every other quotation in
 * this command is; long ones get the address the citation machinery above
 * already builds — heading, size at this ref, opening capitals, and a
 * command that finds them across the hard wrap.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The two directories whose files ARE the gates here: the PreToolUse and
 * PreToolUse-adjacent hooks that refuse a write, a push and a merge, and
 * the scripts the gate bullets themselves name.
 */
export const GATE_SOURCE_DIRS = Object.freeze([".claude/hooks/", "tools/e2e/scripts/"]);

/**
 * The size at which a bullet stops being TRANSCRIBED and starts being
 * CITED BY ADDRESS.
 *
 * It is a DECLARED constant rather than a derivation because there is
 * nothing in either document to derive it from: what it encodes is a
 * judgement about this brief's own budget, and a figure invented out of
 * the tree to look derived would be worse than one stated plainly. The
 * spec drives BOTH arms, so neither is a branch nobody has met — and the
 * two passages T-225-s2 was written for sit an order of magnitude above
 * it while the gate bullets the pack transcribes sit below.
 */
export const PACK_TRANSCRIPTION_LIMIT = 2_000;

/**
 * The gates' own sources, as text. TRACKED files only, so the corpus is a
 * function of the TREE rather than of whatever a checkout happens to hold
 * — an untracked scratch `.mjs` dropped in either directory would
 * otherwise add citations nobody committed.
 *
 * **AN EMPTY CORPUS IS AN ANSWER, NOT A FAILURE, AND THE PACK SAYS WHICH
 * ZERO IT IS.** `method/` is product-agnostic and this assembler runs
 * against any project's root — the method eval gate's own fixture root is
 * exactly such a project, with a live `method/` and no hooks directory at
 * all. So this throws nothing and hands back an empty list; `packRecs`
 * distinguishes *no gate source exists here* from *the gates cite nothing*
 * in as many words, because those are two different facts and a single
 * silent zero would be neither.
 *
 * @param {string} root
 * @returns {{ rel: string, text: string }[]}
 */
export function gateSources(root = repoRoot) {
  return trackedFiles(root)
    .filter((rel) => GATE_SOURCE_DIRS.some((d) => rel.startsWith(d)) && rel.endsWith(".mjs"))
    .sort()
    .map((rel) => ({ rel, text: readDoc(rel, root) }));
}

/**
 * The bullet of docs/CONVENTIONS.md that OPENS with a heading.
 *
 * `rawBullet` above finds a bullet CONTAINING a phrase, which is right
 * for a phrase chosen to identify one paragraph and wrong for a heading:
 * "GRAPH REGEN" appears in five bullets and "DOCS GATE" in four, so a
 * containment reader throws where the document is perfectly well formed.
 * The headings this module spends were READ OFF THE OPENERS, so the
 * opener is what they address.
 *
 * @param {string} md
 * @param {string} heading
 * @returns {string}
 */
export function bulletByOpening(md, heading) {
  const found = md
    .split(/\n(?=- )/)
    .filter((b) => b.startsWith("- "))
    .filter((b) => {
      // A BOLDED opener is the same opener: `- **THE RULE** …` opens with
      // THE RULE (T-254's verdict, correction 1). The character after the
      // heading may not continue the word, or "THE GATE" would also
      // open "THE GATE-RUNNER" bullets.
      const flat = b.replace(/\s+/g, " ");
      for (const prefix of [`- ${heading}`, `- **${heading}`]) {
        if (flat.startsWith(prefix) && !/[A-Za-z0-9]/.test(flat.charAt(prefix.length))) return true;
      }
      return false;
    });
  if (found.length !== 1) {
    throw new Error(
      `dispatch-brief: ${found.length} bullets of docs/CONVENTIONS.md OPEN with ` +
        `${JSON.stringify(heading)}, expected exactly one — the pack quotes the bullet a heading ` +
        "names, and a heading naming none or two is a pack quoting the wrong rule at a seat that " +
        "cannot tell.",
    );
  }
  return /** @type {string} */ (found[0]);
}

/**
 * Every heading docs/CONVENTIONS.md gives a rule of its own, read off the
 * document by the two enumerations this command already keeps: the
 * standing gates (with and without a merge-diff trigger) and the named
 * disciplines. NOT a list — the whole point is that a bullet renamed in
 * the document is renamed here in the same commit.
 *
 * @param {string} conventionsMd
 * @returns {string[]}
 */
export function conventionHeadings(conventionsMd) {
  const { gates, named } = standingGates(conventionsMd);
  const skip = [...gates.map((g) => g.name), ...named];
  const enumerated = [
    ...gates.map((g) => g.name),
    ...named,
    ...namedDisciplines(conventionsMd, skip).map((d) => d.name),
  ];
  return [...enumerated, ...boldedOpeners(conventionsMd, enumerated)];
}

/**
 * THE DOCUMENT'S OWN SHOUTED OPENERS (T-254's verdict, correction 1). The
 * two enumerations above address 25 of docs/CONVENTIONS.md's 58 top-level
 * bullets; every bullet whose opener is BOLDED — the shouted, most
 * load-bearing class, four of them cited by a gate today — was not a
 * candidate at all, so a gate that cited one was answered with silence
 * rather than with a pack entry. Read off the document, never listed: a
 * bullet renamed there is renamed here in the same commit. An opener the
 * enumerations already address (either the longer or the shorter
 * spelling) is theirs, so the pack carries a bullet ONCE.
 *
 * @param {string} conventionsMd
 * @param {string[]} enumerated
 * @returns {string[]}
 */
export function boldedOpeners(conventionsMd, enumerated) {
  /** @type {string[]} */
  const out = [];
  for (const b of conventionsMd.split(/\n(?=- )/).filter((x) => x.startsWith("- "))) {
    const flat = b.replace(/\s+/g, " ").trim().slice(2);
    const m = /^\*\*([A-Z][A-Z'`’ ,\-]{7,70})/.exec(flat);
    if (m === null) continue;
    const opener = /** @type {string} */ (m[1]).replace(/[ ,\-]+$/, "").trim();
    if (enumerated.some((h) => opener.startsWith(h) || h.startsWith(opener))) continue;
    if (!out.includes(opener)) out.push(opener);
  }
  return out;
}

/**
 * The bullets the gates CITE, each with the sources that cite it, in the
 * document's own order.
 *
 * TWO SPELLINGS OF ONE BULLET'S OPENER ARE ONE BULLET. The gate
 * enumeration captures an opener up to `GATE` or `REGEN` and the
 * discipline enumeration captures the whole of it, so THE BLESSED GATE
 * and THE BLESSED GATE-RUNNER address the same paragraph; the pack
 * carries it ONCE, under the longer name, with both spellings' citers
 * merged. A pack that printed one bullet twice would be a pack whose byte
 * figure lies about what it costs to read.
 *
 * @param {string} conventionsMd
 * @param {{ rel: string, text: string }[]} sources
 * @returns {{ heading: string, raw: string, citedBy: string[] }[]}
 */
export function citedConventionBullets(conventionsMd, sources) {
  /** @type {Map<string, { heading: string, raw: string, citedBy: string[] }>} */
  const byBullet = new Map();
  for (const heading of conventionHeadings(conventionsMd)) {
    const citedBy = sources.filter((s) => s.text.includes(heading)).map((s) => s.rel);
    if (citedBy.length === 0) continue;
    const raw = bulletByOpening(conventionsMd, heading);
    const held = byBullet.get(raw);
    if (held === undefined) {
      byBullet.set(raw, { heading, raw, citedBy: [...citedBy] });
      continue;
    }
    if (heading.length > held.heading.length) held.heading = heading;
    for (const c of citedBy) if (!held.citedBy.includes(c)) held.citedBy.push(c);
  }
  return [...byBullet.values()].sort(
    (a, b) => conventionsMd.indexOf(a.raw) - conventionsMd.indexOf(b.raw),
  );
}

/** The first segment a method reference may carry, as MF-04 spells it. */
export const METHOD_REFERENCE_DIRS = "roles|tasks|interview|rooms|runtime|adapters|docs-templates";

/**
 * The method files a role file NAMES, resolved and sized.
 *
 * THE RESOLUTION IS THE METHOD'S OWN, not the filesystem's: role files
 * write `../lane-protocol.md` for the method root and `tasks/TASK-FORMAT.md`
 * for a sibling directory, so a plain `path.join` against `method/roles/`
 * resolves the second one to a file that does not exist. The grammar here
 * is the one `tools/method-evals/evals/mf-04-method-crossrefs.mjs`
 * already enforces across the whole method, so the pack and that eval
 * agree about what a method reference IS.
 *
 * EXISTENCE IS ASKED OF GIT, not of `stat`: a placeholder like
 * `tasks/T-NNN-slug.md` names a SHAPE and must not become a pack entry,
 * and an untracked file is not part of the method the kit ships.
 *
 * @param {string} roleMd
 * @param {string} roleRel  the role file's own repository-relative path
 * @param {string} root
 * @returns {{ rel: string, spelling: string, bytes: number }[]}
 */
export function methodNamed(roleMd, roleRel, root = repoRoot) {
  const tracked = new Set(trackedFiles(root));
  const reference = new RegExp(
    String.raw`(?<![\w./-])((?:\.\./)?(?:method/)?(?:(?:${METHOD_REFERENCE_DIRS})/)?[\w.-]+\.md)(?![\w])`,
    "g",
  );
  /** @type {{ rel: string, spelling: string, bytes: number }[]} */
  const out = [];
  for (const m of roleMd.matchAll(reference)) {
    const spelling = /** @type {string} */ (m[1]);
    const rel = `method/${spelling.replace(/^\.\.\//, "").replace(/^method\//, "")}`;
    if (rel === roleRel || !tracked.has(rel) || out.some((e) => e.rel === rel)) continue;
    out.push({ rel, spelling, bytes: Buffer.byteLength(readDoc(rel, root), "utf8") });
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

/**
 * THE PACK, as records. Emitted after the contract's rows and outside
 * them: the contract table is NORMATIVE and a fourteenth row would be a
 * method version bump, which is not this command's to take.
 *
 * @param {Ctx} ctx
 * @returns {Rec[]}
 */
export function packRecs(ctx) {
  const sources = gateSources(ctx.root);
  const bullets = citedConventionBullets(ctx.conventions, sources);
  const roleRel = `method/roles/${ctx.role}.md`;
  const method = methodNamed(ctx.roleMd, roleRel, ctx.root);
  const packBytes = bullets.reduce((n, b) => n + Buffer.byteLength(b.raw, "utf8"), 0);
  /** @type {Rec[]} */
  const recs = [
    note(
      "THE CONTEXT PACK — what this seat reads INSTEAD of docs/CONVENTIONS.md end to end; the " +
        "WHOLE document is the ARCHITECT'S read, never the seat's",
    ),
    value(
      `pack: docs/CONVENTIONS.md is ${Buffer.byteLength(ctx.conventions, "utf8")} bytes at this ` +
        `ref, and the pack names ${bullets.length} of its bullets — ${packBytes} bytes of rule ` +
        "this seat is answerable for, and the rest is the architect's",
      tree(ctx, "docs/CONVENTIONS.md, measured at this ref"),
    ),
    value(
      `pack derivation: each bullet below is named by a GATE'S OWN SOURCE — ${sources.length} ` +
        `tracked .mjs file(s) under ${GATE_SOURCE_DIRS.join(" and ")}, searched for the heading ` +
        "docs/CONVENTIONS.md's own bullet opener gives each rule; nothing here is hand-listed",
      tree(ctx, `${GATE_SOURCE_DIRS.join(" + ")} against docs/CONVENTIONS.md's bullet openers`),
    ),
  ];
  for (const m of method) {
    recs.push(
      value(
        `pack method file: ${m.rel} (${m.bytes} bytes), named by ${roleRel} as ${JSON.stringify(m.spelling)}`,
        tree(ctx, `${roleRel}, and ${m.rel} for its size`),
      ),
    );
  }
  if (method.length === 0) {
    recs.push(note("this role file names no other method file, so the pack carries none"));
  }
  for (const b of bullets) {
    const flat = b.raw.replace(/\s+/g, " ").trim();
    const cited = `cited by ${b.citedBy.join(", ")}`;
    if (Buffer.byteLength(flat, "utf8") <= PACK_TRANSCRIPTION_LIMIT) {
      recs.push(
        value(
          `pack bullet: ${b.heading} — TRANSCRIBED, ${cited}: ${flat}`,
          tree(ctx, `docs/CONVENTIONS.md ${b.heading} bullet, verbatim`),
        ),
      );
      continue;
    }
    recs.push(
      citedRule(ctx, {
        label: `pack bullet: ${b.heading} — ${cited}`,
        source: `docs/CONVENTIONS.md ${b.heading} bullet`,
        file: "docs/CONVENTIONS.md",
        raw: ctx.conventions,
        flat,
      }),
    );
  }
  /** @type {string[]} */
  const slugsTouched = [];
  for (const entry of ctx.card === undefined ? [] : fieldList(ctx.card.fields, "touches")) {
    const expanded = expandFenceEntry(entry, ctx.slugs, ctx.comps);
    if (expanded.kind !== "slug" || slugsTouched.includes(entry)) continue;
    slugsTouched.push(entry);
    for (const id of ctx.slugs.get(entry) ?? []) {
      const comp = ctx.comps.find((c) => c.id === id);
      if (comp === undefined) continue;
      recs.push(
        value(
          `pack component: ${comp.file} — ${comp.id}, reached by the touched slug ${entry}, ` +
            `paths ${comp.paths.join(" ")}`,
          tree(ctx, `${comp.file} frontmatter, through each component's own touch_slugs field`),
        ),
      );
    }
  }
  if (slugsTouched.length === 0) {
    recs.push(
      note(
        ctx.card === undefined
          ? "no card was named, so the pack carries no component entry"
          : "this card's fence names no component SLUG — its touches are bare paths — so the " +
            "pack carries no component entry",
      ),
    );
  }
  if (bullets.length === 0) {
    // TWO DIFFERENT ZEROS, SAID APART. A project with no gate source has
    // nothing to derive a pack FROM; a project whose gates cite no rule
    // has a derivation that ran and came back empty. Collapsing them
    // would make the commonest deployment of this method — a fresh
    // project carrying method/ and no hooks — look like a repository
    // whose gates had quietly stopped citing anything.
    recs.push(
      value(
        sources.length === 0
          ? `pack: this checkout tracks NO gate source under ${GATE_SOURCE_DIRS.join(" or ")}, ` +
            `so none of the ${conventionHeadings(ctx.conventions).length} named bullets of ` +
            "docs/CONVENTIONS.md can be cited by one — the derivation had nothing to read, " +
            "which is not the same as gates that cite nothing"
          : `pack: the ${sources.length} gate source(s) cite NONE of the ` +
            `${conventionHeadings(ctx.conventions).length} named bullets of ` +
            "docs/CONVENTIONS.md — the derivation ran and came back empty",
        tree(ctx, `${GATE_SOURCE_DIRS.join(" + ")} against docs/CONVENTIONS.md's bullet openers`),
      ),
      note(
        "so the pack names no bullet: read this role's method files above and the card, and " +
          "nothing else — never fall back to the whole document because the pack was quiet",
      ),
    );
  }
  recs.push(
    note(
      "a bullet this pack omits is still ENFORCED — the safety net is the gates, not the " +
        "reading; when one refuses, report it as a PACK GAP rather than widening the read by hand",
    ),
    note(
      "the pack is an INDEX over docs/CONVENTIONS.md and the document is the authority: where a " +
        "quotation and the file differ, the file wins and the seat says so",
    ),
  );
  return recs;
}

/**
 * THE DERIVERS, keyed by the row LABEL the table itself carries. Binding
 * on the label rather than the number is what survives a row being
 * inserted: a renumbered table still answers, and a RENAMED row is
 * reported by name instead of silently answered from the wrong source.
 *
 * @type {Map<string, (ctx: Ctx, row: ContractRow) => Rec[]>}
 */
export const DERIVERS = new Map([
  ["role", deriveRole],
  ["task", deriveTask],
  ["read-first set", deriveReadFirst],
  ["the lane", deriveLane],
  ["the fence", deriveFence],
  ["setup", deriveSetup],
  ["commands", deriveCommands],
  ["gates", deriveGates],
  ["standing disciplines", deriveDisciplines],
  ["prohibitions", deriveProhibitions],
  ["the deliverable", deriveDeliverable],
  ["the report", deriveReport],
  ["the correction clause", deriveCorrection],
]);

/* ────────────────────────────────────────────────────────────────────
 * Assembly.
 * ──────────────────────────────────────────────────────────────────── */

/** @param {string} root @returns {string} */
export function worktreePorcelain(root) {
  return git(root, ["worktree", "list", "--porcelain"]);
}

/** @param {string} id @returns {string} */
export function normaliseTaskId(id) {
  // The suffix is part of the id, not the slug: T-153-s5 is a CARD, and
  // truncating it hands back a DIFFERENT card — measured at the
  // T-153-s5 dispatch (T-143's class, fourth instance), where
  // `--write-fence` stamped T-153's app-shell fence into an s5 lane.
  const m = /^(?:T-?)?(\d+)(-s\d+)?$/i.exec(id.trim());
  if (m !== null)
    return `T-${/** @type {string} */ (m[1]).padStart(3, "0")}${m[2] ?? ""}`;
  const fromPath = /(T-\d+(?:-s\d+)?)/.exec(id);
  if (fromPath !== null) return /** @type {string} */ (fromPath[1]);
  throw new Error(
    `dispatch-brief: ${JSON.stringify(id)} is not a task id — give the id (T-133), its number, or ` +
      "the path to its card.",
  );
}

/**
 * @typedef {object} Options
 * @property {string} [root]
 * @property {string} [role]
 * @property {string} [taskId]
 * @property {boolean} [full]
 * @property {string} [porcelain]  a fixture, for the pin that drives a detached lane-shaped path
 */

/** @param {Options} opts @returns {Ctx} */
export function context(opts = {}) {
  const root = opts.root ?? repoRoot;
  const role = opts.role ?? DEFAULT_ROLE;
  const conventions = conventionsText(root);
  const spellings = laneSpellings(conventions);
  const porcelain = opts.porcelain ?? worktreePorcelain(root);
  const cards = cardIndex(root);
  const comps = components(root);
  const taskId = opts.taskId === undefined || opts.taskId === "" ? "" : normaliseTaskId(opts.taskId);
  // RESOLVED BEFORE IT IS SPENT. Which spelling of the integration branch
  // this checkout holds is a LIVE fact — the same tree answers differently
  // on a `push` runner and on a `pull_request` one — so it is read here,
  // once, and every consumer spends the answer rather than the name.
  const integration = resolveIntegrationRef(root, spellings.integrationBranch);
  const lanes = laneWorktrees(porcelain, spellings);
  // THE CUT, READ ONCE, BESIDE THE LOG (T-300-s7). Row 4's base is the
  // commit the lane was cut at wherever there IS a lane, and that is a
  // read of two mutable refs — so it belongs here with the other live
  // reads rather than inside a deriver, and a body can drive a second
  // answer at one ref exactly as it can for the log.
  const mine = taskId === "" ? undefined : lanes.find((l) => l.taskId === taskId);
  return {
    root,
    ref: git(root, ["rev-parse", "HEAD"]).trim(),
    at: new Date().toISOString(),
    host: hostName(),
    role,
    taskId,
    card: taskId === "" ? undefined : cards.get(taskId),
    cards,
    comps,
    slugs: slugMapFromFields(comps),
    lanes,
    porcelain,
    integrationRef: integration.rev,
    integrationLog: git(root, ["log", "--first-parent", "--format=%H %s", integration.rev]),
    laneCut: mine === undefined ? null : laneCutCommit(root, mine.branch, integration.rev),
    spellings,
    conventions,
    roleMd: roleText(role, root),
    archMd: architectureText(root),
    full: opts.full ?? false,
    // THE PROCESS, READ ONCE PER CONTEXT (T-299, ADR-024 decision 6).
    // A forbidden combination throws HERE, before a row is assembled or
    // a worktree is cut, which is the same place a missing role default
    // refuses; an absent schema is `null` and the arms below run what
    // they ran before the settings existed.
    process: loadProcess(root),
    findings: [],
  };
}

/** @returns {string} */
function hostName() {
  const probe = spawnSync("hostname", [], { encoding: "utf8" });
  const name = (probe.stdout ?? "").trim();
  return name === "" ? "unknown-host" : name;
}

/**
 * ARM ONE — the brief's rows, each derived from the source its own row
 * names. The row set comes off the role file; this function binds
 * derivers to it and reports both directions of the coverage.
 *
 * @param {Ctx} ctx
 * @returns {{ recs: Rec[], findings: string[], rows: ContractRow[] }}
 */
export function assembleBrief(ctx) {
  const rows = contractRows(ctx.roleMd);
  /** @type {Rec[]} */
  const recs = [
    note("THE DISPATCH BRIEF, DERIVED — every row from the source its own row names"),
    value(`repository: ${ctx.root}`, tree(ctx, "the checkout this command ran in")),
    value(`HEAD in full: ${ctx.ref}`, tree(ctx, "git rev-parse HEAD")),
    value(`contract: method/roles/${ctx.role}.md, its normative table`, tree(ctx, "the row set is READ, never transcribed")),
    blank(),
  ];
  for (const row of rows) {
    recs.push(value(`ROW ${row.n} — ${row.label}`, tree(ctx, `method/roles/${ctx.role}.md contract row ${row.n}`)));
    recs.push(
      value(`  assembled from: ${row.source}`, tree(ctx, `method/roles/${ctx.role}.md row ${row.n}, column three`)),
    );
    const deriver = DERIVERS.get(row.key);
    if (deriver === undefined) {
      recs.push(
        value(
          `  NOT DERIVED — assemble this row by hand from the source above`,
          tree(ctx, `method/roles/${ctx.role}.md row ${row.n}`),
        ),
      );
      ctx.findings.push(
        `contract row ${row.n} (${row.label}) has no deriver, so this command cannot assemble ` +
          `the whole brief. Its source is: ${row.source}`,
      );
      recs.push(blank());
      continue;
    }
    for (const rec of deriver(ctx, row)) {
      recs.push(rec.kind === "value" ? value(`  ${rec.text}`, rec.prov) : rec);
    }
    recs.push(blank());
  }
  // THE PACK, AFTER THE ROWS AND OUTSIDE THEM (T-254). The contract table
  // is normative and a fourteenth row is a method version bump; the pack
  // is what the rows' own sources add up to for THIS card, so it sits
  // where the advisory line sits — below the contract, plainly labelled.
  for (const rec of packRecs(ctx)) recs.push(rec);
  // THE PROCESS, AFTER THE PACK AND OUTSIDE THE ROWS, for the reason the
  // pack sits there: the contract table is normative and a fourteenth
  // row is a method version bump, while what the project's loop is SET
  // to is a fact about the project rather than a row of the contract.
  for (const rec of processRecs(ctx)) recs.push(rec);
  const labels = new Set(rows.map((r) => r.key));
  for (const key of DERIVERS.keys()) {
    if (labels.has(key)) continue;
    ctx.findings.push(
      `this command derives a row labelled ${JSON.stringify(key)} and the contract table no ` +
        "longer carries it — a deriver with no row is a second row set, which is the defect the " +
        "row set is read for.",
    );
  }
  return { recs, findings: ctx.findings, rows };
}

/* ────────────────────────────────────────────────────────────────────
 * ARM TWO — STATE's volatile sections.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The board, derived from disk: every live card's status, plus the
 * rejected/ directory the parser deliberately excludes.
 *
 * @param {string} root
 * @returns {{ byStatus: Map<string, number>, total: number, rejected: number }}
 */
export function boardCensus(root = repoRoot) {
  /** @type {Map<string, number>} */
  const byStatus = new Map();
  let total = 0;
  for (const entry of liveTaskCards(root)) {
    const status = fieldScalar(frontmatterFields(entry.content), "status");
    byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
    total += 1;
  }
  const rejected = trackedFiles(root).filter((rel) =>
    rel.startsWith("docs/tasks/rejected/"),
  ).length;
  return { byStatus: new Map([...byStatus].sort((a, b) => a[0].localeCompare(b[0]))), total, rejected };
}

/**
 * Every fence slug the map knows, with the lane holding it — or `FREE`,
 * which is a claim about the WHOLE WORLD and is therefore unreachable
 * while part of the world could not be read.
 *
 * A LANE WHOSE CARD THIS CHECKOUT CANNOT READ HOLDS AN UNKNOWN FENCE,
 * NEVER AN EMPTY ONE (T-143 criteria 1 and 2). This function shipped
 * `if (card === undefined) continue` — the identical sentence
 * `lib/parser/src/lanes.ts` was rejected for at `62a4364`, in the second
 * implementation, filed as `T-137-s11` and left as this card's ground.
 * `continue` drops the lane's whole fence from the join, so every slug it
 * reserves comes back `FREE` — and the `--state` report prints those rows
 * FOUR LINES BELOW its own lane list saying `no live card — board says
 * unknown` about the same lane. Measured at `c74890a8` with a synthetic
 * `task/T-901-…` lane live: **seven of nine rows read `FREE`**, and each
 * of the seven is ground that lane may be writing right now.
 *
 * THE VOCABULARY IS THE PARSER'S AND IS NOT INVENTED HERE: `unusable` —
 * "no overlap PROVED and none ruled out". `FREE` is folded into nothing
 * and no row is dropped; a row nobody holds reads `UNKNOWN` NAMING the
 * ids whose fences could not be expanded, and a row somebody DOES hold
 * still names its holder and carries the same residual, exactly as
 * `readDispatchOrder`'s `fenced` reason does.
 *
 * @param {Ctx} ctx
 * @returns {{ slug: string, heldBy: string, unknownFrom: string[] }[]}
 */
export function fenceLedger(ctx) {
  /** @type {Map<string, string[]>} */
  const holders = new Map();
  /** @type {string[]} */
  const blind = [];
  for (const lane of ctx.lanes) {
    const card = ctx.cards.get(lane.taskId);
    if (card === undefined) {
      // DEDUPED BY TASK ID, for the reason `lanesWithNoCard` is: two
      // worktrees can sit on one branch and the reader wants the id once.
      if (!blind.includes(lane.taskId)) blind.push(lane.taskId);
      continue;
    }
    for (const entry of fieldList(card.fields, "touches")) {
      const held = holders.get(entry) ?? [];
      held.push(lane.taskId);
      holders.set(entry, held);
    }
  }
  /** @type {Set<string>} */
  const all = new Set([...ctx.slugs.keys(), ...holders.keys()]);
  const named = blind.join(", ");
  const many = blind.length > 1;
  return [...all].sort().map((slug) => {
    const held = holders.get(slug) ?? [];
    if (blind.length === 0) {
      return { slug, heldBy: held.join(", ") || "FREE", unknownFrom: [] };
    }
    return {
      slug,
      heldBy:
        held.length === 0
          ? `UNKNOWN — this checkout has no card for ${named}, so ${many ? "those fences" : "that fence"} ` +
            `could not be expanded at all and this slug cannot be ruled free`
          : `${held.join(", ")} — and UNKNOWN besides: this checkout has no card for ${named}, so ` +
            `${many ? "those fences" : "that fence"} could not be expanded at all`,
      unknownFrom: [...blind],
    };
  });
}

/**
 * THE SLUGS THAT CANNOT BE FREE INDEPENDENTLY — every component id more
 * than one slug expands through, with the slugs that share it.
 *
 * T-143 criterion 3: the ledger is keyed by slug NAME and a fence is a
 * REGION, so two slugs sharing a component can read `FREE` and `HELD`
 * about one set of files. This is DERIVED from the same `touch_slugs`
 * fields the ledger's own map comes from rather than typed, so a
 * component declared tomorrow is in the answer with nothing edited — the
 * card names `C-11` and this function is why the card's example does not
 * have to be maintained.
 *
 * @param {Map<string, string[]>} slugs
 * @returns {{ component: string, slugs: string[] }[]}
 */
export function slugsSharingComponents(slugs) {
  /** @type {Map<string, string[]>} */
  const byComponent = new Map();
  for (const [slug, ids] of slugs) {
    for (const id of ids) {
      const found = byComponent.get(id) ?? [];
      found.push(slug);
      byComponent.set(id, found);
    }
  }
  return [...byComponent]
    .filter(([, names]) => names.length > 1)
    .map(([component, names]) => ({ component, slugs: [...names].sort() }))
    .sort((a, b) => a.component.localeCompare(b.component));
}

/* ────────────────────────────────────────────────────────────────────
 * THE TRIAGE CLUSTERS (T-282) — the suggested column, grouped by the two
 * things that make two cards ONE job.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * WHY THIS EXISTS, AND WHY IT DISPOSITIONS NOTHING.
 *
 * The second sitting of 2026-09-09 found the same defect filed THREE
 * times (`T-216-s6`, `T-256`, `T-238-s5`) and one suggestion that
 * duplicated a live lane's remedy. The rule that would have caught each
 * of them already exists — search before filing, append a corroboration
 * to the class parent — and two lanes OBEYED it. What is missing is the
 * instrument that puts the third filing on the screen BESIDE the first
 * at the moment somebody triages, and that is the whole of this section.
 *
 * IT IS A VIEW AND NEVER A DISPOSITION. A `DUPLICATE CANDIDATE` below is
 * a FLAG FOR THE HUMAN: nothing here writes a card, moves a status or
 * closes anything. The two signals it joins on are exactly the two a
 * triage seat otherwise reconstructs by hand across sixty-odd cards — the
 * ground two cards both reserve, and the class parent they share.
 *
 * AND IT SPENDS THE RESOURCE THE SAME COMMAND MEASURES. `T-225` proved
 * that this answer's capacity is a function of the BYTES it prints per
 * card; a section that printed a row per suggestion would take back what
 * that card bought. So a cluster is ONE line however many cards it holds,
 * a card that clusters with nothing is COUNTED rather than listed, and
 * titles — the longest field on the board — appear nowhere here.
 */

/** The three statuses this view rules on. The criterion names them. */
export const TRIAGE_STATUSES = Object.freeze(["suggested", "planned", "building"]);

/** The two body lines a card carries its class kinship on. */
export const CLASS_KIN_OPENERS = Object.freeze(["Absorbs", "Class parent"]);

/**
 * The class parent an id carries on its own face: `T-205-s16` -> `T-205`.
 * A card with no suffix is its own stem, which is what makes a suggestion
 * and the card it was filed against comparable at all.
 *
 * @param {string} id
 * @returns {string}
 */
export function classStem(id) {
  const m = /^(T-\d+)(?:-s\d+)?$/.exec(String(id).trim());
  return m === null ? String(id).trim() : /** @type {string} */ (m[1]);
}

/** Every task id in a run of text, normalised to the board's spelling. */
/** @param {string} s @returns {string[]} */
function idsIn(s) {
  /** @type {string[]} */
  const out = [];
  for (const m of s.matchAll(/\bT-\d+(?:-s\d+)?\b/g)) {
    try {
      out.push(normaliseTaskId(/** @type {string} */ (m[0])));
    } catch {
      // A token this module cannot name is not kinship evidence. It
      // cannot happen through the pattern above and is caught rather
      // than trusted, because an id parser that throws inside a REPORT
      // takes the whole answer down with it.
    }
  }
  return out;
}

/** Card ids in board order: stem numerically, then suffix numerically. */
/** @param {string} a @param {string} b @returns {number} */
export function byCardId(a, b) {
  const pa = /^T-(\d+)(?:-s(\d+))?$/.exec(a);
  const pb = /^T-(\d+)(?:-s(\d+))?$/.exec(b);
  if (pa === null || pb === null) return a.localeCompare(b);
  const na = Number(pa[1]);
  const nb = Number(pb[1]);
  if (na !== nb) return na - nb;
  return Number(pa[2] ?? 0) - Number(pb[2] ?? 0);
}

/**
 * The ids a card's own body claims kinship with — every task id on a line
 * opening `Absorbs:` or `Class parent:`, and, where that opener is a
 * HEADING with no id on it, on the first non-blank line under it (which
 * is how `## Class parent` is spelled on this board).
 *
 * IT ERRS TOWARD SHOWING THE PAIR. A line's parenthetical prose can name
 * a card that is context rather than kin, and this reads it as kin — the
 * output is a FLAG a human reads, so a pair shown and dismissed costs one
 * line while a pair never shown costs the duplicate filing this whole
 * section exists to prevent.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function classKin(text) {
  const lines = String(text).split(/\r?\n/);
  /** @type {Set<string>} */
  const out = new Set();
  for (let i = 0; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    const bare = line.replace(/^[\s>#*+-]+/, "").replace(/\*\*/g, "").trim();
    const opener = CLASS_KIN_OPENERS.find((o) => new RegExp(`^${o}\\b`, "i").test(bare));
    if (opener === undefined) continue;
    // THE COLON HAS TO BE NEAR THE OPENER, because the parenthetical form
    // (`Absorbs (eighth triage, 2026-08-25):`) is live on this board and a
    // sentence merely STARTING with the word is not a kinship line.
    const colon = bare.indexOf(":");
    const named = colon === -1 || colon > opener.length + 40 ? [] : idsIn(bare.slice(colon + 1));
    if (named.length > 0) {
      for (const id of named) out.add(id);
      continue;
    }
    // A HEADING SPELLS THE OPENER AND LEAVES THE IDS UNDER IT, which is how
    // `## Class parent` is written on this board.
    if (!/^\s*#/.test(line)) continue;
    for (let j = i + 1; j < lines.length && j <= i + 4; j += 1) {
      const next = /** @type {string} */ (lines[j]);
      if (next.trim() === "") continue;
      for (const id of idsIn(next)) out.add(id);
      break;
    }
  }
  return [...out].sort(byCardId);
}

/**
 * @typedef {object} TriageCard
 * @property {string} id
 * @property {string} status
 * @property {string} file
 * @property {string[]} entries  the card's `touches:` tokens, verbatim
 * @property {string[]} parents  its own stem, plus every kin line's stem
 */

/**
 * The board this view rules on: one entry per live card at a triage
 * status, with its fence tokens and its class parents.
 *
 * @param {{ cards: Map<string, Card>, readText: (file: string) => string }} io
 * @returns {TriageCard[]}
 */
export function triageBoard({ cards, readText }) {
  /** @type {TriageCard[]} */
  const out = [];
  for (const card of cards.values()) {
    const status = fieldScalar(card.fields, "status");
    if (!TRIAGE_STATUSES.includes(status)) continue;
    const kin = classKin(readText(card.file));
    out.push({
      id: card.id,
      status,
      file: card.file,
      entries: fieldList(card.fields, "touches"),
      parents: [...new Set([classStem(card.id), ...kin.map(classStem)])].sort(byCardId),
    });
  }
  return out.sort((a, b) => byCardId(a.id, b.id));
}

/**
 * Every path a card's fence reserves, its slugs expanded.
 *
 * @param {{ entries: string[] }} card
 * @param {Map<string, string[]>} slugs
 * @param {Component[]} comps
 * @returns {string[]}
 */
export function fencePaths(card, slugs, comps) {
  /** @type {Set<string>} */
  const out = new Set();
  for (const entry of card.entries) {
    for (const p of expandFenceEntry(entry, slugs, comps).paths) out.add(p);
  }
  return [...out].sort();
}

/**
 * The ground two cards BOTH reserve, in the reader's own fence tokens.
 *
 * IT SHARES ITS RULE WITH `fenceOverlaps` RATHER THAN RESTATING IT: both
 * decide overlap with `pathsOverlap`, the one home of the prefix rule, so
 * a fence this says is shared is a fence that module says is not
 * disjoint. What differs is the ANSWER SHAPE — that one proves a verdict
 * and names both sides, this one hands a triage reader the path itself,
 * and the containing path where one covers the other.
 *
 * @param {{ entries: string[] }} a
 * @param {{ entries: string[] }} b
 * @param {Map<string, string[]>} slugs
 * @param {Component[]} comps
 * @returns {string[]}
 */
export function sharedGround(a, b, slugs, comps) {
  /** @type {Set<string>} */
  const out = new Set();
  for (const pa of fencePaths(a, slugs, comps)) {
    for (const pb of fencePaths(b, slugs, comps)) {
      if (!pathsOverlap(pa, pb)) continue;
      out.add(pa === pb || pa.length <= pb.length ? pa : pb);
    }
  }
  return [...out].sort();
}

/**
 * @typedef {object} TriageClusters
 * @property {{ members: string[], ground: string[] }[]} fence
 * @property {{ parent: string, members: string[] }[]} classes
 * @property {{ id: string, match: string, status: string, parents: string[], ground: string[] }[]} duplicates
 * @property {string[]} alone     suggestions sharing ground with no other suggestion
 * @property {string[]} unfenced  suggestions declaring no fence at all
 */

/**
 * The whole grouping, as a function of the board and the fence machinery.
 *
 * THE TWO GROUPINGS ARE KEPT APART ON PURPOSE. Joined into one graph they
 * collapse: every card fenced on `tools/e2e` would land in one component
 * with every card of every class, and a cluster that holds everything
 * names nothing. So fence overlap answers *"is this one lane's worth of
 * ground"* and the class parent answers *"is this one defect"* — and the
 * DUPLICATE flag is the conjunction, which is the only place the card's
 * criterion asks the two to agree.
 *
 * AND THE FENCE HALF IS KEYED ON THE GROUND, NOT ON CONNECTEDNESS, WHICH
 * IS A MEASUREMENT RATHER THAN A TASTE. The first build of this function
 * took the connected components of *shares ground with*, which is the
 * obvious reading of "cluster by fence overlap". Driven against this
 * board at `3a69385` it returned SEVENTY-FIVE of the eighty live
 * suggestions as ONE cluster — because a card fenced on `tools/` and a
 * card fenced on `app/` are joined by any third card fencing both, and
 * the broad tokens are common. That answer is the failure the paragraph
 * above names, arriving through the other door. Keyed on the ground, a
 * cluster is *"the cards that reserve THIS path"*, a card may appear in
 * several, and every row names ground a reader can act on.
 *
 * @param {TriageCard[]} board
 * @param {Map<string, string[]>} slugs
 * @param {Component[]} comps
 * @returns {TriageClusters}
 */
export function triageClusters(board, slugs, comps) {
  const suggestions = board.filter((c) => c.status === "suggested");
  const claimed = board.filter((c) => c.status === "planned" || c.status === "building");

  /** @type {Map<string, string[]>} */
  const paths = new Map(suggestions.map((c) => [c.id, fencePaths(c, slugs, comps)]));
  /** Every path any live suggestion reserves — the candidate cluster keys. */
  const keys = [...new Set([...paths.values()].flat())].sort();
  /** @type {Map<string, { members: string[], ground: string[] }>} */
  const bySet = new Map();
  for (const key of keys) {
    const members = suggestions
      .filter((c) =>
        /** @type {string[]} */ (paths.get(c.id)).some((p) => pathsOverlap(p, key)),
      )
      .map((c) => c.id)
      .sort(byCardId);
    if (members.length < 2) continue;
    // DEDUPED BY THE MEMBER SET AND NOT BY THE KEY. Two paths held by
    // exactly the same cards are one cluster with two names, and printing
    // it twice is the per-card byte cost this section is built to avoid.
    const held = bySet.get(members.join(",")) ?? { members, ground: [] };
    held.ground.push(key);
    bySet.set(members.join(","), held);
  }
  const fence = [...bySet.values()].sort(
    (a, b) => b.members.length - a.members.length || byCardId(a.members[0] ?? "", b.members[0] ?? ""),
  );
  const clustered = new Set(fence.flatMap((c) => c.members));
  const alone = suggestions.filter((c) => !clustered.has(c.id)).map((c) => c.id).sort(byCardId);

  /** @type {Map<string, string[]>} */
  const byParent = new Map();
  for (const c of suggestions) {
    for (const p of c.parents) {
      const held = byParent.get(p) ?? [];
      held.push(c.id);
      byParent.set(p, held);
    }
  }
  const classes = [...byParent]
    .filter(([, members]) => members.length > 1)
    .map(([parent, members]) => ({ parent, members: [...members].sort(byCardId) }))
    .sort((a, b) => byCardId(a.parent, b.parent));

  /** @type {{ id: string, match: string, status: string, parents: string[], ground: string[] }[]} */
  const duplicates = [];
  for (const s of suggestions) {
    for (const c of claimed) {
      const parents = s.parents.filter((p) => c.parents.includes(p));
      if (parents.length === 0) continue;
      const ground = sharedGround(s, c, slugs, comps);
      if (ground.length === 0) continue;
      duplicates.push({ id: s.id, match: c.id, status: c.status, parents, ground });
    }
  }
  duplicates.sort((a, b) => byCardId(a.id, b.id) || byCardId(a.match, b.match));

  return {
    fence,
    classes,
    duplicates,
    alone: alone.sort(byCardId),
    unfenced: suggestions.filter((c) => c.entries.length === 0).map((c) => c.id).sort(byCardId),
  };
}

/**
 * The section, as records. It needs `{root, ref, at, host, full}` and
 * nothing else, so BOTH of this project's context shapes can hand it one.
 *
 * `full` is the same dial the rest of the dispatch answer spends: without
 * it the section is one counted line naming what `--full` would spell
 * out, because a triage answer is a page and the default view is what a
 * session could START.
 *
 * @param {{ root?: string, ref: string, at?: string, host?: string, full?: boolean,
 *   cards?: Map<string, Card>, comps?: Component[], slugs?: Map<string, string[]> }} ctx
 * @param {{ cards?: Map<string, Card>, comps?: Component[], slugs?: Map<string, string[]>,
 *   readText?: (file: string) => string, board?: TriageCard[] }} [deps]
 * @returns {Rec[]}
 */
export function triageClusterRecs(ctx, deps = {}) {
  const root = ctx.root ?? repoRoot;
  const cards = deps.cards ?? ctx.cards ?? cardIndex(root);
  const comps = deps.comps ?? ctx.comps ?? components(root);
  const slugs = deps.slugs ?? ctx.slugs ?? slugMapFromFields(comps);
  /** @param {string} file @returns {string} */
  const readText = deps.readText ?? ((file) => readDoc(file, root));
  const board = deps.board ?? triageBoard({ cards, readText });
  const suggestions = board.filter((c) => c.status === "suggested");
  /** @param {string} via @returns {Prov} */
  const tree = (via) => treeProv(ctx.ref, via);
  const fenceVia =
    "the flat docs/tasks/T-*.md field touches, expanded through the component registry's own " +
    "touch_slugs";
  const classVia = "the flat docs/tasks/T-*.md ids, plus each card's own Absorbs / Class parent lines";

  /** @type {Rec[]} */
  const recs = [
    note("THE TRIAGE CLUSTERS — the suggested column grouped by the two things that make two"),
    note("cards ONE job: ground they both reserve, and a class parent they share. THIS VIEW"),
    note("CHANGES NO CARD — nothing here writes, moves or closes one."),
  ];
  if (ctx.full !== true) {
    recs.push(
      value(
        `${suggestions.length} live suggestion(s) — add --full for the fence clusters, the class ` +
          "clusters and the duplicate candidates",
        tree(fenceVia),
      ),
    );
    return recs;
  }

  const clusters = triageClusters(board, slugs, comps);
  recs.push(
    blank(),
    note("BY FENCE — suggestions whose expanded touches: overlap. A cluster is one lane's worth"),
    note("of ground, and it is ONE line however many cards it holds."),
  );
  if (clusters.fence.length === 0) {
    recs.push(value("no two live suggestions share ground", tree(fenceVia)));
  }
  for (const c of clusters.fence) {
    recs.push(
      value(`${c.members.join(", ")} — all reserve ${c.ground.join(", ")}`, tree(fenceVia)),
    );
  }
  recs.push(
    value(
      `${clusters.alone.length} suggestion(s) share ground with no other suggestion`,
      tree(fenceVia),
    ),
    value(
      `${clusters.unfenced.length} suggestion(s) declare no fence at all, so no ground can cluster ` +
        "them and no duplicate can be ruled out for them",
      tree(fenceVia),
    ),
    blank(),
    note("BY CLASS PARENT — the id's own stem, plus every Absorbs: or Class parent: line the card"),
    note("carries. A parent with one live suggestion is not a cluster and is not printed."),
  );
  if (clusters.classes.length === 0) {
    recs.push(value("no class parent holds more than one live suggestion", tree(classVia)));
  }
  for (const c of clusters.classes) {
    recs.push(value(`${c.parent}: ${c.members.join(", ")}`, tree(classVia)));
  }
  recs.push(
    blank(),
    note("DUPLICATE CANDIDATES — the fence AND the class parent both match a card already planned"),
    note("or building. A FLAG FOR THE HUMAN AND NEVER A CLOSURE: the search-before-filing rule is"),
    note("the remedy, and appending a corroboration to the class parent is what it asks for."),
  );
  if (clusters.duplicates.length === 0) {
    recs.push(
      value("no live suggestion matches a planned or building card on both signals", tree(fenceVia)),
    );
  }
  for (const d of clusters.duplicates) {
    recs.push(
      value(
        `${d.id} ~ ${d.match} (${d.status}) — class parent ${d.parents.join(", ")}; both reserve ` +
          d.ground.join(", "),
        tree(fenceVia),
      ),
    );
  }
  return recs;
}


/* ────────────────────────────────────────────────────────────────────
 * THE WAKE CONDITION (T-285) — a park is a condition, not a shelf.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * WHY THIS SECTION EXISTS, IN ONE MEASUREMENT. At the third sitting of
 * 2026-09-09 the board carried a hundred and twenty-nine parked cards.
 * `method/roles/orchestrator.md` already says PARKED IS A CONDITION, NOT
 * A SHELF, and `method/tasks/TASK-FORMAT.md` already says a parking note
 * *"CARRIES A RESURFACING CONDITION OR IT IS A REJECTION NOBODY WROTE
 * DOWN"* — and every one of those conditions was written in PROSE, so
 * nothing read them. A parked card resurfaced only when a human re-read
 * the folder, which happened once, in the amnesty of 2026-08-29, for a
 * hundred and forty cards. The rule was right and unenforced; this is
 * the reader it was missing.
 *
 * ── IT CHANGES NO CARD, AND THAT IS THE DESIGN AND NOT A LIMITATION ──
 * Waking is the SEAT'S act. The two moves a woken card can take —
 * promote it, or re-park it with a NEW condition — are both dispositions,
 * and disposition belongs to triage by the same single-writer rule that
 * governs every other placement field. So this derivation reads the
 * board, the clock and the lane list, and writes nothing anywhere. A
 * view that promoted a card would be a disposition nobody decided,
 * wearing a report's clothes — which is the sentence the triage clusters
 * above already carry, for the same reason.
 *
 * ── THE FIELD NEEDS NO PARSER CHANGE ────────────────────────────────
 * `lib/parser/src/task.ts` preserves unknown frontmatter keys, so `wake:`
 * rides along in the fields this module already reads. Nothing here
 * re-parses frontmatter by hand: `frontmatterFields` is the one reader
 * and `readWake` only INTERPRETS what it hands back.
 *
 * ── AND THE FENCE FORM BORROWS THE EXPANDER, NEVER A SECOND ONE ─────
 * The default condition is *"a lane is dispatched whose expanded fence
 * overlaps this card's"*, which is a fence question — so it is answered
 * by `fenceOverlaps` over `expandFenceEntry`, the same pair the dispatch
 * order and the triage clusters spend. `dispatch-order.mjs`'s own header
 * records what a fourth spelling of that rule costs: an architect
 * hand-rolled the expansion an hour before T-137 was dispatched, left a
 * path token as itself, and reported two cards disjoint that overlap by
 * containment.
 */

/** The status word whose column this view rules on. Pinned by the spec. */
export const PARKED_STATUS = "parked";

/** The status a NAMED card must reach for a `wake: T-NNN` to hold. Pinned by the spec. */
export const WOKEN_BY_STATUS = "done";

/** The one word that spells the default form explicitly. */
export const WAKE_FENCE = "fence";

/**
 * The reason code for the class the view COUNTS rather than spells: a default
 * fence condition on a card that declares no fence. Named here so the section
 * and the ruling agree by construction and never by a matched sentence.
 */
export const NO_GROUND = "no-ground";

/** The card-id form of a `wake:` value. */
const WAKE_CARD_SHAPE = /^T-?\d+(?:-s\d+)?$/i;

/** The ISO-date form. A DAY, and never a timestamp: a park is not scheduled to the second. */
const WAKE_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * THE PROSE TEST, NARROW AND STATED HERE RATHER THAN LEFT TO BE GUESSED.
 *
 * A card counts as carrying a prose condition when a line of its BODY —
 * never its frontmatter — contains the word `unpark` or the word `wake`,
 * case-insensitively, bounded on the LEFT so that `awake` is not a
 * condition and neither is the `parked` every parking note spells about
 * itself. It is deliberately the cheap shape: this predicate feeds ONE
 * flag for a human to read, and the failure it must not have is the
 * confident one — a card whose author wrote a condition reported as
 * having written none.
 *
 * IT IS NOT A PARSE OF THE CONDITION AND MUST NEVER BECOME ONE. What the
 * machine reads is the `wake:` FIELD; this is only the question *did
 * anybody say anything at all*, which is what the criterion's "neither a
 * `wake:` field nor a prose condition" asks. The same definition is
 * written beside the encoding in `method/tasks/TASK-FORMAT.md`, so the
 * card author and this reader are looking at one sentence.
 */
export const PROSE_WAKE_PATTERN = /\b(?:un-?park|wake)/i;

/**
 * The card's body — everything after the closing frontmatter fence.
 *
 * WHETHER THERE IS FRONTMATTER AT ALL IS `frontmatterBlock`'s RULING and
 * is not re-decided here; this only walks to the fence that reader
 * already proved exists. A card with no frontmatter is all body, which is
 * the reading that cannot hide a condition somebody wrote.
 *
 * @param {string} content
 * @returns {string}
 */
export function cardBody(content) {
  if (frontmatterBlock(content) === null) return content;
  const lines = content.split(/\r?\n/);
  let fences = 0;
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^\uFEFF?---[ \t]*$/.test(/** @type {string} */ (lines[i]))) continue;
    fences += 1;
    if (fences === 2) return lines.slice(i + 1).join("\n");
  }
  return "";
}

/** @param {string} s @returns {string} */
function unquote(s) {
  const m = /^(['"])([\s\S]*)\1$/.exec(s);
  return m === null ? s : /** @type {string} */ (m[2]);
}

/**
 * Is this an ISO date that names a DAY ON THE CALENDAR? `2026-02-30` is
 * date-shaped and is not a date, and a condition that can never be
 * reached is worse than one nobody wrote: it reads as a park with a plan.
 *
 * @param {string} raw
 * @returns {boolean}
 */
function isCalendarDate(raw) {
  const [y, m, d] = raw.split("-").map(Number);
  const probe = new Date(Date.UTC(/** @type {number} */ (y), /** @type {number} */ (m) - 1, d));
  return (
    probe.getUTCFullYear() === y && probe.getUTCMonth() === /** @type {number} */ (m) - 1 && probe.getUTCDate() === d
  );
}

/**
 * @typedef {object} WakeCondition
 * @property {"card" | "date" | "fence" | "unreadable"} form
 * @property {string} raw       the field's own text, normalised; "" when absent
 * @property {boolean} declared whether a `wake:` field was written at all
 * @property {string} why       why an unreadable value could not be placed
 */

/**
 * The `wake:` field, INTERPRETED. Three forms and a default, and every
 * other value is REPORTED rather than folded into one of them.
 *
 * ── THE DEFAULT IS THE FENCE, AND IT IS NOT INVENTED HERE ───────────
 * `method/roles/orchestrator.md` names the default event — the card's
 * fence's component is NEXT DISPATCHED — and `TASK-FORMAT.md` repeats it
 * in the triage encoding. An absent field therefore reads as `fence`,
 * which is the sentence those documents already carry, spelled once.
 *
 * ── A FIELD NOBODY FINISHED IS NOT THE DEFAULT ──────────────────────
 * `wake:` written and left blank comes back UNREADABLE rather than as the
 * default, and so does a list. The distinction matters because the
 * default is what the ABSENCE of the field means: an author who typed the
 * key was reaching for something else, and silently answering `fence`
 * would hide the half-written card behind the correct-looking answer.
 *
 * @param {Record<string, string | string[]>} fields
 * @returns {WakeCondition}
 */
export function readWake(fields) {
  if (!Object.prototype.hasOwnProperty.call(fields, "wake")) {
    return { form: WAKE_FENCE, raw: "", declared: false, why: "" };
  }
  const held = fields["wake"];
  if (Array.isArray(held)) {
    return {
      form: "unreadable",
      raw: held.join(", "),
      declared: true,
      why: "a wake condition is ONE event and this field carries a list",
    };
  }
  const raw = unquote(String(held ?? "").trim());
  if (raw === "") {
    return {
      form: "unreadable",
      raw: "",
      declared: true,
      why:
        "the field is written and left blank — an empty condition is not the default, it is a " +
        "field nobody finished",
    };
  }
  if (raw.toLowerCase() === WAKE_FENCE) {
    return { form: WAKE_FENCE, raw: WAKE_FENCE, declared: true, why: "" };
  }
  if (WAKE_CARD_SHAPE.test(raw)) {
    return { form: "card", raw: normaliseTaskId(raw), declared: true, why: "" };
  }
  if (WAKE_DATE_SHAPE.test(raw)) {
    if (!isCalendarDate(raw)) {
      return {
        form: "unreadable",
        raw,
        declared: true,
        why: "it is date-shaped and names no day on the calendar, so the clock can never pass it",
      };
    }
    return { form: "date", raw, declared: true, why: "" };
  }
  return {
    form: "unreadable",
    raw,
    declared: true,
    why: `it is none of the three forms — a card id, an ISO date, or the word ${WAKE_FENCE}`,
  };
}

/**
 * @typedef {object} ParkedCard
 * @property {string} id
 * @property {string} file
 * @property {string[]} entries     the card's own fence tokens, unexpanded
 * @property {WakeCondition} cond
 * @property {boolean} prose        does the BODY state a condition in prose
 */

/**
 * The board this view rules on: one entry per live PARKED card, with its
 * fence tokens, its interpreted condition and whether its prose says
 * anything at all.
 *
 * @param {{ cards: Map<string, Card>, readText: (file: string) => string }} io
 * @returns {ParkedCard[]}
 */
export function parkedBoard({ cards, readText }) {
  /** @type {ParkedCard[]} */
  const out = [];
  for (const card of cards.values()) {
    if (fieldScalar(card.fields, "status") !== PARKED_STATUS) continue;
    out.push({
      id: card.id,
      file: card.file,
      entries: fieldList(card.fields, "touches"),
      cond: readWake(card.fields),
      prose: PROSE_WAKE_PATTERN.test(cardBody(readText(card.file))),
    });
  }
  return out.sort((a, b) => byCardId(a.id, b.id));
}

/**
 * @typedef {object} WakeWorld
 * @property {Map<string, Card>} cards
 * @property {{ taskId: string, entries?: string[] }[]} lanes
 * @property {Map<string, string[]>} slugs
 * @property {Component[]} comps
 * @property {string} today   the ISO DAY the clock reads, in UTC
 */

/**
 * @typedef {ParkedCard & { state: "held" | "waiting" | "unknown", why: string,
 *   record: string }} WakeRuling  `why` is the REASON CODE — the shape of the answer
 *   rather than its prose — so the view can count one class without matching on a
 *   sentence, and a reworded record cannot silently empty a section.
 */

/**
 * One card's condition, RULED, with the record that decided it.
 *
 * ── THERE ARE THREE ANSWERS AND NOT TWO, AND THE THIRD IS THE POINT ──
 * `unknown` is *"no wake PROVED and none ruled out"* — the vocabulary is
 * `fenceLedger`'s and the parser's `unusable`, borrowed rather than
 * invented. A lane whose card this checkout cannot read holds an UNKNOWN
 * fence, never an empty one (T-143 criteria 1 and 2), so a fence
 * condition measured against a board with a hole in it comes back
 * unknown and NAMES the hole. The alternative — folding it into
 * `waiting` — is how a card stays parked because a file could not be
 * opened, which is the shelf this whole section exists to stop.
 *
 * ── THE DATE IS COMPARED AS A DAY, LEXICALLY, IN UTC ────────────────
 * A `wake:` date names a DAY, so the condition holds from the start of
 * that day and the comparison is `today >= raw` over two `YYYY-MM-DD`
 * strings — which is exactly the numeric ordering for that shape and
 * needs no timezone arithmetic to be right. The clock is a LIVE fact and
 * is stamped as one; `world.today` is injected rather than read here so a
 * body can drive both sides of it.
 *
 * @param {ParkedCard} card
 * @param {WakeWorld} world
 * @returns {WakeRuling}
 */
export function ruleWake(card, world) {
  const { cond } = card;
  if (cond.form === "unreadable") {
    return { ...card, state: "unknown", why: "unreadable", record: `the wake: value cannot be placed — ${cond.why}` };
  }
  if (cond.form === "card") {
    const named = world.cards.get(cond.raw);
    if (named === undefined) {
      return {
        ...card,
        state: "unknown",
        why: "no-such-card",
        record:
          `no live card declares ${cond.raw}, so this checkout cannot tell whether it is ` +
          `${WOKEN_BY_STATUS} — a condition naming a card nobody can find is not a condition ` +
          "that failed",
      };
    }
    const status = fieldScalar(named.fields, "status");
    return status === WOKEN_BY_STATUS
      ? { ...card, state: "held", why: "card", record: `${cond.raw} is ${WOKEN_BY_STATUS}, per ${named.file}` }
      : { ...card, state: "waiting", why: "card", record: `${cond.raw} is ${status}` };
  }
  if (cond.form === "date") {
    return {
      ...card,
      state: world.today >= cond.raw ? "held" : "waiting",
      why: "clock",
      record: `the clock reads ${world.today}`,
    };
  }
  if (card.entries.length === 0) {
    return {
      ...card,
      state: "unknown",
      why: NO_GROUND,
      record: "the card declares no fence, so the default condition names no ground",
    };
  }
  const me = { id: card.id, entries: card.entries };
  /** @type {string[]} */
  const blind = [];
  for (const lane of world.lanes) {
    if (lane.taskId === card.id) continue;
    const laneCard = world.cards.get(lane.taskId);
    if (laneCard === undefined) {
      if (!blind.includes(lane.taskId)) blind.push(lane.taskId);
      continue;
    }
    const found = fenceOverlaps(
      me,
      { id: lane.taskId, entries: fieldList(laneCard.fields, "touches") },
      world.slugs,
      world.comps,
    );
    const first = found[0];
    if (first === undefined) continue;
    // THE TOKENS ARE TAKEN OUT OF THE OVERLAP'S OWN ANSWER, never
    // re-derived: `fenceOverlaps` spells each side as `<id> <entry>` and
    // this drops the id, which the row already carries. A second walk of
    // the two fences to name the shared tokens would be the fourth
    // spelling of the expansion rule `dispatch-order.mjs`'s header
    // records the cost of.
    return {
      ...card,
      state: "held",
      why: "fence",
      record:
        `lane ${lane.taskId} was dispatched on overlapping ground — ` +
        `${first.left.slice(card.id.length + 1)} against ${first.right.slice(lane.taskId.length + 1)}`,
    };
  }
  if (blind.length > 0) {
    const many = blind.length > 1;
    return {
      ...card,
      state: "unknown",
      why: "blind-lane",
      record:
        `no live lane this checkout can read overlaps, and it has no card for ${blind.join(", ")}, ` +
        `so ${many ? "those fences" : "that fence"} could not be expanded and no overlap can be ruled out`,
    };
  }
  const live = world.lanes.map((l) => l.taskId);
  return {
    ...card,
    state: "waiting",
    why: "fence",
    record: live.length === 0 ? "no lane is live" : `no live lane overlaps: ${live.join(", ")}`,
  };
}

/**
 * THE SECTION, AS RECORDS. Same shape as the triage clusters beside it:
 * it needs `{root, ref, at, host, full}` and nothing else, so both of
 * this project's context shapes can hand it one, and every collaborator
 * is injectable so a body can drive a fixture board.
 *
 * `full` is the same dial the rest of the dispatch answer spends. WITHOUT
 * IT THIS IS ONE COUNTED LINE, and that line is deliberately in the
 * DEFAULT view rather than behind the flag: the default answers *"what
 * can I start?"*, a woken parked card is a candidate for exactly that,
 * and the failure this card was filed against is cards being FORGOTTEN.
 * One line is what it costs to stop forgetting them; the page behind
 * `--full` is the triage seat's read.
 *
 * ── WHICH STAMP EACH ROW CARRIES IS A FUNCTION OF ITS FORM ──────────
 * Rule 3 of this module's contract: a tree fact carries a ref, a live
 * fact carries a time and a host. A `card` condition is a read of the
 * board and is a TREE fact. A `date` condition is a read of the CLOCK and
 * a `fence` condition is a read of the LANE LIST, and neither is a
 * function of the tree — so both are stamped live. The picker below is
 * the whole of that rule and there is no second copy of it.
 *
 * @param {{ root?: string, ref: string, at?: string, host?: string, full?: boolean,
 *   cards?: Map<string, Card>, comps?: Component[], slugs?: Map<string, string[]>,
 *   lanes?: { taskId: string }[] }} ctx
 * @param {{ cards?: Map<string, Card>, comps?: Component[], slugs?: Map<string, string[]>,
 *   lanes?: { taskId: string }[], readText?: (file: string) => string,
 *   board?: ParkedCard[] }} [deps]
 * @returns {Rec[]}
 */
export function wakeRecs(ctx, deps = {}) {
  const root = ctx.root ?? repoRoot;
  const cards = deps.cards ?? ctx.cards ?? cardIndex(root);
  const comps = deps.comps ?? ctx.comps ?? components(root);
  const slugs = deps.slugs ?? ctx.slugs ?? slugMapFromFields(comps);
  /** @param {string} file @returns {string} */
  const readText = deps.readText ?? ((file) => readDoc(file, root));
  const lanes =
    deps.lanes ??
    ctx.lanes ??
    laneWorktrees(worktreePorcelain(root), laneSpellings(conventionsText(root)));
  const board = deps.board ?? parkedBoard({ cards, readText });
  const at = ctx.at ?? new Date().toISOString();
  const host = ctx.host ?? hostName();
  const today = at.slice(0, 10);
  const rulings = board.map((c) => ruleWake(c, { cards, lanes, slugs, comps, today }));

  const boardVia =
    "the flat docs/tasks/T-*.md field status, with each card's own wake: field and its body";
  const clockVia = "the clock, against the card's own wake: field";
  const laneVia =
    "git worktree list --porcelain filtered on the branch, with each lane's card touches expanded " +
    "through the component registry's own touch_slugs";
  const mixedVia =
    "the flat docs/tasks/T-*.md parked column, each card's wake: condition, the clock and the " +
    "live lane list";
  /** @param {string} via @returns {Prov} */
  const tree = (via) => treeProv(ctx.ref, via);
  /** @param {string} via @returns {Prov} */
  const live = (via) => liveProv(at, host, via);
  /** @param {WakeRuling} r @returns {Prov} */
  const provOf = (r) =>
    r.cond.form === "date" ? live(clockVia) : r.cond.form === WAKE_FENCE ? live(laneVia) : tree(boardVia);
  /** @param {WakeRuling} r @returns {string} */
  const conditionOf = (r) =>
    r.cond.declared ? `wake: ${r.cond.raw}` : `wake: ${WAKE_FENCE} (the default, no field)`;

  const held = rulings.filter((r) => r.state === "held");
  const waiting = rulings.filter((r) => r.state === "waiting");
  // THE ONE CLASS THAT IS COUNTED RATHER THAN SPELLED, and it is counted
  // because its sentence is IDENTICAL on every member: the default
  // condition is the card's FENCE, and a card with no `touches:` gives it
  // no ground to be about. Measured on this board at 488e495: ninety-six
  // of a hundred and twenty-nine parked cards, each of which would print
  // the same two-hundred-byte sentence — the per-card byte cost T-225
  // proved is this answer's real capacity. The ids are still NAMED, on
  // one line, because the remedy is per card.
  const noGround = rulings.filter((r) => r.why === NO_GROUND);
  const unknown = rulings.filter((r) => r.state === "unknown" && r.why !== NO_GROUND);
  const bare = rulings.filter((r) => !r.cond.declared && !r.prose);

  /** @type {Rec[]} */
  const recs = [
    note("THE WOKEN PARKED CARDS — a park is a CONDITION, not a shelf, and this reads the"),
    note("condition rather than waiting for a human to re-read the folder."),
    note("THIS VIEW CHANGES NO CARD: waking is the seat's act — promote it, or re-park it"),
    note("with a NEW condition."),
    value(
      `${held.length} of ${rulings.length} parked card(s) have woken` +
        (ctx.full === true
          ? ""
          : " — add --full for the conditions, the records that satisfied them, and the parked " +
            "cards carrying no condition at all"),
      live(mixedVia),
    ),
  ];
  if (ctx.full !== true) return recs;

  recs.push(
    blank(),
    note("WOKEN — the condition holds. Each row names the condition and the record that satisfied"),
    note("it. A row is an ASK for a triage move, never a move."),
  );
  if (held.length === 0) {
    recs.push(value("no parked card's condition holds", live(mixedVia)));
  }
  for (const r of held) {
    recs.push(value(`${r.id} — ${conditionOf(r)} — HELD: ${r.record}`, provOf(r)));
  }

  recs.push(
    blank(),
    note("STILL PARKED — the condition was read and does not hold. Counted, not listed: these are"),
    note("the cards the park is working for."),
    value(`${waiting.length} parked card(s) carry a condition that does not hold`, live(mixedVia)),
    blank(),
    note("THE DEFAULT CONDITION NAMES NO GROUND — the default is the card's own fence, and these"),
    note("cards declare none, so no lane can ever satisfy it. The remedy is a wake: field at the"),
    note("next triage that touches the card, and this view rewrites none of them."),
    value(
      `${noGround.length} parked card(s) declare no fence` +
        (noGround.length === 0 ? "" : `: ${noGround.map((r) => r.id).join(", ")}`),
      tree(boardVia),
    ),
    blank(),
    note("COULD NOT BE RULED — a wake: value this view cannot place, a card it names that nothing"),
    note("on the board declares, or a lane whose own card this checkout cannot read. NOT a"),
    note("condition that failed: no wake proved and none ruled out."),
  );
  if (unknown.length === 0) {
    recs.push(value("every other parked card's condition could be ruled", live(mixedVia)));
  }
  for (const r of unknown) {
    recs.push(value(`${r.id} — ${conditionOf(r)} — ${r.record}`, provOf(r)));
  }

  recs.push(
    blank(),
    note("PARKED WITHOUT A CONDITION — neither a wake: field nor a prose line naming the event that"),
    note("brings the card back. TASK-FORMAT says a parking note with no resurfacing condition is a"),
    note("rejection nobody wrote down; this is that sentence, counted and named. A FLAG FOR THE"),
    note("HUMAN AND NEVER A CLOSURE — the fix is a wake: field at the next triage that touches the"),
    note("card, and no existing card is rewritten for this view."),
    value(
      `${bare.length} parked card(s) state no condition at all` +
        (bare.length === 0 ? "" : `: ${bare.map((r) => r.id).join(", ")}`),
      tree(boardVia),
    ),
  );
  return recs;
}


/**
 * ARM TWO. The same command answers both arms because the lane list is
 * the row both consumers get wrong.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO is decide which of STATE's sections
 * should go. It emits the facts a command can answer and PRINTS the
 * file's own headings beside them, because the narrative, the named
 * intermittents and the owed @human looks are not derivable and a
 * checkpoint that replaced judgement with a table would be worse than one
 * that repeats a count.
 *
 * @param {Ctx} ctx
 * @returns {Rec[]}
 */
export function stateReport(ctx) {
  const via = "git worktree list --porcelain, filtered on the branch";
  /** @type {Rec[]} */
  const recs = [
    note("STATE's DERIVABLE SECTIONS — run this instead of typing them"),
    value(`repository: ${ctx.root}`, tree(ctx, "the checkout this command ran in")),
    value(`HEAD in full: ${ctx.ref}`, tree(ctx, "git rev-parse HEAD")),
    blank(),
    note("THE LANE LIST — entries on a task branch. A detached worktree is not a lane."),
  ];
  if (ctx.lanes.length === 0) recs.push(value("no lane is live", live(ctx, via)));
  for (const lane of ctx.lanes) {
    const card = ctx.cards.get(lane.taskId);
    const fence = card === undefined ? "no live card" : fieldList(card.fields, "touches").join(", ");
    const status = card === undefined ? "unknown" : fieldScalar(card.fields, "status");
    recs.push(
      value(`${lane.taskId} branch ${lane.branch} worktree ${lane.path}`, live(ctx, via)),
      value(`${lane.taskId} tip ${lane.head}`, live(ctx, via)),
      value(
        `${lane.taskId} touches: ${fence} — board says ${status}`,
        tree(ctx, card === undefined ? "no card" : card.file),
      ),
    );
  }
  for (const entry of parseWorktreePorcelain(ctx.porcelain)) {
    if (entry.branch !== "" && ctx.lanes.some((l) => l.branch === entry.branch)) continue;
    recs.push(
      value(
        `not a lane: ${entry.path} — ${entry.branch === "" ? "detached" : `on ${entry.branch}`}`,
        live(ctx, via),
      ),
    );
  }
  // WHAT THIS LEDGER IS ANSWERING, SAID BEFORE IT ANSWERS (T-143
  // criterion 3). It is keyed by slug NAME; a fence is a REGION; and the
  // architect took a FREE row here for a dispatch verdict on 2026-08-26
  // and nearly put T-112 on ground the live T-141 was holding. The
  // `--task` half of this same command answers the actual question, with
  // the witness paths named — so this display POINTS AT IT rather than
  // approximating it, which is the lesson the card records: a cheap
  // display that approximates an expensive verdict gets consulted
  // INSTEAD of it.
  recs.push(
    blank(),
    note("THE FENCE LEDGER — held or free, derived from the lanes above"),
    note("IT IS KEYED BY SLUG NAME AND IS NOT A DISPATCH VERDICT. Two slugs can expand through one"),
    note("component, so one can read FREE while the other is HELD over the same files — and a lane"),
    note("declaring a bare PATH can contain a slug's region without naming it, so a row can read"),
    note("FREE while a lane holds its files by containment (the ledger card's own verdict). Never read a"),
    note("FREE row here as an answer to \"may I dispatch this card\" — this is what answers it:"),
    value(
      "`brief.mjs --task T-NNN`, the fence row, which compares EXPANDED fences and names the witness paths",
      tree(ctx, `method/roles/${ctx.role}.md contract row 5, and this command's own ROW 5`),
    ),
  );
  const shared = slugsSharingComponents(ctx.slugs);
  if (shared.length === 0) {
    recs.push(
      value(
        "no component is claimed by two slugs today",
        tree(ctx, "docs/architecture/components/C-*.md field touch_slugs"),
      ),
    );
  }
  for (const s of shared) {
    recs.push(
      value(
        `${s.slugs.join(" and ")} both expand through ${s.component} — these rows are not independent`,
        tree(ctx, "docs/architecture/components/C-*.md field touch_slugs"),
      ),
    );
  }
  for (const row of fenceLedger(ctx)) {
    recs.push(value(`${row.slug}: ${row.heldBy}`, live(ctx, `${via}, joined to each lane's card`)));
  }
  const board = boardCensus(ctx.root);
  recs.push(blank(), note("THE BOARD — derived from disk"));
  for (const [status, count] of board.byStatus) {
    recs.push(value(`${status}: ${count}`, tree(ctx, "flat docs/tasks/T-*.md frontmatter field status")));
  }
  recs.push(
    value(`flat task files: ${board.total}`, tree(ctx, "git ls-files, flat docs/tasks/T-*.md")),
    value(`in rejected/: ${board.rejected}`, tree(ctx, "git ls-files docs/tasks/rejected/")),
  );
  recs.push(blank(), note("THE SLUG MAP — from each component file's own touch_slugs FIELD"));
  for (const [slug, ids] of ctx.slugs) {
    recs.push(value(`${slug} -> ${ids.join(", ")}`, tree(ctx, "docs/architecture/components/C-*.md")));
  }
  recs.push(
    blank(),
    note("WHAT THIS COMMAND CANNOT ANSWER, and STATE therefore keeps: the narrative, the traps,"),
    note("the named intermittents, the rulings, and every look owed to the human. A checkpoint"),
    note("that replaced judgement with a table would be worse than one that repeats a count."),
    blank(),
    note("STATE's own headings at this ref, so a reader can see what is NOT above:"),
  );
  for (const line of stateText(ctx.root).split(/\r?\n/)) {
    if (!/^#{2,3} /.test(line)) continue;
    recs.push(value(line.trim(), tree(ctx, "docs/STATE.md headings")));
  }
  return recs;
}

/* ══════════════════════════════════════════════════════════════════════
 * THE DISPATCH RITUAL, PERFORMED (T-239) — eleven steps, in the order the
 * documents fix, refusing at the first that fails.
 *
 * ── WHAT WAS WRONG ───────────────────────────────────────────────────
 * Every step of the dispatch already had a command. NOTHING JOINED THEM
 * BUT THE SEAT'S MEMORY, and the seat is where the failures were: the
 * order was inverted once (T-226 stamped after the cut and met a
 * three-way conflict at the merge), four worktrees were cut before any
 * was armed (T-209's refusal, and two lanes cut before either is armed
 * cannot both be armed), and a stamp anchored on a key the card did not
 * carry was a silent no-op nobody read back.
 *
 * ── THE ORDER IS THE LAW, AND IT IS READ FROM THREE DOCUMENTS ────────
 * `method/roles/orchestrator.md` 5b — stamp on the integration branch
 * and COMMIT, *then* cut the lane from that commit, *then* hand over the
 * brief. `docs/CONVENTIONS.md`'s serial-ritual bullet — cut ONE worktree,
 * arm it, READ THE MANIFEST BACK, then cut the next, and stamp
 * `building` BEFORE you cut. `method/roles/orchestrator.md` 5c — cut the
 * verifier's bench when you cut the lane. The eleven steps below are that
 * order, and `DISPATCH_STEPS` is the only place it is written down.
 *
 * ── WHAT THIS SECTION MAY AND MAY NOT DO ─────────────────────────────
 * THE DERIVATIONS ARE PURE AND THE ONE ACTING FUNCTION TAKES ITS WORLD
 * AS AN ARGUMENT. `dispatchLanePlan` reads and computes; it spawns
 * nothing and writes nothing, so a `--dry-run` is the plan printed and
 * no more. `runDispatchLane` is the single function that acts, and every
 * process it starts and every byte it writes goes through the `DispatchIo`
 * it is handed — which is what lets a body drive a real failure at any
 * one of the eleven steps without cutting eleven worktrees. This is the
 * module header's rule 6 kept rather than broken: the derivers still
 * write nothing, and the acting function is never called at import.
 *
 * ── THE REFUSAL CONTRACT ─────────────────────────────────────────────
 * Every refusal names THE STEP, THE COMMAND IT RAN and ITS EXIT, in the
 * four house codes this file already publishes. A later step is never
 * attempted. What was already done is not undone where undoing it would
 * be a lie — the stamp is a fact about the card (T-226) and stays — but
 * every worktree THIS RUN cut is removed, and the removal is announced.
 * A worktree this run did not cut is never touched.
 * ════════════════════════════════════════════════════════════════════ */

/** The bullet that publishes the per-lane port. A locator, not its text. */
export const E2E_PORT_PHRASE = "E2E PORT — DERIVE IT PER LANE";

/** The bullet that publishes the scratch file name. Also a locator. */
export const SCRATCH_RULE_PHRASE = "SCRATCH RULE — NAME EVERY SCRATCH FILE";

/**
 * The label the lane bullet publishes the VERIFIER'S BENCH under. It had
 * none until T-239: the lane bullet published the lane's branch, its
 * worktree and the command that creates it, the bench bullet published
 * the attack set's file name and the digest a verdict cites, and the
 * bench WORKTREE — live on this machine under one spelling for weeks —
 * was stated nowhere. A path this ritual typed would have been the fifth
 * unpublished name in a file whose whole point is that the names live in
 * the document.
 */
export const BENCH_LABEL = "bench worktree";

/** This command's own runnable half, beside this file. The ritual re-enters
 *  IT and never the copy sitting in whatever `--root` names: a dispatch that
 *  ran a different implementation from the one it was asked of is exactly the
 *  stale-checkout split `checkout-currency.mjs` exists to catch. */
export const BRIEF_CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), "brief.mjs");

/**
 * @typedef {object} DispatchSpellings
 * @property {string} portVariable  the environment variable the bullet names
 * @property {number} portBase      the base it publishes
 * @property {string} portPattern   the whole published spelling, verbatim
 * @property {string} scratchPattern the SCRATCH RULE's published file name
 * @property {string} benchPattern   the lane bullet's bench worktree spelling
 */

/**
 * The two spellings the ritual's LAST step derives from the card number,
 * READ off docs/CONVENTIONS.md rather than typed here — the fourth
 * acceptance criterion in as many words, and the same idiom
 * `laneSpellings` already uses for the branch and the worktree.
 *
 * @param {string} conventionsMd
 * @returns {DispatchSpellings}
 */
export function dispatchSpellings(conventionsMd) {
  /**
   * @param {string} phrase
   * @param {string} placeholder
   * @returns {string}
   */
  const backtickedAround = (phrase, placeholder) => {
    const bullet = rawBullet(conventionsMd, phrase).replace(/\s+/g, " ");
    const found = [...bullet.matchAll(/`([^`]+)`/g)]
      .map((m) => /** @type {string} */ (m[1]))
      .filter((s) => s.includes(placeholder));
    if (found.length !== 1) {
      throw new Error(
        `dispatch-brief: the bullet containing ${JSON.stringify(phrase)} spells ${found.length} ` +
          `backticked runs carrying ${JSON.stringify(placeholder)}, expected exactly one. This ` +
          "module derives that spelling rather than carrying a copy of it, so a reworded bullet " +
          "is a hard failure and never a default.",
      );
    }
    return /** @type {string} */ (found[0]);
  };

  const portPattern = backtickedAround(E2E_PORT_PHRASE, "<card number>");
  const port = /^([A-Za-z_][A-Za-z0-9_]*)=(\d+)\+<card number>$/.exec(portPattern);
  if (port === null) {
    throw new Error(
      `dispatch-brief: the per-lane port spelling ${JSON.stringify(portPattern)} is not ` +
        "`<VARIABLE>=<base>+<card number>`, so this module cannot derive a port from it. A lane " +
        "port guessed at is the machine-scoped surface that bullet exists to remove.",
    );
  }
  const scratchPattern = backtickedAround(SCRATCH_RULE_PHRASE, "<card id>");

  // THE BENCH, READ OFF THE LANE BULLET BY ITS LABEL — the same idiom
  // `laneSpellings` uses for the lane's own three names, and anchored on
  // the label rather than on a backtick count so a bullet that gains a
  // sentence does not move it.
  const laneBullet = rawBullet(conventionsMd, "THE LANE PROTOCOL").replace(/\s+/g, " ");
  const bench = [...laneBullet.matchAll(new RegExp(`${BENCH_LABEL} \`([^\`]+)\``, "g"))].map(
    (m) => /** @type {string} */ (m[1]),
  );
  if (bench.length !== 1 || !(/** @type {string} */ (bench[0]).includes("T-NNN"))) {
    throw new Error(
      `dispatch-brief: the lane bullet spells ${JSON.stringify(BENCH_LABEL)} followed by a ` +
        `backticked pattern carrying \`T-NNN\` ${bench.length} time(s), expected exactly one. The ` +
        "verifier's bench is cut beside the lane (method/roles/orchestrator.md 5c) and this module " +
        "derives its path rather than typing one, so a missing spelling is a hard failure.",
    );
  }
  return {
    portVariable: /** @type {string} */ (port[1]),
    portBase: Number(port[2]),
    portPattern,
    scratchPattern,
    benchPattern: /** @type {string} */ (bench[0]),
  };
}

/**
 * The CARD NUMBER — what the port spelling substitutes. A suffixed card
 * shares its parent's number by that spelling and gets its own scratch
 * STEM, which is the asymmetry the two bullets publish rather than one
 * this module invented: the port bullet says `<card number>` and the
 * scratch bullet says `<card id>`.
 *
 * @param {string} taskId a normalised id
 * @returns {number}
 */
export function laneCardNumber(taskId) {
  const m = /^T-(\d+)(?:-s\d+)?$/.exec(taskId);
  if (m === null) {
    throw new Error(
      `dispatch-brief: ${JSON.stringify(taskId)} carries no card number, so the per-lane port ` +
        "cannot be derived from it.",
    );
  }
  return Number(m[1]);
}

/** @param {string} taskId @param {DispatchSpellings} sp @returns {number} */
export function lanePort(taskId, sp) {
  return sp.portBase + laneCardNumber(taskId);
}

/**
 * One scratch file's name, by the published pattern. The pattern is split
 * on its own `<card id>` placeholder and the remaining `<…>` tokens are
 * filled BY POSITION, so no placeholder's spelling is transcribed here.
 *
 * @param {string} purpose
 * @param {string} ext
 * @param {string} taskId
 * @param {DispatchSpellings} sp
 * @returns {string}
 */
export function laneScratchName(purpose, ext, taskId, sp) {
  const parts = sp.scratchPattern.split("<card id>");
  if (parts.length !== 2) {
    throw new Error(
      `dispatch-brief: the scratch spelling ${JSON.stringify(sp.scratchPattern)} does not carry ` +
        "exactly one `<card id>` placeholder, so a name derived from it would be a guess.",
    );
  }
  const head = /** @type {string} */ (parts[0]).replace(/<[^>]+>/, purpose);
  const tail = /** @type {string} */ (parts[1]).replace(/<[^>]+>/, ext);
  return `${head}${taskId}${tail}`;
}

/**
 * The scratch STEM a lane owns: the published pattern with the card id
 * filled in and the other placeholders left standing, which is the thing
 * a seat has to be told once and then obeys for every file it writes.
 *
 * @param {string} taskId
 * @param {DispatchSpellings} sp
 * @returns {string}
 */
export function laneScratchStem(taskId, sp) {
  return sp.scratchPattern.split("<card id>").join(taskId);
}

/* ────────────────────────────────────────────────────────────────────
 * THE TIER — a function of the card and the tree, never of judgment
 * (T-296, ADR-024 decision 1).
 * ──────────────────────────────────────────────────────────────────── */

/** The three tiers, in the order the method's own table gives them. */
export const TIERS = Object.freeze(["bounded", "standard", "guarded"]);

/** The bullet that publishes this project's ONE spelling of a graded reading. */
export const BLESSED_RUNNER_PHRASE = "THE BLESSED GATE-RUNNER (T-202):";

/**
 * THE KEEPER RUN, DERIVED FROM THE DOCUMENT AND NEVER TYPED.
 *
 * The blessed gate-runner bullet is the one place this project names its
 * runner, and a body requires exactly that — so the keeper step reads the
 * spelling out of the document rather than carrying a fifth copy of a
 * path this file already refuses to invent.
 *
 * @param {string} conventionsMd
 * @returns {{ script: string, suite: string, owningFlag: string, verdictToken: string }}
 */
export function blessedRunner(conventionsMd) {
  const flat = rawBullet(conventionsMd, BLESSED_RUNNER_PHRASE).replace(/\s+/g, " ");
  const runs = [...flat.matchAll(/`([^`]+)`/g)].map((m) => /** @type {string} */ (m[1]));
  const spelling = runs.find((r) => /^node \S+\.mjs\b/.test(r));
  const scoped = runs.find((r) => r.includes("--owning"));
  // THE VERDICT TOKEN IS READ TOO, and the keeper step reads the OUTPUT
  // rather than the exit code because of it: an exit tells a caller that
  // something went wrong, and only the verdict line tells it whether a
  // suite was GRADED at all. That distinction is the whole difference
  // between a red baseline and a derivation that could not place a path.
  const token = runs.find((r) => /^[a-z]+-verdict$/.test(r));
  if (spelling === undefined || scoped === undefined || token === undefined) {
    throw new Error(
      `dispatch-brief: the bullet containing ${JSON.stringify(BLESSED_RUNNER_PHRASE)} no longer ` +
        "spells a `node <script>` runner, a scoped `--owning` form and its verdict token, so this " +
        "module cannot derive the keeper run from it. A runner typed here would be the invented " +
        "path that bullet's neighbour forbids.",
    );
  }
  const script = /** @type {string} */ (/^node (\S+\.mjs)\b/.exec(spelling)?.[1]);
  const suite = /** @type {string} */ (/(\S+) --owning/.exec(scoped)?.[1]);
  return { script, suite, owningFlag: "--owning", verdictToken: token };
}

/**
 * WHAT THE KEEPER RUN ACTUALLY SAID, read off its OUTPUT.
 *
 * THREE ANSWERS AND NEVER TWO. *Graded and green*, *graded and red*, and
 * *nothing was graded* are three different facts, and a caller that read
 * only the exit code would fold the third into the second: the scoped
 * derivation REFUSES rather than grades when it cannot place a fenced
 * path — a fence naming method text is the ordinary case — and a dispatch
 * that reported that as a red baseline would refuse every guarded card
 * this project cuts. An exit 0 over nothing is not a pass either, which
 * is the same sentence this method's run-hygiene sections already make.
 *
 * @param {{ status: number, stdout: string, stderr: string, token: string }} r
 * @returns {{ graded: boolean, green: boolean, detail: string }}
 */
export function keeperVerdict(r) {
  const lines = `${r.stdout}\n${r.stderr}`
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.includes(r.token));
  if (lines.length === 0) {
    const said = `${r.stdout}\n${r.stderr}`.trim().split(/\r?\n/)[0] ?? "";
    return {
      graded: false,
      green: false,
      detail:
        `the runner published no ${r.token} line (exit ${String(r.status)}), so no suite was ` +
        `graded here${said === "" ? "" : ` — it said: ${said}`}`,
    };
  }
  // THE VERDICT WORD IS ON THE LINE THIS READER WENT LOOKING FOR, and a
  // reader that greps for that line and then decides from the process
  // exit has not read it. `gate-run.mjs`'s own header says REFUSED "is
  // never a green run and never a red one" — it means nothing was graded,
  // which is the third answer this function exists to keep apart from the
  // second, and reading it as red refuses a dispatch over a baseline
  // nobody measured.
  if (lines.some((l) => /\bverdict=REFUSED\b/.test(l))) {
    return {
      graded: false,
      green: false,
      detail: `exit ${String(r.status)} — ${lines.join(" / ")}`,
    };
  }
  return {
    graded: true,
    green: r.status === 0,
    detail: `exit ${String(r.status)} — ${lines.join(" / ")}`,
  };
}

/**
 * The heading in `method/tasks/TASK-FORMAT.md` under which the guard-class
 * CLASSES are declared. The method is product-agnostic and names no path,
 * so this side of the derivation reads NAMES and the other side reads the
 * project's own mapping of them.
 */
export const GUARD_CLASS_HEADING = "### The guard-class list";

/** The bullet in the project's conventions that maps those classes. */
export const GUARD_CLASS_PHRASE = "GUARD-CLASS PATHS, IN THIS PROJECT'S OWN SPELLING";

/** The sentinel after which that bullet is a MAP and not prose. */
export const GUARD_CLASS_MAP_SENTINEL = "THE MAP:";

/**
 * The guard-class NAMES the method declares, in its own order.
 *
 * READ, NOT LISTED. A class enumeration typed into this file would be the
 * hand-kept list the method's own last paragraph argues against, and it
 * would go stale in the direction nobody notices — the class somebody
 * added to the document and not to the program.
 *
 * @param {string} taskFormatMd
 * @returns {string[]}
 */
export function guardClassIds(taskFormatMd) {
  const text = section(taskFormatMd, GUARD_CLASS_HEADING);
  /** @type {string[]} */
  const ids = [];
  for (const line of text.split(/\r?\n/)) {
    const m = /^- `([a-z][a-z0-9-]*)` — /.exec(line.trim());
    if (m === null) continue;
    const id = /** @type {string} */ (m[1]);
    if (!ids.includes(id)) ids.push(id);
  }
  if (ids.length === 0) {
    throw new Error(
      `dispatch-brief: method/tasks/TASK-FORMAT.md's ${JSON.stringify(GUARD_CLASS_HEADING)} ` +
        "section declares no class in the published form (a bullet opening with a backticked " +
        "name). An empty class list would classify every card as ungarded, which is the one " +
        "answer this derivation must never reach by accident.",
    );
  }
  return ids;
}

/**
 * The project's mapping of those classes onto ITS OWN paths.
 *
 * BOTH DIRECTIONS ARE HARD FAILURES. A class the method declares and the
 * project has not mapped would silently stop guarding whatever it named;
 * a name mapped here that the method never declared is a class somebody
 * invented at the project's end, where no other project can inherit it.
 *
 * @param {string} conventionsMd
 * @param {string[]} ids the method's own class names
 * @returns {Map<string, string[]>} class -> the project's path tokens
 */
export function guardClassMap(conventionsMd, ids) {
  const flat = rawBullet(conventionsMd, GUARD_CLASS_PHRASE).replace(/\s+/g, " ");
  const at = flat.indexOf(GUARD_CLASS_MAP_SENTINEL);
  if (at < 0) {
    throw new Error(
      `dispatch-brief: the bullet containing ${JSON.stringify(GUARD_CLASS_PHRASE)} carries no ` +
        `${JSON.stringify(GUARD_CLASS_MAP_SENTINEL)} sentinel, so this reader cannot tell the ` +
        "map from the prose around it and will not guess which backticked runs are paths.",
    );
  }
  /** @type {Map<string, string[]>} */
  const map = new Map();
  const body = flat.slice(at + GUARD_CLASS_MAP_SENTINEL.length);
  for (const m of body.matchAll(/`([a-z][a-z0-9-]*)`:\s*((?:`[^`]+`(?:,\s*)?)+)/g)) {
    const id = /** @type {string} */ (m[1]);
    const tokens = [...(/** @type {string} */ (m[2])).matchAll(/`([^`]+)`/g)].map(
      (t) => /** @type {string} */ (t[1]),
    );
    map.set(id, tokens);
  }
  const unmapped = ids.filter((id) => !map.has(id));
  if (unmapped.length > 0) {
    throw new Error(
      `dispatch-brief: the method declares guard-class ${unmapped.join(", ")} and ` +
        "docs/CONVENTIONS.md's guard-class bullet maps none of them onto this project's paths. " +
        "A class with no mapping guards nothing, and a classifier that skipped it would answer " +
        "`standard` for exactly the files the class exists to protect.",
    );
  }
  const invented = [...map.keys()].filter((id) => !ids.includes(id));
  if (invented.length > 0) {
    throw new Error(
      `dispatch-brief: docs/CONVENTIONS.md maps guard-class ${invented.join(", ")}, which ` +
        "method/tasks/TASK-FORMAT.md does not declare. The classes are the METHOD's and the " +
        "paths are the project's; a class invented at the project's end is one no other project " +
        "inherits and one this program cannot explain.",
    );
  }
  return map;
}

/**
 * Does one path token cover one repository path?
 *
 * A token ending in `/` is a DIRECTORY and covers everything under it; a
 * token ending in `*` is a PREFIX and covers every path that starts with
 * it; any other token is a file, and covers itself and anything under it
 * — a file token that later becomes a directory keeps guarding what it
 * named.
 *
 * **THE PREFIX FORM IS NOT A CONVENIENCE, IT IS A CONSTRAINT THIS
 * PROJECT PUT ON ITS OWN DOCUMENT.** docs/CONVENTIONS.md names the
 * blessed gate-runner in EXACTLY ONE PLACE and a body requires exactly
 * that, so a guard-class map that spelled the runner's filename would red
 * the body that keeps one spelling one spelling. The map names the SHAPE
 * instead, which is also the honester statement: what makes a file
 * guard-class is being a gate runner, not being that particular file.
 *
 * @param {string} token
 * @param {string} rel
 * @returns {boolean}
 */
export function guardTokenCovers(token, rel) {
  // BOTH DIRECTIONS, BECAUSE A FENCE NAMES A REGION AND SO DOES A CLASS.
  // A fenced path may sit UNDER the class's token, and it may equally
  // CONTAIN it: `tools/e2e/scripts/` is a tracked directory holding the
  // gate runners and `lib/` holds the parser, so a card fencing either is
  // a card editing them. Asking only the first question answered
  // `standard` for a fence over five mapped guards. A leading `./` is the
  // same path written the way a relative path usually is written, and is
  // stripped before either question is asked.
  const r = rel.replace(/^\.\//, "").replace(/\/+$/, "");
  if (r === "") return false;
  if (token.endsWith("*")) {
    const prefix = token.slice(0, -1);
    return prefix !== "" && (r.startsWith(prefix) || prefix.startsWith(`${r}/`));
  }
  const t = token.replace(/\/+$/, "");
  if (t === "") return false;
  return r === t || r.startsWith(`${t}/`) || t.startsWith(`${r}/`);
}

/**
 * Every guard class each path hits — and a path may hit more than one,
 * because a class says what a file DOES and one file can do two of these
 * things. The answer is `guarded` on the first hit either way; the LIST is
 * what the arm prints, so a reader can see WHY.
 *
 * @param {string[]} paths
 * @param {Map<string, string[]>} map
 * @returns {{ path: string, classes: string[] }[]} only the paths that hit
 */
export function guardClassHits(paths, map) {
  /** @type {{ path: string, classes: string[] }[]} */
  const hits = [];
  for (const rel of paths) {
    /** @type {string[]} */
    const classes = [];
    for (const [id, tokens] of map) {
      if (tokens.some((t) => guardTokenCovers(t, rel))) classes.push(id);
    }
    if (classes.length > 0) hits.push({ path: rel, classes });
  }
  return hits;
}

/**
 * A CARD THIS ARM CANNOT CLASSIFY — never a guess, and the message names
 * which of the three unreadable things it was.
 */
export class TierFinding extends Error {}

/**
 * @typedef {object} TierInput
 * @property {string} size            the card's own `size:`, verbatim
 * @property {string[]} fencePaths    the fence, expanded
 * @property {string[]} unresolved    fence entries that expanded to nothing
 * @property {string[]} untracked     fenced paths this tree does not track
 * @property {Map<string, string[]>} guardMap
 * @property {{ pinned: boolean, answered: boolean, why: string }} keeper
 * @property {ProcessSettings} [process] this project's resolved process switches
 */

/**
 * @typedef {object} TierVerdict
 * @property {string} tier
 * @property {string} reason  one sentence, printed on the dispatch's output
 */

/**
 * THE CLASSIFIER. A function of the card and the tree, and of nothing a
 * seat believes.
 *
 * The order below is the rule and not an optimisation: a guard-class path
 * outranks every size, because guard-class is a property of what the file
 * DOES and a one-line change to a guard can retire the guard in silence.
 *
 * @param {TierInput} input
 * @returns {TierVerdict}
 */
export function classifyTier(input) {
  // THE TIER IS A SETTING BEFORE IT IS A DERIVATION (T-299, ADR-024
  // decision 6). `verify.tier` says whether this project sizes its
  // verification at all: at `guarded-for-every-card` the whole ladder
  // below is switched off and every card takes the blind two-phase
  // bench, which is the ceremony the room measured at 2.5 to 3.5 hours a
  // card. A project that has not settled its process yet passes no
  // settings and gets the derivation, which is what this arm did before
  // the switch existed.
  if (input.process !== undefined) {
    const how = switchValue(input.process, "verify.tier");
    if (how === "guarded-for-every-card") {
      return {
        tier: "guarded",
        reason:
          "verify.tier is guarded-for-every-card, so the classifier is not consulted and every " +
          "card takes the guarded tier whatever its size or its fence",
      };
    }
  }
  const size = input.size.trim().toUpperCase();
  if (size === "") {
    throw new TierFinding(
      "dispatch-brief: this card declares no `size:`, and size is one of the three inputs the " +
        "tier is a function of. A tier guessed for a card with no size is a verification bought " +
        "on nothing.",
    );
  }
  if (input.unresolved.length > 0) {
    throw new TierFinding(
      `dispatch-brief: this card's fence entries ${input.unresolved.join(", ")} expand to no path ` +
        "at all, so the arm cannot test them against the guard-class list. An unresolvable fence " +
        "is a fence nobody can place, and a tier derived over the paths that DID resolve would " +
        "be answering about a different card.",
    );
  }
  const hits = guardClassHits(input.fencePaths, input.guardMap);
  if (hits.length > 0) {
    const named = hits.map((h) => `${h.path} (${h.classes.join(", ")})`).join(", ");
    return {
      tier: "guarded",
      reason: `the fence names guard-class path(s): ${named} — guard-class outranks size`,
    };
  }
  if (size === "L") {
    return { tier: "guarded", reason: "size L, and every L card takes the guarded tier" };
  }
  if (size !== "XS") {
    return {
      tier: "standard",
      reason: `size ${size}, no guard-class path in a fence of ${String(input.fencePaths.length)} path(s)`,
    };
  }
  // ── SIZE XS: the only size that can reach `bounded`, and the only one
  //    whose classification depends on a question a suite has to answer.
  if (!input.keeper.answered) {
    throw new TierFinding(
      `dispatch-brief: this card is size XS with no guard-class path, so whether a keeper already ` +
        `pins what it changes is what decides bounded against standard — and that question was ` +
        `not answered: ${input.keeper.why}. A bounded card is the one tier with no verifier, so ` +
        "an unanswered keeper question is refused rather than resolved downward.",
    );
  }
  if (input.untracked.length > 0) {
    return {
      tier: "standard",
      reason:
        `size XS, but ${input.untracked.join(", ")} is not tracked in this tree, so the fence is ` +
        "not wholly inside a tracked one and the card is not bounded",
    };
  }
  if (!input.keeper.pinned) {
    return {
      tier: "standard",
      reason: `size XS inside a tracked fence, but no keeper pins it: ${input.keeper.why}`,
    };
  }
  return {
    tier: "bounded",
    reason:
      "size XS, every fenced path tracked, no guard-class path, and a keeper already pins it: " +
      input.keeper.why,
  };
}

/* ────────────────────────────────────────────────────────────────────
 * PHASE 1, RENDERED BY THE ARM — and the blindness is the property the
 * rendering must not spend (roles/orchestrator.md 5e).
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The line the seat pastes, and the sentence saying why the arm cannot
 * paste it itself. A dispatcher that reads *"the arm spawns phase 1"* and
 * waits for a session that will never appear has lost the whole saving to
 * one word.
 */
export const PHASE1_SPAWN_NOTE =
  "AN ARM CANNOT SPAWN A SEAT. Spawn phase 1 tool-less — no file, git or shell tools — with the " +
  "contents of this file as its WHOLE prompt, and save what it returns:";

/**
 * @typedef {object} Phase1Input
 * @property {string} taskId
 * @property {string} tier
 * @property {string} base       the ref the card was read at
 * @property {string} card       the card's repository-relative path
 * @property {string} cardText   the card AS IT STOOD AT THE BASE, verbatim
 * @property {string} verifierMd this method's verifier role file
 * @property {string} attackSetFile where the seat saves the return
 */

/**
 * RENDER PHASE 1 — from the card at the base and the tier, and from
 * NOTHING ELSE.
 *
 * **THE PARAMETER LIST IS THE GUARANTEE.** This function is handed no
 * root, no diff, no notes, no branch and no commit later than the base,
 * so there is nothing in scope for it to leak even by accident. Every
 * other blindness rule in this method is a seat declining to look; this
 * one is a function that cannot.
 *
 * @param {Phase1Input} input
 * @returns {string}
 */
export function renderPhase1(input) {
  return [
    "# VERIFIER, PHASE 1 — the attack set, written before the work exists",
    "",
    `You are the verifier's phase 1 for ${input.taskId}, tier ${input.tier}. You hold NO file,`,
    "git or shell tools, and that is the point: what you cannot see is the guarantee this pass",
    "buys. You return ONE artifact and nothing else.",
    "",
    "## What you return",
    "",
    "An ATTACK SET: for every acceptance criterion below, at least one attack naming a way to",
    "satisfy that criterion's LETTER while failing its PURPOSE. Under that floor this is a",
    "refusal and is handled as one. A generic or empty set is trivially uncontaminated and worth",
    "nothing.",
    "",
    "You may also return a LIST OF MEASUREMENTS you want taken — a card asserting anything about",
    "a platform, a tool or an exit code owes a ground truth, and a spawn with no shell cannot",
    "take one. The dispatcher takes them AT THE BASE REF, where no lane branch exists to shape",
    "the answer. Anything else you cannot reach is a REFUSAL naming what you need and why.",
    "",
    "## The card, at the base and verbatim",
    "",
    `Read at ${input.base}, from ${input.card}. This is the card as it stood when the lane was`,
    "cut: it carries no implementation notes, no diff and no figure measured after that commit,",
    "because none of those existed yet.",
    "",
    "```markdown",
    input.cardText.replace(/\r?\n$/, ""),
    "```",
    "",
    "## Your role file, at the same ref",
    "",
    "```markdown",
    input.verifierMd.replace(/\r?\n$/, ""),
    "```",
    "",
    "## What must not reach you, and has not",
    "",
    "The diff, the executor's notes, its report, the commit log, and every figure measured after",
    `${input.base}. This prompt was rendered from the card at that commit and from the role file`,
    "above; nothing else was in scope for the program that wrote it.",
    "",
    `The dispatcher saves your return to ${input.attackSetFile} and hashes it. Phase 2's verdict`,
    "cites that hash, and a verdict whose hash does not match the saved file is refused.",
    "",
  ].join("\n");
}

/* ────────────────────────────────────────────────────────────────────
 * PHASE 2 — the ground taken by a script, the inputs sealed, the brief
 * rendered (roles/orchestrator.md 5e).
 * ──────────────────────────────────────────────────────────────────── */

/** The line the seat pastes for phase 2, and why the arm cannot paste it. */
export const PHASE2_SPAWN_NOTE =
  "AN ARM CANNOT SPAWN A SEAT. Spawn phase 2 FRESH — a NEW spawn and never a continuation of " +
  "phase 1, which would keep everything it was later shown — with the contents of this file as " +
  "its WHOLE prompt:";

/** The heading the ground file's hand-written addendum goes under. */
export const GROUND_ADDENDUM_HEADING = "## The seat's addendum";

/** @param {string} text @returns {string} */
export function sha256(text) {
  return createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex");
}

/**
 * THE BODY NAMES A SPEC DECLARES, off its own source.
 *
 * A COUNT WITHOUT NAMES IS NOT A GROUND TRUTH. The verifier is judging
 * whether a body it is shown measures anything, and *"this file had 41
 * bodies"* cannot tell it which one arrived with the diff. The names are
 * what a later reading is compared against.
 *
 * @param {string} specText
 * @returns {string[]}
 */
export function specBodies(specText) {
  /** @type {string[]} */
  const names = [];
  for (const m of specText.matchAll(/\btest(?:\.\w+)?\(\s*(?:"((?:[^"\\]|\\.)*)"|`([^`]*)`)/g)) {
    const name = /** @type {string} */ (m[1] ?? m[2] ?? "");
    if (name !== "") names.push(name);
  }
  return names;
}

/**
 * The behaviour census's own section for one spec file, by the slug the
 * census keys on: `tools/e2e/tests/<slug>.spec.ts` is `## <slug>`.
 *
 * @param {string} capabilitiesMd
 * @param {string} specRel
 * @returns {{ heading: string, count: number, present: boolean }}
 */
export function censusSection(capabilitiesMd, specRel) {
  const slug = path.basename(specRel).replace(/\.spec\.tsx?$/, "");
  const heading = `## ${slug}`;
  const lines = capabilitiesMd.split(/\r?\n/);
  const at = lines.findIndex((l) => l.trim() === heading);
  if (at < 0) return { heading, count: 0, present: false };
  let count = 0;
  for (let i = at + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (line.startsWith("## ")) break;
    if (line.startsWith("- ")) count += 1;
  }
  return { heading, count, present: true };
}

/**
 * @typedef {object} GroundFile
 * @property {string} rel
 * @property {string} blob   git's own object id at the base
 * @property {number} bytes
 * @property {string[]} [bodies] for a spec file, its body names at the base
 * @property {{ heading: string, count: number, present: boolean }} [census]
 */

/**
 * THE GROUND, AS A DOCUMENT — taken at the BASE, where no lane branch
 * exists to shape the answer (roles/verifier.md step 0).
 *
 * It is a pure function of what the caller measured, so a body can drive
 * it with planted figures and the arm can drive it with real ones, and
 * neither has to reach the other's world to do it.
 *
 * @param {{ taskId: string, tier: string, base: string, card: string, files: GroundFile[], preflight: { exit: number, findings: string[] } }} input
 * @returns {string}
 */
export function groundDocument(input) {
  /** @type {string[]} */
  const out = [
    `# GROUND TRUTHS for ${input.taskId}, taken at the base`,
    "",
    `Tier ${input.tier}. Every figure below was measured at ${input.base} — the commit the lane`,
    "was cut from — and NOT at the lane's tip. A ground truth taken before the diff cannot be",
    "shaped by what the implementation happens to do; the same measurement taken afterwards is",
    "indistinguishable from one chosen to fit.",
    "",
    `## The fenced files at ${input.base}`,
    "",
    "| path | blob | bytes |",
    "|---|---|---|",
  ];
  for (const f of input.files) {
    out.push(`| ${f.rel} | ${f.blob} | ${String(f.bytes)} |`);
  }
  out.push("", "## The fenced specs, their census sections and their body names", "");
  const specs = input.files.filter((f) => f.bodies !== undefined);
  if (specs.length === 0) {
    out.push("This card's fence names no spec file, so there is no body list to take.");
  }
  for (const f of specs) {
    const census = f.census ?? { heading: "", count: 0, present: false };
    out.push(
      `### ${f.rel} — ${String((f.bodies ?? []).length)} body/bodies at the base`,
      "",
      census.present
        ? `Census section ${census.heading}: ${String(census.count)} sentence(s).`
        : `The behaviour census carries NO section for this spec — a spec whose sentences the ` +
          "census does not publish is a fact about the census, and it is said rather than left out.",
      "",
    );
    for (const name of f.bodies ?? []) out.push(`- ${name}`);
    out.push("");
  }
  out.push(
    "## The arm's own preflight, at the base",
    "",
    `Exit ${String(input.preflight.exit)} over ${String(input.preflight.findings.length)} finding(s).`,
    "",
  );
  for (const f of input.preflight.findings) out.push(`- ${f}`);
  out.push(
    "",
    GROUND_ADDENDUM_HEADING,
    "",
    "Nothing has been added by hand. On the GUARDED tier the seat's answers to phase 1's further",
    "asks belong here, under this heading, marked as the seat's — on the STANDARD tier this file",
    "is the whole ground and this section stays as it is.",
    "",
  );
  return out.join("\n");
}

/**
 * THE SEAL — the three inputs, by sha256, in one file.
 *
 * WHY THREE. The attack set is what phase 2 pre-committed to; the ground
 * is what it judges on; the card at the base is the contract both were
 * written against. A verdict citing an attack set alone can still be a
 * verdict written against a card that moved.
 *
 * @param {{ taskId: string, tier: string, base: string, tip: string, inputs: { what: string, file: string, digest: string }[] }} input
 * @returns {string}
 */
export function sealDocument(input) {
  return [
    `# SEALED INPUTS for ${input.taskId}`,
    "",
    `tier: ${input.tier}`,
    `base: ${input.base}`,
    `tip: ${input.tip}`,
    "",
    ...input.inputs.map((i) => `sha256:${i.digest}  ${i.what}  (${i.file})`),
    "",
    "The verdict cites these digests. A verdict whose cited hash does not match the saved file is",
    "REFUSED — not read, not weighed, and the pass is re-run — because an input editable after the",
    "diff is open is an input assembled after the fact, and it is indistinguishable from an honest",
    "one to every later reader including its author.",
    "",
  ].join("\n");
}

/**
 * @typedef {object} Phase2Input
 * @property {string} taskId
 * @property {string} tier
 * @property {string} base
 * @property {string} tip
 * @property {string} bench    the detached worktree phase 2 judges in
 * @property {string} card
 * @property {string} cardText the card AT THE BASE — the contract, not the notes
 * @property {string} attackSetFile
 * @property {string} groundFile
 * @property {string} stampsFile
 * @property {string} suites   the command this pass owes
 */

/**
 * RENDER PHASE 2 — from the card, the tier, the tip and the sealed
 * digests. Unlike phase 1 this spawn HOLDS tools and is meant to: it is
 * the half that reads the diff.
 *
 * @param {Phase2Input} input
 * @returns {string}
 */
export function renderPhase2(input) {
  return [
    `# VERIFIER, PHASE 2 — ${input.taskId}, tier ${input.tier}`,
    "",
    `You are a FRESH spawn. Phase 1 wrote the attack set at ${input.attackSetFile} without tools`,
    "and without the diff; you hold tools and you read the diff. You are not a continuation of it,",
    "and you cannot return to its frame — which is why it was a separate spawn.",
    "",
    "## Your bench and your range",
    "",
    `bench worktree: ${input.bench} (detached at the lane's tip)`,
    `base: ${input.base}`,
    `tip:  ${input.tip}`,
    `the suites this pass owes: ${input.suites}`,
    "",
    "## Your sealed inputs",
    "",
    `- the attack set: ${input.attackSetFile}`,
    `- the ground, taken at the base by a script: ${input.groundFile}`,
    `- the digests of both, and of the card at the base: ${input.stampsFile}`,
    "",
    "Cite those digests in your verdict. A verdict whose cited hash does not match the saved file",
    "is refused and the pass is re-run.",
    "",
    "## The mode",
    "",
    input.tier === "guarded"
      ? "GUARDED: your role file entire — the rubric, the whole suites, and the seat's answers to " +
        "phase 1's further asks under the ground file's addendum heading."
      : "STANDARD: your role file's `The standard mode, stated once` section, which is the ONE " +
        "place that says what this pass is. Read it there rather than from this brief.",
    "",
    "**THE DIFF BEFORE THE EXECUTOR'S NOTES**, and a row per acceptance criterion with its",
    "evidence in the verdict. A correction you assign is a body you commit on this bench after the",
    "verdict, with a mutant block per correction in the layout your role file publishes.",
    "",
    "## The card, at the base and verbatim",
    "",
    `Read at ${input.base}, from ${input.card}. This is the contract both phases were written`,
    "against, and it is the copy the seal covers.",
    "",
    "```markdown",
    input.cardText.replace(/\r?\n$/, ""),
    "```",
    "",
  ].join("\n");
}

/**
 * @typedef {object} BenchPlan
 * @property {string} root
 * @property {string} taskId
 * @property {string} card
 * @property {string} cardFile
 * @property {string} bench
 * @property {string} tier
 * @property {string[]} fencePaths
 * @property {string} groundFile
 * @property {string} stampsFile
 * @property {string} phase2File
 * @property {string} attackSetFile
 * @property {string[]} preflightArgv
 * @property {string} suites
 */

/**
 * Derive everything the bench ritual needs. Reads the tree; writes
 * nothing; starts no process — the same split `dispatchLanePlan` takes.
 *
 * @param {Ctx} ctx
 * @param {{ taskId: string, scratch?: string, tier?: string }} opts
 * @returns {BenchPlan}
 */
export function benchPlan(ctx, opts) {
  const taskId = normaliseTaskId(opts.taskId);
  const card = ctx.cards.get(taskId);
  if (card === undefined) {
    throw new DispatchLaneFinding(
      `dispatch-brief: no live card declares id ${taskId}, so there is no contract for a bench to ` +
        "seal. The board is read off the tree (flat docs/tasks/T-*.md).",
    );
  }
  const sp = dispatchSpellings(ctx.conventions);
  const repo = mainWorktree(ctx.porcelain);
  if (repo.path === "") {
    throw new DispatchLaneFinding(`dispatch-brief: ${repo.reason}`);
  }
  const scratch = opts.scratch === undefined || opts.scratch === "" ? os.tmpdir() : opts.scratch;
  // THE TIER IS READ OFF THE CARD, where the dispatch derived and stamped
  // it. A bench that let a seat retype the tier would hand back the dial
  // the classifier exists to remove.
  const tier = opts.tier ?? fieldScalar(card.fields, "tier");
  if (tier === "") {
    throw new DispatchLaneFinding(
      `dispatch-brief: ${taskId} carries no \`tier:\`, and the bench's shape is a function of it ` +
        "— which suites, which mode, and whether a phase 1 exists at all. The tier is written by " +
        "the arm at the dispatch stamp (method/tasks/TASK-FORMAT.md, The tier); a card cut before " +
        "that field existed is the seat's to name explicitly rather than this arm's to guess.",
    );
  }
  const runner = blessedRunner(ctx.conventions);
  return {
    root: ctx.root,
    taskId,
    card: card.file,
    cardFile: path.join(ctx.root, card.file),
    bench: path.resolve(repo.path, sp.benchPattern.replace("T-NNN", taskId)),
    tier,
    fencePaths: fencePaths({ entries: fieldList(card.fields, "touches") }, ctx.slugs, ctx.comps),
    groundFile: path.resolve(scratch, laneScratchName("ground", "md", taskId, sp)),
    stampsFile: path.resolve(scratch, laneScratchName("stamps", "txt", taskId, sp)),
    phase2File: path.resolve(scratch, laneScratchName("phase2", "txt", taskId, sp)),
    attackSetFile: path.resolve(scratch, laneScratchName("attack-set", "md", taskId, sp)),
    preflightArgv: [process.execPath, BRIEF_CLI, "--task", taskId, "--preflight", "--root", ctx.root],
    suites:
      tier === "guarded"
        ? `${runner.script} parser|app|rust|e2e — the whole battery, which the guarded tier keeps`
        : `${runner.script} ${runner.suite} --range <base>..<tip> — the owed set of the range`,
  };
}

/**
 * @typedef {object} BenchResult
 * @property {number} code
 * @property {StepResult[]} done
 * @property {string[]} findings
 * @property {string[]} notes
 * @property {string} base
 * @property {string} tip
 */

/**
 * THE BENCH RITUAL — the ground, the seal, the brief, in that order.
 *
 * The ORDER is the rule: a seal taken before the ground exists seals
 * nothing, and a phase 2 brief rendered before the seal would name
 * digests that had not been computed.
 *
 * @param {BenchPlan} plan
 * @param {DispatchIo} io
 * @returns {BenchResult}
 */
export function runBench(plan, io) {
  /** @type {StepResult[]} */
  const done = [];
  /** @type {string[]} */
  const findings = [];
  /** @type {string[]} */
  const notes = [];

  /** @param {string[]} argv @returns {{ ok: boolean, out: string, err: string, status: number }} */
  const run = (argv) => {
    const r = io.run(argv, { cwd: plan.root });
    return { ok: r.status === 0, out: r.stdout, err: r.stderr, status: r.status };
  };

  // ── THE TWO REFS, DERIVED. The tip is the BENCH's own HEAD (the
  //    detached `-V-<id>` worktree), which is where the verifier's own
  //    correction commits land; the base is the merge base of that tip
  //    against the integration branch.
  const tipRun = run(["git", "-C", plan.bench, "rev-parse", "HEAD"]);
  if (!tipRun.ok) {
    findings.push(
      `the bench worktree at ${plan.bench} could not be read (${tipRun.err.trim()}), so there is ` +
        "no tip to seal against. The bench is cut WITH the lane (method/roles/orchestrator.md 5c); " +
        "a card whose bench has been removed is one this arm cannot serve.",
    );
    return { code: EXIT.FOUND, done, findings, notes, base: "", tip: "" };
  }
  const tip = tipRun.out.trim();
  const baseRun = run(["git", "-C", plan.root, "merge-base", tip, "HEAD"]);
  const base = baseRun.ok ? baseRun.out.trim() : "";
  if (base === "") {
    findings.push(
      `the base of ${tip} against this checkout's HEAD could not be derived ` +
        `(${baseRun.err.trim()}), and every figure in the ground is a figure AT the base. A ` +
        "ground taken at an unknown ref is a ground nobody can re-derive.",
    );
    return { code: EXIT.FOUND, done, findings, notes, base: "", tip };
  }

  // ── THE GROUND ────────────────────────────────────────────────────
  /** @type {GroundFile[]} */
  const files = [];
  // THE CENSUS IS READ AT THE BASE AND THROUGH GIT, not off the working
  // tree — every other figure in this file is at the base, and a census
  // read from the tree would be the one line of the ground measured
  // somewhere else. Its NAME comes from `INDEXED_DOCS`, which is the one
  // place this project enumerates the documents its index carries.
  const censusRel = INDEXED_DOCS.find((d) => d.toUpperCase().includes("CAPABILITIES")) ?? "";
  const censusRun = censusRel === "" ? undefined : run(["git", "-C", plan.root, "show", `${base}:${censusRel}`]);
  const capabilities = censusRun !== undefined && censusRun.ok ? censusRun.out : "";
  if (capabilities === "") {
    notes.push(
      "this checkout publishes no behaviour census at the base, so the ground carries no census " +
        "section for any fenced spec. Said rather than left blank: a missing census and a spec " +
        "the census does not name look the same in a file that omits both.",
    );
  }
  for (const rel of plan.fencePaths) {
    const blobRun = run(["git", "-C", plan.root, "rev-parse", `${base}:${rel}`]);
    if (!blobRun.ok) {
      files.push({ rel, blob: "(absent at the base)", bytes: 0 });
      continue;
    }
    const blob = blobRun.out.trim();
    const sizeRun = run(["git", "-C", plan.root, "cat-file", "-s", blob]);
    /** @type {GroundFile} */
    const entry = { rel, blob, bytes: sizeRun.ok ? Number(sizeRun.out.trim()) : 0 };
    if (/\.spec\.tsx?$/.test(rel)) {
      const textRun = run(["git", "-C", plan.root, "show", `${base}:${rel}`]);
      entry.bodies = textRun.ok ? specBodies(textRun.out) : [];
      entry.census = censusSection(capabilities, rel);
    }
    files.push(entry);
  }
  const pre = io.run(plan.preflightArgv, { cwd: plan.root });
  const ground = groundDocument({
    taskId: plan.taskId,
    tier: plan.tier,
    base,
    card: plan.card,
    files,
    preflight: {
      exit: pre.status,
      findings: pre.stderr
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== ""),
    },
  });
  try {
    io.write(plan.groundFile, ground);
  } catch (err) {
    findings.push(
      `the ground could not be written to ${plan.groundFile} — ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
    return { code: EXIT.CANNOT_RUN, done, findings, notes, base, tip };
  }
  done.push({
    n: 1,
    id: "ground",
    ran: `write ${plan.groundFile}`,
    exit: EXIT.CLEAN,
    detail: `${String(files.length)} fenced file(s) at ${base}, preflight exit ${String(pre.status)}`,
  });

  // ── THE SEAL ──────────────────────────────────────────────────────
  const cardAtBase = run(["git", "-C", plan.root, "show", `${base}:${plan.card}`]);
  /** @type {{ what: string, file: string, digest: string }[]} */
  const inputs = [];
  /** @type {string} */
  let attackSet = "";
  try {
    attackSet = io.read(plan.attackSetFile);
  } catch {
    findings.push(
      `no attack set at ${plan.attackSetFile}. Phase 1 is rendered at DISPATCH and its return is ` +
        "saved there (method/roles/orchestrator.md 5e); a bench sealed without one would seal two " +
        "inputs and call it three, and the verdict's citation would cover a file nobody wrote.",
    );
    return { code: EXIT.FOUND, done, findings, notes, base, tip };
  }
  inputs.push({ what: "the attack set", file: plan.attackSetFile, digest: sha256(attackSet) });
  inputs.push({ what: "the ground", file: plan.groundFile, digest: sha256(ground) });
  inputs.push({
    what: `the card at ${base}`,
    file: plan.card,
    digest: sha256(cardAtBase.ok ? cardAtBase.out : ""),
  });
  const seal = sealDocument({ taskId: plan.taskId, tier: plan.tier, base, tip, inputs });
  try {
    io.write(plan.stampsFile, seal);
  } catch (err) {
    findings.push(
      `the seal could not be written to ${plan.stampsFile} — ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
    return { code: EXIT.CANNOT_RUN, done, findings, notes, base, tip };
  }
  done.push({
    n: 2,
    id: "seal",
    ran: `write ${plan.stampsFile}`,
    exit: EXIT.CLEAN,
    detail: `${String(inputs.length)} input(s) sealed by sha256`,
  });

  // ── THE BRIEF ─────────────────────────────────────────────────────
  const phase2 = renderPhase2({
    taskId: plan.taskId,
    tier: plan.tier,
    base,
    tip,
    bench: plan.bench,
    card: plan.card,
    cardText: cardAtBase.ok ? cardAtBase.out : "",
    attackSetFile: plan.attackSetFile,
    groundFile: plan.groundFile,
    stampsFile: plan.stampsFile,
    suites: plan.suites,
  });
  try {
    io.write(plan.phase2File, phase2);
  } catch (err) {
    findings.push(
      `the phase 2 brief could not be written to ${plan.phase2File} — ` +
        `${err instanceof Error ? err.message : String(err)}`,
    );
    return { code: EXIT.CANNOT_RUN, done, findings, notes, base, tip };
  }
  notes.push(`${PHASE2_SPAWN_NOTE} ${plan.phase2File}`);
  done.push({
    n: 3,
    id: "brief",
    ran: `write ${plan.phase2File}`,
    exit: EXIT.CLEAN,
    detail: `${plan.phase2File} — tier ${plan.tier}, sealed against ${String(inputs.length)} input(s)`,
  });
  return { code: EXIT.CLEAN, done, findings, notes, base, tip };
}

/**
 * The bench ritual's own block of facts, for the seat that has to paste
 * one line and read three files.
 *
 * @param {Ctx} ctx
 * @param {BenchPlan} plan
 * @param {BenchResult | undefined} result
 * @returns {Rec[]}
 */
export function benchRecs(ctx, plan, result) {
  const machine = liveProv(ctx.at, ctx.host, "the scratch directory this bench was given");
  const moving = liveProv(ctx.at, ctx.host, "git rev-parse in the bench worktree, and git merge-base against this checkout");
  return [
    note("THE BENCH — the sealed inputs the verifier judges on, and the line the seat pastes"),
    value(`task: ${plan.taskId}`, treeProv(ctx.ref, "the card named by this bench, and nothing else")),
    value(`tier: ${plan.tier}`, treeProv(ctx.ref, `${plan.taskId} frontmatter field tier, written by the arm at dispatch`)),
    value(`bench worktree: ${plan.bench}`, liveProv(ctx.at, ctx.host, "docs/CONVENTIONS.md's bench spelling, resolved against the repository's main worktree")),
    value(`base: ${result === undefined ? "<derived at the bench's first step>" : result.base}`, moving),
    value(`tip: ${result === undefined ? "<derived at the bench's first step>" : result.tip}`, moving),
    value(`attack set: ${plan.attackSetFile}`, machine),
    value(`ground: ${plan.groundFile}`, machine),
    value(`stamps: ${plan.stampsFile}`, machine),
    value(`phase 2 brief: ${plan.phase2File}`, machine),
    value(`the suites this pass owes: ${plan.suites}`, treeProv(ctx.ref, "the tier, against docs/CONVENTIONS.md's blessed gate-runner bullet")),
  ];
}

/* ────────────────────────────────────────────────────────────────────
 * THE STAMP — step one's write, and the read-back that makes it a fact.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * A problem with the CARD or the checkout, not with this command — the
 * same split `LaneFenceFinding` takes next door, for the same reason: the
 * house contract keeps "I derived it and found something" apart from "I
 * could not tell you", and the caller reads the CLASS rather than
 * pattern-matching a message.
 */
export class DispatchLaneFinding extends Error {}

/* ────────────────────────────────────────────────────────────────────
 * THE MODEL PER ROLE, READ FROM THE RUNTIME TEMPLATE (T-298, ADR-024
 * decision 5).
 *
 * A dispatch that names no model is the failure this block exists
 * against: the measured run the loop room read put all twenty-six of its
 * reviewers on the top tier because one dispatch left the model
 * unnamed, and the dispatching session's own model is the worst possible
 * fallback — it is a property of who happened to be sitting there.
 *
 * So the model is a function of ONE file, the runtime template, and of
 * the role being filled. An absent default is a REFUSAL rather than an
 * inheritance, and the refusal names the role, the key and the file, so
 * the repair is one line in a document the user owns.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * THE FINDING CLASS, and it is a `DispatchLaneFinding` on purpose: the
 * dispatch arm already catches that class and reports it as a refusal, so
 * a missing model refuses a dispatch by exactly the path a missing slug
 * or an unreadable card already does.
 */
export class ModelFinding extends DispatchLaneFinding {}

/**
 * The one file the model per role is read from, repository-relative — and
 * the same file the process section is read out of, so the constant is the
 * parser library's one declaration of it rather than a second literal here.
 */
export { RUNTIME_TEMPLATE };

/**
 * THE ROLE FILE'S NAME AGAINST THE TEMPLATE'S OWN KEY, and the two differ
 * for one role, which is why this map is written down instead of assumed.
 *
 * `method/roles/executor.md` is the seat that BUILDS, and both the card
 * field and the template call that role `builder:` — the arm has stamped
 * `builder:` from the executor dial since T-239 and this map is that same
 * correspondence, said once and in one place. Every other role file's
 * name IS its template key.
 *
 * The orchestrator is deliberately absent: it is the standing seat that
 * dispatches, never a seat that is dispatched, so there is no role
 * default to read for it and a lookup says so rather than refusing.
 */
export const ROLE_TEMPLATE_KEYS = Object.freeze({
  executor: "builder",
  verifier: "verifier",
  integrator: "integrator",
  planner: "planner",
});

/**
 * Read the runtime template, or refuse naming the path.
 *
 * @param {string} [root]
 * @returns {string}
 */
export function runtimeTemplateText(root = repoRoot) {
  const file = path.join(root, RUNTIME_TEMPLATE);
  try {
    return readFileSync(file, "utf8");
  } catch {
    throw new ModelFinding(
      `dispatch-brief: this checkout carries no runtime template at ${RUNTIME_TEMPLATE}, and that ` +
        "file is where the model for every dispatched role is read from (ADR-024 decision 5). " +
        "Without it there is no default to name, and the dispatching session's own model is " +
        "never the fallback.",
    );
  }
}

/**
 * THE `roles:` BLOCK, PARSED — and parsed rather than imported because
 * this repository ships no YAML dependency and the block is two levels
 * deep. A line is a role default when it sits indented under `roles:`,
 * carries a colon and a non-empty value; a comment after the value is cut
 * at the ` #`, which is the only comment shape the template uses.
 *
 * A template with no `roles:` block at all is a REFUSAL rather than an
 * empty map: an empty map would make every lookup below report an absent
 * default for its own role, and the reader would repair one line in a
 * file whose whole section is missing.
 *
 * @param {string} templateYaml
 * @returns {Map<string, string>}
 */
export function roleModels(templateYaml) {
  const lines = templateYaml.split(/\r?\n/);
  const at = lines.findIndex((l) => /^roles:\s*(#.*)?$/.test(l));
  if (at === -1) {
    throw new ModelFinding(
      `dispatch-brief: ${RUNTIME_TEMPLATE} carries no \`roles:\` block, and that block is the ` +
        "one source for which model each dispatched seat runs on (ADR-024 decision 5).",
    );
  }
  /** @type {Map<string, string>} */
  const models = new Map();
  for (const line of lines.slice(at + 1)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    // A line that is not indented has left the block, and the block ends
    // there — the next top-level key is not a role however it is spelled.
    if (!/^\s/.test(line)) break;
    const m = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (m === null) continue;
    const key = /** @type {string} */ (m[1]);
    const raw = /** @type {string} */ (m[2]);
    const cut = raw.startsWith("#") ? "" : (raw.split(" #")[0] ?? "");
    const value = cut.trim().replace(/^(?:""|'')$/, "");
    if (value === "") continue;
    models.set(key, value);
  }
  return models;
}

/**
 * @typedef {object} ModelChoice
 * @property {string} role     the method role file's name, e.g. `executor`
 * @property {string} field    the card frontmatter field this seat is stamped under
 * @property {string} key      the runtime template's own key for that role
 * @property {string} model    what this seat is dispatched on
 * @property {string} fromTemplate the template's default, always read and always reported
 * @property {boolean} overridden whether this dispatch named a model of its own
 */

/**
 * ONE SEAT'S CHOICE, WITH THE DEFAULT KEPT BESIDE IT.
 *
 * A dial may name a model for one dispatch, and the template's default is
 * reported anyway rather than replaced in the record: a reader who is
 * shown only the value that won cannot tell a dispatch that took the
 * project's default from one that departed from it, and the departure is
 * the interesting half.
 *
 * @param {string} role
 * @param {string} field
 * @param {{ model: string, key: string }} fallback the template's answer for that role
 * @param {string | undefined} dial
 * @returns {ModelChoice}
 */
export function modelChoice(role, field, fallback, dial) {
  const named = dial !== undefined && dial.trim() !== "";
  return {
    role,
    field,
    key: fallback.key,
    model: named ? /** @type {string} */ (dial).trim() : fallback.model,
    fromTemplate: fallback.model,
    overridden: named,
  };
}

/**
 * The model one role is dispatched on, or the refusal.
 *
 * @param {Map<string, string>} models the parsed `roles:` block
 * @param {string} role the METHOD role file's name, e.g. `executor`
 * @returns {{ model: string, key: string }}
 */
export function roleModel(models, role) {
  const key = /** @type {Record<string, string>} */ (ROLE_TEMPLATE_KEYS)[role];
  if (key === undefined) {
    throw new ModelFinding(
      `dispatch-brief: ${role} is not a role this arm dispatches, so ${RUNTIME_TEMPLATE} holds no ` +
        `model default for it. The roles it dispatches are ${Object.keys(ROLE_TEMPLATE_KEYS).join(", ")}.`,
    );
  }
  const model = models.get(key);
  if (model === undefined || model === "") {
    throw new ModelFinding(
      `dispatch-brief: ${RUNTIME_TEMPLATE} names no model for \`${key}:\`, the key the ${role} ` +
        "seat is dispatched under, so this dispatch is REFUSED. It is refused rather than filled " +
        "in from the dispatching session's own model, because a seat's model would then be a " +
        "property of who happened to dispatch it (ADR-024 decision 5). Name a model on that key " +
        `in ${RUNTIME_TEMPLATE} and dispatch again.`,
    );
  }
  return { model, key };
}

/* ────────────────────────────────────────────────────────────────────
 * THE PROCESS AS SETTINGS — profiles and switches, declared ONCE in a
 * schema and READ here (T-299, ADR-024 decision 6).
 *
 * The loop's ceremony used to be lore: which steps a card takes was a
 * property of who was sitting in the seat and what they remembered. The
 * room turned every step into a SWITCH with a measured cost and a
 * constraint, and this section is the half of that ruling the arm owns —
 * it reads the schema, resolves the project's profile, refuses a
 * combination the constraints forbid BY NAME, and hands every other arm
 * a value instead of a habit.
 *
 * WHY THE PARSER IS BY HAND, AND WHERE IT LIVES NOW. The scripts in this
 * directory are what the CLI packages and the genesis installs (ADR-024
 * decision 7), and a package's `devDependencies` are not there when it is
 * installed, so the schema is read by a hand parser rather than by a YAML
 * library. The `roles:` block above is parsed the same way and for the
 * same reason. SINCE T-317 THAT READER IS THE PARSER LIBRARY'S — the
 * module named at the top of this file, imported through its browser-safe
 * entry and re-exported below unchanged, so the terminal, the app's
 * settings screen and the skill read ONE implementation instead of a
 * spelling each. The e2e suite parses the SAME file with a real YAML
 * library and requires the two readings to agree, so the hand parser is
 * checked against a parser it shares no line with.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * A PROCESS SETTING THIS ARM CANNOT READ, or a combination it refuses.
 *
 * A `DispatchLaneFinding` for the reason `ModelFinding` is one: the
 * dispatch arm already reports that class as a refusal, so a forbidden
 * combination stops a dispatch by exactly the path a missing model does.
 *
 * AND IT IS WHY THE READER IS BOUND RATHER THAN TAKEN WHOLE. A class
 * declared in the parser package cannot extend one declared here, so the
 * class travels the other way: the reader is built with this one, and
 * every refusal the library raises for this arm is a `ProcessFinding`
 * exactly as it was before the move.
 */
export class ProcessFinding extends DispatchLaneFinding {}

/**
 * THE SEVEN SYMBOLS, BOUND TO THIS ARM'S FINDING CLASS AND RE-EXPORTED
 * UNDER THE NAMES THEY HAVE ALWAYS CARRIED.
 *
 * What each one does, and why it refuses what it refuses, is documented
 * where it now lives (`lib/parser/src/process-settings.ts`): a second
 * copy of that prose here is the duplication this move exists to end.
 * The hand parser is still a hand parser and the e2e suite still checks
 * it against a real YAML library — the reading moved, the argument did
 * not.
 *
 * **AND THE SEVENTH IS `dispatchBlock` (T-324, closing T-319-s1.)** The
 * arm re-exported six of the reader's seven until the admission arm
 * below needed the grant, and a seventh spelling of the block's reading
 * would have been the second implementation the whole move exists to
 * stop. This is the ONLY way the grant reaches this arm, which is this
 * card's seventh criterion in one line of code.
 */
export const {
  parseProcessSchema,
  processSection,
  resolveProcess,
  switchValue,
  processLedger,
  constraintFindings,
  dispatchBlock,
} = processPure.processSettingsReader({ Finding: ProcessFinding });

/**
 * The schema's own vocabulary, re-exported from the one file that
 * declares it: where the switches live, which section of the template
 * names the profile, the fields every switch answers and the two shapes
 * a switch may take.
 */
export { PROCESS_SCHEMA, PROCESS_SECTION, SWITCH_FIELDS, SWITCH_TYPES };

/**
 * The indent of a line. Its one remaining reader is `switchReadSites`
 * below; the schema parser took its own copy to the library with it.
 *
 * @param {string} line @returns {number}
 */
function indentOf(line) {
  return line.length - line.trimStart().length;
}

/**
 * @typedef {object} LoadedProcess
 * @property {ProcessSchema} schema
 * @property {ProcessSection} section
 * @property {ProcessSettings} settings
 */

/**
 * THE ARM'S ONE ENTRY POINT, and the split in it is deliberate.
 *
 * A project whose tree carries no schema or no `process:` section gets
 * `null` and the arms below run the behaviour they ran before this card
 * — a tree that predates the settings is not a misconfiguration. A
 * project that carries them and CONTRADICTS itself is a REFUSAL: a
 * forbidden combination is exactly what the constraints exist to catch,
 * and an arm that ran a combination the schema forbids would be spending
 * the whole mechanism on nothing.
 *
 * @param {string} [root]
 * @returns {LoadedProcess | null}
 */
export function loadProcess(root = repoRoot) {
  let schemaText = "";
  try {
    schemaText = readFileSync(path.join(root, PROCESS_SCHEMA), "utf8");
  } catch {
    return null;
  }
  let templateText = "";
  try {
    templateText = readFileSync(path.join(root, RUNTIME_TEMPLATE), "utf8");
  } catch {
    return null;
  }
  const section = processSection(templateText);
  if (section === null) return null;
  const schema = parseProcessSchema(schemaText);
  const settings = resolveProcess(schema, section);
  const findings = constraintFindings(schema, settings);
  if (findings.length > 0) {
    throw new ProcessFinding(
      `this project's process settings are a combination the schema forbids, so the arm REFUSES ` +
        `rather than running it:\n  - ${findings.join("\n  - ")}\n` +
        `Repair the \`${PROCESS_SECTION}:\` section in ${RUNTIME_TEMPLATE}, or the profile column ` +
        `in ${PROCESS_SCHEMA} it resolved from.`,
    );
  }
  return { schema, section, settings };
}

/**
 * WHERE THE ARM READS EACH SWITCH, DERIVED FROM THE ARM'S OWN SOURCE.
 *
 * A table of "which function reads which switch" would be a third copy
 * of the truth and would go stale the first time a read moved. This
 * scans for the ONE accessor's literal call sites and attributes each to
 * the function that encloses it, so an arm that stops reading a switch
 * loses its site here and the switch's own body reds — which is the
 * whole of criterion 3.
 *
 * @param {Map<string, string>} sources file label → source text
 * @returns {Map<string, { file: string, symbol: string }[]>}
 */
export function switchReadSites(sources) {
  /** @type {Map<string, { file: string, symbol: string }[]>} */
  const sites = new Map();
  for (const [file, text] of sources) {
    const lines = text.split(/\r?\n/);
    let symbol = "";
    for (const line of lines) {
      const fn = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/.exec(line.trimStart());
      if (fn !== null && indentOf(line) === 0) symbol = /** @type {string} */ (fn[1]);
      for (const call of line.matchAll(/switchValue\(\s*[A-Za-z0-9_$.[\]]+\s*,\s*"([^"]+)"\s*\)/g)) {
        const id = /** @type {string} */ (call[1]);
        const list = sites.get(id) ?? [];
        list.push({ file, symbol });
        sites.set(id, list);
      }
    }
  }
  return sites;
}

/* ── THE SIX BEHAVIOURS THE CARD NAMES, each reading its own switch ── */

/**
 * THE PHASE-1 SPAWN, as a function of the setting and the tier.
 *
 * @param {ProcessSettings} settings
 * @param {string} tier
 * @returns {{ render: boolean, by: string, why: string }}
 */
export function phase1Owed(settings, tier) {
  const how = switchValue(settings, "verify.phase1");
  if (how === "off") {
    return {
      render: false,
      by: "nobody",
      why: "verify.phase1 is off: nothing is written before the diff exists, and the verifier's blindness is spent",
    };
  }
  if (how === "by-the-seat") {
    return {
      render: false,
      by: "the seat",
      why: "verify.phase1 is by-the-seat: the arm renders nothing and the phase brief is hand-written",
    };
  }
  if (tier === "bounded") {
    return {
      render: false,
      by: "nobody",
      why: "verify.phase1 is by-the-arm, and the bounded tier takes no bench and therefore no attack set",
    };
  }
  return {
    render: true,
    by: "the arm",
    why: `verify.phase1 is by-the-arm, and the ${tier} tier takes an attack set written before the diff exists`,
  };
}

/**
 * THE WHOLE-SUITE NET — when the four legs run end to end, which is what
 * makes every switch that grades LESS than everything safe to hold.
 *
 * @param {ProcessSettings} settings
 * @returns {{ when: string, netted: boolean, why: string }}
 */
export function wholeSuiteNet(settings) {
  const when = switchValue(settings, "record.whole_suite_net");
  if (when === "every-push") {
    return {
      when,
      netted: false,
      why: "record.whole_suite_net is every-push: there is no net because nothing is ever skipped",
    };
  }
  return {
    when,
    netted: true,
    why:
      `record.whole_suite_net is ${when}: the four legs run on that clock, and a red there is ` +
      "filed against the merge that caused it",
  };
}

/**
 * THE PROCESS ROWS OF THE BRIEF — what this project's loop is SET to,
 * beside the contract rows that say what the seat owes.
 *
 * EVERY SWITCH IS READ AND FOUR ARE PRINTED, which is not a shortcut.
 * The read is `processLedger`, and it goes through the accessor for
 * every declared switch, so a switch the resolution lost throws here
 * rather than rendering one row fewer. What the brief PRINTS is the
 * profile, the floor count, the net and the switches a reader of a
 * dispatch acts on; the rest is pointed at, because a brief carrying a
 * second copy of the schema is the duplication this card exists to end
 * and would cost about a third of a pipe buffer on every dispatch.
 *
 * @param {Ctx} ctx
 * @returns {Rec[]}
 */
export function processRecs(ctx) {
  const loaded = ctx.process;
  if (loaded === null) {
    return [
      blank(),
      note(
        `THE PROCESS AS SETTINGS — this tree carries no ${PROCESS_SCHEMA} or no ` +
          `\`${PROCESS_SECTION}:\` section in ${RUNTIME_TEMPLATE}, so every arm below runs the ` +
          "behaviour it ran before the process became settings. A tree that predates the settings " +
          "is not a misconfiguration, and this line is here so that the absence is read rather " +
          "than assumed.",
      ),
    ];
  }
  const { schema, settings } = loaded;
  const rows = processLedger(schema, settings);
  const via = `${PROCESS_SCHEMA} under the profile ${RUNTIME_TEMPLATE} names`;
  const floor = rows.filter((r) => r.floor);
  const departures = rows.filter((r) => r.overridden);
  const net = wholeSuiteNet(settings);
  /** @type {Rec[]} */
  const recs = [
    blank(),
    note(
      "THE PROCESS AS SETTINGS — the loop's own switches, declared ONCE in the schema and READ " +
        "here; a combination the constraints forbid refuses this command before a row is assembled",
    ),
    value(
      `profile: ${settings.profile} of ${settings.available.join(", ")} — ${schema.profiles.get(settings.profile) ?? ""}`,
      tree(ctx, `${RUNTIME_TEMPLATE}, its ${PROCESS_SECTION}: section`),
    ),
    value(
      `${String(rows.length)} switch(es), ${String(floor.length)} of them FLOOR (no profile turns ` +
        `them off), ${String(departures.length)} departure(s) from the profile`,
      tree(ctx, via),
    ),
    value(`the whole-suite net: ${net.why}`, tree(ctx, `${PROCESS_SCHEMA}, the switch record.whole_suite_net`)),
  ];
  for (const id of ["verify.tier", "verify.phase1", "dispatch.model_per_role", "merge.keepers"]) {
    const row = /** @type {LedgerRow} */ (rows.find((r) => r.id === id));
    recs.push(value(`${id} = ${row.value} — ${row.what}`, tree(ctx, via)));
  }
  for (const row of departures) {
    recs.push(
      value(
        `DEPARTURE: ${row.id} = ${row.value}, which is not what the ${settings.profile} profile sets`,
        tree(ctx, `${RUNTIME_TEMPLATE}, its ${PROCESS_SECTION}: switches block`),
      ),
    );
  }
  // AND THE OTHER SWITCHES ARE POINTED AT, NEVER COPIED. Every row was
  // READ a few lines above — `processLedger` reads each one through the
  // accessor and throws on a switch the resolution lost — and printing
  // all of them here would put a second copy of the schema inside every
  // brief, which is the duplication the whole card is against. It would
  // also cost this command about a third of a pipe buffer per dispatch.
  recs.push(
    value(
      `the other ${String(rows.length - 5 - departures.length)} switch(es) were READ and are not ` +
        `copied here — what each one does, what it needs on, which band measures it and what it ` +
        `cost this project are in ${PROCESS_SCHEMA}, which is the ONE source every surface renders`,
      tree(ctx, via),
    ),
  );
  return recs;
}

/**
 * Rewrite frontmatter fields on a card, IN PLACE and by whole line.
 *
 * **A STAMP ANCHORED ON A MISSING KEY IS A NO-OP**, and that is measured
 * rather than feared: the dispatching seat's own `perl -pi` substitutions
 * silently changed nothing when a card carried no `built_by:` line, and a
 * pattern ending in `\s*$` glued the following frontmatter line onto the
 * one it rewrote. Both failures are structural here — a key this function
 * is asked to stamp and cannot find is a REFUSAL, and a line is replaced
 * whole rather than patched.
 *
 * **AND ONE KEY MAY BE CREATED, BY NAME AND NEVER BY DEFAULT** (T-296).
 * `tier:` is written by the arm and left out by the author, so the card
 * the arm stamps commonly has no line to anchor on — and the refusal
 * above, applied to it, would make every un-dispatched card unstampable.
 * The opt-in is per key and carries the key it goes AFTER, so a created
 * line lands where the format publishes it rather than at the end of the
 * block; a key not named in `insertAfter` still refuses exactly as
 * before, which is the property the body above pins.
 *
 * @param {string} text the card, verbatim
 * @param {Record<string, string>} fields key -> value; "" writes a bare `key:`
 * @param {{ insertAfter?: Record<string, string> }} [opts] keys that may be CREATED, each naming its anchor
 * @returns {{ text: string, changed: string[] }}
 */
export function stampCard(text, fields, opts = {}) {
  const block = frontmatterBlock(text);
  if (block === null) {
    throw new DispatchLaneFinding(
      "dispatch-brief: the card carries no frontmatter block, so there is no field to stamp and " +
        "no lifecycle for a lane to inherit.",
    );
  }
  const start = text.indexOf(block);
  if (start < 0 || !/^﻿?---\r?\n$/.test(text.slice(0, start))) {
    throw new DispatchLaneFinding(
      "dispatch-brief: the card's frontmatter block is not where its own opening fence puts it, " +
        "so this writer will not guess at an offset to edit.",
    );
  }
  const eol = block.includes("\r\n") ? "\r\n" : "\n";
  const lines = block.split(/\r?\n/);
  /** @type {string[]} */
  const changed = [];
  const insertAfter = opts.insertAfter ?? {};
  for (const [key, want] of Object.entries(fields)) {
    let at = lines.findIndex((l) => new RegExp(`^${key}:(?:[ \\t]|$)`).test(l));
    if (at < 0 && Object.prototype.hasOwnProperty.call(insertAfter, key)) {
      const anchor = /** @type {string} */ (insertAfter[key]);
      const after = lines.findIndex((l) => new RegExp(`^${anchor}:(?:[ \\t]|$)`).test(l));
      if (after < 0) {
        throw new DispatchLaneFinding(
          `dispatch-brief: ${JSON.stringify(`${key}:`)} may be created on this card, but the ` +
            `anchor it goes after (${JSON.stringify(`${anchor}:`)}) is not in the frontmatter ` +
            "either, so this writer has no published place to put it and will not append blind.",
        );
      }
      lines.splice(after + 1, 0, `${key}:`);
      at = after + 1;
    }
    if (at < 0) {
      throw new DispatchLaneFinding(
        `dispatch-brief: the card has no ${JSON.stringify(`${key}:`)} line in its frontmatter. A ` +
          "stamp anchored on a key that is not there writes nothing and reports success, which is " +
          "the dispatch failure this step exists to remove — add the field to the card first.",
      );
    }
    const next = lines[at + 1];
    if (next !== undefined && /^[ \t]+-[ \t]+/.test(next)) {
      throw new DispatchLaneFinding(
        `dispatch-brief: ${JSON.stringify(key)} is a block LIST on this card, and this writer only ` +
          "replaces a scalar's own line. Rewriting it would silently orphan the items under it.",
      );
    }
    const line = want === "" ? `${key}:` : `${key}: ${want}`;
    if (lines[at] === line) continue;
    lines[at] = line;
    changed.push(key);
  }
  if (changed.length === 0) return { text, changed };
  const rebuilt = lines.join(eol);
  return { text: text.slice(0, start) + rebuilt + text.slice(start + block.length), changed };
}

/**
 * READ THE STAMP BACK OUT OF THE COMMIT, never off the working tree.
 * The lane inherits the stamp in its BASE (orchestrator 5b), so what
 * matters is what the commit carries — and a working-tree read cannot
 * tell a committed stamp from an uncommitted one.
 *
 * @param {string} committed the card's text at the stamp commit
 * @param {Record<string, string>} fields what the stamp asked for
 * @returns {string[]} the disagreements, empty when the commit carries the stamp
 */
export function stampVerdict(committed, fields) {
  const f = frontmatterFields(committed);
  /** @type {string[]} */
  const wrong = [];
  for (const [key, want] of Object.entries(fields)) {
    const got = fieldScalar(f, key);
    if (got !== want) {
      wrong.push(
        `${key}: the stamp commit carries ${JSON.stringify(got)} and the dispatch asked for ` +
          `${JSON.stringify(want)}`,
      );
    }
  }
  return wrong;
}

/**
 * READ THE MANIFEST BACK — the serial-ritual bullet's own third clause,
 * and the step that turns `--write-fence`'s exit code into a fact about
 * the lane. An arm that trusted the exit alone would hand a seat a lane
 * whose every write the hook refuses.
 *
 * @param {string} text the manifest's bytes
 * @param {{ taskId: string, branch: string, worktree: string, card: string }} want
 * @returns {string[]} the disagreements, empty when the manifest governs this lane
 */
export function manifestVerdict(text, want) {
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return [
      `the manifest is not readable JSON — ${err instanceof Error ? err.message : String(err)}`,
    ];
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return ["the manifest is not a JSON object, so it governs nothing"];
  }
  const m = /** @type {Record<string, unknown>} */ (parsed);
  /** @type {string[]} */
  const wrong = [];
  if (typeof m["version"] !== "number") wrong.push("the manifest declares no version");
  for (const [key, expected] of /** @type {[string, string][]} */ ([
    ["taskId", want.taskId],
    ["branch", want.branch],
    ["worktree", want.worktree],
    ["card", want.card],
  ])) {
    if (m[key] !== expected) {
      wrong.push(
        `${key}: the manifest carries ${JSON.stringify(m[key])} and this lane is ` +
          `${JSON.stringify(expected)}`,
      );
    }
  }
  const paths = m["paths"];
  if (!Array.isArray(paths) || paths.length === 0) {
    wrong.push("the manifest reserves no path at all, so every write in the lane would be refused");
  }
  return wrong;
}

/* ────────────────────────────────────────────────────────────────────
 * THE PLAN — pure. It spawns nothing and writes nothing.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} DispatchStep
 * @property {number} n     the ritual's own order, and it is the law
 * @property {string} id
 * @property {string} what  one line, in a reader's words
 */

/**
 * THE STEPS, IN ORDER, WRITTEN DOWN ONCE.
 *
 * The order is orchestrator 5b (stamp, commit, THEN cut, THEN brief), the
 * serial-ritual bullet (cut one, arm it, read the manifest back) and
 * orchestrator 5c (the bench is cut WITH the lane, never when the lane
 * reports). Nothing here may be reordered without moving those documents
 * first.
 *
 * **THE KEEPER AND THE TIER COME BEFORE THE STAMP, AND THAT ORDER IS THE
 * WHOLE OF WHAT THEY BUY** (T-296, ADR-024 decision 1). A red baseline
 * refused after the stamp has already written a commit and cut two
 * worktrees for a lane that cannot land; refused here it costs a suite
 * run and nothing else. The tier is next because the stamp WRITES it —
 * `tier:` reaches the lane in its base exactly as `status:` does, and a
 * tier stamped afterwards would be a field the lane never inherited.
 *
 * **AND PHASE 1 COMES LAST, BESIDE THE BUILD** (orchestrator 5c and 5e):
 * it is rendered from the card at the base, so it could have run at any
 * point — and it goes at the end because a dispatcher reads the spawn
 * line last and pastes it immediately.
 *
 * @type {readonly DispatchStep[]}
 */
export const DISPATCH_STEPS = Object.freeze([
  Object.freeze({
    n: 1,
    id: "keeper",
    what: "run the fence's own keeper spec at the base and refuse a red baseline, naming the body",
  }),
  Object.freeze({
    n: 2,
    id: "tier",
    what: "classify the card bounded, standard or guarded, and print the tier with its reason",
  }),
  Object.freeze({
    n: 3,
    id: "stamp",
    what: "stamp the card on the integration branch, commit it, and read the stamp back out of the commit",
  }),
  Object.freeze({
    n: 4,
    id: "cut",
    what: "cut the lane worktree on its task branch at that commit, as a sibling and absolutely",
  }),
  Object.freeze({ n: 5, id: "preflight", what: "re-derive the card's own claims at that commit" }),
  Object.freeze({ n: 6, id: "fence", what: "expand the fence into the lane as its manifest" }),
  Object.freeze({ n: 7, id: "manifest", what: "read that manifest back and check it governs this lane" }),
  Object.freeze({ n: 8, id: "bench", what: "cut the verifier's bench, detached, at the same commit" }),
  Object.freeze({ n: 9, id: "brief", what: "assemble the brief into the lane's own scratch file" }),
  Object.freeze({ n: 10, id: "port", what: "derive the lane's port and scratch stem, and prove the port is free" }),
  Object.freeze({
    n: 11,
    id: "phase1",
    what: "render the tool-less phase 1 brief from the card at the base and print the line the seat pastes",
  }),
]);

/* ────────────────────────────────────────────────────────────────────
 * ARM TWELVE — THE BOUNDED WAIT (T-298, ADR-024's room decision G).
 *
 * **A WAIT WITH NO CEILING IS A HANG, AND A HANG IS THE ONE FAILURE A
 * PIPELINE CANNOT REPORT.** The measured run the loop room read spent
 * two thirds of its wait calls on short polls that timed out; ours were
 * hand-typed sleeps, which is the same defect from the other side — a
 * sleep guesses the answer and then stops asking, so it is either too
 * short to be true or too long to be cheap, and it never says which.
 *
 * So every wait this arm performs has exactly three properties:
 *
 *   1. IT WAITS ON A FACT, not on a duration — a MARKER FILE appearing,
 *      or a PID leaving the process table. Both are things that either
 *      happened or did not, so the wait ends the moment the answer
 *      changes rather than when a guessed interval elapses.
 *   2. IT CARRIES A CEILING AND THE CEILING IS STATED. A wait with no
 *      ceiling is refused at USAGE, because a default nobody typed is a
 *      hang nobody chose.
 *   3. IT REPORTS THE CEILING RATHER THAN HANGING ON IT. Reaching the
 *      ceiling is an ANSWER — "not yet, after this long, having asked
 *      this many times" — printed with its own exit, and never silence.
 *
 * THE LIVENESS PROBE IS `ps`, AND THAT IS RULED RATHER THAN CHOSEN:
 * `checkout-currency.mjs` measured the obvious spelling wrong in three
 * separate ways on this machine, so this arm reuses that file's own
 * `processRow` instead of keeping a second answer to one question.
 * ──────────────────────────────────────────────────────────────────── */

/** How often the wait asks, in milliseconds. */
export const AWAIT_INTERVAL_MS = 250;

/** The finding class: a wait this arm was asked for and cannot perform. */
export class AwaitFinding extends Error {}

/**
 * @typedef {object} AwaitOptions
 * @property {string} [marker]  a path whose APPEARANCE ends the wait
 * @property {string} [pid]     a process whose EXIT ends the wait
 * @property {string} [until]   an INSTANT whose ARRIVAL ends the wait (T-322)
 * @property {string} [ceiling] seconds, as the seat typed them
 */

/**
 * THE THIRD KIND IS `run-record.mjs`'s AND IT IS NOT PLANNED HERE
 * (T-311). `awaitPlan` below still produces exactly two kinds — a marker
 * and a pid — because those are the two facts a caller can name on a
 * command line. The RUN ARM waits on a third: an attempt reaching a
 * state, which is DERIVED by re-observing rather than read off the
 * filesystem. It reuses this arm's loop, its interval and its ceiling
 * report rather than keeping a second one, and supplies its own
 * `happened`; the kind is widened here so that reuse is typed rather
 * than cast. `defaultAwaitIo` REFUSES it, because the whole point of a
 * derived fact is that this file has no way to ask it.
 *
 * ── AND THE FOURTH KIND IS AN INSTANT (T-322) ───────────────────────
 * A quota refusal is waited out until the provider's own reset instant,
 * and an instant is a FACT in exactly the sense the three properties
 * above require: it has arrived or it has not, the wait ends the moment
 * the answer changes, and the CEILING still bounds it — because a reset
 * instant a provider stated wrongly, or one already past when the record
 * was written, must not become the hang this arm exists to remove. It is
 * the same loop, the same interval and the same ceiling report; only the
 * question `happened` asks is different, and `defaultAwaitIo` can answer
 * this one because a clock is something this file has.
 *
 * **IT IS AN INSTANT AND NEVER A DURATION**, which is what makes it a
 * fact rather than a sleep: the coordinator that revisits it may be a
 * successor seat that never saw the refusal, and a duration would have
 * to be added to a start it cannot see.
 *
 * @typedef {object} AwaitPlan
 * @property {"marker" | "pid" | "state" | "instant"} kind
 * @property {string} target     the marker path, the pid as it will be printed, the attempt id, or the instant
 * @property {number} [pid]      the parsed pid, on the pid arm only
 * @property {number} [untilMs]  the instant as epoch milliseconds, on the instant arm only
 * @property {number} ceilingMs
 * @property {number} intervalMs
 * @property {string} what       one line naming the fact this wait is waiting on
 */

/**
 * @typedef {object} AwaitResult
 * @property {boolean} satisfied  the fact happened
 * @property {boolean} ceiling    the ceiling was reached and is being REPORTED
 * @property {number} waitedMs
 * @property {number} polls       how many times the fact was asked about
 * @property {string} why         one line a reader can act on
 */

/**
 * Validate a wait, or refuse it. Reads nothing and waits for nothing.
 *
 * @param {AwaitOptions} opts
 * @returns {AwaitPlan}
 */
export function awaitPlan(opts) {
  const marker = (opts.marker ?? "").trim();
  const pidRaw = (opts.pid ?? "").trim();
  const untilRaw = (opts.until ?? "").trim();
  const named = [
    ...(marker === "" ? [] : ["a marker file"]),
    ...(pidRaw === "" ? [] : ["a pid"]),
    ...(untilRaw === "" ? [] : ["an instant"]),
  ];
  if (named.length > 1) {
    throw new AwaitFinding(
      "dispatch-brief: a wait names ONE fact — a marker file, a pid or an instant — and this " +
        `invocation named ${named.join(" and ")}. Two facts are two waits, and which one ended it ` +
        "would then depend on which was asked about first.",
    );
  }
  if (named.length === 0) {
    throw new AwaitFinding(
      "dispatch-brief: a wait needs the fact it is waiting on: a marker path, a pid, or an " +
        "instant. A wait on nothing is a sleep, which is the hand-typed thing this arm exists to " +
        "replace.",
    );
  }
  const ceilingRaw = (opts.ceiling ?? "").trim();
  if (ceilingRaw === "") {
    throw new AwaitFinding(
      "dispatch-brief: a wait needs a CEILING in seconds and this arm will not default one. A " +
        "ceiling nobody typed is a hang nobody chose, and the whole property this arm buys is " +
        "that the wait ends whatever happens.",
    );
  }
  const seconds = Number(ceilingRaw);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new AwaitFinding(
      `dispatch-brief: ${JSON.stringify(ceilingRaw)} is not a ceiling — it must be a positive ` +
        "number of seconds. A ceiling of zero or less is a wait that has already expired, which " +
        "reports rather than waits and is never what a caller meant.",
    );
  }
  const ceilingMs = Math.round(seconds * 1000);
  if (untilRaw !== "") {
    // THE INSTANT IS PARSED HERE AND REFUSED HERE, in the pure plan, for
    // the reason every other refusal in this function is: a wait that
    // discovered its own instant was unreadable would already be running.
    const untilMs = Date.parse(untilRaw);
    if (!Number.isFinite(untilMs)) {
      throw new AwaitFinding(
        `dispatch-brief: ${JSON.stringify(untilRaw)} is not an instant this arm will wait until. ` +
          "It is an ISO 8601 instant — the shape a provider's stated reset carries and the shape " +
          "the run record stores — because a wait on a fact nobody can date is a sleep with a " +
          "timestamp written on it.",
      );
    }
    return {
      kind: "instant",
      target: new Date(untilMs).toISOString(),
      untilMs,
      ceilingMs,
      intervalMs: AWAIT_INTERVAL_MS,
      what: `the instant ${new Date(untilMs).toISOString()} to arrive`,
    };
  }
  if (marker !== "") {
    return {
      kind: "marker",
      target: marker,
      ceilingMs,
      intervalMs: AWAIT_INTERVAL_MS,
      what: `the marker file ${marker} to appear`,
    };
  }
  const pid = Number(pidRaw);
  if (!isRecordablePid(pid)) {
    throw new AwaitFinding(
      `dispatch-brief: ${JSON.stringify(pidRaw)} is not a pid this arm will wait on. It must be a ` +
        "whole number of at least 1: 0 is the process GROUP and -1 is every process, and both " +
        "answer ALIVE for ever to a liveness probe (checkout-currency.mjs carries that " +
        "measurement).",
    );
  }
  return {
    kind: "pid",
    target: String(pid),
    pid,
    ceilingMs,
    intervalMs: AWAIT_INTERVAL_MS,
    what: `process ${String(pid)} to leave the process table`,
  };
}

/**
 * THE SEAM, AND IT IS WHY THIS ARM IS TESTABLE AT ALL.
 *
 * A body that waited on real time would either take its own ceiling to
 * red or assert nothing, so the clock, the sleep and the question are all
 * injected: a body drives a synthetic clock and gets the ceiling arm in
 * microseconds. This is `checkout-currency.spec.ts`'s own rule about the
 * liveness derivation, applied to the wait around it — no body may arm
 * this through the machine it happens to run on.
 *
 * **AND THE CLOCK IS THE ONE ARGUMENT (T-322).** The instant arm's probe
 * is a clock read, so a body that supplied its own `happened` would be
 * testing its own arithmetic and not this file's. Passing the clock in
 * instead keeps the SHIPPED probe under test and lets a body drive the
 * instant arm in microseconds: `defaultAwaitIo(() => fake)` is the whole
 * seam, and the default is the real clock so every existing caller is
 * unchanged.
 *
 * @param {() => number} [now]
 * @returns {{ now: () => number, sleep: (ms: number) => Promise<void>, happened: (plan: AwaitPlan) => boolean }}
 */
export function defaultAwaitIo(now = () => Date.now()) {
  return {
    now,
    sleep: (ms) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      }),
    happened: (plan) => {
      if (plan.kind === "marker") return existsSync(plan.target);
      if (plan.kind === "pid") return processRow(/** @type {number} */ (plan.pid)) === undefined;
      // AN INSTANT IS ANSWERED BY THE SAME CLOCK THE WAIT IS TIMED BY,
      // and that is deliberate: a body driving a fake clock gets the
      // instant arm in microseconds, exactly as it gets the ceiling arm,
      // and no body may arm this through the machine it happens to run on.
      if (plan.kind === "instant") return now() >= /** @type {number} */ (plan.untilMs);
      // A DERIVED FACT HAS NO PROBE HERE, and answering `false` would be
      // this io waiting for ever on a question it never asked — the
      // silent half of the hang this arm exists to remove.
      throw new AwaitFinding(
        `dispatch-brief: this wait's default io cannot ask about a ${plan.kind} fact — it reads ` +
          "the filesystem and the process table, and nothing else. The arm that owns that kind of " +
          "fact supplies its own probe.",
      );
    },
  };
}

/**
 * Wait for the fact, or reach the ceiling and SAY SO.
 *
 * THE FACT IS ASKED ABOUT BEFORE THE FIRST SLEEP, deliberately: a marker
 * already on disk when the wait began, or a process that has already
 * exited, is a wait that is already over — and a poll loop that sleeps
 * first spends one interval learning that.
 *
 * @param {AwaitPlan} plan
 * @param {ReturnType<typeof defaultAwaitIo>} io
 * @returns {Promise<AwaitResult>}
 */
export async function runAwait(plan, io) {
  const started = io.now();
  let polls = 0;
  for (;;) {
    polls += 1;
    if (io.happened(plan)) {
      const waitedMs = io.now() - started;
      return {
        satisfied: true,
        ceiling: false,
        waitedMs,
        polls,
        why:
          `it happened: ${plan.what}, after ${String(waitedMs)} ms and ${String(polls)} ask(s), ` +
          `inside the ${String(plan.ceilingMs)} ms ceiling`,
      };
    }
    const waitedMs = io.now() - started;
    if (waitedMs >= plan.ceilingMs) {
      return {
        satisfied: false,
        ceiling: true,
        waitedMs,
        polls,
        why:
          `THE CEILING WAS REACHED AND THIS IS THE REPORT, not a hang: waited for ${plan.what} ` +
          `for ${String(waitedMs)} ms against a ceiling of ${String(plan.ceilingMs)} ms, asking ` +
          `${String(polls)} time(s), and it had not happened. Nothing was signalled and nothing ` +
          "was taken away — the wait ended, the thing it waited on did not.",
      };
    }
    // NEVER SLEEP PAST THE CEILING: the last interval is trimmed to what
    // is left, so the report lands at the ceiling rather than up to one
    // interval after it.
    await io.sleep(Math.min(plan.intervalMs, plan.ceilingMs - waitedMs));
  }
}

/**
 * @param {Ctx} ctx
 * @param {AwaitPlan} plan
 * @param {AwaitResult} result
 * @returns {Rec[]}
 */
export function awaitRecs(ctx, plan, result) {
  const p = liveProv(ctx.at, ctx.host, "this wait's own clock, and the fact it asked about");
  return [
    note("THE BOUNDED WAIT — on a fact, with a ceiling, and the ceiling is an ANSWER"),
    value(`waiting on: ${plan.what}`, p),
    value(`ceiling: ${String(plan.ceilingMs)} ms, asked every ${String(plan.intervalMs)} ms`, p),
    value(result.ceiling ? `CEILING REACHED — ${result.why}` : `satisfied — ${result.why}`, p),
  ];
}

/**
 * @typedef {object} DispatchLaneOptions
 * @property {string} taskId
 * @property {string} slug     the dispatcher's, and the one thing here that is not derived
 * @property {string} [executor] the seat to stamp as `builder:`
 * @property {string} [verifier] the seat to stamp as `verifier:`
 * @property {string} [scratch]  the directory the brief is written into
 * @property {GrantState} [grant] the grant, read once by the caller; read here when it is not
 * @property {AdmissionEntry[]} [ledger] what has already been admitted, from the run records
 * @property {RoomQuestion[]} [questions] the room questions, read once by the caller; read here when not
 * @property {string} [derivedFrom] the parent authorized card, making this a DERIVED admission
 * @property {string} [failure] a derived admission's failure evidence
 * @property {string} [derivedScope] a derived admission's own scope, one of DERIVED_SCOPES
 */

/**
 * @typedef {object} DispatchPlan
 * @property {string} root
 * @property {string} taskId
 * @property {string} slug
 * @property {GrantState} grant  the grant this dispatch was read against
 * @property {Admission} admission  the lane cut's own admission, which reserves nothing
 * @property {RoomQuestion[]} questions  the room questions this cut was ruled against (T-322)
 * @property {string} card       repository-relative
 * @property {string} cardFile   absolute
 * @property {string} branch     the FULL ref the lane will be on
 * @property {string} branchName the short name `git worktree add -b` takes
 * @property {string} worktree   absolute, a sibling of the repository root
 * @property {string} bench      absolute, the verifier's detached checkout
 * @property {number} port
 * @property {string} portVariable
 * @property {string} scratchStem
 * @property {string} briefFile
 * @property {string} phase1File   the tool-less phase 1 brief the arm renders
 * @property {string} attackSetFile where the seat saves phase 1's return
 * @property {string} manifestFile
 * @property {TierInput} tierInput  everything the classifier reads off the TREE
 * @property {string[]} keeperArgv  the fence's keeper run, at the base
 * @property {string} keeperVerdictToken the token a graded reading prints
 * @property {Record<string, string>} stamp
 * @property {ModelChoice[]} models  one per dispatched seat, read from the runtime template
 * @property {string[]} createArgv  the published create command, substituted
 * @property {readonly DispatchStep[]} steps
 */

/** The token the published create command leaves for the base commit. */
export const BASE_TOKEN = "<base>";

/**
 * Derive everything the ritual needs and NOTHING it does not. Reads the
 * tree; writes nothing; starts no process.
 *
 * @param {Ctx} ctx
 * @param {DispatchLaneOptions} opts
 * @returns {DispatchPlan}
 */
export function dispatchLanePlan(ctx, opts) {
  const taskId = normaliseTaskId(opts.taskId);
  const slug = opts.slug.trim();
  if (slug === "") {
    throw new DispatchLaneFinding(
      "dispatch-brief: a lane needs a slug and this command will not invent one — the branch name " +
        "is what a reader of `git branch` sees for the life of the repository, and the assembler " +
        "has left the document's placeholder there since T-133 for exactly this reason.",
    );
  }
  const card = ctx.cards.get(taskId);
  if (card === undefined) {
    throw new DispatchLaneFinding(
      `dispatch-brief: no live card declares id ${taskId} — the board is read off the tree (flat ` +
        "docs/tasks/T-*.md), so an id with no card is a lane with no contract.",
    );
  }
  const s = ctx.spellings;
  const sp = dispatchSpellings(ctx.conventions);
  const repo = mainWorktree(ctx.porcelain);
  if (repo.path === "") {
    throw new DispatchLaneFinding(
      `dispatch-brief: ${repo.reason} A lane worktree is a SIBLING of the repository root ` +
        "(method/lane-protocol.md rule three), so without that root there is no path to cut it at " +
        "— and a relative spelling resolves against whatever directory the dispatching shell " +
        "happens to sit in, which is the failure that rule is written against.",
    );
  }
  const branchName = s.branchPattern.replace("T-NNN", taskId).replace("<slug>", slug);
  const worktree = path.resolve(repo.path, s.worktreePattern.replace("T-NNN", taskId));
  const bench = path.resolve(repo.path, sp.benchPattern.replace("T-NNN", taskId));
  if (insideRepository(repo.path, worktree) || insideRepository(repo.path, bench)) {
    throw new DispatchLaneFinding(
      `dispatch-brief: the worktree spelling ${JSON.stringify(s.worktreePattern)} resolves INSIDE ` +
        `the repository (${repo.path}), and method/lane-protocol.md rule three says "The worktree ` +
        'is a sibling directory, never a path inside the repository." A lane cut there is a second ' +
        "copy of every file to everything that walks the tree.",
    );
  }
  // ── THE MODEL PER SEAT, READ FROM THE RUNTIME TEMPLATE (T-298) ─────
  // It is resolved HERE, in the pure plan, so an absent default refuses
  // BEFORE the ritual stamps a card or cuts a worktree: a dispatch that
  // has to be unwound is more expensive than one that never began. And
  // it is resolved whether or not a dial was passed, because "an absent
  // default refuses" is a statement about the TEMPLATE and a dial cannot
  // make a missing default present.
  const templateModels = roleModels(runtimeTemplateText(ctx.root));
  const builderDefault = roleModel(templateModels, "executor");
  const verifierDefault = roleModel(templateModels, "verifier");
  /** @type {ModelChoice[]} */
  const models = [
    modelChoice("executor", "builder", builderDefault, opts.executor),
    modelChoice("verifier", "verifier", verifierDefault, opts.verifier),
  ];
  /** @type {Record<string, string>} */
  const stamp = { status: "building" };
  for (const m of models) stamp[m.field] = m.model;
  const scratch = opts.scratch === undefined || opts.scratch === "" ? os.tmpdir() : opts.scratch;

  // ── THE TIER'S TREE-SIDE INPUTS (T-296) ────────────────────────────
  // Everything the classifier reads off the TREE is derived here, where
  // the plan is pure; the one input that needs a process — whether a
  // keeper already pins what this card changes — is taken by step one and
  // handed in at step two.
  const entries = fieldList(card.fields, "touches");
  const paths = fencePaths({ entries }, ctx.slugs, ctx.comps);
  const unresolved = entries.filter(
    (/** @type {string} */ e) => expandFenceEntry(e, ctx.slugs, ctx.comps).paths.length === 0,
  );
  const tracked = new Set(
    git(ctx.root, ["ls-files", "-z"])
      .split("\0")
      .filter((l) => l !== ""),
  );
  // A PATH IS TRACKED IF THE TREE TRACKS IT **OR ANYTHING UNDER IT** — a
  // fence naming a directory is naming the files in it, and a fence
  // naming a file that does not exist yet under a tracked directory is
  // the NEW-FILE RESERVATION T-287 ruled on rather than a dead entry.
  const isTracked = (/** @type {string} */ rel) => {
    const t = rel.replace(/\/+$/, "");
    if (tracked.has(t)) return true;
    if ([...tracked].some((f) => f.startsWith(`${t}/`))) return true;
    const parent = t.includes("/") ? t.slice(0, t.lastIndexOf("/")) : "";
    return parent !== "" && [...tracked].some((f) => f.startsWith(`${parent}/`));
  };
  // THE CLASSES ARE THE METHOD'S AND THE PATHS ARE THE PROJECT'S, so the
  // two arguments come from two documents and never from one.
  const guardMap = guardClassMap(ctx.conventions, guardClassIds(taskFormatText(ctx.root)));
  const runner = blessedRunner(ctx.conventions);

  // ── THE QUESTION HOLD AT THE LANE CUT (T-322) ──────────────────────
  // **THE CUT REFUSES BY THE RESOLVED QUESTION STATE RATHER THAN MERELY
  // DISPLAYING IT.** The dispatch order names the question id on every
  // dependent card it holds NOT STARTABLE, and a display is advice: a
  // seat that had the order's answer in another window would cut the lane
  // anyway and nothing would stop it. So the SAME derivation —
  // `questionHolds` over the rooms — decides both, which is what makes
  // the two answers incapable of disagreeing.
  //
  // IT IS ASKED BEFORE THE GRANT because it is cheaper and because it is
  // a different question: the grant says whether the owner authorized
  // this card, and a pending question says the owner has not yet settled
  // something this card depends on. A card can pass one and fail the
  // other, and the refusal should name which.
  const questions = opts.questions ?? readQuestions(roomFiles(ctx.root));
  const holding = questionHolds(questions).get(taskId);
  if (holding !== undefined) {
    throw new UnattendedFinding(
      UNATTENDED_CODES.QUESTION_PENDING,
      `dispatch-brief: ${taskId} is held by the PENDING question ${holding.id} in ${holding.room} ` +
        `(dated ${holding.at}) — ${holding.cause}. A question entry is a decision this coordinator ` +
        "may not make, so a card that depends on one is NOT STARTABLE until the entry's state is " +
        "resolved with the resolution's evidence. Every card that does not depend on it is " +
        "admitted, and this refusal names the question rather than the card so the remedy is " +
        "findable: settle it in the room.",
    );
  }

  // ── THE ADMISSION AT THE LANE CUT (T-324) ──────────────────────────
  // IT IS RESOLVED HERE, IN THE PURE PLAN, FOR THE REASON THE MODEL
  // ABOVE IS: a dispatch that has to be unwound costs a commit and two
  // worktrees, and an admission refused here costs nothing. **AND THE
  // LANE CUT IS NOT THE WRITER RESERVATION**: this admission names no
  // resource, takes none, and the reservation is the child start's — the
  // two are separate facts and this plan writes neither.
  const grant = opts.grant ?? grantState(ctx.root);
  const derivedFrom = (opts.derivedFrom ?? "").trim();
  const admission = admit(
    grant,
    {
      boundary: "lane-cut",
      kind: derivedFrom === "" ? "explicit" : "derived",
      card: taskId,
      role: "executor",
      blob: cardBlobSha(ctx.root, card.file),
      cardText: readFileSync(path.join(ctx.root, card.file), "utf8"),
      approvedText: (sha) => approvedCardText(ctx.root, sha),
      resource: null,
      board: admissionBoard(ctx),
      ...(derivedFrom === "" ? {} : { parent: derivedFrom, evidence: opts.failure ?? "" }),
      ...(opts.derivedScope === undefined ? {} : { scope: opts.derivedScope }),
    },
    opts.ledger ?? [],
  );

  return {
    root: ctx.root,
    taskId,
    slug,
    grant,
    admission,
    questions,
    card: card.file,
    cardFile: path.join(ctx.root, card.file),
    branch: `refs/heads/${branchName}`,
    branchName,
    worktree,
    bench,
    port: lanePort(taskId, sp),
    portVariable: sp.portVariable,
    scratchStem: laneScratchStem(taskId, sp),
    briefFile: path.resolve(scratch, laneScratchName("brief", "txt", taskId, sp)),
    phase1File: path.resolve(scratch, laneScratchName("phase1", "txt", taskId, sp)),
    attackSetFile: path.resolve(scratch, laneScratchName("attack-set", "md", taskId, sp)),
    manifestFile: path.join(worktree, ".supertaskr", "lane-fence.json"),
    tierInput: {
      size: fieldScalar(card.fields, "size"),
      fencePaths: paths,
      unresolved,
      untracked: paths.filter((p) => !isTracked(p)),
      guardMap,
      keeper: { pinned: false, answered: false, why: "step one has not run yet" },
      // THE PROJECT'S OWN SETTING RIDES WITH THE INPUT (T-299), so the
      // classification the ritual performs is the classification any
      // reader can reproduce from the plan alone.
      ...(ctx.process === null ? {} : { process: ctx.process.settings }),
    },
    keeperArgv: [
      process.execPath,
      path.join(ctx.root, runner.script),
      runner.suite,
      runner.owningFlag,
      ...paths,
    ],
    keeperVerdictToken: runner.verdictToken,
    stamp,
    models,
    createArgv: createLaneArgv(ctx, { branchName, worktree }),
    steps: DISPATCH_STEPS,
  };
}

/**
 * THE CREATE COMMAND IS THE PROJECT'S OWN, SUBSTITUTED — never typed.
 *
 * `docs/CONVENTIONS.md`'s lane bullet publishes the command in as many
 * words, and row 4 of every brief has printed it since T-133. Here it is
 * turned into an argv ARRAY — a shell string can hold a pipe, and this
 * ritual never uses a shell — by substituting the three tokens the
 * document itself leaves: the worktree spelling, the branch spelling and
 * `<base>`. A token the document no longer carries is a hard failure,
 * because the alternative is a command assembled from memory.
 *
 * @param {Ctx} ctx
 * @param {{ branchName: string, worktree: string }} lane
 * @returns {string[]} argv with `<base>` still standing
 */
export function createLaneArgv(ctx, lane) {
  const s = ctx.spellings;
  const words = s.createCommand.trim().split(/\s+/);
  /** @type {Record<string, string>} */
  const substitution = {
    [s.worktreePattern]: lane.worktree,
    [s.branchPattern]: lane.branchName,
  };
  let filled = 0;
  const argv = words.map((w) => {
    const sub = substitution[w];
    if (sub === undefined) return w;
    filled += 1;
    return sub;
  });
  if (filled !== Object.keys(substitution).length || !argv.includes(BASE_TOKEN)) {
    throw new DispatchLaneFinding(
      `dispatch-brief: the create command docs/CONVENTIONS.md publishes ` +
        `(${JSON.stringify(s.createCommand)}) no longer carries its worktree spelling, its branch ` +
        `spelling and ${JSON.stringify(BASE_TOKEN)} as separate words, so this ritual cannot ` +
        "substitute into it. The alternative is a `git worktree add` typed from memory, which is " +
        "what this whole arm exists to stop.",
    );
  }
  if (argv[0] !== "git") {
    throw new DispatchLaneFinding(
      `dispatch-brief: the published create command starts with ${JSON.stringify(argv[0] ?? "")} ` +
        "rather than `git`, so this ritual cannot aim it at a checkout with `-C`.",
    );
  }
  return ["git", "-C", ctx.root, ...argv.slice(1)];
}

/* ────────────────────────────────────────────────────────────────────
 * THE RUNNER — the one function in this module that acts, and it acts
 * only through the world it is handed.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * @typedef {object} RunResult
 * @property {number} status  the process's exit, or -1 when it never started
 * @property {string} stdout
 * @property {string} stderr
 */

/**
 * @typedef {object} DispatchIo
 * @property {(argv: string[], opts: { cwd: string, out?: string }) => RunResult} run
 * @property {(file: string) => string} read
 * @property {(file: string, text: string) => void} write
 * @property {() => string} [now]  the clock, injected so a body can drive an instant (T-320)
 */

/**
 * The real world: a synchronous spawn with NO SHELL and an argv array, a
 * read, and a write. `out` redirects the child's stdout into a file
 * rather than piping it — the gate-runner's own doctrine, and the reason
 * the brief step can write a document larger than any pipe buffer.
 *
 * @returns {DispatchIo}
 */
export function defaultDispatchIo() {
  return {
    // THE CLOCK IS AN INJECTION POINT LIKE THE OTHER THREE (T-320): the
    // express arm stamps an instant, and a body that could not drive it
    // would be a body asserting against the wall clock.
    now: () => new Date().toISOString(),
    run: (argv, opts) => {
      const [file, ...args] = argv;
      if (file === undefined) return { status: -1, stdout: "", stderr: "an empty argv" };
      /** @type {number | undefined} */
      let fd;
      try {
        if (opts.out !== undefined) {
          mkdirSync(path.dirname(opts.out), { recursive: true });
          fd = openSync(opts.out, "w");
        }
        const r = spawnSync(file, args, {
          cwd: opts.cwd,
          encoding: "utf8",
          shell: false,
          maxBuffer: 64 * 1024 * 1024,
          ...(fd === undefined ? {} : { stdio: [/** @type {const} */ ("ignore"), fd, "pipe"] }),
        });
        if (r.error !== undefined && r.error !== null) {
          return { status: -1, stdout: r.stdout ?? "", stderr: r.error.message };
        }
        return { status: r.status ?? -1, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
      } catch (err) {
        return { status: -1, stdout: "", stderr: err instanceof Error ? err.message : String(err) };
      } finally {
        if (fd !== undefined) closeSync(fd);
      }
    },
    read: (file) => readFileSync(file, "utf8"),
    write: (file, text) => {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, text);
    },
  };
}

/**
 * @typedef {object} StepResult
 * @property {number} n
 * @property {string} id
 * @property {string} ran     the command, verbatim, or the act it performed
 * @property {number} exit    the four house codes
 * @property {string} detail
 */

/**
 * @typedef {object} DispatchResult
 * @property {number} code    the four house codes
 * @property {StepResult[]} done
 * @property {StepResult | undefined} stopped
 * @property {string[]} findings
 * @property {string[]} removed   the worktrees THIS run cut and then took away
 * @property {string} base        the stamp commit, once step one has made it
 * @property {string[]} notes     what a reader must be told and is not a finding
 */

/**
 * One argv, spelled for a reader to re-run. Verbatim: an argument
 * carrying whitespace is quoted and nothing else is touched, because a
 * command printed as anything but what ran is a command nobody can
 * reproduce.
 *
 * @param {string[]} argv
 * @returns {string}
 */
export function spellCommand(argv) {
  return argv.map((a) => (/[\s"'$`\\]/.test(a) ? JSON.stringify(a) : a)).join(" ");
}

/**
 * PERFORM THE RITUAL. Eight steps, in order, refusing at the first that
 * fails and never attempting a later one.
 *
 * @param {DispatchPlan} plan
 * @param {DispatchIo} io
 * @returns {DispatchResult}
 */
export function runDispatchLane(plan, io) {
  /** @type {StepResult[]} */
  const done = [];
  /** @type {string[]} */
  const findings = [];
  /** @type {string[]} */
  const notes = [];
  /** @type {{ path: string, branch: string }[]} */
  const cut = [];
  /** @type {string[]} */
  const removed = [];
  let base = "";
  // THE STAMP THIS RUN ACTUALLY WRITES, which is the plan's plus the one
  // field the plan cannot know: the TIER is a function of a suite's
  // answer, and step one is what takes it.
  /** @type {Record<string, string>} */
  const stamp = { ...plan.stamp };
  /** @type {{ pinned: boolean, answered: boolean, why: string }} */
  let keeper = { ...plan.tierInput.keeper };
  let tier = "";
  /** @type {string} */
  let cardAtBase = "";

  /**
   * Undo what THIS RUN cut, and nothing else. The stamp stays: it is a
   * fact about the card (T-226) and a card un-stamped after a lane was
   * refused is a card whose lifecycle nobody can read.
   */
  const unwind = () => {
    for (const w of [...cut].reverse()) {
      const gone = io.run(["git", "-C", plan.root, "worktree", "remove", "--force", w.path], {
        cwd: plan.root,
      });
      if (gone.status !== 0) {
        findings.push(
          `the worktree this run cut at ${w.path} could not be removed (exit ` +
            `${String(gone.status)}) — ${gone.stderr.trim()}. It is still there and it is this ` +
            "run's to take away, so remove it by hand before dispatching again.",
        );
        continue;
      }
      removed.push(w.path);
      if (w.branch === "") continue;
      const dropped = io.run(["git", "-C", plan.root, "branch", "-D", w.branch], { cwd: plan.root });
      if (dropped.status !== 0) {
        findings.push(
          `the branch this run created (${w.branch}) could not be deleted (exit ` +
            `${String(dropped.status)}) — ${dropped.stderr.trim()}. A dispatch re-run will fail at ` +
            "the cut until it is gone.",
        );
      }
    }
  };

  /**
   * @param {DispatchStep} step
   * @param {string} ran
   * @param {number} exit
   * @param {string} detail
   * @returns {DispatchResult}
   */
  const stopAt = (step, ran, exit, detail) => {
    unwind();
    // THE COMMAND IS EMBEDDED RATHER THAN QUOTED, and the reason is that a
    // reader has to be able to copy it: `JSON.stringify` around an argv
    // that already carries its own quoting escapes them a second time, and
    // what a dispatcher then pastes is not the command that ran.
    findings.push(
      `the dispatch stopped at step ${String(step.n)} (${step.id}) — ${step.what}. It ran: ` +
        `${ran} — and got exit ${String(exit)}. ${detail}`,
    );
    return {
      code: exit === EXIT.CANNOT_RUN ? EXIT.CANNOT_RUN : EXIT.FOUND,
      done,
      stopped: { n: step.n, id: step.id, ran, exit, detail },
      findings,
      removed,
      base,
      notes,
    };
  };

  for (const step of plan.steps) {
    if (step.id === "keeper") {
      const ran = spellCommand(plan.keeperArgv);
      // THE RUNNER HAS TO BE THERE, and a project that publishes none is
      // told so rather than silently skipped: the tier's keeper question
      // then has no answer, and step two refuses any card whose tier
      // depends on one.
      let publishes = true;
      try {
        io.read(/** @type {string} */ (plan.keeperArgv[1]));
      } catch {
        publishes = false;
      }
      if (!publishes) {
        keeper = {
          pinned: false,
          answered: false,
          why: `this checkout publishes no keeper runner at ${String(plan.keeperArgv[1])}`,
        };
        notes.push(
          `the keeper step found no runner at ${String(plan.keeperArgv[1])}, so no keeper was run ` +
            "at the base and the tier's keeper question is UNANSWERED. That is stated rather than " +
            "skipped: a gate nobody ran and a gate that passed look identical afterwards.",
        );
        done.push({ n: step.n, id: step.id, ran, exit: EXIT.CLEAN, detail: keeper.why });
        continue;
      }
      const r = io.run(plan.keeperArgv, { cwd: plan.root });
      const v = keeperVerdict({
        status: r.status,
        stdout: r.stdout,
        stderr: r.stderr,
        token: plan.keeperVerdictToken,
      });
      if (v.graded && !v.green) {
        return stopAt(
          step,
          ran,
          r.status,
          `the fence's own keeper is RED at the base — ${v.detail}. A lane cut here inherits a red ` +
            "it did not cause and its fence usually forbids it to fix, so the baseline is repaired " +
            "before a seat is spent on it.",
        );
      }
      keeper = { pinned: v.graded && v.green, answered: v.graded, why: v.detail };
      if (!v.graded) {
        notes.push(
          `the keeper run graded nothing — ${v.detail}. The tier's keeper question is UNANSWERED, ` +
            "which refuses any card whose tier depends on it and is a note for every other card.",
        );
      }
      done.push({ n: step.n, id: step.id, ran, exit: EXIT.CLEAN, detail: v.detail });
      continue;
    }

    if (step.id === "tier") {
      const ran = `classify ${plan.taskId}`;
      /** @type {TierVerdict} */
      let verdict;
      try {
        verdict = classifyTier({ ...plan.tierInput, keeper });
      } catch (err) {
        return stopAt(
          step,
          ran,
          err instanceof TierFinding ? EXIT.FOUND : EXIT.CANNOT_RUN,
          err instanceof Error ? err.message : String(err),
        );
      }
      tier = verdict.tier;
      // THE FIELD IS DERIVED, SO AN AUTHOR'S VALUE HAS NO STANDING — but
      // a silent overwrite would teach nobody anything, and the author is
      // the one person who can stop writing it.
      let already = "";
      try {
        already = fieldScalar(frontmatterFields(io.read(plan.cardFile)), "tier");
      } catch {
        already = "";
      }
      if (already !== "" && already !== tier) {
        notes.push(
          `the card arrived carrying \`tier: ${already}\` and the derivation answers ${tier}. The ` +
            "field is DERIVED, so the stamp OVERWRITES it rather than refusing the dispatch " +
            "(method/tasks/TASK-FORMAT.md, The tier) — and it is announced here because a hand " +
            "written tier is a line an author can stop writing.",
        );
      }
      stamp["tier"] = tier;
      done.push({
        n: step.n,
        id: step.id,
        ran,
        exit: EXIT.CLEAN,
        detail: `${tier} — ${verdict.reason}`,
      });
      continue;
    }

    if (step.id === "phase1") {
      const ran = `render ${plan.phase1File}`;
      // WHO WRITES THE ATTACK SET IS A SETTING (T-299, ADR-024 decision
      // 6). `verify.phase1` decides whether this arm renders it at all,
      // and the tier decides which cards it is owed for — so the two are
      // asked together and the answer is REPORTED either way. A phase
      // this arm skipped on purpose and a phase it forgot look the same
      // on disk, which is why the skip is a note and never a silence.
      const owed =
        plan.tierInput.process === undefined
          ? {
              render: tier !== "bounded",
              by: "the arm",
              why:
                tier === "bounded"
                  ? "the bounded tier takes no verifier at all (method/tasks/TASK-FORMAT.md, The tier)"
                  : `the ${tier} tier takes an attack set written before the diff exists`,
            }
          : phase1Owed(plan.tierInput.process, tier);
      if (!owed.render) {
        notes.push(
          `no phase 1 was rendered and none is owed — ${owed.why}. Said out loud, because a phase ` +
            "this arm skipped on purpose and a phase it forgot look the same on disk.",
        );
        done.push({
          n: step.n,
          id: step.id,
          ran,
          exit: EXIT.CLEAN,
          detail: `not owed — ${owed.why}`,
        });
        continue;
      }
      /** @type {string} */
      let verifierMd;
      try {
        verifierMd = roleText("verifier", plan.root);
      } catch (err) {
        return stopAt(step, ran, EXIT.CANNOT_RUN, err instanceof Error ? err.message : String(err));
      }
      const text = renderPhase1({
        taskId: plan.taskId,
        tier,
        base,
        card: plan.card,
        cardText: cardAtBase,
        verifierMd,
        attackSetFile: plan.attackSetFile,
      });
      try {
        io.write(plan.phase1File, text);
      } catch (err) {
        return stopAt(step, ran, EXIT.CANNOT_RUN, err instanceof Error ? err.message : String(err));
      }
      notes.push(`${PHASE1_SPAWN_NOTE} ${plan.phase1File}`);
      done.push({
        n: step.n,
        id: step.id,
        ran,
        exit: EXIT.CLEAN,
        detail: `${plan.phase1File} — rendered from ${plan.card} at ${base} and nothing else`,
      });
      continue;
    }

    if (step.id === "stamp") {
      let stamped;
      try {
        stamped = stampCard(io.read(plan.cardFile), stamp, { insertAfter: { tier: "size" } });
      } catch (err) {
        return stopAt(
          step,
          `read ${plan.card}`,
          err instanceof DispatchLaneFinding ? EXIT.FOUND : EXIT.CANNOT_RUN,
          err instanceof Error ? err.message : String(err),
        );
      }
      if (stamped.changed.length === 0) {
        notes.push(
          `the card already carried every field this dispatch stamps (${Object.keys(stamp).join(", ")}), ` +
            "so no stamp commit was made and the lane is cut at the integration tip.",
        );
      } else {
        io.write(plan.cardFile, stamped.text);
        const message = `${plan.taskId}: dispatch stamp — ${Object.entries(stamp)
          .map(([k, v]) => `${k}: ${v === "" ? "(empty)" : v}`)
          .join(", ")}`;
        // THE PATHSPEC IS LOAD-BEARING. The integration checkout is shared
        // with a human running the app (docs/CONVENTIONS.md), so a commit
        // that swept up whatever else was in the tree would be this arm
        // taking somebody else's work with it.
        const commit = ["git", "-C", plan.root, "commit", "--quiet", "-m", message, "--", plan.card];
        const r = io.run(commit, { cwd: plan.root });
        if (r.status !== 0) {
          return stopAt(step, spellCommand(commit), r.status, r.stderr.trim());
        }
      }
      const headArgv = ["git", "-C", plan.root, "rev-parse", "HEAD"];
      const head = io.run(headArgv, { cwd: plan.root });
      if (head.status !== 0) {
        return stopAt(step, spellCommand(headArgv), head.status, head.stderr.trim());
      }
      base = head.stdout.trim();
      // READ IT BACK OUT OF THE COMMIT. A stamp that wrote nothing exits 0
      // exactly like one that wrote everything, which is why this is a
      // step and not a comment.
      const showArgv = ["git", "-C", plan.root, "show", `${base}:${plan.card}`];
      const shown = io.run(showArgv, { cwd: plan.root });
      if (shown.status !== 0) {
        return stopAt(step, spellCommand(showArgv), shown.status, shown.stderr.trim());
      }
      // THE CARD AS THE COMMIT CARRIES IT IS WHAT PHASE 1 IS RENDERED
      // FROM, and it is taken HERE rather than at the phase 1 step: this
      // read is of the stamp commit, before any lane branch exists, which
      // is exactly the blindness bound orchestrator 5d names.
      cardAtBase = shown.stdout;
      const wrong = stampVerdict(shown.stdout, stamp);
      if (wrong.length > 0) {
        return stopAt(
          step,
          spellCommand(showArgv),
          EXIT.FOUND,
          `the commit does not carry the stamp: ${wrong.join("; ")}. The lane inherits its stamp ` +
            "in its BASE (orchestrator 5b), so a lane cut here would be cut from a card the board " +
            "still calls unstarted.",
        );
      }
      done.push({
        n: step.n,
        id: step.id,
        ran: spellCommand(showArgv),
        exit: EXIT.CLEAN,
        detail: `${plan.card} carries ${Object.entries(stamp).map(([k, v]) => `${k}: ${v}`).join(", ")} at ${base}`,
      });
      continue;
    }

    if (step.id === "cut" || step.id === "bench") {
      const lane = step.id === "cut";
      // ── THE BENCH IS NOT OWED AT THE BOUNDED TIER (T-320) ──────────
      // **AND THE SKIP IS SAID OUT LOUD, exactly as the phase-one skip
      // above is.** The bounded contract takes no verifier at all
      // (method/tasks/TASK-FORMAT.md, The tier), so the bench — a
      // detached worktree cut for a verifier who is never spawned — is a
      // directory nobody opens and a second checkout of this tree for
      // everything that walks it. A bench cut for a bounded card and a
      // bench nobody cut look identical afterwards, which is why this is
      // a NOTE and a ledger row rather than a silence.
      if (!lane && tier === "bounded") {
        const why =
          "the bounded tier takes no verifier at all (method/tasks/TASK-FORMAT.md, The tier), so " +
          "there is nobody for a bench to be cut for";
        notes.push(
          `no bench was cut and none is owed — ${why}. Said out loud, because a worktree this arm ` +
            "skipped on purpose and one it forgot look the same on disk.",
        );
        done.push({
          n: step.n,
          id: step.id,
          ran: `cut ${plan.bench}`,
          exit: EXIT.CLEAN,
          detail: `not owed — ${why}`,
        });
        continue;
      }
      const argv = lane
        ? plan.createArgv.map((a) => (a === BASE_TOKEN ? base : a))
        : ["git", "-C", plan.root, "worktree", "add", "--detach", plan.bench, base];
      const r = io.run(argv, { cwd: plan.root });
      if (r.status !== 0) {
        return stopAt(step, spellCommand(argv), r.status, r.stderr.trim());
      }
      cut.push({ path: lane ? plan.worktree : plan.bench, branch: lane ? plan.branchName : "" });
      done.push({
        n: step.n,
        id: step.id,
        ran: spellCommand(argv),
        exit: EXIT.CLEAN,
        detail: lane ? `${plan.worktree} on ${plan.branch}` : `${plan.bench}, detached at ${base}`,
      });
      continue;
    }

    if (step.id === "preflight" || step.id === "fence" || step.id === "brief") {
      const argv =
        step.id === "preflight"
          ? [process.execPath, BRIEF_CLI, "--task", plan.taskId, "--preflight", "--root", plan.root]
          : step.id === "fence"
            ? [process.execPath, BRIEF_CLI, "--task", plan.taskId, "--write-fence", plan.worktree, "--root", plan.root]
            : [process.execPath, BRIEF_CLI, "--task", plan.taskId, "--root", plan.root];
      const r = io.run(
        argv,
        step.id === "brief" ? { cwd: plan.root, out: plan.briefFile } : { cwd: plan.root },
      );
      // THE BRIEF STEP IS THE ONE THAT MAY ANSWER 1 AND STILL HAVE DONE ITS
      // JOB, and the difference is what the code MEANS: `FOUND` is
      // "assembled and found something", and the assembled brief is on
      // disk. It is ANNOUNCED rather than swallowed — the dispatcher reads
      // the findings before it spends a seat — where a `FOUND` preflight is
      // a card whose claims no longer hold and a `FOUND` fence is a
      // manifest that was not written.
      const ok = step.id === "brief" ? r.status === EXIT.CLEAN || r.status === EXIT.FOUND : r.status === EXIT.CLEAN;
      if (!ok) {
        return stopAt(step, spellCommand(argv), r.status, r.stderr.trim());
      }
      if (step.id === "brief" && r.status === EXIT.FOUND) {
        notes.push(
          `the brief assembled and answered ${String(EXIT.FOUND)} — it found something the ` +
            "repository does not settle. The file is complete; read its findings before you spend " +
            `a seat on it: ${r.stderr.trim()}`,
        );
      }
      done.push({
        n: step.n,
        id: step.id,
        ran: spellCommand(argv),
        exit: r.status,
        detail: step.id === "brief" ? plan.briefFile : step.what,
      });
      continue;
    }

    if (step.id === "manifest") {
      const act = `read ${plan.manifestFile}`;
      /** @type {string} */
      let text;
      try {
        text = io.read(plan.manifestFile);
      } catch (err) {
        return stopAt(
          step,
          act,
          EXIT.FOUND,
          `the manifest the step before it was supposed to write is not there — ` +
            `${err instanceof Error ? err.message : String(err)}. A lane branch with no manifest ` +
            "is REFUSED every write by the hook, so this lane would be born unable to build.",
        );
      }
      const wrong = manifestVerdict(text, {
        taskId: plan.taskId,
        branch: plan.branch,
        worktree: plan.worktree,
        card: plan.card,
      });
      if (wrong.length > 0) {
        return stopAt(
          step,
          act,
          EXIT.FOUND,
          `the manifest does not govern this lane: ${wrong.join("; ")}. The hook reads that file ` +
            "and nothing else, so a manifest for another card is a fence nobody declared.",
        );
      }
      done.push({ n: step.n, id: step.id, ran: act, exit: EXIT.CLEAN, detail: plan.manifestFile });
      continue;
    }

    if (step.id === "port") {
      // THE ONE PROBE THE PORT BULLET ASKS FOR. `lsof` to zero rows before
      // binding: a derived port is still a MACHINE-scoped surface, and a
      // lane handed a port something already holds is the collision the
      // bullet exists to remove, arriving one step later.
      const argv = ["lsof", "-nP", `-iTCP:${String(plan.port)}`, "-sTCP:LISTEN"];
      const r = io.run(argv, { cwd: plan.root });
      if (r.status === -1) {
        return stopAt(step, spellCommand(argv), EXIT.CANNOT_RUN, r.stderr.trim());
      }
      const rows = r.stdout.split("\n").filter((l) => l.trim() !== "");
      if (rows.length > 0) {
        return stopAt(
          step,
          spellCommand(argv),
          EXIT.FOUND,
          `something already holds the port this card derives — ${rows.join(" / ")}. The lane's ` +
            "port is a function of the card number, so this is a machine to clear rather than a " +
            "number to change.",
        );
      }
      // THE ROWS ARE THE VERDICT AND `lsof`'s OWN EXIT IS NOT. It answers
      // 1 when nothing matches, which is exactly the case this step wants,
      // so recording that 1 as the step's code would print a refusal shape
      // over a clean probe. The probe's own exit goes in the detail, where
      // a reader can still see it.
      done.push({
        n: step.n,
        id: step.id,
        ran: spellCommand(argv),
        exit: EXIT.CLEAN,
        detail:
          `${plan.portVariable}=${String(plan.port)} is free (the probe itself exited ` +
          `${String(r.status)} over no rows), and the scratch stem is ${plan.scratchStem}`,
      });
      continue;
    }

    return stopAt(
      step,
      step.id,
      EXIT.CANNOT_RUN,
      "this ritual declares a step it does not perform, which is a second order of steps and " +
        "exactly the divergence DISPATCH_STEPS exists to prevent.",
    );
  }

  return { code: EXIT.CLEAN, done, stopped: undefined, findings, removed, base, notes };
}

/* ────────────────────────────────────────────────────────────────────
 * THE REPORT — the plan, the ledger and the block of lane facts.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * THE PLAN, PRINTED AND NOT PERFORMED. `<base>` stands where the commit
 * step one has not made yet would go: a dry run that named a hash would
 * be naming a commit that does not exist.
 *
 * @param {Ctx} ctx
 * @param {DispatchPlan} plan
 * @returns {Rec[]}
 */
export function dispatchPlanRecs(ctx, plan) {
  const t = treeProv(ctx.ref, "method/roles/orchestrator.md 5b and 5c, and CONVENTIONS' serial-ritual bullet");
  return [
    note("THE DISPATCH RITUAL, PLANNED AND NOT PERFORMED — the order below is the law, and the"),
    note("arm refuses at the first step that fails rather than leaving a lane half-armed"),
    ...plan.steps.map((s) => value(`step ${String(s.n)} — ${s.id}: ${s.what}`, t)),
    blank(),
    ...dispatchLaneRecs(ctx, plan, undefined),
    blank(),
    note("Nothing above was done. Re-run this invocation without the dry-run flag to perform it."),
  ];
}

/**
 * THE BLOCK OF LANE FACTS — the first acceptance criterion's own list, in
 * its own order, every figure derived and every one stamped.
 *
 * @param {Ctx} ctx
 * @param {DispatchPlan} plan
 * @param {DispatchResult | undefined} result
 * @returns {Rec[]}
 */
export function dispatchLaneRecs(ctx, plan, result) {
  const spelling = treeProv(ctx.ref, "docs/CONVENTIONS.md, the spellings this project publishes");
  const machine = liveProv(ctx.at, ctx.host, "the repository's own main worktree, from git worktree list --porcelain");
  const moving = liveProv(ctx.at, ctx.host, "git rev-parse HEAD in the integration checkout, after the stamp");
  return [
    note("THE LANE — every figure below is derived, and the card number is what derives them"),
    value(`task: ${plan.taskId}`, treeProv(ctx.ref, "the card named by this dispatch, and nothing else")),
    value(`branch: ${plan.branchName}`, spelling),
    value(`worktree: ${plan.worktree}`, machine),
    value(
      `base hash: ${result === undefined || result.base === "" ? BASE_TOKEN : result.base}`,
      moving,
    ),
    value(`bench: ${plan.bench}`, machine),
    value(
      `port: ${plan.portVariable}=${String(plan.port)}`,
      treeProv(ctx.ref, "docs/CONVENTIONS.md's E2E PORT bullet, with the card number substituted"),
    ),
    value(
      `scratch stem: ${plan.scratchStem}`,
      treeProv(ctx.ref, "docs/CONVENTIONS.md's SCRATCH RULE bullet, with the card id substituted"),
    ),
    value(
      `brief path: ${plan.briefFile}`,
      liveProv(
        ctx.at,
        ctx.host,
        "the scratch directory this dispatch was given, with the SCRATCH RULE's own file name in it",
      ),
    ),
    value(
      `tier: ${
        result === undefined
          ? "<derived at the tier step, from the card and the tree>"
          : (result.done.find((s) => s.id === "tier")?.detail ?? "<not reached>")
      }`,
      treeProv(
        ctx.ref,
        "the card's size and fence against method/tasks/TASK-FORMAT.md's guard-class list, mapped by docs/CONVENTIONS.md",
      ),
    ),
    // THE MODEL PER SEAT (T-298), beside the lane facts rather than inside
    // the ledger: it is a property of the DISPATCH and it is true on a dry
    // run, where no step has been performed and there is no ledger yet.
    ...plan.models.map((m) =>
      value(
        `model (${m.field}): ${m.model}` +
          (m.overridden
            ? ` — THIS DISPATCH NAMED IT; the template's default for roles.${m.key} is ${m.fromTemplate}`
            : ` — read from ${RUNTIME_TEMPLATE} as roles.${m.key}`),
        treeProv(ctx.ref, `${RUNTIME_TEMPLATE}, its roles block (ADR-024 decision 5)`),
      ),
    ),
    value(
      `phase 1 brief: ${plan.phase1File}`,
      liveProv(
        ctx.at,
        ctx.host,
        "the scratch directory this dispatch was given, with the SCRATCH RULE's own file name in it",
      ),
    ),
    // THE ADMISSION THIS CUT WAS MADE UNDER (T-324), and it is printed on
    // a dry run exactly as it is on a performed one: it is a property of
    // the DISPATCH, refused before the ritual writes anything, and a
    // reader of a dry run is the reader most in need of seeing it.
    ...admissionRecs(ctx, plan.grant, plan.admission),
  ];
}

/**
 * THE LEDGER — what each step ran and what it answered, printed on a
 * refusal AND on a clean run. A ritual whose steps are only visible when
 * it fails is one nobody can check while it works.
 *
 * @param {Ctx} ctx
 * @param {DispatchResult} result
 * @returns {Rec[]}
 */
export function dispatchLedgerRecs(ctx, result) {
  const p = liveProv(ctx.at, ctx.host, "this ritual's own steps, in the order DISPATCH_STEPS fixes");
  /** @type {Rec[]} */
  const recs = [note("THE RITUAL, STEP BY STEP — each with the command it ran and the exit it got")];
  for (const s of result.done) {
    recs.push(value(`step ${String(s.n)} ${s.id}: exit ${String(s.exit)} — ${s.ran}`, p));
  }
  if (result.stopped !== undefined) {
    const s = result.stopped;
    recs.push(
      value(`step ${String(s.n)} ${s.id}: REFUSED at exit ${String(s.exit)} — ${s.ran}`, p),
      value(`  ${s.detail}`, p),
    );
    const later = DISPATCH_STEPS.filter((d) => d.n > s.n);
    for (const d of later) {
      recs.push(value(`step ${String(d.n)} ${d.id}: NOT ATTEMPTED — ${d.what}`, p));
    }
  }
  for (const gone of result.removed) {
    recs.push(value(`removed the worktree this run cut: ${gone}`, p));
  }
  for (const n of result.notes) recs.push(value(n, p));
  return recs;
}

/* ────────────────────────────────────────────────────────────────────
 * ARM THIRTEEN — THE ADMISSION LIFECYCLE (T-324).
 *
 * **AN ADMISSION IS THE MOMENT THIS LOOP SPENDS SOMEBODY'S APPROVAL, AND
 * UNTIL THIS CARD THERE WAS NO SUCH MOMENT.** T-319 landed the dispatch
 * block as readable configuration: the owner's grant, the cards it
 * approves, the blob of each card AT the yes, the mode the approval runs
 * under and whether repairs may follow. Nothing read it. `--dispatch-lane`
 * cut a lane, `startRun` reserved a resource, `continueRun` reconciled a
 * previous execution, and not one of the three asked whether the work had
 * been approved — so a lane could be cut, a pause recorded in chat, and a
 * start or a re-entry still follow.
 *
 * ── THE FOUR BOUNDARIES, AND THEY ARE THE WHOLE SURFACE ──────────────
 * The lane cut (`dispatchLanePlan`), a child start (`startRun`), a
 * re-entry or continuation (`continueRun`) and a replacement writer
 * (`continueRun` with `--replace`). The grant is RE-READ at every one of
 * them, because an approval read once at the cut is an approval a
 * revocation four hours later cannot reach.
 *
 * ── THE TWO KINDS, AND THE SECOND ONE IS WHY THIS IS NOT A LIST CHECK ─
 * An EXPLICIT admission is of a card the grant NAMES: it binds to the
 * grant's revision and to the card's approved blob, and a mechanical
 * append to the card — a status stamp, a notes or verdicts append, a
 * filed follow-up line — does not break the binding, because the loop's
 * own ceremony writes those onto a card between the yes and the build.
 * A DERIVED admission is of a REPAIR the recovery policy allows: it binds
 * to its parent authorized work, to the failure evidence, to the PARENT
 * grant's revision and to the repair card's own blob at its filing. It
 * needs no owner round trip and it MINTS NO GRANT — it inherits the
 * parent's authorization, which is the difference between a repair and a
 * second approval nobody gave. **A REPAIR'S DESCRIPTION ESTABLISHES
 * NOTHING**: what admits it is the parent and the evidence, and a scope
 * change re-evaluates it from the beginning.
 *
 * ── THE LEDGER IS THE RUN RECORDS AND THERE IS NO SECOND ONE ─────────
 * What has been admitted is derived from `.supertaskr/runs/` — the
 * records T-311 already writes, each carrying the admission it was
 * started under. A consumption table of its own would be a second
 * ownership ledger, which the card forbids in as many words, and the two
 * would disagree the first time one of them was written and the other was
 * not.
 *
 * ── THE PAUSE IS A RECORD, NOT A ROW OF THE BLOCK, AND THAT IS RULED ──
 * The schema's `dispatch_block:` declaration carries no `pause` field and
 * the parser's reader answers each field BY NAME, so a pause row added to
 * the declaration would be a control the reader never returns — which is
 * exactly what this card's fifth criterion forbids ("so no control
 * silently does nothing"). The pause is therefore an owner-written record
 * in the runtime directory beside T-238's holder record, read here; the
 * GRANT is read through the parser's reader and through nothing else.
 *
 * ── WHAT THE ARM CANNOT CHECK, SAID OUT LOUD RATHER THAN IMPLIED ─────
 * Whether a repair is really inside the approved scope, whether an
 * integrity problem went unreported, and what a provider's live usage
 * actually is. Those are the COORDINATOR'S obligations; this arm names
 * them in its own report so that a reader never mistakes the refusals it
 * DOES perform for the whole of the promise.
 * ──────────────────────────────────────────────────────────────────── */

/** The four moments an admission is made, and there is no fifth. */
export const ADMISSION_BOUNDARIES = Object.freeze(["lane-cut", "child-start", "re-entry", "replacement"]);

/** The two kinds of admission the card separates. */
export const ADMISSION_KINDS = Object.freeze(["explicit", "derived"]);

/**
 * THE PHASE A BOUNDARY SERVES, which is what a `new-work` pause
 * discriminates on. Implementation is the CONSERVATIVE answer for a role
 * this arm does not know, because the cost of being wrong that way is a
 * spawn and the cost of being wrong the other way is work nobody approved.
 */
export const ADMISSION_PHASES = Object.freeze(["implementation", "verification", "integration"]);

/** The two scopes a recorded pause may carry. */
export const PAUSE_SCOPES = Object.freeze(["new-work", "all"]);

/** Where an owner-written pause lives, beside T-238's holder record. */
export const PAUSE_REL_PATH = `${RUNTIME_DIR}/pause.json`;

/** The record format this reader knows; a record declaring another is refused. */
export const PAUSE_VERSION = 1;

/**
 * THE SCOPE A DERIVED ADMISSION DECLARES FOR ITSELF, and two of the three
 * are refusals under every recovery policy: a repair that is really a
 * product-scope change, and a repair whose delivery is a verification
 * somebody waived.
 */
export const DERIVED_SCOPES = Object.freeze(["repair", "product-change", "waived-verification"]);

/**
 * THE FRONTMATTER KEYS THE LOOP'S OWN CEREMONY WRITES ONTO A CARD AFTER
 * THE YES. A change confined to these is the mechanical append the card's
 * first criterion allows; a change to any other key is a different card.
 */
export const MECHANICAL_FIELDS = Object.freeze([
  "status",
  "tier",
  "builder",
  "verifier",
  "built_by",
  "verified_by",
]);

/**
 * THE CARD SECTION THIS LOOP'S OWN CEREMONY WRITES A REPAIR LEDGER UNDER
 * (T-322). It is declared HERE, above the mechanical-append set that
 * reads it, rather than in the unattended section it otherwise belongs
 * to: `MECHANICAL_SECTIONS` is built at module load and a constant
 * declared later would be in its temporal dead zone.
 */
export const REPAIR_LEDGER_HEADING = "Repair ledger";

/**
 * The sections of a card a mechanical append may add lines to.
 *
 * **THE THIRD ONE IS T-322's AND IT IS NOT A WIDENING OF THE ESCAPE
 * HATCH.** A repair ledger entry is written by the LOOP after the yes,
 * on exactly the argument the other two ride on — it is the loop's own
 * ceremony rather than a change to what the owner approved. Without it,
 * a coordinator that recorded a failed repair on an approved card would
 * refuse that card's next admission as `ADMISSION_CARD_BLOB_MOVED`: the
 * record the progress rule requires would cost the card its approval.
 */
export const MECHANICAL_SECTIONS = Object.freeze([
  "Implementation notes",
  "Verdicts",
  REPAIR_LEDGER_HEADING,
]);

/** A filed follow-up card's id, the one addition allowed anywhere in a card. */
export const FOLLOW_UP_PATTERN = /\bT-\d+-s\d+\b/;

/**
 * EVERY REFUSAL CARRIES A CODE — a stable, greppable name for WHY, on
 * `run-record.mjs`'s own model, because a refusal a caller can only match
 * on a sentence becomes prose the day the sentence is improved.
 */
export const ADMISSION_CODES = Object.freeze({
  BOUNDARY: "ADMISSION_BOUNDARY",
  KIND: "ADMISSION_KIND",
  SCOPE: "ADMISSION_SCOPE",
  NO_CARD: "ADMISSION_NO_CARD",
  NO_CURRENT_GRANT: "ADMISSION_NO_CURRENT_GRANT",
  UNKNOWN_MODE: "ADMISSION_UNKNOWN_MODE",
  UNKNOWN_RECOVERY: "ADMISSION_UNKNOWN_RECOVERY",
  PAUSED_NEW_WORK: "ADMISSION_PAUSED_NEW_WORK",
  PAUSED_ALL: "ADMISSION_PAUSED_ALL",
  CARD_NOT_APPROVED: "ADMISSION_CARD_NOT_APPROVED",
  CARD_BLOB_MOVED: "ADMISSION_CARD_BLOB_MOVED",
  APPROVAL_CONSUMED: "ADMISSION_APPROVAL_CONSUMED",
  UNTIL_ENDPOINT: "ADMISSION_UNTIL_ENDPOINT",
  RECOVERY_NONE: "ADMISSION_RECOVERY_NONE",
  DERIVED_NO_PARENT: "ADMISSION_DERIVED_NO_PARENT",
  DERIVED_NO_EVIDENCE: "ADMISSION_DERIVED_NO_EVIDENCE",
  DERIVED_OUT_OF_SCOPE: "ADMISSION_DERIVED_OUT_OF_SCOPE",
  CONSULTATION_WRITER: "ADMISSION_CONSULTATION_WRITER",
});

/** An admission this arm was asked for and will not make. */
export class AdmissionFinding extends DispatchLaneFinding {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = "AdmissionFinding";
    /** @type {string} */
    this.code = code;
  }
}

/**
 * @typedef {object} Pause
 * @property {string} at     the ISO instant the pause was recorded
 * @property {string} by     who recorded it, as the record names them
 * @property {string} scope  one of PAUSE_SCOPES
 * @property {string} why    the sentence the record carries, or ""
 * @property {string} file   where it was read from
 */

/**
 * @typedef {object} GrantState
 * @property {boolean} enforced   whether this checkout carries a grant to enforce
 * @property {import("../../../lib/parser/dist/pure.js").DispatchBlock | null} block
 * @property {?Pause} pause
 * @property {string} approval
 * @property {string} recovery
 * @property {number} revision
 * @property {string} source      where the grant was read from, or why there is none
 * @property {GrantStoreRead} store  the operational store's own answer (T-344)
 * @property {string} stray       a block left in the runtime template, reported and never obeyed
 */

/**
 * @typedef {object} AdmissionRequest
 * @property {string} boundary       one of ADMISSION_BOUNDARIES
 * @property {string} kind           one of ADMISSION_KINDS
 * @property {string} card           the card this admission is for
 * @property {string} [work]         `card` (the default) or `consultation`
 * @property {string} [role]         the seat's role, which decides the phase
 * @property {string} [phase]        one of ADMISSION_PHASES, where the caller knows it
 * @property {string} [blob]         the card file's blob sha NOW
 * @property {string} [cardText]     the card as it stands, for the mechanical-append reading
 * @property {(sha: string) => ?string} [approvedText]  the card at the blob the grant approved
 * @property {string} [parent]       a derived admission's parent authorized card
 * @property {string} [evidence]     a derived admission's failure evidence
 * @property {string} [scope]        a derived admission's own scope, one of DERIVED_SCOPES
 * @property {string} [attempt]      the attempt this admission binds to
 * @property {?string} [resource]    the resource whose reservation binds it, or null at the lane cut
 * @property {Map<string, string>} [board]  card id -> its status, for the until endpoint
 */

/**
 * @typedef {object} Admission
 * @property {boolean} admitted
 * @property {string} kind        explicit, derived, or unenforced
 * @property {string} boundary
 * @property {string} card
 * @property {string} phase
 * @property {string} code        the refusal's code, and "" when admitted
 * @property {string} why         one sentence a reader can act on
 * @property {number} revision    the grant revision this admission binds to, 0 under no grant
 * @property {string} blob        the card blob this admission binds to, "" under no grant
 * @property {?string} parent     a derived admission's parent, null otherwise
 * @property {string} evidence    a derived admission's failure evidence digest, "" otherwise
 * @property {boolean} consumed   whether this admission SPENT an approval rather than re-presenting one
 * @property {?string} reuses     the attempt whose admission this re-presents, or null
 * @property {?string} resource   the resource whose reservation binds it, or null
 * @property {string[]} drift     the mechanical appends the card carries since the yes
 * @property {string[]} advisory  the limits, read and NOT enforced
 * @property {string[]} obligations the coordinator's, which this arm cannot check
 */

/**
 * @typedef {object} AdmissionEntry
 * @property {string} card
 * @property {string} attempt
 * @property {string} kind
 * @property {number} revision
 * @property {string} blob
 * @property {?string} parent
 * @property {string} evidence
 * @property {string} state
 * @property {boolean} terminal
 * @property {?string} resource
 */

/**
 * THE PAUSE, READ — or a refusal naming what is wrong with the record.
 *
 * **AN UNREADABLE PAUSE IS NEVER "NO PAUSE".** A record somebody wrote
 * and this reader cannot parse is the one case where guessing costs the
 * most: the owner asked the loop to stop and the loop would carry on. So
 * a malformed record REFUSES, and only a record that is not there at all
 * answers "nothing is paused".
 *
 * @param {string} root
 * @returns {?Pause}
 */
export function readPause(root = repoRoot) {
  const file = path.join(root, PAUSE_REL_PATH);
  if (!existsSync(file)) return null;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new AdmissionFinding(
      ADMISSION_CODES.SCOPE,
      `dispatch-brief: the pause record at ${PAUSE_REL_PATH} did not parse as JSON ` +
        `(${err instanceof Error ? err.message : String(err)}). A pause this reader cannot read is ` +
        "not the same thing as no pause: the owner asked the loop to stop, and an unreadable " +
        "record read as silence is the loop carrying on anyway.",
    );
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new AdmissionFinding(
      ADMISSION_CODES.SCOPE,
      `dispatch-brief: the pause record at ${PAUSE_REL_PATH} is not a JSON object.`,
    );
  }
  const rec = /** @type {Record<string, unknown>} */ (parsed);
  const version = Number(rec["version"] ?? 0);
  if (version !== PAUSE_VERSION) {
    throw new AdmissionFinding(
      ADMISSION_CODES.SCOPE,
      `dispatch-brief: the pause record at ${PAUSE_REL_PATH} declares version ${String(version)} ` +
        `and this reader knows ${String(PAUSE_VERSION)}. A record shaped for a different reader is ` +
        "refused rather than half-read.",
    );
  }
  const scope = String(rec["scope"] ?? "").trim();
  if (!PAUSE_SCOPES.includes(scope)) {
    throw new AdmissionFinding(
      ADMISSION_CODES.SCOPE,
      `dispatch-brief: the pause record at ${PAUSE_REL_PATH} carries scope ` +
        `${JSON.stringify(scope)}, which is not one of ${PAUSE_SCOPES.join(", ")}. The scope is ` +
        "what says whether the verification of a candidate already admitted may finish, so a " +
        "word this reader does not know decides nothing.",
    );
  }
  const by = String(rec["by"] ?? "").trim();
  const at = String(rec["at"] ?? "").trim();
  if (by === "" || at === "") {
    throw new AdmissionFinding(
      ADMISSION_CODES.SCOPE,
      `dispatch-brief: the pause record at ${PAUSE_REL_PATH} carries no ${by === "" ? "by" : "at"}. ` +
        "A pause is an owner's act and the record says whose and when — it needs no second " +
        "approval to be READ, which is precisely why it has to say who issued it.",
    );
  }
  return { at, by, scope, why: String(rec["why"] ?? "").trim(), file: PAUSE_REL_PATH };
}

/* ────────────────────────────────────────────────────────────────────
 * THE OPERATIONAL GRANT STORE (T-344).
 *
 * ── WHY THE GRANT LEFT THE TEMPLATE ─────────────────────────────────
 * `method/runtime/supertaskr.yaml` is a genuine CODE INPUT: the parser's
 * settings reader declares it, end-to-end bodies read it and the Rust
 * kit embeds it at compile time. So recording that the owner approved
 * one more card cost the same publication a code change costs — four
 * suites and a runner cycle — and the generated kit carried this
 * project's own authorization into every project it scaffolds. The
 * datum therefore LEAVES the publication path rather than the path
 * acquiring a bypass: the store is untracked, local, and belongs to the
 * ONE checkout that coordinates dispatch.
 *
 * ── TWO OBJECTS WITH TWO JOBS, AND THE SPLIT IS THE POINT ───────────
 * `dispatch-grant.yaml` is the CURRENT authorization, self-contained,
 * validated on every read through the parser's own `dispatchBlock`.
 * `dispatch-grant-history.jsonl` is the JOURNAL of SUPERSEDED
 * revisions, one per line, appended in constant time, and opened ONLY
 * for an explicit historical query or a recovery. Every routine path —
 * the loop's start, an admission, a display — opens the snapshot and
 * nothing else, so accumulated history costs a reader nothing.
 *
 * **THE JOURNAL IS NOT AUTHORITATIVE AND CANNOT BE.** It holds the
 * revisions that were SUPERSEDED; the grant last in force is the one
 * the snapshot carries, so reconstructing authority from the journal's
 * last entry would restore the grant BEFORE the one that was current.
 * A missing snapshot after prior use is therefore a REFUSAL pending an
 * explicit recovery, never a silent restoration and never "no grant".
 *
 * ── AN UNVERIFIABLE GRANT IS CLOSER TO NO GRANT THAN TO AN APPROVED ONE
 * The pause record beside this one already holds the strongest sentence
 * in either reader: an unreadable record is never "nothing is paused".
 * The same rule governs here. Reading the store from a lane worktree, a
 * detached checkout or any path that is not the designated one is
 * answered with a refusal that NAMES the location and why it is not the
 * one — never with a silent no-grant, and never with a guess. A worker
 * lane holds no grant of its own: what reaches it is the admission the
 * coordinator already decided, and `dispatchLanePlan` takes that
 * admission as an input for exactly this reason.
 *
 * ── DEFERRED, EXPLICITLY AND NOT BY OMISSION (the owner's ruling) ────
 * Transfer of authority between hosts, and reconciliation of competing
 * grant histories. Neither is built. Where either would be needed the
 * answer is the refusal above, so the gap is VISIBLE rather than
 * silently filled: the snapshot records the host it was written on and
 * a reader on another refuses by name.
 *
 * ── WHAT IS REUSED, AND WHAT WAS CHECKED BEFORE IT WAS RELIED ON ─────
 * VALIDATION is the parser library's `dispatchBlock` — the same reader
 * the template's block went through, reached through nothing else.
 * ATOMIC PUBLICATION is `writeFileAtomic` below: this repository's only
 * atomic-replace helper is `write_atomic` in the agent kit and it is
 * RUST, so a small one is written here rather than shelling into a
 * binary to satisfy a reuse criterion; that helper establishes atomic
 * publication only, and none of this card's locking, acknowledgement or
 * retry obligations. LOCKING is `open(O_EXCL)`, the pattern
 * `run-record.mjs` establishes in this tree — reached by writing the
 * one line rather than by importing that module, which imports THIS
 * file and would close a cycle nobody could see from either end.
 * `gate-run.mjs`'s `acquireSolo` was READ before it was passed over: it
 * is a check-then-write, so two writers can both pass its check, which
 * is the precise race this card's third criterion forbids.
 *
 * ── THE EXTENSION POINT, AND WHAT A LATER CARD WOULD ADD ─────────────
 * `updateGrantStore` is the compare-append-publish path, and its parts —
 * the relative paths, the format number, the validator and the content
 * extractor — are held apart as named constants and named functions
 * rather than inlined into it, which is what a second operational datum
 * would take up. IT IS NOT PARAMETERISED TODAY AND THIS COMMENT WILL NOT
 * PRETEND IT IS: a second datum still has to lift those four into a
 * descriptor the path accepts, and that lift is the successor card's
 * work rather than machinery this one grew ahead of a second user. This
 * card builds no general operational-record framework and migrates no
 * second datum: the role model and effort selections in the template
 * would need a descriptor of their own, a reader that resolves them at
 * the designated checkout with a fallback for the projects the kit
 * scaffolds, and their own card.
 * ──────────────────────────────────────────────────────────────────── */

/** The CURRENT authorization's own file, beside the pause record. */
export const GRANT_STORE_REL_PATH = `${RUNTIME_DIR}/dispatch-grant.yaml`;

/** The SUPERSEDED revisions, one JSON object per line. */
export const GRANT_JOURNAL_REL_PATH = `${RUNTIME_DIR}/dispatch-grant-history.jsonl`;

/** The immediately superseded snapshot, retained whole so the journal is not the only copy. */
export const GRANT_SUPERSEDED_REL_PATH = `${RUNTIME_DIR}/dispatch-grant.superseded.yaml`;

/** The exclusive lock every writer takes BEFORE it compares anything. */
export const GRANT_LOCK_REL_PATH = `${RUNTIME_DIR}/dispatch-grant.lock`;

/**
 * THE PRIOR-USE MARKER: this checkout HAS HELD a store, whatever became
 * of the snapshot.
 *
 * A missing snapshot AFTER PRIOR USE is a LOST authorization and not a
 * fresh project, and that difference is the whole of this card's eighth
 * criterion. The journal and the retained superseded snapshot are
 * evidence of prior use — but a store that was CREATED and never revised
 * has neither, so a checkout that lost its FIRST grant read as one that
 * had never held one, and a creation there would mint authority over an
 * approval somebody had already been given. The marker is written by the
 * creation itself, so the evidence exists from the first grant rather
 * than from the second. It is STAT'D and never opened, like the journal
 * beside it.
 */
export const GRANT_USED_REL_PATH = `${RUNTIME_DIR}/dispatch-grant.used`;

/** The snapshot format this reader knows; a snapshot declaring another is refused. */
export const GRANT_STORE_FORMAT = 1;

/** The block key the snapshot carries, which is the key the parser's reader answers. */
export const GRANT_BLOCK_KEY = "dispatch";

/**
 * EVERY REFUSAL CARRIES A CODE, on the admission arm's own model — a
 * greppable name for WHY, because a refusal a caller can only match on a
 * sentence becomes prose the day the sentence is improved.
 */
export const GRANT_STORE_CODES = Object.freeze({
  NO_ROOT: "GRANT_STORE_NO_ROOT",
  NOT_DESIGNATED: "GRANT_STORE_NOT_DESIGNATED",
  MISSING_AFTER_USE: "GRANT_STORE_MISSING_AFTER_USE",
  UNREADABLE: "GRANT_STORE_UNREADABLE",
  METADATA: "GRANT_STORE_METADATA",
  FOREIGN_HOST: "GRANT_STORE_FOREIGN_HOST",
  COMPETING_HISTORY: "GRANT_STORE_COMPETING_HISTORY",
  LOCKED: "GRANT_STORE_LOCKED",
  EXISTS: "GRANT_STORE_EXISTS",
  STALE: "GRANT_STORE_STALE",
  INVALID: "GRANT_STORE_INVALID",
  CONFLICT: "GRANT_STORE_CONFLICT",
});

/** A store operation this arm was asked for and will not perform. */
export class GrantStoreFinding extends DispatchLaneFinding {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = "GrantStoreFinding";
    /** @type {string} */
    this.code = code;
  }
}

/**
 * THE ROOT IS NAMED BY THE CALLER OR THE READ IS REFUSED (T-330's
 * lesson, this card's sixteenth criterion).
 *
 * T-330 was not a bug in a reader: the reader took a root and EIGHT CALL
 * SITES did not name one, so fixtures that were supposed to be
 * controlled read the live configuration anyway and thirty-five bodies
 * were decided by an approval nobody meant to put in front of them. A
 * default root here would rebuild that defect around a file this card
 * exists to make authoritative, so there is none — and the refusal says
 * which defect it is preventing rather than "missing argument".
 *
 * @param {unknown} root @param {string} what
 * @returns {string} the resolved root
 */
function namedRoot(root, what) {
  if (typeof root !== "string" || root.trim() === "") {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.NO_ROOT,
      `dispatch-brief: ${what} was called without naming a root. Every call site that reaches the ` +
        "operational grant store names the tree it is reading, because a defaulted root is how a " +
        "controlled fixture ends up decided by the live authorization (T-330): eight call sites " +
        "defaulted, and the day an owner's grant was recorded it judged thirty-five bodies that " +
        "were never about it.",
    );
  }
  try {
    return realpathSync(root);
  } catch {
    return path.resolve(root);
  }
}

/**
 * A GIT BLOB SHA, COMPUTED HERE AND NOT SPAWNED FOR.
 *
 * The same forty hex characters `git hash-object` gives, by the same
 * definition — sha1 over `blob <bytes>\0` and the content — so the store
 * and the grant compare without either side agreeing on a digest of its
 * own. It is computed in process because this card's FIRST criterion
 * makes the update path's quietness observable: a routine revision runs
 * no suite, writes no commit, pushes nothing and starts no CI, and the
 * fewer processes it starts the less there is to argue about.
 *
 * @param {string | Buffer} content
 * @returns {string}
 */
export function blobShaOf(content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(String(content), "utf8");
  return createHash("sha1")
    .update(Buffer.concat([Buffer.from(`blob ${String(bytes.length)}\0`, "utf8"), bytes]))
    .digest("hex");
}

/**
 * ATOMIC PUBLICATION: a reader meets the whole prior revision or the
 * whole new one and never a partial record.
 *
 * Temp sibling in the SAME directory (so the rename cannot cross a
 * filesystem and degrade into a copy), the bytes flushed to the device
 * before the rename, then the rename, then the DIRECTORY flushed so the
 * new name itself survives a power loss. A directory fsync is EPERM or
 * EINVAL on some platforms and that is not a failure of the write, so it
 * is attempted and its refusal ignored — the rename is already ordered
 * by the file's own flush.
 *
 * **EXCLUSIVE CREATION IS NOT ATOMIC PUBLICATION.** Creating the
 * destination with `wx` and then filling it in place still lets a reader
 * see a partial snapshot; the complete snapshot is published under the
 * same rename whether it is a creation or a replacement, and the
 * exclusivity of a creation is the LOCK's job below rather than the
 * destination's.
 *
 * @param {string} file @param {string} text
 */
export function writeFileAtomic(file, text) {
  const dir = path.dirname(file);
  mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.tmp-${String(process.pid)}-${randomBytes(6).toString("hex")}`);
  let fd = -1;
  try {
    fd = openSync(tmp, "wx", 0o600);
    writeSync(fd, text);
    fsyncSync(fd);
    closeSync(fd);
    fd = -1;
    renameSync(tmp, file);
  } finally {
    if (fd !== -1) {
      try {
        closeSync(fd);
      } catch {
        /* the throw that brought us here is the one worth reporting */
      }
    }
    rmSync(tmp, { force: true });
  }
  let dfd = -1;
  try {
    dfd = openSync(dir, "r");
    fsyncSync(dfd);
  } catch {
    /* a directory fsync is not available everywhere; the rename is still ordered */
  } finally {
    if (dfd !== -1) {
      try {
        closeSync(dfd);
      } catch {
        /* nothing left to do about it */
      }
    }
  }
}

/**
 * THE WRITER'S LOCK, AND IT GUARDS THE COMPARE AS WELL AS THE WRITE.
 *
 * `open(O_EXCL)` and not a check-then-write: the kernel decides which of
 * two racing writers gets the file, and the loser is told rather than
 * silently made second. This card's third criterion is explicit that the
 * expected-revision and expected-content comparisons happen UNDER this
 * lock — two writers must not both pass an earlier unprotected check and
 * then overwrite one another, which is exactly what a compare outside
 * the lock permits.
 *
 * A HOLDER THAT IS GONE IS RECLAIMED, because a crashed update must not
 * wedge the store forever; a holder that is ALIVE is refused and never
 * waited for, on the gate-runner's own argument that a reading taken
 * after a wait is a reading of the wait.
 *
 * @template T
 * @param {string} root @param {() => T} fn
 * @returns {T}
 */
export function withGrantStoreLock(root, fn) {
  const file = path.join(root, GRANT_LOCK_REL_PATH);
  // THE IGNORE FILE GOES IN BEFORE THE LOCK FILE, because the lock is
  // itself a file in the runtime directory and a directory nothing
  // ignores is a directory a wildcard `git add` stages.
  ensureRuntimeDirIgnored(root);
  let fd = -1;
  try {
    fd = openSync(file, "wx", 0o600);
  } catch (err) {
    if (!(err instanceof Error) || /** @type {NodeJS.ErrnoException} */ (err).code !== "EEXIST") throw err;
    let held = null;
    try {
      held = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      held = null;
    }
    const pid = held === null ? null : Number(held.pid);
    const alive = pid !== null && Number.isInteger(pid) && pid !== process.pid && isRecordablePid(pid) && pidIsAlive(pid);
    if (alive) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.LOCKED,
        `dispatch-brief: ${GRANT_LOCK_REL_PATH} is held by pid ${String(pid)} since ` +
          `${String(held?.at ?? "an instant it did not record")}. This lock guards the COMPARE as ` +
          "well as the write, so a second writer is refused rather than queued: two writers that " +
          "both passed an unprotected check would overwrite one another and the loser would never " +
          "learn it had lost.",
      );
    }
    // STALE: the holder is gone, and a crashed update must not wedge the
    // store. The reclaim is itself EXCLUSIVE — the unlink, then the same
    // `wx` — so of two processes that both find a dead holder exactly one
    // takes the lock and the other is TOLD it lost rather than meeting a
    // raw EEXIST it cannot classify.
    rmSync(file, { force: true });
    try {
      fd = openSync(file, "wx", 0o600);
    } catch (race) {
      if (!(race instanceof Error) || /** @type {NodeJS.ErrnoException} */ (race).code !== "EEXIST") throw race;
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.LOCKED,
        `dispatch-brief: ${GRANT_LOCK_REL_PATH} was reclaimed from a dead holder by another writer ` +
          "in the same instant, and this one lost the race. Nothing was compared and nothing was " +
          "written; run it again.",
      );
    }
  }
  try {
    writeSync(fd, `${JSON.stringify({ pid: process.pid, at: new Date().toISOString(), host: os.hostname() })}\n`);
    closeSync(fd);
    fd = -1;
    return fn();
  } finally {
    if (fd !== -1) {
      try {
        closeSync(fd);
      } catch {
        /* the finally below still removes the file */
      }
    }
    try {
      const held = JSON.parse(readFileSync(file, "utf8"));
      if (Number(held.pid) === process.pid) rmSync(file, { force: true });
    } catch {
      rmSync(file, { force: true });
    }
  }
}

/** Is a pid alive? `kill -0` semantics; EPERM means alive-but-not-ours. @param {number} pid @returns {boolean} */
function pidIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return Boolean(e) && /** @type {NodeJS.ErrnoException} */ (e).code === "EPERM";
  }
}

/**
 * @typedef {object} StoreLocation
 * @property {boolean} designated whether this checkout may hold the store
 * @property {string} kind        checkout, linked-worktree, detached-head or task-branch
 * @property {string} root        the resolved path this answer is about
 * @property {string} why         one sentence a reader can act on
 */

/**
 * WHICH KIND OF CHECKOUT THIS IS, DERIVED FROM GIT ITSELF.
 *
 * The three that are NOT the designated integration checkout are named
 * rather than lumped together, because the remedy differs: a lane
 * worktree asks its coordinator for the admission, a detached checkout
 * is a bench and reads nothing, and a task branch in a main worktree is
 * a checkout somebody moved. A tree that is not a git repository at all
 * is answered as an ordinary checkout — the store is a local file and a
 * project need not be versioned to hold one.
 *
 * @param {string} root @returns {StoreLocation}
 */
export function grantStoreLocation(root) {
  const at = namedRoot(root, "grantStoreLocation");
  /** @param {string[]} argv */
  const ask = (argv) => {
    const r = spawnSync("git", ["-C", at, ...argv], { encoding: "utf8" });
    return r.status === 0 ? String(r.stdout ?? "").trim() : null;
  };
  const gitDir = ask(["rev-parse", "--absolute-git-dir"]);
  if (gitDir === null) {
    return {
      designated: true,
      kind: "checkout",
      root: at,
      why: `${at} is not a git checkout, so no worktree or branch disqualifies it from holding the store`,
    };
  }
  const common = ask(["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  if (common !== null && path.resolve(common) !== path.resolve(gitDir)) {
    return {
      designated: false,
      kind: "linked-worktree",
      root: at,
      why:
        `${at} is a LINKED WORKTREE of ${path.dirname(path.resolve(common))} — a lane, not the ` +
        "designated integration checkout. A lane holds no grant of its own and consults none: what " +
        "reaches it is the admission the coordinator already decided, and a lane that read a store " +
        "here would be a second authorization nobody granted.",
    };
  }
  const branch = ask(["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (branch === null) {
    return {
      designated: false,
      kind: "detached-head",
      root: at,
      why:
        `${at} is at a DETACHED HEAD — a verifier bench or a checkout parked at a commit, not the ` +
        "designated integration checkout. A detached checkout is made and thrown away, so a grant " +
        "read there would be an authorization with no home.",
    };
  }
  if (/^task\//.test(branch)) {
    return {
      designated: false,
      kind: "task-branch",
      root: at,
      why:
        `${at} is on the task branch ${branch} — a lane's branch rather than the integration ` +
        "branch, so this checkout is not the designated integration checkout even though it is a " +
        "main worktree.",
    };
  }
  return {
    designated: true,
    kind: "checkout",
    root: at,
    why: `${at} is a main worktree on ${branch}, which may hold the designated store`,
  };
}

/**
 * THE SNAPSHOT'S OWN `store:` HEADER, READ.
 *
 * Deliberately NOT the parser's reader: the parser answers the
 * `dispatch:` block, whose declaration is the schema's and is not this
 * card's to widen. The header is the wrapper's own metadata — what
 * format these bytes are, which project and which checkout they belong
 * to, which host wrote them and at which revision — and this card's
 * requirement is that the wrapper VALIDATES it rather than inheriting
 * the block reader's permissive fallbacks. An absent operational store
 * is not a permissive state.
 *
 * @param {string} text @returns {Record<string, string>}
 */
export function grantStoreHeader(text) {
  /** @type {Record<string, string>} */
  const out = {};
  const lines = String(text).split(/\r?\n/);
  const at = lines.findIndex((l) => /^store:\s*(?:#.*)?$/.test(l));
  if (at === -1) return out;
  for (let i = at + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) break;
    const m = /^\s{2}([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (m === null) continue;
    const raw = String(m[2]).trim();
    const unquoted =
      raw.length >= 2 && ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
        ? raw.slice(1, -1)
        : raw;
    out[/** @type {string} */ (m[1])] = unquoted;
  }
  return out;
}

/**
 * THE AUTHORIZATION CONTENT OF A SNAPSHOT — the `dispatch:` block and
 * nothing above it.
 *
 * The content digest this card compares on is taken over THIS, never
 * over the whole file: the header carries the instant the snapshot was
 * written, so a retry of the identical intended state would hash
 * differently and the "already current" answer this card's tenth
 * criterion requires would be impossible to give.
 *
 * @param {string} text @returns {string} the block text, or "" where there is none
 */
export function grantBlockText(text) {
  const lines = String(text).split(/\r?\n/);
  const at = lines.findIndex((l) => new RegExp(`^${GRANT_BLOCK_KEY}:`).test(l));
  if (at === -1) return "";
  const out = [/** @type {string} */ (lines[at])];
  for (let i = at + 1; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (line.trim() !== "" && !/^\s/.test(line)) break;
    out.push(line);
  }
  return `${out.join("\n").replace(/\s+$/, "")}\n`;
}

/**
 * THE DIGEST THE COMPARE-AND-SET COMPARES ON, and it is of the CONTENT.
 *
 * A REVISION NUMBER ALONE IS NOT EVIDENCE that the state in force is the
 * one intended — this card's tenth criterion says so in as many words —
 * so what a retry matches on is these bytes and the revision together.
 *
 * @param {string} text @returns {string}
 */
export function grantDigest(text) {
  return createHash("sha256").update(grantBlockText(text), "utf8").digest("hex");
}

/**
 * @typedef {object} GrantStoreRead
 * @property {boolean} present    a snapshot was read
 * @property {boolean} priorUse   this checkout has held a store before
 * @property {string} text        the whole snapshot, "" when there is none
 * @property {string} digest      the content digest, "" when there is none
 * @property {Record<string, string>} header
 * @property {import("../../../lib/parser/dist/pure.js").DispatchBlock | null} block
 * @property {StoreLocation} location
 * @property {string} source      where this answer came from, in one sentence
 */

/**
 * THE CURRENT SNAPSHOT, AND ONLY THE CURRENT SNAPSHOT.
 *
 * This function opens `GRANT_STORE_REL_PATH`. It does not open the
 * journal, it does not print accumulated history and it has no code path
 * that reaches either — which is what makes this card's sixth criterion
 * checkable by observation rather than by reading the source: a journal
 * this process cannot read leaves every routine path working.
 *
 * WHAT IT REFUSES, AND WHY EACH REFUSAL IS NOT A "NO GRANT":
 *  - a location that is not the designated integration checkout;
 *  - a snapshot missing AFTER PRIOR USE (a journal or a retained
 *    superseded snapshot is the evidence of that use);
 *  - a snapshot that does not parse, or whose header is absent, of a
 *    format this reader does not know, or written for another project,
 *    another checkout or another host;
 *  - a header revision and a grant revision that disagree.
 * A checkout with NO snapshot and NO prior use is the one case that is
 * an answer rather than a refusal: a project that has never had a store
 * is a project with no grant, and the loop keeps running.
 *
 * @param {string} root @param {{ schemaText?: string }} [opts]
 * @returns {GrantStoreRead}
 */
export function readGrantStore(root, opts = {}) {
  const location = grantStoreLocation(namedRoot(root, "readGrantStore"));
  const at = location.root;
  if (!location.designated) {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.NOT_DESIGNATED,
      `dispatch-brief: the dispatch grant is NOT READABLE from here — ${location.why} This is a ` +
        'REFUSAL and not "no grant": an unverifiable grant is closer to no grant than to an ' +
        "approved one, and a reader that answered silence here would let work proceed on an " +
        "authorization nobody could show. Ask the coordinator at the designated integration " +
        "checkout for the admission.",
    );
  }
  const file = path.join(at, GRANT_STORE_REL_PATH);
  // THE JOURNAL IS STAT'D AND NEVER OPENED, and the distinction is the
  // whole of this line. Telling a project that has never had a store from
  // one whose snapshot has been LOST needs one bit — does any evidence of
  // prior use exist — and `existsSync` answers it without reading a byte
  // of accumulated history. The body that grades the snapshot-only rule
  // makes the journal unreadable with `chmod 000`, which stops `open(2)`
  // and leaves `stat(2)` working, so this line is exactly what that
  // demonstration permits and an open here would fail it.
  const usedBefore =
    existsSync(path.join(at, GRANT_USED_REL_PATH)) ||
    existsSync(path.join(at, GRANT_JOURNAL_REL_PATH)) ||
    existsSync(path.join(at, GRANT_SUPERSEDED_REL_PATH));
  if (!existsSync(file)) {
    if (usedBefore) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.MISSING_AFTER_USE,
        `dispatch-brief: ${GRANT_STORE_REL_PATH} is GONE and this checkout has held a store before ` +
          `— ${GRANT_JOURNAL_REL_PATH} or ${GRANT_SUPERSEDED_REL_PATH} is still here. That is not a ` +
          "fresh project and it is not the no-grant state: the current authorization has been lost " +
          "and this reader refuses pending an EXPLICIT recovery that names the intended grant. The " +
          "journal holds SUPERSEDED revisions, so restoring its last entry would restore the grant " +
          "BEFORE the one that was in force.",
      );
    }
    return {
      present: false,
      priorUse: false,
      text: "",
      digest: "",
      header: {},
      block: null,
      location,
      source:
        `${at} carries no ${GRANT_STORE_REL_PATH} and has never held one, so there is no grant — ` +
        "the explicit no-grant state, and no grant is ever created by guessing a person, an " +
        "instant or a past authorization",
    };
  }
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch (err) {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.UNREADABLE,
      `dispatch-brief: ${GRANT_STORE_REL_PATH} could not be read ` +
        `(${err instanceof Error ? err.message : String(err)}). A store this reader cannot read is ` +
        'not "no grant" — it is an authorization nobody can verify, and it refuses pending an ' +
        "explicit recovery.",
    );
  }
  const header = grantStoreHeader(text);
  /** @param {string} code @param {string} why */
  const refuse = (code, why) => {
    throw new GrantStoreFinding(code, `dispatch-brief: ${GRANT_STORE_REL_PATH} ${why}`);
  };
  if (Object.keys(header).length === 0) {
    refuse(
      GRANT_STORE_CODES.METADATA,
      "carries no `store:` header. The wrapper validates its own format, project, location and " +
        "host metadata and does NOT inherit the block reader's permissive fallbacks: a file that " +
        "does not say what it is, is not an operational store.",
    );
  }
  const format = Number(header["format"] ?? NaN);
  if (format !== GRANT_STORE_FORMAT) {
    refuse(
      GRANT_STORE_CODES.METADATA,
      `declares format ${String(header["format"] ?? "none")} and this reader knows ` +
        `${String(GRANT_STORE_FORMAT)}. A record shaped for a different reader is refused rather ` +
        "than half-read.",
    );
  }
  const project = String(header["project"] ?? "");
  if (project !== path.basename(at)) {
    refuse(
      GRANT_STORE_CODES.METADATA,
      `names the project ${JSON.stringify(project)} and this checkout is ` +
        `${JSON.stringify(path.basename(at))}. A grant carries the project it authorizes work in.`,
    );
  }
  const recorded = String(header["location"] ?? "");
  if (path.resolve(recorded) !== at) {
    refuse(
      GRANT_STORE_CODES.METADATA,
      `was written for the checkout ${JSON.stringify(recorded)} and is being read at ` +
        `${JSON.stringify(at)}. There is ONE authoritative store at ONE designated integration ` +
        "checkout, with no second copy and no synchronization between copies, so a store found " +
        "somewhere else is refused by name rather than adopted.",
    );
  }
  const host = String(header["host"] ?? "");
  if (host !== "" && host !== os.hostname()) {
    refuse(
      GRANT_STORE_CODES.FOREIGN_HOST,
      `was written on ${JSON.stringify(host)} and is being read on ${JSON.stringify(os.hostname())}. ` +
        "TRANSFER OF AUTHORITY BETWEEN HOSTS IS DEFERRED by the owner's ruling and is not built, so " +
        "the answer is this refusal rather than a silent adoption — the gap is visible rather than " +
        "quietly filled.",
    );
  }
  const schemaText = opts.schemaText ?? readSchemaText(at);
  if (schemaText === null) {
    refuse(
      GRANT_STORE_CODES.UNREADABLE,
      `cannot be validated: ${at} carries no ${PROCESS_SCHEMA}, and the block is read against its ` +
        "declaration or not at all.",
    );
  }
  const schema = parseProcessSchema(/** @type {string} */ (schemaText));
  if (schema.dispatch === null) {
    refuse(
      GRANT_STORE_CODES.UNREADABLE,
      `cannot be validated: ${PROCESS_SCHEMA} declares no dispatch block, so a grant has nothing to ` +
        "be validated against.",
    );
  }
  /** @type {import("../../../lib/parser/dist/pure.js").DispatchBlock} */
  let block;
  try {
    block = dispatchBlock(text, schema);
  } catch (err) {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.UNREADABLE,
      `dispatch-brief: ${GRANT_STORE_REL_PATH} did not validate through the parser library's own ` +
        `reader: ${err instanceof Error ? err.message : String(err)}. (The reader names the runtime ` +
        "template in its messages because that is the file its declaration was written for; the " +
        "bytes it refused are the store's.)",
    );
  }
  if (!block.present) {
    refuse(
      GRANT_STORE_CODES.METADATA,
      "carries a `store:` header and NO `dispatch:` block. An operational store with no grant " +
        "content is a file somebody emptied, which is a different thing from a project that has " +
        "never had one — and the second is answered by the store not being there at all.",
    );
  }
  const headerRevision = Number(header["revision"] ?? NaN);
  if (!Number.isInteger(headerRevision) || headerRevision !== (block.grant?.revision ?? -1)) {
    refuse(
      GRANT_STORE_CODES.METADATA,
      `declares revision ${String(header["revision"] ?? "none")} in its header and ` +
        `${String(block.grant?.revision ?? "none")} in its grant. The two are written by one act ` +
        "and a disagreement between them means the file was edited by something that did not " +
        "understand it.",
    );
  }
  return {
    present: true,
    priorUse: usedBefore,
    text,
    digest: grantDigest(text),
    header,
    block,
    location,
    source:
      `${GRANT_STORE_REL_PATH} at ${at}, the designated integration checkout — read through the ` +
      "parser library's own dispatchBlock, snapshot only, with the journal unopened",
  };
}

/**
 * The schema text at a root, or null. Held apart so the store reader and
 * the writer ask the same question of the same file.
 *
 * @param {string} root @returns {?string}
 */
function readSchemaText(root) {
  try {
    return readFileSync(path.join(root, PROCESS_SCHEMA), "utf8");
  } catch {
    return null;
  }
}

/**
 * THE TEMPLATE'S BLOCK, IF SOMEBODY LEFT ONE THERE — READ, REPORTED AND
 * NEVER AUTHORITY (this card's eighteenth criterion).
 *
 * The template stopped being the home of the active grant, and a block
 * still sitting in one is neither obeyed nor silently ignored: it is a
 * stray, and the arm says so wherever it prints the grant. Refusing on
 * it would stop a loop for a file that no longer decides anything;
 * ignoring it silently would leave a reader believing an approval was in
 * force somewhere.
 *
 * @param {string} root @returns {string} the sentence, or "" where the template carries none
 */
export function strayTemplateGrant(root) {
  const at = namedRoot(root, "strayTemplateGrant");
  let templateText = "";
  try {
    templateText = readFileSync(path.join(at, RUNTIME_TEMPLATE), "utf8");
  } catch {
    return "";
  }
  if (grantBlockText(templateText) === "") return "";
  return (
    `${RUNTIME_TEMPLATE} still carries a \`${GRANT_BLOCK_KEY}:\` block and it is NOT read as ` +
    `authority (T-344): the active grant lives in ${GRANT_STORE_REL_PATH} at the designated ` +
    "integration checkout, and a block in a shipped template would put this project's own " +
    "authorization into every kit generated from it. Remove it, or record it into the store."
  );
}

/**
 * @typedef {object} GrantJournalEntry
 * @property {number} format
 * @property {number} supersededRevision  the revision these bytes recorded
 * @property {number} supersededBy        the revision that replaced it
 * @property {string} supersededAt        the instant the replacement was written
 * @property {string} digest              the superseded content's digest
 * @property {string} snapshot            the superseded snapshot, whole
 */

/**
 * THE JOURNAL, OPENED — and this is the ONLY function in this file that
 * opens it.
 *
 * It is reached by an explicit historical query or a recovery and by
 * nothing else: not the loop's start, not an admission, not a display.
 * That is this card's sixth criterion, and keeping the open in one named
 * function is what makes it checkable — a journal whose bytes this
 * process cannot read leaves every other path working.
 *
 * A TORN FINAL LINE IS DETECTABLE AND IS REPORTED, NEVER SKIPPED. One
 * JSON object per line means an interrupted append damages exactly the
 * last line and the entries before it are whole, so the reader says
 * which line it could not read rather than quietly returning fewer
 * revisions than the file holds.
 *
 * @param {string} root
 * @returns {{ entries: GrantJournalEntry[], findings: string[], present: boolean }}
 */
export function readGrantJournal(root) {
  const at = namedRoot(root, "readGrantJournal");
  const file = path.join(at, GRANT_JOURNAL_REL_PATH);
  if (!existsSync(file)) return { entries: [], findings: [], present: false };
  const text = readFileSync(file, "utf8");
  /** @type {GrantJournalEntry[]} */
  const entries = [];
  /** @type {string[]} */
  const findings = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = /** @type {string} */ (lines[i]);
    if (line.trim() === "") continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      findings.push(
        `${GRANT_JOURNAL_REL_PATH} line ${String(i + 1)} did not parse ` +
          `(${err instanceof Error ? err.message : String(err)})` +
          (i === lines.length - 1 || lines.slice(i + 1).every((l) => l.trim() === "")
            ? " — it is the LAST line, which is the shape an interrupted append leaves and the " +
              "one a recovery can discard"
            : " — and it is NOT the last line, so this journal was damaged by something other " +
              "than an interrupted append"),
      );
      continue;
    }
    entries.push(/** @type {GrantJournalEntry} */ (parsed));
  }
  // COMPETING HISTORIES ARE NAMED RATHER THAN RECONCILED. Their
  // reconciliation is DEFERRED by the owner's ruling and is not built,
  // so two entries claiming to supersede one revision with different
  // bytes is reported as the refusal it is.
  /** @type {Map<number, string>} */
  const bySuperseded = new Map();
  for (const e of entries) {
    const rev = Number(e.supersededRevision);
    const seen = bySuperseded.get(rev);
    if (seen !== undefined && seen !== String(e.digest)) {
      findings.push(
        `${GRANT_JOURNAL_REL_PATH} carries TWO DIFFERENT records of revision ${String(rev)} being ` +
          "superseded. Reconciliation of competing grant histories is DEFERRED by the owner's " +
          "ruling and is not built here, so this is named rather than resolved.",
      );
    }
    bySuperseded.set(rev, String(e.digest));
  }
  return { entries, findings, present: true };
}

/** The journal's newest entry, read without walking the whole file. @param {string} root */
function newestJournalEntry(root) {
  const file = path.join(root, GRANT_JOURNAL_REL_PATH);
  if (!existsSync(file)) return null;
  const lines = readFileSync(file, "utf8").split("\n").filter((l) => l.trim() !== "");
  const last = lines[lines.length - 1];
  if (last === undefined) return null;
  try {
    return /** @type {GrantJournalEntry} */ (JSON.parse(last));
  } catch {
    return null;
  }
}

/**
 * THE SNAPSHOT, COMPOSED — the author's own block bytes under a header
 * this wrapper writes.
 *
 * The `dispatch:` block is carried VERBATIM from whatever the caller
 * handed in rather than re-serialised from a parsed value. A record of
 * an approval says what the owner said, and a round trip through a
 * writer would silently normalise the sentence that attributes it.
 *
 * @param {{ blockText: string, root: string, revision: number, writtenBy: string, at?: string, host?: string }} o
 * @returns {string}
 */
export function composeGrantSnapshot(o) {
  const block = grantBlockText(o.blockText);
  return [
    `# ${GRANT_STORE_REL_PATH} — THE ACTIVE DISPATCH GRANT (T-344).`,
    "#",
    "# WRITTEN BY A COMMAND AND NEVER BY HAND. It is UNTRACKED and local:",
    "# recording an approval is an operational act, not a code publication,",
    "# so this file runs no suite, makes no commit, pushes nothing and",
    "# starts no continuous-integration run. It belongs to THIS checkout —",
    "# the one designated to coordinate dispatch — and there is no second",
    "# copy and no synchronization between copies.",
    "#",
    "# The `dispatch:` block below is read through the parser library's own",
    "# `dispatchBlock`, validated against `method/runtime/process-schema.yaml`'s",
    "# `dispatch_block:` declaration. `history: []` is the compatibility",
    `# shape that declaration requires: the SUPERSEDED revisions live in`,
    `# ${GRANT_JOURNAL_REL_PATH}, which this file never loads.`,
    "store:",
    `  format: ${String(GRANT_STORE_FORMAT)}`,
    // QUOTED, AND THE LOCATION IS WHY. It is the field that must round
    // trip EXACTLY — a checkout path is the pin that keeps one store at
    // one checkout — and a path may carry a trailing space or a leading
    // quote that an unquoted scalar would lose or mis-read. The header
    // reader strips exactly one layer of quoting, the way the schema's
    // own scalars are read.
    `  project: ${JSON.stringify(path.basename(o.root))}`,
    `  location: ${JSON.stringify(o.root)}`,
    `  host: ${JSON.stringify(o.host ?? os.hostname())}`,
    `  revision: ${String(o.revision)}`,
    `  written_at: "${o.at ?? new Date().toISOString()}"`,
    `  written_by: ${JSON.stringify(o.writtenBy)}`,
    "",
    block.replace(/\s+$/, ""),
    "",
  ].join("\n");
}

/**
 * @typedef {object} GrantTreeIo
 * @property {(id: string) => ?string} cardFile     the card's repo-relative path, or null
 * @property {(rel: string) => ?string} currentBlob the card's blob sha NOW, or null
 * @property {(sha: string) => boolean} hasObject   whether this repository carries those bytes
 */

/**
 * THE BOARD, AS THE VALIDATION SEES IT — injectable, so a body can drive
 * every refusal without this project's own git objects.
 *
 * The blob sha is computed IN PROCESS rather than spawned for; git is
 * asked ONLY when a card has moved since its approval, which is the one
 * question a file on disk cannot answer.
 *
 * @param {string} root @returns {GrantTreeIo}
 */
export function defaultGrantTreeIo(root) {
  const at = namedRoot(root, "defaultGrantTreeIo");
  return {
    // THE BOARD IS ASKED THROUGH THE ARM'S OWN CARD INDEX, never built out
    // of the id. An id is not a path fragment — T-311's verifier said so
    // in as many words — and a second spelling of where cards live would
    // be a second board reader to keep in step with the first.
    cardFile: (id) => {
      const rel = cardFileOf(at, id);
      return rel === "" ? null : rel;
    },
    currentBlob: (rel) => {
      try {
        return blobShaOf(readFileSync(path.join(at, rel)));
      } catch {
        return null;
      }
    },
    hasObject: (sha) => {
      const r = spawnSync("git", ["-C", at, "cat-file", "-e", `${sha}^{blob}`], { encoding: "utf8" });
      return r.status === 0;
    },
  };
}

/**
 * EVERY WAY A SNAPSHOT CAN FAIL TO MATCH THE TREE IT GOVERNS, one
 * finding per failure — run BEFORE anything is written.
 *
 * ── WHAT THIS CHECK IS, SAID PLAINLY ────────────────────────────────
 * It is PROCEDURAL. It checks that the record is COMPLETE and INTERNALLY
 * CONSISTENT — that an approver and an instant were written down, that
 * the block satisfies the shipped declaration, and that every card the
 * order names exists on this board at a version this repository can
 * still produce. **IT DOES NOT ESTABLISH THAT THE OWNER APPROVED
 * ANYTHING.** A `given_by` field is a sentence a seat typed; the
 * presence of that field is evidence that somebody wrote it down and is
 * not evidence of the approval it describes. Binding the record to
 * something outside itself is T-339's, and this command must not be read
 * as having done it.
 *
 * @param {string} text the composed snapshot
 * @param {string} schemaText
 * @param {GrantTreeIo} io
 * @returns {string[]}
 */
export function validateGrantSnapshot(text, schemaText, io) {
  /** @type {string[]} */
  const out = [];
  const schema = parseProcessSchema(schemaText);
  if (schema.dispatch === null) {
    return [`${PROCESS_SCHEMA} declares no dispatch block, so a grant has nothing to be validated against`];
  }
  /** @type {import("../../../lib/parser/dist/pure.js").DispatchBlock} */
  let block;
  try {
    block = dispatchBlock(text, schema);
  } catch (err) {
    return [`the block was refused by the parser library's own reader: ${err instanceof Error ? err.message : String(err)}`];
  }
  if (!block.present) return ["the snapshot carries no `dispatch:` block, so it records no approval at all"];
  const grant = block.grant;
  if (grant === null) return ["the block is present and names no grant"];
  if (grant.givenBy.trim() === "") out.push("the grant records no approval evidence — `given_by` is what it attributes the approval to");
  if (grant.at.trim() === "") out.push("the grant records no instant");
  for (const id of grant.order) {
    const pinned = grant.cards.get(id);
    if (pinned === undefined || pinned === "") {
      out.push(`${id} is in the order and carries no blob in the card map`);
      continue;
    }
    const rel = io.cardFile(id);
    if (rel === null) {
      out.push(`${id} is approved and names no card file on this board`);
      continue;
    }
    if (io.currentBlob(rel) === pinned) continue;
    if (!io.hasObject(pinned)) {
      out.push(
        `${id} is pinned to blob ${pinned.slice(0, 12)} and this repository does not carry those ` +
          "bytes, so the approved version of that card cannot be produced",
      );
    }
  }
  return out;
}

/**
 * @typedef {object} GrantWriteResult
 * @property {string} outcome   written, already-current, or created
 * @property {number} revision
 * @property {string} digest
 * @property {string} why
 * @property {string[]} steps   what this act actually did, in order
 */

/**
 * CREATE THE STORE — an EXPLICIT, AUTHORIZED WRITER OPERATION that
 * refuses an existing destination.
 *
 * **A ROUTINE READ NEVER CREATES OR RESTORES AUTHORITY**, which is why
 * this is a verb of its own rather than a special case inside the
 * reader. It serves two jobs and says which it performed: the FIRST
 * grant of a project that has never had a store, and the EXPLICIT
 * RECOVERY of one whose snapshot was lost. A recovery IDENTIFIES the
 * intended authorization — the caller hands in the block it means — and
 * never infers it from the journal's last entry, because the journal
 * holds superseded revisions and its last entry is the grant BEFORE the
 * one that was in force.
 *
 * @param {string} root
 * @param {{ blockText: string, writtenBy: string, at?: string, schemaText?: string, io?: GrantTreeIo }} o
 * @returns {GrantWriteResult}
 */
export function initGrantStore(root, o) {
  const location = grantStoreLocation(namedRoot(root, "initGrantStore"));
  const at = location.root;
  if (!location.designated) {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.NOT_DESIGNATED,
      `dispatch-brief: the dispatch grant cannot be WRITTEN here — ${location.why}`,
    );
  }
  const schemaText = o.schemaText ?? readSchemaText(at);
  if (schemaText === null) {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.INVALID,
      `dispatch-brief: ${at} carries no ${PROCESS_SCHEMA}, and a block is validated against its ` +
        "declaration or not at all.",
    );
  }
  return withGrantStoreLock(at, () => {
    const file = path.join(at, GRANT_STORE_REL_PATH);
    if (existsSync(file)) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.EXISTS,
        `dispatch-brief: ${GRANT_STORE_REL_PATH} already exists. Creating a store is how authority ` +
          "is established, so it refuses an existing destination under the same protection as any " +
          "other write: replacing a live grant is a REVISION, and a revision names the revision it " +
          "expects to replace.",
      );
    }
    const block = grantBlockText(o.blockText);
    if (block === "") {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.INVALID,
        `dispatch-brief: the text handed to the store carries no \`${GRANT_BLOCK_KEY}:\` block, so ` +
          "there is no authorization to record.",
      );
    }
    const probe = composeGrantSnapshot({ blockText: block, root: at, revision: 0, writtenBy: o.writtenBy, ...(o.at === undefined ? {} : { at: o.at }) });
    const findings = validateGrantSnapshot(probe, schemaText, o.io ?? defaultGrantTreeIo(at));
    if (findings.length > 0) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.INVALID,
        `dispatch-brief: the grant was NOT written — it does not validate:\n  - ${findings.join("\n  - ")}`,
      );
    }
    const revision = dispatchBlock(probe, parseProcessSchema(schemaText)).grant?.revision ?? 0;
    const text = composeGrantSnapshot({ blockText: block, root: at, revision, writtenBy: o.writtenBy, ...(o.at === undefined ? {} : { at: o.at }) });
    const recovery = existsSync(path.join(at, GRANT_JOURNAL_REL_PATH));
    writeFileAtomic(file, text);
    // THE PRIOR-USE MARKER, WRITTEN BY THE CREATION AND AFTER THE
    // SNAPSHOT. A store created and never revised leaves no journal and
    // no superseded snapshot, so without this a checkout that lost its
    // FIRST grant would read as one that had never held a store — the
    // fresh-project answer the eighth criterion forbids for a snapshot
    // missing after prior use. It is written after the publication so it
    // never claims a use that did not happen.
    writeFileAtomic(path.join(at, GRANT_USED_REL_PATH), grantUsedMarker(at, revision, o.writtenBy));
    return {
      outcome: "created",
      revision,
      digest: grantDigest(text),
      why: recovery
        ? `the store was RECOVERED at revision ${String(revision)} from the authorization the caller ` +
          "named — never from the journal's last entry, which holds a SUPERSEDED revision"
        : `the store was created at revision ${String(revision)}; this checkout had never held one`,
      steps: [
        `validated ${String(findings.length)} finding(s) before writing`,
        `published ${GRANT_STORE_REL_PATH} atomically`,
      ],
    };
  });
}

/**
 * RECORD A REVISION — validate, compare-and-set under the lock, journal
 * the superseded revision, then publish the new one atomically.
 *
 * ── THE ORDER IS THE RECOVERY, AND IT IS CHOSEN RATHER THAN INHERITED ─
 * The journal is appended BEFORE the snapshot is replaced, and the
 * journal holds SUPERSEDED revisions. So the window between the two acts
 * is unambiguous by construction: a journal entry alone is NEVER evidence
 * that a new grant became active, because what the entry says is that an
 * OLD one stopped being active — and until the snapshot is replaced the
 * old one is still the authority the snapshot names. The latest effective
 * authority is the snapshot's, at every point, with no interpretation.
 *
 * SUCCESS IS REPORTED ONLY AFTER THE INTENDED STATE IS DURABLE: the
 * snapshot's bytes are flushed to the device and its directory entry
 * flushed after the rename before this function returns.
 *
 * A RETRY APPENDS NO DUPLICATE. The append is idempotent on the exact
 * (superseded revision, superseded-by, digest) triple the previous
 * attempt would have written, so a re-run after an interruption
 * continues the same act rather than starting a second one.
 *
 * AND A LOST ACKNOWLEDGEMENT IS NOT A NEW REVISION. If the store is
 * already at the intended revision, this function compares the CONTENT
 * and answers `already-current` without mutating; if the revision
 * matches and the content does not, it refuses as a CONFLICT and mutates
 * nothing, because a matching revision number alone is not evidence that
 * the intended state is the one in force.
 *
 * @param {string} root
 * @param {{ blockText: string, writtenBy: string, expectRevision: number, expectDigest?: string, at?: string, schemaText?: string, io?: GrantTreeIo }} o
 * @returns {GrantWriteResult}
 */
export function updateGrantStore(root, o) {
  const location = grantStoreLocation(namedRoot(root, "updateGrantStore"));
  const at = location.root;
  if (!location.designated) {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.NOT_DESIGNATED,
      `dispatch-brief: the dispatch grant cannot be WRITTEN here — ${location.why}`,
    );
  }
  const schemaText = o.schemaText ?? readSchemaText(at);
  if (schemaText === null) {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.INVALID,
      `dispatch-brief: ${at} carries no ${PROCESS_SCHEMA}, and a block is validated against its ` +
        "declaration or not at all.",
    );
  }
  const block = grantBlockText(o.blockText);
  if (block === "") {
    throw new GrantStoreFinding(
      GRANT_STORE_CODES.INVALID,
      `dispatch-brief: the text handed to the store carries no \`${GRANT_BLOCK_KEY}:\` block, so ` +
        "there is no authorization to record.",
    );
  }
  return withGrantStoreLock(at, () => {
    // ── THE COMPARE IS INSIDE THE LOCK, AND THAT IS THE CRITERION ────
    // A comparison taken before the lock is a comparison two writers can
    // both pass; what makes this a compare-AND-set is that the read
    // below and the rename at the end are inside one exclusive section.
    const current = readGrantStore(at, { schemaText });
    if (!current.present) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.STALE,
        `dispatch-brief: there is no ${GRANT_STORE_REL_PATH} to revise. Establishing authority is a ` +
          "creation and a creation is its own authorized operation — a revision replaces a grant it " +
          "can name.",
      );
    }
    const probe = composeGrantSnapshot({ blockText: block, root: at, revision: 0, writtenBy: o.writtenBy, ...(o.at === undefined ? {} : { at: o.at }) });
    const intendedRevision = dispatchBlock(probe, parseProcessSchema(schemaText)).grant?.revision ?? 0;
    const intended = composeGrantSnapshot({ blockText: block, root: at, revision: intendedRevision, writtenBy: o.writtenBy, ...(o.at === undefined ? {} : { at: o.at }) });
    const intendedDigest = grantDigest(intended);

    // ── THE LOST ACKNOWLEDGEMENT, ANSWERED BEFORE ANYTHING IS COMPARED
    if (current.block?.grant?.revision === intendedRevision) {
      if (current.digest === intendedDigest) {
        return {
          outcome: "already-current",
          revision: intendedRevision,
          digest: current.digest,
          why:
            `revision ${String(intendedRevision)} is ALREADY IN FORCE and its content is byte-for-byte ` +
            "the intended one, so this retry mutated nothing. A caller that missed the success of " +
            "the first attempt does not mint a second revision for it.",
          steps: ["compared the intended content against the store", "wrote nothing"],
        };
      }
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.CONFLICT,
        `dispatch-brief: the store is at revision ${String(intendedRevision)} and its content is NOT ` +
          `the intended one (${current.digest.slice(0, 12)} on disk, ${intendedDigest.slice(0, 12)} ` +
          "intended). A matching revision number alone is not evidence that the intended state is " +
          "the one in force, so this is reported as a conflict and NOTHING was mutated.",
      );
    }
    const onDisk = current.block?.grant?.revision ?? 0;
    if (onDisk !== o.expectRevision) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.STALE,
        `dispatch-brief: this revision expected to replace revision ${String(o.expectRevision)} and ` +
          `the store is at ${String(onDisk)}. Nothing was written. Re-read the store and rebuild the ` +
          "revision on what is actually there.",
      );
    }
    if (o.expectDigest !== undefined && o.expectDigest !== current.digest) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.STALE,
        `dispatch-brief: this revision expected the store's content to be ` +
          `${o.expectDigest.slice(0, 12)} and it is ${current.digest.slice(0, 12)} — the revision ` +
          "number matched and the BYTES did not, which is the case a revision check alone misses. " +
          "Nothing was written.",
      );
    }
    if (intendedRevision <= onDisk) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.INVALID,
        `dispatch-brief: the new grant reads at revision ${String(intendedRevision)}, which is not ` +
          `ABOVE the revision in force (${String(onDisk)}). The revision is the one thing that ` +
          "decides which grant is current.",
      );
    }
    const findings = validateGrantSnapshot(intended, schemaText, o.io ?? defaultGrantTreeIo(at));
    if (findings.length > 0) {
      throw new GrantStoreFinding(
        GRANT_STORE_CODES.INVALID,
        `dispatch-brief: the revision was NOT written — it does not validate:\n  - ${findings.join("\n  - ")}`,
      );
    }

    /** @type {string[]} */
    const steps = [];
    // ── STEP ONE: THE SUPERSEDED REVISION INTO THE JOURNAL, ONCE ─────
    const entry = {
      format: GRANT_STORE_FORMAT,
      supersededRevision: onDisk,
      supersededBy: intendedRevision,
      supersededAt: o.at ?? new Date().toISOString(),
      digest: current.digest,
      snapshot: current.text,
    };
    const newest = newestJournalEntry(at);
    const already =
      newest !== null &&
      Number(newest.supersededRevision) === onDisk &&
      Number(newest.supersededBy) === intendedRevision &&
      String(newest.digest) === current.digest;
    if (already) {
      steps.push(
        `the journal already records revision ${String(onDisk)} being superseded by ` +
          `${String(intendedRevision)} — a retry of an interrupted update, and it appended nothing`,
      );
    } else {
      appendJournalEntry(at, entry);
      steps.push(`appended the superseded revision ${String(onDisk)} to ${GRANT_JOURNAL_REL_PATH}`);
    }
    // ── STEP TWO: THE SUPERSEDED SNAPSHOT, RETAINED WHOLE ────────────
    // So the journal is not the only copy of the revision that was just
    // replaced, which is the case a recovery needs most and soonest.
    writeFileAtomic(path.join(at, GRANT_SUPERSEDED_REL_PATH), current.text);
    steps.push(`retained the superseded snapshot at ${GRANT_SUPERSEDED_REL_PATH}`);
    // ── STEP THREE: THE NEW SNAPSHOT, PUBLISHED ATOMICALLY ───────────
    writeFileAtomic(path.join(at, GRANT_STORE_REL_PATH), intended);
    steps.push(`published revision ${String(intendedRevision)} atomically`);
    return {
      outcome: "written",
      revision: intendedRevision,
      digest: intendedDigest,
      why:
        `revision ${String(onDisk)} was superseded by ${String(intendedRevision)}; the intended state ` +
        "is durable and this is reported only after it is",
      steps,
    };
  });
}

/**
 * THE RUNTIME DIRECTORY'S IGNORE FILE, ENSURED BEFORE ANYTHING IS
 * WRITTEN INTO IT — and this is not tidiness, it is the card's whole
 * point.
 *
 * The grant left the publication path by becoming an UNTRACKED local
 * file. A store written into a runtime directory that nothing ignores is
 * one `git add -A` away from being tracked again, and the datum would be
 * back on the path this card removed it from — quietly, and in the one
 * repository where the mistake costs a publication per approval. The
 * fence writer already ensures this file; the string is imported from
 * the one place that declares it rather than spelled a second time,
 * because a constant with two copies is two chances to disagree.
 *
 * @param {string} root
 */
export function ensureRuntimeDirIgnored(root) {
  const dir = path.join(root, RUNTIME_DIR);
  mkdirSync(dir, { recursive: true });
  const ignore = path.join(dir, ".gitignore");
  if (!existsSync(ignore)) writeFileSync(ignore, RUNTIME_DIR_IGNORE, "utf8");
}

/**
 * THE PRIOR-USE MARKER'S CONTENT — a sentence, because a reader who
 * finds this file after the snapshot has gone should learn what it means
 * from the file rather than from this source.
 *
 * Nothing PARSES it: the marker is stat'd, never opened, so what it says
 * is for a person. It records which grant the checkout first held so a
 * recovery has somewhere to start.
 *
 * @param {string} root @param {number} revision @param {string} writtenBy @returns {string}
 */
function grantUsedMarker(root, revision, writtenBy) {
  return (
    `# ${GRANT_USED_REL_PATH} — THIS CHECKOUT HAS HELD A DISPATCH GRANT.\n` +
    "#\n" +
    `# ${path.basename(root)} was given its first grant at revision ${String(revision)}, recorded by\n` +
    `# ${writtenBy}. This file exists so that a LOST snapshot is answered as a lost\n` +
    "# authorization rather than as a fresh project: a store that was created and never\n" +
    `# revised leaves no journal and no superseded snapshot, so without this marker\n` +
    `# ${GRANT_STORE_REL_PATH} going missing would read as a checkout that never had one,\n` +
    "# and the next creation would mint authority over an approval already given.\n" +
    "#\n" +
    "# It is STAT'D and never opened. Deleting it does not remove an authorization; it\n" +
    "# removes the evidence that one was ever here.\n"
  );
}

/** Append one journal line, flushed to the device before the caller is told. @param {string} root @param {object} entry */
function appendJournalEntry(root, entry) {
  const file = path.join(root, GRANT_JOURNAL_REL_PATH);
  mkdirSync(path.dirname(file), { recursive: true });
  const fd = openSync(file, "a", 0o600);
  try {
    writeSync(fd, `${JSON.stringify(entry)}\n`);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

/**
 * THE GRANT, READ FROM THE OPERATIONAL STORE AND THROUGH NOTHING ELSE
 * (T-344, over T-319's seventh criterion).
 *
 * **A CHECKOUT THAT HAS NEVER HELD A STORE IS THE EXPLICIT NO-GRANT
 * STATE AND THE LOOP KEEPS RUNNING.** That is the state every project
 * the kit scaffolds begins in, and the honest answer to it is
 * `enforced: false` — every admission is made, every one is REPORTED as
 * unenforced. No grant is ever invented from a person, an instant or a
 * past authorization (T-307), and an arm that refused there would stop a
 * loop nobody asked it to stop.
 *
 * **EVERY OTHER ABSENCE IS A REFUSAL.** A store this reader cannot
 * verify — the wrong checkout, a lost snapshot after prior use,
 * unparseable bytes, another host — throws rather than answering
 * silence. The pause record beside it already holds that rule and this
 * one is the same argument: the case where guessing costs most is the
 * case where somebody recorded something and the reader could not read
 * it.
 *
 * @param {string} root
 * @param {{ schemaText?: string }} [opts]
 * @returns {GrantState}
 */
export function grantState(root, opts = {}) {
  const at = namedRoot(root, "grantState");
  const pause = readPause(at);
  const stray = strayTemplateGrant(at);
  const store = readGrantStore(at, opts);
  if (!store.present) {
    // THE NO-GRANT MODES ARE THE DECLARATION'S OWN `absent:` VALUES, read
    // out of the schema rather than typed here, so the one place that
    // says what "no grant" means stays the schema.
    let approval = "";
    let recovery = "";
    const schemaText = opts.schemaText ?? readSchemaText(at);
    if (schemaText !== null) {
      try {
        const empty = dispatchBlock("", parseProcessSchema(schemaText));
        approval = empty.approval;
        recovery = empty.recovery;
      } catch {
        /* a schema this reader cannot parse leaves the modes unnamed rather than guessed */
      }
    }
    return {
      enforced: false,
      block: null,
      pause,
      approval,
      recovery,
      revision: 0,
      source: store.source + (stray === "" ? "" : `. AND A STRAY BLOCK WAS FOUND: ${stray}`),
      store,
      stray,
    };
  }
  const block = /** @type {import("../../../lib/parser/dist/pure.js").DispatchBlock} */ (store.block);
  return {
    enforced: true,
    block,
    pause,
    approval: block.approval,
    recovery: block.recovery,
    revision: block.revision,
    source: store.source + (stray === "" ? "" : `. AND A STRAY BLOCK WAS FOUND: ${stray}`),
    store,
    stray,
  };
}

/**
 * THE CARD'S BLOB SHA AS IT STANDS, from git's own hash of the file —
 * the same 40 hex characters the grant records, computed the same way,
 * so the two are comparable without either side agreeing on a digest.
 *
 * @param {string} root @param {string} rel repository-relative
 * @returns {string} the sha, or "" where the file cannot be hashed
 */
export function cardBlobSha(root, rel) {
  try {
    return git(root, ["hash-object", "--", path.join(root, rel)]).trim();
  } catch {
    return "";
  }
}

/**
 * THE CARD AT THE BLOB THE OWNER APPROVED, read back out of the object
 * database. **THE APPROVED REVISION IS NOT GONE, IT IS ADDRESSED**: the
 * grant records the blob sha and git still holds those bytes, so the
 * question "is this the card that was approved, or only a stamp away
 * from it" is answerable rather than a matter of trust.
 *
 * @param {string} root @param {string} sha
 * @returns {?string} the text, or null where the object cannot be read
 */
export function approvedCardText(root, sha) {
  if (!/^[0-9a-f]{40}$/.test(sha)) return null;
  try {
    return git(root, ["cat-file", "-p", sha]);
  } catch {
    return null;
  }
}

/**
 * THE DISPATCH BLOCK'S READ SITES, PARSED OFF THE SCHEMA'S OWN COMMENT
 * TABLE (T-324's seventh criterion).
 *
 * **THE TABLE IS IN THE SCHEMA BECAUSE THAT IS WHERE THE CRITERION PUTS
 * IT, AND IT IS PARSED BECAUSE A TABLE NOBODY READS GOES STALE.** The
 * declaration's own field set is CLOSED by the parser library (a
 * `reads:` attribute on a row would be refused there, and the library is
 * not this card's to change), so the read site of each row lives in the
 * section's comment — and a body derives it back out of the file,
 * requires every symbol named to be one this arm exports, and reds when
 * an `operational` row has no site named for it. That is the same shape
 * the guard-class map keeps: kept by a body, not by a memory.
 *
 * @param {string} schemaText
 * @returns {Map<string, { symbol: string, why: string }>}
 */
export function dispatchReadSites(schemaText) {
  /** @type {Map<string, { symbol: string, why: string }>} */
  const out = new Map();
  let inTable = false;
  for (const line of schemaText.split(/\r?\n/)) {
    if (/^#\s+THE READ SITES, AND A CITATION NAMES A SYMBOL, NOT A LINE\./.test(line)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith("#")) break;
    // THE TABLE ENDS AT THE FIRST BARE `#`, and it has to end at
    // something: the comment block around it carries other indented
    // prose, and a scan that ran on would read the field GLOSSARY above
    // as read sites and name symbols nobody wrote.
    if (out.size > 0 && line.trim() === "#") break;
    const m = /^#\s{3}([A-Za-z_][A-Za-z0-9_.]*)\s+([A-Za-z][A-Za-z0-9_]*)\s+(.*)$/.exec(line);
    if (m === null) continue;
    out.set(/** @type {string} */ (m[1]), {
      symbol: /** @type {string} */ (m[2]),
      why: /** @type {string} */ (m[3]).trim(),
    });
  }
  return out;
}

/**
 * THE CARD FILE A WORK ID NAMES, derived from the board rather than
 * built out of the id — an id is not a path fragment (T-311's verifier
 * said so in as many words) and a tree with no such card answers "".
 *
 * @param {string} root @param {string} id
 * @returns {string} repository-relative, or "" where no live card declares it
 */
export function cardFileOf(root, id) {
  try {
    return cardIndex(root).get(id)?.file ?? "";
  } catch {
    return "";
  }
}

/**
 * THE BOARD'S STATUSES, for the one question the until endpoint asks:
 * whether the card a grant runs up to is PARKED, since a parked endpoint
 * is not a delivered one.
 *
 * @param {Ctx} ctx
 * @returns {Map<string, string>}
 */
export function admissionBoard(ctx) {
  /** @type {Map<string, string>} */
  const out = new Map();
  for (const [id, card] of ctx.cards) out.set(id, fieldScalar(card.fields, "status"));
  return out;
}

/**
 * THE PHASE A ROLE SERVES. Anything this arm does not recognise is
 * IMPLEMENTATION, which is the answer a `new-work` pause refuses.
 *
 * @param {string} role
 * @returns {string}
 */
export function admissionPhase(role) {
  const r = String(role ?? "").trim().toLowerCase();
  if (r === "verifier") return "verification";
  if (r === "integrator") return "integration";
  return "implementation";
}

/**
 * WHAT HAS ALREADY BEEN ADMITTED, DERIVED FROM THE RUN RECORDS THEMSELVES.
 *
 * `records` is what `allRecords` answers, passed in rather than read here
 * so that this module keeps importing nothing from `run-record.mjs` — the
 * dependency runs the other way and a cycle between the two would be a
 * load-order bug nobody could see from either file.
 *
 * @param {{ attempt: string, state: string, assignment: { id: string, resource: string }, admission?: unknown }[]} records
 * @param {readonly string[]} terminalStates
 * @returns {AdmissionEntry[]}
 */
export function admissionLedger(records, terminalStates) {
  /** @type {AdmissionEntry[]} */
  const out = [];
  for (const rec of records) {
    const a = /** @type {Record<string, unknown> | undefined} */ (
      rec.admission === null || typeof rec.admission !== "object" ? undefined : rec.admission
    );
    if (a === undefined) continue;
    out.push({
      card: String(a["card"] ?? rec.assignment.id),
      attempt: rec.attempt,
      kind: String(a["kind"] ?? ""),
      revision: Number(a["revision"] ?? 0),
      blob: String(a["blob"] ?? ""),
      parent: a["parent"] === null || a["parent"] === undefined ? null : String(a["parent"]),
      evidence: String(a["evidence"] ?? ""),
      state: rec.state,
      terminal: terminalStates.includes(rec.state),
      resource: rec.assignment.resource === "none" ? null : rec.assignment.resource,
    });
  }
  return out;
}

/**
 * HOW A CARD HAS MOVED SINCE THE YES, and whether the movement is the
 * MECHANICAL APPEND this loop's own ceremony performs.
 *
 * **THE BINDING IS TO THE CARD, NOT TO THE BYTES**, and the difference is
 * the whole of why this function exists. Between the owner's yes and the
 * executor's first write the arm itself stamps `status:`, `tier:` and the
 * two seat fields onto the card; the executor appends implementation
 * notes; the verifier appends a verdict; either may file a follow-up. A
 * blob comparison alone would read every one of those as "a different
 * card" and refuse the work the owner approved. Anything ELSE — a changed
 * criterion, a widened fence, a deleted line — is a different card and is
 * refused, because a criterion edited after the yes is an approval of
 * something nobody read.
 *
 * @param {string} approved  the card at the blob the grant recorded
 * @param {string} current   the card as it stands now
 * @returns {{ mechanical: boolean, drift: string[], substantive: string[] }}
 */
export function cardDrift(approved, current) {
  /** @type {string[]} */
  const drift = [];
  /** @type {string[]} */
  const substantive = [];
  const a = frontmatterFields(approved);
  const c = frontmatterFields(current);
  const keys = new Set([...Object.keys(a), ...Object.keys(c)]);
  for (const key of keys) {
    const was = a[key];
    const now = c[key];
    if (JSON.stringify(was ?? null) === JSON.stringify(now ?? null)) continue;
    const line = `frontmatter \`${key}\`: ${was === undefined ? "added" : now === undefined ? "removed" : "changed"}`;
    // A KEY THE CEREMONY WRITES IS MECHANICAL WHETHER IT WAS THERE OR
    // NOT: `tier:` is written by the arm and left out by the author, so
    // the card the owner approved commonly has no line to change.
    if (MECHANICAL_FIELDS.includes(key)) drift.push(line);
    else substantive.push(line);
  }
  /** The card's prose, with the frontmatter block and its fence removed. */
  const bodyOf = (/** @type {string} */ text) => {
    const block = frontmatterBlock(text);
    if (block === null) return text.split(/\r?\n/);
    const rest = text.slice(text.indexOf(block) + block.length);
    const close = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
    return (close === null ? rest : rest.slice(close.index + close[0].length)).split(/\r?\n/);
  };
  const was = bodyOf(approved);
  const now = bodyOf(current);
  let i = 0;
  let heading = "";
  for (const line of now) {
    const h = /^##\s+(.*)$/.exec(line);
    if (h !== null) heading = /** @type {string} */ (h[1]).trim();
    if (i < was.length && line === was[i]) {
      i += 1;
      continue;
    }
    // AN ADDED LINE. It is mechanical where it sits under one of the two
    // sections the ceremony appends to, or where it names a filed
    // follow-up card; a blank line is neither news nor a change.
    if (line.trim() === "") continue;
    if (MECHANICAL_SECTIONS.includes(heading)) {
      drift.push(`an append under \`## ${heading}\``);
      continue;
    }
    if (FOLLOW_UP_PATTERN.test(line)) {
      drift.push("a filed follow-up line");
      continue;
    }
    substantive.push(`a line added outside ${MECHANICAL_SECTIONS.join(" and ")}: ${line.trim().slice(0, 60)}`);
  }
  if (i < was.length) {
    const lost = was.slice(i).filter((l) => l.trim() !== "");
    if (lost.length > 0) {
      substantive.push(`${String(lost.length)} line(s) the approved card carried are gone or changed`);
    }
  }
  return {
    mechanical: substantive.length === 0,
    drift: [...new Set(drift)],
    substantive,
  };
}

/**
 * THE LIMITS, READ AND NOT ENFORCED — this card's fifth criterion, and
 * the sentence each line carries is the point of the criterion rather
 * than decoration.
 *
 * **THEIR ABSENCE IMPOSES NO CEILING AND THEIR PRESENCE STOPS NOTHING.**
 * An expired `expires_at` does not refuse an admission here; enforcement
 * is a later card's, and saying so by name is what stops a control from
 * silently doing nothing.
 *
 * @param {GrantState} state
 * @returns {string[]}
 */
export function advisoryLimits(state) {
  const limits = state.block?.limits ?? null;
  if (limits === null) {
    return [
      "no limits are recorded on this grant, and their absence imposes NO token or time ceiling — " +
        "an absent ceiling is not an infinite one, it is a ceiling nobody wrote down",
    ];
  }
  /** @type {string[]} */
  const out = [];
  for (const [provider, ceiling] of limits.tokens) {
    out.push(
      `limits.tokens.${provider} = ${String(ceiling)} — ADVISORY: read and reported here, ` +
        "enforced by nothing in this tree, and deferred to a later card",
    );
  }
  if (limits.expiresAt !== "") {
    out.push(
      `limits.expires_at = ${limits.expiresAt} — ADVISORY: read and reported here, enforced by ` +
        "nothing in this tree, and an expiry that has passed refuses no admission at this card",
    );
  }
  if (out.length === 0) {
    out.push("the grant carries a limits block with nothing in it, which is a record of no ceiling");
  }
  return out;
}

/**
 * THE COORDINATOR'S OBLIGATIONS — the promises this arm CANNOT keep, so
 * that a reader never mistakes the refusals it does perform for the whole
 * of the guarantee. This card's seventh criterion names all three.
 *
 * @returns {string[]}
 */
export function coordinatorObligations() {
  return [
    "SCOPE INTERPRETATION — whether a repair is really inside the approved work is a judgement " +
      "about meaning; this arm checks that a parent and an evidence were NAMED, never that the " +
      "naming is true",
    "AN UNREPORTED INTEGRITY PROBLEM — a seat that finds a defect and does not say so leaves " +
      "nothing on disk for an admission reader to refuse",
    "A PROVIDER'S LIVE USAGE — what has actually been spent is the provider's number and reaches " +
      "no file this arm reads; the grant's limits are recorded here and enforced nowhere",
  ];
}

/**
 * THE ADMISSION ITSELF — admit, or refuse by name.
 *
 * The order of the checks is the design and not an accident: the PAUSE is
 * read first because it is the owner's most recent act and a paused loop
 * is paused whatever the grant says; the CURRENT GRANT next, because a
 * revoked block approves nothing; then the kind, because an explicit and
 * a derived admission are answerable to different things.
 *
 * @param {GrantState} state
 * @param {AdmissionRequest} request
 * @param {AdmissionEntry[]} [ledger]
 * @returns {Admission}
 */
export function admit(state, request, ledger = []) {
  const boundary = String(request.boundary ?? "");
  if (!ADMISSION_BOUNDARIES.includes(boundary)) {
    throw new AdmissionFinding(
      ADMISSION_CODES.BOUNDARY,
      `dispatch-brief: ${JSON.stringify(boundary)} is not an admission boundary. The boundaries ` +
        `are ${ADMISSION_BOUNDARIES.join(", ")}, and an admission made at a moment this arm does ` +
        "not know is an admission nothing re-reads the grant at.",
    );
  }
  const kind = String(request.kind ?? "");
  if (!ADMISSION_KINDS.includes(kind)) {
    throw new AdmissionFinding(
      ADMISSION_CODES.KIND,
      `dispatch-brief: ${JSON.stringify(kind)} is not a kind of admission. An admission is ` +
        `${ADMISSION_KINDS.join(" or ")}: a card the grant names, or a repair the recovery policy ` +
        "allows, bound to its parent work and the failure evidence.",
    );
  }
  const card = String(request.card ?? "").trim();
  if (card === "") {
    throw new AdmissionFinding(
      ADMISSION_CODES.NO_CARD,
      "dispatch-brief: an admission is an admission OF something, and this one names no card.",
    );
  }
  const phase = request.phase === undefined ? admissionPhase(request.role ?? "") : String(request.phase);
  if (!ADMISSION_PHASES.includes(phase)) {
    throw new AdmissionFinding(
      ADMISSION_CODES.SCOPE,
      `dispatch-brief: ${JSON.stringify(phase)} is not a phase. The phases are ` +
        `${ADMISSION_PHASES.join(", ")}, and the phase is what a new-work pause discriminates on.`,
    );
  }
  const resource = request.resource ?? null;
  const advisory = advisoryLimits(state);
  const obligations = coordinatorObligations();

  /** @param {Partial<Admission>} extra @returns {Admission} */
  const answer = (extra) => ({
    admitted: true,
    kind,
    boundary,
    card,
    phase,
    code: "",
    why: "",
    revision: state.revision,
    blob: String(request.blob ?? ""),
    parent: request.parent === undefined ? null : request.parent,
    evidence: request.evidence === undefined ? "" : sha256(request.evidence),
    consumed: false,
    reuses: null,
    resource,
    drift: [],
    advisory,
    obligations,
    ...extra,
  });

  /** @param {string} code @param {string} why @returns {never} */
  const refuse = (code, why) => {
    throw new AdmissionFinding(code, `dispatch-brief: the ${boundary} admission of ${card} is REFUSED — ${why}`);
  };

  // ── THE PAUSE, AND IT IS READ BEFORE THE NO-GRANT STATE ────────────
  // **A PAUSED LOOP IS PAUSED WHATEVER THE GRANT SAYS**, and the order
  // of these two blocks is the only thing that says so. A pause is not a
  // row of the grant: it is the owner's own record, and a tree with no
  // `dispatch:` block — which is this project's own tree — is exactly
  // the tree in which the owner has nothing else to stop the loop with.
  // Read after the no-grant return, a WELL-FORMED pause stopped nothing
  // here while a MALFORMED one stopped everything, since `readPause`
  // refuses before `grantState` ever answers; that inversion is what
  // this ordering removes.
  const pause = state.pause;
  if (pause !== null) {
    if (pause.scope === "all") {
      refuse(
        ADMISSION_CODES.PAUSED_ALL,
        `a pause of scope \`all\` was recorded by ${pause.by} at ${pause.at} in ${pause.file}` +
          (pause.why === "" ? "" : ` (${pause.why})`) +
          ". Every further phase stops at its DECLARED SAFE BOUNDARY — a running executor at its " +
          "stamp, a running verifier at its verdict, a staged merge finished or aborted as the " +
          "record says — and no new admission is made at any of them. An IMMEDIATE stop is a " +
          "separate request routed through the applicable stopping mechanism and not through this " +
          "reader, and interrupting a job preserves uncertainty until the jobs are reconciled.",
      );
    }
    // **THE PERMISSION IS OF A CANDIDATE ALREADY ADMITTED, AND OF
    // NOTHING ELSE.** The scope's own words are the verification and
    // integration OF THE ADMITTED CANDIDATE; a phase that is not
    // implementation is not by itself a candidate, and admitting one
    // whose card this loop never admitted lets new work through a pause
    // by relabelling the seat — and spend that card's own approval
    // doing it. The ledger is what says a candidate exists.
    //
    // A CONSULTATION IS OUTSIDE THIS GUARD AND ALWAYS WAS: it consumes
    // no approval and reserves nothing, and the writer it runs beside
    // carries the admission. What this protects is the CARD admission,
    // which spends something.
    const candidate =
      String(request.work ?? "card") !== "card" || ledger.some((e) => e.card === card);
    if (phase === "implementation" || !candidate) {
      refuse(
        ADMISSION_CODES.PAUSED_NEW_WORK,
        `a pause of scope \`new-work\` was recorded by ${pause.by} at ${pause.at} in ${pause.file}` +
          (pause.why === "" ? "" : ` (${pause.why})`) +
          ". New implementation work and re-entry into it are refused while the VERIFICATION and " +
          "INTEGRATION of a candidate already admitted are permitted to start and to finish — so " +
          "a verifier start for an existing candidate is admitted and a replacement executor is " +
          "not." +
          (candidate
            ? ""
            : ` No attempt has admitted ${card}, so this ${phase} is not the ${phase} of a ` +
              "candidate already admitted — it is new work wearing a later phase's name, and " +
              "admitting it would spend that card's own approval under a pause.") +
          " An owner-issued pause needs no second approval to be read.",
      );
    }
  }


  // ── THE NO-GRANT STATE: ADMIT, AND SAY THAT NOTHING WAS ENFORCED ───
  if (!state.enforced) {
    return answer({
      kind: "unenforced",
      why:
        `${state.source}. Every admission is made and NONE is enforced: the refusals below apply ` +
        "wherever a block exists, and this tree carries none.",
      revision: 0,
    });
  }

  // ── THE CURRENT GRANT ──────────────────────────────────────────────
  const block = /** @type {NonNullable<GrantState["block"]>} */ (state.block);
  const grant = block.current;
  if (grant === null) {
    refuse(
      ADMISSION_CODES.NO_CURRENT_GRANT,
      `the block is REVOKED (at ${block.revoked?.at ?? "an unrecorded instant"} by ` +
        `${block.revoked?.by ?? "an unrecorded person"}), so it carries no current grant. The ` +
        "revoked grant stays in the record and approves nothing; a new grant is the owner's to give.",
    );
  }
  if (!["each", "until", "standing"].includes(state.approval)) {
    refuse(
      ADMISSION_CODES.UNKNOWN_MODE,
      `the approval mode is \`${state.approval}\` and this arm branches on each, until and ` +
        "standing. A mode the arm has no branch for is a mode nothing enforces, which is worse " +
        "than a refusal.",
    );
  }
  if (!["none", "repairs"].includes(state.recovery)) {
    refuse(
      ADMISSION_CODES.UNKNOWN_RECOVERY,
      `the recovery policy is \`${state.recovery}\` and this arm branches on none and repairs.`,
    );
  }

  // ── A CONSULTATION IS WORK THE GRANT'S CARD LIST DOES NOT NAME ─────
  // **AND IT IS ADMITTED ONLY WHILE IT WRITES NOTHING.** T-311 separates
  // the WORK SERVED from the RESOURCE a child may write, and a
  // consultation is the read-only half of that separation: a tool-less
  // phase one beside its executor, a question asked of a second model.
  // A grant approves CARDS, so a consultation could never appear in an
  // order — refusing it would stop a participant the owner's approval of
  // the card already covers. What is NOT covered is a consultation that
  // claims write ownership of a resource, and that is refused by name:
  // work that writes is work that needs its own approval, whatever the
  // assignment calls it.
  if (String(request.work ?? "card") === "consultation") {
    if (resource !== null) {
      refuse(
        ADMISSION_CODES.CONSULTATION_WRITER,
        `it is a CONSULTATION claiming write ownership of ${resource}. A consultation is the ` +
          "read-only half of the work/resource separation — it runs beside a writer and reserves " +
          "nothing — and one that writes is work needing its own approval by name, whatever the " +
          "assignment calls it.",
      );
    }
    return answer({
      why:
        `a CONSULTATION, bound to the grant's revision ${String(grant.revision)} and writing ` +
        "nothing. A grant approves cards, so a consultation is never in an order; it consumes no " +
        "approval and takes no reservation, and the pause above still reaches it.",
      consumed: false,
    });
  }

  // ── THE LEDGER: WHAT THIS CARD ALREADY HOLDS AT THIS REVISION ──────
  const mine = ledger.filter((e) => e.card === card && e.revision === grant.revision);
  const open = mine.find((e) => !e.terminal) ?? null;

  // ── THE KIND ───────────────────────────────────────────────────────
  if (kind === "derived") {
    if (state.recovery === "none") {
      refuse(
        ADMISSION_CODES.RECOVERY_NONE,
        `the recovery policy is \`none\`, so a DERIVED admission is refused and recorded as ` +
          "NEEDING ITS OWN EXPLICIT APPROVAL: add this card to the grant's order, with its blob, " +
          "and it is admitted as an explicitly approved repair. An automatic repair and an " +
          "approved one are the same work under two different authorizations, and only one of " +
          "them is this policy's to make.",
      );
    }
    const parent = String(request.parent ?? "").trim();
    // **AN INHERITED AUTHORIZATION CANNOT EXCEED THE ONE IT INHERITS
    // FROM.** Membership of the order is not enough under `until`: the
    // grant runs up to and including its endpoint, so a card AFTER the
    // endpoint is work this grant would refuse, and a repair naming it
    // as its parent inherits an authorization the grant never made —
    // which is the endpoint bound bypassed by naming an unreachable
    // parent. Criterion 2 admits only "the repairs that card's delivery
    // needs", and a card the grant does not reach delivers nothing.
    const parentAt = grant.order.indexOf(parent);
    const endpointAt = state.approval === "until" && grant.until !== null ? grant.order.indexOf(grant.until) : -1;
    const beyondEndpoint = endpointAt >= 0 && parentAt > endpointAt;
    if (parent === "" || parentAt < 0 || beyondEndpoint) {
      refuse(
        ADMISSION_CODES.DERIVED_NO_PARENT,
        parent === ""
          ? "a derived admission names no PARENT authorized work. It inherits an authorization " +
              "rather than minting one, and there is nothing here to inherit from."
          : beyondEndpoint
            ? `its parent \`${parent}\` is in the order but AFTER this grant's endpoint ` +
                `\`${String(grant.until)}\`, so it is work this grant would refuse. A repair ` +
                "inherits its parent's authorization and cannot exceed it, and a grant whose " +
                "endpoint could be crossed by naming an unreachable parent has no endpoint."
            : `its parent \`${parent}\` is not work this grant approved (the order is ` +
                `${grant.order.join(", ")}). A repair attributed to work nobody approved is a second ` +
                "approval wearing a repair's clothes.",
      );
    }
    const evidence = String(request.evidence ?? "").trim();
    if (evidence === "") {
      refuse(
        ADMISSION_CODES.DERIVED_NO_EVIDENCE,
        "a derived admission carries no FAILURE EVIDENCE. A repair's description establishes " +
          "nothing on its own — what admits it is the failure attributed to the approved work, " +
          "and a repair with no evidence is a description.",
      );
    }
    const scope = String(request.scope ?? "repair").trim();
    if (!DERIVED_SCOPES.includes(scope)) {
      throw new AdmissionFinding(
        ADMISSION_CODES.SCOPE,
        `dispatch-brief: ${JSON.stringify(scope)} is not a derived admission's scope. The scopes ` +
          `are ${DERIVED_SCOPES.join(", ")}.`,
      );
    }
    if (scope !== "repair") {
      refuse(
        ADMISSION_CODES.DERIVED_OUT_OF_SCOPE,
        scope === "product-change"
          ? "it declares itself a PRODUCT-SCOPE CHANGE. `repairs` admits the repairs the approved " +
              "work needs and never a change to what the product does, which is the owner's to " +
              "approve on its own."
          : "it declares itself a WAIVED VERIFICATION. A repair is classified and verified as any " +
              "other card is; a repair that skips its verification is not a repair the recovery " +
              "policy allows.",
      );
    }
    // A REPEATED DELIVERY EVENT PRODUCES NO DUPLICATE REPAIR. The same
    // failure, attributed to the same parent, is the SAME derived
    // admission re-presented — and a scope change (a different parent,
    // or a repair card whose own blob has moved) re-evaluates it, which
    // is what falling through to a fresh admission means.
    const digest = sha256(evidence);
    const already = mine.find(
      (e) => e.kind === "derived" && e.parent === parent && e.evidence === digest,
    );
    if (already !== undefined) {
      return answer({
        why:
          `a derived repair of ${parent}, already admitted at attempt ${already.attempt} on the ` +
          "same failure evidence. The same delivery event reported twice is ONE repair, so this " +
          "re-presents that admission rather than minting a second one.",
        evidence: digest,
        reuses: already.attempt,
      });
    }
    return answer({
      why:
        `a derived repair of ${parent} under recovery \`repairs\`, bound to the failure evidence, ` +
        `to the parent grant's revision ${String(grant.revision)} and to this repair card's own ` +
        "blob at its filing. It inherits the parent's authorization and mints no grant, and it is " +
        "classified and verified as any other card.",
      evidence: digest,
      consumed: true,
    });
  }

  // ── AN EXPLICIT ADMISSION: A CARD THE GRANT NAMES ──────────────────
  if (!grant.order.includes(card)) {
    refuse(
      ADMISSION_CODES.CARD_NOT_APPROVED,
      `the grant at revision ${String(grant.revision)} does not name it. The grant's list is ` +
        `PER-CARD APPROVALS and never a batch: it approves ${grant.order.join(", ")}, and a card ` +
        "outside that list needs its own approval by name.",
    );
  }

  // THE UNTIL ENDPOINT. The grant runs up to and INCLUDING the named
  // card; the next card in the order is refused BY NAME, and a parked
  // endpoint is not a delivered one, so the grant does not move past it.
  if (state.approval === "until" && grant.until !== null) {
    const stop = grant.order.indexOf(grant.until);
    const at = grant.order.indexOf(card);
    if (at > stop) {
      const next = grant.order[stop + 1] ?? "";
      const status = request.board?.get(grant.until) ?? "";
      refuse(
        ADMISSION_CODES.UNTIL_ENDPOINT,
        `this grant runs up to and including ${grant.until}, and ${card} is after it in the order ` +
          (next === card ? "— it is the NEXT card, " : `(the next card is ${next}, ` + `and ${card} is further on) `) +
          `— so it waits for its own approval. ` +
          (status === PARKED_STATUS
            ? `And ${grant.until} is PARKED: a parked endpoint is not a delivered one, so this ` +
              "grant does not move past it either."
            : status === ""
              ? `${grant.until}'s own status was not read here, and it does not change this answer.`
              : `${grant.until} is ${status}.`),
      );
    }
  }

  // THE BLOB THE OWNER APPROVED, and the mechanical appends the loop's
  // own ceremony writes onto a card between the yes and the build.
  const approvedBlob = grant.cards.get(card) ?? "";
  const nowBlob = String(request.blob ?? "").trim();
  /** @type {string[]} */
  let drift = [];
  if (nowBlob !== "" && approvedBlob !== "" && nowBlob !== approvedBlob) {
    const approvedText = request.approvedText?.(approvedBlob) ?? null;
    const currentText = request.cardText ?? null;
    if (approvedText === null || currentText === null) {
      refuse(
        ADMISSION_CODES.CARD_BLOB_MOVED,
        `the grant approved blob ${approvedBlob.slice(0, 12)} and the card is now ` +
          `${nowBlob.slice(0, 12)}, and neither revision could be READ here — so whether the ` +
          "movement is the loop's own mechanical append or a rewritten criterion is undecided, " +
          "and undecided is refused.",
      );
    }
    const moved = cardDrift(approvedText, currentText);
    if (!moved.mechanical) {
      refuse(
        ADMISSION_CODES.CARD_BLOB_MOVED,
        `the grant approved blob ${approvedBlob.slice(0, 12)} and the card is now ` +
          `${nowBlob.slice(0, 12)}, and the difference is NOT a mechanical append: ` +
          `${moved.substantive.join("; ")}. A card edited after the yes is a different card, and ` +
          "an approval of a criterion nobody read is not an approval.",
      );
    }
    drift = moved.drift;
  }

  // THE CONSUMPTION, AND IT IS WHAT SEPARATES THE THREE MODES.
  if (open !== null) {
    return answer({
      why:
        `the grant at revision ${String(grant.revision)} approves it, and attempt ${open.attempt} ` +
        `already holds this admission (${open.state}). This ${boundary} RE-PRESENTS that ` +
        "admission rather than consuming a second approval, and it creates no second writer: the " +
        "resource's own reservation is what decides that, and it is untouched here.",
      blob: nowBlob,
      drift,
      reuses: open.attempt,
    });
  }
  // THE VERIFICATION AND THE INTEGRATION OF A CANDIDATE ALREADY
  // ADMITTED RUN UNDER THAT SAME ADMISSION, and that is not a loophole —
  // it is what "the admitted candidate" in the pause's own scope MEANS.
  // A card's approval is spent when the card is admitted; the phases
  // that carry it to a verdict and into the integration branch are the
  // rest of that one lifecycle, not three approvals. What IS a second
  // approval is a fresh IMPLEMENTATION attempt after the lifecycle
  // concluded, and that is the refusal below.
  const prior = mine.length === 0 ? null : /** @type {AdmissionEntry} */ (mine[mine.length - 1]);
  if (prior !== null && phase !== "implementation") {
    return answer({
      why:
        `the grant at revision ${String(grant.revision)} approves it and attempt ${prior.attempt} ` +
        `carried its admission (${prior.state}). The ${phase} of a candidate already admitted runs ` +
        "under that same admission and consumes no second approval — a card's approval is spent " +
        "when the CARD is admitted, and the phases that carry it to a verdict are the rest of one " +
        "lifecycle.",
      blob: nowBlob,
      drift,
      reuses: prior.attempt,
    });
  }
  if (state.approval === "each" && prior !== null) {
    refuse(
      ADMISSION_CODES.APPROVAL_CONSUMED,
      `the approval mode is \`each\` and this card's approval at revision ` +
        `${String(grant.revision)} was already CONSUMED by attempt ${mine[0]?.attempt ?? "an " +
          "earlier attempt"}, which concluded ${mine[0]?.state ?? "elsewhere"}. Under \`each\` the ` +
        "approval is per card and is spent once; a second run of the same card is a second " +
        "approval, and only the owner gives one.",
    );
  }
  return answer({
    why:
      `the grant at revision ${String(grant.revision)} names it, its approved blob still matches ` +
      (drift.length === 0 ? "byte for byte" : `under the mechanical appends (${drift.join("; ")})`) +
      `, and the approval mode is \`${state.approval}\`` +
      (state.approval === "each"
        ? ": this admission CONSUMES that card's own approval, once"
        : state.approval === "until"
          ? `: the grant runs up to and including ${grant.until ?? "its endpoint"}`
          : ": the grant is standing and runs until a pause is recorded"),
    blob: nowBlob,
    drift,
    consumed: true,
  });
}

/**
 * WHAT A SUCCESSOR COORDINATOR INHERITS (this card's sixth criterion,
 * over T-238's seat).
 *
 * **THE GRANT IS THE BLOCK'S AND NEVER THE PREVIOUS COORDINATOR'S.** A
 * seat is taken and released; the approval is the owner's and sits in the
 * template, so a successor reads the same revision, the same order and
 * the same blobs the predecessor read, and the predecessor's identity is
 * no part of it. That is the whole difference between a loop whose
 * authority lives in a checkpoint's prose and one whose authority lives
 * in a record.
 *
 * @param {GrantState} state
 * @param {AdmissionEntry[]} ledger
 * @returns {{ inherits: boolean, revision: number, order: string[], remaining: string[], why: string }}
 */
export function grantInheritance(state, ledger = []) {
  if (!state.enforced || state.block?.current == null) {
    return {
      inherits: false,
      revision: 0,
      order: [],
      remaining: [],
      why:
        `${state.source}. A successor inherits NOTHING because there is nothing recorded to ` +
        "inherit — and nothing is invented from the predecessor's memory of what was approved.",
    };
  }
  const grant = state.block.current;
  const done = new Set(ledger.filter((e) => e.revision === grant.revision && e.terminal).map((e) => e.card));
  const remaining = grant.order.filter((c) => !done.has(c));
  return {
    inherits: true,
    revision: grant.revision,
    order: [...grant.order],
    remaining,
    why:
      `the grant at revision ${String(grant.revision)}, given by ${grant.givenBy} at ${grant.at}, ` +
      `is inherited FROM THE BLOCK: the order is ${grant.order.join(", ")} and ` +
      `${remaining.length === 0 ? "none of it remains" : `${remaining.join(", ")} remain(s)`}. ` +
      "The previous coordinator's identity is no part of it — a seat is taken and released, and " +
      "the approval is the owner's.",
  };
}

/**
 * THE ADMISSION, REPORTED — and the three groups are the report's whole
 * point (this card's seventh criterion).
 *
 * A reader of a dispatch has to be able to tell what this arm REFUSED
 * from what it merely RECORDED and from what nobody in this tree can
 * check at all. Printing the three in one list would let the second and
 * third borrow the first's authority, which is the exact way a guarantee
 * gets overstated.
 *
 * @param {Ctx} ctx
 * @param {GrantState} state
 * @param {Admission | null} admission
 * @returns {Rec[]}
 */
export function admissionRecs(ctx, state, admission) {
  // THE GRANT IS A LIVE FACT SINCE T-344 AND ITS PROVENANCE SAYS SO. It
  // lives in an untracked store at the designated integration checkout,
  // so it is not a function of this tree and a `@ <ref>` beside it would
  // be a provenance nobody could re-derive from that commit — the
  // figure rule's own live-environment exception, spelled here rather
  // than inherited from the row it replaced.
  const t = liveProv(
    ctx.at,
    ctx.host,
    `${GRANT_STORE_REL_PATH}, read through the parser library's reader`,
  );
  const live = liveProv(ctx.at, ctx.host, `${PAUSE_REL_PATH}, as it is on disk`);
  /** @type {Rec[]} */
  const recs = [
    blank(),
    note("THE ADMISSION — every admission is bound to the grant's revision, the card's approved"),
    note("blob and the attempt's reservation; the grant is RE-READ at every boundary"),
    value(`grant: ${state.source}`, t),
  ];
  if (state.enforced) {
    recs.push(
      value(`approval: ${state.approval} · recovery: ${state.recovery} · revision: ${String(state.revision)}`, t),
    );
  }
  recs.push(
    value(
      state.pause === null
        ? "pause: none is recorded, so no boundary is stopped by one"
        : `pause: scope ${state.pause.scope}, recorded by ${state.pause.by} at ${state.pause.at}`,
      live,
    ),
  );
  if (admission !== null) {
    // THE LABEL IS THE CLAIM AND IT IS DERIVED, never typed: a tree with
    // no block ENFORCES NOTHING, and a line that said otherwise would be
    // the overstatement the three groups exist to prevent.
    const tested = state.enforced ? "THE REFUSALS THIS ARM TESTED" : "NOT ENFORCED — THERE IS NO BLOCK TO ENFORCE";
    recs.push(
      value(
        `${tested} — ${admission.boundary} admission of ${admission.card} (${admission.kind}, ` +
          `phase ${admission.phase}): ${admission.why}`,
        t,
      ),
    );
    for (const d of admission.drift) recs.push(value(`${tested} — mechanical append allowed: ${d}`, t));
    for (const a of admission.advisory) recs.push(value(`ADVISORY ACCOUNTING — ${a}`, t));
    for (const o of admission.obligations) {
      recs.push(value(`THE COORDINATOR'S, NOT THIS ARM'S — ${o}`, t));
    }
  }
  return recs;
}

/* ────────────────────────────────────────────────────────────────────
 * THE UNATTENDED LOOP (T-322) — what the coordinator does with a
 * failure, a reserved decision and a refused spawn while the owner is
 * away, and the one page they read when they come back.
 *
 * **THE PROBLEM IS NOT THAT THE LOOP STOPS. IT IS THAT IT STOPS FOR
 * THINGS NOBODY DECIDED IT SHOULD.** Until this card the standing
 * authorization told the seat to stop at a rejected verdict, at a spawn
 * refused for quota, at a record that had to be shown before it was
 * appended, and at every in-card decision — so five hours away from the
 * machine cost five hours of loop. T-319 says WHICH dispatches need no
 * yes and T-324 enforces that at four boundaries; this section says what
 * a FAILURE produces, where a decision the coordinator may not make goes
 * while it waits, what a refused spawn becomes, and what the owner reads
 * on return.
 *
 * ── ATTRIBUTION COMES BEFORE ACTION, AND IT IS THE WHOLE DISCIPLINE ──
 * A red is not a defect until something says which defect. The four
 * answers are a REGRESSION (named failing bodies from the run's own log,
 * against the newest EARLIER run whose tested ref is an ancestor of this
 * tip, plus the diff between the two refs), a TRANSIENT infrastructure
 * failure a retry resolves, an infrastructure failure that NEEDS AN
 * ACTION — a disk floor, a billing block, a missing secret — and an
 * UNRESOLVED cause. Each routes somewhere different and only the first
 * becomes a repair. **CI IS NEVER RE-RUN WHILE ITS BILLING OR DISK
 * CONDITION IS UNCHANGED**: that is what separates the second class from
 * the third, and the seat's own 2026-09-14 reading of jobs failing in
 * seconds with no steps — a billing block, not the tree — is why the
 * third class exists at all.
 *
 * ── THE PROGRESS RULE IS THE PROTECTION AGAINST GETTING STUCK ────────
 * A repair continues on EVIDENCE and parks on repetition. A new commit
 * is not progress and neither is a changed error string: what counts is
 * a materially different remedy with evidence behind it, or a verified
 * part of the failure removed. A parked problem carries a WAKE
 * CONDITION, so the fresh coordinator that inherits it does not restart
 * the cycle the last one parked.
 *
 * ── THE HEALTH CHECK IS SPECIFIC TO THE PROPOSED ACTION ─────────────
 * A red on main is not a reason to stop everything, and it is not a
 * reason to stop nothing. The designated repair of an attributed defect
 * is exactly the work that red calls for; a landing whose delivery
 * checks that same red invalidates is held. What holds EVERYTHING is
 * unknown ownership of a live writer or a verification path that cannot
 * be trusted — and no repair permission bypasses those, because a repair
 * verified by a seal nobody trusts is not a repair. A bench or a seal
 * not yet OWED for the stage being proposed is not a broken path, which
 * is the distinction a blunter check gets wrong in the safe-looking
 * direction.
 *
 * ── A QUOTA REFUSAL IS A SCHEDULED RETRY, NOT A BLOCK ───────────────
 * The refused attempt and its next retry instant are recorded on the run
 * record, the coordinator revisits that instant at its own boundaries
 * while continuing other eligible work, and only where NOTHING else is
 * eligible does the wait verb hold until the instant. An authentication
 * or a configuration failure is a different thing wearing the same exit
 * code and it parks with a question instead.
 *
 * ── A QUESTION IS AN ENTRY IN A ROOM, MARKED AS A QUESTION ──────────
 * The seat's own voice, never a ruling — the ruling entry still waits
 * for the owner's yes (T-307). It carries an id, the cards it holds, the
 * cause and its ref, and its state; the dispatch order names that id on
 * every dependent card it holds NOT STARTABLE, and the LANE CUT refuses
 * by the same resolved state rather than merely displaying it. **NO
 * TASK-PARSER FIELD IS ADDED**: the link lives in the room and the order
 * reads it, so a card gains no field whose only writer is this loop.
 *
 * ── AND THE RETURN BRIEF DERIVES, IT DOES NOT REMEMBER ──────────────
 * Cards, rooms, run records, meters records and the RUNNER'S RUNS. A
 * push with no run is reported UNKNOWN and never inferred from a
 * commit's timestamp; an older green run is never proof of the current
 * tip, because a run is evidence about the sha it tested.
 * ──────────────────────────────────────────────────────────────────── */

/** The four answers an attribution may reach, and there is no fifth. */
export const ATTRIBUTION_CLASSES = Object.freeze([
  "regression",
  "transient",
  "needs-action",
  "unresolved",
]);

/** What an attribution produces. One class may reach two of these; none reaches all. */
export const ATTRIBUTION_ACTIONS = Object.freeze([
  "repair",
  "wait-and-retry",
  "remedy",
  "park",
  "diagnose",
  "question",
]);

/** A refusal this loop tells apart from every other exit with the same code. */
export const REFUSAL_KINDS = Object.freeze(["quota", "authentication", "configuration", "none"]);

/** The two events that wake a parked problem, and a wake is never a duration. */
export const REPAIR_WAKES = Object.freeze(["new-diagnostic-evidence", "owner-decision"]);

/** The two states a question entry may carry. */
export const QUESTION_STATES = Object.freeze(["pending", "resolved"]);

/** Where the bands' readings live, relative to the checkout that holds them. */
export const METERS_REL_PATH = "docs/checkpoints/meters.jsonl";

/** A question id: the room's own handle for one reserved decision. */
export const QUESTION_ID_PATTERN = /^Q-\d{3,}$/;

/**
 * THE MARKER THAT MAKES AN ENTRY A QUESTION AND NOT A RULING, spelled
 * once and required by the reader, the renderer and the method eval. A
 * question entry that lost this marker would read to a later reader as
 * something the owner settled.
 */
export const QUESTION_MARKER = "QUESTION — not a ruling";

/** The first retry delay where the refusal names no reset instant. */
export const RETRY_BASE_MS = 60_000;

/** The ceiling that growth is capped at, so a delay cannot become a day. */
export const RETRY_CAP_MS = 3_600_000;

/**
 * EVERY REFUSAL AND EVERY HOLD CARRIES A CODE, on `run-record.mjs`'s and
 * T-324's model: a caller that can only match on a sentence is a caller
 * that breaks the day the sentence is improved.
 */
export const UNATTENDED_CODES = Object.freeze({
  ATTRIBUTION_INPUT: "UNATTENDED_ATTRIBUTION_INPUT",
  QUESTION_SHAPE: "UNATTENDED_QUESTION_SHAPE",
  QUESTION_PENDING: "UNATTENDED_QUESTION_PENDING",
  REPAIR_LEDGER: "UNATTENDED_REPAIR_LEDGER",
  RETRY_INSTANT: "UNATTENDED_RETRY_INSTANT",
});

/** A derivation this section was asked for and will not make. */
export class UnattendedFinding extends Error {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = "UnattendedFinding";
    /** @type {string} */
    this.code = code;
  }
}

/* ── ATTRIBUTION ─────────────────────────────────────────────────── */

/**
 * THE INFRASTRUCTURE SIGNATURES, AS DATA AND WITH THEIR CLASS ON EACH
 * ROW. A table rather than a chain of `if`s because the DIFFERENCE
 * between the two infrastructure classes is the whole point: `transient`
 * is resolved by waiting, `needs-action` is not resolved by anything
 * this loop can do by repeating itself, and a row that got its class
 * wrong would turn a billing block into an infinite re-run.
 *
 * `remedy` is the cleanup a coordinator MAY perform where the policy
 * allows it; an empty remedy is a condition only the owner can clear.
 *
 * @type {ReadonlyArray<{ sign: RegExp, class: string, name: string, remedy: string }>}
 */
export const INFRASTRUCTURE_SIGNS = Object.freeze([
  {
    sign: /\b(no space left on device|disk( |-)?(space|quota) (exceeded|exhausted)|ENOSPC)\b/i,
    class: "needs-action",
    name: "the runner's disk floor",
    remedy: "prune the runner's caches and artifacts, where the policy allows that cleanup",
  },
  {
    sign: /\b(billing|payment|spending limit|account has been suspended|has exceeded its budget)\b/i,
    class: "needs-action",
    name: "a billing block on the account",
    remedy: "",
  },
  {
    sign: /\b(secret|credential|token) (is )?(not set|missing|unavailable|empty)\b|\bmissing (secret|credential)\b/i,
    class: "needs-action",
    name: "a secret the workflow needs and the runner does not have",
    remedy: "",
  },
  {
    sign: /\b(the runner (has )?(lost communication|was lost|shut down)|runner outage|lost communication with the server|infrastructure failure)\b/i,
    class: "transient",
    name: "a runner outage",
    remedy: "",
  },
  {
    sign: /\b(rate limit|quota (window|exceeded)|429|too many requests|temporarily unavailable|503 Service Unavailable|ECONNRESET|ETIMEDOUT)\b/i,
    class: "transient",
    name: "a quota window or a transport failure",
    remedy: "",
  },
]);

/**
 * THE FAILING BODIES, READ OUT OF THE RUN'S OWN LOG AND NEVER GUESSED.
 *
 * The three shapes this project's own legs produce: playwright's
 * `N) [project] › file:line › NAME`, vitest's `FAIL file > NAME` and
 * cargo's `test NAME ... FAILED`. A log that matches none returns an
 * EMPTY list, which is what makes `unresolved` reachable — a reader that
 * invented a body name from a stack frame would be attributing a red to
 * whatever happened to be printed near it.
 *
 * @param {string} log
 * @returns {string[]}  the named bodies, deduped, in the order the log names them
 */
export function failingBodies(log) {
  /** @type {string[]} */
  const out = [];
  const add = (/** @type {string} */ name) => {
    const t = name.trim().replace(/\s+/g, " ");
    if (t !== "" && !out.includes(t)) out.push(t);
  };
  for (const line of String(log ?? "").split("\n")) {
    const playwright = /^\s*\d+\)\s+(?:\[[^\]]*\]\s*›\s*)?(?:[^›]*›\s*)?(.+?)\s*(?:───|$)/.exec(line);
    if (playwright !== null && /›/.test(line)) {
      add(/** @type {string} */ (playwright[1]));
      continue;
    }
    const vitest = /^\s*(?:FAIL|✗|×)\s+(?:\S+\s+>\s+)?(.+?)\s*$/.exec(line);
    if (vitest !== null) {
      add(/** @type {string} */ (vitest[1]));
      continue;
    }
    const cargo = /^\s*(?:test\s+)?(\S+)\s+\.\.\.\s+FAILED\s*$/.exec(line);
    if (cargo !== null) add(/** @type {string} */ (cargo[1]));
  }
  return out;
}

/**
 * @typedef {object} RunnerRun
 * @property {number|string} databaseId
 * @property {string} headSha
 * @property {string} conclusion   `success`, `failure`, `cancelled`, or "" while in progress
 * @property {string} createdAt
 */

/**
 * THE PARENT RUN IS THE NEWEST EARLIER RUN WHOSE TESTED REF IS AN
 * ANCESTOR OF THIS TIP, and every word of that is load-bearing.
 *
 * NEWEST, because an older green tells you less. EARLIER, by the run's
 * own creation instant, because a run started after this one is not a
 * baseline for it. ANCESTOR, decided by the repository and not by a
 * timestamp, because two branches' runs interleave in time and only one
 * of them is this tip's history. **AN OLDER GREEN RUN IS NEVER PROOF OF
 * THE CURRENT TIP** — it is the baseline the failing bodies are compared
 * against, which is a different claim entirely.
 *
 * @param {RunnerRun[]} runs
 * @param {{ sha: string, at: string }} tip   the run being attributed
 * @param {(sha: string) => boolean} isAncestor  answers for the REPOSITORY, never for a clock
 * @returns {?RunnerRun}
 */
export function parentRun(runs, tip, isAncestor) {
  const tipMs = Date.parse(String(tip.at));
  const earlier = (runs ?? []).filter(
    (r) =>
      r.headSha !== tip.sha &&
      Date.parse(String(r.createdAt)) < tipMs &&
      String(r.conclusion) !== "" &&
      isAncestor(r.headSha),
  );
  earlier.sort((a, b) => Date.parse(String(a.createdAt)) - Date.parse(String(b.createdAt)));
  return earlier.length === 0 ? null : /** @type {RunnerRun} */ (earlier[earlier.length - 1]);
}

/**
 * @typedef {object} Attribution
 * @property {string} class     one of ATTRIBUTION_CLASSES
 * @property {string} action    one of ATTRIBUTION_ACTIONS
 * @property {string[]} bodies  the failing bodies this attribution names, possibly empty
 * @property {?RunnerRun} parent  the baseline run, or null where there is none
 * @property {string} range     `<parent sha>..<tip sha>`, or "" where no parent was found
 * @property {string} sign      the infrastructure signature that decided it, or ""
 * @property {string} remedy    the cleanup the coordinator may perform, or ""
 * @property {string} wake      the parked problem's wake condition, or ""
 * @property {string} why       one sentence a reader can act on
 * @property {string} baseline  how the baseline was obtained: a run, a local reproduction, or none
 */

/**
 * ATTRIBUTE A RED BEFORE ANYTHING ACTS ON IT.
 *
 * THE ORDER OF THE QUESTIONS IS THE RULE. Infrastructure is asked about
 * FIRST, because a red whose cause is a billing block has failing bodies
 * in it too — the jobs that never ran — and a reader that started from
 * the bodies would file a repair card against code that is fine. Only
 * then are the bodies compared against the baseline.
 *
 * WHAT COUNTS AS A BASELINE, in order: the parent run, else a bounded
 * LOCAL reproduction of base and candidate the caller performed and
 * hands in, else NOTHING — and nothing is `unresolved`, never a guess.
 * The card names the local reproduction as the answer where no parent
 * run exists, so it is an input here rather than a branch this module
 * invents for itself.
 *
 * @param {object} input
 * @param {string} input.log            the run's own log
 * @param {RunnerRun[]} [input.runs]    the runner's history
 * @param {{ sha: string, at: string }} input.tip
 * @param {(sha: string) => boolean} [input.isAncestor]
 * @param {{ base: string[], candidate: string[] }} [input.reproduction]  a bounded local run of both refs
 * @param {string} [input.recovery]     the recovery policy: `repairs` admits a derived repair, `none` does not
 * @param {boolean} [input.cleanupAllowed]  whether the policy lets this coordinator perform a remedy
 * @returns {Attribution}
 */
export function attribute(input) {
  const tip = input.tip;
  if (tip === undefined || typeof tip.sha !== "string" || tip.sha === "") {
    throw new UnattendedFinding(
      UNATTENDED_CODES.ATTRIBUTION_INPUT,
      "dispatch-brief: an attribution needs the tip it is attributing — the sha the red run " +
        "tested and the instant it was created — because the baseline is the newest EARLIER run " +
        "whose tested ref is an ANCESTOR of that sha, and neither half of that is answerable " +
        "without it.",
    );
  }
  const log = String(input.log ?? "");
  const recovery = String(input.recovery ?? "repairs");
  for (const row of INFRASTRUCTURE_SIGNS) {
    if (!row.sign.test(log)) continue;
    if (row.class === "transient") {
      return {
        class: "transient",
        action: "wait-and-retry",
        bodies: [],
        parent: null,
        range: "",
        sign: row.name,
        remedy: "",
        wake: "",
        baseline: "none was needed — the cause is in the run's own log",
        why:
          `the run's own log carries ${row.name}, which a reset or a retry resolves. This is a ` +
          "wait and a retry, and no repair card is filed: there is no defect in the tree to repair.",
      };
    }
    const canRemedy = row.remedy !== "" && input.cleanupAllowed === true;
    return {
      class: "needs-action",
      action: canRemedy ? "remedy" : "park",
      bodies: [],
      parent: null,
      range: "",
      sign: row.name,
      remedy: row.remedy,
      wake: canRemedy ? "" : "owner-decision",
      baseline: "none was needed — the cause is in the run's own log",
      why: canRemedy
        ? `the run's own log carries ${row.name}, and the policy allows this coordinator to ` +
          `perform the remedy: ${row.remedy}. CI is NOT re-run until the condition has changed.`
        : `the run's own log carries ${row.name}, which no repetition resolves — it needs ` +
          "configuration, cleanup or an owner's action. The affected resource is PARKED with a " +
          "wake condition and permitted work continues; CI is never re-run while this condition " +
          "is unchanged, because a re-run on an unchanged condition buys a second copy of the " +
          "same answer.",
    };
  }
  const bodies = failingBodies(log);
  const parent =
    input.isAncestor === undefined
      ? null
      : parentRun(input.runs ?? [], tip, input.isAncestor);
  /** @type {string[] | null} */
  let baseBodies = null;
  let baseline = "";
  if (parent !== null) {
    // THE BASELINE'S OWN BODIES ARE NOT IN THIS LOG. A parent run that
    // SUCCEEDED carries no failing body by construction, which is the
    // only case the runs list alone can answer; a parent that failed
    // needs its own log, and without it the comparison is not made.
    if (String(parent.conclusion) === "success") {
      baseBodies = [];
      baseline = `the run at ${parent.headSha} (${String(parent.databaseId)}), which concluded success`;
    } else {
      baseline = `the newest earlier ancestor run at ${parent.headSha} did NOT conclude success, so it is no baseline`;
    }
  }
  if (baseBodies === null && input.reproduction !== undefined) {
    baseBodies = input.reproduction.base;
    baseline = "a bounded local reproduction of base and candidate, performed by the caller";
  }
  if (bodies.length === 0) {
    return {
      class: "unresolved",
      action: "diagnose",
      bodies: [],
      parent,
      range: parent === null ? "" : `${parent.headSha}..${tip.sha}`,
      sign: "",
      remedy: "",
      wake: "",
      baseline: baseline === "" ? "none" : baseline,
      why:
        "the run's own log names no failing body this reader recognises and carries no " +
        "infrastructure signature either, so nothing here attributes the red to anything. This " +
        "is a DIAGNOSTIC attempt inside the scope, and a question entry only when diagnosis " +
        "cannot answer it.",
    };
  }
  if (baseBodies === null) {
    return {
      class: "unresolved",
      action: "diagnose",
      bodies,
      parent,
      range: "",
      sign: "",
      remedy: "",
      wake: "",
      baseline: baseline === "" ? "none — no earlier run tested an ancestor of this tip" : baseline,
      why:
        `${String(bodies.length)} body/bodies failed and there is NO baseline to compare them ` +
        "against: no earlier run tested an ancestor of this tip and no bounded local " +
        "reproduction of base and candidate was supplied. A red with no baseline is not " +
        "attributed to the merge — it is diagnosed, and the reproduction is the next act.",
    };
  }
  const introduced = bodies.filter((b) => !baseBodies.includes(b));
  if (introduced.length === 0) {
    return {
      class: "unresolved",
      action: "diagnose",
      bodies,
      parent,
      range: parent === null ? "" : `${parent.headSha}..${tip.sha}`,
      sign: "",
      remedy: "",
      wake: "",
      baseline,
      why:
        "every failing body here was already failing at the baseline, so the comparison does NOT " +
        "attribute this red to the diff. It is diagnosed rather than repaired, and a repair card " +
        "filed against this merge would name the wrong change.",
    };
  }
  const range = parent === null ? "(the local reproduction's two refs)" : `${parent.headSha}..${tip.sha}`;
  if (recovery !== "repairs") {
    return {
      class: "regression",
      action: "question",
      bodies: introduced,
      parent,
      range,
      sign: "",
      remedy: "",
      wake: "owner-decision",
      baseline,
      why:
        `${introduced.join(", ")} fail here and did not at the baseline, so this red IS attributed ` +
        `to ${range}. The recovery policy is ${JSON.stringify(recovery)}, which admits no derived ` +
        "repair, so the repair needs its own explicit approval and this becomes a question entry.",
    };
  }
  return {
    class: "regression",
    action: "repair",
    bodies: introduced,
    parent,
    range,
    sign: "",
    remedy: "",
    wake: "",
    baseline,
    why:
      `${introduced.join(", ")} fail here and did not at the baseline, so this red IS attributed ` +
      `to ${range}. Inside the recovery policy's scope it becomes the repair: the rejected lane ` +
      "re-entered with the verdict as the executor's input, or a repair card at priority 1 naming " +
      "the run, the body and the merge, admitted BY DERIVATION in the order's next slot.",
  };
}

/* ── THE REPAIR LEDGER AND THE PROGRESS RULE ─────────────────────── */

/**
 * @typedef {object} RepairAttempt
 * @property {string} at        the instant the attempt was recorded
 * @property {string} failure   the named bodies, or the rejection's stated failures
 * @property {string} ref       the run id or the verdict ref the failure was read at
 * @property {string} remedy    what was attempted
 * @property {string} outcome   `unchanged`, `partial` or `resolved`
 * @property {string[]} removed the parts of the failure a VERIFICATION showed removed
 * @property {string} evidence  what is behind the next remedy, or ""
 * @property {string} [wake]    the wake condition, written when THIS entry is the park
 * @property {string} [attributed]  the attribution's class, which is what was decided BEFORE this remedy
 */

/**
 * ONE LEDGER ENTRY, RENDERED. It goes under `## Repair ledger` on the
 * FAILING card, which is where the card's second criterion puts it: the
 * card is a record every later reader already opens, and a ledger beside
 * it would be a second place for the same fact.
 *
 * THE FIELDS ARE FIXED AND EACH IS REQUIRED, because the progress rule
 * below reads them back: an entry with no outcome cannot say whether the
 * failure state changed, which is the one thing the rule turns on.
 *
 * @param {RepairAttempt} a
 * @returns {string}
 */
export function repairEntry(a) {
  for (const field of ["at", "failure", "ref", "remedy", "outcome"]) {
    if (String(/** @type {any} */ (a)[field] ?? "").trim() === "") {
      throw new UnattendedFinding(
        UNATTENDED_CODES.REPAIR_LEDGER,
        `dispatch-brief: a repair ledger entry needs its ${field} — the rule that decides whether ` +
          "a next attempt continues or parks reads every one of these back, and an entry missing " +
          "one is an entry that rides to a green by being unreadable.",
      );
    }
  }
  if (!["unchanged", "partial", "resolved"].includes(a.outcome)) {
    throw new UnattendedFinding(
      UNATTENDED_CODES.REPAIR_LEDGER,
      `dispatch-brief: ${JSON.stringify(a.outcome)} is not a demonstrated change in the failure ` +
        "state. It is `unchanged`, `partial` or `resolved`, and the word is what the progress rule " +
        "reads — a free-text outcome would make every attempt look like progress.",
    );
  }
  // **THE ATTRIBUTION IS PART OF THE RECORD AND NOT A PRELUDE TO IT**
  // (criterion 1's "SHALL record the attribution"). A ledger entry that
  // carried only the remedy would leave a fresh coordinator with the act
  // and not the reason for it — and the reason is the half that decides
  // whether the next act is a repair at all.
  const attributed = String(a.attributed ?? "").trim();
  if (attributed !== "" && !ATTRIBUTION_CLASSES.includes(attributed)) {
    throw new UnattendedFinding(
      UNATTENDED_CODES.REPAIR_LEDGER,
      `dispatch-brief: ${JSON.stringify(attributed)} is not an attribution class — it is one of ` +
        `${ATTRIBUTION_CLASSES.join(", ")}. A free-text attribution is one nobody can act on ` +
        "differently, which is the whole reason the four classes are closed.",
    );
  }
  const wake = String(a.wake ?? "").trim();
  if (wake !== "" && !REPAIR_WAKES.includes(wake)) {
    throw new UnattendedFinding(
      UNATTENDED_CODES.REPAIR_LEDGER,
      `dispatch-brief: ${JSON.stringify(wake)} is not a wake condition — it is ` +
        `${REPAIR_WAKES.join(" or ")}. **A WAKE IS AN EVENT AND NEVER A DURATION**: a parked ` +
        "problem that came back on a timer would be the cycle the progress rule parked it out of, " +
        "restarted by a clock.",
    );
  }
  return [
    `- ${a.at} — failure: ${a.failure} (at ${a.ref})`,
    ...(attributed === "" ? [] : [`  attributed: ${attributed}`]),
    `  remedy: ${a.remedy}`,
    `  outcome: ${a.outcome}${a.removed.length === 0 ? "" : ` — removed: ${a.removed.join(", ")}`}`,
    ...(String(a.evidence ?? "").trim() === "" ? [] : [`  evidence: ${a.evidence}`]),
    ...(wake === "" ? [] : [`  parked, wakes on: ${wake}`]),
  ].join("\n");
}

/**
 * READ THE LEDGER BACK OFF THE CARD. A card with no such section has an
 * EMPTY history, which is the honest answer and not an error: most cards
 * never fail.
 *
 * @param {string} cardText
 * @returns {RepairAttempt[]}
 */
export function repairLedger(cardText) {
  const text = String(cardText ?? "");
  const at = text.indexOf(`## ${REPAIR_LEDGER_HEADING}`);
  if (at < 0) return [];
  const rest = text.slice(at + REPAIR_LEDGER_HEADING.length + 3);
  const end = rest.indexOf("\n## ");
  const section = end < 0 ? rest : rest.slice(0, end);
  /** @type {RepairAttempt[]} */
  const out = [];
  for (const block of section.split(/\n(?=- )/)) {
    const head = /^-\s+(\S+)\s+—\s+failure:\s+(.+?)\s+\(at\s+(.+?)\)\s*$/m.exec(block);
    if (head === null) continue;
    const remedy = /^\s*remedy:\s*(.+?)\s*$/m.exec(block);
    const outcome = /^\s*outcome:\s*(unchanged|partial|resolved)\s*(?:—\s*removed:\s*(.+?)\s*)?$/m.exec(block);
    if (remedy === null || outcome === null) continue;
    const evidence = /^\s*evidence:\s*(.+?)\s*$/m.exec(block);
    const wake = /^\s*parked, wakes on:\s*(.+?)\s*$/m.exec(block);
    const attributed = /^\s*attributed:\s*(\S+)\s*$/m.exec(block);
    out.push({
      ...(wake === null ? {} : { wake: String(wake[1]) }),
      ...(attributed === null ? {} : { attributed: String(attributed[1]) }),
      at: /** @type {string} */ (head[1]),
      failure: /** @type {string} */ (head[2]),
      ref: /** @type {string} */ (head[3]),
      remedy: /** @type {string} */ (remedy[1]),
      outcome: /** @type {string} */ (outcome[1]),
      removed:
        outcome[2] === undefined
          ? []
          : String(outcome[2]).split(",").map((s) => s.trim()).filter((s) => s !== ""),
      evidence: evidence === null ? "" : /** @type {string} */ (evidence[1]),
    });
  }
  return out;
}

/**
 * A REMEDY, NORMALISED TO WHAT IT DOES RATHER THAN TO HOW IT WAS TYPED.
 *
 * **A NEW COMMIT OR A CHANGED ERROR STRING ALONE IS NOT PROGRESS**, and
 * this is the function that makes that sentence mechanical: shas, run
 * ids, instants, attempt ids and digits are erased before two remedies
 * are compared, so "re-ran the suite at abc1234" and "re-ran the suite
 * at def5678" are ONE remedy tried twice and not two remedies.
 *
 * @param {string} remedy
 * @returns {string}
 */
export function remedyDigest(remedy) {
  return String(remedy ?? "")
    .toLowerCase()
    .replace(/\b[0-9a-f]{7,40}\b/g, " ")
    .replace(/\b\d[\d:.T_-]*\b/g, " ")
    .replace(/[^a-z ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .sort()
    .join(" ");
}

/**
 * @typedef {object} ProgressRuling
 * @property {string} act   `continue` or `park`
 * @property {string} why
 * @property {string} wake  the parked problem's wake condition, or "" while continuing
 */

/**
 * CONTINUE ON EVIDENCE, PARK ON REPETITION.
 *
 * The two ways a next attempt earns its spawn, and a proposal needs
 * exactly one of them: it is a MATERIALLY DIFFERENT remedy with evidence
 * behind it, or the history shows a VERIFIED part of the failure
 * removed. Everything else parks — including the case the card names in
 * as many words, "no justified next action exists inside the scope",
 * which arrives here as a proposal with no remedy at all.
 *
 * **THE PARK IS NOT A TOKEN CEILING AND IT IS NOT A RETRY COUNT.** A
 * fourth materially different remedy with evidence continues; a second
 * copy of the first one does not. What the park buys is that a fresh
 * coordinator reading the ledger does not restart the cycle, which is
 * why it carries a WAKE CONDITION rather than a timestamp.
 *
 * @param {RepairAttempt[]} history
 * @param {{ remedy?: string, evidence?: string }} proposed
 * @returns {ProgressRuling}
 */
export function progressRuling(history, proposed) {
  const past = history ?? [];
  const remedy = String(proposed?.remedy ?? "").trim();
  const evidence = String(proposed?.evidence ?? "").trim();
  if (remedy === "") {
    return {
      act: "park",
      why:
        "no next remedy is proposed, so there is no justified next action inside the scope. The " +
        "problem is PARKED with its record and permitted work continues — a spawn with nothing " +
        "to try is the cycle this rule exists to stop.",
      wake: "new-diagnostic-evidence",
    };
  }
  if (past.length === 0) {
    return {
      act: "continue",
      why: "this is the first attempt at this failure, so there is nothing for it to repeat.",
      wake: "",
    };
  }
  const digest = remedyDigest(remedy);
  const ineffective = past.filter((a) => a.outcome === "unchanged").map((a) => remedyDigest(a.remedy));
  const repeats = ineffective.includes(digest);
  const last = past[past.length - 1];
  const removed =
    last !== undefined && (last.removed.length > 0 || last.outcome === "partial");
  // **DEMONSTRATED PROGRESS IS ASKED ABOUT FIRST, AND THE ORDER IS THE
  // CRITERION READ LITERALLY.** The two ways a next attempt earns its
  // spawn are an OR — a materially different remedy with evidence, OR a
  // verified part of the failure removed — and the criterion's own pin
  // says which wins where both clauses could speak: "the same named
  // failing body with demonstrated partial progress continues". The park
  // clause is about work whose EVIDENCE is unchanged, and a removed part
  // of the failure is exactly evidence that changed.
  if (removed) {
    return {
      act: "continue",
      why:
        "a verified part of the failure has been removed by an earlier attempt, so the repair is " +
        "making progress and the next attempt continues — this is the case the rule's own pin " +
        "names, and it holds whether or not the next remedy is a new one.",
      wake: "",
    };
  }
  if (repeats) {
    return {
      act: "park",
      why:
        "the proposed remedy repeats one already attempted with the failure state UNCHANGED, and " +
        "nothing in the history shows a verified part of the failure removed. A new commit or a " +
        "changed error string alone is not progress" +
        (evidence === ""
          ? ", and no new evidence is offered behind it either"
          : ", and evidence behind a remedy already shown ineffective does not make it a " +
            "materially different one") +
        ". This problem is PARKED with its record and eligible work continues.",
      wake: "new-diagnostic-evidence",
    };
  }
  if (evidence === "") {
    return {
      act: "park",
      why:
        "the proposed remedy is different but carries no evidence behind it, and no attempt so " +
        "far removed a verified part of the failure. A different guess is not a materially " +
        "different remedy, so this problem is PARKED rather than tried again.",
      wake: "new-diagnostic-evidence",
    };
  }
  return {
    act: "continue",
    why:
      "the proposed remedy is materially different from every ineffective one already tried and " +
      "carries evidence behind it, so the next attempt continues.",
    wake: "",
  };
}

/* ── THE SHARED-HEALTH CHECK, SPECIFIC TO THE PROPOSED ACTION ─────── */

/**
 * @typedef {object} HealthState
 * @property {{ known: boolean, green: boolean, attributed: ?{ card: string, bodies: string[] } }} ci
 * @property {{ trusted: boolean, owed: boolean, why: string }} verification
 * @property {{ unknown: string[] }} writers   resources whose live writer's ownership is unknown
 */

/**
 * @typedef {object} ProposedAction
 * @property {string} kind      `repair`, `landing` or `independent`
 * @property {string} card
 * @property {string} [repairs] the card the attributed defect was attributed TO
 * @property {string[]} [checks] the delivery checks this landing depends on
 * @property {string[]} [dependsOn] the question ids this action depends on
 * @property {string[]} [pendingQuestions] the question ids pending right now
 * @property {?string} [resource] the resource this action would write
 */

/**
 * @typedef {object} HealthVerdict
 * @property {boolean} permitted
 * @property {string[]} holds  one line per condition that holds this action
 * @property {string} why
 */

/**
 * THE CHECK IS SPECIFIC TO THE ACTION AND THAT IS THE WHOLE CARD.
 *
 * A blunt check answers "is the world healthy" and stops the loop on
 * every red; a specific one answers "may THIS act proceed", which is the
 * question a coordinator actually has. So an attributed red PERMITS its
 * designated repair and HOLDS a landing whose delivery checks that red
 * invalidates, and a card proved independent of a parked question
 * continues past it.
 *
 * **TWO CONDITIONS HOLD EVERYTHING AND NO REPAIR PERMISSION BYPASSES
 * THEM**: an unknown live writer, and a verification path that cannot be
 * trusted. They are first here for that reason — a repair merged past an
 * untrusted seal is not a repair, and a second writer started over a
 * resource somebody may still hold is the T-247 race with a reason
 * attached.
 *
 * **AND A BENCH OR A SEAL NOT YET OWED IS NOT A BROKEN PATH.** That
 * distinction is the one a blunter check gets wrong in the direction
 * that looks safe: holding every dispatch because the verifier's bench
 * for a card nobody has built yet does not answer.
 *
 * @param {HealthState} state
 * @param {ProposedAction} action
 * @returns {HealthVerdict}
 */
export function sharedHealth(state, action) {
  /** @type {string[]} */
  const holds = [];
  const resource = action.resource ?? null;
  const unknownWriters = state.writers?.unknown ?? [];
  const affected =
    resource === null ? unknownWriters : unknownWriters.filter((r) => r === resource);
  if (affected.length > 0) {
    holds.push(
      `the live writer of ${affected.join(", ")} is of UNKNOWN ownership, which holds every ` +
        "affected action — and no repair permission bypasses it, because a second writer started " +
        "over a resource somebody may still hold is a race with a reason attached",
    );
  }
  if (state.verification?.owed === true && state.verification.trusted !== true) {
    holds.push(
      `the verification path cannot be trusted at this stage — ${state.verification.why} — which ` +
        "holds every affected action; a repair verified by a seal nobody trusts is not a repair",
    );
  }
  const pending = action.pendingQuestions ?? [];
  const dependsOn = (action.dependsOn ?? []).filter((q) => pending.includes(q));
  if (dependsOn.length > 0) {
    holds.push(
      `it depends on the pending question ${dependsOn.join(", ")}, which no coordinator may ` +
        "settle on the owner's behalf",
    );
  }
  const red = state.ci?.known === true && state.ci.green !== true ? state.ci : null;
  const attributed = red === null ? null : red.attributed;
  if (red !== null) {
    if (attributed === null) {
      holds.push(
        "a red stands on main and nothing has attributed it yet, so no landing and no repair is " +
          "specific to it — the attribution is the next act",
      );
    } else if (action.kind === "repair") {
      if (action.repairs !== attributed.card) {
        holds.push(
          `the red on main is attributed to ${attributed.card} and this repair is for ` +
            `${String(action.repairs)}, so it is not the repair that red permits`,
        );
      }
    } else if (action.kind === "landing") {
      const invalidated = (action.checks ?? []).filter((c) => attributed.bodies.includes(c));
      if (invalidated.length > 0) {
        holds.push(
          `this landing's delivery checks ${invalidated.join(", ")} are among the bodies the red ` +
            `on main fails, so the red invalidates the evidence this landing would stand on`,
        );
      }
    }
  }
  if (holds.length > 0) {
    return {
      permitted: false,
      holds,
      why: `${action.kind} of ${action.card} is HELD by ${String(holds.length)} condition(s).`,
    };
  }
  return {
    permitted: true,
    holds: [],
    why:
      red === null
        ? `${action.kind} of ${action.card} is permitted: no condition specific to it holds.`
        : `${action.kind} of ${action.card} is permitted despite the red on main, which is ` +
          `attributed to ${String(attributed?.card)} and is not specific to this action.`,
  };
}

/* ── THE QUOTA REFUSAL, ITS RETRY INSTANT AND THE WAIT ───────────── */

/**
 * @typedef {object} Refusal
 * @property {string} kind   one of REFUSAL_KINDS
 * @property {?string} resetAt  the provider's stated reset instant, where the refusal carries one
 * @property {string} why
 */

/**
 * TELL A QUOTA REFUSAL FROM AN AUTHENTICATION OR CONFIGURATION FAILURE,
 * BECAUSE THEY ARRIVE WEARING THE SAME EXIT CODE AND THE RIGHT ANSWER
 * IS OPPOSITE. A quota refusal is waited out; an authentication or
 * configuration failure is never resolved by waiting and PARKS WITH A
 * QUESTION, because changing a model or an account to get past it is a
 * decision this coordinator does not hold.
 *
 * The classification is REPORTED at every call, so a text this reader
 * gets wrong is visible rather than silent.
 *
 * @param {string} text
 * @returns {Refusal}
 */
export function classifyRefusal(text) {
  const t = String(text ?? "");
  if (/\b(401|403|unauthori[sz]ed|authentication fail|invalid api key|invalid_api_key|expired token|no credentials|not logged in)\b/i.test(t)) {
    return {
      kind: "authentication",
      resetAt: null,
      why:
        "the refusal is an AUTHENTICATION failure, which no wait resolves: a credential does not " +
        "come back on a timer. It parks with a question — changing an account is not this " +
        "coordinator's decision to make.",
    };
  }
  if (/\b(model .* (not found|is not available|does not exist)|unknown model|unsupported|configuration error|invalid request|400 Bad Request)\b/i.test(t)) {
    return {
      kind: "configuration",
      resetAt: null,
      why:
        "the refusal is a CONFIGURATION failure, which no wait resolves. It parks with a " +
        "question — models and accounts are never changed without the configured permission, so " +
        "the fix is not one this coordinator may choose.",
    };
  }
  if (/\b(quota|rate limit|rate_limit|429|usage limit|insufficient_quota|over capacity|too many requests)\b/i.test(t)) {
    const iso =
      /\b(?:reset|retry|resume|try again|available)\w*[^\n]{0,40}?\b(20\d{2}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:?\d{2}))/i.exec(t);
    const epoch = /\b(?:reset|retry)[-_ ]?(?:at|after|s)?\b\D{0,12}(\d{10})\b/i.exec(t);
    const resetAt =
      iso !== null
        ? /** @type {string} */ (iso[1])
        : epoch !== null
          ? new Date(Number(epoch[1]) * 1000).toISOString()
          : null;
    return {
      kind: "quota",
      resetAt,
      why:
        resetAt === null
          ? "the refusal is a QUOTA refusal and names no reset instant, so the retry is scheduled " +
            "on a capped growing delay."
          : `the refusal is a QUOTA refusal and names its reset instant (${resetAt}), which is the ` +
            "retry instant — a provider's own figure beats a guessed delay.",
    };
  }
  return {
    kind: "none",
    resetAt: null,
    why: "nothing in this text is a provider refusal this reader recognises.",
  };
}

/**
 * THE NEXT RETRY INSTANT — the provider's own where the refusal carries
 * one, else a CAPPED exponential delay.
 *
 * IT IS AN INSTANT AND NEVER A DURATION, because the coordinator that
 * revisits it is not necessarily the one that recorded it: a successor
 * seat reads the record and a duration would have to be added to a start
 * it cannot see. The cap exists so a fourth refusal does not schedule a
 * retry for tomorrow.
 *
 * @param {Refusal} refusal
 * @param {number} attempts  how many refusals this work has already met, including this one
 * @param {number} nowMs
 * @returns {{ at: string, delayMs: number, source: string }}
 */
export function retryInstant(refusal, attempts, nowMs) {
  if (!Number.isFinite(nowMs)) {
    throw new UnattendedFinding(
      UNATTENDED_CODES.RETRY_INSTANT,
      "dispatch-brief: a retry instant is computed against a clock this caller supplies, and it " +
        "got no finite one. The clock is injected so a body drives this with a fake one rather " +
        "than sleeping, and a default here would be the hidden real clock that makes that " +
        "impossible.",
    );
  }
  if (refusal.resetAt !== null && refusal.resetAt !== undefined) {
    const at = Date.parse(refusal.resetAt);
    if (Number.isFinite(at)) {
      return {
        at: new Date(at).toISOString(),
        delayMs: Math.max(0, at - nowMs),
        source: "the provider's own stated reset instant",
      };
    }
  }
  const n = Math.max(1, Math.floor(attempts));
  const delayMs = Math.min(RETRY_CAP_MS, RETRY_BASE_MS * 2 ** (n - 1));
  return {
    at: new Date(nowMs + delayMs).toISOString(),
    delayMs,
    source: `a capped exponential delay — refusal ${String(n)}, ${String(delayMs)} ms, capped at ${String(RETRY_CAP_MS)} ms`,
  };
}

/**
 * THE RETRIES THIS BOUNDARY OWES A LOOK AT. The coordinator revisits the
 * recorded instant at each of its OWN boundaries while continuing other
 * eligible work — so this is a READ over the run records, never a wait,
 * and it separates the due from the scheduled rather than merging them.
 *
 * @param {{ attempt: string, assignment?: { id?: string } | null, retry?: ?{ at: string, attempts: number, why: string } }[]} records
 * @param {string} nowIso
 * @returns {{ due: any[], scheduled: any[] }}
 */
export function dueRetries(records, nowIso) {
  /** @type {any[]} */
  const due = [];
  /** @type {any[]} */
  const scheduled = [];
  for (const rec of records ?? []) {
    const retry = rec.retry;
    if (retry === undefined || retry === null || String(retry.at ?? "") === "") continue;
    const row = {
      attempt: rec.attempt,
      work: rec.assignment?.id ?? "",
      at: retry.at,
      attempts: retry.attempts,
      why: retry.why,
    };
    if (Date.parse(String(retry.at)) <= Date.parse(String(nowIso))) due.push(row);
    else scheduled.push(row);
  }
  due.sort((a, b) => Date.parse(String(a.at)) - Date.parse(String(b.at)));
  scheduled.sort((a, b) => Date.parse(String(a.at)) - Date.parse(String(b.at)));
  return { due, scheduled };
}

/* ── THE QUESTION ENTRY ──────────────────────────────────────────── */

/**
 * @typedef {object} RoomQuestion
 * @property {string} id
 * @property {string} room     the room file, root-relative
 * @property {string} at       the date the entry carries
 * @property {string} state    one of QUESTION_STATES
 * @property {string[]} cards  the cards this question holds
 * @property {string} cause
 * @property {string} ref
 * @property {string} resolution  the resolution's evidence, or ""
 */

/**
 * THE ENTRY, RENDERED — the room's own turn shape with a marked question
 * in it, and never a ruling.
 *
 * The turn heading is `method/rooms/ROOM-FORMAT.md`'s — the role, the
 * model and session in parentheses, the date — with the question's id and
 * state appended, so an entry is found by the id a dispatch order names
 * and read by a person the same way every other turn is. The MARKER is
 * the first thing in the body for the reason the format's own entry rule
 * gives: a room is read by people who were not in the conversation, and
 * a question that reads as a settled thing is worse than no entry.
 *
 * @param {{ id: string, role?: string, model: string, session: string, at: string, cards: string[], cause: string, ref: string, state?: string, resolution?: string }} q
 * @returns {string}
 */
export function questionEntry(q) {
  if (!QUESTION_ID_PATTERN.test(String(q.id ?? ""))) {
    throw new UnattendedFinding(
      UNATTENDED_CODES.QUESTION_SHAPE,
      `dispatch-brief: ${JSON.stringify(q.id)} is not a question id. It is Q- followed by at ` +
        "least three digits, because the dispatch order names it on every card it holds and the " +
        "lane cut refuses by it — an id a reader cannot tell from prose is a link nothing follows.",
    );
  }
  for (const [name, text] of [["cause", q.cause], ["ref", q.ref], ["resolution", q.resolution]]) {
    if (/[\r\n]/.test(String(text ?? ""))) {
      throw new UnattendedFinding(
        UNATTENDED_CODES.QUESTION_SHAPE,
        `dispatch-brief: a question entry's ${name} carries a line break, and a line break rendered ` +
          "into a room opens a heading the room did not write — a forged turn the reader stops at, so " +
          "the entry would hold nothing. Fold the text onto one line.",
      );
    }
  }
  const state = String(q.state ?? "pending");
  if (!QUESTION_STATES.includes(state)) {
    throw new UnattendedFinding(
      UNATTENDED_CODES.QUESTION_SHAPE,
      `dispatch-brief: ${JSON.stringify(state)} is not a question state — it is ` +
        `${QUESTION_STATES.join(" or ")}, and the lane cut refuses a dependent card by exactly ` +
        "that word.",
    );
  }
  const cards = (q.cards ?? []).map((c) => String(c).trim()).filter((c) => c !== "");
  if (cards.length === 0) {
    throw new UnattendedFinding(
      UNATTENDED_CODES.QUESTION_SHAPE,
      "dispatch-brief: a question entry names the cards it holds, and this one names none. A " +
        "question that holds nothing is a note; a question that holds cards and does not say " +
        "which is a hold nobody can lift.",
    );
  }
  if (state === "resolved" && String(q.resolution ?? "").trim() === "") {
    throw new UnattendedFinding(
      UNATTENDED_CODES.QUESTION_SHAPE,
      "dispatch-brief: a resolved question entry carries the resolution's evidence. A state that " +
        "changed with nothing behind it is the seat settling a decision it does not hold, which " +
        "is the one thing this entry exists not to be.",
    );
  }
  return [
    `## @${q.role ?? "orchestrator"} (${q.model} @${q.session}) — ${q.at} — QUESTION ${q.id} (${state})`,
    "",
    `**${QUESTION_MARKER}.** ${q.cause} (${q.ref})`,
    "",
    `Cards held: ${cards.join(", ")}`,
    `State: ${state}${state === "resolved" ? ` — ${String(q.resolution).trim()}` : ""}`,
    "",
  ].join("\n");
}

/**
 * READ EVERY QUESTION OUT OF THE ROOMS. The room is the record and this
 * is its reader: no card gains a field, so this is the only place the
 * link between a question and the cards it holds exists.
 *
 * @param {{ path: string, content: string }[]} rooms
 * @returns {RoomQuestion[]}
 */
export function readQuestions(rooms) {
  /** @type {RoomQuestion[]} */
  const out = [];
  for (const room of rooms ?? []) {
    const lines = String(room.content ?? "").split("\n");
    for (let i = 0; i < lines.length; i += 1) {
      const head = /^##\s+.*?—\s*(20\d{2}-\d{2}-\d{2})[^—]*—\s*QUESTION\s+(Q-\d{3,})\s*\((pending|resolved)\)\s*$/.exec(
        /** @type {string} */ (lines[i]),
      );
      if (head === null) continue;
      /** @type {string[]} */
      const body = [];
      for (let j = i + 1; j < lines.length && !String(lines[j]).startsWith("## "); j += 1) {
        body.push(/** @type {string} */ (lines[j]));
      }
      const text = body.join("\n");
      const cards = /^Cards held:\s*(.+?)\s*$/m.exec(text);
      const state = /^State:\s*(pending|resolved)\s*(?:—\s*(.+?)\s*)?$/m.exec(text);
      const cause = new RegExp(`\\*\\*${QUESTION_MARKER.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\.\\*\\*\\s*([\\s\\S]*?)\\s*\\(([^()]*)\\)\\s*$`, "m").exec(text);
      out.push({
        id: /** @type {string} */ (head[2]),
        room: room.path,
        at: /** @type {string} */ (head[1]),
        // THE HEADING AND THE BODY BOTH CARRY THE STATE AND THE BODY WINS,
        // because a resolution is appended to the body and a heading that
        // was not re-edited would otherwise hold a card the room has let go.
        state: state === null ? /** @type {string} */ (head[3]) : /** @type {string} */ (state[1]),
        cards:
          cards === null
            ? []
            : String(cards[1]).split(",").map((c) => c.trim()).filter((c) => c !== ""),
        cause: cause === null ? "" : String(cause[1]).replace(/\s+/g, " ").trim(),
        ref: cause === null ? "" : String(cause[2]).trim(),
        resolution: state === null || state[2] === undefined ? "" : String(state[2]),
      });
    }
  }
  return out;
}

/**
 * WHICH CARD IS HELD BY WHICH PENDING QUESTION. A card named by a
 * RESOLVED question is not held — that is the "same resolved state" the
 * lane cut refuses by, and it is one derivation feeding both the display
 * and the refusal rather than two that can disagree.
 *
 * @param {RoomQuestion[]} questions
 * @returns {Map<string, RoomQuestion>}
 */
export function questionHolds(questions) {
  /** @type {Map<string, RoomQuestion>} */
  const held = new Map();
  for (const q of questions ?? []) {
    if (q.state !== "pending") continue;
    for (const card of q.cards) if (!held.has(card)) held.set(card, q);
  }
  return held;
}

/** Every room file this checkout tracks, as the reader above takes them. */
/** @param {string} root @returns {{ path: string, content: string }[]} */
export function roomFiles(root = repoRoot) {
  return trackedFiles(root)
    .filter((rel) => /^docs\/rooms\/[^/]+\.md$/.test(rel))
    .map((rel) => ({ path: rel, content: readFileSync(path.join(root, rel), "utf8") }));
}

/* ── THE RETURN BRIEF ────────────────────────────────────────────── */

/**
 * @typedef {object} MergeRow
 * @property {string} sha       the merge commit
 * @property {string} at        its committer instant
 * @property {string} subject
 * @property {string} tested    the sha a run actually tested, or ""
 * @property {string} conclusion the run's conclusion, or `unknown`
 * @property {string} run       the run id, or ""
 * @property {string} runAt     the run's own creation instant, or ""
 * @property {string} evidence  one line saying WHERE that conclusion came from
 */

/**
 * THE PUSH EVIDENCE IS THE RUNNER'S RUN AND NOTHING ELSE.
 *
 * **A PUSH WITH NO RUN IS REPORTED UNKNOWN AND NEVER INFERRED FROM A
 * COMMIT'S TIMESTAMP.** That is the whole of this function's discipline
 * and it is measured rather than fastidious: main sat red for roughly
 * five hours on 2026-09-01 while a seat reported four green suites,
 * because a local battery and a runner are different measurements and
 * only one of them runs on a machine that is not yours.
 *
 * **A MERGE COMMIT IS ALMOST NEVER A RUN'S HEAD SHA IN THIS PROJECT**,
 * because the checkpoint lands on top of it before the push. So the run
 * a merge is reported against is the OLDEST run whose tested sha is that
 * merge or a commit NEWER than it on the same first-parent line — the
 * first run that actually covered the merge. That is derived from the
 * line this caller hands in and never from two timestamps: a run created
 * after a commit's date says nothing about whether it tested it.
 *
 * **AND AN OLDER GREEN RUN IS NEVER PROOF OF THE CURRENT TIP.** The
 * search runs FORWARD from the merge, never backward: a run at an
 * ancestor is evidence about the ancestor.
 *
 * **A MERGE OLDER THAN THE INSTANT WHOSE RUN FINISHED AFTER IT IS STILL
 * NEWS.** The owner left while a run was in flight; its conclusion
 * arrived in their absence, and a window filtering on the COMMIT's date
 * would drop exactly the row they came back for.
 *
 * @param {{ sha: string, at: string, subject: string, merge: boolean }[]} line
 *   the first-parent log, NEWEST FIRST
 * @param {?RunnerRun[]} runs   null where the runner's history is unreachable
 * @param {string} since
 * @returns {MergeRow[]}
 */
export function mergeEvidence(line, runs, since) {
  const commits = line ?? [];
  /** @type {MergeRow[]} */
  const out = [];
  for (let i = 0; i < commits.length; i += 1) {
    const m = /** @type {{sha: string, at: string, subject: string, merge: boolean}} */ (commits[i]);
    if (m.merge !== true) continue;
    // THIS MERGE AND EVERYTHING NEWER THAN IT ON THE SAME LINE. A run
    // that tested any of these tested a tree that carries this merge.
    const covering = new Set(commits.slice(0, i + 1).map((c) => c.sha));
    const candidates = (runs ?? []).filter((r) => covering.has(r.headSha));
    candidates.sort((a, b) => Date.parse(String(a.createdAt)) - Date.parse(String(b.createdAt)));
    const run = candidates.length === 0 ? null : /** @type {RunnerRun} */ (candidates[0]);
    // THE COMPARISON IS ON MILLISECONDS AND NEVER ON THE TEXT, for the
    // reason `firstParentLine` normalises: two instants written in two
    // offsets order correctly as times and wrongly as strings.
    const sinceMs = Date.parse(String(since));
    const inWindow = Date.parse(String(m.at)) >= sinceMs;
    const runAfter = run !== null && Date.parse(String(run.createdAt)) >= sinceMs;
    if (!inWindow && !runAfter) continue;
    if (runs === null) {
      out.push({
        sha: m.sha,
        at: m.at,
        subject: m.subject,
        tested: "",
        conclusion: "unknown",
        run: "",
        runAt: "",
        evidence:
          "the runner's history is UNREACHABLE from here, so this push's run is unknown — and it " +
          "is reported unknown rather than inferred from the commit's own timestamp",
      });
      continue;
    }
    if (run === null) {
      out.push({
        sha: m.sha,
        at: m.at,
        subject: m.subject,
        tested: "",
        conclusion: "unknown",
        run: "",
        runAt: "",
        evidence:
          "no run tested this merge or anything newer than it on this line, so this push left NO " +
          "run and there is no conclusion to report. An older run at an ancestor is evidence " +
          "about the ancestor and is not borrowed here.",
      });
      continue;
    }
    out.push({
      sha: m.sha,
      at: m.at,
      subject: m.subject,
      tested: run.headSha,
      conclusion: String(run.conclusion) === "" ? "in progress" : String(run.conclusion),
      run: String(run.databaseId),
      runAt: String(run.createdAt),
      evidence:
        (runAfter && !inWindow
          ? `run ${String(run.databaseId)} FINISHED AFTER the instant asked about, so this older ` +
            "merge is reported with its new conclusion — "
          : "") +
        `run ${String(run.databaseId)} tested ${run.headSha}` +
        (run.headSha === m.sha
          ? " (the merge commit itself)"
          : ", the first commit at or after this merge that any run covered") +
        `, created ${run.createdAt}`,
    });
  }
  return out;
}

/**
 * @typedef {object} ReturnBriefInput
 * @property {string} since
 * @property {MergeRow[]} merges
 * @property {RoomQuestion[]} questions
 * @property {{ card: string, why: string, wake: string, ref: string }[]} parked
 * @property {{ taskId: string, branch: string, worktree: string, phase: string }[]} lanes
 * @property {{ card: string, parent: string, evidence: string, attempt: string, state: string }[]} repairs
 * @property {{ due: any[], scheduled: any[] }} retries
 * @property {{ at: string, card: string, seat: string, tier: string, merge: string }[]} meters
 * @property {string[]} unknowns   what this brief cannot know, said plainly
 */

/**
 * THE ONE PAGE THE OWNER READS ON RETURN, DERIVED FROM RECORDS THAT
 * ALREADY EXIST — the cards, the rooms, the run records, the meters
 * records and the runner's runs. Nothing here is remembered by this
 * loop, and nothing here is a verifier's material: a return brief that
 * carried a verifier's findings would be the blind-phase leak that role
 * file spends four paragraphs on, arriving by a side door.
 *
 * **WHAT IT CANNOT KNOW IS SAID PLAINLY AND IS NOT AN APOLOGY.** A run
 * still in progress, a push with no run, a lane whose phase nobody
 * reported: each is a row here that names the gap rather than a silence
 * the owner has to notice.
 *
 * @param {Ctx} ctx
 * @param {ReturnBriefInput} input
 * @returns {Rec[]}
 */
export function returnBriefRecs(ctx, input) {
  const t = treeProv(ctx.ref, "the cards, the rooms and the merge log this checkout carries");
  const live = liveProv(ctx.at, ctx.host, "the run records, the worktree list and the runner's runs");
  /** @type {Rec[]} */
  const recs = [
    note("THE RETURN BRIEF — what happened while you were away, derived from records that already"),
    note("exist and never from this loop's memory. Every row names where it came from; every gap"),
    note("names itself rather than being left to be noticed."),
    value(`since: ${input.since}`, live),
    blank(),
    note("WHAT MERGED — with its merge commit, the commit a run actually TESTED, and that run's"),
    note("conclusion. A push with no run is UNKNOWN, never inferred from a commit's timestamp."),
  ];
  if (input.merges.length === 0) recs.push(value("nothing merged in this window", t));
  for (const m of input.merges) {
    // THE SUBJECT IS TRUNCATED AND SAYS SO. This project's merge subjects
    // are paragraphs — one of them is 3,000 bytes — and a return brief is
    // ONE PAGE by its own contract. The sha is beside it and `git show`
    // is the whole of the recovery, so nothing here is unrecoverable; a
    // truncation that did not announce itself would be.
    const subject =
      m.subject.length > 160 ? `${m.subject.slice(0, 160)}… [truncated; git show ${m.sha.slice(0, 8)}]` : m.subject;
    // THE METERS RECORDS ARE KEYED BY THE CARD AND NOT BY THE MERGE SHA,
    // and that is measured rather than chosen: the readings are appended
    // while the merge is still STAGED, so the field the record calls
    // `merge` is the BENCH TIP the readings were taken at and the merge
    // commit does not exist yet. The card id in the merge's own subject
    // is the key both sides actually share.
    const card = /^Merge\s+(T-\d+(?:-s\d+)?)\b/.exec(m.subject);
    const seats = card === null ? [] : input.meters.filter((x) => x.card === card[1]);
    recs.push(
      value(`${m.sha} at ${m.at} — ${subject}`, t),
      value(
        `   tested ${m.tested === "" ? "(no run)" : m.tested} · conclusion ${m.conclusion} — ${m.evidence}`,
        live,
      ),
      value(
        seats.length === 0
          ? "   seats: no meters record names this merge's card, so which seats produced it is not known here"
          : `   seats: ${seats.map((x) => `${x.seat} (${x.card}, tier ${x.tier})`).join("; ")}`,
        t,
      ),
    );
  }
  recs.push(
    blank(),
    note("WHAT WAS PARKED, AND WHY — each with the wake condition that brings it back, so a fresh"),
    note("coordinator inherits the park rather than restarting the cycle that produced it."),
  );
  if (input.parked.length === 0) recs.push(value("nothing is parked", t));
  for (const p of input.parked) {
    recs.push(value(`${p.card} — ${p.why}`, t), value(`   wakes on: ${p.wake} (${p.ref})`, t));
  }
  recs.push(
    blank(),
    note("THE QUESTION ENTRIES — a decision this coordinator may not make, marked as a question in"),
    note("its room and never as a ruling. A PENDING one holds every card it names; a RESOLVED one"),
    note("holds none, and its resolution carries the evidence behind it."),
  );
  if (input.questions.length === 0) recs.push(value("no question entry stands in any room", t));
  for (const q of input.questions) {
    recs.push(
      value(`${q.id} (${q.state}) in ${q.room}, dated ${q.at} — ${q.cause}`, t),
      value(
        `   cards held: ${q.cards.join(", ") || "none"}${q.resolution === "" ? "" : ` · resolved: ${q.resolution}`}`,
        t,
      ),
    );
  }
  recs.push(blank(), note("THE LANES LIVE AND THEIR PHASE — a phase nobody reported is reported as unreported."));
  if (input.lanes.length === 0) recs.push(value("no lane is live", live));
  for (const l of input.lanes) {
    recs.push(value(`${l.taskId} ${l.phase} — ${l.branch} at ${l.worktree}`, live));
  }
  recs.push(
    blank(),
    note("THE REPAIRS ADMITTED — each with the work it was derived FROM, the failure evidence that"),
    note("justified it, and the attempt it was admitted at. A repair with no origin is not one."),
  );
  if (input.repairs.length === 0) recs.push(value("no repair was admitted by derivation", live));
  for (const r of input.repairs) {
    recs.push(
      value(`${r.card} (${r.state}) — derived from ${r.parent}, at attempt ${r.attempt}`, live),
      value(`   failure evidence: ${r.evidence}`, live),
    );
  }
  recs.push(
    blank(),
    note("THE RECORDED RETRIES — a spawn refused for quota is a scheduled retry this loop returns"),
    note("to at its own boundaries, never a block on its only control loop."),
  );
  if (input.retries.due.length === 0 && input.retries.scheduled.length === 0) {
    recs.push(value("no retry is recorded on any run record", live));
  }
  for (const r of input.retries.due) {
    recs.push(value(`DUE NOW — ${r.work} attempt ${r.attempt}, instant ${r.at}: ${r.why}`, live));
  }
  for (const r of input.retries.scheduled) {
    recs.push(value(`scheduled — ${r.work} attempt ${r.attempt}, instant ${r.at}: ${r.why}`, live));
  }
  recs.push(
    blank(),
    note("WHAT THIS BRIEF CANNOT KNOW — said plainly, because a gap the reader has to notice is a"),
    note("gap the reader will not notice."),
  );
  if (input.unknowns.length === 0) {
    recs.push(value("every row above was derived from a record this command could read", live));
  }
  for (const u of input.unknowns) recs.push(value(u, live));
  recs.push(
    blank(),
    note("AND IT COPIES NO VERIFIER-ONLY MATERIAL. An attack set, a ground truth and a phase-one"),
    note("return are sealed inputs; this answer reads cards, rooms, run records, meters records"),
    note("and the runner's runs, and it reads none of those four."),
  );
  return recs;
}

/* ── THE RUNNER'S HISTORY, AND WHAT IT IS WHEN IT IS NOT THERE ────── */

/**
 * THE RUNNER IS A MACHINE THAT IS NOT YOURS, SO REACHING IT IS AN IO AND
 * NOT A DERIVATION. Every call goes through this seam: a body drives the
 * return brief and the attribution over FIXTURE runs and FIXTURE logs
 * with no network, no `gh` and no credentials, which is the only way
 * either is testable at all.
 *
 * **AN UNREACHABLE RUNNER IS `null` AND NEVER AN EMPTY LIST.** The two
 * are opposite claims — "this project has no runs" and "I could not ask"
 * — and every reader downstream branches on which one it got. That
 * distinction is the whole reason this returns a nullable.
 *
 * ── THE REPLAY SEAM, AND WHY IT IS AN ENVIRONMENT VARIABLE ──────────
 * `SUPERTASKR_RUNNER_RUNS` names a file holding the runner's answer as
 * JSON — or the word `none`, which is the UNREACHABLE runner said out
 * loud. It exists for two readers and they want the same thing: a body
 * that drives this command END TO END as a fresh process cannot inject a
 * function into it, and a person re-deriving somebody else's return
 * brief months later cannot re-run a history the runner has since
 * expired. Both need the same answer replayed rather than re-asked.
 * `SUPERTASKR_RUNNER_LOGS` is its other half: a directory holding
 * `<run id>.log`.
 *
 * **IT IS A REPLAY AND NEVER A DEFAULT.** Unset, the runner is asked; a
 * file that will not parse is the unreachable answer rather than an
 * empty one, on this function's own rule two lines up.
 *
 * @returns {{ runs: (root: string) => ?RunnerRun[], log: (root: string, id: string) => ?string }}
 */
export function defaultRunnerIo() {
  const replayRuns = (process.env["SUPERTASKR_RUNNER_RUNS"] ?? "").trim();
  const replayLogs = (process.env["SUPERTASKR_RUNNER_LOGS"] ?? "").trim();
  return {
    runs: (root) => {
      if (replayRuns !== "") {
        if (replayRuns === "none") return null;
        try {
          const parsed = JSON.parse(readFileSync(replayRuns, "utf8"));
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          return null;
        }
      }
      return liveRuns(root);
    },
    log: (root, id) => {
      if (replayLogs !== "") {
        const file = path.join(replayLogs, `${id}.log`);
        return existsSync(file) ? readFileSync(file, "utf8") : null;
      }
      return liveLog(root, id);
    },
  };
}

/**
 * The runner, actually asked. Separated from the seam above so the replay
 * branch and the live branch are two named things rather than one
 * function with a flag in the middle of it.
 *
 * @param {string} root
 * @returns {?RunnerRun[]}
 */
function liveRuns(root) {
  const out = spawnSync(
    "gh",
    ["run", "list", "--branch", "main", "--limit", "60", "--json", "databaseId,headSha,conclusion,createdAt"],
    { cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (out.error !== undefined || out.status !== 0 || typeof out.stdout !== "string") return null;
  try {
    const parsed = JSON.parse(out.stdout);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * One run's failing log, actually asked for.
 *
 * @param {string} root
 * @param {string} id
 * @returns {?string}
 */
function liveLog(root, id) {
  const out = spawnSync("gh", ["run", "view", id, "--log-failed", "--attempt", "1"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  // A LOG IS ASKED FOR ONLY ON A RED, and `gh` answers non-zero for a run
  // it cannot show as well as for a run with no failed step — so the
  // stdout is taken when there is any, and null otherwise.
  if (typeof out.stdout === "string" && out.stdout.trim() !== "") return out.stdout;
  return null;
}

/**
 * THE FIRST-PARENT LINE THIS CHECKOUT CARRIES, newest first, with each
 * commit saying whether it is a MERGE. It is one git call, and the merge
 * flag is read off the parent count rather than off the subject: a
 * message opening with the word is prose, and the graph is the fact.
 *
 * @param {string} root
 * @param {number} [limit]
 * @returns {{ sha: string, at: string, subject: string, merge: boolean }[]}
 */
export function firstParentLine(root, limit = 120) {
  const raw = git(root, [
    "log",
    "--first-parent",
    `--max-count=${String(limit)}`,
    "--format=%H%x09%cI%x09%P%x09%s",
  ]);
  /** @type {{ sha: string, at: string, subject: string, merge: boolean }[]} */
  const out = [];
  for (const row of raw.split("\n")) {
    if (row.trim() === "") continue;
    const [sha, at, parents, ...rest] = row.split("\t");
    out.push({
      sha: String(sha),
      // NORMALISED TO UTC, because `%cI` carries the committer's own
      // offset and a run's `createdAt` carries `Z`: comparing those two
      // as STRINGS puts a `+03:00` commit three hours in the wrong place,
      // silently, and the window this feeds is decided by exactly that
      // comparison.
      at: new Date(String(at)).toISOString(),
      subject: rest.join("\t"),
      merge: String(parents ?? "").trim().split(/\s+/).filter((x) => x !== "").length > 1,
    });
  }
  return out;
}

/**
 * THE METERS RECORDS — `docs/checkpoints/meters.jsonl`, one JSON object
 * per line, each keyed to the merge it was appended at (T-297 parses the
 * same file for the bands). The return brief reads them for ONE thing:
 * which seats actually produced each merge in its window. That is a fact
 * about the work the owner missed and it lives nowhere else — the card
 * carries the INTENT (`builder:`, `verifier:`) and this file carries
 * what ran.
 *
 * A FILE THAT IS NOT THERE IS AN EMPTY LIST AND NOT AN ERROR: a fresh
 * project has no readings, and a return brief that refused to render
 * because of that would be useless on the day it is most needed. A line
 * that will not parse is skipped for the reason `allRecords` skips a
 * damaged record — one bad line may not hide every good one.
 *
 * @param {string} root
 * @returns {{ at: string, card: string, seat: string, tier: string, merge: string }[]}
 */
export function metersRecords(root = repoRoot) {
  /* THE PATH IS A CONSTANT JOINED TO THE ROOT, and it is spelled that way
     rather than as `path.join(root, "docs", ...)` because the DOCS GATE's
     scanner reads a docs-shaped literal joined to a base and has to
     resolve that base — a function PARAMETER is a base it cannot
     evaluate, and the honest answer it gives is "a reader may be
     MISSING". Naming the relative path once, above, is this file's own
     idiom for every other document it reads. */
  const file = path.join(root, METERS_REL_PATH);
  if (!existsSync(file)) return [];
  /** @type {{ at: string, card: string, seat: string, tier: string, merge: string }[]} */
  const out = [];
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line.trim() === "") continue;
    try {
      const rec = JSON.parse(line);
      out.push({
        at: String(rec.at ?? ""),
        card: String(rec.card ?? ""),
        seat: String(rec.seat ?? ""),
        tier: String(rec.tier ?? ""),
        merge: String(rec.merge ?? ""),
      });
    } catch {
      // one unparseable line may not hide every readable one
    }
  }
  return out;
}

/**
 * THE RETURN BRIEF'S INPUT, ASSEMBLED FROM RECORDS THAT ALREADY EXIST
 * (T-322). It is a function here, exported and with an IO seam, for the
 * reason `succession` above is: a body has to drive it over a FIXTURE
 * checkout with fixture runs and a fixture room, without a network, a
 * `gh` or a credential.
 *
 * **EVERY ROW COMES FROM A RECORD AND NOTHING IS REMEMBERED.** The cards
 * (their repair ledgers and their statuses), the rooms (the question
 * entries), the run records (the admissions, the retries, the live
 * writers), the meters records and the runner's runs — and where one of
 * those cannot be read, the row says so rather than being dropped.
 *
 * **THE RUN RECORDS ARE AN INPUT AND NOT A READ HERE**, and that is a
 * module boundary rather than a preference: `run-record.mjs` imports THIS
 * file, so a read of `allRecords` here would be a cycle. `brief.mjs` is
 * the one module that imports both halves and it is where the records
 * are gathered — the same split T-324 already takes for the admission
 * ledger.
 *
 * @param {Ctx} ctx
 * @param {{ since: string, records: any[], io?: ReturnType<typeof defaultRunnerIo>, runs?: any, lanes?: any[] }} opts
 * @returns {ReturnBriefInput}
 */
export function assembleReturnBrief(ctx, opts) {
  const io = opts.io ?? defaultRunnerIo();
  const since = new Date(opts.since).toISOString();
  const runs = opts.runs === undefined ? io.runs(ctx.root) : opts.runs;
  const line = firstParentLine(ctx.root);
  const merges = mergeEvidence(line, runs, since);
  const questions = readQuestions(roomFiles(ctx.root));
  const records = opts.records;
  const held = questionHolds(questions);

  /** @type {{ card: string, why: string, wake: string, ref: string }[]} */
  const parked = [];
  for (const [id, card] of ctx.cards) {
    // THE PARK IS READ OFF THE CARD'S OWN LEDGER, never inferred: an
    // entry carrying a wake IS the park, and a card whose repair is
    // still running carries none. A brief that guessed which repairs
    // were parked would be reporting its own arithmetic to the owner.
    const history = repairLedger(readFileSync(path.join(ctx.root, card.file), "utf8"));
    const last = history[history.length - 1];
    if (last === undefined || String(last.wake ?? "") === "") continue;
    parked.push({
      card: id,
      why: `the repair parked after ${String(history.length)} attempt(s); the last was ${last.remedy} and the failure state was ${last.outcome}`,
      wake: String(last.wake),
      ref: last.ref,
    });
  }
  for (const q of questions) {
    if (q.state !== "pending") continue;
    for (const c of q.cards) {
      parked.push({
        card: c,
        why: `held by the pending question ${q.id} — ${q.cause}`,
        wake: "owner-decision",
        ref: q.room,
      });
    }
  }

  /** @type {{ card: string, parent: string, evidence: string, attempt: string, state: string }[]} */
  const repairs = [];
  for (const rec of records) {
    const a = rec.admission;
    if (a === null || a === undefined || a.kind !== "derived") continue;
    repairs.push({
      card: a.card,
      parent: String(a.parent ?? "unnamed"),
      evidence: a.evidence === "" ? "none was recorded on the admission" : a.evidence,
      attempt: rec.attempt,
      state: rec.state,
    });
  }

  const lanes = (opts.lanes ?? ctx.lanes).map((/** @type {any} */ l) => {
    // THE PHASE IS THE NEWEST RUN RECORD'S, AND A LANE WITH NO RECORD IS
    // REPORTED UNREPORTED. A card's `status:` is the board's claim about
    // a lane and the lane list is what holds ground (lane-protocol rule
    // 7), so a phase taken from the board would be the under-reporting
    // this brief exists to name.
    const mine = records.filter((r) => String(r.assignment?.id ?? "") === l.taskId);
    const newest = mine[mine.length - 1];
    return {
      taskId: l.taskId,
      branch: l.branch,
      worktree: l.path,
      phase:
        newest === undefined
          ? "phase UNREPORTED — no run record names this lane, so nothing on disk says who is on it"
          : `${String(newest.assignment?.role ?? "unknown role")} ${newest.state} (attempt ${newest.attempt})`,
    };
  });

  /** @type {string[]} */
  const unknowns = [];
  if (runs === null) {
    unknowns.push(
      "the runner's history is UNREACHABLE from this checkout, so EVERY push above is reported " +
        "with an unknown conclusion. Nothing here is inferred from a commit's timestamp.",
    );
  }
  const noRun = merges.filter((m) => m.run === "");
  if (runs !== null && noRun.length > 0) {
    unknowns.push(
      `${String(noRun.length)} merge(s) above left NO run on the runner — ${noRun.map((m) => m.sha.slice(0, 8)).join(", ")} ` +
        "— so whether the tree was green after them is not known here.",
    );
  }
  for (const m of merges.filter((x) => x.conclusion === "in progress")) {
    unknowns.push(`run ${m.run} for ${m.sha.slice(0, 8)} is STILL IN PROGRESS, so its conclusion is not yet a fact.`);
  }
  for (const l of lanes.filter((x) => x.phase.startsWith("phase UNREPORTED"))) {
    unknowns.push(`${l.taskId} has a live worktree and no run record, so its phase is unreported.`);
  }
  if (held.size > 0) {
    unknowns.push(
      `${String(held.size)} card(s) are held by a pending question, and what the owner will rule ` +
        "is exactly what this loop may not decide.",
    );
  }
  return {
    since,
    merges,
    questions,
    parked,
    lanes,
    repairs,
    retries: dueRetries(records, ctx.at),
    meters: metersRecords(ctx.root),
    unknowns,
  };
}


/* ────────────────────────────────────────────────────────────────────
 * ARM FIFTEEN — THE EXPRESS PATH INSIDE THE BOUNDED TIER (T-320).
 *
 * **IT IS A SHORT ROAD THROUGH THE EXISTING ONE, NEVER A SECOND ROAD.**
 * Everything this arm does it does by calling what already exists: the
 * card is preflighted by `card-preflight.mjs`, admitted by `admit`
 * (T-324) against the grant `grantState` reads (T-319), classified by
 * `classifyTier`, cut by `runDispatchLane` and recorded by
 * `run-record.mjs`. What is NEW here is only the three things the road
 * did not have: a CARD SHAPE the arm can write from an outcome sentence
 * and a fence, an ELIGIBILITY MEASUREMENT printed as findings, and the
 * WITHDRAWAL that puts a change back on the ordinary path.
 *
 * **AND THIS ARM ADDS NO SECOND ADMISSION.** It calls `admit` to MEASURE
 * whether the grant permits the change — a read, writing no record and
 * therefore consuming no approval, since the ledger every mode counts
 * against is the run records themselves. The admission that BINDS is the
 * lane cut's, made by `dispatchLanePlan` exactly as it is for every other
 * card. A reader who wants to know whether an approval was spent looks at
 * the run records and at nothing this arm keeps.
 *
 * WHAT THE BOUNDED TIER SAVES, AND WHAT IT DOES NOT. The bounded contract
 * (method/tasks/TASK-FORMAT.md, The tier) buys no verifier, so the flow
 * runs the executor only: no bench and no phase 1. It does NOT save the
 * admission, the preflight, the keeper at the base, the fence manifest or
 * the port — those are what make the fence bounded in the first place,
 * and a fast path that skipped them would be fast because it checked
 * nothing.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * The label an express-dispatched card carries, and the word a withdrawal
 * withdraws. It is a LABEL on the card rather than a frontmatter field on
 * purpose: `method/tasks/TASK-FORMAT.md` owns the field set, a new field
 * is a change to every reader of a card, and what the express path needs
 * recorded is one dated line saying this card took the short road.
 */
export const EXPRESS_LABEL = "express";

/**
 * THE CONVENTIONS BULLET THIS ARM IS ANSWERABLE TO, by its own opener.
 *
 * It is named here for the reason the port and scratch phrases beside it
 * are: the context pack is DERIVED by searching this directory's sources
 * for the openers `docs/CONVENTIONS.md` publishes, so a rule no script
 * cites reaches no seat's pack. A seat whose fence implicates the express
 * path should meet the rule in its brief rather than have to go looking.
 *
 * IT IS THE BULLET'S WHOLE BOLDED OPENER AND THE OPENER IS KEPT SHORT
 * ENOUGH TO BE ONE, which is a constraint on the DOCUMENT rather than on
 * this line: the pack captures a bolded opener up to a fixed width and
 * then requires the bullet to open with exactly what it captured, so an
 * opener longer than that width is truncated MID-WORD and the pack throws
 * the moment any script cites it. Bold the rule and leave the rest of the
 * sentence outside the bold.
 */
export const EXPRESS_BULLET_PHRASE = "THE EXPRESS PATH IS A SHORT ROAD THROUGH THE ORDINARY RITUAL";

/** The heading an express card's own record sits under, inside its notes. */
export const EXPRESS_HEADING = "Express path";

/** The opener of the dated line that PUTS the label on a card. */
export const EXPRESS_LABEL_OPENER = "EXPRESS PATH";

/** The opener of the dated line that TAKES it off again. */
export const EXPRESS_WITHDRAWN_OPENER = "EXPRESS PATH WITHDRAWN";

/**
 * THE FIVE REQUIREMENTS, IN THE ORDER THE CARD'S THIRD CRITERION NAMES
 * THEM. The order is the printing order and the refusal order, so two
 * readers of one eligibility report meet the findings in one sequence.
 */
export const EXPRESS_REQUIREMENTS = Object.freeze([
  "admission",
  "fence",
  "keeper",
  "guard-class",
  "reversible",
]);

/**
 * EVERY REFUSAL CARRIES A CODE, on `run-record.mjs`'s own model and for
 * its reason: a refusal a caller can only match on a sentence becomes
 * prose the day the sentence is improved.
 */
export const EXPRESS_CODES = Object.freeze({
  NO_OUTCOME: "EXPRESS_NO_OUTCOME",
  OUTCOME_SHAPE: "EXPRESS_OUTCOME_SHAPE",
  OUTCOME_LINES: "EXPRESS_OUTCOME_LINES",
  NO_FENCE: "EXPRESS_NO_FENCE",
  NO_EARS: "EXPRESS_NO_EARS",
  NO_PLACE: "EXPRESS_NO_PLACE",
  NO_GRANT: "EXPRESS_NO_GRANT",
  ID_TAKEN: "EXPRESS_ID_TAKEN",
  INELIGIBLE: "EXPRESS_INELIGIBLE",
  NO_CARD: "EXPRESS_NO_CARD",
  NOT_EXPRESS: "EXPRESS_NOT_EXPRESS",
  NO_REASON: "EXPRESS_NO_REASON",
});

/** An express act this arm was asked for and will not perform. */
export class ExpressFinding extends DispatchLaneFinding {
  /** @param {string} code @param {string} message */
  constructor(code, message) {
    super(message);
    this.name = "ExpressFinding";
    /** @type {string} */
    this.code = code;
  }
}

/**
 * The sentence three of this repository's generators write into the head
 * of every file they generate. It is the ONE marker a reader can use to
 * tell a generated file from a written one without keeping a list that
 * goes stale the day a generator is added — and a list is exactly what
 * the guard-class map's own idiom refuses.
 */
export const GENERATED_MARKER = "GENERATED — do not edit by hand";

/** How much of a file's head is read looking for that marker. */
export const GENERATED_HEAD_BYTES = 4096;

/**
 * @typedef {object} EligibilityFinding
 * @property {string} id        one of EXPRESS_REQUIREMENTS
 * @property {string} requires  what the requirement IS, in one line
 * @property {boolean} met
 * @property {string} measured  what was measured and what it answered
 */

/**
 * @typedef {object} CompactCard
 * @property {string} id
 * @property {string} slug
 * @property {string} file      repository-relative
 * @property {string} title
 * @property {string} criterion the outcome sentence, verbatim
 * @property {string[]} fence
 * @property {string} text      the whole card
 */

/**
 * THE NEXT FREE CARD ID, derived from the board and never typed.
 *
 * A suggestion id (`T-300-s7`) is a card of its own on this board, so the
 * scan takes the NUMBER out of every live id and answers one past the
 * highest. An id a seat typed is a collision waiting for the next lane.
 *
 * @param {Map<string, Card>} cards
 * @returns {string}
 */
export function nextCardId(cards) {
  let top = 0;
  for (const id of cards.keys()) {
    const m = /^T-(\d+)/.exec(id);
    if (m === null) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > top) top = n;
  }
  return `T-${String(top + 1)}`;
}

/**
 * A FILE-NAME SLUG FROM A SENTENCE. Lower case, one hyphen between words,
 * bounded — because a card's path is a thing people type.
 *
 * @param {string} sentence @param {number} [words]
 * @returns {string}
 */
export function outcomeSlug(sentence, words = 12) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w !== "")
    .slice(0, words)
    .join("-");
}

/**
 * WHERE A COMPACT CARD BELONGS ON THE BOARD, DERIVED FROM THE FENCE.
 *
 * `feature:` and `milestone:` are required fields and the express path's
 * two inputs are an outcome sentence and a fence, so they are DERIVED
 * rather than asked for: the live card whose own fence covers the most of
 * this one's is the card this change is nearest to, and its feature and
 * milestone are the ones the board already files that ground under. A
 * fence no live card shares is a refusal naming the dial that settles it,
 * because a feature guessed for a card is a story-map column nobody chose.
 *
 * @param {object} input
 * @param {string[]} input.paths  the express fence, expanded
 * @param {Map<string, Card>} input.cards
 * @param {Map<string, string[]>} input.slugs
 * @param {Component[]} input.comps
 * @returns {{ feature: string, milestone: string, from: string, shared: number, why: string }}
 */
export function expressPlacement(input) {
  /** @type {{ id: string, feature: string, milestone: string, shared: number }[]} */
  const ranked = [];
  for (const [id, card] of input.cards) {
    const entries = fieldList(card.fields, "touches");
    if (entries.length === 0) continue;
    const theirs = new Set(fencePaths({ entries }, input.slugs, input.comps));
    const shared = input.paths.filter((p) => theirs.has(p)).length;
    if (shared === 0) continue;
    ranked.push({
      id,
      feature: fieldScalar(card.fields, "feature"),
      milestone: fieldScalar(card.fields, "milestone"),
      shared,
    });
  }
  // THE TIE IS BROKEN BY THE ID AND NOT BY THE MAP'S ORDER, because a
  // derivation whose answer depends on which card the walk met first is a
  // derivation that answers differently on another machine.
  ranked.sort((a, b) => (b.shared - a.shared) || byCardId(a.id, b.id));
  const best = ranked[0];
  if (best === undefined || best.feature === "" || best.milestone === "") {
    throw new ExpressFinding(
      EXPRESS_CODES.NO_PLACE,
      `dispatch-brief: no live card fences any of ${input.paths.join(", ")}` +
        (best === undefined ? "" : ` with both a feature and a milestone (${best.id} is the nearest)`) +
        ", so this compact card's `feature:` and `milestone:` cannot be derived from the board. " +
        "They are REQUIRED fields and this arm will not guess a story-map column: name them with " +
        "--feature and --milestone, or file the card through the ordinary path.",
    );
  }
  return {
    feature: best.feature,
    milestone: best.milestone,
    from: best.id,
    shared: best.shared,
    why:
      `${best.id} fences ${String(best.shared)} of this change's ${String(input.paths.length)} ` +
      "path(s), more than any other live card, so the board already files this ground under its " +
      `feature ${best.feature} and milestone ${best.milestone}`,
  };
}

/**
 * THE COMPACT CARD — every required field of the task format, both
 * standing sections, the outcome sentence as the criterion and the fence
 * as the touches.
 *
 * **THE OUTCOME SENTENCE IS THE CRITERION, VERBATIM, OR IT IS REFUSED.**
 * This arm does not paraphrase a sentence into EARS form and it does not
 * wrap one: a criterion this command composed is a requirement nobody
 * wrote, and the whole card is bought on that one line. So the sentence
 * is tested against the EARS patterns the METHOD declares — handed in by
 * the caller, because the reader of those patterns
 * (`session-economics.mjs`) imports this module and the dependency may
 * not run both ways — and a sentence that is not in EARS form is refused
 * naming the patterns rather than repaired.
 *
 * @param {object} input
 * @param {string} input.id
 * @param {string} input.outcome      the outcome sentence, which becomes the criterion
 * @param {string[]} input.fence      the fence, as the card's `touches:`
 * @param {string} input.feature
 * @param {string} input.milestone
 * @param {string} [input.priority]
 * @param {string} input.suggestedBy
 * @param {string} input.at           the calendar date the express path created it
 * @param {(criterion: string) => boolean} input.ears  the METHOD's own EARS reading
 * @returns {CompactCard}
 */
export function compactCard(input) {
  const outcome = String(input.outcome ?? "").trim();
  if (outcome === "") {
    throw new ExpressFinding(
      EXPRESS_CODES.NO_OUTCOME,
      "dispatch-brief: the express path takes an OUTCOME SENTENCE and a fence, and this one names " +
        "no outcome. A card with no criterion is a lane with no contract.",
    );
  }
  if (/[\r\n]/.test(outcome)) {
    throw new ExpressFinding(
      EXPRESS_CODES.OUTCOME_LINES,
      "dispatch-brief: an outcome sentence is ONE line. It becomes the card's `title:` and its " +
        "single acceptance criterion, and a line break in either is a frontmatter field that ends " +
        "early and a criterion the readers cut in half.",
    );
  }
  if (typeof input.ears !== "function") {
    throw new ExpressFinding(
      EXPRESS_CODES.NO_EARS,
      "dispatch-brief: this arm was handed no EARS reading, so it cannot tell whether the outcome " +
        "sentence is a requirement or a wish. The patterns are the METHOD'S " +
        "(method/interview/decomposition.md) and are read by session-economics.mjs, which imports " +
        "this module — so the reading is handed IN. A shape check that can be skipped by omitting " +
        "an argument is no check.",
    );
  }
  if (!input.ears(outcome)) {
    throw new ExpressFinding(
      EXPRESS_CODES.OUTCOME_SHAPE,
      `dispatch-brief: ${JSON.stringify(clipSentence(outcome))} is not in EARS form, so it cannot ` +
        "be this card's acceptance criterion. The express path writes the sentence you give it " +
        "VERBATIM — a criterion this arm composed would be a requirement nobody wrote, and the " +
        "whole card is bought on that one line. The patterns are in " +
        "method/interview/decomposition.md, at its EARS notation step: an opening keyword and a " +
        "SHALL. Rewrite the sentence, or file the card through the ordinary path.",
    );
  }
  const fence = (input.fence ?? []).map((f) => String(f).trim()).filter((f) => f !== "");
  if (fence.length === 0) {
    throw new ExpressFinding(
      EXPRESS_CODES.NO_FENCE,
      "dispatch-brief: the express path takes an outcome sentence and a NAMED FENCE, and this one " +
        "names no fence. An eligibility measured over no paths is a measurement of nothing, and " +
        "the bounded tier is bounded by exactly that list.",
    );
  }
  const slug = outcomeSlug(outcome);
  const text = [
    "---",
    `id: ${input.id}`,
    `title: ${JSON.stringify(outcome)}`,
    `feature: ${input.feature}`,
    `milestone: ${input.milestone}`,
    `priority: ${input.priority ?? "1"}`,
    "size: XS",
    "tier:",
    "status: planned",
    "blocked_by: []",
    `touches: [${fence.join(", ")}]`,
    `suggested_by: ${JSON.stringify(input.suggestedBy)}`,
    "builder:",
    "verifier:",
    "built_by:",
    "verified_by:",
    "review: default",
    "---",
    "",
    wrapProse(
      "A COMPACT CARD, created by the express path from one outcome sentence and the fence " +
        "above. Its criterion is that sentence verbatim; nothing here is a claim a preflight " +
        "cannot re-derive.",
    ),
    "",
    "## Acceptance criteria",
    "",
    `- ${outcome}`,
    "",
    "## Implementation notes",
    "",
    // THE EXPRESS LABEL, WRITTEN AT BIRTH AND WITHDRAWN BY A DATED LINE.
    // It is a LINE in a section the loop's own ceremony may append to
    // (`MECHANICAL_SECTIONS`) rather than a frontmatter field, so a card
    // that takes the short road and one that is withdrawn from it are
    // both readable by every existing reader of a card and neither
    // changes the field set `method/tasks/TASK-FORMAT.md` owns.
    wrapProse(
      `${EXPRESS_LABEL_OPENER} (${input.at}): this card was composed by the express path from ` +
        "one outcome sentence and the fence above, measured eligible, and dispatched " +
        "executor-only under the bounded contract. Withdrawing the label is a dated line under " +
        "this heading.",
    ),
    "",
    "## Verdicts",
    "",
  ].join("\n");
  return {
    id: input.id,
    slug,
    file: `docs/tasks/${input.id}-${slug}.md`,
    title: outcome,
    criterion: outcome,
    fence,
    text,
  };
}

/**
 * THE PROSE WIDTH EVERY DOCUMENT IN THIS REPOSITORY IS HARD-WRAPPED AT.
 * A compact card is a card like any other and is read in the same diffs,
 * so it is wrapped rather than left as three sentences on one line.
 */
export const CARD_WRAP = 76;

/**
 * One paragraph, hard-wrapped. Never breaks a word, so a path or a
 * command in a sentence survives intact.
 *
 * @param {string} text @param {number} [width]
 * @returns {string}
 */
export function wrapProse(text, width = CARD_WRAP) {
  /** @type {string[]} */
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter((w) => w !== "")) {
    if (line === "") line = word;
    else if (line.length + 1 + word.length <= width) line = `${line} ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== "") lines.push(line);
  return lines.join("\n");
}

/** A sentence cut for a message, so a refusal naming one stays readable. */
/** @param {string} s @returns {string} */
function clipSentence(s) {
  return s.length <= 120 ? s : `${s.slice(0, 117)}...`;
}

/**
 * IS THIS CHANGE ALREADY SOMEBODY'S? — the card's SECOND criterion.
 *
 * **A CORRECTION ROUND AND A RE-ENTRY ARE NOT NEW WORK AND MUST NOT MINT
 * A CARD.** An active card whose writer can be safely resumed already
 * owns its ground: a second card for the same change would put two
 * writers on one resource, split one piece of work across two run records
 * and spend a second approval on work the first one already carries. So
 * the express arm asks the board and the run records BEFORE it writes
 * anything, and a change whose fence is covered by such a card is
 * answered with that card and its attempt rather than with a compact one.
 *
 * SAFELY RESUMABLE is the run record's own word and not a new one: an
 * attempt whose state is not terminal is still this card's writer, and
 * `continueRun` is the operation that resumes it. An attempt that
 * FINISHED is not resumable — the lane is done and a fresh change to the
 * same ground is a fresh card.
 *
 * @param {object} input
 * @param {string[]} input.paths                 the express fence, expanded
 * @param {Map<string, Card>} input.cards
 * @param {Map<string, string[]>} input.slugs
 * @param {Component[]} input.comps
 * @param {readonly string[]} input.active        the statuses that make a card ACTIVE
 * @param {{ attempt: string, card: string, state: string, terminal: boolean }[]} input.writers
 * @returns {?{ card: string, attempt: string, state: string, covered: string[], why: string }}
 */
export function expressReuse(input) {
  /** @type {{ card: string, attempt: string, state: string, covered: string[], why: string }[]} */
  const found = [];
  for (const [id, card] of input.cards) {
    if (!input.active.includes(fieldScalar(card.fields, "status"))) continue;
    const entries = fieldList(card.fields, "touches");
    if (entries.length === 0) continue;
    const theirs = new Set(fencePaths({ entries }, input.slugs, input.comps));
    const covered = input.paths.filter((p) => theirs.has(p));
    if (covered.length !== input.paths.length) continue;
    const writer = input.writers.find((w) => w.card === id && !w.terminal);
    if (writer === undefined) continue;
    found.push({
      card: id,
      attempt: writer.attempt,
      state: writer.state,
      covered,
      why:
        `${id} is ${fieldScalar(card.fields, "status")}, its fence covers every one of this ` +
        `change's ${String(input.paths.length)} path(s), and attempt ${writer.attempt} is ` +
        `${writer.state} — not terminal, so it is this card's writer still and a continuation ` +
        "resumes it. A compact card here would be a second writer for one resource and a second " +
        "run record for one piece of work.",
    });
  }
  found.sort((a, b) => byCardId(a.card, b.card));
  return found[0] ?? null;
}

/**
 * IS THIS FILE ONE A GENERATOR WRITES? Read off the file's own head, so a
 * generator added tomorrow is covered the day it writes its marker and no
 * list here goes stale.
 *
 * @param {string} root @param {string} rel
 * @returns {boolean}
 */
export function isGenerated(root, rel) {
  const at = path.join(root, rel);
  if (!existsSync(at)) return false;
  let head = "";
  try {
    head = readFileSync(at, "utf8").slice(0, GENERATED_HEAD_BYTES);
  } catch {
    return false;
  }
  return head.includes(GENERATED_MARKER);
}

/**
 * THE ELIGIBILITY, MEASURED AND PRINTED AS FINDINGS — the card's THIRD
 * criterion, and every requirement it names in the order it names them.
 *
 * **EACH FINDING SAYS WHAT WAS MEASURED, NOT WHETHER THE ARM LIKED IT.**
 * A report that printed only the refusals would leave a reader unable to
 * tell a requirement that passed from one nobody asked, which is the same
 * failure a skipped gate is: a gate nobody ran and a gate that passed
 * look identical afterwards.
 *
 * @param {object} input
 * @param {string[]} input.fence        the fence as the card declares it
 * @param {string[]} input.paths        that fence, expanded
 * @param {string[]} input.unresolved   fence entries expanding to nothing
 * @param {string[]} input.changed      the paths the change actually touches
 * @param {(rel: string) => boolean} input.tracked
 * @param {(rel: string) => boolean} input.present
 * @param {(rel: string) => boolean} input.generated
 * @param {Map<string, string[]>} input.guardMap
 * @param {{ byPath: { path: string, specs: string[] }[], unplaceable: { path: string, why: string }[] }} input.owning
 * @param {?Admission} input.admission        what `admit` answered, or null
 * @param {?{ code: string, why: string }} input.refusal  why it refused, where it did
 * @returns {{ eligible: boolean, findings: EligibilityFinding[], refusals: string[] }}
 */
export function expressEligibility(input) {
  /** @type {EligibilityFinding[]} */
  const findings = [];
  /** @param {string} id @param {string} requires @param {boolean} met @param {string} measured */
  const say = (id, requires, met, measured) => findings.push({ id, requires, met, measured });

  // ── 1. AN ADMISSION THE GRANT PERMITS ─────────────────────────────
  const admitted = input.admission !== null && input.admission.admitted;
  say(
    "admission",
    "an admission the grant permits (T-319's block, T-324's lifecycle)",
    admitted,
    admitted
      ? `admitted — ${/** @type {Admission} */ (input.admission).why}`
      : input.refusal === null
        ? "no admission was measured here at all, which is not the same as one that was permitted"
        : `REFUSED ${input.refusal.code} — ${input.refusal.why}`,
  );

  // ── 2. EVERY PATH INSIDE THE FENCE ────────────────────────────────
  const inside = new Set(input.paths);
  const outside = input.changed.filter((p) => !inside.has(p));
  say(
    "fence",
    "every path the change touches inside the named fence, and every fence entry resolving",
    outside.length === 0 && input.unresolved.length === 0,
    `${String(input.fence.length)} fence entr(ies) expanding to ${String(input.paths.length)} ` +
      `path(s); ${String(input.changed.length)} changed path(s)` +
      (outside.length === 0 ? " all inside" : `, OUTSIDE: ${outside.join(", ")}`) +
      (input.unresolved.length === 0 ? "" : `; UNRESOLVED entr(ies): ${input.unresolved.join(", ")}`),
  );

  // ── 3. A KEEPER OR AN OWNING SPEC FOR THE PATH ────────────────────
  // **DERIVED FROM THE IMPORT GRAPH, WITHOUT RUNNING A SUITE.** What this
  // requirement asks is whether something already PINS the ground, and
  // `gate-run.mjs`'s owning derivation answers exactly that from static
  // imports and the docs gate's reader map. Running the suite here would
  // answer a different question — whether it is green — which is the
  // dispatch ritual's own first step and is asked there.
  const unplaceable = input.owning.unplaceable;
  const owned = input.owning.byPath.length;
  say(
    "keeper",
    "a relevant keeper or owning spec present for every fenced path",
    unplaceable.length === 0,
    `${String(owned)} of ${String(input.paths.length)} path(s) are owned by at least one spec` +
      (unplaceable.length === 0
        ? `; the owners are ${input.owning.byPath
            .map((e) => `${e.path} -> ${e.specs.join(", ")}`)
            .join(" / ")}`
        : `; UNOWNED: ${unplaceable.map((u) => `${u.path} (${u.why})`).join(", ")}`),
  );

  // ── 4. NO GUARD-CLASS PATH ────────────────────────────────────────
  const hits = guardClassHits(input.paths, input.guardMap);
  say(
    "guard-class",
    "no guard-class path (the conventions' own map, T-296) — the builder of a cage is not its inspector",
    hits.length === 0,
    `${String(input.paths.length)} path(s) against ${String(input.guardMap.size)} class(es)` +
      (hits.length === 0
        ? "; none hit"
        : `; HIT: ${hits.map((h) => `${h.path} (${h.classes.join(", ")})`).join(", ")}`),
  );

  // ── 5. REVERSIBLE ─────────────────────────────────────────────────
  const untracked = input.paths.filter((p) => !input.tracked(p));
  const absent = input.paths.filter((p) => input.tracked(p) && !input.present(p));
  const generated = input.paths.filter((p) => input.generated(p));
  say(
    "reversible",
    "a tracked file, no rename, no deletion, no generated file",
    untracked.length === 0 && absent.length === 0 && generated.length === 0,
    (untracked.length === 0 ? "every path tracked" : `UNTRACKED: ${untracked.join(", ")}`) +
      (absent.length === 0 ? "; every path present" : `; ABSENT: ${absent.join(", ")}`) +
      (generated.length === 0
        ? "; none carries a generator's marker"
        : `; GENERATED: ${generated.join(", ")}`) +
      ". AND WHAT THIS CANNOT SEE, said rather than left to be discovered: whether the edit turns " +
      "out to be a rename or a deletion is a property of a DIFF that does not exist at this " +
      "moment, and NOTHING RE-READS IT AFTERWARDS: the merge reads the diff for forbidden " +
      "spellings and for its LINE COUNT (the XS bound bumps the tier, which is a different " +
      "question), and it asks at no step whether a path was renamed or deleted. THE FENCE-TIME " +
      "READING IS THE WHOLE OF THIS GUARANTEE.",
  );

  const refusals = findings
    .filter((f) => !f.met)
    .map((f) => `${f.id}: ${f.requires} — ${f.measured}`);
  return { eligible: refusals.length === 0, findings, refusals };
}

/**
 * THE EFFORT DIAL'S VALUE WHEN NOTHING DECLARES ONE. It is a RECORDED
 * VALUE and not an empty field: a receipt whose effort row is blank and
 * one whose effort was never configured look the same, and only one of
 * them is a gap somebody should close (T-318).
 */
export const EFFORT_NOT_CONFIGURED = "not configured";

/** The template block an effort per role would live in, when one exists. */
export const EFFORT_TEMPLATE_BLOCK = "efforts";

/**
 * THE EFFORT ONE ROLE IS DISPATCHED AT, read from the runtime template
 * the same way its model is — and answering `not configured` where the
 * template carries no such block, which is every tree until T-318 lands
 * one. It is READ rather than assumed absent, so the day the block
 * appears this reader answers from it without being edited.
 *
 * @param {string} templateYaml
 * @param {string} role the METHOD role file's name, e.g. `executor`
 * @returns {string}
 */
export function roleEffort(templateYaml, role) {
  const key = /** @type {Record<string, string>} */ (ROLE_TEMPLATE_KEYS)[role];
  if (key === undefined) return EFFORT_NOT_CONFIGURED;
  const lines = templateYaml.split(/\r?\n/);
  const at = lines.findIndex((l) => new RegExp(`^${EFFORT_TEMPLATE_BLOCK}:\\s*(#.*)?$`).test(l));
  if (at === -1) return EFFORT_NOT_CONFIGURED;
  for (const line of lines.slice(at + 1)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(line)) break;
    const m = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (m === null) continue;
    if (m[1] !== key) continue;
    const raw = /** @type {string} */ (m[2]);
    const cut = raw.startsWith("#") ? "" : (raw.split(" #")[0] ?? "");
    const value = cut.trim().replace(/^(?:""|'')$/, "");
    return value === "" ? EFFORT_NOT_CONFIGURED : value;
  }
  return EFFORT_NOT_CONFIGURED;
}

/**
 * THE BLOB A TEXT WOULD HAVE, computed by git and written nowhere.
 *
 * **THIS IS WHAT LETS THE ADMISSION BE MEASURED BEFORE THE CARD EXISTS.**
 * A grant binds to a card's blob sha, and a compact card's bytes are
 * fully determined the moment the arm composes them — so the blob can be
 * computed, printed and compared against the grant's order without a file
 * being written or an object being stored. An owner who wants to approve
 * a compact card in advance approves exactly this sha.
 *
 * @param {string} root @param {string} text
 * @returns {string}
 */
export function hashObject(root, text) {
  return execFileSync("git", ["-C", root, "hash-object", "--stdin"], {
    encoding: "utf8",
    input: text,
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

/**
 * @typedef {object} ExpressOptions
 * @property {string} outcome
 * @property {string[]} fence
 * @property {(criterion: string) => boolean} ears
 * @property {string} suggestedBy
 * @property {string[]} [changed]     the paths the change touches; the fence when omitted
 * @property {string} [id]
 * @property {string} [feature]
 * @property {string} [milestone]
 * @property {string} [priority]
 * @property {string} [slug]
 * @property {string} [scratch]
 * @property {string} [executor]
 * @property {string} [verifier]
 * @property {GrantState} [grant]
 * @property {AdmissionEntry[]} [ledger]
 * @property {{ attempt: string, card: string, state: string, terminal: boolean }[]} [writers]
 * @property {readonly string[]} [active]  the statuses that make a card ACTIVE
 * @property {string} [derivedFrom]   a parent the recovery policy admits a repair of
 * @property {string} [failure]       that repair's failure evidence
 * @property {string} [requestedAt]   the outcome sentence's OWN instant, where the seat knows it
 */

/** The card statuses that mean a card is still somebody's work. */
export const ACTIVE_STATUSES = Object.freeze(["planned", "building", "verifying", "rejected", "merging"]);

/**
 * THE EXPRESS PLAN — derived from the tree and the two inputs, writing
 * NOTHING and starting no process.
 *
 * The order of what it answers is the design: REUSE first, because a
 * change that already belongs to somebody must not mint a card; then the
 * card, because the admission binds to its blob and the blob is a
 * function of its bytes; then the eligibility, which the admission is one
 * finding of.
 *
 * @param {Ctx} ctx
 * @param {ExpressOptions} opts
 * @returns {ExpressPlan}
 */
export function expressPlan(ctx, opts) {
  const fence = (opts.fence ?? []).map((f) => String(f).trim()).filter((f) => f !== "");
  if (fence.length === 0) {
    throw new ExpressFinding(
      EXPRESS_CODES.NO_FENCE,
      "dispatch-brief: the express path takes an outcome sentence and a NAMED FENCE, and this one " +
        "names no fence. An eligibility measured over no paths is a measurement of nothing.",
    );
  }
  const paths = fencePaths({ entries: fence }, ctx.slugs, ctx.comps);
  const unresolved = fence.filter((e) => expandFenceEntry(e, ctx.slugs, ctx.comps).paths.length === 0);
  const active = opts.active ?? ACTIVE_STATUSES;
  const reuse = expressReuse({
    paths,
    cards: ctx.cards,
    slugs: ctx.slugs,
    comps: ctx.comps,
    active,
    writers: opts.writers ?? [],
  });

  const placement =
    opts.feature !== undefined && opts.feature !== "" && opts.milestone !== undefined && opts.milestone !== ""
      ? {
          feature: opts.feature,
          milestone: opts.milestone,
          from: "",
          shared: 0,
          why: "named by the dispatching seat rather than derived from the board",
        }
      : expressPlacement({ paths, cards: ctx.cards, slugs: ctx.slugs, comps: ctx.comps });

  const id = opts.id === undefined || opts.id === "" ? nextCardId(ctx.cards) : normaliseTaskId(opts.id);
  if (ctx.cards.has(id)) {
    throw new ExpressFinding(
      EXPRESS_CODES.ID_TAKEN,
      `dispatch-brief: ${id} is already a live card (${ctx.cards.get(id)?.file ?? ""}). A compact ` +
        "card written over a live one would be this arm losing somebody's contract.",
    );
  }
  const card = compactCard({
    id,
    at: ctx.at.slice(0, 10),
    outcome: opts.outcome,
    fence,
    feature: placement.feature,
    milestone: placement.milestone,
    ...(opts.priority === undefined ? {} : { priority: opts.priority }),
    suggestedBy: opts.suggestedBy,
    ears: opts.ears,
  });
  const blob = hashObject(ctx.root, card.text);

  // ── THE ADMISSION, MEASURED AND NOT MADE ───────────────────────────
  // **THE EXPRESS PATH REFUSES UNDER THE NO-GRANT STATE, AND THAT IS THE
  // ONE PLACE IT DEPARTS FROM THE ORDINARY CUT.** For a card a person
  // filed and triaged, `admit` under no grant answers "made, and NOTHING
  // was enforced", and the standing authorization the loop runs under is
  // the seat's. A COMPACT CARD HAS NO SUCH HISTORY: it was composed by
  // this command out of a sentence, seconds ago, and nobody has triaged
  // it. The card's first criterion says so in as many words — an outcome
  // sentence alone authorizes no work — so where there is no grant to
  // read, the express path declines to create the work and the ordinary
  // path, with its own dispatch approval, is what files it.
  const grant = opts.grant ?? grantState(ctx.root);
  const derivedFrom = (opts.derivedFrom ?? "").trim();
  /** @type {?Admission} */
  let admission = null;
  /** @type {?{ code: string, why: string }} */
  let refusal = null;
  if (!grant.enforced) {
    refusal = {
      code: EXPRESS_CODES.NO_GRANT,
      why:
        `${grant.source}. The express path is the one place a CARD is composed by a command out ` +
        "of a sentence rather than filed and triaged by a person, so the standing authorization " +
        "that carries an ordinary cut under no grant does not reach it: an outcome sentence alone " +
        "authorizes no work. File the card through the ordinary path, or record a grant.",
    };
  } else {
    try {
      admission = admit(
        grant,
        {
          boundary: "lane-cut",
          kind: derivedFrom === "" ? "explicit" : "derived",
          card: id,
          role: "executor",
          blob,
          cardText: card.text,
          approvedText: (sha) => approvedCardText(ctx.root, sha),
          resource: null,
          board: admissionBoard(ctx),
          ...(derivedFrom === "" ? {} : { parent: derivedFrom, evidence: opts.failure ?? "" }),
        },
        opts.ledger ?? [],
      );
    } catch (err) {
      if (!(err instanceof AdmissionFinding)) throw err;
      refusal = { code: String(err.code), why: err.message };
    }
  }

  const tracked = new Set(
    git(ctx.root, ["ls-files", "-z"])
      .split("\0")
      .filter((l) => l !== ""),
  );
  const isTracked = (/** @type {string} */ rel) =>
    tracked.has(rel) || [...tracked].some((f) => f.startsWith(`${rel.replace(/\/+$/, "")}/`));
  const owning = deriveOwning(paths, ctx.root);
  const eligibility = expressEligibility({
    fence,
    paths,
    unresolved,
    changed: opts.changed === undefined || opts.changed.length === 0 ? paths : opts.changed,
    tracked: isTracked,
    present: (rel) => existsSync(path.join(ctx.root, rel)),
    generated: (rel) => isGenerated(ctx.root, rel),
    guardMap: guardClassMap(ctx.conventions, guardClassIds(taskFormatText(ctx.root))),
    owning,
    admission,
    refusal,
  });

  const templateText = runtimeTemplateText(ctx.root);
  const models = roleModels(templateText);
  const executor = modelChoice("executor", "builder", roleModel(models, "executor"), opts.executor);
  const sp = dispatchSpellings(ctx.conventions);
  return {
    root: ctx.root,
    id,
    reuse,
    card,
    blob,
    placement,
    fence,
    paths,
    unresolved,
    grant,
    admission,
    refusal,
    eligibility,
    owning,
    slug: opts.slug === undefined || opts.slug === "" ? card.slug : opts.slug,
    scratch: opts.scratch === undefined || opts.scratch === "" ? os.tmpdir() : opts.scratch,
    draftFile: path.resolve(
      opts.scratch === undefined || opts.scratch === "" ? os.tmpdir() : opts.scratch,
      laneScratchName(EXPRESS_LABEL, "md", id, sp),
    ),
    // THE OUTCOME SENTENCE'S OWN INSTANT, AND IT IS THE SEAT'S TO GIVE.
    // This command can only know when it was INVOKED, which is a later
    // instant than the one the first measurement is a difference from —
    // so the dial is offered, the default is this invocation's own clock,
    // and which of the two a record carries is SAID rather than left to be
    // assumed. A figure whose provenance is a guess is worse than one that
    // names itself.
    requestedAt: opts.requestedAt === undefined || opts.requestedAt === "" ? ctx.at : opts.requestedAt,
    requestedFrom:
      opts.requestedAt === undefined || opts.requestedAt === ""
        ? "this command's own invocation, which is LATER than the sentence it was given — pass --requested <iso> to measure from the sentence itself"
        : "the instant the seat gave for the outcome sentence itself",
    instantsFile: path.resolve(
      opts.scratch === undefined || opts.scratch === "" ? os.tmpdir() : opts.scratch,
      laneScratchName("instants", "json", id, sp),
    ),
    requested: {
      model: executor.model,
      effort: roleEffort(templateText, "executor"),
      fromTemplate: executor.fromTemplate,
      overridden: executor.overridden,
    },
    ...(opts.executor === undefined ? {} : { executor: opts.executor }),
    ...(opts.verifier === undefined ? {} : { verifier: opts.verifier }),
    ...(derivedFrom === "" ? {} : { derivedFrom }),
    ...(opts.failure === undefined ? {} : { failure: opts.failure }),
  };
}

/**
 * @typedef {object} ExpressPlan
 * @property {string} root
 * @property {string} id
 * @property {?{ card: string, attempt: string, state: string, covered: string[], why: string }} reuse
 * @property {CompactCard} card
 * @property {string} blob
 * @property {{ feature: string, milestone: string, from: string, shared: number, why: string }} placement
 * @property {string[]} fence
 * @property {string[]} paths
 * @property {string[]} unresolved
 * @property {GrantState} grant
 * @property {?Admission} admission
 * @property {?{ code: string, why: string }} refusal
 * @property {{ eligible: boolean, findings: EligibilityFinding[], refusals: string[] }} eligibility
 * @property {{ byPath: { path: string, specs: string[] }[], unplaceable: { path: string, why: string }[] }} owning
 * @property {string} slug
 * @property {string} scratch
 * @property {string} draftFile
 * @property {string} requestedAt
 * @property {string} requestedFrom
 * @property {string} instantsFile
 * @property {{ model: string, effort: string, fromTemplate: string, overridden: boolean }} requested
 * @property {string} [executor]
 * @property {string} [verifier]
 * @property {string} [derivedFrom]
 * @property {string} [failure]
 */

/**
 * THE FOUR STEPS THE EXPRESS RUN PERFORMS BEFORE IT HANDS OVER. The fifth
 * is the ORDINARY ritual — `--dispatch-lane`, all eleven of its steps,
 * with the bench and the phase-one pass not owed at the bounded tier —
 * and it is named here as a step so that a reader of this ledger can see
 * where the short road rejoins the long one.
 */
export const EXPRESS_STEPS = Object.freeze([
  Object.freeze({ n: 1, id: "reuse", what: "ask whether an active card with a resumable writer already owns this change" }),
  Object.freeze({ n: 2, id: "eligible", what: "measure the five requirements and refuse an ineligible change by name" }),
  Object.freeze({ n: 3, id: "card", what: "write the compact card and stage it, so the dispatch stamp commits one commit and not two" }),
  Object.freeze({ n: 4, id: "preflight", what: "re-derive the compact card's own claims with the existing preflight" }),
  Object.freeze({ n: 5, id: "dispatch", what: "hand over to the ordinary lane ritual, which admits, stamps, cuts and briefs" }),
]);

/**
 * @typedef {object} ExpressResult
 * @property {number} code
 * @property {StepResult[]} done
 * @property {?{ n: number, id: string, ran: string, exit: number, detail: string }} stopped
 * @property {string[]} findings
 * @property {string[]} notes
 * @property {string[]} transcript  the ordinary ritual's own output, carried through verbatim
 * @property {string} cardFile   the compact card's path, or "" where none was written
 */

/**
 * PERFORM THE EXPRESS PATH. Every write is named in the ledger it
 * returns, and every one of them is undone when a later step refuses.
 *
 * @param {ExpressPlan} plan
 * @param {DispatchIo} io
 * @returns {ExpressResult}
 */
export function runExpress(plan, io) {
  /** @type {StepResult[]} */
  const done = [];
  /** @type {string[]} */
  const findings = [];
  /** @type {string[]} */
  const notes = [];
  /** @type {string[]} */
  const transcript = [];
  let wrote = "";
  const cardAt = path.join(plan.root, plan.card.file);

  /**
   * Undo the one write this run makes, and nothing else.
   *
   * **IT TAKES THE FILE BACK EVEN WHEN THE STAGING NEVER HAPPENED.** The
   * card is written and then staged, so a refusal BETWEEN the two leaves
   * a file `git rm` cannot see — and a compact card left untracked in the
   * integration checkout is dirt the next merge counts as somebody's
   * uncommitted work.
   */
  const unwind = () => {
    if (wrote === "") return;
    const removed = io.run(["git", "-C", plan.root, "rm", "--quiet", "--force", "--", plan.card.file], {
      cwd: plan.root,
    });
    if (removed.status !== 0 && existsSync(cardAt)) {
      try {
        rmSync(cardAt);
      } catch {
        findings.push(
          `the compact card this run wrote at ${plan.card.file} could not be taken back, so it is ` +
            "still there and it is this run's to remove.",
        );
      }
    }
    wrote = "";
  };

  /**
   * @param {{ n: number, id: string, what: string }} step
   * @param {string} ran @param {number} exit @param {string} detail
   * @returns {ExpressResult}
   */
  const stopAt = (step, ran, exit, detail) => {
    unwind();
    findings.push(
      `the express path stopped at step ${String(step.n)} (${step.id}) — ${step.what}. It ran: ` +
        `${ran} — and got exit ${String(exit)}. ${detail}`,
    );
    return {
      code: exit === EXIT.CANNOT_RUN ? EXIT.CANNOT_RUN : EXIT.FOUND,
      done,
      stopped: { n: step.n, id: step.id, ran, exit, detail },
      findings,
      notes,
      transcript,
      cardFile: "",
    };
  };

  for (const step of EXPRESS_STEPS) {
    if (step.id === "reuse") {
      const ran = `read ${String(plan.paths.length)} fenced path(s) against the board and the run records`;
      if (plan.reuse !== null) {
        // NOT A REFUSAL AND NOT A FAILURE. The change has a home; this
        // step found it, and the answer is the card and the attempt that
        // already carry it. A second card here would be the second
        // writer, which is the one thing this step exists to prevent.
        notes.push(
          `THIS CHANGE IS ALREADY ${plan.reuse.card}'S, and no compact card was created: ` +
            `${plan.reuse.why} Resume it — \`--run continue --attempt ${plan.reuse.attempt}\` — ` +
            "and the correction round rides the run record that card already has.",
        );
        done.push({ n: step.n, id: step.id, ran, exit: EXIT.CLEAN, detail: plan.reuse.why });
        return { code: EXIT.CLEAN, done, stopped: null, findings, notes, transcript, cardFile: "" };
      }
      done.push({
        n: step.n,
        id: step.id,
        ran,
        exit: EXIT.CLEAN,
        detail: "no active card with a resumable writer fences every path of this change",
      });
      continue;
    }

    if (step.id === "eligible") {
      const ran = `measure ${String(EXPRESS_REQUIREMENTS.length)} requirement(s) over ${String(plan.paths.length)} path(s)`;
      for (const f of plan.eligibility.findings) {
        notes.push(`${f.met ? "MET" : "NOT MET"} — ${f.id}: ${f.requires} — ${f.measured}`);
      }
      if (!plan.eligibility.eligible) {
        // THE DRAFT IS KEPT AND THE TREE IS NOT TOUCHED. A refused change
        // still has an outcome sentence and a fence somebody wrote, so
        // the compact card is written to the LANE'S OWN SCRATCH file
        // rather than into docs/tasks: the ordinary path is where an
        // ineligible change is filed and triaged, and a card dropped
        // untracked into the integration checkout is dirt the next merge
        // counts.
        try {
          io.write(plan.draftFile, plan.card.text);
          notes.push(
            `the compact card this change WOULD have taken is at ${plan.draftFile}, unfiled. ` +
              "Re-triage it through the existing path — file it, size it and dispatch it as any " +
              "other card — rather than re-typing the sentence.",
          );
        } catch {
          notes.push("the compact card could not be written to the scratch draft file");
        }
        return stopAt(
          step,
          ran,
          EXIT.FOUND,
          `INELIGIBLE, and the requirement(s) that were not met are named: ` +
            `${plan.eligibility.refusals.join(" | ")}`,
        );
      }
      done.push({
        n: step.n,
        id: step.id,
        ran,
        exit: EXIT.CLEAN,
        detail: `eligible — all ${String(plan.eligibility.findings.length)} requirement(s) met`,
      });
      continue;
    }

    if (step.id === "card") {
      const ran = `write ${plan.card.file} and stage it`;
      if (existsSync(cardAt)) {
        return stopAt(step, ran, EXIT.FOUND, `${plan.card.file} already exists, and this arm overwrites no card.`);
      }
      try {
        io.write(cardAt, plan.card.text);
      } catch (err) {
        return stopAt(step, ran, EXIT.CANNOT_RUN, err instanceof Error ? err.message : String(err));
      }
      wrote = plan.card.file;
      // **STAGED, NOT COMMITTED.** The dispatch stamp's own commit takes
      // this path in its pathspec, so the compact card and its stamp land
      // in ONE commit — which is the commit the lane is cut from and the
      // commit the card's own history begins at. Two commits here would
      // be two round trips on the integration branch for one change.
      const add = ["git", "-C", plan.root, "add", "--", plan.card.file];
      const r = io.run(add, { cwd: plan.root });
      if (r.status !== 0) return stopAt(step, spellCommand(add), r.status, r.stderr.trim());
      const staged = io.run(["git", "-C", plan.root, "hash-object", "--", plan.card.file], { cwd: plan.root });
      const onDisk = staged.status === 0 ? staged.stdout.trim() : "";
      if (onDisk !== plan.blob) {
        return stopAt(
          step,
          spellCommand(add),
          EXIT.FOUND,
          `the card on disk hashes to ${onDisk || "nothing readable"} and the admission was ` +
            `measured against ${plan.blob}. The bytes the grant was asked about and the bytes on ` +
            "disk are not the same bytes, so the admission answered about a card that is not this one.",
        );
      }
      done.push({ n: step.n, id: step.id, ran: spellCommand(add), exit: EXIT.CLEAN, detail: `${plan.card.file} at ${plan.blob}` });
      continue;
    }

    if (step.id === "preflight") {
      const argv = [process.execPath, BRIEF_CLI, "--task", plan.id, "--preflight", "--root", plan.root];
      const r = io.run(argv, { cwd: plan.root });
      if (r.status !== 0) {
        return stopAt(
          step,
          spellCommand(argv),
          r.status,
          `the compact card's own claims do not re-derive: ${(r.stderr + r.stdout).trim().slice(0, 1200)}`,
        );
      }
      done.push({ n: step.n, id: step.id, ran: spellCommand(argv), exit: EXIT.CLEAN, detail: `${plan.card.file} re-derives at HEAD` });
      continue;
    }

    // ── THE HAND-OVER ────────────────────────────────────────────────
    const argv = [
      process.execPath,
      BRIEF_CLI,
      "--dispatch-lane",
      plan.id,
      "--slug",
      plan.slug,
      "--root",
      plan.root,
      "--scratch",
      plan.scratch,
      ...(plan.executor === undefined ? [] : ["--executor", plan.executor]),
      ...(plan.verifier === undefined ? [] : ["--verifier", plan.verifier]),
      ...(plan.derivedFrom === undefined ? [] : ["--derived-from", plan.derivedFrom]),
      ...(plan.failure === undefined ? [] : ["--failure", plan.failure]),
    ];
    const r = io.run(argv, { cwd: plan.root });
    // THE RITUAL'S OWN OUTPUT IS THE LEDGER A READER NEEDS, so it is
    // carried through VERBATIM rather than summarised into an exit code —
    // and verbatim means a TRANSCRIPT and not a set of notes: every line
    // of it already carries the ritual's own provenance stamp, and
    // re-stamping one appends a second arrow to a line that had one.
    for (const line of `${r.stdout}\n${r.stderr}`.split(/\r?\n/)) {
      if (line.trim() !== "") transcript.push(line);
    }
    if (r.status !== 0) {
      // **WHETHER THE CARD IS UNWOUND DEPENDS ON WHETHER IT WAS
      // COMMITTED, AND THAT IS ASKED RATHER THAN ASSUMED.** A ritual that
      // refused before its stamp leaves this arm's staged card behind as
      // dirt the next merge counts; a ritual that refused AFTER it has
      // committed the card has made the card's own history, and a card
      // removed after its dispatch stamp is a card whose lifecycle nobody
      // can read (`runDispatchLane`'s own rule).
      const committed = io.run(
        ["git", "-C", plan.root, "cat-file", "-e", `HEAD:${plan.card.file}`],
        { cwd: plan.root },
      );
      if (committed.status === 0) {
        wrote = "";
        notes.push(
          `the compact card is in HEAD already — the ritual committed it in its dispatch stamp ` +
            "before it refused — so it is KEPT: a card removed after its own stamp is a card " +
            "whose lifecycle nobody can read.",
        );
      } else {
        notes.push(
          "the compact card was never committed, so this run takes its own write back and the " +
            "tree is as it was found.",
        );
      }
      return stopAt(step, spellCommand(argv), r.status, "the ordinary lane ritual refused; its own ledger is above.");
    }
    // ── THE TWO INSTANTS THE MEASUREMENTS START FROM (T-320) ────────
    // **THEY ARE WRITTEN WHERE THE RUN RECORD CAN PICK THEM UP, because
    // they happen before any child exists.** The outcome sentence's own
    // instant and the lane cut are both earlier than the first
    // `--run start`, so the only way they reach a record is carried in
    // the ASSIGNMENT the seat writes — and the only way the seat has them
    // to carry is if this arm wrote them down at the moment it had them.
    const instants = { requested: plan.requestedAt, cut: io.now?.() ?? new Date().toISOString() };
    try {
      io.write(plan.instantsFile, `${JSON.stringify(instants, null, 2)}\n`);
      notes.push(
        `the two instants the express measurements start from are at ${plan.instantsFile} — ` +
          `requested ${instants.requested} (${plan.requestedFrom}), cut ${instants.cut}. Copy them ` +
          "into the assignment's `instants` block before `--run start`: they happen before any " +
          "child exists, so the record cannot stamp them itself.",
      );
    } catch {
      notes.push(
        `the two instants could not be written to ${plan.instantsFile}, so the first two ` +
          "measurements will be unknown — which is recorded rather than substituted.",
      );
    }
    done.push({ n: step.n, id: step.id, ran: spellCommand(argv), exit: EXIT.CLEAN, detail: `${plan.id} dispatched on the ordinary ritual` });
  }

  return { code: EXIT.CLEAN, done, stopped: null, findings, notes, transcript, cardFile: plan.card.file };
}

/**
 * IS THIS CARD ON THE EXPRESS PATH RIGHT NOW? — the label put on, minus
 * any withdrawal. Read off the card's own text rather than a field, and
 * the two openers are checked in that order because a withdrawal LINE
 * begins with the label's own words: a reader that tested the label first
 * on a substring would call a withdrawn card labelled for ever.
 *
 * @param {string} cardText
 * @returns {{ labelled: boolean, withdrawn: boolean, lines: string[] }}
 */
export function expressLabel(cardText) {
  const lines = cardText
    .split(/\r?\n/)
    .filter((l) => l.trimStart().startsWith(EXPRESS_LABEL_OPENER));
  const withdrawn = lines.some((l) => l.trimStart().startsWith(EXPRESS_WITHDRAWN_OPENER));
  const put = lines.some((l) => !l.trimStart().startsWith(EXPRESS_WITHDRAWN_OPENER));
  return { labelled: put && !withdrawn, withdrawn, lines };
}

/**
 * THE WITHDRAWAL — the card's FIFTH criterion.
 *
 * **NOTHING IS DELETED AND NOTHING IS UNWOUND.** A check that failed or a
 * scope the executor discovered is news about the WORK, not about the
 * candidate: the branch still holds what was built and the run record
 * still holds what it cost, and both are what the ordinary path picks the
 * card up with. So this function writes exactly two things — a dated line
 * that takes the label off, and the `tier:` the card is re-triaged to —
 * and both are changes the loop's own ceremony is allowed to make to an
 * approved card (`MECHANICAL_FIELDS`, `MECHANICAL_SECTIONS`), so the
 * withdrawal does not cost the card the approval it was admitted under.
 *
 * @param {object} input
 * @param {string} input.cardText
 * @param {string} input.id
 * @param {string} input.at        the calendar date
 * @param {string} input.why       what failed, or what scope was discovered
 * @param {string} input.branch    the branch the candidate is preserved on
 * @param {string} input.attempt   the run record the candidate has, or "" where none
 * @param {string} input.tier      the tier it is re-triaged to
 * @returns {{ text: string, line: string, tier: string, preserved: string[] }}
 */
export function expressWithdrawal(input) {
  const label = expressLabel(input.cardText);
  if (!label.labelled) {
    throw new ExpressFinding(
      EXPRESS_CODES.NOT_EXPRESS,
      `dispatch-brief: ${input.id} carries no express label to withdraw` +
        (label.withdrawn ? " — it was withdrawn already, and a record is appended and never rewritten" : "") +
        `. A withdrawal of a label nobody put on would be this arm writing a history that did not happen.`,
    );
  }
  const why = String(input.why ?? "").trim();
  if (why === "") {
    throw new ExpressFinding(
      EXPRESS_CODES.NO_REASON,
      "dispatch-brief: a withdrawal names WHAT happened — the check that failed, or the scope the " +
        "executor found beyond the outcome sentence. A label taken off for no recorded reason is " +
        "a card whose next reader cannot tell why the fast path did not hold.",
    );
  }
  if (!TIERS.includes(input.tier) || input.tier === "bounded") {
    throw new ExpressFinding(
      EXPRESS_CODES.NOT_EXPRESS,
      `dispatch-brief: ${JSON.stringify(input.tier)} is not a tier this card can be re-triaged ` +
        `to. The existing path is a STANDARD or a GUARDED lane (the tiers are ${TIERS.join(", ")}), ` +
        "and re-triaging a withdrawn express card back to bounded would put it on the road it " +
        "just left.",
    );
  }
  const preserved = [
    `the branch ${input.branch} is KEPT — it holds the candidate, and a branch deleted here would ` +
      "destroy the only reproducible copy of what was built",
    input.attempt === ""
      ? "no run record was bound to this candidate, which is recorded rather than rounded to none"
      : `the run record ${input.attempt} is KEPT — it holds what the attempt cost and what it was ` +
        "admitted under",
  ];
  const line = wrapProse(
    `${EXPRESS_WITHDRAWN_OPENER} (${input.at}): ${why} The candidate is preserved — ` +
      `${preserved.join("; ")} — and this card is re-triaged through the existing path as a ` +
      `${input.tier} lane. The express label is off from this line onward; the line that put it ` +
      "on stands, because a record is appended and never rewritten.",
  );
  let text = input.cardText;
  const heading = /^##\s+Implementation notes\s*$/m.exec(text);
  if (heading === null) {
    throw new ExpressFinding(
      EXPRESS_CODES.NO_CARD,
      `dispatch-brief: ${input.id} carries no \`## Implementation notes\` heading, and that is the ` +
        "section the label was put on under. A withdrawal written anywhere else is invisible to " +
        "every reader of the label.",
    );
  }
  // **APPENDED AT THE END OF THE SECTION, NOT AT ITS HEAD.** A record is
  // appended and never rewritten, and a line inserted above the line it
  // supersedes reads to the next person as the older of the two.
  const from = /** @type {number} */ (heading.index) + heading[0].length;
  const next = /\n#{2}\s/.exec(text.slice(from));
  const at = next === null ? text.length : from + /** @type {number} */ (next.index);
  const tail = text.slice(at).replace(/^\n+/, "");
  text = `${text.slice(0, at).replace(/\s*$/, "")}\n\n${line}\n${tail === "" ? "" : `\n${tail}`}`;
  const stamped = stampCard(text, { tier: input.tier }, { insertAfter: { tier: "size" } });
  return { text: stamped.text, line, tier: input.tier, preserved };
}

/* ────────────────────────────────────────────────────────────────────
 * THE DEMONSTRATION'S MEASUREMENTS (T-320's SIXTH criterion).
 *
 * **EVERY FIGURE IS A DIFFERENCE BETWEEN TWO STAMPED INSTANTS, AND THE
 * ROW NAMES BOTH.** That is the whole of why this is a function and not a
 * stopwatch: a body drives it over FIXED instants and asserts arithmetic,
 * which cannot flake, while the demonstration drives it over the instants
 * the records already carry — the card's stamp commit, the run record's
 * own transitions, the merge commit, the push's run on the runner. An
 * instant that is not there is `unknown` and is never substituted, and a
 * row with an unknown end has no duration rather than a guessed one.
 *
 * AND A SLOW RUN RECORDED IS NOT THE OBJECTIVE ACHIEVED. The targets are
 * stated on the rows they belong to and the verdict says met or not met;
 * two of the five rows carry NO target by the card's own words, and they
 * say so rather than being scored against one nobody set.
 * ──────────────────────────────────────────────────────────────────── */

/** The instants the five measurements are differences of, in order. */
export const EXPRESS_INSTANTS = Object.freeze([
  "requested",
  "cut",
  "candidate",
  "checked",
  "merged",
  "pushed",
]);

/**
 * THE TARGETS, AS THE CARD STATES THEM. Seconds, so the arithmetic is in
 * one unit and the rendering does the dividing.
 */
export const EXPRESS_TARGETS = Object.freeze({
  overhead: Object.freeze({ max: 60, what: "under one minute of dispatch and record overhead" }),
  executor: Object.freeze({
    min: 120,
    max: 300,
    what: "roughly two to five minutes to a local candidate for an eligible edit",
  }),
});

/**
 * @typedef {object} Measurement
 * @property {string} id
 * @property {string} what
 * @property {string} from      the instant it starts at, as recorded
 * @property {string} to        the instant it ends at, as recorded
 * @property {?number} seconds  null where either instant is unknown
 * @property {string} target    the target as the card states it, or "" where the card sets none
 * @property {?boolean} met     null where there is no target, or no figure to judge
 * @property {string} why
 */

/** @param {string} v @returns {?number} */
function instantMs(v) {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? t : null;
}

/**
 * THE FIVE MEASUREMENTS, FROM THE INSTANTS THE RECORDS CARRY.
 *
 * @param {object} input
 * @param {string} input.requested  the outcome sentence's own instant
 * @param {string} input.cut        the lane cut
 * @param {string} input.candidate  the candidate
 * @param {string} input.checked    the owed set's conclusion
 * @param {string} input.merged     the merge commit
 * @param {string} input.pushed     the push of the merge
 * @param {string} [input.runner]   the runner's own conclusion. IT IS ACCEPTED AND
 *   DELIBERATELY TURNED INTO NO ROW: the card asks for it BESIDE the total, so it must
 *   end no row and the total still ends at the push. WHERE it is recorded is the record's
 *   own instants map, which `measurementRunRecs` prints in full above the rows.
 * @returns {{ rows: Measurement[], unknown: string[], verdict: string }}
 */
export function expressMeasurements(input) {
  /** @type {string[]} */
  const unknown = [];
  for (const key of EXPRESS_INSTANTS) {
    const raw = /** @type {Record<string, string>} */ (input)[key] ?? "";
    if (instantMs(raw) === null) {
      unknown.push(`${key}: ${raw === "" ? "unknown — no instant was recorded for it" : `unreadable (${raw})`}`);
    }
  }
  /**
   * @param {string} id @param {string} what @param {string} fromKey @param {string} toKey
   * @param {{ min?: number, max?: number, what: string } | null} target
   * @returns {Measurement}
   */
  const row = (id, what, fromKey, toKey, target) => {
    const from = /** @type {Record<string, string>} */ (input)[fromKey] ?? "";
    const to = /** @type {Record<string, string>} */ (input)[toKey] ?? "";
    const a = instantMs(from);
    const b = instantMs(to);
    const seconds = a === null || b === null ? null : Math.round((b - a) / 1000);
    /** @type {?boolean} */
    let met = null;
    let why;
    if (target === null) {
      why = "the card sets NO target for this row, and it is recorded rather than scored";
    } else if (seconds === null) {
      why =
        `the target is ${target.what}, and this row has no figure to judge it by — ` +
        `${a === null ? `${fromKey} is unknown` : `${toKey} is unknown`}, and an unknown is never ` +
        "substituted with a plausible number";
    } else {
      const overMax = target.max !== undefined && seconds > target.max;
      const underMin = target.min !== undefined && seconds < target.min;
      met = !overMax;
      why =
        `the target is ${target.what}; measured ${String(seconds)}s, so it is ` +
        `${met ? "MET" : "NOT MET"}` +
        (underMin
          ? " — and it came in UNDER the range's floor, which is news rather than a better result: a " +
            "figure faster than the objective's own band means the objective was measured on " +
            "something smaller than the band was written for"
          : "");
    }
    return {
      id,
      what,
      from: from === "" ? "unknown" : from,
      to: to === "" ? "unknown" : to,
      seconds,
      target: target === null ? "" : target.what,
      met,
      why,
    };
  };
  const rows = [
    row(
      "overhead",
      "dispatch and record overhead — from the outcome sentence's instant to the lane cut",
      "requested",
      "cut",
      EXPRESS_TARGETS.overhead,
    ),
    row("executor", "executor time — from the lane cut to the candidate", "cut", "candidate", EXPRESS_TARGETS.executor),
    row("check", "check time — the owed set, from the candidate to its conclusion", "candidate", "checked", null),
    row("publication", "publication time — from the merge commit to the push", "merged", "pushed", null),
    row(
      "request-to-delivery",
      "the request-to-delivery total — from the outcome sentence's instant to the push of the merge",
      "requested",
      "pushed",
      null,
    ),
  ];
  const judged = rows.filter((r) => r.met !== null);
  const verdict =
    judged.length === 0
      ? "NO TARGET WAS JUDGED — every targeted row is missing one of its instants, and an unknown " +
        "is never substituted. This run measured the shape and not the objective."
      : judged.every((r) => r.met === true)
        ? `THE TARGETS WERE MET on ${String(judged.length)} of the ${String(rows.length)} rows that ` +
          "carry one; the other rows are recorded and are outside the target by the card's own words."
        : `THE TARGETS WERE NOT MET: ${judged
            .filter((r) => r.met !== true)
            .map((r) => `${r.id} (${String(r.seconds)}s against ${r.target})`)
            .join(", ")}. A slow run RECORDED is not the objective achieved.`;
  return { rows, unknown, verdict };
}

/**
 * WHAT THE EXPRESS ARM PRINTS. Every line is a live value — the express
 * path is an act performed at a moment, not a function of a tree — except
 * the ones that are functions of the tree, which carry its ref.
 *
 * @param {Ctx} ctx
 * @param {ExpressPlan} plan
 * @param {?ExpressResult} result
 * @returns {Rec[]}
 */
export function expressRecs(ctx, plan, result) {
  const t = treeProv(ctx.ref, "the express arm, over the board and the fence at this ref");
  const l = liveProv(ctx.at, ctx.host, "the express arm's own steps, in the order runExpress performs them");
  /** @type {Rec[]} */
  const recs = [
    note("THE EXPRESS PATH — a short road through the existing one, and every step of it named"),
    value(`the rule this arm is answerable to: the conventions bullet opening "${EXPRESS_BULLET_PHRASE}"`, t),
    value(`outcome sentence, verbatim as the criterion: ${plan.card.criterion}`, l),
    value(`fence: ${plan.fence.join(", ")} — ${String(plan.paths.length)} path(s)`, t),
    value(`compact card: ${plan.card.file} at blob ${plan.blob}`, l),
    value(
      `feature ${plan.placement.feature} / milestone ${plan.placement.milestone} — ${plan.placement.why}`,
      t,
    ),
    blank(),
  ];
  if (plan.reuse !== null) {
    recs.push(
      note("REUSED, AND NO COMPACT CARD WAS CREATED — the card's second criterion"),
      value(`${plan.reuse.card}, attempt ${plan.reuse.attempt} (${plan.reuse.state})`, l),
      value(`  ${plan.reuse.why}`, l),
      blank(),
    );
    return recs;
  }
  recs.push(note("THE ELIGIBILITY — five requirements, each MEASURED and each printed whether it held"));
  for (const f of plan.eligibility.findings) {
    // BOTH LINES ARE STAMPED VALUES AND NEITHER IS A NOTE. This module
    // refuses a note that carries a digit, and a measurement is nothing
    // BUT figures — which is the rule working rather than getting in the
    // way: a count with no ref is the defect the whole command exists to
    // stop, and an eligibility finding is a count.
    recs.push(
      value(`${f.met ? "MET" : "NOT MET"} — ${f.id}: ${f.requires}`, l),
      value(`    ${f.measured}`, l),
    );
  }
  recs.push(
    value(
      plan.eligibility.eligible
        ? "ELIGIBLE — every requirement met"
        : `INELIGIBLE — ${plan.eligibility.refusals.length} requirement(s) not met, named above`,
      l,
    ),
    blank(),
    note("THE LAUNCH RECEIPT'S REQUESTED HALF — what the template asked for, before anything ran"),
    value(`requested model: ${plan.requested.model}`, t),
    value(
      `requested effort: ${plan.requested.effort}` +
        (plan.requested.effort === EFFORT_NOT_CONFIGURED
          ? " — and that is a RECORDED VALUE, not an empty field: no template in this tree carries an effort per role yet"
          : ""),
      t,
    ),
    value(
      "  the OBSERVED half is the harness's, and it reaches the record through `--run observe` " +
        "with the completion as its evidence. Requested and observed are separate fields and a " +
        "missing observation is `unknown`: copying the requested value into the observed field " +
        "would be a forgery, and the merge verb refuses a mismatch by name.",
      l,
    ),
    blank(),
  );
  if (result === null) return recs;
  recs.push(note("THE LEDGER — every step this run performed, with what it ran and what it answered"));
  for (const step of result.done) {
    recs.push(value(`step ${String(step.n)} (${step.id}): exit ${String(step.exit)} — ${step.detail}`, l));
  }
  if (result.stopped !== null) {
    recs.push(
      value(
        `STOPPED at step ${String(result.stopped.n)} (${result.stopped.id}) — ${result.stopped.detail}`,
        l,
      ),
    );
  }
  recs.push(blank());
  return recs;
}

/**
 * THE MEASUREMENT INPUT, TAKEN OFF A RUN RECORD'S OWN STAMPED INSTANTS.
 *
 * **THIS IS WHAT MAKES THE DEMONSTRATION A TRANSCRIPTION RATHER THAN A
 * RECOLLECTION.** Every figure the sixth criterion asks for is the
 * difference between two instants some part of the loop already stamped:
 * the dispatch stamps the outcome sentence's own instant and the lane cut
 * into the assignment it writes, the run record stamps the candidate at
 * the attempt's terminal transition, and the seat stamps the owed set's
 * conclusion, the merge and the push through the collect verb. Nothing
 * here holds a stopwatch, and a notes section written from this block is
 * copied out of a record rather than remembered.
 *
 * The argument is duck-typed rather than the run record's own type
 * because this module does not import `run-record.mjs` — the dependency
 * runs the other way, and a cycle between the two would be a load-order
 * bug nobody could see from either file.
 *
 * @param {{ instants?: Record<string, string> }} record
 * @returns {{ requested: string, cut: string, candidate: string, checked: string, merged: string, pushed: string, runner?: string }}
 */
export function expressInstants(record) {
  const held = record.instants ?? {};
  /** @param {string} key */
  const at = (key) => String(held[key] ?? "");
  return {
    requested: at("requested"),
    cut: at("cut"),
    candidate: at("candidate"),
    checked: at("checked"),
    merged: at("merged"),
    pushed: at("pushed"),
    ...(at("runner") === "" ? {} : { runner: at("runner") }),
  };
}

/**
 * IS THERE ANYTHING TO MEASURE ON THIS RECORD? — an attempt carrying only
 * the `started` instant this arm writes for every child has nothing an
 * express measurement is about, and printing five unknown rows under it
 * would be noise on every ordinary run.
 *
 * @param {{ instants?: Record<string, string> }} record
 * @returns {boolean}
 */
export function hasExpressInstants(record) {
  return Object.values(expressInstants(record)).some((v) => v !== "");
}
