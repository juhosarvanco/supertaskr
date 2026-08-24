//! Schema types (plan §3.1 as revised by §7), the id scheme, and sort
//! comparators.
//!
//! Serialization contract: struct field declaration order IS the emitted
//! key order (serde serializes in declaration order), matching §3.1's
//! layout exactly — `schema, root, languages, files, packages, edges,
//! unresolved, stats`. Optional fields are omitted (never null) when
//! absent/empty/false. All sorting is byte-lexicographic `String` `Ord`
//! (locale-free).
//!
//! Id grammar, for consumers:
//! - `f:<path>`      — file, path root-relative POSIX.
//! - `s:<path>#<name>` — symbol. Paths may legally contain `#`, so split
//!   `s:` ids on the LAST `#`. Post-merge names are unique per file, so
//!   symbol ids never collide by construction.
//! - `p:<package>`   — external package.
//!
//! Ids are content-free (path + name), so re-index diffs read as
//! "edge added/removed", never churn.

use serde::{Deserialize, Serialize};

/// Languages the indexer can be asked to collect. T-010 registered the
/// Rust extractor, so `Rust` maps to `.rs` and is collected by default —
/// it was a schema-stability placeholder from T-009 until then.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum Lang {
    Ts,
    Js,
    Rust,
}

impl Lang {
    pub fn as_str(&self) -> &'static str {
        match self {
            Lang::Ts => "ts",
            Lang::Js => "js",
            Lang::Rust => "rust",
        }
    }

    /// File-type allowlist (plan §3, the §5.1 list verbatim, plus `.rs`
    /// since T-010). `.mjs`/`.cjs` are deliberately excluded — an import
    /// of one lands in `unresolved[]` rather than vanishing.
    pub(crate) fn for_extension(ext: &str) -> Option<Lang> {
        match ext {
            "ts" | "tsx" | "mts" | "cts" => Some(Lang::Ts),
            "js" | "jsx" => Some(Lang::Js),
            "rs" => Some(Lang::Rust),
            _ => None,
        }
    }
}

/// The whole committed payload. `root` is always `"."`; volatile fields
/// (commit sha, timings, absolute paths, cache identity) are omitted by
/// construction (ADR-014).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Graph {
    pub schema: u32,
    pub root: String,
    /// Distinct `lang` values of the emitted files, sorted — derived from
    /// content, not from configuration (an enabled language with zero
    /// files present does not appear).
    pub languages: Vec<String>,
    pub files: Vec<FileEntry>,
    pub packages: Vec<Package>,
    pub edges: Vec<Edge>,
    pub unresolved: Vec<Unresolved>,
    pub stats: Stats,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct FileEntry {
    pub id: String,
    pub path: String,
    pub lang: String,
    /// `"blake3:" + 64 lowercase hex` over the raw file bytes.
    pub hash: String,
    pub loc: usize,
    /// Sorted by name; emptied (never omitted) under budget truncation.
    pub symbols: Vec<Symbol>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Symbol {
    pub id: String,
    pub name: String,
    /// TS kinds emitted here: function | class | interface | type | enum
    /// | const (module-scope let/var and namespaces fold into `const`;
    /// the §3.1 kind vocabulary is closed).
    pub kind: String,
    pub exported: bool,
    /// 1-based inclusive [start, end] rows of the declaration node
    /// (post-merge: [min start, max end] across declarations).
    pub range: [usize; 2],
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Package {
    pub id: String,
    pub name: String,
    /// "npm", or "node" for `node:`-prefixed builtins.
    pub ecosystem: String,
    /// Repo-relative target of a `file:`/`link:` dependency that lands
    /// inside the root (plan §6.6) — the seam T-011 joins on.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Edge {
    pub from: String,
    pub to: String,
    /// "import" | "call" | "type_ref".
    pub kind: String,
    /// Imported source names (sorted unique): named imports as written,
    /// default import -> "default", namespace -> "*"; absent for
    /// side-effect imports.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub symbols: Option<Vec<String>>,
    /// Present (true) only when ALL merged occurrences are re-exports.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reexport: Option<bool>,
    /// On call/type_ref edges only; T-009 emits "resolved" exclusively.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub confidence: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Unresolved {
    pub from: String,
    /// The specifier as written in source (query suffix and all).
    pub specifier: String,
    /// Closed taxonomy (plan §6.8): not_found | outside_root |
    /// unsupported | asset.
    pub reason: String,
}

/// Content-determined values only (ADR-014). Optional members are omitted
/// when 0/false — visible only when they carry information.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Stats {
    pub files: usize,
    pub symbols: usize,
    pub edges: usize,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub truncated_symbols: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub truncated_files: Option<usize>,
    /// Files skipped for mechanical unreadability (io error, non-UTF-8,
    /// over the per-file parse cap) — counted, never silent (plan §3).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub skipped: Option<usize>,
}

pub(crate) fn file_id(path: &str) -> String {
    format!("f:{path}")
}

pub(crate) fn symbol_id(path: &str, name: &str) -> String {
    format!("s:{path}#{name}")
}

pub(crate) fn package_id(name: &str) -> String {
    format!("p:{name}")
}

/// The `<path>` of an `s:` id — split on the LAST `#` (paths may contain
/// `#`; names cannot, post-merge names are identifiers).
pub(crate) fn symbol_id_path(id: &str) -> Option<&str> {
    id.strip_prefix("s:")?.rsplit_once('#').map(|(p, _)| p)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ids_compose_and_symbol_path_splits_on_last_hash() {
        assert_eq!(file_id("src/a.ts"), "f:src/a.ts");
        assert_eq!(symbol_id("src/a.ts", "Board"), "s:src/a.ts#Board");
        assert_eq!(package_id("@scope/pkg"), "p:@scope/pkg");
        // A path that legally contains '#': split on the LAST '#'.
        assert_eq!(
            symbol_id_path("s:src/we#ird/x.ts#Name"),
            Some("src/we#ird/x.ts")
        );
        assert_eq!(symbol_id_path("f:src/a.ts"), None);
    }

    #[test]
    fn lang_extension_allowlist_is_exact() {
        for (ext, lang) in [
            ("ts", Lang::Ts),
            ("tsx", Lang::Ts),
            ("mts", Lang::Ts),
            ("cts", Lang::Ts),
            ("js", Lang::Js),
            ("jsx", Lang::Js),
            ("rs", Lang::Rust),
        ] {
            assert_eq!(Lang::for_extension(ext), Some(lang), "{ext}");
        }
        // .mjs/.cjs excluded; matching is byte-exact (no case folding).
        for ext in ["mjs", "cjs", "TS", "RS", "d", "json", "md", ""] {
            assert_eq!(Lang::for_extension(ext), None, "{ext}");
        }
    }
}
