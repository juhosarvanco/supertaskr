/**
 * Side-effect-free scanner for the token and literal-control gates.
 *
 * TOKEN (T-020/T-038/T-045) guards the Tailwind v4 escape hatches
 * documented in CONVENTIONS. CONTROL (T-058) guards the tracked text tree
 * against bytes that make binary-skipping searchers ignore a file.
 * UI work adds tokens to app/src/styles/tokens.css, never arbitrary
 * values or default-palette utilities — unmapped utilities are
 * deliberately dead, and arbitrary values (`p-[13px]`) bypass
 * enforcement entirely.
 *
 * Plain node, zero deps — structural, not taste: this is CI's FIRST
 * step, ahead of every `npm ci` in the job, so it must run against a
 * bare checkout with nothing installed. TOKEN walks TOKEN_ROOTS below for
 * `*.{ts,tsx,mjs}` and applies P1-P4 to masked string text. CONTROL asks
 * git for every tracked path, excludes binary assets and generated/
 * dependency directories, and applies P5 to raw Buffers.
 *
 * ── WHAT IT WALKS (T-045) ────────────────────────────────────────────
 * Until T-045 the walk was app/src alone, which left the one place a
 * `text-red-500` can sit unnoticed while the shipped tree stays clean:
 * app/test. The walk now covers app/src, app/test and tools/e2e — see
 * TOKEN_ROOTS for the argument per root, TOKEN_ROOTS_OUT for the trees
 * deliberately left out, and TOKEN_EXCLUDED_FILES for the scanner and
 * wrapper excluded BY NAME. Still ZERO allowlist: those are walk
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
 * Importing this module only defines functions and policy. The CLI wrapper
 * deliberately owns the unconditional lintTree()/selftest() call.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/** tools/e2e/scripts -> repo root. */
const repoRoot = path.resolve(here, "..", "..", "..");
/** This scanner, repo-relative — one of the TOKEN exclusions below. */
const selfPath = path.relative(repoRoot, fileURLToPath(import.meta.url)).split(path.sep).join("/");
const wrapperPath = "tools/e2e/scripts/lint-tokens.mjs";

/** The two explicit corpora. Passing anything else is a hard error. */
export const CORPORA = Object.freeze({ TOKEN: "TOKEN", CONTROL: "CONTROL" });

/**
 * ── EXIT CODES (T-080) ───────────────────────────────────────────────
 * The wrapper's legend, owned here so the codes and their meanings live
 * beside the gate that produces them.
 *
 * CI runs this gate FIRST, against a bare checkout, so "the gate could
 * not run" and "the tree is dirty" must not share a code. T-058 made
 * CONTROL's authority `git ls-files`, which gave the gate a real
 * could-not-run mode — git absent, not a repository, the corpus
 * underivable — and that mode THREW, so Node exited 1, the code a
 * genuine violation already used. The two other gates that legend their
 * codes in docs/CONVENTIONS.md, `index --check` and `boot:check`, each
 * RESERVE one for it; this one now does too, and takes `index --check`'s
 * number for the same meaning.
 *
 * 2 is deliberately UNUSED, reserved for `usage` — the meaning
 * `index --check` gives it — so adding flag validation later renumbers
 * nothing a checkpoint has already quoted.
 */
export const EXIT = Object.freeze({
  /** Ran to completion, found nothing. */
  CLEAN: 0,
  /** Ran to completion and FOUND something: a hit in the tree, or a
   *  selftest failure, which is a hit against the gate's own evidence. */
  FOUND: 1,
  /** Did NOT run to completion, so it is not a claim about the tree at
   *  all. Every throw out of this module lands here. */
  CANNOT_RUN: 3,
});

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
 *               what makes TOKEN_EXCLUDED_FILES load-bearing rather than
 *               decorative — this script lives inside it.
 *
 * Safe to widen only since T-038: over this corpus the pre-T-038
 * line-based scan produced 8 false positives (TypeScript labeled tuples
 * in app/test, `[key: string, value: string]` read as `[color:red]`) and
 * the masked scan produces none — measured `both=0 OLD-only=8 NEW-only=0`
 * over the 51 files, the same differential T-038 ran repo-wide over 122.
 */
export const TOKEN_ROOTS = ["app/src", "app/test", "tools/e2e"];

/**
 * The trees TOKEN MUST cover — deliberately a SECOND list, not derived
 * from TOKEN_ROOTS. This is the requirement; TOKEN_ROOTS is the policy that
 * satisfies it, and a policy that quietly drops a tree has to fail against
 * something that did not move with it. Measured while building T-045: with
 * the selftest's positive checks generated from TOKEN_ROOTS, deleting
 * "app/test" from it left the selftest green at ten checks — the deletion
 * removed its own check. Two lists that must agree is the right shape here
 * precisely because one of them is the thing being checked.
 */
