import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { repoRoot } from "../preflight";
import { conventionsText } from "../scripts/docs-scan.mjs";
import { render, unstampedLines, worktreePorcelain } from "../scripts/dispatch-brief.mjs";
import {
  PARSER_DIST,
  boardFiles,
  dispatchContext,
  dispatchReport,
  knownPathOracle,
  lanesFrom,
  listedCards,
  loadParser,
} from "../scripts/dispatch-order.mjs";

/**
 * THE DISPATCH COMMAND (T-137) — no browser.
 *
 * `brief.mjs --task` briefs ONE card. Nothing answered *"what is
 * dispatchable, in what order, given the live lanes"* for a session with
 * a terminal, which @human named a core feature of the product — and the
 * cost of that gap is on the record: the architect hand-rolled a fence
 * expansion an hour before this card was dispatched and reported two
 * overlapping cards disjoint, because the correct expansion was
 * unreachable from a shell.
 *
 * ── WHAT THESE BODIES ARE, AND ARE NOT ──────────────────────────────
 * The SCHEDULE rules are pinned in `lib/parser/test/task-waves.test.ts`
 * and the LANE rules in `lib/parser/test/lanes.test.ts`, both against
 * inline fixtures. Re-asserting them here would be a second copy of a
 * pin. These bodies are about the three things only the COMMAND can be
 * wrong about: its provenance, its lane list, and the fact that it
 * writes nothing.
 *
 * Every body names the PRODUCER mutant that kills it.
 */

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

/**
 * A worktree listing in git's own porcelain shape. THE POINT IS THE
 * SECOND AND THIRD ENTRIES — a detached worktree at a lane-shaped path,
 * and a detached one named after a card. Both existed on this repository
 * while T-133 was built, and a path filter counts them as lanes holding
 * fences nobody holds.
 */
const PORCELAIN_FIXTURE = [
  "worktree /Users/x/nputer",
  "HEAD 1111111111111111111111111111111111111111",
  "branch refs/heads/main",
  "",
  "worktree /Users/x/nputer-T-901",
  "HEAD 2222222222222222222222222222222222222222",
  "branch refs/heads/task/T-901-a-real-lane",
  "",
  "worktree /Users/x/nputer-T-902",
  "HEAD 3333333333333333333333333333333333333333",
  "detached",
  "",
  "worktree /Users/x/nputer-T-901-verify",
  "HEAD 2222222222222222222222222222222222222222",
  "detached",
  "",
].join("\n");

test("the lane list is filtered on the BRANCH, never the path", () => {
  // KILLED BY: filtering worktree entries on the PATH — the mutant that
  // turns three detached scratch checkouts into three lanes holding
  // fences nobody holds. `T-111-s5` measured that exact shape on this
  // repository: nine entries, three lanes, and a path filter would have
  // said six.
  const lanes = lanesFrom(PORCELAIN_FIXTURE, conventionsText());
  expect(lanes.map((l) => l.taskId)).toEqual(["T-901"]);
  expect(lanes[0]?.branch).toBe("refs/heads/task/T-901-a-real-lane");
  expect(lanes[0]?.worktree).toBe("/Users/x/nputer-T-901");
});

test("and the live repository AGREES with git worktree list, entry for entry", () => {
  // KILLED BY: any drift between the command's derivation and git's own
  // answer. This is a LIVE fact and is re-derived here rather than
  // quoted: the two sides share no constant.
  const porcelain = spawnSync("git", ["-C", repoRoot, "worktree", "list", "--porcelain"], {
    encoding: "utf8",
  });
  expect(porcelain.status).toBe(0);
  const derived = lanesFrom(porcelain.stdout, conventionsText()).map((l) => l.branch).sort();
  const byHand = porcelain.stdout
    .split(/\r?\n/)
    .filter((l) => l.startsWith("branch refs/heads/task/"))
    .map((l) => l.slice("branch ".length).trim())
    .sort();
  expect(derived).toEqual(byHand);
});

test("THE PROVENANCE FLOOR: every rendered line ends in a stamp", async () => {
  // KILLED BY: emitting any figure through an unstamped channel. T-133
  // built this floor and was REJECTED once for stamping reads of a
  // mutable ref as tree facts; this command's whole lane half is such a
  // read, so the floor is re-driven here rather than assumed.
  const ctx = await dispatchContext({ porcelain: PORCELAIN_FIXTURE });
  const rendered = render(dispatchReport(ctx));
  expect(unstampedLines(rendered)).toEqual([]);
  expect(rendered.split("\n").length).toBeGreaterThan(10);
});

