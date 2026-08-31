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
verified_by:
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

**BUILT AT `b8dcb37`, MEASURED THERE, IN THE LANE
`/Users/ujju/Projects/nputer-T-167-s8` CUT FROM `bd8a8e8`.** The PUSH
trigger shipped. The ABSORBED trigger did NOT, and that is a finding
rather than an omission — it is routed as **`T-185`** and the reason is
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

### WHAT WAS NOT BUILT: THE ABSORBED T-181 TRIGGER — ROUTED AS `T-185`

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
THE CLAUSE.** `T-185` carries the evidence, the one distinction that might
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

### CORRECTIONS TO THE DISPATCH BRIEF

1. **`lanes live right now: none` was stale.** At `2026-08-31T~01:30Z` on
   Mac.lan there were FOUR live lanes: this one, `T-162-s1`
   (`[docs/decisions, docs/rooms]`), `T-182` (`[docs/CONVENTIONS.md]`) and
   `T-184` (`app-agent`). All disjoint from this fence, so the dispatch
   was still sound — but the brief's own rule says a live-environment
   fact is re-read at dispatch, and this one had moved.
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
