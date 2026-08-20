/**
 * Side-effect-free scanner for the DOCS GATE (T-084).
 *
 * `docs/` is an INPUT to this repo's code suites, and both standing gate
 * triggers exclude it by construction: GRAPH REGEN fires on
 * `.ts/.tsx/.js/.jsx` OUTSIDE docs/, BOOT GATE on `app/src/**`,
 * `app/src-tauri/**` or a manifest. A commit whose whole diff is
 * `docs/tasks/*.md` matches neither, and twice now such a commit has
 * turned a suite red:
 *
 *   2026-08-19 `9c64cd8` — two finding titles opened with a backtick, a
 *   YAML reserved indicator, so two cards were unparseable. Nothing
 *   errored: the board got SHORTER, and it surfaced as
 *   `Expected "60" / Received "62"` in four bodies about scroll
 *   containment in tools/e2e/tests/shell-frame.spec.ts.
 *
 *   2026-08-19 `fede266` — a finding was filed with `status: closed`,
 *   outside the parser's eight-name vocabulary. `npm test` from app/
 *   went 830/831 on a commit whose entire diff was one markdown file,
 *   and the next executor found it rather than the verifier who wrote
 *   it (T-081-s9).
 *
 * Both were found three layers from the cause by somebody who was not
 * looking. This module answers the two questions that would have caught
 * them at the edit:
 *
 *   1. WHICH suites read this repo's own `docs/` tree, and which paths
 *      under it — DERIVED FROM THE TREE, never listed here. See
 *      `docsReaders()`; the derivation is the whole point of the card
 *      and `THE DERIVATION` below states it exactly.
 *   2. Does a card carry frontmatter the parser will refuse — a block
 *      that will not parse, or a `status:` outside the vocabulary. See
 *      `taskCardIssues()`, whose vocabulary is READ OUT OF the parser's
 *      own source rather than retyped (T-057: a rule with two
 *      implementations is two chances to disagree).
 *
 * Plain node, zero deps, no I/O at import time — the same contract
 * token-scan.mjs keeps, so this can move to CI's first step later
 * without being rewritten. `tools/e2e` imports neither app nor parser
 * (ADR-011); READING a first-party source file is not importing a
 * package, which is the same licence shell-frame.spec.ts and
 * window-contract.spec.ts already take to read `docs/` itself.
 *
 * ── THE DERIVATION ───────────────────────────────────────────────────
 * A DOCS READER is a tracked source file containing a DOCS SITE: a
 * path-forming call whose first string-literal path segment is `docs`
 * and whose base expression EVALUATES TO THE REPOSITORY ROOT.
 *
 * Both halves are load-bearing and each one alone is wrong:
 *
 * - The `docs`-FIRST rule is what keeps `tools/e2e/fixtures/shell.ts`
 *   out. It joins the repo root with
 *   `app/test/fixtures/genesis/streak/docs` — a base that IS the repo
 *   root and a path that DOES end in `docs`, but the first segment is
 *   `app`, so it reads a fixture tree and not this repo's docs/.
 * - The ROOT-EVALUATION rule is what keeps `lib/parser/test/files.test.ts`
 *   out. It does `join(root, 'docs', 'ROADMAP.md')` where `root` is
 *   `fixture(name)` — computed from `import.meta.url`, so a
 *   "mentions import.meta.url" heuristic would call it a reader. It
 *   evaluates to `lib/parser/test/fixtures/<name>`, which is not the
 *   repository root, so it is not one. THAT IS THE CARD'S OWN
 *   DISCRIMINATOR — "against the repository root rather than a fixture
 *   directory" — made executable instead of eyeballed.
 *
 * Bases are evaluated by `evalBase`, a small calculus over the six
 * root-forming shapes this tree actually uses (see ROOT_FORMS). A base
 * that does not evaluate is NOT quietly dropped: see `unlinkedFiles()`.
 *
 * ── WHAT IT CANNOT SEE — read before trusting a green run ────────────
 * - It is a REGEX SCAN over comment-stripped source, not a TypeScript or
 *   Rust parser. It knows string literals, line and block comments, and
 *   nothing about scope, aliasing or control flow.
 * - A docs path assembled through a value it cannot follow is invisible
 *   AS A PATH. `app/test/architecture-dogfood.test.ts` reads
 *   `docs/architecture/graph.json` through `read(GRAPH_PATH)`, where
 *   GRAPH_PATH is a constant exported by app/src — no site here. The
 *   FILE is still a reader (it has two literal sites), so the SUITE the
 *   gate names is right; only that one prefix is missing, and it is the
 *   one path under docs/ that a standing gate already owns (GRAPH REGEN
 *   regenerates it and `index --check` gates it). Named rather than
 *   papered over, and pinned as a known limit by the spec.
 * - A file that computes the repo root AND forms a docs path but whose
 *   link this scanner cannot make is reported by `unlinkedFiles()` and
 *   is a hard failure in the lane — the silent-miss direction is the
 *   only dangerous one, so it is the one that shouts. THAT TRIPWIRE IS
 *   ONLY AS WIDE AS THE SITE PATTERNS: a site it cannot SEE is one it
 *   cannot report, which is how the drill found the zero-argument-call
 *   base. A base that is a call WITH ARGUMENTS —
 *   `join(path.resolve(here), "docs")` — is still invisible to both,
 *   and is a named limit rather than a claim: nothing in the tree
 *   writes one, because a root gets bound before it gets joined.
 * - It says nothing about whether a body ASSERTS on what it read. A
 *   reader that reads docs/ and ignores it still counts; over-firing is
 *   the safe direction here, exactly as it is for GRAPH REGEN.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { regexEnd } from "./token-scan.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
/** tools/e2e/scripts -> repo root. */
export const repoRoot = path.resolve(here, "..", "..", "..");
/** This scanner, repo-relative — one of the exclusions below. */
const selfPath = path.relative(repoRoot, fileURLToPath(import.meta.url)).split(path.sep).join("/");
/**
 * Excluded from the scan BY NAME, not by extension — token-scan.mjs's
 * rule for the same reason. THIS file is where violation-shaped source
 * is correct: SITE_SAMPLES below spells ten real docs sites out as
 * sample text, so scanning it reports this module's own evidence back
 * as a reader.
 *
 * THE LIST IS ONE FILE AND THAT IS DELIBERATE. The spec that drives
 * this gate is NOT excluded: it holds no sample source — every site
 * shape it needs comes from here — so excluding it would be an
 * unproven entry in a list whose whole point is that each entry earns
 * itself. The spec asserts both halves: that scanning THIS file would
 * report, and that scanning the spec would not. This is not a hit
 * allowlist; this file stays in every other corpus and the exclusion
 * cannot mute a site anywhere else.
 */
