import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
  PROCESS_SCHEMA,
  ProcessFinding,
  RUNTIME_TEMPLATE,
  SWITCH_FIELDS,
  SWITCH_TYPES,
  constraintFindings,
  parseProcessSchema,
  processLedger,
  processSection,
  processSettingsReader,
  resolveProcess,
  switchValue,
} from '../src/pure.js';

/**
 * THE PROCESS SETTINGS READER (T-317; the implementation is T-299's,
 * moved here out of the dispatch arm).
 *
 * EVERY IMPORT ABOVE IS FROM THE PUBLIC BROWSER ENTRY, not from the
 * module file — that is criterion 1's "a body SHALL exercise the public
 * browser entry", and it is the entry the app's webview and the arm both
 * read. A body that imported `../src/process-settings.js` would pass
 * while the barrel exported nothing.
 *
 * AND THE FIXTURES ARE TEXT, WHICH IS THE POINT OF THE MODULE. It reads
 * no file, so its own test holds no repository root either: the shipped
 * schema and the shipped template are read through this same reader by
 * `tools/e2e/tests/brief.spec.ts`, which is the suite that owns the live
 * tree. What is pinned here is the READING — every field, every refusal
 * and every constraint — against documents this file can show you.
 */

/** A whole, legal schema — two profiles, three switches, one of them floor. */
const FIXTURE = `version: 1

profiles:
  slow: "everything on"
  quick: "less of it"

switches:

  read.standing:
    type: choice
    values: [whole, index]
    what: "what every seat reads"
    effect: "the whole document, or the index and the pack"
    reads: processLedger
    needs: []
    floor: false
    band: [loop/token-budget-used]
    cost: "about 50K tokens per seat"
    profiles:
      slow: whole
      quick: index

  verify.bench:
    type: toggle
    values: [on, off]
    what: "the blind bench"
    effect: "a second seat re-derives the card"
    reads: benchPlan
    needs: ["on => read.standing=whole"]
    floor: false
    band: []
    cost: "about an hour a card"
    profiles:
      slow: on
      quick: off

  fence.write_hook:
    type: toggle
    values: [on, off]
    what: "the lane fence and its write hook"
    effect: "a write outside the fence is refused"
    reads: processLedger
    needs: []
    floor: true
    band: []
    cost: "nothing measurable"
    profiles:
      slow: on
      quick: on
`;

/** One `process:` section, spelled the way the runtime template spells it. */
const SECTION = `roles:
  builder: a-model
process:
  profile: quick
  available: [slow, quick]
  switches:
    verify.bench: on
`;

const fixture = () => parseProcessSchema(FIXTURE);

/** The refusal a call raised, or undefined — `expect().toThrow` cannot inspect the message AND the class. */
function refusal(run: () => unknown): Error | undefined {
  try {
    run();
    return undefined;
  } catch (err) {
    return err as Error;
  }
}

describe('the module is PURE, which is why it can live in the browser entry', () => {
  it('imports nothing at all — no node builtin, no dependency', () => {
    const src = readFileSync(fileURLToPath(new URL('../src/process-settings.ts', import.meta.url)), 'utf8');
    // KILLED BY: a `node:fs` read added for convenience, and by any
    // dependency at all — the app bundles this entry, and the arm's
    // `loadProcess` is where reading a file belongs.
    expect(src.match(/^\s*import\s/gm), 'the module imports something, so it is no longer pure').toBeNull();
    expect(src.includes('node:'), 'the module names a node builtin').toBe(false);
    // THE POSITIVE CONTROL: the same search over a module that DOES
    // import finds one, so the assertion above is not vacuous.
    const impure = readFileSync(fileURLToPath(new URL('../src/project.ts', import.meta.url)), 'utf8');
    expect(impure.match(/^\s*import\s/gm), 'the control module imports nothing either').not.toBeNull();
  });
});

