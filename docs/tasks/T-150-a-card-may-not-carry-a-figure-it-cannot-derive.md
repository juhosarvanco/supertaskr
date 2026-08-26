---
id: T-150
title: Briefs derive every figure and refuse to emit one without provenance — cards do not, and two of three cards on 2026-08-26 were rejected on a number their author typed from memory
feature: F-06
milestone: 4
priority: 1
size: M
status: done
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier: claude-opus-5
built_by: claude-opus-5
verified_by: claude-opus-5
review: same-model
---

## The measurement

The night of 2026-08-26 spent roughly **2.34M subagent tokens** moving
three cards. **Two were rejected. Both on a figure the author typed from
memory into a card or a brief.**

- **`T-141`** — its first sentence said "this repository's **second**
  D2". It is the third. The whole narrative rested on the count, and one
  paragraph named the count as its own warrant. Rejected.
- **`T-137`** — its dispatch brief carried an inverted premise about a
  positive control ("a control reding under nine arms" for "one arm
  reding nine bodies"), plus a stale blast-radius figure.

Each rejection bought a full rework **and** a full re-verification:
**~1.2M tokens, half the night's spend, on two wrong numbers.**

## The asymmetry that makes this fixable

**`T-133` already solved this for briefs.** `dispatch-brief.mjs` builds
output as RECORDS, not strings; **a `value` record without provenance
THROWS at render**, and a `note` record may not contain a digit at all.
The only way a figure leaves that tool is attached to its ref or its
reading time.

**Cards were never brought under that rule.** They are hand-written
markdown, and every count, byte figure, percentage and commit-age in
them is typed. A verifier then spends 200k tokens disproving one.

> The project already decided that **the derived answer must be cheaper
> than the remembered one**. It built the tool for the dispatching seat
> and stopped there.

## The shape of a fix, not the fix

1. **A lint that flags a bare figure in a card body** and requires an
   adjacent provenance marker — a ref, a command, or an explicit
   `MEASURED AT` stamp. Cheapest. **But see the caution: this is the arm
   most likely to be gamed by adding a marker without re-deriving.**
2. **A `--card` mode on the existing brief tool**, so an author asks for
   the figures instead of recalling them: board counts, fence contention,
   file counts, byte sizes, ranges. **The infrastructure exists and this
   is arm 1 of `T-133` pointed one seat over.**
3. **Require the figure-bearing sentence to name its command**, the way
   `STATE.md`'s derivable sections now do. Prose, and `T-131` argues
   prose does not bind.

**Arm 2 has the precedent and the machinery.** Arm 1 without arm 2 tells
authors they are wrong without making it cheaper to be right, which is
the failure mode `T-133`'s own header names.

## What this card must NOT become

**Not a ban on figures.** This project's cards are good precisely because
they carry measurements. The target is the UNDERIVED figure, not the
figure.

**Not a rule that only applies to new cards.** The two rejections came
from a card's opening sentence and a brief's body — both authored by the
dispatching seat, in a hurry, from memory. A guard the author can skip
when rushed is a guard for the case that never fails.

## One caution for whoever takes it

Per `T-142`, **prove the check can fail.** Plant a wrong figure in a
scratch card, watch it RED, correct it, watch it GREEN. A lint over
markdown that silently matches nothing is this project's most-repeated
defect — **five instances on 2026-08-26 alone**, three of them by the
architect, one while auditing that very habit.

---

## Implementation notes

Appended by executor claude-opus-5. **Every derivable figure below is a
line this card's own command emitted, pasted, stamped, and re-runnable
with `node tools/e2e/scripts/brief.mjs --card T-150`.** The figures that
are functions of a RUN carry `card:measured` instead, which is the
channel this card's "not a ban on figures" clause requires.

### The three judgement calls

**1. WHICH ARM — ARM TWO, AND ARM ONE IS REFUTED BY MEASUREMENT RATHER
THAN INHERITED FROM THIS CARD.** The brief asked me to test the argument.
Three refutations, all re-derivable:

- **Arm one over-fires by two orders of magnitude.** Over every live
  card's prose (fenced and indented blocks stripped) the corpus carries
  digit runs in the tens of thousands against census claims in the low
  tens. The suite pins the RELATION and not either count —
  `the case for arm two is a RATIO and this body re-derives it`.
- **Arm one is blind to the class that caused the rejection.** `T-141`'s
  sentence is *"T-139's merge created this repository's second D2."* Its
  only digits are IDENTIFIERS (`T-139`, `D2`); the FIGURE is the word
  `second` and no digit scanner of any strictness sees it. Pinned on the
  sentence itself.
- **THE DECISIVE ONE: an adjacency lint would have PASSED that sentence.**
  It is followed immediately by a command AND a ref — *"`arch` at
  `ae92f67`: components=13 files=185 …"* — which derive six other
  figures and not that word. **This card's caution about arm one being
  "gamed by adding a marker without re-deriving" did not need gaming: it
  had already happened, honestly.** A marker that is PRESENT and does not
  BIND is the failure. So the gate RE-RUNS the marker instead of noticing
  it, which is the one thing arm one cannot do.

**2. WHICH FIGURES A CARD ACTUALLY CARRIES.** Sampled all live cards. The
largest single class carries NO DIGIT — number words, ordinal and
cardinal. After fifteen hand-written classes are subtracted (ids, shas,
versions, dates, ratios, exit codes, byte sizes, durations, percentages,
token spends…) the unclassified remainder is still in the tens of
thousands, so classification by regex cannot produce a narrow signal and
a NARROW tool beats a general one. Six derivers were built against the
classes that are both common and functions of a tree: `board`, `fence`,
`demand`, `contention`, `deps`, `history`. Suite results, token spends
and wall-clock durations are deliberately NOT derived — they are
functions of a RUN — and get `card:measured`.

**3. WHETHER THE PROVENANCE RULE PORTS AS-IS. THE THROW DOES NOT; THE
CLOSED VOCABULARY DOES, BY BECOMING A RE-DERIVATION.** `dispatch-brief.mjs`
may throw because it OWNS its output — every figure passes through
`value()`. A card is not this tool's output, so there is no render to
throw at, and a gate that throws over prose either over-fires or goes
vacuous. What transfers is the vocabulary: a stamp names a deriver the
gate IMPLEMENTS, and the line has to be one that deriver still produces.
The floor itself is IMPORTED, not re-implemented — `value`, `treeProv`,
`liveProv`, `render` and `unstampedLines` all come from
`dispatch-brief.mjs`, so this repository has one provenance
implementation and not two (T-057).

### What was built

`tools/e2e/scripts/card-figures.mjs` (derivation, no I/O at import) and
`--card <T-NNN>` / `--audit <path>` on `brief.mjs` (execution). Five
verdicts, because two would be the mistake `lane-protocol.md` rule 5
names: VERIFIED, STALE, ATTESTED, UNRUNNABLE, CENSUS. STALE, UNRUNNABLE
and CENSUS are findings; the command exits 1 on any.

`--audit` exists because **one of the two named failures lived in a
dispatch BRIEF, and a brief is committed nowhere.** The audit is text-in,
so the dispatcher can point it at the brief it is about to send.

### WOULD IT HAVE CAUGHT BOTH? ONE YES, ONE NO, AND THE NO IS TWO NOS

**`T-141`: CAUGHT, and precisely.** Audited against the card exactly as
dispatched (`git show 2a922ce:docs/tasks/T-141-…`, 118 lines, before the
rejection): **the tool reports exactly ONE figure — `CENSUS line 18`,
which is the opening sentence the verifier rejected the card on.** One
finding, one true positive, no noise.

**`T-137`: MISSED, both halves.**

- **The inverted premise is not a figure at all.** *"a control that reds
  under nine arms"* for *"ONE arm that reds NINE BODIES"* — the NUMBER is
  right on both sides and the RELATION is inverted. No figure gate of any
  design catches that, and no derivation would have.
- **The stale blast-radius figure is the right CLASS and the wrong
  CHANNEL.** `card:fence` answers exactly that figure, and `--audit`
  reaches a brief file — but only if the figure carries a stamp. A bare
  stale number in a brief is still invisible, deliberately, because
  arm one is refuted. **What this fix does to that failure is PREVENT it
  rather than DETECT it**: the dispatcher pastes a derived line instead of
  recalling one. That is the card's own thesis — make the derived answer
  cheaper — and it is weaker than a catch. Stated plainly rather than
  claimed as a catch.

**AND ARM ONE WOULD HAVE CAUGHT AT MOST ONE OF THE THREE**, at ~two
hundred hits per card: not `T-141` (no digit, and a marker was present),
not the inversion (not a figure), possibly the stale blast radius.

### The figures, derived

    board live cards: 316  <- @ 05a09e487852 ; card:board
    fence tools/e2e tracked files: 47  <- @ 05a09e487852 ; card:fence
    fence tools/e2e tracked bytes: 893489  <- @ 05a09e487852 ; card:fence
    demand tools/e2e cards: 38  <- @ 05a09e487852 ; card:demand

Of the live cards, **282 audit clean and 34 carry at least one finding**
— an eleven-percent card-level hit rate, against arm one's every card.
That pair is a function of the tree and moves with it; re-derive it, do
not quote it.

**THOSE FOUR LINES WERE PASTED ONCE ALREADY AND TWO OF THEM WENT STALE
INSIDE THREE COMMITS**, which is the honest demonstration and is left in
rather than tidied away. The first paste was at `f174d5c`; by `05a09e4`
the board had gained three suggestion cards and `tools/e2e` had gained
bytes, and `--card T-150` reported `STALE line 188: board live cards: 313`
and `STALE line 190: fence tools/e2e tracked bytes: 890996` beside two
that still VERIFIED. **The author of the gate could not keep his own
figures current for one hour.** That is the whole argument for the gate
and against remembering.

### T-142's caution: PROVE THE CHECK CAN FAIL

Done end to end, with a positive control so the green is not vacuous.
All three runs at `8d4500a`, exit codes read from `$?` unpiped:

| step | command | exit |
|---|---|---|
| control, nothing planted | `brief.mjs --card T-002` | **0** |
| wrong figure planted | `brief.mjs --card T-002 --audit <scratch>` | **1**, `STALE line 6: … board planned: 9999` |
| corrected to the derived line | same command | **0**, `VERIFIED line 6: … board planned: 34` |

### POISON DRILL — 20 mutants, one side only, and ONE SURVIVED

Run in a DETACHED scratch worktree at a named commit
(`git worktree add --detach <scratch>/drill-T-150 8d4500a`), with the
lane's `node_modules`/`dist` symlinked in rather than reinstalled. No
cargo is involved anywhere in this diff, so the `CARGO_TARGET_DIR` half
of that rule has nothing to bite on; the worktree half was taken anyway.
**Every mutant moves the PRODUCER (`card-figures.mjs`) and never an
assertion**, and every mutation was read back with `git diff` before its
suite ran — the count being right is not the same as the text being right
(T-078).

Baseline in the drill worktree: **25 passed at `8d4500a`, 27 at
`05a09e4`, exit 0 both times**. Kills:

| mutant | what it moved | killed |
|---|---|---|
| M1 | `repositor\w*` and `this repo\w*` out of the census scope | 2 |
| M2 | census claim reduced to a bare ordinal alternation | 2 — including the RATIO body, which is the point of that body |
| M3 | `reproduces`: `endsWith` → `includes` | 1 |
| M4 | `reproduces`: suffix arm removed, equality only | 1 |
| M5 | `CENSUS` dropped from `FINDING_VERDICTS` | 1 |
| M6 | `proseOnly` drops blanked lines instead of blanking | 1 |
| M7 | a digit into a `note()` | 2 |
| M8 | `CARD_STAMP` loses its `$` anchor | 1 |
| M9 | `reproduces` always true | 2 |
| M10 | `ATTESTED_KEY` branch disabled | 1 |
| M11 | `ANY_PROVENANCE` never matches | 1 |
| M12 | unknown key returns `VERIFIED` | 2 |
| M13 | `fenceWeight` off by one | 1 |
| M14 | `fenceDemand` counts every card | 1 |
| M15 | `cardBody` stops stripping frontmatter | 1 |
| M16 | `derivedTexts` drops a key | 2 |
| M17 | a deriver's `answers` emptied | 1 |
| M18 | `auditCard`'s reported line shifted by one | **0 — SURVIVED** |
| M19 | `reproduces` always false | 3 |
| M20 | a bare-digit branch added to `auditCard` | 3 |
| M21 | stamped-line lookup back to the PROSE reader | 1 |
| M22 | census claim inferred from transcript lines too | 1 |

**M18 IS THE FINDING AND IT IS FIXED.** The reported line indexes the
card FILE, frontmatter included, and nothing asserted it: the line-number
body drives `proseOnly` over array indices and never sees the offset. An
off-by-one sends every author to the wrong line of their own card,
silently. A body was added (`the reported line indexes the FILE,
frontmatter included`) and **M18 re-run against it now kills: 1 failed,
24 passed, exit 1.**

**AND THE DRILL'S SECOND FINDING CAME FROM DOGFOODING RATHER THAN FROM A
MUTANT.** These very notes pasted their figures into an INDENTED block,
`proseOnly` blanks those, and every figure in them therefore sat OUTSIDE
the audit — **the author who built the gate had escaped it by
formatting.** Closed at `05a09e4`: a `card:` stamp is an explicit machine
claim and is now audited wherever it sits, transcript blocks included,
while the bare-arrow and census arms stay prose-only for stated reasons.
M21 and M22 are the mutants that pin the new cut.

**ONE BODY CANNOT BE POISONED FROM THE PRODUCER AND IS NAMED RATHER THAN
COUNTED AS DRILLED**: `every digit in that sentence is an IDENTIFIER, and
the FIGURE has none` asserts a property of a historical string constant.
Its "producer" is `T-141`'s own prose at `2a922ce`; nothing in this diff
can move it. It is a RECORD, not a guard, and it is here so a later hand
proposing arm one meets the evidence.

**Restoration proved, not asserted.** Drill worktree tracked diff EMPTY
after every mutant; `card-figures.mjs` sha256
`57422b258169b65b323d37d74d4813ac0fc4c05c05f882afb19b3dd6746cf0ff` in the
drill worktree, in the lane's working tree, and in `git show HEAD:` —
all three identical. Lane `git status --porcelain` empty throughout.

### For the verifier

- **`--card T-150` on this very card exits 1**, reporting `CENSUS` on the
  line that QUOTES `T-141`'s rejected sentence. That is a true positive by
  the rule — the line does make an unstamped ordinal claim about this
  repository — and it is left standing rather than muted, because muting
  it would be the first act of gaming the gate.
- **Nothing is wired into CI and that is deliberate.** `--card` is an
  AUTHORING aid; making it a merge gate would red every card carrying a
  historical narrative, of which this board has many. Whether it should
  become a gate is a triage question, not a lane's.
- **The suite does not spawn a CLI**, per the brief. Every body imports
  the module. Note that `brief.spec.ts` and `boot-check-guard.spec.ts`
  already DO spawn — see the report's correction clause.

### Suggested, not built

Filed as separate suggestion cards. **`T-150-s1`** — two more standing
prohibitions live only in a brief, and the tree already contradicts one
of them. **`T-150-s2`** — the census-claim arm stops at the card while
the false-ordinal chain it catches ran through `docs/ARCHITECTURE.md` and
`docs/STATE.md` first; left out on judgement, not on reach. **`T-150-s3`**
— `index --check` is exit 1 on main, inherited from checkpoint `17e6f8a`,
and not this lane's.

---

## Verdict: APPROVED — adversarial verifier, claude-opus-5 @T-150-verify, 2026-08-27

**Measured at the lane tip `80aab211d2afcfa87208c9ccda528858aca5d0a8`,
against `main` at `d85d946b4ce736f21d8c982bb0178eb9392b4a03`.** Every
figure below carries the ref it was taken at, because this verdict's own
commit moves the tree it counts.

**THE BOUNDED READ WAS HONOURED AND IS STAMPED.** The standing set
(`docs/STATE.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`), the
task file **at its base ref `23ee41b`**, and the BASE tree's
`brief.mjs`/`dispatch-brief.mjs` were read first. The attack set was
written to
`…/scratchpad/T-150-attack-set.md` at **2026-08-27 01:01:21 +03:00**,
**before** `git diff`, `git show` of any lane commit, or the
implementation notes were opened — and it names what it deliberately did
not read (`docs/ROADMAP.md`, the diff, the notes, the s-cards, every
commit message). Four of its predictions were wrong, which is recorded
below beside the two that were right.

**All verification ran in a DETACHED scratch worktree OUTSIDE the
repository** (`/private/tmp/claude-502/v150`, **28** characters, well
clear of `T-133-s5`'s 116–128 bracket), removed after. No cargo was
built: `index --check` was answered with the already-compiled
`nputer-index` binary pointed at `--root <scratch>`, so no target
directory was touched anywhere. `/Users/ujju/Projects/nputer-T-149`,
`/Users/ujju/Projects/nputer-app` and `/Users/ujju/Projects/arch-verify`
were never entered; this lane's own checkout was entered only to write
this verdict. No `pkill`, no `git update-ref`, no force-push, no history
rewriting, no real model call.

### THE RANGE, DERIVED BY THE PRESCRIBED PRE-MERGE FORM

    git merge-tree --write-tree d85d946 80aab21  ->  tree d306ebd, exit 0 (read from $? FIRST)
    git diff --name-only d85d946 d306ebd   (PRESCRIBED)            ->  7
    git diff --name-only d85d946..80aab21  (two dots, FORBIDDEN)   ->  9
    git diff --name-only d85d946...80aab21 (three dots, FORBIDDEN) ->  7
    git diff --name-only $(git merge-base d85d946 80aab21)..80aab21 ->  7

Main advanced **2** paths since the base (`graph.json` and one card), so
the two-dot trap is only 9-against-7 here — the smallest magnitude this
bullet has recorded in some time, and it still lies. **The three-dot and
merge-base forms agree at 7, which is the FIFTH consecutive agreement and
is luck, not licence** (`T-093`'s seat gains another row). Seven paths:
three under `tools/e2e/`, four the card's own and its three s-cards.
**Nothing outside `touches: [tools/e2e]` except this card's own files,
which are outside every fence by construction.**

### THE FIVE THINGS THE BRIEF ASKED ME TO ATTACK

**1. THE REFUTATION OF ARM 1 — REPRODUCED, AND THE HEADLINE FIGURE IS
EXACT.** Over every live flat `docs/tasks/T-*.md` with `proseOnly`
applied, counting `\d+(?:[.,]\d+)?`:

| ref | live cards | digit runs | census claims |
|---|---|---|---|
| `23ee41b` (the lane's base) | 313 | **75 785** | **64**, or **63** excluding T-150's own card |
| `05a09e4` | 316 | 75 957 | 65 |
| `80aab21` (the tip) | 316 | 75 984 | 65 |
| `d85d946` (main) | 313 | 75 797 | 64 |

**75 785 is exact at the base.** The **63** reproduces only when T-150's
own card is excluded from the corpus; over the whole live board the
figure is **64**. That corpus rule is nowhere stated — reported, not held
against the lane, because the direction of the argument is unaffected.

**The "largest figure class carries no digit" claim HOLDS, and I attacked
its arithmetic directly.** At `23ee41b`, word cardinals measure
**16 486** (`one`…`twenty`), **16 580** (adding the tens) or **16 600**
(adding `hundred|thousand|million`), against the largest DIGIT-bearing
class I could construct — task ids at **9 060** — with component ids
2 050, shas 4 170, dates 670, ADR ids 354 and feature ids 146. **No named
digit class comes within 7 000 of the word class.** The brief's 16 478
and 3 680 do not reproduce under any word list I tried (my `first`…`tenth`
run is **3 647**, my extended list **3 708**); the fifteen classes and the
27 110 residual are not in the tree at all and cannot be re-derived.
**Those four figures are UNVERIFIABLE AS STATED — the class definitions
they are functions of live only in the lane's report.** That is the card's
own subject arriving in the card's own refutation, and it is why the suite
pins the RATIO and not the counts, which is the right call.

**2. THE DECISIVE CLAIM — VERIFIED EXACTLY, ON THE BYTES.** At
`2a922ce`, `docs/tasks/T-141-the-d2-has-an-owner-and-the-choice-was-measured.md`
is **118 lines**, and line 18 reads:

    **T-139's merge created this repository's second D2.** `arch` at
    `ae92f67`: `components=13 files=185 mapped=184 unmapped=1 edges=39

**The rejected sentence and the command share a line; the ref is on the
next one.** No adjacency rule of any window smaller than a paragraph can
separate them. **The marker was present, honest, derived six other
fields, and did not bind.** The card's own caution about arm 1 being
"gamed by adding a marker without re-deriving" did not need gaming — it
had already happened, in good faith, in the record. **This is the
strongest sentence in the diff and it survives every attack I could
mount.**

**AND THE CATCH IS AS PRECISE AS CLAIMED.** `auditCard` over that exact
118-line text returns **exactly one figure: `CENSUS` at line 18** — the
sentence the verifier rejected. One finding, one true positive, zero
noise, re-derived independently of the lane's harness.

**3. M18 IS FIXED, I RE-KILLED IT, AND I HUNTED ITS FAMILY.** Six mutants
of my own, every one moving the PRODUCER, each read back with `git diff`
before its suite ran, each restored and each restoration proved by
`shasum -a 256` against `c9eec07cc22fb570b4f51e47c61da88c014a809e1d3bba93e8147b988a7502c4`:

| mutant | moved | killed |
|---|---|---|
| M18 replay | `const line = offset + i + 1` → `offset + i` | **1** of 27 |
| N1 | `proseOnly` indent threshold `{4,}` → `{8,}` | 2 |
| N4 | the frontmatter offset forced to 0 | 1 |
| N5 | `reproduces`' boundary index off by one | 1 |
| N2 | `CARD_STAMP`'s ref length `{7,}` → `{1,}` | **0 — SURVIVES** |
| N3 | `ANY_PROVENANCE` loosened to `/<-/` | **0 — SURVIVES** |
| N6 | census proximity window `{0,80}` → `{0,400}` | **0 — SURVIVES** |

**M18's own family is closed** — N4 and N5 are the two other index
computations in the module and both die. **The three survivors are all
precision knobs in the over-fire direction**, and they are filed as
`T-150-s5` rather than held against the diff.

**A SEVENTH MUTANT FOUND A REGION NOTHING TESTS, AND IT IS NOT IN
`card-figures.mjs`.** Replacing `brief.mjs`'s
`const findings = [...ctx.findings, ...cardFindings, ...auditFindings];`
with `[...ctx.findings]` makes `--card T-150` **exit 0 instead of 1** —
and `brief.spec.ts` + `card-figures.spec.ts` + `dispatch-order.spec.ts`
come back **62 passed**. The mutant lives. `--card` and `--audit` appear
in no test in this repository (`grep` over `tools/e2e/tests` and
`app/test` returns nothing), so **129 new lines of wrapper, including the
exit-code contract the notes state as a claim, are unpinned.** Filed as
`T-150-s4`. It is not a rejection: the card carries no acceptance
criteria, the verdict logic those lines call is covered by 27 bodies and
a 22-mutant drill, and the gap is the direct cost of a brief-only
prohibition this lane both obeyed and filed as `T-150-s1`.

**4. THE FORMATTING ESCAPE IS CLOSED FOR THE CLASS, AND THE TWO ARMS LEFT
OPEN ARE JUSTIFIED BY A MEASUREMENT I REPRODUCED.** Proven live rather
than from the spec: this card's own four figures sit inside an INDENTED
block at lines 188–191 and `--card T-150` reports all four **VERIFIED**
at `80aab21`. A `card:` stamp inside a fence, inside an indented block,
behind a `>` quote or after a lead-in sentence is all audited. **Then I
asked what the prose-only cut still hides**, over every live card body at
`80aab21`: **3 426 indented non-fenced lines**, of which **47 carry a
bare arrow and ZERO carry a census claim.** Reading those 47: they are
`docs-gate` output, brief transcripts and table annotations — exactly the
"wall of UNRUNNABLE" the module's comment predicts. **The lane's stated
reason for the cut is not a rationalisation; it is a fact about this
corpus, and the census arm loses nothing at all to it today.** The one
residual shape is a stamp inside a markdown table cell, which the `$`
anchor drops — deliberate, and named in `T-150-s6` rather than treated as
a defect.

**5. `--card T-150` EXITS 1 ON ITS OWN CARD AND THE LANE WAS RIGHT TO
LEAVE IT.** Reproduced at `80aab21`: exit **1**, **two** `CENSUS`
findings — line **24** (the card's original body quoting `T-141`'s first
sentence) and line **109** (the notes quoting it again). Both are true
positives under the tool's own rule: each line makes an unstamped ordinal
claim scoped to this repository. **Muting them would be the first act of
gaming the gate, and the exit code consumes nothing** — I verified there
is no CI step, no `package.json` script and no spec that runs `--card`,
and the full e2e lane is **233/233 green with the card standing at exit
1**. Exit 1 means "the command HAS a verdict", which is what it has.
**ONE CORRECTION: the notes say it reports `CENSUS` on "the line" that
quotes T-141. There are TWO.** A card about undercounting undercounts its
own output by one.

### THE HONESTY CLAIM — CHECKED, NOT REWARDED

**`T-141`: caught, precisely — verified above.** **`T-137`: missed, and
the miss is EXACTLY as stated and no larger.** `--card T-137` at
`80aab21` returns *"no figure in this card claims a provenance and no
census claim is made"* — the tool reports **nothing at all** on that
card. The single `blast radius` string in it (line 1403) is inside a
later verdict discussing the rework, not a dispatch figure, and carries
no stamp and no arrow. **The lane could have claimed a partial catch
through `--audit` and did not.** The sentence *"what this fix does to that
failure is PREVENT it rather than DETECT it … and it is weaker than a
catch"* is the correct and less flattering description, and it is the
one the notes chose.

### THE SUITES AND THE GATES, EVERY EXIT READ FROM `$?` UNPIPED

Run in the scratch worktree at `80aab21`, in the fresh-clone ORDER
(parser build FIRST), serialised against a sibling verifier:

- **lib/parser — `npx vitest run` 314/314 across 15 files, exit 0**;
  `npx tsc --noEmit` exit 0, after `npm run build`. (`docs/STATE.md`'s
  290/13 is stale by T-137's two modules — not this lane's.)
- **app — `npm run build` exit 0, `npm test` 1013/1013 across 47 files,
  exit 0.**
- **tools/e2e — `npm test` 233/233, exit 0, 2.3m**, on explicit port
  **15997**, `lsof -nP -iTCP:15997 -sTCP:LISTEN` read **zero rows** at
  **01:11:16** immediately before the bind. Header `Running 233 tests
  using 1 worker` cross-checked against **233** `✓` bodies and 0
  failures. **27 of the 233 are this lane's new spec.**
- **`npm run lint:tokens -- --selftest` exit 0** (65 TOKEN + 4 CONTROL
  samples, 87 walk-policy, 9 evidence-floor); **`npm run lint:tokens`
  exit 0** at **TOKEN 143 / CONTROL 807**; **`npm run typecheck` exit 0.**
- **`npm run lint:docs` exit 0**, and *every live task card's frontmatter
  parses, with a legal status* — the three new s-cards included.
- **DOCS GATE, on the prescribed path list: exit 1**, 4 paths, **19
  derived readers across 4 suites**, naming `npm test from app/`,
  `npm test from tools/e2e/` and `npx vitest run from lib/parser/`.
  **`cargo test from app/src-tauri/` is in the reader list and NOT in the
  run list**, correctly: none of the seven paths is one of its four
  readers. All three named suites were run and all three are green.
- **`cargo test` NOT RUN and NOT OWED** — derived from the gate above,
  not skipped. The diff carries no `.rs`, no manifest and no cargo
  reader.
- **BOOT GATE — NOT OWED**: zero of the seven paths is under
  `app/src-tauri/**`, `app/src/**` or either manifest. No `tauri dev`
  spawned, no port taken.
- **GRAPH REGEN — the trigger does not fire** (`tools/**` is
  `.nputerignore`d and the rest is `docs/`), **and I asked the gate
  anyway.**

### `index --check` IS EXIT 1 AT THIS TIP AND IT IS NOT THIS LANE'S — RE-DERIVED, NOT ACCEPTED

Answered with the compiled binary against three roots, so no target
directory moved anywhere:

| root | exit | headline |
|---|---|---|
| base `23ee41b` | **1** | STALE, `+0 -0 ~2` |
| tip `80aab21` | **1** | STALE, `+0 -0 ~2` — **byte-identical to the base's report** |
| main `d85d946` | **0** | CURRENT, 1020023 of 1040000 bytes (98.1%) |

**It is a REAL red and not the `--root` false red** — it prints both
count lines and a `~` file diff, which is the discriminator
`docs/CONVENTIONS.md` names. The two moved files are
`app/test/architecture-dogfood.test.ts` (loc 2249 → 2266) and
`app/test/map-dogfood-render.test.tsx` (loc 766 → 770), identical at base
and tip, and **the lane's diff touches neither and cannot**. `17e6f8a`
is an ancestor of the lane's base, so `T-150-s3`'s attribution is
correct. `integrator.md` rule 3's parent test returns FILE, and **main
has already taken the one-line repair at `d85d946`** — so `T-150-s3`'s
title (*"index --check is exit 1 on main"*) is now stale while its body,
which stamps `f174d5c` and `92a9181`, stays true. **The half of that card
still worth a lane is the ORDERING rule it names**, not the regen.

### SECURITY SWEEP — CLEAN, WITH ONE HARDENING NOTE

- **No new dependencies.** `tools/e2e/package.json` and both lockfiles
  are untouched by the diff.
- **No shell anywhere.** `git()` is `execFileSync("git", ["-C", root,
  …argv])` — an argv array, no `sh -c`, and `--card`'s id never reaches
  a path or a command; the file read is `ctx.card.file` off the card
  index, not off `argv`.
- **No I/O at import** in `card-figures.mjs`, and no `child_process`,
  `fetch`, `http` or `net` in it at all. The command still writes
  nothing.
- **No ReDoS.** Every added pattern is bounded and non-nested — the
  census claim is `[^.\n]{0,80}?` between two closed alternations — and
  auditing all 316 live cards completes in well under a second.
- **No secrets, keys or tokens in the diff.**
- **ONE NOTE, NOT A FINDING AGAINST THE DIFF:** `--audit` does
  `path.resolve(root, argv)` and will read an ABSOLUTE path or one that
  climbs out of the repository, where the DOCS GATE refuses exactly that
  shape as ambiguous (`T-101-s3`). It is an operator-supplied path to a
  read-only local command, so it is a consistency gap rather than an
  exposure. Filed in `T-150-s6`.

### ARCHITECTURE AND CONVENTIONS CONFORMANCE

- **The exit vocabulary is honoured on every path I could reach.**
  `--help` 0 · `--task T-150` 0 · `--state` 0 · `--dispatch` 0 ·
  `--card` with no value 2 · `--card T-999` 2 · `--audit <missing>` **3**
  with `COULD NOT RUN` and the reason · `--audit <directory>` 3 ·
  `--nope` 2 · a positional 2 · no arm 2. **The three adjacent arms are
  intact.**
- **`unstampedLines`, `STAMP_PATTERN`, `note()`'s no-digit rule and
  `value()`'s throw were not loosened** — `dispatch-brief.mjs` is not in
  the diff at all, and the new module imports the floor rather than
  restating it (T-057).
- **No CI parity exposure.** `docs/CONVENTIONS.md` is untouched, so
  `workflow-parity.spec.ts` has nothing new to claim and the middle-dot
  rule is not in play.
- **No component owns `tools/e2e/`**, so `docs/ARCHITECTURE.md` moves
  nothing: no interface, no `paths:` entry, no declared edge.
- **T-142's caution is discharged and I re-ran it end to end at my own
  ref**, with the control first: `--card T-002` alone **exit 0**; the
  same command with a scratch file carrying `board planned: 9999` under a
  `card:board` stamp **exit 1**, `STALE … board planned: 9999`; the same
  file corrected to the derived line **exit 0**. `board planned: 34` at
  `80aab21`, which is the notes' own figure at `8d4500a`, unmoved.

### EVERY FIGURE IN THE CARD, THE NOTES OR THE BRIEF THAT DISAGREED WITH MY MEASUREMENT

**Two are wrong, four are unverifiable, and everything else is exact.**

1. **`Baseline in the drill worktree: 25 passed at 8d4500a`.** At
   `8d4500a` the spec carries **24** bodies — `git show
   8d4500a:tools/e2e/tests/card-figures.spec.ts | grep -c '^test('`
   returns 24, which is also what the spec's own M18 comment says
   ("stayed green at 24 of 24"). **25 is `f174d5c`'s count.** The drill
   was cut at `8d4500a` and the M18 killer was applied inside it, so the
   run is real; **the REF beside the figure is not the ref that produces
   it.** Counts at each lane commit: 24, **25**, 27, 27.
2. **`reporting CENSUS on the line that QUOTES T-141's rejected
   sentence`.** There are **TWO** such findings, at lines 24 and 109, and
   the command's own stderr says `FOUND 2 thing(s)`.
3. **`63 census claims`** reproduces at **64** over the whole live board
   at `23ee41b`; 63 needs T-150's own card excluded, which is unstated.
4. **`16 478 word cardinals` / `3 680 word ordinals` / `27 110
   unclassifiable` / `fifteen hand-written classes`** — none is
   reproducible: the class definitions are not in the tree. My nearest
   constructions at `23ee41b` are 16 486/16 580/16 600 and 3 647/3 708.
   **The direction survives and the digits do not.**
5. **`T-150-s3`'s title says `index --check` is exit 1 on main.** It is
   **exit 0** on main at `d85d946`. The card's BODY carries its refs and
   stays true; the TITLE does not carry one.
6. **`T-150-s3`: "T-150's merge diff is three paths"** — true at
   `f174d5c`, which the card names; **seven** at the tip, because the
   card and its s-cards joined it.
7. **My own attack set was wrong four times and I am recording it**: I
   predicted the 75 785 corpus rule would be understated and my count
   would differ (it was exact); I predicted a `proseOnly` escape would
   remain open for the class (it does not — 0 hidden census claims); I
   predicted the whole-board false-positive count would exceed what the
   card admits (**282 clean / 34 with findings reproduced to the card**);
   and I predicted the T-137 miss might be understated (it is not).
   **What I predicted correctly was that exit 1 would be defensible only
   if nothing consumes it, and that the unstated corpus rule behind the
   census count would matter.**

### EVERYTHING ELSE REPRODUCED TO THE DIGIT AT `80aab21`

`board live cards: 316` · `fence tools/e2e tracked files: 47` · `fence
tools/e2e tracked bytes: 893489` · `demand tools/e2e cards: 38` — all
four **VERIFIED** by the tool and by an independent walk. **`282 audit
clean and 34 carry at least one finding`** re-derived independently:
**282 / 34 / 316**, 34 of 316 = **10.76%**, so "eleven percent" is right.
Board census `2 building + 106 done + 51 parked + 34 planned + 122
suggested + 1 verifying = 316`, `rejected/` **28**. `card-figures.mjs`
sha256 **`57422b25…`** at `8d4500a` and `f174d5c` as the notes claim, and
**`c9eec07c…`** at `05a09e4` and the tip. T-141's card **118 lines** as
claimed. **`T-150-s1`'s two claims verified**: `brief.spec.ts:659` and
`boot-check-guard.spec.ts:44` both spawn, and neither *"no real model
call in any test"* nor *"no CLI spawn from a test"* appears anywhere in
`docs/CONVENTIONS.md` or `method/`.

### FILED, NOT BLOCKING

`T-150-s4` (the wrapper's 129 lines are untested and its exit contract is
vacuous — proven with a live mutant), `T-150-s5` (both inference arms'
precision is unmeasured and unpinned: 7-of-7 false positives on
UNRUNNABLE, 4-of-65 on CENSUS, three surviving mutants), `T-150-s6` (the
ref inside a `card:` stamp is never validated — a fabricated ref
VERIFIES; plus the `--audit` path shape). **None of the three is a reason
to reject and none is folded into this verdict.**

### WHY APPROVED

The card asked for the derived answer to become cheaper than the
remembered one, forbade a ban on figures, and asked for proof the check
can fail. **All three are delivered.** The arm the lane took is the arm
the card argued for; the arm it refused was refused **by measurement I
reproduced at the base ref to the digit**, not by preference. The one
sentence the whole design rests on — that an adjacency lint PASSES
`T-141`'s sentence because an honest command was standing beside it — is
true on the bytes. The gate re-runs the provenance instead of noticing
it, which is the property arm 1 cannot have, and I could not forge a
figure past it except by moving the ref, which the gate does not claim to
check. **Four suites, two lints and three gates are green at this tip;
the one red is `index --check`, proved byte-identical at the lane's base
and already repaired on main.** The lane found a live mutant in its own
work, fixed it, then found a second defect by dogfooding its own gate
against its own notes and closed that too — and left its own card
reporting a finding rather than muting it.

### POSTSCRIPT — THE VERDICT'S OWN COMMIT STALED THIS CARD, AND THE GATE SAID SO

**`method/roles/verifier.md`'s FIGURE CASE, happening to the verdict that
quotes it.** The commit above (`68d7f16`) filed three suggestion cards.
Re-run at that tip, `--card T-150` returns **three** findings instead of
two: the two standing `CENSUS` lines, and **`STALE line 188: board live
cards: 316`** — because the board is now **319**. The other three pasted
figures still VERIFY, since nothing in that commit touched `tools/e2e`.

**Line 188 is deliberately NOT corrected**, for the same reason the lane
gave for leaving its own two stale figures in: the moment this verifier
re-pastes 319, the next hand to write a card makes it 316's successor all
over again. **The gate is the thing that stays true, not the number.**
This is the third time in three commits that this card's own figures have
gone stale — twice under its author and once under its verifier — and it
is the whole argument the card makes, arriving unprompted for a third
time.

The three cards filed above add **zero** findings of their own: the
board-wide tally is unchanged at **65 CENSUS and 7 UNRUNNABLE**, over
**319** live cards of which **285** audit clean, measured at `68d7f16`.
