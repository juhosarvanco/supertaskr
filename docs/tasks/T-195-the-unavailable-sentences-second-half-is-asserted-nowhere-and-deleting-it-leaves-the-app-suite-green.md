---
id: T-195
title: The `unavailable` sentence's post-em-dash half is asserted nowhere — deleting it leaves the whole app suite green, and it is the user-facing half that says WHY
feature: F-04
milestone: 4
priority: 5
size: S
status: done
blocked_by: []
touches: [app-board, app-dispatch]
suggested_by: "architect/integrator seat, allocating an id for a finding MEASURED by T-112-s4's lane, which declined to mint one itself"
builder: claude-opus-5@subagent
review:
---

**MEASURED, NOT SUSPECTED, AND THE LANE THAT FOUND IT REFUSED TO MINT ITS
OWN ID.** `T-112-s4`'s executor verified this before putting it in a
permanent card: deleting the second half of the `unavailable` sentence —
a one-side-only mutation, read back as `1 1` — leaves the app suite at
**49 files / 1,077 tests, exit 0**.

It then declined to allocate a card id, on the reasoning that a lane
writing from an older base is the worst seat to mint from. **That
reasoning is now the project's rule** (see `T-187`'s correction: only the
dispatching seat can be an allocator), so this id was allocated at the
merge and the measurement is carried across verbatim.

## Whose pin this is, and why the card is separate

**It is `T-112-s1`'s pin, not `T-112-s4`'s diff.** That lane registered
the command and shipped the wire mirror; this half of the sentence
arrived with it and nothing was written that could notice it going. The
finding surfaced from inside a different lane's fence, which is why it is
carded rather than fixed in place.

## Why the unasserted half is the half that matters

The `unavailable` arm is what the user sees when the lane scan **cannot
answer**. Its first half names the state; **the post-em-dash half is
where the sentence says WHY** — and a refusal that cannot say why is the
failure family this project has repeatedly refused to ship (`T-171`'s
footer that would not stop claiming a turn; `T-183`'s chord that silently
did nothing).

So the exposure is not cosmetic: **the sentence could lose its reason and
every gate in the repository would stay green.**

## What a fix decides

1. **Whether the pin belongs to the wire or to the presentation.**
   `dispatch-store.ts` is explicitly a mirror that *"classifies
   nothing"*, and `task-detail.ts` is where presentation lives and where
   `app/test/select-task-detail.test.ts` already drives. Putting the
   assertion on the wire side would make this file do something it
   declares it does not do. **Decide it against that declaration rather
   than by convenience.**
2. **Whether the sentence should be asserted whole or by parts.** A body
   asserting the full string pins the reason and also freezes the
   wording; one asserting only that a reason is PRESENT is weaker and
   survives an edit. Say which and why.
3. **Whether the other `LaneScanRefusal` arms have the same hole.** This
   was found as one instance from inside another lane's fence. **Sweep
   the arms** — say what is a member and what is not, with a reason for
   each non-member.

## Acceptance criteria

- THE `unavailable` sentence's reason-bearing half SHALL be pinned by a
  body that reds when it is deleted, and the mutant SHALL be constructed
  and restored with its restoration proven.
- THE pin SHALL sit on the side of the boundary that owns presentation,
  or the card SHALL argue why the mirror is the right home despite its
  own declaration.
- EVERY `LaneScanRefusal` arm SHALL be swept, with membership argued
  either way.
- **A positive control SHALL prove each new body can fail** — this card
  exists because a green suite meant nothing here.
- Verification: headless, the app suite.

## Read beside

`T-112-s1` (whose pin this is), `T-185` (the same boundary dropping two
other facts nothing reads), and `T-190` (why nothing on that side of the
boundary can be reached by a test at all today — which is very likely why
this hole exists).

## Implementation notes (executor, 2026-08-31) — HALF BUILT, HALF ROUTED

