import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compareComponentIds,
  isComponentFilePath,
  parseComponentDirectory,
  parseComponentFile,
  parseComponentsFromFiles,
  parseProject,
  parseProjectFromFiles,
} from '../src/index.js';

const FILE = 'docs/architecture/components/C-08-board-pane.md';

const VALID = `---
id: C-08
name: Board pane
layer: app                # free-form label, used for grouping/lanes
paths:                    # globs relative to repo root, gitignore-style
  - app/src/components/board/**
  - app/src/lib/board-model.ts
depends_on: [C-06, C-11]  # declared, directional: this component -> those
decisions: [ADR-008]      # linked decision records
status: auto              # auto | planned | building | verifying | rejected | merging | done
touch_slugs: [app-board]  # ARCHITECTURE.md slug mapping (plan 0.0-4)
---
Renders the story map board from the parsed model. Owns column layout,
card faces, slice line. Never writes.
`;

const fixture = (name: string): string =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

describe('parseComponentFile — valid component', () => {
  it('parses every frontmatter field with zero issues', () => {
    const { component, issues } = parseComponentFile(VALID, FILE);
    expect(issues).toEqual([]);
    expect(component).toEqual({
      id: 'C-08',
      name: 'Board pane',
      layer: 'app',
      paths: ['app/src/components/board/**', 'app/src/lib/board-model.ts'],
      dependsOn: ['C-06', 'C-11'],
      decisions: ['ADR-008'],
      touchSlugs: ['app-board'],
      status: 'auto',
      responsibility:
        'Renders the story map board from the parsed model. Owns column layout,\ncard faces, slice line. Never writes.',
      extra: {},
      file: FILE,
    });
  });

  it('defaults: absent status is auto, absent lists are [], absent layer stays off', () => {
    const minimal = `---\nid: C-05\nname: App\npaths: [app/**]\n---\nShell.\n`;
    const { component, issues } = parseComponentFile(minimal, FILE);
    expect(issues).toEqual([]);
    expect(component).toMatchObject({
      id: 'C-05',
      name: 'App',
      status: 'auto',
      dependsOn: [],
      decisions: [],
      touchSlugs: [],
      responsibility: 'Shell.',
    });
    expect(component?.layer).toBeUndefined();
  });

  it('a pinned status is kept verbatim', () => {
    const pinned = VALID.replace(/status: auto.*\n/, 'status: done\n');
    const { component, issues } = parseComponentFile(pinned, FILE);
    expect(issues).toEqual([]);
    expect(component?.status).toBe('done');
  });

  it('preserves unknown frontmatter keys in extra instead of dropping them', () => {
    const withExtra = VALID.replace('---\nRenders', 'future_field: kept\n---\nRenders');
    const { component, issues } = parseComponentFile(withExtra, FILE);
    expect(issues).toEqual([]);
    expect(component?.extra).toEqual({ future_field: 'kept' });
  });
});

