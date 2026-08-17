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
  is drifting"

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
removed yet. Nothing in the UI calls the runner (T-027 owns that), and
the kickoff has never landed a real planner in stage 0. The honest
remainder: T-027 (the split view's conversation half — the pane is
currently full-width where it was drawn as the right half, and the
first consumer of the runner's store), T-028, T-029 — plus one
observed real turn on an authenticated machine (T-025-s2, @human),
which is the evidence this milestone's claim will ultimately rest on.

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
