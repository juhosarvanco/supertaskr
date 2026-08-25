---
id: T-130
title: The mtime restore is lossy below the millisecond, so its own guard reds exactly once in every fresh checkout and then erases the evidence — one token, and a sibling that restores no clock at all
feature: F-02
milestone: 4
priority: 3
size: S
status: verifying
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-130 — code commit b1ceedc
verified_by:
review:
---

Absorbs (tenth triage, 2026-08-25): `T-120-s3` (canonical), `T-052-s4`,
and item 1 of `T-079-s3` — all removed in this commit. The triage found
them to be one finding filed three times, in the same file, on the same
fence.

**THIS IS THE MOST-ENCOUNTERED DEFECT IN THE PROJECT AND IT HAS NEVER
BEEN FIXED.** It has led `docs/STATE.md`'s "Next up" for **six
consecutive checkpoints**. On the night of 2026-08-25 alone it fired in
the passes for T-086, T-102, T-108 and T-116 — four separate agents, each
of whom had to recognise it by its digits and declare two runs to prove
it was not theirs.

## The mechanism, measured rather than reasoned

`tools/e2e/tests/token-scan.spec.ts` captures a clock, restores it, and
asserts the round trip:

    const clock = statSync(target);                 // mtimeMs is a FLOAT
    utimesSync(target, clock.atime, clock.mtime);   // .mtime is a DATE
    expect(statSync(target).mtimeMs).toBe(clock.mtimeMs);

**`Stats.mtime` is a `Date`, and a `Date` holds whole milliseconds.** The
sub-millisecond part is gone the moment the `Date` is read, so the
restore writes back a ROUNDED timestamp and the assertion compares it
against the unrounded float it captured. **It can only pass when the
original mtime had no sub-millisecond component.**

Probed on this filesystem (APFS, Darwin 25.6.0, node 22): **50 of 50
fresh writes produced a sub-millisecond mtime.** The assertion is not
occasionally unlucky; it is nearly always false on a file whose mtime
came from an ordinary write or checkout.

    captured   mtimeMs        = 1787644893267.5955
    as a Date  .getTime()     = 1787644893268   <- what the body restores
    after utimesSync(Date)    = 1787644893268   equal to capture? false
    after utimesSync(ms/1000) = 1787644893267.885  equal to capture? TRUE

## WHY NOBODY HAS FIXED IT, WHICH IS THE WORST PART

**The failure repairs the condition that caused it.** The `utimesSync`
in the `finally` block leaves the mtime on a whole millisecond — so the
next run captures a whole-millisecond clock, the rounding is a no-op, and
the assertion passes. **Red once, green forever after, in that checkout.**

**So it fires in exactly the places this project creates most often: a
fresh lane worktree and a fresh POISON DRILL worktree.** Every executor
meets it once, cannot reproduce it, and has no way to tell it from a
flake — while a past STATE recorded *"four consecutive green runs after
the move"*, which is precisely what one red followed by three greens
looks like from the inside.

**AND THE OBVIOUS REMEDY IS THE TRAP**: re-running until green is not a
fix and not evidence. It is the defect's own healing mechanism, mistaken
for a result.

## The prerequisite is already gone — you can reproduce it anywhere

`T-052`'s lane (absorbed here as `T-052-s4`) removed this finding's own
*"needs a fresh checkout to prove"* precondition by **reproducing the red
ON DEMAND in a healed worktree**: set the target's mtime to a value with
a fractional millisecond and the body reds immediately. **That is how you
will drive it**, and it is why this card does not need a fresh checkout to
verify a fix.

## The fix, measured

    - utimesSync(target, clock.atime, clock.mtime);
    + utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000);

`utimesSync` accepts seconds as a number and carries the fraction into
the `timespec`; the probe above confirms an exact round trip.

## The sibling, from `T-079-s3`

`token-scan.spec.ts`'s P6 body restores the clock at `:226`. **The T-058
body's `finally` at `:136-139` restores CONTENT ONLY — no `utimesSync`
at all.** So one body in the same file guards a property the other
silently violates. The finding's own words: any sibling using
`utimesSync(…, stats.atime, stats.mtime)` has the same lossy restore, and
**only this body currently asserts tightly enough to notice.**

