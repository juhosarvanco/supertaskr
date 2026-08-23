---
id: T-013-s10
title: Two stale figures survive into the merge — churn.rs property 2 still names the bare-name spawn the fix removed, and the card's own line count reads 1118 where the file is 1158
status: suggested
suggested_by: verifier claude-opus-5 @T-013-verify2
---

**Raised as F9 on T-013's second (APPROVED) verdict and materialized
here by the integrator, crediting the verifier.** It arrived as verdict
body text on the card; a finding a triage can act on has to be a file.
Both halves were **re-derived at the merge `6834287`**, not inherited.

## 1. A doc comment in shipped source still names the hole

`app/src-tauri/src/churn.rs`'s numbered property block opens at property
**0** — *"Which `git` runs is RESOLVED by the app, never inherited"* —
and property **2** still reads:

> 2. **Never a shell.** `Command::new("git")` with an argv array; there
>    is no `sh -c` anywhere in this file and no string is ever
>    concatenated into a command line.

The CLAIM is true; the SPELLING is the pre-fix one. Production spawns
`Command::new(&git.program)` (the absolute resolved path) and
`Command::new(login_shell())` (the name-checked probe); the only literal
`Command::new("git")` left in the file is the `TempRepo::git` fixture
inside `#[cfg(test)]`. **So a reader grepping `churn.rs` to check whether
the bare-name spawn is gone finds a sentence saying it is still there**,
two properties under the one that says it is not.

**One token fixes it** — say `Command::new(<the resolved absolute git>)`
with an argv array, or drop the spelling and keep the claim. It is
shipped source, so it needs a fence that includes `app-shell`; the
integrator deliberately did not edit merged source at the checkpoint.

Re-derived at `6834287`: three doc-comment occurrences of the literal
(lines 21, 42, 840) plus the one test-fixture call at line 1029; zero in
production code.

## 2. "grows it to 1118" is 1158, and it appears three times

The card's F5 paragraph — the paragraph whose whole subject is figures
that were not derived at their own tip — says the F1 fix grows
`churn.rs` to **1118**. Measured at the merge:

    wc -l app/src-tauri/src/churn.rs           -> 1158
    git diff --numstat c7528cc 650fdbe -- churn.rs -> +382 -16
    792 + 382 - 16 = 1158

**Correction to the verdict itself, found by re-derivation:** the
verifier wrote that the figure appears twice. `grep -c 1118` over the
card returns **3**. The class is F5's exactly — a figure stated at no
ref, inside the paragraph that exists to correct figures stated at no
ref — which is why it is worth one more line rather than a shrug.

Everything else in that paragraph reproduces: 792 lines at `c7528cc`, 19
distinct selectors / 20 rule occurrences with `.bg-background/60`
emitting twice, and four failing bodies in the regen forecast.

**Note for whoever fixes half 2:** the forecast's "four failing bodies"
was right about the BODIES and short by one about the ASSERTIONS. At the
merge the reconciliation was **five distinct assertion edits across
three bodies** in `architecture-dogfood.test.ts` plus one in
`map-dogfood-render.test.tsx` — C-12's FILE LIST is a third assertion in
the first body, hidden behind the per-component tally that is itself
hidden behind the size check. That is the T-077 shape one level deeper,
and it is recorded in `map-dogfood-render.test.tsx`'s own regen note.
