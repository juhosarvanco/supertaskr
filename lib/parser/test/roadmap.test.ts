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
