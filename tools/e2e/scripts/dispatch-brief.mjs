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
import { createHash } from "node:crypto";
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
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
import { rawBullet } from "./range-rule.mjs";

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
 * @param {number} n
 * @returns {string}
 */
export function numberedStep(md, n) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(`${n}. `));
  if (start < 0) {
    throw new Error(`dispatch-brief: this role file has no step ${n}`);
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
 * @property {LaneSpellings} spellings
 * @property {string} conventions
 * @property {string} roleMd
 * @property {string} archMd
 * @property {boolean} full
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
  ];
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
  const { tip, base } = integrationRefs(ctx.integrationLog, ctx.integrationRef);
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
    value(`base commit: ${base}`, live(ctx, `${logVia}, newest Checkpoint`)),
    value(`integration tip right now: ${tip}`, live(ctx, logVia)),
    value(
      `create: ${createLine}`,
      carriesBase || spelledAbsolutely
        ? live(
            ctx,
            "docs/CONVENTIONS.md lane bullet create command" +
              (carriesBase ? `, base substituted from ${logVia}` : "") +
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
          tree(ctx, "docs/CONVENTIONS.md Build and test, verbatim"),
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
      tree(ctx, "docs/CONVENTIONS.md PORT RULE bullet"),
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
    lanes: laneWorktrees(porcelain, spellings),
    porcelain,
    integrationRef: integration.rev,
    integrationLog: git(root, ["log", "--first-parent", "--format=%H %s", integration.rev]),
    spellings,
    conventions,
    roleMd: roleText(role, root),
    archMd: architectureText(root),
    full: opts.full ?? false,
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
 * THE DISPATCH RITUAL, PERFORMED (T-239) — eight steps, in the order the
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
 * verifier's bench when you cut the lane. The eight steps below are that
 * order, and `DISPATCH_STEPS` is the only place it is written down.
 *
 * ── WHAT THIS SECTION MAY AND MAY NOT DO ─────────────────────────────
 * THE DERIVATIONS ARE PURE AND THE ONE ACTING FUNCTION TAKES ITS WORLD
 * AS AN ARGUMENT. `dispatchLanePlan` reads and computes; it spawns
 * nothing and writes nothing, so a `--dry-run` is the plan printed and
 * no more. `runDispatchLane` is the single function that acts, and every
 * process it starts and every byte it writes goes through the `DispatchIo`
 * it is handed — which is what lets a body drive a real failure at any
 * one of the eight steps without cutting eight worktrees. This is the
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
  if (token.endsWith("*")) {
    const prefix = token.slice(0, -1);
    return prefix !== "" && rel.startsWith(prefix);
  }
  const t = token.replace(/\/+$/, "");
  if (t === "") return false;
  return rel === t || rel.startsWith(`${t}/`);
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

/**
 * @typedef {object} DispatchLaneOptions
 * @property {string} taskId
 * @property {string} slug     the dispatcher's, and the one thing here that is not derived
 * @property {string} [executor] the seat to stamp as `builder:`
 * @property {string} [verifier] the seat to stamp as `verifier:`
 * @property {string} [scratch]  the directory the brief is written into
 */

/**
 * @typedef {object} DispatchPlan
 * @property {string} root
 * @property {string} taskId
 * @property {string} slug
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
  /** @type {Record<string, string>} */
  const stamp = { status: "building" };
  if (opts.executor !== undefined && opts.executor !== "") stamp["builder"] = opts.executor;
  if (opts.verifier !== undefined && opts.verifier !== "") stamp["verifier"] = opts.verifier;
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

  return {
    root: ctx.root,
    taskId,
    slug,
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
      if (tier === "bounded") {
        notes.push(
          "the bounded tier takes no verifier at all (method/tasks/TASK-FORMAT.md, The tier), so " +
            "no phase 1 was rendered and none is owed. Said out loud, because a phase this arm " +
            "skipped on purpose and a phase it forgot look the same on disk.",
        );
        done.push({
          n: step.n,
          id: step.id,
          ran,
          exit: EXIT.CLEAN,
          detail: "not owed at the bounded tier",
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
    value(
      `phase 1 brief: ${plan.phase1File}`,
      liveProv(
        ctx.at,
        ctx.host,
        "the scratch directory this dispatch was given, with the SCRATCH RULE's own file name in it",
      ),
    ),
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
