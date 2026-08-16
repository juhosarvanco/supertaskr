---
id: T-030-s2
title: The roadmap parser is comment-blind now, but still FENCE-blind — a fenced example row parses as a real feature
status: suggested
suggested_by: executor claude-opus-5 @T-030
---

T-030 closed the HTML-comment hole (T-023-s1): a column-0 `- F-NN:`
bullet inside `<!-- … -->` is no longer a phantom feature. The other
way markdown says "this is an example, not content" is a fenced code
block, and parseRoadmap has no fence awareness at all:

        ## Backbone
        ```
        - F-99: Example — how to write a backbone row
        ```
        - F-01: Real — the only real feature

parses TWO features, F-99 included, with zero issues. A malformed
example inside a fence (`- F-XX: …`) still emits a roadmap-error, which
lights the board's parse-error badge over content nobody shipped.

Not invented here: T-023's own implementation notes record the same
blindness one layer up — "splitSections has no fence awareness, so a
fenced `## heading` would leak into the task's section split" — and
that note is why every quoted example in this repo's task files is
INDENTED rather than fenced. The convention is currently held in place
by author discipline in two parsers.

Nothing in the live tree trips it today (this repo's ROADMAP.md has no
fences; every task file quotes by indentation), and T-030 deliberately
did not widen its scope to chase it — the criterion named HTML comments.
But the genesis kit writes ROADMAP.md from an interview transcript
(T-023/T-027), and a founder pasting a fenced example is exactly the
input that arrives from outside the discipline.

Shape, if promoted: one shared "inert span" pass — fenced blocks
(``` and ~~~, with the closing-fence and info-string rules) plus HTML
comments — used by BOTH parseRoadmap and splitSections, so the two
never disagree about what counts as content. Cheap next to the value of
having exactly one answer, and it would let the task-file notes stop
being indented-by-superstition.
