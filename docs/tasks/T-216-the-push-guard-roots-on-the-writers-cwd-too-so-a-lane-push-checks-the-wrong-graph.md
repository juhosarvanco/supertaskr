---
id: T-216
title: THE PUSH GUARD ROOTS ON THE WRITER'S cwd TOO — `cd <lane> && git push` asks the DISPATCHING checkout's graph, so the guard answers about a tree the push does not contain
feature: F-06
milestone: 4
priority: 2
size: S
status: planned
blocked_by: [T-199]
touches: [.claude, tools/e2e]
suggested_by: "T-199's executor, which was told to treat push-guard.mjs's import list as a contract and found the same defect CLASS in the file's own rooting while checking it"
builder:
review: independent
---

**THE SAME LINE, IN THE GUARD NEXT DOOR.** `T-199` fixed
`lane-fence.mjs`'s `decide` by rooting on the TARGET rather than on
`request.cwd`. `.claude/hooks/push-guard.mjs` still roots on the writer:

`.claude/hooks/push-guard.mjs:449`

    const cwd = typeof request.cwd === "string" && request.cwd !== "" ? request.cwd : process.cwd();
    const root = findCheckoutRoot(cwd);

`root` then decides four things: whether this is *this* repository at all
(`INDEX_CRATE_MANIFEST_REL_PATH`), whether the pusher holds a lane,
whether that lane's fence can reach the graph, and — the load-bearing one
— **which checkout `index --check` is run in.**

## Why it is the same class and not the same card

In this project's dispatch shape a lane session's `request.cwd` is the
DISPATCHING checkout (`CLAUDE_PROJECT_DIR`), not the lane. A lane that
pushes with `cd /Users/ujju/Projects/nputer-T-NNN && git push` therefore
gets its graph judged **in the dispatching checkout** — a different tree,
a different HEAD, a different `docs/architecture/graph.json`. The verdict
can be green while the pushed commits carry a stale graph, and red while
they carry a current one.

**IT IS NOT FIXED BY COPYING `T-199`'s FIX**, which is why it is a card
and not a line. A write has a target path; a push does not. The
repository a `git push` acts on is named by the command's own `-C`/`--git-dir`
options, by a `cd` earlier in the same shell line, or by the shell's cwd
— and `push-guard.mjs` already declines to parse shell for a write target
(`lane-fence.mjs` limit 1 gives the reason: it "answers confidently and
wrongly"). So the honest options are narrower and each costs something:

1. **Read the `-C` option the guard's own `isPush` scanner already steps
   over**, and treat a bare push as the writer's cwd. Cheap, covers the
   explicit case, misses `cd … && git push` — which is the live case.
2. **Refuse to judge a push whose repository the guard cannot identify**,
   and say so. Fails closed on the guard that currently fails open.
3. **Leave it and DECLARE it**, the way `T-199` made an unjudged write
   announce itself — the guard already has an "announced allow" arm
   (`check-could-not-run`), so the shape exists.

## Acceptance criteria

- A body SHALL demonstrate the defect: a real lane worktree, a real
  `cd <lane> && git push`, and the check demonstrably run against a
  DIFFERENT checkout than the one being pushed.
- A positive control SHALL prove the guard still refuses a genuinely
  stale push and still passes a current one — `push-guard.spec.ts`
  already carries that pair (`WITH the guard, …`), so it is extension
  rather than invention.
- WHERE the guard cannot identify the pushed repository, the decline
  SHALL be observable rather than silent (`T-199`'s third criterion,
  applied to the guard beside it).
- Verification: headless.