test("the WORKTREE LIST is a LIVE fact and never carries a commit", async () => {
  // KILLED BY: stamping the lane lines with `tree(...)`. That is exactly
  // the three lines T-133 was rejected for. A worktree list is a read of
  // a mutable environment: re-read it and it changes while the ref it
  // would have been stamped at does not.
  const ctx = await dispatchContext({
    porcelain: PORCELAIN_FIXTURE,
    at: "1999-01-01T00:00:00.000Z",
    host: "a-test-host",
  });
  const rendered = render(dispatchReport(ctx));
  const laneLines = rendered
    .split("\n")
    .filter((l) => l.includes("refs/heads/task/T-901-a-real-lane"));
  expect(laneLines.length).toBeGreaterThan(0);
  for (const line of laneLines) {
    expect(line).toContain("<- read 1999-01-01T00:00:00.000Z on a-test-host ;");
    expect(line).not.toMatch(/<- @ [0-9a-f]{7,}/);
  }
  // THE POSITIVE CONTROL, without which "no line carries a commit" would
  // also pass a renderer that stamped nothing: a BOARD figure is a
  // function of the tree and carries the ref.
  const headLine = rendered.split("\n").find((l) => l.startsWith("HEAD in full:"));
  expect(headLine).toMatch(/<- @ [0-9a-f]{12} ; git rev-parse HEAD$/);
});

test("the oracle carries DIRECTORY PREFIXES, which is the half that closes the gap", () => {
  // KILLED BY: passing `git ls-files` straight through. That listing
  // names FILES, so `docs` never appears in it and a bare `docs` token
  // resolves to nothing — which is `T-111`'s 113 disagreeing pairs, an
  // ORACLE GAP that only a caller with a repository can close.
  const known = knownPathOracle();
  expect(known.has("docs")).toBe(true);
  expect(known.has("docs/tasks")).toBe(true);
  expect(known.has("docs/CONVENTIONS.md")).toBe(true);
  // The negative side is the whole point: `ci` is a live `touches:` token
  // on this board and there is nothing at the repository root called it.
  expect(known.has("ci")).toBe(false);
});

test("the board is read with REPOSITORY-RELATIVE paths, so a card's own file can be carved out", () => {
  // KILLED BY: switching to `parseProject(root)`, whose filesystem layer
  // stamps each card's `file` with an ABSOLUTE path. `expandFence` carves
  // a card's own file out of its own fence by comparing that field
  // against relative domains, so an absolute one silently skips the
  // carve-out — and a card holding a directory would collide with itself.
  const files = boardFiles();
  expect(files.length).toBeGreaterThan(10);
  for (const f of files) expect(path.isAbsolute(f.path)).toBe(false);
  expect(files.some((f) => f.path === "docs/ROADMAP.md")).toBe(true);
  expect(files.some((f) => f.path.startsWith("docs/architecture/components/"))).toBe(true);
  expect(files.every((f) => f.path.startsWith("docs/"))).toBe(true);
});

test("...AND THE CONTEXT ACTUALLY USES IT — this body exists because a mutant survived", async () => {
  // KILLED BY: swapping `parseProjectFromFiles(boardFiles(root))` back to
  // `parseProject(root)` inside `dispatchContext`.
  //
  // THE BODY ABOVE DID NOT KILL THAT MUTANT. It tests the HELPER and not
  // the CALL SITE, so arm A17 of this card's poison drill changed the
  // behaviour and the whole suite stayed at exit 0, 204 passed. A drill
  // that is entirely red is not evidence that the thing the card is for
  // is pinned (T-111's rejection, in one sentence) — and this is the arm
  // that proved it here rather than in a verdict.
  const ctx = await dispatchContext({ porcelain: PORCELAIN_FIXTURE });
  const rulings = ctx.order.all as { card: { file: string } }[];
  const files = rulings.map((r) => r.card.file);
  expect(files.length).toBeGreaterThan(10);
  for (const f of files) expect(path.isAbsolute(f), f).toBe(false);
  // The visible symptom, pinned at the surface a reader sees: a card's
  // path reaches the report through its provenance, and an absolute one
  // makes every stamped line a function of WHICH CHECKOUT ran rather than
  // of the tree.
  const rendered = render(dispatchReport(ctx));
  expect(rendered).toContain("; docs/tasks/");
  expect(rendered).not.toContain(`; ${repoRoot}/docs/tasks/`);
});

