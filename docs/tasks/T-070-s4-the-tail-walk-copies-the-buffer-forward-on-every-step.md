---
id: T-070-s4
title: The tail walk copies its whole buffer forward on every backward step, so a large legitimate tail costs O(steps squared)
status: suggested
suggested_by: verifier claude-opus-5 @T-070-verify
---

Filed beside T-070's rejection rather than inside it: this is NOT the
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
