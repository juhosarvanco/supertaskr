---
id: T-210-s1
title: THE PHYSICAL FENCE LAYER DECAYS AT EVERY GIT WRITE and nothing on the push path asks whether it is still armed — and the residual is exactly the one vector no landing gate can cover
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [.claude, tools/e2e]
suggested_by: "T-210's executor, 2026-09-01 — found by measuring the failure its own card predicted and meeting a quieter one instead"
builder:
review: independent
---

**CLASS PARENT: none found.** Searched the board at `e7c277a`; `T-212`
(landing gate) and `T-216` (push-guard rooting) are neighbours, neither
owns "a guard that a routine act silently removes".

**DISPOSITION HINT: promote, but decide ANNOUNCE-vs-REFUSE on the card
before dispatching it** — a push refused for guard hygiene is a different
instrument from `T-212`'s, and `T-212` already settled the neighbouring
question the other way (its `CANNOT COMPARE` is an ANNOUNCED ALLOW,
argued in `push-guard.mjs`'s header). Weigh against that precedent, not
by taste.

Measured on `T-210`'s lane at git 2.50.1 (Apple Git-155), macOS/APFS: a
merge writes STRAIGHT THROUGH a read-only tracked file — fast-forward,
three-way and conflicting alike — because git unlinks and recreates, so
the file returns at the umask default. A checkpoint sync, a branch switch
or a `git stash pop` therefore leaves the physical layer disarmed on
**exactly the paths it just brought in**, with no error, no output and
nothing in `git status`. `lane-lock.mjs --status` names that drift and
exits 1; nothing runs it. **Most of the exposure is already covered** —
`T-212` reads the committed diff, so out-of-fence CONTENT cannot LAND
either way — but **the residual is the layer's whole reason for
existing**: a lane writing ANOTHER lane's worktree never enters the
writing lane's diff, so only the read-only bit stops it, and a lane whose
layer has decayed is a lane whose neighbours can be edited without trace.
Note `T-216`'s rooting hazard, which decides where such a check can live.

## TRIAGE, 2026-09-02 — DISPOSITION IS PROMOTE, AND IT IS NOT APPLIED

Triaged at the architect seat at 1cd2c8d. The stamp stays `suggested` for
T-225's reason and no other: `brief.mjs --dispatch` printed 60,040 bytes
at 85dda6d against the 65,536-byte loss point, a promotion costs about
645 bytes, and the in-flight sections of the wave dispatched tonight
spend the rest. T-225 is dispatched as soon as T-216-s4 lands; when
T-225 lands, promote this card without re-triaging it. Read this as a
tool limit, never as a verdict on the finding.

**RULED: ANNOUNCE, not REFUSE.** The landing gate is the total check and
the physical layer is its backstop, so a decayed layer is ANNOUNCED on
the push path with the re-arm command (`lane-lock.mjs --status` already
names the drift), on T-212's own announced-allow precedent for CANNOT
COMPARE. A refusal would block every lane after every git write until a
hand re-armed it, which is a guard somebody turns off. `review:
independent` set at the seat: the subject is a guard.
