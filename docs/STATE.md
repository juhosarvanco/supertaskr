# State

Updated: 2026-08-17 by integrator (T-042 merge), claude-opus-5 @fresh

## Just completed
T-042 (genesis switch truthfulness — the snapshot, the transitions, the
echo, the change log; `app-shell` + `app-interview`, M, milestone 3,
F-03) done and merged. Built by `claude-opus-5 @fresh`, verified by
`claude-opus-5 @fresh`, `review: same-model`, **APPROVED first pass**.
Five criteria, absorbs T-024-s3, T-026-s4, T-026-s5, T-026-s6, six code
files.

**THIS MERGE CLEARS T-027'S LAST BLOCKER.** T-042 was sequenced ahead of
T-027 under grant 1, and both halves of that sequencing are now settled:
the card's ORIGINAL premise (that T-027 was criterion 4's second
consumer) was corrected to FALSE by T-027's own planning pass, and the
BETTER reason held — criterion 1. A genesis switch onto a folder whose
`docs/` already held files sent no snapshot, so T-027's turn-1 baseline
would have been empty and every pre-existing file would have chipped as
if the planner had just written it. T-027's plan chose to accept that
lie and tripwire it; landing T-042 first removes the case by
construction and **DELETES a tripwire instead of adding one**.

**WHAT SHIPPED.** `PickOutcome::Genesis` carries
`snapshot: Option<DocsSnapshot>`, collected **after** the arm ack —
`ArmGenesis`'s ack became `Result<bool, String>` so the arming thread
reports whether a plain `docs/` armed, rather than the caller
re-statting and guessing across the validate→arm window.
`ensure_docs_watch` now MEASURES the armed-state transition
(`was_armed` at the top, `target.docs.is_some() != was_armed` at the
bottom) instead of returning `true` from inside one arm, so **one rule
covers both directions** — "a watch-state transition is news the tree
cannot carry" — and three properties fall out of it rather than being
written as cases (a wholesale replacement stays silent; a `docs/` whose
`watch()` fails reports no transition; a failed RE-arm now reports
armed→unarmed, which is true and was previously invisible). The
`model-updated` echo reads provenance via an exported
`outcomeCarriesSnapshot(outcome)` instead of an always-true seq guard.
And the render-phase ref stamp is **RATIFIED in place** per the
architect's ruling: `genesis-derive.ts` is a **0-byte diff** and nothing
moved into the store. THREE comments that disagreed with the code now
agree with it — the card named two, and `reducePickOutcome`'s
genesis-case comment was a third the card did not name.

### THE ORDERING PROOF — the best evidence in the task, and it was BUILT, not read

The verifier constructed both orderings in an isolated copy of the
worktree, with a `#[cfg(test)]` hook writing a file into each ordering's
OWN window between the two tree reads:

- **collect AFTER the ack (production)** → snapshot
  `["docs/ARCHITECTURE.md","docs/GAP.md"]` — **the gap file rides**.
- **collect BEFORE the arm** → snapshot `["docs/ARCHITECTURE.md"]`, the
  file on disk, and **no emit at all in a 1.5 s window** after
  `settle()`.

The mechanism is the one `open_as_project`'s own comment has stated
since T-007: `rearm` sets `target.last` to the tree it saw, so a file
written before that baseline is IN it, absent from the snapshot, and its
batch collects EQUAL and suppresses. Reusing the arm-time collection
loses the same file by the other route — its tree would ride at the
switch's seq, HIGHER than the overtaken emit's, so it clobbers it. **The
double collect is load-bearing and the builder's ordering is the one
that survives.**

**TEN TRANSITION ATTACKS, none double-emitting, none wrongly silent**:
plain docs/ appears → 1; replaced by a SYMLINK → 1; symlink → plain dir
→ 1; replaced by a regular FILE → 1; file → dir WITH content → 1
(transition AND content change: still one, because the rule adds a
REASON to emit, never a second emit); `chmod 000` → 1; `chmod` back to
755 → 1; create/delete/create in ONE batch → 1; create/delete NETTING TO
NOTHING → **0**; identical-bytes inode swap → **0** (a replacement is
not a transition). The symlink and regular-file cases are the ADR-010
posture: the app refuses to follow them, so from its view `docs/` is
gone, and it now SAYS so — correct, and new.

**SUPPRESSION COUNTED, not sampled**: 20 batches over an unchanged tree
→ **0**; three content changes each followed by five quiet batches →
**exactly 1 per change, 3 total**, asserted after each; a wholesale
replacement carrying IDENTICAL bytes on a provably different inode →
**still 3**. **The over-widening drill reds 5 tests**, including
**BOTH** T-018 additive-only pins
(`a_dead_sentinel_leaves_the_existing_watch_fully_working`,
`a_vanished_root_never_panics_the_batch_handler`). The narrowing drill
reds exactly one. **Fenced from both sides.**

### THE FOUR CORRECTIONS THE VERIFIER MADE — none failed a criterion, and one is a number this project has been repeating

1. **`EXPECTED_GRANTS` is 92 grants / ~6135 bytes, NOT 7728.** The
   figure was inherited from T-026's report and restated across tasks
   without anyone re-measuring it. **Re-measured a third time at this
   merge and the correction holds: 92 grant literals, 6134 bytes over
   `acl_pin.rs:54-147`** (the verifier's 6135 differs by one byte of
   span convention, not of substance). The load-bearing claim is
   untouched — `acl_pin.rs` is a **0-byte diff**, sha256
   `8d24cbad706d9e6f09eca6888cf8a21d264039cac6153271093ea4847b60b00e`
   identical at `9cd4ee3` and at this checkpoint, which subsumes the
   grant claim entirely. **This is the "a card's own numbers are a claim
   to verify" pattern again, and this instance is worse than the others
   because the number was propagating BETWEEN tasks, not just inside
   one.**
2. **"Suppressed forever" overstates it.** Measured: ordering B's lost
   file self-heals on the next UNRELATED write — after being invisible
   for the whole 1.5 s window, writing `docs/OTHER.md` produced an emit
   carrying all three files. The loss is **indefinite, not eternal**,
   and T-007's own card already uses the accurate wording ("can be
   suppressed until the next change"). The ordering is still
   load-bearing; the pane still lies for as long as nothing else moves.
3. **The optional TS field's SECOND justification is FALSE.** The notes
   say a required `snapshot` "would have forced me to edit T-045's lane".
   It would not: `tools/e2e/fixtures/shell.ts` imports only
   `DocsSnapshotPayload` and never `PickOutcomePayload`, and with the
   field made required **tools/e2e typechecks clean, exit 0**. The real
   cost is 5 sites in the app's OWN tests. **The FIRST reason — T-018's
   additive-payload precedent — is sound and sufficient on its own, and
   the ruling rests on it.**
