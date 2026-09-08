import { describe, expect, it } from 'vitest';
import { parseProjectFromFiles } from '../src/files.js';
import {
  BODY_DEMANDING,
  bodyBearing,
  bodyDemandOf,
  criteriaDemandingABody,
  fenceHoldsABody,
  readDispatchOrder,
  witnessComponents,
} from '../src/lanes.js';
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
  /** Lines dropped under `## Acceptance criteria` (T-228-s1). */
  criteria?: string[];
}

/**
 * A fixture card. **IT DECLARES ITS OWN DISJOINT FENCE UNLESS IT ASKS NOT
 * TO**, and that default is load-bearing rather than tidy since T-219:
 * a card with an EMPTY `touches:` declares no fence at all, and
 * `readDispatchOrder` refuses such a card whatever the lane list says. A
 * fixture that left the field empty by accident would land in
 * `unfenceable` for a reason having nothing to do with ordering,
 * `underway` or caching — which is exactly how three bodies here reddened
 * when that refusal was completed.
 *
 * THE OPT-OUT IS EXPLICIT AND IS THE POINT: passing `touches: []` is a
 * DECLARATION that this fixture is the undeclared-fence case, and the two
 * bodies that need it say so in one visible token instead of relying on
 * the absence of an argument. The domain is a `fixture/` namespace no
 * component claims, so two fixture cards are disjoint by construction and
 * never by a coincidence of the registry.
 */
