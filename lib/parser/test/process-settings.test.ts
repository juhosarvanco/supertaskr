import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
  DISPATCH_BLOCK_FIELDS,
  DISPATCH_DECLARATION,
  DISPATCH_FIELD_ATTRIBUTES,
  DISPATCH_MAP_SHAPE,
  DISPATCH_MODE_FIELDS,
  DISPATCH_MODE_SHAPE,
  DISPATCH_REQUIREMENTS,
  DISPATCH_SHAPES,
  DISPATCH_UNTIL_VALUE,
  IMPLEMENTATIONS,
  PROCESS_SCHEMA,
  ProcessFinding,
  RUNTIME_TEMPLATE,
  SWITCH_FIELDS,
  SWITCH_TYPES,
  constraintFindings,
  dispatchBlock,
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

/**
 * A whole, legal schema — two profiles, three switches, one of them floor,
 * and one of each implementation label so a body can tell them apart.
 */
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
    implementation: manual
    manualAction: "every seat reads the set the adapter names before it works"
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
    implementation: operational
    manualAction: ""
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
    implementation: declarative
    manualAction: ""
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

/* ── THE DISPATCH BLOCK (T-319) ───────────────────────────────────────
 *
 * The declaration below is this file's OWN, and it deliberately does not
 * spell the values the shipped schema spells: its approval mode reads
 * `ask, until, standing` and its recovery `refuse, repair`. A fixture that
 * shared the shipped words would pass whether the reader read the
 * declaration or carried the words itself (T-210) — here the no-grant
 * state can only be `ask`/`refuse` if the reader took it from the
 * declaration. What the SHIPPED schema declares is pinned where the
 * shipped tree lives, in the end-to-end suite.
 * ──────────────────────────────────────────────────────────────────── */

/** The dispatch block's declaration, whole and legal, for this file's own schema. */
const DECLARATION = `dispatch_block:
  key: dispatch
  what: "the approval mode, the recovery policy and the grant that sets them"
  effect: "a seat inherits the approval from the template rather than from prose"
  reads: dispatchBlock
  fields:
    approval:
      required: always
      shape: mode
      values: [ask, until, standing]
      absent: ask
      advisory: false
      implementation: declarative
      what: "when work starts"
    recovery:
      required: always
      shape: mode
      values: [refuse, repair]
      absent: refuse
      advisory: false
      implementation: declarative
      what: "whether a repair may be dispatched"
    grant:
      required: always
      shape: map
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "the approval itself"
    grant.given_by:
      required: with-parent
      shape: text
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "who gave it"
    grant.at:
      required: with-parent
      shape: instant
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "when it was given"
    grant.revision:
      required: with-parent
      shape: revision
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "the revision that decides which grant is current"
    grant.order:
      required: with-parent
      shape: card-ids
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "the approved cards in dispatch order"
    grant.until:
      required: with-until
      shape: card-id
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "the card the grant runs up to"
    grant.cards:
      required: with-parent
      shape: card-blobs
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "each card at the blob it was approved at"
    revoked:
      required: optional
      shape: map
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "the dated revocation"
    revoked.at:
      required: with-parent
      shape: instant
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "when it was revoked"
    revoked.by:
      required: with-parent
      shape: text
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "who revoked it"
    limits:
      required: optional
      shape: map
      values: []
      absent: ""
      advisory: true
      implementation: declarative
      what: "the ceilings, enforced by nothing"
    limits.tokens:
      required: with-parent
      shape: token-ceilings
      values: []
      absent: ""
      advisory: true
      implementation: declarative
      what: "a ceiling per provider"
    limits.expires_at:
      required: with-parent
      shape: instant
      values: []
      absent: ""
      advisory: true
      implementation: declarative
      what: "when the grant expires"
    history:
      required: always
      shape: grants
      values: []
      absent: ""
      advisory: false
      implementation: declarative
      what: "every earlier grant in order"
`;

/** The schema fixture above, with the dispatch block's declaration in it. */
const DISPATCH_FIXTURE = FIXTURE.replace('\nswitches:\n', `\n${DECLARATION}\nswitches:\n`);

/**
 * A BLOB SHA PER CARD ENTRY, AND EVERY ONE OF THEM DIFFERENT — five
 * entries, five shas, so that every anchor a body edits below matches
 * ONE site. An ambiguous anchor is how a mutant lands somewhere nobody
 * meant, and a fixture that repeats a value invites one. Each one also
 * carries a hex LETTER, because a sha of forty digits is a NUMBER to a
 * real YAML parser and the body below compares the two readings.
 */
const BLOB_ONE = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678';
const BLOB_TWO = 'b2c3d4e5f60718293a4b5c6d7e8f90123456789a';
const BLOB_THREE = 'c3d4e5f60718293a4b5c6d7e8f90123456789ab1';
const BLOB_FOUR = 'd4e5f60718293a4b5c6d7e8f90123456789abc12';
const BLOB_FIVE = 'e5f60718293a4b5c6d7e8f90123456789abcd123';

/**
 * A WHOLE, LEGAL BLOCK — and the dates are laid out to make the
 * revision the only thing that can decide which grant is current: the
 * grant at revision 3 is dated 09:30, the earlier grant at revision 1 is
 * dated 23:45 THE SAME DAY, and the one at revision 2 is dated the day
 * BEFORE. Any reader that sorted by date would answer differently than
 * this one, in two different directions.
 */
