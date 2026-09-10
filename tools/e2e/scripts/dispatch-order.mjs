import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { conventionsText, repoRoot, trackedFiles } from "./docs-scan.mjs";
import {
  blank,
  git,
  laneSpellings,
  laneWorktrees,
  liveProv,
  note,
  treeProv,
  value,
  worktreePorcelain,
} from "./dispatch-brief.mjs";

/**
 * WHAT IS DISPATCHABLE, IN WHAT ORDER, GIVEN THE LIVE LANES (T-137) — for
 * a session with a terminal and no app.
 *
 * @human named this a core feature: *"The architect session needs precise
 * knowledge of the technical roadmap, task list, task priority and
 * dispatch order, and it needs to be able to update and adapt as new
 * tasks are added."* The app has answered most of it since T-034 —
 * `brief.mjs --task` briefs ONE card, and nothing answered the question
 * across the board for a terminal.
 *
 * ── THIS FILE DERIVES NOTHING IT CAN IMPORT ─────────────────────────
 * That is the whole of T-137 and it is why this module is short:
 *
 *   - THE SCHEDULE — waves, the critical path, transitive holds, the
 *     worst blocker, `ready | waits | blocked | underway` — is
 *     `@supertaskr/parser`'s `selectTaskSchedule`, moved out of the map pane
 *     by this card. There is ONE implementation and the pane imports the
 *     same one.
 *   - THE FENCE — normalisation, slug expansion, containment,
 *     `overlapping | disjoint | unusable` — is the parser's `fence.ts`,
 *     shipped by T-134. **The architect hand-rolled this expansion an
 *     hour before this card was dispatched, left a path token as itself,
 *     and reported two cards disjoint that overlap by containment.** A
 *     fourth spelling of that rule is the defect, not the deliverable.
 *   - THE LANE LIST — `git worktree list --porcelain` FILTERED ON THE
 *     BRANCH, with the branch pattern read off the project's own lane
 *     bullet — is T-133's `laneSpellings` + `laneWorktrees`, reused
 *     rather than restated.
 *   - THE PROVENANCE — a TREE fact carries a ref, a LIVE fact carries a
 *     time and a host and NEVER a commit — is T-133's `treeProv` /
 *     `liveProv` / `value` / `render`. T-133 was rejected once for
 *     stamping reads of a mutable ref as tree facts; the worktree list is
 *     the same kind of read, and it is stamped LIVE here.
 *
 * ── HOW THE PARSER IS LOADED, AND WHY BY PATH ───────────────────────
 * `tools/e2e` is the repository's THIRD npm package and declares no
 * dependency on `@supertaskr/parser` (ADR-011 family; its own manifest says
 * it "imports neither app nor parser"). So the parser's BUILT entry is
 * loaded by relative path, exactly as `preflight.ts` already ASSERTS
 * `lib/parser/dist/pure.js` into existence for the same package. A
 * missing build is a loud refusal naming the ADR-011 order, never a
 * silent half-answer. Declaring the dependency properly is a routed
 * suggestion, not a decision an executor makes from inside a lane.
 *
 * ── ADAPTATION IS BY CONSTRUCTION ───────────────────────────────────
 * Nothing here is stored, cached or written. Every answer is derived at
 * call time from the cards on disk and the worktree list, so a card added
 * a minute ago is in the next answer with no bookkeeping — and a stale
 * answer is not possible because there is no remembered one.
 *
 * WRITES NOTHING. Every call in this file is a read.
 */

/** The parser's built entry, relative to this file. */
export const PARSER_DIST = path.join(repoRoot, "lib", "parser", "dist", "index.js");

/**
 * Load the moved analysis. Separated from every caller so the refusal has
 * ONE spelling and a pin can drive it.
 *
 * @returns {Promise<Record<string, any>>}
 */
