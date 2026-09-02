---
id: T-215-s7
title: "`T-215-s1`'s keeper compares the HONEST LIMITS block against the page and never against the header's OWN decline list, so `T-215-s2`'s wrong limit number sat under a green suite — the citation nobody reads is the one that drifted"
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
blocked_by: []
touches: [tools/e2e/tests/lane-fence.spec.ts]
suggested_by: "executor claude-opus-5@subagent @T-215-s2"
builder:
verifier:
built_by:
verified_by:
review: independent
---

**MEASURED IN `T-215-s2`'s LANE, AT `1886cc7`, BEFORE THE ONE-CHARACTER
FIX LANDED**: `tools/e2e/tests/lane-fence.spec.ts` ran **60 passed** with
`.claude/hooks/lane-fence.mjs`'s header calling `no-path-to-judge` *"limit
5"* where the same file's HONEST LIMITS block, its `noTargetVerdict`
doc-comment and its runtime message all say **8**. Every shipped reader of
that header was green over the defect the card existed to delete.

## The three readers that exist, and what each one misses

`.claude/hooks/lane-fence.mjs` has exactly three text readers in the tree,
all in `tools/e2e/tests/lane-fence.spec.ts`:

- *"a path in NO git checkout is not judged, and the narrowed limit is
  declared"* — asserts three header PHRASES present or absent. Reads no
  number.
- *"the hook depends on NOTHING a fresh worktree lacks"* — reads import
  specifiers.
- *"the limits this hook declares are the limits docs/CONVENTIONS.md
  publishes"* (`T-215-s1`) — `headerLimitNumbers` slices the leading block
  comment, then slices again from `── THE HONEST LIMITS`, then matches
  `/^ \* (\d+)\. /gm`. **THE SLICE IS THE WHOLE OF IT**: the decline list
  in `── AN UNJUDGED WRITE SAYS SO` sits ABOVE that marker, so its four
  `` `code` (limit N) `` citations are outside every window the keeper
  opens, and `declineCodesInSource` checks only that each code is
  PUBLISHED in the lane bullet — never which number the header attaches
  to it.

So the keeper compares the block to the PAGE and the codes to the PAGE,
and nothing compares the header to ITSELF. `T-215-s1`'s own verifier saw
this error at `:144` and correctly declined to propagate it into
`docs/CONVENTIONS.md`; the header-side repair was routed as `T-215-s2` and
made by hand, which is the state this card ends.

## The property, and it is already drafted

`T-215-s2` built a throwaway probe outside the tree and measured it. It
has two arms with **non-containing kill sets**, both derived from readers
the keeper already has:

- **ARM A** — for every `` `code` (limit N) `` in the decline list, if
  that code is written inside exactly one numbered limit's text, N SHALL
  be that limit's number.
- **ARM B** — a `(limit N in this file's header)` string inside a
  `decline(...)` call SHALL carry the same N the decline list gives that
  decline's code.

Measured on planted files in the `T-215-s2` lane, each plant run through
the same reader as the subject:

| plant | Arm A | Arm B |
|---|---|---|
| the tree as dispatched (`no-path-to-judge` at 5) | **RED** | **RED** |
| the corrected header (8) | green | green |
| runtime message moved to 5, block left at 8 | **RED alone** | green |
| decline list and block at 8, runtime message at 5 | green | **RED alone** |
| limit 8's own number rewritten to 5 in the block | green | **RED alone** |

**THE RESIDUE, DISCLOSED RATHER THAN DISCOVERED — ARM A COVERS ONE CODE
OF FOUR.** Only `no-path-to-judge` is written inside the HONEST LIMITS
block (`T-215-s1`'s verifier established exactly this, and it is why that
card's own reader takes `DECLINE_CODES` as its authority instead of
grepping the header). So a plant renaming `not-judged-detached`'s citation
from limit 3 to limit 7 passes Arm A silently — measured, not reasoned.
Whoever builds this SHALL either state that residue in the body's own
comment or close it, and closing it means giving the block a greppable
handle for the other three codes, which is a change to
`.claude/hooks/lane-fence.mjs` and therefore a second fence.

## Acceptance criteria

- `tools/e2e/tests/lane-fence.spec.ts` SHALL compare every `` `code`
  (limit N) `` citation in `.claude/hooks/lane-fence.mjs`'s decline list
  against the number the same file's HONEST LIMITS block and its runtime
  `decline(...)` messages carry for that code.
- The body SHALL be ANTI-VACUOUS: it SHALL assert that the decline-list
  reader and the numbered-limits reader each found something, since every
  comparison it makes is satisfied at once by an empty list.
- A POSITIVE CONTROL SHALL red on a PLANTED header carrying the exact
  defect `T-215-s2` fixed, read back through the same `readFileSync` the
  subject uses, and the two kill sets SHALL NOT contain each other.
- The body SHALL state the coverage residue above — that Arm A binds only
  a code the numbered block spells — or close it.
- Verification: headless.

## Why it is routed and not built

`T-215-s2` is fenced to `.claude/hooks/lane-fence.mjs` exactly. The bodies
that drive this hook live in `tools/e2e/tests/lane-fence.spec.ts` and
`tools/e2e/tests/lane-lock.spec.ts`, both outside that fence, so this is
`method/lane-protocol.md` rule 5 — a dispatch boundary, routed rather than
crossed.
