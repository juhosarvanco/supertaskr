---
id: T-236-s4
title: A compaction card's "what stays" list is enumerated by hand, and T-236's omitted two bullets that range-rule.mjs parses with hard throws
feature: F-01
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: verifier claude-opus-5@subagent @V-236
blocked_by: []
touches: [tools/e2e]
builder:
---

**Addressed to TRIAGE.** Not a failure of T-236 — its executor kept both
bullets intact — but the next compaction card inherits the same hazard.

T-236's *What stays, byte for byte* section enumerates the pinned bullets
by hand. Derived at the card's base `3170247`, that list is INCOMPLETE in
three places:

- **`BOOT GATE (T-046` is not named.** `range-rule.mjs:625` takes the
  bullet by phrase and requires `/at any merge whose diff touches (.+?) — /`,
  two ``` `…/**` ``` globs, and the literal
  `either manifest (app/package.json, app/src-tauri/Cargo.toml)`. An empty
  parse THROWS: *"A gate whose trigger matches nothing says every merge is
  not owed, which is a green that means nothing."*
- **`GRAPH REGEN (T-009-s1` is not named.** `range-rule.mjs:659` requires
  `/at any merge whose diff touches (.+?) outside ([a-z]+\/),/` — **the
  comma after `docs/` is load-bearing** — and harvests the five suffixes.
  At 6,416 bytes it is the 8th-largest bullet and is mostly narrative, so
  it reads exactly like a cut target.
- **`DOCS GATE (T-084` is credited only to `docs-input-gate.spec.ts`.**
  `range-rule.mjs:1020` also takes it raw and requires the printed
  `TREE=$(…)` line WITH its leading indentation, the `node …` line, the
  sentence *"THERE IS NO `xargs` IN THAT SPELLING"*, and the whole
  four-column exit matrix with both dialects and the two `on an empty list`
  cells required to DIFFER.

**THE SHAPE OF THE FIX IS THE ONE THIS PROJECT ALREADY USES EVERYWHERE
ELSE: DERIVE IT.** `docs-gate.mjs --census` names reader FILES; nothing
names the PHRASES those readers key on, so a card author has to read every
reader by hand and will eventually miss one. A `--pins` arm — walking the
`conventionsBullet` / `rawBullet` / `the_one_line_carrying` call sites and
printing each literal phrase beside the bullet that carries it today —
would make the next compaction card's list a command instead of an act of
attention, which is the same argument `--census` itself won at T-084.

Cheap interim if that is too much: have the card's planning pass RUN the
existing readers against a scratch mutation of each candidate bullet, which
is what a verifier ends up doing anyway.

**Note the near-miss that makes this worth filing.** The sentence most
likely to be cut under ADR-019 rule 5 — the DOCS GATE bullet's transcribed
four-suite command list, which reads as a derivable list — is pinned
`toEqual`, both directions, by `docs-input-gate.spec.ts:674`. V-236's own
drill D1 killed exactly that body by removing one trailing slash.
