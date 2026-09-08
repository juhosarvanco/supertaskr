import { compareFences, expandFence } from './fence.js';
import type { Fence, FenceComparison, FenceVerdict, FenceWitness } from './fence.js';
import { byTaskId, selectTaskSchedule } from './task-waves.js';
import type { SelectScheduleOptions, TaskScheduleModel, WaveCard } from './task-waves.js';
import type { ComponentRecord, ProjectParseResult, TaskRecord } from './types.js';

/**
 * THE LANE TERM (T-137) — the half of "what is dispatchable" that
 * `task-waves.ts` never had.
 *
 * `readSchedule` answers *"is anything UNMET"*. It cannot answer *"…and
 * free to start right now"*, because the word `fence` does not occur in
 * it: `grep -cE "worktree|lane|fence|touches"` over that module returns 0.
 * A card whose blockers are all `done` is still un-startable if a live
 * lane is holding files it must write. **A card is startable iff its
 * schedule reads `ready` AND its fence is disjoint from every live
 * lane's** — and this module is the AND.
 *
 * DISJOINTNESS IS `fence.ts`'s AND IS NOT RESTATED HERE. `expandFence`
 * and `compareFences` are imported; there is no path comparison, no
 * normalisation and no slug table in this file. That is not tidiness, it
 * is the card's own subject: the architect hand-rolled a fence expansion
 * an hour before this card was dispatched, left a path token as itself,
 * and reported two cards disjoint that overlap by containment — while the
 * correct expansion had been shipping since that morning.
 *
 * AND THE THIRD VERDICT IS CARRIED RATHER THAN FOLDED. `compareFences`
 * answers `overlapping | disjoint | unusable`, and its own doc forbids
 * collapsing `unusable` into `disjoint` — that is a fence saying "no
 * overlap" when it means "I do not know". T-111's board could not express
 * it, because its disposition vocabulary is closed at six by its own
 * criterion 1; this module is under no such constraint, so `unfenceable`
 * is a state of its own with the offending TOKENS in its reason.
 *
 * THE LANE LIST IS AN INPUT AND A LIVE FACT. This module never runs
 * `git`. It takes lanes already filtered ON THE BRANCH (never the path —
 * a detached worktree at a lane-shaped path is not a lane), because the
 * list is a read of a mutable environment and must carry a time and a
 * host rather than a commit. The terminal consumer supplies it.
 *
 * AND A LANE THIS CHECKOUT CANNOT READ A CARD FOR HOLDS AN UNKNOWN
 * FENCE, NEVER AN EMPTY ONE. The lane list is MACHINE-WIDE and the board
 * is per-checkout, so the two disagree the moment a lane is newer than
 * the tree reading it — which is every moment of parallel work, not an
 * exotic state. Dropping such a lane from the comparison makes a card
 * come back "disjoint from every live lane" having never been compared
 * against it: a false green, in the one direction a fence exists to
 * prevent. Measured on this board at `62a4364` with `T-141` live and its
 * card only on main: 15 of 23 `startable` answers overlapped a live lane.
 * The rule is `fence.ts`'s own and this module states it twice below —
 * an input that cannot be read means EVERY comparison is unresolvable
 * RATHER THAN THAT EVERY FENCE IS FREE.
 */

/** One live lane: a worktree ON A TASK BRANCH. */
export interface LaneRecord {
  /** The task id the branch names. */
  taskId: string;
  /** The full ref, e.g. `refs/heads/task/T-137-lane`. */
  branch: string;
  /** The worktree path. */
  worktree: string;
  /** The worktree's HEAD, when the reader supplied one. */
  head?: string;
}

/**
 * What one lane does to one candidate. `verdict` is `compareFences`'s own
 * word, never a re-derivation of it — EXCEPT where there was no second
 * fence to hand it, which is what `cardMissing` records.
 */
export interface LaneHold {
  lane: LaneRecord;
  verdict: FenceVerdict;
  witnesses: readonly FenceWitness[];
  /** Raw tokens from either side that could not be resolved. */
  unusable: readonly string[];
  /**
   * TRUE when THIS CHECKOUT holds no card for the lane's task id, so the
   * lane's fence could not be expanded at all and `compareFences` was
   * never called. The verdict is `unusable` for that reason rather than
   * for a token's, and the two are kept apart because the REMEDY differs:
   * an unresolved token is spelled better on a card, and a missing card
   * is fetched.
   *
   * A `cardMissing` hold carries no witnesses and no `unusable` tokens —
   * there is nothing to name — which is exactly why it must be a HOLD and
   * not an omission. See `readDispatchOrder`.
   */
  cardMissing: boolean;
}

/**
 * SEVEN STATES, and the seventh is the point.
 *
 * - `underway`     — somebody is on it (status is not `planned`);
 * - `blocked`      — an unmet blocker is not in flight;
 * - `waits`        — every unmet blocker IS in flight, so the wait ends;
 * - `startable`    — `ready`, and PROVED disjoint from every live lane —
 *                    which means every live lane was actually compared,
 *                    never that the uncomparable ones were skipped;
 * - `fenced`       — `ready`, and a live lane PROVABLY shares a path;
 * - `unfenceable`  — `ready`, and the fence cannot be shown to let this
 *                    card start. Causes are kept apart in the sentence
 *                    because their remedies differ: a token on one side
 *                    could not be resolved, a LIVE LANE'S CARD IS NOT IN
 *                    THIS CHECKOUT so its fence could not be expanded at
 *                    all, the card declares no `touches:`, its `touches:`
 *                    RESERVES NOTHING once the carve-outs are taken
 *                    (T-219-s6), a LIVE LANE'S card declares no
 *                    `touches:` so the comparison brought back no token
 *                    to name (T-219-s6), or ITS OWN CRITERIA DEMAND A
 *                    TEST BODY THE FENCE CANNOT HOLD (T-228-s1) — all
 *                    but the two lane-side ones need no lane and are
 *                    defects of the card. NOT `startable`, not `fenced`;
 * - `own-lane`     — `ready` and the only lane holding it is its OWN.
 *                    A card cannot be fenced out by the lane built to
 *                    build it, and reporting that as `fenced` is how a
 *                    board tells a session it may not do its own job.
 */
