---
id: T-054-s2
title: The `·` trap is LOUD for a command the spec already claims — the notes' risk framing overstates it
status: suggested
suggested_by: verifier claude-opus-5 @T-054-verify
---

T-054's implementation notes record a real trap and draw a correct rule
from it: the derivation "ends at the first `·` segment that does not open
with a backtick", so a `·` inside a command's PARENTHETICAL truncates the
bullet's command list. The draft legend `exit 0 current · 1 STALE · …`
would have ended the `app/src-tauri` list at `index --check`.

**The mechanism is exactly as described. The consequence is not.** The
notes say `cargo audit`, `index --watch` and `arch` "would have silently
vanished from CI parity". Measured on this branch — HEAD's
`docs/CONVENTIONS.md` with the parenthetical re-legended back to `·`,
substitution counted and the resulting text printed to confirm it landed:

    exposed commands   19  →  16
    lost               [app/src-tauri] cargo audit
                       [app/src-tauri] cargo run -p nputer-index -- index --watch --root ../..
                       [app/src-tauri] cargo run -p nputer-index -- arch --root ../..

and the lane **REDS** — `npx playwright test tests/workflow-parity.spec.ts`
→ 2 failed, 12 passed, exit 1, naming all three by key:

    this spec expects [app/src-tauri] cargo audit
    this spec expects [app/src-tauri] cargo run -p nputer-index -- arch --root ../..
    this spec expects [app/src-tauri] cargo run -p nputer-index -- index --watch --root ../..

The derivation's second direction — "this spec expects X, which the doc
no longer lists" — catches every truncated command the spec CLAIMS. So
the truncation is silent in exactly one case: a command the DOC gains
that the spec does not yet claim. That is a narrower and more precise
hazard than "three of five commands vanish silently", and it is worth
stating precisely, because the narrow case is the one that actually
matters — it is the shape of every future edit to that section.

**And the rule has no home.** "A `·` may not appear inside a command's
parenthetical, only between commands or after the last one" is written
only in T-054's implementation notes, which the next editor of
`docs/CONVENTIONS.md` "Build & test" will not read. It belongs in one of
the two places they will: the `commandBullets` docstring in
`tools/e2e/tests/workflow-parity.spec.ts` (which already explains the
ends-at-first-non-backtick rule in general terms but never names the
parenthetical hazard), or a clause in the CI bullet itself.

Cheapest closer: one sentence in `commandBullets`' docstring, plus — if
it is judged worth a test — a fixture that splices a `·` into a
parenthetical and asserts the doc-side complaint, which would make the
narrow silent case loud too.