function card(id: string, title: string, fm: Frontmatter = {}): { path: string; content: string } {
  const touches = 'touches' in fm ? (fm.touches ?? []) : [`fixture/${id}`];
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
      `touches: [${touches.join(', ')}]`,
      '---',
      '',
      'Body.',
      ...(fm.criteria === undefined ? [] : ['', '## Acceptance criteria', '', ...fm.criteria]),
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
    // EACH FIXTURE CARD DECLARES ITS OWN DISJOINT FENCE, and that is
    // load-bearing rather than decoration since T-219: a card with an
    // EMPTY `touches:` declares no fence at all, `compareFences` refuses
    // to call a token-less fence disjoint, and these cards would land in
    // `unfenceable` for a reason with nothing to do with caching.
    const base = [
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1, touches: ['app/src/one.ts'] }),
      card('T-002', 'B', {
        status: 'building',
        milestone: 4,
        priority: 2,
        touches: ['app/src/two.ts'],
      }),
    ];
    const before = readDispatchOrder(parseProjectFromFiles(base), [lane('T-002')]);
    expect(before.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(before.schedule.total).toBe(2);

    const after = readDispatchOrder(
      parseProjectFromFiles([
        ...base,
        card('T-003', 'C', { milestone: 4, priority: 0, touches: ['app/src/three.ts'] }),
      ]),
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

describe('T-219/T-227 — a card that declares NO fence is not a card whose fence is free', () => {
  it('lands in `unfenceable` beside a live lane, with a sentence naming the card as the cause', () => {
    // KILLED BY: `compareFences` walking `a.tokens × b.tokens` and
    // falling through to `disjoint` on a token-less side, which is what
    // this module shipped until T-219 absorbed T-227. The consequence
    // reached here rather than at the parser: such a card came back
    // `startable`, wearing the sentence "it reserves nothing, disjoint
    // from every live lane" — a fence that permits NOTHING advertised as
    // a fence that collides with nothing.
    const board = [
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1, touches: [] }),
      card('T-002', 'Holder', { status: 'building', touches: ['lib/parser'] }),
    ];
    const order = readDispatchOrder(parseProjectFromFiles(board), [lane('T-002')]);

    expect(order.startable.map((r) => r.id), 'an undeclared fence got a green light').toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    const reason = order.unfenceable[0]?.reason ?? '';
    expect(reason).toContain('declares no `touches:` at all');
    expect(reason).toContain('an undeclared fence is not an empty one');
    // AND THE SENTENCE IS NOT LEFT WITH AN EMPTY MIDDLE. The other two
    // causes cannot speak for this card — there is no token to be
    // unresolved and the holder's card IS in this checkout — so without
    // the third clause the reason reads "…ruled out: . A fence that…".
    expect(reason, 'the clause list came back empty').not.toContain(': . A fence');

    // THE CONTROL: the same board with the same holder, and the card
    // declaring a disjoint fence, is startable. Without it every
    // assertion above is satisfied by a module that refuses everything.
    const declared = [
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1, touches: ['app/src/main.tsx'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['lib/parser'] }),
    ];
    const ok = readDispatchOrder(parseProjectFromFiles(declared), [lane('T-002')]);
    expect(ok.startable.map((r) => r.id)).toEqual(['T-001']);
  });

  it('and it is refused with NO LANE LIVE, which is the moment dispatch actually asks', () => {
    // V-T-219's rejection, pinned. The body above hands in `[lane('T-002')]`
    // and therefore CANNOT see this: `rule()` reaches `compareFences` only
    // through `holds`, and `holds` is empty when the lane list is — so the
    // refusal was armed exactly when the card would have been held anyway
    // and disarmed when nothing was live. That is backwards, because
    // DISPATCH HAPPENS WHEN LANES ARE FREE: `brief.mjs --dispatch` is what
    // this project asks for "what can START", it is this function, and the
    // zero-lane board is its canonical input rather than an exotic one.
    //
    // KILLED BY: dropping `&& fence.tokens.length > 0` from the
    // `holds.length === 0` guard in `rule()` — which is what this module
    // shipped at `1bfe8f1`, where the card came back `startable` wearing
    // the sentence the body above names as the defect.
    const board = [ROADMAP, card('T-001', 'A', { milestone: 4, priority: 1, touches: [] })];
    const order = readDispatchOrder(parseProjectFromFiles(board), []);

    expect(order.lanes, 'the fixture handed in a lane and cannot see this').toEqual([]);
    expect(
      order.startable.map((r) => r.id),
      'an undeclared fence got a green light at the dispatch moment',
    ).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    const reason = order.unfenceable[0]?.reason ?? '';
    expect(reason).toContain('declares no `touches:` at all');
    // AND THE SENTENCE IT NO LONGER WEARS, asserted by name: this is the
    // exact string the absorbed T-227 criterion forbids, and a regression
    // here would restore it verbatim rather than paraphrase it.
    expect(reason, 'the refused sentence came back').not.toContain('disjoint from every live lane');

    // THE CONTROL, on the SAME zero-lane board: a card that DECLARES a
    // fence is still startable. Without it every assertion above is
    // satisfied by a module that refuses every card once the lane list is
    // empty — which would break dispatch in the opposite direction and
    // look just as green.
    const declared = [ROADMAP, card('T-001', 'A', { milestone: 4, priority: 1, touches: ['lib/parser'] })];
    const ok = readDispatchOrder(parseProjectFromFiles(declared), []);
    expect(ok.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(ok.startable[0]?.reason).toContain('disjoint from every live lane');
  });
});

