---
id: T-280
title: The push and the bench owe the suites and the spec files the DIFF owes — derived from the docs gate's reader map and the specs' import graph, recorded in the verdict token, required by the push guard exactly — instead of the four-suite battery on every push
feature: F-06
milestone: 4
size: M
priority: 2
status: done
suggested_by: "@human (2026-09-09): \"Yes, file both\" — ruling decision 2 of the seat's review of the outside review (docs/research/the-model-for-an-outside-review-2026-09-09.md); supersedes T-271's second criterion (amended by @human earlier the same day to keep the verifier and the integrator on four legs) by this later ruling"
blocked_by: [T-271]
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, .claude/hooks/push-guard.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/push-guard.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## What was measured

About a dozen four-suite batteries ran on the integration checkout in
one night of 2026-09-09, roughly 3.5 machine-hours, and twice two
collided on the solo lock. Around half were for commits that moved no
source under any package: dispatch stamps, card promotions, a
checkpoint, a guide page. The rule that costs it is CONVENTIONS' push
bullet — every push owes the four-suite battery, run last — and the
guard that enforces it, `REQUIRED_SUITES` in gate-token.mjs.

The instrument that makes a smaller rule honest already exists in
halves. The docs gate derives which suites read which docs from the
code (`docs-scan.mjs`'s reader map: a card is read by the parser
census and by specific end-to-end specs; a guide page by shell-frame
and window-contract). T-271 derives which end-to-end spec files own a
changed source through the static import graph. What is missing is
the token recording the owed set and the guard requiring it.

The false shortcut is named so nobody takes it: letting CI catch what
the local push skipped makes CI the gate, which is what the push guard
exists to prevent. The safety net here is the derivation, fail-closed.

## Acceptance criteria

