---
id: T-265
title: The prose rename — the method kit, the governing documents, the guide, the reference, the templates and the adapters say Supertaskr; records stay as they are
feature: F-01
milestone: 4
size: M
priority: 5
status: verifying
suggested_by: "@human's ruling of 2026-09-08 (ADR-022)"
blocked_by: [T-264]
touches: [method/, docs/guide/, docs/reference, docs/NORTH_STAR.md, docs/ROADMAP.md, docs/STATE-template.md, docs/VERSIONS.md, docs/business, docs/research/competitors.md, docs/checkpoints/TEMPLATE.md, app/src-tauri/src/agent/kit.rs, app/src/genesis/genesis-derive.ts, docs/CONVENTIONS.md, docs/ARCHITECTURE.md, docs/architecture/components/C-01-method.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
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
