import { spawnSync } from "node:child_process";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseYaml } from "yaml";
import { repoRoot } from "../preflight";
import { conventionsText, liveTaskCards, trackedFiles } from "../scripts/docs-scan.mjs";
import {
  DERIVERS,
  EXIT,
  architectureText,
  assembleBrief,
  boardCensus,
  ceremonyRows,
  components,
  contractRows,
  context,
  fenceOverlaps,
  frontmatterFields,
  laneSpellings,
  laneWorktrees,
  liveProv,
  namedDisciplines,
  note,
  packageCommands,
  parseWorktreePorcelain,
  readDoc,
  render,
  roleText,
  slugMapFromFields,
  slugMapFromProse,
  standingGates,
  stateReport,
  treeProv,
  unstampedLines,
  value,
  worktreePorcelain,
} from "../scripts/dispatch-brief.mjs";

/**
 * THE BRIEF COMMAND (T-133) — no browser.
 *
 * `method/roles/orchestrator.md` already requires a brief "assembled to
 * the contract in roles/executor.md — every row, from the sources that
 * row names", and every dispatch brief written on 2026-08-25 broke it by
 * filling rows from memory. The prose was quoted and did not bind, so the
 * remedy is a command; this file is what stops the command drifting back
 * into a second copy of the contract.
 *
 * ── WHAT A PIN CAN AND CANNOT SHOW HERE (T-080-s1, stated rather than
 *    dodged) ─────────────────────────────────────────────────────────
 * The criterion asks that pins FAIL against the pre-fix tree. On this
 * card the pre-fix tree has no command at all, so every body below would
 * fail to IMPORT rather than fail on a property — which is a green that
 * proves nothing about the behaviour. The honest measurement is therefore
 * the POISON DRILL recorded in the card's implementation notes: each
 * mutant moves the PRODUCER (this module, or the document it reads) and
 * never an assertion, and the kill is measured against the WHOLE suite
 * rather than asserted. Every body here says which mutant kills it.
 *
 * ── HOW TO READ A FAILURE ────────────────────────────────────────────
 * Two sides that share no constant: the derivation computes on one, the
 * document is read on the other. A red means they disagree and the
 * message names both. It does not say which is wrong — a figure this
 * command emits is a measurement at a ref, so check the ref before
 * editing anything.
 */

const CLI = path.join(repoRoot, "tools", "e2e", "scripts", "brief.mjs");

/**
 * A worktree listing in git's own porcelain shape, built here rather than
 * created on disk. THE POINT OF THE FIXTURE IS THE SECOND AND THIRD
 * ENTRIES: a DETACHED worktree at a lane-shaped path, and a detached one
 * named after a card. Both existed on this repository while this card was
 * being built — `nputer-T-132-verify` at dispatch and `nputer-T-127-verify`
 * an hour later — and a path filter counts both as lanes holding fences
 * that nobody holds.
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
  "worktree /Users/x/nputer-T-903",
  "HEAD 4444444444444444444444444444444444444444",
  "branch refs/heads/not-a-task-branch",
  "",
].join("\n");

/** @see the drill affordance in dispatch-brief.mjs — every read takes a root. */
function conventions(): string {
  return conventionsText();
}

test("the ROW SET is read from the role file, and the coverage runs both ways", () => {
  const md = roleText("executor");
  const rows = contractRows(md);
  expect(rows.length).toBeGreaterThan(0);

  // SHAPE FIVE's remedy, applied to a tool whose expectations are parsed
  // rather than written. Without both directions, deleting a deriver
  // deletes its own failure and adding one invents a row.
  const labels = rows.map((r) => r.key);
  const derivers = [...DERIVERS.keys()];
  const unanswered = labels.filter((k) => !derivers.includes(k));
  const orphaned = derivers.filter((k) => !labels.includes(k));
  expect(
    unanswered,
    `the contract table carries rows this command cannot assemble: ${unanswered.join(", ")}. ` +
      "A row with no deriver is a row a brief fills by guessing, which is the defect this card exists for.",
  ).toEqual([]);
  expect(
    orphaned,
    `this command derives rows the table no longer carries: ${orphaned.join(", ")}. A deriver ` +
      "with no row is a SECOND row set, which is exactly what reading the table was meant to prevent.",
  ).toEqual([]);

  // Every row names a source, and no row's source is this file.
  for (const row of rows) {
    expect(row.source.length, `row ${row.n} names no source`).toBeGreaterThan(0);
  }
});

