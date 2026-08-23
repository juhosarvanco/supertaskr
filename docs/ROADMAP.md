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
  Since T-013 (2026-08-23) the pane also ZOOMS and shows CHURN. A
  component can be expanded in place into a container of its own files
  grouped by directory, with the intra-component edges drawn and the
  stub edges to collapsed neighbours still attached — it grows DOWN
  within its own column, so the rest of the map does not move under
  you — and selecting a file lists its symbols and their resolved
  edges in the panel. Over the render budget the container groups
  deeper and then paginates, naming what it left out, rather than
  freezing the canvas. The overlay control gains a FOURTH member:
  churn, a 3px bar reading each component's share of the last 30 days
  of git history, with the single hottest one step darker and a tie
  naming none. It is the first thing the map shows that does not come
  out of a file — and on a folder that is not a git repository the
  segment is DISABLED with the reason on it, not quietly missing

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
T-063 merged 2026-08-18 on the THIRD report in that same thread, and it
is the only card in this backlog with a real user bug report attached.
On 2026-08-16 @human hit the "waiting for the first docs snapshot…"
dead end again, and sent a screenshot AND their log — **and the log was
healthy through seq 22**, because the thing that broke had no way to
write to it: `recordStartupFailure` ended at a webview `console.error`,
and a WKWebView console never reaches the process's stdout. So the one
failure a user actually reports was the one failure the log could not
describe. What a user can do now that they could not: hand over a log
that CONTAINS the failure — a `startup-failed` event crosses to Rust
and lands on **stderr**, deliberately beside `model-updated`'s stdout so
a reader can separate a failure from a healthy round trip without
parsing — and get an answer when nothing rejects at all, because a
**deadline** now distinguishes a HANG from a REJECTION. Two quieter
repairs ride with it: the unlisten handle is held, so a failed
`subscribe` can no longer leave a board that looks fine and has silently
stopped tracking their files (the worse failure mode T-050 left behind,
a photograph of a project), and the webview re-arms after a pick.
**THE HONEST LIMIT, and it is the part of the report this card does not
answer: the first 8 seconds are unchanged.** Until the deadline fires
the user sees exactly the sentence from the screenshot; what changed is
that the wait now ENDS.
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
T-064 merged 2026-08-23 and closed the timing hole T-042's own tree
opened up. Carrying the tree made the switch honest about what was on
disk WHEN IT LOOKED; it looked twice, ten seconds apart, and shipped
both answers. What a user could hit before and cannot now: start an
interview on an empty folder, have anything write a plan into it while
the pick is still in flight — a sibling terminal, a `git checkout`, an
editor's save — and land on the interview screen over a folder that
plainly has a plan, which is the one state "no overwrite path exists"
is supposed to make unreachable. The later reading now wins and the
folder opens as the project it has become. The second visible repair is
the reverse case: a file change that arrives WHILE the switch is
returning is no longer thrown away, so the first frame of an interview
can no longer be emptier than the frame before it. Both are seconds-wide
windows nobody would file a bug for; they are in this list because the
screen they produce is indistinguishable from the bug T-042 was written
to fix. One quieter fix rides along, from @human's own startup thread:
when a re-subscribe is refused but the FIRST subscription is still
attached, the failure screen stops saying no file change can reach the
board — because one can, and the next write will bring it up without
the user retrying or reopening anything.
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
calls the design's geometry. The floor of 700 was
justified as clearing every screen's natural content at the minimum —
genesis 302, the front door 475, the no-plan card 663 and the repo map
692 — with 8px to spare, not the 37px the card claimed, because the
card's guard measured a one-node map (T-051-s5). **THAT JUSTIFICATION IS
FALSE, IT ALWAYS WAS, AND T-062 IS WHAT MEASURED IT (T-062-s1).** The
probe read the DOCUMENT, and a document only reports content height for a
screen that can push the page open. **The genesis screen has been bounded
since T-048, so it never could**: its real content at 1024 wide is
**1082**, not 302 — off by **780** — and the board's is **4989**, which
the same probe could not see either. The four screens that CAN push the
page open agreed to the pixel; the one screen the window was raised FOR
was the one screen its floor probe was blind to. **700 still holds — but
only on a property T-062 itself creates.** Every screen now owns a scroll
region, so "every screen fits in the window" stopped being the
requirement and "the region left over is usable" replaced it; the
tightest non-form region at the declared minimum is **580px** (the
genesis lens), far above T-048-s5's measured 250px collapse floor. Two
caveats travel with the new number: it **sums side-by-side regions**, so
genesis's 1082 is 84px of chat log plus 796px of lens plus 2px of
textarea and the honest "nothing needs to scroll" height is **~996**; and
unlike its neighbour `tightestRegion` it does not exclude form controls.
**The number survives. Its reason does not** — and the reason is what was
written down. What a user can do that they could not this morning:
launch the app and see the interview and the plan side by side, at the
size the design was drawn for, without touching the window. **What is
still @human's**: whether 840 or 867 is right depends on the ~28px macOS
title bar, which is the one number nobody could measure headlessly
(T-051-s3).
T-062 merged 2026-08-18 and it is the card that decides what the shell
IS, on every screen at once. T-048 bounded the genesis column and left
every other screen a growing page, and wrote down that the fork was
T-027's to make; T-027 came and went, and `App.tsx` still read
`boundedFrame ? "h-screen" : "min-h-screen"` — **two scroll models in one
app, which is the kind of thing a user feels without being able to name
it.** On a tall board at 800×600 the wordmark, the project path, the
parse chips and the theme toggle all scrolled away, while the interview
next door behaved the opposite way. The fork is closed the bounded way:
`main` and the column are `h-screen` unconditionally, the pane rail
carries its own, and **every screen now owns a scroll region instead of
handing its overflow to the page.** What a user can do that they could
not this morning: scroll to the bottom of a fifty-card board, or to the
far corner of the architecture graph, **and still have the header, the
rail and the theme toggle where they left them** — and on the map, reach
graph that used to be unreachable at all. That last one is not a
metaphor: the canvas was `min-h-0 flex-1 overflow-hidden`, a box that
could shrink and, when it did, HID what no longer fit. It was harmless
only for as long as the column could grow. **Bounding the frame without
touching that line would have deleted 54px of graph at 800×600 with every
suite still green** — the trap was reproduced on purpose before anything
was built, and the lane now asserts the class rather than the instance:
no box anywhere may clip content it gives no way to reach. **What is
still @human's**: whether one bounded frame FEELS right. Everything below
the fold on the board now lives in a region with its own scrollbar, in
light and dark, on a screen used every day — and no measurement settles
that. T-066 merged 2026-08-18 and closes the remaining T-062-s3 door without
moving diagnostics into the board. `parse-error-details` stays above and
outside `board-scroll`, so short failures remain visible while the board
moves, but it now owns a token-backed `max-h-48` ceiling and vertical auto
overflow. With sixty real parser failures the page stays exactly 840/700/600
at the three measured viewports, the details list remains fully reachable in
its own 192px border box, and the board keeps 524/384/284px of independent
scrolling room. T-062 is a milestone 4 card; it
sits here because it continues T-048's and T-051's story rather than
F-03's.
T-055 merged 2026-08-18 and gives the parser one answer to "is this
content?" Roadmap bullets and task section headings now read the same
position-preserving structural view: fenced blocks, HTML comments and
single-backtick inline spans are inert before either consumer matches its
own syntax. A fenced example can no longer create a phantom feature or a
parse error, and a commented-out `##` can no longer open or close a live task
section. The deliberately narrow boundary is explicit: inline spans are
physical-line-local, top-level unclosed fences run through EOF, and Markdown
container/list de-indentation remains out rather than being half-parsed. All
127 live task section objects stayed byte-identical through the change.
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
T-029 merged 2026-08-18 and it is the milestone's last card: **the
interview stops being something you can only do once, in one sitting, on
a machine that has the right CLI.** Three dead ends closed, and they are
different kinds of dead end.
**The app restart.** Until tonight, closing the app or reloading the
window mid-interview showed an EMPTY chat over a session that was still
alive — the shell rebuilt phase, turn and session id but never the
turns. Now reopening a project with an interview in flight offers to
resume it: the same native session, the conversation rehydrated from the
transcript on disk, and — the part that matters for trust — **the stage
and the banked artifacts read from `docs/`, never from the cache.** If
the cache is missing or corrupt the resume still works and shows banked
progress instead of history, because the cache is losable by charter and
the files are the record. If the session itself will not resume, the app
does not stop there either: it continues with a FRESH session over the
banked docs, assembled with the method's own resume rule (read what is
written, name the next stage, carry on).
**The missing CLI.** A user with no supported agent CLI used to have no
genesis at all. They now get the same screen with the assembled kickoff
in a copyable block — "run this in any agent CLI in your terminal, I'll
render what lands" — with the live right half and the same completion
detection behind it. **Any model, any CLI, zero agent plumbing**, which
is ADR-006's manual-interview instrument delivered as a first-class mode
rather than a fallback nobody built.
**The expired login.** This is the one a real user hits first. A failure
the CLI reports in band is now a TYPED outcome instead of a relayed
blob: an expired login says so and offers `claude auth login` plus the
hand-driven route, and a turn killed because `--allowedTools` was too
narrow names the tool that was denied. **That command read `claude
login` from T-029 on 2026-08-17 until T-082 on 2026-08-19, and there is
no such command** — the CLI parses an unrecognised leading word as the
PROMPT, so the app had correctly diagnosed the login, correctly decided
to help, and handed over something that silently started a turn instead.
T-082 read the CLI's own `--help` surface and corrected it. **The
verification of this card
is worth one sentence in a roadmap**, because the first attempt got it
backwards in a way a user would have felt: the auth status latched, so a
401 the CLI had already RECOVERED from could survive to the end and
relabel an unrelated failure — a full disk — as an authentication
problem, which then REMOVED the Try again button (the only thing that
would have helped) and printed a login instruction at a user whose login
was fine. It was caught in adversarial verification, the card was
REJECTED, and it is closed by binding the diagnosis to the turn's
terminal line. Both verdicts are on the card.
T-056 merged 2026-08-18 and makes the long interview cost proportional to
the turn that is moving, not the transcript already banked above it. Before,
each of six historical turns executed 42 times during 21 StrictMode stream
updates to turn seven, both for live history and T-029's rehydrated history.
After, all six execute zero times while the current turn remains live. The
median summed Profiler work moved 4.442→0.791 ms live and 4.522→0.665 ms
rehydrated on the fixed 10k-character script. No throttle or second
coalescing window was added: identity and a memo boundary remove wasted
work without adding dead air.
T-060 merged 2026-08-18 and closes the resolver trust debt T-047 left
behind. The app no longer reads or writes `agent-paths.json`: a path to
the user's CLI comes from one fresh probe, passes the same absolute /
traversal-free / correctly-named / executable gate at every door, and
otherwise becomes typed `cliNotFound`. `$SHELL` is accepted only when it
is an absolute executable named `zsh`, `bash` or `sh`; relative PATH
entries cannot become executable candidates. The resolver still reads
the app's `SHELL` and `PATH`, and now says so plainly; the child remains
`env_clear()` plus the 16-entry allowlist. Most importantly, an ordinary
test or doctest cannot resolve the developer's real CLI: the guard is
derived from Cargo's `deps` and rustdoc's `rustdoctest*` harness shapes,
with the one ignored real smoke opting out explicitly. The first version
of that proof was REJECTED because it lifted the process-global guard in
a parallel test binary and made the guard's own tripwire flaky. The fix
runs the two proof arms in child processes with an empty PATH, a positive
receipt and an exact one-test count; both verdicts remain on the card.
This is security hardening rather than the missing real-model evidence:
no model was called, no command or grant moved, and the human's first
authenticated interview remains the milestone gate below.
T-043 merged 2026-08-19 and it is the first card in this milestone whose
whole subject is a delay the user SITS THROUGH. T-025's cancel killed
the process group and then waited out a five-second grace before the
turn latch released — and it waited out the whole five seconds every
time, including when the CLI died obediently on the first SIGTERM. The
cause is one question asked once: the grace poll tested `kill(pid, 0)`,
which answers "alive" for a ZOMBIE, and the turn's child is always our
own unreaped child, so the poll was asking a question that could not
come back "gone" until somebody reaped it and nobody did until the
grace expired. **⌘. and quitting mid-turn both paid that five seconds
unconditionally.** Release now requires TWO facts — the direct child
reaped AND `killpg(pgid, 0)` returning ESRCH — and a cooperative CLI
releases in tens of milliseconds instead of five seconds. The
counterweight is the half that makes it honest rather than merely fast:
a child that exits while a same-group grandchild ignores SIGTERM still
runs the poll to the deadline and still SIGKILLs the survivor, so the
speedup is not bought by abandoning anything. The escalation is guarded
by GROUP MEMBERSHIP rather than by the clock, because once the direct
child is reaped its pid is free for reuse and the process-group id IS
that pid — SIGKILLing a pgid unconditionally at the deadline is a
use-after-free of a pid number. The same correction reaches app EXIT,
where the observer coordinates with the one worker that owns the child
handle instead of guessing. And the guarantee itself is narrowed
wherever it is stated: **no orphaned descendant THAT STAYS IN THE
GROUP** — a descendant that calls `setsid()` leaves the group and
survives, which is a property of process groups rather than a defect,
measured rather than asserted. A descendant sweep stays a deliberate
non-goal. No command, grant, event or dependency moved; this is
milestone 3's process-lifecycle debt closed, not new surface.
T-069 merged 2026-08-19 and it earns a paragraph for a reason no other
internal-correctness card in this backlog has: **it makes a sentence
already written above TRUE.** T-029's entry promises that "a turn killed
because `--allowedTools` was too narrow names the tool that was denied",
and that promise had a hole nobody could see from the outside. It held
only while the CLI flagged its own result an error. When the same turn
ended with `is_error: false` — the refusal named on the terminal line,
the turn plainly dead of it — the classifier correctly declined to call
it a tool denial, and then nothing else said anything either: the result
text never reached the diagnostic tail, so the failure block rendered
**"the planner exited with code 1" and nothing underneath**, over denial
names the process had already parsed and was holding in memory. A user
in that position was told their planner failed and given no way to guess
why, on the one failure class this milestone's fixtures exist to
explain. The names now always reach the tail, whether or not anything
claims them. The second half is quieter and is about a BUTTON: a planner
that hit a 401, retried, got past it and then died of something else
used to be reported as an expired login — Try again removed, the user
sent to `claude login` (the string the app printed at the time, and the
one T-082 later found is not a command at all) with a login that was
fine. Model text arriving
after the failed request is the stream's own evidence that the retry
worked, and the diagnosis is now withdrawn when it appears, leaving the
plain exit-code failure with the 401 still readable in the detail and
**Try again back**. Both changes move in the same direction on purpose:
when this runner is unsure, it relays what it saw instead of naming a
cause, because a wrong name costs the user an affordance and a relayed
fact never does.
T-070 merged 2026-08-23 and bounds the one read in this milestone that
had no bound. Since T-029 the interview screen rehydrates its transcript
from disk on every arrival — and it did so by reading the WHOLE
`transcript.jsonl` and parsing every line before throwing all but the
last 200 away, so a tens-of-MiB transcript cost a tens-of-MiB read on
every visit. The read is now bounded AT THE READ: a backward tail walk
that stops at the line budget or a byte ceiling (52 MB, independent of
file size), so arrival costs the budget and not the file, with a
six-arm source pin keeping the only production path to that file the
bounded one. What a user can SEE that they could not: a user with no
supported CLI — routed to the hand-driven kickoff, and until now told
NOTHING about the interview they had already banked — is now shown, in
that same block, how many turns they banked and where the artifacts are.
The card corrects its own premise in place: bounding the read changed
one answer, because a budget on lines READ cannot reach past a tail of
garbage the whole-file read would have skipped — so an unparseable tail
now rehydrates as empty and a newline-free file answers with fewer lines
than the budget, both deliberate, both on inputs the transcript writer
cannot produce, each pinned. The FILE it reads still grows forever; that
is filed (T-070-s2), not closed.
**The milestone is NOT complete, and what it waits on is not a task.**
Every card on milestone 3's list — T-023 → T-024 → T-026 → T-037 →
T-025 → T-039 → T-041 → T-042 → T-048 → T-049 → T-050 → T-027 → T-051 →
T-028 → T-029 — plus T-060's resolver hardening, T-043's kill path,
T-069's relay and T-070's bounded arrival read is
through the pipeline.
The evidence the claim rests on
**still does not exist: not one planner turn has ever been observed
against a real model.** This machine's `claude` OAuth token is revoked,
so every attempt 401s and no model call has ever gone through the
runner. Every stream this app has ever seen is a scripted fixture that
lands in milliseconds — which means nothing above has been tested at the
one thing an interview is: a conversation that takes time, with a model
that can misunderstand you. It is a real conversation with a real event
channel and a real file-evidence join; whether it is a GOOD interview is
unknown. **One real, timed, end-to-end genesis on an authenticated
machine (T-025-s2, @human) is the whole remaining gate**, and it is
@human's to run.

