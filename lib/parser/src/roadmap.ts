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
 */
export function parseRoadmap(content: string, file: string): RoadmapParseResult {
  const features: FeatureRecord[] = [];
  const issues: ParseIssue[] = [];
  const lines = content.split(/\r?\n/);

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
