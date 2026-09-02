import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type Fence,
  UNFENCEABLE_PATHS,
  compareFences,
  expandFence,
  normalizeFenceToken,
  slugPathIndex,
} from '../src/fence.js';
import { parseProject } from '../src/index.js';
import type { ComponentRecord, TaskRecord } from '../src/types.js';

/**
 * THE FENCE (T-134). A fence names PATHS; a slug is shorthand for a path
 * set; disjointness is computed over the EXPANDED sets.
 *
 * The live board is the fixture wherever it can be (`T-111-s3`: driven
 * from the live board's own tokens rather than a synthetic pair). Where
 * it cannot — the case that motivated the card is a card naming a code
 * path, and zero cards have ever named one — the fixture is built from
 * the live registry's own `paths:` so it is still this repository's data.
 */
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const project = parseProject(repoRoot);
const components = project.components ?? [];
const board = new Map<string, TaskRecord>();
for (const task of project.tasks) if (task.id !== undefined) board.set(task.id, task);

/** A card off the live board, by id — never by filename glob. */
function card(id: string): TaskRecord {
  const found = board.get(id);
  if (found === undefined) throw new Error(`no live card declares id ${id}`);
  return found;
}

function fenceOf(id: string) {
  return expandFence(card(id), components);
}

function componentById(id: string): ComponentRecord {
  const found = components.find((c) => c.id === id);
  if (found === undefined) throw new Error(`no component declares id ${id}`);
  return found;
}

/* ────────────────────────────────────────────────────────────────────
 * THE TWO MODELS OF "BEFORE", kept HERE and never in src/: they are the
 * control this card's claims are measured against, not behaviour anybody
 * should be able to import.
 * ──────────────────────────────────────────────────────────────────── */

/**
 * MODEL ONE — TOKEN STRING EQUALITY, the comparison this project
 * performs by hand at every dispatch and the one `T-111-s1` names:
 * "STRING-EQUALITY fence -> intersection EMPTY -> reported DISJOINT".
 */
function tokenEquality(a: TaskRecord, b: TaskRecord): 'overlapping' | 'disjoint' {
  const left = new Set(a.touches.map((t) => t.trim()));
  return b.touches.some((t) => left.has(t.trim())) ? 'overlapping' : 'disjoint';
}

/** Components whose declared `paths:` share a domain with one token. */
function componentsTouched(token: string, comps: readonly ComponentRecord[]): Set<string> {
  const out = new Set<string>();
  const t = normalizeFenceToken(token);
  for (const comp of comps) {
    if (comp.touchSlugs.includes(token.trim())) {
      out.add(comp.id);
      continue;
    }
    for (const raw of comp.paths) {
      const p = normalizeFenceToken(raw);
      if (t === p || t.startsWith(`${p}/`) || p.startsWith(`${t}/`)) out.add(comp.id);
    }
  }
  return out;
}

/**
 * MODEL TWO — SLUG GRANULARITY, the fence's only expressible unit before
 * this card: a card that knows its three files must claim its whole
 * component, so two cards inside one component collide however disjoint
 * their files are. This is what the card's measurement means by "the
 * fence stops being collision-avoidance and becomes a lock on a name".
 */
function slugGranularity(
  a: TaskRecord,
  b: TaskRecord,
  comps: readonly ComponentRecord[],
): 'overlapping' | 'disjoint' {
  const left = new Set<string>();
  for (const token of a.touches) for (const id of componentsTouched(token, comps)) left.add(id);
  for (const token of b.touches) {
    for (const id of componentsTouched(token, comps)) if (left.has(id)) return 'overlapping';
  }
  return tokenEquality(a, b);
}

/** A card-shaped record with no file behind it, for fixture fences. */
function synthetic(id: string, touches: string[], file?: string): TaskRecord {
  return {
    id,
    title: id,
    status: 'planned',
    blockedBy: [],
    touches,
    extra: Object.create(null) as Record<string, unknown>,
    sections: {},
    file: file ?? `docs/tasks/${id}-fixture.md`,
  };
}

/* ──────────────────────────────────────────────────────────────────── */

describe('normalizeFenceToken — one spelling, and a declared ceiling', () => {
  it('reconciles the trailing-slash and glob spellings of one directory', () => {
    // `T-111-s3`'s two REACHED collisions, both live on this board.
    expect(normalizeFenceToken('tools/e2e/')).toBe(normalizeFenceToken('tools/e2e'));
    expect(normalizeFenceToken('method/')).toBe(normalizeFenceToken('method'));
    // and the registry's own glob spelling of the same directory
    expect(normalizeFenceToken('app/src/styles/**')).toBe('app/src/styles');
    expect(normalizeFenceToken('app/src/styles/')).toBe('app/src/styles');
    expect(normalizeFenceToken('./app/src/styles')).toBe('app/src/styles');
    expect(normalizeFenceToken('app\\src\\styles')).toBe('app/src/styles');
    expect(normalizeFenceToken('app//src///styles//')).toBe('app/src/styles');
    expect(normalizeFenceToken('  lib/parser/**  ')).toBe('lib/parser');
  });

  it('understands ONE glob shape and refuses to guess at the rest', () => {
    // Trailing star run: understood.
    expect(normalizeFenceToken('app/src/**')).toBe('app/src');
    expect(normalizeFenceToken('app/src/*')).toBe('app/src');
    // Interior glob: survives normalisation, so expandFence can refuse it
    // rather than compare `app/src/**/*.ts` as a literal prefix.
    expect(normalizeFenceToken('app/src/**/*.ts')).toBe('app/src/**/*.ts');
  });
});

describe('slugPathIndex — the map is READ from touch_slugs:, never built', () => {
  it('is the join of touch_slugs: and paths:, with no table of its own', () => {
    const index = slugPathIndex(components);
    // Every key comes from a component file's own field, and every value
    // from that same file's own paths — derived, so the assertion cannot
    // pass against a second copy that has drifted.
    for (const [slug, expansion] of index) {
      const claiming = components.filter((c) => c.touchSlugs.includes(slug));
      expect(expansion.components).toEqual(claiming.map((c) => c.id));
      const declared = new Set(claiming.flatMap((c) => c.paths.map(normalizeFenceToken)));
      expect(new Set(expansion.paths)).toEqual(declared);
    }
    const declaredSlugs = new Set(components.flatMap((c) => c.touchSlugs));
    expect(new Set(index.keys())).toEqual(declaredSlugs);
  });

  it('no component carries two slugs — the T-163 ruling stays ruled, and the shared-path mechanism holds synthetically', () => {
    // `T-111-s1` pinned C-11 as the registry's only doubly-claimed
    // component. @human's ruling (T-163, 2026-08-30) took that field to
    // `[]`, so the live fact INVERTED: the negative is now the property
    // somebody could silently undo, and this body is how the ruling
    // stays ruled. Derived from the registry rather than quoted.
    const doubleClaimed = components.filter((c) => c.touchSlugs.length > 1);
    expect(doubleClaimed).toEqual([]);
    expect(componentById('C-11').touchSlugs).toEqual([]);

    // THE MECHANISM MOVED, IT DID NOT LEAVE: one component claimed by
    // two slugs still shares its paths into both expansions — pinned on
    // a synthetic registry carrying the shape the live one gave up.
    const c70 = { ...componentById('C-11'), id: 'C-70', touchSlugs: ['alpha', 'beta'] };
    const index = slugPathIndex([...components, c70]);
    const shared = c70.paths.map(normalizeFenceToken);
    expect(shared.length).toBeGreaterThan(0);
    for (const path of shared) {
      expect(index.get('alpha')?.paths).toContain(path);
      expect(index.get('beta')?.paths).toContain(path);
    }
  });
});