4. **The canary count is 14, not 11.** 3 cargo + 11 vitest bodies
   poisoned, 14 red.

### The three suggestions

- **T-042-s3 (verifier-filed) — the carried tree is dropped by its own
  watermark when an emit overtakes the switch.** Measured through the
  real reducers: in-order `switch@7` → fileCount **2**; overtaken by
  `emit@8` → the switch reduces to fileCount **0** at seq 8 — the
  T-026-s4 symptom one layer down. **NOT a regression** (the branch
  point produced the same empty model and additionally regressed the
  watermark) and **NOT a criterion-1 failure** (the outcome demonstrably
  carries the tree). Filed because criterion 1 is what makes a fix cheap
  for the first time. **Explicitly not blocking T-027**: it needs an
  emit to overtake the switch, which cannot happen at the moment T-027's
  turn-1 baseline is taken.
- **T-042-s1 — the lane never sees the carried tree.** The real-input
  lane's genesis specs drive only the snapshot-less shape and its
  hand-mirrored payload type has no `snapshot` field, so **the whole of
  criterion 1 is invisible to the one lane that uses a real browser**.
  Every citation verified. It WIDENS T-041-s2's mirror problem, and now
  asymmetrically — the third copy is missing a field the other two have.
- **T-042-s2 — the probe and the snapshot describe different moments.**
  `Genesis` carries a `probe` measured before the arm and a `snapshot`
  collected after the commit; nothing says which wins if they disagree.
  Verified available: the genesis case sets `resolvedProbe: null` and
  never reads `outcome.probe`, so the field has no live consumer on that
  path. Low urgency (ADR-017 keeps the app out of docs/).

### THE CONTROL-BYTE FIX — architect-instructed, out of fence, and it fired on the integrator too

**INSTRUCTED BY THE ARCHITECT, not a drive-by.** T-034's checkpoint
recorded a live control-byte instance on main —
`app/test/startup-screen.test.tsx`, **T-050's file, commit `e50fc1e`** —
carrying raw **NUL + BEL + ESC at byte offsets 2751–2753 and 9508–9510**
inside its `HOSTILE` fixture constant, so `file(1)` classified the
source as **data**. T-034 deliberately left it (another lane's file);
the architect instructed this merge to fix it, because it matters more
than the earlier refutation suggested: **T-034's new C0 gate walks
`app/src/architecture/` only and cannot see it**, and the file is
invisible to exactly the tooling agents audit this repo with.

**FIXED, with behaviour-identity PROVEN rather than assumed.** Both
sites now use the repo's established escape idiom (`\u0000 \u0007 \u001b`
— the same `\uXXXX` shape T-034's fix left in `map-layout.ts` and
`task-waves.ts`). The proof, at the level of VALUES not text:

- **Exactly two lines differ** (73 and 237) — line count 329 both sides,
  file 13002 → 13032 bytes (+30, exactly 6 raw chars → 36 escape chars).
- **`HOSTILE` evaluates identically**: length 10083 both sides, sha256
  **`5e44c13be3cdd3e2ac8710aa84fdc7a7ea816a0057713ae3830b4e63f3971213`**
  on both revisions.
- **The hostile-payload assertion still asserts the same codepoints**:
  the `toContain` argument evaluates to `[0, 7, 27, 91, 51, 49, 109]` on
  both revisions — NUL, BEL, ESC, `[`, `3`, `1`, `m` — and is still a
  substring of `HOSTILE` on both.
- **Round-trip**: the NEW source with its two escape triples turned back
  into raw bytes is **byte-identical to the OLD source**, so the escaping
  is provably the ONLY change.
- **`file(1)` before → after: `data` → `HTML document text, Unicode
  text, UTF-8 text`.** Zero C0/DEL bytes remain.
- The suite ran green afterwards as part of the app's 625.

**AND THE GRAPH PROVES IT IS STRUCTURALLY INERT**: in the regenerated
graph that file keeps **loc 328 and 13 symbols**, only its content hash
moves — so it shifts no dogfood assertion.

**THE SHARPENED FINDING, measured first-hand on that exact file, and it
is worse than "rg silently omits matches".** Whether a grep-shaped gate
survives a NUL is **TOOL-DEPENDENT**, and the three tools disagree in
three different ways:

| tool | on the raw-byte file | after the fix |
|---|---|---|
| `grep` on this PATH (**ugrep 7.5.0**) | **NO OUTPUT AT ALL, exit 1** — for every pattern, before and after the NUL alike | both matching lines, with line numbers |
| `/usr/bin/grep` (BSD 2.6.0-FreeBSD) | `Binary file … matches`, exit 0 — a signal, but **no line text** | both matching lines |
| `rg`, file named explicitly | `binary file matches (found "\0" byte around offset 2751)` — a notice, **no content** | both matching lines |
| `rg`, **recursive over the directory** | **NOTHING AT ALL, exit 0** — the match is silently absent | both matching lines |
| **`git grep`** | **2 matches, exit 0 — NOT BLINDED** | 2 matches |

