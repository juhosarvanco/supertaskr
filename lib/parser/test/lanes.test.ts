import { describe, expect, it } from 'vitest';
import { parseProjectFromFiles } from '../src/files.js';
import { readDispatchOrder, witnessComponents } from '../src/lanes.js';
import type { LaneRecord } from '../src/lanes.js';
import { expandFence } from '../src/fence.js';
import type { TaskStatus } from '../src/types.js';

/**
 * THE LANE TERM (T-137) — `ready` AND disjoint from every live lane.
 *
 * WHY THIS FILE EXISTS, IN ONE RECORDED INSTANCE. An hour before this
 * card was dispatched the architect was asked what could run in parallel.
 * It hand-rolled a fence expansion that mapped a slug to its components
 * and LEFT A PATH TOKEN AS ITSELF — so `method/` and
 * `method/roles/executor.md` compared as different strings, two cards
 * that overlap by CONTAINMENT were reported disjoint, and dispatching
 * them would have put two writers on two files. `fence.ts` had shipped
 * the correct expansion that morning and nothing made it reachable from a
 * terminal. The first body below is that exact pair.
 */

interface Frontmatter {
  status?: TaskStatus;
  blockedBy?: string[];
  touches?: string[];
  milestone?: number;
  priority?: number;
}

function card(id: string, title: string, fm: Frontmatter = {}): { path: string; content: string } {
  return {
    path: `docs/tasks/${id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
    content: [
      '---',
      `id: ${id}`,
      `title: ${title}`,
      `status: ${fm.status ?? 'planned'}`,
      ...(fm.milestone === undefined ? [] : [`milestone: ${fm.milestone}`]),
      ...(fm.priority === undefined ? [] : [`priority: ${fm.priority}`]),
      `blocked_by: [${(fm.blockedBy ?? []).join(', ')}]`,
      `touches: [${(fm.touches ?? []).join(', ')}]`,
      '---',
      '',
      'Body.',
    ].join('\n'),
  };
}

function component(id: string, slugs: string[], paths: string[]): { path: string; content: string } {
  return {
    path: `docs/architecture/components/${id}-x.md`,
    content: [
      '---',
      `id: ${id}`,
      `name: ${id}`,
      'layer: app',
      'paths:',
      ...paths.map((p) => `  - ${p}`),
      'depends_on: []',
      `touch_slugs: [${slugs.join(', ')}]`,
      '---',
      '',
      'Body.',
    ].join('\n'),
  };
}

const ROADMAP = {
  path: 'docs/ROADMAP.md',
  content: ['# Roadmap', '', '## F-01 One', ''].join('\n'),
};

function lane(taskId: string): LaneRecord {
  return {
    taskId,
    branch: `refs/heads/task/${taskId}-lane`,
    worktree: `/w/${taskId}`,
    head: '0'.repeat(40),
  };
}

describe("THE ARCHITECT'S OWN ERROR, AS A PIN", () => {
  const model = parseProjectFromFiles([
    ROADMAP,
    card('T-105', 'Container', { touches: ['method/'] }),
    card('T-138', 'Contained', { status: 'building', touches: ['method/roles/executor.md'] }),
  ]);

  it('two fences that share NO TOKEN but overlap by containment are not startable', () => {
    // KILLED BY: comparing the raw tokens, or comparing normalised
    // tokens with `===` instead of `sharedDomain`. That mutant answers
    // `startable` — which is the answer the architect gave by hand, and
    // is how two writers land on one file.
    const order = readDispatchOrder(model, [lane('T-138')]);
    expect(order.startable.map((r) => r.id)).toEqual([]);
    expect(order.fenced.map((r) => r.id)).toEqual(['T-105']);
    const held = order.fenced[0];
    expect(held?.reason).toContain('T-138');
    expect(held?.reason).toContain('method/roles/executor.md');
    expect(held?.holds[0]?.verdict).toBe('overlapping');
  });

  it('THE POSITIVE CONTROL: a genuinely disjoint pair IS startable', () => {
    // Without this, "nothing is ever startable" would pass the body
    // above. The two sides differ only in the token.
    const disjoint = parseProjectFromFiles([
      ROADMAP,
      card('T-105', 'Container', { touches: ['docs/CONVENTIONS.md'] }),
      card('T-138', 'Contained', { status: 'building', touches: ['method/roles/executor.md'] }),
    ]);
    const order = readDispatchOrder(disjoint, [lane('T-138')]);
    expect(order.startable.map((r) => r.id)).toEqual(['T-105']);
    expect(order.fenced.map((r) => r.id)).toEqual([]);
    expect(order.startable[0]?.reason).toContain('disjoint from every live lane');
  });
});

describe('startable iff ready AND disjoint — the AND is the card', () => {
  const comps = [
    component('C-11', ['app-shell', 'app-board'], ['app/src/styles/**', 'app/src/assets/**']),
    component('C-12', ['app-map'], ['app/src/architecture/**']),
  ];

  it('a READY card held by a live lane is fenced, and the LANE is named', () => {
    // KILLED BY: returning `startable` whenever the schedule reads
    // `ready` — i.e. dropping the fence term entirely, which is exactly
    // what `task-waves.ts` did before this card.
    const model = parseProjectFromFiles([
      ROADMAP,
      ...comps,
      card('T-001', 'Subject', { touches: ['app-board'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['app-shell'] }),
    ]);
    const order = readDispatchOrder(model, [lane('T-002')]);
    expect(order.startable.map((r) => r.id)).toEqual([]);
    const held = order.fenced.find((r) => r.id === 'T-001');
    expect(held?.reason).toContain('refs/heads/task/T-002-lane');
    expect(held?.reason).toContain('/w/T-002');
    expect(held?.reason).toContain('app/src/assets');
  });

  it('and the COARSE-FENCE clause names the components both sides expanded through', () => {
    // KILLED BY: deleting the clause, or making it unconditional. Both
    // mutants are pinned: the assertion below reds if the sentence loses
    // `C-11`, and the `startable` control in the previous describe reds
    // if every reason grows the clause. `FenceWitness` carries `{left,
    // right, path}` and NO component ids — the provenance `T-111-s5`
    // called deleted is recovered from the TOKENS instead.
    const model = parseProjectFromFiles([
      ROADMAP,
      ...comps,
      card('T-001', 'Subject', { touches: ['app-board'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['app-shell'] }),
    ]);
    const order = readDispatchOrder(model, [lane('T-002')]);
    const held = order.fenced.find((r) => r.id === 'T-001');
    expect(held?.reason).toContain('Both expand through C-11');
    expect(held?.reason).toContain('COARSE fence');

    const registry = model.components ?? [];
    const a = expandFence({ id: 'T-001', touches: ['app-board'] }, registry, {});
    const b = expandFence({ id: 'T-002', touches: ['app-shell'] }, registry, {});
    const witness = held?.holds[0]?.witnesses[0];
    expect(witness).toBeDefined();
    expect(Object.keys(witness ?? {}).sort()).toEqual(['left', 'path', 'right']);
    expect(witnessComponents(a, b, witness as never)).toEqual(['C-11']);
  });

  it("a card is never fenced out by its OWN lane", () => {
    // KILLED BY: treating every non-disjoint lane as a hold. A card's own
    // lane shares its whole fence by construction, so the naive rule
    // tells the session dispatched to build a card that it may not.
    const model = parseProjectFromFiles([
      ROADMAP,
      ...comps,
      card('T-001', 'Subject', { touches: ['app-map'] }),
    ]);
    const order = readDispatchOrder(model, [lane('T-001')]);
    expect(order.all.find((r) => r.id === 'T-001')?.state).toBe('own-lane');
    expect(order.all.find((r) => r.id === 'T-001')?.reason).toContain('its OWN');
    expect(order.startable.map((r) => r.id)).toEqual([]);
  });
});

