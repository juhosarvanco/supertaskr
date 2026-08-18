/**
 * Build the parser's structural view of Markdown by blanking the three
 * inert shapes it deliberately understands: single-backtick code spans,
 * backtick/tilde fenced code blocks, and HTML comments.
 *
 * This is intentionally NOT a Markdown parser. Indented code blocks, HTML
 * blocks other than comments, link-reference definitions, Markdown list or
 * container de-indentation, nested-container fence boundaries, and every
 * other Markdown construct remain out of scope. Consumers use the blanked
 * view only to recognize their own line syntax; the result preserves string
 * positions and line endings by replacing non-newline span characters with
 * spaces.
 *
 * Recognition order is load-bearing: a fence or a complete inline-code span
 * wins before an apparent `<!--` inside it can open a comment. The deliberately
 * narrow single-backtick recognizer is physical-line-local; an unmatched
 * backtick on that line is ordinary text. A top-level unclosed fence is inert
 * through EOF rather than growing a partial Markdown container parser here.
 */
export interface InertSpanResult {
  content: string;
  unterminatedHtmlCommentLines: number[];
}

export function blankInertSpans(content: string): InertSpanResult {
  const unterminatedHtmlCommentLines: number[] = [];
  let out = '';
  let plainStart = 0;
  let cursor = 0;

  const blankThrough = (end: number): void => {
    out += content.slice(plainStart, cursor);
    out += content.slice(cursor, end).replace(/[^\r\n]/g, ' ');
    cursor = end;
    plainStart = end;
  };

  while (cursor < content.length) {
    if (isLineStart(content, cursor)) {
      const fenceEnd = fencedBlockEnd(content, cursor);
      if (fenceEnd !== undefined) {
        blankThrough(fenceEnd);
        continue;
      }
    }

    if (isSingleBacktick(content, cursor)) {
      const close = findClosingSingleBacktick(content, cursor + 1);
      if (close !== -1) {
        blankThrough(close + 1);
        continue;
      }
    }

    if (content.startsWith('<!--', cursor)) {
      // CommonMark 0.30 §6.6 treats these abrupt empty forms as complete
      // comments even though their closing bytes overlap the opener.
      if (content.startsWith('<!--->', cursor)) {
        blankThrough(cursor + 6);
        continue;
      }
      if (content.startsWith('<!-->', cursor)) {
        blankThrough(cursor + 5);
        continue;
      }

      const close = content.indexOf('-->', cursor + 4);
      if (close === -1) {
        unterminatedHtmlCommentLines.push(lineNumberAt(content, cursor));
        blankThrough(content.length);
        continue;
      }
      blankThrough(close + 3);
      continue;
    }

    cursor += 1;
  }

  return {
    content: out + content.slice(plainStart),
    unterminatedHtmlCommentLines,
  };
}

function isLineStart(content: string, index: number): boolean {
  if (index === 0) return true;
  const previous = content[index - 1];
  if (previous === '\n') return true;
  return previous === '\r' && content[index] !== '\n';
}

function isSingleBacktick(content: string, index: number): boolean {
  return (
    content[index] === '`' && content[index - 1] !== '`' && content[index + 1] !== '`'
  );
}

function findClosingSingleBacktick(content: string, start: number): number {
  const lineEnd = lineEndAt(content, start);
  let cursor = content.indexOf('`', start);
  while (cursor !== -1 && cursor < lineEnd) {
    if (isSingleBacktick(content, cursor)) return cursor;
    cursor = content.indexOf('`', cursor + 1);
  }
  return -1;
}

function fencedBlockEnd(content: string, lineStart: number): number | undefined {
  const openingLineEnd = lineEndAt(content, lineStart);
  const openingLine = content.slice(lineStart, openingLineEnd);
  const opening = /^( {0,3})(`{3,}|~{3,})([^\r\n]*)$/.exec(openingLine);
  if (!opening || opening[2] === undefined || opening[3] === undefined) return undefined;

  const run = opening[2];
  const marker = run[0];
  if (marker === undefined) return undefined;
  // A backtick fence's info string may not contain a backtick. Tilde
  // fences have no corresponding restriction.
  if (marker === '`' && opening[3].includes('`')) return undefined;

  let nextLine = nextLineStart(content, openingLineEnd);
  while (nextLine !== undefined) {
    const candidateEnd = lineEndAt(content, nextLine);
    if (isClosingFence(content.slice(nextLine, candidateEnd), marker, run.length)) {
      return candidateEnd;
    }
    nextLine = nextLineStart(content, candidateEnd);
  }
  return content.length;
}

function isClosingFence(line: string, marker: string, minimumLength: number): boolean {
  let cursor = 0;
  while (cursor < 3 && line[cursor] === ' ') cursor += 1;

  const runStart = cursor;
  while (line[cursor] === marker) cursor += 1;
  if (cursor - runStart < minimumLength) return false;

  while (line[cursor] === ' ' || line[cursor] === '\t') cursor += 1;
  return cursor === line.length;
}

function lineEndAt(content: string, start: number): number {
  let cursor = start;
  while (cursor < content.length && content[cursor] !== '\r' && content[cursor] !== '\n') {
    cursor += 1;
  }
  return cursor;
}

function nextLineStart(content: string, lineEnd: number): number | undefined {
  if (lineEnd >= content.length) return undefined;
  if (content[lineEnd] === '\r' && content[lineEnd + 1] === '\n') return lineEnd + 2;
  return lineEnd + 1;
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split(/\r\n|\r|\n/).length;
}
