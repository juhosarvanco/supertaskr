---
type: consultation
task: 
status: open
max_rounds: 3
---

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

## THE VERSION SITTING OF 2026-09-08 — the unruled list walked

The seat walked docs/VERSIONS.md's UNRULED section against the census,
the charter and the board (the cards named in each row) and proposed
four groups: already delivered under other names, v1, v2, v3+ or drop.
**RULED (@human, verbatim): "approve the v1 five, fold the rest as
proposed."** And, asked *"Can we move the Quick path below the loop to
v1?"* — RULED v1, inside T-241: the light review modes exist
(TASK-FORMAT's `same-model` and `self-verified`) and guard-class cards
are already barred from them, so the quick path is an affordance, not
a method change; success criterion 1 holds (a card and a verdict for
every merge).

The v1 five, filed planned: T-247 the dependency-legitimacy gate,
T-248 the injection scan on docs writes, T-249 the secret read guard
in the fence hook (the three security layers GSD Core ships and nputer
lacked — T-245), T-250 the gate taxonomy named in CONVENTIONS, T-251
the debt-marker limit in the landing gate. Folded: T-241 gains the
quick path, intent triggering and the honest fallback sentence; T-244
gains the two-harness v1 stance. The v2, v3+ and dropped rows are on
the version page under their dated headings; UNRULED is entry 32 alone.
No card was dispatched: @human's break of 2026-09-02 holds.

## THE SECOND VERSION SITTING OF 2026-09-08 — the rest of GSD Core's docs folder

After the whole docs folder was read (the map's sharpened conclusion 6),
the seat walked nine new items and proposed rulings. **RULED (@human,
verbatim): "approve the v1 three, fold safe undo into T-244, rest as
proposed."** Filed planned: T-252 (every SHALL clause names the suite
that will prove it, advisory at preflight — Nyquist validation in
nputer's words) and T-253 (the decomposition step asks each card's edges
and must-nots — "verifier reach = spec reach"). Folded: `undo <card>`
into T-244. v2: reversibility rating, complexity-triggered refactor,
calibrated effort estimation, forensics, the outstanding-human-checks
view. v3+: scope-reduction detection under 14. Already delivered:
verification-debt tracking (the metabolism). No card dispatched.

## THE THIRD SITTING OF 2026-09-08 — the EARS-for-the-AI-era reading

@human brought a redesign of EARS written with another session
(docs/research holds no copy; the reading is recorded on the cards it
produced). The seat's assessment: two ideas better than ours — the
decision list and the commission list — several already ours under
other names, and a few not yet. **RULED (@human, verbatim): "file it"**
on the two decision modes (T-257, with the decision list folded into
T-253), and **"as proposed"** on the rest: v1 T-258 (the commission
list as a verifier rule) and T-259 (the oracle class and the escalation
form, behind T-252); v2 catalogue-generated negatives, the two-lane
blind builder, the uncertainty-bounded pattern and the static
side-effect enumerator; six items recorded as already delivered. No
card dispatched at the sitting; the wave of five lanes was live.

## Sitting of 2026-09-09 — rooms in the mirror

@human: *"Add rooms to the mirror app in v1"* (asked after learning the mirror does not render rooms and that rooms are never deleted). Ruled: the rooms lens is v1, filed as T-275 (F-02, M, p4): every room off docs/rooms/, status, type, card, addressee, the ruling at the top, live off the watcher, read-only. docs/VERSIONS.md carries the row and the move.


## From the outside review of 2026-09-09 — ruled v2 by @human (decision 5)

An outside session reviewed the model as described in
docs/research/the-model-for-an-outside-review-2026-09-09.md and
proposed a "Supertaskr Teams" architecture beside the solo core:
distributed state in an object store or a shared git backend with
remote locks, ephemeral execution cells, a server-side integration
wall, a centralised context-caching proxy, and three human seats
(product owner, staff engineer, security auditor). @human's ruling:
**a room note as v2, not cards.** The seat's reading, recorded so the
next reader does not re-derive it:

- **Kept for v2: the server-side verdict check.** The push guard's
  verdict token is judged locally today; a pre-receive hook or a
  CI-side check that verifies the same token against the pushed tree
  hardens the existing guard without a second architecture. It is the
  one idea in the proposal that adds a guarantee.
- **Not ruled in: distributed state and a context proxy.** The folder
  is the record (NORTH_STAR; ADR-019); a Redis state machine or a
  metadata broker beside git is a second record, and the proposal's
  own "immutable, commit-bound markdown artifacts" clause concedes the
  point. A context proxy answers a cost the context pack (T-254) and
  its narrowing (T-254-s1, s2) answer inside the repository.
- **Not ruled in: containers and elastic cells.** The first user runs
  one machine (NORTH_STAR); parallel lanes on it are the scaling unit,
  and the health bands measure its edge. Nothing here forbids a
  runner-side execution cell later; nothing asks for it now.
- **Two corrections to the proposal's premises**, for the record: lanes
  are not sequential (four ran in parallel on 2026-09-09; the solo lock
  covers two suites per checkout), and "v0.1.12" is the method's
  version stamp, spent by whichever method-text change lands next, not
  a roadmap label.