test("the row set FOLLOWS the document — it is not pinned here", () => {
  const md = roleText("executor");
  const before = contractRows(md);
  const last = before[before.length - 1];
  expect(last).toBeDefined();

  // ONE SIDE ONLY: the DOCUMENT moves, in memory. Nothing in the module
  // is touched. A parser that pinned the row set would be green here and
  // green with the table rewritten — indistinguishable from one that reads.
  const target = `| ${last?.n} | ${last?.carries}`;
  expect(md).toContain(target);
  const dropped = md.split("\n").filter((l) => !l.trim().startsWith(target)).join("\n");
  expect(dropped).not.toBe(md);
  const after = contractRows(dropped);
  expect(
    after.length,
    "the parsed row set did not follow the document, so it is not reading it",
  ).toBe(before.length - 1);

  // And a row this command can no longer answer is REPORTED, never dropped.
  const renamed = md.replace(`**${last?.label}**`, "**A row nobody derives**");
  expect(renamed).not.toBe(md);
  const renamedRows = contractRows(renamed);
  expect(renamedRows.map((r) => r.key)).toContain("a row nobody derives");
});

test("a contract table this command cannot read THROWS, never yields an empty contract", () => {
  const md = roleText("executor");
  // POSITIVE CONTROL. Without it, "it throws" is satisfied equally by a
  // reader that refuses this table and one that refuses every table.
  expect(() => contractRows(md)).not.toThrow();

  expect(() => contractRows(md.replace("| Assembled from |", "| Where from |"))).toThrow(
    /expected exactly one/,
  );
  const rows = contractRows(md);
  const second = rows[1];
  expect(second).toBeDefined();
  const renumbered = md.replace(`| ${second?.n} | **${second?.label}**`, `| 9 | **${second?.label}**`);
  expect(renumbered).not.toBe(md);
  expect(() => contractRows(renumbered)).toThrow(/numbered consecutively/);
});

test("THE LANE LIST FILTERS ON THE BRANCH, NEVER THE PATH", () => {
  const spellings = laneSpellings(conventions());
  const lanes = laneWorktrees(PORCELAIN_FIXTURE, spellings);
  const ids = lanes.map((l) => l.taskId);

  // POSITIVE CONTROL FIRST. "T-902 is absent" is satisfied by a function
  // that returns nothing at all, and only one of those is the property.
  expect(
    ids,
    "the real lane is missing, so every absence below proves nothing",
  ).toContain("T-901");

  // THE CARD'S SECOND CRITERION, as a body: a DETACHED worktree at a
  // lane-shaped path is not a lane and holds no fence.
  expect(
    ids,
    "a detached worktree at a lane-shaped path was counted as a lane — that is a fence " +
      "attributed to nobody, and two such worktrees existed on this repository while this card " +
      "was being built",
  ).not.toContain("T-902");
  // A detached checkout NAMED after a card is the same error wearing a
  // better disguise: under a path filter `nputer-T-901-verify` becomes a
  // SECOND T-901 lane holding the same fence twice.
  expect(
    lanes.filter((l) => l.taskId === "T-901").length,
    "one card, one fence — a verifier's detached checkout beside a lane is not a second lane",
  ).toBe(1);
  expect(ids, "a worktree on a NON-task branch is not a lane").not.toContain("T-903");
  expect(ids).toEqual(["T-901"]);
  for (const lane of lanes) expect(lane.branch).not.toBe("");
});

