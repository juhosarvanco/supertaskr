/**
 * THE RENAME SCAN (T-264) — what is LEFT of the pre-rename identifier,
 * and which of the four enumerated classes each survivor belongs to.
 *
 * ADR-022 renamed the product's identifiers from `nputer` to
 * `supertaskr`, and T-264 landed them in one lane. Four classes were
 * deliberately NOT moved. Two are a source outside that lane's fence,
 * one is a RECORD quoted verbatim — which ADR-022 decision 3 never
 * rewrites — and one is the migration refusal, which has to spell what
 * it refuses:
 *
 *   method-source         `runtime/nputer.yaml` and the BANKING_MAP cell
 *                         transcribed verbatim out of
 *                         `method/interview/plan-interview.md`;
 *                         `method/` is T-265's.
 *   repository-directory  the repository directory `nputer`, its remote,
 *                         and every sibling worktree named after it
 *                         (`../nputer-app`, `../nputer-T-NNN`,
 *                         `../nputer-V-T-NNN`). ADR-022 decision 4 makes
 *                         the repository rename @human's (T-266).
 *   capture-transcription the fake agent's denial fixture, transcribed
 *                         byte for byte out of
 *                         `docs/research/captures/real-planner-turn-2026-08-19.jsonl`.
 *   migration-refusal     `LEGACY_RUNTIME_DIR` and its account in
 *                         `.claude/hooks/lane-fence.mjs` — the one place
 *                         the old name is the SUBJECT rather than a
 *                         leftover.
 *
 * THE CLASSES ARE LITERALS HERE AND ARE NOT DERIVED FROM THE TREE. A
 * classifier that learned its own expectations from the corpus it judges
 * would pass over anything the corpus happened to contain — the
 * tautology `method/interview/decomposition.md` step 3 forbids and the
 * reason `expectedClasses` is a frozen table rather than a scan.
 *
 * TWO FILES ARE EXCLUDED BY NAME and it is the same self-exclusion
 * `token-scan.mjs` carries: this file and its spec spell every pattern
 * above, so a scan that read them would report its own table as a
 * survivor set.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/** The identifier ADR-022 replaced, matched case-insensitively. */
export const LEGACY_NAME = "nputer";

/** The identifier it was replaced BY. */
export const CURRENT_NAME = "supertaskr";

/**
 * The four classes, as LITERAL patterns. Order is not significant: a
 * line may sit in more than one class and the first match names it.
 *
 * `files: null` means the class applies anywhere in the corpus. A class
 * that names FILES applies only inside them — the enumeration T-264's
 * first acceptance criterion asks its notes for, made mechanical, so a
 * NEW deliberate survivor cannot arrive without this table moving.
 */