describe('the schema parser', () => {
  it('reads a schema exactly as a real YAML parser does, field for field', () => {
    // KILLED BY: a hand parser that drops a field, one that keeps a
    // value's quotes, one that loses a flow list's last item, and one
    // that reads a switch's profile block off the wrong indent. The two
    // readings share no line of code, which is the whole point.
    const real = parseYaml(FIXTURE) as {
      version: number;
      profiles: Record<string, string>;
      switches: Record<string, Record<string, unknown>>;
    };
    const mine = parseProcessSchema(FIXTURE);
    expect(mine.version, 'the version disagrees').toBe(real.version);
    expect([...mine.profiles.keys()], 'the profile ids disagree').toEqual(Object.keys(real.profiles));
    expect([...mine.switches.keys()], 'the switch ids or their order disagree').toEqual(
      Object.keys(real.switches),
    );
    for (const [id, sw] of mine.switches) {
      const them = real.switches[id] as Record<string, unknown>;
      expect(sw.type, `${id}.type`).toBe(them['type']);
      expect(sw.values, `${id}.values`).toEqual(them['values']);
      expect(sw.what, `${id}.what`).toBe(them['what']);
      expect(sw.effect, `${id}.effect`).toBe(them['effect']);
      expect(sw.reads, `${id}.reads`).toBe(them['reads']);
      expect(sw.needs, `${id}.needs`).toEqual(them['needs']);
      expect(sw.floor, `${id}.floor`).toBe(them['floor'] === true);
      expect(sw.band, `${id}.band`).toEqual(them['band']);
      expect(sw.cost, `${id}.cost`).toBe(them['cost']);
      expect(Object.fromEntries(sw.profiles), `${id}.profiles`).toEqual(them['profiles']);
    }
  });

  it('reads a switch whole: quoting stripped, flow lists split, floor as a boolean', () => {
    const schema = fixture();
    expect([...schema.profiles.keys()]).toEqual(['slow', 'quick']);
    expect(schema.profiles.get('slow'), 'a quoted profile description kept its quotes').toBe('everything on');
    const sw = schema.switches.get('read.standing');
    expect(sw, 'the switch did not parse at all').toBeDefined();
    expect(sw?.values, 'the flow list lost an item').toEqual(['whole', 'index']);
    expect(sw?.what).toBe('what every seat reads');
    expect(sw?.floor, 'floor: false read as something other than false').toBe(false);
    expect(schema.switches.get('fence.write_hook')?.floor, 'floor: true did not read as true').toBe(true);
    expect(Object.fromEntries(sw?.profiles ?? []), 'the profile column is not the switch’s own').toEqual({
      slow: 'whole',
      quick: 'index',
    });
    expect(schema.switches.get('verify.bench')?.needs, 'a quoted need kept its quotes').toEqual([
      'on => read.standing=whole',
    ]);
    // A FLOW LIST OF ONE QUOTED ITEM CARRYING A COMMA stays one item —
    // the split is on the commas OUTSIDE the quotes.
    const commas = parseProcessSchema(FIXTURE.replace('band: [loop/token-budget-used]', 'band: ["a, b"]'));
    expect(commas.switches.get('read.standing')?.band, 'the split ate a quoted comma').toEqual(['a, b']);
  });

  it('REFUSES every shape it does not know, naming its own line number', () => {
    // KILLED BY: a parser that shrugs at a shape it does not know, which
    // is a parser that silently loses a switch. Each case is a different
    // mistake and each must be reported as itself.
    const cases: [string, string, string][] = [
      ['a field no switch declares', 'reads: processLedger', 'wrongly: yes', 'is not a field a switch declares'],
      ['a section the schema has no name for', 'profiles:\n  slow:', 'extras:\n  slow:', 'is not a section this schema declares'],
      ['an indent nobody knows', '    cost: "about 50K tokens per seat"', '       cost: "x"', 'this parser does not know'],
      ['a value on the switch’s own line', '  verify.bench:', '  verify.bench: on', 'carries a value on its own line'],
    ].map(([name, from, to, want]) => [name as string, FIXTURE.replace(from as string, to as string), want as string]);
    for (const [name, text, want] of cases) {
      const err = refusal(() => parseProcessSchema(text));
      expect(err, `${name}: parsed without a murmur`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `${name}: the refusal does not say what it found`).toContain(want);
      expect(err?.message, `${name}: the refusal does not name the file`).toContain(PROCESS_SCHEMA);
      expect(err?.message, `${name}: the refusal does not name a line`).toMatch(/line \d+/);
    }
    // THE POSITIVE CONTROL: the unedited fixture parses, so the cases
    // above are refused for their edit rather than for being fixtures.
    expect(fixture().switches.size, 'the control: the fixture parses whole').toBe(3);
  });

  it('REFUSES a switch that does not declare every field, naming the ones it is missing', () => {
    const err = refusal(() => parseProcessSchema(FIXTURE.replace('    cost: "about an hour a card"\n', '')));
    expect(err, 'a switch with a hole in it parsed').toBeInstanceOf(ProcessFinding);
    expect(err?.message, 'the refusal does not name the switch').toContain('verify.bench');
    expect(err?.message, 'the refusal does not name the missing field').toContain('cost');
    for (const f of SWITCH_FIELDS) {
      expect(err?.message, `the refusal does not list ${f} among the fields a switch answers`).toContain(f);
    }
  });

  it('REFUSES a reading that is empty, because an empty reading would be the arm running on memory', () => {
    for (const [name, text] of [
      ['no version', FIXTURE.replace('version: 1', 'version: 0')],
      ['no switches', FIXTURE.slice(0, FIXTURE.indexOf('switches:')) + 'switches:\n'],
    ] as [string, string][]) {
      const err = refusal(() => parseProcessSchema(text));
      expect(err, `${name}: an empty schema was accepted`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `${name}: the refusal does not say what it read`).toContain('which cannot be right');
    }
  });

  it('declares the two shapes a switch may take, and every switch it reads takes one of them', () => {
    expect([...SWITCH_TYPES], 'the shapes changed under the surfaces that render them').toEqual(['toggle', 'choice']);
    for (const sw of fixture().switches.values()) {
      expect(SWITCH_TYPES, `${sw.id} is a shape no surface knows how to render`).toContain(sw.type);
    }
  });
});