describe('THE THIRD VERDICT IS CARRIED, NEVER FOLDED INTO DISJOINT', () => {
  const model = parseProjectFromFiles([
    ROADMAP,
    card('T-001', 'Subject', { touches: ['ci'] }),
    card('T-002', 'Holder', { status: 'building', touches: ['docs/CONVENTIONS.md'] }),
  ]);

  it('an unresolvable token is `unfenceable`, never `startable`', () => {
    // KILLED BY: folding `unusable` into `disjoint` — the exact fold
    // `fence.ts`'s own doc forbids, and the reason T-111's six-value
    // vocabulary could not consume the module. A fence that answers "no
    // overlap" when it means "I do not know" is the defect the module
    // exists to remove.
    const order = readDispatchOrder(model, [lane('T-002')]);
    expect(order.startable.map((r) => r.id)).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    expect(order.unfenceable[0]?.reason).toContain('ci');
    expect(order.unfenceable[0]?.reason).toContain('none could be ruled out');
    expect(order.unfenceable[0]?.holds[0]?.verdict).toBe('unusable');
  });

  it('AND THE ORACLE CLOSES IT — the half a board has no filesystem to supply', () => {
    // KILLED BY: ignoring `knownPaths`. This is `T-111`'s 113 disagreeing
    // pairs: not a rule disagreement, an ORACLE GAP that only a caller
    // with a repository can close. Same tokens, same cards, one extra
    // input — and the answer becomes a PROVED overlap.
    const order = readDispatchOrder(model, [lane('T-002')], {
      knownPaths: ['ci', 'ci/workflow.yml', 'docs/CONVENTIONS.md'],
    });
    expect(order.unfenceable.map((r) => r.id)).toEqual([]);
    expect(order.startable.map((r) => r.id)).toEqual(['T-001']);
  });
});

