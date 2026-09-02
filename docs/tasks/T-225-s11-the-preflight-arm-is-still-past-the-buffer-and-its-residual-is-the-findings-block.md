---
id: T-225-s11
title: With rule four cited, `--task <id> --preflight` is still 5,129 bytes past the buffer, and the residual is the preflight's OWN findings block rather than the row set
feature: F-06
milestone: 4
size: S
priority: 3
status: verifying
suggested_by: executor claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/scripts/card-preflight.mjs, tools/e2e/tests/card-preflight.spec.ts, lib/parser/src/lanes.ts, lib/parser/test/lanes.test.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by: claude-opus-5@subagent
review: independent
---

**T-225-s2 TOOK 12,356 BYTES OFF THIS ARM AND IT IS STILL OVER.**
Measured back to back at one held board, the base `09526da` read in a
detached drill and the diff read in the lane immediately after:

    --task T-133 --preflight    83,021 -> 70,665 bytes   (-12,356)

against a 65,536-byte pipe buffer, so the arm went from 17,485 PAST to
**5,129 PAST**. The margin guard in `tools/e2e/tests/brief-flush.spec.ts`
now announces it on every run — T-225-s2 added the arm to `LIVE_ARMS` —
so the approach is no longer silent.

**THE RESIDUAL IS NOT THE ROW SET.** `--task <id>` alone is 41,281 bytes
at the same board, so the preflight's own half is about 29,000: the
claim-by-claim re-derivation and its findings, plus the checkout sweep,
which prints one line per checkout on the machine and therefore grows
with the number of live lanes rather than with the card.

**WHY IT WAS NOT BUILT IN THE LANE.** `tools/e2e/scripts/card-preflight.mjs`
is outside T-225-s2's fence and was held by the live lane T-230-s7 at
dispatch, so the two fences are disjoint by construction and this one
could not be widened from inside.

**WHAT A FIX WOULD DECIDE.** Whether the preflight's per-claim output is
summarised to the claims that FAILED with a count of those that held —
which is what a dispatcher acts on — or whether the sweep's per-checkout
lines collapse to the stale ones plus a count. Both are the same
question T-225 answered for `--dispatch` with the dispatchable-now
filter: print what the reader will act on, and say how much was not
printed.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s2 merge (6691fc5)

The architect seat. The preflight residues share one file: the size past the buffer, the no-spec-file refusal (T-228-s1) and the quote arm pin (T-230-s8) ride together.

## Absorbs: T-228-s1 (2026-09-02, at the T-225-s2 merge (6691fc5))

A card whose criteria say a body SHALL prove it was startable with a fence holding no test file, and only a verifier's ground measurement said it could not be built as fenced

## The finding

T-228 was stamped and armed with `touches: [.claude]`. No test file lives
under `.claude`; every body that can drive the hook sits in two spec files
under tools/e2e/tests. Preflight, the arm and the brief all passed the
card. The executor routed the card's own ORDER body OUT as a suggestion
because the fence refused it, and the blind verifier's phase-1 ground
named the contradiction twenty minutes later. The seat widened by fast
path A (ae7e8a9). Room loop-efficiency, item 24.

## What is asked

`card-preflight` reads the fence and the card already. When a criterion
line carries a body-demanding phrase (`a body SHALL`, `a test SHALL`,
`SHALL red`, `positive control`) and the resolved fence contains no
`*.spec.ts`, `*.test.*` or `tests/` path, the preflight SHALL refuse
with a line naming the criterion and the fence, and the dispatch view
SHALL list the card as unfenceable with that clause. A card whose
criteria are documentary (a reader over prose) is not affected.

## Acceptance

- A planted card with `touches: [.claude]` and a `SHALL prove it`
  criterion is refused at preflight and reaches `unfenceable` in the
  dispatch view; the same card with a spec file added to the fence is
  startable.
- A planted card with a documentary criterion and no spec file stays
  startable (the negative control).
- Positive controls demonstrated failing; the live board's starta

## Absorbs: T-230-s8 (2026-09-02, at the T-225-s2 merge (6691fc5))

markerEnd's typographic-quote term is inert under every census arrangement, so no body pins it — one assertion on markerEnd's own return would

