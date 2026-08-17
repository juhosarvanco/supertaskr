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
  return id.replace(/\d+/g, (digits) => digits.replace(/^0+(?=\d)/, ''));
}

/** String order — the total order used to report spellings of one slot. */
function compareIdSpellings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
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
 * separate two spellings of ONE slot: every numeric part inside a slot
 * is equal by construction, so any numeric-first comparator (e.g.
 * compareComponentIds) has already degenerated to exactly this. The
 * component caller passes its own comparator anyway — there the tie
 * being reported IS that comparator's tie, and the message says so.
 *
 * ADR-009: slot keys are derived from untrusted file content, so they
 * key a Map and never an object literal.
 */
export function aliasedIdSlots(
  ids: Iterable<string>,
  compare: (a: string, b: string) => number = compareIdSpellings,
): string[][] {
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

  const aliased: string[][] = [];
  for (const group of bySlot.values()) {
    if (group.length < 2) continue;
    aliased.push([...group].sort(compare));
  }
  return aliased;
}