test("the branch filter is DERIVED from the spelling CONVENTIONS publishes", () => {
  const md = conventions();
  const before = laneSpellings(md);
  expect(before.branchRe.test("refs/heads/task/T-901-a-real-lane")).toBe(true);

  // ONE SIDE ONLY: the DOCUMENT's branch spelling moves. A matcher typed
  // into the module would not follow it, and would then filter on a
  // pattern this project no longer publishes.
  const moved = md.replace(
    `branch \`${before.branchPattern}\``,
    "branch `lane/T-NNN-<slug>`",
  );
  expect(moved).not.toBe(md);
  const after = laneSpellings(moved);
  expect(after.branchPattern).toBe("lane/T-NNN-<slug>");
  expect(after.branchRe.test("refs/heads/task/T-901-a-real-lane")).toBe(false);
  expect(after.branchRe.test("refs/heads/lane/T-901-a-real-lane")).toBe(true);
});

test("the lane spellings refuse a near-miss rather than answering with it", () => {
  const md = conventions();
  const s = laneSpellings(md);
  // `integration branch \`main\`` ends in "branch", and reading the
  // integration branch as the lane pattern is precisely the near-miss a
  // brief assembled from memory makes. This body pins the guard: the two
  // must come back different, and the lane pattern must be a pattern.
  expect(s.integrationBranch).not.toBe(s.branchPattern);
  expect(s.branchPattern).toContain("T-NNN");
  expect(s.createCommand).toContain(s.branchPattern);
  expect(s.createCommand).toContain(s.worktreePattern);
});

test("the LIVE worktree list is parsed, and every derived lane is on a task branch", () => {
  const entries = parseWorktreePorcelain(worktreePorcelain(repoRoot));
  expect(entries.length, "this checkout is itself a worktree, so the list is never empty").toBeGreaterThan(0);
  expect(entries.some((e) => path.resolve(e.path) === path.resolve(repoRoot))).toBe(true);
  const lanes = laneWorktrees(worktreePorcelain(repoRoot), laneSpellings(conventions()));
  for (const lane of lanes) {
    expect(lane.branch.startsWith("refs/heads/")).toBe(true);
    expect(lane.head).toMatch(/^[0-9a-f]{40}$/);
    expect(entries.some((e) => e.path === lane.path && e.branch === lane.branch)).toBe(true);
  }
});

test("EVERY EMITTED FIGURE CARRIES ITS PROVENANCE, and the detector is not vacuous", () => {
  const ctx = context({ taskId: "T-133" });
  const { recs } = assembleBrief(ctx);
  const rendered = render(recs);
  expect(rendered.length).toBeGreaterThan(0);
  expect(
    unstampedLines(rendered),
    "a line left this command with no ref and no reading time — that is the defect the card " +
      "exists to stop, reproduced by the tool built to stop it",
  ).toEqual([]);

  // The `--full` path renders more text through the same channel, and an
  // unchecked branch is where a bare figure would sit.
  expect(unstampedLines(render(assembleBrief(context({ taskId: "T-133", full: true })).recs))).toEqual([]);

  // POSITIVE CONTROL for the detector itself, against the REAL report
  // rather than a synthetic line: strip every stamp and require the
  // detector to name every line it took one from. Without this, "no
  // unstamped lines" is satisfied by a detector that sees nothing — and
  // this detector DID miss the live stamps on its first run, because an
  // alternation had picked up a leading space.
  const stampedCount = rendered.split("\n").filter((l) => l.includes("  <- ")).length;
  expect(stampedCount).toBeGreaterThan(20);
  const stripped = rendered
    .split("\n")
    .map((l) => l.replace(/ {2}<- .*$/, ""))
    .join("\n");
  expect(unstampedLines(stripped).length).toBe(stampedCount);
  expect(unstampedLines("lanes live right now: three")).toEqual(["lanes live right now: three"]);
  expect(unstampedLines("# a note carries no figure")).toEqual([]);

  // The channel that could carry a bare figure is closed by construction.
  expect(() => note("there are 3 lanes")).toThrow(/may not carry a digit/);
  expect(() => note("the lane list is a fact on disk")).not.toThrow();
});

