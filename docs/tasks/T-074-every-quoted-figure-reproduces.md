---
id: T-074
title: Every quoted figure reproduces, and every comment teaches the mechanism the code has
feature: F-02
milestone: 4
priority: 33
size: S
status: done
blocked_by: []
touches: [app-shell, app-map]
builder: claude-opus-5
verifier:
built_by: claude-opus-5 @T-074
verified_by:
review: self-verified
---

Absorbs: T-051-s1, T-058-s3, T-063-s1, T-063-s5, T-063-s6 (fourth
triage, 2026-08-19). The suggestion files are removed in the same commit
as this card. Five findings, one mechanism: **a durable statement a
reader will trust — a shipped comment, a quoted figure, a test file's
own assumed window — that the code does not support.**

THE RULING FIRST, BECAUSE TWO OF THESE ASK FOR IT BY NAME. T-063-s1 and
T-063-s6 both close with "it should be somebody's call rather than
nobody's": is a figure inside a closed card a historical record needing
no upkeep, or a number the next reader will trust? **This card takes the
call.** A card body is history, and a superseded-but-reproducible figure
stays as it is with a dated re-measurement beside it. But an arithmetic
that CANNOT be produced by the code is not history — it is a wrong
number wearing history's clothes, and it gets corrected in place with
the date and the derivation.

AND ONE CARD ALREADY CONTRADICTS ITSELF UNDER THAT RULING. T-063's
verdict section records the 870-character correction; its implementation
notes two hundred lines earlier still say 887. Recording a correction in
a verdict does not make the record true — the SOURCE claim is the one a
developer reads, and today the two disagree inside one file.

## Acceptance criteria
- THE SPLIT'S OWN COMMENT SHALL STOP TEACHING W-641.
  `GenesisScreen.tsx`'s comment above the split (the paragraph beginning
  "640px of chat plus the 1px rule") states arithmetic T-027's verifier
  falsified: the app is BORDER-BOX, the 1px rule sits INSIDE the chat's
  640, and the lens gets **W-640** — 800 / 640 / 384 / 160, not
  799 / 639 / 383 / 159. `interview.spec.ts` already carries the
  correction, so the two contradict each other across the fence.
  **AND THE DESIGN ATTRIBUTION SHALL GO WITH IT**: the comment credits
  799 to "the design's own number", and the design source says **800**
  — it sets `box-sizing: border-box` globally, gives the chat column
  `width: 640px` with a 1px right border, and gives the right half
  `flex: 1` inside a 1440px frame. The plan's W-641 was never a
  deviation from the design; it was the same border-box slip one level
  further back, and the correction at T-027 stopped short of the design.
- THE STANDING C0 CHECK'S COMMENT SHALL BE CORRECTED —
  `map-tasks-lens-dom.test.tsx`, the comment heading the control-byte
  scan. It still carries T-034-s5's superseded diagnosis verbatim: that
  the raw-HTML gate, `lint:tokens` and "the CI greps" all stop seeing a
  file carrying a literal control byte. All three claims are false as
  measured — both gates read through Node's `readFileSync` with utf8,
  where the byte is an ordinary codepoint and matching is unaffected,
  and `ci.yml` contains ZERO greps. What IS blinded is the SEARCHER: a
  binary-skipping searcher returns no match at all and exits 1, which is
  how every agent session searches this tree. The replacement SHALL keep
  the "compiles, bundles and tests green" opening and the T-012 / T-034
  history and swap only the middle. **The check itself SHALL NOT MOVE**
  — T-058's sixth criterion ordered it preserved exactly, it works, it
  names codepoint and offset, and it is proven by planting. This is
  three comment lines, no behaviour, no test change.
- THE STALE BUNDLE FIGURE SHALL BE CORRECTED AT BOTH SITES. T-041's and
  T-063's bodies both quote **696,302 B** for the DEV-flipped bundle;
  re-measured 2026-08-18 at `2fc3475` with node 22.22.0 and vite 7.3.6
  it is **764,391 B**, +68,089 (+9.8%), because the measurement predates
  T-027's interview harness and T-028's crescendo. **Both mechanisms
  reproduce exactly and SHALL be preserved**: `--mode development` does
  NOT flip DEV (the assets are sha-IDENTICAL, not merely the same size),
  and an inherited `NODE_ENV=development` does. The lesson SHALL be
  recorded with the correction: **pin the sha and the property, not the
  size** — the same lesson STATE already carries for `EXPECTED_GRANTS`,
  where three agents produced three byte figures from three ranges.
