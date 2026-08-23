---
id: T-115
title: The shape gate checks shape and never identity, so the caller that knows the project root is the one that refuses a git inside it — plus the two doc comments in churn.rs that read as coverage
feature: F-06
milestone: 4
priority: 45
size: S
status: planned
blocked_by: []
touches: [app-shell]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — for the architect, remove before landing.** Two
> things the tree says that the fence and the absorbed set do not.
> **(1) NO COMPONENT'S `paths:` GLOB CLAIMS `app/src-tauri/src/churn.rs`.**
> Swept at `6b0cf47` over all twelve `docs/architecture/components/C-*.md`:
> C-05 lists `lib.rs`, `main.rs`, `build.rs`, `tauri.conf.json` and
> `capabilities/**` and stops; C-12 lists `app/src/**` paths only.
> `app-shell` is the fence T-013 used for this file in PRACTICE (its
> `touches:` reads `[app-map, app-shell, app-agent]`) and the one
> `T-013-s10` names in as many words, and `docs/ARCHITECTURE.md`'s slug
> sentence reads *"`app-shell` = C-05 shell/window/watcher plumbing"* —
> so the fence below is right by practice and unbacked by the registry.
> This is `T-089-s9`'s row-5 residual (the slug↔path map is named but
> not located) with a live instance; it is not this card's to fix.
> **(2) `T-013-s10` IS ABSORBED FOR ITS FIRST HALF ONLY.** Half 2 — the
> card's own "grows it to 1118" figure — is a `docs/tasks/` edit outside
> this fence. Measured at `6b0cf47`: `wc -l app/src-tauri/src/churn.rs`
> is **1158**, and `grep -c 1118 docs/tasks/T-013-semantic-zoom-overlays.md`
> is **3**, both unchanged from the merge `6834287` where the finding
> measured them. If the file is removed on absorption, half 2 goes with
> it unless the triage commit fixes those three occurrences or records
> them somewhere else.

Absorbs (seventh triage, 2026-08-24): T-013-s8, T-013-s9, T-013-s10 —
files removed in this commit. (T-013-s10's second half is a
`docs/tasks/` correction outside this fence; see the drafter's note.)

`validate_resolved_program` in `app/src-tauri/src/agent/runner.rs` is
one standard applied at two doors — the CLI resolver's and, since T-013,
the churn git resolver's — and its own doc comment records the honest
residual: *"an absolute, traversal-free path named `claude` pointing at
an attacker's binary still passes. The gate checks SHAPE and never
IDENTITY."* **Both doors inherit that limit, and one of them has a
caller-side answer the other does not.**

## What T-013's second verifier measured, and it is mostly good news

Two batteries, fourteen variants, **one execution**. Battery A drove
`resolve_git_from` — the pure seam that spawns nothing — over search
paths `:REAL`, `.:REAL`, `./:REAL`, `:.:REAL`, `REAL:`, `relbin:REAL`,
`:` and `.` alone, plus login-shell answers `git`, `./git` and
`<proj>/bin/../git`: every one resolved `/usr/bin/git`, none under the
project, every child `PATH` free of relative or empty elements. Battery
B drove `churn_at` end to end with a real fake `git` planted inside the
opened project and the process `PATH`/`SHELL` actually poisoned:
**thirteen of fourteen refused.**

**The one that executed is `$SHELL` pointing at a fake `zsh` INSIDE the
project.** `login_shell()` requires absolute + `file_name()` in
`{zsh, bash, sh}` + executable, and `<project>/zsh` satisfies all three,
so `login_shell_git()` runs it. A second residual from the same root:
**an absolute PATH element equal to the project directory selects
`<project>/git`** — measured in the pure seam, masked end to end only
because `resolve_git` consults the login shell's `command -v git` first
and that absolute answer wins. It becomes reachable exactly when the
login-shell probe cannot answer, which is the documented GUI-launch
case.

Neither is new and neither is T-013's: `login_shell()` is byte-unchanged
from main-before, the CLI resolver has run `$SHELL -l -c` through it
since T-060, and the pointer comes from the PARENT environment, never
from the project. What T-013 changed is FREQUENCY — churn probes on
every map mount where genesis probed only on an interview.

## The remedy, and the part that must NOT be done

**Do not close this inside the shared gate.** Closing either residual in
`validate_resolved_program` would make the two doors diverge, which is
the exact thing T-013's refactor exists to prevent (T-057: a rule with
two implementations is two chances to disagree). **The fence enforces
that mechanically**: `app/src-tauri/src/agent/**` is `app-agent` and is
not in this card's `touches:`.

One **caller-side** hardening is available, and only to this caller,
because only this caller knows the project root: refuse a resolved
program that resolves under it. Read at `6b0cf47`, `resolve_git()` takes
no root at all and `resolve_git_from(login_answer, raw_path)` is a pure
seam over explicit inputs — **`churn_at(root)` is the one function that
holds both the root and the resolution**, and it is where the refusal
has to live or be threaded from.

## The two doc comments that read as coverage

**`GIT_ENV_REMOVED` is right at twelve and can never be complete**
(`T-013-s9`). Twelve is correct and the third addition is load-bearing:
with a positive control on git 2.50.1,
`GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.fsmonitor GIT_CONFIG_VALUE_0=…`
runs the program on `git status` and the same pair without
`GIT_CONFIG_COUNT` does not, so gating the whole numbered family on the
one count variable is a real neutralisation. **But `HOME` redirected at
a directory holding a hostile `.gitconfig` reaches exactly the surface
`GIT_CONFIG_GLOBAL` does, and cannot be removed from a git child**;
`GIT_TRACE=<path>` is a fourteenth of a different kind, an
arbitrary-file append. Neither is exploitable here, and the reason is
the one that actually carries the property: **neither `PROBE_ARGV` nor
`LOG_ARGV` triggers `core.fsmonitor` at all**, with or without the
`-c core.fsmonitor=` clear. At `6b0cf47` the constant holds twelve
entries, `churn.rs` contains **zero** occurrences of `HOME` or
`GIT_TRACE`, and the doc comment's only quantifier is *"TWELVE since
T-013 F1"* — so a reader who counts the list concludes the environment
is covered.

