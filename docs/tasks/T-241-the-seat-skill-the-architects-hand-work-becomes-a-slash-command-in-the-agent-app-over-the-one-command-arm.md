---
id: T-241
title: The seat skill — the architect's hand work becomes a slash command in the agent app, over T-239's one-command arm, and a skill-driven turn leaves files a hand-driven one cannot be told from
feature: F-04
milestone: 4
size: M
priority: 1
status: verifying
suggested_by: "@human ruling (2026-09-03, ADR-021, rooms/cockpit-or-mirror.md RE-RULED): the architect sits in the user's agent app; nputer is a skill, a CLI and a mirror"
blocked_by: []
touches: [method/, app/src-tauri/src/agent/kit.rs]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Why this card exists

ADR-021 (2026-09-03): the architect conversation lives in Claude Code
or Codex, and what nputer ships for that chair is the seat's HAND WORK
as a skill — the cold-start read, the dispatch view, cut a lane, spawn
the builder and the blind verifier, fold the verdict, merge, push —
with T-239's one-command arm underneath so the same seat can be held
from a Codex prompt file through a shell command. The property the
skill must keep is the 2026-08-20 ruling's: the repo cannot tell a
skill-driven turn from a hand-driven one.

## Acceptance criteria

- WHEN the skill file ships in the kit (`method/skills/<name>/SKILL.md`,
  the playbook's own format T-167 already discovers) THE system SHALL
  carry it into a new project at genesis beside the rest of method/,
  and the lane creating that directory SHALL widen this fence at
  dispatch by the seat (fast path A), never by the lane.
- WHEN a Claude Code session invokes the skill THE system SHALL walk
  the orchestrator's ritual in ITS order (derive `brief.mjs --dispatch`
  before the stamp; stamp; cut; arm; then the next), calling the SAME
  commands the hand work calls and inventing none — every command the
  skill names SHALL be one CONVENTIONS' command bullet already names.
- WHEN a turn under the skill lands a stamp, a fence, a lane or a
  verdict THE files on disk SHALL be byte-identical in shape to the
  hand-driven ritual's (a golden derived from one hand-driven lane
  at a pinned ref, compared field by field, not by prose).