const MUST_TOKEN_COVER = ["app/src", "app/test", "tools/e2e"];

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
export const TOKEN_ROOTS_OUT = ["lib/parser", "app/src-tauri", "docs", "method"];

/** Extensions walked. `.mjs` joined at T-045 with tools/e2e: the lane's
 * scripts are plain node modules, and leaving them out would make the
 * self-exclusion below an accident of file extension. */
export const TOKEN_EXTENSIONS = /\.(ts|tsx|mjs)$/;

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
 * Excluded from TOKEN BY NAME, not by extension — the distinction T-045
 * asks for. The scanner is where violation-shaped strings are correct:
 * string is the correct content: it embeds `p-[13px]`, `text-red-500`,
 * `[color:red]` and `bg-(--brand)` as selftest samples and spells the
 * four patterns out as source. Scanning it reports 29 hits — its own
 * evidence read back as a violation. Before T-045 it was excluded only
 * because `.mjs` was not walked; now `.mjs` IS walked, so the exclusion
 * is a decision with a reason instead of a side effect, and the selftest
 * asserts both that the file is excluded AND that excluding it is doing
 * real work.
 *
 * The unconditional wrapper is the other lint implementation file and the
 * T-058 contract keeps both outside the rules they implement. This is not
 * a hit allowlist: both files remain in CONTROL, and neither can mute a hit
 * anywhere else in TOKEN.
 */
export const TOKEN_EXCLUDED_FILES = [wrapperPath, selfPath];

/**
 * Binary asset suffixes excluded from CONTROL. Everything else tracked is
 * read as raw bytes, including extensionless fixtures and dotfiles. A deny
 * list is deliberate: an allowlist of text suffixes would silently omit the
 * next first-party text format. SVG is text and therefore is NOT here.
 */
export const CONTROL_BINARY_EXTENSIONS = new Set([
  ".gif",
  ".gz",
  ".icns",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp3",
  ".mp4",
  ".otf",
  ".pdf",
  ".png",
  ".ttf",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".zip",
]);

/**
 * ── THE CORPUS FLOOR, RUNG A (T-080 / T-058-s1) ──────────────────────
 * Suffix classes CONTROL is ALLOWED to be missing. Every other suffix
 * present in the tracked file list must appear in the corpus.
 *
 * DELIBERATELY A SECOND LIST, not CONTROL_BINARY_EXTENSIONS — the same
 * shape MUST_TOKEN_COVER uses one rung up, and for the same reason. The
 * obvious formulation ("every suffix in tracked MINUS the binary set is
 * in the corpus") is a TAUTOLOGY: the corpus is DEFINED as tracked minus
 * that set, so adding `.rs` to the deny list would remove `.rs` from the
 * expectation too and the check would stay green. The deletion would
 * delete its own failure — the very shape this floor exists to close.
 * Measured before this floor existed, at `16bb47b`: adding one line to
 * the deny list took CONTROL 507 -> 463 (`.rs`) and 507 -> 461 (`.tsx`)
 * with the lint AND the selftest both still exiting 0.
 *
 * The duplication buys the asymmetry that makes the floor bite:
 * - a new first-party TEXT format needs NO edit here. It is tracked, it
 *   is not exempt, and CONTROL already covers it — which is the property
 *   the deny list was chosen for in the first place.
 * - a new BINARY asset class needs a deliberate edit in BOTH lists, and
 *   reds until it gets one. That loudness is the point.
 */
export const CONTROL_UNCOVERED_SUFFIXES = new Set([
  ".gif",
  ".gz",
  ".icns",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp3",
  ".mp4",
  ".otf",
  ".pdf",
  ".png",
  ".ttf",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
  ".zip",
]);

/**
 * ── THE CORPUS FLOOR, RUNG B (T-080 / T-058-s1) ──────────────────────
 * Suffix classes CONTROL must cover COMPLETELY — every tracked file of
 * that class, not merely one of them. Rung A catches a suffix joining
 * the deny list; rung B catches the two edits that would slip past rung
 * A, and one rung A cannot see at all:
 *
 * - declaring a class binary in BOTH lists at once, and
 * - a class that stays present but stops being WHOLE, which is what a
 *   new SKIP_DIRS entry or a narrowed walk does. Rung A only asks for
 *   one survivor; a class can lose 43 of its 44 files and still have it.
 *
 * The four names are not a taste: they are the classes the ARCHITECT's
 * 2026-08-18 ruling (T-058, criterion 4) named out loud — "app/parser
 * Rust and TypeScript" and the records "agents search to recover the
 * project". Ten of the eighteen classes are already held by name-pinned
 * files below; `.rs` and `.tsx` were the two largest that were held by
 * nothing, and they are exactly the two the ruling names.
 *
 * Counts are DERIVED from the tracked list on every run. No number here.
 */
