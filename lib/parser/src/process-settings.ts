/**
 * process-settings.ts — THE PROCESS AS SETTINGS, READ (C-06).
 *
 * The schema parser, the section reader, the resolver, the accessor, the
 * ledger and the constraint findings. The implementation is T-299's,
 * moved out of the dispatch arm by T-317 so that the terminal command,
 * the app's settings screen and the skill read ONE implementation
 * instead of three spellings of it. Nothing here changed on the way: the
 * refusals, their wording and the shapes they return are what the arm
 * shipped, and the arm now imports this module and re-exports every
 * symbol it exported before.
 *
 * TEXT IN, VALUES OUT, AND THAT IS WHY IT LIVES HERE. This module opens
 * no file and imports no node builtin, so it belongs to the browser-safe
 * entry (`@supertaskr/parser/pure`) and the app's webview can render the
 * same settings the terminal prints. WHICH files carry the schema and
 * the template is named below as a pair of repository-relative
 * constants, because the refusals quote them; READING them stays with
 * the caller, which in the arm is `loadProcess`.
 *
 * WHY THE PARSER IS BY HAND. The scripts in the arm's own directory are
 * what the CLI packages and the genesis installs (ADR-024 decision 7),
 * and a package's `devDependencies` are not there when it is installed.
 * The e2e suite parses the SAME file with a real YAML library and
 * requires the two readings to agree, so the hand parser is checked
 * against a parser it shares no line with.
 *
 * THE ONE THING THAT COULD NOT CROSS THE PACKAGE BOUNDARY IS THE ERROR
 * CLASS. The arm's `ProcessFinding` is a `DispatchLaneFinding` on
 * purpose — the dispatch arm catches that class and reports it as a
 * refusal rather than a crash — and a class defined here cannot be one.
 * So the class is a PARAMETER: `processSettingsReader({ Finding })`
 * binds every refusal in this module to the caller's own class, and the
 * symbols exported at the foot of this file are that same reader bound
 * to the `ProcessFinding` declared here, which is what a browser gets.
 */

/**
 * A PROCESS SETTING THIS READER CANNOT READ, or a combination it
 * refuses. The default class every refusal below is raised with; a
 * caller that needs its own passes it to `processSettingsReader`.
 */
export class ProcessFinding extends Error {}

/** The one file every switch is declared in, repository-relative. */
export const PROCESS_SCHEMA = 'method/runtime/process-schema.yaml';

/** The section of the runtime template that names the project's profile. */
export const PROCESS_SECTION = 'process';

/** The runtime template the `process:` section is read out of. */
export const RUNTIME_TEMPLATE = 'method/runtime/supertaskr.yaml';

/**
 * THE FIELDS EVERY SWITCH DECLARES, and the list is here rather than in
 * the document because a schema row missing one of them is a settings
 * screen with a blank in it. Each answers a question a reader asks:
 * `what` it does, `effect` how the loop changes, `reads` which arm
 * symbol consults it, `needs` what it needs on, `floor` whether it may
 * be turned off, `band` which band measures it, `cost` what this project
 * measured, `implementation` what makes the row TRUE, `manualAction` the
 * instruction when that is a person, `type`/`values` the value set,
 * `profiles` the three columns.
 */
export const SWITCH_FIELDS: readonly string[] = Object.freeze([
  'type',
  'values',
  'what',
  'effect',
  'reads',
  'needs',
  'floor',
  'band',
  'cost',
  'implementation',
  'manualAction',
  'profiles',
]);

/**
 * HOW A SWITCH IS IMPLEMENTED, and the set is closed (T-299-s6).
 *
 * `operational` — a program in this tree reads the row and branches on
 * it, so changing the value changes what that program DOES. The label is
 * earned by a body that changes the value and observes the change; a
 * read site shows the value is read, and a surface printing the value
 * back shows nothing at all.
 *
 * `manual` — no program reads the row; a person or a seat performs what
 * it names, and `manualAction` is that instruction.
 *
 * `declarative` — the row is a RECORD and not a control: nothing reads
 * its value and no instruction is addressed to a seat by it, so editing
 * it alone changes nothing. IT DOES NOT MEAN THE BEHAVIOUR IS ABSENT —
 * a gate whose row reads `declarative` is still in force; what it is not
 * is a setting, because it lives in code or in CI configuration that
 * never consults this file. That is why the terminal refuses to edit
 * one: the write would move the template and change nothing else.
 */
export const IMPLEMENTATIONS: readonly string[] = Object.freeze([
  'operational',
  'manual',
  'declarative',
]);

/** The one label whose `manualAction` is required to say something. */
export const MANUAL_IMPLEMENTATION = 'manual';

/** The two shapes a switch may take. */
export const SWITCH_TYPES: readonly string[] = Object.freeze(['toggle', 'choice']);

/**
 * THE DISPATCH BLOCK, AND WHERE IT IS DECLARED (T-319).
 *
 * The runtime template's own `dispatch:` block is where an owner's
 * approval LIVES — which cards were approved, at which revision of their
 * own files, by whom, when, and whether the coordinator may dispatch the
 * repairs that work turns out to need. This is the SCHEMA section that
 * declares it, so that the template carries the values and the schema
 * carries what they mean, exactly as it does for every switch above.
 *
 * THIS CARD LANDS IT AS READABLE CONFIGURATION AND NOTHING MORE. Every
 * row of the declaration is `declarative`: nothing in this tree admits or
 * refuses a dispatch by the block, and nothing here claims it does. T-324
 * owns admission.
 */
export const DISPATCH_DECLARATION = 'dispatch_block';

/** What the declaration itself answers: the template key, its prose, its reader, its rows. */
export const DISPATCH_BLOCK_FIELDS: readonly string[] = Object.freeze([
  'key',
  'what',
  'effect',
  'reads',
  'fields',
]);

/** What every row of the declaration answers. A row missing one of these is refused. */
export const DISPATCH_FIELD_ATTRIBUTES: readonly string[] = Object.freeze([
  'required',
  'shape',
  'values',
  'absent',
  'advisory',
  'implementation',
  'what',
]);

/**
 * WHEN A FIELD IS OWED, and the set is closed.
 *
 * `always` — owed whenever the block is present. `optional` — the
 * container may be left out entirely. `with-parent` — owed when its own
 * container is there. `with-until` — owed when `approval` is `until`,
 * and REFUSED under every other mode.
 */
export const DISPATCH_REQUIREMENTS: readonly string[] = Object.freeze([
  'always',
  'optional',
  'with-parent',
  'with-until',
]);

/**
 * WHAT A FIELD'S VALUE MUST BE, and the set is closed: a shape this
 * reader does not know is a field nothing could validate, which is the
 * class of hole a typed value exists to close.
 */
export const DISPATCH_SHAPES: readonly string[] = Object.freeze([
  'mode',
  'text',
  'instant',
  'revision',
  'card-id',
  'card-ids',
  'card-blobs',
  'token-ceilings',
  'map',
  'grants',
]);

/** The one shape whose `values` is its value set and whose `absent` is one of them. */
export const DISPATCH_MODE_SHAPE = 'mode';

/** The container shape: a row whose own rows are declared under its dotted name. */
export const DISPATCH_MAP_SHAPE = 'map';

/** The two rows the reader answers with by name, and the declaration owes both. */
export const DISPATCH_MODE_FIELDS: readonly string[] = Object.freeze(['approval', 'recovery']);

/**
 * THE APPROVAL VALUE A `with-until` FIELD IS OWED UNDER, and the
 * declaration must offer it: `with-until` is a rule ABOUT this value, so
 * an approval row whose own value set does not carry it would declare a
 * rule nothing could ever satisfy.
 */
export const DISPATCH_UNTIL_VALUE = 'until';

/** One row of the dispatch block's declaration. */
export interface DispatchFieldDeclaration {
  /** `approval`, `grant.at`, `limits.tokens` — dotted where it sits inside a container */
  id: string;
  /** one of `DISPATCH_REQUIREMENTS` */
  required: string;
  /** one of `DISPATCH_SHAPES` */
  shape: string;
  /** the whole value set of a `mode` row, and empty on every other */
  values: string[];
  /** what the reader answers for this row when the block is ABSENT; only a `mode` row has one */
  absent: string;
  /** true where nothing in this tree enforces the field */
  advisory: boolean;
  /** one of `IMPLEMENTATIONS` */
  implementation: string;
  what: string;
}

