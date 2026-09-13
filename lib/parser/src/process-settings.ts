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

/** The six symbols a bound reader answers with. */
export interface ProcessSettingsReader {
  parseProcessSchema(text: string): ProcessSchema;
  processSection(templateYaml: string): ProcessSection | null;
  resolveProcess(schema: ProcessSchema, section: ProcessSection): ProcessSettings;
  switchValue(settings: ProcessSettings, id: string): string;
  processLedger(schema: ProcessSchema, settings: ProcessSettings): LedgerRow[];
  constraintFindings(schema: ProcessSchema, settings: ProcessSettings): string[];
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

/** Does a value satisfy one side of a need? `*` is every value and a `|` separates alternatives. */
function needMatches(spec: string, value: string): boolean {
  if (spec.trim() === '*') return true;
  return spec
    .split('|')
    .map((s) => s.trim())
    .includes(value);
}

/**
 * A READER BOUND TO ONE ERROR CLASS, and the six symbols it answers
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
    let block: 'none' | 'profiles' | 'switches' = 'none';
    let cur: Record<string, unknown> | null = null;
    let curId = '';
    let inProfiles = false;

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

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] as string;
      const at = `${PROCESS_SCHEMA} line ${String(i + 1)}`;
      if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
      const col = indentOf(line);
      if (col === 0) {
        close();
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
        else {
          throw new Finding(
            `${at}: \`${key}:\` is not a section this schema declares. The sections are version, ` +
              'profiles and switches.',
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
    if (version === 0 || profiles.size === 0 || switches.size === 0) {
      throw new Finding(
        `${PROCESS_SCHEMA} parsed to ${String(switches.size)} switch(es) under ` +
          `${String(profiles.size)} profile(s) at version ${String(version)}, which cannot be right. ` +
          'The schema is the ONE source every renderer reads (ADR-024 decision 6), and an empty ' +
          'reading of it would leave the arm running on its own memory of the loop.',
      );
    }
    return { version, profiles, switches };
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

  return {
    parseProcessSchema,
    processSection,
    resolveProcess,
    switchValue,
    processLedger,
    constraintFindings,
  };
}

/**
 * THE READER EVERY SURFACE THAT HAS NO ERROR CLASS OF ITS OWN USES —
 * bound to `ProcessFinding`, and the six symbols spread out under the
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