## Acceptance criteria

- **THE RESTORE SHALL BE EXACT TO THE PRECISION THE ASSERTION DEMANDS**,
  and **THE STRICT `toBe` SHALL BE KEPT**. Weakening the comparison to
  whole milliseconds would delete the property `T-079-s3` exists to
  defend, and would "fix" the test by removing the check. **IF the
  executor concludes the assertion should be loosened THEN that is a
  rejection of this card's premise and SHALL be argued, not done.**
- **THE PIN SHALL BE DRIVEN RED BEFORE THE FIX, ON DEMAND, IN THE
  EXECUTOR'S OWN WORKTREE** — set a fractional-millisecond mtime on the
  target and run the body once. **Record the exact failure message and
  its digits.** An assertion that cannot fail against today's tree is a
  defect (`T-080-s1`), and this one can, so there is no excuse for a
  forecast. **Re-running until green is explicitly NOT evidence here** —
  say so in the notes, because the next reader's instinct will be wrong.
- **THE FIX SHALL THEN BE PROVEN AGAINST THE SAME PLANTED FRACTIONAL
  MTIME**, not against a healed worktree. A green run on a file whose
  mtime is already whole proves nothing at all — it is the vacuous pass
  this whole finding is about.
- **EVERY SIBLING RESTORE IN `tools/e2e` SHALL BE SWEPT AND RULED ON.**
  Derive them — search for `utimesSync` across the fence and list every
  call site with its file and line. For each: does it lose precision, and
  does anything assert tightly enough to notice? **Fix the lossy ones or
  say why not.** A fix applied only where a test happens to complain
  leaves the same bug everywhere nothing is watching.
- **THE T-058 BODY'S MISSING CLOCK RESTORE SHALL BE ADDRESSED**
  (`:136-139` restores content only). Either restore the clock there too,
  or record why that body does not owe it. **One file must not hold two
  answers to "what does restoring a fixture mean".**
- **THE RULE SHALL BE WRITTEN WHERE THE PLANT-AND-RESTORE RITUAL IS
  WRITTEN**: a content-exact restore is not a restore, and a clock
  restore through a `Date` is lossy below the millisecond. **`docs/CONVENTIONS.md`
  is held by `T-104` as this card is filed** — so **route the CONVENTIONS
  sentence rather than taking it**, and say where you routed it. Item 2–3
  of `T-079-s3` already sit with T-104 for the same reason.
- **`STATE.md`'s "Next up" SHALL LOSE THIS ITEM** when the card lands —
  it has led that list for six checkpoints and the integrator should be
  told to check.

Verification: headless — `npm test` from `tools/e2e/`, exit read
**unpiped from `$?`**, count derived. Main reads **171/171** at
`a649766`; expect that or higher and derive rather than match. **The
token-scan body is the one under repair, so state its result
specifically rather than only the suite total.** **POISON DRILL on the
changed assertion, one side only, producer mutated and never the
assertion** — reintroduce the `Date`-valued restore and require the RED —
mutated text read back with `git diff` before its run, restores proved
per-path by sha256 at the drill's own commit, in a detached scratch
worktree named for this lane and placed OUTSIDE the repository
(`T-052-s2`). **A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL**: prove
the body still passes on a genuinely-restored file as well as failing on
a lossy one. **GRAPH REGEN's trigger fires on `*.ts` outside `docs/`** —
ask `cargo run -p nputer-index -- index --check --root ../..` rather than
predicting, and **ask again after any write**: a run that regenerates once
and confirms by byte count can ship a stale graph with no headline figure
capable of showing it. The DOCS GATE fires on this card. @human: none.

## Implementation notes (executor, 2026-08-25)

Branch `task/T-130-mtime-restore`, base `540ae0f`, code commit
`b1ceedc`. One code file moved: `tools/e2e/tests/token-scan.spec.ts`,
**+34 / −2**. Fence `[tools/e2e]` never widened.

