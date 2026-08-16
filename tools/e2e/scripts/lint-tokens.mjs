#!/usr/bin/env node
/**
 * Token lint (T-020, absorbing T-001-s2; made precise by T-038): the
 * guard over the Tailwind v4 escape hatches documented in CONVENTIONS.
 * UI work adds tokens to app/src/styles/tokens.css, never arbitrary
 * values or default-palette utilities — unmapped utilities are
 * deliberately dead, and arbitrary values (`p-[13px]`) bypass
 * enforcement entirely.
 *
 * Plain node, zero deps — structural, not taste: this is CI's FIRST
 * step, ahead of every `npm ci` in the job, so it must run against a
 * bare checkout with nothing installed. Walks the WALK_ROOTS below for
 * `*.{ts,tsx,mjs}` (css excluded — tokens.css/index.css are the legal
 * home of raw values and bracketed selectors), applies four patterns,
 * prints every `file:line: match`, exits non-zero on any hit.
 *
 * ── WHAT IT WALKS (T-045) ────────────────────────────────────────────
 * Until T-045 the walk was app/src alone, which left the one place a
 * `text-red-500` can sit unnoticed while the shipped tree stays clean:
 * app/test. The walk now covers app/src, app/test and tools/e2e — see
 * WALK_ROOTS for the argument per root, WALK_ROOTS_OUT for the trees
 * deliberately left out, and EXCLUDED_FILES for the one file excluded BY
 * NAME rather than by extension. Still ZERO allowlist: those are walk
 * boundaries argued in code, not mutes for a hit inside the corpus.
 *
 * ── WHAT IT LOOKS AT (T-038) ─────────────────────────────────────────
 * The four patterns below are UNCHANGED. What T-038 changed is the text
 * they are applied to, plus one grammar rule applied to their hits:
 *
 * 1. CONTEXT. A hand-written lexer masks every character that is not
 *    string- or template-literal TEXT: code, comments and
 *    regular-expression literals become NUL, with line lengths and
 *    newlines preserved so `file:line` stays exact. String delimiters
 *    survive the mask because P2 anchors on the quote. A Tailwind class
 *    is always string text; a regex literal never is. This is what
 *    unreds the HTML-comment regex in app/src/genesis/genesis-derive.ts
 *    — the collision T-020's verifier predicted (T-020-s5) and T-037's
 *    executor measured (T-037-s1) — without weakening P1 by one
 *    character.
 *
 * 2. VARIANTS. A bracket or paren group immediately followed by `:` is
 *    an arbitrary VARIANT, not an arbitrary value: `data-[state=open]:`,
 *    `group-[.peer]:`, `supports-[display:grid]:`, `min-[600px]:`,
 *    `has-[input:checked]:`, `[&_svg]:`, `supports-(--x):`. Tailwind's
 *    own grammar draws that line — the `:` separates a
 *    selector-targeting variant from the utility it modifies, while a
 *    value ENDS its utility (`p-[13px]`, `bg-(--brand)`). Plan §5
 *    recorded this exclusion in prose and shipped it only for the one
 *    family whose bracket has no leading hyphen; here it is executable
 *    for the whole family, so the next `shadcn add dialog` does not red
 *    the tree. The token mechanism still governs the utility half:
 *    `data-[state=open]:bg-red-500` is still a P3 hit.
 *
 * ── WHAT IT CANNOT SEE — read before trusting a green run ────────────
 * - It is a LEXER, not a TypeScript parser: it knows strings, templates
 *   (including nested substitutions), line and block comments, and regex
 *   literals, and it knows nothing about types, JSX structure or scope.
 * - Regex-versus-division is the classic previous-significant-character
 *   heuristic, plus two JSX guards (a slash followed by `>` is a
 *   self-closing tag; a slash preceded by `<` is a closing tag) and a
 *   hard rule that a regex literal must close on its own line or the
 *   slash is treated as an ordinary code character. So `if (x) /re/.f()`
 *   reads as division, and a stray apostrophe in JSX text opens a
 *   pseudo-string. Both misreads are contained to ONE line — strings and
 *   regexes alike end at the newline — and neither can cascade.
 * - It scans EVERY string, not only class strings: it cannot tell
 *   `className="text-red-500"` from a URL string containing the same
 *   token. That is deliberate. The scan errs toward seeing more, because
 *   a false positive is a one-line consultation while a false negative
 *   silently reopens the bypass this lint exists to close.
 * - The variant rule trusts the `:`. A group that never closes on its
 *   line is treated as a value (reported). A hard-coded breakpoint in
 *   variant position (`min-[600px]:`) is invisible to the lint by that
 *   rule — argued in T-038's notes, filed as T-038-s1.
 * - Still zero allowlist, by design: no file, line or comment can mute
 *   it. A genuine future collision is a consultation, not an escape
 *   hatch (plan §5).
 *
 * Usage:
 *   node scripts/lint-tokens.mjs             lint app/src
 *   node scripts/lint-tokens.mjs --selftest  run the embedded samples
 *
 * `maskSource` and `scanSource` are exported so a throwaway harness can
 * re-derive the evidence (T-038 diffed old-vs-new hits over all 122
 * .ts/.tsx in the repo that way). Nothing in the repo imports them.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/** tools/e2e/scripts -> repo root. */
