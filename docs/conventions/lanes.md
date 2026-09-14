# Lanes: the protocol, the shared checkout and the base

The lane spellings this project publishes, the checkout a human is running the app in, and the commit a lane is cut from.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- THE LANE PROTOCOL — the generic rules are `method/lane-protocol.md`
  and are NOT restated here (T-089). That file rules one task/one
  branch/one worktree, the base commit, the sibling worktree, the
  executor never touching the integration branch, disjoint `touches:`,
  and who removes the worktree; it deliberately leaves every NAME to the
  project, and these are this project's:
  - integration branch `main`; branch `task/T-NNN-<slug>`; worktree
    `../supertaskr-T-NNN`, a sibling of the repo root and never a path
    inside it; bench worktree `../supertaskr-V-T-NNN`, the verifier's, cut
    DETACHED at the same base and never on a branch — a detached entry
    is not a lane and holds no fence, which is what keeps it out of the
    lane list (T-239 published this spelling; every bench on this
    machine already wore it and nothing stated it). Created with
    `git worktree add ../supertaskr-T-NNN -b task/T-NNN-<slug> <base>`, and
    the base is the bullet below. **BOTH BRANCH SPELLINGS ARE LIVE IN
    THIS REPO and the older `tNNN-…` one is not a mistake to fix**: the
    two sets overlap rather than succeed each other, so there is no
    cutover id to cite — derive the pair at your own ref (T-110-s2's
    card holds the census at `4d2f03c`).
  - the BRANCH IS KEPT after the merge and only the WORKTREE is removed
    (`git worktree remove`), so `git branch` lists every lane this repo
    has ever run and `git worktree list` lists only the live ones — and
    is therefore the authority on which fences are held right now; the
    board's `status: building` is not, while the dispatch stamp is
    lapsed (method/tasks/TASK-FORMAT.md's STAMP bullet). **READ IT AS
    ENTRIES ON A `task/T-NNN-*` BRANCH, NOT AS A ROW COUNT**: a detached
    entry is not a lane — a poison-drill checkout holds no fence and is
    named after no card — so filter on the branch and expect other
    lanes' scratch worktrees beside yours. **ONE DETACHED ENTRY IS
    PERMANENT — THE HUMAN'S APP CHECKOUT `../supertaskr-app`** (T-052; the
    bullet below has the account): detached ON PURPOSE, no fence, no
    card, NOT a lane; never count it or remove it after a merge. **DERIVE
    WHETHER IT EXISTS FROM `git worktree list`, NEVER FROM THIS FILE** —
    a worktree's existence is a LIVE-ENVIRONMENT fact like a pid.
  - A FRESH WORKTREE HAS NOTHING INSTALLED AND NOTHING BUILT: no
    node_modules in any of the three packages, no `lib/parser/dist`, no
    `app/dist`, no `target/`. **THE ORDER A LANE RUNS BEFORE ITS SUITE
    IS THE ORDER tools/e2e's OWN PREFLIGHT DEMANDS**, and it refuses at
    config load naming whichever is missing: lib/parser `npm ci` + `npm
    run build` (its `dist/pure.js`), then app/ `npm ci` — **never `npm
    install` inside a lane**, which dies EACCES on the fenced lockfile
    (T-256) — then app/ `npm run build`, then tools/e2e `npm ci`, then
    the suite. **THE APP'S OWN BUILD IS ALSO ORDER-DEPENDENT, and the
    suite does not say so**: several app test files read the built
    bundle off `app/dist`, so `npm test`
    from app/ on an unbuilt worktree fails a handful of bodies — every
    message about a build being stale or absent rather than about the
    tree — and is whole again after `npm run build`. DERIVE the count
    at your own ref (12-of-840 when measured at `4d2f03c`). CI never
    sees it because ci.yml orders app build before app suite; a
    hand-run lane does.
  - **THE BRIEF IS ASSEMBLED BY THE ASSEMBLER, AND THIS IS THE SPELLING
    method/roles/orchestrator.md 5b POINTS AT** (`T-133-s3`: the RULE
    is product-agnostic and lives in the role file, the COMMAND is an
    supertaskr path and lives here). Run from the repository root:

        node tools/e2e/scripts/brief.mjs --task T-NNN

    and paste what it emits. Every row comes back with the source that
    row names and the ref or reading time it was derived at, and a row
    the command cannot derive is printed as NOT DERIVED with its source
    rather than filled in — a construction, where every brief written
    from memory on 2026-08-25 broke the clause after the one it quoted.
  - **THE FENCE IS A PROPERTY AT THE MOMENT OF THE WRITE, NOT ONLY A
    DISCIPLINE AT THE HANDOFF** (T-154, ADR-020 decision 1). After
    cutting the lane and before briefing the session, the dispatcher
    runs `node tools/e2e/scripts/brief.mjs --task T-NNN --write-fence
    <the lane worktree>`: it expands the card's `touches:` through the
    parser's ONE fence implementation and leaves the answer in the lane
    as `.supertaskr/lane-fence.json`. **AND THE STEP BEFORE IT IS THE
    PREFLIGHT** (T-160). **THE RITUAL IS EIGHT STEPS AND THE ORDER IS
    THE LAW**: stamp `building` on the integration branch and COMMIT,
    cut the lane worktree at that commit, PREFLIGHT, write the fence,
    READ THE MANIFEST BACK, cut the bench, assemble the brief to a file,
    derive the port and the scratch stem. That sentence read "derive the
    brief, PREFLIGHT the card, write the fence, stamp and cut" until
    T-239, an order no seat could perform — `--write-fence` is handed
    the worktree the CUT creates, and the stamp precedes the cut (the
    serial-ritual bullet above, method/roles/orchestrator.md 5b) — so it
    is CORRECTED here rather than argued beside. **ONE ARM PERFORMS ALL
    EIGHT AND REFUSES AT THE FIRST THAT FAILS**, naming the step, the
    command it ran and its exit in the four house codes, removing every
    worktree it cut and leaving the stamp standing (a stamp is a fact
    about the card, T-226):

        node tools/e2e/scripts/brief.mjs --dispatch-lane T-NNN --slug <slug>
          [--executor <seat>] [--verifier <seat>] [--scratch <dir>] [--dry-run]

    Run from the integration checkout by the seat that HOLDS it: it
    refuses a checkout that is not the integration one and a checkout
    another live session holds, before its first step. `--dry-run`
    prints the plan and performs nothing. The hand spellings below stay
    exactly what the arm runs, one at a time —
    `node tools/e2e/scripts/brief.mjs --task T-NNN --preflight` from the
    repository root re-derives at HEAD every claim the card makes that
    IS derivable (paths, the fence through the live slug map, stamped
    figures, `blocked_by:` against live statuses, `@ <hash>` ref stamps)
    and refuses the dispatch on any that no longer holds, in
    `--write-fence`'s refusal shape and exit codes; it judges no
    DESIRABILITY and says so. A discrepancy is corrected or ruled
    acceptable ON THE CARD, dated, with a `PREFLIGHT RULING (<date>):`
    line naming the finding's own SUBJECT — as a plain, unindented body
    line, because a ruling written as a `- ` list item, indented, or
    inside a fenced block is invisible to the reader (T-160's verdict,
    correction four). A failed preflight also GATES `--write-fence`. Not
    in "Build & test", for the reason the METHOD EVAL GATE gives about
    its own runner; wiring it into CI is a routed suggestion.
    A PreToolUse hook wired in `.claude/settings.json` then reads that
    file at every Edit/Write with no dependency a fresh worktree lacks.
    FOUR ANSWERS FOR A LANE, AND THE AUTHORITY IS `decide` IN
    `.claude/hooks/lane-fence.mjs` RATHER THAN THIS PAGE: a checkout not
    on a lane branch is ALLOWED — the integrator, the architect and
    every detached drill, the positive control that keeps a refusal
    distinguishable from an absence; a lane branch with NO manifest is
    REFUSED, a dispatch that skipped its step; a path inside the
    manifest or under the unfenceable `docs/tasks/` is allowed; anything
    else is refused, naming the fence, the path and the route. A card
    whose `touches:` no longer matches the manifest's stamp refuses with
    `re-expand`, so a fence cannot be widened from inside the lane —
    `method/lane-protocol.md` rule 5, made mechanical.
    **AND THE SEAT WITH NO LANE IS SEEN TOO** (`T-154-s2`; @human ruled
    those writes IN SCOPE on 2026-08-30): a checkout NOT on a lane branch
    — this one above all — is refused a write to any repository-relative
    path some LIVE lane's manifest reserves, read off git's own worktree
    administration with no subprocess. **THE CARVE-OUTS ARE CRITERIA AND
    NEVER THE HOOK'S JUDGEMENT**: `docs/tasks/` stays unfenceable (every
    manifest carries it as `alwaysWritable`, so the dispatch and closing
    stamps are safe), a card's own file is outside every fence —
    `expandFence`'s subtraction at dispatch and never an arm at the
    write, since `T-219-s3` removed the one no manifest could select —
    and this seat's own standing writes are never a lane's
    to veto — exactly `docs/STATE.md` and `docs/checkpoints`, no more.
    ONE CRITERION IS THE HOOK'S OWN: a checkout git records as
    mid-merge, mid-rebase, mid-revert or mid-cherry-pick is free,
    because resolving a lane's merge is an Edit inside that fence by
    construction. **AND IT CLOSES BEFORE THE LANE DOES**: git drops the
    marker at the merge COMMIT while rule 6 keeps the worktree until
    after the CHECKPOINT, so an Edit into a just-merged fence is refused
    for that window, where this project's verdict corrections land —
    remove the worktree before the reconciling writes (`T-154-s2`).
    **AND SINCE `T-249` IT SCREENS A READ, WHICH IS NOT A FENCE AND IS
    NOT WIDENED BY ONE**: `decide` asks `SECRET_SET` — ONE list in
    `.claude/hooks/lane-fence.mjs`, as DATA, seven entries, each
    carrying a `sample` the spec drives as that entry's own positive
    control and requires no OTHER entry to claim — FIRST for a read
    tool, and never reaches the fence. So a card whose `touches:` NAMES
    an env file, a private key, an ssh or cloud credential directory or
    a keychain export still may not read it: A FENCE WIDENS WRITES AND
    NEVER SECRETS, and the seat that needs a secret's SHAPE asks the
    human for a REDACTED sample in the transcript, where it is not a
    record. **READS ARE SCREENED, NOT FENCED** — a read OUTSIDE the
    lane's fence is ALLOWED, because a lane that may not read `docs/`
    cannot work, and a guard that kills lanes is a guard somebody turns
    off. **AND IT FAILS OPEN ON CLASSIFICATION**, the exact inverse of
    the lane arm's every-uncertainty-is-a-refusal: a path this hook
    cannot classify — no path in the request, a NUL in the target, a
    target resolving to a filesystem root — is ALLOWED and LOGGED,
    naming the path and the reason, because the one failure a fail-open
    guard must not have is silence. Its two answers, `secret-read` and
    `secret-unclassified`, are their OWN frozen set
    (`SECRET_READ_CODES`) and deliberately NOT members of the four
    below, which are the WRITE fence's limit codes and are published
    here entry for entry. Exactly ONE entry is DERIVED from the tree's
    own ignore files and records it — `*.local`, from `app/.gitignore`
    — which is all NINE tracked ignore files name between them,
    measured at `828621f5`; the spec re-derives at its own ref, so a
    new ignore pattern that goes uncovered reds by name. TWO
    OVER-REFUSALS ARE DELIBERATE AND DECLARED: `.env.example` is
    refused with every other `.env.*`, because a suffix is chosen by
    whoever named the file, and a project `.npmrc` is refused because
    an auth token sits in one beside its ordinary settings. **AND IT IS
    UNARMED AT THE HARNESS UNTIL `.claude/settings.json` MATCHES A READ
    TOOL**: that matcher reads `Edit|Write|NotebookEdit` at `T-249`'s
    tip, so `decide` answers correctly and nothing asks it. The hook's
    own header says so, and `lane-fence.spec.ts` carries the record of
    which world this is — asserting that sentence today and a real
    exit-2 refusal through the process boundary the moment a read tool
    is named.
    **THE LIMITS — A GUARD BELIEVED WIDER THAN IT IS IS WORSE THAN NO
    GUARD** — eight, numbered in `.claude/hooks/lane-fence.mjs`'s
    HONEST LIMITS header, whose count and four declining CODES
    `tools/e2e/tests/lane-fence.spec.ts` COMPARES against this page;
    the prose alone is by hand. (1) A Bash-mediated write — `sed -i`, a
    `>` redirect, a checkout — reaches disk without an Edit or a Write,
    so **TWO LAYERS FENCE A LANE AND NEITHER IS SUFFICIENT**
    (`method/lane-protocol.md` rule 5, `T-210`): this hook judges an
    Edit, including one into ANOTHER lane's tree, which never enters
    this lane's diff; the PHYSICAL layer leaves out-of-fence tracked
    files read-only, so a shell write takes `EACCES` unparsed — but
    only on an OPEN, never a rename-over (the canonical `sed -i`), a
    create, a delete or git, which also DISARMS the bit, and that
    residue is the landing gate's half. (2) A path in NO GIT CHECKOUT
    AT ALL is not judged (`not-a-repository`), and since `T-199` that
    is the WHOLE of it: the scratchpad and `/tmp` stay reachable. It
    read *outside the WRITING checkout* until `T-199`, which left EVERY
    lane write UNJUDGED; the root now comes from the TARGET. **THE
    RESIDUE**: a sibling lane's tree is judged by THAT LANE'S fence,
    and the hook has no term separating an architect reaching in from
    that lane's OWN executor. (3) A DETACHED checkout is not judged at
    all (`not-judged-detached`), which frees the poison drill and the
    human's app checkout. (4) A live lane whose manifest this seat
    cannot read reserves nothing (`not-judged-lane-list`). (5) It is
    ADVICE TO A COOPERATING HARNESS: a session that can edit
    `.claude/settings.json` disarms it. (6) is the mid-integration
    window above. (7) Containment compares BYTES and this volume does
    not, so `DOCS/ROADMAP.md` passes the lane-less seat where
    `docs/ROADMAP.md` is refused; the LANE arm has no such escape.
    (8) A request with no readable path is the one question the
    WRITER's cwd still answers — refused in a lane, DECLINED
    (`no-path-to-judge`) elsewhere, which a lane executor, sitting in
    the dispatching checkout, takes. Every decline carries
    `judged: false` and speaks on **stderr**. And **IT FAILS OPEN IN
    TWO SHAPES**: a script that cannot be LOCATED never starts — two
    faults, `CLAUDE_PROJECT_DIR` unset AND a cwd outside any checkout
    carrying the hook; and on ONE fault, a COMPLETE registration whose
    hook FILE is gone still spawns node, which exits 1 where blocking
    is 2, so nothing refuses while the checkout looks configured
    (`checkout-currency.spec.ts`, ARM B). **SO *"a PreToolUse hook
    enforces it"* IS A CLAIM ABOUT THE DISPATCHING CHECKOUT AND NEVER
    ABOUT THE LANE**: `.claude/settings.json` runs the hook out of
    `${CLAUDE_PROJECT_DIR:-.}`, the SESSION's project root, so a lane
    meets the DISPATCHER's copy — true only from `T-199` forward and
    only for a session started in a checkout carrying it; the arm-time
    catcher asks (`T-216-s1`, `checkout-currency.mjs`). The manifest is
    a RUNTIME file carrying a self-ignoring `.gitignore` beside it: one
    that reached the integration branch would hand every checkout one
    lane's permanently stale fence.

