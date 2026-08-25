---
id: T-102
title: The auth discriminator reads the evidence that CAN be forged and ignores the evidence that cannot — plus the three pins and one bound around it that cannot fail
feature: F-03
milestone: 4
priority: 58
size: M
status: done
blocked_by: [T-113]
touches: [app-agent]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5 @T-102 — code commit 023ab3b
verified_by: claude-opus-5 @T-102-verify — APPROVED, 2026-08-25 — verdict commit d12efac
review: same-model
---

> **DRAFTER'S NOTE — remove before landing.** One fold's subject MOVED
> under it. `T-069-s3` describes the ring note as
> `format!("permission_denials: {}", denials.join(", "))`; at `4d2f03c`
> T-081 has narrowed it to `unreported.join(", ")` over the UNANNOUNCED
> set, with `denial_names(&denials)` kept separately for the cumulative
> `ToolDenied` record. The GAP both findings describe is unchanged —
> no fixture drives either join with more than one name — but the
> builder must re-measure against the current code rather than against
> the quoted line. And note `T-069-s3` and `T-081-s10` want the SAME
> fixture edit from opposite directions: one wants a second denial, the
> other wants an in-band line. One scenario satisfies both.
> `T-069-s1`'s "at least four bodies" reads **six** at `4d2f03c`.

> **ARCHITECT'S AMENDMENT (2026-08-24, re-derived at `4095219`).**
> Criteria 4–6 below were drafted against the pre-`T-113` tree. T-113
> deletes the `permission_denials:` ring note for the `unannounced` set
> — the exact producer the original criterion 6 pinned — so that
> criterion's mutant would have had no subject, and a builder making it
> red by reverting `denial_names(unannounced…)` to
> `denial_names(&denials)` would be re-introducing the double report
> under a green suite (T-113, THE COLLISION). The three criteria are
> re-targeted at what SURVIVES T-113, and this card now carries
> `blocked_by: [T-113]`, so the ordering the shared `[app-agent]` fence
> only implied is a parsed fact the board's waves enforce. The
> superseded criterion 6 is kept only inside this retraction (the T-085
> shape): *"THE NARROWING SHALL BE PINNED: the tail names the
> UNANNOUNCED set only, and the `denial_names(&denials)` revert SHALL
> be re-run and shown RED."* IF the builder finds the ring note still
> present in `run_turn`'s `StreamLine::Result` arm THEN T-113 has not
> landed and the blocker was bypassed — stop and open a room.

Absorbs: T-069-s2, T-069-s3, T-069-s1, T-081-s10, T-081-s4 (sixth
triage, 2026-08-20). All five files removed in this commit.

## The anchor — the discriminator's own argument reaches further than the discriminator

T-069 closed the residual false positive — a recovered 401 with no
`result` line, which classified `AuthFailed` and took *Try again* away
from a user whose login was fine — with `text_after_auth_status`,
guarding the auth arm. **The flag is set in exactly one place**: the
`StreamLine::TextDelta` arm, when `auth_status.is_some()` (verified live
at `4d2f03c`; the guard reads `if matches!(auth_status, Some(401) |
Some(403)) && !text_after_auth_status`).

**The runner's own justification does not stop at text.** The comment
beside the flag says model text *"is streamed by a request that
SUCCEEDED, so a delta after the last status-bearing line is the stream
saying the CLI got past that status."* That argument applies verbatim to
`StreamLine::Activity`, which `classify_line` produces from a
`tool_use` content block — the SAME model response in a different block
type. The `Activity` arm sets nothing (verified at `4d2f03c`: it flushes
pending and does not touch the flag).

**And that evidence is STRONGER, not weaker.** The honest limit T-069
states is that the CLI writes its own prose into a nominally-model
field, so a delta can be the CLI rather than the model. **A `tool_use`
block naming a tool is not prose and the CLI has no reason to fabricate
one.** The discriminator therefore reads the evidence that CAN be forged
and ignores the evidence that cannot.

**Measured.** A probe scenario — init · `api_retry` 401 · one `tool_use`
block · exit 1, no `result` line — driven through the real `run_turn`
with `RunnerConfig::binary_override`, against the shipped tip:

    AuthFailed { status: Some(401), message: "the agent CLI could not authenticate" }

**The false positive survives for every turn that recovered a 401 and
then called a tool without saying anything first** — an ordinary opening
for a planner that reads the repo before it speaks. This is a narrowing
of T-069's closure, not a defect in it: everything it built is correct
and its pins discriminate; the family it reaches is smaller than its own
argument. The counter-pin is unaffected — `auth-403-no-result` streams
neither text nor tool use.

## The three pins and one bound that cannot fail

- **THE JOIN IS NEVER DRIVEN WITH TWO NAMES** (T-069-s3). T-069's
  criterion 1 says the parsed denial NAMES reach the diagnostic ring
  *"so `ExitNonZero`'s tail names them"* — plural — and the relay is
  correct. But both relayed fixtures carry exactly ONE denial:
  `denied-then-end-turn` (`WebFetch`) and `denied-fatal-not-flagged`
  (`Bash`), and both pins assert the tail contains that one name. The
  only two-denial fixture is `tool-denied`, which classifies
  `ToolDenied` — a variant with no `stderr_tail` field at all — so its
  tail is never rendered. **Measured twice**: reducing the relay to the
  first name only left `cargo test --test agent_runner` at **66 passed /
  0 failed / 1 ignored, exit 0**, and the combined form (label dropped,
  trailing newline dropped, first name only) left the WHOLE workspace at
  **343 passed / 0 failed / 3 ignored, exit 0** across fifteen
  `test result:` lines. **This is poison shape seven**: zero survivors
  measured against a mutant set derived from the PINS rather than from
  the CRITERIA — the criterion's plural was never turned into a mutant.
- **THE NARROWING IS A STATED DECISION NOTHING PINS** (T-081-s10).
  T-081 narrowed the ring note to the UNANNOUNCED subset — *a name
  already delivered as its own event does not need repeating in a tail*
  — and the narrowing is right. **Measured**, producer-side, one-sided,
  text read back before the run: reverting `denial_names(unannounced…)`
  to `denial_names(&denials)` left bare `cargo test` at **352 passed / 0
  failed / 3 ignored, exit 0** at `5b14603`. Zero bodies red. No fixture
  reaches the difference because it needs all three of: a denial
  announced IN BAND, the `result` line listing it (always — the array is
  cumulative), and the turn classified `ExitNonZero` rather than
  `ToolDenied`. `denied-then-end-turn` satisfies the third and **carries
  no in-band line at all** (verified at `4d2f03c`: an init, one delta,
  and the result line). Every fixture that satisfies the first exits 0.
  **The two halves of the reachable case live in different fixtures** —
  and this is not exotic: CLI 2.1.226 announces every denial in band, so
  the fixture models an older build.
- **SIX MIRRORED NEGATIVE ASSERTIONS CANNOT FAIL ON THEIR OWN**
  (T-069-s1). The idiom is: match on the failure event, then assert the
  settled status is NOT some other variant. Measured during T-069's
  poison sweep (round R10 — the mutation these lines exist to catch):
  both bodies reddened at the `other => panic!` arm, **never at the
  negative assertion below**. `run_turn` sets `out.error =
  Some(error.clone())` and then emits the same value, so the event and
  the stored status cannot disagree about the VARIANT; by the time the
  negative runs, the match arm has already accepted the variant it
  forbids. The form is also green under the storage bug it looks like it
  would catch — `!matches!(None, Some(ToolDenied))` is true. **Nothing
  here is wrong**; the lines are harmless documentation of intent, and
  the drill asks for a body that cannot red to be NAMED rather than
  quietly kept. `grep -c "matches!(status.last_error"` over
  `app/src-tauri/tests/agent_runner.rs` reads **6** at `4d2f03c`.