### THE PIN WAS DRIVEN RED ON DEMAND, BEFORE THE FIX, WITH ITS DIGITS

The worktree was cut minutes before this pass and `shell.ts` already
carried a fractional mtime (`1787669906490.0483`) — **so the body would
have redded without a plant, and that is exactly why nothing may be
inferred from whichever state a checkout happens to be in.** A mtime was
planted deliberately anyway, so the digits are the ones this lane chose:

    planted   tools/e2e/fixtures/shell.ts  mtimeMs = 1787655727832.5427

    $ npx playwright test tests/token-scan.spec.ts \
        -g "P6 reds a planted bare motion utility"          exit 1

    Error: tools/e2e/fixtures/shell.ts restored its MTIME too —
      a content-exact restore that moves the clock reds an mtime guard
    expect(received).toBe(expected) // Object.is equality
    Expected: 1787655727832.5427
    Received: 1787655727833

**Those are `docs/STATE.md`'s own recorded digits, character for
character** — the planted value was chosen to reproduce them, and it does.

**AND THE HEALING WAS MEASURED AS A PAIR, ON THE UNFIXED CODE.** After
that red the file's mtime read `1787655727833` — a whole millisecond,
written by the failing body's own `finally`. A SECOND run of the same
unfixed body on that file is **exit 0**, and it is declared here as the
vacuous pass it is. **Re-running until green is not a fix and not
evidence; it is the defect's own healing mechanism mistaken for a
result.** Both runs are declared, which is what STATE asks for.

### THE FIX, PROVEN AGAINST THE SAME PLANT AND NOT AGAINST A HEALED TREE

`utimesSync(target, clock.atimeMs / 1000, clock.mtimeMs / 1000)`.
`utimesSync` takes SECONDS as a number and carries the fraction into the
`timespec`. Probed on this filesystem (APFS, Darwin 25.6.0, node
v22.22.0), 50 iterations: **50 of 50** fresh writes carry a
sub-millisecond mtime, the `Date` form round-trips **0 of 50**, the
seconds form round-trips **50 of 50**.

The identical plant was re-applied and the body re-run: **exit 0** —
and, the part that matters more than the exit,

    mtimeMs after the FIXED run = 1787655727832.5427

**the planted fractional value SURVIVED the run.** The fixed body no
longer erases its own precondition, so its green is repeatable instead of
one-shot. Every subsequent run in this pass — the 10-body spec, the full
171-body suite, the drill's positive control — ran against files whose
mtimes were fractional at capture time, and all eight plant targets still
held their exact fractional values afterwards. That is the difference
between this green and the vacuous one above.

**THE STRICT `toBe` IS KEPT.** It was not loosened, not widened to a
tolerance, and not moved. Nothing about the repair argues for loosening
it: the restore is now exact, so the strict comparison is satisfiable
rather than merely survivable.

### THE SWEEP, DERIVED

`git grep -n utimesSync` from the repo ROOT (a subdirectory search
silently scopes itself — CONVENTIONS) returns, at `540ae0f`, **exactly
ONE code call site in the entire repository**; every other hit is prose
under `docs/`. At `b1ceedc` there are two, both correct. Widening the
sweep from `utimesSync` to *every plant-and-restore in the fence* — the
question the criterion actually asks — gives four sites:

| site | what it restores | loses precision? | anything watching? | ruling |
|---|---|---|---|---|
| `token-scan.spec.ts` P6 body, `finally` (was `:226`, now `:258`) | content + clock, 1 tracked file | **YES, before this card** | its own `toBe(clock.mtimeMs)` — the only tight assertion in the tree | **FIXED** |
| `token-scan.spec.ts` T-058 body, `finally` (was `:136-139`, now `:143-153`) | content only, **7 tracked files across 4 packages** | **YES — it restored NO clock at all** | nothing | **FIXED, and now watched** |
| `boot-check-guard.spec.ts` (`mkdtempSync` … `rmSync`) | nothing in the repository | n/a | n/a | **NOT OWED — derived** |
| `docs-input-gate.spec.ts` (`mkdtempSync` … `rmSync`) | nothing in the repository | n/a | n/a | **NOT OWED — derived** |

