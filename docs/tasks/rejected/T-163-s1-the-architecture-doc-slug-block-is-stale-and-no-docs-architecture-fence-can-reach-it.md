---
id: T-163-s1
title: docs/ARCHITECTURE.md's slug block is stale at T-163's tip, and the fence spelling every touch_slugs card reaches for cannot reach the file
feature: F-04
milestone: 4
priority: 2
size: S
status: rejected
suggested_by: executor claude-opus-5@subagent @T-163
blocked_by: []
touches: [docs/ARCHITECTURE.md]
builder:
verifier:
built_by:
verified_by:
review:
---

**FOUND BY T-163's LANE AT `71ce2422089c`, ROUTED RATHER THAN FIXED
BECAUSE THE FILE IS OUTSIDE T-163's FENCE.** Two things, and the second
is the one worth a card of its own.

## One — the block is stale, and a suite says so by name

@human's ruling of 2026-08-30 took C-11's `touch_slugs:` to `[]`.
`docs/ARCHITECTURE.md` carries a SECOND copy of the slug map — its
derived block, which still reads

    app-board    -> C-08, C-09, C-11, C-17, C-18
    app-shell    -> C-05, C-10, C-11, C-16

and, three paragraphs above it, the sentence *"Two slugs are claimed by
more than one component (`app-shell`, `app-board`)"*, which the ruling
makes false. The block is deliberately compared against the FIELDS on
every lane run, and the comparison reds by name — measured at
`89af57a`, `NPUTER_E2E_PORT=14733 npx playwright test
tests/brief.spec.ts` from tools/e2e/, body *"THE SLUG MAP COMES FROM THE
FIELD, and the prose block is compared rather than trusted"*:

    the architecture doc's block and app-board's component files
    disagree — the FIELD is authoritative (executor.md row 5), so the
    block is the side to repair

    - Expected: ["C-08", "C-09", "C-17", "C-18"]
    + Received: ["C-08", "C-09", "C-11", "C-17", "C-18"]

**AND IT IS WORTH THREE OF THE FIVE E2E REDS, NOT ONE.** The full lane
at `cec6cde` — `NPUTER_E2E_PORT=14741 npm test` from tools/e2e/, exit 1,
**5 failed / 315 passed** — also reds `session-economics.spec.ts`'s
*"the recommended seat is a function of the CARD …"* and *"the advisory
line is NOT a contract row …"*, both of which assert `exit 0` from
`brief.mjs --task T-157`. That command's FOUND list carries THREE items
and TWO of them are this staleness, printed by the assembler itself:

    the slug map's two copies disagree — app-board: field says
      C-08, C-09, C-17, C-18 and the prose block says … C-11 …
    the slug map's two copies disagree — app-shell: field says
      C-05, C-10, C-16 and the prose block says … C-11 …

(The third, `fences are not disjoint: T-162 tools/e2e against T-157
tools/e2e`, is `T-143-s1`'s already-filed subject and is untouched by
this repair — so those two bodies stay red until THAT is settled, and
this repair is still what removes two thirds of what the assembler
cannot settle.)

The repair is mechanical: drop `C-11` from both rows, and repair the
two-slug sentence and the surrounding paragraph, which argue their case
from the shared component that no longer exists. Whoever takes it should
read what that paragraph is FOR before rewriting it — it is the argument
for why a fence must expand through the fields rather than the prose,
and that argument survives the sharer it uses as its example.

## Two — and this is the standing hazard: the fence cannot reach it

T-163's `touches:` is `[docs/architecture, app/test]`, which is the
natural spelling for a card whose whole subject is a component file.
**It does not reach `docs/ARCHITECTURE.md`.** The fence domain is the
DIRECTORY `docs/architecture/`; the doc is a FILE beside it, differing
by case and a suffix. Asked, not assumed — `decide` in
`.claude/hooks/lane-fence.mjs`, whose `within(rel, domain)` is
`rel === domain || rel.startsWith(domain + "/")`:

    docs/ARCHITECTURE.md                               -> block (outside-the-fence)
    docs/architecture/components/C-11-design-tokens.md -> allow (inside-the-fence)

So **every card that moves a `touch_slugs:` field owes an edit to a file
the obvious fence for such a card excludes**, and the exclusion is
invisible at dispatch: the card parses, the preflight passes, the
manifest is written, and the lane discovers it only when a suite in a
third package reds. T-163 discovered it exactly that way.

**CLASS PARENT, CORROBORATED RATHER THAN DUPLICATED**: `T-160-s4` —
*"T-059's fence cannot reach a file its own criteria order it to
write"* — is the same shape found by a different lane on a different
card, and it in turn cites `T-127-s1`. This is a THIRD instance, and
the one that differs in a way worth filing separately: T-059's is a
fence that misses a file its own criteria NAME, while this one is a
fence that misses a file no criterion names at all — the obligation is
created by a suite in a third package, so a card author reading only
their own criteria cannot see it coming. Triage may prefer to absorb
this into whatever rules `T-160-s4`; the two arguments are different
and the repairs are in different files.

Dispositions, so triage has something to rule on rather than a
complaint:

- **Narrow** — this card, as filed: repair the block at whatever ref
  takes it, from a fence that names `docs/ARCHITECTURE.md` explicitly.
- **Structural** — make the block DERIVED rather than transcribed, so a
  `touch_slugs:` change cannot leave it stale. ADR-019's Law 2 (a figure
  needs a keeper) points this way, and `docs/CAPABILITIES.md` is the
  precedent already living in this repo: generated, with a currency
  check. The comparison in `brief.spec.ts` becomes the currency check.
- **Vocabulary** — teach the fence that `docs/architecture` and
  `docs/ARCHITECTURE.md` are one blast radius, or refuse the ambiguous
  token at `--write-fence` time. This is the largest and the one most
  likely to be a cure worse than the disease; it is listed because
  leaving it unnamed means the next card re-derives the choice.

The narrow disposition is a repair somebody owes at the next merge that
moves a slug either way; the other two are the reason this is a card and
not a line in a checkpoint.

DISCHARGED-NOT-DECLINED (2026-08-30, integration seat, the T-163 flip-set landing): the finding was real and the landing consumed it — performed in the merge window per the lanes-need-green-bases rule (a complement lane could not legally be cut from the red window this fix closes), with the executor's diagnosis on this card as the map and the select-board rewrite as the model. Every live half now states the ruled negative; every mechanism moved onto a synthetic registry carrying the shape. Evidence: the 2026-08-30-T-163 checkpoint record.

Standing triage sitting #2, 2026-08-30 (architect): ARCHIVED AS **DISCHARGED — NOT DECLINED**. The narrow half landed at the T-163 flip-set integration; re-derived at this sitting rather than taken on the stamp's word — `docs/ARCHITECTURE.md`'s block now reads `app-board -> C-08, C-09, C-17, C-18` and `app-shell -> C-05, C-10, C-16`, C-11 is gone from both rows, and the two-slug sentence above them is replaced by the ruling's own. The finding was right, the work is done, and there is no receiving card to carry an absorption line — which is why this archive entry names the landing instead. The card's SURVIVING half, the fence-vocabulary hazard (`docs/architecture` the directory versus `docs/ARCHITECTURE.md` the file), is not lost: it is appended as a dated corroboration to `T-160-s4`, the class parent this card itself named, carrying both dispositions it left open.
