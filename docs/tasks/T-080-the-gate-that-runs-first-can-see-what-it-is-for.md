---
id: T-080
title: The gate that runs first can see what it is for — a corpus floor, a sample that discriminates, and two exit codes
feature: F-02
milestone: 4
priority: 38
size: M
status: verifying
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by: claude-opus-5 @fresh
verified_by:
review:
---

Absorbs: T-058-s1, T-058-s2, T-058-s4 (fourth triage, 2026-08-19). The
suggestion files are removed in the same commit as this card. T-058-s3
went to **T-074** — it is a comment correction in a file this card does
not touch.

ONE MECHANISM: **the gate designed to run against a bare checkout is
blind to the regressions the seventeenth-step Playwright lane catches,
and CI runs it FIRST.** Three findings, three faces of it, all in
`tools/e2e/scripts/token-scan.mjs` and its focused spec.

THE CORPUS POLICY IS ITSELF UNPINNED. T-058 ships CONTROL as a DENY list
— tracked files, minus skip directories, minus a binary-extension set —
and that is the right shape; an allowlist of text suffixes would
silently omit the next first-party text format. The gap is one rung up:
the binary-extension set IS the policy and almost nothing pins it. Ten
suffix classes are held by name-pinned files; the rest are held only by
six root-non-emptiness rows, which survive losing any one suffix as long
as the root keeps a single file of some other suffix.

**RE-DERIVED AT `9b15f7d`, and this is the number of record.** The card's
own figures were honest for the commit they were measured at; the corpus
has since moved. Derived by calling the shipped `corpus("CONTROL")` and
classifying with **Node's `path.posix.extname`, exactly as the module
does** — a naive shell split disagrees, because under `extname` a
dotfile has NO extension, and that row is one of the silent ones:

    CONTROL 529 files, TOKEN 118, 18 suffix classes.
    Silent (unpinned): .tsx 46, .rs 44, (no extension) 10, .js 3,
                       .jsx 2, .cts 2, .mts 1, .txt 1  =  109 files.
    109 of 529 = 20.6%.  Only .md grew since the branch: 248 -> 256.

So **eight suffix classes and 109 files can leave the gate with nothing
red**, and the two largest are exactly the classes the architect's
2026-08-18 ruling named out loud — the app's entire UI tree and the Rust
half. Confirmed by execution on the branch, not only by analysis: adding
one extension line drops all 44 Rust files and leaves the selftest, the
lint and the focused suite all green.

DELETING AN ASSERTION DELETES ITS OWN FAILURE. The scanner builds its
evidence as three self-enumerating arrays and the selftest iterates
each, failing per element; the green line then PRINTS the cardinality
and nothing compares it to anything. Measured, four deletions each
applied alone and reverted with the file restored by hash: every one
left the run green at a smaller number, and the sharpest lost the only
positive sample for each of four patterns and stayed green everywhere.
**This is poison shape five and T-078 numbers it**; the module already
records T-045 measuring exactly this class and defends precisely one
property against it.

AND THE ONE P5 POSITIVE IS THE ONE VALUE WITH NO HEX LETTERS. The report
format is load-bearing — the byte is invisible, so the report is the
only description of it a reader ever gets. The single positive control
sample is U+0000, whose hexadecimal form contains no letters, so
uppercasing is a no-op on it and the selftest cannot tell the shipped
formatter from a lowercase one. Measured: dropping the uppercase call
leaves the bare-checkout selftest at exit 0 while the focused suite reds
twice. **The suite catches it and the gate that runs first does not**,
which is the wrong way round for a property whose whole purpose is to be
readable in a checkout with nothing installed.

## Acceptance criteria
- CONTROL SHALL GAIN A COVERAGE FLOOR of the same kind TOKEN already
  has, and for the same stated reason — a policy that quietly drops a
  tree has to fail against something that did not move with it. EITHER
  a named set of suffix classes the corpus must cover, OR a check that
  every suffix present in the tracked file list minus the binary set is
  present in the corpus. **The second is preferred**: it cannot go stale
  when a new first-party text format arrives, which is the property the
  deny list was chosen for in the first place. The selftest already has
  both corpora in hand when it runs.
- THE FLOOR SHALL BE PROVED TO BITE: adding a suffix class to the binary
  set SHALL red the selftest, demonstrated for at least `.rs` and
  `.tsx`, then reverted with the restoration proved by hash.
