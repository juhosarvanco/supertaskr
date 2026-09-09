---
id: T-229-s10
title: The tsconfig include pin regexes a whole JSON file and takes the first match, so a decoy in a comment satisfies it while app/src regains the whole test tree
feature: F-06
milestone: 4
size: S
priority: 4
status: done
suggested_by: executor claude-opus-5@subagent @T-229-s8
blocked_by: []
touches: [app/test/crescendo-dom.test.tsx]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent — fix 21a74e6, notes cf7c176
verified_by: claude-opus-5@subagent — APPROVED at tip cf7c176 (base 900fbfa), no assigned corrections; verdict appended in this commit, T-229-s13 filed
review: same-model
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

## Verification — APPROVED

`claude-opus-5@subagent`, 2026-09-09, on the bench worktree
`/Users/ujju/Projects/nputer-V-T-229-s10`, DETACHED at lane tip
`cf7c176bb9de5fc9a610c3e09221189dec1da67e`, base
`900fbfa67a931480ea7fefc1fa101d6189f970e3`. Phase 2 of the blind
two-phase bench; a different spawn wrote the attack set without tools.

    attack set:    sha256:82118a0ea7e17a055303d7057c08838fe4d077f1bf7bca9476940d3210cf0214 (attack-set-T-229-s10.md)
    ground truths: sha256:df71f5d77042c0592598c8e4589e16df19c9ba200ece1f3e3f0518959903ec70 (ground-T-229-s10.md)

Both digests verified with `shasum -a 256` before the diff was opened.
The base body saved beside the ground truths
(`crescendo-base-T-229-s10.tsx`, `sha256:7b9cb689…dae0b4d`) hashes equal
to `git show 900fbfa:app/test/crescendo-dom.test.tsx` in this checkout,
so the sealed record is provably the base body and not a copy of it.

### THE FRAME I ACTUALLY HAD — disclosed, not the one I was promised

1. **Phase 1 ran with ZERO tool calls BY INSTRUCTION, because the
   harness cannot deny tools.** The blindness is a discipline the
   dispatcher kept and a later reader cannot distinguish it from an
   enforced one. Its own frame statement (card at base + BASE FACTS +
   the condensed role) is its claim, not my measurement.
2. **My phase-2 brief carried executor-derived specifics**: it named the
   executor's commit shas (`21a74e6`, `cf7c176`) and quoted the phrase
   *"string-aware JSONC scanner"* from the report's head, which the
   dispatcher had read. That is leakage into PHASE 2, above the line —
   phase 1's seal is unaffected — and I re-derived every fact below from
   the tree rather than accepting any of it.
3. **I read the executor's notes BEFORE the diff, and the brief caused
   it.** The brief told me to read the card whole; at the tip the card
   CARRIES the implementation notes inline. So the "report after the
   diff" ordering was not available for the notes, only for the separate
   report file. I re-derived independently and say so here rather than
   claim an ordering I did not have.
4. My mutants were constructed from the attack set's descriptions, not
   copied from the executor's. Where a mutant coincides with one of the
   executor's, the mutated hash DIFFERS (mine `9e88aaa3…` vs the report's
   `730838e3…` for the same semantic pair) because the decoy was planted
   at a different byte offset in the same comment. Same mutant, built
   twice.

### GROUND RE-DERIVED AT THE TIP

`app/tsconfig.json` hashes `9e477270eabafa11aeead39cc72767af9daa5e1d87b916a90d18e678ce1e9b91`
at base, at tip and in the bench working tree — identical, and equal to
the card's own figure. One `include` key; one string value carrying `/*`
(`"@/*": ["./src/*"]`). The app body count is **1163 at the base**
(G8) and **1163 at the tip**: no decrease. The card's 1141 was at
`1e344d62`, an older ref, and both figures are quoted with their refs.

### F1 — THE FENCE HELD

`git diff --name-only 900fbfa..cf7c176` is exactly four paths:

    app/test/crescendo-dom.test.tsx
    docs/tasks/T-229-s10-…md
    docs/tasks/T-229-s11-…md
    docs/tasks/T-229-s12-…md