export const MUST_CONTROL_COVER = [".rs", ".ts", ".tsx", ".md"];

/** The 22-name Tailwind default palette (P3). */
const PALETTE =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|" +
  "violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";

/** Color-bearing utility prefixes whose default-scale forms are
 * dead-by-mechanism here (no @theme mapping), so any occurrence is a
 * silent no-op bug made loud. */
const COLOR_PREFIXES =
  "bg|text|border|ring|outline|fill|stroke|shadow|decoration|divide|accent|caret";

/** P1-P4 definitions (plan §5 table), byte-identical since T-020 — T-038
 * narrowed their INPUT, never them. Exported as inert data; scanSource
 * makes fresh regexes so global-regex state never leaks between scans. */
export const TOKEN_PATTERNS = Object.freeze([
  {
    id: "P1",
    what: "arbitrary value (`p-[13px]` family — the T-001-s2 bypass)",
    source: String.raw`-\[[^\]]`,
    flags: "g",
  },
  {
    id: "P2",
    what: "arbitrary property (`[color:red]` family)",
    source: "(^|[\"'`{ ])\\[[a-z-]+:[^\\]]+\\]",
    flags: "g",
  },
  {
    id: "P3",
    what: "Tailwind default-palette utility (dead by mechanism here)",
    source: `\\b(${COLOR_PREFIXES})-(${PALETTE})-[0-9]{2,3}\\b`,
    flags: "g",
  },
  {
    id: "P4",
    what: "v4 var shorthand (`bg-(--x)` — compiles without a mapped utility)",
    source: String.raw`-\(--`,
    flags: "g",
  },
]);

/** P5 is intentionally a byte predicate, not a text regex. */
export const CONTROL_PATTERN = Object.freeze({
  id: "P5",
  what: "literal control character (invisible to binary-skipping searchers)",
});

export function makeTokenPatterns() {
  return TOKEN_PATTERNS.map(({ id, what, source, flags }) => ({
    id,
    what,
    re: new RegExp(source, flags),
  }));
}

/** The masked character. No pattern can match it, and it is not a `]`,
 * so an interpolated value (`p-[${n}px]`) still reads as one. Built from
 * a character code, never spelled as an escape: T-058's practical lesson
 * is that the fix is not to be careful but to never write the escape at
 * all — thirteen reproductions, two of them inside documents describing
 * the hazard. After T-080 this module spells no control escape anywhere. */
const HIDDEN = String.fromCharCode(0);

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
 * (see header). A wrong call either way costs at most one line.
 *
 * EXPORTED at T-084 so docs-scan.mjs's comment strip uses THIS lexer
 * rather than a second copy of it: a quote or a backtick inside a regex
 * literal is exactly what makes a naive strip swallow the rest of a
 * file, and one implementation cannot disagree with itself (T-057). */
/**
 * @param {string} src
 * @param {number} start
 * @param {number} prevSig
 * @returns {boolean}
 */
export function regexCanStart(src, start, prevSig) {
  if (src[start + 1] === ">") return false; // `/>` — JSX self-close
  if (prevSig < 0) return true; // start of file
  const ch = /** @type {string} */ (src[prevSig]);
  if (ch === "<") return false; // `</div>` — JSX closing tag
  if (ch === ">") return src[prevSig - 1] === "="; // `=>` yes, a tag close no
  if (ch === ")" || ch === "]" || ch === "}") return false; // value-ish: division
  if (WORD.test(ch)) {
    let s = prevSig;
    while (s > 0 && WORD.test(/** @type {string} */ (src[s - 1]))) s -= 1;
    return REGEX_AFTER.has(src.slice(s, prevSig + 1));
  }
  if ((ch === "+" || ch === "-") && src[prevSig - 1] === ch) return false; // `x++ / y`
  return true; // any other punctuator
}

/** Index just past a regex literal starting at `start` (flags included),
 * or -1 if this slash does not open one. A literal that does not close on
 * its own line is not one — that rule is what keeps a misread contained.
 * Exported at T-084 with `regexCanStart`, for the same reason. */
/**
 * @param {string} src
 * @param {number} start
 * @param {number} prevSig
 * @returns {number}
 */
