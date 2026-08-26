import type { ComponentRecord, ParseIssue, TaskRecord } from './types.js';

/**
 * THE FENCE (T-134): a `touches:` list expanded to the PATH SET it
 * reserves, and two of those sets compared.
 *
 * A fence used to be a list of component SLUGS, and a slug was the only
 * expressible unit — so a card that knew its three files had to claim its
 * whole component, and the fence stopped being collision-avoidance and
 * became a lock on a name. This module makes a fence name PATHS, keeps a
 * slug as SHORTHAND for a path set, and computes disjointness over the
 * expanded sets rather than over the tokens.
 *
 * WHY THE TOKENS ARE THE WRONG THING TO COMPARE, in one recorded
 * instance: `T-033 touches: [docs/architecture/components/, lib-parser,
 * app-map, app-shell]` and `T-111 touches: [app-board]` share no token,
 * so a string-equality fence reported them DISJOINT and two overlapping
 * lanes went into flight. `app-shell` and `app-board` both name C-11
 * (`app/src/styles/**`, `app/src/assets/**`) — the only component in the
 * registry carrying two slugs. Expanding first is what sees it.
 *
 * THE MAP IS NOT BUILT HERE AND MUST NEVER BE. `slugPathIndex` reads each
 * component file's own `touch_slugs:` FIELD, which
 * `method/roles/executor.md` row 5 rules authoritative over the
 * architecture document's prose block, "because the block is prose that
 * goes stale the day a component is added". This module takes parsed
 * `ComponentRecord`s and joins them; it does not read a file, does not
 * embed a slug table, and has no fallback copy of one (the T-057 rule:
 * one fact, one implementation).
 *
 * PURE, AND FLAGGING RATHER THAN HIDING — the same contract the rest of
 * this package holds. Nothing here throws, nothing reads the filesystem,
 * and a token this module cannot resolve comes back as an ISSUE plus an
 * `unusable` verdict, NEVER as silence. A fence that answers "no overlap"
 * when it means "I do not know" is the defect this module exists to
 * remove.
 */

/**
 * Directory tokens no card may fence, rejected mechanically rather than
 * by convention. Normalised form (no trailing slash).
 *
 * `docs/tasks` is where every dispatch stamp and every integrator's
 * closing stamp is written, so a lane holding it collides with every
 * other lane's opening and closing move — including its own card's, which
 * `expandFence` carves out precisely because a card's own file is never
 * part of its own fence. Ruled at `T-108`'s dispatch; made mechanical
 * here.
 *
 * THIS IS A LIST OF ONE AND IT IS DELIBERATELY NOT A RULE ABOUT
 * DIRECTORIES. `docs/architecture/components/` is a legitimate directory
 * fence that six cards hold. What disqualifies `docs/tasks` is that the
 * PROTOCOL writes there on every card, not that it is a directory.
 */
export const UNFENCEABLE_PATHS: readonly string[] = Object.freeze(['docs/tasks']);

/** How one `touches:` token resolved. */
export type FenceTokenKind =
  /** A component slug, expanded through `touch_slugs:` to its paths. */
  | 'slug'
  /** A repository path or directory prefix, standing for itself. */
  | 'path'
  /** Refused by `UNFENCEABLE_PATHS`; reserves nothing. */
  | 'rejected'
  /** Neither a slug nor anything this module can read as a path. */
  | 'unresolved';

/** One `touches:` token, classified and expanded. */
export interface FenceToken {
  /** The token exactly as the card wrote it, trimmed. */
  raw: string;
  /** `raw` after normalisation — see `normalizeFenceToken`. */
  normalized: string;
  kind: FenceTokenKind;
  /**
   * Component ids this token resolved through; `[]` for every kind but
   * `slug`. In registry order as supplied.
   */
  components: string[];
  /**
   * Normalised path domains this token reserves. A domain is an exact
   * file path or a directory prefix; both are compared as prefixes.
   * Empty for `rejected` and `unresolved`.
   */
  paths: string[];
}

/** A card's `touches:` list, expanded. */
export interface Fence {
  /** The card's id, when it declares one. */
  id?: string;
  /** The card's own file, normalised — never part of its own fence. */
  file?: string;
  tokens: FenceToken[];
  /** Every path domain this fence reserves: deduped, sorted, own file carved out. */
  paths: string[];
  /**
   * Exact file paths this fence would otherwise have reserved and does
   * not. Today that is the card's own file and nothing else — recorded
   * rather than dropped silently, so a reader can see the carve-out
   * happened instead of deriving it.
   */
  excluded: string[];
  /**
   * Raw tokens that make this fence uncomparable — every `rejected` and
   * `unresolved` one. A non-empty list is why `compareFences` answers
   * `unusable` instead of `disjoint`.
   */
  unusable: string[];
  issues: ParseIssue[];
}

