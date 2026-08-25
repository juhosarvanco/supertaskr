---
id: T-123-s1
title: The hand-driven door still refuses a folder its own registered interview planned — the one class of user who reaches nothing else
status: suggested
suggested_by: executor claude-opus-5 @T-123
---

T-123 gave the routing question its second input and wired
`docs_watch::routes_to_genesis` into **three** of the four places that
ask it: `apply_genesis_folder`'s two readings, `genesis_start` and
`genesis_resume`. `genesis_fresh` is deliberately excluded and the card
says why (criterion 7 — it is the destructive door, and a cloned
repository carrying a `.nputer/` must route to resume).

**`genesis_kickoff` is neither, and it was left refusing.** In
`app/src-tauri/src/agent/mod.rs`, `kickoff` still opens with a bare
`probe_plan` + `has_plan` guard and answers `KickoffOutcome::AlreadyPlanned`,
which `InterviewChat`'s `HandDrivenBlock` renders as *"<path> already
holds a plan."*

**WHO MEETS THIS.** ARCHITECTURE's own words about this command: it *"IS
THE UNIVERSAL FALLBACK BECAUSE IT RESOLVES NO CLI"* — `fresh_genesis`
resolves one before it looks at the registry, and `start`/`resume`
resolve one before they can say anything past the recorded id, so **a
user whose CLI has been uninstalled or renamed reaches this command and
nothing else**. That is exactly the user T-070 hung the `GenesisRecord`
off `KickoffOutcome::Ready` for, so they could be told what they banked.
After T-123 that user can now reach the genesis screen on a folder their
own interview planned — and the one block that was built for them still
says the folder is off limits.

**WHY IT WAS NOT BUILT INSIDE T-123.** It is in the fence
(`app-agent`), so this is scope and not reach: no acceptance criterion
names it, and it is a ROUTING DECISION rather than a mechanical
follow-through, because the command MATERIALIZES the kit and assembles a
prompt. Two questions have to be answered together:

1. Should a registered session open this door at all, or is the
   hand-driven kickoff closer in kind to `genesis_fresh` (it hands a
   human a prompt that will write into `docs/`) than to `genesis_resume`?
2. If it opens, WHICH prompt? `kickoff` already forks on
   `kit::has_banked_docs` (`resuming: bool`), so the resume kickoff is
   presumably right — but nothing has ever exercised that fork on a
   folder holding a plan, and `assemble_kickoff_for`'s resume text was
   written for a folder mid-interview, not for one whose stage 0 is
   complete.

A one-line guard change would answer neither. The refusal is disclosed
in `kickoff`'s own body naming this finding, on the T-070-s5 precedent.

**FENCE**: `[app-agent]` alone if the answer is "open it on the same
rule"; add `app-interview` if `HandDrivenBlock`'s copy needs to change
with it.