describe('T-219-s4 — a fence that cannot be RESOLVED is not a fence that is free either', () => {
  it('an UNRESOLVABLE token is refused with NO LANE LIVE, which is the moment dispatch asks', () => {
    // THE RESIDUAL OF V-T-219'S OWN FINDING, ONE CRITERION OVER. That
    // verdict's sentence — "`rule()` reaches `compareFences` only through
    // `holds`, and `holds` is empty when the lane list is" — is true of a
    // fence whose tokens cannot be RESOLVED exactly as it was of a fence
    // with no tokens at all. The body above closed the second half; this
    // is the first. `compareFences` answers `unusable` for such a fence
    // the moment any lane is live and `buildLaneFence` refuses to arm it
    // outright, so with nothing live this site was the one place in the
    // pipeline that called it FREE.
    //
    // KILLED BY: dropping `&& fence.unusable.length === 0` from the
    // `holds.length === 0` guard in `rule()` — which is what this module
    // shipped at `24bfec8e`, where the card came back `startable` wearing
    // "its fence is nowhere, disjoint from every live lane".
    const board = [ROADMAP, card('T-001', 'A', { milestone: 4, priority: 1, touches: ['nowhere'] })];
    const order = readDispatchOrder(parseProjectFromFiles(board), []);

    expect(order.lanes, 'a lane was handed in and this body cannot see the defect').toEqual([]);
    expect(
      order.startable.map((r) => r.id),
      'an unresolvable fence got a green light at the dispatch moment',
    ).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);

    const reason = order.unfenceable[0]?.reason ?? '';
    // THE REASON SAYS WHICH TOKEN, not merely that something was wrong —
    // the card's own criterion, and the difference between a sentence a
    // human can argue with and a state code.
    expect(reason).toContain('nowhere');
    expect(reason).toContain("T-001's own `touches:` carries");
    expect(reason).toContain('A fence that cannot be COMPUTED is not a fence that is free.');
    // AND THE SENTENCE IT NO LONGER WEARS, asserted by name.
    expect(reason, 'the refused sentence came back').not.toContain('disjoint from every live lane');
    // NOT THE WRONG CLAUSE EITHER: this card DECLARES a fence, so the
    // absorbed T-227 clause must not speak for it, and the sentence must
    // not arrive with an empty middle.
    expect(reason).not.toContain('declares no `touches:` at all');
    expect(reason, 'the clause list came back empty').not.toContain(': . A fence');

    // THE CONTROL, on the SAME zero-lane board: a card whose tokens all
    // RESOLVE is still startable. Without it every assertion above is
    // satisfied by a module that refuses every card once the lane list is
    // empty — which breaks dispatch in the opposite direction and looks
    // just as green.
    const declared = [
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1, touches: ['lib/parser'] }),
    ];
    const ok = readDispatchOrder(parseProjectFromFiles(declared), []);
    expect(ok.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(ok.startable[0]?.reason).toContain('disjoint from every live lane');

    // AND THE SECOND CONTROL, which pins the refusal to RESOLVABILITY and
    // not to the word: the same board, the same token, plus an oracle
    // that CARRIES it — and the card is startable again.
    const resolved = readDispatchOrder(parseProjectFromFiles(board), [], {
      knownPaths: ['nowhere'],
    });
    expect(resolved.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(resolved.unfenceable.map((r) => r.id)).toEqual([]);

    // AND THE DEFECT IS REAL AT THE SURFACE THAT DISPATCHES, which is
    // the half the card's TRIAGE was amended to require. `brief.mjs
    // --dispatch` never calls this function bare: it supplies
    // `knownPathOracle`, every tracked path plus every ancestor prefix.
    // An oracle settles a bare word it CARRIES and says nothing about
    // one it does not, so a planted token no repository contains is
    // unresolvable with the oracle supplied exactly as it is without —
    // and the zero-lane board is still where it got a green light.
    const oracled = readDispatchOrder(parseProjectFromFiles(board), [], {
      knownPaths: ['lib/parser', 'lib/parser/src/lanes.ts', 'docs', 'app'],
    });
    expect(
      oracled.startable.map((r) => r.id),
      'the oracle was read as a licence for the tokens it does NOT carry',
    ).toEqual([]);
    expect(oracled.unfenceable.map((r) => r.id)).toEqual(['T-001']);

    // …AND THE ASYMMETRY THAT MADE IT V-T-219'S SHAPE: with one real
    // lane live, the SAME board and the SAME oracle already answered
    // `unfenceable` before this card. The refusal was armed exactly when
    // the card would have been held anyway and disarmed when nothing was
    // live, which is the canonical dispatch moment.
    const held = [
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1, touches: ['nowhere'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['lib/parser'] }),
    ];
    const live = readDispatchOrder(parseProjectFromFiles(held), [lane('T-002')], {
      knownPaths: ['lib/parser', 'lib/parser/src/lanes.ts', 'docs', 'app'],
    });
    expect(live.unfenceable.map((r) => r.id)).toEqual(['T-001']);
  });

  it('names the card that owns each unresolved token, and never the same token twice', () => {
    // THE CLAUSE LIST GAINED A CAUSE, and the cause it gained is the only
    // one that needs no lane. Before T-219-s4 every clause was keyed on a
    // HOLD, so with the lane list empty the sentence had nothing to say
    // about the card's own token; and with a lane live, `compareFences`
    // returns the UNION of both sides' `unusable`, so one token bought
    // two clauses pointing at two different cards to repair.
    //
    // KILLED BY: dropping the `own` clause (the first expectation), or
    // dropping the `.filter((t) => !own.includes(t))` subtraction (the
    // one after it, where the card's own token is re-attributed to the
    // lane it was merely compared against).
    const board = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: ['nowhere'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['elsewhere'] }),
    ];
    const order = readDispatchOrder(parseProjectFromFiles(board), [lane('T-002')]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    const reason = order.unfenceable[0]?.reason ?? '';

    expect(reason).toContain("T-001's own `touches:` carries nowhere");
    expect(reason).toContain('T-002 (refs/heads/task/T-002-lane at /w/T-002)');
    expect(reason).toContain('elsewhere resolved to neither a slug nor a path');
    // THE SUBTRACTION: the card's own token is attributed to the card and
    // NOT a second time to the lane that merely met it.
    expect(reason).not.toContain('elsewhere, nowhere resolved');

    // AND THE OTHER SIDE OF THE SAME RULE: when the ONLY uncomparable
    // token is the card's own, the hold clause disappears entirely rather
    // than naming the lane for somebody else's defect.
    const oneSided = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: ['nowhere'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['lib/parser'] }),
    ];
    const only = readDispatchOrder(parseProjectFromFiles(oneSided), [lane('T-002')]);
    const solo = only.unfenceable[0]?.reason ?? '';
    expect(only.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    expect(solo).toContain("T-001's own `touches:` carries nowhere");
    expect(solo, "the lane was blamed for the card's own token").not.toContain(
      'nowhere resolved to neither',
    );
  });

  it('T-219-s2 — a BARE DOT is unresolvable at the expansion, and unstartable here', () => {
    // THE TWO HALVES MEETING. `expandFence` refuses `.` (fence.test.ts
    // carries that half with its live census); this body is the
    // consequence at the dispatch site, and it is the pair the card asks
    // for: the refusal has to reach the ANSWER, not only the issue list.
    //
    // KILLED BY: either half — removing the `DOT_DOMAIN` branch from
    // `expandFence` (the token classifies `path`, reserves '.', and the
    // guard sees an empty `unusable`), or removing the `unusable` term
    // from the `rule()` guard (the token is refused and the card is
    // startable anyway).
    const board = [ROADMAP, card('T-001', 'A', { milestone: 4, priority: 1, touches: ['.'] })];
    const order = readDispatchOrder(parseProjectFromFiles(board), []);
    expect(order.startable.map((r) => r.id)).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    expect(order.unfenceable[0]?.fence.paths, 'the dot still reserves a domain').toEqual([]);
    expect(order.unfenceable[0]?.reason).toContain("T-001's own `touches:` carries .");

    // THE CONTROL: `./lib/parser` is the SAME leading character, which
    // normalisation strips — so it resolves, and the refusal is about the
    // repository ROOT rather than about the character.
    const dotted = [
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1, touches: ['./lib/parser'] }),
    ];
    const ok = readDispatchOrder(parseProjectFromFiles(dotted), []);
    expect(ok.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(ok.startable[0]?.fence.paths).toEqual(['lib/parser']);
  });

  it('T-219-s6 — an INTERIOR dot segment resolves, so the card is startable on the real directory and COLLIDES with a lane holding it', () => {
    // THE TWO HALVES MEETING, one position over from the body above.
    // `fence.test.ts` carries the normalisation half; this is the
    // consequence at the dispatch site, and it is the one that matters:
    // before this card `lib/./parser` reserved a domain no
    // repository-relative path can sit inside, so the card came back
    // STARTABLE beside a lane holding `lib/parser` — two writers, one
    // tree, and no sentence anywhere saying so.
    //
    // KILLED BY: dropping step 7 from `normalizeFenceToken`, where the
    // second half of this body answers `startable` and the fenced list
    // comes back empty.
    const board = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: ['lib/./parser'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['lib/parser/src/fence.ts'] }),
    ];
    const order = readDispatchOrder(parseProjectFromFiles(board), [lane('T-002')]);
    expect(order.startable.map((r) => r.id), 'a badly spelled fence got a green light').toEqual([]);
    expect(order.fenced.map((r) => r.id)).toEqual(['T-001']);
    const reason = order.fenced[0]?.reason ?? '';
    expect(reason).toContain('T-002 (refs/heads/task/T-002-lane at /w/T-002)');
    expect(reason).toContain('lib/parser/src/fence.ts');
    expect(order.fenced[0]?.holds[0]?.verdict).toBe('overlapping');

    // THE CONTROL: the SAME board with the holder somewhere else, where
    // the resolved fence is startable and reserves the REAL directory —
    // without it every assertion above is satisfied by a module that
    // refuses `lib/./parser` outright, which is the remedy this card
    // exists to reject.
    const free = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: ['lib/./parser'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['app/src/main.tsx'] }),
    ];
    const ok = readDispatchOrder(parseProjectFromFiles(free), [lane('T-002')]);
    expect(ok.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(ok.startable[0]?.fence.paths, 'the resolved fence lost its domain').toEqual([
      'lib/parser',
    ]);
    expect(ok.startable[0]?.reason).toContain('disjoint from every live lane');
  });
});