**Property 2's spelling is the pre-fix one** (`T-013-s10` half 1).
`churn.rs`'s numbered property block opens at property 0 — *"Which `git`
runs is RESOLVED by the app, never inherited"* — and property 2 still
reads *"**Never a shell.** `Command::new("git")` with an argv array…"*.
The CLAIM is true; the SPELLING says the bare-name spawn is still there,
two properties under the one that says it is not. Re-derived at
`6b0cf47`, unchanged from the merge `6834287`: **three doc/comment
occurrences of the literal (lines 21, 42, 840) and one call, at line
1029, inside `#[cfg(test)]`** — `TempRepo::git`, a fixture. Production
spawns `Command::new(&git.program)` (line 383, the absolute resolved
path) and `Command::new(login_shell())` (line 350, the name-checked
probe). Zero bare-name spawns in production code.

## Acceptance criteria

- **THE CALLER THAT KNOWS THE ROOT SHALL REFUSE A GIT THAT RESOLVES
  UNDER IT.** A resolved program whose path lies inside the opened
  project SHALL yield the existing typed
  `ChurnOutcome::Disabled { GitUnavailable }`, never a spawn. The
  decision SHALL be made once, at the one site that holds both the root
  and the resolution, and SHALL NOT be duplicated at each spawn.
- **THE SHARED GATE SHALL NOT MOVE.** `validate_resolved_program` and
  `validate_resolved_binary` SHALL be byte-identical across the merge —
  quoted with a sha256 — and `app/src-tauri/src/agent/**` SHALL be a
  0-file diff. The two doors keep one implementation of the standard.
- **THE REFUSAL SHALL BE PROVED WITH BOTH ARMS, THE POSITIVE ONE
  FIRST.** A path-shaped fixture has to be BUILT the way the producer
  builds it: plant an executable named `git` inside a temp project,
  prove the ABSOLUTE spelling OUTSIDE the project still resolves and
  runs, and only then prove every spelling under the project is refused.
  A bare "expected refused, got refused" is satisfied equally by
  refused-for-the-wrong-reason and by there-being-nothing-there
  (CONVENTIONS: A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL, whose own
  worked example is this same resolver family).
- **THE `$SHELL`-INSIDE-THE-PROJECT VARIANT SHALL BE THE ONE DRIVEN**,
  because it is the variant that EXECUTED — thirteen of fourteen were
  already refused and re-proving those is not the evidence. IF the
  refusal cannot reach that variant from the chosen site THEN say so and
  name which of the two residuals is closed and which is not, rather
  than reporting "both".
- IF lifting any guard is needed to discriminate THEN the lifted arm
  SHALL be proven to TERMINATE IN A FIXTURE and the body SHALL assert
  the guard's STATE before it exercises anything (CONVENTIONS: LIFTING A
  SAFETY GUARD TO DISCRIMINATE — T-060's first draft of this same
  resolver family executed the developer's real CLI inside the test
  written to prove it could not).
- **`GIT_ENV_REMOVED`'s DOC COMMENT SHALL STOP LETTING LENGTH READ AS
  COVERAGE.** It SHALL say in as many words that the list can never be
  complete, name `HOME` (same configuration surface, not removable from
  a git child) and `GIT_TRACE` (a file-append of a different kind), and
  name what actually carries the property — that neither `PROBE_ARGV`
  nor `LOG_ARGV` runs a program. The existing
  `assert_eq!(GIT_ENV_REMOVED.len(), 12, …)` stays as-is; twelve is
  right and this card does not extend the list.
- **PROPERTY 2 SHALL NAME WHAT PRODUCTION SPAWNS.** Its spelling SHALL
  be corrected to the resolved absolute program, or drop the spelling
  and keep the claim. Property 0's occurrence is HISTORICAL — it
  describes the first draft that was fixed — and SHALL be left alone;
  the `#[cfg(test)]` fixture call SHALL be left alone. **The
  distinguishing test is whether a reader grepping the literal finds a
  sentence asserting the hole is open**, not whether the literal
  appears.
- IF the general clause is wanted — a SHAPE gate is not an IDENTITY
  gate, and every door adopting the standard adopts that limit — THEN it
  belongs in `docs/CONVENTIONS.md` beside its two neighbours (A NEGATIVE
  ASSERTION NEEDS A POSITIVE CONTROL, LIFTING A SAFETY GUARD TO
  DISCRIMINATE) and **is OUTSIDE this fence**. It SHALL be routed as a
  suggestion naming the fence it needs, never written from this lane.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped from `$?`, total summed from the
`test result:` lines); no `npm` surface moves. **POISON DRILL on every
new or changed assertion, one side only**, producer mutated and never
the assertion: delete the containment refusal and require the new body
RED; move the planted binary outside the project and require the
positive control RED. Every mutated text read back with `git diff`
before its run; restores per-path, proved by sha256 against the drill's
own commit; drilled in a detached scratch worktree with its own
`CARGO_TARGET_DIR` inside it (POISON DRILL arm (c)). Then the shape-six
check per new body. The BOOT GATE trigger fires on `app/src-tauri/**` —
run the boot check on a scratch port and record the exit and both
`[nputer]` lines. The DOCS GATE fires on this card; ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs`. @human: none — nothing here is visible on screen.
