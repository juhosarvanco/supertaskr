import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import { liveTaskCards, trackedFiles } from "../scripts/docs-scan.mjs";
import {
  ANY_PROVENANCE,
  ATTESTED_KEY,
  CARD_DERIVERS,
  CARD_STAMP,
  CENSUS_CLAIM,
  FINDING_VERDICTS,
  auditCard,
  cardBody,
  cardReport,
  derivedTexts,
  fenceDemand,
  fenceWeight,
  proseOnly,
  reproduces,
} from "../scripts/card-figures.mjs";
import { context, fieldList, unstampedLines, render } from "../scripts/dispatch-brief.mjs";

/**
 * THE CARD FIGURE LEDGER (T-150) — no browser, and NO SPAWN.
 *
 * Every body here imports the derivation and calls it. That is the shape
 * `brief.mjs` was split for: execution lives in the wrapper so importing
 * the module is side-effect-free, which is what lets a suite drive the
 * behaviour without starting a process.
 *
 * ── WHAT THIS FILE IS DEFENDING ──────────────────────────────────────
 * T-150's card offers three arms and argues for the second. The lane
 * MEASURED the first before taking the second, and the measurement is
 * what several bodies below pin, because the argument decays into a
 * preference the moment nothing re-derives it:
 *
 *   - A bare-figure lint OVER-FIRES. The corpus carries digit runs in the
 *     tens of thousands; the census claim this file pins fires in the low
 *     tens. `the case for arm two is a RATIO and this body re-derives it`
 *     asserts the relation rather than either count, because a count here
 *     goes stale under the next merge exactly the way the figures this
 *     whole card is about do.
 *   - A bare-figure lint IS BLIND to the class that actually caused the
 *     rejection. `T-141`'s sentence has NO DIGIT IN IT. That is pinned
 *     directly, on the sentence itself.
 *   - An ADJACENCY lint would have PASSED that sentence, because it came
 *     with a command and a ref that derive six other figures. That is
 *     what `a provenance that cannot be re-run is UNRUNNABLE` defends,
 *     and it is the whole difference between this gate and arm one.
 *
 * ── HOW TO READ A FAILURE ────────────────────────────────────────────
 * A red here is almost always one of two things. Either a deriver's
 * emitted TEXT changed, in which case every card carrying that line is
 * correctly STALE and the fix is to re-paste rather than to loosen the
 * comparison; or the closed key set moved, in which case the coverage
 * bodies name the key and the direction.
 *
 * ── THE POISON DRILL ─────────────────────────────────────────────────
 * Recorded in the card's implementation notes. Every mutant moves the
 * PRODUCER — this module or `card-figures.mjs` — and never an assertion,
 * because a mutation that moves both sides at once produces a green
 * indistinguishable from a vacuous assertion (docs/CONVENTIONS.md, POISON
 * DRILL, T-078). Each body below says which mutant kills it.
 */

/** The exact sentence that cost `T-141` a rejection, quoted from its dispatch. */
const T141_SENTENCE = "**T-139's merge created this repository's second D2.**";

/**
 * The same sentence with the SCOPE removed. **This is the positive
 * control in reverse** (docs/CONVENTIONS.md, A NEGATIVE ASSERTION NEEDS A
 * POSITIVE CONTROL): the body below asserts the pattern FIRES on the real
 * sentence, so it also has to show the pattern is not simply firing on
 * every ordinal — otherwise "it caught it" is satisfied equally by a
 * pattern that catches everything.
 */
const T141_UNSCOPED = "**T-139's merge created a second D2.**";

function ctx() {
  return context({ root: repoRoot, taskId: "T-150" });
}

function fixture(lines: string[]): string {
  return `---\nid: T-999\nstatus: planned\n---\n\n${lines.join("\n")}\n`;
}

/* ── the census claim: the arm no figure scanner could have ─────────── */

test("the census claim fires on the sentence that cost T-141 a rejection", async () => {
  CENSUS_CLAIM.lastIndex = 0;
  expect(CENSUS_CLAIM.test(T141_SENTENCE), T141_SENTENCE).toBe(true);
  // Killed by: deleting `repositor\w*` from HISTORY_SCOPE, or `second`
  // from ORDINAL, in card-figures.mjs.
});

