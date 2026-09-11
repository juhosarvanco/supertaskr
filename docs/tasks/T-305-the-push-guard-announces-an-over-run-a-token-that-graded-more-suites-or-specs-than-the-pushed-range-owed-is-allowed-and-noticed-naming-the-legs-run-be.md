---
id: T-305
title: The push guard announces an over-run — a token that graded more suites or specs than the pushed range owed is allowed and NOTICED, naming the legs run beyond the owed set, so a seat that still runs the whole battery by habit is told
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 3
status: verifying
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-294]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

On 2026-09-10 the seat ran four whole legs for ranges that owed two specs, four times, after T-280 had made the push owe its range; nothing said so.

## Acceptance criteria

- WHEN the guard judges a token whose graded set exceeds the range's owed set THE push SHALL be allowed and a notice SHALL name each suite or spec graded beyond the set with the minutes the owed set would have taken — seen on a planted token.

## Implementation notes

Built by claude-opus-5@subagent on branch task/T-305-the-over-run-notice,
base 3e791c58f6db8bb798057ebc126c2a222eb74022.

**Where it sits.** One arm inside the verdict-token arm of
`.claude/hooks/push-guard.mjs`, reached only where the token judged
FRESH and an owed set was derivable for the push's own range. It re-runs
nothing, derives no owed set of its own — the one `decideWith` already
asked the runner for is the one it reads — and returns no verdict. The
sentence rides in `notices`, which the runner writes to stderr before the
verdict and whatever the verdict is, so an over-run is still heard on a
push a later arm refuses.

**Two axes, because the owed set has two.** A SUITE the token records as
graded against HEAD's own tree that the range does not owe; and the one
scopable leg either run WHOLE where the range owed part of it, or run
with a scope carrying spec files the range does not owe. An entry with no
scope graded the whole leg, which is that field's meaning in
`.claude/hooks/gate-token.mjs`, so the whole-leg face is an absent field
rather than a list of names this arm cannot know.

**Three things are deliberately not an over-run**, each with its own body
and its own mutant on this bench:

- a leg graded against an EARLIER tree. `writeToken` merges entries
  across runs, so a leg graded before the last commit is still in the
  token, and minutes paid for a tree this push does not carry were not
  paid for this push. `judgeToken` cannot see it either way: it reads
  staleness only over the suites it requires, which is exactly why this
  arm asks for itself.
- a leg the runner DECLINED to grade. That verdict word means no
  toolchain, zero bodies, or a count that would not sum, and a leg that
  did not run cost nobody a minute. The word is pinned against the
  runner's own `judge` rather than against a literal here.
- a push where the owed set could not be derived at all. There is no set
  to exceed, and the fallback is already the whole battery.

**The minutes are a TABLE and the notice says so.** Both figures are
docs/CONVENTIONS.md's own, in the bullet that publishes the blessed
gate-runner: the browser leg at ten of the battery's eleven minutes,
measured on T-224's fix passes, and the other three legs at seconds each.
So the browser leg is 600 seconds, the battery is 660, and the residual
60 is split three ways; the per-spec figure for a narrowed leg is 600
over the 40 spec files tracked at the base ref, which is 15 seconds each.
A body reads both sentences out of the document and checks the table
against them, so a re-measurement landing there reds a body here by name.
No figure in it was measured by this lane, and the reason is on the
constant: THE TOKEN CARRIES NO DURATION AT ALL — a suite entry records
the moment it was written and never how long its suite took — so there is
no reading of the actual run for this arm to prefer, and every sentence
it prints says about. T-305-s1 is the card for closing that.

**Declared limits.** A push refused for another reason prints the refusal
and not this notice, which is deliberate: the refusal is the news. A leg
whose figure this table does not carry is listed as unpriced and the
estimate is called a floor rather than silently counted as nothing. A
long list of spec files is counted first and sampled second, capped, so a
truncated list can never read as the whole one.

**What the merge owes.** The behaviour census gains 5 sentences, so the
merge commit owes `npm run capabilities` — the standing rule for a lane
that adds test bodies. Nothing under method/ moved and no rule text was
reworded.

**One new import edge, declared.** tools/e2e/tests/push-guard.spec.ts now
imports the runner at tools/e2e/scripts/gate-run.mjs, for one function:
the judge that writes the verdict word this arm filters on. A change to
the runner therefore owes this spec from now on, which is the honest
reading of a body that asserts against the runner's behaviour.

## Verdicts

### 2026-09-11 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tier **guarded**, two spawns, bench `../supertaskr-V-T-305` detached at
**adaace727bed7daa65638630df86ba856d63f939**, base
**3e791c58f6db8bb798057ebc126c2a222eb74022**.

