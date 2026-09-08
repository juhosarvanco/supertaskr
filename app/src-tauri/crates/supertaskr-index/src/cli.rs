//! The `supertaskr-index` binary's command surface.
//!
//! ADR-003/ADR-015: the future Node CLI (C-02) shells OUT to this binary
//! — `supertaskr index` stays a Node command wrapping it — so this crate
//! builds no Node code and this module owns no orchestration beyond
//! parsing argv and choosing an exit code.
//!
//! # THE EXIT-CODE CONTRACT
//!
//! ```text
//!   0  clean      the answer is yes: graph current / no findings at the
//!                 requested severity / the run did what was asked
//!   1  finding    the gate's own negative verdict: graph.json is STALE,
//!                 or `arch drift --fail-on <sev>` matched
//!   2  usage      the command was called wrong (unknown flag, unknown
//!                 subcommand, bad --fail-on value, missing argument)
//!   3  failed     the gate could not run: root invalid, registry
//!                 unreadable, grammar load failure, write refused
//! ```
//!
//! ONE RANGE FOR BOTH GATES, on purpose. `index --check` and `arch drift`
//! share these codes rather than occupying separate ranges because they
//! are the same predicate shape — "is the repo still honest?" — and a CI
//! step that chains them (`supertaskr-index index --check && supertaskr-index
//! arch drift --fail-on any`) must not have to remember which command it
//! just ran to read the number. A single `case $? in` handles both. At
//! the shell, `&&` and `set -e` collapse every non-zero code anyway, so a
//! separate range would buy nothing there and cost a rule to remember.
//!
//! What DOES need separating is 1 from 2 and 3, and that is the whole
//! reason there are four codes: "the gate says stale" and "the gate could
//! not tell you" are different news (T-046's boot-gate lesson — a skipped
//! gate is news, never silence). The split also mirrors the shape the
//! repo already uses: `npm run boot:check` is 0 booted · 1 the boot
//! failed · 2 the port is busy · 3 the override was refused. Same idea,
//! same positions: 0 clean, 1 the gate's verdict, 2/3 could-not-run.

use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;

use crate::arch::{self, Severity};
use crate::check;
use crate::watch;
use crate::{index, stable_json, write_graph, IndexOptions, GRAPH_REL_PATH};

pub const EXIT_OK: i32 = 0;
pub const EXIT_FINDINGS: i32 = 1;
pub const EXIT_USAGE: i32 = 2;
pub const EXIT_FAILED: i32 = 3;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

pub const HELP: &str = "\
supertaskr-index - deterministic TS/JS indexer and architecture gate (C-07)

USAGE
  supertaskr-index index [--root DIR] [--cache-dir DIR]
  supertaskr-index index --check [--root DIR]
  supertaskr-index index --watch [--root DIR] [--debounce-ms MS] [--cache-dir DIR]
  supertaskr-index arch [--root DIR]
  supertaskr-index arch drift [--root DIR] [--fail-on undeclared|unmapped|any]
  supertaskr-index arch cycles [--root DIR]
  supertaskr-index arch blast PATH|SLUG... [--root DIR]

  --check and --watch are also accepted at the top level as shorthand for
  `index --check` / `index --watch`.

