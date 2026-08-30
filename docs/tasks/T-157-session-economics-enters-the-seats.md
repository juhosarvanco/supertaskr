---
id: T-157
title: Session economics enters the seats — the method governs what sessions read but nothing about how they run
feature: F-01
milestone: 4
priority: 36
size: S
status: done
blocked_by: []
touches: [docs/checkpoints/, tools/e2e]
builder: claude-opus-5@subagent
verifier:
built_by: claude-opus-5@subagent
verified_by:
review:
---

ADR-020's companion adoption, from the token-economics comparison
(2026-08-29). The structure already institutionalizes the big plays —
one-lane-one-session IS /clear-by-construction, the budgeted
read-first set IS the startup cleanup — but the seats have no
run-hygiene text at all, and the seat most exposed is the one that
persists: the architect session that produced eight derivation errors
had run eleven verdicts in one accumulating context.

## What lands where

1. **Per-seat run hygiene** (method text, rides `T-159`'s bump):
   model and effort set at session start, never switched mid-lane
   (the cache is the economics); STANDING seats — orchestrator,
   integrator — compact between dispatches; noisy jobs (log grinds,
   suite output triage) run in subagents that return only their
   answer; commands carry quiet flags where the count survives
   (reading the COUNT as well as the exit remains the law).
2. **The brief's recommended-model row** (tools/e2e): derived from
   the card's own `size:` and kind — the know-vs-try heuristic made
   mechanical. Advisory, never enforced; the card's `builder:` intent
   field stays authoritative (the D5 ruling).
3. **The metrics slot's stamped lines** (docs/checkpoints/TEMPLATE):
   tokens spent this card (a live-environment fact — STAMPED in the
   record, never derived from the tree) and total gate runtime, so
   the machinery's own cost trends instead of being anecdotal.

## Acceptance criteria

- WHEN a brief is assembled THE recommended-model row SHALL derive
  from the card and say so, never from the assembling session's own
  dials.
- WHEN a checkpoint record is written THE metrics slot SHALL carry
  stamped token and gate-runtime lines or an explicit
  "not derivable here" — never silence.
- IF the hygiene text and the brief row disagree THEN the method text
  is the authority and the row cites it.

## Implementation notes

Built on `task/T-157-session-economics`, base `88890d0`, tip stamped in
the report. Two of the three deliverables land; the third is method
text this fence does not reach and is routed, not skipped.

### What landed

**The brief's recommended-seat line** —
`tools/e2e/scripts/session-economics.mjs` (new), printed by
`brief.mjs`'s `--task` arm BELOW the contract rows. Three signals, all
read off the card: `size:` against the ceremony table's lightest tier;
the `touches:` fence expanded through the component registry (a
component SLUG is a blast radius, an explicit path is a file list); and
the acceptance criteria against the five EARS patterns, which are READ
from `method/interview/decomposition.md` rather than transcribed. KNOW
needs a majority; a tie goes to TRY.

Four things about it are deliberate and each has a reason a verifier
should test rather than take:

1. **It is not a contract row and must never become one by accident.**
   The row set is read from `method/roles/<role>.md`, and
   `dispatch-brief.mjs` reports "a deriver whose row the table no
   longer carries" as a finding. So the line is printed OUTSIDE
   `assembleBrief`, labelled as not one of the rows, and derives none
   of them. Making it a row is a method version bump — routed on
   `T-157-s1`.
2. **It names a seat STRENGTH, never a model.** ADR-003 settles that
   this project passes no `--model`, and D5 (`model@session`) is
   deliberately HELD. The two phrases live in one frozen `SEAT_PHRASE`
   value so the rule can be asserted over the whole vocabulary — see
   the drill, where that was not true the first time.
3. **The card's `builder:` outranks it, and the line says so on every
   run** — filled or empty, both branches print.
4. **The role file's run-hygiene text outranks it too, and the line
   goes looking.** `hygieneSection()` scans for a `##`/`###` heading
   carrying the word "hygiene", quotes it above the verdict where it
   finds one, and says plainly that there is none where there is none.
   Today every brief prints the absence.

**The metrics slot** — `docs/checkpoints/TEMPLATE.md` now names three
lines (rework cycles, tokens per seat and summed, gate runtime per gate
and summed), stamps the last two as LIVE facts carrying a clock and
never a commit, and requires `not derivable here` WITH A REASON rather
than silence or a bare phrase. Three records already carry the bare
form deferring to this card.

### The one thing that CANNOT be a keeper, said plainly

**Criterion 2 has no mechanical enforcement and must not get one.**
ADR-019's Records clause forbids any suite, gate or generator from
depending on `docs/checkpoints/`'s contents, so a body that read the
template — or the records — to check the slot would create exactly the
coupling the clause exists to prevent. The template is a WRITING
instruction; the criterion is discharged by the instruction being
there, and the honest statement of that is in the template itself and
in the new spec's header. A verifier looking for a test of criterion 2
should find this paragraph instead, and the routed reporter on
`T-157-s2` is the only mechanism ADR-019 permits: by hand, over a
directory given as an argument.

**And the enforcement is subtler than the clause.** `docs-scan.mjs`
derives the DOCS GATE's reader set from docs-shaped literals in the
source corpus, so a `docs/…` string written purely to CITE something
would enrol the file as a READER of that directory. The new module
therefore cites every ruling by id and never by path, and the census
at the tip confirms it: 23 readers, unchanged, with no new row for
`docs/checkpoints`.

### The poison drill — 10 mutants, 10 kills, one of them a repair

Committed first (`DRILL AT A COMMIT`), then mutated one side only —
always the producer, never an assertion — then restored and proved.

| # | mutant (producer side) | suite result | restoration |
|---|---|---|---|
| M1 | combination rule → the strict any-TRY rule it replaced | exit 1, 1 failed / 9 passed | sha256 matches `HEAD:` |
| M2 | `isEars` drops the SHALL half | exit 1, 1 failed / 9 passed | sha256 matches |
| M3 | `earsKeywords` empty-set guard disarmed | exit 1, 1 failed / 9 passed | sha256 matches |
| M4 | `hygieneSection` can no longer see a heading | exit 1, 1 failed / 9 passed | sha256 matches |
| M5 | the derivation reads a session dial | exit 1, 1 failed / 9 passed | sha256 matches |
| M6 | `lightestTier` stops reading the ceremony table | exit 1, 1 failed / 9 passed | sha256 matches |
| M7 | the seat vocabulary names a model | exit 1, 1 failed / 9 passed | sha256 matches |
| M8 | the block stops saying it is not a row | exit 1, 1 failed / 9 passed | sha256 matches |
| M9 | `optionalSection` throws on a missing heading | exit 1, 1 failed / 9 passed | sha256 matches |
| M10 | `brief.mjs` stops printing the block | exit 1, 2 failed / 8 passed | sha256 matches |

**M7 SURVIVED ON ITS FIRST RUN — 10 passed, exit 0 — and that is the
most useful thing in this card.** The body forbidding a vendor model
name read the rendered recommendation off a live card. That card takes
the KNOW arm. The mutant moved the TRY phrase, which never rendered, so
a rule ADR-003 states about EVERY recommendation was being checked
through whichever arm today's board happened to take. The repair was to
the PIN, not to the mutant: both phrases became one frozen value the
body asserts over in full, and then that the rendered line really comes
out of that value. Re-drilled at the repaired commit: killed.

### Corrections — where the card and the brief were wrong

1. **The card cites "the D5 ruling" for `builder:` being authoritative,
   and D5 is not a ruling.** `docs/design/dispatch-technical-plan.md`
   says D5 (`model@session`) "is deliberately HELD pending a
   north-star-level question". The decision that makes `builder:`
   authoritative is **D3**, ruled by @human on 2026-08-20: the app may
   write exactly `builder:` and `verifier:`, because the card is the
   only channel reaching an agent on another machine. D5 is still
   load-bearing here, but for the OTHER half of the design — it is why
   the line may not name a model at all. The tool cites D3 for
   authority and ADR-003/D5 for the no-model rule. **The card's spec
   text was left alone**: correcting an author's citation is not this
   seat's write.
2. **"the know-vs-try heuristic" appears nowhere in this repository**
   — only in this card. It arrived with ADR-020's provenance article,
   so the mechanical form is this lane's reading, not a transcription
   of a rule that exists somewhere. Named so a verifier tests the
   reading rather than looking for the source.
3. **This card's own third criterion is not EARS-shaped.** It opens
   with `IF` and never reaches `SHALL`, so the tool this card built
   reports 2 of 3 on the card that asked for it. The preflight was
   CLEAN at `409ae54` and had no opinion about criterion shape —
   routed as `T-157-s3`, with the derivation already exported.
4. **The ceremony row is the dispatcher's and it was named, against
   the rule of thumb.** TASK-FORMAT's thumb rule is "docs, method and
   tooling self-integrate; anything a user could run does not", and
   this diff is docs plus dev tooling — the self-integrating row. The
   dispatch named `verifying`, which is the dispatcher's call to make
   ("state which it is when you dispatch"), so `verifying` is stamped.
   Flagged rather than decided: if the integrator reads the row the
   other way, this card takes `done` and self-integrates.

### Owed to the integrator

- **`npm run capabilities:check` exits 1 — STALE** (committed 23770
  bytes, fresh generation 24849) because this card adds a spec file.
  `docs/CAPABILITIES.md` is OUTSIDE this fence, so the regen is
  refused and routed, not reached for — T-153-s8's class. It is in no
  CI step and no standing gate; it is a generator whose output the
  integrator regenerates.
- **The DOCS GATE FIRES** on `docs/checkpoints/TEMPLATE.md` (readers:
  `docs-gate.mjs`, `shell-frame.spec.ts`, `window-contract.spec.ts`),
  owing `npm test from tools/e2e/` — run, 313 passed, exit 0. The card
  edits add `docs/tasks/`, whose readers are the parser and app suites;
  both run green here too.

### Least confident

The criteria signal is the one I would attack. `isEars` requires an
opening pattern keyword AND `SHALL`, which is a reading of
decomposition.md rather than a rule it states in those words — and it
decides a third of the verdict for every card on the board. It is also
the signal with the most room to be wrong quietly: a criterion split
across a nested list, or one whose keyword is inside emphasis this
strip does not remove, reads as malformed and pushes a card toward TRY
with no sign that anything was misread. T-160-s2 already records the
indented-block blindness in the neighbouring reader.

## Verdicts