- WHEN the agent is Codex THE skill's prompt-file form SHALL be
  measured on this machine before it is claimed (the cross-harness
  plan's rule); IF unmeasured THEN the card's report SHALL say so and
  ship the Claude form alone, and the Codex form SHALL be a sibling
  card.
- IF the skill would spawn anything the arm does not THEN THE skill
  SHALL refuse and name the arm — no second spawn path.
- **Folded 2026-09-08 (version sitting, @human: quick path to v1):** WHEN
  the user asks for a small change THE skill SHALL offer the QUICK PATH
  — one line files a size-S card with `review: same-model` or
  `review: self-verified` (TASK-FORMAT's own values), runs the lighter
  gates, and lands with a verdict; IF the card is guard-class THEN the
  quick path SHALL refuse and name the rule that requires
  `review: independent`. Success criterion 1 holds: a card and a
  verdict for every merge, never a merge without.
- **Folded 2026-09-08:** THE skill SHALL trigger on INTENT as well as on
  the slash command (Superpowers' shape) — when the conversation shows
  a card being built or a lane being cut, the skill offers itself.
- **Folded 2026-09-08:** WHEN the verifier seat is not the assigned
  model (T-169's mismatch) THE skill SHALL say so in one sentence at
  the verdict — "verified by the builder's own model family, not an
  outside one" — gstack's honest fallback line in nputer's words.
- The method eval gate SHALL run (`node tools/method-evals/run.mjs`
  and `--selftest`) since method/ moves, and CAPABILITIES SHALL be
  regenerated if a spec name moves.

## Implementation notes

Written by the THIRD executor of this lane. The first went silent and was
stopped; the second was cut off by an API limit at 02:40Z having just
begun. Every figure below is re-derived at this session's own tip and no
figure is carried forward from either.

### What the earlier spawns left, and what happened to it

| left behind | judgement | what I did |
|---|---|---|
| `8f02281` — the pack: `SKILL.md` (286 lines), `references/golden-lane.md` (161), `references/host-commands.md` (224) | sound in ORDER and REFUSALS, unrunnable in its two claims | kept and extended; the two corrections are named below |
| `b2cdc65` — the fence widening delivered by the seat | correct, and both halves read on disk before I wrote to `kit.rs` | used; I wrote neither half |
| `method/skills/supertaskr-seat/scripts/golden-check.mjs`, UNTRACKED and dirty at handover | **sound and kept** — a 629-line comparison engine that reads the golden's own field lines at run time; its one defect was that the golden it reads carried NO field lines, so it exited 3 (CANNOT RUN) against every input | kept, four defects fixed (below), committed at `0914a89` |

**The dirty file was KEPT, not discarded.** Its design decision — the
golden owns the field SET, the program owns the COMPARISON, and nothing
in the program carries a second copy of the field list — is the same
split `SKILL.md` already keeps with `host-commands.md`, and it is why the
golden can be re-derived without touching Node. Four things in it were
wrong and are fixed: (1) the field-line grammar's kind was `[a-z-]+`, so
`hash40` half-matched as `hash` and every run reported an unknown check
kind — the baseline failed and said so, which is the selftest working;
(2) a card whose `## Verdicts` section is present but EMPTY — every lane
before its verdict — was graded rather than skipped; (3) the "hand-written
subject" degradation used `Dispatch T-000 — some prose`, which is the
PRE-ARM hand spelling the golden deliberately admits, so the control wore
another spelling of the property instead of lacking it; (4)
`worktree-sibling` compared against `--repo`, which forced a lane
checking its own dispatch to point `--repo` at the integration checkout
— a `--root` was split out so no command runs in a checkout that is not
this lane's.

### THE BUMP IS OWED AT THE MERGE AND IT IS NOT THIS LANE'S

Ruled by the architect seat in `ask-T-241.md` (2026-09-09) when it granted
the `kit.rs` widening: **a new materialized file IS a change to the kit's
bytes, so the method version bump is owed — and the integrator performs
it in T-241's merge commit as an assigned correction.** A half-bump reds
the version-pin test, and `docs/CONVENTIONS.md` was inside T-244's live
fence at dispatch. The three files that move together:

1. `docs/CONVENTIONS.md`'s method version stamp
2. `method/interview/plan-interview.md`'s `(v<version>` stamp
3. `app/src-tauri/src/agent/kit.rs`'s `METHOD_SNAPSHOT_VERSION`
   (currently `0.1.10`, untouched by this lane)

`snapshot_version_matches_the_live_method_stamps` is green in this lane
because all three still agree at `0.1.10`. **The verifier should assign
this to the merge rather than charge it here.**

### Each acceptance criterion

**1 — ships in the kit at `method/skills/<name>/SKILL.md`, in T-167's
format, carried at genesis; the fence widened by the SEAT.** MET.
The pack is five files under `method/skills/supertaskr-seat/`. Each rides
`KIT_FILES` as its own `KitFile`, in the shape every other entry has;
`the_snapshot_carries_the_whole_seat_skill_pack` names all five rather
than prefix-scanning, because a scan would pass a table carrying only
`SKILL.md` — the half-carried pack that test exists to refuse. The parity
walk `the_snapshot_table_covers_every_method_scaffold_file` gained
`skills` to its directory list, so a sixth pack file is loud instead of
silent. **The FORMAT half is checked by T-167's OWN discoverer, never by
a replica**: `the_shipped_seat_skill_parses_under_the_discoverer_that_reads_real_packs`
plants the shipped bytes and calls `skills::discover`, with the control
in the same test — the same bytes minus `description:` must come back
REJECTED, naming the missing key. The widening was the seat's, both
halves, and I read them rather than being told: card `touches:` and
manifest `touchesLine` both read
`touches: [method/, app/src-tauri/src/agent/kit.rs]`, byte-compared equal
at my tip.

**2 — walks the ritual in ITS order, calling only commands CONVENTIONS'
command bullets name, with their cwd.** MET, and now RUNNABLE.
`SKILL.md` §§0-7 walk the order (dispatch view before the stamp; the arm's
eight steps quoted in the arm's own order; the bench cut WITH the lane).
`host-commands.md` gained a `CWD>` line per row — `docs/STATE.md`'s own
standing hazard *"A COMMAND HERE CARRIES ITS CWD AND ITS ARGUMENT"* made
mechanical — and `scripts/host-command-check.mjs` derives the pack's
command lines and set-differences them against the bullets. It resolves
each row's commands against **that row's own named authority**, not
merely one of the two files, which is the claim the rows actually make.
At my tip: **20 rows · 24 commands · 24 resolved · 1 declared commandless
· cwd 14 resolved, 6 declared UNSTATED · 0 findings, exit 0.** The check
found and I fixed two real defects in the inherited reference: a row
citing `AUTHORITY: the same sub-bullet.` with no resolvable file, and a
grammar block whose sample lines the parser read as rows.

**3 — a skill-driven turn's files byte-identical in shape, judged FIELD
BY FIELD by a RUNNABLE check against a golden derived from one
hand-driven lane at a pinned ancestor ref.** MET.
`golden-lane.md` carries 42 `GOLDEN>` field lines across four field sets;
`scripts/golden-check.mjs` reads them at run time and compares.
**The pin holds at my tip**: the hand-driven stamp `74ca530` (*Dispatch
T-230*, 2026-09-02) is an ancestor of the arm's own merge `0f3e7ae`
(`git merge-base --is-ancestor` exit 0, re-derived), so the instance the
golden was derived from cannot have been shaped by the arm. Runs at my
tip, all unpiped:

| what was compared | fields | differed | exit |
|---|---|---|---|
| this lane's live stamp `21f5325` + manifest + card + branch + worktree | 35 of 42 compared, 7 skipped (no verdict yet) | **0** | 0 |
| the HAND stamp `74ca530` | 9 | **0** | 0 |
| the ARM stamp `9d0e385` | 9 | **0** | 0 |
| the ARM-era verdict, T-246's card | 7 | **0** | 0 |
| the PRE-ARM verdict, T-223's card | 7 | **1** | 1 |

**That last row is the golden working, not failing, and the file says so
before you run it.** The one differing field is
`verdict.attackSetDigest`: the pre-arm instance carries the digest inside
a sentence rather than on a line of its own. **An earlier edition of the
golden claimed every verdict field was present in both instances; that
was FALSE and is corrected in place, attributed.** The machine line pins
the RULE — `docs/CONVENTIONS.md`'s THE VERIFIER'S BENCH IS TWO SPAWNS
bullet — rather than the older instance, because a golden that pinned the
instance would pin a shape the conventions have since replaced. The same
honesty applies to the stamp's SUBJECT: the two instances spell it
differently and the regex admits both, which the file states rather than
smoothing over.

**4 — the Codex form MEASURED on this machine before it is claimed.**
**MEASURED. The declared-unmeasured branch is NOT taken and no sibling
card is owed.** Measured 2026-09-09 on Mac.lan with
`/Applications/ChatGPT.app/Contents/Resources/codex` (`codex-cli
0.147.0-alpha.1.2`, `--version` exit 0 — the binary is not on `PATH`).
The shipped `SKILL.md` was copied byte-for-byte
(`sha256:c94256cb…` at the time of the probe) into a scratch
`<probe>/arm/.codex/skills/supertaskr-seat/`, and `codex debug
prompt-input` — which renders the model-visible prompt and sends nothing
— was run there and in an empty sibling control directory. **Arm: the
pack registers, verbatim, inside Codex's own `<skills_instructions>`
block:**

    supertaskr-seat: Hold the architect's seat on a Supertaskr project: …
    Use when a card, lane, verdict, merge or push is in play, or when
    asked what to work on next. (file: <probe>/arm/.codex/skills/supertaskr-seat/SKILL.md)

**Control: zero occurrences.** Both arms exit 0. No model turn was
spawned, nothing was billed, and nothing was written to `~/.codex` —
`~/.codex/skills` is still empty and still dated 2026-07-28.

**THE CARD'S PREMISE IS CORRECTED BY THE MEASUREMENT.** The criterion
asks for the skill's *prompt-file form*; there is no prompt-file form to
ship, because Codex reads a `SKILL.md` pack directory directly and reads
the SAME bytes Claude does. Only the directory differs, and `SKILL.md`'s
new install table records all four discovery paths with how each was
measured. The full trigger clause survives into Codex's prompt uncut —
Codex applies no length cap of its own; the 300-character cap belongs to
Supertaskr's own discoverer, so that is the shorter limit to write to.

**5 — no second spawn path; the skill refuses and names the arm.** MET,
and now pinned in the shipped bytes.
`SKILL.md`'s THE REFUSALS, first bullet, and §4's *"You do not perform the
refused step another way"*. `the_shipped_seat_skill_still_carries_its_three_load_bearing_clauses`
asserts the refusal names the arm AND says what to do when the arm is
genuinely unavailable — a refusal with no alternative is what a seat
reconstructs the ritual around. `host-commands.md`'s closing section
states that the arm's eight steps have one implementation and that
`--write-fence` appears only labelled as the arm's own step.

**6 — the QUICK PATH with TASK-FORMAT's own review values, refusing on a
guard-class card and citing the rule.** MET, pinned.
The offer is one line; the path is four numbered steps; `review:` is
`same-model` or `self-verified` with **"do not invent a fourth"** stated
outright; the ceremony ROW is read off `touches:` rather than off the
letter S; "lighter means fewer gates FIRED, never a gate skipped that
fired"; it still lands with a verdict. The guard-class refusal names the
rule in `tasks/TASK-FORMAT.md` and carries its reason. The same test pins
all three values, the fourth-value clause, the citation and the reason.

**7 — triggers on INTENT as well as on the slash command, in the
frontmatter `description`.** MET, and the mechanism is now measured
rather than asserted.
The description carries `Use when a card, lane, verdict, merge or push is
in play, or when asked what to work on next.` The test asserts the clause
and each of six intent words survive `skills::flatten` — which is the
only thing that proves they are still triggers, because **the cap
TRUNCATES rather than refuses**. The inherited description measured
**299 characters against a 300-character cap**: one character of
headroom, and the next word anyone added would have deleted the trigger
in silence. Reworded to **280**, and the headroom is now asserted by the
test rather than by eye. Codex reads the same field and renders it whole.

**8 — the verifier-mismatch sentence at the verdict, with readable
sources.** MET, pinned.
`SKILL.md` §6 carries it as a block quote in the card's own words —
*verified by the builder's own model family, not an outside one* — framed
as **provenance, not a downgrade**, with `tasks/TASK-FORMAT.md`'s ruling
that `same-model` is not a weaker verdict and that the sharpest
rejections are routinely same-model. `golden-lane.md` FIELD SET 4 carries
it as a conditional field, `verdict.seatMismatch`.

**9 — the method eval gate run, CAPABILITIES regenerated if a spec name
moved.** MET / NOT OWED.
`node tools/method-evals/run.mjs` → exit 0, **9 model-free evals**.
`--selftest` → exit 0, **9 model-free evals, POSITIVE CONTROL**. Both run
from the lane root at my tip. **CAPABILITIES is NOT owed: this diff moves
no e2e spec name** — `tools/e2e/` is outside the fence and the merge
forecast contains no path under it.

### Every command, in the order run, with its exit read unpiped

| # | command | cwd | exit |
|---|---|---|---|
| 1 | `node method/skills/supertaskr-seat/scripts/host-command-check.mjs --selftest` | lane root | 0 (7 degradations, 7 caught, baseline clean) |
| 2 | `node method/skills/supertaskr-seat/scripts/host-command-check.mjs --repo .` | lane root | 0 (24 commands, 24 resolved, 0 findings) |
| 3 | `node method/skills/supertaskr-seat/scripts/golden-check.mjs --selftest` | lane root | 0 (42 fields, 16 degradations, 16 caught) |
| 4 | `golden-check.mjs` against this lane's live stamp, manifest, card, branch, worktree | lane root | 0 (35 compared, 0 differed) |
| 5 | `golden-check.mjs --stamp 74ca530…` (the hand instance) | lane root | 0 (9 compared, 0 differed) |
| 6 | `golden-check.mjs --stamp 9d0e385…` (the arm instance) | lane root | 0 (9 compared, 0 differed) |
| 7 | `golden-check.mjs --card <T-246>` (the arm-era verdict) | lane root | 0 (7 compared, 0 differed) |
| 8 | `golden-check.mjs --card <T-223>` (the pre-arm verdict) | lane root | **1**, one field, exactly as the golden predicts |
| 9 | `node tools/method-evals/run.mjs` | lane root | 0 · 9 evals |
| 10 | `node tools/method-evals/run.mjs --selftest` | lane root | 0 · 9 evals, POSITIVE CONTROL |
| 11 | `cargo test` | `app/src-tauri` | 0 · **638 passed, 0 failed, 4 ignored** in 18 targets |
| 12 | `cargo build` | `app/src-tauri` | 0 |
| 13 | `cargo run -p supertaskr-index -- index --check --root ../..` | `app/src-tauri` | **1 — STALE, and owed to the CHECKPOINT** (below) |
| 14 | `codex --version` | — | 0 · `codex-cli 0.147.0-alpha.1.2` |
| 15 | `codex debug prompt-input` (arm, then control) | the probe dirs | 0, 0 |

### Every standing gate, DERIVED from the merge forecast

Derived by the project's own range rule against `main` at
`6c468723265a4ee6453ce8495c7379209283146f`:
`TREE=$(git merge-tree --write-tree $MAIN HEAD)` (exit 0) then
`git diff --name-only $MAIN "$TREE"`.

| gate | its trigger | fires? | derived on |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **FIRES** — `app/src-tauri/src/agent/kit.rs` | the forecast path list |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, or either manifest | **FIRES** — the same path | the forecast path list |
| METHOD EVAL GATE | `method/**` | **FIRES** — five pack files; RUN, exit 0 twice | the forecast path list |
| DOCS GATE | a path under `docs/` a code suite READS | **FIRES** at my tip — this card plus two suggestion cards | see the note below |

**The `.mjs` files move NO graph.** `Lang::for_extension` in
`crates/supertaskr-index/src/graph.rs` excludes `.mjs`/`.cjs`
deliberately, so the two new scripts are outside the walk. `index --check`
confirms it by naming its one moved file:

    files  +0  -0  ~1
    | ~ app/src-tauri/src/agent/kit.rs  (content, loc 899 -> 1135)

That is a REAL red with both byte counts printed, not the `--root` false
red. **The regeneration lands with the CHECKPOINT, by the integrator**
(GRAPH REGEN's own sentence), and a regen owes the six dogfood pins in
`app/test` — outside this fence.

**THE DOCS-GATE DERIVATION IS OWED-AT-MY-REF AND THE INTEGRATOR MUST
RE-DERIVE IT.** The forecast above was taken at the build commit
`0914a89`, where the six paths are all code and the gate is NOT owed. The
commit carrying these notes adds three `docs/tasks/*.md` paths, which the
parser suite reads, so the gate FIRES at my true tip — the structural
case the executor contract names, where the report is written by the
commit that IS the tip. Stated rather than smoothed: run it at the merge.

### Where the brief was wrong

- **Row 4, the base commit.** The brief names
  `f83f7f13d4741a911c1f71fe6bfc3ba350db1f86`. This lane's actual base is
  `21f5325403a73e66204105d8746d246ee609e502` (the dispatch stamp) — the
  brief was assembled before the arm cut the lane, and the arm cuts at
  the stamp it just committed, which is step 2 of its own eight. The
  repository wins.
- **Row 4, the integration tip.** The brief reads `21f5325…`; `main` is
  now `6c46872…`, seven lanes further on. Every figure in this card is
  re-derived against `6c46872`.
- **Row 5, the fence.** The brief carries `T-241 touches: method/`. The
  card and the manifest both carry
  `touches: [method/, app/src-tauri/src/agent/kit.rs]` — the seat widened
  it after the brief was assembled, by fast path A, and both halves are
  on disk.
- **Row 5, the live-lane list.** The brief lists T-153-s3, T-205-s1,
  T-219-s6, T-241 and T-244 live. At my tip T-153-s3, T-205-s1 and
  T-219-s6 have all merged into `6c46872`.
- **Row 10, the prohibitions.** Live-environment facts, re-read: the
  brief's port-1420 holder (`node 38601`) and its worktree list are both
  reads from 2026-09-08T23:36 and neither is a function of a tree. I
  touched neither 1420 nor any other lane.
- **A correction to the CARD, not the brief.** Criterion 4 asks for the
  Codex *prompt-file form*; the measurement says there is none to ship —
  Codex reads the same `SKILL.md` pack. Recorded under criterion 4.

### The e2e suite caught one defect of mine, and it is fixed in place

Running the blessed gate-runner's `e2e` arm on the lane port turned up
**one** red at `0107142`, and it was mine:

    gate-verdict suite=e2e exit=1 bodies=706 targets=1 verdict=RED
    1) tests/identifier-rename.spec.ts:79 › only the four enumerated
       classes of the pre-rename identifier survive in the code tree
    Error: an occurrence of the pre-rename identifier that belongs to no
    enumerated class
    + "app/src-tauri/src/agent/kit.rs:61: /// nputer ships for that chair
      is the seat's hand work as a skill, so a"

A doc comment I wrote quoting ADR-021's reason used the pre-rename
product identifier in a `.rs` file. **ADR-022 ruled the name; records are
never rewritten, but a comment written today is not a record.** Reworded
to *"what this product ships for that chair"*. The sweep: every non-`docs/`
path in the merge forecast was grepped for the bare identifier — the five
pack files carry zero, and `kit.rs`'s four remaining occurrences are all
the real filename `runtime/nputer.yaml`, which is an enumerated class and
predates this lane. Landed at `80a3bca`;
`tests/identifier-rename.spec.ts` 6 passed exit 0, `cargo test` 638
passed exit 0, `cargo build` exit 0.

**The suite is the reason this was found rather than shipped**, and it is
worth naming: no gate cheaper than the twelve-minute e2e arm looks at a
Rust doc comment for a product name.

### Suggestions filed, and let go

- `T-241-s1` — genesis carries the pack into the kit and nothing installs
  it where either harness was measured to look.
- `T-241-s2` — the pack's two checks run by hand only; no standing gate
  asks them, so the day a reference drifts nothing reds.

## Verdicts

## Fence amended at dispatch (the architect seat, 2026-09-09)

`touches:` widened to `method/`: the criteria name
`method/skills/<name>/SKILL.md` as the skill's home, the preflight refuses a
creation target the fence does not reserve, and a fence token for a path
nothing tracked sits under is a DEAD entry — so the fence names the parent
that exists.
