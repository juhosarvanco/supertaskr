//! Gitignore-subset glob matching for component `paths`.
//!
//! DELIBERATE MIRROR, not a fork. `app/src/lib/architecture/glob.ts`
//! (T-011) is the reference implementation and stays the one the app
//! renders from; this is the same documented subset in Rust so the
//! binary's `arch` answers what the app answers. The semantics below are
//! transcribed rule for rule from that file's header, and the agreement
//! is MEASURED, not assumed: `tests/arch.rs` runs this matcher over the
//! live registry and the committed graph and reproduces the file→
//! component mapping the TypeScript engine pins in
//! `app/test/architecture-dogfood.test.ts`.
//!
//! Supported subset (each rule unit-tested below):
//! - matched against root-relative POSIX paths;
//! - leading `./` and `/` stripped; a pattern is root-anchored when it
//!   contains a `/`;
//! - `*` matches a run within one segment (never `/`), `?` one character;
//! - `**` as a whole segment matches zero or more segments, except in
//!   final position where it matches one or more (`a/**` != `a`);
//! - a fully consumed pattern with path left over claims the subtree
//!   (`app/test` claims `app/test/x.ts`);
//! - trailing `/` makes the pattern directory-only;
//! - a pattern with no `/` is unanchored and matched against every
//!   segment (`*.ts` at any depth, bare `dist` claims a `dist/` dir);
//! - `!pattern` negates, LAST match wins within one component's list;
//! - character classes, brace expansion and backslash escapes are NOT
//!   supported and are treated as literal characters (none appear in the
//!   live registry);
//! - byte-exact and case-sensitive.
//!
//! No regexes anywhere: hostile pattern text cannot smuggle
//! metacharacters or trigger pathological backtracking.
//!
//! One transcription note the TS file cannot have: JavaScript iterates
//! UTF-16 code units and this iterates Unicode scalar values. The two
//! agree on everything except astral-plane characters inside a `?`
//! pattern (one `?` here, two there). No committed pattern or path
//! contains one, and the difference cannot change a claim for any
//! wildcard-free or `*`-only pattern — which is the entire live registry.