test("a TREE fact carries a ref and a LIVE fact carries a clock — never the other way round", () => {
  const ctx = context({ taskId: "T-133" });
  const rendered = render(assembleBrief(ctx).recs);
  const worktreeLines = rendered
    .split("\n")
    .filter((l) => l.includes("git worktree list --porcelain"));
  expect(worktreeLines.length, "no lane line was emitted, so this body proves nothing").toBeGreaterThan(0);
  for (const line of worktreeLines) {
    expect(
      line,
      "a worktree is a LIVE-ENVIRONMENT fact — executor.md's figure rule names that exception in " +
        "as many words, so it carries the time and host it was read at and never a commit",
    ).toContain("<- read ");
    expect(line).not.toContain("<- @ ");
  }
  const cardLines = rendered.split("\n").filter((l) => l.includes("frontmatter field touches"));
  expect(cardLines.length).toBeGreaterThan(0);
  for (const line of cardLines) expect(line).toContain("<- @ ");

  expect(() => value("x", treeProv("", "somewhere"))).toThrow(/needs a ref/);
});

test("a figure read from the MOVING integration ref is a LIVE fact — two reads at ONE ref disagree", () => {
  // THE REJECTION THIS BODY PINS. `base commit` and `integration tip
  // right now` shipped stamped `<- @ <ref>` as TREE facts, and both are
  // reads of the mutable integration BRANCH. Re-derive them at the ref
  // they name and you get different commits; the verifier watched that
  // branch move three times inside one pass and print three values under
  // one identical stamp, and it moved a fourth time before this fix. The
  // affected figure is the base hash that feeds `git worktree add`, which
  // lane-protocol rule 2 wants as a hash precisely because "latest" is a
  // different commit for every reader.
  //
  // NOTHING PINNED IT: the suite was 192 green with the defect and 192
  // green with it re-stamped by hand. The body above checks only that
  // WORKTREE lines are live; it never asked whether a `<- @ >` line is
  // derivable at the ref it wears.
  const ctx = context({ taskId: "T-133" });
  const branch = laneSpellings(conventions()).integrationBranch;

  // The second read is DERIVED from the first rather than typed: drop the
  // newest Checkpoint and everything above it, which is exactly what the
  // branch moving does to this log.
  const lines = ctx.integrationLog.split("\n").filter((l) => l.trim() !== "");
  const cut = lines.findIndex((l) => l.slice(41).startsWith("Checkpoint:"));
  expect(cut, `${branch} carries no Checkpoint, so this body has no subject`).toBeGreaterThanOrEqual(0);
  const older = lines.slice(cut + 1);
  expect(
    older.some((l) => l.slice(41).startsWith("Checkpoint:")),
    `${branch} carries only one Checkpoint here, so a second read cannot be built out of it`,
  ).toBe(true);

  // ONE VARIABLE. The same ctx object: the same ref, the same clock, the
  // same worktree list, the same cards — only the read of the branch
  // differs. Anything whose TEXT moves between these two renders was
  // never a function of the tree they are both stamped at.
  const moved = { ...ctx, integrationLog: older.join("\n"), findings: [] };
  const before = render(assembleBrief(ctx).recs).split("\n");
  const after = render(assembleBrief(moved).recs).split("\n");
  expect(after.length, "the two renders have different shapes, so they are not comparable").toBe(
    before.length,
  );

  const bare = (l: string) => l.replace(/ {2}<- .*$/, "");
  const changed = before.filter((l, i) => bare(l) !== bare(after[i] ?? ""));
  expect(
    changed.length,
    "moving the integration branch changed no line, so this body is not driving the figures it " +
      "exists to pin",
  ).toBeGreaterThan(1);
  for (const line of changed) {
    expect(
      line,
      "this line's VALUE moved while the ref it is stamped at did not, so the ref does not " +
        "determine it. A figure carrying a ref that does not determine it is worse than a bare " +
        "figure — this card's own argument, turned on this card's own output",
    ).toContain("  <- read ");
  }

  // AND THE RULE STATED DIRECTLY, against the real report rather than only
  // against the experiment: every line whose SOURCE names the integration
  // branch carries a clock. Positive control first — without it, "they are
  // all live" is satisfied by a report that reads the branch nowhere.
  const via = (l: string) => l.replace(/^.*? {2}<- /, "");
  const refReads = before.filter((l) => l.includes("  <- ") && new RegExp(`\\b${branch}\\b`).test(via(l)));
  expect(
    refReads.length,
    "no emitted line names the integration branch as its source, so the rule below has no subject",
  ).toBeGreaterThan(1);
  for (const line of refReads) expect(line).toContain("  <- read ");

  // THE OTHER DIRECTION, or "stamp everything live" would pass. With no
  // task named, the create command is the document's own text — `<base>`
  // placeholder and all — so it is a transcription, and a transcription is
  // a tree fact. The stamp follows whether the moving hash is IN the line.
  const noTask = render(assembleBrief(context({})).recs).split("\n");
  const createLines = noTask.filter((l) => /^\s*create: /.test(l));
  expect(createLines.length, "the lane row emitted no create command").toBe(1);
  const createLine = createLines[0] ?? "";
  expect(createLine, "the create command was substituted for a card nobody named").toContain("<base>");
  expect(
    createLine,
    "an unsubstituted create command is a verbatim transcription of CONVENTIONS at this ref, and " +
      "a live stamp on a tree fact is the same defect facing the other way",
  ).toContain("  <- @ ");
});

