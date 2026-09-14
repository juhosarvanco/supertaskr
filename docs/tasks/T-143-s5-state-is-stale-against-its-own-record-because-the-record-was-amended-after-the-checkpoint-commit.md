---
id: T-143-s5
title: An APPEND to an already-checkpointed record reds the docs gate as though STATE were never regenerated — the instance was discharged by a second STATE commit, the rule that produced it was not
feature: F-06
milestone: 4
priority: 8
size: S
tier: guarded
status: building
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
