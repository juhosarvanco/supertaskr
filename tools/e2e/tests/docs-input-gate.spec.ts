import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { repoRoot } from "../preflight";
import {
  CALL_SAMPLES,
  DISPOSITION_RULING,
  DOCS_EXCLUDED_FILES,
  PLANTED_READERS,
  RESOLVE_SAMPLES,
  ROOT_ANCHOR_LEDGER,
  ROOT_FORMS,
  SITE_SAMPLES,
  SUITES,
  TASK_STATUS_SOURCE,
  callSelftest,
  conventionsBullet,
  conventionsText,
  docsGate,
  docsReaders,
  docsSites,
  siteCensus,
  siteSelftest,
  frontmatterBlock,
  isTaskCardPath,
  liveTaskCards,
  nearMisses,
  packageRelativeSites,
  resolveSelftest,
  rootAnchoredFiles,
  stripComments,
  suitesOwedForAllOfDocs,
  taskCardIssues,
  taskStatuses,
  unaccountedRootAnchors,
  unlinkedFiles,
  unlinkedSites,
} from "../scripts/docs-scan.mjs";
import { XARGS_DIALECTS, dialectsDiverge, probeXargs } from "../scripts/xargs-dialect.mjs";

/**
 * THE DOCS GATE (T-084) — no browser.
 *
 * `docs/` is an INPUT to this repo's code suites, and neither standing
 * gate trigger knows it: GRAPH REGEN fires on `.ts/.tsx/.js/.jsx`
 * OUTSIDE docs/, BOOT GATE on `app/src/**`, `app/src-tauri/**` or a
 * manifest. A commit whose whole diff is `docs/tasks/*.md` matches
 * neither, and twice it has turned a suite red anyway — both times
 * discovered three layers from the cause by somebody who was not
 * looking for it.
 *
 * This spec holds three properties, and the first is the one the card
 * is really about:
 *
 *   1. THE READER SET IS DERIVED FROM THE TREE, NOT LISTED. A hand list
 *      is the defect T-058 and T-080 each spent a card on. `docsReaders`
 *      finds every tracked source file that forms a `docs`-first path
 *      off a base that EVALUATES TO THE REPOSITORY ROOT, and the tests
 *      below pin the discriminator from both sides — a fixture tree
 *      computed from `import.meta.url` is not this repo's docs/, and a
 *      repo-root join whose first segment is `app` is not either.
 *   2. THE DOCUMENTED TRIGGER AGREES WITH THE DERIVATION. CONVENTIONS'
 *      DOCS GATE bullet is checked against `docsReaders` in BOTH
 *      directions, the shape workflow-parity.spec.ts established on the
 *      same file: a command the doc gains that the tree does not
 *      produce reds, and so does one the tree produces that the doc
 *      stops naming.
 *   3. AN ILLEGAL CARD FAILS LOUDLY AND NAMES THE FILE. The vocabulary
 *      is READ OUT OF lib/parser/src/types.ts rather than restated, so
 *      there is exactly one status vocabulary in this tree (T-057).
 *
 * The lane cannot IMPORT the parser (ADR-011). It can READ first-party
 * source, which is the same licence shell-frame.spec.ts already takes
 * to read `docs/` itself — and reading the vocabulary is what keeps
 * this gate from becoming a second implementation of it.
 */

const READERS = docsReaders();
const STATUSES = taskStatuses();
const CONVENTIONS = conventionsText();
const DOCS_GATE_BULLET = conventionsBullet(CONVENTIONS, "DOCS GATE (T-084");

/** A card, built here so a poison of the shape below has to move THIS
 *  text rather than a shared constant the assertion also reads. */
function card(front: string): string {
  return `---\n${front}\n---\n\nA finding.\n`;
}

// ── 1. the enumeration ────────────────────────────────────────────────

test("every package with a suite has at least one derived docs reader", () => {
  // A FLOOR, not a count: the set grows when a reader is added and this
  // stays true. What it catches is a suite quietly dropping out of the
  // answer — which is exactly what the card assumed had already
  // happened, since it names one suite and the tree has four.
  const bySuite = new Map<string, string[]>();
  for (const r of READERS) {
    if (r.suite === undefined) continue;
    bySuite.set(r.suite, [...(bySuite.get(r.suite) ?? []), r.file]);
  }
  for (const suite of SUITES) {
    expect(bySuite.get(suite.dir) ?? [], `${suite.dir} has a docs reader`).not.toEqual([]);
  }
  expect(READERS.every((r) => r.suite !== undefined && r.command !== undefined)).toBe(true);
  expect(READERS.every((r) => r.prefixes.length > 0)).toBe(true);
});

test("the two readers the card names are derived, and they are NOT all of them", () => {
  // The card's own evidence, kept as a regression pin — and the
  // correction beside it. T-084 names `architecture-dogfood.test.ts`
  // and `map-dogfood-render.test.tsx` and says "the two named here";
  // the tree says the app suite is one of FOUR that read docs/.
  const files = READERS.map((r) => r.file);
  expect(files).toContain("app/test/architecture-dogfood.test.ts");
  expect(files).toContain("app/test/map-dogfood-render.test.tsx");
  expect(new Set(READERS.map((r) => r.command)).size).toBeGreaterThan(1);
  expect(files.length).toBeGreaterThan(2);
});

test("a body that hands the root to a first-party call is a reader, and names every prefix that call spends", () => {
  // THE REJECTION, AS A PIN. `lib/parser/test/smoke.test.ts` spells no
  // docs path: it calls `parseProject(repoRoot)`, and
  // `lib/parser/src/project.ts` spends that root on THREE. With the
  // literal arm alone, a one-line edit to docs/ROADMAP.md owed exactly
  // `npm test` from tools/e2e — 114/114 at exit 0 — while
  // `npx vitest run` from lib/parser went 262/263 at exit 1 in a suite
  // the answer never named. AC2 says a reader is any body that RESOLVES
  // a path under docs/ against the repository root; resolving it through
  // a callee is still resolving it.
  const smoke = READERS.find((r) => r.file === "lib/parser/test/smoke.test.ts");
  expect(smoke, "smoke.test.ts is derived").toBeDefined();
  expect(smoke!.via.join(" "), "and it is derived by the CALL arm").toContain("call parseProject()");
  expect(smoke!.prefixes).toEqual([
    "docs/ROADMAP.md",
    "docs/architecture/components",
    "docs/tasks",
  ]);
  expect(smoke!.command).toBe("npx vitest run");
  // The two mutants from the verdict, as answers rather than anecdotes.
  expect(docsGate(["docs/ROADMAP.md"], READERS).commands).toContain("npx vitest run from lib/parser/");
  expect(
    docsGate(["docs/architecture/components/C-06-lib-parser.md"], READERS).commands,
  ).toContain("npx vitest run from lib/parser/");
});

test("the CALLEE is not a reader — a root that arrives as a parameter is somebody else's project", () => {
  // The half that keeps the call arm from swallowing the tree.
  // `parseProject` forms all three docs paths off its own PARAMETER, and
  // that parameter is a user's project root, not this one. If the arm
  // credited the callee, every file in lib/parser/src would be a reader
  // and the answer would stop being proportional.
  const files = READERS.map((r) => r.file);
  expect(files).not.toContain("lib/parser/src/project.ts");
  const project = readFileSync(path.join(repoRoot, "lib/parser/src/project.ts"), "utf8");
  expect(project, "the callee really does form the docs paths").toContain("'docs', 'ROADMAP.md'");
});

test("the call sample set is green, with a Rust positive and a DEFAULTED-root positive", () => {
  // Same discipline as the site samples: fragments lexed exactly as a
  // file is, with an evidence floor so deleting a sample cannot delete
  // its own failure. The two floors that matter are the shapes the arm
  // would otherwise miss silently — Rust's borrowed root, and a helper
  // whose root is a DEFAULT parameter called with no argument at all
  // (which is every entry point in docs-scan.mjs, and how this very
  // spec reads docs/CONVENTIONS.md).
  const rows = callSelftest();
  expect(rows.filter(([, ok]) => !ok).map(([what]) => what)).toEqual([]);
  expect(rows.length).toBeGreaterThan(8);
  expect(CALL_SAMPLES.filter((s) => s.prefixes.length === 0).length).toBeGreaterThan(2);
});