describe('the blocked and waiting sentences name what is holding the card', () => {
  const model = parseProjectFromFiles([
    ROADMAP,
    card('T-001', 'Stuck', { status: 'planned' }),
    card('T-002', 'Moving', { status: 'building' }),
    card('T-010', 'Waiter', { blockedBy: ['T-002'] }),
    card('T-011', 'Blocked one', { blockedBy: ['T-001', 'T-002'] }),
  ]);

  it('`waits` says the wait has a visible end; `blocked` names who nobody is on', () => {
    // KILLED BY: collapsing the two words, or emitting an encoded verdict
    // with no sentence. "And WHY the rest are not" is owed to the terminal
    // exactly as T-111 owes it to the screen.
    const order = readDispatchOrder(model, []);
    const waiter = order.waits.find((r) => r.id === 'T-010');
    expect(waiter?.reason).toContain('T-002 (building)');
    expect(waiter?.reason).toContain('visible end');

    const blocked = order.blocked.find((r) => r.id === 'T-011');
    expect(blocked?.reason).toContain('T-001 (planned)');
    expect(blocked?.reason).toContain('nobody is on T-001');
    expect(blocked?.reason).toContain('no end in sight');
  });

  it('a card somebody is already on is `underway`, not a candidate', () => {
    const order = readDispatchOrder(model, []);
    expect(order.underway.map((r) => r.id)).toEqual(['T-002']);
    expect(order.startable.map((r) => r.id)).toEqual(['T-001']);
  });
});

describe('dispatch order', () => {
  it('milestone ascending, then priority ascending, then id — all three from frontmatter', () => {
    // KILLED BY: dropping any rung. Each of the four cards below differs
    // from its neighbour on exactly one, so a mutant that ignores
    // milestone, or priority, or the id tie-break, reorders the list.
    const model = parseProjectFromFiles([
      ROADMAP,
      card('T-004', 'D', { milestone: 5, priority: 1 }),
      card('T-003', 'C', { milestone: 4, priority: 9 }),
      card('T-002', 'B', { milestone: 4, priority: 2 }),
      card('T-001', 'A', { milestone: 4, priority: 2 }),
    ]);
    expect(readDispatchOrder(model, []).startable.map((r) => r.id)).toEqual([
      'T-001',
      'T-002',
      'T-003',
      'T-004',
    ]);
  });

  it('a caller with its own order overrides it, so the board can pass the board’s', () => {
    // KILLED BY: ignoring `options.order`. The BOARD's order is richer —
    // milestone-1-first WITHIN a feature column, per `selectBoard` — and
    // it lives in `app/src/lib/board-model.ts` (C-08 `app-board`), which
    // is OUTSIDE this card's fence and therefore could not move with the
    // schedule. This parameter is what keeps that a routed unification
    // (`T-111-s5` option a) rather than a permanent second order.
    const model = parseProjectFromFiles([
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1 }),
      card('T-002', 'B', { milestone: 4, priority: 2 }),
    ]);
    const order = readDispatchOrder(model, [], { order: ['T-002', 'T-001'] });
    expect(order.startable.map((r) => r.id)).toEqual(['T-002', 'T-001']);
  });
});

describe('ADAPTATION IS BY CONSTRUCTION, NOT A FEATURE', () => {
  it('a fixture that gains a card changes the output with nothing else edited', () => {
    // KILLED BY: caching anything — a memo on the model, a module-level
    // index, a stored answer. Every figure is derived at call time from
    // the cards and the lane list, so there is no bookkeeping step to
    // forget and no remembered answer to go stale. THIS BODY IS THE
    // PROPERTY ITSELF, pinned rather than asserted in prose.
    const base = [
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1 }),
      card('T-002', 'B', { status: 'building', milestone: 4, priority: 2 }),
    ];
    const before = readDispatchOrder(parseProjectFromFiles(base), [lane('T-002')]);
    expect(before.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(before.schedule.total).toBe(2);

    const after = readDispatchOrder(
      parseProjectFromFiles([...base, card('T-003', 'C', { milestone: 4, priority: 0 })]),
      [lane('T-002')],
    );
    expect(after.startable.map((r) => r.id)).toEqual(['T-003', 'T-001']);
    expect(after.schedule.total).toBe(3);
  });
});

