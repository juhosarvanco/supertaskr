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
 * A DOCS READER is a tracked source file that resolves a path under
 * `docs/` against THIS repository's root, in either of two ways:
 *
 *   A DOCS SITE — a path-forming call in the file itself whose first
 *   string-literal path segment is `docs` and whose base expression
 *   EVALUATES TO THE REPOSITORY ROOT; or
 *
 *   A CALL SITE — a call in the file that hands the repository root to a
 *   first-party function which spends it on a docs path.
 *
 * THE SECOND ARM IS NOT AN EXTRA. A literal-only rule reads the card's
 * "any body that RESOLVES a path under docs/ against the repository
 * root" as "any body that SPELLS one", and the two are different sets on
 * this tree: `lib/parser/test/smoke.test.ts` calls
 * `parseProject(repoRoot)` and spells no docs path at all, while
 * `lib/parser/src/project.ts` spends that root on docs/tasks,
 * docs/ROADMAP.md AND docs/architecture/components. Measured before the
 * arm existed: a one-line edit to docs/ROADMAP.md made this gate owe
 * exactly `npm test` from tools/e2e — 114/114, exit 0 — while
 * `npx vitest run` from lib/parser went 262/263 at exit 1 in a suite the
 * answer never named. AN INTEGRATOR WHO OBEYED THE GATE MERGED A RED
 * TREE, which is this card's own failure mode arriving through the gate
 * built to remove it.
 *
 * The hop is ONE, plus re-export barrels (lib/parser's public surface is
 * a barrel, so stopping at it stops one file short of every entry
 * point), and it reads a parameter's DEFAULT when the call supplies no
 * argument — `(root = repoRoot)` is the dominant first-party helper
 * signature in this tree and such a helper is CALLED WITH NOTHING.
 *
 * Both halves of the site rule are load-bearing and each one alone is
 * wrong:
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
 * ── WHAT IT CANNOT SEE ───────────────────────────────────────────────
 * AN ACCOUNT, NOT A SAMPLE. The previous version of this section named
 * one residual and called it bounded; a verifier then swept the corpus
 * and found three more of the same class it did not mention. A list of
 * examples cannot be checked for completeness, so this section is
 * organised around something that can: `rootAnchoredFiles()`.
 *
 * THE BOUND. A file can only read THIS repository's docs/ if it holds
 * THIS repository's root. `rootAnchoredFiles()` enumerates every corpus
 * file that does, by three routes — a local binding, an IMPORTED name,
 * or a Rust zero-argument call — and classifies each as `derived`,
 * `unlinked` or `unclassified`. Everything below is a statement about
 * one of those buckets, so "is that all of them?" has an answer a
 * command can print (`docs-gate.mjs --census`) rather than an argument.
 *
 * 1. IT IS A REGEX SCAN over comment-stripped source, not a TypeScript
 *    or Rust parser. It knows string literals, line and block comments,
 *    and nothing about scope, aliasing or control flow. Two consequences
 *    the call arm makes concrete, stated rather than argued away: a
 *    callee is resolved BY NAME, so a local value shadowing an imported
 *    function is credited to the import (over-firing, the safe
 *    direction); and `functionDefs` is FIRST-WINS, so a name defined
 *    twice in one file — two `mod tests` blocks each with their own
 *    `fn repo_root()` — is read once (under-firing, which is exactly
 *    what the anchor census underneath it exists to catch).
 * 2. A DOCS PATH BEHIND A VALUE IT CANNOT FOLLOW is invisible as a path
 *    (T-084-s1). Three live instances, all measured:
 *      - `app/test/architecture-dogfood.test.ts` reads
 *        docs/architecture/graph.json through `read(GRAPH_PATH)`, where
 *        GRAPH_PATH is a constant exported by app/src.
 *      - `nputer-index/tests/arch.rs` reads the same file as
 *        `common::repo_root().join(GRAPH_REL_PATH)`.
 *      - `nputer-index/src/arch/registry.rs` reads
 *        docs/architecture/components as `root.join(REGISTRY_REL_DIR)`.
 *    CONSEQUENCE, stated exactly: the first two mean docs/architecture/
 *    graph.json is owed `npm test from tools/e2e/` and nothing else,
 *    though `npm test from app/` and `cargo test` both read it. That is
 *    the ONE path under docs/ another standing gate already owns — GRAPH
 *    REGEN regenerates it, `index --check` gates it, and it only ever
 *    changes because code changed — so it is a short answer with a
 *    sibling gate under it, not a silent one. The third changes nothing:
 *    the pair it would add is already produced by tests/arch.rs:192.
 * 3. A CALL HOP OF MORE THAN ONE STEP is not followed — `f(g(root))` is
 *    invisible — and a callee is only reachable when it is defined in
 *    the SAME FILE or imported by a RELATIVE specifier. A Rust callee in
 *    another file of the crate is not reachable: `use` paths name
 *    modules, not files, and this scanner does not resolve them.
 *    Measured consequence on this tree: NIL. The one cross-file Rust
 *    call that matters, `read_registry(&common::repo_root())` in
 *    tests/arch.rs, has a callee that forms its docs path behind a
 *    `const` (limit 2), so following it would still yield no prefix —
 *    which is also why registry.rs's own SAME-FILE call at :385, which
 *    this scanner DOES resolve, produces nothing.
 * 4. THE INVERSE CALL — a caller that supplies the PATH to a callee
 *    holding the root, `read(GRAPH_PATH)` — is not followed either. It
 *    is the JS half of limit 2 and has the same consequence.
 * 5. THE TRIPWIRE IS ONLY AS WIDE AS THE SITE PATTERNS. `unlinkedFiles()`
 *    reports a file that computes the root and forms a docs-first path
 *    it could not link, and it is a hard failure in the lane — the
 *    silent-miss direction is the only dangerous one. But a site it
 *    cannot SEE is one it cannot report: that is how the drill found the
 *    zero-argument-call base, and it is why the anchor arm now follows
 *    IMPORTS exactly as the site arm always did. A base that is a call
 *    WITH ARGUMENTS — `join(path.resolve(here), "docs")` — is still
 *    invisible to both.
 * 6. WHAT COVERS THE REST is not this scanner but arithmetic.
 *    `suitesOwedForAllOfDocs()` derives which suites are owed for EVERY
 *    path under docs/ (today: tools/e2e, because two lane specs walk the
 *    whole tree), so a missed reader THERE cannot shorten an answer.
 *    `unaccountedRootAnchors()` is what is left — root-anchored, not
 *    derived, in a suite that is not universally owed — and every member
 *    is argued by file in ROOT_ANCHOR_LEDGER, which the lane and the
 *    hand-run gate both assert equals the derived set. A new one is
 *    news; it cannot arrive quietly.
 * 7. IT SAYS NOTHING about whether a body ASSERTS on what it read. A
 *    reader that reads docs/ and ignores it still counts; over-firing is
 *    the safe direction here, exactly as it is for GRAPH REGEN.
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