The two temp-dir suites write only inside `mkdtempSync(os.tmpdir(), …)`
and destroy the directory in a `finally`. They restore nothing because
they damage nothing, so there is no precision to lose. **That is derived
from their write sites, not assumed from their names.**

**T-130-s2 records what this sweep CANNOT close**: both guards are
assertions *inside their own bodies*, so a THIRD plant-and-restore
written tomorrow is lossy on arrival with nothing red. The class is
unguarded; only the two instances are fixed.

### THE T-058 BODY OWES THE CLOCK, AND IT NOW PAYS IT

Decision: **restore the clock there too, and ASSERT it** — the card's
"one file must not hold two answers" reading, taken in full. Four
grounds, in the order they decided it:

1. **The blast radius is the larger one.** P6 plants into one file
   deliberately moved inside this package's fence. The T-058 body plants
   into `app/package.json`, `docs/NORTH_STAR.md`,
   `lib/parser/package.json`, `tools/e2e/package.json`,
   `method/README.md`, `AGENTS.md` and `.github/workflows/ci.yml` — four
   packages and two governing documents. The body with the wider reach
   was the one with no clock restore at all.
2. **A restore nobody asserts is the defect this card is about.** Adding
   the `utimesSync` without the matching assertion would have reproduced
   the T-079-s3 situation one level up: correct code, unwatched.
3. **The one reason NOT to do it did not survive measurement.** The
   T-058 body proves its restoration with `git diff --quiet`, and both
   `T-079-s3` item 1 and the comment above P6's assertion record that
   pairing as an intermittent — *"the first call after a `utimesSync`
   reports a difference on stat alone … measured red-green-green over
   three consecutive runs."* Replayed here over those exact seven
   targets, both arms, reading `git diff --quiet`'s exit every cycle:
   **12 cycles per arm, exit 0 in 12 of 12, in BOTH arms, across two
   checkouts — one of them a freshly-cut worktree with an unrefreshed
   index.** It did not reproduce. Not a refutation that it ever happened;
   a refutation that it is a property to plan around. Routed as part of
   **T-130-s1**, and the code carries the measurement in a comment beside
   the assertion it justifies.
4. **Today's exposure is empty and that is a coincidence, not a
   defence.** Derived rather than assumed: the six mtime guards in
   `app/test/` (`genesis-mount`, `interview-harness`, `map-t1-t2-dom`,
   `map-tasks-lens-dom`, `shell-harness`, `window-manifest`) read only
   paths under `app/src/**`, so **none of the eight plant targets is read
   by any mtime guard in this tree today.** The fix is prophylaxis. Say
   that plainly rather than claim a red was prevented.

**`T-079-s3` item 1 is discharged by `b1ceedc`** — *"Give the T-058 body
the same `utimesSync` restore"* — which is what this card's frontmatter
absorbed. That file is not edited here; the absorption line is the
record.

### THE CONVENTIONS SENTENCE IS ROUTED, NOT TAKEN

`docs/CONVENTIONS.md` is held by **T-104**. Routed as **`T-130-s1`**,
which carries the sentence ready to paste into the POISON DRILL bullet
(which today rules how a restoration is PROVED and never says what
restoring MEANS), the 50/50 · 0/50 · 50/50 measurement, the
red-once-green-forever clause the next reader needs, and the correction
to the `ctime` caveat above. **It should be taken in ONE edit with
`T-079-s3` items 2 and 3, which are already in T-104's seat for the same
reason** — four separate passes over one bullet is how that bullet grew
three stale signposts.

### POISON DRILL — three mutants, PRODUCER ONLY, both halves of the control

Detached worktree `/Users/ujju/Projects/drill-T-130`, **outside the
repository** (`T-052-s2`), at the drill's own commit **`b1ceedc`**,
port 15312. Every mutation applied by exact-string replacement refusing
any count but 1, **and the mutated TEXT read back with `git diff` before
its run** — a count can be right while the text is wrong.

