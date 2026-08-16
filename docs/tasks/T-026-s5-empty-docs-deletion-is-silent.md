---
title: An EMPTY docs/ being deleted emits nothing — criterion 4 fixed the appear direction and opened the mirror
status: suggested
suggested_by: verifier claude-opus-5 @T-026
---

T-026 criterion 4 (the folded T-018-s4) makes the (unarmed → armed)
transition emit even when the collected tree equals the empty baseline,
so an empty `docs/` appearing replaces the front door's stale "no plan
here" claim with the empty board. Verified exact and load-bearing.

The mirror direction is still suppressed, and criterion 4 is what makes
it reachable. In `handle_fs_batch` the emit gate is
`outcome == target.last && !just_armed`; when an EMPTY `docs/` is
deleted, `ensure_docs_watch` takes its `(true, false)` arm (drops the
handle, `just_armed` stays false) and the collected outcome is still the
empty baseline — so nothing is emitted and the shell keeps rendering the
empty board over a folder that no longer has a `docs/` at all.

Reproduced (verifier, 2026-08-16, probes reverted), driving T-018's own
batch seam with exact counts:

    empty docs/ appears        -> emits (exactly once)
    next batch                 -> silent
    docs/ DELETED (was empty)  -> SILENT, handle dropped
    docs/ recreated empty      -> emits (exactly once, second arming)
    next batch                 -> silent

Before T-026 this state was unreachable — an empty `docs/` never
produced a board to go stale — so this is a new edge, not a pre-existing
one. It is narrow (a docs/ that is deleted while still empty) and the
recovery is armed (the sentinel re-arms and the next arming emits), but
it is the same claim-outlives-the-truth shape T-018 and T-018-s4 exist
to close.

Cheapest honest fix: have `ensure_docs_watch` report the
(armed → unarmed) transition the same way it now reports the arming, and
emit on either. That keeps one rule ("a watch-state transition is news
the tree cannot carry") instead of two special cases, and the suppression
invariant stays exactly as narrow as it is today.