describe('T-219-s6 triage — the two readers of one fence say the same thing', () => {
  it('a fence that ARMS NOTHING is not startable, and the sentence says which domains were carved out', () => {
    // `V-T-219-s4` observed this at both refs and did not file it; the
    // card's TRIAGE routed it here. A card whose ONLY token is its own
    // file has `tokens.length > 0` (it spoke), an empty `unusable` (the
    // token resolved) and `paths: []` (its own file is never part of its
    // own fence) — so every term of the `startable` guard passed and the
    // card was cleared to start while `buildLaneFence` refused to arm it:
    // *"expands to no path at all, so every write in the lane would be
    // refused"*. Two readers of one fence, and the one that says a
    // session MAY START said yes.
    //
    // KILLED BY: dropping `&& fence.paths.length > 0` from the
    // `holds.length === 0` guard in `rule()`, where this card comes back
    // `startable` wearing "it reserves nothing, disjoint from every live
    // lane" — a fence that permits NOTHING advertised as a fence that
    // collides with nothing.
    const own = 'docs/tasks/T-001-subject.md';
    const board = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: [own] }),
    ];
    const order = readDispatchOrder(parseProjectFromFiles(board), []);

    expect(order.lanes, 'a lane was handed in and this body cannot see the defect').toEqual([]);
    expect(
      order.startable.map((r) => r.id),
      'a fence that arms nothing got a green light at the dispatch moment',
    ).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    expect(order.unfenceable[0]?.fence.paths, 'the fence reserved something after all').toEqual([]);
    expect(order.unfenceable[0]?.fence.excluded).toEqual([own]);

    const reason = order.unfenceable[0]?.reason ?? '';
    expect(reason).toContain('reserves no path at all');
    expect(reason).toContain(own);
    expect(reason).toContain("a card's own file is never part of its own fence");
    // NOT THE WRONG CLAUSE: this card DECLARED a `touches:`, so T-227's
    // clause must not speak for it — the two causes are near twins with
    // different remedies and the sentence has to tell them apart.
    expect(reason).not.toContain('declares no `touches:` at all');
    // AND THE SENTENCE IT NO LONGER WEARS, asserted by name.
    expect(reason, 'the refused sentence came back').not.toContain('disjoint from every live lane');
    expect(reason, 'the clause list came back empty').not.toContain(': . A fence');

    // THE CONTROL: the same card naming its own file AND one real path is
    // startable, so this is a rule about what the fence RESERVES and not
    // about a card mentioning itself.
    const alsoReal = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: [own, 'lib/parser'] }),
    ];
    const ok = readDispatchOrder(parseProjectFromFiles(alsoReal), []);
    expect(ok.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(ok.startable[0]?.fence.paths).toEqual(['lib/parser']);
  });

  it('a lane whose CARD declares no `touches:` is named in the sentence, instead of leaving an empty middle', () => {
    // THE OTHER HALF OF THE TRIAGE, and it is `T-219`'s own guarded
    // string reached from the other side. The SUBJECT's fence fully
    // resolves; the HOLDER's card is present in this checkout and
    // declares no fence, so `compareFences` answers `unusable` with an
    // empty `unusable` list — there is no token to name. Every clause was
    // keyed on a token, on a missing card or on the subject's own fence,
    // so none fired and the reason read "…none could be ruled out: . A
    // fence that cannot be COMPUTED…".
    //
    // KILLED BY: dropping the `silent` clause from `rule()`, where the
    // last expectation below finds the empty middle verbatim.
    const board = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: ['lib/parser'] }),
      card('T-002', 'Holder', { status: 'building', touches: [] }),
    ];
    const order = readDispatchOrder(parseProjectFromFiles(board), [lane('T-002')]);

    expect(order.startable.map((r) => r.id)).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    const reason = order.unfenceable[0]?.reason ?? '';
    expect(reason, 'the clause list came back empty').not.toContain(': . A fence');
    // IT NAMES THE HOLDING CARD, because that is the card a dispatcher
    // repairs — the subject can do nothing to make this comparison
    // answer.
    expect(reason).toContain('T-002 (refs/heads/task/T-002-lane at /w/T-002)');
    expect(reason).toContain('declares no `touches:` at all');
    expect(reason).toContain('the remedy is on that card, not on this one');
    // AND NOT THE SUBJECT'S OWN CLAUSE: the subject declared a fence and
    // every token of it resolved.
    expect(reason).not.toContain("T-001's own `touches:` carries");
    expect(reason).not.toContain('reserves no path at all');

    // THE CONTROL: the same board with the holder DECLARING a disjoint
    // fence is startable — so the clause above is about the holder's
    // silence and not about there being a lane at all.
    const declared = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: ['lib/parser'] }),
      card('T-002', 'Holder', { status: 'building', touches: ['app/src/main.tsx'] }),
    ];
    const ok = readDispatchOrder(parseProjectFromFiles(declared), [lane('T-002')]);
    expect(ok.startable.map((r) => r.id)).toEqual(['T-001']);
  });

  it('and with TWO silent lanes the clause is PLURAL, and it does not speak for a lane whose card is MISSING', () => {
    // NUMBER AGREEMENT IS NOT DECORATION HERE — the rule the `missing`
    // clause beside it already states. And the two lane-side causes stay
    // apart: a card that is ABSENT is fetched, a card that is PRESENT and
    // silent is repaired, and one clause covering both would name the
    // wrong remedy for one of them.
    const board = [
      ROADMAP,
      card('T-001', 'Subject', { milestone: 4, priority: 1, touches: ['lib/parser'] }),
      card('T-002', 'Holder', { status: 'building', touches: [] }),
      card('T-003', 'Holder', { status: 'building', touches: [] }),
    ];
    const order = readDispatchOrder(parseProjectFromFiles(board), [
      lane('T-002'),
      lane('T-003'),
      lane('T-004'),
    ]);
    const reason = order.unfenceable[0]?.reason ?? '';
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    expect(reason).toContain('declare no `touches:` at all');
    expect(reason).toContain('those fences could not be compared');
    expect(reason).toContain('the remedy is on those cards, not on this one');
    // THE MISSING-CARD CLAUSE IS STILL ITS OWN, naming T-004 and nobody
    // else — the control that the new clause did not swallow it.
    expect(reason).toContain('this checkout has NO CARD for T-004');
    expect(reason).not.toContain('NO CARD for T-002');
  });
});

