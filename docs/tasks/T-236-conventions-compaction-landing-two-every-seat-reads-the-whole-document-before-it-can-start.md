---
id: T-236
title: CONVENTIONS compaction landing two — every seat reads the whole document before it can start, it sits at its own warn line, and ADR-019 says the measurement narrative it carries belongs in records
feature: F-01
milestone: 4
priority: 1
size: L
status: done
blocked_by: []
touches: [docs/CONVENTIONS.md, tools/e2e/scripts/docs-scan.mjs, docs/decisions/019-governing-docs-rules-truths-records.md]
suggested_by: "the architect seat, 2026-09-02 — item 1 of docs/rooms/loop-efficiency.md, filed after @human asked for the loop's weak spots and ruled 'apply all of your current loop efficiency suggestions'"
builder: claude-fable-5-1@subagent
verifier: claude-opus-5@subagent
built_by: claude-fable-5-1@subagent, fix pass claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**THE SINGLE LARGEST COST EVERY LANE PAYS IS READING THIS DOCUMENT, AND
ADR-019 ALREADY SAYS MOST OF WHAT IT CARRIES BELONGS SOMEWHERE ELSE.**

`wc -c docs/CONVENTIONS.md` read **158,281 at cf9d462** against a warn
line of 164,393 and a fail line of 197,271 (`DOC_BUDGETS` in
tools/e2e/scripts/docs-scan.mjs, landed 2026-08-30 at 131,514). Five
seats read it per merged card — architect, executor, verifier twice,
integrator — and the root adapter sends every one of them to it before
they touch anything. At roughly a quarter of a token per byte that is
about forty thousand tokens a seat, two hundred thousand a card, before
any work starts.

ADR-019 rule 1 sorts every sentence into RULE, TRUTH or RECORD, and rule
5 says a recurring pattern earns ONE rule, ONE provenance citation and
ONE worked example in a governing document — further instances go to
records. The document has grown past that contract since its 2026-08-30
re-landing: whole bullets are re-measurement tables, second and third
worked examples, and instance narratives that the cards and checkpoint
records already hold. Derive the map rather than trusting this
paragraph:

    awk 'BEGIN{n=0} /^- /{if(n) print len, substr(title,1,60); n++; len=0; title=$0} {len+=length($0)+1} END{print len, substr(title,1,60)}' docs/CONVENTIONS.md | sort -rn | head -20

At cf9d462 that census put the POISON DRILL bullet first by a wide
margin, then the DOCS GATE, RANGE RULE, LANE PROTOCOL and CI bullets. Of
those five, three are PINNED by programs that derive figures or commands
from their text, and two are almost entirely narrative.

## The planning pass — this is an L card, and this section is its plan

**What moves.** A sentence moves when it is an INSTANCE of a rule the
document already states: a second worked example, a re-measurement
table, the story of how a rule was broken after being written, a count
that a card or record stamps at a ref. Each moved sentence is replaced
by a citation — the card id, the record, or the pre-compaction ref —
so the mechanism keeps its provenance and loses its narrative. **A
hazard is never deleted to fit** (ADR-019 rule 6): anything that lives
nowhere else stays, and the executor names each such sentence in the
report rather than cutting it.

**What stays, byte for byte.** Every sentence a program reads. The
readers are DERIVED, never listed: `node tools/e2e/scripts/docs-gate.mjs
--census` from the repo root prints them at the lane's own ref. At
cf9d462 the ones that pin TEXT rather than merely read the file were:

- `tools/e2e/tests/workflow-parity.spec.ts` — the per-package command
  bullets under Build and test, command by command, middle dots
  included; a reworded command reds it by name.
- `tools/e2e/tests/range-rule.spec.ts` and `tools/e2e/scripts/range-rule.mjs`
  — the RANGE RULE bullet's figures, tables and flip lists are READ from
  the document and checked; they are the one measurement narrative this
  card may NOT move, and the card says so rather than letting a lane find
  out.
- `tools/e2e/tests/gate-run.spec.ts` — the blessed runner named in
  exactly one place, and the suite list beside it.
- `tools/e2e/scripts/dispatch-brief.mjs` through `range-rule.mjs`'s
  `rawBullet` — four naming phrases each carried by exactly ONE bullet
  (THE LANE PROTOCOL, DISPATCH FROM THE LAST CHECKPOINT, Fresh-clone
  ORDER, PORT RULE with its colon); a second bullet carrying one exits
  every arm of `brief.mjs` at 3, which is how 43e776a went red on
  2026-09-01.
- `tools/e2e/tests/docs-input-gate.spec.ts` — the DOCS GATE bullet's
  printed spelling and its command list.
- `app/src-tauri/src/agent/kit.rs` — the `currently v<version>` stamp in
  the first gotcha, under `cargo test`.
- `tools/e2e/tests/brief.spec.ts`, `dispatch-order.spec.ts`,
  `lane-fence.spec.ts`, `push-guard.spec.ts` — bullets read by phrase
  (`conventionsText()`); the executor greps each spec for the phrases it
  passes and keeps every one.

**What the landing writes.** The new byte count goes into `DOC_BUDGETS`
in docs-scan.mjs as the landed value, with warn and fail re-derived by
the rule ADR-019 and its addenda state at the lane's own ref (T-162-s1's
byte-floor question is @human's and is not pre-empted here — apply the
rule as written), and a dated addendum on ADR-019 records the
measurement, exactly as T-162's addendum 4 did.

**What this card is not.** Not a rewrite of any rule, not a change to
any command, not a deletion of any hazard. A reader who knew the
document before should find every rule where it was, shorter.

## Acceptance criteria

- THE executor SHALL run `node tools/e2e/scripts/docs-gate.mjs --census`
  at the lane's base and treat every reader it names as a pin: after the
  cut, every reader suite SHALL be run in full and listed in the report
  with its exit, and a body that reds names the sentence that moved.
- WHERE a bullet's text is derived by a program — the RANGE RULE figures,
  the per-package command bullets, the runner's one spelling, the four
  naming phrases, the DOCS GATE spelling, the version stamp — THE bullet
  SHALL keep that text verbatim, and the report SHALL list the bullets
  left intact for that reason.
- THE compaction SHALL replace each moved instance with a citation to the
  card, record or pre-compaction ref that holds it, and IF a sentence
  lives nowhere else THEN it SHALL stay and be named in the report.
