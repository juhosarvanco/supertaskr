import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isTaskFilePath, parseProject, parseProjectFromFiles } from '../src/index.js';

const fixture = (name: string): string =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

/** Load a fixture project into an in-memory map keyed the given way. */
const loadFixture = (
  name: string,
  toKey: (rel: string, abs: string) => string,
): Map<string, string> => {
  const root = fixture(name);
  const map = new Map<string, string>();
  const roadmapAbs = join(root, 'docs', 'ROADMAP.md');
  map.set(toKey('docs/ROADMAP.md', roadmapAbs), readFileSync(roadmapAbs, 'utf8'));
  const tasksAbs = join(root, 'docs', 'tasks');
  for (const file of readdirSync(tasksAbs)) {
    const abs = join(tasksAbs, file);
    map.set(toKey(`docs/tasks/${file}`, abs), readFileSync(abs, 'utf8'));
  }
  return map;
};

describe('parseProjectFromFiles — mirrors the filesystem layer exactly', () => {
  it('produces a result deep-equal to parseProject on the same files (valid fixture)', () => {
    const root = fixture('valid-project');
    const fromDisk = parseProject(root);
    const fromFiles = parseProjectFromFiles(loadFixture('valid-project', (_rel, abs) => abs), {
      tasksDir: join(root, 'docs', 'tasks'),
      roadmapFile: join(root, 'docs', 'ROADMAP.md'),
    });
    expect(fromFiles).toEqual(fromDisk);
  });

  it('produces a result deep-equal to parseProject on the broken fixture (issues included)', () => {
    const root = fixture('broken-project');
    const fromDisk = parseProject(root);
    const fromFiles = parseProjectFromFiles(loadFixture('broken-project', (_rel, abs) => abs), {
      tasksDir: join(root, 'docs', 'tasks'),
      roadmapFile: join(root, 'docs', 'ROADMAP.md'),
    });
    expect(fromFiles).toEqual(fromDisk);
  });

  it('reports duplicate ids with the same message shape as parseTaskDirectory', () => {
    // 2026-08-16 (T-019): fixture filenames now encode the duplicated id
    // (T-300-first/T-300-second) — see the note in project.test.ts. The
    // duplicate is this project's ONLY issue, cross-reference pass included.
    const result = parseProjectFromFiles(loadFixture('dup-project', (rel) => rel));
    const dup = result.issues.find((i) => i.kind === 'duplicate-id');
    // TIGHTENED AT T-076 (2026-08-19, executor claude-opus-5 @fresh), one
    // line: `space: 'task'`. This is the PURE task layer, the fourth of
    // criterion 3's four emit sites and the only one whose pin is a
    // toMatchObject — so it stayed green through the field's arrival and
    // would have stayed green through the field's absence HERE alone.
    // Asserted rather than assumed: the two layers are deep-equal by
    // contract, and that contract is what a missing field at one site
    // would break silently.
    expect(dup).toMatchObject({
      space: 'task',
      id: 'T-300',
      files: ['docs/tasks/T-300-first.md', 'docs/tasks/T-300-second.md'],
    });
    expect(dup?.message).toBe(
      "duplicate task id 'T-300' in docs/tasks/T-300-first.md and docs/tasks/T-300-second.md",
    );
    expect(result.issues).toHaveLength(1);
    // both records stay visible — flagged, not hidden
    expect(result.tasks).toHaveLength(2);
  });
});

