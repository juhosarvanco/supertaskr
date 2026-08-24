import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseProject } from '../src/index.js';

/**
 * Smoke test against the live repo: the real docs/ tree must parse
 * cleanly. Unit tests own the edge cases via fixtures; this guards the
 * actual project files the board will render.
 */
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

describe('smoke — the real docs/ tree parses cleanly', () => {
  const result = parseProject(repoRoot);

  it('finds zero issues in the live tree', () => {
    expect(result.issues).toEqual([]);
  });

  it('parses the milestone-1 tasks', () => {
    const ids = result.tasks.map((t) => t.id);
    for (const id of ['T-001', 'T-002', 'T-003', 'T-004', 'T-005', 'T-006', 'T-007']) {
      expect(ids).toContain(id);
    }
    const t002 = result.tasks.find((t) => t.id === 'T-002');
    expect(t002).toMatchObject({ feature: 'F-02', milestone: 1, size: 'M' });
    expect(t002?.builder?.model).toBe('claude-fable-5');
    expect(t002?.sections.acceptanceCriteria).toContain('typed model');
  });

  it('parses the backbone features in order', () => {
    expect(result.features.map((f) => f.id)).toEqual(['F-01', 'F-02', 'F-03', 'F-04', 'F-05', 'F-06']);
    const f02 = result.features[1];
    expect(f02?.name).toBe('App shell + board');
    expect(f02?.description).toContain('story map');
  });

  it('parses the dogfood component registry (T-008): same C-namespace as ARCHITECTURE.md', () => {
    const components = result.components ?? [];
    expect(components.length).toBeGreaterThanOrEqual(5);
    // RECONCILED AT T-024 (2026-08-16, fix pass, executor claude-opus-5
    // @fresh): the branch declares C-13 genesis pane in
    // docs/architecture/components/ per the task spec and the T-012 §2
    // precedent, so this live-tree pin lists ten ids, not nine. A
    // component declaration moves THREE registry fixtures, not two —
    // app/test/architecture-dogfood.test.ts (enumerated delta block) and
    // app/test/map-dogfood-render.test.tsx were reconciled in b9df9b1;
    // this one, one directory away, was missed and left this suite red.
    // Changed, never loosened: still a whole-array toEqual, every
    // pre-existing id byte-unchanged, C-13 appended in registry order.
    // No lib/parser/src/** byte moved — the fence there is a SOURCE
    // fence; the fixture follows reality.
    //
    // RECONCILED AGAIN AT T-025 (2026-08-16, executor claude-opus-5
    // @fresh): the branch declares C-14 agent runner
    // (app/src-tauri/src/agent/** + app/src/lib/agent-store.ts, slug
    // app-agent) per the task spec and the same T-012 §2 precedent, so
    // this live-tree pin lists ELEVEN ids. All three registry fixtures
    // were moved in this branch, not two — that is the lesson T-024's
    // rejection wrote down, applied here deliberately rather than
    // rediscovered: this file plus app/test/architecture-dogfood.test.ts
    // and app/test/map-dogfood-render.test.tsx. Changed, never loosened:
    // still a whole-array toEqual, every pre-existing id byte-unchanged,
    // C-14 appended in registry order.
    //
    // RECONCILED AGAIN AT T-088 (2026-08-24, executor claude-opus-5): the
    // branch declares C-15 dispatch (app/src-tauri/src/dispatch/** +
    // app/src/lib/dispatch-store.ts, slug app-dispatch) per
    // docs/design/dispatch-technical-plan.md's D2, so this live-tree pin
    // lists TWELVE ids. THE MOVED SET WAS DERIVED BEFORE ANYTHING WAS RUN,
    // by running the live derivation through a throwaway probe and diffing
    // it against the three fixtures — eight assertions across six bodies in
    // these three files, two of them SECOND assertions in a body whose
    // first also moves (architecture-dogfood's registry body and its drift
    // body). C-15's declared paths match NO file on disk, so it is
    // declared-only rather than territory: derived.fileComponent.size,
    // every per-component tally and map-dogfood's file hint are all
    // UNCHANGED at 126, and this file's own assertion is the only one that
    // moves outside app/test. Changed, never loosened: still a whole-array
    // toEqual, every pre-existing id byte-unchanged, C-15 appended in
    // registry order. No lib/parser/src/** byte moved.
    expect(components.map((c) => c.id)).toEqual([
      'C-01',
      'C-05',
      'C-06',
      'C-07',
      'C-08',
      'C-09',
      'C-10',
      'C-11',
      'C-12',
      'C-13',
      'C-14',
      'C-15',
    ]);

    const parser = components.find((c) => c.id === 'C-06');
    expect(parser).toMatchObject({
      name: 'lib-parser',
      layer: 'lib',
      paths: ['lib/parser/**'],
      dependsOn: ['C-01'],
      touchSlugs: ['lib-parser'],
      status: 'auto',
    });
    expect(parser?.responsibility).toContain('hardened frontmatter parser');

    // every declared edge resolves — the dogfood registry has no danglers
    const ids = new Set(components.map((c) => c.id));
    for (const c of components) {
      for (const dep of c.dependsOn) expect(ids.has(dep)).toBe(true);
    }
  });
});