- THE executor SHALL report `wc -c docs/CONVENTIONS.md` at the base and
  at the tip, and the landing SHALL reduce it by at least a third; IF the
  pins above make that unreachable THEN the report SHALL say which
  sentences they hold and stop short rather than cut a pinned one.
- THE landed count SHALL be recorded in `DOC_BUDGETS` with warn and fail
  re-derived by the rule in force at the lane's ref, and ADR-019 SHALL
  gain a dated addendum recording the landing and its measurement.
- **A POSITIVE CONTROL**: in a scratch drill the executor SHALL cut one
  pinned sentence, show the reader that owns it RED by name, and restore
  it with the restoration proved by sha256 — so "every reader still
  passes" is a discrimination and not a constant.
- THE method version stamp line SHALL be byte-identical before and
  after, and the DOCS GATE's printed spelling SHALL remain character for
  character the string `tools/e2e/scripts/docs-gate.mjs`'s header prints.
- Verification: headless — the four suites, the docs gate on the diff,
  `npm run lint:docs`, and `npm run health` read for the CONVENTIONS
  headroom band.
- **Ceremony L**: this section is the planning pass; executor, then an
  independent verifier, then the integrator.

## Read beside

ADR-019 and docs/rooms/governing-docs.md (the contract), the record
docs/checkpoints/2026-08-27-adr019-compaction.md (the first landing,
whose shape this repeats), T-162 (the re-landing and its addendum),
T-146 (why a mechanism belongs in a governing document and an instance
in a record), T-111-s12 (a column-zero `- ` inside a bullet splits it
silently — the executor's own hazard while cutting), and
docs/rooms/loop-efficiency.md item 1.

## DISPATCH, 2026-09-02 — the stamp

**Ceremony L**: the planning pass is the card's own section above,
written at the seat before dispatch; executor, then an independent
verifier, then the integrator. The executor seat is claude-fable-5-1
because the work is judgement over prose with many pins, and a rejection
cycle on a 158 KB document costs more than the stronger seat does.

**Fence as filed**: `docs/CONVENTIONS.md`, `tools/e2e/scripts/docs-scan.mjs`
and ADR-019's file. Three sibling lanes run concurrently (T-216-s4,
T-223, T-230); none touches these files, and T-229 — which will move the
version stamp in the same document — waits until this card lands.

**Holder**: this lane does NOT hold the integration checkout and does
not merge; it stamps `verifying`, reports ready-to-merge with branch and
tip, and leaves its worktree standing. The compaction RECORD under
docs/checkpoints/ is the integrator's at the merge, not this lane's.

## Implementation notes

Executor claude-fable-5-1@subagent, 2026-09-02, lane
`task/T-236-conventions-compaction-two` at `/Users/ujju/Projects/nputer-T-236`,
cut at `3170247` (the dispatch stamp; the brief's row 4 named the
newest Checkpoint `43e776a` as the base, and the repository — the
manifest and the worktree — won). Every figure below carries the ref it
was measured at.

**THE LANDING.** `wc -c docs/CONVENTIONS.md`: **160,043 at `3170247`**
(base) → **117,502 at `d01b24f`** (the final text commit; unchanged at
the lane tip) — **−42,541 bytes, −26.6%**, in five committed passes:
160,043 → 143,106 (`4229b64`) → 135,951 (`261a7aa`) → 133,444
(`ffd66ec`) → 120,567 (`b7b391f`) → 117,502 (`d01b24f`). The
pre-compaction text is `git show 3170247:docs/CONVENTIONS.md`, and the
document's new preamble names it. `DOC_BUDGETS` re-landed at `e89d67f`:
landed 117,502, warn 146,878, fail 176,253 — `warn = ceil(landed +
max(F, landed × 0.25))` with `F = 2 053` (ADR-019 addendum 5; the
floor binds only below 4F = 8,212, so here it equals `ceil(landed ×
1.25)`), `fail = ceil(landed × 1.5)`. ADR-019 gained addendum 6 in the
same commit, append-only.