describe('T-228-s1 — A CRITERION DEMANDING A TEST BODY, OVER A FENCE THAT CANNOT HOLD ONE', () => {
  /**
   * T-228 was stamped and armed with `touches: [.claude]` over criteria
   * demanding a body. No test file lives under `.claude`; the dispatch
   * derivation, the arming arm and the brief all passed the card, the
   * executor routed the criterion OUT because the fence refused it, and a
   * blind verifier's phase-1 ground truth named the contradiction an arc
   * later. Every fixture below is that card, planted.
   */
  const BODY = '- A body SHALL prove it was startable with a fence holding no test file.';
  const DOCUMENTARY = '- The rule SHALL be written into the conventions as one bullet.';
  /** The fence's own tracked file — real, and not a body. */
  const NOTES = 'fixture/T-001/notes.md';
  /** The one mutation that clears the refusal. */
  const SPEC = 'fixture/T-001/thing.spec.ts';
  const oracle = (...paths: string[]) => ({ knownPaths: ['fixture', 'fixture/T-001', ...paths] });

  it('the card is UNFENCEABLE, and its own criterion and fence are in the sentence', () => {
    // KILLED BY: dropping the `unbodied.length === 0` term from the
    // `startable` guard (the card is startable and the view says so), or
    // dropping the clause from the `unfenceable` branch (the state is
    // right and the sentence has an empty middle).
    const board = [ROADMAP, card('T-001', 'A', { milestone: 4, priority: 1, criteria: [BODY] })];
    const order = readDispatchOrder(parseProjectFromFiles(board), [], oracle(NOTES));
    expect(order.startable.map((r) => r.id)).toEqual([]);
    expect(order.unfenceable.map((r) => r.id)).toEqual(['T-001']);
    const ruled = order.unfenceable[0];
    expect(ruled?.reason).toContain('demand a TEST BODY');
    expect(ruled?.reason, 'the criterion is not in the sentence').toContain(
      'A body SHALL prove it was startable with a fence holding no test file.',
    );
    expect(ruled?.reason, 'the fence is not in the sentence').toContain('fixture/T-001');
    expect(ruled?.reason).toContain('holds no path any suite collects');
    // THE READING IS CARRIED, so the preflight can refuse on exactly this
    // and not on a second spelling of it.
    expect(ruled?.unbodied.map((d) => d.phrase)).toEqual(['a body SHALL']);
    expect(ruled?.unbodied[0]?.text, 'the subject kept its list marker').toBe(BODY.slice(2));
    expect(ruled?.bodyBearer, 'a fence with no body named a bearer').toBeUndefined();
  });

  it('ONE spec file in the fence clears it, and the bearer names the suite', () => {
    const board = [ROADMAP, card('T-001', 'A', { milestone: 4, priority: 1, criteria: [BODY] })];
    const order = readDispatchOrder(parseProjectFromFiles(board), [], oracle(NOTES, SPEC));
    expect(order.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(order.startable[0]?.unbodied).toEqual([]);
    expect(order.startable[0]?.bodyBearer?.rel).toBe(SPEC);
    expect(order.startable[0]?.bodyBearer?.suite).toContain('spec');
  });

  it('a DOCUMENTARY criterion over the same fence stays startable — the negative control', () => {
    // Without this, "a body-demanding criterion is unfenceable" is
    // satisfied by a rule that refuses every card whose fence holds no
    // test file, which is most of this project's governing-document work.
    const board = [
      ROADMAP,
      card('T-001', 'A', { milestone: 4, priority: 1, criteria: [DOCUMENTARY] }),
    ];
    const order = readDispatchOrder(parseProjectFromFiles(board), [], oracle(NOTES));
    expect(order.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(order.startable[0]?.unbodied).toEqual([]);
  });

  it('WITHOUT a knownPaths oracle the term is DISARMED, and the card is startable', () => {
    // MEASURED, NOT CAUTIOUS. Without an oracle this module cannot see
    // that a directory fence already HOLDS a spec file — only that the
    // token is not itself spec-shaped — so every directory-fenced card
    // with a body-demanding criterion would be refused on a consumer with
    // no repository to look in. A false refusal is the one failure a
    // dispatch gate may not have, and the consumer that HAS a repository
    // is exactly the one that dispatches.
    const board = [ROADMAP, card('T-001', 'A', { milestone: 4, priority: 1, criteria: [BODY] })];
    const order = readDispatchOrder(parseProjectFromFiles(board), []);
    expect(order.startable.map((r) => r.id)).toEqual(['T-001']);
    expect(order.startable[0]?.unbodied).toEqual([]);
  });

  it('the phrases are four, and each narrowing carries the live line that forced it', () => {
    // THE TABLE IS PINNED AGAINST LITERALS and never read out of itself:
    // a body that looped `BODY_DEMANDING` to build its expectations
    // passes for any value the table holds, the empty one included.
    expect(BODY_DEMANDING.map((p) => p.name)).toEqual([
      'a body SHALL',
      'a test SHALL',
      'SHALL red',
      'positive control',
    ]);
    expect(bodyDemandOf('- A body SHALL prove it.')).toBe('a body SHALL');
    expect(bodyDemandOf('- Each new test SHALL red on the mutant.')).toBe('a test SHALL');
    expect(bodyDemandOf('- The mutant SHALL red exactly one body.')).toBe('SHALL red');
    expect(bodyDemandOf('- A positive control SHALL be demonstrated failing.')).toBe(
      'positive control',
    );

    // THE THREE NARROWINGS, EACH WITH THE LIVE LINE THAT FORCED IT. A
    // wide reading refuses cards that demand nothing, and a refusal on
    // the normal case is the gate nobody runs.
    expect(
      bodyDemandOf('- A lane adding a `tools/e2e` body SHALL NOT have to discover this.'),
      'the body word must be the head noun',
    ).toBe('');
    expect(bodyDemandOf('- a body shall prove it.'), 'SHALL is capitals').toBe('');
    expect(
      bodyDemandOf('- The sweep returns zero (positive control: the same needle over `docs/`).'),
      'a grep control demands no body',
    ).toBe('');
    expect(
      bodyDemandOf('- Cite the integrator role with its positive control attached.'),
      'a citation demands no body',
    ).toBe('');

    // THE SUITE VOCABULARY IS A REAL TREE'S AND NOT THE THREE SHAPES THE
    // founding card named: the method evals and any Rust source carry
    // bodies too, and refusing those cards is the failure this must not
    // have.
    expect(bodyBearing('tools/e2e/tests/card-preflight.spec.ts')).not.toBe('');
    expect(bodyBearing('lib/parser/test/fence.test.ts')).not.toBe('');
    expect(bodyBearing('app/src-tauri/src/agent/kit.rs')).not.toBe('');
    expect(bodyBearing('tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs')).not.toBe(
      '',
    );
    expect(bodyBearing('.claude/hooks/lane-fence.mjs')).toBe('');
    expect(bodyBearing('docs/CONVENTIONS.md')).toBe('');

    // A FENCE NAMING A BODY THAT DOES NOT EXIST YET IS A CARD ABOUT TO
    // WRITE ONE — the direction the known side cannot answer.
    expect(fenceHoldsABody(['tools/e2e/tests/not-yet.spec.ts'], [])?.rel).toBe(
      'tools/e2e/tests/not-yet.spec.ts',
    );
    expect(fenceHoldsABody(['.claude'], ['.claude/hooks/guard.mjs'])).toBeUndefined();
    expect(fenceHoldsABody(['tools/e2e'], ['tools/e2e/tests/a.spec.ts'])?.rel).toBe(
      'tools/e2e/tests/a.spec.ts',
    );
    expect(fenceHoldsABody(['tools/e2e'], undefined), 'no oracle is not a refusal').toBeUndefined();

    // AND BODY SCOPE IS NOT READ AT ALL: only the acceptance criteria
    // section is, so a card's prose quoting these phrases — this file
    // does — demands nothing.
    expect(criteriaDemandingABody(undefined)).toEqual([]);
    expect(criteriaDemandingABody(`${DOCUMENTARY}\n${BODY}`)).toEqual([
      { line: 2, phrase: 'a body SHALL', text: BODY.slice(2) },
    ]);
  });
});
