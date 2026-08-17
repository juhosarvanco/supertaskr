//! The `nputer-index` binary (T-014) — a shim, on purpose.
//!
//! Everything it does lives in the library (`nputer_index::cli::run`), so
//! the same code path is driven three ways: in-process unit tests, the
//! integration suite spawning this executable for real exit codes, and
//! the future Node CLI shelling out to it (ADR-003/ADR-015).

fn main() {
    let argv: Vec<String> = std::env::args().skip(1).collect();
    let mut out = std::io::stdout().lock();
    let mut err = std::io::stderr().lock();
    let code = nputer_index::cli::run(&argv, &mut out, &mut err);
    // Flush before exiting: `process::exit` does not run destructors, and
    // a gate whose last line is lost is a gate nobody can act on.
    use std::io::Write;
    let _ = out.flush();
    let _ = err.flush();
    std::process::exit(code);
}