describe('the section reader', () => {
  it('reads the profile, the offered profiles and the departures', () => {
    const section = processSection(SECTION);
    expect(section?.profile).toBe('quick');
    expect(section?.available).toEqual(['slow', 'quick']);
    expect(Object.fromEntries(section?.overrides ?? []), 'the departure did not read').toEqual({
      'verify.bench': 'on',
    });
  });

  it('reads a departure only UNDER a switches key, and both spellings of an empty one mean none', () => {
    // KILLED BY: a reader that takes any four-space line for a departure,
    // and one that knows only the block spelling of an empty switches
    // key. The runtime template ships the BLOCK spelling with a comment
    // inside it, and `{}` is the same statement in flow form.
    const at = (text: string) => [...(processSection(text)?.overrides ?? [])];
    expect(
      at('process:\n  profile: quick\n  switches:\n    verify.bench: on\n'),
      'a departure under the block spelling did not read',
    ).toEqual([['verify.bench', 'on']]);
    expect(
      at('process:\n  profile: quick\n  switches: {}\n    verify.bench: on\n'),
      'a departure under the flow spelling did not read',
    ).toEqual([['verify.bench', 'on']]);
    expect(
      at('process:\n  profile: quick\n  available: [slow, quick]\n    verify.bench: on\n'),
      'a four-space line under no switches key at all was read as a departure',
    ).toEqual([]);
    // AND THE PROFILE READS IN ALL THREE, which is what says the cases
    // above differ in the departure and in nothing else.
    for (const text of [
      'process:\n  profile: quick\n  switches:\n',
      'process:\n  profile: quick\n  switches: {}\n',
      'process:\n  profile: quick\n',
    ]) {
      expect(processSection(text)?.profile, 'the profile did not read').toBe('quick');
      expect(at(text), 'a departure appeared from nowhere').toEqual([]);
    }
  });

  it('answers null for a template with no such section, and REFUSES one that names no profile', () => {
    // The two are different facts: a tree that predates the settings is
    // not a misconfiguration, while a section with no profile leaves the
    // loop with no column of the schema to resolve against.
    expect(processSection('roles:\n  builder: a-model\n'), 'a template with no section did not answer null').toBeNull();
    const err = refusal(() => processSection('process:\n  available: [slow, quick]\n'));
    expect(err, 'a section naming no profile resolved anyway').toBeInstanceOf(ProcessFinding);
    expect(err?.message, 'the refusal does not name the template').toContain(RUNTIME_TEMPLATE);
    expect(err?.message, 'the refusal does not name the key it wanted').toContain('profile');
  });
});

