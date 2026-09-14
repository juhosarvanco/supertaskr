---
id: T-143-s5
title: An APPEND to an already-checkpointed record reds the docs gate as though STATE were never regenerated — the instance was discharged by a second STATE commit, the rule that produced it was not
feature: F-06
milestone: 4
priority: 8
size: S
tier: guarded
status: verifying
suggested_by: executor claude-opus-5@subagent @T-143-s4
blocked_by: []
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/docs-gate.mjs, tools/e2e/scripts/push-checks.mjs, tools/e2e/tests/push-checks.spec.ts, tools/e2e/tests/docs-input-gate.spec.ts, docs/STATE-template.md, docs/STATE.md, method/docs-protocol.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
closed_by: 35e6504 (main, 2026-08-30 11:12) — the INSTANCE only; the rule is untouched and the shape recurs
---

**THE INSTANCE IS ALREADY DISCHARGED. THE MECHANISM IS NOT.** Read the
discharge first so nobody re-fixes a green tree, then the question,
which is the part worth triage.

## What was measured, and where it went

Found at `4d3dd8f` — T-143-s4's base and `main`'s tip at that lane's
cut. `npm run lint:docs` from tools/e2e/, a CI STEP, exited **1**:

    docs-gate: docs/STATE.md is STALE against 1 newer checkpoint record(s) —
      the record was committed and STATE was never regenerated
      (docs-protocol.md rule 4; the integrator's step 2):
      2026-08-30-T-162.md

Three `docs-input-gate.spec.ts` bodies red with it — `:720`, `:846`,
`:907` — all three asserting that a CODE-ONLY path list reaches the
reader as exit **0**. The gate cannot answer 0 while any whole-tree
finding stands, so one stale STATE takes the gate's whole zero away and
three bodies red under titles about exit codes and empty lists that name
neither STATE nor a checkpoint. `lint:docs` says the cause in one line;
the suite does not. That asymmetry is worth a reader's minute even now
the instance is gone.

The two commits, derived with `git log --format='%h %cI' -- <path>`:

| ref | `docs/STATE.md` | `docs/checkpoints/2026-08-30-T-162.md` |
|---|---|---|
| `4d3dd8f` (red) | `f90edfd` 2026-08-30T10:49:07+03:00 | `8e659b1` 2026-08-30T10:53:21+03:00 |
| `35e6504` (green) | `35e6504` 2026-08-30T11:12:02+03:00 | `8e659b1` 2026-08-30T10:53:21+03:00 |

`f90edfd` did the ritual CORRECTLY — record and regenerated STATE in ONE
commit, which the gate's own comment says ties and passes. Four minutes
later `8e659b1` APPENDED eight lines to that record alone
(`git show --stat 8e659b1`: one file, 8 insertions) and moved the
record's last-commit stamp past STATE's.

**DISCHARGED BY `35e6504`**, whose subject ends *"and STATE regains
currency over the appended record"* — the same disposition (A) below.
Re-measured in a CI-shaped clone with no lanes:
`node tools/e2e/scripts/docs-gate.mjs app/src/main.tsx` from the
repository root is **exit 1 at `4d3dd8f`** and **exit 0 at `35e6504`**.
So this card is `status: suggested` with a `closed_by:` line, per
CONVENTIONS' fourth question — "resolved by other work" is a
disposition, not a status.

## The question that survives the fix

The gate's rule reads *"a checkpoint record whose last COMMIT is newer
than docs/STATE.md's last commit is step 1 without step 2"*
(`docs-gate.mjs`, the `staleAgainst` loop, comment beginning
*"ADR-019 §Records, PROMOTED from ritual to gate"*). **An APPEND to an
already-checkpointed record is neither step.** The record was written
WITH its STATE regeneration; what came later was an amendment, and
ADR-019 makes records append-only, so amendments are not an accident to
be designed out — `8e659b1`'s own subject says it was appending a re-run
battery line, which is exactly the normal case.

So the shape RECURS, and the fix that discharged it costs a STATE commit
whose only content is a clock. Two dispositions, and this card
deliberately picks neither:

**(A) LEAVE THE RULE, PAY THE COMMIT.** What `35e6504` did. Cheap per
instance, correct under docs-protocol rule 4 as literally written, and
it keeps the gate maximally suspicious — which is what it was promoted
for after the ritual slipped twice in its first two checkpoints. The
cost is a recurring false red that a lane cut before the STATE commit
inherits, and a STATE regeneration triggered by something that is not a
checkpoint.

**(B) COMPARE AGAINST THE COMMIT THAT CREATED THE RECORD**, or against
the checkpoint commit STATE was regenerated in — not against the
record's latest touch. Removes the recurrence at the cost of a rule with
more moving parts. **Whoever takes this must keep the original slip
caught**: the gate exists because records were committed and STATE was
never regenerated, and a rule that stops firing on amendments must still
fire on that. Read the comment above the loop before moving it, and
poison BOTH shapes — an amended record (must pass) and a new record with
no STATE commit (must red).

## Why it is filed even so

A lane cut from a ref between the amendment and the repair inherits a
red CI step it did not cause and cannot fix from its own fence —
T-143-s4 was exactly that lane, and spent a gate run and a clone
measurement establishing that three of its five reds belonged to the
tree. The next lane cut in that window pays the same. That is the cost
this card prices, and it is the argument for (B) rather than a claim
that (A) is wrong.

**PARKED at standing triage sitting #2 (2026-08-30, architect).** The instance is discharged and the card says so with its own re-measurement; what is left is a choice between disposition (A) and (B) that this card deliberately declines to make, and triage declines it too — for a reason the card supplies: the cost is ONE lane's inherited red, paid once so far, and (B) rewrites a gate that exists because the ritual slipped twice in its first two checkpoints. A rule with more moving parts is not obviously worth buying against a cost of one.

**RESURFACES when a SECOND lane pays it**, which is checkable at the moment it happens and by the seat it happens to: a lane whose base sits between an APPEND to an already-checkpointed record and the STATE commit that repairs it, seeing `docs-gate: docs/STATE.md is STALE against N newer checkpoint record(s)` for a record whose own creation commit was accompanied by its STATE regeneration. That lane appends its base ref here as a dated corroboration and unparks the card; at two instances the recurrence is priced and (B) has an argument this park does not.

Derive the shape of any suspected instance with `git log --format='%h %cI' -- docs/STATE.md` against `git log --format='%h %cI' -- docs/checkpoints/<record>`: an APPEND is a later commit touching the record alone. **Whoever takes (B) must keep the original slip caught** — poison both shapes, an amended record that must pass and a new record with no STATE commit that must red.

SECOND SIGHTING (2026-08-30, CI run on a23b1a4): the T-135 record's empty-board addendum, committed after STATE's regen, redded the gate again — the resurfacing condition ("a second lane pays the inherited red") is MET; this card queues for the next sitting with two instances.

## Ruling of 2026-09-14 — arm B, as card preparation and promotion only (pile 2 batch 3b row 39; the owner's approval of 2026-09-14 after the Codex orchestrator's reviews)

The two alternatives the record above leaves open are decided for B: the staleness derivation compares an amended record against the commit that CREATED it, so an append to an already-checkpointed record no longer requires a STATE clock-touch commit. The derivation is the shared helper staleStateRecords in tools/e2e/scripts/docs-scan.mjs (docs-gate.mjs's staleAgainst loop only reports its result; push-checks.mjs consumes the same helper), so the change lives there and in its owning tests, never in the reporting loop alone. This ruling promotes the card to planned and authorizes no dispatch; the owner's ruling of the same day schedules the build after the current delivery work (T-324 and T-322), which it does not interrupt, and keeps both safeguards: a new checkpoint without its STATE regeneration still fails, and an amendment that changes a fact or a hazard STATE summarizes still updates STATE. The card's earlier dispositions (suggested, then parked) stand as successive records; nothing above is rewritten.

**Dispatched 2026-09-14 beside T-322 (the architect seat).** The preflight at the dispatch base finds this fence disjoint from the live T-322 lane's, so the build interrupts nothing the owner's schedule protects; the seat reads that schedule as "not at the delivery work's expense", and the lane parks on the owner's word if the reading was wrong. Both safeguards the ruling names stand as the criteria below.

## Acceptance criteria

- WHEN a record under docs/checkpoints/ that STATE was regenerated for at its creation is later APPENDED to THE staleness derivation — staleStateRecords in tools/e2e/scripts/docs-scan.mjs, the one helper both docs-gate.mjs and push-checks.mjs consume — SHALL compare against the commit that created the record, so the amended record passes; pinned by bodies in tools/e2e/tests/push-checks.spec.ts and tools/e2e/tests/docs-input-gate.spec.ts with the controls poisoned both ways: a new record without its STATE regeneration still reds by name, the same-checkpoint tie still passes, and the committed-history reading is unchanged, each control run where the arrangement is absent and seen to red.
- WHEN the rule changes THE governing text SHALL say the new rule once — method/docs-protocol.md's rule on regeneration, docs/STATE-template.md's contract paragraph, and the sentence in docs/STATE.md that a later edit to the record re-touches the file — so the old retouch requirement does not remain active anywhere; and the rule SHALL say that an amendment which changes a fact or a hazard STATE summarizes still updates STATE, a rule of conduct the gate does not enforce.
- WHEN this card lands THE change SHALL remove a recurring administrative commit without weakening the requirement that a new checkpoint lands with its STATE regeneration in the same commit; a body SHALL show that a checkpoint record committed without its STATE regeneration is still refused.

## Implementation notes

**Built 2026-09-14 in the lane cut at base `767a68ff` (the dispatch
stamp), arm B exactly as the ruling above decided it.** The staleness
derivation now compares a checkpoint record against the commit that
CREATED it; an append to an already-checkpointed record is neither step
and no longer asks for a STATE commit whose only content is a clock.

### What moved

- `tools/e2e/scripts/docs-scan.mjs` — `staleStateRecords` asks git for
  the record's CREATING commit (`git log -1 --diff-filter=A --format=%ct`)
  instead of its latest touch, and compares that against
  `docs/STATE.md`'s last commit with the same `>` that has always let the
  same-commit TIE pass. The ADD spelling is exported as
  `RECORD_CREATED_FILTER` so a body can assert the reading rather than
  infer it. Committed history only, unchanged: a mid-ritual working tree
  still has nothing to compare and still never reds.
- THE FALLBACK, and it is the one design decision this card did not
  inherit. A record whose creating commit git will not name falls back to
  the LATEST touch — the old reading, which is the suspicious one —
  because the one failure this gate must not have is going quiet. That
  branch is not defensive decoration: a record added ONLY IN A MERGE
  COMMIT has no `--diff-filter=A` answer at all, because `git log` does
  not diff merges, and the fixture that builds that arrangement is in the
  suite with its own control. Without the fallback such a record
  disappears from the gate entirely; the drill below plants exactly that.
- `tools/e2e/scripts/docs-gate.mjs` — the report only. The comment above
  the `staleAgainst` loop keeps the ADR-019 promotion history (the ritual
  slipped twice in its opening two checkpoints) and gains why the reading
  moved; the printed line now says the record was CREATED without its
  regeneration and that an append is not this finding.
- `tools/e2e/scripts/push-checks.mjs` — the report only, same treatment.
  It re-states no rule, so the two readers still cannot disagree (T-057).
- `method/docs-protocol.md` rule 4 — the rule, argued ONCE, both halves:
  what obliges the regeneration is the record's creation and never its
  every later touch, AND an amendment that changes a fact or a hazard the
  state document summarises still updates it, which is conduct no gate
  can keep because no program can tell which appended line changed the
  state of the world.
- `docs/STATE-template.md` — the generator of `docs/STATE.md`, so the
  retired requirement could not be allowed to come back at the next
  regeneration. Its opening contract paragraph operates the rule and
  cites rule 4 for the argument; its `## The contract this file is under`
  slot instructs the regenerated paragraph to carry the creation half.
- `docs/STATE.md` — the generated file. The sentence that said a later
  edit to the record re-touches this file now says an append to that
  record does not. This lane's commit is what changed it, not a
  checkpoint regeneration, and the wording is deliberately SHORTER than
  what it replaced: the file was 8462 bytes at `767a68ff` against an
  ADR-019 warn line of 8465 and is 8458 after, so a fuller sentence would
  have spent the whole remaining headroom on prose the template can carry
  instead. The conduct half therefore lives in rule 4 and in the
  template, which is `method/docs-protocol.md` law 5 applied to its own
  law 4.

### The reading of criterion 2, said plainly

"The governing text SHALL say the new rule once" is taken as ONE argued
statement across the three sites, not one copy each: rule 4 argues it,
the template operates it and cites rule 4, and `docs/STATE.md` carries
the operative clause in the sentence the criterion names. The retired
requirement is absent from all three, and a body proves it with a plant.

### Bodies

Seven added, none removed, none reworded.
`tools/e2e/tests/push-checks.spec.ts` gains the amended record that
passes with its control (the same append on a record CREATED without its
regeneration, which reds by name), one tree holding an amended record
that passes beside a new record that reds, and the committed-history pin
with both halves of its arrangement removed in turn.
`tools/e2e/tests/docs-input-gate.spec.ts` gains the derivation's
three-way discrimination (append passes, creation without regeneration
reds by name, tie passes) with the ADD spelling asserted, the
merge-added record that falls back rather than going silent with its
regenerated control, the gate-wiring body that requires the finding to
reach `found`, and the governing-text body with its planted retouch
requirement.

### Figures, each at its own ref

At `767a68ff`, over the 89 records under `docs/checkpoints/` (90 `.md`
files less `TEMPLATE.md`): 8 records have a creating commit that differs
from their latest touch, and the stale set is EMPTY under both the old
reading and the new one. So this change moves no answer on this tree —
which is why every arrangement is built in a fixture and none is
asserted off the live checkout.

Cost, measured at the lane tip over the same 89 records, three readings:
3022 ms, 3031 ms, 3018 ms. The reading is one git process per record and
that was true before this card too; the creating read is not the more
expensive of the two — one pass each over the same 89 records gave
3220 ms for the latest-touch spelling and 2866 ms for the creating one.
A suggested card carries the batching.

### Drills — six mutants, each killed, each restore proved by sha256

    1  the rule reads the latest touch again      push-checks + docs-input-gate red
    2  the derivation reports nothing, ever       push-checks (2 bodies) + docs-input-gate red
    3  the tie now reds (`>` becomes `>=`)        push-checks + docs-input-gate red
    4  the gate prints and leaves its exit alone  docs-input-gate reds
    5  the retouch requirement is put back        docs-input-gate reds
    6  an undatable record goes silent            docs-input-gate reds

Mutants 1, 2, 3 and 6 were applied to `tools/e2e/scripts/docs-scan.mjs`,
4 to `tools/e2e/scripts/docs-gate.mjs` and 5 to `docs/STATE.md`. Each
file's sha256 before the mutant and after the restore is recorded in the
lane's report.

### In-fence follow-through

None. Every change above is a criterion's.

### What this lane does NOT carry, and the merge owes

`docs/CAPABILITIES.md` is outside this fence and seven new `test(` names
change it. The merge regenerates the census (`npm run capabilities` from
`tools/e2e/`, which also regenerates `docs/INDEX.md`) and CI's
`capabilities:check` is what would red otherwise. `docs/INDEX.md` itself
is unchanged by this diff: its Capabilities line names spec-file slugs,
not body names, and no spec file was added.

## Verdicts

### 2026-09-14 — APPROVED — claude-opus-5@subagent

Phase 2 of the guarded two-spawn bench, on a bench worktree detached at
the lane tip `1afebfd897cd6dad76d66a0220bc4946d2c3af3a` over the base
`767a68fff1f4b69bb8e83b0012acb727279e2613`. The diff and both spec files
were read BEFORE the executor's report, which is a step-5 file and was
opened last. The sealed inputs, re-hashed on this bench before anything
else was read, and both matched:

    sha256:6311c74014653760d3b67ef5e7740f7c05ac82fe983ad9bc41db41188aa8e26d  the attack set
    sha256:cf5be7283a78523067061a39629d69efc8f80da6b0566dc125abce41573ac1c1  the ground at the base
    sha256:3f24d1f4c4d80adf755c8853c77b744d553cc07686c5d617ee1e7a26254a3e8c  the card at the base

The ground's addendum carries the seat's answers to phase 1's asks M1 to
M12. Its own note stands and is not worked around: THE WHOLE-SUITE
PASS/FAIL WAS NOT TAKEN AT THE BASE, so there is no base battery figure
to delta against and none is inferred here. The base's body COUNT is
known — 1129 in 41 files — and that is what the tip is read against.

#### The change, from the diff

`staleStateRecords` in `tools/e2e/scripts/docs-scan.mjs` — the one helper
`docs-gate.mjs` and `push-checks.mjs` both consume — replaces its single
`git log -1 --format=%ct` per record with the same call carrying
`--diff-filter=A`, the spelling exported as `RECORD_CREATED_FILTER`, and
falls back with `??` to the old latest-touch reading when git names no
creating commit. The comparison operator is untouched, so the
same-commit tie still passes. Both consumers keep only their report.
The rule is argued once in `method/docs-protocol.md` rule 4, operated by
`docs/STATE-template.md` (which cites rule 4 rather than re-arguing it)
and carried in the generated `docs/STATE.md`'s own contract sentence.

#### The criteria, one row each

| # | criterion | verdict | evidence |
|---|---|---|---|
| 1 | the derivation compares against the CREATING commit, in the one shared helper, pinned in both named spec files with the controls poisoned both ways and each run where the arrangement is absent | **MET** | 7 added bodies, all green at the tip; my drills D1 to D5; the CLI table below |
| 2 | the governing text says the new rule once, the retired retouch requirement stands nowhere, and the conduct half is said and marked unenforced | **MET** | rule 4 read against the code; the tree-wide absence check against the sealed M6 inventory; drill D1 of the executor's own set |
| 3 | the recurring administrative commit is removed without weakening the new-checkpoint requirement, and a body shows the slip still refused | **MET** | the two historical refs re-measured with the tip's scripts, with the base-script control in the same clone |

**Criterion 1.** The change is AT the site the criterion names. I read
both reporting loops and neither carries a derivation, so the amnesty was
not smuggled into a consumer. The two consumers are asserted over the
SAME arrangements, passing and poisoned: `push-checks.spec.ts` calls
`staleStateRecords` and `staleState` over one tree in each new body,
which is more than the pre-existing shared-implementation body did. The
two spec files build their histories with two INDEPENDENT builders, so no
single patched builder decides both answers — and drill D5 demonstrates
that independence rather than asserting it. Poisoned both ways, and a
fourth way the card does not name: an append on a record CREATED without
its regeneration still reds BY NAME in both files. That arrangement is
the blanket-amnesty escape, the one a derivation could take to satisfy
"an amended record passes" while re-opening the original slip, and the
executor built it without being asked to.

At CLI level, over real trees rather than fixtures, using the invocation
the card's own opening section used — `node tools/e2e/scripts/docs-gate.mjs
app/src/main.tsx` from a repository root, in a clone whose source was
this bench, so no other checkout was read:

| arrangement | TIP scripts | BASE scripts, same tree — the arming control |
|---|---|---|
| an append to a record checkpointed WITH its regeneration | exit **0**, no finding | exit **1**, `STALE against 1 newer checkpoint record(s)`, named |
| a NEW record committed alone | exit **1**, named, in the new wording | exit **1** |

The control differs in the DERIVATION and not in the fixture, which is
what makes it a control. One caution for whoever repeats it: my first
attempt built its commits without explicit dates, all three landed inside
one second, and the tie swallowed the arrangement — the very reason both
new fixtures set `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` a minute
apart and say so in a comment.

**Criterion 2.** Rule 4 argues the rule and marks the conduct half
unenforced in as many words — "a rule of CONDUCT, kept by the integrator
and not by a program, because no gate can tell which appended line
changed the state of the world" — and no body claims to test it, which is
correct. The template matters more than the other two sites and the diff
treats it that way: `docs/STATE-template.md` GENERATES `docs/STATE.md`,
and its contract slot now instructs the regenerated paragraph to carry
the creation half, so the retired requirement cannot come back at the
next checkpoint. I ran the tree-wide absence check against the M6
inventory sealed at the base rather than against a string chosen after
the diff: every surviving `re-touch` or `retouch` hit is one of a
DIFFERENT rule about a different page (`docs/VERSIONS.md` and
`docs/rooms/version-planning.md`, on the version sitting), an append-only
checkpoint record, this card's own quoted history, or the spec that
enforces the absence. The old gate sentence survives tree-wide in
exactly one place: this card's verbatim quotation of what it measured,
which is a record.

**Criterion 3.** The referent is historical, so I measured it rather than
accepted it. One clone, the two refs the card names, the scripts swapped
and nothing else:

| ref | BASE scripts | TIP scripts |
|---|---|---|
| `4d3dd8f`, the card's measured red | `STALE against 1 newer checkpoint record(s)`, `2026-08-30-T-162.md` | the state-stale line is **absent** |
| `a23b1a4`, the second sighting | `STALE against 1 newer checkpoint record(s)`, `2026-08-30-T-135.md` | the state-stale line is **absent** |

Both refs still exit 1 under the tip's scripts for `docs/INDEX.md`, which
is the ADR-024 anachronism the ground's M2 predicted: that check
postdates both refs and is not this finding. So both instances the card
priced stop firing, and the commit whose only content was a clock is not
owed again. The other half of the criterion — the requirement is not
weakened — is the CLI table above, a body in each spec file, and drills
D1 and D4.

#### The kill set — five mutants, mine, each at the site the property lives

| # | the mutant | what redded | passed beside it |
|---|---|---|---|
| D1 | the derivation reads the record's LATEST TOUCH again | `docs-input-gate.spec.ts:2358`, `push-checks.spec.ts:275`, `:312` | 4 |
| D2 | the tie reds — `>` becomes `>=` | those two files' tie arrangements AND the PRE-EXISTING `push-checks.spec.ts:179`, five in all | 2 |
| D3 | the fallback removed, so an undatable record goes silent | `docs-input-gate.spec.ts:2467` and NOTHING ELSE | 6 |
| D4 | THE BLANKET AMNESTY — any record with more than one commit waved through | `docs-input-gate.spec.ts:2358`, `push-checks.spec.ts:275` | 5 |
| D5 | a DATA mutant: the push-checks fixture's working-tree `edit` starts committing, so no uncommitted state is left to observe | three push-checks bodies including `:335` — and the docs-input-gate bodies stayed GREEN, which is the right answer, because that file builds its own history | 4 |

Every run executed bodies, so no red is a red over nothing. Every
restore is proved: `tools/e2e/scripts/docs-scan.mjs` hashes
`2491f46a94cab75cad9105cdd03206fa83b27f0335808f4b8794120c8e950638`
before D1 and after every restore — the same value the executor recorded
for its own drills, so the drilled tree and the graded tree are one tree —
and `tools/e2e/tests/push-checks.spec.ts` hashes
`817516db0ba027506b0521dc96a196c17ac75679ebd126baec0405e5ff3ca187`.
The worktree was clean after each.

D3's containment is the reading worth keeping: ONE body, and it is the
one whose fixture builds the arrangement. D4 is the attack set's headline
and it dies in both files.

#### What I checked that no criterion asks for

- **The fallback is reachable, and it is the suspicious direction.**
  Reproduced independently on git 2.50.1: a record added ONLY in a merge
  commit has no add-filtered answer at all, so the branch is real and not
  decoration, and it falls back to the reading that reds MORE. Fail
  closed, which is the stronger of the two dispositions phase 1 would
  have accepted.
- **A rename does not move the answer.** The add filter names a rename
  commit as the new path's add, which is also that path's latest touch,
  so both readings agree. No record in the live tree has been renamed.
- **A shallow clone is equally blind under BOTH readings.** At depth 1
  every path's only commit is the graft, so the record ties with the
  state document and nothing is reported — true at the base too. Not a
  blindness this card opened.
- **The cost went DOWN, and the ground is why that is checkable.** M12
  measured the base derivation at 4.00 / 4.03 / 4.39 s over 89 records and
  priced a second spawn per record at plus 4.5 to 6 s. There is no second
  spawn: the fallback is a `??` and fires only where the first call came
  back empty, which is 0 records here. Measured at this tip while an e2e
  leg was running: 3327 / 3661 / 3473 ms. The regression the ground
  priced did not happen.
- **The card's figures reproduce exactly.** At the base, derived here:
  89 records, 8 whose creating commit differs from their latest touch,
  and the stale set EMPTY under both readings. So the change moves no
  answer on the live tree, which is the executor's stated reason for
  building every arrangement in a fixture, and it is true.
- **Security.** `execFileSync` with an argv array and no shell; every
  record basename is passed after `--`, so a leading dash, a semicolon or
  a newline in a filename is an argument and not syntax. No record's
  CONTENT is read, no cache is introduced, no new file is written.
- **Bookkeeping.** The card's earlier dispositions, its `closed_by:` line
  and the ruling are untouched; the diff appends only under
  `## Implementation notes`, which is what the card's own "nothing above
  is rewritten" requires. The preflight answers exit 0 over 0 findings for
  this card and for both cards the lane filed.

#### Residuals — named, not approved away

1. **`method/docs-protocol.md` contradicts itself about whether a record
   may be amended at all.** Law 4 now reads "Records are APPEND-ONLY
   rather than write-once (law 3)", while law 3's own closing clause says
   a record "is written once and never edited", and
   `docs/checkpoints/TEMPLATE.md` repeats that formula. The contradiction
   PREDATES the diff — the ground's M10 flagged it at the base — but law 4
   now argues FROM it, so a reader who follows the citation reads the
   opposite of what cited it. Resolving it is a method ruling and not
   this card's, whose second criterion reaches three named passages and
   the retouch requirement. Filed as T-143-s9.
2. **A merge-added record still owes the clock commit.** For the shape
   the fallback covers, the governing text's promise is not what the gate
   does. It errs toward red, it is argued in the helper's own comment and
   on the card, and it is 0 records on this tree. Left there: a
   git-traversal caveat does not belong in a method law.
3. **The lane holds `docs/STATE.md`, at 8458 bytes against a warn line of
   8465.** Seven bytes of headroom. The template edit is the right
   mitigation, because a regeneration landing before this merge
   reproduces the new sentence rather than the retired one — but a
   checkpoint between now and the merge collides on this file, and the
   regenerated paragraph has to fit.
4. **A code-only path list still loses its zero to a whole-tree finding,
   and the bodies that red name neither.** Unchanged here, and correctly
   so: this card scopes to WHICH commit is read. The lane filed T-143-s7
   rather than widening. I measured the property intact — a code-only
   path list over a tree carrying a genuine slip is exit 1 and names the
   record.

#### Suites, each with the ref it ran at

The whole battery at the tip I was sent, `1afebfd897cd6dad76d66a0220bc4946d2c3af3a`,
one run, `gate-run.mjs parser app rust e2e` exit **0**:

    parser  exit 0  454 bodies   1 target   GREEN
    app     exit 0  1171 bodies  1 target   GREEN
    rust    exit 0  655 bodies   18 targets GREEN
    e2e     exit 0  1136 bodies  1 target   GREEN

1136 against the base's 1129 is the 7 added bodies and nothing else. The
graph answers CURRENT at this tip — 1228940 bytes, 203 files, 2626
symbols, 2505 edges — as expected, since the indexed set carries neither
`tools/e2e/` nor `method/` nor `docs/`. The census is STALE at this tip
BY CONSTRUCTION and is not regenerated on a bench: committed 105999
bytes against a fresh generation of 106689, which is the 7 new body names
the merge's own `npm run capabilities` writes, exactly as the lane's
notes say it owes.

The step-7 readings at my OWN tip — the verdict commit — are in the
postscript below, because a figure measured at the commit I was sent is
stale at the tip my verdict creates.

#### Postscript — the step-7 readings at MY OWN tip

Taken at `e5219c65059a668a19cbecefc0969ff6fe9b176a`, which is the verdict
commit plus the card this verdict filed — because a figure measured at
the commit I was sent is stale at the tip my verdict creates, and the
tree the merge will read is this one.

The whole battery, `gate-run.mjs parser app rust e2e`, exit **0**:

    parser  exit 0  454 bodies   1 target   GREEN  ref e5219c65
    app     exit 0  1171 bodies  1 target   GREEN  ref e5219c65
    rust    exit 0  655 bodies   18 targets GREEN  ref e5219c65
    e2e     exit 0  1136 bodies  1 target   GREEN  ref e5219c65

Identical, leg for leg and body for body, to the run at the tip I was
sent. The reading worth keeping is that this run had the verdict above
and T-143-s9 IN the tree, so the bodies that parse every live task card
and the docs gate that walks the whole of docs/ saw both and stayed
green — which is the only way a verdict's own prose gets checked.

`capabilities:check` — **STALE** at this ref, committed 105999 bytes
against a fresh generation of 106689. By construction and not
regenerated here: the difference is the 7 body names this lane added, and
`npm run capabilities` at the merge is what writes them, which is what the
lane's own notes say the merge owes. The figure is identical at the tip I
was sent, so nothing I committed moved it.

`index --check` from `app/src-tauri/` — **CURRENT**, exit 0: 1228940
bytes, 203 files, 2626 symbols, 2505 edges. Unmoved from the tip I was
sent, as expected, since the indexed set carries neither `tools/e2e/` nor
`method/` nor `docs/`.

The push-guard body that reds when two hook runs straddle a minute
boundary (T-314-s5) did not fire in either battery; there is no red to
attribute to it or to anything else.

DISCLOSED CONTENTION: the T-322 lane's own `gate-run` was running on this
machine during part of the first battery and during the helper timings
above, which is why my 3327 / 3661 / 3473 ms reading of
`staleStateRecords` sits above the lane's own 3022 / 3031 / 3018 ms. Both
sit BELOW the base derivation's 4.00 / 4.03 / 4.39 s in the ground's M12,
which is the comparison the performance claim rests on, so the contention
cuts against my own figure and not in its favour.