test("the parser is loaded from ONE place and a missing build REFUSES loudly", async () => {
  // KILLED BY: catching the import failure and falling back to a local
  // re-spelling of the schedule or the fence. A fourth spelling of the
  // fence rule is the defect this card removes; a command that cannot
  // reach the one implementation has no answer to give and says so.
  expect(PARSER_DIST.endsWith(path.join("lib", "parser", "dist", "index.js"))).toBe(true);
  await expect(loadParser(path.join(repoRoot, "lib", "parser", "dist", "no-such-entry.js")))
    .rejects.toThrow(/ADR-011 build order/);
  // POSITIVE CONTROL: the real entry loads and carries BOTH halves.
  const parser = await loadParser();
  expect(typeof parser["selectTaskSchedule"]).toBe("function");
  expect(typeof parser["readDispatchOrder"]).toBe("function");
  expect(typeof parser["expandFence"]).toBe("function");
});

test("--dispatch runs on the live repository, exits 0, and WRITES NOTHING", () => {
  // KILLED BY: any write. The card's criterion is explicit — the terminal
  // consumer SHALL write nothing — and an answer that edits the board it
  // is reporting on is not a report.
  const statusBefore = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], {
    encoding: "utf8",
  });
  const headBefore = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });

  const run = spawnSync(process.execPath, [CLI, "--dispatch"], { cwd: repoRoot, encoding: "utf8" });
  expect(run.status, run.stderr).toBe(0);
  expect(run.stdout).toContain("WHAT IS DISPATCHABLE, IN WHAT ORDER, GIVEN THE LIVE LANES");
  expect(run.stdout).toContain("STARTABLE NOW");
  expect(run.stdout).toContain("UNBLOCKED BUT FENCED");
  expect(run.stdout).toContain("BLOCKED — the unmet blocker is named");
  expect(run.stdout).toContain("critical path:");
  expect(run.stdout).toContain("worst blocker:");
  expect(unstampedLines(run.stdout.trimEnd())).toEqual([]);

  const statusAfter = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], {
    encoding: "utf8",
  });
  const headAfter = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  expect(statusAfter.stdout).toBe(statusBefore.stdout);
  expect(headAfter.stdout).toBe(headBefore.stdout);
});

test("--dispatch is a NAMED arm: an empty request is still a usage error", () => {
  // KILLED BY: making `--dispatch` the default when nothing is asked for.
  // An empty request is not a clean run; it is a question this command
  // was never asked, and the three arms compose rather than substitute.
  const empty = spawnSync(process.execPath, [CLI], { cwd: repoRoot, encoding: "utf8" });
  expect(empty.status).toBe(2);
  expect(empty.stderr).toContain("--dispatch");
  const help = spawnSync(process.execPath, [CLI, "--help"], { cwd: repoRoot, encoding: "utf8" });
  expect(help.status).toBe(0);
  expect(help.stdout).toContain("--dispatch");
});

test("the STARTABLE set is exactly the ready set minus what the live lanes hold", async () => {
  // KILLED BY: dropping either term. This is the card's own equation
  // checked against the live board rather than a fixture: the two sides
  // are computed from different fields — `blocked_by` on the left, the
  // worktree list on the right — and the arithmetic has to close.
  const ctx = await dispatchContext({});
  const o = ctx.order;
  const readyIds = new Set(o.schedule.readyNow);
  const ruled = [...o.startable, ...o.fenced, ...o.unfenceable];
  expect(ruled.map((r) => r.id).sort()).toEqual([...readyIds].sort());
  // A CARDINALITY FLOOR, so this body cannot go vacuous the day the live
  // lane list empties one of the three sets: every per-set loop below is
  // satisfied by an EMPTY set, and an assertion set with no floor deletes
  // its own failure (CONVENTIONS' shape five).
  expect(ruled.length).toBeGreaterThan(0);
  for (const r of ruled) expect(r.reason, r.id).not.toBe("");
  for (const r of o.startable) expect(r.holds).toEqual([]);
  for (const r of o.fenced) expect(r.holds.length).toBeGreaterThan(0);
  for (const r of o.unfenceable) expect(r.holds.length).toBeGreaterThan(0);
});