/** The dispatch block, as the schema declares it. */
export interface DispatchDeclaration {
  /** the template's own top-level key — `dispatch` */
  key: string;
  what: string;
  effect: string;
  reads: string;
  /** field id -> its row, in declaration order */
  fields: Map<string, DispatchFieldDeclaration>;
}

/** One grant, read: the approval as somebody gave it. */
export interface DispatchGrant {
  givenBy: string;
  /** the ISO instant it was given — a record, and never the tie-breaker between two grants */
  at: string;
  /** a positive integer; the ONE thing that decides which grant is current */
  revision: number;
  /** the approved cards in dispatch order, each id once */
  order: string[];
  /** the card the grant runs up to and including, or null */
  until: string | null;
  /** card id -> the 40-hex blob sha of its file at approval */
  cards: Map<string, string>;
}

/** A dated revocation: the grant stays in the record and stops being current. */
export interface DispatchRevocation {
  at: string;
  by: string;
}

/**
 * The ceilings a grant was recorded under. ADVISORY — nothing in this
 * tree reads them to stop anything, and the schema says so on both rows.
 */
export interface DispatchLimits {
  /** provider -> a positive integer */
  tokens: Map<string, number>;
  expiresAt: string;
}

/**
 * THE DISPATCH BLOCK, READ — one typed value, or a named refusal, and
 * never a partial value.
 *
 * `present` is false for the explicit NO-GRANT state: a template with no
 * block at all, which is what this project carries today. It is a STATE
 * rather than an absence, because "no grant" is the answer a reader
 * needs and an `undefined` is the answer that gets mistaken for one.
 */
export interface DispatchBlock {
  /** false when the template carries no block: the explicit no-grant state */
  present: boolean;
  /** the approval mode, or the declaration's `absent:` value when there is no block */
  approval: string;
  /** the recovery policy, or the declaration's `absent:` value when there is no block */
  recovery: string;
  /** the grant the block records, or null when there is no block */
  grant: DispatchGrant | null;
  revoked: DispatchRevocation | null;
  limits: DispatchLimits | null;
  /** every earlier grant in order, each at a revision strictly below the current */
  history: DispatchGrant[];
  /** the grant that is CURRENT: `grant` unless the block is revoked, and null where there is none */
  current: DispatchGrant | null;
  /** the current grant's revision, and 0 where there is no current grant */
  revision: number;
}

/** One switch of the schema, with every field it declares. */
export interface ProcessSwitch {
  id: string;
  type: string;
  values: string[];
  what: string;
  effect: string;
  reads: string;
  needs: string[];
  floor: boolean;
  band: string[];
  cost: string;
  /** one of `IMPLEMENTATIONS` — what makes this row true */
  implementation: string;
  /** the instruction on a manual row, and the empty string on every other */
  manualAction: string;
  /** profile id -> this switch's value under it */
  profiles: Map<string, string>;
}

/** The schema, parsed. */
export interface ProcessSchema {
  version: number;
  /** profile id -> what it is */
  profiles: Map<string, string>;
  /** switch id -> the switch, in declaration order */
  switches: Map<string, ProcessSwitch>;
  /**
   * THE DISPATCH BLOCK'S DECLARATION, OR NULL WHERE THE SCHEMA CARRIES
   * NONE (T-319).
   *
   * Optional on purpose: a schema that predates this section is not a
   * misconfiguration — it is a project whose template has no dispatch
   * block to declare. What is refused is READING a block against a
   * schema that declares none, which `dispatchBlock` does by name.
   */
  dispatch: DispatchDeclaration | null;
}

/** The runtime template's `process:` section, read. */
export interface ProcessSection {
  profile: string;
  available: string[];
  /** switch id -> the value this project departs to */
  overrides: Map<string, string>;
}

/** The profile's column with the section's departures laid over it. */
export interface ProcessSettings {
  profile: string;
  available: string[];
  /** switch id -> its resolved value */
  values: Map<string, string>;
  /** the switch ids the template departed from */
  overridden: Set<string>;
}

/** One row of the arm's read of every switch. */
export interface LedgerRow {
  id: string;
  value: string;
  what: string;
  effect: string;
  reads: string;
  floor: boolean;
  band: string[];
  cost: string;
  implementation: string;
  manualAction: string;
  overridden: boolean;
}

/** The class a refusal is raised with. */
export type FindingConstructor = new (message: string) => Error;

/** What a caller may bind a reader to. */
export interface ProcessReaderOptions {
  /**
   * The class every refusal is raised with, so a caller whose own
   * error class is caught somewhere can keep that catch. Defaults to
   * `ProcessFinding`.
   */
  readonly Finding?: FindingConstructor;
}

/** The seven symbols a bound reader answers with. */
export interface ProcessSettingsReader {
  parseProcessSchema(text: string): ProcessSchema;
  processSection(templateYaml: string): ProcessSection | null;
  resolveProcess(schema: ProcessSchema, section: ProcessSection): ProcessSettings;
  switchValue(settings: ProcessSettings, id: string): string;
  processLedger(schema: ProcessSchema, settings: ProcessSettings): LedgerRow[];
  constraintFindings(schema: ProcessSchema, settings: ProcessSettings): string[];
  dispatchBlock(templateYaml: string, schema: ProcessSchema): DispatchBlock;
}

/**
 * Strip one layer of YAML quoting off a scalar. The schema quotes every
 * free-text value, because an unquoted value carrying a colon is a
 * different document to a real parser and the same one to a naive
 * reader — which is the class of bug a hand parser exists to avoid, not
 * to demonstrate.
 */
function processScalar(raw: string): string {
  const t = raw.trim();
  if (t.length >= 2 && ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))) {
    return t.slice(1, -1);
  }
  return t;
}

/**
 * A YAML flow sequence — `[a, "b c", d]` — split on the commas that are
 * not inside a quoted item.
 */
