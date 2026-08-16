---
id: T-020-s2
title: cargo audit exits 0 on unmaintained/unsound advisories — the CI step is green on 17 today
status: suggested
suggested_by: executor claude-opus-5 @T-020
---

T-020 absorbed T-009-s3 with the promise that "a RUSTSEC advisory
against the pins becomes a visible failure prompting deliberate re-pin
+ re-review, never silence" (criterion), and the plan §6 said the
failure is HARD, never `continue-on-error`. Plain `cargo audit`
delivers half of that: **vulnerabilities** exit non-zero, but
**warnings** (`unmaintained`, `unsound`, `yanked`) are printed and the
command still exits **0**.

Measured at build time (cargo-audit 0.22.2, 472 locked crates,
app/src-tauri/Cargo.lock): **0 vulnerabilities, 17 warnings** — the
gtk-rs GTK3 binding family unmaintained (RUSTSEC-2024-0411 through
-0420, ten crates), `glib` 0.18.5 **unsound** (RUSTSEC-2024-0429),
`proc-macro-error` unmaintained (RUSTSEC-2024-0370), and the `unic-*`
family unmaintained (RUSTSEC-2025-0075/0080/0081/0098/0100). Every one
arrives transitively under Tauri v2's own tree — none is ours to
re-pin, and the fix for all of them is upstream.

So the shipped step will be green while sixteen unmaintained crates
and one unsound iterator sit in the lock, and it will STAY green if an
eighteenth lands overnight. That is exactly the silence T-009-s3 was
filed against, one severity class lower than the one we closed.

The fork, for the architect:

1. **Keep plain `cargo audit`** (shipped today). Vulnerabilities are a
   hard fail; warnings are visible in the run log and reviewed by a
   human reading it. Cheap, honest about what it does, and nobody has
   to maintain a list — but "visible in the log" is precisely the kind
   of politeness this project usually refuses to rely on.
2. **`cargo audit -D warnings`** — the promise, literally. It fails
   the lane TODAY on the 17 above, so it needs either an ignore list
   (`--ignore RUSTSEC-…` or audit.toml) with a dated reason per entry,
   or a red main until Tauri's tree moves. An ignore list is an
   allowlist, which the token lint deliberately refused to have; the
   difference here is that these are third-party facts we cannot fix,
   not our own escape hatches, and a dated per-ID reason is reviewable
   in a way `p-[13px]` never was.
3. **Split the step**: `cargo audit` (hard, vulnerabilities) plus
   `cargo audit -D warnings` as a separate non-blocking-by-design
   step. Rejected in advance as theater unless someone actually reads
   yellow runs.

Whatever is chosen belongs in CONVENTIONS next to the command, because
the exit-code semantics are the whole meaning of the step.