- THE MAIN CHECKOUT IS SHARED WITH A HUMAN RUNNING THE APP, AND THE
  PIPELINE HAS KILLED IT THERE (T-052 — ten instances across
  2026-08-16/24, itemised on that card). **The generic rules are
  `method/roles/integrator.md`'s "The checkout you merge into may be in
  use" and are NOT restated here** — that file rules the fresh install,
  the dependency-artifact channel, the checkpoint record and the
  no-scratch-files rule, and leaves every mechanism to the project.
  These are this project's mechanisms.
  **THE APP'S TWO TRIGGER SETS ARE DIFFERENT SETS.** `tauri dev`
  rebuilds and RELAUNCHES the binary on a change under
  `app/src-tauri/**`; a change under `app/src/**` goes to vite HMR and
  the window is never replaced — and the relaunch fires at the
  WORKING-TREE WRITE, seconds ahead of the commit an integrator would
  date it by. BOOT GATE's trigger is a THIRD set (what could stop the
  app BOOTING); derive none from another.
  **ANCHOR THE PROCESS MATCH OR THE MEASUREMENT LIES**:
  `ps | grep 'target/debug/supertaskr'` matches `supertaskr-index` as a
  substring, so an integrator's own graph-gate run reads exactly like a
  relaunch — anchor with
  `ps -eo pid,lstart,command | awk '$NF=="target/debug/supertaskr"'`.
  **THE FRESH INSTALL IS THE ONE CHANNEL THAT CORRUPTS RATHER THAN
  INTERRUPTS.** `npm ci` removes `app/node_modules` while the human's
  vite serves out of it; a running vite SURVIVES the removal, but what
  the NEXT read needs is destroyed (`node_modules/.vite` deleted and not
  recreated) and `tauri dev` is more than vite, so nothing licenses
  running the install beside a live app. The rule stands on the WINDOW,
  not on a kill.
  DETECT AND REFUSE, in the T-046 form: read the holder with
  `lsof -nP -iTCP:<port> -sTCP:LISTEN`, and for 1420 that is the ONLY
  command permitted (see PORT RULE) — **never bind-probe, and never
  connect**. On a hit, name the step you are skipping, the pid and
  socket you read, and what has to happen first. On no hit, PROCEED: a
  refusal that fires whether or not the app is up cannot tell the two
  apart, which is the NEGATIVE ASSERTION rule below applied to a
  procedure.
  **`lib/parser/dist` REACHES THE RUNNING APP WITH NOTHING UNDER `app/`
  IN THE DIFF.** The app depends on `@supertaskr/parser` through
  `file:../lib/parser`, which npm installs as a SYMLINK, so the built
  `dist/` the running vite serves is the parser's own directory: a
  lib-only merge that rebuilds it changes what the app is serving
  (instance 5). The question is never "does my diff name a file the app
  owns" but **"which build outputs does the running app read"** — the
  fresh-clone ORDER at the top of this file answers it, and a docs-only
  diff is not exempt, because an integrator who runs the install order
  runs the parser build.
  **A PROBE OR SCRATCH FILE IN THE MAIN CHECKOUT IS A VIOLATION** (the
  unexplained `zz-scope-probe.ts` of instance 9), **and a lane worktree
  parked INSIDE the tree is the same violation in a larger shape**:
  `git worktree add ../supertaskr-T-NNN` typed while the shell sits in
  `tools/e2e` lands in `tools/`, silently. Cut worktrees with an
  ABSOLUTE path, or verify the cwd first. **NAME YOUR PATHS; never
  `git add -A` and never `git commit -a` in the main checkout** — a
  parked worktree makes `git add -A` a thousand-file stage. Scratch work
  belongs in a DETACHED sibling worktree with its own name, or outside
  the repository; an unexplained file found here is RECORDED in the
  checkpoint and LEFT — its provenance is evidence.
  **@HUMAN'S RULING 2026-08-25 — THE SECOND CHECKOUT IS ADOPTED AND THE
  MECHANISM IS A DETACHED WORKTREE.** The criteria, quoted because they
  decide which arguments count: *"It doesn't bother me as a user if the
  app restarts. The only thing I'm concerned about is if something
  breaks or if development work suffers."* The restart is not a cost;
  what survives is the fresh-install BREAKAGE channel above and cargo's
  target-dir THROUGHPUT channel, and the detached checkout closes both.
  Setup, when the tree is quiet:

      git worktree add --detach ../supertaskr-app main

  then the fresh-clone ORDER at the top of this file, inside it; it
  updates with one command, when the human chooses:

      git -C ../supertaskr-app checkout --detach main

  **BEING DETACHED IS THE FEATURE** — the app's code cannot move on its
  own, so the pipeline may merge all night; the app still OPENS
  `/Users/ujju/Projects/supertaskr` as its project. Whether it exists,
  where 1420's holder runs from, and the two target-dir mtimes are
  LIVE-ENVIRONMENT facts — re-derive them (`git -C ../supertaskr-app
  rev-parse HEAD`, `lsof -p <pid>`), never quote them. **AND IT EXCUSES
  NOTHING ABOVE**: every rule in this bullet binds whether or not
  `../supertaskr-app` exists.