- NEITHER CORPUS COUNT SHALL BE PINNED AS A LITERAL. The executor SHALL
  re-derive, as T-058's own ruling required — 529 and 118 are this
  card's evidence, not its expected values.
- THE EVIDENCE SET SHALL GAIN A CARDINALITY OR COVERAGE FLOOR OF ITS
  OWN, so a deleted assertion fails against something that did not move
  with it. **A per-pattern floor is better than a literal count** — every
  pattern id has at least one positive sample, and the control pattern
  has at least one positive and one negative — because it survives
  honest additions and still catches a removal.
- P5 SHALL GAIN A SECOND RUNTIME-BUILT POSITIVE SAMPLE whose forbidden
  byte renders with a hex LETTER, and whose expectation names the
  rendered string LITERALLY rather than recomputing the formatter. The
  negative sample stays; the allowlist stays at zero. **The general form
  SHALL be recorded in the notes**: a sample whose expected value is
  produced by re-running the production formula pins the pipeline, not
  the format — the focused suite has the same property and only catches
  the mutation because it happens to test bytes whose hex has letters.
- THE GATE SHALL DISTINGUISH "COULD NOT RUN" FROM "FOUND SOMETHING".
  Today a tree the gate cannot read (git absent, the corpus underivable)
  and a tree with a real violation both exit 1, so CI's first step
  cannot say which happened. A distinct exit code for the underivable
  case SHALL be added and **T-078's legend criterion SHALL gain the row
  when this lands**; the two cards are written so neither blocks the
  other.
- THE SAMPLE CONSTRUCTION DISCIPLINE SHALL HOLD: every positive control
  sample is built at runtime from a character code and never typed into
  the source, because a source file carrying a literal control byte
  would trip the gate it is testing and would itself be unsearchable.

Verification: headless — the lint, the selftest, and the focused suite,
each with its mutation applied alone and reverted, restorations proved
by hash rather than by a clean `git status`.

## Implementation notes

Built by **claude-opus-5 @fresh** on `task/T-080-gate-sees` from
`16bb47b`; build commit `fef8870`, three files, all inside the
`tools/e2e/**` fence. **Every count below carries the ref it was derived
at.** No count in the card or the dispatch brief was trusted: the corpus
is a function of the tree, and that number has been 521, 529, 502, 496
and 507 — each true at a different commit.

### The tree at `16bb47b`, re-derived rather than quoted

Classified with Node's `path.posix.extname`, exactly as the module does,
by calling the shipped `corpus()`:

    tracked 525 · TOKEN 118 · CONTROL 507 · 525 - 18 binary assets = 507
    22 tracked suffix classes, 18 of them in CONTROL
    PINNED by a name-pinned file (10): .css .html .json .lock .md .mjs
                                       .toml .ts .yaml .yml
    UNPINNED (8): .tsx 46 · .rs 44 · (no extension) 10 · .js 3 ·
                  .jsx 2 · .cts 2 · .mts 1 · .txt 1  = 109 files
    109 of 507 = 21.5%

The card's `9b15f7d` figure was 109 of 529 = 20.6%. **The unpinned SET
is identical** — same eight classes, same 109 files — so only the
denominator moved. A shell `${f##*.}` split disagrees with this table:
under `extname` a dotfile has NO extension and joins the
`(no extension)` row, which is one of the eight.

### All three findings reproduced at `16bb47b` BEFORE anything was built

- **s1.** One line added to `CONTROL_BINARY_EXTENSIONS`: `.rs` took
  CONTROL 507 -> **463**, `.tsx` took it 507 -> **461**, and the lint AND
  the selftest both exited **0** both times.
- **s2.** Deleting the six CONTROL root rows left the selftest green at
  **31** walk-policy checks instead of 37. Deleting the first six TOKEN
  positives left it green at **43** samples instead of 49, with the lint
  also at exit 0.
- **s4.** Dropping `.toUpperCase()` from `codepoint()` left the selftest
  at **exit 0** — 49 + 2 samples, 37 checks, all green — while the
  focused suite went **red twice**. The gate that runs first was blind to
  what the seventeenth step catches.

### The card's preferred floor formulation cannot bite, and this is the
### finding that shaped the build

