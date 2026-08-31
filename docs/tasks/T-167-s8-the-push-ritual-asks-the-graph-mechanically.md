---
id: T-167-s8
title: The push ritual asks the graph mechanically — one seat broke ask-after-every-write three times in one day, and a rule a careful hand breaks thrice is a hook's job
feature: F-06
milestone: 4
priority: 2
size: S
status: verifying
blocked_by: []
touches: [.claude, tools/e2e]
suggested_by: integrator nputer-4e, third graph-staleness CI red of 2026-08-30
builder:
verifier:
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review:
---

Three CI runs redded on graph currency in one day, same seat, same
sequence each time: regen -> another edit to an indexed file (a pin
correction, a comment, a census row) -> push without re-asking.
STATE's rule ("ask AGAIN after every write") held every time in
retrospect and never at the moment — batching beats it out of a hand
that knows it. The classes the day already carded are siblings, not
this: T-167-s2 alarms on HEADROOM, T-167-s7 on degradation; nothing
guards CURRENCY at the push.

The ask: a mechanical pre-push check — `index --check` green or the
push refuses with the regen command printed. The seat decides the
home (a hook beside lane-fence.mjs, or a ritual line the push script
owns) and the escape spelling for the rare intentional push of a
stale graph (should not exist; argue it if found). Evidence: the
three run ids are in the day's records (T-143-s4's, the wave-3
record's addendum context, and this card's own filing red).

## Triage — standing sitting #3, 2026-08-30 (architect seat)

**PROMOTED F-06 p2**, at `@ 51fa31c0964c`. The parked-until-the-fourth
condition the card set for itself is superseded: this sitting is the
"next standing sitting" arm of its own RESURFACES line, and it fires
first. A rule broken three times in one day by a seat that had read the
rule is not a discipline problem any more.

**THE EVIDENCE, SAID AT THE STRENGTH THIS SEAT CAN ACTUALLY VOUCH FOR.**
The claim of a third instance is the FILER's, and this seat did not
re-read the CI runs — no run id is derivable from this checkout, and a
card that pretended otherwise would be inventing corroboration. What IS
derivable here, and does corroborate the class:
`command grep -n 'ask-after-every-write'
docs/checkpoints/2026-08-30-standing-triage-2.md` finds that record
naming the rule *"broken twice in one day"* at its own base, in a
sitting held hours before this card was filed. Two instances on the
record plus the filer's third is the pattern; the fourth is what this
card exists to make impossible.

**THE HOME IS STILL THE SEAT'S TO CHOOSE AND THE FENCE CARRIES BOTH.**
`.claude` is a real fence entry here — `git ls-files .claude` is three
tracked files (`hooks/lane-fence.mjs`, `hooks/lane-fence-hook.mjs`,
`settings.json`), and the existing wiring is a `PreToolUse` matcher on
`Edit|Write|NotebookEdit` pointing at the hook runner. A `Bash` matcher
is the obvious neighbouring shape, and it is the seat's call whether the
guard lives there or in a script `tools/e2e` owns. Both homes are inside
this fence, which is why the fence names both.

**ONE PROHIBITION ADDED AT PROMOTION, because it is the failure this
repository has already paid for.** The guard SHALL ask `index --check`
and read its exit; it SHALL NOT compute staleness itself. A second
implementation of the currency question is T-057's shape, and a guard
that disagreed with the gate would be worse than no guard — it would
teach the seat to override it.

**AND THE COST IS NAMED RATHER THAN DISCOVERED IN THE LANE.**
`index --check` is `cargo run -p nputer-index -- index --check
--root ../..` from `app/src-tauri/`, and CONVENTIONS' standing
cargo-cache-cliff hazard is about exactly how long that can take on a
cold or fat target directory. A guard that adds a slow, sometimes
minutes-long step to every `git push` will be disabled by the first
person it inconveniences. Deciding what the guard runs — the full check,
or a cheaper currency question that still delegates its verdict — is
part of this card, not a detail under it.

## Acceptance criteria

- WHEN a push of this repository is attempted AND the committed graph is
  not current, THE push SHALL be refused with the regen command printed
  verbatim in the refusal.
- THE guard SHALL derive its verdict from `index --check`'s own exit
  code, and SHALL NOT restate or re-derive the currency rule. WHERE the
  guard runs something cheaper than the full check, IT SHALL still take
  its VERDICT from the check rather than from its own reading.
- THE guard SHALL distinguish "the check could not run" from "the graph
  is stale" and SHALL NOT read the first as the second — `index --check`
  publishes exit 3 for a check that could not run and exit 1 for STALE
  (the exit legend is in CONVENTIONS' per-package bullet for the Rust
  workspace, read there rather than restated here), and a guard that
  collapsed them would refuse every push made without a toolchain.
- THE lane SHALL state, on this card, the wall-clock cost of what the
  guard runs, measured at its own ref, and SHALL argue that cost against
  the frequency of a push.
- WHERE an escape is provided at all, THE escape SHALL be explicit,
  spelled on the command line rather than in an environment default, and
  SHALL print what it is overriding. WHERE the lane finds no legitimate
  case for one, IT SHALL ship no escape and say so on this card — a
  hatch nobody needs is a hatch that gets used.
- THE guard SHALL NOT fire outside this repository's own checkouts, and
  SHALL NOT fire on a lane worktree's own pushes IF the lane cannot
  regenerate the graph inside its fence — the lane SHALL derive which of
  those is true rather than assume it.
- Verification: headless. A positive control in BOTH directions — a
  current graph pushes, a stale graph is refused, driven over a fixture
  rather than by making this repository's own graph stale.

