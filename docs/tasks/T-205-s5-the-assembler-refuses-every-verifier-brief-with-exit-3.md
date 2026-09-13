---
id: T-205-s5
title: The project's own brief assembler refuses EVERY verifier brief with exit 3 — it looks for the thirteen-row contract table in the role file it was asked for, and only executor.md has one
feature: F-06
milestone: 4
size: L
priority: 2
status: planned
suggested_by: executor claude-opus-5@subagent @T-205
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts, method/roles/verifier.md, docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-254-s4, T-271-s3, T-296-s10 (2026-09-13, the pile-2 sitting, the owner's approval of 2026-09-13). The three files are removed in the same commit as this line; their obligations sit in the criteria below tagged with their source, and each full text is kept under its absorbed heading. Priority 3 becomes 2 (T-296-s10's, the highest of the sources); size M becomes L because the table, the assembler's second role, the pack and the bench's naming of it are one construction; the wait on T-311-s5 (roles/verifier.md was that lane's fence and gained step 5a there) is discharged — T-311-s5 merged at 19ce8447 before this fold landed, so the table is placed around step 5a as merged. T-254-s4's own blocker T-254 is done. T-185-s1, T-205-s2 and T-225-s10 stay parked and untouched; T-112-s8 is parked with this card as its wake.

**MEASURED IN T-205's LANE, AND IT PREDATES THAT LANE.**

    node tools/e2e/scripts/brief.mjs --task T-205 --role verifier
    brief: COULD NOT RUN
      dispatch-brief: found 0 tables headed # / The brief carries /
      Assembled from / If it is absent, expected exactly one ...
    exit 3

`dispatch-brief.mjs` reads the row set out of the role file it was
handed. **`method/roles/executor.md` is the only role file that carries
the table**; `roles/verifier.md` has never carried one, at the lane's
base ref or after it (`git show <base>:method/roles/verifier.md | grep
-c "The brief carries"` = 0 both ways), so the refusal is not this
lane's doing.

**WHY IT IS NOW A BLOCKING GAP RATHER THAN A CURIOSITY.**
`roles/executor.md`'s contract table says in as many words that *"a
verifier's or integrator's brief follows the same thirteen-row contract,
substituting the role-specific rows"*, and `roles/orchestrator.md` 5b
requires a brief to be assembled BY THE PROJECT'S OWN ASSEMBLER — *a
rule that depends on a reader remembering has a failure mode; a rule
that depends on a construction does not*. Every verifier brief on this
project is therefore hand-written today, which is precisely the
condition under which four briefs in one sitting broke a rule they had
QUOTED. **And T-205 has just added a two-spawn dispatch for the verifier
that nothing can assemble**, so the newest contract is the one furthest
from a construction.

## Acceptance criteria

- `--role verifier` SHALL assemble rather than exit 3, reading the row
  set from the ONE place it lives and substituting the role-specific
  rows named there (4, 11, 12) against `roles/verifier.md`.
- A ROLE FILE that carries no table SHALL NOT be read as a contract of
  its own, and the substitution SHALL be DERIVED from the role file
  rather than hardcoded per role.
- ROW 3 SHALL apply `roles/verifier.md`'s own reading step — its ONE
  subtraction and no invented addition — the property
  `tools/e2e/tests/brief.spec.ts` already pins for that file.
- THE assembled verifier brief SHALL be the TWO-spawn pair
  `roles/orchestrator.md` 5d mandates, or SHALL say in the artifact that
  it is the single-message fallback. Never silently the second.
- WHEN roles/verifier.md carries its contract table THE table SHALL be written there as the deliverable the assembler already reads, deciding which rows a verifier's brief has that an executor's does not (the bench's two spawns, the attack set's and ground's digests, the blind phase's property) and which it does not need; the table SHALL be placed around, never rewording, the sentences T-311-s5 adds at step 5a and the sentences specs already pin; and the role file's reading restrictions (its one subtraction, criterion 3) SHALL stand unchanged. (absorbed from T-271-s3)
- WHEN the pack is assembled for `role: "verifier"` THE method-file lines SHALL be exactly what `methodNamed` reads off roles/verifier.md, asserted both directions as the executor arm already is, so the producer mutant measured at 5dca625 (dropping roles/executor.md from the verifier's pack) reds by name rather than incidentally. (absorbed from T-254-s4)
- WHEN the brief assembler is asked for the verifier role of a card THE render SHALL carry a context pack derived from the card's fence by the same reader map the executor's pack uses, and SHALL exit 0; WHEN the bench verb renders phase 2 THE render SHALL name the pack's path beside the sealed inputs, and an integration body SHALL show that the named pack is actually produced and readable at the ref the render names, and that a fence whose rule reaches the verifier's pack changes it — never a plausible path alone. (absorbed from T-296-s10)

## Blocked by `T-225-s2`

That lane holds `tools/e2e/scripts/brief.mjs` and
`tools/e2e/scripts/dispatch-brief.mjs` — this card's whole fence — and a
fence is not shared. It waits for that lane to land.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s2 merge (6691fc5)

The architect seat. Every verifier brief the assembler produces is refused at exit 3; waits behind T-239 on dispatch-brief.mjs by fence.

## Absorbed from T-254-s4 — The pack's verifier-seat half is never assembled: no body drives packRecs for role=verifier, and the front cannot reach that role at all, so half of \"the method files the seat's role names\" ships unexercised (kept whole)

Title as filed: "The pack's verifier-seat half is never assembled: no body drives packRecs for role=verifier, and the front cannot reach that role at all, so half of \"the method files the seat's role names\" ships unexercised"

Filed as: status suggested, priority 4, size S, touches [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts], suggested_by "T-254's verifier (phase 2), 2026-09-09, from a mutant that survived: a filter correct for the executor and wrong for the verifier passed all five new bodies".

### What was noticed (T-254-s4)

T-254's criterion 1 asks the pack to carry *"the method files the seat's
ROLE names"*, and `packRecs` implements exactly that — it resolves
`methodNamed(ctx.roleMd, roleRel, ctx.root)` off whichever role file the
seat holds. Measured at `5dca625`, the two roles genuinely differ:

    executor  5 files, 129,027 bytes   interview/decomposition.md, lane-protocol.md,
                                       roles/orchestrator.md, roles/verifier.md,
                                       tasks/TASK-FORMAT.md
    verifier  3 files,  83,358 bytes   roles/executor.md, roles/orchestrator.md,
                                       tasks/TASK-FORMAT.md

**But nothing exercises the second row.** All five of T-254's new bodies
build their context with `context({ taskId })`, which defaults to the
executor, and the fifth body reads the two role files directly through
`roleText` rather than through an assembled pack. So the per-role half of
the criterion rests on reading the code.

The mutant that showed it, planted at the producer and read back from
`git diff`:

    const method = methodNamed(ctx.roleMd, roleRel, ctx.root)
      .filter((m) => m.rel !== "method/roles/executor.md");

That is a no-op for an executor seat — `executor.md` is self-excluded from
its own pack anyway — and silently drops `roles/executor.md` from a
verifier's pack, which is the one method file a verifier most needs. **All
five bodies passed.** A blunter mutant (hardcoding the executor's role
file for both roles) IS caught, but only incidentally: it reds the
empty-pack body because that body's fixture root has no
`method/roles/executor.md` to read, which is a missing file rather than
the property.

### And the front cannot reach the role either (T-254-s4)

`node tools/e2e/scripts/brief.mjs --task T-251 --role verifier --root .`
exits **3** — `dispatch-brief: found 0 tables headed # / The brief
carries / …` — because `method/roles/verifier.md` carries no contract
table. **This is pre-existing and not T-254's doing**: the same command
exits 3 at the base `6dabfca` too, and it is recorded here only so the
next seat does not mistake it for a regression this card introduced. It
does mean the verifier's pack cannot be inspected end to end today, which
is why the gap above went unnoticed.

### What would close it (T-254-s4)

A body that assembles the pack for `role: "verifier"` and asserts its
method-file lines are exactly what `methodNamed` reads off
`method/roles/verifier.md` — the same both-directions shape the executor
arm already has (`expect(named).toBe(method.length)`), which is what makes
the executor half mutation-tight. Whether the front should also serve a
verifier brief is a larger question and belongs to whoever owns the
contract table, not to this card.

### Corroboration (the architect seat, 2026-09-09T10:05Z, at the T-279 merge) (T-254-s4)

Two readings of this card's claim, both at 2e9233d–9763afc: (1) `brief.mjs --task T-271 --role verifier` and `--task T-281 --role verifier` both exit 3 with "found 0 tables headed # / The brief carries / Assembled from / If it is absent, expected exactly one" — the arm cannot render a verifier brief at all, because method/roles/verifier.md carries no contract table (executor.md's is at its line 250); (2) T-279's phase-2 verifier disclosed in its verdict that its brief carried no context pack and read STATE whole and CONVENTIONS by bullet instead, naming it a dispatch fault by verifier.md step 0. The seat's phase-2 prompts are hand-written for that reason: the pack T-254 built reaches the executor and never the verifier. Promote when verifier.md is free (T-281 holds it).

## Absorbed from T-271-s3 — No verifier brief can be assembled at all — method/roles/verifier.md carries no contract table, so brief.mjs --role verifier exits 3 with \"found 0 tables\ (kept whole)

Title as filed: "No verifier brief can be assembled at all — method/roles/verifier.md carries no contract table, so brief.mjs --role verifier exits 3 with \"found 0 tables\"

Filed as: status suggested, priority 30, size S, touches [method/roles/verifier.md], suggested_by "executor claude-opus-5@subagent @T-271, 2026-09-09, at cc41ff3".

Measured in T-271's lane while checking whether that card's criterion 5
("the executor's and verifier's briefs carry the scoped spelling") was
met. `node tools/e2e/scripts/brief.mjs --task T-271 --role verifier`
exits **3** — COULD NOT RUN — with:

    dispatch-brief: found 0 tables headed # / The brief carries /
    Assembled from / If it is absent, expected exactly one

`method/roles/executor.md` carries that table and assembles cleanly;
`method/roles/verifier.md` carries none, so the one command this
repository has for assembling a brief cannot assemble a verifier's.
Every verifier this method has dispatched was therefore briefed by hand
against a contract nothing derives, which is the class the executor's
own table exists to close.

**This is not T-271's to fix**: verifier.md is T-281's live fence, and
T-271's manifest names three unrelated paths.

Disposition hint: the table is the deliverable, not the code — the
assembler already handles any role whose file carries one. Whoever
writes it owns deciding which rows a verifier's brief has that an
executor's does not (the bench's two spawns, the attack set's hashes,
the blind phase's property) and which it does not need.

## Absorbed from T-296-s10 — The verifier's brief renders no context pack — `brief.mjs --task <id> --role verifier` exits 3 with zero four-column tables, so every phase-2 verifier since the tiers has read the conventions by the index fallback and said so in its verdict (kept whole)

Title as filed: "The verifier's brief renders no context pack — `brief.mjs --task <id> --role verifier` exits 3 with zero four-column tables, so every phase-2 verifier since the tiers has read the conventions by the index fallback and said so in its verdict"

Filed as: status suggested, priority 2, size S, touches [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts], suggested_by "the seat (2026-09-12): the T-300 verifier's verdict names the gap as a dispatch fault the role file defines; the recovery sitting of 2026-09-11 reproduced the same exit 3 for its T-303-s1 verifier and fell back to the indexed conventions".

### What was measured (T-296-s10)

The bench verb renders phase 2 from the sealed inputs and the card at the base, and hands the verifier ground rules and paths; the CONTEXT PACK that carries the rules a fence implicates is the dispatch brief's, rendered for the executor role. Asked for the verifier role, the brief assembler exits 3 and reports zero tables with the required four-column header where it expected one, so no pack reaches the bench. The verifier role file calls a missing pack a dispatch fault and prescribes the fallback: open the conventions at the sections the index names and say so. The T-300 verifier did exactly that on 2026-09-12 and opened two bullets of a document past its warn line; the recovery's T-303-s1 verifier did the same on 2026-09-11. The rule the pack exists to keep, that a seat reads what its fence implicates and nothing more, is kept by the verifier's discipline rather than by the arm.

### T-296-s10's acceptance criteria as filed (absorbed into the criteria above)

- WHEN the brief assembler is asked for the verifier role of a card THE render SHALL carry a context pack derived from the card's fence by the same reader map the executor's pack uses, and SHALL exit 0.
- WHEN the bench verb renders phase 2 THE render SHALL name the pack's path beside the sealed inputs, and a body SHALL show a fence whose rule reaches the verifier's pack.

### T-296-s10's Implementation notes (as filed, empty)
<!-- executor appends before finishing -->

### T-296-s10's Verdicts (as filed, empty)

## Implementation notes

## Verdicts
