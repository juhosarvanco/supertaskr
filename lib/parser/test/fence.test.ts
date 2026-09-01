import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
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
    // With the repository's own top-level entries supplied, `docs` and
    // `method` are paths and `ci` still names nothing — which is
    // `T-111-s3`'s ruling ("`ci` wants a ruling, not code") reproduced
    // mechanically rather than asserted.
    const knownPaths = readdirSync(repoRoot);
    const fence = expandFence(card('T-054'), components, { knownPaths });
    expect(fence.unusable).toEqual(['ci']);
    const kinds = new Map(fence.tokens.map((t) => [t.raw, t.kind]));
    expect(kinds.get('docs')).toBe('path');
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
    const wide = expandFence(synthetic('T-904', ['docs/'], own), components);
    expect(wide.excluded).toEqual([own]);
    expect(wide.paths).toEqual(['docs']);
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
    const holder = expandFence(synthetic('T-904', ['docs/'], own), components);
    const neighbourFile = 'docs/tasks/T-905-neighbour.md';
    const neighbour = expandFence(synthetic('T-905', ['lib-parser'], neighbourFile), components);

    // The holder reserves it…
    expect(holder.paths).toEqual(['docs']);
    expect(neighbourFile.startsWith('docs/')).toBe(true);
    // …the neighbour does not claim it, because nobody claims their own…
    expect(neighbour.paths).toEqual(['lib/parser']);
    // …so the comparison is silent, and correctly so.
    expect(compareFences(holder, neighbour).verdict).toBe('disjoint');
    // Which is why `docs/tasks` is refused by the parser rather than
    // discovered by a comparison that structurally cannot discover it.
    const refused = expandFence(synthetic('T-904', ['docs/tasks/'], own), components);
    expect(refused.tokens[0]?.kind).toBe('rejected');
    expect(compareFences(refused, neighbour).verdict).toBe('unusable');
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

  it('and no live card holds the directory the parser refuses', () => {
    const held: string[] = [];
    for (const task of project.tasks) {
      if (task.id === undefined || task.touches.length === 0) continue;
      for (const token of expandFence(task, components).tokens) {
        if (token.kind === 'rejected') held.push(`${task.id} ${token.raw}`);
      }
    }
    expect(held).toEqual([]);
  });
});