const repoRoot = path.resolve(here, "..", "..", "..");
/** This script, repo-relative — the one file excluded by NAME (below). */
const selfPath = path.relative(repoRoot, fileURLToPath(import.meta.url)).split(path.sep).join("/");

/**
 * The trees walked, in order, each with the argument for including it
 * (T-045 criterion 5). The corpus is the tree where a Tailwind class can
 * be WRITTEN — not the tree that ships, because a class written in a test
 * is a class the shipped tree is asserted against.
 *
 * - `app/src`   the shipped UI (T-020, the original walk).
 * - `app/test`  the one place a `text-red-500` can sit unnoticed while
 *               app/src stays clean: a unit test that asserts a
 *               default-palette class is pinning a dead utility, and the
 *               fixtures under it feed the same components.
 * - `tools/e2e` the same argument, one rung out: the lane's specs assert
 *               on class strings and computed styles, its fixtures feed
 *               the real components, and an arbitrary value written into
 *               a locator is the same silent bypass. Including it is also
 *               what makes EXCLUDED_FILES load-bearing rather than
 *               decorative — this script lives inside it.
 *
 * Safe to widen only since T-038: over this corpus the pre-T-038
 * line-based scan produced 8 false positives (TypeScript labeled tuples
 * in app/test, `[key: string, value: string]` read as `[color:red]`) and
 * the masked scan produces none — measured `both=0 OLD-only=8 NEW-only=0`
 * over the 51 files, the same differential T-038 ran repo-wide over 122.
 */
export const WALK_ROOTS = ["app/src", "app/test", "tools/e2e"];

/**
 * Trees deliberately NOT walked, with the reason. Left in code because
 * "we forgot" and "we decided" look identical in an absent list.
 *
 * - `lib/parser` NO UI, ever (ADR-011): the parser is a pure library
 *   with no DOM and no stylesheet, so every bracket in it is TypeScript.
 *   Linting it would assert a rule that does not apply to it.
 * - `app/src-tauri` Rust; the patterns are Tailwind grammar.
 * - `docs`, `method` prose, not code.
 */
export const WALK_ROOTS_OUT = ["lib/parser", "app/src-tauri", "docs", "method"];

/** Extensions walked. `.mjs` joined at T-045 with tools/e2e: the lane's
 * scripts are plain node modules, and leaving them out would make the
 * self-exclusion below an accident of file extension. */
export const WALK_EXTENSIONS = /\.(ts|tsx|mjs)$/;

/** Never descended into: build output and installed dependencies are not
 * this repo's source (node_modules/, dist/, target/ are gitignored;
 * test-results/ and playwright-report/ are the lane's run artifacts). */
