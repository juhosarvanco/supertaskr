---
id: T-145
title: Every project this method creates still receives the read-first set that cost this project a working day — the repo fixed itself and left the template carrying it
feature: F-06
milestone: 4
priority: 2
size: S
status: done
blocked_by: []
touches: [method/adapters/]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-145 — build 9a80c8a
verified_by:
review:
---

Absorbs: T-138-s2 (Amnesty triage 2026-08-29 (triage seat)) — this card fixed the class's core and its own closed_by line says so: the template names docs/ROADMAP.md with the check-first placeholder, and ADR-019's phase-7 commit completed the product-document half — the template now names docs/CAPABILITIES.md as a MARKED placeholder, on this card's own rule that a template shipping a nonexistent path is worse than one shipping nothing, and points at method/docs-protocol.md.

**Promotion of `T-138-s2`, which named this as a class while `6a6bc87`
fixed only the instance.** Verified still true at `f22332b`.

## The defect

    method/adapters/CLAUDE.md:8   Before any work: read docs/STATE.md, then docs/ARCHITECTURE.md and
    method/adapters/AGENTS.md:8   Before any work: read docs/STATE.md, then docs/ARCHITECTURE.md and

**`docs/ROADMAP.md` is missing**, and these two files are what every new
nputer project copies to its own root. This repository's own root
adapter was corrected on 2026-08-26 and the template was knowingly left
behind — `6a6bc87` says so in its own commit message.

**ROADMAP is not optional in this method.** `method/README.md:45`
scaffolds it as *"feature backbone + milestones"* and `planner.md:42`
already refers to it. So the template omits a document the method itself
creates for every project.

## Why the priority

The omission has a measured cost in this repository: an architect
session spent most of a working day rebuilding a belief about
`blocked_by` that **ROADMAP's own `F-06` entry would have corrected in a
sentence** (`T-138`). That session then cleared four accurate
declarations and filed a card to gate a defect that did not exist, which
had to be rejected and reverted.

**Every project created from this template starts with the same gap.**

## What to change

1. Add `docs/ROADMAP.md` to the read-first sentence in **both** template
   files.
2. Carry across the paragraph that makes it stick — the one naming what
   each document answers, so a reader knows why the set has four members
   and not three. **Write it generically**; the template serves any
   project.
3. **Do NOT copy this repository's third paragraph.** It cites
   `tools/e2e/tests/` and a `grep` over this project's own specs. Either
   leave it out or leave a clearly-marked placeholder — a template that
   ships a broken path is worse than one that ships nothing.

## Two things that will look like defects and are not

- **The two template files legitimately differ by one line.**
  `AGENTS.md`'s opening HTML comment names the tools it is for ("Codex
  CLI, Cursor, Gemini CLI etc."); `CLAUDE.md`'s does not. That is
  deliberate. **Keep it.** Everything below that comment should stay
  identical, and this card's change must not be the thing that makes
  them diverge further.
- **The template is 14 lines against the root adapter's 29.** It is
  meant to be thinner — it carries placeholders (`<project name>`, `<One
  sentence: what this repo is.>`) that a real project fills in. Do not
  "fix" the length.

## The pin this needs

**Nothing in this repository currently reads either template file**
except a fixture line, and `T-144` is the card for that gap on the ROOT
adapters. This card should not try to solve that. **But it must not land
unpinned either**: at minimum, assert that the template's read-first
sentence names the same four documents as `method/README.md` scaffolds,
so the next divergence is loud.

Per `T-142`, prove the check can fail before believing it: remove a
document from the sentence in a scratch worktree, watch it RED, restore,
watch it GREEN. **A guard whose positive control was never run is the
same shape as the defect it is guarding against.**

## Implementation notes

Built at lane `task/T-145-lane`, base `d45d841`, fix commit `9a80c8a`.
Every figure below is measured at this lane's own ref, not carried.

### What changed, and the three judgement calls

**1. How generic the "what each document answers" paragraph is.** It
reads *"ROADMAP is what the PRODUCT does"*, not this repository's *"what
this app DOES"*. That is not a paraphrase invented here — it is the
wording `method/roles/orchestrator.md:7` already uses, which makes the
template agree with the role file a session is dispatched with instead of
offering it a second spelling. "App" is also wrong for a library, a
service or a CLI, and the template serves those too. The T-138 citation
that closes this repository's own version is dropped: a task id from
another project's tracker is noise in a fresh repo.

**2. The third paragraph is CARRIED, with the project-specific half
inside an angle-bracket placeholder.** It now reads:

    Before concluding that a feature is missing, check whether it already
    exists: <the command that prints this project's executable record of
    what it does — spec or test names, which cannot go stale the way
    prose can>.

