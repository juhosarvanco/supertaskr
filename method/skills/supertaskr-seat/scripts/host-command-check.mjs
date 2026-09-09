#!/usr/bin/env node
/**
 * THE HOST-COMMAND CHECK — the pack's own tool, and the reason
 * `references/host-commands.md` is a TRANSCRIPTION rather than a claim.
 *
 * `SKILL.md` promises, in as many words, that it invents no command:
 * every command the seat runs is one the host project's own governing
 * documents already name, and it is named WITH THE DIRECTORY IT RUNS IN
 * (`docs/STATE.md`'s standing hazard, *"A COMMAND HERE CARRIES ITS CWD
 * AND ITS ARGUMENT"*). This program is that promise made mechanical.
 *
 * WHAT IT DOES, per row of the reference:
 *
 *   1. read the row's `AUTHORITY:` line and resolve the FIRST backticked
 *      path in it to a file — the row's OWN authority, never merely one
 *      of them, because "it appears in one of the two governing
 *      documents" is a weaker claim than the row makes;
 *   2. collapse the whitespace on BOTH sides and require every `HOST>`
 *      command of that row to appear in that file. Collapsing is not a
 *      convenience: the authority files are hard-wrapped at about
 *      seventy columns, so a command is routinely split across two lines
 *      there and a naive search returns the "absent" answer;
 *   3. require the row's `CWD>` phrase to appear anywhere in the
 *      authority CORPUS, because the directory a command runs in is
 *      routinely stated in a different bullet from the command itself.
 *
 * THE SET DIFFERENCE IS ONE-DIRECTIONAL AND THAT IS THE CRITERION'S
 * OWN SHAPE: *every command the skill names* must be one the conventions
 * name. The converse — a convention command the pack does not carry — is
 * not a defect; the pack is a seat's checklist, not a mirror of the
 * build system.
 *
 * BACKTICKS: stripped on the CWD side only. A cwd phrase routinely spans
 * a backtick boundary in prose (`npm run boot:check` runs FROM
 * `tools/e2e/`), while a command sits INSIDE one pair — so stripping
 * them for commands would let a needle match across two unrelated code
 * spans, which is a looser check for no gain.
 *
 * ZERO DEPENDENCIES AND NO INSTALL, deliberately: like the token lint
 * and the method evals it must answer against a bare checkout.
 *
 * usage:
 *   node host-command-check.mjs --repo <dir> [--pack <dir>] [--authority <rel>]...
 *   node host-command-check.mjs --selftest
 *
 * EXIT CODES, the four house codes: 0 every command and cwd resolves ·
 * 1 the check HAS a verdict (something does not resolve) · 2 called
 * wrong · 3 the check COULD NOT RUN (no reference, or no rows in it).
 */

import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const EXIT = Object.freeze({ CLEAN: 0, VERDICT: 1, USAGE: 2, CANNOT_RUN: 3 });

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PACK = path.join(HERE, "..");
const DEFAULT_AUTHORITIES = ["docs/CONVENTIONS.md", "docs/STATE.md"];
const REFERENCE = path.join("references", "host-commands.md");