describe('the resolver', () => {
  const section = (profile: string, overrides: [string, string][] = []) => ({
    profile,
    available: [],
    overrides: new Map(overrides),
  });

  it('resolves a profile to its own column of the schema', () => {
    const schema = fixture();
    const slow = resolveProcess(schema, section('slow'));
    expect(slow.profile).toBe('slow');
    expect(slow.available, 'available is the SCHEMA’s profile set, not the section’s').toEqual(['slow', 'quick']);
    expect(switchValue(slow, 'read.standing')).toBe('whole');
    expect(switchValue(resolveProcess(schema, section('quick')), 'read.standing')).toBe('index');
    expect(slow.overridden.size, 'a resolution with no departures reported one').toBe(0);
  });

  it('lays a legal departure over the column and records it as a departure', () => {
    const settings = resolveProcess(fixture(), section('quick', [['verify.bench', 'on']]));
    expect(switchValue(settings, 'verify.bench'), 'the departure was not applied').toBe('on');
    expect([...settings.overridden], 'the departure was applied silently').toEqual(['verify.bench']);
  });

  it('REFUSES four different mistakes and reports each as itself', () => {
    // KILLED BY: a resolver that reports "invalid configuration", which
    // sends a reader to a settings screen with nothing to look at.
    const schema = fixture();
    const cases: [string, () => unknown, string[]][] = [
      ['a profile the schema does not declare', () => resolveProcess(schema, section('brisk')), ['brisk', 'slow, quick']],
      ['a departure on a switch nobody declares', () => resolveProcess(schema, section('quick', [['verify.nothing', 'on']])), ['verify.nothing', 'does not declare']],
      ['a departure outside the switch’s own values', () => resolveProcess(schema, section('quick', [['verify.bench', 'maybe']])), ['verify.bench', 'maybe', 'on, off']],
      ['a departure on a FLOOR switch', () => resolveProcess(schema, section('quick', [['fence.write_hook', 'off']])), ['fence.write_hook', 'FLOOR']],
    ];
    for (const [name, run, wants] of cases) {
      const err = refusal(run);
      expect(err, `${name}: resolved anyway`).toBeInstanceOf(ProcessFinding);
      for (const want of wants) {
        expect(err?.message, `${name}: the refusal does not name ${want}`).toContain(want);
      }
    }
    // THE POSITIVE CONTROL: the switchable one at the same value resolves.
    expect(
      switchValue(resolveProcess(schema, section('quick', [['verify.bench', 'on']])), 'verify.bench'),
      'the control: a non-floor switch takes a departure',
    ).toBe('on');
  });

  it('REFUSES an `available:` list that disagrees with the schema, in either direction', () => {
    const schema = fixture();
    const wider = refusal(() => resolveProcess(schema, { profile: 'quick', available: ['slow', 'quick', 'brisk'], overrides: new Map() }));
    expect(wider?.message, 'a template offering a profile the schema does not declare was accepted').toContain('brisk');
    const narrower = refusal(() => resolveProcess(schema, { profile: 'quick', available: ['quick'], overrides: new Map() }));
    expect(narrower?.message, 'a template hiding a profile that exists was accepted').toContain('slow');
    // THE POSITIVE CONTROL: the agreeing list resolves.
    expect(
      resolveProcess(schema, { profile: 'quick', available: ['slow', 'quick'], overrides: new Map() }).profile,
      'the control: an agreeing list resolves',
    ).toBe('quick');
  });

  it('REFUSES a column with a hole in it, and a value outside the switch’s own set', () => {
    const holed = parseProcessSchema(FIXTURE.replace('      slow: whole\n', ''));
    const hole = refusal(() => resolveProcess(holed, section('slow')));
    expect(hole?.message, 'a profile with no value at a switch resolved').toContain('names no value under the profile');
    const strayed = parseProcessSchema(FIXTURE.replace('      quick: index', '      quick: neither'));
    const stray = refusal(() => resolveProcess(strayed, section('quick')));
    expect(stray?.message, 'a value outside the set resolved').toContain('is not in its own value set');
  });

  it('resolves EVERY profile the schema declares, each satisfying its own constraints', () => {
    const schema = fixture();
    for (const profile of schema.profiles.keys()) {
      const settings = resolveProcess(schema, section(profile));
      expect(settings.values.size, `${profile} resolved to fewer switches than the schema declares`).toBe(
        schema.switches.size,
      );
      expect(constraintFindings(schema, settings), `${profile} contradicts itself`).toEqual([]);
    }
  });
});

