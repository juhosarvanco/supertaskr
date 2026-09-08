# 08 — Landing

The landing is everything between an approved verdict and a pushed
integration branch: the forecast, the merge, the corrections, the
battery, the regenerations, the checkpoint. The integrator's contract
is method/roles/integrator.md; the two-commit shape is
method/docs-protocol.md law 4; the runner is
tools/e2e/scripts/gate-run.mjs; the push guard is
.claude/hooks/push-guard.mjs.

## Before the merge

1. Read the card and the verdict. The verdict is the only record of
   what was attacked and what survived; a merge that has not read it is
   trusting a stamp.
2. Take the seat (`brief.mjs --take-seat`) and confirm a clean tree.
3. Move the lane branch to the verdict commit: the verifier committed
   its verdict on the bench, so `git branch -f task/T-NNN-<slug>
   <verdict sha>` makes the branch carry the verdict.
4. Forecast the merge: `git merge-tree --write-tree main
   task/T-NNN-<slug>`, exit read from `$?` unpiped and first, and the
   answer read from the output together with the code. A conflict
   outside the three tripwire classes (chapter 04) is evidence of a
   fence breach; route it, never resolve it locally.

## The merge

`git merge --no-ff --no-commit task/T-NNN-<slug>`, never a rebase: a
rebase replays the approved commits as new ones and the verdict names a
commit nobody can diff. The merge commit's message states what landed
and why it is true. Then compare the tree you got against the tree you
forecast: they are the same unless the merge commit carries an edit,
and a merge commit that carries work is a diff nobody reviewed as a
diff. Measured over thirty forecastable merges, twenty-nine matched
byte for byte and the one mismatch was the case the comparison exists
to name.

What may legitimately land in the merge commit beyond the lane's
content, each named in the message:

- The card's `done` stamp with `built_by` and `verified_by`.
- The verdict's **assigned corrections**, performed at this seat to
  lane standards: a code correction gets its own mutants drilled and
  its restoration proved; acceptance is mechanical (the named mutant
  must now red). Writes outside the lane's fence that the verdict
  assigned (a settings matcher, a CONVENTIONS clause) land here, named.
- The **census regeneration** (`npm run capabilities` from tools/e2e/)
  when a spec name moved: a lane's fence leaves docs/CAPABILITIES.md
  read-only, so the lane reports the stale census and the integrator
  regenerates it in the merge commit.
- The **graph regeneration** when an indexed source moved: ask
  `cargo run -q -p nputer-index -- index --check --root ../..` from
  app/src-tauri/, never predict; regenerate; re-ask after every write.
  A regeneration moves the six dogfood pins in app/test that hold the
  committed graph's scale, and the app suite is owed.

## The battery

```
node tools/e2e/scripts/gate-run.mjs parser
node tools/e2e/scripts/gate-run.mjs app
node tools/e2e/scripts/gate-run.mjs rust
node tools/e2e/scripts/gate-run.mjs e2e
```

The blessed runner is the one spelling for a graded reading. Each run
declares its sentinel (a file that must exist in the cwd, so the runner
proves it is in the right tree), spawns the suite with an argv array
and no shell so nothing can be piped, redirects output to a file,
captures the status, and refuses: a cwd that is wrong, zero bodies
executed, a count whose parts do not sum to the run's own baseline,
cargo without `--no-fail-fast`, a second runner beside a timing bench
(the solo lock), and a verdict line missing a field. Its
`gate-verdict` line carries the exit, the body count and the ref. Read
the count, never the code.

Each run also mints a token in `.nputer/gate-verdict.json`, keyed on
`HEAD^{tree}` per suite. The push guard refuses a push whose four
suites are not all GREEN against the tree being pushed, so **the
battery runs last, after every commit**: a commit after the battery
names a tree that is no longer yours.

The docs gate, `node tools/e2e/scripts/docs-gate.mjs <paths>` from the
repo root with separate literal paths, derives which suites the diff
owes: it names the readers of every docs path in the diff across the
four suites, and exit 1 means FIRES with the owed commands printed.

## The push

```
git -C <the integration checkout> push origin main
```

