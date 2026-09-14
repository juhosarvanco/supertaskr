# Verification: drills, controls and honest scope

The poison drill, the sweep a fix owes, the control a negative assertion needs, the guard lifted to discriminate, and what the e2e lane really covers.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- POISON DRILL (ratified at T-054; until then "poison", "vacuous" and
  "mutation" appeared nowhere in this file or in method/roles/): at any
  task that ADDS OR CHANGES a test body — the executor before handing
  off, the verifier before a verdict, the integrator before a checkpoint
  — MUTATE every new or changed assertion so that it ought to fail, RUN
  its suite, and require the RED. MUTATE ONE SIDE ONLY: the code under
  test OR the assertion, never a literal the two SHARE; and confirm the
  mutated TEXT is what you intended rather than only that a substitution
  COUNT was non-zero — a symmetric mutation produces a green
  indistinguishable from a vacuous assertion, and a `perl -0777`
  mutation once counted one substitution and changed nothing observable
  (T-078), so READ THE MUTATION BACK with `git diff` before you run the
  suite. Then restore, and PROVE the restoration: `git show HEAD:<path>
  | shasum -a 256` against the working file. The generic judging rules —
  kill-set containment, the site the property lives, a DATA mutant where
  the property is data — are method/roles/verifier.md step 2b.
  **THE SHA256 IS THE PROOF AND AN EMPTY `git diff -- <path>` IS A
  COMPANION, NEVER AN ALTERNATIVE** (T-092-s4): `git checkout <commit>
  -- <path>` writes the INDEX as well as the worktree, so a following
  bare `git checkout -- <path>` restores FROM THE MUTATION'S OWN SOURCE
  and a rangeless `git diff` reports 0 bytes on the wrong file. Restore
  with `git restore --source=<commit> --staged --worktree -- <path>` and
  keep the hash. **DRILL AT A COMMIT** (T-072-s1): a restore cannot tell
  itself from a revert, and both proofs are satisfied by a restore that
  threw away work HEAD never saw; the scratch-SNAPSHOT alternative needs
  its OWN proof, `cmp` against the snapshot.
  **AND RESTORING A FIXTURE MEANS ITS BYTES AND ITS CLOCK** (T-079-s3,
  T-130-s1): sibling bodies read the MTIME, and `git diff --quiet`
  answers from the index's cached stat info. Restore the clock through
  the SECONDS form — `utimesSync(target, stats.atimeMs / 1000,
  stats.mtimeMs / 1000)` — never through a `Date`, which writes back a
  ROUNDED timestamp. **THE LOSSY FORM SELF-HEALS**: it leaves the file on
  a whole millisecond, so the next run rounds to a no-op and passes —
  **re-running until green is the defect's own healing mechanism, not
  evidence.** The same fixed point defeats a POISON of a clock assertion
  (T-153-s5), so **before poisoning an assertion over PERSISTENT state,
  put that state back to a condition the suite did not create.** The
  round-trip's precision is scoped by the libuv VERSION, not the
  platform (microseconds under v1.51.0; T-153-s5 carries both versions'
  bounds), so print `process.versions.uv` beside any figure that depends
  on it.
  RECORD the count and the restoration proof in the notes, the verdict
  or the checkpoint — "133-for-133" is the shape (T-027), "drills run"
  is not.
  **A COMPARISON IS EVIDENCE ONLY ONCE ITS EXPECTED SIDE IS ASSERTED
  NON-EMPTY** (shape TEN), and **A COMMAND QUOTED AS PROOF IS SHOWN
  CAPABLE OF FAILING** (T-078-s11): a diff-based check NAMES ITS RANGE —
  `git diff` with NO RANGE compares the WORKING TREE to the INDEX, 0
  bytes on any clean tree — and a search-based one is run once against
  a PLANTED HIT before its zero is written down.
  **DRILL IN A DETACHED SCRATCH WORKTREE AT A NAMED COMMIT, AND GIVE IT
  ITS OWN `CARGO_TARGET_DIR` INSIDE ITSELF — AT `<scratch>/target`, NOT
  AT A NAME YOU CHOSE** (T-013-s7 arm (c); four agents bitten, T-145-s3
  the latest). Several Rust bodies bake `env!("CARGO_MANIFEST_DIR")` in
  at COMPILE time, which cargo does not fingerprint, so binaries the
  DRILL compiled are reused by the parent afterwards (T-013's card has
  the wreckage) and a mutant can look DEAD against a stale binary that
  never saw it. Where `cargo clean` is prohibited — it is, whenever
  another lane may be building — the recovery is to `touch` EVERY
  workspace `.rs` and rebuild (T-145-s3); touching only the file the
  panic NAMED yields a second red. The directory's NAME is not free:
  `.gitignore` excludes `target/` and nothing else, so a target dir
  under any other name is INDEXED and `index --check` answers
  confidently and wrongly with phantom files (T-111-s10, T-153-s3) —
  and **`files +0 -0` is the sentence a checkpoint decides on**.
  Skipping any directory carrying cargo's `CACHEDIR.TAG` is the CLASS
  fix and `crate-index`'s code. Drilling in place is not the remedy:
  true of the INSTANCE, not the CLASS, and an interrupted drill leaves
  the branch dirty for every concurrent reader.
  **AND THE SCRATCH IDENTITY IS DERIVED FROM THE LANE, NEVER CHOSEN**
  (T-092 holds the four-lane census). The scratch directory is SHARED
  between concurrent sessions whatever its UUID suggests, and naming the
  WORKTREE per-lane is not enough (T-110's driver and results files were
  overwritten by a sibling): DERIVE ONE STEM FROM THE LANE ID and spend
  it on the worktree, its `CARGO_TARGET_DIR`, the driver AND every
  results file, cut at a SHORT root (`T-133-s5`); the driver's guard
  SHALL recognise its OWN drill rather than the shared prefix. **A
  DERIVED PATH IS A CONSTRUCTION AND A FIXED PATH IS THE DEFECT.** And
  the app suite needs `npm run build` before it can be drilled — build,
  baseline, then mutate.
  IF a body cannot be poisoned — it asserts a constant, or every
  mutation is one the test already makes — THEN say so and name it: a
  body that cannot red is the finding (six vacuous assertions in one
  night, T-057). It stays a DISCIPLINE rather than a gate because
  nothing can automate "would this have failed". WHAT THE DRILL CANNOT
  SEE (T-057): poisoning proves a body RUNS and that its value MATTERS,
  not that it is no DUPLICATE — a CARD can specify a duplicate into
  existence and a faithful executor will build it — so after the drill
  reds, ask whether any OTHER test already drives this exact call.
  THE CATALOGUE OF SHAPES A VALUE POISON PASSES. Cite them by number —
  other cards do. **IT IS CLOSED AT ELEVEN AND EVERY ORDINAL IS MINTED
  HERE** (T-092); **ENTRIES LIVE HERE FOR FIVE THROUGH ELEVEN ONLY**
  (T-092-s5) — ONE to FOUR are the *matcher moved, value fixed* family,
  named before this catalogue existed, and their histories live in the
  cards. Each entry carries its TELL, whether it has a MECHANICAL
  REMEDY, and the card the instance lives on.
  `snapshot_version_matches_the_live_method_stamps`
  (kit.rs) and
  `the_only_production_path_to_the_transcript_is_the_bounded_one`
  (agent/mod.rs).
  TELL: an argument against FIVE's remedy — a
  cardinality floor answers DELETION and nothing else.
  TELL:
  a comparison nothing proved had anything on either side (`T-083-s3`:
  a `merge-tree --write-tree` that exited 1, and a loop that word-splits
  under `bash` and not `zsh`).
  The catalogue of the eleven shapes a value poison passes, each with
  its TELL, whether it has a mechanical remedy and the card its
  instance lives on, is in docs/reference/07-verification.md (T-290),
  verbatim and still cited by number.