test("the same sentence with no repository scope does NOT fire, so the pattern discriminates", async () => {
  CENSUS_CLAIM.lastIndex = 0;
  expect(CENSUS_CLAIM.test(T141_UNSCOPED), T141_UNSCOPED).toBe(false);
  // Killed by: dropping the scope requirement — making CENSUS_CLAIM a
  // bare ordinal alternation. That mutant reds HERE and nowhere else,
  // which is why this body exists: without it, "it caught T-141" is
  // satisfied by a pattern that catches every ordinal in the corpus.
});

test("every digit in that sentence is an IDENTIFIER, and the FIGURE has none", async () => {
  // An identifier here is an uppercase run, optionally hyphenated, then
  // digits: `T-139` names a task and `D2` names a finding class. Neither
  // is a quantity, and a lint that flagged them would be flagging the
  // vocabulary this project writes in.
  const identifiers = T141_SENTENCE.match(/\b[A-Z]+-?\d+\b/g) ?? [];
  expect(identifiers, "the sentence does carry identifiers").toEqual(["T-139", "D2"]);
  const claim = T141_SENTENCE.replace(/\b[A-Z]+-?\d+\b/g, "");
  expect(/\d/.test(claim), claim).toBe(false);
  expect(claim).toContain("second");
  // SO THE FIGURE IS THE WORD `second` AND IT IS INVISIBLE TO EVERY DIGIT
  // SCANNER. That is arm one's second refutation, pinned on the exact
  // sentence that bought it.
});

test("the audit reports the census claim on a card that only states it", async () => {
  const figures = auditCard(fixture([T141_SENTENCE]), derivedTexts(ctx()));
  expect(figures.map((f) => f.verdict)).toEqual(["CENSUS"]);
  expect(FINDING_VERDICTS).toContain("CENSUS");
  // Killed by: removing the CENSUS branch from auditCard, or dropping
  // "CENSUS" from FINDING_VERDICTS — the second is the subtler mutant and
  // it is the one that would turn this gate into a reporter.
});

/* ── the anti-gaming half: the stamp is re-run, not merely noticed ──── */

test("a derived line pasted verbatim under its own stamp is VERIFIED", async () => {
  const c = ctx();
  const derived = derivedTexts(c);
  const one = [...(derived.get("board") ?? [])][0];
  expect(one, "card:board derives at least one line").toBeTruthy();
  const figures = auditCard(
    fixture([`${one} <- @ ${c.ref.slice(0, 12)} ; card:board`]),
    derived,
  );
  expect(figures.map((f) => f.verdict)).toEqual(["VERIFIED"]);
});

test("a sentence may LEAD INTO a derived figure and still verify", async () => {
  const c = ctx();
  const derived = derivedTexts(c);
  const one = [...(derived.get("board") ?? [])][0];
  const figures = auditCard(
    fixture([`The board stands like this today: ${one} <- @ ${c.ref.slice(0, 12)} ; card:board`]),
    derived,
  );
  expect(figures.map((f) => f.verdict)).toEqual(["VERIFIED"]);
  // The card stays PROSE and only the figure itself is machine-owned.
  // Killed by: changing `reproduces` to a strict equality.
});

test("ONE DIGIT EDITED under the same stamp goes STALE — the marker cannot be borrowed", async () => {
  const c = ctx();
  const derived = derivedTexts(c);
  const one = [...(derived.get("board") ?? [])][0] ?? "";
  const tampered = one.replace(/(\d)(?!.*\d)/, (d) => String((Number(d) + 1) % 10));
  expect(tampered, "the mutation actually changed the text").not.toBe(one);
  const figures = auditCard(
    fixture([`${tampered} <- @ ${c.ref.slice(0, 12)} ; card:board`]),
    derived,
  );
  expect(figures.map((f) => f.verdict)).toEqual(["STALE"]);
  // THIS IS THE PROPERTY ARM ONE COULD NOT HAVE. An adjacency lint sees a
  // ref and a source and passes; this re-runs the deriver and the figure
  // has to be one it still produces.
});

test("text APPENDED after a true figure under the same stamp does not verify", async () => {
  const c = ctx();
  const derived = derivedTexts(c);
  const one = [...(derived.get("board") ?? [])][0];
  const figures = auditCard(
    fixture([`${one} and ninety-one others <- @ ${c.ref.slice(0, 12)} ; card:board`]),
    derived,
  );
  expect(figures.map((f) => f.verdict)).toEqual(["STALE"]);
  // Anchoring the match at END of line is what makes this fail. Killed
  // by: relaxing `reproduces` from endsWith to includes — which is the
  // natural "be more forgiving" edit, and it reopens the gaming hole.
});