Criterion 1 prefers "a check that every suffix present in the tracked
file list minus the binary set is present in the corpus". Read literally
that check **can never fail**: the corpus is DEFINED as tracked minus
the skip dirs minus that set, so adding `.rs` to the deny list removes
`.rs` from the expectation at the same instant it removes it from the
corpus. The deletion would delete its own failure — the exact shape the
floor exists to close, one rung up. Criterion 2 requires the floor to
bite for `.rs` and `.tsx`, so criteria 1 and 2 as written are in
tension. Filed as `T-080-s1`.

**Resolved by making the exemption a SECOND list**
(`CONTROL_UNCOVERED_SUFFIXES`), which is the shape `MUST_TOKEN_COVER`
already uses one rung up and for the same stated reason. That keeps the
property criterion 1 wanted — a new first-party TEXT format needs no
edit, because it is tracked, not exempt, and already covered — while
making a deny-list addition fail against something that did not move
with it. Both of the card's options are implemented, not one:

- **Rung A (derived, cannot go stale).** Every tracked suffix class is
  covered COMPLETELY unless declared in `CONTROL_UNCOVERED_SUFFIXES`;
  and every declared class really is absent, so the two lists must agree
  in BOTH directions.
- **Rung B (named, survives a two-list edit).** `MUST_CONTROL_COVER` =
  `.rs .ts .tsx .md`, the classes the architect's 2026-08-18 ruling
  named out loud, covered completely WITHOUT consulting the exemption
  list.
- **Rung C (derived).** Every tracked top-level entry keeps all of its
  non-exempt files — which is what a new `SKIP_DIRS` entry takes away,
  and rung A cannot see because a class survives in other directories.

The tracked side is deliberately **unfiltered by `SKIP_DIRS`**: filter
it and rung C becomes a tautology too. Zero tracked files sit under a
skip directory at `16bb47b`, so this is exact today rather than lenient.

### The evidence floor is per-pattern, never a count

`evidenceFloorChecks()` generates one row per id in **`TOKEN_PATTERNS`**
— the production list, so a pattern cannot be retired by deleting its
floor row — plus a TOKEN-negative row, a P5-positive row, a P5-negative
row, and the row that closes s4: **at least one P5 positive whose
rendered codepoint carries a hex LETTER**. Eight rows at this ref. No
number in it is a literal expectation; adding a sample moves nothing.

### P5's samples, and the general form the card asked to be recorded

`CONTROL_SAMPLES` is now four: U+0000 after a non-ASCII prefix (the
T-058 original), **U+001B**, **U+007F**, and the tab/LF/CR negative. The
allowlist stays at zero and every forbidden byte is still built from a
character code.

**THE GENERAL FORM: a sample whose expected value is produced by
re-running the production formula pins the PIPELINE, not the FORMAT.**
It agrees with the implementation by construction, so prefix, case and
padding can all change together with nothing red. The focused suite's
exhaustive sweep is exactly this shape — it maps
`` `U+${byte.toString(16).toUpperCase().padStart(4,"0")}` `` over the
bytes — and it only catches the lowercase mutation because it happens to
test bytes whose hex has letters. It is a *second copy* of the formula,
not a call to it, which is why it catches anything at all; a version
that called `codepoint()` would catch nothing. The remedy in both files
is the same: **write the expected string out**. The selftest samples name
`"U+001B"` and `"U+007F"` literally, and the spec gained a four-row
literal table beside the sweep it does not replace.

### Two exit codes become three

`0` clean · `1` the gate ran and FOUND something · `3` **the gate could
not run**. `2` is left unused and reserved for `usage`, the meaning
`index --check` gives it, so a future flag check renumbers nothing a
checkpoint has quoted. `3` is `index --check`'s number for the same
meaning, which is the only reason to prefer it over 2.

The wrapper's catch is **total by design**: every throw out of the
scanner means the scan did not complete, and a run that did not complete
is not a claim about the tree. It is a catch and never a rescue — exit 3
still fails the CI step, and `process.exit(EXIT.FOUND)` inside
`lintTree`/`selftest` is not interceptable by it.