**THIS CARD IS DEFECTIVE AS FENCED, AND THAT IS THE HEADLINE.** Its
premise is TRUE and re-measured below. Its criteria 1 and 2 order work
outside its own `touches:` line, which `TASK-FORMAT.md` rules is *"a
DEFECTIVE CARD, not a hard call for the lane"*. So the wire-side half is
built here and the presentation-side half is routed, unbuilt.

**STATUS STAYS `building` DELIBERATELY.** `TASK-FORMAT.md`'s rule for a
card whose halves land under different fences is explicit: `verifying`
claims the WHOLE card is built and awaiting a verifier, which is false
while criteria 1 and 2 are unwritten. The dated line that rule asks for:
**the wire-side half (criterion 3) is built at this lane's tip; the
presentation-side half (criteria 1 and 2) waits on a re-dispatch under
`touches: [app-board]`.**

### The premise, re-derived at MY base `40c9b8b` — TRUE, figures moved

The card quotes **49 files / 1,077 tests** from `T-112-s4`'s measurement
at `df0b550`. At `40c9b8b` the baseline is **50 files / 1116 tests,
exit 0** — `T-198` landed `app/test/dispatch-store.test.ts` in the
interval. **The conclusion survives the drift; only the figures moved.**

The sentence is `app/src/lib/task-detail.ts:411-412`:

    "the assembler has not answered for this card yet — the brief is assembled from files the app reads Rust-side"

Drill in a DETACHED bench at `/private/tmp/nd-T-195` (own node_modules,
cloned from a `npm ci` at this base), everything from the em dash on
deleted, ONE SIDE ONLY:

| step | reading |
|---|---|
| `git diff --numstat` | `1 1`, read back BEFORE the suite |
| app `npm test` | **50 files / 1116 tests, exit 0 — GREEN** |
| app `npm run build` (tsc + vite) | **exit 0 — GREEN** |
| restore | sha256 `7d760c78…cbc0` == the `git show 40c9b8b:` blob |

Restored by HASH, never by an empty `git diff`. The mutation used
`perl -CSD` with `\x{2014}`, never a literal em dash — the byte/decoded
mismatch that silently no-opped `T-112-s4`'s verifier's first attempt.

**WHY THE TWO EXISTING BODIES MISS IT.**
`app/test/select-task-detail.test.ts:700-703` drives this exact arm and
asserts **`panel.kind` alone** — nothing about the sentence.
`app/test/board-truth.test.tsx:979-981` asserts
`toContain("the assembler has not answered for this card yet")` — the
PREFIX, which leaves everything after it free.

### Criteria 1 and 2 — NOT BUILT, ROUTED. The fence cannot reach them.

Ownership read from `paths:` entries with an ANCHORED match, the form
`C-18-board-root.md`'s own C2 correction says prose cannot imitate
(`command grep -ln "^  - <path>$" docs/architecture/components/*.md`):

| file | owner | in this fence? |
|---|---|---|
| `app/src/lib/task-detail.ts` — **the producer** | **C-17** | **NO** |
| `app/test/select-task-detail.test.ts` — the natural pin home | **C-09** | **NO** |
| `app/test/board-truth.test.tsx` — the only existing pin | **C-05** (`app-shell`) | **NO — and deliberately still NO after the widening** |
| `app/src-tauri/src/dispatch/join.rs` | C-15 | yes |

**C-05 IS THE ONE ROW THAT WAS NEVER ASKED FOR.** Its slug is
`app-shell`, not `app-board`, so it is not behind the widened fence and
was not requested: the whole-sentence pin belongs in C-09's
`select-task-detail.test.ts`, and the prefix `toContain` in
`board-truth.test.tsx` can stay exactly as it is. `decide()` returns
`BLOCK outside-the-fence` for it at every tip in this lane, and nothing
in this diff writes it.

