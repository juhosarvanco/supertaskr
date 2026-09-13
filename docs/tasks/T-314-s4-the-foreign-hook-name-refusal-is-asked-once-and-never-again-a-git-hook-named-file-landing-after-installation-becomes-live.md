---
id: T-314-s4
title: "The foreign-hook-name refusal is asked once and never again: a git-hook-named file landing in the tracked hooks directory after installation becomes live at the next checkout, merge or commit in every seat that installed, and nothing asks the question a second time"
feature: F-04
milestone: 4
size: S
priority: 2
status: suggested
suggested_by: "verifier claude-opus-5@subagent @T-314, measured at that card's own tip; the ordering that creates it is argued in the module and the card's criteria ask the question only at installation"
blocked_by: []
touches: [.claude/hooks/, tools/e2e/tests/push-guard.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

## The finding

`core.hooksPath` pointed at `.claude/hooks` makes EVERY git hook name in
that directory live at once. T-314 knows this and refuses installation
when the directory already carries one — `foreignHookNames` reads the
full `githooks(5)` list and the refusal names the file it found.

The question is asked exactly once, and it is asked in the branch a
already-installed checkout never reaches. `hookInstallPlan` answers
`pathIsOurs` FIRST and returns before `foreignHookNames` is consulted,
which is deliberate and argued at the site: a checkout this arm already
pointed at its own hooks must not then be refused for names it was
pointed past on the run that succeeded. `hookStatus` does not ask it
either — it asks three things, and this is not one of them.

So the protection covers the moment of installation and no moment after
it. `.claude/hooks/` is TRACKED. A commit that lands a file called
`post-checkout`, `pre-commit` or `post-merge` there — a helper named for
what it does, a script somebody meant to run by hand — becomes a live git
hook in every checkout that has taken the seat, at the next checkout,
merge or commit, with no line anywhere saying so. The installer would
have refused that exact directory an hour earlier.

The same asymmetry covers the other half: a live hook appearing in the
repository's own `$(git rev-parse --git-path hooks)` after installation is
already retired by the configuration this arm wrote, and nothing reports
that either.

Nothing in the record has put a git-hook-named file in that directory —
it holds eleven files, ten `.mjs` and the hook itself — so this is a
door, not a breach. It is the door the card's own third criterion built
and then stopped watching.

## Acceptance criteria

- WHEN a checkout is already installed THE guard state reader SHALL also report a git-hook-named file in the tracked hooks directory other than the project's own, by name, rather than answering only the three conditions it answers today; a body SHALL plant one in an ALREADY-INSTALLED checkout and require the report, with the same checkout before the plant as the control.
- WHEN the seat verbs run in an installed checkout THE report SHALL reach the seat as a line it can act on, and a checkout carrying no such file SHALL say nothing new, so the line is not noise on every seat.
- WHEN a live hook has appeared in the repository's own active hooks directory since installation THE same reader SHALL say that the configuration this arm wrote is what retires it, naming the file, because a hook somebody added and never saw run is the same surprise from the other side.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
