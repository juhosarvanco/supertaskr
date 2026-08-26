---
id: T-150
title: Briefs derive every figure and refuse to emit one without provenance — cards do not, and two of three cards on 2026-08-26 were rejected on a number their author typed from memory
feature: F-06
milestone: 4
priority: 1
size: M
status: verifying
blocked_by: []
touches: [tools/e2e]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
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
