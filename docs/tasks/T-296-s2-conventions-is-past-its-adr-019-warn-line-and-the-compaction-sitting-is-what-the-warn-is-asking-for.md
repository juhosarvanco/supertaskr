---
id: T-296-s2
title: "docs/CONVENTIONS.md is past its ADR-019 warn line and the next rule to land pushes it further — the compaction sitting is what the warn is asking for, and no lane can do it inside its own fence"
feature: F-04
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-296, measured at the lane's tip, 2026-09-10"
blocked_by: []
touches: [docs/CONVENTIONS.md, docs/conventions/standing-gates.md]
builder:
verifier:
built_by:
verified_by:
review:
---

Measured in this lane: the document was 145031 bytes at the base, under
its 146878-byte warn line, and 147605 bytes at the tip — 727 over. The
gate exits 0 (the fail line is 176253) and this is a WARN doing its job,
reported rather than absorbed.

The two additions are the GUARD-CLASS PATHS bullet, which is the
project's half of a rule whose other half is in the method and cannot
live here, and the XS-bound keeper's change from refusing to bumping. The
lane trimmed both by about 1100 bytes after the first reading and stopped
there: ADR-019's rule is that content MOVES to the record when a budget
warns, never that a rule is deleted to fit, and choosing WHICH bullets
move is an architect's reading of the whole document rather than
something a fenced lane can decide.

What the warn is asking for is the compaction sitting: read the document
whole, move the instance narratives onto the cards and records their
citations name, and leave the rules. Every card that lands a rule after
this one makes the same warn louder.

## Acceptance criteria

- WHEN the compaction lands THE document SHALL be under its ADR-019 warn line, with every rule still stated and every moved narrative reachable from the citation that replaced it.
- WHEN a bullet's narrative moves THE record it moves to SHALL be named in the bullet, so nothing is deleted rather than relocated.

## Contribution of 2026-09-13 — the merge bullet, shortened (approved by the owner on 2026-09-13 as a contribution to this card; this card stays suggested, neither promoted nor dispatched)

The rule-review sitting of 2026-09-13 (batch 1: the four rulebook bullets added since T-307) produced, and the Codex orchestrator reviewed twice, a shortened text for CONVENTIONS' THE ARM MERGES bullet: 2,808 bytes against 3,794, every contract kept — the widening ahead of the merge, the bench tip rather than the verdict sha, the SINGLE end-of-file append with a present and empty merge base, the four keepers with refuse-or-bump, the corrections before the regenerations, the re-drill in the block's named spec with the fix diff's owning set derived and reported and `--drill-wide` adding it, the counts, the message from the verdict, the meters record's provenance fields and whole text, the stop rule and the derived dials — and the transcript of the verb's steps and the arguments beside them cut. No spec pins a sentence of the bullet as a literal (scanned to twelve characters over the specs, the evals and the scripts); the only shared literal is the command's path. It is ONE contribution to this card's compaction, not its completion: CONVENTIONS stays about 10 KB over its warn line after it, and this card's two criteria stand. The text is carried here so the compaction lane reads it from the card and not from a scratch file; it replaces the bullet that opens with the same words, and no other line.

```
- THE ARM MERGES, AND THE SEAT RULES (T-295, ADR-024 decisions 3 and 4):
  `node tools/e2e/scripts/brief.mjs --merge <T-NNN>` is the ONE spelling
  for the integrator's ritual. The verb prints its own plan and one exit
  per step; the step list is the verb's to print, not this bullet's to
  copy. What this bullet holds is the CONTRACT the verb is held to, in
  the order the properties need: the fence WIDENED on the integration
  branch in its own commit AHEAD of the merge, for any spec the newest
  verdict's MUTANT BLOCKs name that the card does not admit (the landing
  gate reads a merge's fence from its FIRST PARENT — T-281-s10); the lane
  branch moved to the BENCH TIP, never the verdict sha; `git merge --no-ff
  --no-commit`; conflicts get exactly three answers and no fourth — this
  card's own file from the LANE, a SINGLE end-of-file append whose merge
  base is present and empty kept from both sides with the closing
  restored, everything else NAMED as a fence finding and stopped; the `done` stamp; each
  assigned correction applied as its block's `old` where the tree carries
  its `new`; THE FOUR CHEAP KEEPERS, each its own exit — a REMOVED line
  under `method/` or `docs/` that a spec pins VERBATIM (thirty characters
  is the floor), an ADDED line carrying a forbidden spelling (the rename
  scanner's own classifier, a secret shape, an email address, this
  machine's home directory, the seat's account or git name), an `XS` card
  whose diff outside its own file exceeds FORTY changed lines, and the
  card's own `--preflight` — the first two and the fourth REFUSE, and
  since T-296 the XS keeper BUMPS the reading to `standard` and passes,
  because a mis-sizing is a fact for the next triage and not a defect in
  the merged tree; the method stamp when method text moved; the census
  and the graph AFTER the corrections and never before; the docs gate,
  whose FIRES is news and whose STALE stops; the re-drill of every block
  in its named spec, with the FIX DIFF's owning set derived and reported,
  a named spec outside that set included, and `--drill-wide` adding the
  whole owning set; the counts graded against the ones the verdict
  claims; the message written FROM the verdict's own sentences; the
  `## Meters` blocks appended to `docs/checkpoints/meters.jsonl`, one
  JSON object per seat per merge carrying card, size, tier, seat, source,
  merge and the block's original text whole. **IT STOPS
  WITH THE MERGE STAGED AND IT NEVER PUSHES**: the commit, the checkpoint
  and the push are the seat's, and a step it refuses is the seat's to
  rule, never the verb's to work around. Every dial is DERIVED — the
  branch off `git for-each-ref`, the worktree off `git worktree list`,
  the seats off the card's own fields — so the seat types one card id.
```

**Fence re-pointed 2026-09-14 (the architect seat, after T-290's merge).** docs/CONVENTIONS.md is now the index over the chapters under docs/conventions/; this fence gains the chapter(s) this card's work needs, mapped by opener: docs/conventions/standing-gates.md. The index stays fenced for its pointer line.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
