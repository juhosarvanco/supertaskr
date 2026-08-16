import type { FeatureRecord, ParseIssue, RoadmapParseResult } from './types.js';

/**
 * Parse docs/ROADMAP.md backbone lines into feature records.
 *
 * The backbone lives under the `## Backbone` heading (suffixes like
 * "(revised per ADR-008)" allowed) and each feature is one bullet:
 *
 *     - F-02: App shell + board — Tauri app, read-only story map
 *       rendered beautifully from files
 *
 * Wrapped continuation lines (indented, until the next bullet, blank
 * line, or heading) are joined into the feature's text. `F-NN:` starts
 * the record; the first ` — ` (em dash) splits name from description.
 * Order of the returned records is backbone order — the board renders
 * columns in exactly this order.
 *
 * HTML comments are NOT content (T-030, absorbing T-023-s1): every
 * `<!-- … -->` span is blanked before any line is matched, so a column-0
 * `- F-NN:` bullet inside a comment yields neither a FeatureRecord nor a
 * roadmap-error. That trap is why the scaffolded docs-templates had to
 * indent their example rows — a bare example row inside a comment parsed
 * as a real feature and would render as a phantom board column on a fresh
 * project. The templates stay comment-wrapped regardless; the parser no
 * longer depends on their indentation to stay honest.
 */
export function parseRoadmap(content: string, file: string): RoadmapParseResult {
  const features: FeatureRecord[] = [];
  const issues: ParseIssue[] = [];
  const lines = stripHtmlComments(content, file, issues).split(/\r?\n/);

  let inBackbone = false;
  let sawBackbone = false;
  let openFeature: { id: string; text: string; line: number } | undefined;
  const seen = new Map<string, number>(); // feature id -> first line

  const close = (): void => {
    if (!openFeature) return;
    const { id, text, line } = openFeature;
    openFeature = undefined;
    const split = /\s+—\s+/.exec(text);
    const name = split ? text.slice(0, split.index).trim() : text.trim();
    const description = split ? text.slice(split.index + split[0].length).trim() : '';
    const firstLine = seen.get(id);
    if (firstLine !== undefined) {
      issues.push({
        kind: 'duplicate-id',
        id,
        files: [file, file],
        message: `${file}: duplicate backbone feature '${id}' (lines ${firstLine} and ${line})`,
      });
    } else {
      seen.set(id, line);
    }
    features.push({ id, name, description, line, file });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';

    if (/^##\s/.test(line)) {
      close();
      inBackbone = /^##\s*Backbone\b/i.test(line);
      if (inBackbone) sawBackbone = true;
      continue;
    }
    if (!inBackbone) continue;

    const bullet = /^-\s+(F-\d+):\s*(.*)$/.exec(line);
    if (bullet && bullet[1] !== undefined && bullet[2] !== undefined) {
      close();
      openFeature = { id: bullet[1], text: bullet[2].trim(), line: i + 1 };
      continue;
    }
    if (/^-\s+F-/.test(line)) {
      close();
      issues.push({
        kind: 'roadmap-error',
        file,
        message: `${file}:${i + 1}: malformed backbone line (expected '- F-NN: Name — description'): ${line.trim()}`,
      });
      continue;
    }
    if (openFeature && /^\s+\S/.test(line) && !/^\s*-\s/.test(line)) {
      openFeature.text = `${openFeature.text} ${line.trim()}`.trim();
      continue;
    }
    // Blank line, other bullet, or prose: closes any open feature.
    close();
  }
  close();

  if (!sawBackbone) {
    issues.push({
      kind: 'roadmap-error',
      file,
      message: `${file}: no '## Backbone' section found — cannot extract feature records`,
    });
  }

  return { features, issues };
}

/**
 * Blank every `<!-- … -->` span, delimiters included, so the line scanner
 * above never sees commented-out markdown (T-030 / T-023-s1).
 *
 * Line structure is preserved exactly: only NON-newline characters inside
 * a span become spaces, so every surviving line keeps its 1-based number
 * (FeatureRecord.line and every issue's `:N:` stay truthful) and a
 * commented line reduces to whitespace — which the scanner already treats
 * as blank. Multi-line spans are handled by construction: the scan is over
 * the whole document, not per line.
 *
 * An UNTERMINATED `<!--` blanks to end of file, the comment-blind reading
 * (nothing after a broken opener can become a phantom feature) — but it
 * can swallow real backbone bullets, so it is reported as a roadmap-error
 * naming the opener's line rather than silently eating the rest of the
 * file. Loud, never hidden: the same contract every other rule here obeys.
 */
function stripHtmlComments(content: string, file: string, issues: ParseIssue[]): string {
  if (!content.includes('<!--')) return content;

  const blank = (span: string): string => span.replace(/[^\r\n]/g, ' ');
  let out = '';
  let cursor = 0;
  for (;;) {
    const open = content.indexOf('<!--', cursor);
    if (open === -1) return out + content.slice(cursor);
    out += content.slice(cursor, open);
    const close = content.indexOf('-->', open + 4);
    if (close === -1) {
      const line = content.slice(0, open).split(/\r?\n/).length;
      issues.push({
        kind: 'roadmap-error',
        file,
        message: `${file}:${line}: unterminated HTML comment ('<!--' with no '-->') — everything after it is ignored as comment content`,
      });
      return out + blank(content.slice(open));
    }
    out += blank(content.slice(open, close + 3));
    cursor = close + 3;
  }
}