const BLOCK = `roles:
  builder: a-model
dispatch:
  approval: until
  recovery: repair
  grant:
    given_by: "the owner"
    at: "2026-09-14T09:30:00Z"
    revision: 3
    order: [T-1, T-2]
    until: T-2
    cards:
      T-1: ${BLOB_ONE}
      T-2: ${BLOB_TWO}
  limits:
    tokens:
      a-provider: 500000
    expires_at: "2026-09-20T00:00:00Z"
  history:
    - given_by: "the first owner"
      at: "2026-09-14T23:45:00Z"
      revision: 1
      order: [T-1]
      cards:
        T-1: ${BLOB_THREE}
    - given_by: "the second owner"
      at: "2026-09-13T08:00:00Z"
      revision: 2
      order: [T-1, T-2]
      until: T-1
      cards:
        T-1: ${BLOB_FOUR}
        T-2: ${BLOB_FIVE}
process:
  profile: quick
  available: [slow, quick]
  switches:
    verify.bench: on
`;

/** The same template with no dispatch block at all — every other section untouched. */
const NO_BLOCK = `${BLOCK.slice(0, BLOCK.indexOf('dispatch:'))}${BLOCK.slice(BLOCK.indexOf('process:'))}`;

/** This file's schema, with the dispatch block declared. */
const dispatchSchema = () => parseProcessSchema(DISPATCH_FIXTURE);

/** One block read against this file's own declaration. */
const readBlock = (text: string) => dispatchBlock(text, dispatchSchema());

/** The refusal one edit to the legal block raises, with the edit proved to have changed something. */
function blockRefusal(from: string, to: string): Error | undefined {
  const text = BLOCK.replace(from, to);
  expect(text, `the edit ${JSON.stringify(from)} -> ${JSON.stringify(to)} changed nothing`).not.toBe(BLOCK);
  return refusal(() => readBlock(text));
}


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

  it('REFUSES a label it does not know, a manual row with no action, and an action on a row that is not manual', () => {
    // T-299-s6 criterion 1. KILLED BY: a parser that accepts any string
    // as the label (a settings screen would then render a word no
    // surface knows how to read), one that lets a manual row ship
    // without the instruction that is the whole point of the label, and
    // one that lets a non-manual row carry an instruction nobody has to
    // follow. Each is a different mistake and each is reported as
    // itself, naming the switch.
    const cases: [string, string, string, string][] = [
      [
        'a label outside the set',
        'implementation: declarative',
        'implementation: aspirational',
        'which is not one of',
      ],
      [
        'a label the author left blank',
        '    implementation: manual\n',
        '    implementation:\n',
        'which is not one of',
      ],
      [
        'a manual row with an empty action',
        'manualAction: "every seat reads the set the adapter names before it works"',
        'manualAction: ""',
        'owes the instruction',
      ],
      [
        'a manual action that is only whitespace',
        'manualAction: "every seat reads the set the adapter names before it works"',
        'manualAction: "   "',
        'owes the instruction',
      ],
      [
        'an action on a row that is not manual',
        '    implementation: declarative\n    manualAction: ""',
        '    implementation: declarative\n    manualAction: "go and do something about it"',
        'Only a manual row names an action',
      ],
    ];
    for (const [name, from, to, want] of cases) {
      const text = FIXTURE.replace(from, to);
      expect(text, `${name}: the edit changed nothing, so this case measures nothing`).not.toBe(FIXTURE);
      const err = refusal(() => parseProcessSchema(text));
      expect(err, `${name}: the schema parsed without a murmur`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `${name}: the refusal does not say what it found`).toContain(want);
      expect(err?.message, `${name}: the refusal does not name the file`).toContain(PROCESS_SCHEMA);
    }
    // A MISSING LABEL IS THE FIFTH MISTAKE AND IT IS THE FIELD CHECK'S,
    // which is what makes the two fields fields rather than decoration:
    // a row that declares neither is a row with a hole in it.
    for (const missing of ['    implementation: manual\n', '    manualAction: "every seat reads the set the adapter names before it works"\n']) {
      const err = refusal(() => parseProcessSchema(FIXTURE.replace(missing, '')));
      expect(err, `a switch missing ${missing.trim()} parsed`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, 'the refusal does not name the switch').toContain('read.standing');
      expect(err?.message, 'the refusal does not name the missing field').toContain(
        missing.trim().split(':')[0] as string,
      );
    }
    // THE POSITIVE CONTROL: unedited, the fixture parses and each row
    // reads back the label it declares — so every refusal above is for
    // its own edit rather than for the fixture being a fixture.
    const read = fixture();
    expect(
      [...read.switches.values()].map((sw) => `${sw.id}=${sw.implementation}`),
      'the control: the labels do not read back off an unedited schema',
    ).toEqual(['read.standing=manual', 'verify.bench=operational', 'fence.write_hook=declarative']);
    expect(
      read.switches.get('read.standing')?.manualAction,
      'the control: a manual row carries its instruction through the reader',
    ).toBe('every seat reads the set the adapter names before it works');
    expect(
      [...read.switches.values()].filter((sw) => sw.implementation !== 'manual').map((sw) => sw.manualAction),
      'the control: a row that is not manual carries no action',
    ).toEqual(['', '']);
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

  it('binds every one of the seven symbols, not only the one a body happened to try', () => {
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
    // The schema here is the one with NO `dispatch_block:` section, so the
    // refusal is `dispatchBlock`'s own rather than the schema parser's.
    expect(
      refusal(() => reader.dispatchBlock(BLOCK, schema)),
      'dispatchBlock',
    ).toBeInstanceOf(CallersFinding);
  });
});

/* ── THE DISPATCH BLOCK'S DECLARATION (T-319, criterion 1) ────────────
 *
 * The block is declared ONCE, here in the schema, and every body below
 * is written against the DECLARATION rather than against the words this
 * project happens to use: the fixture's own approval mode reads `ask`
 * and its recovery `refuse`, which the shipped schema never says.
 * ──────────────────────────────────────────────────────────────────── */

