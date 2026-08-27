---
id: T-093
title: A search that finds nothing is not a refutation, a charset is not the gate, and a backtick in a label runs the command — the hand's measurement hazards, written where the hand reads
feature: F-06
milestone: 4
priority: 49
size: S
status: done
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-093
verified_by:
review: self-verified
---

Absorbs: T-077-s3, T-080-s3, T-082-s3, T-084-s4, T-074-s4 (sixth
triage, 2026-08-20). All five files removed in this commit.

**CONVENTIONS governs the LANE's tooling in most bullets and the HAND in
two — the PORT RULE's `lsof` clause and the citation rule.** That
distinction is deliberate and it is stated: *"The rule above governs the
LANE's tooling, which is why this is stated separately — it governs the
hand."* This card puts four more hand hazards where the hand reads,
because all four have already cost measured time and one of them spent
model quota.

## ONE — a grep MISS is evidence of nothing, and there are at least three causes

CONVENTIONS' *A CITATION NAMES A SYMBOL, NOT A LINE* bullet is the
paragraph a reader consults when a search comes back empty, and it names
**one** cause: *"`git grep` run from a subdirectory silently scopes
itself to that subdirectory and returns nothing, which reads like a
refutation rather than a miss."* There are at least three.

**The second: a control byte.** Measured on T-077's own first commit —
two literal `0x00` bytes landed in `app/src/lib/docs-model.ts` as a
list-key separator written raw instead of escaped. The file compiled,
the type gate passed, the app suite passed 839/839, the app rendered
correctly. What broke was SEARCH: `grep -c "ordinal"` produced no output
at exit **1** over a file containing the word four times, `/usr/bin/grep
-n` said `Binary file … matches`, and `file` said `data`. **The search
did not report a match it could not display — it reported NO MATCH, at
the same exit code a genuinely absent string gives.** Half an hour went
into mis-attributing a CSS change to the wrong file on the strength of
that exit code. The gate is NOT the gap: `npm run lint:tokens` exits 1
with *"byte 9203: U+0000 [P5: literal control character (invisible to
binary-skipping searchers)]"*, and P5's own `what` string names the
failure mode. **The gap is the advice**, and this cause is worse than
the subdirectory one in a specific way: re-running from the root fixes
that one, while this one gives the same answer from anywhere, over a
file somebody has just edited.

