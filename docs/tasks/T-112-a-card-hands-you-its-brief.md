---
id: T-112
title: A card hands you its brief — the contract transcribed, for any agent, CLI or app
feature: F-04
milestone: 4
priority: 5
size: M
status: planned
blocked_by: [T-111]
touches: [app-dispatch, app-board]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-089-s3 — files removed in this commit.

The slice's last act, and the one that makes the follower-first ruling
real. `genesis_kickoff` is the working precedent: it assembles a
kickoff for a human to paste into their own terminal, and ADR-017
point 5 makes hand-driven a first-class mode rather than a fallback
nobody built. **Dispatch gets the same instrument before it gets a
spawn**, for the same reason — any model, any CLI, and, as this
session measured, any agent that exists only as a desktop app and can
never be spawned at all.

**T-089 wrote the contract this card transcribes**: a 13-row normative
table in `method/roles/executor.md`, each row naming what it carries,
what it is assembled from, and what a session guesses when the row is
absent. That card was **rejected once for exactly the failure this one
must not repeat** — its verifier tried to follow the table by hand and
five of thirteen rows did not yield their content, while the card's own
example brief silently went elsewhere on four of them. The fix wrote
the missing sources, including a `## The report` spec that had not
existed. **This card's assembler is the second reader of that table,
and it will find whatever the hand-walk missed.**