**THE BAR WAS NOT MET, AND THE STOP-SHORT CLAUSE WAS TAKEN.** A third
off the base is ≤ 106,695; the landing is 10,807 bytes short. The pins
hold roughly 17.6 KB verbatim (the RANGE RULE bullet 12,426; the
app/src-tauri command bullet 2,150; the lib/parser, app/ and
Fresh-clone bullets; the blessed runner; the DOCS GATE's two recipe
lines and four-column matrix; the BOOT GATE and GRAPH REGEN trigger
sentences; the lane spellings sub-bullet; the carve-out sentence; the
version stamp line) and by themselves do not make the bar unreachable.
What does is the card's own "what moves" clause and ADR-019 rule 6: a
sentence moves only when it is an INSTANCE, and after five passes what
remains is rule text — the tells, remedies, commands, exit-code legends
and hazards — with no other home. The fifth pass moved the fourteen
largest bullets by 32 to 303 bytes each, which is the measurement that
the instances were gone. Cutting further would have cut rules, which
the card forbids in as many words ("Not a rewrite of any rule … not a
deletion of any hazard"), and addendum 4's finding that a deeper cut
shortens the runway it was meant to lengthen stands. Reported rather
than smoothed over, here and in addendum 6.

**BULLETS LEFT INTACT BECAUSE A PROGRAM PINS THEM** (derived from
`node tools/e2e/scripts/docs-gate.mjs --census` at `3170247` — nine
readers of docs/CONVENTIONS.md: kit.rs under cargo, and brief,
dispatch-order, docs-input-gate, gate-run, lane-fence, push-guard,
range-rule and workflow-parity under `npm test` from tools/e2e — plus
each reader's own greps; the whole set is checked byte for byte by a
scratch pin script after every pass, and by the fast oracle
`node tools/e2e/scripts/brief.mjs --task T-236 --state --dispatch`):

- THE RANGE RULE bullet, whole (12,426 bytes): range-rule.mjs parses
  its tables, its T-027/T-078/T-080 figures, the scoreboard, the flip
  headline counts and per-gate lists, the falsified-sentence dating,
  the recipes and the prose commitments, sentence by sentence.
- The four `run from <dir>/:` command bullets: every backticked command
  in order with the middle-dot structure (workflow-parity.spec.ts,
  `packageCommands` in dispatch-brief.mjs, docs-input-gate.spec.ts's
  per-suite command check, push-guard.spec.ts's exit legend `exit 0
  current, 1 STALE, 2 usage, 3 the gate could not run` and its
  whole-element match of the `index --check` command). The lib/parser,
  app/ and app/src-tauri bullets are byte-identical to the base; the
  tools/e2e bullet's command list is identical and only its
  parenthetical prose moved.
- THE BLESSED GATE-RUNNER bullet: the one `gate-run.mjs` naming, the
  one `gate-verdict` naming, and the `parser|app|rust|e2e` suite list
  (gate-run.spec.ts) — byte-identical.
- The BOOT GATE trigger sentence through its ` — ` (range-rule.mjs's
  `bootGateTrigger`: the two `**` prefixes and the two manifests) and
  the GRAPH REGEN trigger sentence through `outside docs/,` (its
  `graphRegenTrigger`: the suffix list and the comma) — and both
  openers, which `standingGates` in dispatch-brief.mjs enumerates.
- The DOCS GATE bullet's opener, its two printed recipe lines
  (compared LINE by line against docs-gate.mjs's header by
  docs-input-gate.spec.ts and parsed by range-rule.mjs), its
  four-column xargs matrix (range-rule.mjs), the literal `xargs`, the
  names `tools/e2e/scripts/docs-gate.mjs` and `docs-scan.mjs`, and
  exactly the four backticked `<command> from <dir>/` strings.
- The four naming phrases `rawBullet` demands of exactly one bullet:
  THE LANE PROTOCOL, DISPATCH FROM THE LAST CHECKPOINT, Fresh-clone
  ORDER and `PORT RULE:`; inside the lane bullet the spellings
  sub-bullet (`integration branch \`main\``, `branch
  \`task/T-NNN-<slug>\``, `worktree \`../nputer-T-NNN\``, `Created with
  \`git worktree add …\``), the `A FRESH WORKTREE HAS NOTHING
  INSTALLED` sub-bullet (`subBullet`), and the carve-out sentence
  `never a lane's to veto — exactly \`docs/STATE.md\` and
  \`docs/checkpoints\`, no more` (lane-fence.spec.ts); the PORT RULE's
  opener `PORT RULE: 1420 belongs to the human` and its `lsof` line.
- The first gotcha's stamp line `method/ formats are version-bumped
  (currently v0.1.8) and noted here.` (kit.rs, `the_one_line_carrying`)
  and THE FOUR WALKS' `currently v<METHOD_SNAPSHOT_VERSION>` placeholder
  — byte-identical.
- The PORT RULE sentence beginning *"The rule above governs the LANE's
  tooling"*, because A CITATION NAMES A SYMBOL points at it by those
  words; and every ALL-CAPS bullet opener, because
  `namedDisciplines` enumerates them (POISON DRILL and A NEGATIVE
  ASSERTION NEEDS A POSITIVE CONTROL are asserted by name).

**SENTENCES KEPT BECAUSE THEY LIVE NOWHERE ELSE** — the rule text the
landing stops on, bullet by bullet, so the verifier can check the claim
rather than take it: POISON DRILL's eleven-shape catalogue with each
TELL and REMEDY (the ordinals are minted here and cited by number
elsewhere), the CARGO_TARGET_DIR arm (c) and its `touch`-every-`.rs`
recovery, the scratch-identity stem rule, the clock-restore seconds
form and the fixed-point rule; the DOCS GATE's exit-2 shapes, the
`lint:docs` "I was not asked" reading, the two-arm derivation shape,
the frontmatter half and the `.nputerignore` decision; THE LANE
PROTOCOL's four hook answers, the seat-with-no-lane arm, the carve-out
criteria, the mid-merge criterion, the close-before-the-lane window and
the guard's stated limits; the CI bullet's two divergences, the
first-step and docs-gate ordering reasons, every LOCAL_ONLY disposition
(each named command must appear backticked there or workflow-parity
reds), the middle-dot rule and the three silent shapes; the tools/e2e
bullet's four-code legends (boot check, orphan drill, token lint) and
the seven-file plant hazard; the method gotcha's two bump tests, the
three-file commit with its ordered asserts, the banking-table pin and
the fourth thing; GRAPH REGEN's wider-than-the-walk rule, checkpoint
timing and lane-never-updates-the-pins rule; the DISPATCH bullet's
reason-versus-letter reading; the MAIN CHECKOUT's trigger sets, process
anchor, fresh-install channel, detect-and-refuse form, symlinked-dist
hazard, no-`git add -A` rule and @human's ruling with its quoted
criteria; HEALTH BANDS' four codes with 3-over-1 precedence, what the
checkpoint owes, the graph band's ownership and the CI disposition;
METHOD EVAL's two sets, replay caveat, selftest control and the cargo
hole; the PORT RULE's backtick-in-a-shell-string hazard, the
TIME_WAIT/`lsof` authority and the IPv6-only listener fact; A CITATION
NAMES A SYMBOL's three miss causes and the `file --mime` caveat; THE
SHIPPED PARTITION's four clauses with the C-11 REACHES chain as the one
worked example; THE FOUR WALKS' table and the live-readers shape; and
every smaller Gotchas bullet's rule sentence. Every measured instance
these used to carry is now a citation: the card, the checkpoint record
or `git show 3170247:docs/CONVENTIONS.md`.

**ONE CORRECTION IN PLACE, per ADR-019 §Scope**: the CI bullet opened
with *"dormant until the repo's first GitHub push"* while GRAPH REGEN's
own bullet recorded that push as 2026-08-29; it now reads ENFORCING
since that date. Nothing else was reworded against its meaning; a
column-zero `- ` was never introduced inside a bullet (T-111-s12 — the
splice tool refuses one), and the column-zero bullet count is 56 at
base and tip.

**THE POSITIVE CONTROL** (two of them), in the detached scratch
worktree `<scratchpad>/nd-T-236` at `d01b24f` with
`CARGO_TARGET_DIR=<scratch>/target` (2.4 GB built there; the lane's
own `app/src-tauri/target` mtime stayed at 01:18:24 while the drill's
read 01:55:47), one side mutated each time — the DOCUMENT — and the
reference `git show d01b24f:docs/CONVENTIONS.md | shasum -a 256` =
`f5c35536b445a3bf04f4f0861af4b78e871433dfc6abb17639ae9776f6c81861`:

- A — `docs/checkpoints` cut from the carve-out sentence:
  `npx playwright test tests/lane-fence.spec.ts` (NPUTER_E2E_PORT=25236)
  exit 1, **✘ "the carve-out set this hook holds is the one
  docs/CONVENTIONS.md publishes"** — *the hook's carve-outs and the
  page's have drifted*, 1 failed / 52 passed; restored with
  `git restore --source=d01b24f --staged --worktree -- docs/CONVENTIONS.md`,
  sha256 equal to the reference, `git diff --stat` empty.
  **Disclosed**: the first attempt's perl pattern assumed a line wrap
  the final text does not have, the mutation was a no-op and the spec
  passed (53/53) — caught by reading the mutation back before trusting
  the green, which is the POISON DRILL's own rule; the second attempt
  guarded on a non-empty diff.
- B — the stamp moved to `(currently v0.1.9)`, the Rust const
  untouched: `cargo test snapshot_version_matches` exit 101, **✘
  `agent::kit::tests::snapshot_version_matches_the_live_method_stamps`**
  — *docs/CONVENTIONS.md's first gotcha no longer says 'currently
  v0.1.8'*; restored the same way, sha256 equal, diff empty.

**READERS AFTER EVERY PASS** (NPUTER_E2E_PORT=15236, from tools/e2e):
the eight CONVENTIONS reader specs by name — brief, dispatch-order,
docs-input-gate, gate-run, lane-fence, push-guard, range-rule,
workflow-parity — **282 passed, exit 0** at `4229b64`, `261a7aa`,
`b7b391f` and `d01b24f` (pass 3's run was folded into pass 4's), and
`cargo test snapshot_version_matches` **ok** at each; `npm run
lint:docs` exit 0 and the brief oracle exit 0 after every splice.

**THE FINAL READINGS AT `e89d67f`** (the tip before this notes commit;
the merge forecast against `main` at `aad0cf7`, `git merge-tree
--write-tree` exit 0, three paths: docs/CONVENTIONS.md, ADR-019,
docs-scan.mjs): `brief.mjs --task T-236 --state --dispatch` 0 ·
`npm run lint:docs` 0 (budgets hold, 4 gated) · `npm run health` 3
(designed — 4 UNKEPT; 6 inside, 1 drifting = STATE at 2.74%, 0
BREACHED; CONVENTIONS' headroom is 29,376 bytes = 20.0% of its warn
line, derived from `wc -c` and `DOC_BUDGETS`, inside the band) ·
`npm run typecheck` 0 · `npm run lint:tokens` 0 ·
`npm run capabilities:check` 0 (no test name moved) · DOCS GATE on the
forecast **1 = FIRES**: `cargo test from app/src-tauri/` and `npm test
from tools/e2e/` (CONVENTIONS ← 11 readers, the census nine plus the
two whole-docs walkers; ADR-019 ← the two walkers) · `index --check`
0 CURRENT (GRAPH REGEN not owed: no `.ts/.tsx/.js/.jsx/.rs` in the
forecast — a `.mjs` under tools/ is neither) · `node
tools/method-evals/run.mjs` 0 (METHOD EVAL not owed; a courtesy reader
check, see T-236-s3) · lib/parser `npx vitest run` 0 (349) and
`npx tsc --noEmit` 0 · `gate-run parser` GREEN 349 · `gate-run app`
GREEN 1131 · `gate-run rust` **RED**, 631 bodies, 18 targets, exit
101 — two nputer-index bodies, both `PermissionDenied (os error 13)` writing tracked fixtures the physical layer made read-only: `a_cycle_planted_into_a_fixture_reds_the_real_process_and_is_named_as_a_path` (tests/cli.rs) and `incremental_reindex_after_an_edit_matches_a_fresh_index` (tests/common/mod.rs) — T-216-s4's two, named by `cargo test --no-fail-fast` (exit 101; 16 of 18 targets ok, 629 of 631 bodies green; `snapshot_version_matches_the_live_method_stamps` ok in the same run) · `gate-run e2e` **RED**, 535 bodies, exit 1 — 3 failed / 532 passed (6.9m), every red a write to a tracked file outside this fence under the read-only arming, T-216-s4's class: token-scan.spec.ts *one runtime-built control byte reds all seven first-party roots at exact byte offsets* (EACCES on app/package.json), token-scan.spec.ts *P6 reds a planted bare motion utility and leaves its motion-safe twin alone* (EACCES on tools/e2e/fixtures/shell.ts — a body the dispatch note did not name, same cause), and lane-lock.spec.ts *POSITIVE CONTROL — the protocol's own writes all still succeed under the layer* (method/roles/executor.md not writable); the eight CONVENTIONS readers were green inside that run. BOOT GATE not owed (no
`app/src/**`, `app/src-tauri/**` or manifest in the forecast), so
`npm run boot:check` and the orphan drill were not run; `npm run
tauri dev`/`tauri build`, `index --watch` and `npm run capabilities`
(the generator; `--check` says CURRENT) were not run for the reasons
the CI bullet legends. `cargo audit` exit 0 — 473 crates, 0 vulnerabilities, 17 allowed warnings, the AUDIT GATE POLICY's baseline shape.

**AFTER THIS NOTES COMMIT** the merge forecast gains four flat `docs/tasks/T-236*.md` files, so the DOCS GATE's answer widens to the parser, app and e2e suites; those readings are taken at the tip and carried in the handoff report rather than here, and the verifier re-derives at its own ref.

**FILED, NOT DONE** (status: suggested, `suggested_by: executor
claude-fable-5-1@subagent @T-236`): T-236-s1 (the Rust brief's row 4
reads `method/lane-protocol.md` as the integration branch — measured
at base and tip, out of fence in C-15, T-057's class), T-236-s2
(`DOC_BUDGETS`' `landed` and the warn/fail arithmetic have no keeper —
ADR-019 Law 2's class), T-236-s3 (tools/method-evals copies
CONVENTIONS live into its fixture and the census cannot see it —
T-086's class). Noted without a card: T-162-s2 (planned) still owns the
module doc-comment in docs-scan.mjs that says `× 1.25` without the
floor, and STATE's warn row (8465 against addendum 5's 8825); only the
CONVENTIONS row was touched here.

**FOR THE VERIFIER.** The pin set is derived, not listed: re-run
`node tools/e2e/scripts/docs-gate.mjs --census` at your ref, grep each
named reader for its literals, and diff the six byte-identical bullets
against `3170247` with the awk extractor the notes' scratch script
used (`/^- <opener>/` to the next column-zero `- ` or `## `). The
strongest attack is a second copy of a naming phrase or a phrase lost
in a reflow — `brief.mjs --task T-236 --state --dispatch` exits 3 on
either, and it exited 0 after every pass. The stale-census check is
CURRENT because no test name moved.

### REJECTION 1 FIX, 2026-09-02 — fresh executor claude-opus-5@subagent

Fix commit **`fc54028`**, lane `task/T-236-conventions-compaction-two`,
on top of the verifier's `0c729cc`. I am not the author of the rejected
work; V-236's verdict is this pass's spec.

**THE FINDING, MET.** F1 against criterion 3: the LANE PROTOCOL bullet
cited *"T-089's card holds the census at `4d2f03c`"*. Re-derived rather
than assumed, `git grep` from the lane root over docs/tasks/ — T-089's
card: `69 branches` **0**, `37 the older` **0**, `tNNN` **0**, `cutover`
**0**, and `4d2f03c` **22** because it is that card's own base commit,
which is exactly how the sentence survived: the REF was right and only
the ATTRIBUTION was wrong. T-110-s2: `69 branches` **2**, `37 the older`
**1**, `tNNN` **3**, `4d2f03c` **1**, carrying *"derived at `4d2f03c`, 69
branches — 31 `task/T-NNN-…`, 37 the older `tNNN-…`"* verbatim. Shown
capable of failing first: the same needles match
`git show 3170247:docs/CONVENTIONS.md` (1/1/1), so the zeros are a real
absence. Remedy applied: one card id, two lines re-wrapped, **+3 bytes**,
no column-zero `- ` introduced (T-111-s12); column-zero bullets **56** at
`3170247`, at `560bac3` and at `fc54028`.

**THE SWEEP** (A FIX NAMES ITS CLASS AND ITS SWEEP). Class: every
citation this compaction ADDED. Derived rather than read off the verdict
— both texts collapsed past the ~70-col wrap, sentences set-differenced,
holder assertions kept: **13**, wider than the verdict's six. One
`git grep` per citation, recorded even where empty. **Twelve hold**:
T-092 (the four-lane census, and it names T-110's overwritten driver and
results files), T-052 twice (nine itemised instances plus the tenth of
2026-08-24; and the MAIN CHECKOUT bullet does carry `../nputer-app`'s
account), T-093 at `bc2d82a`, T-013 (336/33/3 exit 101 with the drill
worktree deleted, and the stale-binary direction), T-159's card and
`docs/checkpoints/2026-08-30-T-159.md`, the 2026-08-27 record, T-153-s5
(both libuv bounds), T-216-s5, the RANGE RULE cross-reference (T-027's
`dc3ef5b` as the oldest evidence, TWELVE distinct merges, **8**
BOOT-GATE-side flips against the citation's *"eight of them this
gate's"*, 5 GRAPH REGEN-side), and both preamble citations. **One was
wrong** — the finding, repaired here.

**ONE RESIDUAL, NAMED RATHER THAN SMOOTHED OVER.** The v0.1.7 line cites
`docs/checkpoints/2026-08-27-adr019-compaction.md` for what that version
moved. The record holds the bump as *"Phase 7 — method/docs-protocol.md,
bump 0.1.6 -> 0.1.7"* and the `T-138-s2` discharge, but not the base's
two finer clauses (the integrator's record-first checkpoint sequence, the
adapter template's capabilities census): `record-first` **0**, `adapter`
**0** on that record. It is a genuine holder and not an exhaustive one,
and the same bullet names `method/` at that tag as the AUTHORITY, so I
read it as within the changelog law rather than as a second F1 — recorded
so the next compaction inherits the judgement rather than re-deriving it.

**MY OWN MISS, DISCLOSED.** Two sweep needles first returned FALSE ZEROS
by spanning the hard wrap — this document's own miss-cause THREE — and
were re-run against the collapsed text. Recorded because an unrecorded
miss reads as an absence.

**PROOF, every exit read from `$?` unpiped.** `wc -c
docs/CONVENTIONS.md` **117,502 at `560bac3`** → **117,505 at `fc54028`**,
against warn 146,878 / fail 176,253; `DOC_BUDGETS` untouched, since
`landed` is recorded data no reader byte-compares. The eight reader specs
from tools/e2e at `NPUTER_E2E_PORT=15236` (lsof'd to zero rows first;
1420 never probed): **282 passed, exit 0** — the executor's own count at
every pass. `cargo test snapshot_version_matches` **exit 0**,
`snapshot_version_matches_the_live_method_stamps` ok. `npm run
lint:docs` **exit 0**, budgets hold, 4 gated.

**WHERE THIS PASS'S DISPATCH WAS WRONG.** It said `brief.mjs --task T-236
--state --dispatch` exits 0. It exits **1** here, on three
fence-disjointness findings among the live lanes T-216-s4, T-225 and
T-236 (T-225's `tools/e2e` against T-236's
`tools/e2e/scripts/docs-scan.mjs`). Not mine, and measured rather than
assumed: **identical exit 1 with identical findings at the pre-fix tip
`560bac3`** on this machine, restored afterwards with sha256 equal to
`f795f229…e169b1d9`. It is a live board fact of the machine-scoped class
lane-protocol rule 4 names, zero NOT DERIVED rows either side, and never
the pin-break code 3 — the four naming phrases still resolve to exactly
one bullet each and every lane row still derives from the bullet I
edited.

## Verdicts

### V-236, 2026-09-02 — claude-opus-5@subagent, independent — REJECTED

Measured in a detached bench at `560bac3` (`../nputer-V-T-236`), installed
by the fresh-clone ORDER, `NPUTER_E2E_PORT=25236`. Every figure below is
mine, re-derived rather than read from the report. **My blindness was
CLOCK-SHAPED**: the bench was cut with the lane, so phase 1 ran before any
diff existed and the attack set was hashed before the work was reported
(`attack-V-T-236.md`
`e1e28710620e19d464ced9ce9fb206de54e8e303a2c2d15c1377bfbc5c0c10fa`,
`ground-V-T-236.md`
`68d37dea23d2f54b90b56704ff49079f301ca4f40b885a80e003b1dc7e3eef56`,
stamped 2026-09-01T22:22:55Z).

**ONE BLOCKING FINDING, AND IT IS THE ONE THIS CARD EXISTS TO REFUSE.**

#### F1 — criterion 3: a moved instance cited to a card that does not hold it

THE LANE PROTOCOL bullet, at the tip:

    **BOTH BRANCH SPELLINGS ARE LIVE IN THIS REPO and the older `tNNN-…`
    one is not a mistake to fix**: the two sets overlap rather than succeed
    each other, so there is no cutover id to cite — derive the pair at your
    own ref (T-089's card holds the census at `4d2f03c`).

The base held the census inline: *"derived at `4d2f03c`, 69 branches — 31
`task/T-NNN-…`, 37 the older `tNNN-…`"*. Moving it is correct — it is an
INSTANCE. **The target is wrong.** Reproduce:

    C=docs/tasks/T-089-the-dispatch-brief-is-a-written-artifact.md
    wc -c $C                                    # 98113
    grep -c -F "69 branches" $C                 # 0
    grep -c -F "tNNN" $C                        # 0
    grep -c -F "37 the older" $C                # 0
    grep -c -F "cutover" $C                     # 0

Expected: T-089 holds the census. Actual: it holds none of it. `4d2f03c`
appears on that card 22 times because it was **T-089's own base commit** —
which is exactly how this half-right sentence survived: the REF is correct
and only the ATTRIBUTION is wrong.

**The holder is `docs/tasks/T-110-s2-the-older-branch-spelling-reads-as-not-a-lane.md`**,
which carries *"69 branches — 31 `task/T-NNN-…`, 37 the older `tNNN-…`"* at
that same ref. Swept with a positive control — the same needle matches
`git show 3170247:docs/CONVENTIONS.md`, so the empty results above are a
real absence and not a broken search.

**Remedy: name T-110-s2.** Nothing is lost — the instance is on that card
and in the pre-compaction ref the new preamble already publishes — so this
is one citation, not a hazard. It is nonetheless a literal failure of the
criterion that says a citation must point at what *holds* it, and it was
the first attack in the stamped set. Of the six handoff citations this
landing adds, five were verified to hold: T-093 (`bc2d82a`, the control-byte
measurements — 9 hits), T-092 (the four-lane scratch census), T-052 (the
ten instances), T-159's card and `docs/checkpoints/2026-08-30-T-159.md`
(present), and the preamble's `git show 3170247:docs/CONVENTIONS.md`
(resolves).

**EVERYTHING ELSE VERIFIED. The pins held completely, and I attacked them
with the programs rather than by eye.**

- **Derived output byte-identical, base vs tip**, which is the strongest
  form of criterion 2 available: `parseRangeRule` (3,700 chars),
  `bootGateTrigger`, `graphRegenTrigger`, `parseDocsGateRecipe` (1,050
  chars, the two recipe lines and the whole four-column matrix). The RANGE
  RULE bullet is byte-identical outright.
- **The four per-package command lists identical** (4 / 5 / 7 / 9 commands,
  middle-dot structure intact). The DOCS GATE bullet's four-suite set
  identical; its `MEANS *I WAS NOT ASKED*` legend still occurs once; the
  `app/src-tauri` exit legend identical; the printed recipe still equals
  `docs-gate.mjs`'s header lines 9–10.
- **All 13 uniqueness-pinned phrases resolve to exactly one bullet**, the
  `85dda6d` class ruled out in both directions — and `brief.mjs --state`,
  `--dispatch` and `--task T-236` all exit **0** with zero NOT DERIVED rows.
  `laneSpellings` returns the identical five values.
- **The version stamp line is byte-identical** (sha256
  `c5738e37…d135d3` both sides) and `formats are version-bumped` still
  occurs on exactly one LINE — the line-scoped half of that pin, which a
  reflow alone would have broken.
- **56 bullets before, 56 after, same order, same identities**; only two
  opening lines reworded, neither pinned. No column-zero split.
- **Zero new dangling citations**: 40 cited ids have no card file and all 40
  were already cited at the base.
- **Every mechanism under the 23 deleted headline capitals survives** —
  libuv/microsecond, stale-binary pollution, `<scratch>/target` indexing,
  shape six's failing-body-count-of-ONE procedure, the fence carve-outs,
  the NUL/`file --mime` pair, the detached-entry rule, `CACHEDIR.TAG`.
- **ADR-019: 74 insertions, 0 deletions** — appended as addendum 6, not
  edited. `DOC_BUDGETS` re-derived correctly: `landed 117502`,
  `warn = ceil(117502 + max(2053, 29375.5)) = 146878`,
  `fail = ceil(117502 × 1.5) = 176253`; `d01b24f` resolves to 117502 and
  CONVENTIONS did not move after it. **I pre-committed in phase 1 that this
  criterion is DEGENERATE for this document** — the floor binds only below
  4F = 8,212, so the retired `× 1.25` spelling yields the same integer — so
  I judged the stated derivation, and the comment names the floor *and* its
  inertness. STATE's `warn: 8465` and the `× 1.25` doc comment were
  correctly left alone: that disagreement is deliberate and is T-162-s2's.
- **Security sweep** (short, but `docs-scan.mjs` is code): the diff there is
  7 lines and touches only the CONVENTIONS entry plus its comment.
  `Object.freeze` intact, entry shape intact, no `null` entry, no guard
  relaxed — `conventionsBullet`'s `!== 1` throw is untouched. No dependency
  movement, no secrets, no new input path. `lint:tokens` clean (TOKEN 173
  files, CONTROL 1118) — no control byte from a bulk rewrite.

**BATTERY at `560bac3`, read unpiped from the blessed runner:**

    parser  exit 0  bodies 349   GREEN
    app     exit 0  bodies 1131  GREEN
    rust    exit 0  bodies 631   GREEN     <- kit.rs's stamp pin passes
    e2e     exit 1  bodies 535   534 passed, 1 failed
    lint:docs 0 · lint:tokens 0 · capabilities:check CURRENT · health 3 (by design)

**The single e2e red is NOT this diff's, and I attributed it myself rather
than accepting it**: `lane-lock.spec.ts:812 › the DISPATCH STEP arms it`
fails **identically at the base `3170247`** in the same bench (`npx
playwright test tests/lane-lock.spec.ts:812` → exit 1 at both refs). It is
the physical-layer/T-216-s4 class. The docs gate on the merge's diff exits
**1 = has a verdict**, naming the four suites; all live card frontmatter
parses, including the three new suggestions; the census still names 28
readers, so nothing dropped out.

**Health:** the CONVENTIONS headroom band moves from **2.65% (drifting,
0.65 points off breach)** at the base to **INSIDE** at the tip — 6 inside /
1 drifting against 5 / 2. Noted rather than credited: after any re-derived
landing that band reads 20% by construction.

**MY OWN DRILLS, one side only, document mutated and never the reader's
literal, each read back from `git diff` before the suite ran:**

    D1  drop the trailing slash from `npx vitest run from lib/parser/`
        -> docs-input-gate.spec.ts:674 "the DOCS GATE bullet names exactly
           the commands the derivation produces"        1 failed / 42 passed
    D2  RANGE RULE PATH-FOR-PATH cell **29** -> **28**
        -> range-rule.spec.ts:91 "scoreboard-path-for-path", erroring
           "doc says 28 of 31, git says 29 of 31"        1 failed / 24 passed

Kill count ONE each, and **neither kill set contains the other**. Both aim
at the site the property lives, and D1 aims at the sentence my phase-1 set
named as the likeliest well-intentioned red — the transcribed four-suite
list that ADR-019 rule 5 appears to license cutting. It was kept. Restored
both times with `git restore --source=560bac3 --staged --worktree --` and
proved by sha256 against `git show HEAD:` —
`f5c35536b445a3bf04f4f0861af4b78e871433dfc6abb17639ae9776f6c81861` both
sides, working tree clean.

**ON THE BAR, WHICH I JUDGED AS THE CARD ASKS AND NOT BY THE NUMBER.**
160,043 → 117,502 is **−42,541, −26.58%**, against a one-third bar of
≤ 106,695 — short by 10,807. My phase-1 ground truth predicted exactly this
before the diff existed, on the arithmetic that the largest bullet with no
reader is 23,231 bytes against a 53,348-byte bar, and pre-committed that
*"a report that stops short of a third, naming the pinned sentences that
hold it, is a PASS on C4."* The stop-short is invoked, argued in addendum 6
and accounted bullet by bullet. **The accounting is honest**: the addendum
declines the easy excuse, saying the pins hold only ~17.6 KB and that what
actually stops the cut is rule 6. Addendum 6 also restates the runway cost
against itself — 46,891 bytes of headroom against the old line, 29,376
against the new — which is addendum 4's uncomfortable half applied to this
landing rather than quietly omitted. I checked for the failure mode that
would have made the shortfall dishonest — a rule cut to reach the number —
and found none: every rule, tell, remedy, legend and poison ordinal is
present.

**WHAT THE CARD ITSELF GOT WRONG, recorded because the next compaction
inherits it and it is not this lane's failure.** The card's *What stays,
byte for byte* list omits two bullets that `range-rule.mjs` parses with
hard throws — `BOOT GATE (T-046` (its trigger, two globs and the manifest
clause) and `GRAPH REGEN (T-009-s1` (its trigger, where the comma after
`outside docs/` is load-bearing) — and under-states the DOCS GATE bullet,
which is pinned by `range-rule.mjs` as well as `docs-input-gate.spec.ts`. A
lane working from that list alone could have redded the suite lawfully.
**This executor did not**: both triggers derive identically at the tip.
Filed as T-236-s4.

**Re-run after my own writes** (verifier.md step 7 — this verdict and the
suggestion are commits, and prose is a code input here): recorded in the
commit that carries them.


#### V-236 step 7 — the gates my own commits could move, re-run at my own tip

Verdict and T-236-s4 committed at **`dd0b1c9`**; battery re-run there in
the same bench. Figures stated with their ref, since my own commits moved
the thing they count.

    parser 349 GREEN · app 1131 GREEN · rust 631 GREEN · e2e 531/535
    lint:docs 0 · lint:tokens clean (CONTROL 1119, +1 = my card) ·
    capabilities:check CURRENT · health 3 (designed)

**Four e2e reds at `dd0b1c9`, none of them mine, and I measured that
rather than assuming it.** `lane-lock.spec.ts:812` fails at the base
`3170247`. The other three — `card-preflight.spec.ts:670`,
`checkout-currency.spec.ts:852` and `:953` — fail **identically when re-run
alone at `560bac3`**, the very ref where the full battery had them green an
hour earlier. Same tree, opposite answers: the variable is the MACHINE, not
the commit. `checkout-currency` sweeps the host's worktree list and asks
which checkouts load current guards, so it moves when a bench is
re-detached or a lane gains a commit — lane-protocol rule 4's machine-scoped
class, and STATE's *"THE HOST'S WORKTREE LIST DIFFERS TOO"*. Recorded
because the honest reading of a body that flips at a fixed ref is
"environment", and an integrator re-running this will see them too.

**ONE BAND MOVED AND IT WAS MINE.** `triage/live-suggestions` goes 20 → 21
cards and crosses its 20 drift line (breach is 40) — T-236-s4 is the 21st
live suggestion. Disclosed rather than left for the checkpoint to
attribute: the band is a REPORTER, the crossing is arithmetic, and the
remedy is triage, not this lane. The docs-headroom bands are unchanged by
my commits; CONVENTIONS' stays inside at 20.0%.

**CONTAINMENT ACROSS ALL FOUR DRILLS ON THIS CARD**, judged after reading
the notes: the executor's A (`docs/checkpoints` cut from the carve-out
sentence → `lane-fence.spec.ts` *"the carve-out set this hook holds…"*, 1
of 53) and B (stamp → `v0.1.9` → `cargo test`
`snapshot_version_matches_the_live_method_stamps`, exit 101), and my D1
(`docs-input-gate.spec.ts:674`, 1 of 43) and D2
(`range-rule.spec.ts:91 scoreboard-path-for-path`, 1 of 25). Four
singleton kill sets in four different readers across two languages;
**no kill set contains another**, so all four are load-bearing and none is
a restatement. The executor's disclosure that its first attempt at A was a
silent no-op — a perl pattern assuming a wrap the text does not have, spec
green at 53/53, caught by reading the mutation back — is the POISON DRILL's
own rule self-applied, and it is the reason to believe the second attempt.

### V-236 re-verdict, 2026-09-02 — claude-opus-5@subagent, independent — APPROVED

Re-verified at **`fc0521b`** in the same bench, `NPUTER_E2E_PORT=25236`.
**I have not read the fix pass's notes or its commit messages** — the
checkout was made quietly for that reason — and this entry was drafted
from the diff, my own stamped phase-1 set and my own re-runs.

**THE FINDING IS REPAIRED, AND I RE-RAN THE AUDIT THAT FOUND IT RATHER
THAN THE CLAIM THAT IT WAS FIXED.** The LANE PROTOCOL bullet now reads
*"derive the pair at your own ref (T-110-s2's card holds the census at
`4d2f03c`)"*. `T-089's card holds` occurs zero times in the document.
`docs/tasks/T-110-s2-the-older-branch-spelling-reads-as-not-a-lane.md`
carries *"69 branches — 31 `task/T-NNN-…`, 37 the older `tNNN-…`"* and
`4d2f03c` verbatim, so the citation now points at a holder. Citation
audit re-derived at this ref: 145 cited ids, three of them new since the
base (`T-110-s2`, `T-216-s5`, `T-236`), and **zero new dangling
citations** — the 40 ids with no card file are the same 40 the base
already cited.

**THE REPAIR IS THE REPAIR AND NOTHING ELSE.** The document diff is four
lines (2 − / 2 +), **+3 bytes, 117,502 → 117,505**. ADR-019 and
`docs-scan.mjs` are untouched since the landing (`git diff 560bac3..fc0521b`
over both is empty). Re-run against the base `3170247`:
`parseRangeRule`, `bootGateTrigger`, `graphRegenTrigger` and
`parseDocsGateRecipe` still produce **byte-identical** output; the four
command lists identical (4/5/7/9); the DOCS GATE four-suite set, its
`I WAS NOT ASKED` legend and the push-guard exit legend identical; all 13
uniqueness-pinned phrases resolve to exactly one bullet; `laneSpellings`
returns the same five values; 56 bullets, same order; and the stamp line
is still sha256 `c5738e37…d135d3` with its anchor on exactly one line.

**THE RE-WRAP LANDED INSIDE THE LANE PROTOCOL BULLET, SO I DRILLED
THERE** rather than re-using a drill aimed somewhere the repair never
touched. D3, document side only, read back from `git diff`: `worktree`
→ `lane worktree` in the spellings sub-bullet.

    node tools/e2e/scripts/brief.mjs --task T-236   -> exit 3
    dispatch-brief: the lane bullet spells "worktree" followed by a
    backticked name 0 times, expected exactly one.

That is the negative-lookbehind pin my phase-1 set predicted (mutant M3),
alive at this ref and undeadened by the re-wrap. Restored with
`git restore --source=fc0521b --staged --worktree --`, sha256
`f795f229d55a5348c8b90bc3962a92b50ea97e2f7a681f67faf2d3b1e169b1d9`
both sides, tree clean.

**AND D3 IS WHAT SETTLES `brief.mjs`'s EXIT 1.** `--state` 0,
`--dispatch` 0, `--task T-236` **1**, with 13 rows and zero NOT DERIVED.
A pin break in that bullet is exit **3**, as D3 just demonstrated, so an
exit of 1 is a VERDICT and not a broken derivation — this project's own
four-code legend, checked rather than quoted. I verified the finding's
cause independently instead of taking it on report: line 55 of the brief
reads *"T-225 and T-236: OVERLAP — T-225 tools/e2e against T-236
tools/e2e/scripts/docs-scan.mjs"*, and

    git show fc0521b:docs/tasks/T-225-….md | grep '^touches:'  -> [tools/e2e]
    git show 2dbf2dc:docs/tasks/T-225-….md | grep '^touches:'  -> six explicit
        paths (dispatch-order.mjs, dispatch-brief.mjs, brief.mjs and their
        three specs) — none of them docs-scan.mjs

The overlap exists only against the **pre-narrowing copy of T-225's card
this branch inherited from its base**. On `main` the two fences are
disjoint. That is ref skew of the machine-and-ref-scoped class my phase-1
ground truth named, not a collision and not this card's.

**READERS AND GATES AT `fc0521b`.** The eight CONVENTIONS reader specs by
name — brief, dispatch-order, docs-input-gate, gate-run, lane-fence,
push-guard, range-rule, workflow-parity — **282 passed, exit 0**, which
is the executor's own figure reproduced. `lint:docs` 0 (frontmatter clean,
budgets hold, 4 gated) · `lint:tokens` clean (CONTROL 1119) ·
`capabilities:check` CURRENT · `health` 3 by design, with
`docs-headroom/docs/CONVENTIONS.md` **inside**; the two drifting bands are
STATE (pre-existing, 2.74%) and `triage/live-suggestions` at 21, which is
**mine** — T-236-s4 — and already disclosed above.

**ON `DOC_BUDGETS` LEFT AT 117,502 AGAINST A 117,505-BYTE FILE: THAT IS
RIGHT, AND MOVING IT WOULD HAVE BEEN WRONG.** Three reasons, in the order
that decides it.

1. **`landed` is the tripwire's BASELINE, not a mirror of the file.** The
   budget measures growth SINCE the landing; every later commit makes the
   file diverge from it, and that divergence is the mechanism working.
   Resetting `landed` to 117,505 would move `warn` from 146,878 to
   **146,882 — a LOOSER line** — to absorb three bytes of post-landing
   growth. That is the keep-absorbing behaviour ADR-019 addendum 4
   rejected in as many words, and it would be the gate swallowing exactly
   the kind of change it exists to see.
2. **The recorded measurement is still TRUE at the ref it names.**
   Addendum 6 stamps `git cat-file -s d01b24f:docs/CONVENTIONS.md`, which
   still returns **117502**. A past reading bound to a named occasion is
   HISTORY and cannot go stale — this document's own rule, applied to
   itself. Leaving it also holds the TIGHTER line, the same safe direction
   addendum 5 blessed for STATE's 360-byte disagreement.
3. **Changing it would cost an edit to an append-only record.** Addendum 6
   is a RECORD; re-deriving means either editing its table, which §Records
   forbids, or appending a seventh addendum for three bytes, which would
   put two landings on one card and make the next reader ask which is the
   landing.

Nothing byte-compares `landed` — the health band derives from `wc -c`
against `warn` — which is precisely the keeperless-figure class the lane
itself filed as T-236-s2, and which my phase-1 data mutant M8 predicted
would kill nothing. **The honest residual, stated rather than smoothed
over**: addendum 6's sentence *"re-landed at 117,502 bytes"* is three
bytes off what will actually merge. It is true of the ref it names, no
gate reads it, and the merged byte count belongs in the integrator's
checkpoint record, which is where the final measurement is available
anyway. Not a finding.

**VERDICT: APPROVED.** The one criterion-3 failure is repaired at its
root rather than papered over, the repair is three bytes wide, every pin
I checked in the rejection still holds, and the two exits that look like
failures — `brief.mjs` 1 and the e2e reds recorded above — were each
attributed to a cause outside this diff by measurement rather than by
argument.