export type StartState =
  | 'startable'
  | 'own-lane'
  | 'fenced'
  | 'unfenceable'
  | 'waits'
  | 'blocked'
  | 'underway';

/** One candidate, ruled on, WITH THE SENTENCE. */
export interface CardStartability {
  id: string;
  state: StartState;
  /**
   * Why, in a sentence a human can argue with — naming the lane, the
   * shared path, the unmet blocker or the unresolved token. A state with
   * no reason is not done being computed (T-111's rule, kept).
   */
  reason: string;
  /** The schedule card this ruling was made from. */
  card: WaveCard;
  /** The card's own expanded fence. */
  fence: Fence;
  /** Every lane that is not disjoint from this card, id-ascending. */
  holds: readonly LaneHold[];
  /**
   * Acceptance criteria demanding a TEST BODY this card's fence cannot
   * hold (T-228-s1) — EMPTY unless that is one of the reasons the card is
   * not startable, and empty always where no `knownPaths` oracle was
   * handed in, because without one this module cannot see that a
   * directory fence already holds a spec file.
   *
   * CARRIED RATHER THAN RECOMPUTED, for the reason `unmet` is carried:
   * `card-preflight.mjs` refuses on exactly this reading and would
   * otherwise be a second spelling of it (T-057).
   */
  unbodied: readonly BodyDemand[];
  /**
   * How this card's fence COULD hold a body, when it can — the path and
   * the suite that would collect it. Absent when it cannot, and absent
   * when there was no oracle to look in.
   */
  bodyBearer?: { rel: string; suite: string };
}

export interface DispatchOrder {
  /** `ready` and free, in dispatch order. */
  startable: readonly CardStartability[];
  /** `ready` and held by a live lane — the lane is named. */
  fenced: readonly CardStartability[];
  /** `ready`, but a fence token on one side could not be resolved. */
  unfenceable: readonly CardStartability[];
  /** Unmet blockers, all of them in flight. */
  waits: readonly CardStartability[];
  /** Unmet blockers, at least one not in flight — the blocker is named. */
  blocked: readonly CardStartability[];
  /** Already started or finished. */
  underway: readonly CardStartability[];
  /** Every ruling, in the same dispatch order, whatever its state. */
  all: readonly CardStartability[];
  /** The lanes this answer was computed against, as handed in. */
  lanes: readonly LaneRecord[];
  /**
   * Task ids of lanes that name no card on the board — an UNSTAMPED or
   * lapsed dispatch, or simply a lane cut after this checkout's base.
   *
   * THIS IS THE REPORTING CHANNEL AND IT IS NOT THE RULING. Each such
   * lane ALSO puts a `cardMissing` hold on every ready card, which is
   * what takes them out of `startable`; this list exists so a reader can
   * name the lane to fetch. A field that was only reported and never
   * acted on is exactly what `62a4364` rejected this module for.
   *
   * DEDUPED BY TASK ID, because two worktrees can sit on one branch and
   * the reader wants the id once. The HOLDS are per worktree and are not
   * deduped: both worktrees are real.
   */
  lanesWithNoCard: readonly string[];
  /** The schedule the ruling was made over. */
  schedule: TaskScheduleModel;
}

export interface DispatchOrderOptions extends SelectScheduleOptions {
  /**
   * Repository-relative paths known to exist — `expandFence`'s oracle,
   * and by its own doc *"the ONLY way this module can tell a bare
   * directory token from a word that names nothing"*. A terminal
   * consumer HAS a repository, which is why it can close the gap a board
   * cannot: without it, `docs` and `ci` are indistinguishable and every
   * comparison against such a card is `unusable`.
   */
  knownPaths?: Iterable<string>;
  /**
   * An explicit id order, highest priority first. Defaults to
   * {@link byDispatchRank} — see its doc for what that is NOT.
   */
  order?: readonly string[];
}

/* ────────────────────────────────────────────────────────────────────
 * A CRITERION THAT DEMANDS A TEST BODY, AGAINST A FENCE THAT CANNOT
 * HOLD ONE (T-228-s1).
 *
 * ── THE FOUNDING INSTANCE ────────────────────────────────────────────
 * `T-228` was stamped and armed with `touches: [.claude]` over criteria
 * demanding a body. No test file lives under `.claude`; every body that
 * can drive those hooks sits in two spec files under `tools/e2e/tests`.
 * The dispatch derivation, the arming arm and the brief all passed the
 * card. The executor routed the card's own ORDER criterion OUT as a
 * suggestion because the fence refused it, and a blind verifier's phase-1
 * ground truth named the contradiction twenty minutes later. It is a
 * two-field read of the card, and it cost an arc.
 *
 * ── WHY IT LIVES HERE AND NOWHERE ELSE ───────────────────────────────
 * Two consumers need this reading — this module, so the dispatch view
 * rules such a card `unfenceable` rather than startable, and
 * `tools/e2e/scripts/card-preflight.mjs`, so the preflight refuses with
 * the criterion and the fence named. A second spelling of one derivation
 * is what T-057 forbids, so the vocabulary is exported from here and the
 * preflight reads it off the built parser rather than restating it.
 *
 * ── AND THE SWEEP IS NOT EMPTY ───────────────────────────────────────
 * A defect found in one place is a defect of a CLASS until somebody
 * looks. Over the 366 cards this repository's board draws at `2008186`
 * the reading finds a SECOND instance, `T-189`, whose own notes record
 * the same outcome in as many words: *"AC 4's 'a body SHALL prove it'
 * was NOT built"* — its fence is `method/` and `docs/CONVENTIONS.md`,
 * and `tools/e2e/tests/` is outside it.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * A criterion line that demands a TEST BODY of the card it is on, by
 * family name.
 *
 * **EVERY ONE OF THESE WAS NARROWED AGAINST A LIVE BOARD**, and the
 * narrowings carry more than the patterns do:
 *
 *   - THE BODY WORD IS THE HEAD NOUN. Written loosely, `a body SHALL`
 *     also matches *"A lane adding a `tools/e2e` body SHALL NOT have to
 *     discover this"* — a rule ABOUT other lanes, not a demand on this
 *     card. Only a determiner, at most one adjective from a closed list,
 *     then the body word, then SHALL.
 *   - `SHALL` IS CASE-SENSITIVE. A normative SHALL is written in capitals
 *     in the documents this reads, and ordinary prose writes "shall" for
 *     nothing.
 *   - `positive control` NEEDS A NORMATIVE SHALL ON ITS OWN LINE. Bare,
 *     it matches *"(positive control: the same needle over `docs/`"* — a
 *     grep — and *"with its positive control attached"* — a citation.
 *     Two lines that demand nothing.
 *
 * **AND THE RESIDUAL IS DISCLOSED RATHER THAN CLAIMED AWAY.** At
 * `2008186` this reading fires on 3 of the 366 cards the schedule draws
 * and on 0 of the cards it rules startable. One of the three is a genuine
 * instance; the other two are cards WRITING a rule about bodies into a
 * governing document, and no lexical test told them apart from a card
 * owing one. The consequence is a refusal a dated ruling on the card
 * discharges in one line, printed with the ruling that made it.
 */