This lane holds `touches: [app-dispatch]` -> **C-15 only**.
**Verified against the hook's own `decide()` rather than assumed** — it
returns `block` for all three files above AND for
`docs/architecture/components/C-15-dispatch.md`, and `allow` for
`join.rs`. So the lane can neither write the pin nor declare the
`C-15 -> C-17` edge that would let an in-fence file import the producer
(C-15 declares `depends_on: [C-10]`, and no component declares its own
registry file in `paths:`).

**THE ROUTE IS ONE TOKEN, AND IT IS CHEAP.** `docs/ARCHITECTURE.md`'s
slug map reads `app-board -> C-08, C-09, C-17, C-18`. A single
`touches: [app-board]` reaches the producer (C-17) **and** the natural
pin home (C-09) at once. It does not need C-05: the prefix pin in
`board-truth.test.tsx` can stay where it is, and the whole-sentence pin
belongs in `select-task-detail.test.ts`, which already drives
`selectBriefPanel`. **Re-dispatch this card with `touches: [app-board]`
and criteria 1 and 2 become ordinary work.** Disjointness against the
live lanes is the dispatcher's to certify, not this lane's.

**On criterion 2's question** — the pin belongs on the PRESENTATION side.
`dispatch-store.ts` declares it *"classifies nothing"*, and the sentence
is not authored there or anywhere else on the wire; putting the assertion
on the mirror would make that file assert a fact it does not own.

### Criterion 3 — the sweep. BUILT, and it found more than the card expected

`docs/architecture/components/C-15-dispatch.md:300-302` and
`app/test/dispatch-store.test.ts:184` both say the wording *"is authored
in `lanes.rs`"*. **Both are wrong at `40c9b8b`, measured**:
`app/src-tauri/src/dispatch/lanes.rs` holds no `fn sentence`, no
`&'static str` return and no `-> String`, and **no U+2014 appears outside
comments in `lanes.rs`, `join.rs`, `fixtures.rs` or `mod.rs`** — this
clause originally said *"anywhere in `dispatch/*.rs`"* and that was FALSE;
see "Corrections" at the foot of this card. The Rust-side
sentences live in `join.rs`; the subject sentence is authored wholly in
`task-detail.ts`. Corrected here rather than in those two files, which
this lane may not edit — `dispatch-store.test.ts` IS in fence, but its
line is a pointer in a comment and re-wording it would not be this
card's work.

**ALL FOUR `LaneScanRefusal` ARMS ARE MEMBERS.** They were pinned by one
`contains(...)` fragment each at `join.rs:564-575`. Four drills in the
lane worktree, one side only, each `1 1`, each restored and proved
against oracle sha256 `f83ccbcb…48a9`:

| arm | mutation | `cargo test` at base |
|---|---|---|
| `NotAGitRepository` | reason clause `, so it has no lanes to read` deleted | **exit 0 — SURVIVED** |
| `GitIsAFile` | whole reason half after `worktree` replaced | **exit 0 — SURVIVED** |
| `NoWorktreesDirectory` | **near-miss**: `, probably` APPENDED | **exit 0 — SURVIVED** |
| `WorktreesUnreadable` | subject swapped to `something somewhere` | **exit 0 — SURVIVED** |

**MY OWN PREDICTION WAS WRONG, AND THE NEAR-MISS IS WHAT CAUGHT IT.** I
argued `NoWorktreesDirectory` a NON-member from the source: its pinned
fragment `never registered a worktree` IS its whole reason clause, so no
DELETION can dodge it. Appending `, probably` dodges it anyway, because
`contains` is satisfied by any superstring — and it changes what the user
is told. **A deletion-only sweep would have reported 3 of 4 and been
wrong.** This is the standing warning earning itself: removal-only
mutants cannot distinguish an exact matcher from a containment one.