## The finding

V-T-230-s7's drill MV2 dropped the typographic term from `markerEnd` and
every body stayed green (48 of 48). The verifier showed the term is inert
rather than unpinned: all eight census arrangements read identically with
and without it, because a shortened segment can only leak a CLOSING
typographic quote and `QUOTED_RUN` cannot open a run with one. Only
`markerEnd`'s own return value moves. The lane disclosed the same shape as
its M6.

## What is asked

One body drives `markerEnd` directly on a marker whose payload closes
with a typographic quote on a continuation line and asserts the returned
index, so that dropping the term reds by name. The census arrangements
need no change. Kill set: that body and no other.

## Acceptance

- A mutant dropping the typographic term reds exactly one body.
- The eight census arrangements V-T-230-s7 recorded still read identically.

## RECOVERY of absorbed texts (the seat's note, 2026-09-02)

The Absorbs sections above were written by a script that cut each absorbed body at 1,400 characters, so their acceptance criteria may end mid-sentence. The whole text of each absorbed card is in history:

- T-228-s1: `git show 866ac33^:docs/tasks/T-228-s1-preflight-refuses-a-fence-with-no-spec-file-when-a-criterion-demands-a-body.md`
- T-230-s8: `git show 866ac33^:docs/tasks/T-230-s8-pin-the-typographic-term-of-marker-end.md`

A lane building this card reads those before it builds.

## Implementation notes

**BOTH ABSORBED CARDS WERE READ IN FULL FROM HISTORY.** The absorb script
cut each absorbed body at 1,400 characters, so the copies above stop
mid-sentence. The full texts were read at
`git show 866ac33^:docs/tasks/T-228-s1-preflight-refuses-a-fence-with-no-spec-file-when-a-criterion-demands-a-body.md`
and
`git show 866ac33^:docs/tasks/T-230-s8-pin-the-typographic-term-of-marker-end.md`.
The only text the cut lost is T-228-s1's third acceptance bullet — *the
live board's startable set is derived at base and tip and every card that
moves is named* — which is measured below.

**AND T-228-s1 WAS ITSELF FENCED WHERE ITS OWN VIEW CLAUSE COULD NOT BE
BUILT.** Its frontmatter read `touches: [tools/e2e/scripts/card-preflight.mjs,
tools/e2e/tests/card-preflight.spec.ts]` while its second clause asks the
DISPATCH VIEW to rule the card `unfenceable` — a state set in
`lib/parser/src/lanes.ts`, outside those two files. The card that filed
*"a criterion demanding what the fence cannot hold"* is an instance of its
own defect. This lane hit the wall the card describes and the fence was
widened at the seat's fast path (`a3794c9`) to the two parser paths, which
is why the clause is built here rather than routed.

### The size (measured BACK TO BACK at one held board)

17 checkouts on this machine, 5 of them lanes, the same list before and
after both runs and the same 17 sweep lines in both answers:

    --task T-133 --preflight   74,633 -> 62,836 bytes   (-11,797)

against the 65,536-byte pipe buffer: **9,097 OVER becomes 2,700 UNDER**.
The tip figure was re-measured after the restore and read 62,836 again.
This arm's own half fell from 25,155 bytes to 15,716; the remaining
47,431 are the ROW SET and the MACHINE-WIDE CHECKOUT SWEEP, which live in
`brief.mjs` and `dispatch-brief.mjs` — T-239's lane, outside this fence.
**THE SWEEP MOVES WITH THE CHECKOUT COUNT AND NOT WITH THE CARD**: it
prints one line per checkout on the machine, so this figure is a reading
of a machine as well as of a tree. Routed as `T-225-s19` (`T-225-s13` is taken — it is the arm-list derivation card).

Over twelve cards measured at both refs at the same held board, every one
is under the buffer at the tip and eleven have BYTE-IDENTICAL finding
sets. The twelfth is `T-078`, whose difference is exactly one ADDED
finding — the new refusal below.

### The refusal (T-228-s1)