describe('parseProjectFromFiles — relative-path conventions', () => {
  const task = (id: string, title: string): string =>
    `---\nid: ${id}\ntitle: ${title}\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: building\n---\n`;
  const roadmap = '# R\n\n## Backbone\n- F-01: One — thing\n';

  it('parses tasks + roadmap from relative POSIX paths, deterministically ordered', () => {
    // Insertion order is deliberately reversed; output must be path-sorted.
    const result = parseProjectFromFiles(
      new Map([
        ['docs/tasks/T-902-second.md', task('T-902', 'Second')],
        ['docs/ROADMAP.md', roadmap],
        ['docs/tasks/T-901-first.md', task('T-901', 'First')],
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901', 'T-902']);
    expect(result.features.map((f) => f.id)).toEqual(['F-01']);
  });

  it('accepts an iterable of { path, content } entries too', () => {
    const result = parseProjectFromFiles([
      { path: 'docs/ROADMAP.md', content: roadmap },
      { path: 'docs/tasks/T-901-first.md', content: task('T-901', 'First') },
    ]);
    expect(result.issues).toEqual([]);
    expect(result.tasks).toHaveLength(1);
  });

  it('ignores files that are not model inputs (other docs, nested dirs, non-T names)', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', roadmap],
        ['docs/tasks/T-901-first.md', task('T-901', 'First')],
        ['docs/STATE.md', '# State\nnot a task'],
        ['docs/tasks/notes.md', 'not a task file'],
        ['docs/tasks/nested/T-999-deep.md', task('T-999', 'Too deep')],
        ['docs/decisions/001-x.md', '# ADR'],
        ['T-900-toplevel.md', task('T-900', 'Wrong place')],
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']);
  });

  it('missing roadmap is an io-error issue, mirroring the disk layer', () => {
    const result = parseProjectFromFiles(
      new Map([['docs/tasks/T-901-first.md', task('T-901', 'First')]]),
    );
    expect(result.tasks).toHaveLength(1);
    expect(result.features).toEqual([]);
    expect(result.issues).toEqual([
      {
        kind: 'io-error',
        file: 'docs/ROADMAP.md',
        message: 'docs/ROADMAP.md: cannot read roadmap — not present in file set',
      },
    ]);
  });

  it('an empty file set yields empty model plus the missing-roadmap issue', () => {
    const result = parseProjectFromFiles(new Map());
    expect(result.tasks).toEqual([]);
    expect(result.features).toEqual([]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.kind).toBe('io-error');
  });

  it('honors tasksDir/roadmapFile overrides', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['work/items/T-901-first.md', task('T-901', 'First')],
        ['work/MAP.md', roadmap],
        ['docs/tasks/T-902-second.md', task('T-902', 'Ignored now')],
      ]),
      { tasksDir: 'work/items', roadmapFile: 'work/MAP.md' },
    );
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']);
    expect(result.features).toHaveLength(1);
    expect(result.issues).toEqual([]);
  });

  it('hostile path names (__proto__, constructor) are inert map keys (ADR-009)', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', roadmap],
        ['docs/tasks/T-903-__proto__.md', task('T-903', 'Proto path')],
        ['docs/tasks/T-904-constructor.md', task('T-904', 'Ctor path')],
        ['__proto__', 'not markdown'],
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-903', 'T-904']);
    // Nothing leaked onto Object.prototype.
    expect(Object.prototype).not.toHaveProperty('polluted');
    expect(({} as Record<string, unknown>)['T-903']).toBeUndefined();
  });
});

describe('isTaskFilePath', () => {
  it('matches only direct T-*.md children of the tasks dir', () => {
    expect(isTaskFilePath('docs/tasks/T-001-x.md')).toBe(true);
    expect(isTaskFilePath('docs/tasks/T-001-s1-slug.md')).toBe(true);
    expect(isTaskFilePath('docs/tasks/notes.md')).toBe(false);
    expect(isTaskFilePath('docs/tasks/nested/T-001-x.md')).toBe(false);
    expect(isTaskFilePath('docs/ROADMAP.md')).toBe(false);
    expect(isTaskFilePath('T-001-x.md')).toBe(false);
    expect(isTaskFilePath('other/T-001-x.md', 'other')).toBe(true);
  });
});

describe('duplicate-id says WHICH id space, in one mixed model (T-076)', () => {
  const taskSrc = (id: string): string =>
    `---\nid: ${id}\ntitle: ${id} title\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: planned\n---\n`;
  const componentSrc = (id: string, paths: string[]): string =>
    `---\nid: ${id}\nname: ${id} name\npaths: [${paths.join(', ')}]\ndepends_on: []\n---\nProse.\n`;

  it('reads .space off every duplicate without touching a message', () => {
    // Criterion 3's whole point, stated as a consumer would use it: a UI
    // that can filter ALIASES by space could not filter DUPLICATES by it,
    // because the only discriminator was the prose. Three duplicates, one
    // model, three spaces read structurally.
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', '# R\n\n## Backbone\n- F-01: One — a\n- F-01: One again — b\n'],
        ['docs/tasks/T-300-first.md', taskSrc('T-300')],
        ['docs/tasks/T-300-second.md', taskSrc('T-300')],
        ['docs/architecture/components/C-05-a.md', componentSrc('C-05', ['a/**'])],
        ['docs/architecture/components/C-05-b.md', componentSrc('C-05', ['b/**'])],
      ]),
    );
    const duplicates = result.issues.filter((i) => i.kind === 'duplicate-id');
    expect(duplicates).toHaveLength(3);
    expect(duplicates.map((i) => (i.kind === 'duplicate-id' ? i.space : ''))).toEqual([
      'task',
      'feature',
      'component',
    ]);
    // …and the ids, so the spaces are not being read off three copies of
    // one issue.
    expect(duplicates.map((i) => (i.kind === 'duplicate-id' ? i.id : ''))).toEqual([
      'T-300',
      'F-01',
      'C-05',
    ]);
  });
});