test("a lane with NO CARD IN THIS CHECKOUT empties STARTABLE — asserted at the CALL SITE", async () => {
  // KILLED BY: `if (other === undefined) continue` in the parser's
  // `readDispatchOrder` — the mutant that ruled 15 of 23 live cards
  // "disjoint from every live lane" without ever comparing them against
  // `T-141`.
  //
  // THE PARSER'S OWN BODY IS NOT ENOUGH, AND THAT IS WHY THIS ONE EXISTS.
  // This lane has now been caught TWICE with a pin on the helper while
  // the call site went unpinned — arm A17 once, and the ruling itself at
  // `62a4364` — so the safety-relevant choice is driven here through the
  // command's whole path: real board, real oracle, rendered report.
  // `T-901` in the fixture above is a branch whose card is on nobody's
  // disk, which is the ORDINARY state of every lane newer than the
  // checkout reading it.
  const ctx = await dispatchContext({ porcelain: PORCELAIN_FIXTURE });
  expect(ctx.order.lanesWithNoCard).toEqual(["T-901"]);
  expect(ctx.order.startable).toEqual([]);
  expect(ctx.order.unfenceable.length).toBeGreaterThan(0);
  for (const r of ctx.order.unfenceable) {
    expect(r.holds.some((h: { cardMissing: boolean }) => h.cardMissing)).toBe(true);
  }
  const rendered = render(dispatchReport(ctx));
  // The false-green SENTENCE, hunted where a card's ruling renders — the
  // three-space indent — and not in the section header, which says
  // "PROVED disjoint" as a heading and is not a claim about any card.
  const reasons = (text: string) => text.split("\n").filter((l) => l.startsWith("   "));
  expect(reasons(rendered).filter((l) => l.includes("disjoint from every live lane"))).toEqual([]);
  expect(rendered).toContain("T-901 IS A LANE WITH NO CARD IN THIS CHECKOUT");
  expect(rendered).toContain("nothing is startable, and the reason is NOT the board");
  expect(rendered).toContain("UNFENCEABLE");

  // THE POSITIVE CONTROL, without which a command that never ruled
  // ANYTHING startable would pass every assertion above: the same board,
  // the same code path, a porcelain with NO lane at all — and both the
  // set and the sentence come back.
  const free = await dispatchContext({
    porcelain: ["worktree /Users/x/nputer", "HEAD " + "1".repeat(40), "branch refs/heads/main", ""].join(
      "\n",
    ),
  });
  expect(free.order.lanesWithNoCard).toEqual([]);
  expect(free.order.startable.length).toBeGreaterThan(0);
  expect(
    reasons(render(dispatchReport(free))).filter((l) => l.includes("disjoint from every live lane"))
      .length,
  ).toBeGreaterThan(0);
});

/**
 * THE IN FLIGHT SECTION'S ROWS — its own three note lines dropped, and
 * the section closed at the blank line that ends it.
 *
 * A SECTION BOUNDARY IS STRUCTURE AND NEVER A CHARACTER COUNT
 * (T-143-s4). The body below used to read a fixed 600-character window
 * out of the rendered report; every rendered line ends in a provenance
 * stamp and every stamp carries the card's FULL PATH, so the window a
 * row actually got shrank with its own filename. `render` writes a note
 * as `# `, a blank record as the empty string, and nothing else — so
 * both edges here are the renderer's own shape, which moves with the
 * report instead of against it.
 */
function inFlightRows(rendered: string): string[] {
  const lines = rendered.split("\n");
  const headerAt = lines.findIndex((l) => l.includes("IN FLIGHT ON THE BOARD"));
  if (headerAt === -1) return [];
  let first = headerAt;
  while (first < lines.length && (lines[first] ?? "").startsWith("# ")) first += 1;
  const end = lines.indexOf("", first);
  return lines.slice(first, end === -1 ? lines.length : end);
}

/**
 * ONE card's BLOCK inside those rows: its own row, plus every line under
 * it, up to the next row that starts a DIFFERENT card id — or the
 * section's end, for the last card. A card's row starts at column 0; its
 * continuation rows are indented, which is `dispatchReport`'s own shape
 * for a ruling and not a fact re-spelled here.
 *
 * The ` [` is load-bearing: `T-143` is a prefix of `T-143-s4` and the
 * bracket is what separates the id from the roadmap cell behind it.
 */
function blockFor(rows: string[], id: string): string[] {
  const start = rows.findIndex((l) => l.startsWith(`${id} [`));
  if (start === -1) return [];
  let end = rows.length;
  for (let i = start + 1; i < rows.length; i += 1) {
    const row = rows[i] ?? "";
    if (/^\S/.test(row) && !row.startsWith(`${id} [`)) {
      end = i;
      break;
    }
  }
  return rows.slice(start, end);
}