The reading lives ONCE, in `lib/parser/src/lanes.ts`, because two
consumers need it: `readDispatchOrder` rules such a card `unfenceable`
with the criterion and the fence in its reason, and the dispatch view
renders that reason unchanged (`dispatch-order.mjs` needed no edit).
`card-preflight.mjs` consumes it off the ruling as `unbodied` /
`bodyBearer` and refuses. Measured over the live board at `2008186`: **3
of the 366 cards the schedule draws, 0 of the cards it rules startable.**
Of the three, `T-189` is a genuine second instance — its own notes say
*"AC 4's 'a body SHALL prove it' was NOT built"* over a `method/` +
`docs/CONVENTIONS.md` fence — and `T-078` and `T-236` are cards WRITING a
rule about bodies into a governing document. No lexical test separated
those from a card owing one; the residual is disclosed in the module, in
the class table's own `cannot` clause, and discharges in one dated
`PREFLIGHT RULING` naming the criterion.

**THE SUITE VOCABULARY IS THE TREE'S, NOT THE CARD'S THREE SHAPES.**
Reading only `*.spec.ts`, `*.test.*` and `tests/` refuses four cards whose
fences hold real bodies: `T-205`, `T-205-s4` and `T-229-s6` reserve
`tools/method-evals`, whose `evals/` files ARE that gate's bodies, and
`T-229` reserves a Rust source. The term is also DISARMED where no
`knownPaths` oracle was handed in, because without one the parser cannot
see that a directory fence already holds a spec file.

### The live board's startable set, at base and tip

Derived back to back at one held board — 13 checkouts, 3 of them lanes,
the same count before and after — with `lib/parser` rebuilt on each side,
because the ruling lives in the parser's dist and a stale build would
have measured the wrong tree:

    startable at 2008186:  24 cards
    startable at the tip:  24 cards, the SAME 24, in the same order
    unfenceable:            0 at both refs

**NO CARD MOVES.** The refusal fires on 3 cards and every one of them is
`underway`, so the set a dispatcher can start is untouched. The sets were
compared with `diff` and are byte-identical; both sides were restored and
proved by sha256 afterwards.

### The class and the sweep

CLASS: a card whose acceptance criteria demand work its own fence cannot
hold. SWEEP: the reading above, run over all 366 cards the schedule
draws — 3 hits, named. It was shown able to answer otherwise before its
number was written down: the same sweep with the head-noun narrowing
removed returns 10.

## VERDICT — APPROVED, 2026-09-02, claude-opus-5@subagent (V-T-225-s11)

Judged at `eb78a37` against base `2008186` in the detached bench
`/Users/ujju/Projects/nputer-V-T-225-s11`, with `lib/parser` rebuilt on
each side of every comparison — the ruling lives in the parser's `dist/`
and a stale build measures the wrong tree. All three deliverables are
met and every figure below was re-derived by this seat; none is the
executor's.

attack set: sha256:77b9df751279c9bc4a12632664771dacb7795932c6d1ba49aca3c2f85b4d81a8 (attack-V-T-225-s11.md)
ground truth: sha256:91da0e41b3d8ecc1393b85217fb52e34d54251c1619f887d667f68484aed7ca1 (ground-V-T-225-s11.md)
sealed 2026-09-02T15:55:11Z, before the tip existed at this seat.

**THE FRAME I ACTUALLY HAD, SAID OUT LOUD.** Not two spawns — one spawn
carrying a phase-1/phase-2 marker. Phase 1's brief named no
executor-derived specific (no mutant count, no path count, no suite
figure), and the attack set, the ground truth and the stamp file were
written and sealed before any word of the lane reached this seat; but a
discipline kept is not a construction guaranteed, and a later reader
cannot tell them apart. `method/roles/verifier.md` step 0 asks for that
sentence, so it is here rather than implied.

**THE FENCE.** Widened on main at `a3794c9` by the dispatching seat, at
the executor's request, by exact path, to the four paths the frontmatter
now carries. `git diff 2008186..eb78a37 --stat` moves exactly those four
files plus this card and the routed suggestion card; nothing under
`tools/e2e/scripts/brief.mjs`, `dispatch-order.mjs` or
`brief-flush.spec.ts` was touched. Phase 1's ground pre-committed that
T-228-s1's dispatch-view clause could not be built inside the ORIGINAL
two-path fence — `unfenceable` is set in `lib/parser/src/lanes.ts` and
rendered by `dispatch-order.mjs`, and `dispatch-order.mjs` does not
import `card-preflight.mjs`. That reading was right and the widening is
the answer to it; the widening is the seat's, on the executor's request.