describe('expandFence — the three kinds of token, typed', () => {
  it('accepts paths and slugs in the same list', () => {
    // T-134's own fence, live on the board.
    const fence = fenceOf('T-134');
    expect(fence.tokens.map((t) => t.kind)).toEqual(['slug', 'path']);
    expect(fence.paths).toEqual(['lib/parser', 'method/lane-protocol.md']);
  });

  it('refuses an unresolvable token instead of calling it disjoint', () => {
    // `T-054` is the live card carrying three of `T-111-s3`'s four
    // problems at once, and it is `done`, so it is a stable fixture.
    const t054 = card('T-054');
    expect(t054.status).toBe('done');
    const fence = expandFence(t054, components);
    expect(fence.unusable).toEqual(['docs', 'method', 'ci']);
    expect(fence.issues).toHaveLength(3);
    for (const issue of fence.issues) {
      expect(issue.kind).toBe('invalid-field');
      expect(issue).toMatchObject({ field: 'touches' });
    }
    // The consequence, stated as a verdict rather than left implicit:
    // nothing may be compared against this fence and called disjoint.
    const other = expandFence(synthetic('T-900', ['lib/parser/src/fence.ts']), components);
    expect(compareFences(fence, other).verdict).toBe('unusable');
  });

  it('resolves the bare words a repository oracle can settle, and only those', () => {
    // With the repository's own top-level entries supplied, `method` is a
    // path and `ci` still names nothing — which is `T-111-s3`'s ruling
    // ("`ci` wants a ruling, not code") reproduced mechanically rather
    // than asserted.
    //
    // `docs` IS THE THIRD ANSWER AND IT IS NOT THE ORACLE'S (T-219). The
    // oracle would settle it — `docs` is a real directory — and the
    // expansion never asks, because the domain contains `docs/tasks` and
    // is refused two branches earlier. So this body's subject is
    // `method`: the bare word an oracle turns into a path, beside the
    // bare word nothing can.
    const knownPaths = readdirSync(repoRoot);
    const fence = expandFence(card('T-054'), components, { knownPaths });
    expect(fence.unusable).toEqual(['docs', 'ci']);
    const kinds = new Map(fence.tokens.map((t) => [t.raw, t.kind]));
    expect(kinds.get('docs')).toBe('rejected');
    expect(kinds.get('method')).toBe('path');
    expect(kinds.get('ci')).toBe('unresolved');
    // And the bare `method` now means what the seven cards spelling it
    // `method/` mean — the collision a trailing-slash rule alone reaches.
    expect(fence.tokens.find((t) => t.raw === 'method')?.paths).toEqual(['method']);
  });

  it('refuses an interior glob rather than comparing it as a prefix', () => {
    const fence = expandFence(synthetic('T-901', ['app/src/**/*.ts']), components);
    expect(fence.tokens[0]?.kind).toBe('unresolved');
    expect(fence.unusable).toEqual(['app/src/**/*.ts']);
    expect(fence.issues[0]?.message).toContain('glob');
  });
});

describe('a bare docs/tasks/ fence is rejected BY THE PARSER', () => {
  it('is refused in every spelling, and reserves nothing', () => {
    expect(UNFENCEABLE_PATHS).toContain('docs/tasks');
    for (const spelling of ['docs/tasks/', 'docs/tasks', './docs/tasks/**', 'docs//tasks//']) {
      const fence = expandFence(synthetic('T-902', [spelling]), components);
      expect(fence.tokens[0]?.kind, spelling).toBe('rejected');
      expect(fence.paths, spelling).toEqual([]);
      expect(fence.unusable, spelling).toEqual([spelling]);
      expect(fence.issues[0]?.message, spelling).toContain('every dispatch');
    }
  });

  it('does not refuse the NAMED card paths that replaced it', () => {
    // T-108's fence was narrowed by hand from `docs/tasks/` to three
    // named files; this rule must not undo that narrowing.
    const fence = fenceOf('T-108');
    expect(fence.tokens.every((t) => t.kind === 'path')).toBe(true);
    expect(fence.unusable).toEqual([]);
    expect(fence.paths).toHaveLength(3);
  });

  it('does not refuse a sibling directory fence', () => {
    // Six live cards fence `docs/architecture/components/`. What
    // disqualifies docs/tasks is that the PROTOCOL writes there on every
    // card, not that it is a directory.
    const fence = expandFence(synthetic('T-903', ['docs/architecture/components/']), components);
    expect(fence.tokens[0]?.kind).toBe('path');
    expect(fence.paths).toEqual(['docs/architecture/components']);
  });
});