**The sealed inputs, hashed and verified as my first action.**

| input | sha256 |
|---|---|
| the attack set, written blind by phase 1 | `dfbb0f79896fcd06f381060c09aabf0b615f5c3f73589d509c16eab16ef74008` |
| the ground, taken at the base, with the seat's addendum | `7168fd9d2e0644c8c0a3e30a54e22c6e00f19d5b3205d60dba5a9a0accff00d4` |
| the card at the base | `6e1415426e19f62df9a52d73272f6d03d46f97737fe6e61f710237e44c618c32` |

All three matched the stamps file before anything else was opened.

**THE FRAME I ACTUALLY HAD.** A genuine two-spawn bench: phase 1 held no
tools and wrote its set against the card at the base; I am a fresh spawn
that read the diff and the tree, and opened the executor's report, the
card's `## Implementation notes` and the two filed cards' bodies only
after my findings were written. **ONE LEAK TO DECLARE, AND IT IS MINE
RATHER THAN PHASE 1's**: my own phase-2 brief told me, before I opened
the diff, that the notice's minutes come from the document's published
figures rather than from a measurement. That is an executor-derived
specific in a duties section and I say so rather than pretend I did not
read it. It cost phase 1 nothing — the set is hashed and its D1–D4 show
no knowledge of the design — and I re-read both sentences out of
docs/CONVENTIONS.md at the base myself rather than taking the brief's
word for them. No ask file exists for this lane and none was owed.

#### The criterion, row by row

There is one acceptance criterion and it is a compound. Phase 1 split it
into six obligations before the work existed; each is a row, with the
reading that decided it.

| # | obligation | verdict | the evidence |
|---|---|---|---|
| a | the push SHALL be **allowed** | MET | `push-guard.spec.ts:4257` drives the WIRED hook and pins `status === 0`, not merely "not blocked". Re-measured by me on a `--shared` clone with a real range: `verdict=allow code=graph-current`. The always-on mutant below shows the assertion is not vacuous. |
| b | a **notice** SHALL be emitted | MET | It rides in `decide`'s `notices`, which `push-guard-hook.mjs` writes to stderr BEFORE the verdict and independently of it. Measured: with the graph check shimmed STALE the decision is `block/graph-stale` and the over-run notice is still in `notices`. |
| c | it SHALL name **each SUITE** beyond the set | MET | The body asserts the rendered list exactly — `whole leg(s) this range does not owe: app, e2e, rust` — three extras, not one, so phase 1's pre-commitment 3 is satisfied. Above six names the sentence counts first and samples second ("… x0, x1, x2, x3, x4, x5 and 3 more"), and a body pins both halves. |
| d | it SHALL name **each SPEC** beyond the set | MET | Both faces: the leg run WHOLE where the range owed part of it, named as the whole leg because an absent `scope` is that field's own meaning one file over; and a scope carrying files the range does not owe, named individually, with the owed file asserted ABSENT from the beyond-list. |
| e | **with the minutes the owed set would have taken** | MET ON ONE SHAPE OF THREE, and the other two are the corrections | `THIS RANGE OWES parser, about 0.3 minute(s)` against `about 10.7 minute(s)` for the over-run — two typed literals that cannot stand in for each other, over a table pinned to docs/CONVENTIONS.md's own two sentences, which are outside this fence and unchanged. The notice has two further shapes whose arithmetic nothing reads back; see CORRECTION 1 and CORRECTION 2. |
| f | **seen on a planted token** | MET | Every body plants one; three of the five go through `decide` on a real git fixture with a real upstream and the runner's own derivation. I repeated it independently on a clone of this bench. |

**AND THE PURPOSE, WHICH IS THE TITLE'S OTHER HALF — *allowed and
NOTICED*.** The opener is "THIS PUSH GRADED MORE THAN ITS RANGE OWED. The
push is ALLOWED and this is a NOTICE"; every refusal in the file opens
"PUSH REFUSED:". The distinction is asserted as a verdict and as an exit
code rather than as prose, and the notice closes with the exact command
that would have run the narrow set. A seat is told what to do, not only
what it did.

#### The attack set, run

The fence is exactly `.claude/hooks/push-guard.mjs`,
`tools/e2e/tests/push-guard.spec.ts` and three cards under `docs/tasks/`,
and nothing else.

- **A1–A4** closed; the allow is pinned at the guard's own exit code
  through the wired runner, not at "the push was not blocked".