The card allowed either omission or a marked placeholder. Placeholder,
for three reasons. **(a)** The instruction is generic and the pointer is
not, so only the pointer needs bracketing — omitting the whole paragraph
throws away the generic half to protect the specific half. **(b)** The
template already uses exactly this convention for `<project name>` and
`<One sentence: what this repo is.>`; a third one is the same shape a
filler already recognises, and an unfilled `<...>` is visible on the
first read, whereas a shipped `tools/e2e/tests/` path is a lie that reads
as truth in a project that has no such directory. **(c)** The lesson is
the whole reason this card exists — T-138 spent a working day rebuilding
a belief ROADMAP already held — and a template that teaches the read-first
SET without the habit that makes the set useful has kept the cheaper half.

**3. What the pin should assert — decided, proven, and NOT LANDED.** See
below; this is the criterion that did not fit the fence.

Two things the card warned would look like defects were left alone: the
one-line HTML-comment difference between the two files (verified by `diff`
after — the only differing line is line 1, and `tail -n +2` of the two
files is byte-identical, `diff` exit 0), and the template's thinness.

### THE PIN DOES NOT FIT THIS FENCE, AND THAT IS A DISPATCH ERROR

The card says *"it must not land unpinned either"* and fences the lane to
`method/adapters/`, which is two markdown files. **Every place a pin
could live is outside it**, and a new file INSIDE `method/adapters/` is
not an escape: `the_snapshot_table_covers_every_method_scaffold_file` in
`app/src-tauri/src/agent/kit.rs` walks that directory and reds
`cargo test` for any file not in `KIT_FILES`. **The fence permits the
write; the suite forbids it.**

Per `lane-protocol.md` rule 5 and `roles/executor.md`, an executor whose
work reaches outside its own `touches:` has found a dispatch error and
not a licence. Routed rather than built:

- **`T-145-s1`** — the pin, with the property, the argument for it, and
  the positive control already run. Fence: `app-agent`.
- **`T-145-s2`** — whether a method version bump is owed, which `T-104`
  already ruled is triage's call BEFORE dispatch and which this card's
  dispatch did not make. Fence: `[method/interview/plan-interview.md,
  docs/CONVENTIONS.md, app-agent]` — the three-file bump, none of it here.

### The drill (T-142), and what it measured

Run in a DETACHED SCRATCH WORKTREE outside the repository
(`git worktree add --detach`), removed afterwards so it never appears in
the lane list other lanes derive fences from.

| state | templates sha256 (CLAUDE / AGENTS) | pin | `cargo test` |
|---|---|---|---|
| fixed | `4b7f1bbf199d89ed…` / `268cca0371bf71a3…` | exit **0** | — |
| ROADMAP dropped, ONE side | `5cfdeabad91e555f…` / unchanged | exit **1**, arms 1 AND 2 both name it | exit **0**, 18 green result lines, 0 failures |
| restored | `4b7f1bbf199d89ed…` / `268cca0371bf71a3…` | exit **0** | — |
| ROADMAP dropped, BOTH sides | — | exit **1**, arm 2 SILENT, arm 1 alone | — |
| restored | `4b7f1bbf199d89ed…` / `268cca0371bf71a3…` | exit **0** | — |

Both restorations proved by `sha256` byte-identical to the pre-mutation
hashes AND by an empty `git status --porcelain`.

**THE ROW THAT MATTERS IS THE `cargo test` ONE.** The defect this card
fixed was re-introduced on purpose and the repository's own Rust suite
went **green, exit 0**. That is not a prediction about the pin — it is a
measurement of the hole, and it is why `T-145-s1` is filed rather than
argued.

**The both-sides row is the second control**: it proves arm 1 is not
piggybacking on arm 2, and it is the exact shape the defect had for the
whole of this repository's history.

### Suites, all at `9a80c8a` + these notes

| where | command | exit | result |
|---|---|---|---|
| lib/parser | `npx vitest run` | 0 | 290 passed / 13 files |
| lib/parser | `npx tsc --noEmit` | 0 | — |
| app | `npm run build` | 0 | — |
| app | `npm test` | 0 | 1013 passed / 47 files |
| app/src-tauri | `cargo test` | 0 | 518 passed, 0 failed |
| app/src-tauri | `cargo run -p nputer-index -- index --check --root ../..` | 0 | CURRENT — 997202 bytes, 185 files, 2124 symbols, 2039 edges |
| tools/e2e | `NPUTER_E2E_PORT=15947 npm test` | 0 | 194 passed |
| tools/e2e | `npm run typecheck` | 0 | — |
| tools/e2e | `npm run lint:tokens -- --selftest` | 0 | — |
| tools/e2e | `npm run lint:tokens` | 0 | TOKEN 139 / CONTROL 774 |
| tools/e2e | `npm run lint:docs` | 0 | 6 root-anchored files, all argued |

