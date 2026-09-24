# The records, the rooms and the process settings

Who holds the merge gate, what the arm does and what the seat rules, how a wait and a run record are spelled, and where every switch is declared.

This file is one chapter of docs/CONVENTIONS.md, which is the INDEX:
it carries every bullet's opener verbatim beside the file the bullet
lives in. A program that reads a rule out of this document reads the
INDEX AND ITS CHAPTERS AS ONE TEXT — `conventionsText` in
tools/e2e/scripts/docs-scan.mjs assembles it, and the same assembly in
Rust is in app/src-tauri/src/dispatch/brief.rs. Never edit a bullet
here without asking what reads it.

- [?] marks an unresolved claim (archaeology convention) — resolve or
  room it; never silently delete.

- THE MERGE INTO MAIN IS @human'S GATE, BY DESIGN AND NOT BY ACCIDENT
  (ADR-020 decision 4, ratifying what T-145's denial discovered). A
  session's `git merge` into the integration branch is EXPECTED to be
  refused by the permission layer; the refusal is the gate working,
  and the route is @human performs the merge. No workaround is
  legitimate — `commit-tree`/`update-ref` bypass the gate's intent —
  and the rule is the T-145 executor's own sentence: a coordinator's
  authorization is not the permission system's consent. Ordinary
  commits at @human's explicit direction are not merges and do not
  contend with this gate.

- THE ARM MERGES, AND THE SEAT RULES (T-295, ADR-024 decisions 3 and 4):
  `node tools/e2e/scripts/brief.mjs --merge <T-NNN>` is the ONE spelling
  for the integrator's ritual, and it performs the steps in this order
  with every step's exit printed: the fence WIDENED on the integration
  branch for any spec the newest verdict's MUTANT BLOCKs name that the
  card does not already admit (its own commit, ahead of the merge,
  because the landing gate reads a merge's fence from its FIRST PARENT
  — T-281-s10); the lane branch moved to the BENCH TIP, which is the
  detached `-V-<id>` worktree's HEAD and NOT the verdict sha, since the
  verifier commits its correction bodies after writing the verdict;
  `git merge --no-ff --no-commit`; the conflicts, which get exactly
  three answers and no fourth — this card's own file taken from the
  LANE, a single end-of-file append whose MERGE BASE is empty kept from
  both sides with the closing restored, and everything else NAMED as a
  fence finding and stopped, never resolved; the `done` stamp; each
  assigned correction applied as the block's `old` text where the tree
  carries its `new`; the four cheap keepers; the method stamp when
  method text moved; the census and the graph AFTER the corrections and
  never before; the docs gate, whose FIRES is NEWS and whose STALE
  stops; the re-drill of every block, scoped by the FIX DIFF — the
  block's own spec, with the specs the fix diff OWNS derived and READ
  (a block whose spec is not among them pins a property the correction
  did not move, which is said), and `--drill-wide` to run that whole
  owning set instead: the stronger RED ALONE claim, priced at eight
  minutes for one block over thirteen specs against a ritual whose
  target is five; the counts graded against the ones the verdict claims; the
  message written FROM the verdict's own sentences; and the `## Meters`
  blocks appended to `docs/checkpoints/meters.jsonl`, one JSON object
  per line carrying the card, its size, its tier, the seat, the source,
  the merge and the block's own text whole. **IT STOPS WITH THE MERGE
  STAGED AND IT NEVER PUSHES**: the commit, the checkpoint and the push
  stay the seat's, and a step it refuses is the seat's to rule rather
  than the verb's to work around. Every dial is DERIVED — the lane
  branch off `git for-each-ref`, the worktree off `git worktree list`
  and never off this document's spelling (a lane cut before a rename
  was not found by a script that read the bullet), the seats off the
  card's own fields — so the seat types one card id. **THE FOUR CHEAP
  KEEPERS, each a step with its own exit**: a line this merge REMOVES
  under `method/` or `docs/` that a spec pins VERBATIM (thirty
  characters is the floor); a line it ADDS carrying a forbidden
  spelling — the rename scanner's own classifier, a secret shape, an
  email address, this machine's home directory, or the seat's whole
  account or git name; an `XS` card whose diff outside its own card file
  exceeds FORTY changed lines (the bound is stated here so the tier work
  has something to read, and it is a number to be moved by measurement);
  and the card's own `--preflight`.
  **AND SINCE T-296 THE XS-BOUND KEEPER BUMPS RATHER THAN REFUSES.** Its
  subject is a MIS-SIZING and not a defect — the card was classified
  `bounded` before the work existed and the work turned out bigger, and
  nothing about the merged tree is wrong — so the step passes, says the
  card is bumped, and the reading appended to the bands carries
  `standard` rather than the tier the dispatch stamped.
  The other three still refuse, and a card of any other size is
  still not this keeper's to judge.
  **AND SINCE T-295-s4 THE FORBIDDEN-SPELLING KEEPER CLASSIFIES A
  SYNTHETIC FIXTURE**, on the rename class's own model and bounded by
  that card's amendment of 2026-09-13.
  THE
  RECOGNITION RULE: a matched value is kept only where `FIXTURE_CLASSES`
  in that file names BOTH the value — by an anchored pattern, a literal
  and never a shape — AND the site it may sit at, a `files` token ending
  in `/` being a directory and the rest whole paths. A spec filename, a
  comment calling something a fixture and placement in a test directory
  qualify NOTHING on their own, so an arbitrary credential-shaped value
  is refused in exactly the file whose one enumerated credential is kept;
  an address entry is admissible only at a domain the standards reserve
  for documentation and testing; and no entry covers the home or name
  classes, whose values are DERIVED FROM THE LIVE MACHINE rather than
  from a shape, so a home path stays forbidden. The exception is PER
  MATCHED VALUE AND PER CLASS — keeping one synthetic instance suppresses
  nothing else on the same line, in the same block or in the same file —
  and **every use is announced**, on the step's own output and in the
  spelling an acknowledged drill uses: a kept spelling is news, never
  silence.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/08-landing.md (T-290), verbatim.