- **B1 — phase 1's headline prediction, and it is ABSENT.** No parallel
  owed-set derivation was grown: `decideWith` hands the arm the set it
  already asked the runner for, and the bodies re-ask `runOwedSet` and
  assert the derived set before using it. The `T-203`-class defect phase
  1 expected here is not present, and finding neither that nor C3 is
  itself the result I pre-committed to reporting.
- **B2, B3** closed. Measured: owed `app, parser` with `parser, rust,
  e2e, zzz` graded and `app` MISSING gives `{suites:["e2e","rust","zzz"]}`
  — a set difference, never a length comparison — and the under-run half
  is still `judgeToken`'s `token-partial` refusal, byte-identical
  (gate-token.mjs is outside the fence) and still green in my run.
- **B4** closed and pinned: an empty owed set gets its own sentence.
- **B5 — handled, and untested.** Ten malformed token shapes driven
  directly: `suites` undefined / null / a string / an array; an entry
  null / a string / a number; `scope` a number / an array; `verdict`
  absent. None throws. No body exercises any of them; reachable only for
  a suite OUTSIDE the owed set, since `judgeToken` never inspects those.
  Recorded, not assigned — see the filed cards.
- **B5b — not reachable.** `overRunNotice` throws on an owed set missing
  `e2e` or `suites`, but `runOwedSet` validates the runner's answer
  completely and returns a `problem` otherwise; and the base already
  dereferences `owed.e2e` unconditionally in T-280's own refusal line.
  The diff widens nothing.
- **B6 — not reachable through the runner.** The spec comparison is raw
  string equality and I confirmed it invents a false over-run for
  `./tools/e2e/tests/a.spec.ts` against `tools/e2e/tests/a.spec.ts` — but
  the token's `scope` is written by `gate-run.mjs` as the owed set's own
  `specs` joined, so one producer spells both sides. Only a hand-written
  token separates them, and a hand-written token can mint a plain green
  outright.
- **C1, C2, C4, C5** closed; **C3, the attack phase 1 called the highest
  value in the set, is the one the shipped suite answers most directly**
  — the body reads `wired.stderr` off a spawned hook rather than the
  decision object. The residual is `ANNOUNCED_ALLOW_CODES`'s own limit,
  stated at the BASE in as many words: a passing PreToolUse hook's stderr
  is surfaced at the harness's discretion. It is shared with T-203's,
  T-212's and T-237's notices, and choosing another channel would have
  been a whole-file change outside this fence. T-305-s2, filed by the
  lane, is the card for saying it earlier.
- **D1–D4**: see the corrections. **D2 is closed**, and closed the way
  phase 1 demanded: the expected minutes are typed into the bodies, not
  computed by the production path, and the constants are pinned against
  a document outside the fence.
- **D3** closed and disclosed in the notice itself — there is no per-suite
  duration anywhere at the base, the arm says "THE FIGURES ARE A TABLE
  AND NOT A STOPWATCH", an unpriceable leg is returned as `unpriced` and
  the figure announced as a FLOOR rather than silently counted as zero.
  A 20-second owed set prints `about 0.3 minute(s)`, never 0.

#### The security sweep (step 3, mandatory) — no rejection

- **Injection: the notice renders token-derived names RAW.** Measured: a
  suite id carrying an escape sequence, a carriage return and a newline
  reaches the seat's stderr verbatim, and I planted a forged approval
  line and saw it on a line of its own. The same holds for a spec path
  inside `scope`. **I am not rejecting on it, for three reasons I would
  want a later reader to be able to check.** The base ALREADY renders
  derived spec paths and token verdict words raw into `token-partial`,
  `token-red` and T-280's owed line, so this is not a new class. The
  token's only writer is the runner, whose suite ids come from a frozen
  registry and whose scope comes from the repository's own file names.
  And anyone who can write the token can mint a plain green and skip
  every arm of this guard, which is strictly more powerful than forging
  a line in a notice — so the finding is about the FILE and not about
  this card, and it is filed as one.
- **No shell, no process, no interpolation.** `gradedSpecs`,
  `legSeconds`, `owedCost`, `overRun`, `sample`, `aboutMinutes` and
  `overRunNotice` are pure functions over already-parsed data.
- **Bounded work, and one list that is not.** The suite difference is a
  `Set`; the spec difference is bounded by the repository's spec count.
  The two NAME lists stop at `OVER_RUN_NAME_LIMIT` with a count. The
  `unpriced` lists do not — forty unpriceable legs are all forty spelled
  out, with no count, in a file whose own constant says "THE COUNT IS THE
  TRUTH AND THE NAMES ARE THE SAMPLE". Bounded in practice by the graded
  registry; filed, not assigned.