**THE FIX**, in fence, at `join.rs`:
`every_refusal_sentence_is_pinned_whole_rather_than_by_a_fragment`.
Asserted **whole**, which is criterion 2's question answered for the wire
side: `sentence`'s own doc comment calls this *"THE ONLY SPELLING OF
THESE FOUR SENTENCES, AND IT TRAVELS ON THE WIRE"*, and a pin asserting
merely that a reason is PRESENT would survive exactly the edit that makes
a refusal stop saying why. The expected values sit in a `match` rather
than a table, so a fifth arm cannot compile without being pinned. The
existing `contains` fragments are LEFT IN PLACE — they were written to
catch a SWAP between two arms, which they still do.

### Criterion 4 — the positive control. Each new body PROVEN able to fail

The four mutants re-run against the pinned tree. **Each mutation was
restricted to the PRODUCER's line range**: `sentence()` and the new
body's `expected()` now both carry these strings, so a whole-file
substitution would change both and the body would still pass — a false
"survives". Numstat during a mutant reads `67 1` = the 66-line new body
(measured against base, which lacks it) **plus the one mutated line**;
the mutation itself is `1 1`.

| mutant | `cargo test` | failing bodies |
|---|---|---|
| `NotAGitRepository` | exit 101 | **1** — the new body |
| `GitIsAFile` | exit 101 | **1** — the new body |
| `NoWorktreesDirectory` | exit 101 | **1** — the new body |
| `WorktreesUnreadable` | exit 101 | **1** — the new body |

Every restore proved against the pinned-tree oracle `6b877876…9fcf`.
**Count of exactly ONE on all four is POISON DRILL shape SIX satisfied**:
no existing body kills any of them, so the new body is not a restatement
of one already present.

### Gates at HALF 1's tip `e27be71` — A READING AT ONE COMMIT, NOT CURRENT

**SUPERSEDED: read the half-2 gate block for the lane's answer.** This
block was true at `e27be71` and one row of it is no longer the lane's
state, which is why it now carries the ref in its heading rather than
*"this lane's tip"*.

app `npm run build` **0** · app `npm test` **50 files / 1116 tests, 0** ·
`cargo test` **0** (261 in the dispatch crate, **260 at base** — this
diff is +1 body) · `arch cycles` **0** · `arch drift` **0** REPORT,
`findings=4` unchanged from base · `lint:docs` **0**.

**THE `docs-gate` ROW WAS THE STALE ONE.** At `e27be71` it read **0**,
*"1 changed path(s) given, none under docs/ — this gate is not owed"* —
a reading taken when the lane's diff was `join.rs` alone. **At the lane's
tip it FIRES: exit 1, naming three owed suites**, because the card itself
is under `docs/`. All three run green; the figures are in the half-2
block. A gate decision recorded at one commit reads as the lane's answer
unless its heading says otherwise, which is the executor role file's
warning about gate derivations earning itself here.

**`index --check` exits 1 STALE, by construction and not a lane
failure.** It names its own cause: `~ app/src-tauri/src/dispatch/join.rs
(content, loc 907 -> 973)`, with byte, file, symbol and edge counts
**identical** on both sides. A lane does not regenerate the graph
(T-009-s1), so the regen is committed with the CHECKPOINT. It is NOT the
false red CONVENTIONS warns about — that one prints
`committed: MISSING`, and this one prints a populated committed line.

### For the verifier

The contract to attack is the **fence claim**, because everything routed
rests on it: re-derive the four ownership rows from `paths:` yourself and
put the four files through `decide()` rather than taking the table above.
Second, the sweep's completeness — I claim 4 of 4 arms are members and I
reached 3 of 4 by reading the source; the fourth needed a near-miss, so
a deletion-only re-run will disagree with me and be wrong. Third, whether
asserting the four sentences WHOLE is right or merely strict.

## FENCE WIDENED 2026-09-01, mid-flight, by the dispatching seat