- A FIX NAMES ITS CLASS AND ITS SWEEP, OR RECORDS THAT NONE WAS RUN
  (T-078-s12). A defect found in one place is a defect of a CLASS until
  somebody looks:
  So: NAME the class, run ONE search for it,
  and record the result **even when it is empty** — an unrecorded sweep
  and an unrun one are indistinguishable to the next reader. **And the
  sweep is shown capable of failing before its zero is written down**
  (the POISON DRILL's proof clause), because a search that finds nothing
  is what a finished job looks like.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/07-verification.md (T-290), verbatim.

- A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL (T-060-s2, written down
  at T-078). A test that asserts something is REFUSED must first prove
  the fixture would otherwise have been ACCEPTED: a bare "expected
  nothing, got nothing" is satisfied equally by
  refused-for-the-right-reason, refused-for-the-wrong-reason and
  there-was-nothing-there, and only the first is the property. For a
  PATH-SHAPED fixture the control is BUILT the way the producer builds
  it, not written to look similar — the fixed body in
  `app/src-tauri/src/agent/runner.rs` is the worked example. ITS
  SIBLING FROM THE OTHER DIRECTION: A TEST PARAMETRISED BY THE CONSTANT
  IT CHECKS CANNOT PIN THAT CONSTANT (T-063 — the deadline family
  stayed green at `8_000_000`; one test now pins the literal). One
  lesson, two faces: an assertion that moves with the thing it is
  checking is checking nothing.
  AND CENSUSES, NOT ONLY TEST BODIES (T-142): a crash is a finding; a
  ZERO is what you hoped for. Before a count reaches a card, brief or
  STATE, show the query able to answer otherwise: a ref where it is
  known non-zero, or one planted instance. WHY SILENT: frontmatter keys
  are snake_case and model properties camelCase, so a MODEL census for
  `blocked_by` and a FRONTMATTER one for `blockedBy` both return zero
  and read clean.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/07-verification.md (T-290), verbatim.

- LIFTING A SAFETY GUARD TO DISCRIMINATE (T-060-s1, written down at
  T-078). A guard test needs a discriminating half, but the
  discriminating half of a SAFETY guard is by construction a deliberate
  removal of the safety — THE STRONGER THE GUARD, THE MORE DANGEROUS
  ITS OWN DISCRIMINATOR. Both of these, not either: the LIFTED arm
  SHALL be proven to TERMINATE IN A FIXTURE — pointed at one, not
  merely started at one — and the body SHALL assert the guard's STATE
  before it exercises anything (T-060's first draft executed the
  developer's REAL CLI inside the very test written to prove that
  cannot happen). It applies to every guard this project has, and most
  are safe only because their lifted behaviour touches fixtures — a
  property to CHECK, never to assume.

- THE E2E LANE'S HONEST SCOPE (T-049-s1, recorded rather than coded —
  the two arms below stay available and were deliberately not taken):
  tools/e2e covers what a BROWSER can reach, and Tauri-gated
  affordances are jsdom-plus-@human territory. `runPicker` opens with a
  not-Tauri early return, so an accelerator's ACTION is unobservable in
  the served bundle — the lane can prove a chord was CLAIMED, never that
  it was OBEYED — and both header buttons are gated behind
  `isTauriRuntime()`, so the one screen where they live is the one
  screen the lane cannot show. So do not read a green lane as coverage
  of an IPC path: the Rust suite, the boot gate and @human's eye cover
  those.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/07-verification.md (T-290), verbatim.
