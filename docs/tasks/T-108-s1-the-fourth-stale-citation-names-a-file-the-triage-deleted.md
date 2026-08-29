---
id: T-108-s1
title: The fourth stale citation — T-081's verifier notes enumerate "exactly three files, all prose" and one of the three no longer exists, in the same section that exists to catch citations of things that do not exist
status: parked
suggested_by: integrator claude-opus-5 @T-108
---

Absorbs: T-138-s5 (Amnesty triage 2026-08-29 (triage seat)) — the same class on a second card, filed by the same rule for the same reason: a claim written by the architect before dispatch, true at the ref it was written at, false at the merge, and left rather than rewritten because a criterion is the contract an adversarial verifier attacked. Its first item is the sharper one — the card opens with every claim below is a command anyone can re-run, and the command it states returns 3 where the card says 0, at three of the four refs it was re-run at. Together with T-104-s4's four this makes the class three cards wide, which is the argument for a periodic sweep.

Absorbs: T-108-s4 (Amnesty triage 2026-08-29 (triage seat)) — same file, same passage, same path-granularity fence, and the two corrections belong in one dated block: this card corrects the census beside criterion 7, that one corrects the RULE stated beside it. Its finding stands at this base — the rule as landed carries the pathspec clause and not the ROOT clause, and its stronger spelling (git -C "$(git rev-parse --show-toplevel)" grep) removes the working-directory dependency the sentence cannot.

Found by T-108's executor, deliberately NOT taken (outside the card's
criteria and outside its three-path fence's licence to rewrite), and
re-derived by the integrator at the merge `188262e` before filing.

**T-108 corrected three live citations. This is the fourth, and it sits
inside the very section that found the third.**

`docs/tasks/T-081-denial-reaches-the-screen.md`, section **`CRITERION 7
CITES A PIN THAT DOES NOT EXIST, AND THE RECORD SHOULD SAY WHICH BODY
CARRIES THE GUARANTEE`**, says:

> The string occurs in exactly three files, all prose:
> `docs/tasks/T-025-agent-runner.md`, this card (twice: the criterion and
> the verdict), and `T-081-s8`.

**Every clause of that sentence was true when it was written and three
of them are false now**, measured at `188262e` from the repository ROOT
with `git grep -n "an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail" -- .`
(exit 0, six hits):

| the sentence says | at `188262e` |
|---|---|
| `T-081-s8` is one of the three | **that file does not exist** — the sixth triage absorbed it into T-108 and removed it in the same commit |
| this card holds it **twice** | **four times** — lines 109, 646, 654 and 1155 |
| `T-025-agent-runner.md` is a citation of the pin | it is now a **quotation inside a dated correction block**, naming the spelling that was wrong |
| three files | three files, but a **different three**: T-025, T-081 and `T-108`'s own card, which put the string into `docs/` by writing about it |

**THE COUNT IS RIGHT AND EVERY MEMBER OF THE SET HAS CHANGED**, which is
the shape worth naming: a census that happens to still total three is
the hardest kind of stale claim to notice, because the number a reader
checks is the one that did not move.

## Why this was not folded into T-108's checkpoint

**The integrator's rule was: repair what the merge INTRODUCES, file what
the merge merely REVEALS.** T-108's merge introduced a stale line number
(`agent_runner.rs:1347`, correct at the lane's ref and falsified
thirty-one minutes later by Merge T-102) and that was repaired in the
checkpoint. This block is different — it is **archival**, a faithful
record of what T-081's verifier measured at T-081's own tip, made stale
afterwards by an unrelated triage. T-108's own last criterion says **NO
CORRECTION HERE SHALL DELETE HISTORY**, and the right repair is the one
T-108 performed three times: a dated in-place correction carrying its own
derivation. That is a card's work, not a checkpoint's footnote.

## The fix

A dated correction block beneath the sentence, on T-074's and T-108's own
precedent — leaving the original visible, naming the ref it was true at,
and stating the census at the correcting ref **with the ref**. Do NOT
rewrite the sentence in place and do not re-transcribe a fresh census as
a bare number: the whole finding is that this census went stale while its
total stayed the same, so the replacement has to be a derivation the
reader can re-run (`git grep -- .` **from the ROOT**) rather than a digit.

Fence: `[docs/tasks/T-081-denial-reaches-the-screen.md]`, at path
granularity — never the `docs/tasks/` directory, per T-108's architect
ruling. Nothing holds that file today.

Amnesty triage 2026-08-29 (triage seat): PARKED — both needles are live: docs/tasks/T-081-...md:673 still says the string occurs in "exactly three files" and names T-081-s8, which does not exist. The finding's own lesson is why it is not urgent — a census that still totals three is the hardest stale claim to notice, and nothing acts on this passage today. The repair is a dated in-place correction carrying a re-runnable derivation, never a fresh digit. RESURFACES: the next session that cites T-081's criterion 7 or greps that pin's name; or a periodic docs/tasks/ correction sweep, which is the shape this class now argues for — T-108 corrected three, this is the fourth and fifth, and one card per instance is the wrong unit.