function processFlowList(raw: string): string[] {
  const t = raw.trim();
  if (!t.startsWith('[') || !t.endsWith(']')) return [];
  const body = t.slice(1, -1);
  const items: string[] = [];
  let cur = '';
  let quote: string | null = null;
  for (const ch of body) {
    if (quote !== null) {
      if (ch === quote) quote = null;
      cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === ',') {
      items.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  items.push(cur);
  return items.map((s) => processScalar(s)).filter((s) => s !== '');
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/**
 * AN ISO INSTANT, and the shape is checked TWICE on purpose: the pattern
 * refuses a date-only string and a local time with no offset, and the
 * round-trip refuses a shape-legal impossibility like a thirteenth month.
 * A date nobody can order is a date that would silently sort wrong in
 * whatever reads the record next.
 */
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;

/** A git blob sha, spelled the way `git hash-object` spells one. */
const BLOB_SHA = /^[0-9a-f]{40}$/;

/** A positive integer, with no sign, no padding and no decimal point. */
const POSITIVE_INTEGER = /^[1-9][0-9]*$/;

/** Is this string an instant a reader could order against another? */
function isInstant(value: string): boolean {
  return ISO_INSTANT.test(value) && !Number.isNaN(Date.parse(value));
}

/** Does a value satisfy one side of a need? `*` is every value and a `|` separates alternatives. */
function needMatches(spec: string, value: string): boolean {
  if (spec.trim() === '*') return true;
  return spec
    .split('|')
    .map((s) => s.trim())
    .includes(value);
}

/**
 * A READER BOUND TO ONE ERROR CLASS, and the seven symbols it answers
 * with. The binding is the whole reason this is a factory: everything
 * else here is a pure function of its arguments.
 */
export function processSettingsReader(options: ProcessReaderOptions = {}): ProcessSettingsReader {
  const Finding: FindingConstructor = options.Finding ?? ProcessFinding;

  /**
   * THE SCHEMA, PARSED — and parsed STRICTLY, because a hand parser that
   * shrugs at a shape it does not know is a parser that silently loses a
   * switch. Every line under `switches:` either matches the shape this
   * function knows or REFUSES naming its own line number.
   */
  function parseProcessSchema(text: string): ProcessSchema {
    const lines = text.split(/\r?\n/);
    let version = 0;
    const profiles = new Map<string, string>();
    const switches = new Map<string, ProcessSwitch>();
    let block: 'none' | 'profiles' | 'switches' | 'dispatch' = 'none';
    let cur: Record<string, unknown> | null = null;
    let curId = '';
    let inProfiles = false;
    /** The dispatch block's declaration while it is being read, and null until its section opens. */
    let dispatchRaw: Record<string, unknown> | null = null;
    let dispatchFields = new Map<string, DispatchFieldDeclaration>();
    let inDispatchFields = false;
    let curField: Record<string, unknown> | null = null;
    let curFieldId = '';
    let dispatch: DispatchDeclaration | null = null;

    const close = (): void => {
      if (cur === null) return;
      const missing = SWITCH_FIELDS.filter((f) => cur !== null && cur[f] === undefined);
      if (missing.length > 0) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the switch \`${curId}\` declares no ${missing.join(', ')}. Every ` +
            'switch answers all of ' +
            `${SWITCH_FIELDS.join(', ')} — a row missing one of them is a settings screen with a ` +
            'blank in it, and a reader cannot tell an option that costs nothing from one nobody ' +
            'has measured.',
        );
      }
      const impl = String(cur['implementation'] ?? '');
      if (!IMPLEMENTATIONS.includes(impl)) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the switch \`${curId}\` declares \`implementation: ${impl}\`, which is ` +
            `not one of ${IMPLEMENTATIONS.join(', ')}. The label is what tells an executable ` +
            'control from a recorded intention, and a label this reader does not know would be ' +
            'rendered to somebody deciding whether the row is worth editing.',
        );
      }
      const action = String(cur['manualAction'] ?? '');
      if (impl === MANUAL_IMPLEMENTATION && action.trim() === '') {
        throw new Finding(
          `${PROCESS_SCHEMA}: the switch \`${curId}\` is \`${MANUAL_IMPLEMENTATION}\` and its ` +
            '`manualAction` is empty. A manual row is one a person or a seat performs, so the row ' +
            'that says so owes the instruction — without it the label tells a reader the setting ' +
            'does nothing by itself and nothing else.',
        );
      }
      if (impl !== MANUAL_IMPLEMENTATION && action !== '') {
        throw new Finding(
          `${PROCESS_SCHEMA}: the switch \`${curId}\` is \`${impl}\` and carries a ` +
            '`manualAction` anyway. Only a manual row names an action; an action on an ' +
            'operational row would be an instruction nobody has to follow, and on a declarative ' +
            'one an instruction that changes nothing.',
        );
      }
      switches.set(curId, { id: curId, ...cur } as unknown as ProcessSwitch);
      cur = null;
      curId = '';
      inProfiles = false;
    };

    /**
     * ONE ROW OF THE DISPATCH BLOCK'S DECLARATION, CLOSED AND CHECKED
     * (T-319). A row with a hole in it is a field nothing could validate,
     * so every attribute is owed and every closed set is closed here.
     */
    const closeDispatchField = (): void => {
      if (curField === null) return;
      const row = curField;
      const missing = DISPATCH_FIELD_ATTRIBUTES.filter((f) => row[f] === undefined);
      if (missing.length > 0) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the dispatch block field \`${curFieldId}\` declares no ` +
            `${missing.join(', ')}. Every field answers all of ` +
            `${DISPATCH_FIELD_ATTRIBUTES.join(', ')} — a row missing one of them is a field the ` +
            'reader could not validate and no surface could explain.',
        );
      }
      const required = String(row['required'] ?? '');
      if (!DISPATCH_REQUIREMENTS.includes(required)) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the dispatch block field \`${curFieldId}\` declares ` +
            `\`required: ${required}\`, which is not one of ${DISPATCH_REQUIREMENTS.join(', ')}. ` +
            'When a field is owed decides whether a block missing it is a refusal or a record, ' +
            'and a word this reader does not know would decide neither.',
        );
      }
      const shape = String(row['shape'] ?? '');
      if (!DISPATCH_SHAPES.includes(shape)) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the dispatch block field \`${curFieldId}\` declares ` +
            `\`shape: ${shape}\`, which is not one of ${DISPATCH_SHAPES.join(', ')}. A shape this ` +
            'reader does not know is a field nothing validates, which is the hole a typed value ' +
            'exists to close.',
        );
      }
      const impl = String(row['implementation'] ?? '');
      if (!IMPLEMENTATIONS.includes(impl)) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the dispatch block field \`${curFieldId}\` declares ` +
            `\`implementation: ${impl}\`, which is not one of ${IMPLEMENTATIONS.join(', ')}. The ` +
            'label is what tells an executable control from a recorded intention.',
        );
      }
      const values = (row['values'] ?? []) as string[];
      const absent = String(row['absent'] ?? '');
      if (shape === DISPATCH_MODE_SHAPE) {
        if (values.length === 0) {
          throw new Finding(
            `${PROCESS_SCHEMA}: the dispatch block field \`${curFieldId}\` is a ` +
              `\`${DISPATCH_MODE_SHAPE}\` and declares no \`values\`. A mode with no value set is ` +
              'a field every string satisfies.',
          );
        }
        if (!values.includes(absent)) {
          throw new Finding(
            `${PROCESS_SCHEMA}: the dispatch block field \`${curFieldId}\` declares ` +
              `\`absent: ${absent}\`, which is not one of its own values (${values.join(', ')}). ` +
              'The `absent` value is what the reader answers when the block is missing entirely, ' +
              'so a value outside the set would make the no-grant state unreadable.',
          );
        }
      } else {
        if (values.length > 0) {
          throw new Finding(
            `${PROCESS_SCHEMA}: the dispatch block field \`${curFieldId}\` is a \`${shape}\` and ` +
              `carries \`values\` anyway (${values.join(', ')}). Only a ` +
              `\`${DISPATCH_MODE_SHAPE}\` row has a value set.`,
          );
        }
        if (absent !== '') {
          throw new Finding(
            `${PROCESS_SCHEMA}: the dispatch block field \`${curFieldId}\` is a \`${shape}\` and ` +
              `declares \`absent: ${absent}\` anyway. Only a \`${DISPATCH_MODE_SHAPE}\` row has an ` +
              'absent value; every other field is simply not there when the block is not there.',
          );
        }
      }
      dispatchFields.set(curFieldId, { id: curFieldId, ...row } as unknown as DispatchFieldDeclaration);
      curField = null;
      curFieldId = '';
    };

    /**
     * THE DISPATCH BLOCK'S DECLARATION, CLOSED AND CHECKED AS A WHOLE
     * (T-319): its own prose, its rows, and the containers its dotted
     * rows sit inside.
     */
    const closeDispatch = (): void => {
      closeDispatchField();
      if (dispatchRaw === null) return;
      const raw = dispatchRaw;
      const missing = DISPATCH_BLOCK_FIELDS.filter(
        (f) => f !== 'fields' && String(raw[f] ?? '').trim() === '',
      );
      if (missing.length > 0) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the \`${DISPATCH_DECLARATION}:\` section declares no ` +
            `${missing.join(', ')}. It answers all of ${DISPATCH_BLOCK_FIELDS.join(', ')}, and ` +
            'the key is the one that says which block of the runtime template it declares.',
        );
      }
      if (dispatchFields.size === 0) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the \`${DISPATCH_DECLARATION}:\` section declares no fields at all, ` +
            'so a block read against it would be validated against nothing.',
        );
      }
      for (const id of dispatchFields.keys()) {
        const dot = id.lastIndexOf('.');
        if (dot === -1) continue;
        const parent = id.slice(0, dot);
        const owner = dispatchFields.get(parent);
        if (owner === undefined) {
          throw new Finding(
            `${PROCESS_SCHEMA}: the dispatch block field \`${id}\` sits inside \`${parent}\`, ` +
              'which this section does not declare — a field inside a container nobody declared ' +
              'could never be reached.',
          );
        }
        if (owner.shape !== DISPATCH_MAP_SHAPE) {
          throw new Finding(
            `${PROCESS_SCHEMA}: the dispatch block field \`${id}\` sits inside \`${parent}\`, ` +
              `which is a \`${owner.shape}\` rather than a \`${DISPATCH_MAP_SHAPE}\`. Only a ` +
              'container carries fields of its own.',
          );
        }
      }
      for (const id of DISPATCH_MODE_FIELDS) {
        const row = dispatchFields.get(id);
        if (row === undefined) {
          throw new Finding(
            `${PROCESS_SCHEMA}: the \`${DISPATCH_DECLARATION}:\` section declares no \`${id}\` ` +
              'row, and the reader answers with one by name. The rows it owes are ' +
              `${DISPATCH_MODE_FIELDS.join(' and ')}.`,
          );
        }
        if (row.shape !== DISPATCH_MODE_SHAPE) {
          throw new Finding(
            `${PROCESS_SCHEMA}: the dispatch block field \`${id}\` is a \`${row.shape}\`, and the ` +
              `reader answers it as a \`${DISPATCH_MODE_SHAPE}\` with an absent value of its own.`,
          );
        }
      }
      const approvalRow = dispatchFields.get(DISPATCH_MODE_FIELDS[0] as string) as DispatchFieldDeclaration;
      if (
        [...dispatchFields.values()].some((row) => row.required === 'with-until') &&
        !approvalRow.values.includes(DISPATCH_UNTIL_VALUE)
      ) {
        throw new Finding(
          `${PROCESS_SCHEMA}: a dispatch block field is \`required: with-until\` and ` +
            `\`${approvalRow.id}\` does not offer the value \`${DISPATCH_UNTIL_VALUE}\` ` +
            `(${approvalRow.values.join(', ')}). \`with-until\` is a rule ABOUT that value, so a ` +
            'declaration without it states a rule nothing could ever satisfy.',
        );
      }
      dispatch = {
        key: String(raw['key'] ?? ''),
        what: String(raw['what'] ?? ''),
        effect: String(raw['effect'] ?? ''),
        reads: String(raw['reads'] ?? ''),
        fields: dispatchFields,
      };
      dispatchRaw = null;
      dispatchFields = new Map<string, DispatchFieldDeclaration>();
      inDispatchFields = false;
    };

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] as string;
      const at = `${PROCESS_SCHEMA} line ${String(i + 1)}`;
      if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
      const col = indentOf(line);
      if (col === 0) {
        close();
        closeDispatch();
        block = 'none';
        const m = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
        if (m === null) {
          throw new Finding(`${at}: a top-level line this parser cannot read: ${line.trim()}`);
        }
        const key = m[1] as string;
        const rest = m[2] as string;
        if (key === 'version') version = Number.parseInt(processScalar(rest), 10);
        else if (key === 'profiles') block = 'profiles';
        else if (key === 'switches') block = 'switches';
        else if (key === DISPATCH_DECLARATION) {
          block = 'dispatch';
          dispatchRaw = {};
          dispatchFields = new Map<string, DispatchFieldDeclaration>();
          inDispatchFields = false;
        } else {
          throw new Finding(
            `${at}: \`${key}:\` is not a section this schema declares. The sections are version, ` +
              `profiles, switches and ${DISPATCH_DECLARATION}.`,
          );
        }
        continue;
      }
      const m = /^\s*([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
      if (m === null) {
        throw new Finding(`${at}: a line this parser cannot read: ${line.trim()}`);
      }
      const key = m[1] as string;
      const rest = m[2] as string;
      if (block === 'profiles') {
        if (col !== 2) throw new Finding(`${at}: a profile is declared at two spaces, not ${String(col)}`);
        profiles.set(key, processScalar(rest));
        continue;
      }
      if (block === 'dispatch') {
        const raw = dispatchRaw as Record<string, unknown>;
        if (col === 2) {
          closeDispatchField();
          inDispatchFields = false;
          if (key === 'fields') {
            inDispatchFields = true;
            if (rest.trim() !== '') {
              throw new Finding(`${at}: the dispatch block's \`fields:\` carries a value on its own line`);
            }
            continue;
          }
          if (!DISPATCH_BLOCK_FIELDS.includes(key)) {
            throw new Finding(
              `${at}: \`${key}:\` is not something the \`${DISPATCH_DECLARATION}:\` section ` +
                `declares. It answers ${DISPATCH_BLOCK_FIELDS.join(', ')}.`,
            );
          }
          raw[key] = processScalar(rest);
          continue;
        }
        if (col === 4) {
          if (!inDispatchFields) {
            throw new Finding(`${at}: a dispatch block field outside the \`fields:\` list: ${line.trim()}`);
          }
          closeDispatchField();
          if (rest.trim() !== '') {
            throw new Finding(`${at}: the dispatch block field \`${key}\` carries a value on its own line`);
          }
          curFieldId = key;
          curField = {};
          continue;
        }
        if (col === 6) {
          if (curField === null) {
            throw new Finding(`${at}: a dispatch block attribute before any field: ${line.trim()}`);
          }
          if (!DISPATCH_FIELD_ATTRIBUTES.includes(key)) {
            throw new Finding(
              `${at}: \`${key}:\` is not an attribute a dispatch block field declares. The ` +
                `attributes are ${DISPATCH_FIELD_ATTRIBUTES.join(', ')}.`,
            );
          }
          if (key === 'values') curField[key] = processFlowList(rest);
          else if (key === 'advisory') curField[key] = processScalar(rest) === 'true';
          else curField[key] = processScalar(rest);
          continue;
        }
        throw new Finding(`${at}: an indent of ${String(col)} this parser does not know`);
      }
      if (block !== 'switches') {
        throw new Finding(`${at}: an indented line outside every section: ${line.trim()}`);
      }
      if (col === 2) {
        close();
        curId = key;
        cur = { needs: [], band: [], values: [], profiles: new Map<string, string>() };
        if (rest.trim() !== '') {
          throw new Finding(`${at}: the switch \`${key}\` carries a value on its own line`);
        }
        continue;
      }
      if (cur === null) {
        throw new Finding(`${at}: a switch field before any switch: ${line.trim()}`);
      }
      if (col === 4) {
        inProfiles = false;
        if (key === 'profiles') {
          inProfiles = true;
          cur['profiles'] = new Map<string, string>();
          continue;
        }
        if (!SWITCH_FIELDS.includes(key)) {
          throw new Finding(
            `${at}: \`${key}:\` is not a field a switch declares. The fields are ` +
              `${SWITCH_FIELDS.join(', ')}, and a field this parser silently ignored would be a ` +
              'line the settings screens never render.',
          );
        }
        if (key === 'values' || key === 'needs' || key === 'band') cur[key] = processFlowList(rest);
        else if (key === 'floor') cur[key] = processScalar(rest) === 'true';
        else cur[key] = processScalar(rest);
        continue;
      }
      if (col === 6 && inProfiles) {
        (cur['profiles'] as Map<string, string>).set(key, processScalar(rest));
        continue;
      }
      throw new Finding(`${at}: an indent of ${String(col)} this parser does not know`);
    }
    close();
    closeDispatch();
    if (version === 0 || profiles.size === 0 || switches.size === 0) {
      throw new Finding(
        `${PROCESS_SCHEMA} parsed to ${String(switches.size)} switch(es) under ` +
          `${String(profiles.size)} profile(s) at version ${String(version)}, which cannot be right. ` +
          'The schema is the ONE source every renderer reads (ADR-024 decision 6), and an empty ' +
          'reading of it would leave the arm running on its own memory of the loop.',
      );
    }
    return { version, profiles, switches, dispatch };
  }

  /**
   * THE `process:` SECTION OF THE RUNTIME TEMPLATE — which profile this
   * project runs, which profiles it may run, and the switches it departs
   * from. It carries no explanation of its own: that is the schema's,
   * said once, and a second copy here is a copy that goes stale.
   *
   * Answers null when the template has no such section.
   */
  function processSection(templateYaml: string): ProcessSection | null {
    const lines = templateYaml.split(/\r?\n/);
    const at = lines.findIndex((l) => new RegExp(`^${PROCESS_SECTION}:\\s*(#.*)?$`).test(l));
    if (at === -1) return null;
    let profile = '';
    let available: string[] = [];
    const overrides = new Map<string, string>();
    let inSwitches = false;
    for (const line of lines.slice(at + 1)) {
      if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
      if (!/^\s/.test(line)) break;
      const m = /^\s*([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
      if (m === null) continue;
      const key = m[1] as string;
      const rest = m[2] as string;
      const col = indentOf(line);
      if (col === 2) {
        inSwitches = false;
        if (key === 'profile') profile = processScalar(rest);
        else if (key === 'available') available = processFlowList(rest);
        else if (key === 'switches') inSwitches = rest.trim() === '' || rest.trim() === '{}';
        continue;
      }
      if (col === 4 && inSwitches) overrides.set(key, processScalar(rest));
    }
    if (profile === '') {
      throw new Finding(
        `${RUNTIME_TEMPLATE}: the \`${PROCESS_SECTION}:\` section names no \`profile:\`, so this ` +
          "project's loop has no column of the schema to resolve against. A profile guessed here " +
          "would be the arm choosing the project's ceremony for it.",
      );
    }
    return { profile, available, overrides };
  }

  /**
   * RESOLVE THE PROJECT'S SWITCHES: the profile's column of the schema,
   * with the section's departures laid over it.
   *
   * Every refusal here names the repair. A profile the schema does not
   * declare, an override on a switch the schema does not declare, a value
   * outside a switch's own set, and an override on a FLOOR switch are four
   * different mistakes and each is reported as itself.
   */
  function resolveProcess(schema: ProcessSchema, section: ProcessSection): ProcessSettings {
    const known = [...schema.profiles.keys()];
    if (!schema.profiles.has(section.profile)) {
      throw new Finding(
        `${RUNTIME_TEMPLATE} runs the profile \`${section.profile}\`, which ${PROCESS_SCHEMA} does ` +
          `not declare. The profiles are ${known.join(', ')}.`,
      );
    }
    if (section.available.length > 0) {
      const strayed = section.available.filter((p) => !schema.profiles.has(p));
      const missed = known.filter((p) => !section.available.includes(p));
      if (strayed.length > 0 || missed.length > 0) {
        throw new Finding(
          `${RUNTIME_TEMPLATE}'s \`available:\` and ${PROCESS_SCHEMA}'s profiles disagree` +
            (strayed.length > 0
              ? ` — the template offers ${strayed.join(', ')}, which the schema does not declare`
              : '') +
            (missed.length > 0
              ? ` — the schema declares ${missed.join(', ')}, which the template does not offer`
              : '') +
            '. A settings screen rendered from the template alone would hide a profile that exists.',
        );
      }
    }
    const values = new Map<string, string>();
    for (const [id, sw] of schema.switches) {
      const v = sw.profiles.get(section.profile);
      if (v === undefined) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the switch \`${id}\` names no value under the profile ` +
            `\`${section.profile}\`, so this project's loop is undefined at that switch.`,
        );
      }
      if (!sw.values.includes(v)) {
        throw new Finding(
          `${PROCESS_SCHEMA}: the switch \`${id}\` takes the value \`${v}\` under ` +
            `\`${section.profile}\`, which is not in its own value set (${sw.values.join(', ')}).`,
        );
      }
      values.set(id, v);
    }
    const overridden = new Set<string>();
    for (const [id, v] of section.overrides) {
      const sw = schema.switches.get(id);
      if (sw === undefined) {
        throw new Finding(
          `${RUNTIME_TEMPLATE} sets the switch \`${id}\`, which ${PROCESS_SCHEMA} does not declare. ` +
            'A switch set in the template and declared nowhere is a setting no surface can explain.',
        );
      }
      if (sw.floor) {
        throw new Finding(
          `${RUNTIME_TEMPLATE} sets \`${id}\` to \`${v}\`, and \`${id}\` is FLOOR: no profile turns ` +
            `it off (${sw.what}). The floor is the set the room ruled a project may not refine, so ` +
            'this is refused rather than applied.',
        );
      }
      if (!sw.values.includes(v)) {
        throw new Finding(
          `${RUNTIME_TEMPLATE} sets \`${id}\` to \`${v}\`, which is not one of its values ` +
            `(${sw.values.join(', ')}).`,
        );
      }
      values.set(id, v);
      overridden.add(id);
    }
    return { profile: section.profile, available: known, values, overridden };
  }

  /**
   * ONE SWITCH'S VALUE, AND THE ONLY WAY A SURFACE READS ONE.
   *
   * Every read goes through here so that a switch the resolution has
   * DROPPED is a refusal rather than an `undefined` that reads as false.
   * That is also what makes the arm's own switch bodies measurable: the
   * mutant for a switch is the arm ignoring it, and ignoring it lands
   * exactly here.
   */
  function switchValue(settings: ProcessSettings, id: string): string {
    const v = settings.values.get(id);
    if (v === undefined) {
      throw new Finding(
        `the process switch \`${id}\` is not in this project's resolved settings, so the arm cannot ` +
          `read it. Either ${PROCESS_SCHEMA} no longer declares it, or the resolution dropped it — ` +
          'and an arm that carried on would be running that step on its own memory of the loop ' +
          "rather than on the project's setting.",
      );
    }
    return v;
  }

  /**
   * THE READ OF EVERY SWITCH, in the schema's own order.
   *
   * This is the row set the dispatch brief prints, the merge names its
   * governing switches out of and the settings screens render — and it is
   * built by READING each switch through `switchValue`, never by walking
   * the resolution's own map. The difference is the whole keeper: a
   * switch the schema declares and the resolution lost is a THROW here,
   * where a walk of the map would simply render one row fewer and nobody
   * would see the loss.
   */
  function processLedger(schema: ProcessSchema, settings: ProcessSettings): LedgerRow[] {
    const rows: LedgerRow[] = [];
    for (const [id, sw] of schema.switches) {
      rows.push({
        id,
        value: switchValue(settings, id),
        what: sw.what,
        effect: sw.effect,
        reads: sw.reads,
        floor: sw.floor,
        band: sw.band,
        cost: sw.cost,
        implementation: sw.implementation,
        manualAction: sw.manualAction,
        overridden: settings.overridden.has(id),
      });
    }
    return rows;
  }

  /**
   * THE FORBIDDEN COMBINATIONS, EACH NAMED.
   *
   * A constraint reads `<this value> => <other id>=<other value>`: while
   * this switch holds one of the values on the left, the switch on the
   * right must hold one of the values on the right. A finding names BOTH
   * switches and BOTH values, because "invalid configuration" sends a
   * reader to a settings screen with nothing to look at.
   */
  function constraintFindings(schema: ProcessSchema, settings: ProcessSettings): string[] {
    const findings: string[] = [];
    for (const [id, sw] of schema.switches) {
      const mine = switchValue(settings, id);
      for (const need of sw.needs) {
        const m = /^\s*(.+?)\s*=>\s*([A-Za-z0-9_.-]+)\s*=\s*(.+?)\s*$/.exec(need);
        if (m === null) {
          findings.push(
            `${PROCESS_SCHEMA}: the switch \`${id}\` declares the need ${JSON.stringify(need)}, ` +
              'which is not of the form `<value> => <other id>=<value>`',
          );
          continue;
        }
        const when = m[1] as string;
        const other = m[2] as string;
        const wanted = m[3] as string;
        if (!schema.switches.has(other)) {
          findings.push(
            `${PROCESS_SCHEMA}: the switch \`${id}\` needs \`${other}\`, which this schema does not ` +
              'declare — a constraint on a switch nobody can set',
          );
          continue;
        }
        if (!needMatches(when, mine)) continue;
        const has = switchValue(settings, other);
        if (needMatches(wanted, has)) continue;
        findings.push(
          `FORBIDDEN COMBINATION: \`${id}\` is \`${mine}\` and that needs \`${other}\` to be ` +
            `\`${wanted
              .split('|')
              .map((s) => s.trim())
              .join('` or `')}\`, but \`${other}\` is ` +
            `\`${has}\`. ${sw.what} — ${sw.effect}`,
        );
      }
    }
    return findings;
  }

  /* ── THE DISPATCH BLOCK, READ (T-319) ──────────────────────────────
   *
   * ONE TYPED VALUE OR A NAMED REFUSAL, AND NEVER A PARTIAL ONE. The
   * block records an owner's approval, and half a record of an approval
   * is worse than none: a reader that took the cards and shrugged at a
   * malformed `until` would report a grant nobody gave. So every shape
   * the declaration names is checked, every refusal says which rule it
   * is, and a block that trips one produces no value at all.
   *
   * AND THE READING IS LINE-BASED, like the schema's above and for the
   * same reason (a packaged script has no devDependencies). That is why
   * a DUPLICATE KEY is this module's own refusal to make: a record
   * written twice is a record meant once, and which of the two halves
   * survives is then the READER'S choice rather than the author's —
   * leniency here would lose whichever half somebody meant, silently,
   * inside a record of an approval.
   *
   * WHAT THIS READER DOES NOT DO. It does not admit or refuse a
   * dispatch, it does not compare a card's file against its recorded
   * blob sha, and it promises no tamper prevention from an integer: it
   * validates the sequence it is GIVEN and attributes each grant to its
   * recorded `given_by`. T-324 owns admission.
   * ─────────────────────────────────────────────────────────────────── */

  /** One line of the block, with the indent and the line number a refusal quotes. */
  interface BlockLine {
    no: number;
    indent: number;
    text: string;
  }

  /** A value as the block spells it, before the declaration says what it must be. */
  type RawValue =
    | { kind: 'scalar'; value: string; no: number }
    | { kind: 'flow'; items: string[]; no: number }
    | { kind: 'map'; entries: Map<string, RawValue>; no: number }
    | { kind: 'list'; items: RawValue[]; no: number };

  function dispatchBlock(templateYaml: string, schema: ProcessSchema): DispatchBlock {
    const decl = schema.dispatch;
    if (decl === null) {
      throw new Finding(
        `${PROCESS_SCHEMA} declares no \`${DISPATCH_DECLARATION}:\` section, so a dispatch block ` +
          `in ${RUNTIME_TEMPLATE} has nothing to be validated against. The block is read against ` +
          'its declaration or not at all — a reader that fell back on its own idea of the shape ' +
          'would be a second declaration nobody could see.',
      );
    }

    /** One field's row, or a refusal naming the field this reader wanted. */
    const rowOf = (id: string): DispatchFieldDeclaration => {
      const row = decl.fields.get(id);
      if (row === undefined) {
        throw new Finding(
          `${PROCESS_SCHEMA}'s \`${DISPATCH_DECLARATION}:\` section declares no \`${id}\` field, ` +
            'and this reader answers it by name.',
        );
      }
      return row;
    };

    /** The ids the declaration carries directly inside `prefix` — `''` for the block itself. */
    const childrenOf = (prefix: string): string[] => {
      const out: string[] = [];
      for (const id of decl.fields.keys()) {
        const dot = id.lastIndexOf('.');
        const parent = dot === -1 ? '' : id.slice(0, dot);
        if (parent === prefix) out.push(dot === -1 ? id : id.slice(dot + 1));
      }
      return out;
    };

    /** THE EXPLICIT NO-GRANT STATE, taken from the declaration's own `absent:` values. */
    const noGrant = (): DispatchBlock => ({
      present: false,
      approval: rowOf('approval').absent,
      recovery: rowOf('recovery').absent,
      grant: null,
      revoked: null,
      limits: null,
      history: [],
      current: null,
      revision: 0,
    });

    const lines = templateYaml.split(/\r?\n/);
    const head = new RegExp(`^${decl.key}:\\s*(?:#.*)?$`);
    const headAnyway = new RegExp(`^${decl.key}:`);
    const at = lines.findIndex((l) => headAnyway.test(l));
    // THE BLOCK IS ABSENT, WHICH IS A STATE AND NOT A FAILURE. No grant
    // is ever created by guessing a person, an instant or a past
    // authorization, so the answer here is the declaration's own.
    if (at === -1) return noGrant();
    if (!head.test(lines[at] as string)) {
      throw new Finding(
        `${RUNTIME_TEMPLATE} line ${String(at + 1)}: \`${decl.key}:\` carries a value on its own ` +
          'line. The dispatch block is a block: its fields are ' +
          `${childrenOf('').join(', ')}.`,
      );
    }

    const body: BlockLine[] = [];
    for (let i = at + 1; i < lines.length; i += 1) {
      const line = lines[i] as string;
      if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
      if (!/^\s/.test(line)) break;
      body.push({ no: i + 1, indent: indentOf(line), text: line.trim() });
    }
    if (body.length === 0) {
      throw new Finding(
        `${RUNTIME_TEMPLATE} line ${String(at + 1)}: the \`${decl.key}:\` block is empty. An empty ` +
          'block is not the no-grant state — leave the block out entirely for that, so that a ' +
          'reader can tell a record nobody wrote from one somebody emptied.',
      );
    }

    const indentRefusal = (l: BlockLine): Error =>
      new Finding(
        `${RUNTIME_TEMPLATE} line ${String(l.no)}: an indent of ${String(l.indent)} the dispatch ` +
          `block reader does not know, at: ${l.text}`,
      );

    let i = 0;

    /** The value of one key: a scalar, a flow list, a nested block or a list of them. */
    const readValue = (rest: string, l: BlockLine, ownIndent: number): RawValue => {
      if (rest.trim() !== '') {
        return rest.trim().startsWith('[')
          ? { kind: 'flow', items: processFlowList(rest), no: l.no }
          : { kind: 'scalar', value: processScalar(rest), no: l.no };
      }
      const next = body[i];
      if (next === undefined || next.indent <= ownIndent) {
        return { kind: 'scalar', value: '', no: l.no };
      }
      if (next.indent !== ownIndent + 2) throw indentRefusal(next);
      if (next.text.startsWith('- ')) return readList(next.indent, l.no);
      return { kind: 'map', entries: readMap(next.indent), no: l.no };
    };

    /** The keys at exactly one indent, with a duplicate refused rather than overwritten. */
    function readMap(indent: number): Map<string, RawValue> {
      const out = new Map<string, RawValue>();
      while (i < body.length) {
        const l = body[i] as BlockLine;
        if (l.indent < indent) break;
        if (l.indent > indent) throw indentRefusal(l);
        if (l.text.startsWith('- ')) {
          throw new Finding(
            `${RUNTIME_TEMPLATE} line ${String(l.no)}: a list item where the dispatch block ` +
              `expects a key: ${l.text}`,
          );
        }
        const m = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(l.text);
        if (m === null) {
          throw new Finding(
            `${RUNTIME_TEMPLATE} line ${String(l.no)}: a line the dispatch block reader cannot ` +
              `read: ${l.text}`,
          );
        }
        const key = m[1] as string;
        const rest = m[2] as string;
        if (out.has(key)) {
          throw new Finding(
            `${RUNTIME_TEMPLATE} line ${String(l.no)}: a DUPLICATE KEY — \`${key}\` is written ` +
              'twice in the same block. A record written twice is a record meant once, and which ' +
              'of the two halves survives would be this reader\'s choice rather than the ' +
              "author's, so it makes none.",
          );
        }
        i += 1;
        out.set(key, readValue(rest, l, indent));
      }
      return out;
    }

    /** The `- ` items at one indent, each a block of its own. */
    function readList(indent: number, no: number): RawValue {
      const items: RawValue[] = [];
      while (i < body.length) {
        const l = body[i] as BlockLine;
        if (l.indent < indent) break;
        if (l.indent > indent) throw indentRefusal(l);
        if (!l.text.startsWith('- ')) break;
        const m = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(l.text.slice(2));
        if (m === null) {
          throw new Finding(
            `${RUNTIME_TEMPLATE} line ${String(l.no)}: a list item the dispatch block reader ` +
              `cannot read: ${l.text}`,
          );
        }
        const key = m[1] as string;
        const rest = m[2] as string;
        i += 1;
        const entries = new Map<string, RawValue>();
        entries.set(key, readValue(rest, l, indent + 2));
        for (const [k, v] of readMap(indent + 2)) {
          if (entries.has(k)) {
            throw new Finding(
              `${RUNTIME_TEMPLATE} line ${String(v.no)}: a DUPLICATE KEY — \`${k}\` is written ` +
                'twice in the same block.',
            );
          }
          entries.set(k, v);
        }
        items.push({ kind: 'map', entries, no: l.no });
      }
      return { kind: 'list', items, no };
    }

    if ((body[0] as BlockLine).indent !== 2) throw indentRefusal(body[0] as BlockLine);
    const top = readMap(2);
    if (i < body.length) throw indentRefusal(body[i] as BlockLine);

    /**
     * EVERY KEY THE DECLARATION DOES NOT CARRY, REFUSED BY NAME, at
     * whatever depth it sits. An unknown field in a record of an approval
     * is either a typo that silently records nothing or a field somebody
     * expects to be read; both are worse than a refusal.
     */
    const refuseUnknown = (entries: Map<string, RawValue>, prefix: string): void => {
      const known = childrenOf(prefix);
      for (const [key, raw] of entries) {
        if (known.includes(key)) continue;
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${key}\` is not a field ` +
            `${prefix === '' ? 'the dispatch block' : `\`${prefix}\``} declares. The fields are ` +
            `${known.join(', ')}, and ${PROCESS_SCHEMA} is where that list is declared.`,
        );
      }
    };

    /** The named scalar, or a refusal saying what the block wrote instead. */
    const scalarAt = (raw: RawValue, id: string): string => {
      if (raw.kind !== 'scalar') {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is a ${raw.kind} and ` +
            `${PROCESS_SCHEMA} declares it a ${rowOf(id).shape}.`,
        );
      }
      return raw.value;
    };

    const readInstant = (raw: RawValue, id: string): string => {
      const v = scalarAt(raw, id);
      if (!isInstant(v)) {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is \`${v}\`, which is not an ISO ` +
            'instant (`2026-09-14T09:30:00Z`). A date a reader cannot order is a date that sorts ' +
            'wrong in whatever reads the record next.',
        );
      }
      return v;
    };

    const readText = (raw: RawValue, id: string): string => {
      const v = scalarAt(raw, id);
      if (v.trim() === '') {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is empty, and it is what this ` +
            'record attributes the grant to.',
        );
      }
      return v;
    };

    const readRevision = (raw: RawValue, id: string): number => {
      const v = scalarAt(raw, id);
      if (!POSITIVE_INTEGER.test(v)) {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is \`${v}\`, which is not a ` +
            'POSITIVE INTEGER. The revision is what decides which grant is current, and a zero, a ' +
            'negative or a decimal would leave that undecided.',
        );
      }
      return Number.parseInt(v, 10);
    };

    const readMode = (raw: RawValue, id: string): string => {
      const row = rowOf(id);
      const v = scalarAt(raw, id);
      if (!row.values.includes(v)) {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is \`${v}\`, which is not one of ` +
            `its values (${row.values.join(', ')}).`,
        );
      }
      return v;
    };

    const readCardIds = (raw: RawValue, id: string): string[] => {
      if (raw.kind !== 'flow') {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is a ${raw.kind} and ` +
            `${PROCESS_SCHEMA} declares it a list of card ids, spelled \`[T-1, T-2]\`.`,
        );
      }
      const seen = new Set<string>();
      for (const card of raw.items) {
        if (seen.has(card)) {
          throw new Finding(
            `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` names \`${card}\` twice. The ` +
              'order is unique card ids in dispatch order, and a repeated id makes "the next card" ' +
              'two different cards.',
          );
        }
        seen.add(card);
      }
      if (raw.items.length === 0) {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is empty, so this grant approves ` +
            'no card at all.',
        );
      }
      return [...raw.items];
    };

    const readCardBlobs = (raw: RawValue, id: string): Map<string, string> => {
      if (raw.kind !== 'map') {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is a ${raw.kind} and ` +
            `${PROCESS_SCHEMA} declares it a map from a card id to the blob sha of its file.`,
        );
      }
      const out = new Map<string, string>();
      for (const [card, sha] of raw.entries) {
        const v = scalarAt(sha, id);
        if (!BLOB_SHA.test(v)) {
          throw new Finding(
            `${RUNTIME_TEMPLATE} line ${String(sha.no)}: the blob sha \`${v}\` recorded for ` +
              `\`${card}\` under \`${id}\` is not 40 hexadecimal characters. The sha is what says ` +
              'WHICH revision of that card was approved, so a malformed one approves nothing.',
          );
        }
        out.set(card, v);
      }
      return out;
    };

    const readTokenCeilings = (raw: RawValue, id: string): Map<string, number> => {
      if (raw.kind !== 'map') {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: \`${id}\` is a ${raw.kind} and ` +
            `${PROCESS_SCHEMA} declares it a map from a provider to a positive integer.`,
        );
      }
      const out = new Map<string, number>();
      for (const [provider, amount] of raw.entries) {
        const v = scalarAt(amount, id);
        if (!POSITIVE_INTEGER.test(v)) {
          throw new Finding(
            `${RUNTIME_TEMPLATE} line ${String(amount.no)}: the ceiling \`${v}\` recorded for ` +
              `\`${provider}\` under \`${id}\` is not a positive integer. The ceiling is ADVISORY ` +
              'here — nothing in this tree reads it to stop anything — and a ceiling nobody can ' +
              'read is not even that.',
          );
        }
        out.set(provider, Number.parseInt(v, 10));
      }
      return out;
    };

    /** A container's own rows, present or refused by name, with `with-until` decided by the mode. */
    const requireChildren = (
      entries: Map<string, RawValue>,
      prefix: string,
      where: string,
      untilOwed: boolean | null,
    ): void => {
      for (const child of childrenOf(prefix)) {
        const row = rowOf(prefix === '' ? child : `${prefix}.${child}`);
        const there = entries.has(child);
        if (row.required === 'with-until' && untilOwed !== null) {
          if (untilOwed && !there) {
            throw new Finding(
              `${where} names no \`${child}\`, and the approval mode is ` +
                `\`${DISPATCH_UNTIL_VALUE}\`: the grant runs ` +
                'up to and including a named card, and without the name it runs to nowhere.',
            );
          }
          if (!untilOwed && there) {
            throw new Finding(
              `${where} names \`${child}\` and the approval mode is not ` +
                `\`${DISPATCH_UNTIL_VALUE}\`. The card a ` +
                'grant runs up to belongs to that mode and to no other, so this is refused rather ' +
                'than ignored.',
            );
          }
          continue;
        }
        if (row.required === 'optional' || row.required === 'with-until') continue;
        if (!there) {
          throw new Finding(
            `${where} declares no \`${child}\`, which ${PROCESS_SCHEMA} makes ` +
              `\`required: ${row.required}\`. A record of an approval missing one of its fields ` +
              'is half a record, and this reader answers a refusal rather than a partial value.',
          );
        }
      }
    };

    /** One grant — the current one or a history entry — read whole against the declaration. */
    const readGrant = (raw: RawValue, where: string, untilOwed: boolean | null): DispatchGrant => {
      if (raw.kind !== 'map') {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(raw.no)}: ${where} is a ${raw.kind} and ` +
            `${PROCESS_SCHEMA} declares it a block of its own.`,
        );
      }
      refuseUnknown(raw.entries, 'grant');
      requireChildren(raw.entries, 'grant', `${where} at ${RUNTIME_TEMPLATE} line ${String(raw.no)}`, untilOwed);
      const order = readCardIds(raw.entries.get('order') as RawValue, 'grant.order');
      const cards = readCardBlobs(raw.entries.get('cards') as RawValue, 'grant.cards');
      const missing = order.filter((c) => !cards.has(c));
      const extra = [...cards.keys()].filter((c) => !order.includes(c));
      if (missing.length > 0 || extra.length > 0) {
        throw new Finding(
          `${where} at ${RUNTIME_TEMPLATE} line ${String(raw.no)}: its \`order\` and its \`cards\` ` +
            'DISAGREE' +
            (missing.length > 0 ? ` — the order names ${missing.join(', ')}, which cards does not` : '') +
            (extra.length > 0 ? ` — cards names ${extra.join(', ')}, which the order does not` : '') +
            '. The keys of `cards` are exactly the order\'s ids, because a card in one and not the ' +
            'other is either an approval with no revision or a revision nobody approved.',
        );
      }
      const untilRaw = raw.entries.get('until');
      let until: string | null = null;
      if (untilRaw !== undefined) {
        until = scalarAt(untilRaw, 'grant.until');
        if (!order.includes(until)) {
          throw new Finding(
            `${where} at ${RUNTIME_TEMPLATE} line ${String(untilRaw.no)}: its \`until\` names ` +
              `\`${until}\`, which its own \`order\` does not carry (${order.join(', ')}). A grant ` +
              'that runs up to a card outside its order names a stopping point it never reaches.',
          );
        }
      }
      return {
        givenBy: readText(raw.entries.get('given_by') as RawValue, 'grant.given_by'),
        at: readInstant(raw.entries.get('at') as RawValue, 'grant.at'),
        revision: readRevision(raw.entries.get('revision') as RawValue, 'grant.revision'),
        order,
        until,
        cards,
      };
    };

    refuseUnknown(top, '');
    const approvalRaw = top.get('approval');
    if (approvalRaw === undefined) {
      throw new Finding(
        `${RUNTIME_TEMPLATE}'s \`${decl.key}:\` block declares no \`approval\`, which ` +
          `${PROCESS_SCHEMA} makes required. Leave the block out entirely for the no-grant state; ` +
          'a block that is there says what it approves.',
      );
    }
    const approval = readMode(approvalRaw, 'approval');
    requireChildren(top, '', `${RUNTIME_TEMPLATE}'s \`${decl.key}:\` block`, null);
    const recovery = readMode(top.get('recovery') as RawValue, 'recovery');

    const grantRaw = top.get('grant') as RawValue;
    const grant = readGrant(grantRaw, 'the grant', approval === DISPATCH_UNTIL_VALUE);

    const revokedRaw = top.get('revoked');
    let revoked: DispatchRevocation | null = null;
    if (revokedRaw !== undefined) {
      if (revokedRaw.kind !== 'map') {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(revokedRaw.no)}: \`revoked\` is a ${revokedRaw.kind} ` +
            `and ${PROCESS_SCHEMA} declares it a block of its own.`,
        );
      }
      refuseUnknown(revokedRaw.entries, 'revoked');
      requireChildren(
        revokedRaw.entries,
        'revoked',
        `the revocation at ${RUNTIME_TEMPLATE} line ${String(revokedRaw.no)}`,
        null,
      );
      revoked = {
        at: readInstant(revokedRaw.entries.get('at') as RawValue, 'revoked.at'),
        by: readText(revokedRaw.entries.get('by') as RawValue, 'revoked.by'),
      };
    }

    const limitsRaw = top.get('limits');
    let limits: DispatchLimits | null = null;
    if (limitsRaw !== undefined) {
      if (limitsRaw.kind !== 'map') {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(limitsRaw.no)}: \`limits\` is a ${limitsRaw.kind} and ` +
            `${PROCESS_SCHEMA} declares it a block of its own.`,
        );
      }
      refuseUnknown(limitsRaw.entries, 'limits');
      requireChildren(
        limitsRaw.entries,
        'limits',
        `the limits at ${RUNTIME_TEMPLATE} line ${String(limitsRaw.no)}`,
        null,
      );
      limits = {
        tokens: readTokenCeilings(limitsRaw.entries.get('tokens') as RawValue, 'limits.tokens'),
        expiresAt: readInstant(limitsRaw.entries.get('expires_at') as RawValue, 'limits.expires_at'),
      };
    }

    const historyRaw = top.get('history') as RawValue;
    const history: DispatchGrant[] = [];
    if (historyRaw.kind === 'scalar' && historyRaw.value === '') {
      throw new Finding(
        `${RUNTIME_TEMPLATE} line ${String(historyRaw.no)}: \`history\` carries nothing at all. ` +
          'Write `history: []` for a first grant — an empty list is a statement and a blank is a ' +
          'field somebody stopped writing.',
      );
    }
    if (historyRaw.kind === 'flow') {
      if (historyRaw.items.length > 0) {
        throw new Finding(
          `${RUNTIME_TEMPLATE} line ${String(historyRaw.no)}: \`history\` is a flow list with ` +
            'items in it. Earlier grants are blocks, one per `- ` item.',
        );
      }
    } else if (historyRaw.kind === 'list') {
      for (const entry of historyRaw.items) {
        // A HISTORY ENTRY'S `until` IS ITS OWN. The approval mode belongs
        // to the block and not to a grant, so an earlier grant may carry
        // an `until` under a block that is now `standing` — what is
        // checked is that its own order carries the card.
        history.push(readGrant(entry, 'an earlier grant', null));
      }
    } else {
      throw new Finding(
        `${RUNTIME_TEMPLATE} line ${String(historyRaw.no)}: \`history\` is a ${historyRaw.kind} ` +
          'and the declaration makes it a list of earlier grants.',
      );
    }

    // TWO GRANTS AT ONE REVISION LEAVE "WHICH IS CURRENT" UNDECIDED, and
    // the revision is the ONLY thing that decides it — never a date.
    const seen = new Map<number, string>();
    for (const [what, g] of [['the grant', grant], ...history.map((h) => ['an earlier grant', h] as const)] as [
      string,
      DispatchGrant,
    ][]) {
      const already = seen.get(g.revision);
      if (already !== undefined) {
        throw new Finding(
          `${RUNTIME_TEMPLATE}'s \`${decl.key}:\` block carries TWO GRANTS AT REVISION ` +
            `${String(g.revision)} — ${already} and ${what}. The revision is the one thing that ` +
            'decides which grant is current, so two of them leave that undecided; a date cannot ' +
            'break the tie, which is the whole reason the revision exists.',
        );
      }
      seen.set(g.revision, what);
    }
    for (const earlier of history) {
      if (earlier.revision >= grant.revision) {
        throw new Finding(
          `${RUNTIME_TEMPLATE}'s \`${decl.key}:\` block carries an earlier grant at revision ` +
            `${String(earlier.revision)}, which is not BELOW the current revision ` +
            `${String(grant.revision)}. Every grant in the history was superseded by the one in ` +
            '`grant`, and a history entry at or above it says the opposite.',
        );
      }
    }

    const current = revoked === null ? grant : null;
    return {
      present: true,
      approval,
      recovery,
      grant,
      revoked,
      limits,
      history,
      current,
      revision: current === null ? 0 : current.revision,
    };
  }

  return {
    parseProcessSchema,
    processSection,
    resolveProcess,
    switchValue,
    processLedger,
    constraintFindings,
    dispatchBlock,
  };
}

/**
 * THE READER EVERY SURFACE THAT HAS NO ERROR CLASS OF ITS OWN USES —
 * bound to `ProcessFinding`, and the seven symbols spread out under the
 * names the arm has always used so that a browser importer reads the
 * same call it would read in the terminal.
 */
const bound: ProcessSettingsReader = processSettingsReader();

export const parseProcessSchema: ProcessSettingsReader['parseProcessSchema'] = bound.parseProcessSchema;
export const processSection: ProcessSettingsReader['processSection'] = bound.processSection;
export const resolveProcess: ProcessSettingsReader['resolveProcess'] = bound.resolveProcess;
export const switchValue: ProcessSettingsReader['switchValue'] = bound.switchValue;
export const processLedger: ProcessSettingsReader['processLedger'] = bound.processLedger;
export const constraintFindings: ProcessSettingsReader['constraintFindings'] = bound.constraintFindings;
export const dispatchBlock: ProcessSettingsReader['dispatchBlock'] = bound.dispatchBlock;
