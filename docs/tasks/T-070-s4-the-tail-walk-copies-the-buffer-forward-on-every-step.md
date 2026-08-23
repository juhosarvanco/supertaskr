---
id: T-070-s4
title: The tail walk copies its whole buffer forward on every backward step, so a large legitimate tail costs O(steps squared)
status: suggested
suggested_by: verifier claude-opus-5 @T-070-verify
closed_by: aec0d66 (task/T-070-arrival-reads-disk, 2026-08-23) — the second arm below, taken in the same rewrite as the verdict's BLOCKING 2
---

**DISCHARGED BY THE WORK THAT ANSWERED THE VERDICT, AND THIS FILE STAYS
`status: suggested`** — a finding whose work was resolved elsewhere keeps
its status and records the discharge in its own body, and the three
moves are triage's, not an executor's (CONVENTIONS' fourth question,
T-083's ruling as `T-081-s7` spells it). The finding's own last line
predicted this: *"it merges naturally into whatever rebuild answers the
verdict's BLOCKING 2, since that finding is in the same loop."* It did.

**WHICH ARM.** The second one, verbatim: the walk pushes each backward
step into a `Vec<Vec<u8>>` and concatenates once when it stops, `pop`ping
so the LAST step — the earliest bytes in the file — is copied first and
each chunk is freed as it goes. Total copying is linear in the bytes
read; peak memory is the tail plus one chunk rather than two copies of
the tail. **The seek pattern, the `Read + Seek` seam and `TAIL_CHUNK` are
untouched**, which is what the finding asked for, and the proof is that
BYTES READ did not move on any row below.

**RE-MEASURED ON THE FINDING'S OWN THREE FIXTURES**, release build,
400 half-turns, budget 200, in the detached scratch worktree at
`1e0b940`. Both walks were timed IN THE SAME PROCESS on the SAME file —
the pre-fix loop transcribed beside the shipped one — and their answers
were asserted byte-identical before either time was printed:

| text per line | file bytes | bytes read | BEFORE | AFTER | `read_transcript` |
|---|---|---|---|---|---|
| 8 KiB | 3,295,784 | 1,703,936 | 3 ms | **2 ms** | 1 ms |
| 32 KiB | 13,126,184 | 6,619,136 | 25 ms | **5 ms** | 4 ms |
| 128 KiB | 52,447,784 | 26,279,936 | **544 ms** | **16 ms** | 20 ms |

**The 128 KiB row is the finding**: 544 ms → 16 ms, and arrival is now
FASTER than the whole-file reader it replaced on the same file (20 ms),
which is the sentence the finding said the card's stated purpose
required. Four times the bytes is now about three times the time, not
eighteen. The three BYTES READ figures are identical to the ones in the
table above this section, measured by a different session on a different
day — the file sizes differ by a few thousand bytes because this
fixture's line shape is slightly different, and the read figures do not
differ at all.

**AND THE NEWLINE-FREE FILE, at the production budget of 200**, which is
where this finding and BLOCKING 2 meet:

| file | BEFORE: read / time / lines | AFTER: read / time / lines |
|---|---|---|
| 20 MiB, no newline | 20,971,520 · 381 ms · 1 | 20,971,520 · **11 ms** · 0 |
| 60 MiB, no newline | 62,914,560 · 4,063 ms · 1 | **52,428,800** · **26 ms** · 0 |

The 20 MiB row is honest about what the ceiling does and does not do:
20 MiB is UNDER `200 × TRANSCRIPT_TEXT_CAP`, so that file is still read
in full — the cost is now bounded by a CONSTANT rather than by the file,
not made small. The 60 MiB row is the ceiling actually biting, at
exactly 52,428,800 bytes. The quadratic term is what made the first one
matter, and it is gone.

criterion failure the verdict rejects on (the READ is bounded on every
input in the table below — 26 MB of a 52 MB file). It is an efficiency
defect in the same function, and it is filed separately so that it
survives a rebuild that fixes only the loop's exit condition.

**THE LINE.** `app/src-tauri/src/agent/sessions.rs:400`, inside
`tail_lines`:

    chunk.extend_from_slice(&buf);
    buf = chunk;

Every backward step allocates a fresh `TAIL_CHUNK` (64 KiB) buffer and
copies the ENTIRE accumulated tail into it. With `n` steps the walk
copies `O(n²·TAIL_CHUNK/2)` bytes. Nothing about that is visible in the
pin, because `the_tail_read_costs_the_budget_and_not_the_file` asserts
BYTES READ (which is correct and stays correct) and its fixture's tail
is 412,303 bytes — seven steps.

**MEASURED**, release build, on transcripts written entirely within
`append_transcript`'s own rules (every line well under
`TRANSCRIPT_TEXT_CAP`), 400 half-turns, budget 200:

| text per line | file bytes | bytes read | tail read | `read_transcript` on the same file |
|---|---|---|---|---|
| 8 KiB | 3,299,276 | 1,703,936 | 1 ms | 1 ms |
| 32 KiB | 13,129,676 | 6,619,136 | 25 ms | 4 ms |
| 128 KiB | 52,451,276 | 26,279,936 | 459 ms | 16 ms |

Four times the bytes, eighteen times the time. `TRANSCRIPT_TEXT_CAP` is
256 KiB — twice the largest row — so the worst tail the module itself
permits is roughly four times slower again, while the whole-file reader
it replaced stays linear.

**WHY IT MATTERS BEYOND TIDINESS.** T-070's stated purpose is that a
tens-of-MiB transcript should stop costing a tens-of-MiB read and parse
on every arrival at the interview screen. For a transcript that is large
because it has MANY lines — the case the card describes and the pin's
fixture models — the change is a large win. For a transcript that is
large because its LINES are large, arrival is now slower than it was
before the card. Both shapes are reachable through the ordinary write
path.

**THE ARM.** Walk forward into one buffer and reverse at the end, or
push each chunk into a `Vec<Vec<u8>>` and concatenate once when the walk
stops. Either is a linear rewrite of the same loop with the same seek
pattern and the same `Read + Seek` seam, so
`the_tail_read_costs_the_budget_and_not_the_file` keeps measuring what
it measures today.

**SIZE S**, and it merges naturally into whatever rebuild answers the
verdict's BLOCKING 2, since that finding is in the same loop.