describe("a card's own file is never in its own fence", () => {
  const own = 'docs/tasks/T-904-own-file.md';

  it('carves the own file out of a directory token it sits inside', () => {
    const fence = expandFence(synthetic('T-904', ['docs/architecture/components/'], own), components);
    expect(fence.excluded).toEqual([]);
    // THE CONTAINING CASE CANNOT BE SPELLED OVER A CARD'S OWN DIRECTORY
    // ANY MORE, AND THAT IS T-219 RATHER THAN A WEAKENING: every domain
    // containing `docs/tasks/T-904-own-file.md` also contains
    // `docs/tasks`, which the expansion now refuses outright. So the
    // carve-out is exercised over a file the protocol does NOT write on
    // every card — the `ownFile` option's own reason for existing — and
    // the property under test is unchanged.
    //
    // THE DIRECTORY IS `docs/rooms` AND NOT `docs/architecture`, so that
    // this body's kill set stays disjoint from the sibling-directory
    // control's in the T-219 block below: that control is armed by
    // `UNFENCEABLE_PATHS` and dies to a DATA mutant adding its
    // directory, and a fixture sharing that directory would die to the
    // same mutant and prove nothing of its own.
    const roomFile = 'docs/rooms/a-room-fixture.md';
    const wide = expandFence(synthetic('T-904', ['docs/rooms/'], roomFile), components);
    expect(wide.excluded).toEqual([roomFile]);
    expect(wide.paths).toEqual(['docs/rooms']);
  });

  it('drops a token that IS the own file, and records the carve-out', () => {
    const fence = expandFence(synthetic('T-904', [own], own), components);
    expect(fence.tokens[0]?.kind).toBe('path');
    expect(fence.paths).toEqual([]);
    expect(fence.excluded).toEqual([own]);
  });

  it('IS WHY THE DIRECTORY REFUSAL CANNOT BE LEFT TO THE COMPARISON', () => {
    // The two rules meet here, and the meeting is the argument for making
    // the refusal unconditional at parse time.
    //
    // A lane holding a directory over card files DOES reserve every other
    // card's file — and NO fence comparison can see that as a collision,
    // because the other card's own file is carved out of the other card's
    // own fence by the rule above. The collision is between a FENCE and a
    // PROTOCOL WRITE, and a fence-versus-fence check has no term for one.
    //
    // THE HOLDER IS BUILT BY HAND HERE, AND THAT IS THE POINT (T-219).
    // `expandFence` no longer produces this fence at all — a token whose
    // domain contains `docs/tasks` is refused before it can reserve
    // anything — so the argument is modelled the way MODEL ONE and MODEL
    // TWO at the top of this file are modelled: the BEFORE, kept in the
    // test and never in `src/`. Without it the reason the refusal has to
    // live at parse time would be unstated once the refusal exists.
    const neighbourFile = 'docs/tasks/T-905-neighbour.md';
    const holder: Fence = {
      id: 'T-904',
      file: own,
      tokens: [{ raw: 'docs/', normalized: 'docs', kind: 'path', components: [], paths: ['docs'] }],
      paths: ['docs'],
      excluded: [own],
      unusable: [],
      issues: [],
    };
    const neighbour = expandFence(synthetic('T-905', ['lib-parser'], neighbourFile), components);

    // The holder reserves it…
    expect(holder.paths).toEqual(['docs']);
    expect(neighbourFile.startsWith('docs/')).toBe(true);
    // …the neighbour does not claim it, because nobody claims their own…
    expect(neighbour.paths).toEqual(['lib/parser']);
    // …so the comparison is silent, and correctly so.
    expect(compareFences(holder, neighbour).verdict).toBe('disjoint');
    // Which is why `docs/tasks` is refused by the parser rather than
    // discovered by a comparison that structurally cannot discover it —
    // and why the bare `docs` the model above hand-builds is refused
    // now too, in the same place and for the same reason.
    const refused = expandFence(synthetic('T-904', ['docs/tasks/'], own), components);
    expect(refused.tokens[0]?.kind).toBe('rejected');
    expect(compareFences(refused, neighbour).verdict).toBe('unusable');
    const swallowing = expandFence(synthetic('T-904', ['docs/'], own), components);
    expect(swallowing.tokens[0]?.kind).toBe('rejected');
    expect(swallowing.paths).toEqual([]);
    expect(compareFences(swallowing, neighbour).verdict).toBe('unusable');
  });

  it('does not suppress a collision on somebody ELSE’s card file', () => {
    const holder = expandFence(synthetic('T-904', ['docs/tasks/T-905-neighbour.md'], own), components);
    const neighbour = expandFence(
      synthetic('T-906', ['docs/tasks/T-905-neighbour.md'], 'docs/tasks/T-906.md'),
      components,
    );
    expect(compareFences(holder, neighbour).verdict).toBe('overlapping');
  });
});

describe('THE TWO PINS THE CARD ASKS FOR, each measured against BEFORE', () => {
  /**
   * PIN ONE — SLUGS COLLIDE, PATHS DO NOT, REQUIRED DISJOINT.
   *
   * The motivating case: two cards inside one component whose file sets
   * never meet. It has no live instance and cannot have one — zero of
   * this board's `touches:` entries has ever named a code path — so the
   * two paths are lifted from C-05's own `paths:` block.
   *
   * MEASURED, NOT ASSERTED: this pin AGREES with token string equality
   * (two different path strings share no token) and DISAGREES with slug
   * granularity, which is the unit the fence actually had. It is
   * therefore a CONTROL against the comparison a dispatcher performs by
   * hand, and genuinely new against the vocabulary the card is replacing.
   */
  it('PIN ONE: two cards inside one component, disjoint by path — a CONTROL under token equality', () => {
    const c05 = componentById('C-05');
    expect(c05.paths).toContain('app/src/main.tsx');
    expect(c05.paths).toContain('app/src/App.tsx');

    const a = synthetic('T-907', ['app/src/main.tsx']);
    const b = synthetic('T-908', ['app/src/App.tsx']);
    expect(compareFences(expandFence(a, components), expandFence(b, components)).verdict).toBe(
      'disjoint',
    );

    // BEFORE, model one: agrees. This half is a control.
    expect(tokenEquality(a, b)).toBe('disjoint');
    // BEFORE, model two: the same two cards, expressible only as their
    // component, collide. This half is genuinely new.
    expect(slugGranularity(a, b, components)).toBe('overlapping');
    const asSlugs = tokenEquality(synthetic('T-907', ['app-shell']), synthetic('T-908', ['app-shell']));
    expect(asSlugs).toBe('overlapping');
  });

  /**
   * PIN TWO — PATHS COLLIDE, REQUIRED OVERLAPPING.
   *
   * Two live instances, both of which token equality gets WRONG, so this
   * pin is GENUINELY NEW rather than a control — the opposite of the
   * card's own guess that "the second one probably passes today".
   */
  it('PIN TWO (a): the C-11 pair the ruling split comes back disjoint, and the shared-component catch holds synthetically', () => {
    // BEFORE T-163, T-112 [app-dispatch, app-board] against T-114
    // [app-shell] met at C-11's two directories, and this pin proved
    // compareFences catches what token equality misses. @human's ruling
    // (2026-08-30) took C-11 to no slugs, so the live pair is now
    // DISJOINT — asserted as the ruling PINNED, not merely tolerated.
    const t112 = card('T-112');
    const t114 = card('T-114');
    expect(tokenEquality(t112, t114)).toBe('disjoint');
    expect(compareFences(fenceOf('T-112'), fenceOf('T-114')).verdict).toBe('disjoint');

    // THE MECHANISM MOVED, IT DID NOT LEAVE: two cards with no shared
    // token, meeting through one doubly-claimed component — token
    // equality wrong, the comparator right — on a synthetic registry
    // still carrying the shape the live one gave up.
    const c70 = { ...componentById('C-11'), id: 'C-70', touchSlugs: ['alpha', 'beta'] };
    const registry = [...components, c70];
    const left = expandFence(synthetic('T-905', ['alpha']), registry);
    const right = expandFence(synthetic('T-906', ['beta']), registry);
    expect(tokenEquality(synthetic('T-905', ['alpha']), synthetic('T-906', ['beta']))).toBe(
      'disjoint',
    ); // BEFORE — and wrong, which is the whole point
    const seen = compareFences(left, right);
    expect(seen.verdict).toBe('overlapping');
    expect(new Set(seen.witnesses.map((w) => `${w.left}|${w.right}`))).toEqual(
      new Set(['alpha|beta']),
    );
    expect(seen.witnesses.map((w) => w.path)).toEqual(
      [...componentById('C-11').paths.map(normalizeFenceToken)].sort(),
    );
  });

  it('PIN TWO (b): a directory fence contains a file fence — containment IS overlap', () => {
    // T-128 [method/, docs/CONVENTIONS.md] against T-134
    // [lib-parser, method/lane-protocol.md]. Different strings; one
    // reserves the other. This is the half of the vocabulary a
    // trailing-slash rule alone never reaches (`T-111-s3`).
    const t128 = card('T-128');
    const t134 = card('T-134');
    expect(tokenEquality(t128, t134)).toBe('disjoint'); // BEFORE — and wrong
    const seen = compareFences(fenceOf('T-128'), fenceOf('T-134'));
    expect(seen.verdict).toBe('overlapping');
    expect(seen.witnesses).toEqual([
      { left: 'method/', right: 'method/lane-protocol.md', path: 'method/lane-protocol.md' },
    ]);
  });

  it('the two live LANES are disjoint, and that is derived rather than assumed', () => {
    // A fence check is worth what it is worth before anybody writes
    // anything, so the lanes live at this ref are the one comparison this
    // card owes about itself.
    const seen = compareFences(fenceOf('T-111'), fenceOf('T-134'));
    expect(seen).toEqual({ verdict: 'disjoint', witnesses: [], unusable: [] });
  });
});