So `/usr/bin/grep` degrades GRACEFULLY (it still says "something is
here"), while **the `grep` on this PATH goes fully blind and `rg` in the
mode anyone actually uses it — recursive — omits the file without a
word.** That is the tooling agents audit with, and it is why the fix is
worth its two lines.

**AND THE ONE THAT WAS NEVER BLIND IS `git grep`** — measured against
the raw-byte blob at `9cd4ee3` itself, not a copy: it returns the same
**2 matches** there as it does at HEAD. It reads blobs out of the object
store rather than sniffing a file on disk, so a NUL never triggers a
binary skip. **That is an actionable finding rather than a footnote: for
auditing THIS repo, `git grep` is the searcher that cannot be hidden
from, and it is the one to reach for when the question is "does this
string exist anywhere in the tree".** It also sharpens the gate
argument in the opposite direction from where it started — the hazard
was never "the repo cannot be searched", it is **"the three searchers
most likely to be reached for disagree, and two of them lie quietly"**.

**THE MECHANISM FIRED ON THIS INTEGRATOR THREE TIMES WHILE FIXING IT —
NINTH, TENTH AND ELEVENTH REPRODUCTIONS ACROSS FOUR SESSIONS.** (1) A
Bash command carrying a literal control character in a regex was
**refused outright by the tool layer** ("control characters that would
be hidden"). (2) Writing the escape TEXT into a comment in
`app/test/architecture-dogfood.test.ts` **landed the raw CHARACTERS
instead**, and `file(1)` immediately called that fixture `data` — i.e.
**while documenting the fix I reproduced the defect in the very file
that records it.** (3) Worse still, and the one worth remembering:
writing the same escape text into **THIS DOCUMENT** did it again, so for
several minutes `docs/STATE.md` — the file whose whole job is to carry
this finding forward — was itself classified `data` and invisible to
the same searchers. **All three caught within seconds by the habit, all
three repaired at the byte level with a script, all three re-swept to
zero.** **The habit is now five-for-five and is the only thing that has
ever caught this: sweep your own output with `file(1)` or a byte scan
before committing.** The practical rule that follows, and it is the
actionable half: **escape text cannot be typed through the editing tools
at all — every attempt at this merge produced the CHARACTER rather than
the six-character escape. Write it with a script that constructs the
bytes, then verify.**

## In progress / broken right now

**T-027 DISPATCHES FROM THIS CHECKPOINT — not from the merge, and the
distinction is load-bearing.** Every graph regen in this project's
history has landed in a CHECKPOINT commit, **six for six**, so a lane
cut from a merge commit inherits a stale `docs/architecture/graph.json`
and reds the two dogfood fixtures on its first run. **T-014 was the
worked example.** Branch T-027 from **this checkpoint**, not from
`64469dd`.

**ONE TASK IS `building`** (the parser re-parse confirms it — it was two
before this merge): **T-014**, `nputer index --check` binary, worktree
`../nputer-t014`, `crates/nputer-index/`. **It is APPROVED and awaiting
merge, and the order is: T-027 dispatches FIRST, then T-014 merges.**
T-014 matters for one further reason — it is the named retirement
trigger for the T-009-s1 interim regen rule this checkpoint just
exercised for the **twenty-fourth** time. Its worktree was NOT entered
by this merge; the only cross-lane reads were of git REFS from the main
checkout, which is read-only.

**T-030-s3 IS STILL THE CORRECTNESS-OF-RECORD ITEM AND ITS DEADLINE HAS
PASSED.** `blocked_by` edges can silently RE-POINT when an unpadded
sibling id appears. T-034 has SHIPPED the waves, the critical path and
the worst blocker, all computed from `blocked_by` — so a silently
re-pointing edge is **a wrong picture in a pane the human is about to
look at**, not a latent parser bug. Unchanged by this merge, and now one
merge older.

## THE MERGE ITSELF — what an integrator did and proved

**THE MERGE WAS CLEAN, AND THE OVERLAP WAS NOT ZERO THIS TIME.** Merge
commit **`64469dd`**, merge-base **`8dadb59`**, main before at
**`9cd4ee3`**. Both changed sets were enumerated and `comm -12` returns
**EXACTLY ONE FILE — `docs/CONVENTIONS.md`** (10 branch files against 46
main-side files; T-030, T-045 and T-034 all landed on main since the
branch point). That single overlap merged cleanly because the two hunks
are far apart: the branch appends its render-phase-ref-stamp gotcha at
old line 156, and main's T-045/T-034 edits sit at old lines 68 and 134.
**`git merge-tree --write-tree` was run FIRST** and answered a single
tree with zero conflict markers; **the merged tree hash reproduced that
prediction exactly — `56b0a101008d455e69a27b2143b372aa84f1a93a`.**
`git diff --check` clean.

**THE `<main-before>..HEAD` RULE WAS USED, AND THE TRAP WAS REPRODUCED
ON PURPOSE FOR THE SECOND MERGE RUNNING.** Restricting **`9cd4ee3..HEAD`**
(what this merge ADDS) to the BOOT GATE limbs returns the correct
**THREE** files — `app/src-tauri/src/docs_watch.rs`,
`app/src/genesis/GenesisPane.tsx`, `app/src/lib/watcher-store.ts`.
Restricting the naive **`8dadb59..HEAD`** (merge-base) returns **EIGHT**,
the extra five being T-034's `app/src/architecture/**` files, **already
on main and already boot-gated at their own merge**. Both derivations
FIRE here so nothing hinged on it again — but the merge-base derivation
would have made this merge look like it touched the map pane, which it
does not. **Four integrators have now hit this; the fix is still one
clause in both CONVENTIONS bullets naming which diff.**

**BOOT GATE (T-046): FIRED, RAN, GREEN — and it was OWED here**, because
neither the builder nor the verifier ran it (both declined loudly and
correctly: the dispatch fences 1420 and both sessions were headless).
Scratch port **14580**, chosen after probing 14580–14583 free and
deliberately avoiding 1420, the lane default 14520, the builder's
14534/14535, the verifier's 14542, T-045's 14555 and T-034's
14570/14571. Run **unpiped, redirected to a file, with the exit code
taken from `$?`**:

    [boot-check] port 14580 free — spawning `npm run tauri dev -- --config {…}`
    [boot-check] app: [nputer] project folder: /Users/ujju/Projects/nputer
    [boot-check] detected startup line 1/2: [nputer] project folder:
    [boot-check] app: [nputer] window "main" created
    [boot-check] detected startup line 2/2: [nputer] window "main" created
    [boot-check] process tree stopped (exit=null signal=SIGTERM)
    BOOT_EXIT=0

**Exit 0, both `[nputer]` lines.** After it: `lsof` on 14580 **empty**,
`pgrep -fl tauri-boot-check` **empty**. `pgrep -f "tauri dev"` DOES
return three pids (64056/64058/64073) and **they are not strays** — `ps`
puts their start time at **Mon Aug 17 01:01:22**, hours before this
session, and they are the human's own app tree whose vite child holds
1420. Checked rather than assumed, exactly as T-034's merge recorded.

**SUITES ON MERGED MAIN**, all four re-derived here first-hand, fresh
installs (`node_modules` removed in all three packages), ADR-011 order.
**Every expectation was DERIVED rather than trusted, and all four
landed:**
- lib/parser `npm ci` (0 vulnerabilities) + `npm run build` clean +
  `npx tsc --noEmit` clean + `npx vitest run` **197/197 (10 files)** —
  unmoved, as a branch with a 0-byte parser diff must be.
- app `npm install` (0 vulnerabilities), `npx tsc --noEmit` clean,
  `npm run build` exit 0 (**256 modules**), `npx vitest run` **625/625
  (35 files)**. **DERIVED, not inherited:** the branch reported 546
  against a 535 baseline, but main had moved to 614, so the merged
  expectation is **614 + 11 = 625** — and it came out green on the
  FIRST run after the fixture edits, which is the evidence that the
  reconciliation was complete rather than lucky.
- app/src-tauri bare `cargo test` **220 passed + 3 ignored, 0 failed**,
  exit 0, **zero compiler warnings**, summed across **11 test binaries**
  (108/0/0/32+1/68/3/7/0+1/2+1/0/0) — **NOT piped through `tail`**,
  written to a file with the exit code from `$?`. Main's 217 + the
  branch's 3.
- tools/e2e `npm ci` + `npm run typecheck` clean +
  `NPUTER_E2E_PORT=14581 npm test` → **54 passed in 8.3s**, headless,
  one worker, retries 0, **no skips, no retries, no flakes**. **54, not
  more**: T-042 adds zero lane specs — which is precisely T-042-s1's
  complaint. `lsof` on 14581 after the lane: **empty**.
- `npm run lint:tokens` → `clean (99 files scanned under app/src,
  app/test, tools/e2e)`, exit 0, **ZERO allowlist**. **NINETY-NINE, and
  the arithmetic reconciles exactly**: main's 98 + T-042's 1 new file
  under `app/test/` = 99.
- `npm run lint:tokens -- --selftest` → **49 samples green, 14
  walk-policy checks green**, exit 0.

STANDING INTEGRATOR PRACTICE (T-009-s1, the ratified CONVENTIONS interim
regen rule; retires when T-014's `nputer index --check` becomes the
gate) — **TWENTY-FOURTH** exercise.
- **THE RULE FIRED**: four `.ts`/`.tsx` files outside `docs/` in
  `9cd4ee3..HEAD`.
- **THE DISCRIMINATING EVIDENCE, taken BEFORE the regen** with
  `NPUTER_UPDATE_GOLDEN` confirmed UNSET at the shell: the plain
  (non-golden) ignored self-check was **RED, exit 101**, naming the
  committed graph stale. Re-run after the final regen:
  `self_graph_is_current … ok`, **exit 0**.
- **THE DELTA.** Main's baseline confirmed first-hand at **99 files /
  738 symbols / 1158 edges** (sha256 `58545728…`, 434,701 bytes —
  matching T-034's record exactly). After regen: **100 files / 757
  symbols / 1170 edges**, **one file added, nothing removed**. Edges
  move **+12**: import **+5**, call **+5**, type_ref **+2**. Only the 5
  imports can reach the fixtures (`derive.ts` skips every non-import
  edge). Languages still `["ts"]`, **zero `.rs` files indexed**, which
  is why the biggest half of this diff — all of `docs_watch.rs` — moves
  no graph node at all (Rust extraction is still T-010's).
- **FIVE ASSERTIONS MOVED, and the forecast was RIGHT for once — but it
  was still re-derived from scratch rather than trusted.** Everything
  was derived **from the added-file list and the registry globs in a
  script of my own**, written against the globs rather than run through
  the app's `derive.ts`, and all of it BEFORE the suite was run. The
  verifier's forecast (scaled from the branch's 94→95 to main's
  99→100) reproduced exactly.
- **Full moved set**: file count `toBe(99)` → 100 and the `it()` name ·
  `["C-05", 46]` → 47 · `["C-05","C-10","confirmed",24]` → 25 · and in
  `map-dogfood-render.test.tsx`, `"committed graph · 99 files"` → 100.
- **NO LIST MOVED, AND THAT WAS DERIVED RATHER THAN HOPED.** T-034's
  merge found the fixture's standing trap in a new shape — **LISTS
  behind counts**, where a list can move while every count in the same
  body is already right — and it cost that merge three missed
  assertions. **Swept for directly here**: this fixture enumerates a
  `files` array for **C-12 only, never for C-05**; the six D1
  `fileEdges` lists are all for UNDECLARED pairs and **C-05→C-10 is
  CONFIRMED**, so it has no D1 row; and the `fileEdges` list in the
  C-0x→C-06 seam test is **C-10→C-06**, a different edge the one new
  import does not touch. The single new cross-component file edge is
  `genesis-switch-truth.test.tsx => app/src/lib/docs-model.ts`
  (docs-model.ts is C-10's by name); the file's only other module
  reference is `../src/App`, which is C-05's own and therefore
  intra-component. **UNMOVED and derived as such**: `derived.issues`
  `[]`, `unmappedFiles` `[]`, the 28 relation rows and the tally, the
  six D1 and three D3 findings, the 11 map nodes and 28 map edges, and
  the drift-flag set — because C-05 already declares C-10, so no new
  component PAIR appears and no drift ring moves.
- **ORDER PER ceaa949, and it carried an extra passenger this time**:
  the two app fixtures are themselves indexed, so **the fixture edits
  were made BEFORE the final regen** — and so was the control-byte fix,
  which changes an indexed file's bytes. The regen was then run
  **twice** for byte-identity — sha256
  `88e1daf69645e5734acf43a910e36e03faeb9dca8464bc10f527a144b9a0a289`,
  **441,937 bytes, identical after both runs**.
- **`lib/parser/test/smoke.test.ts` deliberately NOT touched**: T-042
  declares no component and changes no registry file, so the T-024
  three-fixtures rule does not fire in its registry form. Confirmed by
  re-running lib/parser after the regen: **197/197**.

**1420 WAS NEVER BOUND, CONTACTED OR SIGNALLED.** It was OBSERVED with
`lsof` only: the human's vite is **pid 64249** holding `[::1]:1420` with
one established connection to their webview — **the same pid T-030's,
T-050's, T-045's and T-034's checkpoints recorded, so their app has
still not been restarted.** Confirmed identical before and after the
boot check.

**THE SHARED-WORKING-TREE SIDE EFFECT — AND THIS TIME THE CSS DID NOT
MOVE.** The app bundle came out **`index-CJtBhg4R.css` 41.98 kB** —
**byte-identical to T-034's, same content hash** — and
**`index-DkVn3-3y.js` 466.03 kB** against T-034's `index-XAMx99Qy.js`
465.89 kB. So only the JS moved, and only by ~0.14 kB: **there is NO new
CSS in this merge**, exactly as the builder claimed. The human's vite
(pid 64249, never restarted) serves through this tree, so their running
window now carries T-042's logic — but unlike T-034's merge, **nothing
they are currently looking at changes appearance**. The behaviour change
is reachable only by starting an interview on a folder that already has
a `docs/`.

INTEGRATOR JUDGMENT CALLS, recorded.
- **ARCHITECTURE: EDITED, in two places, and the reasoning is that the
  genesis switch's CONTRACT changed rather than its implementation.**
  (1) The **Interfaces "Genesis:" bullet** described entry as two
  zero-argument commands over a folder with no plan, and then jumped
  straight to the rendering half. A reader would have concluded that a
  genesis folder has no `docs/` and that the pane starts empty — which
  is exactly the assumption T-042 removed. The bullet now says that **"no
  plan" is WEAKER than "no docs/"**, that the outcome carries the tree
  as an optional `DocsSnapshot` at the switch's own seq, that `None`
  means genuinely no docs/, that **nothing new crosses the boundary**
  (same snapshot type, collector and containment rules as the
  `docs-changed` channel since T-003 — a second carrier, not a new
  content class), and that **the collect-after-ack ORDER is
  load-bearing**, with the suppression mechanism stated so nobody
  "optimizes" the double collect away. (2) The **C-05 row's running
  record** gained T-042's clause naming all three truthfulness fixes.
  Swept for stale enumerations per the T-050 lesson: the `window`
  test-harness bullet enumerates `__nputerShellHarness`'s four
  functions and is UNAFFECTED (`ShellHarnessSnapshot` is a proven 0-byte
  diff), and nothing in the file enumerates `PickOutcome`'s variants.
- **`docs/architecture/components/C-10-docs-watcher.md` NOT EDITED, and
  the dispatch's premise needs one correction for whoever writes the
  next brief: C-10 HAS NO ROW IN `ARCHITECTURE.md`.** That file's
  Components table stops at **C-07**; C-08…C-14 exist only as registry
  files. C-10's registry prose ("Rust side walks and watches docs/,
  ships contained `{ path, content }` snapshots over IPC") is now
  INCOMPLETE in the same way the Interfaces bullet was — those snapshots
  have a second carrier since this merge. **It was left alone
  deliberately**, on T-034's precedent: the registry is the ARCHITECT's
  territory, the integrator regenerates and the architect rules; its
  `paths:` and `depends_on:` are all still correct; and editing a
  registry file at a merge is the one thing that fires the T-024
  three-fixtures rule. **Flagged for the architect, not silently
  absorbed.**
- **ROADMAP: EDITED**, and the established discriminator ("does the task
  add a USER CAPABILITY") comes out YES. The F-03 Progress record's own
  words were the tell: it describes the entry as "open a folder with **no
  `docs/` in it**", which is precisely the condition T-042 weakened. The
  new paragraph says the entry widened **by weakening a condition rather
  than adding a control**, and that the first frame of an interview now
  tells the truth about what is already on disk. Milestone 3's
  sequencing sentence was left ALONE.
- **THE TASK FILE'S STAMPS WERE ALREADY COMPLETE** — unlike T-034's,
  this card arrived with all five (`builder`, `verifier`, `built_by`,
  `verified_by`, `review`) filled in and correct, so only `status:
  building` → `done` changed. **Parser-validated before and after**: 0
  issues both times, and the re-parse reads all five stamps back
  correctly.
- **THE CONTROL-BYTE FIX WAS MADE, and it is the one out-of-fence edit
  in this merge — instructed by the architect, not a drive-by.** Its
  reason is recorded above: T-034's C0 gate is scoped to
  `app/src/architecture/` and cannot see it, `lint:tokens` reads through
  Node where a NUL is inert, and the file was invisible to the search
  tooling agents audit with. Behaviour identity was PROVEN at the value
  level (identical sha256 for `HOSTILE`, identical codepoints for the
  assertion argument, byte-identical round-trip) before anything was
  committed. **No new suggestion id was minted** — there is still no
  precedent for integrator-filed `-sN` cards, and **T-034-s5 remains its
  home**, now with its instance REMOVED but its gate still unbuilt.
- **NO NEW ADR (three-prong).** (a) An ADR charters a DECISION between
  live alternatives with cross-component blast radius. **The one
  architect ruling in this task — criterion 4, ratify the render-phase
  ref stamp rather than relocate it — was made BEFORE dispatch, recorded
  in the criterion, and landed in its established home**: a CONVENTIONS
  gotcha (three conditions: GUARDED, BOUNDED, DERIVED FROM PROPS) plus
  the component header. That is the house shape for a PATTERN rule, and
  it explicitly keeps the relocation option OPEN for a future second
  consumer — the opposite of chartering a decision. The other three
  criteria are **corrections of code to match claims already made**: a
  snapshot the path already collected, a transition rule stated once
  instead of twice, a guard reading the provenance it always meant.
  **Correcting a lie is not a decision.** The one candidate with genuine
  cross-cutting reach is again the **C0/searchability rule**, and the
  standing ruling (from T-047's spawn-hygiene question, restated at
  T-034) is that the moment to charter is when there is a single rule to
  charter — i.e. when T-034-s5 lands. **This merge removed an INSTANCE;
  it did not create the rule**, so it strengthens the case rather than
  settling it. (b) **Prong two is not vacuous.** ADR-017 is the one this
  leans on hardest and it HOLDS — the app still writes nothing into
  `docs/`; it only reads a tree it was already collecting. ADR-012 holds
  and was checked rather than assumed: `PickOutcome::Genesis` **already
  carried `project_dir`** before this task, and the snapshot is the same
  type the `docs-changed` channel has carried since T-003, so **no new
  path or content class crosses IPC** and the entry commands are still
  zero-argument. ADR-010 holds and is now more VISIBLE — a `docs/`
  replaced by a symlink or a regular file still reads as "gone", and the
  new rule means it now says so. ADR-018 does not exist; the register
  ends at ADR-017. ADR-011 holds — the changed set restricted to
  `method/`, `app/src-tauri/capabilities/` and every
  `Cargo.toml`/`Cargo.lock`/`package.json`/`package-lock.json`/
  `tsconfig*.json`/`vite.config.ts`/`vitest.config.ts`/
  `tauri.conf.json`/`.nputerignore` returns **0 files**. ADR-014/015
  hold (the regen rule fired, proved deterministic across two runs and
  current by the indexer's own plain self-check). ADR-002 holds. ADR-003
  holds (no model call anywhere). ADR-016 holds (the done card carries
  its two-mark set). **ADR-009's trigger is present and met**: the pane
  renders file paths and content from a folder the user chose, through
  the same collector and containment rules as before. (c) Prong three:
  the durable calls live in the card's criteria→evidence map, its eight
  proof obligations, the two mutation directions, the ten transition
  attacks and the verifier's four corrections.

**No model call was made anywhere in this merge.** The env-gated
`#[ignore]` smoke was NOT run (one of the 3 ignored). No screen control,
no screenshots, no OS input injection, nothing read off the screen. **No
GitHub API call, no remote creation — the workflow stays dormant** and
`git remote -v` is still empty.

**THE SHARED-INDEX HAZARD, and it did not recur.** `git diff --cached
--stat` was checked before **both** commits and the staged set was
exactly this session's each time. The house shape here is clean:
**merge → checkpoint**, two commits.

The t042 worktree is removed and its branch KEPT — **35 task branches
merged now**, `t001-app-shell` through `t050-recover`. Main tree clean;
all four suites green; the token lint green over 99 files at zero
allowlist; the committed graph current and proved so by the plain
self-check rather than by assumption. The parser re-parses the whole
live tree at **0 issues**: **104 tasks**, tally **36 done / 14 planned /
9 parked / 44 suggested / 1 building**, 6 features, 11 components.
(Tasks rise by three since T-034's checkpoint — T-042's three suggestion
files; its card already existed on main as `building`.)

**NO STANDING SECURITY GATE.** T-025-s6 closed at T-039 and nothing
replaced it. T-042 adds no security surface: zero added or removed
`#[tauri::command]`, `invoke_handler`, `invoke(`, `listen(` or `emit(`
call sites across the whole diff, no new dependency, no lockfile line,
and the 92-grant `core:default` set byte-unmoved with `acl_pin.rs` a
0-byte diff. What it moves on the **searchability** pile is one live
instance REMOVED — the tree now has no source file `file(1)` calls
`data` — while the GATE that would keep it that way is still only a
suggestion (T-034-s5). The sharpest open set is otherwise unchanged and
still app-agent's: **T-047-s5** (two doors, one standard, only one
guarded — ~5 lines), **T-047-s6** (nothing structurally stops a test
resolving the real CLI), **T-047-s4** (`$SHELL` picks the program), and
**T-047-s1** (the cache that saves zero spawns). Beside them the
process-hygiene pair stands: **T-046-s1** and **T-041-s4**.

LAUNCH ITEM, carried forward — **watch the first CI run** (T-020),
unchanged in shape by T-042 and with **no new platform-sensitive
group**: T-042 adds zero lane specs and zero CSS, and its three new
cargo tests drive the same `handle_fs_batch` seam T-018's do. At the
repo's first push (`git remote -v` is still empty), confirm in order:
the ubuntu apt/webkit2gtk set installs; the three `uses:` SHA pins
resolve; the `e2e types` step runs (still **never executed on any
runner**); then playwright-on-Linux runs the lane — **still 54 tests**.
The platform-sensitive list is unchanged: T-034's
`map-tasks-lens-dom.test.tsx` reads the BUILT stylesheet out of
`app/dist/assets/` with a staleness guard that has now fired three
times, so **build-then-test ORDER is load-bearing on a fresh runner**;
T-048's three-viewport pixel sweep and the CSS-reading specs
(`front-door`, `genesis-screen`, `startup-recovery`); T-049's
`accelerators.spec.ts` pressing `Meta+o`/`Meta+n`; T-045's twenty parse
files are the LEAST platform-sensitive. **One T-042-specific watch
item**: its transition tests create, delete and REPLACE `docs/` with
symlinks and regular files and count emits exactly — notify's inotify
backend on Linux is not the FSEvents backend these were measured on, so
if anything in `docs_watch` reds on Linux, read the emit COUNTS before
assuming a logic bug. Then: `cargo audit`; the xvfb `tauri dev` boot
printing both `[nputer]` lines (the FIRST exercise of the boot check on
Linux); and the THREE T-018 SENTINEL live tests inside the ubuntu
`cargo test` step, whose green CLOSES the macOS-only replace-regression
gap. That run also closes T-001/T-003's Linux halves and carries
T-026-s1 and T-021-s1.

## Next up (1–4)
1. **DISPATCH T-027 FROM THIS CHECKPOINT.** Its last blocker is cleared
   by this merge. Before dispatching, the standing conditions from
   T-034's checkpoint still apply and are NOT self-answerable:
   - **T-027's planning pass waits on the human's split-view verdict**
     (item 2 below). `blocked_by` [T-024 ✓, T-025 ✓, T-026 ✓] has been
     satisfied since T-025 merged.
   - T-027 inherits **T-047-s3**, **T-048-s1**, **T-049-s2** — its
     accelerator criterion names a test T-049 retired, so it needs a
     one-line rewording before it dispatches — plus **T-049-s3**.
   - **What T-042 changes for T-027, stated plainly so its planner does
     not re-derive it**: the turn-1 baseline case is fixed BY
     CONSTRUCTION, so **the tripwire T-027's plan costed can be
     DELETED rather than written**. The one residual, **T-042-s3**,
     needs a `docs-changed` emit to overtake the switch, which cannot
     happen at the moment T-027 takes its turn-1 baseline. And
     criterion 4's ruling means **the docs change log stays in
     `GenesisPane.tsx` as a render-phase ref stamp** — T-027 does not
     inherit a relocated log, and if T-027 turns out to want one, that
     is a change of SOURCE, not of mechanism (CONVENTIONS records the
     three conditions).
   **Then T-014 merges** (APPROVED, awaiting merge, worktree
   `../nputer-t014`) — after T-027 is dispatched, so T-027's lane is cut
   from a checkpoint carrying a current graph.
2. **@human — THE VISUAL SESSION IS OPEN, and this merge changed the JS
   but NOT the CSS.** The app is RUNNING on 1420 — **vite pid 64249, the
   same pid five checkpoints have recorded, so you have not restarted
   it**. Unlike T-034's merge, **nothing you are currently looking at
   changes appearance**: the CSS asset is byte-identical and the JS grew
   by ~0.14 kB. T-042's change is reachable only by starting an
   interview on a folder that ALREADY has a `docs/` — which is now worth
   trying, because it used to lie.
   - **T-042 RETIRES one item from this list rather than adding to it.**
     T-026-s4 asked "does `nothing written yet` read right over a
     non-empty docs/?" **After this merge the screen never makes that
     claim**, so the question retires instead of being judged.
   - **THE SIX T-034 JUDGMENTS, all yours, none self-answerable, all
     unchanged**: (1) the terracotta in both schemes beside a `rejected`
     card — the margin over `--destructive` is **1.42 units**, a tie
     decided by the SEMANTIC argument, not the arithmetic; (2) the
     blocked ghost against the ready grey; (3) **WAVE 0 IS A WALL —
     T-034-s1, the big one**: 32 of 50 cards in one wave, a 1440×3818
     canvas in a ~600px pane; the question is whether the lens is USEFUL
     here, not whether it is correct, and correct it demonstrably is;
     (4) where the lens control belongs (T-034-s4); (5) two segmented
     controls in one header three feet apart; (6) the tasks-lens
     header's empty right side.
   - **STILL OPEN FROM T-030: the model badges on your board should be
     SHORT.** T-020's and T-024's cards should read `opus`; T-001's
     verified-by badge should read `+`. **The judgment that is yours:
     `+` is honest but ugly** — filed as **T-030-s1** with four fixes
     costed.
   - **THE HEADER'S DENSITY, T-049's item, still open** — three equal
     outline buttons, so "Start an interview" looks exactly like "Toggle
     theme"; no `⌘O · ⌘N` hint on the header pair; neither group wraps
     or truncates; and the header says `Open folder…` where the other
     two say `Open a folder…`.
   - **T-050's TWO OPEN JUDGMENTS, unchanged**, and **T-050-s2 still
     matters more**: escaping the failure screen with "Open a folder…"
     rather than "Try again" reaches a board with real content that is
     **silently dead**. **Use "Try again".**
   - **The frame at 800x600, T-048's item, still open.**
   - **THE COMPOSITION QUESTION, still T-027's** — T-024 drew the pane
     as the RIGHT HALF of a split view; until T-027 it sits full-width
     inside T-026's card frame. **This is the question T-027's planning
     pass waits on, and it is now the ONLY thing between T-027 and
     dispatch.**
   - **T-024's pane, light AND dark**; **T-026's front door, light AND
     dark** (read **T-048-s4 BEFORE T-048-s3** — s3's conclusion is
     wrong); **the at-a-glance amber judgment**; **the launch-shot
     re-judgment**; **the T-023 dry-run conversational quality**;
     **T-026-s4's docs-but-no-plan folder** (now worth a fresh look —
     T-042 is exactly this case); **the real picker flows**; **the
     `tauri dev` quit-the-app orphan check** (watch for T-025-s7's ~5 s
     hang, expected and harmless).
   - **The T-047-s6 stray, a decision not a look.**
     `~/.claude/projects/-private-var-folders-…-t047va-count-97806-…/`
     — outside the repo, deliberately not deleted. **Delete or keep.**
   - **ONE REAL OBSERVED PLANNER TURN, on an authenticated machine** —
     still the biggest unobserved thing in the project. This machine's
     `claude` OAuth token is revoked, so no model call has ever gone
     through the runner. **T-025-s2 carries the exact command.**
   - **A Linux run** — the "watch the first CI run" item above.
3. MILESTONE 3 (T-023…T-029 + T-039 + T-041 + T-047 + T-048 + T-049 +
   T-050 + T-042, ADR-017). **What holds it is now ONLY the human**:
   (a) T-042 has merged, so **T-027 dispatches** — see item 1; the merge
   half of the gate is DONE. (b) **T-027's planning pass still waits on
   the split-view verdict.** (c) **T-029 is UNGATED but not unblocked** —
   its `blocked_by` is still `[T-027]`, and T-028's is too.
   The milestone is NOT claimed: the first slice delivers hand-driven
   genesis, the runner exists and is hardened at four boundaries, the
   genesis switch now tells the truth about a folder that already has
   docs — but **no agent loop has ever run against a real model**.
4. OVERNIGHT DISPATCH GRANTS (human, 2026-08-16/17 nights) and the
   BACKLOG. Grant 1 (**milestone 3 to completion**) is what item 1
   executes; grant 2 (three milestone-4 lanes) **closed entirely at
   T-034**; grant 3 (third triage applied) stands, and **tasks NEWLY
   created by triage still do NOT dispatch without the human**.
   Unchanged method rules: a second REJECTED on any task parks that lane
   for the human; @human judgments are never self-answered; no screen
   control beyond the ruled boot check; port 1420 is the human's.
   Lane availability: **app-shell and app-interview are FREE as of this
   merge** (which is what lets T-027 take them); **app-agent** is free
   (T-047) which unblocks **T-043**; **lib-parser** is free (T-030),
   which matters because **T-031 and T-032** sit there — and **T-032
   carries T-034-s7**, a criterion that reads as an instruction to type
   a control byte and **should be amended BEFORE it is built**;
   **tools/e2e** is free (T-045), which matters for **T-044** and for
   any promoted T-045 / T-034-s5 suggestion; **app-map** is free
   (T-034), which matters for T-013, T-015 and T-032's map-badge half.
   The standing app-shell queue's next named item is **T-022** (M,
   milestone 4, `blocked_by: []`), which T-034-s3 made bigger: `lens` is
   the fourth member of the view-state seam alongside `overlay` and the
   two viewports.
   **SUGGESTION BACKLOG — 53 open files: 9 parked + 44 suggested.**
   **T-042 contributes THREE** — **s3** (VERIFIER-FILED: the carried
   tree is dropped by its own watermark when an emit overtakes the
   switch, measured `switch@7` → 2 files then `emit@8` → 0; not a
   regression, impossible at T-027's turn-1 baseline), **s1** (the
   real-input lane never sees the carried tree, and the mirror problem
   is now asymmetric), **s2** (the probe and the snapshot describe
   different moments; wants a ruling, not a patch).
   **THE ITEM THAT WAS NOT A CARD IS NOW CLOSED**: the live control-byte
   instance in `app/test/startup-screen.test.tsx` was **FIXED at this
   merge** on the architect's instruction. **T-034-s5 keeps its rank and
   gains urgency rather than losing it** — the instance is gone but the
   GATE is not built, and this merge produced two fresh reproductions of
   the mechanism (both by the integrator, one landing raw bytes into the
   dogfood fixture itself). Ranks with **T-034-s6**.
   **Untriaged (44)**: the three T-042 cards above — plus the seven
   T-034 cards (**s1** @human wave-0 wall, **s5** lift the C0 gate into
   `lint:tokens`, **s6** the hazard is binary-skipping SEARCHERS, **s7**
   amend T-032 before it is built, **s4** @human lens-control home,
   **s3** T-022 absorbs `lens`, **s2** a blocked card can point at
   nothing on screen) — plus the four T-045 cards (**s4**, **s2**,
   **s3**, **s1**) — plus the five T-030 cards (**s3 PROMOTE FIRST and
   the deadline has PASSED**, **s2**, **s4**, **s5**, **s1**) — plus the
   three T-050 cards (**s2 FIX FIRST**, **s3**, **s1**) — plus the four
   T-049 cards (**s4**, **s3**, **s2**, **s1**) — plus the five T-048
   cards (**s2** the map canvas clips instead of scrolling, **s4** read
   BEFORE s3, **s1**, **s3**, **s5**) — plus the six T-047 cards
   (**s5**, **s6**, **s4**, **s1**, **s2**, **s3** — home T-027) — plus
   **T-041-s2** (the payload mirror, which T-042-s1 just widened),
   **T-041-s4**, **T-046-s1**, **T-046-s4**, **T-046-s2**, **T-046-s3**,
   and **T-039-s3** (home T-029).
   **The nine parked, unchanged**: T-003-s2, T-008-s1, T-018-s1,
   T-021-s1, T-026-s1, T-025-s2 (@human, one command on an
   authenticated machine), T-025-s4 (gated by s2), T-025-s3, T-038-s1.
   Triage-born tasks standing ready and un-dispatched: **T-043**,
   **T-044**, **T-051**.
   Milestone-4 queue after F-03: T-010, T-013, T-015, T-022, T-031…
   T-033, T-035, T-044. (**T-014 is in flight and APPROVED**; T-030,
   T-045, T-034 and T-042 are done.)

## Open questions
- **Does the BOOT GATE rule retire, and when?** Carried forward.
  T-009-s1's sibling rule names its retirement (T-014's `nputer index
  --check`, **APPROVED and merging after T-027 dispatches**); BOOT GATE
  names none in CONVENTIONS, and ci.yml already invokes the boot check
  on ubuntu while dormant. **EIGHT exercises in, and T-042 is the
  second consecutive merge where the gate FIRED and RAN** — and the
  first where **the merge genuinely OWED it**, because neither builder
  nor verifier could run it (both headless, both fenced off 1420) and
  both said so loudly rather than silently skipping. That is the
  CONVENTIONS clause "a skipped gate is news, never silence" working
  exactly as written, three roles deep. **The `<main-before>..HEAD`
  wrinkle is now measured at two consecutive merges**: here the naive
  merge-base derivation returns 8 files against the correct 3, and the
  five extras are another task's, already boot-gated. **Four
  integrators have hit it.** The fix is one clause in both CONVENTIONS
  bullets naming which diff. Left for a triage.
- **Should `method/` name the class of CONVENTIONS-level pipeline
  gates?** **Still LIVE, and T-042 exercised two of the three in one
  merge** (the regen rule and BOOT GATE, the latter for real and for
  the second merge running). Three rules now share the shape trigger →
  command → record, and `method/roles/executor.md` still says only "run
  the test commands from CONVENTIONS.md until green" — even though
  **T-046 criterion 6 explicitly makes the EXECUTOR run the boot check
  too**, which this task's builder honoured by declining loudly. A
  method version bump, not an ADR.
- **When does the C0/searchability rule become a gate — and whose
  question is it?** **SHARPENED, and it is the question this merge did
  the most work on.** The live instance is now FIXED, so the question is
  no longer "is this real" but "what stops the next one". Measured
  here first-hand: **`/usr/bin/grep` degrades gracefully** (`Binary file
  … matches`), **the `grep` on this machine's PATH — ugrep 7.5.0 —
  returns NO OUTPUT AND EXIT 1 for every pattern in such a file**, and
  **`rg` used recursively prints nothing at all and exits 0** — while
  **`git grep` is not blinded at all** and returns the same matches
  against the raw-byte blob as against the fixed one. So a grep-shaped
  gate's survival is a property of the DEVELOPER'S PATH, which is not
  something any gate can assert about itself — and the cheapest
  mitigation available today is not a gate but a HABIT the method could
  name: audit with `git grep`, which reads the object store. Two candidate
  shapes, unchanged: a `lint:tokens` walk-policy check (cheap, would
  have caught this instance, stays a repo gate — this is T-034-s5), or
  a CONVENTIONS-level rule that source files SHALL be text and the
  ESCAPE is always written (which would also fix T-034-s7's wording
  class at the source). **New evidence for the second shape, and it is
  strong**: the mechanism fired THREE more times at this merge, every
  one of them on the integrator — once into the dogfood fixture that
  documents the fix, and once into `docs/STATE.md` itself. **Eleven
  reproductions across four sessions, and not one of them was caught by
  a gate.** The practical rule that catches it is not a gate at all —
  sweep your own output with `file(1)` before committing, now
  five-for-five — and the practical rule that PREVENTS it is that
  **escape text cannot be typed through the editing tools; it has to be
  written by a script that constructs the bytes**. A CONVENTIONS rule
  would at least make both rules writable in one place. The architect's
  call (ADR-004).
- **Does the shared main working tree need a rule?** Carried forward
  with an **EIGHTH face, and it is the mirror image of T-034's**. T-034
  changed the bundle so the human's pane gained a control while they
  were not looking; **T-042 changed the JS and left the CSS
  byte-identical**, so their window's behaviour moved while its
  appearance did not. Both are the same hazard from opposite sides:
  **the reviewed artifact is not pinned to the review.** Method/process,
  so the architect's (ADR-004).
- **When does spawn hygiene become an ADR?** Unchanged from T-047's
  ruling: the moment to write it is when T-047-s5 lands.
- **Does a verifier's remedy belong in an acceptance criterion?**
  Carried forward, and **T-042 is the SEVENTH data point with a shape
  none of the previous six had: a criterion that recorded an ARCHITECT'S
  RULING before dispatch** (criterion 4 — "ratify rather than relocate",
  with the rationale in the criterion itself). It worked cleanly: the
  builder implemented a ruling instead of choosing, the diff for that
  criterion is a comment plus a CONVENTIONS gotcha, and
  `genesis-derive.ts` is a 0-byte diff. **That is a third distinct shape
  alongside "prescribe a remedy" and "name a property", and it is the
  one to reach for when the question is a fork the architect has already
  settled.** The candidate rules are unchanged and all cheap; the
  architect's call (ADR-004).
- **When a task retires a test, who owns the property it was reaching
  for?** Carried forward from T-045, unchanged.
- **What does the pipeline owe a task whose builder vanishes
  mid-flight?** Carried forward from T-050, unanswered.
- **Should a card's own numbers be treated as a claim to verify rather
  than a brief to implement?** **T-042 is the FOURTH instance in four
  merges, and it is the one that should settle it, because the error
  ESCAPED ITS TASK.** T-030's card asserted "a FIFTY-character badge"
  (59); T-045's asserted "the TWO documented divergences" (four);
  T-034's asserted an eight-assertion graph delta (twelve). **T-042's
  notes carried `EXPECTED_GRANTS` at "7728 bytes, 129 grant lines" — a
  figure inherited from T-026's report and restated across MULTIPLE
  TASKS without anyone re-measuring it. The truth is 92 grants and
  ~6135 bytes, and this merge re-measured it a third time to confirm.**
  In every case the error was invisible to a green suite; in every case
  the correction came from deriving the number from the source of truth
  instead of transcribing it. The candidate rule should now probably be
  written, with T-042's extension: a numeric claim in a card body is
  EVIDENCE TO REPRODUCE, a task that reproduces it differently SHALL
  record the corrected number — **and a number COPIED FROM ANOTHER
  TASK'S REPORT is the highest-risk kind, because nobody owns it.**
  Method version bump, the architect's call (ADR-004).