Bare, nothing before it and nothing after it in the command: the push
guard judges the command text, and a `cd` in front of it through a
separator other than `&&` leaves the working directory undetermined, so
the guard refuses rather than guessing. The guard's three arms: the
graph arm asks `index --check` and refuses on exit 1 only; the token
arm refuses unless the four-suite token is green for this tree; the
landing arm judges every merge commit the push carries against its
lane's fence. A push cancels the running CI job, so pushes are batched
behind in-flight fixes and a deliberate hold is stated in STATE with
its lifting condition. After the push, read CI: `gh run list --limit 5`.

## The checkpoint

One commit, distinct from the merge, subject `Checkpoint:`, carrying
in this order:

1. **The checkpoint record**, `docs/checkpoints/<date>-<slug>.md` on
   docs/checkpoints/TEMPLATE.md: Merge (parents, ranges at their own
   refs, the forecast with its exit, disjointness as two named sets);
   Gates (graph regen, boot gate, docs gate, each trigger derived on
   the merge's own paths, and the graph asked last, after the record's
   final write); Health bands (the census line and exit from `npm run
   health -- --readings <file>`); Suites (every run with count and
   exit); Board (movements derived on disk); Environment (worktrees,
   ports, pids, with their clock); What the brief got wrong; Metrics
   (the five stamped lines: `Rework cycles:`, `Tokens:` per seat and
   summed, `Gate runtime:` per gate and summed, `Cold start:`, `Drift
   incidents:`, and `not derivable here` with a reason where one
   cannot be measured); Dispositions.
2. **STATE regenerated** from docs/STATE-template.md: the status
   headline, the live-right-now derive commands, Next up as hooks,
   the standing hazards with their card ids, the pointers. Under its
   byte budget; a hazard is never deleted to fit.
3. **ROADMAP** ticked: at most one sentence per feature, absorbed into
   its paragraph at the next edit.
4. **ARCHITECTURE** if an interface moved; a new decision record if a
   non-obvious decision got made.
5. The worktree removed (`git worktree remove`), the lane branch
   deleted after the merge (the merge commit carries both parents),
   the bench removed.

The checkpoint is one per sitting, not one per merge, where several
lanes land in one sitting; the record then carries every merge. A gate
reds if any record is committed newer than STATE.

## Repair or file

The question every checkpoint spends its judgement on, ordered:

1. **Who may write the fix?** A card's own file is exempt from every
   fence for protocol writes (stamps); a new rule or another hand's
   sentence is a lane write this seat does not hold. A defect this
   seat may not write is filed whatever its vintage.
2. **When did it become false?** A figure, fixture, count or citation
   that this merge made false is the merge's own debris, repaired in
   the checkpoint. A defect already false at the merge's parent is
   filed and left alone, however small the fix looks.
3. **A behavioural defect the merge introduces is refused**, not
   patched: undo the merge if it has not landed, take the revert play
   if it has, put the finding on the card, send the card back to a
   lane.

## The checkout you merge into may be in use

Where the product runs from the integration checkout, four rules bind
whether or not the human has their own checkout:

1. A fresh dependency install never runs in a checkout serving a live
   product; detect the live process by asking the operating system what
   holds the port, and refuse loudly, naming the step skipped.
2. A merge can change what the running product serves without touching
   a file the product owns (a path dependency, a built bundle); the
   question is which build outputs the product reads.
3. When your own work disturbs a running product, record it in the
   checkpoint with the process identity read before and after.
4. Write nothing into the integration checkout the merge did not put
   there; scratch work goes in a sibling detached worktree.

## The revert play

Written before the first bad merge so it is never improvised:

1. `git revert -m 1 <merge>`, mainline first; never rebase, amend or
   force the integration branch. The bad merge stays as evidence.
2. The card returns to `planned`, with the revert recorded in its body
   naming the reverting commit and the reason; the rebuild goes to a
   fresh seat.
3. Generated artifacts are reconciled at the reverting checkpoint, not
   in the revert.
4. The checkpoint record carries the why at the loudness a skipped gate
   gets: what landed, what it broke, how it was found, what would have
   caught it earlier.

A revert is not a disposition; which of the three moves the card gets
is triage's. Safe undo as a command, `npx nputer undo <card>` with a
dependency check, is v1 (folded into T-244).
