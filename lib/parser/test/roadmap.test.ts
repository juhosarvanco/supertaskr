import { describe, expect, it } from 'vitest';
import { parseRoadmap } from '../src/index.js';

const FILE = 'docs/ROADMAP.md';

const ROADMAP = `# Roadmap

## Backbone (revised per ADR-008 — app-first)
- F-01: Method — the convention itself (method/), usable by hand
- F-02: App shell + board — Tauri app, read-only story map rendered
  beautifully from files
- F-03: In-app genesis

## Milestones
### Milestone 0 — planning (current)
- [x] Convention v0.1.3
- [ ] Domain + trademark sweep
- F-99: Not a backbone line, lives outside the Backbone section

## Parked
Prose only.
`;

describe('parseRoadmap — backbone lines', () => {
  it('parses features in backbone order with name/description split on the em dash', () => {
    const { features, issues } = parseRoadmap(ROADMAP, FILE);
    expect(issues).toEqual([]);
    expect(features.map((f) => f.id)).toEqual(['F-01', 'F-02', 'F-03']);
    expect(features[0]).toMatchObject({
      id: 'F-01',
      name: 'Method',
      description: 'the convention itself (method/), usable by hand',
      line: 4,
      file: FILE,
    });
  });

  it('joins wrapped continuation lines into one description', () => {
    const { features } = parseRoadmap(ROADMAP, FILE);
    expect(features[1]).toMatchObject({
      id: 'F-02',
      name: 'App shell + board',
      description: 'Tauri app, read-only story map rendered beautifully from files',
    });
  });

  it('a line without an em dash is all name, empty description', () => {
    const { features } = parseRoadmap(ROADMAP, FILE);
    expect(features[2]).toMatchObject({ id: 'F-03', name: 'In-app genesis', description: '' });
  });

  it('ignores F-lines outside the Backbone section (checkbox lines too)', () => {
    const { features } = parseRoadmap(ROADMAP, FILE);
    expect(features.some((f) => f.id === 'F-99')).toBe(false);
  });

  it('reports a roadmap-error when there is no Backbone section', () => {
    const { features, issues } = parseRoadmap('# Roadmap\n\n## Milestones\n- F-01: Hidden\n', FILE);
    expect(features).toEqual([]);
    expect(issues).toEqual([expect.objectContaining({ kind: 'roadmap-error', file: FILE })]);
  });

  it('reports malformed F-bullets with their line number', () => {
    const bad = '## Backbone\n- F-01: Fine — good\n- F-XX: broken id\n';
    const { features, issues } = parseRoadmap(bad, FILE);
    expect(features.map((f) => f.id)).toEqual(['F-01']);
    expect(issues).toEqual([
      expect.objectContaining({
        kind: 'roadmap-error',
        file: FILE,
        message: expect.stringContaining(':3:'),
      }),
    ]);
  });

  it('is comment-blind: a column-0 bullet inside an HTML comment is not a feature (T-030, T-023-s1)', () => {
    // The trap the scaffolded templates were bent around: this exact
    // content used to yield a phantom F-99 record and render as a real
    // board column on a fresh project.
    const content = [
      '## Backbone',
      '<!-- example row, do not ship:',
      '- F-99: Example — a template example row',
      '-->',
      '- F-01: Real — the only feature here',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features.map((f) => f.id)).toEqual(['F-01']);
  });

  it('is comment-blind to MALFORMED bullets too — no roadmap-error from inside a comment', () => {
    // Before: the commented column-0 `- F-` line tripped the malformed
    // arm and the board lit its parse-error badge over content nobody
    // shipped. (The one-line form `<!-- - F-XX: … -->` never tripped it —
    // the regex is anchored at the line start — so the pin uses the
    // multi-line shape a template actually has.)
    const content = [
      '## Backbone',
      '<!-- example, do not ship:',
      '- F-XX: broken id',
      '-->',
      '<!-- - F-YY: the one-line form, equally silent -->',
      '- F-01: Real — thing',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features.map((f) => f.id)).toEqual(['F-01']);
  });

  it('a live bullet adjacent to a comment is unchanged, and line numbers survive the strip', () => {
    const commented = [
      '# Roadmap', // 1
      '', // 2
      '## Backbone', // 3
      '<!-- a note', // 4
      '     spanning', // 5
      '     three lines -->', // 6
      '- F-01: Method — the convention itself', // 7
      '<!-- inline note --> ', // 8
      '- F-02: App shell — the board', // 9
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(commented, FILE);
    expect(issues).toEqual([]);
    expect(features).toEqual([
      { id: 'F-01', name: 'Method', description: 'the convention itself', line: 7, file: FILE },
      { id: 'F-02', name: 'App shell', description: 'the board', line: 9, file: FILE },
    ]);
  });

  it('a trailing comment on a bullet line leaves the bullet, not the comment text', () => {
    const content = '## Backbone\n- F-01: Method — the convention <!-- TODO: reword -->\n';
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features[0]).toMatchObject({ id: 'F-01', description: 'the convention' });
  });

  it('a commented-out heading neither opens nor CLOSES a section', () => {
    // The sharpest form of the old blindness: a column-0 `##` line inside
    // a comment ended the backbone, so every REAL bullet after the comment
    // silently vanished from the board (F-02 below). Nothing reported it —
    // the roadmap simply had fewer columns than the file did.
    const content = [
      '# Roadmap', // 1
      '', // 2
      '## Backbone', // 3
      '- F-01: Real — first', // 4
      '<!--', // 5
      '## Milestones', // 6
      '- F-99: Phantom — inside a comment', // 7
      '-->', // 8
      '- F-02: Real — second, and still in the backbone', // 9
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features.map((f) => `${f.id}@${f.line}`)).toEqual(['F-01@4', 'F-02@9']);
  });

  it('a roadmap whose only Backbone heading is commented out has no backbone', () => {
    const content = '# Roadmap\n\n<!-- ## Backbone\n- F-01: Hidden — commented out entirely\n-->\n';
    const { features, issues } = parseRoadmap(content, FILE);
    expect(features).toEqual([]);
    expect(issues).toEqual([
      expect.objectContaining({
        kind: 'roadmap-error',
        message: expect.stringContaining("no '## Backbone' section found"),
      }),
    ]);
  });

  it('an UNTERMINATED comment is reported with its line, never silently eaten', () => {
    // Comment-blind to end of file (nothing after a broken opener can
    // become a phantom feature) — but it can swallow real bullets, so it
    // says so instead of hiding them.
    const content =
      '## Backbone\n- F-01: Real — kept\n<!-- oops, never closed\n- F-02: Lost — swallowed\n';
    const { features, issues } = parseRoadmap(content, FILE);
    expect(features.map((f) => f.id)).toEqual(['F-01']);
    expect(issues).toEqual([
      expect.objectContaining({
        kind: 'roadmap-error',
        file: FILE,
        message: expect.stringContaining(`${FILE}:3: unterminated HTML comment`),
      }),
    ]);
  });

  it('the scaffolded template shape parses to zero features and zero issues', () => {
    // method/docs-templates/ROADMAP.md keeps its examples inside comments
    // (T-023). They stayed INDENTED to dodge the column-0 regexes; with
    // the strip in place the indentation is no longer load-bearing —
    // pinned here at column 0, the shape that used to phantom.
    const template = [
      '# Roadmap',
      '',
      '## Backbone',
      '<!-- Features ordered as the USER experiences the product.',
      '- F-01: <feature name> — <one line>',
      '- F-02: <feature name> — <one line>',
      '-->',
      '',
      '## Milestones',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(template, FILE);
    expect(features).toEqual([]);
    expect(issues).toEqual([]);
  });

  it('CRLF content keeps its line numbers through the strip', () => {
    const content = '## Backbone\r\n<!-- hidden\r\n- F-99: Phantom — no -->\r\n- F-01: Real — yes\r\n';
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features).toEqual([{ id: 'F-01', name: 'Real', description: 'yes', line: 4, file: FILE }]);
  });

  it('reports duplicate feature ids with both line numbers', () => {
    const dup = '## Backbone\n- F-01: One — first\n- F-01: One again — second\n';
    const { features, issues } = parseRoadmap(dup, FILE);
    expect(features).toHaveLength(2);
    expect(issues).toEqual([
      expect.objectContaining({
        kind: 'duplicate-id',
        id: 'F-01',
        files: [FILE, FILE],
        message: expect.stringContaining('lines 2 and 3'),
      }),
    ]);
  });
});