/// Match one glob segment (no `/`): `*` any run, `?` one char, else
/// literal. Iterative with backtracking on the last `*` — linear space,
/// no recursion, no regex.
pub(crate) fn match_segment(pattern: &str, text: &str) -> bool {
    let pat: Vec<char> = pattern.chars().collect();
    let txt: Vec<char> = text.chars().collect();
    let (mut p, mut t) = (0usize, 0usize);
    let mut star_p: Option<usize> = None;
    let mut star_t = 0usize;
    while t < txt.len() {
        if p < pat.len() && (pat[p] == txt[t] || pat[p] == '?') {
            p += 1;
            t += 1;
        } else if p < pat.len() && pat[p] == '*' {
            star_p = Some(p);
            star_t = t;
            p += 1;
        } else if let Some(sp) = star_p {
            p = sp + 1;
            star_t += 1;
            t = star_t;
        } else {
            return false;
        }
    }
    while p < pat.len() && pat[p] == '*' {
        p += 1;
    }
    p == pat.len()
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Claim {
    /// The pattern consumed the whole path.
    File,
    /// The pattern consumed a proper prefix at a segment boundary — the
    /// gitignore directory claim.
    Dir,
}

struct Compiled {
    negated: bool,
    dir_only: bool,
    unanchored: bool,
    segments: Vec<String>,
}

fn compile(raw: &str) -> Compiled {
    let mut pattern = raw;
    let mut negated = false;
    if let Some(rest) = pattern.strip_prefix('!') {
        negated = true;
        pattern = rest;
    }
    if let Some(rest) = pattern.strip_prefix("./") {
        pattern = rest;
    }
    if let Some(rest) = pattern.strip_prefix('/') {
        pattern = rest;
    }
    let mut dir_only = false;
    if let Some(rest) = pattern.strip_suffix('/') {
        dir_only = true;
        pattern = rest;
    }
    let segments: Vec<String> = pattern
        .split('/')
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .collect();
    let unanchored = segments.len() <= 1;
    Compiled {
        negated,
        dir_only,
        unanchored,
        segments,
    }
}

fn match_anchored(segments: &[String], path: &[&str]) -> Option<Claim> {
    let width = path.len() + 1;
    let mut memo: Vec<Option<Option<Claim>>> = vec![None; (segments.len() + 1) * width];
    go(segments, path, 0, 0, width, &mut memo)
}

fn go(
    segments: &[String],
    path: &[&str],
    i: usize,
    j: usize,
    width: usize,
    memo: &mut Vec<Option<Option<Claim>>>,
) -> Option<Claim> {
    let key = i * width + j;
    if let Some(hit) = memo[key] {
        return hit;
    }
    let result = if i == segments.len() {
        // Pattern consumed: exact file match, or a directory claim of the rest.
        Some(if j == path.len() { Claim::File } else { Claim::Dir })
    } else if segments[i] == "**" {
        if i == segments.len() - 1 {
            // Final `**` needs at least one remaining segment (a/** != a).
            // With two or more remaining it stops early on a directory.
            if j >= path.len() {
                None
            } else if path.len() - j >= 2 {
                Some(Claim::Dir)
            } else {
                Some(Claim::File)
            }
        } else {
            let skip = go(segments, path, i + 1, j, width, memo);
            let consume = if skip == Some(Claim::Dir) || j >= path.len() {
                None
            } else {
                go(segments, path, i, j + 1, width, memo)
            };
            if skip == Some(Claim::Dir) || consume == Some(Claim::Dir) {
                Some(Claim::Dir)
            } else {
                skip.or(consume)
            }
        }
    } else if j == path.len() {
        None
    } else if match_segment(&segments[i], path[j]) {
        go(segments, path, i + 1, j + 1, width, memo)
    } else {
        None
    };
    memo[key] = Some(result);
    result
}

fn path_segments(path: &str) -> Vec<&str> {
    let mut p = path;
    if let Some(rest) = p.strip_prefix("./") {
        p = rest;
    }
    while let Some(rest) = p.strip_prefix('/') {
        p = rest;
    }
    p.split('/').filter(|s| !s.is_empty()).collect()
}

fn pattern_hits(pattern: &Compiled, path: &[&str]) -> bool {
    if pattern.segments.is_empty() {
        return false; // an empty pattern is inert
    }
    if pattern.unanchored {
        let segment = &pattern.segments[0];
        let last = path.len().saturating_sub(1);
        for (i, part) in path.iter().enumerate() {
            if !match_segment(segment, part) {
                continue;
            }
            if i < last {
                return true; // matched a directory on the way down
            }
            return !pattern.dir_only; // matched the filename itself
        }
        return false;
    }
    match match_anchored(&pattern.segments, path) {
        None => false,
        Some(Claim::File) => !pattern.dir_only,
        Some(Claim::Dir) => true,
    }
}

/// Does this ordered pattern list claim the path? Last match wins.
pub(crate) fn claims_path(patterns: &[String], path: &str) -> bool {
    let segments = path_segments(path);
    if segments.is_empty() {
        return false;
    }
    let mut verdict = false;
    for raw in patterns {
        let pattern = compile(raw);
        if pattern_hits(&pattern, &segments) {
            verdict = !pattern.negated;
        }
    }
    verdict
}

/// The pattern text that decided a claim (the LAST positively matching
/// one), or `None`. Names the declared text behind an ambiguity.
pub(crate) fn claiming_pattern(patterns: &[String], path: &str) -> Option<String> {
    let segments = path_segments(path);
    if segments.is_empty() {
        return None;
    }
    let mut winner: Option<String> = None;
    for raw in patterns {
        let pattern = compile(raw);
        if pattern_hits(&pattern, &segments) {
            winner = if pattern.negated {
                None
            } else {
                Some(raw.clone())
            };
        }
    }
    winner
}

/// A name no committed pattern literal can equal, so only wildcard
/// segments or ancestor directory claims can match it.
const OWNERSHIP_PROBE: &str = "\u{0}";

/// Would this pattern list claim files created inside directory `dir`?
/// The package.path join (T-009 plan §6.6): a package node whose
/// repo-internal `path` names a directory belongs to the component that
/// would own that directory's files. `lib/parser/**` owns `lib/parser`;
/// the literal `app/index.html` owns no directory.
pub(crate) fn claims_dir_contents(patterns: &[String], dir: &str) -> bool {
    let segments = path_segments(dir);
    if segments.is_empty() {
        return false;
    }
    let mut probe: Vec<&str> = segments;
    probe.push(OWNERSHIP_PROBE);
    claims_path(patterns, &probe.join("/"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pats(list: &[&str]) -> Vec<String> {
        list.iter().map(|s| (*s).to_string()).collect()
    }

    #[test]
    fn segment_matching_handles_star_question_and_literals() {
        assert!(match_segment("*.ts", "board.ts"));
        assert!(!match_segment("*.ts", "board.tsx"));
        assert!(match_segment("a?c", "abc"));
        assert!(!match_segment("a?c", "ac"));
        assert!(match_segment("*", ""));
        assert!(match_segment("**", "anything"));
        assert!(match_segment("a*b*c", "azzbzzc"));
        assert!(!match_segment("a*b*c", "azzbzz"));
        // Classes and braces are literal, not syntax.
        assert!(match_segment("[abc].ts", "[abc].ts"));
        assert!(!match_segment("[abc].ts", "a.ts"));
    }

    #[test]
    fn double_star_is_zero_or_more_except_terminal_which_is_one_or_more() {
        assert!(claims_path(&pats(&["app/test/**"]), "app/test/x.ts"));
        assert!(claims_path(&pats(&["app/test/**"]), "app/test/deep/x.ts"));
        // The gitignore rule the whole umbrella rests on: a/** != a.
        assert!(!claims_path(&pats(&["app/test/**"]), "app/test"));
        // Non-terminal `**` spans zero segments.
        assert!(claims_path(&pats(&["app/**/x.ts"]), "app/x.ts"));
        assert!(claims_path(&pats(&["app/**/x.ts"]), "app/a/b/x.ts"));
    }

    #[test]
    fn a_consumed_pattern_claims_the_subtree_and_dir_only_refuses_the_file() {
        assert!(claims_path(&pats(&["app/test"]), "app/test/x.ts"));
        assert!(claims_path(&pats(&["app/test"]), "app/test"));
        assert!(claims_path(&pats(&["app/test/"]), "app/test/x.ts"));
        assert!(!claims_path(&pats(&["app/test/"]), "app/test"));
    }

    #[test]
    fn a_slashless_pattern_is_unanchored_at_every_depth() {
        assert!(claims_path(&pats(&["*.ts"]), "deep/inside/x.ts"));
        assert!(claims_path(&pats(&["dist"]), "app/dist/bundle.js"));
        assert!(claims_path(&pats(&["dist"]), "dist"));
        assert!(!claims_path(&pats(&["dist/"]), "dist"));
        assert!(!claims_path(&pats(&["*.ts"]), "x.tsx"));
    }

    #[test]
    fn negation_is_last_match_wins() {
        assert!(!claims_path(&pats(&["app/**", "!app/skip/**"]), "app/skip/x.ts"));
        assert!(claims_path(&pats(&["app/**", "!app/skip/**"]), "app/keep/x.ts"));
        // Order matters: re-including after excluding.
        assert!(claims_path(
            &pats(&["app/**", "!app/skip/**", "app/skip/keep.ts"]),
            "app/skip/keep.ts"
        ));
    }

    #[test]
    fn literal_prefixes_do_not_leak_into_adjacent_names() {
        assert!(!claims_path(&pats(&["app/test/**"]), "app/testing/x.ts"));
        assert!(!claims_path(&pats(&["app/src/lib/utils.ts"]), "app/src/lib/utils.tsx"));
    }

    #[test]
    fn dir_ownership_needs_a_wildcard_or_ancestor_claim() {
        // The live seam: C-06 owns lib/parser through `lib/parser/**`.
        assert!(claims_dir_contents(&pats(&["lib/parser/**"]), "lib/parser"));
        // A literal file pattern owns no directory.
        assert!(!claims_dir_contents(&pats(&["app/index.html"]), "app"));
        // Adjacency does not leak.
        assert!(!claims_dir_contents(&pats(&["lib/parser/**"]), "lib/parse"));
        // A negated carve-out disowns the directory again.
        assert!(!claims_dir_contents(
            &pats(&["lib/**", "!lib/parser/**"]),
            "lib/parser"
        ));
    }

    #[test]
    fn the_claiming_pattern_names_the_declared_text_that_decided() {
        assert_eq!(
            claiming_pattern(&pats(&["app/**", "app/test/**"]), "app/test/x.ts"),
            Some("app/test/**".to_string())
        );
        assert_eq!(
            claiming_pattern(&pats(&["app/**", "!app/test/**"]), "app/test/x.ts"),
            None
        );
    }

    #[test]
    fn hostile_and_degenerate_inputs_are_inert_never_panics() {
        assert!(!claims_path(&pats(&[""]), "a.ts"));
        assert!(!claims_path(&pats(&["a.ts"]), ""));
        assert!(!claims_path(&pats(&[]), "a.ts"));
        assert!(claims_path(&pats(&["a//b"]), "a/b"), "empty segments collapse");
        assert!(claims_path(&pats(&["./app/**"]), "app/x.ts"));
        assert!(claims_path(&pats(&["/app/**"]), "app/x.ts"));
        // A pathological star run must not blow up (no backtracking bomb).
        let bomb = "*".repeat(64) + "z";
        assert!(!match_segment(&bomb, &"a".repeat(2000)));
    }
}
