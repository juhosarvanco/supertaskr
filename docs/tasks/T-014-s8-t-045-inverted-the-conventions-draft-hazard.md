---
id: T-014-s8
title: T-045 inverted the CONVENTIONS-draft hazard — applying T-014's retirement block ALONE now reds the e2e lane, by name
status: suggested
suggested_by: verifier claude-opus-5 @T-014
---

T-014's implementation notes flag a hole in the retirement it drafts,
honestly and in the right place:

> ...add the matching row to `EXPECTED_COMMANDS` in
> `tools/e2e/tests/workflow-parity.spec.ts` — that spec asserts every
> expected command is a verbatim step in order, and **its list is
> hand-maintained, so a CONVENTIONS edit alone will NOT red it and will
> NOT be caught**.

That was true at this branch's point (`5927adc`). **It is no longer
true, and the correction runs the other way** — which is better news,
but it changes what the integrator must do.

**What changed.** T-045 landed on `main` (`626bd62`, `998cb05`,
`2c5b82d`) and rebuilt the spec so it PARSES `docs/CONVENTIONS.md`
"Build & test" and derives the expected commands from it, asserting both
directions: every command the doc lists must be accounted for, and every
command the spec accounts for must still be in the doc.

**Measured.** `git archive main` into a scratch tree, then apply T-014's
drafted retirement block (a)+(b)+(c) to that copy's CONVENTIONS and run
the spec:

    baseline, unmodified main ............................. 11 passed
    with the drafted block applied ........... 1 failed, 10 passed

      the expected commands derive cleanly from docs/CONVENTIONS.md
      + "...lists [app/src-tauri] index --check, which this spec has no
         entry for — add it to CI_SEQUENCE (verbatim or mapped, with the
         workflow step) or to LOCAL_ONLY with the reason CI does not run it."
      + "...lists [app/src-tauri] index --watch, which this spec has no entry for..."
      + "...lists [app/src-tauri] arch, which this spec has no entry for..."

**Two consequences, and the second is the one that matters.**

1. The hole T-014 named is CLOSED. A CONVENTIONS edit alone can no
   longer add a documented command that CI silently never runs — the
   lane reds immediately and names the fix. The notes' sentence should
   be read as history, not as current truth.

2. **Draft (c) can no longer be applied on its own.** Adding the
   `nputer-index` command list to the `app/src-tauri` bullet without a
   matching edit to `tools/e2e/tests/workflow-parity.spec.ts` turns
   `npm test` in tools/e2e RED, which is a merge blocker. The integrator
   applying T-014's retirement needs BOTH halves in the same commit:
   - `docs/CONVENTIONS.md` — drafts (a), (b), (c);
   - `tools/e2e/tests/workflow-parity.spec.ts` — an entry per newly
     documented command, either in `CI_SEQUENCE` (with the ci.yml step)
     or in `LOCAL_ONLY` (with the reason CI does not run it).

   For `index --watch` and `arch` the honest disposition is `LOCAL_ONLY`
   (a watcher runs until stopped; `arch` is a reporter, not a gate). For
   `index --check` the disposition IS the second limb of T-014's own
   `Absorbs:` note — it wants to be a `CI_SEQUENCE` step after the cargo
   suite, which means `.github/workflows/ci.yml` moves in the same
   commit. `main`'s ci.yml mentions `nputer-index` zero times today.

**Note for whoever applies it**: the derivation flagged three of the five
backticked commands in draft (c), not all five — its list "ends at the
first `·` segment that does not open with a backtick", so the wording of
the drafted sentence decides which commands are visible to CI parity at
all. Reword the block deliberately rather than trusting the three
problems it reports to be the complete set.

None of this is a defect in T-014: the draft is explicitly "DRAFTED FOR
THE INTEGRATOR — not applied here", `docs/CONVENTIONS.md`, `.github/`
and `tools/e2e/` are all correctly 0 files in this diff, and T-045 was a
sibling lane running the same night. Filed so the retirement lands in
one green commit instead of two red ones.