- WHEN `gate-run.mjs` is given a range (`--range <base>..<tip>`, the
  push range or a bench's base..tip) THE runner SHALL derive the OWED
  SET: the parser, app and rust suites by the package roots the
  range's paths fall under; the end-to-end suite by the spec files
  that own those paths (T-271's import graph) plus the spec files the
  docs gate's reader map names for every docs path in the range — and
  SHALL grade exactly that set, writing the token with the owed set,
  the range and the inputs the derivation read.
- WHEN the push guard judges a token THE guard SHALL derive the owed
  set for the push range by the same function and require every
  member measured GREEN at the range's tip; a token whose measured set
  does not cover the owed set SHALL be refused with a new reason,
  `token-partial`, naming what is missing — additive to the existing
  reasons, none renamed.
- IF the derivation cannot place a path (a file under no package root,
  a reader the map does not know, a spec whose imports cannot be
  resolved) THEN the owed set SHALL be the whole four-suite battery —
  fail closed, and the token SHALL say why.
- WHEN a bench verifies a lane THE verifier's one run at its tip
  (T-262) SHALL be the owed set for base..tip, not the four legs —
  the bench's report naming the set and its derivation.
- THE derivation SHALL be a function with its own bodies, drilled with
  a DATA mutant: a reader planted in a spec (or a doc read added)
  grows the owed set, and a body asserts it; a hand-listed set
  anywhere is a rejection.
- WHEN CONVENTIONS' push bullet is read THE rule SHALL say the owed
  set, the derivation and the fail-closed case, and SHALL say that CI
  still runs the whole battery after every push; `workflow-parity`
  keeps CI on four legs.
- THE health band for suite seconds SHALL keep reading the whole
  battery (it measures the suite, not the push), and the checkpoint
  SHALL stamp the battery minutes saved for one sitting before and one
  after, with the clock.

## Implementation notes
<!-- executor appends before finishing -->

Built at base `a1bb590`. THE DERIVATION IS ONE FUNCTION AND IT LIVES IN
THE RUNNER, because the runner is the only file that already holds all
three of its inputs: the graded registry, the specs' static import graph
(T-271) and the docs gate's reader map. `deriveOwed` in
`tools/e2e/scripts/gate-run.mjs` is that function, pure over its named
inputs; `owedForRange` is the one place a reading happens.

WHAT COMPOSES, AND WHY NOTHING IS LISTED. `PACKAGE_ROOTS` is
`Object.fromEntries` over the registry's own `cwd` fields, so a graded
suite added without a root is impossible rather than merely discouraged,
and `suiteOfPath` takes the LONGEST prefix so a Rust file inside `app/`
is the rust suite's. The end-to-end half calls T-271's `owningSpecs`
rather than re-implementing it. The docs half calls `docsGate` and
places each READER FILE through the same package roots — which is how a
document read by the parser's census owes the parser suite with nobody
writing that down.

ONE ARM THE CARD DID NOT NAME AND THE PACKAGE ROOTS WOULD HAVE MISSED:
`app/package.json` depends on the parser at `file:../lib/parser`, so a
change under `lib/parser/` can red the APP suite while lying under the
parser's root alone. `packageDependents` reads that edge off the
manifests and closes it transitively; a body plants and removes the
specifier in a scratch tree, so the edge is measured rather than
asserted.

THE ASYMMETRY AGAINST `--owning`, STATED BECAUSE IT LOOKS LIKE A BUG. A
docs path NOTHING reads is PLACED here and UNPLACEABLE there. T-271 asks
"which spec owns this" and "none" is an inability; this asks "what does
this range owe" and the docs gate answering "no code suite reads it" is
a positive answer over a map derived from the whole source corpus. Half
the wasted batteries this card was written about were exactly those
paths, so collapsing the two would have kept the cost the card exists to
remove.

WHY THE RANGE FORM'S VERDICT IS MINTABLE AND THE HAND-TYPED ONE IS NOT.
`--owning` takes a seat's path list, which no second reader checks, so
its verdict keeps `SCOPED-` and mints nothing — unchanged, and a body
still requires that. `--range` derives its list from two commit ids, and
the push guard re-derives the same list from the same two before it
accepts anything, so the end-to-end entry keeps the word it earned and
carries `scope=` naming the spec files it graded. An entry with NO scope
graded the whole leg and covers any subset, which is what makes the
whole arm additive: every token that already exists is still covered.

THE GUARD SPAWNS THE RUNNER RATHER THAN IMPORTING IT. `push-guard.mjs`
loads on every Bash call in a session and may cost node's startup and
nothing else; `gate-run.mjs` walks a corpus. So `runOwedSet` asks the
program that owns the rule with `--owed-set --range <r> --root <root>`,
the way the graph and the cheap checks are already asked, and the ASK
arm answers JSON in both directions so a refusal is machine-readable.
`OWED_SET_FLAGS` is pinned against the runner's own exported constants
by a body, the treatment `REQUIRED_SUITES` already gets.

FAIL CLOSED, AT BOTH BOUNDARIES. Inside the runner: a path under no
package root that no spec reaches and the docs gate cannot place, a
reader the map cannot put in a package, a docs path the gate was never
asked about, an unresolvable import edge — each makes the owed set the
whole battery with the reason recorded. Outside it: no upstream, no
runner in the checkout, a non-zero exit, an unparseable answer, a shape
without the fields the guard reads — each simply does not pass `owed`,
and `judgeToken` then requires exactly what it required before this card.
THE FALLBACK IS SILENT ON PURPOSE: it is stricter than the derivation,
so it leaves nothing unverified, and this guard announces only an allow
that left something unverified. It is also what keeps the ninety-odd
pre-existing push-guard bodies green — none of their fixtures names an
upstream, so all of them exercise the fallback.

THE RANGE RULE IS HELD RATHER THAN QUOTED. `rangeChanged` takes two dots
and CHECKS that the left endpoint is an ancestor of the right, because
`git diff A..B` between divergent tips returns the other side's work in
reverse. Both callers are the shape the rule permits — a push's upstream
is an ancestor of what is being pushed, a lane's base of its tip — so the
check costs nothing and turns the one case that would lie into a refusal.

`token-partial` IS ONE CODE WITH TWO FACES: a suite the range owes that
nothing measured, and a spec file the range owes that the recorded run
did not grade. Both are "the measured set does not cover the owed set",
both name what is missing, and both are cleared by the same one command.
`token-incomplete` keeps its name and its meaning — the whole battery was
required and is not carried — and a body requires all five earlier
reasons to be reachable with an owed set in hand.

POISON DRILL, 4 for 4, each mutant run against the body that owns the
property with the pristine hook passing before and after: fail-closed
removed from `deriveOwed` (kills); `packageDependents` answering no
edges (kills); the end-to-end leg never owed WHOLE (kills); the
spec-coverage half of `token-partial` removed (kills). The DATA mutant
the card asks for is a body rather than a drill: it plants and removes
an `import` statement in a real fixture spec and reads the owed set move
from `{whole: true, specs: []}` to `{whole: false, specs: [owner]}`.

THE FLAG IS `--tree` BECAUSE THE BATTERY SAID SO. The ASK arm needs to
name a checkout that is not the one the runner was loaded from, and the
first spelling was this repository's usual `--root`. The whole battery
redded one body in `cli.spec.ts` — *"every verb that hands its target
--root fronts a script whose own flags carry it"* — which pins the
front's `rootFlag` claim and the target's own flags to each other in
BOTH directions. The body was right and the flag was wrong: `--root`
here means "the project root the target OPERATES ON", and this runner
does not operate on the tree the flag names — it reads the derivation's
INPUTS there and still runs every suite from the registry's own
directories. So the flag was renamed rather than the pin loosened, and
`cli.mjs` (outside this fence, and which would have had to hand `--root`
on every `supertaskr gate`) never needed touching. THAT RED IS ALSO THIS
CARD'S OWN ARGUMENT ARRIVING ON TIME: a cross-spec red, in a spec no
part of this diff names, caught inside the lane's ceremony — and the
owed-set run found it too, because `cli.spec.ts` is one of the 16 spec
files this range owes.

WHAT THIS LANE COULD NOT DO, FILED RATHER THAN DONE. `T-280-s1` — the
derivation cannot see a spec that READS a placed path at runtime, so
`app/package.json` owes the app suite and not `landing-gate.spec.ts`,
which asserts about that file's contents; the class is exactly the paths
the package-root arm CAN place, which is what stops the fail-closed net
catching them. `T-280-s2` — the bench's instruction to run the owed set
and to NAME the set and its derivation belongs in
`method/roles/verifier.md`, which was T-283's armed fence; CONVENTIONS
carries the rule and the role file does not.

OUTSIDE THE FENCE AND OWED AT THE MERGE, said loudly rather than left to
be found: `docs/CAPABILITIES.md` is STALE (committed 69267 bytes, a
fresh generation 71075) because this lane adds 16 test names — the
merge commit owes `npm run capabilities`, per docs/STATE.md's own
hazard. `docs/STATE.md`'s standing hazard still reads *"EVERY PUSH OWES
THE FOUR-SUITE BATTERY, RUN LAST"*, which this card makes false; STATE
is rewritten at every checkpoint and that line is the checkpoint's.
`index --check` is CURRENT at this tip (exit 0, 201 files, 2560 symbols,
2453 edges), so no regen was needed in-lane; GRAPH REGEN still fires at
the merge on the `.ts` in this diff and is the integrator's.


### FIX PASS — 2026-09-09, after the phase-2 REJECTED verdict below

THE VERDICT NAMED ONE DEFECT AND THIS PASS ANSWERS EXACTLY IT.
`judgeToken` nested the spec-file coverage check inside
`if (owed !== undefined)`, so when the guard could not derive a range it
passed no owed set, `need` fell back to `REQUIRED_SUITES`, and the
`scope` field was never read — a token minted by `--range` over 16 of 39
spec files (612 of 810 bodies) passed the fallback as a whole battery.
The base refused the same shape (`SCOPED-GREEN` → `token-red`), so it
was a regression against the base on the spec axis, not an unbuilt
check.

WHAT MOVED, in `aceec12`:

- **`.claude/hooks/gate-token.mjs`** — the `scope` read is lifted OUT of
  the owed branch and asked on both paths. A `GREEN` entry carrying a
  `scope`, with no owed set derivable, is `token-partial`: *a scoped
  GREEN says nothing failed among the spec files it ran; it does not say
  the leg ran*. The owed branch keeps its two sentences and now reads
  the same hoisted value rather than recomputing it.
- **ONE JUDGEMENT THE VERDICT DID NOT DICTATE, said plainly**: the new
  check asks only of an entry whose verdict WORD would otherwise pass
  (`=== GREEN`). Without that clause it fires first on T-271's
  `--owning` entries, whose word is `SCOPED-GREEN`/`SCOPED-RED` and
  which the verdict check at the end of the function already refuses by
  name — measured: `gate-run.spec.ts` went 68 passed / 1 failed on the
  body *"the push guard refuses a scoped verdict as the token…"*, which
  asserts the refusal DETAIL contains the scoped word. Safety is
  unchanged either way (both paths refuse); the clause picks the more
  specific sentence and keeps that body green. 69 passed after it.
- **`.claude/hooks/push-guard.mjs` and `docs/CONVENTIONS.md`** — the two
  artefacts the verdict named as false. Both said a missing range makes
  the owed set THE WHOLE BATTERY and left "battery" meaning four suite
  entries; both now say it means four WHOLE LEGS, on the SUITE axis and
  the SPEC axis, and carry the measurement that made the distinction
  real.
- **The bench's body is the pin and was NOT rewritten** — cherry-picked
  into the lane as `62f4342` (with the verdict and T-280-s3 as
  `edfc369`), RED at `cc7905d` by construction, GREEN here.

THE SWEEP THIS FIX OWES, and its class: *a safety field on a token entry
that one code path reads and another does not*. Every other field
`judgeToken` reads — `tree`, `dirty`, `treeAtWrite`, `verdict`, `exit`,
`bodies` — is read AFTER the owed branch, in a loop over `need`, so it
is asked identically whether or not a range was derived. `scope` was the
only field inside the branch, and it is now outside it. Swept by reading
every entry-field access in the function; no second instance of the
class.

WHAT WAS RE-RUN, AND AT WHICH REF. The fix's paths are two hooks and one
governing document; what they owe is the two spec files that read them
plus the range form over the lane's own diff.

| run | ref | exit | bodies |
|---|---|---|---|
| `push-guard.spec.ts` alone | working tree of `aceec12` | 0 | **95 passed** (94 + the bench's body) |
| `gate-run.spec.ts` alone | working tree of `aceec12` | 0 | **69 passed** |
| `tools/e2e: npm run typecheck` | working tree of `aceec12` | 0 | — |
| `--range a1bb590..aceec12` parser | `aceec12` | 0 | 389 |
| `--range a1bb590..aceec12` app | `aceec12` | 0 | 1171 |
| `--range a1bb590..aceec12` rust | `aceec12` | 0 | 654 (18 targets) |
| `--range a1bb590..aceec12` e2e | `aceec12` | 0 | **613** over 16 of 39 spec files |

`range-exit=0`, wall 14:49:40Z→15:02:54Z = **794 s**, with another
bench's battery on the same machine throughout — the number is
contended and is not offered as a saving. The owed set is unchanged from
the first pass (`app, e2e, parser, rust`, e2e over the same 16 spec
files, `failClosed` none); the e2e count moved 612 → 613, which is the
bench's one body. Every token entry reads `dirty=false` against tree
`2236639`, HEAD's own.

THE WHOLE BATTERY WAS NOT RUN AND THAT IS A DERIVATION, not a skip: the
docs gate on this pass's changed docs paths names the same four suites
and its e2e readers are a subset of the 16 the range owes, so the range
form names everything the gate does.

STILL OWED AT THE MERGE, unchanged and re-measured: `docs/CAPABILITIES.md`
is STALE (committed 69267 bytes, a fresh generation 71224) — this lane
now adds **17** test bodies, so the merge commit owes `npm run
capabilities`.

## Verdicts

### 2026-09-09 — claude-opus-5@subagent (verifier, phase 2) — REJECTED

Tip judged `cc7905dc21c0c094079b1f0adab245725218641d`, base
`a1bb590b2aaac92aad23aa0879075f23608dbad1`, on the detached bench
`../nputer-V-T-280`. Sealed inputs cited by hash:

- attack set `sha256:62e883997be83f16e2ccec3bfbfe569c229f54540cb73e60f91d71b2faea9d0c`
- ground truths `sha256:92dab9107ebea92df1fde0ae09ecfaa4baa9ca5a9730eb3c424a47f16306f1b0`
- ground addendum `sha256:bb331656bf64e83edb96f6675a3038acce5c9b50b1478d62dd55b6da10224053`

**THE FRAME I ACTUALLY HAD.** Two spawns. Phase 1 wrote the attack set
tool-less at the base, before this lane's first commit; its hash and the
two ground-truth files' hashes matched the dispatcher's stamps exactly
before anything else was opened. The brief is HAND-WRITTEN BY THE SEAT
AND CARRIES NO CONTEXT PACK — I say so as the role requires; I read
CONVENTIONS at the base by the bullets I needed (push, DOCS GATE,
BLESSED RUNNER, RANGE RULE) rather than end to end, plus STATE and the
card at the base. The brief's duties section names executor-derived
specifics (the `--range a1bb590..dc5d08d` figures, the 16-of-39 spec
count, the two battery wall times, the `--root`→`--tree` story). Those
reached me BEFORE the diff and I report it rather than pretend
otherwise: phase 1's set was already sealed and hashed by then, so the
attack set is uncontaminated, but my phase-2 orientation was not blind
to those numbers. Every one of them I re-measured; where I did, I say so.

**THE VERDICT IS REJECTED FOR ONE DEFECT**, and it is the one this
card's own posture names: a place where "we could not tell" resolves to
accepting a smaller measurement than the base required.

**THE DEFECT — the fail-closed fallback does not require a WHOLE
end-to-end leg, so a scoped GREEN passes as a battery.**

`judgeToken` nests the entire spec-file coverage check inside
`if (owed !== undefined)`. The guard passes `owed` only when
`owedSetForPush` succeeds; when it cannot derive a range it passes
none, and `need` falls back to `REQUIRED_SUITES` — four legs on the
SUITE axis, with the SPEC axis never examined.

Before this card that was sound, because a plain `GREEN` `e2e` entry
could only have come from a whole leg: the one form that graded a
subset wore `SCOPED-GREEN`, which this guard refuses as `token-red`.
`--range` now mints a plain `GREEN` for a NARROWED leg and records what
it graded in `scope`. The invariant "four suites GREEN at this tree ==
the battery ran" is gone, and the fallback is the one path that does not
notice.

Reproduce (a `git clone --shared` at the tip, on a branch with no
upstream — never the real checkout):

    node $S/repro-guard-T-280.mjs <clone>

    pushRange -> {"problem":"this branch names no upstream, ..."}
    A) four UNSCOPED legs (the control):     allow   graph-current
    B) same token, e2e graded 1 of 39 specs: allow   graph-current

Expected at B: `block` / `token-partial`. Actual: `allow`. At the judge
alone (`$S/probe-judge-T-280.mjs`), the same token with no `owed`
answers `{"state":"fresh","code":"token-green"}`, while the same token
WITH an `owed` naming the leg whole answers `token-partial` correctly.

**THE CONTROL (K1), run where the arming is absent.** The same probe
against the base `a1bb590`: a partly-graded leg there is `SCOPED-GREEN`
and the base answers `token-red` — REFUSED. So the base refuses what
the tip accepts; this is a regression against the base on the spec
axis, not merely an unbuilt check. (K2: the base runner rejects
`--range` as an unknown suite, exit 2 — the arm really is new.)

**WHY THIS IS NOT A CORRECTION.** Two of the lane's own artefacts state
the property absolutely and are false as implemented. `push-guard.mjs`:
"THE FALLBACK IS SILENT ON PURPOSE: it is STRICTER than the derivation,
so it leaves nothing unverified" — on the spec axis it is weaker, and
silence is what makes it unnoticeable. CONVENTIONS, in the bullet this
card adds: "...no upstream to range against, a runner this checkout does
not have, an answer the guard cannot parse — every one of them makes the
owed set THE WHOLE BATTERY." And the lane's own `gate-run.spec.ts` body
"the RANGE arm grades the owed set..." constructs a fixture whose
`stranger.spec.ts` ALWAYS FAILS, then asserts the scoped run is
`verdict=GREEN` while `expect(whole.status, "the leg really reaches the
stranger").toBe(EXIT.RED)`. That is a tree on which the token reads as
four green legs and the end-to-end leg fails. `push-guard.mjs`'s own
comment calls the no-upstream case "THE ORDINARY CASE ON A LANE".

**WHY NO BODY CATCHES IT.** The section header says the fallback is
"BEING EXERCISED BY NINETY-ODD BODIES" — true on the suite axis; every
one of those fixtures plants an UNSCOPED token. `plantSuites` already
takes a `scope` parameter, but it is never passed on a no-upstream
fixture. The body "every way the owed set cannot be derived lands on the
WHOLE battery, and none of them narrows a push" plants only
`["parser"]`, so it stops at `token-incomplete` and never reaches the
four-green-with-scope case.

**THE BODY IS COMMITTED ON THIS BENCH**, after this verdict, in
`tools/e2e/tests/push-guard.spec.ts`. Both readings recorded below.

**THE READINGS ON THE BODY.** `tools/e2e/tests/push-guard.spec.ts`, body
*"a token whose end-to-end entry graded PART of the leg is refused even
when no owed set could be derived, because a scoped GREEN is not a whole
leg"*, from `tools/e2e/`, `SUPERTASKR_E2E_PORT=25280`:

- **RED against the implementation lacking the property** — the tip as
  submitted: `94 passed, 1 failed`, the failure being this body,
  `Expected: "block" / Received: "allow"` at the scoped-token line. Its
  control line (four UNSCOPED legs must still be allowed) passes first,
  so the redness is the scope field and nothing else.
- **GREEN against an implementation carrying it** — with a candidate fix
  that lifts the `scope` check out of `if (owed !== undefined)` and
  refuses a scoped `e2e` entry when no owed set was derived: this body
  passes, and the WHOLE file passes `95 passed`. The fix is four lines
  and breaks none of the ninety-four. The fix is NOT committed; the tip
  is judged as submitted.

**NO MUTANT BLOCK IS EMITTED, AND THAT IS SAID RATHER THAN OMITTED.**
T-281's grammar requires `--- old` text matching the named file EXACTLY
ONCE, and the site that would carry this property does not exist at the
judged tip — the fallback has no scope check to mutate. A block naming a
site the lane has not yet written would have rotted before the
integrator read it. The pin is the committed body, and its redness at
the tip IS the finding.

**WHAT I RAN** (bench `../nputer-V-T-280`, detached at the tip, cold
checkout: `npm ci` + `npm run build` in `lib/parser`, `app`,
`tools/e2e`, all exit 0):

| run | exit | bodies |
|---|---|---|
| `gate-run.mjs parser` | 0 | 389 (1 target) |
| `gate-run.mjs app` | 0 | 1171 (1 target) |
| `gate-run.mjs rust` | 0 | 654 (18 targets) |
| `gate-run.mjs e2e` (whole) | 0 | **810** (1 target) |
| whole battery wall | — | 13:42:06Z→14:12:43Z = **1837 s** |
| `gate-run.mjs --range a1bb590..cc7905d` | **0** | parser 389, app 1171, rust 654, e2e **612** `scope=` 16 spec files |
| range-form wall | — | 14:13:11Z→14:26:34Z = **803 s** |
| `gate-run.spec.ts` alone | 0 | 69 passed (57 at the base; +12) |
| `push-guard.spec.ts` alone, tip as submitted | 1 | 94 passed, 1 failed (my body) |
| `push-guard.spec.ts` alone, with the candidate fix | 0 | 95 passed |

Both forms were run per the brief's rule (c): the four legs whole
(T-262) AND the lane's own range form over base..tip. **The range form's
own narrowing, measured here: e2e 612 of 810 bodies, 16 of 39 spec
files — 198 bodies and 23 spec files did not run.** My wall figures are
not comparable to the report's 930 s / 1113 s: this machine was carrying
the integration checkout's battery and another bench concurrently. The
direction agrees; the absolute numbers are contended and I say so rather
than quoting them as a saving.

**THE REPORT'S CLAIMS, RE-DERIVED.** `--range` grading parser 389 / app
1171 / rust 654 / e2e 612 across 16 of 39 specs at exit 0: CONFIRMED at
my own tip. The token keyed with an `owed` record: CONFIRMED (`owed.range`
= `a1bb590..cc7905d`, `e2e.whole=false`, 16 specs, the ten input fields).
The `--root`→`--tree` story: CORROBORATED — `cli.spec.ts` is untouched,
its body *"every verb that hands its target --root fronts a script whose
own flags carry it"* tests `/"--root"/` against the target's source,
`gate-run.mjs` at the tip contains no quoted `"--root"`, and that body is
green inside my 810. The one claim I could not re-derive is the
`c67f52e` pair (930 s / 1113 s, same single red) — that content is not in
my range; I did not re-run it and I do not repeat it as measured.
**Criterion 3's report line — "Outside: no upstream... Each lands on the
whole battery" — is the claim this verdict falsifies.**

**CRITERION BY CRITERION.**

1. **MET.** `--range` derives and grades exactly the owed set; the token
   records the set, the range and the inputs. Verified on real commits.
2. **MET.** One function, two callers: the guard holds NO copy — grep for
   `deriveOwed|suiteOfPath|PACKAGE_ROOTS|owningSpecs|specReach` over
   `push-guard.mjs` is empty; it spawns the ASK arm, and `OWED_SET_FLAGS`
   and `SCOPABLE_SUITE` are pinned to the runner's own constants by
   bodies. `token-partial` is additive and names missing suites AND
   missing spec files; all five earlier reasons keep their names, asserted
   by a body and re-checked by me.
3. **NOT MET.** Fail-closed holds everywhere INSIDE the runner — I
   confirmed the whole battery on: a `Makefile`, a `method/` path, a
   filename carrying a space and non-ASCII, a docs path never asked, a
   reader under no package root, an unresolvable import edge. It does not
   hold at the guard's own fallback on the SPEC axis. THE DEFECT.
4. **MET IN THE MECHANISM, FILED FOR THE ROLE FILE.** CONVENTIONS now
   puts the bench's run and the integrator's on the owed set;
   `method/roles/verifier.md` was T-283's armed fence and the executor
   filed T-280-s2 rather than breach it — the right call. NOTE FOR THE
   SEAT: criterion 4 puts THE BENCH'S ONE RUN on the owed set, and
   T-280-s1 (the lane's own disclosure) shows the owed set is short in a
   named class — a spec that READS a placed path at runtime rather than
   importing it. A bench running the owed set would therefore skip the
   spec that asserts about the changed file. That raises T-280-s1 from an
   improvement to a prerequisite for criterion 4's safety, and the seat
   should weigh promoting it before benches are moved onto this form.
5. **MET.** `PACKAGE_ROOTS` is `Object.fromEntries` over the registry's
   own `cwd`s; the `file:` edges are READ from manifests, with a control
   body proving a tree without the specifier has no edge. The DATA mutant
   is real and lands in DATA: one `import` statement removed and restored
   in a real fixture spec, the owed set read moving `{whole:true,specs:[]}`
   → `{whole:false,specs:[owner.spec.ts]}`; a second does the docs face.
   The two kill sets do not contain one another. No hand-listed set found.
6. **MET.** The bullet states the owed set, the derivation (three arms),
   the fail-closed case and that CI still runs the whole battery, in those
   words. `workflow-parity` and `ci.yml` untouched. Bytes 133876 → 137263
   against an UNCHANGED warn of 146878 — `docs-scan.mjs` was not touched,
   so no budget was raised to fit the prose.
7. **FIRST HALF MET BY NOT TOUCHING IT** — `health-bands.config.mjs`,
   `health-bands.mjs` and `health-bands.spec.ts` are untouched, so
   `suite/e2e-seconds` still reads the whole battery. The checkpoint half
   is the SEAT'S ACT and is NOT faked into this diff — I checked: no
   checkpoint file, no invented minutes. Reported as owed to the seat.

**SECURITY SWEEP — no findings.** Injection: `RANGE_RE` gates the string
and both git calls are `spawnSync` with argv arrays; ancestry is checked
BEFORE `git diff` runs, so a leading-`-` endpoint never reaches the diff.
I ran `HEAD; touch /tmp/pwn-t280`, `--output=/tmp/pwn2..HEAD`,
`HEAD..$(id)`, `main..HEAD --output=/tmp/x` and `../foo..HEAD` — all
refused as a JSON `problem`, no file created. No dynamic `import()` or
`require()` of any repo-controlled path in the derivation; the graph is a
static text parse and `docs-scan` reads with `readFileSync` plus
`git ls-files -z` through `execFileSync` arrays. The guard decides
NOTHING from `token.owed` — it is carried through `readToken` and read by
no branch. An untracked planted file under another root does not move the
owed set. 4000 paths in one range derive in 1 s with the right answer —
no `E2BIG`, no hang. `treeAtWrite`/`dirty` are untouched, and each write
builds a fresh entry object so a stale `scope` cannot survive an unscoped
re-run. No secrets; no dependency additions.

**THE VOCABULARY QUESTION (my §6), ANSWERED.** Outcome (a), with a
twist the set did not anticipate: ONE vocabulary is kept —
`judgeToken`'s accepted string is still `entry.verdict === GREEN` with
`GREEN = "GREEN"`, byte-identical to the base, and I confirmed a
`SCOPED-GREEN` entry is still refused as `token-red` at the tip.
`REQUIRED_SUITES` survives in exactly the role the set demanded, as the
fail-closed fallback (`required ?? (owed === undefined ? REQUIRED_SUITES
: ...)`). The feared single-character relaxation did NOT happen. But the
card introduced a SECOND safety axis — the `scope` field — orthogonal to
the verdict word, and the fallback checks the word and not the field.
The laundering my §6 predicted through the string comparison arrives
instead through the axis that comparison does not cover.

**FENCE — CLEAN.** `ci.yml`, `workflow-parity.spec.ts`,
`health-bands.*`, `dispatch-brief.mjs`, `brief.spec.ts`, `brief.mjs`,
`TASK-FORMAT.md` (T-285), `agent_runner.rs`, `agent/mod.rs` (T-281-s8),
`executor.md`, `verifier.md`, `lane-protocol.md` (T-283), `cli.mjs`,
`cli.spec.ts` and `docs-scan.mjs` are ALL untouched by
`git diff --name-only a1bb590..cc7905d`. The diff is the seven fenced
files minus `docs-scan.mjs`, plus `docs/tasks/`. Method stamp still reads
`0.1.14`. No breach.

**WHAT IS GOOD, SAID PLAINLY**, because a rejection over one defect
should not read as a rejection of the work: the derivation is the
strongest part and I attacked it hard. Package roots are segment-safe
with longest-match (`app/src-tauri/src/agent_runner.rs` → rust, not
app); the cross-package edge is READ from the manifests in the right
direction and closed transitively; deletions place correctly; a filename
with a space and non-ASCII fails CLOSED to the whole battery. The bodies
carry controls almost everywhere, and the `--range` body is the best on
the bench: it builds a fixture whose stranger spec always fails and
asserts the narrow run GREEN while the whole leg is RED, which is a
discrimination and not a construction. T-280-s1 is an honest disclosure
of a real limitation the executor was not obliged to find.

**RE-ENTRY.** Per the method a rejection re-enters by a NEW phase-2
spawn (T-248). The one thing owed is the fallback's spec axis; the body
that decides it is committed on this bench and is RED at `cc7905d`.

### 2026-09-09 — claude-opus-5@subagent (verifier, phase 2, fresh after the fix pass) — APPROVED WITH ASSIGNED CORRECTIONS

Tip judged `4d2d9522e18d49da316d5e4f3510aabf97d47952`, base
`a1bb590b2aaac92aad23aa0879075f23608dbad1`, on the detached bench
`../nputer-V-T-280`. A FRESH phase-2 spawn per T-248: I am not the
verifier who wrote the entry above and I inherit none of its approvals.
Sealed inputs cited by hash, all five verified before anything else was
opened:

- attack set `sha256:62e883997be83f16e2ccec3bfbfe569c229f54540cb73e60f91d71b2faea9d0c`
- ground truths `sha256:92dab9107ebea92df1fde0ae09ecfaa4baa9ca5a9730eb3c424a47f16306f1b0`
- ground addendum `sha256:bb331656bf64e83edb96f6675a3038acce5c9b50b1478d62dd55b6da10224053`
- the previous verdict `sha256:42db632392511d94136c95b5090061ac1db965e5dc22f37a4706c999eca22530`
- the executor's fix report `sha256:a4d5b6ba57baed2d31441bf58340ee82765569ef6f62f0320f6b87de6d70251e`

**THE FRAME I ACTUALLY HAD.** Phase 1's set was written tool-less at the
base by an earlier spawn and was already sealed and hashed before this
lane's first commit; its hash matched the dispatcher's stamp. **The
brief is HAND-WRITTEN BY THE SEAT AND CARRIES NO CONTEXT PACK** — I say
so as the role requires, and I read `docs/CONVENTIONS.md` AT THE BASE by
the bullets I needed rather than end to end, plus STATE and the card at
the base and `method/roles/verifier.md` at the bench. The brief names
executor-derived specifics before the diff — the 612-of-810 / 16-of-39
figures, the 95 / 69 counts, the `--range` leg counts, the 794 s wall,
the 138098 bytes, the CAPABILITIES numbers — so **phase 1 was broken
above the line for my orientation and I report it rather than pretend
otherwise**. Every one of those I re-measured on this bench, and where I
did I say so; where a figure is the report's and I did not re-derive it,
I say that too. The two reports and the card's notes were opened ONLY
after my findings were written out
(`findings-T-280-fix.md` in this bench's scratch directory, written and
timestamped before the first report was opened).

**THE VERDICT IS APPROVED WITH TWO ASSIGNED CORRECTIONS.** The defect
the entry above rejected is FIXED — I re-forged it and it is refused —
and no new defect of that class survives. The two corrections are
properties the implementation HAS and no body PINS, both in the
narrowing direction, both killed by a one-line mutant that survived
every one of the lane's 69 `gate-run.spec.ts` bodies.

**(i) THE REJECTED REGRESSION, RE-FORGED — REFUSED, WITH THE BASE
CONTROL ACCEPTING THE SAME FORGERY.** On a `git clone --shared` at the
tip, on a branch with no upstream, so `pushRange` answers
`{"problem":"this branch names no upstream…"}` and the guard passes no
owed set — the fallback, and the guard's own comment calls this "THE
ORDINARY CASE ON A LANE":

| token | at the base `a1bb590` | at the tip `4d2d952` |
|---|---|---|
| four UNSCOPED `GREEN` legs (the control) | `token-green` | `token-green` |
| the same four, `e2e` carrying `scope` of 16 spec files | **`token-green`** | **`token-partial`** |
| the same four, `e2e` carrying `scope` of ONE spec file | `token-green` | `token-partial` |

The base ACCEPTS what the tip REFUSES, and both accept the unscoped
control — so the arming difference is the `scope` field and nothing
else (K1, run where the arming is absent). K2: `push-guard.mjs` at the
base exports no `pushRange` at all, so the arm really is new. The
refusal reads *"the verdict token's e2e entry graded 16 spec file(s)
rather than the whole leg, and no owed set could be derived for this
push"*.

**(ii) THE FIFTH CONDITION — `scopable.verdict === GREEN` — BUYS NO
HOLE, AND I READ IT CHARACTER BY CHARACTER.** Every verdict word other
than exactly `GREEN`, on an entry carrying a `scope`:

| word | fallback (no owed set) | derived path |
|---|---|---|
| `GREEN` | `token-partial` | `token-partial` |
| `SCOPED-GREEN` | `token-red` | `token-partial` |
| `green` | `token-red` | `token-partial` |
| `GREEN ` / ` GREEN` | `token-red` | `token-partial` |
| absent / `""` | `token-red` | `token-partial` |
| `REFUSED` | `token-unmeasured` | `token-partial` |

`GREEN` is a frozen `"GREEN"` and the comparison is `===`, byte-identical
to the base; the red/unmeasured partition at the end of `judgeToken` is
exhaustive over non-`GREEN`, so the ONE word the new check does not
cover is the one every other check already refuses. **The executor's
stated reason for the clause is TRUE and I measured it rather than
accepting it**: removing `scopable.verdict === GREEN` (a one-line
mutant, landing read from `git diff`) gives `gate-run.spec.ts`
**68 passed / 1 failed**, and the death is T-271's own body
*"the push guard refuses a scoped verdict as the token, so a lane's
subset run can never mint one"* at `gate-run.spec.ts:1412`. Safety is
identical either way; the clause keeps that body's naming. **That body
is GREEN at the tip** — `gate-run.spec.ts` alone reads 69 passed.

**(iii) THE SWEEP, RE-DERIVED BY ME RATHER THAN READ.** `judgeToken` has
exactly ONE production caller (`push-guard.mjs:3537`); `readToken` has
two (that call site, and `writeToken`'s merge); no file outside
`gate-token.mjs` and `gate-run.mjs` carries token logic. Every field
`judgeToken` reads and where: `suites[s]` presence (both paths — absent
members are `token-incomplete` on the fallback and folded into
`token-partial` on the derived path); `suites.e2e.scope` (**both paths
now**); `suites.e2e.verdict` (the new check); `entry.tree` (stale),
`entry.dirty` and `entry.treeAtWrite` (unkeyed), `entry.verdict`,
`exit`, `bodies`, `reason` (red / unmeasured) — every one of those in a
loop over `need`, asked identically on both paths. **The executor's "no
second instance" claim holds FOR FIELDS.** It does not hold one level
up, and that is worth stating: every check is quantified over `need`,
and `need` can be EMPTY — `T-280-s3` is exactly that case and I
re-measured it (below). `token.owed` is read by NO branch of the guard
(grep: 0 hits), and forging it to `[]` on a four-green token changes
nothing.

**(iv) THE CORRECTION BODY, RUN BY ME AT BOTH ENDS.** Not read from a
report:

| ref | what it is | `push-guard.spec.ts` alone |
|---|---|---|
| `62f4342` | `cc7905d`'s hooks + the body | **94 passed, 1 failed** |
| `4d2d952` | the fix | **95 passed, exit 0** |

The single failure at `62f4342` is the body itself, at the scoped-token
line, its control line (four UNSCOPED legs must still be allowed)
passing first. A mutant at the site — `owed === undefined` to
`owed !== undefined` in the new check's condition — reproduces it on the
fixed tree: 94 passed / 1 failed, and nothing else dies. **The body is
the lane's now and it is a discrimination, not a construction**: it
plants the same four suites twice, once without a `scope` and once with
one, and asserts the answers differ.

**CORRECTION 1 — the package roots' SEGMENT BOUNDARY is unpinned, and
losing it turns the whole battery into one leg.** `suiteOfPath` matches
`rel === dir || rel.startsWith(dir + "/")`, longest root wins. Replace
that with a bare `rel.startsWith(dir)` and **all 69 bodies still pass**.
The mutant is live in the narrowing direction:

| path | as shipped | with the boundary lost |
|---|---|---|
| `lib/parser2/x.ts` | unplaceable, owes the WHOLE battery | `parser`, `failClosed` none |
| `apples/x.ts` | unplaceable, WHOLE battery | `app` |
| `tools/e2e2/x.mjs` | unplaceable, WHOLE battery | `e2e` |
| `app/src-tauri-notes/x.md` | `app` | `rust` |

`deriveOwed({changed:["lib/parser2/x.ts"]})` moves from
`suites: [app,e2e,parser,rust]` with a `failClosed` reason to
`suites: ["parser"]` with none. The body above it
(*"a path is placed by the roots the derivation was GIVEN…"*) cannot see
this: every path it names is either a real child of a root or claimed by
no root at all.

**CORRECTION 2 — DELETIONS in the range's path set are unpinned, and
losing them owes NOTHING.** `rangeChanged` shells
`git diff --name-only <base> <tip> --`. Slip a `--diff-filter=d` in and
**all 69 bodies still pass**. Measured on a real fixture repo, a range
whose only change is a deleted task card:

    as shipped:  changed ["docs/tasks/T-280-s2-….md"]  suites [app, e2e, parser]  e2e over 5 specs
    mutated:     changed []                            suites []                  nothing owed

An empty path set is the largest narrowing this derivation can make, and
deletions are ordinary here — a card is deleted, a script retired. The
existing `rangeChanged` body exercises an ADDITION, the ancestry refusal
and the shell refusal, and never a removal.

**THE READINGS ON BOTH BODIES**, `tools/e2e/tests/gate-run.spec.ts`,
from `tools/e2e/`, `SUPERTASKR_E2E_PORT=25280`:

- **GREEN against the implementation carrying both properties** (the tip
  as submitted): **71 passed** — the lane's 69 and these two.
- **RED against an implementation lacking each** — the two mutants
  planted one at a time, each landing read from `git diff` at the site
  named: the boundary mutant gives **70 passed / 1 failed**, the failure
  being correction 1's body ALONE; the deletion mutant gives **70 passed
  / 1 failed**, the failure being correction 2's body ALONE. **Neither
  kill set contains the other** (2b), and each body carries a control
  run where its own arming is absent — a real child still placing, an
  addition still named — so neither is satisfied by a function that
  answers nothing.

The bodies are COMMITTED on this bench in the commit after this verdict.

```mutant
correction: the package roots' segment boundary
file: tools/e2e/scripts/gate-run.mjs
spec: tools/e2e/tests/gate-run.spec.ts
body: a directory whose NAME merely begins with a package root is not INSIDE it, so a sibling fails CLOSED to the whole battery instead of placing under its neighbour
message: a sibling of lib/parser is not inside lib/parser
--- old
if (rel !== dir && !rel.startsWith(`${dir}/`)) continue;
--- new
if (!rel.startsWith(dir)) continue;
```

```mutant
correction: deletions in the range's path set
file: tools/e2e/scripts/gate-run.mjs
spec: tools/e2e/tests/gate-run.spec.ts
body: a DELETED path is IN the range's path set, because a removal is a change and an empty path set owes nothing at all
message: a removal is a change, and the path set must carry it
--- old
"diff", "--name-only", base, tip, "--"
--- new
"diff", "--name-only", "--diff-filter=d", base, tip, "--"
```

Both `--- old` anchors match their file exactly once, and both `--- new`
texts are unique in the file after the swap (T-281-s9) — checked, not
assumed. Two corrections, two blocks.

**THREE THINGS I CONSIDERED REJECTING FOR AND DID NOT, with the
reasoning rather than the conclusion**, because the seat's standing rule
on this card is that "we could not tell" resolving to a smaller set is a
rejection and each of these is adjacent to it.

1. **The empty owed set** (already `T-280-s3`, filed by the verifier
   above; I re-measured it fresh). A push whose range moves no path is
   ALLOWED against a token recording every suite `RED`: `need` is empty
   and every loop is vacuous, answering `token-green` with the detail
   *"0 graded suite(s)…"*. The same token on the fallback path is
   `token-red`. **Phase 1 pre-committed against exactly this** (its
   L2-B: "what I will not accept is a token that says GREEN for nothing
   and a guard that agrees"). I do not reject, for two measured reasons:
   the guard derives its OWN range and never the runner's, so
   `--range HEAD..HEAD` fed to the runner buys an attacker nothing; and
   `rangeChanged` is a two-TREE diff (`git diff --name-only A B --`), so
   an empty path set means the pushed tree IS the upstream tree and the
   push publishes no content the remote did not already carry. The rule
   is sound and undocumented, which is what `T-280-s3` asks the seat to
   rule on. I second it.
2. **`pushRange` is `@{upstream}..HEAD` whatever the command says.**
   `git push origin HEAD:main` from a branch tracking a ref that is 63
   files ahead of `main` derives `suites [e2e, rust]`, e2e over 11 spec
   files. The guard already parses the destination (`pushTargetBranch`
   returns `{branch:"main"}`) and uses it only for the CI arm. I do not
   reject because the ordinary composition covers it — the upstream tip
   itself reached a remote through this guard — and the residual cases
   are unusual. Filed as **T-280-s5** with the measurement and the two
   places the composition breaks.
3. **`packageDependents`' `catch { continue }` conflates ENOENT with a
   manifest that will not parse.** With `app/package.json` malformed, the
   SAME range over a `lib/parser/` change moves from `["app","parser"]`
   to `["parser"]` — the cross-package edge this card's criteria name,
   gone, with `failClosed` empty. Phase 1's C3 meta-test pre-committed
   against a swallowed exception. I do not reject because the catch is
   REQUIRED for the normal case (`app/src-tauri` has no `package.json`
   at all — I checked) and because neither route to a broken manifest
   reaches a push: a tracked change to it is either IN the range, which
   owes `app` anyway (measured), or leaves the tree dirty, which
   `writeToken` records as `dirty: true` and `judgeToken` refuses as
   `token-unkeyed` (measured). Filed as **T-280-s6**.

**CRITERION BY CRITERION.**

1. **MET.** `--range` derives and grades exactly the owed set and writes
   the token with the set, the range and the inputs. Re-derived on real
   commits at this tip.
2. **MET.** One function, two callers, no copy: grep for
   `deriveOwed|suiteOfPath|PACKAGE_ROOTS|owningSpecs|specReach|packageDependents`
   over `push-guard.mjs` returns 0; the guard SPAWNS the runner at
   `OWED_SET_PATH`, and `OWED_SET_FLAGS` and `SCOPABLE_SUITE` are pinned
   to the runner's own constants by a body. `token-partial` is additive
   and names the missing suites AND the missing spec files (measured: one
   spec short of the owed set is refused and the missing name appears in
   the detail). **All seven reason codes that existed at the base survive
   byte-identical** — `token-green`, `token-incomplete`, `token-missing`,
   `token-red`, `token-stale`, `token-unkeyed`, `token-unmeasured` — and
   the guard's own `block(...)` codes diff IDENTICAL against the base.
   No test body was renamed or removed anywhere in the diff.
3. **MET.** Fail-closed holds in the runner and now at the guard's
   fallback on BOTH axes. Confirmed the whole battery on: a `Makefile`, a
   new top-level directory, a filename carrying a space and non-ASCII
   (git's own quoting makes it unparseable and it fails CLOSED), and the
   fallback's spec axis. The two unpinned narrowings above are the
   corrections, not a failure of this criterion.
4. **MET IN THE MECHANISM.** CONVENTIONS puts the bench's run and the
   integrator's on the owed set; `method/roles/verifier.md` was another
   lane's armed fence and the executor filed `T-280-s2` rather than
   breach it. I second the previous verdict's note to the seat that
   `T-280-s1` is a prerequisite for criterion 4's safety, and add that
   `T-280-s5`'s `@{upstream}` question lands on the integrator's push
   specifically.
5. **MET.** `PACKAGE_ROOTS` is `Object.fromEntries` over the registry's
   own `cwd`s — a body pins it, and moving one root's `cwd` in the
   registry (a DATA mutant, landing read from `git diff`) reds *"a path
   is placed by the roots the derivation was GIVEN"* alone: 68 passed /
   1 failed. The card's own DATA mutant is real and lands in DATA: one
   `import` statement removed and restored in a real fixture spec, the
   owed set moving `{whole:true,specs:[]}` to
   `{whole:false,specs:[owner.spec.ts]}`, with a second body doing the
   docs-read face. Both readings are asserted, so neither is a
   construction. No hand-listed set found.
6. **MET.** The bullet states the owed set, the derivation's three arms,
   the fail-closed case and that CI still runs the whole battery, in
   those words, and now states what "the whole battery" means on both
   axes. `ci.yml` and `workflow-parity.spec.ts` untouched. Bytes 133876
   at the base to **138100 at `4d2d952`** (138098 at `aceec12` — the
   report's figure, correct at its own ref; the notes commit re-wrapped
   one line) against an UNCHANGED warn of 146878, and `docs-scan.mjs` is
   byte-identical to the base, so no budget was raised to fit the prose.
7. **FIRST HALF MET BY NOT TOUCHING IT** — `health-bands.config.mjs`,
   `health-bands.mjs` and `health-bands.spec.ts` are untouched, so
   `suite/e2e-seconds` still reads the whole battery. **The checkpoint
   half is the SEAT'S act and is NOT faked into this diff**: no
   checkpoint file, no invented minutes — the only occurrences of the
   word are prose. Reported as owed to the seat.

**SECURITY SWEEP — NO FINDINGS.** Injection: `RANGE_RE` gates the string
before either endpoint reaches git, ancestry is checked BEFORE the diff
runs, and every git call is `spawnSync` with an argv array and a `--`
separator. I ran `HEAD; touch /tmp/pwn-T280`, `HEAD..$(id)`,
`--output=/tmp/pwn2-T280..HEAD`, `HEAD..HEAD;id`,
`main..HEAD --output=/tmp/x-T280` and `../foo..HEAD` — every one a JSON
`problem`, **0 files created**. No `import()`, `require()`, `eval` or
`execSync` of any repo-controlled path in any of the three changed
programs; the graph is a static text parse. `maxBuffer` is 32 MiB and an
overrun is a `problem`, so it lands on the whole battery. An untracked
planted file under another package root does not move the owed set. The
guard decides NOTHING from `token.owed`. `writeToken` builds a fresh
entry object per write, so a stale `scope` cannot survive an unscoped
re-run — I confirmed the whole-battery run at this tip wrote an `e2e`
entry with no `scope`. No secrets, no dependency additions.

**THE VOCABULARY QUESTION (phase 1's §6), ANSWERED FRESH.** Outcome (a),
one vocabulary, and the feared single-character relaxation did not
happen: `judgeToken`'s accepted string is still `entry.verdict === GREEN`
with `GREEN = "GREEN"`, and a `SCOPED-GREEN` entry is still `token-red`
at the tip. `REQUIRED_SUITES` survives in exactly the role phase 1
demanded, as the fail-closed fallback. The second axis phase 1 did not
anticipate — the `scope` field — is now read on both paths, which is
what the entry above was spent on.

**FENCE — CLEAN.** `git diff --name-only a1bb590..4d2d952` is
`gate-token.mjs`, `push-guard.mjs`, `CONVENTIONS.md`, `gate-run.mjs`,
`gate-run.spec.ts`, `push-guard.spec.ts` and `docs/tasks/` — nothing
else. `docs-scan.mjs` is in the fence and UNTOUCHED. None of `ci.yml`,
`workflow-parity.spec.ts`, `health-bands.*`, `dispatch-brief.mjs`,
`brief.spec.ts`, `agent_runner.rs`, `agent/mod.rs`, `executor.md`,
`verifier.md`, `lane-protocol.md`, `cli.mjs` or `cli.spec.ts` appears.
The method stamp inside the lane still reads `0.1.14`. The REJECTED
entry above is byte-identical to the sealed copy of it — the record was
not rewritten.

**THE REPORT'S CLAIMS, RE-DERIVED.** `push-guard.spec.ts` 95 and
`gate-run.spec.ts` 69 alone: CONFIRMED at my own tip. The four-line
form's 68/1 and the body it reds: CONFIRMED by planting the mutant
myself. The two false artefacts corrected in `push-guard.mjs` and
CONVENTIONS: read and correct. The 138098 bytes: correct at `aceec12`,
138100 at the tip. `docs/CAPABILITIES.md` STALE: the integrator's, per
the seat's ground rule — not a finding, and not re-measured. **The one
figure I did not re-derive is the report's 794 s wall at `aceec12`** —
that is a different ref under different contention and I do not repeat
it as measured. **The report says "Mutants run: 0" for this pass. I ran
six, and two of them survived** — which is the whole of what these two
corrections are.

**WHAT IS GOOD, SAID PLAINLY.** The fix is the right size for what was
owed: it hoists one read, changes no behaviour on the derived path, and
declines to grow past its verdict — and the executor filed `T-280-s4`
for the widening it did NOT do rather than doing it quietly, which is
the disclosure this method exists to produce. The fifth condition it
added beyond the verdict's candidate is a real improvement and it was
MEASURED in both directions before it was claimed. The derivation
underneath remains the strongest part of the lane and I attacked it
hard: package roots segment-safe with longest-match, the cross-package
edge READ from the manifests in the right direction, deletions placed,
injection closed at the character class, and an unparseable filename
failing closed. The two corrections are gaps in the BODIES, not in the
code.

**WHAT I RAN** (bench `../nputer-V-T-280`, detached at `4d2d952`;
`node_modules` and both `dist/` were already installed and built, so no
`npm ci` was needed this pass; `SUPERTASKR_E2E_PORT=25280` throughout,
and never 1420, 14520, 15280 or 25285):

| run | ref | exit | count |
|---|---|---|---|
| `gate-run.mjs parser` | `4d2d952` | 0 | 389 (1 target) |
| `gate-run.mjs app` | `4d2d952` | 0 | 1171 (1 target) |
| `gate-run.mjs rust` | `4d2d952` | 0 | 654 (18 targets) |
| `gate-run.mjs e2e` (WHOLE leg) | `4d2d952` | 0 | **811** (1 target) |
| whole battery wall | `4d2d952` | — | 15:10:42Z→15:24:51Z = **849 s** (e2e 804 s of it) |
| `gate-run.mjs --range a1bb590..4d2d952` | `4d2d952` | **0** | parser 389, app 1171, rust 654, e2e **613** with `scope=` naming 16 of 39 spec files |
| range-form wall | `4d2d952` | — | 15:40:13Z→15:52:24Z = **731 s** |
| `push-guard.spec.ts` alone | `4d2d952` | 0 | **95 passed** |
| `push-guard.spec.ts` alone | `62f4342` (pre-fix) | 1 | **94 passed, 1 failed** |
| `gate-run.spec.ts` alone | `4d2d952` | 0 | **69 passed** |
| `gate-run.spec.ts` + my two bodies | `4d2d952` | 0 | **71 passed** |

Both forms were run per the brief's rule (c): the four legs WHOLE (T-262)
and the lane's own range form over base..tip. **The e2e leg is 811 bodies
whole — the previous verdict measured 810 at `cc7905d`, and the +1 is the
correction body it committed.** My wall figures are not comparable to the
report's 794 s: this machine carried the integration checkout and other
benches throughout, and the direction is all I claim. **The range form's
own narrowing, measured at this tip: e2e 613 of 811 bodies over 16 of 39
spec files — 198 bodies and 23 spec files did not run**, and the other
three legs ran whole because the range owes them whole.

**SIX MUTANTS, EACH LANDING READ FROM `git diff` AT THE SITE I NAMED**
(the fix pass's own report says "Mutants run: 0"):

| mutant | site | result |
|---|---|---|
| the scope check drops `verdict === GREEN` | `gate-token.mjs` | DIED — `gate-run.spec.ts` 68/1, T-271's naming body |
| the scope check fires only when `owed !== undefined` | `gate-token.mjs` | DIED — `push-guard.spec.ts` 94/1, the correction body alone |
| the rust root's registry `cwd` moved (DATA) | `gate-run.mjs` | DIED — `gate-run.spec.ts` 68/1, the roots body alone |
| the fail-closed return hands back the PARTIAL set | `gate-run.mjs` | DIED — `gate-run.spec.ts` 68/1, the fail-closed body alone |
| `startsWith(dir)` — the segment boundary lost | `gate-run.mjs` | **SURVIVED all 69** → correction 1 |
| `--diff-filter=d` — deletions dropped | `gate-run.mjs` | **SURVIVED all 69** → correction 2 |

**ONE DISCLOSURE ABOUT MY OWN RUN.** The two cards I filed sat untracked
in `docs/tasks/` for roughly ninety seconds while the range form's e2e
leg was running, which could have moved a body that reads the live
board. I noticed and moved them out; the leg finished GREEN over all 613
bodies, so nothing was contaminated and no re-run was owed.

**RE-ENTRY.** Two corrections, two mutant blocks, both bodies committed
on this bench in the commit after this verdict, both RED and GREEN
recorded above. The seat has `T-280-s5` and `T-280-s6` from this pass and
`T-280-s1`…`s4` from the earlier ones; none of them blocks the merge.
