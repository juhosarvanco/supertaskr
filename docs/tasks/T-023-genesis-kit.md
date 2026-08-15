---
id: T-023
title: Genesis kit — planner role, incremental banking, driver contract
feature: F-03
milestone: 3
priority: 1
size: M
status: verifying
blocked_by: []
touches: [method/, docs/CONVENTIONS.md]
builder: claude-fable-5
verifier:
built_by: "claude-fable-5 @fresh"
verified_by:
review:
---

The method gap F-03 exposes: nputer.yaml names `planner: claude` but
method/roles/ has no planner.md, and method/interview/plan-interview.md
says docs are written "one pass, after the interview ends" — which
contradicts both the design's live-materializing right pane AND the
succession principle (a stage-4 kill should leave stages 1–4 on disk).
This task makes the interview drivable by anything — a human in a
terminal today, the app's spawned session in T-025 — through one
written contract. Method version bumps to v0.1.5 (noted in
docs/CONVENTIONS.md per the standing gotcha). Product-agnostic: nothing
nputer-app-specific enters method/.

## Acceptance criteria
- THE method SHALL gain method/roles/planner.md in the established role
  format (cf. roles/orchestrator.md): run the interview per
  interview/plan-interview.md one question at a time; challenge weak
  answers; after each BANKED answer immediately write/update the
  affected docs/ artifacts (incremental banking) using
  method/docs-templates/; after Q7 run interview/decomposition.md to
  task files; scaffold the convention into the project (docs/ tree,
  adapter files, .gitignore carrying .nputer/, git init if absent);
  end with the cold-start test and the succession rule.
- THE role file SHALL fix the driver contract in one section: the
  kickoff = this role file plus the interview docs and templates
  (embedded or readable at a stated path); turns are plain text; a
  challenge turn opens with the literal prefix "pushing back:" (a
  rendering hint whose absence has no effect); a skipped answer is
  banked as an assumption marked [?] in the produced doc (archaeology
  convention reused); the transcript is NOT project record — the docs
  are (succession rule restated).
- THE plan-interview.md output section SHALL be amended from one-pass
  to incremental banking (each stage names the artifacts it banks
  into: Q1–Q2 → NORTH_STAR vision/users/success; Q3 → non-goals;
  Q4 → constraints; Q5 → decisions/001-stack.md; Q6 → riskiest
  assumption; Q7 + decomposition → ROADMAP + docs/tasks/), and THE
  banking map SHALL appear as a table a program can transcribe — it is
  T-024's stage-inference spec and T-025's kit spec.
- WHEN a hand-driven dry run of the kit is performed on a toy idea
  (builder runs any agent CLI in a terminal using ONLY the kit as
  instructions) THE produced docs/ tree SHALL parse with zero issues
  through lib/parser's suite commands run against it locally, and at
  least one produced task SHALL pass a written dispatchability
  spot-check; the transcript and the produced tree are attached to
  implementation notes as evidence (the tree lands as a test fixture
  in T-024, not here — lib/parser is deliberately untouched).
- IF the interview is killed at any stage THEN the docs banked so far
  SHALL be sufficient for a fresh session given only the kit and the
  folder to state which stage is next and continue — stated as an
  explicit resume rule in planner.md, exercised once in the dry run.