test("nothing forms a repo-root docs path that the derivation could not link", () => {
  // THE SILENT-MISS TRIPWIRE. A file that both computes the repository
  // root and forms a `docs`-first path, where no site's base resolved to
  // the root, is either a reader written in a shape `evalBase` does not
  // know or a genuine non-reader — and the scanner cannot tell. It says
  // so rather than dropping it, because a gate that goes quiet is the
  // failure this whole card is about.
  expect(unlinkedFiles()).toEqual([]);
});

test("the tripwire's ANCHOR arm follows imports, exactly as its site arm always did", () => {
  // THE ASYMMETRY, AS A PIN, off the real tree rather than a plant.
  // `tools/e2e/tests/boot-check-guard.spec.ts` names the repository root
  // ONLY by `import { repoRoot } from "../preflight"` — it has no local
  // binding that evaluates to the root. An anchor scan that read
  // `ctx.bindings` alone did not see it at all, so a file with an
  // IMPORTED root and a docs site the scanner could not link produced a
  // site the scanner SAW and a report it did NOT MAKE. That idiom is how
  // most of this package names its root.
  const rel = "tools/e2e/tests/boot-check-guard.spec.ts";
  const source = readFileSync(path.join(repoRoot, rel), "utf8");
  expect(source, "the root really is imported").toContain('import { repoRoot } from "../preflight"');
  expect(source, "and really is not bound locally").not.toMatch(/(?:const|let|var)\s+repoRoot\s*=/);
  const entry = rootAnchoredFiles().find((f) => f.file === rel);
  expect(entry, `${rel} is seen to hold the repository root`).toBeDefined();
  expect(entry!.anchors).toContain("repoRoot");
});

test("THE ACCOUNT and the tree agree — every root-anchored file is derived, reported, or argued", () => {
  // WHAT BOUNDS THE BLIND SPOT. Only a file holding this repository's
  // root can read this repository's docs/, so `rootAnchoredFiles()` is
  // the whole population. Of those it does not derive, the ones whose
  // SUITE is already owed for every path under docs/ cannot shorten an
  // answer; what is left is `unaccountedRootAnchors()`, and every member
  // is argued by file in ROOT_ANCHOR_LEDGER. Asserting the two sets EQUAL
  // is what keeps this an account rather than a sample: a new
  // root-anchored file in app/, app/src-tauri or lib/parser reds by name
  // and someone has to look at it.
  const census = rootAnchoredFiles();
  expect(census.length, "the census is non-trivial").toBeGreaterThan(10);
  expect(new Set(census.map((f) => f.kind))).not.toContain("unlinked");
  expect(suitesOwedForAllOfDocs(READERS)).toEqual(new Set(["tools/e2e"]));
  expect([...unaccountedRootAnchors()].sort()).toEqual(
    ROOT_ANCHOR_LEDGER.map((e) => e.file).sort(),
  );
  for (const entry of ROOT_ANCHOR_LEDGER) {
    expect(entry.why.length, `${entry.file} carries an argument`).toBeGreaterThan(40);
  }
  // The ledger's one live READER: the pair it would contribute must
  // already be produced by something the derivation DOES find, or the
  // answer really is short. Derived, not asserted by hand.
  const registry = ROOT_ANCHOR_LEDGER.find((e) => e.file.endsWith("arch/registry.rs"));
  expect(registry!.reads).toBe("docs/architecture/components");
  expect(
    READERS.some((r) => r.suite === "app/src-tauri" && r.prefixes.includes(registry!.reads)),
    "cargo test is already owed for the prefix registry.rs reads",
  ).toBe(true);
});

test("the census is DERIVED, and the DOCS GATE bullet names the command instead of a digit", () => {
  // BLOCKING 3, and the reason the fix is not a corrected digit. The
  // bullet shipped "exactly TWELVE of them, in nine files, are
  // root-anchored" at a named ref; the tree said ELEVEN at that ref, at
  // the tip and by hand. Nothing derived it, so it was green and wrong,
  // and it had been relayed into two further documents before anyone
  // re-measured. A digit in prose CANNOT be pinned here without forcing
  // an out-of-fence edit to docs/CONVENTIONS.md on any lane that adds a
  // docs-shaped site — so the digits are gone and the bullet names the
  // command that prints them.
  const census = siteCensus();
  expect(census.resolvedSites).toBeGreaterThan(0);
  expect(census.resolvedFiles).toBeGreaterThan(0);
  expect(census.resolvedSites, "resolving is a small share of docs-SHAPED").toBeLessThan(
    census.sites / 2,
  );
  // Internal consistency: every file with a site that RESOLVES into
  // docs/ is a derived reader, and the reader set is at least that big —
  // the call arm can only add.
  expect(READERS.length).toBeGreaterThanOrEqual(census.resolvedFiles);
  expect(DOCS_GATE_BULLET).toContain("docs-gate.mjs --census");
  expect(DOCS_GATE_BULLET, "no transcribed site count").not.toMatch(
    /\d+\s+docs-shaped sites in \d+ files/,
  );
});

test("a docs path off a root that is NOT the repo root is not a reader", () => {
  // THE DISCRIMINATOR, from the side that a heuristic gets wrong.
  // lib/parser/test/files.test.ts does `join(root, 'docs', 'ROADMAP.md')`
  // where `root` is `fixture(name)` — computed from `import.meta.url`,
  // so "mentions import.meta.url" would call it a reader. It resolves to
  // lib/parser/test/fixtures/<name>, not the repository root.
  const rel = "lib/parser/test/files.test.ts";
  const sites = docsSites(stripComments(readFileSync(path.join(repoRoot, rel), "utf8")));
  expect(sites.length, "the file really does form docs paths").toBeGreaterThan(0);
  expect(READERS.map((r) => r.file)).not.toContain(rel);
});

test("a repo-root join whose first segment is not `docs` is not a reader", () => {
  // THE DISCRIMINATOR from the other side. tools/e2e/fixtures/shell.ts
  // joins the REPO ROOT with app/test/fixtures/genesis/streak/docs — a
  // base that is the root and a path that ends in `docs`. The first
  // segment is `app`, so it reads a fixture tree.
  const rel = "tools/e2e/fixtures/shell.ts";
  const text = readFileSync(path.join(repoRoot, rel), "utf8");
  expect(text, "the file really does join the root with a docs-ending path").toContain("repoRoot");
  expect(READERS.map((r) => r.file)).not.toContain(rel);
});

/**
 * A throwaway repository holding the PLANTED READERS, so the real
 * derivation runs over real files rather than over fragments. The plant
 * sources live in docs-scan.mjs (the one file excluded from its own
 * scan): a spec that spelled a docs site out in a template literal
 * would BECOME a reader of docs/, because `stripComments` keeps string
 * literals — which is the whole reason that exclusion exists.
 */
function plantRepo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "t085-docs-gate-"));
  const write = (rel: string, content: string): void => {
    const abs = path.join(dir, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, content, "utf8");
  };
  write("app/src-tauri/Cargo.toml", '[package]\nname = "planted"\nversion = "0.0.0"\n');
  write("docs/research/captures/planted.jsonl", "{}\n");
  write("docs/tasks/T-000-planted.md", "---\nid: T-000\nstatus: planned\n---\n\nbody\n");
  for (const plant of PLANTED_READERS) write(plant.file, plant.source);
  execFileSync("git", ["init", "-q"], { cwd: dir, stdio: ["ignore", "ignore", "ignore"] });
  execFileSync("git", ["add", "-A"], { cwd: dir, stdio: ["ignore", "ignore", "ignore"] });
  return dir;
}

