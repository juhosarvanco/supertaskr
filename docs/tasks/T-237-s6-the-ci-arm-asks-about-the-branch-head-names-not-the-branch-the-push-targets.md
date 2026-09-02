---
id: T-237-s6
title: The CI arm asks about the branch HEAD names, not the branch the push TARGETS — a refspec push onto main from a lane checkout cancels main's run and is allowed in silence
feature: F-06
milestone: 4
priority: 3
size: S
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-237
blocked_by: [T-237]
touches: [.claude/hooks/push-guard.mjs, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

**MEASURED IN THE VERIFIER'S BENCH AT `d0f04dc`, WITH A CONTROL.**
`ciVerdict` derives its branch from `readHeadRef(root)` — the branch the
PUSHED CHECKOUT's HEAD names. A push spelled with an explicit refspec
targets a branch that need not be the one HEAD names, and the guard then
asks `gh` about the wrong one.

The reproduction, both halves through the real hook runner with a
branch-aware `gh` shim that answers a live run for `main` and `[]` for
anything else — which is what GitHub really answers here, because
`ci.yml` triggers on `push: branches: [main]`:

| HEAD is | command | judged | result |
|---|---|---|---|
| `task/T-999-something` | `git push origin HEAD:refs/heads/main` | asked `--branch task/T-999-something` | **exit 0, silent** |
| `main` | `git push origin HEAD:refs/heads/main` | asked `--branch main` | exit 2, `ci-run-in-flight` |

The first row is a push that really would cancel `main`'s in-flight run,
allowed without a sentence. The discriminator is the local HEAD, not the
push target.

## Why this is a follow-up and not a defect in T-237

**It fails OPEN, which is the pre-guard state** — `push-guard.mjs`'s own
`gitInvocations` header already prices exactly this class: *"A FALSE
NEGATIVE is a push this guard did not see, which is exactly the pre-guard
state and never worse than it"*, and lists alias, function, script file,
`eval` and quoted-string holes beside it. And the spelling is not one
this project documents: `docs/` and `method/` carry `git push`,
`git -C <dir> push` and `cd <dir> && git push`, and the refspec form
appears only inside this suite's own fixtures. The dominant real path —
the integrator on `main` running `git push` — is covered, and the
cross-checkout spellings were measured correct: `git -C <root> push` and
`cd <root> && git push` both ask about the JUDGED root's branch, which is
T-216's rooting extended intact to the new arm.

**What is missing is the DISCLOSURE, not the behaviour.** The header's
*WHICH BRANCH, AND WHY NOT THE INTEGRATION BRANCH BY NAME* argues why
HEAD's branch beats a hard-coded name, and it is a good argument. It then
says a lane push *"answers in one round trip and says nothing"* — framing
the lane case as a COST. The residual above is a different thing and is
not stated anywhere in the file or on the board: a push whose refspec
names a branch other than HEAD's is asked about the wrong branch, and the
silence is indistinguishable from *"nothing is running"*.

## What a fix decides

1. **Whether the refspec is read at all.** `gitInvocations` already
   yields the push's tokens; the last non-flag token of a `git push`
   line is often `<src>:<dst>` or a bare branch. Reading it is a parse,
   and this file's standing rule (`UNRESOLVABLE_TOKEN_RE`, T-025-s4) is
   that a hook may read only what the text DETERMINES — so a literal
   `HEAD:refs/heads/main` is readable and `"$BRANCH"` is not.
2. **Or whether the honest answer is a second question.** Asking `gh`
   about HEAD's branch AND about `INTEGRATION_BRANCH` costs one more
   round trip on lane pushes, which T-237-s4 is already measuring.
3. **Or whether disclosure alone is the whole fix** — a paragraph in
   *WHICH BRANCH* naming the residual, which is what the rest of this
   file does with every hole it declines to close.

Whichever, the positive control is the table above: the lane-HEAD row
must change answer and the `main` row must not.
