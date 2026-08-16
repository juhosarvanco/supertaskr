---
id: T-030-s4
title: parseRoadmap and splitSections now disagree about what content is — and the obvious shared fix eats this card's own Verdicts section
status: suggested
suggested_by: verifier claude-opus-5 @T-030
---

T-030 made `parseRoadmap` comment-blind. `splitSections` — the task-body
section splitter — is not, and was not touched. Before T-030 the two
agreed (both blind to comments); after it they disagree, and the
disagreement is silent in both directions.

Reproduced on this branch's parser, task body:

        ## Acceptance criteria
        - one
        <!--
        ## Verdicts
        -->
        - two, still under acceptance criteria

    splitSections -> keys ["acceptanceCriteria","verdicts"]
                     acceptanceCriteria = "- one\n<!--"

A commented-out heading FABRICATES a section that the file does not
have and TRUNCATES the one it does — the exact bug T-030 proved for the
roadmap backbone (where a commented `## Milestones` silently dropped
every real bullet after it), one layer up and still open.

T-030-s2 already proposes the right shape: one shared inert-span pass
used by BOTH parsers, so they never disagree. This suggestion is the
constraint that shape has to satisfy, because it is not obvious and it
is expensive to discover during implementation.

**The trap: T-030's own card would lose its Verdicts section.**
`docs/tasks/T-030-parser-strictness-pass.md` contains six `<!--`
openers, every one of them inside INLINE CODE, and the last one is
unterminated as a raw byte sequence — body line 252, the audit
sentence:

    ROADMAP.md contains no `<!--` at all (so the strip is a no-op there)

Feed that body through the roadmap's `stripHtmlComments` and the
unterminated opener blanks to end of file, taking `## Verdicts` with
it. Measured: `splitSections(body)` yields four sections;
`splitSections(strip(body))` yields three. The card that ratifies the
comment rule is the file the comment rule destroys.

The same hole is open in `parseRoadmap` today, not just hypothetically:

    ## Backbone
    - F-01: Real — yes

    Use `<!--` to open a comment.

    - F-02: Real — yes

    -> features [F-01] only, plus a roadmap-error. F-02 is gone.

So the inert-span pass must treat inline code (single backticks) as
inert as well — a case s2's shape names neither ("fenced blocks
(``` and ~~~, with the closing-fence and info-string rules) plus HTML
comments"). Scanning order matters too: code spans and fences have to
be recognised BEFORE comment openers, or the opener inside a span wins
and the rest of the pass is decided by a character that was never
markup.

Live exposure today: none, and worth stating precisely so nobody
promotes this as a live bug. `docs/ROADMAP.md` has no `<!--` at all
(re-derived on this branch and on main@8dadb59). Four live task files
contain HTML comments — T-023, T-038, and the two T-030 files — and
none of them commented-out a heading, so every live section split is
correct as it stands. This is a trap for the fix, not a bug in the
tree.

Arms:
(a) Implement s2's shared pass WITH inline code inert and this card as
    a regression fixture. The honest fix; the fixture is free, it is
    already written, and it fails loudly the moment the pass is wrong.
(b) Implement s2 for `parseRoadmap` only and leave `splitSections`
    alone. Cheaper, but it ratifies the disagreement — two parsers with
    two different answers to "is this content?" is the thing s2 exists
    to end.
(c) Fix `splitSections` alone (comments inert, fences left for later).
    Closes the fabricated-section half at the cost of the same inline-
    code trap, so it does not avoid this constraint, only defers the
    fence half.

Whichever arm: the pin belongs in `lib/parser/test/task.test.ts` as
"a commented-out heading neither opens nor closes a section", the
sibling of the roadmap pin T-030 landed.