- T-063'S TWO NON-REPRODUCING FIGURES SHALL BE CORRECTED AT THEIR
  SOURCE, so the card stops contradicting itself. **887 characters** is
  **870 characters / 872 bytes** — 58 prefix plus the 800-character cap
  plus a 12-character marker, content-independent once the cap fires, so
  887 cannot be produced by this code at all. Every QUALITATIVE claim in
  that passage reproduced exactly and SHALL be left alone: zero raw
  control bytes, the escape legible as its six-ASCII-character JSON
  form, the truncation marker present, one line.
- `startup-screen.test.tsx`'s header SHALL stop saying "10 of these 23
  tests". The file has **15** and the poison reds **9**. AND the
  sharpened lesson SHALL be recorded beside it: the hazard needs the
  imported value to be GENUINELY USED, because TypeScript elides an
  import whose bindings are all unused — the first attempt at that
  poison came back 15 passed and proved nothing.
- THE SAME FILE'S EIGHT-SECOND COUPLING SHALL BE STATED AND SHRUNK. That
  file is ONE ordered narrative over one long-lived React root, and its
  first act deliberately PARKS the subscribe; the startup deadline now
  arms a REAL 8000 ms timer over that parked stretch. If wall-clock time
  between the park and the later refusal ever exceeds it, the deadline
  fires first and three copy assertions flip — a failure that looks like
  a copy regression and is actually a clock. Margin today is roughly
  150x (the whole file runs in about 52 ms), so this is latent, not
  live. Refuse the parked promise in the first describe's own `afterAll`
  so the parked window is one describe wide, AND state the coupling in
  the file's header. **A test-only deadline override is refused on
  sight**: a production seam that exists for a test is what ADR-017's
  discipline is against.
- EVERY CORRECTION SHALL CARRY ITS DATE AND ITS DERIVATION, so the next
  reader can tell a corrected figure from an original one without
  reading git history.

Verification: headless. No behaviour changes anywhere in this card
except the test-file restructure in the last criterion, which SHALL be
proved by running that file and by poisoning its moved assertions.

FENCE NOTE: the `app-map` half is **three comment lines in one file**
(`map-tasks-lens-dom.test.tsx`, T-034's file, whose subject fences it to
`app-map` even though it sits under `app/test`). IF T-067 wants the
`app-map` fence back, that criterion SHALL be split into its own size-S
card — it shares this card's mechanism, not its files. Three comment
lines are not worth a card unless the fence costs more than the work.

## Implementation notes

Built by `claude-opus-5 @T-074` in worktree `nputer-T-074` on branch
`task/T-074-figures`, cut from main's tip **`e83ee1d`**. Size S, so this
role stamped `done` itself and did not merge. **Every figure below was
re-derived at `e83ee1d` and none was copied from the dispatch brief** —
which mattered, because five of the brief's and the card's own claims
do not reproduce, and they are collected at the end of these notes.

**THE BASE WAS VERIFIED RATHER THAN TAKEN.** The brief said the last
`Checkpoint:` is `825932c` and the commits after it are docs-only:
`git diff --name-only 825932c..e83ee1d` (**TWO dots**, and legitimate
here because `825932c` is an ancestor of `e83ee1d`) returns exactly one
path, `docs/design/cross-harness-plan.md`. So DISPATCH FROM THE LAST
CHECKPOINT holds — no inherited stale graph.

### What changed, criterion by criterion