export const DOCS_EXCLUDED_FILES = [selfPath];

/** Extensions scanned for docs sites: every first-party source language
 *  in this tree. Rust is included because the cargo suite is a docs
 *  reader — `snapshot_version_matches_the_live_method_stamps` reads
 *  docs/CONVENTIONS.md off disk on every `cargo test` — and a scan that
 *  looked at TypeScript alone would have missed a whole suite. */
export const SOURCE_EXTENSIONS = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|rs)$/;

/** Never descended into: build output and installed dependencies are not
 *  this repo's source. Same set token-scan.mjs uses, restated here so
 *  this module stays importable on its own. */
export const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "target",
  "test-results",
  "playwright-report",
]);

/**
 * The four packages CONVENTIONS' "Build & test" section carries a
 * `run from <dir>/:` bullet for, each with the ONE command that runs
 * that package's suite — the answer a docs-only diff needs.
 *
 * DELIBERATELY A SECOND LIST, not parsed out of the doc. The doc is the
 * authority for the command STRING and the spec checks every entry here
 * against it verbatim, so a reworded command reds by name; but a
 * derivation that took the whole bullet would have to GUESS which of its
 * five or six commands is the suite, and a guess is what this card
 * exists to remove. `app/src-tauri` sits before `app` on purpose: the
 * longest matching prefix wins, and a Rust reader is answered by
 * `cargo test`, never by `npm test`.
 */
export const SUITES = Object.freeze([
  Object.freeze({ dir: "app/src-tauri", command: "cargo test" }),
  Object.freeze({ dir: "app", command: "npm test" }),
  Object.freeze({ dir: "lib/parser", command: "npx vitest run" }),
  Object.freeze({ dir: "tools/e2e", command: "npm test" }),
]);

/**
 * The root-forming shapes this tree uses, named so a reader can see the
 * calculus `evalBase` implements and so the selftest can require a
 * positive for each. Every one of them is in the tree today.
 */
export const ROOT_FORMS = Object.freeze([
  "fileURLToPath(new URL('<rel>', import.meta.url))",
  "path.dirname(fileURLToPath(import.meta.url))",
  "path.resolve(<base>, '<rel>'...)",
  "resolve('<rel>') — against the package dir, where the runner starts",
  "Path::new(env!(\"CARGO_MANIFEST_DIR\")).parent()...",
  "Path::new(env!(\"CARGO_MANIFEST_DIR\")).ancestors().nth(<n>)",
]);

/** The backtick, built from a character code and never typed as a
 *  delimiter inside a pattern — T-058's practical lesson applied to the
 *  character that opens a template literal. */
const BACKTICK = String.fromCharCode(96);

// ── comment stripping ────────────────────────────────────────────────

/**
 * Blank every line and block comment, preserving length and newlines so
 * `file:line` stays exact. String and template literals survive intact —
 * a docs site lives in one. Rust and TypeScript share both comment
 * forms, so one pass covers both; Rust's nested block comments are handled by
 * counting depth, which TypeScript never needs and never trips over.
 *
 * WHY IT IS HERE AT ALL: a doc comment showing the idiom is the most
 * likely false positive this scan can have, and the next person to
 * document a dogfood reader will write the call in prose above it. The
 * two files that spell sites out as SAMPLES are excluded by name
 * instead, because their samples are string text and no comment strip
 * can reach them.
 */