/** One acceptance-criterion line that demands a test body. */
export interface BodyDemand {
  /** 1-based, WITHIN the `## Acceptance criteria` section's own text. */
  line: number;
  /** The family that matched, by name — one of {@link BODY_DEMANDING}. */
  phrase: string;
  /**
   * The criterion, trimmed, with a leading list marker and any wrapping
   * emphasis left off — the form an author QUOTES when ruling on it, and
   * the form a consumer matches back against the card's own line. A
   * subject carrying `- ` would make every ruling on one fail to bind.
   */
  text: string;
}

export const BODY_DEMANDING: readonly { name: string; re: RegExp; needsShall?: boolean }[] = [
  {
    name: 'a body SHALL',
    re: /\b(?:[Aa]n?|[Tt]he|[Oo]ne|[Ee]ach|[Ee]very|[Nn]o)\s+(?:[Nn]ew |[Cc]hanged |[Ff]ailing |[Pp]lanted |[Ss]econd |[Ss]ingle )?bod(?:y|ies)\s+SHALL\b/,
  },
  {
    name: 'a test SHALL',
    re: /\b(?:[Aa]n?|[Tt]he|[Oo]ne|[Ee]ach|[Ee]very|[Nn]o)\s+(?:[Nn]ew |[Cc]hanged |[Ff]ailing |[Pp]lanted |[Ss]econd |[Ss]ingle )?(?:test|spec)\s+SHALL\b/,
  },
  { name: 'SHALL red', re: /\bSHALL\s+(?:red|go red|fail)\b/ },
  { name: 'positive control', re: /\bpositive control\b/i, needsShall: true },
];

/**
 * The body-demanding family this line carries, or `''` for none.
 *
 * @param line one criterion line, as the card wrote it
 */
export function bodyDemandOf(line: string): string {
  for (const p of BODY_DEMANDING) {
    if (!p.re.test(line)) continue;
    if (p.needsShall === true && !/\bSHALL\b/.test(line)) continue;
    return p.name;
  }
  return '';
}

/**
 * A path that could carry a TEST BODY, and the suite that would collect
 * it.
 *
 * **THE FOUNDING CARD'S LIST WAS THREE SHAPES AND A REAL TREE HAS FIVE**,
 * which is why this is a table rather than that sentence copied. Measured
 * over the live board at `2008186`: reading only `*.spec.ts`, `*.test.*`
 * and `tests/` refuses four cards whose fences hold real bodies — three
 * reserve `tools/method-evals`, whose `evals/` files ARE that gate's
 * bodies, and one reserves a Rust source, where a `#[cfg(test)] mod
 * tests` is how a Rust body is written at all. A refusal that fires on a
 * card which CAN hold its own body is the one failure a dispatch gate may
 * not have.
 *
 * Each entry names the suite, because the remedy is *fence something a
 * suite runs* rather than a file suffix.
 */
export const BODY_BEARING: readonly { re: RegExp; suite: string }[] = [
  { re: /(?:^|\/)tests?\//, suite: 'a tests/ or test/ directory — playwright and vitest collect these' },
  { re: /\.spec\.[^/]+$/, suite: 'a *.spec.* file' },
  { re: /\.test\.[^/]+$/, suite: 'a *.test.* file' },
  { re: /\.rs$/, suite: 'a Rust source — cargo test collects #[test] out of any crate file' },
  { re: /^tools\/method-evals\/evals\//, suite: 'a method eval' },
];

/** Which suite would collect this path, or `''` for none. */
export function bodyBearing(rel: string): string {
  for (const { re, suite } of BODY_BEARING) if (re.test(rel)) return suite;
  return '';
}

/**
 * Whether a fence could hold a body at all, and by which path.
 *
 * **BOTH DIRECTIONS ARE READ AND THE SECOND IS THE ONE THAT MATTERS.** A
 * fence entry can be a DIRECTORY that already holds bodies, and it can
 * equally be a body that does not exist YET — a card whose whole job is
 * to write `tools/e2e/tests/new-thing.spec.ts` fences exactly that path.
 * Reading only the known side would refuse a card for fencing the file it
 * is about to create.
 *
 * @param fencePaths the card's EXPANDED fence
 * @param known      repository-relative paths known to exist, or nothing
 */
export function fenceHoldsABody(
  fencePaths: readonly string[],
  known: Iterable<string> | undefined,
): { rel: string; suite: string } | undefined {
  for (const p of fencePaths) {
    const suite = bodyBearing(p);
    if (suite !== '') return { rel: p, suite };
  }
  if (known === undefined) return undefined;
  for (const rel of known) {
    const suite = bodyBearing(rel);
    if (suite === '') continue;
    if (fencePaths.some((d) => rel === d || rel.startsWith(`${d}/`))) return { rel, suite };
  }
  return undefined;
}

/**
 * Every acceptance-criterion line of this card that demands a body,
 * with the family that matched.
 *
 * @param criteria the raw markdown under `## Acceptance criteria`
 */
/**
 * One criterion line as a QUOTABLE subject: trimmed, with a leading list
 * marker (`- `, `* `, `1. `) taken off. Exported because the consumer that
 * refuses on this reading has to match the subject back against the card's
 * own line, and a second spelling of the strip is a second answer.
 */
export function criterionText(line: string): string {
  return line.trim().replace(/^(?:[-*+]|\d+\.)\s+/, '');
}

export function criteriaDemandingABody(criteria: string | undefined): readonly BodyDemand[] {
  if (criteria === undefined) return [];
  const out: BodyDemand[] = [];
  const lines = criteria.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i] as string;
    const phrase = bodyDemandOf(text);
    if (phrase !== '') out.push({ line: i + 1, phrase, text: criterionText(text) });
  }
  return out;
}

