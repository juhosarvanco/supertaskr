import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { repoRoot } from "../preflight";
import {
  CALL_SAMPLES,
  DISPOSITION_RULING,
  DOCS_EXCLUDED_FILES,
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
  rootAnchoredFiles,
  stripComments,
  suitesOwedForAllOfDocs,
  taskCardIssues,
  taskStatuses,
  unaccountedRootAnchors,
  unlinkedFiles,
} from "../scripts/docs-scan.mjs";

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
  expect(census.anchoredSites).toBeGreaterThan(0);
  expect(census.anchoredFiles).toBeGreaterThan(0);
  expect(census.anchoredSites, "root-anchored is a small share of docs-shaped").toBeLessThan(
    census.sites / 2,
  );
  // Internal consistency: every file with a root-anchored SITE is a
  // derived reader, and the reader set is at least that big — the call
  // arm can only add.
  expect(READERS.length).toBeGreaterThanOrEqual(census.anchoredFiles);
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
  // does. The documented invocation pipes a range through `xargs`, and
  // BSD `xargs` runs the utility once even when its input is empty — so
  // a range command that FAILED arrived here as zero paths and was
  // answered "this gate is not owed" at exit 0. A gate that reports
  // CLEAN because it was told nothing is the exact costume this card
  // exists to strip off silence.
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