test("a provenance that is neither SHAPE throws at render, rather than rendering `read undefined`", () => {
  // The realistic authoring slip: an object literal instead of the
  // constructor. `stamp()` was a ternary, so every kind that was not
  // exactly "tree" went down the LIVE branch and this rendered as
  //
  //   the suite is nine hundred bodies  <- read undefined on undefined ; git rev-parse HEAD
  //
  // which SLIPS `unstampedLines()` — the provenance floor the body above
  // drives. So the floor was structural against OMISSION and merely
  // careful against MALFORMATION, and a malformed stamp is the one shape
  // that looks stamped. Latent rather than live: every shipped call site
  // goes through treeProv/liveProv, which validate.
  const asProv = (x: unknown) => x as unknown as ReturnType<typeof treeProv>;
  const slips: unknown[] = [
    { ref: "64d148396f65", via: "git rev-parse HEAD" },
    { kind: "Tree", ref: "64d148396f65", via: "git rev-parse HEAD" },
    { kind: "tree ", ref: "64d148396f65", via: "git rev-parse HEAD" },
    { kind: "live" },
    { kind: "tree" },
    {},
    0,
    false,
    "tree",
  ];
  for (const slip of slips) {
    expect(
      () => render([value("the suite is nine hundred bodies", asProv(slip))]),
      `${String(JSON.stringify(slip))} rendered a stamp instead of throwing`,
    ).toThrow(/provenance/);
  }

  // POSITIVE CONTROL: the two real shapes still render, so the closure is
  // discriminating rather than total.
  expect(render([value("x", treeProv("64d148396f65", "git rev-parse HEAD"))])).toContain(
    "<- @ 64d148396f65 ; git rev-parse HEAD",
  );
  expect(render([value("x", liveProv("2026-08-26T00:00:00.000Z", "a-host", "lsof"))])).toContain(
    "<- read 2026-08-26T00:00:00.000Z on a-host ; lsof",
  );
});

test("THE SLUG MAP COMES FROM THE FIELD, and the prose block is compared rather than trusted", () => {
  const comps = components();
  const fields = slugMapFromFields(comps);
  expect(fields.size, "no component declares a touch_slugs field").toBeGreaterThan(0);

  const arch = architectureText();
  const prose = slugMapFromProse(arch);
  expect(prose.size, "the architecture doc's derived block could not be read").toBeGreaterThan(0);

  // THE TWO COPIES AGREE TODAY, and that is asserted rather than assumed:
  // row 5 rules the FIELD authoritative precisely because this block goes
  // stale, and it has done so twice. This is a TREE fact, so it is
  // deterministic at a ref and safe to assert; the live half (lanes,
  // fences) is disclosed rather than asserted, below.
  for (const [slug, ids] of fields) {
    expect(
      prose.get(slug),
      `the architecture doc's block and ${slug}'s component files disagree — the FIELD is ` +
        "authoritative (executor.md row 5), so the block is the side to repair",
    ).toEqual(ids);
  }

  // ONE SIDE ONLY: the PROSE moves, the fields do not. The comparison has
  // to notice, or nothing is comparing them.
  const firstSlug = [...fields.keys()][0] ?? "";
  expect(firstSlug).not.toBe("");
  const moved = arch
    .split("\n")
    .map((l) => (l.startsWith("    ") ? l.replace(firstSlug, "app-nobody") : l))
    .join("\n");
  expect(moved).not.toBe(arch);
  const poisoned = slugMapFromProse(moved);
  expect(
    poisoned.get(firstSlug),
    "moving the prose block left the derived comparison unchanged, so nothing is reading it",
  ).toBeUndefined();
  expect(poisoned.has("app-nobody")).toBe(true);
});

