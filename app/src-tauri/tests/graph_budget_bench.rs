//! T-139 — what it COSTS to deliver `docs/architecture/graph.json` to the
//! map pane, measured per stage so the two size limits can be set on the
//! stage that binds instead of on a round number.
//!
//! **T-140-s4 CHANGED WHAT THIS HARNESS MEASURES, AND THE OLD ROWS STAY
//! BECAUSE THE COMPARISON IS THE POINT.** The graph no longer rides the
//! docs snapshot at all — `is_collected_docs_path` stopped admitting
//! `.json` — so S1/S2a below describe a pipeline the graph has LEFT, and
//! the collector's answer is now "not carried" at every size rather than
//! "carried until the cliff". The stage that actually runs is the DRILL:
//! `arch_cmd::load`, which reads the committed file from disk and
//! deserializes it Rust-side, so it never crosses IPC. That is the only
//! consumer of `IndexOptions::max_graph_bytes` left, and it is the stage
//! that budget is now set on.
//!
//!   D   DRILL    `fs::read` + `serde_json::from_slice::<Graph>` —
//!                `arch_cmd::load`'s two size-dependent steps, paid once
//!                per rollup and once per detail pull. THE LIVE STAGE.
//!   S1  READ     `docs_watch::collect_docs_tree` — the production walk,
//!                canonicalize, size gate and `read_to_string`. HISTORY
//!                for the graph; still the real cost of the markdown
//!                snapshot beside it, which is why the rows stay.
//!   S2a ENCODE   `serde_json::to_string(&DocsSnapshot)` — the Rust half
//!                of the IPC hop. The graph USED to ride as a JSON
//!                *string field*, escape-encoded a second time; the `amp`
//!                column is what that cost, and is now a measurement of
//!                the road not taken.
//!
//! The other two — S2b DECODE (`JSON.parse` of the IPC envelope) and
//! S3 PARSE (`JSON.parse` of the graph text plus `parseGraph`'s model
//! construction) — run in the webview's JS engine and live in
//! `app/test/graph-budget-bench.mjs`. They now describe the BROWSER
//! fallback (`MapView`'s `graphContent`) rather than the desktop app.
//! Run both and read them together; neither half answers "which stage
//! binds" alone.
//!
//! RUN IT (release — a debug serde_json is not the number a limit is set
//! on, and a module that measures itself in debug is measuring rustc):
//!
//!   cargo test --release -p supertaskr --test graph_budget_bench \
//!     -- --ignored --nocapture
//!
//! `#[ignore]`d on purpose: it is a measurement, not an assertion. Its
//! only assertions are that every stage ran and that the collector is
//! not carrying the graph, neither of which is a timing, so it cannot
//! red on a slow machine — the numbers are READ, never gated. The pins
//! this measurement JUSTIFIES are elsewhere and they do run by default:
//! `crates/supertaskr-index/tests/budget.rs`, and — until T-140-s4 retired
//! it with the coupling it enforced —
//! `docs_watch::tests::the_emit_budget_stays_below_the_collectors_file_cap`,
//! whose reason is recorded at its own site.
//!
//! WHICH POINTS ARE REAL AND WHICH ARE SYNTHETIC. Exactly one row is the
//! live artifact — the committed `docs/architecture/graph.json` at the
//! ref you run this at, marked `LIVE` and printed with its own byte
//! count. Every other row is SYNTHETIC: the committed graph
//! deserialized, then its files resampled — a PREFIX of the real file
//! list below the live size, the real list REPLICATED under suffixed
//! paths above it — with each file's own out-edges carried along
//! whenever both endpoints survive. Resampling preserves the live
//! artifact's symbols-per-file and edges-per-file density, which is what
//! makes the curve mean anything; it does NOT preserve import topology,
//! which no stage measured here reads. A curve needs more than one point
//! and this repository has exactly one graph, so the synthesis is stated
//! rather than smuggled.
//!
//! TWO PATHS ARE MEASURED AT EVERY SIZE AND THE DIFFERENCE IS THE POINT.
//! `collect` is the production collector, which STOPS SHIPPING THE GRAPH
//! at `MAX_FILE_BYTES` — that row is the cliff, and above it the payload
//! carries no graph at all. `raw` is `read_to_string` plus an encode of a
//! snapshot built by hand, which continues past the cap and is the only
//! way to see what raising it would actually cost.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

use supertaskr_index::{stable_json, Edge, FileEntry, Graph};
use supertaskr_lib::docs_watch::{collect_docs_tree, DocsFile, DocsSnapshot};

/// Timed trials per cell, after one untimed warm-up. The reported figure
/// is the MINIMUM — the least noisy estimator of a deterministic cost on
/// a shared laptop — with the maximum beside it so a reader can see
/// whether the minimum is representative rather than take it on trust.
const TRIALS: usize = 9;

