//! Per-language extractor contract + shared types (plan §5).
//!
//! An extractor turns one parsed file into an `ExtractRecord`: module-scope
//! symbols, import specifiers (with imported names), and call/type_ref
//! candidates. Records are pre-resolution and cacheable per file;
//! resolution is global and always re-runs (plan §4).
//!
//! T-009 ships the TS/JS extractor; T-010 adds the Rust one.

use serde::{Deserialize, Serialize};
use tree_sitter::Tree;

use crate::graph::DepthSite;

pub(crate) mod rust;
pub(crate) mod ts;

/// The depth ceiling every self-recursive traversal in this module tree
/// carries (T-129). A traversal entered deeper than this REFUSES: it
/// returns without descending, records the [`DepthSite`] that refused,
/// and lets everything shallower stand.
///
/// WHY A BOUND AND NOT A BIGGER STACK. A Rust stack overflow is an
/// `abort()`, not a catchable panic — no `catch_unwind` helps and no
/// error path runs — and `index()` runs INSIDE the Tauri app's process
/// behind `index_repo`, so an overflow takes the window, the docs
/// watcher, the agent runner and any interview mid-turn with it. Running
/// the walk on a thread with a bigger explicit stack (T-129's arm 2) was
/// RULED ON AND NOT TAKEN: it moves a threshold where this removes one,
/// it makes the crate's answer depend on a machine property rather than
/// on its input (against ADR-014), and after this bound exists nothing
/// can reach the bigger stack, so the code would be unreachable and its
/// test vacuous. See the task card for the whole ruling.
///
/// WHY THIS NUMBER — it is the point where two measured margins meet,
/// both taken at `ae16fbe` on this machine and both in the task's
/// implementation notes.
///
/// FROM BELOW: the deepest traversal any file in this repository reaches
/// is **36** (`app/src/architecture/MapView.tsx`, the candidate scan),
/// derived by bisecting this constant against the live tree — 35 flags
/// that file, 36 flags nothing. 128 is 3.5x that, so no committed byte
/// moves and no plausible hand-written file is refused.
///
/// FROM ABOVE: these traversals NEST — `declarations` does not unwind
/// before it calls `use_declaration`, which does not unwind before
/// `use_tree`, which does not unwind before `collect_segments` — so the
/// worst legal stack is three ceilings at once, and it is a CONSTANT
/// rather than a function of the input, which is the whole of what the
/// bound buys. Measured on a debug build it needs between **512 KiB and
/// 640 KiB** (128–192 KiB on release), against the **2 MiB** a plain
/// `std::thread` gets and the 8 MiB of this platform's main thread:
/// **~3.2x margin on the smallest stack this crate can plausibly be
/// handed**, pinned by `tests/depth.rs`.
///
/// RAISING IT TRADES THE SECOND MARGIN FOR THE FIRST, and the two
/// failures are not symmetric: refusing a legitimate file DEGRADES and
/// is recorded, overflowing ABORTS the app. 256 was measured too — 7.1x
/// from below, ~1 MiB and only ~2x from above — and rejected for exactly
/// that reason. Move this constant and the boundary bodies in
/// `extract/{rust,ts}.rs` red by name; they carry literals on both sides
/// so that they cannot follow it in silence.
pub(crate) const MAX_DEPTH: usize = 128;

/// One file's extraction output. Everything here is deterministic in the
/// file's bytes: symbols sorted by name (post-merge), imports in document
/// order, candidates sorted + deduped.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub(crate) struct ExtractRecord {
    pub symbols: Vec<RawSymbol>,
    pub imports: Vec<RawImport>,
    pub calls: Vec<Candidate>,
    pub type_refs: Vec<Candidate>,
    /// Rust only (T-010): the `mod` declarations this file makes, in
    /// document order. Empty for TS/JS, so a cache written before T-010
    /// still deserializes — and could only hold TS/JS entries anyway,
    /// because `.rs` was not a walked extension until this task.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub mods: Vec<RawMod>,
    /// The traversal that refused past [`MAX_DEPTH`], when one did
    /// (T-129) — FIRST refusal wins, and traversal order is document
    /// order, so the value is content-determined like everything else
    /// here. `None` for every file that extracted in full. Carried
    /// through the cache the way `mods` is: a cache written before T-129
    /// still deserializes, because the field defaults.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub depth_refused: Option<DepthSite>,
}

/// One `mod` declaration inside a Rust file (T-010) — the edge of the
/// module tree the resolver walks.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub(crate) struct RawMod {
    /// The INLINE module path this declaration sits under inside its own
    /// file (`[]` at file level, `["tests"]` inside `mod tests { … }`).
    pub inside: Vec<String>,
    pub name: String,
    /// `#[path = "…"]` verbatim, when the declaration carries one.
    pub file: Option<String>,
    /// `mod x { … }` — the module's items live in THIS file, so the
    /// module path maps back to the declaring file.
    pub inline: bool,
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
