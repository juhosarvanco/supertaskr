---
id: T-249-s2
title: Arming the secret read guard invites a matcher change that routes Grep and Glob through the WRITE fence — decide() has no term for a tool that reads, only for one it names, so a grep of an out-of-fence path would be refused `outside-the-fence`
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: blind verifier claude-opus-5@subagent (phase 2), at T-249's tip e41ebef, 2026-09-08 — found while probing which tool names take which arm of decide()
blocked_by: []
touches: [.claude/hooks/lane-fence.mjs, tools/e2e/tests/lane-fence.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`T-249` gives `decide()` its first branch on `toolName`:

    if (typeof request.toolName === "string" && READ_TOOL_NAMES.includes(request.toolName))
      return secretReadVerdict(request, cwd);

`READ_TOOL_NAMES` is `["Read", "NotebookRead"]`. Everything else falls
through to the WRITE fence — which is the answer that has been right for
every tool `.claude/settings.json` has ever routed here, because until
this card the hook never inspected `toolName` at all and keyed only off
which path field was present.

That is correct today and becomes a trap at the exact moment `T-249`'s
own inertness is fixed. The guard is unarmed until the matcher names a
read tool; the seat that arms it is editing a matcher string that
currently reads `Edit|Write|NotebookEdit`, and the natural edit — add the
tools that read files — reaches for `Grep` and `Glob` alongside `Read`.
Both carry a `path` field, which is in `WRITE_TOOL_PATH_FIELDS`. A `Grep`
over a path outside the lane's `touches:` would then be refused
`outside-the-fence` by the write fence, in a lane, on a read-only
operation. That is the lane killer criterion 3 exists to prevent,
arriving through the WIRING rather than through the classifier.

Measured at `e41ebef`: driving `decide` with `toolName` of `Grep`,
`Glob`, `Bash` and a lowercase `read` returns write-fence limit codes,
confirming they take the fence arm; only `Read` and `NotebookRead` reach
`secretReadVerdict`.

The hook's header already declares the underlying limit — it screens
`Read`, "NOT EVERY TOOL THAT CAN PRINT A FILE", and names `Grep` in
content mode as a routed suggestion. So this is not an undisclosed gap in
`T-249`; it is the route that disclosure asked for, and it should exist
as a card before the arming lane goes looking.

## Acceptance criteria

- WHEN a tool that cannot write is routed to this hook THE hook SHALL NOT
  judge it against a lane's write fence — a read-shaped tool that is not
  screened SHALL be declined rather than refused, so arming the matcher
  more widely cannot silently narrow what a lane may read.
- THE spec SHALL pin the partition by tool name: which names screen,
  which names fence, and which names decline — driven, so a name added to
  either list without a decision reds.
- THE decision about `Grep` in content mode SHALL be recorded either way:
  screened like a read, or declared out of scope with the reason. A
  `Grep -A5 AWS_SECRET .` reaches the same bytes a refused `Read` would.
- IF the answer is that `Grep` should be screened THEN the guard SHALL
  handle its search-path shape (a directory, often the repo root) without
  refusing every grep in the tree.

## Disposition hint

Park behind the settings.json arming write that `T-249`'s merge owes —
this card's whole value is being read BEFORE somebody widens that
matcher, so it wants triage in the same sitting, not necessarily a lane.