/** What one slug reserves. */
export interface SlugExpansion {
  /** Component ids carrying this slug, in the order the records arrived. */
  components: string[];
  /** Their `paths:`, normalised, deduped, sorted. */
  paths: string[];
}

/** Verdict of comparing two fences. Three values, never two. */
export type FenceVerdict =
  /** A shared path domain was found; `witnesses` names it. */
  | 'overlapping'
  /** Both fences resolved completely and share nothing. */
  | 'disjoint'
  /**
   * No overlap was PROVED and at least one token could not be resolved,
   * so no overlap could be ruled out either. Never collapse this into
   * `disjoint`: that is a fence saying "no overlap" when it means "I do
   * not know" (`T-111-s3`).
   */
  | 'unusable';

/** One proved collision between two fences. */
export interface FenceWitness {
  /** The left fence's token, as written. */
  left: string;
  /** The right fence's token, as written. */
  right: string;
  /** The narrower of the two path domains — what both fences reserve. */
  path: string;
}

/** Result of comparing two fences. */
export interface FenceComparison {
  verdict: FenceVerdict;
  /** Every proved collision, deduped, sorted by path then token. */
  witnesses: FenceWitness[];
  /** Raw tokens from EITHER side that could not be resolved. */
  unusable: string[];
}

/** Options for `expandFence`. */
export interface ExpandFenceOptions {
  /**
   * Repository-relative paths (files or directories) known to exist,
   * normalised or not. Supplying them is the ONLY way this module can
   * tell a bare directory token from a word that names nothing: `docs`
   * is a real directory and `ci` is not, and neither carries a `/` or a
   * `.` to give itself away (`T-111-s3`'s third kind of token).
   *
   * ABSENT BY DEFAULT, AND THE DEFAULT IS THE LOUD ONE: without an
   * oracle a bare word that is not a slug resolves to `unresolved` and
   * makes the fence `unusable`, rather than being guessed into a path
   * that then overlaps nothing.
   *
   * A BARE WORD IS THE ONLY SHAPE THAT NEEDS THIS. `method/` declares
   * itself a directory by its own trailing slash and resolves with no
   * oracle at all; only `docs`, `method` and `ci` — the three tokens
   * `T-111-s3` found on one card — are shaped so that nothing but the
   * repository can tell them apart.
   */
  knownPaths?: Iterable<string>;
  /**
   * The card's own file, overriding `task.file`. Pass `''` to disable
   * the carve-out entirely (a caller comparing two hand-built fences
   * with no files behind them).
   */
  ownFile?: string;
}

/** Characters this module does not interpret; see `normalizeFenceToken`. */
const GLOB_CHARS = /[*?[\]!]/;

/**
 * Normalise one `touches:` token to the spelling everything below
 * compares.
 *
 * `T-111-s3` measured the vocabulary and found the same thing spelled
 * two ways all over the live board — `method` beside `method/`,
 * `tools/e2e` beside `tools/e2e/` — and named the consequence: a fence
 * check that silently accepts both spellings is how it returns the wrong
 * answer. The steps, in order:
 *
 * 1. trim;
 * 2. backslashes to `/` (a Windows-typed path is the same path);
 * 3. collapse repeated `/`;
 * 4. drop leading `./` runs;
 * 5. drop a trailing `/**`, `/*` or bare `**`/`*` run — `app/src/styles/**`
 *    and `app/src/styles/` name one directory;
 * 6. drop the trailing `/`.
 *
 * THE CEILING IS DECLARED RATHER THAN LEFT TO BE DISCOVERED, which is
 * what `T-111-s3` asks of a normalisation that cannot close every
 * collision. This function understands ONE glob shape: a trailing star
 * run. It does NOT interpret an interior `*`, a `?`, a character class or
 * a leading `!` — a token still carrying any of those after step 5 is
 * classified `unresolved` by `expandFence` and makes the fence unusable,
 * because comparing `app/src/**\/*.ts` as a literal prefix would answer
 * confidently and wrongly. No live component `paths:` entry or `touches:`
 * token needs more than the trailing shape today; the day one does, the
 * fence says so instead of guessing.
 */
export function normalizeFenceToken(raw: string): string {
  let out = raw.trim().replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  while (out.startsWith('./')) out = out.slice(2);
  out = out.replace(/(?:\/)?\*+$/, '');
  while (out.endsWith('/')) out = out.slice(0, -1);
  return out;
}

/**
 * THE SLUG MAP, and the only one this package will ever have: each
 * component record's own `touch_slugs:` field joined to its own `paths:`.
 *
 * Keys are slugs exactly as declared. A slug carried by two components
 * (today `app-shell` by C-05/C-10/C-16 and `app-board` by C-08/C-09,
 * both also by C-11) expands to the UNION of their paths, which is what
 * makes `app-board` and `app-shell` provably non-disjoint instead of
 * merely different strings.
 *
 * ADR-009: a Map, never an object literal — a slug literally spelled
 * `__proto__` must not resolve against inherited state.
 */
