---
id: T-031-s1
title: The board's containment pass finishes — the verdict splitter anchors at column 0, two unenumerated surfaces get break-words, and a class pin that cannot tell three classes apart is replaced by a property
feature: F-02
milestone: 4
priority: 35
size: M
status: planned
blocked_by: []
touches: [app-board, app-shell, tools/e2e]
suggested_by: executor claude-opus-5 @T-031
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-031-s5 (Amnesty triage 2026-08-29 (triage seat)) — same surfaces, same lane, and its remedy is a criterion here: the ModelBadge comment states a flexbox mechanism the ablation refutes, and the body defending it reds identically whichever of the three classes is removed.

Absorbs: T-031-s3 (Amnesty triage 2026-08-29 (triage seat)) — same containment class as T-031's sweep, same two-utility remedy, and both surfaces were outside the criterion's enumeration: criterionLines' row span and NeutralChip's feature chip carry min-w-0 without break-words, and feature is free text the parser preserves even when it names nothing in the backbone.

**PROMOTED at the amnesty triage, 2026-08-29, carrying three findings
from T-031's own lane that could not be built inside its fence.** The
fence is the whole reason all three survived: `verdicts.ts` is C-05's
(`app-shell`), T-031's fence was `[app-board, app-interview]`, and
`app-shell` was held live by T-123 at that dispatch. This card carries
the fence the work actually needs.

Absorbs: T-031-s3, T-031-s5 (see the corroboration lines below).

The splitter needle is LIVE at this base — `app/src/lib/verdicts.ts:41`
still reads `VERDICT_DATE.test(line.trim())` — and the defect is
launch-relevant by T-031's own preamble: the board is the launch
screenshot surface, and an APPROVED entry that quotes an earlier verdict
header verbatim and INDENTED mints a phantom terracotta block and
inflates the `rejected ×N` face count. The blockquote form is already
safe because `>` survives `trim()`.

## Acceptance criteria

- WHEN `verdictEntries` splits a card body THE splitter SHALL anchor at
  column 0 — testing the RAW line, never `line.trim()` — so indented
  verbatim quotes of earlier headers fold into their parent entry and
  `rejected ×N` stops counting quoted headers.
- THE splitter SHALL stay ONE implementation. A board-owned post-pass
  that re-folds the output is refused by name: it leaves a splitter
  known to be wrong live in the tree and puts half of one rule in a
  second module, which is T-057's shape and the reason `verdicts.ts`
  exists as its own module at all.
- WHEN a criterion row or a neutral chip renders text it does not
  control THE surface SHALL be able to break it — `criterionLines`'
  row span and `NeutralChip` both carry `min-w-0` without
  `break-words` today, and `feature` is a free string the parser
  deliberately does not constrain to a vocabulary.
- THE ModelBadge header comment SHALL state the mechanism the
  measurement found rather than the one it asserts: `truncate` clips,
  `max-w-24` caps AND defeats `min-width: auto` by Flexbox §4.5, and
  `min-w-0` is belt-and-braces on that element. Ablating `min-w-0`
  alone changes nothing at any level, measured.
- WHEN the badge's bound is pinned THE assertion SHALL be a PROPERTY
  the class list cannot satisfy — rendered badge width capped and the
  card's `scrollWidth` not exceeding its `clientWidth` under a hostile
  stamp, with the full raw value still on `title=` as the positive
  control. It SHALL red for `truncate` and `max-w-24` and SHALL stay
  green for `min-w-0`; a body that reds identically for all three is
  pinning the mechanism in place of the property.
- IF a surface this card names has moved component since T-149 THEN the
  lane SHALL re-derive its owner from the component files' own
  `paths:` rather than from this card's prose.

## The record, kept verbatim

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

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
