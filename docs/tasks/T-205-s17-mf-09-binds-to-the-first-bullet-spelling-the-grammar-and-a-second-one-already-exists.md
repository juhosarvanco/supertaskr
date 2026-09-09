---
id: T-205-s17
title: "`attackSetBullet` binds to the FIRST bullet that spells the citation grammar, and a SECOND one already exists — so MF-09's site selection is decided by document order, and its finding names a bullet it did not read"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-205-s4
blocked_by: []
touches: [tools/method-evals/evals/]
builder:
verifier:
built_by:
verified_by:
review:
---

**THE FIX FOR `T-205-s7` TRADED A WHOLE-DOCUMENT TEST FOR A
FIRST-MATCH ONE, AND THE DOCUMENT ALREADY HAS TWO MATCHES.**
`attackSetBullet` walks `topLevelBullets(doc)` and returns the FIRST
bullet whose flattened text satisfies `CITATION`. Measured at `0bf398c`,
over the 57 top-level bullets of `docs/CONVENTIONS.md`:

    CANDIDATE #1  line  302  hasCommand=true   THE VERIFIER'S BENCH IS TWO SPAWNS…
    CANDIDATE #2  line 1549  hasCommand=false  METHOD EVAL GATE (T-155, ADR-020…

Today #1 comes first and carries `shasum -a 256`, so the check is green
for the right reason — striking that bullet's command reds the eval and
rewording the POISON DRILL's does not, which is exactly what `T-205-s4`
was verified on. The residual is that **document order, not the bullet's
job, is what picks the site.**

**MEASURED, AT `0bf398c`.** Moving the attack-set bullet — unchanged,
byte for byte — to sit AFTER the `METHOD EVAL GATE` bullet turns MF-09
**RED**, and the finding reads:

    docs/CONVENTIONS.md documents the attack-set citation but spells no
    `shasum -a 256` on THAT bullet …

which is false about the bullet a reader will go and look at: line 302
still spells the command. The same misattribution appears whenever the
grammar is reworded on #1 (the `T-205-s4` verification's D2.13 mutant):
the eval binds to #2 and blames #1's job.

**WHY IT IS WORTH A CARD.** The failure mode is a red detached from its
cause — the thing `docs/CONVENTIONS.md`'s own DOCS GATE bullet exists to
complain about. A false green is also constructible, though it does not
obtain today: an earlier bullet carrying BOTH the grammar and a
`shasum -a 256` would bind the check to itself and leave the real
documenting bullet unprotected, and `degrade()`'s command arm would not
notice, because it strikes whichever bullet `attackSetBullet` returned.

## Acceptance criteria

- MF-09 SHALL name, in its finding and in its `--verbose` detail, WHICH
  bullet it bound to, so a red points at the text a reader must fix.
- THE site selection SHALL NOT be decided by document order alone: the
  eval SHALL either identify the documenting bullet by a property no
  other bullet shares, or SHALL report a finding when more than one
  top-level bullet spells the grammar without the command.
- A POSITIVE CONTROL SHALL move the attack-set bullet past the other
  grammar-spelling bullet with NO text change and require the eval to
  stay GREEN — demonstrated red against the current first-match
  implementation before it is trusted passing.

## Read beside

`tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs`
(`topLevelBullets`, `attackSetBullet`, `textFindings` and the command
arm of `degrade()`), and `T-205-s4`'s verdict, which records the
measurement above as mutants D2.13 and D2.15c.