### The size — measured back to back at ONE held board

Both refs at **9 checkouts** on this machine, 2026-09-02T17:48:54Z to
17:49:44Z, the count identical before and after each side:

    --task T-133 --preflight    64,504 -> 53,794 bytes   (-10,710)
    the arm's own half          31,060 -> 20,293 bytes   (-10,767)
    --task T-133 (the row set)  33,444 -> 33,501 bytes   (outside this fence)

Against the 65,536-byte pipe buffer the arm ends **11,742 UNDER**. **The
headline is board-dependent and this seat says so rather than repeating
a number**: at phase 1's board of **18 checkouts** the same base arm read
**74,256** bytes — 8,720 PAST — because the machine-wide sweep and arm
eight each print a line per checkout. The card's title still carries
`5,129 past` from a third board. What is stable is the DELTA, and the
delta is the deliverable.

**NOTHING WAS LOST, AND `--full` PROVES IT.** On `T-133` the unmarked
census lists 56 rows at the base, **12** at the tip behind **2** elision
lines, and **56** again under `--task T-133 --preflight --full`
(67,941 bytes). Each elision line names how many rows of how many were
not printed, the budget, and the flag — the card's own ruling, *print
what the reader will act on and say how much was not printed*, delivered
literally.

**AND NO FINDING WAS DROPPED, MEASURED WHERE A FINDING EXISTS.** Phase
1's ground named `T-133` a DEGENERATE control for this — its preflight
raises zero findings, so "nothing was lost" cannot be decided there.
Five cards were measured at both refs. The finding sets are identical
except for the ref inside the environment's own STALE-checkout finding,
plus exactly the three NEW `NO BODY CAN BE WRITTEN` findings on `T-078`,
`T-189` and `T-236`. `T-105`'s CENSUS finding is byte-identical at both
refs, checked with `diff`.

### The refusal (T-228-s1) — both readable bullets met, and the third recovered

The absorbed text on this card is cut mid-word at *"the live board's
starta"*; phase 1's ground recorded that truncation before the lane's
own RECOVERY section was read. The lane recovered the full card from
`866ac33^` and the lost bullet is the startable-set one, which this seat
measured independently below.

**BULLET ONE, ON PLANTED CARDS OF THIS SEAT'S OWN.** Three cards planted
into `docs/tasks` and staged (the board reads tracked files), then
removed and the tree proved clean:

- `T-951`, `touches: [.claude]`, criterion *"A body SHALL prove the hook
  refuses a stale guard surface."* — **refused at preflight**, the line
  naming the criterion, its own card line **22**, and the fence
  `.claude`; and the dispatch view rules it **`unfenceable`**
  (`1 unfenceable`) with the clause naming criterion and fence.
- the same card with `tools/e2e/tests/landing-gate.spec.ts` added to the
  fence — **startable**, `0 unfenceable`, no refusal.

**BULLET TWO.** `T-952`, same `.claude` fence, documentary criteria —
**startable**, no refusal. `T-953`, a body-demanding criterion over
`tools/e2e/tests/planted-does-not-exist-yet.spec.ts` — **startable**,
which is the second direction: a card fencing the body it is about to
create is not refused for the file not existing yet.

**THE CONTROL WAS DEMONSTRATED FAILING, WHICH IS WHAT MAKES IT A
CONTROL** (`method/roles/verifier.md` 2b). The same three planted cards
were run at **base `2008186`**, parser rebuilt: `T-951` raises **no**
refusal, and the board rules **0 unfenceable, 69 startable** with all
three planted cards startable. The arrangement that decides the answer
is absent at the base and present at the tip.

