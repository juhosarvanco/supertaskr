---
id: T-052-s3
title: Instance 8's assumed mechanism is refuted — a running vite survives npm ci, and the remaining candidates are untested
status: suggested
suggested_by: executor claude-opus-5 @T-052
---

**T-052's card calls a fresh install *"the likelier cause of the same
death"*, and its verification clause asked for a demonstration. The
demonstration refuted the mechanism.** The card is already honest that
instance 8's cause is *"recorded honestly as undetermined between this
and 'the human quit'"*; this narrows the space from the other side, by
removing the candidate everyone would have assumed.

## What was measured

On scratch port 15140, a real vite 7.3.6 serving this repository's own
`app/`, with `npm ci` run in `app/` underneath it:

| | |
|---|---|
| floor (`app/node_modules/vite/package.json`) ABSENT for | **12** consecutive 100 ms samples |
| HTTP non-200 responses across the run | **0** of **51** samples |
| server pid / start time before and after | **unchanged** |
| simulated full reload afterwards | every dependency URL **200** |

**Vite serves what it has already transformed out of memory and never
re-reads the tree.** The window is real and the process does not notice
it. Repeated three times with the same result.

## What IS destroyed, and why the rule still stands

`node_modules/.vite` — vite's optimized-dependency cache — is deleted
and **NOT recreated**, so a surviving server is answering from memory
over a tree that no longer matches it. The rule T-052 wrote therefore
rests on the WINDOW rather than on an observed kill, which is the
stronger footing: it does not depend on a cause the record calls
undetermined.

## The candidates this did NOT test, which is the suggestion

The human's app is **`tauri dev`, not vite**, and the parts that are not
vite are exactly the parts a fresh install could plausibly kill:

1. **The tauri CLI itself lives in `node_modules`.** `npm run tauri dev`
   runs `node_modules/.bin/tauri`, and that process supervises the child
   and the `beforeDevCommand`. Whether it survives its own package being
   removed and rebuilt underneath it is untested here.
2. **A cargo rebuild runs beside it**, holding an exclusive lock on
   `app/src-tauri/target/` — the THROUGHPUT channel @human's ruling
   names, and the one a second checkout is adopted to fix.
3. **Instance 7 is a different mechanism entirely** and is not touched
   by any of this: `tauri dev` watching `app/src-tauri` while git
   rewrites it mid-merge, the watcher firing between git's unlink and
   write, and `cargo` reading a tree with no
   `crates/nputer-index/Cargo.toml`. That one has a verbatim capture in
   the relaunch log and needs no further evidence.

**TESTING (1) AND (2) MEANS RUNNING A REAL `tauri dev`**, which is the
boot gate's territory — `NPUTER_BOOT_PORT=<scratch> npm run boot:check`
already spawns one on a scratch port with a derived config overlay, and
@human has ruled that running it is not screen control. Fence
`[tools/e2e]`. It is worth doing precisely because the cheap candidate
has now been eliminated: if neither (1) nor (2) reproduces either, the
honest conclusion is that instance 8 was the human quitting, and the
record should say so instead of carrying a suspicion for a third month.

**DO NOT READ THIS AS A LICENCE.** The refuted mechanism is the reason
the rule was proposed, not the reason it is right. A window in which the
running product's dependency tree does not exist is a hazard whether or
not this particular server noticed it, and the rule costs one `lsof`.
