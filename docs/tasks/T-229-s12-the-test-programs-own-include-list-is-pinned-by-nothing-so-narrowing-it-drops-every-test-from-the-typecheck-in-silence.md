---
id: T-229-s12
title: The TEST program's own include list is pinned by nothing, so narrowing `app/tsconfig.test.json` to ["src"] drops every test from the typecheck while `npm run build` still exits 0
feature: F-06
milestone: 4
size: S
priority: 5
status: suggested
suggested_by: executor claude-opus-5@subagent @T-229-s10, seen while fixing the app program's pin at 21a74e6, 2026-09-09
blocked_by: []
touches: [app/test/crescendo-dom.test.tsx]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-229-s10` fixed how `app/tsconfig.json`'s include list is READ. It did
not add the missing pin next door. **`app/tsconfig.test.json` — the
program in which `node:fs` has `writeFileSync` at all, and the only
program that compiles `app/test/**` — has its `include` asserted by
NOTHING.**

`app/test/crescendo-dom.test.tsx`'s *"the app program still holds the
read-only node surface T-073 restored"* pins two facts about the APP
program: its include list, and what the ambient file that list names
declares. The comment on `app/tsconfig.test.json` says *"Every compiler
option is inherited; only `include` widens, because the WHOLE POINT of
the second program is that the first one is narrower"* — and that
sentence is unchecked. `grep -rn 'tsconfig.test.json' app/test/
tools/e2e/tests/` at `21a74e6083edfae28d511db3b55ee8d6060bb09d` returns
three hits, ALL of them prose in comments, and zero assertions.

**WHY IT MATTERS AND WHY NOTHING GOES RED.** `app/package.json`'s build
is `tsc && tsc -p tsconfig.test.json && vite build`. Narrow that second
program's include to `["src"]` and the second `tsc` compiles the app
program twice: it exits 0, `npm run build` exits 0, CI is green, and
every type error in every test file has stopped being a build failure —
the exact guarantee the file's own comment claims (*"a type error in a
test is still a build failure"*). It is `T-229`'s family shape one level
out: not a pin satisfied by a decoy, but a claim with no pin at all.

NOT MEASURED — this card asserts the ABSENCE of an assertion (verified by
the grep above, run at a named ref), and does not claim a kill set. The
build-still-green consequence above is derived from the script text and
should be DRILLED before it is written down as fact.

## Acceptance criteria

1. `app/tsconfig.test.json`'s `include` is pinned in the same body that
   pins the app program's, read off the PARSED JSON the way `T-229-s10`
   left that body reading, with the key's own uniqueness asserted.
2. A positive control that RUNS: narrowing the test program's include to
   `["src"]` REDS the new body, demonstrated GREEN against the body as it
   stands — and the same mutation is shown to leave `npm run build` at
   exit 0, which is what makes the pin worth having.