COMMANDS
  index         Index the tree and write docs/architecture/graph.json.
  index --check Compare the committed graph against a fresh index and
                print what moved. Writes nothing. Exit 1 when stale.
  index --watch Keep the graph current headless, debounced (default
                250 ms - the app watcher's window). Runs until stopped.
  arch          Print components, their observed edges and drift flags.
  arch drift    Print drift findings and a verdict.
  arch cycles   Print every DECLARED dependency cycle as a path
                (`C-08 -> C-09 -> C-08`) and a verdict. Exit 1 when the
                registry is not acyclic.
  arch blast    Print how many files DEPEND ON each file a path or a
                `touch_slugs:` fence names - the forward graph reversed
                AT READ TIME, so nothing is stored and no reverse index
                can disagree with the forward one (T-135). A REPORTER:
                it prints counts, build-target roots and a coverage
                class, never a ceremony rung, and always exits 0 unless
                it could not run.

  arch, arch drift and arch blast READ the committed graph (ADR-014) -
  they never index and never write. `index --check` is the one staleness
  gate; chain it first if the answer must be about the working tree.

  arch cycles reads the REGISTRY ONLY - no graph, no index - so it
  cannot be a false red from a stale graph, and it says nothing about
  observed imports. It is the enforcing form of @human's no-cycles
  ruling of 2026-08-25 (T-127); `cargo test -p supertaskr-index` carries
  the same predicate against this repo's own registry.

OPTIONS
  --root DIR         Repo root (default: the current directory).
  --cache-dir DIR    Parse cache location. Default: none - `index` and
                     `--check` run cold on purpose, because a gate that
                     consults a cache is a gate with hidden state.
  --debounce-ms MS   Watch debounce window (default 250).
  --fail-on SEV      arch drift only. `undeclared` gates on D1,
                     `unmapped` on D2, `any` on any finding. Omitted:
                     report only, always exit 0.
  PATH|SLUG          arch blast only, one or more. A bare name (no `/`,
                     no `.`) is a fence SLUG, resolved through each
                     component's own `touch_slugs:`; anything else is a
                     path, matched as a file or a directory prefix. An
                     unknown SLUG is exit 2 - answering a typo with a
                     confident zero is the failure this command exists
                     to avoid. A path with no graph entry is not an
                     error: it is a coverage class.
  -h, --help         This text.
  -V, --version      Print the crate version.

EXIT CODES
  0  clean    graph current / no findings at the requested severity /
              the declared registry is acyclic / the blast report printed
  1  finding  graph.json is STALE, or arch drift matched --fail-on, or
              arch cycles found a declared cycle
  2  usage    called wrong (unknown flag, bad --fail-on value, arch blast
              with no inputs or an undeclared slug)
  3  failed   could not run (invalid root, unreadable registry, IO)

  index --check, arch drift and arch cycles share this range
  deliberately: one `case $?` reads all three, and 1 (the gate's
  verdict) stays distinct from 2/3 (the gate could not run).

NOTES
  Findings: D1 undeclared_dependency · D2 unmapped_files ·
  D3 declared_only_component · D4 ambiguous_mapping ·
  D5 dangling_depends_on. A DECLARED CYCLE is not a drift finding - it
  is a violation of the registry's own topology rule and is answered by
  `arch cycles`, which needs no graph. Status and provenance ROLLUPS are not computed
  here - they join the task tree, which is the app's TypeScript
  derivation (ADR-015). `status=` prints the component file's own field.
";

#[derive(Debug, PartialEq)]
enum Command {
    Help,
    Version,
    Index,
    Check,
    Watch,
    Arch,
    ArchDrift,
    ArchCycles,
    ArchBlast,
}

#[derive(Debug)]
struct Args {
    command: Command,
    root: PathBuf,
    root_label: String,
    cache_dir: Option<PathBuf>,
    debounce: Duration,
    fail_on: Option<Severity>,
    /// `arch blast`'s positional inputs, in the order written.
    targets: Vec<String>,
}

/// Parse argv (without the program name). `Err` is a usage message.
fn parse(argv: &[String]) -> Result<Args, String> {
    let mut command: Option<Command> = None;
    let mut check_flag = false;
    let mut watch_flag = false;
    let mut root_label = ".".to_string();
    let mut cache_dir: Option<PathBuf> = None;
    let mut debounce = watch::DEBOUNCE;
    let mut fail_on: Option<Severity> = None;
    let mut targets: Vec<String> = Vec::new();

    let mut it = argv.iter().enumerate().peekable();
    while let Some((position, arg)) = it.next() {
        // `--flag=value` and `--flag value` are both accepted.
        let (name, inline) = match arg.split_once('=') {
            Some((n, v)) if n.starts_with("--") => (n, Some(v.to_string())),
            _ => (arg.as_str(), None),
        };
        let mut value = |flag: &str| -> Result<String, String> {
            if let Some(v) = inline.clone() {
                return Ok(v);
            }
            match it.next() {
                Some((_, v)) if !v.starts_with('-') => Ok(v.clone()),
                _ => Err(format!("{flag} needs a value")),
            }
        };
        match name {
            "-h" | "--help" => {
                return Ok(args_for(Command::Help, root_label, None, debounce, None))
            }
            "-V" | "--version" => {
                return Ok(args_for(Command::Version, root_label, None, debounce, None))
            }
            "--check" => check_flag = true,
            "--watch" => watch_flag = true,
            "--root" => root_label = value("--root")?,
            "--cache-dir" => cache_dir = Some(PathBuf::from(value("--cache-dir")?)),
            "--debounce-ms" => {
                let raw = value("--debounce-ms")?;
                let ms: u64 = raw
                    .parse()
                    .map_err(|_| format!("--debounce-ms wants a number, got {raw:?}"))?;
                debounce = Duration::from_millis(ms);
            }
            "--fail-on" => {
                let raw = value("--fail-on")?;
                fail_on = Some(Severity::parse(&raw).ok_or_else(|| {
                    format!("--fail-on wants undeclared|unmapped|any, got {raw:?}")
                })?);
            }
            "index" if position == 0 => command = Some(Command::Index),
            "arch" if position == 0 => command = Some(Command::Arch),
            "drift" if command == Some(Command::Arch) => command = Some(Command::ArchDrift),
            "cycles" if command == Some(Command::Arch) => command = Some(Command::ArchCycles),
            "blast" if command == Some(Command::Arch) => command = Some(Command::ArchBlast),
            other if other.starts_with('-') => return Err(format!("unknown flag {other:?}")),
            // `arch blast` is the one command taking POSITIONAL inputs,
            // and it is the one place a bare word is not a mistake.
            other if command == Some(Command::ArchBlast) => targets.push(other.to_string()),
            other => return Err(format!("unknown command {other:?}")),
        }
    }

    let command = match (command, check_flag, watch_flag) {
        (_, true, true) => return Err("--check and --watch are mutually exclusive".to_string()),
        (Some(Command::Index) | None, true, false) => Command::Check,
        (Some(Command::Index) | None, false, true) => Command::Watch,
        (Some(other), true, false) | (Some(other), false, true) => {
            return Err(format!(
                "--check/--watch belong to `index`, not to `{}`",
                command_name(&other)
            ))
        }
        (Some(other), false, false) => other,
        (None, false, false) => Command::Help,
    };
    if fail_on.is_some() && command != Command::ArchDrift {
        return Err("--fail-on belongs to `arch drift`".to_string());
    }
    if command == Command::ArchBlast && targets.is_empty() {
        return Err("`arch blast` needs at least one PATH or SLUG".to_string());
    }
    if !targets.is_empty() && command != Command::ArchBlast {
        return Err(format!(
            "unknown command {:?}",
            targets.first().expect("non-empty")
        ));
    }

    Ok(Args {
        root: PathBuf::from(&root_label),
        command,
        root_label,
        cache_dir,
        debounce,
        fail_on,
        targets,
    })
}

fn command_name(command: &Command) -> &'static str {
    match command {
        Command::Help => "help",
        Command::Version => "version",
        Command::Index => "index",
        Command::Check => "index --check",
        Command::Watch => "index --watch",
        Command::Arch => "arch",
        Command::ArchDrift => "arch drift",
        Command::ArchCycles => "arch cycles",
        Command::ArchBlast => "arch blast",
    }
}