export const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "target",
  "test-results",
  "playwright-report",
]);

/**
 * Excluded BY NAME, not by extension — the distinction criterion 5 asks
 * for. THIS script is the one file in the repo where a violation-shaped
 * string is the correct content: it embeds `p-[13px]`, `text-red-500`,
 * `[color:red]` and `bg-(--brand)` as selftest samples and spells the
 * four patterns out as source. Scanning it reports 25 hits — its own
 * evidence read back as a violation. Before T-045 it was excluded only
 * because `.mjs` was not walked; now `.mjs` IS walked, so the exclusion
 * is a decision with a reason instead of a side effect, and the selftest
 * asserts both that the file is excluded AND that excluding it is doing
 * real work.
 *
 * This is not an allowlist. An allowlist mutes a hit inside the corpus;
 * this names the one file that is not source under test, and nothing in
 * it can mute a hit anywhere else.
 */
export const EXCLUDED_FILES = ["tools/e2e/scripts/lint-tokens.mjs"];

/** The 22-name Tailwind default palette (P3). */
const PALETTE =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|" +
  "violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";

/** Color-bearing utility prefixes whose default-scale forms are
 * dead-by-mechanism here (no @theme mapping), so any occurrence is a
 * silent no-op bug made loud. */
const COLOR_PREFIXES =
  "bg|text|border|ring|outline|fill|stroke|shadow|decoration|divide|accent|caret";

/** The four patterns (plan §5 table), byte-identical since T-020 — T-038
 * narrowed their INPUT, never them. Fresh regexes per scan (global flag
 * state is per-instance). */
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

/** The masked character. No pattern can match it, and it is not a `]`,
 * so an interpolated value (`p-[${n}px]`) still reads as one. */
const HIDDEN = "\0";

/** Keywords after which a `/` opens a regex literal rather than dividing
 * (anything else identifier-shaped is a value: `x / y`). */
const REGEX_AFTER = new Set([
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "new",
  "delete",
  "void",
  "throw",
  "case",
  "do",
  "else",
  "yield",
  "await",
]);

const WORD = /[A-Za-z0-9_$]/;

/** Can a regex literal start at `start`, given the last significant code
 * character at `prevSig`? The classic heuristic plus the two JSX guards
 * (see header). A wrong call either way costs at most one line. */
function regexCanStart(src, start, prevSig) {
  if (src[start + 1] === ">") return false; // `/>` — JSX self-close
  if (prevSig < 0) return true; // start of file
  const ch = src[prevSig];
  if (ch === "<") return false; // `</div>` — JSX closing tag
  if (ch === ">") return src[prevSig - 1] === "="; // `=>` yes, a tag close no
  if (ch === ")" || ch === "]" || ch === "}") return false; // value-ish: division
  if (WORD.test(ch)) {
    let s = prevSig;
    while (s > 0 && WORD.test(src[s - 1])) s -= 1;
    return REGEX_AFTER.has(src.slice(s, prevSig + 1));
  }
  if ((ch === "+" || ch === "-") && src[prevSig - 1] === ch) return false; // `x++ / y`
  return true; // any other punctuator
}

/** Index just past a regex literal starting at `start` (flags included),
 * or -1 if this slash does not open one. A literal that does not close on
 * its own line is not one — that rule is what keeps a misread contained. */
function regexEnd(src, start, prevSig) {
  if (!regexCanStart(src, start, prevSig)) return -1;
  let i = start + 1;
  let inClass = false;
  while (i < src.length) {
    const c = src[i];
    if (c === "\n" || c === "\r") return -1;
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === "[") inClass = true;
    else if (c === "]") inClass = false;
    else if (c === "/" && !inClass) {
      i += 1;
      while (i < src.length && /[a-z]/.test(src[i])) i += 1;
      return i;
    }
    i += 1;
  }
  return -1;
}