**BULLET THREE — the live board, derived at both refs at one board.** At
9 checkouts: base `66 startable, 51 fenced, 0 unfenceable, 1 waiting,
3 blocked`; tip `64 startable, 53 fenced, 0 unfenceable, 1 waiting,
3 blocked`. **The refusal moves no card**: `unfenceable` is 0 at both,
and the three cards it fires on are all off the dispatchable board. The
two cards that DO move — `T-143-s6` and `T-219-s6`, startable → **fenced**
— move for the FENCE WIDENING and the dispatch view says so in its own
words: *"T-225-s11 holds lib/parser/src/lanes.ts,
lib/parser/test/lanes.test.ts"*. Both `touches: lib-parser`. That is
lane-protocol rule five working, not a refusal firing, and it is named
here because a reader comparing this card's own `24 = 24` at a
three-lane board would otherwise meet a different pair of numbers and
not know why.

### The markerEnd pin (T-230-s8)

`markerEnd` was mutated three ways, one at a time, each landing read back
from `git diff` and each restore proved by
`sha256:f90188cc0003ba26041fa9a4c12b7f44279b8a841dd3e097c818a2456038805e`:

- **MC1**, the typographic term dropped whole (`straight % 2 === 0 &&
  opened === closed` → `straight % 2 === 0`): **KILLED, 1 of 51.**
- **MC2**, the `opened` counter alone deleted: **KILLED, 1 of 51.**
- **MC3**, the `closed` counter alone deleted: **KILLED, 1 of 51.**

All three die on the same single body, *"markerEnd's TYPOGRAPHIC pair
spans the wrap, and its own return is the only thing that moves"*, and
the other 50 pass under every one of them — so the eight census
arrangements V-T-230-s7 recorded read identically, and the kill set is
that body and no other. Phase 1 pre-committed the three EQUIVALENT
shapes a careless body would have used (typographic quoting that closes
on the marker's own line, that never closes, or a marker line whose
straight quotes are also odd); the shipped assertion is none of them.

### The drill, aimed by this seat

Thirteen code mutants, one at a time, each landing read from `git diff`
and each restored by sha256 — `card-preflight.mjs` to `f90188cc…805e`,
`lanes.ts` to `98ca6843…37e2`. One mutant is recorded as a SURVIVOR and
one as a NON-LANDING caught by the harness rather than by luck.

| mutant | landing | result |
|---|---|---|
| MA1 findings never pushed | `findings.push(r.message)` deleted | **KILLED**, 24 of 51 |
| MA2 the elision line never printed | `if (b.elided === 0)` → `if (true)` | **KILLED**, 1 of 51 — *"a reported listing is budgeted and says how much it did not print; a finding is never budgeted"* |
| MA3 the budget disarmed | `REPORT_BUDGET = 6` → `600` | **SURVIVED**, 51 of 51 — disclosed below |
| MB1 the `a body SHALL` family never matches | `bod(?:y\|ies)` → `zzznomatch` | **KILLED**, 2 parser + 1 e2e |
| MB2 `positive control` no longer needs a SHALL | the `needsShall` guard deleted | **KILLED**, 1 parser |
| MB3 nothing is ever unbodied | `bodyBearing` → `return 'x'` | **KILLED**, 3 parser + 1 e2e |
| MB4 everything is unbodied | `bodyBearing` → `return ''` | **KILLED**, 2 parser + 1 e2e |
| MB5 the refusal stops naming the criterion | `"${first.text}"` → `""` | **KILLED**, 1 parser |
| MB6 the refusal stops naming the fence | `fencePaths.join(" ") \|\| "nothing"` → a constant | **KILLED**, 2 e2e |
| MB7 the criterion's CARD line is not recovered | `criterionLine` → `return 0` | **KILLED**, 1 e2e |
| MC1 / MC2 / MC3 | above | **KILLED**, 1 of 51 each, same body |
| MD1 (DATA, not code) | three planted cards | the positive control fires at the tip and NOT at the base |

**A NON-LANDING, REPORTED RATHER THAN COUNTED AS A SURVIVOR.** MB7's
first spelling was a `perl` substitution whose pattern did not match; the
suite came back 51 of 51 and would have read as a survivor. The harness
compares `git diff --numstat` before believing any result, printed
*"MUTATION DID NOT LAND"*, and MB7 was re-aimed with an exact
replacement and then killed. This is the failure
`method/roles/verifier.md` 2b names, met and caught.

