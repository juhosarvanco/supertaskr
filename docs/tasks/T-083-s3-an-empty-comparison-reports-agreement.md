---
id: T-083-s3
title: A set comparison with no non-emptiness floor calls two failures agreement — hit twice in one lane, two different ways
status: suggested
suggested_by: executor claude-opus-5 @T-083
---

A sibling of SHAPE FIVE from the POISON DRILL bullet, arriving from the
measurement side rather than the assertion side, and worth an ordinal
because the tell is different: shape five is *deleting an assertion
deletes its own failure*; this one is **the producer fails, both sides
come back empty, and `cmp` calls it a match**.

Two independent sightings inside T-083's own derivation work, hours
apart, neither in a committed test:

**One — `git merge-tree --write-tree` exits 1 on conflict and prints a
conflict report where a tree OID was expected.** Measured at T-014's
merge `bdada11`: exit **1**, three stage lines for
`docs/tasks/T-014-index-cli-watch-check.md`, no bare OID. A script that
takes `MT=$(git merge-tree --write-tree A B)` without reading `$?` then
runs `git diff --name-only A "$MT"`, gets nothing usable, and writes an
empty forecast. The lane's first sweep scored merge-tree as
"mispredicting 0 paths against a truth of 36" — which was the script
failing, not the command.

**Two — the same shape one level lower, from the shell.** A comparison
loop written as `for pair in "A B C"; do set -- $pair; ...` word-splits
under `bash` and does not under `zsh`. Both sides of the `cmp` came back
EMPTY and it printed `BYTE-IDENTICAL (0 paths)` — a green built entirely
out of two failures. The read-back caught it because the *paths* number
printed alongside was zero, which is the only reason it was visible.

**The remedy is one line and it belongs in the drill, not in a library:
assert the expected side is NON-EMPTY before comparing it.** The
corrected sweep refuses to compare when the truth list has zero entries
and says so. Cheap, mechanical, and it converts a vacuous green into a
loud skip — which is the same trade `lint:tokens` exit 3 makes for the
CONTROL corpus, and the same one the GRAPH REGEN and BOOT GATE bullets
make with "a skipped gate is news, never silence".

Distinct from shape five, which is about an assertion SET shrinking, and
from shape seven, the mutant no body kills. Here every body runs, every
assertion executes, and the comparison is between two nothings. Offered
to whoever does the renumbering pass that `T-078-s13`, `T-080-s7` and
the unowned SEVEN are already queued behind — this is not a claim on an
ordinal, only on being counted.
