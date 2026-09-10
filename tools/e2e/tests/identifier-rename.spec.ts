import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  CURRENT_NAME,
  KEPT_CLASSES,
  KEPT_CLASS_IDS,
  LEGACY_NAME,
  PROSE_NAME,
  SCAN_EXCLUDED_FILES,
  SCAN_ROOTS,
  caseFindings,
  carriesLegacy,
  classifyLegacy,
  foldHomoglyphs,
  homoglyphFindings,
  scanCase,
  scanCorpus,
  scanHomoglyphs,
  scanLegacy,
} from "../scripts/rename-scan.mjs";
import {
  LEGACY_RUNTIME_DIR,
  RUNTIME_DIR,
  legacyRuntimeDirProblem,
  readManifest,
} from "../../../.claude/hooks/lane-fence.mjs";
import { readToken } from "../../../.claude/hooks/gate-token.mjs";

/**
 * THE IDENTIFIER RENAME (T-264, ADR-022) — no browser.
 *
 * Two properties, and they pull in opposite directions on purpose. The
 * CODE tree must carry the new name everywhere except an enumerated set
 * of survivors; the RECORDS must carry the old one everywhere they
 * already did, because ADR-022 decision 3 and the docs-protocol's law 3
 * make a record a record of what happened rather than a document that
 * gets maintained. A rename that satisfies one and not the other is the
 * failure this file exists to catch, in either direction.
 *
 * AND SINCE T-265-s3 THE SAME CORPUS IS READ TWICE MORE, because the old
 * spelling being gone is not the same claim as the new one being right:
 * the CASE reading holds ADR-022 decision 1's identifier half, and the
 * HOMOGLYPH reading holds the token that looks like the name to a reader
 * and is not the name to any search — including the two above it.
 *
 * THE RECORD DIRECTORIES ARE FLOORS, NOT EQUALITIES, and the asymmetry
 * is the point: records are append-only, so a count here can only rise.
 * An equality would red on the next checkpoint for no defect at all.
 */

/**
 * The records, with the file count carrying the old name at `fe2a2aa`,
 * RE-SCOPED TO THE RECORD TREES at T-265's merge (2026-09-08, the
 * integrator's assigned correction): the first cut counted the
 * DIRECTORIES that contain the records, so two non-record files this
 * project legitimately renames — `docs/checkpoints/TEMPLATE.md` (a
 * template) and `docs/research/competitors.md` (the competitor map) —
 * dropped two floors on a lane that touched no record (T-265's ASK 4).
 * The checkpoint floor is now the 64 RECORDS (the template excluded by
 * name) and the research floor is the capture subtree, 5 files. A path
 * pin by blob manifest is T-264-s6's, still owed.
 */
const RECORD_FLOORS: ReadonlyArray<readonly [string, number]> = [
  ["docs/checkpoints", 64],
  ["docs/rooms", 11],
  ["docs/tasks", 341],
  ["docs/research/captures", 5],
];
/** Non-record files that live inside a record directory; never counted. */
const NOT_A_RECORD = new Set(["docs/checkpoints/TEMPLATE.md"]);