- **No dependency added, no secret, no new endpoint.** `package.json` is
  untouched in the whole diff; the one new module import is
  `SCOPABLE_SUITE` from a sibling hook already imported from.

#### Adjacent features, and the reflexive case

T-280's under-run refusal is intact and its base body passes. Nothing
under `method/` moved and no pinned sentence was reworded; the stamp
0.1.22 is unmoved. **The reflexive half is worth its own line, because
this card's subject grades the pusher's own range and a verifier's
commits move that range.** I did not settle for the fixtures: I cloned
this bench with `git clone --shared` under the scratch stem, committed one
real file under a package root, armed a real upstream, and drove `decide`
with only the graph check, the cheap checks and `gh` shimmed — so the
runner's own derivation ran over a real tree. Exactly the owed set gives
an allow and silence; four whole legs give an allow and "2 whole leg(s)
this range does not owe: e2e, rust", "THIS RANGE OWES app, parser, about
0.7 minute(s)", "about 10.3 minute(s)"; a REFUSED leg beyond the set is
not named. Nothing threw. The guard does not brick a push.

**One factual error in the record, recorded here rather than rewritten.**
The card's `## Implementation notes`, under "Declared limits", says "A
push refused for another reason prints the refusal and not this notice".
That is true only for a refusal by the token arm itself. Measured above:
with the graph check STALE the decision is `block` and the over-run
notice is still carried, which is what the module's own header says
("an over-run is still heard on a push the graph then refuses") and what
the runner does — notices are written before the verdict, whatever the
verdict is. The module's header is the accurate one. Records are not
rewritten on this project, so the correction stands here beside the
sentence rather than over it.

#### THE TWO CORRECTIONS

Both are the criterion's own second clause — the minutes — on the two
shapes of the notice that nothing reads back. Each is argued in the arm's
own prose, each moves the printed figure by an order of magnitude when it
is wrong, and **each survived the whole shipped spec on this bench: 100
passed under either mutant, measured before I wrote a line.**

**CORRECTION 1 — the whole-leg over-run's minutes.** When the range owes
the browser leg in PART and the token records it run WHOLE — the card's
own measured shape, four whole legs for a range owing two specs — the arm
charges `whole.seconds - wasOwed.seconds`. That is the one subtraction in
the arm and the one place a sign error lives, and the shipped body for
that shape asserts the SENTENCE and no figure at all. A guard charging
the leg entire, or charging nothing, passes it.

**CORRECTION 2 — a leg beyond the set that ran NARROWED is priced by the
scope it records.** The arm's header argues it in as many words: "A
SCOPED ENTRY IS PRICED BY ITS SCOPE, never by the whole leg … pricing
that at ten minutes would tell a seat it spent time it did not spend."
It is reachable: run `--range A..B` where the derivation scoped the
browser leg, then push a range that does not owe that leg at all, and the
entry is a whole leg beyond the set priced by its own scope. I measured
both answers on the clone — 0.8 minutes with the scope read, 10.3
without. No body reaches `gradedSpecs` inside the suite-axis loop.

**The two bodies are committed on this bench after this verdict**, in
`tools/e2e/tests/push-guard.spec.ts`, and both readings were taken:

| body | against the tip | against the mutant |
|---|---|---|
| the whole browser leg's over-run minutes are the leg LESS the subset the range owed, and the owed figure is that subset's own | GREEN | RED |
| a leg beyond the owed set that ran NARROWED is priced by the scope it records, never by the leg it did not run | GREEN | RED |

**KILL-SET CONTAINMENT, NOT THE COUNT** (verifier.md 2b). Each mutant
was applied by an exact one-anchor swap, its landing read off `git diff
-U0` and never off the mutator's word, and the file restored and proved
by sha256 (`8c61c6f9c259fac2950d700495a67e2cc4eb760300f87b735eaafca39d18709c`)
between every pass. Mutant A kills the first body ALONE; mutant B kills
the second ALONE; neither kill set contains the other, and each landed at
the site the property lives — the two arithmetic lines inside `overRun`.

```mutant
correction: the whole browser leg's over-run minutes are the leg LESS the subset the range owed
file: .claude/hooks/push-guard.mjs
spec: tools/e2e/tests/push-guard.spec.ts
body: the whole browser leg's over-run minutes are the leg LESS the subset the range owed, and the owed figure is that subset's own
message: Those legs are about 9.8 minute(s)
--- old
seconds += whole.seconds - wasOwed.seconds;
--- new
seconds += whole.seconds;
```

