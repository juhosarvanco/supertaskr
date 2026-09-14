# The gate runner, the token and the push

The one spelling for a graded reading, the token it mints, what a push owes, and how the push itself is judged.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- AUDIT GATE POLICY (human ruling 2026-08-16, closing T-020-s2): the
  gate is VULNERABILITIES — they exit non-zero and stop the lane
  (proven: a crafted lock pinning `time 0.1.44` → exit 1,
  RUSTSEC-2020-0071). Informational warnings stay NON-gating.
  Warning-count drift is reviewed BY EYE against that baseline,
  not enforced by exit code; `--deny warnings` would red CI permanently
  for no actionable signal.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.

- THE BLESSED GATE-RUNNER (T-202): `node tools/e2e/scripts/gate-run.mjs
  parser|app|rust|e2e` from the repo root is the ONE spelling for a
  graded reading; its `gate-verdict` line carries the exit code, the
  BODY COUNT and the ref. READ THE COUNT, NEVER THE CODE.
  **AND SINCE T-271 ONE SEAT MAY GRADE NARROWER THAN A LEG — THE
  EXECUTOR, WHILE IT ITERATES, AND NO OTHER** (the browser leg is ten of
  the battery's eleven minutes, measured on T-224's fix passes). Give
  that command `e2e --owning <changed path>...` and it grades ONLY the
  spec files that OWN those paths: every spec that reads a changed file,
  over a STATIC IMPORT GRAPH rooted at the specs and NEVER a spec's
  name, plus the docs-walk bodies the DOCS GATE's own reader map names
  when a docs path moved.
  **THE VERIFIER'S ONE RUN AND THE INTEGRATOR'S RUN BEFORE THE PUSH ARE
  THE OWED SET FOR THEIR OWN RANGE** — `--range <base>..<tip>` at the
  bench's tip, `@{upstream}..HEAD` at the push — and NOT this hand-typed
  form: a cross-spec red, the class T-264's executor found four of by
  running everything, must land inside the lane's ceremony rather than
  on merged main where the answer is the revert play, and the range form
  is what keeps that true while costing the range's own paths instead of
  the whole battery (T-280, superseding this bullet's four-legs sentence
  by the later @human ruling of 2026-09-09; the bench's report names the
  set and its derivation). **THE HAND-TYPED FORM STILL MINTS NOTHING**:
  `--owning`'s subset verdict is worded `SCOPED-GREEN` or `SCOPED-RED`,
  which the push guard REFUSES as a token, so a scoped run POISONS a
  stale green rather than leaving it standing.
  A changed path the derivation CANNOT PLACE is
  exit 2 naming the path, and the full leg is owed: this form can only
  ever be wrong by running too MUCH. The other three legs are seconds
  each and are still run whole when they are owed at all.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.

- **AND IT NOW MINTS A TOKEN THAT GATES YOUR PUSH** (T-203). Each run
  also writes that same verdict to a token beside the fence manifest in
  `.supertaskr/`, keyed on `HEAD^{tree}` per suite, and `push-guard.mjs`
  refuses a push whose four suites are not all GREEN against the tree
  being pushed. **So the battery is run LAST, after every commit** —
  otherwise the token names a tree that is no longer yours. The refusals
  are distinct and each prints its remedy: `token-incomplete` (a suite
  never ran), `token-red` (a suite RAN AND FAILED), `token-unmeasured`
  (the runner DECLINED TO GRADE — no toolchain), `token-stale` (wrong
  tree), `token-unkeyed` (tracked files were dirty when it was minted).
  **A checkout without cargo cannot push, deliberately**: an unrun suite
  is unmeasured, and that is disclosed at the refusal rather than hidden
  behind a wrong label.

- **AND SINCE T-280 A PUSH OWES THE SET ITS OWN RANGE OWES, NOT THE
  BATTERY BY DEFAULT.** About a dozen four-suite batteries ran on the
  integration checkout in one night of 2026-09-09 — roughly 3.5 machine
  hours, two of them colliding on the solo lock — and around half were
  for commits that moved no source under any package: dispatch stamps,
  card promotions, a checkpoint, a guide page. **THE OWED SET IS
  DERIVED, NEVER LISTED**, by one function with three arms composed:
  the PACKAGE ROOTS (each graded suite's own `cwd` in the runner's
  registry, longest prefix wins, plus the `file:` dependency edges read
  off the manifests — so a change under `lib/parser/` owes the app suite
  too); the STATIC IMPORT GRAPH rooted at the spec files (T-271's, which
  narrows the end-to-end leg to the specs that own the changed paths);
  and the DOCS GATE's own reader map, whose readers are FILES and are
  placed through those same package roots — which is how a document read
  by the parser's census owes the parser suite with nobody writing that
  down. Give the blessed runner `--range <base>..<tip>` and it grades
  exactly that set and writes the token with the set, the range and the
  INPUTS the derivation read. **THE PUSH GUARD RE-DERIVES THE SAME SET
  FROM THE PUSH'S OWN RANGE** — `@{upstream}..HEAD`, both endpoints
  resolved to object ids, the upstream checked to be an ANCESTOR because
  THE RANGE RULE below bans a two-dot diff between divergent tips — by
  spawning that same function rather than holding a second copy of it,
  and refuses a token whose measured set does not cover it as
  **`token-partial`**, naming the missing suites and the missing SPEC
  FILES. Additive: no earlier reason is renamed, and an entry that
  recorded no scope graded the whole leg and covers any subset.
  **IT FAILS CLOSED, AND THAT IS THE WHOLE SAFETY ARGUMENT.** A path
  under no package root that no spec reaches and the docs gate cannot
  place, a reader the map cannot put in a package, an import edge that
  will not resolve, no upstream to range against, a runner this checkout
  does not have, an answer the guard cannot parse — every one of them
  makes the owed set THE WHOLE BATTERY, with the reason recorded in the
  token and printed at the refusal. **AND "THE WHOLE BATTERY" MEANS FOUR
  WHOLE LEGS, WHICH IS A CLAIM ON TWO AXES AND NOT ONE.** The SUITE axis
  is which legs ran; the SPEC axis is whether the one scopable leg ran
  whole.
  A token whose end-to-end entry carries a `scope` is
  therefore refused as **`token-partial`** EVEN WHERE NO RANGE COULD BE
  DERIVED: a scoped GREEN says nothing failed among the spec files it
  ran, and it never says the leg ran.
  **CI STILL RUNS THE WHOLE BATTERY AFTER EVERY PUSH**, on a machine
  that is not yours, and `workflow-parity` keeps it on four legs: the
  local rule narrows what a SEAT must measure before pushing, and
  narrows nothing about what the runner then measures.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.