export async function loadParser(dist = PARSER_DIST) {
  try {
    return await import(pathToFileURL(dist).href);
  } catch (err) {
    throw new Error(
      `dispatch-order: cannot load the parser at ${dist} — ADR-011 build order: lib/parser ` +
        "FIRST (`npm ci` + `npm run build` from lib/parser/), then app/. This command derives " +
        "the schedule and the fence from that ONE implementation and will not re-spell either, " +
        `so without it there is no answer to give. (${err instanceof Error ? err.message : String(err)})`,
    );
  }
}

/**
 * `expandFence`'s oracle: every tracked path AND every directory prefix of
 * one.
 *
 * THE ORACLE IS THE HALF A BOARD CANNOT SUPPLY, and closing it is this
 * consumer's own contribution to the fence rule. `expandFence`'s doc says
 * the oracle is *"the ONLY way this module can tell a bare directory
 * token from a word that names nothing"*: `docs` is a real directory and
 * `ci` is not, and neither carries a `/` or a `.` to give itself away.
 * `selectDispositions` is a pure function of the parsed model and has no
 * filesystem, which is why `T-111` measured 113 disagreeing pairs and
 * ruled them an ORACLE GAP rather than a rule disagreement. **A terminal
 * has the repository, so here the gap simply closes.**
 *
 * The PREFIXES are load-bearing and are not decoration: `git ls-files`
 * lists files, so `docs` never appears in it and a bare `docs` token
 * would resolve to nothing at all without them.
 *
 * @param {string} root
 * @returns {Set<string>}
 */
export function knownPathOracle(root = repoRoot) {
  const known = new Set();
  for (const rel of trackedFiles(root)) {
    known.add(rel);
    const parts = rel.split("/");
    for (let i = 1; i < parts.length; i += 1) known.add(parts.slice(0, i).join("/"));
  }
  return known;
}

/**
 * The board as the parser's PURE entry wants it: `{path, content}` with
 * REPOSITORY-RELATIVE paths, read off `git ls-files`.
 *
 * NOT `parseProject(root)`, AND THE REASON IS A CORRECTNESS ONE RATHER
 * THAN A COSMETIC ONE. The filesystem layer stamps each `TaskRecord.file`
 * with the ABSOLUTE path it walked, and `expandFence` carves a card's own
 * file out of its own fence by comparing that field against the
 * repository-relative domains a `touches:` token expands to. An absolute
 * `file` never matches, so the carve-out silently does not happen and a
 * card holding `docs/architecture/components/` would collide with itself.
 * Relative paths also keep every stamped value a function of the TREE
 * rather than of which checkout happened to run the command.
 *
 * @param {string} root
 * @returns {{ path: string, content: string }[]}
 */
export function boardFiles(root = repoRoot) {
  return trackedFiles(root)
    .filter(
      (rel) =>
        /^docs\/tasks\/[^/]+\.md$/.test(rel) ||
        rel === "docs/ROADMAP.md" ||
        /^docs\/architecture\/components\/[^/]+\.md$/.test(rel),
    )
    .map((rel) => ({ path: rel, content: readFileSync(path.join(root, rel), "utf8") }));
}

/**
 * The live lanes, as `LaneRecord`s the parser can rule on.
 *
 * FILTERED ON THE BRANCH, NEVER THE PATH, and that is a measurement
 * rather than a preference: `T-111-s5` recorded nine worktree entries and
 * three lanes on this repository at 12:12 EEST on 2026-08-26 — four of
 * the six non-lanes were DETACHED scratch checkouts at lane-shaped paths,
 * and a path filter would have reported six lanes holding fences nobody
 * held.
 *
 * @param {string} porcelain
 * @param {string} conventionsMd
 * @returns {{ taskId: string, branch: string, worktree: string, head: string }[]}
 */
export function lanesFrom(porcelain, conventionsMd) {
  return laneWorktrees(porcelain, laneSpellings(conventionsMd)).map((lane) => ({
    taskId: lane.taskId,
    branch: lane.branch,
    worktree: lane.path,
    head: lane.head,
  }));
}

