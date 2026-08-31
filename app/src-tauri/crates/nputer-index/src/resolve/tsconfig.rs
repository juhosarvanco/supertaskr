//! Nearest-tsconfig discovery + JSONC read (plan §6.4).
//!
//! Exact filename only — `tsconfig.node.json` etc. never participate.
//! Search stops at the root; the per-directory result is memoized. A
//! tsconfig that fails even JSONC parsing is treated as absent (the
//! search continues up; any alias miss then surfaces loudly as
//! `not_found`) — accepted v1 silence, T-014's report is the future home.
//!
//! Reads follow the containment discipline: symlinked or out-of-root
//! config files are ignored, never read.

use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::rc::Rc;

use super::{parent_dir_of, read_contained};
use crate::resolve::ts::normalize_join;

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct TsconfigData {
    /// Root-relative POSIX dir of the tsconfig file ("" = root).
    pub dir: String,
    /// Normalized root-relative baseUrl dir. Absent when unset, when it
    /// escapes the root, or when it is an absolute path (machine-local).
    pub base_url: Option<String>,
    /// Sorted by pattern text — iteration order never depends on
    /// serde_json map internals (feature-unification proofing).
    pub paths: Vec<PathsPattern>,
}

#[derive(Clone, Debug, PartialEq)]
pub(crate) struct PathsPattern {
    pub pattern: String,
    pub targets: Vec<String>,
}

pub(crate) struct TsconfigIndex {
    root: PathBuf,
    memo: BTreeMap<String, Option<Rc<TsconfigData>>>,
}

impl TsconfigIndex {
    pub(crate) fn new(root: &Path) -> Self {
        Self {
            root: root.to_path_buf(),
            memo: BTreeMap::new(),
        }
    }

    /// The nearest tsconfig.json at or above `dir` (root-relative POSIX,
    /// "" = root), memoized per directory.
    pub(crate) fn nearest(&mut self, dir: &str) -> Option<Rc<TsconfigData>> {
        if let Some(hit) = self.memo.get(dir) {
            return hit.clone();
        }
        let own = read_contained(&self.root, dir, "tsconfig.json")
            .and_then(|text| parse_tsconfig(&text, dir));
        let result = match own {
            Some(data) => Some(Rc::new(data)),
            None => parent_dir_of_owned(dir).and_then(|parent| self.nearest(&parent)),
        };
        self.memo.insert(dir.to_string(), result.clone());
        result
    }
}

fn parent_dir_of_owned(dir: &str) -> Option<String> {
    if dir.is_empty() {
        None
    } else {
        Some(parent_dir_of(dir).to_string())
    }
}

