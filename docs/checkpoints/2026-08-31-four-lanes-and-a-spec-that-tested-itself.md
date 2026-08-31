# Checkpoint: four lanes land, the F-04 seam opens, and a spec built to catch vacuous greens was found grading its own homework

Date: 2026-08-31. Seat: architect/integrator. Scope: `T-198`, `T-088-s4`,
`T-194` and `T-202` merged and closed, all four `review: independent`;
`T-208` filed; five findings folded into `T-206`; a standing hazard
retired as refuted; and one data-loss incident caused by this seat's
scheduling.

## THE F-04 SEAM IS OPEN

`T-198` landed the pin, and the bar was behavioural rather than
structural because this seam's whole history says structural proves
nothing:

    before (no collected pin):  49 files / 1094 tests, exit 0   SURVIVED
    after  (T-198's pin):       2 failed / 1103 passed (1105)   KILLED

`T-110` had measured four one-side-only producer mutants surviving at
exit 0 here, and `T-190`'s verifier had gutted `hydrateJoin`'s hydration
loop and watched the mutant pass the **entire app suite and both `tsc`
programs**. An import, a type-check, or a body that merely *calls* the
module would each have satisfied the card's letter and changed nothing.

**Its verifier predicted the weak pin and was wrong in the lane's
favour** — it reasoned in phase 1 that criterion 2 says *A* mutant,
singular, so one happy-path assertion would conform while leaving four
cases alive. Nine self-built mutants, zero survivors.

## THE SPEC THAT TESTED ITSELF

**`T-202`'s runner refuses six things and survives its own charter** —
`/usr/bin/true` as the graded command, running nothing and exiting 0,
comes back `REFUSED zero-bodies`.

**And four of its verifier's mutants survived, all one class: every
corpus the spec checked WAS the corpus under test.** Deleting a name from
`REQUIRED_VERDICT_FIELDS` left **31/31 green**, because the body proving
*"a missing field is refused"* iterates the very list that defines the
requirement — **removing a requirement removes its own test.** Same for
deleting a whole graded suite, and for the lock's pid-liveness check
whose dead-process body never constructed a stale lock.

**Reproduced inside the artefact built to refuse exactly this.** The fix
is an INDEPENDENT expectation rather than more bodies: literals typed in
the spec from the card, the document's own suite list parsed as a third
source, a real reaped-pid lock, and `occurrences(…) === 1` in place of
containment.

## THE CACHE CLIFF WAS NEVER THE CACHE

`T-088-s4` proved the mechanism and **the verifier contradicted
`docs/STATE.md`'s first standing hazard on the record**, which is what it
was asked to do if its derivation disagreed.

`spawn_watcher_thread` returns immediately; `Rearm` and `ArmGenesis` each
carry an `ack` while the `initial_root` arm carries none. Because `rearm`
resets the emit-suppression baseline **from disk at arm time**, a write
landing first BECOMES the baseline and **no emit is ever produced** —
missed, not late, so no bound of any width could collect it.

**The discriminator is the elegant part.** Base fails at a **constant
11.0 s** whether the arm is 1.5 s or 8 s late — impossible unless the
emit never comes. HEAD stays green with elapsed tracking the delay
**linearly and never cliffing**, which is *the one signature a widened
bound cannot fake*. Reproduced on a **clean cache, idle machine**.

**A 13 GiB `cargo clean` was run on the old attribution.** The hazard is
RETIRED rather than updated; what survives is one sentence — **a timing
correlate is not a cause.**

Its verifier also found a regression the fix introduced: deleting the
bound left an alive-but-silent watcher **hanging silently** across 20
sites in 11 bodies. The repair keeps the distinction the card demands —
`SILENCE_BACKSTOP` is calibrated to be UNREACHABLE by a working run and
measures **silence, not elapsed time**, so every arriving emit restarts
the window.

## TWO IDENTICAL GUARDS ANSWERING OPPOSITELY

`T-194` found the card under-enumerated its own subject — three guards,
not two — and then landed the sharpest instance of `T-186`'s
generalisation available: **`registry.rs`'s entry guard and
`read_contained`'s are the SAME TWELVE CHARACTERS**, one separately
pinnable (255/1 alone) and one provably not (256/0), decided entirely by
what reads downstream.

**And its load-bearing correction is security-relevant.**
`read_contained`'s refusal accounting was headed **complete** while
omitting `canonicalize()` — which is what makes `starts_with` a
containment test rather than a string-prefix test, since `Path::starts_with`
compares components and `<root>/a/../../elsewhere` satisfies it until the
`..` collapses. Lifting it leaves the crate **256/0 with nothing red**,
and the probe returns a file **from outside the root**. Now refusal **C
of FOUR**, with the count in the heading so an omission is visible to
whoever counts next. Routed as `T-208`.

## THIS SEAT'S DEFECT: TWO SEATS WRITING ONE WORKTREE

**I resumed `T-202`'s executor to perform corrections while its verifier
was still drilling the same worktree**, and the verifier's `git checkout
--` discarded an uncommitted blob.

**The lane proved nothing was lost rather than asserting it**: it
reconstructed all nine of its mutations and hashed them, and `9661f488`
IS its own `parts-sum` poison mutant; `git log` over the runner after the
corrections commit is empty. **Its directional argument covers the
results too** — a foreign `checkout --` can only remove a mutant BEFORE
the suite runs, turning a kill into a false SURVIVAL, never manufacturing
one, and all twelve drills reported kills.

**No work lost, no result corrupted, and the cause was scheduling.** The
warning I gave that verifier about moving trees was one I did not extend
to my own dispatch.

## `review: independent` — SET AT FILING, FINALLY

Missed three times running, the third **immediately after** a verifier
assigned *"flagged so the next dispatch sets it."* It is now set at
FILING on every guard-class card, where the judgement is already being
made. `T-202` was the first to carry it correctly.

## Five findings folded into `T-206` rather than filed as new cards

1. a red over **zero bodies**; 2. the **costume vacuity** (empty
corpus); 3. **removal-only cannot distinguish an exact matcher from a
containment one** — found independently by two verifiers on two
subjects the same day; 4. a **restore that verifies its own write**,
which destroyed a lane's work while printing `RESTORED=YES`; 5. **the
self-referential corpus**, which **shape TEN passes every time** because
it asks about SIZE where this asks about PROVENANCE. Plus a
**role-qualified scratch stem**, after a verifier destroyed the bench its
own executor left for it.

## Gates

- **`cargo test --no-fail-fast` — 18 targets, 605 passed, 0 failed**;
  lib suite **4.24 s**, against a band that used to red it at 15 s
- parser **344** · app **1105** · e2e **401** · `cargo audit` **exit 0**,
  17 allowed warnings, zero vulnerabilities
- `lint:docs` / `lint:tokens` — **0 / 0**; CAPABILITIES regenerated
  **29,121 → 32,841** (`T-201`'s gap, third instance)
- **GRAPH — CURRENT**, 1,152,374 bytes, 200 files, **2,453 symbols,
  2,375 edges** — *corrected 2026-08-31.* This line first read 2,452 and
  2,374. Both were off by one and both were **wrong when written**:
  `graph.json` last changed at `e2154e0`, before this checkpoint, and the
  blob at `c4cf4af` itself counts 2,453 / 2,375. Nor was it a stale carry
  from an earlier record — the prior figures were 2,448 / 2,365. It was a
  misread of `--check`'s own output, which is the transcription STATE's
  IN FLIGHT section forbids: **DERIVE IT, never transcribe.** Re-derive
  with `nputer-index --check`, or off the artifact directly.
- **HEALTH — 8 inside, 2 drifting, 0 BREACHED, 0 unread**, 4 UNKEPT

**AND THE E2E GREEN IS PARTLY VACUOUS, WHICH IS RECORDED RATHER THAN
BANKED.** With zero lanes live, `brief.mjs --dispatch` emits **63,732
bytes — under the 64 KiB buffer** — so `T-197`'s truncation loses nothing
and its body passes. Across one day that output has been 69,293 → 77,712
→ 63,732, and the body has gone red, green, red, green, **tracking only
how many lanes happened to be open.** The defect is unchanged; only the
input moved.

## Owed after this record

- **@human**: the `T-162-s1` byte-floor divergence, the **FORM**, the
  **STEERING SPLIT**, `T-025-s4`'s permission questions, thirty seconds
  on the interview's ending at a narrow width, and `T-131` — which now
  has counter-evidence from six lanes.
- **A compaction landing** for `docs/STATE.md` and `docs/CONVENTIONS.md`.
- **`T-199` remains priority 1**: nothing mechanically fences a lane
  until it lands.