export function stripComments(src) {
  const n = src.length;
  const out = new Array(n);
  const keep = (i) => {
    out[i] = src[i];
  };
  const blank = (i) => {
    const c = src[i];
    out[i] = c === "\n" || c === "\r" ? c : " ";
  };
  /** Last significant code character — what decides whether a `/` opens
   *  a regex literal. token-scan.mjs's lexer owns that call. */
  let prevSig = -1;
  let i = 0;
  while (i < n) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") blank(i++);
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      // FIRST close wins, and Rust's nested block comments are a NAMED
      // non-goal rather than an oversight: counting depth looks more
      // correct and is strictly worse here, because a JSDoc paragraph
      // quoting a glob (`app/src/**`) opens a level it never closes and
      // the counter then blanks the rest of the file — measured on this
      // module's own header, which quotes three of them.
      let j = i + 2;
      while (j < n && !(src[j] === "*" && src[j + 1] === "/")) j += 1;
      const stop = j < n ? j + 2 : n;
      while (i < stop) blank(i++);
      continue;
    }
    if (c === "/") {
      const stop = regexEnd(src, i, prevSig);
      if (stop !== -1) {
        // A REGEX LITERAL IS BLANKED, NOT KEPT, and that is the branch
        // this scanner exists to get right: a quote or a backtick inside
        // one — `(['"` + BACKTICK + `])` is in this very module — makes a
        // naive strip open a fake string and swallow the rest of the
        // file, which HIDES sites rather than inventing them. A docs
        // site is never inside a regex literal, so blanking loses
        // nothing.
        while (i < stop) blank(i++);
        prevSig = stop - 1;
        continue;
      }
      // not a regex — an ordinary code character (division, or a path)
    }
    if (c === '"' || c === "'" || c === BACKTICK) {
      keep(i);
      let j = i + 1;
      while (j < n) {
        const d = src[j];
        if (d === "\\") {
          keep(j);
          if (j + 1 < n) keep(j + 1);
          j += 2;
          continue;
        }
        keep(j);
        j += 1;
        if (d === c) break;
        // `"` and `'` resync at the newline so an apostrophe in prose or
        // a Rust lifetime cannot swallow the rest of the file; a template
        // literal may legitimately span lines, so it is not in the guard.
        if (c !== BACKTICK && (d === "\n" || d === "\r")) break;
      }
      prevSig = j - 1;
      i = j;
      continue;
    }
    keep(i);
    if (!/\s/.test(c)) prevSig = i;
    i += 1;
  }
  for (let k = 0; k < n; k += 1) if (out[k] === undefined) blank(k);
  const stripped = out.join("");
  /* Alignment is load-bearing (file:line is read off it) — assert it,
   * never assume it. A lexer bug becomes a loud crash, not a quiet miss. */
  if (stripped.length !== n) {
    throw new Error(`docs-scan: strip length ${stripped.length} != source ${n}`);
  }
  return stripped;
}

// ── docs sites ───────────────────────────────────────────────────────

/** `join(BASE, "docs/…")` / `resolve(BASE, 'docs', …)` — a JS/TS path
 *  call whose first literal segment is `docs` and whose base is not a
 *  string literal. Group 1 is the base expression.
 *
 *  THE ZERO-ARGUMENT CALL ALTERNATIVE IS NOT DECORATION: a base like
 *  `fixtureRoot()` carries parentheses, which the character class must
 *  exclude to stay anchored, so without the alternative a site written
 *  that way is invisible AND so is the tripwire that should have
 *  reported it. Found by the poison drill, not by reading — the
 *  unlinked-file assertion was VACUOUS for that shape until this
 *  branch existed. Rust's method form has always allowed it, which is
 *  how `common::repo_root().join(…)` was found in the first place. */
