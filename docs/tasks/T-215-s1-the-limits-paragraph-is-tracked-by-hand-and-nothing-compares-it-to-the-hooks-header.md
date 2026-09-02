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

## Absorbs: T-219-s5 (2026-09-02, handed to this live lane at T-219-s3's merge f6e3924)

T-219-s3 removed `carveOutFor`'s own-card arm (no manifest the parser
produces ever selected it), and two documents this lane already holds
still describe it. Both halves of this hand-off are the dispatching
seat's: the card on main and the lane's copy carry this section.
The sites, verbatim from T-219-s5:

1. `tools/e2e/tests/lane-fence.spec.ts`, the comment block above the
   `ownCard` assertions in *the carve-outs each free a DIFFERENT write,
   and the fence still holds around them* (the paragraph opening "THE
   OWN-CARD WRITE IS STILL ALLOWED, AND IT NO LONGER TAKES THE
   CARVE-OUT"). It reads `carveOutFor`'s FIRST arm answers for a lane's
   own card file` in the present tense, and ends *"the arm is ROUTED as
   `T-219-s3` rather than touched here, and this assertion is what will
   red when it is fixed."* **The arm was removed rather than made
   reachable, so the assertion did NOT red** — it is now the permanent
   pin, which is what `T-219-s3`'s own card prescribes for that branch of
   the decision (*"IF the arm is removed THEN … its comment pointing here
   SHALL be updated"*). The assertion and its message are still correct
   and should stay; only the comment's tense and its promise move.

2. `tools/e2e/tests/lane-fence.spec.ts`, the comment on the
   `"missing the excluded field the carve-outs are read from"` case in *a
   manifest the hook cannot read is a refusal, never a shrug*. It says
   the lane-less arm *"can only do that from a manifest that carries the
   carve-out"*. `readManifest` still REQUIRES `excluded` and the
   assertion is unchanged, but the field is now a SHAPE check — a
   manifest missing it was written by a writer older than `T-154-s2` —
   and no arm reads it. The label string is part of the assertion's
   message rather than a bare comment, so this one is a two-line edit.

3. `docs/CONVENTIONS.md`, the `THE LANE PROTOCOL` bullet, sentence
   opening **THE CARVE-OUTS ARE CRITERIA AND NEVER THE HOOK'S
   JUDGEMENT**. It lists three: `docs/tasks/` as `alwaysWritable`, *"a
   card's own file is outside every fence (its `excluded`)"*, and this
   seat's standing writes. The middle clause's CLAIM is still true — a
   card's own file is outside every fence — but it is listed as a
   carve-out the hook applies, and the hook no longer has an arm for it.
   `expandFence` subtracts the file from `paths` at dispatch, so the
   write meets no reservation at all. **The regex the spec's *the
   carve-out set this hook holds is the one docs/CONVENTIONS.md
   publishes* body extracts (`never a lane's to veto — exactly (.*?), no
   more`) is in the THIRD clause and is untouched by this**, which is why
   nothing reds.

Criteria carried:

- Site 1's comment SHALL describe the arm in the past tense and name
  `T-219-s3` as where it was removed and why, replacing the promise that
  the assertion will red; the assertion and its message stay.
- Site 2's label SHALL say the field is required as a manifest SHAPE
  check rather than as a carve-out source.
- Site 3's sentence SHALL attribute the own-file carve-out to
  `expandFence` at dispatch rather than to the hook's criteria, without
  moving the published `docs/STATE.md`/`docs/checkpoints` clause the
  spec's regex reads.
- A BODY SHALL pin that `carveOutFor` answers a card file through the
  UNFENCEABLE arm and not through an own-file arm, discriminating on the
  returned `domain`/`why` rather than on a carve-out being returned at
  all — the paragraph above says why presence proves nothing — and it
  SHALL be demonstrated red against a re-added arm before the card
  closes.
- The three prose edits above SHALL leave every existing body green:
  `lane-fence.spec.ts` in full, and the CONVENTIONS comparison body by
  name.
