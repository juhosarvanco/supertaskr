---
id: T-280-s5
title: "The push range is always @{upstream}..HEAD, so a push that NAMES a different destination derives the owed set for a range it is not publishing"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-280 phase 2 (fresh, after the fix pass), 2026-09-09, measured at 4d2d952 on the bench ../nputer-V-T-280"
blocked_by: [T-280]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

`pushRange` asks git one question — `@{upstream}^{commit}` — and never
reads the command line. That is the right base for the ordinary push
and its doc comment says why: git's own answer beats a refspec parser
this file already admits it does "imperfectly" in `pushTargetBranch`.
The gap is that the guard HAS the target and does not compare it.

Measured on a scratch clone at the lane tip: a branch tracking a
remote-tracking ref at the tip, one docs-only commit on top, and
`origin/main` sixty-three changed files behind.

    pushTargetBranch("git push origin HEAD:main") -> { branch: "main" }
    pushRange(root)      -> <upstream>..<HEAD>          (1 path)
    owedSetForPush(root) -> suites [e2e, rust], e2e over 11 spec files

    git diff --name-only origin/main..HEAD | wc -l   ->   63

So the seat may run `--range` for the small set, get a token, and push
sixty-three files' worth of tree onto `main` with the parser and app
suites never graded at that tree. At the base of T-280 the same push
required four GREEN legs.

**WHY THIS IS A CARD AND NOT A REJECTION**, stated so the next reader
does not have to re-derive it: the ordinary composition covers it. An
empty or small `@{upstream}..HEAD` means the pushed tree differs from
the UPSTREAM tree only by that range, and the upstream tip itself got
onto a remote through this same guard, gated for its own range. The
chain holds as long as every ancestor push was gated. It breaks in two
places nobody has ruled on:

- **a LOCAL upstream.** `@{upstream}` may name a local branch
  (`branch.<name>.remote = .`). Nothing checks that the upstream is a
  remote-tracking ref, and a local branch's commits are ungated until
  they are pushed.
- **a refspec whose destination is BEHIND the upstream**, which is the
  measurement above.

The safe shape is the one this file already uses everywhere else: when
`pushTargetBranch` names a destination that is not this branch's
upstream, or when the upstream is not a remote-tracking ref, return a
`problem` and let the caller fall back to the whole battery. It can only
ever be wrong by owing too much, which is the sentence the rest of this
mechanism is built on.

The body this owes is a discrimination: a fixture whose push command
names its OWN upstream must still derive the narrow range (the control,
without which the expectation is satisfied by a guard that refuses to
derive anything), and the same fixture with `HEAD:<other>` must fall
back to the whole battery.