describe('T-221 — THE ONE CHARACTER THAT MAKES CONTAINMENT CONTAINMENT', () => {
  /**
   * `sharedDomain` decides containment with TWO SYMMETRIC LINES, and each
   * one is anchored on a single `/`:
   *
   *     if (b.startsWith(`${a}/`)) return b;   // the RIGHT side is deeper
   *     if (a.startsWith(`${b}/`)) return a;   // the LEFT side is deeper
   *
   * DROP EITHER SEPARATOR AND NOTHING IN THIS REPOSITORY REDS — measured
   * before this block existed, parser and the lane-fence/card-preflight/
   * dispatch-order suites alike. That is not a gap in coverage, it is the
   * SHAPE of the defect: deleting the separator does not delete a
   * behaviour, it WIDENS one, and every assertion already written here
   * stays true under the widening. A REMOVAL-ONLY MUTANT CANNOT FIND IT.
   *
   * What finds it is a pair where one string IS a prefix of the other and
   * is NOT a path prefix of it — `tools/e2e` against `tools/e2e-helpers`.
   * And it has to be asserted in BOTH ARGUMENT ORDERS, because the two
   * lines fire on opposite sides: a body covering one direction leaves
   * the other exactly as unpinned as before.
   *
   * WHY IT IS NOT COSMETIC ANY MORE. `compareFences` is what the dispatch
   * guard, the push gate and the merge gate compute disjointness with, so
   * a widened containment does not misprint a row — it REFUSES lanes that
   * never touch, at three gates, quietly, because a spurious refusal
   * looks exactly like a correct one. That is `method/lane-protocol.md`
   * rule 5's own measurement (six concurrent lanes, every block a naming
   * collision and not one real collision) reintroduced by the tool built
   * to end it.
   *
   * THE DOMAIN IS DERIVED, NOT TYPED. It is the fence a live `done` card
   * holds, and the adjacent sibling and the child are CONSTRUCTED from
   * it — so the pair moves with this repository's own vocabulary instead
   * of with a literal somebody has to remember. A construction cannot
   * drift out of step with the thing it is derived from; a transcription
   * can, and this file's own header says so about line numbers.
   */
  const held = fenceOf('T-038'); // the live board's `touches: [tools/e2e/]`
  const domain = held.paths[0] ?? '';
  /** A STRING prefix relationship that is NOT a path one. */
  const adjacent = `${domain}-helpers`;
  /** A genuine child — a path prefix, which containment must still see. */
  const child = `${domain}/tests`;

  /** Two one-token fences compared LEFT against RIGHT, in that order. */
  function verdictOf(left: string, right: string) {
    return compareFences(
      expandFence(synthetic('T-921', [left]), components),
      expandFence(synthetic('T-922', [right]), components),
    );
  }

  it('the fixture is this repository’s own data, and is shaped the way both pins assume', () => {
    // A COMPARISON IS EVIDENCE ONLY ONCE ITS EXPECTED SIDE IS ASSERTED
    // NON-EMPTY. A domain that came back `''` would make every pin below
    // pass for entirely the wrong reason: `''` is the repository root, and
    // `sharedDomain` short-circuits on it two lines BEFORE either
    // separator — so the disjointness pins would go green against code
    // that never ran the thing they exist to pin.
    expect(card('T-038').status).toBe('done');
    expect(held.paths).toEqual(['tools/e2e']);
    expect(held.unusable).toEqual([]);
    expect(domain).not.toBe('');
    // The sibling is a STRING prefix and NOT a path prefix — which is the
    // whole distinction the separator draws, asserted about the fixture
    // rather than assumed of it.
    expect(adjacent.startsWith(domain)).toBe(true);
    expect(adjacent.startsWith(`${domain}/`)).toBe(false);
    // …and the child is both, which is what makes it a control and not a
    // second copy of the same case.
    expect(child.startsWith(domain)).toBe(true);
    expect(child.startsWith(`${domain}/`)).toBe(true);
  });

  it('DIRECTION ONE: the deeper string on the RIGHT is DISJOINT — pins `b.startsWith(`${a}/`)`', () => {
    // Drop THIS line's separator and `tools/e2e` swallows
    // `tools/e2e-helpers`: b.startsWith(a) is true, and the guard reports
    // a collision between two lanes that share no file.
    const seen = verdictOf(domain, adjacent);
    expect(seen).toEqual({ verdict: 'disjoint', witnesses: [], unusable: [] });
  });

  it('DIRECTION TWO: the deeper string on the LEFT is DISJOINT — pins `a.startsWith(`${b}/`)`', () => {
    // THE SAME PAIR, THE OTHER WAY ROUND, AND IT IS NOT A DUPLICATE. The
    // line above cannot fire here and this one cannot fire there, so each
    // body kills exactly one mutant and neither covers the other's line.
    const seen = verdictOf(adjacent, domain);
    expect(seen).toEqual({ verdict: 'disjoint', witnesses: [], unusable: [] });
  });

  it('POSITIVE CONTROL, RIGHT deeper: a genuine child is still SHARED, and the witness is the NARROWER domain', () => {
    // A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL. A `sharedDomain`
    // that returned `undefined` unconditionally satisfies both pins above
    // perfectly — and it would silently disarm T-209's refusal entirely,
    // reporting every lane disjoint from every other. That failure is
    // indistinguishable from a working guard without these two bodies.
    const seen = verdictOf(domain, child);
    expect(seen.verdict).toBe('overlapping');
    expect(seen.witnesses).toEqual([{ left: domain, right: child, path: child }]);
  });

  it('POSITIVE CONTROL, LEFT deeper: the same containment seen from the other side', () => {
    // AND THIS HALF IS GENUINELY NEW RATHER THAN A MIRROR. PIN TWO (b)
    // above already exercises the right-deeper line positively (`method/`
    // containing `method/lane-protocol.md`, shallower on the left), so
    // deleting that line reds a body today. NOTHING exercised the
    // left-deeper line positively before this one: it could have been
    // deleted outright and the suite would have stayed green.
    const seen = verdictOf(child, domain);
    expect(seen.verdict).toBe('overlapping');
    expect(seen.witnesses).toEqual([{ left: child, right: domain, path: child }]);
  });
});

