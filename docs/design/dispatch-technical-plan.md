# F-04 Dispatch — decomposition pass, 2026-08-19

Read-only pass plus one measurement. Nothing here is dispatchable until
the decisions in §3 are ruled. Ten card drafts exist and are held back
deliberately: nine of them carry `milestone:` and three carry design
choices that D1/D2/D3/D5 decide, so writing them before the rulings
would bake in guesses.

## 1. What F-04 is

Stop hand-writing the instructions that put an agent to work. Today the
architect reads the board, judges by eye whether anything else touches
the same files, cuts a worktree from the right commit, and composes a
briefing from memory. F-04 makes the board do that: it reads the lanes
off the disk they already live on, says which card is dispatchable **and
why the others are not**, and hands over the exact brief and commands.

## 2. The slice — "dispatch without writing the prompt"

Four cards, and **not one of them spawns a process.** This mirrors
milestone 3's own precedent exactly: T-023 (the kit) + T-024 (the lens)
+ T-026 (the entry) shipped hand-driven genesis with no agent in the
loop; the agent came at T-025/T-027. ADR-017 point 5 already ratifies
the shape — hand-driven is "a first-class mode and the universal
fallback", and `genesis_kickoff` is the working precedent for handing a
human an assembled brief.

    declare the component  ──┐        the brief contract ──┐
    (fence word first)       │        (method/)            │
                             ▼                             │
                      lane reader ──▶ frontier ───────────▶ a card hands you its brief
                                                            ^ SLICE ENDS

Why this half and not the spawn:

1. **The brief is F-04's actual product; the button is not.**
   `grep -rn "dispatch prompt" method/` returns nothing. STATE.md refers
   to "the brief" twice as an artifact nobody has specified. Automating
   the spawn first would automate the wrong half.
2. **It is independent of the evidence this project lacked until today.**
   Every card in the slice is provable headlessly against fixtures.
3. **It removes the step that has actually been going wrong.** The
   recorded failures are not spawn failures — they are dispatch-hygiene
   failures: a lane cut from a merge commit (T-014, which inherited a red
   gate through no fault of its own), six integrators independently
   re-deriving `<main-before>..HEAD`, a fence breach an executor could
   not judge.

## 3. Decisions needing a ruling

**D1 — Which milestone, and does milestone 4 get a goal?** The roadmap
has sections for 0–3 and none for 4, yet 42 cards carry `milestone: 4` —
an inbox with no goal. Arms: (a) F-04 is milestone 4, roadmap gains a
section naming this slice, one sentence says the inherited 42 are
standing backlog riding alongside; (b) same but re-stamp the backlog to
5 (~30 frontmatter edits, noisy diff, every one a legitimate hardening
item someone must now argue about); (c) F-04 is milestone 5, which puts
a hardening bucket ahead of the product's third act. **Recommend (a).**
Must be ruled first — it is frontmatter on all ten cards.

**D2 — Does dispatch get its own component and touch slug?** Arm A:
declare it, costing one component file and a three-fixture reconciliation
(`lib/parser/test/smoke.test.ts`, `app/test/architecture-dogfood.test.ts`,
`app/test/map-dogfood-render.test.tsx` — the omission that cost T-024 a
rejection). Arm B: put dispatch inside `app-agent`, costing nothing now
and fencing every dispatch card against every genesis card for the life
of the feature. **Recommend A**, and it is cheapest right now while
`app-shell` and `lib-parser` are free.

**D3 — May the app write into `docs/`?** Thirteen commands, zero bytes
ever written under `docs/`. ARCHITECTURE permits "single-field
frontmatter edits or thread appends, nothing else"; ADR-017 confines app
writes to `.nputer/`. Arm A (never) keeps the pure-lens rule intact and
makes model/session selection non-durable across restart. Arm B (exactly
`builder:` and `verifier:`) buys durability and costs an atomic-write
path, a staleness rule, and a new failure class: writing a card an agent
is holding.

**D4 — Is `status:` a live signal? SETTLED BY MEASUREMENT — it is,
under one constraint.**

The claim that reached me was that `building` "has never appeared on a
card, once, ever", making the field unusable and `TASK-FORMAT.md:97` a
description of a machine that does not exist. **That is false**, and the
error is the one this archive keeps repeating: grepping the current tree
cannot see a transient state. `git log main -S'status: building' --
docs/tasks/` returns **87 commits**, of which **25 are explicit dispatch
commits** — several titled, verbatim, *"Dispatch T-001, T-002 — status
building, builder stamped."* The practice ran 2026-08-14 through T-042
on 2026-08-17 and then lapsed. No `Dispatch T-NNN` commit exists after
that date. The lapse is the architect's, not the machine's.

The conflict argument was also tested rather than reasoned about, in a
throwaway repo, both orders:

| when the stamp lands | merge result |
|---|---|
| **at dispatch, before the branch is cut** | **CLEAN** |
| on main after the lane already exists | **CONFLICT** |

