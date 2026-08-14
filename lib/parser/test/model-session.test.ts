import { describe, expect, it } from 'vitest';
import { parseModelSession } from '../src/index.js';

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