test("A CARD IN FLIGHT WITH A DECLARED FENCE APPEARS IN THE REPORT — and is not sold as a hold", async () => {
  // T-137-s10, absorbed by T-143. `readDispatchOrder` computes seven
  // states and this report emitted six: a card at `status: building`
  // with a declared fence appeared ZERO times in the whole answer, so a
  // session choosing among cards that overlap its ground by containment
  // was never told such a card existed. The architect reports nearly
  // dispatching against one.
  //
  // KILLED BY: deleting the section, or by widening it back to the
  // scheduler's whole `underway` set — which holds every `done` and
  // `parked` card and is a dump rather than a report.
  const ctx = await dispatchContext({});
  const parser = await loadParser();
  const rendered = render(dispatchReport(ctx));
  expect(unstampedLines(rendered)).toEqual([]);
  expect(rendered).toContain("IN FLIGHT ON THE BOARD");

  const inFlight = ctx.order.underway.filter((r: { card: { status: string } }) =>
    parser.IN_FLIGHT.has(r.card.status),
  );
  // BOTH ARMS OF THE LIVE BOARD ARE ASSERTED, NEITHER VACUOUSLY. This
  // body used to demand a populated in-flight column as its positive
  // control — and T-135's close (2026-08-30) emptied that column for
  // the FIRST TIME IN THE BOARD'S HISTORY: the control refused to pass
  // vacuously, exactly as built, and revealed that a permanently
  // `building` card had been this body's unnamed fixture. The live half
  // now asserts whichever state the board is in (the empty arm is the
  // report's own honest line, stamped like everything else), and the
  // POPULATED mechanism is pinned on an injected board in the body
  // below — the select-board/T-163 pattern: the live half states the
  // fact, the mechanism keeps a fixture that cannot evaporate.
  if (inFlight.length === 0) {
    expect(rendered).toContain("no card is in flight on the board");
  }
  for (const r of inFlight) expect(rendered).toContain(r.id);

  // AND THE SECTION IS NARROWER THAN `underway`, through the PARSER'S
  // OWN SET. `done` cards are `underway` to the scheduler and must not
  // be listed: 127 of them at `c74890a8` would bury the two that matter.
  const doneOnes = ctx.order.underway.filter(
    (r: { card: { status: string } }) => !parser.IN_FLIGHT.has(r.card.status),
  );
  expect(
    doneOnes.length,
    "nothing is underway-but-not-in-flight, so the narrowing is untested here",
  ).toBeGreaterThan(0); // done cards exist on any real board; this one keeps teeth
  const section = rendered.slice(rendered.indexOf("IN FLIGHT ON THE BOARD"));
  for (const r of doneOnes.slice(0, 20)) expect(section).not.toContain(`${r.id} [`);

  // MECHANISM 2 STAYS REFUSED, AND THIS IS WHERE IT WOULD BE QUIETLY
  // UNDONE. A `status:` stamp is not a hold — the lane list is
  // authoritative and the board under-reports by construction — so every
  // row here says which of the two it is, and a card with no lane says
  // it holds nothing.
  expect(section).toContain("is NOT a fence hold");

  // THE WINDOW EACH ROW IS READ IN IS DERIVED FROM STRUCTURE, NOT FROM A
  // CONSTANT (T-143-s4). This loop used to assert the sentence inside
  // `after.slice(0, 600)`, and a card's block is not 600 characters
  // wide: it is three stamped lines, each carrying the card's own FULL
  // PATH, so the room left for the sentence is a function of the
  // filename and the title. `T-025-s5`'s 119-character path redded CI
  // run #376 on a report that printed exactly the right thing, while
  // every local run of the same body stayed GREEN — locally that card
  // HAD a lane and took the shorter "HAS a lane above" arm, and the
  // no-lane arm only ever executes where no worktrees exist, which is CI
  // and nowhere else this project runs. Re-measured at `4d3dd8f` in a
  // clone with no sibling worktrees: this card's own row put the phrase
  // at offsets 581..617 against the 600 cliff, truncated mid-word.
  //
  // WIDENING THE CONSTANT IS NOT THE FIX — the next filename beats any
  // number, and the failure mode is silent everywhere but CI.
  const rows = inFlightRows(rendered);
  for (const r of inFlight) {
    const hasLane = ctx.order.lanes.some((l: { taskId: string }) => l.taskId === r.id);
    const block = blockFor(rows, r.id);
    expect(block.length, `${r.id} is in flight and is not listed`).toBeGreaterThan(0);
    // AND THE BLOCK IS THIS CARD'S AND NO OTHER'S, which is what keeps a
    // structural window from quietly becoming a bigger net: exactly one
    // line in it starts at column 0, and it is this card's row. Without
    // this, a boundary that failed to close would satisfy every
    // assertion below out of some other card's rows.
    const head = block[0] ?? "";
    expect(block.filter((l) => /^\S/.test(l)), `${r.id}'s block holds another card's row`).toEqual([
      head,
    ]);
    expect(head.startsWith(`${r.id} [`), `${r.id}'s block does not open on its own row`).toBe(true);
    // The RULING rows only — the title row is dropped, because a card's
    // title is the other data-length contributor and is not where this
    // sentence prints.
    const ruling = block.slice(1).join("\n");
    expect(ruling, `${r.id} is in flight and its lane sentence is not in its own block`).toContain(
      hasLane ? "it HAS a lane above" : "it has NO lane, so it holds no fence",
    );
    // ...and the OTHER arm is absent from it, so the row SAYS which of
    // the two it is rather than merely containing a sentence somewhere.
    expect(ruling, `${r.id}'s block carries both arms`).not.toContain(
      hasLane ? "it has NO lane, so it holds no fence" : "it HAS a lane above",
    );
  }
});