### Milestone 4 — dispatch (F-04) (decided 2026-08-19, @human D1 ruling)
Goal: stop hand-writing the instructions that put an agent to work.
The board reads its own lanes off disk, says which card is dispatchable
AND WHY THE OTHERS ARE NOT, and hands you the exact brief and lane
commands for the one you pick. Named slice: **"dispatch without writing
the prompt"** — and deliberately, NOT ONE CARD IN IT SPAWNS A PROCESS.
You paste the brief into any agent CLI in your own terminal and nothing
in the system notices the difference; the spawn is a later card. This
follows milestone 3's own precedent exactly, one role over: T-023+T-024
+T-026 delivered hand-driven genesis rendered live before any agent was
in the loop.
Tasks: to be written from design/dispatch-technical-plan.md §2. **The
plan's drafted ids T-081…T-090 are STALE** — T-081, T-082 and T-083
were claimed on 2026-08-19 by the denial relay, the auth command and
the range rule. Re-derive the maximum id before writing.
On the inherited backlog: **45 cards already carry `milestone: 4` and
they are NOT this milestone's content.** They are standing backlog that
rides alongside — 29 of them F-02 map hardening, 11 F-06, 3 F-03, 2
F-01 — inherited from an era when milestone 4 was an inbox with no
goal. They are not re-stamped (that was the arm the ruling declined:
~30 frontmatter edits and an argument about each), so this milestone's
card list will not match its goal, and that is a known and accepted
cost of the ruling.
Of the four cards milestone 3 promised would "re-enter after it"
(T-010, T-013, T-014, T-015), **TWO are already done** — T-014's
indexer binary landed with watch and check modes, and **T-013 landed
2026-08-23** (merge `6834287`, checkpoint `d673039`): semantic zoom
T1/T2 plus the churn overlay, which gave the map pane a third data
source that is not a file. T-010 and T-015 remain planned and remain
backlog rather than slice content. (This paragraph read "the other
three remain planned" for two checkpoints after T-013 merged; corrected
at T-085's.)
Open before any card dispatches: **D3** (may the app ever write into
`docs/`? — it never has; gates the selector card only, not the slice)
and **D5** (what can `model@session` mean, given `--model` is
deliberately never passed to Claude while Codex's `exec` accepts one —
see design/cross-harness-plan.md). **D2 is taken**: dispatch gets its
own component C-15 with touch slug `app-dispatch`, so it does not fence
against every genesis card for the life of the feature.
Progress: STARTED — **1 of 2 written F-04 cards done**. T-089 merged
2026-08-23 and put the brief itself in writing: a thirteen-row normative
contract in `method/roles/executor.md` that a program transcribes and a
human reads as a checklist, plus the generic `method/lane-protocol.md`.
The slice's goal is "stop hand-writing the instructions", and the
artifact the assembler (T-090+) has to emit now has a spec instead of
ninety examples. T-088 (C-15's declaration) is still `planned`.
Decomposition pass complete 2026-08-19
(design/dispatch-technical-plan.md); D1 ruled by @human the same day.

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
