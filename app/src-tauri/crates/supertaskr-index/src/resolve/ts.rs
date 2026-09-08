//! Pure TS/JS resolution machinery (plan §6): lexical path normalization,
//! the candidate order, paths-pattern matching, asset/unsupported gates,
//! and bare-specifier package parsing.
//!
//! Everything here is a pure function — candidate matching is byte-exact
//! membership in the walked set (deterministic on case-insensitive
//! filesystems, because the set — not the fs — answers).

use super::tsconfig::TsconfigData;

/// Extension try order for extensionless specifiers (the §5.1 list
/// verbatim); `.d.ts` is appended last, which makes ".d.ts preferred only
/// if no source sibling" positional, not special-cased.
const EXT_ORDER: [&str; 6] = ["ts", "tsx", "js", "jsx", "mts", "cts"];

/// Closed asset list (plan §6.2): these are `unresolved(asset)`, keeping
/// side-effect style imports out of `not_found`.
const ASSET_EXTS: [&str; 21] = [
    "css", "scss", "sass", "less", "json", "svg", "png", "jpg", "jpeg", "gif", "webp", "ico",
    "woff", "woff2", "ttf", "otf", "mp3", "mp4", "wasm", "txt", "md",
];

/// Strip a `?query` suffix (vite convention) before classification.
pub(crate) fn strip_query(spec: &str) -> &str {
    spec.split('?').next().unwrap_or(spec)
}

pub(crate) fn is_unsupported(spec: &str) -> bool {
    spec.starts_with('/')
        || spec.starts_with("http:")
        || spec.starts_with("https:")
        || spec.starts_with("data:")
}

pub(crate) fn is_relative(spec: &str) -> bool {
    spec == "." || spec == ".." || spec.starts_with("./") || spec.starts_with("../")
}

/// Extension of the last path segment ("" when none). A leading dot
/// (".env") is a filename, not an extension.
fn last_segment_ext(path: &str) -> &str {
    let seg = path.rsplit('/').next().unwrap_or(path);
    match seg.rfind('.') {
        Some(i) if i > 0 => &seg[i + 1..],
        _ => "",
    }
}

pub(crate) fn is_asset(spec: &str) -> bool {
    let ext = last_segment_ext(spec).to_ascii_lowercase();
    ASSET_EXTS.contains(&ext.as_str())
}

/// Lexically join `rel` onto root-relative `base_dir` ("" = root) and
/// normalize `.`/`..`. None when the result escapes the root —
/// containment holds symbolically too (plan §6.3).
pub(crate) fn normalize_join(base_dir: &str, rel: &str) -> Option<String> {
    let mut stack: Vec<&str> = base_dir.split('/').filter(|s| !s.is_empty()).collect();
    for seg in rel.split('/') {
        match seg {
            "" | "." => {}
            ".." => {
                if stack.pop().is_none() {
                    return None;
                }
            }
            s => stack.push(s),
        }
    }
    Some(stack.join("/"))
}

/// Relative candidate order (plan §6.7), also used for paths/baseUrl
/// targets. `base` is a normalized root-relative path.
pub(crate) fn candidates_for(base: &str) -> Vec<String> {
    let ext = last_segment_ext(base);
    let swap = |new_ext: &str| format!("{}{}", &base[..base.len() - ext.len()], new_ext);
    match ext {
        // Source substitution FIRST, then as-written (TS NodeNext
        // semantics; load-bearing for lib/parser's `./types.js` imports).
        "js" => vec![swap("ts"), swap("tsx"), base.to_string()],
        "jsx" => vec![swap("tsx"), base.to_string()],
        "mjs" => vec![swap("mts"), base.to_string()],
        "cjs" => vec![swap("cts"), base.to_string()],
        // As-written only (allowImportingTsExtensions).
        "ts" | "tsx" | "mts" | "cts" => vec![base.to_string()],
        _ => {
            let mut v = Vec::with_capacity(14);
            for e in EXT_ORDER {
                v.push(format!("{base}.{e}"));
            }
            v.push(format!("{base}.d.ts"));
            for e in EXT_ORDER {
                v.push(format!("{base}/index.{e}"));
            }
            v.push(format!("{base}/index.d.ts"));
            v
        }
    }
}

