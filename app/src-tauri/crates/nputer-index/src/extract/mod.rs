//! Per-language extractor contract + shared types (plan §5).
//!
//! An extractor turns one parsed file into an `ExtractRecord`: module-scope
//! symbols, import specifiers (with imported names), and call/type_ref
//! candidates. Records are pre-resolution and cacheable per file;
//! resolution is global and always re-runs (plan §4).
//!
//! T-010 implements [`Extractor`] for Rust; T-009 ships the TS/JS one.

use serde::{Deserialize, Serialize};
use tree_sitter::Tree;

pub(crate) mod ts;

/// One file's extraction output. Everything here is deterministic in the
/// file's bytes: symbols sorted by name (post-merge), imports in document
/// order, candidates sorted + deduped.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub(crate) struct ExtractRecord {
    pub symbols: Vec<RawSymbol>,
    pub imports: Vec<RawImport>,
    pub calls: Vec<Candidate>,
    pub type_refs: Vec<Candidate>,
}

/// A module-scope declaration, post-merge (TS declaration merging: names
/// are unique per file by construction).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub(crate) struct RawSymbol {
    pub name: String,
    /// function | class | interface | type | enum | const.
    pub kind: String,
    pub exported: bool,
    /// 1-based inclusive rows; merged: [min start, max end].
    pub range: [usize; 2],
}

/// One import occurrence (static import, `export … from`, string-literal
/// `require(…)` or string-literal dynamic `import(…)`).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub(crate) struct RawImport {
    /// As written in source (quotes stripped, nothing else touched).
    pub specifier: String,
    /// Imported names; empty for side-effect imports.
    pub names: Vec<NameBinding>,
    /// True for `export … from` / `export * from` occurrences.
    pub reexport: bool,
}

/// One imported name: `source` is the name as written at the target
/// ("default" for default imports, "*" for namespaces), `local` the
/// binding it creates in the importing file (None for re-exports, which
/// bind nothing locally).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub(crate) struct NameBinding {
    pub source: String,
    pub local: Option<String>,
}

/// A call/type_ref candidate: a bare name observed inside the span of a
/// module-level symbol (`enclosing`). Emission is gated at resolution
/// (plan §6): only names that bind become edges, always
/// `confidence: "resolved"`.
#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub(crate) struct Candidate {
    pub enclosing: String,
    pub name: String,
}

/// The per-language extractor contract (plan §5) — T-010 adds the Rust
/// implementation.
pub(crate) trait Extractor {
    fn extract(&self, source: &str, tree: &Tree) -> ExtractRecord;
}