Three residuals are known and open (`T-089-s9`): row 9 is row 8's
untwinned twin; row 5's slug↔path map is named but not located
(`docs/ARCHITECTURE.md` plus each component's `touch_slugs:`); and row
11 tells a size-S executor to "checkpoint" while no source it names
defines one. **This card SHALL NOT silently paper over them** — where
the table is still ambiguous, the assembler either resolves it against
a named source or reports the row as unassemblable.

## Acceptance criteria

- THE app SHALL gain one command assembling the executor brief for one
  card, **transcribing T-089's table row by row**, returning a typed
  outcome. The command's argument surface SHALL be the narrowest that
  works — ADR-012's "narrowness lives in the command's own signature" —
  and anything crossing the boundary SHALL be justified rather than
  defaulted to a path. **The IPC census moves and SHALL be corrected at
  both ends, never widened**; `acl_pin.rs` SHALL be a 0-file diff at 92
  grants, because an app command is not a webview grant.
- **EVERY ROW OF THE TABLE SHALL BE ACCOUNTED FOR IN THE OUTPUT**, and a
  pin SHALL assert each is present and non-empty: role, card id and
  path, the read-first set, the lane, the fence, setup, the gate
  commands read from the project's own CONVENTIONS, the standing
  disciplines, the prohibitions, the deliverable, the report spec, and
  the correction clause. IF a row cannot be assembled from its named
  source THEN the outcome SHALL say **which row and which source**, and
  the card SHALL file it against `T-089-s9` rather than inventing a
  value.
- THE brief SHALL carry the lane commands for that card — worktree and
  branch in the project's own spellings — and **the command that finds
  the commit to cut from**, so a human never has to remember DISPATCH
  FROM THE LAST CHECKPOINT. Per the plan's ruling the brief carries the
  *command*, not the resolved answer: **no git subprocess in this
  card.** T-013 spent a rejection on a git subprocess getting its
  program from the opened project; this slice does not need one.
- **THE BRIEF SHALL BE ASSEMBLED FROM FILES AND NEVER FROM WHAT A MODEL
  SAID.** A pin SHALL prove it the way T-028's completion detection was
  proved: hand the assembler a card object that throws on any field it
  is not entitled to read, and require a brief.
- **THE VERIFIER'S BRIEF SHALL WITHHOLD THE EXECUTOR'S REASONING, and
  this is the card where the program finally beats the practice.**
  `verifier.md` forbids the verifier the executor's notes; `executor.md`
  puts those notes in the file the verifier reads. Three leak paths are
  documented (`T-089-s2`): the card body, the verdict, and — measured
  this session — the architect's own brief relaying the executor's
  reasoning. A human cannot un-read; the assembler can simply not send.
  A pin SHALL prove the exclusion by construction: give the assembler a
  card whose implementation-notes section throws on read, and require a
  verifier brief.

  **AND THE CLAIM THAT THE LEAK IS UNAVOIDABLE IS FALSE** — three
  verifiers declared exposure unavoidable "via a single `cat`" and each
  was one command from not having it. **The interim discipline is
  `T-121`'s and this card SHALL NOT restate it**; read it there and
  cross-reference, because a rule with two implementations is two
  chances to disagree (T-057) and this paragraph has already been one
  of them.

  **CORRECTED 2026-08-24, seventh triage.** An earlier revision of this
  criterion named `sed -n '1,86p'` as the boundary. **T-121 measured
  that number and refuted it in both directions** over all 166 flat
  cards: of the 88 carrying `## Implementation notes`, **41 have it at
  or before line 86** — so the read leaks the reasoning anyway — and
  **47 have it after**, where it truncates the criteria the verifier
  exists to attack. Exactly two land where the number works. The
  boundary must be **derived** (the first `## Implementation notes` or
  `## Verdicts` heading), not numeric. The architect wrote the wrong
  number into this card and relayed it through five briefs, which is
  the same defect T-085 and T-086 exist to fix — a claim retracted in
  one place and still asserted in another.
- THE detail panel SHALL render the brief in a copyable block **only for
  a card whose T-111 disposition is `dispatchable`** — a brief for a
  card you must not dispatch is an invitation to break the fence — and
  SHALL render the disposition's reason instead when it is not.
- IF the assembler cannot read something the brief requires THEN it
  SHALL return a typed outcome naming what was missing, and the panel
  SHALL render that instead of a partial brief. **A brief with a
  silently missing gate list is worse than no brief** — this session
  produced three briefs with stale figures and every one cost a lane
  real time.
- IF a card is dispatched by hand from this brief THEN nothing in the
  app SHALL need to be told: the lane appears through T-110 when the
  worktree lands. A pin SHALL drive that end to end over a fixture
  repository.

Verification: headless — `cargo test` from app/src-tauri for the
assembler and its typed refusals; one app-side DOM test for the
copyable block and for its absence on a fenced card; the IPC census
re-derived from both ends and intersected; `acl_pin.rs` quoted with its
sha256. The DOCS GATE fires; run what it owes. **@human, and it is the
slice's closing evidence: one hand-driven dispatch of a real card using
only this brief, into any agent — the measured proof that the pasted
brief and a spawned one are indistinguishable to the repository.**

PLANNING PREP (2026-08-30, integrator, @human's ruled night order —
derivation only, no dispatch): the flip pairs at 558d660. Direct slug
sharers among planned cards: ONE — T-031-s1 (app-board). But the slug
map shares C-11 between app-board (C-08,C-09,C-11,C-17,C-18) and
app-shell (C-05,C-10,C-11,C-16), so T-112's expansion overlaps EVERY
app-shell card's through C-11 — nineteen planned cards flip with it
(derive: the awk-over-touches sweep in this note's checkpoint record).
Consequence for the dispatch decision: T-112 runs alone against the
whole shell train; its natural slot is a quiet-shell window right
after a checkpoint, and T-031-s1 (the double sharer) should be ruled
before or absorbed into it. The C-11 sharing itself is the lever — if
design tokens moved to their own never-fenced slug, app-board and
app-shell would decouple and T-112's collision surface would drop
from ~19 to 1. That is an architecture ruling, not a lane's act:
@human decides dispatch timing, or the C-11 split first.

CORRECTION 2026-08-30 (T-163's lane, at `71ce2422089c` — the note above
is STALE from this ref forward and is kept rather than rewritten,
because a retraction that erases what it retracts leaves nobody able to
check it). **THE C-11 SPLIT HAPPENED**: @human ruled it, T-163 executed
it, and `docs/architecture/components/C-11-design-tokens.md` now carries
`touch_slugs: []` — design tokens claim NO slug at all rather than a
never-fenced one, for the reason argued at that field. The lever the
note describes has been pulled, so the figure it stamps no longer holds.

**RE-DERIVED AT `71ce2422089c`, BOTH SIDES AT ONE REF**, by sweeping
every flat `docs/tasks/T-*.md` at `status: planned` through
`fenceOverlaps` in tools/e2e/scripts/dispatch-brief.mjs — the SAME
comparator the dispatch brief's row 5 uses, rather than the note's own
awk-over-touches sweep, which is why the before-figure below is not the
note's **~19** either. 325 flat cards read, 67 of them planned;
T-112's `touches:` is `[app-dispatch, app-board]`, unchanged.

| C-11's `touch_slugs:` | planned cards whose fence overlaps T-112's |
|---|---|
| `[app-shell, app-board]` (before) | **27** |
| `[]` (after) | **2** |

**AND THE TWO SURVIVORS ARE NOT THE SAME KIND OF SURVIVOR**, which the
bare count hides. `T-031-s1` overlaps on `the same entry` — it declares
`app-board` itself, and it is the ONE direct sharer the note already
named; that row is exactly what the note predicted would remain.
`T-163` overlaps on `app/test`, through `app-board`'s own expansion, and
it is a LANE that stops existing the moment this correction merges — so
the standing answer to "what still flips with T-112" is **ONE card,
T-031-s1**, which is the note's own prediction met. Of the 25 rows that
left, every one left for the same reason and the comparator said so in
as many words: `both reserve app/src/assets/**` — C-11's own territory,
reached from an `app-shell` fence that never meant to reserve it.

**THE BEFORE-FIGURE DISAGREES WITH THE NOTE AND THAT IS RECORDED RATHER
THAN RECONCILED AWAY**: 27 against ~19, two sweeps of the same question
at two refs (`558d660` then, `71ce2422089c` now) through two different
comparators. The note routes its reader to its checkpoint record for its
sweep; this correction routes to `fenceOverlaps`. Where they differ, the
comparator the FENCE is actually computed with is the one a dispatch
decision has to trust.

**WHAT THIS DOES NOT DECIDE**: T-112's dispatchability. The note's
advice to rule or absorb `T-031-s1` before dispatching stands unchanged
— the split removed the C-11 train, not the direct sharer — and @human
still owns the timing.

THE COLLIDER RULING, 2026-08-30 (standing triage sitting #3, architect
seat, `@ 51fa31c0964c`): **`T-031-s1` IS SEQUENCED BEHIND THIS CARD,
NOT ABSORBED INTO IT. THIS CARD DISPATCHES FIRST.** The note above asks
for exactly this ruling and it is now taken; the reasoning is written in
full on `T-031-s1` and summarised here so a dispatcher reading only this
card gets the answer.

Absorption was weighed and refused on the merits. The two contracts are
unrelated — this card assembles a brief from files and renders it; that
card is the board's containment pass, anchoring the verdict splitter at
column 0 in the shell-owned module that card names, giving two surfaces
`break-words`, and replacing a class pin with a property assertion.
**Read the surfaces on `T-031-s1` and not here**: naming that module's
path in this card's body is itself a fence claim this card cannot make,
which the preflight refused on when this note first tried it. And
absorption would have made this card WORSE OFF: `T-031-s1`'s fence is
`[app-board,
app-shell, tools/e2e]`, so folding it in would push this card's
`[app-dispatch, app-board]` to include `app-shell` — re-acquiring the
whole shell train that the C-11 split removed, and undoing the
27-to-1 improvement the correction above measured. Clearing the last
collider by widening the fence is not clearing it.

**SO THIS CARD'S COLLISION SURFACE IS UNCHANGED AND ITS LAST NAMED
COLLIDER NOW HAS A WRITTEN ORDER.** What remains before dispatch is
@human's timing call, which this seat does not take, and the ordinary
`brief.mjs --task T-112` fence check against whatever lanes are live at
that moment — which at this base is not empty: `T-143-s3` holds
`app-board` right now, and `node scripts/brief.mjs --task T-112` from
the e2e package exits 1 naming it. That is a lane, not a card, and it
clears when the lane lands.