/**
 * Mask everything that is not string- or template-literal text. Returns a
 * string of exactly the same length as `src`, newlines in place, so
 * offsets and line numbers carry straight through. Delimiters (`"`, `'`,
 * backtick) are kept: P2 anchors on them.
 */
export function maskSource(src) {
  const n = src.length;
  const out = new Array(n);
  const keep = (i) => {
    out[i] = src[i];
  };
  const hide = (i) => {
    const c = src[i];
    out[i] = c === "\n" || c === "\r" ? c : HIDDEN;
  };

  /** Last significant (non-whitespace, non-comment) code character. */
  let prevSig = -1;
  /** One entry per open template literal, carrying the `{` depth of the
   * substitution currently being lexed. */
  const templates = [];
  let inTemplateText = false;
  let i = 0;

  while (i < n) {
    const c = src[i];

    if (inTemplateText) {
      if (c === "\\") {
        keep(i);
        if (i + 1 < n) keep(i + 1);
        i += 2;
        continue;
      }
      if (c === "`") {
        keep(i);
        templates.pop();
        inTemplateText = false;
        prevSig = i;
        i += 1;
        continue;
      }
      if (c === "$" && src[i + 1] === "{") {
        hide(i);
        hide(i + 1);
        templates[templates.length - 1].depth = 0;
        inTemplateText = false;
        prevSig = i + 1;
        i += 2;
        continue;
      }
      keep(i);
      i += 1;
      continue;
    }

    // ── code ─────────────────────────────────────────────────────────
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") hide(i++);
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      let j = i + 2;
      while (j < n && !(src[j] === "*" && src[j + 1] === "/")) j += 1;
      const end = j < n ? j + 2 : n;
      while (i < end) hide(i++);
      continue;
    }
    if (c === "/") {
      const end = regexEnd(src, i, prevSig);
      if (end !== -1) {
        while (i < end) hide(i++);
        prevSig = end - 1;
        continue;
      }
      // not a regex — fall through, an ordinary code character
    }
    if (c === '"' || c === "'") {
      keep(i);
      let j = i + 1;
      while (j < n) {
        const d = src[j];
        if (d === "\n" || d === "\r") break; // unterminated: resync at the line
        if (d === "\\") {
          keep(j);
          if (j + 1 < n) keep(j + 1);
          j += 2;
          continue;
        }
        keep(j);
        j += 1;
        if (d === c) break; // closing delimiter
      }
      prevSig = j - 1;
      i = j;
      continue;
    }
    if (c === "`") {
      keep(i);
      templates.push({ depth: 0 });
      inTemplateText = true;
      prevSig = i;
      i += 1;
      continue;
    }
    if (templates.length > 0) {
      const top = templates[templates.length - 1];
      if (c === "{") top.depth += 1;
      else if (c === "}") {
        if (top.depth === 0) {
          hide(i);
          inTemplateText = true;
          prevSig = i;
          i += 1;
          continue;
        }
        top.depth -= 1;
      }
    }
    hide(i);
    if (!/\s/.test(c)) prevSig = i;
    i += 1;
  }

  for (let k = 0; k < n; k += 1) if (out[k] === undefined) hide(k);
  const masked = out.join("");
  /* Alignment is load-bearing (file:line is read off it) — assert it,
   * never assume it. A lexer bug becomes a loud crash, not a quiet miss. */
  if (masked.length !== n) {
    throw new Error(`lint-tokens: mask length ${masked.length} != source ${n}`);
  }
  return masked;
}

/**
 * Is this hit inside an arbitrary VARIANT? The group opened inside the
 * match closes, and the next character is the `:` that separates a
 * variant from what it modifies. Nesting counts
 * (`[&_svg:not([class*='size-'])]:`), the search is line-bounded, and an
 * unclosed group is NOT a variant — every uncertainty resolves toward
 * reporting.
 */