/// Repo root: this file sits at `app/src-tauri/tests/`.
fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(Path::parent)
        .expect("app/src-tauri/../.. is the repo root")
        .to_path_buf()
}

/// A scratch project OUTSIDE the repository, removed on drop.
struct Scratch(PathBuf);

impl Scratch {
    fn new(tag: &str) -> Self {
        let dir = std::env::temp_dir().join(format!(
            "supertaskr-t139-{tag}-{}-{}",
            std::process::id(),
            now_nanos()
        ));
        fs::create_dir_all(dir.join("docs/architecture")).expect("scratch mkdir");
        Scratch(dir)
    }
    fn root(&self) -> &Path {
        &self.0
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

fn now_nanos() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0)
}

/// (min, max) microseconds over `TRIALS` timed runs, after one warm-up
/// run that is discarded. The warm-up is load-bearing: without it the
/// first size measured carries the whole harness's cold-page cost and
/// reads as if that size were expensive.
fn timed<T>(mut run: impl FnMut() -> T) -> (u128, u128) {
    std::hint::black_box(run());
    let mut best = u128::MAX;
    let mut worst = 0u128;
    for _ in 0..TRIALS {
        let start = Instant::now();
        let value = run();
        let micros = start.elapsed().as_micros();
        std::hint::black_box(value);
        best = best.min(micros);
        worst = worst.max(micros);
    }
    (best, worst)
}

/// One replicable unit: a file plus the out-edges that belong to it.
struct Unit {
    file: FileEntry,
    edges: Vec<Edge>,
}

/// Build a pool of units large enough to synthesize up to `rounds` times
/// the live artifact. Round 0 is the real file list verbatim; every later
/// round is the same list under a `syntheticNN/` prefix, with ids and
/// symbol ids rewritten so the document stays internally consistent
/// (`f:<path>` agrees with `path`, `s:<path>#<name>` with its file) —
/// `parseGraph` validates both and would report issues on a lazy copy.
fn build_pool(base: &Graph, rounds: usize) -> Vec<Unit> {
    let mut pool: Vec<Unit> = Vec::new();
    for round in 0..rounds {
        let prefix = if round == 0 {
            String::new()
        } else {
            format!("synthetic{round:02}/")
        };
        for file in &base.files {
            let path = format!("{prefix}{}", file.path);
            let mut copy = file.clone();
            copy.path = path.clone();
            copy.id = format!("f:{path}");
            for (symbol, original) in copy.symbols.iter_mut().zip(file.symbols.iter()) {
                symbol.id = format!("s:{path}#{}", original.name);
            }
            let from_id = format!("f:{}", file.path);
            let edges = base
                .edges
                .iter()
                .filter(|e| owner(&e.from) == Some(from_id.as_str()))
                .map(|e| Edge {
                    from: reprefix(&e.from, &prefix),
                    to: reprefix(&e.to, &prefix),
                    ..e.clone()
                })
                .collect();
            pool.push(Unit { file: copy, edges });
        }
    }
    pool
}

/// The `f:<path>` an id belongs to: a file id is itself, a symbol id
/// `s:<path>#<name>` is its file. Split on the LAST `#` — paths may
/// contain one (the rule `graph.ts` states for the same ids).
fn owner(id: &str) -> Option<&str> {
    if id.starts_with("f:") {
        return Some(id);
    }
    None
}

fn reprefix(id: &str, prefix: &str) -> String {
    match id.split_once(':') {
        Some((sigil @ ("f" | "s"), rest)) => format!("{sigil}:{prefix}{rest}"),
        _ => id.to_string(),
    }
}

/// Assemble the first `count` units into a graph, keeping only the edges
/// whose target file is also present (no dangling `f:`/`s:` references,
/// which `parseGraph` would otherwise count as issues and charge the JS
/// half for).
fn assemble(pool: &[Unit], count: usize) -> Graph {
    let units = &pool[..count.min(pool.len())];
    let present: BTreeSet<&str> = units.iter().map(|u| u.file.path.as_str()).collect();
    let files: Vec<FileEntry> = units.iter().map(|u| u.file.clone()).collect();
    let edges: Vec<Edge> = units
        .iter()
        .flat_map(|u| u.edges.iter())
        .filter(|e| {
            let target = e.to.split_once(':').map(|(_, rest)| rest).unwrap_or(&e.to);
            let target = target.rsplit_once('#').map(|(p, _)| p).unwrap_or(target);
            present.contains(target)
        })
        .cloned()
        .collect();
    Graph {
        schema: 1,
        root: ".".to_string(),
        languages: vec!["js".into(), "rust".into(), "ts".into()],
        stats: supertaskr_index::Stats {
            files: files.len(),
            symbols: files.iter().map(|f| f.symbols.len()).sum(),
            edges: edges.len(),
            truncated_symbols: None,
            truncated_files: None,
            skipped: None,
            depth_limited: None,
        },
        files,
        packages: vec![],
        edges,
        unresolved: vec![],
    }
}

