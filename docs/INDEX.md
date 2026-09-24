# Index

<!-- GENERATED — do not edit by hand (T-293, ADR-024 decision 2).
     Regenerate:  npm run capabilities   (from tools/e2e/ — the same
                  command that regenerates the behaviour census)
     Currency:    npm run lint:docs      (the docs gate reds while the
                  committed index is stale against the documents below)
     Source: each document's own first heading, the sentence its
     opening paragraph uses to say what it is, and its section
     headings. No line here is typed by hand, so a line is false only
     while this file is stale — and stale is what the gate refuses. -->

The standing read is docs/STATE.md and this file. Everything else
reaches a seat through its brief's context pack.

**WHEN THE PACK DID NOT HAND YOU THE RULE, YOU HAVE TWO MOVES AND
NEITHER IS GUESSING.** Write the ask file your lane names
(`<scratch>/ask-<card id>.md`), park it and keep building; or open the
document below AT THE SECTION its line names and read that section.
An architect session once spent a working day rebuilding a belief
about `blocked_by` that the roadmap's own F-06 entry would have
corrected in a sentence (T-138).

What opening one COSTS is a measurement, not a figure kept here:
`wc -c` the paths below.

- **Roadmap** (`docs/ROADMAP.md`) — The contract: one present-tense paragraph per feature — capability now, what is next, card ids — and at most one new sentence per feature per merge, absorbed into the paragraph at the next edit. **Open it at:** Backbone · Milestones · Parked
- **Architecture** (`docs/ARCHITECTURE.md`) — The contract: which components exist, what each owns, the interface rules — one paragraph each, card ids carrying the stories. **Open it at:** System map · Components · Interfaces · Related decisions
- **Conventions** (`docs/CONVENTIONS.md`) — THE INDEX OF THIS PROJECT'S RULES, and the rules themselves are the chapters under docs/conventions/ that every line below names. **Open it at:** Build & test · Gotchas
  - **Commands, packages and CI** (`docs/conventions/commands.md`) — Every command this repository publishes, the package it runs from, the order a fresh clone builds in, and the workflow that invokes exactly these. **Open it at:** Fresh-clone ORDER · lib/parser · app/ · app/src-tauri · tools/e2e · `npx supertaskr <verb>` · +2 more
  - **The gate runner, the token and the push** (`docs/conventions/gates-and-the-push.md`) — The one spelling for a graded reading, the token it mints, what a push owes, and how the push itself is judged. **Open it at:** AUDIT GATE POLICY · THE BLESSED GATE-RUNNER · AND IT NOW MINTS A TOKEN THAT GATES YOUR PUSH · AND SINCE T-280 A PUSH OWES THE SET ITS OWN RANGE OWES, NOT THE BATTERY BY DEFAULT · THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314, AND THE BYPASS THAT LEAVES IS CLOSED BY PROCEDURE · A PUSH NO LONGER CANCELS THE RUNNING CI JOB (T-294), AND NOBODY WAITS ON IT · +1 more
  - **The shell, the scripts and the figures a script writes** (`docs/conventions/shell-and-scripts.md`) — The dialects this machine actually has, the way an edit script must be run, and why a line number is never a citation. **Open it at:** AN EDIT SCRIPT'S SUCCESS IS A GATE, NOT A STEP · A GATE READ THROUGH A PIPE REPORTS THE PIPE · PASS THE DOCS GATE SEPARATE LITERAL PATHS · A LINE NUMBER IS A FIGURE · AND A DISTANCE TO A MOVING TIP CANNOT BE STATED AT ALL IN A DOCUMENT COMMITTED TO THAT TIP'S BRANCH · THIS SHELL'S `grep` IS A SHIM · +4 more
  - **Dispatch, ports, scratch files and the bench** (`docs/conventions/dispatch-and-scratch.md`) — The serial ritual, the port and filename a lane derives, the verifier's two spawns, and who proposes before recording. **Open it at:** THE DISPATCH RITUAL IS SERIAL: cut ONE worktree, arm it, READ THE MANIFEST BACK, then cut the next · E2E PORT — DERIVE IT PER LANE: `SUPERTASKR_E2E_PORT=15000+<card number>` · SCRATCH RULE — NAME EVERY SCRATCH FILE FOR THE LANE THAT OWNS IT · THE VERIFIER'S BENCH IS TWO SPAWNS, AND THIS BULLET IS THE SPELLING, NEVER THE SHAPE · THE SEAT PROPOSES BEFORE IT RECORDS, AND THIS BULLET IS THE POINTER, NEVER THE RULE · PORT RULE · +1 more
  - **The records, the rooms and the process settings** (`docs/conventions/records-and-rooms.md`) — Who holds the merge gate, what the arm does and what the seat rules, how a wait and a run record are spelled, and where every switch is declared. **Open it at:** [?] marks an unresolved claim · THE MERGE INTO MAIN IS @human'S GATE, BY DESIGN AND NOT BY ACCIDENT · THE ARM MERGES, AND THE SEAT RULES · BOUNDED WAITS, IN THIS PROJECT'S OWN SPELLING · THE RUN RECORD, IN THIS PROJECT'S OWN SPELLING · THE PROCESS IS SETTINGS, AND EVERY SWITCH IS DECLARED ONCE
  - **Components, slugs, walks and citations** (`docs/conventions/architecture.md`) — Declaring a component, the shipped partition, the four walks over this tree, the guard classes, and what a citation names. **Open it at:** GUARD-CLASS PATHS, IN THIS PROJECT'S OWN SPELLING · A CITATION NAMES A SYMBOL, NOT A LINE · This project was planned in a long chat session before the folder existed; the chat is NOT the record · DECLARING A COMPONENT moves THREE live-registry fixtures, not two · THE SHIPPED PARTITION, IN SLUGS · THE FOUR WALKS
  - **The app, the UI and the genesis kit** (`docs/conventions/app-and-ui.md`) — Tauri's serve-time behaviour, the token rule, dismissal listeners, render-phase stamps, and the ratified kit and triage encodings. **Open it at:** Tauri v2 applies the CSP · Tauri capability grants compile to code, not strings · UI work adds tokens to app/src/styles/tokens.css, never Tailwind defaults or arbitrary values · Suggestion-triage encoding is ratified in method/tasks/TASK-FORMAT.md · The genesis kit is ratified in method/roles/planner.md + method/interview/plan-interview.md · Outside-click/dismissal listeners must decide on pointerdown, never click · +1 more
  - **The merge: which range, which regeneration, which reading** (`docs/conventions/merging.md`) — The pair of commits a merge's diff means, the graph regeneration it owes, the bands read at the checkpoint, and the subject the checkpoint commit opens with. **Open it at:** THE RANGE RULE · GRAPH REGEN · HEALTH BANDS AT THE CHECKPOINT · THE CHECKPOINT COMMIT'S SUBJECT OPENS WITH `Checkpoint:`
  - **Lanes: the protocol, the shared checkout and the base** (`docs/conventions/lanes.md`) — The lane spellings this project publishes, the checkout a human is running the app in, and the commit a lane is cut from. **Open it at:** THE LANE PROTOCOL · THE MAIN CHECKOUT IS SHARED WITH A HUMAN RUNNING THE APP, AND THE PIPELINE HAS KILLED IT THERE · DISPATCH FROM THE LAST CHECKPOINT, never from a merge commit
  - **The standing gates with a merge-diff trigger** (`docs/conventions/standing-gates.md`) — The boot gate, the docs gate and the method eval gate: what fires each, what it runs, and what it records. **Open it at:** BOOT GATE · DOCS GATE · METHOD EVAL GATE
  - **Verification: drills, controls and honest scope** (`docs/conventions/verification.md`) — The poison drill, the sweep a fix owes, the control a negative assertion needs, the guard lifted to discriminate, and what the e2e lane really covers. **Open it at:** POISON DRILL · A FIX NAMES ITS CLASS AND ITS SWEEP, OR RECORDS THAT NONE WAS RUN · A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL · LIFTING A SAFETY GUARD TO DISCRIMINATE · THE E2E LANE'S HONEST SCOPE
- **Capabilities** (`docs/CAPABILITIES.md`) — What this app does, one sentence per behaviour the e2e suite runs. **Open it at:** accelerators · blocker-retarget · boot-check-guard · brief-flush · brief · card-figures · +38 more