test("a stamp naming a deriver outside the closed set is UNRUNNABLE, and the message names the keys that exist", async () => {
  const c = ctx();
  const figures = auditCard(
    fixture([`ninety-one things <- @ ${c.ref.slice(0, 12)} ; card:vibes`]),
    derivedTexts(c),
  );
  expect(figures.map((f) => f.verdict)).toEqual(["UNRUNNABLE"]);
  for (const key of CARD_DERIVERS.keys()) expect(figures[0]?.detail).toContain(key);
  expect(figures[0]?.detail).toContain(ATTESTED_KEY);
});

test("a provenance arrow this gate cannot re-run is UNRUNNABLE rather than accepted", async () => {
  const figures = auditCard(
    fixture(["The blast radius is nine files <- npm test from tools/e2e"]),
    derivedTexts(ctx()),
  );
  expect(figures.map((f) => f.verdict)).toEqual(["UNRUNNABLE"]);
  expect(ANY_PROVENANCE.test("The blast radius is nine files <- npm test")).toBe(true);
  // THE T-141 SHAPE, MECHANISED. Its wrong ordinal stood beside an honest
  // command that derived six other fields. A gate that only asks whether
  // a marker is PRESENT passes that line; this one says the marker cannot
  // be re-run and therefore does not bind.
});

/* ── the rule is not a ban on figures ───────────────────────────────── */

test("a figure attested as not-a-function-of-a-tree is ATTESTED and is NOT a finding", async () => {
  const c = ctx();
  const figures = auditCard(
    fixture([`The suite was 194/194 at exit 0 <- @ ${c.ref.slice(0, 12)} ; card:${ATTESTED_KEY}`]),
    derivedTexts(c),
  );
  expect(figures.map((f) => f.verdict)).toEqual(["ATTESTED"]);
  expect(FINDING_VERDICTS).not.toContain("ATTESTED");
  // A suite result is a function of a RUN. This command refuses to invent
  // one, so the honest channel has to exist or the rule becomes a ban on
  // figures — which T-150's card forbids in as many words.
});

test("an unstamped bare number is NOT a finding — arm one is deliberately not rebuilt", async () => {
  const figures = auditCard(
    fixture(["A plain sentence with 45 files and 839569 bytes in it and no stamp at all."]),
    derivedTexts(ctx()),
  );
  expect(figures).toEqual([]);
  // PINNED AS A DECISION, not left as an omission. A later hand adding a
  // bare-digit arm reds here and has to read why: the corpus measurement
  // in this file's header, and the ratio body below.
});

/* ── the measurement that chose arm two over arm one ────────────────── */

test("the case for arm two is a RATIO and this body re-derives it", async () => {
  let digitRuns = 0;
  let censusClaims = 0;
  for (const entry of liveTaskCards(repoRoot)) {
    const prose = proseOnly(cardBody(entry.content));
    digitRuns += (prose.match(/\d+(?:[.,]\d+)?/g) ?? []).length;
    CENSUS_CLAIM.lastIndex = 0;
    censusClaims += (prose.match(CENSUS_CLAIM) ?? []).length;
  }
  expect(digitRuns, "the corpus carries digit runs in bulk").toBeGreaterThan(1000);
  expect(censusClaims, "and the census claim is not vacuous").toBeGreaterThan(0);
  expect(
    censusClaims * 100,
    `census claims ${censusClaims} against digit runs ${digitRuns} — a bare-figure lint fires ` +
      "orders of magnitude more often, which is the over-fire trap docs/CONVENTIONS.md names " +
      "against itself under DOCS GATE",
  ).toBeLessThan(digitRuns);
  // A RELATION, NOT A TALLY (docs/CONVENTIONS.md: CITE THE SHAPE, NOT THE
  // TALLY). Both counts move with every merge; the two orders of
  // magnitude between them are the argument, and they are what a later
  // hand proposing arm one has to overturn.
});

/* ── the provenance floor, which is IMPORTED and not re-implemented ─── */