const JS_SITE = /(?:^|[^\w$.])(?:[\w$]+\.)?(?:join|resolve)\s*\(\s*((?:[\w$.]+\s*\(\s*\)|[^,()'"`]+?))\s*,\s*(['"`])docs(?=[/'"`]|\2)/g;

/** `BASE.join("docs/…")` — Rust's method form, one argument. */
const RS_SITE = /([\w$]+(?:::[\w$]+)*(?:\(\))?)\s*\.\s*join\s*\(\s*"docs(?=[/"])/g;

/** The path literal a site opens, read forward from the match so a
 *  segmented call (`'docs', 'tasks', 'rejected'`) reads the same as a
 *  slashed one (`"docs/tasks/rejected"`). Returns a POSIX prefix. */
function sitePrefix(stripped, from) {
  const segments = [];
  let i = from;
  const n = stripped.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(stripped[i])) i += 1;
    const q = stripped[i];
    if (q !== '"' && q !== "'" && q !== "`") break;
    let j = i + 1;
    let text = "";
    while (j < n && stripped[j] !== q) {
      if (stripped[j] === "\\") {
        j += 2;
        continue;
      }
      text += stripped[j];
      j += 1;
    }
    if (text.includes("$")) break; // interpolated: stop at what is known
    segments.push(...text.split("/").filter(Boolean));
    i = j + 1;
    while (i < n && /\s/.test(stripped[i])) i += 1;
    if (stripped[i] !== ",") break;
    i += 1;
  }
  return segments.join("/");
}

/**
 * Source fragments, lexed exactly as a file is — the sample discipline
 * token-scan.mjs uses, and the reason this file is excluded from its own
 * scan BY NAME: every positive below IS a docs site, so scanning this
 * module would report its own evidence back as a reader.
 *
 * The NEGATIVES are the precision. Each one is a real shape from this
 * tree that a looser rule would have swallowed, and two of them are the
 * discriminator itself: a repo-root join whose first segment is not
 * `docs`, and a `docs/`-shaped string with no path call around it at
 * all. The last two are comments, which is what `stripComments` is for —
 * documenting the idiom must not make the documenting file a reader.
 */
export const SITE_SAMPLES = Object.freeze([
  // ── positives: every spelling the tree actually uses ────────────────
  { text: 'const dir = join(ROOT, "docs/tasks");', sites: [["ROOT", "docs/tasks"]] },
  {
    text: 'const f = path.join(repoRoot, "docs", "CONVENTIONS.md");',
    sites: [["repoRoot", "docs/CONVENTIONS.md"]],
  },
  {
    text: "const d = join(repoRoot, 'docs', 'tasks', 'rejected');",
    sites: [["repoRoot", "docs/tasks/rejected"]],
  },
  { text: 'const all = path.join(repoRoot, "docs");', sites: [["repoRoot", "docs"]] },
  { text: 'const r = resolve(ROOT, "docs/ROADMAP.md");', sites: [["ROOT", "docs/ROADMAP.md"]] },
  {
    text: 'let p = repo_root().join("docs/CONVENTIONS.md");',
    sites: [["repo_root()", "docs/CONVENTIONS.md"]],
  },
  {
    text: 'let p = common::repo_root().join("docs/architecture/components");',
    sites: [["common::repo_root()", "docs/architecture/components"]],
  },
  // ── negatives: the tree's real near-misses ─────────────────────────
  // THE DISCRIMINATOR, one: the base IS the repo root and the path DOES
  // end in `docs`, but its first segment is `app` — a fixture tree.
  // Verbatim in shape from tools/e2e/fixtures/shell.ts.
  {
    text: 'const streak = path.join(repoRoot, "app", "test", "fixtures", "genesis", "streak", "docs");',
    sites: [],
  },
  // an in-memory fixture entry: a docs-shaped string with no path call
  { text: 'entries.push({ path: "docs/tasks/T-101.md", content: text });', sites: [] },
  { text: "const full = join(dir, name);", sites: [] },
  // a base that is itself a literal is a relative path, not a root
  { text: 'const rel = join("docs", "tasks");', sites: [] },
  // documenting the idiom must not make the documenting file a reader
  { text: '// join(ROOT, "docs/tasks") in a line comment is prose', sites: [] },
  { text: '/* join(ROOT, "docs/tasks") in a block comment is prose */', sites: [] },
  // ── the one that bit while this gate was being written ─────────────
  // A REGEX LITERAL carrying a quote and a backtick — the shape of this
  // module's own site patterns. A strip that does not lex regexes opens
  // a fake template at that backtick and swallows everything after it,
  // so the REAL site on the next line disappears. Measured: this file
  // reported ZERO sites in itself until the strip shared
  // token-scan.mjs's lexer. The failure direction is HIDING a reader,
  // which is the only direction that matters.
  {
    text:
      "const re = /([" + BACKTICK + "'\"]+?)/g;\n" +
      'const dir = join(ROOT, "docs/tasks");',
    sites: [["ROOT", "docs/tasks"]],
  },
  // and a bare regex on its own is still not a site
  { text: "const re = /join\\(ROOT, .docs/;", sites: [] },
  // ── the second one the drill found ─────────────────────────────────
  // A ZERO-ARGUMENT CALL as the base. The character class that keeps the
  // base anchored has to exclude parentheses, so this shape was
  // invisible — and so was the unlinked-file tripwire that should have
  // reported it, which is the vacuous-assertion direction. Rust's method
  // form always allowed it; the JS form does now.
  { text: 'const d = join(fixtureRoot(), "docs/tasks");', sites: [["fixtureRoot()", "docs/tasks"]] },
  { text: 'const d = join(path.resolve(here), "docs");', sites: [] },
]);

/**
 * The sample set, run. Returns `[what, ok]` rows the way token-scan's
 * walk-policy checks do, plus an evidence floor so deleting a sample
 * cannot delete its own failure (poison shape FIVE): the floor is
 * generated from the sample set's own shape and requires positives and
 * negatives to both survive.
 */
export function siteSelftest() {
  const rows = [];
  for (const { text, sites } of SITE_SAMPLES) {
    const got = docsSites(stripComments(text)).map((s) => [s.base, s.prefix]);
    rows.push([
      `sample ${JSON.stringify(text)} -> ${JSON.stringify(got)}`,
      JSON.stringify(got) === JSON.stringify(sites),
    ]);
  }
  const positives = SITE_SAMPLES.filter((s) => s.sites.length > 0).length;
  const negatives = SITE_SAMPLES.length - positives;
  const rust = SITE_SAMPLES.filter((s) => s.text.includes("::") || s.text.startsWith("let ")).length;
  rows.push([`site samples include positives (${positives})`, positives > 0]);
  rows.push([`site samples include negatives (${negatives})`, negatives > 0]);
  rows.push([`site samples include a Rust spelling (${rust})`, rust > 0]);
  return rows;
}

/** Every docs site in one already-stripped source text. */
export function docsSites(stripped) {
  const sites = [];
  const lineOf = (index) => stripped.slice(0, index).split("\n").length;
  for (const m of stripped.matchAll(JS_SITE)) {
    const start = m.index + m[0].length - "docs".length - 1;
    sites.push({ line: lineOf(m.index), base: m[1].trim(), prefix: sitePrefix(stripped, start) });
  }
  for (const m of stripped.matchAll(RS_SITE)) {
    const start = m.index + m[0].length - "docs".length - 1;
    sites.push({ line: lineOf(m.index), base: m[1].trim(), prefix: sitePrefix(stripped, start) });
  }
  return sites.sort((a, b) => a.line - b.line || a.prefix.localeCompare(b.prefix));
}

// ── root evaluation ──────────────────────────────────────────────────

/** `name = <expr>;` bindings, plus Rust `fn name() -> … { <expr> }`. The
 *  value is the raw text, evaluated lazily and to a FIXPOINT so
 *  `here` -> `repoRoot` chains resolve in either declaration order. */
function bindings(stripped) {
  const map = new Map();
  for (const m of stripped.matchAll(/(?:^|[;{}\s])(?:const|let|var)\s+([\w$]+)\s*=\s*([^;\n]+)/g)) {
    if (!map.has(m[1])) map.set(m[1], m[2].trim());
  }
  for (const m of stripped.matchAll(/(?:^|\s)fn\s+([\w$]+)\s*\(\s*\)[^{]*\{([\s\S]{0,400}?)\n\s*\}/g)) {
    if (!map.has(m[1])) map.set(m[1], m[2].trim());
  }
  return map;
}

/** How many directories `.parent()` / `.ancestors().nth(n)` climbs. */
function rustClimb(expr) {
  let up = 0;
  for (const _ of expr.matchAll(/\.\s*parent\s*\(\s*\)|\.\s*and_then\s*\(\s*Path::parent\s*\)/g)) up += 1;
  const nth = /\.\s*ancestors\s*\(\s*\)\s*\.\s*nth\s*\(\s*(\d+)/.exec(expr);
  if (nth !== null) up += Number(nth[1]);
  return up;
}

/**
 * Evaluate a base expression to an absolute directory, or null.
 *
 * `fileDir` is the directory of the file the expression lives in;
 * `pkgDir` is its package directory (where the runner starts, which is
 * what a bare `resolve('..')` is relative to); `crateDir` is the nearest
 * ancestor holding a Cargo.toml, which is what `CARGO_MANIFEST_DIR` is.
 * Depth-limited so a self-referential binding cannot spin.
 */
export function evalBase(expr, ctx, depth = 0) {
  if (depth > 6) return null;
  const text = expr.trim().replace(/\s+/g, " ");
  if (text === "") return null;

  // Rust: the crate manifest dir, climbed.
  if (text.includes('env!("CARGO_MANIFEST_DIR")')) {
    if (ctx.crateDir === undefined) return null;
    let dir = ctx.crateDir;
    for (let k = rustClimb(text); k > 0; k -= 1) dir = path.dirname(dir);
    return dir;
  }
  // The file's own URL, with an optional relative step and dirname.
  if (text.includes("import.meta.url")) {
    const url = /new URL\(\s*(['"`])([^'"`]*)\1\s*,\s*import\.meta\.url\s*\)/.exec(text);
    let base = url === null ? ctx.filePath : path.resolve(ctx.fileDir, url[2]);
    // fileURLToPath(import.meta.url) is the FILE; dirname() makes it the dir.
    if (url === null && /\bdirname\s*\(/.test(text)) base = path.dirname(base);
    const extra = /(?:^|[^\w$.])(?:[\w$]+\.)?(?:resolve|join)\s*\(\s*[^,()]*\(([\s\S]*?)\)\s*\)\s*,\s*(.*)$/.exec(text);
    if (extra !== null) {
      const lits = [...extra[2].matchAll(/(['"`])([^'"`]*)\1/g)].map((m) => m[2]);
      if (lits.length > 0) base = path.resolve(base, ...lits);
    }
    return base;
  }
  // `resolve(BASE?, '<rel>'…)` / `join(...)`: literals against a base.
  const call = /(?:^|[^\w$.])(?:[\w$]+\.)?(?:resolve|join)\s*\(([\s\S]*)\)\s*$/.exec(text);
  if (call !== null) {
    const args = splitArgs(call[1]);
    if (args.length === 0) return null;
    const lit = (a) => /^(['"`])([\s\S]*)\1$/.exec(a.trim());
    const first = lit(args[0]);
    let base;
    let rest;
    if (first !== null) {
      base = ctx.pkgDir; // the runner's cwd for this package
      rest = args;
    } else {
      base = evalBase(args[0], ctx, depth + 1);
      rest = args.slice(1);
    }
    if (base === null || base === undefined) return null;
    const lits = [];
    for (const a of rest) {
      const l = lit(a);
      if (l === null) return null;
      lits.push(l[2]);
    }
    return lits.length > 0 ? path.resolve(base, ...lits) : base;
  }
  // A bare identifier (or a zero-argument call): follow its binding.
  const ident = /^([\w$]+(?:::[\w$]+)*)(?:\(\))?$/.exec(text);
  if (ident !== null) {
    const name = ident[1].split("::").pop();
    const local = ctx.bindings.get(name);
    if (local !== undefined && local !== text) return evalBase(local, ctx, depth + 1);
    const imported = ctx.resolveImport?.(name);
    if (imported !== null && imported !== undefined) return evalBase(imported.expr, imported.ctx, depth + 1);
    return null;
  }
  return null;
}

/** Split a call's argument text on top-level commas. */
function splitArgs(text) {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = "";
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quote !== null) {
      cur += c;
      if (c === "\\") {
        cur += text[i + 1] ?? "";
        i += 1;
      } else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      cur += c;
      continue;
    }
    if (c === "(" || c === "[" || c === "{") depth += 1;
    if (c === ")" || c === "]" || c === "}") depth -= 1;
    if (c === "," && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim() !== "") out.push(cur);
  return out.map((a) => a.trim()).filter((a) => a !== "");
}

// ── the tree ─────────────────────────────────────────────────────────

/** Every path git tracks. A throw here means the gate could not run. */
export function trackedFiles(root = repoRoot) {
  let listed;
  try {
    listed = execFileSync("git", ["ls-files", "-z"], {
      cwd: root,
      encoding: "buffer",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (err) {
    throw new Error(`docs-scan: cannot derive the tracked corpus: ${String(err)}`);
  }
  return listed
    .toString("utf8")
    .split(String.fromCharCode(0))
    .filter(Boolean)
    .sort();
}

/** The scanned corpus: tracked first-party source, minus the two files
 *  whose samples ARE docs sites. */
export function sourceCorpus(root = repoRoot) {
  return trackedFiles(root)
    .filter((rel) => !rel.split("/").some((part) => SKIP_DIRS.has(part)))
    .filter((rel) => SOURCE_EXTENSIONS.test(rel))
    .filter((rel) => !DOCS_EXCLUDED_FILES.includes(rel));
}

/** The suite a path belongs to: the longest declared package prefix. */
export function suiteFor(rel) {
  let best;
  for (const s of SUITES) {
    if (rel === s.dir || rel.startsWith(`${s.dir}/`)) {
      if (best === undefined || s.dir.length > best.dir.length) best = s;
    }
  }
  return best;
}

/** The nearest ancestor directory holding a Cargo.toml, or undefined. */
function crateDirFor(absFile, root) {
  let dir = path.dirname(absFile);
  while (dir.startsWith(root)) {
    try {
      if (statSync(path.join(dir, "Cargo.toml")).isFile()) return dir;
    } catch {
      /* not here; climb */
    }
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  return undefined;
}

/** Which module an imported name comes from, if the file imports it from
 *  a RELATIVE first-party path this scanner can open. */
function importSourceOf(stripped, name) {
  for (const m of stripped.matchAll(/import\s*\{([^}]*)\}\s*from\s*(['"`])([^'"`]+)\2/g)) {
    const names = m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop().trim());
    if (names.includes(name) && m[3].startsWith(".")) return m[3];
  }
  return null;
}

const MODULE_SUFFIXES = ["", ".ts", ".tsx", ".mts", ".cts", ".mjs", ".js", "/index.ts", "/index.js"];

function readIfFile(abs) {
  try {
    if (!statSync(abs).isFile()) return null;
    return readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

/**
 * Rust has no import specifier this scanner can follow — `common::repo_root()`
 * names a module, not a file — so a Rust name is resolved inside its own
 * CRATE: every tracked `.rs` file under the same Cargo.toml is searched
 * for `fn <name>`. That is how `nputer-index`'s `arch.rs` reaches the
 * `repo_root()` in its `tests/common/mod.rs`, and it stays inside the
 * crate so two crates may each have their own without colliding.
 * Memoized per crate: the enumeration walks the corpus twice.
 */
const crateFnCache = new Map();

function crateFnBinding(crateDir, name, root) {
  if (crateDir === undefined) return null;
  let table = crateFnCache.get(crateDir);
  if (table === undefined) {
    table = new Map();
    const rel = path.relative(root, crateDir).split(path.sep).join("/");
    for (const other of trackedFiles(root)) {
      if (!other.endsWith(".rs")) continue;
      if (rel !== "" && !other.startsWith(`${rel}/`)) continue;
      const text = readIfFile(path.join(root, other));
      if (text === null) continue;
      for (const [k, v] of bindings(stripComments(text))) {
        if (!table.has(k)) table.set(k, { expr: v, file: other });
      }
    }
    crateFnCache.set(crateDir, table);
  }
  return table.get(name) ?? null;
}

/** One file's evaluation context, including a one-hop name follower. */
function contextFor(rel, stripped, root) {
  const filePath = path.join(root, rel);
  const suite = suiteFor(rel);
  const crateDir = rel.endsWith(".rs") ? crateDirFor(filePath, root) : undefined;
  const ctx = {
    filePath,
    fileDir: path.dirname(filePath),
    pkgDir: suite === undefined ? root : path.join(root, suite.dir),
    crateDir,
    bindings: bindings(stripped),
  };
  ctx.resolveImport = (name) => {
    const spec = importSourceOf(stripped, name);
    if (spec !== null) {
      for (const suffix of MODULE_SUFFIXES) {
        const abs = path.resolve(ctx.fileDir, spec + suffix);
        const text = readIfFile(abs);
        if (text === null) continue;
        const other = stripComments(text);
        const otherRel = path.relative(root, abs).split(path.sep).join("/");
        const expr = bindings(other).get(name);
        if (expr === undefined) return null;
        return { expr, ctx: { ...contextFor(otherRel, other, root), resolveImport: () => null } };
      }
      return null;
    }
    const inCrate = crateFnBinding(crateDir, name, root);
    if (inCrate === null) return null;
    const otherCtx = { ...ctx, filePath: path.join(root, inCrate.file), fileDir: path.dirname(path.join(root, inCrate.file)), bindings: new Map(), resolveImport: () => null };
    return { expr: inCrate.expr, ctx: otherCtx };
  };
  return ctx;
}

/**
 * THE MECHANICAL ENUMERATION. Every tracked source file that reads THIS
 * repository's `docs/` tree, with the suite that runs it and the docs
 * prefixes it names. Sorted, so two runs over one tree agree.
 */
export function docsReaders(root = repoRoot) {
  const readers = [];
  for (const rel of sourceCorpus(root)) {
    const stripped = stripComments(readFileSync(path.join(root, rel), "utf8"));
    const sites = docsSites(stripped);
    if (sites.length === 0) continue;
    const ctx = contextFor(rel, stripped, root);
    const prefixes = new Set();
    for (const site of sites) {
      if (evalBase(site.base, ctx) !== root) continue;
      prefixes.add(site.prefix === "" ? "docs" : site.prefix);
    }
    if (prefixes.size === 0) continue;
    const suite = suiteFor(rel);
    readers.push({
      file: rel,
      suite: suite?.dir,
      command: suite?.command,
      prefixes: [...prefixes].sort(),
    });
  }
  return readers.sort((a, b) => a.file.localeCompare(b.file));
}

/**
 * Files this scanner could not link, and the reason it is a hard
 * failure rather than a footnote: a file that BOTH forms a docs-first
 * path AND computes the repository root, where no site's base resolved
 * to the root, is either a reader written in a shape `evalBase` does not
 * know or a genuine non-reader. The scanner cannot tell, so it says so.
 * Silence is the one outcome this card exists to remove.
 */
export function unlinkedFiles(root = repoRoot) {
  const out = [];
  const known = new Set(docsReaders(root).map((r) => r.file));
  for (const rel of sourceCorpus(root)) {
    if (known.has(rel)) continue;
    const stripped = stripComments(readFileSync(path.join(root, rel), "utf8"));
    const sites = docsSites(stripped);
    if (sites.length === 0) continue;
    const ctx = contextFor(rel, stripped, root);
    const anchors = [...ctx.bindings.entries()].filter(
      ([, expr]) => evalBase(expr, ctx) === root,
    );
    if (anchors.length === 0) continue;
    out.push({ file: rel, bases: [...new Set(sites.map((s) => s.base))].sort() });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

/** prefix -> the suites that read it, derived from `docsReaders`. */
export function docsInputMap(readers) {
  const map = new Map();
  for (const r of readers) {
    for (const p of r.prefixes) {
      if (!map.has(p)) map.set(p, new Set());
      map.get(p).add(r.command);
    }
  }
  return map;
}

/** Does `prefix` cover `changed`? `docs` covers everything under docs/;
 *  `docs/CONVENTIONS.md` covers exactly itself. */
function covers(prefix, changed) {
  return changed === prefix || changed.startsWith(`${prefix}/`);
}

/**
 * THE GATE. Given a diff's changed paths, which suites does it owe?
 *
 * Pure: no I/O, no git, no clock — the readers are passed in, so the
 * answer for a synthetic diff is as derivable as for a real one, and a
 * pin can drive a docs-only diff with no code file in it at all.
 */
export function docsGate(changedPaths, readers) {
  const docsPaths = changedPaths.filter((p) => p === "docs" || p.startsWith("docs/")).sort();
  const byPath = [];
  const commands = new Set();
  for (const changed of docsPaths) {
    const owed = [];
    for (const r of readers) {
      if (!r.prefixes.some((p) => covers(p, changed))) continue;
      owed.push(r);
      if (r.command !== undefined) commands.add(r.command);
    }
    byPath.push({
      path: changed,
      readers: owed.map((r) => r.file),
      commands: [...new Set(owed.map((r) => `${r.command} from ${r.suite}/`))].sort(),
    });
  }
  return {
    fires: byPath.some((e) => e.readers.length > 0),
    docsPaths,
    byPath,
    commands: [
      ...new Set(
        byPath.flatMap((e) => e.commands),
      ),
    ].sort(),
  };
}

// ── the frontmatter vocabulary ───────────────────────────────────────

/**
 * The eight task statuses, READ OUT OF the parser's own source rather
 * than retyped here. `lib/parser/src/types.ts` owns the vocabulary;
 * restating it would be the T-057 defect this gate is supposed to
 * prevent — "a rule with two implementations is two chances to
 * disagree" — so there is exactly one list in the tree and this gate
 * follows it. A ninth status added there is honoured here with no edit.
 *
 * Throws if the declaration cannot be read: a vocabulary gate that
 * silently falls back to an empty set accepts everything.
 */
export const TASK_STATUS_SOURCE = "lib/parser/src/types.ts";

export function taskStatuses(root = repoRoot) {
  const file = path.join(root, TASK_STATUS_SOURCE);
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch (err) {
    throw new Error(`docs-scan: cannot read the status vocabulary from ${TASK_STATUS_SOURCE}: ${String(err)}`);
  }
  const decl = /export const TASK_STATUSES\s*=\s*\[([\s\S]*?)\]\s*as const/.exec(text);
  if (decl === null) {
    throw new Error(
      `docs-scan: ${TASK_STATUS_SOURCE} no longer declares \`export const TASK_STATUSES = [ … ] as const\` — ` +
        "this gate READS the vocabulary rather than restating it, so a moved declaration is a gate " +
        "that could not run, never an empty vocabulary that accepts anything.",
    );
  }
  const values = [...decl[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((m) => m[2]);
  if (values.length === 0) {
    throw new Error(`docs-scan: ${TASK_STATUS_SOURCE} declares TASK_STATUSES with no values`);
  }
  return values;
}

/** The frontmatter block's raw YAML, or null. The two delimiters are
 *  transcribed from lib/parser/src/frontmatter.ts and the spec pins the
 *  transcription against that file, so the two cannot drift silently. */
export function frontmatterBlock(content) {
  const open = /^\uFEFF?---\r?\n/.exec(content);
  if (open === null) return null;
  const rest = content.slice(open[0].length);
  const close = /^---[ \t]*(?:\r?\n|$)/m.exec(rest);
  if (close === null) return null;
  return rest.slice(0, close.index);
}

/** Levenshtein distance, for the near-miss hint. */
function distance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const next = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = prev[j];
      prev[j] = next;
    }
  }
  return prev[b.length];
}

/** Statuses within edit distance 2 of `got` — the same near-miss
 *  treatment the parser already gives a dangling `blocked_by`. */
export function nearMisses(got, statuses) {
  return statuses.filter((s) => distance(got.toLowerCase(), s) <= 2).sort();
}

/**
 * THE RULING, quoted at the point of failure rather than left in a doc
 * nobody opens while writing a finding. `closed` has no near-miss — it
 * is not a typo for anything in the vocabulary — so a spelling hint
 * would say nothing, and what the writer actually needs is the move.
 */
export const DISPOSITION_RULING =
  "`closed` is not a status and is not becoming one: it is a DISPOSITION, and " +
  "disposition belongs to TRIAGE (docs/CONVENTIONS.md, the suggestion-triage " +
  "bullet). A finding whose work was resolved elsewhere keeps `status: suggested` " +
  "and records the discharge in its own body — a `closed_by:` line naming the " +
  "commit is the shape T-081-s7 uses. Triage then makes the move: promoted " +
  "(`Absorbs:` on the absorbing task plus the file removed), parked (in place, " +
  "with a dated trigger and an id), or rejected (`git mv` to docs/tasks/rejected/).";

/** True for the files the parser's live walk collects as task cards:
 *  FLAT `docs/tasks/T-*.md`, non-recursive (THE FOUR WALKS, row four). */
export function isTaskCardPath(rel) {
  return /^docs\/tasks\/T-[^/]*\.md$/.test(rel);
}

/**
 * Frontmatter issues in a set of `{path, content}` entries — the loud,
 * file-naming failure the two incidents did not get. Pure: the caller
 * supplies the entries, so the same function judges the live tree and a
 * planted card with no filesystem in the way.
 *
 * `parseYaml` is injected rather than imported: this module stays
 * zero-dependency (CI's first step runs against a bare checkout), and
 * the caller passes the SAME `yaml` package the parser itself depends
 * on, so the block either parses for both or for neither.
 */
export function taskCardIssues(entries, { statuses, parseYaml }) {
  const issues = [];
  for (const { path: file, content } of entries) {
    if (!isTaskCardPath(file)) continue;
    const block = frontmatterBlock(content);
    if (block === null) {
      issues.push({
        kind: "missing-frontmatter",
        file,
        message: `${file}: no closed '---' YAML frontmatter block — the parser collects this file and will refuse it`,
      });
      continue;
    }
    let data;
    try {
      data = parseYaml(block);
    } catch (err) {
      issues.push({
        kind: "yaml-error",
        file,
        message:
          `${file}: frontmatter does not parse as YAML — ${err instanceof Error ? err.message : String(err)}. ` +
          "A plain scalar may not open with a reserved indicator, so a title beginning with a backtick, " +
          "a dash or a colon must be quoted.",
      });
      continue;
    }
    if (data === null || typeof data !== "object") {
      issues.push({
        kind: "yaml-error",
        file,
        message: `${file}: frontmatter is not a mapping`,
      });
      continue;
    }
    const got = data.status;
    if (got === undefined || got === null) {
      issues.push({
        kind: "missing-field",
        file,
        field: "status",
        message: `${file}: missing required field 'status'`,
      });
      continue;
    }
    const value = typeof got === "string" ? got.trim() : got;
    if (typeof value !== "string" || !statuses.includes(value)) {
      const near = typeof value === "string" ? nearMisses(value, statuses) : [];
      issues.push({
        kind: "invalid-field",
        file,
        field: "status",
        value,
        nearMiss: near,
        message:
          `${file}: field 'status' must be one of ${statuses.join(" | ")}, got ${JSON.stringify(value)}` +
          (near.length > 0 ? ` — did you mean ${near.join(" or ")}?` : "") +
          (value === "closed" ? ` — ${DISPOSITION_RULING}` : ""),
      });
    }
  }
  return issues.sort((a, b) => a.file.localeCompare(b.file));
}

/** docs/CONVENTIONS.md, read off the tree. The gate's own doc is a
 *  first-party text file like any other; reading it is what lets the
 *  bullet below be CHECKED against the derivation instead of trusted. */
export function conventionsText(root = repoRoot) {
  return readFileSync(path.join(root, "docs/CONVENTIONS.md"), "utf8");
}

/**
 * One `- ` bullet of docs/CONVENTIONS.md, found by a phrase it carries
 * and returned with its whitespace collapsed — bullets split on a
 * newline followed by "- " at COLUMN 0 and then normalize, which is
 * exactly what workflow-parity.spec.ts does to the same file, so the
 * two agree about what a bullet is and neither is fooled by a wrap.
 *
 * Throws unless the phrase names EXACTLY ONE bullet. Zero is a renamed
 * or deleted bullet; two is a phrase that has stopped identifying one,
 * and silently taking the first is how a check ends up asserting
 * against the wrong paragraph. A derivation that expects nothing is
 * worse than one that is wrong, because nothing points at it.
 */
export function conventionsBullet(md, phrase) {
  const bullets = md
    .split(/\n(?=- )/)
    .filter((b) => b.startsWith("- "))
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter((b) => b.includes(phrase));
  if (bullets.length !== 1) {
    throw new Error(
      `docs-scan: docs/CONVENTIONS.md has ${bullets.length} bullets containing ` +
        `${JSON.stringify(phrase)}, expected exactly one — this gate checks its own ` +
        "documented trigger against the derivation, so a renamed, deleted or " +
        "no-longer-identifying phrase is a hard failure, never an empty expectation.",
    );
  }
  return bullets[0];
}

/** Every live task card as a `{path, content}` entry, read off the tree
 *  the same way the parser's own walk does: FLAT and non-recursive. */
export function liveTaskCards(root = repoRoot) {
  return trackedFiles(root)
    .filter(isTaskCardPath)
    .map((rel) => ({ path: rel, content: readFileSync(path.join(root, rel), "utf8") }));
}