/**
 * @typedef {object} DispatchCtx
 * @property {string} root
 * @property {string} ref   the tree the SCHEDULE is a function of
 * @property {string} at    ISO time the LANE LIST was read
 * @property {string} host
 * @property {any} parser   the loaded parser, held so the TEXT rules are
 *   read off the same module the schedule came from and never re-spelled
 * @property {any} order    the parser's DispatchOrder
 * @property {boolean} full THE UNFILTERED VIEW. False is the DISPATCHABLE-NOW
 *   answer: every card a session could start right now, in full, and one
 *   counted line for each set that is not startable. True restores a row
 *   per card in every set. See `dispatchReport`.
 */

/**
 * Derive the whole answer. One read of the worktree list, one parse of
 * the board, one ruling.
 *
 * THE TWO PROVENANCES ARE SEPARATED HERE RATHER THAN AT THE PRINT. `ref`
 * is the tree every board figure is a function of; `at`/`host` belong to
 * the worktree list, which is a read of a MUTABLE environment. T-133 was
 * rejected once for stamping reads of a mutable ref as tree facts, so the
 * two never share a constructor below.
 *
 * @param {{ root?: string, porcelain?: string, at?: string, host?: string, conventions?: string, files?: {path: string, content: string}[], full?: boolean }} opts
 * @returns {Promise<DispatchCtx>}
 */
export async function dispatchContext(opts = {}) {
  const root = opts.root ?? repoRoot;
  const parser = await loadParser();
  const conventionsMd = opts.conventions ?? conventionsText(root);
  const porcelain = opts.porcelain ?? worktreePorcelain(root);
  const lanes = lanesFrom(porcelain, conventionsMd);
  // `opts.files` is the spec-injection seam, symmetric with
  // `opts.porcelain` and `opts.conventions` above: the board the parser
  // rules on can be a fixture. Added at T-135's close, when the live
  // board's in-flight column emptied for the first time and the
  // in-flight section's populated arm lost its only live fixture.
  const model = parser.parseProjectFromFiles(opts.files ?? boardFiles(root));
  const order = parser.readDispatchOrder(model, lanes, { knownPaths: knownPathOracle(root) });
  return {
    root,
    ref: git(root, ["rev-parse", "HEAD"]).trim(),
    at: opts.at ?? new Date().toISOString(),
    host: opts.host ?? os.hostname(),
    parser,
    order,
    full: opts.full ?? false,
  };
}

/**
 * THE CARDS THIS ANSWER SPELLS OUT — the denominator of the per-card
 * density `brief.mjs` discloses beside the size.
 *
 * It counts the sets `dispatchReport` gives a ROW to at this verbosity,
 * never the board: a per-card cost divided by cards that were summarised
 * into one line would understate the cost of the next card by exactly the
 * factor the filter just bought.
 *
 * @param {DispatchCtx} ctx
 * @returns {number}
 */
export function listedCards(ctx) {
  const o = ctx.order;
  const inFlight = o.underway.filter((/** @type {any} */ r) =>
    ctx.parser.IN_FLIGHT.has(r.card.status),
  ).length;
  const always = o.startable.length + o.unfenceable.length + inFlight;
  return ctx.full ? always + o.fenced.length + o.waits.length + o.blocked.length : always;
}

/**
 * The distinct lanes holding at least one card in a set, id-ascending —
 * what the counted line names in place of the rows it replaced.
 *
 * THE LANES ARE THE ACTIONABLE HALF and the card list is not: a reader
 * who wants those cards back frees a LANE, and there are as many lanes as
 * this machine has worktrees rather than as the board has cards.
 *
 * @param {any[]} rulings
 * @returns {string[]}
 */
function holdingLanes(rulings) {
  const ids = new Set();
  for (const r of rulings) for (const h of r.holds) ids.add(h.lane.taskId);
  return [...ids].sort();
}