test("every line this command emits for a real card carries a stamp", async () => {
  const c = ctx();
  const card = c.card;
  expect(card, "T-150's own card is live").toBeTruthy();
  const text = readFileSync(path.join(repoRoot, card!.file), "utf8");
  const { recs } = cardReport(c, text);
  expect(unstampedLines(render(recs))).toEqual([]);
  // The floor is `dispatch-brief.mjs`'s `unstampedLines`, imported. One
  // implementation of provenance in this repository, not two (T-057).
  // Killed by: making any deriver push a raw string instead of a value().
});

test("a note may not carry a digit, and this command's own notes obey it", async () => {
  const c = ctx();
  const text = readFileSync(path.join(repoRoot, c.card!.file), "utf8");
  const { recs } = cardReport(c, text);
  for (const rec of recs) {
    if (rec.kind === "note") expect(/\d/.test(rec.text), rec.text).toBe(false);
  }
  // `note()` THROWS on a digit, so this body is a second reading of the
  // same rule — kept because the throw is what makes a report of a card
  // whose detail text grows a number fail loudly instead of silently
  // emitting an unstamped figure.
});

/* ── the closed vocabulary, covered BOTH ways ───────────────────────── */

test("every declared deriver produces a text set, and the audit knows no key the map lacks", async () => {
  const derived = derivedTexts(ctx());
  for (const key of CARD_DERIVERS.keys()) {
    expect(derived.has(key), `card:${key} has a text set`).toBe(true);
  }
  for (const key of derived.keys()) {
    expect(CARD_DERIVERS.has(key), `${key} is a declared deriver`).toBe(true);
  }
  expect(CARD_DERIVERS.has(ATTESTED_KEY), "measured is NOT a deriver — it is the absence of one").toBe(
    false,
  );
});

test("every deriver states, in the author's words, the question it answers", async () => {
  for (const [key, deriver] of CARD_DERIVERS) {
    expect(deriver.answers.length, `card:${key} says what it answers`).toBeGreaterThan(20);
    expect(/\d/.test(deriver.answers), `card:${key}'s answer line carries no figure`).toBe(false);
  }
  // The `answers` line is what makes this cheaper than remembering: a
  // reader scanning the output finds the question they were about to
  // answer from memory. A blank one is a deriver nobody will find.
});

/* ── the derivers, cross-checked against a second computation ───────── */

test("fence weight matches an independent walk of the tracked tree", async () => {
  const c = ctx();
  const entry = fieldList(c.card!.fields, "touches")[0] ?? "";
  const { files, paths } = fenceWeight(c, entry);
  const prefixes = paths.map((p) => p.replace(/\*+$/, "").replace(/\/$/, ""));
  const independent = trackedFiles(repoRoot).filter((rel) =>
    prefixes.some((p) => rel === p || rel.startsWith(`${p}/`)),
  ).length;
  expect(files).toBe(independent);
  expect(files, "this card's fence is not empty").toBeGreaterThan(0);
  // THIS IS T-137's CLASS: its brief carried a blast-radius figure that
  // had gone stale. A blast radius is a pure function of a tree, and this
  // body is what stops the deriver drifting from the tree it reads.
});

test("fence demand counts every live card naming the entry and nothing else", async () => {
  const c = ctx();
  const entry = fieldList(c.card!.fields, "touches")[0] ?? "";
  const { total, byStatus } = fenceDemand(c, entry);
  let independent = 0;
  for (const other of c.cards.values()) {
    if (fieldList(other.fields, "touches").includes(entry)) independent += 1;
  }
  expect(total).toBe(independent);
  expect([...byStatus.values()].reduce((a, b) => a + b, 0)).toBe(total);
  // THIS IS T-149's CLASS — "N of M planned cards touch app-shell" is a
  // join over the board that changes with every card filed.
});

/* ── it runs over the whole live board without falling over ─────────── */

test("every live card can be audited, and the report is a SHAPE rather than a tally", async () => {
  const derived = derivedTexts(ctx());
  let cards = 0;
  for (const entry of liveTaskCards(repoRoot)) {
    const figures = auditCard(entry.content, derived);
    for (const f of figures) {
      expect(
        ["VERIFIED", "STALE", "ATTESTED", "UNRUNNABLE", "CENSUS"],
        `${entry.path} line ${f.line}`,
      ).toContain(f.verdict);
      expect(f.line, `${entry.path} names a line`).toBeGreaterThan(0);
      expect(f.detail.length, `${entry.path} says why`).toBeGreaterThan(0);
    }
    cards += 1;
  }
  expect(cards, "the board is not empty").toBeGreaterThan(0);
  // NO COUNT IS ASSERTED. A per-card figure count here would be a line
  // number by another name — it drifts under every merge — which is the
  // rule method/tasks/TASK-FORMAT.md states about criteria and the same
  // rule applies to a body.
});