**THE DRILL HAS A PRECONDITION THE DRILL ITSELF DESTROYS**, and it is the
whole reason this card exists: a `Date`-valued restore leaves its targets
on a whole millisecond, so the run AFTER a mutant run would be vacuous.
**All eight targets were re-planted with fractional mtimes before every
single run**, mutant and control alike, and the plant reported
`PLANT_ALL_EXACT=true` each time.

| # | mutation (one side, producer only) | kill |
|---|---|---|
| **CONTROL** | none — shipped code, planted fractional mtimes | **10/10 pass, exit 0** |
| **M1** | P6 producer → `utimesSync(target, clock.atime, clock.mtime)` | **exit 1** · `Expected 1787655727832.5427` / `Received 1787655727833` |
| **M2** | T-058 producer → `utimesSync(absolute, clock.atime, clock.mtime)` | **exit 1** · `Expected 1787655727001.111` / `Received 1787655727001` |
| **M3** | T-058 producer line DELETED — the pre-T-130 shape | **exit 1** · `Expected 1787655727001.111` / `Received 1787673460361.1094` |

**M3 is the one that proves the new assertion catches the ORIGINAL
defect** rather than only a rounding: its `Received` is the moment of the
plant, hours away from the capture, which is precisely what a
content-only restore has been doing to seven tracked files all along.

**EVERY KILL IS UNIQUE AND THE UNIQUENESS IS MEASURED, NOT ASSERTED**
(T-116's verifier found a lane's uniqueness claim true while its evidence
was not). Both wide mutants were run against the **whole 171-body
suite**, not only their own spec:

- **M1 over the full suite: 1 failed / 170 passed**, the failure being
  body 136, `token-scan.spec.ts:227` P6.
- **M3 over the full suite: 1 failed / 170 passed**, the failure being
  body 135, `token-scan.spec.ts:106` T-058.
- M2 was measured at spec level only — **1 failed / 9 passed** of 10 —
  and that is stated as the weaker measurement it is. It mutates the same
  producer as M3 in the same body, so the wider run would answer the same
  question twice.

**RESTORATION PROVED PER PATH BY sha256 AT THE DRILL'S OWN COMMIT**, after
every mutant, never by a clean status:

    git show b1ceedc:tools/e2e/tests/token-scan.spec.ts | shasum -a 256
      4bc5997315cc8bbebea9debe420c0b1885d2aa012d301501c69395c84270a650  -
    shasum -a 256 tools/e2e/tests/token-scan.spec.ts
      4bc5997315cc8bbebea9debe420c0b1885d2aa012d301501c69395c84270a650

with `git diff --name-only` EMPTY and `git status --porcelain` returning
no rows in the drill worktree afterwards.

**BOTH HALVES OF THE POSITIVE CONTROL, WHICH HERE IS NOT OPTIONAL.** The
negative half alone cannot tell *"the restore is exact"* from *"the
assertion stopped looking"*:

- **PASSES on a genuinely-restored file** — the CONTROL row above:
  unmutated code, all eight targets carrying planted FRACTIONAL mtimes,
  10 of 10 green at exit 0, and the plants read back intact afterwards
  so the control was demonstrably not vacuous.
- **FAILS on a lossy one** — M1, M2 and M3, each at exit 1 with its
  digits.
- **And a THIRD reading is recorded because its absence is what fooled
  four lanes**: unmutated code on a file whose mtime is already WHOLE is
  green and proves nothing at all. That run is in these notes above, at
  the top, labelled as the vacuous pass.

### SUITES AND GATES — every exit read UNPIPED from `$?`

Run from `tools/e2e/` in the lane worktree on scratch port **15311**
(`lsof -nP -iTCP:15311 -sTCP:LISTEN` read FIRST, zero rows), after the
CONVENTIONS install order — `npm ci` + `npm run build` from `lib/parser/`
(0, 0), `npm ci` from `app/` (0), `npm ci` from `tools/e2e/` (0).