describe('a lane whose id names no card RULES on every card, and is never merely reported', () => {
  const board = [ROADMAP, card('T-001', 'A', { touches: ['docs/CONVENTIONS.md'] })];

  it('because a fence that cannot be computed is not a fence that is free', () => {
    // KILLED BY: `if (other === undefined) continue` in
    // `readDispatchOrder` — dropping such a lane from the comparison, so
    // the card falls through the `holds.length === 0` branch and comes
    // back `startable` with the sentence "disjoint from every live lane"
    // having never been compared against it. THAT MUTANT IS WHAT THIS
    // MODULE SHIPPED UNTIL `62a4364`, and it is the ordinary case rather
    // than an exotic one: the lane list is machine-wide and the board is
    // per-checkout, so the two disagree the moment a lane is newer than
    // the tree reading it. Measured live at that ref with `T-141` up: 15
    // of 23 `startable` answers provably overlapped a live lane.
    //
    // THE TITLE OF THIS BODY NAMES THE RULING AND THE BODY USED TO ASSERT
    // ONLY `lanesWithNoCard` — the REPORTING CHANNEL. The verifier's
    // producer arm (a card-less lane yields an `unusable` hold) left 516
    // bodies green and killed nothing. The ruling is asserted FIRST here,
    // and the channel last, in that order on purpose.
    const order = readDispatchOrder(parseProjectFromFiles(board), [lane('T-777')]);
    expect(order.startable.map((r) => r.id)).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    const ruled = order.unfenceable[0];
    expect(ruled?.state).toBe('unfenceable');
    expect(ruled?.holds.map((h) => h.verdict)).toEqual(['unusable']);
    expect(ruled?.holds.map((h) => h.cardMissing)).toEqual([true]);
    expect(ruled?.reason).toContain('refs/heads/task/T-777-lane');
    expect(ruled?.reason).toContain('this checkout has NO CARD for');
    expect(ruled?.reason).toContain('nothing can be ruled disjoint from it');
    expect(ruled?.reason).not.toContain('disjoint from every live lane');
    expect(order.lanesWithNoCard).toEqual(['T-777']);
    expect(order.lanes.map((l) => l.taskId)).toEqual(['T-777']);
  });

  it('THE POSITIVE CONTROL: the same lane, its card present and disjoint, IS startable', () => {
    // Without this, "nothing is ever startable beside a lane" would pass
    // the body above just as well. The two boards differ in EXACTLY ONE
    // FILE — the lane's own card — and the lane list is character
    // identical, so what moves the answer is the card's presence and
    // nothing else.
    const withCard = parseProjectFromFiles([
      ...board,
      card('T-777', 'Holder', { status: 'building', touches: ['method/'] }),
    ]);
    const order = readDispatchOrder(withCard, [lane('T-777')]);
    expect(order.lanesWithNoCard).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual([]);
    expect(order.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(order.startable[0]?.reason).toContain('disjoint from every live lane');
  });

  it('a PROVED overlap still outranks it — the lattice is `fence.ts`\'s and is not re-ordered here', () => {
    // KILLED BY: letting a card-less lane force `unfenceable` over a
    // proved collision. `compareFences`'s own doc rules it: "A proved
    // overlap outranks an unusable token, because an unresolved token can
    // only add reserved paths and never remove one." T-001 is provably
    // held by T-002 AND uncomparable against T-777; the honest word is
    // the one that names a path a human can go and look at — and the
    // unreadable lane is still SAID, so an override is made knowing the
    // named overlap may not be the only one.
    const model = parseProjectFromFiles([
      ...board,
      card('T-002', 'Holder', { status: 'building', touches: ['docs/CONVENTIONS.md'] }),
    ]);
    const order = readDispatchOrder(model, [lane('T-002'), lane('T-777')]);
    expect(order.unfenceable.map((r) => r.id)).toEqual([]);
    expect(order.fenced.map((r) => r.id)).toEqual(['T-001']);
    expect(order.fenced[0]?.holds.map((h) => h.lane.taskId)).toEqual(['T-002', 'T-777']);
    expect(order.fenced[0]?.reason).toContain('docs/CONVENTIONS.md');
    expect(order.fenced[0]?.reason).toContain('could not be compared at all');
    // AND THE SINGULAR HALF OF THE RESIDUAL, pinned here so that the
    // plural body below has something to be the other side OF. Before
    // T-143 this clause was `no card for it` unconditionally and the
    // mutation to `no card for them` killed ZERO bodies — the whole
    // sentence was pinned by its PRESENCE and by neither of its numbers.
    expect(order.fenced[0]?.reason).toContain('no card for it in this checkout');
    expect(order.fenced[0]?.reason).not.toContain('no cards for them');
  });

  it('and with TWO unreadable lanes the same residual is PLURAL — the fenced branch, not only the unfenceable one', () => {
    // KILLED BY: the clause this repository shipped until T-143 —
    // `no card for it in this checkout`, with no `many` flag, in the
    // `fenced` branch. Its sibling `unfenceable` branch was written in
    // the SAME commit WITH the flag and with two dedicated bodies
    // pinning both directions, so the mutation from "it" to "them"
    // killed nothing here while being caught instantly ten lines away.
    //
    // WHY THIS SENTENCE AND NOT ANOTHER: it is the one a human reads
    // while deciding whether to OVERRIDE a coarse-fence warning, which
    // is the moment the count of what could not be read is the whole
    // question. Two blind lanes reading as one is an understatement of
    // the unknown in the one direction a fence exists to prevent.
    //
    // THE COUNT IS THE LANE COUNT, NOT THE ID COUNT — the two blind
    // lanes below carry two DIFFERENT ids, and the sibling body above
    // ('deduped by task id') is the case where one id is two lanes.
    const model = parseProjectFromFiles([
      ...board,
      card('T-002', 'Holder', { status: 'building', touches: ['docs/CONVENTIONS.md'] }),
    ]);
    const order = readDispatchOrder(model, [lane('T-002'), lane('T-777'), lane('T-888')]);
    expect(order.fenced.map((r) => r.id)).toEqual(['T-001']);
    const reason = order.fenced[0]?.reason ?? '';
    // The PROVED overlap still leads — the lattice is unchanged.
    expect(reason).toContain('docs/CONVENTIONS.md');
    // Both unreadable lanes are NAMED, and the clause agrees with them.
    expect(reason).toContain('refs/heads/task/T-777-lane');
    expect(reason).toContain('refs/heads/task/T-888-lane');
    expect(reason).toContain('no cards for them in this checkout');
    expect(reason).not.toContain('no card for it');
    expect(order.lanesWithNoCard).toEqual(['T-777', 'T-888']);
  });

  it('and the REPORTED list is deduped by task id, because two worktrees can hold one branch', () => {
    // KILLED BY: mapping the lane list straight through. Measured on this
    // repository at the verdict's ref: `lanesWithNoCard` came back
    // ['T-141','T-141'] and the report printed the same sentence twice,
    // because two worktrees sat on that one branch.
    // THIS BODY IS ABOUT THE CHANNEL AND SAYS SO — the second assertion
    // is the reason that is honest: the HOLDS are NOT deduped, because
    // both worktrees are real and a reason that named one would be
    // naming half of what is live.
    const order = readDispatchOrder(parseProjectFromFiles(board), [
      { ...lane('T-777'), worktree: '/w/a' },
      { ...lane('T-777'), worktree: '/w/b' },
    ]);
    expect(order.lanesWithNoCard).toEqual(['T-777']);
    expect(order.all.find((r) => r.id === 'T-001')?.holds.map((h) => h.lane.worktree)).toEqual([
      '/w/a',
      '/w/b',
    ]);
    // AND THE SENTENCE AGREES IN NUMBER WITH THE LANES, NOT THE IDS.
    // KILLED BY: counting unique task ids, or hard-coding either form.
    // Two worktrees on one branch are TWO live writers, and a reason a
    // human is meant to argue with cannot say "that fence" about two of
    // them. Three lanes went live on this machine while this sentence
    // was being written and produced "T-141, T-145 has no card … from
    // it"; the singular half is pinned by the first body above.
    expect(order.all.find((r) => r.id === 'T-001')?.reason).toContain('those fences');
    expect(order.all.find((r) => r.id === 'T-001')?.reason).toContain(
      'nothing can be ruled disjoint from them',
    );
  });
});
