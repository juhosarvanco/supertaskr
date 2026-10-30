import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseProject } from '../src/index.js';

/** Authored disk-to-parser smoke. The example project is independent of
 * Supertaskr's private board and preserves nontrivial task/registry joins. */
import { createExampleProject } from '../../../tools/e2e/fixtures/example-project.mjs';
const repoRoot = createExampleProject(fileURLToPath(new URL('../../../', import.meta.url)));

describe('smoke — the representative docs/ tree parses cleanly', () => {
  const result = parseProject(repoRoot);

  it('finds zero issues in the representative tree', () => {
    expect(result.issues).toEqual([]);
  });

  it('parses the authored milestone tasks', () => {
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

  it('parses the representative component registry (T-008): the parsed set IS the directory', () => {
    const components = result.components ?? [];
    expect(components.length).toBeGreaterThanOrEqual(5);
    // Compare independent filename and frontmatter readings over the authored
    // registry; preserve exact membership, edge resolution and parser fields.
    const componentsDir = join(repoRoot, 'docs/architecture/components');
    const filenameIds: string[] = [];
    for (const name of readdirSync(componentsDir)
      .filter((n) => /^C-.*\.md$/.test(n))
      .sort()) {
      // REFUSE RATHER THAN GUESS (ADR-015's addendum applied to a
      // filename): a registry file is C-<digits>-<slug>.md, and a name
      // this cannot read fails HERE, by name, instead of contributing a
      // silently truncated id that would then "agree" with nothing.
      const id = /^(C-\d+)-.+\.md$/.exec(name)?.[1];
      expect(id, `registry filename is not C-<digits>-<slug>.md: ${name}`).toBeDefined();
      if (id !== undefined) filenameIds.push(id);
    }
    expect(components.map((c) => c.id)).toEqual(filenameIds);

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

    // every declared edge resolves — the authored registry has no danglers
    const ids = new Set(components.map((c) => c.id));
    for (const c of components) {
      for (const dep of c.dependsOn) expect(ids.has(dep)).toBe(true);
    }
  });
});
