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
      // T-033: `non_code` is absent from this fixture and lands false. The
      // whole-record toEqual is what makes the field ADDITIVE-and-CHECKED
      // rather than additive-and-assumed: a default of `true`, or the key
      // never reaching the record, reds HERE.
      nonCode: false,
      responsibility:
        'Renders the story map board from the parsed model. Owns column layout,\ncard faces, slice line. Never writes.',
      extra: {},
      file: FILE,
    });
  });

  describe('non_code — opt-in, never inferred (T-033 decision 2)', () => {
    it('an explicit true is carried onto the record, and stops being an unknown key', () => {
      const withFlag = VALID.replace('status: auto', 'status: auto\nnon_code: true');
      const { component, issues } = parseComponentFile(withFlag, FILE);
      expect(issues).toEqual([]);
      expect(component?.nonCode).toBe(true);
      expect(component?.extra).toEqual({});
    });

    it('an explicit false is carried too, so the flag can be written down and denied', () => {
      const withFlag = VALID.replace('status: auto', 'status: auto\nnon_code: false');
      const { component, issues } = parseComponentFile(withFlag, FILE);
      expect(issues).toEqual([]);
      expect(component?.nonCode).toBe(false);
    });

    it('A NOT-YET-BUILT COMPONENT DOES NOT INFER IT — the C-15 property', () => {
      // The whole reason the flag is opt-in: a component whose globs match
      // nothing may be non-code OR simply unbuilt, and this parser could
      // not tell them apart even in principle — it never sees the graph.
      // Nothing about `paths` may move this field.
      const notYetBuilt = `---\nid: C-15\nname: Dispatch\npaths: [app/src-tauri/src/dispatch/**]\n---\nDeclared before it is a directory.\n`;
      const { component, issues } = parseComponentFile(notYetBuilt, FILE);
      expect(issues).toEqual([]);
      expect(component?.nonCode).toBe(false);
    });

    it('a NON-BOOLEAN is refused, never coerced — the string "false" is the trap', () => {
      // A truthy coercion reads `non_code: "false"` as TRUE, which is the
      // exact inversion this field must never make silently.
      for (const raw of ['"false"', '"true"', '0', '1', '[]']) {
        const bad = VALID.replace('status: auto', `status: auto\nnon_code: ${raw}`);
        const { component, issues } = parseComponentFile(bad, FILE);
        expect(issues, `non_code: ${raw} must be refused`).toHaveLength(1);
        expect(issues[0]?.message).toContain('non_code');
        expect(issues[0]?.message).toContain('opt-in and never inferred');
        // collect-don't-throw: the record still parses, with the flag off
        expect(component?.nonCode).toBe(false);
      }
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

describe('parseComponentFile — single-segment leading-slash paths (T-030, absorbing T-011-s4)', () => {
  const withPaths = (patterns: string[]): string =>
    `---\nid: C-08\nname: Board pane\npaths: [${patterns.map((p) => JSON.stringify(p)).join(', ')}]\n---\nProse.\n`;

  it('warns on `/dist`, names `dist/**` as the anchored idiom, and keeps the pattern', () => {
    // Used to parse silently: git reads `/dist` as root-only, but every
    // consumer strips the leading slash, and a single-segment pattern
    // without it is UNANCHORED — it claims `dist` at any depth, the
    // opposite of what was written.
    const { component, issues } = parseComponentFile(withPaths(['/dist']), FILE);
    expect(issues).toEqual([
      {
        kind: 'invalid-field',
        file: FILE,
        field: 'paths',
        message: expect.stringContaining("write 'dist/**' for the root-anchored form"),
      },
    ]);
    expect(issues[0]?.message).toContain('UNANCHORS it');
    // Flagging, not hiding or rewriting: record returned, pattern verbatim.
    expect(component?.paths).toEqual(['/dist']);
  });

  it('leaves anchored and unanchored patterns alone (only the losing shape warns)', () => {
    const quiet = ['app/src/**', 'dist', 'dist/**', '/app/src/**', '/a/b', './dist', '/'];
    expect(parseComponentFile(withPaths(quiet), FILE).issues).toEqual([]);
  });

  it('a trailing slash still loses the anchor; a negation carries its `!` into the suggestion', () => {
    const trailing = parseComponentFile(withPaths(['/dist/']), FILE);
    expect(trailing.issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', field: 'paths' }),
    ]);
    expect(trailing.issues[0]?.message).toContain("write 'dist/**'");

    const negated = parseComponentFile(withPaths(['app/**', '!/dist']), FILE);
    expect(negated.issues).toHaveLength(1);
    expect(negated.issues[0]?.message).toContain("write '!dist/**'");
  });

  it('one issue per offending pattern, in declared order', () => {
    const { issues } = parseComponentFile(withPaths(['/dist', 'app/**', '/build']), FILE);
    expect(issues.map((i) => ('field' in i ? i.field : ''))).toEqual(['paths', 'paths']);
    expect(issues[0]?.message).toContain('"/dist"');
    expect(issues[1]?.message).toContain('"/build"');
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

/**
 * T-076 — the comparator is TOTAL. `C-\d{2,}` bounds a digit run below and
 * never above, so a component file can carry a run of any length; the old
 * `Number(na) - Number(nb)` stopped being a comparison twice on the way up.
 *
 * The old body is reproduced here ONCE so "unchanged where it mattered" and
 * "changed where it was wrong" are both MEASURED relations between two
 * implementations rather than claims about one. It is the branch-point body
 * verbatim (lib/parser/src/component.ts:51-59 at e4a5ae7).
 */
const numericSubtraction = (a: string, b: string): number => {
  const pattern = /^C-(\d{2,})$/;
  const na = pattern.exec(a)?.[1];
  const nb = pattern.exec(b)?.[1];
  if (na !== undefined && nb !== undefined) {
    const diff = Number(na) - Number(nb);
    if (diff !== 0) return diff;
  }
  return a < b ? -1 : a > b ? 1 : 0;
};

describe('compareComponentIds — TOTAL for every input (T-076)', () => {
  it('agrees with the subtraction it replaces over every id a double can weigh', () => {
    // The range where `Number` is EXACT: up to 15 digits. Ordering for
    // every id this tree can hold lives here (the longest is C-14), and
    // the criterion asks for it PROVED, not asserted — so both bodies are
    // run over the same pairs and their SIGNS compared, rather than the
    // new one being compared to a table someone wrote out by hand.
    const runs = [
      '01', '05', '005', '0005', '08', '09', '10', '14', '50', '99', '100', '500',
      '000', '00', '0000000001', '999999999999999', '100000000000000',
    ];
    const ids = runs.map((r) => `C-${r}`);
    // Non-conforming ids exercise the fallback arm on both sides too.
    ids.push('C-1', 'X-01', 'C-08-board', 'c-08', '');
    let pairs = 0;
    for (const a of ids) {
      for (const b of ids) {
        expect(Math.sign(compareComponentIds(a, b))).toBe(Math.sign(numericSubtraction(a, b)));
        pairs += 1;
      }
    }
    expect(pairs).toBe(484); // 22 × 22 — the sweep is not vacuously empty
    // And the live registry's own order is byte-identical under both.
    const live = ['C-14', 'C-01', 'C-11', 'C-05', 'C-10', 'C-09'];
    expect([...live].sort(compareComponentIds)).toEqual([
      'C-01', 'C-05', 'C-09', 'C-10', 'C-11', 'C-14',
    ]);
    expect([...live].sort(compareComponentIds)).toEqual([...live].sort(numericSubtraction));
  });

  it('past ~309 digits the old body returned NaN; this one orders, in BOTH directions', () => {
    // Both digit runs overflow a double, so the old subtraction was
    // Infinity - Infinity = NaN, and `NaN !== 0` is TRUE — it RETURNED
    // that, never reaching its string fallback.
    const smaller = `C-1${'0'.repeat(400)}`; // 401 digits
    const larger = `C-2${'0'.repeat(400)}`; // 401 digits, same length
    expect(Number(smaller.slice(2))).toBe(Infinity);
    expect(Number(larger.slice(2))).toBe(Infinity);
    expect(numericSubtraction(smaller, larger)).toBeNaN();
    expect(numericSubtraction(larger, smaller)).toBeNaN();

    expect(compareComponentIds(smaller, larger)).toBeLessThan(0);
    expect(compareComponentIds(larger, smaller)).toBeGreaterThan(0);
    expect(compareComponentIds(larger, larger)).toBe(0);

    // The other direction of "past the range": different LENGTHS, where
    // longer-is-greater is the whole answer and 400 nines is the smaller.
    const long400 = `C-${'9'.repeat(400)}`;
    const long401 = `C-${'1'.repeat(401)}`;
    expect(numericSubtraction(long400, long401)).toBeNaN();
    expect(compareComponentIds(long400, long401)).toBeLessThan(0);
    expect(compareComponentIds(long401, long400)).toBeGreaterThan(0);
  });

  it('sorts huge ids to ONE order whichever order they arrive in', () => {
    // The harm the NaN did was not a wrong answer, it was NO answer:
    // `sort` may do anything with a NaN comparator and V8 leaves the pair
    // as it found it, so the result depended on file arrival order.
    const ids = [`C-3${'0'.repeat(400)}`, `C-1${'0'.repeat(400)}`, `C-2${'0'.repeat(400)}`];
    const expected = [`C-1${'0'.repeat(400)}`, `C-2${'0'.repeat(400)}`, `C-3${'0'.repeat(400)}`];
    expect([...ids].sort(compareComponentIds)).toEqual(expected);
    expect([...ids].reverse().sort(compareComponentIds)).toEqual(expected);
    // The old body: the two arrival orders disagree, which is the defect.
    expect([...ids].sort(numericSubtraction)).not.toEqual(
      [...ids].reverse().sort(numericSubtraction),
    );
  });

  it('CORRECTS the middle range too: fused neighbours of different lengths', () => {
    // Between 2^53 and Infinity the subtraction was not fatal, only wrong:
    // `Number` rounds these two to the same double, so the difference was
    // 0 and the STRING fallback decided — putting the 17-digit id after
    // the 18-digit one it is smaller than.
    const seventeenNines = `C-${'9'.repeat(17)}`;
    const eighteenDigits = `C-1${'0'.repeat(17)}`;
    expect(Number('9'.repeat(17))).toBe(Number(`1${'0'.repeat(17)}`));
    expect(numericSubtraction(seventeenNines, eighteenDigits)).toBeGreaterThan(0);
    expect(compareComponentIds(seventeenNines, eighteenDigits)).toBeLessThan(0);
  });

  it('inside one aliased slot the digits tie and string order decides — by construction', () => {
    // The property aliasedIdSlots's doc claims of the comparator it is
    // PASSED. It was false past ~309 digits, where the old body returned
    // NaN instead of reaching the fallback.
    expect(compareComponentIds('C-05', 'C-005')).toBeGreaterThan(0);
    expect(compareComponentIds('C-005', 'C-05')).toBeLessThan(0);
    expect(['C-05', 'C-005', 'C-0005'].sort(compareComponentIds)).toEqual([
      'C-0005',
      'C-005',
      'C-05',
    ]);
    const huge = '9'.repeat(400);
    expect(compareComponentIds(`C-${huge}`, `C-0${huge}`)).toBeGreaterThan(0);
    expect(numericSubtraction(`C-${huge}`, `C-0${huge}`)).toBeNaN();
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
    // MOVED AT T-076 (2026-08-19, executor claude-opus-5 @fresh), one
    // line: `space: 'component'`. T-076 criterion 3 makes `space` a
    // REQUIRED field on duplicate-id, as its sibling aliased-id gained at
    // T-053 — the kind spans three id spaces from four emit sites and the
    // only way to tell them apart was to read the prose. A required field
    // moves every whole-object pin on the kind by construction; this is
    // one of the three, listed in the card's notes. Changed, never
    // loosened: still a whole-object toEqual, every other assertion
    // byte-identical, and the pin now also asserts the discriminator.
    expect(result.issues).toEqual([
      {
        kind: 'duplicate-id',
        space: 'component',
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
    // No declared id shares C-99's slot, so the hint is ABSENT — not an
    // empty array. Absence is the ordinary case and means exactly one
    // thing (T-076 ruling 1).
    expect(result.issues[0]).not.toHaveProperty('nearMiss');
    expect(result.issues[0]?.message).not.toContain('zero padding');
  });

  it('a dangling depends_on that is a PADDING variant of a declared id names it (T-076)', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-001-core.md'), componentSrc('C-001', ['core/**'])],
        [path('C-02-ui.md'), componentSrc('C-02', ['ui/**'], ['C-01'])],
      ]),
    );
    // Still ONE dangling-reference and no new kind: C-01 genuinely is not
    // declared. What changes is that the message stops sending a reader
    // hunting a component that does not exist.
    expect(result.issues.map((i) => i.kind)).toEqual(['dangling-reference']);
    expect(result.issues[0]).toMatchObject({
      kind: 'dangling-reference',
      file: path('C-02-ui.md'),
      field: 'depends_on',
      id: 'C-01',
      nearMiss: ['C-001'],
    });
    expect(result.issues[0]?.message).toBe(
      `${path('C-02-ui.md')}: depends_on names 'C-01' but no component declares it — 'C-001' is declared and differs only in zero padding (edge preserved for placeholder rendering)`,
    );
  });

  it('names EVERY declared spelling when the registry is itself aliased', () => {
    // C-01 and C-001 both declared (an aliased slot, reported as such);
    // C-0001 references it. Naming one of the two would be a guess dressed
    // as a fix, so both are named, in model order.
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-01-a.md'), componentSrc('C-01', ['a/**'])],
        [path('C-001-b.md'), componentSrc('C-001', ['b/**'])],
        [path('C-99-c.md'), componentSrc('C-99', ['c/**'], ['C-0001'])],
      ]),
    );
    const dangling = result.issues.filter((i) => i.kind === 'dangling-reference');
    expect(dangling).toHaveLength(1);
    expect(dangling[0]).toMatchObject({ id: 'C-0001', nearMiss: ['C-001', 'C-01'] });
    expect(dangling[0]?.message).toContain(
      "'C-001', 'C-01' are declared and differ only in zero padding",
    );
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

describe('parseComponentsFromFiles — numerically aliased ids (T-030, absorbing T-008-s3)', () => {
  it('C-05 and C-005 are one slot spelled twice: one aliased-id issue, both records kept', () => {
    // Used to parse with ZERO issues: the strings differ, so nothing is a
    // duplicate — yet compareComponentIds finds no numeric difference, so
    // "first by id order wins" is decided by string comparison alone.
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-05-app.md'), componentSrc('C-05', ['app/**'])],
        [path('C-005-padded.md'), componentSrc('C-005', ['lib/**'])],
      ]),
    );
    // TIGHTENED AT T-053 (2026-08-17, executor claude-opus-5 @fresh), one
    // line: `space: 'component'`. T-053 criterion 5 requires the issue to
    // say WHICH id space aliased — three spaces are checked now — and both
    // shapes it offers (a field, or three kinds) change the object this
    // whole-object toEqual asserts, so its criterion 1 ("these pins pass
    // untouched") cannot hold jointly with its criterion 5. The field shape
    // disturbs exactly this pin; three kinds would have disturbed three.
    // Changed, never loosened: every other assertion here is byte-identical
    // and the pin now also asserts the discriminator. The DETECTION
    // behaviour is untouched — the other three T-030 alias pins pass
    // byte-unedited, 2^53 case included.
    expect(result.issues).toEqual([
      {
        kind: 'aliased-id',
        space: 'component',
        ids: ['C-005', 'C-05'], // comparator order: numeric tie → string order
        files: [path('C-005-padded.md'), path('C-05-app.md')],
        message: expect.stringContaining('numerically equal component ids'),
      },
    ]);
    expect(result.issues[0]?.message).toContain("'C-005'");
    expect(result.issues[0]?.message).toContain("'C-05'");
    expect(result.issues[0]?.message).toContain('zero-padding aliases one registry slot');
    // Flagging, not hiding: both components stay on the map.
    expect(result.components.map((c) => c.id)).toEqual(['C-005', 'C-05']);
  });

  it('ONE issue per slot, not one per pair — three spellings of one slot report once', () => {
    const result = parseComponentsFromFiles(
      new Map([
        [path('C-05-a.md'), componentSrc('C-05', ['a/**'])],
        [path('C-005-b.md'), componentSrc('C-005', ['b/**'])],
        [path('C-0005-c.md'), componentSrc('C-0005', ['c/**'])],
      ]),
    );
    const aliased = result.issues.filter((i) => i.kind === 'aliased-id');
    expect(aliased).toHaveLength(1);
    expect(aliased[0]).toMatchObject({ ids: ['C-0005', 'C-005', 'C-05'] });
  });

  it("the slot's OWN ids array is ordered past the double range too (T-076)", () => {
    // T-053 passes compareComponentIds into aliasedIdSlots, so this array
    // and the order the spellings are named in the message were decided by
    // the same NaN: `sort` kept whatever order the sorted PATHS delivered.
    // Same ids, two file namings, one answer — which is the whole claim.
    const huge = '9'.repeat(400);
    const byPathOne = parseComponentsFromFiles(
      new Map([
        [path('C-aaa.md'), componentSrc(`C-${huge}`, ['a/**'])],
        [path('C-zzz.md'), componentSrc(`C-0${huge}`, ['b/**'])],
      ]),
    );
    const byPathTwo = parseComponentsFromFiles(
      new Map([
        [path('C-aaa.md'), componentSrc(`C-0${huge}`, ['a/**'])],
        [path('C-zzz.md'), componentSrc(`C-${huge}`, ['b/**'])],
      ]),
    );
    const idsOf = (r: ReturnType<typeof parseComponentsFromFiles>): string[] => {
      const issue = r.issues.find((i) => i.kind === 'aliased-id');
      return issue !== undefined && issue.kind === 'aliased-id' ? issue.ids : [];
    };
    // String order inside the slot: the padded spelling sorts first.
    expect(idsOf(byPathOne)).toEqual([`C-0${huge}`, `C-${huge}`]);
    expect(idsOf(byPathTwo)).toEqual([`C-0${huge}`, `C-${huge}`]);
    // …and the message names them in that same order, padded one first.
    // `'C-<nines>'` cannot occur inside `'C-0<nines>'` (the quote pins the
    // start), so both offsets are unambiguous.
    const message = byPathOne.issues[0]?.message ?? '';
    const paddedAt = message.indexOf(`'C-0${huge}'`);
    const bareAt = message.indexOf(`'C-${huge}'`);
    expect(paddedAt).toBeGreaterThanOrEqual(0);
    expect(bareAt).toBeGreaterThan(paddedAt);
  });

  it('distinct slots and an exact duplicate stay out of it (one fixture, one violation)', () => {
    const distinct = parseComponentsFromFiles(
      new Map([
        [path('C-05-a.md'), componentSrc('C-05', ['a/**'])],
        [path('C-50-b.md'), componentSrc('C-50', ['b/**'])],
        [path('C-500-c.md'), componentSrc('C-500', ['c/**'])],
      ]),
    );
    expect(distinct.issues).toEqual([]);

    // The same id twice is duplicate-id's business, never aliased-id's.
    const dup = parseComponentsFromFiles(
      new Map([
        [path('C-05-a.md'), componentSrc('C-05', ['a/**'])],
        [path('C-05-b.md'), componentSrc('C-05', ['b/**'])],
      ]),
    );
    expect(dup.issues.map((i) => i.kind)).toEqual(['duplicate-id']);
  });

  it('slot equality is textual, so ids past 2^53 do not collide by floating point', () => {
    const big = '9007199254740993'; // 2^53 + 1 — Number() cannot tell these apart
    const other = '9007199254740992';
    const result = parseComponentsFromFiles(
      new Map([
        [path(`C-${big}-a.md`), componentSrc(`C-${big}`, ['a/**'])],
        [path(`C-${other}-b.md`), componentSrc(`C-${other}`, ['b/**'])],
      ]),
    );
    expect(result.issues).toEqual([]);
    // ...while a zero-padded spelling of the same huge id still aliases.
    const padded = parseComponentsFromFiles(
      new Map([
        [path(`C-${big}-a.md`), componentSrc(`C-${big}`, ['a/**'])],
        [path(`C-0${big}-b.md`), componentSrc(`C-0${big}`, ['b/**'])],
      ]),
    );
    expect(padded.issues.map((i) => i.kind)).toEqual(['aliased-id']);
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

  it('the DECLARED WINNER is id order at EVERY id length, never file order (T-096)', () => {
    // T-076 fixed `compareComponentIds` and pinned `compareComponentIds`.
    // The property that fix exists to protect lives one layer out, at the
    // CONSUMER: the winner this issue DECLARES — "first by id, '<id>',
    // wins file mapping" — is the smaller id however long the digit run.
    // The sort site is `compareComponentIds(a.id, b.id) || <file order>`,
    // and `NaN` IS FALSY, so the moment the comparator cannot weigh two
    // ids numerically the tiebreak swallows the NaN and the declared
    // winner silently becomes the id in the first-sorting FILE —
    // deterministic, reproducible, and wrong. Every other pin on this
    // issue uses two- and three-digit ids, where the branch-point and the
    // fixed comparator agree on every pair, so none of them can tell the
    // two bodies apart.
    //
    // ONE ARRANGEMENT CANNOT SAY THIS. The same two ids are parsed TWICE
    // with the spellings swapped between two file names that sort in
    // OPPOSITE orders, so an implementation that answers with the file
    // order agrees with only one of the two runs. The digits are chosen so
    // STRING order also DISAGREES with id order ('9…' sorts after '1…'
    // while 400 digits are fewer than 401), which makes this discriminate
    // a fall-through to the string fallback as well as the file tiebreak.
    //
    // ITS TWIN ON THE OTHER CONSUMER of this comparator is the body
    // "the slot's OWN ids array is ordered past the double range too
    // (T-076)" above. That one T-076 built; this one it did not, which is
    // why a mutant restoring the pre-T-076 comparator AT THIS SORT SITE
    // ALONE survived the entire suite.
    const smaller = `C-${'9'.repeat(400)}`; // 400 digits
    const larger = `C-${'1'.repeat(401)}`; // 401 digits — the longer run is greater
    const declared = (
      inAaa: string,
      inZzz: string,
    ): { ids: string[]; files: string[]; message: string } => {
      const result = parseComponentsFromFiles(
        new Map([
          // Identical patterns: the overlap is provable from the pattern
          // text alone, so nothing here depends on glob semantics.
          [path('C-aaa.md'), componentSrc(inAaa, ['app/src/**'])],
          [path('C-zzz.md'), componentSrc(inZzz, ['app/src/**'])],
        ]),
      );
      const ambiguous = result.issues.filter((i) => i.kind === 'ambiguous-mapping');
      expect(ambiguous).toHaveLength(1);
      const issue = ambiguous[0];
      return issue !== undefined && issue.kind === 'ambiguous-mapping'
        ? { ids: issue.ids, files: issue.files, message: issue.message }
        : { ids: [], files: [], message: '' };
    };

    const smallerInFirstFile = declared(smaller, larger);
    const smallerInLastFile = declared(larger, smaller);

    // A POSITIVE CONTROL that these really are two different arrangements
    // and not the same one run twice: the WINNER'S FILE moves between the
    // runs. Without it a fixture that quietly stopped swapping would leave
    // both assertions below passing for the wrong reason.
    expect(smallerInFirstFile.files).toEqual([path('C-aaa.md'), path('C-zzz.md')]);
    expect(smallerInLastFile.files).toEqual([path('C-zzz.md'), path('C-aaa.md')]);

    // …and the winning ID does not move.
    expect(smallerInFirstFile.ids).toEqual([smaller, larger]);
    expect(smallerInLastFile.ids).toEqual([smaller, larger]);

    // The structured field and the SENTENCE a human acts on cannot
    // disagree about who won.
    expect(smallerInFirstFile.message).toContain(`first by id, '${smaller}', wins file mapping`);
    expect(smallerInLastFile.message).toContain(`first by id, '${smaller}', wins file mapping`);
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