function isVariant(masked, start, end) {
  for (let i = start; i < end; i += 1) {
    const open = masked[i];
    if (open !== "[" && open !== "(") continue;
    const close = open === "[" ? "]" : ")";
    let depth = 0;
    for (let j = i; j < masked.length; j += 1) {
      if (masked[j] === open) depth += 1;
      else if (masked[j] === close) {
        depth -= 1;
        if (depth === 0) return masked[j + 1] === ":";
      }
    }
    return false; // never closes on this line
  }
  return false; // no group inside the match (P3) — never a variant
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

/**
 * Every pattern hit in a source text: `{line, id, what, match}`.
 * Detection runs over the MASKED text (string context only); the display
 * string is cut from the raw line at the same offsets.
 */
export function scanSource(src) {
  const maskedLines = maskSource(src).split(/\r?\n/);
  const rawLines = src.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < maskedLines.length; i += 1) {
    const masked = maskedLines[i];
    const raw = rawLines[i] ?? masked;
    for (const { id, what, re } of makePatterns()) {
      for (const m of masked.matchAll(re)) {
        if (isVariant(masked, m.index, m.index + m[0].length)) continue;
        hits.push({
          line: i + 1,
          id,
          what,
          match: displayMatch(raw, m.index, m[0].length),
        });
      }
    }
  }
  return hits;
}

/** Recursive deterministic walk for the walked extensions, skipping
 * SKIP_DIRS. Returns repo-relative POSIX paths. */
function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (WALK_EXTENSIONS.test(name)) {
      out.push(path.relative(repoRoot, full).split(path.sep).join("/"));
    }
  }
  return out;
}

/** Every file the lint reads, in WALK_ROOTS order — the corpus, with the
 * by-name exclusions removed. Exported so the selftest can assert the
 * walk policy rather than restate it. */
export function corpus() {
  const files = [];
  for (const root of WALK_ROOTS) {
    const abs = path.join(repoRoot, root);
    let found;
    try {
      found = walk(abs);
    } catch (err) {
      // A missing root is a broken checkout, not an empty corpus: say so
      // loudly rather than silently linting less than the policy claims.
      console.error(`lint-tokens: cannot walk ${root}: ${String(err)}`);
      process.exit(2);
    }
    files.push(...found);
  }
  return files.filter((rel) => !EXCLUDED_FILES.includes(rel));
}

