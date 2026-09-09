---
id: T-223-s6
title: "`landing-gate.spec.ts` repeats the now-bound absolute in its own comment and measures only ONE of limit 6's two routes — the `git symbolic-ref HEAD` route has no body at all"
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: "executor claude-opus-5@subagent @T-223-s4, 2026-09-09"
blocked_by: []
touches: [tools/e2e/tests/landing-gate.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

CLASS PARENT: `T-223-s4`, which is the class parent's own class — **a
sentence about what a lane cannot reach, stated as an absolute.** Found
by the lane that bound the hook header's copy of it; the spec's copy is
outside that lane's fence and is therefore routed rather than taken.

## ONE — the comment carries the absolute the header no longer does

`tools/e2e/tests/landing-gate.spec.ts`, in the leading comment of
*"THE DISCLOSED LIMIT, MEASURED: a lane moves local `main` with
`update-ref` and this gate follows it"* (line 779 at `4a9aed6`):

> The property the gate actually rests on is narrower and true: no
> COMMIT the lane makes moves that ref.

That is the sentence `T-223-s4` measured false and bound to its premise
in `.claude/hooks/landing-gate.mjs`'s header. It is true only WHILE
`HEAD` names the lane branch, and the spec's copy carries no such clause
— so the repository now states the property two ways, one bound and one
absolute, in the two files a reader consults about exactly this gate.
The repair is the same clause, in a comment: one line.

## TWO — and the body beside it measures only half of limit 6

Limit 6 in the hook's header is now stated over the CLASS (`T-223-s4`):
**any ref write that decides what a commit advances.** Two members are
named there and each is measured with its refused porcelain twin:

    git update-ref refs/heads/main <sha>   exit 0   (git branch -f: 128)
    git symbolic-ref HEAD refs/heads/main  exit 0   (git checkout main: 128)

The spec drives the FIRST end to end, through the real wired hook, and
that body is why the first limit is measured rather than argued. **The
second has no body anywhere.** It was measured in a throwaway repository
by `T-223-s4` — git 2.50.1 (Apple Git-155), Darwin 25.6.0 arm64 — and
the measurement lives only in that card and in the header's prose, which
is exactly the state the existing body exists to prevent: a limit nobody
reds if a future change closes it by accident and leaves the header
claiming a weakness the gate no longer has.

**WHAT THE BODY WOULD DRIVE**, in the existing fixture's shape: `main`
checked out in a second worktree; assert `git checkout main` is refused
with the checked-out-elsewhere message (the armed porcelain guard);
`git symbolic-ref HEAD refs/heads/main` -> exit 0; commit the WIDER card
with an ordinary `add`/`commit`; assert `main` moved and the lane branch
did not; `git symbolic-ref HEAD refs/heads/<lane>` back; push through the
guard and assert the gate now enforces the widened fence. The `T-223-s3`
lesson applies unchanged and is the reason this is an S and not a
one-liner: assert WHICH route the allow came down — the merge-base must
still be the commit the dispatcher left `main` at, or the body passes on
an EMPTIED range instead of a widened fence.

## Why it was not taken at `T-223-s4`

That lane's `touches:` is `.claude/hooks/landing-gate.mjs` alone. The
prose change it made is not pinned by any body — nothing in the suite
reads the hook's comment text — so no spec change was OWED, and a
widening from inside the lane is the one repair an executor may never
make (`method/lane-protocol.md` rule 5). Routed here instead.

## CORROBORATION, 2026-09-09 — a THIRD copy, in the hook's own `ROUTE` string

Appended rather than filed beside, per `method/tasks/TASK-FORMAT.md`:
this card already owns the class, and a second instance is worth more
attached to the first than as a fourth file.

Found by the verifier of `T-223-s4` at tip
`7d95dabb84e8cff073cab298400c2474150f01f8`, sweeping the whole hook for
survivors of the class after the header's three occurrences were bound.
`.claude/hooks/landing-gate.mjs:1312-1314`, the exported `ROUTE`
constant — **not a comment, a string, and the one a REFUSED executor
actually reads at a push**:

> this gate reads the card as committed on the integration branch
> precisely so that editing the card here — or the manifest — cannot
> move it.

The *"precisely so that"* is the same over-reach the header just
retired: it is true WHILE `HEAD` names the lane branch, and false after
one `git symbolic-ref` — the route this card's §TWO measures. A refused
executor is exactly the reader who should not be told the guarantee is
stronger than it is.

**Why `T-223-s4` did not take it, and why that was right.** The string
IS inside that lane's fence (`.claude/hooks/landing-gate.mjs`), so it
COULD have been edited — but the card's TRIAGE named the header sentence
and limit 6, and `ROUTE` is executable surface rather than prose. A
string-literal edit inside a card that asked for none is the change class
the verifier's attack set weighted highest against, and `landing-gate.spec.ts`
is where a `ROUTE` assertion would live. Correctly left, correctly
routed here.

**Whoever takes this card should take all three sites in one pass** —
the spec comment (§ONE), the missing `symbolic-ref` body (§TWO) and this
string — because they are one sentence written in three places, and
`T-223`, `T-223-s4` and this line are the record of what happens when
they are repaired one at a time.