/**
 * DISPATCH RANK — milestone ascending, then `priority:` ascending
 * (missing last), then id ascending. All three are frontmatter fields
 * already in the parser's model; **no second notion of progress is
 * derived here** (T-137: `docs/ROADMAP.md` is hand-written prose and this
 * card does not make it generated).
 *
 * WHAT THIS IS NOT, said plainly rather than discovered later. The BOARD
 * has a richer order — milestone-1-first WITHIN a feature column, then
 * `byPriority`, and `orchestrator.md` step 4 dispatches *"among the
 * topmost undone tasks of each feature column"*, which needs a column
 * GROUPING this module does not have. That order lives in
 * `app/src/lib/board-model.ts` (`selectBoard`, `topmostUndoneByColumn`),
 * which is C-08 `app-board` — outside T-137's fence, so it could not
 * move with the schedule. **Two orders, one fact, and it is on the record
 * rather than argued away**: `T-111-s5` option (a) is the unification and
 * it needs a card that holds `app-board`. Until then a caller with its
 * own order passes `options.order` and this default is never consulted.
 */
export function byDispatchRank(a: WaveCard, b: WaveCard): number {
  const ma = a.milestone ?? Number.POSITIVE_INFINITY;
  const mb = b.milestone ?? Number.POSITIVE_INFINITY;
  if (ma !== mb) return ma - mb;
  const pa = a.priority ?? Number.POSITIVE_INFINITY;
  const pb = b.priority ?? Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  return byTaskId(a.id, b.id);
}

/** The fence of every card on the board, keyed by id. Own file carved out
 * by `expandFence`, which is where that rule lives. */
function fenceIndex(
  tasks: readonly TaskRecord[],
  components: readonly ComponentRecord[],
  knownPaths: Iterable<string> | undefined,
): Map<string, Fence> {
  const out = new Map<string, Fence>();
  for (const task of tasks) {
    if (task.id === undefined || out.has(task.id)) continue;
    out.set(
      task.id,
      expandFence(task, components, knownPaths === undefined ? {} : { knownPaths }),
    );
  }
  return out;
}

/** The words a reason uses for a lane, so every sentence spells it once. */
function laneName(lane: LaneRecord): string {
  return `${lane.taskId} (${lane.branch} at ${lane.worktree})`;
}

/** The shared paths a comparison proved, deduped and sorted. */
function sharedPaths(cmp: FenceComparison): string[] {
  return [...new Set(cmp.witnesses.map((w) => w.path))].sort();
}

/**
 * How many shared domains a reason SPELLS before it stops naming them.
 *
 * A reason has to be a sentence a human can ARGUE with, and two whole
 * `app-shell` fences share twenty-five domains — a list that long is a
 * dump, not an argument. The residual is COUNTED rather than dropped, so
 * the sentence never claims the overlap is smaller than it is, and the
 * full set is on `LaneHold.witnesses` for a caller that wants it.
 */
export const REASON_PATH_CEILING = 6;

/** The spelled-out form of a shared-domain list, with its residual. */
function spellPaths(paths: readonly string[]): string {
  if (paths.length <= REASON_PATH_CEILING) return paths.join(', ');
  const shown = paths.slice(0, REASON_PATH_CEILING);
  return `${shown.join(', ')} and ${paths.length - REASON_PATH_CEILING} more`;
}

/**
 * THE COMPONENT IDS BOTH SIDES EXPANDED THROUGH — the provenance
 * `FenceWitness` does not carry, recovered from the TOKENS rather than
 * bolted onto the verdict.
 *
 * `T-111-s5` reason 3 is why this exists: importing `fence.ts` into the
 * board would have deleted the clause *"both expand through C-11, so this
 * may be the COARSE fence rather than a real overlap"*, because
 * `FenceWitness` is `{left, right, path}` and nothing else. It does not
 * have to be deleted — a witness names its two RAW tokens, and a token
 * knows the components it resolved through. **The provenance is
 * recoverable from the module as it ships; it is not missing, it is one
 * join away.**
 */
export function witnessComponents(a: Fence, b: Fence, witness: FenceWitness): string[] {
  const ids = new Set<string>();
  for (const token of a.tokens) if (token.raw === witness.left) for (const c of token.components) ids.add(c);
  for (const token of b.tokens) if (token.raw === witness.right) for (const c of token.components) ids.add(c);
  return [...ids].sort();
}

/** Every component id a whole comparison went through, sorted. */
function comparisonComponents(a: Fence, b: Fence, cmp: FenceComparison): string[] {
  const ids = new Set<string>();
  for (const w of cmp.witnesses) for (const id of witnessComponents(a, b, w)) ids.add(id);
  return [...ids].sort();
}