describe('T-219 — CONTAINMENT IS HOLDING, so a fence that SWALLOWS the unfenceable path is refused', () => {
  /**
   * `method/lane-protocol.md` rule 5 refuses the directory the protocol
   * writes to on every card, "MECHANICALLY, where the fence is read".
   * Until this block existed it was mechanical for ONE spelling: the
   * check was `UNFENCEABLE_PATHS.includes(normalized)`, EXACT equality on
   * a normalised token, in a module whose every other rule is
   * prefix-aware. `touches: [docs/tasks]` was refused; `touches: [docs]`
   * was ACCEPTED and expanded to a domain containing it, so a lane could
   * hold by containment the one directory no card may hold.
   *
   * THE TWO DIRECTIONS ARE DIFFERENT ANSWERS AND BOTH ARE PINNED HERE.
   * A token that CONTAINS the entry holds it and is refused; a token
   * that SITS INSIDE it is the narrowing the rule asks for by name —
   * "Name the individual files instead" — and must not be. A containment
   * test run in both directions would refuse `T-108`'s three named card
   * files, which is the fence the rule itself produced.
   *
   * THE DOMAINS ARE DERIVED FROM `UNFENCEABLE_PATHS`, NOT TYPED. The
   * refusal is a rule about the LIST, and the list is data — so the
   * fixtures are constructed from each entry and the block moves with
   * the data instead of with a literal somebody has to remember.
   */
  const entry = UNFENCEABLE_PATHS[0] ?? '';
  /** The parent domain that SWALLOWS the entry — `docs` for `docs/tasks`. */
  const parent = entry.split('/').slice(0, -1).join('/');
  /** A file NAMED inside the entry: allowed, and the rule says so. */
  const inside = `${entry}/T-905-a-named-card.md`;
  /** A STRING prefix of the entry that is not a PATH prefix of it. */
  const nearMiss = entry.slice(0, -1);
  /** A sibling whose name merely starts the same way. */
  const adjacent = `${entry}-archive`;

  it('the fixtures are this repository’s own data, and are shaped the way every pin below assumes', () => {
    // A COMPARISON IS EVIDENCE ONLY ONCE ITS EXPECTED SIDE IS ASSERTED
    // NON-EMPTY. An `entry` that came back `''` is the repository root,
    // which `sharedDomain` short-circuits on — every refusal below would
    // then pass against code that never ran the containment line at all.
    expect(UNFENCEABLE_PATHS.length).toBeGreaterThan(0);
    expect(entry).not.toBe('');
    expect(parent, 'the entry has no parent to swallow it with').not.toBe('');
    expect(entry.startsWith(`${parent}/`)).toBe(true);
    // The near miss is a STRING prefix and NOT a path one, which is the
    // whole distinction the separator draws — asserted about the fixture
    // rather than assumed of it.
    expect(entry.startsWith(nearMiss)).toBe(true);
    expect(entry.startsWith(`${nearMiss}/`)).toBe(false);
    expect(adjacent.startsWith(entry)).toBe(true);
    expect(adjacent.startsWith(`${entry}/`)).toBe(false);
  });

  it('REFUSES a token whose domain CONTAINS the entry, in every spelling, and NAMES what it swallowed', () => {
    for (const spelling of [parent, `${parent}/`, `./${parent}/**`, `${parent}//`, `  ${parent}  `]) {
      const fence = expandFence(synthetic('T-910', [spelling]), components);
      expect(fence.tokens[0]?.kind, spelling).toBe('rejected');
      expect(fence.paths, spelling).toEqual([]);
      expect(fence.unusable, spelling).toEqual([spelling.trim()]);
      const message = fence.issues[0]?.message ?? '';
      // The token it refused, and the unfenceable path it swallowed —
      // "SHALL say which unfenceable path the token swallowed".
      expect(message, spelling).toContain(JSON.stringify(spelling.trim()));
      expect(message, spelling).toContain(`CONTAINS '${entry}'`);
      expect(message, spelling).toContain('every dispatch');
    }
  });

  it('and refuses it BEFORE the oracle is consulted, so a real directory does not resolve past the rule', () => {
    // `parent` is a real directory, so the `knownPaths` oracle WOULD
    // settle it as a path — which is exactly how it slipped through
    // before. The refusal has to precede the oracle or the widest fence
    // on the board is the one the repository can confirm exists.
    const knownPaths = readdirSync(repoRoot);
    expect(knownPaths, 'the oracle cannot settle the fixture at all').toContain(parent);
    const fence = expandFence(synthetic('T-911', [parent]), components, { knownPaths });
    expect(fence.tokens[0]?.kind).toBe('rejected');
    expect(fence.paths).toEqual([]);
  });

  it('still refuses a token that IS the entry, and says so WITHOUT claiming containment', () => {
    const fence = expandFence(synthetic('T-912', [entry]), components);
    expect(fence.tokens[0]?.kind).toBe('rejected');
    const message = fence.issues[0]?.message ?? '';
    expect(message).toContain(`fences '${entry}'`);
    expect(message, 'a token that IS the entry contains nothing').not.toContain('CONTAINS');
  });

  it('does NOT reach a token that merely sits NEAR the entry — the separator is the whole rule', () => {
    // The one-character mutant this pins: drop the `/` from the
    // containment test and `docs/task` swallows `docs/tasks`, refusing a
    // fence that shares no file with it. That is `method/lane-protocol.md`
    // rule 5's own measurement — six concurrent lanes, every block a
    // naming collision and not one real collision — reintroduced by the
    // refusal built to enforce it.
    for (const near of [nearMiss, adjacent, `${parent}/ROADMAP.md`]) {
      const fence = expandFence(synthetic('T-913', [near]), components);
      expect(fence.tokens[0]?.kind, near).toBe('path');
      expect(fence.paths, near).toEqual([normalizeFenceToken(near)]);
      expect(fence.unusable, near).toEqual([]);
      expect(fence.issues, near).toEqual([]);
    }
  });

  it('POSITIVE CONTROL: a sibling DIRECTORY under the same parent is still fenceable', () => {
    // The card asks for this one by name, and `UNFENCEABLE_PATHS`'s own
    // doc is why: the list "is deliberately not a rule about
    // directories" — `docs/architecture/components/` is a legitimate
    // directory fence that six live cards hold, and what disqualifies
    // `docs/tasks` is that the PROTOCOL writes there on every card.
    //
    // ITS ARMING IS THE DATA, SO ITS CONTROL IS A DATA MUTANT. The same
    // `unfenceableWithin` call decides this body's answer and the
    // refusals above, so a code mutant cannot show this body failing
    // where the subject's arrangement is absent; adding this directory
    // to `UNFENCEABLE_PATHS` can, and is what the drill on this card ran.
    const fence = expandFence(synthetic('T-914', ['docs/architecture/components/']), components);
    expect(fence.tokens[0]?.kind).toBe('path');
    expect(fence.paths).toEqual(['docs/architecture/components']);
    expect(fence.unusable).toEqual([]);
    // …and it is a live vocabulary rather than a fixture: cards hold it.
    const holders = project.tasks.filter(
      (t) => t.id !== undefined && t.touches.some((raw) => normalizeFenceToken(raw) === 'docs/architecture/components'),
    );
    expect(holders.length, 'no live card fences the directory this control is about').toBeGreaterThan(0);
  });

  it('POSITIVE CONTROL: a card file NAMED inside the entry is still fenceable, live and synthetic', () => {
    // The rule's own remedy — "Name the individual files instead" — and
    // `T-108` is the card whose fence was narrowed by hand to exactly
    // that. A containment test run in BOTH directions refuses every one
    // of them and undoes the narrowing the rule asks for.
    const made = expandFence(synthetic('T-915', [inside]), components);
    expect(made.tokens[0]?.kind).toBe('path');
    expect(made.paths).toEqual([inside]);
    expect(made.unusable).toEqual([]);

    const live = fenceOf('T-108');
    expect(live.unusable).toEqual([]);
    expect(live.tokens.every((t) => t.kind === 'path')).toBe(true);
    expect(
      live.paths.every((p) => p.startsWith(`${entry}/`)),
      'the live fixture no longer names files inside the unfenceable directory',
    ).toBe(true);
    expect(live.paths.length).toBeGreaterThan(0);
  });

  it('REFUSES A SLUG whose component paths swallow the entry, and names the component', () => {
    // THE REFUSAL SITS AFTER THE SLUG BRANCH'S `continue`, so a slug
    // never reached it: the same guard, unasked, for the other kind of
    // token. Zero live instances — no component declares a path under
    // docs/ — so this is a SYNTHETIC registry deliberately, and the
    // control below is that the live registry is clean.
    const wide: ComponentRecord = {
      id: 'C-99',
      name: 'a component whose territory is the whole of docs',
      paths: [parent],
      dependsOn: [],
      decisions: [],
      touchSlugs: ['docs-everything'],
      status: 'auto',
      nonCode: true,
      responsibility: 'fixture',
      extra: Object.create(null) as Record<string, unknown>,
      file: 'docs/architecture/components/C-99-fixture.md',
    };
    const fence = expandFence(synthetic('T-921', ['docs-everything']), [wide]);
    expect(fence.tokens[0]?.kind, 'a slug walked past the rule a path is refused by').toBe(
      'rejected',
    );
    expect(fence.paths).toEqual([]);
    expect(fence.unusable).toEqual(['docs-everything']);
    const message = fence.issues[0]?.message ?? '';
    expect(message).toContain('C-99');
    expect(message).toContain(`CONTAINS '${entry}'`);

    // THE CONTROL, on the SAME registry shape: a component whose paths
    // sit elsewhere resolves as a slug and reserves them. Without it
    // every assertion above is satisfied by a branch that refuses every
    // slug it is handed.
    const narrow: ComponentRecord = { ...wide, paths: ['lib/parser/src'], touchSlugs: ['narrow'] };
    const ok = expandFence(synthetic('T-922', ['narrow']), [narrow]);
    expect(ok.tokens[0]?.kind).toBe('slug');
    expect(ok.paths).toEqual(['lib/parser/src']);
    expect(ok.unusable).toEqual([]);
  });

  it('and NO live registry slug swallows it, so the synthetic fixture above is the only way to reach it', () => {
    // The other half of the same claim, censused over this repository's
    // own registry rather than asserted: every slug the live components
    // declare expands to domains that hold nothing unfenceable, which is
    // why the branch above has zero live instances and is structural.
    const slugs = slugPathIndex(components);
    expect(slugs.size, 'the live registry declares no slug at all').toBeGreaterThan(0);
    const swallowing: string[] = [];
    for (const [name] of slugs) {
      const fence = expandFence(synthetic('T-923', [name]), components);
      if (fence.tokens[0]?.kind !== 'slug') swallowing.push(`${name} -> ${fence.tokens[0]?.kind}`);
    }
    expect(swallowing).toEqual([]);
  });

  it('T-227: a card declaring NO `touches:` is REFUSED, and the refusal names the card', () => {
    // Absorbed here as a second instance of this function's silence. An
    // empty `touches:` produced no token, no issue and no `unusable`
    // entry, so the expansion answered with a fence that permits nothing
    // and reports nothing — and the diagnosis costs whoever meets it far
    // more than the mistake did.
    const fence = expandFence(synthetic('T-916', []), components);
    expect(fence.tokens).toEqual([]);
    expect(fence.paths).toEqual([]);
    expect(fence.issues).toHaveLength(1);
    expect(fence.issues[0]?.kind).toBe('invalid-field');
    expect(fence.issues[0]).toMatchObject({ field: 'touches' });
    const message = fence.issues[0]?.message ?? '';
    expect(message, 'the refusal does not name the card').toContain('T-916');
    expect(message).toContain('docs/tasks/T-916-fixture.md');
    // AND NOT THROUGH `unusable`, WHICH IS RAW TOKENS: there is no token
    // here, and a sentinel in that list would make every consumer that
    // prints it as an unresolved TOKEN print a sentence with none behind
    // it. The verdict is `compareFences`'s, and the body below is it.
    expect(fence.unusable).toEqual([]);
  });

  it('T-227: and it is NEVER reported disjoint — with the control that the same probe answers both other verdicts', () => {
    // T-227's own measurement, and its own control: `compareFences`
    // walks `a.tokens × b.tokens`, so a token-less side produced zero
    // witnesses and fell through to `disjoint` — an ANSWER rather than a
    // silence, which is why the guard would have allowed the lane.
    const undeclared = expandFence(synthetic('T-917', []), components);
    const real = expandFence(synthetic('T-918', ['lib-parser']), components);
    const overlapping = expandFence(synthetic('T-919', ['lib/parser/src/fence.ts']), components);
    const elsewhere = expandFence(synthetic('T-920', ['app/src/main.tsx']), components);

    // THE CONTROLS FIRST, so the refusal below is a verdict this probe
    // could have answered otherwise rather than the only word it knows.
    expect(compareFences(real, overlapping).verdict).toBe('overlapping');
    expect(compareFences(real, elsewhere).verdict).toBe('disjoint');

    // …and the undeclared fence is disjoint from NEITHER, in both
    // argument orders — the loop is symmetric and the guard is not
    // allowed to depend on which side it was handed.
    for (const other of [real, overlapping, elsewhere]) {
      expect(compareFences(undeclared, other).verdict).toBe('unusable');
      expect(compareFences(other, undeclared).verdict).toBe('unusable');
    }
    expect(compareFences(undeclared, undeclared).verdict).toBe('unusable');
  });
});

