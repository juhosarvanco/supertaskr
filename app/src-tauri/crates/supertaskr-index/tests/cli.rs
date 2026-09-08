//! The binary, driven as a binary (T-014).
//!
//! Every assertion here runs the REAL executable through
//! `CARGO_BIN_EXE_supertaskr-index` and reads the REAL exit status, because
//! the exit codes are the contract this task ships and an in-process
//! `run()` return value is not the same claim. The in-process unit tests
//! in `src/cli.rs` cover the same paths for speed; this suite is what
//! proves the process boundary agrees with them.
//!
//! Fixture repos live under `tests/fixtures/`:
//! - `gate-repo`  — one of each finding: D1 (side -> core, undeclared),
//!   D2 (stray/loose.ts, unclaimed), D3 (C-03 owns nothing),
//!   D5 (C-03 depends on C-99).
//! - `clean-repo` — zero findings, so `--fail-on any` must exit 0.
//!
//! The single-severity variants are derived from `clean-repo` at
//! runtime: `--fail-on undeclared` must ignore a D2-only repo and
//! `--fail-on unmapped` must ignore a D1-only repo, which is the part a
//! both-findings fixture cannot prove.

mod common;

use std::path::Path;
use std::process::{Command, Output};

use common::{materialize_fixture, TempTree};

const BIN: &str = env!("CARGO_BIN_EXE_supertaskr-index");
const GRAPH: &str = "docs/architecture/graph.json";

struct Run {
    code: i32,
    stdout: String,
    stderr: String,
}

fn run(args: &[&str]) -> Run {
    let output: Output = Command::new(BIN).args(args).output().expect("spawn binary");
    Run {
        code: output.status.code().expect("exited, not signalled"),
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
    }
}

fn at(root: &Path, args: &[&str]) -> Run {
    let mut all: Vec<&str> = args.to_vec();
    let root = root.to_str().expect("utf8 root");
    all.push("--root");
    all.push(root);
    run(&all)
}

// ---------------------------------------------------------------- index

#[test]
fn index_writes_the_graph_and_then_reports_it_unchanged() {
    let t = materialize_fixture("clean-repo");
    let first = at(t.root(), &["index"]);
    assert_eq!(first.code, 0, "{}{}", first.stdout, first.stderr);
    assert!(first.stdout.contains("wrote"), "{}", first.stdout);
    assert!(t.root().join(GRAPH).exists());

    let before = std::fs::read(t.root().join(GRAPH)).unwrap();
    let second = at(t.root(), &["index"]);
    assert_eq!(second.code, 0);
    assert!(second.stdout.contains("unchanged"), "{}", second.stdout);
    assert_eq!(
        std::fs::read(t.root().join(GRAPH)).unwrap(),
        before,
        "an unchanged tree must produce byte-identical output"
    );
}

// ---------------------------------------------------------------- check

#[test]
fn check_is_green_then_red_on_a_planted_change_then_green_again() {
    let t = materialize_fixture("clean-repo");
    assert_eq!(at(t.root(), &["index"]).code, 0);

    let green = at(t.root(), &["index", "--check"]);
    assert_eq!(green.code, 0, "{}{}", green.stdout, green.stderr);
    assert!(green.stdout.contains("CURRENT"), "{}", green.stdout);
    assert!(green.stderr.is_empty());

    // Plant staleness the way a merge does: a new source file.
    std::fs::write(
        t.root().join("app/late.ts"),
        "import { core } from \"../core/core\";\nexport const late = core();\n",
    )
    .unwrap();

    let red = at(t.root(), &["index", "--check"]);
    assert_eq!(red.code, 1, "{}{}", red.stdout, red.stderr);
    assert!(red.stderr.contains("STALE"), "{}", red.stderr);
    assert!(red.stderr.contains("| + app/late.ts"), "{}", red.stderr);
    assert!(
        red.stderr.contains("| + f:app/late.ts -> f:core/core.ts (import)"),
        "the tail names the edge too:\n{}",
        red.stderr
    );
    assert!(
        red.stderr.contains("regenerate: supertaskr-index index --root"),
        "the tail names the fix:\n{}",
        red.stderr
    );
    assert!(red.stdout.is_empty(), "a red check is silent on stdout");

    assert_eq!(at(t.root(), &["index"]).code, 0);
    let recovered = at(t.root(), &["index", "--check"]);
    assert_eq!(recovered.code, 0, "{}{}", recovered.stdout, recovered.stderr);
    assert!(recovered.stdout.contains("CURRENT"));
}

