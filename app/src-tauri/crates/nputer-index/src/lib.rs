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
/// T-140-s1: the map's resting payload and the pull that answers for what
/// is on screen — the reality side rolled up to components, flat in file
/// count by construction.
pub mod rollup;
mod walk;
pub mod watch;

#[cfg(test)]
mod testutil;

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

pub use diff::{diff, GraphDiff};
pub use error::IndexError;
pub use graph::{DepthSite, Edge, FileEntry, Graph, Lang, Package, Stats, Symbol, Unresolved};
pub use rollup::{detail, rollup, stable_detail_json, stable_rollup_json, Detail, Rollup};

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
    /// Languages to collect. Default `[Ts, Js, Rust]` — `Rust` was inert
    /// until T-010 registered its extractor.
    pub languages: Vec<Lang>,
    /// Serialized-size budget: the emitted document never exceeds this,
    /// because [`emit::apply_budget`] drops symbol arrays until it fits.
    ///
    /// DEFAULT `2_145_959`, AND THE ARITHMETIC IS BELOW BECAUSE THIS
    /// NUMBER IS DERIVED RATHER THAN CHOSEN (T-140-s4, @human's ruling of
    /// 2026-08-30: *"yes, raise the budget — go ahead"*).
    ///
    /// **WHAT THIS CONSTANT USED TO BE COUPLED TO, AND IS NOT ANY MORE.**
    /// It was `MAX_FILE_BYTES - 8_576`: `docs_watch.rs`'s per-file
    /// collector cap minus a gap, because `graph.json` was subject to
    /// BOTH limits — the collector accepted `.json` under
    /// `docs/architecture/`, a rule written for this file. The two
    /// failure modes were not alike and the asymmetry was the argument:
    /// crossing THIS budget DEGRADES (symbol arrays go, files and
    /// `import` edges never do, `truncated_*` is set), while crossing the
    /// collector's cap was a CLIFF (`SkipReason::Oversize`, the pane
    /// receiving nothing). `max_graph_bytes < MAX_FILE_BYTES` kept the
    /// survivable failure in front of the silent one and was enforced by
    /// `docs_watch::tests::the_emit_budget_stays_below_the_collectors_file_cap`.
    /// **T-140-s4 removed the `.json` branch, so the collector no longer
    /// governs this file at any size**, that test is retired with its
    /// reason at its own site, and the cliff cannot occur — a file that is
    /// never eligible is never `Oversize`. There is now exactly ONE limit
    /// on the graph and it is this one; it is a DEGRADATION threshold and
    /// nothing else.
    ///
    /// **THE DERIVATION, IN THREE TERMS, ALL MEASURED AT `5073db6` WITH
    /// THIS CARD'S OWN DIFF IN THE TREE.**
    ///
    /// 1. **WHAT THE GRAPH WANTS TO BE: 1 134 406 bytes.** Not a
    ///    forecast — the budget was set to 100 000 000 and
    ///    `index --check` asked: `fresh index: 1134406 bytes · 199 files
    ///    · 2418 symbols · 2331 edges`, `truncated_*` absent. The
    ///    committed graph at the same ref was 1 039 590 with
    ///    `truncated_symbols: true, truncated_files: 4`, so the old
    ///    budget was costing 351 symbols across four files.
    /// 2. **WHAT THAT COSTS THE ONLY CONSUMER LEFT: about 1 ms, and it
    ///    does not bind.** The graph is now read only on a DRILL —
    ///    `arch_cmd::load`, `fs::read` plus
    ///    `serde_json::from_slice::<Graph>`, Rust-side, never crossing
    ///    IPC. Measured by `app/src-tauri/tests/graph_budget_bench.rs`
    ///    on `--release`, min of 9 trials: **1 048 us at the live
    ///    1 039 590 bytes**, 1 900 us at 2.0 MB, 3 719 us at 4.0 MB,
    ///    24 787 us at 25.8 MB — linear, no knee, ~0.93 us per KB. At
    ///    this ceiling one drill costs about 2.0 ms, paid on a click. The
    ///    same harness measures the docs snapshot the app ships on EVERY
    ///    push at 9 830 us to collect and 4 094 us to encode, so the
    ///    drill is an order of magnitude off the stage that binds. That
    ///    is why term 2 does not set the number — it only proves term 3
    ///    is affordable.
    /// 3. **GROWTH ROOM: 1 011 553 bytes, which is this graph's ENTIRE
    ///    MEASURED LIFETIME GROWTH.** The first `graph.json` blob this
    ///    repository ever committed was 122 853 bytes; its natural size
    ///    today is 1 134 406. So the room granted is exactly what the
    ///    graph has grown since it existed: the budget binds again when
    ///    the repository has doubled the whole of its history. One
    ///    measured quantity, no free coefficient to argue about.
    ///
    /// So `1_134_406 + (1_134_406 - 122_853) = 2_145_959`.
    ///
    /// **AND TERM 1 IS STAMPED AT THE STATE IT WAS MEASURED IN, WHICH IS
    /// NOT THIS ONE — BECAUSE WRITING THE DERIVATION DOWN MOVED IT.**
    /// `1_134_406` was read part-way through this card, before the rest
    /// of its own `.rs` edits landed — this comment and
    /// `tests/graph_budget_bench.rs`'s drill stage among them, both
    /// inside the walk. The regen at the finished tree answers
    /// `1_134_409`: **three bytes**, spent describing the measurement.
    /// The constant is deliberately NOT chased to a fixed point. Each
    /// correction is itself indexed, so convergence would be precision
    /// about nothing; this is a CEILING, three bytes against 1 011 550 of
    /// headroom, and the authority for what the graph weighs today is
    /// `index --check`'s `budget:` line rather than this page.
    ///
    /// **CROSS-CHECKED IN ORDINARY MERGES, WHICH IS THE UNIT THE ALARM
    /// SPEAKS.** [`crate::check::WARN_HEADROOM_BYTES`] is one ordinary
    /// merge's growth of this graph, re-derived at this ref as **13 921**
    /// bytes (mean of the 68 positive single-commit growths; median
    /// 4 501, max 241 980). The room above is 1 011 553 / 13 921 =
    /// **72.7 ordinary merges**, against **68** growths on this graph's
    /// entire record. Two independent framings — "double the lifetime"
    /// and "one more lifetime of merges" — agreeing to within 7% is the
    /// reason this number is stated rather than rounded to 2 MiB, which
    /// would have been 2 097 152 and would have meant nothing.
    ///
    /// **WHAT IT BUYS ON THE CURVE THAT ACTUALLY DECIDES THE MAP'S
    /// CEILING — read `check::floor_line`, never this line.** The floor
    /// (files plus `import` edges, which truncation may never reclaim) is
    /// linear in file count: 230 079 bytes over 199 files, 1 156
    /// bytes/file at this ref, so graceful degradation now ends at about
    /// 1 856 files where it ended at about 898 — both printed by that
    /// line, neither computed here. That is a factor and not
    /// a new curve, exactly as T-140 said a raise would be — which is why
    /// this constant is still not the answer to "how large a project can
    /// the map hold". It is the answer to "how long before the map stops
    /// answering what is in a file".
    ///
    /// **AND THE FIGURES BELOW THIS LINE ARE T-139's AND T-140's, AT
    /// THEIR OWN REFS.** They are kept because they are the measurement
    /// that argued the old number, and every one of them is about a
    /// delivery path this card removed. Read them as history.
    ///
    /// THE VALUE IS MEASURED, at `13c736e` on an Apple M5 / macOS 26.6
    /// (25G72), by `app/src-tauri/tests/graph_budget_bench.rs` and
    /// `app/test/graph-budget-bench.mjs` — both re-runnable, both naming
    /// their command in their own module docs. Delivering the live
    /// 989 181-byte graph costs 3.66 ms end to end, and the stage that
    /// binds is the IPC hop rather than the parse:
    ///
    ///   read   (collector, whole docs tree)   0.126 ms    3.4%
    ///   IPC    (serde encode + webview eval)  2.374 ms   64.9%
    ///   parse  + model construction           1.160 ms   31.7%
    ///
    /// Cost is LINEAR to 14 MB with no knee, so no stage argues for a
    /// limit anywhere near 1 MiB. What sets this number is therefore the
    /// cliff and nothing else — and the distance to it was doing no work.
    /// The emitter caps the document, so while this stays under the
    /// collector's cap AND `apply_budget`'s floor stays under it too, the
    /// graph can never be dropped; that floor — every symbol array
    /// emptied and the dependent `s:` edges gone — is 204 996 bytes here,
    /// 19.6% of the cap. The old 48 576-byte gap bought no safety and
    /// cost about 130 symbols at this graph's 373 bytes/symbol, while the
    /// headroom under `1_000_000` had fallen to 10 819 bytes against a
    /// mean single-commit growth of 15 751 (55 growths on record, median
    /// 5 230, max 241 980 at T-010) — one ordinary merge from truncating.
    ///
    /// THE REMAINING 8 576 BYTES ARE NOT A GROWTH ALLOWANCE. Growth is
    /// absorbed by truncation, which is what this budget is FOR. They are
    /// there because the two limits are two DIFFERENT measurements in two
    /// different crates: `apply_budget` compares the serialized STRING
    /// LENGTH and the collector compares the on-disk `meta.len()`. Equal
    /// today; a non-zero gap is also what gives the strict `<` in the pin
    /// something to catch when somebody makes them equal on purpose.
    ///
    /// RAISING THE COLLECTOR'S CAP IS NOT THE WAY TO BUY MORE THAN THIS
    /// (T-139): that cap governs all 372 collected docs, `MAX_FILES` is
    /// 2 000 and nothing caps the aggregate. A graph-specific cap on the
    /// `.json` branch of `is_collected_docs_path` is the shape that
    /// would, and it is a card of its own.
    ///
    /// **AND THIS NUMBER IS NOT WHAT DECIDES HOW LARGE A PROJECT THE MAP
    /// CAN HOLD** (T-140). It is a ceiling the emitter can always reach,
    /// because reaching it costs symbols and symbols are droppable. What
    /// decides the limit is the FLOOR — the file list plus the `import`
    /// edges, which `apply_budget` never drops — and the floor is LINEAR
    /// IN FILE COUNT. Past the point where the floor crosses this budget
    /// there is nothing left to degrade: the document ships over anyway,
    /// and then keeps growing. So raising this constant buys files at
    /// the floor's own per-file rate and changes no curve; `T-151` is
    /// that raise, costed, and its own honest framing says the same.
    ///
    /// **THE FLOOR AND THE FILE COUNT IT IMPLIES ARE PRINTED, NEVER
    /// TRANSCRIBED.** `check::floor_line` derives both from a fresh
    /// index at every `index --check` run and states them beside the
    /// budget line, because both move with the schema, the languages
    /// walked and the import density — a figure written here would be
    /// wrong by the next merge, which is how T-140's own card came to
    /// quote a per-file cost the tree had already left behind.
    /// `tests/budget.rs`'s `the_undroppable_floor_grows_with_the_file_count`
    /// pins the RELATION, which is the part that does not move.
    pub max_graph_bytes: usize,
}

