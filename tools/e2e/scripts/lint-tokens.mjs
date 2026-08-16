#!/usr/bin/env node
/**
 * Token lint (T-020, absorbing T-001-s2): the grep-grade guard over the
 * Tailwind v4 escape hatches documented in CONVENTIONS. UI work adds
 * tokens to app/src/styles/tokens.css, never arbitrary values or
 * default-palette utilities — unmapped utilities are deliberately dead,
 * and arbitrary values (`p-[13px]`) bypass enforcement entirely.
 *
 * Plain node, zero deps. Walks app/src `**` / `*.{ts,tsx}` (css excluded
 * — tokens.css/index.css are the legal home of raw values and bracketed
 * selectors), applies four patterns per line, prints every
 * `file:line: match`, exits non-zero on any hit.
 *
 * Recorded exclusion (plan §5): arbitrary VARIANTS (`[&_svg]:…`) are
 * deliberately not linted — they target selectors, not values (the
 * token mechanism still governs the utility half), and vendored
 * ui/button.tsx legitimately carries three. No allow-comment mechanism —
 * zero-allowlist by design; a genuine future collision is a
 * consultation, not an escape hatch.
 *
 * Usage:
 *   node scripts/lint-tokens.mjs             lint app/src
 *   node scripts/lint-tokens.mjs --selftest  run the embedded samples
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/** tools/e2e/scripts -> repo root. */
const repoRoot = path.resolve(here, "..", "..", "..");
const target = path.join(repoRoot, "app", "src");

/** The 22-name Tailwind default palette (P3). */
const PALETTE =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|" +
  "violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";

/** Color-bearing utility prefixes whose default-scale forms are
 * dead-by-mechanism here (no @theme mapping), so any occurrence is a
 * silent no-op bug made loud. */
const COLOR_PREFIXES =
  "bg|text|border|ring|outline|fill|stroke|shadow|decoration|divide|accent|caret";

/** The four patterns (plan §5 table). Fresh regexes per scan (global
 * flag state is per-instance). */
function makePatterns() {
  return [
    {
      id: "P1",
      what: "arbitrary value (`p-[13px]` family — the T-001-s2 bypass)",
      re: /-\[[^\]]/g,
    },
    {
      id: "P2",
      what: "arbitrary property (`[color:red]` family)",
      re: /(^|["'`{ ])\[[a-z-]+:[^\]]+\]/g,
    },
    {
      id: "P3",
      what: "Tailwind default-palette utility (dead by mechanism here)",
      re: new RegExp(`\\b(${COLOR_PREFIXES})-(${PALETTE})-[0-9]{2,3}\\b`, "g"),
    },
    {
      id: "P4",
      what: "v4 var shorthand (`bg-(--x)` — compiles without a mapped utility)",
      re: /-\(--/g,
    },
  ];
}

/** Widen a raw regex match to the surrounding utility-ish token so the
 * report reads `p-[13px]`, not the bare 3-char match. Display only —
 * detection is the regex alone. */
function displayMatch(line, index, length) {
  const boundary = /[\s"'`{}<>,;]/;
  let start = index;
  while (start > 0 && !boundary.test(line[start - 1])) start -= 1;
  let end = index + length;
  while (end < line.length && !boundary.test(line[end])) end += 1;
  return line.slice(start, end);
}

/** Every pattern hit in one line of text: `{id, what, match}`. */
function scanLine(line) {
  const hits = [];
  for (const { id, what, re } of makePatterns()) {
    for (const m of line.matchAll(re)) {
      hits.push({ id, what, match: displayMatch(line, m.index, m[0].length) });
    }
  }
  return hits;
}

/** Recursive deterministic walk for .ts/.tsx files. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

function lintTree() {
  let files;
  try {
    files = walk(target);
  } catch (err) {
    console.error(`lint-tokens: cannot walk ${target}: ${String(err)}`);
    process.exit(2);
  }
  let count = 0;
  for (const file of files) {
    const rel = path.relative(repoRoot, file);
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      for (const hit of scanLine(lines[i])) {
        count += 1;
        console.log(`${rel}:${i + 1}: ${hit.match.trim()}  [${hit.id}: ${hit.what}]`);
      }
    }
  }
  if (count > 0) {
    console.error(
      `\nlint-tokens: ${count} violation${count === 1 ? "" : "s"} — tokens live in ` +
        "app/src/styles/tokens.css; arbitrary values and default-palette " +
        "utilities are banned (docs/CONVENTIONS.md).",
    );
    process.exit(1);
  }
  console.log(`lint-tokens: clean (${files.length} files scanned under app/src)`);
}

/** Embedded selftest: positives each caught by exactly the intended
 * pattern(s); negatives (the tree's real near-misses) caught by none. */
const SAMPLES = [
  // positives
  { text: 'className="p-[13px]"', expect: ["P1"] },
  { text: 'className="text-[0.8rem] leading-none"', expect: ["P1"] },
  { text: '"max-h-[320px] overflow-auto"', expect: ["P1"] },
  { text: '<div className="[color:red]">', expect: ["P2"] },
  { text: 'cn("[mask-type:luminance]")', expect: ["P2"] },
  { text: '"text-red-500"', expect: ["P3"] },
  { text: "className={cn('bg-stone-200')}", expect: ["P3"] },
  { text: '"shadow-slate-900/20"', expect: ["P3"] },
  { text: '"bg-(--brand)"', expect: ["P4"] },
  // negatives — the tree's legal forms and real near-misses
  { text: '"[&_svg]:size-4 [&_svg]:shrink-0"', expect: [] }, // arbitrary VARIANT (vendored button.tsx)
  { text: 'target.closest("[data-card-trigger]")', expect: [] }, // selector string
  { text: '"aria-invalid:border-destructive"', expect: [] }, // state variant on a token
  { text: '"w-150 max-w-full gap-1.75"', expect: [] }, // spacing tokens
  { text: '"bg-status-done text-status-done-foreground"', expect: [] }, // mapped tokens
  { text: '"focus-visible:ring-ring/50"', expect: [] }, // token + opacity
  { text: "var(--background)", expect: [] }, // css var read, no shorthand
  { text: '"rounded-chip border px-2.25 py-0.75"', expect: [] },
];

function selftest() {
  let failures = 0;
  for (const { text, expect } of SAMPLES) {
    const got = [...new Set(scanLine(text).map((h) => h.id))].sort();
    const want = [...expect].sort();
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      failures += 1;
      console.error(
        `selftest FAIL: ${JSON.stringify(text)} matched [${got}] expected [${want}]`,
      );
    }
  }
  if (failures > 0) {
    console.error(`lint-tokens selftest: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log(`lint-tokens selftest: ${SAMPLES.length} samples green`);
}

if (process.argv.includes("--selftest")) selftest();
else lintTree();
