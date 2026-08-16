import { describe, expect, it } from 'vitest';
import { parseModelSession, parseProjectFromFiles } from '../src/index.js';

describe('parseModelSession — TASK-FORMAT.md session syntax', () => {
  it('bare model means default session policy', () => {
    expect(parseModelSession('codex')).toEqual({
      raw: 'codex',
      model: 'codex',
      policy: 'default',
    });
  });

  it('model@fresh is an explicit fresh session', () => {
    expect(parseModelSession('codex@fresh')).toEqual({
      raw: 'codex@fresh',
      model: 'codex',
      session: 'fresh',
      policy: 'fresh',
    });
  });

  it('model@S3 resumes registered session S3', () => {
    expect(parseModelSession('codex@S3')).toEqual({
      raw: 'codex@S3',
      model: 'codex',
      session: 'S3',
      policy: 'resume',
    });
  });

  it('accepts the stamped form with a space before @', () => {
    expect(parseModelSession('codex/gpt-5.2 @S3')).toEqual({
      raw: 'codex/gpt-5.2 @S3',
      model: 'codex/gpt-5.2',
      session: 'S3',
      policy: 'resume',
    });
    expect(parseModelSession('claude-fable-5 @fresh')).toEqual({
      raw: 'claude-fable-5 @fresh',
      model: 'claude-fable-5',
      session: 'fresh',
      policy: 'fresh',
    });
  });

  it('splits at the last @ and trims outer whitespace', () => {
    expect(parseModelSession('  weird@model@S9  ')).toEqual({
      raw: 'weird@model@S9',
      model: 'weird@model',
      session: 'S9',
      policy: 'resume',
    });
  });
});

describe('parseModelSession — representative model (T-030, absorbing T-024-s6)', () => {
  const COMPOUND =
    'claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh ×2 (completion + rejection-fix sessions)';

  it('a compound cross-model stamp yields the LAST model, not the whole prose', () => {
    // Measured on the live tree before this rule: `model` was the entire
    // 59-character left half, which the board rendered as a 50-character
    // "badge". The stamp itself is legitimate prose and stays in `raw`.
    const parsed = parseModelSession(COMPOUND);
    expect(parsed).toEqual({
      raw: COMPOUND,
      model: 'claude-opus-5',
      session: 'fresh ×2 (completion + rejection-fix sessions)',
      policy: 'fresh',
    });
    expect(parsed.raw).toHaveLength(107);
    expect(parsed.model).toHaveLength(13); // was 59
  });

  it('leaves every single-model stamp exactly as it was', () => {
    expect(parseModelSession('codex/gpt-5.2 @S3').model).toBe('codex/gpt-5.2');
    expect(parseModelSession('claude-fable-5 @fresh').model).toBe('claude-fable-5');
    expect(parseModelSession('codex@fresh').model).toBe('codex');
    expect(parseModelSession('weird@model@S9').model).toBe('weird@model');
    // No `@` at all is not session syntax: the whole value is the model.
    expect(parseModelSession('claude-opus-5').model).toBe('claude-opus-5');
  });

  it('an empty left half stays the empty model the task validator rejects', () => {
    expect(parseModelSession('@fresh')).toMatchObject({ model: '', session: 'fresh' });
    expect(parseModelSession('   @S3')).toMatchObject({ model: '', session: 'S3' });
  });

  it('KNOWN WART, pinned not papered over (T-030-s1): a trailing @human note leaves `+`', () => {
    // docs/tasks/T-001-app-shell.md, verified_by. The last `@` belongs to
    // `@human`, so the left half ends in the separator itself. The rule is
    // mechanical on purpose — a smarter split is the delimited-grammar arm
    // T-030's triage ruled out — and `raw` still carries the whole truth.
    const parsed = parseModelSession('claude-fable-5 @fresh (2 passes) + @human (visual)');
    expect(parsed).toEqual({
      raw: 'claude-fable-5 @fresh (2 passes) + @human (visual)',
      model: '+',
      session: 'human (visual)',
      policy: 'resume', // a human pass is not a fresh model session
    });
  });
});

describe('parseModelSession — policy reads the session\'s FIRST word (T-030, T-024-s6)', () => {
  const policyOf = (value: string): string => parseModelSession(value).policy;

  it('an ANNOTATED fresh session reports fresh, not the opposite', () => {
    // Every one of these stood in the live tree reporting `resume`.
    expect(policyOf('claude-fable-5 @fresh ×2 (build + rejection-fix sessions)')).toBe('fresh');
    expect(policyOf('claude-fable-5 @fresh (2 passes)')).toBe('fresh');
    expect(policyOf('claude-fable-5 @fresh (first pass + fix pass, fresh executor)')).toBe('fresh');
    expect(policyOf('claude-fable-5 @fresh (WIP through 986431e) + claude-opus-5 @fresh (completion)')).toBe(
      'fresh',
    );
  });

  it('keeps the whole session string — the annotation is data, not noise', () => {
    expect(parseModelSession('claude-fable-5 @fresh (2 passes)').session).toBe('fresh (2 passes)');
  });

  it('the first word must EQUAL fresh — a prefix is not a fresh session', () => {
    expect(policyOf('codex@freshly-minted')).toBe('resume');
    expect(policyOf('codex@FRESH')).toBe('resume'); // case-sensitive, as before
    expect(policyOf('codex@S3 (resumed after a crash)')).toBe('resume');
    expect(policyOf('codex@fresh')).toBe('fresh');
  });
});

describe('a compound cross-model stamp, end to end (T-030 criterion 8)', () => {
  const ROADMAP = '# R\n\n## Backbone\n- F-01: One — thing\n';
  const TASK = [
    '---',
    'id: T-901',
    'title: Compound stamp',
    'feature: F-01',
    'milestone: 1',
    'priority: 1',
    'size: M',
    'status: done',
    'builder: claude-fable-5',
    'verifier: claude-opus-5',
    'built_by: claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh ×2 (completion + rejection-fix sessions)',
    'verified_by: "claude-opus-5 @fresh"',
    'review: independent',
    '---',
    '',
  ].join('\n');

  it('parses through the project assembler with zero issues, raw preserved, badge short', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-compound.md', TASK],
      ]),
    );
    expect(result.issues).toEqual([]);
    const task = result.tasks[0];
    expect(task?.builtBy).toEqual({
      raw: 'claude-fable-5 @fresh (WIP through ad2716f) + claude-opus-5 @fresh ×2 (completion + rejection-fix sessions)',
      model: 'claude-opus-5',
      session: 'fresh ×2 (completion + rejection-fix sessions)',
      policy: 'fresh',
    });
    // The detail panel still gets the whole sentence; the badge gets a name.
    expect(task?.builtBy?.raw).toContain('claude-fable-5');
    expect(task?.builtBy?.raw).toContain('WIP through ad2716f');
    expect((task?.builtBy?.model.length ?? 0) < 20).toBe(true);
    // The single-model stamps beside it are untouched.
    expect(task?.builder).toMatchObject({ model: 'claude-fable-5', policy: 'default' });
    expect(task?.verifiedBy).toMatchObject({ model: 'claude-opus-5', policy: 'fresh' });
  });
});
