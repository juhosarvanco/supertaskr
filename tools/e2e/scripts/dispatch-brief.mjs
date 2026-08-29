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
import { readFileSync } from "node:fs";
import path from "node:path";
import {
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
 */

/**
 * `git worktree list --porcelain`, parsed. PURE — it takes the text, so
 * the pin that drives a detached worktree at a lane-shaped path can feed
 * it a fixture without creating one on disk.
 *
 * @param {string} porcelain
 * @returns {WorktreeEntry[]}
 */
export function parseWorktreePorcelain(porcelain) {
  /** @type {WorktreeEntry[]} */
  const out = [];
  /** @type {{ path: string, head: string, branch: string } | undefined} */
  let cur;
  for (const line of porcelain.split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
      if (cur !== undefined) out.push(cur);
      cur = { path: line.slice("worktree ".length).trim(), head: "", branch: "" };
      continue;
    }
    if (cur === undefined) continue;
    if (line.startsWith("HEAD ")) cur.head = line.slice("HEAD ".length).trim();
    else if (line.startsWith("branch ")) cur.branch = line.slice("branch ".length).trim();
  }
  if (cur !== undefined) out.push(cur);
  return out;
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
 * Row 3's source is the project's OWN root adapter — the filled-in file
 * at the repository root, not the template it was copied from. Which
 * files those are is derived from the adapters template directory rather
 * than named here.
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
  /** @type {Rec[]} */
  const recs = [];
  /** @type {Map<string, string[]>} */
  const sets = new Map();
  for (const rel of roots) {
    const docs = [
      ...new Set(
        [...readDoc(rel, ctx.root).matchAll(/\bdocs\/[A-Za-z0-9_./-]*\.md\b/g)].map((m) => m[0]),
      ),
    ];
    sets.set(rel, docs);
    recs.push(value(`${rel} names: ${docs.join(" ")}`, tree(ctx, rel)));
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
  const logVia = `git log --first-parent --format=%H %s ${s.integrationBranch}`;
  const { tip, base } = integrationRefs(ctx.integrationLog, s.integrationBranch);
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
  const absolute = path.resolve(ctx.root, worktree);
  const create =
    ctx.taskId === ""
      ? s.createCommand
      : s.createCommand.split("T-NNN").join(ctx.taskId).replace("<base>", base);
  // DERIVED, not assumed: whether this line carries the moving hash is
  // what decides its stamp. With no task named it is the document's own
  // text, `<base>` placeholder and all, and a transcription is a tree fact.
  const carriesBase = create.includes(base);
  return [
    value(`integration branch: ${s.integrationBranch}`, tree(ctx, "docs/CONVENTIONS.md lane bullet")),
    value(`branch: ${branch}`, tree(ctx, "docs/CONVENTIONS.md lane bullet branch spelling")),
    value(
      `worktree (absolute, per lane-protocol rule three): ${absolute}`,
      tree(ctx, "docs/CONVENTIONS.md lane bullet worktree spelling"),
    ),
    // THE THREE MOVING FIGURES. Each is a read of the integration REF, so
    // each carries the time and host it was read at and never a commit —
    // see `integrationRefs`. The create command is the third because the
    // base is SUBSTITUTED INTO IT: the document it is otherwise a
    // transcription of cannot produce that hash, and the line a dispatcher
    // pastes is the one rule 2 is about.
    value(`base commit: ${base}`, live(ctx, `${logVia}, newest Checkpoint`)),
    value(`integration tip right now: ${tip}`, live(ctx, logVia)),
    value(
      `create: ${create}`,
      carriesBase
        ? live(ctx, `docs/CONVENTIONS.md lane bullet create command, base substituted from ${logVia}`)
        : tree(ctx, "docs/CONVENTIONS.md lane bullet create command"),
    ),
    value(`lane-protocol rule two: ${rule2}`, tree(ctx, "method/lane-protocol.md rule two")),
    value(`lane-protocol rule three: ${rule3}`, tree(ctx, "method/lane-protocol.md rule three")),
    value(`base rule: ${dispatchBullet}`, tree(ctx, "docs/CONVENTIONS.md dispatch bullet")),
    ...(ctx.full
      ? [value(`lane bullet in full: ${laneBullet.replace(/\s+/g, " ")}`, tree(ctx, "docs/CONVENTIONS.md lane bullet"))]
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
  for (const lane of ctx.lanes) {
    const card = ctx.cards.get(lane.taskId);
    if (card === undefined) {
      ctx.findings.push(
        `${lane.taskId} holds a worktree on ${lane.branch} and no live card declares that id — ` +
          "a lane whose fence cannot be read is a fence nobody can be disjoint from.",
      );
      recs.push(value(`${lane.taskId}: no live card, fence UNKNOWN`, live(ctx, via)));
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
  if (fences.length < 2) overlapLines.push("fewer than two fences to compare");
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
    value(
      `never touch the integration branch: ${numberedStep(laneProtocolText(ctx.root), 4)}`,
      tree(ctx, "method/lane-protocol.md rule four"),
    ),
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
    integrationLog: git(root, [
      "log",
      "--first-parent",
      "--format=%H %s",
      spellings.integrationBranch,
    ]),
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

/** Every fence slug the map knows, with the lane holding it or FREE. */
/**
 * @param {Ctx} ctx
 * @returns {{ slug: string, heldBy: string }[]}
 */
export function fenceLedger(ctx) {
  /** @type {Map<string, string[]>} */
  const holders = new Map();
  for (const lane of ctx.lanes) {
    const card = ctx.cards.get(lane.taskId);
    if (card === undefined) continue;
    for (const entry of fieldList(card.fields, "touches")) {
      const held = holders.get(entry) ?? [];
      held.push(lane.taskId);
      holders.set(entry, held);
    }
  }
  /** @type {Set<string>} */
  const all = new Set([...ctx.slugs.keys(), ...holders.keys()]);
  return [...all]
    .sort()
    .map((slug) => ({ slug, heldBy: (holders.get(slug) ?? []).join(", ") || "FREE" }));
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
  recs.push(blank(), note("THE FENCE LEDGER — held or free, derived from the lanes above"));
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
