---
id: T-101-s4
title: T-101's fence argument quotes a sentence method/roles/executor.md does not contain
status: suggested
suggested_by: verifier claude-opus-5 @T-101-verify
---

T-101's rebuild notes justify routing the `exitNonZero` fix instead of
widening the fence, and ground 3 cites `method/roles/executor.md` as
*"unambiguous about that case"*, quoting:

> *"A criterion that cannot be built inside the fence is NOT built.
> Record it, route it as a suggestion naming the fence it needs, and
> build the rest. Widening the fence from inside the lane is the one
> repair this role may never make."*

**That sentence is not in `executor.md`, and not anywhere else in the
tree.** Measured at `a86703d`:

    grep -in "widen" method/roles/executor.md    -> exit 1, no output
    grep -in "fence" method/roles/executor.md    -> exit 1, no output
    wc -l method/roles/executor.md               -> 19
    git grep -l "may never make"                 -> only the card quoting it

**The ruling it supports is correct — the authority is real, and it is
written down twice, but neither copy says this.** In the lane,
`executor.md` step 5 carries the substance in different words:
*"anything you noticed but didn't do — file it as a status: suggested
task with suggested_by set, then let it go. … suggestions never expand
your scope."* On the integration branch, `method/lane-protocol.md` rule 5
carries it almost verbatim: *"An executor whose work reaches outside its
own `touches:` has found a dispatch error, not a licence: record it,
route it, and build the part that fits. A fence is not widened from
inside the lane it fences."*

**Why it happened, which is the part worth keeping.**
`method/lane-protocol.md` **did not exist in this lane**. It landed with
T-089's merge, after T-101 was cut at `a15b78e`:

    git cat-file -e a15b78e:method/lane-protocol.md   -> fails
    git cat-file -e main:method/lane-protocol.md      -> succeeds

So an executor reasoning correctly about a real rule reached for the only
role file its worktree had, and put quotation marks around a paraphrase.
This is a *structural* hazard of long-lived lanes, not carelessness: the
method files a lane reasons from are the ones frozen at its cut, and a
rule ratified mid-lane is invisible to it while being fully in force at
merge.

**The fix.** Re-cite the paragraph to `method/lane-protocol.md` rule 5,
which will exist in the tree the moment this branch merges, and either
quote it verbatim or drop the quotation marks and paraphrase openly. Two
sentences in the card; no code moves.

**Why it is worth a file rather than a shrug.** A task card is a code
input (the DOCS GATE exists because of that) and later sessions cite
cards as precedent — this one carries a ruling about when a fence may be
widened, which is exactly the kind of paragraph that gets quoted onward.
CONVENTIONS' own negative-control bullet already records a rule that went
unwritten *"while everyone believes it exists"*, found by *"a grep of
both … zero hits three triages later"*, and **T-105** is a standing card
for that sweep. This is the same failure one step further along: not a
rule everyone believes is written, but a rule quoted as though it were.
Worth folding into T-105's sweep as a second pattern — **grep every
quoted clause in a card against the file it names.**
