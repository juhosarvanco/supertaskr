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
});
