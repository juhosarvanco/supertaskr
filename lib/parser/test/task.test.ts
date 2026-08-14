import { describe, expect, it } from 'vitest';
import { parseTaskFile } from '../src/index.js';

const FILE = 'docs/tasks/T-016-audit-log.md';

const VALID = `---
id: T-016
title: Audit log
feature: F-03            # story map column
milestone: 2             # above/below the slice line
priority: 2              # position in column; 1 = top = next
size: M                  # S | M | L
status: planned          # suggested | planned | building | verifying |
                         # rejected | merging | done | parked
blocked_by: [T-015]
touches: [C-03, src/egress/]
suggested_by:
builder: codex@S3
verifier: claude-fable-5
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN an egress event occurs THE system SHALL log it
- IF the log is unavailable THEN THE system SHALL fail closed

## Implementation notes

## Verdicts
`;

describe('parseTaskFile — valid task', () => {
  it('parses every frontmatter field of a valid task with zero issues', () => {
    const { task, issues } = parseTaskFile(VALID, FILE);
    expect(issues).toEqual([]);
    expect(task).toBeDefined();
    expect(task).toMatchObject({
      id: 'T-016',
      title: 'Audit log',
      feature: 'F-03',
      milestone: 2,
      priority: 2,
      size: 'M',
      status: 'planned',
      blockedBy: ['T-015'],
      touches: ['C-03', 'src/egress/'],
      file: FILE,
    });
    expect(task?.suggestedBy).toBeUndefined();
    expect(task?.builtBy).toBeUndefined();
    expect(task?.verifiedBy).toBeUndefined();
    expect(task?.review).toBeUndefined();
    expect(task?.extra).toEqual({});
  });

  it('parses model@session in builder and verifier', () => {
    const { task } = parseTaskFile(VALID, FILE);
    expect(task?.builder).toEqual({
      raw: 'codex@S3',
      model: 'codex',
      session: 'S3',
      policy: 'resume',
    });
    expect(task?.verifier).toEqual({
      raw: 'claude-fable-5',
      model: 'claude-fable-5',
      policy: 'default',
    });
  });

  it('parses stamped built_by/verified_by and the review guarantee', () => {
    const stamped = VALID.replace('built_by:', 'built_by: codex/gpt-5.2 @S3')
      .replace('verified_by:', 'verified_by: claude-fable-5 @fresh')
      .replace('review:', 'review: independent')
      .replace('status: planned', 'status: done   ');
    const { task, issues } = parseTaskFile(stamped, FILE);
    expect(issues).toEqual([]);
    expect(task?.status).toBe('done');
    expect(task?.builtBy?.model).toBe('codex/gpt-5.2');
    expect(task?.builtBy?.session).toBe('S3');
    expect(task?.builtBy?.policy).toBe('resume');
    expect(task?.verifiedBy?.model).toBe('claude-fable-5');
    expect(task?.verifiedBy?.policy).toBe('fresh');
    expect(task?.review).toBe('independent');
  });

  it('extracts the three body sections', () => {
    const { task } = parseTaskFile(VALID, FILE);
    expect(task?.sections.acceptanceCriteria).toContain(
      'WHEN an egress event occurs THE system SHALL log it',
    );
    expect(task?.sections.implementationNotes).toBe('');
    expect(task?.sections.verdicts).toBe('');
  });

  it('keeps ### subheadings inside their section and skips unknown ## headings', () => {
    const body = `---
id: T-020
title: Sections
feature: F-01
milestone: 1
priority: 1
size: S
status: planned
---

## Acceptance criteria
- THE system SHALL work

### Nested detail
still acceptance content

## Some unknown section
ignored entirely

## Verdicts
2026-08-14 — APPROVED
`;
    const { task, issues } = parseTaskFile(body, FILE);
    expect(issues).toEqual([]);
    expect(task?.sections.acceptanceCriteria).toContain('### Nested detail');
    expect(task?.sections.acceptanceCriteria).toContain('still acceptance content');
    expect(task?.sections.acceptanceCriteria).not.toContain('ignored entirely');
    expect(task?.sections.implementationNotes).toBeUndefined();
    expect(task?.sections.verdicts).toBe('2026-08-14 — APPROVED');
  });

  it('treats `## __proto__` and `## constructor` headings as unknown, ignored', () => {
    // Fix-pass regression test (2026-08-14): on a plain-object heading map
    // these lookups returned INHERITED values (Object.prototype / the Object
    // constructor), minting garbage section keys like '[object Object]'.
    const hostile = `---
id: T-021
title: Hostile headings
feature: F-01
milestone: 1
priority: 1
size: S
status: planned
---

## __proto__
leaked

## constructor
leaked

## Verdicts
clean
`;
    const { task, issues } = parseTaskFile(hostile, FILE);
    expect(issues).toEqual([]);
    expect(Object.keys(task?.sections ?? {})).toEqual(['verdicts']);
    expect(task?.sections.verdicts).toBe('clean');
  });

  it('preserves unknown frontmatter keys in extra instead of dropping them', () => {
    const withExtra = VALID.replace('review:', 'review:\nfuture_field: kept');
    const { task, issues } = parseTaskFile(withExtra, FILE);
    expect(issues).toEqual([]);
    expect(task?.extra).toEqual({ future_field: 'kept' });
  });
});

