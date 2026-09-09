---
id: T-280-s4
title: "The token's spec-axis check asks ONE entry, named by a constant, so the day a second leg becomes scopable the push guard's fail-closed fallback silently re-opens the hole a rejection was spent closing"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-280 fix pass, 2026-09-09, noticed while lifting the scope check out of the owed branch in the lane worktree ../nputer-T-280"
blocked_by: [T-280]
touches: [.claude/hooks/gate-token.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

T-280's phase-2 rejection was one sentence: the fallback checked the
SUITE axis and never the SPEC axis, so a token minted by `--range` over
16 of 39 spec files passed as a whole battery. The fix reads the `scope`
field on both paths. This card is about the SHAPE of that read, which
is still narrower than the property.

`judgeToken` asks the question of exactly one entry:

    const scopable = token.suites[SCOPABLE_SUITE];   // SCOPABLE_SUITE = "e2e"

and `SCOPABLE_SUITE` is a single frozen string, pinned by a body against
the runner's own `SCOPED_SUITE`. The invariant that makes this sound
today is a fact about the RUNNER, not about the TOKEN: only the
end-to-end leg has a narrowing form, so only its entry can ever carry a
`scope`. Two things follow, and neither is checked anywhere:

1. **A token carrying a `scope` on any OTHER entry is accepted.** Write
   `scope` onto the `app` entry by hand and the fallback reads the `e2e`
   entry, finds none, and allows. Nothing writes that today — which is
   exactly why nothing would notice when something does.
2. **The day a second leg becomes scopable, the hole re-opens in
   silence.** The rust leg is the obvious candidate (it already grades
   18 targets, and a per-target narrowing is the same argument this card
   family made for spec files). Whoever adds it must ALSO remember to
   widen a constant in a different file, in a hook, with no test that
   fails if they do not — the precise shape of the defect that cost this
   card a rejection, one identifier over.

The fix is small and is the class fix rather than the instance one:
ask the question of EVERY entry the token carries rather than of the one
the constant names — a `scope` on any entry in the required set means
that leg ran in part, whichever leg it is. `SCOPABLE_SUITE` then keeps
its job in the OWED branch (where the owed set genuinely has an `e2e`
face and no other) and stops being the gate on the fallback.

The body this owes is a discrimination and not a restatement: a token
whose `app` entry carries a `scope`, with no owed set derivable, must be
refused as `token-partial` — and the same token with the `scope`
removed must still be allowed, which is the control that stops the
expectation being satisfied by a guard that refuses everything. The
existing bodies are the pattern (`push-guard.spec.ts`, the
`owed-scope-fallback` fixture); `plantSuites` already takes a `scope`
argument and would need it to reach an entry other than `e2e`.

NOT DONE IN THE LANE deliberately: the rejection named one defect and
the fix pass answers it exactly. Widening the read changes the answer
for tokens no form in this repository can currently mint, which is a
new property rather than the correction that was owed — and a fix pass
that grows past its verdict is the thing a second verification cannot
grade against the first.