- DISPATCH FROM THE LAST CHECKPOINT, never from a merge commit
  (T-014-s3, seven-for-seven): cut a task branch from the newest
  `Checkpoint:` commit on main. **READ THE REASON, NOT ONLY THE
  SENTENCE — THE TWO DISAGREE** (T-089, itself dispatched from a
  docs-only commit four after the newest checkpoint, obeying the reason
  while failing the letter). The rule bans a MERGE commit, and the
  reason is a stale graph: a merge commit carries a graph the checkpoint
  has not regenerated yet (GRAPH REGEN above), so a lane cut from one
  inherits a stale graph and a red `index --check` through no fault of
  its own — T-014 is the counter-example, T-027 the worked example the
  other way. A non-merge commit later than the checkpoint carries the
  checkpoint's graph and is safe ON THAT COUNT. **But "safe" is all its
  gates green, not only the graph**: a docs-only non-merge commit can
  still red a code suite through FRONTMATTER (the DOCS GATE), which no
  graph argument covers — so this holds by PRACTICE, verified, NOT by
  property; nothing forbids a source commit between checkpoints. What
  the bullet means is: cut from a commit whose gates are green, which
  the newest `Checkpoint:` always is and a merge commit never is. This
  rule is what makes the window HARMLESS; the CI gate above is what
  makes it VISIBLE. Both, not either.