**`docs/CONVENTIONS.md` was NOT touched** — it is T-078's fence and
T-078 is in a post-rejection fix as this is written. T-078's branch tip
`5b5e1c7` already legends today's behaviour and names this card as the
one that restores the distinction ("this legend gains its second row
when it lands"). The row it should gain is: **exit 3 - the gate could
not run (git absent, the corpus underivable, any throw)**.

### The poison drills, three limbs each

Every mutation was **one-sided** (never a literal the producer and the
assertion share), **broke the relation the assertion claims**, and was
**read back as TEXT** — the mutated line printed, or a structural count
recomputed from the file — never trusted to perl's substitution count.
Restorations are `git show HEAD:<path>` plus sha256, never a clean
`git status`.

Two mutations that did NOT land were caught by that third limb and
re-run rather than reported: a BSD-`grep` `\+` pattern silently matched
nothing, and a perl regex over a line containing `é` never fired. Both
would have been recorded as green survivors.

| # | mutation | result |
|---|----------|--------|
| a | `.rs` joins the deny list | selftest **red**, 3 named rows (`0/44`) |
| b | `.tsx` joins the deny list | selftest **red**, 3 named rows (`0/46`) |
| c | `SKIP_DIRS` gains `docs` | selftest **red**, 10 rows incl. `docs/ 0/171` |
| d | `.rs` declared binary in BOTH lists | selftest **red**, rung B alone |
| f | the only P4 positive deleted | **red**: `P4 has a positive sample (0)` |
| g2 | the P5 negative deleted | **red**: `P5 has a negative sample (0)` |
| i | `codepoint()` stops uppercasing | selftest **red** twice (was green) |
| j | `codepoint()` stops padding | selftest **red** three times |
| k | `U+` prefix lowercased | selftest **red** three times |
| l2 | both lettered P5 positives deleted | **red**: hex-letter floor `(0)` |
| m | the catch exits FOUND | focused spec **red**, body 8 only |
| n | wrapper reverted to its pre-T-080 body | **red**, `Received: 1` |
| o | `CANNOT_RUN` renumbered to 4 | focused spec **red**, body 8 only |
| t | the catch exits 0 (T-046's hazard) | focused spec **red**, body 8 only |
| v | floor unwired AND `.rs` denied | selftest **green** 37 checks, lint green at 463 — **spec body 7 red** |

**Mutant (v) is the one that matters.** It reproduces the s1 failure
exactly while the selftest is back to its pre-T-080 green, and only the
lane body catches it — so the spec body kills a mutant no other body
kills and is not poison shape six. **(d) does the same for rung B**: it
is the only row that reds when a class is declared binary in both lists,
which is why rung B is not redundant with rung A.

### Mutants derived from the CRITERIA with the test file closed (shape seven)

Every mutant above was derived by reading an acceptance criterion, not a
pin. **Three of the drills are pure criterion-derived scenarios with no
pin behind them**, and two found something:

- **Criterion 3 ("neither corpus count SHALL be pinned as a literal").**
  A tracked file of a suffix class this tree has never had
  (`tools/e2e/fixtures/t080-drill.rst`) took CONTROL 507 -> **508** and
  walk-policy checks 70 -> **71**, everything green. No literal pin, and
  no staleness for a new first-party text format — the property the deny
  list was chosen for.
- **Criterion 1, the binary half — a three-step chain no pin names.** A
  five-byte asset built from character codes and tracked as
  `t080-drill.avif`: (1) untouched policy, **P5 reds it at exit 1**;
  (2) added to the deny list ONLY, the lint goes green at 508 while the
  **floor reds** naming `.avif 0/1`; (3) added to BOTH lists, green at
  72 checks. That is the intended workflow, measured end to end.
- **Criterion 7 (sample construction).** The spec file carrying one
  runtime-built U+000B reds the gate at **byte 9977**, exit 1, restored
  by sha. **And `file --mime` still called it `charset=utf-8`** — the
  charset heuristic sees U+0000 and misses U+000B, so it is not a
  substitute for the gate (`T-080-s3`).

**Two survivors found, both reported rather than fixed** — they are
outside the criteria and filing beats scope creep:

- **`hit.line` is dead.** `scanControlSource` computes a line number
  that `lintTree` never prints (the report is `byte N`). Mutating the
  counter to `line += 2` survives the selftest, the lint and the focused
  suite, all at exit 0. A call site no pin names (`T-080-s5`).
- **One near-miss NEGATIVE can still be deleted.** Removing the
  regex-literal negative left the selftest green at 48 samples: the
  floor requires negatives to exist, not to cover the near-miss families
  (`T-080-s2`).

### What did NOT reproduce, and one thing that got worse before it got better

- The six literal CONTROL root rows are now **dominated**. Deleting them
  still leaves the selftest green (64 checks), so shape five survives
  structurally for that array — but with them gone, mutation (c) still
  reds **nine** ways through the derived rungs. They are kept because a
  root vanishing from the TREE removes its derived row while the literal
  row stays; that is the one failure they still uniquely name.
- **The CANNOT_RUN code cannot cover a parse error in the gate's own two
  files.** Planting a byte into `lint-tokens.mjs` or `token-scan.mjs`
  makes Node refuse to parse them, so nothing of the wrapper runs and
  the process exits **1**, not 3. A residual hole in the distinction,
  filed as `T-080-s4` rather than papered over.
- **The control-byte hazard reproduced a fourteenth time, in this
  session, in a tool call.** Deriving the corpus needed the `-z`
  separator and the literal byte was typed rather than built; the tool
  layer refused the call. Every later use is `String.fromCharCode(0)`,
  and the module's two remaining escape spellings were converted to the
  same form, so `token-scan.mjs` now spells no control escape anywhere.

### The lane caught a defect in this executor's OWN findings

Worth recording because it is the argument for driving the real tree.
At `146c333` the full lane went **87 passed / 4 failed** where it had
been 91/91 one commit earlier, and the only change was five new
`docs/tasks` files. `shell-frame.spec.ts:151` injects a known number of
failing files into the REAL repo docs snapshot and asserts the board's
`data-failure-count` equals it: `Expected: "60" · Received: "62"`, in
four bodies whose subject is the frame's scroll containment. **Two of
the five findings were themselves unparseable.** Task frontmatter is
YAML, a plain scalar may not begin with a reserved indicator, and both
titles opened with a backtick — the natural way to name a symbol, and
the way this convention's prose does it everywhere. Nothing else in the
repo notices: `lint:tokens` does not parse frontmatter and `index
--check` ignores `docs/`. Both titles were rewritten, the lane returned
to **91/91**, and an audit found **0 unparseable files of 116 and 0
titles opening with any YAML-reserved character** repo-wide, so these
were the first instances. Filed as `T-080-s6`.

### Suites, first-hand in this worktree, exits read unpiped

No suite was piped through `tail`, `head` or `grep`; each redirected to
a file and the exit code was read from the command itself.

- **token lint** exit 0, **TOKEN 118 / CONTROL 507** at `16bb47b` and
  unchanged at `fef8870` (the diff adds no tracked file).
- **selftest** exit 0: **49 TOKEN samples + 4 CONTROL samples, 70
  walk-policy checks, 8 evidence-floor checks** (from 49 + 2 and 37).
- **E2E lane 91/91**, exit 0, one worker, zero retries, zero skips, on
  scratch port **17983** bind-probed free before use. Baseline was
  **88/88** at `16bb47b`, so the three new bodies are the whole delta.
- **focused suite 8/8**, exit 0 (from 5/5).
- **`tsc --noEmit`** from tools/e2e exit 0.
- Installs were lockfile-exact `npm ci` in lib/parser, app and tools/e2e,
  all reporting zero vulnerabilities; the parser was built before the app.

### Both gate triggers, computed rather than skipped on the wording

- **BOOT GATE does NOT fire.** `app/src/**`, `app/src-tauri/**`,
  `app/package.json`, `app/src-tauri/Cargo.toml` over `16bb47b..fef8870`
  matches **0 paths**. No `BOOT_EXIT` exists to record.
- **GRAPH REGEN: the trigger AS WRITTEN FIRES.**
  `*.ts/*.tsx/*.js/*.jsx` outside `docs/` matches **one** path,
  `tools/e2e/tests/token-scan.spec.ts`. The graph nevertheless cannot
  move, because `.nputerignore` excludes `tools/` — and that was
  **proven by running the gate, not read off the ignore file**:
  `cargo run -p nputer-index -- index --check --root ../..` exits **0**
  and reports **CURRENT**, 575351 bytes / 117 files / 995 symbols /
  1518 edges, identical to the value the last checkpoint recorded.
  `graph.json` was NOT regenerated. This is the same trap T-058's
  verdict flagged as note (c): the conclusion "no regen" is right, but
  by a different route than "the trigger does not fire".
- **T-024's three-fixture rule does not fire**: `git diff` over
  `docs/architecture/components/` is a 0-file diff. No component
  declared.

### Fence

Three files under `tools/e2e/**`, plus this card and the six
`T-080-s*` findings the dispatch required — the T-058 precedent, which
committed its own `s1`-`s4` on its branch. `docs/CONVENTIONS.md` was
deliberately not touched.

## Verdicts