- BOUNDED WAITS, IN THIS PROJECT'S OWN SPELLING (T-298, ADR-024's room
  decision G): `method/roles/orchestrator.md` 5f states the rule — every
  wait is on a FACT with a CEILING and a hand-typed sleep is not a wait —
  and this bullet carries the command. From the repository root:

      node tools/e2e/scripts/brief.mjs --await <marker path> --ceiling <seconds>
      node tools/e2e/scripts/brief.mjs --await-pid <pid> --ceiling <seconds>

  Exits, read unpiped in the T-298 lane: 0 when the fact happened; 1 when
  the ceiling was reached and REPORTED (what it waited for, how long, how
  many asks, and that nothing was signalled or taken away); 2 for every
  usage refusal — no ceiling, no fact, two facts, a ceiling of zero or one
  that is not a number, the process group or the broadcast pid, and any
  attempt to share the invocation with another arm. The arm's own child
  processes carry no ceiling yet (T-298-s2).

- THE RUN RECORD, IN THIS PROJECT'S OWN SPELLING (T-311, ADR-025
  decision 1): `method/lane-protocol.md` states the contract — every
  child runs under one record, only a writer takes its resource's
  exclusive reservation, and an uncertain record is reconciled before
  anything replaces it — and this bullet carries the spellings that file
  leaves to a project. Records live under `.supertaskr/runs/<work>/<attempt
  id>.json` in the checkout the SEAT holds, and the writer reservations
  under `.supertaskr/runs/reservations/`, one file per resource, behind the
  same self-ignoring `.gitignore` as the fence manifest and the holder
  record — so a record is never a commit. An attempt id is `<work>-a<n>`
  and carries its own work, which is why the verbs need no second flag to
  find a record. From the repository root:

      node tools/e2e/scripts/brief.mjs --run start --assignment <path>
      node tools/e2e/scripts/brief.mjs --run bind --attempt <id> --session <harness id> [--pid <n>]
      node tools/e2e/scripts/brief.mjs --run observe|send|wait|collect|continue|stop --attempt <id>

  **THE ASSIGNMENT IS A DOCUMENT AND EVERY FIELD IS REQUIRED**, with the
  word `none` a legal value for the resource, the deadline and the budget
  and a MISSING field a refusal that names it: the work and its kind, the
  role, the resource, the harness, the model, the effort, the base ref,
  the brief, the working directory, the deadline and the authorized
  budget. The permission boundary and the ask file are DERIVED — from the
  fence manifest in the working directory and from the brief's own
  directory — because a boundary somebody typed is a claim about a
  manifest the write hook will read anyway. Exits, read unpiped: 0 when
  the operation was performed; 1 when it was REFUSED by the world (the
  resource already reserved, a prior execution that might still be
  running, a collect before the state is terminal, a wait that reached
  its ceiling), each naming a greppable code; 2 for every usage refusal.
  **THE GRAMMAR IS ONE GRAMMAR FOR BOTH KINDS OF CHILD**: `RUN-ASK <id>`,
  `RUN-ACK <id>` and `RUN-DONE ok|failed|gone`, written by a process child
  into its ask file and arriving for a native child in the harness's own
  output, which the seat hands to `--run observe --evidence`. `gone` is
  the honest third value — the execution is not there any more and what
  the assignment did is `unknown`.

  **THE NATIVE DESKTOP BRIDGE USES THAT RUN RECORD AS ITS ONLY AUTHORITY**
  (T-315-s1): an assignment whose harness is `codex-desktop-native` also
  carries `native.taskName`, `native.sessionId`,
  `native.coordinatorTurnId` and an explicit `native.ignoredOutputs` array.
  Start admits the approved card, full base commit, canonical fence, model
  and effort, then takes T-311's exclusive writer reservation before native
  spawn. User-prompt callbacks extend the exact coordinator session/turn
  continuity. A `SubagentStart` callback records the pending `agent_id`; the
  child may then run exactly `/usr/bin/printenv CODEX_THREAD_ID`, and bind
  closes only when the callback id, completed probe value, start turn and
  canonical task name all agree:

      node tools/e2e/scripts/brief.mjs --run bind --attempt <id> \
        --session <agent_id> --task-name <canonical task name> \
        --reported-thread-id <CODEX_THREAD_ID> --start-turn-id <turn_id>

  PreToolUse persists an inflight operation only after exact native routing,
  explicit resource naming and a cumulative clean check. PostToolUse must
  match that agent, turn, tool and tool-use id, then records the actual
  completion and repeats the cumulative check. A Post without its Pre, a
  checker error, unsupported mandatory event, unreadable authority or a
  path outside the fence persists a hold; no callback success is a terminal
  run state. SubagentStop and Interrupt are observations only.

  Before native collect or continue, the arm requires `--ref <full commit>`
  and independently checks that exact HEAD plus staged, unstaged, untracked
  and governed ignored residue. T-311 must separately establish that the
  native execution ended and every registered owned job is gone. An
  operation whose Post callback never arrived remains an
  `actualPostCallback: false`, `outcome: unknown` receipt; only that T-311
  reconciliation may clear its hold. Until these facts agree, collect,
  continue and writer-reservation release refuse while preserving the
  candidate.

