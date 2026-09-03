# Room: version planning — which charter features build v1, which wait

Opened 2026-08-30 at @human's directive: *"I don't want all the
features from the charter to automatically go into the execution
queue right now. We should plan and evaluate which features to select
and build for version 1 and which to leave for version 2 or later."*

## THE STANDING RULE, effective immediately

The Beyond-the-Playbook charter (artifact, 31 entries) is a VISION
document, not a backlog. **No feature enters the board from it
without a version ruling from @human.** A card citing a charter entry
as its origin must also cite the version ruling that admitted it.
Audit at opening: nothing has auto-flowed — every charter-adjacent
card on the board traces to an explicit @human ruling (T-167/T-168
to the two-track sitting approval; T-169 to the D5 ruling; T-170
parked and gated on its own trigger).

## The draft partition — integrator's recommendation, @human rules

The honest baseline first: charter entries 05–13 (Ring 2) mostly
EXIST inside nputer already — preflight, fences, drills, blind
verification, record-first landings, health bands, the metabolism,
seat economics. For those the version question is not "build?" but
"productize and expose?", which is a different, cheaper decision.

**v1 — the smallest product that makes NORTH_STAR honest** (a solo
developer runs the whole loop on their own project):
genesis + board + dispatch complete (the existing F-01…F-04 arc:
T-112's brief, the milestone-3 walk); skills into genesis (entry 01 —
already building on @human's approval); customization by interview
(entry 03, in whatever FORM T-168's brief gets ruled); the launcher
(T-164). Ring 2's machinery ships as it already is — working
internals, documented, no productization pass owed for v1.

**v2 — teams and depth**: stage slots (02), fleet fences /
team-enablement (16 + that room), the Ring 2 productization pass
(dashboards and surfaces for preflight, economics, bands),
competitive execution (T-170, entry 21), environment tiers (04, when
services ship).

**v3+ — the horizon**: entries 14–20 and the gift registry (23–31)
— revisited when v2 lands and the future has arrived a bit more.

## What the sitting decides

One pass over the partition above: @human moves entries between
versions, rules v1's cut line, and the ruling is recorded here.
Until that sitting, the standing rule holds and the in-flight work
(@human-approved) proceeds.

RESOLUTION (2026-08-30, @human, in session): **THE DRAFT PARTITION ABOVE IS
APPROVED AS WRITTEN.** v1, v2 and v3+ are as drafted; no entry moved
columns at this ruling. The standing rule stands unchanged for anything
NOT in the partition — a charter entry still needs a version ruling
before it reaches the board.

**ONE ITEM CARRIES A KNOWN DEPENDENCY AND @human DEFERRED IT
DELIBERATELY**: *customization by interview* (entry 03) sits in v1 while
FORM-FIRST still holds — no customization UI is designed before the form
decision (`docs/rooms/customization-form.md`,
`docs/rooms/loop-customization.md`). @human: **"lets leave the form
decision for tomorrow."** So v1's cut line is ruled and this one entry's
BUILDABILITY is not; it is approved into v1 and gated on the form
decision, not on a second version ruling. The seat flagged the cost at
the ruling: `T-173` turned out to be size L — it moves a shipped
interview document and a nine-row table transcribed cell-by-cell into
`BANKING_MAP` — so if the form decision slips, moving entry 03 to v2 is
the cheaper correction than letting v1's scope drift.

**CORRECTION (2026-08-31, the seat that wrote the paragraph above).
THE FORM DECISION WAS ALREADY RULED WHEN THIS WAS WRITTEN, AND THE SEAT
DID NOT CHECK.** `docs/rooms/customization-form.md` carries
*"RESOLUTION (2026-08-30, @human, all nine ruled the same day the brief
landed)"* — Q1 **hybrid, in the asymmetric shape**: files ARE the
system; the app reads, explains, proposes and routes, and never authors.
Landed at commit `3b2057b`.

So FORM-FIRST is **DISCHARGED**, not pending. @human's *"lets leave the
form decision for tomorrow"* was given in answer to this seat's
INCORRECT statement that the decision was outstanding, so it deferred a
decision already made. This correction withdraws the seat's premise, not
@human's ruling.

**CONSEQUENCE: entry 03 is NOT gated and `T-173` may be dispatched on
its merits.** What still binds it is the customization room's own closing
sentence — *"The UI cards these rulings unblock are cut at a sitting
under the version-planning room's standing rule, not automatically"* — so
it enters at a sitting like anything else, and its size-L method bump is
a cost rather than a gate.

ADDENDUM (2026-08-30, @human's idea, reviewed and adopted): **THE
VERSION TABLE** — a selector surface in nputer where charter entries
and feature-shaped cards are dragged between version columns. Reviewed
GOOD with one improvement: versions ARE milestones (card frontmatter
since birth), so the surface needs no new storage — a drag is a
PROPOSAL committed as milestone stamps (the Q2 propose-only pen; the
Q4 stampable-field ruling), and each planning sitting lands as one
record listing its moves (the Q8 audit rule applied to planning).
Charter entry 22; builds under this room's own standing rule, at a
version sitting, like everything else on that page. The draft
partition markup @human owes could be its first customer — until the
surface exists, the markup happens in prose or widgets.

## THE v1 FUNCTION LIST — sitting of 2026-09-03 (@human: "Lets move forward with what you just said")

The 2026-08-30 partition named v1 by charter entry and feature; @human
asked on 2026-09-03 for the FUNCTIONS ("What will all the features and
functions be in v1 of nputer?") and whether one file lists v1, v2 and
v3. There was none — the ruling here, the charter artifact, the older
docs/future.md and ROADMAP's milestones each held a piece. This
section is the function list; the charter is now checked in beside it
(docs/research/beyond-the-playbook-charter.md, every entry carrying
its ruled column). One planning sitting, one record of its moves (the
version-table addendum's own rule).

**v1 — what the solo developer gets** (the partition of 2026-08-30 plus
ADR-021 of this sitting):

- **Method** (F-01): the convention as versioned and eval-gated —
  cards, fences, verdicts, checkpoints, the three-tier governing docs,
  the generated behaviour census, health bands over the method's own
  metrics. Genesis ships it into any empty folder.
- **Interview** (F-03): the seven-question genesis producing the five
  governing docs, the first cards and a board; skill packs loaded into
  genesis (entry 01, T-167 done); customization by interview (entry
  03, T-173 planned, size L); the cold-start seam's operational owner
  (T-175 planned). **Per ADR-021 the interview ships as ONE interview
  in two lenses** — a skill in the agent app (T-242) and the app's
  split view; one prompt, one file contract.
- **Board** (F-02): the story map rendered live off files, the detail
  panel, the lanes view reading git with no subprocess, per-card
  dispositions with reasons.
- **Dispatch** (F-04): the dispatch view (what can start and why the
  rest cannot), the brief as a written contract, the fence enforced at
  the write, card preflight, blind verification as a property of the
  spawn, binding model assignment with mismatches flagged, T-239's
  one-command arm. The app spawns nothing. **Per ADR-021 the seat
  itself ships as a skill** (T-241) over that arm.
- **Map** (F-06): architecture and tasks lenses, intent overlaid on
  reality, drift, cycles, blast radius, churn, the graph budget with a
  measured reason.
- **Ring 2 machinery, shipped as it is** (entries 05–13): preflight,
  fences and dispatch sets, proof of teeth, blind verification,
  record-first landings, merge pre-proof, process vital signs, the
  metabolism, seat economics. Working internals, documented; the
  productization pass is v2.
- **The launcher** (T-164, done).
- **New at this sitting (ADR-021):** the seat skill (T-241), the
  interview skill (T-242), the app opening on a folder from outside so
  a skill can put the mirror beside the chat (T-243), and nputer's CLI
  packaged as `npx nputer` — C-02, listed planned in ARCHITECTURE
  because nothing packages the scripts yet (T-244, size L).

**Left v1 at this sitting:** F-05's in-app orchestrator conversation
and any in-app spawn path (ADR-021) — "not before v2, and only on
evidence a user wants it". Rooms and resolutions stay files under the
method. Still outside v1 as before: a Codex spawn adapter inside the
app (`ADAPTERS` stays at one entry), the archaeology variant
(ADR-005), the non-coder spec studio (ADR-006 layer 2), charter rings
3 and 4. Milestone 0 still carries its one open box, the domain and
trademark sweep.

**The moves, listed:** F-05's conversation and spawn path: v1 → v2 or
later. Added to v1: T-241, T-242, T-243, T-244 (all PLANNED, none
dispatched — @human's standing instruction of 2026-09-02 holds). No
charter entry changed column. The charter carries 32 entries where
this room said 31 (entry 23 sits in Ring 3 in the artifact; the
registry is 24–32); entry 32 reads v3+ by its ring and awaits
@human's word.

**Asked at the same sitting, measured, NOT ruled:** a rename of the
product. The measurement is in the 2026-09-03 sitting record in
docs/checkpoints/; docs/rooms/naming.md is where a rename reopens.

**THE BY-VERSION VIEW (same sitting, @human: "I need a file where i can
go and see which features are v1, v2, v3+"):** docs/VERSIONS.md — one
page transcribing this room by version, the charter entries by number,
and docs/future.md's parked items as UNRULED. It never rules; every
version sitting re-touches it in the same commit as this room.
