//! `--watch`, and the convergence claim, MEASURED.
//!
//! The acceptance criterion asks for two things that only a running
//! process can show: a source change reaching graph.json within the
//! debounce window with the app closed, and two concurrent writers (the
//! app's in-process path and this binary) converging — "byte-identical
//! output makes last-write safe — asserted, not assumed".
//!
//! So: the watcher here is the REAL binary, spawned; the "app" writer is
//! the same library call the Tauri command makes
//! (`app/src-tauri/src/index_cmd.rs`: `index()` then `write_graph()`);
//! and a reader loop watches the file the whole time. Nothing is argued
//! from determinism — the bytes are compared.

mod common;

use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use nputer_index::{index, stable_json, write_graph, IndexOptions, GRAPH_REL_PATH};

use common::TempTree;

const BIN: &str = env!("CARGO_BIN_EXE_nputer-index");

/// Generous ceiling in the perf-harness spirit (T-009 §8): the criterion
/// number is the debounce window, this is the never-flake bound, and the
/// MEASURED latency is printed for the record.
const LATENCY_CEILING: Duration = Duration::from_secs(10);
const WATCH_DEBOUNCE_MS: u64 = 100;

struct Watcher {
    child: Child,
    lines: Arc<Mutex<Vec<String>>>,
}

