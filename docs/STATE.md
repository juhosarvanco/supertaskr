# State

Updated: 2026-08-26 by the T-133 integrator.

**READ THIS FIRST IF YOU ARE PICKING THE PROJECT UP: NOTHING IS BROKEN,
AND ONE COMMAND ON MAIN EXITS 1 ON PURPOSE.** This merge is **494 / 973 /
268 / 194 green**. `cargo run -p nputer-index -- arch cycles --root ../..`
is **exit 1** on main and that is the DESIGNED state — the one declared
cycle `C-08 -> C-09 -> C-08` survives because removing it needs paths
T-127's fence could not reach, and the removal is routed with its
measurement (`T-127-s1`). **The ENFORCING copy is `cargo test`, which is
green.** Read T-127's account in that card before you read the gate's
output as breakage.

**WHAT THIS MERGE LANDS IS A COMMAND THAT MAKES THE DERIVED ANSWER
CHEAPER THAN THE REMEMBERED ONE. THAT SENTENCE IS ITS WHOLE HONEST CLAIM
AND THE NEXT SECTION IS WHAT IT IS NOT.** `node
tools/e2e/scripts/brief.mjs` emits the dispatch-brief contract's rows and
the derivable sections of this file. **Read the next section before you
trust an output, and before you tell anyone else to.**

Four other things will meet you before any real defect does: **the app
suite cannot BUILD on a merged main until you rebuild `lib/parser`**,
**`npm run typecheck` from `app/` DOES NOT EXIST**, **four known
intermittents, one of them at ~1 in 3**, and **the checkout's test runner
and the checkout's EDITOR are shared surfaces**. **Derive the lane list
before you cut anything — and now there is one command that does it.**

**WHAT IS NEWLY FREE**: **`tools/e2e`**, released by this merge, which
unblocks `T-108-s2` and `T-130-s2`. **HELD: `crate-index` and
`method/tasks/TASK-FORMAT.md` by `T-135`, and nothing else.**

## WHAT THE COMMAND IS, AND — THE PART THAT MATTERS — WHAT ITS OUTPUT IS NOT

**IT IS A DERIVATION, NOT A VALIDATOR, AND THE DIFFERENCE IS THE WHOLE
POINT.** Two arms, one module:

    node tools/e2e/scripts/brief.mjs --task T-NNN     # the brief contract's rows
    node tools/e2e/scripts/brief.mjs --state          # this file's derivable sections
    node tools/e2e/scripts/brief.mjs --task T-NNN --state --full

Exit **0** assembled and nothing owed · **1** assembled and FOUND
something · **2** called wrong · **3** could not run — the house contract.
It writes nothing; it is a read, and a dispatcher with no lane can run it
from this checkout.

**WHAT MAKES IT DIFFERENT FROM A SECOND COPY OF THE CONTRACT.** It
**PARSES `method/roles/executor.md`'s normative table rather than
transcribing it**, and binds a deriver to each row's own **bold LABEL** —
so an inserted row renumbers without moving an answer, and a RENAMED row
is reported by name rather than answered from the wrong source. Every row
prints its own `Assembled from` cell beside the answer. **Provenance is
structural rather than conventional**: a value with no provenance THROWS
at render, a note may not contain a digit, a TREE fact carries a ref and a
LIVE fact carries a timestamp and a host and never a commit.

**IT DOES NOT VALIDATE A BRIEF AND IT CANNOT CATCH A WRONG NOUN.** The
verifier established this rather than conceding it: **the command would
not have caught the architect's own error that partly motivated it** — the
assertion that a lane *"notes"* something the lane records nowhere —
**because no contract row carries narrative.** A brief's prose is exactly
where the night's worst error lived, and the prose is the part this tool
does not touch. **A tool oversold is worse than one undersold.** Say
"makes the derived answer cheaper than the remembered one" and stop there.

**AND THE SECOND LIMIT, MEASURED AT THIS CHECKPOINT RATHER THAN
INHERITED: IT GUARANTEES A ROW'S SOURCE, NEVER THE ROW'S TRUTH.** Run
`--task` at this merge and ROW 6 prints, wearing a correct
`<- @ 2a0652aff5b8 ; docs/CONVENTIONS.md lane bullet, fresh-worktree
sub-bullet` stamp, the sentence *"`npm test` from app/ on an unbuilt
worktree fails 12 of 840 across five files"*. **The stamp is honest and
the figure is stale** — the app suite is **973** bodies at this commit, and
the same file's poison-drill bullet says **six** files where that one says
five. The provenance answers *where did this text come from*, which is the
question the briefs were getting wrong; it does not answer *is this text
true*, and **nothing in the output distinguishes a fresh derivation of a
correct source from a fresh derivation of a stale one.** A dispatcher who
pastes ROW 6 hands an executor a stale denominator wearing this merge's
own commit hash. **That is not a defect in the tool** — the tool reports
its source faithfully — **it is the boundary of what "derived" buys**, and
it is worth more written down than the tool's headline is.

**KNOWN AND DELIBERATE WIDTH, both named in the module header rather than
left to be found**: row 9 enumerates CONVENTIONS' standing disciplines by
**TYPOGRAPHY**, because that file has no marker for one (`T-133-s4`
proposes the marker); row 8 reports a bullet that names a gate while
declaring no merge-diff trigger rather than dropping it. And **a role
whose file carries no four-column table THROWS at exit 3** — `--role
verifier` does not print empty rows, it fails hard. The card's own notes
guessed that mechanism wrong and left the wrong sentence standing above
the correction, which is the right thing to have done.

## THE CONVENTIONS FIGURE, AND THE NEAR MISS THAT ALMOST REFUTED A CORRECT BRIEF

**RECORDED BECAUSE THE MISTAKE WAS MINE AND IT IS THIS CARD'S OWN
SUBJECT.** My brief said CONVENTIONS' unbuilt-app figure of *"14 failures
across six files is exactly right"* while its denominator is stale. I
grepped for it, found **`docs/CONVENTIONS.md:856` — "12 of 840 across five
files"** — and drafted a correction saying the brief had invented a figure
the file does not carry. **The file carries both.** `:1328`, four hundred
and seventy lines away, in the POISON DRILL bullet: *"14 failures across 6
files on an unbuilt drill, 924/924 after `npm run build`"*. **A grep that
stops at its first hit refutes a true claim as confidently as it confirms
one**, and the check that caught me was reading the verifier's own
paragraph, which had measured it.

**WHAT IS ACTUALLY TRUE AT THIS MERGE, derived here:**

- **The 14-across-six figure is right.** The verifier reproduced it at
  `508bd2c` — 14 failed of 973 across 6 files, every message naming the
  absent build — and I did not reproduce it, because I built first.
- **BOTH denominators are stale**: `:856` says **840**, `:1328` says
  **924**, and the suite is **973**. The brief attributed `:856`'s 840 to
  `:1328`'s figure, merging two bullets into one.
- **CONVENTIONS ALREADY NAMES ITS OWN CONTRADICTION**, which no brief
  said: `:1327` reads *"SIX files since T-013 … where the LANE PROTOCOL
  bullet below still says five."* It is a DISCLOSED disagreement, not a
  latent one, and that changes who has to find it.

**DISPOSITION: FILED, NOT REPAIRED, AND THE PARENT TEST ANSWERS IT
CLEANLY.** `git diff 70b1d4058ee1..2a0652aff5b8 -- docs/CONVENTIONS.md` is
**EMPTY** — this merge does not touch that file, both figures were exactly
as false one commit ago, so ruling thirteen's one-command test returns
FILE. The seat is `T-092`/`T-093` (see Next up item 2); **filing a card is
a triage's call and not an integrator's** (T-083), so this is recorded
rather than filed, on the same precedent the last two checkpoints set.
**This checkpoint creates no tracked file at all.**

## ARM TWO'S COMMAND IS HERE; ARM TWO'S EDIT TO THIS FILE IS NOT, AND THAT IS DELIBERATE