**`app/tsconfig.json` is NOT among them** — the falsifier that would have
rejected this twice over. One commit (`21a74e6`) touches the fenced file,
so criterion 3's "same commit" is checkable and holds. No test NAME
changed (`it(`/`describe(` lists diff clean between base and tip), so
`npm run capabilities` is NOT owed — and G14 records that `app/test`
names feed no generated census in any case.

### THE DATA MUTANTS — the property lives in DATA, so the mutants are data mutants

Every run on my own detached scratch worktree
`/Users/ujju/Projects/V-T-229-s10-drill` (created for this pass, removed
after it). Protocol per mutant: sha256 before, apply, sha256 after,
**landing read from `git diff` and never from the mutator**, run,
`git checkout --`, sha256 again and require equality. The mutator exits
non-zero on a missing anchor or a no-op, so a mutation that failed to
land can never be graded "survived". **Every run below restored with
H1 == H3 and left `git status --porcelain` empty** — no exceptions.

Both columns are real runs: the landed body, and the base body swapped in
with `git show 900fbfa:app/test/crescendo-dom.test.tsx`.

| id | mutant on `app/tsconfig.json` | LANDED body | BASE body |
|---|---|---|---|
| M-D1 | decoy `"include"` inside the `/* */` above the real key, key untouched | **GREEN** | GREEN |
| M-D2 | real key widened to `["src","test"]`, no decoy | **RED** — `toEqual`, names the real list | RED |
| **M-D3** | **decoy + widening — the card's own pair** | **RED**, names the WIDENING (`['src','test']`), not the decoy and not a parse error | **GREEN** ← the empty kill set |
| M-D4 | decoy in a `//` line comment + widening | **RED** — `toEqual` | GREEN |
| M-D5 | `"include"` key deleted entirely | **RED** — floor, *expected +0 to be 1* | RED (*expected null not to be null*) |
| M-D6 | second real `"include": ["src","test"]` after the correct one | **RED** — floor, *expected 2 to be 1* | GREEN |
| **M-D6b** | second `"include"` **byte-identical** to the real one | **RED** — floor ONLY | GREEN |
| M-D7 | widened key first, narrow second | **RED** — floor | RED (`toEqual`; the first match is the widened one) |
| M-D8 | comments before AND after the key, key untouched — greedy-stripper detector | **GREEN** | GREEN |
| M-D9 | extra `paths` alias `"~/*": ["./test/*"]` carrying `/*` — string-state detector | **GREEN** | GREEN |
| M-D10 | widened to `["src/**/*","test/**/*"]` | **RED** | RED |
| M-D11 | malformed JSONC | exit 1 **at the esbuild layer, ZERO bodies ran** — NOT a body kill; see below | not run |
| M-D12 | decoy `"include" : [` (space before colon) + widening | **RED** — names the widening | GREEN |
| M-D13 | decoy with a newline before the colon + widening | **RED** — names the widening | GREEN |
| M-D14 | trailing comma after the last include entry | **RED** — `SyntaxError` — **finding, filed** | GREEN |
| M-D15 | reformat only (list across three lines) | **GREEN** | not run |
| M-D16 | unrelated `"forceConsistentCasingInFileNames": true` | **GREEN** | not run |
| M-D17a | string value carrying an ESCAPED `\"include\": [...]` | **GREEN** | not run |
| M-D17b | string value that is exactly `"include"` | **RED** — floor — **finding, filed** | GREEN |
| M-D18a–f | six near-miss widenings: `./test`, `test/`, `test/**/*`, `test/*`, `../test`, one extra real test file | **RED each**, each naming the actual list | M-D18c RED |
| M-D19a/b | `"src"` dropped; `"include": []` | **RED each** | not run |

**M-D11 is reported as a non-kill on purpose.** A malformed `tsconfig.json`
is refused by esbuild while vitest is still starting, so the run exits 1
having executed NO bodies — an exit code calling that a kill is the
gate-runner's own instance 2. The body-level question (is a parse error
SWALLOWED?) is answered instead by **M-D14**, where vite tolerated the
file, the body ran, and `JSON.parse` threw INTO the named test. Nothing is
swallowed: there is no `catch`, no `??`, no `||` and no `?.` anywhere in
the added lines (grepped over the `+` side of the diff, zero hits), so
falsifier F6 has no purchase.

### THE CODE MUTANTS

