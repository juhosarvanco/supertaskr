---
id: T-154
title: The fence becomes a property at the moment of the write — a hook derives the card from the lane's own branch and blocks what the fence forbids
feature: F-04
milestone: 4
priority: 30
size: M
status: building
blocked_by: []
touches: [.claude/, tools/e2e, method/lane-protocol.md, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier:
built_by:
verified_by:
review:
---

ADR-020 decision 1. Three logged incidents would have been blocked
mechanically: `db4c903` (an architect edit inside T-138's held fence),
T-126's breach (verdict `de05430` ruled the fence should have held and
approved only by necessity), and the architect session's 2026-08-29
report ("I edited a file a live lane held"). Lane-protocol rule 5 is a
discipline today; this card makes it a property — the ADR-019
promote-if-it-slips trajectory applied one layer earlier, to the
moment of the write.

## The mechanism — expand at dispatch, read at the write

**REDESIGNED 2026-08-29 before dispatch** (pre-execution review): the
first draft expanded the fence AT HOOK TIME through `@nputer/parser`,
which has a bootstrap contradiction — a fresh lane worktree has
nothing installed and nothing built (CONVENTIONS' own bold sentence),
so a fail-closed hook needing `lib/parser/dist` blocks the executor's
first LEGAL write, and every escape hatch is worse (fail-open guts
the guard; a parser-free re-implementation is the T-057 sin). The
correct shape:

1. AT DISPATCH: the `brief.mjs --task` step the dispatcher already
   runs — which has a built parser by definition — writes the
   EXPANDED fence to `.nputer/lane-fence.json` in the worktree,
   stamped with the raw `touches:` line it expanded. One
   implementation (`fence.ts`), run once, where it can run.
2. AT THE WRITE: a PreToolUse hook on Edit/Write (repo-versioned in
   `.claude/settings.json`, inherited by every worktree) reads the
   manifest with ZERO dependencies. No manifest + no `task/T-NNN-*`
   branch = not a lane = ALLOW (integrator, architect and drill
   contexts; a positive control — refusal distinguishable from
   absence). A lane branch with no manifest = BLOCK: dispatch skipped
   its step.
3. Inside the manifest's paths, or under the unfenceable
   `docs/tasks/`: ALLOW. Outside: BLOCK, printing the fence, the
   path, and the route (file a suggestion, or the fence is wrong —
   triage's call, never the hook's).
4. STALENESS: the hook cheaply compares the card's current `touches:`
   line against the manifest's stamp; a mismatch BLOCKS with
   "re-expand", never guesses.

## Acceptance criteria

- WHEN a session in a lane worktree writes a file outside its
  manifest THE hook SHALL block the write, naming the fence, the
  path, and the route.
- WHEN the same write occurs in the main checkout or a detached
  worktree THE hook SHALL allow it, and the allow SHALL be proven by
  a positive control.
- IF a lane branch has no manifest, or the card's `touches:` no
  longer matches the manifest's stamp THEN the hook SHALL block with
  the reason, never allow silently.
- WHEN the hook lands THE lane-protocol rule-5 text SHALL say the
  property exists and name its honest limit — Bash-mediated writes
  remain protocol-covered in v1 — with that method text riding the
  shared v0.1.8 bump (`T-159`), not a bump of its own.
- The card's own CONVENTIONS documentation edit is EXPECTED to meet
  that file's warn line (280 bytes of headroom at filing); the warn
  is the tripwire working, and the executor moves content to a
  record rather than being startled.

## Org-scale note (ADR-020 decision 6)

This is the PROJECT tier of a two-tier design. The managed tier —
org-controlled, non-overridable hooks — is a named slot, not built
here; the hook's config shape should not preclude a second source.

## Loop-protection follow-ups (same layer, route if not taken here)

Block `docs/architecture/graph.json` writes outside a checkpoint
context; block test-file edits in a lane whose card is a fix task
(the playbook's protect-the-feedback-loop play; needs a card-type
marker first).

## Implementation notes
<!-- executor appends before finishing -->

### Understanding, confirmed before touching anything

I am building the two halves of the redesigned mechanism and nothing
else. At DISPATCH, a new named arm of `brief.mjs` — the step the
dispatcher already runs, in a checkout where `lib/parser/dist` exists by
definition — expands the card's `touches:` through the parser's ONE
fence implementation (`fence.ts`'s `expandFence`, with
`dispatch-order.mjs`'s `knownPathOracle` closing the bare-word gap) and
writes `.nputer/lane-fence.json` into the lane worktree, stamped with
the RAW `touches:` line it expanded. At the WRITE, a PreToolUse hook on
the file-writing tools, wired in the repo-versioned
`.claude/settings.json` and depending on nothing but node builtins,
reads that manifest and answers four ways: a checkout whose HEAD is not
on a `task/T-NNN-…` branch is NOT A LANE and is ALLOWED (the positive
control — integrator, architect and detached-drill contexts, so a
refusal is distinguishable from an absence); a lane branch with no
manifest BLOCKS, because dispatch skipped its step; a path inside the
manifest's expanded paths or under the unfenceable `docs/tasks/` is
ALLOWED; anything else BLOCKS, naming the fence, the path and the route.
A card whose current `touches:` line no longer matches the manifest's
stamp BLOCKS with "re-expand" rather than guessing which side is right.
My fence is `[.claude/, tools/e2e, method/lane-protocol.md,
docs/CONVENTIONS.md]` and the card's own criterion removes
`method/lane-protocol.md` from it in practice — the rule-5 text rides
`T-159`'s shared v0.1.8 bump, so I do not edit `method/` here and route
the sentence instead. `docs/tasks/` is writable for these notes and for
the suggestions I file. The CONVENTIONS edit is expected to meet that
file's warn line; the warn is the gate working.

## Verdicts