impl Default for IndexOptions {
    fn default() -> Self {
        Self {
            root: PathBuf::new(),
            cache_dir: None,
            languages: vec![Lang::Ts, Lang::Js, Lang::Rust],
            // T-140-s4: the graph's natural size at `5073db6` plus its
            // whole measured lifetime growth —
            // `1_134_406 + (1_134_406 - 122_853)`. The field's doc above
            // carries every term, its measurement and its cross-check.
            // No pin holds it to another constant any more: the
            // cross-crate relation this used to sit under was retired
            // with the collector's `.json` branch, and what watches this
            // number now is `check::WARN_HEADROOM_BYTES`'s alarm.
            max_graph_bytes: 2_145_959,
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
            let record = match parse::dialect_for(&file.rel) {
                Some(dialect) => match parsers.parse(dialect, source) {
                    // One extractor per LANGUAGE, chosen by the same
                    // dialect the parser was: TS/TSX/JS share theirs, Rust
                    // has its own (T-010).
                    Some(tree) => match dialect {
                        parse::Dialect::Rust => extract::rust::RustExtractor.extract(source, &tree),
                        _ => extract::ts::TsExtractor.extract(source, &tree),
                    },
                    None => extract::ExtractRecord::default(), // degrade, never fail
                },
                None => extract::ExtractRecord::default(),
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

    let langs: BTreeMap<String, Lang> = prepared
        .iter()
        .map(|(rel, lang, _, _)| (rel.clone(), *lang))
        .collect();
    let resolved = resolve::resolve_all(&canon_root, &records, &langs);

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
                depth_refused: record.depth_refused,
            }
        })
        .collect();

    let languages: BTreeSet<&'static str> =
        prepared.iter().map(|(_, lang, _, _)| lang.as_str()).collect();
    let symbols_total = files.iter().map(|f| f.symbols.len()).sum();
    // Derived from the file entries the same way `symbols` is derived
    // from the symbol arrays (T-129) — the headline count of files whose
    // extraction refused past `extract::MAX_DEPTH`, so a caller has a
    // number without walking `files[]`. `None` when nothing refused,
    // which keeps the key out of the committed bytes entirely.
    let depth_limited = files.iter().filter(|f| f.depth_refused.is_some()).count();
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
            depth_limited: (depth_limited > 0).then_some(depth_limited),
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
