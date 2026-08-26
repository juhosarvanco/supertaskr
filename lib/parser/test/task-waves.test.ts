import { describe, expect, it } from 'vitest';
import { parseProjectFromFiles } from '../src/files.js';
import {
  readSchedule,
  readyNowText,
  selectTaskSchedule,
  worstBlockerText,
} from '../src/task-waves.js';
import type { TaskStatus } from '../src/types.js';

/**
 * WHAT T-137 ADDED TO THE MOVED ANALYSIS — and nothing else.
 *
 * The waves, the critical path, the holds, the tie-break ladders and the
 * elbow geometry were pinned by T-034 in `app/test/map-task-waves.test.ts`
 * (fifty bodies), and that file is OUTSIDE this card's fence — it is
 * `app/test/**`, C-05, held by a live lane. It is therefore the CONTROL
 * for the extraction rather than something to copy here: it imports the
 * same symbols through the app's re-export and must stay green untouched.
 * Re-asserting its fifty bodies here would be a second copy of a pin,
 * which is T-057 one layer down.
 *
 * So every body below is about a DELTA this card made:
 *   - the one app-local import, now PASSED IN;
 *   - `unmet`, which the pane never needed and a terminal owes its reader;
 *   - the additive-only rule that keeps the pane's `toEqual` bodies green;
 *   - the roadmap fields, SURFACED and not re-derived;
 *   - `layering`, exposed so a view lays out what it did not recompute.
 *
 * Each body names the PRODUCER mutant that kills it, per the drill.
 */

interface Frontmatter {
  status?: TaskStatus;
  blockedBy?: string[];
  feature?: string;
  milestone?: number;
  priority?: number;
  verdicts?: string;
}

function card(id: string, title: string, fm: Frontmatter = {}): { path: string; content: string } {
  const lines = [
    '---',
    `id: ${id}`,
    `title: ${title}`,
    `status: ${fm.status ?? 'planned'}`,
    ...(fm.feature === undefined ? [] : [`feature: ${fm.feature}`]),
    ...(fm.milestone === undefined ? [] : [`milestone: ${fm.milestone}`]),
    ...(fm.priority === undefined ? [] : [`priority: ${fm.priority}`]),
    `blocked_by: [${(fm.blockedBy ?? []).join(', ')}]`,
    '---',
    '',
    'Body.',
    ...(fm.verdicts === undefined ? [] : ['', '## Verdicts', '', fm.verdicts]),
  ];
  return { path: `docs/tasks/${id}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`, content: lines.join('\n') };
}

const ROADMAP = {
  path: 'docs/ROADMAP.md',
  content: ['# Roadmap', '', '## F-01 One', '', '## F-06 Six', ''].join('\n'),
};

describe('the one app-local import is now an INPUT', () => {
  it('rejectedCount defaults to zero — a pure function does not import a lens', () => {
    // KILLED BY: defaulting `rejectedCountOf` to anything but `() => 0`,
    // or re-introducing a reach for a verdict classifier inside the
    // parser. The pane's own suite cannot see this: it always supplies a
    // count.
    const model = parseProjectFromFiles([
      ROADMAP,
      card('T-001', 'Alpha', { verdicts: '2026-01-01 — v (verifier): REJECTED, twice over.' }),
    ]);
    const schedule = selectTaskSchedule(model);
    expect(schedule.cards.map((c) => c.rejectedCount)).toEqual([0]);
  });

  it('the count the pane used to reach for is now handed in, per TASK', () => {
    // KILLED BY: calling `rejectedCountOf` with anything but the task
    // record (e.g. the id, or the verdicts string), or ignoring the
    // option and hard-coding zero.
    const model = parseProjectFromFiles([
      ROADMAP,
      card('T-001', 'Alpha', { verdicts: 'REJECTED once' }),
      card('T-002', 'Beta'),
    ]);
    const seen: string[] = [];
    const schedule = selectTaskSchedule(model, {
      rejectedCountOf: (task) => {
        seen.push(task.id ?? '?');
        return task.sections.verdicts === undefined ? 0 : 7;
      },
    });
    expect(seen.sort()).toEqual(['T-001', 'T-002']);
    expect(schedule.cards.find((c) => c.id === 'T-001')?.rejectedCount).toBe(7);
    expect(schedule.cards.find((c) => c.id === 'T-002')?.rejectedCount).toBe(0);
  });

  it('and the worst-blocker SENTENCE spends it, so the two cannot disagree', () => {
    // KILLED BY: reading the status word unconditionally in
    // `worstBlockerText`. This is the line the moved import fed.
    const model = parseProjectFromFiles([
      ROADMAP,
      card('T-001', 'Alpha', { verdicts: 'x' }),
      card('T-002', 'Beta', { blockedBy: ['T-001'] }),
    ]);
    const schedule = selectTaskSchedule(model, { rejectedCountOf: () => 3 });
    expect(worstBlockerText(schedule)).toBe('T-001 Alpha · rejected ×3, holds 1');
    expect(worstBlockerText(selectTaskSchedule(model))).toBe('T-001 Alpha · planned, holds 1');
  });
});

