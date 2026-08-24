---
id: T-031-s1
title: T-031's verdict-splitter criterion is NOT BUILT — verdicts.ts is C-05's, so it needs an app-shell fence
status: suggested
suggested_by: executor claude-opus-5 @T-031
---

T-031's third acceptance criterion — *"THE verdict splitter SHALL anchor
at column 0 (test the RAW line, not line.trim()) so indented verbatim
quotes of earlier headers fold into their parent entry and rejected ×N
stops counting quoted headers"* — is the one criterion this lane did NOT
build, and the reason is a fence, not a difficulty. It is a one-line
change and its test cases are already written out in the absorbed
finding.

**THE SPLITTER IS OUT OF FENCE, DERIVED RATHER THAN GUESSED.**
`verdictEntries` lives in `app/src/lib/verdicts.ts`. That path is listed
verbatim in `docs/architecture/components/C-05-app.md`'s `paths:`, and
C-05 carries `touch_slugs: [app-shell]`. ARCHITECTURE's own paragraph
under the slug table is explicit that the prose line is *"A SIGNPOST AND
NOT THE MAP"* and that the AUTHORITY is each component file's own
`touch_slugs:` — read that way, `app-board` is C-08/C-09/C-11 and NONE
of the three claims `verdicts.ts`. T-031's fence is
`[app-board, app-interview]`; `app-shell` was held by a live lane
(T-123) at this dispatch.

**THE ABSORBED FINDING SAID OTHERWISE AND THE CARD INHERITED IT.**
`T-017-s3` ended *"Touches app-board only; no parser change"*, and
T-031's card was assembled from that sentence. It was wrong about the
slug, and it is worth naming because the same sentence appears on
`T-017-s1` and `T-017-s2` — both of which happen to be right, because
their surfaces really are under `app/src/components/board/**`. One
finding in a family of three carried a bad fence word and nothing
checked it for eleven days. T-017 itself could touch `verdicts.ts`
legitimately: its own `touches:` was `[app-board, app-shell]`, and it is
the commit that CREATED the file.

**WHAT IT NEEDS.** Either a card fenced `[app-board, app-shell]` (the
T-017 shape) carrying the criterion and its two quote-form pins in
`app/test/detail-presentation.test.ts`, or an architect ruling that
moves `app/src/lib/verdicts.ts` out of C-05's `paths:` into C-08's or
C-09's — which is arguably where it belongs on the merits, since its
only two consumers are `TaskDetailPanel.tsx` (C-09) and `board-model.ts`
(C-08) and it has no reader under `components/shell/**` at all. The
second is the better fix and the more expensive one: moving a path
between components is a registry edit, and the CONVENTIONS gotcha
"DECLARING A COMPONENT moves THREE live-registry fixtures" governs it.

**WHY NOT A WRAPPER.** A board-owned post-pass that re-folds
`verdictEntries`' output would be in fence and was rejected: it leaves a
splitter known to be wrong live in the tree, it puts half of one rule in
a second module (T-057's "a rule with two implementations is two chances
to disagree", which is the exact reason `verdicts.ts` exists as its own
module), and it does not satisfy the criterion as written, which names
`line.trim()` by name. Widening a fence from inside a lane and dodging
one with a second implementation are the same move wearing different
clothes.

**THE DEFECT IS STILL LIVE AND IS LAUNCH-RELEVANT.** T-031's own
preamble says so: *"the board is the launch screenshot surface, and the
splitter fix stops a once-rejected face reading `rejected ×2`"*. An
APPROVED entry that quotes an earlier verdict header verbatim and
INDENTED mints a phantom terracotta block and inflates the face count;
the blockquote form (`> 2026-…`) is already safe because `>` survives
`trim()`.