/** A synthetic root for the call samples: no file, no I/O, and a base
 *  that resolves to it exactly the way a package-relative one does. */
const SAMPLE_ROOT = path.resolve(path.sep, "nputer-call-sample-root");

/** One fragment's context, with the sample root as its package dir so
 *  `resolve(".")` inside the fragment IS the root. Imports resolve to
 *  nothing on purpose: a fragment has no filesystem to hop into, and the
 *  hop across files is proved against the real tree instead. */
function sampleContext(stripped) {
  return {
    filePath: path.join(SAMPLE_ROOT, "pkg", "sample.ts"),
    fileDir: path.join(SAMPLE_ROOT, "pkg"),
    pkgDir: SAMPLE_ROOT,
    crateDir: undefined,
    stripped,
    functionDefs: functionDefs(stripped),
    bindings: bindings(stripped),
    resolveImport: () => null,
  };
}

/**
 * CALL SAMPLES — the second arm of the derivation, lexed exactly as a
 * file is. The negatives are the precision, and three of them are the
 * ways this arm could invent a reader rather than find one: an argument
 * that is NOT the repository root, a callee that spends its own binding
 * rather than the parameter it was handed, and a root handed to a
 * parameter the docs path does not use.
 */
export const CALL_SAMPLES = Object.freeze([
  // ── positives ──────────────────────────────────────────────────────
  // The measured shape: smoke.test.ts calling parseProject(repoRoot).
  {
    text:
      'const REPO = resolve(".");\n' +
      'function spend(root) { return join(root, "docs/tasks"); }\n' +
      "const r = spend(REPO);",
    prefixes: ["docs/tasks"],
  },
  // A DEFAULTED root and a call with NO ARGUMENT — every entry point in
  // this module has that signature, and the lane calls them empty.
  {
    text:
      'const REPO = resolve(".");\n' +
      'function readIt(root = REPO) { return join(root, "docs", "CONVENTIONS.md"); }\n' +
      "readIt();",
    prefixes: ["docs/CONVENTIONS.md"],
  },
  // Rust, same file: a `&`-borrowed root through a zero-argument fn.
  {
    text:
      "fn repo_root() -> PathBuf {\n" +
      '    resolve(".")\n' +
      "}\n" +
      "fn spend(root: &Path) -> PathBuf {\n" +
      '    root.join("docs/architecture/components")\n' +
      "}\n" +
      "let p = spend(&repo_root());",
    prefixes: ["docs/architecture/components"],
  },
  // ── negatives ──────────────────────────────────────────────────────
  // A root that is NOT this repository's: the fixture case, which is the
  // discriminator this whole derivation is built on.
  {
    text:
      'function spend(root) { return join(root, "docs/tasks"); }\n' +
      'const r = spend(fixture("valid-project"));',
    prefixes: [],
  },
  // The callee spends its OWN binding, not the parameter. The file is
  // still a docs reader by SITE; it must not also be one by CALL, or one
  // reader would be counted through every helper that touches it.
  {
    text:
      'const REPO = resolve(".");\n' +
      'function spend(x) { return join(REPO, "docs/tasks"); }\n' +
      "const r = spend(1);",
    prefixes: [],
  },
  // The root goes to a parameter the docs path does not use. Position is
  // load-bearing; an "any argument is the root" rule would fire here.
  {
    text:
      'const REPO = resolve(".");\n' +
      'function spend(a, root) { return join(root, "docs/tasks"); }\n' +
      "const r = spend(REPO);",
    prefixes: [],
  },
  // A callee this scanner cannot open is not guessed at.
  { text: 'const REPO = resolve(".");\nparseProject(REPO);', prefixes: [] },
]);