test("FENCE DISJOINTNESS IS COMPUTED AS SETS THROUGH THE MAP, not as a string compare", () => {
  const comps = components();
  const slugs = slugMapFromFields(comps);

  // The sharp case, and it is live on this board rather than invented:
  // `app-board` and `app-shell` are DIFFERENT strings and both claim
  // C-11, so two fences naming one each were never disjoint.
  const shared = [...slugs].filter(([, ids]) => ids.length > 1);
  expect(shared.length, "no slug is claimed by more than one component on this tree").toBeGreaterThan(0);
  const [slugA, idsA] = shared[0] ?? ["", []];
  const slugB = [...slugs].find(([s, ids]) => s !== slugA && ids.some((i) => idsA.includes(i)))?.[0];
  expect(
    slugB,
    "no two slugs share a component here, so this body has lost its subject — the overlap it " +
      "pins is the one a string compare cannot see",
  ).toBeDefined();

  const overlap = fenceOverlaps(
    { id: "T-A", entries: [slugA] },
    { id: "T-B", entries: [slugB ?? ""] },
    slugs,
    comps,
  );
  expect(
    overlap.length,
    `${slugA} and ${slugB} are different strings that reserve the same component, and this ` +
      "derivation called them disjoint",
  ).toBeGreaterThan(0);

  // POSITIVE CONTROL: two fences that really are disjoint come back so.
  expect(
    fenceOverlaps({ id: "T-A", entries: ["tools/e2e"] }, { id: "T-B", entries: ["lib-parser"] }, slugs, comps),
  ).toEqual([]);
  // And a path fence is compared as a PREFIX, so a directory contains its files.
  expect(
    fenceOverlaps(
      { id: "T-A", entries: ["method/"] },
      { id: "T-B", entries: ["method/lane-protocol.md"] },
      slugs,
      comps,
    ).length,
  ).toBeGreaterThan(0);
});

test("the frontmatter reader agrees with `yaml` on every live card and every component", () => {
  // T-057: a rule with two implementations is two chances to disagree.
  // This module carries a minimal reader so the command runs against a
  // checkout with nothing installed; that choice is only defensible if
  // the two are MEASURED against each other rather than assumed equal.
  let checked = 0;
  const docs = [
    ...liveTaskCards(repoRoot).map((c) => ({ file: c.path, content: c.content })),
    ...trackedFiles(repoRoot)
      .filter((rel) => rel.startsWith("docs/architecture/components/") && rel.endsWith(".md"))
      .map((rel) => ({ file: rel, content: readDoc(rel) })),
  ];
  for (const doc of docs) {
    const mine = frontmatterFields(doc.content);
    const block = doc.content.split(/^---[ \t]*$/m)[1];
    if (block === undefined) continue;
    const theirs = parseYaml(block) as Record<string, unknown> | null;
    if (theirs === null) continue;
    for (const key of ["id", "status", "size", "touches", "touch_slugs", "paths"]) {
      if (!(key in theirs)) continue;
      const t = theirs[key];
      if (t === null || t === undefined) continue;
      const expected = Array.isArray(t) ? t.map((v) => String(v).trim()) : String(t).trim();
      const got = mine[key];
      expect(
        got,
        `${doc.file}: this module reads ${key} as ${JSON.stringify(got)} and \`yaml\` reads it as ` +
          `${JSON.stringify(expected)} — the minimal reader has forked from the authority`,
      ).toEqual(expected);
      checked += 1;
    }
  }
  expect(checked, "nothing was compared, so this body is vacuous").toBeGreaterThan(50);
});