**MB3 AND MB4 ARE BOTH DIRECTIONS OF ONE TERM** — the guard that permits
and the guard that refuses everything — and both die. That pair is what
rules out the failure phase 1 pre-committed as the likeliest: a refusal
keyed on a phrase list too broad. Measured on the ground file before the
diff: reading the four phrases anywhere in a card would refuse **10**
live cards, two of them startable; reading a literal `touches` string
instead of the RESOLVED fence would refuse **22**; a glob-blind prefix
join would refuse `T-111-s11` alone. The shipped reading refuses **0**
live startable cards, and it refuses none of those wrong sets, because
the criteria are scoped to `## Acceptance criteria`, the fence is the
expanded one, and `BODY_BEARING` carries five suite shapes rather than
the card's three.

### Security sweep

No new input path, no endpoint, no query, no secret, no dependency —
`package.json` is untouched on both packages. The new regexes are linear
with no nested quantifiers, so no ReDoS surface is added over card text.
Author-supplied criterion text reaches every display through
`JSON.stringify`, and a body already pins that escape (*"every DISPLAY
site in the quotes arm escapes the author's string"*), which MB6's blast
radius confirms is live. `CardStartability` gains a required `unbodied`
field — an interface widening, covered by the parser suite at 377 GREEN.

### Gates, at the tip judged

    gate-run parser  GREEN 377 bodies   ref eb78a37
    gate-run app     GREEN 1146 bodies  ref eb78a37
    gate-run e2e     GREEN 632 bodies   ref eb78a37

`docs-gate.mjs` on this card and the routed suggestion card FIRES (exit
1, its diff-half answer): both paths are code inputs and it names
`npm test` from `app/`, `npm test` from `tools/e2e/` and `npx vitest run`
from `lib/parser/` — all three run above. `capabilities:check` is STALE,
53,381 → 53,673 bytes, from the three new spec names
(*"a criterion demanding a BODY over a fence that holds none is REFUSED,
and one spec file clears it"*, *"a reported listing is budgeted and says
how much it did not print; a finding is never budgeted"*, *"markerEnd's
TYPOGRAPHIC pair spans the wrap, and its own return is the only thing
that moves"*). Disclosed on this card and the integrator's at the merge,
which is the rule. Body counts moved as they had to:
`card-preflight.spec.ts` **48 → 51**, `lanes.test.ts` **22 → 27**.

### Filed as observations, blocking nothing

- **MA3's survivor, stated as a residual rather than claimed away.**
  `REPORT_BUDGET`'s MECHANISM is pinned (MA2 dies by name); its VALUE is
  not. Raising it to 600 disarms every elision and 51 of 51 still pass,
  so nothing in the tree would red if this arm went back over the buffer.
  That is consistent with the project's own position — the margin guard
  in `brief-flush.spec.ts` ANNOUNCES the arm rather than gating it — and
  it is the honest reading of what the suite does and does not hold.
- **The ruling channel is asymmetric.** A dated `PREFLIGHT RULING`
  naming the criterion discharges the preflight's refusal (measured: the
  `NO BODY` finding disappears and prints as `RULED (2026-09-02) line
  27: …`), and the dispatch view still rules the card `unfenceable`. The
  clause's own comment names *"rule the criterion documentary on the card
  and date it"* as one of two dispatcher repairs; through the dispatch
  view that repair does not take. No printed output claims it and no
  acceptance criterion covers it, so it is an observation.
- **A ruling written INSIDE `## Acceptance criteria`, quoting its own
  criterion, raises a fresh copy of the finding on the ruling's own
  line.** Measured. All six live `PREFLIGHT RULING` instances sit outside
  the criteria section, so this is reachable only by writing one in the
  wrong place.
- **The absorb script's 1,400-character cut** is the seat's, already
  recovered on this card. Phase 1's ground named the truncation
  independently, before the RECOVERY section was read.

### And at this seat's own commit

Steps 5 and 6 are WRITES, and a verdict is measured at a commit that no
longer exists once it lands. The three gates above and the docs gate
were re-run at the commit THIS verdict creates, whose sha a document
cannot carry about itself; the reading goes back in this seat's report
beside that sha. The figures in the block above are stamped
`eb78a37` and stay true of that ref forever.
