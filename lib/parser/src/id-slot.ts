/**
 * Numeric-slot grouping for id spaces (T-053, promoting T-030-s3).
 *
 * Every id space in this convention spells a number inside a string —
 * `C-05`, `T-016`, `T-016-s2`, `F-02` — and NOTHING in those spellings
 * says the zero padding is decoration. So `C-05`/`C-005`, `T-01`/`T-001`
 * and `F-1`/`F-01` are each one slot spelled twice: the strings differ
 * (so nothing is literally declared twice, and `duplicate-id` correctly
 * stays silent) while every consumer that reasons NUMERICALLY sees one
 * value and resolves the tie by an accident of padding.
 *
 * T-030 built this grouping inside parseComponentSet for the component
 * registry alone. T-053 lifts it here ONCE — copied logic in three id
 * spaces is three chances to disagree about what an id is — and the
 * three callers (component.ts, validate.ts, roadmap.ts) each own only
 * their message and their `space`.
 */

/**
 * The slot an id occupies: every run of digits reduced to its leading-
 * zero-free spelling, IN PLACE, with all non-digit structure untouched.
 *
 *     C-05      -> C-5        T-01       -> T-1
 *     C-005     -> C-5        T-001      -> T-1
 *     F-1       -> F-1        T-01-s01   -> T-1-s1
 *     F-01      -> F-1        T-01       -> T-1     (≠ T-1-s1)
 *
 * TWO properties are load-bearing, and both are easy to lose:
 *
 * 1. THE STRIP IS TEXTUAL, NEVER `Number()` (T-030's stated reason,
 *    carried forward verbatim in force): an id may carry arbitrarily
 *    many digits, and two genuinely different ids past 2^53 must not
 *    collide into a false alias just because floating point ran out of
 *    room. `Number('9007199254740993') === Number('9007199254740992')`
 *    is true; these two ids are not aliases and this key says so.
 *
 * 2. EVERY DIGIT RUN IS CANONICALIZED SEPARATELY, and the separators
 *    between them survive. The task space is the one that needs this:
 *    a task id's `-sN` suffix is part of its IDENTITY (`T-016-s2` is a
 *    suggestion against `T-016`, not `T-016`), so its digits must alias
 *    like any others while the `-s` itself keeps the two apart. A
 *    suffix-BLIND key — anything that reads only the first number —
 *    silently merges a suggestion into its parent task, which is a worse
 *    bug than the aliasing this module exists to report.
 *
 * Total by construction: an id with no digits at all is its own slot,
 * which is why non-conforming ids need no special case here.
 */
export function idSlotKey(id: string): string {
  return id.replace(/\d+/g, canonicalDigits);
}

/**
 * One run of digits with its leading zeros removed, keeping a single `0`
 * for an all-zero run (`007` -> `7`, `000` -> `0`, `` -> ``). THE strip,
 * in one place: `idSlotKey` reduces an id to its slot with it and
 * `compareDigitRuns` orders two runs with it, so the key and the order
 * cannot disagree about what the digits of an id are.
 */
function canonicalDigits(digits: string): string {
  return digits.replace(/^0+(?=\d)/, '');
}

/**
 * Order two runs of DIGITS as numbers, textually: canonicalize, then
 * longer-is-greater, then lexicographic. Exact for a run of any length.
 *
 * This is what `Number(a) - Number(b)` is trying to be and stops being
 * twice (T-076). Past 2^53 `Number` fuses neighbours, so the difference
 * is 0 for two runs that are not equal and the caller falls through to a
 * tie-break it did not need; past ~309 digits BOTH sides are `Infinity`,
 * the difference is `NaN`, `NaN !== 0` is true, and a comparator that
 * returns NaN is not a comparator — `Array.prototype.sort` may then do
 * anything, and V8 leaves the pair in arrival order. Both ranges are
 * reachable: every id gate in this package bounds the digits BELOW
 * (`C-\d{2,}`, `T-\d+`, `F-\d+`) and none of them bounds them above, so
 * the length of a digit run is whatever a file says it is.
 *
 * Same canonicalization as `idSlotKey`, deliberately: inside one slot
 * every digit run is equal under this comparison BY CONSTRUCTION, which
 * is the property `aliasedIdSlots` relies on and could not previously
 * assume (see its doc).
 */
export function compareDigitRuns(a: string, b: string): number {
  const ca = canonicalDigits(a);
  const cb = canonicalDigits(b);
  if (ca.length !== cb.length) return ca.length < cb.length ? -1 : 1;
  return ca < cb ? -1 : ca > cb ? 1 : 0;
}

