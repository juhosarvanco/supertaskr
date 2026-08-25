import { extractFrontmatter } from './frontmatter.js';
import {
  aliasedIdSlots,
  compareDigitRuns,
  idSlotIndex,
  nearMissClause,
  slotNearMisses,
} from './id-slot.js';
import {
  COMPONENT_STATUSES,
  type ComponentParseResult,
  type ComponentRecord,
  type ComponentSetResult,
  type ComponentStatus,
  type ParseIssue,
} from './types.js';

/**
 * Architecture component files (T-008, ADR-014/015; format:
 * docs/design/map-technical-plan.md §2 as revised by §0.0):
 * `docs/architecture/components/C-xx-<slug>.md`, one component per file,
 * YAML frontmatter + prose responsibility. This module is the intent
 * layer's ONE parser — the map's derivation (T-011) consumes these
 * records instead of re-reading files.
 */

/** Frontmatter keys defined by the component-file format (plan §2 + §0.0-4). */
const KNOWN_FIELDS = new Set([
  'id',
  'name',
  'layer',
  'paths',
  'depends_on',
  'decisions',
  'status',
  'touch_slugs',
  // T-033 decision (2). ADDITIVE: no component file carried this key
  // before, so every existing file parses to the same record it did —
  // the key simply stops landing in `extra`.
  'non_code',
]);

const ID_PATTERN = /^C-(\d{2,})$/;

