---
id: T-145
title: Every project this method creates still receives the read-first set that cost this project a working day — the repo fixed itself and left the template carrying it
feature: F-06
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [method/adapters/]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

**Promotion of `T-138-s2`, which named this as a class while `6a6bc87`
fixed only the instance.** Verified still true at `f22332b`.

## The defect

    method/adapters/CLAUDE.md:8   Before any work: read docs/STATE.md, then docs/ARCHITECTURE.md and
    method/adapters/AGENTS.md:8   Before any work: read docs/STATE.md, then docs/ARCHITECTURE.md and

**`docs/ROADMAP.md` is missing**, and these two files are what every new
nputer project copies to its own root. This repository's own root
adapter was corrected on 2026-08-26 and the template was knowingly left
behind — `6a6bc87` says so in its own commit message.

**ROADMAP is not optional in this method.** `method/README.md:45`
scaffolds it as *"feature backbone + milestones"* and `planner.md:42`
already refers to it. So the template omits a document the method itself
creates for every project.

## Why the priority

The omission has a measured cost in this repository: an architect
session spent most of a working day rebuilding a belief about
`blocked_by` that **ROADMAP's own `F-06` entry would have corrected in a
sentence** (`T-138`). That session then cleared four accurate
declarations and filed a card to gate a defect that did not exist, which
had to be rejected and reverted.

**Every project created from this template starts with the same gap.**

## What to change

1. Add `docs/ROADMAP.md` to the read-first sentence in **both** template
   files.
2. Carry across the paragraph that makes it stick — the one naming what
   each document answers, so a reader knows why the set has four members
   and not three. **Write it generically**; the template serves any
   project.
3. **Do NOT copy this repository's third paragraph.** It cites
   `tools/e2e/tests/` and a `grep` over this project's own specs. Either
   leave it out or leave a clearly-marked placeholder — a template that
   ships a broken path is worse than one that ships nothing.

## Two things that will look like defects and are not

- **The two template files legitimately differ by one line.**
  `AGENTS.md`'s opening HTML comment names the tools it is for ("Codex
  CLI, Cursor, Gemini CLI etc."); `CLAUDE.md`'s does not. That is
  deliberate. **Keep it.** Everything below that comment should stay
  identical, and this card's change must not be the thing that makes
  them diverge further.
- **The template is 14 lines against the root adapter's 29.** It is
  meant to be thinner — it carries placeholders (`<project name>`, `<One
  sentence: what this repo is.>`) that a real project fills in. Do not
  "fix" the length.

## The pin this needs

**Nothing in this repository currently reads either template file**
except a fixture line, and `T-144` is the card for that gap on the ROOT
adapters. This card should not try to solve that. **But it must not land
unpinned either**: at minimum, assert that the template's read-first
sentence names the same four documents as `method/README.md` scaffolds,
so the next divergence is loud.

Per `T-142`, prove the check can fail before believing it: remove a
document from the sentence in a scratch worktree, watch it RED, restore,
watch it GREEN. **A guard whose positive control was never run is the
same shape as the defect it is guarding against.**
