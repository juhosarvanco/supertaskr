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
 *
 * THE ACCEPTED LINE GRAMMAR IS THE ONE ABOVE AND NOTHING ELSE — but a
 * refusal is REPORTED rather than silent (T-177). A bullet whose `F-NN:`
 * hides behind markdown emphasis — `- **F-01: Open — …**`, the shape a
 * real planner produced in a generated project — used to match neither
 * regex: not the bullet, and not the malformed-line reporter either,
 * because the emphasis run sits between the dash and the `F`. The reader
 * got no feature, no error and no reason, and the board was simply
 * shorter than the file. The reporter now looks past a leading run of
 * emphasis punctuation (`*`, `_`, `~`, in any combination) and names that
 * run as the cause, so the CLASS is covered rather than the one spelling
 * and the next decoration lands in the reporter too. Emphasis after the
 * id — `- F-01**: …` — was already covered, by the plain arm.
 *
 * REPORTED, NEVER TOLERATED: parsing the bold form AS the plain one
 * (T-177 arm 2) is a decision about the FORMAT every generated project
 * inherits, not about this parser, and it is declined here with its
 * reasons on T-177's card; pinning the grammar where the planner reads it
 * is arm 3, which rides a method version bump. So there is no "tolerated
 * set": a decorated id is an issue, and the fix a reader is told to make
 * is to unwrap it.
 *
 * AND THE REPORTER'S REACH STOPS WHERE THE INERT PASS STARTS. It matches
 * the blanked view, exactly as the plain arm does, so a decorated example
 * row inside an HTML comment or a code fence still yields NO feature and
 * NO issue — T-030's property, kept deliberately and pinned by a test.
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
      // Both declarations live in this ONE file, so `files` is that path
      // twice (index-aligned by contract) and locates nothing: the LINES
      // are what a human acts on. Named in the SAME shape the feature
      // `aliased-id` below uses — `'<id>' (line N)` per declaration —
      // because the two issues say the same kind of thing about the same
      // backbone and used to say it in two different shapes (T-076). The
      // consequence clause is the board's measured behaviour, not a
      // guess: selectBoard keys columns on the exact string and skips a
      // repeat, so the second bullet's name and description are dropped.
      issues.push({
        kind: 'duplicate-id',
        space: 'feature',
        id,
        files: [file, file],
        message: `${file}: duplicate backbone feature id '${id}' (line ${firstLine}), '${id}' (line ${line}) — one backbone slot declared twice; the board keeps the first declaration's column and discards the second's name and description`,
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
    // The emphasis run, when there is one, is CAPTURED rather than merely
    // detected: the message names the exact characters that hid the line,
    // which is the difference between a badge and a diagnostic a writer
    // can act on in one edit.
    const emphasis = /^-\s+([*_~]+)\s*(?=F-)/.exec(line)?.[1];
    if (emphasis !== undefined || /^-\s+F-/.test(line)) {
      close();
      const cause =
        emphasis === undefined
          ? ''
          : ` — markdown emphasis ('${emphasis}') sits between the bullet and the feature id, which the backbone reader does not accept; unwrap the id and put the emphasis inside the description`;
      issues.push({
        kind: 'roadmap-error',
        file,
        message: `${file}:${i + 1}: malformed backbone line (expected '- F-NN: Name — description')${cause}: ${line.trim()}`,
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
