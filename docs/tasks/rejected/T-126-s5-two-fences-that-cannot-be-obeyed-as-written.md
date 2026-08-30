---
id: T-126-s5
title: Two fences on the board right now cannot be obeyed as written — one card mandates an edit its touches does not contain, and one card claims every card on the board
status: rejected
suggested_by: executor claude-opus-5 @T-126
---

Two instances, found in one lane, of the same class: a fence stated so
that obeying it and obeying the card are different acts. `T-033-s4`
already named the class — *"a criterion that mandates an edit no fence
contains is a dispatch defect, not an executor's licence"* — and it now
has a second and a third example, so it is a pattern rather than an
incident.

## ARM ONE — T-126's own criterion 7 mandates an out-of-fence deletion

T-126's `touches:` is `[app-shell]`. Its criterion 7 says the `#[path]`
shim *"SHALL BE ADDRESSED, NOT INHERITED … state whether the shim is
still needed and delete it if it is not."*

`app/src-tauri/tests/dispatch_lanes.rs` is claimed by **C-15**, whose
`touch_slugs:` is `[app-dispatch]`. So the card requires an edit its own
fence does not contain, and there is no reading of `[app-shell]` that
reaches it.

**What this lane did, disclosed rather than slipped in:** deleted it, on
the card's own authority, having first derived from `git worktree list`
that `app-dispatch` was held by **no live lane** (six lanes at the base
commit: T-091 `[tools/e2e]`, T-104 `[method/, docs/CONVENTIONS.md,
app-agent]`, T-108 `[docs/tasks/]`, T-116 `[app-map]`, T-129
`[crate-index]`, T-126 `[app-shell]`). The alternative — leave it and
route — ships a tree where `dispatch/**` is compiled TWICE and its 34
bodies run twice, and where the file's own header says the commit taking
`T-110-s1` removes it.

**The fix is one word in the card**: `touches: [app-shell, app-dispatch]`.
It was available at dispatch — the shim's path is named in the card's own
criterion — so this is a dispatch-time defect and not a discovery.

## ARM TWO — T-108 holds `[docs/tasks/]`, which is every card on the board

`docs/tasks/T-108-*.md` carries `touches: [docs/tasks/]`. Every executor
in this project writes to `docs/tasks/T-NNN-*.md`: `method/roles/executor.md`
step 5 requires implementation notes and step 6 requires the status
stamp, and ruling NINE requires the lane to stamp `verifying` itself.

So **T-108's fence is disjoint from no lane that has ever run here**,
including this one. Three lanes were live alongside it at this base and
all three owe their own card a write.

STATE's own table records T-108's fence as
`[docs/tasks/T-027-…, T-025-…, T-081-…]` — THREE NAMED CARDS — which is
disjoint from everything and is presumably what was intended. **The card
on disk says otherwise**, and the card on disk is the authority. Whether
the repair is narrowing the card to its three paths or writing down that
a lane's OWN card is exempt from every fence is a ruling; the second is
probably the real one, because the exemption is already universal
practice and nothing states it.

## Why one file for both

They are the same failure and they want the same ruling: a fence is
checkable only if the card it fences can be built inside it.
`method/tasks/TASK-FORMAT.md` owns the field and
`method/roles/orchestrator.md` owns the act of setting it, so the check
belongs at dispatch — "does every criterion name a path this `touches:`
reaches?" — which is a mechanical question nobody asks today. Read it
beside `T-033-s4` and with `T-104`, where the method half lands.

## Fence

`[method/, docs/tasks/]` for the ruling; arm two's narrowing is
`[docs/tasks/]` and is T-108's own to make.

Amnesty triage 2026-08-29 (triage seat): PARKED — THE GENERAL RULING LANDED. method/tasks/TASK-FORMAT.md now carries "A CRITERION MAY NOT ORDER WORK OUTSIDE ITS OWN CARD'S touches:" with the whole argument — widen the fence BEFORE dispatch or write the criterion as a ROUTE, a card whose criterion and fence disagree is a DEFECTIVE CARD, and a criterion-shaped exception cannot be granted because every out-of-fence edit is made because some criterion seemed to want it. It arrived via T-132 (b1783a6). Both named instances are historical: T-126 and T-108 are done. ONE RESIDUAL SURVIVES and is arm two's real question, still unwritten anywhere: whether a lane's OWN card is exempt from every fence. The exemption is already universal practice — every executor writes implementation notes and a status stamp into its own card — and nothing states it, so T-108's [docs/tasks/] fence was disjoint from no lane that has ever run here and nobody noticed. RESURFACES: the next method/ dispatch — T-159 owns method text, and the residual is one sentence in TASK-FORMAT or lane-protocol saying that a lane's own card is outside every fence.

ARCHIVED AS **DISCHARGED — NOT DECLINED** (2026-08-30, `T-159-s1`, the card triage promoted to write T-159's rider stamps). The finding was right on both arms and BOTH of them were already closed when the parking note above was written — which is the fact this entry exists to carry, because the note says the residual is *"still unwritten anywhere"* and it was not. **Naming the commit, as this project's archive wording requires: `9dfb5a0` — "T-134: a fence names paths, a slug is shorthand, and the comparison is over the expanded sets", 2026-08-26**, three days before the amnesty sitting. Re-derived at `51fa31c` rather than taken on anyone's word: `git log -S "A CARD'S OWN FILE IS NEVER PART OF ITS OWN FENCE" -- method/lane-protocol.md` returns exactly ONE commit and it is `9dfb5a0`; the same commit carries `SO THE FENCE DOES NOT GOVERN WRITES TO IT, AND A LANE WRITING TO ITS OWN CARD IS NOT A FENCE BREACH` (`lane-protocol.md:229-230`) and, in the same landing, `A DIRECTORY THE PROTOCOL ITSELF WRITES TO ON EVERY CARD IS NOT FENCEABLE BY ANY CARD` (`:214-215`) together with the parser half that enforces it, `UNFENCEABLE_PATHS = ['docs/tasks']` in `lib/parser/src/fence.ts:55`. **So arm two got more than it asked for**: it wanted a ruling on whether a lane's own card is exempt, and what landed is the exemption AND a mechanical refusal of the fence that raised the question — this card's own `T-108` instance can no longer be written down. Arm one's general ruling landed one day earlier still, at `b1783a6` (T-132, 2026-08-25), as `A CRITERION MAY NOT ORDER WORK OUTSIDE ITS OWN CARD'S touches:` (`method/tasks/TASK-FORMAT.md:63`). Both named instances are historical — T-126 and T-108 are `done`.

**ONE CORRECTION TO THE RECORD, MADE HERE BECAUSE THIS IS THE FILE THAT PROVES IT.** T-159's implementation notes credit this discharge to *"T-154 AFTER the parking note was written"*. Both halves of that sentence are wrong at `51fa31c`: the commit is `9dfb5a0` (T-134) and it predates the parking note. The verifier's spot-check was right that the clause was present at the base `9a8a2e9` and did not look further; nothing downstream depended on the attribution, so this is a citation repair and not a defect in the disposition — the disposition was DISCHARGE either way.
