# Roadmap

## Backbone (revised per ADR-008 — app-first)
- F-01: Method — the convention itself (method/), usable by hand
- F-02: App shell + board — Tauri app, read-only story map rendered
  beautifully from files
- F-03: In-app genesis — planning interview as split view (planner
  chat + board materializing live); archaeology variant
- F-04: Dispatch — worktrees, model@session, verify/merge, from the
  board; CLI as plumbing/power path
- F-05: Rooms, sessions & daemon — @mention routing, resolutions,
  registry pane
- F-06: Architecture map — intent + reality overlaid, drift as a
  first-class signal (docs/design/map-technical-plan.md, ADR-013/014/
  015; added 2026-08-15, sequencing open in rooms/map-sequencing.md).
  Since T-034 the pane is TWO lenses behind one control, and the
  second is not about architecture at all: the tasks lens lays the
  board's cards out in dependency waves over `blocked_by`, with a
  critical path (the longest chain, CPM sense) and a worst blocker —
  so F-06 now answers "what is holding the release" as well as "what
  is drifting". Since T-014 it also has a SECOND SURFACE that is not a
  pane at all: the `nputer-index` binary reads the same committed
  graph from a shell and prints components, edges and drift findings
  as one greppable record per line, `index --check` says whether the
  map still matches the code (and names what moved when it does not),
  and `arch drift --fail-on` turns drift into something a build can
  FAIL on rather than only something a human can look at — so "drift
  as a first-class signal" now reaches the command line and CI, not
  only the map pane

## Milestones
### Milestone 0 — planning (current)
Goal: interview completed, milestone 1 decomposed into exact tasks.
- [x] Convention v0.1.3 (EARS, touches, security sweep, succession,
      suggestions, room resolutions)
- [x] Market map + steal list (docs/research/competitors.md)
- [x] Interview complete, Q1–Q7 (rooms/first-user.md; NORTH_STAR)
- [x] Name decided: nputer (rooms/naming.md; npm/PyPI free)
- [ ] Domain + trademark sweep for "nputer"
- [x] Decomposition pass → docs/tasks/ T-001…T-007

### Milestone 1 — the mirror (scoped 2026-08-14, interview Q7)
Goal: open the nputer app and watch nputer being built on its own
board — read-only story map of this repo, rendered beautifully;
the method run by hand underneath (the coherence experiment starts
at T-001). Deliberately feels too small. Tasks: T-001…T-007.
Progress: COMPLETE 2026-08-15 — T-001…T-007 all through the
pipeline; design language applied. Launch-screenshot judgment with
@human.

### Milestone 2 — the map slice (decided 2026-08-15, rooms/map-sequencing.md)
Goal: the architecture map's vertical slice on nputer's own repo —
component files + TS indexer + derivation + T0 map view (T-008 →
T-009 → T-011 → T-012). Starts only after T-006 closes milestone 1.
Progress: COMPLETE 2026-08-15 — T-008 → T-009 → T-011 → T-012 all
through the pipeline; the map renders the repo's own drift.