describe('unmet — the names a terminal owes its reader', () => {
  it('every unmet blocker is carried, id-ascending, with the status that made it unmet', () => {
    // KILLED BY: returning only the first unmet blocker, or dropping the
    // status. `waitsOn` + `extraWaits` — all the pane ever had — cannot
    // name the second one.
    const model = parseProjectFromFiles([
      ROADMAP,
      card('T-001', 'Done one', { status: 'done' }),
      card('T-002', 'Parked one', { status: 'parked' }),
      card('T-003', 'Building one', { status: 'building' }),
      card('T-009', 'Subject', { blockedBy: ['T-003', 'T-002', 'T-001'] }),
    ]);
    const subject = selectTaskSchedule(model).cards.find((c) => c.id === 'T-009');
    expect(subject?.schedule).toBe('blocked');
    expect(subject?.unmet).toEqual([
      { id: 'T-002', status: 'parked', inFlight: false },
      { id: 'T-003', status: 'building', inFlight: true },
    ]);
  });

  it('a blocker naming NO card carries no status and is never in flight', () => {
    // KILLED BY: defaulting an unknown blocker's status to `planned`, or
    // to `inFlight: true`. A dangling id is unmet AND unschedulable, and
    // the honest reading is `blocked` — never `ready`.
    // AND `blocked_by` IS NOT REPAIRED: the declaration comes back
    // exactly as written (T-136 was rejected for proposing otherwise).
    const model = parseProjectFromFiles([ROADMAP, card('T-009', 'Subject', { blockedBy: ['T-404'] })]);
    const subject = selectTaskSchedule(model).cards.find((c) => c.id === 'T-009');
    expect(subject?.schedule).toBe('blocked');
    expect(subject?.unmet).toEqual([{ id: 'T-404', inFlight: false }]);
    expect(model.tasks.find((t) => t.id === 'T-009')?.blockedBy).toEqual(['T-404']);
  });

  it('ABSENT rather than empty when nothing is unmet — the additive-only rule', () => {
    // KILLED BY: returning `unmet: []` on the ready/underway branches.
    // The map pane's suite asserts `readSchedule(...)` with `toEqual`, so
    // an added empty array reds two green bodies in a file this card's
    // fence cannot reach. The POSITIVE CONTROL is the body above: the
    // field is present the moment there IS something unmet.
    const statusOf = (): TaskStatus | undefined => undefined;
    expect(readSchedule('planned', [], statusOf, 'T-X')).toEqual({
      schedule: 'ready',
      extraWaits: 0,
    });
    expect(readSchedule('done', ['T-1'], statusOf, 'T-X')).toEqual({
      schedule: 'underway',
      extraWaits: 0,
    });
    expect(Object.hasOwn(readSchedule('planned', [], statusOf, 'T-X'), 'unmet')).toBe(false);
  });
});

describe('the roadmap dimension is REPORTED, never re-derived', () => {
  it('feature, milestone and priority arrive on the card exactly as the frontmatter wrote them', () => {
    // KILLED BY: computing a second notion of progress — a percentage, a
    // rank, a "next" flag — or by defaulting a missing field to a number.
    // docs/ROADMAP.md is hand-written prose and this card does not make
    // it generated.
    const model = parseProjectFromFiles([
      ROADMAP,
      card('T-001', 'Alpha', { feature: 'F-06', milestone: 4, priority: 48 }),
      card('T-002', 'Beta'),
    ]);
    const cards = selectTaskSchedule(model).cards;
    const alpha = cards.find((c) => c.id === 'T-001');
    expect([alpha?.feature, alpha?.milestone, alpha?.priority]).toEqual(['F-06', 4, 48]);
    const beta = cards.find((c) => c.id === 'T-002');
    expect([beta?.feature, beta?.milestone, beta?.priority]).toEqual([undefined, undefined, undefined]);
  });
});

describe('the model carries its own layering', () => {
  it('so a VIEW lays out what it never recomputed', () => {
    // KILLED BY: dropping `layering` from the returned model. The map
    // pane's `layoutWaves(schedule.layering)` is the only caller, and
    // without it the app would have to re-run `layerWaves` — two
    // layerings of one graph, which is exactly the duplication this card
    // exists to remove.
    const model = parseProjectFromFiles([
      ROADMAP,
      card('T-001', 'Alpha'),
      card('T-002', 'Beta', { blockedBy: ['T-001'] }),
    ]);
    const schedule = selectTaskSchedule(model);
    expect(schedule.layering.wave.get('T-001')).toBe(0);
    expect(schedule.layering.wave.get('T-002')).toBe(1);
    expect(schedule.layering.edges).toEqual([
      { from: 'T-001', to: 'T-002', tangled: false, critical: false },
    ]);
    expect(readyNowText(schedule)).toBe('1 task, no unmet deps');
  });
});
