---
id: T-225-s15
title: numberedStep resolves a MOVED ordinal to a different numbered line rather than refusing, so a renumbered rule four is cited confidently as the wrong passage
feature: F-06
milestone: 4
size: S
priority: 3
status: planned
suggested_by: verifier claude-opus-5@subagent @T-225-s2
blocked_by: []
touches: [tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/tests/brief.spec.ts]
builder:
verifier:
built_by:
verified_by:
review:
---

**EVERY OTHER LOCATOR IN THIS MODULE REFUSES; THIS ONE GUESSES.**
`rawBullet`, `sectionBullet`, `laneSpellings` and `ceremonyRows` all
throw on zero or two matches — a hard failure, never a default. The
ordinal locator `numberedStep` does not: it takes the FIRST line starting
`"<n>. "` anywhere in the file.

**MEASURED AT `098bbb1`** on a verifier bench, with rule four renamed
`4x.` and nothing else changed. The command did not refuse. It matched a
different `4. ` line further down `method/lane-protocol.md` and printed:

    never touch the integration branch: CITED, NOT TRANSCRIBED (T-225-s2)
    — method/lane-protocol.md rule four, 517 bytes flattened at this ref,
    opening "THE CHECKPOINT RECORD CARRIES THE WHY, ..."

exit 1, with a needle that RESOLVES — a findable address for a passage
that is not the rule it names. The contrast is the finding: the same
control on the CONVENTIONS bullet is loud, exit 3, *"0 bullets containing
THE LANE PROTOCOL, expected exactly one"*.

**AND THE SECOND READER SHARES THE HEURISTIC.** `brief.spec.ts`'s
citation body offers `ruleFourFlat()` as an independent measurement — the
file's own standing shape, one implementation deriving and another
asserting. For THIS failure mode the two are not independent: both find
the rule by `startsWith("4. ")`, so a moved ordinal makes them agree with
each other on the wrong passage and the body stays green.

**PRE-EXISTING, AND WORTH A CARD ANYWAY.** `numberedStep` is unchanged by
T-225-s2; before it, a moved ordinal transcribed the wrong rule instead
of citing it. What changed is that the module now leans on ordinals for
two rows it used to quote in full.

**WHAT A FIX WOULD DECIDE.** Whether `numberedStep` anchors on the
ordinal PLUS the passage's own opening capitals (which `citedOpening`
already computes), whether it refuses on more than one candidate the way
its siblings do, and whether the spec's second reader is re-derived so
the two disagree when the document moves.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 3, at the T-225-s2 merge (6691fc5)

The architect seat. A moved ordinal cited confidently as the wrong passage is worse than a refusal; T-225-s16 rides in the same fence. Waits behind T-239.

## Absorbs: T-225-s16 (2026-09-02, at the T-225-s2 merge (6691fc5))

The citation's printed grep needle stops at a backtick and a double quote but not at a dollar sign, so a future passage would print a command the reader's shell expands

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
form that needs no 
