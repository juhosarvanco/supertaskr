import { extractFrontmatter } from './frontmatter.js';
import { parseModelSession } from './model-session.js';
import {
  REVIEW_MODES,
  TASK_SIZES,
  TASK_STATUSES,
  type ModelSession,
  type ParseIssue,
  type ReviewMode,
  type TaskParseResult,
  type TaskRecord,
  type TaskSections,
  type TaskSize,
  type TaskStatus,
} from './types.js';

/** Frontmatter keys defined by method/tasks/TASK-FORMAT.md. */
const KNOWN_FIELDS = new Set([
  'id',
  'title',
  'feature',
  'milestone',
  'priority',
  'size',
  'status',
  'blocked_by',
  'touches',
  'suggested_by',
  'builder',
  'verifier',
  'built_by',
  'verified_by',
  'review',
]);

/** YAML empty values (`builder:`) arrive as null; treat like absent. */
function isAbsent(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Split a task body into its three known `##` sections
 * (Acceptance criteria / Implementation notes / Verdicts), plus the
 * PREAMBLE: body text before the first `##` heading of any kind (T-019,
 * absorbing T-002-s2 — a suggestion's context paragraph is its entire
 * content, so a body with no headings at all is all preamble).
 * Unknown `##` headings are still ignored; `###` and deeper stay inside
 * their section's content. A heading that never appears yields no key.
 */
export function splitSections(body: string): TaskSections {
  // Null prototype: headings are untrusted lookup keys, and on a plain {}
  // `KEYS['__proto__']` / `KEYS['constructor']` return inherited values
  // (truthy!), turning those headings into garbage section keys instead of
  // being ignored (same injection family as the extra fix below).
  const KEYS: Record<string, keyof TaskSections> = Object.assign(Object.create(null), {
    'acceptance criteria': 'acceptanceCriteria',
    'implementation notes': 'implementationNotes',
    verdicts: 'verdicts',
  });
  const sections: TaskSections = {};
  const lines = body.split(/\r?\n/);
  // Before any `##` heading is seen, lines accumulate as the preamble
  // (`current` starts there); after one, headingless stretches under
  // UNKNOWN headings stay dropped (current = undefined), as before.
  let sawHeading = false;
  let current: keyof TaskSections | undefined = 'preamble';
  let buffer: string[] = [];

  const flush = () => {
    if (current === undefined) return;
    const text = buffer.join('\n').trim();
    if (current === 'preamble' && text === '') return; // no empty-string preamble
    sections[current] =
      sections[current] === undefined || sections[current] === ''
        ? text
        : `${sections[current]}\n\n${text}`.trim();
  };

  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading && heading[1] !== undefined) {
      flush();
      sawHeading = true;
      current = KEYS[heading[1].toLowerCase().replace(/\s+/g, ' ')];
      buffer = [];
      continue;
    }
    if (!sawHeading || current !== undefined) buffer.push(line);
  }
  flush();
  return sections;
}

/**
 * Parse one task file's content into a TaskRecord.
 *
 * Never throws on bad input: problems come back as structured issues
 * naming the file and (where one exists) the field. A record is returned
 * when the file's identity holds — `title` plus a valid `status`, and an
 * `id` where required — even if other fields carry issues, so callers can
 * still render the card alongside its errors.
 *
 * Requiredness is status-aware per TASK-FORMAT.md: suggestions are minimal
 * files (no id/feature/milestone/priority/size required, suggested_by
 * required); parked entries may be backbone-level notes (placement fields
 * optional); every other status requires the full placement set.
 */
