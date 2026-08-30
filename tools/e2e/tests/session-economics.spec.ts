import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import {
  assembleBrief,
  context,
  contractRows,
  render,
  roleText,
  unstampedLines,
} from "../scripts/dispatch-brief.mjs";
import {
  DECOMPOSITION_FILE,
  EARS_ANCHOR,
  KNOW,
  SEAT_PHRASE,
  TRY,
  acceptanceCriteria,
  earsKeywords,
  hygieneSection,
  isEars,
  lightestTier,
  optionalSection,
  seatRecs,
  seatVerdict,
} from "../scripts/session-economics.mjs";

/**
 * SESSION ECONOMICS (T-157) — no browser.
 *
 * ADR-020's companion adoption: the dispatch brief carries an advisory
 * recommended-seat line derived from the CARD, and the checkpoint
 * template carries stamped cost lines. This file keeps the first half
 * honest. The second half has no keeper here ON PURPOSE — ADR-019's
 * Records clause forbids any suite, gate or generator from depending on
 * `docs/checkpoints/`'s contents, and a body that read the template to
 * check it would enrol this suite as a reader of that directory. The
 * card's implementation notes say so in the same words; this comment is
 * the copy a reader of the suite will find.
 *
 * ── WHAT EACH KIND OF BODY BUYS ──────────────────────────────────────
 * The pure derivation is driven with FIXTURES, so every branch is
 * reachable including the ones the live tree does not exercise today
 * (a role file that HAS run-hygiene text is the load-bearing one — the
 * method has not written it yet, and a criterion whose only branch is
 * "absent" is a criterion nobody has tested). The CLI bodies drive the
 * real command, because the property that matters most — that nothing
 * about the SESSION reaches the recommendation — is a property of the
 * process and not of a function.
 */

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");
const MODULE = path.join(repoRoot, "tools", "e2e", "scripts", "session-economics.mjs");

/** The advisory block, sliced off a rendered brief by its own header. */
function advisory(stdout: string): string {
  const at = stdout.indexOf("ADVISORY — THE RECOMMENDED SEAT");
  expect(at, "the brief printed no advisory block at all").toBeGreaterThan(-1);
  return stdout.slice(at);
}

/** A signal set that answers KNOW on every arm — the fixture the others move. */
const ALL_KNOWN = {
  size: "S",
  lightest: "S",
  fence: [{ entry: "tools/e2e", kind: "path", paths: ["tools/e2e"] }],
  criteria: ["WHEN a brief is assembled THE row SHALL derive from the card"],
  keywords: ["THE", "WHEN", "WHILE", "IF", "WHERE"],
};