**The third, measured at `4d2f03c` while verifying T-090: a hard wrap.**
`docs/CONVENTIONS.md` is wrapped at ~70 columns, so a sentence spanning
two lines is invisible to a grep for the phrase.
`grep -n "silent in exactly ONE case" docs/CONVENTIONS.md` returns
NOTHING while that exact sentence is live in the CI bullet — it breaks
after *"It is silent"*. `grep -n "silent in exactly"` finds it. **A
phrase search over a wrapped document is a search for a line break you
did not choose**, and every governing document in this repository is
wrapped. **It is the cheapest of the three causes and the one every
session in this repository meets weekly** — which is the whole reason it
travelled on a drafter's note rather than waiting for a later card. That
note's content is now in this paragraph and the note is deleted, per its
own instruction (T-093's executor, 2026-08-27). **AND THE TWO NEEDLES
ABOVE NO LONGER REPRODUCE**: at `bc2d82a` the CI bullet's sentence
breaks one word EARLIER than it did at `4d2f03c`, so the short needle
this paragraph recommends now returns nothing too, and only a two-word
head still finds it. ADR-019's compaction reflowed the line. The
MECHANISM is intact and the NEEDLE was never the finding — which is why
CONVENTIONS states the wrap and refuses to print a needle.

**Recorded rather than proposed** (T-077-s3's own second observation):
in some harnesses `grep` resolves to a SHELL FUNCTION rather than to
`/usr/bin/grep`, and the function returned exit 1 with no output where
the real binary printed `Binary file … matches` — so the one signal that
would have given the game away never reached the transcript. That is an
environment property and nothing in `docs/` should encode it; **any rule
written here describes the BYTES or the WRAP, never the tool's
message**, because the message is not guaranteed to survive the shell.

## TWO — `file --mime` charset is not the cheap version of the gate

Session briefs and several verdicts carry a standing rule "check files
with `file --mime` and read the charset", and T-058's record legitimately
uses `charset=binary` as evidence — **for U+0000 and for nothing else.**
Measured at `fef8870`: one runtime-built U+000B appended to
`tools/e2e/tests/token-scan.spec.ts` left `file --mime` reporting
`text/x-java; charset=utf-8`, unchanged, while `lint:tokens` reported
`byte 9977: U+000B` and exited 1. The same plant into two other files
behaved the same way. The C0 range P5 rejects is `<= 0x08`, `0x0B`,
`0x0C`, `0x0E`–`0x1F` and `0x7F` — read off `scanControlSource` in
`tools/e2e/scripts/token-scan.mjs` at `4d2f03c`, not remembered.
**The cheap version of the gate is the gate**: `npm run lint:tokens`
needs no `node_modules` and runs against a bare checkout.

## THREE — a backtick inside a shell label executes the command

T-082's own executor started a real model turn while building the card
whose whole subject is that this happens. It is recorded rather than
buried, on the precedent STATE set for the 1420 bind probe: **the rule is
on the syscall, not the intent.** The executor wrote a labelled grep
with the command name in backticks — the way every card in this
repository spells a command — and in `sh`, `bash` and `zsh` those are
COMMAND SUBSTITUTION. The shell ran it, the CLI parsed it as a PROMPT,
and a session started with that word as its first user message; six
assistant messages, ~2,485 output tokens, against a seven-day quota
STATE recorded at 85% spent.

Three properties make it a class rather than one clumsy command. **The
house style is the hazard** — copying the repository's own spelling into
a shell label is the natural motion and the one motion that executes.
**It is silent when the substitution succeeds** — nothing errors, the
output simply contains something nobody wrote. **And it defeats the rule
at the exact point the rule is being obeyed**: the violation arrived
through a LABEL, not through a command anybody chose to run.

## FOUR — running the lane writes into the live `docs/` tree

`tools/e2e/tests/token-scan.spec.ts`'s *"one runtime-built control byte
reds all seven first-party roots at exact byte offsets"* appends a
poison byte to seven tracked files and restores them. Verified at
`4d2f03c`: the plant list includes `docs/NORTH_STAR.md`, `AGENTS.md` and
`.github/workflows/ci.yml`. The restoration is proved properly — sha256
per file plus `git diff --quiet` over all seven — so this is **not** a
defect in that spec. What is unrecorded is the side effect while it
runs: `docs/` is the tree the app's watcher is armed over, so running
`npm test` from tools/e2e in the MAIN checkout beside a live `npm run
tauri dev` writes `docs/NORTH_STAR.md` twice within milliseconds and the
human's board can observe a snapshot in which that file is one byte
longer. It is the class T-081's checkpoint recorded from the other side
— *"integrating any `app/src-tauri/**` card into a checkout with a live
`tauri dev` restarts the human's window"* — and it deserves the same
one-line warning beside the PORT RULE, which already carries the "not
beside the live app" caveat for the boot check. **Run in a worktree it
touches nothing the human sees.**

## FIVE — a comment that restates a measured figure is a second implementation

Of T-074's six corrections, **exactly one had a mechanical reader, and
it lived in a different npm package from the comment it contradicted** —
which is why the two could disagree for weeks. The cheap half needs no
gate: **where a figure IS asserted somewhere, the comment CITES THE
ASSERTION BY NAME rather than restating its value.** *"the lens takes
the rest; `interview.spec.ts`'s `the split is 640 + the lens at >=1024`
measures it"* cannot go stale, because the only thing it claims is that
a test exists — a rename reds nothing but misleads nobody about a width.
That is a writing habit and it belongs beside *A CITATION NAMES A
SYMBOL, NOT A LINE*, which is the same lesson one category over. **The
expensive half is named and NOT recommended**: a gate that greps
comments for digit runs would fire constantly on prose that is fine; the
honest narrow version is "flag a comment quoting a figure in the same
file as an assertion of a DIFFERENT value", worth a prototype only if a
sixth instance turns up.

## Two more hazards, measured this session (seventh triage, 2026-08-24)

**5. A merge forecast should be MEASURED, not extrapolated.** Three
forecasts went stale in their absolutes this session and none in its
delta. The technique that works: build the merge tree, wrap it in a
throwaway `commit-tree` (no ref moves), check it out detached with its
own `CARGO_TARGET_DIR`, and run the gate there. Reproduced exactly at a
main two merges later — 1120/1703 to 1126/1712 against the lane's
1023/1550 to 1029/1559, **delta +6/+9 identical, only the endpoints
moved**. THE CARD SHALL state the delta as the invariant and the
endpoints as ref-bound, because a forecast checked by its deltas alone
would have reported "current" when it was not.

**6. THE PORT-PROBE ORDER IS BACKWARDS IN EVERY BRIEF THIS SESSION.**
`lsof -nP -iTCP:<port> -sTCP:LISTEN` is the **authority**; a `bind()`
probe is the confirming half, never the primary. Measured: on a port
holding client-side TIME_WAIT peers, `lsof` returns zero rows and a
plain `bind()` without `SO_REUSEADDR` still fails EADDRINUSE — a real
false red on port 14768. And the corollary, which is the part a reader
will get wrong: **unfiltered `lsof` is equally blind**, because
TIME_WAIT sockets have no owning process, so dropping `-sTCP:LISTEN`
"to be safer" buys nothing.

## Acceptance criteria

- **THE CITATION BULLET SHALL NAME EVERY KNOWN CAUSE OF A FALSE EMPTY,
  described by MECHANISM rather than by a tool's message**: the
  subdirectory scope (already there), a control byte in the file, and a
  hard wrap across the phrase. IF another cause is found during the
  sweep THEN it joins the list rather than replacing it.
- IF a search over a file somebody just wrote comes back empty THEN the
  advice SHALL say what to run next — `file(1)` for `data`, the token
  lint for the byte and its offset, a shorter needle for the wrap — and
  SHALL NOT rely on `grep` printing `Binary file … matches`, which a
  shell function can swallow.
- **THE `file --mime` RULE SHALL BE CORRECTED WHEREVER IT IS WRITTEN, not
  only here**: a `charset=utf-8` result is evidence about NUL and little
  else. THE C0 SET SHALL BE CITED TO `scanControlSource`, never
  transcribed as thirty values into prose — a set written twice is two
  chances to disagree.
- **THE BACKTICK RULE SHALL BE ONE SENTENCE beside the clause that
  already governs the hand**: never put a backtick inside a shell
  string — single-quote a command name, or omit it; a heredoc quoted as
  `<<'EOF'` suppresses substitution too.
- THE tools/e2e bullet SHALL carry the lane's write hazard: the lane
  plants and restores bytes in seven TRACKED files including one under
  `docs/`, so it is not run in the main checkout beside a live app, and
  a worktree is the answer. THE SEVEN SHALL NOT BE LISTED — name the
  spec body that owns the list.
- **THE CITE-THE-ASSERTION HABIT SHALL BE WRITTEN and the expensive gate
  SHALL BE REFUSED IN WRITING**, so the next reader inherits the
  decision rather than re-deriving it.
- **EVERY CLAIM THIS CARD ADDS SHALL CARRY ITS REF, and every "no
  matches" this card relies on SHALL have been run once against a
  planted hit** — that is T-092's proof-command rule applied to this
  card's own evidence, and the third cause above exists because it was
  not.

Verification: headless — the DOCS GATE fires on the CONVENTIONS edit;
run what it owes, record which suites and their exits, and run
CONVENTIONS' own live readers (the `kit.rs` stamp body,
`workflow-parity`, `docs-input-gate`) since editing this file is exactly
the act those readers exist for. **This card adds prose and may add no
test body; if it adds none, say so and name it** — a card that cannot be
poisoned records that it cannot, per the drill. IF any body is added
THEN the full drill applies: one side only, mutated text read back
before the run, restore proved by sha256 at the drill's own commit.
@human: none.

## Implementation notes (executor claude-opus-5 @T-093, lane `task/T-093-lane`, base `bc2d82a`)

**Diff to `docs/CONVENTIONS.md`: +8,926 bytes, 86,718 -> 95,644**, at
`a8d6df6` plus this commit. Four insertions, no deletions, no test body — the
fence is `[docs/CONVENTIONS.md]` and a test body would be
`tools/e2e/**`.

**WHERE EACH PIECE WENT, AND WHY THERE.** The lane/hand distinction is
stated in exactly ONE place in this document — the PORT RULE's *"The
rule above governs the LANE's tooling, which is why this is stated
separately — it governs the hand."* That sentence is now labelled
load-bearing and made a two-way pointer, so the hand's rules are
findable from either end instead of scattered among tooling bullets.

1. **The citation bullet** (`A CITATION NAMES A SYMBOL, NOT A LINE`)
   gains: its own identification as one of the two hand rules; A MISS IS
   NOT A REFUTATION with the three causes numbered ONE/TWO/THREE by
   MECHANISM; what to run next for each; the `file --mime` correction
   with the C0 set cited to `scanControlSource`; and the
   cite-the-assertion habit with the expensive gate refused in writing.
   The bullet's OPENER and FIRST SENTENCE are untouched on purpose —
   `namedDisciplines` (dispatch-brief.mjs) reads exactly those two, so
   the brief's discipline row is byte-identical to before.
2. **The PORT RULE bullet** gains the backtick rule beside the hand
   clause, and the `lsof`-is-the-authority correction, which is about
   that bullet's own command.
3. **The tools/e2e commands bullet** gains the lane's write hazard,
   naming the spec BODY that owns the seven-file list rather than the
   list.
4. **The RANGE RULE bullet** gains the forecast-delta clause (the
   card's seventh-triage hazard 5), with no figures in it — the
   endpoints are exactly what that clause says not to transcribe.

### Acceptance criteria

- **Every known cause of a false empty, by mechanism** — MET. Three,
  numbered, each a mechanism and none a tool's message. The bullet
  states explicitly that a fourth joins the list rather than replacing
  it.
- **What to run next, not relying on `Binary file … matches`** — MET.
  `file(1)` then `npm run lint:tokens` for the byte; a shorter needle or
  the collapsed text for the wrap; the root for the scope. The clause
  says in as many words not to wait for that message.
- **`file --mime` corrected WHEREVER it is written; C0 set cited** — MET
  in fence, and the "wherever" turned out to be NOWHERE ELSE. Measured
  at `bc2d82a`: `git grep -i charset -- method/ docs/CONVENTIONS.md
  docs/STATE.md docs/ARCHITECTURE.md docs/ROADMAP.md docs/decisions/`
  returns zero hits (positive control: the same needle over `docs/`
  returns eight task cards). The rule lived only in session briefs,
  which are not in the repository, and in historical card records, which
  ADR-019 makes append-only. Nothing mechanical propagates it —
  `dispatch-brief.mjs` has no `--mime` site — so CONVENTIONS is now its
  only standing copy rather than one of several.
- **Backtick rule, one sentence beside the hand clause** — MET. Rule
  first, mechanism and the measured cost after it.
- **tools/e2e bullet carries the write hazard, seven NOT listed** — MET.
  It names `token-scan.spec.ts`'s *"one runtime-built control byte reds
  all seven first-party roots at exact byte offsets"* and says the list
  is deliberately not copied.
- **Cite-the-assertion habit written; expensive gate refused in
  writing** — MET, both, in the citation bullet.
- **Every claim carries its ref; every "no matches" run against a
  planted hit** — MET; the drill below is the account.

### Commands, in order, each exit read from `$?` on an UNPIPED command

    lib/parser  npm ci                              0
    lib/parser  npm run build                       0
    tools/e2e   npm ci                              0
    app         npm install                         0
    app         npm run build                       0
    root        node tools/e2e/scripts/docs-gate.mjs --census        0
    root        node tools/e2e/scripts/docs-gate.mjs docs/CONVENTIONS.md   1 (FIRES, as designed)
    tools/e2e   npm run lint:tokens                 0
    app/src-tauri  cargo test                       0   518 passed / 0 failed
    tools/e2e   NPUTER_E2E_PORT=14763 npm test      0   233 passed / 0 failed

**AND THE GATE'S ANSWER CHANGED WHEN THE COMMIT DID, WHICH IS THE
POINT OF ASKING IT RATHER THAN PREDICTING.** Run against
`docs/CONVENTIONS.md` alone it named TWO commands. Run against the
COMMITTED merge diff — four paths, because the two suggestion cards and
the card itself are flat `docs/tasks/T-*.md` — it names FOUR. All four
were run on the committed tree at `a8d6df6`:

    app/src-tauri  cargo test                       0   518 passed / 0 failed
    app            npm test                         0  1013 passed / 0 failed
    lib/parser     npx vitest run                   0   314 passed / 0 failed
    tools/e2e      NPUTER_E2E_PORT=14764 npm test   0   233 passed / 0 failed

`snapshot_version_matches_the_live_method_stamps` — CONVENTIONS' Rust
reader — is `ok` inside the first. `cargo run -p nputer-index --
index --check --root ../..` exits **0**, `graph.json is CURRENT`
(1,020,023 bytes, 189 files) — the graph gate ASKED rather than
predicted, per its own bullet, even though a docs-only diff cannot move
it.

### Standing gates, DERIVED from the merge's diff (executor pair, RANGE RULE)

`git merge-tree --write-tree main HEAD` exit 0; the diff is **one path**,
`docs/CONVENTIONS.md`.

- **GRAPH REGEN** — NOT OWED. No `*.ts/*.tsx/*.js/*.jsx` or `*.rs`
  outside docs/ in a one-path docs-only diff.
- **BOOT GATE** — NOT OWED. Nothing under `app/src-tauri/**`,
  `app/src/**`, or either manifest. (And 1420 is HELD: `lsof -nP
  -iTCP:1420 -sTCP:LISTEN` read 2026-08-27T13:06:42Z on Mac.lan named
  `node` pid 19746 on `[::1]:1420` — the human's app is up, so the boot
  check would have needed a scratch port even had it been owed.)
- **DOCS GATE** — FIRES, and is the only one that does. Both owed
  commands run and green, above.
- **POISON DRILL** — no test body added; see below.

### The drill

**NO TEST BODY IS ADDED AND THIS CARD RECORDS THAT IT CANNOT BE
POISONED IN THE ORDINARY SENSE** — the fence is one markdown file. So
the drill was run against the KEEPERS that read this file, one side
only, the DOC mutated and every reader left alone, in a DETACHED scratch
worktree cut at `bc2d82a` with the edited document copied in. Mutated
text was read back with `grep` before each run.

| mutant (one side: the doc) | expected | observed |
|---|---|---|
| a second `- PORT RULE:` opener planted in the new text | RED | RED — `rawBullet` threw *"has 2 bullets containing \"PORT RULE:\", expected exactly one"*; the tools/e2e keeper stayed GREEN |
| a second `run from tools/e2e/:` marker planted in the new text | RED | RED — `conventionsBullet` threw naming 2 bullets; the PORT RULE keeper stayed GREEN |
| the new bullet's headline INVERTED to *"A MISS IS A REFUTATION AND THERE ARE NO CAUSES AT ALL"* | GREEN, i.e. unreadable | GREEN — `parseRangeRule`, `bootGateTrigger`, `graphRegenTrigger`, `parseDocsGateRecipe` and `lint:tokens` all pass over the inverted text |

**Restoration proved, not asserted**: after each mutant the drill copy
was restored and `shasum -a 256` matched the lane's file exactly
(`8a87b86da599c0897c16b9b5839e41d0e68c2d4a5c80607bdba7378043032253`
before the RANGE RULE insert), and the drill worktree carries its own
root — no `CARGO_TARGET_DIR` was involved because no Rust was compiled.
The two positive controls this card's own criterion demands were run
first: `grep -cF` on a string that IS present answers 1 at exit 0 and on
`zzz-not-present` answers 0 at exit 1, and every bullet-uniqueness probe
was shown GREEN on the unmutated document before any mutant.

**Mutant 3 is the finding, not a formality.** Inverting the new rule's
headline to say the opposite of what it says reds NOTHING. Everything
this card adds is prose with no mechanical reader, which is the exact
property `T-131` argues about and the reason `T-093-s1` below exists.

### The evidence behind the new text, re-derived at `bc2d82a`

Planted in a detached drill worktree, one byte at a time, into this
repository's own `docs/CONVENTIONS.md`, restored and proved each time:

- **One 0x00**: `/usr/bin/grep -c` answered **1 at exit 0**, `grep -n`
  printed `Binary file … matches`, and the shell-function `grep` this
  harness installs answered **exit 1 with NO output**. `file` said
  `data`; `file --mime` said `application/octet-stream; charset=binary`.
  `npm run lint:tokens` printed `docs/CONVENTIONS.md:byte 22048: U+0000
  [P5: literal control character (invisible to binary-skipping
  searchers)]` and exited **1**.
- **One 0x0B**: `file` and `file --mime` were **UNCHANGED**
  (`text/plain; charset=utf-8`), BOTH greps still found the needle at
  exit 0, and `lint:tokens` printed `byte 22048: U+000B` and exited 1.
- **The wrap**: at `bc2d82a`, `silent in` finds the CI bullet's
  retraction (1 hit, exit 0) and `silent in exactly` returns nothing
  (0 hits, exit 1).

### Where the card and the brief were wrong

1. **The card's §ONE second cause overstates `/usr/bin/grep`.** It says
   `grep -c` "produced no output at exit 1 over a file containing the
   word four times". At `bc2d82a` on this machine the real binary
   COUNTS the match (1, exit 0) and it is the SHELL FUNCTION that
   answers exit 1 with no output. The card's own *"Recorded rather than
   proposed"* paragraph already names that mechanism; the headline just
   attributes it to the wrong tool. CONVENTIONS now states both answers
   side by side, because the disagreement is the point.
2. **The card's §ONE third cause no longer reproduces as written.** It
   claims `grep -n "silent in exactly"` FINDS the sentence. At `bc2d82a`
   it does not — ADR-019's compaction reflowed the line and the break
   moved one word earlier. The mechanism reproduces exactly; the needle
   does not. Recorded in the body above, and it is why the new
   CONVENTIONS clause deliberately prints no needle.
3. **`T-090`'s card carries the same stale remedy** at
   `docs/tasks/T-090-…md:51` — *"Search for `silent in exactly`, or read
   the bullet"* — which now finds nothing. Records are append-only under
   ADR-019, so it is named here rather than edited.
4. **The brief's "currently 86,718" is right; ADR-019's addendum's
   86,373 is the LANDED figure, not the current one.** The two differ by
   345 bytes of post-compaction commits. Neither is wrong; they answer
   different questions, and the gate reads the `landed` field only for
   reporting — `warn`/`fail` are what bind.
5. **The ADR-019 checkpoint record seats this card wrongly.**
   `docs/checkpoints/2026-08-27-adr019-compaction.md` says *"(POISON
   DRILL is T-092's seat, RANGE RULE is T-093's)"*. T-093's subject is
   the CITATION bullet and the hand rules; only its seventh-triage
   hazard 5 touches the RANGE RULE at all, and that landed as one
   figure-free paragraph. Append-only record, so it is named here.
6. **The card's absorbed-files line reads as an instruction and is
   already discharged.** *"All five files removed in this commit"* — at
   `bc2d82a` none of T-077-s3, T-080-s3, T-082-s3, T-084-s4 or T-074-s4
   exists (positive control: 70 other `-sN` files match the same glob).
   They were removed when the card was filed. Nothing to do, and doing
   it would have breached the fence.

### The floor, and what this displaces

**It displaces nothing; it adds 8,926 bytes** and the document is now
**95,644 against a warn of 107,967 and a fail of 129,560** — 12,323
bytes of headroom to the warn line. The 48 KB TARGET moves further away,
and that is honest: ADR-019's addendum says the target is unreachable
while ~59 KB is spec-kept or card-owned, and this card was never a
deletion card. What it drops is the RESERVATION: CONVENTIONS' citation
bullet and PORT RULE were being held open pending T-092/T-093, and this
half of that hold is now discharged. If the file has to shrink, the
cheapest cut is the four dispatch-brief lane spellings moving to one
structured source, which the addendum already names.

### Suggestions, filed and let go

- `T-093-s1` — nothing mechanical reads the citation bullet's cause
  list; mutant 3 above is the measurement. Fence `tools/e2e`.
- `T-093-s2` — T-093 and T-142 are ONE card, and the recommendation is
  recorded there for triage rather than taken here.