`--state` answers **the lane list, the fence ledger, the board census and
the slug map**. It **cannot** answer the narrative, the traps, the named
intermittents, the rulings, the owed @human looks or the suite/range
ledger — and it says so in its own output, printing this file's headings
beside its answers so a reader can see what is NOT above them.

**THE EDIT THAT DROPS THE SECTIONS `--state` REPLACES WAS ROUTED, NOT
TAKEN.** `T-133-s2` carries it with the measurement attached; `docs/STATE.md`
was outside `touches: [tools/e2e]` and it is outside this merge's fence
too, so **this checkpoint did not perform it.** This file is written as a
snapshot in the same shape as its predecessors. A future hand may take
`T-133-s2` and drop four sections; **it must keep the rest**, and the card
says which and why.

## `T-133-s5` HAS A SHARPER THRESHOLD THAN THE CARD WAS FILED WITH — CUT YOUR SCRATCH SHORT

A UI spec (`shell-frame.spec.ts:263`) reds in a drill worktree cut at a
**128-character** root and is green in a lane at 33, because the shell
renders the project path and the chrome wraps. **The verifier sharpened
it: at a 116-character root it measures 252 px against a 250 px floor at
800×600 — TWO PIXELS of margin — while the two wider viewports match the
128-character drill exactly.** So **the floor is crossed somewhere between
116 and 128 characters**, and *"deep paths red"* is too coarse to act on.
Content was identical (`board.scrollHeight` 14948 both), dependency trees
byte-identical, parser dist byte-identical: **the path is the only
variable.** The spec is right; the fix is in `app/src`, outside the lane
that found it. **Cut drill and scratch worktrees at SHORT roots.** This
integrator cut none.

## THE zsh HAZARD IS THE THIRD INSTANCE OF A KNOWN RULE, NOT A NEW CLASS

**Stated here so no future checkpoint records it as a new mechanism.**
`local h s status` in zsh does **not** fail silently at exit 0. Measured
by the verifier and re-measured by my own brief: **the declaration returns
0 and survives**; it is the **ASSIGNMENT** that dies, at **rc=1 with a
visible `read-only variable: status`**. Piped, the rc becomes the pipe's 0
and the message is what you lose. **So the silence was the PIPE, and this
is the third instance of "read the exit UNPIPED"** — the standing remedy
already covers it, and no new rule is owed. The drill that hit it had two
arms never run while the top level reported exit 0; the **log** caught it,
not the exit code.

## THE MTIME INTERMITTENT IS NEAR ONE IN THREE, AND A GREEN WAS NEVER EVIDENCE OF THE FIX

**THE FOURTH INTERMITTENT, AND THE ONLY ONE IN `tools/e2e`.**
`T-120-s3`'s fractional-millisecond mtime signature
(`token-scan.spec.ts`, `Expected …492.7957` against `Received …493`) was
fixed on main at **`cea839e`** (T-130). The nine-run tally on code that
**cannot** carry that fix was **3 red in 9 — near one in three**. **A red
before `cea839e` is not news; a red at or after it is.** T-133's own lane
ran e2e **three** times on the fix and it fired in none; **this merge ran
it twice more on main, 194/194 both, and it fired in neither** — five
consecutive clean runs on fixed code. That is evidence about `cea839e`
accumulating, and it is still not proof: the whole point of this section
is that a green was never evidence, in either direction.

## `T-088-s4` — THE CACHE CLIFF IS REAL, IT IS SETTLED, AND MAIN IS STILL OUT OF IT

**PRESERVED ACROSS SEVENTEEN CHECKPOINTS BECAUSE IT IS THE MOST USEFUL
THING IN THIS FILE FOR A SESSION THAT RUNS `cargo test` IN MAIN.**

`docs_watch::tests::startup_arm_watches_the_initial_root` was carried as a
flake for weeks. It is not one. **It reds when the cargo target directory
is large and ~never when it is small, and the single variable is the size
of that directory** — isolated 1.5 GB: 0/5 red at 3.82–3.93s; main's own
8.7 GB: 4/5 red at 8.85–14.70s, on a **byte-identical** test binary. **A
tally that mixes checkouts is not a flake rate.**

**THE CLOCK TEST STILL SEPARATES GREEN FROM RED.** Every green under 9.5s,
every red over 14.6s, **a gap of more than five seconds with nothing in
it**. `du -sh app/src-tauri/target` reads **3.7 GB** here, unchanged from
T-132's checkpoint — **this merge recompiles nothing, because its only
non-docs paths are under `tools/`, which no cargo target reads** — and the
lib suite is **5.05s** against T-132's 5.10s. **TWENTY-FIVE runs across
sixteen integrations and not one lands between 9.5s and 14.6s.** Read the
lib suite's own time first; it tells you which regime you are in before
any assertion does.

**DO NOT `cargo clean` REFLEXIVELY.** The 8.7 GB reclaim was a MEASURED
experiment, not a habit. Lanes may be building against this repository:
`lsof` first.

## THE INTERMITTENT THAT WAS SETTLED AND IS NOT — `a_hostile_session_id…`