#[test]
fn check_never_writes_the_graph_it_is_checking() {
    let t = materialize_fixture("clean-repo");
    let missing = at(t.root(), &["index", "--check"]);
    assert_eq!(missing.code, 1);
    assert!(missing.stderr.contains("MISSING"), "{}", missing.stderr);
    assert!(
        !t.root().join(GRAPH).exists(),
        "--check must create nothing (the fixture's docs/architecture/components/ already existed)"
    );

    assert_eq!(at(t.root(), &["index"]).code, 0);
    let before = std::fs::metadata(t.root().join(GRAPH)).unwrap().modified().unwrap();
    assert_eq!(at(t.root(), &["index", "--check"]).code, 0);
    let after = std::fs::metadata(t.root().join(GRAPH)).unwrap().modified().unwrap();
    assert_eq!(before, after, "a green check must not touch the file either");
}

#[test]
fn top_level_check_is_the_same_gate_as_index_check() {
    let t = materialize_fixture("clean-repo");
    assert_eq!(at(t.root(), &["index"]).code, 0);
    let a = at(t.root(), &["index", "--check"]);
    let b = at(t.root(), &["--check"]);
    assert_eq!((a.code, a.stdout), (b.code, b.stdout));
}

// ----------------------------------------------------------------- arch

#[test]
fn arch_prints_the_whole_fixture_registry_as_stable_records() {
    let t = materialize_fixture("gate-repo");
    assert_eq!(at(t.root(), &["index"]).code, 0);
    let out = at(t.root(), &["arch"]);
    assert_eq!(out.code, 0, "{}{}", out.stdout, out.stderr);

    // Everything after the `graph` line (which carries a byte count) is
    // pinned exactly: this is the "plain, stable, greppable" contract.
    let body: String = out
        .stdout
        .lines()
        .skip(1)
        .map(|l| format!("{l}\n"))
        .collect();
    assert_eq!(
        body,
        "\
component  C-01  Core  layer=lib  status=auto  files=1  declared_deps=0  observed_deps=0  drift=-
component  C-02  App  layer=app  status=building  files=1  declared_deps=1  observed_deps=2  drift=-
component  C-03  Nothing yet  layer=app  status=auto  files=0  declared_deps=1  observed_deps=0  drift=D3,D5
component  C-04  Side  layer=app  status=auto  files=1  declared_deps=0  observed_deps=1  drift=D1
component  unmapped  (unclaimed territory)  layer=-  status=-  files=1  declared_deps=0  observed_deps=0  drift=D2
edge  C-02 -> C-01  confirmed  observed=1
edge  C-02 -> unmapped  undeclared  observed=1
edge  C-03 -> C-99  planned  observed=0
edge  C-04 -> C-01  undeclared  observed=1
summary  components=4  files=4  mapped=3  unmapped=1  edges=4  findings=4  drift_components=3
",
        "actual:\n{}",
        out.stdout
    );
    // The source line names the file the report was computed from, so a
    // reader always knows which bytes produced the verdict. With an
    // explicit --root it is the absolute path; with `--root .` it is the
    // repo-relative one.
    let source = out.stdout.lines().next().unwrap();
    assert!(source.starts_with("graph  "), "{source}");
    assert!(source.contains(&t.root().join(GRAPH).display().to_string()), "{source}");
    assert!(source.contains("  files=4  symbols=5  edges=6"), "{source}");
}

#[test]
fn arch_drift_prints_one_of_each_rule_with_the_evidence_behind_it() {
    let t = materialize_fixture("gate-repo");
    assert_eq!(at(t.root(), &["index"]).code, 0);
    let out = at(t.root(), &["arch", "drift"]);
    assert_eq!(out.code, 0, "no --fail-on means report only");

    let body: String = out.stdout.lines().skip(1).map(|l| format!("{l}\n")).collect();
    assert_eq!(
        body,
        "\
finding  D1  D1:C-04->C-01  C-04 -> C-01  file_edges=1
  file-edge  side/side.ts -> core/core.ts
finding  D2  D2:unmapped  unmapped_files  files=1
  file  stray/loose.ts
finding  D3  D3:C-03  C-03  declared_only_component
finding  D5  D5:C-03->C-99  C-03 -> C-99  dangling_depends_on
summary  findings=4  undeclared=1  unmapped=1  declared_only=1  ambiguous=0  dangling=1
verdict  REPORT  no --fail-on given; exit 0 regardless of findings
note  computed from the COMMITTED graph; `supertaskr-index index --check` is what proves it current
",
        "actual:\n{}",
        out.stdout
    );
}

