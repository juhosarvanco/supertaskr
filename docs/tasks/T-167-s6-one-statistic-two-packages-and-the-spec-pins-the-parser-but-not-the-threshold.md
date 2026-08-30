---
id: T-167-s6
title: One statistic now lives in two packages as two different numbers — check::WARN_HEADROOM_BYTES and the graph/budget-headroom-bytes band's breach line — and the spec that pins the band to check.rs pins its PARSER, not its THRESHOLD
feature: F-06
milestone: 4
priority: 21
size: S
status: planned
suggested_by: executor claude-opus-5@subagent @T-167-s2
blocked_by: []
touches: [tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**CLASS PARENT: `T-156` (the health bands). DISPOSITION HINT: promote at
low priority, or decline WITH THE REASON WRITTEN DOWN — the honest
outcome may well be "two stamps of one measurement are fine", but that
sentence does not exist anywhere today and the next reader will
re-derive the question from scratch.**

`T-167-s2` added `check::WARN_HEADROOM_BYTES` to
`app/src-tauri/crates/nputer-index/src/check.rs`: the headroom under
which `index --check` shouts. Its value is one mean single-commit growth
of `docs/architecture/graph.json`, **14,914**, re-derived at
`9ed2b7fa430d5088c6b5cbefe8c4f4cbac906803` (61 growths; median 5,230;
max 241,980).

The health band `graph/budget-headroom-bytes` in
`tools/e2e/scripts/health-bands.config.mjs` breaches at **15,751** and
says so in its own `measured.reason`: the same statistic, over 55
growths, read at `13c736e` from `IndexOptions::max_graph_bytes`'s doc
comment. So do `max_graph_bytes`'s own docs.

**Three copies of one measurement, taken at two refs, and nothing joins
them.** Every copy is stamped and none is false — the difference is six
growths of history, not a disagreement — but that is a claim somebody
has to re-derive to believe, and the repo has been bitten by one rule
with two implementations before (T-057, T-137, and the two `expandTouch`
joins). The specific gap: `tools/e2e/tests/health-bands.spec.ts` already
reaches ACROSS the package boundary to pin the band's PARSER to
`check.rs`'s own format strings, by symbol, with the reason written on
the body — *"somebody reformats `budget_line`, this band goes UNREAD
forever"*. The identical argument applies to the THRESHOLD and nobody
made it: somebody re-measures one number, the other keeps a figure from
a ref two months back, and the two instruments quietly stop meaning the
same thing.

Derive the three yourselves before deciding — a card that transcribed
them would be a fourth copy:

    grep -n 'WARN_HEADROOM_BYTES: usize' <the crate>/src/check.rs
    grep -n 'breach:' <the e2e package>/scripts/health-bands.config.mjs
    grep -n 'mean single-commit growth of' <the crate>/src/lib.rs

**CORRECTION AT PROMOTION (2026-08-30, standing sitting #3): THE THIRD
COMMAND WAS WRONG AND RETURNED NOTHING, which is this card's own defect
arriving one level down.** The command as filed searched for
`MEAN of 15,751` or `15_751`. The crate spells the number with ORDINARY
SPACES — `mean single-commit growth of 15 751 (55 growths on record,
median 5 230, max 241 980 at T-010)`, verified byte by byte at
`@ 51fa31c0964c` (the separator is `0x20`, not a comma and not an
underscore) — so the filed command finds the third copy in NEITHER
spelling and a reader running all three would conclude there are only
two. A card written to join three copies of a statistic could not find
one of them. The command above is corrected to search the surrounding
prose, which is stable under any digit-grouping style.

## Acceptance criteria

- THE band's breach line and `check::WARN_HEADROOM_BYTES` SHALL either
  be joined by an assertion that reds when they diverge, or the band's
  `measured.reason` SHALL state that the divergence is deliberate and
  what makes the two thresholds different questions.
- WHERE an assertion is chosen, IT SHALL cite the crate constant BY
  SYMBOL rather than by line, the way the parser pin in
  `health-bands.spec.ts` already does.
- THE change SHALL NOT edit the crate — `T-167-s2`'s doc comment already
  names the band, and a second edit there would make the pin circular.

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-06 p21 — the LOW-PRIORITY arm of its own disposition hint,
taken rather than the decline arm**, at `@ 51fa31c0964c`. The hint
offered "promote at low priority, or decline WITH THE REASON WRITTEN
DOWN". Declining was the live option until this sitting re-derived the
card's own three commands and found the third one broken (above): the
card is not merely asking whether two stamps of one measurement are
fine, it is demonstrating that the copies cannot currently be ENUMERATED
by the instructions written to enumerate them. That is a fact, not a
preference, and it is cheaper to fix than to argue.

**RE-FEATURED F-01 -> F-06.** The subject is the graph budget and the
class parent is `T-156` (the health bands), whose other live cards
(`T-156-s3`, `T-156-s5`, `T-156-s6`) all sit in F-06. Placement is
triage's call and this one was making the board's health-band family
sit in two columns.

**THE CARD'S THREE-COPY CLAIM IS TRUE AT THIS BASE**, re-derived here
rather than taken on the filing's word: `check::WARN_HEADROOM_BYTES` is
`14_914`; the band's `breach` is `15751`; the crate's own
`max_graph_bytes` doc carries `15 751` over 55 growths. Two values, three
sites, no join.

**AND HALF OF CRITERION 1 IS ALREADY SATISFIED ON ONE SIDE ONLY, which
the lane should know before it starts.** `check.rs`'s doc comment
already says the divergence is deliberate, in as many words: *"AND IT IS
DELIBERATELY THE SAME NUMBER A HEALTH BAND ALREADY CARRIES, said twice
because the two cannot see each other… a divergence between them is a
re-measurement until somebody shows it is a disagreement about
meaning."* The BAND says nothing of the kind. So the asymmetry is the
real gap: the crate knows about the band and the band does not know
about the crate. The card's third criterion (SHALL NOT edit the crate)
is therefore right and stays — the missing sentence belongs on the side
that lacks it.

**PREFLIGHT AT PROMOTION, AND WHY IT IS NOT GREEN.**
`node scripts/brief.mjs --task T-167-s6 --preflight`, run from the e2e
package at `@ 51fa31c0964c`: **exit 1**, two findings, and both are the
SAME live lane — `T-154-s2` reserves the whole e2e package by
containment, so each of this card's two file-level entries collides with
it. That is a fact about the clock, not about the card. Every other
claim class ran clean: paths missing **0**, criteria naming paths the
fence does not reserve **0**, unrunnable figures **0**, `blocked_by`
nothing, ref stamps **1 of 1 resolving**, and each fence entry reserving
exactly the one tracked file it names.

## Implementation notes

## Verdicts