**1. The split's comment stops teaching W-641.**
`app/src/components/shell/GenesisScreen.tsx`. The paragraph taught
"640px of chat plus the 1px rule leaves the lens W-641: at 1440 -> 799
(the design's own number), at 1280 -> 639, at 1024 -> 383, at 800 ->
159". It now teaches W-640 — 800 / 640 / 384, and 160 at 800 marked as
arithmetic rather than a measurement, because the lens does not render
below `lg`. **AND THE ATTRIBUTION WENT WITH IT**, with the design source
measured rather than reasoned about (below).

**2. The C0 check's comment is corrected; the check itself did not
move.** `app/test/map-tasks-lens-dom.test.tsx`. The "compiles, bundles
and tests green" opening and the T-012 / T-034 history are kept; the
middle is replaced. The `it(…)` body is byte-identical — `git diff` over
this file is comment lines only.

**3. The stale bundle figure, corrected at both sites** — T-041's
implementation notes and T-063's criterion — with a third dated note
against T-063's own re-measure, which has itself gone stale.

**4. T-063's 887 corrected at its SOURCE**, so the card stops
contradicting its own verdict two hundred lines later.

**5 and 6. `app/test/startup-screen.test.tsx`** — the header's
"10 of these 23 tests" corrected and sharpened, the clock coupling
stated, and the parked window shrunk from four describes to one.

### Every corrected figure, with the ref it was measured at

| claim | was | is, at `e83ee1d`, 2026-08-20 |
|---|---|---|
| lens width at 1440 / 1280 / 1024 | 799 / 639 / 383 | **800 / 640 / 384** |
| "the design's own number" for the lens | 799 | **798 drawn, 800 by ratio** — see below |
| gates blinded by a control byte | three | **none** |
| searchers blinded by a control byte | "a binary-skipping searcher" | **U+0000 only**, 1 of the 30 bytes the check rejects |
| DEV-flipped bundle | 696,302 B | **782,361 B** (`index-JrWCgH80.js`, sha256 `0a442a30…`, 270 modules) |
| the sha-identical production pair | `index-ByWKsUIt.js` 488,805 B | **`index-3bNJ6pCB.js` 501,541 B**, sha256 `e4ea1c77…` |
| the startup-failed log line | 887 characters | **870 characters / 872 bytes** |
| tests in `startup-screen.test.tsx` | 23 | **15** |
| the value-import poison | "reds 10" | **fails COLLECTION, 0 bodies run**; 9 of 15 with the file's own tripwire lifted |
| that file's runtime / deadline margin | ~52 ms, ~150x | **58–60 ms, ~138x** against 8000 ms |

**THE DESIGN SOURCE, MEASURED HEADLESSLY IN CHROMIUM** rather than read
off the markup, because the markup alone is what produced 799 in the
first place. The `data-screen-label="Interview"` artboard of
`docs/design/claudedesign_handoff/nputer app.dc.html` was extracted whole
(lines 500–619, `<div` and `</div>` balanced 39/39) into a standalone
page carrying the file's own `* { box-sizing: border-box }`, and
measured: artboard rect **1440**, client **1438** (its own 1px window
chrome is inside the 1440); chat column rect **640**, client **639** —
the 1px rule inside the 640, which is the border-box fact the old comment
got wrong; right half (`flex:1`) **798**. So the design DRAWS 798 and its
RATIO gives 1440 − 640 = **800** in a viewport with no artboard chrome,
which is the app. **799 is neither**, and it is what you get by
subtracting the rule twice. The comment now states both numbers and which
is which.

**THE C0 MIDDLE, MEASURED THREE WAYS.**
1. *The gates.* The raw-HTML gate one body above reads
   `readFileSync(file, "utf8")` — a C0 byte is an ordinary codepoint and
   the regex is unaffected. `lint:tokens` is the one the card gets
   slightly wrong in the executor's favour: its P5 CONTROL half does NOT
   read utf8, it reads a **Buffer** (`scanControlSource` throws a
   `TypeError` on anything else, so byte offsets stay truthful), and it
   is therefore not merely unblinded but **the gate that REDS on such a
   byte**, over every tracked text file. `.github/workflows/ci.yml`
   contains **zero** greps (`grep -c grep` prints 0 and exits 1).
2. *The searcher.* Swept over all thirty bytes the check rejects, one at
   a time, into a real 14,289-byte copy of
   `app/src/architecture/map-layout.ts`. Only **U+0000** hides anything:
   ripgrep drops the file from a directory search (exit **1** when it is
   the only match) and `/usr/bin/grep -rn` prints "Binary file … matches"
   with the line suppressed at exit **0**, `-I` printing nothing at exit
   **1**. The other twenty-nine print the line at exit 0 under both, even
   though `file --mime` already says `charset=binary`.
3. *The history, from the tree rather than the prose.* At `832edd6^`,
   `map-layout.ts` carried **one U+0003** at offset 14240 (T-012's) and
   `task-waves.ts` carried **two U+0000** at 25269 and 25402 (T-034's).
   The two incidents fall on opposite sides of the measurement above,
   which is exactly how `832edd6`'s commit message came to generalise
   from the NULs to "every grep gate". Filed as **T-074-s1**, because
   three live copies of that sentence sit in `tools/e2e/scripts/
   token-scan.mjs`, inside T-084's fence this week.

**THE 870 DERIVATION.** `startup_failed_line`
(`app/src-tauri/src/lib.rs`) formats
`"[nputer] startup-failed: recv_at_ms={recv_at_ms} payload={}"` around
`sanitize_for_log(payload)`. Literal head 36 characters + a 13-digit
epoch-ms stamp + ` payload=` 9 = prefix **58**; `sanitize_for_log`
(`app/src-tauri/src/docs_watch.rs`) caps at `MAX_ECHO_LOG_CHARS` = **800**
and appends the 12-character `…(truncated)`. 58 + 800 + 12 = **870
characters**; the marker's `…` is U+2026 at three bytes, so
58 + 800 + 14 = **872 bytes**. 887 is 17 too many and cannot be produced.
One refinement the card's wording elides and the correction now records:
it is content-independent once the cap fires but **not stamp-independent**
— the existing unit test passes `recv_at_ms: 7` and its line is 858 by
the same arithmetic.

### Which corrections have a mechanical reader, and which do not

The brief asked for this plainly, and the answer is the uncomfortable one:
**one of six.**

- **W-640 — YES, at a distance.** `tools/e2e/tests/interview.spec.ts`
  asserts `width - 640` at 1440 / 1280 / 1024 and ran green here (91/91,
  case 24, *"the split is 640 + the lens at >=1024, and the chat alone
  below it"*). It pinned the NUMBER while the comment restating it was
  wrong, in a different npm package — which is precisely why they could
  disagree.
- **The design attribution — NO.** Nothing reads the design file.
- **The C0 middle — NO.** No test asserts what a searcher does.
- **The bundle size — NO, DELIBERATELY.** T-063 already chose the sha and
  the property over the size, and this card's third re-measure in two days
  is the argument for that choice, not against it.
- **870 characters — NO.** The only length assertion is
  `line.chars().count() < 1_000`, which 887 satisfies too. Filed as
  **T-074-s3**. The 800 + 12 half IS pinned, by
  `sanitize_for_log_escapes_control_chars_and_truncates`.
- **"15 tests" / "reds 9" — NO.** Nothing asserts the file's own
  cardinality.

Generalised and filed as **T-074-s4**: a comment that restates a measured
figure is a second implementation of it, and the cheap half of the remedy
needs no gate — cite the assertion by name instead of restating its value.

### The poison drill, and the honest problem a comment-only card has

**FOUR OF THE SIX CORRECTIONS CANNOT BE POISONED AT ALL, AND THAT IS THE
FINDING RATHER THAN A GAP TO PAPER OVER.** Revert any of the comment
edits and nothing reds, because nothing reads them — which is the same
sentence as the section above, arrived at from the other direction. It is
recorded rather than worked around: no assertion was invented to make a
comment testable, and no production seam was added.

**WHERE A CORRECTED FIGURE *IS* COVERED BY A PIN, IT WAS POISONED BACK TO
THE STALE VALUE AND SHOWN RED.** `interview.spec.ts` is inside T-084's
fence, so the drill was run on the pins this card's own restructure
created and on the two claims the header now makes. Every mutation was
one-sided, and **the mutated TEXT was read back with `git diff` or `diff`
before any suite ran** — never a substitution count alone.

| # | mutation (one side only) | result |
|---|---|---|
| **A** | add an UNUSED value import of `watcher-store` | **15 passed, exit 0** — TypeScript elides it, the poison proves nothing. This is the card's sharpened lesson, reproduced. |
| **B** | the same import with the binding GENUINELY USED | **exit 1, `Test Files 1 failed (1) / Tests no tests`** — the top-level `expect(isTauriRuntime()).toBe(true)` throws at collection. |
| **C** | B, plus that one tripwire lifted | **exit 1, 9 failed / 6 passed of 15**, every failure with phase `browser` — the card's 9, reachable only this way. |
| **M1** | remove the refusal from describe 1's new `afterAll` (producer side) | **exit 1, 6 failed / 9 passed** — describes 2, 3 and 4 entire. The moved code is load-bearing and really runs. |
| **M2** | `expect(screenOf()).toBe("startupFailed")` -> `"board"` in the moved body (assertion side) | **exit 1, exactly 1 failed / 14 passed** — precise, not incidental. |

C also answers CONVENTIONS' *lifting a safety guard to discriminate*
honestly: the lift was a measurement in a worktree, never a shipped test,
and the guard was restored immediately.

**ORDERING IS ALREADY PINNED BY BODIES THAT EXISTED BEFORE THIS CARD** —
worth stating because it is the risk the restructure introduces. If the
`afterAll` ran too early, describe 1's own *"is the loading screen, and
startup really is in flight"* (`screenOf() === "loading"`,
`listenCalls === 1`) would red. So "the window is one describe wide" is
held from both ends without a new assertion.

**RESTORATION PROVED, NOT ASSERTED.** After the pristine-file drills:
empty `git diff` and sha256 back to
`da3226ad9197d0f1f2d105700abc05824c32fbd9a4861aa1958b7d2740195c33`,
matching `git show HEAD:app/test/startup-screen.test.tsx`. After the
post-restructure drills: `diff` exit 0 against a pre-drill copy, sha256
`55cd58f2a11f8d9c5ab54c4ff7a1181b14bc8f3c183b618e66fa77b26432ee62`, and
the file re-run green at 15/15.

**AND THE STRONGEST EVIDENCE THAT NOTHING BEHAVED DIFFERENTLY** is not a
suite at all: `npm run build` after the edits emits
`dist/assets/index-3bNJ6pCB.js` at 501,541 B, sha256 `e4ea1c77…` — the
same content hash as the pristine build — and `diff -r` between the two
whole `dist/` trees exits **0**. Comments are stripped; the shipped bytes
are identical.

### Suites and gates — every exit code read from `$?`, none through a pipe

Fresh worktree, ADR-011 order: parser `npm ci` (**exit 0**) + `npm run
build` (**exit 0**), app `npm install` (**exit 0**), tools/e2e `npm ci`
(**exit 0**). No install was run in the main checkout.

- **app `npm test`: 831 passed / 831 across 42 files**, `APP_TEST_EXIT=0`
  — unmoved from the baseline this worktree measured before any edit
  (also 831/42, exit 0). `map-tasks-lens-dom` 29/29, `startup-screen`
  15/15, `architecture-dogfood` 9/9, `map-dogfood-render` 8/8.
- **app `npm run build`: `APP_BUILD_EXIT=0`**, 265 modules transformed.
- **parser `npx vitest run`: 263/263 across 12 files**, `PARSER_EXIT=0`;
  `npx tsc --noEmit` `PARSER_TSC_EXIT=0`. Load-bearing here rather than
  routine: its smoke test parses this repo's LIVE `docs/` tree at zero
  issues, and this card adds four flat `docs/tasks/T-074-s*.md` files and
  rewrites passages in three more.
- **Rust `cargo test`: 352 passed / 0 failed / 3 ignored**,
  `CARGO_TEST_EXIT=0`, summed from **15** `test result:` lines. Not owed
  by this diff — zero `.rs` paths — and run anyway; unmoved, which is
  what a zero-`.rs` diff requires.
- **token lint: `LINT_SELFTEST_EXIT=0`** (49 TOKEN + 4 CONTROL samples,
  **71** walk-policy checks, 8 evidence-floor checks) and
  **`LINT_TOKENS_EXIT=0`** — *clean (TOKEN **119** files under app/src,
  app/test, tools/e2e; CONTROL **563** tracked text files)*. Both figures
  match the brief at this ref. TOKEN **cannot move on this branch** — the
  five added files are all under `docs/tasks/`, outside TOKEN's roots.
  CONTROL's 563 is a count at `e83ee1d` and is **568** once these five
  are tracked, measured on the committed tree — stated both ways so the
  next reader does not read 563 as a post-merge figure.
- **E2E lane: 91 passed**, `E2E_EXIT=0`, one worker, zero retries, zero
  skips, on scratch port **19876**; `npm run typecheck`
  `E2E_TYPECHECK_EXIT=0`. Not owed (0 paths under `tools/e2e`) and run
  because `app/src` moved and case 24 is the assertion this card's
  comment was contradicting.

**GRAPH REGEN — FIRES, and the red is REAL.** Trigger derived
mechanically over the prescribed path list: `*.ts/*.tsx/*.js/*.jsx`
outside `docs/` matches **3** — `app/src/components/shell/
GenesisScreen.tsx`, `app/test/map-tasks-lens-dom.test.tsx`,
`app/test/startup-screen.test.tsx`. `cargo run -p nputer-index -- index
--check --root ../..` from `app/src-tauri` exits **1**:

    committed:   576235 bytes · 118 files · 996 symbols · 1520 edges
    fresh index: 576243 bytes · 118 files · 996 symbols · 1520 edges
    files  +0  -0  ~3
    | ~ app/src/components/shell/GenesisScreen.tsx  (content, loc 225 -> 250)
    | ~ app/test/map-tasks-lens-dom.test.tsx        (content, loc 724 -> 744)
    | ~ app/test/startup-screen.test.tsx            (content, loc 449 -> 489)

The `~3` are exactly the trigger's own three. **No regenerated
`graph.json` is committed** — CONVENTIONS puts the regen at the
CHECKPOINT, and the committed line above confirms the base graph was
current at `e83ee1d` (576235 / 118 / 996 / 1520, the brief's figure,
reproduced).

**AND THE "COUNTS DIFFER" TEST FOR A REAL RED IS WRONG FOR A
COMMENT-ONLY CHANGE** — the dispatch brief offered it and this lane is
its counterexample. Files, symbols and edges are **identical** on both
lines here; only the byte total and three files' `loc`/hash move. The
discriminator is the one CONVENTIONS actually states, the SECOND line,
and both reds were reproduced side by side to show it: with `--root ../..`
the output is the block above; **without** it, same exit **1** and the
same STALE headline, but the second line reads `committed: MISSING at
docs/architecture/graph.json` and there is no file diff at all.

**BOOT GATE — FIRES at 1 path** (`app/src/**`; `app/test/**` matches
neither this trigger nor either manifest). `NPUTER_BOOT_PORT=19874 npm
run boot:check` from `tools/e2e`: **`BOOT_CHECK_EXIT=0`**, both lines
detected — *`[nputer] project folder: /Users/ujju/Projects/nputer-T-074`*
and *`[nputer] window "main" created`* — and the process tree stopped
itself (`exit=null signal=SIGTERM`). Port 19874 was bind-probed FREE on
all four stacks (`127.0.0.1`, `0.0.0.0`, `::1`, `::`) before use, as was
19876 for the lane; an IPv4-only probe of a v6 listener reports free,
which is why all four.

### The range, every dot-count stated

    git merge-tree --write-tree e83ee1d HEAD   -> a tree, exit 0 (read from $?)
    git diff --name-only e83ee1d <TREE>        -> 11   THE PRESCRIBED PRE-MERGE FORM
    git diff --name-only e83ee1d...HEAD  (THREE dots) -> 11
    git diff --name-only e83ee1d..HEAD   (TWO dots)   -> 11

**THE TREE HASH IS DELIBERATELY NOT QUOTED, and the reason belongs on
this card of all cards.** `merge-tree --write-tree e83ee1d HEAD` is a
function of HEAD, and HEAD contains this paragraph — so any hash written
here is falsified by the act of writing it. Measured rather than
reasoned: the value was `0b151465…` before these notes were committed
and `a885001…` after. What IS stable and IS worth recording is the exit
code (**0** — a tree, not the CONFLICT report that exit 1 would mean,
and read from `$?` rather than swallowed by the command substitution)
and the eleven paths. An integrator re-runs the command; they do not check
a hash against a card.

**ALL THREE AGREE, AND THAT IS AN ACCIDENT OF TIMING RATHER THAN A
LICENCE.** `git merge-base e83ee1d HEAD` IS `e83ee1d` — main has not
moved since this branch was cut — so three dots collapses onto two dots
onto the prescribed form, exactly the way the RANGE RULE says they
collapse at a merge for a different reason. **Two sibling lanes (T-084 on
`[docs/CONVENTIONS.md, tools/e2e]`, T-072 on `[app-interview]`) are live
on the same base**, so main will very likely have advanced by the time
this is integrated, and at that moment the three forms separate. The
integrator should re-derive against their own main-before rather than
quote the 11 — a count with no ref goes stale from BOTH ends.

11 files changed, **827 insertions, 22 deletions** (393 before these
notes existed — the same self-reference as the tree hash, settled here by
rewriting the figure in place and re-measuring until it was its own).
Suffix census: **8 md, 3 tsx**. The three fences are disjoint as briefed:
no path here is under `tools/e2e`, `docs/CONVENTIONS.md`, or
`app/src/genesis/`.

### The human's app — untouched, and read the one legal way

`lsof -nP -iTCP:1420 -sTCP:LISTEN` and NOTHING ELSE, at the start and at
the end. Identical both times: `node` pid **82549**, one socket,
`TCP [::1]:1420 (LISTEN)`. **No bind, no connect, no signal, on any
interface, at any point.** The supervisor chain is unchanged and
byte-for-byte the same as STATE records it — `npm run tauri dev` **82342**
-> `tauri` **82364** -> app **85379**, and `npm run dev` **82504** ->
`vite` **82549**, the first four up since Aug 18 03:45:46 and the app
since Aug 20 00:20:43. **Nothing in this lane could reach them**: every
edit, build, suite and boot check ran inside `nputer-T-074`, which has its
own `node_modules`, its own `target/` and its own `dist/`, and the boot
check ran on 19874. The two `nputer-T-060` `fake_agent` orphans were left
alone (`T-043-s1`).

Scratch files were prefixed `T074-` in the session scratch directory,
which is not private (STATE's eighth observation).

### Corrections to the card and to the dispatch brief

Trust the tree, not the brief — five things did not reproduce.

1. **"The design source says 800" is half right.** The design's RATIO
   gives 800 in the app's viewport; its own artboard DRAWS **798**,
   because the 1440 frame is border-box with 1px window chrome. Both are
   now in the comment. Neither is 799, which is the card's actual point
   and stands.
2. **"A binary-skipping searcher returns no match at all and exits 1" is
   true of one byte, not of the range.** Only U+0000, and even then
   "exits 1" is ripgrep's and `grep -I`'s answer — plain `/usr/bin/grep`
   exits **0** and prints "Binary file … matches". T-058's own
   measurement used U+0000 and was right; the generalisation to "a
   control byte" is what fails. See **T-074-s1**.
3. **"Both gates read through Node's `readFileSync` with utf8" is wrong
   about `lint:tokens`, in the safe direction.** Its P5 half reads raw
   Buffers on purpose. The conclusion ("not blinded") is right and
   understated: P5 is the gate that reds on the byte.
4. **"This is three comment lines" understates the work.** The accurate
   replacement middle is about twenty-five lines, because it has to name
   which byte, which searcher and which exit code. The check itself did
   not move, as ordered.
5. **"The poison reds 9" is unreachable as written**, since `c00184e`
   (2026-08-18) added the top-level `expect(isTauriRuntime()).toBe(true)`
   that throws at collection. 9 is right with that one tripwire lifted,
   and both halves are now recorded in the file and in T-063.

And from the brief specifically: **"confirm a real red (counts differ)"
is not the discriminator** — see GRAPH REGEN above. Everything else the
brief supplied reproduced exactly at `e83ee1d`: CONTROL **563**, TOKEN
**119**, app **831/831** over **42** files, parser **263/263**, graph
current at **576235 B / 118 / 996 / 1520**, port 1420 held by pid 82549,
the app at 85379.

### Filed, and let go

**T-074-s1** — P5's own printed label carries the over-generalisation
this card corrected; three live sites in `token-scan.mjs`, inside T-084's
fence. **T-074-s2** — the C0 check and `scanControlSource` are the same
thirty-byte predicate written twice over nested corpora, agreeing today
with nothing to keep them agreeing. **T-074-s3** — nothing pins the
870-character log line; `< 1_000` accepted 887 too. **T-074-s4** — a
comment that restates a measured figure is a second implementation of it.
**T-074-s5** — **there is a SECOND self-contradicting card and this one
missed it**: T-027's plan section still teaches W−641 and calls it
*"measured rather than guessed"*, while its own notes and its own verdict
both record W−640 further down. It is the SOURCE the comment corrected
here was copied from, and after this card it is the only live site still
teaching 799. Not fixed, because criterion 1 names the comment and
criterion 4 names T-063 by id — the path is free (checked against both
sibling branches), so this is scope rather than fence, and it is triage's
call.

**Not done, deliberately:** the `app-map` half was NOT split into its own
card. The card offers that only IF T-067 wants the `app-map` fence back;
T-067 is not dispatched, `app-map` is free, and the fence cost nothing.

## Verdicts
