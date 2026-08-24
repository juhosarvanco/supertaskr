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
