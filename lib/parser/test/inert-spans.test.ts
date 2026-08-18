import { describe, expect, it } from 'vitest';
import { blankInertSpans } from '../src/inert-spans.js';

const blank = (value: string): string => value.replace(/[^\r\n]/g, ' ');

describe('blankInertSpans — the deliberately narrow structural pass', () => {
  it('code spans win before apparent comment openers, while an unmatched backtick does not', () => {
    const closed = blankInertSpans('before `<!--` after');
    const unmatched = blankInertSpans('before ` then <!-- never closed');
    expect({ closed, unmatched }).toEqual({
      closed: {
        content: `before ${blank('`<!--`')} after`,
        unterminatedHtmlCommentLines: [],
      },
      unmatched: {
        content: `before \` then ${blank('<!-- never closed')}`,
        unterminatedHtmlCommentLines: [1],
      },
    });
  });

  it('honours fence info strings and requires the same marker, enough markers, and no trailing text to close', () => {
    const validTilde = '~~~ info ` is allowed\nhidden\n   ~~~~\nafter';
    const invalidBacktickInfo = '``` info ` is not allowed\nafter';
    const shortAndTrailing = '````\nhidden\n```\nstill hidden\n```` trailing\nstill hidden';
    const wrongMarker = '~~~\nhidden\n```\nstill hidden';
    expect({
      validTilde: blankInertSpans(validTilde).content,
      invalidBacktickInfo: blankInertSpans(invalidBacktickInfo).content,
      shortAndTrailing: blankInertSpans(shortAndTrailing).content,
      wrongMarker: blankInertSpans(wrongMarker).content,
    }).toEqual({
      validTilde: `${blank('~~~ info ` is allowed')}\n${blank('hidden')}\n${blank('   ~~~~')}\nafter`,
      invalidBacktickInfo,
      shortAndTrailing: blank(shortAndTrailing),
      wrongMarker: blank(wrongMarker),
    });
  });

  it('preserves CRLF positions while blanking a closed multi-line comment', () => {
    const source = 'before\r\n<!-- hidden\r\nstill hidden -->\r\nafter';
    expect(blankInertSpans(source)).toEqual({
      content: `before\r\n${blank('<!-- hidden')}\r\n${blank('still hidden -->')}\r\nafter`,
      unterminatedHtmlCommentLines: [],
    });
  });

  it('keeps a top-level unclosed fence inert through EOF, before comment recognition', () => {
    const source = '``` text\n## Verdicts\n<!-- genuinely open';
    expect(blankInertSpans(source)).toEqual({
      content: blank(source),
      unterminatedHtmlCommentLines: [],
    });
  });
});