`a_hostile_session_id_in_the_init_line_fails_the_turn_and_is_never_recorded`
(`app/src-tauri/tests/agent_runner.rs`, T-039's, last touched by T-102)
was declared settled at better than 400-to-1 on 15 clean-cache runs.
**T-086's lane refuted that within the hour**: 1 red in 4 full `cargo
test` runs in a FRESH lane worktree, with `docs_watch` GREEN and the lib
suite inside the healthy band — so the cache cliff cannot be what crossed
its deadline. Run alone: **5 green in 5**. **THE SETTLEMENT WAS RETRACTED
IN PLACE at `086bf1c`** with the rule it produced: *a re-measurement can
only settle a finding whose MECHANISM the intervention addresses.* Pooled
clean-cache evidence is **1 red in 20**. It did NOT fire at this merge —
read by NAME, `ok` — which is one more data point and not a reprieve.
`T-086-s1` and `T-102-s3`; fence `[app-agent]`, **FREE**.

## THE ONE THAT COSTS A WRONG DIAGNOSIS — A MERGED MAIN CAN FAIL `npm run build`

**CARRIED FORWARD BECAUSE ITS TRIGGER IS A PROPERTY OF A DIFF, NOT OF A
DATE.** `lib/parser/dist` IS A BUILD ARTIFACT AND NO MERGE UPDATES IT. The
app resolves `@nputer/parser` through a symlink, so it compiles against
PRE-merge types and fails with e.g. `TS2339` while `vitest` transpiles
without typechecking and the dogfood fixtures red in a way that looks
exactly like an un-reconciled fixture. **One command clears it**: `npm run
build` from `lib/parser/`. **THE TRIGGER IS NOT A FRESH TREE, IT IS A
MERGE THAT CHANGES THE PARSER'S TYPES** — CONVENTIONS files the
parser-before-app ORDER under *fresh clone*, so a fully-installed main
checkout reads as exempt and is not. **This merge's parser diff is EMPTY**
— its nine paths are six markdown cards and three `tools/e2e` files — so
the trap did not fire; the build was run first anyway, in that order, and
every exit was 0. **Do not read a green build as evidence the trap is
gone.**

**AND THE SEPARATE UNBUILT-APP CLASS IS THE ONE THAT ARRIVES LOOKING LIKE
A DEFECT**: on an unbuilt tree `npm test` from `app/` returns **14 failed
of 973 across six files**, every message about an absent
`app/dist/assets` rather than about the tree. Both CONVENTIONS bullets
that state it carry a stale denominator; see the CONVENTIONS section
above before you quote either.

### **`npm run typecheck` FROM `app/` DOES NOT EXIST, AND ITS ABSENCE READS EXACTLY LIKE A TYPE ERROR**

**Re-derived at this checkpoint rather than trusted**, straight out of
`app/package.json`: the scripts are exactly `dev`, `build`, `preview`,
`test`, `tauri`. `npm run typecheck` from `app/` exits **1** with `Missing
script`, which a hurried reader takes for a compile failure. **The app's
typecheck is the TWO `tsc` calls inside `npm run build`** — `tsc && tsc -p
tsconfig.test.json && vite build` — and the second is load-bearing:
without it nothing in the repository typechecks the app's test files
(T-073). `lib/parser` and `tools/e2e` DO have a `typecheck` script; `app/`
is the exception, and that asymmetry is the whole trap.

## THE LANE PORT IS MACHINE-WIDE AND RULE 4 PARTITIONS BY CHECKOUT — TWO COMPLIANT LANES STILL COLLIDE

**OBSERVED LIVE AT THIS CHECKPOINT, AND THE GUARD DID EXACTLY THE RIGHT
THING.** My third `npm test` from `tools/e2e/` exited **1 before
Playwright loaded**: *"lane port 14520 is not bindable on 127.0.0.1
(EADDRINUSE) — something else is listening. Set `NPUTER_E2E_PORT` to a
free port (never 1420)."* The holder, read with `lsof` and `ps` and
nothing else, at **02:08:23 EEST**: `node
/Users/ujju/Projects/nputer-T-135/app/node_modules/.bin/vite --port 14520
--host 127.0.0.1`, pid **14611**, cwd `/Users/ujju/Projects/nputer-T-135/
app`, started **02:07:56** — **twenty-seven seconds before my run tried to
bind.**

**NOBODY BROKE A RULE.** `lane-protocol.md` rule 4 forbids running a suite
in **the integration branch's CHECKOUT**; T-135 ran its suite in its own
worktree, which is precisely what the rule tells a lane to do.
**`resolveLanePort()`'s default 14520 is a CONSTANT shared by every
checkout on the machine**, so the two obedient seats contended anyway —
**rule 4 partitions by checkout and the port is not partitioned at all.**

**THE BACKSTOP IS THE GOOD OUTCOME AND IT IS WORTH NAMING AS ONE.**
`assertLanePreconditions` **detected and refused loudly** — it named the
port, named the remedy and **never took the port from the holder** — which
is `integrator.md` rule 1's shape applied to a resource that rule does not
mention. The run was re-done at **`NPUTER_E2E_PORT=15933`**, `lsof`-read
free at **02:08:54** and read back at **zero rows** at **02:11:01**:
194/194, exit 0. **No process was signalled and T-135's suite was left
alone.**

**WHAT THIS IS EVIDENCE FOR.** The collision is cheap here because it is
LOUD. It is worth writing down because the two failure modes on either
side of it are not: a guard that bound the port to test it would have
taken it for a microsecond from a live lane, and a guard that silently
drifted to another port would have let two suites certify against two
different servers with nothing in either log saying so. **A port default
is a shared surface exactly the way the test runner is**, and this file
has been calling the runner a shared surface for sixteen checkpoints
without noticing that its port is one too.

## THE LANE LIST, DERIVED AT THIS COMMIT — AND IT MOVED UNDER THIS INTEGRATOR

Read as **entries on a `task/T-NNN-*` branch** — a detached entry is not a
lane. **THERE IS NO TIP COLUMN AND THIS IS THE TWENTY-SECOND MEASUREMENT
SAYING SO.** Two commands answer it now, and the second is this merge's:

    git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'
    node tools/e2e/scripts/brief.mjs --state

| lane | fence (`touches:`, read off the card) | board says |
|---|---|---|
| **T-135** | `[crate-index, method/tasks/TASK-FORMAT.md]` | **building** |

**T-133's WORKTREE IS REMOVED BY THIS CHECKPOINT**, so **ONE** lane holds
a fence after it. **DERIVE THE MEMBERSHIP BY FILTERING ON THE BRANCH; DO
NOT QUOTE THIS TABLE** — and this integration is the first in the record
where quoting it would have been WRONG WITHIN TEN MINUTES.

**THE LANE LIST MOVED UNDER THIS INTEGRATION, AND THE NEW COMMAND IS WHAT
CAUGHT IT.** `git worktree list` at **01:47** reported five entries with
`T-135` at `5547f02`. `brief.mjs --state` at **01:56** reported **six**:
`T-135` had advanced to `7d386f0`, and a **sixth worktree
`/private/tmp/t135d`, detached**, had appeared — that lane's drill
checkout, correctly cut short and outside the repository. **Every previous
checkpoint recorded the lane membership as stable across its own
integration; this one cannot.** Disjointness was therefore recomputed at
the moved tip rather than assumed, and it holds — see Ranges. **This is
the concrete argument for the command that landed here: a hand-read lane
list has a shelf life measured in minutes, and nothing in the output of
`git worktree list` tells you when it was read.** The new command stamps
exactly that, because a worktree list is a LIVE fact and not a tree fact.

- **`/Users/ujju/Projects/nputer-app`, detached** — **@human's app
  checkout, and the one serving port 1420.** Permanent, by @human's ruling
  of 2026-08-25. It holds no fence, is named after no card, and must not
  be removed after a merge. **IT DID NOT MOVE UNDER THIS INTEGRATION**:
  `212543c` at the start and `212543c` at the end, so it is now **seven
  merges and seven checkpoints** behind main.
- **`/Users/ujju/Projects/arch-verify`, detached — NOT THIS INTEGRATOR'S.**
  It read **`209596b`** throughout. On no `task/` branch and named after no
  card, so **not a lane**; read with `git -C … rev-parse` and nothing else,
  and left alone.
- **`/private/tmp/t135d`, detached at `7d386f0`** — T-135's own scratch
  checkout, which appeared mid-integration. Not a lane, not this
  integrator's, not entered.

**NO LANE WORKTREE SITS AT A NON-STANDARD PATH.** Free: **all of
`method/` except `tasks/TASK-FORMAT.md`**, `tools/e2e`,
`docs/architecture/components/`, `docs/CONVENTIONS.md`, `app-agent`,
`app-map`, `app-board`, `app-shell`, `app-dispatch`, `app-interview`,
`lib-parser`, `.github/`, and every `docs/tasks/` card path. **HELD:
`crate-index` and `method/tasks/TASK-FORMAT.md` by `T-135`, and nothing
else.**

## Just completed

**T-133 — the brief contract and STATE's lane list become one derived
command.** F-02, milestone 4, **size M**, `touches: [tools/e2e]`.
Main-before **`70b1d40`**, lane tip **`d843508`** (derived with `git
rev-parse` — it is the RE-CHECK VERDICT commit and not the lane's last
work commit), merge **`2a0652a`**, this checkpoint its direct child.
`builder: claude-opus-5`, `verifier: claude-opus-5 @T-133-verify`,
`built_by: claude-opus-5 @T-133 — first build 9ddca48, fix 82e8ab4 by a
fresh executor; notes 64d1483, 06c208a, f508fc1, 508bd2c`, `verified_by:
claude-opus-5 @T-133-verify — REJECTED 1b626e2, re-check APPROVED
2026-08-26 — verdict commit d843508`, **`review: same-model`**.

### **WHAT SHIPPED, IN THREE FILES**

- **`tools/e2e/scripts/dispatch-brief.mjs`** — the derivation. Executes
  nothing on import, parses `executor.md`'s contract table, binds derivers
  to bold labels, and builds output as RECORDS so that a value without
  provenance throws at render.
- **`tools/e2e/scripts/brief.mjs`** — the runnable command, in the
  `token-scan.mjs` / `lint-tokens.mjs` shape and for that file's own
  stated reason.
- **`tools/e2e/tests/brief.spec.ts`** — the pins. The suite goes 171 → 194.

Everything else in the diff is this card's own ceremony: the card and five
routed suggestions.

### **THE REJECTION WAS ONE SEAM, AND THE FIX FOUND IT WAS BIGGER THAN THE VERDICT SAID**

`1b626e2` rejected the first landing because **`base commit` and
`integration tip right now` were reads of the mutable integration BRANCH
stamped `<- @ <lane HEAD>` as TREE facts** — re-derive them at that ref and
you get different commits, measured rather than argued: main moved four
times across this card. **A figure carrying a wrong ref is worse than a
bare figure, which is this card's own argument.** The verdict also caught,
in fence, that `stamp()` sent every kind that was not exactly `"tree"`
down the live branch, so a malformed provenance rendered `read undefined
on undefined` and slipped the provenance floor.

**THE FIX PASS IMPROVED ON THE VERDICT: IT WAS THREE LINES, NOT TWO.** The
`create:` line substitutes the same moving base into `git worktree add`
and was stamped with a DOCUMENT as its source — a document that cannot
produce a hash — **and it is the line a dispatcher PASTES.** Its stamp is
now DERIVED from whether a hash is in it (`carriesBase`), and the reverse
direction holds: with no task named the line keeps the document's `<base>`
placeholder and stays a TREE fact. **Stamping everything live would have
been the same defect facing the other way.** The verifier also confirmed
its own proposed remedy was insufficient — `{kind:"live"}` is a legal kind
with no fields and `default: throw` alone still rendered `read undefined
on undefined` — so the switch re-validates through the constructors.

**THE PARSER SURVIVED 27 MUTATIONS, TWICE, AND THE NEW PIN CANNOT PASS
VACUOUSLY.** The pin names no line; both of its routes converge on the
same three lines by measurement, and starved of a second checkpoint it
trips its own positive control and the derivation throws. Five drill arms
each kill exactly one body net of a 194-green control, and the two new
pins are killed by different arms.

### **THE VERIFIER FILED A PROCESS ERROR AGAINST ITSELF, IN THE VERDICT THAT APPROVED THE CARD**

**IT IS THIS CARD'S OWN SUBJECT, PERFORMED BY ITS VERIFIER.** The
rejection verdict asserted that Playwright prints no `Running N tests`
header. **It does** — *"every one of my five captured runs opens with
`Running N tests using 1 worker`"* — and the disproof was already sitting
in the verifier's own logs when the claim was written. It was repeated
from a brief rather than checked. **No count changed, because the counts
had been derived by counting bodies rather than by trusting the header.**
Two integrator briefs carried the same false claim and two lanes counted
bodies because of it. **The header exists; cross-check it against the
body count, which is what this checkpoint did — 194 = 194 on both runs.**

## Ranges, every dot count stated, at their own refs

    git merge-tree --write-tree 70b1d40 d843508 -> tree 8952e837…, exit 0 (read from $? FIRST)
    git diff --name-only 70b1d4058ee1..2a0652aff5b8  (THE MERGE'S DIFF)   ->   9   the only one that means anything
    git diff --name-only 70b1d4058ee1...2a0652aff5b8 (three dots AT the merge) ->  9   collapses, as it must
    git diff --name-only 5036958..d843508  (merge-base..tip, FORBIDDEN)   ->   9
    git diff --name-only 70b1d40..d843508  (two dots BEFORE the merge)    ->  39   ← the T-083 trap, live
    git diff --name-only main..HEAD        (FORBIDDEN)                    ->   0   ← read this row twice

**THIS INTEGRATOR WALKED INTO THE T-083 TRAP AND IS RECORDING IT RATHER
THAN QUIETLY FIXING IT.** My first disjointness computation used
`git diff --name-only 70b1d40..d843508` **before the merge existed**.
`d843508` is not a descendant of `70b1d40`, so the two-dot form returned
the union of the lane's 9 paths **and the reversal of everything main had
gained since the merge-base** — **39 paths**, including `docs/STATE.md`,
three `method/` files and every T-127 and T-132 card. **It produced a
FALSE INTERSECTION of five paths with the other live lane**, which is
exactly the shape that stops a merge for no reason. The RANGE RULE is
`<main-before>..<the merge commit>` **at the merge**, and before the merge
exists there is no such pair — which is `T-083`'s entire subject, arriving
live at a merge for the first time in this record. **The correct pre-merge
form is the merge-base**, and it agreed with the three-dot form byte for
byte here.

**THE FORECAST TREE IS THE MERGE'S TREE, ON EXIT 0.** `merge-tree
--write-tree 70b1d40 d843508` exits **0** and returns `8952e837`. No
conflict, no resolution, nothing written into the merge commit; parents
are `70b1d40` and `d843508` and nothing else. **T-132's checkpoint
established that this sentence holds only on exit 0**; this merge is the
exit-0 case and the sentence holds.

**FENCE DISJOINTNESS WAS PROVED AS SETS, TWICE, BECAUSE THE OTHER LANE
MOVED BETWEEN THE TWO PROOFS.** `comm -12` of this merge's nine paths
against `T-135`'s work — committed **plus** the modified and untracked
paths in its worktree — is **EMPTY** at `5547f02` (12 paths) and **EMPTY
AGAIN** at `7d386f0` (17 paths). The checkpoint's own four paths were
checked against the same set and are also **EMPTY**. **The second proof is
the one that counts**, and only the moved lane list said a second proof
was owed.

**MAIN DID NOT MOVE UNDER THIS INTEGRATOR** — `70b1d40` when the range was
derived and `70b1d40` in the same command as the merge, read beside the
two diff checks. `git diff --cached --name-only` and `git diff
--name-only` were both EMPTY there, with one `??` row; **`??` alone is not
a ceremony.**

## THREE standing gates — ONE fires, one is OWED for the first time in four merges, all derived from the merge's own 9 paths

| gate | trigger | on these 9 | result |
|---|---|---|---|
| GRAPH REGEN | `*.ts/*.tsx/*.js/*.jsx` **or `*.rs`** outside `docs/` | **1 — OWED** | **ASKED TWICE**: exit 0 CURRENT both times |
| BOOT GATE | `app/src-tauri/**`, `app/src/**`, either manifest | **0 — NOT OWED** | not run, and the derivation is stated |
| DOCS GATE | a `docs/` path a code suite reads | **6 — FIRES** | exit **1**, **THREE** suites named, all green |

- **GRAPH REGEN IS OWED BY ITS TRIGGER HERE — THE FIRST TIME IN FOUR
  MERGES — AND THE ANSWER IS STILL A PROVABLE NO-OP.** `tools/e2e/tests/
  brief.spec.ts` is a `*.ts` outside `docs/`, so the trigger MATCHES;
  `.nputerignore` line 8 is `tools/`, so the walk never sees it. **Both
  halves were measured rather than reasoned**: `index --check --root ../..`
  exits **0**, CURRENT, at **944 590 bytes · 180 files · 2018 symbols ·
  1911 edges** — every figure identical to T-132's checkpoint — and
  `grep -c '"tools/' docs/architecture/graph.json` returns **0**. Asked a
  **second** time after every doc write in this checkpoint: exit 0 CURRENT
  again. **The graph was NOT regenerated and NOT committed. A skipped
  regen is news, so it is said out loud, and the ask is recorded because
  this lane's own first pass never recorded asking.**
- **THE IDENTICAL-FIGURES TRAP DID NOT FIRE, AND THE DISCRIMINATOR HELD
  FOR THE SIXTH TIME.** The trap fires when the CHECKPOINT WRITES A
  FIXTURE, **not** when the headline figures agree. This checkpoint writes
  `STATE.md`, `ROADMAP.md` and one card — no fixture, no indexed file — so
  the second ask agrees for a REASON and not by luck.
- **BOOT GATE — NOT OWED, DERIVED RATHER THAN SKIPPED.** Zero of nine
  paths are under `app/src-tauri/**`, `app/src/**`, `app/package.json` or
  `app/src-tauri/Cargo.toml`.
- **DOCS GATE — exit 1, FIRES on 6 of 9, THREE suites**: `npm test` from
  `app/`, `npm test` from `tools/e2e/`, `npx vitest run` from
  `lib/parser/`. Invoked DIRECTLY from the repo root with the RANGE RULE's
  own path list, **never through `xargs`**, exit read from `$?` on an
  unpiped command. **14 derived docs readers across 4 suites** (up one:
  `brief.spec.ts` joins as a `conventionsText()` caller, which is this
  merge adding a reader to the gate's own census), census **131 sites in
  22 files**, **0 frontmatter issues**, **6 root-anchored files all
  argued, 0 unlinked**.
- **`cargo test` IS A FOURTH SUITE THE GATE STILL CANNOT NAME** —
  `T-132-s2`, unchanged and unfired here: no path in this merge is
  `include_str!`'d, so the gap cost nothing at this merge. It was run
  anyway.

## Suites, every number derived here, exits read unpiped

`${PIPESTATUS[0]}` is EMPTY in zsh, so every exit below came off its own
`$?` on an unpiped command redirected to a file, and **the COUNT was read
as well as the exit**, because an exit alone cannot tell a green suite
from a suite that did not run.

- **cargo: 494 passed / 0 failed / 3 ignored, exit 0**, SUMMED over
  **SIXTEEN** `test result:` lines, lib suite **197 bodies in 5.05s**.
  **THE HEADER CHECK WAS DONE**: the `running N tests` headers sum to
  **497** = 494 + 3 ignored. **DO IT EVERY TIME** — T-129's M15 is the
  worked reason: a SIGABRT in one target prints **no `test result:` line
  at all**, so the summary reads unremarkably while whole bodies vanish.
  **494 is unchanged and that is the right answer**: this merge adds no
  Rust and touches nothing `include_str!`'d.
- **parser: 268/268 across 12 files, exit 0** — after `npm run build` from
  `lib/parser/`, which was run FIRST regardless.
- **app: `npm run build` exit 0** · **`npm test` 973/973 across 47 files,
  exit 0**.
- **E2E: 194/194, exit 0, ON EVERY RUN THAT STARTED — 2.0–2.2m each.** Up
  from 171 by the 23 bodies this merge lands. **AND THE HEADER WAS
  CROSS-CHECKED AGAINST THE BODY COUNT EVERY TIME**, because the verdict
  that approved this card had to correct a claim that the header does not
  exist: `Running 194 tests using 1 worker` against 194 `✓` bodies and a
  highest body number of 194. **The first two ran on the DEFAULT lane port
  14520; the rest were moved to 15933 — see the port-collision section
  below.** **The suite never contacts port 1420 and cannot be made to**:
  `resolveLanePort()` THROWS on 1420 by construction, which is a defence
  in the tree rather than a habit in a session. **THE RUN TOTAL IS IN THE
  LEDGER BELOW AND ITS LAST ENTRY IS IN THIS CHECKPOINT'S COMMIT MESSAGE**,
  never transcribed twice.
- **A FOURTH e2e INVOCATION EXISTS AND IT IS NOT A RUN.** It exited **1**
  before Playwright loaded, with **no header and zero bodies**, because
  the lane port was taken. **It is declared here rather than dropped**:
  an exit code alone would have read as a suite failure, and the count is
  what says the suite never started. That is this file's own rule —
  *an exit alone cannot tell a green suite from a suite that did not run*
  — earning its place for the first time in this series on a RED.
- **ALL THREE WATCHED CARGO INTERMITTENTS WERE READ BY NAME**, not
  inferred from a green exit: `startup_arm_watches_the_initial_root` `ok`,
  `a_hostile_session_id…` `ok`,
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`
  `ok`.
- **THE CYCLE GATE WAS RUN AGAINST THE LIVE REGISTRY AT THIS MERGE**:
  `arch cycles --root ../..` exit **1** read from `$?` **UNPIPED**, `cycle
  C-08 -> C-09 -> C-08`, `components=13 declared_edges=35`, report on
  **stderr** with stdout **EMPTY**. **`arch cycles > out.txt` on a red
  yields an EMPTY FILE**, and reading its exit through `| head` yields
  head's 0 — worth knowing before you pipe it.
- **`npm run lint:docs` exit 0**, **`npm run lint:tokens` exit 0** at
  **TOKEN 138 / CONTROL 767**, **`npm run typecheck` from `tools/e2e` exit
  0**, **from `lib/parser` exit 0**, and **from `app/` exit 1 `Missing
  script`** — the last one run deliberately, to re-derive the trap rather
  than quote it. **DERIVE THE CONTROL FIGURE AT YOUR OWN REF; IT IS NOT A
  CONSTANT** — 758 at T-132's checkpoint and **767** here: **+1** for
  `T-132-s5`, which arrived on main in the `T-135` dispatch commit, and
  **+8** for this merge's own new files. `git ls-files` reads **785**.
- **RUN LEDGER — every run declared, including the ones that agree.**
  cargo **once** (494/0/3); parser build **once** then the suite **twice**
  (268/268 post-merge, 268/268 after the doc writes); app build **once**
  then `npm test` **three times** (973/973 every time); `tools/e2e` **FOUR
  completed runs in main, all 194/194** — two post-merge on 14520, one
  after the doc writes and one after the last STATE edit, both on 15933 —
  each one **derived rather than assumed** by asking the DOCS GATE which
  suites the paths just written actually owe (asked about `docs/STATE.md`
  ALONE it names `tools/e2e` and nothing else, so the parser and app
  suites were correctly not re-run at that step). **AND ONE `tools/e2e`
  INVOCATION THAT IS NOT A RUN** — exit 1, zero bodies, port taken; see
  the port-collision section. DOCS GATE **four times** — the merge's 9,
  the checkpoint's own paths, `docs/STATE.md` alone, and the card alone.
  `index --check` **two asks, two invocations, both from
  `app/src-tauri/`**. **A FIFTH e2e RUN AND THE SUITES OWED BY THIS
  CHECKPOINT'S OWN LAST CORRECTION ARE DECLARED IN THE COMMIT MESSAGE**,
  which is where this regress terminates. **The final `tools/e2e` run
  that this file's own last write owes is declared in this checkpoint's
  COMMIT MESSAGE** — a commit message is not a code input, so recording a
  run there owes nothing further and the regress terminates on the first
  pass instead of converging. **What may never be done is stopping because
  the loop is tiresome, or writing a run's result before running it** —
  the habit this card's own verifier filed against itself, twice.

## The lane worktree is removed and the branch is kept

`/Users/ujju/Projects/nputer-T-133` was removed with `git worktree
remove`, after the merge and after the checkpoint (lane-protocol rule 6),
and `git worktree prune` was run behind it. The card took a rejection and
a re-check, so **the worktree survived until a verdict existed** — it did,
at `d843508`, and rule 6 is exactly about not destroying the only
reproducible copy of what was measured before then.

## The board, derived from disk at this checkpoint

**292 flat task files — 98 done / 35 planned / 41 parked / 117 suggested /
0 verifying / 1 building; 26 in `rejected/`.**
98 + 35 + 41 + 117 + 0 + 1 = 292. T-133's stamp moves done from 97 to 98
and clears the single `verifying`; the one `building` is `T-135`, a live
lane. The file count is up **six** from T-132's 286 — **five** suggestions
with this merge and **one** (`T-132-s5`) that arrived on main in the
`T-135` dispatch commit, which is why an integrator must derive the census
rather than add its own merge's contribution to the last figure.

**THE SUGGESTION BACKLOG IS ONE HUNDRED AND SEVENTEEN AND WANTS AN
ELEVENTH TRIAGE.** `T-133-s1`…`s5` came in with the merge and none is
triaged, because disposition belongs to a triage pass and not to an
integrator (T-083's ruling), so they stay `status: suggested` exactly as
filed.

## Documents ticked

- **STATE — rewritten, as a snapshot.** **Arm two's edit was NOT
  performed**; see that section above.
- **The card** is stamped `done` with the five fields, written with em
  dashes because a colon-space in a YAML plain scalar opens a nested
  mapping and has broken a card three times. It carries an `## Integration`
  section, and **the lane's own text, both verdicts and the fix pass's
  notes are preserved byte-untouched** — including the deliberately-wrong
  sentence the fix pass left standing above its own correction, which is
  the card's subject demonstrated on itself.
- **ROADMAP — TICKED on the census line, NOT on progress.** T-133 carries
  `feature: F-02` as **inherited backlog, not F-04 slice content**, and it
  ALREADY CARRIED `milestone: 4` before its own merge, so stamping it
  `done` moves no census figure. The milestone-4 census was **re-derived on
  disk rather than carried**: **96** cards carry `milestone: 4` — F-01 9,
  F-02 43, F-03 12, F-04 7, F-06 25 — every figure identical to T-132's,
  and this merge's five new files are suggestions, which carry no
  milestone. **FIFTH CONSECUTIVE MERGE WHERE THE F-04 PROGRESS LINE DOES
  NOT MOVE.**
- **ARCHITECTURE — NOT TOUCHED, and that is a DERIVATION rather than a
  skip.** Rule 3 says update it *if any interface moved*. **No component
  owns `tools/e2e`**: `grep -rn "tools/e2e" docs/architecture/components/`
  returns nothing, no `touch_slugs:` field names it, and `.nputerignore`
  excludes `tools/` from the walk — so this merge adds two scripts and a
  spec to a directory the registry does not model, and no component row,
  status or dependency can move. The byte-budget entry does not move
  either: the graph is unchanged at **944 590 bytes — 94.46%, 55 410 bytes
  of headroom** — **the second consecutive merge to spend NOTHING**,
  because no indexed file moved at all.
- **CONVENTIONS — NOT TOUCHED.** It was outside this card's fence, its two
  stale unbuilt-app denominators are FILED and not repaired (section
  above), and `T-133-s1` and `T-133-s4` add two more edits to the queue at
  its seat — see Next up item 2.
- **NO NEW ADR, and that is derived rather than skipped.** Nothing
  supersedes ADR-001–017. The one design decision inside this card — *a
  brief's rows are PARSED out of the contract and bound by label, so the
  contract has exactly one implementation* — is T-057 applied, not a new
  architecture decision, and it is recorded in the module's own header.
- **`graph.json` NOT REGENERATED and NOT COMMITTED**, because the gate was
  asked twice and said CURRENT both times, and `tools/` is excluded from
  the walk by construction.

## Provenance — SELF-DECLARED, never read off a trailer

T-133 is **built by `claude-opus-5`** — twice, the second time by a FRESH
executor after the rejection, as `TASK-FORMAT.md` requires — **verified by
a second `claude-opus-5` session** across two passes, and **integrated by
a THIRD `claude-opus-5` session** that neither wrote nor reviewed the
lane's commits before opening them. **`review: same-model` is the honest
label.** **The `Co-Authored-By` trailer on this lane's commits is a
harness constant and is NOT evidence of a model** — T-085 proved it and
T-101 sharpened it.

**98 done cards — 73 `same-model`, 19 `self-verified`, 5 `independent`, 1
EMPTY (T-056)**; 73 + 19 + 5 + 1 = 98. **DERIVED ON DISK AT THIS
CHECKPOINT rather than incremented** — the derivation and the increment
agree, which is the only way to know they do.

## What ACTUALLY reached the human's running app

**NOTHING THROUGH THE DEPENDENCY CHANNEL, AND THE CHECKOUT CLOSES IT A
SECOND TIME.** **ZERO of this merge's nine paths are under
`app/src-tauri/**` or `app/src/**`**, so neither of the app's two trigger
sets is touched by the diff. **"MY DIFF IS DOCS-ONLY" IS EXPLICITLY NOT
THE ANSWER TO THE DEPENDENCY QUESTION** (integrator.md rule 2), so it was
answered from the build order instead: this integration DID rebuild
`lib/parser/dist` and DID write `app/dist`, and both land in
`/Users/ujju/Projects/nputer`. The vite serving 1420 has
`/Users/ujju/Projects/nputer-app/app` as its cwd — **@human's own
checkout, seven merges behind** — and `app/node_modules/@nputer/parser`
there is a **RELATIVE** symlink, so it resolves inside that checkout with
its own `lib/parser/dist`. **The running product reads none of what this
integration wrote.**

**WHAT I CANNOT CLOSE, STATED RATHER THAN ASSUMED AWAY.** The app hosts a
docs WATCHER, and which project folder @human has open in it is not a fact
of any tree — it is a runtime choice. **If that folder is
`/Users/ujju/Projects/nputer`, this merge's five new suggestion cards and
one status change reached the running board through the watcher.** That is
an INTERRUPTION channel (a re-render), never a breakage one, and no
integrator can read which folder is open without touching the app, which
is not this seat's to do. Recorded because the honest answer to *"did my
work reach the human's product"* here is *"through one channel, no; through
the other, I cannot tell, and here is why."*

**Port 1420 was read with `lsof -nP -iTCP:1420` and nothing else** — no
bind, no connect, no signal. Holder `node` pid **88948**, `TCP
[::1]:1420 (LISTEN)` plus one ESTABLISHED pair with a `com.apple` client
pid 53420, read at **01:46:05 EEST** (before any command that writes) and
again at **01:48:33 EEST** after the merge, and again after the suites,
the gates and the doc writes. **Every reading identical, same pid.** The
anchored process read — `ps -o pid,lstart,command -p 88948` — reports
`node /Users/ujju/Projects/nputer-app/app/node_modules/.bin/vite`, started
**Tue Aug 25 10:54:32 2026**, unchanged throughout. **A pid, a port holder
and a start time are live-environment facts, not functions of a tree**, and
all three are already stale for you.

**RULE 1's TRIGGER NEVER FIRED, AND IT IS STATED AS THE DERIVATION IT IS**:
all three `node_modules` trees, both `dist/` directories and `target/`
were checked and all six were present, so **no fresh dependency install
was owed and no `npm ci` was run.** **The repair is still item 9 below,
unwritten after FIFTEEN consecutive merges performed it by hand.**

**No process from this integration survives.** The e2e runs used the
default lane port **14520** (twice) and **15933** (once, after the
collision); 15933 was `lsof`-read free at **02:08:54** and read back at
**zero rows** at **02:11:01**, and **a probe reserves nothing, so the
runner's own bind is what proves the port was free.** `resolveLanePort()`
forbids 1420 by construction.
**ONE UNTRACKED FILE SITS IN THE MAIN CHECKOUT AND IT IS NOT THIS
INTEGRATION'S.** The zero-byte `z` (dated 2026-08-23) is still there for
the **twenty-seventh** checkpoint running — not this integrator's, not
this merge's, not staged, **left alone**, and named here because
`integrator.md` rule 4 asks for exactly that. **No `pkill`. No `npm ci`.
No `cargo clean`. No `git update-ref`, no force-push, no history
rewriting.** Be precise rather than claiming more than is true: this
integration's `cargo test` run and its three `nputer-index` invocations
all WROTE to main's `app/src-tauri/target/`, which reads **3.7 GB**, as
any cargo run must. **NO sibling worktree was entered or modified** —
`../nputer-T-133`, `../nputer-T-135`, `../nputer-app`, `../arch-verify`
and `/private/tmp/t135d` were read with `git -C … rev-parse`,
`git -C … status --porcelain` and `lsof` only, and `../nputer-T-133` was
removed only after this checkpoint. **All scratch work for this
integration lives outside the repository**, at a session scratch root, and
no worktree was cut at all. No path was staged by wildcard; **`git add -A`
was never used**, and every write used `git commit -- <paths>`.

## In progress / broken right now

**NOTHING IS BROKEN, AND THE ONE EXIT-1 COMMAND ON MAIN IS DESIGNED.**
**ONE** lane holds a fence — **T-135** (`building`, `[crate-index,
method/tasks/TASK-FORMAT.md]`). **It moved twice under this integration.**
Read `git worktree list` and the branch tip — or run `brief.mjs --state`,
which stamps the reading with a clock — rather than any table here.

**`tools/e2e` IS RELEASED.**

## Next up

1. **`T-133-s2` — ARM TWO'S EDIT TO THIS FILE, MEASURED AND WAITING.** The
   command is built, green and on main; the STATE edit it enables was
   routed out of the lane's fence and NOT taken by this checkpoint either.
   The card carries the measurement of exactly which four sections
   `--state` can answer and which must stay. **`docs/STATE.md` is FREE.**
2. **`docs/CONVENTIONS.md` IS FREE AND NINE EDITS ARE QUEUED AT ITS SEAT,
   ACROSS FOUR BULLETS** — `T-104-s5` carries the argument. **THE COMMAND
   LIST — two edits now**: `T-127-s5` (`arch cycles` ships undocumented)
   and **`T-133-s1`** (`brief.mjs` ships with no bullet, so the one
   derivation that ENUMERATES this project's commands cannot see the
   command this merge landed — a tool nobody can find is a tool nobody
   uses). **THE RANGE RULE BULLET — three edits, to `T-093`**, and **this
   merge adds a fourth candidate**: `T-083`'s pre-merge two-dot trap
   arriving live, at a merge, in an integrator's own first computation —
   see Ranges. **THE POISON DRILL BULLET — four edits, to `T-092`**, plus
   **`T-133-s4`**'s marker for a standing discipline, which is what would
   make the new command's row 9 exact instead of deliberately wide. **AND
   THE TWO STALE UNBUILT-APP DENOMINATORS** (840 at `:856`, 924 at
   `:1328`, against 973 on disk) belong in the same pass, along with the
   five-versus-six file count the file already names as its own
   contradiction.
3. **`T-091-s4` — THE PREDICTED-TREE COMPARISON IS PRACTISED EVERYWHERE
   AND WRITTEN NOWHERE.** `git grep -n "merge-tree" method/` still returns
   **zero rows**, re-checked at this ref, for the sixth checkpoint running.
   `method/` is free except `tasks/TASK-FORMAT.md`, and this file is not
   that file — **so this is takeable now**, and it has both cases in the
   record: T-132's exit-1 conflict and this merge's exit-0 collapse.
4. **`T-132-s4` — THE STAGED-STATE RULE TWO SHIPPED FILES CITE DOES NOT
   EXIST.** Unchanged. Its option (1) — write the rule in `lane-protocol.md`
   rule 4 beside the two prohibitions that name a collision — is preferred,
   and **its fence is free**. The positive control it asks for is the
   load-bearing part.
5. **`T-132-s5` IS FILED, WHICH DISCHARGES THE GAP T-132's CHECKPOINT
   RECORDED AS OWNERLESS.** Ruling thirteen sorts defects by WHEN they
   became false and never by WHO may write the fix, and has no answer for a
   claim the merge introduces already false. **This checkpoint used the
   rule three times and it answered cleanly every time**, because every
   defect it met predated the merge — so this is the first checkpoint in
   three to have NO quarrel with it, and that is a data point for the card
   rather than against it.
6. **`T-126-s3` — FOUR WRITTEN STATEMENTS ABOUT C-15 ARE FALSE ON MAIN**
   and have been for four checkpoints. **Nothing reds.** Fence
   `[app-dispatch, docs/architecture/components/]`, both FREE. Item 3 IS
   `T-110-s9`, so **one lane should take all of it.** **NOTE: `T-135`'s
   lane has this card's file open in its worktree**, so check the lane list
   before cutting.
7. **`T-127-s1` — THE SURVIVING CYCLE, WITH ITS MEASUREMENT AND ITS
   PARTITION ALREADY WRITTEN.** The fix needs `app-shell` (the `app/test/**`
   fixtures) and `lib-parser` if a component ID moves. **Both FREE.** It
   ships with the measured cost (6 of 973), the recommended four-node
   partition and the reason a smaller one is wrong.
8. **`T-127-s2` — THE DOCS WATCHER IS THE FENCE WORD WORTH CUTTING.** A
   word for C-10 frees 2 of 8 fences outright and makes 2 more honest.
   **`T-127-s4` is its warning label**: a `touch_slugs:` edit is invisible
   to every suite in this repository — measured 973/973 green under one —
   so **declaring a component is loud and re-drawing a fence is silent.**
9. **THE FRESH-INSTALL DETECTOR NEEDS ONE MORE STEP — FIFTEENTH
   CONSECUTIVE INTEGRATION TO PERFORM THE FIX BY HAND WITHOUT WRITING IT
   DOWN.** CONVENTIONS' DETECT AND REFUSE paragraph tests the PORT;
   `integrator.md` rule 1 governs the CHECKOUT. **The repair is one step —
   `lsof -p <pid>` for the holder's cwd, compared against the checkout you
   are installing into** — and this integration is a worked example of why
   it matters: the cwd read said `/Users/ujju/Projects/nputer-app/app`, so
   an install here would have been provably safe, and nothing in the tree
   says that. Fence `[docs/CONVENTIONS.md]`, **FREE**.
10. **TWO LATENT DEFECTS IN T-127's GATE, BOTH FAIL SAFE, BOTH ROUTED.**
    (a) the truncation flag is off by one at exactly 64 — a false sentence,
    never a false verdict; (b) the live positive control is brittle to a
    shared closing hop. Fence `[crate-index]`, **HELD by `T-135`.**
11. **`T-108-s2` — THREE LANDED CARDS CARRY "remove before landing"**
    (`T-091`, `T-102`, `T-120`), to be cleared in one commit or the gate
    reds on arrival. **`T-130-s2` — THE LOSSY-RESTORE CLASS IS UNGUARDED
    EVEN THOUGH BOTH INSTANCES ARE FIXED.** Both `[tools/e2e]`, **FREE
    with this merge.**
12. **`T-108-s3` + T-108's fence ruling** — `executor.md` STEP 5 is
    unperformable under a path-granular fence, and the ruling its conflict
    rests on is not in `method/`. **The two are one card**; `roles/` is
    free and `tasks/TASK-FORMAT.md` is HELD by `T-135`, so check which
    half the card needs before cutting.
13. **`T-133-s5` — A LONG PROJECT PATH STEALS THE BOARD'S STANDING
    REGION**, with a threshold now bracketed between 116 and 128
    characters and a two-pixel margin measured at 800×600. The fix is in
    `app/src` (`app-shell`, FREE); the spec that reds is in `tools/e2e`,
    also free now. **Until it lands, every drill and scratch worktree must
    be cut at a short root**, and that is a trap for a future hand rather
    than a defect in the spec.
14. **`T-111` IS `planned` AND ITS THREE FINDINGS ARE STILL FRESH**:
    `[app-board]` cannot hold a pin, and **C-11 is claimed by both
    `app-board` and `app-shell`, so those two fences were never
    disjoint** — `T-134`'s subject arriving early. Both FREE.
15. **`T-086-s1` + `T-102-s3` — THE HOSTILE-SESSION-ID BODY IS LIVE AT
    ~1-IN-20.** Two findings, one body, `[app-agent]`, **FREE**.
    **`T-102-s4`** — the `Activity` label reaches the webview through no
    bound at all, same fence. **AND THE FOURTH INTERMITTENT** —
    `T-120-s3`'s mtime signature, 3 red in 9 on unfixed code and now five
    consecutive greens on fixed code — is `[tools/e2e]`, **FREE**.
16. **`T-129-s1`** — `IndexOutcome::Error`'s doc comment promises "never a
    panic" and was false for this class; `app/src-tauri/src/index_cmd.rs`
    is C-05 (`app-shell`, FREE). **`T-129-s2`**, **`T-129-s3`**,
    **`T-129-s5`** are `crate-index`, **HELD by `T-135`**, and should be
    read beside item 10 — same file's neighbourhood.
17. **`T-129`'s CARD HAS ITS EXPOSURE BACKWARDS AND THE CORRECTION LIVES
    HERE.** The card proves the crash is the traversal's with *"10 000
    nested braces inside a function body … is exit 0"* — **true of `.rs`
    and FALSE of `.ts`**, because `extract::ts::Cx::scan` descends every
    named child of the whole tree. Measured: **exit 0 as `.rs`, exit 134 as
    `.ts`**, and TS `namespace` chains abort at **2 000** against Rust's
    tightest **3 000**, so **TypeScript is the MORE exposed language.**
18. **`T-127`'s CARD, SECTION ONE, IS WRONG IN THE SPECIFICS AND WAS
    DELIBERATELY NOT REPAIRED.** Four alternation hops, four reversals; the
    C-09 → C-08 direction has THREE closing edges and the card names two.
    The corrections live in that card's own lane text, verdict and
    `## Integration` section.
19. **THE COMMENT CORRECTION IN `churn-source.ts`** and **THE TWO UNPINNED
    GUARDS IN `map-churn-age.test.tsx`**, both `[app-map]`, free.
    **`T-104-s4`**, **`T-108-s1`**, **`T-108-s4`**, **`T-126-s5`**,
    **`T-126-s6`**.
20. **THE SUGGESTION BACKLOG IS ONE HUNDRED AND SEVENTEEN AND WANTS AN
    ELEVENTH TRIAGE.** `T-033-s1`…`s11`, `T-091-s1`…`s6`, `T-116-s1`,
    `T-108-s1`…`s4`, `T-104-s1`…`s5`, `T-126-s1`…`s7`, `T-129-s1`…`s5`,
    `T-130-s1`…`s2`, `T-127-s1`…`s5`, `T-132-s1`…`s5` and now
    `T-133-s1`…`s5` are untriaged. **`T-130-s1`'s OWN ROUTING LINE IS
    STILL STALE** — it says `docs/CONVENTIONS.md` is *"held by T-104"*;
    `T-104` is `done` and the seat is `T-092`. Recorded rather than edited,
    on the same ruling as everything else here.
21. **THE BOARD-TRUTH RULING** — NINETEENTH ask. **A PATTERN COUNT IN THE
    FOUR WALKS TABLE STILL HAS NO OWNER.** The GNU `xargs` column still
    closes at the first push, and `git remote` still returns zero remotes.

## Everything this integrator's brief got wrong

**Recorded because every integrator brief tonight has contained at least
one error, and saying so is the most valuable thing a checkpoint
returns.** This was the **EIGHTH** brief in the deliberately-thin format
and it declared four limits up front — *it does not protect an ARGUMENT*,
*atmosphere figures AND their qualifiers slip through*, *it does not stop
me being stale*, and *a summarised finding loses the findings inside it*.
It applied the fourth limit's remedy to itself again, replacing a précis
with **a reading list of three commits in order**, and **that remedy is
what bought this checkpoint everything worth having**: the three-line fix,
the nine-run tally, the header correction and the two-pixel threshold all
came out of `d843508`, `1b626e2` and the notes commits, and not one of
them survives compression. Sorted into the four categories the brief asked
for.

1. **STALENESS — THE LANE LIST, AND THE BRIEF SAID SO ITSELF.** *"One lane
   is live besides yours"* was true when written and true when I derived
   it; **nine minutes later that lane had committed and cut a sixth
   worktree.** The brief's remedy — *derive it by filtering on the branch,
   never the path* — is what made the staleness harmless, and the tool
   this merge lands is what made it VISIBLE. **This is the brief's third
   declared limit firing exactly as declared, on the card about that
   limit.**
2. **ONE FACT WRONG, AND IT IS THE MOST INTERESTING ERROR IN THE BRIEF
   BECAUSE I ALMOST "CORRECTED" IT IN THE OPPOSITE DIRECTION.** *"Its
   unbuilt-app figure of 14 failures across six files is exactly right;
   its denominator (840) is stale."* **The figure is right and the
   denominator is misattributed**: 14-across-six lives in the POISON DRILL
   bullet at `:1328` with denominator **924**, while **840** belongs to a
   DIFFERENT bullet at `:856` whose figure is **12 across five**. The brief
   merged two bullets. **And it omitted the thing that matters most: the
   file NAMES its own contradiction** at `:1327`. My own first grep found
   only `:856` and I drafted a correction saying the brief had invented
   the figure — **a false refutation of a true claim, caught only by
   reading the verifier's paragraph.** The brief's own framing is the
   right one and it applies to the brief itself: *a half-stale figure is
   more dangerous than a wholly stale one, because the true half vouches
   for the false half.*
3. **EVERY PREDICTION FIRED, AND THE ONE THE BRIEF FLAGGED AS A CORRECTION
   TO ITSELF WAS THE MOST USEFUL.** *"The tip is a VERDICT commit, not the
   lane's last work commit — derive it"*: exactly right, `d843508` **is**
   the re-check verdict, and a hand that merged `508bd2c` would have
   dropped it. *"Playwright DOES print `Running N tests`"* — the brief's
   own retraction of a claim it had spread to two lanes: **confirmed
   twice**, header 194 against 194 bodies. *"GRAPH REGEN is a provable
   no-op — ask it anyway, twice"*: asked twice, CURRENT twice, and proved
   two independent ways. *"`arch cycles` exits 1 by design"*: exit 1, 529
   bytes on stderr. *"`npm run typecheck` from `app/` does not exist"*:
   re-derived, exit 1, `Missing script`. *"Build `lib/parser` first"*:
   done, and the trap never got a chance to fire. *"One merge tonight was
   NOT disjoint — check rather than assume"*: checked, twice, and the
   second check was the one that was owed. *"`T-133-s5` reds between 116
   and 128 characters"*: quoted correctly from the verdict, and my scratch
   was cut nowhere at all.
4. **THE ARGUMENTS WERE ALL SOUND, AND THE BEST ONE WAS THE INSTRUCTION
   NOT TO OVERSELL THE TOOL.** *"A tool oversold is worse than one
   undersold"* is the load-bearing argument of this checkpoint, and acting
   on it produced the second limit above — **the tool guarantees a row's
   SOURCE and never its TRUTH** — which the brief did not name and which
   the tool's own ROW 6 demonstrates against this repository's own
   CONVENTIONS. *"Repair what the merge introduces, file what it merely
   reveals; prefer T-108's protocol-writes clause where the two
   disagree"*: correct, and the two never disagreed here, because every
   defect this checkpoint met predated the merge. *"Do not perform the
   STATE edit; it is not in this merge's fence"*: correct and
   load-bearing — the temptation was real, since `--state` answers four of
   this file's sections and the edit would have taken ten minutes.
5. **WHAT THE THIN FORMAT COST ON ITS EIGHTH TRIAL: ONE MISATTRIBUTED
   FIGURE AND ONE PREDICTABLY STALE LANE LIST, BOTH IN THE CATEGORIES IT
   NAMED IN ADVANCE, NEITHER IN AN ARGUMENT.** **Seventh consecutive trial
   where the arguments held.** The finding of this trial is a caution
   about the remedy rather than about the format: **the reading-list
   remedy works, and it moves the failure into the reader.**

   **AND THE READER FAILED TWICE, BOTH TIMES THE SAME WAY, ON THE CARD
   ABOUT EXACTLY THIS.** (a) I checked one of the brief's facts with one
   `grep`, stopped at the first hit, and drafted a false refutation of a
   true claim. (b) I derived "the e2e scratch port" by pattern-matching
   `:1[0-9]{4}` against the run log and got **16623** — which is a
   BOARD'S `scrollHeight` in a test-body measurement payload, not a port.
   That figure was written into a draft of this file and survived until
   the third e2e run failed for an unrelated reason and made me look at
   the actual port. **Neither was a bad memory; both were a bad
   DERIVATION** — a pattern that matched something, from a source that
   was never the row's named source. **This card's whole argument is that
   a derived answer beats a remembered one, and its own integrator has
   just demonstrated the failure mode that argument does not cover: a
   derivation from the wrong source is not better than a memory, it is
   worse, because it arrives with a provenance.** That is the same
   finding as the tool's second limit, arriving by hand instead of
   through the tool — which is what makes it worth the paragraph.
