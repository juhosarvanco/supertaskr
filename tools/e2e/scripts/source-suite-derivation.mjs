/** Canonical source suite and static ownership derivation. This module reads
 * source/fixture trees only; it imports no configured record checker or reader.
 * gate-run reexports this same implementation for compatibility. */
import {spawnSync} from "node:child_process";
import {existsSync,readFileSync,readdirSync,realpathSync,lstatSync,statSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {docsGate,docsReaders,sourceCorpus,stripComments,trackedFiles} from "./docs-scan.mjs";
import {SOURCE_CI_SUITES as GRADED_SUITES} from "./source-ci-contract.mjs";
export const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..","..","..");
/** @typedef {import("./gate-run.mjs").Suite} Suite */
export const SCOPED_SUITE = "e2e";
// ── THE OWNING-SPEC DERIVATION (T-271) ───────────────────────────────
//
// EVERY FUNCTION IN THIS SECTION IS A FUNCTION OF ITS ARGUMENTS AND THE
// TREE, AND THE PURE ONE IS SEPARATED FROM THE READING ON PURPOSE.
// `owningSpecs` takes the graph and the reader map as DATA — no disk, no
// git, no clock — so a body can drive it over a fixture graph, and so
// that the next card to want a DIFFERENT set of changed paths (T-280
// wants the ones a diff names) supplies them without touching the rule.
// `specFiles` and `specReach` are the readings that feed it.

/** Playwright's `testDir` for this lane's suite, and what makes a file a
 *  spec in it. The directory is flat — every body lives directly in it —
 *  which is why the walk below is one `readdirSync`. */
export const SPEC_DIR = "tools/e2e/tests";
export const SPEC_SUFFIX = ".spec.ts";

/**
 * The extensions a specifier may be missing, in the order a resolver
 * tries them. `""` FIRST because most of this tree writes the extension
 * out (`../scripts/gate-run.mjs`), and the extensionless TypeScript form
 * (`../preflight`, `./git-fixture`) is what the rest is for.
 */
const IMPORT_EXTENSIONS = Object.freeze([
  "",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
  ".js",
  ".jsx",
]);

/**
 * Every STATIC import specifier in one source text, in source order.
 *
 * ── A LINE SCANNER AND NOT ONE REGEX, AND THE REASON IS THIS CORPUS ──
 * A spec file in this lane writes whole fixture programs as STRING
 * LITERALS, and those strings contain the word `import` followed by a
 * quoted specifier. `stripComments` keeps strings (deliberately — a docs
 * site inside one is still a site), so a regex that matched `import …
 * from "…"` anywhere would read a fixture's imports as this file's. Real
 * import statements begin a LINE; a quoted one is preceded by its own
 * quote. So the scanner is anchored at the start of a line, and the
 * continuation rule below is what lets it still read the multi-line
 * braced form this tree uses everywhere.
 *
 * DYNAMIC `import()` IS OUT OF SCOPE AND SAID SO. It is a call, not a
 * statement, and its argument need not be a literal; the corpus has none
 * today (`grep` for `import(` over tools/e2e and .claude/hooks finds
 * nothing), and if one arrives the edge is simply absent — which the
 * refusal at the other end turns into "the full leg is owed" rather than
 * into a short subset.
 *
 * @param {string} source
 * @returns {string[]}
 */
export function importSpecifiers(source) {
  const lines = stripComments(String(source ?? "")).split("\n");
  /** @type {string[]} */
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!/^[ \t]*(?:import|export)\b/.test(line)) continue;
    // THE CONTINUATION: keep appending lines until the statement can be
    // decided. A braced list spans lines; a terminated statement never
    // does. The cap is a guard against a file that opens a brace and
    // never closes it — a scanner that ran to EOF would report the whole
    // file's next specifier as this statement's.
    let stmt = line;
    let j = i;
    while (
      j + 1 < lines.length &&
      stmt.length < 4000 &&
      !/;\s*$/.test(stmt) &&
      !/\bfrom\s*(["'])[^"'\n]+\1/.test(stmt)
    ) {
      j += 1;
      stmt += `\n${lines[j] ?? ""}`;
    }
    i = j;
    const named = stmt.match(/\bfrom\s*(["'])([^"'\n]+)\1/);
    if (named?.[2] !== undefined) {
      out.push(named[2]);
      continue;
    }
    // The side-effect form, `import "…";`, which carries no `from`.
    const bare = stmt.match(/^[ \t]*import\s*(["'])([^"'\n]+)\1/);
    if (bare?.[2] !== undefined) out.push(bare[2]);
  }
  return out;
}

/**
 * @typedef {object} ResolvedImport
 * @property {"resolved"|"external"|"unresolved"} kind
 * @property {string | undefined} [rel] repo-relative POSIX path, when resolved.
 */

/**
 * Resolve one specifier against the file that wrote it.
 *
 * A BARE SPECIFIER IS `external` AND NOT AN ERROR: `@playwright/test`
 * and `node:fs` are somebody else's tree and no change in this repository
 * moves them. A RELATIVE specifier that resolves to no file is
 * `unresolved` and is REPORTED — a dropped edge makes the subset SHORT,
 * which is the one direction this feature may not fail in, so the caller
 * turns it into a refusal rather than into a smaller graph.
 *
 * @param {string} fromRel   the importing file, repo-relative, POSIX
 * @param {string} spec      the specifier exactly as written
 * @param {(rel: string) => boolean} isFile  does this repo-relative path exist as a file?
 * @returns {ResolvedImport}
 */
export function resolveImport(fromRel, spec, isFile) {
  if (!spec.startsWith(".")) return { kind: "external" };
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
  // A CLIMB THAT LEAVES THE REPOSITORY is external, not unresolved: there
  // is nothing here to grade and nothing here that could have moved it.
  if (base === ".." || base.startsWith("../")) return { kind: "external" };
  /** @type {string[]} */
  const candidates = [];
  for (const ext of IMPORT_EXTENSIONS) candidates.push(`${base}${ext}`);
  // NodeNext's `.js` for a `.ts` source — the spelling TypeScript asks
  // for when a module resolves at runtime and is authored in TS.
  const swapped = base.replace(/\.(m|c)?js$/, (_m, p1) => `.${p1 ?? ""}ts`);
  if (swapped !== base) candidates.push(swapped, `${swapped}x`);
  for (const ext of IMPORT_EXTENSIONS) candidates.push(`${base}/index${ext}`);
  for (const c of candidates) {
    if (c !== "" && isFile(c)) return { kind: "resolved", rel: c };
  }
  return { kind: "unresolved" };
}

/**
 * The spec files this lane grades, repo-relative and sorted.
 * @param {string} [root]
 * @returns {string[]}
 */
export function specFiles(root = repoRoot) {
  const dir = path.join(root, SPEC_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(SPEC_SUFFIX))
    .map((n) => `${SPEC_DIR}/${n}`)
    .sort();
}

/**
 * @typedef {object} SpecReach
 * @property {Record<string, string[]>} reach  spec -> every repo file it
 *   reads through static imports, ITSELF INCLUDED. Sorted.
 * @property {string[]} unresolved  `<file> -> <specifier>` for every
 *   relative import this walk could not land on a file.
 */

/**
 * Walk the static import graph out from each spec.
 *
 * ITSELF INCLUDED, deliberately: "which spec owns tests/gate-run.spec.ts"
 * has an answer, and it is that file. Treating the roots as outside their
 * own reach would have made a spec the only kind of file that cannot own
 * a change to itself.
 *
 * @param {string} [root]
 * @param {string[]} [specs]
 * @returns {SpecReach}
 */
export function specReach(root = repoRoot, specs = specFiles(root)) {
  /** @param {string} rel @returns {boolean} */
  const isFile = (rel) => {
    try {
      return statSync(path.join(root, rel)).isFile();
    } catch {
      return false;
    }
  };
  /** @type {Record<string, string[]>} */
  const reach = {};
  /** @type {Set<string>} */
  const unresolved = new Set();
  /** @type {Map<string, string[]>} */
  const edges = new Map();
  /** @param {string} rel @returns {string[]} */
  const importsOf = (rel) => {
    const cached = edges.get(rel);
    if (cached !== undefined) return cached;
    /** @type {string[]} */
    const out = [];
    let src = "";
    try {
      src = readFileSync(path.join(root, rel), "utf8");
    } catch {
      edges.set(rel, out);
      return out;
    }
    for (const spec of importSpecifiers(src)) {
      const r = resolveImport(rel, spec, isFile);
      if (r.kind === "resolved" && r.rel !== undefined) out.push(r.rel);
      else if (r.kind === "unresolved") unresolved.add(`${rel} -> ${spec}`);
    }
    edges.set(rel, out);
    return out;
  };
  for (const spec of specs) {
    /** @type {Set<string>} */
    const seen = new Set([spec]);
    const queue = [spec];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (cur === undefined) break;
      for (const next of importsOf(cur)) {
        if (seen.has(next)) continue;
        seen.add(next);
        queue.push(next);
      }
    }
    reach[spec] = [...seen].sort();
  }
  return { reach, unresolved: [...unresolved].sort() };
}

/**
 * Normalise one changed path as a caller may have typed it: a `./`
 * prefix, a trailing slash, a Windows separator, an absolute path inside
 * this checkout. Anything that still escapes the repository is returned
 * unchanged and will be UNPLACEABLE, which is the honest end.
 * @param {string} raw
 * @param {string} [root]
 * @returns {string}
 */
export function normaliseChanged(raw, root = repoRoot) {
  let p = String(raw ?? "").trim().split(path.sep).join("/");
  if (p.startsWith(`${root.split(path.sep).join("/")}/`)) {
    p = p.slice(root.split(path.sep).join("/").length + 1);
  }
  p = p.replace(/^\.\//, "").replace(/\/+$/, "");
  return path.posix.normalize(p);
}

/**
 * @typedef {object} OwningDerivation
 * @property {string[]} specs        the subset to grade, sorted.
 * @property {{ path: string, specs: string[], via: string[] }[]} byPath
 * @property {{ path: string, why: string }[]} unplaceable
 */

/**
 * THE RULE, AND IT IS A PURE FUNCTION OF ITS THREE NAMED INPUTS.
 *
 * A spec OWNS a changed path when the path IS that spec, when the spec
 * reaches the path through static imports, or — for a path under docs/ —
 * when the DOCS GATE'S OWN reader map says some file reads it and this
 * spec is that file or reaches it. The docs arm composes with the import
 * arm rather than duplicating it: `docs/CONVENTIONS.md` is read by
 * `tools/e2e/scripts/cli.mjs`, which is not a spec, and the spec that
 * owns THAT is the one that imports it.
 *
 * NOTHING HERE READS A SPEC'S NAME. `gate-run.spec.ts` owning
 * `gate-run.mjs` is a fact about an import statement, and the two files
 * agreeing on a stem is a coincidence this rule must not lean on:
 * `helpers.ts` and `git-fixture.ts` are owned by a dozen specs that share
 * no stem with them at all.
 *
 * @param {object} input
 * @param {string[]} input.changed  repo-relative paths the lane changed
 * @param {Record<string, string[]>} input.reach  from `specReach`
 * @param {Record<string, string[]>} [input.docsReadersByPath]  docs path ->
 *   the repo-relative files the DOCS GATE's reader map says read it
 * @param {Record<string, string[]>} [input.settingsReadersByPath]  runtime
 *   settings path -> the repo-relative files that read it (T-330). It
 *   composes with the import arm the same way the docs map does, and for
 *   the same reason: the file that opens the runtime template is a
 *   SCRIPT, and the spec that owns that is the one importing it.
 * @param {Record<string, string[]>} [input.generatedByPath]  changed source
 *   path -> the GENERATED files a spec may reach on its behalf, from
 *   `generatedEntries` (T-335). This arm does not compose through a
 *   reader the way the two above do, and the asymmetry is the point: the
 *   spec's edge already lands on the generated file, so what was missing
 *   was never a reader but the fact that a changed SOURCE stands behind
 *   that file. Nothing here rewrites a path — the standing-behind is the
 *   owning package's own build configuration, read once by the caller.
 * @param {Record<string, string>} [input.generatedVia]  generated file ->
 *   the sentence naming the configuration that produces it, so a
 *   selection can say which declaration it came from.
 * @returns {OwningDerivation}
 */
export function owningSpecs({
  changed,
  reach,
  docsReadersByPath = {},
  settingsReadersByPath = {},
  generatedByPath = {},
  generatedVia = {},
}) {
  const specs = Object.keys(reach).sort();
  /** @type {Set<string>} */
  const owed = new Set();
  /** @type {{ path: string, specs: string[], via: string[] }[]} */
  const byPath = [];
  /** @type {{ path: string, why: string }[]} */
  const unplaceable = [];
  for (const p of changed) {
    /** @type {Map<string, string>} */
    const hits = new Map();
    for (const s of specs) {
      if (s === p) hits.set(s, "the changed path IS this spec");
      else if ((reach[s] ?? []).includes(p)) hits.set(s, "imports it, directly or transitively");
    }
    for (const reader of docsReadersByPath[p] ?? []) {
      for (const s of specs) {
        if (hits.has(s)) continue;
        if (s === reader) hits.set(s, `is the docs-walk body that reads ${p}`);
        else if ((reach[s] ?? []).includes(reader)) {
          hits.set(s, `imports ${reader}, which the docs gate says reads ${p}`);
        }
      }
    }
    for (const reader of settingsReadersByPath[p] ?? []) {
      for (const s of specs) {
        if (hits.has(s)) continue;
        if (s === reader) hits.set(s, `is the body that reads the configuration at ${p}`);
        else if ((reach[s] ?? []).includes(reader)) {
          hits.set(s, `imports ${reader}, which reads the configuration at ${p}`);
        }
      }
    }
    for (const generated of generatedByPath[p] ?? []) {
      for (const s of specs) {
        if (hits.has(s)) continue;
        if (!(reach[s] ?? []).includes(generated)) continue;
        hits.set(
          s,
          `imports ${generated}, and ${generatedVia[generated] ?? "its owning package builds that from this path's source root"}`,
        );
      }
    }
    if (hits.size === 0) {
      unplaceable.push({
        path: p,
        why: p.startsWith("docs/")
          ? "the docs gate's reader map names no spec in this lane for it"
          : underSettings(p)
            ? "the runtime settings reader map names no spec in this lane for it"
            : "no spec in this lane reaches it through a static import, and it is not a spec",
      });
      continue;
    }
    const owning = [...hits.keys()].sort();
    for (const s of owning) owed.add(s);
    byPath.push({ path: p, specs: owning, via: owning.map((s) => `${s} — ${hits.get(s)}`) });
  }
  return { specs: [...owed].sort(), byPath, unplaceable };
}

/**
 * The derivation as the CLI runs it: the readings taken, then the rule.
 * Kept separate from `owningSpecs` so the rule stays testable with no
 * tree at all, and so this function is the ONE place a reading happens.
 *
 * THE DOCS SCAN IS PAID FOR ONLY WHEN A DOCS PATH MOVED. It walks the
 * whole source corpus; a lane changing one script should not pay for it.
 *
 * @param {string[]} rawChanged
 * @param {string} [root]
 * @param {Readonly<Record<string,string>>} [roots]
 * @returns {OwningDerivation & { changed: string[], unresolved: string[], generatedUnplaceable: { path: string, why: string }[] }}
 */
export function deriveOwning(rawChanged, root = repoRoot, roots = PACKAGE_ROOTS) {
  const changed = rawChanged.map((p) => normaliseChanged(p, root));
  const { reach, unresolved } = specReach(root);
  /** @type {Record<string, string[]>} */
  const docsReadersByPath = {};
  if (changed.some((p) => p === "docs" || p.startsWith("docs/"))) {
    const gate = docsGate(changed, docsReaders(root));
    for (const entry of gate.byPath) docsReadersByPath[entry.path] = entry.readers;
  }
  /** @type {Record<string, string[]>} */
  const settingsReadersByPath = {};
  const settingsPaths = changed.filter((p) => underSettings(p));
  if (settingsPaths.length > 0) {
    Object.assign(settingsReadersByPath, settingsReaders(settingsPaths, root).byPath);
  }
  const generated = generatedSources(changed, reach, root, roots);
  return {
    changed,
    unresolved,
    // T-335: reported rather than refused HERE, because this function is
    // the rule's reader and `mainOwning` is the arm that owes a refusal.
    generatedUnplaceable: generated.unplaceable,
    ...owningSpecs({
      changed,
      reach,
      docsReadersByPath,
      settingsReadersByPath,
      generatedByPath: generated.byPath,
      generatedVia: generated.via,
    }),
  };
}

// ── THE RUNTIME SETTINGS THIS PROJECT IS CONFIGURED BY (T-330) ───────
//
// `method/runtime/` holds the runtime template and the schema beside it:
// the file that says which model each role is dispatched on, which
// process profile this project runs, and — since T-319 — whether an
// owner's dispatch grant is recorded. It is CONFIGURATION: not code, and
// not a document. It lies under no package root, no spec reaches it
// through a static import, and the DOCS GATE's reader map does not cover
// it because it is not under `docs/`. All three arms of the derivation
// below answer "I cannot place this", so the whole battery is owed for a
// two-line records change — the conservative answer for an unplaceable
// input, and NOT a finding that every body reads the file. Measured at
// T-330: recording the owner's approved dispatch grant, forty lines of
// configuration, owed four legs.
//
// THE CONSUMERS ARE DERIVED FROM THE TREE AND NEVER LISTED. A file reads
// a runtime settings path when its comment-stripped source SPELLS that
// path — as one literal, or as the segments a `path.join` is given — or
// when it names an identifier some speller BINDS to exactly that path.
// THE SECOND ARM IS NOT AN EXTRA: the path this project's arm actually
// opens is `RUNTIME_TEMPLATE`, exported by the parser library's settings
// reader, so a literal-only scan finds the library and misses every one
// of the arm's own readers and every body that drives them. Both arms
// are TEXTUAL and deliberately generous — this derivation may be wrong
// by owing too MUCH and must never be wrong by owing too little, so a
// file that merely mentions the name counts as a reader.
//
// AND A SETTINGS PATH NOTHING READS IS UNPLACEABLE, which is where this
// arm is deliberately less confident than the docs arm beside it. There,
// "no code suite reads this document" is a POSITIVE answer over a map
// derived from the whole source corpus. Here, a configuration file this
// scan finds no reader for is a file whose consumers the scan did not
// find: the arms are textual, and a reader that computed its path some
// third way would look exactly like a file nobody reads. So it falls
// through to the whole battery, naming the path it could not place.

/** The directory this project's runtime configuration lives in. */
export const SETTINGS_DIR = "method/runtime";

/**
 * Is this repo-relative path one of the runtime settings files?
 * @param {string} rel
 * @returns {boolean}
 */
export function underSettings(rel) {
  return rel === SETTINGS_DIR || rel.startsWith(`${SETTINGS_DIR}/`);
}

/**
 * THE SITE FORM of one settings path: its segments in order, with the
 * quotes, commas, dots and slashes a source file may put between them,
 * so that `"method/runtime/x.yaml"` and `path.join(root, "method",
 * "runtime", "x.yaml")` are ONE pattern rather than two rules that can
 * disagree. Every segment is escaped — a `.` in a filename is a dot and
 * not a wildcard.
 * @param {string} rel
 * @returns {RegExp}
 */
export function settingsSiteRe(rel) {
  const parts = rel.split("/").map((seg) => seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(parts.join("[\"'`\\s,./]+"));
}

/** A `const NAME = "literal"` binding, in either dialect this tree writes
 *  (`export const` in TS/JS, `static NAME: &str` in Rust is matched by the
 *  same shape once `static` is allowed as the keyword). */
const SETTINGS_BINDING_RE =
  /\b(?:pub\s+)?(?:export\s+)?(?:const|let|var|static)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]*)?=\s*["'`]([^"'`\n]+)["'`]/g;

/**
 * @typedef {object} SettingsReaderMap
 * @property {string[]} asked  every settings path this map was ASKED
 *   about. A path missing from it was never put to the scan, and an
 *   empty reader list for it would be an unasked question in an answer's
 *   costume — the same distinction the DOCS GATE's map draws.
 * @property {Record<string, string[]>} byPath  settings path -> the
 *   repo-relative source files that read it, sorted.
 * @property {Record<string, string[]>} constants  settings path -> the
 *   identifiers a speller binds to it, sorted. Reported rather than kept
 *   private so that an answer can be checked against the tree.
 */

/**
 * THE RULE, AND IT IS A PURE FUNCTION OF THE CORPUS IT IS GIVEN.
 *
 * @param {string[]} paths  the settings paths to place, repo-relative
 * @param {Record<string, string>} corpus  source file -> its
 *   comment-stripped text. Comments are stripped because a rule that
 *   counted a mention in prose would make every file that TALKS about
 *   the template a reader of it.
 * @returns {SettingsReaderMap}
 */
export function settingsReadersIn(paths, corpus) {
  const files = Object.keys(corpus).sort();
  /** @type {Record<string, string[]>} */
  const byPath = {};
  /** @type {Record<string, string[]>} */
  const constants = {};
  for (const rel of paths) {
    const site = settingsSiteRe(rel);
    const spellers = files.filter((f) => site.test(corpus[f] ?? ""));
    /** @type {Set<string>} */
    const names = new Set();
    for (const f of spellers) {
      for (const m of (corpus[f] ?? "").matchAll(SETTINGS_BINDING_RE)) {
        if (m[2] === rel && m[1] !== undefined) names.add(m[1]);
      }
    }
    /** @type {Set<string>} */
    const readers = new Set(spellers);
    for (const name of names) {
      const named = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      for (const f of files) if (named.test(corpus[f] ?? "")) readers.add(f);
    }
    byPath[rel] = [...readers].sort();
    constants[rel] = [...names].sort();
  }
  return { asked: [...new Set(paths)].sort(), byPath, constants };
}

/**
 * The rule as the CLI runs it: the reading taken, then the rule. Kept
 * separate so the rule stays testable with no tree at all, and so this
 * function is the ONE place a reading happens.
 *
 * THE WALK IS PAID FOR ONLY WHEN A SETTINGS PATH MOVED, which is why
 * every caller guards it — it reads the whole source corpus, and a lane
 * changing one script should not pay for it.
 *
 * @param {string[]} paths
 * @param {string} [root]
 * @returns {SettingsReaderMap}
 */
export function settingsReaders(paths, root = repoRoot) {
  /** @type {Record<string, string>} */
  const corpus = {};
  for (const rel of sourceCorpus(root)) {
    try {
      corpus[rel] = stripComments(readFileSync(path.join(root, rel), "utf8"));
    } catch {
      // A TRACKED FILE THIS WALK CANNOT READ CONTRIBUTES NO EDGE and is
      // not an error: a path deleted in the working tree is still tracked.
      corpus[rel] = "";
    }
  }
  return settingsReadersIn(paths, corpus);
}

// ── THE OWED SET (T-280) ─────────────────────────────────────────────
//
// ── WHAT THIS IS, AND HOW IT DIFFERS FROM `--owning` ABOVE ───────────
// `--owning` takes a path list a SEAT typed and answers one question:
// which spec files own it. It is the executor's iteration form, its
// verdict wears `SCOPED-` so it can never mint a push token, and it
// grades the end-to-end leg and nothing else.
//
// THIS derives its own path list FROM A RANGE — the push range, or a
// bench's `base..tip` — and answers the whole question: which of the
// GRADED SUITES that range owes, and for the end-to-end leg, which SPEC
// FILES. Nothing about the set is typed by anybody, which is what makes
// a verdict over it mintable: the push guard re-derives the same set
// from the same range with this same function and requires the token to
// cover it.
//
// ── FIVE ARMS, COMPOSED, AND NOT ONE OF THEM IS A LIST ───────────────
//   THE PACKAGE ROOTS come off the registry's own `cwd` fields
//     (`PACKAGE_ROOTS`), so adding a graded suite moves this derivation
//     with it and a hand-kept copy cannot drift from the runner.
//   THE IMPORT GRAPH is T-271's, unchanged and CALLED rather than
//     re-implemented: `owningSpecs` over `specReach`.
//   THE DOCS GATE'S READER MAP is `docs-scan.mjs`'s, likewise called.
//     A docs path's readers are FILES; each file is placed through the
//     package roots, which is how a document read by the parser's census
//     owes the parser suite without anybody writing that down.
//   THE RUNTIME SETTINGS READER MAP is `settingsReaders` below, added by
//     T-330 for the one input none of the three above can place: this
//     project's own configuration. Its readers are FILES too, and are
//     placed through the same package roots.
//   THE GENERATED-ENTRY RELATIONSHIP is `generatedSources` below, added
//     by T-335 for the edge the import arm reaches and no changed path
//     can ever be: a spec imports a package's BUILT entry, and git does
//     not track it. It is read off the owning package's own build
//     configuration, so it is a DECLARATION rather than a rewritten
//     path, and a generated file no configuration places is named and
//     fails closed.
//
// ── AND THE `file:` EDGE, WHICH THE PACKAGE ROOTS ALONE WOULD MISS ───
// `app/package.json` depends on the parser at `file:../lib/parser`, so a
// change under `lib/parser/` can red the APP suite while lying under the
// parser's root alone. The edge is READ from the manifests
// (`packageDependents`) rather than asserted here, and closed
// transitively, so a second `file:` dependency added tomorrow is carried
// by this function on the day it lands.
//
// ── FAIL CLOSED, AND THE ONLY DIRECTION THIS MAY BE WRONG IN ─────────
// A path under no package root that no spec reaches and that the docs
// gate cannot place makes the owed set THE WHOLE BATTERY, and the reason
// travels with it into the token. So does an unresolvable import edge,
// which would make the spec subset SHORT. This derivation can be wrong
// by owing too MUCH; it must never be wrong by owing too little.
//
// A DOCS PATH NOTHING READS IS PLACED, NOT UNPLACEABLE, and that is the
// one asymmetry against `--owning` worth stating. There, the question is
// "which spec owns this" and "none" is an inability. Here the question is
// "what does this range owe" and the docs gate answering "no code suite
// reads it" is a POSITIVE answer over a map derived from the whole source
// corpus — it is the instrument the DOCS GATE itself is made of. Half
// the batteries this card was written about were pushes of exactly those
// paths.

/**
 * The package root each graded suite owns, DERIVED from the registry's
 * own `cwd` and never written down a second time.
 * @type {Readonly<Record<string, string>>}
 */
export const PACKAGE_ROOTS = Object.freeze(
  Object.fromEntries(Object.values(GRADED_SUITES).map((s) => [s.id, s.cwd])),
);

/** Every graded suite, which is what "the whole battery" means here. */
export const ALL_SUITES = Object.freeze(Object.keys(GRADED_SUITES).sort());

/**
 * The suite whose package root contains this path — the LONGEST one,
 * because `app/src-tauri` lies inside `app` and a Rust file is the rust
 * suite's, not the app suite's.
 * @param {string} rel
 * @param {Readonly<Record<string, string>>} [roots]
 * @returns {string | undefined}
 */
export function suiteOfPath(rel, roots = PACKAGE_ROOTS) {
  /** @type {string | undefined} */
  let best;
  for (const [id, dir] of Object.entries(roots)) {
    if (dir !== "." && rel !== dir && !rel.startsWith(`${dir}/`)) continue;
    if (best === undefined || dir.length > (roots[best] ?? "").length) best = id;
  }
  return best;
}

/**
 * suite -> every suite whose package DEPENDS on it, read off the
 * manifests' `file:` specifiers and closed transitively.
 *
 * A MANIFEST THIS CANNOT READ CONTRIBUTES NO EDGE AND IS NOT AN ERROR:
 * `app/src-tauri` is a Cargo workspace with no `package.json`, and both
 * its crates lie under one root, so there is no cross-root edge for this
 * function to find there.
 *
 * @param {string} [root]
 * @param {Readonly<Record<string, string>>} [roots]
 * @returns {Record<string, string[]>}
 */
export function packageDependents(root = repoRoot, roots = PACKAGE_ROOTS) {
  /** @type {Record<string, Set<string>>} */
  const out = {};
  for (const id of Object.keys(roots)) out[id] = new Set();
  for (const [id, dir] of Object.entries(roots)) {
    /** @type {unknown} */
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(path.join(root, dir, "package.json"), "utf8"));
    } catch {
      continue;
    }
    const obj = /** @type {Record<string, unknown>} */ (pkg ?? {});
    /** @type {Record<string, unknown>} */
    const deps = {
      .../** @type {Record<string, unknown>} */ (obj["dependencies"] ?? {}),
      .../** @type {Record<string, unknown>} */ (obj["devDependencies"] ?? {}),
    };
    for (const spec of Object.values(deps)) {
      if (typeof spec !== "string" || !spec.startsWith("file:")) continue;
      const target = path.posix.normalize(path.posix.join(dir, spec.slice("file:".length)));
      for (const [otherId, otherDir] of Object.entries(roots)) {
        if (otherDir === target && otherId !== id) {
          /** @type {Set<string>} */ (out[otherId]).add(id);
        }
      }
    }
  }
  // TRANSITIVE CLOSURE. One edge exists today; a chain of two would make
  // a single-hop reading silently short, and the fixed point is cheap.
  for (let moved = true; moved; ) {
    moved = false;
    for (const id of Object.keys(out)) {
      const here = /** @type {Set<string>} */ (out[id]);
      for (const dep of [...here]) {
        for (const further of out[dep] ?? new Set()) {
          if (further !== id && !here.has(further)) {
            here.add(further);
            moved = true;
          }
        }
      }
    }
  }
  return Object.fromEntries(Object.entries(out).map(([id, s]) => [id, [...s].sort()]));
}

// ── THE GENERATED ENTRY AND ITS OWNING SOURCES (T-335) ────────────────
//
// ── THE DEAD EDGE THIS ARM EXISTS FOR ────────────────────────────────
// Two specs import `lib/parser/dist/pure.js`, an edge T-317 added, and
// `lib/parser/.gitignore` excludes `dist/`. The walk above REACHES that
// file and every generated file it imports, so the graph is not missing
// the edge — it is missing the only thing that could ever use it. A
// range's changed paths come from `git diff --name-only`, and git does
// not name a file it does not track, so no changed path can ever BE one
// of those generated files. The edge could contribute a selection
// exactly never: measured at `f54e409f` with the parser built, a range
// whose only changed path was `lib/parser/src/pure.ts` owed `app` and
// `parser` with the end-to-end leg narrowed to ZERO spec files, and
// neither importer was among them. Until T-331 narrowed the leg the
// whole battery ran anyway and this cost nothing.
//
// ── WHAT IS READ, AND WHY IT IS NOT A REWRITTEN PATH ─────────────────
// The relationship between `lib/parser/dist/pure.js` and the sources
// that produce it is DECLARED, by the package that owns both: its own
// manifest's `build` script names a TypeScript project, and that project
// names `rootDir` and `outDir`. So this arm reads the owning package's
// build configuration — the `extends` chain included, because this
// repository writes the emit options in a second file that inherits the
// first — and spells neither `dist` nor `src` itself. A package that
// moves where it builds to moves this derivation with it on the day it
// lands, and a package that builds some other way contributes no
// relationship rather than a wrong one.
//
// ── THE COUPLING IS THE PACKAGE'S, NOT ONE FILE'S ────────────────────
// `rootDir` -> `outDir` is a DIRECTORY relationship and this arm keeps
// it one: any source under the root couples to every generated file
// under the output root that the import graph reaches. Mapping
// `dist/pure.js` back to `src/pure.ts` alone would be more precise and
// would be wrong in the one direction this derivation may not be wrong
// in — `src/index.ts` is an entry nothing in this lane imports, a
// re-export moves an emit its own filename does not name, and a
// per-file map would answer "no spec" for a source change that really
// can move a spec's subject.
//
// ── AND WHERE THE RELATIONSHIP CANNOT BE READ ────────────────────────
// A generated file in the graph that no package's build configuration
// places is reported BY NAME and the caller turns it into the whole
// battery — the same shape, and the same reason, as an import edge that
// lands nowhere. That is not a placeholder waiting to be optimised
// away: an unreadable relationship means this derivation cannot say
// which sources move that file, and the only honest answer to "which
// suites does this range owe" is then all of them.
//
// ── WHY THE T-330 SETTINGS CONSUMER MAP DOES NOT CARRY THIS ──────────
// `settingsReadersIn` above answers "which files READ this path", over a
// textual corpus, by path spellings and the identifiers bound to them.
// This arm answers "which sources PRODUCE this path", and the answer is
// not textual at all: no source under `lib/parser/src/` mentions
// `lib/parser/dist/pure.js`, and the file that does mention it is the
// spec doing the importing — the consumer, not the producer. Pointed at
// a generated entry the settings scan would return its IMPORTERS, which
// this derivation already has from the import graph, and never the
// sources. The two are different relations over the same tree, so they
// are two arms rather than one abstraction.

/** The manifest script whose command declares how a package is built. */
export const BUILD_SCRIPT = "build";

/**
 * Every TypeScript project a build script runs, in the order it runs
 * them. A bare `tsc` contributes `tsconfig.json`, which is the file it
 * would read; `-p`/`--project` names another.
 *
 * THE SPLIT IS ON THE SHELL'S OWN SEPARATORS because this repository
 * writes `tsc && tsc -p tsconfig.test.json && vite build`, and a scanner
 * that read that as one command would hand the second project's flags to
 * the first. A segment with no `tsc` in it contributes nothing — a
 * bundler's output is not a relationship this function can read, and
 * saying so is what makes the fail-closed arm below fire honestly.
 *
 * @param {unknown} script
 * @returns {string[]}
 */
export function buildConfigsIn(script) {
  /** @type {string[]} */
  const out = [];
  for (const part of String(script ?? "").split(/&&|\|\||;/)) {
    const words = part.trim().split(/\s+/).filter((w) => w !== "");
    const at = words.findIndex((w) => w === "tsc" || w.endsWith("/tsc"));
    if (at < 0) continue;
    let file = "tsconfig.json";
    const rest = words.slice(at + 1);
    for (let i = 0; i < rest.length; i += 1) {
      const w = rest[i] ?? "";
      if ((w === "-p" || w === "--project") && rest[i + 1] !== undefined) {
        file = /** @type {string} */ (rest[i + 1]);
        break;
      }
      const inline = /^--project=(.+)$/.exec(w);
      if (inline?.[1] !== undefined) {
        file = inline[1];
        break;
      }
    }
    if (!out.includes(file)) out.push(file);
  }
  return out;
}

/**
 * @typedef {object} TsconfigReading
 * @property {Record<string, unknown>} compilerOptions  merged along the
 *   `extends` chain, nearest file winning.
 * @property {unknown} include  the nearest `include` found, likewise.
 * @property {string | undefined} [problem]  why nothing could be read.
 */

/**
 * One TypeScript project, with its `extends` chain closed.
 *
 * TOLERANT OF THE DIALECT tsconfig IS ACTUALLY WRITTEN IN: comments and
 * a trailing comma are legal there and fatal to `JSON.parse`, and a
 * derivation that refused this repository's own configuration would fail
 * closed for a reason about punctuation. A BARE `extends` SPECIFIER
 * (a package, not a relative path) is left unfollowed and is not an
 * error on its own — what matters is whether an emit relationship comes
 * out at the end, and the caller says so if none does.
 *
 * @param {string} root
 * @param {string} dir   the directory `file` is spelled relative to, repo-relative
 * @param {string} file
 * @param {Set<string>} [seen]
 * @returns {TsconfigReading}
 */
export function resolveTsconfig(root, dir, file, seen = new Set()) {
  const withJson = file.endsWith(".json") ? file : `${file}.json`;
  const rel = path.posix.normalize(path.posix.join(dir, withJson));
  // T-335 correction 3. CONTAINED TO THE REPOSITORY, because every
  // spelling that reaches here — a `-p` flag in a manifest's build
  // script, an `extends` specifier — is REPOSITORY CONTENT, and a range
  // may come from a branch nobody has reviewed. Without this an
  // `extends` of "../../../../../etc/…" makes a CI PLANNING step open a
  // file outside the tree, and the parse error carries a fragment of it
  // into the fail-closed sentence this derivation prints into the log.
  // Refused BY NAME rather than read, which is the same shape of answer
  // an absent file already gets, so nothing downstream learns a new case.
  if (rel === ".." || rel.startsWith("../") || path.posix.isAbsolute(rel)) {
    return {
      compilerOptions: {},
      include: undefined,
      problem: `${rel} lies outside the repository, so this derivation will not open it`,
    };
  }
  if (seen.has(rel)) {
    return { compilerOptions: {}, include: undefined, problem: `${rel} extends itself` };
  }
  seen.add(rel);
  let raw = "";
  try {
    raw = readFileSync(path.join(root, rel), "utf8");
  } catch {
    return { compilerOptions: {}, include: undefined, problem: `${rel} could not be read` };
  }
  /** @type {unknown} */
  let doc;
  try {
    doc = JSON.parse(stripComments(raw).replace(/,(\s*[}\]])/g, "$1"));
  } catch (err) {
    return {
      compilerOptions: {},
      include: undefined,
      problem: `${rel} is not readable as JSON (${err instanceof Error ? err.message : String(err)})`,
    };
  }
  const obj = /** @type {Record<string, unknown>} */ (doc ?? {});
  /** @type {TsconfigReading} */
  let inherited = { compilerOptions: {}, include: undefined };
  const ext = obj["extends"];
  if (typeof ext === "string" && ext.startsWith(".")) {
    inherited = resolveTsconfig(root, path.posix.dirname(rel), ext, seen);
  }
  const own = /** @type {Record<string, unknown>} */ (obj["compilerOptions"] ?? {});
  return {
    compilerOptions: { ...inherited.compilerOptions, ...own },
    include: obj["include"] ?? inherited.include,
  };
}

/**
 * The ONE directory an `include` names, when it names one directory.
 * `["src"]` is this repository's shape and stands in for an unwritten
 * `rootDir`, which `tsc` would infer the same way. Anything with a glob,
 * an extension or a second entry is not a source root and is refused
 * rather than guessed at.
 * @param {unknown} include
 * @returns {string | undefined}
 */
export function soleIncludeDir(include) {
  if (!Array.isArray(include) || include.length !== 1) return undefined;
  const only = include[0];
  if (typeof only !== "string" || only === "") return undefined;
  if (/[*?[\]]/.test(only) || /\.[A-Za-z]+$/.test(only)) return undefined;
  return only;
}

/**
 * @typedef {object} PackageBuild
 * @property {string} config  the TypeScript project, repo-relative
 * @property {string} src     its source root, repo-relative, no trailing slash
 * @property {string} out     its output root, repo-relative, no trailing slash
 */

/**
 * suite -> every emit relationship its package's own build declares,
 * read off the manifests and the projects they name.
 *
 * A PACKAGE THAT DECLARES NONE IS NOT AN ERROR HERE and the reason is
 * recorded rather than thrown: `tools/e2e` has no build at all, and
 * `app`'s two projects are `noEmit` because a bundler writes its output.
 * Neither is a problem until something in the import graph turns out to
 * be generated by one of them, and that is the question the rule below
 * asks — so this function REPORTS what it could not read and refuses
 * nothing.
 *
 * @param {string} [root]
 * @param {Readonly<Record<string, string>>} [roots]
 * @returns {{ byPackage: Record<string, PackageBuild[]>, notes: Record<string, string[]> }}
 */
export function packageBuilds(root = repoRoot, roots = PACKAGE_ROOTS) {
  /** @type {Record<string, PackageBuild[]>} */
  const byPackage = {};
  /** @type {Record<string, string[]>} */
  const notes = {};
  for (const [id, dir] of Object.entries(roots)) {
    byPackage[id] = [];
    notes[id] = [];
    /** @type {unknown} */
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(path.join(root, dir, "package.json"), "utf8"));
    } catch {
      notes[id].push(`${dir}/package.json could not be read as a manifest`);
      continue;
    }
    const scripts = /** @type {Record<string, unknown>} */ (
      /** @type {Record<string, unknown>} */ (pkg ?? {})["scripts"] ?? {}
    );
    const script = scripts[BUILD_SCRIPT];
    if (typeof script !== "string") {
      notes[id].push(`${dir}/package.json declares no ${BUILD_SCRIPT} script`);
      continue;
    }
    const configs = buildConfigsIn(script);
    if (configs.length === 0) {
      notes[id].push(
        `the ${BUILD_SCRIPT} script of ${dir} runs no TypeScript project, so this derivation ` +
          "cannot read where it emits",
      );
      continue;
    }
    for (const file of configs) {
      const reading = resolveTsconfig(root, dir, file);
      const rel = path.posix.normalize(path.posix.join(dir, file.endsWith(".json") ? file : `${file}.json`));
      if (reading.problem !== undefined) {
        notes[id].push(reading.problem);
        continue;
      }
      const co = reading.compilerOptions;
      const outDir = typeof co["outDir"] === "string" ? co["outDir"] : undefined;
      if (outDir === undefined) {
        notes[id].push(`${rel} declares no outDir, so it emits nothing this arm can place`);
        continue;
      }
      const srcDir = typeof co["rootDir"] === "string" ? co["rootDir"] : soleIncludeDir(reading.include);
      if (srcDir === undefined) {
        notes[id].push(`${rel} declares neither a rootDir nor a single include directory`);
        continue;
      }
      byPackage[id].push({
        config: rel,
        src: path.posix.normalize(path.posix.join(dir, srcDir)).replace(/\/+$/, ""),
        out: path.posix.normalize(path.posix.join(dir, outDir)).replace(/\/+$/, ""),
      });
    }
  }
  return { byPackage, notes };
}

/**
 * @typedef {object} GeneratedPlacement
 * @property {Record<string, string[]>} byPath  changed path -> the generated
 *   files a spec may reach on its behalf, sorted.
 * @property {Record<string, string>} via  generated file -> the sentence
 *   naming the configuration that produces it and the sources it is
 *   produced from, so a selection can say where it came from.
 * @property {Record<string, string[]>} byPackage  suite -> the generated
 *   files the import graph reaches under that package's output roots.
 * @property {{ path: string, why: string }[]} unplaceable  every generated
 *   file in the graph no build configuration maps back onto sources.
 */

/**
 * THE RULE, AND IT IS A PURE FUNCTION OF ITS NAMED INPUTS.
 *
 * A file in the import graph is GENERATED when git does not track it:
 * that is the property that makes the edge dead, and it is the same
 * reading `treeWithout`'s fixture in this lane's spec derives a fresh
 * runner from. A generated file is PLACED when some package's build
 * configuration says it lies under that package's output root; the
 * sources it couples to are that configuration's source root.
 *
 * @param {object} input
 * @param {string[]} input.changed   repo-relative paths the range moved
 * @param {string[]} input.reached   every file the spec walk reaches
 * @param {Set<string> | undefined} input.tracked  every path git tracks,
 *   or `undefined` when that reading itself failed
 * @param {Record<string, PackageBuild[]>} input.builds  from `packageBuilds`
 * @param {Record<string, string[]>} [input.notes]  from `packageBuilds`
 * @param {Readonly<Record<string, string>>} [input.roots]  the package roots a
 *   generated file nothing places is reported against
 * @returns {GeneratedPlacement}
 */
export function generatedEntries({ changed, reached, tracked, builds, notes = {}, roots = PACKAGE_ROOTS }) {
  /** @type {Record<string, string[]>} */
  const byPackage = {};
  /** @type {Record<string, string>} */
  const via = {};
  /** @type {{ path: string, why: string }[]} */
  const unplaceable = [];
  for (const id of Object.keys(builds)) byPackage[id] = [];
  if (tracked === undefined) {
    return {
      byPath: {},
      via,
      byPackage,
      unplaceable: [
        {
          path: ".",
          why:
            "git would not list the tracked corpus, so this derivation cannot tell which files " +
            "in the import graph are generated and therefore unreachable by any changed path",
        },
      ],
    };
  }
  for (const file of reached) {
    /** @type {{ id: string, build: PackageBuild } | undefined} */
    let placed;
    for (const [id, entries] of Object.entries(builds)) {
      for (const build of entries) {
        if (file !== build.out && !file.startsWith(`${build.out}/`)) continue;
        if (placed === undefined || build.out.length > placed.build.out.length) placed = { id, build };
      }
    }
    if (placed !== undefined) {
      /** @type {string[]} */ (byPackage[placed.id]).push(file);
      via[file] =
        `${placed.build.config} builds ${placed.build.out}/ from ${placed.build.src}/`;
      continue;
    }
    if (tracked.has(file)) continue;
    const ownerId = suiteOfPath(file, roots);
    const reason =
      ownerId === undefined
        ? "it lies under no graded package root, so there is no manifest here to read a build from"
        : (notes[ownerId] ?? []).join("; ") ||
          `${ownerId}'s build declares no output root that contains it`;
    unplaceable.push({
      path: file,
      why:
        "git does not track it, so no changed path can ever be it, and no package's build " +
        `configuration says which sources produce it — ${reason}`,
    });
  }
  /** @type {Record<string, string[]>} */
  const byPath = {};
  for (const p of changed) {
    /** @type {Set<string>} */
    const hits = new Set();
    for (const [id, entries] of Object.entries(builds)) {
      for (const build of entries) {
        if (p !== build.src && !p.startsWith(`${build.src}/`)) continue;
        for (const g of byPackage[id] ?? []) hits.add(g);
      }
    }
    if (hits.size > 0) byPath[p] = [...hits].sort();
  }
  return {
    byPath,
    via,
    byPackage: Object.fromEntries(Object.entries(byPackage).map(([id, f]) => [id, f.sort()])),
    unplaceable,
  };
}

/**
 * The rule as the CLI runs it: the readings taken, then the rule. Kept
 * separate so the rule stays testable with no tree at all, and so this
 * function is the ONE place a reading happens.
 *
 * THIS ONE IS PAID FOR ON EVERY DERIVATION, unlike the docs and settings
 * scans beside it, and deliberately: its fail-closed arm is a fact about
 * the GRAPH rather than about the range, exactly as `unresolved` is, so
 * a range that moved nothing near a package's sources must still answer
 * for a generated file nothing can place. It costs one `git ls-files`
 * and a manifest and project read per graded package — no corpus walk.
 *
 * @param {string[]} changed
 * @param {Record<string, string[]>} reach  from `specReach`
 * @param {string} [root]
 * @param {Readonly<Record<string, string>>} [roots]
 * @returns {GeneratedPlacement & { builds: Record<string, PackageBuild[]> }}
 */
export function generatedSources(changed, reach, root = repoRoot, roots = PACKAGE_ROOTS) {
  /** @type {Set<string>} */
  const reached = new Set();
  for (const files of Object.values(reach)) for (const f of files) reached.add(f);
  /** @type {Set<string> | undefined} */
  let tracked;
  try {
    tracked = new Set(trackedFiles(root));
  } catch {
    tracked = undefined;
  }
  const { byPackage: builds, notes } = packageBuilds(root, roots);
  return {
    ...generatedEntries({ changed, reached: [...reached].sort(), tracked, builds, notes, roots }),
    builds,
  };
}

/**
 * @typedef {object} OwedDerivation
 * @property {string[]} suites   the graded suites this range owes, sorted.
 * @property {{ whole: boolean, specs: string[] }} e2e  the end-to-end
 *   leg's own scope: `whole` when the leg is owed by a path the import
 *   graph cannot narrow, otherwise exactly the spec files owed.
 * @property {{ path: string, suites: string[], specs: string[], why: string[] }[]} byPath
 * @property {{ path: string, why: string }[]} unplaceable
 * @property {{ path: string, why: string }[]} generatedUnplaceable  every
 *   GENERATED file in the import graph that no package's build
 *   configuration maps back onto sources (T-335). It is a fact about the
 *   graph rather than about the range, exactly as `unresolved` is.
 * @property {string | undefined} failClosed  the sentence that says WHY
 *   the whole battery is owed, or `undefined` when the set is derived.
 */

/**
 * THE RULE, AND IT IS A PURE FUNCTION OF ITS NAMED INPUTS.
 *
 * @param {object} input
 * @param {string[]} input.changed  repo-relative paths the range moved
 * @param {Record<string, string[]>} input.reach  from `specReach`
 * @param {Readonly<Record<string, string>>} [input.roots]
 * @param {Record<string, string[]>} [input.dependents]  from `packageDependents`
 * @param {Record<string, string[]>} [input.docsReadersByPath]  docs path ->
 *   the repo-relative files the DOCS GATE's reader map says read it
 * @param {string[]} [input.docsAsked]  every docs path the gate was ASKED
 *   about. A docs path missing from this list was never put to the map,
 *   and an empty reader list for it would be an unasked question wearing
 *   an answer's costume.
 * @param {Record<string, string[]>} [input.settingsReadersByPath]  runtime
 *   settings path -> the repo-relative files that read it, from
 *   `settingsReaders` (T-330)
 * @param {string[]} [input.settingsAsked]  every settings path that scan
 *   was ASKED about, and the same distinction `docsAsked` draws: an
 *   unasked question is not an answer.
 * @param {Record<string, string[]>} [input.generatedByPath]  changed source
 *   path -> the generated files a spec may reach on its behalf, from
 *   `generatedEntries` (T-335)
 * @param {Record<string, string>} [input.generatedVia]  generated file ->
 *   the configuration sentence that produces it
 * @param {{ path: string, why: string }[]} [input.generatedUnplaceable]  the
 *   generated files in the graph that no build configuration places
 * @param {string[]} [input.unresolved]  from `specReach`
 * @returns {OwedDerivation}
 */
export function deriveOwed({
  changed,
  reach,
  roots = PACKAGE_ROOTS,
  dependents = {},
  docsReadersByPath = {},
  docsAsked = [],
  settingsReadersByPath = {},
  settingsAsked = [],
  generatedByPath = {},
  generatedVia = {},
  generatedUnplaceable = [],
  unresolved = [],
}) {
  const asked = new Set(docsAsked);
  const askedSettings = new Set(settingsAsked);
  // T-271's rule, CALLED. Its `unplaceable` is deliberately not read:
  // this function's placement question is wider than that one's, and the
  // header above states the case where the two answers differ.
  const owning = owningSpecs({
    changed,
    reach,
    docsReadersByPath,
    settingsReadersByPath,
    generatedByPath,
    generatedVia,
  });
  const specsFor = new Map(owning.byPath.map((e) => [e.path, e.specs]));
  /** @type {Set<string>} */
  const suites = new Set();
  /** @type {Set<string>} */
  const specs = new Set();
  let whole = false;
  /** @type {{ path: string, suites: string[], specs: string[], why: string[] }[]} */
  const byPath = [];
  /** @type {{ path: string, why: string }[]} */
  const unplaceable = [];

  for (const p of changed) {
    /** @type {Set<string>} */
    const mine = new Set();
    /** @type {string[]} */
    const why = [];
    const ownedSpecs = specsFor.get(p) ?? [];
    let placed = false;
    /** @param {string} id @param {string} because */
    const owe = (id, because) => {
      mine.add(id);
      why.push(`${id} — ${because}`);
      for (const d of dependents[id] ?? []) {
        mine.add(d);
        why.push(`${d} — its package depends on ${id}'s through a file: specifier`);
      }
    };

    const pkg = suiteOfPath(p, roots);
    if (pkg !== undefined) {
      placed = true;
      owe(pkg, `lies under the ${roots[pkg]}/ package root, which that suite grades`);
    }
    if (ownedSpecs.length > 0) {
      placed = true;
      owe(SCOPED_SUITE, `${ownedSpecs.length} spec file(s) own it over the static import graph`);
      for (const s of ownedSpecs) specs.add(s);
    }
    if (p === "docs" || p.startsWith("docs/")) {
      if (!asked.has(p)) {
        unplaceable.push({
          path: p,
          why:
            "the DOCS GATE's reader map was never asked about it, and an unasked question is " +
            "not an answer",
        });
        continue;
      }
      const readers = docsReadersByPath[p] ?? [];
      if (readers.length === 0) {
        placed = true;
        why.push(
          "no suite — the DOCS GATE's own reader map says no code suite reads this document",
        );
      }
      let mapped = true;
      for (const r of readers) {
        const rs = suiteOfPath(r, roots);
        if (rs === undefined) {
          unplaceable.push({
            path: p,
            why:
              `the DOCS GATE says ${r} reads it, and that reader lies under no package root — ` +
              "so this derivation cannot say which suite would run it",
          });
          mapped = false;
          break;
        }
        placed = true;
        owe(rs, `the DOCS GATE says ${r} reads it, and ${r} lies under ${roots[rs]}/`);
      }
      if (!mapped) continue;
    }
    if (underSettings(p)) {
      if (!askedSettings.has(p)) {
        unplaceable.push({
          path: p,
          why:
            "the runtime settings reader map was never asked about it, and an unasked question " +
            "is not an answer",
        });
        continue;
      }
      const readers = settingsReadersByPath[p] ?? [];
      if (readers.length === 0) {
        unplaceable.push({
          path: p,
          why:
            "no tracked source file in this tree reads it, and a configuration file whose readers " +
            "this scan did not find is not a configuration file nobody reads",
        });
        continue;
      }
      let mapped = true;
      for (const r of readers) {
        const rs = suiteOfPath(r, roots);
        if (rs === undefined) {
          unplaceable.push({
            path: p,
            why:
              `${r} reads this configuration, and that reader lies under no package root — so ` +
              "this derivation cannot say which suite would run it",
          });
          mapped = false;
          break;
        }
        placed = true;
        owe(rs, `${r} reads this configuration, and ${r} lies under ${roots[rs]}/`);
      }
      if (!mapped) continue;
    }
    if (!placed) {
      unplaceable.push({
        path: p,
        why:
          "it lies under no package root, no spec reaches it through a static import, and it is " +
          "not a document the DOCS GATE maps",
      });
      continue;
    }
    // THE END-TO-END LEG IS OWED WHOLE WHENEVER IT IS OWED BY A PATH THE
    // IMPORT GRAPH NAMED NO SPEC FOR — `tools/e2e/package.json`, say, or
    // a script nothing imports. A subset chosen for a path no spec owns
    // would be a subset chosen for a different path.
    if (mine.has(SCOPED_SUITE) && ownedSpecs.length === 0) whole = true;
    for (const id of mine) suites.add(id);
    byPath.push({ path: p, suites: [...mine].sort(), specs: ownedSpecs, why });
  }

  /** @type {string | undefined} */
  let failClosed;
  if (unresolved.length > 0) {
    failClosed =
      "the static import graph has an edge it could not land on a file, so any spec subset would " +
      `be SHORT: ${unresolved.join("; ")}`;
  } else if (generatedUnplaceable.length > 0) {
    // T-335. THE SAME SHAPE AS THE EDGE ABOVE, AND FOR THE SAME REASON.
    // A generated file in the graph that no build configuration maps
    // back onto sources is an edge that lands on a file nothing can ever
    // change, so every spec reaching it is unreachable from any source
    // change and any subset would be SHORT — in a way the walk cannot
    // report, because the edge resolved perfectly well.
    failClosed =
      "the static import graph reaches a GENERATED file this derivation cannot map back to the " +
      "sources that build it, and no changed path can ever be that file, so a change under " +
      `those sources would select no spec: ${generatedUnplaceable
        .map((u) => `${u.path} (${u.why})`)
        .join("; ")}`;
  } else if (unplaceable.length > 0) {
    failClosed = `the derivation cannot place ${unplaceable
      .map((u) => `${u.path} (${u.why})`)
      .join("; ")}`;
  }
  if (failClosed !== undefined) {
    return {
      suites: Object.keys(roots).sort(),
      e2e: { whole: true, specs: [] },
      byPath,
      unplaceable,
      generatedUnplaceable,
      failClosed,
    };
  }
  return {
    suites: [...suites].sort(),
    e2e: { whole, specs: whole ? [] : [...specs].sort() },
    byPath,
    unplaceable,
    generatedUnplaceable,
    failClosed,
  };
}

/** The two-dot form this derivation takes, and the characters a revision
 *  may be spelled with. A range is handed to `git`, so it is validated
 *  before it goes anywhere near one. */
export const RANGE_RE = /^([0-9A-Za-z._/@^~-]{1,200})\.\.([0-9A-Za-z._/@^~-]{1,200})$/;

/**
 * The paths a range moved, with THE RANGE RULE's own pair enforced.
 *
 * TWO DOTS, AND THE LEFT ENDPOINT MUST BE AN ANCESTOR OF THE RIGHT.
 * docs/CONVENTIONS.md's RANGE RULE bans `<merge-base>..<tip>` and bans
 * `<main>..HEAD` between two DIVERGENT tips — `git diff A..B` is `git
 * diff A B`, so main's own newer work comes back reversed, and a
 * docs-only lane reads as having rewritten a crate. Both callers this
 * function has are the shape the rule permits: a push's upstream is an
 * ancestor of what is being pushed, and a lane's base is an ancestor of
 * its tip. So the ancestry is CHECKED rather than assumed, and a
 * divergence is a refusal instead of a wrong answer.
 *
 * @param {string} range
 * @param {string} [root]
 * @returns {{ paths: string[], base: string, tip: string } | { problem: string }}
 */
export function rangeChanged(range, root = repoRoot) {
  const m = RANGE_RE.exec(String(range ?? "").trim());
  if (m === null) {
    return {
      problem:
        `${JSON.stringify(range)} is not a two-dot range of two plain revisions — this ` +
        "derivation takes <base>..<tip> and hands both to git",
    };
  }
  const base = /** @type {string} */ (m[1]);
  const tip = /** @type {string} */ (m[2]);
  const ancestor = spawnSync("git", ["-C", root, "merge-base", "--is-ancestor", base, tip], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (ancestor.status !== 0) {
    return {
      problem:
        `${base} is not an ancestor of ${tip} in ${root} (git exited ` +
        `${String(ancestor.status)}), and a two-dot diff between divergent tips returns the ` +
        "OTHER side's work in reverse — docs/CONVENTIONS.md, THE RANGE RULE",
    };
  }
  const out = spawnSync("git", ["-C", root, "diff", "--name-only", "-z", base, tip, "--"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (out.status !== 0) {
    return {
      problem: `git would not diff ${range} in ${root} (${
        String(out.stderr ?? "").trim().split("\n")[0] || `exit ${String(out.status)}`
      })`,
    };
  }
  return {
    base,
    tip,
    paths: String(out.stdout ?? "")
      .split("\0")
      .filter((l) => l !== ""),
  };
}

/**
 * The derivation as a caller runs it: the readings taken, then the rule,
 * then the INPUTS said out loud so the token can carry them.
 *
 * THE DOCS SCAN IS PAID FOR ONLY WHEN A DOCS PATH MOVED, exactly as in
 * `deriveOwning`: it walks the whole source corpus, and a range that
 * moved one script should not pay for it.
 *
 * @param {string} range
 * @param {string} [root]
 * @param {Readonly<Record<string,Suite>>} [registry]
 * @returns {(OwedDerivation & { range: string, changed: string[], inputs: Record<string, unknown> }) | { problem: string }}
 */
export function owedForRange(range, root = repoRoot, registry = GRADED_SUITES) {
  const roots = Object.fromEntries(Object.values(registry).map((suite) => [suite.id, suite.cwd]));
  const diff = rangeChanged(range, root);
  if ("problem" in diff) return diff;
  const changed = diff.paths.map((p) => normaliseChanged(p, root));
  const { reach, unresolved } = specReach(root);
  const dependents = packageDependents(root, roots);
  /** @type {Record<string, string[]>} */
  const docsReadersByPath = {};
  /** @type {string[]} */
  let docsAsked = [];
  let readerCount = 0;
  if (changed.some((p) => p === "docs" || p.startsWith("docs/"))) {
    const readers = docsReaders(root);
    readerCount = readers.length;
    const gate = docsGate(changed, readers);
    docsAsked = gate.docsPaths;
    for (const entry of gate.byPath) docsReadersByPath[entry.path] = entry.readers;
  }
  /** @type {Record<string, string[]>} */
  const settingsReadersByPath = {};
  /** @type {string[]} */
  let settingsAsked = [];
  const settingsPaths = changed.filter((p) => underSettings(p));
  if (settingsPaths.length > 0) {
    const map = settingsReaders(settingsPaths, root);
    settingsAsked = map.asked;
    Object.assign(settingsReadersByPath, map.byPath);
  }
  // T-335. UNCONDITIONAL, unlike the two scans above: its fail-closed arm
  // is a fact about the graph rather than about the range, so a range
  // that moved nothing near a package's sources must still answer for a
  // generated file in the graph that nothing can place.
  const generated = generatedSources(changed, reach, root, roots);
  const derived = deriveOwed({
    changed,
    roots,
    reach,
    dependents,
    docsReadersByPath,
    docsAsked,
    settingsReadersByPath,
    settingsAsked,
    generatedByPath: generated.byPath,
    generatedVia: generated.via,
    generatedUnplaceable: generated.unplaceable,
    unresolved,
  });
  return {
    ...derived,
    range,
    changed,
    // THE INPUTS THE DERIVATION READ, so the token records not only the
    // answer but what it was computed over — a set nobody can re-derive
    // is a set nobody can check.
    inputs: {
      base: diff.base,
      tip: diff.tip,
      root,
      packageRoots: { ...roots },
      packageDependents: dependents,
      specFiles: Object.keys(reach).length,
      unresolvedImports: unresolved,
      docsReaderMapConsulted: docsAsked.length > 0,
      docsReaders: readerCount,
      docsReadersByPath,
      settingsReaderMapConsulted: settingsAsked.length > 0,
      settingsReadersByPath,
      packageBuilds: generated.builds,
      generatedEntriesReached: generated.byPackage,
      generatedByPath: generated.byPath,
      generatedUnplaceable: generated.unplaceable,
    },
  };
}
/**
 * The subset as a runnable suite: the leg's own entry with the spec files
 * appended to its argv, spelled relative to the leg's own cwd because
 * that is where the runner will be standing.
 * @param {string[]} specs  repo-relative spec paths
 * @param {Suite} [leg]
 * @returns {Suite}
 */
export function scopedSuite(specs, leg = GRADED_SUITES.e2e) {
  const cwd = `${leg.cwd}/`;
  return {
    ...leg,
    argv: [...leg.argv, ...specs.map((s) => (s.startsWith(cwd) ? s.slice(cwd.length) : s))],
  };
}
/** The one suite whose scoped form exists, and the flag that asks for it. */
export const OWNING_FLAG = "--owning";
/** The range form (T-280) and the flag that asks only for its answer. */
export const RANGE_FLAG = "--range";
export const OWED_SET_FLAG = "--owed-set";
/** Source-CI read-only derivation root; configured effects use --root. */
export const TREE_FLAG = "--tree";