/// tsconfig `paths` matching (plan §6.4): exact (starless) patterns beat
/// single-`*` patterns; among `*` patterns the longest matched prefix
/// wins (ties: longest suffix, then pattern text asc). Returns the
/// normalized candidate bases in target array order; None when no
/// pattern matches at all.
pub(crate) fn match_paths(spec: &str, cfg: &TsconfigData) -> Option<Vec<String>> {
    let target_root = cfg.base_url.as_deref().unwrap_or(cfg.dir.as_str());
    // Exact patterns first.
    for p in &cfg.paths {
        if !p.pattern.contains('*') && p.pattern == spec {
            return Some(
                p.targets
                    .iter()
                    .filter_map(|t| normalize_join(target_root, t))
                    .collect(),
            );
        }
    }
    // Single-star patterns.
    let mut best: Option<(&str, &str, &Vec<String>)> = None; // (prefix, suffix, targets)
    for p in &cfg.paths {
        let Some((prefix, suffix)) = split_single_star(&p.pattern) else {
            continue;
        };
        if spec.len() >= prefix.len() + suffix.len()
            && spec.starts_with(prefix)
            && spec.ends_with(suffix)
        {
            let better = match best {
                None => true,
                Some((bp, bs, _)) => {
                    prefix.len() > bp.len() || (prefix.len() == bp.len() && suffix.len() > bs.len())
                }
            };
            // Iteration is in pattern-asc order (cfg.paths is sorted), so
            // full ties keep the first — pattern text asc.
            if better {
                best = Some((prefix, suffix, &p.targets));
            }
        }
    }
    best.map(|(prefix, suffix, targets)| {
        let matched = &spec[prefix.len()..spec.len() - suffix.len()];
        targets
            .iter()
            .filter_map(|t| normalize_join(target_root, &t.replacen('*', matched, 1)))
            .collect()
    })
}

fn split_single_star(pattern: &str) -> Option<(&str, &str)> {
    let mut parts = pattern.split('*');
    let prefix = parts.next()?;
    let suffix = parts.next()?;
    if parts.next().is_some() {
        return None; // more than one star: invalid, skipped
    }
    Some((prefix, suffix))
}