describe('the accessor and the ledger', () => {
  it('REFUSES to read a switch the resolution dropped, rather than answering undefined', () => {
    const schema = fixture();
    const settings = resolveProcess(schema, { profile: 'slow', available: [], overrides: new Map() });
    const ignored = { ...settings, values: new Map([...settings.values].filter(([k]) => k !== 'verify.bench')) };
    const err = refusal(() => switchValue(ignored, 'verify.bench'));
    expect(err, 'a dropped switch read as undefined').toBeInstanceOf(ProcessFinding);
    expect(err?.message, 'the refusal does not name the switch').toContain('verify.bench');
    // AND THE LEDGER GOES THROUGH THE ACCESSOR: the loss is a throw, not
    // one row fewer that nobody would notice.
    expect(() => processLedger(schema, ignored), 'the ledger rendered without it').toThrow('verify.bench');
    // THE POSITIVE CONTROL: restored, the ledger is whole.
    expect(processLedger(schema, settings).length, 'the control: the ledger carries every switch').toBe(
      schema.switches.size,
    );
  });

  it('carries one row per switch in the schema’s own order, with the resolved value and the departures', () => {
    const schema = fixture();
    const settings = resolveProcess(schema, {
      profile: 'quick',
      available: [],
      overrides: new Map([['verify.bench', 'on']]),
    });
    const rows = processLedger(schema, settings);
    expect(rows.map((r) => r.id), 'the ledger is not in the schema’s order').toEqual([
      'read.standing',
      'verify.bench',
      'fence.write_hook',
    ]);
    const bench = rows[1];
    expect(bench?.value, 'the row does not carry the resolved value').toBe('on');
    expect(bench?.overridden, 'the departure is invisible in the ledger').toBe(true);
    expect(rows[0]?.overridden, 'a switch nobody departed from reads as a departure').toBe(false);
    expect(bench?.what).toBe('the blind bench');
    expect(bench?.effect).toBe('a second seat re-derives the card');
    expect(bench?.reads).toBe('benchPlan');
    expect(rows[2]?.floor, 'the floor is invisible in the ledger').toBe(true);
    expect(rows[0]?.band, 'the band column is not the switch’s own').toEqual(['loop/token-budget-used']);
    expect(rows[0]?.cost).toBe('about 50K tokens per seat');
  });
});

