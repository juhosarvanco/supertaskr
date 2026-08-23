---
id: T-093
title: A search that finds nothing is not a refutation, a charset is not the gate, and a backtick in a label runs the command — the hand's measurement hazards, written where the hand reads
feature: F-06
milestone: 4
priority: 49
size: S
status: planned
blocked_by: []
touches: [docs/CONVENTIONS.md]
builder:
verifier:
built_by:
verified_by:
review:
---

> **DRAFTER'S NOTE — remove before landing.** I hit the anchor finding's
> own class while verifying a DIFFERENT card in this batch, in a third
> way nobody has recorded: a hard-wrapped sentence is invisible to a
> grep for the phrase it contains. It is measured below and it belongs
> in this card, because it is the cheapest of the three and the one
> every session in this repository meets weekly.

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
wrapped.

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