So both halves of the disagreement were right about different
operations. The conflict is real — for the operation the method does not
prescribe. `TASK-FORMAT.md:97`'s "fields lock **at dispatch**" is
precisely the constraint that makes the field safe.

Consequences: `dashboard.md`'s "amber building, pulsing while verifying"
**can** be driven from the field it names; the fix is to restore the
dispatch stamp, not to rebuild the board on git. The lane reader is
still worth building — it catches a worktree with no stamp, a stamp with
no worktree, and a pruned-but-unremoved lane — but as a **cross-check**,
not as the only possible source. That makes the slice smaller and leaves
the design of record standing.

**D5 — What can `model@session` mean?** The roadmap's F-04 line says
"worktrees, model@session, verify/merge", but `--model` is deliberately
never passed (ADR-003: *the user's CLI default IS the model*). So
`model@session` can mean which adapter/CLI and which session (fresh or
resume) — not choosing a model within one CLI, without reversing that
decision. Rule it, or reword the roadmap so nobody builds toward the
stronger reading.

**D6 — What may a dispatched executor do, and what enforces it?** Today
containment is cwd scoping plus the tool policy. T-025-s4 already
recorded that `cp`/`mkdir` reach the whole filesystem — **and the
2026-08-19 observation made this worse**: `ls` and `find` ran unprompted
with neither in the six patterns nor in this machine's user settings, so
the CLI grants a read-only Bash class of its own. Narrowing the
adapter's table cannot narrow the effective grant. Honest arms: (a)
trust the executor inside its worktree and write that sentence down; (b)
pull enforced-touches forward from v0.2 (a feature, not a card); (c)
narrow by hand and accept that `Bash(cargo …)` is near-arbitrary
execution anyway. **Recommend (a)**, stated plainly in an ADR: the
worktree is an isolation boundary for the repository, not a sandbox for
the machine.

**D7 — Does the app run `git`, ever?** ADR-003 commits to shelling out
to *agent CLIs*; **no ADR in the set has ever ruled on worktrees,
branches or merges — the word "worktree" appears in zero of the 17, and
"integrator" in zero.** The slice is designed to need no ruling (it
reads `.git/worktrees/**` as plain files and puts commands in the brief
for the human's own shell), but everything after it forces the question.
**This is the ADR-shaped hole in the record and should be written now.**

**D8 — T-008-s1: revisit or re-park?** Its trigger is literally
"Revisit at the F-04 planning pass". This pass decides the dispatch
component's layout, not the CLI's. Recommend a dated re-park with a
sharpened trigger.

**D9 — Three questions already open in STATE.md that F-04 forces.** Who
stamps `done`; what `review: independent` means; the size-S ceremony
carve-out. Each is close to settled and each becomes an implementation
detail invented by whoever builds first if left open.

## 4. Findings against the roadmap, the ADRs and the method

- **`method/roles/integrator.md` describes a rebase; the pipeline has
  only ever merged `--no-ff`**, and the two-commit merge-then-checkpoint
  split — which the graph-regen rule depends on — is nowhere in
  `method/`.
- **`verifier.md` and `executor.md` contradict each other.** The
  verifier may not see the executor's reasoning; the executor is
  instructed to put its reasoning in the file the verifier reads, under
  a heading naming the verifier as its audience. True for every card
  this pipeline has ever verified. **This is the strongest case in the
  feature for automating something rather than briefing it** — a human
  cannot un-see what they have read; a program can simply not send it.
- **The `touches` vocabulary is undeclared, unvalidated, and collides by
  spelling.** `tools/e2e` appears 9 times and `tools/e2e/` 7; `method/`
  4 and `method` 1; one card carries a bare `docs`. A string-equality
  fence would report overlapping cards as disjoint — the exact failure
  the fence exists to prevent.
- **`app-shell` is a false-conflict fence.** It is the `touch_slugs`
  value of three components at once (C-05, C-10, C-11) spanning
  `app/src/**` and `app/src-tauri/**`; 40 of 80 cards hold it, 30
  reference `src-tauri` paths and 32 reference `app/src` paths. The
  frontier must **name** this in its reason string rather than invent a
  finer fence — splitting the slug is a registry change that moves three
  fixtures and belongs in its own card if wanted at all.
- **A `blocked_by` field cannot express F-04's real blocker.** The spawn
  card is gated on a human observation, and `blocked_by` takes task ids
  only — so the dependency lives in prose, where an automated dispatcher
  believing `blocked_by: []` will miss it.
- **ADR-013 pre-declares an unresolved collision**: drift warnings are
  amber and "must be visually distinct from building/verifying amber".
  F-04 introduces the first live building/verifying states this app has
  ever rendered.
- **`method/runtime/nputer.yaml` is packaged, reachable and consulted by
  nobody**, and names a `janitor` role that has no role file.
- **`method/README.md` promises four CLI verbs this slice does not
  build** — `init`, `next`, `verify`, `merge`. Deferred on ADR-008
  grounds ("CLI is plumbing and the power-user/CI path").

## 5. Census, verified independently

129 task files (119 top-level + 10 rejected), of which **80 are real
cards** carrying `feature:`. Max id **T-080** with zero gaps — but
**T-081 and T-082 were claimed on 2026-08-19** for the denial-relay card
and the `claude login` defect, so an F-04 block starts at **T-083**. 42
cards at `milestone: 4`; zero at F-04 or F-05.

F-04 already has three parked cards waiting on it, one naming this pass
by name: **T-008-s1** ("Revisit at the F-04 planning pass"),
**T-025-s3** ("Unpark with the second adapter"), **T-047-s2** ("Unpark
with the second substituted slot, which is F-04's argv assembly").

## 6. Which half to automate

Automate the arithmetic and the assembly: the frontier, the fence, the
lane record, the brief, the trigger computation, the gate invocation and
its exit codes, and the verifier's context isolation.

Leave to a person: **which** card goes next (`orchestrator.md:19` —
propose and wait), whether a verdict is accepted, and **the checkpoint's
prose**. That last is not sentiment. Read this repo's checkpoints: they
are arguments — "why it is still approved, in the honest frame", "what
is not held is that both STAY true". A generated checkpoint would
produce a log where the record currently produces a judgment, and the
succession guarantee is built on the judgment. The poison drill already
states the general principle: *"It stays a DISCIPLINE rather than a gate
because nothing can automate 'would this have failed'."* The same test
applied to the checkpoint gives the same answer.

## 7. Rulings and revisions — added 2026-08-19 after the cross-harness pass

### D1 is RULED by the human: milestone 4, backlog rides alongside

F-04 is **milestone 4**. ROADMAP gains a section naming the dispatch
slice as its goal, plus one sentence recording that the 42 inherited
cards carrying `milestone: 4` are standing backlog rather than the
milestone's content. No re-stamping. Cards written under this plan
carry `milestone: 4`.

**D2 the architect takes**: declare C-15 with touch slug `app-dispatch`,
on the plan's own reasoning — it is the cheapest it will ever be, and
the alternative fences every dispatch card against every genesis card
for the life of the feature.

**D3 is RULED by the human (2026-08-20): the app may write exactly
`builder:` and `verifier:` — nothing else.** Single-field frontmatter
edits, written atomically, refused if the file changed since it was
read, unknown keys preserved byte-for-byte. The deciding argument was
cross-harness: the two models talk only through the repo, and
`.nputer/` is gitignored so a selection stored there cannot reach an
agent on another machine. The card is the only channel that reaches
both. **What this ruling does NOT extend to is `status:`** — D4's
measurement stands.

**D5 is deliberately held** pending a north-star-level question the
human raised in the same session: whether nputer is the app you run
the process FROM (set builder/verifier there, talk to the orchestrator
there) or a mirror that follows work you run from the agents' own
apps. See the room when it opens; D5's answer falls out of that one.

### The card ids in §2 are stale

The plan drafted `T-081`…`T-090`. **T-081, T-082 and T-083 were claimed
by other work on 2026-08-19** (the denial relay, the auth command, and
the range rule). The block starts at **T-084**. Re-derive the maximum id
before writing rather than trusting either figure.

### What `docs/design/cross-harness-plan.md` changes about T-086

The adapter card was drafted before anything was known about a second
CLI. Three things now bear on it, and two make it **easier** than the
plan assumed:

1. **The seam already exists.** `AgentAdapter` is fully declarative and
   its `parse` field is already a `ParseMode` enum with a single
   variant. A second adapter does not need the struct redesigned; it
   needs a second `ParseMode` and its parser. ADR-003's "one adapter
   entry" promise is more credible than §4 of this plan implied.
2. **The argv shape fits.** A subcommand is just the first element of
   `spawn_args`, and a resume id is one argv element, which is exactly
   what `SESSION_ID_SLOT` already requires.
3. **THE REAL WORK IS NOT IN THE TABLE. IT IS IN THE RUNNER'S ERROR
   TAXONOMY.** `TurnError::ToolDenied`'s own doc comment states the turn
   "DIED because a tool it needed was REFUSED". The 2026-08-19
   observation falsifies that for Claude — two denials, agent recovered,
   `is_error: false`, exit 0 — and the published Codex docs assert it
   *is* true for `codex exec`, where an approval request terminates the
   turn unless pre-authorised. **On the same event one harness degrades
   and the other terminates.** A permission policy therefore cannot be a
   shared constant across adapters, and T-086 must carry per-adapter
   denial semantics as an explicit field or an explicit ruling — not as
   the unstated assumption it is today.

**D5 (`model@session`) gains an asymmetry it did not have.** Codex's
`exec` accepts `--model`; nputer deliberately never passes one to
Claude, on stated ADR-003 grounds. So the rule cannot stay global: it
becomes per-adapter, or ADR-003's reasoning is revisited. Rule it before
T-086, not inside it.

**A caution that governs all of the above.** Every Codex claim here is
read from published documentation. **The binary is not installed on this
machine**, so none of it has been executed. `codex --help` is three
seconds of work and supersedes the lot — and T-082 landed this same
afternoon precisely because a command nobody ran got shipped.

