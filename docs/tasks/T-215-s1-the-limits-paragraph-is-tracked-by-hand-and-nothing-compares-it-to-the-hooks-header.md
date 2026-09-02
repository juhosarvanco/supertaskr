---
id: T-215-s1
title: CONVENTIONS' limits paragraph is tracked BY HAND against `lane-fence.mjs`'s header, and nothing compares them — the branch spelling and the carve-out set are both compared, this is the third pair and the only uncompared one
feature: F-06
milestone: 4
priority: 2
size: S
status: suggested
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts]
suggested_by: "executor claude-opus-5@subagent @T-215"
builder:
verifier:
review: independent
---

**T-215's third acceptance criterion was a CONSIDER, and this card is the
answer it asked for.** `docs/CONVENTIONS.md`'s lane bullet publishes the
lane fence's limits; `.claude/hooks/lane-fence.mjs`'s header declares
them. The two are two copies of one fact with no comparison between
them, which is exactly the drift `T-215` was filed to repair by hand
after `T-199` moved the hook and left the page behind.

## Why it earns a card rather than a habit

**THE PATTERN IS ALREADY BUILT TWICE IN THE SAME SPEC FILE.**
`tools/e2e/tests/lane-fence.spec.ts:652` compares the hook's
`LANE_BRANCH_RE` against the spelling the document publishes, and `:1029`
compares `INTEGRATION_SEAT_PATHS` against the carve-out set the document
publishes. Both exist for the reason the hook's own header gives: this
file cannot parse a document on every keystroke, so the constant and the
page are COMPARED rather than trusted. The limits are the third pair and
the only one nobody checks.

**AND THE DIVERGENCE REDS NOTHING TODAY — MEASURED, NOT ASSUMED.**
Measured in the `T-215` lane at `e47bf86`: the whole set of eleven bodies
the DOCS GATE derives as readers of `docs/CONVENTIONS.md` was run against
a mutant paragraph carrying the exact falsehood `T-215` exists to delete
(*"a path OUTSIDE the writing checkout is allowed in BOTH seats … a
sibling lane's own tree … the last DELIBERATELY"*). **298 passed, exit
0.** The positive control run beside it — the same suite against a
one-word mutation of the carve-out sentence at line 1136, which body 1029
DOES read — reds by name: **1 failed / 52 passed, exit 1**, *"the hook's
carve-outs and the page's have drifted"*. So the reader family is live
and the paragraph is simply outside it.

## What the comparison would look like

**NOT A PROSE DIFF.** Both sides are prose, and a body asserting that two
paragraphs match reds on every re-wording — a gate this project would
learn to ignore, which is the objection `checkout-currency.mjs` already
records against its own sweep being a refusal.

**COMPARE THE DECLARED KEYS, THE WAY THE OTHER TWO PAIRS DO.** The hook's
header numbers its limits as `N. TITLE IN CAPS.` inside a
`── THE HONEST LIMITS` block, and `decide` names each declining limit with
a verdict CODE that is a string literal in the module — `not-a-repository`,
`not-judged-detached`, `not-judged-lane-list`, `no-path-to-judge`,
plus the refusing `unreadable-request`, `held-by-a-live-lane` and
`outside-the-fence`. Both are greppable literals, and the spec already
reads the hook's TEXT (`:542` does `readFileSync` on it and asserts a
header phrase), so no new export is needed and the fence is one file.

A body would then assert, naming both sides on a red:

1. the COUNT of numbered limits in the header equals the count the
   document's paragraph publishes (the paragraph numbers them `(1)`–`(8)`
   for exactly this reason), and
2. every declining CODE the hook can return appears in the lane bullet,
   so a limit the hook gains cannot land unpublished.

**AND IT NEEDS ITS OWN POSITIVE CONTROL**, per `docs/CONVENTIONS.md`'s
A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL: a fixture whose header
carries one more numbered limit than the page must red, or the body
passes against a page that publishes nothing.

## Acceptance criteria

- A body in `tools/e2e/tests/lane-fence.spec.ts` SHALL compare the count
  of numbered limits in `.claude/hooks/lane-fence.mjs`'s HONEST LIMITS
  header against the count `docs/CONVENTIONS.md`'s lane bullet publishes,
  and SHALL name both sides when they disagree.
- The body SHALL require every DECLINING verdict code the hook can return
  to appear in that bullet.
- A FIXTURE positive control SHALL prove the body reds when the header
  gains a limit the page does not carry.
- Verification: headless.
