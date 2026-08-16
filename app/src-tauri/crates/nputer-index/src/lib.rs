//! nputer-index (C-07): code -> docs/architecture/graph.json.
//!
//! Deterministic tree-sitter TS/JS indexer — same tree, byte-identical
//! output on any machine (ADR-014). No tauri dependency (ADR-015): used
//! by a thin Tauri command in T-012 and its own binary in T-014.
//!
//! Pipeline (plan §5.1): walk (ignore crate, contained) -> hash (blake3,
//! consult cache) -> parse (tree-sitter, per-dialect grammars) ->
//! extract (module-level symbols, imports, candidates) -> resolve
//! (pure, against the walked set) -> emit (stable serializer, budget).
//!
//! T-014 adds the binary the future Node CLI shells out to, and with it
//! three modes over the same pipeline: [`check`] (is the committed graph
//! current?), [`watch`] (keep it current headless, debounced) and
//! [`arch`] (the reality-side join, printed). The exit-code contract
//! those modes share is documented on [`cli`].

pub mod arch;
mod cache;
pub mod check;
pub mod cli;
pub mod diff;
mod emit;
mod error;
mod extract;
mod graph;
mod hash;
mod parse;
mod resolve;
mod walk;
pub mod watch;

#[cfg(test)]
mod testutil;

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

pub use diff::{diff, GraphDiff};
pub use error::IndexError;
pub use graph::{Edge, FileEntry, Graph, Lang, Package, Stats, Symbol, Unresolved};

use extract::Extractor;

/// The one seam T-012 (in-app command) and T-014 (binary) share.
pub const GRAPH_REL_PATH: &str = "docs/architecture/graph.json";

/// Per-file parse cap (availability control against pathological repos):
/// larger files are skipped and counted in `stats.skipped`.
const MAX_PARSE_BYTES: u64 = 4 * 1024 * 1024;

/// Options for [`index`]. Construct via `..Default::default()` — `root`
/// is the one required field (callers resolve it; the crate takes no
/// other path input).
#[derive(Clone, Debug)]
pub struct IndexOptions {
    /// Repo root to index. Canonicalized internally; must be a plain
    /// directory (a symlinked root anchors to its real path).
    pub root: PathBuf,
    /// Cache directory (the caller's choice — app-data dir, XDG cache
    /// dir…). `None` = no cache, always full parse. Disposable by
    /// contract: deleting it only costs a re-parse, never changes bytes.
    pub cache_dir: Option<PathBuf>,
    /// Languages to collect. Default `[Ts, Js]`; `Rust` is inert until
    /// T-010.
    pub languages: Vec<Lang>,
    /// Serialized-size budget. Default 1_000_000 — headroom under the
    /// docs collector's 1 MiB/file cap (a graph landing exactly at the
    /// cap would be one edit from vanishing out of the snapshot).
    pub max_graph_bytes: usize,
}

impl Default for IndexOptions {
    fn default() -> Self {
        Self {
            root: PathBuf::new(),
            cache_dir: None,
            languages: vec![Lang::Ts, Lang::Js],
            max_graph_bytes: 1_000_000,
        }
    }
}