describe('the dispatch block declaration', () => {
  it('reads the declaration exactly as a real YAML parser does, field for field', () => {
    // KILLED BY: a parser that drops an attribute, one that keeps a
    // value's quotes, one that loses a flow list's last item and one
    // that reads a row off the wrong indent. The two readings share no
    // line of code.
    const real = (parseYaml(DISPATCH_FIXTURE) as { dispatch_block: Record<string, unknown> })
      .dispatch_block;
    const mine = dispatchSchema().dispatch;
    expect(mine, 'the declaration did not parse at all').not.toBeNull();
    for (const key of ['key', 'what', 'effect', 'reads']) {
      expect((mine as unknown as Record<string, unknown>)[key], `dispatch_block.${key}`).toBe(
        (real as Record<string, unknown>)[key],
      );
    }
    const theirs = real['fields'] as Record<string, Record<string, unknown>>;
    const fields = (mine as NonNullable<typeof mine>).fields;
    expect([...fields.keys()], 'the field ids or their order disagree').toEqual(Object.keys(theirs));
    for (const [id, row] of fields) {
      const them = theirs[id] as Record<string, unknown>;
      expect(row.required, `${id}.required`).toBe(them['required']);
      expect(row.shape, `${id}.shape`).toBe(them['shape']);
      expect(row.values, `${id}.values`).toEqual(them['values']);
      expect(row.absent, `${id}.absent`).toBe(them['absent']);
      expect(row.advisory, `${id}.advisory`).toBe(them['advisory'] === true);
      expect(row.implementation, `${id}.implementation`).toBe(them['implementation']);
      expect(row.what, `${id}.what`).toBe(them['what']);
    }
  });

  it('reads every row whole: its requirement, its shape, its value set, its absent value and its label', () => {
    const decl = dispatchSchema().dispatch as NonNullable<ReturnType<typeof dispatchSchema>['dispatch']>;
    expect(decl.key, 'the template key the declaration names').toBe('dispatch');
    expect(decl.reads, 'the symbol the declaration names as its reader').toBe('dispatchBlock');
    const approval = decl.fields.get('approval');
    expect(approval?.required, 'approval.required').toBe('always');
    expect(approval?.shape, 'approval.shape').toBe(DISPATCH_MODE_SHAPE);
    expect(approval?.values, 'approval.values — the flow list lost an item').toEqual([
      'ask',
      DISPATCH_UNTIL_VALUE,
      'standing',
    ]);
    expect(approval?.absent, 'approval.absent — the quoting or the value').toBe('ask');
    expect(approval?.advisory, 'approval.advisory — false read as something else').toBe(false);
    expect(decl.fields.get('limits.tokens')?.advisory, 'limits.tokens is where advisory lives').toBe(true);
    expect(decl.fields.get('grant.until')?.required, 'grant.until.required').toBe('with-until');
    expect(decl.fields.get('revoked')?.required, 'revoked.required').toBe('optional');
    expect(decl.fields.get('grant')?.shape, 'grant.shape').toBe(DISPATCH_MAP_SHAPE);
    expect(decl.fields.get('history')?.shape, 'history.shape').toBe('grants');
    expect(
      [...decl.fields.values()].map((row) => row.implementation),
      'every row of the declaration carries a label this reader knows',
    ).toEqual([...decl.fields.values()].map(() => 'declarative'));
    for (const row of decl.fields.values()) {
      expect(DISPATCH_REQUIREMENTS, `${row.id}: a requirement no reader knows`).toContain(row.required);
      expect(DISPATCH_SHAPES, `${row.id}: a shape no reader knows`).toContain(row.shape);
      expect(IMPLEMENTATIONS, `${row.id}: a label no surface knows`).toContain(row.implementation);
    }
  });

  it('answers NULL for a schema that declares no dispatch block, rather than inventing one', () => {
    // A schema that predates the section is a project whose template has
    // no block to declare, and that is not a misconfiguration. What is
    // refused is READING a block against it, which `dispatchBlock` does.
    expect(fixture().dispatch, 'a schema with no section invented a declaration').toBeNull();
    // THE POSITIVE CONTROL: the same parser over the same fixture WITH
    // the section reads one, so the assertion above is not vacuous.
    expect(dispatchSchema().dispatch, 'the control: the declared section did not read').not.toBeNull();
  });

  it('REFUSES a row that does not declare every attribute, naming the ones it is missing', () => {
    for (const attribute of DISPATCH_FIELD_ATTRIBUTES) {
      const line = `      ${attribute}: `;
      const at = DISPATCH_FIXTURE.indexOf(line);
      expect(at, `the fixture carries no \`${attribute}\` line to remove`).toBeGreaterThan(-1);
      const end = DISPATCH_FIXTURE.indexOf('\n', at) + 1;
      const text = DISPATCH_FIXTURE.slice(0, at) + DISPATCH_FIXTURE.slice(end);
      const err = refusal(() => parseProcessSchema(text));
      expect(err, `a row missing \`${attribute}\` parsed`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `the refusal does not name the missing \`${attribute}\``).toContain(attribute);
      expect(err?.message, 'the refusal does not name the file').toContain(PROCESS_SCHEMA);
    }
    // THE POSITIVE CONTROL: unedited, every row parses.
    expect(dispatchSchema().dispatch?.fields.size, 'the control: the declaration parses whole').toBe(16);
  });

  it('REFUSES a requirement, a shape or a label outside its own closed set', () => {
    const cases: [string, string, string, string][] = [
      ['a requirement nobody knows', 'required: with-until', 'required: when-it-suits', 'which is not one of'],
      ['a shape nobody knows', 'shape: card-blobs', 'shape: whatever', 'which is not one of'],
      ['a label nobody knows', 'implementation: declarative\n      what: "the approval itself"', 'implementation: aspirational\n      what: "the approval itself"', 'which is not one of'],
    ];
    for (const [name, from, to, want] of cases) {
      const text = DISPATCH_FIXTURE.replace(from, to);
      expect(text, `${name}: the edit changed nothing`).not.toBe(DISPATCH_FIXTURE);
      const err = refusal(() => parseProcessSchema(text));
      expect(err, `${name}: the declaration parsed without a murmur`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `${name}: the refusal does not say what it found`).toContain(want);
      expect(err?.message, `${name}: the refusal does not name the file`).toContain(PROCESS_SCHEMA);
    }
  });

  it('REFUSES a mode with no values and an absent value outside its own set', () => {
    const noValues = DISPATCH_FIXTURE.replace('values: [ask, until, standing]', 'values: []');
    expect(noValues, 'the edit changed nothing').not.toBe(DISPATCH_FIXTURE);
    const first = refusal(() => parseProcessSchema(noValues));
    expect(first, 'a mode with no value set parsed').toBeInstanceOf(ProcessFinding);
    expect(first?.message, 'the refusal does not say what it found').toContain('declares no `values`');
    const strayed = DISPATCH_FIXTURE.replace('absent: ask', 'absent: whenever');
    expect(strayed, 'the edit changed nothing').not.toBe(DISPATCH_FIXTURE);
    const second = refusal(() => parseProcessSchema(strayed));
    expect(second, 'an absent value outside the set parsed').toBeInstanceOf(ProcessFinding);
    expect(second?.message, 'the refusal does not say what it found').toContain('is not one of its own values');
  });

  it('REFUSES values or an absent value on a row that is not a mode, where neither means anything', () => {
    const withValues = DISPATCH_FIXTURE.replace(
      '      shape: card-id\n      values: []',
      '      shape: card-id\n      values: [T-1]',
    );
    expect(withValues, 'the edit changed nothing').not.toBe(DISPATCH_FIXTURE);
    const first = refusal(() => parseProcessSchema(withValues));
    expect(first, 'a value set on a card-id row parsed').toBeInstanceOf(ProcessFinding);
    expect(first?.message, 'the refusal does not say what it found').toContain('carries `values` anyway');
    const withAbsent = DISPATCH_FIXTURE.replace(
      '      shape: card-id\n      values: []\n      absent: ""',
      '      shape: card-id\n      values: []\n      absent: T-1',
    );
    expect(withAbsent, 'the edit changed nothing').not.toBe(DISPATCH_FIXTURE);
    const second = refusal(() => parseProcessSchema(withAbsent));
    expect(second, 'an absent value on a card-id row parsed').toBeInstanceOf(ProcessFinding);
    expect(second?.message, 'the refusal does not say what it found').toContain('declares `absent:');
  });

  it('REFUSES a field inside a container the section never declared, and one inside a row that is no container', () => {
    const orphan = DISPATCH_FIXTURE.replace('    revoked.at:', '    nobody.at:');
    expect(orphan, 'the edit changed nothing').not.toBe(DISPATCH_FIXTURE);
    const first = refusal(() => parseProcessSchema(orphan));
    expect(first, 'a field inside an undeclared container parsed').toBeInstanceOf(ProcessFinding);
    expect(first?.message, 'the refusal does not name the container').toContain('nobody');
    const notAMap = DISPATCH_FIXTURE.replace(
      '      shape: map\n      values: []\n      absent: ""\n      advisory: false\n      implementation: declarative\n      what: "the dated revocation"',
      '      shape: text\n      values: []\n      absent: ""\n      advisory: false\n      implementation: declarative\n      what: "the dated revocation"',
    );
    expect(notAMap, 'the edit changed nothing').not.toBe(DISPATCH_FIXTURE);
    const second = refusal(() => parseProcessSchema(notAMap));
    expect(second, 'a field inside a text row parsed').toBeInstanceOf(ProcessFinding);
    expect(second?.message, 'the refusal does not say what it found').toContain(
      `rather than a \`${DISPATCH_MAP_SHAPE}\``,
    );
  });

  it('REFUSES a section that names no key, no reader or no fields at all', () => {
    for (const attribute of DISPATCH_BLOCK_FIELDS.filter((f) => f !== 'fields')) {
      const line = `  ${attribute}: `;
      const at = DISPATCH_FIXTURE.indexOf(line);
      expect(at, `the fixture carries no \`${attribute}\` line`).toBeGreaterThan(-1);
      const end = DISPATCH_FIXTURE.indexOf('\n', at) + 1;
      const err = refusal(() =>
        parseProcessSchema(DISPATCH_FIXTURE.slice(0, at) + DISPATCH_FIXTURE.slice(end)),
      );
      expect(err, `a section missing \`${attribute}\` parsed`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `the refusal does not name the missing \`${attribute}\``).toContain(attribute);
    }
    const noFields = DISPATCH_FIXTURE.slice(0, DISPATCH_FIXTURE.indexOf('  fields:')) +
      '  fields:\n' +
      DISPATCH_FIXTURE.slice(DISPATCH_FIXTURE.indexOf('\nswitches:\n') + 1);
    const err = refusal(() => parseProcessSchema(noFields));
    expect(err, 'a section with no fields parsed').toBeInstanceOf(ProcessFinding);
    expect(err?.message, 'the refusal does not say what it found').toContain('declares no fields at all');
  });

  it('REFUSES a section that declares no approval or no recovery row, because the reader answers both by name', () => {
    for (const id of DISPATCH_MODE_FIELDS) {
      const text = DISPATCH_FIXTURE.replace(`    ${id}:\n      required: always`, `    ${id}_x:\n      required: always`);
      expect(text, `${id}: the edit changed nothing`).not.toBe(DISPATCH_FIXTURE);
      const err = refusal(() => parseProcessSchema(text));
      expect(err, `${id}: a section without it parsed`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `${id}: the refusal does not name the row`).toContain(id);
    }
  });

  it(`REFUSES a with-until field where the approval row does not offer \`${DISPATCH_UNTIL_VALUE}\``, () => {
    // A rule ABOUT a value, declared where the value cannot occur, is a
    // rule nothing could ever satisfy — and the field it guards would
    // then be refused under every mode.
    const text = DISPATCH_FIXTURE.replace('values: [ask, until, standing]', 'values: [ask, standing]').replace(
      'absent: ask',
      'absent: ask',
    );
    expect(text, 'the edit changed nothing').not.toBe(DISPATCH_FIXTURE);
    const err = refusal(() => parseProcessSchema(text));
    expect(err, 'a declaration whose until value is unreachable parsed').toBeInstanceOf(ProcessFinding);
    expect(err?.message, 'the refusal does not say what it found').toContain('with-until');
  });

  it('REFUSES an attribute no row declares, a field outside the fields list, and an indent it does not know', () => {
    const cases: [string, string, string, string][] = [
      ['an attribute nobody declares', '      required: always\n      shape: mode\n      values: [ask, until, standing]', '      required: always\n      shape: mode\n      colour: blue\n      values: [ask, until, standing]', 'is not an attribute a dispatch block field declares'],
      ['a section key nobody declares', '  reads: dispatchBlock', '  reeds: dispatchBlock', `is not something the \`${DISPATCH_DECLARATION}:\` section`],
      ['a field before the fields list', '  fields:\n    approval:', '    approval:', 'outside the `fields:` list'],
      ['an indent nobody knows', '      what: "when work starts"', '         what: "when work starts"', 'this parser does not know'],
    ];
    for (const [name, from, to, want] of cases) {
      const text = DISPATCH_FIXTURE.replace(from, to);
      expect(text, `${name}: the edit changed nothing`).not.toBe(DISPATCH_FIXTURE);
      const err = refusal(() => parseProcessSchema(text));
      expect(err, `${name}: the declaration parsed without a murmur`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `${name}: the refusal does not say what it found`).toContain(want);
    }
  });
});