describe('the constraint findings', () => {
  it('name BOTH switches and BOTH values, because “invalid configuration” shows a reader nothing', () => {
    const schema = fixture();
    // `verify.bench: on` needs `read.standing=whole`, and quick reads the index.
    const settings = resolveProcess(schema, {
      profile: 'quick',
      available: [],
      overrides: new Map([['verify.bench', 'on']]),
    });
    const findings = constraintFindings(schema, settings);
    expect(findings.length, 'a combination the schema forbids was found clean').toBe(1);
    const [only] = findings;
    expect(only, 'the finding does not say what it is').toContain('FORBIDDEN COMBINATION');
    expect(only, 'the finding does not name the switch that is unsatisfied').toContain('verify.bench');
    expect(only, 'nor the one it needs').toContain('read.standing');
    expect(only, 'nor the value it holds').toContain('index');
    expect(only, 'nor the value it needs').toContain('whole');
    // THE POSITIVE CONTROL: the same pair, satisfied, is clean.
    expect(
      constraintFindings(schema, resolveProcess(schema, { profile: 'slow', available: [], overrides: new Map() })),
      'the control: the profile that satisfies the need is clean',
    ).toEqual([]);
  });

  it('report a need nobody can satisfy — a malformed one, and one on a switch the schema never declares', () => {
    const malformed = parseProcessSchema(
      FIXTURE.replace('needs: ["on => read.standing=whole"]', 'needs: ["on means whole"]'),
    );
    const bad = constraintFindings(
      malformed,
      resolveProcess(malformed, { profile: 'slow', available: [], overrides: new Map() }),
    );
    expect(bad.length, 'a need of no known form was read as satisfied').toBe(1);
    expect(bad[0], 'the finding does not quote the need').toContain('on means whole');
    const stray = parseProcessSchema(
      FIXTURE.replace('needs: ["on => read.standing=whole"]', 'needs: ["on => read.nothing=whole"]'),
    );
    const strayFindings = constraintFindings(
      stray,
      resolveProcess(stray, { profile: 'slow', available: [], overrides: new Map() }),
    );
    expect(strayFindings.length, 'a constraint on a switch nobody can set was read as satisfied').toBe(1);
    expect(strayFindings[0], 'the finding does not name the switch that does not exist').toContain('read.nothing');
  });

  it('read `*` as every value and `|` as alternatives, on both sides of the arrow', () => {
    const both = FIXTURE.replace('needs: ["on => read.standing=whole"]', 'needs: ["* => read.standing=whole|index"]');
    const schema = parseProcessSchema(both);
    for (const profile of ['slow', 'quick']) {
      expect(
        constraintFindings(schema, resolveProcess(schema, { profile, available: [], overrides: new Map() })),
        `${profile}: an alternative the need offers was refused`,
      ).toEqual([]);
    }
    // AND THE CONTROL, which is the same need with the held value removed
    // from the alternatives: `*` means the need is checked at EVERY value,
    // so it must now fail at both profiles rather than at neither.
    const narrowed = parseProcessSchema(
      FIXTURE.replace('needs: ["on => read.standing=whole"]', 'needs: ["* => read.standing=neither"]'),
    );
    for (const profile of ['slow', 'quick']) {
      expect(
        constraintFindings(narrowed, resolveProcess(narrowed, { profile, available: [], overrides: new Map() })).length,
        `${profile}: the control: a need satisfied by nothing was found clean`,
      ).toBe(1);
    }
  });
});

describe('the error class is a PARAMETER, which is what let the reader cross the package boundary', () => {
  it('raises the caller’s own class, so a caller that catches its own class still catches these', () => {
    // The arm's `ProcessFinding` is a `DispatchLaneFinding` on purpose —
    // the dispatch arm catches that class and reports a refusal rather
    // than crashing — and a class declared here cannot be one. So the
    // class travels the other way.
    class CallersFinding extends Error {}
    const reader = processSettingsReader({ Finding: CallersFinding });
    const err = refusal(() => reader.parseProcessSchema('nonsense\n'));
    expect(err, 'the bound reader did not refuse at all').toBeInstanceOf(CallersFinding);
    expect(err, 'the bound reader raised the library’s class instead of the caller’s').not.toBeInstanceOf(
      ProcessFinding,
    );
    // THE POSITIVE CONTROL: unbound, the same call raises the default.
    expect(refusal(() => parseProcessSchema('nonsense\n')), 'the control: the default class').toBeInstanceOf(
      ProcessFinding,
    );
  });

  it('binds every one of the six symbols, not only the one a body happened to try', () => {
    class CallersFinding extends Error {}
    const reader = processSettingsReader({ Finding: CallersFinding });
    const schema = reader.parseProcessSchema(FIXTURE);
    const settings = reader.resolveProcess(schema, { profile: 'slow', available: [], overrides: new Map() });
    const dropped = { ...settings, values: new Map() };
    expect(refusal(() => reader.processSection('process:\n  available: [slow]\n')), 'processSection').toBeInstanceOf(
      CallersFinding,
    );
    expect(
      refusal(() => reader.resolveProcess(schema, { profile: 'brisk', available: [], overrides: new Map() })),
      'resolveProcess',
    ).toBeInstanceOf(CallersFinding);
    expect(refusal(() => reader.switchValue(dropped, 'read.standing')), 'switchValue').toBeInstanceOf(CallersFinding);
    expect(refusal(() => reader.processLedger(schema, dropped)), 'processLedger').toBeInstanceOf(CallersFinding);
    expect(refusal(() => reader.constraintFindings(schema, dropped)), 'constraintFindings').toBeInstanceOf(
      CallersFinding,
    );
  });
});