describe('parseComponentFile — identity and field validation', () => {
  it('missing id: missing-field, no record (identity)', () => {
    const noId = VALID.replace(/id: C-08\n/, '');
    const { component, issues } = parseComponentFile(noId, FILE);
    expect(component).toBeUndefined();
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'missing-field', file: FILE, field: 'id' }),
    ]);
  });

  it.each(['C-5', 'X-01', 'c-08', 'C-08-board'])(
    'id %j fails the C-\\d{2,} pattern: invalid-field, no record',
    (bad) => {
      const { component, issues } = parseComponentFile(VALID.replace('C-08', bad), FILE);
      expect(component).toBeUndefined();
      expect(issues).toContainEqual(
        expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'id' }),
      );
    },
  );

  it('unquoted numeric id: invalid-field naming id', () => {
    const { component, issues } = parseComponentFile(VALID.replace('id: C-08', 'id: 8'), FILE);
    expect(component).toBeUndefined();
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'id' }),
    );
  });

  it('missing name: missing-field, no record (identity)', () => {
    const noName = VALID.replace(/name: Board pane\n/, '');
    const { component, issues } = parseComponentFile(noName, FILE);
    expect(component).toBeUndefined();
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'missing-field', file: FILE, field: 'name' }),
    ]);
  });

  it('missing paths: missing-field, record still returned with []', () => {
    const noPaths = `---\nid: C-05\nname: App\n---\nShell.\n`;
    const { component, issues } = parseComponentFile(noPaths, FILE);
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'missing-field', file: FILE, field: 'paths' }),
    ]);
    expect(component).toMatchObject({ id: 'C-05', paths: [] });
  });

  it('empty paths list: invalid-field (paths must be non-empty)', () => {
    const empty = `---\nid: C-05\nname: App\npaths: []\n---\nShell.\n`;
    const { component, issues } = parseComponentFile(empty, FILE);
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'paths' }),
    ]);
    expect(component?.paths).toEqual([]);
  });

  it('scalar where a list is required: invalid-field, record kept', () => {
    const scalar = `---\nid: C-05\nname: App\npaths: app/**\n---\nShell.\n`;
    const { component, issues } = parseComponentFile(scalar, FILE);
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'paths' }),
    ]);
    expect(component?.paths).toEqual([]);
  });

  it('non-string list entries: invalid-field per entry, good entries kept', () => {
    const mixed = `---\nid: C-05\nname: App\npaths: [app/**, 3]\ndepends_on: [C-01, null]\n---\nShell.\n`;
    const { component, issues } = parseComponentFile(mixed, FILE);
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', field: 'paths' }),
      expect.objectContaining({ kind: 'invalid-field', field: 'depends_on' }),
    ]);
    expect(component?.paths).toEqual(['app/**']);
    expect(component?.dependsOn).toEqual(['C-01']);
  });

  it('task-only statuses (suggested/parked) are invalid for components; status falls back to auto', () => {
    for (const bad of ['suggested', 'parked', 'in-progress']) {
      const { component, issues } = parseComponentFile(
        VALID.replace(/status: auto.*\n/, `status: ${bad}\n`),
        FILE,
      );
      expect(issues).toEqual([
        expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'status' }),
      ]);
      expect(component?.status).toBe('auto');
    }
  });

  it('non-string layer: invalid-field, layer stays off', () => {
    const { component, issues } = parseComponentFile(
      VALID.replace(/layer: app.*\n/, 'layer: 7\n'),
      FILE,
    );
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'layer' }),
    ]);
    expect(component?.layer).toBeUndefined();
  });
});

describe('parseComponentFile — malformed input never throws', () => {
  it('broken YAML: structured yaml-error naming the file', () => {
    const broken = `---\nid: "unterminated\nname: x\n---\nbody\n`;
    const { component, issues } = parseComponentFile(broken, FILE);
    expect(component).toBeUndefined();
    expect(issues).toEqual([expect.objectContaining({ kind: 'yaml-error', file: FILE })]);
  });

  it('no frontmatter block at all', () => {
    const { component, issues } = parseComponentFile('# just markdown\n', FILE);
    expect(component).toBeUndefined();
    expect(issues).toEqual([expect.objectContaining({ kind: 'missing-frontmatter', file: FILE })]);
  });

  it('frontmatter that is not a mapping', () => {
    const { component, issues } = parseComponentFile('---\n- a\n---\n', FILE);
    expect(component).toBeUndefined();
    expect(issues).toEqual([expect.objectContaining({ kind: 'not-a-mapping', file: FILE })]);
  });
});