/** YAML empty values (`layer:`) arrive as null; treat like absent. */
function isAbsent(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Order component ids the way "first match by id order wins" means it
 * (plan §2/§4.1): numerically by the digits (`C-99` before `C-100`),
 * falling back to string order for non-conforming ids so the comparator
 * is total. Exported so derivation (T-011) reuses the SAME order instead
 * of forking it.
 *
 * TOTAL FOR EVERY INPUT SINCE T-076, which it was not: the digits used to
 * be weighed as `Number(na) - Number(nb)`, and `C-\d{2,}` bounds a digit
 * run below and never above. Past ~309 digits both sides are `Infinity`,
 * the difference is `NaN`, and `NaN !== 0` is TRUE — so it returned NaN
 * without ever reaching the string fallback, `Array.prototype.sort` was
 * entitled to do anything with the pair (V8 kept arrival order), and
 * "first match by component id order wins" — the rule the whole
 * `ambiguous-mapping` message rests on — quietly became "first by
 * whatever order the files arrived in". Between 2^53 and that range the
 * subtraction was merely wrong rather than fatal: `Number` fused
 * neighbouring runs of different LENGTHS, so `C-99999999999999999` was
 * ordered after `C-100000000000000000` by the string fallback.
 *
 * `compareDigitRuns` weighs the digits as TEXT instead, sharing the
 * canonicalization `idSlotKey` uses — so the comparator and the slot key
 * agree about what the digits of an id are by construction rather than
 * by coincidence, and inside one aliased slot the digit comparison is 0
 * and this falls through to string order exactly as `aliasedIdSlots`
 * documents.
 */
export function compareComponentIds(a: string, b: string): number {
  const na = ID_PATTERN.exec(a)?.[1];
  const nb = ID_PATTERN.exec(b)?.[1];
  if (na !== undefined && nb !== undefined) {
    const diff = compareDigitRuns(na, nb);
    if (diff !== 0) return diff;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Parse one component file's content into a ComponentRecord.
 *
 * Never throws on bad input: problems come back as structured issues
 * naming the file and (where one exists) the field. A record is returned
 * when the file's identity holds — a valid `C-\d{2,}` id plus a name —
 * even if other fields carry issues, so the map can still draw the node
 * alongside its errors. Cross-file rules (unique ids, dangling
 * depends_on, overlapping paths) live in parseComponentSet.
 *
 * Requiredness per the format: `id`, `name`, `paths` required; `layer`
 * optional; `depends_on`/`decisions`/`touch_slugs` default to `[]`;
 * `status` defaults to `auto`.
 */
export function parseComponentFile(content: string, file: string): ComponentParseResult {
  const fm = extractFrontmatter(content, file);
  const issues: ParseIssue[] = [...fm.issues];
  if (!fm.data) return { issues };
  const data = fm.data;

  const missing = (field: string): void => {
    issues.push({
      kind: 'missing-field',
      file,
      field,
      message: `${file}: missing required field '${field}'`,
    });
  };
  const invalid = (field: string, detail: string): void => {
    issues.push({
      kind: 'invalid-field',
      file,
      field,
      message: `${file}: field '${field}' ${detail}`,
    });
  };

  // -- id: required, pattern C-\d{2,} (identity — the C-registry handle).
  let id: string | undefined;
  if (isAbsent(data.id)) {
    missing('id');
  } else if (!isNonEmptyString(data.id) || !ID_PATTERN.test(data.id.trim())) {
    invalid('id', `must be a component id like C-05 (pattern C-\\d{2,}), got ${JSON.stringify(data.id)}`);
  } else {
    id = data.id.trim();
  }

  // -- name: required (identity — the node's label).
  let name: string | undefined;
  if (isAbsent(data.name)) {
    missing('name');
  } else if (!isNonEmptyString(data.name)) {
    invalid('name', `must be a non-empty string, got ${JSON.stringify(data.name)}`);
  } else {
    name = data.name.trim();
  }

  // -- layer: optional free-form label.
  let layer: string | undefined;
  if (!isAbsent(data.layer)) {
    if (!isNonEmptyString(data.layer)) {
      invalid('layer', `must be a non-empty string, got ${JSON.stringify(data.layer)}`);
    } else {
      layer = data.layer.trim();
    }
  }

  // -- list fields: entries must be non-empty strings; bad entries are
  //    flagged and dropped (mirrors the task parser's listField).
  const listField = (field: 'paths' | 'depends_on' | 'decisions' | 'touch_slugs'): string[] => {
    const value = data[field];
    if (isAbsent(value)) return [];
    if (!Array.isArray(value)) {
      invalid(field, `must be a list, got ${JSON.stringify(value)}`);
      return [];
    }
    const out: string[] = [];
    for (const entry of value) {
      if (isNonEmptyString(entry)) out.push(entry.trim());
      else invalid(field, `entries must be non-empty strings, got ${JSON.stringify(entry)}`);
    }
    return out;
  };

  // -- paths: required AND non-empty (a component must claim territory;
  //    globs matching nothing is derivation's D3, not a parse error).
  let paths: string[] = [];
  if (isAbsent(data.paths)) {
    missing('paths');
  } else {
    paths = listField('paths');
    if (Array.isArray(data.paths) && data.paths.length === 0) {
      invalid('paths', 'must be a non-empty list of gitignore-style globs, got []');
    }
    // A leading slash means "root only" in git, but every consumer of
    // these patterns strips it — which turns a SINGLE-segment pattern
    // into an unanchored one matching at any depth, the exact opposite
    // of what the author wrote (T-030, absorbing T-011-s4). Flagged, not
    // rewritten: the pattern stays on the record verbatim and keeps
    // matching as it did — the parser's job is to say so, not to guess.
    for (const pattern of paths) {
      const anchored = anchoredIdiomFor(pattern);
      if (anchored !== undefined) {
        invalid(
          'paths',
          `pattern ${JSON.stringify(pattern)} is root-anchored in git but has a single segment — the leading '/' is stripped when the pattern is matched, which UNANCHORS it (it then claims that name at any depth); write '${anchored}' for the root-anchored form`,
        );
      }
    }
  }

  const dependsOn = listField('depends_on');
  const decisions = listField('decisions');
  const touchSlugs = listField('touch_slugs');

  // -- status: default auto; any other value pins the node's color.
  let status: ComponentStatus = 'auto';
  if (!isAbsent(data.status)) {
    if (
      !isNonEmptyString(data.status) ||
      !(COMPONENT_STATUSES as readonly string[]).includes(data.status.trim())
    ) {
      invalid(
        'status',
        `must be one of ${COMPONENT_STATUSES.join(' | ')}, got ${JSON.stringify(data.status)}`,
      );
    } else {
      status = data.status.trim() as ComponentStatus;
    }
  }

  // -- non_code: OPT-IN, NEVER INFERRED (T-033 decision 2). Absent means
  //    false; anything that is not a real boolean is REFUSED rather than
  //    coerced, because the two states this flag distinguishes — "will
  //    never contain indexed code" and "nobody has built it yet" — are
  //    exactly the pair a truthy-coercion would silently merge. `non_code:
  //    "false"` and `non_code: 0` are therefore issues, not falses.
  let nonCode = false;
  if (!isAbsent(data.non_code)) {
    if (typeof data.non_code !== 'boolean') {
      invalid(
        'non_code',
        `must be a boolean (true or false), got ${JSON.stringify(data.non_code)} — this flag is opt-in and never inferred, so it is refused rather than coerced`,
      );
    } else {
      nonCode = data.non_code;
    }
  }

  // -- unknown keys: preserved, never silently deleted. Null prototype so
  //    hostile key names (`__proto__`, `constructor`, …) land as own data
  //    properties instead of hitting Object.prototype's inherited setter
  //    (ADR-009 — the T-002 REJECTED verdict's lesson).
  const extra: Record<string, unknown> = Object.create(null);
  for (const [key, value] of Object.entries(data)) {
    if (!KNOWN_FIELDS.has(key)) extra[key] = value;
  }

  // -- identity gate: without a valid id + name there is no node to
  //    return; the set-level dangling check then makes references to the
  //    broken file visible as placeholders.
  if (id === undefined || name === undefined) {
    return { issues };
  }

  const component: ComponentRecord = {
    id,
    name,
    ...(layer !== undefined ? { layer } : {}),
    paths,
    dependsOn,
    decisions,
    touchSlugs,
    status,
    nonCode,
    responsibility: fm.body.trim(),
    extra,
    file,
  };
  return { component, issues };
}

/**
 * The anchored idiom a single-segment leading-slash pattern should have
 * been written as (`/dist` → `dist/**`), or undefined when the pattern
 * does not have the problem.
 *
 * Exactly as narrow as its reason: only a LEADING SLASH claims git's
 * root-only anchoring, and only a single remaining segment loses it when
 * the slash is stripped. `/app/src/**` keeps a `/`, so it stays anchored
 * and is left alone; `dist` without the slash never claimed anchoring in
 * the first place; `./dist` is not a git anchoring marker at all. A
 * negation (`!/dist`) carries the same trap and gets the same warning,
 * with its `!` preserved in the suggestion.
 */
function anchoredIdiomFor(pattern: string): string | undefined {
  const trimmed = pattern.trim();
  const negated = trimmed.startsWith('!');
  const body = negated ? trimmed.slice(1) : trimmed;
  if (!body.startsWith('/')) return undefined;
  const stem = body.slice(1).replace(/\/+$/, '');
  if (stem === '' || stem.includes('/')) return undefined;
  return `${negated ? '!' : ''}${stem}/**`;
}

/** One component source file: path (as reported in issues) + raw content. */
interface ComponentSourceFile {
  path: string;
  content: string;
}

/** Strip decoration that never changes what a pattern claims. */
function normalizePattern(pattern: string): string {
  const p = pattern.trim();
  if (p.startsWith('./')) return p.slice(2);
  if (p.startsWith('/')) return p.slice(1);
  return p;
}

/**
 * True when two gitignore-style patterns PROVABLY claim overlapping
 * files, without a file tree and without a glob matcher (so no matching
 * semantics are forked out of T-011's derivation):
 * - identical normalized patterns;
 * - `P/**` contains any pattern whose text starts with `P/` (everything
 *   such a pattern can match lives under P, whatever wildcards follow).
 * Negated patterns (`!…`) never participate. Anything subtler (e.g. a
 * bare directory name vs `dir/**`) is left to derivation against the
 * real tree — conservative by design, so a certain warning is never
 * wrong and an uncertain overlap is never guessed at.
 */
function patternsCertainlyOverlap(a: string, b: string): boolean {
  const na = normalizePattern(a);
  const nb = normalizePattern(b);
  if (na.startsWith('!') || nb.startsWith('!')) return false;
  if (na === nb) return true;
  const contains = (outer: string, inner: string): boolean =>
    outer.endsWith('/**') && inner.startsWith(outer.slice(0, -2));
  return contains(na, nb) || contains(nb, na);
}

/**
 * Parse a set of component files and apply the cross-file rules:
 * duplicate ids (`duplicate-id`, both records kept — flagging, not
 * hiding), numerically equal ids spelled differently (`aliased-id`,
 * T-030 absorbing T-008-s3 — one issue per aliased slot), depends_on
 * entries naming no parsed component (`dangling-reference`, edge
 * preserved on the record), and provably overlapping `paths` between two
 * components (`ambiguous-mapping`, first by id order wins). Files are
 * processed in sorted path order and pair checks in component id order,
 * so results are deterministic.
 *
 * Internal engine shared by parseComponentsFromFiles (pure) and
 * parseComponentDirectory (node); callers own file discovery/filtering.
 */
export function parseComponentSet(files: readonly ComponentSourceFile[]): ComponentSetResult {
  const components: ComponentRecord[] = [];
  const issues: ParseIssue[] = [];

  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const byId = new Map<string, string>(); // id -> first file seen (ADR-009)
  for (const { path, content } of sorted) {
    const result = parseComponentFile(content, path);
    issues.push(...result.issues);
    if (!result.component) continue;

    const { component } = result;
    const first = byId.get(component.id);
    if (first !== undefined) {
      issues.push({
        kind: 'duplicate-id',
        space: 'component',
        id: component.id,
        files: [first, path],
        message: `duplicate component id '${component.id}' in ${first} and ${path}`,
      });
    } else {
      byId.set(component.id, path);
    }
    components.push(component);
  }

  // -- numerically equal ids that differ as strings: `C-05` and `C-005`
  //    are two registry handles for one slot. Not a duplicate-id (the
  //    strings differ, so nothing here is literally declared twice) and
  //    not harmless (compareComponentIds finds a zero numeric difference
  //    and falls through to string order, so "first by id order wins"
  //    resolves by an accident of zero-padding). ONE issue per slot, in
  //    comparator order; both records are kept.
  //
  //    The grouping itself lives in id-slot.ts since T-053 — the same
  //    aliasing is legal in the task and feature spaces, and three copies
  //    of a slot key are three chances to disagree about what an id is.
  //    Its doc carries T-030's reason the strip is TEXT and never
  //    Number(): two genuinely different ids past 2^53 must not collide
  //    into a false alias because floating point ran out of room.
  //    compareComponentIds is passed rather than defaulted because the
  //    tie this message reports IS that comparator's tie.
  for (const ids of aliasedIdSlots(byId.keys(), compareComponentIds)) {
    const files = ids.map((id) => byId.get(id) ?? '');
    const named = ids.map((id, i) => `'${id}' (${files[i] ?? ''})`).join(', ');
    issues.push({
      kind: 'aliased-id',
      space: 'component',
      ids,
      files,
      message: `numerically equal component ids ${named} — zero-padding aliases one registry slot; component id order cannot separate them, so which one wins file mapping falls to string comparison`,
    });
  }

  // -- dangling depends_on: an id no parsed record declares. The edge
  //    stays in dependsOn (criterion: preserved for placeholder
  //    rendering, never dropped).
  //
  //    A NEAR MISS is named when one is available (T-076): `depends_on:
  //    [C-01]` beside a declared `C-001` reported only "no component
  //    declares it" — true, and it sends a reader hunting a component
  //    that does not exist instead of at the padding one file away. The
  //    slot index is built once rather than per reference, so a hostile
  //    registry cannot make this quadratic; it is a Map (ADR-009, via
  //    idSlotIndex).
  const declaredSlots = idSlotIndex(byId.keys());
  for (const component of components) {
    for (const dep of component.dependsOn) {
      if (!byId.has(dep)) {
        const nearMiss = slotNearMisses(dep, declaredSlots);
        issues.push({
          kind: 'dangling-reference',
          file: component.file,
          field: 'depends_on',
          id: dep,
          ...(nearMiss.length > 0 ? { nearMiss } : {}),
          message: `${component.file}: depends_on names '${dep}' but no component declares it${nearMissClause(nearMiss)} (edge preserved for placeholder rendering)`,
        });
      }
    }
  }

  // -- provable paths overlap between two DIFFERENT components. Same-id
  //    pairs are the duplicate-id case above, not an ambiguity between
  //    two components. Pairs are visited in id order; ids[0] is the
  //    winner ("first match by component id order wins").
  const inIdOrder = [...components].sort(
    (a, b) => compareComponentIds(a.id, b.id) || (a.file < b.file ? -1 : a.file > b.file ? 1 : 0),
  );
  for (let i = 0; i < inIdOrder.length; i++) {
    for (let j = i + 1; j < inIdOrder.length; j++) {
      const winner = inIdOrder[i];
      const loser = inIdOrder[j];
      if (winner === undefined || loser === undefined) continue; // unreachable
      if (winner.id === loser.id) continue;
      for (const wp of winner.paths) {
        for (const lp of loser.paths) {
          if (patternsCertainlyOverlap(wp, lp)) {
            issues.push({
              kind: 'ambiguous-mapping',
              ids: [winner.id, loser.id],
              files: [winner.file, loser.file],
              patterns: [wp, lp],
              message: `components '${winner.id}' (${winner.file}) and '${loser.id}' (${loser.file}) declare overlapping paths '${wp}' and '${lp}' — first by id, '${winner.id}', wins file mapping`,
            });
          }
        }
      }
    }
  }

  return { components, issues };
}
