# The host project's spellings — the ONE file an adopting project rewrites

**THIS FILE IS A TRANSCRIPTION, NOT AN AUTHORITY.** Every `HOST>` line
below is copied out of the host project's own governing documents, and
the AUTHORITY column names the file and the bullet it came from — by
that bullet's own capitals, never by a line number, because a line
number is a coordinate in a mutable object that fails silently.

**READ THE BULLET. WHERE IT AND THIS FILE DISAGREE, THE BULLET WINS**
and this file is corrected in the same commit. A remembered command is a
different command.

**THE ADOPTION SEAM.** `SKILL.md` beside this file carries the ORDER and
the REFUSALS and names no project path; this file carries the spellings
and names nothing else. A project adopting the pack rewrites this file
against its own conventions and `SKILL.md` works unchanged. That split
is why the pack can live in a product-agnostic method tree at all — and
it is the thing to check first when the pack behaves oddly in a new
project.

**THE MARKER IS `HOST>` AND IT IS LOAD-BEARING.** It is what makes the
claim *"every command this pack names is one the project's own documents
already name"* CHECKABLE rather than asserted: collect every `HOST>`
line, collapse its whitespace, and require it to appear in the
whitespace-collapsed authority file. A row with no `HOST>` line is a row
nothing checks. **Collapse the whitespace on BOTH sides** — the
authority files are hard-wrapped at about seventy columns, so a command
is routinely split across two lines there and a naive search returns the
"absent" answer.

**Transcribed at `21f5325403a73e66204105d8746d246ee609e502` from
`docs/CONVENTIONS.md` and `docs/STATE.md` of the Supertaskr repository.**
Every figure carries the ref it was measured at, or it is left out.

---

## Reading the board

### dispatch view — what is startable, and which lanes are live

