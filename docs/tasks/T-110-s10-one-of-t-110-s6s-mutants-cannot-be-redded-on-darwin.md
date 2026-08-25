---
id: T-110-s10
title: One of T-110-s6's three mutants cannot be redded on Darwin, and s6's suggested producer fix would trade determinism for the bound
status: suggested
suggested_by: executor claude-opus-5 @T-110-rebuild
---

T-110's rebuild closed two of `T-110-s6`'s three surviving mutants and
found that the third is **unreachable on this platform**. Both halves are
recorded here so the card is not re-opened against an impossible fixture.

## CLOSED by the rebuild

`truncation_is_carried_from_the_scan_onto_the_join` in
`app/src-tauri/src/dispatch/join.rs` builds a `.git/worktrees` holding
**4097** entry directories and asserts `truncated: true`, a list of
exactly **4096**, and that the entries kept are the first 4096 BY NAME
(`e000000` … `e004095`). That reds s6's mutant 3 (deleting the ceiling
block) and mutant 5 (hardcoding `truncated: false`). `4097` and `4096`
are LITERALS: sizing the fixture from `MAX_WORKTREE_ENTRIES` and
asserting against it is the shape CONVENTIONS names by name (T-063) and
is how the constant escaped in the first place.

## NOT CLOSED, and it is the operating system rather than the suite

s6's mutant 4 is `Err(_) => truncated = true` → `Err(_) => {}` on the arm
that handles an entry directory whose NAME is not UTF-8. s6 proposes a
fixture *"whose entry name is invalid UTF-8"*. **Darwin refuses to create
one.** Measured on Darwin 25.6.0, APFS, in a temp directory:

    os.mkdir(b'bad\xff\xfename')
    -> OSError [Errno 92] Illegal byte sequence

`EILSEQ` — the filesystem validates the name before it exists, so the
`read_dir` entry that arm exists to handle cannot be produced here at
all. The arm is not dead code (Linux and Windows both permit names this
reader would reject), but it is **unpinnable on the only platform this
project's suites run on**, and a body that tried would fail at its own
fixture rather than at the assertion.

Three honest dispositions, in the order this executor would rank them:

1. **Leave it, and say so where the code is** — one comment on the arm
   naming EILSEQ and the platform, so the next drill reports it as a
   known-unreachable rather than as a fresh survivor for the third time.
2. **Inject the name** — split the loop's body into a function taking an
   `OsString`, so a body can hand it invalid bytes without asking the
   filesystem to store them. `OsString::from_encoded_bytes_unchecked` is
   `unsafe` and this project has no `unsafe` today; `OsStringExt::from_vec`
   on unix is not.
3. **Drop the arm** and treat a non-UTF-8 entry name as an
   `EntryDefect`-carrying entry instead of a truncation, which is
   arguably the better answer anyway — the reader's own rule is that a
   thing it cannot name is REPORTED, not silently counted.

## AND s6'S SUGGESTED PRODUCER FIX IS THE WRONG HALF

s6 offers *"either bound the collection as it is built — stop pushing
past the ceiling and set `truncated` there — or correct the comment"*.
**The first would break a property the suite already pins.**
`read_lanes` collects every name, SORTS, then truncates, so the entries
kept are the first 4096 by NAME. Truncating as the names arrive keeps
whichever 4096 `read_dir` handed back first, which is filesystem order —
non-deterministic, and exactly what
`entries_come_back_sorted_by_name_whatever_the_filesystem_says` exists to
forbid. A bounded `Vec<String>` of short names is a poor trade for a
deterministic answer.

The rebuild took the second half: `MAX_WORKTREE_ENTRIES`' doc comment now
states that what the ceiling bounds is the per-entry file reads, that the
name allocation is not bounded, and why bounding it as built is refused.
**s6's remaining content is mutant 4 and nothing else.**

Fence: `[app-dispatch]` — `app/src-tauri/src/dispatch/lanes.rs`.