test("the gates are ENUMERATED from the document, and a removed gate is not still named", () => {
  const md = conventions();
  const { gates, named } = standingGates(md);
  expect(gates.length, "no standing gate was enumerated").toBeGreaterThan(0);
  for (const g of gates) {
    expect(g.trigger, `${g.name} was enumerated with no trigger`).toContain("at any merge whose diff touches");
  }
  // A bullet that names a gate and declares no merge-diff trigger is
  // REPORTED rather than dropped: silence about a paragraph is how a hand
  // list forms behind a derivation's back. The two lists must not
  // intersect, or one bullet is answered twice under two spellings.
  for (const n of named) expect(gates.map((g) => g.name)).not.toContain(n);

  // ONE SIDE ONLY: remove one gate's bullet from the DOCUMENT.
  const victim = gates[gates.length - 1];
  expect(victim).toBeDefined();
  const bullets = md.split(/\n(?=- )/);
  const kept = bullets.filter((b) => !new RegExp(`^- ${victim?.name}\\b`).test(b.replace(/\s+/g, " ")));
  expect(kept.length).toBe(bullets.length - 1);
  const after = standingGates(kept.join("\n"));
  expect(
    after.gates.map((g) => g.name),
    "a gate deleted from the document was still named by the derivation, so the list is not read",
  ).not.toContain(victim?.name);
});

test("the commands are transcribed VERBATIM from the per-package bullets", () => {
  const pkgs = packageCommands(conventions());
  const dirs = pkgs.map((p) => p.dir);
  expect(dirs).toContain("lib/parser");
  expect(dirs).toContain("app");
  expect(dirs).toContain("tools/e2e");
  for (const pkg of pkgs) {
    expect(pkg.commands.length, `${pkg.dir} exposes no command`).toBeGreaterThan(0);
    for (const cmd of pkg.commands) expect(cmd).not.toContain("`");
  }
  // The middle-dot stopping rule is CONVENTIONS' own, and the cost of
  // getting it wrong is measured in that file: a separator inside a
  // parenthetical drops every command behind it. This body pins that the
  // derivation still reads past the first parenthetical command.
  const tauri = pkgs.find((p) => p.dir === "app/src-tauri");
  expect(tauri?.commands.some((c) => c.startsWith("cargo audit"))).toBe(true);
});

test("the ceremony ROW is read from TASK-FORMAT, and the tier letter alone does not decide it", () => {
  const rows = ceremonyRows(readDoc("method/tasks/TASK-FORMAT.md"));
  expect(rows.length).toBeGreaterThan(0);
  const sRows = rows.filter((r) => r.size === "S" || r.size.startsWith("S,"));
  expect(
    sRows.length,
    "size S resolves to a single ceremony row here — the whole reason row 11 asks WHICH row is " +
      "that it does not",
  ).toBeGreaterThan(1);
});

test("the named disciplines are enumerated from the document's own shape", () => {
  const md = conventions();
  const { gates, named } = standingGates(md);
  const skip = [...gates.map((g) => g.name), ...named];
  const found = namedDisciplines(md, skip);
  const names = found.map((d) => d.name);
  expect(names).toContain("POISON DRILL");
  expect(names).toContain("A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL");
  expect(names, "a gate is answered by row 8 and must not be listed twice").not.toContain("DOCS GATE");
  // ONE SIDE ONLY: rename the bullet in the DOCUMENT and require the
  // enumeration to follow it.
  const moved = md.replace("- POISON DRILL (", "- POISON RITUAL (");
  expect(moved).not.toBe(md);
  const after = namedDisciplines(moved, skip).map((d) => d.name);
  expect(after).not.toContain("POISON DRILL");
  expect(after).toContain("POISON RITUAL");
});

test("ARM TWO answers STATE's derivable sections and says what it cannot answer", () => {
  const ctx = context({});
  const rendered = render(stateReport(ctx));
  expect(unstampedLines(rendered)).toEqual([]);
  expect(rendered).toContain("THE LANE LIST");
  expect(rendered).toContain("THE BOARD");
  expect(rendered).toContain("THE SLUG MAP");
  expect(rendered).toContain("WHAT THIS COMMAND CANNOT ANSWER");
  // STATE's own headings are printed beside the derived facts, so a
  // reader can see the sections a command has no answer for rather than
  // being told the list is complete.
  expect(rendered).toContain("## Next up");
});