`touches:` was `[app-dispatch]` — **C-15 only** — and criteria 1 and 2
cannot be built inside it. Ownership, re-derived at the integrator seat
from anchored `paths:` and confirmed against the ARMED hook's own
`decide()`:

    producer   app/src/lib/task-detail.ts        C-17
    pin home   app/test/select-task-detail.test.ts  C-09
    prior pin  app/test/board-truth.test.tsx     C-05

`docs/ARCHITECTURE.md:57` — `app-board -> C-08, C-09, C-17, C-18` — so
**one token reaches the producer AND the pin home.** Widened to
`[app-board, app-dispatch]`, 20 expanded paths, verified disjoint from
all three concurrently live lanes.

**THE LANE DID NOT WIDEN ITS OWN FENCE, AND WAS RIGHT NOT TO.** It found
the wall, measured the ownership, named the one-token route and stopped —
`lane-protocol.md` rule 5, *a fence is not widened from inside the lane
it fences.* This amendment is the dispatching seat's, committed on `main`
BEFORE the re-expansion, which is the only shape that keeps `main` the
ref the fence is read from.

The grant is the MANIFEST ON DISK, not this paragraph: the executor
proceeds only on reading the new `paths` back out of
`.nputer/lane-fence.json`.

### AND THE MANIFEST WAS NOT THE WHOLE GRANT — the lane proved it

The paragraph above is wrong on its last sentence, and the lane that read
it caught the error the same hour.

**The armed hook reads the card's `touches:` line FROM THE LANE WORKTREE**
and compares it to the manifest's stamp. The amendment landed on `main`;
the lane's copy still said `[app-dispatch]`. The two disagreed, so
`decide()` returned `block · stale-stamp` for **every** path in the
lane — including the three that had been in fence since dispatch, and
including `docs/tasks`, which is `alwaysWritable`.

**The manifest read-back looked PERFECT throughout**: 20 paths, the right
ref, the right `touchesLine`. Only asking `decide()` rather than reading
the JSON found it.

**And the one-line workaround is the thing rule 5 forbids.** Editing the
card's `touches:` inside the lane makes the two strings match and the
block disappears — a repair that looks like it worked while being exactly
*widening the fence from inside the lane it fences*. The lane refused it
and stopped. The hook forbids it by name in its own refusal text.

**So mid-flight widening is TWO integration acts, not one**: amend the
card on `main`, AND carry that amendment onto the lane branch. Re-running
`--write-fence` alone cannot help — the lane's copy of the card is the
half that must move. `T-211` should carry this; the version of fast path
A written before today says "amend on main plus `--write-fence`" and
would strand every lane that used it.

## Implementation notes, HALF 2 (executor, 2026-09-01) — the card is now WHOLE

The fence was widened mid-flight to `touches: [app-board, app-dispatch]`
and the amendment reached this branch at `cb45e3d`. Criteria 1 and 2 are
built here. **Half 1's notes above stand unchanged** — nothing in them was
retracted.

**THE WIDENING TOOK TWO INTEGRATION ACTS, NOT ONE, AND THE FIRST ATTEMPT
STRANDED THIS LANE.** Recorded because the next lane will meet it: the
card was amended on `main` and the manifest re-stamped, which looked
complete — the read-back showed 20 paths, the right ref and the right
`touchesLine`. But the hook reads the card's `touches:` line **from the
lane worktree**, and the lane branch did not carry the amendment. The
result was `code: stale-stamp` blocking **every** path, including the
three in fence since dispatch and `docs/tasks`, which is `alwaysWritable`.
**The JSON read-back looked perfect throughout; only asking `decide()`
found it.** Routed as `T-211`. The repair that would have made the block
vanish — editing this card's own `touches:` inside the lane so the two
strings match — is the widening rule 5 forbids, in the form that looks
like it worked; it was refused, not performed.

### Criterion 1 — BUILT. The pin is on the presentation side.

