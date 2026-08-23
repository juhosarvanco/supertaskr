---
id: T-085
title: A package-relative docs path is invisible to every arm of the docs gate — and one is live on bare cargo test
feature: F-06
milestone: 4
priority: 43
size: M
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-084-s8, T-084-s1 (fifth triage, 2026-08-20). Both files
removed in this commit.

**The docs gate's bound has a measured hole, and the tree holds one
live instance.** `docs-scan.mjs`'s `ROOT_ANCHOR_LEDGER` doc comment
asserts a universal — *"a file that holds this repository's root is the
only kind of file that CAN read this repository's docs/"* — and it is
false: a docs path expressed RELATIVE TO A PACKAGE DIRECTORY reads the
live tree while holding no root, and escapes all four mechanisms in
silence.

The live instance is `app/src-tauri/tests/agent_runner.rs:1761`:

    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../docs/research/captures/real-planner-turn-2026-08-19.jsonl")

Measured at T-084's merge, not argued: mutate one field of that capture
and `docs-gate.mjs` fires owing **only** `npm test from tools/e2e/`
(121/121, exit 0) while bare `cargo test` goes **351/1/3, exit 101**.
An integrator who obeys the gate merges a red tree — BLOCKING 1's own
sentence, surviving its fix, on a fifth prefix.

**How the hole was found and then found again.** The verifier
falsified the universal with the JS spelling (`resolve("../docs/…")`),
found zero instances, and filed rather than rejected. The integrator
then found the Rust spelling live — the verifier had probed for the
idiom it expected rather than the one the tree uses, the same error it
had confessed one section earlier about `perf.rs`. The package-dir form
appears **21 hits across 9 files in `app/test` alone** (integrator's
re-derivation; the verdict's 9-across-5 was an undercount), so the next
instance is one character away.

T-084-s1's shape folds in here: a docs path behind an imported
constant is one hop of *import* following, the mirror of the call-arm
tracing T-084's fix already does for functions.

## Acceptance criteria

- THE ledger's universal SHALL be corrected to what is true — the
  scanner's mechanisms cover ROOT-anchored reads, and package-relative
  reads are a distinct class — OR `docsSites` SHALL resolve the literal
  against its file's package directory before judging it, which
  subsumes the `docs`-first rule rather than replacing it. State which
  arm and why; T-084-s8 recorded both.
- IF the resolution arm is taken THEN the discriminator that kept
  `lib/parser/test/files.test.ts` OUT (a fixtures-directory base) SHALL
  be shown to still hold — widening that lets fixture readers flood the
  reader set, which is the over-owing failure T-084's third way exists
  to avoid.
- **THE LIVE INSTANCE SHALL BE DERIVED, NOT LISTED**: after the fix,
  `agent_runner.rs` SHALL appear as a reader of
  `docs/research/captures/` owed by `cargo test`, produced by the
  derivation with no ledger entry naming it by hand.
- THE T-084 verdict's mutant SHALL be re-run: one field of the live
  capture mutated, and the gate SHALL owe a suite that actually reds —
  bare `cargo test` — never only a green one.
- A pin SHALL prove the package-relative class is covered by
  construction: plant a reader using `CARGO_MANIFEST_DIR` + `../../docs`
  in a scratch file AND one using a JS `resolve("../docs/…")`, and
  require both derived. Read the mutated text back; the verifier's
  probe missed the live instance by spelling.
- IF a docs path resolves OUTSIDE the repository (a `../../..` that
  escapes) THEN it SHALL be excluded and the exclusion asserted — the
  gate must not acquire readers in other repos.

Verification: headless — the docs-gate spec suite from tools/e2e, the
planted-reader pins, and the re-run mutant showing the owed suite reds.
Every figure carries the ref it was measured at. @human: none.
