import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseProject,
  parseProjectFromFiles,
  parseTaskDirectory,
  type ParseIssue,
} from '../src/index.js';

/**
 * T-016 — the rejected-suggestion encoding (method v0.1.4).
 *
 * Triage-rejected suggestions MOVE to docs/tasks/rejected/ keeping
 * status: rejected plus a dated one-line reasoning. Both collection
 * layers glob the tasks dir FLAT, so nothing under rejected/ is a model
 * input — these tests are the insurance on that invariant. The inverse
 * trap is pinned too: a flat docs/tasks/ file with status: rejected but
 * without the full task fields stays a LOUD parse failure. Rationale of
 * record: on tasks `rejected` is a retriable lifecycle state, on a
 * triaged suggestion it is terminal — one status word must not carry
 * both meanings in one directory.
 *
 * No parser source changed for T-016: everything here pins behavior the
 * parser already had (non-recursive readdir + /^T-.*\.md$/ on disk;
 * isTaskFilePath rejecting nested names in the pure layer).
 */

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = (name: string): string =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

/** True when the issue names a path under `prefix` (any issue shape). */
const issueTouches = (issue: ParseIssue, prefix: string): boolean => {
  if ('file' in issue && issue.file.startsWith(prefix)) return true;
  if ('files' in issue && issue.files.some((f) => f.startsWith(prefix))) return true;
  return false;
};

describe('live tree — docs/tasks/rejected/ is excluded from the model (T-016)', () => {
  const rejectedDir = join(repoRoot, 'docs', 'tasks', 'rejected');
  const rejectedPrefix = rejectedDir + sep;

  it('the live rejected/ directory is non-empty, so the exclusion pin is not vacuous', () => {
    const names = readdirSync(rejectedDir).filter((n) => /^T-.*\.md$/.test(n));
    expect(names.length).toBeGreaterThanOrEqual(1);
    // every file there uses the ratified encoding: status: rejected kept
    for (const name of names) {
      const content = readFileSync(join(rejectedDir, name), 'utf8');
      expect(content).toContain('status: rejected');
    }
  });

  it('parseProject yields no task sourced from under rejected/, and no issue about one', () => {
    const result = parseProject(repoRoot);
    expect(result.tasks.length).toBeGreaterThan(0); // the flat tree still parses
    expect(result.tasks.filter((t) => t.file.startsWith(rejectedPrefix))).toEqual([]);
    // excluded means invisible — not collected-then-flagged
    expect(result.issues.filter((i) => issueTouches(i, rejectedPrefix))).toEqual([]);
  });
});

describe('fixture — a subdirectory of the tasks dir is not collected (disk layer)', () => {
  // rejected-project has one flat task (T-501) plus an id-less
  // status: rejected file under docs/tasks/rejected/ that would raise
  // missing-field issues AND a phantom record if it were collected.
  it('parseProject sees only the flat task; the rejected/ file is neither parsed nor flagged', () => {
    const result = parseProject(fixture('rejected-project'));
    expect(result.issues).toEqual([]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-501']);
  });

  it('parseTaskDirectory itself skips the subdirectory', () => {
    const { tasks, issues } = parseTaskDirectory(
      join(fixture('rejected-project'), 'docs', 'tasks'),
    );
    expect(issues).toEqual([]);
    expect(tasks.map((t) => t.id)).toEqual(['T-501']);
  });

  it('the pure layer agrees on the same bytes: a rejected/ path is not a model input', () => {
    const rejectedContent = readFileSync(
      join(fixture('rejected-project'), 'docs', 'tasks', 'rejected', 'T-500-s1-rejected-idea.md'),
      'utf8',
    );
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', '# R\n\n## Backbone\n- F-01: One — thing\n'],
        [
          'docs/tasks/T-501-flat.md',
          '---\nid: T-501\ntitle: Flat task\nfeature: F-01\nmilestone: 1\npriority: 1\nsize: S\nstatus: planned\n---\n',
        ],
        ['docs/tasks/rejected/T-500-s1-rejected-idea.md', rejectedContent],
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-501']);
  });
});

describe('the trap stays loud — flat status: rejected without full task fields (T-016)', () => {
  const roadmap = '# R\n\n## Backbone\n- F-01: One — thing\n';
  const missingFields = (issues: ParseIssue[]): string[] =>
    issues.flatMap((i) => (i.kind === 'missing-field' ? [i.field] : [])).sort();

  it('an id-less minimal file raises missing-field issues for id + the full placement set', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', roadmap],
        [
          'docs/tasks/T-902-s1-rejected-in-place.md',
          '---\ntitle: Rejected in place\nstatus: rejected\nsuggested_by: verifier codex @T-901\n---\n\nTriage 2026-08-15: REJECTED — reasoning.\n',
        ],
      ]),
    );
    expect(missingFields(result.issues)).toEqual(['feature', 'id', 'milestone', 'priority', 'size']);
    // without an id the identity gate fails: no phantom card either
    expect(result.tasks).toEqual([]);
  });

  it('with an id present the card returns WITH its placement issues — flagged, not hidden', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', roadmap],
        [
          'docs/tasks/T-902-s1-rejected-in-place.md',
          '---\nid: T-902-s1\ntitle: Rejected in place\nstatus: rejected\nsuggested_by: verifier codex @T-901\n---\n',
        ],
      ]),
    );
    expect(missingFields(result.issues)).toEqual(['feature', 'milestone', 'priority', 'size']);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-902-s1']);
  });
});
