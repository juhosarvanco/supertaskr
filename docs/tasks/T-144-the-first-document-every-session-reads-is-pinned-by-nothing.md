---
id: T-144
title: The root adapter is the first document every session reads, it exists in two copies that must agree, and nothing in the repository asserts they do
feature: F-06
milestone: 4
priority: 4
size: S
status: suggested
suggested_by: architect claude-opus-5
blocked_by: []
touches: [tools/e2e]
---

## What is true right now

`CLAUDE.md` and `AGENTS.md` at the repository root are **byte-identical**
— both `sha256 0f0393da7d997953…` at `692ed4d`. They are the same
document addressed to two different readers: Claude Code sessions open
`CLAUDE.md`, other agents open `AGENTS.md`.

**Nothing keeps them that way.**

- The string `CLAUDE` appears **zero times** in `tools/e2e` and
  `app/test`. Root `CLAUDE.md` is referenced by no test at all.
- `AGENTS.md` appears twice, and **neither reference is about its
  content**: `token-scan.spec.ts:113` lists it among the roots that must
  restore to an EMPTY DIFF after a token plant, and
  `token-scan.mjs:1221` asserts it is a member of CONTROL. Both are
  properties of the *scanner*, not of the *adapter*.
- No test, gate or lint asserts the two files agree.

## Why this is worth a card

The root adapter carries the **read-first set** — the sentence naming
which standing documents a session opens before doing anything. That
sentence was rewritten on 2026-08-26 precisely because an architect
session had spent most of a working day rebuilding a belief that
`ROADMAP`'s own `F-06` entry would have corrected (`T-138`).

So the document whose entire job is *making sure a session is not
ignorant* is the one document with no pin on it. **A silent divergence
here does not produce a red suite; it produces two populations of agents
following different instructions**, and the difference shows up as
inconsistent behaviour attributed to the model rather than to the file.

**The asymmetry is the sharp part.** An edit to `AGENTS.md` at least
moves a file the token scan touches. An edit to `CLAUDE.md` alone moves
a file **nothing in this repository looks at**, and Claude Code sessions
— the ones doing most of the work here — are exactly the population that
reads it.

## What this card does NOT claim

The two files are **not** currently divergent, and there is no evidence
they ever have been. This is a missing guard, not an incident. Do not
write it up as a defect that fired.

## The shape of a fix, not the fix

1. **Assert the two are byte-identical**, in the suite that already
   walks tracked files. One line, no new machinery, and it fails loudly
   the moment someone edits one copy. Cheapest and covers the asymmetry.
2. **Assert the read-first SET is what the role files expect.** Stronger
   and it is the property anyone actually cares about — but it needs the
   set to be extractable from the adapter's prose, and prose is what
   went stale in the first place.
3. **Generate one from the other** at a gate rather than checking them.
   A construction beats a check, which is this project's stated
   preference. Costs a build step on a file humans edit by hand, which
   is the reason to think twice.

**Arm 1 is the one to take first** — it is nearly free and it makes arms
2 and 3 optional rather than urgent.

**SCOPE ARM 1 TO THE ROOT PAIR ONLY.** There is a second adapter pair —
`method/adapters/CLAUDE.md` and `method/adapters/AGENTS.md`, the
templates a new project copies — and those two **legitimately differ by
one line**: `AGENTS.md`'s opening HTML comment names the tools it serves
("Codex CLI, Cursor, Gemini CLI etc.") and `CLAUDE.md`'s does not. A
check written as *"every adapter pair in the repository is
byte-identical"* fails on that pair on day one and gets weakened or
deleted rather than fixed. Compare the ROOT pair byte for byte; if the
templates are ever worth comparing, it is content-below-the-comment, and
that is `T-145`'s ground, not this card's.

## One caution for whoever takes it

**A test that reads one file and asserts a property of it can pass while
the other file is missing entirely.** Per `T-142`, prove the check can
fail: make the two differ in a scratch worktree, watch it RED, restore,
watch it GREEN. A comparison whose positive control is never run is the
same shape as a census on a field that does not exist.