/// Index `opts.root` and return the graph (full or incremental — the
/// cache only skips parsing; resolution and emit always run).
pub fn index(opts: &IndexOptions) -> Result<Graph, IndexError> {
    let canon_root = validate_root(&opts.root)?;
    let mut parsers = parse::Parsers::new()?; // fail fast on grammar load
    let walked = walk::walk_root(&canon_root, &opts.languages);

    let cache_path = opts
        .cache_dir
        .as_ref()
        .map(|dir| cache::cache_file_path(dir, &canon_root));
    let old_cache = cache_path
        .as_deref()
        .map(cache::load)
        .unwrap_or_default();

    let mut skipped: usize = 0;
    let mut new_cache: BTreeMap<String, cache::CacheEntry> = BTreeMap::new();
    let mut prepared: Vec<(String, Lang, String, usize)> = Vec::new(); // rel, lang, hash, loc
    let mut records: BTreeMap<String, extract::ExtractRecord> = BTreeMap::new();

    for file in &walked {
        // Size gate before reading (availability control).
        let Ok(meta) = std::fs::symlink_metadata(&file.abs) else {
            skipped += 1;
            continue;
        };
        if meta.len() > MAX_PARSE_BYTES {
            skipped += 1;
            continue;
        }
        let Ok(bytes) = std::fs::read(&file.abs) else {
            skipped += 1;
            continue;
        };
        if bytes.len() as u64 > MAX_PARSE_BYTES {
            skipped += 1; // grew past the cap mid-walk
            continue;
        }
        let content_hash = hash::content_hash(&bytes);

        let entry = if let Some(hit) = cache::reusable(&old_cache, &file.rel, &content_hash) {
            hit.clone()
        } else {
            let Ok(text) = String::from_utf8(bytes) else {
                skipped += 1; // non-UTF-8: counted, never silent
                continue;
            };
            // A UTF-8 BOM is tolerated: stripped for parsing only (the
            // hash stays over raw bytes; rows are unaffected).
            let source = text.strip_prefix('\u{feff}').unwrap_or(&text);
            let loc = source.lines().count();
            let record = match parse::dialect_for(&file.rel).and_then(|d| parsers.parse(d, source))
            {
                Some(tree) => extract::ts::TsExtractor.extract(source, &tree),
                None => extract::ExtractRecord::default(), // degrade, never fail
            };
            cache::CacheEntry {
                hash: content_hash.clone(),
                loc,
                extract: record,
            }
        };

        prepared.push((file.rel.clone(), file.lang, entry.hash.clone(), entry.loc));
        records.insert(file.rel.clone(), entry.extract.clone());
        new_cache.insert(file.rel.clone(), entry);
    }

    let resolved = resolve::resolve_all(&canon_root, &records);

    let files: Vec<FileEntry> = prepared
        .iter()
        .map(|(rel, lang, file_hash, loc)| {
            let record = &records[rel];
            FileEntry {
                id: graph::file_id(rel),
                path: rel.clone(),
                lang: lang.as_str().to_string(),
                hash: file_hash.clone(),
                loc: *loc,
                symbols: record
                    .symbols
                    .iter()
                    .map(|s| Symbol {
                        id: graph::symbol_id(rel, &s.name),
                        name: s.name.clone(),
                        kind: s.kind.clone(),
                        exported: s.exported,
                        range: s.range,
                    })
                    .collect(),
            }
        })
        .collect();

    let languages: BTreeSet<&'static str> =
        prepared.iter().map(|(_, lang, _, _)| lang.as_str()).collect();
    let symbols_total = files.iter().map(|f| f.symbols.len()).sum();
    let graph = Graph {
        schema: 1,
        root: ".".to_string(),
        languages: languages.into_iter().map(str::to_string).collect(),
        stats: Stats {
            files: files.len(),
            symbols: symbols_total,
            edges: resolved.edges.len(),
            truncated_symbols: None,
            truncated_files: None,
            skipped: (skipped > 0).then_some(skipped),
        },
        files,
        packages: resolved.packages,
        edges: resolved.edges,
        unresolved: resolved.unresolved,
    };

    let graph = emit::apply_budget(graph, opts.max_graph_bytes)?;

    if let Some(path) = cache_path {
        cache::store(&path, new_cache); // silent on failure, by contract
    }

    Ok(graph)
}

/// The stable serialization every consumer shares (goldens, write_graph,
/// T-014's check mode): 2-space pretty JSON, schema-order keys, trailing
/// LF.
pub fn stable_json(graph: &Graph) -> String {
    // Serialization of these types is structurally infallible (string
    // keys only, no fallible Serialize impls); the Result exists for
    // write_graph's plumbing.
    emit::stable_json_string(graph).expect("graph serialization is infallible")
}

/// Serialize + write `graph` to `path`, atomically, only if the bytes
/// changed. Returns true when the file changed. See plan §7: the
/// no-op-on-equal terminates T-012's watch loop.
pub fn write_graph(graph: &Graph, path: &Path) -> Result<bool, IndexError> {
    emit::write_graph(graph, path)
}