describe('T-219-s2 — the repository ROOT has two spellings and only one of them was refused', () => {
  it('REFUSES a bare dot, which normalisation cannot strip, and names what it refused', () => {
    // `./` and `.//` normalise to nothing and are refused with a sentence
    // that says a fence cannot reserve the repository root. A BARE DOT is
    // the same declaration with nothing after it: the leading-`./` loop
    // has nothing left to strip, `.` survives normalisation, and `.`
    // contains a `.` — so `looksLikePath` classified it a PATH reserving
    // the domain `.`. Every path this module compares is
    // repository-relative and normalised, so none begins `./` and nothing
    // can ever sit inside `.`.
    //
    // KILLED BY: removing the `DOT_DOMAIN` branch from `expandFence`,
    // where the token comes back `kind: 'path'`, `paths: ['.']`,
    // `unusable: []` and `issues: []` — a fence that permits nothing,
    // collides with nothing and reports no issue.
    for (const raw of ['.', './.', './/', ' . ']) {
      const fence = expandFence(synthetic('T-930', [raw]), components);
      expect(fence.paths, `${raw} reserved a domain`).toEqual([]);
      expect(fence.tokens[0]?.kind, `${raw} resolved`).toBe('unresolved');
      expect(fence.unusable, `${raw} is not on the uncomparable list`).toEqual([raw.trim()]);
      expect(fence.issues, `${raw} was refused in silence`).toHaveLength(1);
    }
    // `.//` and ` . ` reach the refusal by different routes — the first
    // through the empty-normalisation branch, the second through this one
    // — so the message is asserted on the spelling this card is about.
    const dot = expandFence(synthetic('T-930', ['.']), components);
    const message = dot.issues[0]?.message ?? '';
    expect(message).toContain('repository ROOT under its other spelling');
    expect(message).toContain('reserve NOTHING while colliding with nothing');
    expect(message, 'the refusal does not name the card file').toContain(
      'docs/tasks/T-930-fixture.md',
    );
  });

  it('and refuses it BEFORE the oracle is consulted, so a repository cannot vote the root back in', () => {
    // The oracle exists to settle a bare WORD (`docs` is a directory,
    // `ci` is not). `.` is a directory on every filesystem there has ever
    // been, so an oracle asked about it would answer yes and hand the
    // fence a domain that still matches nothing. The refusal has to sit
    // above the oracle, exactly as T-219's does.
    const knownPaths = readdirSync(repoRoot);
    const fence = expandFence(synthetic('T-931', ['.']), components, {
      knownPaths: [...knownPaths, '.'],
    });
    expect(fence.tokens[0]?.kind).toBe('unresolved');
    expect(fence.paths).toEqual([]);
  });

  it('REFUSES a token that climbs OUT of the repository, with the control that a sibling name does not', () => {
    // THE CLASS, NOT THE SPELLING — which is this card's parent's own
    // lesson turned on its residual: T-219 exists because `docs/tasks`
    // was refused while the `docs` containing it was waved through, a
    // rule built for one spelling of one fence. `..` and `../nputer-app`
    // have the identical symptom as `.`: a domain no repository-relative
    // path can sit inside, reserved in silence.
    for (const raw of ['..', '../nputer-app', '../../etc']) {
      const fence = expandFence(synthetic('T-932', [raw]), components);
      expect(fence.tokens[0]?.kind, `${raw} resolved`).toBe('unresolved');
      expect(fence.paths, `${raw} reserved a domain`).toEqual([]);
      expect(fence.issues[0]?.message ?? '', raw).toContain('climbs OUT of the repository');
    }
    // THE CONTROLS, which are what stop this being a rule about the
    // CHARACTER: a leading `./` is stripped and the rest resolves; a
    // directory whose NAME merely begins with a dot is a real path; and a
    // dot inside a filename was never in question.
    for (const [raw, domain] of [
      ['./lib/parser', 'lib/parser'],
      ['.claude/hooks', '.claude/hooks'],
      ['...odd', '...odd'],
      ['lib/parser/src/fence.ts', 'lib/parser/src/fence.ts'],
    ] as const) {
      const fence = expandFence(synthetic('T-933', [raw]), components);
      expect(fence.tokens[0]?.kind, `${raw} was refused`).toBe('path');
      expect(fence.paths, `${raw} lost its domain`).toEqual([domain]);
      expect(fence.issues, `${raw} raised an issue`).toEqual([]);
    }
  });

  it('and the refusal reaches the VERDICT, never only the issue list', () => {
    // The half that decides a lane. `compareFences` walks the expanded
    // path sets, so before the refusal a dot fence produced zero
    // witnesses and fell through to `disjoint` — the answer, not a
    // silence, which is why the dispatch guard would have let it start.
    const dot = expandFence(synthetic('T-934', ['.']), components);
    const real = expandFence(synthetic('T-935', ['lib-parser']), components);
    const elsewhere = expandFence(synthetic('T-936', ['app/src/main.tsx']), components);

    // THE CONTROLS FIRST, so the refusal below is a verdict this probe
    // could have answered otherwise rather than the only word it knows.
    expect(compareFences(real, expandFence(synthetic('T-937', ['lib/parser/src/fence.ts']), components)).verdict).toBe('overlapping');
    expect(compareFences(real, elsewhere).verdict).toBe('disjoint');

    for (const other of [real, elsewhere]) {
      expect(compareFences(dot, other).verdict).toBe('unusable');
      expect(compareFences(other, dot).verdict).toBe('unusable');
    }
  });
});