/// The serialized document closest to `target` bytes, found by bisecting
/// on unit count. Cost is near-linear in the count, so this converges in
/// a dozen serializations; bisecting is used anyway rather than a
/// linear model, because "near-linear" is an assumption and a bisection
/// is a measurement.
fn synthesize(pool: &[Unit], target: usize) -> String {
    let (mut lo, mut hi) = (0usize, pool.len());
    while lo < hi {
        let mid = (lo + hi).div_ceil(2);
        if stable_json(&assemble(pool, mid)).len() <= target {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    stable_json(&assemble(pool, lo))
}

/// One snapshot shaped exactly as the watcher ships it. The neighbouring
/// markdown matters: the IPC envelope carries the WHOLE docs tree, never
/// the graph alone, so a stage-2 figure measured on the graph in
/// isolation understates the payload the pane actually waits on.
fn snapshot_of(root: &Path) -> DocsSnapshot {
    let outcome = collect_docs_tree(root);
    DocsSnapshot {
        seq: 1,
        project_dir: root.display().to_string(),
        generated_at_ms: 0,
        files: outcome.files,
        skipped: outcome.skipped,
        skipped_total: outcome.skipped_total,
        truncated: outcome.truncated,
    }
}

/// The same snapshot built by hand from text already in memory — the
/// path that does NOT consult `MAX_FILE_BYTES`, so it keeps measuring
/// above the cap where the collector has stopped.
fn snapshot_raw(root: &Path, graph_text: String) -> DocsSnapshot {
    DocsSnapshot {
        seq: 1,
        project_dir: root.display().to_string(),
        generated_at_ms: 0,
        files: vec![DocsFile {
            path: "docs/architecture/graph.json".to_string(),
            content: graph_text,
        }],
        skipped: vec![],
        skipped_total: 0,
        truncated: false,
    }
}

#[test]
#[ignore = "measurement harness, not an assertion: run on --release (see module docs)"]
fn graph_delivery_cost_by_stage() {
    let root = repo_root();
    let live_path = root.join("docs/architecture/graph.json");
    let live_text = fs::read_to_string(&live_path).expect("committed graph.json");
    let live: Graph = serde_json::from_str(&live_text).expect("committed graph parses");

    println!("\n=== T-139 graph delivery cost, Rust stages ===");
    println!(
        "LIVE artifact: {} bytes · {} files · {} symbols · {} edges",
        live_text.len(),
        live.stats.files,
        live.stats.symbols,
        live.stats.edges
    );
    println!(
        "profile: {}",
        if cfg!(debug_assertions) {
            "DEBUG — these numbers are rustc's, not the pipeline's; re-run with --release"
        } else {
            "release"
        }
    );
    println!("trials per cell: {TRIALS} after one discarded warm-up; min [max] microseconds\n");

    // 32 MiB is past both limits by an order of magnitude on purpose: a
    // limit argued from a curve that stops at the limit is a limit
    // argued from one point.
    let pool = build_pool(&live, 36);
    let mut targets: Vec<usize> = vec![
        100_000, 250_000, 500_000, 750_000, 1_000_000, 1_048_576, 1_500_000, 2_000_000, 4_000_000,
        8_000_000, 16_000_000, 32_000_000,
    ];
    targets.push(live_text.len());
    targets.sort_unstable();

    println!(
        "{:>10} {:>6} {:>14} {:>14} {:>11} {:>7} {:>14} {:>14}",
        "graph B",
        "kind",
        "D read",
        "D deserialize",
        "payload B",
        "amp",
        "S1 collect",
        "S2a raw"
    );

    let mut measured = 0usize;
    for target in targets {
        let (label, doc) = if target == live_text.len() {
            ("LIVE", live_text.clone())
        } else {
            ("synth", synthesize(&pool, target))
        };

        let scratch = Scratch::new("bench");
        for (name, body) in [
            ("docs/STATE.md", "# State\n"),
            ("docs/ROADMAP.md", "# Roadmap\n"),
            ("docs/ARCHITECTURE.md", "# Architecture\n"),
        ] {
            fs::write(scratch.root().join(name), body).expect("write neighbour");
        }
        let graph_path = scratch.root().join("docs/architecture/graph.json");
        fs::write(&graph_path, &doc).expect("write graph");

        // D, THE LIVE STAGE (T-140-s4): what one drill pays. Both steps
        // are `arch_cmd::load`'s and both are linear in the document.
        let (dread_min, dread_max) = timed(|| fs::read(&graph_path).expect("drill read"));
        let doc_bytes = fs::read(&graph_path).expect("drill read");
        let (dparse_min, dparse_max) = timed(|| {
            serde_json::from_slice::<Graph>(&doc_bytes).expect("drill deserialize")
        });

        // S1, production: the whole collector. HISTORY for the graph —
        // it is not in the set at any size — and still the markdown cost.
        let (collect_min, collect_max) = timed(|| snapshot_of(scratch.root()));

        let collected = snapshot_of(scratch.root());
        assert!(
            !collected
                .files
                .iter()
                .any(|f| f.path == "docs/architecture/graph.json"),
            "T-140-s4: the collector must not carry the graph at ANY size — this row would \
             otherwise be measuring a pipeline the card removed"
        );

        let raw = snapshot_raw(scratch.root(), doc.clone());
        let (raw_enc_min, raw_enc_max) =
            timed(|| serde_json::to_string(&raw).expect("encode raw"));
        let raw_payload = serde_json::to_string(&raw).expect("encode raw");

        let amp = raw_payload.len() as f64 / doc.len() as f64;
        println!(
            "{:>10} {:>6} {:>14} {:>14} {:>11} {:>7} {:>14} {:>14}",
            doc.len(),
            label,
            format!("{dread_min} [{dread_max}]"),
            format!("{dparse_min} [{dparse_max}]"),
            raw_payload.len(),
            format!("{amp:.4}x"),
            format!("{collect_min} [{collect_max}]"),
            format!("{raw_enc_min} [{raw_enc_max}]"),
        );

        // Hand the JS half the same bytes, so both halves of the
        // measurement describe one document instead of two.
        let out = std::env::temp_dir().join(format!("supertaskr-t139-doc-{:09}.json", doc.len()));
        fs::write(&out, &doc).expect("hand off to the JS half");
        measured += 1;
    }

    assert!(measured >= 8, "the harness measured only {measured} sizes");

    // THE WHOLE PAYLOAD, ONCE, AGAINST THE REAL TREE — because every row
    // above measures the graph as if it travelled alone, and it does not.
    // `docs-changed` carries the entire docs snapshot, and the graph's
    // share of it is the number that says whether the graph is even the
    // expensive part.
    let real = snapshot_of(&root);
    let real_payload = serde_json::to_string(&real).expect("encode the real snapshot");
    let (real_min, real_max) = timed(|| snapshot_of(&root));
    let (real_enc_min, real_enc_max) =
        timed(|| serde_json::to_string(&real).expect("encode the real snapshot"));
    let graph_share: usize = real
        .files
        .iter()
        .find(|f| f.path == "docs/architecture/graph.json")
        .map(|f| f.content.len())
        .unwrap_or(0);
    let content: usize = real.files.iter().map(|f| f.content.len()).sum();
    println!(
        "\nTHE REAL SNAPSHOT at this ref: {} files · {content} content bytes · {} IPC payload bytes",
        real.files.len(),
        real_payload.len()
    );
    println!(
        "  graph.json is {graph_share} of those {content} content bytes = {:.1}% — since T-140-s4 that share is ZERO by construction and the rest is markdown",
        100.0 * graph_share as f64 / content as f64
    );
    println!(
        "  S1 collect {real_min} [{real_max}] us · S2a encode {real_enc_min} [{real_enc_max}] us · skipped {} of {}",
        real.skipped.len(),
        real.skipped_total
    );

    // THE DRILL, ONCE, AGAINST THE LIVE ARTIFACT — the one figure the
    // budget is now set on. Two steps, both linear, both paid per pull.
    let (live_read_min, live_read_max) = timed(|| fs::read(&live_path).expect("live drill read"));
    let live_bytes = fs::read(&live_path).expect("live drill read");
    let (live_parse_min, live_parse_max) = timed(|| {
        serde_json::from_slice::<Graph>(&live_bytes).expect("live drill deserialize")
    });
    println!(
        "\nTHE DRILL at this ref, on the committed {} bytes: read {live_read_min} [{live_read_max}] us · deserialize {live_parse_min} [{live_parse_max}] us",
        live_bytes.len()
    );

    println!("\nD read      = fs::read of the committed graph — arch_cmd::load's first size-dependent step");
    println!("D deserial. = serde_json::from_slice::<Graph> — its second, and the larger of the two");
    println!("S1 collect  = collect_docs_tree: walk + canonicalize + size gate + read_to_string (markdown only since T-140-s4)");
    println!("S2a raw     = serde_json::to_string of a hand-built snapshot carrying the graph — the road not taken");
    println!("amp         = IPC payload bytes / graph bytes — the cost of shipping JSON inside a JSON string");
    println!("\nDocuments written to {}/supertaskr-t139-doc-*.json", std::env::temp_dir().display());
    println!("Now run the JS half:  node app/test/graph-budget-bench.mjs\n");
}