/* ════════════════════════════════════════════════════════════════════
 * THE DISPATCHABLE-NOW FILTER (T-225, decision 2) — the lever that
 * scales, and the control that stops it scaling by lying.
 * ════════════════════════════════════════════════════════════════════ */

/** @see the disclosure precedent in brief.spec.ts and brief-flush.spec.ts. */
function disclose(label: string, line: string): void {
  test.info().annotations.push({ type: label, description: line });
  process.stdout.write(`\n  ${label}: ${line}\n`);
}

/**
 * A board built to hold every set this filter touches, so no merge and no
 * removed worktree can empty it — the select-board pattern the in-flight
 * body above already uses, for the same reason it uses it.
 *
 * `T-901` is the LANE, and its card is present: that is what separates
 * `fenced` from `unfenceable`, since a lane whose card this checkout
 * cannot read holds nothing it can name.
 */
const FILTER_BOARD = [
  { path: "docs/ROADMAP.md", content: "# R\n\n## Backbone\n- F-01: Method — the convention\n" },
  {
    path: "docs/tasks/T-901-the-lane-itself.md",
    content:
      "---\nid: T-901\ntitle: The lane itself\nfeature: F-01\nmilestone: 1\npriority: 1\n" +
      "size: S\nstatus: building\nblocked_by: []\ntouches: [tools/e2e]\nbuilder: m@x\n---\n\nbody\n",
  },
  {
    path: "docs/tasks/T-950-fenced-one.md",
    content:
      "---\nid: T-950\ntitle: Fenced one\nfeature: F-01\nmilestone: 1\npriority: 2\n" +
      "size: S\nstatus: planned\nblocked_by: []\ntouches: [tools/e2e]\n---\n\nbody\n",
  },
  {
    path: "docs/tasks/T-951-fenced-two.md",
    content:
      "---\nid: T-951\ntitle: Fenced two\nfeature: F-01\nmilestone: 1\npriority: 3\n" +
      "size: S\nstatus: planned\nblocked_by: []\ntouches: [tools/e2e]\n---\n\nbody\n",
  },
  {
    path: "docs/tasks/T-952-startable.md",
    content:
      "---\nid: T-952\ntitle: Startable\nfeature: F-01\nmilestone: 1\npriority: 4\n" +
      "size: S\nstatus: planned\nblocked_by: []\ntouches: [lib/parser]\n---\n\nbody\n",
  },
  {
    path: "docs/tasks/T-953-blocked.md",
    content:
      "---\nid: T-953\ntitle: Blocked\nfeature: F-01\nmilestone: 1\npriority: 5\n" +
      "size: S\nstatus: planned\nblocked_by: [T-999]\ntouches: [lib/parser]\n---\n\nbody\n",
  },
];

/** Only `T-901`, so `T-950`/`T-951` are fenced and `T-952` is not. */
const ONE_LANE = [
  "worktree /Users/x/nputer",
  "HEAD 1111111111111111111111111111111111111111",
  "branch refs/heads/main",
  "",
  "worktree /Users/x/nputer-T-901",
  "HEAD 2222222222222222222222222222222222222222",
  "branch refs/heads/task/T-901-a-real-lane",
  "",
].join("\n");

/** A card's own ROW — the report writes one at column 0, `id [` first. */
function rowFor(rendered: string, id: string): string[] {
  return rendered.split("\n").filter((l) => l.startsWith(`${id} [`));
}

