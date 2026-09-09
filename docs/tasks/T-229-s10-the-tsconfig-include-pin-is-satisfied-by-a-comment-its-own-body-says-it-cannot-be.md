---
id: T-229-s10
title: The tsconfig include pin regexes a whole JSON file and takes the first match, so a decoy in a comment satisfies it while app/src regains the whole test tree
feature: F-06
milestone: 4
size: S
priority: 4
status: verifying
suggested_by: executor claude-opus-5@subagent @T-229-s8
blocked_by: []
touches: [app/test/crescendo-dom.test.tsx]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review:
---

**Class parent: `T-229`** (a positive control that cannot fail is the
most common defect this project produces), and the SWEEP finding of
`T-229-s8`, which fixed the same shape in `app/test/select-board.test.ts`
and then went looking for siblings.

`CONVENTIONS`' POISON DRILL catalogue, **shape EIGHT**: *an assertion
that SEARCHES a corpus has no uniqueness floor, so one duplicate anywhere
keeps it green with its own subject deleted.*
`app/test/crescendo-dom.test.tsx`'s *"the app program still holds the
read-only node surface T-073 restored"* runs

    /"include"\s*:\s*\[([^\]]*)\]/.exec(readFileSync(resolve("tsconfig.json"), "utf8"))

over the WHOLE text of `app/tsconfig.json` and takes the FIRST match.

**AND THE BODY'S OWN COMMENT SAYS THIS CANNOT HAPPEN**, which is what
raises it above tidiness: *"Parsed rather than string-matched: the
include list is read out of the JSON, and the surface is read from the
DECLARATIONS, so neither assertion can be satisfied by a comment."* The
SECOND half is true — the declarations half really does read
`export function` names. The FIRST half is not: the include list is
string-matched by the regex above, and `app/tsconfig.json` already
carries block comments, so a comment is exactly what can satisfy it.

**MEASURED at `1e344d62fbc3f7db83e367b1e8592578459407cb`**, on a detached
drill worktree, one side only, restored and sha256-proved
(`9e477270eabafa11aeead39cc72767af9daa5e1d87b916a90d18e678ce1e9b91` before,
`eb17d38070311cefa9275e4069b41e785b0161fc735c92db9307ab6e3f871c8d` mutated,
the before hash again after `git checkout --`). With a decoy
`"include": ["src", "test/node-builtins.d.ts"]` planted inside a `/* */`
comment above the real key AND the real key widened to
`["src", "test"]` — the precise widening the body's own comment calls
*"the shape an editor complaint invites"* — the whole app suite from
`app/` exits **0**, 50 files / **1141** bodies passed, against a clean
baseline of the same 1141 on the same worktree. **The kill set is
EMPTY**: not one body in the suite notices that `app/src` has regained
the whole `test` tree.

## Acceptance criteria