describe('parseComponentFile — hostile keys (ADR-009)', () => {
  it('a bare `__proto__:` frontmatter key is preserved as own data, never inherited', () => {
    const hostile = VALID.replace(
      '---\nRenders',
      '__proto__:\n  phantom_flag: pwned\n---\nRenders',
    );
    const { component, issues } = parseComponentFile(hostile, FILE);
    expect(issues).toEqual([]);
    const extra = (component?.extra ?? {}) as Record<string, unknown>;

    const desc = Object.getOwnPropertyDescriptor(extra, '__proto__');
    expect(desc?.value).toEqual({ phantom_flag: 'pwned' });
    expect(desc?.enumerable).toBe(true);

    // nothing inherited, global prototype unpolluted
    expect(extra.phantom_flag).toBeUndefined();
    expect('phantom_flag' in extra).toBe(false);
    expect(({} as Record<string, unknown>).phantom_flag).toBeUndefined();

    // visible to ordinary consumers
    expect(Object.entries(extra)).toEqual([['__proto__', { phantom_flag: 'pwned' }]]);
    expect(JSON.stringify(extra)).toBe('{"__proto__":{"phantom_flag":"pwned"}}');
  });

  it('bare `constructor:` and `prototype:` keys land as own keys of extra', () => {
    for (const key of ['constructor', 'prototype']) {
      const { component, issues } = parseComponentFile(
        VALID.replace('---\nRenders', `${key}: kept\n---\nRenders`),
        FILE,
      );
      expect(issues).toEqual([]);
      const extra = (component?.extra ?? {}) as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(extra, key)).toBe(true);
      expect(extra[key]).toBe('kept');
    }
  });

  it('hostile body headings stay verbatim prose in responsibility, nothing leaks', () => {
    const hostileBody = VALID.replace(
      /Renders[\s\S]*$/,
      '## __proto__\nstill prose\n\n## constructor\nalso prose\n',
    );
    const { component, issues } = parseComponentFile(hostileBody, FILE);
    expect(issues).toEqual([]);
    expect(component?.responsibility).toBe(
      '## __proto__\nstill prose\n\n## constructor\nalso prose',
    );
    expect(Object.prototype).not.toHaveProperty('polluted');
    expect(({} as Record<string, unknown>).still).toBeUndefined();
  });
});

describe('compareComponentIds', () => {
  it('orders numerically by the digits, not lexicographically', () => {
    expect(['C-100', 'C-09', 'C-99', 'C-08'].sort(compareComponentIds)).toEqual([
      'C-08',
      'C-09',
      'C-99',
      'C-100',
    ]);
    expect(compareComponentIds('C-05', 'C-05')).toBe(0);
  });
});

const componentSrc = (
  id: string,
  paths: string[],
  dependsOn: string[] = [],
): string =>
  `---\nid: ${id}\nname: ${id} name\npaths: [${paths.join(', ')}]\ndepends_on: [${dependsOn.join(', ')}]\n---\nProse for ${id}.\n`;

const path = (name: string): string => `docs/architecture/components/${name}`;