```mutant
correction: a leg beyond the owed set that ran NARROWED is priced by its scope
file: .claude/hooks/push-guard.mjs
spec: tools/e2e/tests/push-guard.spec.ts
body: a leg beyond the owed set that ran NARROWED is priced by the scope it records, never by the leg it did not run
message: Those legs are about 0.5 minute(s)
--- old
const priced = legSeconds(id, gradedSpecs(entry));
--- new
const priced = legSeconds(id, undefined);
```

Two corrections, two blocks; nothing is short.

#### THE CONTROLS I PROPOSED ARE CONTROLS — the demonstration, not the claim

Phase 1 pre-committed to two things about its OWN suggestions, and
verifier.md step 0 says a control I propose is mine to check. Both were
run where the arrangement that would decide them is ABSENT.

- **The negative control (pre-commitment 1, attack C5): CAN IT FAIL? YES,
  DEMONSTRATED.** I made the arm notice on every push — `overRun`'s
  "nothing to say" return made unreachable — and ran the T-305 bodies.
  Four reds, and they are the right four: both silence controls (the
  suite axis's "a run that stayed inside the set is SILENT" and the spec
  axis's "the owed specs exactly: SILENT"), the two-negatives body, and
  the FLOOR body's own control. My two correction bodies survive it,
  correctly — they plant over-runs and assert figures. The suite's
  silence controls are real controls.
- **The minutes body (pre-commitment 2, attacks D1/D2): IS THE FIGURE
  READ, OR IS IT A CONSTANT? A DATA MUTANT SETTLES IT** (2b, `T-221`).
  I halved the browser leg in `LEG_SECONDS` — 600 to 300 — touching no
  code. Four reds: the shipped suite-axis minutes body, the cost-table
  body, and both of my correction bodies. The number MOVES when the
  planted datum moves, so the fixtures are reading the table rather than
  agreeing with themselves, and my own proposals are not the `T-210`
  defect I was watching for in the diff.

#### The suites, at the tip under judgement

The whole battery through the blessed runner from the bench root at
**adaace72**, each leg's COUNT read beside its exit:

| leg | exit | bodies | verdict |
|---|---|---|---|
| parser | 0 | 389 | GREEN |
| app | 0 | 1171 | GREEN |
| rust | 0 | 655 (18 targets) | GREEN |
| e2e | 0 | 941 | GREEN |

`push-guard.spec.ts` alone: **100 passed**, 1.7 min — 95 at the base plus
the five new bodies, which is exactly the e2e leg's growth from the 936
the ground records at the nearest whole battery. No named intermittent
fired: the minute-boundary body (T-294-s6) and the Rust grace body were
green first time and needed no re-run. Every figure above is at
adaace72; the figures in the executor's report were taken at f6647bae and
I re-measured rather than relayed them — they agree.

#### Improvement ideas, filed rather than folded

**T-305-s3**, **T-305-s4** and **T-305-s5**, all `suggested`. They are
not failures and nothing here blocks on them.

#### Verdict

**APPROVED WITH ASSIGNED CORRECTIONS.** The criterion is met on every
obligation, the security sweep found no rejection-level defect, no
adjacent feature moved, and the one arm phase 1 most expected to be
defective — a second owed-set derivation deciding both the subject and
its own fixture — was not grown. The two corrections are the minutes
clause on the two notice shapes the drill did not reach; their bodies are
committed on this bench and their mutants are above.

## Meters

- **wall clock by phase** (Mac.lan, 2026-09-11, local): seals and the
  standing read 07:24–07:33; the diff and the tree 07:33–07:46; direct
  attacks and the reflexive clone 07:46–08:00; the whole battery
  07:36–08:20 detached, of which the browser leg alone was ~46 min on a
  cold worktree; the fenced spec alone 08:20–08:22; the drills
  08:22–08:52 (nine full or targeted spec runs); report, notes and cards
  read 08:52–09:00; verdict, cards and step 7 09:00 on. **About 105
  minutes of wall clock**, most of it the detached battery.
- **context consumed**: about 240,000 tokens of a 15,000,000 budget.
- **model**: claude-opus-5@subagent, one seat, set at start, never
  switched; effort unchanged.
- **suites run**: the whole battery once at adaace72 (parser, app, rust,
  e2e), plus `push-guard.spec.ts` alone six times whole and five times
  targeted.
- **bodies graded**: 3156 in the battery (389 + 1171 + 655 + 941); 100 in
  the scoped spec at the tip, 102 with the corrections.
- **mutants drilled**: 4 — two correction mutants (each run twice, once
  against the shipped suite to prove the property unpinned and once
  against my bodies to prove them RED), one DATA mutant on the cost
  table, one always-on mutant against my own negative controls. Each
  landing read off `git diff`, each restore proved by sha256.
