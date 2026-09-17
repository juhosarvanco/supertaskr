---
id: T-295-s8
title: "The counts gate compares the drill's scoped spec count with the verdict's suite count and refuses a merge on a count that never moved — at T-297's merge it read 35 (the owning spec, run by the drill) against the verdict's 714 (the owed set's e2e leg) and called it THE COUNT MOVED"
feature: F-04
milestone: 4
size: S
tier: guarded
priority: 2
status: verifying
suggested_by: "the seat (2026-09-11): the second merge through the verb stopped at `counts` with e2e 35 versus 714; the 35 was health-bands.spec.ts run alone by the re-drill, the 714 the verifier's owed range at the tip — two different measurements of two different things"
blocked_by: []
touches: [tools/e2e/scripts/merge.mjs, tools/e2e/tests/merge.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The verb's counts step takes "the counts this merge's own runs read" from whatever ran during the merge — at T-297 only the re-drill's scoped runs of the owning spec — and compares them to the counts the verdict claims for each leg. The verdict claimed the owed range's e2e count at the tip; the merge's own run had counted one spec. The step reported THE COUNT MOVED and stopped the merge, and the seat ruled it through by hand after reading both figures. T-295-s3 already says the guard can seldom judge; this is the case where it judges wrongly, which is worse than not judging.

## Acceptance criteria

- WHEN the merge's own runs produced a count over a DIFFERENT scope than the verdict's claim (a spec alone against a leg, or a range against the whole) THE counts step SHALL say the scopes differ and grade nothing, never call the count moved; WHEN the scopes are the same THE comparison SHALL stand as it is.
- WHEN a body in merge.spec.ts plants a verdict claiming a leg's count beside a drill that ran one spec THE step SHALL pass with the scope difference named.

## Amendment of 2026-09-13 — count-scope evidence (proposed by the Codex orchestrator's queue review of 2026-09-13, approved by the owner on 2026-09-13)

Amendment proposed 2026-09-13 — count-scope evidence. The step distinguishes established same scope, established different scope and unknown scope. Scope is derived from the available execution selection and the verdict's stated measurement context, never inferred from the numeric count or a shared leg name alone. Established same-scope measurements keep the existing comparison and its refusal on a changed count; established different scopes are reported and not compared. Missing or unresolved scope is reported as not judged for lack of scope evidence, never as a demonstrated scope difference or a passed comparison. Bodies cover a same-scope mismatch, equal counts from different selected sets and missing scope evidence, in addition to the scoped-drill case. A count comparison that is not judged does not erase a failed required test or another merge refusal.

## Implementation notes
<!-- executor appends before finishing -->

Built at `9a20d94` on `task/T-295-s8-drill-scope`, cut from
`634be2de`.

**WHAT A COUNT IS NOW CARRIED WITH.** A count alone says nothing about
what it counted, so `merge.mjs` records a `CountScope` beside every
count it holds and beside every count it reads out of a verdict —
`MergeState` gains `observedScope` and `claimedScope`. A scope is
`whole`, `selection` or `unknown`, and it is read off the EXECUTION
SELECTION on its own side, never off the number: `runSelection` takes
the narrowing tokens out of an argv, `scopeOfRun` wraps one run's
command and argv, `scopeOfSpecs` takes the re-drill's own spec list, and
`joinScopes` unions two runs under one leg. On the verdict's side
`claimedScopes` reads the runner invocation the verdict STATES in
backticks beside its counts, inside the same paragraph and before the
count — the same kind of evidence, an execution selection, rather than
an adjective. A verdict that states no command states no scope, and the
reader invents none.

**THREE ANSWERS WHERE THERE WERE TWO.** `scopeVerdict` answers `same`,
`different` or `unknown`, and `gradeCounts` branches on it. An
established same scope compares exactly as it did and still refuses on a
count that moved. An established difference is reported with both
selections and graded nothing. A scope that could not be read is
reported as NOT JUDGED FOR LACK OF SCOPE EVIDENCE, with both figures
stated so the seat can rule — never as a demonstrated difference, never
as a pass. `countsStep` is exported so a body can read the step's own
exit, and it still refuses on findings alone, so a leg nobody could
judge erases nothing beside it.

**THE COMPARISON IS OVER SELECTIONS, AND THE STEP SAYS SO.** Two
selections that are not equal as sets are called different; the step
prints both rather than claiming they cover different bodies, because
two spellings can resolve to one set. A path-like token is compared on
its last segment, because the two sides spell one spec from different
roots — the drill's runner writes it from the package and a verdict
writes it from the repository root — and a spec basename is unique
across the board that the capabilities census keys on.

**WHAT A WEAKENED VERSION WOULD LET THROUGH, said because this file is
guard class.** The teeth of this guard are `2d6d354`'s: a merge that
commits while the count under it has moved. Those teeth now depend on
scope evidence existing on BOTH sides. A derivation that wrongly called
two same-scope runs different, or a verdict shape that stated no runner
invocation, would leave a real count move unjudged — loud, printed, and
not refused. Two things hold that line. The selection reader fails
CLOSED toward `selection`: a flag it does not recognise is read as a
narrowing, so an unknown run looks narrower than it is and loses a
comparison rather than gaining a false one; it never widens a run into
`whole`. And an unjudged leg is never written into `judged` and never
silences the step's own summary line. What is genuinely given up is
stated rather than hidden: a verdict that names no command is a verdict
whose counts this step will not grade. That is T-295-s3's half of the
work — counts stated in a field rather than in prose — and it is parked
behind T-262.

**HOW FAR THE GUARD REACHES NOW, measured rather than asserted.** Over
`docs/tasks/` at this lane's tip, 112 cards carry a newest verdict, 58
of them claim at least one leg count, and those carry 148 leg claims in
all — of which 39 state a runner invocation beside the count and so
resolve to a scope. The rest would read NOT JUDGED FOR LACK OF SCOPE
EVIDENCE. That reads worse than it is: T-295-s3 already measured that
the merge's own runs produce a count for at most one leg, and those runs
are the re-drill and the dogfood bodies — narrow by construction, which
is the false-comparison case itself. The judgements this removes are
overwhelmingly the wrong ones. The judgements it does not yet gain are
T-295-s3's to deliver.

**THE OWED SET AT THIS TIP** was e2e alone, over eight owning spec
files, derived by `gate-run.mjs --owed-set --range`. The scoped reading
`gate-run.mjs e2e --owning` read 712 passed and 3 failed over 715
bodies. The three are INHERITED, not caused here: the same three bodies
of `push-guard.spec.ts` fail identically with this lane's two files
restored to their `634be2de` content (3 failed, 120 passed), and the
cause is mechanical. The lane fence leaves every out-of-fence tracked
file at mode 444; `seatFixture` copies every flat `docs/*.md` into its
temporary tree, which clones that mode onto the destination, and then
copies the conventions chapter set over it — and the index file is in
both walks, so the second copy of `docs/CONVENTIONS.md` is EACCES.
Reproduced directly: one `copyFileSync` of that file succeeds and
leaves a 444 destination, the next raises EACCES. So those bodies cannot
pass inside ANY fenced lane whose fence excludes `docs/`, and they are
outside this card's fence. Filed as a suggestion rather than fixed here.

**THE GATES, derived from this diff.** GRAPH REGEN fires — a `.ts` moved
outside `docs/` — and the gate itself answers CURRENT at exit 0, so
nothing is owed. BOOT GATE is not owed: nothing under `app/src-tauri`,
`app/src` or either manifest moved. METHOD EVAL GATE is not owed:
nothing under `method/` moved and no citation-grammar line was added.
DOCS GATE fires on this card. The census regeneration this lane's three
new spec names owe belongs to the merge, which plans it.

## Verdicts

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 2 — the counts gate compares a scoped drill count with a whole-suite count and refuses a merge on a number that never moved. Not dispatched by this sitting.

### 2026-09-17 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent

Graded at `b706b323` over `634be2de..b706b323`, on a detached bench, bench
port 25295. Both phase-one pre-commitments verified by hash before the diff
was opened: the attack set at `54ed6e43a41c60220c784779bf93cc25d5e6f6295e88994ec3509f46ad7485f5`
(36083 bytes) and the grounds at `69f3f59212d323feebfb15ac7b6c385a14ecf458b82d67156c5a2f48dc66103a`
(11734 bytes), the latter including the appended correction to its own M3.

**WHAT I RAN.** `lib/parser` and `app` installed and built on this bench
first — the lane's `playwright.config.ts` preflight refuses outright without
`app/node_modules`, so a run before that graded nothing. Then
`tests/merge.spec.ts` whole (**52 passed, 0 failed** with my correction
applied; **51 passed, 0 failed** at the lane's tip), `tests/push-guard.spec.ts`
whole (**123 passed, 0 failed**), eight mutant drills, and the whole board
driven through the lane's own readers.

**THE THREE EXPECTED REDS ARE NOT THIS DIFF'S, AND I DID NOT TAKE THAT ON
ATTRIBUTION.** `push-guard.spec.ts` gives 123 passed / 0 failed here. The
lane reported 120 passed / 3 failed inside its fence, and 120 + 3 = 123. On
this bench `docs/CONVENTIONS.md` is mode 644; inside a fenced lane it is 444
and `seatFixture`'s second `copyFileSync` of it raises EACCES. The reds are
the fence's, reproduced by differential observation rather than accepted.

#### The corpus, re-measured because phase one withdrew its own M3

The lane's four figures reproduce **exactly** at this tip: 112 cards carry a
newest verdict, 58 claim at least one leg count, those carry 148 leg claims,
and 39 resolve to a scope. Phase one was right to withdraw "N_stating is
ZERO" — the text does carry context even though the old grammar could not see
it.

**But resolving is not agreeing, and that distinction decides X1.** I crossed
all 148 real leg claims against every observed scope the verb can actually
produce — the plan holds exactly two suite steps (`dogfood`, running
`architecture-dogfood.test.ts` and its siblings; `bump:pin`, running
`cargo test -q --lib -- agent::kit::tests`) plus the re-drill's own spec list:

    592 real pairings   ->   436 unknown, 156 different, 0 same

**Zero.** No plan step produces a `whole` observed scope, and not one of the
39 resolved claims carries a spec basename — the only shape `scopeOfSpecs`
emits. The same-scope branch that holds this guard's teeth is not merely
dormant in production; at this tip it is **unreachable from every verdict on
the board crossed with every run the verb performs**. The lane's notes
disclose the direction honestly but state the reach as 39 of 148; the honest
figure for gradeable claims is 0 of 148. That is the single most important
thing this verdict records, and it is why X1 is graded below as answered-and-
adverse rather than unanswered.

#### Row-by-row against phase one's attack set

| id | verdict | what decided it |
|----|---------|-----------------|
| **C1-A** universal-differ relaxation | **HELD as a derivation** | `selectionToken` reduces a path to its last segment on BOTH sides, so the drill's `tests/x.spec.ts` and a verdict's `tools/e2e/tests/x.spec.ts` meet in one vocabulary. The two sides can be equal in principle and are equal for `whole`/`whole`. The gate's emptiness is the input distribution (C1b-B), not a rigged derivation. |
| **C1-B** normalisation with a fixture-shaped exception | **HELD** | Drove seven spellings of the planted spec — basename, repo-root path, package-root path, absolute path, a rename to `foo.spec.ts`, a `--grep` selection, a `--project` filter. All seven give `different`; the first four normalise to one token. No special case. |
| **C1-C** "grade nothing" as "grade pass" | **HELD** | `judged` discriminates: a same-scope equal pair gives judged 1 / unjudged 0; a differ pair gives judged 0 / unjudged 1, and the step's own "no leg was judged" sentence fires. Not identical tokens. |
| **C1-D** check moved to the reporting layer | **HELD** | `countsStep` returns `EXIT.CLEAN` and writes nothing to `err` in the differ case. Asserted on the exit, not the string. |
| **C1-E** scope inferred from the numbers | **HELD** | No count value is read anywhere on the scope path. `claimedScopes` uses the count regex's `hit.index` — a position — and never `hit[1]`. Both discriminating plants behave: same scope with a large legitimate movement (714 vs 35) **still refuses**; different scope with identical counts (35 vs 35) **still says differ**. |
| **C1-F** fixture and reader share a source | **HELD** | The merge-side scope originates in `step.run` at the suite site and `e.specs` at the drill site — the run that produced the count. It never reads the verdict. |
| **C1b-A** a branch only a fixture can reach | **FIRES** | The same-scope refusal is reached only through `WHOLE_E2E`, a literal the spec types. Confirmed unreachable from real inputs by the 592-pairing cross-product. **C1b is degenerate as built**, exactly as P1 predicted — though for a different reason than P1 gave. |
| **C1b-B** same-scope starved of inputs | **FIRES** | See the corpus reading. This is the true mechanism. |
| **C1b-C** equality over a field that varies | **HELD** | `scopeVerdict` compares the sorted `selection` array alone. No ref, timestamp, duration, shard or worker count participates. `said` is carried for printing and excluded from equality. |
| **C2-A** assertion on a message | **HELD** | The body asserts `EXIT.CLEAN`, that `err` is empty, and that the text does **not** contain `THE COUNT MOVED` — not a substring alone. |
| **C2-B** a unit call dressed as a plant | **PARTIAL** | The body drives the real `countsStep` through the real `claimedCounts`/`claimedScopes` over verdict prose, but plants a `MergeState` rather than a temp repo. The wiring from a drill's `observe` callback into `observedScope` is exercised by no body. Recorded as a finding, not a rejection. |
| **C2-C** the one-spec drill is a typed literal | **HELD** | The data mutant fires: deleting the backticked command from the planted verdict flips the state `different -> unknown` with the counts byte-identical. Changing the drill's spec list changes the printed selection. The resolver reads the data. |
| **C2-D** a difference that names nothing | **HELD** | Mutant ME (derivation returns a constant) reds this body precisely because the emitted text stops naming the spec. |
| **C2-E / P4** a control that cannot fail | **DOES NOT FIRE** | Phase one's M5 established base refuses the T-297 shape, so the body has a real control. |
| **A1-A** three names, two behaviours | **FIRES, mitigated** | `scopeVerdict` returns three machine-readable values and bodies assert on them. But `gradeCounts` puts **differ and unknown into the same `unjudged` array**: findings 0 / judged 0 / unjudged 1 and `EXIT.CLEAN` for both. At the step's own record the two states are separable only by their sentence. Phase one's acceptance condition 1 is met at the derivation and not at the record. |
| **A1-B** the third state unreachable via a default | **HELD** | No `??`/`\|\|` default manufactures a scope. `input.claimedScope?.[leg]` undefined resolves to `unknown`. Unknown is the dominant real path (436 of 592). |
| **A2-A** leg-name equality renamed derivation | **HELD in the forbidden direction, FIRES in the inverse** | Equality is over selection tokens, not leg labels. But `runSelection` **discards** leg tokens entirely, so `gate-run.mjs app` and `gate-run.mjs e2e` are one scope. See finding F2. |
| **A2-B** a count-based tiebreak in the fallback | **HELD** | No count read on the scope path; see C1-E. |
| **A2-C** a context only the fixture writes | **HELD** | `claimedScopes` reads the existing verdict grammar — backticked spans in real prose — and resolves 39 real claims. No invented field. |
| **A3** same scope keeps the refusal | **HELD in code, unreachable in life** | Mutant MD confirms the refusal is pinned. Reachability is C1b-B. |
| **A4-A** reported to nowhere | **FIRES, not attributable** | `judged`/`unjudged` reach `io.out` only — never the merge record or `meters.jsonl`. This is the pre-existing shape at base, not a regression this diff introduces. |
| **A4-B** not compared but still consumed | **HELD** | The differ branch `continue`s before any comparison; nothing downstream reads a `moved` value. |
| **A5-A** unknown folded into differ — *phase one's single highest-value attack* | **HELD, against a real input** | Planted a real board verdict that states no command (`T-033`, parser 268) beside a fully resolvable drill. `scopeVerdict` gives `unknown`; the step prints `NOT JUDGED FOR LACK OF SCOPE EVIDENCE` and **not** `THE SCOPES DIFFER`; exit 0. Mutant MC (unknown mapped to different) reds the owning body. |
| **A5-B** unknown folded into pass | **HELD** | Mutant MF (unknown pushed to `judged`) reds the owning body. |
| **A5-C** the sentence without the state | **FIRES, same as A1-A** | MC and MF red the *same* body on two different assertions, which satisfies phase one's mutant 3 as written; but A5's two halves share one body, so removing that body loses both. |
| **A6-A** four bodies, one factory, one branch | **HELD** | Kill sets are **disjoint**, not nested: MA reds body 17 only, MB body 18 only, MC body 19 only, MD body 20 only. ME reds 17+18, MG reds 18+20. Each dies where its property lives. |
| **A6-B** the equal-counts body a count-based implementation passes | **HELD** | The arrangement is built on a real difference in selection (`brief.spec.ts` against `health-bands.spec.ts`) with counts deliberately equal at 35, and it reports `THE SCOPES DIFFER`. MB — difference reported only when the numbers also differ — reds it. |
| **A6-C** the missing-evidence body proves the default | **HELD** | The body shows the other state arising from the same path with evidence present, and asserts `scopeVerdict(WHOLE_E2E, undefined)` is `unknown` rather than a default. |
| **A7-A** early return swallows other duties | **HELD** | Mutant MG (an early return above the printing and the refusal) reds bodies 18 and 20. |
| **A7-B** the exit stops discriminating | **HELD** | Drove an unjudged leg both before and after the moved leg in `LEGS` order; the step returns `EXIT.FOUND` and names the moved count either way. |
| **A7-C** a control that cannot fail | **DOES NOT FIRE** | The planted failure is the moved count produced **inside** the counts step, not a refusal firing before it. |
| **X1** what a moved count looks like now | **ANSWERED, AND ADVERSE** | Nothing catches it. 0 of 592. See the corpus reading above and finding F1, which makes it worse before the correction. |
| **X2** the amendment's location | **HELD** | I graded all nine. The diff builds all nine; the card diff touches only `status` and the notes. |
| **X3** the count extraction underneath | **HELD** | `runCounts` is untouched — its only appearance in the diff is a hunk context line. No undeclared parse surface. |
| **X4** the fence | **HELD** | Three files moved: the two `touches` paths and the card. |

#### Findings

**F1 — THE READER WIDENS A NARROWED RUN INTO `whole`, WHICH IS THE ONE
DIRECTION THE DIFF SAYS IT NEVER GOES. Corrected below.** The notes state,
and the `REPORTING_FLAGS` comment repeats, that the selection reader "fails
CLOSED toward `selection` … it never widens a run into `whole`". It does,
by two routes sharing one cause — `atFront` is cleared only by a token that
is not a runner verb:

- the `--` separator does not clear it, so `cargo test -- test` and
  `cargo test -- run` read as the WHOLE leg;
- a repeated verb keeps being treated as front matter, so
  `npx playwright test test` and `npm test test` read as the WHOLE leg.

The `RUNNER_VERBS` comment asserts the opposite in as many words — "a cargo
filter … that happened to spell `test` must still count as a narrowing" — so
the code contradicts its own documentation. Driven at this tip, a verdict
stating `` `npm test` `` beside e2e 714 against a narrowed run reading 35
resolves `same` and refuses `THE COUNT MOVED — … both over the WHOLE leg, as
`npm test test``. That is T-297's exact defect reproduced **through** the new
gate, printing the narrowing while calling it whole. Not live on today's
corpus (one board command contains a bare `--`, and it resolves correctly),
but live in guard-class code whose stated invariant is the thing being
relied on.

**F2 — A COMMAND NAMING ONE LEG ESTABLISHES ANOTHER LEG'S SCOPE.**
`runSelection` skips any token in `LEGS`, so `gate-run.mjs app` and
`gate-run.mjs e2e` reduce to the same scope, and the leg a command names is
never checked against the leg it is attached to. Two real cards do this
today: `T-216-s4` resolves the **app** claim of 1131 off `` `gate-run parser` ``,
and `T-278` resolves the **e2e** claim of 742 off `` `gate-run.mjs app` ``.
Both give `scopeVerdict = same` against a whole run of their own leg, and
with a moved count both would produce a finding on evidence about a different
leg. Latent only because no plan step produces a whole observed scope — which
means **repairing X1's reachability activates this**. Not corrected here: it
needs a leg check the amendment does not name, and it is the follow-on card's
business.

**F3 — NINE OF THE THIRTY-NINE RESOLVED CLAIMS RESOLVE OFF A NON-RUNNER.**
`RUNNER_NAMES` gates on the head token alone, so any backticked `npm …` span
counts. On the board that admits `npm ci` (→ `[ci]`), `npm run build` (→
`[build]`), `npx vite build`, `npm run lint:docs` and
`npm run lint:tokens -- --selftest` as the "measurement context" for a test
count. Each fails toward `selection`, so the cost is a lost comparison rather
than a false one — but the notes' claim that this reads "the runner
invocation" is not true for roughly a quarter of what it resolves.

#### Findings that changed no row

- `claimedScopes` uses a regex **byte-identical** to `claimedCounts`, `"i"`
  flag included, so both land on the same hit. A drift there would have
  attached a scope to a different occurrence than the one graded; it is
  closed by construction and worth keeping closed.
- Paragraphs are `\n\n`-bounded, so a bulleted verdict list is one paragraph
  and a command in an earlier bullet can attach to a later bullet's count.
  No board card is mis-resolved by this today.
- Prose resolves to no scope, as the card pins: "the whole suite was run" and
  "over the whole suite" both yield nothing. Verified.
- The evidence manifest under `supertaskr-evidence/lanes-2026-09-17/` records
  `21422406…` for the grounds while the file is `69f3f592…`; the manifest went
  stale when phase one appended its correction. Housekeeping, not this diff's.
- The context pack's `docs/CONVENTIONS.md` figure of 160099 bytes is wrong —
  it is 13662 bytes here, as the lane found. Already routed.

#### The correction

One, assigned and already committed on this bench after this verdict. It
makes the code match the invariant its own comments assert, and adds the body
that holds it there. `merge.spec.ts` goes 51 → 52 bodies; the drill reds
exactly the new body and nothing else.

```mutant
correction: a selection token that spells a runner verb is still a narrowing
file: tools/e2e/scripts/merge.mjs
spec: tools/e2e/tests/merge.spec.ts
body: T-295-s8 — a selection token that SPELLS a runner verb is still a narrowing, so a narrowed run never widens into `whole`
message: a cargo filter that happens to spell `test` is a narrowing, not a verb
--- old
  let atFront = true;
  /** The verbs already spent at the front — a REPEAT of one is a selection, not more front. */
  const spent = new Set();
  for (let i = 0; i < argv.length; i += 1) {
    const token = /** @type {string} */ (argv[i]);
    if (token === "--") {
      atFront = false;
      continue;
    }
    if (atFront && RUNNER_VERBS.includes(token) && !spent.has(token)) {
      spent.add(token);
      continue;
    }
--- new
  let atFront = true;
  for (let i = 0; i < argv.length; i += 1) {
    const token = /** @type {string} */ (argv[i]);
    if (token === "--") continue;
    if (atFront && RUNNER_VERBS.includes(token)) continue;
```

Anchor counts checked on the corrected tree: `old` matches exactly once,
`new` matches none, and after the swap `new` matches exactly once. The
plan's own `bump:pin` argv and the board's one `--`-bearing command read
exactly as they did.

#### What the integrator owes at the merge

1. **The behaviour census is STALE** — `npm run capabilities:check` from
   `tools/e2e` exits 1: committed 119521 bytes against a fresh 119869. The
   lane declared this and left it to the merge; my correction adds a fourth
   new body name to it. Regenerate as the last write before the merge commit.
2. **The graph regen** the lane derived still fires (a `.ts` moved outside
   `docs/`), and the dogfood pins follow it.
3. **The docs gate** fires on this card.
4. Run the e2e leg whole at the **merged** tree, after the merge commit —
   the correction changes a function two bodies outside `merge.spec.ts` do
   not cover, and a staged merge grades the pre-merge tree.
5. `push-guard.spec.ts`'s three reds inside a fenced lane remain T-333's and
   are not this merge's to fix.

#### What still has no card

X1's hole. After this diff a genuinely moved count is caught by nothing, and
the two things that would change that — the verb running a leg whole, and
verdicts stating counts in a field rather than in prose — are T-295-s3's and
T-262's. F2 is the trap waiting for whoever closes the first of them. I am
filing that as a suggestion rather than folding it into this verdict, per
phase one's own condition.

