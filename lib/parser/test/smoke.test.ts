import { readdirSync } from 'node:fs';
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

  it('parses the dogfood component registry (T-008): the parsed set IS the directory', () => {
    const components = result.components ?? [];
    expect(components.length).toBeGreaterThanOrEqual(5);
    // THE THREE BLOCKS BELOW DOCUMENT A HAND-WRITTEN ID ARRAY THAT NO
    // LONGER EXISTS HERE (T-033) — they are kept because they are the
    // record of what that pin cost and of the three-fixture rule it
    // taught, not because the array survives. Read the T-033 block after
    // them for what this body asserts today.
    //
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
    //
    // T-033 (2026-08-25, executor claude-opus-5): THE ARRAY IS REPLACED BY
    // THE PROPERTY IT WAS STANDING IN FOR, and the census it froze did not
    // disappear — it stayed where a component-declaring card's fence
    // already reaches. Four reconciliations in four months (T-008, T-024,
    // T-025, T-088) each cost a lane a red in a package it had no reason
    // to open, behind a task fence reading "zero diff under lib/parser/**"
    // — and none of them was ever a lib-parser DEFECT. The census lives on
    // in app/test/architecture-dogfood.test.ts ("the live registry is the
    // twelve known components", plus its declared-count assertion beside
    // it) and in app/test/map-dogfood-render.test.tsx's node count; both
    // sit under app/test/**, which is C-05's app-shell slug — the same
    // fence a card declaring a component already has to hold. CONVENTIONS'
    // three-fixture gotcha is therefore NOT weakened: it becomes "declaring
    // a component moves the two app fixtures, and this one only if you got
    // the id or the filename wrong".
    //
    // WHAT THIS BODY ASSERTS NOW, exactly, so the title is not a claim it
    // cannot check (the T-096 lesson): for every C-*.md in
    // docs/architecture/components/, the id the PARSER read out of that
    // file's FRONTMATTER equals the id spelled in its FILENAME, and the
    // parser drops none of them and invents none. Two independent readings
    // — a `id:` field and a directory entry — so the assertion still has
    // two sides and still reds: on a frontmatter id that disagrees with
    // its filename (either direction), on a registry file the parser
    // silently fails to produce a record for, and on a record with no file
    // behind it. What it deliberately does NOT check is the FILTER or the
    // ORDER: parseComponentDirectory selects /^C-.*\.md$/ and sorts, and
    // this derivation uses the same two on purpose, because a body that
    // disagreed about which files count would red on legitimate registry
    // work rather than on a defect.
    const componentsDir = fileURLToPath(
      new URL('../../../docs/architecture/components/', import.meta.url),
    );
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

    // every declared edge resolves — the dogfood registry has no danglers
    const ids = new Set(components.map((c) => c.id));
    for (const c of components) {
      for (const dep of c.dependsOn) expect(ids.has(dep)).toBe(true);
    }
  });
});