test("THE DISPATCHABLE-NOW FILTER: the default spells out what can START and COUNTS what cannot", async () => {
  // KILLED BY: dropping the `ctx.full` branch in `dispatchReport`, in
  // either direction. Wire the fenced/waiting/blocked sets back to a row
  // per card and the default view gains rows it must not have; delete
  // the `--full` arm and the triage answer is gone.
  //
  // WHY AN INJECTED BOARD AND A LIVE ONE BOTH: this one pins the
  // MECHANISM against a fixture no merge can empty, and the body two
  // below measures the same filter on the REAL board at this ref,
  // because the card's own criterion refuses a synthesised measurement
  // standing alone.
  const opts = { files: FILTER_BOARD, porcelain: ONE_LANE };
  const def = await dispatchContext(opts);
  const full = await dispatchContext({ ...opts, full: true });
  const defText = render(dispatchReport(def));
  const fullText = render(dispatchReport(full));
  expect(unstampedLines(defText)).toEqual([]);
  expect(unstampedLines(fullText)).toEqual([]);

  // THE FIXTURE IS LOAD-BEARING AND IS ASSERTED, not assumed: a board
  // where nothing is fenced would satisfy every "absent" check below
  // vacuously (CONVENTIONS' shape five, one level up).
  expect(def.order.fenced.map((r: { id: string }) => r.id)).toEqual(["T-950", "T-951"]);
  expect(def.order.startable.map((r: { id: string }) => r.id)).toEqual(["T-952"]);
  expect(def.order.blocked.map((r: { id: string }) => r.id)).toEqual(["T-953"]);

  // WHAT CAN START IS SPELLED OUT IN BOTH.
  expect(rowFor(defText, "T-952")).toHaveLength(1);
  expect(rowFor(fullText, "T-952")).toHaveLength(1);

  // WHAT CANNOT START HAS NO ROW IN THE DEFAULT, AND HAS ONE IN --full.
  for (const id of ["T-950", "T-951", "T-953"]) {
    expect(rowFor(defText, id), `${id} still has a row in the dispatchable-now view`).toEqual([]);
    expect(rowFor(fullText, id), `${id} lost its row in the unfiltered view`).toHaveLength(1);
  }

  // AND THE COUNTED LINES NAME WHAT A READER ACTS ON — the LANE to free,
  // and the BLOCKER to watch. A bare count would move the reader's next
  // question somewhere this command cannot answer it.
  expect(defText).toContain("2 card(s) are unblocked and fenced out, held by T-901");
  expect(defText).toContain("1 card(s) are blocked, on unmet blockers T-999");

  // THE UNFILTERED VIEW KEEPS THE SENTENCE THAT IS THE WHOLE REASON THIS
  // COMMAND EXISTS: which paths, exactly, are shared.
  expect(fullText).toContain("holds tools/e2e");
  expect(defText).not.toContain("holds tools/e2e");

  // ...and the default is SMALLER, which is the only thing about this
  // change that the board's growth was ever about.
  expect(Buffer.byteLength(defText, "utf8")).toBeLessThan(Buffer.byteLength(fullText, "utf8"));
});

test("THE POSITIVE CONTROL: the filter changes what is SPELLED OUT and never what is RULED ON", async () => {
  // KILLED BY: a filter that drops cards from the RULING rather than
  // from the printing — narrowing `readDispatchOrder`'s inputs, skipping
  // a set, or capping a list. Every one of those makes this command
  // smaller and would read as a fix on every size T-225 measures, which
  // is the defect that card names in as many words: an emitter made
  // unbreakable by emitting less.
  const opts = { files: FILTER_BOARD, porcelain: ONE_LANE };
  const def = await dispatchContext(opts);
  const full = await dispatchContext({ ...opts, full: true });
  const census = (t: string) => t.split("\n").filter((l) => l.startsWith("ruled: "));

  // ONE CENSUS LINE EACH, and its RULED half is identical across the two
  // verbosities. The two runs share no constant: each counts its own
  // `DispatchOrder`.
  const [defCensus] = census(render(dispatchReport(def)));
  const [fullCensus] = census(render(dispatchReport(full)));
  expect(defCensus, "the default view emits no census line").toBeTruthy();
  expect(fullCensus, "the unfiltered view emits no census line").toBeTruthy();
  const ruledHalf = (l: string) => l.slice(0, l.indexOf(" — "));
  expect(ruledHalf(String(defCensus))).toBe(ruledHalf(String(fullCensus)));
  expect(String(defCensus)).toContain(
    "ruled: 1 startable, 2 fenced, 0 unfenceable, 0 waiting, 1 blocked",
  );

  // AND THE CENSUS AGREES WITH THE ORDER IT WAS COMPUTED FROM, so the
  // line cannot go stale into a comfortable constant.
  const o = def.order;
  const ruled = [...o.startable, ...o.fenced, ...o.unfenceable, ...o.waits, ...o.blocked];
  expect(ruled.length).toBe(4);
  expect(String(defCensus)).toContain(`${listedCards(def)} card(s) spelled out`);
  expect(String(fullCensus)).toContain(`${listedCards(full)} card(s) spelled out`);
  expect(listedCards(full)).toBeGreaterThan(listedCards(def));

  // THE COMPLETE BOARD IS STILL EMITTED, and this is the arm that says
  // so: every card the command ruled on has a row in `--full`.
  const fullText = render(dispatchReport(full));
  for (const r of ruled) {
    expect(rowFor(fullText, r.id), `${r.id} was ruled on and has no row in --full`).toHaveLength(1);
  }
});

