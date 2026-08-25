---
id: T-102
title: The auth discriminator reads the evidence that CAN be forged and ignores the evidence that cannot — plus the three pins and one bound around it that cannot fail
feature: F-03
milestone: 4
priority: 58
size: M
status: building
blocked_by: [T-113]
touches: [app-agent]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
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