/**
 * The unmet blockers a set is waiting on, id-ascending and deduped — read
 * off the schedule's own `unmet` field rather than re-derived, so the
 * counted line still NAMES the blocker its section header promises.
 *
 * @param {any[]} rulings
 * @returns {string[]}
 */
function unmetBlockers(rulings) {
  const ids = new Set();
  for (const r of rulings) for (const b of r.card.unmet ?? []) ids.add(b.id);
  return [...ids].sort();
}

/**
 * A LANE'S ADDRESS IS SPELLED ONCE, AND EVERY RULING AFTER IT NAMES THE
 * LANE BY ITS ID (T-225-s12).
 *
 * ── WHAT THIS IS ABOUT, IN BYTES ────────────────────────────────────
 * The parser writes a lane into a reason as `laneName` spells it —
 * `T-202-s1 (refs/heads/task/T-202-s1-solo-lock-whole-path-key at
 * /Users/ujju/Projects/supertaskr-T-202-s1)` — and `--full` prints one reason
 * per held card, so the branch and the absolute worktree path of every
 * live lane are re-spelled once per card. Measured on this repository at
 * `cde65b5` with five lanes live and fifty-five cards fenced out: 252
 * addresses spelling 23,136 bytes of branch and worktree path — 23,388
 * counting the separator each one hangs on, which is what a removal
 * actually takes — in a 123,153-byte answer that is 99,943 with the
 * address given once. The term is
 * O(cards x lanes) and every byte of it is a repeat of THE LIVE LANES
 * section a page above, which spells each lane's branch and worktree
 * exactly once — so this is the same answer with the address given once
 * and cited thereafter, which is `T-225-s2`'s shape one command over.
 *
 * NOTHING A TRIAGE READER ACTS ON LEAVES THE ANSWER. The two acts the
 * `--full` view exists for are *free that lane* and *argue with the
 * overlap*: the LANE ID and the SHARED PATHS are what both need, and both
 * stay in the sentence untouched. The branch and the worktree path are
 * how a reader REACHES the lane, and they are still in this same answer,
 * above, under a heading that names them — one address, not one per card.
 *
 * ── AND IT CANNOT BE WRONG, WHICH IS WHY IT IS SPELLED THIS WAY ─────
 * The needle is BUILT FROM THE LANE RECORD rather than recognised by a
 * pattern: for each live lane this replaces the exact string
 * `${taskId} (${branch} at ${worktree})`, which is the only shape
 * `laneName` produces, with `${taskId}`. A `split`/`join` pair does that
 * literally — no regular expression, so a worktree path carrying a
 * metacharacter cannot turn into a wildcard.
 *
 * THE FAILURE MODE IS THE SAFE ONE. If the parser ever spells a lane
 * differently, no needle matches, nothing is replaced, and the reason
 * arrives WHOLE — the answer is bigger than it needs to be and is never
 * wrong. A recogniser would have had the opposite failure.
 *
 * @param {string} reason  the parser's own sentence, never re-spelled
 * @param {{taskId: string, branch: string, worktree: string}[]} lanes
 * @returns {string}
 */
export function laneAddressOnce(reason, lanes) {
  let out = reason;
  for (const lane of lanes) {
    out = out.split(`${lane.taskId} (${lane.branch} at ${lane.worktree})`).join(lane.taskId);
  }
  return out;
}

/** The card's roadmap dimension, REPORTED and never re-derived. */
/** @param {any} card @returns {string} */
function roadmapOf(card) {
  const feature = card.feature ?? "no feature";
  const milestone = card.milestone === undefined ? "no milestone" : `m${card.milestone}`;
  const priority = card.priority === undefined ? "no priority" : `p${card.priority}`;
  return `${feature} ${milestone} ${priority}`;
}