/** Files under `dir` whose bytes carry `needle`, case-insensitively. */
function filesCarrying(dir: string, needle: string): string[] {
  let out = "";
  try {
    out = execFileSync("git", ["grep", "-l", "-i", "--", needle, "--", dir], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    // git grep exits 1 with no output when nothing matches, which is a
    // legitimate answer and not a failure of the query.
    return [];
  }
  return out.split("\n").filter(Boolean).filter((f) => !NOT_A_RECORD.has(f));
}

test("only the enumerated classes of the pre-rename identifier survive in the corpus", () => {
  const corpus = scanCorpus(repoRoot);
  // Shape TEN: a comparison whose expected side was never shown to be
  // non-empty reports agreement when the producer failed.
  expect(corpus.length, "the scan corpus is empty — the walk found nothing to judge").toBeGreaterThan(
    100,
  );

  const hits = scanLegacy(repoRoot);
  expect(
    hits.length,
    "no survivor at all — either the rename deleted a class this table still names, or the scan is blind",
  ).toBeGreaterThan(0);

  const unclassified = hits.filter((h) => h.cls === null);
  expect(
    unclassified.map((h) => `${h.file}:${h.line}: ${h.text.trim()}`),
    "an occurrence of the pre-rename identifier that belongs to no enumerated class",
  ).toEqual([]);

  // THE POSITIVE CONTROL, and it is run rather than asserted: a line the
  // table does not cover MUST come back unclassified. Without this the
  // body above is satisfied equally by a classifier that says yes to
  // everything.
  expect(
    classifyLegacy(`const bin = "target/debug/${LEGACY_NAME}";`, "app/src/whatever.ts"),
    "a plain pre-rename identifier in ordinary code is classified as deliberate",
  ).toBeNull();
  // And the file-scoped classes are scoped: the same text that IS
  // deliberate inside the migration refusal is a defect anywhere else.
  expect(classifyLegacy(".nputer/holder.json", ".claude/hooks/lane-fence.mjs")).toBe(
    "migration-refusal",
  );
  expect(classifyLegacy(".nputer/holder.json", ".claude/hooks/push-guard.mjs")).toBeNull();
});

test("every enumerated survivor class is occupied — a class nobody hits has stopped meaning anything", () => {
  const hits = scanLegacy(repoRoot);
  const occupied = new Set(hits.map((h) => h.cls).filter((c): c is string => c !== null));
  expect(KEPT_CLASS_IDS.length, "the table names no classes at all").toBeGreaterThan(0);
  for (const id of KEPT_CLASS_IDS) {
    expect(occupied.has(id), `class \`${id}\` is named by the table and hit by nothing`).toBe(true);
  }
  // The two implementation files are excluded BY NAME, and the exclusion
  // is asserted rather than assumed: an exclusion nobody checks is an
  // exclusion that silently widens.
  for (const excluded of SCAN_EXCLUDED_FILES) {
    expect(scanCorpus(repoRoot)).not.toContain(excluded);
  }
  expect(KEPT_CLASSES.every((c) => c.files === null || c.files.length > 0)).toBe(true);
});

test("the corpus reaches every tree the criteria name — a root that drops takes three readings with it", () => {
  const corpus = scanCorpus(repoRoot);
  // POSITIVE CONTROL FIRST: the walk answered at all. Every absence
  // below is satisfied by an empty list, and only one of those is the
  // property.
  expect(corpus.length, "the walk found nothing, so every root below is trivially unreached").toBeGreaterThan(
    100,
  );

  // T-264's own roots, then the ones T-265-s3 added: `method/`, the
  // prose trees T-265's `touches:` line names, and `bin/` — the launcher
  // a human runs by hand, which sat outside the corpus while it carried
  // the 34th `NPUTER_*` variable and nothing here could see it.
  for (const root of SCAN_ROOTS) {
    expect(
      corpus.some((f) => f.startsWith(root)),
      `the corpus names the root \`${root}\` and walks no tracked file under it`,
    ).toBe(true);
  }
  // And the governing documents, which are a tree nowhere: `docs/` is
  // mostly records, so they are named one by one and are checked one by
  // one.
  for (const doc of ["docs/CONVENTIONS.md", "docs/NORTH_STAR.md", "docs/STATE.md", "docs/future.md"]) {
    expect(corpus, `the governing document ${doc} is outside the corpus`).toContain(doc);
  }
  // THE RECORD TREES ARE OUT, and that is a property rather than an
  // omission: ADR-022 decision 3 keeps the old spelling there, so a
  // corpus that walked them would report the project's own history as an
  // unfinished rename.
  for (const record of ["docs/checkpoints/", "docs/rooms/", "docs/tasks/", "docs/decisions/", "docs/research/"]) {
    expect(
      corpus.filter((f) => f.startsWith(record)),
      `the corpus walks the record tree ${record}, whose old spelling ADR-022 decision 3 keeps`,
    ).toEqual([]);
  }
});

test("the new name is not spelled with a capital S inside a code span or an identifier", () => {
  // THE DETECTOR IS SHOWN TO FIRE FIRST. A tree-wide `toEqual([])` is
  // satisfied by a reading that never finds anything, which is exactly
  // what a broken regex looks like from here.
  expect(
    caseFindings(`the token \`${PROSE_NAME}\` is wrong here`),
    "a prose-cased name inside a code span is not detected, so the empty tree below proves nothing",
  ).toHaveLength(1);
  expect(
    caseFindings(`dev.${PROSE_NAME}.app and @${PROSE_NAME}/parser`),
    "a prose-cased name glued into an identifier is not detected",
  ).toHaveLength(2);
  // AND IT IS SHOWN NOT TO FIRE ON PROSE, because a reading that says
  // yes to everything passes the arm above just as well: an English
  // hyphenation, a possessive, a full stop and decision 2's all-caps
  // environment prefix are all correct spellings.
  expect(
    caseFindings(
      `${PROSE_NAME}-scale repos are ${PROSE_NAME}'s own. ${PROSE_NAME}. SUPERTASKR_APP_WORKTREE`,
    ),
    "correct prose is reported as a case defect",
  ).toEqual([]);
  expect(PROSE_NAME.toLowerCase(), "the two spellings ADR-022 decision 1 gives are the same string").toBe(
    CURRENT_NAME,
  );

  expect(
    scanCase(repoRoot).map((h) => `${h.file}:${h.line}: ${h.cls}`),
    "the prose spelling of the name is used where ADR-022 decision 1 gives the identifier spelling",
  ).toEqual([]);
});

test("a name-shaped token carrying a non-ASCII homoglyph reds rather than passing as an unrecognised word", () => {
  // The planted token: `supertaskr` with a CYRILLIC small a. `git grep`,
  // `carriesLegacy` and `caseFindings` all answer no on it, which is the
  // whole reason this reading exists.
  const cyrillic = `supert${String.fromCodePoint(0x430)}skr`;
  expect(cyrillic, "the plant is ASCII, so it is not the case this body covers").not.toBe(CURRENT_NAME);
  expect(carriesLegacy(cyrillic), "the byte reading already sees the plant").toBe(false);
  expect(foldHomoglyphs(cyrillic), "the fold does not recover the name").toBe(CURRENT_NAME);
  expect(
    homoglyphFindings(`the wordmark is ${cyrillic} here`),
    "a homoglyph in a name-shaped token is not detected, so the empty tree below proves nothing",
  ).toHaveLength(1);
  // The pre-rename name folds too: a lookalike of the OLD spelling is
  // just as invisible to the survivor scan as one of the new.
  expect(
    homoglyphFindings(`nput${String.fromCodePoint(0x435)}r`),
    "a homoglyph of the pre-rename name is not detected",
  ).toHaveLength(1);
  // NEGATIVE CONTROL: non-ASCII text that is not name-shaped is not a
  // finding. Without this the arm above is satisfied by a reading that
  // reds on every accented word in the tree.
  expect(
    homoglyphFindings("Ströme, naïve, 你好, and a plain supertaskr"),
    "ordinary non-ASCII text is reported as a homoglyph attack",
  ).toEqual([]);

  expect(
    scanHomoglyphs(repoRoot).map((h) => `${h.file}:${h.line}: ${h.cls}`),
    "a name-shaped token in the corpus carries a non-ASCII homoglyph",
  ).toEqual([]);
});

test("the records were not rewritten — every record tree still carries the old name", () => {
  for (const [dir, floor] of RECORD_FLOORS) {
    const carrying = filesCarrying(dir, LEGACY_NAME);
    expect(
      carrying.length,
      `${dir} carries the old name in fewer files than it did at fe2a2aa — a record was rewritten`,
    ).toBeGreaterThanOrEqual(floor);
  }
  // The decisions BEFORE 022 keep the old name; 022 itself is the ruling
  // that renamed it and is excluded by construction rather than by count.
  const decisions = filesCarrying("docs/decisions", LEGACY_NAME).filter(
    (f) => !f.includes("/022-"),
  );
  expect(decisions.length, "a decision record older than ADR-022 lost the old name").toBeGreaterThanOrEqual(
    12,
  );

  // THE QUERY IS SHOWN CAPABLE OF ANSWERING OTHERWISE before its floors
  // are believed — a search that finds plenty is what a broken search
  // that always finds plenty also looks like.
  expect(
    filesCarrying("docs/checkpoints", "a-string-no-record-has-ever-carried-t264"),
    "the record query answers the same however it is asked",
  ).toEqual([]);
  expect(carriesLegacy("nothing to see here")).toBe(false);
});

test("a pre-rename runtime directory refuses the fence manifest read, and names the rename", () => {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-T-264-manifest-"));
  try {
    // THE POSITIVE CONTROL FIRST: with no runtime directory at all the
    // reader gives its ordinary refusal, which does NOT name the rename.
    const plain = readManifest(root);
    expect("problem" in plain && plain.problem).toBeTruthy();
    expect(
      "problem" in plain ? plain.problem : "",
      "the ordinary absent-manifest refusal already names the rename, so the migration arm proves nothing",
    ).not.toContain(LEGACY_RUNTIME_DIR);

    mkdirSync(path.join(root, LEGACY_RUNTIME_DIR), { recursive: true });
    writeFileSync(
      path.join(root, LEGACY_RUNTIME_DIR, "lane-fence.json"),
      JSON.stringify({ version: 1 }),
      "utf8",
    );
    const migrating = readManifest(root);
    const problem = "problem" in migrating ? migrating.problem : "";
    expect(problem, "a pre-rename runtime directory is read as an unarmed lane").toContain(
      LEGACY_RUNTIME_DIR,
    );
    expect(problem, "the refusal does not name the directory to migrate to").toContain(RUNTIME_DIR);
    expect(problem, "the refusal does not name the ruling").toContain("ADR-022");
    // It REFUSES rather than reading: the old manifest's own bytes never
    // reach the caller.
    expect("manifest" in migrating, "the old runtime directory was read").toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a pre-rename runtime directory refuses the verdict token read, and names the rename", () => {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-T-264-token-"));
  try {
    const plain = readToken(root);
    expect(
      "problem" in plain ? plain.problem : "",
      "the ordinary absent-token refusal already names the rename",
    ).not.toContain(LEGACY_RUNTIME_DIR);

    mkdirSync(path.join(root, LEGACY_RUNTIME_DIR), { recursive: true });
    writeFileSync(
      path.join(root, LEGACY_RUNTIME_DIR, "gate-verdict.json"),
      JSON.stringify({ version: 1, suites: {} }),
      "utf8",
    );
    const migrating = readToken(root);
    const problem = "problem" in migrating ? migrating.problem : "";
    expect(problem, "a pre-rename verdict token reads as nothing measured").toContain(
      LEGACY_RUNTIME_DIR,
    );
    expect(problem, "the refusal does not name the directory to migrate to").toContain(RUNTIME_DIR);
    expect("token" in migrating, "the old verdict token was read").toBe(false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the legacy detector answers a FILE at the old path with no migration finding", () => {
  const root = mkdtempSync(path.join(tmpdir(), "supertaskr-T-264-detector-"));
  try {
    expect(legacyRuntimeDirProblem(root), "an empty checkout reports a migration").toBeNull();
    writeFileSync(path.join(root, LEGACY_RUNTIME_DIR), "not a directory\n", "utf8");
    expect(
      legacyRuntimeDirProblem(root),
      "an ordinary FILE at the old path is refused as a migration it never had",
    ).toBeNull();
    rmSync(path.join(root, LEGACY_RUNTIME_DIR));
    mkdirSync(path.join(root, LEGACY_RUNTIME_DIR));
    expect(
      legacyRuntimeDirProblem(root),
      "a real pre-rename directory is not detected at all",
    ).toContain(LEGACY_RUNTIME_DIR);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