- THE PROCESS IS SETTINGS, AND EVERY SWITCH IS DECLARED ONCE (T-299,
  ADR-024 decision 6): `method/runtime/process-schema.yaml` is the ONE
  source. It declares each step of the loop as a SWITCH with what it
  does, how it changes the loop, which arm symbol reads it, what it needs
  on, whether it may be turned off, which band measures it, what this
  project measured it to cost, and its value under each of the three
  profiles — `guarded-everything` (the ceremony as it stood on
  2026-09-09), `standard` (what the ADR ruled) and `fast`. The runtime
  template's `process:` section names which profile this project runs,
  which profiles exist, and the switches it DEPARTS from; it carries no
  explanation of its own, because a second copy is a copy that goes
  stale. **THE ARM READS IT AT DISPATCH AND AT MERGE**: the tier rules,
  the phase-1 spawn, the whole-suite net, the regenerations' place, the
  cheap keepers and the model per role all branch on a switch, and a
  combination the schema's constraints forbid REFUSES the dispatch and
  the merge naming both switches and both values. **THE FLOOR IS NOT
  REFINABLE** — the fence and its write hook, the card preflight at
  dispatch, the owed-set token and the push guard, the landing gate, the
  docs gate, the method stamp and its eval gate, records never rewritten,
  the template's own roles block, a verifier that reads the diff before
  the notes, and the checkpoint: an override that turns one off is
  refused by name. **KEPT BY A BODY, NOT BY A MEMORY**: the e2e suite
  parses the schema with a real YAML library and requires that reading to
  agree with the arm's hand parser, derives each switch's read site from
  the arm's own source rather than from a table, and reds per switch when
  the arm stops reading it. **AND SINCE T-317 THE READER ITSELF IS THE
  PARSER LIBRARY'S** — `lib/parser/src/process-settings.ts`, exported
  through the browser-safe entry `@supertaskr/parser/pure`, with the arm
  importing it and re-exporting every symbol unchanged — so the terminal
  command, the app's settings screen and the skill render ONE
  implementation rather than a spelling each, and the app can render it
  at all. **AND SINCE T-299-s6 EVERY ROW SAYS WHAT MAKES IT TRUE**, in an
  `implementation:` field that is one of three words, because the
  `reads:` field answers a narrower question than a reader of a settings
  screen is asking and `processLedger` there reads as *"nothing"*.
  `operational` means the arm reads the row and branches on it, and the
  label is EARNED: the lane that assigns it shows a body that CHANGES the
  value and watches the arm answer differently, with every value of the
  row erased from the answers before they are compared — a read site
  shows the value is read, and a surface printing the value back shows
  less than that. `manual` means a person or a seat performs what the row
  names, and the row carries that instruction in a non-empty
  `manualAction:`. `declarative` means the row is a RECORD rather than a
  control: nothing reads its value and no instruction is addressed to a
  seat by it, so editing it alone changes nothing — **AND IT DOES NOT
  MEAN THE BEHAVIOUR IS ABSENT.**
  The parser refuses a missing or unknown
  label, an empty action on a manual row and an action on a row that is
  not manual; `supertaskr settings` shows the label beside the value and
  the action beside a manual one, REFUSES a `set` naming a declarative
  row with the finding code `declarative` at the exit its other refusals
  already take, and the generated chapter carries both. **AN UNRESOLVED
  CLASSIFICATION IS A FINDING AND NEVER A `declarative`**: the label is
  what a reader trusts when deciding whether editing a row is worth
  anything, and a row filed under it to end an argument is the one way
  this field can be worse than the absence it replaced. **AND SINCE
  T-319 THE DISPATCH APPROVAL LIVES IN THE TEMPLATE TOO, AS ONE BLOCK.**
  Where the record
  lives: `dispatch:` in `method/runtime/supertaskr.yaml`, declared once
  as the schema's own `dispatch_block:` section beside the switches and
  read by the parser library's `dispatchBlock` as ONE typed value — so
  the tracked record the arm reads is the template itself rather than a
  record class beside it, and a fresh seat in either harness inherits the
  approval from a file instead of from a checkpoint's prose. The block
  carries `approval` (each, until a named card, standing), `recovery`
  (none, or the repairs necessary to the approved work — a policy of its
  own, valid under every mode), and a `grant` naming who gave it, when,
  its revision, the approved cards in dispatch order and each card's blob
  sha at approval; `revoked`, `limits` and `history` are the rest.
  **HOW A GRANT CHANGES: BY A DATED EDIT AND NEVER BY A REWRITE.** A
  grant, a pause or a revocation appends the previous grant to `history:`
  and RAISES the revision, proposed verbatim and approved on the owner's
  yes as any decision entry is (T-307), and **which grant is current is
  decided by that revision and never by a date** — two grants at one
  revision are refused, because a date cannot break that tie. The reader
  answers a NAMED refusal and never a partial value: an unknown field, a
  duplicate YAML key, an `until` with no card or a card outside the
  order, an order and a cards map that disagree, a malformed sha or
  instant, a non-positive revision, two grants at one revision, a history
  not wholly below the current. It validates the sequence it is GIVEN and
  attributes each grant to its recorded `given_by`; it promises no tamper
  prevention from an integer. **THIS PROJECT CARRIES NO BLOCK**, and the
  reader says so in as many words — approval each, recovery none, no
  grant, revision 0 — because no grant is ever created by guessing a
  person, an instant or a past authorization; an existing authorized way
  of working reaches the template only through a migration grant the seat
  proposes verbatim and the owner approves. **AND SINCE T-324 THE BLOCK
  IS OPERATIONAL: EVERY ADMISSION THE ARM MAKES IS BOUND TO THE GRANT'S
  REVISION, THE CARD'S APPROVED BLOB AND THE ATTEMPT'S RESERVATION.**
  Four boundaries admit work — the lane cut (`--dispatch-lane`), a child
  start (`--run start`), a re-entry (`--run continue`) and a replacement
  writer (`--run continue --replace`) — and the grant is RE-READ at each,
  because an approval read once at the cut is one a revocation four hours
  later cannot reach. An admission is EXPLICIT (a card the grant names,
  bound to the grant's revision and to the card's approved blob, with the
  loop's own mechanical appends allowed: a status or tier stamp, a notes,
  verdicts or repair-ledger append, a filed follow-up line — anything else is a
  different card and refuses) or DERIVED (a repair the recovery policy
  allows, bound to its parent authorized work, the failure evidence, the
  PARENT grant's revision and its own blob at filing; it inherits that
  authorization and mints no grant, a repair's description establishes
  nothing, a repeated delivery event produces no duplicate repair, and a
  scope change re-evaluates it). The modes are enforced at those
  boundaries: `each` spends a card's own approval ONCE and refuses it
  presented again; `until` admits the prefix up to and including the
  endpoint and refuses the next card BY NAME, a parked endpoint being no
  more a delivered one than an undone card is; `standing` admits until a
  pause is recorded. `recovery: none` refuses a derived admission by name
  and records it as needing its own explicit approval; `recovery:
  repairs` admits a repair of approved work and never a product-scope
  change or a waived verification. **THE ADMISSION COMES BEFORE THE
  RESERVATION**, on the same argument that puts the reservation before
  the launch: a lock taken for work nobody admitted is a writer this loop
  had no authority to start. **THE LEDGER IS THE RUN RECORDS AND THERE IS
  NO SECOND ONE**: each record carries the admission it was started
  under, so what has been consumed is derived from `.supertaskr/runs/`
  rather than from a table beside it, and a retry of an interrupted
  admission RE-PRESENTS it rather than spending a second approval. **A
  PAUSE IS A RECORD IN THE RUNTIME DIRECTORY, NOT A ROW OF THE BLOCK**
  (T-324, and T-324-s1 is the card that would move it): the owner writes
  `.supertaskr/pause.json` — `version`, `at`, `by`, `scope` (`new-work`
  or `all`) and an optional `why` — beside T-238's holder record, ONE
  reader reads it (`readPause`), a record this reader cannot parse
  REFUSES rather than reading as silence, and the block itself is read
  through the parser's reader and through nothing else.
  Under `new-work` every new implementation attempt and re-entry
  is refused while the verification and integration of a candidate
  already admitted may start and finish; under `all` every further phase
  stops at its declared safe boundary — an executor at its stamp, a
  verifier at its verdict, a staged merge finished or aborted as the
  record says. An IMMEDIATE stop is a separate request through the
  applicable stopping mechanism and never a reading of the grant. **THE
  `limits` ROWS STAY ADVISORY AND THIS CARD DOES NOT ENFORCE THEM**: they
  are read and REPORTED BY NAME as advisory and unenforced, their absence
  imposes no ceiling, an expiry that has passed refuses nothing, and
  enforcement is deferred to a later card so that no control silently
  does nothing. **A SUCCESSOR COORDINATOR INHERITS THE GRANT FROM THE
  BLOCK** (T-238's seat): the same revision, the same order, the same
  blobs, continuing the order without the previous coordinator's
  identity, which is no part of an approval. **AND THE ARM'S REPORT KEEPS
  THREE THINGS APART** — the refusals it TESTED, the coordinator's
  obligations it CANNOT check (scope interpretation, an unreported
  integrity problem, a provider's live usage) and the advisory
  accounting — because a list that mixed them would let the second and
  the third borrow the first's authority. The switch inventory the schema
  was built from — every row with its old and ruled value, its measured
  cost and its constraint — is in `docs/rooms/loop-cost-and-speed.md`.
  **AND SINCE T-322 THE LOOP KEEPS WORKING WHILE THE OWNER IS AWAY.**
  `method/roles/orchestrator.md` 5g states the rules — attribute a red
  or a rejection before acting and record it; continue a repair on
  evidence and park it with a wake condition otherwise; check the shared
  conditions against the ACTION proposed; write a question entry rather
  than stop; treat a quota refusal as a recorded retry instant — and
  this bullet carries the two spellings and the one operational rule
  that is this machine's rather than the method's. From the repository
  root:

      node tools/e2e/scripts/brief.mjs --since <ISO instant>
      node tools/e2e/scripts/brief.mjs --await-until <ISO instant> --ceiling <seconds>

  The first is the return brief and the reds in its window attributed;
  the second is the wait verb's until-instant form, the same loop, the
  same interval and the same ceiling report as the marker and the pid.
  A question entry lives in `docs/rooms/`, a repair ledger under
  `## Repair ledger` on the failing card, and a refusal with its retry
  instant on the run record — three records that already existed, and
  no fourth. **THE HOST MUST STAY AWAKE OR THERE IS NO LOOP**: this
  pipeline runs on the owner's own machine, a sleeping Mac stops every
  seat mid-turn, and the seat holds the host awake for the span it
  expects to need — `caffeinate -i -t <seconds>` beside the app's own
  keep-awake request, both for the night on 2026-09-14. **DERIVE
  WHETHER IT IS HELD, NEVER ASSUME IT**: `pmset -g assertions` names
  every holder, and an idle-sleep assertion nobody holds is a loop that
  will stop at the first idle window rather than at a boundary.
  The history, the measurements and the argument this rule was cut
  from are in docs/reference/16-the-repository.md (T-290), verbatim.