AUTHORITY: `docs/STATE.md`, the `LANES:` bullet — *"DERIVE `brief.mjs
--dispatch --full` BEFORE THE STAMP."*

    HOST> brief.mjs --dispatch --full

### board census

AUTHORITY: `docs/STATE.md`, the `BOARD CENSUS:` bullet.

    HOST> brief.mjs --state

### lane list, read off git rather than off the board

AUTHORITY: `docs/STATE.md`, the `LANES:` bullet.

    HOST> git worktree list --porcelain | awk '/^branch refs\/heads\/task\//'

### the seat holder

AUTHORITY: `docs/STATE.md`, the `THE SEAT:` bullet.

    HOST> brief.mjs --take-seat

---

## Dispatching

### the card audit — every contract row, from the source that row names

AUTHORITY: `docs/CONVENTIONS.md`, THE LANE PROTOCOL bullet's *THE BRIEF
IS ASSEMBLED BY THE ASSEMBLER* sub-bullet.

    HOST> node tools/e2e/scripts/brief.mjs --task T-NNN

### the preflight — re-derive the card's own claims at HEAD

AUTHORITY: `docs/CONVENTIONS.md`, THE LANE PROTOCOL bullet's *THE FENCE
IS A PROPERTY AT THE MOMENT OF THE WRITE* sub-bullet.

    HOST> node tools/e2e/scripts/brief.mjs --task T-NNN --preflight

### the fence — expanded into the lane as its manifest

AUTHORITY: the same sub-bullet. **This is step 4 of the arm below and is
not run separately in an ordinary dispatch** — it is written here so a
reader can see that the arm invents nothing.

    HOST> node tools/e2e/scripts/brief.mjs --task T-NNN --write-fence <the lane worktree>

### the dispatch arm — all eight steps, in order, refusing at the first that fails

AUTHORITY: `docs/CONVENTIONS.md`, the same sub-bullet's *ONE ARM
PERFORMS ALL EIGHT AND REFUSES AT THE FIRST THAT FAILS*.

    HOST> node tools/e2e/scripts/brief.mjs --dispatch-lane T-NNN --slug <slug>
    HOST> [--executor <seat>] [--verifier <seat>] [--scratch <dir>] [--dry-run]

Run it from the integration checkout, by the seat that HOLDS it.
`--dry-run` prints the plan and performs nothing.

### the lane's port and its scratch names — DERIVED, never defaulted

AUTHORITY: `docs/CONVENTIONS.md`, the E2E PORT bullet
(`SUPERTASKR_E2E_PORT=15000+<card number>`) and the SCRATCH RULE
(`<purpose>-<card id>.<ext>`). The arm's step 8 derives both; they are
here because a seat that types one by hand takes another lane's.

---

## The bench

### the attack set's saved name and its digest

AUTHORITY: `docs/CONVENTIONS.md`, THE VERIFIER'S BENCH IS TWO SPAWNS
bullet — the return is saved as `attack-set-<card id>.md`, and the
verdict cites `attack set: sha256:<hex> (<file>)` on a line of its own.

    HOST> shasum -a 256 <file>

There is no `sha256sum` on this platform.

---

## The gates

### the graded suite runner — READ THE COUNT, NEVER THE CODE

AUTHORITY: `docs/CONVENTIONS.md`, THE BLESSED GATE-RUNNER bullet.

    HOST> node tools/e2e/scripts/gate-run.mjs parser|app|rust|e2e

### the docs gate — two lines, and there is no `xargs` in the spelling

AUTHORITY: `docs/CONVENTIONS.md`, the DOCS GATE bullet — *"THE ONE
SPELLING, character for character"*.

    HOST> TREE=$(git merge-tree --write-tree <main tip> HEAD)   # read $? FIRST
    HOST> node tools/e2e/scripts/docs-gate.mjs $(git diff --name-only <main tip> "$TREE")

Read `$?` from the first line before you trust the second: a failed
range substitutes to zero arguments, and an empty path list is exit 2.

### the method eval gate — fires when the diff touches the method tree

AUTHORITY: `docs/CONVENTIONS.md`, the METHOD EVAL GATE bullet — *"THE
ONE SPELLING, character for character"*.

    HOST> node tools/method-evals/run.mjs

### the graph gate, and its regeneration

AUTHORITY: `docs/CONVENTIONS.md`, the per-package `app/src-tauri` bullet
for the check, and the GRAPH REGEN bullet for the regeneration. The
`--root` is load-bearing: without it the check reds falsely.

    HOST> cargo run -p supertaskr-index -- index --check --root ../..
    HOST> SUPERTASKR_UPDATE_GOLDEN=1 cargo test -p supertaskr-index --test self_graph -- --ignored

The regeneration lands with the CHECKPOINT, not with the merge.

### the boot gate

AUTHORITY: `docs/CONVENTIONS.md`, the BOOT GATE bullet and the
`tools/e2e` command bullet. Give it a scratch port beside a live app;
1420 is refused, not borrowed.

    HOST> SUPERTASKR_BOOT_PORT=14521 npm run boot:check

### the behaviour census, when a test name moved

AUTHORITY: `docs/CONVENTIONS.md`, the `tools/e2e` command bullet. It is
the INTEGRATOR's, in the merge commit; a lane reports the stale census
rather than regenerating it.

    HOST> npm run capabilities

### the health bands — a reporter, not a fifth gate

AUTHORITY: `docs/CONVENTIONS.md`, the HEALTH BANDS AT THE CHECKPOINT
bullet. The `--` is load-bearing and its absence is loud.

    HOST> npm run health
    HOST> npm run health -- --readings <the checkpoint's captured output>

---

## The human's app, the push and CI

### the one command that answers every question about the app's port

AUTHORITY: `docs/CONVENTIONS.md`, the PORT RULE bullet. **Nothing else
may be used, and never a bind probe.**

    HOST> lsof -nP -iTCP:1420 -sTCP:LISTEN

### the push — spelled bare, nothing before it and nothing after

AUTHORITY: `docs/STATE.md`, the standing hazard beginning *SPELL THE
PUSH BARE*. A `cd` through `;` leaves the guard unable to judge and it
refuses.

    HOST> git -C <checkout> push origin main

### and then read CI

AUTHORITY: `docs/CONVENTIONS.md`, the AND THEN READ IT bullet.

    HOST> gh run list --limit 5
    HOST> gh run view <id> --log-failed

---

## What is deliberately NOT here

**The merge itself.** `docs/CONVENTIONS.md`'s THE MERGE INTO MAIN IS
@human'S GATE bullet makes it the human's, by design: a session's merge
into the integration branch is EXPECTED to be refused by the permission
layer, the refusal is the gate working, and no workaround is legitimate.
A command here would read as permission to run it.

**Anything the arm performs.** The eight steps have one implementation.
A second spelling of any of them in this file would be the second path
`SKILL.md`'s refusals exist to prevent — `--write-fence` appears above
only as the arm's own step, labelled as such.