fn args_for(
    command: Command,
    root_label: String,
    cache_dir: Option<PathBuf>,
    debounce: Duration,
    fail_on: Option<Severity>,
) -> Args {
    Args {
        root: PathBuf::from(&root_label),
        command,
        root_label,
        cache_dir,
        debounce,
        fail_on,
        targets: Vec::new(),
    }
}

/// Run the CLI. Returns the process exit code; writes nothing anywhere
/// else, so tests drive it in-process and the integration suite drives
/// the real binary for the same assertions.
pub fn run(argv: &[String], out: &mut dyn Write, err: &mut dyn Write) -> i32 {
    let args = match parse(argv) {
        Ok(args) => args,
        Err(message) => {
            let _ = writeln!(err, "[supertaskr-index] usage: {message}");
            let _ = writeln!(err, "[supertaskr-index] run `supertaskr-index --help` for the command surface");
            return EXIT_USAGE;
        }
    };

    let options = IndexOptions {
        root: args.root.clone(),
        cache_dir: args.cache_dir.clone(),
        ..Default::default()
    };

    match args.command {
        Command::Help => {
            let _ = write!(out, "{HELP}");
            EXIT_OK
        }
        Command::Version => {
            let _ = writeln!(out, "supertaskr-index {VERSION}");
            EXIT_OK
        }
        Command::Index => match index(&options) {
            Ok(graph) => {
                let target = args.root.join(GRAPH_REL_PATH);
                match write_graph(&graph, &target) {
                    Ok(changed) => {
                        let _ = writeln!(
                            out,
                            "[supertaskr-index] {} {} ({} bytes, {} files, {} symbols, {} edges)",
                            if changed { "wrote" } else { "unchanged" },
                            display_target(&args.root_label, &target),
                            stable_json(&graph).len(),
                            graph.stats.files,
                            graph.stats.symbols,
                            graph.stats.edges,
                        );
                        EXIT_OK
                    }
                    Err(e) => fail(err, &e.to_string()),
                }
            }
            Err(e) => fail(err, &e.to_string()),
        },
        Command::Check => match check::check(&options) {
            Ok(report) => {
                let text = check::render(&report, &args.root_label);
                if report.is_stale() {
                    let _ = write!(err, "{text}");
                    EXIT_FINDINGS
                } else {
                    let _ = write!(out, "{text}");
                    EXIT_OK
                }
            }
            Err(e) => fail(err, &e.to_string()),
        },
        Command::Watch => {
            let outcome = watch::watch(&options, args.debounce, |event| {
                let line = render_watch_event(&event);
                let _ = writeln!(out, "{line}");
                let _ = out.flush();
            });
            match outcome {
                Ok(()) => EXIT_OK,
                Err(e) => fail(err, &e.to_string()),
            }
        }
        Command::ArchCycles => {
            // REGISTRY ONLY. No graph is read and none is needed: a
            // declared cycle is a property of `depends_on:` alone, and
            // making this gate depend on a committed index would give a
            // registry question a second failure mode it does not have
            // (T-127). An unreadable registry is exit 3, never a cheerful
            // "acyclic" - silence would read as the green.
            let components = match arch::registry::read_registry(&args.root) {
                Ok(components) => components,
                Err(e) => return fail(err, &e.to_string()),
            };
            let report = arch::cycles::cycles(&components);
            let text = arch::cycles::render(&report, &args.root_label);
            if report.has_cycle() {
                let _ = write!(err, "{text}");
                EXIT_FINDINGS
            } else {
                let _ = write!(out, "{text}");
                EXIT_OK
            }
        }
        Command::Arch | Command::ArchDrift | Command::ArchBlast => {
            // `arch` reads the COMMITTED graph rather than indexing
            // fresh (ADR-014: "`supertaskr arch` greps it"). Two reasons it
            // matters: the report then describes the same bytes the app
            // renders and the TypeScript engine derives from, so the two
            // views cannot silently disagree; and staleness stays ONE
            // gate — `index --check` — instead of being half-answered
            // here. A missing or unreadable graph is exit 3, never a
            // cheerful "no drift".
            let target = args.root.join(GRAPH_REL_PATH);
            let raw = match std::fs::read(&target) {
                Ok(raw) => raw,
                Err(e) => {
                    return fail(
                        err,
                        &format!(
                            "no committed graph at {} ({e}) - run `supertaskr-index index --root {}` first",
                            display_target(&args.root_label, &target),
                            args.root_label
                        ),
                    )
                }
            };
            let graph: crate::Graph = match serde_json::from_slice(&raw) {
                Ok(graph) => graph,
                Err(e) => {
                    return fail(
                        err,
                        &format!(
                            "{} is not a readable schema-1 graph ({e})",
                            display_target(&args.root_label, &target)
                        ),
                    )
                }
            };
            if args.command == Command::ArchBlast {
                // `arch blast` needs the registry for slug resolution and
                // for the component column, and NOTHING else joins here —
                // it is a reverse walk of the graph it just read, not a
                // second model.
                let components = match arch::registry::read_registry(&args.root) {
                    Ok(components) => components,
                    Err(e) => return fail(err, &e.to_string()),
                };
                let report =
                    match arch::blast::blast(Some(&args.root), &components, &graph, &args.targets) {
                        Ok(report) => report,
                        Err(unknown) => {
                            let _ = writeln!(
                                err,
                                "[supertaskr-index] usage: {:?} is not a declared touch_slugs: value - the registry declares [{}]",
                                unknown.slug,
                                unknown.known.join(", ")
                            );
                            let _ = writeln!(
                                err,
                                "[supertaskr-index] a slug nobody declares would otherwise report a confident zero"
                            );
                            let _ = writeln!(
                                err,
                                "[supertaskr-index] a bare word is read as a SLUG; write a directory with a trailing `/` to mean a path"
                            );
                            return EXIT_USAGE;
                        }
                    };
                let _ = write!(
                    out,
                    "{}",
                    arch::blast::render(
                        &report,
                        &args.root_label,
                        &display_target(&args.root_label, &target),
                        raw.len(),
                    )
                );
                return EXIT_OK;
            }
            let model = match arch::model(&args.root, &graph) {
                Ok(model) => model,
                Err(e) => return fail(err, &e.to_string()),
            };
            let _ = writeln!(
                out,
                "graph  {}  bytes={}  files={}  symbols={}  edges={}",
                display_target(&args.root_label, &target),
                raw.len(),
                graph.stats.files,
                graph.stats.symbols,
                graph.stats.edges,
            );
            if args.command == Command::Arch {
                let _ = write!(out, "{}", arch::render_arch(&model));
                return EXIT_OK;
            }
            let _ = write!(out, "{}", arch::render_drift(&model, args.fail_on));
            let _ = writeln!(
                out,
                "note  computed from the COMMITTED graph; `supertaskr-index index --check` is what proves it current"
            );
            match args.fail_on {
                Some(severity) if arch::fails(&model, severity) => EXIT_FINDINGS,
                _ => EXIT_OK,
            }
        }
    }
}