/** String order — the total order used to report spellings of one slot. */
function compareIdSpellings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Group ids by slot: slot key -> the distinct spellings occupying it, in
 * first-seen order, slots themselves in first-seen order. `ids` is
 * treated as a SET (a repeated string is collapsed).
 *
 * The ONE grouping pass in this package — `aliasedIdSlots` reads which
 * slots have two spellings out of it, and `slotNearMisses` reads which
 * declared spelling a dangling reference nearly matched.
 *
 * ADR-009: slot keys are derived from untrusted file content, so they
 * key a Map and never an object literal — an id literally spelled
 * `__proto__` occupies a slot like any other and resolves against
 * nothing inherited.
 */
export function idSlotIndex(ids: Iterable<string>): Map<string, string[]> {
  const bySlot = new Map<string, string[]>();
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const slot = idSlotKey(id);
    const group = bySlot.get(slot) ?? [];
    group.push(id);
    bySlot.set(slot, group);
  }
  return bySlot;
}

/**
 * The DECLARED spellings that occupy `ref`'s slot without being `ref` —
 * the near misses behind a `dangling-reference` (T-076). Empty when the
 * reference is simply absent, which is the ordinary case.
 *
 * `blocked_by: [T-01]` beside a declared `T-001` used to report only
 * "no task in the model declares it": true, and it sends a reader
 * hunting a task that does not exist rather than at the padding one line
 * away. Because `idSlotKey` only removes LEADING ZEROS, a non-empty
 * result means exactly one thing — these ids differ from the reference
 * in zero padding and in nothing else.
 *
 * `ref` itself is excluded so the helper stays honest if a caller hands
 * it an id that IS declared; the three live callers only ask about
 * references they have already failed to resolve.
 */
export function slotNearMisses(
  ref: string,
  index: ReadonlyMap<string, readonly string[]>,
): string[] {
  return (index.get(idSlotKey(ref)) ?? []).filter((id) => id !== ref);
}

/**
 * The near-miss clause of a `dangling-reference` message, or '' when
 * there is no near miss — so a call site interpolates it unconditionally.
 *
 * The three callers own their own messages (that is the T-053 split), but
 * this fragment is about the SLOT rather than the space, it is
 * word-for-word the same in all three, and three copies of one English
 * sentence are three chances to drift. It lives here with the slot rule
 * it describes.
 */
export function nearMissClause(nearMiss: readonly string[]): string {
  if (nearMiss.length === 0) return '';
  const named = nearMiss.map((id) => `'${id}'`).join(', ');
  const verb = nearMiss.length === 1 ? 'is declared and differs' : 'are declared and differ';
  return ` — ${named} ${verb} only in zero padding`;
}

/**
 * Group ids by numeric slot and return only the ALIASED slots: those
 * holding two or more different spellings, each group sorted by
 * `compare`, slots in first-seen order (so a caller feeding ids in a
 * deterministic order gets deterministic issues).
 *
 * `ids` is treated as a SET — an exact repeat is `duplicate-id`'s
 * business and never an alias, so a repeated string is collapsed here
 * rather than reported as a slot aliasing itself.
 *
 * `compare` defaults to string order, which is the only order that can
 * separate two spellings of ONE slot: every digit run inside a slot is
 * equal under `compareDigitRuns` by construction, so a comparator that
 * weighs the digits FIRST has nothing left to weigh there and reaches
 * whatever it does next.
 *
 * THAT IS A PROPERTY OF THE COMPARATOR PASSED, NEVER A GUARANTEE THIS
 * FUNCTION MAKES (T-076). This comment used to assert the fall-through
 * as already true of "any numeric-first comparator", and it was false of
 * the only comparator this package passes: `compareComponentIds` weighed
 * digits through `Number()`, so past ~309 digits both sides were
 * `Infinity`, it returned `NaN` — before any fallback — and `sort` left
 * the pair in arrival order. Since T-076 that comparator uses
 * `compareDigitRuns`, so it IS total and it DOES reach its string
 * fallback inside a slot; a caller passing some other `Number()`-based
 * comparator would put the NaN back, and nothing here can stop it.
 *
 * The component caller passes its own comparator anyway — there the tie
 * being reported IS that comparator's tie, and the message says so.
 *
 * ADR-009 (via idSlotIndex): slot keys are derived from untrusted file
 * content, so they key a Map and never an object literal.
 */
export function aliasedIdSlots(
  ids: Iterable<string>,
  compare: (a: string, b: string) => number = compareIdSpellings,
): string[][] {
  const aliased: string[][] = [];
  for (const group of idSlotIndex(ids).values()) {
    if (group.length < 2) continue;
    aliased.push([...group].sort(compare));
  }
  return aliased;
}
