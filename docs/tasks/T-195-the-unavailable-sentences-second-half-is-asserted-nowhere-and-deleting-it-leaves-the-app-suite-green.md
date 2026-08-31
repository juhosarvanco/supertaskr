---
id: T-195
title: The `unavailable` sentence's post-em-dash half is asserted nowhere — deleting it leaves the whole app suite green, and it is the user-facing half that says WHY
feature: F-04
milestone: 4
priority: 5
size: S
status: building
blocked_by: []
touches: [app-dispatch]
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
| `app/test/board-truth.test.tsx` — the only existing pin | **C-05** | **NO** |
| `app/src-tauri/src/dispatch/join.rs` | C-15 | yes |

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
comments anywhere in `app/src-tauri/src/dispatch/*.rs`**. The Rust-side
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

### Gates at this lane's tip

app `npm run build` **0** · app `npm test` **50 files / 1116 tests, 0** ·
`cargo test` **0** (261 in the dispatch crate, **260 at base** — this
diff is +1 body) · `arch cycles` **0** · `arch drift` **0** REPORT,
`findings=4` unchanged from base · `docs-gate` **0**, *"1 changed
path(s) given, none under docs/ — this gate is not owed"* · `lint:docs`
**0**.

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