describe('the live board, censused through the expansion', () => {
  it('every token on every live card resolves, except the three on T-054 and one declared creation target', () => {
    // The census is a PROPERTY, not a tally: a count here would go stale
    // under the next merge exactly the way a line number does.
    // The `bin` rows: bin/ exists (2026-08-30) and the DISPATCH
    // expansion resolves it through its tracked-path oracle — but THIS
    // census runs expandFence oracle-less, where a bare token resolves
    // only through a component's declared paths, and NO COMPONENT CLAIMS
    // bin/. Status does not filter this census, so EVERY card that ever
    // fences bin joins this list until bin/ joins the registry — the
    // structural fix, routed rather than taken here because declaring a
    // component moves fixtures in three suites (the DECLARING A
    // COMPONENT gotcha).
    const unresolved: string[] = [];
    for (const task of project.tasks) {
      if (task.id === undefined || task.touches.length === 0) continue;
      for (const raw of expandFence(task, components).unusable) unresolved.push(`${task.id} ${raw}`);
    }
    expect(unresolved).toEqual(['T-054 docs', 'T-054 method', 'T-054 ci', 'T-164 bin', 'T-164-s1 bin']);
  });

  it('no live card fences its own file, so the carve-out changes nothing today', () => {
    // Recorded as a measurement rather than a claim: the carve-out is a
    // guard against a fence that would otherwise be unperformable, and it
    // repairs nothing on this board.
    const carved: string[] = [];
    for (const task of project.tasks) {
      if (task.id === undefined || task.touches.length === 0) continue;
      const fence = expandFence(task, components);
      if (fence.excluded.length > 0) carved.push(`${task.id} ${fence.excluded.join(',')}`);
    }
    expect(carved).toEqual([]);
  });

  it('ONE live card holds the directory the parser refuses, it is `done`, and it holds no lane', () => {
    // THE CENSUS MOVED WITH T-219 AND THE PROPERTY DID NOT. No card had
    // ever spelled `docs/tasks`, so this list was empty while the refusal
    // was exact-match; making it CONTAINMENT-aware brings in the one card
    // whose bare `docs` domain swallows it — `T-054`, the card's own
    // "Measured" instance, first seen in passing by `T-111`'s verifier
    // (F7) and never filed until this one.
    //
    // IT IS RECORDED RATHER THAN REPAIRED, and the reason is what the
    // status says: `T-054` is `done`, its lane was removed long ago, and
    // a fence is a claim on ground held by a LIVE lane. Narrowing a
    // closed card's `touches:` would rewrite the record of what that lane
    // actually held, which is the one thing the card is evidence of. The
    // refusal binds every card dispatched from here; this body is what
    // stops the census reading as though nothing on the board ever
    // matched it.
    const held: string[] = [];
    for (const task of project.tasks) {
      if (task.id === undefined || task.touches.length === 0) continue;
      for (const token of expandFence(task, components).tokens) {
        if (token.kind === 'rejected') held.push(`${task.id} ${token.raw} [${task.status}]`);
      }
    }
    expect(held).toEqual(['T-054 docs [done]']);
  });

  it('and no live card is refused for a card file it names INSIDE that directory', () => {
    // THE OTHER DIRECTION, CENSUSED OVER THIS REPOSITORY'S OWN DATA.
    // `method/lane-protocol.md` rule 5 answers the refusal above with
    // "Name the individual files instead", and four live cards did
    // exactly that — `T-108` is the one the rule was written from. A
    // containment test run in both directions would refuse every one of
    // them and undo the narrowing the rule asks for, so this is the
    // control that the refusal is a ONE-WAY test and not a rule about
    // the directory's name.
    const named: string[] = [];
    for (const task of project.tasks) {
      if (task.id === undefined || task.touches.length === 0) continue;
      const fence = expandFence(task, components);
      for (const token of fence.tokens) {
        if (!token.normalized.startsWith('docs/tasks/')) continue;
        expect(token.kind, `${task.id} ${token.raw}`).toBe('path');
        expect(fence.paths, `${task.id} ${token.raw}`).toContain(token.normalized);
        named.push(token.normalized);
      }
    }
    // A CENSUS IS EVIDENCE ONLY ONCE ITS EXPECTED SIDE IS ASSERTED
    // NON-EMPTY: a loop over zero tokens passes every assertion inside it.
    expect(named.length).toBeGreaterThan(0);
  });

  it('T-219-s2: NO live card fences the repository root or climbs out of it — with a planted card proving the census can see one', () => {
    // AN EMPTY CENSUS IS NOT EVIDENCE UNTIL ITS OWN INSTRUMENT HAS BEEN
    // SEEN FINDING SOMETHING. This one expects zero, so the control comes
    // FIRST: a planted card carrying `.` is run through the identical
    // predicate over the identical loop, and it is found. Without that,
    // the body below passes just as green against a predicate that never
    // matches anything — which is the failure mode a zero-count census
    // has and a non-empty one does not.
    const planted: string[] = [];
    for (const task of [...project.tasks, synthetic('T-940', ['.', '../nputer-app'])]) {
      if (task.id === undefined) continue;
      for (const raw of task.touches) {
        const normalized = normalizeFenceToken(raw);
        if (/^\.\.?(?:\/|$)/.test(normalized)) planted.push(`${task.id} ${raw} -> ${normalized}`);
      }
    }
    expect(planted, 'the census predicate found nothing even with a card planted for it').toEqual([
      'T-940 . -> .',
      'T-940 ../nputer-app -> ../nputer-app',
    ]);

    // AND NOW THE LIVE BOARD, through the same predicate: nobody has ever
    // spelled it. The refusal is structural rather than a repair, which
    // is exactly what makes it worth pinning — a silent state has no
    // instance until the day it has one, and the DOT is reachable from
    // the most ordinary source there is: a token pasted out of a shell.
    const live: string[] = [];
    for (const task of project.tasks) {
      if (task.id === undefined) continue;
      for (const raw of task.touches) {
        const normalized = normalizeFenceToken(raw);
        if (/^\.\.?(?:\/|$)/.test(normalized)) live.push(`${task.id} ${raw} [${task.status}]`);
      }
    }
    expect(live).toEqual([]);

    // THE DECLARED CEILING, CENSUSED RATHER THAN ASSERTED. An INTERIOR
    // dot segment (`a/./b`, `a/../b`) has the identical symptom and a
    // DIFFERENT remedy — normalisation should resolve the segment, not
    // refuse the token — so `expandFence` deliberately does not reach it
    // and `T-219-s6` is routed for it. This row is what stops that being
    // a silent hole: it is zero today, and it reds the day one is written.
    const interior: string[] = [];
    for (const task of project.tasks) {
      if (task.id === undefined) continue;
      for (const raw of task.touches) {
        const normalized = normalizeFenceToken(raw);
        if (/(?:^|\/)\.\.?(?:\/)/.test(normalized) && !/^\.\.?(?:\/|$)/.test(normalized)) {
          interior.push(`${task.id} ${raw} [${task.status}]`);
        }
      }
    }
    expect(interior).toEqual([]);
  });

  it('T-219-s4: every ready card the DISPATCH oracle sees has a COMPARABLE fence, and oracle-less exactly the bare-word cards do not', () => {
    // THE LIVE-BOARD EFFECT OF THE `rule()` TERM, censused where the
    // census belongs — and measured BOTH ways, because the two answers
    // differ and only one of them is dispatch. `brief.mjs --dispatch`
    // passes a `knownPaths` oracle built from every tracked path and
    // every directory prefix of one, so a bare `bin` resolves there;
    // this suite has no git, so `readdirSync` of the repository root is
    // the same oracle for the top-level tokens that are the whole of the
    // disagreement today.
    //
    // THE CONTROL FIRST, again, because the oracle side expects zero: a
    // planted card carrying an unresolvable bare word is found by the
    // identical predicate.
    const oracle = readdirSync(repoRoot);
    const uncomparable = (task: TaskRecord, knownPaths?: readonly string[]): string | undefined => {
      const fence = expandFence(task, components, knownPaths === undefined ? {} : { knownPaths });
      return fence.unusable.length === 0 ? undefined : `${task.id} ${fence.unusable.join(',')}`;
    };
    expect(uncomparable(synthetic('T-941', ['nowhere-at-all']), oracle)).toBe(
      'T-941 nowhere-at-all',
    );

    // WITH THE ORACLE: no card that a dispatch could START carries an
    // uncomparable fence. `planned` is the only status the schedule can
    // rule `ready` from, so it is the population the term moves.
    const withOracle: string[] = [];
    const withNone: string[] = [];
    for (const task of project.tasks) {
      if (task.id === undefined || task.status !== 'planned' || task.touches.length === 0) continue;
      const a = uncomparable(task, oracle);
      if (a !== undefined) withOracle.push(a);
      const b = uncomparable(task);
      if (b !== undefined) withNone.push(b);
    }
    expect(withOracle, 'a planned card cannot be dispatched with a fence nobody can compute').toEqual([]);
    // AND THE ORACLE-LESS ROW IS WHAT STOPS THE EMPTY ONE ABOVE BEING
    // VACUOUS, run through the SAME predicate over the SAME population:
    // drop the oracle and the board does produce an instance. So the
    // zero is the oracle closing the gap, not the loop finding nothing.
    //
    // IT IS ALSO THE QUALIFIER THIS CARD'S TRIAGE WAS AMENDED FOR. The
    // stamp read "the wider remedy moves T-164-s1 from startable to
    // unfenceable" full stop; it moves it ORACLE-LESS ONLY. `bin/.gitkeep`
    // is tracked, `knownPathOracle` carries every ancestor prefix of every
    // tracked path, and `brief.mjs --dispatch` and `buildLaneFence` both
    // supply it — so at the surface that dispatches, `bin` resolves as a
    // path and NO live card moves. A consumer with no repository gets
    // `unfenceable`, which is the correct answer for it: a fence it cannot
    // COMPUTE is not a fence that is free.
    expect(withNone).toEqual(['T-164-s1 bin']);
  });
});