**518 / 1013 / 290 / 194** — the same four numbers the last checkpoint
carries, which is the expected answer for a diff of two method markdown
files and three task cards.

Port discipline: `1420` was read once with `lsof -nP -iTCP:1420 -sTCP:LISTEN`
and is held by the human's app (pid 19746, node). The lane ran on **15947**,
re-probed free immediately before the run.

### ADDENDUM: THE DRILL CONTAMINATED THIS LANE'S OWN CARGO SUITE

Written because it produced a RED that looks exactly like a real one and
is not attributable to this diff.

To avoid a cold Tauri build, the drill worktree's `cargo test` ran with
`CARGO_TARGET_DIR` pointed at THIS lane's warm target directory.
`crate::testutil::repo_root()` is `env!("CARGO_MANIFEST_DIR")`, resolved
at **compile** time, so that build baked the DRILL's absolute path into
the test binaries; the two trees being byte-identical, cargo's
fingerprint matched and the lane then **reused the drill's artifacts**.
After the drill worktree was removed:

    cargo test   exit 101   the live registry must read:
                            DirMissing(".../T-145-drill/docs/architecture/components")

Touching only the source file that panic named produced a SECOND red with
**nine** failures — each integration-test binary bakes its own copy.
`cargo clean` is prohibited here, so the recovery was to `touch` every
workspace `.rs` (mtime only) and rebuild: back to **exit 0, 518 passed**,
the same number this lane measured before the drill at `9a80c8a`.
`git status --porcelain` was empty at every step of the episode.

**Not a repository defect and not this diff's**, and filed as `T-145-s3`
rather than left in these notes, because `method/lane-protocol.md` rule 4
argues this exact failure — *"a test run only READS, so it looks
harmless"*, *"nothing in the tree records that a second runner was
present"* — for a case it does not cover. This was ONE runner and ONE
owner; the shared surface was a TARGET DIRECTORY, and the rule has no
term for that. **A drill worktree gets its own target directory, or it is
not isolated.**

### Fence derivation

The merge's diff, by the RANGE RULE's executor pair
(`TREE=$(git merge-tree --write-tree <main tip> HEAD)`, main tip
`2fab106`): **6 paths** — 2 under `method/adapters/` (in fence), 1 this
card (never part of its own fence, rule 5), and 3 new cards under
`docs/tasks/` (a directory not fenceable by any card, rule 5). **No fence
breach.** Nothing outside `method/adapters/` was modified; the routed
criteria are cards, not edits.

Standing gates, derived from those 6 paths:

- **GRAPH REGEN** — trigger is `*.ts/*.tsx/*.js/*.jsx` or `*.rs` outside
  `docs/`. Matches **0 of 6**. NOT OWED — and the gate was ASKED anyway
  rather than predicted: `index --check` exit **0**, CURRENT, 997202
  bytes / 185 files / 2124 symbols / 2039 edges.
- **BOOT GATE** — trigger is `app/src-tauri/**`, `app/src/**` or either
  manifest. Matches **0 of 6**. NOT OWED.
- **DOCS GATE** — FIRES, exit **1**, naming **all 4** card paths and 3
  suites: `npm test` from `app/`, `npm test` from `tools/e2e/`,
  `npx vitest run` from `lib/parser/`. All three re-run after the LAST
  card write, all green. (Derived twice: at `db3d8a1` it named 3 cards,
  at `5897c30` it names 4 — the gate is a function of the diff, so it was
  re-asked after every write rather than carried.)

### The three DOCS-GATE suites, re-run at the tip

Every card write moves the gate's answer, so the three suites it names
were re-run after the LAST one rather than once at the start:

| command | exit | result |
|---|---|---|
| `npx vitest run` from `lib/parser/` | 0 | 290 passed |
| `npm test` from `app/` | 0 | 1013 passed |
| `NPUTER_E2E_PORT=15947 npm test` from `tools/e2e/` | 0 | 194 passed |
| `npm run lint:docs` from `tools/e2e/` | 0 | every live card parses, legal status |
| `npm run lint:tokens` from `tools/e2e/` | 0 | TOKEN 139 / CONTROL **777** |

`cargo test` stands at **exit 0, 518 passed** after the recovery the
addendum above describes; `index --check` exit **0**, CURRENT.

**CONTROL moved 774 → 777** across this lane — three tracked card files,
exactly the printed-never-pinned behaviour `docs/CONVENTIONS.md` promises
for that corpus. No test fixes either number and none needed touching.