test("the recommended seat is a function of the CARD, and an environment full of model dials does not move it", () => {
  const clean = spawnSync(process.execPath, [CLI, "--task", "T-157"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  expect(clean.status, clean.stderr ?? "").toBe(0);

  // EVERY DIAL A SESSION PLAUSIBLY CARRIES, SET TO SOMETHING ABSURD. If
  // the recommendation were read from the environment rather than from
  // the card, one of these would move it — and the failure mode this
  // guards is the one the criterion names in as many words: a row filled
  // "from the assembling session's own dials".
  const loud = spawnSync(process.execPath, [CLI, "--task", "T-157"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ANTHROPIC_MODEL: "a-model-that-does-not-exist",
      CLAUDE_MODEL: "another-one",
      NPUTER_MODEL: "a-third",
      MODEL: "a-fourth",
      ANTHROPIC_SMALL_FAST_MODEL: "a-fifth",
      NPUTER_SEAT: "strongest",
    },
  });
  expect(loud.status, loud.stderr ?? "").toBe(0);
  expect(
    advisory(loud.stdout),
    "the advisory block moved under an environment change, so something other than the card is " +
      "feeding it",
  ).toBe(advisory(clean.stdout));

  // POSITIVE CONTROL for the comparison itself: the block is not a
  // constant, so "identical" above is a claim about the environment
  // rather than about a string that could never differ. Two cards, one
  // command, two different blocks.
  const other = spawnSync(process.execPath, [CLI, "--task", "T-112"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  expect(other.status, other.stderr ?? "").toBe(0);
  expect(advisory(other.stdout)).not.toBe(advisory(clean.stdout));

  // And the structural half, because an env read added tomorrow would
  // pass the comparison above on a machine where that variable is unset.
  expect(
    readFileSync(MODULE, "utf8"),
    "the derivation reached for process state — the card is the only input it may have",
  ).not.toContain("process.env");
});

test("every one of the three signals reads its own input, and every one of them is decisive once the other two split", () => {
  expect(seatVerdict(ALL_KNOWN).verdict).toBe(KNOW);
  const PROSE = ["the board should feel fast"];
  const SLUG = [{ entry: "app-board", kind: "slug", paths: ["app/src/board", "app/src/model"] }];
  const arm = (v: ReturnType<typeof seatVerdict>, id: string) =>
    v.signals.find((s) => s.id === id)?.verdict;

  // FIRST, THAT EACH SIGNAL ANSWERS ITS OWN INPUT. Each of these is a
  // MUTATED INPUT rather than a mutated assertion: the fixture describes
  // a different card and the rule ships untouched.
  expect(arm(seatVerdict({ ...ALL_KNOWN, size: "L" }), "size")).toBe(TRY);
  expect(arm(seatVerdict({ ...ALL_KNOWN, fence: SLUG }), "fence")).toBe(TRY);
  expect(arm(seatVerdict({ ...ALL_KNOWN, criteria: PROSE }), "criteria")).toBe(TRY);

  // AND THEN THAT EACH ONE DECIDES. A single flip cannot move a majority
  // of three, so "this signal matters" is shown where it is actually
  // shown: hold the other two SPLIT, and flip the one under test. Three
  // pairs, one per signal, and each pair differs in exactly one input.
  expect(seatVerdict({ ...ALL_KNOWN, criteria: PROSE }).verdict).toBe(KNOW);
  expect(seatVerdict({ ...ALL_KNOWN, criteria: PROSE, size: "L" }).verdict).toBe(TRY);
  expect(seatVerdict({ ...ALL_KNOWN, criteria: PROSE, fence: SLUG }).verdict).toBe(TRY);
  expect(seatVerdict({ ...ALL_KNOWN, size: "L" }).verdict).toBe(KNOW);
  expect(seatVerdict({ ...ALL_KNOWN, size: "L", criteria: PROSE }).verdict).toBe(TRY);

  // KNOW NEEDS A MAJORITY, AND THE TIE GOES TO TRY. On three signals the
  // tie is unreachable, so what is pinned is the direction that survives
  // a fourth signal being added: more TRY than KNOW is TRY, and an equal
  // count is never KNOW.
  const two = seatVerdict({ ...ALL_KNOWN, size: "M", criteria: PROSE });
  expect(two.tries).toBe(2);
  expect(two.verdict).toBe(TRY);

  // An EMPTY card is the worst case, and its emptiness reads as TRY on
  // both arms rather than as an accidental KNOW through a zero-length
  // "every criterion passed".
  const empty = seatVerdict({ ...ALL_KNOWN, fence: [], criteria: [] });
  expect(empty.signals.filter((s) => s.verdict === KNOW).length).toBe(1);
  expect(empty.verdict).toBe(TRY);
});

test("the EARS patterns are READ from the method, and a step that moved is a throw rather than an empty pattern set", () => {
  const md = readFileSync(path.join(repoRoot, DECOMPOSITION_FILE), "utf8");
  const keywords = earsKeywords(md);
  expect(keywords).toEqual(["THE", "WHEN", "WHILE", "IF", "WHERE"]);

  // THE FAILURE THAT MATTERS IS THE SILENT ONE. An empty keyword set
  // would call every acceptance criterion on the board malformed and
  // answer TRY for all of them — a confident wrong line, which is worse
  // than a crash. Both routes to it are refused by name.
  expect(() => earsKeywords(md.replace(EARS_ANCHOR, "some other notation"))).toThrow(
    /no longer names/,
  );
  const anchorOnly = md.split(/\r?\n/).filter((l) => !/^\s*- [^:]+:\s+[A-Z][A-Z]/.test(l)).join("\n");
  expect(() => earsKeywords(anchorOnly)).toThrow(/carries no/);
});

test("a criterion that opens with an EARS keyword and never says SHALL is not EARS-shaped", () => {
  const keywords = ["THE", "WHEN", "WHILE", "IF", "WHERE"];
  expect(isEars("WHEN a brief is assembled THE row SHALL derive from the card", keywords)).toBe(true);
  expect(isEars("**WHEN** a brief is assembled THE row SHALL derive", keywords)).toBe(true);

  // THE LIVE CASE, and it was found by running this on the card that
  // asked for it: T-157's own third criterion opens with IF and never
  // reaches SHALL. Both halves are required precisely so that a sentence
  // about a condition does not pass as a requirement.
  expect(
    isEars("IF the hygiene text and the brief row disagree THEN the method text is the authority", keywords),
  ).toBe(false);
  expect(isEars("the system SHALL be fast", keywords)).toBe(false);
  expect(isEars("make the board nicer", keywords)).toBe(false);
});

test("the card's acceptance criteria are read where they exist, and their absence is a reading rather than a crash", () => {
  const ctx = context({ taskId: "T-157" });
  const card = ctx.card;
  expect(card, "T-157 is the card this suite is about and it is not on the board").toBeDefined();
  const text = readFileSync(path.join(repoRoot, card!.file), "utf8");
  expect(acceptanceCriteria(text).length).toBeGreaterThan(0);

  // A CARD WITH NO CRITERIA SECTION IS AN ORDINARY READING. dispatch-
  // brief.mjs's own `section()` throws on a missing heading, which is
  // right for a contract table and wrong for a card — a crash there
  // would take the whole brief down over a card that is merely
  // underwritten, and the signal exists to REPORT that card.
  expect(optionalSection("# a card with nothing in it\n", "## Acceptance criteria")).toBeNull();
  expect(acceptanceCriteria("# a card with nothing in it\n")).toEqual([]);
});

test("the method text is the authority: the line quotes a role file's run-hygiene section, and says so plainly when there is none", () => {
  // THE BRANCH THE TREE DOES NOT EXERCISE TODAY, DRIVEN ANYWAY. The
  // per-seat hygiene text is method work that rides the next bump, so
  // the "present" arm has no live input — and a criterion whose only
  // tested branch is "absent" is a criterion nobody has tested.
  const withText = [
    "# Role: executor",
    "",
    "## Run hygiene",
    "",
    "Model and effort are set at session start and never switched",
    "mid-lane: the cache is the economics.",
    "",
    "## The report",
    "",
    "Something else entirely.",
  ].join("\n");
  const found = hygieneSection(withText);
  expect(found).not.toBeNull();
  expect(found!.heading).toBe("Run hygiene");
  expect(found!.body).toContain("never switched mid-lane");
  expect(found!.body, "the section bled into the heading after it").not.toContain("entirely");

  expect(hygieneSection("# Role: executor\n\n## The report\n\nnothing about running.\n")).toBeNull();

  // AND THE LIVE READING, DISCLOSED RATHER THAN ASSERTED. Which arm the
  // real role file takes today is a fact about the method at this ref
  // and will flip when the hygiene text lands, so what is pinned is that
  // the block SAYS which arm it took — never which arm that is.
  const ctx = context({ taskId: "T-157" });
  const block = render(seatRecs(ctx));
  const live = hygieneSection(roleText("executor", repoRoot));
  expect(block).toContain(live === null ? "no run-hygiene section in" : "THE METHOD TEXT IS THE AUTHORITY");
});

test("the advisory line is NOT a contract row — it is printed outside the row set and derives none of it", () => {
  const ctx = context({ taskId: "T-157" });
  const rows = contractRows(ctx.roleMd);

  // The contract table carries no row for this line, and the brief's own
  // row assembly does not emit it. A fourteenth row invented by this
  // command would be exactly the second row set dispatch-brief.mjs reads
  // the table to avoid — and it reports a deriver with no row as a
  // finding, which is the mechanism this body confirms is untouched.
  expect(rows.some((r) => /seat|model|econom/i.test(r.label))).toBe(false);
  expect(render(assembleBrief(context({ taskId: "T-157" })).recs)).not.toContain("ADVISORY —");

  // …and the command prints it anyway, after the rows.
  const run = spawnSync(process.execPath, [CLI, "--task", "T-157"], { cwd: repoRoot, encoding: "utf8" });
  expect(run.status, run.stderr ?? "").toBe(0);
  expect(run.stdout.indexOf("ROW 13")).toBeLessThan(run.stdout.indexOf("ADVISORY —"));
  expect(advisory(run.stdout)).toContain("NOT one of the rows above");
});

test("the recommendation names a seat strength and never a model, because this project passes no --model", () => {
  const ctx = context({ taskId: "T-157" });
  const block = render(seatRecs(ctx));
  const seatLine = block
    .split("\n")
    .filter((l) => l.startsWith("RECOMMENDED SEAT:"));
  expect(seatLine.length).toBe(1);

  // ADR-003: the operator's own CLI default IS the model, and the
  // `model@session` question (D5) is deliberately held. A tool that
  // printed a vendor's name would answer it.
  //
  // ASSERTED OVER THE WHOLE VOCABULARY, NOT OVER TODAY'S BRANCH. The
  // first version of this body read the rendered line for a live card
  // and stopped there — and a drill mutant that put a model name in the
  // TRY phrase SURVIVED it, because the card it read is a KNOW card and
  // the other branch never rendered. A rule about every recommendation
  // has to be checked against every recommendation.
  const vendors = /\b(opus|sonnet|haiku|gpt|gemini|llama|mistral|codex)\b/i;
  const phrases = Object.values(SEAT_PHRASE);
  expect(phrases.length).toBeGreaterThan(1);
  for (const phrase of phrases) expect(phrase).not.toMatch(vendors);
  expect(seatLine[0]).not.toMatch(vendors);
  // …and the rendered line really does come out of that vocabulary,
  // whichever arm this card takes today — so the check above is about
  // the line a reader gets and not only about two unused constants.
  expect(phrases.some((p) => (seatLine[0] ?? "").includes(p))).toBe(true);

  // POSITIVE CONTROL for the detector, so "no vendor name" is a claim
  // about the line rather than about a regex that matches nothing.
  expect("RECOMMENDED SEAT: use opus for this one").toMatch(vendors);

  // The card's own field is the authority, and the block says so on the
  // run — whichever branch the field takes.
  expect(block).toMatch(/the card's builder: (is EMPTY|.+ — AUTHORITATIVE)/);
});

test("every line of the advisory block carries its provenance, and the detector is not vacuous here either", () => {
  const rendered = render(seatRecs(context({ taskId: "T-157" })));
  expect(rendered.length).toBeGreaterThan(0);
  expect(
    unstampedLines(rendered),
    "a figure left the advisory block with no ref — the provenance floor is the whole reason " +
      "this block is built as records rather than as strings",
  ).toEqual([]);

  // The floor is only worth its line if the detector can still see. Strip
  // every stamp and require it to name each line it took one from.
  const stamped = rendered.split("\n").filter((l) => l.includes("  <- ")).length;
  expect(stamped).toBeGreaterThan(5);
  const stripped = rendered.split("\n").map((l) => l.replace(/ {2}<- .*$/, "")).join("\n");
  expect(unstampedLines(stripped).length).toBe(stamped);
});

test("the lightest ceremony tier is read off the table's first row rather than typed into the tool", () => {
  const md = readFileSync(path.join(repoRoot, "method", "tasks", "TASK-FORMAT.md"), "utf8");
  expect(lightestTier(md)).toBe("S");

  // A RENAMED TIER IS FOLLOWED, NOT OVERRULED — which is the point of
  // reading it. The mutant moves the DOCUMENT and leaves the tool alone,
  // and the tool answers the document.
  expect(lightestTier(md.replace("| S, diff outside shipped code |", "| XS, diff outside shipped code |"))).toBe(
    "XS",
  );
});