`app/test/select-task-detail.test.ts` (C-09's), two new bodies:

- `the \`unavailable\` sentence is pinned WHOLE — the reason-bearing half included`
- `every typed refusal reaches the reader as its WHOLE sentence, reason and all`

### Criterion 2 — ANSWERED BOTH WAYS IT ASKS

**Which side owns it: PRESENTATION.** The sentence is not authored on the
wire at all — it is composed in `selectBriefPanel`. `dispatch-store.ts`
declares itself a mirror that *"classifies nothing"*, so asserting it
there would make that module answer for a string it never sees.

**Whole, not by parts.** A body asserting only that a reason is PRESENT
survives exactly the edit that makes a refusal stop saying why. The
measurement below is the argument: a `toContain` prefix pin cannot tell
the sentence from the sentence plus anything.

### The sweep of the presentation sentences — members, with reasons

| sentence site | pin before this lane | member? |
|---|---|---|
| `dispositions.sentence` (undecidable frontier) | head + the value the TEST supplied; the producer's own trailing clause pinned by nothing | **YES — NOW PINNED** (this row first read "NO"; it was wrong, see Corrections) |
| `…has not answered for this card yet — …` (**the subject**) | `panel.kind` only, plus a PREFIX `toContain` in another component's file | **YES** |
| `this card carries no id, … — a suggestion is triaged …` | `toContain("carries no id")` — four words | **YES** |
| `the dispatch frontier returned no answer for {id}` | nothing | **member, NOT PINNED** — see below |
| `contractMissing` | `toContain` on the interpolated source only | **YES** |
| `contractUnreadable` | `toContain("the row set is unknown")` — pre-em-dash | **YES** |
| `noSuchCard` | **nothing at all** — the string was in no test file | **YES** |
| `unassemblable` | `toContain` on the row list only | **YES** |

**THE ONE I DID NOT PIN — AND IT IS UNREACHABLE, NOT MERELY UNREACHED.**
`the dispatch frontier returned no answer for {id}` is the
`card === undefined` arm at `task-detail.ts:392`. The first draft of this
paragraph said only *"I could not build a fixture"*; the stronger claim
was available and is the one the evidence supports.

**No fixture CAN exist.** `selectDispositions`' loop over `model.tasks`
(`board-model.ts:1269`) has exactly one `continue` that skips a
`cards.set` for the task itself — `if (id === undefined) continue` at
:1271 — and every other branch ends in a `cards.set(id, …)`.
`task-detail.ts:385` has already RETURNED on that same condition, and
`findTask` draws from the same `model.tasks`. So every id reaching
`cards.get(id)` is an id `cards` has an entry for.

Confirmed empirically as well as structurally: replacing the branch's
first statement with a `throw` (`1 1`, restored by sha256 against
`7d760c78…cbc0`) leaves the app suite at **1119 passed, exit 0** — no
fixture in the suite reaches it. *The first attempt at that mutant
NO-OPPED — a multi-line `\Q…\E` pattern that matched nothing — and
reported a green suite on an unmutated tree. Caught by reading `numstat`
before the suite, the same way twice before in this lane.*

**It is therefore dead code, and deleting it is a separate card's
decision, not this lane's.** Pinning it is impossible by construction, so
it is named here rather than papered over with a body that asserts
nothing.

### Criterion 4 — the positive control. SEVEN mutants, all one side only.

Against the PRODUCER `app/src/lib/task-detail.ts`, each read back on
`git diff --numstat` before its suite and each restored and proved by
sha256 against `7d760c78…cbc0`:

| # | mutant | numstat | app suite | failing bodies |
|---|---|---|---|---|
| P1 | subject sentence — **near-miss**, `, probably` APPENDED | `1 1` | exit 1 | **1** |
| P2 | subject sentence — post-em-dash half DELETED (**the card's own mutant**) | `1 1` | exit 1 | **1** |
| P3 | id-less sentence's reason half — near-miss | `1 1` | exit 1 | **1** |
| P4 | `contractUnreadable`'s post-em-dash half replaced | `1 1` | exit 1 | **1** |
| P5 | `noSuchCard` reworded | `1 1` | exit 1 | **1** |
| P6 | the `; ` joining unassemblable rows -> `, ` | `1 1` | exit 1 | **1** |
| P7 | the `path === "" ? source : path` fallback flattened | `1 1` | exit 1 | **1** |

**Count of exactly ONE on all seven** — POISON DRILL shape SIX satisfied,
and no body here is a restatement of another.

**P1 AND P2 ARE THE PAIR WORTH READING.** Both leave
`board-truth.test.tsx`'s prefix `toContain` GREEN — its failing-body count
is zero in both — so the only pin that existed before this lane was blind
to the deletion the card was filed on *and* to the near-miss. P6 and P7
are why the second body is not a restatement of the first: they pin
branches nothing in the repository reached.

**THE EM-DASH HAZARD BIT AGAIN, IN A NEW FORM, AND THE READ-BACK CAUGHT
IT.** P2 first no-opped: my drill harness wraps each pattern in
`\Q…\E`, which makes `\x{2014}` match the literal characters `\x{2014}`
rather than an em dash. `numstat` came back EMPTY and the suite came back
GREEN — a false "survives" that would have contradicted half 1's own
measurement. Re-run with the escape OUTSIDE the quote block (`\E \x{2014}
\Q`), it reds. **Reading the numstat before trusting the suite is the
only reason this was not reported as a surviving mutant.**

### The false claim, fixed where reachable and routed where not

Two files asserted the wording is *"authored in `lanes.rs`"*. Measured at
`40c9b8b`: `lanes.rs` holds no `fn sentence`, no `&'static str` return and
no `-> String`, and **no em dash outside comments in `lanes.rs`,
`join.rs`, `fixtures.rs` or `mod.rs` — 0 lines in each.**

- **FIXED** — `app/test/dispatch-store.test.ts:184`, in fence.
- **ROUTED** — `docs/architecture/components/C-15-dispatch.md:300`.
  Confirmed `BLOCK outside-the-fence` by `decide()` at this tip; no
  component declares its own registry file in `paths:`, so no lane fence
  reaches it. **It still says `lanes.rs` and still needs correcting.**

### Gates at this lane's tip

app `npm test` **50 files / 1118 tests, exit 0** (1116 at `cb45e3d`; +2
new bodies). Producer `task-detail.ts` is UNTOUCHED by this diff —
verified `git diff --numstat` empty for it. Remaining gate figures are in
the report and re-derived at the final tip.

## Corrections performed (executor, 2026-09-01, after the REJECTION)

All three assigned corrections are landed, each re-measured here rather
than accepted on the verdict's word.

### C1 — THE SWEEP'S ONE "NON-MEMBER" ROW WAS WRONG, and it was this card's own defect one component over

`selectDispositions`' undecidable sentence (`board-model.ts:1178-1186`)
composes from **THREE** parts, not two: a head, the lane reader's carried
sentence, and **a trailing reason clause of the producer's own**. Both
existing pins assert the head plus the value the test itself supplied —
`select-task-detail.test.ts:662` and `select-board.test.ts:1639` — and
`select-board.test.ts:1676` mentions the tail only in a COMMENT, on a
different body. So the part no test author wrote down was the part
nothing pinned.

Reproduced independently at `1f4f7c7`, one side only against the
producer, each `1 1`, each restored and proved by sha256 against
`14f9dacd…fbbd`:

| mutant | app suite | failing bodies |
|---|---|---|
| tail: `are not the same fact` -> `are DIFFERENT facts` | **exit 0 — 1118 passed** | **0** |
| tail: `is the failure direction this frontier exists to close` -> `is fine` | **exit 0 — 1118 passed** | **0** |
| head reworded (**the CONTROL**) | exit 1 | 2 |

**Both halves of the tail edit freely with the whole app suite green.**
That is precisely the exposure this card exists for, in the row its own
sweep scored a non-member. The scoring was wrong; the verifier caught it.

**FIXED** in `app/test/select-board.test.ts` (in fence, `decide()` =
`inside-the-fence`): `the undecidable sentence is pinned WHOLE — head,
carried reason AND the trailing clause`. Asserted whole, which also pins
the two JOINS nothing reached — the `": "` after the head and the single
leading space before the tail; a `toContain` pair cannot see either,
because a concatenation with a missing separator still contains both
operands.

**Positive control, at the pinned tree:** the two tail mutants now red at
**exit 1 with a failing-body count of exactly ONE**, the new body. The
head mutant reds with **3** — the two pre-existing bodies plus this one —
named rather than left as a bare number, per shape SIX.

### C2 — THE EM-DASH SENTENCE WAS FALSE AT THE REF IT NAMED

I wrote *"no em dash appears outside comments anywhere in
`app/src-tauri/src/dispatch/*.rs`"*. Re-measured at `40c9b8b`, per file,
non-comment lines containing U+2014:

    brief.rs 9 · fixtures.rs 0 · join.rs 0 · lanes.rs 0 · mod.rs 0

`brief.rs:1517` is `let end = tail.find(" — ")` — code that SEARCHES for
an em dash. **The overreach is mine and it was visible in my own first
grep of half 1**, which listed those `brief.rs` lines before I
generalised past them.

**The conclusion it supports is unaffected and stays**: `lanes.rs` holds
no sentence at all, so *"authored in `lanes.rs`"* is false and `join.rs`
is where the enum lives. Only the supporting clause was wrong, and the
narrower claim — 0 lines in `lanes.rs`, `join.rs`, `fixtures.rs`,
`mod.rs` — is both true and sufficient.

Corrected in all three places: this card's half-1 notes, its half-2
notes, and permanently in `app/test/dispatch-store.test.ts`, which is the
only one of the three a future reader meets without the card.

### C3 — A GATE READING AT ONE COMMIT WAS SITTING UNDER A CURRENT-TENSE HEADING

Half 1's block was headed *"Gates at this lane's tip"* and recorded
`docs-gate` **0**, *"none under docs/ — this gate is not owed"*. True at
`e27be71`, where the diff was `join.rs` alone. **At the lane's tip the
same gate FIRES: exit 1, naming three owed suites**, because the card
itself is under `docs/`. There is no red behind it — all three run green
— but *"not owed"* is a DECISION, and a decision recorded at a stale ref
reads as the lane's answer.

Re-labelled `### Gates at HALF 1's tip e27be71 — A READING AT ONE COMMIT,
NOT CURRENT`, marked superseded, and the stale row replaced with what the
gate actually answers at the tip. This is `roles/executor.md`'s own
warning about gate derivations — *"naming your ref does not make it
honest"* — earning itself on this card.

### Also corrected, unassigned

- **The unreachability claim was UNDERSTATED.** It said *"I could not
  build a fixture"*; the evidence supports *"no fixture can exist"*, and
  it now says so with the structural argument and a `throw` mutant.
- **The C-05 row** now carries its slug (`app-shell`) and a sentence
  saying it is deliberately outside the widened fence and was never
  wanted. Done here rather than left for the merge, since this card was
  open anyway — **no merge-time edit is owed for it.**

### Two corrections the verdict makes to the DISPATCH, recorded so they are not lost

- **This lane's base is `40c9b8b`**, derived by `git merge-base main
  HEAD`. The brief named `dcd1c3e`, which is `main`'s state at dispatch
  and a different thing. Every figure on this card is bound to
  `40c9b8b`, `e27be71`, `cb45e3d` or `1f4f7c7` as labelled, so nothing
  here inherits the conflation.
- The fence amendment reached this lane as `cb45e3d`, carrying main's
  section byte-verbatim.
