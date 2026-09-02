---
id: T-215-s2
title: "`lane-fence.mjs`'s header calls `no-path-to-judge` \"limit 5\" in its decline list while its own limits block and its code both say limit 8 — a guard publishing a wrong limit number is T-215's class one file over"
feature: F-06
milestone: 4
priority: 3
size: S
status: verifying
blocked_by: [T-219-s3]
touches: [.claude/hooks/lane-fence.mjs, tools/e2e/tests/lane-fence.spec.ts]
suggested_by: "executor claude-opus-5@subagent @T-215"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by: claude-opus-5@subagent
review: independent
---

**A DOCUMENT THAT PUBLISHES A GUARD'S LIMITS IS PART OF THE GUARD** —
`T-215`'s opening line, turned on the guard's own header. Read at
`42520e3` in the `T-215` lane, `.claude/hooks/lane-fence.mjs` names one
limit by two different numbers.

## The two spellings, verbatim

The AN UNJUDGED WRITE SAYS SO block, header line 143:

> the four codes that DECLINE to judge — `not-a-repository` (limit 2),
> `not-judged-detached` (limit 3), `not-judged-lane-list` (limit 4) and
> `no-path-to-judge` (**limit 5**) — set it FALSE.

The HONEST LIMITS block numbers **5** as *"IT IS ADVICE TO A COOPERATING
HARNESS"* and **8** as *"A REQUEST WITH NO READABLE PATH HAS NO TARGET TO
ROOT FROM"*. The code agrees with 8 in two independent places:
`noTargetVerdict`'s doc-comment (*"the one question the WRITER's cwd still
answers (limit 8)"*) and the decline's own runtime message, which ends
`"(limit 8 in this file's header)"`.

So the header says 5, the header says 8, and the string a session
actually SEES on stderr says 8. Limit 5 is not a declining limit at all —
it is the advice-to-a-cooperating-harness limit, which returns no verdict.

## Why it is a card and not a typo

**IT IS THE SAME DEFECT CLASS AS `T-215` ITSELF**, one file over: a limit
number is the handle a reader uses to look the limit up, and a wrong one
sends the reader to a limit about `.claude/settings.json` when they were
chasing a request with no path. Most likely provenance is a renumbering:
limits 6, 7 and 8 were added after the decline list was written, and the
list kept the number the no-path limit held when it was fifth.

**AND IT IS OUTSIDE `T-215`'s FENCE.** `T-215` is fenced to
`docs/CONVENTIONS.md` exactly; the hook is not in it. Routed rather than
fixed, per `method/lane-protocol.md` rule 5.

**T-215-s1 WOULD CATCH THE NEXT ONE.** If that card lands, the count
comparison it proposes reads the numbered limits block, so a decline list
naming a number the block does not answer for becomes checkable rather
than noticed by hand.

## Acceptance criteria

- `.claude/hooks/lane-fence.mjs`'s AN UNJUDGED WRITE SAYS SO block SHALL
  name `no-path-to-judge`'s limit with the number its own HONEST LIMITS
  block and its runtime message already carry.
- No verdict, code or message SHALL change; this is the header only, and
  the existing bodies in `tools/e2e/tests/lane-fence.spec.ts` SHALL stay
  green unchanged.
- Verification: headless.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, behind T-219-s3

The architect seat, at T-215's merge (c8f69aa). One number in the hook's
header; T-219-s3 holds the hook now and rewrites the same header, so this
rides after it rather than beside it.

## VERDICT — APPROVED, 2026-09-02, verifier claude-opus-5@subagent

Judged at tip `94d67d161255337b2a3732473d4dfe2cf0e89cc2`, base
`1886cc766c231c171e677f8819946945b3294a67`, in the bench
`/Users/ujju/Projects/nputer-V-T-215-s2`. Nothing was written in the
lane.

**THE BLINDNESS WAS CLOCK-SHAPED, AND THE LINE IS STAMPED.** Phase 1
reached this seat before the work existed. The attack set and a measured
ground truth were sealed BEFORE the branch was named:

    attack-V-T-215-s2.md  ce6619a7165664a77502547ff366eec11f65b3f9578de0dcc3e3e68ea20237e6
    ground-V-T-215-s2.md  75bb1bb400a9219e3c43e3075432563133adffb0d11edae30eaa4f861f0376c8
    sealed 2026-09-02T15:32:22Z

