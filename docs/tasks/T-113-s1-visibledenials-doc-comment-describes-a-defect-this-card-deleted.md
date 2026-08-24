---
id: T-113-s1
title: visibleDenials' doc comment still describes the exitNonZero double report as live, and routes it to a file the seventh triage removed
status: suggested
suggested_by: executor claude-opus-5 @T-113
---

`T-113`'s last acceptance criterion says this in as many words: **THE FIX
SHALL NOT REACH THE RENDER SIDE** — `app/src/genesis/**` is
`app-interview` and outside `[app-agent]` — and *"IF the comment's routing
sentence goes stale because this card lands THEN say so and route the
one-line correction rather than editing across the fence."* It went stale.
This is that routing.

## What is stale, and it is TWO claims rather than one

`visibleDenials`' doc comment in `app/src/genesis/interview-model.ts`
ends with a paragraph headed **WHAT THIS CANNOT REACH, NAMED RATHER THAN
LEFT TO BE DISCOVERED**. Every sentence in it was true when T-101 wrote
it. Two are now false, and they fail in opposite directions:

1. **"The `exitNonZero` path double-reports today"** — it does not, as of
   T-113. The paragraph goes on to describe the mechanism accurately
   (*"`runner.rs` pushes `permission_denials: <names>` for the same
   `unannounced` vector it emits live `Denied` events from"*) and that
   push is DELETED. A reader meeting this comment now is told a defect is
   live in a tree where it is fixed, which is the exact failure mode
   `docs/STATE.md`'s "a shipped known defect that is disclosed" section
   exists to keep legible — a disclosure that outlives its defect stops
   being a disclosure and becomes a false claim about the code.

2. **"it is routed as `T-101-s1`"** — that file does not exist. The
   seventh triage (`6f2f8ea`) promoted it into T-113 and removed the file
   in the same commit, which is TASK-FORMAT's promotion encoding working
   correctly. So the comment's routing sentence names a card a reader
   cannot open, and `git grep T-101-s1` from the root finds it in this
   comment and in checkpoint prose and nowhere actionable.

## The reason it is NOT fixed here

`app/src/genesis/interview-model.ts` is C-13 (`app-interview`), and this
lane's `touches:` is `[app-agent]` = C-14 (`app/src-tauri/src/agent/**`
plus `app/src/lib/agent-store.ts`). `method/lane-protocol.md` rule 5:
*"record it, route it, and build the part that fits. A fence is not
widened from inside the lane it fences."* T-101's own ruling, carried in
STATE, gives the discriminating test — **widen when the fence makes THIS
CARD'S OWN criterion unbuildable; route when it makes a NEIGHBOURING
defect unfixable** — and this is squarely the second branch: T-113's
criteria are all built, and this is a stale comment on a neighbouring
component, not a criterion of this card. The card anticipated it and
named routing as the required move, so taking it is obedience rather than
judgement.

## The fix, which is small and belongs to a lane holding `app-interview`

Rewrite that ONE paragraph in the past tense, keeping the mechanism
(which is the valuable part and remains the correct account of what the
suppression key cannot see) and correcting its status:

- the `exitNonZero` double report was REAL until T-113 and is now closed
  **in the runner**, by deleting the ring note for the `unannounced` set;
- the three reasons a render-side key would have been wrong are UNCHANGED
  and still worth keeping — no typed key exists on that path, matching the
  tail's text would put a copy of a `runner.rs` `format!` string in this
  module (T-057), and the tail is a bounded RING so a prefix match
  un-suppresses at random. They are why the fix was the runner's, and they
  are the reason to keep the paragraph rather than delete it;
- re-cite `T-101-s1` to **`T-113`**, which absorbed it.

The function's BEHAVIOUR does not move — `visibleDenials` never read the
tail, which is the whole point of the paragraph — so this is a comment
edit, and the app suite's 45 bodies on that file are untouched by it.

## Why it is filed rather than left

`T-101-s4` is this repository's standing lesson that a claim nobody
re-derives gets copied forward as a fact. This comment is a claim about
the state of another component's code, written into a third component's
source, and the tree it describes has moved. It is exactly the shape that
finding is about — and unlike `T-101-s4`'s quotation, this one is
correctable by a one-paragraph edit inside a fence that is currently
free.
