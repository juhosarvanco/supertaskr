# Checkpoint — 2026-09-09, the third sitting: five lanes merged (T-279, T-281, T-278-s2, T-271, T-282), the loop's own costs measured and cut, four rulings on the backlog, the vision and the front door rewritten, CI red four times at the runner's floor and the ledger's first reading

Written by the architect seat (claude-fable-5-1, the desktop app) at 488e495 (after the T-285 dispatch stamp), after the T-282 merge; the previous record is 2026-09-09-the-second-sitting-t244-t167s13-t241-t278-merged-the-seat-release-v0111-ci-red-then-green.md. Every figure below carries its ref; STATE is regenerated from the template in the same commit.

## What landed on main, in order (each merge's story is on its card and in its merge commit)

- **T-279** at 9763afc — a lane runs its owed suites ONCE at its final code-and-notes commit; the `verifying` stamp is exempt. Method 0.1.12 → 0.1.13 (the ONE GRADED RUN release). The lane obeyed the rule on itself; the verifier's eight one-side data mutants on the new method text redded nothing in the eval gate — T-279-s3 carries the eval that would (MF-11), demonstrated.
- **T-281** at 2f7b586 — the verifier commits the bodies its corrections assign, on the bench, with a text-anchored MUTANT BLOCK the merge verb re-drills. Method 0.1.13 → 0.1.14 (the MUTANT BLOCK release). Three corrections, the first merge to re-drill them with the lane's own reader on the merged tree; C2 was a real hole — a block naming `../VICTIM.txt` wrote outside the repository — closed by the containment check the verdict spelled.
- **T-278-s2** at 0a1c7cf — the CI job frees the runner's disk before the floor is read (six toolchains this job never invokes, each measured, the protected set declared once and read by both the shell and the spec) and a ledger of eleven `df` readings attributes the disk to steps. Four corrections; the glob one had real blast radius (`/usr/*` expanded before any guard).
- **T-271** at 6ee2eab — `gate-run.mjs e2e --owning <paths>` grades the spec files that own a change through the static import graph; the verifier and the integrator stay four legs; a scoped run writes a SCOPED verdict the guard refuses. **The measurement: the full leg 774 bodies in 853 s; the scoped leg on the lane's own change 56 bodies in 14 s.** One correction; its second block's `new` text was not unique and the planter refused to name the site — drilled by hand at the unique old site (T-281-s9 filed).
- **T-282** at 35247f1 — the triage view clusters suggested cards by fence and by class parent and flags DUPLICATE CANDIDATES; the backlog band re-derived from eight records, 20/40 → 46/92, never raised. Four corrections. **The wiring the lane could not reach (brief.mjs, outside its fence) landed inside the merge at @human's word**, with its body seen green with the call and red without.

Also on main this sitting, as seat writes: the README rewritten as the front door (what Supertaskr is, why it hits different, the loop, v1/v2/v3+), the vision's closing sentence ("The product is the whole loop; the proof is a repository it built"), the north star reduced to the current vision only, the cockpit ruled to be the user's own agent app (README, NORTH_STAR, ROADMAP F-05, both versions pages, two rooms, the parked list), 28 planned cards' fences narrowed from directory tokens to files (ruling E; STARTABLE 48 → 61, FENCED 88 → 76 with the same lanes live), T-283/T-284/T-285/T-287 filed on rulings A/B/C and the preflight's dead-entry gap, T-278-s2 promoted and amended with the remedy, T-281-s8 promoted p1 after the runner reproduced it, the readings on T-278-s1 (four), corroborations on T-254-s4 and T-278-s2.

## The rulings of this sitting (@human, verbatim where short)

- Backlog: **A** "in-fence follow-through" (T-283), **B** "batch by fence" with T-282 unheld as the instrument (T-284), **C** a machine-read `wake:` on parked cards (T-285), **D** the pruning sitting "later when you think the time is right".
- Fences: **E** "lets move forward with this" — narrow at triage; F (split the two hot modules) after T-282; G (section fences) a room, unopened.
- "Phase 1 on Sonnet — No need for this change. Lets keep Opus."
- "I dont like this sentence at all. The whole system is the product." → the vision's sentence rewritten; "you can delete the old visions" → NORTH_STAR holds the current vision only.
- "We decided the native apps are the cockpit for now." → the in-app conversation parked, named in no version list.
- "Land it inside T-282's merge." → the wiring as the integrator's write.
- "Is this needed? Do the other seats need it?" → the ask-watcher hazard stays OUT of STATE (four words into the existing bullet instead).

## CI, read

