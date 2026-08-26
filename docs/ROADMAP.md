# Roadmap

## Backbone (revised per ADR-008 — app-first)
- F-01: Method — the convention itself (method/), usable by hand.
  Since T-138 (2026-08-26) the READ-FIRST SET is a measured object rather
  than an assumption. It has three spellings — the project's root adapter,
  `method/roles/orchestrator.md` and `method/roles/executor.md` — and
  T-138 measured what each actually is: at that card's base ONE role file
  carried a reading list of its own, ONE deferred to the adapter, and
  THREE opened on an ACTION (verifier, integrator, planner), so the
  "four competing lists" everyone had assumed was three-quarters a grep
  artefact. **@human ruled the lists stay as they are for now.** What the
  set COSTS is now on the record and is the number to argue against
  before adding to it: **364 118 bytes across four documents at
  `00e133a`**, against **1 140 bytes** for the adapter that names them —
  a ratio of **319×**, which is why the adapter can afford to be read
  every time and each document in it cannot. **DERIVE IT AT YOUR OWN
  REF**: two of the four are rewritten by every checkpoint, so that
  numerator moves under work no card does. **And the set still has no PRODUCT-shaped
  entry**: STATE is what is happening now, CONVENTIONS is how to work,
  ARCHITECTURE is which components exist, and not one of them says what
  the app DOES for a person using it. @human decided the answer is a
  GENERATED document assembled from `tools/e2e/tests/` — because a
  sentence in a spec name is false the moment its body reds, and nobody
  has to keep it true. **AND THE SIZE OF THAT ENTRY IS THREE DIFFERENT
  NUMBERS, WHICH IS T-138's SHARPEST MEASUREMENT**: 163 statically
  extractable `test("…")` sentences (**11 808 bytes, a 3.24% add on the
  set**), 170 `test(` call sites in all, and **194 behaviours Playwright
  actually runs** — the five loop-bodied sites expand by 24. T-138's
  verifier derived all 194 **from the source without a run**, by
  resolving the loops' own constants, so *"generated from source misses
  31"* is false and the generator's real choice is whether it resolves
  them. Routed as `T-138-s1`; the template every new project inherits
  carries the same omission and is `T-138-s2`.
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
  Since T-010 (2026-08-25) the REALITY half is no longer one language.
  The indexer collects `.rs` on the same walk as `.ts`, so the map
  finally draws the part of this repository that was never on it: the
  crate that WRITES the graph (C-07, zero files → 32), the shell's Rust
  half, and the agent runner at 8 files instead of 1. Two things follow
  that a bigger picture would not have given on its own — a declared
  relation the map could only call PLANNED is now CONFIRMED by real
  edges (C-14 → C-10, predicted in the fixture at T-025 and left there
  unedited), and drift becomes symmetrical: `app/src-tauri/**` can
  create and clear findings where before it could do neither. The
  committed graph pays 648 886 → 890 866 bytes for it, 89.09% of its
  own budget, which is now F-06's tightest live constraint
  Since T-139 (2026-08-26, merge `aed77b6`) that budget carries a
  MEASURED reason instead of a round number, and the sentence above is
  stamped rather than deleted: the budget is `1_040_000` from that merge
  on, so every percentage written before it is against the old
  1 000 000. The three delivery stages were measured separately — read
  3.4%, IPC 64.9%, parse 31.7%, 3.66 ms in all — and the hop that binds
  binds for the CHANNEL'S SHAPE, because tauri splices the serialised
  snapshot into a JS source string and evals it. Cost is linear to 14 MB
  with no knee, so nothing about TIME argues for a limit near 1 MiB and
  what sets the number is the collector's cliff alone. **The raise buys
  about three ordinary merges, not a new regime**, and the number itself
  is a judgement the measurement does not select — @human owns that
  last step. **AND THE SIZE IS NO LONGER F-06's TIGHTEST CONSTRAINT**:
  `T-140` (filed on main at `7f91ee4`, `blocked_by: [T-139]`, milestone
  5) puts the graph's FLOOR at 802 bytes per file, so the map stops
  working at about a thousand files — the budget bounds what the map
  may know and the floor bounds what it can reach, and only the second
  one keeps nputer from being pointed at a real codebase.
  Since T-033 (2026-08-25) the map finally tells the truth about ITSELF.
  F-06's whole premise is "drift as a first-class signal", and this
  repository's own map had been carrying **fifteen findings** — twelve of
  them undeclared edges the registry simply never wrote down — for long
  enough that the amber had become scenery rather than signal. It is now
  **three**, and every one of the three is honest: **one** undeclared row
  (`C-10 → C-14`, routed to T-125) and **two** informational D3s. The
  relation table goes **14 confirmed / 12 undeclared / 9 planned → 26 /
  1 / 9**, `unmapped` goes 1 → **0**, and 178 of 178 indexed files map to
  a component. Three things made it possible and each is reusable: a
  **thirteenth component**, C-16 Shared primitives, extracted out of C-05
  so the `ui/` element set, `cn` and the verdict classifier are a LEAF
  every pane may depend on — which is what lets the real edges be
  declared without writing a cycle; a `non_code:` field, additive and
  opt-in, that downgrades D3 to informational for the two components
  which are conventions rather than code (C-01, C-11) instead of leaving
  a permanent amber nobody could ever clear; and ADR-015 finally RULED
  rather than tolerated — the crate owns the reality-side join,
  TypeScript owns intent ⨝ tasks, so the map and the two engines stop
  being describable by two incompatible sentences. **The honest residual
  is stated rather than rounded away**: three of the four declared cycles
  die, ONE survives (`C-08 ↔ C-09`, which predates this card by nine days
  — T-008, `8c1da7d`), the file-level import graph is a DAG on both refs
  so that survivor is a node-boundary artifact and not a real import
  cycle, and T-127 carries it with a criterion written over the CENSUS
  rather than over one cycle by name
  Since T-091 (2026-08-25) F-06's premise reaches the GOVERNING DOCUMENTS
  as well as the code, and this one is inherited backlog rather than map
  content — say so rather than let the bullet imply the pane moved. The
  RANGE RULE is the most-consulted paragraph in docs/CONVENTIONS.md and
  was the least defended: **every measured figure it carries was
  poisonable to any value with every reader still green**, proved on
  T-083's branch by poisoning five at once and watching the whole tree
  stay green. `tools/e2e/tests/range-rule.spec.ts` +
  `scripts/range-rule.mjs` now recompute it — git on one side, the parsed
  document on the other, **no constant shared** — over 25 bodies inside
  `npm test` from tools/e2e. **The proof that it DERIVES is that moving a
  figure in the document moves the expectation**: the verifier mutated
  `**31**` to `**30**` on disk and the reader redded, which is exactly
  where a hard-coded reader survives. 22 mutants attempted, 21 applied,
  **18 KILLED, 3 PROVEN EQUIVALENT, 0 genuine survivors**. The one place
  it declines to fail is disclosed rather than hidden and is the reusable
  half: GRAPH REGEN's flip figures were measured before that trigger
  gained `*.rs`, so they **carry their ref and not their trigger** — 5 of
  5 at the ref they name, 1 of 1 under the trigger on disk — and the arm
  prints the divergence on stdout every run, asserts the monotonic
  relation between vintages, and REDS if the trigger ever NARROWS. The
  alternative was refused because its only compliant repair overwrites
  the five merges the correction rests on: **a gate that launders
  history**
  Since T-116 (2026-08-25) the map's ONE REMEMBERING LAYER stops lying
  about which repository it is describing, and this one IS map content.
  Churn was the only layer of the pane that is not a pure function of the
  docs snapshot: measured once from a mount effect, frozen after that, and
  silent about when. Two consequences, and the second is a truthfulness
  defect the rest of the pane does not have — a commit made while the map
  is open never moved the bars, and **a project switch kept the previous
  repository's entries and painted them onto the new repository's
  components**, with nothing on screen saying so. The age the payload has
  carried since T-013 is now rendered through the index hint's OWN
  `relativeTime`, so the pane has one spelling of "how old is this" and
  not a second; a `measuredAtMs` of `0` — what the untrusted-shape
  boundary substitutes for anything it cannot read, and it folds
  negative, NaN, Infinity, a string, a float and an absent field alike —
  renders NO age, because an age computed from the epoch is a wrong
  timestamp and a wrong timestamp is worse than none. The re-measure
  subscribes to the shell store at MODULE scope rather than from a mount
  effect, because the property owed is about the STORE: a switch while the
  map is closed must still invalidate. **"Not for one paint" holds by
  construction rather than by luck** — the module-eval subscription always
  precedes React's, so insertion order guarantees the store invalidates
  before the pane is notified — and a `generation` counter means a
  `repo_churn` still out for repository A can no longer fold onto B. The
  honest residuals are on the card rather than rounded away: the trigger
  is LAZY by a deliberate narrowing (nothing asked yet means no stale
  answer to drop), it does NOT inherit the single-flight latch its own
  comment claims it does, and a browser-bundle switch replaces a folded
  state — a real conflict between two criteria, resolved the right way,
  because serving A's numbers under B is the defect the card exists to fix
  Since T-129 (2026-08-25) the REALITY half can no longer take the app
  down while it reads. This one is not map CONTENT and not a pane change
  at all — say so rather than let the bullet imply the map moved — it is
  the indexer's own failure mode, and it belonged to F-06 because F-06 is
  what runs the indexer. `index()` executes INSIDE the Tauri process
  behind `index_repo`, and a Rust stack overflow is an `abort()` rather
  than a catchable panic: a single generated or hostile source file with
  pathological nesting ended the process at exit **134** — the window,
  the docs watcher, the agent runner and any interview mid-turn, with no
  error path running and nothing recorded. Six self-recursive traversals
  in the extractors, DERIVED by closing the call graph rather than listed
  from the card, now carry a depth bound and REFUSE past it while keeping
  everything shallower, so a hostile file degrades and is recorded
  instead of aborting. The margin is a CONSTANT rather than a function of
  the input, which is the whole of what a bound buys over a bigger stack,
  and the emitted graph is byte-identical for every input that does not
  exceed one — proven binary-against-binary over two corpora. **The
  finding worth carrying past the fix is that the card had the exposure
  BACKWARDS**: its key negative result (deep nesting inside a function
  body is harmless, which is what localises the bug away from
  tree-sitter) is true of Rust and FALSE of TypeScript, whose candidate
  scan descends every named child of the tree — and TS's `namespace`
  chain aborted at 2 000 against the tightest Rust threshold of 3 000, so
  the language the card treats as the afterthought was the more exposed
  one. The cost is one indexed file and 5 230 bytes: **939 161 —
  93.92% of the budget, 60 839 bytes of headroom**

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
**THE SENTENCE ABOVE ABOUT "the one state 'no overwrite path exists' is
supposed to make unreachable" NEEDS ITS EXCEPTION SINCE T-123**, corrected
in place with the ref rather than deleted (T-101's precedent): landing on
the interview screen over a folder that plainly has a plan is now a
DELIBERATE outcome — but only when one of our OWN interviews has a
resumable session registered on it. T-064's fix is untouched for every
other folder, and the guarantee is untouched everywhere, because resuming
the plan your own interview wrote is not an overwrite.
T-123 merged 2026-08-25, and it is the first card in this milestone
answering a defect a real @human hit on this project's FIRST genesis
interview against a real model. **The interview's own first act made
itself unreachable.** Stage 0 scaffolds `docs/ROADMAP.md`; a folder
holding a ROADMAP has a plan; a folder with a plan was never routed to
genesis; and the resume offer T-029 built lives only behind the genesis
screen. So the session that wrote the plan was stranded by the plan it
wrote, with no way back in from the UI — on a folder whose `docs/tasks/`
was empty and whose ROADMAP had zero features. What a user could not do
before and can now: reopen a folder whose interview banked stage 0 and
be taken back into that interview rather than to an empty board. The
routing now asks the session registry as well as the plan probe. **The
half that had to be got right twice, and was rejected the first time, is
what "registered" means**: a planner entry that is merely PRESENT is not
a way back in — one with no usable session id, or one whose id the
security boundary refuses, would have sent the user to a screen with no
offer, no working button and no way off it, which is the same dead end
one door over. So the predicate means RESUMABLE, and a folder whose
registered interview cannot be resumed correctly opens as the project it
is. **The honest limit, and it is @human's one look**: on that newly
reachable screen a user with NO supported CLI finds three controls and
none of them can succeed — resume needs the CLI, "Start a fresh session"
is refused by design on a planned folder, and the hand-driven kickoff
still refuses one too. All three are disclosed at the site and routed
(`T-123-s1`, `T-123-s4`); none is introduced by this card.
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
T-101 merged 2026-08-24 and it earns a paragraph on T-069's precedent —
**it makes a promise already written above true all the way to the eye.**
T-081 shipped the fact that a refusal happened: the CLI's in-band
`permission_denied` line became a classified event, crossed the channel
and landed on the turn, in order, joined and bounded. Its own criterion
said the denial "SHALL reach the frontend at the moment it arrives", and
it did — into a field **no component read**. A refusal was a datum in
memory that no human could ever see, and T-081's own @human question
("does a live denial notice read as information rather than alarm?") had
nothing to look at. It renders now, beside the pulse dot, in the quiet
furniture register and deliberately NOT in the failure treatment,
because the measured real turn carried two refusals and **completed** —
the planner decomposed the refused command and carried on, so painting
that turn as a failure would say the opposite of what the runner
measured. Two refusals of the same tool stay two, told apart by
`toolUseId` and never deduped. The sharper half is what the card learned
by getting it wrong first: suppressing the notice when the terminal
"tool denied" block already names the tool is right, but suppressing the
NOTICE rather than the ROW hid refusals the block could not name — the
nameless ones the runner announces precisely so they will not be silent
— so a turn with two refusals showed one. Suppression is per refusal
now, keyed on the names the failure block actually printed. One report
was still duplicated, on the exit-code path, and it was disclosed in the
code and routed rather than argued away (T-101-s1) — **and T-113 closed
it on 2026-08-24 (`e231e79`), which is what that routing was for**: the
runner's `permission_denials:` tail note is deleted, so a result-only
refusal on a failing turn now reaches the screen exactly once, as its own
notice row, with the failure block no longer repeating the tool name
underneath. What is NOT here:
the notice is live-only, so a restart still forgets what the planner was
refused (T-081-s3, which needs both fences). **@human still owes this
card one look** — the question T-081 could not ask is now askable.
T-107 merged 2026-08-25 and it closes the last dead end in the family
the two paragraphs above are about — **the app knew exactly what was
wrong, the user could fix it in one command, and the screen did not say
which command.** A `claude` too old to drive rendered one correct, typed
sentence (*"the agent CLI reports X, which is older than this app can
drive"*) and offered nothing to do about it, because the two families of
"this went wrong" have different renderers and only one of them could
ever carry an action: a `TurnError` goes through `failureAction` to a
block with a hint and a command, while a `StartOutcome` reached a notice
with no action slot at all. **The fix deliberately does not give the
second family a second hint/command pair** — that would be this card's
own defect arrived at from the other side — it gives it a BOOLEAN over
the one affordance both renderers already shared, the hand-driven route.
**AND THE SCREEN REFUSES TO GUESS THE UPDATE COMMAND, WHICH IS THE
PRODUCT CONTENT.** `claude install`, `claude update`, `brew upgrade`,
`npm i -g` — which one is right depends entirely on how the user
installed, and the typed outcome carries the `--version` line and
nothing else: no path, no manager, no channel. So the notice says what
is true, says in words why it is not saying more, and hands over the one
mode that needs no CLI at all. That is T-082's lesson applied one layer
up, where the shipped `claude login` sent the word "login" to a model
the user could not reach. **The other eleven arms were enumerated from
the union TYPE rather than by reading a switch** — a `never` guard makes
a twelfth arm a build error until somebody rules on it — and two of them
name a fixable problem and offer no fix, filed as `T-107-s2` and
`T-107-s3` rather than built, which is the same disposition T-082 took
and which is what produced this card. **What is NOT here is a pin**: no
assertion can live inside `[app-interview]`, so criterion 5 ships unmet
and disclosed, routed as `T-107-s4`, with the behaviour verified by a
verifier who drove the routed body itself. **@human owes this card one
look, and it is about wording rather than facts** — whether three
sentences and a button read as help or as a wall.
T-102 merged 2026-08-25 and it is the first card in this family to fix a
**discriminator that read the evidence that CAN be forged and ignored the
evidence that cannot.** T-069's paragraph above closed a false positive:
a 401 the CLI retried and got past used to survive as a typed auth
failure and take *Try again* away from a user whose login was fine, and
the guard that withdraws it fires on model TEXT arriving after the last
status-bearing line. **The runner's own justification for that guard
never stopped at text** — a `tool_use` block is the same model response
in a different content block — so a turn that recovered a 401 and then
called a tool without saying anything first, which is an ordinary opening
for a planner that reads the repo before it speaks, still reached the
user as an auth failure. **And the ignored evidence is the STRONGER of
the two**: T-069's own honest limit is that the CLI writes its own prose
into a nominally-model field, so a delta may not be the model at all,
while a block naming a tool is not prose and the CLI has no reason to
fabricate one. The flag is renamed `evidence_after_auth_status`, because
the old name said `text` and so made a missing CASE read as a different
SUBJECT. **The card asked whether the stronger evidence deserves its own
flag and the answer is a written refusal rather than a second flag**:
there is exactly one reader, a guard that WITHDRAWS a claim and never
makes one, withdrawal has no degrees, and two flags would differ in
nothing but name — with the condition that would split them recorded at
the declaration so the absence is on the record as checked.
**THE SECOND HALF IS FOUR THINGS THAT COULD NOT FAIL, AND THE BEST OF
THEM IS A FAMILY REPLACED RATHER THAN A BUG FIXED.** Seven mirrored
negative assertions — match the failure event, then assert the settled
status is NOT some other variant — were green under the exact storage bug
they look like they would catch, because the match arm has already
accepted the variant the negative forbids. All seven become an equality
against the failure event itself, and the replacement is proved rather
than argued: dropping the line that stores the classification reds
**eleven** bodies at the tip and left **all seven** of their predecessors
green at the base. **One criterion was declined on the evidence and the
decline is enforced, which is the shape worth copying.** The card offered
to lower a byte bound under a log cap so its "hard stop" comment would
become true; the lane refused, because the log cap MARKS its cut and the
runner's own truncation does not — so a bound that wins truncates
SILENTLY, and lowering it would have removed the `…(truncated)`
disclosure from the one string a refused user reads. The refusal is held
by a test that reds if anyone takes the other side of it quietly, and the
trade is routed as `T-102-s2` rather than settled here. **What is NOT
here**: the `Activity` label still reaches the webview through no bound
in the runner at all — not a regression, but it falsifies a universal
this card itself wrote into shipped source, and it is filed as
`T-102-s4`. **@human: none.**
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
On the inherited backlog: **80 cards already carry `milestone: 4` and
they are NOT this milestone's content.** They are standing backlog that
rides alongside — 41 of them F-02 map hardening, 21 F-06, 12 F-03, 6
F-01 — inherited from an era when milestone 4 was an inbox with no
goal. They are not re-stamped (that was the arm the ruling declined:
~30 frontmatter edits and an argument about each), so this milestone's
card list will not match its goal, and that is a known and accepted
cost of the ruling.
**THOSE DIGITS READ 45 / 29 / 11 / 3 / 2 FROM 2026-08-19 UNTIL T-031's
CHECKPOINT, AND THE ARGUMENT NEVER DEPENDED ON THEM** — corrected in
place with the ref rather than deleted (T-101's precedent, the same one
this paragraph's own parenthetical below uses). Re-derived on disk at
`5fbfd4e`: **85** cards carry `milestone: 4`, of which **5 are F-04** and
therefore ARE this milestone's content, leaving 80 inherited —
6 + 41 + 12 + 21 = 80. Nothing about T-031's merge moved this figure;
it went stale under every card written since the ruling, which is the
"DERIVE THE COUNT AT YOUR OWN REF" hazard docs/CONVENTIONS.md names,
found by an integrator asked to tick a ROADMAP sentence and checking
whether it was true. **DERIVE IT, DO NOT QUOTE IT**:
`grep -l '^milestone: 4$' docs/tasks/T-*.md` crossed with `feature:`
re-derives the whole breakdown in a second.
Of the four cards milestone 3 promised would "re-enter after it"
(T-010, T-013, T-014, T-015), **TWO are already done** — T-014's
indexer binary landed with watch and check modes, and **T-013 landed
2026-08-23** (merge `6834287`, checkpoint `d673039`): semantic zoom
T1/T2 plus the churn overlay, which gave the map pane a third data
source that is not a file. **THREE ARE DONE SINCE 2026-08-25: T-010
LANDED** (merge `d64c673`), and it is the one of the four that changes
what the map IS rather than what it can do. F-06's own line above
promises "intent + reality overlaid"; the REALITY half was TypeScript
only, so the crate that writes the graph could not appear in it, the
agent runner rendered as one file out of eight, and every merge under
`app/src-tauri/**` could truthfully report "the graph is byte-identical"
because the graph could not see Rust at all. It can now: `languages`
goes `["ts"]` → `["rust","ts"]`, 46 `.rs` files enter the index without
one of them being new on disk, C-07 goes from a declared-only face with
ZERO files to 32, and a relation the registry declared at T-025 and the
map could only call PLANNED — C-14 → C-10 — is confirmed by evidence for
the first time. The cost is recorded with it and it is the number this
milestone now has to watch: the committed graph is **890 866 bytes,
89.09% of its own budget** (`T-010-s3`). **T-015 alone remains planned**
and remains backlog rather than slice content. (This paragraph read "the
other three remain planned" for two checkpoints after T-013 merged;
corrected at T-085's.)
**AND THE F-06 BACKLOG'S OWN GATE LANDED 2026-08-25 — T-033**, merge
`8f8ec31`, which is inherited backlog by the ruling above and NOT F-04
slice content, but is the card the plan's §10 "zero drift before launch"
gate was waiting on: findings 15 → 3, unmapped 1 → 0, a thirteenth
component. **It unblocks by FENCE rather than by `blocked_by:`**, which
is the distinction to read carefully here — T-125, T-126 and T-111 all
carry `blocked_by: []` or `[T-110]` and were held only because T-033
owned `app-shell`; **T-127 is the one card with a literal `blocked_by:
[T-033]`**. Derived at this checkpoint: **22 of 38 planned cards want
`app-shell` and 9 want nothing else**, so releasing that one slug is the
largest single unblocking this board has had.
Open before any card dispatches: **D3** (may the app ever write into
`docs/`? — it never has; gates the selector card only, not the slice)
and **D5** (what can `model@session` mean, given `--model` is
deliberately never passed to Claude while Codex's `exec` accepts one —
see design/cross-harness-plan.md). **D2 is taken**: dispatch gets its
own component C-15 with touch slug `app-dispatch`, so it does not fence
against every genesis card for the life of the feature.
Progress: STARTED — **5 of 8 written F-04 cards done, and THIS LINE
FINALLY MOVES** (re-derived on disk at T-111's checkpoint by crossing
`^feature: F-04$` with each card's own `^status:`; it read "4 of 7" from
T-126's checkpoint until this merge, and "3 of 6" before that). **T-111
merged 2026-08-26 (`f3a4233`) and it is the SEVENTH consecutive merge
this line was asked about and the FIRST in eight that it moves for** —
the six preceding refusals each had a different reason, and every one was
"the card that landed is not this slice's content". This one is. Derived
here: `T-088`, `T-089`, `T-110`, `T-126` and now **`T-111`** are `done`;
`T-112`, `T-125` and `T-137` are `planned`. **DERIVE IT, DO NOT QUOTE
IT** — the denominator moved from 7 to 8 at T-134's checkpoint under a
card written outside that merge's range, so both halves of this fraction
have gone stale under work nobody's merge did.
**WHAT T-111 ACTUALLY DELIVERS AGAINST THE MILESTONE'S OWN GOAL.** The
goal sentence above says the board *"reads its own lanes off disk, says
which card is dispatchable AND WHY THE OTHERS ARE NOT, and hands you the
exact brief and lane commands for the one you pick."* T-110 delivered the
first clause; **T-111 delivers the second, which is the half the sentence
puts in capitals**, and it delivers it as a rendered REASON rather than
as a verdict: six closed dispositions, each with a sentence a human can
argue with. Two of those sentences are the whole point. A `fenced` card
names the token AND the lane holding it AND — because disjointness is
computed over EXPANDED component paths and the clash reports which
components it expanded through — says when the overlap is the COARSE
`app-shell` fence rather than a real collision, so a human can override
deliberately instead of serialising behind a word. A `blocked` card names
the unmet blocker ids, and when one of them names no card at all the
board QUOTES the parser's own near-miss hint verbatim (*"'T-001' is
declared and differs only in zero padding"*) and rules that this is a
defect in the card rather than a reason to wait. **The third clause — the
brief and the lane commands — is still T-112's**, and nothing in this
card spawns a process or offers a dispatch affordance; T-028's fence on
that is mechanically enforced and stayed green. **AND THE CARD WAS
REJECTED ONCE, ON SOMETHING WORTH RECORDING IN A ROADMAP**: not one line
of the derivation had to change. Four pieces of shipped TEXT stated
things that were not so — a pin whose title asserted the opposite of what
it checked, a range written into the commit that invalidated it, a
retracted word surviving in a test title, and a published edge count that
failed its own arithmetic — and three one-sided PRODUCER mutants survived
the whole suite at exit 0 because two of the card's own headline reason
clauses were encoded rather than defended. **A 33-arm poison drill that
is entirely red is not evidence that the thing the card is FOR is
pinned**; five of the six repairs are discharged by a mutant that now
reds, which is the only form of "fixed" this project accepts. T-089 merged 2026-08-23 and put the brief
itself in writing: a thirteen-row normative contract in
`method/roles/executor.md` that a program transcribes and a human reads
as a checklist, plus the generic `method/lane-protocol.md`. The slice's
goal is "stop hand-writing the instructions", and the artifact the
assembler (T-090+) has to emit now has a spec instead of ninety
examples.
**THAT LINE READ "1 OF 2 WRITTEN F-04 CARDS DONE" AND "T-088 … IS STILL
`planned`" UNTIL T-110's CHECKPOINT** — corrected in place with the ref
rather than deleted, the same T-101 precedent the paragraphs above use.
Both halves went stale under cards written after they were typed: T-088
merged and C-15 was declared, and the written F-04 set is now **seven**
(T-088, T-089, T-110, T-126 done; T-111, T-112, T-125 planned), not two —
it read **six** until T-126's checkpoint, which is the SECOND time this
sentence has gone stale under a card written after it was typed.
Milestone 4 carries **92** cards on disk at T-126's checkpoint, of which
**7 are F-04** (86 and 6 at T-110's). **DERIVE IT, DO NOT QUOTE IT** —
the hazard this file names three paragraphs up caught its own progress
line, and has now caught the correction to it.
**T-110 LANDED 2026-08-25** (merge `1223543`) and it is the first F-04
card that ships something the app can run rather than something a human
reads. **The app can now read which lanes exist from git's own files —
`.git/worktrees/*/gitdir` and `*/HEAD` — with no subprocess**, returning
a typed `{task_id, branch, worktree_path, exists_on_disk}` per entry and
a NAMED refusal for each way the question can have no answer, so an
empty list never means two different things.
**THE PRODUCT IS THE DISAGREEMENT, NOT THE LIST.** The reader's output
joined against the board distinguishes four states by name — a lane that
DIED (stamped in flight, no worktree), a dispatch that SKIPPED THE STAMP
(worktree, no stamp), a LIVE lane (both) and NOT DISPATCHED (neither) —
and a pin drives each. A board that showed only the stamps or only the
worktrees could report neither failure; this one reports both, which is
what the follower-first ruling (`docs/rooms/cockpit-or-mirror.md`) asks
for. It **unblocks T-111 and T-112**, the two cards that turn that
answer into a board and a brief.
**T-126 LANDED 2026-08-25** (merge `4983174`) and it is the card that
made T-110's work exist. `rustc` compiles no file that no module
declares, so from T-110's merge until this one the lane reader **was not
in the binary at all** — it reached a compiler only through a `#[path]`
shim compiled into a TEST target, and a planted type error in
`dispatch/lanes.rs` left `cargo build` at exit 0. **The slice's first
real code was dead code for a day, and every suite was green over it.**
T-126 declares `pub mod dispatch;`, registers **`dispatch_lanes`** — the
fifteenth IPC command and F-04's first, zero arguments — and deletes the
shim. The 34 dispatch bodies now run in the **lib** target rather than a
test target, which is the property to read; the pass count barely moves.
**THE LESSON THIS SLICE SHOULD CARRY FORWARD** is that a fence can leave
a card complete and its product unreachable: T-110 was rejected twice,
waived once, rebuilt by two executors and approved on a third pass, and
none of that could catch a missing `mod` line, because the missing line
was outside its fence at all three dispatches.
The cost line this milestone watches moves with it: the committed graph
goes 895 891 → **918 406 bytes, 91.84% of its own budget** at T-110's
merge, the highest this repository had then been, and **933 931 bytes —
93.39%, 66 069 bytes of headroom** at T-126's. **T-126 is the first
merge in this series to DELETE an indexed file and still spend
headroom** (`files +0 -1 ~2`, +445 bytes), so file count and byte count
moved in opposite directions at one regen, and **939 161 bytes —
93.92%, 60 839 bytes of headroom** at T-129's, which spends 5 230 on ONE
new indexed file (`files +1 -0 ~8`), and **944 590 bytes — 94.46%,
55 410 bytes of headroom** at T-127's, which spends **5 429** on ONE new
indexed file (`crates/nputer-index/src/arch/cycles.rs`, `files +1 -0
~4`). **AND IT DOES NOT MOVE AT ALL AT T-132's** — still **944 590
bytes — 94.46%, 55 410 bytes of headroom** — which makes T-132 the FIRST
merge in this series to spend NOTHING: its eight paths are five markdown
cards under `docs/` and three files under `method/`, and neither
directory is in the walk that feeds the graph (`.nputerignore` excludes
`docs/`; `method/` was never in it). `index --check` was asked twice and
answered CURRENT twice, so the regen was not owed and not performed.
**A merge that changes a file the Rust binary `include_str!`s can
recompile the crate and still move the graph by zero bytes**, because the
graph indexes SOURCE and the included file is DATA. Derive it at your own
ref.
**AND THE MILESTONE-4 CENSUS IS RE-DERIVED HERE RATHER THAN CARRIED**:
**96** cards on disk carry `milestone: 4` at T-129's checkpoint, of which
**7 are F-04** (92 and 7 at T-126's, 86 and 6 at T-110's) — F-01 9,
F-02 43, F-03 12, F-04 7, F-06 25. **T-129 is F-06 and is inherited
backlog, NOT F-04 slice content**, so the progress line below does not
move for it; the four that arrived tonight are `T-132`…`T-135`, @human's
adoption of `T-131`'s five process changes, and they are F-01/F-02/F-06.
**RE-DERIVED AGAIN ON DISK AT T-127'S CHECKPOINT AND EVERY FIGURE IS
IDENTICAL** — 96 total, F-01 9, F-02 43, F-03 12, F-04 7, F-06 25 —
because `T-127` is **F-06** and inherited backlog on the same ruling, and
its **five** suggestions carry no `milestone:` at all. So the F-04
progress line does not move for it either, for the third consecutive
merge.
**AND RE-DERIVED ON DISK A THIRD TIME AT T-132'S CHECKPOINT, IDENTICAL
AGAIN** — 96 total, F-01 9, F-02 43, F-03 12, F-04 7, F-06 25 — for a
different reason worth naming, because it is the one a future reader will
get wrong: `T-132` is **F-01** and carries `milestone: 4`, so it was
ALREADY IN THIS COUNT before its own merge, and stamping it `done` moves
no census figure. Its **four** suggestions carry no `milestone:` at all.
**FOURTH CONSECUTIVE MERGE WHERE THE F-04 PROGRESS LINE DOES NOT MOVE**,
and the three reasons have all been different: inherited-backlog feature
(T-129, T-127), and now a card that was counted before it landed. **A
census that does not move is not evidence that nothing merged.**
**AND RE-DERIVED ON DISK A FOURTH TIME AT T-133'S CHECKPOINT, IDENTICAL
YET AGAIN** — 96 total, F-01 9, F-02 43, F-03 12, F-04 7, F-06 25 — for
the same reason as T-132's and worth restating because it is the trap:
`T-133` is **F-02** and carries `milestone: 4`, so it too was ALREADY IN
THIS COUNT before its own merge, and stamping it `done` moves no census
figure. Its **five** suggestions carry no `milestone:` at all. **FIFTH
CONSECUTIVE MERGE WHERE THE F-04 PROGRESS LINE DOES NOT MOVE.** The board
DID move — 286 flat task files to 292, and 97 done to 98 — which is the
point: **a milestone census and a board census answer different questions,
and only one of them moves when an inherited-backlog card lands.**
**AND RE-DERIVED ON DISK A FIFTH TIME AT THE T-135 HALF A CHECKPOINT,
IDENTICAL A FIFTH TIME** — 96 total, F-01 9, F-02 43, F-03 12, F-04 7,
F-06 25 — **and this time for a reason none of the four above had, which
is why the entry is worth its lines.** `T-135` is **F-06** and carries
`milestone: 4`, so like T-132 and T-133 it was already in this count
before its merge. But the previous four all stamped their card `done`
and moved the BOARD's done figure; **this merge stamps nothing done at
all.** T-135's Half A merged and its Half B did not, so the card stays
`status: building` on a card with no live lane, and **done holds at 98
while the board's flat count goes 292 → 297** (four T-135 suggestions
plus `T-132-s6`, which arrived on main in its own commit after T-133's
checkpoint). **SIXTH CONSECUTIVE MERGE WHERE THE F-04 PROGRESS LINE DOES
NOT MOVE**, and the fifth distinct reason: a merge whose card is not
finished. **A `done` census that does not move is not evidence that
nothing merged — and now there is a worked case where nothing was even
stamped.**
**AND RE-DERIVED ON DISK A SIXTH TIME AT T-134'S CHECKPOINT, AND THIS ONE
MOVES — BY TWO, AND NEITHER MOVE IS THIS MERGE'S.** **98** cards on disk
carry `milestone: 4` — F-01 **10**, F-02 43, F-03 12, F-04 **8**, F-06
25; 10+43+12+8+25 = 98. **BOTH movers landed on main outside this merge's
range**: `T-137`, rewritten at `15f0d7d` BEFORE the merge (F-04 7 → 8),
and `T-138`, filed by the architect at `b3eaefe` DURING this checkpoint
(F-01 9 → 10). `T-134` is **F-06** and carries `milestone: 4`, so like
T-132, T-133 and T-135 it was already inside the 25 before it landed, and
stamping it `done` moves no milestone figure. **SEVENTH CONSECUTIVE MERGE
WHERE THE F-04 PROGRESS LINE DOES NOT MOVE**, and the sixth distinct
reason is the sharpest of them: **the census DID move, twice, and neither
movement belongs to this merge.** A census re-derived on disk answers
"what is true now", never "what did this merge do" — the second question
needs the range, and the range says six paths, none of them a card's
`feature:` or `milestone:` line. **DERIVE IT AT YOUR OWN REF AND SAY WHEN:
this figure was 97 forty minutes into this checkpoint and 98 by the end of
it, and nothing this integrator did moved it either time.**
**The BOARD moves too, and its three new files are also not this
merge's**: 297 flat task files → **300** — `T-111-s4` (the live lane's),
`T-137`, and `T-138` — while `T-136` never counted flat, because it was
created directly in `rejected/`, which goes 26 → **27**. `done` goes 98 →
**99**, the figure that had held for two merges, and **that one IS this
merge's**: T-134 is the only card it stamps. **This merge adds no task
file at all.**
**AND RE-DERIVED ON DISK A SEVENTH TIME AT T-111'S CHECKPOINT, AND EVERY
MILESTONE FIGURE IS IDENTICAL TO T-134'S WHILE THE PROGRESS LINE ABOVE
MOVES FOR THE FIRST TIME IN EIGHT MERGES.** **98** cards on disk carry
`milestone: 4` — F-01 **10**, F-02 43, F-03 12, F-04 **8**, F-06 25;
10+43+12+8+25 = 98, every row unmoved. `T-111` is **F-04** and carries
`milestone: 4`, so like T-132, T-133, T-135 and T-134 before it, it was
ALREADY INSIDE THIS COUNT before it landed — **which is exactly why the
milestone census does not move and the F-04 progress line does.** They
answer different questions: the census asks *how many cards carry this
stamp*, and the progress line asks *how many of the slice's own cards are
finished*. **Six consecutive checkpoints wrote down that the progress
line did not move; this is the first that can say WHY the two figures
were ever expected to move together, which is that they never were.**
**THE BOARD MOVES IN BOTH DIRECTIONS AT THIS MERGE AND ONLY ONE
DIRECTION IS THIS MERGE'S.** 300 flat task files → **290**: the eleventh
triage (`6bec5a2`, the architect's, landed on main three hours before
this merge and OUTSIDE its range) removed **16**, and this merge adds
**six** — `T-111-s5` … `T-111-s10`. `suggested` goes 123 → **113** by the
same arithmetic (123 − 16 + 6). `rejected/` holds at **27** and does NOT
gain the sixteen: that commit deleted them outright, and the copies bound
for `rejected/` are still staged in the architect's own verification
checkout, which is a fact about somebody else's index and not about this
tree. **`done` goes 99 → 100, and THAT one is this merge's** — T-111 is
the only card it stamps, and it is the hundredth card this project has
finished. **`verifying` goes 1 → 0.** Derive it at your own ref: three of
the sixteen the triage removed were `T-111`'s own `s1`, `s3` and `s4`,
so this card's suggestion trail is smaller on main than the card's body
describes, and the body is deliberately left saying what it said.
**AND RE-DERIVED ON DISK AN EIGHTH TIME AT T-139'S CHECKPOINT, AND IT
MOVES BY ONE UNDER A CARD THAT IS NOT THIS MERGE'S EITHER.** **99** cards
on disk carry `milestone: 4` — F-01 10, F-02 43, F-03 12, F-04 8, F-06
**26**; 10+43+12+8+26 = 99. The single mover is **`T-139`'s own card
file**, which the architect created on main at the dispatch commit
`13c736e` — OUTSIDE this merge's range, which is `00e133a..aed77b6` and
contains no `feature:` or `milestone:` line at all. **`T-140` does NOT
move this census**, and that is worth saying because it is the obvious
guess: it is F-06 but `milestone: 5`. **THE F-04 PROGRESS LINE DOES NOT
MOVE, AND THE REASON IS THE OLDEST ONE IN THIS LEDGER** — `T-139` is
**F-06**, inherited backlog rather than F-04 slice content, so the
fraction holds at **5 of 8** one merge after T-111 finally moved it.
Seven of the eight refusals before T-111 had that same shape; this is
the ninth ask and the seventh time that exact reason applies.
**THE BOARD MOVES IN BOTH DIRECTIONS AND ONLY TWO OF THE SEVEN MOVES ARE
THIS MERGE'S.** 290 flat task files → **281**: main added `T-139`'s card
(`13c736e`) and `T-140`'s (`7f91ee4`), `b3da1a4` MOVED `T-033-s6` out to
`rejected/` (which goes 27 → **28**), this merge adds **four** —
`T-139-s1` … `s4` — and `1d66a50`, the eleventh triage's second half,
landed BETWEEN this merge and its checkpoint and **deleted fourteen while
parking ten**. 290 + 2 − 1 + 4 − 14 = 281. `suggested` goes 113 → **92**,
`parked` 41 → **51**, and `planned` 35 → **34** (T-137 and T-138
dispatched to `building`, T-140 arriving `planned`), so `building` goes
1 → **3**. **`done` goes 100 → 101 and THAT one is this merge's** — T-139
is the only card it stamps — and **`verifying` goes 1 → 0**. Derive it at
your own ref and stamp the reading; this paragraph was written at 295 and
corrected at 281 inside one checkpoint.
**AND RE-DERIVED ON DISK A NINTH TIME AT T-138'S CHECKPOINT, AND IT MOVES
BY ONE UNDER A CARD THAT IS NOT THIS MERGE'S EITHER.** **100** cards on
disk carry `milestone: 4` — F-01 10, F-02 43, F-03 12, F-04 8, F-06
**27**; 10+43+12+8+27 = 100. The single mover is **`T-141`'s own card
file**, which the architect created on main at the dispatch commit
`2a922ce` — OUTSIDE this merge's range, which is `2a922ce..6036260` and
contains no `feature:` or `milestone:` line at all. **`T-138` does NOT
move this census**: it is F-01 with `milestone: 4` and was already inside
the count before it landed, exactly as T-132, T-133, T-134, T-135, T-111
and T-139 were before it. **THE F-04 PROGRESS LINE DOES NOT MOVE, FOR
THE OLDEST REASON IN THIS LEDGER** — `T-138` is **F-01**, inherited
backlog rather than F-04 slice content, so the fraction holds at **5 of
8** for the second consecutive merge after T-111 finally moved it. **This
is the TENTH ask and the EIGHTH time that exact reason applies.**
**THE BOARD MOVES IN BOTH DIRECTIONS AND ONLY TWO OF THE FOUR MOVES ARE
THIS MERGE'S.** 281 flat task files → **287**: main added `T-141`'s card
(`2a922ce`), this merge adds **four** — `T-138-s1` … `s4` — and this
checkpoint adds **one**, `T-138-s5`. 281 + 1 + 4 + 1 = 287. `suggested`
goes 92 → **97** (four from the merge, one from the checkpoint);
`rejected/` holds at **28** and this merge sends nothing there.
**`done` goes 101 → 102 and THAT one is this merge's** — T-138 is the
only card it stamps — and **`verifying` goes 1 → 0** while `building`
holds at **3** (`T-135` with no lane, `T-137` and `T-141` with lanes).
**T-138's OWN STAMP FREES EXACTLY THREE CARDS AND NO MORE**: `T-105`,
`T-128` and `T-131`, derived through the merged `fence.ts` — a far
smaller release than T-139's seventeen, because this fence held three
files rather than two components.
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
