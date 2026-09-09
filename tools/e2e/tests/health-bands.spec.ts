import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { repoRoot } from "../preflight";
import { DOC_BUDGETS, taskStatuses } from "../scripts/docs-scan.mjs";
import { STANDING_BANDS, allBands, docHeadroomBands } from "../scripts/health-bands.config.mjs";
import {
  EXIT,
  evaluate,
  evaluateBand,
  findingCard,
  nextSuggestionId,
  parseE2eSeconds,
  parseGraphHeadroom,
  parseLibSuiteSeconds,
  readingsFromOutput,
  readingsFromTree,
  renderReport,
  validateBands,
} from "../scripts/health-bands.mjs";

/**
 * THE METHOD'S OWN HEALTH BANDS (T-156) — no browser.
 *
 * ADR-020 decision 3. The bands this pins were applied BY EYEBALL before
 * the script existed, so the interesting failures are not "does it
 * compare two numbers" — they are the three ways a health reporter goes
 * quietly wrong:
 *
 *   1. IT REPORTS A BAND AS HOLDING THAT IT NEVER READ. The single
 *      worst outcome available to this command, because it is
 *      indistinguishable from good news. Pinned in §UNREAD.
 *   2. ITS THRESHOLDS DRIFT FROM THE MEASUREMENTS THAT SET THEM, until
 *      nobody can say why a limit is where it is. Pinned in §MEASURED.
 *   3. ITS PARSERS DRIFT FROM THE TOOLS THEY PARSE, so a band goes
 *      silently UNREAD after somebody reformats a line in another
 *      package. Pinned in §AUTHORITIES, against the producing source.
 *
 * ── HOW TO READ A FAILURE ────────────────────────────────────────────
 * A §AUTHORITIES body reddening means the OTHER package moved: read the
 * cited symbol (`budget_line` in check.rs, Playwright's list reporter),
 * then fix the parser here. It does not mean this suite is wrong.
 *
 * A §MEASURED body reddening means somebody changed a limit without
 * saying what measured it. The remedy is the measurement, never the
 * assertion — `health-bands.config.mjs` says so at more length.
 */

const runCmd = path.join(repoRoot, "tools/e2e/scripts/health-bands-run.mjs");

