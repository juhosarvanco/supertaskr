/**
 * THE RENAME SCAN (T-264) — what is LEFT of the pre-rename identifier,
 * which of the enumerated classes each survivor belongs to, and whether
 * the NEW name is spelled in the case ADR-022 decision 1 gives it.
 *
 * ADR-022 renamed the product's identifiers from `nputer` to
 * `supertaskr`, and T-264 landed them in one lane. T-264-s3 landed the
 * remainder — the repository directory, its remote, every sibling
 * worktree spelling, the runtime template and the prose trees — and
 * with it two of the four classes this table used to name EMPTIED and
 * were removed: `method-source` (T-269 moved `runtime/nputer.yaml` and
 * its three readers) and `repository-directory` (T-266's rename, then
 * T-264-s3's follow). What is left is a survivor because a RULING holds
 * it, and each class below names its own:
 *
 *   capture-transcription the fake agent's denial fixture, transcribed
 *                         byte for byte out of
 *                         `docs/research/captures/real-planner-turn-2026-08-19.jsonl`.
 *                         ADR-022 decision 3 does not rewrite a record.
 *   migration-refusal     `LEGACY_RUNTIME_DIR` and its account in
 *                         `.claude/hooks/lane-fence.mjs` — the one place
 *                         the old name is the SUBJECT rather than a
 *                         leftover.
 *   verbatim-quotation    @human's own dated words, quoted: the bar in
 *                         `docs/NORTH_STAR.md` and the M3 positioning
 *                         ruling in `docs/business/`. T-265's fourth
 *                         criterion: rewriting a person's quoted words
 *                         is falsification, whatever an ADR says about
 *                         a name.
 *   record-title          ADR-001's title, `"Build nputer with nputer"`,
 *                         quoted AS a title in `docs/reference/09-records.md`
 *                         by a sentence that says in as many words that
 *                         records keep the pre-rename name.
 *   naming-history        the etymology, always inside quotation marks:
 *                         `method/README.md`'s one sentence of history
 *                         (T-265's third criterion) and, held under
 *                         `T-264-s3`, `docs/design/design-handoff.md`'s
 *                         wordmark note — the parenthetical explains
 *                         THAT name and no other, so moving the spelling
 *                         would make the sentence false rather than
 *                         current.
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
 *
 * ── AND THE SCAN JUDGES THE NEW NAME TOO (T-265-s3) ──────────────────
 * A rename is not finished when the old spelling is gone: it is finished
 * when the new one is spelled the way the ruling gives it. Two more
 * readings run over the same corpus.
 *
 *   `caseFindings`      ADR-022 decision 1 is one sentence with two
 *                       halves — capital `S` in prose, lowercase
 *                       `supertaskr` as an identifier. This reading owns
 *                       the SECOND half: a `Supertaskr` inside a
 *                       backtick code span, or glued to an identifier's
 *                       own characters, is a finding. The first half — a
 *                       lowercase `s` opening a prose sentence — is
 *                       `T-265-s2`'s, whose whole fence is the three
 *                       root documents that do it, and a tree-wide body
 *                       for it here would red on that card's finding
 *                       rather than on a defect this corpus owns.
 *   `homoglyphFindings` a name-shaped token carrying a non-ASCII
 *                       lookalike — Cyrillic `а` for `a`, Greek `ο` for
 *                       `o` — reads as an unrecognised word to every
 *                       search in this repository, including the one
 *                       above it. It is the failure a rename scan cannot
 *                       see by looking for the names it knows, so it is
 *                       looked for by FOLDING instead.
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
  // The migration refusal has to SPELL the directory it refuses. It is
  // the one place in first-party code where the old name is not a
  // leftover but the subject.
  Object.freeze({
    id: "migration-refusal",
    pattern: /\.nputer/,
    files: Object.freeze([".claude/hooks/lane-fence.mjs"]),
  }),
  // @HUMAN'S OWN DATED WORDS, QUOTED. The patterns are the QUOTED
  // FRAGMENTS rather than the bare name, so a NEW leftover in the same
  // file is still an unclassified survivor: a file-wide pass would make
  // these three documents exempt from the rename instead of these five
  // sentences.
  Object.freeze({
    id: "verbatim-quotation",
    pattern: /nputer to be the/,
    files: Object.freeze(["docs/NORTH_STAR.md"]),
  }),
  Object.freeze({
    id: "verbatim-quotation",
    pattern: /nputer SDLC approach/,
    files: Object.freeze(["docs/business/marketing.md", "docs/business/strategy-room.md"]),
  }),
  // ADR-001's title, quoted AS a title. The sentence around it says in
  // as many words that records keep the pre-rename name, and the title
  // wraps across two lines — so both halves are named.
  Object.freeze({
    id: "record-title",
    pattern: /Build nputer with|^nputer" —/,
    files: Object.freeze(["docs/reference/09-records.md"]),
  }),
  // THE ETYMOLOGY, AND THE QUOTATION MARKS ARE PART OF THE PATTERN:
  // T-265 established that a held survivor is MARKED at its site, and
  // `"nputer"` in quotes is that marking. An unquoted leftover in either
  // file is still a defect.
  Object.freeze({
    id: "naming-history",
    pattern: /"nputer"/,
    files: Object.freeze(["method/README.md", "docs/design/design-handoff.md"]),
  }),
]);

/** The class ids, deduplicated, for a caller that wants the set alone. */
export const KEPT_CLASS_IDS = Object.freeze([...new Set(KEPT_CLASSES.map((c) => c.id))]);

