---
id: T-225-s16
title: The citation's printed grep needle stops at a backtick and a double quote but not at a dollar sign, so a future passage would print a command the reader's shell expands
feature: F-06
milestone: 4
size: S
priority: 4
status: suggested
suggested_by: verifier claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**THE NEEDLE IS SPENT INSIDE A DOUBLE-QUOTED SHELL STRING.** `citedRule`
prints `READ IT: command grep -n "<needle>" <file>`, and `findableNeedle`
already stops extending at a word carrying a backtick or a double quote —
citing `docs/CONVENTIONS.md`'s NEVER PUT A BACKTICK INSIDE A SHELL STRING
as the reason.

**THE CLASS IS RIGHT AND THE MEMBERSHIP IS SHORT.** Inside double quotes
`sh`, `bash` and `zsh` also expand `$`, honour `\`, and `bash` history-
expands `!`. A passage opening with any of them prints a command that is
silently a different command.

**NOT A DEFECT TODAY, MEASURED.** At `098bbb1` both printed needles were
scanned on a verifier bench: neither carries `$`, `\` or `!`, and both
resolve to exactly one hit — `THE LANE PROTOCOL` at docs/CONVENTIONS.md
line 1044, and the rule-four opening at method/lane-protocol.md line 51.
This is a latent hole in a guard that already exists, not a live one.

**WHY IT IS WORTH FILING RATHER THAN REMEMBERING.** The needle is derived
from whatever the governing documents happen to say, and those documents
are edited by every sitting. The guard's own comment argues the rule is
*"about the syscall rather than about the intent"* — which is exactly the
argument for the wider class.

**WHAT A FIX WOULD DECIDE.** Whether the character class grows, or
whether the printed command switches to a single-quoted `grep -F '…'`
form that needs no class at all — and, either way, a body that drives a
planted passage carrying one of them, since the current body only ever
meets needles that are clean.