#[test]
fn every_fail_on_level_exits_non_zero_when_the_repo_has_that_finding() {
    let t = materialize_fixture("gate-repo");
    assert_eq!(at(t.root(), &["index"]).code, 0);
    for level in ["undeclared", "unmapped", "any"] {
        let out = at(t.root(), &["arch", "drift", "--fail-on", level]);
        assert_eq!(out.code, 1, "--fail-on {level}:\n{}{}", out.stdout, out.stderr);
        assert!(
            out.stdout.contains(&format!("verdict  DRIFT  --fail-on {level} matched")),
            "--fail-on {level}:\n{}",
            out.stdout
        );
    }
}

#[test]
fn every_fail_on_level_exits_zero_on_a_repo_with_no_findings() {
    let t = materialize_fixture("clean-repo");
    assert_eq!(at(t.root(), &["index"]).code, 0);
    for level in ["undeclared", "unmapped", "any"] {
        let out = at(t.root(), &["arch", "drift", "--fail-on", level]);
        assert_eq!(out.code, 0, "--fail-on {level}:\n{}{}", out.stdout, out.stderr);
        assert!(
            out.stdout.contains(&format!("verdict  CLEAN  --fail-on {level} matched 0")),
            "{}",
            out.stdout
        );
    }
    assert!(
        at(t.root(), &["arch", "drift"]).stdout.contains("summary  findings=0"),
        "the clean fixture really has nothing"
    );
}

#[test]
fn a_severity_only_gates_on_its_own_rule() {
    // D1 without D2: `unmapped` must stay green while `undeclared` reds.
    let d1 = materialize_fixture("clean-repo");
    std::fs::create_dir_all(d1.root().join("side")).unwrap();
    std::fs::write(
        d1.root().join("side/side.ts"),
        "import { core } from \"../core/core\";\nexport const side = core();\n",
    )
    .unwrap();
    std::fs::write(
        d1.root().join("docs/architecture/components/C-04-side.md"),
        "---\nid: C-04\nname: Side\nlayer: app\npaths:\n  - side/**\ndepends_on: []\n---\n",
    )
    .unwrap();
    assert_eq!(at(d1.root(), &["index"]).code, 0);
    assert_eq!(at(d1.root(), &["arch", "drift", "--fail-on", "undeclared"]).code, 1);
    assert_eq!(at(d1.root(), &["arch", "drift", "--fail-on", "unmapped"]).code, 0);
    assert_eq!(at(d1.root(), &["arch", "drift", "--fail-on", "any"]).code, 1);

    // D2 without D1: the mirror image.
    let d2 = materialize_fixture("clean-repo");
    std::fs::create_dir_all(d2.root().join("stray")).unwrap();
    std::fs::write(d2.root().join("stray/loose.ts"), "export const loose = 2;\n").unwrap();
    assert_eq!(at(d2.root(), &["index"]).code, 0);
    assert_eq!(at(d2.root(), &["arch", "drift", "--fail-on", "undeclared"]).code, 0);
    assert_eq!(at(d2.root(), &["arch", "drift", "--fail-on", "unmapped"]).code, 1);
    assert_eq!(at(d2.root(), &["arch", "drift", "--fail-on", "any"]).code, 1);
}

// --------------------------------------------------------- arch cycles

#[test]
fn arch_cycles_is_green_on_an_acyclic_fixture_and_needs_no_graph() {
    // POSITIVE CONTROL at the process boundary. `clean-repo` declares
    // C-02 -> C-01 and nothing back, and NOTHING is indexed here: the
    // gate must answer without a committed graph, which is what makes it
    // a registry gate rather than a second staleness check.
    let t = materialize_fixture("clean-repo");
    assert!(!t.root().join(GRAPH).exists(), "no graph, on purpose");
    let out = at(t.root(), &["arch", "cycles"]);
    assert_eq!(out.code, 0, "{}{}", out.stdout, out.stderr);
    assert!(
        out.stdout
            .contains("verdict  ACYCLIC  no declared cycle among 2 components"),
        "{}",
        out.stdout
    );
    assert!(out.stderr.is_empty(), "{}", out.stderr);
    assert!(!t.root().join(GRAPH).exists(), "and it writes nothing");
}

#[test]
fn a_cycle_planted_into_a_fixture_reds_the_real_process_and_is_named_as_a_path() {
    let t = materialize_fixture("clean-repo");
    assert_eq!(at(t.root(), &["arch", "cycles"]).code, 0, "green first");
    // One added `depends_on` line closes the walk. The MUTATION is the
    // registry; the assertion below never moves with it.
    std::fs::write(
        t.root().join("docs/architecture/components/C-01-core.md"),
        "---\nid: C-01\nname: Core\nlayer: lib\npaths:\n  - core/**\ndepends_on: [C-02]\nstatus: auto\n---\n",
    )
    .unwrap();
    let out = at(t.root(), &["arch", "cycles"]);
    assert_eq!(out.code, 1, "{}{}", out.stdout, out.stderr);
    assert!(
        out.stderr.contains("cycle  C-01 -> C-02 -> C-01"),
        "a bare \"cycle detected\" sends the next reader to redo the \
         measurement that found it: {}",
        out.stderr
    );
    assert!(out.stdout.is_empty(), "{}", out.stdout);
}