/** The call sample set, run, with the same evidence floor discipline. */
export function callSelftest() {
  const rows = [];
  for (const { text, prefixes } of CALL_SAMPLES) {
    const stripped = stripComments(text);
    const got = callSites(stripped, sampleContext(stripped), SAMPLE_ROOT).map((c) => c.prefix);
    rows.push([
      `call sample ${JSON.stringify(text)} -> ${JSON.stringify(got)}`,
      JSON.stringify(got) === JSON.stringify(prefixes),
    ]);
  }
  const positives = CALL_SAMPLES.filter((s) => s.prefixes.length > 0).length;
  const negatives = CALL_SAMPLES.length - positives;
  const rust = CALL_SAMPLES.filter((s) => s.text.includes("fn ") && s.prefixes.length > 0).length;
  const defaulted = CALL_SAMPLES.filter(
    (s) => /\(\s*[\w$]+\s*=\s*[\w$]/.test(s.text) && s.prefixes.length > 0,
  ).length;
  rows.push([`call samples include positives (${positives})`, positives > 0]);
  rows.push([`call samples include negatives (${negatives})`, negatives > 1]);
  rows.push([`call samples include a Rust positive (${rust})`, rust > 0]);
  rows.push([`call samples include a DEFAULTED root positive (${defaulted})`, defaulted > 0]);
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

/** Names this file imports from a RELATIVE first-party module — the
 *  candidate ROOT ANCHORS that live in another file. The site arm has
 *  always followed these (`ctx.resolveImport`); the anchor arm did not,
 *  which is the asymmetry `unlinkedFiles` used to be silent about. */
function importedNames(stripped) {
  const names = new Set();
  for (const m of stripped.matchAll(/import\s*\{([^}]*)\}\s*from\s*(['"`])([^'"`]+)\2/g)) {
    if (!m[3].startsWith(".")) continue;
    for (const raw of m[1].split(",")) {
      const name = raw.trim().split(/\s+as\s+/).pop()?.trim();
      if (name !== undefined && name !== "") names.add(name);
    }
  }
  return [...names].sort();
}

/** `export { a, b as c } from './x.js'` — the barrel hop. Returns the
 *  relative specifier that re-exports `name`, or null. `lib/parser`'s
 *  public surface is exactly this shape, so a call hop that stops at the
 *  barrel stops one file short of every parser entry point. */
function reExportSourceOf(stripped, name) {
  for (const m of stripped.matchAll(/export\s*\{([^}]*)\}\s*from\s*(['"`])([^'"`]+)\2/g)) {
    const names = m[1]
      .split(",")
      .map((s) => s.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim());
    if (names.includes(name) && m[3].startsWith(".")) return m[3];
  }
  return null;
}

const MODULE_SUFFIXES = ["", ".ts", ".tsx", ".mts", ".cts", ".mjs", ".js", "/index.ts", "/index.js"];

/**
 * Every absolute file a relative specifier could name, in try order.
 *
 * THE `.js` -> `.ts` REWRITE IS NOT COSMETIC. This repo's TypeScript is
 * NodeNext, so a first-party import carries the EMITTED extension:
 * `lib/parser/test/smoke.test.ts` writes `from '../src/index.js'` and
 * the file on disk is `index.ts`. Without the rewrite every specifier
 * in lib/parser/ resolves to nothing — and silence in the resolver is
 * silence in the answer, which is the defect this whole card is about.
 */
function moduleCandidates(fromDir, spec) {
  const bases = [spec];
  const emitted = /\.(js|mjs|cjs)$/.exec(spec);
  if (emitted !== null) bases.push(spec.slice(0, -emitted[0].length));
  const out = [];
  for (const base of bases) {
    for (const suffix of MODULE_SUFFIXES) out.push(path.resolve(fromDir, base + suffix));
  }
  return [...new Set(out)];
}

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

// ── one hop through a call ───────────────────────────────────────────
//
// THE DEFECT THIS SECTION EXISTS TO CLOSE. A DOCS SITE is a literal in
// the reading file, and a reader that hands the repository root to
// somebody ELSE spells no literal of its own. `lib/parser/test/smoke.test.ts`
// is the measured case: it calls `parseProject(repoRoot)` and
// `lib/parser/src/project.ts` spends that root on THREE docs paths —
// docs/tasks, docs/ROADMAP.md and docs/architecture/components. Before
// this hop the derivation attributed only docs/tasks and
// docs/tasks/rejected to the parser suite, so a one-line edit to
// docs/ROADMAP.md made the gate owe exactly `npm test` from tools/e2e
// (114/114, exit 0) while `npx vitest run` from lib/parser went 262/263
// exit 1 in a suite the answer never named. An integrator who obeyed the
// gate merged a red tree. The card's AC2 says a reader is "any body that
// RESOLVES a path under docs/ against the repository root" — resolving
// it through a callee is still resolving it.

/** Match a delimiter pair from an opening index; -1 if unbalanced. */
function matchDelim(text, open, openChar, closeChar) {
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i += 1) {
    const c = text[i];
    if (quote !== null) {
      if (c === "\\") i += 1;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === BACKTICK) {
      quote = c;
      continue;
    }
    if (c === openChar) depth += 1;
    else if (c === closeChar) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** A parameter's NAME and its DEFAULT expression, or a null name for a
 *  destructured or unnamed one — a destructured parameter has no single
 *  name to compare a root against, so it is a hole rather than a guess.
 *
 *  THE DEFAULT IS NOT DECORATION. `(root = repoRoot)` is the dominant
 *  first-party helper signature in this tree — every entry point in this
 *  very module has it — and such a helper is called with NO ARGUMENT, so
 *  a call hop that only reads arguments sees a call with nothing in it
 *  and stays silent about a body that reads docs/ on every run. */
function paramParts(text) {
  const eq = text.indexOf("=");
  const head = (eq === -1 ? text : text.slice(0, eq))
    .split(":")[0]
    .trim()
    .replace(/^(?:mut|ref)\s+/, "")
    .replace(/^&+\s*/, "");
  const fallback = eq === -1 ? null : text.slice(eq + 1).trim();
  return { name: /^[\w$]+$/.test(head) ? head : null, fallback };
}

/** The `{ … }` body that follows a signature, or null when there is none
 *  (a Rust trait signature, an overload). Bounded so a malformed file
 *  cannot make this walk the rest of the corpus. */
function bodyAfter(stripped, from) {
  for (let i = from; i < stripped.length && i < from + 400; i += 1) {
    const c = stripped[i];
    if (c === ";") return null;
    if (c === "{") {
      const close = matchDelim(stripped, i, "{", "}");
      return close === -1 ? null : stripped.slice(i + 1, close);
    }
  }
  return null;
}

/**
 * Named function definitions in one stripped source — parameter names
 * and body text, for `function f(…)`, Rust `fn f(…)` and the
 * `const f = (…) => {…}` arrow form. Deliberately NOT a parser: it knows
 * nothing about overloads, generics with braces in them, or scope, and a
 * shape it cannot read yields no definition rather than a wrong one.
 */
export function functionDefs(stripped) {
  const defs = new Map();
  const record = (name, paramText, bodyFrom) => {
    if (defs.has(name)) return;
    const body = bodyAfter(stripped, bodyFrom);
    if (body === null) return;
    const parts = splitArgs(paramText).map(paramParts);
    defs.set(name, {
      name,
      params: parts.map((p) => p.name),
      defaults: parts.map((p) => p.fallback),
      body,
    });
  };
  for (const m of stripped.matchAll(/(?:^|[^\w$.])(?:function|fn)\s+([\w$]+)\s*(?:<[^<>{}]*>)?\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const close = matchDelim(stripped, open, "(", ")");
    if (close === -1) continue;
    record(m[1], stripped.slice(open + 1, close), close + 1);
  }
  for (const m of stripped.matchAll(/(?:^|[^\w$.])(?:const|let|var)\s+([\w$]+)\s*(?::[^=;]*)?=\s*(?:async\s+)?\(/g)) {
    const open = m.index + m[0].length - 1;
    const close = matchDelim(stripped, open, "(", ")");
    if (close === -1) continue;
    const arrow = /^\s*(?::[^=]*)?=>/.exec(stripped.slice(close + 1));
    if (arrow === null) continue;
    record(m[1], stripped.slice(open + 1, close), close + 1 + arrow[0].length);
  }
  return defs;
}

/**
 * The docs prefixes a definition forms off each of its PARAMETERS —
 * `Map<parameter index, Set<prefix>>`. This is the half that makes the
 * hop safe in the direction that matters: `parseProject`'s own base is a
 * parameter, so `lib/parser/src/project.ts` is correctly NOT a reader
 * (its root is a caller's project, which may be anybody's tree), while
 * a CALLER that passes THIS repository's root is.
 */
function paramDocsPrefixes(def) {
  if (def.byParam !== undefined) return def.byParam;
  const out = new Map();
  const local = bindings(def.body);
  const index = new Map();
  def.params.forEach((p, i) => {
    if (p !== null && !index.has(p)) index.set(p, i);
  });
  for (const site of docsSites(def.body)) {
    let expr = site.base.trim();
    for (let hop = 0; hop < 6; hop += 1) {
      const ident = /^([\w$]+)$/.exec(expr);
      if (ident === null) break;
      const at = index.get(ident[1]);
      if (at !== undefined) {
        if (!out.has(at)) out.set(at, new Set());
        out.get(at).add(site.prefix === "" ? "docs" : site.prefix);
        break;
      }
      const next = local.get(ident[1]);
      if (next === undefined || next.trim() === expr) break;
      expr = next.trim();
    }
  }
  def.byParam = out;
  return out;
}

/** Module-level memo: the same barrel is walked by every test file in a
 *  package, and the enumeration walks the corpus twice. */
const calleeCache = new Map();

/**
 * Resolve a called name to a definition PLUS the module it lives in,
 * following relative imports and re-export barrels.
 *
 * The MODULE comes back with the definition because a defaulted root
 * (`root = repoRoot`) must be evaluated in the CALLEE's context, never
 * the caller's: `repoRoot` names a different directory in every file
 * that spells it, and evaluating it in the wrong one is how a
 * derivation invents a reader instead of finding one.
 *
 * Depth-limited; a cycle terminates at the limit.
 */
function resolveCalleeIn(fromDir, spec, name, root, depth) {
  if (depth > 4) return null;
  for (const abs of moduleCandidates(fromDir, spec)) {
    const key = `${abs}::${name}`;
    if (calleeCache.has(key)) return calleeCache.get(key);
    const text = readIfFile(abs);
    if (text === null) continue;
    const other = stripComments(text);
    const def = functionDefs(other).get(name);
    let found;
    if (def !== undefined) {
      found = { def, rel: path.relative(root, abs).split(path.sep).join("/"), stripped: other };
    } else {
      const next = reExportSourceOf(other, name);
      found = next === null ? null : resolveCalleeIn(path.dirname(abs), next, name, root, depth + 1);
    }
    calleeCache.set(key, found);
    return found;
  }
  return null;
}

/** Reserved words that are followed by `(` and are not calls. */
const NOT_A_CALL = new Set([
  "if", "for", "while", "switch", "catch", "return", "function", "fn", "match",
  "await", "typeof", "new", "throw", "do", "else", "yield", "in", "of", "assert",
]);

/**
 * CALL SITES: a call in this file that hands THIS repository's root to a
 * first-party function which spends it on a docs path. The prefixes are
 * attributed to the CALLING file, because that is the body a suite runs.
 *
 * One hop plus barrels, and no further: `f(g(root))` is not followed and
 * is named in WHAT IT CANNOT SEE rather than claimed.
 */
export function callSites(stripped, ctx, root) {
  const out = [];
  const lineOf = (index) => stripped.slice(0, index).split("\n").length;
  const resolved = new Map();
  for (const m of stripped.matchAll(/(?:^|[^\w$.])([\w$]+)\s*\(/g)) {
    const name = m[1];
    if (NOT_A_CALL.has(name)) continue;
    const open = m.index + m[0].length - 1;
    const close = matchDelim(stripped, open, "(", ")");
    if (close === -1) continue;
    // An EMPTY argument list is not skipped: `conventionsText()` is the
    // shape that reads docs/CONVENTIONS.md on every lane run, and a call
    // hop that only looks at arguments sees nothing in it.
    const argText = stripped.slice(open + 1, close);
    if (!resolved.has(name)) {
      const own = ctx.functionDefs.get(name);
      let hit = own === undefined ? null : { def: own, ctx };
      if (hit === null) {
        const spec = importSourceOf(ctx.stripped, name);
        if (spec !== null) hit = resolveCalleeIn(ctx.fileDir, spec, name, root, 0);
      }
      resolved.set(name, hit);
    }
    const hit = resolved.get(name);
    if (hit === null) continue;
    const byParam = paramDocsPrefixes(hit.def);
    if (byParam.size === 0) continue;
    const args = splitArgs(argText);
    for (const [at, prefixes] of byParam) {
      const arg = args[at];
      let where = ctx;
      let expr = arg === undefined ? undefined : arg.replace(/^&\s*/, "");
      if (expr === undefined) {
        // No argument at that position: the callee's DEFAULT is what runs.
        // It is the callee's own expression, so it is evaluated in the
        // callee's own context.
        expr = hit.def.defaults[at] ?? undefined;
        if (expr === undefined) continue;
        hit.ctx ??= contextFor(hit.rel, hit.stripped, root);
        where = hit.ctx;
      }
      if (evalBase(expr, where) !== root) continue;
      for (const prefix of [...prefixes].sort()) {
        out.push({ line: lineOf(m.index), callee: name, prefix });
      }
    }
  }
  return out.sort((a, b) => a.line - b.line || a.prefix.localeCompare(b.prefix));
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
    stripped,
    functionDefs: functionDefs(stripped),
    bindings: bindings(stripped),
  };
  ctx.resolveImport = (name) => {
    const spec = importSourceOf(stripped, name);
    if (spec !== null) {
      for (const abs of moduleCandidates(ctx.fileDir, spec)) {
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
    const ctx = contextFor(rel, stripped, root);
    const prefixes = new Set();
    /** How this file was linked, so the answer can say which arm found it
     *  rather than presenting a call hop as if it were a literal. */
    const via = new Set();
    for (const site of sites) {
      if (evalBase(site.base, ctx) !== root) continue;
      prefixes.add(site.prefix === "" ? "docs" : site.prefix);
      via.add("site");
    }
    const calls = callSites(stripped, ctx, root);
    for (const call of calls) {
      prefixes.add(call.prefix === "" ? "docs" : call.prefix);
      via.add(`call ${call.callee}()`);
    }
    if (prefixes.size === 0) continue;
    const suite = suiteFor(rel);
    readers.push({
      file: rel,
      suite: suite?.dir,
      command: suite?.command,
      prefixes: [...prefixes].sort(),
      via: [...via].sort(),
    });
  }
  return readers.sort((a, b) => a.file.localeCompare(b.file));
}

/**
 * THE ROOT-ANCHOR CENSUS — every corpus file that computes THIS
 * repository's root, classified. This is the ACCOUNT that the
 * "WHAT IT CANNOT SEE" section owes: the tripwire below can only report
 * a file it can SEE a docs site in, so a file that reaches docs/ purely
 * through a callee this scanner cannot open is invisible to BOTH. What
 * bounds that class is not an argument, it is this list: a file holding
 * the repository root is the only file that CAN read this repo's docs/,
 * so `unclassified` is the exact set of places the answer could still be
 * short — printed on every gate run rather than left in prose.
 *
 * `derived`      a docs reader, by literal site or by call hop.
 * `unlinked`     forms a docs-first path this scanner could not link —
 *                the hard failure `unlinkedFiles()` reports.
 * `unclassified` holds the root and forms no docs path this scan can
 *                see. Almost all are honest non-readers (they join the
 *                root with `app/`, `method/`, a fixture). The residual
 *                is the ones that reach docs/ some other way.
 */
export function rootAnchoredFiles(root = repoRoot) {
  const readers = new Map(docsReaders(root).map((r) => [r.file, r]));
  const out = [];
  for (const rel of sourceCorpus(root)) {
    const stripped = stripComments(readFileSync(path.join(root, rel), "utf8"));
    const ctx = contextFor(rel, stripped, root);
    const anchors = rootAnchors(ctx, root);
    if (anchors.length === 0) continue;
    const reader = readers.get(rel);
    const sites = docsSites(stripped);
    const linked = sites.filter((s) => evalBase(s.base, ctx) === root);
    out.push({
      file: rel,
      anchors,
      kind:
        reader !== undefined
          ? "derived"
          : sites.length > 0 && linked.length === 0
            ? "unlinked"
            : "unclassified",
      prefixes: reader?.prefixes ?? [],
    });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

/**
 * The names in one file that evaluate to THIS repository's root.
 *
 * BOTH ARMS, WHICH IS THE FIX. The site arm has always resolved a base
 * through `ctx.resolveImport` — that is how `shell-frame.spec.ts` gets
 * `repoRoot` out of `../preflight`, the dominant idiom in the very
 * package this scanner lives in. The ANCHOR arm read `ctx.bindings`
 * only, so an IMPORTED root was invisible to it, and a plant with an
 * imported anchor produced a site the scanner SAW and a report it did
 * NOT MAKE. A tripwire whose two arms follow different rules is vacuous
 * one step out of whatever shape it was last fixed for.
 */
function rootAnchors(ctx, root) {
  const names = new Set();
  for (const [name, expr] of ctx.bindings) {
    if (evalBase(expr, ctx) === root) names.add(name);
  }
  for (const name of importedNames(ctx.stripped)) {
    if (evalBase(name, ctx) === root) names.add(name);
  }
  // Rust names a root by CALLING it (`common::repo_root()`), and the call
  // is the only place the name appears — there is no import line to read.
  for (const m of ctx.stripped.matchAll(/([\w$]+(?:::[\w$]+)*)\s*\(\s*\)/g)) {
    if (names.has(m[1])) continue;
    if (evalBase(m[1], ctx) === root) names.add(m[1]);
  }
  return [...names].sort();
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
  return rootAnchoredFiles(root)
    .filter((f) => f.kind === "unlinked")
    .map((f) => {
      const stripped = stripComments(readFileSync(path.join(root, f.file), "utf8"));
      return {
        file: f.file,
        bases: [...new Set(docsSites(stripped).map((s) => s.base))].sort(),
        anchors: f.anchors,
      };
    });
}

/**
 * THE CENSUS, derived — the figures that used to live as digits in
 * docs/CONVENTIONS.md and went stale there.
 *
 * WHY THIS IS A FUNCTION AND NOT A SENTENCE. The bullet shipped
 * "exactly TWELVE of them, in nine files, are root-anchored" at a named
 * ref; the tree said ELEVEN at that ref, at the tip, and by hand — and
 * because nothing derived it, it was green and wrong, and had been
 * relayed into two more documents by the time anyone re-measured. A
 * figure a human transcribes is a figure that rots. This one is printed
 * by `docs-gate.mjs` on every run, so the current answer is never more
 * than a second away and never has a ref to be stale at.
 */
export function siteCensus(root = repoRoot) {
  let sites = 0;
  let anchoredSites = 0;
  const siteFiles = new Set();
  const anchoredFiles = new Set();
  for (const rel of sourceCorpus(root)) {
    const stripped = stripComments(readFileSync(path.join(root, rel), "utf8"));
    const found = docsSites(stripped);
    if (found.length === 0) continue;
    sites += found.length;
    siteFiles.add(rel);
    const ctx = contextFor(rel, stripped, root);
    for (const site of found) {
      if (evalBase(site.base, ctx) !== root) continue;
      anchoredSites += 1;
      anchoredFiles.add(rel);
    }
  }
  return {
    sites,
    siteFiles: siteFiles.size,
    anchoredSites,
    anchoredFiles: anchoredFiles.size,
  };
}

/**
 * The suites already owed for EVERY path under `docs/`, derived: a suite
 * holding a reader whose prefix is bare `docs` is owed whatever changes.
 * Today that is tools/e2e, because `shell-frame.spec.ts` and
 * `window-contract.spec.ts` each walk the whole tree.
 */
export function suitesOwedForAllOfDocs(readers) {
  return new Set(readers.filter((r) => r.prefixes.includes("docs")).map((r) => r.suite));
}

/**
 * THE ACKNOWLEDGEMENT LEDGER — and it is deliberately NOT a list of
 * readers, which is the defect T-058 and T-080 each spent a card on.
 *
 * A file that holds this repository's root is the only kind of file that
 * CAN read this repository's docs/. Most of them do not, and of the ones
 * that do, most sit in a suite that is already owed for every path under
 * docs/ (tools/e2e), so a miss there cannot change an answer. What is
 * left — a root-anchored file in a suite that is NOT universally owed,
 * which the derivation could not link — is the exact set of places the
 * gate's answer could still be short, and it is small enough to be
 * argued file by file. `unaccountedRootAnchors()` derives that set; this
 * ledger records the argument for each, and the spec asserts the two
 * agree EXACTLY. A new one cannot slip in silently, and an entry that
 * stops being true cannot linger.
 */
export const ROOT_ANCHOR_LEDGER = Object.freeze([
  Object.freeze({
    file: "app/src-tauri/crates/nputer-index/src/arch/registry.rs",
    reads: "docs/architecture/components",
    why:
      "A REAL READER THIS SCAN CANNOT SEE, and the sharpest entry here. " +
      "`reads_this_repos_live_registry_and_finds_the_known_shape` calls " +
      "`read_registry(&crate::testutil::repo_root())`, and read_registry forms its " +
      "path as `root.join(REGISTRY_REL_DIR)` — a docs path behind a `const &str` " +
      "(T-084-s1) reached through a Rust call hop. NO ANSWER MOVES: the pair it " +
      "would contribute (cargo test, docs/architecture/components) is already " +
      "contributed by tests/arch.rs:192, and the spec asserts that rather than " +
      "asserting it here.",
  }),
  Object.freeze({
    file: "app/src-tauri/crates/nputer-index/src/testutil.rs",
    reads: "",
    why: "Defines `repo_root()`. It forms no path under docs/ at all.",
  }),
  Object.freeze({
    file: "app/src-tauri/crates/nputer-index/tests/common/mod.rs",
    reads: "",
    why: "Defines `repo_root()` for the crate's integration tests. Forms no docs path.",
  }),
  Object.freeze({
    file: "app/src-tauri/crates/nputer-index/tests/perf.rs",
    reads: "",
    why:
      "`copy_repo_to` copies the whole tree, docs/ included — but its only caller " +
      "is `perf_cold_and_incremental_within_ceilings`, which is `#[ignore]`d " +
      "(\"perf harness: run on a release build\"), so bare `cargo test` never runs it.",
  }),
  Object.freeze({
    file: "app/src-tauri/crates/nputer-index/tests/self_graph.rs",
    reads: "",
    why:
      "Indexes the live repo off `common::repo_root()`. The one body that reads a " +
      "path under docs/ — `self_graph_is_current`, `root.join(GRAPH_REL_PATH)` — is " +
      "`#[ignore]`d. The two that DO run assert docs/ is ABSENT from the graph " +
      "(the root .nputerignore), which is the opposite of reading it.",
  }),
  Object.freeze({
    file: "app/test/genesis-derive.test.ts",
    reads: "",
    why: "Joins the root with `method/interview/plan-interview.md`. Not docs/.",
  }),
]);

/**
 * Root-anchored files the derivation could not link WHOSE SUITE IS NOT
 * ALREADY OWED for every path under docs/ — the residual that could
 * still shorten an answer. Derived; the ledger above is checked against
 * it, never the other way round.
 */
export function unaccountedRootAnchors(root = repoRoot) {
  const readers = docsReaders(root);
  const universal = suitesOwedForAllOfDocs(readers);
  return rootAnchoredFiles(root)
    .filter((f) => f.kind !== "derived")
    .filter((f) => !universal.has(suiteFor(f.file)?.dir))
    .map((f) => f.file);
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