- IF a produced artifact would overwrite a file that already exists
  with real content THEN planner.md SHALL direct the planner to stop
  and ask the human rather than overwrite (greenfield kit; adopting
  existing content is archaeology's job, out of scope).

Verification: headless — file/section presence and cross-reference
checks, lib/parser suite green against the dry-run tree (run from
lib/parser with the tree as input, no parser code changes), version
bump present in CONVENTIONS. The dry-run transcript quality judgment
(did challenges actually challenge) is @human, listed explicitly.

## Implementation notes

2026-08-16, executor claude-fable-5 @T-023 (branch t023-genesis-kit).
All quoted evidence below is INDENTED, never fenced — splitSections has
no fence awareness, so a fenced `## heading` would leak into the task's
section split (noticed while writing these notes; harmless here by
construction).

### What was written

- method/roles/planner.md (NEW) — the kit's heart, in the established
  role format: numbered flow (stage-0 scaffold first; one question at a
  time; challenge weak answers; bank incrementally per the banking map;
  post-Q7 decomposition per interview/decomposition.md; cold-start
  test; commit; succession rule last), plus three sections: Driver
  contract (kickoff = role file + plan-interview.md + decomposition.md
  + docs-templates/** + adapters/* + tasks/TASK-FORMAT.md +
  tasks/T-000-template.md, embedded or readable at the KIT ROOT — the
  stated path convention: every kit-internal reference resolves
  relative to the directory holding roles/, interview/,
  docs-templates/, adapters/, tasks/, rooms/, runtime/; plain-text
  turns; literal "pushing back:" prefix as a rendering hint whose
  absence has no effect; skip → best assumption banked marked [?]
  (archaeology convention reused); transcript-is-NOT-record with the
  succession rule restated), Resume rule (fresh session + kit + folder
  → next stage = first banking-map row whose artifacts are missing or
  template-empty; STATE.md In-progress line is the cross-check hint;
  ARTIFACTS WIN on disagreement; re-ask nothing on disk), and Never
  overwrite real content (existing file with content the planner did
  not scaffold/bank itself → STOP and ask the human; adopting existing
  content is archaeology's job).
- method/interview/plan-interview.md — Output section amended from
  one-pass to incremental banking; intro now points at
  roles/planner.md. The banking map is a normative markdown table
  (below) with a stated rule that programs transcribe it as written
  and changing it is a method version bump. Footnotes: Q1 also fills
  the adapters' name/one-liner (outside docs/, so not a
  stage-inference input); every bank updates STATE.md's In-progress
  line to the NEXT stage (resume hint; artifacts stay ground truth);
  CONVENTIONS Build & test seeds at stage 5 (the stack implies the
  commands).
- method/docs-templates/NORTH_STAR.md — gained § Riskiest assumption
  (Q6's home; matches this repo's own NORTH_STAR precedent, which the
  old template had no slot for).
- method/docs-templates/ROADMAP.md + ARCHITECTURE.md — example rows
  folded INSIDE comments (indented so no line hits parseRoadmap's
  column-0 regexes): scaffolding is now a VERBATIM template copy that
  parses clean with zero phantom features. Proven below (stage-0
  proof). ARCHITECTURE keeps the empty components table header.
- method/README.md — one-line lifecycle coherence edit ("docs banked
  incrementally as it runs" instead of "docs generated").
- docs/CONVENTIONS.md — version note v0.1.4 → v0.1.5 (line "currently
  v0.1.5") + new gotcha bullet (v0.1.5, T-023): table is normative and
  transcribed by programs (T-024 stage inference, T-025 kit
  packaging), "pushing back:" never load-bearing, transcript is not
  record, templates scaffold VERBATIM so no bare example rows.
- docs/tasks/T-023-s1-roadmap-comment-blindness.md — suggestion:
  parseRoadmap is HTML-comment-blind (a column-0 `- F-NN:` bullet
  inside a comment parses as a real feature); confirmed from source;
  parser deliberately untouched here.

### The banking map (as landed in plan-interview.md)

| Stage | Interview step | Banks into |
|-------|----------------|------------|
| 0 | scaffold (pre-Q1) | docs/ tree copied verbatim from docs-templates/ + empty docs/decisions/ docs/tasks/ docs/rooms/ + adapter files at project root + .gitignore carrying `.nputer/` + git init if absent + docs/STATE.md stamped (Updated, In progress = next stage) |
| 1 | Q1 problem & person | docs/NORTH_STAR.md § Vision + § Users |
| 2 | Q2 success | docs/NORTH_STAR.md § Success criteria |
| 3 | Q3 non-goals | docs/NORTH_STAR.md § Non-goals |
| 4 | Q4 constraints | docs/NORTH_STAR.md § Hard constraints |
| 5 | Q5 stack & why | docs/decisions/001-stack.md (+ one ADR per contested choice) |
| 6 | Q6 riskiest assumption | docs/NORTH_STAR.md § Riskiest assumption |
| 7 | Q7 first slice | docs/ROADMAP.md § Backbone (ordered as the USER experiences the product) + § Milestones (milestone 1 goal) |
| 8 | decomposition | docs/tasks/T-*.md (see decomposition.md; every task passes the dispatchability test) + docs/ARCHITECTURE.md first draft + docs/ROADMAP.md § Milestones (task list) + § Parked + docs/STATE.md § Next up |

### Dry run — setup and honesty statement

Performed IN-SESSION per dispatch: the builder acted as the planner
following ONLY the kit files above; the founder is scripted (plausible
answers voiced by the builder) for a deliberately unglamorous toy —
`streak`, a single-user CLI habit tracker. Kit root =
this branch's method/; project directory = a scratch dir OUTSIDE the
repo (/private/tmp/...scratchpad/streak). Because one model voiced
both sides in one session, "fresh session" in the resume and
cold-start exercises means a fresh reasoning pass over disk output
only — stated as a limitation; the true-cold-context and
conversational-quality judgments (did the challenges actually
challenge) remain @HUMAN, per the verification note.

### Dry run — full transcript

    [driver kickoff] kit root = <branch>/method, project dir = <scratch>/streak

    [stage 0 — scaffold] planner: copied docs-templates/*.md verbatim into
    docs/; created empty docs/decisions|tasks|rooms; copied both adapters
    to the project root; wrote .gitignore with ".nputer/"; git init;
    seeded .nputer/nputer.yaml from runtime/nputer.yaml (MAY-clause);
    stamped STATE.md: In progress = "genesis interview running — next
    stage: 1 (Q1)".

    planner: What problem does this solve, for whom, in what situation?
    Not a market — I want one concrete person in one concrete scene.
    founder: I keep abandoning habit trackers. Every app wants an
    account, a phone, notifications. I live in a terminal all day — I
    want to mark a habit done without leaving it.
    planner: Give me the actual scene. Who is at the keyboard, at what
    moment, typing what?
    founder: Me. 7:40am, terminal already open, coffee next to it. I've
    just finished ten minutes of meditation and I type `streak done
    meditation`. In the evening I glance at my week before closing the
    laptop. That's the whole product.
    planner: Banked. [wrote NORTH_STAR § Vision + § Users; filled both
    adapters' name ("streak") + one-liner; STATE → next stage: 2]

    planner: What is measurably true when streak works? Convert every
    adjective into a number or an observable event.
    founder: It feels instant, and I actually stick with it this time.
    planner: pushing back: "instant" and "stick with it" are adjectives,
    not criteria — the same words you'd have used about the apps you
    abandoned. Instant compared to what, measured how? Stick with it for
    how long, observed where?
    founder: Fine. `streak done` returns in under 50 milliseconds on my
    laptop — it must never make me wait. Sticking with it means I log at
    least 5 days a week for 8 consecutive weeks, and the proof is the
    store file itself. And `streak week` has to fit one 80x24 terminal
    screen — if I have to scroll, I won't glance.
    planner: Banked: p95 under 50ms for done, the 5-days x 8-weeks
    self-trial evidenced by the store file, week view within one 80x24
    screen. [wrote § Success criteria; STATE → next stage: 3]

    planner: What will streak deliberately NOT do? Let me tempt you
    properly: phone notifications so you don't forget? Sync between
    laptop and desktop? A streak-freeze / vacation mode so one missed
    day doesn't break the chain? Sharing streaks with a friend for
    accountability?
    founder: No notifications — being nagged is why I resented every
    app. No sync service, no accounts, ever — if the file needs to be on
    another machine, that's my dotfiles' problem. No social anything.
    Vacation mode is tempting... but it's a lie I'd tell myself. Reject
    it.
    planner: Banked, including streak-freeze as explicitly rejected
    rather than parked — you rejected the concept, not the timing.
    [wrote § Non-goals; STATE → next stage: 4]

    planner: Constraints — deadline, budget, must-use tech, compliance,
    platform. Which are hard, and which are just preferences?
    founder: Honestly nothing comes to mind. You decide — skip this one.
    planner: Skipping doesn't leave a hole: I bank my own best
    assumptions marked [?] — open claims you can correct any time, never
    silently resolved. Banking four. [wrote § Hard constraints: [?]
    macOS+Linux POSIX only / [?] no deadline beyond the 8-week trial /
    [?] zero paid services / [?] store stays ONE hand-editable
    plain-text file; STATE → next stage: 5]

    ============ SIMULATED KILL — session ends mid-interview ============

    [resume — fresh pass, disk only] Read the tree: NORTH_STAR has
    Vision/Users/Success/Non-goals/Hard-constraints filled (constraints
    all [?]; a [?] bank IS a bank), Riskiest assumption still
    template-comment; docs/decisions/ EMPTY; docs/tasks/ empty; ROADMAP
    backbone still comment-only. Walking the banking map: stages 0-4
    present, stage 5 artifact (decisions/001-stack.md) MISSING → next
    stage: 5 (Q5 stack & why). Cross-check: STATE.md In-progress says
    "next stage: 5" — agreement; artifacts would win anyway. Nothing on
    disk re-asked; [?] items left standing.

    planner (resumed): Resuming from disk: stages 0-4 are banked — your
    constraints are my four [?] assumptions, correct them whenever. Next
    stage: 5. What stack do you want streak built in, and why?
    founder: Rust. I've been wanting to learn it, and everyone says CLIs
    in Rust are great.
    planner: pushing back: "wanting to learn it" and "everyone says" are
    habit and fashion, not rationale. Your banked criteria are 50ms and
    one plain-text file — a shell script meets those. What does Rust buy
    THIS product? And is learning Rust a goal of the project, or a
    private goal riding on it?
    founder: Fair. Two honest reasons. One: I want a single static
    binary I can drop in ~/bin with no runtime — Python or Node means
    version drift, which is exactly how my dotfiles rot. Two: yes,
    learning Rust is a personal goal this year, and I'll accept slower
    delivery for it. If that stalls the 8-week trial, that's a finding
    too.
    planner: That I can bank: static-binary distribution as the hard
    requirement, stdlib-only v1, and learning-Rust recorded as an
    accepted cost — so no future session "helpfully" rewrites it in Go.
    [wrote decisions/001-stack.md (context, four options incl. rejected
    shell/Python/Go, decision, consequences); seeded CONVENTIONS § Build
    & test with cargo build/test/clippy + two gotchas (stdlib-only is a
    decision not a convenience; store must survive hand-mangled lines);
    STATE → next stage: 6]

    planner: What single belief, if wrong, kills streak? And what's the
    cheapest, earliest test of it?
    founder: That I'll actually keep typing the command. No reminders
    means it runs on pure self-motivation.
    planner: Let me sharpen that into a testable belief: removing
    friction beats adding motivation — a sub-second, zero-ceremony log
    sustains the logging habit with no nagging at all. If that's false,
    streak is a beautifully fast tool nobody runs, and no feature can
    save it. Cheapest early test?
    founder: Use it myself the day milestone 1 exists — just done and
    week, nothing else, for two weeks before I'm allowed to build
    anything more.
    planner: Banked: the belief, the kill-condition, and a two-week
    bare-slice self-trial gating further work, feeding the 8-week
    criterion. [wrote § Riskiest assumption; STATE → next stage: 7]

    planner: The smallest thing that could ship and teach something —
    milestone 1 should feel too small. From everything banked, my
    proposal: `streak done <habit>` appending to the store, `streak
    week` reading it. No add, no edit, no rename, no stats, no colors,
    no config. Two commands, one file.
    founder: No `streak add` to register a habit first?
    planner: Deliberately not: the first done creates the habit
    implicitly. An add ceremony is friction, and friction is exactly
    what the riskiest assumption bets against. A typo'd habit name
    becomes one store line you fix by hand — the store is hand-editable
    by constraint.
    founder: Fine — it's my file. Ship it: done + week is milestone 1.
    It feels embarrassingly small, which you keep telling me is the
    point.
    planner: Banking the backbone in the order you experience it: log,
    then glance, then manage, then look back. [wrote ROADMAP § Backbone
    (F-01 Log / F-02 Week view / F-03 Habit management / F-04 History &
    stats) + Milestone 1 goal + Milestone 2 gated on the trial; Parked
    pre-seeded with undo/CSV/themes/month-view noticed during Q3/Q7
    (write-before-die; stage 8 completes Parked); STATE → next stage: 8]

    [stage 8 — decomposition, same session] Walked the backbone for
    milestone 1: F-01 implies the cargo project itself, the store
    format, done, idempotency, error paths, and malformed-line reality
    of a hand-editable file; F-02 implies the week render, a pinned week
    start, the empty state, non-TTY output, the one-screen cap.
    Deliberately out (→ Parked): undo, shell completions. Sliced:
    T-001 store+done (M, pri 1, unblocked), T-002 week view (M, pri 1,
    blocked_by T-001), T-003 malformed-store resilience (S, pri 2,
    blocked_by T-001; touches disjoint from T-002 so they may run in
    parallel post-T-001). EARS criteria written with at least one
    IF/THEN each; ban-words converted to numbers (50ms, 10,000-line
    store, 80x24, 20 rows, exit codes 0/1/2). ARCHITECTURE first draft:
    C-01 store, C-02 cli, mermaid map, Interfaces = store line format +
    store path ($HOME/.streak/log, $STREAK_FILE test seam) + Monday/ISO
    weeks + exit-code and stdout/stderr contract. STATE § Next up = the
    three cards.
    Self-review (decomposition step 8) caught, as a fresh executor:
    (1) no task created the cargo project — added T-001's init
    criterion; (2) "the week" had no defined start — pinned Monday in
    ARCHITECTURE Interfaces and referenced it from T-002.

    planner: The board: F-01 Log — [T-001 store + done, M] [T-003
    malformed-store resilience, S]. F-02 Week view — [T-002, M].
    Milestone-1 slice is all three; T-001 is the only day-one dispatch;
    T-002/T-003 unblock at its merge and can run in parallel (no touches
    overlap). Reject cards, not concepts — anything here you wouldn't
    pay for?
    founder: Could T-002 also show my longest streak per habit? Just one
    number per row.
    planner: That's F-04 reaching over the slice line — and the 2-week
    trial deliberately runs on the bare slice. It stays below the line;
    I'm parking "longest-streak column in week view" by name so it isn't
    lost.
    founder: OK. Board approved as-is.
    [ROADMAP § Parked += longest-streak column (founder ask at board
    review; F-04 candidate) + shell completions]

    [cold-start test] Fresh pass over docs/ only, explaining back:
    vision (one-command logging into one hand-editable file, zero
    ceremony), non-goals, the friction-beats-motivation bet and its
    2-week gate, stdlib-only-Rust static binary (ADR-001), state (no
    code yet — T-001 creates the crate), next dispatch T-001 because
    both other cards block on the store it creates. GAP FOUND on the
    walk: nothing stated the Rust edition/toolchain — a cold executor's
    real question at `cargo init`. Fixed: CONVENTIONS Build & test
    gained "current stable Rust, edition 2024; no MSRV promise in v1
    (added at cold-start test)". Repeat pass: no remaining unanswered
    executor question ([?] items are visible open claims — legal state,
    not gaps). PASS.

    [commit] git add -A; commit "Genesis: interview banked Q1-Q7,
    milestone 1 decomposed (T-001..T-003), board approved" → b18a33c.
    git status --ignored shows ".nputer/" ignored (!!) — the .gitignore
    criterion holds.

    [succession check] Every conversation-only decision verified on
    disk: implicit habit creation → ROADMAP F-01 line; learning-goal
    cost → ADR-001; board-review ask → Parked; skip assumptions → four
    [?] lines; trial gate → ROADMAP M2 + NORTH_STAR. Nothing existed
    only in the transcript. Session ends.

### Dry run — produced tree (13 files; docs .md total 343 lines)

    ./.gitignore                                  (".nputer/")
    ./.nputer/nputer.yaml                         (seeded from runtime/, gitignored)
    ./AGENTS.md                                   (adapter, name + one-liner filled)
    ./CLAUDE.md                                   (adapter, name + one-liner filled)
    ./docs/ARCHITECTURE.md
    ./docs/CONVENTIONS.md
    ./docs/NORTH_STAR.md
    ./docs/ROADMAP.md
    ./docs/STATE.md
    ./docs/decisions/001-stack.md
    ./docs/tasks/T-001-store-and-done.md
    ./docs/tasks/T-002-week-view.md
    ./docs/tasks/T-003-malformed-store-resilience.md
    git: one commit b18a33c on master

Key file contents follow verbatim (indented; complete enough for T-024
to land the tree as a fixture — these five plus the three tasks are
the tree's whole docs/ content except STATE.md, quoted in part, and
the two adapters, which are the kit adapters with name "streak" and
one-liner "A single-user CLI habit tracker: one command logs a habit,
one shows the week; plain-text store, no accounts." filled in).

docs/NORTH_STAR.md:

    # North star

    ## Vision
    A habit tracker that lives where its user already is: the terminal.
    Marking a habit done is one typed command with no account, no phone,
    no notification, no sync — and the record is a plain-text file the
    user owns. When streak succeeds, logging a habit costs less attention
    than sipping the coffee next to the keyboard.

    ## Users
    One concrete user: a developer who works in a terminal all day and has
    abandoned several phone habit apps. 7:40am, terminal already open,
    meditation just finished: they type `streak done meditation` and get
    on with work. Evenings, `streak week` for a one-glance check before
    closing the laptop. Single-user, local, personal.

    ## Success criteria
    1. `streak done <habit>` completes in under 50ms p95 on the founder's
       laptop (measured with `time`, warm filesystem) — logging never
       makes the user wait.
    2. The founder logs ≥ 5 days/week for 8 consecutive weeks, evidenced
       by the store file itself (the product's own data is the metric).
    3. `streak week` renders the whole week within one 80×24 terminal
       screen — a glance, never a scroll.

    ## Non-goals
    - No notifications or reminders, in any form — being nagged is why the
      phone apps were abandoned.
    - No sync service and no accounts, ever. The store is one plain-text
      file; moving it between machines is the user's dotfiles' problem.
    - No social features: no sharing, no accountability partners.
    - No streak-freeze / vacation mode — explicitly rejected at genesis
      ("a lie I'd tell myself"), not merely deferred.

    ## Riskiest assumption
    That removing friction beats adding motivation: a sub-second,
    zero-ceremony log is enough to sustain the logging habit with no
    reminders at all. If false, streak is a beautifully fast tool nobody
    runs — and no later feature can fix it. Early test (cheap): the
    founder self-trials the bare milestone-1 slice (`done` + `week`, nothing
    else) for 2 weeks starting the day it builds; only a surviving trial
    unlocks further milestones. Feeds success criterion 2's 8-week bar.

    ## Hard constraints
    <!-- Q4 was skipped at the interview; every line below is a planner
         assumption marked [?] — resolve or room, never silently delete. -->
    - [?] Platforms: macOS + Linux POSIX terminals. Windows is unpromised
      in v1 (the founding scene is a Unix terminal).
    - [?] No deadline; the only clock is success criterion 2's 8-week
      self-trial.
    - [?] Zero paid services or infrastructure — a local tool; the budget
      is the founder's spare time.
    - [?] The store remains ONE human-readable plain-text file that a user
      could edit by hand; no session may trade it for a database.

docs/ROADMAP.md:

    # Roadmap

    ## Backbone
    <!-- Features ordered as the USER experiences the product, left to right
         on the story map. Not build order. -->
    - F-01: Log — `streak done <habit>` appends one completion to the
      plain-text store; first use of a name creates the habit implicitly
    - F-02: Week view — `streak week` renders the current week in one
      80×24 glance
    - F-03: Habit management — rename and retire habits without hand-editing
    - F-04: History & stats — longest streak, month view, totals

    ## Milestones
    <!-- The slice lines. Everything in milestone 1 ships before anything in 2. -->

    ### Milestone 1 — the two commands (current)
    Goal: `streak done` + `streak week` on one plain-text store — the
    smallest slice that lets the 2-week riskiest-assumption self-trial
    start. Deliberately feels too small.
    Tasks: T-001 (store + done) → T-002 (week view), T-003 (malformed-store
    resilience); T-001 unblocked on day one.

    ### Milestone 2 — habit management
    Goal: rename/retire without hand-editing the store. Gated on the
    2-week self-trial surviving (NORTH_STAR riskiest assumption).

    ## Parked
    <!-- Ideas noticed but not committed. Reviewed at each /plan for the next
         milestone. This row is what protects the slice from scope creep. -->
    - `streak undo` (mis-logs are hand-edits for now)
    - CSV export
    - color/theme flags
    - month view beyond F-04's minimum
    - longest-streak column in week view (founder ask at board review; F-04 candidate)
    - shell completions

docs/ARCHITECTURE.md:

    # Architecture

    ## System map
    (mermaid graph TD: C02[C-02 cli] --> C01[C-01 store])

    ## Components

    | ID | Component | Responsibility | Depends on | Status |
    |----|-----------|----------------|------------|--------|
    | C-01 | store | append + parse the plain-text log | — | planned |
    | C-02 | cli | arg parsing, `done`/`week` subcommands, rendering | C-01 | planned |

    ## Interfaces
    - Store line format: `YYYY-MM-DD<TAB><habit>` + newline, one line per
      habit per date, append-only. Skipping of malformed lines is C-01's
      job alone (T-003) — C-02 never sees raw lines.
    - Store path: `$HOME/.streak/log`; `$STREAK_FILE` overrides when set
      (the test seam — no test touches the real store).
    - Weeks start Monday (ISO 8601). All date math is local time.
    - Exit codes: 0 success/empty, 1 I/O or encoding failure, 2 bad user
      input. stderr for diagnostics only; stdout is product output only.

    ## Related decisions
    - decisions/001-stack.md — Rust, stdlib-only, single static binary.

docs/decisions/001-stack.md:

    # ADR-001: Rust, stdlib-only, single static binary

    Date: 2026-08-16 / Status: accepted / Decided in: /plan interview Q5

    Context: streak needs a CLI that starts in under 50ms (success
    criterion 1), installs as a file dropped into ~/bin, and reads/writes
    one plain-text store. The founder's tooling history: runtime-dependent
    tools (Python, Node) rot with version drift in dotfiles.
    Options: shell script (rejected: week/date arithmetic and
    malformed-line handling become untestable string glue); Python/Node
    (rejected: requires a runtime on every machine, the exact drift the
    founder is escaping); Go (rejected only because it serves no learning
    goal, and motivation is part of this product's fuel); Rust (chosen).
    Decision: Rust, standard library only in v1 (no crates), compiled to a
    single static binary. Learning Rust is an acknowledged PERSONAL goal
    accepted at the cost of delivery speed — recorded so no session trades
    the language away to "go faster".
    Consequences: distribution = copy one binary, no packaging work in
    milestone 1; no crates so date/week logic is hand-rolled and must be
    unit-tested; slower founder velocity expected and accepted — if it
    endangers the 8-week self-trial, that is a signal to surface, not hide.

docs/CONVENTIONS.md:

    # Conventions

    ## Build & test
    - Toolchain: current stable Rust, edition 2024; no MSRV promise in v1
      (added at cold-start test — a fresh executor could not infer it).
    - `cargo build --release` — the binary ships from target/release/streak.
    - `cargo test` — unit + integration; the verifier runs this verbatim.
    - `cargo clippy -- -D warnings` — lint gate.

    ## Gotchas
    - v1 is stdlib-only (ADR-001): adding a crate — even for dates — is a
      decision, not a convenience. Open a room first.
    - The store is ONE hand-editable plain-text file (NORTH_STAR hard
      constraint [?]): any code touching it must survive lines a human
      mangled by hand.

docs/STATE.md (final): Updated 2026-08-16 by planner @dry-run; Just
completed = genesis banked incrementally, board approved, Q4 skipped
with four [?]; In progress = nothing; Next up = T-001 (unblocked),
T-002 + T-003 (unblock at T-001 merge, parallel-safe); Open questions
= the four [?] constraints await founder confirmation.

docs/tasks/T-002-week-view.md (the spot-check subject, verbatim; T-001
and T-003 are in the same format — T-001 carries crate init, store
append/create, $STREAK_FILE seam, same-day idempotency, the 10,000-line
50ms release-mode timing test, and IF-lines for tab/newline names (exit
2, write nothing) and unwritable store (exit 1, never a partial line);
T-003 carries skip-and-count semantics shared by done and week, CRLF +
trailing-blank tolerance, the exactly-one stderr summary line, and
non-UTF-8 → exit 1, never a panic):

    ---
    id: T-002
    title: "`streak week` — the one-glance week view"
    feature: F-02
    milestone: 1
    priority: 1
    size: M
    status: planned
    blocked_by: [T-001]
    touches: [C-02, src/week.rs, src/main.rs]
    builder:
    verifier:
    built_by:
    verified_by:
    review:
    ---

    ## Acceptance criteria
    - WHEN `streak week` runs THE system SHALL print one row per habit
      present in the store for the current week — columns Mon..Sun, `x`
      for done and `.` for not — followed by the habit name, using the
      store rules of ARCHITECTURE.md Interfaces (week starts Monday,
      ISO 8601).
    - THE full output SHALL fit one 80×24 terminal: up to 20 habit rows
      plus header; WHEN more habits exist THE system SHALL truncate and
      end with one `+N more` line.
    - WHEN the store is missing or empty THE system SHALL print
      `no habits yet — log one with: streak done <habit>` and exit 0.
    - THE output SHALL be plain ASCII with no ANSI escapes when stdout is
      not a TTY (deterministic in tests and pipes).
    - IF the terminal width cannot be detected THEN THE system SHALL
      assume 80 columns.
    - IF the store holds a date later than today inside the current week
      THEN THE system SHALL render it as done on that day and never
      panic (hand-edited files are legal input).

    ## Implementation notes
    ## Verdicts
    (both template-empty)

### Parse proof (criterion: zero issues)

Run from lib/parser on this branch (dist built via npm ci + npm run
build; suite green first — see Suites):

    node --input-type=module -e "import { parseProject } from './dist/index.js'; ..."
    → tasks: 3  T-001:planned:M  T-002:planned:M  T-003:planned:S
      features: 4  F-01:Log | F-02:Week view | F-03:Habit management | F-04:History & stats
      components: 0        (absent components dir — legal state)
      ISSUES: 0            → PARSE-PROOF-PASS

Bonus proof of the template amendment: a STAGE-0-ONLY tree (verbatim
docs-templates copy + empty dirs, nothing banked) parses with 0 issues
AND 0 features — the pre-amendment template would have produced two
phantom `<feature name>` records from its example bullets.

### Dispatchability spot-check (written; subject: produced T-002)

The test (decomposition.md): a fresh session with NO other context
reads the task file + docs/ and builds the right thing without asking
a single question. Walk of every question a fresh executor could ask:

1. Does a project to build in exist? → blocked_by [T-001], and T-001's
   first criterion creates the crate; CONVENTIONS pins toolchain +
   edition. No question.
2. Where is the store, what format, who filters garbage lines? →
   criterion 1 points at ARCHITECTURE.md Interfaces: path
   ($HOME/.streak/log, $STREAK_FILE seam), line format
   (YYYY-MM-DD<TAB>habit), malformed-line skipping owned by C-01. No
   question.
3. What is "the week"? → Monday start, ISO 8601, local time — pinned
   in Interfaces and restated in criterion 1. No question.
4. Exact empty-state behavior? → the literal string and exit 0 are in
   the criterion. No question.
5. Overflow? → 20 rows + `+N more` + one 80×24 screen: numbers, not
   adjectives. No question.
6. How do tests stay deterministic? → non-TTY = plain ASCII criterion
   + the $STREAK_FILE seam. No question.
7. Unhappy paths? → two IF/THEN lines (width undetectable → 80;
   future dates → render, never panic). Present as required.
8. Which commands must pass? → CONVENTIONS Build & test (cargo test /
   clippy / build). No question.
   VERDICT: PASS — zero unresolved questions; every criterion maps to
   a mechanical check a verifier can run with the CONVENTIONS commands.

### Resume exercise (criterion: exercised once)

Kill simulated after stage 4's bank (mid-interview). Fresh pass read
ONLY the tree: walked the banking map top-down — stages 0-4 artifacts
present ([?] banks count as banks), stage 5's decisions/001-stack.md
missing → stated "next stage: 5 (Q5 stack & why)" and continued there.
STATE.md's hint agreed; precedence rule (artifacts win) documented in
planner.md and did not need to arbitrate. Nothing already on disk was
re-asked; the [?] constraints stayed standing. Full detail in the
transcript above.

### Suites

- lib/parser (this branch, from lib/parser/): npm ci + npm run build
  clean; npx vitest run = 132/132 green BEFORE kit changes and re-run
  green AFTER the docs/CONVENTIONS.md edit and again after this notes
  append + suggestion file (the smoke test parses the live repo docs/
  tree — these notes are deliberately fence-free). NOTE: dispatch
  brief said 153/153; the branch point (main at 3c468fd) yields
  132/132 — T-019's additions are not merged yet, matching the
  brief's own "whatever main gave you at branch, keep green".
- app/ + cargo: UNTOUCHED — zero diff outside method/**,
  docs/CONVENTIONS.md, docs/tasks/T-023-* (verified with git status
  before finishing).

### Version locations touched

- docs/CONVENTIONS.md: "currently v0.1.4" → "currently v0.1.5" (the
  standing gotcha location) + the new (v0.1.5, T-023) gotcha bullet.
- No other file carries the method version string (grepped).

### For the INTEGRATOR (not done here, per dispatch)

- ARCHITECTURE.md C-01 (method) status cell is YOURS at merge — this
  branch deliberately does not touch ARCHITECTURE.md.
- No *.ts/tsx/js/jsx changed outside docs/ → the T-009-s1 standing
  graph-regen practice is NOT triggered by this merge (docs/method
  only). graph.json untouched here.
- The dry-run tree lives in session scratch (losable by design); its
  full content is preserved above — T-024 lands it as a fixture from
  these notes, per its acceptance criteria.

### @human (listed explicitly, per Verification)

- The dry-run transcript's conversational quality — did the two
  "pushing back:" challenges actually challenge (Q2 adjectives, Q5
  habit-stack), was the skip handling honest — is yours to judge; the
  founder was scripted in-session by the builder (stated limitation).
- A true cold-context run (separate terminal, different model, only
  the kit) remains the strongest future evidence; T-026/T-029 will
  produce it in-product.

## Verdicts