| id | mutation | result |
|---|---|---|
| M-C1 | `resolve("tsconfig.json")` → `tsconfig.NOPE.json` | **RED** — ENOENT. The read is live (F10 closed) |
| M-C2 | `.toEqual(...)` → `.not.toEqual(...)` | **RED**. The include assertion EXECUTES and is load-bearing |
| M-C3 | the uniqueness floor DELETED | clean **GREEN**; + M-D6b **GREEN**; + M-D3 **RED**; + M-D6 **RED** |
| M-C4 | rename `statSync` in `test/node-builtins.d.ts` | **RED**. The declarations half is live too (A20 needs no card) |
| M-C5 | the fenced file run from the repo ROOT with `--root app`, clean and widened | **RED both ways** — ENOENT on `resolve("src")` and friends. It CANNOT go silently green from the wrong cwd |

**KILL-SET CONTAINMENT (2b), and it is the load-bearing result here.**
M-C3 is what separates the fix's two halves:

- the **floor** kills M-D6b (a byte-identical duplicate, where
  `JSON.parse` resolves to the last key and its value EQUALS the
  expectation) — and with the floor deleted, M-D6b goes **GREEN**. The
  `toEqual` is blind to it.
- the **`toEqual`** kills M-D2/M-D3/M-D10/M-D18*/M-D19* — and with the
  floor deleted those still **RED**. The floor is blind to them.

**Neither kill set contains the other**, so both assertions are
load-bearing and neither is a restatement. And the kills land where the
property lives: on the include list of `app/tsconfig.json` itself, which
is DATA — a code-only drill would have mis-graded this by construction
(T-221).

Against the base body the containment runs the other way: the base kill
set (`M-D2`, `M-D5`, `M-D7`, `M-D10`, `M-D18c`) is a strict SUBSET of the
landed body's. Every kill the old regex had is kept, and M-D3, M-D4,
M-D6, M-D6b, M-D12 and M-D13 are added. That is the right direction for a
replacement.

### THE POSITIVE CONTROL RAN, AND THE ARMING DIFFERS

The demonstration the method demands — the control evaluated where the
subject's arming is ABSENT — is the base-body column above, and its
sharpest row is the card's own pair:

| the card's mutant (decoy + widening) | owning file | WHOLE app suite |
|---|---|---|
| BASE body @ `900fbfa` | GREEN 15/15, exit 0 | **exit 0 — 51 files / 1163 bodies passed** |
| LANDED body @ `cf7c176` | **exit 1 — 1 failed / 14 passed** | **exit 1 — 1 failed / 1162 passed (51 files)** |

**THE CARD'S RECORDED MEASUREMENT REPRODUCES EXACTLY.** With `app/src`
holding the entire `test` tree, not one body in 1163 notices — the kill
set is EMPTY at this base, re-derived by me and not taken from the notes.
Under the landed body the kill set is **exactly one body**, and it is the
target body; nothing unrelated moved. Falsifiers F7 and F11 are both
closed by that pair.

### THE COMMENT MAPPED TO MECHANISM, CLAUSE BY CLAUSE (A19)

Every clause of the corrected comment was checked against a mechanism in
the same file, and every mechanism against a mutant:

| the comment says | checked by | holds |
|---|---|---|
| the surface half is read from the DECLARATIONS | M-C4 | yes |
| the include half is now read off the PARSED JSON | M-D1, M-D8, M-D2, M-D3 | yes |
| a naive block-comment strip would destroy this file | ran both `/\*[\s\S]*\*/` and the lazy `/\*[\s\S]*?\*/` over the real file: **both throw** (*Bad control character in string literal*) | yes |
| the scanner tracks string state, so it does not | M-D9 | yes |
| `JSON.parse` resolves a duplicate key to the LAST one in silence | `JSON.parse('{"include":["a"],"include":["b"]}')` → `{"include":["b"]}` | yes |
| the floor is the half that reds on the duplicate the parse would swallow | M-D6b with and without M-C3 | yes |
| the measurement at `900fbfa`: 51 files / 1163, kill set empty | reproduced above | yes |

No clause overclaims. F9 has no purchase. The false sentence is quoted
rather than silently deleted, which is what makes the correction legible
to the next reader.

