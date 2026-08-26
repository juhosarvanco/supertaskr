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

describe('a lane whose id names no card is REPORTED, never dropped', () => {
  it('because a fence that cannot be computed is not a fence that is free', () => {
    // KILLED BY: filtering such lanes out silently. A lapsed or unstamped
    // dispatch is the shape `lane-protocol.md` rule 7 rules the WORKTREE
    // authoritative over the board's `status:` for, and silence there is
    // how a collision gets through.
    const model = parseProjectFromFiles([ROADMAP, card('T-001', 'A')]);
    const order = readDispatchOrder(model, [lane('T-777')]);
    expect(order.lanesWithNoCard).toEqual(['T-777']);
    expect(order.lanes.map((l) => l.taskId)).toEqual(['T-777']);
  });
});