/// Bare specifier -> (package name, ecosystem). None for malformed bare
/// specifiers (empty, or a broken scope like "@/x") — those surface as
/// `not_found`, never as a false package node.
pub(crate) fn package_ref(spec: &str) -> Option<(String, String)> {
    if let Some(rest) = spec.strip_prefix("node:") {
        let first = rest.split('/').next().unwrap_or("");
        if first.is_empty() {
            return None;
        }
        // Name kept verbatim (`node:fs`); subpath dropped for identity.
        return Some((format!("node:{first}"), "node".to_string()));
    }
    if let Some(rest) = spec.strip_prefix('@') {
        let mut segments = rest.split('/');
        let scope = segments.next().unwrap_or("");
        let name = segments.next().unwrap_or("");
        if scope.is_empty() || name.is_empty() {
            return None;
        }
        return Some((format!("@{scope}/{name}"), "npm".to_string()));
    }
    let first = spec.split('/').next().unwrap_or("");
    if first.is_empty() {
        return None;
    }
    Some((first.to_string(), "npm".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::resolve::tsconfig::PathsPattern;

    #[test]
    fn strip_query_takes_everything_before_the_first_question_mark() {
        assert_eq!(strip_query("./x.svg?url"), "./x.svg");
        assert_eq!(strip_query("./x?a?b"), "./x");
        assert_eq!(strip_query("./x"), "./x");
    }

    #[test]
    fn unsupported_and_relative_classification() {
        for s in ["/abs/path", "http://x", "https://x", "data:text/js,1"] {
            assert!(is_unsupported(s), "{s}");
        }
        for s in ["./a", "../a", ".", ".."] {
            assert!(is_relative(s), "{s}");
        }
        for s in ["react", "@scope/pkg", "node:fs", "a/../b"] {
            assert!(!is_relative(s), "{s}");
            assert!(!is_unsupported(s), "{s}");
        }
    }

    #[test]
    fn asset_gate_is_extension_based_and_case_insensitive() {
        for s in ["./index.css", "./a/b.svg?url", "pkg/dist/style.css", "./X.PNG", "./notes.md"] {
            assert!(is_asset(strip_query(s)), "{s}");
        }
        for s in ["./index", "./x.ts", "./style.css.ts", "./.css", "react"] {
            assert!(!is_asset(strip_query(s)), "{s}");
        }
    }

    #[test]
    fn normalize_join_handles_dots_and_flags_escapes() {
        assert_eq!(normalize_join("src", "./x"), Some("src/x".to_string()));
        assert_eq!(normalize_join("src", "../x"), Some("x".to_string()));
        assert_eq!(normalize_join("a/b", "../../x"), Some("x".to_string()));
        assert_eq!(normalize_join("", "x/y"), Some("x/y".to_string()));
        assert_eq!(normalize_join("src", "."), Some("src".to_string()));
        assert_eq!(normalize_join("a", "b/./c//d"), Some("a/b/c/d".to_string()));
        assert_eq!(normalize_join("src", "../../x"), None);
        assert_eq!(normalize_join("", ".."), None);
    }

    #[test]
    fn candidate_order_substitutes_sources_first_for_js_specifiers() {
        assert_eq!(
            candidates_for("src/util.js"),
            vec!["src/util.ts", "src/util.tsx", "src/util.js"]
        );
        assert_eq!(candidates_for("a/v.jsx"), vec!["a/v.tsx", "a/v.jsx"]);
        assert_eq!(candidates_for("m.mjs"), vec!["m.mts", "m.mjs"]);
        assert_eq!(candidates_for("c.cjs"), vec!["c.cts", "c.cjs"]);
    }

    #[test]
    fn candidate_order_ts_extensions_are_as_written_only() {
        for base in ["a.ts", "a.tsx", "a.mts", "a.cts", "x/util.d.ts"] {
            assert_eq!(candidates_for(base), vec![base.to_string()], "{base}");
        }
    }

    #[test]
    fn candidate_order_extensionless_appends_then_indexes_dts_last() {
        assert_eq!(
            candidates_for("src/util"),
            vec![
                "src/util.ts",
                "src/util.tsx",
                "src/util.js",
                "src/util.jsx",
                "src/util.mts",
                "src/util.cts",
                "src/util.d.ts",
                "src/util/index.ts",
                "src/util/index.tsx",
                "src/util/index.js",
                "src/util/index.jsx",
                "src/util/index.mts",
                "src/util/index.cts",
                "src/util/index.d.ts",
            ]
        );
        // Unrecognized extension behaves as extensionless-with-suffix.
        assert_eq!(candidates_for("x.spec")[0], "x.spec.ts");
    }

    fn cfg(dir: &str, base_url: Option<&str>, patterns: &[(&str, &[&str])]) -> TsconfigData {
        let mut paths: Vec<PathsPattern> = patterns
            .iter()
            .map(|(p, ts)| PathsPattern {
                pattern: p.to_string(),
                targets: ts.iter().map(|t| t.to_string()).collect(),
            })
            .collect();
        paths.sort_by(|a, b| a.pattern.cmp(&b.pattern));
        TsconfigData {
            dir: dir.to_string(),
            base_url: base_url.map(str::to_string),
            paths,
        }
    }

    #[test]
    fn paths_exact_starless_beats_star_patterns() {
        let c = cfg(
            "",
            Some(""),
            &[("cfg", &["./src/config.ts"]), ("cf*", &["./src/wrong/*"])],
        );
        assert_eq!(
            match_paths("cfg", &c),
            Some(vec!["src/config.ts".to_string()])
        );
    }

    #[test]
    fn paths_longest_matched_prefix_wins_and_targets_keep_array_order() {
        let c = cfg(
            "",
            Some(""),
            &[
                ("m*", &["./wrongplace/*"]),
                ("multi/*", &["./missing/*", "./src/multi/*"]),
            ],
        );
        assert_eq!(
            match_paths("multi/thing", &c),
            Some(vec![
                "missing/thing".to_string(),
                "src/multi/thing".to_string()
            ])
        );
    }

    #[test]
    fn paths_root_at_base_url_or_tsconfig_dir_when_absent() {
        // baseUrl absent: targets root at the tsconfig's own dir (TS 5 rule).
        let c = cfg("nested", None, &[("lib/*", &["./local/*"])]);
        assert_eq!(
            match_paths("lib/thing", &c),
            Some(vec!["nested/local/thing".to_string()])
        );
        // baseUrl present: targets root there instead.
        let c2 = cfg("app", Some("app/base"), &[("lib/*", &["./local/*"])]);
        assert_eq!(
            match_paths("lib/thing", &c2),
            Some(vec!["app/base/local/thing".to_string()])
        );
    }

    #[test]
    fn paths_no_match_is_none_and_escaping_targets_drop_out() {
        let c = cfg("", Some(""), &[("@/*", &["../outside/*"])]);
        assert_eq!(match_paths("other", &c), None);
        // Matched pattern, escaping target: candidate list is empty
        // (falls through like an all-miss).
        assert_eq!(match_paths("@/x", &c), Some(vec![]));
    }

    #[test]
    fn paths_multiple_stars_are_invalid_and_skipped() {
        let c = cfg("", Some(""), &[("a*b*", &["./x/*"])]);
        assert_eq!(match_paths("a1b2", &c), None);
    }

    #[test]
    fn package_ref_parses_bare_scoped_subpath_and_node() {
        assert_eq!(
            package_ref("react"),
            Some(("react".to_string(), "npm".to_string()))
        );
        assert_eq!(
            package_ref("react-dom/client"),
            Some(("react-dom".to_string(), "npm".to_string()))
        );
        assert_eq!(
            package_ref("@scope/pkg/sub"),
            Some(("@scope/pkg".to_string(), "npm".to_string()))
        );
        assert_eq!(
            package_ref("node:fs"),
            Some(("node:fs".to_string(), "node".to_string()))
        );
        assert_eq!(
            package_ref("node:fs/promises"),
            Some(("node:fs".to_string(), "node".to_string()))
        );
    }

    #[test]
    fn package_ref_rejects_malformed_bare_specifiers() {
        for s in ["", "@", "@/x", "@scope", "@scope/", "node:", "/x"] {
            assert_eq!(package_ref(s), None, "{s}");
        }
    }
}
