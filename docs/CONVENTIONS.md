# Conventions

THE INDEX OF THIS PROJECT'S RULES, and the rules themselves are the
chapters under docs/conventions/ that every line below names. Landed to
the foundation-files standard at T-290 (ADR-023, decision B of
docs/rooms/foundation-files-standard.md): each bullet is its RULE, the
keeper that enforces it and the card that made it, while the history,
the measurements and the argument behind it live in the docs/reference
chapter that owns the topic. Compacted before that under ADR-019
(docs/rooms/governing-docs.md); the landings are 2026-08-27 (the record
is docs/checkpoints/2026-08-27-adr019-compaction.md), T-162 (2026-08-30)
and T-236 (2026-09-02, whose pre-compaction text is
`git show 3170247:docs/CONVENTIONS.md`).

**A PROGRAM READS THE INDEX AND ITS CHAPTERS AS ONE TEXT.** Every line
below carries a bullet's OPENER verbatim and the chapter it lives in, in
this document's own order; `conventionsText` in
tools/e2e/scripts/docs-scan.mjs splices them back into one document
before any rule is read out of it, and app/src-tauri/src/dispatch/brief.rs
does the same in Rust. So a bullet moved between chapters is still found
by every reader, and a chapter this index does not name is invisible —
which the docs gate refuses.