/**
 * Rule on every card: what can start now, what is merely unblocked but
 * fenced, what is blocked, and why — each with the lane, the path or the
 * blocker that says so.
 *
 * PURE. No git, no filesystem, no clock. Every answer is derived at call
 * time from the model and the lane list handed in, which is why
 * ADAPTATION IS BY CONSTRUCTION: a card added a minute ago is in the next
 * answer with nothing else edited, and nothing is stored to go stale.
 */
export function readDispatchOrder(
  model: ProjectParseResult,
  lanes: readonly LaneRecord[],
  options: DispatchOrderOptions = {},
): DispatchOrder {
  const schedule = selectTaskSchedule(
    model,
    options.rejectedCountOf === undefined ? {} : { rejectedCountOf: options.rejectedCountOf },
  );
  // `components` is optional on the model — an absent registry is a legal
  // state ("no architecture declared"), and it means every slug token is
  // unresolvable rather than that every fence is free.
  const components = model.components ?? [];
  const fences = fenceIndex(model.tasks, components, options.knownPaths);
  const laneList = [...lanes].sort((x, y) => byTaskId(x.taskId, y.taskId));
  const lanesWithNoCard = [
    ...new Set(laneList.filter((l) => !fences.has(l.taskId)).map((l) => l.taskId)),
  ];

  const rank = new Map<string, number>();
  if (options.order !== undefined) options.order.forEach((id, i) => rank.set(id, i));

  const rulings: CardStartability[] = [];
  for (const card of schedule.cards) {
    const fence = fences.get(card.id) ?? expandFence({ touches: [] }, components, {});
    const holds: LaneHold[] = [];
    for (const lane of laneList) {
      const other = fences.get(lane.taskId);
      if (other === undefined) {
        // A LANE WHOSE CARD IS NOT IN THIS CHECKOUT HOLDS AN UNKNOWN
        // FENCE, AND AN UNKNOWN FENCE IS NOT AN EMPTY ONE. There is no
        // second fence to compare, so no overlap can be PROVED and none
        // can be RULED OUT — which is `unusable`, by the same lattice
        // `compareFences` applies to a token it cannot read, and by the
        // same argument the `components ?? []` comment above makes about
        // an absent registry. `continue` here would drop the lane from
        // the comparison entirely and let the card out through the
        // `holds.length === 0` branch wearing the sentence "disjoint
        // from every live lane" — the exact false green this module
        // exists to remove, and the reason `62a4364` rejected it.
        holds.push({
          lane,
          verdict: 'unusable',
          witnesses: [],
          unusable: [],
          cardMissing: true,
        });
        continue;
      }
      const cmp = compareFences(fence, other);
      if (cmp.verdict === 'disjoint') continue;
      holds.push({
        lane,
        verdict: cmp.verdict,
        witnesses: cmp.witnesses,
        unusable: cmp.unusable,
        cardMissing: false,
      });
    }
    // THE CRITERIA ARE READ OFF THE MODEL AND NEVER OFF `WaveCard`, which
    // carries the frontmatter dimensions and no body (T-228-s1). The
    // schedule's card and the parsed record are the same file; this is
    // the join, made once here rather than by the ruling.
    const record = model.tasks.find((t) => t.id === card.id);
    rulings.push(
      rule(card, fence, holds, fences, {
        demands: criteriaDemandingABody(record?.sections?.acceptanceCriteria),
        known: options.knownPaths,
      }),
    );
  }

  rulings.sort((a, b) => {
    if (options.order !== undefined) {
      const ra = rank.get(a.id) ?? Number.POSITIVE_INFINITY;
      const rb = rank.get(b.id) ?? Number.POSITIVE_INFINITY;
      if (ra !== rb) return ra - rb;
    }
    return byDispatchRank(a.card, b.card);
  });

  const of = (state: StartState): CardStartability[] => rulings.filter((r) => r.state === state);
  return {
    startable: of('startable'),
    fenced: [...of('fenced'), ...of('own-lane')].sort((a, b) => byDispatchRank(a.card, b.card)),
    unfenceable: of('unfenceable'),
    waits: of('waits'),
    blocked: of('blocked'),
    underway: of('underway'),
    all: rulings,
    lanes: laneList,
    lanesWithNoCard,
    schedule,
  };
}

/** One card's state and its sentence. Split out so the reason and the
 * word can never be computed in two places. */