/* ── the parsing helpers, where the line numbers come from ──────────── */

test("fenced and indented blocks are blanked but LINE NUMBERS survive", async () => {
  const body = ["a", "```", "code with 41 in it", "```", "    indented 42", "b"].join("\n");
  const prose = proseOnly(body).split("\n");
  expect(prose.length).toBe(6);
  expect(prose[2]).toBe("");
  expect(prose[4]).toBe("");
  expect(prose[5]).toBe("b");
  // A finding that cannot name its line is a finding the author has to
  // search for. Killed by: filtering the lines out instead of blanking
  // them, which is the obvious simplification and it silently shifts
  // every reported line number.
});

test("the reported line indexes the FILE, frontmatter included", async () => {
  // FOUND BY THE DRILL, NOT ANTICIPATED. Mutant M18 shifted auditCard's
  // reported line by one and the whole file stayed green at 24 of 24: the
  // body above drives `proseOnly` directly, over array indices, so it
  // never saw the FILE offset that a reader actually needs. An off-by-one
  // sends every author to the wrong line of their own card.
  const text = `---\nid: T-999\nstatus: planned\n---\n\nfiller\n${T141_SENTENCE}\n`;
  const lines = text.split("\n");
  const expected = lines.indexOf(T141_SENTENCE) + 1;
  expect(expected, "the sentence really is on that line of the fixture").toBe(7);
  const figures = auditCard(text, derivedTexts(ctx()));
  expect(figures.map((f) => f.line)).toEqual([expected]);
});

test("a BARE arrow inside a transcript is not audited, because a command carries its own provenance", async () => {
  const derived = derivedTexts(ctx());
  const quoted = "HEAD in full: abc <- @ deadbeef1234 ; git rev-parse HEAD";
  expect(auditCard(fixture([quoted]), derived).map((f) => f.verdict)).toEqual(["UNRUNNABLE"]);
  expect(auditCard(fixture(["```", quoted, "```"]), derived)).toEqual([]);
  expect(auditCard(fixture([`    ${quoted}`]), derived)).toEqual([]);
  // A card quoting this repository's own brief output carries these by
  // the dozen. Applying the bare-arrow arm inside a block would turn
  // every quoted brief into a wall of UNRUNNABLE, so it stays prose-only.
});

test("a `card:` STAMP is audited inside a transcript too — formatting is not an escape hatch", async () => {
  // FOUND ON THIS LANE'S OWN NOTES. The paste-ready lines were pasted
  // into an indented block, the prose reader blanks those, and the author
  // who built the gate escaped it by formatting. A `card:` stamp is an
  // EXPLICIT machine claim, so it is checked wherever it sits.
  const c = ctx();
  const derived = derivedTexts(c);
  const one = [...(derived.get("board") ?? [])][0] ?? "";
  const stale = one.replace(/(\d)(?!.*\d)/, (d) => String((Number(d) + 1) % 10));
  const stamped = `${stale} <- @ ${c.ref.slice(0, 12)} ; card:board`;
  expect(auditCard(fixture([`    ${stamped}`]), derived).map((f) => f.verdict)).toEqual(["STALE"]);
  expect(auditCard(fixture(["```", stamped, "```"]), derived).map((f) => f.verdict)).toEqual([
    "STALE",
  ]);
});

test("a census claim is NOT inferred from a transcript, because it is inferred and not declared", async () => {
  const derived = derivedTexts(ctx());
  expect(auditCard(fixture([T141_SENTENCE]), derived).map((f) => f.verdict)).toEqual(["CENSUS"]);
  expect(auditCard(fixture(["```", T141_SENTENCE, "```"]), derived)).toEqual([]);
});

test("the stamp is anchored at end of line, so a quoted stamp does not inherit a verdict", async () => {
  const c = ctx();
  const line = `board live cards: 1 <- @ ${c.ref.slice(0, 12)} ; card:board and then more prose`;
  expect(CARD_STAMP.test(line)).toBe(false);
  expect(reproduces(new Set(["board live cards: 1"]), "board live cards: 1")).toBe(true);
});