**PREFLIGHT AT PROMOTION, AND WHY IT IS NOT GREEN.**
`node scripts/brief.mjs --task T-167-s8 --preflight` from tools/e2e at
`@ 51fa31c0964c` exits **1** with exactly ONE finding, and it is a live
lane: `T-154-s2` holds `.claude` AND `tools/e2e`, both of this card's
entries. That is a fact about the clock, not about the card, and it is
not dischargeable by a `PREFLIGHT RULING` line — the preflight says so
itself when one is tried. Every other claim class ran clean; the figures
are printed in this sitting's record.

## Implementation notes

> ─────────────────── THE BLIND LINE — VERIFIER, STOP ───────────────────
>
> **EVERYTHING BELOW THIS LINE IS EXECUTOR-DERIVED AND IS NOT PART OF THE
> SPEC.** The spec is everything ABOVE it: the card's body, its Acceptance
> criteria, and its triage and absorption sections. Those are what stood
> when this lane was cut, and `method/roles/executor.md` rules that the
> card a verifier is owed is the card AT THE BASE REF — which is this file
> without this section.
>
> **DO NOT READ ON UNTIL YOUR ATTACK SET IS WRITTEN.** Below are mutant
> counts, suite figures, timings, ports, commit hashes and the arguments
> this seat found persuasive. Every one of them would seed an attack set
> with the author's own model of what mattered — and a guard's
> characteristic defect lives exactly where its author did not look
> (`method/tasks/TASK-FORMAT.md`, the guard-class paragraph).
>
> **THE FIGURES CANNOT SIMPLY BE OMITTED**, which is why this is a marker
> and not a deletion: this card's FOURTH criterion requires the wall-clock
> cost to be stated ON THIS CARD, and CONVENTIONS' POISON DRILL requires
> the drill count and its restoration proof to be recorded. Both are
> discharged below, behind this line.
>
> **AND THE BLINDNESS IS A DISCIPLINE, NOT A GUARANTEE** — an executor's
> report commonly travels in the same message that dispatches the
> verification, so this line is DISCLOSED rather than enforced
> (`method/roles/executor.md`, the base-ref ruling and the limit it states
> in the same breath).
> ───────────────────────────────────────────────────────────────────────

**BUILT AT `b8dcb37`, MEASURED THERE, IN THE LANE
`/Users/ujju/Projects/nputer-T-167-s8` CUT FROM `bd8a8e8`.** The PUSH
trigger shipped. The ABSORBED trigger did NOT, and that is a finding
rather than an omission — it is routed as **`T-193`** and the reason is
below.

### What landed

- `.claude/hooks/push-guard.mjs` — the decision. Zero non-builtin
  imports; the lane facts it needs (`LANE_BRANCH_RE`, `readManifest`,
  `readHeadRef`, `findCheckoutRoot`, `within`) are IMPORTED from
  `lane-fence.mjs` rather than re-spelled.
- `.claude/hooks/push-guard-hook.mjs` — the runner. Exit 2 refuses,
  exit 0 allows, and an allow that left the graph UNVERIFIED prints its
  reason at exit 0 (`ANNOUNCED_ALLOW_CODES`).
- `.claude/settings.json` — a `Bash` matcher beside the existing
  `Edit|Write|NotebookEdit` one. The fence hook's entry is untouched.
- `tools/e2e/tests/push-guard.spec.ts` — 21 bodies, no browser.

### Each criterion, with its evidence

1. **Refuse a stale push, regen command verbatim** — MET. The refusal
   quotes `index --check`'s own stdout, which carries the `regenerate:`
   line `check.rs`'s `render` emits; this guard holds no copy of that
   command. Body *"a STALE graph refuses the push and quotes the check's
   own regenerate line"*; mutant **M12** (drop the quote) kills it.
2. **Verdict from the check's exit code, never re-derived** — MET. Body
   *"the guard reads the exit code and not the report's words"* drives
   both crossings: a CURRENT exit with a STALE report allows, a STALE
   exit with a CURRENT report refuses. Nothing in the guard computes
   staleness. Nothing cheaper than the full check is run: **the cheap
   pre-filters are all questions about the SEAT** (is this a push, is
   this repository ours, can this lane regenerate), never about currency.
3. **Could-not-run is not staleness** — MET. Only exit 1 refuses. Exits
   2 and 3 allow and say so; a `cargo` that never starts allows and says
   so. Bodies for each; mutant **M2** (collapse 3 into stale) and **M7**
   (absent toolchain refuses) kill them.
4. **The wall-clock cost, measured at this ref, argued against the
   frequency of a push** — MET, below.
5. **The escape** — NO ESCAPE SHIPPED, argued below.
6. **Where it does not fire** — MET, DERIVED, below.
7. **Positive control both directions over a fixture** — MET. Every
   verdict body drives the REAL runner as a subprocess over a git
   repository built under `mkdtemp`, with a FAKE `cargo` first on PATH
   whose exit code the fixture chooses. This repository's own graph is
   never made stale. The shim writes a marker when it runs, so *"the
   check was NOT spawned"* is asserted as well as *"it was"*.

### THE COST, MEASURED AT `b8dcb37` ON Mac.lan, node v22.22.0

Two numbers, because the guard has two paths:

| what | n | median | p95 |
|---|---|---|---|
| a Bash call that is NOT a push | 100 | **39.35 ms** | 40.62 ms |
| a push whose seat cannot act (lane arm) | 100 | **39.70 ms** | 43.21 ms |