- **THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314, AND THE BYPASS THAT
  LEAVES IS CLOSED BY PROCEDURE** (ADR-025 decision 3, approved by the
  owner on 2026-09-12 with the v1 limitation accepted the same day). `.claude/hooks/pre-push` is a git `pre-push` hook, installed by
  `brief.mjs --take-seat` by pointing `core.hooksPath` at the tracked
  hooks directory — refusing BY NAME, and changing nothing, where a
  different hooks path is configured, where the checkout's own active
  hooks would be deactivated, or where the only way through would be a
  SHARED configuration change in a repository with other worktrees. It
  judges EACH PROPOSED UPDATE on the two objects git hands it, the
  remote's OLD object and the local NEW one: the range is
  `<old>..<new>`, the token is required to match the PUSHED commit's
  tree — an ADDITIONAL binding and never a substitute — and the
  range-derived owed set and the unchanged-tree check are asked exactly
  as the bullets above ask them. One unqualified update refuses the
  WHOLE push, because a `pre-push` hook has one exit code for the whole
  invocation; an update shape this guard has no rule for, a deletion or
  a ref outside `refs/heads/`, is refused by name. The `PreToolUse`
  guard above is UNCHANGED and stays as a second net.
  **A DELIBERATE BYPASS IS CLOSED BY PROCEDURE IN V1, WHICH THE OWNER
  ACCEPTED ON 2026-09-12 AND WHICH IS WRITTEN HERE RATHER THAN
  PRETENDED AWAY**: `git push --no-verify` skips every client-side hook
  by git's own design, and a push from a checkout where the hook was
  never installed runs nothing at all.
  **THE RUNNER'S OWED SET ON THE PUSHED RANGE
  REMAINS THE PUBLIC CHECK**, on a machine that is not yours: the local
  hook narrows the window in which an ungraded tree can reach the
  remote, and replaces nothing about what the runner then measures.
  **A PROTECTED RECEIVING GATE AND CREDENTIAL ISOLATION ARE SEPARATE
  PROPOSALS** (T-310) — they are what would close the bypass at the far
  end, where declining is not the client's to do, and they are not part
  of this one.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.

- **A PUSH NO LONGER CANCELS THE RUNNING CI JOB (T-294), AND NOBODY
  WAITS ON IT.** ci.yml's concurrency group is the COMMIT, so two pushes
  hold two groups: each pushed tree gets its own run and its own verdict.
  **T-237's REFUSAL IS RETIRED WITH THE CANCELLATION IT WAS ABOUT**, and
  so is `SUPERTASKR_CANCEL_CI` — there is nothing left to acknowledge, and
  a variable that clears a refusal nothing raises is the override hatch
  this guard ships none of. The guard now ANNOUNCES a run in flight,
  naming it and its head sha: **two verdicts are live at once and they
  arrive in whatever order they finish**, so read them BY HEAD SHA and
  never by their order.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/10-gates.md (T-290), verbatim.

- **AND THEN READ IT.** `gh run list --limit 5` after a batch, and
  `gh run view <id> --log-failed` on anything red (`--attempt 1` when a
  red was re-run green). **Since T-237 the guard ANNOUNCES the newest
  verdict at every push** — run id, failing step, and whether the pushed
  tree reaches that step's package — and discloses an unreachable `gh`;
  the reading is still yours, and it buys nothing if nobody looks: main
  sat RED for roughly five hours across two failures while a seat pushed
  over both, reporting "all four suites green" — true locally, and not
  the claim that mattered (the 2026-09-01 records). **A LOCAL BATTERY
  AND CI ARE DIFFERENT MEASUREMENTS AND ONLY ONE OF THEM RUNS ON A
  MACHINE THAT IS NOT YOURS.**