export function regexEnd(src, start, prevSig) {
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
      while (i < src.length && /[a-z]/.test(/** @type {string} */ (src[i]))) i += 1;
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
/**
 * @param {string} src
 * @returns {string}
 */
export function maskSource(src) {
  const n = src.length;
  /** @type {(string | undefined)[]} */
  const out = new Array(n);
  /** @param {number} i */
  const keep = (i) => {
    out[i] = src[i];
  };
  /** @param {number} i */
  const hide = (i) => {
    const c = src[i];
    out[i] = c === "\n" || c === "\r" ? c : HIDDEN;
  };

  /** Last significant (non-whitespace, non-comment) code character. */
  let prevSig = -1;
  /** One entry per open template literal, carrying the `{` depth of the
   * substitution currently being lexed.
   * @type {{ depth: number }[]} */
  const templates = [];
  let inTemplateText = false;
  let i = 0;

  while (i < n) {
    const c = /** @type {string} */ (src[i]);

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
        /** @type {{ depth: number }} */ (templates[templates.length - 1]).depth = 0;
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
      const top = /** @type {{ depth: number }} */ (templates[templates.length - 1]);
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
/**
 * @param {string} masked
 * @param {number} start
 * @param {number} end
 * @returns {boolean}
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
/**
 * @param {string} line
 * @param {number} index
 * @param {number} length
 * @returns {string}
 */
function displayMatch(line, index, length) {
  const boundary = /[\s"'`{}<>,;]/;
  let start = index;
  while (start > 0 && !boundary.test(/** @type {string} */ (line[start - 1]))) start -= 1;
  let end = index + length;
  while (end < line.length && !boundary.test(/** @type {string} */ (line[end]))) end += 1;
  return line.slice(start, end);
}

/**
 * Every pattern hit in a source text: `{line, id, what, match}`.
 * Detection runs over the MASKED text (string context only); the display
 * string is cut from the raw line at the same offsets.
 *
 * @param {string} src
 * @returns {{ line: number, id: string, what: string, match: string }[]}
 */
export function scanSource(src) {
  const maskedLines = maskSource(src).split(/\r?\n/);
  const rawLines = src.split(/\r?\n/);
  /** @type {{ line: number, id: string, what: string, match: string }[]} */
  const hits = [];
  for (let i = 0; i < maskedLines.length; i += 1) {
    const masked = /** @type {string} */ (maskedLines[i]);
    const raw = rawLines[i] ?? masked;
    for (const { id, what, re } of makeTokenPatterns()) {
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

/** U+XXXX for the one-byte ASCII controls P5 can report. */
/**
 * @param {number} byte
 * @returns {string}
 */
function codepoint(byte) {
  return `U+${byte.toString(16).toUpperCase().padStart(4, "0")}`;
}

/**
 * Every forbidden raw byte in a Buffer. Tabs, LF and CR are the only C0
 * bytes allowed; every other C0 byte and DEL is a P5 hit. `offset` is the
 * true zero-based BYTE offset, not a UTF-16 string index.
 *
 * @param {Buffer} raw
 * @returns {{ line: number, offset: number, codepoint: string, id: string, what: string }[]}
 */
export function scanControlSource(raw) {
  if (!Buffer.isBuffer(raw)) {
    throw new TypeError("scanControlSource requires a Buffer so byte offsets stay truthful");
  }
  /** @type {{ line: number, offset: number, codepoint: string, id: string, what: string }[]} */
  const hits = [];
  let line = 1;
  for (let offset = 0; offset < raw.length; offset += 1) {
    const byte = /** @type {number} */ (raw[offset]);
    if (byte === 0x0a) line += 1;
    const forbiddenC0 =
      byte <= 0x08 || byte === 0x0b || byte === 0x0c || (byte >= 0x0e && byte <= 0x1f);
    if (forbiddenC0 || byte === 0x7f) {
      hits.push({
        line,
        offset,
        codepoint: codepoint(byte),
        id: CONTROL_PATTERN.id,
        what: CONTROL_PATTERN.what,
      });
    }
  }
  return hits;
}

/** Recursive deterministic TOKEN walk, returning repo-relative POSIX paths. */
/**
 * @param {string} dir
 * @returns {string[]}
 */
function walkToken(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkToken(full));
    else if (TOKEN_EXTENSIONS.test(name)) {
      out.push(path.relative(repoRoot, full).split(path.sep).join("/"));
    }
  }
  return out;
}

function tokenCorpus() {
  const files = [];
  for (const root of TOKEN_ROOTS) {
    const abs = path.join(repoRoot, root);
    let found;
    try {
      found = walkToken(abs);
    } catch (err) {
      throw new Error(`lint-tokens: cannot walk TOKEN root ${root}: ${String(err)}`);
    }
    files.push(...found);
  }
  return files.filter((rel) => !TOKEN_EXCLUDED_FILES.includes(rel));
}

/**
 * Every path git tracks, UNFILTERED — the authority CONTROL derives from
 * and, since T-080, the authority its coverage floor derives from too.
 *
 * Extracted rather than inlined because the floor has to see the files
 * the policy REMOVED, and `corpus(CONTROL)` is precisely the view that
 * cannot show it. A throw here means the gate could not run (EXIT
 * .CANNOT_RUN), not that the tree is dirty.
 */
export function trackedFiles() {
  let listed;
  try {
    listed = execFileSync("git", ["ls-files", "-z"], {
      cwd: repoRoot,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (err) {
    throw new Error(`lint-tokens: cannot derive tracked CONTROL corpus: ${String(err)}`);
  }
  return listed
    .toString("utf8")
    .split(String.fromCharCode(0))
    .filter(Boolean)
    .sort();
}

/** The suffix class of a path, lowercased, as `extname` sees it — a
 *  dotfile has NO extension and shares the "" class with extensionless
 *  fixtures. Written once so the corpus, the floor and any reader
 *  classify identically; a shell `${f##*.}` split does NOT agree here. */
/**
 * @param {string} rel
 * @returns {string}
 */
export function suffixClass(rel) {
  return path.posix.extname(rel).toLowerCase();
}

/**
 * Every tracked first-party text file. git is the authority for "tracked";
 * generated/dependency directories and binary assets are excluded by
 * policy, while every other suffix (and no suffix) is included.
 */
function controlCorpus() {
  return trackedFiles()
    .filter((rel) => !rel.split("/").some((part) => SKIP_DIRS.has(part)))
    .filter((rel) => !CONTROL_BINARY_EXTENSIONS.has(suffixClass(rel)));
}

/** Every file in one explicit corpus. Importing this module calls neither. */
/**
 * @param {string} which
 * @returns {string[]}
 */
export function corpus(which) {
  if (which === CORPORA.TOKEN) return tokenCorpus();
  if (which === CORPORA.CONTROL) return controlCorpus();
  throw new TypeError(`unknown corpus ${JSON.stringify(which)}; expected TOKEN or CONTROL`);
}

export function lintTree() {
  const tokenFiles = corpus(CORPORA.TOKEN);
  const controlFiles = corpus(CORPORA.CONTROL);
  let tokenCount = 0;
  let controlCount = 0;
  for (const rel of tokenFiles) {
    for (const hit of scanSource(readFileSync(path.join(repoRoot, rel), "utf8"))) {
      tokenCount += 1;
      console.log(`${rel}:${hit.line}: ${hit.match.trim()}  [${hit.id}: ${hit.what}]`);
    }
  }
  for (const rel of controlFiles) {
    for (const hit of scanControlSource(readFileSync(path.join(repoRoot, rel)))) {
      controlCount += 1;
      console.log(
        `${rel}:byte ${hit.offset}: ${hit.codepoint}  [${hit.id}: ${hit.what}]`,
      );
    }
  }
  const count = tokenCount + controlCount;
  if (count > 0) {
    console.error(
      `\nlint-tokens: ${count} violation${count === 1 ? "" : "s"} ` +
        `(${tokenCount} TOKEN, ${controlCount} CONTROL) — token utilities live in ` +
        "app/src/styles/tokens.css; literal controls make tracked text unsearchable " +
        "to binary-skipping tools (docs/CONVENTIONS.md).",
    );
    process.exit(EXIT.FOUND);
  }
  console.log(
    `lint-tokens: clean (TOKEN ${tokenFiles.length} files under ${TOKEN_ROOTS.join(", ")}; ` +
      `CONTROL ${controlFiles.length} tracked text files)`,
  );
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
 * P5 samples. Every forbidden byte is built at runtime from a character
 * code and none is typed into this source — a source file carrying a
 * literal control byte would trip the gate it is testing and would
 * itself be unsearchable (T-058 criterion 2, and T-034 hit exactly this
 * writing its own gate).
 *
 * ── WHY THE EXPECTED STRING IS WRITTEN OUT (T-080 / T-058-s4) ────────
 * The report format is load-bearing: the byte is INVISIBLE, so this line
 * is the only description of it a reader ever gets. Each `codepoint` is
 * therefore a LITERAL — never `codepoint(byte)` and never a second copy
 * of its formula. An expectation produced by re-running the production
 * formula pins the PIPELINE and not the FORMAT: it agrees with the
 * implementation by construction, so uppercasing, zero-padding and the
 * `U+` prefix can all change together with nothing red.
 *
 * And the sample VALUES have to discriminate. Until T-080 the only
 * positive was U+0000, whose hexadecimal contains no letters, so
 * uppercasing is a no-op on it: dropping `.toUpperCase()` left this
 * selftest — CI's FIRST step, on a bare checkout — at exit 0 while the
 * seventeenth-step lane went red twice. Measured at `16bb47b`, before
 * and after. U+001B and U+007F both render a letter; the floor below
 * requires at least one such positive so the gap cannot silently reopen.
 */
const CONTROL_SAMPLES = [
  {
    what: "U+0000 after a non-ASCII prefix — the T-058 original, byte offset included",
    raw: Buffer.concat([Buffer.from("prefix é ", "utf8"), Buffer.from([0x00])]),
    expect: [{ codepoint: "U+0000", offset: Buffer.byteLength("prefix é ", "utf8") }],
  },
  {
    what: "U+001B (ESC), whose hex carries a LETTER — the s4 blind spot",
    raw: Buffer.concat([Buffer.from("esc é ", "utf8"), Buffer.from([0x1b])]),
    expect: [{ codepoint: "U+001B", offset: Buffer.byteLength("esc é ", "utf8") }],
  },
  {
    what: "U+007F (DEL), lettered and above the C0 range the predicate tests separately",
    raw: Buffer.from([0x7f]),
    expect: [{ codepoint: "U+007F", offset: 0 }],
  },
  {
    what: "tab, LF and CR are the three allowed bytes — the negative",
    raw: Buffer.from([0x09, 0x0a, 0x0d]),
    expect: [],
  },
];

/**
 * The walk policy, asserted rather than described (T-045 criterion 5).
 * Text samples cannot cover a walk: which trees are read, which are not,
 * and which files are excluded by name are properties of `corpus(TOKEN)`,
 * so the selftest checks them directly. Each entry is `[what, ok]` and
 * the set carries the same positive/negative discipline as SAMPLES.
 */
function walkPolicyChecks() {
  const tokenFiles = corpus(CORPORA.TOKEN);
  const controlFiles = corpus(CORPORA.CONTROL);
  /** @param {string[]} files @param {string} root @returns {number} */
  const under = (files, root) => files.filter((f) => f.startsWith(`${root}/`)).length;
  const selfHits = scanSource(readFileSync(path.join(repoRoot, selfPath), "utf8")).length;
  return [
    // positive: every REQUIRED tree is actually read, and non-trivially —
    // a tree that silently walks zero files is a gate that does nothing.
    // Checked against MUST_TOKEN_COVER, not TOKEN_ROOTS: see the note there.
    ...MUST_TOKEN_COVER.map((root) => [
      `required TOKEN tree ${root} is walked (${under(tokenFiles, root)} files)`,
      under(tokenFiles, root) > 0,
    ]),
    // positive: and no declared root is dead weight.
    ...TOKEN_ROOTS.map((root) => [
      `declared TOKEN root ${root} walks files`,
      under(tokenFiles, root) > 0,
    ]),
    // negative: the trees argued OUT stay out. lib/parser is the one that
    // matters — no UI, ever (ADR-011).
    ...TOKEN_ROOTS_OUT.map((root) => [
      `root ${root} is NOT TOKEN-walked`,
      under(tokenFiles, root) === 0,
    ]),
    // positive: `.mjs` is walked, so the self-exclusion below is a
    // decision and not an accident of file extension.
    [".mjs files are TOKEN-walked", tokenFiles.some((f) => f.endsWith(".mjs"))],
    // negative: the scanner and unconditional wrapper are excluded BY NAME...
    ...TOKEN_EXCLUDED_FILES.map((rel) => [
      `${rel} is excluded from TOKEN by name`,
      !tokenFiles.includes(rel),
    ]),
    // ...and the exclusion is load-bearing: scanning it WOULD report.
    [`excluding ${selfPath} is load-bearing (${selfHits} hits if walked)`, selfHits > 0],
    // negative: installed dependencies are not this repo's source. Their
    // absence is what keeps the file count a number a human can read.
    [
      "node_modules is never TOKEN-walked",
      !tokenFiles.some((f) => f.includes("/node_modules/")),
    ],
    // CONTROL is the tracked first-party text tree, including succession
    // records, both code stacks, scripts, root records and CI.
    ...[".github", "app", "docs", "lib", "method", "tools"].map((root) => [
      `CONTROL includes ${root}/ (${under(controlFiles, root)} files)`,
      under(controlFiles, root) > 0,
    ]),
    ["CONTROL includes root AGENTS.md", controlFiles.includes("AGENTS.md")],
    ["CONTROL includes parser source", controlFiles.includes("lib/parser/src/index.ts")],
    ["CONTROL includes the unconditional wrapper", controlFiles.includes(wrapperPath)],
    ["CONTROL includes the extracted scanner", controlFiles.includes(selfPath)],
    ...[
      ".github/workflows/ci.yml",
      "app/index.html",
      "app/package-lock.json",
      "app/src/index.css",
      "app/src-tauri/Cargo.lock",
      "app/src-tauri/Cargo.toml",
      "app/src-tauri/tauri.conf.json",
      "docs/ROADMAP.md",
      "lib/parser/tsconfig.json",
      "method/runtime/nputer.yaml",
    ].map((rel) => [`CONTROL includes tracked text format ${rel}`, controlFiles.includes(rel)]),
    [
      "CONTROL excludes binary assets",
      !controlFiles.some((f) => CONTROL_BINARY_EXTENSIONS.has(path.posix.extname(f).toLowerCase())),
    ],
    [
      "CONTROL excludes generated/dependency directories",
      !controlFiles.some((/** @type {string} */ f) =>
        f.split("/").some((/** @type {string} */ part) => SKIP_DIRS.has(part)),
      ),
    ],
    ...controlFloorChecks(controlFiles),
  ];
}

/**
 * ── THE CORPUS FLOOR (T-080, closing T-058-s1) ───────────────────────
 * The binary-extension deny list IS the CONTROL policy, and until now
 * almost nothing pinned it: ten of the eighteen suffix classes were held
 * by name-pinned files above, and the other eight — `.tsx` 46, `.rs` 44,
 * no-extension 10, `.js` 3, `.jsx` 2, `.cts` 2, `.mts` 1, `.txt` 1 at
 * `16bb47b` — were held only by the six root-non-emptiness rows, which
 * survive losing any one suffix as long as the root keeps a file of some
 * other suffix. One line could drop a fifth of the corpus green.
 *
 * Three rungs, each derived from the TRACKED list rather than from the
 * corpus, because the corpus is the view that cannot show what the
 * policy removed:
 *
 *   A. every tracked suffix class is covered COMPLETELY, unless it is
 *      declared in CONTROL_UNCOVERED_SUFFIXES — and every declared class
 *      really is absent, so the two lists must agree in BOTH directions.
 *   B. the classes the architect's ruling named are covered completely
 *      WITHOUT consulting the exemption list, so declaring one binary in
 *      both lists at once still reds.
 *   C. every tracked top-level entry keeps all of its non-exempt files,
 *      which is what a new SKIP_DIRS entry takes away.
 *
 * The tracked side is deliberately UNFILTERED by SKIP_DIRS. Filtering it
 * would make rung C a tautology — a directory added to the skip set
 * would leave both sides of its own comparison at once. Zero tracked
 * files sit under a skip directory today; if one ever does, this floor
 * reds, and that is the correct alarm rather than a false one.
 */
/**
 * @param {string[]} controlFiles
 */
function controlFloorChecks(controlFiles) {
  const tracked = trackedFiles();
  const covered = new Set(controlFiles);
  /** @param {(rel: string) => string} key */
  const trackedBy = (key) => {
    const groups = new Map();
    for (const rel of tracked) {
      const k = key(rel);
      if (!groups.has(k)) groups.set(k, { tracked: 0, covered: 0, exempt: 0 });
      const g = groups.get(k);
      g.tracked += 1;
      if (covered.has(rel)) g.covered += 1;
      if (CONTROL_UNCOVERED_SUFFIXES.has(suffixClass(rel))) g.exempt += 1;
    }
    return [...groups.entries()].sort();
  };

  const byClass = trackedBy(suffixClass);
  const byTop = trackedBy((rel) => (rel.includes("/") ? `${rel.split("/")[0]}/` : "(root files)"));


  return [
    // RUNG A, positive: a covered class keeps every one of its files.
    ...byClass
      .filter(([cls]) => !CONTROL_UNCOVERED_SUFFIXES.has(cls))
      .map(([cls, g]) => [
        `CONTROL covers every tracked ${cls || "(no extension)"} file ` +
          `(${g.covered}/${g.tracked})`,
        g.covered === g.tracked,
      ]),
    // RUNG A, negative: a class declared uncoverable really is absent, so
    // the exemption list cannot quietly grow past the deny list either.
    ...byClass
      .filter(([cls]) => CONTROL_UNCOVERED_SUFFIXES.has(cls))
      .map(([cls, g]) => [
        `CONTROL excludes every tracked ${cls} file (${g.tracked} tracked, ${g.covered} covered)`,
        g.covered === 0,
      ]),
    // RUNG B: the architect's named classes, without asking the
    // exemption list for permission.
    ...MUST_CONTROL_COVER.map((cls) => {
      const g = byClass.find(([k]) => k === cls)?.[1] ?? { tracked: 0, covered: 0 };
      return [
        `required CONTROL class ${cls} is present and whole (${g.covered}/${g.tracked})`,
        g.tracked > 0 && g.covered === g.tracked,
      ];
    }),
    // RUNG C: no top-level entry quietly loses its text.
    ...byTop.map(([top, g]) => [
      `CONTROL keeps all non-asset files under ${top} ` +
        `(${g.covered}/${g.tracked - g.exempt})`,
      g.covered === g.tracked - g.exempt,
    ]),
  ];
}

/**
 * ── THE EVIDENCE FLOOR (T-080, closing T-058-s2 — poison shape five) ──
 * The three sample/check arrays above are self-enumerating and the
 * selftest fails per element, so DELETING AN ASSERTION DELETES ITS OWN
 * FAILURE: the green line then prints a smaller cardinality and nothing
 * compares it to anything. Measured at `16bb47b`, before this floor
 * existed — removing the six CONTROL root rows left the selftest green
 * at 31 walk-policy checks instead of 37, and removing the first six
 * TOKEN positives left it green at 43 samples instead of 49.
 *
 * A per-pattern COVERAGE floor rather than a literal count, because it
 * survives honest additions and still catches a removal: no number here
 * moves when a sample is added, and every one of them moves when the
 * last sample for some pattern is taken away.
 *
 * The floor is generated from TOKEN_PATTERNS — the PRODUCTION list — so
 * a pattern cannot be retired by deleting its row: retire the pattern
 * and the samples that expect its id fail first.
 */
function evidenceFloorChecks() {
  /** @param {string} id @returns {number} */
  const positivesFor = (id) => SAMPLES.filter((s) => s.expect.includes(id)).length;
  const tokenNegatives = SAMPLES.filter((s) => s.expect.length === 0).length;
  const controlPositives = CONTROL_SAMPLES.filter((s) => s.expect.length > 0);
  const controlNegatives = CONTROL_SAMPLES.filter((s) => s.expect.length === 0).length;
  const lettered = controlPositives.filter((s) =>
    s.expect.some((e) => /[A-F]/.test(e.codepoint.slice(2))),
  ).length;
  return [
    ...TOKEN_PATTERNS.map(({ id }) => [
      `${id} has a positive sample (${positivesFor(id)})`,
      positivesFor(id) > 0,
    ]),
    [`TOKEN samples include negatives (${tokenNegatives})`, tokenNegatives > 0],
    [
      `${CONTROL_PATTERN.id} has a positive sample (${controlPositives.length})`,
      controlPositives.length > 0,
    ],
    [`${CONTROL_PATTERN.id} has a negative sample (${controlNegatives})`, controlNegatives > 0],
    // T-058-s4: a positive whose hex has no letters cannot tell the
    // shipped formatter from a lowercase one. At least one must.
    [
      `${CONTROL_PATTERN.id} has a positive whose codepoint carries a hex letter (${lettered})`,
      lettered > 0,
    ],
  ];
}

export function selftest() {
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
  for (const { what, raw, expect } of CONTROL_SAMPLES) {
    const got = scanControlSource(raw).map(({ codepoint, offset }) => ({ codepoint, offset }));
    if (JSON.stringify(got) !== JSON.stringify(expect)) {
      failures += 1;
      console.error(
        `selftest FAIL: runtime P5 sample (${what}) matched ${JSON.stringify(got)} ` +
          `expected ${JSON.stringify(expect)}`,
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
  // The floor runs LAST and reports separately: a sample set that has
  // stopped covering a pattern is a different failure from a sample that
  // disagrees with the scanner, and CI's first step should say which.
  const floors = evidenceFloorChecks();
  for (const [what, ok] of floors) {
    if (!ok) {
      failures += 1;
      console.error(`selftest FAIL: evidence floor — ${what}`);
    }
  }
  if (failures > 0) {
    console.error(`lint-tokens selftest: ${failures} failure(s)`);
    process.exit(EXIT.FOUND);
  }
  console.log(
    `lint-tokens selftest: ${SAMPLES.length} TOKEN samples + ` +
      `${CONTROL_SAMPLES.length} CONTROL samples green, ` +
      `${checks.length} walk-policy checks green, ` +
      `${floors.length} evidence-floor checks green`,
  );
}
