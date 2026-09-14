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
by every reader, and a bullet a chapter carries that this index does not
point at is a HARD FAILURE at the splice — a rule no reader of this
project can find is not in the document.

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
  Every release's own note — what moved, its card and its date — is in
  docs/reference/14-versions.md, moved there verbatim at T-290; the
  AUTHORITY for what a version says is `method/` itself at that tag,
  and this line is the stamp the bump writes.

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