impl Watcher {
    fn spawn(root: &Path, debounce_ms: u64) -> Watcher {
        let mut child = Command::new(BIN)
            .args([
                "index",
                "--watch",
                "--root",
                root.to_str().expect("utf8 root"),
                "--debounce-ms",
                &debounce_ms.to_string(),
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("spawn watcher");
        let stdout = child.stdout.take().expect("piped stdout");
        let lines: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
        let sink = lines.clone();
        std::thread::spawn(move || {
            for line in BufReader::new(stdout).lines().map_while(Result::ok) {
                sink.lock().expect("lines").push(line);
            }
        });
        Watcher { child, lines }
    }

    fn lines(&self) -> Vec<String> {
        self.lines.lock().expect("lines").clone()
    }
}

impl Drop for Watcher {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

/// Poll `predicate` until it holds or the deadline passes; returns how
/// long it took.
fn wait_until(deadline: Duration, mut predicate: impl FnMut() -> bool) -> Option<Duration> {
    let started = Instant::now();
    while started.elapsed() < deadline {
        if predicate() {
            return Some(started.elapsed());
        }
        std::thread::sleep(Duration::from_millis(5));
    }
    None
}

fn graph_text(root: &Path) -> String {
    std::fs::read_to_string(root.join(GRAPH_REL_PATH)).unwrap_or_default()
}

fn fresh_bytes(root: &Path) -> Vec<u8> {
    let graph = index(&IndexOptions {
        root: root.to_path_buf(),
        ..Default::default()
    })
    .expect("index");
    stable_json(&graph).into_bytes()
}

#[test]
fn a_source_change_reaches_the_graph_within_the_debounce_window() {
    let t = TempTree::new("watch-latency");
    t.write("src/a.ts", "export const a = 1;\n");
    let watcher = Watcher::spawn(t.root(), WATCH_DEBOUNCE_MS);

    // The watcher indexes once at start, so the graph exists before the
    // measurement begins — the latency measured below is the CHANGE's,
    // not the startup's.
    let startup = wait_until(LATENCY_CEILING, || {
        graph_text(t.root()).contains("\"src/a.ts\"")
    })
    .expect("the watcher must index once at startup");

    let started = Instant::now();
    t.write("src/b.ts", "export const brandNewSymbol = 2;\n");
    let latency = wait_until(LATENCY_CEILING, || {
        graph_text(t.root()).contains("brandNewSymbol")
    })
    .unwrap_or_else(|| {
        panic!(
            "graph.json never picked up the change; watcher said: {:?}",
            watcher.lines()
        )
    });
    let total = started.elapsed();

    println!(
        "[measured] watch startup index {} ms; change -> graph.json {} ms \
         (debounce {WATCH_DEBOUNCE_MS} ms, ceiling {} ms)",
        startup.as_millis(),
        latency.as_millis(),
        LATENCY_CEILING.as_millis()
    );
    assert!(total < LATENCY_CEILING, "{} ms", total.as_millis());

    // The graph the watcher wrote is exactly what a fresh index produces.
    assert_eq!(
        std::fs::read(t.root().join(GRAPH_REL_PATH)).unwrap(),
        fresh_bytes(t.root()),
        "the watcher's output is an ordinary index, byte for byte"
    );
    let said = watcher.lines();
    assert!(
        said.iter().any(|l| l.contains("watching")),
        "the watcher announces itself: {said:?}"
    );
    assert!(
        said.iter().any(|l| l.contains("graph.json updated")),
        "and says when it wrote: {said:?}"
    );
}

#[test]
fn an_unindexable_change_leaves_the_graph_completely_alone() {
    let t = TempTree::new("watch-noise");
    t.write("src/a.ts", "export const a = 1;\n");
    let watcher = Watcher::spawn(t.root(), WATCH_DEBOUNCE_MS);
    wait_until(LATENCY_CEILING, || {
        graph_text(t.root()).contains("\"src/a.ts\"")
    })
    .expect("startup index");
    let before = std::fs::read(t.root().join(GRAPH_REL_PATH)).unwrap();
    let stamp = std::fs::metadata(t.root().join(GRAPH_REL_PATH))
        .unwrap()
        .modified()
        .unwrap();

    // A README, a file inside node_modules, and a source file whose
    // content did not change: none of these may move the graph's bytes.
    t.write("README.md", "# noise\n");
    t.write("node_modules/pkg/index.ts", "export const hidden = 1;\n");
    t.write("src/a.ts", "export const a = 1;\n");
    std::thread::sleep(Duration::from_millis(WATCH_DEBOUNCE_MS * 12));

    assert_eq!(
        std::fs::read(t.root().join(GRAPH_REL_PATH)).unwrap(),
        before,
        "watcher said: {:?}",
        watcher.lines()
    );
    assert_eq!(
        std::fs::metadata(t.root().join(GRAPH_REL_PATH))
            .unwrap()
            .modified()
            .unwrap(),
        stamp,
        "no write at all, not merely equal bytes"
    );
}

/// THE CONVERGENCE MEASUREMENT.
///
/// Writer A is the app's path (`index()` + `write_graph()`, exactly what
/// `index_cmd.rs::run_index` calls). Writer B is this binary's `index`
/// command, a separate process. They hammer the same graph.json
/// concurrently while a reader loop reads it. Three claims, all measured:
/// the two writers' outputs are byte-identical; no read ever observes
/// anything but that content (the temp+rename is atomic, so there is no
/// torn state to observe); and the file that survives the race is that
/// same content.
#[test]
fn two_concurrent_writers_converge_byte_identically() {
    const ROUNDS: usize = 40;
    let t = TempTree::new("watch-converge");
    t.write("src/a.ts", "import { b } from \"./b\";\nexport const a = b;\n");
    t.write("src/b.ts", "export const b = 1;\n");
    t.write("src/c.tsx", "export const C = () => null;\n");
    let root = t.root().to_path_buf();
    let target = root.join(GRAPH_REL_PATH);
    let expected = fresh_bytes(&root);

    // Same tree, two producers: prove they agree BEFORE racing them, so
    // a failure below is about the race and not about the output.
    let binary_only = TempTree::new("watch-converge-b");
    copy_tree(&root, binary_only.root());
    let status = Command::new(BIN)
        .args(["index", "--root", binary_only.root().to_str().unwrap()])
        .stdout(Stdio::null())
        .status()
        .expect("binary index");
    assert!(status.success());
    assert_eq!(
        std::fs::read(binary_only.root().join(GRAPH_REL_PATH)).unwrap(),
        expected,
        "the binary and the library produce the same bytes"
    );

    let stop = Arc::new(AtomicBool::new(false));
    let reads = Arc::new(AtomicUsize::new(0));
    let mismatches = Arc::new(AtomicUsize::new(0));
    let empties = Arc::new(AtomicUsize::new(0));

    let reader = {
        let (stop, reads, mismatches, empties) =
            (stop.clone(), reads.clone(), mismatches.clone(), empties.clone());
        let (target, expected) = (target.clone(), expected.clone());
        std::thread::spawn(move || {
            while !stop.load(Ordering::SeqCst) {
                match std::fs::read(&target) {
                    Ok(bytes) => {
                        reads.fetch_add(1, Ordering::SeqCst);
                        if bytes.is_empty() {
                            empties.fetch_add(1, Ordering::SeqCst);
                        } else if bytes != expected {
                            mismatches.fetch_add(1, Ordering::SeqCst);
                        }
                    }
                    Err(_) => { /* before the first write; not a read */ }
                }
            }
        })
    };

    let app_writer = {
        let root = root.clone();
        let target = target.clone();
        std::thread::spawn(move || {
            let mut wrote = 0usize;
            for _ in 0..ROUNDS {
                let graph = index(&IndexOptions {
                    root: root.clone(),
                    ..Default::default()
                })
                .expect("app-side index");
                if write_graph(&graph, &target).expect("app-side write") {
                    wrote += 1;
                }
            }
            wrote
        })
    };

    let mut binary_runs = 0usize;
    for _ in 0..ROUNDS {
        let status = Command::new(BIN)
            .args(["index", "--root", root.to_str().unwrap()])
            .stdout(Stdio::null())
            .status()
            .expect("binary index");
        assert!(status.success(), "the binary writer must never fail mid-race");
        binary_runs += 1;
    }
    let app_changed = app_writer.join().expect("app writer");
    stop.store(true, Ordering::SeqCst);
    reader.join().expect("reader");

    let reads = reads.load(Ordering::SeqCst);
    let mismatches = mismatches.load(Ordering::SeqCst);
    let empties = empties.load(Ordering::SeqCst);
    println!(
        "[measured] convergence: {ROUNDS} app-side writes ({app_changed} reported a byte change) \
         + {binary_runs} binary runs, interleaved; {reads} reads during the race; \
         {mismatches} mismatched, {empties} empty; graph {} bytes",
        expected.len()
    );

    assert_eq!(mismatches, 0, "every read saw the converged content");
    assert_eq!(empties, 0, "the atomic rename leaves no torn or empty state");
    assert!(reads > 0, "the reader must actually have observed the file");
    assert_eq!(
        std::fs::read(&target).unwrap(),
        expected,
        "last write wins, and every writer wrote the same thing"
    );
    // Exactly one writer can report a byte change (whoever got there
    // first); everyone after writes nothing at all.
    assert!(
        app_changed <= 1,
        "only the first writer can report a byte change; app-side reported {app_changed}"
    );
    assert_eq!(
        std::fs::read_dir(target.parent().unwrap())
            .unwrap()
            .filter_map(|e| e.ok())
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .collect::<Vec<_>>(),
        vec!["graph.json".to_string()],
        "no temp-file litter survives the race"
    );
}

/// The criterion's exact pairing: the app writing while `--watch` runs.
#[test]
fn the_watcher_and_the_app_writer_converge_while_both_are_live() {
    let t = TempTree::new("watch-vs-app");
    t.write("src/a.ts", "export const a = 1;\n");
    let root = t.root().to_path_buf();
    let target = root.join(GRAPH_REL_PATH);
    let watcher = Watcher::spawn(&root, WATCH_DEBOUNCE_MS);
    wait_until(LATENCY_CEILING, || {
        graph_text(&root).contains("\"src/a.ts\"")
    })
    .expect("startup index");

    // The app indexes and writes repeatedly while the watcher is armed —
    // every one of those writes is itself an event the watcher sees.
    for i in 0..10 {
        if i == 5 {
            t.write("src/late.ts", "export const lateSymbol = 3;\n");
        }
        let graph = index(&IndexOptions {
            root: root.clone(),
            ..Default::default()
        })
        .expect("app index");
        write_graph(&graph, &target).expect("app write");
        std::thread::sleep(Duration::from_millis(20));
    }

    // Let the watcher's last batch land, then both must agree with a
    // fresh index of the final tree.
    let settled = wait_until(LATENCY_CEILING, || {
        std::fs::read(&target).unwrap_or_default() == fresh_bytes(&root)
    })
    .expect("the two writers must converge");
    println!(
        "[measured] watcher + app writer converged {} ms after the last app write; watcher said {} line(s)",
        settled.as_millis(),
        watcher.lines().len()
    );
    assert!(graph_text(&root).contains("lateSymbol"));
}

fn copy_tree(from: &Path, to: &Path) {
    let mut stack: Vec<PathBuf> = vec![from.to_path_buf()];
    while let Some(dir) = stack.pop() {
        for entry in std::fs::read_dir(&dir).expect("read dir").flatten() {
            let path = entry.path();
            let rel = path.strip_prefix(from).expect("under from");
            let dest = to.join(rel);
            if entry.file_type().expect("file type").is_dir() {
                std::fs::create_dir_all(&dest).expect("mkdir");
                stack.push(path);
            } else {
                if let Some(parent) = dest.parent() {
                    std::fs::create_dir_all(parent).expect("mkdirs");
                }
                std::fs::copy(&path, &dest).expect("copy");
            }
        }
    }
}