describe('parseTaskFile — malformed input', () => {
  it('missing required field: structured issue naming file and field', () => {
    const noSize = VALID.replace('size: M                  # S | M | L\n', '');
    const { task, issues } = parseTaskFile(noSize, FILE);
    expect(issues).toEqual([
      {
        kind: 'missing-field',
        file: FILE,
        field: 'size',
        message: expect.stringContaining(FILE),
      },
    ]);
    // identity still holds, so the card is returned alongside its issue
    expect(task?.id).toBe('T-016');
    expect(task?.size).toBeUndefined();
  });

  it('missing title (identity field): issue named, no task returned', () => {
    const noTitle = VALID.replace('title: Audit log\n', '');
    const { task, issues } = parseTaskFile(noTitle, FILE);
    expect(task).toBeUndefined();
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'missing-field', file: FILE, field: 'title' }),
    );
  });

  it('broken YAML: structured yaml-error naming the file, no throw', () => {
    const broken = `---\nid: T-016\ntitle: "unterminated\nstatus: planned\n---\n\nbody\n`;
    const { task, issues } = parseTaskFile(broken, FILE);
    expect(task).toBeUndefined();
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ kind: 'yaml-error', file: FILE });
    expect(issues[0]?.message).toContain(FILE);
  });

  it('no frontmatter block at all', () => {
    const { task, issues } = parseTaskFile('# just markdown\n', FILE);
    expect(task).toBeUndefined();
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'missing-frontmatter', file: FILE }),
    ]);
  });

  it('frontmatter that is not a mapping', () => {
    const { task, issues } = parseTaskFile('---\n- a\n- b\n---\n', FILE);
    expect(task).toBeUndefined();
    expect(issues).toEqual([expect.objectContaining({ kind: 'not-a-mapping', file: FILE })]);
  });

  it('invalid status value: invalid-field naming file and field', () => {
    const bad = VALID.replace(/status: planned.*\n/, 'status: in-progress\n');
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(task).toBeUndefined();
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'status' }),
    );
  });

  it('scalar where a list is required: invalid-field, parsing still returns the task', () => {
    const bad = VALID.replace('blocked_by: [T-015]', 'blocked_by: T-015');
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'blocked_by' }),
    );
    expect(task?.blockedBy).toEqual([]);
  });

  it('invalid review value: invalid-field', () => {
    const bad = VALID.replace('review:', 'review: rubber-stamped');
    const { issues } = parseTaskFile(bad, FILE);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'review' }),
    );
  });

  it('builder with empty session after @: invalid-field on builder', () => {
    const bad = VALID.replace('builder: codex@S3', 'builder: codex@');
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'builder' }),
    );
    expect(task?.builder).toBeUndefined();
  });
});

describe('parseTaskFile — suggested and parked statuses', () => {
  it('suggested: minimal file (title, status, suggested_by; no id) is valid', () => {
    const suggestion = `---
title: Cache parsed models
status: suggested
suggested_by: executor codex @T-101
---

One paragraph of context.
`;
    const { task, issues } = parseTaskFile(suggestion, 'docs/tasks/T-101-s1-cache.md');
    expect(issues).toEqual([]);
    expect(task).toMatchObject({
      title: 'Cache parsed models',
      status: 'suggested',
      suggestedBy: 'executor codex @T-101',
      blockedBy: [],
      touches: [],
    });
    expect(task?.id).toBeUndefined();
  });

  it('suggested without suggested_by: missing-field (attribution is required)', () => {
    const bad = `---
title: Anonymous idea
status: suggested
---
`;
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'missing-field', field: 'suggested_by', file: FILE }),
    ]);
    expect(task?.status).toBe('suggested');
  });

  it('parked: placement fields are optional, id still required', () => {
    const parked = `---
id: T-050
title: Cost telemetry
status: parked
---

Backbone-level idea.
`;
    const { task, issues } = parseTaskFile(parked, FILE);
    expect(issues).toEqual([]);
    expect(task).toMatchObject({ id: 'T-050', status: 'parked' });
  });

  it('parked with full placement fields also parses', () => {
    const parked = VALID.replace(/status: planned.*\n/, 'status: parked\n');
    const { task, issues } = parseTaskFile(parked, FILE);
    expect(issues).toEqual([]);
    expect(task?.status).toBe('parked');
    expect(task?.feature).toBe('F-03');
  });
});