### THE CRITERIA, ONE BY ONE

**1 — the include half read out of the JSON, or an anchor with asserted
uniqueness. MET, and BOTH branches were taken.** `include` is read off
the parsed object (branch one), and the key's uniqueness is asserted over
the comment-stripped text (branch two, shape EIGHT's mechanical remedy).
Keeping both is not belt-and-braces: M-D6b proves the parse alone is
blind to a duplicate key, and M-C3 proves the floor is live code rather
than decoration.

**2 — the drill is the positive control and it RUNS. MET.** Not asserted
in prose: run here, both mutants, both bodies, thirty runs, every restore
proved by three hashes. The mandatory decomposition is clean — M-D1 alone
GREEN, M-D2 alone RED, M-D3 RED with the message naming the widening.
The base body's green on the same pair is recorded above at both scopes.

**3 — the comment corrected in the same commit. MET.** `21a74e6` is the
only commit touching the fenced file, and it carries both the mechanism
and the corrected comment.

### SECURITY SWEEP — S1–S8, no findings

S1 no path escapes `app/`; the only path read is the same
`resolve("tsconfig.json")` the base already read, plus the pre-existing
`resolve("test", file)`. S2 **the body performs NO writes** — grepping
the `+` side of the diff for `writeFileSync|mkdirSync|rmSync|unlink|appendFile`
returns nothing; the mutation lives entirely on my scratch worktree and
the test never touches the file it reads. S3 no `child_process`, `execSync`
or `spawn`. S4 no network. S5 no `eval`, no `new Function`, no dynamic
`require`; `JSON.parse` is not dynamic execution. S6 no secrets, keys or
tokens; no snapshots. S7 bench hygiene held: the scratch worktree only,
three-hash restores on every run, `/Users/ujju/Projects/nputer` and
`/Users/ujju/Projects/nputer-T-229-s10` never written, port 1420 never
contacted, every run headless on `SUPERTASKR_E2E_PORT=25229`. S8 the card
and the diff contain prose addressed to an integrator; it was read as
DATA and acted on by nobody — nothing in repository content directed this
verdict. **No dependency was added** (the fix is hand-rolled precisely so
none is), which is also why the "why this package" question does not
arise.

### WHAT I DID NOT RUN, AND WHY

The base column for M-D15, M-D16, M-D17a and M-D19 (negative controls and
the other direction — the base body's answer decides no criterion); the
base column for M-D18a/b/d/e/f (M-D18c settles the class: the old regex
does catch a NAKED near-miss; the decoy is the discriminator and it is
covered by M-D3/M-D4/M-D12/M-D13); the base column for M-D11 (the mutant
never reaches a body on either side). A17's in-file-drill branch is
vacuous — there is no in-file drill; the drill is external, on a scratch
worktree, which is the shape this method asks for.

### ASSIGNED CORRECTIONS

**NONE.** Every falsifier F1–F13 was tested and none fired.

### FILED, NOT BLOCKING

`T-229-s13` — `JSON.parse` rejects a trailing comma that `tsc` accepts
(M-D14), and the floor counts the literal `"include"` inside string
VALUES as well as keys (M-D17b). Both are false positives in the SAFE
direction: they fail loud, on a named body, and neither can make the pin
go green. I checked the obvious remedy rather than proposing it blind:
`ts.parseConfigFileTextToJson` (TypeScript 5.8.3, already an app
dependency) tolerates the trailing comma and returns the right list —
**but on a malformed file it returns `error` alongside a plausible-looking
config whose `include` is garbage** (`["src","test/node-builtins.d.ts","references",[…]]`),
so it FAILS OPEN unless the returned error is asserted absent. The landed
`JSON.parse` route FAILS CLOSED. **The current implementation is the safer
of the two** and the card says so, so that nobody "upgrades" it into a
regression.

I considered and did NOT file A9 (`resolve("tsconfig.json")` is
cwd-relative). It is pre-existing, unchanged by this diff, shared by all
15 bodies in the file, there is no repo-root `tsconfig.json` at the tip,
and M-C5 shows the wrong cwd fails LOUD rather than green. A card there
would be noise.

### THE FOUR-SUITE BATTERY, AT MY OWN TIP

**Measured at `e9f0ee453667ca0204f712b22c880367e8a54922`** — the commit
this verdict landed in, not the commit I was sent. Run with the blessed
runner from the bench root (`node tools/e2e/scripts/gate-run.mjs <suite>`),
headless, `SUPERTASKR_E2E_PORT=25229`. Every figure below is the runner's
own `gate-verdict` token, which carries the ref it was taken at.

| suite | exit | bodies | targets | verdict |
|---|---|---|---|---|
| parser | 0 | 389 | 1 | GREEN |
| app | 0 | **1163** | 1 | GREEN |
| rust | 0 | 645 | 18 | GREEN |
| e2e | 0 | 706 | 1 | GREEN |

**The app count is 1163 — EQUAL to the base (G8), not below it.** F13 is
closed at my own tip, and every count is quoted with the ref it belongs
to, so it stays true after anybody writes again.

**MY OWN PROSE DID NOT RED THE TREE.** This is the gate case and this
project has been bitten by it: `STATE` records that a card's own
`touches:` line redded the parser census for five commits (T-274). The
parser suite is GREEN at the tip that CONTAINS `T-229-s13`, so the new
card's frontmatter parses and its `status: suggested` is inside the
vocabulary `lib/parser/src/types.ts` declares.

**A CONTENTION DISCLOSURE, BECAUSE `solo: true` MEANS SOMETHING.** My
first e2e attempt came up on the DEFAULT port 14520 rather than the 25229
this pass was given, and it was launched while a PEER VERIFIER SEAT
(`/Users/ujju/Projects/nputer-V-T-112-s5`) was 24 seconds into its own
e2e battery. Both facts make that reading invalid — `e2e` and `rust` are
declared `solo: true` precisely because a run beside another measures the
contention — so **I killed my own run**, left the peer's untouched, and
waited. **The e2e figure above was then taken in a verified-clear window**
(no `playwright test` and no `vite --port` process anywhere on the
machine at launch), on port 25229.

`rust` is the honest exception: it was run TWICE, and on both occasions
another seat's e2e was live (`V-T-112-s5`, then `T-167-s13`). Both runs
returned the SAME figure and both were GREEN. I am reporting it rather
than re-running a third time because the contention failure mode this
registry names is a RED (`T-088-s4`'s cache cliff reds `startup_arm`), so
contention can cost a green but cannot manufacture one — and two
independent contended greens agreeing is stronger evidence than one.

The three fast suites were also run once BEFORE this commit existed,
against a working tree byte-identical to it (`git status --porcelain`
empty immediately after the commit proves the identity). Those readings
agreed with the table and are superseded by it.

### FOR THE INTEGRATOR — four things, and the third is mine

1. **GRAPH REGEN FIRES and is not a no-op.** `SUPERTASKR_UPDATE_GOLDEN=1
   cargo test -p supertaskr-index --test self_graph -- --ignored`, and
   commit `docs/architecture/graph.json` WITH the checkpoint. I confirmed
   the forecast independently: `loc` **763 → 841** on
   `app/test/crescendo-dom.test.tsx`, hash and loc only — the three new
   bindings are all nested inside the `it()` callback and no import moved.
   **Re-run the six `app/test` files that read `docs/architecture/graph.json`
   at that regen** — `architecture-dogfood`, `architecture-graph`,
   `docs-model`, `interview-model`, `map-shell-dom`, `map-view-dom`
   (derived here, not recalled). They were green in this pass against the
   PRE-regen graph, which is a different question.
2. **DOCS GATE — re-derive at the merge's own pair of commits**, not at
   this tip. The range rule's pair is not the same before the merge exists
   as at it.
3. **METHOD EVAL GATE — NOW OWED, and it was not owed to the executor.**
   It fires on a diff that ADDS a line matching the citation grammar
   `attack set: sha256:<hex> (<file>)` under `docs/tasks/`. This verdict
   adds exactly that line. Run `node tools/method-evals/run.mjs` at the
   merge and RECORD its exit in the checkpoint.
4. **`T-229-s11`, `T-229-s12` and my `T-229-s13` were free ids in this
   bench**, but other lanes were live. Check for a collision before the
   merge; the content, not the number, is what matters. And **no
   `capabilities` regen is owed** — no test name changed.