function lintTree() {
  const files = corpus();
  let count = 0;
  for (const rel of files) {
    for (const hit of scanSource(readFileSync(path.join(repoRoot, rel), "utf8"))) {
      count += 1;
      console.log(`${rel}:${hit.line}: ${hit.match.trim()}  [${hit.id}: ${hit.what}]`);
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
  console.log(`lint-tokens: clean (${files.length} files scanned under ${WALK_ROOTS.join(", ")})`);
}

/**
 * Embedded selftest — source fragments, lexed exactly as a file is.
 * Positives are each caught by exactly the intended pattern(s);
 * negatives by none. The negatives ARE the precision: delete the lexer
 * or the variant rule and this set goes red long before the tree does.
 */
const SAMPLES = [
  // ── positives: every pattern still fires ───────────────────────────
  { text: 'className="p-[13px]"', expect: ["P1"] },
  { text: 'className="text-[0.8rem] leading-none"', expect: ["P1"] },
  { text: '"max-h-[320px] overflow-auto"', expect: ["P1"] },
  { text: '<div className="[color:red]">', expect: ["P2"] },
  { text: 'cn("[mask-type:luminance]")', expect: ["P2"] },
  { text: '"text-red-500"', expect: ["P3"] },
  { text: "className={cn('bg-stone-200')}", expect: ["P3"] },
  { text: '"shadow-slate-900/20"', expect: ["P3"] },
  { text: '"bg-(--brand)"', expect: ["P4"] },
  // an arbitrary value assembled through an interpolation is still one
  { text: "className={`p-[${n}px]`}", expect: ["P1"] },
  // a VARIANT never excuses the utility it modifies (T-038)
  { text: '"data-[state=open]:p-[13px]"', expect: ["P1"] },
  { text: '"group-[.peer]:text-red-500"', expect: ["P3"] },
  // ── negatives: the tree's legal forms and real near-misses ─────────
  { text: '"[&_svg]:size-4 [&_svg]:shrink-0"', expect: [] }, // arbitrary VARIANT (vendored button.tsx)
  { text: 'target.closest("[data-card-trigger]")', expect: [] }, // selector string
  { text: '"aria-invalid:border-destructive"', expect: [] }, // state variant on a token
  { text: '"w-150 max-w-full gap-1.75"', expect: [] }, // spacing tokens
  { text: '"bg-status-done text-status-done-foreground"', expect: [] }, // mapped tokens
  { text: '"focus-visible:ring-ring/50"', expect: [] }, // token + opacity
  { text: "var(--background)", expect: [] }, // css var read, no shorthand
  { text: 'style={{ color: "var(--background)" }}', expect: [] }, // same, in string context
  { text: '"rounded-chip border px-2.25 py-0.75"', expect: [] },
  // ── negatives (T-038): a regex literal is not a class string ───────
  // the line that redded main — app/src/genesis/genesis-derive.ts
  { text: 'return text.replace(/<!--[\\s\\S]*?(?:-->|$)/g, "");', expect: [] },
  // the shape T-020's verifier predicted — lib/parser/src/frontmatter.ts:35
  { text: "const close = /^---[ \\t]*(?:\\r?\\n|$)/m.exec(rest);", expect: [] },
  // regexes spelling out the patterns' own positive cases, verbatim
  { text: "const re = /text-[0-9]+/g;", expect: [] },
  { text: "if (/[color:red]/.test(s)) return;", expect: [] },
  { text: "const dead = /text-red-500|bg-(--x)/.test(cls);", expect: [] },
  // a quote INSIDE a regex is not a string delimiter — this one is
  // pinned by the regex recognition itself, not by the mask alone
  { text: "if (/[\"']p-[0-9]/.test(s)) return;", expect: [] },
  // division is not a regex: the scan must not swallow the class after it
  { text: 'const w = total / count; const c = "p-4";', expect: [] },
  // ── negatives (T-038): a comment is not a class string ─────────────
  { text: "// never write p-[13px] or text-red-500 here", expect: [] },
  { text: "/* doc: p-[13px] bypasses the tokens — see T-001-s2 */", expect: [] },
  // ── negatives (T-038): arbitrary VARIANTS, one per family ──────────
  { text: '<div className="data-[state=open]:bg-primary">', expect: [] },
  { text: '"group-[.peer]:underline"', expect: [] },
  { text: '"supports-[display:grid]:grid"', expect: [] },
  { text: '"min-[600px]:flex max-[480px]:hidden"', expect: [] },
  { text: '"has-[input:checked]:border-ring"', expect: [] },
  { text: '"peer-[.is-open]:rotate-180"', expect: [] },
  { text: '"aria-[sort=ascending]:font-semibold"', expect: [] },
  { text: '"not-[:hover]:opacity-50 in-[.dark]:text-foreground"', expect: [] },
  { text: '"nth-[2n+1]:bg-muted"', expect: [] },
  { text: '"supports-(--tw-x):flex"', expect: [] }, // paren variant, same grammar
  // the vendored nested one, verbatim from app/src/components/ui/button.tsx
  { text: "\"[&_svg:not([class*='size-'])]:size-4\"", expect: [] },
  // the stock shadcn shapes the next `shadcn add` would bring in
  { text: '"data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:hidden"', expect: [] },
  // a variant built through an interpolation is still a variant
  { text: "className={`data-[state=${s}]:flex`}", expect: [] },
  // ── T-045: app/test, newly walked — a pair for the surface ─────────
  // positive: a unit test asserting a default-palette class is pinning a
  // dead utility. This is the shape criterion 5 exists for — it can sit
  // in app/test while app/src stays clean.
  { text: 'expect(card.className).toContain("bg-red-500");', expect: ["P3"] },
  // negatives: TypeScript LABELED TUPLES, verbatim from app/test — the
  // third collision class T-038's differential catalogued and the ONLY
  // thing the pre-T-038 scan reported over this newly walked tree (8
  // hits, all this shape). Code, not string text: the mask kills them.
  { text: "type Field = [key: string, value: string | number];", expect: [] },
  { text: "const cases: [pattern: string, text: string, expected: boolean][] = [];", expect: [] },
  // ── T-045: tools/e2e, newly walked — a pair for the surface ────────
  // positive: a lane spec pinning a default-palette class asserts a
  // utility that is dead by mechanism — the same bypass, one rung out.
  { text: 'await page.locator(".text-red-500").first().click();', expect: ["P3"] },
  // negatives: the lane's own idioms. Attribute-selector strings are
  // everywhere in the specs, and the boot check's `[boot-check]` prefix
  // is a bracketed token sharing a line with a colon — P2's near-miss.
  { text: "await page.locator('[data-testid=\"task-card\"][data-task-id=\"T-101\"]').click();", expect: [] },
  { text: 'expect(stderr).toContain("[boot-check] REFUSED:");', expect: [] },
];

/**
 * The walk policy, asserted rather than described (T-045 criterion 5).
 * Text samples cannot cover a walk: which trees are read, which are not,
 * and which single file is excluded by name are properties of `corpus()`,
 * so the selftest checks them directly. Each entry is `[what, ok]` and
 * the set carries the same positive/negative discipline as SAMPLES.
 */
function walkPolicyChecks() {
  const files = corpus();
  const under = (root) => files.filter((f) => f.startsWith(`${root}/`)).length;
  const selfHits = scanSource(readFileSync(path.join(repoRoot, selfPath), "utf8")).length;
  return [
    // positive: every declared root is actually read, and non-trivially —
    // a root that silently walks zero files is a gate that does nothing.
    ...WALK_ROOTS.map((root) => [`root ${root} is walked (${under(root)} files)`, under(root) > 0]),
    // negative: the trees argued OUT stay out. lib/parser is the one that
    // matters — no UI, ever (ADR-011).
    ...WALK_ROOTS_OUT.map((root) => [`root ${root} is NOT walked`, under(root) === 0]),
    // positive: `.mjs` is walked, so the self-exclusion below is a
    // decision and not an accident of file extension.
    [".mjs files are walked", files.some((f) => f.endsWith(".mjs"))],
    // negative: this script is excluded BY NAME...
    [`${selfPath} is excluded by name`, !files.includes(selfPath)],
    // ...and the exclusion is load-bearing: scanning it WOULD report.
    [`excluding ${selfPath} is load-bearing (${selfHits} hits if walked)`, selfHits > 0],
    // negative: installed dependencies are not this repo's source. Their
    // absence is what keeps the file count a number a human can read.
    ["node_modules is never walked", !files.some((f) => f.includes("/node_modules/"))],
  ];
}

function selftest() {
  let failures = 0;
  for (const { text, expect } of SAMPLES) {
    const got = [...new Set(scanSource(text).map((h) => h.id))].sort();
    const want = [...expect].sort();
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      failures += 1;
      console.error(
        `selftest FAIL: ${JSON.stringify(text)} matched [${got}] expected [${want}]`,
      );
    }
  }
  const checks = walkPolicyChecks();
  for (const [what, ok] of checks) {
    if (!ok) {
      failures += 1;
      console.error(`selftest FAIL: walk policy — ${what}`);
    }
  }
  if (failures > 0) {
    console.error(`lint-tokens selftest: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log(
    `lint-tokens selftest: ${SAMPLES.length} samples green, ` +
      `${checks.length} walk-policy checks green`,
  );
}

if (process.argv.includes("--selftest")) selftest();
else lintTree();