Main was red on the runner from 08:59Z at the disk floor T-278 installed: runs 34332162937, 34334103318, 34338891141, 34345539307 — all on image ubuntu-24.04 20260831.293.1 at ~188,000 KiB free, where the four green runs before them ran on 20260907.300.1 at ~4,439,500 KiB. The first run carrying the ledger and the free-disk step (34347086580 on 0a1c7cf) attributed it: the older image arrives with 14,065,728 KiB free, the restored cargo target takes 7,063 MiB, playwright 656, the apt set 450 — our own steps on a smaller margin, not an image arriving full. That run died at the cargo suite on the T-281-s8 body before the free-disk step ran; the freed bytes are still the next run's reading. **The run on 6ee2eab (34348711057) is GREEN — the first green since 08:59Z.** The free-disk step freed 28,358,404 KiB on the older image (dotnet 5.6G, android 11G, ghcup 3.7G, CodeQL 1.8G, swift 3.3G; /opt/ghc absent on it), from 186,968 KiB free to 28,545,372; the floor then read 28,545,320 KiB against 2 GiB. T-278-s1 carries it as the fourth reading's second half. The green judged the tree that carries T-254, T-256, T-279, T-281, T-278-s2 and T-271, and their lane branches are deleted in this commit's window; task/T-282-* waits for the run on 35247f1..

## The health bands and the boot gate at this checkpoint

`npm run health` at 35247f1, 12:20Z: 14 bands — 1 inside, 3 drifting, 3 BREACHED, 3 unread, 4 UNKEPT; exit 3 (designed). **triage/live-suggestions (T-282 criterion 5): BEFORE this sitting 80 cards BREACHED against the typed 40; AFTER, 109 cards BREACHED against the re-derived 46/92** — the loop filed about thirty suggested cards across five verdicts today, so the re-derived line is breached by arrivals, not by a raise, and a triage sitting is due (ruling D, @human's call). triage/net-arrivals-per-window 44 drifting against 9/46; triage/oldest-suggestion-days 7.47 days drifting against 5/15; docs-headroom BREACHED on STATE.md (1.7 % headroom before this regeneration) and ROADMAP.md (the F-05 sentence added at the cockpit ruling); CONVENTIONS drifting at 8.85 %; suite/lib-seconds and suite/e2e-seconds not read this run (no capture passed). `npm run boot:check`: ABORT, exit 2 — port 1420 is held by the human's live app, which the gate must not contend for; not a reading of the app.

## The loop's cost, measured this sitting

- One graded run per lane (T-279): the lanes after it ran their suites once (T-281 at 9d7cb43, T-271 at 2069d22, T-282 at bf22ede, T-278-s2 at b1c0a0c, T-283 at cd4187d), the stamp commit re-running nothing.
- The scoped leg (T-271): 853 s → 14 s on the lane's own change; T-280 (dispatched) carries it to the push and the bench.
- Batteries this sitting: battery66–74, nine, each ~25 minutes; two unkeyed by commits during the run (68, 70) and re-run; the push guard refused none.
- Lanes live at the close: T-280, T-281-s8 (building), T-283 (verifying). Benches removed for every merged lane. Lane branches kept until a green CI judges their tree: T-254, T-256, T-279, T-281, T-278-s2, T-271, T-282.

## Seat faults, named

- The ask watcher was a typed list; T-282's fast-path ask went unseen. Replaced by a watcher derived from the live lanes; a memory note; the STATE bullet gains four words.
- The seat filed T-286 while T-278-s2's lane had filed a T-286 — renumbered the seat's to T-287.
- At the T-282 merge the seat's C2 clause doubled the verifier's (already on the bench tip); the mutant survived until the duplicate was removed.
- Phase-2 briefs carried executor figures above the line in three lanes (T-281, T-278-s2, T-271); each verifier re-measured and disclosed. The arm cannot render a verifier brief (T-254-s4, T-271-s3); the seat's prompts are hand-written until it can.

## Hazards moved out of STATE at this checkpoint (its band breached at 1.7 % headroom; ADR-019: content moves, a hazard is never deleted)

- **A SEAT'S OWN SHELL IS A HAZARD**: `cd` persists, `set -e` does not
  stop a failing heredoc, zsh spells `pipestatus` and aborts on an
  unmatched glob (`setopt nullglob`), perl `"$X"` interpolates `@` and a
  pattern ending in `\s*$` eats the newline, `$R:tools` is a modifier
  (`${R}:tools`), a variable named `path` clobbers PATH, GNU `timeout`
  is absent, **the auto-mode classifier refuses a `kill` — wait on the
  pid**.
- **A BENCH OLDER THAN A SIBLING LANE REDS brief.spec's eight-hand-steps
  body and session-economics** by ref skew (the arm's preflight answers
  STALE): attribute at the base with the lane absent.
- **ROADMAP'S AND STATE'S HEADROOM BANDS ARE DRIFTING**: a sentence
  added there owes a cut in the same file (`npm run health`).

## Next up (the hooks; the statuses are the board's)

T-283's verdict and merge (the bump to 0.1.15); T-280 and T-281-s8 to their benches; T-285 then T-284 (they share TASK-FORMAT.md); the ROADMAP heading and the ARCHITECTURE front-door labels (unruled); F after T-282's fence frees; the pruning sitting when @human calls it; the next CI run's freed-bytes reading into T-278-s1.