- **`npm test` from tools/e2e — 171 passed, exit 0**, count DERIVED from
  the reporter. Main reads 171 at `a649766`; this card changes two
  existing bodies and adds none, so 171 is the expected figure and it was
  read rather than matched.
- **THE TOKEN-SCAN BODY'S OWN RESULT, stated separately because a suite
  total can hide it**: within that run, `token-scan.spec.ts` is bodies
  **130–139, all ten green**, and the two under repair are body **135**
  (`:106`, the T-058 body, now with the clock restore) and body **136**
  (`:227`, the P6 body, the one this card is named for). Both green,
  **against planted fractional mtimes**, and all eight targets still held
  their exact fractional values afterwards.
- `npm run typecheck` from tools/e2e — **exit 0**.
- `npm run lint:tokens -- --selftest` — **exit 0**, 65 TOKEN + 4 CONTROL
  samples, 87 walk-policy checks, 9 evidence-floor checks.
  `npm run lint:tokens` — **exit 0**, **TOKEN 134 / CONTROL 719 at
  `b1ceedc`** and **TOKEN 134 / CONTROL 721 at `7d16d4b`**. Both are
  derivable and neither is a constant: STATE reads 720 at `ca5fb96`; the
  promotion commit `7221629` removed `T-120-s3` and `T-052-s4` and added
  this card, two out and one in, **net −1 → 719**; this lane's notes
  commit adds `T-130-s1` and `T-130-s2`, **+2 → 721**. TOKEN is unmoved
  at 134 because this card adds no file under a TOKEN root.
- **GRAPH REGEN — FIRES, and the answer was ASKED rather than predicted**
  (below).
- **BOOT GATE — NOT OWED, derived**: this diff carries no
  `app/src-tauri/**`, no `app/src/**` and neither manifest.
  `npm run boot:check` was **not run, and that is a derivation rather
  than a skip**.
- **DOCS GATE — FIRES on this card** (below).

### WHERE THE BRIEF AND THE CARD ARE WRONG

1. **The card's own probe block does not agree with itself.** It prints
   `captured mtimeMs = 1787644893267.5955` and then
   `after utimesSync(ms/1000) = 1787644893267.885  equal to capture?
   TRUE`. Those two values are not equal, so that line cannot both show
   `…267.885` and report TRUE. Re-measured here 50 times: the seconds
   form returns the captured value **identically** (e.g. captured
   `1787670301216.438` → after `1787670301216.438`). **The card's
   conclusion is right and its digits are not** — the `after` figure
   looks like a different sample's. Everything else in the card
   reproduced exactly.
2. **The `:136-139` citation is off by one, and it resolved anyway** — at
   `540ae0f` the `finally` block is lines **136–140** (`} finally {`
   through its own closing brace) and the restore write is line **138**.
   Recorded not as a defect but because it is CONVENTIONS' own worked
   case: both line citations in this card are ALREADY stale at `b1ceedc`
   — the T-058 restore is now `:143-153` and P6's is `:258` — while the
   SYMBOLS (*"the T-058 body's `finally`"*, *"the P6 body's `finally`"*)
   are still exact and still searchable. Cite the symbol.
3. **The resume message put this lane's main tip at `eea61e0`. It is
   not.** At the time of measurement `main` is **`5de8cb1`**; `eea61e0`
   is T-116's MERGE commit, two behind — `114e59a` (the T-116 checkpoint)
   and `5de8cb1` (a STATE correction) land after it. **Main moved twice
   more during this lane**, which is the ordinary case; the ranges below
   are stated at `5de8cb1` by name.
4. **The resume message addressed this session as ARCHITECT.** The
   dispatch brief assigns it EXECUTOR for T-130, and the executor's
   obligations are what were followed. Cosmetic, recorded because row 1
   of the brief contract is the role and a session that guessed would
   have guessed its ceremony too.
5. **Not an error, but the brief's most useful warning was live**: this
   worktree WAS already carrying a fractional mtime on arrival, so the
   body would have redded unplanted. Nothing was inferred from that.
