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
 *
 * AND THE LIST IS READ AS DOMAINS, NEVER AS STRINGS (T-219). A card that
 * CONTAINS an entry holds it just as surely as one that IS it — a bare
 * `docs` fence reserves `docs/tasks` and every card file under it — so
 * `expandFence` tests containment through `sharedDomain`, the same
 * "containment IS overlap" rule the rest of this module compares with,
 * rather than by string equality. The test runs in ONE direction: a
 * token that SITS INSIDE an entry is the narrowing `method/lane-protocol.md`
 * rule 5 asks for in as many words (*"Name the individual files
 * instead"*), so `docs/tasks/T-108-…md` stays fenceable and `docs` does
 * not.
 */
export const UNFENCEABLE_PATHS: readonly string[] = Object.freeze(['docs/tasks']);

/** How one `touches:` token resolved. */
export type FenceTokenKind =
  /** A component slug, expanded through `touch_slugs:` to its paths. */
  | 'slug'
  /** A repository path or directory prefix, standing for itself. */
  | 'path'
  /**
   * Refused by `UNFENCEABLE_PATHS` — the token IS one of those paths or
   * CONTAINS one (T-219); reserves nothing either way.
   */
  | 'rejected'
  /**
   * Neither a slug nor anything this module can read as a path — which
   * includes a token that PARSES as a path and names a domain no
   * repository-relative path can sit inside: `.` (the root under its
   * other spelling) and `..`/`../…` (outside the repository) (T-219-s4),
   * whether the card WROTE it that way or normalisation RESOLVED it to
   * one — `lib/../../x` normalises to `../x` (T-219-s6).
   */
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
   *
   * IT IS RAW TOKENS AND NOTHING ELSE, so it is EMPTY for the one fence
   * that is uncomparable without owning a token: a card declaring no
   * `touches:` at all (T-227, absorbed by T-219). That refusal reaches
   * `issues`, and `compareFences` answers `unusable` off the empty
   * `tokens` list rather than off this one — a sentinel here would make
   * every consumer that prints these as unresolved TOKENS print a
   * sentence with no token behind it.
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
 * A normalised token whose FIRST SEGMENT is `.` or `..` — the repository
 * root under its other spelling, or a domain that climbs out of the
 * repository altogether (T-219-s2, absorbed by T-219-s4).
 *
 * MATCHED ON THE NORMALISED FORM, WHICH IS WHY THIS IS THREE SHAPES AND
 * NOT SIX. `normalizeFenceToken` already strips every leading `./` run,
 * so `./x` and `.//x` arrive as `x` and never reach this test; what
 * survives it is exactly `.`, `..` and `../…`. The refusal `expandFence`
 * hangs on this is spelled there, next to the two it sits between.
 *
 * AND IT IS ASKED TWICE, WHICH IS ONE RULE IN TWO POSITIONS AND NOT TWO
 * RULES (T-219-s6). `normalizeFenceToken`'s dot-segment resolution asks
 * it of its own INPUT and declines to touch a token that matches, so the
 * three shapes above arrive at `expandFence` spelled exactly as they
 * always were and the refusal below is reached unchanged. `expandFence`
 * asks it of the RESULT, which is how a token that RESOLVES to a climb —
 * `lib/../../x`, normalising to `../x` — reaches the same refusal by the
 * same test rather than by a second one written to look like it. One
 * constant, both positions: a second spelling of *"is this a dot
 * domain"* is the T-057 defect this module removes everywhere else.
 */
const DOT_DOMAIN = /^\.\.?(?:\/|$)/;

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
 * 6. drop the trailing `/`;
 * 7. resolve the dot segments that are left — a `.` segment is DROPPED,
 *    and a `..` segment is dropped WITH THE SEGMENT BEFORE IT.
 *
 * STEP 7 IS `T-219-s6`, AND IT CLOSES A CEILING RATHER THAN ADDING A
 * FEATURE. Until it existed this function resolved a dot segment in
 * exactly ONE position — step 4's leading `./` run — so `lib/./parser`
 * and `lib/x/../parser` survived normalisation whole. Both carry a `/`,
 * so `expandFence` classified them `path` and reserved the domain
 * verbatim; and `sharedDomain` compares normalised repository-relative
 * domains, NONE of which contains a dot segment, so neither domain could
 * ever meet one. The fence permitted nothing, collided with nothing and
 * raised no issue — which is precisely the sentence `T-219-s2` was filed
 * about, one position over in the string.
 *
 * THE REMEDY IS NORMALISATION AND NOT REFUSAL, and that difference is
 * the whole reason this was a separate card rather than a rider on
 * `T-219-s4`'s guard. `.` and `..` at the HEAD name a domain that is not
 * repository-relative at all, so refusing is the honest answer;
 * `lib/./parser` names a REAL directory spelled badly, so the honest
 * answer is that it and `lib/parser` are one path — exactly as
 * `tools/e2e/` and `tools/e2e` are one path and step 6 already says so.
 * Refusing it would refuse a fence that reserves real ground.
 *
 * THE DOT-SEGMENT CEILING IS DECLARED THE SAME WAY THE GLOB ONE BELOW
 * IS, AND IT IS TWO SENTENCES. (a) THE HEAD IS NOT THIS FUNCTION'S TO
 * RESOLVE: step 7 is guarded on its own INPUT with `DOT_DOMAIN`, so `.`,
 * `..` and `../…` come out spelled exactly as they went in and
 * `expandFence`'s `T-219-s4` refusal is reached UNCHANGED. Resolving
 * them here would quietly move `.` off that refusal and onto the
 * empty-token one, retiring a sentence somebody has to keep — a
 * normalisation is not the place to decide which refusal a token gets.
 * (b) A CLIMB THAT SURVIVES RESOLUTION IS LEFT TO THAT SAME REFUSAL:
 * `lib/../../x` resolves to `../x`, a dot domain, and is answered
 * exactly as a token written that way in the first place; `lib/..`
 * resolves to the root's empty spelling and is refused there. So the
 * ceiling is not *"interior dot segments"* any more — it is *"a domain
 * outside the repository"*, which is `DOT_DOMAIN`'s, by construction.
 *
 * AND THE RESOLUTION IS LEXICAL, DECLARED BECAUSE IT IS A REAL LIMIT AND
 * NOT A DETAIL. This module reads no filesystem — its own header's
 * promise — so `a/../b` resolves to `b` by counting segments, never by
 * asking what `a` is. For a fence that is the right answer and the only
 * available one: a fence is a claim on repository-relative PATHS, which
 * is what every other rule here compares, and what a symlink-aware
 * resolver would answer is a different question this module never asks.
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
  // GUARDED ON THE INPUT, WHICH IS THE WHOLE OF WHAT KEEPS `T-219-s4`'s
  // REFUSAL REACHABLE (see the ceiling's sentence (a) above). A token
  // whose first segment is already a dot segment is that card's and is
  // returned untouched; everything else is resolved, and a result that
  // climbs out of the repository is that card's too.
  if (DOT_DOMAIN.test(out)) return out;
  const resolved: string[] = [];
  for (const segment of out.split('/')) {
    if (segment === '.') continue;
    if (segment !== '..') {
      resolved.push(segment);
      continue;
    }
    // A `..` WITH NOTHING TO CANCEL IS KEPT, NOT DROPPED, so the climb
    // survives into the normalised form and stays visible to the
    // refusal. Dropping it would turn `lib/../../x` into `x` — a fence
    // silently reserving a domain the card never named, which is worse
    // than the silence this card removes.
    const last = resolved[resolved.length - 1];
    if (last === undefined || last === '..') resolved.push('..');
    else resolved.pop();
  }
  return resolved.join('/');
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
 * The `UNFENCEABLE_PATHS` entry a token domain HOLDS, or `undefined`.
 *
 * T-219: rule 5 refuses the directory the protocol writes to on every
 * card, and until this function existed the refusal was
 * `UNFENCEABLE_PATHS.includes(normalized)` — EXACT equality on the
 * normalised token, in a module where every other rule is prefix-aware.
 * So `docs/tasks` was refused and the bare `docs` beside it was accepted
 * and expanded to a domain CONTAINING it: rule 5's mechanical half was
 * built for one spelling of the same fence.
 *
 * THE TEST IS `sharedDomain` AND IS NOT A SECOND PREFIX RULE (T-057: one
 * fact, one implementation). `sharedDomain` returns the NARROWER of two
 * domains when they meet, so asking whether that narrower one IS the
 * unfenceable path asks exactly *"does this token hold it?"* — true when
 * the token equals the entry, true when it contains it, and FALSE when
 * the token sits inside it, which is the narrowing rule 5 asks for by
 * name. One expression, both directions, and the `/` separator every
 * containment answer in this module turns on is spelled in exactly one
 * place.
 */
function unfenceableWithin(domain: string): string | undefined {
  for (const path of UNFENCEABLE_PATHS) {
    if (sharedDomain(domain, path) === path) return path;
  }
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

  // A CARD THAT DECLARES NO FENCE IS REFUSED, NOT READ AS AN EMPTY ONE
  // (T-227, absorbed by T-219 as a second instance of this function's
  // silence). An empty `touches:` produced no token, no issue and no
  // `unusable` entry, so the expansion answered with a fence that
  // reserves nothing — and `compareFences`, which walks `tokens`, then
  // reported it DISJOINT from a fence it would fully overlap while the
  // write-time hook refused every path. The two halves disagreed in the
  // safe direction, by luck rather than by rule, and the diagnosis cost
  // whoever met it far more than the mistake did.
  //
  // THE REFUSAL IS AN ISSUE AND NOT AN `unusable` ENTRY, because that
  // list is documented as RAW TOKENS and there is no token here to name
  // — a sentinel in it would make every consumer that prints "tokens
  // this expansion could not resolve" print a sentence that is false.
  // The `unusable` VERDICT is `compareFences`'s and is where this lands:
  // that function refuses to call a token-less fence disjoint, which is
  // the half this module's own header promises ("an ISSUE plus an
  // `unusable` verdict, NEVER as silence").
  if (task.touches.length === 0) {
    invalid(
      `is empty, so ${task.id ?? 'this card'} declares no fence at all — a card with no \`touches:\` reserves nothing and can write nothing, and an undeclared fence is not "disjoint from everything" (method/lane-protocol.md rule 5). Declare the paths or slugs this card's work reaches`,
    );
  }

  for (const entry of task.touches) {
    const raw = entry.trim();
    const normalized = normalizeFenceToken(raw);
    // Looked up on the NORMALISED spelling, so `app-shell/` is the slug
    // it obviously means rather than an unresolved word one character
    // away from one. Normalisation is the identity on a bare slug.
    const slug = slugs.get(normalized);

    if (slug !== undefined) {
      // A SLUG IS A TOKEN TOO, AND ITS DOMAIN IS THE SET IT EXPANDS TO
      // (T-219). The refusal below sits after this branch's `continue`,
      // so until this check existed a slug whose component `paths:`
      // reached an unfenceable directory walked past the rule entirely —
      // the same guard, unasked, for the other kind of token. No live
      // component declares such a path today and that is exactly why it
      // is structural rather than an incident: this module refuses on
      // the DOMAIN a token reserves, and a slug reserves domains.
      const swallowedByComponent = slug.paths
        .map((path) => [path, unfenceableWithin(path)] as const)
        .find((pair): pair is readonly [string, string] => pair[1] !== undefined);
      if (swallowedByComponent !== undefined) {
        const [domain, held] = swallowedByComponent;
        unusable.push(raw);
        tokens.push({ raw, normalized, kind: 'rejected', components: [], paths: [] });
        invalid(
          `entry ${JSON.stringify(raw)} is a component slug expanding through ${slug.components.join(', ')} to '${domain}', which ${domain === held ? `IS` : `CONTAINS`} '${held}' — every dispatch and every closing stamp writes there, so a lane holding it collides with every other lane's opening and closing move (T-108, T-219). The fence refuses the DOMAIN a token reserves, and a slug reserves the domains its components declare: narrow the component's paths, or name the individual files instead`,
        );
        continue;
      }
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

    // THE ROOT HAS TWO SPELLINGS AND ONLY THE EMPTY ONE WAS REFUSED
    // (T-219-s2, absorbed by T-219-s4). `./` and `.//` normalise to
    // nothing and hit the branch above, which says in as many words that
    // *a fence cannot reserve the repository root*. A BARE DOT normalises
    // to `.` — the loop that strips a leading `./` has nothing left to
    // strip — and `.` carries a `.`, so `looksLikePath` below classified
    // it a PATH reserving the domain `.`.
    //
    // THAT IS THE WORST OF BOTH ANSWERS AND IT IS SILENT. Every path this
    // module compares is repository-relative and normalised, so none of
    // them begins `./` and `sharedDomain` can never meet `.` — the fence
    // permits nothing, collides with nothing, raises no issue and comes
    // back `disjoint` from every card on the board. The empty spelling of
    // the same token is refused with a sentence; this one was accepted
    // with a lie, and the two spellings mean the identical thing.
    //
    // REFUSED BY THE CLASS AND NOT BY THE ONE SPELLING, which is T-219's
    // own lesson turned on its residual: the parent card exists because
    // `docs/tasks` was refused while the `docs` containing it was waved
    // through, a rule built for one spelling of one fence. So the test is
    // the FIRST SEGMENT — `.` is the root, and `..` or `../x` climbs out
    // of the repository — and every one of them names a domain no
    // repository-relative path can sit inside.
    //
    // THE INTERIOR ARM OF THAT CEILING IS CLOSED, AND IT WAS CLOSED BY
    // NORMALISATION RATHER THAN HERE (`T-219-s6`). This comment used to
    // ROUTE it: an INTERIOR dot segment (`a/./b`, `a/../b`) had the
    // identical symptom — a domain no repository-relative path can sit
    // inside, reserved in silence — and a DIFFERENT remedy, because
    // `a/./b` names a real directory spelled badly. `normalizeFenceToken`
    // step 7 now resolves it, so such a token reaches this loop already
    // spelled `a/b` and never reaches this branch at all. THE CEILING
    // MOVED TO THAT FUNCTION'S DOC RATHER THAN BEING DELETED — read it
    // there, where the resolution is.
    //
    // AND WHAT REACHES THIS BRANCH IS NOW TWO SHAPES, NOT ONE. A token
    // WRITTEN as `.`, `..` or `../…`, which normalisation deliberately
    // leaves alone; and a token that RESOLVED to one — `lib/../../x`
    // becomes `../x` — which is the same domain reached by arithmetic
    // instead of by spelling, and is answered here identically because
    // the test is on the normalised form. Censused at `24bfec8e10b3` and
    // re-derived by `fence.test.ts`'s own live-board bodies rather than
    // quoted: no live token takes either shape, so both arms are
    // structural today.
    if (DOT_DOMAIN.test(normalized)) {
      unusable.push(raw);
      tokens.push({ raw, normalized, kind: 'unresolved', components: [], paths: [] });
      const naming =
        normalized === '.'
          ? `is the repository ROOT under its other spelling — './' and './/' normalise to nothing and are refused for exactly this reason, and refusing one spelling of a token while accepting the other is how a rule ends up half-built (T-219)`
          : `climbs OUT of the repository — a fence is repository-relative, so this domain is not one this board can name`;
      invalid(
        `entry ${JSON.stringify(raw)} normalises to '${normalized}', which ${naming}. No repository-relative path can sit inside it, so the fence would reserve NOTHING while colliding with nothing and reporting no issue — which is a fence answering "no overlap" when it means "I do not know". Name the directories or files this card's work reaches, spelled from the repository root`,
      );
      continue;
    }

    const swallowed = unfenceableWithin(normalized);
    if (swallowed !== undefined) {
      unusable.push(raw);
      tokens.push({ raw, normalized, kind: 'rejected', components: [], paths: [] });
      const holding =
        normalized === swallowed
          ? `which no card may hold`
          : `which CONTAINS '${swallowed}' — and containment IS holding, so this fence reserves it just as surely as one that names it — and that no card may hold`;
      invalid(
        `entry ${JSON.stringify(raw)} fences '${normalized}', ${holding} — every dispatch and every closing stamp writes there, so a lane holding it collides with every other lane's opening and closing move (T-108, T-219). Name the individual files instead`,
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
 * witness names the shared domain. `disjoint` is proved too: BOTH SIDES
 * DECLARED A FENCE, every token on both sides resolved, and no pair of
 * domains meets. `unusable` is neither, and it is what an unresolved or
 * rejected token buys — and what a side declaring NO token buys, which
 * is the same "I do not know" reached by the one input that owns no
 * token to be unresolved (T-227, absorbed by T-219). A proved overlap
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
  // A FENCE WITH NO TOKENS DECLARES NOTHING, AND NOTHING IS NOT DISJOINT
  // FROM EVERYTHING (T-227, absorbed by T-219). The loops below are over
  // `a.tokens × b.tokens`, so a token-less side produces zero witnesses
  // and falls straight through to `disjoint` — the third verdict's whole
  // reason for existing, reached by the one input that never gets one.
  // `unusable` is the honest answer: no overlap was proved, and with one
  // side declaring nothing none could be ruled out either.
  if (a.tokens.length === 0 || b.tokens.length === 0) {
    return {
      verdict: 'unusable',
      witnesses: [],
      unusable: [...new Set([...a.unusable, ...b.unusable])],
    };
  }

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
          const key = JSON.stringify([shared, left.raw, right.raw]);
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