Both are node's own startup and nothing else — the same ~39 ms
`lane-fence.mjs`'s header measures for its runner, and for the same
reason: the decision is reached before the filesystem is touched.

And the path that actually asks, measured END TO END through the real
runner against the real `index --check` in a detached checkout at
`b8dcb37` with its own `CARGO_TARGET_DIR` (exit 0, graph current):

- **COLD** (the crate not yet built): **7.68 s**, one time per checkout.
- **WARM**: **1.51 / 1.48 / 1.51 s**.
- The check ALONE, three runs in the lane: 1.65 / 1.38 / 1.63 s.
- `cargo build -p nputer-index` from cold in the lane: **9.50 s**.

**THE ARGUMENT.** The card was right to name this as the thing that gets
a guard disabled, and the fear does not survive the measurement: the
crate carries **no tauri dependency** (ADR-015), so its cold build is ten
seconds and not the minutes CONVENTIONS' cargo-cache-cliff hazard warns
about for the app workspace. Against the frequency of a push — batched by
standing order, because *"A PUSH CANCELS THE RUNNING CI JOB"*
(docs/STATE.md) — a second and a half is cheaper than one superseded CI
run, and far cheaper than the four graph-currency reds this card
enumerates. **The tax that needed watching was not the check but the
MATCHER**: a `Bash` hook fires on every command in the session, and 39 ms
of node startup on a non-push is the price of the whole guard on the
common path.

### THE ESCAPE: NONE SHIPPED, AND THE CANDIDATE ARGUED

The card asked for the spelling *"for the rare intentional push of a
stale graph (should not exist; argue it if found)"*. One candidate was
found and it is **refused as a hatch**: `index --check` asks about the
WORKING TREE while a push carries COMMITS, so a tree with uncommitted
edits to indexed files can be STALE for a push whose commits are current.
**That is a SCOPE MISMATCH, not an intentional stale push** — and its
remedy is one command (`git stash`), which the refusal now NAMES when it
detects a dirty tree. A hatch for a case that already has a one-command
remedy is a hatch that gets used for every other case. `dirtyTree` reaches
no verdict and cannot change one; mutant **M13** proves the sentence is
load-bearing (1 failed / 20 passed).

**AND THE MECHANISM WOULD HAVE BEEN THE INTERESTING HALF, so it is
recorded for whoever revisits this**: the criterion's *"on the command
line rather than in an environment default"* is enforceable exactly by
reading the escape out of the COMMAND STRING and never out of
`process.env` — an inline `VAR=x git push` is visible to the hook, and a
profile-exported one is not distinguishable from a default. That is the
construction to use IF an escape is ever ruled necessary.

### CRITERION 6, DERIVED RATHER THAN ASSUMED

- **Outside this repository's checkouts**: the test is whether
  `app/src-tauri/crates/nputer-index/Cargo.toml` is present — the crate
  the guard delegates to. A checkout without it is one where
  `index --check` is not a question that can be asked. Not the directory
  name, which a clone can change.
- **A lane's own push**: the manifest already carries the lane's expanded
  fence, so the question is containment — does any fenced domain hold
  `docs/architecture/graph.json`? `laneCanRegenerate` asks exactly that.
  **THE ANSWER FOR ESSENTIALLY EVERY LANE IS NO**, this one included
  (`[.claude, tools/e2e]`), so a lane is not refused: it has no legal way
  to clear the refusal, the regen is the integrator's at the merge, and a
  guard with no remedy is a guard somebody disables. **Both directions are
  driven** — a fence of `[docs/architecture]` IS asked and IS refused.

### THE DRILL — 17 OF 17, AND ONE OF THEM WAS VACUOUS FIRST

Detached scratch worktree `/private/tmp/nd-T-167-s8` at the NAMED commit
`b8dcb37`, own `CARGO_TARGET_DIR` at `<scratch>/target`, stem derived from
the card id. Every mutant: ONE SIDE ONLY (always the code, never an
assertion, never a shared literal), diff read back with `git -C <bench>
diff`, suite run, RED required, restored with `git restore
--source=b8dcb37 --staged --worktree --`, proved by **sha256** against
`git show b8dcb37:<path>`. **17 killed, 0 survived, every restore
sha256-ok, bench `git status` CLEAN afterwards.**

**M13 WAS A FALSE KILL ON ITS FIRST RUN AND IS RECORDED AS SUCH**, because
this is the failure the drill's own rule exists to catch. The mutation
produced a nested ternary with no final `:`, so the module never parsed,
playwright never loaded, and the run was RED with **`0 failed` and no
passed count at all** — a red over zero bodies, which is the mirror of
CONVENTIONS' *"an exit 0 over zero bodies is not a pass"*. The tell was
the missing passed count. Re-run with a valid one-token mutation
(`dirtyTree(root)` → `false`): **1 failed / 20 passed**, naming the
dirty-tree body. The rule that caught it is *"confirm the mutated TEXT is
what you intended rather than only that a substitution COUNT was
non-zero"*.

### THE GUARD FIRES, MEASURED ON A REMOTE RATHER THAN ON AN EXIT CODE

**EVERY OTHER BODY IN THE SPEC ASSERTS WHAT THE GUARD DECIDED. THESE
ASSERT WHAT A STALE COMMIT DID.** The distinction is the whole
guard-class problem: a decision module returning `block` and a push
actually not happening are two different claims, and only the second one
is the guard. Three arms, one experiment, all over a bare repository
inside the fixture's own `mkdtemp` root — nothing leaves the machine:

1. **THE DEFECT, REPRODUCED** — *"WITHOUT the guard, a stale graph
   reaches the remote"*. The guard is simply not consulted, the push is
   run, and `origin`'s `refs/heads/main` MOVES to the unpushed commit.
   **Without this arm the other two are satisfied by a fixture that could
   never push in the first place.**
2. **THE DEFECT, PREVENTED** — *"WITH the guard, the same stale graph
   never reaches the remote"*. Same fixture shape, same stale check; the
   wired hook refuses, the push is never run, and the remote ref is
   asserted UNCHANGED and still not equal to the local commit.
3. **AND IT IS NOT A GUARD THAT REFUSES EVERYTHING** — *"WITH the guard,
   a current graph still reaches the remote"*: the remote ref MOVES.

**AND THE REFUSAL TRAVELS THROUGH THE WIRED COMMAND, NOT A PATH THE SPEC
TYPED.** `runWiredHook` reads the `Bash` matcher's own command string out
of the committed `.claude/settings.json`, matches it against the tool name
as a regex the way a harness does, and runs THAT string through a real
shell with `CLAUDE_PROJECT_DIR` set as the harness sets it. So a settings
entry that stopped pointing at a working guard reds these bodies while
every `decide`-level body stayed green — which was the real hole, since
until now nothing connected "the module refuses" to "the configured hook
refuses".

**THE HARNESS CONTRACT IS WRITTEN OUT RATHER THAN ASSUMED**
(`pushThroughGuard`): exit 2 blocks, anything else proceeds. That is the
one thing these bodies take on trust, it is three lines long, and it is
stated here so a verifier can attack it. What CANNOT be proved from
inside this repository is that the real harness honours exit 2 — that is
the harness's own contract, and the guard is advice to a cooperating
harness exactly as `lane-fence.mjs`'s limit 5 already says of itself.

**ARM 1 CANNOT BE KILLED BY MUTATING THE GUARD, AND THAT IS WHAT MAKES IT
A CONTROL** — it never consults the guard, so no change to guard code can
move it. It is not thereby unfalsifiable: it is anchored on a
FIXTURE-side precondition (the remote starts one commit behind), and the
drill below kills it from that side.

### THE SECOND DRILL PASS — THE FIRES-CONTROL, 4 OF 4, AFTER ONE SURVIVED

Same bench discipline, at the named commit the bodies were written at.

- **N1 — the headline.** The runner's `process.exit(2)` → `process.exit(0)`:
  the guard's REFUSAL removed and nothing else changed. **RED, 7 failed /
  18 passed**, naming *"WITH the guard, the same stale graph never reaches
  the remote"*. That is the control stated as an experiment: remove the
  refusal, and the stale commit lands on the remote.
- **N2** — `settings.json`'s matcher `Bash` → `BashX`: **RED, 4 failed /
  21 passed.** Settings drift is visible; the wired command no longer
  resolves.
- **N3** — the stale verdict's `block(` → `allow(`: **RED, 7 failed / 18
  passed.**
- **N4 — the FIXTURE side**, because arm 1 cannot be killed from the guard
  side by construction: push the second commit at build time so the remote
  no longer starts behind. **RED, 3 failed / 22 passed.**

All four restored by sha256; bench `git status` CLEAN.

**N4 SURVIVED ON ITS FIRST FORM AND THE SURVIVAL WAS THE USEFUL RESULT —
25 passed, 0 failed.** The first N4 reverted the second commit's file
content, expecting the commit to vanish. It did not: `remote.git` lives
INSIDE the fixture root, so `git add -A` had been committing it as a
GITLINK, and the second commit was non-empty for a reason that had
nothing to do with the file it was supposed to carry. **The arm's
precondition could not be killed from the side it actually depends on**,
which is precisely what a surviving mutant is for. Fixed by ignoring
`remote.git/` in the fixture; re-drilled; RED.

**TWO MUTANTS IN THIS CARD FAILED TO MEAN WHAT THEY SAID** — M13 in the
first pass (a syntax error, RED over zero bodies) and N4 here (a valid
mutation of the wrong thing, GREEN over the right ones). One failed
open, one failed closed. Both were caught by reading the COUNTS rather
than the exit code, and both are the same rule: *confirm the mutated
behaviour, not the substitution count.*

### WHAT WAS NOT BUILT: THE ABSORBED T-181 TRIGGER — ROUTED AS `T-193`

**It is not a fence problem. It is a collision with a ratified @human
decision, and the lane is not the seat that resolves it.** The absorbed
criterion requires a guard that REFUSES a commit unless a record under
`docs/checkpoints/` carries certain text. `ADR-019 §Records` says: *"No
suite, gate or generator may DEPEND on this directory's contents."*