function rule(
  card: WaveCard,
  fence: Fence,
  holds: readonly LaneHold[],
  fences: ReadonlyMap<string, Fence>,
  body: { demands: readonly BodyDemand[]; known: Iterable<string> | undefined },
): CardStartability {
  // THE BODY TERM IS ARMED ONLY WHERE A `knownPaths` ORACLE WAS HANDED
  // IN, and that is measured rather than cautious (T-228-s1). Without an
  // oracle this module cannot see that `tools/e2e` HOLDS a spec file —
  // only that the token is not itself spec-shaped — so every
  // directory-fenced card with a body-demanding criterion would be ruled
  // unfenceable on a board consumer that has no repository to look in.
  // A false refusal is the one failure a dispatch gate may not have, and
  // the consumer that HAS a repository is exactly the one that dispatches.
  const bearer = body.known === undefined ? undefined : fenceHoldsABody(fence.paths, body.known);
  const unbodied =
    body.known !== undefined && body.demands.length > 0 && bearer === undefined
      ? body.demands
      : [];
  const base = {
    id: card.id,
    card,
    fence,
    holds,
    unbodied,
    ...(bearer === undefined ? {} : { bodyBearer: bearer }),
  };

  if (card.schedule === 'underway') {
    return { ...base, state: 'underway', reason: `${card.id} is ${card.status} — somebody is on it.` };
  }
  if (card.schedule === 'blocked' || card.schedule === 'waits') {
    const unmet = card.unmet ?? [];
    const named = unmet
      .map((u) => `${u.id} (${u.status ?? 'names no card on this board'})`)
      .join(', ');
    if (card.schedule === 'waits') {
      return {
        ...base,
        state: 'waits',
        reason:
          `${card.id} is unblocked only once ${named} land, and every one of them is in flight, ` +
          'so the wait has a visible end.',
      };
    }
    const stuck = unmet.filter((u) => !u.inFlight).map((u) => u.id);
    return {
      ...base,
      state: 'blocked',
      reason:
        `${card.id} waits on ${named}; nobody is on ${stuck.join(', ')}, so the wait has no end ` +
        'in sight. The declaration is the card\'s and is never repaired here.',
    };
  }

  // schedule === "ready": the fence term is the whole remaining question.
  //
  // `holds.length === 0` NOW MEANS EVERY LIVE LANE WAS COMPARED AND EVERY
  // COMPARISON CAME BACK `disjoint`, which is what makes the sentence
  // below true rather than merely confident: a lane this checkout could
  // not expand a fence for arrives as a `cardMissing` hold and lands the
  // card in `unfenceable`, so `startable` is unreachable while one is
  // live.
  // AND `holds.length === 0` IS NOT ON ITS OWN A LICENCE, BECAUSE THE
  // LANE LIST CANNOT SPEAK FOR A CARD THAT DECLARES NO FENCE (T-227,
  // absorbed by T-219; V-T-219's verdict of 2026-09-02, which found this
  // reachable at this very site). `compareFences` refuses to call a
  // token-less fence disjoint — but this branch reaches `compareFences`
  // only THROUGH `holds`, and `holds` is empty when the lane list is. So
  // the refusal was armed exactly when the card would have been held
  // anyway and disarmed when nothing was live, which is the canonical
  // DISPATCH moment: `brief.mjs --dispatch` is asked what can START, and
  // it is asked when lanes are free. An undeclared fence is a defect of
  // the CARD and not a fact about the board, so it cannot be conditioned
  // on the board.
  //
  // THE TERM IS ADDED TO THIS GUARD RATHER THAN GIVEN ITS OWN EARLY
  // RETURN, so the sentence stays in ONE place (T-057). Falling through
  // reaches the `unfenceable` branch below, whose clause list already
  // spells this cause and which ACCUMULATES the other causes when lanes
  // ARE live — an early return would have answered correctly and dropped
  // the `cardMissing` clause beside it.
  //
  // AND A DECLARED FENCE IS STILL NOT A COMPARABLE ONE (T-219-s4, the
  // residual V-T-219 named in the same sentence and deliberately left).
  // `tokens.length > 0` asks only whether the card SPOKE. A token that
  // cannot be RESOLVED means the fence cannot be COMPUTED, which is the
  // sentence the `unfenceable` branch below closes with — and
  // `compareFences` answers `unusable` for exactly that fence the moment
  // any lane is live, while `buildLaneFence` refuses to arm it outright.
  // So with no lane live this branch was the one place in the whole
  // pipeline that called such a fence FREE, and it is the place dispatch
  // actually asks. Two halves disagreeing in the safe direction by luck
  // rather than by rule is T-227's shape and the reason T-219 exists.
  //
  // THE TERM IS `fence.unusable` AND IS NOT A COUNT DERIVED HERE.
  // `expandFence` already answers *"which raw tokens make this fence
  // uncomparable"* — every `rejected` and every `unresolved` one — and a
  // second derivation at this site would be a fourth spelling of a rule
  // this module imports precisely so that there is one (T-057). It is
  // also why the term reads `=== 0` on a list rather than testing token
  // KINDS: a kind test would have to be extended by hand the day a
  // fourth kind is added, and this one never does.
  //
  // MEASURED BEFORE IT WAS TAKEN, at `24bfec8e10b3`, over the live board
  // with no lanes handed in — both ways, because the two answers differ
  // and only one of them is dispatch. WITH the oracle
  // `brief.mjs --dispatch` supplies, 0 of 111 startable cards carry an
  // unusable token and nothing moves. WITHOUT one, `T-164-s1` moves from
  // `startable` to `unfenceable`, which is the correct answer for a
  // consumer that has no repository to resolve a bare `bin` against: a
  // fence it cannot compute is not a fence that is free.
  //
  // AND THE FOURTH TERM IS T-228-s1's, ADDED HERE FOR THE REASON THE
  // THIRD ONE WAS: a card whose criteria demand a test body over a fence
  // that can hold none cannot be built as fenced, and `startable` is the
  // one word that says a session may start it. Falling through carries
  // the cause into the `unfenceable` clause list beside every other cause
  // rather than answering early and dropping them.
  //
  // AND THE FIFTH TERM IS `T-219-s6`'s TRIAGE, TAKEN FOR THE REASON THE
  // THIRD AND FOURTH WERE: A FENCE THAT ARMS NOTHING IS NOT STARTABLE.
  // A card every one of whose tokens is CARVED OUT — today that is a
  // card whose only token is its OWN FILE, which `expandFence` subtracts
  // by rule — has `tokens.length > 0`, an empty `unusable` and
  // `paths: []`, so all four terms above pass and this branch called it
  // startable while spelling the defect out loud in its own sentence:
  // "it reserves nothing, disjoint from every live lane". `buildLaneFence`
  // refuses exactly that fence — *"expands to no path at all, so every
  // write in the lane would be refused"* — so the two readers of one
  // fence disagreed, and the one that says a session MAY START is the
  // one that said yes. Seen at both refs by `V-T-219-s4` and routed to
  // this card's triage.
  //
  // THE TERM IS `fence.paths` AND NOT A COUNT OF CARVE-OUTS, for the
  // reason the third term reads `fence.unusable`: `expandFence` already
  // answers *"what does this fence reserve"*, and whether that is
  // anything at all stays the right question the day a second kind of
  // carve-out is added. Falling through carries the cause into the
  // `unfenceable` clause list beside every other cause.
  if (
    holds.length === 0 &&
    fence.tokens.length > 0 &&
    fence.unusable.length === 0 &&
    fence.paths.length > 0 &&
    unbodied.length === 0
  ) {
    return {
      ...base,
      state: 'startable',
      reason:
        `${card.id} has no unmet blocker and its fence is ${spellPaths(fence.paths)}, ` +
        'disjoint from every live lane.',
    };
  }

  // GUARDED ON THE COUNT, and that is load-bearing rather than defensive
  // since the line above stopped returning for every empty `holds`:
  // `[].every(...)` is TRUE, so an undeclared fence with no live lane
  // would take this branch and index `holds[0]` — which is `undefined`,
  // and the cast below would hand a crash to a caller this module
  // promises never to throw at.
  const ownLaneOnly = holds.length > 0 && holds.every((h) => h.lane.taskId === card.id);
  if (ownLaneOnly) {
    const lane = holds[0] as LaneHold;
    return {
      ...base,
      state: 'own-lane',
      reason:
        `${card.id} has no unmet blocker, and the only lane touching its fence is its OWN — ` +
        `${laneName(lane.lane)}. It is already dispatched, not fenced out.`,
    };
  }

  const overlapping = holds.filter((h) => h.verdict === 'overlapping' && h.lane.taskId !== card.id);
  if (overlapping.length > 0) {
    const sentences = overlapping.map((hold) => {
      const other = fences.get(hold.lane.taskId);
      const cmp: FenceComparison = {
        verdict: hold.verdict,
        witnesses: [...hold.witnesses],
        unusable: [...hold.unusable],
      };
      const paths = sharedPaths(cmp);
      const via = other === undefined ? [] : comparisonComponents(fence, other, cmp);
      const coarse =
        via.length > 0
          ? ` Both expand through ${via.join(', ')}, so this may be the COARSE fence rather than a real overlap.`
          : '';
      return `${laneName(hold.lane)} holds ${spellPaths(paths)}.${coarse}`;
    });
    // A PROVED OVERLAP OUTRANKS AN UNREADABLE LANE — `compareFences`'s own
    // lattice, not re-ordered here — but the unreadable lane is still said
    // out loud, because a human weighing a COARSE-fence override needs to
    // know the named overlap may not be the only one.
    //
    // AND IT AGREES IN NUMBER WITH THE LIST IT NAMES, for the reason the
    // `unfenceable` branch below states at length (T-143 criterion 4).
    // The two clauses were written in one commit and only one of them
    // got the flag; the reader of this one is a human weighing a
    // COARSE-fence override, which is the LAST sentence that can afford
    // to read as though one lane were unreadable when three are. The
    // count is the LANE count and not the id count — two worktrees on
    // one branch are two live writers.
    const blind = holds.filter((h) => h.cardMissing);
    const blindMany = blind.length > 1;
    const residual =
      blind.length === 0
        ? ''
        : ` And ${blind.map((h) => laneName(h.lane)).join(', ')} could not be compared at all — ` +
          `${blindMany ? 'no cards for them' : 'no card for it'} in this checkout — so this ` +
          'overlap may not be the only one.';
    return {
      ...base,
      state: 'fenced',
      reason: `${card.id} has no unmet blocker and cannot start: ${sentences.join(' ')}${residual}`,
    };
  }

  // THE CAUSES OF "I DO NOT KNOW", SPELLED APART BECAUSE THEIR REMEDIES
  // DIFFER: a card declaring no fence is spelled ON THIS CARD; a card
  // whose fence RESERVES nothing widens the one it has; a token THIS
  // card owns and nobody can resolve is spelled better HERE; a token the
  // LANE'S card owns is spelled better THERE; a lane whose card declares
  // no fence is repaired THERE; a lane whose card is not here is
  // fetched. Two of them were one clause until T-219-s4, and they read
  // as one remedy while pointing at two cards.
  //
  // EACH CAUSE CARRIES AN ORDINAL AND THE ORDINALS ARE MINTED IN THE
  // ORDER THE CAUSES WERE FOUND, NEVER IN THE ORDER THE CLAUSES ARE
  // EMITTED (T-219-s6 added the sixth and seventh and sits them beside
  // their near twins). Cite a cause by its ordinal and its own capitals,
  // the way this project cites every other numbered catalogue: the
  // clause ORDER is the sentence's and moves when the sentence reads
  // better, and a citation keyed to a position would go stale silently.
  const missing = holds.filter((h) => h.cardMissing);
  const unresolved = holds.filter((h) => !h.cardMissing);
  // THIS CARD'S OWN UNCOMPARABLE TOKENS, WHICH IS THE ONLY CAUSE THAT
  // NEEDS NO LANE (T-219-s4). It is read off `fence.unusable` — the same
  // list the `startable` guard above tests — so the word that refuses the
  // card and the word that explains the refusal can never be computed
  // from two different facts.
  const own = [...new Set(fence.unusable)].sort();
  // AND THE HOLD CLAUSE NAMES ONLY WHAT THE OTHER SIDE BROUGHT.
  // `compareFences` returns the UNION of both sides' `unusable`, so
  // before the subtraction one token bought two clauses — "this card's
  // fence carries bin" and "against T-002 …, bin resolved to neither" —
  // and a reader could not tell which of the two cards to go and repair.
  // The subtraction is by RAW TOKEN, which is what both lists hold.
  const tokens = [...new Set(unresolved.flatMap((h) => [...h.unusable]))]
    .filter((t) => !own.includes(t))
    .sort();
  const clauses: string[] = [];
  // THE THIRD CAUSE IS THE CARD'S OWN (T-227, absorbed by T-219): a card
  // declaring no `touches:` owns no token to be unresolved, so neither
  // clause below can speak for it and the sentence would arrive with an
  // empty middle. `compareFences` refuses to call a token-less fence
  // disjoint, which is what routes such a card here; this is the clause
  // that says why.
  if (fence.tokens.length === 0) {
    clauses.push(
      `${card.id} declares no \`touches:\` at all, so it has no fence to compare — an undeclared ` +
        'fence is not an empty one, and nothing can be ruled disjoint from it',
    );
  }
  // THE SIXTH CAUSE IS THE THIRD ONE'S NEAR TWIN AND IS NOT IT
  // (`T-219-s6`'s triage): this card DID declare a fence, every token of
  // it resolved, and the expansion still reserves NOTHING because every
  // domain was carved out — today the card whose only token is its own
  // file, which is never part of its own fence. It is spelled apart from
  // the clause above because the REMEDY differs: that card writes a
  // `touches:`, this one widens the one it has to ground somebody else
  // could collide with. `buildLaneFence` refuses this fence outright, and
  // this clause is what makes the two readers say the same thing.
  if (fence.tokens.length > 0 && fence.unusable.length === 0 && fence.paths.length === 0) {
    const carved =
      fence.excluded.length > 0
        ? ` — every domain it names was carved out (${fence.excluded.join(', ')}), and a card's own file is never part of its own fence`
        : '';
    clauses.push(
      `${card.id}'s \`touches:\` reserves no path at all${carved}, so there is nothing to arm: a ` +
        'fence that reserves nothing permits nothing, and every write in the lane would be refused',
    );
  }
  // THE CAUSE THAT NEEDS NO LANE, AND THEREFORE THE ONE THE OLD CLAUSE
  // LIST COULD NOT REACH (T-219-s4). Every clause below is keyed on a
  // HOLD, and there are no holds when the lane list is empty — so a card
  // whose own token nobody can resolve arrived here with an empty middle
  // in the one state where it is the whole story. The remedy named is
  // this card's: spell the token as a slug or a path, or hand the reader
  // a `knownPaths` oracle that can settle a bare word.
  if (own.length > 0) {
    const many = own.length > 1;
    clauses.push(
      `${card.id}'s own \`touches:\` carries ${own.join(', ')}, which ` +
        `${many ? 'resolve' : 'resolves'} to neither a slug nor a path, so this fence cannot be ` +
        'COMPARED against any lane, live or not — an unresolved token is not "disjoint from ' +
        'everything"',
    );
  }
  if (missing.length > 0) {
    // NUMBER AGREEMENT IS NOT DECORATION HERE. Three lanes went live on
    // this machine while the sentence was being written, and a reason a
    // human is meant to ARGUE with cannot read "T-141, T-145 has no card
    // … disjoint from it". The count is the lane count, because two
    // worktrees on one branch are two live writers.
    const many = missing.length > 1;
    clauses.push(
      `this checkout has NO CARD for ${missing.map((h) => laneName(h.lane)).join(', ')}, so ` +
        `${many ? 'those fences' : 'that fence'} could not be expanded at all and nothing can be ` +
        `ruled disjoint from ${many ? 'them' : 'it'}`,
    );
  }
  if (tokens.length > 0) {
    clauses.push(
      `against ${unresolved.map((h) => laneName(h.lane)).join(', ')}, ${tokens.join(', ')} ` +
        'resolved to neither a slug nor a path',
    );
  }
  // THE SEVENTH CAUSE, AND IT IS THE ONE THAT LEAVES NOTHING BEHIND TO
  // NAME (`T-219-s6`'s triage). A hold whose comparison came back
  // `unusable` while NEITHER side contributed a raw token is
  // `compareFences`'s token-less refusal seen from the other side: the
  // LANE'S card declares no `touches:` at all, so it owns no token to be
  // unresolved and its card is not missing either. Every clause above is
  // keyed on a token, on a missing card or on this card's own fence, so
  // such a hold produced NONE and the sentence arrived with an empty
  // middle — "…none could be ruled out: . A fence that cannot be
  // COMPUTED…", the exact string `T-219`'s own body guards against, one
  // side over. Observed at both refs by `V-T-219-s4`.
  //
  // IT NAMES THE HOLDING CARD, because that is the card a dispatcher
  // repairs: the subject's fence is fine and nothing it can do will make
  // this comparison answer. The verdict is tested as well as the empty
  // token list, so an `overlapping` hold against this card's OWN lane —
  // which the branch above deliberately filters out — cannot be
  // mis-described as a silent one.
  const silent = unresolved.filter((h) => h.verdict === 'unusable' && h.unusable.length === 0);
  if (silent.length > 0) {
    const many = silent.length > 1;
    clauses.push(
      `${silent.map((h) => laneName(h.lane)).join(', ')} ` +
        `${many ? 'declare' : 'declares'} no \`touches:\` at all, so ` +
        `${many ? 'those fences' : 'that fence'} could not be compared and nothing can be ruled ` +
        `disjoint from ${many ? 'them' : 'it'} — the remedy is on ${many ? 'those cards' : 'that card'}, not on this one`,
    );
  }
  // THE FIFTH CAUSE, AND IT NEEDS NO LANE EITHER (T-228-s1). It names the
  // criterion and the fence, because those are the two things a
  // dispatcher repairs: widen the `touches:` to something a suite runs,
  // or rule the criterion documentary on the card and date it.
  if (unbodied.length > 0) {
    const first = unbodied[0] as BodyDemand;
    const more = unbodied.length > 1 ? ` (and ${unbodied.length - 1} more like it)` : '';
    clauses.push(
      `${card.id}'s acceptance criteria demand a TEST BODY — "${first.text}"${more}, the ` +
        `"${first.phrase}" shape — and its fence ` +
        `${fence.paths.length === 0 ? 'reserves nothing' : `is ${spellPaths(fence.paths)}`}, which ` +
        'holds no path any suite collects, so the body has nowhere inside the lane to go',
    );
  }
  return {
    ...base,
    state: 'unfenceable',
    reason:
      `${card.id} has no unmet blocker, and no overlap was PROVED and none could be ruled out: ` +
      `${clauses.join('; ')}. A fence that cannot be COMPUTED is not a fence that is free.`,
  };
}