/* ── THE DISPATCH BLOCK, READ (T-319, criteria 2, 3 and 4) ────────────
 *
 * ONE TYPED VALUE OR A NAMED REFUSAL, NEVER A PARTIAL ONE. Each body
 * below is one RULE, and it names the refusal it expects rather than
 * asserting that something somewhere threw. The unedited block reads
 * whole in the first body, which is the control every refusal below
 * leans on: each of them edits that same block in exactly one place and
 * proves the edit changed the text before reading it.
 *
 * AND THIS CARD CLAIMS NO ADMISSION. Nothing here refuses or allows a
 * dispatch: the block is readable configuration and the reader reads it.
 * ──────────────────────────────────────────────────────────────────── */

/** A refusal named: the class, the sentence, and never a bare throw. */
function refusedBy(err: Error | undefined, name: string, want: string): void {
  expect(err, `${name}: the block was read without a murmur`).toBeInstanceOf(ProcessFinding);
  expect(err?.message, `${name}: the refusal does not say which rule it is`).toContain(want);
}

describe('the dispatch block reader', () => {
  it('reads a whole block field for field, and a real YAML parser agrees about the same document', () => {
    const block = readBlock(BLOCK);
    expect(block.present, 'a block that is there read as absent').toBe(true);
    expect(block.approval, 'the approval mode').toBe(DISPATCH_UNTIL_VALUE);
    expect(block.recovery, 'the recovery policy').toBe('repair');
    expect(block.grant?.givenBy, 'grant.given_by kept its quotes or lost its value').toBe('the owner');
    expect(block.grant?.at, 'grant.at').toBe('2026-09-14T09:30:00Z');
    expect(block.grant?.revision, 'grant.revision read as a string or as the wrong number').toBe(3);
    expect(block.grant?.order, 'grant.order — the flow list lost an item').toEqual(['T-1', 'T-2']);
    expect(block.grant?.until, 'grant.until').toBe('T-2');
    expect(Object.fromEntries(block.grant?.cards ?? []), 'grant.cards').toEqual({
      'T-1': BLOB_ONE,
      'T-2': BLOB_TWO,
    });
    expect(Object.fromEntries(block.limits?.tokens ?? []), 'limits.tokens').toEqual({ 'a-provider': 500000 });
    expect(block.limits?.expiresAt, 'limits.expires_at').toBe('2026-09-20T00:00:00Z');
    expect(block.revoked, 'a block with no revocation read one').toBeNull();
    expect(
      block.history.map((h) => [h.revision, h.givenBy, h.until, [...h.cards.values()]]),
      'the history, in the order it is written',
    ).toEqual([
      [1, 'the first owner', null, [BLOB_THREE]],
      [2, 'the second owner', 'T-1', [BLOB_FOUR, BLOB_FIVE]],
    ]);
    // AND A REAL YAML PARSER READS THE SAME DOCUMENT. The two readings
    // share no line of code, which is the point: this reader is by hand
    // because a packaged script has no devDependencies.
    const real = (parseYaml(BLOCK) as { dispatch: Record<string, unknown> }).dispatch;
    const grant = real['grant'] as Record<string, unknown>;
    expect(real['approval'], 'approval').toBe(block.approval);
    expect(real['recovery'], 'recovery').toBe(block.recovery);
    expect(grant['given_by'], 'grant.given_by').toBe(block.grant?.givenBy);
    expect(grant['revision'], 'grant.revision').toBe(block.grant?.revision);
    expect(grant['order'], 'grant.order').toEqual(block.grant?.order);
    expect(grant['cards'], 'grant.cards').toEqual(Object.fromEntries(block.grant?.cards ?? []));
    expect((real['history'] as unknown[]).length, 'the history length').toBe(block.history.length);
  });

  it('answers the EXPLICIT NO-GRANT STATE for a block that is absent, out of the declaration itself', () => {
    // CRITERION 2. The values here are the fixture declaration's own —
    // `ask` and `refuse`, which no shipped file says — so a reader
    // carrying the words itself would answer the shipped ones and red.
    const block = readBlock(NO_BLOCK);
    expect(block.present, 'an absent block read as present').toBe(false);
    expect(block.approval, 'the approval mode is the declaration’s absent value').toBe('ask');
    expect(block.recovery, 'the recovery policy is the declaration’s absent value').toBe('refuse');
    expect(block.grant, 'a grant was invented out of nothing').toBeNull();
    expect(block.current, 'a current grant was invented out of nothing').toBeNull();
    expect(block.revision, 'the no-grant revision').toBe(0);
    expect(block.history, 'a history was invented out of nothing').toEqual([]);
    expect(block.limits, 'limits were invented out of nothing').toBeNull();
    expect(block.revoked, 'a revocation was invented out of nothing').toBeNull();
    // AND EVERY READ-ONLY SETTINGS OPERATION KEEPS WORKING EXACTLY AS
    // BEFORE: the same template still reads its profile, its offered
    // profiles and its departures.
    const section = processSection(NO_BLOCK);
    expect(section?.profile, 'the profile stopped reading when the block went').toBe('quick');
    expect(section?.available, 'the offered profiles stopped reading').toEqual(['slow', 'quick']);
    expect(Object.fromEntries(section?.overrides ?? []), 'the departure stopped reading').toEqual({
      'verify.bench': 'on',
    });
    // THE POSITIVE CONTROL: the same template WITH the block reads a
    // grant, so the state above is the absence and not the reader.
    expect(readBlock(BLOCK).present, 'the control: the block was there and read').toBe(true);
  });

  it('answers the no-grant state for a template whose block was REMOVED, and reads the same section as before', () => {
    // The other half of criterion 2: not a template that never had one,
    // but one a hand took the block out of.
    const removed = BLOCK.slice(0, BLOCK.indexOf('dispatch:')) + BLOCK.slice(BLOCK.indexOf('process:'));
    expect(removed, 'the removal changed nothing').not.toBe(BLOCK);
    expect(removed.includes('dispatch:'), 'the block is still in the text').toBe(false);
    const block = readBlock(removed);
    expect(block.present, 'a removed block read as present').toBe(false);
    expect([block.approval, block.recovery, block.revision], 'the removed block’s state').toEqual([
      'ask',
      'refuse',
      0,
    ]);
    expect(processSection(removed)?.profile, 'the section reader lost the profile').toBe('quick');
  });

  it('REFUSES to read a block against a schema that declares none, rather than inventing the shape', () => {
    const err = refusal(() => dispatchBlock(BLOCK, fixture()));
    refusedBy(err, 'no declaration', `declares no \`${DISPATCH_DECLARATION}:\` section`);
    expect(err?.message, 'the refusal does not name the schema').toContain(PROCESS_SCHEMA);
    // THE POSITIVE CONTROL: against the declaring schema the same text reads.
    expect(readBlock(BLOCK).present, 'the control: the same block read against a declaring schema').toBe(true);
  });

  it('REFUSES an UNKNOWN FIELD at every depth, naming the fields the declaration does carry', () => {
    const cases: [string, string, string][] = [
      ['in the block itself', '  recovery: repair', '  recovery: repair\n  ceiling: 12'],
      ['in the grant', '    revision: 3', '    revision: 3\n    mood: hopeful'],
      ['in the limits', '    expires_at: "2026-09-20T00:00:00Z"', '    expires_at: "2026-09-20T00:00:00Z"\n    seats: 4'],
      ['in a history entry', '      revision: 1', '      revision: 1\n      mood: hopeful'],
      ['in the revocation', '  history:', '  revoked:\n    at: "2026-09-15T00:00:00Z"\n    by: "the owner"\n    why: "because"\n  history:'],
    ];
    for (const [where, from, to] of cases) {
      refusedBy(blockRefusal(from, to), where, 'is not a field');
    }
  });

  it('REFUSES a DUPLICATE YAML KEY, which a real parser keeps the last of and calls well formed', () => {
    // A DUPLICATE KEY IS A RECORD WRITTEN TWICE AND MEANT ONCE, and
    // which half survives is the reader's choice rather than the
    // author's — so this reader makes none and refuses.
    const doubled = BLOCK.replace('  recovery: repair', '  recovery: repair\n  recovery: refuse');
    expect(doubled, 'the edit changed nothing').not.toBe(BLOCK);
    refusedBy(refusal(() => readBlock(doubled)), 'a duplicated key', 'DUPLICATE KEY');
    // AND THE TWO READERS AGREE ABOUT IT: the real parser refuses the
    // same document, which is the comparison this file makes everywhere
    // else and the reason the hand reading is checked against one at all.
    expect(
      refusal(() => parseYaml(doubled)),
      'the control: a real YAML parser read the duplicate without a murmur',
    ).toBeInstanceOf(Error);
    // AND THE UNEDITED BLOCK IS READ BY BOTH, so the refusal above is
    // for the duplicate rather than for the document.
    expect((parseYaml(BLOCK) as { dispatch: unknown }).dispatch, 'the control: the clean block').toBeDefined();
    refusedBy(
      blockRefusal('      T-2: ' + BLOB_TWO, '      T-2: ' + BLOB_TWO + '\n      T-2: ' + BLOB_ONE),
      'a duplicated card',
      'DUPLICATE KEY',
    );
  });

  it(`REFUSES the \`${DISPATCH_UNTIL_VALUE}\` mode with no card to run up to`, () => {
    refusedBy(blockRefusal('    until: T-2\n', ''), 'until with no card', 'names no `until`');
  });

  it(`REFUSES an \`until\` naming a card the grant's own order does not carry`, () => {
    refusedBy(blockRefusal('    until: T-2', '    until: T-9'), 'until outside the order', 'does not carry');
  });

  it(`REFUSES an \`until\` under a mode that is not \`${DISPATCH_UNTIL_VALUE}\``, () => {
    refusedBy(
      blockRefusal(`  approval: ${DISPATCH_UNTIL_VALUE}`, '  approval: standing'),
      'until under standing',
      'is not `until`',
    );
  });

  it('REFUSES an order and a cards map that DISAGREE, in either direction', () => {
    refusedBy(
      blockRefusal('    order: [T-1, T-2]\n    until: T-2', '    order: [T-1, T-2, T-3]\n    until: T-2'),
      'a card the order names and cards does not',
      'DISAGREE',
    );
    refusedBy(
      blockRefusal('      T-2: ' + BLOB_TWO, '      T-2: ' + BLOB_TWO + '\n      T-3: ' + BLOB_THREE),
      'a card cards names and the order does not',
      'DISAGREE',
    );
  });

  it('REFUSES an order that names one card twice, because "the next card" would then be two cards', () => {
    refusedBy(
      blockRefusal('    order: [T-1, T-2]\n    until: T-2', '    order: [T-1, T-2, T-1]\n    until: T-2'),
      'a repeated card id',
      'twice',
    );
  });

  it('REFUSES a MALFORMED BLOB SHA, which would approve no revision of anything', () => {
    for (const [name, bad] of [
      ['too short', 'abc'],
      ['not hexadecimal', 'z'.repeat(40)],
      ['upper case', BLOB_ONE.replace('1', 'A')],
    ] as [string, string][]) {
      refusedBy(blockRefusal(`      T-1: ${BLOB_ONE}`, `      T-1: ${bad}`), name, 'not 40 hexadecimal');
    }
  });

  it('REFUSES a MALFORMED INSTANT on every field the declaration makes an instant', () => {
    const cases: [string, string, string][] = [
      ['the grant', '    at: "2026-09-14T09:30:00Z"', '    at: "2026-09-14"'],
      ['a history entry', '      at: "2026-09-14T23:45:00Z"', '      at: "yesterday"'],
      ['the expiry', '    expires_at: "2026-09-20T00:00:00Z"', '    expires_at: "2026-09-20T00:00:00"'],
      ['an impossible date', '    at: "2026-09-14T09:30:00Z"', '    at: "2026-13-45T09:30:00Z"'],
      [
        'the revocation',
        '  history:',
        '  revoked:\n    at: "the other day"\n    by: "the owner"\n  history:',
      ],
    ];
    for (const [name, from, to] of cases) refusedBy(blockRefusal(from, to), name, 'not an ISO instant');
  });

  it('REFUSES a revision that is not a POSITIVE INTEGER, which would leave "which is current" undecided', () => {
    for (const [name, bad] of [
      ['zero', '0'],
      ['negative', '-1'],
      ['a decimal', '1.5'],
      ['a word', 'three'],
      ['padded', '03'],
    ] as [string, string][]) {
      refusedBy(blockRefusal('    revision: 3', `    revision: ${bad}`), name, 'not a POSITIVE INTEGER');
    }
  });

  it('REFUSES TWO GRANTS AT ONE REVISION, because a date cannot break that tie', () => {
    refusedBy(
      blockRefusal('      revision: 1\n      order: [T-1]', '      revision: 3\n      order: [T-1]'),
      'the current grant and an earlier one at one revision',
      'TWO GRANTS AT REVISION',
    );
    refusedBy(
      blockRefusal('      revision: 2\n      order: [T-1, T-2]', '      revision: 1\n      order: [T-1, T-2]'),
      'two earlier grants at one revision',
      'TWO GRANTS AT REVISION',
    );
  });

  it('REFUSES a history whose revisions are not ALL BELOW the current one', () => {
    // The edit raises an EARLIER grant above the current one rather than
    // lowering the current one onto it: lowering would collide with the
    // history's own revision 2 and fire the tie refusal first, which
    // would make this body a second copy of the one above it.
    refusedBy(
      blockRefusal('      revision: 2\n      order: [T-1, T-2]', '      revision: 5\n      order: [T-1, T-2]'),
      'an earlier grant above the current',
      'not BELOW the current revision',
    );
  });

  it('REFUSES a token ceiling that is not a positive integer, advisory though the field is', () => {
    refusedBy(
      blockRefusal('      a-provider: 500000', '      a-provider: lots'),
      'a ceiling nobody can read',
      'not a positive integer',
    );
  });

  it('REFUSES a block that leaves out a field the declaration makes required, naming the field', () => {
    const cases: [string, string][] = [
      ['approval', `  approval: ${DISPATCH_UNTIL_VALUE}\n`],
      ['recovery', '  recovery: repair\n'],
      ['given_by', '    given_by: "the owner"\n'],
      ['at', '    at: "2026-09-14T09:30:00Z"\n'],
      ['revision', '    revision: 3\n'],
      ['order', '    order: [T-1, T-2]\n'],
    ];
    for (const [field, line] of cases) {
      const err = blockRefusal(line, '');
      expect(err, `${field}: a block missing it was read`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `${field}: the refusal does not name the field`).toContain(field);
    }
    // `cards` and `history` take their whole blocks with them, so they
    // are removed by slice rather than by a line edit.
    for (const [field, from, to] of [
      ['cards', '    cards:\n      T-1: ' + BLOB_ONE + '\n      T-2: ' + BLOB_TWO + '\n', ''],
      ['history', BLOCK.slice(BLOCK.indexOf('  history:'), BLOCK.indexOf('process:')), ''],
    ] as [string, string, string][]) {
      const err = blockRefusal(from, to);
      expect(err, `${field}: a block missing it was read`).toBeInstanceOf(ProcessFinding);
      expect(err?.message, `${field}: the refusal does not name the field`).toContain(field);
    }
  });

  it('REFUSES a mode outside its own declared value set', () => {
    refusedBy(blockRefusal('  approval: until', '  approval: whenever'), 'an approval nobody declared', 'is not one of');
    refusedBy(blockRefusal('  recovery: repair', '  recovery: maybe'), 'a recovery nobody declared', 'is not one of');
    // AND THE SHIPPED WORDS ARE NOT THIS FIXTURE'S: `each` is a legal
    // approval in the shipped schema and is refused here, which is what
    // proves the value set comes from the declaration.
    refusedBy(blockRefusal('  approval: until', '  approval: each'), 'the shipped word', 'is not one of');
  });

  it('REFUSES an empty block, a block with a value on its own line, and an indent it does not know', () => {
    const emptied = BLOCK.slice(0, BLOCK.indexOf('  approval:')) + BLOCK.slice(BLOCK.indexOf('process:'));
    expect(emptied.includes('dispatch:'), 'the emptied block lost its key too').toBe(true);
    refusedBy(refusal(() => readBlock(emptied)), 'an empty block', 'is empty');
    refusedBy(blockRefusal('dispatch:\n', 'dispatch: nothing\n'), 'a value on the key line', 'carries a value');
    refusedBy(blockRefusal('  recovery: repair', '     recovery: repair'), 'an indent nobody knows', 'an indent of');
  });

  it('decides which grant is CURRENT by the revision and never by a date, with two grants on one day', () => {
    // CRITERION 4. The fixture is built so that the two orderings
    // DISAGREE: the current grant is dated 09:30 and the earlier grant at
    // revision 1 is dated 23:45 the same day, while the earlier grant at
    // revision 2 is dated the day before. A reader that sorted by date
    // would answer the 23:45 grant, and a reader that took the last
    // written would answer the day-before one.
    const block = readBlock(BLOCK);
    const sameDay = block.history.filter((h) => h.at.startsWith('2026-09-14'));
    expect(sameDay.length, 'the fixture no longer carries a same-day earlier grant').toBe(1);
    expect(
      (sameDay[0] as { at: string }).at > (block.grant as { at: string }).at,
      'the fixture no longer dates the earlier grant LATER than the current one',
    ).toBe(true);
    expect(block.current?.revision, 'the current grant is not the highest revision').toBe(3);
    expect(block.current?.givenBy, 'the current grant is not the one `grant:` names').toBe('the owner');
    expect(block.revision, 'the block’s revision is not the current grant’s').toBe(3);
    expect(
      block.history.map((h) => h.revision).every((r) => r < block.revision),
      'a history revision is not below the current',
    ).toBe(true);
  });

  it('reads a REVOKED block as no current grant, with the grant it revokes still in the record', () => {
    const revoked = BLOCK.replace(
      '  history:',
      '  revoked:\n    at: "2026-09-15T10:00:00Z"\n    by: "the owner"\n  history:',
    );
    expect(revoked, 'the edit changed nothing').not.toBe(BLOCK);
    const block = readBlock(revoked);
    expect(block.present, 'a revoked block read as absent').toBe(true);
    expect(block.revoked?.by, 'the revocation did not read').toBe('the owner');
    expect(block.revoked?.at, 'the revocation instant did not read').toBe('2026-09-15T10:00:00Z');
    expect(block.current, 'a revoked block still answered a current grant').toBeNull();
    expect(block.revision, 'a revoked block still answered a revision').toBe(0);
    expect(block.grant?.revision, 'the revoked grant left the record').toBe(3);
    // THE POSITIVE CONTROL: without the revocation the same block is current.
    expect(readBlock(BLOCK).current?.revision, 'the control: the unrevoked block is current').toBe(3);
  });

  it('REFUSES a revocation or a limits block that leaves out one of its own halves', () => {
    for (const [name, to] of [
      ['a revocation with no instant', '  revoked:\n    by: "the owner"\n  history:'],
      ['a revocation with nobody', '  revoked:\n    at: "2026-09-15T10:00:00Z"\n  history:'],
    ] as [string, string][]) {
      refusedBy(blockRefusal('  history:', to), name, 'declares no');
    }
    refusedBy(
      blockRefusal('    tokens:\n      a-provider: 500000\n', ''),
      'limits with no ceilings',
      'declares no `tokens`',
    );
    refusedBy(
      blockRefusal('    expires_at: "2026-09-20T00:00:00Z"\n', ''),
      'limits with no expiry',
      'declares no `expires_at`',
    );
  });

  it('reads a block with no optional containers at all, and a first grant whose history is empty', () => {
    const first = BLOCK.slice(0, BLOCK.indexOf('  limits:')) + '  history: []\n' + BLOCK.slice(BLOCK.indexOf('process:'));
    const block = readBlock(first);
    expect(block.present, 'a first grant did not read').toBe(true);
    expect(block.limits, 'limits were invented').toBeNull();
    expect(block.history, 'a history was invented').toEqual([]);
    expect(block.revision, 'the first grant’s revision').toBe(3);
    // AND A `history:` WITH NOTHING AFTER IT IS NOT THE SAME THING as an
    // empty list: a blank is a field somebody stopped writing.
    refusedBy(
      refusal(() => readBlock(first.replace('  history: []', '  history:'))),
      'a blank history',
      'carries nothing at all',
    );
  });
});
