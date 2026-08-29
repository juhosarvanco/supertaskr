---
id: T-124-s4
title: Two sentences in adapter.rs's T-124 block state as measured what the capture only makes plausible — the hook guard's independence, and a prefix model silent about the refusal the project's own capture holds
status: parked
suggested_by: verifier claude-opus-5 @T-124-verify
---

**T-124's CONCLUSION IS RIGHT AND TWO OF ITS SENTENCES ARE STRONGER THAN
ITS EVIDENCE.** Filed as a suggestion rather than as a verdict failure
because nothing green depends on either one: the tests assert the lane's
own classification data and its own literals, never the CLI's behaviour,
and both imprecisions err in the SAFE direction. But `adapter.rs` is the
file the next author of the grant table opens, and a sentence there that
reads as measured will be quoted as measured.

## One — the hook guard's INDEPENDENCE is inferred, not captured

`OBSERVED_PLANNER_REFUSALS`' doc comment says:

> refusal 1 … establishes that this CLI carries a hook-safety guard on
> directory-changing git which fires INDEPENDENTLY of the allowlist.

Refusal 1's captured text is *"This command changes directory before
running git, which can execute untrusted hooks from the target
directory. Approve only if you trust it."* That text establishes the
guard EXISTS and that it judges what a command DOES. It does not
establish that the guard still fires when an `--allowedTools` pattern
MATCHES — that is an inference about the CLI's internal ordering, and
the capture cannot settle it. Two further gaps in the same chain, each
small and each real:

- the command that produced refusal 1 is not recorded, so whether the
  guard's class covers `git -C <dir> …` (which changes git's directory
  rather than the shell's) is not observed either — the two spellings
  share the HAZARD, which is a different claim;
- refusal 1 and refusal 3 are not known to be the same tool call, which
  the card's notes say out loud and the `adapter.rs` comment does not.

**THE CONCLUSION SURVIVES WITHOUT IT**, which is why this is a wording
fix and not a reopening. The decision to decline stands on three
arguments the capture does support on its own: `Bash(git -C:*)` admits
every git subcommand in every directory on disk; a runtime-substituted
project path cannot enter a `&'static [&'static str]` argv without a
second substitution slot carrying a `/`-bearing user-controlled string;
and the bare twin `git status --short` is ALREADY granted, so the
instruction fix costs no grant surface at all. Hedge the independence
sentence to what it is — the best reading of the CLI's own text, and the
one thing here a real-CLI probe could settle for the price of one turn —
and the block gets stronger, not weaker.

## Two — the prefix model is silent about multi-operation refusal, and this project HOLDS the capture that proves it

`granted_prefix_reached`'s doc comment says *"THE ONE CLAIM ABOUT THE CLI
HERE IS THE PREFIX RULE, AND IT IS CALIBRATED RATHER THAN ASSUMED."* The
prefix rule is not the only rule the captured evidence shows. Measured
through the shipped function in a detached drill worktree at `e896865`
(probe added, run, removed, restore proved by sha256
`ffe7a27314cdcdcad873d0324d71804c5ccfa6ee06ee68dec2a6dd94a6a63e67`):

    granted_prefix_reached(&CLAUDE_V1, "git status && rm -rf /")
        -> Some("git status")
    granted_prefix_reached(&CLAUDE_V1, "cp a b && git push origin main")
        -> Some("cp")
    granted_prefix_reached(&CLAUDE_V1, "mkdir x && git -C /tmp reset --hard")
        -> Some("mkdir")

The real CLI refuses exactly these. Its own words, from
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` — tracked, and
the same file `the_2026_08_24_transcription_agrees_with_the_2026_08_19_capture`
already reads — are *"This Bash command contains multiple operations. The
following part requires approval: …"*, quoted over a compound whose FIRST
operations are granted. T-124's own third refusal opens with that same
sentence. So the CLI is demonstrably operation-aware and the model is
not, and the one capture that could have calibrated the second rule is
the one the lane was already reading.

**THE DIRECTION IS SAFE AND THAT IS THE WHOLE REASON THIS IS NOT A
FAILURE.** The function is optimistic — it reports `Some` where the CLI
says no — so every NEGATIVE assertion in
`the_granted_spelling_and_the_planners_spelling_are_not_the_same_command`
is made HARDER to pass by the imprecision, never easier, and the positive
controls are all single-operation commands. It is `pub` but has no
production caller (`grep` over the tree: the two new adapter bodies and
nothing else), so no argv, no spawn and no permission decision reads it.

## What to do, cheapest first

1. **Say what it models.** One line on `granted_prefix_reached`: this is
   the PREFIX rule only; the CLI additionally refuses multi-operation
   commands, and the 2026-08-19 capture is the evidence. Zero risk.
2. **Refuse compound text.** Return `None` when the command carries a
   shell operator, and pin it with the capture's own quoted command as a
   fixture — the second rule this project has real bytes for, calibrated
   the same way the first one was.
3. **Hedge the independence sentence**, and record what would settle it:
   one real-CLI turn spelling `git -C <cwd> status --short` with
   `Bash(git -C:*)` granted. **NOT a test** — `real_cli_arms_forbidden`
   forbids it by construction (T-047-s6, T-060) — and it spends @human's
   own model call, so it is a @human look, not a lane's.

**Fence `[app-agent]`.** All three are inside `app/src-tauri/src/agent/`.

Amnesty triage 2026-08-29 (triage seat): PARKED — both are live and both err in the SAFE direction, which is why nothing green depends on them — but adapter.rs is the file the next author of the grant table opens, and a sentence there that reads as measured will be quoted as measured. The second half is the sharper one: the prefix model is silent about the CLI's multi-operation refusal, and this repository already TRACKS the capture that proves it (docs/research/captures/real-planner-turn-2026-08-19.jsonl), read by a body the same lane was running. RESURFACES: the next app-agent dispatch — hedging the independence sentence costs a clause, and calibrating the second rule against a capture already in the tree costs a test. A real-CLI probe would settle the first for the price of one turn, which makes @human's T-025-s2 a second trigger.
