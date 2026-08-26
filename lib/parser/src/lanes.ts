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
 * word, never a re-derivation of it.
 */
export interface LaneHold {
  lane: LaneRecord;
  verdict: FenceVerdict;
  witnesses: readonly FenceWitness[];
  /** Raw tokens from either side that could not be resolved. */
  unusable: readonly string[];
}

/**
 * SEVEN STATES, and the seventh is the point.
 *
 * - `underway`     — somebody is on it (status is not `planned`);
 * - `blocked`      — an unmet blocker is not in flight;
 * - `waits`        — every unmet blocker IS in flight, so the wait ends;
 * - `startable`    — `ready`, and disjoint from every live lane;
 * - `fenced`       — `ready`, and a live lane PROVABLY shares a path;
 * - `unfenceable`  — `ready`, no overlap proved, and a token on one side
 *                    could not be resolved, so no overlap could be ruled
 *                    out either. NOT `startable`, and not `fenced`;
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
   * Lanes whose task id names no card on the board — an UNSTAMPED or
   * lapsed dispatch. Reported rather than dropped: a lane with no card
   * still holds no fence this module can compute, and silence there is
   * how a collision gets through.
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
  const lanesWithNoCard = laneList.filter((l) => !fences.has(l.taskId)).map((l) => l.taskId);

  const rank = new Map<string, number>();
  if (options.order !== undefined) options.order.forEach((id, i) => rank.set(id, i));

  const rulings: CardStartability[] = [];
  for (const card of schedule.cards) {
    const fence = fences.get(card.id) ?? expandFence({ touches: [] }, components, {});
    const holds: LaneHold[] = [];
    for (const lane of laneList) {
      const other = fences.get(lane.taskId);
      if (other === undefined) continue;
      const cmp = compareFences(fence, other);
      if (cmp.verdict === 'disjoint') continue;
      holds.push({
        lane,
        verdict: cmp.verdict,
        witnesses: cmp.witnesses,
        unusable: cmp.unusable,
      });
    }
    rulings.push(rule(card, fence, holds, fences));
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
): CardStartability {
  const base = { id: card.id, card, fence, holds };

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
  if (holds.length === 0) {
    const spelled =
      fence.paths.length === 0 ? 'it reserves nothing' : `its fence is ${spellPaths(fence.paths)}`;
    return {
      ...base,
      state: 'startable',
      reason: `${card.id} has no unmet blocker and ${spelled}, disjoint from every live lane.`,
    };
  }

  const ownLaneOnly = holds.every((h) => h.lane.taskId === card.id);
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
    return {
      ...base,
      state: 'fenced',
      reason: `${card.id} has no unmet blocker and cannot start: ${sentences.join(' ')}`,
    };
  }

  const tokens = [...new Set(holds.flatMap((h) => [...h.unusable]))].sort();
  const lanesHolding = holds.map((h) => laneName(h.lane)).join(', ');
  return {
    ...base,
    state: 'unfenceable',
    reason:
      `${card.id} has no unmet blocker, and against ${lanesHolding} no overlap was PROVED and ` +
      `none could be ruled out: ${tokens.join(', ')} resolved to neither a slug nor a path. ` +
      'An unresolved token is not "disjoint from everything".',
  };
}
