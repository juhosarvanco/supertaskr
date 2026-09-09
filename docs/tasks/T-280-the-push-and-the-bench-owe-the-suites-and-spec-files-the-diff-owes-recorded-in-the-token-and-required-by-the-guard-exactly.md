---
id: T-280
title: The push and the bench owe the suites and the spec files the DIFF owes — derived from the docs gate's reader map and the specs' import graph, recorded in the verdict token, required by the push guard exactly — instead of the four-suite battery on every push
feature: F-06
milestone: 4
size: M
priority: 2
status: verifying
suggested_by: "@human (2026-09-09): \"Yes, file both\" — ruling decision 2 of the seat's review of the outside review (docs/research/the-model-for-an-outside-review-2026-09-09.md); supersedes T-271's second criterion (amended by @human earlier the same day to keep the verifier and the integrator on four legs) by this later ruling"
blocked_by: [T-271]
touches: [tools/e2e/scripts/gate-run.mjs, .claude/hooks/gate-token.mjs, .claude/hooks/push-guard.mjs, tools/e2e/scripts/docs-scan.mjs, tools/e2e/tests/gate-run.spec.ts, tools/e2e/tests/push-guard.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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
