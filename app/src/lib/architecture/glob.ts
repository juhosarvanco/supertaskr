/**
 * Gitignore-style glob matching for component `paths` (T-011, plan §2/§4.1).
 *
 * Hand-rolled on purpose: the derivation engine takes zero new runtime
 * dependencies (dispatch decision), the live registry uses only simple
 * `dir/**` globs and literals, and a small matcher with documented,
 * unit-pinned semantics is easier to trust than a general library whose
 * semantics we would still have to pin. T-008 deliberately forked no glob
 * semantics out of T-011 (its parse-time overlap check is matcher-agnostic
 * text containment), so this file is the ONE place pattern semantics live.
 *
 * Supported subset (each rule unit-tested in architecture-glob.test.ts):
 * - Patterns are matched against root-relative POSIX file paths.
 * - Leading `./` and `/` are stripped (T-008's normalization precedent);
 *   patterns are root-anchored when they contain a `/`.
 * - `*` matches any run of characters within one segment (never `/`);
 *   `?` matches exactly one character within a segment.
 * - `**` as a whole segment matches zero or more segments, except in
 *   final position where it matches one or more (`a/**` matches
 *   everything inside `a/` but not the file `a` itself — gitignore rule).
 *   A non-whole-segment `**` behaves like `*`.
 * - A fully consumed pattern with path remaining claims the subtree:
 *   `app/test` matches `app/test/x.ts` (gitignore directory claim).
 * - A trailing `/` makes the pattern directory-only: `app/test/` matches
 *   `app/test/x.ts` but not a plain file named `app/test`.
 * - A pattern with no `/` (other than a trailing one) is unanchored and
 *   matches against every path segment: `*.ts` matches at any depth,
 *   `dist` claims any file inside any `dist/` directory or named `dist`.
 * - `!pattern` negates: within one component's `paths` list the LAST
 *   matching pattern wins (gitignore last-match-wins).
 * - NOT supported, treated as literal characters: character classes
 *   (`[abc]`), brace expansion (`{a,b}`), backslash escapes. None appear
 *   in the live registry; adding them later is additive.
 * - Matching is byte-exact and case-sensitive (deterministic across
 *   machines — the T-009 stance: the data, not the filesystem, answers).
 *
 * No regexes anywhere: hostile pattern or path content cannot smuggle
 * metacharacters or trigger pathological backtracking; the segment
 * matcher is a linear-space two-pointer glob walk.
 */

/** Match one glob segment (no `/`): `*` any run, `?` one char, else literal. */
export function matchSegment(pattern: string, text: string): boolean {
  // Classic iterative glob match with backtracking on the last `*`.
  let p = 0;
  let t = 0;
  let starP = -1;
  let starT = -1;
  while (t < text.length) {
    const pc = pattern[p];
    if (p < pattern.length && (pc === text[t] || pc === "?")) {
      p += 1;
      t += 1;
    } else if (p < pattern.length && pc === "*") {
      starP = p;
      starT = t;
      p += 1;
    } else if (starP !== -1) {
      p = starP + 1;
      starT += 1;
      t = starT;
    } else {
      return false;
    }
  }
  while (p < pattern.length && pattern[p] === "*") p += 1;
  return p === pattern.length;
}

/** Normalized form of one pattern: negation flag, dir-only flag, segments. */
interface CompiledPattern {
  negated: boolean;
  /** Trailing `/` in the source: matches only as a directory prefix. */
  dirOnly: boolean;
  /** True when the pattern contains no `/` — matched per segment at any depth. */
  unanchored: boolean;
  segments: string[];
}

function compilePattern(raw: string): CompiledPattern {
  let pattern = raw;
  let negated = false;
  if (pattern.startsWith("!")) {
    negated = true;
    pattern = pattern.slice(1);
  }
  if (pattern.startsWith("./")) pattern = pattern.slice(2);
  if (pattern.startsWith("/")) pattern = pattern.slice(1);
  let dirOnly = false;
  if (pattern.endsWith("/")) {
    dirOnly = true;
    pattern = pattern.slice(0, -1);
  }
  const segments = pattern.split("/").filter((segment) => segment !== "");
  const unanchored = segments.length <= 1;
  return { negated, dirOnly, unanchored, segments };
}

/**
 * Anchored match of pattern segments against path segments.
 * Returns "file" (pattern consumed the whole path), "dir" (pattern
 * consumed a proper prefix at a segment boundary — the gitignore
 * directory claim), or undefined (no match).
 */
