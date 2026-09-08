---
id: T-265
title: The prose rename — the method kit, the governing documents, the guide, the reference, the templates and the adapters say Supertaskr; records stay as they are
feature: F-01
milestone: 4
size: M
priority: 5
status: done
suggested_by: "@human's ruling of 2026-09-08 (ADR-022)"
blocked_by: [T-264]
touches: [method/, docs/guide/, docs/reference, docs/NORTH_STAR.md, docs/ROADMAP.md, docs/STATE-template.md, docs/VERSIONS.md, docs/business, docs/research/competitors.md, docs/checkpoints/TEMPLATE.md, app/src-tauri/src/agent/kit.rs, app/src/genesis/genesis-derive.ts, docs/CONVENTIONS.md, docs/ARCHITECTURE.md, docs/architecture/components/C-01-method.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

After T-264 moves every identifier, the prose that names the product
and the method follows: method/README.md's first line, the role files
where they say the name, the governing documents, the guide, the
reference, the templates, the adapters' one-liner, the comparisons and
the competitor map. Records — checkpoints, older decisions, card
bodies, room histories — are not touched (ADR-022 decision 3).

## Acceptance criteria

- WHEN method/ is read by a role THE IDENTIFIER spellings there SHALL be
  the new ones too — every `.nputer/`, `NPUTER_*`, `npx nputer` and
  `@nputer/` in a role file, the lane protocol, a template or an
  adapter template — because a role-read path is a program-read path.
  AMENDED 2026-09-08 at the executor's ASK 1: the FILE
  method/runtime/nputer.yaml is NOT renamed in this lane — its three
  readers include tools/e2e/scripts/token-scan.mjs, inside T-224's live
  fence, so the rename lands in T-269 (blocked by T-224 and T-265) with
  all four moving together; the two prose lines that name the file
  (planner.md, reference/12-genesis.md) go with it. The rest of this
  criterion stands
  (ruled at T-264's dispatch, 2026-09-08: method/ is outside T-264's
  fence, so its identifiers are this card's, and T-264's verifier
  routes any it finds here rather than failing T-264 on them).
- WHEN the lane lands THE method kit, docs/guide/, docs/reference/,
  NORTH_STAR, ROADMAP, the STATE and checkpoint templates, VERSIONS,
  docs/business/ and the competitor map SHALL say Supertaskr where they
  named the product or the method, and `git grep -i nputer` over those
  paths SHALL return only quotations of records, each marked as such.
- WHEN the method version is bumped for the name THE pin test SHALL
  move in the same lane, and the kit's own README SHALL open with the
  new name and keep the etymology of the old one as one sentence of
  history.
- IF a sentence in a governing document is a quotation from a record
  THEN it keeps the old name inside the quotation marks.
- The docs gate SHALL be run on every touched path and what it names
  run; the byte budgets SHALL hold (a rename adds one character to
  most mentions; the headroom bands are read before and after).

## Implementation notes

### 2026-09-08 — claude-opus-5@subagent (executor)

Lane `/Users/ujju/Projects/nputer-T-265`, branch
`task/T-265-prose-rename`, base `15619b456cabd1eb55d36efc3dd15c946fa3fa5b`.
Every figure below is measured at `37c5432` (the fifth commit) unless it
names another ref; this notes commit is the tip and moves no count.

**THE CARD'S OWN COPY WAS SYNCED, AND SAY SO PLAINLY.** The lane was cut
at `15619b4`, which PREDATES the criterion-1 amendment the dispatching
seat committed on main at `5e1b305`. Fast path A delivers only the
`touches:` line, so my copy carried the old criterion 1 while main
carried the amended one. Commit 1 copies main's body verbatim into this
lane's copy — the only difference between the two files was that one
criterion. **The verifier reads this card at the BASE ref**, where
criterion 1 still says the yaml file is renamed; it is not, by the
amendment, and §5 below says where it went.

### What moved, by file class, in occurrences of the old name

| class | base `15619b4` | tip `37c5432` | moved |
|---|---|---|---|
| `method/` | 27 | 4 | **23** |
| `docs/guide/` | 16 | 0 | **16** |
| `docs/reference/` | 29 | 6 | **23** |
| `docs/business/` | 37 | 3 | **34** |
| `docs/research/competitors.md` | 14 | 0 | **14** |
| `docs/NORTH_STAR.md` | 10 | 2 | **8** |
| `docs/ROADMAP.md` | 6 | 1 | **5** |
| `docs/VERSIONS.md` | 6 | 0 | **6** |
| `docs/checkpoints/TEMPLATE.md` | 1 | 0 | **1** |
| `docs/STATE-template.md` | 0 | 0 | 0 — it carried none |
| `app/src-tauri/src/agent/kit.rs` (granted) | 5 | 4 | **1** |
| `app/src/genesis/genesis-derive.ts` (granted) | 2 | 0 | **2** |
| `docs/CONVENTIONS.md` (granted, version only) | 10 | 10 | 0 — all ten are the held `repository-directory` class, `T-264-s3`'s |
| **total** | **163** | **30** | **133** |

Case buckets at the base over the original ten fence paths: 142
`nputer`, 2 `NPUTER`, 2 `Nputer`. At the tip: 0 `NPUTER`, 0 `Nputer`.

### The survivors, enumerated — all thirty, in five classes

**1. VERBATIM QUOTATIONS OF @HUMAN'S OWN DATED WORDS (6).** Criterion 4.
Rewriting a person's quoted words is falsification, whatever the ADR says
about the name.

- `docs/NORTH_STAR.md:81,82` — "The bar (@human, 2026-08-29)", under the
  heading *"Quoted verbatim, because the criteria decide which arguments
  count"*. The paradigm case; already marked, untouched.
- `docs/business/marketing.md:57` — the M3 ruling,
  `**"We lead with the full nputer SDLC approach."**` (2026-08-30).
- `docs/business/marketing.md:138` — the same ruling logged under "The
  rulings record". **It was the one UNMARKED survivor in the whole
  fence**, so commit 3 put it in quotation marks. That is the only edit
  this lane made to a frozen line, and it makes it read as what it is.
- `docs/business/strategy-room.md:40` — the same ruling under "Inputs on
  the record", already carrying its date and speaker.
- `docs/ROADMAP.md:127` — `"nputer"`, the 2026-08-14 choice, quoted from
  `rooms/naming.md` inside a line that now names Supertaskr and ADR-022.

**2. A RECORD'S TITLE, QUOTED AS A TITLE (2 occurrences, one sentence).**
`docs/reference/09-records.md:92-93` — ADR-001 is titled *"Build nputer
with nputer"* and the sentence now says in as many words that records
keep the pre-rename name. The same sentence's count moved from
twenty-one to twenty-two and gained ADR-022.

**3. THE KIT README'S ONE SENTENCE OF HISTORY (1).** `method/README.md:6`
— the criterion asks for exactly this: the README opens with the new name
and keeps the etymology of the old one as one sentence, the old spelling
inside quotation marks.

**4. THE `repository-directory` CLASS, RULED AND HELD (13).** ADR-022
decision 4 puts the repository directory and its remote with @human;
`T-264-s3` holds every spelling that is a sibling of, or a route to, that
directory, blocked on `T-266`.

- `docs/CONVENTIONS.md` ×10 — `T-264-s3`'s own `touches:`, untouched here.
- `docs/reference/05-dispatch.md:121,129` and
  `docs/reference/07-verification.md:16` ×3 — **outside `T-264-s3`'s
  `touches:` line**, so this lane MARKED each at the site with the reason
  and the two card ids and filed **`T-265-s1`** to move them with T-266.
  Renaming them alone would make the reference describe worktrees nobody
  creates and contradict CONVENTIONS at the same ref.

**5. `T-269`'s CARVE-OUT (8).** The runtime template and everything that
names it, amended out of criterion 1 on main at `5e1b305` after ASK 1.

- `method/runtime/nputer.yaml:1` ×2 (the file, its header)
- `method/roles/planner.md:22` ×1, `docs/reference/12-genesis.md:25` ×1
  — the two prose lines that name it
- `app/src-tauri/src/agent/kit.rs:58,117,118,535` ×4 — the `include_str!`
  path, the `rel:` string, the KIT_FILES expectation and the doc comment

**No unclassified survivor.** Criterion 2's literal reading is met for
the nine in classes 1-3; the twenty-one in classes 4 and 5 are held under
two rulings, each marked at its site or amended out of the criterion, and
none is a silent omission.

### The two granted asks, and the one refused

The ask channel ran three times. **The grant was read from disk both
times, never from the reply**: the manifest's `touchesLine` and this
card's line 11 compared byte for byte, 356 characters, equal.

- **ASK 1 — REFUSED.** `method/runtime/nputer.yaml`'s three readers
  include `tools/e2e/scripts/token-scan.mjs`, inside T-224's live fence.
  A `git mv` alone does not red a test — it fails `cargo build`, because
  kit.rs embeds the file with `include_str!`. Carved out of criterion 1
  and landed as **`T-269`** (on main at `5e1b305`, blocked by T-224 and
  this card). No suggestion filed: the card exists.
- **ASK 2 — GRANTED.** kit.rs, CONVENTIONS, ARCHITECTURE and
  C-01-method.md. The method version bump, below.
- **ASK 3 — GRANTED.** genesis-derive.ts, with kit.rs from ASK 2.
- **ASK 4 — REFUSED**, and it is the one thing this lane leaves red. §
  "The one red" below.

### The method version bump: v0.1.9 → v0.1.10, the RENAME release

Owed by CONVENTIONS' **test 1, SHIPPED BYTES**: this lane changes five
files `KIT_FILES` materializes into another project —
`adapters/CLAUDE.md`, `adapters/AGENTS.md`, `tasks/TASK-FORMAT.md`,
`roles/planner.md`, `interview/plan-interview.md`.

The three-file commit, all in one: `docs/CONVENTIONS.md`'s
`currently v0.1.10`, `method/interview/plan-interview.md`'s Output
heading, and `METHOD_SNAPSHOT_VERSION` in kit.rs. The five references
that CLAIM the current version moved with it, derived at this ref with
`git grep -n "0\.1\.[0-9]"` rather than quoted: `docs/ARCHITECTURE.md:28`,
`docs/architecture/components/C-01-method.md:9`, `docs/VERSIONS.md:27`,
`docs/reference/12-genesis.md:12`, `docs/reference/README.md:50`. Two did
NOT, because they are records of the v0.1.9 release rather than claims
about the current one: CONVENTIONS' own v0.1.9 changelog line and
`docs/ROADMAP.md:111`'s 2026-09-02 wave sentence.

The fourth obligation is in commit `37c5432`'s message, printed by
`node tools/method-evals/run.mjs --bump` at this ref: model-free exit 0
over 9 evals, model-in-loop exit 3 (no runner), said rather than omitted.
`--selftest` exit 0 over the same 9.

**THIS DISCHARGES `T-159-s2`'s RECURRENCE ARM.** That card predicted the
three out-of-fence version claims would go stale for a second time at the
next bump, and named the alternative in its own words: *"IF the bump's
own fence has been widened to reach them by then, this is DISCHARGED"*.
It was — by the ask channel, at this lane, on the day. The structural arm
is NOT evidenced and the card should close rather than promote.

### The one red at the tip, and it is attributed

`tools/e2e/tests/identifier-rename.spec.ts:118` —
`the records were not rewritten — every record tree still carries the old name`
— FAILS at my tip. It is T-264-s6's class arriving as an instance: the
guard is a **content floor over a directory**, and two of its four floors
count a file that is not a record and that this card names in its own
fence.

| tree | floor at `fe2a2aa` | at my tip | the file | a record? |
|---|---|---|---|---|
| `docs/checkpoints` | 65 | **64** | `docs/checkpoints/TEMPLATE.md` | NO — the TEMPLATE, in this card's fence by name |
| `docs/research` | 11 | **10** | `docs/research/competitors.md` | NO — the competitor MAP; the record subtree is `docs/research/captures/`, untouched, still 5 files |
| `docs/tasks` | 341 | 347 | — | rising, as designed |
| `docs/rooms` | 11 | 11 | — | unchanged |
| `docs/decisions` non-022 | 12 | 12 | — | unchanged |

`tools/e2e` is inside T-224's live fence, so ASK 4 was refused and the
floors cannot move from here. **I did not lower a floor and I did not
plant a decorative old-name mention to keep a count up** — that would
make the guard pass by corrupting the thing it guards. The dispatching
seat's answer: T-264-s6 is promoted to carry the path pin, and the
INTEGRATOR re-scopes the two floors in the merge commit
(`docs/checkpoints` excluding TEMPLATE.md; `docs/research` →
`docs/research/captures`, floor 5). Drill B below measures both arms.

### Every command, in the order run, exit read from `$?` unpiped

| command | from | exit | count |
|---|---|---|---|
| `npm ci` | lib/parser | **0** | — |
| `npm run build` | lib/parser | **0** | — |
| `npm ci` | app | **0** | — |
| `npm run build` | app | **0** | — |
| `npm ci` | tools/e2e | **0** | — |
| `npm run lint:docs` (baseline, base tree) | tools/e2e | **0** | 4 budgets gated, 0 findings |
| `node tools/method-evals/run.mjs` (baseline) | root | **0** | 9 model-free |
| `node tools/method-evals/run.mjs` (after commit 1) | root | **0** | 9 model-free |
| `node tools/method-evals/run.mjs --bump` | root | **3** | 9 model-free ran (exit 0); model-in-loop not attempted, no runner |
| `node tools/method-evals/run.mjs --selftest` | root | **0** | 9 positive controls |
| `docs-gate.mjs` ×31 literal paths | root | **1 = FIRES** | 31 paths, 28 readers, 4 suites named |
| `gate-run.mjs parser` | root | **0** | 377 bodies, 1 target, GREEN |
| `gate-run.mjs app` (first) | root | **1** | 1163 bodies, RED — stale `app/dist`, see below |
| `gate-run.mjs rust` | root | **0** | 639 bodies, 18 targets, GREEN |
| `gate-run.mjs e2e` | root | **1** | 690 bodies, RED — 689 passed, 1 failed, the records guard |
| `npm run build` (app, rebuild) | app | **0** | — |
| `gate-run.mjs app` (re-run) | root | **0** | 1163 bodies, 1 target, GREEN |
| `npm run lint:docs` | tools/e2e | **0** | 4 budgets hold, 0 findings |
| `npm run lint:tokens` | tools/e2e | **0** | TOKEN 177 files, CONTROL 1272 tracked text files |
| `npm run lint:tokens -- --selftest` | tools/e2e | **0** | 65 TOKEN + 4 CONTROL samples, 90 walk-policy, 9 evidence-floor |
| `npm run typecheck` | tools/e2e | **0** | — |
| `npm run capabilities:check` | tools/e2e | **0** | CURRENT, 58883 bytes |
| `node tools/method-evals/run.mjs` (at the tip) | root | **0** | 9 model-free |
| `cargo run -q -p supertaskr-index -- index --check` | app/src-tauri | **1** | STALE, 2 files ~content, scale identical |
| `SUPERTASKR_BOOT_PORT=15265 npm run boot:check` | tools/e2e | **0** | both `[supertaskr]` startup lines |
| `lsof -nP -iTCP:1420 -sTCP:LISTEN` | — | **0** | node 38601, the human's app — read 2026-09-08, never contacted |

**THE FIRST APP RED WAS MINE AND IT IS THE HAZARD CONVENTIONS NAMES.**
`the built bundle carries the lens (criterion 2) > is not stale` failed
because I edited `app/src/genesis/genesis-derive.ts` AFTER the setup
build: `dist/ predates src/genesis/genesis-derive.ts`. One body of 1163,
green after `npm run build`. Not a defect in the diff, and the fresh
worktree ordering sub-bullet predicts it exactly.

### Standing gates, derived from the diff (not from the brief)

- **DOCS GATE — FIRES.** 31 paths under `docs/` at `37c5432` are code
  inputs; the gate named `cargo test` from app/src-tauri, `npm test` from
  app, `npm test` from tools/e2e and `npx vitest run` from lib/parser.
  All four were run. This notes commit adds 3 more docs paths (this card
  and the two suggestions) and names the same four suites — the forecast
  the range rule prescribes, so the derivation does not move at my tip.
- **METHOD EVAL GATE — FIRES** (`method/**`). Run, plus the selftest and
  the bump block.
- **GRAPH REGEN — FIRES.** The diff touches `.ts` and `.rs` outside
  `docs/`. `index --check` is **STALE at exit 1** and the delta is
  exactly the two files this lane edited, content-only: committed and
  fresh are both 1191343 bytes / 201 files / 2542 symbols / 2441 edges,
  `files +0 -0 ~2`. `docs/architecture/graph.json` is outside this fence;
  **the integrator regenerates it in the merge commit** and owes the six
  dogfood pins with it, which the app and rust legs already carry green.
- **BOOT GATE — FIRES** (`app/src-tauri/**`, `app/src/**`). CONVENTIONS
  assigns the executor in as many words; run at exit 0.
- **AUDIT GATE / THE BLESSED GATE** — named bullets with no merge-diff
  trigger, so not derived here.

### The drills

**DRILL A — the method version pin.** Detached scratch worktree
`/Users/ujju/Projects/nputer-D-T-265` at `37c5432` (never the lane,
never the bench). Landing read from `git diff`: one line,
`METHOD_SNAPSHOT_VERSION` back to `"0.1.9"`, one side only.
`cargo test -p supertaskr --lib snapshot_version_matches_the_live_method_stamps`
→ **exit 101**, `running 1 test`, `test result: FAILED. 0 passed; 1
failed`, panicking at `src/agent/kit.rs:722` with *"plan-interview.md's
Output heading no longer stamps v0.1.9 - bump METHOD_SNAPSHOT_VERSION
with the method"* — the plan-interview arm, first of the two ORDERED
asserts, exactly as CONVENTIONS describes. Restored:
`sha256 bfc45aa7c132217042c108dee2dc67ccefd6024cfbefb5eb126ebfe3f259a606`,
identical to the pre-mutation hash; the body re-run green, `1 passed`.

**DRILL B — the records guard, both arms.** Same scratch worktree.

- *The control arm, and it is the measurement that attributes the red.*
  Restore ONLY `docs/checkpoints/TEMPLATE.md` and
  `docs/research/competitors.md` to the base — every other T-265 change
  still in place — and the counts return to 65 / 11 / 347 / 11.
  `npx playwright test tests/identifier-rename.spec.ts` → **exit 0, 6
  passed**. So the single red at my tip is attributable to exactly those
  two non-record files and to nothing else in this lane.
- *The mutant arm, on a REAL record.* From that green state, rewrite
  `docs/rooms/steering-split.md` with `s/nputer/Supertaskr/g` — 11
  insertions, 11 deletions, one side only, and it rewrites @human's own
  quoted words inside the room's blockquote, which is precisely the harm
  ADR-022 decision 3 forbids. `docs/rooms` falls 11 → 10 and the body
  reds: **exit 1, 1 failed / 5 passed**, *"docs/rooms carries the old
  name in fewer files than it did at fe2a2aa — a record was rewritten"*,
  `Expected: >= 11`, `Received: 10`. The guard works; its floors are
  merely scoped over the wrong sets.

**AND THE FIRST RESTORE FAILED, WHICH THE HASH CAUGHT AND A DIFF WOULD
NOT HAVE.** The control arm's setup used `git checkout 15619b4 -- <paths>`,
which writes the INDEX as well as the worktree. The restoring
`git checkout -- <paths>` then read from that index and returned the BASE
bytes, not the tip's: `e3182f6e…` / `dff5f85a…` against the recorded
`da638e40…` / `f9496e47…`. The per-path diff was EMPTY and the re-run
reported `6 passed` — a green that looked like a clean restore and was a
silently reverted lane. `git checkout 37c5432 -- <paths>` plus
`git reset` restored the true bytes; both hashes match, `git status
--porcelain` is empty, and the re-run reproduces the tip's own state
(1 failed on `docs/checkpoints`, 5 passed). This is the retracted
either/or in `roles/executor.md` § The report, reproduced on this
project a second time.

### For the integrator

- **Regenerate `docs/architecture/graph.json` in the merge commit** —
  GRAPH REGEN, delta above, scale unchanged.
- **Re-scope the two record floors** in
  `tools/e2e/tests/identifier-rename.spec.ts` (T-264-s6's class, ASK 4's
  refusal): `docs/checkpoints` excluding `TEMPLATE.md`;
  `docs/research` → `docs/research/captures`, floor 5.
- **`docs/STATE.md` carries six old-name sentences and this lane never
  touched it** (it is regenerated at the checkpoint). Four are STALE
  against identifiers T-264 already landed; two are the held
  `repository-directory` class and should stay:
  - `:55` `cargo run -p nputer-index` → `supertaskr-index` — STALE
  - `:58` `.nputer/holder.json` → `.supertaskr/holder.json` — STALE
  - `:72` `npx nputer` → `npx supertaskr` — STALE
  - `:101` `NPUTER_CANCEL_CI` → `SUPERTASKR_CANCEL_CI` — STALE
    (`.claude/hooks/push-guard.mjs` spells the new one at four sites)
  - `:40` `../nputer-V-<id>` and `:50` `../nputer-app` — HELD, T-264-s3
- `docs/CAPABILITIES.md` is **CURRENT** at this tip (58883 bytes); this
  diff adds no spec name, so nothing is owed there.
- The drill worktree `/Users/ujju/Projects/nputer-D-T-265` is clean and
  detached at `37c5432`; remove it with the lane's.

### Filed, never folded in

- **`T-265-s1`** — the three `repository-directory` spellings in
  `docs/reference/` that `T-264-s3`'s `touches:` does not reach; blocked
  by `T-266`, class parent `T-264-s3`.
- **`T-265-s2`** — the three ROOT documents (`README.md`, `CLAUDE.md`,
  `AGENTS.md`) carry the lowercase identifier where ADR-022 decision 1
  gives prose a capital S. **This card also RULES the question `T-264-s4`
  routed here**: a string a PERSON reads is prose and takes the capital
  S; a string a PROGRAM resolves is an identifier and stays lowercase.
  Measured at `37c5432`, `git grep -c 'Supertaskr'` over `app`, `lib`,
  `tools`, `.github`, `.claude` and the three root files returns
  **nothing** — not one capital-S mention exists outside this fence.
  `T-264-s4` keeps `tauri.conf.json`; this card takes the documents.

### Where the brief was wrong

- **ROW 4, the base commit.** The brief names
  `0b7cecd9f93d1fdeaf582d184d8d4a633cb60085` (the newest `Checkpoint:`
  commit) and gives a `create` command against it. The lane was already
  cut, and it was cut at `15619b456cabd1eb55d36efc3dd15c946fa3fa5b` —
  the dispatch stamp, which the same brief names as the integration tip.
  `git merge-base --is-ancestor` confirms the checkpoint is an ancestor;
  the base I actually built on is the later non-merge commit, which
  CONVENTIONS' dispatch bullet permits by its REASON. The repository
  wins: the base is `15619b4`.
- **ROW 5, the fence.** The brief's `touches:` (ten paths) was
  superseded during the lane by the amendment at `5e1b305` (fifteen
  paths). The brief was right at the ref it was measured at.
- The brief's ADVISORY seat line and its margin block are unchanged by
  anything here.

## Verdicts

### 2026-09-08 — claude-opus-5@subagent (phase 2)

VERDICT: APPROVED WITH ASSIGNED CORRECTIONS

attack set: sha256:84c3c85fa7a5ddc914c9e9cf91e85858b80193dea0630ebfcbfd0c36dab8d339 (attack-set-T-265.md)
ground truths: sha256:d252e6f8b6b0b724398d274e0898a56e31a0ed7ace46a5ab993e8a6d2485e95a (ground-T-265.md)

base `15619b4` · tip `3589e0f` · amended contract `5e1b305` (main) ·
bench `../nputer-V-T-265` detached, scratch worktree `../nputer-M-T-265`
detached at the tip for every mutant.

**THE FRAME I ACTUALLY HAD.** Phase 2 of two spawns, fresh, with tools.
Both digests verified with `shasum -a 256` before either file was
opened; both matched. Read in the ordered frame: the card at `15619b4`,
then the AMENDED card by ref (`git -C ../nputer show 5e1b305:<path>`,
never a summary), then the attack set with the dispatcher's annotations,
then the ground truths, then ADR-022 at the base, then STATE,
ARCHITECTURE and CONVENTIONS at the tip, and ONLY THEN the diff. The
lane's commits were listed by `git rev-list 15619b4..3589e0f` (six
hashes, no subjects). The executor's Implementation notes were read
last and only to ENUMERATE claims; every claim below is re-derived here.
**DISCLOSURE, because a later reader cannot tell a spawn property from a
kept discipline**: this harness cannot deny a subagent tools, so phase
1's no-tool property was kept by INSTRUCTION and self-report (its return
says "tool calls made: 0"), not guaranteed by the spawn — the standing
disclosure until T-261. My own brief's duties section named
executor-derived specifics (the attributed red's two floors and their
65→64 / 11→10 figures, the graph's two files). **That is phase-1 leakage
into the phase-2 brief, and I say so rather than pretend otherwise** —
it could only have told me where to look, and each is re-derived below
from the tree; it could not have told me what to conclude, and the one
finding that decides this verdict was found by a sweep nothing pointed
at.

#### The attacks, each with its command and exit

| # | attack | verdict | evidence |
|---|---|---|---|
| A1.1 | the four classes and only the four | PASS | broad sweep `git grep -nE '\.nputer(/\|ignore)\|@nputer/\|npx +nputer\|NPUTER_' 3589e0f -- method` → 2 files, both carve-outs (`adapters/CLAUDE.md` clean at the tip; `runtime/nputer.yaml`) |
| A1.2 | **INVERTED by the amendment** | PASS | `git ls-tree 3589e0f method/runtime/` lists `nputer.yaml`; `git rev-parse 15619b4:… 3589e0f:…` → `35e731f…` on **both** sides, byte-identical. `planner.md:22` and `reference/12-genesis.md:25` unchanged |
| A1.3 | a sed rewrote a quoted incident in a rule file | PASS | every changed line under `method/` read against `GT-5`; no line inside quotation marks, a blockquote or a citation moved |
| A1.4 | scope-shift via T-264's routed list | PASS | `GT-2`'s three routed lines all have a change at the tip: `kit.rs:588` needle, `genesis-derive.ts` stage-0 cell, `plan-interview.md:37` |
| A1.5 | ignore-file rename without an equivalence check | PASS | `git diff --name-only … -- .gitignore .gitattributes '**/.gitignore'` **empty** |
| A1.6 | env rename with a silent default | PASS | no `NPUTER_*` and no `:-` fallback anywhere in the fence (exit 1, no match) |
| A2.1 | census bought by deletion | PASS | lines/headings per guide+reference file vs `GT-7`: **no heading lost, no file shrank**; three files GREW by exactly their added justifications (05-dispatch 186→189, 07-verification 174→176, 09-records 140→142) |
| A2.2 | census bought by moving files out | PASS | fence inventory `diff` base vs tip **exit 0**; ignore files untouched |
| A2.3 | "marked as such" by blanket banner | PASS | every survivor marked at its own line or inside its own quotation frame; no file- or section-level banner added |
| A2.4 | the manufactured quotation | PASS, disclosed | see FINDING 2 |
| A2.5 | grep-blind leftovers | PASS | added non-ASCII is only `— → × … § ·`; `grep -P '[\x{0400}-\x{04FF}\x{0370}-\x{03FF}\x{200B}-\x{200F}\x{00AD}\x{FEFF}]'` over the added lines → **none** |
| A2.6 | the wrong spelling of the right name | **FAIL** | see FINDING 1 |
| A2.7 | "where they named the product" as an escape hatch | PASS, disclosed | all 29 survivors classified, no fourth bucket except FINDING 3 |
| A3.1 | never fire the WHEN | PASS | five shipped `KIT_FILES` bytes changed → the bump is owed and landed, v0.1.9 → **v0.1.10** |
| A3.2 | the pin edited to match, not moved | PASS | C3.2 control demonstrated below |
| A3.3 | bumped in one place of several | PASS | see F8 |
| A3.4/A3.5 | the etymology dropped or unmarked | PASS | `method/README.md:1` opens `# Supertaskr — …`, no old name; `:6` carries exactly one sentence of history, self-marked *"One sentence of history"*, old spelling inside quotation marks (G-b) |
| A4.1 | a quotation "corrected" | PASS | ADR-001's title resolves VERBATIM: `git show 15619b4:docs/decisions/001-…md` → `# ADR-001: Build nputer with nputer` |
| A4.2 | the frame renamed around a preserved quotation | PASS | every containing sentence read; none dates the new name before 2026-09-08 |
| A4.3 | the quotation kept, the SOURCE rewritten | PASS | see F1 |
| A4.4 | quotation status invented at judgement time | PASS, disclosed | one reclassification, FINDING 2 |
| A5.1 | budget bought by deleting a hazard | PASS | **all five** deleted ROADMAP lines carry the old name; no content-only deletion |
| A5.2 | the gate config edited | PASS | `git diff --stat … -- docs-scan.mjs health-bands.config.mjs docs-gate.mjs` **empty**; the eight numbers unchanged |
| A5.3 | bands read from different trees | PASS | recomputed from git objects at both refs, below |
| A5.4 | gate not run at HEAD or not over method/ | PASS | `node tools/e2e/scripts/docs-gate.mjs <45 paths>` from the root → **exit 1 = FIRES** (names the owed suites), all four run |
| A5.5 | out-of-fence edits to make the gate green | PASS | `git diff --name-only … -- docs/STATE.md docs/CAPABILITIES.md CLAUDE.md AGENTS.md` **empty**; CONVENTIONS + ARCHITECTURE hunks are 2 version-stamp lines + the 3-line v0.1.10 changelog entry CONVENTIONS' own rule demands, and nothing else |
| A5.6 | a template renamed while its generator was not | PASS | `docs/checkpoints/TEMPLATE.md`'s only consumer that reads its text is `push-checks.spec.ts` (docs-gate reader map); e2e green apart from the attributed red |
| A5.7 | evals broken, skipped, or a fixture accepting both names | PASS | see F7; `mf-05-vocabularies.mjs` names neither spelling, so no fixture accepts both |

#### The falsifiers, each answered

1. **a record moved — NO.** Two independent checks. (a) `git ls-tree -r 3589e0f -- docs/checkpoints docs/decisions docs/rooms docs/research/captures docs/tasks` diffed against `blobs-records-T-265.txt` (719 entries): **exit 0**, every record blob byte-identical; the only listing differences are `docs/checkpoints/TEMPLATE.md` and the three T-265 cards, all excluded from the manifest by construction. (b) touch-and-revert: `git log --name-only 15619b4..3589e0f -- <those trees>` names **only** TEMPLATE.md and the three T-265 cards across all six commits. ADR-022 keeps `.nputer/` in its decision 4 (G-d) — unchanged.
2. **a generated or out-of-fence document edited — NO.** As A5.5. Every one of the 45 changed paths is inside the amended `touches:`.
3. **a live old name survives in the fence — NO for IDENT; three PROSE survivors, disclosed** (FINDING 3).
4. **a fabricated quotation — NO** (FINDING 2 tested and cleared).
5. **the census passed by deletion or by moving files out — NO** (A2.1/A2.2).
6. **INVERTED: the yaml still present and unrenamed — YES, correct** (A1.2).
7. **a method eval regressed or neutered — NO.** `node tools/method-evals/run.mjs` → exit 0, **9 model-free evals**, matching `GT-6`'s nine `mf-*`. `--selftest` → exit 0, 9, POSITIVE CONTROL. **The count is the guard, not the exit**: removing `mf-05-vocabularies.mjs` in the scratch worktree left exit **0** with the count at **8**.
8. **the pin dead or absent, or one location only — NO.** Every location claiming the CURRENT version moved together: `kit.rs:37`, `ARCHITECTURE.md:28`, `CONVENTIONS.md:466`, `VERSIONS.md:27`, `C-01-method.md:9`, `reference/12-genesis.md:12`, `reference/README.md:50`, `plan-interview.md:26`. `git grep -n '0\.1\.9' 3589e0f` outside record paths leaves exactly **two**, both records of the v0.1.9 RELEASE and correctly frozen: `CONVENTIONS.md:474` (the changelog entry) and `ROADMAP.md:111` (the 2026-09-02 wave sentence). `Cargo.lock`'s four are `cargo-platform`, `serde-untagged`, `streaming-iterator`, `time-core` — third-party, unrelated. A minor bump for a breaking runtime rename does not arise: the runtime file did not move (ASK 1 refused).
9. **a budget crossed its line or the line moved — NO.**
10. **the gate not run at HEAD over every touched path — NO** (A5.4).
11. **the README's etymology absent or its opening on the old name — NO** (A3.4).
12. **a quoted incident inside a method/ rule file rewritten — NO** (A1.3, G-a).
13. **the name spelled wrong — YES, once** (FINDING 1).
14. **base drift — NO.** `15619b4` reachable and unchanged; the bench was moved with `checkout --quiet --detach`.
15. **the digest not cited, or commits predating its stamping — NO.** Both cited above; the attack set is stamped at the dispatch and the six lane commits sit after `15619b4`.

#### The budgets, recomputed from git objects at both refs

| file | base | tip | delta | warn | headroom at tip |
|---|---|---|---|---|---|
| docs/STATE.md | 8183 | 8183 | +0 | 8465 | 282 (3.3%) |
| docs/ROADMAP.md | 11492 | **11650** | +158 | 12252 | **602 (4.91%)** |
| docs/ARCHITECTURE.md | 9299 | 9300 | +1 | 10657 | 1357 (12.7%) |
| docs/CONVENTIONS.md | 126418 | 126585 | +167 | 146878 | 20293 (13.8%) |

`lint:docs` reports **4 gated, 0 awaiting**, exit 0. **G-c is confirmed
and the card's "+1 character" is wrong**: the rename is +4 bytes per
mention. ROADMAP's six mentions predict +24; the actual +158 is the two
checklist lines rewritten to carry ADR-022 and the quoted 2026-08-14
choice — content ADDED, none deleted. **OBSERVATION, not a failure**:
ROADMAP's headroom band went 6.20% → 4.91% of its warn line. It holds,
and it drifted; STATE's standing hazard asks a sentence added there to
owe a cut in the same file, and no cut was made. Named for the
checkpoint, not charged against this lane.

#### The 29 surviving old-name lines in the fence, every one classified

`git grep -in nputer 3589e0f -- <the fifteen touched paths>` → **29
lines / 30 occurrences**, base 151.

- **4** — `kit.rs:58,117,118,535`, the `include_str!` path, the `rel:`
  string, the `KIT_FILES` expectation and the doc comment. **T-269's
  carve-out**, amended out of criterion 1 at `5e1b305`.
- **2** — `planner.md:22`, `reference/12-genesis.md:25`. The two prose
  lines the amendment names by name. **Correctly unchanged.**
- **1** — `method/runtime/nputer.yaml:1` (×2: the file, its header).
  Same carve-out; blob identical to the base.
- **10** — `CONVENTIONS.md:1078,1079,1084,1100,1341,1358,1363,1367,1369,1372`,
  the `repository-directory` class. `GT-12` recorded exactly 10 at the
  base and CONVENTIONS is in the fence ONLY for its version stamp, so
  **all ten are correctly untouched**.
- **6** — quotations of @human's own dated words, each carrying a
  pre-existing attribution: `NORTH_STAR.md:81,82` (under *"Quoted
  verbatim…"*, `## The bar (@human, 2026-08-29)` — **GT-5's mechanical
  classifier called these PROSE because the `*"` delimiters sit on lines
  78 and 84; re-read here and re-classed QUOTE, and the lane did not
  touch them**), `marketing.md:57`, `strategy-room.md:40` (same
  correction), `marketing.md:138` (FINDING 2), `ROADMAP.md:127`.
- **2** — `reference/09-records.md:92,93`, ADR-001's title quoted as a
  title. Resolves VERBATIM to the record at the base.
- **1** — `method/README.md:6`, the etymology. G-b's one sanctioned
  non-quotation hit.
- **3** — `reference/05-dispatch.md:121,129`, `07-verification.md:16`
  (FINDING 3).

`reference/09-records.md`'s "Twenty-one to date" also moved to
"Twenty-two" and gained ADR-022 — re-derived: `docs/decisions/` holds
22 numbered records at the tip. **True.**

#### FINDING 1 — the one defect, and it is inside the lane's own fence

`docs/reference/14-versions.md:44-45` spells the CLI with a **capital S
inside a backtick code span**:

    - p1 — the seat skill (T-241), the interview skill (T-242), `npx
      Supertaskr` (T-244, size L, needs the human's approval to dispatch).

ADR-022 decision 1 rules *"one word, capital S in prose, lowercase
`supertaskr` as an identifier"*, and decision 2 names the CLI **`npx
supertaskr`**. Every other CLI mention this lane wrote is lowercase —
`NORTH_STAR.md:29`, `ROADMAP.md:81`, `VERSIONS.md:36`, `VERSIONS.md:47`,
`guide/the-model.md:16`, `reference/08-landing.md:188`,
`reference/13-surfaces.md:45`, `competitors.md:479`. **This lane's own
filed card `T-265-s2` states the test the line fails**: *"a string a
PERSON reads is prose; a string a PROGRAM resolves is an identifier."*

Reproduce: `sed -n '44,45p' docs/reference/14-versions.md`. A
line-anchored grep does not find it because the code span crosses the
line break, which is why the sweep that caught it was
`git grep -nE '\`[^\`]*Supertaskr[^\`]*\`'` **plus** reading the diff.

**I am not rejecting for it, and I say plainly that this is a judgement
against my own sealed set's letter.** Falsifier 13 grades "the name
spelled wrong" REJECTED-level, and it fired. Phase 1 wrote that
falsifier without being able to distinguish a SYSTEMATIC mis-spelling —
the whole rename landing as "SuperTaskr", which would stop the merge —
from a single-character slip in one line of one reference page, with the
other 150 renamed mentions correct. What landed is the second. The fix
is one character, mechanically verifiable, in a file the merge commit
touches anyway, and a rejection would spend a whole fresh phase-2 pass
on it. **It is assigned correction 3 below, and if it is not made the
lane does not comply with ADR-022 decision 1** — the orchestrator may
override this call to a REJECTED without re-verifying anything else.

#### FINDING 2 — one base-PROSE hit reclassified as a quotation, tested and cleared

`docs/business/marketing.md:138`, base
`answer — lead with the full nputer SDLC approach · M4 yes`, tip
`answer — "lead with the full nputer SDLC approach" · M4 yes`. The lane
ADDED the marks: a `GT-5` PROSE hit presenting as QUOTE at the tip,
which is exactly attack A4.4 and mutant M3.

**Tested rather than accepted.**
`git grep -Fin 'lead with the full nputer SDLC approach' 15619b4 --
docs/checkpoints docs/decisions docs/tasks docs/rooms
docs/research/captures` → **0 hits**: the words are NOT in the record
corpus. They DO resolve verbatim at the base to `marketing.md:57`
(`**"We lead with the full nputer SDLC approach."**`) and
`strategy-room.md:40`, both `GT-5`-classified QUOTE, both under a
pre-existing dated attribution — the paragraph already opened *"2026-08-30,
@human via the engineering session"* at the base and the lane did not
write it. **A2.4's actual test is an INVENTED attribution, and there is
none**: the speaker, the date and the words all pre-date the lane, and
the section is titled "The rulings record". **ACCEPTED and disclosed**;
a reader who wants the stricter reading has the command above.

#### FINDING 3 — three base-PROSE survivors, the repository-directory carve-out

`reference/05-dispatch.md:121,129` and `07-verification.md:16` keep
`../nputer-T-NNN` and `nputer-V-T-NNN`. AC2's census clause read
literally admits only quotations of records, and these are not that —
**a fourth bucket, and I name it as one.** It is nonetheless the right
call: they name the repository DIRECTORY, which ADR-022 decision 4 puts
with @human (T-266); `CONVENTIONS.md` carries ten identical spellings at
the same ref that this lane may not touch, so renaming three would make
the reference contradict CONVENTIONS **and** describe worktrees nobody
creates. Each is marked at its site with the reason and two card ids,
and `T-265-s1` is filed with `T-264-s3` as its class parent and `T-266`
as `blocked_by`. **ACCEPTED and disclosed.**

#### The security sweep — clean on all four axes

- **secrets/keys**: the added lines carry no key-shaped text; the single
  grep hit is `VERSIONS.md`'s prose ABOUT the secret read guard.
- **allow-rules / dependencies**: `git diff --name-only` over
  `package.json`, `package-lock.json`, `Cargo.toml`, `Cargo.lock`,
  `settings.json`, `.claude/` → **empty**. No package added, no rule
  widened, no lockfile moved.
- **a fallback keeping the old spelling alive**: no `NPUTER_*` and no
  `${SUPERTASKR_X:-…}` anywhere in the fence.
- **homoglyphs**: none introduced (A2.5).

#### The drill — mutants, each landing read from `git diff`, each restored by sha256

Planted in `/Users/ujju/Projects/nputer-M-T-265`, a DETACHED scratch
worktree at `3589e0f` with its own cargo target, never the bench, the
lane or the executor's scratch. Baseline in that worktree: the pin body
passes, 1 body, exit 0. Restoration proved equal to the commit on every
one.

| mutant | side | landing (read from `git diff -U0`) | kill set |
|---|---|---|---|
| M8a | the CODE | `METHOD_SNAPSHOT_VERSION` → `"0.1.9"` | **1** — the pin, exit 101 at `kit.rs:722`, *"plan-interview.md's Output heading no longer stamps v0.1.9"* |
| M8b | the DATA | `plan-interview.md`'s Output heading → `(v0.1.9` | **1** — the pin, exit 101 at `:722`, the mirror message |
| M8c | the DATA | CONVENTIONS' first gotcha → `currently v0.1.9` | **1** — the pin, exit 101 at a DIFFERENT site, `:734` |
| M7 | the ASSERTION | both `contains` needles loosened to a `(v0.1.` / `currently v0.1.` prefix, const moved to `0.1.9` in the same edit | **0 — SURVIVED, exit 0** |
| M-needle | the DATA | `plan-interview.md` stage-0 cell → `` `.nputer/` `` | **2** — `the_shipped_plan_interview_still_carries_the_normative_banking_map` (cargo, exit 101 at `kit.rs:588`) **and** `every cell of the 9-row table matches plan-interview.md verbatim` (vitest, 1 failed of 1163) |
| M1 | the RECORDS | old name stripped from `docs/checkpoints/2026-08-27-T-092.md` (1 line → 0) | **2** — my C4.3 blob comparison (`8a15442…` ≠ `72b2658…`) and the spec's records floor (64 → 63) |
| M12b | the RUNNER | `mf-05-vocabularies.mjs` removed | **0 by exit, 1 by COUNT** — exit stays 0, the count drops 9 → 8 |
| M4 | the DATA | the glossary's renamed row deleted | **1** — my C2.1 line count (26 → 25); `lint:docs` exit 0, blind |
| M9 | the DATA | the README's etymology sentence deleted | **1** — my C3.4 count (1 → 0 old-name lines); method-evals exit 0, blind |
| M10 | the CONFIG | ROADMAP's warn/fail → 99999 | **1** — my C5.2 config diff; nothing else asks |
| M13/M17 | OUT OF FENCE | `docs/STATE.md`'s `# State` heading edited | **1** — my C5.5 path diff; `lint:docs` exit 0, blind |
| M5 | the DATA | `` `@nputer/e2e` `` + `.nputerignore` added to `method/adapters/CLAUDE.md` | **0 — SURVIVED** every gate: lint:docs 0, method-evals 0/9 |
| M16 | the DATA | `Supertaskr` → `SuperTaskr` in `docs/guide/the-model.md` | **0 — SURVIVED**: lint:tokens 0, lint:docs 0, method-evals 0/9 |
| M15 | the BYTES | Cyrillic `С` U+0421 for `S` in `docs/guide/README.md:3` | **0 — SURVIVED**: lint:tokens 0, lint:docs 0 |

**Kill-set containment.** M8a/M8b/M8c share one body but fire at two
distinct assertion sites, so no set contains another and all three arms
are load-bearing. M-needle's two kill sets are disjoint in the other
direction — the rust body proves the KIT ships it, the app body proves
the transcription MATCHES it — and neither contains the other. M1's two
are likewise independent: the blob comparison sees a byte change that
PRESERVES the old name, which the floor cannot; the floor sees an
uncommitted working tree, which the manifest cannot.

**A tautology named.** M7 is the control for the control: with the pin
loosened to a prefix, a const that disagrees with both stamps passes,
exit 0. The SHIPPED pin is therefore not a tautology — **the C3.2
demonstration this card's criterion 3 owes is done here, shown failing
on three sides before it is trusted passing** — and the class M7 opens
is filed as `T-265-s4`.

**And a mutant that did not land, reported as such.** M1's first
planting used a `$. == 1` line filter that matched nothing; `git diff`
showed an empty landing and the floor did not move. Read from the
mutator's own report it would have read "survived". Re-planted, it
lands and kills two.

**THE STRUCTURAL FINDING THE DRILL PRODUCED**, filed as `T-265-s3`:
M5, M16 and M15 survive EVERYTHING. `tools/e2e/scripts/rename-scan.mjs`
declares `SCAN_ROOTS = ["app/","lib/","tools/",".claude/",".github/"]`
plus five root files — *"exactly the trees T-264's first acceptance
criterion names"* — so **method/, docs/guide/, docs/reference/,
docs/business/ and the governing documents, the whole of T-265's fence,
are outside the guard's corpus by construction.** FINDING 1 is an
instance of that class: nothing in this tree could have reddened on it.

#### Every command, from `$?` unpiped, with its count

| command | from | exit | count |
|---|---|---|---|
| `npm ci` + `npm run build` | lib/parser | **0** | — |
| `npm ci` + `npm run build` | app | **0** | — |
| `npm ci` | tools/e2e | **0** | 0 vulnerabilities |
| `npm run lint:tokens -- --selftest` | tools/e2e | **0** | positive control |
| `npm run lint:tokens` | tools/e2e | **0** | both corpora |
| `npm run lint:docs` | tools/e2e | **0** | 4 budgets gated, 0 findings, injection scan 0 hits / 33 paths |
| `npm run typecheck` | tools/e2e | **0** | — |
| `npm run capabilities:check` | tools/e2e | **0** | **CURRENT** (58883 bytes) — no spec name moved |
| `node tools/method-evals/run.mjs --selftest` | root | **0** | 9 model-free, POSITIVE CONTROL |
| `node tools/method-evals/run.mjs` | root | **0** | 9 model-free |
| `gate-run.mjs parser` | root | **0** | **377 bodies**, GREEN |
| `gate-run.mjs app` | root | **0** | **1163 bodies**, GREEN |
| `gate-run.mjs rust` | root | **0** | **639 bodies / 18 targets**, GREEN |
| `gate-run.mjs e2e` (`SUPERTASKR_E2E_PORT=25265`) | root | **1** | **690 bodies — 689 passed, 1 failed**, the attributed one and nothing else |
| `docs-gate.mjs <45 changed paths>` | root | **1 = FIRES** | names app, tools/e2e and lib/parser; 0 frontmatter issues |
| `cargo run -q -p supertaskr-index -- index --check --root ../..` | app/src-tauri | **1** | **STALE**, `files +0 -0 ~2` |
| `SUPERTASKR_BOOT_PORT=14523 npm run boot:check` | tools/e2e | **0** | both startup lines detected |
| the records body alone, port 25266 | scratch worktree | **1** | `Expected: >= 65 / Received: 64` at `identifier-rename.spec.ts:124` |

#### The one red, judged ATTRIBUTED and not this lane's

`tools/e2e/tests/identifier-rename.spec.ts:118` —
*the records were not rewritten — every record tree still carries the old name* —
is the **only** failing body in 690, re-run alone at the same tip in the
scratch worktree: `Expected: >= 65 / Received: 64` at line 124.

Re-derived independently of the executor's account:

| tree | floor | base | tip | the file that dropped | a record? |
|---|---|---|---|---|---|
| docs/checkpoints | 65 | 65 | **64** | `docs/checkpoints/TEMPLATE.md` | **NO** — the TEMPLATE, named in this card's own `touches:` |
| docs/research | 11 | 11 | **10** | `docs/research/competitors.md` | **NO** — the competitor MAP; the record subtree `docs/research/captures/` is untouched |
| docs/rooms | 11 | 11 | 11 | — | — |
| docs/tasks | 341 | 347 | 348 | — | rising, as designed |

The two files are **exactly** the template and the map, by
`diff <(git grep -l -i nputer 15619b4 -- …) <(… 3589e0f -- …)`. My own
F1 record-immutability check passes over all 719 record blobs, so the
red is the guard's floors counting two non-records, not a rewritten
record. `tools/e2e` sits inside T-224's LIVE fence, so this lane could
not have fixed it and correctly did not lower a floor or plant a
decorative mention to keep a count up. **ATTRIBUTED.**

#### ASSIGNED CORRECTIONS — all three are the integrator's, in the merge commit

1. **The two guard floors.** `tools/e2e/tests/identifier-rename.spec.ts`
   `RECORD_FLOORS`: re-scope `["docs/checkpoints", 65]` to exclude
   `TEMPLATE.md`, and `["docs/research", 11]` to
   `["docs/research/captures", 5]`. **`T-264-s6` carries the path pin.**
   Then re-run the e2e leg and read the count.
2. **The graph regeneration.** `index --check` reads **STALE**, exit 1,
   and the delta is **exactly** `files +0 -0 ~2` — `kit.rs (content)` and
   `genesis-derive.ts (content)`. Scale is unchanged on both sides:
   1191343 bytes, 201 files, 2542 symbols, 2441 edges, so the six
   dogfood pins in `app/test` should not move — **run the app suite at
   the regen anyway** (STATE's standing rule) and re-ask `index --check`
   after every write. `docs/architecture/graph.json` is outside this
   fence, which is why the lane correctly left it stale.
3. **The spelling (FINDING 1).** `docs/reference/14-versions.md:45`:
   `Supertaskr` → `supertaskr`, inside the `` `npx …` `` code span.
   One character. Verify with
   `git grep -n 'npx supertaskr' docs/reference/14-versions.md` and with
   the code-span sweep in FINDING 1.

#### `docs/STATE.md` — the six old-name sentences, for the checkpoint

STATE is out of fence, untouched by this lane, and REGENERATED at the
checkpoint. Re-derived here, not relayed; four are STALE against
identifiers **T-264 already landed**, two are the held class:

- `:55` `cargo run -p nputer-index` → `supertaskr-index` — **STALE**
  (`app/src-tauri/crates/supertaskr-index/Cargo.toml:11`)
- `:58` `.nputer/holder.json` → `.supertaskr/holder.json` — **STALE**
  (`lane-fence.mjs:330` `RUNTIME_DIR = ".supertaskr"`)
- `:72` `npx nputer` → `npx supertaskr` — **STALE** (ADR-022 decision 2)
- `:101` `NPUTER_CANCEL_CI` → `SUPERTASKR_CANCEL_CI` — **STALE**;
  `push-guard.mjs` spells the new one at **4** sites and the old one
  appears nowhere in `app lib tools .claude .github`
- `:40` `../nputer-V-<id>` and `:50` `../nputer-app` — **HELD**,
  `repository-directory`, `T-264-s3` / `T-266`

`docs/CAPABILITIES.md` is **CURRENT** at this tip (58883 bytes); the
diff adds no spec name, so nothing is owed there.

#### Findings that are not failures, filed rather than folded in

- **`T-265-s3`** — the rename guard's corpus does not reach any tree
  T-265 renamed; three mutants surviving every gate are the evidence,
  and FINDING 1 is the instance. Class parent `T-264-s6`.
- **`T-265-s4`** — the pin matches its stamps with a `contains` prefix,
  and the two-digit patch this lane landed makes that prefix ambiguous;
  M7 is the demonstration.

Neither blocks. `T-265-s1` and `T-265-s2`, the executor's, both parse
with a legal status and neither title opens with a reserved indicator —
`docs-gate` reports **0 frontmatter issues in the live tree**.

#### Step 7 — the gates my own commits could move

This verdict and the two cards are WRITES. Re-run at MY tip, not at the
one I was sent: `npm run lint:docs`, `docs-gate.mjs` on my own changed
paths, and the parser suite (I filed cards, and the parser reads
`docs/tasks/`). Results appended below the commit.

**Figures above are stated at their refs** — base `15619b4`, tip
`3589e0f` — and stay true after this commit changes the tree they count.

**Step 7, run at my own tip `328dc86` and not at the one I was sent** —
the verdict and the two cards are three changed paths, all under
`docs/tasks/`:

| command | from | exit | count |
|---|---|---|---|
| `docs-gate.mjs <my 3 paths>` | root | **1 = FIRES** | names the app and lib/parser suites; **0 frontmatter issues in the live tree** |
| `npm run lint:docs` | tools/e2e | **0** | every live card parses with a legal status; 4 budgets gated, 0 awaiting |
| `gate-run.mjs parser` | root | **0** | **377 bodies**, GREEN, `ref=328dc86` |
| `gate-run.mjs app` | root | **0** | **1163 bodies**, GREEN, `ref=328dc86` |

The board is not shorter for my two cards and no budget moved: the tip
this verdict created is green on everything prose can move.