The clause is **unamended** (ADR-020's own `## Supersedes / amends` reads
*"Amends nothing"*; ADR-019's four addenda re-affirm it) and is restated
in **seven** places, including `docs/checkpoints/TEMPLATE.md`'s own
*"**NOTHING MAY READ THESE LINES BACK** … A reporter a human or a
checkpointing integrator runs BY HAND over the records is fine; **a gate
is not.**"* The room that produced it moved in the LOOSENING direction
(*"NO DEPENDENCY, not as no walk"*) and still lands the wrong side of
this. **Four cards have already declined this exact build** — `T-156-s1`,
`T-156-s6`, `T-157`, `T-157-s2` — and `tools/e2e/tests/session-economics.spec.ts`
carries a lane's written refusal in its docblock.

**NEITHER T-181, NOR THE ABSORPTION BLOCK, NOR THE TRIAGE RECORD CITES
THE CLAUSE.** `T-193` carries the evidence, the one distinction that might
survive a ruling (a pre-commit guard reads only the record in the commit
under judgement, so it cannot red retroactively and lacks the hazard the
clause protects against), and **a shape that needs no ruling at all**:
key the trigger on the FILENAME — the contact `docs-gate.mjs` already has
and Addendum 2 blessed — and demand the reading in the COMMIT MESSAGE,
which CONVENTIONS already prescribes for the METHOD EVAL GATE for a
directly applicable reason. Had that been the written criterion it was
buildable in this lane.

### THE INTEGRATOR-REVIEW HALF, TAKEN BY THIS SEAT — AND ITS LIMIT

`touches: [.claude, tools/e2e]` reaches no shipped slug (CONVENTIONS,
THE SHIPPED PARTITION names `tools/e2e` as the settling case for NOT
SHIPPED), so the ceremony row is **S, diff outside shipped code**.

**WHAT I REVIEWED**: that the diff stays inside the fence (four paths, all
under `.claude` or `tools/e2e`); that no constant is held without being
compared to an authority (the four exit codes against CONVENTIONS' own
legend, the command against its bullet, both paths against the live
tree); that the fence hook's matcher and behaviour are untouched; that
every verdict body drives the real runner rather than a stub; that both
directions of every allow are controlled by a refusal in the same fixture
shape; and that the guard fails OPEN on every uncertainty.

**WHAT I COULD NOT REVIEW, AND IT IS THE HALF THAT MATTERS**: whether the
guard notices the right things. I chose what it refuses, I chose what it
stands aside for, and I wrote the bodies that agree with me. A guard's
characteristic defect looks exactly like success.

**AND THE FORMAT AGREES WITH THAT AND THE DISPATCH DID NOT.**
`method/tasks/TASK-FORMAT.md`: *"**A GUARD-CLASS CARD REQUIRES `review:
independent`, AND THE FIELD IS SET AT DISPATCH.** Where the card's SUBJECT
is a guard — a hook, a gate, a keeper, a lint, a permission check …
anything whose job is to REFUSE … **the builder of a cage is not its
inspector.**"* This card's subject is a hook whose job is to refuse; by
that rule's own test (*"Ask what the card is ABOUT, not what it
touches"*) it is guard-class. **`review:` was EMPTY at dispatch, and the
dispatch summary said no verifier was owed.** The ceremony ROW and the
guard-class rule live in the same file and answer different questions —
the row settles whether a separate INTEGRATOR is owed, the guard-class
rule settles whose hand may hold the REVIEW — so this lane stamps
`verifying` rather than `done` and leaves the verifier fields empty. **A
lane does not get to award itself the review its own format says another
hand must hold**, and stamping `done` would claim a guarantee that was
never taken.

### THE GATES, DERIVED OVER THE MERGE FORECAST (6 paths at `7850f89`)

Derived MECHANICALLY, by feeding the merge-forecast path list
(`git merge-tree --write-tree main HEAD`, then
`git diff --name-only main "$TREE"`) through `range-rule.mjs`'s own
`graphRegenTrigger` / `bootGateTrigger` / `triggerMatches` — the triggers
read out of CONVENTIONS' own bullets rather than retyped:

- **GRAPH REGEN — FIRES**, on one path: `tools/e2e/tests/push-guard.spec.ts`
  (`.ts` outside `docs/`). The two `.mjs` hooks do NOT match the suffix
  set, which is worth knowing. **SATISFIED**: `index --check` exit **0**,
  CURRENT, 1143153 bytes / 199 files / 2436 symbols / 2351 edges, budget
  53.3%. Asked LAST, after this file's final write.
- **BOOT GATE — NOT OWED**: no `app/src-tauri/**`, no `app/src/**`,
  neither manifest.
- **METHOD EVAL GATE — NOT OWED**: no `method/**`.
- **DOCS GATE — FIRES**, exit **1** (a verdict, not a failure), on the two
  card paths. It named three suites and all three were run:
  **lib/parser `npx vitest run` 344/344 passed** (16 files) ·
  **app `npm test` 1077/1077 passed** (49 files) ·
  **tools/e2e `npm test` 363 passed / 3 failed in 4.5m** — attributed
  below. (An earlier run at the same ref-minus-the-fires-control was 359
  passed / the same 3 failed in 4.1m; the delta is this card's own four
  new bodies, and the two times are close enough to exclude the cargo
  cache cliff, whose signature is the suite's OWN reported time moving.)

Also green, unpiped: tools/e2e `npm run typecheck` **0** ·
`lint:tokens --selftest` **0** · `lint:tokens` **0** · `lint:docs` **0**.

### THE THREE E2E REDS ARE NOT THIS LANE'S, AND THE CONTROL PROVES IT

`dispatch-order.spec.ts`'s *"--dispatch runs on the live repository"* and
`session-economics.spec.ts`'s two live-CLI bodies red. **THE CAUSE IS A
LANE CUT ON THIS MACHINE WHILE THE SUITE RAN**: `T-186` holds a worktree
and its card exists in NO checkout cut before it, so the assembler
correctly refuses — *"a lane whose fence cannot be read is a fence nobody
can be disjoint from"* — and bodies asserting exit 0 from that CLI get 1.

**THE CONTROL, RUN RATHER THAN ARGUED**: the same three bodies, in the
detached bench checked out at **this lane's own base `bd8a8e8`** where
this diff does not exist, fail **identically — 3 failed / 21 passed**. A
re-run would have been the wrong instrument (the lane is still live);
the right one is the base.

**AND THE CLASS IS ALREADY CARDED**: `T-143-s1`, *"Two session-economics
bodies assert exit 0 from a brief the live lane list can correctly
refuse… the machine-scoped check inside a spec"* — `dispatch-order`'s
live body is the third instance of the same mechanism and this is a
CORROBORATION for that card rather than a new one (TASK-FORMAT: a second
instance is worth more attached to the first).

### THE CENSUS-CURRENCY GATE IS OWED AT THE MERGE AND THIS FENCE CANNOT PAY IT

`npm run capabilities:check` exits **1 — STALE**: committed 27333 bytes
against a fresh generation of 28765, because this lane adds **21** test
names (`command grep -c 'test("' tools/e2e/tests/push-guard.spec.ts`).

**THE REGENERATION IS THE INTEGRATOR'S AND THE FENCE IS RIGHT TO EXCLUDE
IT.** `docs/CAPABILITIES.md` is outside `[.claude, tools/e2e]`, and the
established shape is that it moves in the **Checkpoint** commit —
`git log -- docs/CAPABILITIES.md` shows checkpoints and two explicit
by-hand regenerations, and **`T-154`, the card that added
`lane-fence.spec.ts`, has ZERO lane commits touching it** while its
checkpoint subject reads *"CAPABILITIES at the runner's own 258"*. So
this is not an unpaid debt but the ordinary division of labour.

**THE MERGE OWES**: `npm run capabilities` from tools/e2e, landed in the
checkpoint commit. Until it does, CI's `capabilities:check` step reds —
by design, which is what that gate is for.

### CORRECTIONS TO THE DISPATCH BRIEF

1. **`lanes live right now: none` was stale, and it went on moving all
   session.** At `~01:30Z` on Mac.lan there were FOUR live lanes — this
   one, `T-162-s1` (`[docs/decisions, docs/rooms]`), `T-182`
   (`[docs/CONVENTIONS.md]`) and `T-184` (`app-agent`), all disjoint from
   this fence, so the dispatch was still sound. By `~04:30Z` the set was
   FIVE and almost entirely different: `T-112-s4`, `T-142`, this one,
   `T-184`, `T-186`. **The brief's own rule is the right one — a
   live-environment fact carries the time it was READ and is re-read at
   dispatch — and this lane is the case that shows re-reading ONCE is not
   enough either**: the set churned twice mid-lane, and the third churn
   is what redded three e2e bodies.
2. **The e2e lane's default port was NOT free.** 14520 was held by
   another lane's server (`node`, pid 56458, `127.0.0.1:14520`), so this
   lane ran on **14678** and the drill bench on **14679**, both derived
   from the card id and both lsof-read to zero rows before use. This is
   `lane-protocol.md` rule 4's MACHINE-scoped surface in the wild: four
   lanes with disjoint fences, disjoint trees and disjoint indexes still
   contend for one defaulted port.
3. **`review:` was empty on a guard-class card** — see above.

## Verdicts

FOURTH STRIKE (2026-08-30, run on 2e4b76f's rerun): T-143-s3's merged code files pushed without their regen — masked in the original run because the cargo intermittent redded BEFORE the graph step ran, and revealed only when the rerun cleared cargo. A guard at the push would have caught it regardless of step order.

Absorbs: T-181

### APPROVED WITH ASSIGNED CORRECTIONS — 2026-08-31, blind verifier, claude-opus-5@subagent, measured at `47d35f4`

**PHASE 1 WAS WRITTEN AND SAVED BEFORE THE DIFF, THE NOTES OR ANY COMMIT
BODY WAS OPENED** — sha256
`141e3de6146477a36f597a5ee19ffae5f434c2971a31d9af5ec952eb635fb179`,
written 04:56 local, kept outside this tree. **DISCLOSURE, because the
blindness is a discipline and not a guarantee**: deriving the merge-base
with `git log --oneline base..HEAD` printed this lane's seven commit
SUBJECTS, which `method/roles/verifier.md` step 0 forbids in phase 1.
They leaked the guard's shape, that three arms were measured on a real
remote through the wired settings command, the `remote.git/` fixture fix,
and the final suite figures. The attack set records which of its items
that pre-answered (one, partly) and was otherwise written from the card.

**THE QUESTION THIS SEAT SETTLED BEFORE LOOKING** — is it enough to prove
a decision module DECIDES to refuse, or must the refusal be shown to
travel through the mechanism actually wired? Phase 1 ruled: **not
enough**, and demanded the hook path be resolved by READING
`.claude/settings.json` rather than typed. **The lane built that and
more.** `runWiredHook` reads the `Bash` matcher's own command out of the
committed settings; the three fires-control arms measure the REMOTE REF
rather than an exit code. Proof it is load-bearing, my own mutant:
**removing the `Bash` entry from settings.json kills 4 of 25 bodies**
(`suite_exit=1 passed=21 failed=4`), naming both guarded arms, the wired
body and the wiring body. Phase 1's predicted finding #2 (path typed,
wiring unpinned) is **WRONG, in the right direction** — this is the
strongest half of the diff.

**WHAT ELSE FAILED TO BREAK IT.** Command classifier: `git -C x push`,
`cd x && git push`, `git\tpush`, `git push2 || git push`, `git   push`
all recognised; `git push --dry-run`, `alias gp='git push'`,
`echo "…git push"` correctly not. Fail-open verified end to end at exits
2, 3, null and no-cargo. `--root` **removed entirely** is killed by
exactly ONE body (a count of one IS the non-duplication, shape SIX).
Fence clean (4 paths in `[.claude, tools/e2e]`, 3 in always-writable
`docs/tasks`). No injection surface: the guard spawns `cargo` and `git`
through argv arrays, never a shell string. Non-push cost re-measured
independently: **median 38 ms over n=20**, against the card's 39.35 ms.

**FINDING 1 — THE GUARD'S OWN FALSE-RED MECHANISM IS UNPINNED, IN BOTH
DIRECTIONS. Poison shape EIGHT (prefix form).** The shipped code is
CORRECT; nothing is broken today. What is missing is the keeper. Drilled
in a detached bench at `47d35f4`, one side only, diff read back with
`git -C <bench> diff`, restored and sha256-proved each time — **baseline
25 passed / 0 failed**:

| mutant of `push-guard.mjs` | result | what it would do in production |
|---|---|---|
| `"--root", "../.."` → `"--root", ".."` | **SURVIVED** 25/0 | root becomes `app/` → graph MISSING → exit 1 → **refuses every push in the repo** |
| `"--root", "../.."` → bare `"--root"` | **SURVIVED** 25/0 | cargo usage error → exit 2 → `check-inconclusive` → **allows every push, forever** |
| `CHECK_DIR_REL_PATH` `"app/src-tauri"` → `"docs"` | **SURVIVED** 25/0 | `--root ../..` resolves above the repo → exit 1 → **refuses every push** |
| `"--root"` deleted outright | KILLED, 1 body | (the only arm that is pinned) |

The cause is one assertion: ``expect(bullet).toContain(`cargo
${CHECK_ARGV.join(" ")}`)`` is a SUBSTRING search, and **every proper
prefix of the documented command is also a substring of it**. Beside it,
`expect(bullet).toContain("run from")` ties `CHECK_DIR_REL_PATH` to
nothing at all. So the exact mechanism CONVENTIONS says four sessions
reproduced — and which this file's own header names at length as the bug
that *"would refuse every push in the repository"* — has no keeper, and
it is unpinned in BOTH the over-refusing and the never-refusing
direction. This is the guard-class defect the card exists to prevent, one
layer up: the pin, not the guard.

**FINDING 2 — A FALSE POSITIVE DOES NOT "THEN ALLOW"; ON A STALE GRAPH IT
REFUSES.** `gitInvocations`'s docblock argues *"A FALSE POSITIVE costs a
second and a half and then allows, because only the check can refuse."*
That is false — the check IS the refusal, so a false positive inherits
it. Measured against a real stale-answering shim through the real runner:
`echo git push`, `man git push` and `grep -rn git push /tmp` each return
**exit 2, "PUSH REFUSED"**. On a 15-probe corpus the scanner shows 5
false positives (`echo git push`, `# git push`, `man git push`,
`grep -rn git push /tmp`, a heredoc line) and 1 false negative
(`/usr/bin/git push`, which the docblock DOES declare). Consequence is
bounded — it bites only while the graph is already stale, and the refusal
explains itself — but the reasoning shipped in the file is wrong and
would mislead the next editor.

**FINDING 3 — NOTES FIGURES, THREE STALE OR MISNAMED.** (a) *"21
bodies"* / *"adds 21 test names"*: the file has **25** bodies, and the
quoted derive command `grep -c 'test("'` now answers **26**, because line
220's `.test("Bash")` matches it. SWEEP RUN, and it is a PRE-EXISTING
class, not this lane's: `brief.spec.ts` (38 vs 35), `card-figures.spec.ts`
(29 vs 28) and `lane-fence.spec.ts` (38 vs 37) already carry the same
delta, and `capabilities.mjs` itself anchors on `/^\s*test\(\s*"/` so the
GENERATOR is correct — only the convenience grep over-counts.
(b) `capabilities:check` now reports fresh **29053** bytes, not the 28765
recorded. (c) The N4 mechanism is misnamed: `remote.git` was **not**
committed as a GITLINK. Reproduced independently — a *bare* repo has no
`.git` entry, so `git add -A` records its 24 files as ordinary blobs
(`100644`/`100755`); `git ls-tree HEAD | grep 160000` finds nothing. The
diagnosis, the conclusion and the fix are all correct; only the word is
wrong.

**THE TWO SELF-REPORTED MUTANT DEFECTS: BOTH CLAIMS VERIFIED
INDEPENDENTLY.** M13's class reproduced by breaking `push-guard.mjs`'s
syntax my own way — `suite_exit=1` (RED) with **passed=0, failed=0,
bodies ran=0**, *"No tests found."* The exit code alone says KILLED; the
counts say VOID. N4's class reproduced from scratch: without
`remote.git/` ignored, the fixture's second commit carries 24 extra
files, so reverting the README leaves it non-empty and the arm's
precondition survives. **One failed open, one failed closed, and only the
COUNTS separate either from a real result.** The lane's rule and its
reading of it both hold.

**THE ABSORBED T-181 TRIGGER: THE ROUTING IS CORRECT AND IS NOT A SCOPE
DODGE.** Corroborated from the primary sources without reading `T-193` or
the notes' argument. `ADR-019 §Records`
(`docs/decisions/019-governing-docs-rules-truths-records.md`, line 56)
reads *"No suite, gate or generator may DEPEND on this directory's
contents."* The operative verb is **DEPEND, not READ** — the ADR
expressly blesses a full-content walk (`shell-frame.spec.ts`,
`window-contract.spec.ts`) and `docs-gate.mjs` already reads filenames
and commit times — so a guard that reads the one record a commit adds
**and gates on what it says** lands on the forbidden side however narrow
its corpus. The card's absorbed criterion therefore cannot be built as
written. **The lane's "seven places" is if anything an UNDERCOUNT**: an
independent census finds ~14 distinct statements, including three
separate ones inside `docs/checkpoints/TEMPLATE.md` (*"NOTHING MAY READ
THESE LINES BACK … a gate is not"*). All four prior declines
(`T-156-s1`, `T-156-s6`, `T-157`, `T-157-s2`) and
`session-economics.spec.ts`'s written refusal check out. Routing it for a
RULING was the right call.

**THE THREE E2E REDS ARE NOT THIS LANE'S — control run rather than
accepted.** In my own bench at HEAD: `3 failed / 21 passed`, and the live
list shows `T-186` holding a lane whose card is in no checkout cut before
it. In a second bench at the BASE `bd8a8e8`, where `push-guard.spec.ts`
does not exist: **identically `3 failed / 21 passed`, the same three
bodies.** (A first attempt at this measured `11 failed / 13 passed` and
was VOID — my bench had no `lib/parser/dist`; the failures named the
missing build, not the diff. Recorded because the count alone would have
charged nine bodies to the wrong cause.) The board also parses clean with
the new cards — `brief.mjs --state` exit 0, zero errors — so the added
`T-193` reds no board-reading suite.

**ASSIGNED CORRECTIONS** (assigned, not performed):

1. **Pin the check's spelling by EQUALITY, not containment.** Extract the
   `cargo …` command out of the CONVENTIONS bullet with an anchored regex
   and compare with `toBe`, and assert the bullet's *"run from …"* names
   `CHECK_DIR_REL_PATH`. The bar is that all three mutants in Finding 1's
   table go RED. Shape EIGHT's own remedy applies: narrow the haystack,
   anchor on something that is not the needle.
2. **Correct `gitInvocations`'s false-positive argument** to say that a
   false positive is REFUSED on a stale graph, and state whether that is
   accepted or the scanner should require `git` to be the segment's first
   token. The behaviour change is the seat's call; the wrong sentence is
   not.
3. **Notes-only**: 21 → 25 bodies; the fresh-capabilities byte figure;
   and replace "GITLINK" with the actual mechanism (a bare repo has no
   `.git`, so its files are ordinary blobs).

**Not blocking, and deliberately not folded in**: the harness's honouring
of exit 2 is unprovable from inside this repository, as the notes
themselves flag. That is a declared limit, correctly declared.

**`review:` IS STILL EMPTY AND THIS SEAT LEFT IT SO**, because the
dispatching seat stated it would stamp `review: independent` itself and
record that the field was set late — its record should carry its own
correction. `verified_by:` is stamped here. The executor was right that a
lane may not award itself this review, and right to stop at `verifying`.

## ABSORBED AT STANDING TRIAGE SITTING #5 (2026-08-31): T-181 — the same argument, a second trigger

**T-181 was filed by the outgoing seat's observation and the incoming
seat's self-audit, and its own filer recommended this fold.** It shares
this card's fence exactly (`.claude`, `tools/e2e`) and its whole
argument; what it adds is a SECOND TRIGGER and the measurement that
earns it.

**THE MEASUREMENT, over two seats and one night (2026-08-30/31).** Split
the checkpoint's obligations by whether something mechanical fires them
and compliance separates completely. **Mechanically triggered — met
every time, by both seats**: the DOCS GATE, `index --check`, the
lane-fence hook, the governing-document budgets. Two of them caught real
defects in the seats' own work. **Memory-held — decayed inside one
session and then INHERITED**: the health bands were run zero times
across five records, the boot gate was leaned on second-hand from
in-lane runs, and the decay replicated because the outgoing seat's
records taught the incoming seat a checklist with the holes already in
it. **The first health run that was finally performed found
`docs-headroom/docs/STATE.md` BREACHED** — by the seat that had noticed
its warning twice that evening and deferred it twice.

**WHAT THE SECOND TRIGGER IS.** This card's own trigger is the PUSH.
The absorbed one is the COMMIT THAT ADDS A RECORD under
`docs/checkpoints/` — already the event the DOCS GATE's staleness rule
keys on — and what it demands is that the record CARRIES the readings:
a health-band census line and its exit, plus, where the merge's diff
meets BOOT GATE's own trigger, the boot check's exit and both `[nputer]`
lines.

**AND IT MUST DEMAND THE READING, NEVER THE VERDICT.** `npm run health`
exits 3 by design while four bands lack keepers, so a guard requiring
exit 0 would refuse every checkpoint forever — the same trap the AUDIT
GATE POLICY names about `--deny warnings`. Demand that the gate RAN and
was RECORDED.

**ADDITIONAL ACCEPTANCE, from the absorbed card:**

- WHEN a commit adds a record under `docs/checkpoints/`, THE guard SHALL
  refuse it unless that record carries a health-band census line and its
  exit, and — where the diff meets BOOT GATE's trigger — the boot
  check's exit and both `[nputer]` lines.
- THE guard SHALL demand that a gate RAN and was RECORDED, never that it
  PASSED.
- THE guard SHALL take BOOT GATE's trigger from the same place the
  written gate does rather than restating it, so the two cannot drift.
- IF the guard cannot run THEN it SHALL say so and ALLOW, never refuse
  silently — the lane-fence hook's own fail-open shape, for the same
  reason.
- THE lane SHALL state the second trigger's measured wall-clock cost
  against the frequency of a checkpoint, as this card's existing
  criteria already require for the push.

**WHAT THE FOLD DELIBERATELY KEEPS**: `cargo audit` was NOT absorbed. It
is already a CI step (`command grep -c "cargo audit" .github/workflows/ci.yml`
answers 2 at `1e886c0`), so it needs no guard — a fact the absorbed
card's own filer got wrong at first and corrected by checking.