1. The include half is read the way the body already claims it is — out
   of the JSON rather than out of the file's text — or narrowed to an
   ANCHOR that is not the needle, with the anchor's own uniqueness
   asserted (shape EIGHT's mechanical remedy).
2. The drill above is the positive control and it RUNS: the decoy in a
   comment plus the widened include list SHALL red the body, and the
   demonstration that it left the current body GREEN is the measurement
   recorded above.
3. The body's comment is corrected in the same commit — a claim that
   outlived its mechanism is the defect that makes this worth a card
   rather than a diff.

## Why it is a suggestion and not a rejection

Nothing is red today: `app/tsconfig.json` holds exactly ONE `"include"`
key at the ref above, so the pin reads the right one. This is the same
argument `T-229-s8` inherited from `T-229-s4` — the copy nothing anchors
is the copy that drifts — and the same reason it is filed rather than
built: `app/test/crescendo-dom.test.tsx` is outside `T-229-s8`'s fence
(`app/test/select-board.test.ts`, `method/lane-protocol.md`), so this
lane routed it instead of widening itself.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-229-s8 merge (d179821)

The architect seat. A sibling shape-eight instance measured with an empty kill set; the fence is one app test file, held behind T-214's app-shell lane until it lands.

## Implementation notes — executor, 2026-09-09

Built in `/Users/ujju/Projects/nputer-T-229-s10` on
`task/T-229-s10-tsconfig-include-pin`, base
`900fbfa67a931480ea7fefc1fa101d6189f970e3`, fence
`app/test/crescendo-dom.test.tsx` alone. `app/tsconfig.json` is OUTSIDE
the fence and was never written in the lane — its hash there is
`9e477270eabafa11aeead39cc72767af9daa5e1d87b916a90d18e678ce1e9b91` at the
tip, identical to the committed blob. Every mutation happened on a
detached scratch worktree, `/Users/ujju/Projects/nputer-T-229-s10-drill`.

**WHAT LANDED.** One commit of code,
`21a74e6083edfae28d511db3b55ee8d6060bb09d`. The regex over the whole file
is gone. In its place: a string-aware JSONC scanner strips comments, the
result is `JSON.parse`d, and `include` is read OFF THE OBJECT. The
scanner is a scanner and not a regex for a reason worth keeping — `"@/*"`
and `"./src/*"` in that file's own `paths` block CONTAIN `/*`, so a naive
block-comment strip opens a comment inside a STRING and eats forward to
the next `*/`, which is the one closing `/* Bundler mode */`; it would
destroy the JSON rather than clean it. Because `JSON.parse` resolves a
duplicate key to the LAST one in silence, the `"include"` key is
additionally required to occur exactly ONCE in the comment-stripped text.
That is shape EIGHT's own remedy, and the second drill below is what
proves it is not decoration.

### Criterion 1 — the include half is read out of the JSON

MET, by the first branch rather than the anchor branch. `include` is read
off the parsed object, which is what the body's comment already claimed.
The uniqueness floor from the second branch is kept ANYWAY, because a
real parse is blind to a duplicate key in a way a reader would not
expect.

### Criterion 2 — the drill is the positive control and it RUNS

MET, on the detached scratch worktree, one side only, restored and
sha256-proved. **TWO mutants, and each is shown GREEN against the body as
it stands before it is claimed as a kill.**

*Mutant A, the card's own* — a decoy `"include": ["src",
"test/node-builtins.d.ts"]` planted inside the `/* */` comment above the
real key, AND the real key widened to `["src", "test"]`. The mutation was
read back with `git diff` before any run. Hash `9e477270…1e9b91` before,
`730838e37625050eccf7cbd982c9fa4240fcdf8e71ed0e58a8fd9613490110cd`
mutated.
- against the BASE body at `900fbfa`: the owning file GREEN, 15/15, exit
  0; the WHOLE app suite GREEN, **51 files / 1163 bodies, exit 0**, with
  `app/src` holding the entire `test` tree. **THE KILL SET WAS EMPTY**,
  re-derived at this lane's own base. The card recorded 50 files / 1141
  bodies at `1e344d62`; the suite has grown by one file and 22 bodies
  since, and the kill set is empty at both refs.
- against the NEW body at `21a74e6`: **RED, exit 1, 1 failed | 14
  passed**. The failure is the target body, and it names the real widened
  list rather than the decoy: *expected [ 'src', 'test' ] to deeply equal
  [ 'src', 'test/node-builtins.d.ts' ]*. The kill set went from empty to
  exactly this body.

*Mutant B, the discriminating one* — a SECOND `"include"` key, byte-identical
to the real one, added as real JSON rather than in a comment. This is the
mutant that separates the two halves of the fix: `JSON.parse` resolves it
to the last key, which EQUALS the expected value, so the `toEqual` alone
cannot see it and only the uniqueness floor can.
- against the BASE body at `900fbfa`: GREEN, 15/15, exit 0 — the old
  regex takes the FIRST match, which is the real one.
- against the NEW body at `21a74e6`: **RED, exit 1**, and the red is the
  floor's own message, *expected 2 to be 1*. The `toEqual` on the same
  body passed. The floor is live code.

RESTORATION, both arms: `git restore --source=<commit> --staged
--worktree -- app/tsconfig.json`, then the worktree file hashed
`9e477270…1e9b91` against `git show <commit>:app/tsconfig.json | shasum
-a 256`, equal. The ranged `git diff <commit> -- app/tsconfig.json` is
empty as the COMPANION, never the proof. Scratch `git status --porcelain`
empty.

### Criterion 3 — the comment corrected in the same commit

MET, in `21a74e6`, the same commit as the mechanism. The false sentence is
quoted in the new comment rather than merely deleted, the shape is named
(`docs/CONVENTIONS.md` POISON DRILL shape EIGHT), the measurement is
recorded at `900fbfa`, and the two non-obvious design points — why the
strip is a scanner and why the uniqueness floor survives a real parse —
are written where the next editor will meet them.

### The class and the sweep

`git grep -n '\.exec(readFileSync' <ref> -- 'app/test/*'` returns the
fixed line at `900fbfa` (exit 0) and NOTHING at `21a74e6` (exit 1) — the
sweep was shown capable of finding a hit before its zero was written
down. **The WIDER shape is not zero**: five more bodies regex a whole
Rust source file and take the first match, one of them in this very file.
Filed as `T-229-s11` rather than fixed, because no criterion here reaches
them. `T-229-s12` files the neighbouring gap — `app/tsconfig.test.json`'s
own include list is pinned by nothing at all.

### Commands, in order, each exit read unpiped

| command | cwd | exit |
|---|---|---|
| `npm ci` | `lib/parser/` | 0 |
| `npm run build` | `lib/parser/` | 0 |
| `npm ci` | `app/` | 0 |
| `npm run build` | `app/` | 0 |
| `npx vitest run test/crescendo-dom.test.tsx` (baseline, base body) | `app/` | 0 — 15/15 |
| `npx vitest run test/crescendo-dom.test.tsx` (mutant A, base body, scratch) | `app/` | 0 — 15/15 |
| `npm test` (mutant A, base body, scratch) | `app/` | 0 — 51 files / 1163 bodies |
| `npx vitest run test/crescendo-dom.test.tsx` (new body, clean) | `app/` | 0 — 15/15 |
| `npx tsc -p tsconfig.test.json --noEmit` | `app/` | 0 |
| `npx vitest run test/crescendo-dom.test.tsx` (mutant A, new body, scratch) | `app/` | **1 — 1 failed / 14 passed** |
| `npx vitest run test/crescendo-dom.test.tsx` (mutant B, new body, scratch) | `app/` | **1 — 1 failed / 14 passed** |
| `npx vitest run test/crescendo-dom.test.tsx` (mutant B, base body, scratch) | `app/` | 0 — 15/15 |
| `npm test` (new body, clean, at the tip) | `app/` | 0 — 51 files / 1163 bodies |

`app/package.json` names NO `typecheck` script — the dispatch asked for
one "if app/package.json names it", and it does not. `npm run build` is
what typechecks the test program (`tsc && tsc -p tsconfig.test.json &&
vite build`), so the changed file was typechecked directly through
`tsconfig.test.json`, which is the program that owns it.

All runs headless on `SUPERTASKR_E2E_PORT=15229`. Port 1420 was never
contacted; no vite server was started by any of these commands.

### Gates, derived from this lane's own diff

- **GRAPH REGEN — FIRES.** The diff carries `app/test/crescendo-dom.test.tsx`,
  a `*.tsx` outside `docs/`. **AND IT IS NOT A NO-OP**: `.supertaskrignore`
  excludes `docs/`, `tools/`, `/.claude/`, `/bin/` and the indexer's own
  fixtures — `app/test/` is WALKED, and this file is already a node in
  `docs/architecture/graph.json` carrying a blake3 content hash and a
  `loc`. The drift is **hash and loc only, 763 → 841**: the file's
  imports are unchanged, so no edge moves, and the three new bindings
  (`stripJsonComments`, `withoutComments`, `appProgram`) are all nested
  inside an `it()` callback, which the walk does not record — the graph
  lists 19 top-level symbols for this file and will list 19 after. Stats
  should stay 201 files / 2547 symbols / 2441 edges. This is the
  "hash/loc only, structurally inert" class the dogfood ledger in
  `app/test/architecture-dogfood.test.ts` already has entries for.
- **BOOT GATE — NOT OWED.** The diff touches `app/test/**` and
  `docs/tasks/**`. It touches no `app/src/**`, no `app/src-tauri/**` and
  neither manifest.
- **DOCS GATE — FIRES.** The diff touches `docs/tasks/*.md` (this card
  plus two new suggestion cards), and the app and e2e suites read the
  real `docs/tasks` tree. Derived below against the mechanical merge
  forecast rather than against the branch tip alone.
- **METHOD EVAL GATE — NOT OWED.** The diff touches no `method/**`, and
  these notes deliberately spell no `attack set:` citation line: this is
  an executor's notes, not a verdict, and the digest grammar belongs to
  the verdict that cites a saved attack set.

### Where the brief was wrong

1. **ROW 4, the base commit.** The brief gives
   `f83f7f13d4741a911c1f71fe6bfc3ba350db1f86` and builds its create
   command on it. The lane actually exists at
   `900fbfa67a931480ea7fefc1fa101d6189f970e3` — the T-229-s10 dispatch
   stamp, which is what the worktree's own `git log` shows and what the
   dispatch names. Every figure in these notes is re-derived at `900fbfa`
   or at `21a74e6`. The repository wins.
2. **The ADVISORY seat block** reports *"the card carries no acceptance
   criteria, so there is nothing to build against — TRY"*. This card
   carries an `## Acceptance criteria` section with three numbered
   criteria, and they were what got built. The signal is a false negative
   in the pattern matcher, and it is one of the three inputs that chose
   the seat.
3. **ROW 7 transcribes `npm install` for `app/`**, which is
   `docs/CONVENTIONS.md`'s own spelling and therefore a faithful
   transcription — but a LANE's fence makes the lockfiles read-only, and
   the dispatch's own standing instruction is `npm ci` inside a lane.
   `npm ci` is what was run, in both packages and in the scratch.
4. **ROW 6's fresh-worktree count** cites 12-of-840 bodies failing on an
   unbuilt worktree, measured at `4d2f03c`. Not re-derived: `app/` was
   built before any suite ran, which is what that row exists to make
   happen.

### For whoever integrates

I do NOT hold the integration checkout, so under `lane-protocol.md` rule
6 I merge nothing, checkpoint nothing and remove nothing. The worktree
stands. Three things at the merge:

1. **Regenerate the graph** — `SUPERTASKR_UPDATE_GOLDEN=1 cargo test -p
   supertaskr-index --test self_graph -- --ignored`, and commit
   `docs/architecture/graph.json` WITH THE CHECKPOINT. Expect a hash and
   a `loc` 763 → 841 on `app/test/crescendo-dom.test.tsx` and nothing
   else. Re-run the app/test pins that hold the committed graph's scale
   at that regen — they were green here against the pre-regen graph,
   which is not the same question.
2. **Run the DOCS GATE** at the merge's real pair of commits, not at
   mine: the range rule's pair is not the same before the merge exists as
   at it.
3. **The two suggestion cards claim `T-229-s11` and `T-229-s12`.** Those
   ids were free at `21a74e6`, but other lanes were live tonight and may
   have claimed them concurrently. Check for a collision before the
   merge; the content, not the number, is what matters.
