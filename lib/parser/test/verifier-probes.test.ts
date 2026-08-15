import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  parseModelSession,
  parseRoadmap,
  parseTaskDirectory,
  parseTaskFile,
  splitSections,
} from '../src/index.js';

/**
 * Verifier probes — T-002 verification pass, 2026-08-14,
 * claude-fable-5 @fresh. Adversarial cases beyond the executor's suite:
 * boundary inputs, YAML abuse, hostile keys, fs-layer failures.
 *
 * The `__proto__` probe below originally carried an `it.fails` marker for
 * the bug behind the 2026-08-14 REJECTED verdict (see docs/tasks/
 * T-002-task-parser.md). The fix pass (fresh executor, same day) removed
 * the marker and extended the probe to lock in the fixed behavior.
 */

const F = 'docs/tasks/T-000-probe.md';

const full = (overrides: Record<string, string> = {}): string => {
  const fields: Record<string, string> = {
    id: 'T-000',
    title: 'Probe',
    feature: 'F-01',
    milestone: '1',
    priority: '1',
    size: 'S',
    status: 'planned',
    ...overrides,
  };
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---\n\nbody\n`;
};

const kinds = (r: { issues: { kind: string }[] }): string[] => r.issues.map((i) => i.kind);

describe('verifier probes — boundary inputs never throw', () => {
  it('empty file / whitespace-only file: missing-frontmatter', () => {
    expect(kinds(parseTaskFile('', F))).toEqual(['missing-frontmatter']);
    expect(kinds(parseTaskFile('   \n\n', F))).toEqual(['missing-frontmatter']);
  });

  it('frontmatter opened but never closed: missing-frontmatter', () => {
    const r = parseTaskFile('---\nid: T-1\ntitle: x\nstatus: planned\n', F);
    expect(r.task).toBeUndefined();
    expect(kinds(r)).toEqual(['missing-frontmatter']);
  });

  it('empty frontmatter block: precise missing-field issues, no crash', () => {
    const r = parseTaskFile('---\n---\n', F);
    expect(r.task).toBeUndefined();
    expect(r.issues.map((i) => (i.kind === 'missing-field' ? i.field : i.kind)).sort()).toEqual([
      'status',
      'title',
    ]);
  });

  it('closing --- at EOF without trailing newline still closes', () => {
    const r = parseTaskFile(full().trimEnd().replace(/\n\nbody$/, '').replace(/\n$/, ''), F);
    // reconstruct: header only, close is the last line, no newline after
    const content = full().split('---\n\nbody\n')[0] + '---';
    const r2 = parseTaskFile(content, F);
    expect(r2.task?.id).toBe('T-000');
    expect(r2.issues).toEqual([]);
    expect(r.issues).toEqual([]);
  });

  it('CRLF line endings end-to-end: frontmatter, sections, roadmap', () => {
    const crlf = full().replace(/\n/g, '\r\n') + '\r\n## Acceptance criteria\r\n- SHALL work\r\n';
    const r = parseTaskFile(crlf, F);
    expect(r.issues).toEqual([]);
    expect(r.task?.sections.acceptanceCriteria).toBe('- SHALL work');

    const road = parseRoadmap('## Backbone\r\n- F-01: A — b\r\n', 'ROADMAP.md');
    expect(road.issues).toEqual([]);
    expect(road.features[0]).toMatchObject({ id: 'F-01', name: 'A', description: 'b' });
  });

  it('UTF-8 BOM before the opening --- is tolerated', () => {
    const r = parseTaskFile('﻿' + full(), F);
    expect(r.issues).toEqual([]);
    expect(r.task?.id).toBe('T-000');
  });
});

describe('verifier probes — YAML abuse becomes structured issues', () => {
  it('duplicate YAML keys: yaml-error, no throw', () => {
    const r = parseTaskFile('---\nid: T-1\nid: T-2\ntitle: x\nstatus: planned\n---\n', F);
    expect(r.task).toBeUndefined();
    expect(kinds(r)).toEqual(['yaml-error']);
  });

  it('alias bomb (2^30 expansion): capped by yaml maxAliasCount, yaml-error', () => {
    let y = '---\na0: &a0 [x,x]\n';
    for (let i = 1; i <= 30; i++) y += `a${i}: &a${i} [*a${i - 1},*a${i - 1}]\n`;
    y += 'title: t\nstatus: planned\nid: T-9\n---\n';
    const start = Date.now();
    const r = parseTaskFile(y, F);
    expect(Date.now() - start).toBeLessThan(2000);
    expect(kinds(r)).toEqual(['yaml-error']);
  });

  it('tab-indented YAML: yaml-error naming the file', () => {
    const r = parseTaskFile('---\n\tid: T-1\ntitle: x\nstatus: planned\n---\n', F);
    expect(r.issues[0]).toMatchObject({ kind: 'yaml-error', file: F });
  });

  it('unquoted 007 id (YAML number): invalid-field naming id', () => {
    const r = parseTaskFile(full({ id: '007' }), F);
    expect(r.task).toBeUndefined();
    expect(r.issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', field: 'id', file: F }),
    ]);
  });
});

describe('verifier probes — hostile frontmatter keys', () => {
  const hostile = full({ status: 'planned' }).replace(
    '---\n\nbody',
    '__proto__:\n  phantom_flag: pwned\n---\n\nbody',
  );

  it('never pollutes the global Object.prototype', () => {
    parseTaskFile(hostile, F);
    expect(({} as Record<string, unknown>).phantom_flag).toBeUndefined();
  });

  it('a bare `constructor:` key is preserved as an own key of extra', () => {
    const r = parseTaskFile(full().replace('---\n\nbody', 'constructor: kept\n---\n\nbody'), F);
    expect(Object.prototype.hasOwnProperty.call(r.task?.extra ?? {}, 'constructor')).toBe(true);
  });

  it('a bare `prototype:` key is preserved as an own key of extra', () => {
    const r = parseTaskFile(full().replace('---\n\nbody', 'prototype: kept\n---\n\nbody'), F);
    expect(r.issues).toEqual([]);
    expect(Object.prototype.hasOwnProperty.call(r.task?.extra ?? {}, 'prototype')).toBe(true);
    expect((r.task?.extra as Record<string, unknown>).prototype).toBe('kept');
  });

  // Was `it.fails` for the 2026-08-14 REJECTED verdict: `extra[key] = value`
  // on a plain object mutated extra's prototype for key '__proto__' — the
  // field silently dropped (archaeology-rule violation), attacker properties
  // inherited. Fixed: extra is built with a null prototype, so the key lands
  // as own enumerable data. Flipped + extended by the fix pass, 2026-08-14.
  it('a bare `__proto__:` key is preserved as own data, never inherited', () => {
    const r = parseTaskFile(hostile, F);
    const extra = (r.task?.extra ?? {}) as Record<string, unknown>;

    // preserved verbatim as an OWN enumerable data property, no issue needed
    expect(r.issues).toEqual([]);
    const desc = Object.getOwnPropertyDescriptor(extra, '__proto__');
    expect(desc?.value).toEqual({ phantom_flag: 'pwned' });
    expect(desc?.enumerable).toBe(true);

    // prototype unpolluted: the payload is data under the key, not inherited
    // state — nothing on extra's prototype chain carries attacker properties
    expect(extra.phantom_flag).toBeUndefined();
    expect('phantom_flag' in extra).toBe(false);

    // visible to ordinary consumers: enumeration and JSON both show the key
    expect(Object.entries(extra)).toEqual([['__proto__', { phantom_flag: 'pwned' }]]);
    expect(JSON.stringify(extra)).toBe('{"__proto__":{"phantom_flag":"pwned"}}');
  });
});

describe('verifier probes — roadmap edges', () => {
  const R = 'docs/ROADMAP.md';

  it('wrapped line starting with the em dash still splits name/description', () => {
    const r = parseRoadmap('## Backbone\n- F-01: Name\n  — wrapped description\n', R);
    expect(r.features[0]).toMatchObject({ name: 'Name', description: 'wrapped description' });
  });

  it('en dash and bare hyphen are not separators (all name)', () => {
    const r = parseRoadmap('## Backbone\n- F-01: A – b\n- F-02: C - d\n', R);
    expect(r.features[0]).toMatchObject({ name: 'A – b', description: '' });
    expect(r.features[1]).toMatchObject({ name: 'C - d', description: '' });
  });

  it('splits on the FIRST spaced em dash only', () => {
    const r = parseRoadmap('## Backbone\n- F-01: Name — first — second\n', R);
    expect(r.features[0]).toMatchObject({ name: 'Name', description: 'first — second' });
  });

  it('three copies of one feature id: two duplicate-id issues, all kept', () => {
    const r = parseRoadmap('## Backbone\n- F-01: A\n- F-01: B\n- F-01: C\n', R);
    expect(r.features).toHaveLength(3);
    expect(kinds(r)).toEqual(['duplicate-id', 'duplicate-id']);
  });

  it('backbone heading is case-insensitive and allows suffixes', () => {
    expect(parseRoadmap('## backbone\n- F-01: A — b\n', R).features).toHaveLength(1);
    expect(parseRoadmap('## Backbone (revised per ADR-008)\n- F-01: A — b\n', R).features)
      .toHaveLength(1);
  });

  it('backbone at EOF without trailing newline', () => {
    const r = parseRoadmap('## Backbone\n- F-01: A — b', R);
    expect(r.features[0]).toMatchObject({ id: 'F-01', description: 'b' });
  });
});

describe('verifier probes — section splitting', () => {
  it('duplicate known headings merge instead of overwriting', () => {
    const s = splitSections('## Verdicts\nfirst\n## Verdicts\nsecond\n');
    expect(s.verdicts).toBe('first\n\nsecond');
  });

  it('headings are case-insensitive with flexible inner whitespace', () => {
    expect(splitSections('## ACCEPTANCE CRITERIA\n- x\n').acceptanceCriteria).toBe('- x');
    expect(splitSections('## Implementation   notes\ntext\n').implementationNotes).toBe('text');
  });

  it('##NoSpace is not a heading; preamble before the first heading is PRESERVED (T-019)', () => {
    // Flipped 2026-08-16 by T-019 (absorbing T-002-s2): the pre-heading
    // text used to be dropped; it is now the `preamble` key — a
    // suggestion's context paragraph is its entire content. ##NoSpace is
    // still not a heading, so that whole body is preamble text.
    expect(splitSections('##Acceptance criteria\n- x\n')).toEqual({
      preamble: '##Acceptance criteria\n- x',
    });
    expect(splitSections('orphan context paragraph\n## Verdicts\nv\n')).toEqual({
      preamble: 'orphan context paragraph',
      verdicts: 'v',
    });
    // Text under an UNKNOWN heading is still dropped — the preamble is
    // only what comes before the FIRST heading of any kind.
    expect(splitSections('context\n## Unknown\nleaked?\n## Verdicts\nv\n')).toEqual({
      preamble: 'context',
      verdicts: 'v',
    });
  });
});

describe('verifier probes — model@session boundary forms', () => {
  it('spaces around @ are trimmed on both sides', () => {
    expect(parseModelSession('codex @ S3')).toMatchObject({ model: 'codex', session: 'S3' });
  });

  it('session policy names are case-sensitive: @Fresh resumes, @fresh is fresh', () => {
    expect(parseModelSession('codex@Fresh').policy).toBe('resume');
    expect(parseModelSession('codex@fresh').policy).toBe('fresh');
  });

  it('empty model or lone @ is rejected at the field level', () => {
    for (const bad of ['"@S3"', '"@"']) {
      const r = parseTaskFile(full({ builder: bad }), F);
      expect(r.issues).toEqual([
        expect.objectContaining({ kind: 'invalid-field', field: 'builder' }),
      ]);
      expect(r.task?.builder).toBeUndefined();
    }
  });
});

describe('verifier probes — filesystem layer keeps going', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nputer-verifier-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('three files sharing an id: two duplicate-id issues, all records kept', () => {
    const tasks = join(dir, 'tasks-dup');
    mkdirSync(tasks, { recursive: true });
    for (const name of ['T-901-a.md', 'T-902-b.md', 'T-903-c.md']) {
      writeFileSync(join(tasks, name), full({ id: 'T-900' }));
    }
    const r = parseTaskDirectory(tasks);
    expect(r.tasks).toHaveLength(3);
    expect(kinds(r)).toEqual(['duplicate-id', 'duplicate-id']);
    for (const issue of r.issues) {
      if (issue.kind === 'duplicate-id') expect(issue.files[0]).toContain('T-901-a.md');
    }
  });

  it('a directory named T-*.md: io-error, siblings still parse', () => {
    const tasks = join(dir, 'tasks-eisdir');
    mkdirSync(join(tasks, 'T-911-actually-a-dir.md'), { recursive: true });
    writeFileSync(join(tasks, 'T-912-fine.md'), full({ id: 'T-912' }));
    const r = parseTaskDirectory(tasks);
    expect(r.tasks.map((t) => t.id)).toEqual(['T-912']);
    expect(kinds(r)).toEqual(['io-error']);
  });
});