- **A BYTE BOUND ABOVE THE LOG CAP IS A DEAD BOUND** (T-081-s4). Every
  stream-borne string travels `sessions::truncate_utf8(raw, N)` then
  `docs_watch::sanitize_for_log`, and the second step has a cap of its
  own — `MAX_ECHO_LOG_CHARS`, **800** at `4d2f03c`, plus an explicit
  `…(truncated)` marker — in a different file. **So whenever `N`
  exceeds that cap the runner's own bound is dead for ASCII text.**
  There is a live instance: `MAX_AUTH_MESSAGE_BYTES` is **2048**, and
  its doc comment says *"this is headroom with a hard stop"* — the hard
  stop is somewhere else. `MAX_DENIAL_BYTES` (**128**) is fine and
  `MAX_DENIAL_MESSAGE_BYTES` (**768**) was chosen deliberately below the
  cap with the reason in its comment. **Three constants in one file
  governed by a rule written down in exactly one of them.** Nothing is
  broken — both bounds are safe directions and the observed CLI message
  is about 70 bytes.

## Acceptance criteria

- **THE `Activity` ARM SHALL SET THE SAME DISCRIMINATOR THE `TextDelta`
  ARM DOES**, or the runner SHALL state at the flag why a tool call is
  weaker evidence than prose. THE PROBE SCENARIO SHALL BE ADDED AS A
  FIXTURE — init · `api_retry` 401 · one `tool_use` · exit 1, no
  `result` — and a body SHALL assert it classifies as something other
  than `AuthFailed`.
- **THE `auth-403-no-result` COUNTER-PIN SHALL BE SHOWN STILL RED-ABLE**
  after the widening: it streams neither text nor tool use, so it must
  still classify `AuthFailed`, and the body proving that SHALL be run
  and named.
- IF `Activity` is judged STRONGER evidence than a delta THEN the
  difference SHALL be implemented or explicitly refused in writing — a
  delta is withdrawable evidence and a tool call is not, and two flags
  that could diverge later need the reason recorded now.
- **ONE FIXTURE SHALL CLOSE BOTH DENIAL GAPS AT ONCE**: give
  `denied-fatal-not-flagged` (or a sibling scenario) a SECOND denial AND
  an in-band line for one of them, so the turn is `ExitNonZero`, the
  tail is rendered, and the announced/unannounced split is observable in
  the LIVE `Denied` events — the announced entry emits at its in-band
  moment and is NOT re-emitted at `Result` time, the unannounced one
  emits at `Result` time — while the tail names NEITHER (T-113's
  deletion). T-113's own pin drives a single result-only denial, so this
  split pair is a distinct body, not shape six; say so at the body.