function matchAnchored(
  segments: readonly string[],
  path: readonly string[],
): "file" | "dir" | undefined {
  // Memoized recursion over (pattern index, path index); tiny inputs.
  const width = path.length + 1;
  const memo = new Map<number, "file" | "dir" | null>();
  const go = (i: number, j: number): "file" | "dir" | undefined => {
    const key = i * width + j;
    const hit = memo.get(key);
    if (hit !== undefined) return hit === null ? undefined : hit;
    let result: "file" | "dir" | undefined;
    if (i === segments.length) {
      // Pattern consumed: exact file match, or directory claim of the rest.
      result = j === path.length ? "file" : "dir";
    } else if (segments[i] === "**") {
      if (i === segments.length - 1) {
        // Final `**` needs at least one remaining segment (a/** ≠ a).
        // With two or more remaining it can stop early on a directory —
        // prefer that reading so `a/**/` claims files under matched dirs.
        result = j >= path.length ? undefined : path.length - j >= 2 ? "dir" : "file";
      } else {
        // Zero-or-more segments; prefer the "dir" reading when reachable.
        const skip = go(i + 1, j);
        const consume = skip === "dir" || j >= path.length ? undefined : go(i, j + 1);
        result = skip === "dir" || consume === "dir" ? "dir" : (skip ?? consume);
      }
    } else if (j === path.length) {
      result = undefined;
    } else if (matchSegment(segments[i] as string, path[j] as string)) {
      result = go(i + 1, j + 1);
    } else {
      result = undefined;
    }
    memo.set(key, result ?? null);
    return result;
  };
  return go(0, 0);
}

/** Normalize a candidate path into segments (defensive: graph content). */
function pathSegments(path: string): string[] {
  let p = path;
  if (p.startsWith("./")) p = p.slice(2);
  while (p.startsWith("/")) p = p.slice(1);
  return p.split("/").filter((segment) => segment !== "");
}

/** How one compiled pattern relates to a path, ignoring negation. */
function patternHits(pattern: CompiledPattern, path: readonly string[]): boolean {
  if (pattern.segments.length === 0) return false; // empty pattern is inert
  if (pattern.unanchored) {
    const segment = pattern.segments[0] as string;
    // Match against every path segment; a directory-segment hit claims the
    // file inside it, a filename hit claims the file itself. Directory-only
    // patterns must hit a non-final segment.
    const last = path.length - 1;
    for (let i = 0; i < path.length; i += 1) {
      if (!matchSegment(segment, path[i] as string)) continue;
      if (i < last) return true; // matched a directory on the way down
      return !pattern.dirOnly; // matched the filename itself
    }
    return false;
  }
  const kind = matchAnchored(pattern.segments, path);
  if (kind === undefined) return false;
  if (kind === "file") return !pattern.dirOnly;
  return true; // directory claim
}

/**
 * Does this ordered gitignore-style pattern list claim the path?
 * Last matching pattern wins (negations un-claim).
 */
export function claimsPath(patterns: readonly string[], path: string): boolean {
  const segments = pathSegments(path);
  if (segments.length === 0) return false;
  let verdict = false;
  for (const raw of patterns) {
    const pattern = compilePattern(raw);
    if (patternHits(pattern, segments)) verdict = !pattern.negated;
  }
  return verdict;
}

/**
 * The pattern text that decides a claim: the LAST positively matching
 * pattern (gitignore last-match-wins), or undefined when the list does
 * not claim the path. Feeds the `ambiguous-mapping` issue's `patterns`
 * field (T-008's chartered shape) so a D4 names the exact declared text
 * behind each component's claim.
 */
export function claimingPattern(patterns: readonly string[], path: string): string | undefined {
  const segments = pathSegments(path);
  if (segments.length === 0) return undefined;
  let winner: string | undefined;
  for (const raw of patterns) {
    const pattern = compilePattern(raw);
    if (patternHits(pattern, segments)) winner = pattern.negated ? undefined : raw;
  }
  return winner;
}

/**
 * Probe segment for directory-ownership checks: a name no real pattern
 * literal can equal (NUL is impossible in committed patterns and paths),
 * so only wildcard segments (`*`, `**`, `?`-forms) or ancestor directory
 * claims can match it.
 */
const OWNERSHIP_PROBE = "\u0000";

/**
 * Would this pattern list claim files created inside directory `dir`?
 * Used for the package.path join (T-009 plan §6.6 seam): a package node
 * whose repo-internal `path` names a directory belongs to the component
 * that would own that directory's files. `lib/parser/**` owns
 * `lib/parser`; the literal `app/index.html` does not own `app`.
 */
export function claimsDirContents(patterns: readonly string[], dir: string): boolean {
  const segments = pathSegments(dir);
  if (segments.length === 0) return false;
  return claimsPath(patterns, [...segments, OWNERSHIP_PROBE].join("/"));
}
