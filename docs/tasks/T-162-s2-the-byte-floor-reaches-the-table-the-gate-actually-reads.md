---
id: T-162-s2
title: The byte floor reaches the table the gate actually reads — ADR-019 legislates `warn = landed + max(F, landed × 0.25)` and DOC_BUDGETS still holds the proportional line
feature: F-01
milestone: 4
priority: 3
size: S
status: planned
blocked_by: [T-162-s1]
touches: [tools/e2e/scripts/docs-scan.mjs, tools/e2e/scripts/health-bands.config.mjs, tools/e2e/tests/health-bands.spec.ts]
suggested_by: executor claude-opus-5@subagent @T-162-s1
builder:
verifier:
built_by:
verified_by:
review:
---

**ROUTED OUT OF `T-162-s1`, WHICH COULD NOT REACH THESE PATHS.** @human
ruled the byte floor on 2026-08-30
(`docs/rooms/governing-docs.md` §THE BUDGET FORMULA). `T-162-s1` was
fenced `[docs/decisions, docs/rooms]` and carried the ruling into
**ADR-019 §Budgets** with the derivation in **addendum 5**. Every
executable and prose site of the OLD formula is under `tools/e2e`, which
that fence does not reach — so the decision and the code now disagree,
deliberately and visibly, and this card closes it.

**THE DISAGREEMENT IS IN THE SAFE DIRECTION, WHICH IS WHY THIS IS A CARD
AND NOT AN INCIDENT.** The code holds the TIGHTER line (the old
proportional warn), so the gate fires EARLY rather than late and nothing
is unguarded in the window. Do not treat it as urgent; treat it as owed.

## The sites, measured at `bd8a8e88c727` — re-derive, do not trust this list

- `tools/e2e/scripts/docs-scan.mjs` — `DOC_BUDGETS`: the `docs/STATE.md`
  entry's `warn` is the one value the floor moves. Its doc-comment
  ("warn at landed size × 1.25") and the RE-LANDED comment inside the
  literal ("warn = ceil(landed x 1.25)") both state the superseded rule.
- `tools/e2e/scripts/health-bands.config.mjs` — two comments, and these
  are the interesting ones: they ARGUE AGAINST a byte floor and rest on
  an invariant the ruling breaks. One says headroom at a landing is
  "EXACTLY 20% of the warn line, for every document, by construction";
  the other repeats it as "20% by construction (warn = landed x 1.25)".
  Under the floor STATE lands at ~23.3%, so the invariant is false and
  the argument is overruled — rewrite them to record what was ruled and
  why, rather than deleting an argument the record should keep.

**NOTHING ASSERTS THE 20% INVARIANT IN A TEST** (swept at the ref above):
`health-bands.mjs` computes the percentage from the live file size and
`b.warn`, so the bands follow the table automatically. Expect no red from
the invariant itself — which is exactly why a comment sweep is owed, as
nothing else will catch it.

## Acceptance criteria

- WHEN `DOC_BUDGETS` is re-landed under the floor THE lane SHALL derive
  `F` at ITS OWN ref by ADR-019 addendum 5's stated rule — the mean of
  the smallest governed document's positive first-parent growths — and
  report the value with the command that produced it, rather than
  copying addendum 5's figure.
- IF the re-derived `F` differs from ADR-019 §Budgets' stated value THEN
  the lane SHALL record the difference and its cause, and SHALL NOT
  silently write either number over the other — §Budgets' value is
  decision text and moves by addendum.
- WHEN the table is written THE `warn` of every gated entry SHALL equal
  `ceil(landed + max(F, landed × 0.25))` and every `fail` SHALL be
  unchanged, verified by `npm run lint:docs` from tools/e2e/ reporting
  the budgets hold.
- WHERE any comment under `tools/e2e` states the superseded
  `warn = landed × 1.25` or the "20% by construction" invariant, THE lane
  SHALL update it; the sweep SHALL be a command over the tree, reported
  with its output, never a remembered list.
- THE lane SHALL run `npm test` and `npm run typecheck` from tools/e2e/
  and report both exit codes — `health-bands.spec.ts` pins the table's
  single home and the band-per-gated-entry derivation, and is the body
  most likely to answer for a mistake here.

## Notes for whoever dispatches this

**`tools/e2e` WAS HELD WHEN THIS CARD WAS FILED.** `T-167-s8`
(`touches: [.claude, tools/e2e]`) was a live lane at `bd8a8e88c727` —
derive the lane list at dispatch (`git worktree list --porcelain`) rather
than trusting this sentence, but expect to sequence behind it.

The DOCS GATE fires for this card's diff only if it touches `docs/`; a
`tools/e2e`-only diff fires the GRAPH REGEN gate instead (`*.mjs`/`*.ts`
outside `docs/`). Derive both from the actual diff.
