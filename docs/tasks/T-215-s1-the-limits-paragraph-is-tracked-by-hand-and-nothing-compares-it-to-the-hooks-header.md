---
id: T-215-s1
title: CONVENTIONS' limits paragraph is tracked BY HAND against `lane-fence.mjs`'s header, and nothing compares them — the branch spelling and the carve-out set are both compared, this is the third pair and the only uncompared one
feature: F-06
milestone: 4
priority: 2
size: S
status: building
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts, docs/CONVENTIONS.md]
suggested_by: "executor claude-opus-5@subagent @T-215"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
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

## TRIAGE, 2026-09-02 — promoted and dispatched, priority 2, at T-215's merge (c8f69aa)

The architect seat. The verifier measured that this card's second
criterion (every declining verdict code appearing in the bullet) cannot
be met inside a one-spec fence — the codes occur zero times in
CONVENTIONS — so the fence gains docs/CONVENTIONS.md, and the two
sibling corrections to the same paragraph ride this lane so the keeper
lands on a paragraph that is already true. Criteria: a body SHALL
compare the header's numbered-limit count and its declining verdict
codes against what the lane bullet publishes and red when either
drifts, with a positive control against a planted header; the
paragraph SHALL carry the codes; the two absorbed corrections SHALL be
made first and covered by the same keeper.

## Absorbs: T-215-s3 (2026-09-02)

The bullet publishes ONE fence layer and there are two: limit 1's
"stays protocol-covered" understates T-210's physical read-only layer.
The paragraph SHALL name both layers and what each catches.

## Absorbs: T-215-s5 (2026-09-02)

"The hook FAILS OPEN in exactly one shape" is false — checkout-currency
.spec.ts:387 measures ARM B, one fault (only the hook file absent) where
the published shape needs two. The paragraph SHALL state both shapes,
and the keeper SHALL read the count from the hook.