/// JSONC-tolerant parse (comments + trailing commas — the live app
/// tsconfig has comments today). Returns None only when the text fails
/// even JSONC parsing (treated as absent).
fn parse_tsconfig(text: &str, dir: &str) -> Option<TsconfigData> {
    let value: serde_json::Value =
        jsonc_parser::parse_to_serde_value(text, &Default::default()).ok()?;
    let mut data = TsconfigData {
        dir: dir.to_string(),
        base_url: None,
        paths: Vec::new(),
    };
    if let Some(options) = value.get("compilerOptions").and_then(|v| v.as_object()) {
        if let Some(base_url) = options.get("baseUrl").and_then(|v| v.as_str()) {
            if !base_url.starts_with('/') {
                // Escaping baseUrl -> None (containment holds symbolically).
                data.base_url = normalize_join(dir, base_url);
            }
        }
        if let Some(paths) = options.get("paths").and_then(|v| v.as_object()) {
            for (pattern, targets) in paths {
                let targets: Vec<String> = targets
                    .as_array()
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|t| t.as_str().map(str::to_string))
                            .collect()
                    })
                    .unwrap_or_default();
                data.paths.push(PathsPattern {
                    pattern: pattern.clone(),
                    targets,
                });
            }
            // Deterministic regardless of map implementation order.
            data.paths.sort_by(|a, b| a.pattern.cmp(&b.pattern));
        }
    }
    Some(data)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testutil::TempTree;

    fn canon(t: &TempTree) -> PathBuf {
        t.root().canonicalize().expect("canon")
    }

    #[test]
    fn jsonc_comments_and_trailing_commas_parse() {
        let t = TempTree::new("tsc-jsonc");
        t.write(
            "tsconfig.json",
            r#"{
  /* block comment */
  "compilerOptions": {
    // line comment
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
    },
  },
}"#,
        );
        let mut idx = TsconfigIndex::new(&canon(&t));
        let cfg = idx.nearest("").expect("config found");
        assert_eq!(cfg.dir, "");
        assert_eq!(cfg.base_url.as_deref(), Some(""));
        assert_eq!(cfg.paths.len(), 1);
        assert_eq!(cfg.paths[0].pattern, "@/*");
        assert_eq!(cfg.paths[0].targets, vec!["./src/*"]);
    }

    #[test]
    fn nearest_wins_and_search_stops_at_root() {
        let t = TempTree::new("tsc-nearest");
        t.write("tsconfig.json", r#"{ "compilerOptions": { "baseUrl": "." } }"#);
        t.write(
            "nested/tsconfig.json",
            r#"{ "compilerOptions": { "paths": { "lib/*": ["./local/*"] } } }"#,
        );
        let mut idx = TsconfigIndex::new(&canon(&t));
        let nested = idx.nearest("nested/deep").expect("nested config");
        assert_eq!(nested.dir, "nested");
        assert!(nested.base_url.is_none()); // paths without baseUrl
        let root = idx.nearest("src").expect("root config");
        assert_eq!(root.dir, "");
        // Memoized: same Rc back.
        let again = idx.nearest("nested/deep").expect("memo");
        assert!(Rc::ptr_eq(&nested, &again));
    }

    #[test]
    fn exact_filename_only_and_malformed_is_absent() {
        let t = TempTree::new("tsc-exact");
        t.write("tsconfig.node.json", r#"{ "compilerOptions": {} }"#);
        t.write("sub/tsconfig.json", "{ this is not even jsonc ::: ");
        let mut idx = TsconfigIndex::new(&canon(&t));
        // tsconfig.node.json never participates; the malformed sub config
        // is treated as absent -> nothing found anywhere.
        assert!(idx.nearest("sub").is_none());
        assert!(idx.nearest("").is_none());
    }

    #[test]
    fn valid_tsconfig_without_compiler_options_still_stops_the_search() {
        let t = TempTree::new("tsc-empty");
        t.write("tsconfig.json", r#"{ "compilerOptions": { "baseUrl": "." } }"#);
        t.write("sub/tsconfig.json", "{}");
        let mut idx = TsconfigIndex::new(&canon(&t));
        let sub = idx.nearest("sub").expect("sub config");
        assert_eq!(sub.dir, "sub");
        assert!(sub.base_url.is_none());
        assert!(sub.paths.is_empty());
    }

    #[test]
    fn absolute_and_escaping_base_urls_are_ignored() {
        let t = TempTree::new("tsc-baseurl");
        t.write(
            "a/tsconfig.json",
            r#"{ "compilerOptions": { "baseUrl": "../../.." } }"#,
        );
        t.write(
            "b/tsconfig.json",
            r#"{ "compilerOptions": { "baseUrl": "/etc" } }"#,
        );
        let mut idx = TsconfigIndex::new(&canon(&t));
        assert!(idx.nearest("a").expect("a").base_url.is_none());
        assert!(idx.nearest("b").expect("b").base_url.is_none());
    }

    /// **WHAT THIS BODY ACTUALLY PINS IS CONTAINMENT, NOT THE LINK
    /// CLASSIFICATION** (`T-194`, measured).
    ///
    /// The link is aimed at a SECOND `TempTree`, so the target
    /// canonicalizes OUT of the root and `read_contained` refuses it TWICE
    /// OVER — once at the link classification, once at
    /// `canon.starts_with(root)`. **Measured, all three arms** (`T-194`):
    ///
    /// - classification (`is_symlink() || !meta.is_file()`) lifted: **GREEN**
    /// - containment (`starts_with`) lifted: **GREEN**
    /// - BOTH lifted: **REDS**
    ///
    /// So this body is NOT vacuous — it reds on a three-predicate lift —
    /// but it can distinguish **neither** mechanism, because either one
    /// suffices on its own. It pins the disjunction and can name no part
    /// of it, which is why a reader takes its name for a claim about the
    /// link check and gets nothing of the sort.
    ///
    /// **The obvious summary of this is wrong and was measured before it
    /// was written**: *"containment alone produces its green"* is what
    /// this lane first wrote down, and lifting containment alone leaves
    /// the body GREEN, so containment is not what produces it either.
    /// `T-140-s9` met this instrument defect in `docs_watch.rs` and
    /// `T-186` in `walk_root`; this is the third sighting and the most
    /// thoroughly shadowed of the three.
    ///
    /// **The name is KEPT deliberately.** `T-140-s9`'s ruling 4 applies:
    /// cards outside this fence cite it by name (`T-186`, `T-194`) and a
    /// rename strands those references, so the body says at its site what
    /// it asserts — the OUTCOME, not the layer.
    ///
    /// The body that DOES pin the classification is
    /// `resolve::tests::an_inside_pointing_symlink_is_refused_by_the_link_classification`,
    /// whose link canonicalizes INSIDE the root so containment cannot
    /// rescue it.
    #[cfg(unix)]
    #[test]
    fn symlinked_tsconfig_is_never_read() {
        use std::os::unix::fs::symlink;
        let t = TempTree::new("tsc-symlink");
        let outside = TempTree::new("tsc-symlink-outside");
        outside.write(
            "tsconfig.json",
            r#"{ "compilerOptions": { "paths": { "evil/*": ["./secret/*"] } } }"#,
        );
        symlink(
            outside.root().join("tsconfig.json"),
            t.root().join("tsconfig.json"),
        )
        .expect("symlink");
        let mut idx = TsconfigIndex::new(&canon(&t));
        assert!(idx.nearest("").is_none());
    }
}