/** @returns the command's exit code, stdout and stderr, run from the repo root. */
function runHealth(args: string[]): { code: number; out: string; err: string } {
  const r = spawnSync(process.execPath, [runCmd, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  return { code: r.status ?? -1, out: r.stdout ?? "", err: r.stderr ?? "" };
}

// ── §UNREAD ──────────────────────────────────────────────────────────

test("a band whose authority was not read is UNREAD at exit 3 and is never counted as holding", () => {
  // The command with no --readings has not run cargo and has not run the
  // lane, so the three bands that parse another tool's output cannot be
  // read. The property is exact: the count of `inside` must not include
  // them, and the exit code must be CANNOT_RUN rather than CLEAN.
  const { code, out, err } = runHealth([]);
  const all = `${out}\n${err}`;
  expect(code).toBe(EXIT.CANNOT_RUN);
  expect(all).toContain("COULD NOT BE READ");
  expect(all).toContain("this run is not a claim that they hold");
  for (const id of ["graph/budget-headroom-bytes", "suite/lib-seconds", "suite/e2e-seconds"]) {
    expect(all).toContain(id);
  }
  // A run that could not read three bands must never print a sentence a
  // reader can skim as "all good".
  expect(all).not.toMatch(/bands hold|all bands (are )?inside|health-bands: OK/i);
});

test("EXIT 3 TAKES PRECEDENCE OVER A BREACH — a partial run is not a claim about the tree", () => {
  // The dangerous ordering is the other one: a command that reports
  // FOUND while three of its bands went unread has quietly converted "I
  // could not tell you" into "here is my answer".
  const breached = evaluateBand(STANDING_BANDS[0]!, { value: -1, derivation: "planted" });
  const unread = evaluateBand(STANDING_BANDS[1]!, undefined);
  expect(breached.state).toBe("breached");
  expect(unread.state).toBe("unread");
  const { code, lines } = renderReport([breached, unread]);
  expect(code).toBe(EXIT.CANNOT_RUN);
  // ...and the breach is still SAID. Precedence governs the code, never
  // the report: swallowing the finding would be the same defect wearing
  // the opposite costume.
  expect(lines.join("\n")).toContain("BREACHED");
});

test("a band with no keeper at all is UNKEPT, is named on every run, and costs the run exit 3", () => {
  // docs/NORTH_STAR.md fixed cold-start pass rate, drift incidents and
  // rejection-rate-by-size on 2026-08-14 and nothing has ever derived
  // one. A reporter that simply omitted them would leave them exactly as
  // invisible as they have been.
  const unkept = allBands(DOC_BUDGETS).filter((b) => b.authority.kind === "none");
  expect(unkept.length).toBeGreaterThanOrEqual(4);
  const { code, lines } = renderReport(unkept.map((b) => evaluateBand(b, undefined)));
  expect(code).toBe(EXIT.CANNOT_RUN);
  const text = lines.join("\n");
  expect(text).toContain("NO KEEPER");
  for (const b of unkept) {
    expect(text).toContain(b.id);
    // Every unkept band says what WOULD give it one, or the declaration
    // is a shrug with a name on it.
    expect(b.authority.keeper ?? "").not.toBe("");
  }
});

// ── §MEASURED ────────────────────────────────────────────────────────

test("every band carries its measured reason, and the config REFUSES to load without one", () => {
  // Acceptance criterion 3, the max_graph_bytes pattern: a number states
  // what measured it. This is the half that makes it a property — the
  // config cannot be changed quietly, because a band stripped of its
  // reason stops the command rather than passing through it.
  expect(validateBands(allBands(DOC_BUDGETS))).toEqual([]);

  const stripped = allBands(DOC_BUDGETS).map((b, i) =>
    i === 0 ? { ...b, measured: { at: b.measured.at, reason: "  " } } : b,
  );
  const problems = validateBands(stripped);
  expect(problems.length).toBe(1);
  expect(problems[0]).toContain("measured.reason is empty");

  const undated = allBands(DOC_BUDGETS).map((b, i) =>
    i === 0 ? { ...b, measured: { at: "", reason: b.measured.reason } } : b,
  );
  expect(validateBands(undated)[0]).toContain("measured.at is empty");
});

test("THE CONFIG'S REFUSAL REACHES THE COMMAND AS EXIT 3, not as a silent skip", () => {
  // A validation only a unit test can see is a validation the command
  // does not have. THIS BODY EXISTS BECAUSE THE DRILL FOUND THAT GAP:
  // stripping a real band's measured reason left the suite 20-for-20,
  // since nothing drove the binary against a config that had lost one.
  // It is driven through `--config`, which is a real flag — a project
  // adopting this method has its own cliffs — and not a test seam.
  const dir = mkdtempSync(path.join(tmpdir(), "health-bands-"));
  const bad = path.join(dir, "bad.config.mjs");
  try {
    writeFileSync(
      bad,
      [
        "export function allBands() {",
        "  return [{",
        '    id: "planted/no-reason", metric: "a band with nothing behind it",',
        '    unit: "widgets", healthy: "below", drift: 1, breach: 2,',
        '    authority: { kind: "tree", name: "planted" },',
        '    measured: { at: "somewhere", reason: "" },',
        "  }];",
        "}",
      ].join("\n"),
      "utf8",
    );
    const { code, err } = runHealth(["--config", bad]);
    expect(code).toBe(EXIT.CANNOT_RUN);
    expect(err).toContain("THE BANDS CONFIG WILL NOT LOAD");
    expect(err).toContain("measured.reason is empty");
    // And it is a claim about the CONFIG, never about the tree — the
    // house meaning of this exit code.
    expect(err).toContain("not a claim about the tree");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--list is the TUNER's view: every band's measured reason, in full", () => {
  // TRIAGE is what moves a limit (health-bands.config.mjs names the
  // loop), and this is the page it reads first. A truncated reason here
  // would mean tuning against a summary of the evidence.
  const { code, out, err } = runHealth(["--list"]);
  expect(code).toBe(EXIT.CLEAN);
  expect(err).toBe("");
  expect(out).toContain("TRIAGE is the tuner");
  for (const b of allBands(DOC_BUDGETS)) expect(out).toContain(b.measured.reason);
});

test("a band whose drift and breach lines are ordered wrong can never say DRIFTING, and is refused", () => {
  // The silent-failure shape: such a band still reports inside and
  // breached, so it looks like it works. Only the middle tier is gone.
  const broken = [{ ...STANDING_BANDS[0]!, drift: 1, breach: 99 }];
  expect(validateBands(broken)[0]).toContain("can never report DRIFTING");
});

/**
 * Every number a measured reason STATES, comma grouping stripped. A line
 * is "stated" only as a number token of its own: `140` does not state a
 * breach of 40, and `9.3` does not state a drift of 9 — the substring
 * reading passes both, and passing them is how a band drifts from its own
 * derivation without anybody seeing it.
 */
function numbersStated(text: string): number[] {
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
}

/**
 * The records a derivation names: a commit ref, a card id, or a
 * repository path. SHAPE ONLY, AND DELIBERATELY — ADR-019's Records
 * clause says no suite, gate or generator may DEPEND on the contents of
 * docs/checkpoints/, so this asks whether the reason cites something a
 * reader can go and open, never whether that file is still there.
 */
function recordsNamed(text: string): string[] {
  const refs = text.match(/\b(?=[0-9a-f]{7,40}\b)[0-9a-f]*[a-f][0-9a-f]*\b/g) ?? [];
  const cards = text.match(/\bT-\d+(?:-s\d+)?\b/g) ?? [];
  const paths = text.match(/\b[\w.-]+\/[\w./*-]+/g) ?? [];
  return [...refs, ...cards, ...paths];
}

test("EVERY BAND'S LINES ARE STATED IN ITS OWN MEASURED REASON — a moved line owes a new derivation", () => {
  // T-282 criterion 4. The failure this catches is the one the whole file
  // is written against, arriving by the cheapest route: somebody moves a
  // limit and leaves the paragraph that justified the old one, so the
  // config still reads as measured while the number behind it is a guess.
  // An outside review proposed exactly that for triage/live-suggestions —
  // 40 to 80, no measurement — and the ruling was to re-derive instead.
  for (const b of allBands(DOC_BUDGETS)) {
    const stated = numbersStated(b.measured.reason);
    for (const [name, line] of [
      ["drift", b.drift],
      ["breach", b.breach],
    ] as const) {
      if (line === null) continue;
      expect(
        stated,
        `${b.id}'s ${name} line is ${line} and its measured reason never states that number — ` +
          "a moved line owes a new derivation, and the remedy is the measurement, never the assertion",
      ).toContain(line);
    }
  }

  // THE POSITIVE CONTROL, because a checker that has only ever seen
  // agreeing input cannot be told from one that decides nothing: move a
  // real band's line by one and the same check fails on the same band.
  const real = STANDING_BANDS.find((b) => b.id === "triage/live-suggestions")!;
  expect(numbersStated(real.measured.reason)).toContain(real.breach);
  const moved = { ...real, breach: (real.breach ?? 0) + 1 };
  expect(numbersStated(moved.measured.reason)).not.toContain(moved.breach);

  // AND THE RE-DERIVED BANDS' LINES ARE PINNED TO THE SENTENCE THAT
  // DERIVES EACH ONE, never to the bag of numbers the paragraph happens
  // to contain. MEASURED: triage/live-suggestions' reason states 19
  // distinct values between 1 and 200, so the membership check above
  // passes for breach 80 — the exact number the outside review proposed
  // and this ruling REFUSED — and for 140, and for drift 22. A number
  // that appears because the derivation argued AGAINST it is not a
  // derivation of that number.
  expect(
    real.measured.reason,
    "triage/live-suggestions' drift line is not the number its own derivation sentence derives",
  ).toContain(`The drift line is that measured sitting: ${real.drift} cards`);
  expect(
    real.measured.reason,
    "triage/live-suggestions' breach line is not the number its own derivation sentence derives",
  ).toContain(`The breach line is TWO of it — ${real.breach} cards`);
  const net = STANDING_BANDS.find((b) => b.id === "triage/net-arrivals-per-window")!;
  expect(
    net.measured.reason,
    "triage/net-arrivals-per-window's breach line is not the ceiling its own sentence re-derives",
  ).toContain(`to zero cheaply from 40 to ${net.breach}`);
});

test("A DERIVATION THAT NAMES NO RECORD IS REFUSED — a reason nobody can go and read is not a measurement", () => {
  // T-282 criterion 4's second half. `validateBands` already refuses an
  // EMPTY `measured`, which leaves the interesting case open: a reason
  // full of confident prose that cites nothing. That is what a raised
  // band looks like from the inside, and it is indistinguishable from a
  // derived one on every check this file had before.
  // MEASURED BY THIS CARD'S OWN DRILL, and the reason the check is on the
  // ADDRESS rather than on the entry as a whole: an earlier form asked
  // `at` and `reason` TOGETHER, and the mutant that replaced a real `at`
  // with "raised at the review, by agreement" SURVIVED — the prose beside
  // it still cited a source, so the band read as addressed while its
  // address had become a sentence. `at` is where the measurement was
  // TAKEN; the reason may argue in words, and one band's honestly does.
  for (const b of allBands(DOC_BUDGETS)) {
    expect(
      recordsNamed(b.measured.at),
      `${b.id}'s measured.at names no commit, no card and no path — there is nothing there a ` +
        "later reader can open, and a measurement with no address is a sentence",
    ).not.toEqual([]);
    // AND THE DERIVATION ITSELF, which is what the criterion says: "a
    // body SHALL red when THE DERIVATION names no record". MEASURED: with
    // the address alone checked, this entry's whole reason could be
    // replaced by "everybody at the review agreed ... we are confident
    // this is right" — keeping the two numbers, naming nothing — and the
    // suite stayed 24-for-24 green. The address says WHERE the reading
    // was taken; the reason has to say WHAT it was taken from.
    expect(
      recordsNamed(b.measured.reason),
      `${b.id}'s measured reason cites no commit, no card and no path — it argues, and an ` +
        "argument nobody can go and check is the raised line this file exists to refuse",
    ).not.toEqual([]);
  }

  // THE CONTROLS, both ways. The three shapes that ARE records, each
  // alone, and the shape that is not one however sure it sounds.
  expect(recordsNamed("3ff7f30, over the window")).toEqual(["3ff7f30"]);
  expect(recordsNamed("standing in T-088-s4's own hazards")).toEqual(["T-088-s4"]);
  expect(recordsNamed("docs/checkpoints/2026-08-29-amnesty-triage.md")).toEqual([
    "docs/checkpoints/2026-08-29-amnesty-triage.md",
  ]);
  expect(
    recordsNamed("the line felt too tight for the way this board moves now, so we doubled it"),
    "a recordless justification passes as a derivation, which is the whole defect",
  ).toEqual([]);
  expect(recordsNamed("raised at the review of 2026-09-09 by agreement")).toEqual([]);
});

test("a doc-headroom band exists for every gated DOC_BUDGETS entry, derived and not listed", () => {
  // The staleness this avoids is the one this repository has paid for
  // repeatedly: a hand-written list that goes out of date the day a
  // document is added. Add a budget, get a band, in the same commit.
  const ids = docHeadroomBands(DOC_BUDGETS).map((b) => b.id);
  const gated = Object.entries(DOC_BUDGETS)
    .filter(([, b]) => b !== null)
    .map(([rel]) => `docs-headroom/${rel}`);
  expect(ids.sort()).toEqual(gated.sort());
  expect(ids.length).toBeGreaterThan(0);
});

test("DOC_BUDGETS HAS ONE HOME — the gate and the bands read the same table", () => {
  // T-057's rule, and the reason the table moved out of docs-gate.mjs:
  // that file executes at import, so a second reader could not import
  // it, and the obvious workaround is a copy. A copy of a budget table
  // disagrees with the original exactly when a budget is re-landed.
  const gate = readFileSync(path.join(repoRoot, "tools/e2e/scripts/docs-gate.mjs"), "utf8");
  expect(gate).toContain("DOC_BUDGETS");
  expect(gate).not.toMatch(/const DOC_BUDGETS\s*=/);
  const scan = readFileSync(path.join(repoRoot, "tools/e2e/scripts/docs-scan.mjs"), "utf8");
  expect(scan).toMatch(/export const DOC_BUDGETS\s*=/);
});

// ── §AUTHORITIES ─────────────────────────────────────────────────────

test("the graph headroom is READ OUT OF index --check's own budget line, in both of its shapes", () => {
  // Both shapes matter and the second is the one a naive parser drops:
  // over budget is NOT an error there — the emitter still emits,
  // degraded — so it renders differently and must come back as a
  // NEGATIVE headroom rather than as nothing.
  const under = parseGraphHeadroom(
    "[supertaskr-index]   budget:      1020023 of 1040000 bytes (98.1%) - 19977 left\n",
  );
  expect(under?.value).toBe(19977);
  expect(under?.derivation).toContain("1020023 of 1040000");

  const over = parseGraphHeadroom(
    "[supertaskr-index]   budget:      1200000 of 1040000 bytes (115.4%) - OVER by 160000: symbol arrays dropped\n",
  );
  expect(over?.value).toBe(-160000);

  expect(parseGraphHeadroom("no budget line here")).toBeNull();
});

test("THE PARSER IS PINNED TO THE SOURCE THAT PRODUCES THE LINE, not to a remembered format", () => {
  // The drift this catches: somebody reformats `budget_line` in
  // check.rs, this band goes UNREAD forever, and nothing anywhere says
  // so — a missing number is exactly the failure the whole card is
  // about. Cite the SYMBOL, never a line (docs/CONVENTIONS.md).
  const check = readFileSync(
    path.join(repoRoot, "app/src-tauri/crates/supertaskr-index/src/check.rs"),
    "utf8",
  );
  expect(check).toContain("fn budget_line(");
  expect(check).toContain("budget:      {used} of {budget} bytes ({percent:.1}%) - {} left");
  expect(check).toContain("budget:      {used} of {budget} bytes ({percent:.1}%) - OVER by {}");
});

test("the lib suite's duration is taken from the lib.rs binary BY NAME, never by position or size", () => {
  // The cargo cache cliff is a property of the LIB binary specifically
  // (T-088-s4). A workspace runs several, and picking the longest — the
  // tempting shortcut — reads the wrong population and would have said
  // 22.10s here, well past a breach line that describes a different
  // binary entirely.
  // THE LIB BINARY IS DELIBERATELY NOT FIRST HERE, and that ordering is
  // the whole body. Written with lib.rs first, this fixture is passed
  // just as happily by a parser that takes the FIRST binary and ignores
  // the name — measured: broadening the guard to /Running unittests/
  // survived that ordering with the suite at 20-for-20, and dies here.
  const cargo = [
    "   Running unittests src/main.rs (target/debug/deps/supertaskr-1111111)",
    "test result: ok. 3 passed; 0 failed; finished in 22.10s",
    "   Running unittests src/lib.rs (target/debug/deps/supertaskr-9a1b2c3)",
    "test result: ok. 412 passed; 0 failed; 0 ignored; finished in 8.91s",
    "   Running tests/budget.rs (target/debug/deps/budget-2222222)",
    "test result: ok. 9 passed; 0 failed; finished in 31.70s",
  ].join("\n");
  expect(parseLibSuiteSeconds(cargo)?.value).toBe(8.91);
  expect(parseLibSuiteSeconds(cargo)?.derivation).toContain("src/lib.rs");

  // A workspace that ran binaries but not the lib one is UNREAD, never
  // some other binary's number wearing the lib band's name.
  const noLib = [
    "   Running unittests src/main.rs (target/debug/deps/supertaskr-1111111)",
    "test result: ok. 3 passed; 0 failed; finished in 22.10s",
  ].join("\n");
  expect(parseLibSuiteSeconds(noLib)).toBeNull();
  expect(parseLibSuiteSeconds("test result: ok. finished in 5.0s")).toBeNull();
});

test("Playwright's summary unit is READ, never assumed — 2.6m is not 2.6 seconds", () => {
  // The silent-green shape: a minutes reading taken as seconds puts a
  // two-and-a-half-minute run comfortably inside a band and the suite
  // could then double in wall time without ever leaving `inside`.
  expect(parseE2eSeconds("  259 passed (2.6m)")?.value).toBeCloseTo(156, 5);
  expect(parseE2eSeconds("  12 passed (45.3s)")?.value).toBeCloseTo(45.3, 5);
  expect(parseE2eSeconds("  1 passed (900ms)")?.value).toBeCloseTo(0.9, 5);
  expect(parseE2eSeconds("nothing ran")).toBeNull();
});

test("a readings file yields exactly the three readings-authority bands, and no more", () => {
  const text = [
    "[supertaskr-index]   budget:      1020023 of 1040000 bytes (98.1%) - 19977 left",
    "   Running unittests src/lib.rs (target/debug/deps/x)",
    "test result: ok. 1 passed; finished in 9.00s",
    "  259 passed (2.6m)",
  ].join("\n");
  const readings = readingsFromOutput(text);
  expect([...readings.keys()].sort()).toEqual([
    "graph/budget-headroom-bytes",
    "suite/e2e-seconds",
    "suite/lib-seconds",
  ]);
});

// ── THE TIERS ────────────────────────────────────────────────────────

test("inside is SILENT, drifting prints its derivation, breached emits the four things the criterion names", () => {
  const band = STANDING_BANDS.find((b) => b.id === "graph/budget-headroom-bytes")!;
  const inside = evaluateBand(band, { value: 500000, derivation: "planted inside" });
  const drifting = evaluateBand(band, { value: 30000, derivation: "planted drifting" });
  const breached = evaluateBand(band, { value: 1000, derivation: "planted breach" });
  expect([inside.state, drifting.state, breached.state]).toEqual(["inside", "drifting", "breached"]);

  // Tier one: counted, never listed. A reporter that prints its silent
  // tier has no silent tier, and gets filtered within two checkpoints.
  const insideOnly = renderReport([inside]);
  expect(insideOnly.code).toBe(EXIT.CLEAN);
  expect(insideOnly.lines.join("\n")).not.toContain("planted inside");

  // Tier two: the reading AND how it was obtained, so the next reader
  // re-runs the measurement instead of trusting the number.
  expect(renderReport([drifting]).lines.join("\n")).toContain("planted drifting");

  // Tier three: metric, reading, band, derivation — criterion 1, in
  // as many words.
  const found = renderReport([breached]);
  expect(found.code).toBe(EXIT.FOUND);
  const text = found.lines.join("\n");
  expect(text).toContain(band.metric);
  expect(text).toContain("1000");
  expect(text).toContain(String(band.breach));
  expect(text).toContain("planted breach");
});

test("a breach's finding is a LEGAL suggestion card — frontmatter the parser accepts", () => {
  // The third tier's action is to re-enter the board, and a card the
  // parser refuses does not re-enter it: it lights the board's
  // parse-error badge and reds a suite in another package
  // (docs-scan.mjs's own header records both times that happened).
  const band = STANDING_BANDS.find((b) => b.id === "graph/budget-headroom-bytes")!;
  const breached = evaluateBand(band, { value: 1000, derivation: "planted breach" });
  const card = findingCard(breached, { id: "T-156-s9", ref: "abc1234", when: "2026-08-29T00:00:00Z" });

  const block = /^---\n([\s\S]*?)\n---\n/.exec(card.body);
  expect(block).not.toBeNull();
  const fm = parseYaml(block![1]!) as Record<string, unknown>;
  expect(fm.id).toBe("T-156-s9");
  expect(fm.status).toBe("suggested");
  // `suggested_by` is REQUIRED on status: suggested (lib/parser types).
  expect(String(fm.suggested_by ?? "")).not.toBe("");
  // The status vocabulary is read out of the parser's own source, never
  // retyped here — the same licence docs-scan.mjs takes.
  expect(taskStatuses(repoRoot)).toContain(String(fm.status));
  // A title opening with a backtick is a YAML reserved indicator and has
  // unparseable-carded this board before (docs-scan.mjs's header).
  expect(String(fm.title ?? "")[0]).not.toBe("`");

  // The four things, on the card as well as on the terminal.
  expect(card.body).toContain("**metric**");
  expect(card.body).toContain("**reading**");
  expect(card.body).toContain("**band**");
  expect(card.body).toContain("**derivation**");
  // ...and the marker that makes filing idempotent at the next checkpoint.
  expect(card.body).toContain(`Health band: ${band.id}`);

  // T-156's VERDICT, assigned correction one (integrator at merge): the
  // title is interpolated from band fields, and an UNQUOTED plain
  // scalar made the writer itself the parse hazard — a ": " in a
  // metric turned the line into a nested map (unparseable card), a
  // " #" truncated it to a comment (silently wrong card). Both
  // measured. The hostile band below carries both indicators and the
  // title must round-trip through YAML EXACTLY.
  const hostile = { ...band, metric: "bytes: left # before the line", unit: "x: y" };
  const hostileCard = findingCard(
    evaluateBand(hostile, { value: 1000, derivation: "planted breach" }),
    { id: "T-156-s9", ref: "abc1234", when: "2026-08-29T00:00:00Z" },
  );
  const hostileBlock = /^---\n([\s\S]*?)\n---\n/.exec(hostileCard.body);
  expect(hostileBlock).not.toBeNull();
  const hostileFm = parseYaml(hostileBlock![1]!) as Record<string, unknown>;
  expect(hostileFm.title, "the quoted scalar carries every printable indicator whole").toBe(
    hostileCard.title,
  );
});

test("a null budget entry yields no band and no reading — the gated-entry guard has a keeper", () => {
  // T-156's VERDICT, assigned correction two (integrator at merge): the
  // gated-entry filter was pinned only against the real DOC_BUDGETS,
  // which holds no null — both sides of that equality derive from the
  // same object, so DELETING the guard changed nothing any body read
  // (the drill's one survivor). This table has the null the real one
  // lacks; without the guard, deriving from it throws on both paths.
  const budgets = {
    "docs/STATE.md": { landed: 6772, warn: 8465, fail: 10158 },
    "docs/never-landed.md": null,
  };
  expect(docHeadroomBands(budgets).map((b) => b.id)).toEqual(["docs-headroom/docs/STATE.md"]);
  const readings = readingsFromTree({ parseYaml, budgets });
  expect(readings.has("docs-headroom/docs/STATE.md")).toBe(true);
  expect(readings.has("docs-headroom/docs/never-landed.md")).toBe(false);
});

test("suggestion ids are derived from the tree, so a dispositioned card's id is never reused", () => {
  // Triage moves a rejected suggestion to docs/tasks/rejected/, so a
  // COUNT of live suggestions would hand the next finding an id that is
  // already spent. Derive the max, never the count.
  expect(nextSuggestionId(["docs/tasks/T-156-s1-a.md", "docs/tasks/rejected/T-156-s2-b.md"])).toBe(
    "T-156-s3",
  );
  expect(nextSuggestionId([])).toBe("T-156-s1");
  expect(nextSuggestionId(["docs/tasks/T-155-s7-elsewhere.md"])).toBe("T-156-s1");
});

// ── THE COMMAND ──────────────────────────────────────────────────────

test("the command is a READ: it files nothing without --file", () => {
  // A script that writes into docs/tasks/ unbidden is a second writer,
  // and this repository has paid for those. The default run reports and
  // stops; filing is opt-in and says so.
  const before = spawnSync("git", ["status", "--porcelain", "docs/tasks/"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout;
  runHealth([]);
  const after = spawnSync("git", ["status", "--porcelain", "docs/tasks/"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout;
  expect(after).toBe(before);
});

test("the command refuses what it cannot answer rather than answering it", () => {
  expect(runHealth(["--nonsense"]).code).toBe(EXIT.USAGE);
  expect(runHealth(["--readings"]).code).toBe(EXIT.USAGE);
  // It takes flags, never paths — the shape docs-gate.mjs refuses for
  // the opposite reason, and for the same principle: a command that
  // guesses its question answers a different one.
  expect(runHealth(["some/path.txt"]).code).toBe(EXIT.USAGE);
});

test("every band this project watches is present, and each names an authority", () => {
  // The census the card asks for, asserted as a SHAPE rather than a
  // tally: every band has an id, a metric in words, a unit, and an
  // authority named the way it is invoked or read. A band that cannot
  // say where its number comes from is the vacuous keeper
  // docs/NORTH_STAR.md's bar calls a stop-the-line defect.
  const bands = allBands(DOC_BUDGETS);
  for (const b of bands) {
    expect(b.id).toMatch(/^[a-z-]+\/\S+$/);
    expect(b.metric.length).toBeGreaterThan(10);
    expect(b.unit).not.toBe("");
    expect(b.authority.name).not.toBe("");
  }
  // The card's own set, by family — the four doc budgets, the graph, the
  // two suites, the three triage metrics, the machinery, the three
  // constitution indicators.
  const families = new Set(bands.map((b) => b.id.split("/")[0]));
  expect([...families].sort()).toEqual([
    "docs-headroom",
    "graph",
    "machinery",
    "north-star",
    "suite",
    "triage",
  ]);
});

test("the tree-authority bands are read at the running ref, not remembered", () => {
  // Every figure is a function of a tree. This body asserts the
  // MECHANISM rather than a number: the derivation string must quote the
  // reading it took, so a stale band is visible on its own line.
  const { out } = runHealth([]);
  expect(out).toContain("health-bands:");
  const evaluated = evaluate({ readings: new Map() });
  expect(evaluated.every((r) => r.state === "unread" || r.state === "unkept")).toBe(true);
});