export function parseTaskFile(content: string, file: string): TaskParseResult {
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

  // -- status first: requiredness of everything else depends on it.
  let status: TaskStatus | undefined;
  if (isAbsent(data.status)) {
    missing('status');
  } else if (
    !isNonEmptyString(data.status) ||
    !(TASK_STATUSES as readonly string[]).includes(data.status.trim())
  ) {
    invalid(
      'status',
      `must be one of ${TASK_STATUSES.join(' | ')}, got ${JSON.stringify(data.status)}`,
    );
  } else {
    status = data.status.trim() as TaskStatus;
  }

  const statusKnown = status !== undefined;
  const isSuggested = status === 'suggested';
  const isMinimal = status === 'suggested' || status === 'parked';

  // -- title: always required.
  let title: string | undefined;
  if (isAbsent(data.title)) {
    missing('title');
  } else if (!isNonEmptyString(data.title)) {
    invalid('title', `must be a non-empty string, got ${JSON.stringify(data.title)}`);
  } else {
    title = data.title;
  }

  // -- id: required except on suggestions (renumbered at triage).
  //    Format (T-019): the T-NNN / T-NNN-sN family, same first-match
  //    ordering discipline as the feature rule below. A format-invalid id
  //    stays off the record, so — like an absent one — the identity gate
  //    withholds the card for statuses that require an id (the loud-trap
  //    design; consistent with the pinned `id: 007` YAML-number probe).
  let id: string | undefined;
  if (isAbsent(data.id)) {
    if (statusKnown && !isSuggested) missing('id');
  } else if (!isNonEmptyString(data.id)) {
    invalid('id', `must be a non-empty string, got ${JSON.stringify(data.id)}`);
  } else if (!/^T-\d+(?:-s\d+)?$/.test(data.id.trim())) {
    invalid('id', `must be a task id like T-016 or T-016-s2, got ${JSON.stringify(data.id)}`);
  } else {
    id = data.id.trim();
  }

  // -- placement fields: required unless the status is a minimal one.
  const requirePlacement = statusKnown && !isMinimal;

  let feature: string | undefined;
  if (isAbsent(data.feature)) {
    if (requirePlacement) missing('feature');
  } else if (!isNonEmptyString(data.feature) || !/^F-\d+$/.test(data.feature.trim())) {
    invalid('feature', `must be a feature id like F-02, got ${JSON.stringify(data.feature)}`);
  } else {
    feature = data.feature.trim();
  }

  const intField = (field: 'milestone' | 'priority'): number | undefined => {
    const value = data[field];
    if (isAbsent(value)) {
      if (requirePlacement) missing(field);
      return undefined;
    }
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      invalid(field, `must be an integer, got ${JSON.stringify(value)}`);
      return undefined;
    }
    return value;
  };
  const milestone = intField('milestone');
  const priority = intField('priority');

  let size: TaskSize | undefined;
  if (isAbsent(data.size)) {
    if (requirePlacement) missing('size');
  } else if (
    !isNonEmptyString(data.size) ||
    !(TASK_SIZES as readonly string[]).includes(data.size.trim())
  ) {
    invalid('size', `must be one of ${TASK_SIZES.join(' | ')}, got ${JSON.stringify(data.size)}`);
  } else {
    size = data.size.trim() as TaskSize;
  }

  // -- list fields: default [].
  const listField = (field: 'blocked_by' | 'touches'): string[] => {
    const value = data[field];
    if (isAbsent(value)) return [];
    if (!Array.isArray(value)) {
      invalid(field, `must be a list like [T-001, T-002], got ${JSON.stringify(value)}`);
      return [];
    }
    const out: string[] = [];
    for (const entry of value) {
      if (isNonEmptyString(entry)) out.push(entry.trim());
      else invalid(field, `entries must be non-empty strings, got ${JSON.stringify(entry)}`);
    }
    return out;
  };
  const blockedBy = listField('blocked_by');
  const touches = listField('touches');

  // -- suggested_by: required on suggestions, free-form attribution.
  let suggestedBy: string | undefined;
  if (isAbsent(data.suggested_by)) {
    if (isSuggested) missing('suggested_by');
  } else if (!isNonEmptyString(data.suggested_by)) {
    invalid('suggested_by', `must be a string, got ${JSON.stringify(data.suggested_by)}`);
  } else {
    suggestedBy = data.suggested_by.trim();
  }

  // -- model[@session] fields.
  const modelField = (
    field: 'builder' | 'verifier' | 'built_by' | 'verified_by',
  ): ModelSession | undefined => {
    const value = data[field];
    if (isAbsent(value)) return undefined;
    if (!isNonEmptyString(value)) {
      invalid(field, `must be model[@session] like codex@S3, got ${JSON.stringify(value)}`);
      return undefined;
    }
    const parsed = parseModelSession(value);
    if (parsed.model === '') {
      invalid(field, `has no model before '@' in ${JSON.stringify(value)}`);
      return undefined;
    }
    if (parsed.session === '') {
      invalid(field, `has an empty session after '@' in ${JSON.stringify(value)}`);
      return undefined;
    }
    return parsed;
  };
  const builder = modelField('builder');
  const verifier = modelField('verifier');
  const builtBy = modelField('built_by');
  const verifiedBy = modelField('verified_by');

  // -- review guarantee.
  let review: ReviewMode | undefined;
  if (!isAbsent(data.review)) {
    if (
      !isNonEmptyString(data.review) ||
      !(REVIEW_MODES as readonly string[]).includes(data.review.trim())
    ) {
      invalid(
        'review',
        `must be one of ${REVIEW_MODES.join(' | ')}, got ${JSON.stringify(data.review)}`,
      );
    } else {
      review = data.review.trim() as ReviewMode;
    }
  }

  // -- unknown keys: preserved, never silently deleted. Null prototype so
  //    hostile key names (`__proto__`, `constructor`, …) land as own data
  //    properties instead of hitting Object.prototype's inherited setter —
  //    a plain {} silently dropped `__proto__:` and replaced extra's
  //    prototype with attacker data (REJECTED verdict, 2026-08-14).
  const extra: Record<string, unknown> = Object.create(null);
  for (const [key, value] of Object.entries(data)) {
    if (!KNOWN_FIELDS.has(key)) extra[key] = value;
  }

  // -- identity gate: without title + valid status (+ id where required)
  //    there is no card to return.
  const identityOk =
    title !== undefined && status !== undefined && (id !== undefined || isSuggested);
  if (!identityOk || title === undefined || status === undefined) {
    return { issues };
  }

  const task: TaskRecord = {
    ...(id !== undefined ? { id } : {}),
    title,
    status,
    ...(feature !== undefined ? { feature } : {}),
    ...(milestone !== undefined ? { milestone } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(size !== undefined ? { size } : {}),
    blockedBy,
    touches,
    ...(suggestedBy !== undefined ? { suggestedBy } : {}),
    ...(builder !== undefined ? { builder } : {}),
    ...(verifier !== undefined ? { verifier } : {}),
    ...(builtBy !== undefined ? { builtBy } : {}),
    ...(verifiedBy !== undefined ? { verifiedBy } : {}),
    ...(review !== undefined ? { review } : {}),
    extra,
    sections: splitSections(fm.body),
    file,
  };
  return { task, issues };
}