/**
 * The report, as stamped records. Priority order, and the four questions
 * the card owes a terminal: what can start, what is merely unblocked but
 * FENCED (naming the lane), what is BLOCKED (naming the unmet blocker),
 * and the critical path and worst blocker the pane already computes.
 *
 * ── THE DISPATCHABLE-NOW FILTER (T-225, decision 2) ─────────────────
 * THIS ANSWER USED TO OWE A ROW TO EVERY PLANNED CARD, AND THAT IS THE
 * ONE THING ABOUT IT THAT SCALES WITH THE BOARD RATHER THAN WITH THE
 * WORK. A dispatcher asks what can be STARTED; a card another lane is
 * holding cannot be, and neither can one waiting on an unmet blocker. Yet
 * each of those printed a title row plus a REASON that re-enumerates
 * every live lane and every path it holds — so the cost per card is
 * O(lanes x paths) and the whole answer is O(cards x lanes x paths).
 * Measured on this repository at `5f193e6` with three lanes live: the
 * fenced section alone was 59,465 of 85,818 bytes over 60 cards, ~991
 * bytes each, against ~660 for the answer as a whole. The board could not
 * carry a correct triage because of it — seven cards were triaged PROMOTE
 * on their merits and three were held BY ARITHMETIC.
 *
 * SO THE DEFAULT ANSWERS THE DISPATCHER'S QUESTION AND THE SETS THAT ARE
 * NOT DISPATCHABLE COLLAPSE TO ONE COUNTED LINE EACH, naming what a
 * reader would act on — the LANES doing the holding, the BLOCKERS not
 * met. Those grow with the lanes and with the distinct blockers, both of
 * which are bounded by the work in flight.
 *
 * ── AND THE UNFILTERED VIEW IS KEPT, BECAUSE IT ANSWERS A DIFFERENT
 *    QUESTION ─────────────────────────────────────────────────────────
 * `--full` is the TRIAGE view, not a verbose one. *"What can I start?"*
 * is the dispatcher's question and the default answers it. *"Why can I
 * not start T-204, and which lane do I have to free to get it back?"* is
 * the question a triage sitting or an unblocking pass asks, and it is
 * answered per card, by the sentence naming the exact shared paths. That
 * sentence is the reason this command exists — an architect who
 * hand-rolled the fence expansion reported two overlapping cards disjoint
 * — so it is moved behind a flag and never deleted.
 *
 * ── AND THE ADDRESS IS SPELLED ONCE (T-225-s12) ─────────────────────
 * `--full` is still the biggest invocation this command has, and the
 * largest repeated thing in it was never a card: it was every live lane's
 * BRANCH and absolute WORKTREE PATH, re-spelled inside every held card's
 * reason. Every ruling below therefore goes through `laneAddressOnce`,
 * which names a lane by its id and leaves the address to THE LIVE LANES
 * section that already spells it once. No set loses a row, no reason
 * loses a shared path, and the term removed is O(cards x lanes).
 *
 * THREE SETS STAY IN FULL AT EVERY VERBOSITY, and each for a reason
 * rather than by omission. UNFENCEABLE is a REFUSAL and not a queue: no
 * overlap was proved and none was ruled out, so a count would hide the
 * one state whose remedy is to go and look. IN FLIGHT is bounded by the
 * work under way rather than by the board. And STARTABLE is the answer.
 *
 * @param {DispatchCtx} ctx
 * @returns {import("./dispatch-brief.mjs").Rec[]}
 */