test("THE LIVE PACKAGE-RELATIVE READER IS DERIVED — not listed, and not in the ledger", () => {
  // T-085's own criterion, and the measurement that produced the card.
  // `app/src-tauri/tests/agent_runner.rs` reads
  // docs/research/captures/real-planner-turn-2026-08-19.jsonl as
  // `Path::new(env!("CARGO_MANIFEST_DIR")).join("../../docs/…")`. It
  // holds no root, its literal does not open with `docs`, and it escaped
  // the site scan, the call arm, the tripwire AND the ledger in silence.
  // Measured at T-084's merge: mutate one field of that capture and the
  // gate owed only `npm test from tools/e2e/` (121/121, exit 0) while
  // bare `cargo test` went 351/1/3 at exit 101. An integrator who obeyed
  // the gate merged a red tree.
  const rel = "app/src-tauri/tests/agent_runner.rs";
  const capture = "docs/research/captures/real-planner-turn-2026-08-19.jsonl";
  const source = readFileSync(path.join(repoRoot, rel), "utf8");
  expect(source, "the file really does anchor on the crate dir").toContain(
    'env!("CARGO_MANIFEST_DIR")',
  );
  expect(source, "and really does climb into docs/").toContain(`../../${capture}`);
  expect(source, "and holds no repository root by name").not.toMatch(
    /(?:const|let|fn)\s+repo_?[Rr]oot/,
  );
  const reader = READERS.find((r) => r.file === rel);
  expect(reader, "agent_runner.rs is a derived reader").toBeDefined();
  expect(reader!.prefixes).toContain(capture);
  expect(reader!.command).toBe("cargo test");
  expect(reader!.suite).toBe("app/src-tauri");
  // DERIVED, NOT LISTED: nothing in the acknowledgement ledger names it.
  expect(ROOT_ANCHOR_LEDGER.map((e) => e.file)).not.toContain(rel);
  // AND THE ANSWER MOVES. This is the mutant, as an answer rather than an
  // anecdote: the suite that actually reds is the one now named.
  const gate = docsGate([capture], READERS);
  expect(gate.fires).toBe(true);
  expect(gate.commands).toContain("cargo test from app/src-tauri/");
  expect(gate.byPath[0]!.readers).toContain(rel);
});

test("the resolve sample set is green — both spellings in, the fixture base and the escape out", () => {
  // THE THIRD ARM's samples: shape is decided textually, MEMBERSHIP by
  // resolving the literal against the base. The floors are the two
  // spellings (T-084's verifier probed for the JS one, found zero, and
  // missed the Rust one that was live), the fixture base, and the climb
  // that leaves the repository — plus a non-vacuity row requiring every
  // negative to be a SITE that resolution DROPS, since a negative the
  // textual filter never matched would keep this arm green if it were
  // deleted outright.
  const rows = resolveSelftest();
  expect(rows.filter(([, ok]) => !ok).map(([what]) => what)).toEqual([]);
  expect(rows.length).toBeGreaterThan(10);
  expect(RESOLVE_SAMPLES.filter((s) => s.prefixes.length === 0).length).toBeGreaterThan(2);
});