test("...AND THE FILTER IS MEASURED ON THE REAL BOARD AT THIS REF, never on the fixture alone", async () => {
  // KILLED BY: the same mutants as the body above, and by a filter that
  // buys nothing on real input — a saving measured only on a board
  // chosen to fit is not evidence about the board this command runs on.
  //
  // ONE READ OF THE WORKTREE LIST FEEDS BOTH VIEWS. Two live reads of a
  // board the dispatcher is moving is `T-220`'s own failure at this same
  // seam, and a delta between two different boards is not a delta.
  const porcelain = worktreePorcelain(repoRoot);
  const def = await dispatchContext({ porcelain });
  const full = await dispatchContext({ porcelain, full: true });
  const defBytes = Buffer.byteLength(render(dispatchReport(def)), "utf8");
  const fullBytes = Buffer.byteLength(render(dispatchReport(full)), "utf8");
  const fenced = full.order.fenced.length;

  disclose(
    "dispatch FILTER",
    `at ${def.ref.slice(0, 12)} with ${full.order.lanes.length} lane(s) live: the unfiltered view ` +
      `is ${fullBytes} bytes and the dispatchable-now view is ${defBytes}, a saving of ` +
      `${fullBytes - defBytes} over ${fenced} fenced, ${full.order.waits.length} waiting and ` +
      `${full.order.blocked.length} blocked card(s). ${full.order.startable.length} card(s) are ` +
      "startable and are spelled out in both.",
  );

  // THE RULING IS THE SAME BOARD IN BOTH — asserted on the live one too,
  // because that is the claim a reader of the default view is relying on.
  expect(def.order.all.length).toBe(full.order.all.length);
  expect(def.order.startable.map((r: { id: string }) => r.id)).toEqual(
    full.order.startable.map((r: { id: string }) => r.id),
  );

  // AND THE HONEST ARM. A board with nothing held has nothing to filter,
  // so this run SAYS which of the two it was rather than reporting an
  // unqualified saving — the coverage disclosure brief-flush.spec.ts
  // already keeps for its own vacuous case.
  if (fenced + full.order.waits.length + full.order.blocked.length === 0) {
    disclose(
      "dispatch FILTER COVERAGE",
      "no card is held on this board today, so the two views coincide and THIS run measures " +
        "nothing — the injected board above is the one carrying the proof.",
    );
    expect(defBytes).toBe(fullBytes);
  } else {
    expect(defBytes).toBeLessThan(fullBytes);
  }
});

test("the in-flight section's POPULATED arm, on an injected board that cannot evaporate", async () => {
  // The fixture the live body lost at T-135's close, rebuilt where no
  // merge can empty it: two injected cards — one building with a
  // declared bare-path fence, one done — plus the porcelain fixture's
  // lanes. KILLED BY: the report dropping building cards, widening back
  // to `underway`, or the lane-or-no-lane sentence leaving the row.
  const files = [
    { path: "docs/ROADMAP.md", content: "# R\n\n## Backbone\n- F-01: Method — the convention\n" },
    {
      path: "docs/tasks/T-940-in-flight-fixture.md",
      content:
        "---\nid: T-940\ntitle: In-flight fixture\nfeature: F-01\nmilestone: 1\npriority: 1\n" +
        "size: S\nstatus: building\nblocked_by: []\ntouches: [tools/e2e]\nbuilder: m@x\n---\n\nbody\n",
    },
    {
      path: "docs/tasks/T-941-done-fixture.md",
      content:
        "---\nid: T-941\ntitle: Done fixture\nfeature: F-01\nmilestone: 1\npriority: 1\n" +
        "size: S\nstatus: done\nblocked_by: []\ntouches: [tools/e2e]\nbuilder: m@x\n" +
        "verifier: m@x\nbuilt_by: m@x\nverified_by: m@x\n---\n\nbody\n",
    },
  ];
  const ctx = await dispatchContext({ files, porcelain: PORCELAIN_FIXTURE });
  const rendered = render(dispatchReport(ctx));
  expect(unstampedLines(rendered)).toEqual([]);
  const section = rendered.slice(rendered.indexOf("IN FLIGHT ON THE BOARD"));
  const rows = inFlightRows(rendered);
  const block = blockFor(rows, "T-940");
  expect(block.length, "the building card is not listed").toBeGreaterThan(0);
  expect((block[0] ?? "").startsWith("T-940 [")).toBe(true);
  // No lane in the porcelain fixture is T-940's, so the no-lane arm:
  const ruling = block.slice(1).join("\n");
  expect(ruling).toContain("it has NO lane, so it holds no fence");
  expect(ruling).not.toContain("it HAS a lane above");
  // ...and the narrowing: the done card must not appear as a row.
  expect(section).not.toContain("T-941 [");
  expect(section).toContain("is NOT a fence hold");
});
