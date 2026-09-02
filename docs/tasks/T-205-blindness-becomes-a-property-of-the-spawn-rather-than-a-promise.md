---
id: T-205
title: BLINDNESS BECOMES A PROPERTY OF THE SPAWN, not a promise — a blind line inside one message is not a blind line, and a verifier can leak to itself
feature: F-06
milestone: 4
priority: 3
size: M
status: verifying
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


## Implementation notes (executor claude-opus-5@subagent)

**THE HOME IS `method/roles/orchestrator.md` 5d, AND THE CHOICE OF HOME
IS THE FIRST DECISION.** The two-spawn shape is an ACT, and the method's
own precedence rule gives an act to the acting role's file — the seat
that SPAWNS is the dispatcher. 5c already owned *cut the bench when you
cut the lane*, so 5d sits beside it and the two divide cleanly: **5c
buys the blindness with the CLOCK, 5d buys it with the TOOL GRANT.**
`roles/verifier.md` and `roles/executor.md` now point at 5d; neither
restates it.

**WHAT THE FOUR DECISIONS WERE DECIDED AS.**

1. **The paste has TWO bounds, not one, and that is what makes *too
   little / too much* answerable.** The BASE REF bounds what can LEAK —
   nothing that existed at the cut is downstream of the executor, so
   volume cannot contaminate, while a seat's SUMMARY can at any length.
   The CARD'S CRITERIA bound what is worth SENDING. A fence naming a
   directory or a 117KB document is the ordinary case, so the dispatcher
   chooses and then NAMES the ref and the sections it pasted — which is
   what makes an under-paste recoverable through the refusal rather than
   invisible.
2. **Hashed before phase 2 is spawned; the verdict cites the digest; a
   mismatch is REFUSED.** `MF-09` holds that refusal.
3. **The refusal channel is the only other thing phase 1 may return**,
   and it absorbed a conflict this card did not name: step 0 told phase
   1 to MEASURE a ground truth, and a spawn with no shell cannot. So
   phase 1 returns the LIST of measurements it wants and the dispatcher
   takes them AT THE BASE REF. `roles/verifier.md`'s sentence moved from
   *measure it in phase 1* to *ask for it in phase 1*.
4. **A REJECTED verdict re-enters by SPAWNING AGAIN, never by
   remembering** — a new phase 1 against the amended card, its own hash,
   stamped as a re-entry, and the fix judged against BOTH hashes.

**AND A FIFTH THING NOBODY ASKED FOR, BECAUSE THE BLIND ARMS BOTH NAMED
IT**: a CONTINUATION of phase 1's session is not a second spawn, and the
paste may never carry the diff, the notes, the report, the commit log or
a post-cut figure. Both clauses are in 5d.

### The positive control, and its result was NOT what was expected

Two blind phase-1 spawns were run on this card, both reporting
`tool_uses: 0`. **Arm A** got the paste 5d prescribes (card at the base
ref, `roles/verifier.md` step 0 at the base ref, 5c at the base ref) and
returned **20 attacks plus a refusal naming three things it could not
reach**. **Arm B** was starved to the title and the acceptance criteria
alone and returned **35 attacks plus a refusal**. **The naive
expectation — starved returns less — is false, and the criterion is met
by the arm that was supposed to fail.**

What the paste actually bought was **AIM, not volume**: roughly 26 of
arm B's 35 attacked a code implementation this card explicitly excludes
(*a method-doc change, not a tooling change*), while arm A's set was
aimed at the documents under change. **A counter of attacks would have
graded the starved arm better**, which is why `T-205-s3` exists and why
its criteria forbid a length assertion. The other measured result is
that **arm B's REFUSAL did the work the paste would have done** — it
named T-057's text, the spawn API and the eval registry as things it
lacked — which is decision 3 validating decision 1 rather than
duplicating it.

**THE LIMIT, DISCLOSED RATHER THAN CLOSED**: both arms were *asked* not
to use tools, because the harness this lane ran in has no tool-free
agent type. `tool_uses: 0` is the harness's own report, not a grant.
**An instruction not to look is the honour system this card exists to
end**, so the enforcement is routed as `T-205-s2` (app-dispatch), where
the grant can actually be narrowed.

### Measurement

`MF-08` (single source + pointer) and `MF-09` (digest refusal) are the
committed readers. Before they existed the criteria were measured by a
reader run **both ways** over the base tree and the lane tree — 7
findings at the base, 0 in the lane, and 8 of 8 hand degradations of the
NEW text detected, so the reader can fail on the new text and not only
on the old. `MF-08`/`MF-09` carry the arms that survive as a gate; the
scratch reader additionally covered decisions 3 and 4 and AC-1's
return-bound, which stay document properties with no committed reader.

### Routed, with the fence each needs

- `T-205-s1` — nothing INVOKES MF-09's comparison against a real
  verdict; the saved file is in a scratchpad no gate may walk.
- `T-205-s2` — the two-spawn shape has no EMITTER; `brief.rs` assembles
  one brief with a marker, which 5d names as the fallback.
- `T-205-s3` — the usefulness floor has no mechanical reader, and the
  control above says why a naive one would be worse than none.
- `T-205-s4` — MF-02 cannot resolve a LETTERED sub-step, so every
  pointer at `5d` dangles silently the day 5d is renamed.
- `T-205-s5` — `brief.mjs --role verifier` exits 3 for EVERY verifier
  brief; blocked_by `T-225-s2`, which holds that fence.
- `T-205-s6` — GRAPH REGEN's trigger omits `.mjs`, so this lane's own
  gate derivation had two readings and the right answer was reached from
  the graph rather than from the bullet.

### Not done, deliberately

**No method version bump.** This card's own *Rides the release* section
says it joins the queued release, and `docs/CONVENTIONS.md`'s
`currently v0.1.9` line is untouched.
