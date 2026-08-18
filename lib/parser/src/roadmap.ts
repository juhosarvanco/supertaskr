import { aliasedIdSlots } from './id-slot.js';
import { blankInertSpans } from './inert-spans.js';
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
 * The shared inert-span pass blanks fenced blocks, HTML comments and
 * single-backtick inline code before any line is matched (T-055), so
 * examples and apparent markup inside code cannot become backbone syntax.
 */
export function parseRoadmap(content: string, file: string): RoadmapParseResult {
  const features: FeatureRecord[] = [];
  const issues: ParseIssue[] = [];
  const inert = blankInertSpans(content);
  for (const line of inert.unterminatedHtmlCommentLines) {
    issues.push({
      kind: 'roadmap-error',
      file,
      message: `${file}:${line}: unterminated HTML comment ('<!--' with no '-->') — everything after it is ignored as comment content`,
    });
  }
  const lines = inert.content.split(/\r?\n/);

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

  // Numerically equal feature ids spelled differently — `F-1` beside
  // `F-01` (T-053, promoting T-030-s3). A whole-file check, so it runs
  // after the scan; with no backbone there are no features and it is
  // vacuous. The board renders a COLUMN per spelling and a task's
  // `feature` lands in whichever column matches its exact string, so one
  // feature becomes two and half its cards go to the wrong one.
  //
  // Both declarations live in this one file, which is why `files` cannot
  // locate them (it is this path twice, index-aligned by contract) and
  // the message names each spelling WITH ITS LINE — the record already
  // tracks lines, and a diagnostic a human cannot act on is not a
  // diagnostic. `seen` holds each id's FIRST line, exactly as the
  // duplicate-id message above uses it.
  for (const ids of aliasedIdSlots(seen.keys())) {
    const lines = ids.map((id) => seen.get(id) ?? 0);
    const named = ids.map((id, i) => `'${id}' (line ${lines[i] ?? 0})`).join(', ');
    issues.push({
      kind: 'aliased-id',
      space: 'feature',
      ids,
      files: ids.map(() => file),
      message: `${file}: numerically equal backbone feature ids ${named} — zero-padding aliases one backbone slot; the board renders a column per spelling and a task's feature field lands in whichever column matches its exact string`,
    });
  }

  return { features, issues };
}
