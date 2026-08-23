---
id: T-070-s5
title: The source tripwire's doc comment overstates its refactor-tolerance — a benign loop-split reds the callee-set pin, and the prose conflates the safety invariant with the green-ness condition
status: suggested
suggested_by: verifier claude-opus-5 @T-070-verify
---

**MATERIALIZED BY THE INTEGRATOR FROM THE APPROVED VERDICT (T-070 merge
`740f0b7`), crediting the verifier who found and measured it.** The
second verdict raised this as its FINDING 1 (non-blocking) and it lived
only in the card body; T-061's integrator learned the hard way that a
verdict finding left as card-body text is invisible to triage, so it is
filed here as a file with legal frontmatter. Nothing in the delivered
code was changed at the merge — this is a prose correction to a comment,
recorded for triage rather than applied by the integrator (the brief's
"not this merge's job to fix unless trivial").

**THE COMMENT MAKES A CLAIM THE PIN DOES NOT HONOUR.** The doc comment
above `the_only_production_path_to_the_transcript_is_the_bounded_one`
(`app/src-tauri/src/agent/mod.rs`) promises: *"Reorder the arrival path,
rename its locals, split its loop — as long as it still reaches the file
only through the bounded reader, its callee set is unchanged and this
stays green."* The middle clause is false.

**MEASURED (verifier's drill, `fc5f5c9`).** Rewriting `transcript()` into
an accumulate-with-`push` loop — reaching the file ONLY through
`read_transcript_tail`, no new file access whatsoever — reds the hop-1
exact-set assertion, because `push` is a new callee. An idiomatic
`.iter().map(…).collect()` reds the same way (`iter`, `map`, `collect`).
"Split its loop … callee set is unchanged" does not hold.

**WHY THIS IS NOT A CORRECTNESS HOLE, AND WAS RULED NON-BLOCKING.** The
false red fails CLOSED: the developer gets a red carrying the exact right
instruction — *"if it is not [a new way to reach the file], add it here
deliberately"* — and adds `push` to the allowlist. The correctness
property (no file-reaching callee passes unseen) is intact. This is the
same hand-maintained exact-set pattern the codebase already blesses in
`EXPECTED_GRANTS` (`acl_pin.rs`) and the 13-command IPC census: those red
on ANY set change, benign or not, and are re-blessed by hand as the
review a human should get.

**THE ARM.** Reword the comment in place to state the actual contract:
*any* change to a hop's callee set reds and is re-blessed by hand, like
`EXPECTED_GRANTS` — distinguishing the SAFETY invariant ("reaches the
file only through the bounded reader") from the GREEN-NESS condition
("callee set is unchanged"), which are not the same set. One comment, no
code, no rebuild, no test change. Size XS.
