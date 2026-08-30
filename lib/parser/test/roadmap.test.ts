import { describe, expect, it } from 'vitest';
import { parseProjectFromFiles, parseRoadmap } from '../src/index.js';

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

  it('is fence-blind to valid and malformed bullets in backtick and tilde blocks', () => {
    const content = [
      '## Backbone',
      '``` roadmap-example',
      '- F-99: Phantom — inside backticks',
      '- F-XX: malformed but inert',
      '````',
      '- F-01: Real — first',
      '~~~ info ` is legal on a tilde fence',
      '- F-98: Phantom — inside tildes',
      '- F-YY: malformed but inert',
      '   ~~~',
      '- F-02: Real — second',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(content, FILE);
    expect({ issues, ids: features.map((feature) => `${feature.id}@${feature.line}`) }).toEqual({
      issues: [],
      ids: ['F-01@6', 'F-02@11'],
    });
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

  it('treats abrupt empty comments as complete but a genuine unterminated opener as running to EOF', () => {
    const content = [
      '## Backbone',
      '<!-->',
      '- F-01: Real — after the first abrupt close',
      '<!--->',
      '- F-02: Real — after the second abrupt close',
      '<!-- genuinely open',
      '- F-99: Lost — swallowed',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(content, FILE);
    expect({ ids: features.map((feature) => feature.id), issues }).toEqual({
      ids: ['F-01', 'F-02'],
      issues: [
        expect.objectContaining({
          kind: 'roadmap-error',
          file: FILE,
          message: expect.stringContaining(`${FILE}:6: unterminated HTML comment`),
        }),
      ],
    });
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

  it('reports duplicate feature ids with both line numbers, in the alias message shape', () => {
    const dup = '## Backbone\n- F-01: One — first\n- F-01: One again — second\n';
    const { features, issues } = parseRoadmap(dup, FILE);
    expect(features).toHaveLength(2);
    // MOVED AT T-076 (2026-08-19, executor claude-opus-5 @fresh). Two
    // changes, both criteria of this card and neither incidental.
    // Criterion 3: `space: 'feature'` is now REQUIRED on duplicate-id.
    // Criterion 4: the two backbone issues must say the same kind of
    // thing in the same SHAPE, and the alias below already names each
    // declaration as `'<id>' (line N)` — `(lines 2 and 3)` was the odd
    // spelling out. Changed, never loosened, TWICE OVER: the matcher
    // TIGHTENS from objectContaining to a whole-object toEqual (matching
    // its alias sibling at :291 exactly), and the message assertion goes
    // from one substring to both declarations named individually.
    expect(issues).toEqual([
      {
        kind: 'duplicate-id',
        space: 'feature',
        id: 'F-01',
        files: [FILE, FILE],
        message: expect.stringContaining('duplicate backbone feature id'),
      },
    ]);
    expect(issues[0]?.message).toContain("'F-01' (line 2)");
    expect(issues[0]?.message).toContain("'F-01' (line 3)");
    expect(issues[0]?.message).toContain(FILE);
    // The consequence clause is the board's MEASURED behaviour: selectBoard
    // keys columns on the exact string and skips a repeat, so the second
    // bullet's name and description never reach a column.
    expect(issues[0]?.message).toContain('discards the second');
    // The old shape is gone, not merely unasserted.
    expect(issues[0]?.message).not.toContain('lines 2 and 3');
  });
});

/**
 * THE FIXTURE IS A REAL PLANNER'S OUTPUT, NOT AN IMITATION (T-177's third
 * criterion). These are lines 1–20 of `docs/ROADMAP.md` in @human's first
 * generated project (`~/Projects/first-walk`), copied byte for byte on
 * 2026-08-31 — em dashes, straight apostrophes, inline code spans and all.
 * The source path is machine-local, so the bytes live here rather than
 * being read at test time; what makes this a fixture rather than an
 * imitation is that a planner session wrote it, unprompted, as the
 * ordinary way to write a backbone.
 *
 * MEASURED BEFORE THE FIX (T-177's card, at `b60b06d`): three features
 * declared, ZERO parsed, ZERO issues reported. No feature, no error, no
 * reason — the board was simply shorter than the file, and every task card
 * in that project pointed at a backbone slot that did not exist.
 */
const FIRST_WALK_BACKBONE = [
  '# Roadmap',
  '',
  '## Backbone',
  '',
  "- **F-01: Open — one command puts the cursor in today's note.** Run `note`;",
  '  `~/notes/YYYY-MM-DD.md` exists (created from a three-line header template if',
  '  new) and is open in `$EDITOR`. This is the entire product as the writer',
  '  experiences it.',
  "- **F-02: Place — where notes live is the writer's choice.** An environment",
  '  variable overrides the hard-coded notes directory. Not milestone 1: there is',
  '  one writer with one folder, so configurability is speculation until a second',
  '  location exists.',
  '- **F-03: Reach — the command is on PATH without hand-editing a shell profile.**',
  '  Not milestone 1: an alias costs the writer one line and teaches the same',
  '  lesson.',
  '',
  'Ordered as the writer meets them: you must be able to open the note before it',
  'matters where it lives, and it must be worth opening before distribution is',
  'worth building.',
  '',
].join('\n');

describe('parseRoadmap — an emphasis-wrapped feature id is REPORTED, never dropped in silence (T-177)', () => {
  it("the real planner's bold backbone yields no feature and one named issue per line", () => {
    const { features, issues } = parseRoadmap(FIRST_WALK_BACKBONE, FILE);
    // STILL NOT FEATURES, deliberately: arm 2 (parsing the bold form as the
    // plain one) was declined — see this file's header and T-177's notes.
    // The accepted grammar is unchanged; what changed is that refusing it
    // is now AUDIBLE. Reporting the shape and accepting the shape answer
    // different questions, and only the first is this card's core.
    expect(features).toEqual([]);
    expect(issues).toHaveLength(3);
    expect(issues.map((issue) => issue.kind)).toEqual([
      'roadmap-error',
      'roadmap-error',
      'roadmap-error',
    ]);
    // One per declaration, located where a human can act on it.
    expect(issues[0]?.message).toContain(`${FILE}:5:`);
    expect(issues[1]?.message).toContain(`${FILE}:9:`);
    expect(issues[2]?.message).toContain(`${FILE}:13:`);
  });

  it('the message names the emphasis as the cause and the unwrapped shape as the fix', () => {
    // The silence was the defect; a `roadmap-error` that does not say WHY
    // would only move the silence one step. The reader gets the cause, the
    // remedy and the offending line.
    const first = parseRoadmap(FIRST_WALK_BACKBONE, FILE).issues[0]?.message ?? '';
    expect(first).toContain("markdown emphasis ('**')");
    expect(first).toContain("expected '- F-NN: Name — description'");
    expect(first).toContain('unwrap the id');
    expect(first).toContain('- **F-01: Open —');
  });

  it('the fix is the CLASS, not the one spelling: every emphasis run reports, and is named', () => {
    // `**` is what the planner wrote; the detector is written against the
    // class it belongs to, so the NEXT decoration lands in the reporter
    // instead of teaching this lesson again.
    const decorated = [
      '## Backbone',
      '- *F-01: Italic — one star*',
      '- __F-02: Underscored — two bars__',
      '- ~~F-03: Struck — through~~',
      '- ***F-04: Bold italic — three stars***',
      '- ** F-05: Spaced — the run need not touch the id**',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(decorated, FILE);
    expect(features).toEqual([]);
    expect(issues.map((issue) => issue.kind)).toEqual(Array<string>(5).fill('roadmap-error'));
    expect(
      issues.map((issue) => /markdown emphasis \('(.+?)'\)/.exec(issue.message)?.[1]),
    ).toEqual(['*', '__', '~~', '***', '**']);
  });

  it('a bold bullet that is NOT a feature id stays silent — the detector still requires F-', () => {
    // The discriminating half. A backbone section holds prose bullets too,
    // and a reporter that fired on every bold bullet would trade one
    // silence for a badge nobody can act on.
    const prose = [
      '## Backbone',
      '- F-01: Real — the only feature here',
      '- **Ordered as the writer meets them** — prose in a bullet, not a backbone line',
      '- **Parked:** nothing below this is a feature',
      '- *Footnote about F-01 that starts with emphasis*',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(prose, FILE);
    expect(issues).toEqual([]);
    expect(features.map((feature) => feature.id)).toEqual(['F-01']);
  });

  it("keeps T-030's property: a DECORATED example row inside a comment is no feature AND no issue", () => {
    // The widening reads the inert-blanked view, exactly as the plain
    // detector does, so a scaffolded template's commented example rows
    // cannot become phantom columns OR phantom parse errors. Asserted
    // rather than assumed: this is the property the card names as the one
    // the widening must not break.
    const content = [
      '## Backbone',
      '<!-- example rows, do not ship:',
      '- **F-98: Example — a bold template row**',
      '- F-99: Example — the plain template row',
      '-->',
      '<!-- - **F-97: Example — the one-line form, equally silent** -->',
      '- F-01: Real — the only feature here',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features.map((feature) => feature.id)).toEqual(['F-01']);
  });

  it('the plain malformed arm is unchanged and says nothing about emphasis', () => {
    const bad = '## Backbone\n- F-01: Fine — good\n- F-XX: broken id\n';
    const { issues } = parseRoadmap(bad, FILE);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain(`${FILE}:3:`);
    expect(issues[0]?.message).not.toContain('markdown emphasis');
  });

  it('a decorated line closes the feature above it and does not swallow the one below', () => {
    const mixed = [
      '## Backbone',
      '- F-01: Real — first',
      '  and its wrapped continuation',
      '- **F-02: Decorated — the reported one**',
      '  its own continuation, which belongs to nothing',
      '- F-03: Real — second',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(mixed, FILE);
    expect(features.map((feature) => `${feature.id}@${feature.line}`)).toEqual(['F-01@2', 'F-03@6']);
    expect(features[0]?.description).toBe('first and its wrapped continuation');
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain(`${FILE}:4:`);
  });

  // ASSIGNED BY T-177's BLIND VERIFIER, performed at the merge. The
  // reporter's backbone scoping is CORRECT and was UNPINNED: hoisting the
  // detector past `if (!inBackbone) continue;` left the suite green at
  // 343/343, and no existing gate could have caught it — an awk over every
  // tracked *.md finds ZERO decorated F- bullets outside a backbone in this
  // repository, so the live-tree smoke test is vacuous against this
  // mutation by construction. A reporter that fired in every section would
  // turn one silence into a page of badges, and would arrive silently under
  // any future refactor of the scan loop.
  it('the reporter is backbone-scoped: a decorated F- bullet under another heading is not an issue', () => {
    const content = [
      '## Backbone',
      '- F-01: Real — the only feature here',
      '',
      '## Parked',
      '- **F-02: Deferred — bold, and none of the backbone scan business**',
      '',
    ].join('\n');
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features.map((f) => f.id)).toEqual(['F-01']);
  });
});

describe('parseRoadmap — numerically aliased feature ids (T-053, promoting T-030-s3)', () => {
  it('F-1 beside F-01 is one slot spelled twice, and the message LOCATES both', () => {
    // Used to parse with ZERO issues, and the board then renders two
    // columns for what a human reads as one feature.
    const content = '# Roadmap\n\n## Backbone\n- F-1:  One — a\n- F-01: One padded — b\n';
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([
      {
        kind: 'aliased-id',
        space: 'feature',
        ids: ['F-01', 'F-1'],
        files: [FILE, FILE],
        message: expect.stringContaining('numerically equal backbone feature ids'),
      },
    ]);
    // Both declarations live in ONE file, so `files` is that path twice and
    // cannot locate anything: the LINES are what a human acts on.
    expect(issues[0]?.message).toContain("'F-01' (line 5)");
    expect(issues[0]?.message).toContain("'F-1' (line 4)");
    expect(issues[0]?.message).toContain(FILE);
    // Flagging, not hiding: both columns still parse, in backbone order.
    expect(features.map((f) => f.id)).toEqual(['F-1', 'F-01']);
    expect(features.map((f) => f.line)).toEqual([4, 5]);
  });

  it('ONE issue per slot, not one per pair — three spellings report once', () => {
    const content = '## Backbone\n- F-1: a — a\n- F-01: b — b\n- F-001: c — c\n';
    const { issues } = parseRoadmap(content, FILE);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      kind: 'aliased-id',
      space: 'feature',
      ids: ['F-001', 'F-01', 'F-1'],
    });
    expect(issues[0]?.message).toContain("'F-001' (line 4)");
  });

  it('the live backbone shape stays silent — distinct slots are not aliases', () => {
    const content =
      '## Backbone\n- F-01: a — a\n- F-02: b — b\n- F-10: c — c\n- F-100: d — d\n- F-11: e — e\n';
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features).toHaveLength(5);
  });

  it('an exact duplicate stays duplicate-id business, never an alias', () => {
    const content = '## Backbone\n- F-01: One — first\n- F-01: One again — second\n';
    const { issues } = parseRoadmap(content, FILE);
    expect(issues.map((i) => i.kind)).toEqual(['duplicate-id']);
  });

  it('slot equality is textual, so feature ids past 2^53 do not collide by floating point', () => {
    const big = '9007199254740993'; // 2^53 + 1 — Number() cannot tell these apart
    const other = '9007199254740992';
    expect(Number(big)).toBe(Number(other));

    const distinct = parseRoadmap(`## Backbone\n- F-${big}: a — a\n- F-${other}: b — b\n`, FILE);
    expect(distinct.issues).toEqual([]);

    const padded = parseRoadmap(`## Backbone\n- F-${big}: a — a\n- F-0${big}: b — b\n`, FILE);
    expect(padded.issues).toHaveLength(1);
    expect(padded.issues[0]).toMatchObject({ kind: 'aliased-id', ids: [`F-0${big}`, `F-${big}`] });
  });

  it('a commented-out spelling is not a declaration, so it cannot alias', () => {
    // The comment strip runs first (T-030): a phantom F-01 inside a
    // comment must not turn a lone F-1 into an aliased slot.
    const content = '## Backbone\n- F-1: One — a\n<!--\n- F-01: Example — b\n-->\n';
    const { features, issues } = parseRoadmap(content, FILE);
    expect(issues).toEqual([]);
    expect(features.map((f) => f.id)).toEqual(['F-1']);
  });

  it('a roadmap with no backbone reports only its structural error', () => {
    const { issues } = parseRoadmap('# Roadmap\n\n## Milestones\n- F-1: x — y\n', FILE);
    expect(issues.map((i) => i.kind)).toEqual(['roadmap-error']);
  });

  it('surfaces through both project assemblers, after the task layer', () => {
    const content = '## Backbone\n- F-1: One — a\n- F-01: One padded — b\n';
    const result = parseProjectFromFiles(new Map([['docs/ROADMAP.md', content]]));
    expect(result.issues).toEqual([
      {
        kind: 'aliased-id',
        space: 'feature',
        ids: ['F-01', 'F-1'],
        files: ['docs/ROADMAP.md', 'docs/ROADMAP.md'],
        message: expect.stringContaining('numerically equal backbone feature ids'),
      },
    ]);
    expect(result.features.map((f) => f.id)).toEqual(['F-1', 'F-01']);
  });
});