The brief named no executor-derived specific, so phase 1 was not broken
above the line. The executor's report arrived only in the phase-2
dispatch, after that seal, and every figure in it was re-measured here
with this seat's own scripts rather than taken as read.

### The criteria, each attacked literally

**AC1 — the decline list names the limit its own block and its runtime
message carry.** Met, and read as a byte rather than inferred from a
gate. The header's `── AN UNJUDGED WRITE SAYS SO` block now cites
`` `no-path-to-judge` (limit 8) ``. The diff to the hook is ONE
character on one line, and the three sibling citations
(`not-a-repository` 2, `not-judged-detached` 3, `not-judged-lane-list`
4) are byte-identical. The fix is in the SAME SHAPE as its three
siblings — the pre-committed rewording trap (a number in words, or the
parenthetical moved outside the backticked code) is not taken, so a
reader and a machine both still match it.

**AC2 — no verdict, code or message changed; the existing bodies stay
green unchanged.** Met, checked as bytes and not as a claim. The
HONEST LIMITS block still numbers 1–8 in order with all eight opening
lines unaltered; the frozen `DECLINE_CODES` is unchanged; the
`noTargetVerdict` doc-comment and the runtime string a refused session
reads both still say limit 8; every other `limit N` in the file is
untouched; and no line number in the file moved, so the card's own
citation of header line 143 stays true. The spec diff is **262
insertions and ZERO deletions** — no existing body was edited. The
module still parses (`node --check`) and a live `decide` on a pathless
request from a lane-less cwd still answers `no-path-to-judge` with
`judged: false`, telling the session limit 8.

**The fence.** The diff touches four paths and all four are inside the
card's fence as the tip carries it: the hook, this card,
`tools/e2e/tests/lane-fence.spec.ts`, and the routed `T-215-s7`
(`docs/tasks/` is unfenceable). `docs/CONVENTIONS.md` is byte-identical
— the page was already correct, publishing `no-path-to-judge` at (8),
and touching it would have been both wrong and out of fence.

**THE FENCE THAT MADE THE KEEPER POSSIBLE WAS THE DISPATCHING SEAT'S,
AND IT IS RECORDED AS SUCH.** This seat's phase-1 finding was that the
card's central criterion was unpinned by any gate and that the body
which would pin it lived in a file the ORIGINAL fence
(`[.claude/hooks/lane-fence.mjs]`) did not hold. The dispatching seat
widened the fence on main to add
`tools/e2e/tests/lane-fence.spec.ts`, re-armed the manifest and wrote
the lane's card copy; the widening reaches this diff in the lane's
second commit. The keeper below is therefore in scope, not scope creep.

### The drill — kill-set containment, three ways, run here

Each mutant was landed with a mutator that REFUSES a pattern not
occurring exactly once, read back from `git diff`, and restored with
sha256 proof.

| mutant | site | `:1538` T-215-s1 keeper | the new subject | the new control |
|---|---|---|---|---|
| M1 the base defect replanted, `(limit 8)`→`(limit 5)` | hook header | green | **RED** | RED |
| M2 the block's `8.` renumbered to `9.` | hook header | **RED** | RED | RED |
| M3 the page's count word `eight`→`seven` | **doc (DATA)** | **RED alone** | green | green |
| M4 the RUNTIME string moved to limit 5 | hook code | green | **RED** | RED |
| M6 `not-judged-detached` moved from 3 to 7 | hook header | green | green | green |
| M7 the citation WRAPPED across a line | hook header | green | **RED** | RED |
| M8 `citationDrift` loses arm two | spec | green | green | **RED alone** |

**M1 IS THE MEASUREMENT THIS CARD IS FOR.** With the wrong number back
in place, all 60 pre-existing bodies PASS and only the new pair reds —
which is, directly measured, the state at the base: this defect redded
nothing, because `headerLimitNumbers` slices from `── THE HONEST
LIMITS` and the decline list sits twenty lines ABOVE that slice. The
approval of AC1 therefore rests on the byte read here, never on the
green suite.

