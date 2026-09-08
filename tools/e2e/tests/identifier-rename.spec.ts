import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  KEPT_CLASSES,
  KEPT_CLASS_IDS,
  LEGACY_NAME,
  SCAN_EXCLUDED_FILES,
  carriesLegacy,
  classifyLegacy,
  scanCorpus,
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

test("only the four enumerated classes of the pre-rename identifier survive in the code tree", () => {
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