export function slugPathIndex(components: readonly ComponentRecord[]): Map<string, SlugExpansion> {
  const map = new Map<string, SlugExpansion>();
  for (const component of components) {
    for (const slug of component.touchSlugs) {
      const key = slug.trim();
      if (key === '') continue;
      const held = map.get(key) ?? { components: [], paths: [] };
      if (!held.components.includes(component.id)) held.components.push(component.id);
      for (const path of component.paths) {
        const normalized = normalizeFenceToken(path);
        if (normalized !== '' && !held.paths.includes(normalized)) held.paths.push(normalized);
      }
      map.set(key, held);
    }
  }
  for (const expansion of map.values()) expansion.paths.sort();
  return map;
}

/**
 * Does path domain `a` contain, equal, or sit inside path domain `b`?
 * Both are normalised; containment IS overlap, which is the half of the
 * vocabulary a trailing-slash rule alone never reaches (`docs` contains
 * `docs/tasks`, and they are different strings).
 *
 * Returns the NARROWER domain when they meet — the thing both fences
 * actually reserve — and `undefined` when they do not. `''` is the
 * repository root and contains everything; no live token normalises to
 * it, and saying so is cheaper than a special case that lies.
 */
function sharedDomain(a: string, b: string): string | undefined {
  if (a === b) return a;
  if (a === '') return b;
  if (b === '') return a;
  if (b.startsWith(`${a}/`)) return b;
  if (a.startsWith(`${b}/`)) return a;
  return undefined;
}

/**
 * Expand one card's `touches:` list into the path set it reserves.
 *
 * A CARD'S OWN FILE IS NEVER PART OF ITS OWN FENCE, and that is encoded
 * here rather than left to each reader (T-108's dispatch ruling, and the
 * conflict `T-108-s3` records against `method/roles/executor.md` step 5).
 * The card's own file is subtracted from the expansion: a token that IS
 * the own file reserves nothing, and a token that CONTAINS it keeps its
 * domain with the own file carved out. Both land in `excluded`, so the
 * carve-out is visible instead of inferred.
 *
 * WHAT THE CARVE-OUT DOES NOT DO, said plainly: it removes the file from
 * the fence, so writing to it is not a fence breach and another lane
 * cannot be told it collides there. It does not decide WHO may write to
 * that file or WHAT they may write — that is the protocol's question
 * (`method/lane-protocol.md` rule 5), and a fence has never answered it.
 *
 * Never throws. Every unresolvable token yields an `invalid-field` issue
 * on `touches` — the existing kind rather than a new one, so these can
 * flow through `validateProject` the day the board wants them without a
 * type change rippling through every consumer.
 */