fn render_watch_event(event: &watch::WatchEvent) -> String {
    match event {
        watch::WatchEvent::Started { root, debounce_ms } => format!(
            "[supertaskr-index] watching {} (debounce {debounce_ms} ms) - writing {GRAPH_REL_PATH}",
            root.display()
        ),
        watch::WatchEvent::Skipped { paths } => {
            format!("[supertaskr-index] {paths} change(s), none indexable - graph untouched")
        }
        watch::WatchEvent::Indexed {
            changed,
            files,
            symbols,
            edges,
            duration_ms,
        } => format!(
            "[supertaskr-index] {} ({files} files, {symbols} symbols, {edges} edges, {duration_ms} ms)",
            if *changed {
                "graph.json updated"
            } else {
                "graph.json already current"
            }
        ),
        watch::WatchEvent::Failed { message } => {
            format!("[supertaskr-index] index failed, still watching: {message}")
        }
    }
}

fn display_target(root_label: &str, target: &std::path::Path) -> String {
    if root_label == "." {
        GRAPH_REL_PATH.to_string()
    } else {
        target.display().to_string()
    }
}

fn fail(err: &mut dyn Write, message: &str) -> i32 {
    let _ = writeln!(err, "[supertaskr-index] FAILED: {message}");
    EXIT_FAILED
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testutil::TempTree;

    fn argv(list: &[&str]) -> Vec<String> {
        list.iter().map(|s| (*s).to_string()).collect()
    }

    fn run_capture(list: &[&str]) -> (i32, String, String) {
        let mut out: Vec<u8> = Vec::new();
        let mut err: Vec<u8> = Vec::new();
        let code = run(&argv(list), &mut out, &mut err);
        (
            code,
            String::from_utf8(out).unwrap(),
            String::from_utf8(err).unwrap(),
        )
    }

    #[test]
    fn the_four_exit_codes_are_the_documented_ones() {
        assert_eq!((EXIT_OK, EXIT_FINDINGS, EXIT_USAGE, EXIT_FAILED), (0, 1, 2, 3));
        // The contract is documented where a reader hits it: --help.
        assert!(HELP.contains("0  clean"));
        assert!(HELP.contains("1  finding"));
        assert!(HELP.contains("2  usage"));
        assert!(HELP.contains("3  failed"));
    }

    #[test]
    fn help_and_version_are_exit_zero_on_stdout() {
        for flags in [vec!["--help"], vec!["-h"], vec![]] {
            let (code, out, err) = run_capture(&flags);
            assert_eq!(code, EXIT_OK, "{flags:?}");
            assert!(out.contains("USAGE"), "{flags:?}");
            assert!(err.is_empty(), "{flags:?}");
        }
        let (code, out, _) = run_capture(&["--version"]);
        assert_eq!(code, EXIT_OK);
        assert_eq!(out.trim(), format!("supertaskr-index {VERSION}"));
    }

    #[test]
    fn every_misuse_is_exit_two_and_says_what_was_wrong() {
        for (flags, needle) in [
            (vec!["nonsense"], "unknown command"),
            (vec!["--nope"], "unknown flag"),
            (vec!["index", "--root"], "--root needs a value"),
            (vec!["arch", "drift", "--fail-on", "all"], "undeclared|unmapped|any"),
            (vec!["arch", "--fail-on", "any"], "--fail-on belongs to"),
            (vec!["index", "--check", "--watch"], "mutually exclusive"),
            (vec!["arch", "--check"], "belong to `index`"),
            (vec!["index", "--debounce-ms", "soon"], "wants a number"),
            (vec!["arch", "blast"], "needs at least one PATH or SLUG"),
            (vec!["arch", "blast", "--fail-on", "any"], "--fail-on belongs to"),
            // A positional word outside `arch blast` is still an unknown
            // command — the one command that takes them must not make
            // every other command tolerant of stray arguments.
            (vec!["arch", "drift", "crate-index"], "unknown command"),
            (vec!["index", "crate-index"], "unknown command"),
        ] {
            let (code, out, err) = run_capture(&flags);
            assert_eq!(code, EXIT_USAGE, "{flags:?} -> {err}");
            assert!(err.contains(needle), "{flags:?}: {err}");
            assert!(out.is_empty(), "{flags:?} must print nothing to stdout");
        }
    }

    #[test]
    fn top_level_check_and_watch_are_shorthand_for_the_index_command() {
        assert_eq!(parse(&argv(&["--check"])).unwrap().command, Command::Check);
        assert_eq!(
            parse(&argv(&["index", "--check"])).unwrap().command,
            Command::Check
        );
        assert_eq!(parse(&argv(&["--watch"])).unwrap().command, Command::Watch);
        assert_eq!(
            parse(&argv(&["index", "--watch"])).unwrap().command,
            Command::Watch
        );
    }

    #[test]
    fn flags_accept_both_spellings_and_defaults_are_the_documented_ones() {
        let spaced = parse(&argv(&["index", "--root", "/tmp/x", "--cache-dir", "/tmp/c"])).unwrap();
        let inline = parse(&argv(&["index", "--root=/tmp/x", "--cache-dir=/tmp/c"])).unwrap();
        assert_eq!(spaced.root, inline.root);
        assert_eq!(spaced.cache_dir, inline.cache_dir);

        let bare = parse(&argv(&["index"])).unwrap();
        assert_eq!(bare.root_label, ".");
        assert_eq!(bare.cache_dir, None, "no cache by default - no hidden state");
        assert_eq!(bare.debounce, watch::DEBOUNCE);
        assert_eq!(bare.fail_on, None);
    }

    #[test]
    fn an_invalid_root_is_exit_three_not_exit_one() {
        for flags in [
            vec!["index", "--root", "/nonexistent/supertaskr-t014"],
            vec!["index", "--check", "--root", "/nonexistent/supertaskr-t014"],
            vec!["arch", "--root", "/nonexistent/supertaskr-t014"],
            vec!["arch", "drift", "--root", "/nonexistent/supertaskr-t014"],
        ] {
            let (code, _, err) = run_capture(&flags);
            assert_eq!(code, EXIT_FAILED, "{flags:?}: {err}");
            assert!(err.contains("FAILED"), "{flags:?}: {err}");
        }
    }

    #[test]
    fn a_repo_with_no_registry_fails_arch_rather_than_reporting_no_drift() {
        let t = TempTree::new("cli-noregistry");
        t.write("src/a.ts", "export const a = 1;\n");
        let root = t.root().display().to_string();
        assert_eq!(run_capture(&["index", "--root", &root]).0, EXIT_OK);
        let (code, out, err) = run_capture(&["arch", "drift", "--root", &root, "--fail-on", "any"]);
        assert_eq!(code, EXIT_FAILED, "silence would read as CLEAN: {out}{err}");
        assert!(err.contains("no component registry"), "{err}");
    }

    #[test]
    fn arch_without_a_committed_graph_is_exit_three_not_a_clean_verdict() {
        let t = TempTree::new("cli-nograph");
        t.write("src/a.ts", "export const a = 1;\n");
        let root = t.root().display().to_string();
        for flags in [
            vec!["arch", "--root", root.as_str()],
            vec!["arch", "drift", "--root", root.as_str(), "--fail-on", "any"],
        ] {
            let (code, out, err) = run_capture(&flags);
            assert_eq!(code, EXIT_FAILED, "{flags:?}: {out}{err}");
            assert!(err.contains("no committed graph"), "{err}");
            assert!(err.contains("run `supertaskr-index index"), "names the fix: {err}");
        }
    }

    #[test]
    fn arch_reads_the_committed_graph_and_never_writes() {
        let t = TempTree::new("cli-arch-readonly");
        t.write("src/a.ts", "export const a = 1;\n");
        t.write(
            "docs/architecture/components/C-05-app.md",
            "---\nid: C-05\nname: App\npaths:\n  - src/**\ndepends_on: []\n---\n",
        );
        let root = t.root().display().to_string();
        assert_eq!(run_capture(&["index", "--root", &root]).0, EXIT_OK);
        let graph_path = t.root().join(GRAPH_REL_PATH);
        let before = std::fs::read(&graph_path).unwrap();

        // A source file the COMMITTED graph cannot know about must not
        // move `arch` at all: it reads bytes, it does not index.
        t.write("src/late.ts", "export const late = 1;\n");
        let (code, out, err) = run_capture(&["arch", "--root", &root]);
        assert_eq!(code, EXIT_OK, "{err}");
        assert!(out.contains("component  C-05  App"), "{out}");
        assert!(out.contains("files=1"), "one file, from the committed graph: {out}");
        assert_eq!(
            std::fs::read(&graph_path).unwrap(),
            before,
            "arch must never write"
        );
    }

    #[test]
    fn index_writes_then_check_is_green_then_a_change_makes_it_red() {
        let t = TempTree::new("cli-roundtrip");
        t.write("src/a.ts", "export const a = 1;\n");
        let root = t.root().display().to_string();

        let (code, out, _) = run_capture(&["index", "--root", &root]);
        assert_eq!(code, EXIT_OK);
        assert!(out.contains("wrote"), "{out}");

        let (code, out, err) = run_capture(&["index", "--check", "--root", &root]);
        assert_eq!(code, EXIT_OK, "{err}");
        assert!(out.contains("CURRENT"), "{out}");
        assert!(err.is_empty());

        t.write("src/b.ts", "export const b = 2;\n");
        let (code, out, err) = run_capture(&["index", "--check", "--root", &root]);
        assert_eq!(code, EXIT_FINDINGS, "{out}");
        assert!(err.contains("STALE"), "{err}");
        assert!(err.contains("+ src/b.ts"), "the tail names the file: {err}");
        assert!(out.is_empty(), "a red check says nothing on stdout");

        // Re-index recovers.
        assert_eq!(run_capture(&["index", "--root", &root]).0, EXIT_OK);
        assert_eq!(run_capture(&["index", "--check", "--root", &root]).0, EXIT_OK);
    }

    /// Two components, `deps` written into each in turn.
    fn registry_tree(tag: &str, deps: &[(&str, &str)]) -> TempTree {
        let t = TempTree::new(tag);
        for (id, depends_on) in deps {
            t.write(
                &format!("docs/architecture/components/{id}-x.md"),
                &format!("---\nid: {id}\nname: {id}\npaths:\n  - {id}/**\ndepends_on: [{depends_on}]\n---\n"),
            );
        }
        t
    }

    #[test]
    fn arch_cycles_names_a_declared_cycle_as_a_path_and_exits_one() {
        let t = registry_tree("cli-cycles-red", &[("C-01", "C-02"), ("C-02", "C-01")]);
        let root = t.root().display().to_string();
        let (code, out, err) = run_capture(&["arch", "cycles", "--root", &root]);
        assert_eq!(code, EXIT_FINDINGS, "{out}{err}");
        assert!(err.contains("cycle  C-01 -> C-02 -> C-01"), "{err}");
        assert!(err.contains("verdict  DECLARED CYCLE"), "{err}");
        assert!(out.is_empty(), "a red gate says nothing on stdout: {out}");
    }

    #[test]
    fn arch_cycles_is_green_on_an_acyclic_registry_and_says_what_it_examined() {
        let t = registry_tree("cli-cycles-green", &[("C-01", "C-02"), ("C-02", "")]);
        let root = t.root().display().to_string();
        let (code, out, err) = run_capture(&["arch", "cycles", "--root", &root]);
        assert_eq!(code, EXIT_OK, "{out}{err}");
        assert!(
            out.contains("verdict  ACYCLIC  no declared cycle among 2 components and 1 declared edges"),
            "{out}"
        );
        assert!(err.is_empty(), "{err}");
    }

    #[test]
    fn arch_cycles_needs_no_committed_graph_and_writes_nothing() {
        // The whole reason it is its own subcommand: `arch` and `arch
        // drift` are exit 3 without a graph, and a registry question must
        // not inherit that failure mode.
        let t = registry_tree("cli-cycles-nograph", &[("C-01", "C-02"), ("C-02", "")]);
        let root = t.root().display().to_string();
        assert!(!t.root().join(GRAPH_REL_PATH).exists());
        assert_eq!(
            run_capture(&["arch", "--root", &root]).0,
            EXIT_FAILED,
            "arch needs a graph"
        );
        assert_eq!(
            run_capture(&["arch", "cycles", "--root", &root]).0,
            EXIT_OK,
            "arch cycles does not"
        );
        assert!(
            !t.root().join(GRAPH_REL_PATH).exists(),
            "arch cycles must never create the graph it does not read"
        );
    }

    #[test]
    fn arch_cycles_without_a_registry_is_exit_three_not_a_clean_verdict() {
        let t = TempTree::new("cli-cycles-noregistry");
        t.write("src/a.ts", "export const a = 1;\n");
        let root = t.root().display().to_string();
        let (code, out, err) = run_capture(&["arch", "cycles", "--root", &root]);
        assert_eq!(code, EXIT_FAILED, "silence would read as ACYCLIC: {out}{err}");
        assert!(err.contains("no component registry"), "{err}");
        assert!(out.is_empty(), "{out}");
    }

    #[test]
    fn fail_on_is_still_refused_for_arch_cycles() {
        let (code, _, err) = run_capture(&["arch", "cycles", "--fail-on", "any"]);
        assert_eq!(code, EXIT_USAGE);
        assert!(err.contains("--fail-on belongs to"), "{err}");
    }

    /// `arch blast` end to end through the binary's own surface: a real
    /// tree, a real registry, a real committed graph, and the three
    /// answers it owes — the count, the slug resolution, and the refusal.
    #[test]
    fn arch_blast_reads_the_committed_graph_and_reports_rather_than_gating() {
        let t = TempTree::new("cli-blast");
        t.write("src/hub.ts", "export const hub = 1;\n");
        t.write("src/a.ts", "import { hub } from './hub';\nexport const a = hub;\n");
        t.write("src/b.ts", "import { hub } from './hub';\nexport const b = hub;\n");
        t.write(
            "docs/architecture/components/C-05-app.md",
            "---\nid: C-05\nname: App\npaths:\n  - src/**\ndepends_on: []\ntouch_slugs: [app-shell]\n---\n",
        );
        let root = t.root().display().to_string();
        assert_eq!(run_capture(&["index", "--root", &root]).0, EXIT_OK);
        let graph_path = t.root().join(GRAPH_REL_PATH);
        let before = std::fs::read(&graph_path).unwrap();

        let (code, out, err) = run_capture(&["arch", "blast", "src/hub.ts", "--root", &root]);
        assert_eq!(code, EXIT_OK, "a reporter is exit 0: {out}{err}");
        assert!(out.contains("dependents=2"), "{out}");
        assert!(out.contains("computed from the COMMITTED graph"), "{out}");
        assert!(err.is_empty(), "{err}");
        assert_eq!(
            std::fs::read(&graph_path).unwrap(),
            before,
            "arch blast must never write - the number is DERIVED"
        );

        // A fence SLUG resolves through the component's own touch_slugs:.
        let (code, out, err) = run_capture(&["arch", "blast", "app-shell", "--root", &root]);
        assert_eq!(code, EXIT_OK, "{err}");
        assert!(out.contains("kind=slug  components=C-05  files=3"), "{out}");

        // A slug nobody declares is exit 2, never a confident zero.
        let (code, out, err) = run_capture(&["arch", "blast", "app-shel", "--root", &root]);
        assert_eq!(code, EXIT_USAGE, "{out}");
        assert!(err.contains("not a declared touch_slugs:"), "{err}");
        assert!(err.contains("app-shell"), "it names what IS declared: {err}");
        assert!(out.is_empty(), "{out}");

        // A PATH with no graph entry is not an error: it is a class.
        let (code, out, err) = run_capture(&["arch", "blast", "method/x.md", "--root", &root]);
        assert_eq!(code, EXIT_OK, "{err}");
        assert!(out.contains("coverage=non-code"), "{out}");
    }

    #[test]
    fn arch_blast_without_a_committed_graph_is_exit_three_not_an_empty_report() {
        let t = TempTree::new("cli-blast-nograph");
        t.write("src/a.ts", "export const a = 1;\n");
        let root = t.root().display().to_string();
        let (code, out, err) = run_capture(&["arch", "blast", "src/a.ts", "--root", &root]);
        assert_eq!(code, EXIT_FAILED, "silence would read as zero dependents: {out}{err}");
        assert!(err.contains("no committed graph"), "{err}");
    }

    #[test]
    fn check_writes_nothing_at_all() {
        let t = TempTree::new("cli-check-readonly");
        t.write("src/a.ts", "export const a = 1;\n");
        let root = t.root().display().to_string();
        let (code, _, _) = run_capture(&["index", "--check", "--root", &root]);
        assert_eq!(code, EXIT_FINDINGS, "missing graph is stale");
        assert!(
            !t.root().join("docs").exists(),
            "--check must never create the graph it is checking"
        );
    }
}