/**
 * The corpus roots — the trees T-264's first acceptance criterion names,
 * plus `bin/` and, since `T-265-s3`, `method/` and the prose trees
 * `T-265`'s own `touches:` line names. A rename that moved a tree the
 * scan does not walk is a rename nothing keeps: every one of these was
 * renamed by a lane whose only witness was the seat that ran it.
 */
export const SCAN_ROOTS = Object.freeze([
  "app/",
  "lib/",
  "tools/",
  ".claude/",
  ".github/",
  "bin/",
  "method/",
  "docs/architecture/",
  "docs/business/",
  "docs/design/",
  "docs/guide/",
  "docs/reference/",
]);

/**
 * The tracked INDIVIDUAL files the criteria name: the root files T-264's
 * criterion names, and the governing documents, which are a tree nowhere
 * — `docs/` itself is mostly RECORDS, and walking it would count the
 * checkpoints, rooms, cards, decisions and captures that ADR-022
 * decision 3 keeps in the old spelling on purpose.
 */
export const SCAN_ROOT_FILES = Object.freeze([
  ".gitignore",
  ".supertaskrignore",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "docs/ARCHITECTURE.md",
  "docs/CAPABILITIES.md",
  "docs/CONVENTIONS.md",
  "docs/NORTH_STAR.md",
  "docs/ROADMAP.md",
  "docs/STATE-template.md",
  "docs/STATE.md",
  "docs/VERSIONS.md",
  "docs/future.md",
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

/**
 * The new name as ADR-022 decision 1 gives it IN PROSE — capital S, one
 * word. The identifier spelling is `CURRENT_NAME` above, and the whole
 * point of decision 1 is that the two are different strings.
 */
export const PROSE_NAME = "Supertaskr";

/**
 * The characters a name-shaped token can carry that LOOK like ASCII and
 * are not. Deliberately short and deliberately literal: these are the
 * confusables that actually reach a repository — a Cyrillic vowel pasted
 * out of a chat window, a Greek omicron out of a slide. `foldHomoglyphs`
 * runs NFKD after this map, so full-width and accented forms need no
 * entry of their own.
 */
export const HOMOGLYPHS = Object.freeze({
  // Cyrillic
  а: "a", в: "b", с: "c", ԁ: "d", е: "e", һ: "h",
  і: "i", ј: "j", к: "k", ӏ: "l", м: "m", о: "o",
  р: "p", ԛ: "q", г: "r", ѕ: "s", т: "t", у: "y",
  х: "x",
  // Greek
  α: "a", ϲ: "c", ε: "e", ι: "i", κ: "k", ο: "o",
  ρ: "p", τ: "t", υ: "u", ν: "v", χ: "x",
});

/**
 * A token with every known lookalike folded back to ASCII. NFKD after
 * the map catches the width and accent families in one step rather than
 * in a table nobody can keep complete.
 *
 * @param {string} token
 * @returns {string}
 */
export function foldHomoglyphs(token) {
  const mapped = Array.from(token)
    .map((ch) => /** @type {Record<string, string>} */ (HOMOGLYPHS)[ch.toLowerCase()] ?? ch)
    .join("");
  return mapped.normalize("NFKD").replace(/\p{M}+/gu, "");
}

/**
 * ADR-022 DECISION 1, SECOND HALF: `supertaskr` is the IDENTIFIER
 * spelling, so a capital-S `Supertaskr` inside a backtick code span, or
 * glued to an identifier's own characters, is a finding.
 *
 * WHAT IS DELIBERATELY NOT A FINDING: `Supertaskr-scale`, `Supertaskr's`
 * and `Supertaskr.` are PROSE — an English hyphenation, a possessive and
 * a full stop — so the glue test asks for an identifier character on the
 * left, or an identifier character, a slash, or a dot FOLLOWED by one on
 * the right. And `SUPERTASKR_APP_WORKTREE` does not carry the token at
 * all: the environment prefix is decision 2's, all caps, and is not this
 * reading's business.
 *
 * The FIRST half — a lowercase `s` opening a prose sentence — is
 * `T-265-s2`'s, whose whole fence is the three root documents that do
 * it. A tree-wide body for it here would red on that card's finding
 * rather than on a defect this corpus owns.
 *
 * @param {string} text
 * @returns {string[]}  one reason per finding, empty when the text is clean
 */
export function caseFindings(text) {
  /** @type {string[]} */
  const out = [];
  for (const span of text.matchAll(/`[^`\n]*`/g)) {
    const run = /** @type {string} */ (span[0]);
    if (run.includes(PROSE_NAME)) {
      out.push(`the prose spelling ${PROSE_NAME} inside the code span ${run}`);
    }
  }
  for (const m of text.matchAll(new RegExp(PROSE_NAME, "g"))) {
    const at = /** @type {number} */ (m.index);
    const before = at > 0 ? (text[at - 1] ?? "") : "";
    const rest = text.slice(at + PROSE_NAME.length);
    const glued =
      /[A-Za-z0-9_@/.]/.test(before) ||
      /^[A-Za-z0-9_@/]/.test(rest) ||
      /^\.[A-Za-z0-9]/.test(rest);
    if (glued) out.push(`the prose spelling ${PROSE_NAME} glued into an identifier: ${text.trim()}`);
  }
  return out;
}

/**
 * A NAME-SHAPED TOKEN CARRYING A NON-ASCII LOOKALIKE. This is the
 * failure neither reading above can see: `carriesLegacy` asks for the
 * literal bytes and `caseFindings` asks for the literal bytes, so a
 * token whose `a` is Cyrillic is not the name to either of them, nor to
 * `git grep`, nor to a reader. It is found by FOLDING instead of by
 * matching.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function homoglyphFindings(text) {
  /** @type {string[]} */
  const out = [];
  for (const m of text.matchAll(/[\p{L}\p{N}_]+/gu)) {
    const raw = /** @type {string} */ (m[0]);
    if (!/[^\x00-\x7F]/.test(raw)) continue;
    const folded = foldHomoglyphs(raw).toLowerCase();
    if (folded.includes(CURRENT_NAME) || folded.includes(LEGACY_NAME)) {
      out.push(`the token ${JSON.stringify(raw)} folds to ${JSON.stringify(folded)}`);
    }
  }
  return out;
}

/**
 * The walk the two readings below share: the SAME corpus `scanLegacy`
 * judges, so a root added for one reading is added for all three and a
 * root that silently drops takes all three with it — which is what
 * `the corpus reaches every tree the criteria name` exists to catch.
 *
 * @param {string} root
 * @param {(text: string) => string[]} reading
 * @returns {LegacyHit[]}
 */
function scanReading(root, reading) {
  /** @type {LegacyHit[]} */
  const hits = [];
  for (const file of scanCorpus(root)) {
    for (const reason of reading(file)) hits.push({ file, line: 0, text: file, cls: reason });
    let text;
    try {
      text = readFileSync(path.join(root, file), "utf8");
    } catch {
      continue;
    }
    text.split("\n").forEach((raw, i) => {
      for (const reason of reading(raw)) hits.push({ file, line: i + 1, text: raw, cls: reason });
    });
  }
  return hits;
}

/**
 * Every case finding in the corpus, in the shape `scanLegacy` returns —
 * file, 1-based line, the line, and the reason in `cls`.
 *
 * @param {string} root
 * @returns {LegacyHit[]}
 */
export function scanCase(root) {
  return scanReading(root, caseFindings);
}

/**
 * Every homoglyph finding in the corpus, same shape.
 *
 * @param {string} root
 * @returns {LegacyHit[]}
 */
export function scanHomoglyphs(root) {
  return scanReading(root, homoglyphFindings);
}