fn validate_root(root: &Path) -> Result<PathBuf, IndexError> {
    let canon = root
        .canonicalize()
        .map_err(|_| IndexError::RootInvalid(root.to_path_buf()))?;
    let meta =
        std::fs::metadata(&canon).map_err(|_| IndexError::RootInvalid(root.to_path_buf()))?;
    if !meta.is_dir() {
        return Err(IndexError::RootInvalid(root.to_path_buf()));
    }
    Ok(canon)
}

#[cfg(test)]
mod tests {
    use super::*;
    use testutil::TempTree;

    #[test]
    fn invalid_roots_are_rejected() {
        let missing = index(&IndexOptions {
            root: PathBuf::from("/nonexistent/nputer-t009-root"),
            ..Default::default()
        });
        assert!(matches!(missing, Err(IndexError::RootInvalid(_))));

        let t = TempTree::new("lib-rootfile");
        t.write("afile.ts", "export const a = 1;");
        let file_root = index(&IndexOptions {
            root: t.root().join("afile.ts"),
            ..Default::default()
        });
        assert!(matches!(file_root, Err(IndexError::RootInvalid(_))));
    }

    #[test]
    fn empty_repo_yields_an_empty_but_valid_graph() {
        let t = TempTree::new("lib-empty");
        let g = index(&IndexOptions {
            root: t.root().to_path_buf(),
            ..Default::default()
        })
        .unwrap();
        assert_eq!(g.schema, 1);
        assert_eq!(g.root, ".");
        assert!(g.languages.is_empty());
        assert!(g.files.is_empty());
        assert_eq!(g.stats.files, 0);
        assert_eq!(g.stats.skipped, None);
    }

    #[test]
    fn hostile_files_skip_with_counts_and_never_panic() {
        let t = TempTree::new("lib-hostile");
        t.write("good.ts", "export const ok = 1;");
        // Non-UTF-8.
        std::fs::write(t.root().join("bad-encoding.ts"), [0xff, 0xfe, 0x00, 0x41]).unwrap();
        // Over the 4 MiB parse cap.
        let big = "x".repeat((MAX_PARSE_BYTES + 1) as usize);
        std::fs::write(t.root().join("huge.ts"), big).unwrap();
        // Syntax errors still extract what parses.
        t.write(
            "broken.ts",
            "export const fine = 1;\nfunction {{{ nonsense\n",
        );
        // BOM-prefixed file parses.
        std::fs::write(
            t.root().join("bom.ts"),
            "\u{feff}export const bom = 1;".as_bytes(),
        )
        .unwrap();

        let g = index(&IndexOptions {
            root: t.root().to_path_buf(),
            ..Default::default()
        })
        .unwrap();
        let paths: Vec<&str> = g.files.iter().map(|f| f.path.as_str()).collect();
        assert_eq!(paths, vec!["bom.ts", "broken.ts", "good.ts"]);
        assert_eq!(g.stats.skipped, Some(2), "non-UTF-8 + oversize counted");
        let bom = g.files.iter().find(|f| f.path == "bom.ts").unwrap();
        assert_eq!(bom.symbols.len(), 1);
        assert_eq!(bom.symbols[0].name, "bom");
        let broken = g.files.iter().find(|f| f.path == "broken.ts").unwrap();
        assert!(broken.symbols.iter().any(|s| s.name == "fine"));
    }

    #[cfg(unix)]
    #[test]
    fn a_symlinked_root_anchors_to_its_real_path() {
        use std::os::unix::fs::symlink;
        let real = TempTree::new("lib-symroot-real");
        real.write("src/a.ts", "export const a = 1;");
        let holder = TempTree::new("lib-symroot-alias");
        let alias = holder.root().join("alias");
        symlink(real.root(), &alias).unwrap();

        let via_alias = index(&IndexOptions {
            root: alias,
            ..Default::default()
        })
        .unwrap();
        let direct = index(&IndexOptions {
            root: real.root().to_path_buf(),
            ..Default::default()
        })
        .unwrap();
        assert_eq!(stable_json(&via_alias), stable_json(&direct));
        assert_eq!(via_alias.files[0].path, "src/a.ts");
    }
}