export function expandFence(
  task: Pick<TaskRecord, 'touches'> & Partial<Pick<TaskRecord, 'id' | 'file'>>,
  components: readonly ComponentRecord[],
  options: ExpandFenceOptions = {},
): Fence {
  const slugs = slugPathIndex(components);
  const known = new Set<string>();
  for (const path of options.knownPaths ?? []) {
    const normalized = normalizeFenceToken(path);
    if (normalized !== '') known.add(normalized);
  }
  const file = normalizeFenceToken(options.ownFile ?? task.file ?? '');
  const issues: ParseIssue[] = [];
  const tokens: FenceToken[] = [];
  const unusable: string[] = [];
  const excluded: string[] = [];
  const paths: string[] = [];

  const invalid = (detail: string): void => {
    issues.push({
      kind: 'invalid-field',
      file: task.file ?? '',
      field: 'touches',
      message: `${task.file ?? ''}: field 'touches' ${detail}`,
    });
  };

  for (const entry of task.touches) {
    const raw = entry.trim();
    const normalized = normalizeFenceToken(raw);
    // Looked up on the NORMALISED spelling, so `app-shell/` is the slug
    // it obviously means rather than an unresolved word one character
    // away from one. Normalisation is the identity on a bare slug.
    const slug = slugs.get(normalized);

    if (slug !== undefined) {
      tokens.push({
        raw,
        normalized,
        kind: 'slug',
        components: [...slug.components],
        paths: [...slug.paths],
      });
      for (const path of slug.paths) paths.push(path);
      continue;
    }

    if (normalized === '') {
      unusable.push(raw);
      tokens.push({ raw, normalized, kind: 'unresolved', components: [], paths: [] });
      invalid(
        `entry ${JSON.stringify(raw)} normalises to nothing — it names no slug and no path, and a fence cannot reserve the repository root`,
      );
      continue;
    }

    if (UNFENCEABLE_PATHS.includes(normalized)) {
      unusable.push(raw);
      tokens.push({ raw, normalized, kind: 'rejected', components: [], paths: [] });
      invalid(
        `entry ${JSON.stringify(raw)} fences '${normalized}', which no card may hold — every dispatch and every closing stamp writes there, so a lane holding it collides with every other lane's opening and closing move (T-108). Name the individual files instead`,
      );
      continue;
    }

    if (GLOB_CHARS.test(normalized)) {
      unusable.push(raw);
      tokens.push({ raw, normalized, kind: 'unresolved', components: [], paths: [] });
      invalid(
        `entry ${JSON.stringify(raw)} carries a glob this fence does not interpret — only a TRAILING star run is understood, and comparing the rest as a literal prefix would answer confidently and wrongly`,
      );
      continue;
    }

    // A path gives itself away three ways: it carries a `/`, it carries
    // a `.`, or its author wrote a trailing `/` or `/**` — which is a
    // DECLARATION that the token names a directory, and the reason
    // `method/` resolves here while the bare `method` beside it does not.
    // A bare word gives itself away not at all, and `docs` (a real
    // directory) beside `ci` (nothing at the repository root at all) is
    // the live pair that proves one string rule cannot separate them.
    // With no oracle the honest answer for a bare word is that this
    // token was not resolved.
    const declaredDirectory = /[/*]$/.test(raw);
    const looksLikePath = normalized.includes('/') || normalized.includes('.');
    if (looksLikePath || declaredDirectory || known.has(normalized)) {
      tokens.push({ raw, normalized, kind: 'path', components: [], paths: [normalized] });
      paths.push(normalized);
      continue;
    }

    unusable.push(raw);
    tokens.push({ raw, normalized, kind: 'unresolved', components: [], paths: [] });
    invalid(
      `entry ${JSON.stringify(raw)} names no component slug and nothing this fence can read as a path — an unresolved token is not 'disjoint from everything', so every comparison against this fence is UNUSABLE until it is spelled as a slug or a path`,
    );
  }

  const reserved: string[] = [];
  for (const path of [...new Set(paths)].sort()) {
    if (file !== '' && path === file) {
      if (!excluded.includes(file)) excluded.push(file);
      continue;
    }
    if (file !== '' && file.startsWith(`${path}/`) && !excluded.includes(file)) excluded.push(file);
    reserved.push(path);
  }

  return {
    ...(task.id !== undefined ? { id: task.id } : {}),
    ...(file !== '' ? { file } : {}),
    tokens,
    paths: reserved,
    excluded,
    unusable,
    issues,
  };
}

/**
 * Compare two expanded fences.
 *
 * THE COMPARISON IS OVER THE EXPANDED PATH SETS, NEVER OVER THE TOKENS.
 * Two fences naming different slugs can claim the same component, and two
 * fences naming different paths can claim the same directory; a token
 * comparison misses both, in the direction a fence exists to prevent.
 *
 * The lattice has three values on purpose. `overlapping` is PROVED — a
 * witness names the shared domain. `disjoint` is proved too: every token
 * on both sides resolved, and no pair of domains meets. `unusable` is
 * neither, and it is what an unresolved or rejected token buys: no
 * overlap was found and none could be ruled out. A proved overlap
 * outranks an unusable token, because an unresolved token can only add
 * reserved paths and never remove one.
 *
 * A carved-out own file is not a collision: if the only domain two fences
 * share is exactly a file one of them excluded, that pair is not a
 * witness. The carve-out reaches an EXACT file and no further — a
 * directory domain is never partially excluded — and that is the ceiling
 * rather than an oversight.
 */
export function compareFences(a: Fence, b: Fence): FenceComparison {
  const excluded = new Set([...a.excluded, ...b.excluded]);
  const seen = new Set<string>();
  const witnesses: FenceWitness[] = [];

  for (const left of a.tokens) {
    for (const right of b.tokens) {
      for (const pa of left.paths) {
        for (const pb of right.paths) {
          const shared = sharedDomain(pa, pb);
          if (shared === undefined) continue;
          if (excluded.has(shared)) continue;
          const key = `${shared} ${left.raw} ${right.raw}`;
          if (seen.has(key)) continue;
          seen.add(key);
          witnesses.push({ left: left.raw, right: right.raw, path: shared });
        }
      }
    }
  }

  witnesses.sort(
    (x, y) =>
      (x.path < y.path ? -1 : x.path > y.path ? 1 : 0) ||
      (x.left < y.left ? -1 : x.left > y.left ? 1 : 0) ||
      (x.right < y.right ? -1 : x.right > y.right ? 1 : 0),
  );

  const unusable = [...new Set([...a.unusable, ...b.unusable])];
  const verdict: FenceVerdict =
    witnesses.length > 0 ? 'overlapping' : unusable.length > 0 ? 'unusable' : 'disjoint';
  return { verdict, witnesses, unusable };
}
