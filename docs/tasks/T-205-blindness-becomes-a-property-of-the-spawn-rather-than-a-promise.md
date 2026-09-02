---
id: T-205
title: BLINDNESS BECOMES A PROPERTY OF THE SPAWN, not a promise — a blind line inside one message is not a blind line, and a verifier can leak to itself
feature: F-06
milestone: 4
priority: 3
size: M
status: building
blocked_by: []
touches: [method/roles, docs/CONVENTIONS.md, tools/method-evals/evals/mf-08-two-spawn-single-source.mjs, tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); six disclosures on 2026-08-31 are the evidence, four against this seat and two self-inflicted"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

**SIX CONTAMINATION DISCLOSURES IN ONE NIGHT, AND THE VERIFIERS FOUND
ALL SIX.** The current design asks a verifier to *promise* it will not
read something it has already been handed. That is not a property; it is
an honour system, and it failed in two distinct ways.

## The four this seat caused

The dispatch put lane context **below a "blind line" in the same
message**. An agent receives the whole prompt at once, so the line is
decoration. `T-184`'s verifier reported two lane facts reaching it before
phase 1 could start; `T-186`'s reported the same; `T-167-s8`'s and
`T-112-s4`'s each disclosed a leak from the brief's own wording — one
told a verifier to attend to *"fence claims and routing"*, which told it
the lane had made one.

**Three lanes and a verifier raised this independently before the seat
fixed it.**

## The two the verifiers caused THEMSELVES, which is why prose cannot fix it

- One ran `git log --oneline main..HEAD` while deriving a merge-base and
  **read the lane's commit subjects**, which leaked the fix's shape.
- One ran `git log --oneline -5` while orienting, read three of the
  lane's subjects, and **downgraded itself to "corroborator rather than
  independent finder"** on two of its four questions.

**A verifier can leak to itself with an ordinary orientation command.**
No wording in a brief prevents that, because the brief is not the leak.

## What to build

**Phase 1 becomes its own spawn**, with the contract pasted **inline**
and **no file or git tools at all**. It can do exactly one thing: return
an attack set. It cannot read the diff, the notes, the log, or the
worktree, because it has no way to.

**Phase 2 is a second spawn**, receiving the attack set plus the lane.

**Blindness stops being a promise and becomes a property of the spawn.**

## What a fix decides

1. **What phase 1 needs pasted inline** to be useful without tools — the
   card, the base state of the file under test, the role contract. **Too
   little and the attack set is uninformed; too much and the paste is
   itself a channel.** This is the whole design question.
2. **Whether phase 1's output should be hashed.** Three verifiers hashed
   their attack sets voluntarily on 2026-08-31 and it made their claims
   checkable. **Make it the contract rather than a habit.**
3. **What happens when phase 1 asks for something it cannot reach.** A
   refusal channel that returns to the dispatcher is better than a
   verifier guessing — say what it looks like.
4. **Whether the same shape serves a REJECTED verdict**, where phase 2
   may need to re-enter phase 1's frame after learning something.

## Acceptance criteria

- PHASE 1 SHALL run in a spawn with no file, git or shell access, and
  SHALL be able to return only an attack set.
- THE attack set SHALL be hashed, and phase 2's verdict SHALL cite that
  hash — a body SHALL prove a verdict citing a hash that does not match
  the saved file is refused.
- **A POSITIVE CONTROL SHALL prove phase 1 can still produce a USEFUL
  attack set from the inline contract alone** — a phase that returns
  nothing is blindness achieved by uselessness.
- THE method documents SHALL state the two-spawn shape in exactly one
  place, and `method/roles/verifier.md` SHALL point at it rather than
  restate it (`T-057`).
- Verification: the method eval gate plus headless bodies where the
  spawn shape is scriptable.

## Rides the release

This changes `method/`, so it joins the queued method release beside its
five existing riders (`T-112-s2`, `T-154-s3`, `T-159-s6`, `T-154-s4`'s
sentence, and the `T-173`/`T-176` bumps). **It is a method-doc change,
not a tooling change**, and should not be sequenced ahead of the fixes
that end classes which did measurable damage.

## Read beside

`method/roles/verifier.md`, `T-204` (which generates the prompt this card
splits in two), and `T-131` — whose question about the ceremony's cost is
partly a question about how much of it is honour-system.