test("PLANTED READERS in BOTH spellings are derived by the real derivation, off a scratch repository", () => {
  // Criterion five, and the reason it is two plants and not one: T-084's
  // verifier falsified the ledger's universal with the JS spelling,
  // found zero instances, and filed — while the Rust spelling sat live
  // in the tree. The probe missed BY SPELLING. Both are planted, both
  // are required, and the plant text is READ BACK off disk before the
  // derivation is believed.
  const dir = plantRepo();
  try {
    for (const plant of PLANTED_READERS) {
      expect(readFileSync(path.join(dir, plant.file), "utf8"), `${plant.file} is on disk as written`).toBe(
        plant.source,
      );
    }
    const planted = docsReaders(dir);
    const byFile = new Map(planted.map((r) => [r.file, r]));
    for (const plant of PLANTED_READERS) {
      if (plant.prefix === null) {
        expect(byFile.has(plant.file), `${plant.file} is NOT a reader — ${plant.why}`).toBe(false);
        continue;
      }
      const got = byFile.get(plant.file);
      expect(got, `${plant.file} is derived — ${plant.why}`).toBeDefined();
      expect(got!.prefixes).toContain(plant.prefix);
      expect(got!.command).toBe(plant.command);
      expect(got!.suite).toBe(plant.suite);
    }
    // BOTH SPELLINGS, named rather than counted: the Rust plant is owed
    // by cargo and the JS plant by npm, which is the whole point — a
    // package-relative read answers with ITS OWN suite.
    const rust = PLANTED_READERS.find((plant) => plant.source.includes("CARGO_MANIFEST_DIR"))!;
    const js = PLANTED_READERS.find((plant) => plant.source.includes('resolve("../docs'))!;
    expect(rust.command).toBe("cargo test");
    expect(js.command).toBe("npm test");
    expect(docsGate([rust.prefix!], planted).commands).toContain("cargo test from app/src-tauri/");
    expect(docsGate([js.prefix!], planted).commands).toContain("npm test from app/");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a planted climb that ESCAPES the repository is excluded, and the exclusion is asserted", () => {
  // Criterion six. `path.relative` answers an escape with a `..` of its
  // own, so one containment test covers it — but "it is not a reader" is
  // satisfied equally by a working exclusion and by a site the scan
  // never saw, so the account has to say WHICH. It is a docs-shaped
  // climbing site, seen, classified `outside`, and dropped.
  const dir = plantRepo();
  try {
    const climbs = packageRelativeSites(dir);
    const byFile = new Map(climbs.map((c) => [c.file, c]));
    const escape = PLANTED_READERS.find((plant) => plant.source.includes("../../../docs"))!;
    const seen = byFile.get(escape.file);
    expect(seen, "the escaping climb IS seen as a docs-shaped site").toBeDefined();
    expect(seen!.kind, "and it is classified as landing outside docs/").toBe("outside");
    expect(seen!.prefix).toBeNull();
    expect(docsReaders(dir).map((r) => r.file)).not.toContain(escape.file);
    // The two planted climbs that DO land inside are classified derived,
    // so `outside` is a verdict this classifier can actually reach.
    expect(climbs.filter((c) => c.kind === "derived").length).toBeGreaterThan(0);
    expect(climbs.every((c) => c.kind !== "unlinked")).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the package-relative account has no member this scan could not evaluate", () => {
  // THE SECOND TRIPWIRE, and it needs to exist separately because the
  // first one cannot reach this class: `unlinkedFiles()` looks only at
  // files holding the repository ROOT, and a file that climbs out of its
  // package directory into docs/ holds none. A climbing docs-shaped site
  // whose base `evalBase` cannot read is a reader this gate may be
  // missing, and it says so instead of going quiet.
  expect(unlinkedSites()).toEqual([]);
  const climbs = packageRelativeSites();
  expect(climbs.length, "the class is live on this tree, not hypothetical").toBeGreaterThan(0);
  expect(climbs.every((c) => c.kind === "derived")).toBe(true);
  // Every climbing site that resolved is a reader of exactly that path.
  for (const c of climbs) {
    const reader = READERS.find((r) => r.file === c.file);
    expect(reader, `${c.file} is a reader`).toBeDefined();
    expect(reader!.prefixes).toContain(c.prefix);
  }
});

/**
 * THE CLAIM, MATCHED THE WAY A COMMENT ACTUALLY CARRIES IT (T-120).
 *
 * The pin below used to read `/only (?:kind of )?file that CAN read/`
 * over `docs-scan.mjs` and nothing else, and three measured shapes
 * walked straight past it at a green suite: the same sentence WRAPPED so
 * `CAN` and `read` land on different lines, the same sentence in
 * lowercase, and the same sentence stated in `docs-gate.mjs`.
 *
 * WRAPPING IS THE LIKELY SHAPE, NOT AN EXOTIC ONE. `docs-scan.mjs` wraps
 * its comments near 72 columns, so whether those two words stay
 * contiguous is an accident of where the wrap falls — the defect that
 * actually happened had it contiguous by luck. CASE MATTERS FROM THE
 * OTHER SIDE: this file's own CORRECTED sentences are lowercase, so a
 * reintroduction written in the file's current voice would be lowercase
 * too.
 *
 * `GAP` closes both: runs of whitespace and comment-continuation `*`
 * between every word, matched case-insensitively. It cannot leap a word,
 * a `/` or a quote, so widening it costs no precision — measured on this
 * tree, it matches exactly what the narrow pin matched and nothing more.
 */
const GAP = "[\\s*]+";

/** Fresh each call: a `g` regex carries `lastIndex`, and a shared one
 *  silently answers differently on its second use. */
const universalClaim = (): RegExp =>
  new RegExp(`only${GAP}(?:kind${GAP}of${GAP})?file${GAP}that${GAP}can${GAP}read`, "gi");

/** The one file that has a legitimate place to state the universal — it
 *  holds the retraction, and the retraction QUOTES the sentence. */
const UNIVERSAL_RETRACTION_FILE = "tools/e2e/scripts/docs-scan.mjs";

/** Every other script the claim could be restated in. `docs-gate.mjs` is
 *  not hypothetical: it is where one of the corrected restatements
 *  lived, and it is the sibling the positional pin never opened. */
const UNIVERSAL_SIBLING_FILES = ["tools/e2e/scripts/docs-gate.mjs"];

test("the ledger's universal is gone, and what replaced it is checkable", () => {
  // BLOCKING 1 of T-084's verdict, surviving its own fix. The ledger
  // asserted "a file that holds this repository's root is the only kind
  // of file that CAN read this repository's docs/" — a universal, and
  // false: the live instance above holds no root. The sentence is not
  // corrected by rewording alone, so the pin is the TREE: a derived
  // reader that is not root-anchored is a counterexample the census can
  // produce, and it exists.
  const anchored = new Set(rootAnchoredFiles().map((f) => f.file));
  const unanchoredReaders = READERS.filter((r) => !anchored.has(r.file));
  expect(
    unanchoredReaders.map((r) => r.file),
    "a reader that holds no root falsifies the old universal",
  ).toContain("app/src-tauri/tests/agent_runner.rs");
  const scanner = readFileSync(path.join(repoRoot, UNIVERSAL_RETRACTION_FILE), "utf8");
  expect(scanner, "the ledger no longer claims the universal as live").toContain(
    "THE SENTENCE THAT USED TO OPEN THIS COMMENT WAS FALSE",
  );
  // AND THE RETRACTION HAS TO BE THE ONLY PLACE THIS WORDING SURVIVES,
  // IN EITHER SCRIPT — T-085's own rejection, widened by T-120. This
  // file retracted the universal in the ledger while
  // `rootAnchoredFiles()`'s comment still ASSERTED it 220 lines above:
  // the T-070-s5 shape, a live false comment, in the card that exists
  // because a stale claim shipped. `toContain` on the retraction cannot
  // see that, so the pin is POSITIONAL — and a positional pin over ONE
  // file is the shape that misses its sibling, so the sweep reads both
  // scripts with a rule of its own for each.
  const retraction = scanner.indexOf("THE SENTENCE THAT USED TO OPEN THIS COMMENT WAS FALSE");
  const positiveClaim = scanner.indexOf("WHAT IS TRUE, and all this ledger claims");
  expect(positiveClaim, "the retraction ends where the ledger's positive claim begins").toBeGreaterThan(
    retraction,
  );
  const asserted = [...scanner.matchAll(universalClaim())];
  // THE POSITIVE CONTROL, AND THE WIDENING ITSELF IS WHAT PUTS IT AT
  // RISK. The retraction QUOTES the sentence, and that quotation is the
  // only thing keeping the sweep below from being vacuous (a negative
  // assertion needs a positive control, CONVENTIONS). A matcher widened
  // until it stops matching the quotation has deleted its own control,
  // and would then pass over a tree that had lost the retraction too.
  expect(asserted.length, "the retraction quotes the sentence, so this sweep can match").toBeGreaterThan(0);
  for (const m of asserted) {
    expect(
      m.index,
      `the universal is stated at offset ${m.index}, outside the retraction that withdraws it`,
    ).toBeGreaterThan(retraction);
    expect(m.index, `the universal is stated at offset ${m.index}, past the retraction`).toBeLessThan(
      positiveClaim,
    );
  }
  // THE SIBLING SCRIPT GETS A RULE OF ITS OWN, and it has to, because
  // the window above is defined in `docs-scan.mjs` and nowhere else:
  // `docs-gate.mjs` holds no retraction and no positive claim, so it has
  // no legitimate place to state the universal at all. OUTSIDE THE
  // RETRACTION FILE, ANY OCCURRENCE IS A HIT.
  for (const rel of UNIVERSAL_SIBLING_FILES) {
    const sibling = readFileSync(path.join(repoRoot, rel), "utf8");
    expect(
      [...sibling.matchAll(universalClaim())].map((m) => m.index),
      `${rel} holds no retraction window, so it may not state the universal at all`,
    ).toEqual([]);
  }
  // WHAT THIS PIN DOES **NOT** REACH, NAMED RATHER THAN IMPLIED — which
  // is why the comment above says "THIS WORDING" and not "IT". The sweep
  // is wrap- and case-insensitive over ONE wording. `docs-scan.mjs`
  // states the same universal in a DIFFERENT one near the top of its
  // "WHAT IT CANNOT SEE" section, OUTSIDE the window, and this sweep
  // does not see it. THAT OCCURRENCE IS BENIGN AND IS KEPT: it is itself
  // a retraction and it is correct. It is asserted here so "seen and
  // kept" cannot quietly become "missed", and so the next reader fixes
  // the SWEEP's scoping rather than rewriting prose that is already
  // right.
  const other = scanner.search(new RegExp(`can${GAP}only${GAP}read${GAP}THIS${GAP}repositor`));
  expect(other, "the differently-worded retraction is still in the tree, seen and kept").toBeGreaterThan(
    -1,
  );
  expect(
    other,
    "and it sits OUTSIDE the window this pin enforces — the measured limit of its reach",
  ).toBeLessThan(retraction);
});

test("the conclusion the universal warranted is scoped wherever it is restated", () => {
  // THE PREMISE OCCURS ONCE; THE CONCLUSION IT WARRANTED IS RESTATED,
  // and every restatement needs its own scoping clause. "X is the exact
  // set of places the answer could still be short" is TRUE of the
  // ROOT-ANCHORED class and FALSE of files in general: the
  // package-relative class has no anchor to enumerate, so no list bounds
  // it and `app/src-tauri/tests/agent_runner.rs` is the live
  // counterexample. AN UNSCOPED RESTATEMENT IS THE RETRACTED UNIVERSAL
  // WEARING THE CONCLUSION'S CLOTHES — and finding those took a careful
  // read, one restatement at a time. This is that read done
  // mechanically.
  //
  // MEASURED AGAINST THE LIVE TREE BEFORE THE ARM WAS WRITTEN, because
  // an arm omitted for noise has to say so with its hit list: TWO
  // occurrences, both in `docs-scan.mjs`, both already scoped — one by
  // `ROOT-ANCHORED` 8 characters past the match and one by `THIS CLASS`
  // 4 characters past it — and NONE in `docs-gate.mjs`. Zero unscoped
  // hits, so the arm is built rather than argued away. Re-derive the
  // figures at your own ref; what is pinned is the RULE.
  const SCOPE_WINDOW = 80;
  const scoping = new RegExp(`ROOT[-\\s*]+ANCHORED|THIS${GAP}CLASS`, "i");
  const unscoped: string[] = [];
  let seen = 0;
  for (const rel of [UNIVERSAL_RETRACTION_FILE, ...UNIVERSAL_SIBLING_FILES]) {
    const source = readFileSync(path.join(repoRoot, rel), "utf8");
    for (const m of source.matchAll(new RegExp(`exact${GAP}set${GAP}of${GAP}places`, "gi"))) {
      seen += 1;
      const end = m.index + m[0].length;
      if (!scoping.test(source.slice(end, end + SCOPE_WINDOW))) {
        unscoped.push(`${rel}:${source.slice(0, m.index).split("\n").length}`);
      }
    }
  }
  // THE ARM'S OWN POSITIVE CONTROL, and it is the same shape as the
  // premise sweep's: a negative assertion over zero occurrences passes
  // for the wrong reason. A floor rather than a count — the restatements
  // may be reworded, and this stays true while any survives.
  expect(seen, "the conclusion is live in the tree, so this sweep is not vacuous").toBeGreaterThan(0);
  expect(unscoped, "every restatement of the conclusion carries its scoping word").toEqual([]);
});

test("the one by-name exclusion is load-bearing, and the spec is NOT excluded", () => {
  // token-scan.mjs's rule for the same reason: the scanner spells docs
  // sites out as SAMPLE SOURCE, so scanning it reports this gate's own
  // evidence back as a reader. An exclusion that removed nothing would
  // be decoration, so the list is ONE file and it earns its place.
  expect(DOCS_EXCLUDED_FILES).toEqual(["tools/e2e/scripts/docs-scan.mjs"]);
  for (const rel of DOCS_EXCLUDED_FILES) {
    const sites = docsSites(stripComments(readFileSync(path.join(repoRoot, rel), "utf8")));
    expect(sites.length, `${rel} would report sites if it were scanned`).toBeGreaterThan(0);
    expect(READERS.map((r) => r.file)).not.toContain(rel);
  }
  // THIS file is scanned like any other, and holds no site — which is
  // why it needs no exclusion. Both halves are asserted so the choice is
  // visible instead of being an absence.
  const self = "tools/e2e/tests/docs-input-gate.spec.ts";
  expect(DOCS_EXCLUDED_FILES).not.toContain(self);
  expect(docsSites(stripComments(readFileSync(path.join(repoRoot, self), "utf8")))).toEqual([]);
});

test("the site sample set is green, with positives, negatives and a Rust spelling", () => {
  // The sample discipline token-scan.mjs uses: fragments lexed exactly
  // as a file is, plus an evidence floor so deleting a sample cannot
  // delete its own failure (poison shape FIVE).
  const rows = siteSelftest();
  expect(rows.filter(([, ok]) => !ok).map(([what]) => what)).toEqual([]);
  expect(rows.length).toBeGreaterThan(10);
});

test("the sample set covers the two shapes that HIDE a reader", () => {
  // An evidence floor over SITE_SAMPLES, not a second copy of it: no
  // sample text lives in this file, which is what lets this spec stay
  // OUT of the by-name exclusion above. The two shapes are the ones
  // whose failure direction is a MISSING reader — a comment quoting the
  // idiom (the next person documenting a dogfood body writes exactly
  // that) and a regex literal carrying a quote or a backtick (which
  // opens a fake string and swallows the site after it).
  const texts = SITE_SAMPLES.map((sample) => sample.text);
  expect(texts.some((t) => t.trimStart().startsWith("//"))).toBe(true);
  expect(texts.some((t) => t.trimStart().startsWith("/*"))).toBe(true);
  const withRegex = SITE_SAMPLES.filter(
    (sample) => sample.text.includes("/g;") && sample.sites.length > 0,
  );
  expect(withRegex, "a regex literal followed by a REAL site").not.toEqual([]);
});

// ── 2. the documented trigger ─────────────────────────────────────────

test("every suite command this gate names is in CONVENTIONS' own command bullet", () => {
  // The doc is the only place a command is written down (T-045). This
  // gate declares four; each must appear, backticked, in the `run from
  // <dir>/:` bullet for its own package.
  for (const suite of SUITES) {
    const bullet = conventionsBullet(CONVENTIONS, `run from ${suite.dir}/:`);
    expect(bullet, `${suite.dir} bullet lists \`${suite.command}\``).toContain(
      `\`${suite.command}\``,
    );
  }
});

test("the DOCS GATE bullet names exactly the commands the derivation produces", () => {
  // BOTH directions, the shape workflow-parity established: a command
  // the doc gains that the tree does not produce reds, and so does one
  // the tree produces that the doc stops naming.
  const derived = [...new Set(READERS.map((r) => `${r.command} from ${r.suite}/`))].sort();
  const quoted = [...DOCS_GATE_BULLET!.matchAll(/`([^`]+ from [^`]+\/)`/g)].map((m) => m[1]!);
  expect([...new Set(quoted)].sort()).toEqual(derived);
});

test("the DOCS GATE bullet points at the derivation rather than restating it", () => {
  expect(DOCS_GATE_BULLET).toContain("tools/e2e/scripts/docs-gate.mjs");
  expect(DOCS_GATE_BULLET).toContain("docs-scan.mjs");
});

// ── 3. the gate's answer ──────────────────────────────────────────────

test("a docs-only diff with NO code file in it fires the gate and names the suites", () => {
  // The card's own criterion, as a pin: a diff containing no code file
  // at all still owes work, which is precisely what both standing
  // triggers say it does not.
  const diff = ["docs/tasks/T-999-a-planted-card.md"];
  expect(diff.every((p) => p.startsWith("docs/"))).toBe(true);
  const gate = docsGate(diff, READERS);
  expect(gate.fires).toBe(true);
  expect(gate.commands).toContain("npm test from app/");
  expect(gate.commands).toContain("npx vitest run from lib/parser/");
  expect(gate.commands).toContain("npm test from tools/e2e/");
});

test("a code-only diff does not fire this gate — it is the other two gates' business", () => {
  const gate = docsGate(["app/src/main.tsx", "app/src-tauri/src/lib.rs"], READERS);
  expect(gate.fires).toBe(false);
  expect(gate.docsPaths).toEqual([]);
  expect(gate.commands).toEqual([]);
});

test("the answer is PROPORTIONAL — that is what keeps the trigger obeyable", () => {
  // The over-fire trap the card names is real, and the escape from it is
  // not a narrower trigger but a narrower ANSWER. Every path under docs/
  // reaches a reader on this tree, because two lane specs walk the whole
  // of it; what changes is how much you owe.
  const room = docsGate(["docs/rooms/2026-08-20-a-question.md"], READERS);
  const conventions = docsGate(["docs/CONVENTIONS.md"], READERS);
  const card = docsGate(["docs/tasks/T-999-x.md"], READERS);
  expect(room.commands).toEqual(["npm test from tools/e2e/"]);
  expect(conventions.commands).toEqual(["cargo test from app/src-tauri/", "npm test from tools/e2e/"]);
  expect(card.commands.length).toBeGreaterThan(room.commands.length);
  expect(conventions.commands).not.toContain("npm test from app/");
});

test("a path names the readers that read it, not a generic list", () => {
  const gate = docsGate(["docs/CONVENTIONS.md"], READERS);
  expect(gate.byPath).toHaveLength(1);
  expect(gate.byPath[0]!.readers).toContain("app/src-tauri/src/agent/kit.rs");
  expect(gate.byPath[0]!.readers).toContain("tools/e2e/tests/workflow-parity.spec.ts");
  expect(gate.byPath[0]!.readers).not.toContain("app/test/architecture-dogfood.test.ts");
});

test("the hand-run gate's exit codes hold, and an EMPTY path list is 2 and not 0", () => {
  // T-084-s6, as a pin, driving the real binary the way an integrator
  // does. A range command that FAILED arrives here as zero paths and was
  // answered "this gate is not owed" at exit 0. A gate that reports CLEAN
  // because it was told nothing is the exact costume T-084-s6 exists to
  // strip off silence.
  //
  // THE PREMISE THIS COMMENT USED TO CARRY WAS FALSE AND IS CORRECTED
  // (T-090, absorbing T-061-s3). It said "the documented invocation pipes
  // a range through `xargs`, and BSD `xargs` runs the utility once even
  // when its input is empty". Both halves are wrong on this platform:
  // BSD `xargs` NEVER runs the utility on empty input — measured with an
  // on-disk marker, so "did it run" is observed and not inferred — which
  // means the exit-2 remedy below was UNREACHABLE through the very
  // invocation the doc printed, arrived at by the opposite mechanism from
  // the one this comment described. The doc no longer prints a pipe, the
  // matrix below is why, and the empty-list trap is re-proved against the
  // new spelling three bodies down.
  const run = (args: string[]): { code: number; out: string } => {
    try {
      const out = execFileSync("node", ["tools/e2e/scripts/docs-gate.mjs", ...args], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { code: 0, out };
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? -1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  };
  const empty = run([]);
  expect(empty.code, "no paths is CALLED WRONG, never a clean gate").toBe(2);
  expect(empty.out).toContain("NO PATHS GIVEN");
  expect(empty.out).toContain("a range that produced nothing");
  expect(run(["--range", "a..b"]).code, "a range is still refused").toBe(2);
  expect(run(["app/src/main.tsx"]).code, "a code-only diff owes nothing here").toBe(0);
  expect(run(["docs/ROADMAP.md"]).code, "a docs path with a reader has a verdict").toBe(1);
  const census = run(["--census"]);
  expect(census.code, "--census reports and judges no diff").toBe(0);
  expect(census.out).toContain("docs-gate: census —");
  expect(census.out).toContain("no diff judged");
});

// ── 3b. the path vocabulary and the four codes (T-090) ────────────────

/** The gate, run for real from a chosen directory, with a chosen PATH.
 *  `process.execPath` rather than "node", so the child still starts when
 *  the environment is stripped to produce a GATE COULD NOT RUN. */
function runGate(
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): { code: number; out: string } {
  const script = path.join(repoRoot, "tools", "e2e", "scripts", "docs-gate.mjs");
  try {
    const out = execFileSync(process.execPath, [script, ...args], {
      cwd: opts.cwd ?? repoRoot,
      env: opts.env ?? process.env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? -1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

test("EVERY SPELLING of one docs path answers the same, or is REFUSED — never `not owed`", () => {
  // T-101-s3 and T-064-s7, absorbed by T-090 and pinned here. The gate
  // matched `docs/`-prefixed strings and nothing else, so four other
  // spellings of a file that owes two suites were answered "none under
  // docs/ — this gate is not owed" at exit 0. Measured at 9b03ae6 before
  // the fix; each row below is one of those measurements, kept.
  //
  // THE DISTINCTION THIS DEFENDS is the gate's whole reason for having
  // four codes: "I looked and nothing is owed" must never wear the same
  // number as "I could not tell what you asked about".
  const OWED = "docs/CONVENTIONS.md";
  const e2e = path.join(repoRoot, "tools", "e2e");

  // ANSWERED — the same verdict as the root-relative spelling, 1.
  expect(runGate([OWED]).code, "root-relative, the RANGE RULE's own form").toBe(1);
  expect(runGate([`./${OWED}`]).code, "./ prefixed — T-101-s3").toBe(1);
  expect(runGate([path.join(repoRoot, OWED)]).code, "absolute — T-101-s3").toBe(1);
  expect(
    runGate([`../../${OWED}`], { cwd: e2e }).code,
    "../../ from tools/e2e, where the two neighbouring commands are run — T-101-s3",
  ).toBe(1);
  // ...and the normalisation SHOWS ITS WORK, because one that answers
  // correctly and silently is one an operator cannot check.
  expect(runGate([`./${OWED}`]).out).toContain(`./${OWED}  ->  ${OWED}`);

  // REFUSED — called wrong, and never a clean gate.
  expect(runGate([""]).code, "an empty argument is a list of length ONE — T-064-s7").toBe(2);
  expect(runGate(["   "]).code, "a blank argument, same shape").toBe(2);
  expect(
    runGate([`${OWED}\ndocs/ROADMAP.md`]).code,
    'a QUOTED substitution hands the whole list over as one blob — T-064-s7',
  ).toBe(2);
  expect(runGate(["/etc/passwd"]).code, "a path outside this repository").toBe(2);
  expect(
    runGate([OWED], { cwd: e2e }).code,
    "a PLAIN relative path away from the root is ambiguous, and is refused rather than guessed",
  ).toBe(2);

  // THE MESSAGES NAME THE MECHANISM, not just the refusal — this gate's
  // whole complaint about silence is that a code without a cause makes
  // the reader guess.
  expect(runGate([""]).out).toContain("empty or blank");
  expect(runGate([`${OWED}\ndocs/ROADMAP.md`]).out).toContain("newline-joined blob");
  expect(runGate([OWED], { cwd: e2e }).out).toContain("PLAIN RELATIVE");
  expect(runGate([OWED], { cwd: e2e }).out, "both readings are printed").toContain(
    "tools/e2e/docs/CONVENTIONS.md",
  );

  // A COVERAGE FLOOR, not a printed count: both verdicts are exercised
  // and every refusal shape reaches USAGE. Without this, deleting a row
  // above would shrink the drill silently.
  const answered = [OWED, `./${OWED}`, path.join(repoRoot, OWED)].map((s) => runGate([s]).code);
  expect(new Set(answered), "every answered spelling gives ONE verdict").toEqual(new Set([1]));
  const refused = ["", "   ", `${OWED}\nx`, "/etc/passwd"].map((s) => runGate([s]).code);
  expect(refused.length, "four refusal shapes, each measured").toBe(4);
  expect(new Set(refused)).toEqual(new Set([2]));
});

test("THE EXIT MATRIX — all four codes survive the invocation the doc prints", () => {
  // THE CARD'S CENTRAL CRITERION. For each of 0, 1, 2, 3: produce it
  // deliberately, run what CONVENTIONS' DOCS GATE bullet prints, and read
  // the code the reader observes. The doc prints a spelling with no
  // `xargs` in it, and this body is the demonstration that the spelling
  // carries the contract — measured, not argued.
  //
  // WHY NO `xargs` COLUMN IS ASSERTED HERE: a pipe destroys 2 and 3 on
  // BSD (empty input never invokes the utility, so 2 arrives as 0; every
  // nonzero exit collapses to 1) and destroys them differently on GNU
  // (1–125 become 123). A matrix over a spelling the doc does not print
  // would pin behaviour nobody should rely on; what is pinned is the
  // spelling that WORKS, and CONVENTIONS carries the comparison.
  const cases: { code: number; meaning: string; run: () => { code: number; out: string } }[] = [
    {
      code: 0,
      meaning: "ran, nothing owed",
      run: () => runGate(["app/src/main.tsx"]),
    },
    {
      code: 1,
      meaning: "ran and FOUND something",
      run: () => runGate(["docs/ROADMAP.md"]),
    },
    {
      code: 2,
      meaning: "called wrong",
      run: () => runGate([]),
    },
    {
      code: 3,
      meaning: "the gate COULD NOT RUN",
      // Every throw out of docs-scan.mjs lands on 3. `trackedFiles`
      // shells out to git, so a PATH with no git in it is the cheapest
      // honest way to make this gate unable to answer — it is a claim
      // about the gate, not about the tree, which is what 3 means.
      run: () => runGate(["docs/ROADMAP.md"], { env: { ...process.env, PATH: "/nonexistent-dir" } }),
    },
  ];

  const observed = new Map<number, number>();
  for (const c of cases) {
    const result = c.run();
    observed.set(c.code, result.code);
    expect(result.code, `${c.code} (${c.meaning}) must reach the reader as ${c.code}`).toBe(c.code);
  }

  // A COVERAGE FLOOR over the CONTRACT, not a printed tally: all four
  // codes are exercised and each arrives as itself. A body that measured
  // three of them and said "the matrix holds" is the shape this asserts
  // against.
  expect(new Set(observed.keys()), "all four codes exercised").toEqual(new Set([0, 1, 2, 3]));
  expect([...observed.entries()].filter(([want, got]) => want !== got)).toEqual([]);

  // And each code's OUTPUT distinguishes it, because the standing advice
  // in CONVENTIONS is READ THE MESSAGE, NOT THE CODE.
  expect(cases[2]!.run().out).toContain("NO PATHS GIVEN");
  expect(cases[3]!.run().out).toContain("GATE COULD NOT RUN");
  expect(cases[3]!.run().out).toContain("not a claim about the tree");
});

test("THE EMPTY-LIST TRAP, re-proved against the new spelling, with a PLANTED POSITIVE", () => {
  // T-084-s6's remedy was unreachable through the invocation the doc
  // printed: BSD `xargs` never invokes the utility on empty input, so a
  // FAILED range exited 0 with the gate never running. This drives the
  // spelling the doc prints NOW, through a real shell, so the command
  // substitution is the real thing rather than a description of one.
  const sh = (script: string): { code: number; out: string } => {
    try {
      const out = execFileSync("/bin/sh", ["-c", script], {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { code: 0, out };
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string };
      return { code: e.status ?? -1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
    }
  };
  const gate = `"${process.execPath}" tools/e2e/scripts/docs-gate.mjs`;

  // THE PLANTED POSITIVE, and the criterion's own words: a range command
  // that FAILS, fed to the documented invocation, must reach the reader
  // as a non-zero code that is not "not owed". The rev does not exist, so
  // `git diff` fails, so the substitution is empty.
  const failedRange = sh(`${gate} $(git diff --name-only no-such-rev-90 HEAD 2>/dev/null)`);
  expect(failedRange.code, "a FAILED range must not read as a clean gate").not.toBe(0);
  expect(failedRange.code, "it reads as CALLED WRONG").toBe(2);
  expect(failedRange.out).toContain("NO PATHS GIVEN");
  expect(failedRange.out).toContain("a range that produced nothing");

  // THE CONTROL THE NEGATIVE NEEDS. Without it, a typo in the script
  // above — a mis-spelled path, a shell that never ran the gate at all —
  // also produces "not 0", and the assertion passes for the wrong
  // reason. Same spelling, a range that SUCCEEDS and names a docs path.
  //
  // THE RANGE IS DETERMINISTIC AND THE FIRST ONE WAS NOT, which this
  // lane's own drill caught. It read `HEAD~1 HEAD`, which names whatever
  // the previous commit happened to touch: green at the commit the first
  // drill ran at (a CONVENTIONS edit) and RED at the next one (a
  // spec-only edit), where the gate answered "not owed" at 0 and was
  // right to. The EMPTY TREE against HEAD, restricted to one path, names
  // that path at every commit this repository will ever have.
  const emptyTree = "$(git hash-object -t tree /dev/null)";
  const realRange = sh(`${gate} $(git diff --name-only ${emptyTree} HEAD -- docs/ROADMAP.md)`);
  expect(realRange.code, "a range that SUCCEEDS still reaches a verdict").toBe(1);
  expect(realRange.out).toContain("docs-gate: FIRES");

  // And a range that succeeds with NO docs path in it is the third arm:
  // a real answer of "nothing owed", so exit 0 still means something.
  const codeOnly = sh(`${gate} $(echo app/src/main.tsx)`);
  expect(codeOnly.code, "0 is still reachable, or the gate is just a red light").toBe(0);
  expect(codeOnly.out).toContain("this gate is not owed");

  // THE PIPE, MEASURED ONCE PER DIALECT, so the doc's claim is held by a
  // body and not only by a paragraph — and so that the body says which
  // `xargs` it measured.
  //
  // THIS ARM USED TO ENCODE BSD AND RED ON LINUX (T-153-s6; CI runs
  // 33259394002 and 33260414204, where it observed 123 against a written
  // 0). The finding was better than a broken test: the documented hazard
  // is PLATFORM-SCOPED. Under BSD `xargs` the pipe really does report a
  // clean gate for a failed range, because the utility is never invoked
  // on empty input. Under GNU `xargs` the utility IS invoked, so the
  // gate's own empty-list refusal — the trap this very test celebrates —
  // fires, and the pipeline reports its exit through GNU's 1–125 → 123
  // mapping. The pipe is still the wrong spelling on both: one hides the
  // failure, the other destroys the code's identity.
  //
  // The dialect is PROBED (`scripts/xargs-dialect.mjs`), never inferred
  // from `process.platform`, because the question is what the `xargs` on
  // this PATH does. Skipped where `xargs` is absent rather than asserted
  // blind.
  const probe = probeXargs();
  if (probe.present) {
    // THE TWO EXPECTATIONS, WRITTEN SIDE BY SIDE, because the DIVERGENCE
    // is the thing being pinned. `gateRan` is the substantive half: it is
    // what makes "the pipe hides a failed range" a claim about BSD rather
    // than about pipes.
    const EXPECTED: Record<string, { code: number; gateRan: boolean; says: string }> = {
      bsd: { code: 0, gateRan: false, says: "the pipe reports a clean gate for a failed range" },
      gnu: {
        code: 123,
        gateRan: true,
        says: "the gate RUNS on the empty list, refuses it, and 2 arrives as GNU's 123",
      },
    };

    // TWO-SIDED, so normalising the platforms away cannot pass quietly:
    // the two rows must disagree on BOTH observables, and the table must
    // name exactly the dialects the prober knows. Collapse either side
    // and this reds before any measurement is taken.
    expect(dialectsDiverge((d) => d.runsUtilityOnEmptyInput), "the dialects must differ").toBe(true);
    expect(new Set(Object.keys(EXPECTED))).toEqual(new Set(Object.keys(XARGS_DIALECTS)));
    expect(new Set(Object.values(EXPECTED).map((e) => e.code)).size, "the codes differ").toBe(2);
    expect(new Set(Object.values(EXPECTED).map((e) => e.gateRan)).size, "and so does whether the gate ran").toBe(2);

    // A THIRD DIALECT REDS RATHER THAN TAKING WHICHEVER BRANCH WAS
    // WRITTEN FIRST — the failure this body is a repair of.
    const want = EXPECTED[probe.name];
    expect(
      want,
      `this machine's xargs matches no dialect this spec has measured — ${probe.evidence}. ` +
        "Measure it, add its row to XARGS_DIALECTS and its column to the DOCS GATE " +
        "bullet's matrix; do not widen an expectation until it fits.",
    ).toBeDefined();
    if (want === undefined) return;

    const piped = sh(`git diff --name-only no-such-rev-90 HEAD 2>/dev/null | xargs ${gate}`);
    expect(piped.code, `${probe.name}: ${want.says} (${probe.evidence})`).toBe(want.code);
    expect(
      piped.out.includes("docs-gate:"),
      `${probe.name}: whether the gate RAN at all is the mechanism, not the code`,
    ).toBe(want.gateRan);
    if (want.gateRan) {
      expect(piped.out, "and what it says is its own empty-list refusal").toContain(
        "NO PATHS GIVEN",
      );
    }
  }
});

test("ONE SPELLING, TWO PLACES — the doc and the script print the same recipe", () => {
  // T-057 as a pin rather than as a hope. The DOCS GATE bullet and
  // `docs-gate.mjs`'s header each print the invocation an integrator is
  // to run, and for six weeks they printed DIFFERENT ones: the doc said
  // call it directly, the script's own header said pipe it through
  // `xargs` — the very pipe that destroys the codes the script exists to
  // distinguish. A recipe in two places is two chances to disagree, and
  // this is the body that makes the second chance cost something.
  const script = readFileSync(
    path.join(repoRoot, "tools", "e2e", "scripts", "docs-gate.mjs"),
    "utf8",
  );
  // The recipe, lifted from each side by its own comment/indent
  // convention and compared as text. Anchored on the gate's own
  // invocation line rather than on a whole block, so reflowing prose
  // around it does not red this.
  const recipe = (text: string, strip: RegExp): string[] =>
    text
      .split("\n")
      .filter((l) => l.includes("docs-gate.mjs $(git diff") || l.includes("TREE=$(git merge-tree"))
      .map((l) => l.replace(strip, "").trim());

  // THE DOC SIDE IS SCOPED TO THE DOCS GATE BULLET, and finding out why
  // is worth the two lines: the RANGE RULE's own table three hundred
  // lines up states the merge-tree half too, correctly, in its own
  // typography. An unscoped filter reads that row as a third copy of the
  // recipe and reds — which is a false alarm about a real property, the
  // most expensive kind. `conventionsBullet` cannot be used here because
  // it normalises whitespace, and this body compares LINES.
  const start = CONVENTIONS.indexOf("- DOCS GATE (T-084");
  expect(start, "the DOCS GATE bullet is found by its own opening").toBeGreaterThan(-1);
  const rest = CONVENTIONS.slice(start + 1);
  const end = rest.indexOf("\n- ");
  const bulletRaw = end === -1 ? rest : rest.slice(0, end);

  const fromScript = recipe(script, /^\s*\*\s?/);
  const fromDoc = recipe(bulletRaw, /^\s*/);

  expect(fromScript.length, "the script's header prints the recipe").toBe(2);
  expect(fromDoc, "the doc prints the SAME two lines").toEqual(fromScript);

  // AND NEITHER PRINTS THE DESTRUCTIVE FORM. The whole card is that a
  // pipe through `xargs` eats two of the four codes, differently on each
  // platform — so the recipe must not merely agree, it must agree on a
  // spelling that carries the contract.
  for (const line of fromScript) {
    expect(line, "the printed recipe pipes through nothing").not.toMatch(/\|\s*xargs/);
  }
  expect(DOCS_GATE_BULLET, "and the bullet says why, so nobody re-adds it").toContain("xargs");
});

test("THE `EXIT` OBJECT IS THE SINGLE AUTHORITY — the npm script re-types no numbers", () => {
  // The rule the token lint already lives under (T-078/T-080), applied to
  // the new script: the codes are owned by the frozen object beside the
  // gate that produces them, and every other place POINTS at it. A number
  // in package.json would be a second authority, and the two would
  // disagree the first time a code was added.
  const pkg = JSON.parse(
    readFileSync(path.join(repoRoot, "tools", "e2e", "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };
  const script = pkg.scripts["lint:docs"];
  expect(script, "the DOCS GATE is a named command (T-084-s2)").toBeDefined();
  expect(script).toContain("scripts/docs-gate.mjs");
  // No exit code, and no shell doing arithmetic on one: the script's only
  // job is to start the gate and let its status propagate.
  expect(script, "no re-typed exit code").not.toMatch(/\d/);
  expect(script, "no shell chaining that could rewrite the status").not.toMatch(/[|;&]|\bexit\b/);

  const source = readFileSync(
    path.join(repoRoot, "tools", "e2e", "scripts", "docs-gate.mjs"),
    "utf8",
  );
  // ONE frozen declaration, naming all four codes.
  const decls = [...source.matchAll(/Object\.freeze\(\{[^}]*CLEAN[^}]*\}\)/g)];
  expect(decls.length, "exactly one EXIT declaration").toBe(1);
  for (const name of ["CLEAN: 0", "FOUND: 1", "USAGE: 2", "CANNOT_RUN: 3"]) {
    expect(decls[0]![0], `EXIT names ${name}`).toContain(name);
  }
  // And nothing else in the file exits on a bare number — every return
  // and every process.exit goes through the object.
  expect(source, "no numeric literal reaches process.exit").not.toMatch(/process\.exit\(\s*\d/);
  expect(source.match(/return EXIT\./g)?.length ?? 0, "the returns go through EXIT").toBeGreaterThan(
    2,
  );
});

// ── 4. the frontmatter vocabulary ─────────────────────────────────────

test("the status vocabulary is READ from the parser, never restated here", () => {
  const source = readFileSync(path.join(repoRoot, TASK_STATUS_SOURCE), "utf8");
  expect(source).toContain("export const TASK_STATUSES");
  for (const status of STATUSES) expect(source).toContain(`'${status}'`);
  // Eight today. The number is asserted as a FLOOR of one and pinned by
  // the parser's own source above — a ninth status added there is
  // honoured here with no edit, which is the whole point of reading it.
  expect(STATUSES.length).toBeGreaterThan(0);
  expect(STATUSES).toContain("suggested");
  expect(STATUSES).not.toContain("closed");
});

test("the frontmatter delimiters are transcribed from the parser and still match it", () => {
  // frontmatterBlock reimplements two regexes from
  // lib/parser/src/frontmatter.ts. That is one implementation more than
  // T-057 likes, so the transcription is PINNED against its original:
  // move either delimiter there and this reds by name.
  const source = readFileSync(path.join(repoRoot, "lib/parser/src/frontmatter.ts"), "utf8");
  expect(source).toContain("/^\\uFEFF?---\\r?\\n/");
  // Split so this line does not itself carry `-[`, which is the token
  // lint's P1 shape: CI's first step reads this file too.
  expect(source).toContain("/^---" + "[ \\t]*(?:\\r?\\n|$)/m");
  expect(frontmatterBlock("---\nid: T-1\n---\n\nbody\n")).toBe("id: T-1\n");
  expect(frontmatterBlock("no frontmatter here\n")).toBeNull();
  expect(frontmatterBlock("---\nid: T-1\nnever closed\n")).toBeNull();
});

test("`status: closed` fails loudly, names the FILE and the FIELD, and carries the ruling", () => {
  // THE SECOND INCIDENT, as a pin. `fede266` filed a finding with
  // `status: closed`; `npm test` from app/ went 830/831 on a commit
  // whose entire diff was one markdown file, and the failure named the
  // file only inside a deep-equality diff nobody re-ran.
  const file = "docs/tasks/T-999-s1-a-finding-resolved-elsewhere.md";
  const issues = taskCardIssues(
    [{ path: file, content: card("id: T-999-s1\ntitle: A finding\nstatus: closed") }],
    { statuses: STATUSES, parseYaml },
  );
  expect(issues).toHaveLength(1);
  expect(issues[0]!.kind).toBe("invalid-field");
  expect(issues[0]!.file).toBe(file);
  expect(issues[0]!.field).toBe("status");
  expect(issues[0]!.value).toBe("closed");
  expect(issues[0]!.message).toContain(file);
  expect(issues[0]!.message).toContain(STATUSES.join(" | "));
  // THE RULING, at the point of failure rather than in a doc nobody
  // opens while writing a finding: `closed` is a DISPOSITION, and
  // disposition belongs to triage.
  expect(issues[0]!.message).toContain(DISPOSITION_RULING);
  expect(issues[0]!.nearMiss).toEqual([]);
});

test("a genuine typo gets a near miss; `closed` gets the ruling because it is not one", () => {
  // A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL. "`closed` has no near
  // miss" is satisfied equally by a working hint that finds nothing and
  // by a hint that never runs, so the positive proves the hint works.
  expect(nearMisses("plannd", STATUSES)).toEqual(["planned"]);
  expect(nearMisses("done", STATUSES)).toEqual(["done"]);
  expect(nearMisses("closed", STATUSES)).toEqual([]);
  const typo = taskCardIssues(
    [{ path: "docs/tasks/T-998-x.md", content: card("id: T-998\ntitle: T\nstatus: plannd") }],
    { statuses: STATUSES, parseYaml },
  );
  expect(typo[0]!.message).toContain("did you mean planned?");
  expect(typo[0]!.message).not.toContain(DISPOSITION_RULING);
});

test("a title opening with a backtick is a named yaml-error, not a shorter board", () => {
  // THE FIRST INCIDENT, as a pin. A YAML plain scalar may not open with
  // a reserved indicator, so two cards were unparseable at `9c64cd8`.
  // Nothing errored: the board got SHORTER and it surfaced as
  // `Expected "60" / Received "62"` in four bodies about scroll
  // containment. The title is assembled from a character code so this
  // file cannot itself become the thing it is testing.
  const tick = String.fromCharCode(96);
  const file = "docs/tasks/T-997-s1-unparseable.md";
  const issues = taskCardIssues(
    [{ path: file, content: card(`id: T-997-s1\ntitle: ${tick}file --mime${tick} is not the gate\nstatus: suggested`) }],
    { statuses: STATUSES, parseYaml },
  );
  expect(issues).toHaveLength(1);
  expect(issues[0]!.kind).toBe("yaml-error");
  expect(issues[0]!.file).toBe(file);
  expect(issues[0]!.message).toContain("reserved indicator");
  // and the same title QUOTED parses, which is the fix the incident took
  const fixed = taskCardIssues(
    [{ path: file, content: card(`id: T-997-s1\ntitle: "${tick}file --mime${tick} is not the gate"\nstatus: suggested`) }],
    { statuses: STATUSES, parseYaml },
  );
  expect(fixed).toEqual([]);
});

test("a legal card reports nothing, and a path the parser does not collect is not judged", () => {
  const legal = card("id: T-996\ntitle: A card\nstatus: planned");
  expect(taskCardIssues([{ path: "docs/tasks/T-996-x.md", content: legal }], {
    statuses: STATUSES,
    parseYaml,
  })).toEqual([]);
  // The parser's live walk is FLAT and non-recursive (THE FOUR WALKS,
  // row four), and `docs/tasks/rejected/` keeps `status: rejected` by
  // ratified design — judging it would red the archive.
  expect(isTaskCardPath("docs/tasks/rejected/T-900-nope.md")).toBe(false);
  expect(isTaskCardPath("docs/tasks/NOTES.md")).toBe(false);
  expect(isTaskCardPath("docs/architecture/components/C-05-app.md")).toBe(false);
  expect(isTaskCardPath("docs/tasks/T-084-x.md")).toBe(true);
  expect(
    taskCardIssues([{ path: "docs/tasks/rejected/T-900.md", content: card("status: closed") }], {
      statuses: STATUSES,
      parseYaml,
    }),
  ).toEqual([]);
});

test("every live task card parses, with a status in the vocabulary", () => {
  // THE DOGFOOD, and the assertion that would have caught both
  // incidents at the edit instead of three layers away. It names the
  // FILE; the count in a scroll-containment body never could.
  const cards = liveTaskCards();
  expect(cards.length, "the live tree really does hold task cards").toBeGreaterThan(50);
  expect(taskCardIssues(cards, { statuses: STATUSES, parseYaml })).toEqual([]);
});

// ── 5. what was deliberately left alone ───────────────────────────────

test(".nputerignore still excludes docs/ — the indexer is not the gate that missed this", () => {
  // Stated as an assertion rather than as prose, because "we decided"
  // and "we forgot" look identical in an absent list. `index --check`
  // gates the GRAPH; the graph is code-derived and docs/ is not code, so
  // indexing docs/ would be wrong AND would not have caught either
  // incident. This gate exists because that exclusion is correct.
  const ignore = readFileSync(path.join(repoRoot, ".nputerignore"), "utf8");
  expect(ignore.split(/\r?\n/).map((l) => l.trim())).toContain("docs/");
});
