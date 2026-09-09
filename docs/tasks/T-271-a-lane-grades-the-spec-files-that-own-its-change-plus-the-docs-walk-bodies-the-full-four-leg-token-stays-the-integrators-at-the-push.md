---
id: T-271
title: "The EXECUTOR grades the spec files that own its change (owning = everything that reads the changed file, derived over imports) plus the docs-walk bodies while it iterates; the verifier's one run and the integrator's run before the push stay the full four legs"
feature: F-06
milestone: 4
size: S
priority: 29
status: verifying
suggested_by: "@human, 2026-09-09: \"We need to make changes like these faster and more token efficient\" → \"file the first two\"; measured on T-224's fix passes (each seat ran the full battery: ~11 min, the e2e leg ~10 of them, for a change in one hook and one spec)"
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by:
review: independent
---

Every seat runs the whole four-leg battery, and the browser leg is ten
minutes of it, for changes whose owning spec runs in seconds. The docs
gate already derives which suites a diff owes; what is missing is a
graded reading NARROWER than a leg for lane seats, while the push keeps
its whole-battery token. The integrator's full run on merged main
before the push is what catches a cross-spec interaction, which is
that run's job and always was.

## Acceptance criteria

- WHEN an EXECUTOR runs `gate-run.mjs e2e --owning <changed paths…>`
  THE runner SHALL derive the spec files that own those paths — every
  spec that reads the changed file, directly or through imports
  (derived from the same static import graph the map is built from,
  never from the spec's name alone), plus the docs-walk bodies when a
  docs path moved — and grade ONLY those, with the same refusals (zero bodies, parts ≠
  baseline, a pipe, the wrong cwd) and a verdict line that names the
  subset and its body count — never the leg's name alone.
- WHEN a VERIFIER runs the owed suites THE runner SHALL NOT accept the
  scoped form: the verifier's one run (T-262: once, at its own tip) is
  the full four legs, so the whole battery still runs before every
  verdict; and the integrator's run on merged main before the push is
  the full four legs (the token). AMENDED 2026-09-09 at @human's
  question ("Is it sure that this doesn't make bugs more likely?"):
  as first filed the scoped form applied to both lane seats, which
  would have moved a cross-spec red — the class T-264's executor found
  four of by running everything — from the lane to merged main, where
  the answer is the revert play. Scoping the executor's iterations
  keeps the time saved where suites run most often and loses no run
  that stands before a verdict or a push.
- WHEN the subset verdict is written THE token SHALL NOT be minted from
  it: a lane's subset run writes a `scoped` verdict the push guard
  refuses as a token, so a push still owes the integrator's full
  battery on the pushed tree.
- WHEN the owning-spec derivation cannot name a spec for a changed path
  THE runner SHALL refuse the scoped run (exit 2, naming the path) and
  say the full leg is owed — never grade nothing.
- WHEN CONVENTIONS' DOCS GATE and BLESSED RUNNER bullets are read THE
  spelling SHALL say which seats run the scoped form and that the
  integrator runs the full battery last; the executor's and verifier's
  briefs (row 7) SHALL carry the scoped spelling.
- A body SHALL show the scoped run red on a planted defect in the
  owning spec's subject and green on the pristine hook; a second body
  SHALL show the push guard refusing a `scoped` verdict as the token.

## Implementation notes (executor, 2026-09-09, lane task/T-271-scoped-e2e-leg-by-spec-file from cc41ff3)

**What moved.** `tools/e2e/scripts/gate-run.mjs` gains an owning-spec
derivation and one CLI arm; `tools/e2e/tests/gate-run.spec.ts` gains ten
bodies; `docs/CONVENTIONS.md` gains the spelling in two bullets.

**The derivation, and why it is shaped this way.** `owningSpecs` is a
PURE function of three named inputs — `changed`, `reach` (the static
import graph) and `docsReadersByPath` — so T-280 can hand it a
DIFF-derived path set without touching the rule, which is what that
card's blocker asked for. `specFiles`/`specReach` are the readings;
`deriveOwning` composes them; `scopedSuite`/`scopeVerdict` render. A
spec OWNS a path when it IS that path, when it reaches it over static
imports, or, for a docs path, when the DOCS GATE's OWN reader map
(`docs-scan.mjs`) names a reader that this spec is or reaches. The two
arms COMPOSE rather than duplicate: `docs/CONVENTIONS.md` is read by
`tools/e2e/scripts/cli.mjs`, which is not a body, and the spec that owns
THAT is the one importing it. Nothing reads a spec's NAME; the fixture
in the new bodies makes that measurable rather than asserted, with a
stem-sharing stranger whose one body always fails.

**Every failure ends at a refusal, and only in one direction.** An
unplaceable path, an unresolvable import edge, an empty path list, a leg
that is not `e2e`, a derivation that named no spec — all exit 2, naming
the cause and saying THE FULL e2e LEG IS OWED, before anything is
spawned and before a token is written. The scoped form can be wrong by
running too MUCH; it may not be wrong by running too little.

**The token.** The subset's verdict word is `SCOPED-GREEN` or
`SCOPED-RED`, written under the leg's own `e2e` key. `judgeToken`
accepts exactly the string `GREEN`, so the existing shape rules already
refuse it — NO EDIT TO `.claude/hooks/gate-token.mjs` WAS NEEDED, and a
body pins the refusal in both words with a four-green control that must
pass first. A scoped run therefore POISONS a stale green rather than
leaving one standing.

**The read cost, measured at cc41ff3 before the first edit** (per file,
`wc -c` over exactly the slices opened):

    brief-T-271.txt                    52604   whole
    docs/tasks/T-271-….md               3574   whole
    docs/STATE.md                       8322   whole
    docs/ROADMAP.md                    11878   whole
    docs/ARCHITECTURE.md                9300   whole
    docs/CAPABILITIES.md                4996   the gate-run section
    docs/CONVENTIONS.md                12110   two bullets, by heading
    tools/e2e/scripts/gate-run.mjs     42107   whole
    tools/e2e/tests/gate-run.spec.ts   12972   header, CLI and pin bodies
    .claude/hooks/gate-token.mjs       11426   writeToken and judgeToken
    tools/e2e/scripts/docs-scan.mjs    13599   six slices, by symbol
    tools/e2e/tests/docs-input-gate…    5886   the three bullet-pin bodies
    tools/e2e/tests/cli.spec.ts         2901   the two CONVENTIONS bodies
    tools/e2e/scripts/cli.mjs           1602   the gate verb entry
    tools/e2e/scripts/range-rule.mjs    2422   parseDocsGateRecipe
    tools/e2e/preflight.ts              2549   the port rule
    playwright.config/package/tsconfig  4727   whole
    TOTAL BEFORE THE FIRST EDIT       202975

A further 17453 bytes were read AFTER the first edit while checking the
row-7 question and the document's pins (`dispatch-brief.mjs` 5665,
CONVENTIONS' tools/e2e command bullet 1521, `docs-scan.mjs`
`conventionsBullet` 1865, this spec's token helpers 8402) — 220428 in
all. **The CONTEXT PACK is what made this affordable**: 13631 bytes of
docs/CONVENTIONS.md were opened out of 131472, 10.4 per cent, and every
bullet opened was one the pack named.

**The byte band, recorded.** `docs/CONVENTIONS.md` moved 131472 to
133574 bytes against ADR-019's landed 117502 / warn 146878 / fail
176253; the docs gate prints `governing-document budgets hold — 4 gated,
0 awaiting their compaction landing`. Headroom under the warn line is
13304 bytes. NO CUT WAS MADE and the reason is stated rather than
assumed: the band holds with room, and a hand cut in this document is a
compaction (T-236's shape) where more than twenty bodies pin exact
strings — a size-S card is the wrong vehicle for it.

**A pack limit worth knowing about.** The BLESSED GATE-RUNNER bullet is
now 1603 bytes flattened against `dispatch-brief.mjs`'s
`PACK_TRANSCRIPTION_LIMIT` of 2000. Under it, the pack transcribes the
bullet VERBATIM and every assembled brief carries this card's spelling —
verified by assembling an executor brief in the lane. Over it, the pack
would cite it by address instead and the briefs would stop carrying the
words. 397 bytes of margin. T-271-s1 owns that.

**What this lane could NOT do, and it is outside the fence.** Ten spec
names were added, so `docs/CAPABILITIES.md` is STALE until
`npm run capabilities` runs from tools/e2e/ — THAT IS OWED IN THE MERGE
COMMIT and this lane's fence does not reach that file.

**Suggestions filed:** T-271-s1 (row 7 does not carry the runner's
spelling and the pack's margin is 397 bytes), T-271-s2 (`judgeToken`
calls a scoped entry "RAN AND FAILED"), T-271-s3 (no verifier brief can
be assembled at this ref), T-271-s4 (the docs census cannot see a reader
that goes through `docs-scan.mjs` itself), T-271-s5 (the scoped leg
still pays for the dev server).

## The suites, measured at 2069d22 with the tree clean (added without re-running)

Run ONCE, at the code-and-notes commit, per T-279's rule. This section
was written in a LATER commit and NOTHING WAS RE-RUN to write it.

    gate-run.spec.ts direct (SUPERTASKR_E2E_PORT=15271)  exit 0   56 passed, 14.5s reported, 15s wall
    gate-run.mjs parser                                  exit 0   bodies=389  GREEN   3s
    gate-run.mjs app                                     exit 0   bodies=1171 GREEN   8s
    gate-run.mjs e2e --owning tools/e2e/scripts/gate-run.mjs
                                                         exit 0   bodies=56   SCOPED-GREEN  14s
    gate-run.mjs e2e (the full leg)                       exit 0   bodies=774 GREEN   853s wall (14m13s; the reporter says 14.2m)

**THE COMPARISON THIS CARD EXISTS FOR: 774 bodies in 853 s, against 56 bodies in 14 s for the one spec that
owns this lane's runner change. **Sixty-one times faster, and it is the
same instrument** — same registry entry, same cd guard, same zero-body
and parts-do-not-sum refusals, same verdict line. Taken over this
lane's WHOLE diff (all nine changed paths, docs and code together) the
derivation names **13 of the 39 spec files** and takes 1.65 s to say so,
with nothing unplaceable — so even the widest reading of this card's own
change is a third of the leg. The full leg ran here beside another
lane's browser suite throughout, which the e2e-seconds band would read
as contention rather than as the suite.**

The scoped verdict line, whole:

    gate-verdict suite=e2e exit=0 bodies=56 targets=1
    ref=2069d22484dbffe99508db8d3978de432369f007 verdict=SCOPED-GREEN
    scope=tools/e2e/tests/gate-run.spec.ts
    reason=ok over 1 owning spec(s) for 1 changed path(s) — NOT the leg, and not a token

and the derivation it printed first:

    gate-run: tools/e2e/scripts/gate-run.mjs is owned by
      tools/e2e/tests/gate-run.spec.ts — imports it, directly or transitively

**The fixed cost, since the leg is now narrow enough for it to matter:**
14s wall, 13.4s inside the reporter's own window, 12.4s summed over the
56 bodies — so the dev server, node's start and the derivation together
are about 1.6s, roughly 11 per cent, on a warm worktree. T-271-s5 was
FILED claiming that share was "the larger half" and CORRECTED to this
measurement before the lane closed.

**`cargo test` was NOT run** and the reason is named: a fresh worktree
with no `target/`, and three other lanes driving browser suites on this
machine throughout. The docs gate names the rust leg because
`app/src-tauri/src/agent/kit.rs` reads docs/CONVENTIONS.md — it reads
the one line carrying "formats are version-bumped", the method version
stamp, which this diff does not touch. It is owed at the merge.

**`npm run capabilities:check` exits 1, STALE — committed 65947 bytes
against a fresh generation of 67017.** Ten spec names were added. The
regeneration is owed IN THE MERGE COMMIT and that file is outside this
lane's fence. The check wrote nothing, verified by `git status`.

## Verdicts

### 2026-09-09 — APPROVED WITH ASSIGNED CORRECTIONS — claude-opus-5@subagent (verifier, phase 2)

    attack set:    sha256:2a98412d307dc9df62170c447a6ec9f8c088ac5bb88c0647d426f766fb737684  (attack-set-T-271.md)
    ground truths: sha256:1dba3eba05419923d869ad3da2c2718d56b8cf65f7b70b410122f8ffdb7d567d  (ground-T-271.md)
    addendum:      sha256:a3ec0f8b52a75df395dd2601f2467559c5ba5de2a02d025bddbe2d84632404e1  (ground-T-271-addendum.md)

All three verified with `shasum -a 256` before any other file was opened.
Tip judged **a0ec8ad**, base **cc41ff3**, bench `../nputer-V-T-271`
detached, e2e port 25271.

**THE FRAME I ACTUALLY HAD, and it is not the clean one.** Two spawns:
phase 1 wrote the attack set tool-less by instruction at the base, and
this is a fresh phase-2 spawn that read the three sealed files first.
Two departures, disclosed rather than left for a later reader:

1. **This brief carried NO CONTEXT PACK.** It was hand-written by the
   seat, and `method/roles/verifier.md` step 0 calls a brief with no pack
   a DISPATCH FAULT whose remedy is to read `docs/CONVENTIONS.md` whole
   and say so. The brief instead directed me to read it at the base by
   the bullets I needed. I read, at cc41ff3: `docs/STATE.md` whole,
   `docs/ARCHITECTURE.md` whole, the entire **Build and test** section of
   CONVENTIONS (which carries both bullets under judgement) and the
   **DOCS GATE** bullet whole. I did NOT read the document end to end.
   That is a narrower read than step 0 prescribes for a pack-less brief,
   and I record it as mine rather than claiming the standing read.
2. **The brief's own duties section named executor-derived specifics** —
   the code-and-notes commit `2069d22`, its tree `1e4905a`, and that
   "the e2e leg there read 774 bodies GREEN on port 15271".
   `verifier.md` step 0 says a brief naming suite figures HAS ALREADY
   BROKEN PHASE 1 ABOVE THE LINE and that I say so rather than pretend I
   did not read it. I say so. The brief also flagged each as a CLAIM
   until re-measured, and I re-measured every figure I report below at my
   own tip; none of the three was carried.

Order of reading kept: the three sealed files, `verifier.md`, the base
standing set, the card at its BASE ref, the diff and the tree, then every
attack, mutant and control — and only after my findings were written, the
executor's report `report-T-271.md` and the card's notes and commit
messages.

## The suites, run ONCE at the tip judged (a0ec8ad), through the blessed runner from the bench root

    node tools/e2e/scripts/gate-run.mjs parser
      exit 0  gate-verdict suite=parser exit=0 bodies=389 targets=1 ref=a0ec8ad… verdict=GREEN reason=ok
    node tools/e2e/scripts/gate-run.mjs app
      exit 0  gate-verdict suite=app exit=0 bodies=1171 targets=1 ref=a0ec8ad… verdict=GREEN reason=ok
    node tools/e2e/scripts/gate-run.mjs rust
      exit 0  gate-verdict suite=rust exit=0 bodies=654 targets=18 ref=a0ec8ad… verdict=GREEN reason=ok
    SUPERTASKR_E2E_PORT=25271 node tools/e2e/scripts/gate-run.mjs e2e
      exit 0  gate-verdict suite=e2e exit=0 bodies=774 targets=1 ref=a0ec8ad… verdict=GREEN reason=ok

    and first, alone: npx playwright test gate-run.spec.ts
      exit 0  56 passed (17.8 s) — the 46 base body names ALL survive verbatim
              (the whole lane deletes four lines: two frontmatter fields
              and two lines that were EXTENDED, never a body)

**THE RUST LEG IS THE ONE THE LANE DID NOT RUN, AND IT IS DISCHARGED
HERE**: 654 bodies over 18 targets, GREEN, at a0ec8ad. The lane named the
omission rather than hiding it and said it was owed at the merge; it is
now measured, and what remains owed at the merge is the graph regen with
`index --check`, and `npm run capabilities` (ten new spec names, plus one
more from my own correction commit below — the census staleness at this
tip is EXPECTED and the integrator's, T-201).

**I ran the full four legs and not the scoped form** (T-262, and this
card's own second criterion). I did drive the scoped form deliberately,
as an attack — see criterion 2 below, which is where it matters.

## The fence, checked by name and not by reading the body

`git diff --name-only cc41ff3..a0ec8ad` returns nine paths and no more:
the three fenced files, this card, and five NEW suggested cards under
`docs/tasks/`. **UNTOUCHED, each verified individually**:
`.claude/hooks/gate-token.mjs`, `.claude/hooks/push-guard.mjs`,
`tools/e2e/scripts/docs-scan.mjs` (byte-identical — and NO export was
added to it: `docsGate`, `docsReaders` and `stripComments` were ALL
already exported at cc41ff3, so the reuse cost nothing outside the
fence), `dispatch-brief.mjs`, `method/roles/executor.md`, `verifier.md`,
`lane-protocol.md`, `integrator.md`, `merge.mjs`, `cli.spec.ts`,
`ci.yml`, `workflow-parity.spec.ts`. The live fences of T-278-s2, T-282
and T-283 are all clear. The method stamp inside the lane is **0.1.12**
against main's 0.1.14 — expected, and not this lane's. The stamp commit
a0ec8ad moves two frontmatter fields and nothing else. **No record is
rewritten**: CONVENTIONS is 30 insertions and ZERO deletions, and both
bullets are EXTENDED with every base clause intact.

## Every criterion, attacked

**1 — the derivation, "grade ONLY those", the same refusals, the verdict
line. MET, and it survived the attack set's whole first section.**

- *Not name-derivation (A1.1).* Data mutant **M1** — I broke
  `gate-run.spec.ts`'s import of `../scripts/gate-run.mjs` and re-derived:
  the subset went from `[gate-run.spec.ts]` to EMPTY and the path became
  unplaceable. A name-based rule could not have moved.
- *Not "run everything" (A1.2/C5).* Live at the tip: 39 spec files;
  `gate-run.mjs` names 1, `docs/STATE.md` 2, `push-guard.mjs` 3,
  `gate-token.mjs` 7, `lane-fence.mjs` 9, `docs/CONVENTIONS.md` 11,
  `docs-scan.mjs` 16, `git-fixture.ts` 14. It shrinks and grows; it never
  returns the list.
- *Transitive, not one level (A1.3).* `workflow-parity.spec.ts` imports
  only `push-guard.mjs`, and it appears for `gate-token.mjs` — a real
  two-hop chain at the base. Mutant **M3**: I planted
  `import "../../../.claude/hooks/push-guard.mjs";` in
  `accelerators.spec.ts` and `gate-token.mjs`'s set grew 7 to 8 through
  the planted edge alone. Mutant **M2**: repointing
  `workflow-parity.spec.ts`'s import at a DIFFERENT real file shrank
  `push-guard.mjs` 3 to 2 and `gate-token.mjs` 7 to 6.
- *`export * from` is followed.* I planted a re-export module and the
  importing spec joined the set. *Cycles terminate (A1.12/M10)*: I
  planted `m10-a.mjs` and `m10-b.mjs` importing each other, reachable
  from a spec; the derivation answered correctly and returned.
- *The subset is never SHORT, which is the direction that costs
  something.* I censused every relative specifier across **79 files**
  under `tools/e2e/{tests,scripts}`, `tools/e2e/` and `.claude/hooks/`
  with a permissive regex over RAW source and compared it against
  `importSpecifiers`. Three files differed and all three differences are
  correct: the extra "edges" are inside STRING LITERALS (a fixture
  program in `gate-run.spec.ts` and in `token-scan.spec.ts`) or inside a
  COMMENT (`docs-scan.mjs`). **Zero genuinely missed edges.**
- *Path forms (A1.6).* repo-relative, `./`-prefixed, ABSOLUTE inside the
  checkout, a traversal that lands back inside (`tools/e2e/tests/../
  scripts/gate-run.mjs`) and a spec naming ITSELF all resolve to the same
  correct subset. A directory, a trailing-slash directory, a climb out of
  the repository and a blank all REFUSE at exit 2. A spec owns itself.
- *The same refusals (A1.7/A1.8).* The scoped run goes through the SAME
  `runSuite`, so they are the same call sites and not copies: the cd
  guard fires on a scoped suite pointed at `lib/parser` ("has no
  playwright.config.ts") and at a missing directory; `validateSuite`
  refuses a scoped argv element holding a metacharacter; `judge` returns
  REFUSED for zero bodies and for parts-do-not-sum, and `scopeVerdict`
  deliberately leaves a REFUSED refusal alone rather than inventing a
  fifth word. All four demonstrated.
- *The verdict line (A1.9).* Measured, not read:
  `gate-verdict suite=e2e exit=0 bodies=56 targets=1 ref=a0ec8ad… verdict=SCOPED-GREEN scope=tools/e2e/tests/gate-run.spec.ts reason=ok over 1 owning spec(s) for 1 changed path(s) — NOT the leg, and not a token`.
  It names the SUBSET by path, carries the subset's own body count, and
  `parseVerdict` still finds all five REQUIRED_VERDICT_FIELDS — the new
  `scope=` sits before `reason=`, which is the only field whose value may
  hold spaces.
- *The docs arm is conditional and composed (A1.10/C4).* A code-only path
  produces no docs-walk bodies; `docs/CONVENTIONS.md` pulls in
  `shell-frame.spec.ts` and `window-contract.spec.ts` (the walkers) plus
  the specs that import the SCRIPTS the reader map names. `deriveOwning`
  pays for the docs scan only when a `docs/` path moved.

**THE HEADLINE, which the attack set asked for first: the purpose is
met.** Full leg at my tip: 774 bodies, 859 s wall. Scoped leg on this
lane's own one-spec change: **56 bodies in 18.07 s wall** (`/usr/bin/time
-p`), same instrument, same registry entry. The spawned child argv is
`["npx","playwright","test","tests/gate-run.spec.ts"]` against the full
leg's `["npx","playwright","test"]` — **the subset is on the command line
and the whole test directory is not.**

Taken over this lane.s WHOLE diff — all nine changed paths, docs and code
together — the derivation names **13 of the 39 spec files in 1754 ms with
nothing unplaceable and nothing unresolved**, re-derived at my own tip.
So even the widest honest reading of this change is a third of the leg.

**774 bodies in 859 s against 56 bodies in 18.07 s — forty-eight to one
by wall clock at my own tip.** My full leg ran with the integration
checkout.s own four-suite battery beside it throughout, which the
`suite/e2e-seconds` health band would read as CONTENTION rather than as
the suite; the lane measured 853 s uncontended, so the wall figure is
sound and the ratio is if anything conservative. The COUNT is unaffected.

**2 — the verifier and the integrator stay four legs. MET FOR THE
INTEGRATOR, MECHANICALLY. MET FOR THE VERIFIER IN PROSE ONLY, and I say
so plainly because it is the weakest link in this card.**

There is NO seat gate. I searched: `gate-run.mjs` names `verifier` five
times and every one is a comment or the usage string. **I then ran
`gate-run.mjs e2e --owning docs/CONVENTIONS.md` from the verifier's own
bench, as the verifier, and was not refused.** Mutant M8 from the attack
set has nothing to delete.

I judged whether the lane could have done better and concluded it mostly
could not: there is nothing in this repository for a runner to read.
`.supertaskr/holder.json` (T-238) carries pid, startedAt, program,
checkout, takenAt and host, and NO role. Any gate would be a NEW declared
protocol, which the card never named and which reaches outside this fence
to be useful. The executor's report states the position in as many words
— "MET as spelling — nothing in code can enforce a seat's discipline, and
this card deliberately does not try" — so it is disclosed, not silent.
**But it is disclosed in the REPORT and not on the CARD**: the
implementation notes carry no sentence about criterion 2 at all, so the
record that outlives the report does not hold the position. Records are
never rewritten, so this verdict is where it now lives.
**What IS mechanical is real and I verified it end to end** (criterion 3).
I have filed **T-271-s6** for the declared-seat refusal, which is the
attack set's own fallback position and the half that does live inside
this fence. This is a named weakness in the verdict, not an assigned
correction: the criterion's letter asks the runner to know something
nothing tells it.

**3 — the token SHALL NOT be minted from a subset run. MET, and this was
the single most important run on the bench.**

The attack set's A3.1 named the laundering hole — a scoped run that
leaves a standing GREEN `e2e` entry alive at a new tree — as the failure
that would invert the card. I built it deliberately: I forged a complete
all-GREEN token at the bench's own tree, confirmed `judgeToken` answered
**fresh**, then ran the REAL scoped leg. The `e2e` entry became
`SCOPED-GREEN` with **bodies=56** (the SUBSET's count, never the leg's —
A3.5), the other three stayed GREEN, and the REAL
`.claude/hooks/push-guard-hook.mjs` then **refused the push at exit 2**.
A scoped run poisons a stale green exactly as CONVENTIONS now claims.

**And the refusal is armed by the WORD, not by the fixture's shape
(A3.2) — the control, run three ways over one fixture:**

    e2e verdict GREEN         real push-guard-hook.mjs  exit 0   ACCEPTED
    e2e verdict SCOPED-GREEN  real push-guard-hook.mjs  exit 2   REFUSED
    e2e verdict SCOPED-RED    real push-guard-hook.mjs  exit 2   REFUSED

Everything but the verdict string was identical. **No edit was made to
`gate-token.mjs` or `push-guard.mjs` to achieve this** — the existing
`GREEN`-exactly rule does the work — and T-280 is NOT pre-empted: the
token gained no field the guard reads, and I diffed the schema to be
sure. The lane's own T-271-s2 correctly names the residual: the refusal
arrives through the RED bucket, whose sentence says the suite "RAN AND
FAILED" of a scoped run that passed. Right refusal, wrong sentence, in a
file this fence cannot reach; the card is filed and that is the right
channel.

**4 — an unplaceable path refuses, never grades nothing. MET.**

Exit 2 (`EXIT.USAGE`) with the path named and `THE FULL e2e LEG IS OWED`,
BEFORE anything spawns and before any token is written. **The mixed-list
drop (A4.1), which is the real executor case, does not happen**:
`--owning tools/e2e/scripts/gate-run.mjs app/src/main.tsx` refuses at 2
naming `app/src/main.tsx` rather than grading the remainder green. An
empty path list, the wrong leg, a derivation that named no spec, and an
unresolvable import edge share the sentence. A file that EXISTS and is
tracked but that no spec reads (`app/src/main.tsx`,
`tools/e2e/playwright.config.ts`) refuses rather than answering "nothing
owes this" (A4.2). **And a refusal mints nothing (A4.4)**: with a
complete GREEN token standing at the tree, a refused scoped run left the
token file BYTE-IDENTICAL by sha256, so a refusal can neither clobber an
entry with the wrong tree nor leave a green behind.

**5 — the two bullets and the briefs' row 7. THE CONVENTIONS HALF IS MET;
THE ROW-7 HALF IS UNREACHABLE INSIDE THE FENCE, AND THE LANE SAID SO.**

Both bullets are EXTENDED, never replaced — 30 insertions, 0 deletions,
every base clause intact (A5.4). Both halves of the sentence are present:
which seat may scope, and that the integrator runs the full battery last
(A5.6). The byte band is read from the gate's OWN budget line and not
from my arithmetic: **"governing-document budgets hold — 4 gated, 0
awaiting their compaction landing (ADR-019)"**, CONVENTIONS 131472 to
133574 bytes (A5.3). Nothing landed in `method/roles/executor.md` (A5.5).

Row 7 does NOT carry the spelling, and cannot: I rendered the executor's
brief at the tip and row 7 holds only the per-package `from <dir>/:`
commands, because `packageCommands()` reads only those bullets and the
blessed runner has never appeared there. **The spelling DOES reach the
executor's brief, verbatim and whole, through the CONTEXT PACK** — I read
it in the rendered brief. Putting it in row 7 requires
`dispatch-brief.mjs`, outside this fence and currently T-282's. The lane
filed T-271-s1. I verified its load-bearing figure independently: the
transcribed bullet is **1603 bytes flattened against
`PACK_TRANSCRIPTION_LIMIT` 2000 — 397 bytes of margin**, after which the
pack silently drops to a citation and every brief stops carrying this
card's words. That is a real fragility and the card names it.

The VERIFIER's brief cannot be rendered at all: `brief.mjs --task T-271
--role verifier` exits **3** at my tip ("found 0 tables"), because
`method/roles/verifier.md` carries no contract table. Pre-existing, in
T-283's live fence, filed as T-271-s3. Judged on what the lane could do
inside its fence and whether it said so: it could not, and it did.

*Attribution, so a later reader does not misread it:* the EXECUTOR brief
exits **1** at my tip and **0** at the base, and the single unsettled
item is `T-283 could not be compared at all — this checkout has no card
for it`. That is the bench-older-than-a-sibling-lane skew `docs/STATE.md`
names, not this diff.

**6 — the two demonstration bodies. MET, and they are not vacuous.**

The fixture is built so the claim is measurable rather than asserted: a
`subject.mjs`, an `owner.spec.ts` that imports it, and a
`subject.spec.ts` that SHARES THE STEM, imports nothing, and always
fails. The whole fixture leg is RED with 2 bodies; the scoped reading is
GREEN with 1. A name-matching derivation could not report green. The red
half plants the defect in the SUBJECT, not in a body.

**The two controls I owed, each run with its arming ABSENT:**

- **C1** — the red half with the defect NOT planted (the plant replaced
  by the pristine write): **1 failed**. It is a discrimination.
- **C2** — the green half with the subset forced EMPTY (`scopedSuite`
  appending no spec, so the leg runs whole): **2 failed**. The green is
  not green-because-nothing-ran.

One gap in the token body, which I closed myself rather than assigning:
it exercises the REAL `judgeToken` from `.claude/hooks/gate-token.mjs` —
the function the guard calls — but not the guard BINARY. So I ran
`.claude/hooks/push-guard-hook.mjs` itself, three ways, and the table in
criterion 3 is that run. The body is honest about what it isolates; the
lane recorded that the live checkout could not give it that isolation.

All 46 base body names survive verbatim, checked NAME BY NAME against the
sealed ground truth: 0 of 46 missing, and the spec deletes no line (A6.5).
Across the whole spec corpus `test("` declarations go 735 at the base to
745 at the tip — delta exactly 10, against the seal.s own census of 735 in
39 files. gate-run.spec.ts alone is 56 bodies at my tip (A6.6).

## Security sweep — clean

`--owning` never reaches a shell. `spawnSync` runs with an argv ARRAY and
no shell, and the argv the scoped suite appends is built from
`readdirSync` of the spec directory, never from the caller's string —
`validateSuite` then refuses any argv element holding a metacharacter. I
fired `;` , backticks, `$( )`, a glob and two traversals through
`--owning`; every one refused at exit 2 and **no file was created**.
The derivation PARSES and never executes: the only `import(` in the whole
section is a comment saying dynamic import is out of scope, so no spec or
hook module is loaded to build the graph (A1.5). Traversal is inert
because a changed path is only ever a string key compared against derived
sets; `../../../etc/passwd` and `/etc/passwd` are unplaceable and refused.
No new dependency, no secret, no new endpoint.

## THE CORRECTION ASSIGNED — one, with its body committed and drilled

**CORRECTION 1 — the scoped arm's SUCCESSFUL CLI path is pinned by no
body, so the runner may become a green-only instrument one layer in.**

Every existing body stops short of `mainOwning`'s tail. Two drive
`runSuite`/`scopeVerdict` by hand over a fixture leg; two drive the CLI
only into its REFUSALS, which return before anything spawns. Nothing runs
the arm through the spawn, the re-wording, the TOKEN WRITE and the exit
code. I proved the gap with mutants rather than inferring it — **three
independent mutants at that site all SURVIVED the whole spec**:

    M9launder  `recordVerdicts([scoped]);` commented out
               -> the scoped run writes NO token; a standing GREEN e2e
                  entry outlives it at a new tree. The laundering hole
                  the attack set called the card's most important run,
                  and CONVENTIONS' own claim that a scoped run "POISONS
                  a stale green" becomes false with nothing red.
               SURVIVED: gate-run.spec.ts exit 0, 56 passed.

    M12exit    the exit mapping replaced by a constant `return EXIT.GREEN;`
               -> a scoped run over a RED subset answers at the GREEN
                  code. THIS IS THE DANGEROUS ONE: an executor iterating
                  with --owning reads a red as a green, which is exactly
                  the "green-only instrument" this file's own first body
                  exists to refuse.
               SURVIVED: gate-run.spec.ts exit 0, 56 passed.

    M13line    `process.stdout.write(...)` commented out
               -> no verdict line at all, and CONVENTIONS says READ THE
                  COUNT.
               SURVIVED: gate-run.spec.ts exit 0, 56 passed.

The implementation HAS all three properties — I verified the live path
end to end (the token really flipped to SCOPED-GREEN and the real guard
really refused). What is missing is the PIN, and a plausible future
refactor removes it: the word `SCOPED-` positively invites someone to
conclude that a non-token verdict need not be written to the token.

**Why nobody wrote it, and why the body has the shape it has.** The arm
cannot be driven at this checkout's root from inside the leg: `--owning`
takes the e2e leg's SOLO LOCK, which the running leg already holds, and
it would write this checkout's own token. So the fixture is a repository
of its own holding a COPY of the runner and its five-file import closure,
copied AT RUN TIME so a mutant planted in the real file travels into the
copy. One trap is recorded in the body because it cost me a silent pass:
`mkdtempSync` returns `/var/folders/...`, macOS realpaths that to
`/private/var/...`, and the runner only executes `main` when
`import.meta.url` matches `process.argv[1]` — handed the `/var` spelling
the module loads, does nothing and exits 0 with NO output, which would
have made every assertion below vacuous. `realpathSync` is load-bearing.

**Both readings, as step 5b requires:**

    against the implementation as it stands (the property present)
      npx playwright test gate-run.spec.ts -g "the scoped arm's own CLI path"
      exit 0 — 1 passed (2.8 s)

    against an implementation LACKING the property, three times
      M9launder -> exit 1, 1 failed, "the arm WROTE the subset's verdict into the token"
      M12exit   -> exit 1, 1 failed, "a RED subset may NEVER answer at the GREEN code"
      M13line   -> exit 1, 1 failed, "the arm printed a verdict line at all"

Each mutant was planted by a unique substring swap, its landing read from
`git diff` and never from the mutator's report, and reverted with
`git checkout --` afterwards; the tree was confirmed clean between drills.
After every drill on this bench the three fenced files are byte-identical
to the committed tip by sha256 — `gate-run.mjs` 9f135be10180f45c… and
`gate-run.spec.ts` 45ab07db546a4ffc…, which are the SAME digests the
executor recorded for its own restores, so two independent seats agree on
what pristine is.
`npx tsc --noEmit` from `tools/e2e/` is clean with the body in place.
Each block.s `--- old` anchor was checked against `gate-run.mjs` and
matches EXACTLY ONCE; no block names a line number in any field.

The three mutants sit at three distinct sites and no kill set contains
another today, because all three kill sets were EMPTY. One body closes
all three because one CLI run decides all three answers — the exit code,
the printed line and the token entry are three readings of one act, not a
subject and its own control.

```mutant
correction: the scoped arm's successful CLI path writes no token, and nothing reds
file: tools/e2e/scripts/gate-run.mjs
spec: tools/e2e/tests/gate-run.spec.ts
body: the scoped arm's own CLI path prints the subset's verdict, writes it to the token and answers with the subset's own exit code
message: the arm WROTE the subset's verdict into the token
--- old
  recordVerdicts([scoped]);
--- new
  // recordVerdicts([scoped]);
```

```mutant
correction: a scoped run over a RED subset answers at the GREEN code
file: tools/e2e/scripts/gate-run.mjs
spec: tools/e2e/tests/gate-run.spec.ts
body: the scoped arm's own CLI path prints the subset's verdict, writes it to the token and answers with the subset's own exit code
message: a RED subset may NEVER answer at the GREEN code
--- old
  return scoped.verdict === `${SCOPED_PREFIX}GREEN` ? EXIT.GREEN : EXIT.RED;
--- new
  return EXIT.GREEN;
```

```mutant
correction: the scoped arm prints no verdict line at all
file: tools/e2e/scripts/gate-run.mjs
spec: tools/e2e/tests/gate-run.spec.ts
body: the scoped arm's own CLI path prints the subset's verdict, writes it to the token and answers with the subset's own exit code
message: the arm printed a verdict line at all
--- old
  process.stdout.write(`${formatVerdict(scoped)}\n`);
--- new
  // line removed;
```

**THE BODY, COMMITTED TO `tools/e2e/tests/gate-run.spec.ts` ON THIS BENCH
IN THE COMMIT AFTER THIS VERDICT, AND REPRODUCED HERE VERBATIM.** It also
adds `realpathSync` to this file's existing `node:fs` import.

```ts
/**
 * ── THE SCOPED ARM AS A SEAT MEETS IT: THE CLI PATH, RUN TO COMPLETION ──
 *
 * Every body above stops short of it. Two drive `runSuite`/`scopeVerdict`
 * by hand; two drive the CLI only into its REFUSALS, which return before
 * anything spawns. Nothing ran the arm's own TAIL — the spawn, the
 * re-wording, THE TOKEN WRITE and the exit code — and a drill proved the
 * gap rather than guessed it: deleting `recordVerdicts([scoped])`,
 * replacing the exit mapping with a constant `EXIT.GREEN`, and deleting
 * the verdict line ALL THREE left this suite green.
 *
 * THE MIDDLE ONE IS THE DANGEROUS ONE. A scoped run reporting exit 0 over
 * a RED subset is a green-only instrument — the defect §POSITIVE CONTROL
 * at the top of this file exists to refuse, one layer in and unguarded.
 * The first one is the laundering hole: without the token write a standing
 * GREEN `e2e` entry outlives a scoped run at a new tree.
 *
 * IT CANNOT BE DRIVEN AT THIS CHECKOUT'S ROOT, WHICH IS WHY NOBODY DID:
 * `--owning` takes the e2e leg's SOLO LOCK — held by the leg running this
 * body — and would write THIS checkout's token. So the fixture is a
 * repository of its own holding a COPY of the runner and its import
 * closure, copied AT RUN TIME so that a mutant planted in the real file
 * travels into it.
 */
const ARM_CLOSURE = [
  "tools/e2e/scripts/gate-run.mjs",
  "tools/e2e/scripts/docs-scan.mjs",
  "tools/e2e/scripts/token-scan.mjs",
  ".claude/hooks/gate-token.mjs",
  ".claude/hooks/lane-fence.mjs",
];

function makeArmFixture(answer: string): { root: string; cleanup: () => void } {
  // REALPATH, AND IT IS LOAD-BEARING: macOS resolves /var/folders to
  // /private/var, and this runner only runs `main` when `import.meta.url`
  // — always a real path — matches `process.argv[1]`. Handed the /var
  // spelling the module loads, does NOTHING, and exits 0 with no output:
  // a silent pass that would make every assertion below vacuous.
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "t271-arm-")));
  mkdirSync(path.join(root, "tools", "e2e", "scripts"), { recursive: true });
  mkdirSync(path.join(root, "tools", "e2e", "tests"), { recursive: true });
  mkdirSync(path.join(root, ".claude", "hooks"), { recursive: true });
  for (const rel of ARM_CLOSURE) {
    writeFileSync(path.join(root, rel), readFileSync(path.join(repoRoot, rel), "utf8"));
  }
  symlinkSync(
    path.join(repoRoot, "tools/e2e/node_modules"),
    path.join(root, "tools/e2e/node_modules"),
    "dir",
  );
  writeFileSync(
    path.join(root, "tools/e2e/playwright.config.ts"),
    'export default { testDir: "./tests", reporter: [["list"]], workers: 1, retries: 0 };\n',
  );
  writeFileSync(
    path.join(root, "tools/e2e/scripts/subject.mjs"),
    `export const ANSWER = ${answer};\n`,
  );
  writeFileSync(
    path.join(root, "tools/e2e/tests/owner.spec.ts"),
    "import { test, expect } from '@playwright/test';\n" +
      "import { ANSWER } from '../scripts/subject.mjs';\n" +
      "test('the subject answers what its owner expects', () => { expect(ANSWER).toBe(41); });\n",
  );
  writeFileSync(
    path.join(root, "tools/e2e/tests/stranger.spec.ts"),
    "import { test, expect } from '@playwright/test';\n" +
      "test('the stranger nothing owns, and it always fails', () => { expect(1).toBe(2); });\n",
  );
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", root, ...NO_BACKGROUND_MAINTENANCE, ...args], { stdio: "pipe" });
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("-c", "user.email=t271@example.invalid", "-c", "user.name=t271", "commit", "-qm", "base");
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

/** Drive the copied runner's scoped arm and read back everything it owes. */
function runArm(root: string): { status: number | null; line: string; token: string; bodies: number } {
  const r = spawnSync(
    process.execPath,
    [path.join(root, "tools/e2e/scripts/gate-run.mjs"), "e2e", "--owning", "tools/e2e/scripts/subject.mjs"],
    { cwd: root, encoding: "utf8" },
  );
  const line =
    `${r.stdout ?? ""}`
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith(`${VERDICT_TOKEN} `))
      .at(-1) ?? "";
  let token = "";
  let bodies = -1;
  try {
    const parsed = JSON.parse(readFileSync(path.join(root, TOKEN_REL_PATH), "utf8"));
    token = String(parsed?.suites?.["e2e"]?.verdict ?? "");
    bodies = Number(parsed?.suites?.["e2e"]?.bodies ?? -1);
  } catch {
    token = "NO TOKEN WRITTEN";
  }
  return { status: r.status, line, token, bodies };
}

test("the scoped arm's own CLI path prints the subset's verdict, writes it to the token and answers with the subset's own exit code", () => {
  // THE GREEN ARM — a subset that really passes.
  const green = makeArmFixture("41");
  try {
    const g = runArm(green.root);
    expect(g.status, "a passing subset answers at the GREEN code").toBe(EXIT.GREEN);
    expect(g.line, "the arm printed a verdict line at all").not.toBe("");
    expect(g.line).toContain(`verdict=${CRITERION_3_SCOPED_GREEN}`);
    expect(g.line).toContain("scope=tools/e2e/tests/owner.spec.ts");
    expect(g.line, "one body, because one spec owns the change").toContain("bodies=1");
    expect(g.token, "the arm WROTE the subset's verdict into the token").toBe(
      CRITERION_3_SCOPED_GREEN,
    );
    expect(g.bodies, "and recorded the SUBSET's count, never the leg's").toBe(1);
  } finally {
    green.cleanup();
  }

  // THE RED ARM — the same fixture with one character of the SUBJECT moved.
  // A scoped run that answered GREEN here would be a green-only instrument.
  const red = makeArmFixture("42");
  try {
    const r = runArm(red.root);
    expect(r.status, "a RED subset may NEVER answer at the GREEN code").toBe(EXIT.RED);
    expect(r.line).toContain(`verdict=${CRITERION_3_SCOPED_RED}`);
    expect(r.token, "and the token records the red rather than a stale green").toBe(
      CRITERION_3_SCOPED_RED,
    );
  } finally {
    red.cleanup();
  }
});
```

## Findings that are NOT failures — filed, never folded into this verdict

- **T-271-s6 (mine, new)** — the runner cannot know which seat called it,
  so criterion 2's ONE-SEAT rule is enforced by prose alone. Asks for a
  refusal on a DECLARED non-executor seat, and requires the card to
  record that a declaration is spoofable by construction.
- The lane's own five (**s1** row 7 and the 397-byte pack margin, **s2**
  the RED bucket's false sentence, **s3** no verifier brief, **s4** the
  docs census blind spot, **s5** the dev server's ~11 per cent) are all
  well-formed, all `status: suggested` with `suggested_by` and `touches`,
  and the docs gate confirms every live card's frontmatter parses with a
  legal status. **s5 was filed on a claim and then REWRITTEN by its own
  measurement**, which is the behaviour this method wants and is worth
  recording as such.

## What the merge still owes

`npm run capabilities` IN the merge commit (ten new spec names; the
census is stale at this tip and that is EXPECTED and the integrator's,
T-201); my own correction commit adds ONE further spec name, so the
regeneration owes eleven rather than ten; the graph regen and `index --check`, with the six dogfood pins in
`app/test` that move with it; and the full four-leg battery on merged
main before the push — which is this card's own second criterion.
The rust leg is NOT among the debts: it is measured above at a0ec8ad.

## The verdict

**APPROVED WITH ASSIGNED CORRECTIONS.** The card's purpose is real and
measured — sixty-one to one on this lane's own change, through the same
instrument, with the subset on the command line and the whole test
directory off it. The derivation is a genuine static import graph that
shrinks, grows, follows re-exports, survives cycles and is never short on
this corpus; every failure ends at a refusal in the safe direction; and
the token story holds against the real push guard with the control run
both ways. One correction is assigned, with its body committed and
drilled RED three ways and GREEN once. Criterion 2's verifier half is met
in prose only, which I have named here rather than buried, and filed.