#[test]
fn arch_cycles_says_on_every_run_what_it_cannot_see() {
    // The scope line rides on BOTH verdicts: a green whose reach nobody
    // stated is a green that gets quoted as more than it is. `gate-repo`
    // is acyclic AND carries a dangling `C-03 -> C-99`, so this pins the
    // green half and the D5-is-not-a-cycle rule in one process.
    let t = materialize_fixture("gate-repo");
    let green = at(t.root(), &["arch", "cycles"]);
    assert_eq!(green.code, 0, "{}{}", green.stdout, green.stderr);
    assert!(
        green.stdout.contains("about DECLARED depends_on only")
            && green.stdout.contains("T-126-s4"),
        "{}",
        green.stdout
    );
    assert!(
        !green.stdout.contains("cycle  C-"),
        "a dangling depends_on is not a cycle: {}",
        green.stdout
    );
}

// ------------------------------------------------------- the failure ends

#[test]
fn usage_mistakes_are_exit_two_from_the_real_process() {
    for args in [
        vec!["nonsense"],
        vec!["--nope"],
        vec!["arch", "drift", "--fail-on", "everything"],
        vec!["index", "--check", "--watch"],
    ] {
        let out = run(&args);
        assert_eq!(out.code, 2, "{args:?}: {}{}", out.stdout, out.stderr);
        assert!(out.stderr.contains("[supertaskr-index] usage:"), "{args:?}");
    }
}

#[test]
fn a_gate_that_cannot_run_is_exit_three_never_exit_one() {
    let missing = "/nonexistent/supertaskr-t014-cli";
    for args in [
        vec!["index", "--root", missing],
        vec!["index", "--check", "--root", missing],
        vec!["arch", "--root", missing],
        vec!["arch", "drift", "--root", missing, "--fail-on", "any"],
    ] {
        let out = run(&args);
        assert_eq!(out.code, 3, "{args:?}: {}{}", out.stdout, out.stderr);
        assert!(out.stderr.contains("[supertaskr-index] FAILED:"), "{args:?}");
    }

    // A repo with a graph but no registry: silence would read as CLEAN.
    let t = TempTree::new("cli-noreg");
    std::fs::write(t.root().join("a.ts"), "export const a = 1;\n").unwrap();
    assert_eq!(at(t.root(), &["index"]).code, 0);
    let out = at(t.root(), &["arch", "drift", "--fail-on", "any"]);
    assert_eq!(out.code, 3, "{}{}", out.stdout, out.stderr);
    assert!(out.stderr.contains("no component registry"), "{}", out.stderr);
}

#[test]
fn a_registry_file_it_cannot_read_exactly_stops_the_gate() {
    let t = materialize_fixture("clean-repo");
    assert_eq!(at(t.root(), &["index"]).code, 0);
    assert_eq!(at(t.root(), &["arch", "drift", "--fail-on", "any"]).code, 0);
    std::fs::write(
        t.root().join("docs/architecture/components/C-03-broken.md"),
        "---\nid: C-03\nname: Broken\npaths:\n  - x/**\nmeta:\n  nested: 1\n---\n",
    )
    .unwrap();
    let out = at(t.root(), &["arch", "drift", "--fail-on", "any"]);
    assert_eq!(out.code, 3, "{}{}", out.stdout, out.stderr);
    assert!(out.stderr.contains("refusing to guess"), "{}", out.stderr);
}

#[test]
fn help_and_version_document_the_exit_codes_the_process_actually_uses() {
    let help = run(&["--help"]);
    assert_eq!(help.code, 0);
    for line in ["0  clean", "1  finding", "2  usage", "3  failed"] {
        assert!(help.stdout.contains(line), "--help must legend {line:?}");
    }
    assert_eq!(run(&["-h"]).stdout, help.stdout);
    assert_eq!(run(&[]).stdout, help.stdout, "no arguments prints the surface");
    let version = run(&["--version"]);
    assert_eq!(version.code, 0);
    assert_eq!(version.stdout.trim(), format!("supertaskr-index {}", env!("CARGO_PKG_VERSION")));
}