## Build & test

  - docs/conventions/commands.md — Fresh-clone ORDER (T-003, ADR-011): lib/parser FIRST — `npm ci` +
  - docs/conventions/commands.md — lib/parser (C-06), run from lib/parser/: `npm ci` ·
  - docs/conventions/commands.md — app/ (C-05), run from app/: `npm ci` (setup) ·
  - docs/conventions/commands.md — app/src-tauri (C-05 Rust half + the C-07 workspace), run from
  - docs/conventions/gates-and-the-push.md — AUDIT GATE POLICY (human ruling 2026-08-16, closing T-020-s2): the
  - docs/conventions/commands.md — tools/e2e (the real-input E2E lane, T-020 — the repo's THIRD npm
  - docs/conventions/commands.md — `npx supertaskr <verb>` (T-244, C-02) IS A FRONT, NEVER A FIFTH
  - docs/conventions/gates-and-the-push.md — THE BLESSED GATE-RUNNER (T-202): `node tools/e2e/scripts/gate-run.mjs
  - docs/conventions/gates-and-the-push.md — **AND IT NOW MINTS A TOKEN THAT GATES YOUR PUSH** (T-203). Each run
  - docs/conventions/gates-and-the-push.md — **AND SINCE T-280 A PUSH OWES THE SET ITS OWN RANGE OWES, NOT THE
  - docs/conventions/gates-and-the-push.md — **THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314, AND THE BYPASS THAT
  - docs/conventions/shell-and-scripts.md — **AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP** (`18d8166`): never
  - docs/conventions/shell-and-scripts.md — **A GATE READ THROUGH A PIPE REPORTS THE PIPE**, so a hard failure
  - docs/conventions/shell-and-scripts.md — **PASS THE DOCS GATE SEPARATE LITERAL PATHS.** zsh word-splits an
  - docs/conventions/shell-and-scripts.md — **A LINE NUMBER IS A FIGURE** — a coordinate in a mutable object that
  - docs/conventions/shell-and-scripts.md — **AND A DISTANCE TO A MOVING TIP CANNOT BE STATED AT ALL IN A DOCUMENT
  - docs/conventions/shell-and-scripts.md — **THIS SHELL'S `grep` IS A SHIM.** It carries `-I` and REJECTS
  - docs/conventions/gates-and-the-push.md — **A PUSH NO LONGER CANCELS THE RUNNING CI JOB (T-294), AND NOBODY
  - docs/conventions/gates-and-the-push.md — **AND THEN READ IT.** `gh run list --limit 5` after a batch, and
  - docs/conventions/shell-and-scripts.md — **NEVER TYPE A PATH YOU CAN DERIVE.** `find`, `git ls-files`, or the
  - docs/conventions/shell-and-scripts.md — **FIT A BYTE-BANDED DOCUMENT IN ONE WRITE, NOT IN A LOOP.** Draft into
  - docs/conventions/shell-and-scripts.md — **RUN THE SUITE ONCE IN A BORROWED GIT ENVIRONMENT BEFORE YOU BELIEVE
  - docs/conventions/shell-and-scripts.md — **PIN THE DEFAULT BRANCH IN EVERY GIT FIXTURE**: `git init -b main`,
  - docs/conventions/commands.md — One-time dev-tool setup, outside the repo and never a repo dep:
  - docs/conventions/dispatch-and-scratch.md — **THE DISPATCH RITUAL IS SERIAL: cut ONE worktree, arm it, READ THE
  - docs/conventions/dispatch-and-scratch.md — **E2E PORT — DERIVE IT PER LANE: `SUPERTASKR_E2E_PORT=15000+<card number>`.**
  - docs/conventions/dispatch-and-scratch.md — **SCRATCH RULE — NAME EVERY SCRATCH FILE FOR THE LANE THAT OWNS IT**
  - docs/conventions/dispatch-and-scratch.md — **THE VERIFIER'S BENCH IS TWO SPAWNS, AND THIS BULLET IS THE
  - docs/conventions/dispatch-and-scratch.md — **THE SEAT PROPOSES BEFORE IT RECORDS, AND THIS BULLET IS THE
  - docs/conventions/dispatch-and-scratch.md — PORT RULE: 1420 belongs to the human's live `tauri dev`. The lane
  - docs/conventions/commands.md — CI (.github/workflows/ci.yml) is a thin invoker of exactly these

## Gotchas

- method/ is the generic, product-agnostic convention — nothing
  supertaskr-specific goes in it; product docs live in docs/. Changes to
  method/ formats are version-bumped (currently v0.1.31) and noted here.
  **A VERSION'S NOTE HERE IS ITS DATE, ITS CARD AND ITS THEME; WHAT
  MOVED IS THE RELEASE'S OWN RECORD** (ADR-019's law applied to this
  changelog at T-162): the per-clause itemisation is RECORD-shaped, and
  the AUTHORITY for what a version says is `method/` itself at that tag.
  v0.1.31 (T-322, 2026-09-14) — the UNATTENDED-OPERATION release: a rejected verdict or a CI red is attributed before anything acts; a repair continues on evidence and parks with a wake condition; the health check is specific to the action; a quota refusal becomes a recorded retry instant (the wait verb gains a wait-until-instant form); a reserved decision becomes a marked question entry the order and the cut read; the return brief (`brief.mjs --since`) derives from the records and the runner's runs; the keep-awake rule lands and the stop list names only the grant's stops.
  v0.1.30 (T-143-s5, 2026-09-14) — the STALENESS-BY-CREATION release: the docs gate's staleness derivation (staleStateRecords, the one helper the docs gate and the push checks consume) compares a checkpoint record against the commit that CREATED it rather than its latest touch, so an append to an already-checkpointed record no longer demands a STATE commit whose only content is a clock; a record created without its STATE regeneration still reds by name, the same-commit tie still passes, the reading stays committed history, and a record git names no creating commit for falls back to its latest touch; docs-protocol.md rule 4 argues the rule once, both halves — the creation obliges, never every later touch, and an amendment that changes a fact or a hazard the state document summarises still updates it, conduct no program keeps.
  v0.1.29 (T-324, 2026-09-14) — the ADMISSION release: every admission the arm makes — the lane cut, a child start, a re-entry or continuation, a replacement writer — is bound to the grant's revision, the card's approved blob and the attempt's reservation; an admission is explicit (a card the grant names) or derived (a repair the recovery policy allows, bound to its parent work and the failure evidence); the three approval modes and the two recovery values are enforced at those boundaries, a pause distinguishes new work from the admitted candidate's verification and integration, optional limits are read and reported as advisory and enforced by nothing, a successor coordinator inherits the grant from the block; the dispatch block's switches become operational in the process schema and the orchestrator's step 5 says a dispatch inside the current grant is approved by the grant.
  v0.1.28 (T-319, 2026-09-14) — the DISPATCH BLOCK release: the runtime template gains an optional dispatch block — the approval mode (each, until a named card, standing), the recovery policy (none, repairs) and the grant that sets them with its revision, order, endpoint, card blobs, optional advisory limits, revocation and history — declared once in the process schema as its own section of sixteen rows, every row labelled declarative because nothing admits or refuses by it until T-324; the parser library's process-settings module reads the block through the pure entry as one typed value validated against the declaration, a named refusal and never a partial value, with the explicit no-grant state (approval each, recovery none, no grant, revision 0) when the block is absent; the settings reference renders the section from the declaration; this project's own template carries no grant.
  v0.1.27 (T-298-s3, 2026-09-14) — the XS release: the size vocabulary gains XS in the parser's legal set and the task format's frontmatter block, preserving S, M and L, so the bounded tier the tier table selects on XS is reachable end to end from a card that lives in the tree; the ceremony table gains an XS row restating the bounded line (executor only, the keeper scoped, the push owing its range), written lightest-first; the lightest ceremony row and the tier table's bounded size are pinned as one invariant read from both documents rather than a typed letter.
  v0.1.26 (T-299-s6, 2026-09-13) — the LABELS release: every process switch carries an implementation label, `operational`, `manual` or `declarative`, with a manual switch's action beside it; an operational label is proved by a body that changes the value and observes the arm behave differently; the terminal shows the label beside the value and refuses to edit a declarative switch with its file unchanged; the reference carries the labels.
  v0.1.25 (T-311-s5, 2026-09-13) — the READERS release: the task format names the criteria heading's depth in words and a body keeps every card to it; the advisory seat reader and the card preflight hold one heading rule, so both answer the same criteria for the same card; the verifier role file spells the verdict entry's one shape with the date first, and the merge verb's newest-verdict reader finds a dated depth-three entry wherever its date sits, a correction block's heading excluded.
  v0.1.24 (T-311, 2026-09-12) — the RUN RECORD release: every child run, native subagent or foreign process, writer or
  read-only participant, runs under a file-backed run record and the same seven operations; a writer reserves its resource exclusively before launch, and an uncertain record is reconciled before any replacement.
  v0.1.23 (T-299, 2026-09-11) — the PROCESS AS SETTINGS release: method/runtime/process-schema.yaml declares every
  switch once (the loop room's inventory and the floor) under three profiles, and the runtime template's process: section names the profile.
  v0.1.22 (T-298, 2026-09-11) — the RIGHT-SIZING release: the triage rule stated once (orchestrator 2), the model per
  role read from the runtime template and printed in the brief (5b), every wait bounded and performed by the arm (5f).
  v0.1.21 (T-296, 2026-09-10) — the THREE TIERS release: bounded, standard and guarded chosen by the arm from
  the card against the guard-class list; phase 1 and phase 2 rendered by the arm; the standard verifier's mode stated once.
  v0.1.20 (T-295, 2026-09-10) — the ARM MERGES release: `brief.mjs --merge <id>` performs the
  integrator's ritual from the verdict and stops with the merge staged; integrator.md states the widening beside the re-drill.
  v0.1.19 (T-307, 2026-09-10) — the PROPOSE-BEFORE-RECORDING release: a room or decision
  entry is shown to the owner verbatim and appended on a yes; entries paraphrase and never quote; an eval holds it.
  v0.1.18 (T-293, 2026-09-10) — the STANDING READ release: a seat reads STATE and a
  generated one-line index of the other four governing documents, nothing else standing (ADR-024).
  v0.1.17 (T-264-s3, 2026-09-10) — the RENAME release: the runtime template is
  supertaskr.yaml, the kit and the launcher spell the product name, no spelling of the old one survives outside a ruling.
  v0.1.16 (T-285, 2026-09-09) — the WAKE FIELD release: a parked card's `wake:`
  condition is machine-read and the dispatch view lists WOKEN cards beside STARTABLE.
  v0.1.15 (T-283, 2026-09-09) — the IN-FENCE FOLLOW-THROUGH release: an executor
  performs an XS finding inside its fence and the verifier grades it.
  v0.1.14 (T-281, 2026-09-09) — the MUTANT BLOCK release: the verifier commits
  the bodies its corrections assign and the merge re-drills them.
  v0.1.13 (T-279, 2026-09-09) — the ONE GRADED RUN release: a lane runs its
  owed suites once, at its final code-and-notes commit; the stamp is exempt.
  v0.1.12 (T-254, 2026-09-09) — the CONTEXT PACK release: the seats read
  the brief's pack, not CONVENTIONS whole; itemised on T-254's card.
  v0.1.11 (T-241, 2026-09-09) — the SEAT release: the architect's hand
  work ships as a skill pack the kit carries; itemised on T-241's card.
  v0.1.10 (T-265, 2026-09-08) — the RENAME release: the kit, its
  adapters and its templates carry the product's ruled name (ADR-022);
  itemised on T-265's card.
  v0.1.9 (T-229, 2026-09-02) — the CONTROL release: a positive control
  is demonstrated failing, not asserted; itemised on T-229's card.
  v0.1.8 (T-159, 2026-08-30) — the METABOLISM release: one bump owning
  every method-text change ADR-020 and its reviews earned, plus the
  parked riders whose resurfacing condition named it; itemised on
  T-159's card and in docs/checkpoints/2026-08-30-T-159.md.
  v0.1.7 (ADR-019, 2026-08-27) — method/docs-protocol.md added, the
  three-tier governing-docs contract; itemised in
  docs/checkpoints/2026-08-27-adr019-compaction.md.
  **WHAT A BUMP IS OWED FOR — SETTLED HERE, BECAUSE "FORMATS" HAS BEEN
  READ BOTH WAYS AND A LANE CANNOT DECIDE IT FROM INSIDE ITS OWN
  FENCE** (T-145-s2; T-104 ruled the call belongs to triage BEFORE
  dispatch). The trigger is NOT the word *format*. **Two tests, either
  one sufficient.** (1) **SHIPPED BYTES** — the change alters a file the
  kit MATERIALIZES into another project; derive that set from
  `KIT_FILES` in app/src-tauri/src/agent/kit.rs at your own ref, never
  from a directory name — the boundary runs THROUGH method/, and
  lane-protocol.md and roles/integrator.md are not in the table while
  every adapter and template is. (2) **GRAMMAR** — the change alters
  what a card, a room, a brief or a role may SAY: a field, a status, a
  normative table, a contract row. **An adapter takes test 1 and fails
  test 2** and is still owed a bump; **a purely editorial change to an
  unshipped method file — a typo, a reflow, a citation repair — is owed
  none** and rides the next one. Deciding this before dispatch is
  triage's, and a card whose fence cannot reach all three stamps CANNOT
  take it: say so on the card.
  **A BUMP IS A THREE-FILE COMMIT AND THE THIRD FILE IS RUST** (T-078-s3
  arm 1, taken at T-089). The three are: this stamp; the `(v<version>`
  stamp in method/interview/plan-interview.md's Output heading; and
  `METHOD_SNAPSHOT_VERSION` in app/src-tauri/src/agent/kit.rs, which
  `snapshot_version_matches_the_live_method_stamps` checks BOTH docs
  against, off disk, on every `cargo test`. So a fence of
  `[method/, docs/CONVENTIONS.md]` can change method/ and CANNOT bump
  it: moving either stamp alone reds that test by name (T-089 measured
  both sides, exit 101 each). **The two asserts are ORDERED**: a
  const-only bump reds on the plan-interview arm and NEVER reaches the
  CONVENTIONS arm, so fixing only the file a panic names yields a SECOND
  red — move both doc stamps and the const in ONE commit. **THREE
  PLACES ARE PINNED AND AN OPEN SET IS NOT — CITE THE SHAPE, NOT THE
  TALLY.** Every other occurrence of the version is a REFERENCE no test
  reads: **a reference that CLAIMS THE CURRENT VERSION goes stale and
  moves with the bump; a FIXTURE that merely needs some version string
  does not**, and moving those is churn. **DERIVE THE LIST, NEVER QUOTE
  IT**: `git grep -n "0\.1\.[0-9]"` from the repo root prints every one
  at your own ref. **AND THEY ARE NOT ALL INSIDE ANY ONE FENCE**: a
  `[method/, docs/CONVENTIONS.md, app-agent]` fence reaches the three
  pinned places and this file's references, and does NOT reach
  docs/ARCHITECTURE.md, the component file or the app suites. Route
  what you cannot reach.
  **AND THE VERSION STAMP IS NOT THE ONLY THING PINNED IN THAT FILE —
  ITS BANKING TABLE IS TRANSCRIBED INTO TYPESCRIPT AND ASSERTED CELL BY
  CELL** (T-159). `BANKING_MAP` in app/src/genesis/genesis-derive.ts is
  a verbatim copy of method/interview/plan-interview.md's stage table,
  and `every_cell_of_the_9_row_table_matches_plan_interview_md_verbatim`
  in app/test/genesis-derive.test.ts reds on ANY change to ANY cell — so
  the canonical bump fence can move the file's version stamp and CANNOT
  move a row of its table. **The reader is in `app/`, so a
  `method/`-only lane will not run it by reflex** — run `npm test` from
  app/ whenever your diff touches that table, and read the assertion.
  **A BUMP NOW OWES A FOURTH THING, AND IT IS NOT A FILE** (T-155,
  ADR-020 decision 2). The METHOD EVAL GATE below is RUN against the new
  method text and its result is RECORDED IN THE BUMP'S OWN COMMIT
  MESSAGE; `node tools/method-evals/run.mjs --bump` prints the block and
  names the runner that produced it. A stamp proves the three files
  moved together and nothing else — it is satisfied perfectly by a
  rewrite that degrades every session the method produces; a fourth
  FILE would go stale between bump and merge and be a figure with no
  keeper, where a commit message is stamped at the ref it was measured
  at. **AND THE MODEL-IN-LOOP HALF ONLY RUNS HERE**: token-expensive and
  nondeterministic, so not on the per-merge trigger, which leaves the
  bump as the ONE moment it is owed — and the `--bump` block says
  whether the evals ran or were skipped, because the two read the same
  afterwards.

  - docs/conventions/records-and-rooms.md — [?] marks an unresolved claim (archaeology convention) — resolve or
  - docs/conventions/records-and-rooms.md — THE MERGE INTO MAIN IS @human'S GATE, BY DESIGN AND NOT BY ACCIDENT
  - docs/conventions/records-and-rooms.md — THE ARM MERGES, AND THE SEAT RULES (T-295, ADR-024 decisions 3 and 4):
  - docs/conventions/records-and-rooms.md — BOUNDED WAITS, IN THIS PROJECT'S OWN SPELLING (T-298, ADR-024's room
  - docs/conventions/records-and-rooms.md — THE RUN RECORD, IN THIS PROJECT'S OWN SPELLING (T-311, ADR-025
  - docs/conventions/records-and-rooms.md — THE PROCESS IS SETTINGS, AND EVERY SWITCH IS DECLARED ONCE (T-299,
  - docs/conventions/architecture.md — GUARD-CLASS PATHS, IN THIS PROJECT'S OWN SPELLING (T-296, ADR-024
  - docs/conventions/architecture.md — A CITATION NAMES A SYMBOL, NOT A LINE (fourth triage, 2026-08-19):
  - docs/conventions/architecture.md — This project was planned in a long chat session before the folder
  - docs/conventions/app-and-ui.md — Tauri v2 applies the CSP (app/src-tauri/tauri.conf.json) at serve
  - docs/conventions/app-and-ui.md — Tauri capability grants compile to code, not strings — `strings` on a
  - docs/conventions/architecture.md — DECLARING A COMPONENT moves THREE live-registry fixtures, not two
  - docs/conventions/architecture.md — THE SHIPPED PARTITION, IN SLUGS (T-147 — the sentence
  - docs/conventions/app-and-ui.md — UI work adds tokens to app/src/styles/tokens.css, never Tailwind
  - docs/conventions/app-and-ui.md — Suggestion-triage encoding is ratified in method/tasks/TASK-FORMAT.md
  - docs/conventions/app-and-ui.md — The genesis kit is ratified in method/roles/planner.md +
  - docs/conventions/app-and-ui.md — Outside-click/dismissal listeners must decide on pointerdown, never
  - docs/conventions/app-and-ui.md — A RENDER-PHASE REF STAMP is legitimate only under three conditions,
  - docs/conventions/architecture.md — THE FOUR WALKS — which one sees this file? (T-078, closing an open
  - docs/conventions/merging.md — THE RANGE RULE: WHICH TWO COMMITS "THE MERGE'S DIFF" MEANS, AND IT IS
  - docs/conventions/merging.md — GRAPH REGEN (T-009-s1's INTERIM rule, RETIRED at T-054 and replaced
  - docs/conventions/lanes.md — THE LANE PROTOCOL — the generic rules are `method/lane-protocol.md`
  - docs/conventions/lanes.md — THE MAIN CHECKOUT IS SHARED WITH A HUMAN RUNNING THE APP, AND THE
  - docs/conventions/lanes.md — DISPATCH FROM THE LAST CHECKPOINT, never from a merge commit
  - docs/conventions/standing-gates.md — BOOT GATE (T-046, ratified at the 2026-08-16 triage on T-040-s1 +
  - docs/conventions/standing-gates.md — DOCS GATE (T-084 — the third standing gate, and the one the two above
  - docs/conventions/standing-gates.md — METHOD EVAL GATE (T-155, ADR-020 decision 2 — the FOURTH standing gate,
  - docs/conventions/merging.md — HEALTH BANDS AT THE CHECKPOINT (T-156, ADR-020 decision 3; this bullet
  - docs/conventions/merging.md — THE CHECKPOINT COMMIT'S SUBJECT OPENS WITH `Checkpoint:` (T-182) — the
  - docs/conventions/verification.md — POISON DRILL (ratified at T-054; until then "poison", "vacuous" and
  - docs/conventions/verification.md — A FIX NAMES ITS CLASS AND ITS SWEEP, OR RECORDS THAT NONE WAS RUN
  - docs/conventions/verification.md — A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL (T-060-s2, written down
  - docs/conventions/verification.md — LIFTING A SAFETY GUARD TO DISCRIMINATE (T-060-s1, written down at
  - docs/conventions/verification.md — THE E2E LANE'S HONEST SCOPE (T-049-s1, recorded rather than coded —