describe('parseComponentsFromFiles — cross-file rules', () => {
  it('duplicate id across two files: duplicate-id issue, both records kept', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-05-first.md'), componentSrc('C-05', ['a/**'])],
        [path('C-05-second.md'), componentSrc('C-05', ['b/**'])],
      ]),
    );
    expect(result.components).toHaveLength(2);
    expect(result.issues).toEqual([
      {
        kind: 'duplicate-id',
        id: 'C-05',
        files: [path('C-05-first.md'), path('C-05-second.md')],
        message: `duplicate component id 'C-05' in ${path('C-05-first.md')} and ${path('C-05-second.md')}`,
      },
    ]);
  });

  it('dangling depends_on: structured issue naming file, field and the dangling id; edge preserved', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-01-core.md'), componentSrc('C-01', ['core/**'])],
        [path('C-02-ui.md'), componentSrc('C-02', ['ui/**'], ['C-01', 'C-99'])],
      ]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: 'dangling-reference',
        file: path('C-02-ui.md'),
        field: 'depends_on',
        id: 'C-99',
      }),
    ]);
    // never dropped: the edge stays on the record for placeholder rendering
    const ui = result.components.find((c) => c.id === 'C-02');
    expect(ui?.dependsOn).toEqual(['C-01', 'C-99']);
  });

  it('a malformed file does not stop the rest; references to it become dangling', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-01-broken.md'), '---\nid: "unterminated\n---\n'],
        [path('C-02-ui.md'), componentSrc('C-02', ['ui/**'], ['C-01'])],
        [path('C-03-ok.md'), componentSrc('C-03', ['ok/**'])],
      ]),
    );
    expect(result.components.map((c) => c.id)).toEqual(['C-02', 'C-03']);
    expect(result.issues).toEqual([
      expect.objectContaining({ kind: 'yaml-error', file: path('C-01-broken.md') }),
      expect.objectContaining({ kind: 'dangling-reference', id: 'C-01', file: path('C-02-ui.md') }),
    ]);
  });

  it('is deterministic: insertion order of the input does not matter', () => {
    const forward = new Map([
      [path('C-01-a.md'), componentSrc('C-01', ['a/**'])],
      [path('C-02-b.md'), componentSrc('C-02', ['b/**'], ['C-09'])],
    ]);
    const reversed = new Map([...forward.entries()].reverse());
    expect(parseComponentsFromFiles(reversed)).toEqual(parseComponentsFromFiles(forward));
  });
});

describe('parseComponentsFromFiles — ambiguous mapping (provable glob overlap)', () => {
  it('identical patterns in two components: ambiguous-mapping, first by id wins', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-10-late.md'), componentSrc('C-10', ['app/src/**'])],
        [path('C-05-early.md'), componentSrc('C-05', ['app/src/**'])],
      ]),
    );
    expect(result.issues).toEqual([
      {
        kind: 'ambiguous-mapping',
        ids: ['C-05', 'C-10'],
        files: [path('C-05-early.md'), path('C-10-late.md')],
        patterns: ['app/src/**', 'app/src/**'],
        message: expect.stringContaining("first by id, 'C-05', wins"),
      },
    ]);
  });

  it('a `P/**` glob overlaps anything declared under P, in either direction', () => {
    const contained = parseComponentsFromFiles(
      new Map([
        [path('C-05-umbrella.md'), componentSrc('C-05', ['app/src/**'])],
        [path('C-08-child.md'), componentSrc('C-08', ['app/src/board/Board.tsx'])],
      ]),
    );
    expect(contained.issues).toEqual([
      expect.objectContaining({
        kind: 'ambiguous-mapping',
        ids: ['C-05', 'C-08'],
        patterns: ['app/src/**', 'app/src/board/Board.tsx'],
      }),
    ]);

    const containedOtherWay = parseComponentsFromFiles(
      new Map([
        [path('C-05-child.md'), componentSrc('C-05', ['app/src/board/**'])],
        [path('C-08-umbrella.md'), componentSrc('C-08', ['app/src/**'])],
      ]),
    );
    expect(containedOtherWay.issues).toEqual([
      expect.objectContaining({
        kind: 'ambiguous-mapping',
        ids: ['C-05', 'C-08'],
        patterns: ['app/src/board/**', 'app/src/**'],
      }),
    ]);
  });

  it('winner is decided by NUMERIC id order (C-09 beats C-100)', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-100-big.md'), componentSrc('C-100', ['x/**'])],
        [path('C-09-small.md'), componentSrc('C-09', ['x/**'])],
      ]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ kind: 'ambiguous-mapping', ids: ['C-09', 'C-100'] }),
    ]);
  });

  it('leading ./ and / are normalized away for comparison; declared text is reported', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-01-a.md'), componentSrc('C-01', ['./app/src/**'])],
        [path('C-02-b.md'), componentSrc('C-02', ['app/src/tokens.css'])],
      ]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: 'ambiguous-mapping',
        patterns: ['./app/src/**', 'app/src/tokens.css'],
      }),
    ]);
  });

  it('disjoint globs, negated patterns and same-id pairs are never flagged', () => {
    const disjoint = parseComponentsFromFiles(
      new Map([
        [path('C-01-a.md'), componentSrc('C-01', ['app/a/**'])],
        [path('C-02-b.md'), componentSrc('C-02', ['app/b/**'])],
      ]),
    );
    expect(disjoint.issues).toEqual([]);

    const negated = parseComponentsFromFiles(
      new Map([
        [path('C-01-a.md'), componentSrc('C-01', ['app/**'])],
        [path('C-02-b.md'), componentSrc('C-02', ['"!app/legacy/**"'])],
      ]),
    );
    expect(negated.issues).toEqual([]);

    const sameId = parseComponentsFromFiles(
      new Map([
        [path('C-05-first.md'), componentSrc('C-05', ['a/**'])],
        [path('C-05-second.md'), componentSrc('C-05', ['a/**'])],
      ]),
    );
    // duplicate-id only — two files claiming one id is not a two-component ambiguity
    expect(sameId.issues.map((i) => i.kind)).toEqual(['duplicate-id']);
  });

  it('HONESTY PIN: overlap that needs a matcher or file tree is NOT guessed at parse time', () => {
    // 'app/src' (bare directory form) and 'app/src/**' DO overlap under
    // gitignore semantics, but proving it needs matching semantics the
    // parser deliberately does not implement (T-011's derivation owns
    // file-level mapping against the real tree, and reports through the
    // same ambiguous-mapping issue kind). The parser only flags overlap
    // it can prove from pattern text alone.
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-01-a.md'), componentSrc('C-01', ['app/src'])],
        [path('C-02-b.md'), componentSrc('C-02', ['app/src/**'])],
      ]),
    );
    expect(result.issues).toEqual([]);
  });
});

describe('isComponentFilePath and file-set filtering', () => {
  it('matches only direct C-*.md children of the components dir', () => {
    expect(isComponentFilePath('docs/architecture/components/C-01-core.md')).toBe(true);
    expect(isComponentFilePath('docs/architecture/components/C-100-x.md')).toBe(true);
    expect(isComponentFilePath('docs/architecture/components/notes.md')).toBe(false);
    expect(isComponentFilePath('docs/architecture/components/nested/C-01-x.md')).toBe(false);
    expect(isComponentFilePath('docs/architecture/C-01-core.md')).toBe(false);
    expect(isComponentFilePath('docs/tasks/T-001-x.md')).toBe(false);
    expect(isComponentFilePath('C-01-core.md')).toBe(false);
    expect(isComponentFilePath('other/C-01-core.md', 'other')).toBe(true);
  });

  it('ignores files that are not component inputs; honors componentsDir override', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-01-core.md'), componentSrc('C-01', ['core/**'])],
        [path('README.md'), 'not a component'],
        [path('nested/C-09-deep.md'), componentSrc('C-09', ['deep/**'])],
        ['docs/tasks/T-001-x.md', 'not a component'],
        ['C-02-toplevel.md', componentSrc('C-02', ['top/**'])],
      ]),
    );
    expect(result.components.map((c) => c.id)).toEqual(['C-01']);
    expect(result.issues).toEqual([]);

    const overridden = parseComponentsFromFiles(
      new Map([['arch/C-01-core.md', componentSrc('C-01', ['core/**'])]]),
      { componentsDir: 'arch' },
    );
    expect(overridden.components.map((c) => c.id)).toEqual(['C-01']);
  });

  it('hostile path names (__proto__, constructor) are inert map keys (ADR-009)', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-01-__proto__.md'), componentSrc('C-01', ['a/**'])],
        [path('C-02-constructor.md'), componentSrc('C-02', ['b/**'])],
        ['__proto__', 'not markdown'],
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.components.map((c) => c.id)).toEqual(['C-01', 'C-02']);
    expect(Object.prototype).not.toHaveProperty('polluted');
    expect(({} as Record<string, unknown>)['C-01']).toBeUndefined();
  });

  it('an input with no component files is a legal empty state, zero issues', () => {
    const result = parseComponentsFromFiles(new Map([['docs/STATE.md', '# State']]));
    expect(result).toEqual({ components: [], issues: [] });
  });
});

describe('parseComponentDirectory — disk layer', () => {
  const componentsDir = join(fixture('components-project'), 'docs', 'architecture', 'components');

  it('parses the fixture components with zero issues, in filename order', () => {
    const result = parseComponentDirectory(componentsDir);
    expect(result.issues).toEqual([]);
    expect(result.components.map((c) => c.id)).toEqual(['C-01', 'C-02', 'C-10']);
    expect(result.components[0]).toMatchObject({
      id: 'C-01',
      name: 'Core engine',
      layer: 'lib',
      status: 'done',
      touchSlugs: ['core'],
      decisions: ['ADR-001'],
    });
    expect(result.components[2]).toMatchObject({ id: 'C-10', dependsOn: ['C-01', 'C-02'] });
  });

  it('missing directory: io-error issue, never a throw', () => {
    const result = parseComponentDirectory(join(fixture('components-project'), 'nope'));
    expect(result.components).toEqual([]);
    expect(result.issues).toEqual([expect.objectContaining({ kind: 'io-error' })]);
  });

  it('mirrors parseComponentsFromFiles exactly on the same files', () => {
    const map = new Map<string, string>();
    for (const name of readdirSync(componentsDir)) {
      const abs = join(componentsDir, name);
      map.set(abs, readFileSync(abs, 'utf8'));
    }
    const fromFiles = parseComponentsFromFiles(map, { componentsDir });
    expect(fromFiles).toEqual(parseComponentDirectory(componentsDir));
  });
});

describe('project-level integration', () => {
  it('parseProject picks up components alongside tasks and features, zero issues', () => {
    const result = parseProject(fixture('components-project'));
    expect(result.issues).toEqual([]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-401']);
    expect(result.features.map((f) => f.id)).toEqual(['F-01']);
    expect(result.components?.map((c) => c.id)).toEqual(['C-01', 'C-02', 'C-10']);
  });

  it('a project without docs/architecture/components/ stays issue-free with components: []', () => {
    const result = parseProject(fixture('valid-project'));
    expect(result.issues).toEqual([]);
    expect(result.components).toEqual([]);
  });

  it('parseProjectFromFiles mirrors parseProject on the components fixture', () => {
    const root = fixture('components-project');
    const map = new Map<string, string>();
    map.set(join(root, 'docs', 'ROADMAP.md'), readFileSync(join(root, 'docs', 'ROADMAP.md'), 'utf8'));
    for (const dir of [['docs', 'tasks'], ['docs', 'architecture', 'components']]) {
      const abs = join(root, ...dir);
      for (const name of readdirSync(abs)) {
        map.set(join(abs, name), readFileSync(join(abs, name), 'utf8'));
      }
    }
    const fromFiles = parseProjectFromFiles(map, {
      tasksDir: join(root, 'docs', 'tasks'),
      roadmapFile: join(root, 'docs', 'ROADMAP.md'),
      componentsDir: join(root, 'docs', 'architecture', 'components'),
    });
    expect(fromFiles).toEqual(parseProject(root));
  });

  it('component issues surface in the project model after task and roadmap issues', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', '# R\n\n## Backbone\n- F-01: One — thing\n'],
        [path('C-01-a.md'), componentSrc('C-01', ['a/**'], ['C-77'])],
      ]),
    );
    expect(result.components?.map((c) => c.id)).toEqual(['C-01']);
    expect(result.issues).toEqual([
      expect.objectContaining({ kind: 'dangling-reference', id: 'C-77' }),
    ]);
  });

  it('a missing roadmap still yields parsed components alongside the io-error', () => {
    const result = parseProjectFromFiles(new Map([[path('C-01-a.md'), componentSrc('C-01', ['a/**'])]]));
    expect(result.components?.map((c) => c.id)).toEqual(['C-01']);
    expect(result.issues).toEqual([
      expect.objectContaining({ kind: 'io-error', file: 'docs/ROADMAP.md' }),
    ]);
  });
});