test("the board census adds up, and it is derived rather than carried", () => {
  const board = boardCensus();
  const summed = [...board.byStatus.values()].reduce((a, b) => a + b, 0);
  expect(
    summed,
    "the per-status counts do not sum to the file count, so one of them is not derived from the " +
      "same walk",
  ).toBe(board.total);
  expect(board.total).toBeGreaterThan(0);
  expect(board.rejected).toBeGreaterThan(0);
});

test("THE COMMAND IS A READ — it writes nothing into the checkout it runs in", () => {
  const statusBefore = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], { encoding: "utf8" });
  const headBefore = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  const run = spawnSync(process.execPath, [CLI, "--task", "T-133", "--state"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  // CLEAN or FOUND, never USAGE and never CANNOT_RUN: whether this
  // repository has a finding right now is a LIVE fact — a lane cut two
  // minutes ago can add one — and a body that asserted it would red in
  // somebody else's lane for somebody else's dispatch. It is disclosed
  // below instead.
  expect([EXIT.CLEAN, EXIT.FOUND], run.stderr ?? "").toContain(run.status);
  expect(run.stdout).toContain("ROW 1 —");
  const statusAfter = spawnSync("git", ["-C", repoRoot, "status", "--porcelain"], { encoding: "utf8" });
  const headAfter = spawnSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  expect(
    statusAfter.stdout,
    "the working tree moved under a command that is supposed to be a read",
  ).toBe(statusBefore.stdout);
  expect(headAfter.stdout).toBe(headBefore.stdout);
});

test("THE EXIT CODES keep `I derived it` apart from `I could not tell you`", () => {
  const run = (args: string[]) =>
    spawnSync(process.execPath, [CLI, ...args], { cwd: repoRoot, encoding: "utf8" });

  expect(run(["--help"]).status).toBe(EXIT.CLEAN);
  expect([EXIT.CLEAN, EXIT.FOUND]).toContain(run(["--task", "T-133"]).status);

  const noArm = run([]);
  expect(noArm.status, "an empty request is not a clean run").toBe(EXIT.USAGE);
  expect(noArm.stderr).toContain("nothing asked for");

  expect(run(["--nope"]).status).toBe(EXIT.USAGE);
  expect(run(["T-133"]).status, "a positional this command guessed at is a row filled from nowhere").toBe(
    EXIT.USAGE,
  );
  const missing = run(["--task", "T-999"]);
  expect(missing.status).toBe(EXIT.USAGE);
  expect(missing.stderr).toContain("no live card declares id");

  const broken = run(["--task", "T-133", "--root", path.join(repoRoot, "tools")]);
  expect(
    broken.status,
    "a run that could not read its sources must not look like a clean brief",
  ).toBe(EXIT.CANNOT_RUN);
  expect(broken.stderr).toContain("COULD NOT RUN");
});

test("a brief assembled at this ref names the lanes the repository holds, and no others", () => {
  const ctx = context({ taskId: "T-133" });
  const rendered = render(assembleBrief(ctx).recs);
  const entries = parseWorktreePorcelain(ctx.porcelain);
  for (const lane of ctx.lanes) {
    expect(rendered).toContain(`${lane.taskId} touches:`);
  }
  // A detached entry is never silently promoted to a lane.
  for (const entry of entries.filter((e) => e.branch === "")) {
    expect(rendered).not.toContain(`${entry.path} (on `);
  }

  // THE LIVE HALF IS DISCLOSED, NOT ASSERTED. Whether two live fences
  // overlap is a fact about somebody else's dispatch, and a red here
  // would arrive attributed to whoever is nearest — the one kind of noise
  // docs/CONVENTIONS.md says nobody can dismiss by looking at it. An
  // annotation is invisible in the `list` reporter, so it is printed too.
  const line =
    ctx.findings.length === 0
      ? `${ctx.root} @ ${ctx.ref.slice(0, 12)} — the assembler settled every row`
      : `${ctx.root} @ ${ctx.ref.slice(0, 12)} — ${ctx.findings.join(" ;; ")}`;
  test.info().annotations.push({ type: "brief disclosure", description: line });
  process.stdout.write(`\n  brief DISCLOSURE: ${line}\n`);
});