/** Whitespace collapsed; the one normalization both sides share. */
const collapse = (s) => s.replace(/\s+/g, " ").trim();
/** …and, for a cwd phrase only, markup removed. */
const collapseProse = (s) => collapse(s.replace(/`/g, ""));

/* ------------------------------------------------------------------ */
/* the reference: parse it into ROWS                                    */
/* ------------------------------------------------------------------ */

/**
 * @typedef {{
 *   heading: string, line: number, authority: string|null,
 *   commands: { text: string, line: number }[],
 *   noCommand: string|null,
 *   cwd: { text: string, line: number }|null,
 *   cwdUnstated: string|null,
 * }} Row
 */

/**
 * A ROW is a `###` heading and everything under it until the next
 * heading of any level. Markers outside every row are a defect: the
 * check would silently ignore them, so they are collected under a
 * synthetic row and reported.
 *
 * @param {string} text @returns {Row[]}
 */
function parseRows(text) {
  /** @type {Row[]} */
  const rows = [];
  /** @type {Row} */
  let current = {
    heading: "(before the first heading)",
    line: 0,
    authority: null,
    commands: [],
    noCommand: null,
    cwd: null,
    cwdUnstated: null,
  };
  rows.push(current);

  text.split("\n").forEach((raw, i) => {
    const line = i + 1;
    const heading = raw.match(/^###\s+(.*\S)\s*$/);
    if (heading) {
      current = {
        heading: heading[1],
        line,
        authority: null,
        commands: [],
        noCommand: null,
        cwd: null,
        cwdUnstated: null,
      };
      rows.push(current);
      return;
    }
    if (/^##\s+/.test(raw)) {
      // a section heading closes the row without opening one
      current = {
        heading: `(under ${raw.replace(/^##\s+/, "").trim()}, no ### row)`,
        line,
        authority: null,
        commands: [],
        noCommand: null,
        cwd: null,
        cwdUnstated: null,
      };
      rows.push(current);
      return;
    }
    const auth = raw.match(/^AUTHORITY:\s*`([^`]+)`/);
    if (auth && !current.authority) current.authority = auth[1];
    const host = raw.match(/^\s*HOST>\s+(.*\S)\s*$/);
    if (host) {
      const none = host[1].match(/^NONE\s+—\s*(.*)$/);
      if (none) current.noCommand = none[1];
      else current.commands.push({ text: host[1], line });
    }
    const cwd = raw.match(/^\s*CWD>\s+(.*\S)\s*$/);
    if (cwd) {
      const unstated = cwd[1].match(/^UNSTATED\s+—\s*(.*)$/);
      if (unstated) current.cwdUnstated = unstated[1];
      else if (!current.cwd) current.cwd = { text: cwd[1], line };
    }
  });

  // Rows that carry no marker at all are prose, not rows to check.
  return rows.filter(
    (r) => r.commands.length > 0 || r.noCommand !== null || r.cwd !== null || r.cwdUnstated !== null,
  );
}

/* ------------------------------------------------------------------ */
/* the comparison                                                       */
/* ------------------------------------------------------------------ */

/**
 * @param {Row[]} rows
 * @param {Map<string,string>} corpus rel -> collapsed text
 * @param {string} label
 */
function run(rows, corpus, label) {
  const proseCorpus = [...corpus.entries()].map(([rel, text]) => ({
    rel,
    text: collapseProse(text),
  }));
  const lines = [];
  let commands = 0;
  let resolved = 0;
  let declaredCommandless = 0;
  let cwdResolved = 0;
  let cwdDeclared = 0;
  const findings = [];

  for (const row of rows) {
    const where = `${row.heading}:${row.line}`;

    if (row.commands.length === 0 && row.noCommand === null) {
      findings.push(`NO COMMAND  ${where} — the row carries neither a HOST> line nor a HOST> NONE declaration`);
      lines.push(`  MISS ${where} — no HOST> line and no declaration`);
    }

    if (!row.authority && row.commands.length > 0) {
      findings.push(`NO AUTHORITY  ${where} — HOST> lines with no AUTHORITY: line to resolve them against`);
      lines.push(`  MISS ${where} — no AUTHORITY: line`);
    }

    for (const cmd of row.commands) {
      commands += 1;
      const authText = row.authority ? corpus.get(row.authority) : undefined;
      if (authText === undefined) {
        findings.push(
          `UNREADABLE AUTHORITY  ${where} — ${JSON.stringify(row.authority)} is not one of the authority files`,
        );
        lines.push(`  MISS ${where}  ${cmd.text}  <- authority ${row.authority} unreadable`);
        continue;
      }
      if (authText.includes(collapse(cmd.text))) {
        resolved += 1;
        lines.push(`  OK   ${row.authority}:${cmd.line}  ${cmd.text}`);
      } else {
        findings.push(`COMMAND NOT NAMED  ${where}:${cmd.line} — ${cmd.text} — absent from ${row.authority}`);
        lines.push(`  MISS ${row.authority}:${cmd.line}  ${cmd.text}`);
      }
    }
    if (row.noCommand !== null) {
      declaredCommandless += 1;
      lines.push(`  NONE ${where} — declared commandless: ${row.noCommand}`);
    }

    if (row.cwd === null && row.cwdUnstated === null) {
      findings.push(`NO CWD  ${where} — the row names a command and no directory to run it in`);
      lines.push(`  MISS ${where} — no CWD> line and no declaration`);
    } else if (row.cwd) {
      const needle = collapseProse(row.cwd.text);
      const hit = proseCorpus.find((a) => a.text.includes(needle));
      if (hit) {
        cwdResolved += 1;
        lines.push(`  CWD  ${where} — "${row.cwd.text}" <- ${hit.rel}`);
      } else {
        findings.push(`CWD NOT NAMED  ${where}:${row.cwd.line} — "${row.cwd.text}" — absent from every authority`);
        lines.push(`  MISS ${where} — cwd "${row.cwd.text}" absent from every authority`);
      }
    } else {
      cwdDeclared += 1;
      lines.push(`  CWD  ${where} — declared UNSTATED: ${row.cwdUnstated}`);
    }
  }

  const report = [
    label,
    ...lines,
    `rows: ${rows.length} · HOST> commands ${commands} · resolved ${resolved} · declared commandless ${declaredCommandless}`,
    `cwd: resolved ${cwdResolved} · declared UNSTATED ${cwdDeclared}`,
    `findings: ${findings.length}`,
    ...findings.map((f) => `  ${f}`),
  ].join("\n");

  return { findings: findings.length, commands, resolved, cwdResolved, cwdDeclared, report };
}

/* ------------------------------------------------------------------ */
/* --selftest: a POSITIVE CONTROL per finding class                     */
/* ------------------------------------------------------------------ */

/**
 * A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL. Each case below hands
 * the comparison a reference that LACKS the property and requires it to
 * be caught; a case the check PASSES is a selftest failure, because a
 * check nobody has watched fail is a claim rather than a measurement.
 *
 * The corpus here is synthetic and tiny on purpose — the point is the
 * COMPARISON's behaviour, not this repository's conventions.
 */
function selftest() {
  const dir = mkdtempSync(path.join(tmpdir(), "host-command-selftest-"));
  const repo = path.join(dir, "repo");
  const packRel = "method/skills/supertaskr-seat";
  mkdirSync(path.join(repo, packRel, "references"), { recursive: true });
  mkdirSync(path.join(repo, "docs"), { recursive: true });

  writeFileSync(
    path.join(repo, "docs", "CONVENTIONS.md"),
    [
      "- THE RUNNER: `node tools/x/run.mjs --all`",
      "  from the repo root is the ONE spelling.",
      "- THE OTHER ONE (hard-wrapped exactly the way the real files are):",
      "  `node tools/x/other.mjs --task",
      "  T-NNN` and nothing else.",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(repo, "docs", "STATE.md"),
    ["- BOARD: `x.mjs --state`.", "- A COMMAND HERE CARRIES ITS CWD.", ""].join("\n"),
  );

  const good = [
    "# reference",
    "",
    "### the runner",
    "",
    "AUTHORITY: `docs/CONVENTIONS.md`, THE RUNNER bullet.",
    "",
    "    HOST> node tools/x/run.mjs --all",
    "    CWD> from the repo root",
    "",
    "### the hard-wrapped one",
    "",
    "AUTHORITY: `docs/CONVENTIONS.md`, THE OTHER ONE bullet.",
    "",
    "    HOST> node tools/x/other.mjs --task T-NNN",
    "    CWD> from the repo root",
    "",
    "### the board",
    "",
    "AUTHORITY: `docs/STATE.md`, the BOARD bullet.",
    "",
    "    HOST> x.mjs --state",
    "    CWD> UNSTATED — no bullet names one",
    "",
    "### the derived pair",
    "",
    "AUTHORITY: `docs/STATE.md`, the BOARD bullet.",
    "",
    "    HOST> NONE — the arm derives these",
    "    CWD> UNSTATED — no command",
    "",
  ].join("\n");

  const refPath = path.join(repo, packRel, REFERENCE);
  const corpus = new Map(
    DEFAULT_AUTHORITIES.map((rel) => [rel, collapse(readFileSync(path.join(repo, rel), "utf8"))]),
  );

  /** @param {string} text */
  const rowsOf = (text) => parseRows(text);

  const cases = [
    [
      "a command NO authority names",
      good.replace("node tools/x/run.mjs --all", "node tools/x/there-is-no-such-script.mjs --invented"),
    ],
    [
      "a command the OTHER authority names, cited against the wrong one",
      good.replace("AUTHORITY: `docs/STATE.md`, the BOARD bullet.\n\n    HOST> x.mjs --state", "AUTHORITY: `docs/CONVENTIONS.md`, the BOARD bullet.\n\n    HOST> x.mjs --state"),
    ],
    ["a row with no HOST> line at all", good.replace("    HOST> node tools/x/run.mjs --all\n", "")],
    ["a row with no CWD> line at all", good.replace("    CWD> from the repo root\n", "")],
    ["a cwd phrase no authority states", good.replace("CWD> from the repo root", "CWD> from wherever you happen to be")],
    [
      "a row whose AUTHORITY: line is missing",
      good.replace("AUTHORITY: `docs/CONVENTIONS.md`, THE RUNNER bullet.\n", ""),
    ],
    [
      "a row citing an authority that is not one of the files",
      good.replace("AUTHORITY: `docs/CONVENTIONS.md`, THE RUNNER bullet.", "AUTHORITY: `docs/INVENTED.md`, some bullet."),
    ],
  ];

  const out = [];
  const baseline = run(rowsOf(good), corpus, "baseline (undegraded)");
  out.push(`rows parsed: ${rowsOf(good).length} · commands ${baseline.commands} · resolved ${baseline.resolved}`);
  out.push(`baseline findings: ${baseline.findings}`);
  let failures = 0;
  if (baseline.findings > 0) {
    failures += 1;
    out.push("  FAIL the undegraded baseline already has findings — the degradations below prove nothing");
    out.push(baseline.report);
  }
  if (baseline.commands === 0) {
    failures += 1;
    out.push("  FAIL the baseline compared zero commands — an exit 0 over zero bodies is not a pass");
  }
  let caught = 0;
  for (const [name, text] of cases) {
    const r = run(rowsOf(text), corpus, name);
    if (r.findings > 0) {
      caught += 1;
      out.push(`  CAUGHT  ${name} (${r.findings} finding(s))`);
    } else {
      failures += 1;
      out.push(`  MISSED  ${name} — the check PASSED a reference that lacks the property`);
    }
  }
  out.push(`degradations: ${cases.length} · caught ${caught} · missed ${cases.length - caught}`);
  out.push(`selftest scratch: ${refPath} (unwritten; the cases are held in memory)`);
  console.log(out.join("\n"));
  return failures === 0 ? EXIT.CLEAN : EXIT.VERDICT;
}

/* ------------------------------------------------------------------ */
/* argv                                                                 */
/* ------------------------------------------------------------------ */

function main(argv) {
  /** @type {Record<string, string|boolean|string[]>} */
  const opt = { authority: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) return usage(`unexpected argument ${JSON.stringify(a)}`);
    const key = a.slice(2);
    if (key === "selftest") {
      opt[key] = true;
      continue;
    }
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) return usage(`--${key} wants a value`);
    if (key === "authority") /** @type {string[]} */ (opt.authority).push(v);
    else opt[key] = v;
    i += 1;
  }

  if (opt.selftest) return selftest();

  if (!opt.repo) return usage("--repo is required (or --selftest)");
  const repo = path.resolve(String(opt.repo));
  const pack = opt.pack ? path.resolve(String(opt.pack)) : DEFAULT_PACK;
  const authorities = /** @type {string[]} */ (opt.authority).length
    ? /** @type {string[]} */ (opt.authority)
    : DEFAULT_AUTHORITIES;

  const refPath = path.join(pack, REFERENCE);
  if (!existsSync(refPath)) {
    console.error(`host-command-check: CANNOT RUN — ${refPath} does not exist`);
    return EXIT.CANNOT_RUN;
  }
  /** @type {Map<string,string>} */
  const corpus = new Map();
  for (const rel of authorities) {
    const p = path.join(repo, rel);
    if (!existsSync(p)) {
      console.error(`host-command-check: CANNOT RUN — the authority ${p} does not exist`);
      return EXIT.CANNOT_RUN;
    }
    corpus.set(rel, collapse(readFileSync(p, "utf8")));
  }

  const rows = parseRows(readFileSync(refPath, "utf8"));
  if (rows.length === 0) {
    console.error(
      `host-command-check: CANNOT RUN — ${refPath} carries no HOST>/CWD> rows, so the comparison would be vacuous`,
    );
    return EXIT.CANNOT_RUN;
  }

  const r = run(rows, corpus, `reference: ${path.relative(repo, refPath)}`);
  console.log(r.report);
  if (r.commands === 0) {
    console.error(
      "host-command-check: CANNOT RUN — zero commands were compared; an exit 0 over zero bodies is not a pass",
    );
    return EXIT.CANNOT_RUN;
  }
  return r.findings === 0 ? EXIT.CLEAN : EXIT.VERDICT;
}

function usage(why) {
  console.error(`host-command-check: ${why}`);
  console.error(
    "usage: host-command-check.mjs --repo <dir> [--pack <dir>] [--authority <rel>]...",
  );
  console.error("       host-command-check.mjs --selftest");
  return EXIT.USAGE;
}

process.exit(main(process.argv.slice(2)));