export const KEPT_CLASSES = Object.freeze([
  Object.freeze({ id: "method-source", pattern: /runtime\/nputer\.yaml/i, files: null }),
  // BANKING_MAP is a VERBATIM transcription of
  // method/interview/plan-interview.md's stage table, and
  // `every cell of the 9-row table matches plan-interview.md verbatim`
  // reds the moment the copy and the source disagree. `method/` is
  // T-265's, so this cell moves with that file and never ahead of it.
  Object.freeze({
    id: "method-source",
    pattern: /\.nputer\//,
    files: Object.freeze(["app/src/genesis/genesis-derive.ts"]),
  }),
  // `the_shipped_plan_interview_still_carries_the_normative_banking_map`
  // searches the compiled-in `plan-interview.md` for the stage-0 line. A
  // needle in the NEW spelling searches for a sentence the shipped
  // method does not contain yet, and reds by name — measured.
  Object.freeze({
    id: "method-source",
    pattern: /`\.nputer\/`/,
    files: Object.freeze(["app/src-tauri/src/agent/kit.rs"]),
  }),
  // The fake agent's denial fixture is TRANSCRIBED, byte for byte, from
  // `docs/research/captures/real-planner-turn-2026-08-19.jsonl` — a
  // record of a real 2026-08-19 turn, which ADR-022 decision 3 does not
  // rewrite. `the_tool_denied_fixture_is_a_transcription_not_a_
  // construction` compares the two off disk.
  Object.freeze({
    id: "capture-transcription",
    pattern: /\.nputer/,
    files: Object.freeze(["app/src-tauri/src/bin/fake_agent.rs"]),
  }),
  Object.freeze({
    id: "repository-directory",
    // The last two alternatives are INTERPOLATED spellings — `nputer-${id}`
    // in TypeScript and `nputer-{id}` in a Rust format string. They are the
    // same class as the literal ones and were the ones the rename's first
    // pass missed: one of them straddles a derivation, and
    // `THE ARM LEAVES EXACTLY WHAT THE EIGHT HAND STEPS LEAVE` reds by name
    // when the fixture's expectation moves and CONVENTIONS' published
    // spelling does not.
    pattern: /nputer-app|nputer-T-|nputer-V-|nputer-\$\{|nputer-\{|Projects\/nputer|juhosarvanco\/nputer/i,
    files: null,
  }),
  // The migration refusal has to SPELL the directory it refuses. It is
  // the one place in first-party code where the old name is not a
  // leftover but the subject.
  Object.freeze({
    id: "migration-refusal",
    pattern: /\.nputer/,
    files: Object.freeze([".claude/hooks/lane-fence.mjs"]),
  }),
]);

/** The class ids, deduplicated, for a caller that wants the set alone. */
export const KEPT_CLASS_IDS = Object.freeze([...new Set(KEPT_CLASSES.map((c) => c.id))]);

/**
 * The corpus roots — exactly the trees T-264's first acceptance
 * criterion names, plus the tracked root files.
 */
export const SCAN_ROOTS = Object.freeze([
  "app/",
  "lib/",
  "tools/",
  ".claude/",
  ".github/",
]);

/** The tracked root files the criterion names. */
export const SCAN_ROOT_FILES = Object.freeze([
  ".gitignore",
  ".supertaskrignore",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
]);

/**
 * This scan's own two implementation files, excluded BY NAME because
 * they spell every pattern above.
 */
export const SCAN_EXCLUDED_FILES = Object.freeze([
  "tools/e2e/scripts/rename-scan.mjs",
  "tools/e2e/tests/identifier-rename.spec.ts",
]);

/** Extensions whose bytes are not text and are never scanned. */
const BINARY_EXTENSIONS = Object.freeze([
  ".png",
  ".ico",
  ".icns",
  ".woff",
  ".woff2",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
]);

/**
 * The class a piece of text belongs to, or `null` when it belongs to
 * none — which is what an UNFINISHED rename looks like.
 *
 * @param {string} text
 * @param {string} [file]  the repository-relative path the text came from
 * @returns {string | null}
 */
export function classifyLegacy(text, file = "") {
  // FILE-SCOPED CLASSES ARE TRIED FIRST, and the order is load-bearing
  // rather than tidy: a survivor inside a named file is there for that
  // file's own reason, and a broad class that happened to match its text
  // would relabel it — the fake agent's transcribed denial carries
  // `runtime/nputer.yaml` inside a captured shell line and is not a
  // method-source survivor at all.
  for (const c of KEPT_CLASSES) {
    if (c.files === null) continue;
    if (c.files.includes(file) && c.pattern.test(text)) return c.id;
  }
  for (const c of KEPT_CLASSES) {
    if (c.files !== null) continue;
    if (c.pattern.test(text)) return c.id;
  }
  return null;
}

/**
 * Does this text carry the pre-rename identifier at all?
 *
 * @param {string} text
 * @returns {boolean}
 */
export function carriesLegacy(text) {
  return text.toLowerCase().includes(LEGACY_NAME);
}

/**
 * The tracked corpus this scan judges: every tracked path under
 * SCAN_ROOTS plus SCAN_ROOT_FILES, minus this scan's own two files and
 * minus binary extensions.
 *
 * @param {string} root
 * @returns {string[]}
 */
export function scanCorpus(root) {
  const listed = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "buffer",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString("utf8")
    .split(String.fromCharCode(0))
    .filter(Boolean);
  return listed
    .filter(
      (p) =>
        (SCAN_ROOTS.some((r) => p.startsWith(r)) || SCAN_ROOT_FILES.includes(p)) &&
        !SCAN_EXCLUDED_FILES.includes(p) &&
        !BINARY_EXTENSIONS.includes(path.extname(p).toLowerCase()),
    )
    .sort();
}

/**
 * @typedef {object} LegacyHit
 * @property {string} file
 * @property {number} line   1-based; 0 for a PATH hit, which has no line
 * @property {string} text   the line, or the path for a PATH hit
 * @property {string | null} cls
 */

/**
 * Every surviving occurrence of the pre-rename identifier in the corpus,
 * each carrying the class it was classified into — `null` when none.
 *
 * PATHS ARE SCANNED AS WELL AS LINES, because a directory can carry the
 * old name while every byte inside it carries the new one; the index
 * crate is exactly that case.
 *
 * @param {string} root
 * @returns {LegacyHit[]}
 */
export function scanLegacy(root) {
  /** @type {LegacyHit[]} */
  const hits = [];
  for (const file of scanCorpus(root)) {
    if (carriesLegacy(file)) {
      hits.push({ file, line: 0, text: file, cls: classifyLegacy(file, file) });
    }
    let text;
    try {
      text = readFileSync(path.join(root, file), "utf8");
    } catch {
      continue;
    }
    if (!carriesLegacy(text)) continue;
    text.split("\n").forEach((raw, i) => {
      if (!carriesLegacy(raw)) return;
      hits.push({ file, line: i + 1, text: raw, cls: classifyLegacy(raw, file) });
    });
  }
  return hits;
}

/**
 * The survivors that belong to NO class — the unfinished-rename set, and
 * the thing every caller of this module actually asks for.
 *
 * @param {string} root
 * @returns {LegacyHit[]}
 */
export function unclassifiedLegacy(root) {
  return scanLegacy(root).filter((h) => h.cls === null);
}