**NEITHER KILL SET CONTAINS ANOTHER.** M3 kills the older keeper alone,
M4 and M7 kill the new pair alone, M8 kills the new control alone. All
three bodies are load-bearing and the new subject is not a restatement
of `T-215-s1`'s.

**M7 ANSWERS THE PRE-COMMITTED REWORDING ATTACK.** A citation wrapped
across a comment line defeats arm one silently — the anti-vacuity check
is `> 0`, not `== 4` — but ARM TWO catches it and names the cause:
*"`no-path-to-judge`'s runtime message cites limit 8 and the decline
list cites no limit for it"*. The two arms cover each other's blind
spot for the one code that carries a runtime citation.

**AND THE CONTROL WAS SHOWN TO FAIL BEFORE IT WAS TRUSTED TO PASS.** M8
damages the comparison the control guards; the control reds alone while
the subject stays green (verifier.md 2b).

**M6 CONFIRMS THE DECLARED RESIDUE RATHER THAN DISCOVERING IT.** Moving
`not-judged-detached`'s citation from limit 3 to 7 passes 62 of 62,
exit 0. Arm one binds only a code the numbered block SPELLS and exactly
one of four is spelled; measured here, independently. It is declared in
the spec's own doc-comment and routed as `T-215-s7`, which is the
honest treatment.

### Security sweep

Nothing to report. The diff adds no input path, no endpoint, no
dependency and no secret; the new code is test-side, writes only into
the suite's existing `mkdtemp` scratch root, and reads files through the
same `readFileSync` the subject uses.

### Findings — routed, not blocking

**`T-215-s7`'s stated reason for arm two's gap is FALSE AS WRITTEN, and
the correction makes its fix larger.** The card says only
`no-path-to-judge`'s decline carries a `(limit N in this file's
header)` string. `not-a-repository`'s decline carries one too — a
refused session IS told *"(limit 2 in this file's header)"* — but the
source splits the sentence across a `+` concatenation, so
`runtimeCitations`'s regex never sees it. The conclusion (arm two does
not cover it) stands; the premise does not. Closing arm two for that
code needs the string joined or the reader taught about concatenation,
which is not in `T-215-s7`'s acceptance criteria as written.

**The census is stale and that is correct.** `capabilities:check` reds
STALE, 53199 to 53388 bytes, on the two new test names — measured here.
`docs/CAPABILITIES.md` is read-only to a lane's fence by design, so the
lane reports it and **the integrator regenerates it in the merge
commit** (docs/CONVENTIONS.md's `npm run capabilities` bullet). The
handoff reported it.

**`built_by:` is unstamped** and falls to whoever closes this card.

### Gates — run in this bench with this verdict's prose already in the tree

The docs gate was asked with the WHOLE changed-path set. It FIRES on
the two card files and owes three suites; all three were run, and the
prose below was present in the working tree for every one of them, so
these readings cover this verdict's own writes as well as the diff's.

| gate | result |
|---|---|
| `gate-run.mjs parser` | **GREEN, bodies=372, exit 0** |
| `gate-run.mjs app` | **GREEN, bodies=1146, exit 0** |
| `gate-run.mjs e2e` | **GREEN, bodies=629, exit 0** |
| `lane-fence.spec.ts` alone at the tip | **62 passed, exit 0** (60 existing + the new pair) |
| `docs-gate.mjs` on the four changed paths | FIRES, exit 1 — owes `npm test` from `app/`, `npm test` from `tools/e2e/`, `npx vitest run` from `lib/parser/`; every live card's frontmatter parses with a legal status |
| `capabilities:check` | **STALE, 53199 → 53388, exit 1 — CORRECT**, two new test names, the integrator's to regenerate at the merge |
| `git merge-tree` onto main `a3794c9` | clean, exit 0; the changed-path set is exactly the four |
| `docs/CONVENTIONS.md` | byte-identical to the base, proven by sha256 |
| the hook below its leading block comment | unchanged — no line number in the file moved |

Every mutant above was restored with sha256 proof and the tree carried
no residue when these gates ran; the planted headers never left the
suite's own scratch root.