- **THE ORDER AND THE COMPLETENESS OF THE SURVIVING RECORD SHALL BE
  ASSERTED IN ONE BODY**: `denial_names(&denials)` feeding the
  cumulative `ToolDenied` record is the one runner-side producer of a
  multi-name record left after T-113, and no fixture drives it with more
  than one name (re-measure; the note above already orders that). Drive
  it with two names on whichever scenario classifies `ToolDenied`, and
  the first-name-only mutant SHALL be re-run and shown RED. The
  separator lives render-side (`failureDetail`'s join, `app-interview`)
  and is outside this fence — do not reach across for it.
- **THE ABSENCE SHALL BE PINNED, NOT THE NARROWING** (amended by the
  architect, 2026-08-24 — the superseded text is quoted only inside the
  amendment note above): a denial delivered as its own live event is NOT
  also in the tail, asserted on criterion 4's split-pair fixture. The
  restoration of the deleted `permission_denials:` ring note SHALL be
  re-run as a mutant and shown RED. Assert the cumulative `ToolDenied`
  record separately — the two are different questions and a body that
  conflates them pins neither.
- **THE SIX MIRRORED NEGATIVES SHALL BE RESOLVED ONE WAY OR THE OTHER,
  as a family rather than one at a time**: replaced by a positive
  `assert_eq!` on the whole settled error — which would red if
  `AgentState` dropped or rewrote the classification — or deleted, with
  the match arm carrying the claim alone. IF they are kept THEN they
  SHALL be named as bodies that cannot fail, which is what the drill
  asks.
- **THE BOUND RULE SHALL BE WRITTEN WHERE THE BOUNDS LIVE and ASSERTED
  OVER THE CONSTANTS**: a byte bound in the runner must sit below
  `docs_watch::MAX_ECHO_LOG_CHARS` or it is advisory, with a test that
  reds if EITHER file moves. IF `MAX_AUTH_MESSAGE_BYTES` is instead
  lowered under the cap THEN its doc comment's "hard stop" becomes true
  and SHALL say which cap it is under.
- IF inverting the order (escape first, bound last) is preferred THEN it
  is a BEHAVIOUR change — what a truncated escape sequence looks like at
  the cut — and SHALL be its own card rather than a clause here.

Verification: headless — bare `cargo test` from app/src-tauri
(`--no-fail-fast`, exit read unpiped, the total summed from the
`test result:` lines rather than eyeballed), plus `npm test` from app/
if any payload shape moves. **POISON DRILL on every new or changed
assertion**, one side only, producer mutated and never the assertion:
the first-name-only relay, the deleted ring note RESTORED (the
amended criterion 6's mutant), the `Activity` flag removed, one
constant raised above the cap. Every mutated text read back
with `git diff` before its run; restores per-path, proved by sha256
against the drill's own commit. Then T-092's shape-six check on each new
body. The BOOT GATE trigger fires on `app/src-tauri/**` — run the boot
check and record the exit and both `[nputer]` lines. @human: none.

## Implementation notes (executor `claude-opus-5` @T-102)

Lane `task/T-102-auth-discriminator`, base `c4c15c8`, build commit
`023ab3b`. **Main moved to `63099f1` during the lane** — every figure
below is re-derived at the lane's own refs and the drift is named.

### THE BLOCKER'S PRECONDITION WAS VERIFIED, NOT ASSUMED

The amendment says to stop and open a room if the `permission_denials:`
ring note is still in `run_turn`'s `StreamLine::Result` arm. **It is
gone at `c4c15c8`** — the arm carries T-113's `THE RING NOTE FOR THIS
SET IS GONE` comment where the push was (added at `55f9b1b`), the
`unannounced` partition and its emit loop survive, and the only
remaining producer is `denial_names(&denials)` feeding the cumulative
record. No room was needed.

### Criteria 1 and 3 — one flag, and the difference refused in writing

`text_after_auth_status` is renamed **`evidence_after_auth_status`** and
the `Activity` arm now sets it under the same `auth_status.is_some()`
guard the `TextDelta` arm uses. The rename is part of the finding: the
old name said `text`, so the missing arm read as a different subject
rather than as a missing case.

**Criterion 3 is answered as an explicit written REFUSAL**, recorded at
the flag's declaration. Two flags earn their keep only if some reader
makes a different decision from the stronger evidence, and there is
exactly one reader — a guard that WITHDRAWS a claim and never makes one.
Withdrawal has no degrees, and the direction of error is identical for
both sources, so two flags would differ in nothing but name. The
condition under which it splits (a future arm making a POSITIVE claim
from unforgeable evidence) is named at the declaration so the absence is
on the record as checked rather than overlooked.

The probe scenario is `retry-401-then-tool-use-no-result`, built as a
new `Evidence::{Delta, ToolUse}` axis on the EXISTING `no_result_after`
emitter — so the tool-use stream and the delta stream differ by exactly
one line **by construction**, and a body classifying them alike is
measuring the block type and nothing else. Its own control
(`tool-use-no-result-no-retry`) is the same stream minus the 401.

### Criterion 2 — the counter-pin, re-derived rather than inherited

`a_diagnostic_auth_failure_with_no_result_line_at_all_is_still_authfailed`
is the named body. Its doc comment now records that T-069's ground
("this stream carries no DELTA") had to be re-derived after the
widening, and that it holds on a WIDER foot: `auth-403-no-result` is an
init, a diagnostic and an exit, so it streams NEITHER content-block type.
**Shown still red-able by drill M2b** (below).

### Criterion 4 and 6 — the split pair

`denied-announced-and-silent-nonzero` is the intersection no fixture
occupied: an in-band denial, a cumulative `result` line, `is_error:
false` (so `ToolDenied` is declined and the turn is `ExitNonZero`, which
is the only variant with a `stderr_tail`), a NON-ZERO exit, and the CLI's
own stderr as the positive control. The body asserts two events not
three, their ORDER against an `Activity` liveness witness, and that the
tail names neither tool nor the deleted note's label — with the control
asserted FIRST.

**The shape-six answer is measured rather than promised.** Over T-113's
`denied-result-only-nonzero` every denial is unannounced, so restoring
the note NARROWLY and restoring it WIDELY are the same mutant. Over this
stream they are two, and **the announced-only restoration (M4) reds this
body alone** while T-113's own pin stays green.

### Criterion 5 — the card's own note is half right, re-measured

The note orders a re-measurement and it was owed. At `c4c15c8`:
`retry-401-then-tool-denied` drives the join with ONE entry;
`tool-denied` drives it with **TWO**, so a first-name-only mutant
already reds there on LENGTH (M5 confirms: it reds
`a_turn_killed_by_a_denied_tool_names_the_tool_rather_than_the_exit_code`
too). **But both entries are `Bash`** — the real capture refused one
tool twice — so the census is a PALINDROME and blind to a reversal. The
gap is narrower and sharper than "more than one name": it is ORDER.

`tool-denied-two-names` supplies two distinct names in a known order.
Its unique mutant is **not** a reordering of `denial_names` (a lib unit
test, `result_denial_entries_carry_the_join_key_beside_the_name`,
already pins that function's order over `["WebFetch", …, "Legacy"]`) but
a reordering at the **`TurnError::ToolDenied` construction site** (M6b),
which no function-level test can see. That distinction is stated at the
body.

### Criterion 7 — SEVEN, not six, and the family is replaced by a positive

`grep -c "matches!(status.last_error"` reads **7** at `c4c15c8`, against
the card's **6** at `4d2f03c`: T-113 added one at `55f9b1b`. All seven
are replaced by `assert_settled_error_is(&status, &failed, why)`, an
equality against the failure event itself — which entails the old
inequality and much more. Each call site still NAMES the variant its
turn must not be confused with, in the message, so the original claim
survives rather than being traded away.

**The measurement that justifies it is the best thing in this lane.**
Drill M9 drops `guard.last_error = outcome.error.clone()` in
`agent/mod.rs`:

- at the build commit `023ab3b`: **exit 101, ten bodies red** (all seven
  converted sites plus the three new ones);
- at the BASE `c4c15c8`, same mutant, same file, same token:
  **75 passed / 1 failed** — every one of the seven mirrored negatives
  GREEN, run twice.

And the single red at base is
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`,
whose settling assertion is already
`assert_eq!(status.last_error.as_ref(), Some(&error))` — **the positive
form, in this same file since T-039**. So T-102 did not invent the
replacement; it generalised the one assertion in the file that could
already catch a dropped classification.

### Criterion 8 — the rule where the bounds live, and a class per constant

The caps block in `runner.rs` now heads with the rule, and each of the
three bounds states its CLASS. `MAX_AUTH_MESSAGE_BYTES` is **deliberately
NOT lowered**, and the reason is a finding `T-081-s4` did not reach:
`sanitize_for_log` MARKS its cut and `truncate_utf8` does not, so a
bound that LOSES to the cap truncates visibly and a bound that WINS
truncates SILENTLY. Lowering it under the cap makes "hard stop" true and
removes the `…(truncated)` disclosure from the one string a user reads
when their login is refused. The doc comment was corrected instead;
`T-102-s2` carries the trade.

The test DERIVES the cap behaviourally rather than naming it, because
`MAX_ECHO_LOG_CHARS` is private to `docs_watch` and reaching it means
widening a fence to assert a number (`T-102-s1`). It reds from **both**
sides — M7 raises a bound here, M8 lowers the cap there, both exit 101.

### Criterion 9 — not built, and that is the criterion being obeyed

Inverting the order (escape first, bound last) is a BEHAVIOUR change and
the criterion routes it to its own card. `T-102-s2` is that routing,
with three dispositions and the fixture consequences of each.

### For the verifier

- **The drafter's note says "remove before landing" and CRITERION 5
  CITES IT** — *"re-measure; the note above already orders that"*.
  Removing the note breaks a live cross-reference in the acceptance
  criteria, so this lane left both notes in place rather than half-doing
  it. Whoever removes it owes criterion 5's sentence a rewrite.
- **`T-069-s1`'s "at least four bodies" reads SEVEN at this base**, not
  six. Re-derive at your own ref; T-113 moved it once already.
- **STATE's third intermittent fired in a FRESH drill worktree with a
  small `CARGO_TARGET_DIR`** — the configuration STATE's hypothesis
  calls green — once in thirteen full runs, with the identical mutant
  re-run immediately afterwards as its control. Filed as `T-102-s3`.
  Expect it; it is not this lane's.
- `app/src/lib/agent-store.ts` is inside the fence and **was not
  touched**: no payload shape moves, no `TurnError` variant gains or
  loses a field, so the app suite is unaffected (958/958, unchanged).


## Verdicts

2026-08-25 — `claude-opus-5 @T-102-verify` (verifier, same-model as
builder): **APPROVED**, with two RECORD defects the integrator owes a
correction (neither is a behaviour defect and neither blocks the merge —
they are named at the end).

Verified from the card at its BASE ref `c4c15c8` — the copy that carries
the drafter's note and the architect's amendment and NOT the executor's
notes — plus the diff, per T-121 arm 2. The mutant set below was derived
from the CRITERIA with `tests/agent_runner.rs` unopened and written down
before any of it ran; the lane's notes were read only afterwards, to
check the EVIDENCE half. Every figure is re-derived at this verifier's
own refs in a fresh detached worktree `/Users/ujju/Projects/drill-T-102-verify`
at `935a78d`. Nothing was taken on report.

### The range, checked as SETS and not as counts

    git merge-tree --write-tree 9b9c997 935a78d  ->  tree 17c8c178…, exit 0 (read off $? first)
    git diff --name-only 9b9c997 <TREE>            ->  7   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only c4c15c8..935a78d          ->  7   branch-only
    git diff --name-only 9b9c997...935a78d         ->  7   THREE dots — AGREES, SIXTH MERGE RUNNING
    git diff --name-only 9b9c997..935a78d          -> 16   two dots, FORBIDDEN
    git diff --name-only c4c15c8..9b9c997          ->  9   main's advance under this lane

`diff` over sorted lists: prescribed vs three-dot **exit 0**, prescribed
vs branch-only **exit 0**. `comm -12` over branch and main-advance is
**EMPTY**; the union is byte-identical to the forbidden two-dot set under
`diff` (exit 0), and 7 + 9 = 16. Ratio **2.29x**, pure left-endpoint
drift. **Main's 9 paths contain ZERO `.rs`**, which is what makes the
base reconstruction below legitimate.

### Suites — every exit off its own `$?` on the next token, count derived as well as exit

- **cargo (bare, `--no-fail-fast`) — 460 passed / 0 failed / 3 ignored,
  exit 0**, summed over **SIXTEEN** `test result:` lines. Lib suite
  **3.96 s** — the isolated-target-dir band, so `T-088-s4`'s cliff is not
  in play. Green first time, nothing discarded.
- **`cargo test --test agent_runner` — 80 passed / 0 failed / 1 ignored,
  exit 0** (base is 76/0/1, re-derived below).
- **app `npm run build` exit 0**, **`npm test` — 958/958 across 46 files,
  exit 0.**
- **lib/parser `npx vitest run` — 264/264 across 12 files, exit 0.**
- **tools/e2e `npm test` on scratch port 15280 — TWO RUNS, BOTH
  DECLARED.** Run 1 **exit 1, 145 passed / 1 failed**; run 2 **exit 0,
  146/146**. The single red is `T-120-s3` at
  `tools/e2e/tests/token-scan.spec.ts:201`, WITH THE SIGNATURE:
  `Expected: 1787659054258.047 / Received: 1787659054258`. A fractional
  millisecond against a whole number is the identification, this was a
  fresh checkout, and the rule was obeyed — one further run, not
  re-running until green.
- **`NPUTER_BOOT_PORT=15281 npm run boot:check` — exit 0**, both lines:
  `[nputer] project folder: /Users/ujju/Projects/drill-T-102-verify` and
  `[nputer] window "main" created`.

**THE INTERMITTENT TALLY, HONESTLY.** Across 1 bare `cargo test`, 15
`--test agent_runner` runs, 4 `--lib`/full runs and 2 E2E runs:
`a_hostile_session_id…` (`T-086-s1`) fired **ZERO** times spuriously — it
appears only under mutant M9, where it is a genuine kill.
`a_result_only_denial_is_a_live_event_and_is_not_repeated_in_the_tail`
(`T-124-s3`) fired **ZERO** times spuriously — it appears only under M3,
genuinely. `T-102-s3`'s subject did not reproduce here.

### The three gates, each with its derived path count

| gate | derived | verdict |
|---|---|---|
| GRAPH REGEN | **3 of 7** `.rs` outside `docs/` | **FIRES** |
| BOOT GATE | **3 of 7** under `app/src-tauri/**` | **FIRES** |
| DOCS GATE | **4 of 7** under `docs/` | **FIRES**, exit 1 |

- **GRAPH REGEN — `cargo run -p nputer-index -- index --check --root ../..`
  is exit 1, STALE**, and it is a REAL red, not the missing-`--root`
  false one: the second line prints both counts and a `~` file diff.
  Committed **920 597 · 178 · 1959 · 1878** → fresh **922 888 · 178 ·
  1966 · 1878**: **+7 symbols, edges unmoved**, the three moved files
  being exactly the three `.rs` in this diff. The regen is the
  INTEGRATOR's and the lane correctly did not take it. Against
  `max_graph_bytes` 1 000 000 the fresh figure is **92.29%**.
- **DOCS GATE** — invoked from the repo root with the prescribed path
  list as `$(…)` arguments, **never through `xargs`**: exit 1, **12
  derived readers across 4 suites**, census **130 docs-shaped sites in 22
  files**, **0 frontmatter issues**, *"every live task card's frontmatter
  parses, with a legal status"*. Suites owed: `npm test from app/`,
  `npm test from tools/e2e/`, `npx vitest run from lib/parser/` — all
  three run and green above. `cargo test` is owed anyway by the `.rs`
  paths and is green.

### Every criterion, and how it was attacked

**C1 — the `Activity` arm sets the discriminator; the probe scenario is a
fixture; a body asserts it is not `AuthFailed`. MET.**
`retry-401-then-tool-use-no-result` rides the EXISTING `no_result_after`
emitter on a new `Evidence` axis, so it is the delta stream minus exactly
one line by construction. Attacked three ways, all producer-side:
**V1** (delete the two lines in the `Activity` arm) reds
`a_recovered_auth_retry_followed_by_a_tool_call_and_no_result_line_is_not_an_auth_failure`
**ALONE** — 79/1/1, exit 101. **V11b** (move the `tool_use` BEFORE the
401, so `auth_status` is still `None` when it arrives) reds the same body
alone — the `auth_status.is_some()` scoping is real, not decorative.
**V15** (flip the control's `with_retry` on) reds
`the_same_tool_use_stream_without_the_retry_line_has_nothing_to_relay`
alone, so the control is a control.

**C2 — the counter-pin shown still red-able, and named. MET.**
`a_diagnostic_auth_failure_with_no_result_line_at_all_is_still_authfailed`.
**V2** (drop `| Some(403)` from the guard) reds it **ALONE** — 79/1/1,
exit 101. Its standing after the widening is not inherited: verified in
the source that `auth-403-no-result` streams neither content-block type,
so there is no evidence of either kind for the widened flag to read.

**C3 — one flag or two, decided in writing. MET, and I agree with the
refusal.** There is exactly one reader of this flag and it WITHDRAWS a
claim; withdrawal has no degrees, and the direction of error is identical
for both sources. The condition under which it must split — an arm making
a POSITIVE claim from unforgeable evidence — is named at the declaration,
so the absence is recorded as checked. Two flags today would differ in
nothing but name.

**C4 — one fixture closing both denial gaps. MET.**
`denied-announced-and-silent-nonzero` is genuinely the intersection: I
confirmed in the fake agent that every other denial fixture either
carries no in-band line or exits zero. The body asserts two events not
three, their ORDER against an `Activity` liveness witness, and the
control FIRST. **V5** (delete the `unannounced` partition, so every
denial re-emits at `Result` time) reds 4 bodies including this one —
76/4/1, exit 101.

**C5 — order AND completeness of the surviving record, in one body, with
the first-name-only mutant re-run and shown RED. MET — and the LANE'S
READING OF THE CARD IS CORRECT.** I reproduced both halves at BASE by
reconstructing `c4c15c8`'s three `.rs` files in the drill worktree (legal
because main's advance carries zero `.rs`; the three blobs were checked
`git hash-object`-for-`rev-parse` identical, and base pristine is
**76/0/1, exit 0**).

- **V6 / first-name-only at TIP**: reds **two** bodies — the new
  `the_cumulative_record_keeps_every_name_in_the_order_the_cli_listed_them`
  AND the pre-existing
  `a_turn_killed_by_a_denied_tool_names_the_tool_rather_than_the_exit_code`.
- **V6 at BASE: 75 passed / 1 failed, exit 101**, and the one red is that
  same pre-existing body — on LENGTH.
- **V7 / reversal at BASE: 76 passed / 0 failed, exit 0. IT SURVIVES.**

So the card's pin 1 is **half wrong at this card's own base**: its
measurement (*"reducing the relay to the first name only left … 66 passed
/ 0 failed"*) was about the RING-NOTE relay at `4d2f03c`, which T-113 has
since deleted, and it does not transfer to the surviving `ToolDenied`
producer. `tool-denied` DOES drive that producer with two entries, so
first-name-only already reds there. **The palindrome reading is right**:
`["Bash", "Bash"]` reversed is itself. The real gap is ORDER.

And the lane's shape-six answer for that body is right for a reason
sharper than "reverse `denial_names`": a **lib** unit test
(`result_denial_entries_carry_the_join_key_beside_the_name`) already pins
that function's order over `["WebFetch", "Legacy"]` — **V7 under
`cargo test -p nputer --lib` reds exactly that test, 160/1**. So the
unique mutant has to be at the `TurnError::ToolDenied` construction site.
**M6b** (`names.reverse()` at `permission_denials = names`) run over the
WHOLE workspace: **459 passed / 1 failed / 3 ignored, exit 101**, the one
red being the new body. Unique-kill, workspace-wide.

**C6 — the ABSENCE pinned, the ring-note restoration re-run and shown
RED, the cumulative record asserted separately. MET, and the unique-kill
separation reproduces exactly.**

- **M3** — restore the note over the **UNANNOUNCED** set: **75/5/1, exit
  101**, five bodies including T-113's own pin.
- **M4** — restore it over the **ANNOUNCED** set only: **79/1/1, exit
  101**, reds
  `an_announced_denial_is_not_repeated_at_result_time_and_neither_name_reaches_the_tail`
  **ALONE**, with T-113's pin GREEN. The failure message carries the
  proof: `stderr_tail` = `"…transport closed…\npermission_denials: Bash\n"`.

That separation is what makes criterion 6 a pin and not a restatement,
and it is the mutant a careless revert to the pre-T-081 shape lands on.

**C7 — the mirrored negatives resolved as a family. MET. SEVEN, not six —
the CARD is stale at its own base.**
`grep -c "matches!(status.last_error"` over `tests/agent_runner.rs` reads
**7 at `c4c15c8`** and **7 at main `9b9c997`**, against the card's *"reads
**6** at `4d2f03c`"*. At the tip it reads **1**, and that one is inside
the replacement helper's doc comment quoting the retired form. All seven
live sites are replaced; `assert_settled_error_is` has **10 call sites**.

**THE REPLACEMENT IS NOT THE SAME TAUTOLOGY IN A NEW COSTUME, AND THE
MEASUREMENT IS THE PROOF.** M9 (`guard.last_error = outcome.error.clone()`
→ `= None` in `agent/mod.rs`, a file this diff does not touch):

- at the **TIP**: **69 passed / 11 failed / 1 ignored, exit 101**;
- at the **BASE**: **75 passed / 1 failed / 1 ignored, exit 101**.

Every one of the seven mirrored negatives is GREEN under the storage bug
they look like they would catch; the ten converted-and-new sites all red.
The single base red is
`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
— **and I checked its panic rather than assuming it was `T-086-s1`**: it
is `left: None / right: Some(RejectedSessionId {…})`, the POSITIVE
equality already in the file since T-039. So the lane generalised the one
assertion that could already catch a dropped classification, which is a
better provenance than inventing a form.

**One precision the lane's notes owe.** They say M9 gives *"ten bodies
red"* at the build commit. The measured total at the tip is **ELEVEN** —
the ten new kills plus that same pre-existing positive, which reds at the
tip for the identical reason it reds at the base. Ten is the count of
NEW kills, which is the number that carries the argument; the total is
one higher.

**The honest residual, recorded and NOT blocking.** The equality is
against the failure EVENT, so it pins the
`run_turn` → `out.error` → `AgentState::last_error` → `GenesisStatus`
seam and cannot see a MISCLASSIFICATION inside `run_turn` — the match arm
above each call site already does that, and the helper says so. The
consequence is that all ten sites kill one mutant class, so nine are
redundant with respect to M9. They are no longer bodies that CANNOT fail,
which is what the criterion asked for; they are ten copies of one kill.

**C8 — the bound rule written where the bounds live and asserted over the
constants, with a test that reds if EITHER file moves. MET, and the
derivation genuinely binds BOTH constants.** Drilled in three directions,
all `cargo test -p nputer --lib`:

- **V8** — `MAX_DENIAL_MESSAGE_BYTES` 768 → 2048 (a bound here raised
  past the cap): **159/2, exit 101**, message *"768 … is above the
  800-character log cap"* with the cap DERIVED, not named.
- **V9** — `docs_watch::MAX_ECHO_LOG_CHARS` 800 → **700** (THE OTHER
  FILE, downward): **159/2, exit 101**.
- **V9b** — the same constant 800 → **4096** (THE OTHER FILE, upward):
  **159/2, exit 101**, this time on the ADVISORY arm.

So it is not "only observing one": the LIVE arm reds when either file
moves the pair apart downward, and the ADVISORY arm reds when either
moves it apart upward. I also confirmed the test measures the composition
that actually RUNS: all three constants are applied through
`sanitize_for_log(truncate_utf8(raw, N))` in production —
`MAX_DENIAL_BYTES` and `MAX_DENIAL_MESSAGE_BYTES` via the
`bounded_stream_string` helper, `MAX_AUTH_MESSAGE_BYTES` via the same
composition written out inline at the `AuthFailed` construction. Nothing
about the pin is synthetic.

**MY INDEPENDENT RULING ON THE DECLINE: THE REFUSAL IS CORRECT, AND IT
DOES NOT DODGE THE CRITERION.**

1. **Read as EARS, the criterion does not ask for the lowering.** Its
   SHALL is *write the rule where the bounds live* and *assert it over
   the constants with a test that reds if either file moves*. The second
   sentence is an `IF … THEN` whose antecedent is *"IF
   `MAX_AUTH_MESSAGE_BYTES` is **instead** lowered"* — a conditional
   obligation triggered only by taking that option. Declining an option
   is not declining a requirement, and the mandatory half is built and
   measurably pinned above.
2. **The reason given is a real measurement and I reproduced it.**
   `sanitize_for_log` appends `…(truncated)`; `truncate_utf8` appends
   nothing (`docs_watch.rs`, read directly). So a bound BELOW the cap
   wins and cuts SILENTLY; a bound ABOVE it loses for ASCII and inherits
   a MARKED cut. Lowering `MAX_AUTH_MESSAGE_BYTES` under 800 would make
   "hard stop" literally true and would remove the disclosure from the
   one string a user reads when their login is refused. That is a trade,
   and the criterion asks for no trade.
3. **The THEN-clause's own obligation is discharged anyway.** The doc
   comment names which cap outranks it, retracts "hard stop" in as many
   words, and states what the bound still does (multi-byte text, where
   2048 bytes can be 512 characters; and it is what stops a hostile
   stream handing `sanitize_for_log` an unbounded allocation). The
   comment was corrected instead of the constant, which is the honest
   half of the finding.
4. **AND THE DECLINE IS ENFORCED, NOT MERELY DOCUMENTED — this is the
   part that settles it.** I ran the criterion's own IF-arm as a mutant:
   **V14**, `MAX_AUTH_MESSAGE_BYTES` 2048 → 700, over the WHOLE
   workspace: **459 passed / 1 failed / 3 ignored, exit 101**, reddening
   `every_byte_bound_here_is_classified_against_the_log_cap_that_outranks_it`
   **ALONE**, with a message that tells the next editor exactly what they
   just gave up. A future card that wants the trade the other way cannot
   take it silently. That is a stronger outcome than either arm of the
   criterion asked for.

On `T-102-s1`: the workaround is sound. `MAX_ECHO_LOG_CHARS` is a bare
private `const` in a sibling module, so the named form does not compile
without widening a fence to assert a number; deriving the cap from
`sanitize_for_log`'s own public behaviour asserts the BEHAVIOUR that
governs rather than the number, and V8/V9/V9b prove it reds from both
files. The finding is correctly filed rather than papered over.

**C9 — the order inversion routed to its own card. MET vacuously and
correctly.** `T-102-s2` is that routing.

### Unhappy paths the criteria imply but do not spell out

- **A `tool_use` BEFORE the status must not withdraw the claim.** V11b:
  reds. The `auth_status.is_some()` guard holds.
- **A NEW status must supersede earlier evidence, for the new source as
  well as the old.** **V13** — delete `evidence_after_auth_status = false`
  from the `Diagnostic` arm: **79/1/1, exit 101**, reddening
  `a_second_auth_retry_behind_the_recovered_one_is_still_an_auth_failure`
  ALONE. **So the lane's refusal to add a `tool_use` twin of that fixture
  is CORRECT under SHAPE SIX**: the one reset line is shared by both
  sources and the existing delta body already kills its only mutant. A
  twin would kill nothing that body does not.
- **Is the new body vacuous?** No: it asserts the `Activity` ARRIVED and
  that NO `TextDelta` rode with it, before asserting the classification —
  so it cannot pass by the old arm's route.

### Security sweep — MANDATORY, and this card is squarely on it

- **Can a CLI that fabricates or replays a `tool_use` block now suppress
  a real auth failure? YES — and it could already, at identical cost.**
  `StreamLine::Activity` is produced by `classify_line` from exactly two
  shapes, both genuine model-response block types: a `stream_event` /
  `content_block_start` whose `content_block.type` is `tool_use`, and an
  `assistant` message with a `tool_use` block. One line of CLI stdout
  after the last status-bearing line withdraws the classification. But
  **one `text_delta` line did exactly that before T-102**, so the flag is
  **not settable more cheaply than before** — it is settable by a second
  shape at the same cost, and a replay from BEFORE the status is
  ineffective (V11b) as is a replay behind a NEW status (V13).
- **The consequence is a downgrade, never an escalation.** The flag has
  exactly one reader, a `!`-guard that WITHDRAWS. When it is wrong the
  turn still fails: `ExitNonZero` with the 401/403 still legible in
  `stderr_tail`, and the only user-visible change is *Try again* instead
  of `claude login`. Nothing authenticates, no credential is accepted, no
  write is enabled, no state is persisted. The trust boundary does not
  move: the party who can write this stream is the CLI, which the app
  already trusts to report its own outcome and which is resolved through
  `validate_resolved_program`'s absolute / traversal-free / name-matched
  gate.
- **No new bound admits an unbounded string.** The addition is a `bool`.
  All three byte constants keep their values; the new caps-block text is
  a comment and the new lib body is a test.
- **`ENV_ALLOWLIST` byte-identical** (16 entries, `diff` exit 0 between
  `9b9c997` and `935a78d`); **`ENV_ALLOWLIST_LINUX` unchanged**.
- **`acl_pin.rs` UNTOUCHED** — the blob is `53aa795b…` at main and at the
  tip, a 0-file diff. No new grant, no new IPC command, no manifest and
  no lockfile in the diff, therefore **no dependency addition to argue
  about**.
- **`docs_watch.rs` is a 0-file diff** — the bound rule reaches across a
  module boundary by reading behaviour, not by editing the other file.
- **No secrets, keys or tokens in the diff** (scanned; the two `token`
  hits are prose about a source token).
- **ONE OBSERVATION, PRE-EXISTING, FILED RATHER THAN CHARGED HERE.**
  `RunEvent::Activity { label }` reaches the webview through **neither**
  bound: no `bounded_stream_string`, no `cap_text`, no
  `sanitize_for_log`, so its only ceiling is `MAX_LINE_BYTES` (1 MiB) and
  control characters are not stripped — while the SAME `tool_use` block's
  name, read on the denial path, is capped at `MAX_DENIAL_BYTES` (128)
  and stripped. That asymmetry predates this diff and is not a
  regression, but T-102 makes it newly relevant (the `Activity` arm is
  now load-bearing for the auth discriminator) and the new caps-block
  header states a universal — *"Every stream-borne string in this module
  reaches the app through `bounded_stream_string`"* — that this label,
  the `TextDelta` relay and `terminal_reason` each falsify. Filed as
  **`T-102-s4`**.

### The capture fixture, before and after everything

`docs/research/captures/real-planner-turn-2026-08-19.jsonl` —
sha256 **`273a3d33593a53614101489b9cd3e9574010beae3830a60f43a8e65f74da47ac`**
read BEFORE any command in this pass (in main and in the lane's worktree,
identical) and again AFTER the last mutant was restored. The git blob is
`72e2c939…` at BOTH `c4c15c8` and `935a78d`.

### The drill's own hygiene

Detached worktree `/Users/ujju/Projects/drill-T-102-verify` at `935a78d`,
OUTSIDE the repository, named per-lane, with `CARGO_TARGET_DIR` set
explicitly inside it. Every mutant is PRODUCER-side, one side only, never
an assertion and never a literal the two share. Every mutated text was
read back with `git diff` BEFORE its run. Restores are per-path and
proved by sha256 against the drill's own baseline —
`runner.rs fa526b0a…`, `fake_agent.rs b0bd0728…`, `docs_watch.rs
3c7e35f3…`, `agent/mod.rs 8ba0c1e1…`, `tests/agent_runner.rs 4fbdfc97…`
— all six hashes identical before and after, `git status --porcelain`
empty. DID-NOT-COMPILE was judged on `error[E` / `could not compile`,
never on a bare `^error`: **every mutant compiled, 0 and 0 on both counts
in all fourteen runs.**

**NO SURVIVORS, THEREFORE NO DEAD MUTANT AMONG THEM.** Fourteen mutants,
fourteen reds — V1, V2, M3, M4, V5, V6, V7 (tip), V7 (lib), M6b, V8, V9,
V9b, V14, V13, V11b, V15 — plus three deliberate SURVIVALS at the BASE
which are the point rather than a defect (V7 base 76/0/1 exit 0 proves
criterion 5's gap was real; M9 base 75/1 proves criterion 7's was). The
lane's own dead-mutant catch (M2 overwritten by an existing reset,
replaced by M2b) is not reproducible from the record — see defect 1.

### The drafter's note marked "remove before landing", which criterion 5 cites

**THE LANE'S DISPOSITION IS CORRECT AND I RATIFY IT.** Criterion 5 ends
*"(re-measure; the note above already orders that)"*, a live
cross-reference from the ACCEPTANCE CRITERIA into the note. Deleting the
note without rewriting that clause would leave a dangling reference in
the criteria themselves — strictly worse than a note that outstays its
own instruction — and rewriting an acceptance criterion is not an
executor's edit to make mid-build. The debt is recorded in the lane's own
handoff. **It is now doubly cited**: the implementation notes reference it
too. Whoever removes it owes criterion 5's sentence a rewrite in the same
commit, and this verdict is the third place saying so.

### Where this brief and the CARD were wrong

- **THE CARD, criterion 7 and its pin 3: "SIX MIRRORED NEGATIVE
  ASSERTIONS".** It is **SEVEN** at this card's own base `c4c15c8`, and
  seven at main. The card's six is a figure carried from `4d2f03c`;
  T-113 added the seventh. `T-069-s1`'s *"at least four bodies"* reads
  seven too. The lane re-derived and is right.
- **THE CARD, pin 1 and criterion 5's premise.** *"THE JOIN IS NEVER
  DRIVEN WITH TWO NAMES"* and its measurement are true of the RING-NOTE
  relay at `4d2f03c` and NOT of the producer that survives T-113:
  `tool-denied` drives `denial_names` with two entries, and
  first-name-only already reds at the base (measured, 75/1). The real gap
  is order, and the card's own instruction to re-measure is what caught
  it.
- **THE BRIEF, item 4, third bullet.** It describes M4 as reddening "its
  body alone" and M3 as reddening five — both reproduce exactly. But it
  also asks whether the M9 figure of "ten bodies" holds: the measured tip
  total is **eleven**, ten of them new. The brief inherits the lane's
  one-short total.
- **THE BRIEF, item 9's reference figures** are all confirmed at my own
  ref: cargo 460/0/3 over 16 lines, base 455/0/3 (main), `--test
  agent_runner` 80/0/1 against a base of 76, app 958/958, parser 264/264,
  e2e 146/146 on the second run.
- **THE BRIEF, item 10's gate figures** are all confirmed:
  920 597 · 178 · 1959 · 1878 → 922 888 · 178 · 1966 · 1878, +7 symbols,
  edges unmoved; boot gate exit 0 with both lines; docs gate 4 of 7.

### The two RECORD defects the integrator owes a correction

Neither is a behaviour defect, neither is reproducible as a test failure,
and neither blocks the merge. Both are in the deliverable's own account
of itself, which is the thing this repository treats as load-bearing.

1. **THE POISON DRILL'S RECORD IS INCOMPLETE AND CARRIES A DANGLING
   CROSS-REFERENCE.** The implementation notes say *"Shown still red-able
   by drill **M2b** (below)"* — and there is no table below, on this card
   or anywhere on the branch (`git log -p c4c15c8..935a78d` over the card
   returns no drill table; the two suggestion files that mention mutants
   only cite them by label). The labels **M1, M2, M3 and M6 are never
   defined anywhere in the deliverable**, and the Verification section's
   own hand-named list of four required mutants is only three-quarters
   reported: the first-name-only relay (M5), the restored ring note (M4)
   and the raised constant (M7) each have a result in prose, but **"the
   `Activity` flag removed" has no reported result at all** — criterion
   1's section names no mutant. I ran it myself (V1, reds one body) so
   the property holds; what is missing is the lane's record of it. Under
   the succession rule, the M2/M2b dead-mutant account exists only in a
   dispatch message and therefore did not happen.
2. **A NEW UNIVERSAL IN SHIPPED SOURCE IS FALSE AS WRITTEN.** The new
   caps-block header asserts *"Every stream-borne string in this module
   reaches the app through `bounded_stream_string`"*. There are exactly
   **three** production call sites of that helper, all on the denial
   path. The `Activity` label reaches the webview through no bound in
   this module at all; the `TextDelta` relay goes through `cap_text`
   (32 KiB) instead; `terminal_reason` goes through `sanitize_for_log`
   alone, with no byte bound here — a third class the new two-class
   scheme (LIVE / ADVISORY) has no name for. `T-102-s2` repeats the same
   sentence. This is the `CLOSED AT TWO` class of defect arriving in a
   comment: an unfalsifiable-as-written universal that no test asserts
   and that was already false when it was typed. The narrow repair is one
   clause — *every stream-borne string THIS BLOCK BOUNDS* — and the wide
   one is `T-102-s4`.

**VERDICT: APPROVED.** All nine criteria are met; every pin the card asks
for reds under a producer-side mutant I derived independently from the
criteria before opening the test file; the unique-kill separations the
lane claims (M4 against M3, M6b workspace-wide, V1 alone) all reproduce;
the criterion-8 decline is correct, is not a dodge, and is enforced by a
body that reds if anyone takes the other side of it silently; the seven
replaced negatives are a real replacement and not the old tautology in a
new costume, proved by a mutant that reds ten new bodies at the tip and
leaves all seven of their predecessors green at the base; and the
security sweep finds nothing this diff introduced.

### ADDENDUM — MAIN MOVED UNDER THIS PASS, AND THE RANGE WAS RE-DERIVED

Every figure above is at the ref it names, and the ref this pass began
against — main `9b9c997` — is no longer main's tip: **T-107 merged and
checkpointed while this verification ran, taking main to `5230152`.**
Re-derived at the new tip against the verdict commit `c0ff888`:

    git merge-tree --write-tree 5230152 c0ff888 -> tree e973c924…, exit 0
    git diff --name-only 5230152 <TREE>          ->  8   PRESCRIBED
    git diff --name-only 5230152...c0ff888       ->  8   three dots — `diff` exit 0 against it
    git diff --name-only c4c15c8..5230152        -> 21   main's advance since this card's base

`comm -12` over the lane's 8 and main's 21 is still **EMPTY**, so this
lane and main remain disjoint and the merge is still clean. Main's 21
carry **zero `.rs`**, which is what kept the base reconstruction used for
criteria 5 and 7 above legitimate.

**BUT ONE BASELINE IN THIS VERDICT IS NOW STALE AND THE INTEGRATOR MUST
NOT QUOTE IT.** T-107's checkpoint regenerated the committed graph:
`docs/architecture/graph.json` is **921 608 bytes** at `5230152` against
the **920 597** this pass measured `index --check` STALE against. The
`+7 symbols / edges unmoved` finding is about this lane's three `.rs`
files and still holds as a DELTA; the absolute forecast does not.
Re-run `cargo run -p nputer-index -- index --check --root ../..` at the
merge and read its own numbers.

## Integration

Merged 2026-08-25 by a third hand that neither built nor verified this
card. Main-before **`48ed848`**, lane tip **`d12efac`**, merge
**`a9ed33d`**, this checkpoint after it. The forecast tree
`125e496b…` from `git merge-tree --write-tree` (exit read off `$?`
FIRST, **0**) is byte-identical to `git rev-parse HEAD^{tree}` at the
merge; parents are `48ed848` and `d12efac` and nothing else, so
**nothing was written into the merge commit**. `blocked_by: [T-113]`
was checked rather than assumed: T-113 reads `status: done` on main.

### THE VERDICT'S MECHANISM WAS WRONG AND IT IS RECORDED, NOT REPAIRED

**The verifier committed its verdict by repointing the shared branch ref
with raw `git update-ref` from an unrelated detached worktree, twice,
instead of committing inside the lane's worktree.** The damage is bounded
and was re-verified here rather than taken on report: `935a78d` **is** an
ancestor of `d12efac` (`git merge-base --is-ancestor`, exit 0), so the
lane's work is intact; the one discarded commit, `c0ff888`, was the
verifier's OWN first verdict commit and survives in the reflog; and the
lane worktree's index had gone one commit stale, showing a spurious
staged delete and a modify, which the dispatching pass repaired with
`git reset --hard d12efac` after confirming nothing unstaged and nothing
untracked would be lost. It was clean at **0 dirty paths, HEAD
`d12efac`** when this integrator read it.

**THE RULE IT EARNS BELONGS WITH THE METHOD RATHER THAN IN A VERDICT: a
verifier commits its verdict IN the lane's worktree, or in its own
checkout of that branch — never by repointing a shared ref from
elsewhere**, because the ref is shared state and every other holder's
index silently goes stale. Routed to **T-104**, the rulings vehicle.
**The verification was NOT re-run**: its substance was checked and is
sound, and it is the mechanism that was wrong.

### THE TWO RECORD DEFECTS — one routed, one recorded, neither repaired here

1. **The drill's record is incomplete**, and the integrator confirms the
   verifier's finding independently: the implementation notes say *"Shown
   still red-able by drill M2b (below)"* and **there is no table below,
   anywhere on the branch**; labels M1/M2/M3/M6 are never defined; and of
   the four mutants the Verification section names by hand, **"the
   `Activity` flag removed" has no reported result at all**. The verifier
   ran it independently (V1, reds one body) so the PROPERTY holds — what
   is missing is the lane's own record of it, and under the succession
   rule a dead-mutant account that exists only in a dispatch message did
   not happen. **Recorded, not repaired**: an integrator cannot
   retroactively author a drill record it did not run.
2. **A new universal in shipped source is false**, verified here at the
   source rather than relayed: `grep -n bounded_stream_string` over
   `app/src-tauri/src/agent/runner.rs` returns exactly **three**
   production call sites (all on the denial path), plus the definition
   and two test sites — while the caps-block header claims *"Every
   stream-borne string in this module reaches the app through
   `bounded_stream_string`"*. The `Activity` label, the `TextDelta` relay
   (`cap_text`, 32 KiB) and `terminal_reason` each falsify it, and
   `T-102-s2` repeats the sentence. **DISPOSITION: ROUTED, NOT
   CORRECTED**, and the reason is precedent rather than preference —
   T-107's integrator met the identical shape one card earlier (a false
   claim in a source comment inside the merged fence, the lane's
   *"criterion 3 SATISFIED rather than dodged"*) and left the source as
   filed while carrying the corrected word in ARCHITECTURE and the card.
   Editing shipped Rust in a checkpoint would ship an unverified source
   change, would re-stale the graph this checkpoint just regenerated
   (`runner.rs` is indexed), and is not on `integrator.md`'s ritual list.
   The narrow repair is one clause — *every stream-borne string THIS
   BLOCK BOUNDS* — and the wide one is `T-102-s4`. **The narrow repair
   has no carrier of its own**; a triage pass should give it one.

`T-102-s1`…`T-102-s4` all stay `status: suggested` exactly as filed.
Triage is not the integrator's (T-083's ruling), and that includes
`T-102-s4`, which falsifies a universal T-102 itself wrote.

### Range, gates and suites — every figure derived here, at this integrator's own refs

    git merge-tree --write-tree 48ed848 d12efac -> tree 125e496b…, exit 0 (read from $? FIRST)
    git diff --name-only 48ed848 <TREE>                        ->   8   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only 48ed848..a9ed33d  (THE MERGE'S DIFF)  ->   8   the only one that means anything
    git diff --name-only 48ed848...d12efac (branch-only)       ->   8
    git diff --name-only c4c15c8..48ed848  (main's advance)    ->  22
    git diff --name-only 48ed848..d12efac  (TWO dots, FORBIDDEN)   ->  30

The prescribed pre-merge set and the merge's own diff are IDENTICAL under
`diff` on sorted lists. `comm -12` over the branch's 8 and main's 22 is
**EMPTY**, the union is byte-identical to the forbidden two-dot set, and
22 + 8 = 30 — checked as SETS and not only as counts. **The forbidden
form overstates by 22 paths, 3.75x, and it is pure left-endpoint drift.**

- **GRAPH REGEN — FIRES on 3, a REAL stale** read off the SECOND line as
  this project's trap requires (both counts and a `~` file diff, not
  `committed: MISSING`). Main was **CURRENT at `48ed848`** before the
  merge, so the stale is attributable to this merge and not inherited.
  **921 608 · 178 files · 1960 symbols · 1881 edges → 923 899 · 178 ·
  1967 · 1881**: **+7 symbols, edges UNMOVED, files `+0 −0 ~3`**.
  Regenerated and committed **with this checkpoint, not the merge**;
  `index --check` **exit 0, CURRENT** afterwards, and asked AGAIN after
  two unrelated cards landed on main mid-checkpoint — still CURRENT,
  which is `.nputerignore` working and was ASKED rather than predicted.
- **NO FIXTURE RECONCILIATION WAS OWED, DERIVED RATHER THAN ASSUMED.**
  The regen moves symbols but not FILES (178, `+0 −0 ~3`) and declares no
  component, so CONVENTIONS' *"a MERGE REGEN alone moves only the two app
  fixtures"* had nothing to move. Checked by running them afterwards.
- **BOOT GATE — FIRES on 3, exit 0.** `NPUTER_BOOT_PORT=15284 npm run
  boot:check` from tools/e2e, both `[nputer]` lines observed: `[nputer]
  project folder: /Users/ujju/Projects/nputer` and `[nputer] window
  "main" created`. Captured process group **2971**, stopped by SIGTERM,
  confirmed gone afterwards — no orphan.
- **DOCS GATE — FIRES on 5 of 8, exit 1**, invoked DIRECTLY from the repo
  root with the merged paths as root-relative `$(…)` arguments, **never
  through `xargs`**, fed the RANGE RULE's own path list. Three suites
  owed — `npm test from app/`, `npm test from tools/e2e/`, `npx vitest
  run from lib/parser/` — all three green. **`cargo test from
  app/src-tauri/` is NOT owed and that is DERIVED**: this diff carries no
  `docs/CONVENTIONS.md`, no `docs/architecture/components` and no
  `docs/research/` capture. It was run anyway and is green. The gate
  reports **12 derived readers across 4 suites**, a census of **130**
  docs-shaped sites in 22 files, and **0 frontmatter issues**.

**Suites, exits read off `$?` UNPIPED, counts DERIVED as well as exits**
(`${PIPESTATUS[0]}` is empty in zsh, so it is never the source):
**cargo 460 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
**SIXTEEN** `test result:` lines, lib suite **4.07s** — the green band,
well under T-124's 9.5s divider. **GREEN FIRST TIME, no re-run, nothing
discarded.** **app `npm run build` exit 0 · `npm test` 958/958 across 46
files, exit 0** — unmoved, which is `agent-store.ts` being a 0-file diff
checked rather than claimed. **parser 264/264 across 12 files, exit 0.**
**E2E 146/146, exit 0**, scratch port **15283**, **ONE run** — nothing to
declare. **typecheck exit 0**, **lint:docs exit 0**, **lint:tokens exit 0
at TOKEN 132 / CONTROL 699**.

**BOTH KNOWN INTERMITTENTS WERE READ BY NAME AND NOT INFERRED FROM A
GREEN EXIT**: `docs_watch::tests::startup_arm_watches_the_initial_root`
is `ok` and `a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
is `ok`. `T-120-s3` did not fire — main is not a fresh checkout — so
there was no second run to declare.