### Milestone 3 — in-app genesis (F-03)
Goal: the planning interview as split view; decomposed at its own
/plan review. The F-06 remainder (T-010, T-013, T-014, T-015 —
milestone 4) re-enters after it.
Tasks: T-023…T-029 (kit → lens → runner → entry → split view →
crescendo → resume); first slice T-023+T-024+T-026 — hand-driven
genesis rendered live, deliberately too small. (Decomposed
2026-08-16, ADR-017.)
Progress: FIRST SLICE COMPLETE 2026-08-16, promise delivered — T-023 →
T-024 → T-026 → T-037 all through the pipeline. The join that fell
between two parallel branches and belonged to neither is closed:
T-037 mounted T-024's lens in T-026's slot, so the pane is in the
shipped bundle and the placeholder line is gone. **Hand-driven genesis
now renders live, with no agent in the loop yet.** End to end, what a
user can do today: open a folder with no `docs/` in it (the front door
offers "Open a folder…" and "Start an interview"), then hand-drive the
method in a terminal — write NORTH_STAR.md, ROADMAP.md, the first
decisions and tasks — and watch the plan materialize in the pane as
each file lands: the north-star card, the backbone grid filling in,
artifact rows going from expected to written, the approximate banking
stage climbing. No re-pick, no refresh, no polling — the first
`mkdir docs` arms the watcher and every write after it flows through.
T-049 merged 2026-08-16 and widened that entry after @human hit its
edges: the ⌘O/⌘N the front door advertises now fire from every screen
instead of only while the front door is mounted, and the board header
carries its own "Start an interview" — so starting an interview from a
project that is already open is one step rather than four (it used to
mean opening a picker, choosing a folder with no `docs/`, landing on
the no-plan card, and pressing its button).
T-050 merged 2026-08-17 on @human's second report of that same review —
a screenshot of the app stranded on "waiting for the first docs
snapshot…" with nothing on screen but "Toggle theme". Three things were
wrong at once and all three are fixed: the startup latch was set before
its two awaits and reset nowhere, so ONE transient IPC failure stranded
the app permanently (measured against the unfixed code — a later call
resolves without touching the boundary, even after it has healed); the
rejection was swallowed into an unhandled promise, so the user was told
nothing; and the screen carried no way out. What a user can do now that
they could not: read WHICH step failed and why, press "Try again" and
have it genuinely re-subscribe onto a live board, or leave by the same
"Open a folder…" / "Start an interview" route every other screen
offers. **No reachable screen leaves the user with only the theme
toggle.**
T-042 merged 2026-08-17 and widened the entry a second way, this time
by weakening a condition rather than adding a control: "start an
interview here" no longer means "a folder with no `docs/` in it", it
means **a folder with no PLAN in it**. A repo whose `docs/` predates
nputer — a lone ARCHITECTURE.md, a decisions/ tree, anything — used to
land on a pane that said `docs/ · nothing written yet` over files that
were plainly there, because the switch carried no tree and the watch,
though armed the whole time, had nothing to report until the next
write. The switch now carries the tree it found, so **the first frame
of an interview tells the truth about what is already on disk**. Two
smaller truths landed with it: an armed `docs/` that DISAPPEARS is now
news the same way one that appears is (one measured rule, not two
special cases), and the `model-updated` echo fires on provenance
instead of a guard that was always true.
T-025 (the agent runner, the milestone's hard core) merged 2026-08-16
and the honest reading of it is narrow. The MECHANISM exists: four app
commands spawn the user's own `claude` headless once per turn, resume
it by its native session id, materialize the method kit into the
project's `.nputer/`, stream deltas back on one event channel, and kill
the process group on cancel — with zero new webview grants, zero new
crates, and an environment BUILT rather than inherited so no key can
reach the child. All of that is proven against a FAKE CLI fixture, and
proven hard (61 new cargo tests, every one execution-swept). T-039
merged 2026-08-16 on top of it and closed the one security gate this
milestone carried: a session id captured off the CLI's own stream was
previously substituted into a resume argv unvalidated, so an id
beginning with `-` would have parsed as a flag rather than as
`--resume`'s value. Argv assembly is now FALLIBLE and the id is
validated at both boundaries — the stream capture and the registry read
T-029 will use — so no infallible path assembles a resume argv and a
future caller cannot skip the check by forgetting. That was the
scheduling gate on T-029; the remainder below is no longer held by
security debt. **What has never happened is a real planner turn.** The one permitted real-CLI
smoke could not complete: this machine's `claude` OAuth token is
revoked, so every attempt 401s. It did establish that the real CLI
accepts the whole adapter argv, that the session id and model are
captured, and — by failing — that the CLI reports auth failure in band
on stdout, which was a wrong assumption in the plan and is now fixed.
It established nothing about the conversation. So: "by hand" is NOT
removed yet, and the kickoff has never landed a real planner in stage 0.
The UI half of that gap closed at T-027, immediately below; the
authentication half has not moved.
T-027 merged 2026-08-17 and it is the one that changes what this app IS.
Until tonight the genesis screen was a lens: you hand-drove the method in
a terminal and watched the plan materialize beside you. **Now the screen
is a conversation.** A 640px planner chat sits to the left of T-024's
lens, driven by T-025's `genesis-turn` channel, and the interview starts
itself on arrival — no button to find first. One question is prominent
with the history quieter above it; you answer in a box that takes ⏎ to
send and ⇧⏎ for a newline and disables itself while a turn is in flight;
a planner turn that opens with the T-023 challenge prefix renders in the
"pushing back" treatment; ⌘. cancels. And when the planner writes a file,
a `banked → <artifact>` chip appears in the transcript — **from the
watcher seeing the file, never from reading what the model claimed.**
That last rule is the one worth stating plainly, because it is the
difference between a transcript and a record: a planner turn that names
three real docs paths while writing nothing produces **zero** chips, and
a human who writes the file by hand mid-interview produces an identical
one. The chat is a view of the disk, not of the dialogue. End to end,
what a user can do that they could not this morning: open a folder with
no plan in it, be asked a question, answer it in the app, watch the
answer become a file, and see the file confirmed back — with the plan
assembling in the pane beside the conversation that produced it.
T-051 merged 2026-08-17 and it is the smallest change in this milestone
with the largest reach: **four numbers in a manifest, and they decide
whether anyone ever sees the paragraph above.** The app opened at
800×600 with no minimum. T-027's split renders the lens only at or above
1024 CSS px and centres the chat alone below it — so at the size the app
actually launched, **a new user saw the chat and nothing else**, and the
composition that was ruled on the same evening was unreachable without
first dragging the window wider. Nobody widens a window before forming
an opinion. The window now opens at **1280×840** and declares
**minWidth 1024 / minHeight 700**, so the split is what launch looks
like and the sub-breakpoint state is out of the window's legal range
rather than its default. 1280 is not a round number chosen for taste: it
is the unique width at which the two halves are equal (the chat is 640
with its 1px rule inside it, so the lens is width − 640), and 1279 is
the measured floor where the lens still clears the 639px T-027's plan
calls the design's geometry. The floor of 700 clears every screen's
natural content at the minimum — genesis 302, the front door 475, the
no-plan card 663 and the repo map 692 — with **8px to spare, not the
37px the card claimed**, because the card's guard measured a one-node
map (T-051-s5). What a user can do that they could not this morning:
launch the app and see the interview and the plan side by side, at the
size the design was drawn for, without touching the window. **What is
still @human's**: whether 840 or 867 is right depends on the ~28px macOS
title bar, which is the one number nobody could measure headlessly
(T-051-s3).
T-028 merged 2026-08-17 and it is the interview's last act: **the lens
stops being a lens.** Until tonight the right half of T-027's split
watched the plan assemble as artifact rows; now, the moment a task file
under `docs/tasks/` actually PARSES, that half becomes the real board —
C-08's own components mounted read-only, cards raining in on one
motion-safe entrance transition as each file lands, with the elapsed
time running in the chat header. When the last turn has settled, nothing
is in flight and a parseable board is on disk, a completion panel
appears with one button that puts the user in the board pane on their
new project, rail restored. So the arc a user can now walk end to end,
in one window, without a terminal: **open a folder with no plan in it →
be asked a question → answer it → watch the answer become a file → watch
the files become cards → press one button and be standing in the board
of the project you just planned.** That was the milestone's whole
promise and it is now a continuous path rather than four screens that
each work.
Two things about HOW it decides are worth stating, because both are
refusals. The switch is on task RECORDS, not filenames and never on what
the planner SAID — seven unparseable files read as zero cards and the
view stays honestly in-interview with the parse-error chips, because
**planning theater is the named failure mode and an empty board must
never be celebrated**. And the completion signal the card asked for
turns out not to exist: `method/` defines no closing marker, so
completion is derived from typed state and file evidence instead
(highest turn settled · nothing in flight · a parseable board on disk).
That is stricter than the card, not looser — depending on a
model-emitted marker would mean believing what the model said, which is
exactly what ADR-017 and the chip rule forbid. It is reversible too:
answer again and the panel stands down. The verifier proved it never
reads turn text by feeding it a turn object that throws on `text` and
`activity` and still getting a completion.
It also carries the keyboard fix: the answer box now takes focus back
when a turn lands, so seven questions can be answered without ever
reaching for the pointer — and it will not steal focus you deliberately
moved elsewhere.
**The milestone is NOT complete, and the remainder is not cosmetic.**
**T-029 remains** (resume plus the hand-driven fallback), and it matters
more than its position suggests: the user's half of the transcript does
not survive a remount or an app restart today, so a mid-interview reload
shows an empty chat over a live session — and the auth failure that
every attempt on this machine hits is a dead end with no diagnosis on
screen. And the evidence this milestone's claim will
ultimately rest on **still does not exist — not one planner turn has ever
been observed against a real model.** This machine's `claude` OAuth token
is revoked, so every attempt 401s and no model call has ever gone through
the runner. Everything above is proven against a fake CLI fixture and a
scripted lane. It is a real conversation with a real event channel and a
real file-evidence join; whether it is a GOOD interview is unknown, and
one authenticated run (T-025-s2, @human) is what would answer it.

## Parked
The staged future lives in docs/future.md (two expert-room batches:
v0.2 cost telemetry, retro role, sandboxing, pocket cockpit; v0.3
N-version, spec red team, time machine, handoff score, dry run;
horizon: truth maintenance, production feedback, synthetic users,
seeds, explainer, proof of process). Nothing there enters scope until
the first real project run — one recorded exception: the
architecture-drift slice of truth maintenance was pulled forward into
F-06 v1 by human directive (ADR-013, 2026-08-15). Also parked:
archaeology/Adopt variant — after the first real greenfield genesis
run (reuses the F-03 runner + split view wholesale; ADR-005).