export function dispatchReport(ctx) {
  const laneVia = "git worktree list --porcelain, filtered on the branch";
  const boardVia = "flat docs/tasks/T-*.md, parsed";
  /** @param {string} via @returns {import("./dispatch-brief.mjs").Prov} */
  const tree = (via) => treeProv(ctx.ref, via);
  /** @param {string} via @returns {import("./dispatch-brief.mjs").Prov} */
  const live = (via) => liveProv(ctx.at, ctx.host, via);
  const o = ctx.order;
  /**
   * EVERY RULING GOES THROUGH HERE AND NOT ONE OF THEM IS RE-SPELLED.
   * `laneAddressOnce` is applied at ONE site per set rather than at the
   * call that happens to be big today: a set whose reasons carry no lane
   * address is a no-op through it, and a set added later that does carry
   * one cannot be the one nobody remembered to route (T-225-s12).
   *
   * @param {string} reason @returns {string}
   */
  const ruling = (reason) => laneAddressOnce(reason, o.lanes);

  /** @type {import("./dispatch-brief.mjs").Rec[]} */
  const recs = [
    note("WHAT IS DISPATCHABLE, IN WHAT ORDER, GIVEN THE LIVE LANES — derived, never remembered"),
    value(`repository: ${ctx.root}`, tree("the checkout this command ran in")),
    value(`HEAD in full: ${ctx.ref}`, tree("git rev-parse HEAD")),
    ...(ctx.full
      ? [
          note("THE UNFILTERED VIEW — a row per card in every set, including the ones nothing can"),
          note("start today. This is the TRIAGE answer: why a card is held, and which lane holds it."),
        ]
      : [
          note("THE DISPATCHABLE-NOW VIEW — what a session could START, spelled out; every set that"),
          note("is not startable is one counted line naming what a reader would act on. Add --full"),
          note("for the triage answer: a row per held card, with the exact paths it shares."),
        ]),
    blank(),
    note("THE LIVE LANES — entries on a task branch. A detached worktree is not a lane."),
    note("EACH LANE'S ADDRESS IS SPELLED HERE AND NOWHERE ELSE: a ruling below names a lane by"),
    note("its id, and its branch and worktree are on its row here — one address, not one per card."),
  ];
  if (o.lanes.length === 0) recs.push(value("no lane is live", live(laneVia)));
  for (const lane of o.lanes) {
    recs.push(
      value(`${lane.taskId} branch ${lane.branch} worktree ${lane.worktree}`, live(laneVia)),
    );
  }
  for (const id of o.lanesWithNoCard) {
    recs.push(
      value(
        `${id} IS A LANE WITH NO CARD IN THIS CHECKOUT — an unstamped or lapsed dispatch, or a ` +
          `lane cut after this tree's base. Its fence cannot be computed, so NOTHING can be ruled ` +
          `disjoint from it and every ready card is UNFENCEABLE below until ${id}'s card is here ` +
          `(it is on the integration branch if the lane was cut from it)`,
        live(laneVia),
      ),
    );
  }

  recs.push(
    blank(),
    note("STARTABLE NOW — ready, and PROVED disjoint from every live lane. In dispatch order."),
  );
  // THE EMPTY LINE HAS TO SAY WHICH EMPTY IT IS. "Nothing is startable"
  // because every ready card is held is a board fact; "nothing is
  // startable" because a lane could not be read at all is a LIVE fact
  // about this checkout, with a different remedy — so it is stamped LIVE
  // and it names the lane.
  if (o.startable.length === 0) {
    recs.push(
      o.lanesWithNoCard.length === 0
        ? value("nothing is startable", tree(boardVia))
        : value(
            `nothing is startable, and the reason is NOT the board: this checkout has no card for ` +
              `${o.lanesWithNoCard.join(", ")}, so no fence could be proved disjoint from ` +
              `${o.lanesWithNoCard.length > 1 ? "them" : "it"} — see UNFENCEABLE below`,
            live(laneVia),
          ),
    );
  }
  for (const r of o.startable) {
    recs.push(
      value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
      value(`   ${ruling(r.reason)}`, live(`${laneVia}, joined to the parsed board`)),
    );
  }

  recs.push(
    blank(),
    note("UNBLOCKED BUT FENCED — nothing unmet, and a live lane is holding the files."),
  );
  if (o.fenced.length === 0) recs.push(value("no card is fenced out", live(laneVia)));
  else if (!ctx.full) {
    // THE COUNTED LINE, AND IT NAMES THE LANES RATHER THAN THE CARDS.
    // Freeing a lane is what brings this whole set back, and the lane
    // count is bounded by the machine's worktrees where the card count is
    // bounded by nothing.
    recs.push(
      value(
        `${o.fenced.length} card(s) are unblocked and fenced out, held by ` +
          `${holdingLanes([...o.fenced]).join(", ")} — --full names each card and the paths it shares`,
        live(`${laneVia}, compared through the parser's fence module`),
      ),
    );
  } else {
    for (const r of o.fenced) {
      recs.push(
        value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
        value(`   ${ruling(r.reason)}`, live(`${laneVia}, compared through the parser's fence module`)),
      );
    }
  }

  if (o.unfenceable.length > 0) {
    recs.push(
      blank(),
      note("UNFENCEABLE — no overlap PROVED and none ruled out. Never folded into disjoint."),
    );
    for (const r of o.unfenceable) {
      recs.push(
        value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
        value(`   ${ruling(r.reason)}`, live(`${laneVia}, compared through the parser's fence module`)),
      );
    }
  }

  recs.push(blank(), note("WAITING — every unmet blocker is in flight, so the wait has an end."));
  if (o.waits.length === 0) recs.push(value("nothing is waiting on an in-flight card", tree(boardVia)));
  else if (!ctx.full) {
    // THE BLOCKERS, NOT THE WAITERS. The section header promises the
    // blocker is named and the counted line keeps that promise: the ids
    // below are what a reader watches for, and they are as many as there
    // are cards in flight rather than as many as are waiting.
    recs.push(
      value(
        `${o.waits.length} card(s) are waiting, every one on in-flight blockers ` +
          `${unmetBlockers([...o.waits]).join(", ")} — --full names each waiter`,
        tree(`${boardVia}, field blocked_by resolved on the board`),
      ),
    );
  } else {
    for (const r of o.waits) {
      recs.push(
        value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
        value(`   ${ruling(r.reason)}`, tree(`${r.card.file} field blocked_by, resolved on the board`)),
      );
    }
  }

  recs.push(blank(), note("BLOCKED — the unmet blocker is named, and nobody is on it."));
  if (o.blocked.length === 0) recs.push(value("nothing is blocked", tree(boardVia)));
  else if (!ctx.full) {
    recs.push(
      value(
        `${o.blocked.length} card(s) are blocked, on unmet blockers ` +
          `${unmetBlockers([...o.blocked]).join(", ")}, and nobody is on them — --full names each ` +
          "blocked card",
        tree(`${boardVia}, field blocked_by resolved on the board`),
      ),
    );
  } else {
    for (const r of o.blocked) {
      recs.push(
        value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
        value(`   ${ruling(r.reason)}`, tree(`${r.card.file} field blocked_by, resolved on the board`)),
      );
    }
  }

  // UNDERWAY, AND IT IS A BOARD REPORT RATHER THAN A HOLD (T-137-s10,
  // absorbed by T-143). `readDispatchOrder` computes this seventh state
  // and this report emitted it NOWHERE, so a card at `status: building`
  // with a declared fence appeared ZERO times in the whole answer — and
  // a session choosing among cards that overlap its ground was not told
  // such a card existed. The architect reports nearly dispatching
  // against one.
  //
  // WHY IT IS STAMPED TO THE BOARD AND NOT TO THE LANE LIST, in as many
  // words: T-143's own MECHANISM 2 is REFUSED, and this section is where
  // that refusal would be quietly undone. A `status:` stamp is NOT a
  // hold — the lane list is authoritative and the board under-reports by
  // construction — so nothing here is a fence and nothing here changes a
  // verdict above. It is the cheapest thing that closes the gap: the
  // reader is TOLD, and the ruling is left where it belongs.
  //
  // AND IT IS FILTERED TO `IN_FLIGHT`, THROUGH THE PARSER'S OWN SET
  // rather than a status list re-spelled here. `underway` is the
  // scheduler's word for "status is not planned", so it holds every
  // `done` and `parked` card too — 127 and 124 of them on this board at
  // `c74890a8`, which is a dump and not a report. The three statuses
  // that mean somebody is on it right now are `task-waves.ts`'s
  // `IN_FLIGHT`, exported and imported, so a fourth added there arrives
  // here with nothing edited.
  const inFlight = o.underway.filter((/** @type {any} */ r) =>
    ctx.parser.IN_FLIGHT.has(r.card.status),
  );
  recs.push(
    blank(),
    note("IN FLIGHT ON THE BOARD — somebody claims it. A `status:` stamp is NOT a fence hold: the"),
    note("lane list above is what holds ground, and a card here with no lane holds nothing. Read"),
    note("this as a courtesy to whoever is choosing, never as a verdict."),
  );
  if (inFlight.length === 0) recs.push(value("no card is in flight on the board", tree(boardVia)));
  for (const r of inFlight) {
    const laneHeld = o.lanes.some((/** @type {any} */ l) => l.taskId === r.id);
    const fence =
      r.fence.paths.length === 0
        ? "it declares no fence"
        : `it declares ${r.fence.paths.length} path(s)`;
    recs.push(
      value(`${r.id} [${roadmapOf(r.card)}] ${r.card.title}`, tree(`${r.card.file} frontmatter`)),
      value(`   ${ruling(r.reason)} — ${fence}`, tree(`${r.card.file} frontmatter, fence expanded`)),
      laneHeld
        ? value("   and it HAS a lane above, so that fence is held for real", live(laneVia))
        : value(
            "   and it has NO lane, so it holds no fence — the board stamp is all there is",
            live(laneVia),
          ),
    );
  }

  const s = o.schedule;
  recs.push(
    blank(),
    note("THE CRITICAL PATH AND THE WORST BLOCKER — the pane's own cells, same implementation."),
    value(
      `critical path: ${ctx.parser.criticalPathText(s)}`,
      tree(`${boardVia}, longest blocked_by chain`),
    ),
    value(
      `worst blocker: ${ctx.parser.worstBlockerText(s)}`,
      tree(`${boardVia}, transitive holds`),
    ),
    value(`drawn cards: ${s.total}`, tree(boardVia)),
    value(`ready on blocked_by alone: ${s.readyNow.length}`, tree(boardVia)),
    value(`startable once the lanes are counted: ${o.startable.length}`, live(laneVia)),
    blank(),
    // THE COMPLETENESS CENSUS (T-225). An emitter made smaller by
    // emitting LESS OF THE BOARD is the defect this card's own criteria
    // call out, and it would read as a fix on every size this card
    // measures. So the answer states what it ruled on and how much of it
    // it spelled out, at whatever verbosity it was asked for: a filter
    // that started dropping cards moves the left-hand number, which is a
    // function of the board and of nothing this flag controls.
    note("THE CENSUS — what this answer RULED ON, beside how much of it this verbosity spells"),
    note("out. The filter changes the second number and may never change the first."),
    value(
      `ruled: ${o.startable.length} startable, ${o.fenced.length} fenced, ` +
        `${o.unfenceable.length} unfenceable, ${o.waits.length} waiting, ${o.blocked.length} blocked` +
        ` — ${listedCards(ctx)} card(s) spelled out below the headings above`,
      live(`${laneVia}, joined to the parsed board`),
    ),
    blank(),
    note("ONE HONEST DIFFERENCE FROM THE PANE, named rather than discovered: the worst blocker's"),
    note("rejected-count word needs the app's verdict classifier, which lives in a component"),
    note("outside this card's fence — so a terminal reads the status word where the pane reads"),
    note("the rejected count. Same card, same holds, one word. Routed as a suggestion."),
    blank(),
    note("WHAT THIS COMMAND DELIBERATELY DOES NOT DO: it does not plan and it does not generate"),
    note("cards. That is the architect's judgement, not a derivation. What it gives that"),
    note("judgement is the INPUT — what is startable, what is held, and by whom."),
  );
  return recs;
}