test("frontmatter is not prose, so its fields are never audited as figures", async () => {
  const withField = "---\nid: T-999\nmilestone: 4\npriority: 1\n---\n\nplain body\n";
  expect(cardBody(withField).trim()).toBe("plain body");
  expect(auditCard(withField, derivedTexts(ctx()))).toEqual([]);
  // The frontmatter's figures are FIELDS with their own owner
  // (method/tasks/TASK-FORMAT.md). Auditing them here would be a second
  // opinion about a vocabulary that already has one.
});

test("CONTENTION SAYS UNKNOWN, NEVER FREE, ABOUT A LANE WHOSE CARD IT CANNOT READ", () => {
  // THE THIRD IMPLEMENTATION OF T-143's ONE MECHANISM, and the sweep is
  // how it was found rather than a report. `lanes.ts` carried
  // `if (other === undefined) continue` and was rejected for it at
  // `62a4364`; `dispatch-brief.mjs`'s `fenceLedger` carried the same
  // sentence and was filed as `T-137-s11`; THIS derivation carried it
  // too, with `FREE` four lines below, and NO body in this file named
  // `contention` in either direction.
  //
  // KILLED BY: restoring that `continue` — the lane vanishes from the
  // join and every entry of the card's fence comes back FREE, which is
  // the answer a session reads while deciding whether to take the card.
  const real = context({ root: repoRoot, taskId: "T-150" });
  const entries = fieldList(real.card!.fields, "touches");
  expect(entries.length, "T-150 declares no fence, so this body proves nothing").toBeGreaterThan(0);

  const porcelain = (blindIds: string[]): string =>
    [
      "worktree /Users/x/supertaskr",
      "HEAD 1111111111111111111111111111111111111111",
      "branch refs/heads/main",
      "",
      ...blindIds.flatMap((id, i) => [
        `worktree /Users/x/nputer-${id}`,
        `HEAD ${String(i + 2).repeat(40)}`,
        `branch refs/heads/task/${id}-a-card-this-checkout-cannot-read`,
        "",
      ]),
    ].join("\n");

  const contention = (blindIds: string[]): string[] => {
    const c = context({ root: repoRoot, taskId: "T-150", porcelain: porcelain(blindIds) });
    for (const id of blindIds) {
      expect(c.cards.has(id), `${id} names a card here, so this fixture is not blind`).toBe(false);
    }
    expect(c.lanes.map((l) => l.taskId).sort()).toEqual([...blindIds].sort());
    const derive = CARD_DERIVERS.get("contention");
    expect(derive, "the contention deriver is gone").toBeDefined();
    return render(derive!.derive(c)).split("\n").filter((l) => l.startsWith("contention "));
  };

  // THE POSITIVE CONTROL THE CARD DEMANDS BY NAME: with NO lane live,
  // every entry reads FREE. Without this, "nothing says FREE" is
  // satisfied by a deriver that only ever prints UNKNOWN.
  const sighted = contention([]);
  expect(sighted.length).toBe(entries.length);
  for (const line of sighted) expect(line).toContain(": FREE");

  // AND THE OTHER SIDE, one lane this checkout cannot read: no row says
  // FREE, no row is dropped, and each names the lane it could not read.
  const oneBlind = contention(["T-901"]);
  expect(oneBlind.length).toBe(entries.length);
  for (const line of oneBlind) {
    expect(line).toContain("UNKNOWN");
    expect(line).toContain("T-901");
    expect(line).toContain("cannot be ruled free");
    expect(line).not.toContain(": FREE");
  }

  // AND THE CLAUSE AGREES IN NUMBER, which is the same defect this card
  // fixes in `lanes.ts`'s `fenced` residual: the mutation from "that
  // fence" to "those fences" must kill something.
  expect(oneBlind[0]).toContain("that fence could not be expanded");
  expect(oneBlind[0]).not.toContain("those fences");
  const twoBlind = contention(["T-901", "T-902"]);
  expect(twoBlind[0]).toContain("those fences could not be expanded");
  expect(twoBlind[0]).not.toContain("that fence");
  expect(twoBlind[0]).toContain("T-901, T-902");
});
