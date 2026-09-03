# Checkpoint: the form sitting — the architect sits in the agent app, the charter is checked in, and the rename is measured (2026-09-03, @human with the architect seat of the fourth Fable sitting)

A planning sitting, not a merge: no lane landed, no lane was cut.
@human's standing instruction of 2026-09-02 ("do not dispatch any new
execution task cards … lets keep a break after that") held throughout;
what moved is the record. Base: `c066ccd` (main, the T-239-s4 filing,
NOT pushed — origin at `9646618`, red on CI for T-239-s4's cause).

## The rulings

1. **THE FORM OF THE SYSTEM, RE-RULED FOR v1** — @human, verbatim:
   *"Lets move forward with what you just said."* The seat's
   recommendation it ruled on is quoted in
   docs/rooms/cockpit-or-mirror.md (RE-RULED section) and decided in
   **ADR-021**: the architect conversation lives in the user's agent
   app (Claude Code, Codex); nputer for the technical first user is a
   SKILL (the seat's hand work over T-239's arm), a CLI (`npx nputer`,
   C-02) and the APP AS THE MIRROR; the interview ships as ONE
   interview in two lenses; F-05's in-app orchestrator conversation
   and any in-app spawn path leave v1. The 2026-08-20 "follower first,
   cockpit next" becomes "follower is v1; the cockpit not before v2,
   on evidence".
2. **THE CHARTER IS CHECKED IN** — @human: *"can we check in the beyond
   the playbook features?"* → docs/research/beyond-the-playbook-charter.md,
   the artifact's 32 entries verbatim, each carrying its ruled version
   column from docs/rooms/version-planning.md. The room said 31; the
   artifact carries 32 (entry 23 closes Ring 3; the registry is 24–32);
   entry 32 reads v3+ by its ring and awaits @human's word.
3. **THE v1 FUNCTION LIST** is written into docs/rooms/version-planning.md
   as this sitting's record of moves: F-05's conversation and spawn path
   v1 → v2-or-later; T-241/T-242/T-243/T-244 added to v1, planned, none
   dispatched; no charter entry changed column.
4. **A RENAME WAS ASKED ABOUT, MEASURED, NOT RULED** — see "The rename,
   measured" below; docs/rooms/naming.md is where it reopens.

## The sitting's cuts — PLANNED, NOT DISPATCHED

- `T-241` (F-04, M, p2, fence method/adapters + method/roles) — the
  seat skill: the architect's hand work as a slash command over the
  arm; a skill-driven turn indistinguishable on disk from a hand-driven
  one; Codex form measured before claimed.
- `T-242` (F-03, M, p2, fence method/interview + method/adapters) —
  the interview skill: one prompt, one file contract, the app's runner
  reading the same bytes; prints the line that opens the mirror.
- `T-243` (F-02, S, p3, fence app/src-tauri/src + app/src/App.tsx +
  tools/e2e/tests) — the app opens on a folder from outside (argument
  or URL); today its only ways in are two picker dialogs.
- `T-244` (F-01, **L**, p3, fence tools/e2e/scripts + tools/e2e/package.json
  + README.md) — `npx nputer`: the scripts and the indexer behind one
  command; a front, no logic moves. **L: dispatch needs @human's
  approval by the standing rule.**

## Merge

None. A sitting. No worktree was added or removed; the lane list at
`c066ccd` reads "no lane is live" (`brief.mjs --state`, read
2026-09-03T14:41:50Z).

## Gates

DOCS GATE (`node tools/e2e/scripts/docs-gate.mjs <the nine paths>`,
read unpiped at the working tree over `c066ccd`): FIRES, exit 1 —
"9 path(s) under docs/ are code inputs", owing `npm test` from app/,
`npm test` from tools/e2e/, `npx vitest run` from lib/parser/; "every
live task card's frontmatter parses, with a legal status";
"governing-document budgets hold — 4 gated". ROADMAP after the edit:
`wc -c` = 12178 against its 12252 warn line — 74 bytes of headroom,
which the health bands read as a BREACH (below); two record-class
passages were then compressed and the file re-read at 11612 bytes,
640 of headroom, drifting rather than breached.

BOOT GATE (`NPUTER_BOOT_PORT=16001 npm run boot:check` from tools/e2e/):
exit 0, 8 s wall, read 2026-09-03T14:48:21Z — both startup lines detected (`[nputer] project folder:`, `[nputer] window "main" created`), the tree stopped on SIGTERM.

GRAPH REGEN: not owed — no .ts/.rs under the walk moved; docs/ is
excluded by .nputerignore. GRAPH, asked LAST after this record's final
write (`cargo run -q -p nputer-index -- index --check --root ../..`
from app/src-tauri/):
exit 0 — graph.json is CURRENT - ../../docs/architecture/graph.json matches a fresh index (1188363 bytes, 201 files, 2542 symbols, 2441 edges) / budget:      1188363 of 2145959 bytes (55.4%) - 957596 left (read after the final write of this record, 2026-09-03).

HEALTH BANDS (`npm run health -- --readings <captures>` from tools/e2e/,
read unpiped):
first pass (after the F-entry edits) — `14 band(s) — 6 inside, 1 drifting, 2 BREACHED, 1 unread, 4 UNKEPT`, exit 3: `docs-headroom/docs/ROADMAP.md` BREACHED at 74 bytes = 0.60 % of the warn line (band: drift at 10, breach at 2) — the sitting's three sentences pushed a band already drifting at 2.3 % into breach. Fixed in the same sitting by the ADR-019 move, records to the records: F-06's 2026-09-02 residue paragraph compressed to a pointer at the fourth record, F-02's three watcher sentences to one; `wc -c docs/ROADMAP.md` = 11612, headroom 640 bytes. Second pass — `14 band(s) — 6 inside, 2 drifting, 1 BREACHED, 1 unread, 4 UNKEPT`, exit 3 (designed while bands are unkept): BREACHED `suite/e2e-seconds` 492 s against breach 312 (T-120-s2 owns it); drifting `docs-headroom/docs/ROADMAP.md` (5.2 %) and `triage/net-arrivals-per-window` (net 13 since a7798f3: 18 suggestion cards added, 5 dispositioned — above the 9 drift line, which is why this checkpoint is DUE and written); unread `suite/lib-seconds` (cargo test not owed, not run); unkept the four T-156-s1/s2 bands. Captures: gate-run's three output.txt files plus `battery29-graph-architect.txt`, read 2026-09-03T15:0xZ.

## Suites

Owed by the docs gate above; run through `gate-run.mjs` from the repo
root, each exit read from the runner itself, wall clock around the
command (the chain script `battery29-chain.sh` in the seat's
scratchpad):
- parser (`gate-run parser`, `npx vitest run` in lib/parser): 377 bodies, exit 0, GREEN, 2 s wall, read 2026-09-03T14:48:23Z at ref `c066ccd`.
- app (`gate-run app`, `npm test` in app/): 1163 bodies, exit 0, GREEN, 6 s wall, read 2026-09-03T14:48:29Z.
- e2e (`gate-run e2e`, `npm test` in tools/e2e): 652 bodies, exit 0, GREEN, 489 s wall (Playwright's own summary 8.2 m), read 2026-09-03T14:56:38Z.
- rust: not owed (no .rs moved); not run.
- ORDER, disclosed: the three suites ran on the working tree that already held the charter, ADR-021, the two rooms, the four cards and ROADMAP's F-03/F-04/F-05 edits; this record, STATE and ROADMAP's two compressions (below) were written AFTER them. The docs gate names this record and STATE as inputs to shell-frame.spec.ts and window-contract.spec.ts (they walk docs/ as app content). The push, when @human lifts the hold, owes the four-suite battery LAST on the committed tree (STATE's standing rule) — the token written here is stale the moment this commit lands, by design.

## Board

Derived at `c066ccd` before this sitting's files were written
(`grep -h -m1 '^status:' docs/tasks/T-*.md | sort | uniq -c`): 246
done, 129 planned, 124 parked, 9 suggested. This sitting's movements:
four cards FILED planned (T-241–T-244); no status changed on any other
card; no card was dispatched. The queue when the loop restarts is
unchanged from the fourth record, with T-239-s4 (p2, the CI red) at
its head and T-241/T-242 (p2) joining it.

## Environment

Read 2026-09-03T14:41Z on Juhos-MacBook-Pro.local: worktrees — main at
`c066ccd`; six detached entries, none a lane (`../nputer-app` at
`d5c4b65` is the human's app, detached on purpose; `.claude/worktrees/`
holds two detached subagent trees; `/private/tmp/nd-T-140-s4` is
prunable). Holder: `.nputer/holder.json` names this session (the
architect seat; `brief.mjs --release-seat` when the next sitting runs
elsewhere). Unpushed on main at the start of the sitting: `c066ccd`
only. CI: RED at `9646618` (run 33672240360, e2e lane, the arm's
fixture commit without a git identity on the runner — T-239-s4, p2,
planned, unfixed under the no-dispatch instruction). Stray untracked
files f.txt and g.txt, @human's.

## The rename, measured

@human: *"i am considering changing the name of the app to something
else than nputer, how big of a change will this be?"* Read at
`c066ccd` on 2026-09-03 with `grep -rli nputer <dir>
--exclude-dir=node_modules --exclude-dir=target --exclude-dir=dist |
wc -l` (files) and the `-h` form piped to `wc -l` (lines); re-derive
at your own ref, the shape is the finding.

| area | files | lines | class |
|---|---|---|---|
| app/ | 119 | 944 | product surface + tests |
| tools/ | 54 | 271 | tooling + e2e pins |
| lib/ | 11 | 23 | package name `@nputer/parser` |
| method/ | 11 | 22 | the kit's contract |
| docs/*.md (governing) | 7 | 73 | rules and truths |
| docs/architecture | 8 | 753 | generated graph + registry |
| docs/tasks | 318 | 2529 | RECORDS — never rewritten |
| docs/checkpoints + decisions + rooms | 85 | 214 | RECORDS — never rewritten |
| docs/research + design + business | 23 | 203 | mostly records |
| .claude/ | 1036 | 8459 | 1032 of them two detached worktrees, not sources |
| root (README, CLAUDE.md, AGENTS.md) | 3 | 7 | front matter |

Identifiers, read by name: `app/package.json` name; `@nputer/parser`,
`@nputer/e2e`; `tauri.conf.json` productName, window title and bundle
identifier `dev.nputer.app`; Cargo packages `nputer`, `nputer_lib`,
`nputer-index` (253 mentions of the crate name); the runtime directory
`.nputer/` (65 mentions; genesis, sessions.json, nputer.yaml,
lane-fence.json, holder.json, lane-lock.json under it) and
`.nputerignore`; `nputer.yaml` (20); the `NPUTER_*` environment prefix
(twenty-plus distinct names, `NPUTER_FAKE_SCENARIO` the most cited);
the wordmark in App.tsx at three sites; the remote
`github.com/juhosarvanco/nputer`; test pins of the literal in 56 spec
files, 298 occurrences; no `~/.nputer` home path exists. **The
finding:** the count is dominated by records, which a rename leaves
alone; the COST sits in the kit's contract with every generated
project (`.nputer/`, `nputer.yaml`, `.nputerignore`, the env prefix —
a method bump owing its eval block, plus a migration or a clean break)
and in the pins that follow it. Size L across three lanes (app +
e2e; method + kit + evals; tooling + CI) with the remote, the npm
names and the domain in @human's hands. Cheapest NOW: zero outside
users, the trademark sweep still open, `npx nputer` unpackaged
(T-244 waits for the word).

## What the brief got wrong

- The version-planning room's "31 entries" and "gift registry
  (23–31)" — the artifact carries 32 and its registry is 24–32. The
  checked-in copy says so at the top rather than silently renumbering.
- STATE's line "T-216-s8 in flight" and the fourth record's live lanes
  were stale at this sitting's open: every lane had merged the evening
  before. STATE is regenerated below.
- The seat's own message answering "what is v1" gave 128 planned; the
  derivation at `c066ccd` says 129 (T-239-s4 was filed in between).

## Metrics (ADR-020)

- `Rework cycles:` not derivable here — no card was dispatched or
  merged at this sitting; four were filed. The fourth record carries
  the wave's cycles per card.
- `Tokens:` not derivable here as a per-seat sum — one session held
  the whole sitting and its meter is the harness's, read only in a
  lane's notification; no lane ran. The fourth record's per-lane
  figures stand (read 2026-09-02).
- `Gate runtime:` boot 8 s + parser 2 s + app 6 s + e2e 489 s = **505 s** summed, each owed by the docs gate's FIRES line (boot by T-046 at every checkpoint), wall clock around each `gate-run` command from `battery29-chain.sh`, read 2026-09-03T14:48–14:56Z on Juhos-MacBook-Pro.local. `machinery/gate-seconds`'s reading.
- `Cold start:` no model or session SWITCH this window — the same
  session continued across a context compaction and re-read
  NORTH_STAR, ROADMAP, ARCHITECTURE, CONVENTIONS and the rooms from the
  folder before answering; nothing had to be asked of @human to
  explain the state or the next dispatch. Gap found and fixed here:
  no file listed v1's functions (the version-planning room now does).
- `Drift incidents:` 0 — ADR-021 amends ADR-008 by ruling and lands
  closer to NORTH_STAR's model-agnostic, terminal-forever and
  "orchestrate agents users already have" clauses; no work in this
  window contradicted NORTH_STAR or ARCHITECTURE.

## Dispositions

- Filed planned: T-241, T-242, T-243, T-244 (none dispatched).
- Ruled: ADR-021 (docs/decisions/021-…); rooms/cockpit-or-mirror.md
  RE-RULED section; rooms/version-planning.md v1 function list.
- Checked in: docs/research/beyond-the-playbook-charter.md.
- ROADMAP: F-03 gains the two-lens sentence; F-04's stale "Next: T-112"
  tail replaced by the landing and ADR-021; F-05's sentence rewritten.
- Held for @human: the rename (rooms/naming.md), T-239-s4's dispatch
  (main red on CI), T-244's size L, entry 32's column, the seat's
  release, f.txt/g.txt, loop-efficiency's 27 items.
- Push: HELD. Every push re-runs CI red on T-239-s4's cause until it
  lands; the record and the cards wait on main with `c066ccd`.
