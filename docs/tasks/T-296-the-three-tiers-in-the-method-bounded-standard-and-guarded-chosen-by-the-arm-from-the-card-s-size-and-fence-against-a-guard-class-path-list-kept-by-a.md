---
id: T-296
title: The three tiers in the method — bounded, standard and guarded, chosen by the arm from the card's size and fence against a guard-class path list kept by a test; phase 1 spawned by the arm beside the build and its ground taken by a script; the standard verifier's mode (diff before notes, the rubric, a row per criterion); the executor's criteria echo and self-drill block; the keeper green at the base before dispatch (ADR-024)
feature: F-01
milestone: 4
size: M
priority: 1
status: verifying
suggested_by: "@human (2026-09-10): \"Rule the loop room, A to I as amended: yes\" — docs/rooms/loop-cost-and-speed.md, ADR-024"
blocked_by: [T-295]
touches: [method/tasks/TASK-FORMAT.md, method/roles/verifier.md, method/roles/executor.md, method/roles/orchestrator.md, tools/e2e/scripts/dispatch-brief.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/scripts/card-preflight.mjs, tools/e2e/scripts/merge.mjs, tools/e2e/tests/brief.spec.ts, tools/e2e/tests/card-preflight.spec.ts, tools/e2e/tests/merge.spec.ts, tools/e2e/tests/brief-flush.spec.ts, docs/CONVENTIONS.md]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

Every card today gets the same bench regardless of size, and the seat hand-writes both phases' briefs and takes the ground by hand. The tier is derivable from the card: its size, whether any fenced path is on the guard-class list, whether method text is fenced, and whether a keeper already pins the property. Blocked by T-295 so the verb it dispatches into exists.

## Acceptance criteria

- WHEN a card is dispatched THE arm SHALL classify it bounded, standard or guarded from its size, its fence against the guard-class list (hooks, gates, fences, the parser, the push and gate scripts, method text — a list in the method kept by a body that reds when a guard-class file is not on it) and whether a keeper pins the property, and SHALL print the tier and the reason; a card the arm cannot classify SHALL be refused, never guessed.
- WHEN the tier is standard THE arm SHALL spawn phase 1 tool-less at dispatch beside the executor, take the ground by a script (the fenced files' hashes, the census, the spec's body names, the arm's rendered findings), seal the three inputs by hash, and spawn phase 2 at the stamp with a brief assembled from the card and the tier; WHEN the tier is guarded THE seat's further ground asks SHALL be added by hand and the whole suites run.
- WHEN verifier.md is read THE standard mode SHALL be stated once: the diff before the executor's notes, the rubric (each criterion literally, boundaries, data mutants, the security sweep), a row per criterion with its evidence, corrections as committed bodies with MUTANT BLOCKs; WHEN executor.md is read THE criteria echo before coding and the self-drill block in the report SHALL be stated once; the eval gate SHALL run and the bump SHALL carry its block.
- WHEN a lane is cut THE arm SHALL run the fence's keeper spec at the base first and refuse a red baseline naming the body; WHEN a bounded card's diff at merge exceeds the XS bound THE merge SHALL bump it to standard.
- WHEN TASK-FORMAT.md is read THE tier SHALL be a derived field on the card, written by the arm at dispatch, never by an author.

## Implementation notes

**THE CRITERIA ECHO, written before a line of the implementation** (this
card's own criterion 3, applied to itself). Restated as a checklist:

1. The arm classifies every dispatch bounded / standard / guarded from
   the card's size, its fence against a guard-class list kept by a test,
   and whether a keeper already pins the property; it PRINTS the tier and
   the reason; a card it cannot classify is REFUSED naming what it could
   not read.
2. On the standard tier the arm renders phase 1 tool-less AT DISPATCH,
   takes the ground by a script, seals three inputs by hash, and renders
   phase 2 at the stamp; on the guarded tier the seat's further ground
   asks are added by hand and the whole suites run.
3. verifier.md states the standard mode ONCE; executor.md states the
   criteria echo and the self-drill block ONCE; the eval gate runs; the
   bump carries its block.
4. The arm runs the fence's keeper at the base and refuses a red
   baseline naming the body; a bounded card past the XS bound is BUMPED
   at the merge rather than refused.
5. TASK-FORMAT.md makes `tier:` a DERIVED field, written by the arm at
   dispatch and never by an author.

**WHERE EACH ONE LANDED.**

**Criterion 1 — the classifier.** `classifyTier` in
`tools/e2e/scripts/dispatch-brief.mjs` is a pure function of the card and
the tree. Guard-class outranks every size; L is guarded; XS is the only
size that can reach bounded, and only with every fenced path tracked and
a keeper answered green. Everything else is standard. The three
unreadable things are refusals with their own sentences: no `size:`, a
fence entry that expands to no path, and — for a bounded candidate only —
a keeper question the runner could not answer. The tier and its reason
are printed as step two's own ledger line and again in the block of lane
facts. The guard-class CLASSES live in `method/tasks/TASK-FORMAT.md`
under "The guard-class list" (seven of them, each argued in one line) and
the PROJECT's mapping of them onto paths lives in docs/CONVENTIONS.md's
GUARD-CLASS PATHS bullet — the same split this method already takes for
every lane spelling. The arm reads both and refuses either direction of a
disagreement. The keeper body derives this repository's candidates FROM
THE TREE by a rule that never reads the map (everything under `.claude/`,
`.github/workflows/`, `method/`, `lib/parser/src/`, plus every script in
`tools/e2e/scripts/` whose own name carries gate, guard, fence, lock,
push or landing) and reds naming any candidate no class covers: 61
candidates, 0 uncovered at this tip.

**Criterion 2 — phase 1 at dispatch, phase 2 at the stamp.** The ritual
grew three steps and now has eleven: `keeper` and `tier` in FRONT of the
stamp (a red baseline refused before anything is written, and the tier
stamped INTO the commit the lane inherits) and `phase1` at the end.
`renderPhase1` is a pure function whose parameter list IS the guarantee —
no root, no branch, no ref later than the base — and the arm feeds it the
card as `git show <base>:<card>` returned it, read at the stamp step
before any lane branch exists. The arm cannot spawn a seat and says so in
as many words; what it prints is the line to paste.
`brief.mjs --bench <id>` is the other end: it derives the tip off the
bench worktree and the base off `git merge-base`, writes the ground
(every fenced file's git blob and byte count at the base, the census
section and the body NAMES of every fenced spec, and the arm's own
preflight findings), seals the attack set, the ground and the card at the
base by sha256 into the stamps file, and renders the phase 2 brief from
the card, the tier, the tip and those digests. The guarded tier's
addendum has its own heading in the ground file and the phase 2 brief
names the whole battery for it; the standard tier gets the range's owed
set.

**Criterion 3 — the method text.** `method/roles/verifier.md` gains "The
standard mode, stated once": the diff before the notes, the rubric
(steps 2, 2b and 3 in order rather than re-summarised), a row per
criterion with its evidence, corrections as committed bodies with mutant
blocks, and the owed set rather than the whole battery.
`method/roles/executor.md` gains "The criteria echo, and the self-drill
block". `method/roles/orchestrator.md` 5b gains the tier stamp and the
keeper at the base, and a new 5e says who renders what.

**Criterion 4 — the keeper at the base, and the bump.** The keeper run is
DERIVED from docs/CONVENTIONS.md's blessed gate-runner bullet (the
script, the scoped suite, the `--owning` flag and the verdict token), so
nothing here types a runner path. Its answer is read off the OUTPUT and
not off the exit, and there are three answers, not two: graded green,
graded red, and NOTHING GRADED. That third one matters immediately — the
scoped derivation refuses rather than grades when it cannot place a
fenced path, and a fence naming method text is the ordinary case, so a
dispatch that read the exit alone would report every guarded card's
baseline as red. At the merge, `xsBoundFinding` became `xsBoundBump`: the
step passes, prints the bump, and writes `standard` onto the object the
readings step reads, so the band reading carries the bumped tier with
nobody typing `--tier`. The merge also now reads its tier off the card by
default.

**Criterion 5 — the derived field.** `tier:` is in TASK-FORMAT's
frontmatter block with the rule beside it, and both halves are enforced
in different places on purpose: the card preflight REPORTS a tier on an
undispatched card (where deleting a line is still the whole fix), and the
dispatch OVERWRITES whatever is there and announces the overwrite when
the two disagree. `stampCard` gained a per-key, anchored creation opt-in
so the field can be written onto a card whose template does not carry it;
every other missing key still refuses exactly as before.

**THE CLOSING BATTERY FOUND ONE RED AND IT WAS MINE.** The guard-class
map spelled `gate-run.mjs`, and `gate-run.spec.ts` requires
docs/CONVENTIONS.md to name the blessed runner in exactly ONE place — a
body in a file this fence does not name, redding on a line this fence
does. The map now matches the runner by SHAPE (a trailing `*` prefix
token) rather than by filename, which is the honester statement anyway:
what makes a file guard-class is being a gate runner. The trap is now
pinned where the map is written, so the next lane to touch it learns
before its battery rather than after.

**In-fence follow-through**

- `tools/e2e/tests/brief.spec.ts`, "the tier line is CREATED where a card
  has none" (about 12 lines): the drill found this body's arming-absent
  assertion passing for the WRONG REASON — the mutant it was meant to
  kill throws the same error CLASS from one branch further on, so the
  body now names the SENTENCE. The property is unchanged; what moved is
  whether the body can tell the two refusals apart.
- `tools/e2e/tests/brief.spec.ts`, the ritual's per-step harness (about
  30 lines): the two step numbers it typed (`> 6`, `> 2`) are now derived
  from `DISPATCH_STEPS`, because this card put three steps into that
  ritual and a typed number would have moved silently under them.

**What the verifier should look at hardest.** The keeper step's third
answer (nothing graded) is the branch that decides whether a guarded
card's dispatch proceeds, and it is decided by the ABSENCE of a verdict
line — a shape a mutant can make vacuous. The classifier's bounded branch
is the one with the smallest kill set: three conditions, each of which
falls to standard, and only the unanswered-keeper case refuses.

## The method bump, for the integrator

Four method files moved in this lane — `method/tasks/TASK-FORMAT.md`,
`method/roles/verifier.md`, `method/roles/executor.md` and
`method/roles/orchestrator.md` — so the METHOD EVAL GATE fires at this
merge and the method version moves with it. The version at the base is
`v0.1.20`, read out of docs/CONVENTIONS.md's own stamp line rather than
remembered, and the verb performs the bump:

    node tools/e2e/scripts/brief.mjs --merge T-296 --bump 0.1.20..0.1.21

The three stamp files are `merge.mjs`'s own `METHOD_STAMP_FILES` and are
not re-listed here. The gate was run in the lane and answered 0 over 11
model-free evals at the lane's tip; the merge's own run is the one that
grades the merged tree, and the block above is what tells it which
version to move to.

## Meters

- wall clock: about 100 minutes end to end, read off the session's own
  timestamps: the standing read and the design against the room's tier
  table 20 min; the method text 15 min; the arm, the classifier, the two
  renderers and the bench 30 min; the bodies 15 min; the drill and the
  battery 20 min.
- tier: guarded (the fence names method text and five guard-class paths).
- the self-drill: 16 mutants, 16 red, 16 restored and proved by sha256 —
  one of them only after the body it drilled was corrected, which is the
  drill earning its place rather than confirming it.

## Verdicts

### 2026-09-10 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tier GUARDED, blind two-phase bench, judged at tip `9b8f69e8747755181083b62b2e33c6ed8005fe29`
over base `9dc05597b7646bc542368ebdd20088787053ce90` on a detached bench.

attack set: sha256:3e4cdb25fe8674cf22c6c2cc8b784b31e435ff5f9e41ff0e933e5e75de894d80 (attack-set-T-296.md)
ground: sha256:a534206aa6b6da813c6000195857be5c7a300d018eb59d2194950e3239d51256 (ground-T-296.md)
ground addendum: sha256:6aa3f184385f801806a819bc3da5261d2d91c7ab82c689aa7b504f313450fece (ground-T-296-addendum.md)

**THE FRAME I ACTUALLY HAD.** Two spawns. Phase 1 was a separate, tool-less spawn that
returned the attack set above with `tool calls made: 0`; I am a fresh phase 2 and never held
its frame. My brief was HAND-WRITTEN by the seat and carried NO CONTEXT PACK — I say so
because the role file requires it, and I read `docs/CONVENTIONS.md` by the sections I needed
rather than end to end. That brief DID name executor-derived figures (suite counts, a byte
size, a file/line total, a candidate count), each explicitly flagged in it as "a CLAIM until
you re-measure it"; phase 1 was sealed before my spawn and carried none of them, so the
blindness that matters was not spent. I re-measured every one of those figures myself and
they are cited below at my own refs. I read the diff, the tree and the specs BEFORE the
executor's report, the ask file, the card's notes and the commit messages, in that order.

**THE FENCE HELD.** 17 files, +2712/-63, every one inside the twelve fenced paths plus
`tools/e2e/tests/brief-flush.spec.ts` (granted by fast path A at `c4516354`) and `docs/tasks/`.
No fenced file is untouched — all twelve moved. `brief-flush.spec.ts` moved by exactly four
added lines and zero removed: the single `--bench` NOT_AN_ARM entry, character for character
the entry the lane's ask proposed, and nothing else in that file. `lib/parser/`, `gate-run.mjs`,
the landing gate, the push guard and every other spec are untouched. The method stamp stays
at v0.1.20; the `--bump 0.1.20..0.1.21` block on the card is the integrator's.

**THE SUITES, AT MY OWN TIP `9b8f69e8`, THROUGH THE BLESSED RUNNER, WHOLE — the guarded rule.**

| leg | verdict | bodies | exit |
|---|---|---|---|
| parser | GREEN | 389 | 0 |
| app | GREEN | 1171 | 0 |
| rust | GREEN | 655 | 0 |
| e2e | GREEN | 910 | 0 |

Scoped, by name, at the same tip: `brief.spec.ts` 100 passed / exit 0, `card-preflight.spec.ts`
58 passed / exit 0, `merge.spec.ts` 27 passed / exit 0. The method eval gate exits 0 over 11
model-free evals. `brief.mjs --task T-296 --preflight` exits 0. The docs gate exits 1 with the
same owed-readers listing it gives at the base, plus `budget WARN — docs/CONVENTIONS.md is
147605 bytes against its 146878-byte warn line`, which T-296-s2 already carries. The behaviour
census is STALE at the tip (committed 79859 bytes against a fresh 81211) — the integrator's
regen, and outside this fence.

**A ROW PER CRITERION, WITH ITS EVIDENCE** — the shape this card's own `verifier.md` section
now requires, applied to itself.

| # | criterion | verdict | what decided it |
|---|---|---|---|
| 1 | classify from size, fence and keeper; print tier and reason; refuse rather than guess | MET, with correction 1 | `classifyTier` is one pure function with ONE call site in the arm. I drove its whole table: M + a hooks path → guarded; XS + method text → guarded; L → guarded; S and M → standard; XS + tracked + keeper → bounded; XS + untracked → standard; XS + unpinned keeper → standard. Guard-class outranks size at every size. No `?? "standard"` anywhere on the path. Three refusals, each naming which input failed: no `size:`, an unresolvable fence entry, and an XS card whose keeper question is unanswered — and an M card with the SAME unanswered question is NOT refused, so there is no over-refusal. An unreadable map REFUSES (`carries no "THE MAP:" sentinel`) rather than falling through to standard. Determinism: 25 calls, one answer. The reason names every deciding token AND its classes. Correction 1 is a containment gap in the fence-to-class match, not a defect in this structure. |
| 2 | phase 1 by the arm, ground by a script, three inputs sealed, phase 2 at the stamp; guarded adds the seat's asks and the whole suites | MET | `renderPhase1`'s PARAMETER LIST is the guarantee — no root, no ref later than the base — and the arm feeds it `git show <base>:<card>` read at step 3, before any lane branch exists. I rendered a 19,018-byte fixture card through it: the last sentence of the last criterion survives, no ellipsis, no slice. The card is delimited and labelled as the card's own text. I ran `--bench` end to end on a scratch clone at BOTH tiers: standard seals attack set + ground + the card at the base and owes `--range <base>..<tip>`; guarded owes `parser\|app\|rust\|e2e — the whole battery` and points the seat at the ground's own `## The seat's addendum` heading. I recomputed both digests by hand against the stamps file and they match. |
| 3 | the standard mode stated once in verifier.md; the criteria echo and self-drill block once in executor.md; the eval gate runs and the bump carries its block | MET | All four method files and CONVENTIONS are ADDITIONS ONLY — zero removed lines across the whole diff — so no pinned sentence could be reworded, and the blind two-phase text survives intact by construction. `The standard mode, stated once` occurs once, in `verifier.md`; `executor.md`'s single other mention is a POINTER to it. `criteria echo` and `self-drill` occur once each, in `executor.md`. The section carries all five owed things including the row-per-criterion table. Eval gate exit 0 over 11. The bump block is on the card. |
| 4 | keeper spec at the base, refusing a red baseline by name; a bounded card over the XS bound bumped at merge | MET, with correction 2 | The ritual is now ELEVEN steps with `keeper` at 1 and `tier` at 2, both BEFORE the stamp at 3 — so both new refusals precede every mutation, which the base's eight-step order (stamp at 1) could not offer. I drove a refusal and confirmed no worktree, no branch, no stamp and no port were taken. The runner is DERIVED from the blessed gate-runner bullet rather than typed, and `keeperVerdict` keeps three answers apart. Correction 2 is that the third answer misses one of the runner's own words. The bump: `xsBoundFinding` became `xsBoundBump`, fires at 41 and not at 40 (T-295's operator kept), judges XS and no other size, exits CLEAN, and writes `io.tier` so the bands' reading carries `standard` without anybody typing `--tier`. T-295's refusal body was RETARGETED and RENAMED, not deleted: `merge.spec.ts` goes 26 → 27 and every delta is accounted for in both directions. |
| 5 | `tier:` a derived field on the card, written by the arm, never by an author | MET | `TASK-FORMAT.md`'s frontmatter block carries `tier:` marked DERIVED and its "The tier" section states the rule once, with both halves placed on purpose. I drove both: the preflight REFUSES a hand-written tier on an undispatched card (exit 1, naming the file and the remedy), and the dispatch OVERWRITES it with a printed note. The stamp inserts `tier:` immediately after `size:` and the following line survives intact — no reflow, no eaten newline. Cards carrying the key parse: the parser leg is green at 389 and the docs gate reports every live card's frontmatter parsing with a legal status. |

**THE SECURITY SWEEP.** No new shell is reached anywhere in the diff — no `execSync`, no
`shell: true`, no template-built command string; the keeper runs through an argv array, so a
fence token carrying a semicolon or a command substitution is one argument and not a command.
The card is read with `git show <ref>:<path>` through an argv array, so the zsh colon-modifier
hazard does not arise. Author self-tiering is closed in all three channels the attack set
named: the `tier:` field is overwritten at dispatch, the keeper input is derived from a real
runner rather than from a card field, and the XS bound is read from the project's own constant
and not from anything the card can carry. The forbidden-spelling keeper finds ZERO hits across
all 2,712 added lines — no rename class, no personal name, no absolute path — which is the
class of miss that redded T-287's closing battery. The one finding of this sweep is correction
1: a false NEGATIVE in the guard-class match, which is the direction that costs verification
rather than the direction that costs time.

## The corrections

Three. Two carry a body I committed on this bench after this verdict, run RED against the
implementation as the lane leaves it and GREEN against the implementation carrying the fix,
each with its block below. The third is a wording change and owes no block, said in as many
words so the shortfall is not read as a body nobody wrote.

**CORRECTION 1 — A FENCE NAMING A DIRECTORY NAMES THE GUARDS INSIDE IT.** `guardTokenCovers`
asks only whether the MAP's token covers the fenced path, never whether the fenced path
CONTAINS the token. `tools/e2e/scripts/` is a tracked directory holding six tokens this
project's own map calls guard-class — the gate runners, the lane fence, the lane lock, the
push checks and the merge verb — and `lib/` holds `lib/parser/`. A size-M card fencing either
classifies **standard**. This is not theoretical and it is not caught downstream: I dispatched
a fixture card with `touches: [tools/e2e/scripts/]` through the real arm on a scratch clone and
all eleven steps ran clean — preflight exit 0, phase 1 rendered — printing
`tier: standard — size M, no guard-class path in a fence of 1 path(s)`. The lane would then
edit five guards under one verifier instead of the blind bench, which is the exact trade this
tier exists to prevent. The same function also misses a leading `./`: `./method/roles/verifier.md`
classifies standard where `method/roles/verifier.md` classifies guarded, and I ran that pair as
a control — the arming differs by two characters. The `./` half is refused downstream by the
preflight's stale-path class, but only as a side effect and only AFTER the tier is stamped on
the integration branch at step 3; the directory half is refused by nothing. The fix answers
both questions and strips a leading `./` before asking either, and it keeps every existing
boundary: `methodical/x.md` still does not hit `method/`, and the prefix form still does not
match `lane-lock.mjs`. RED: the body fails at
`tools/e2e/scripts/ holds tools/e2e/scripts/gate-*, ...` with `Expected: "guarded"`,
`Received: "standard"`. GREEN: `brief.spec.ts` 102 passed, exit 0, with no other body moved.

```mutant
correction: a fence naming a directory names the guards inside it, and a leading ./ is not a different path
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: A FENCE NAMING A DIRECTORY NAMES THE GUARDS INSIDE IT, and a leading ./ is not a different path
message: tools/e2e/scripts/ holds tools/e2e/scripts/gate-*
--- old
export function guardTokenCovers(token, rel) {
  // BOTH DIRECTIONS, BECAUSE A FENCE NAMES A REGION AND SO DOES A CLASS.
  // A fenced path may sit UNDER the class's token, and it may equally
  // CONTAIN it: `tools/e2e/scripts/` is a tracked directory holding the
  // gate runners and `lib/` holds the parser, so a card fencing either is
  // a card editing them. Asking only the first question answered
  // `standard` for a fence over five mapped guards. A leading `./` is the
  // same path written the way a relative path usually is written, and is
  // stripped before either question is asked.
  const r = rel.replace(/^\.\//, "").replace(/\/+$/, "");
  if (r === "") return false;
  if (token.endsWith("*")) {
    const prefix = token.slice(0, -1);
    return prefix !== "" && (r.startsWith(prefix) || prefix.startsWith(`${r}/`));
  }
  const t = token.replace(/\/+$/, "");
  if (t === "") return false;
  return r === t || r.startsWith(`${t}/`) || t.startsWith(`${r}/`);
}
--- new
export function guardTokenCovers(token, rel) {
  if (token.endsWith("*")) {
    const prefix = token.slice(0, -1);
    return prefix !== "" && rel.startsWith(prefix);
  }
  const t = token.replace(/\/+$/, "");
  if (t === "") return false;
  return rel === t || rel.startsWith(`${t}/`);
}
```

**CORRECTION 2 — A RUN THAT PUBLISHED `verdict=REFUSED` GRADED NOTHING.** `keeperVerdict`'s
own comment is right about the danger and stops one word short of it: it keeps *nothing was
graded* apart from *graded and red* by asking whether the runner published a verdict LINE, and
then decides green against red from the PROCESS EXIT. But `gate-run.mjs` publishes its answer
as a word on that very line — its vocabulary is `GREEN`, `RED`, `REFUSED`, `SCOPED-GREEN`,
`SCOPED-RED` — and its own header says REFUSED "is never a green run and never a red one".
A scoped run that collects zero bodies exits non-zero and publishes
`verdict=REFUSED ... reason=zero-bodies`; the arm reads that as *the fence's own keeper is RED
at the base* and stops the dispatch. I met this for real, not by construction: dispatching a
fixture whose fence resolves to one owning spec stopped at step 1 with
`the fence's own keeper is RED at the base — exit 3 — gate-verdict ... verdict=REFUSED
reason=zero-bodies`. It is the mirror of the over-refusal the function was written to prevent,
and a card RESERVING a new spec file — the new-file reservation T-287 ruled legal — is the
in-tree shape that reaches it, since a spec with no bodies yet grades zero. The fix reads the
word on the line it already went looking for. RED: `the runner REFUSED to grade, so nothing
was graded`, `Expected: false`, `Received: true`. GREEN: as above. The body carries two
controls — a graded RED and a graded GREEN both still answer `graded` — so an implementation
answering `graded: false` for everything cannot pass it.

```mutant
correction: a keeper run that published verdict=REFUSED graded nothing, and that is not a red baseline
file: tools/e2e/scripts/dispatch-brief.mjs
spec: tools/e2e/tests/brief.spec.ts
body: A KEEPER RUN THAT PUBLISHED `verdict=REFUSED` GRADED NOTHING, and a dispatch does not call that a red baseline
message: the runner REFUSED to grade, so nothing was graded
--- old
  // THE VERDICT WORD IS ON THE LINE THIS READER WENT LOOKING FOR, and a
  // reader that greps for that line and then decides from the process
  // exit has not read it. `gate-run.mjs`'s own header says REFUSED "is
  // never a green run and never a red one" — it means nothing was graded,
  // which is the third answer this function exists to keep apart from the
  // second, and reading it as red refuses a dispatch over a baseline
  // nobody measured.
  if (lines.some((l) => /\bverdict=REFUSED\b/.test(l))) {
    return {
      graded: false,
      green: false,
      detail: `exit ${String(r.status)} — ${lines.join(" / ")}`,
    };
  }
  return {
    graded: true,
    green: r.status === 0,
    detail: `exit ${String(r.status)} — ${lines.join(" / ")}`,
  };
}
--- new
  return {
    graded: true,
    green: r.status === 0,
    detail: `exit ${String(r.status)} — ${lines.join(" / ")}`,
  };
}
```

**CORRECTION 3 — THE RITUAL'S OWN HEADER STILL SAYS EIGHT. NO BLOCK, AND THE REASON IS THAT
THERE IS NO PROPERTY TO PIN**: this is a wording change, and the reader reports the correction
count beside the block count so that a shortfall is visible rather than inferred. The comment
block above `DISPATCH_STEPS` in `tools/e2e/scripts/dispatch-brief.mjs` says *"eight steps, in
the order the documents fix"*, *"The eight steps below are that order, and `DISPATCH_STEPS` is
the only place it is written down"* and *"a real failure at any one of the eight steps without
cutting eight worktrees"*. The table below it now holds ELEVEN, and this lane is what put the
extra three there. The sentence is load-bearing in the worst way — it tells the reader that
the table is the single source and then states a count of its own — and the lane's own
follow-through fixed exactly this hazard one file over, deriving two typed step numbers from
`DISPATCH_STEPS` "because this card put three steps into that ritual and a typed number would
have moved silently under them". The same argument applies to the prose. Replace the three
counts with eleven, or drop the number and let the table carry it. `brief.mjs`'s "eight hand
steps" is NOT included: those sentences describe the HAND ritual of `orchestrator.md` 5b/5c,
which this card did not lengthen, and correcting them would be a different claim.

## What I drove and did not find

The attack set's twenty mutants and eight controls are answered here rather than left listed.
**M-01** (size tested before guard-class) is dead: guard-class is tested first and an M card
with a hooks path is guarded. **M-13** — a fence token RESERVING a not-yet-existing file under
a guard class, which phase 1 rated the single most likely real defect — is dead: the hit test
runs over the fence's paths and never stats them, so a reserved `.claude/hooks/` file and a
reserved `method/roles/` file both classify guarded. **M-14** is dead: an unreadable map throws
and refuses; there is no fall-through to standard. **M-04**/**M-05** are dead: the keeper input
comes from a real runner and an author's `tier:` is refused before dispatch and overwritten at
it. **M-07** is dead by construction, not by care — the renderer cannot see the worktree.
**M-11** is dead at 39/40/41. **M-16** is dead: the ground names its base ref and says in its
own prose why it is taken there. **M-19** is dead: the reason names the token AND its classes.
**M-12** is the one that landed, as correction 1. **M-06** does not apply as written — method
text is not a separate branch but a guard CLASS, which is the better shape and is note (b)'s
allowance. **C-5** and **C-7** both ran and both hold. The prefix match is anchored: a name
that merely extends a class's characters does not hit.

**THREE EXPOSURES I AM NOT ASSIGNING AS CORRECTIONS, EACH FILED AS A CARD** (T-296-s4, s5, s6),
because each fix is either outside this fence or a design choice the seat should make rather
than one a verifier should impose. They are stated here so the verdict does not read as a
silent pass on them. First: the guard-class mechanism does not guard itself. The module the
classifier lives in, the document the map lives in, and every local module a mapped guard
imports are all UNCOVERED — a card fencing only the classifier classifies by its size. Second:
the map is read from the DISPATCHING CHECKOUT'S WORKING TREE rather than at the base ref, and I
proved it moves the answer: an uncommitted edit to the map on the integration branch re-tiered a
method-text card from guarded to standard while the committed map still said `method/`. Third:
criterion 4's keeper is VACUOUS for a fence of method text alone — `deriveOwning` maps no
`method/` path to any spec, so the runner refuses the scoped reading and the keeper question
goes unanswered. The lane handles that honestly with a printed note rather than a silent pass,
which is the right behaviour for a gap it cannot close inside its fence; but the switch
`dispatch.keeper_at_base` buys nothing for exactly the guarded population it was priced for.

**WHAT THE LANE DID WELL, RECORDED BECAUSE A VERDICT THAT ONLY LISTS DEFECTS MIS-PRICES THE
WORK.** The ask was parked at the START by fast path A, named the entry it needed verbatim,
kept building, and landed exactly that entry and nothing else. The report names a mutant that
SURVIVED its first drill and says the body was passing for the wrong reason — the drill earning
its place, reported rather than quietly fixed. The RED e2e run at `a61eb3b6` is reported beside
the green one with its ref and its cause, rather than replaced by it. Both in-fence
follow-through entries are declared, small, and inside the manifest. And the report's own
"what the verifier should look at hardest" points at the keeper step's third answer, which is
where correction 2 is — the executor's least-confident line naming the defect, which is the
thing step 0's blindness exists to let a verifier confirm independently.

## Meters

- wall clock — phase 1: not mine, a separate tool-less spawn (`tool calls made: 0`).
  Phase 2: 29 minutes from the sealed-hash check (22:10:30) to this verdict (22:39), of which
  the whole four-suite battery ran about 13 minutes and the scoped re-runs about 3, both
  detached and waited on by marker while the reading and the drills went on.
- context consumed — about 320K tokens of a 1M window.
- model — claude-opus-5@subagent, opus 5, effort unchanged from session start.
- suites run — the whole four legs once at my own tip through the blessed runner
  (parser 389 / app 1171 / rust 655 / e2e 910, all GREEN, all exit 0); `brief.spec.ts`,
  `card-preflight.spec.ts` and `merge.spec.ts` alone by name (100 / 58 / 27, all exit 0);
  the method eval gate (exit 0 over 11); the card preflight (exit 0); the docs gate over the
  changed paths (exit 1, the same owed-readers answer as the base, plus the CONVENTIONS budget
  warn); `capabilities --check` (STALE, the integrator's regen).
- bodies graded — 2 committed on this bench, each run RED against the implementation the lane
  leaves and GREEN against the implementation carrying its fix, each carrying its own
  arming-absent controls.
- mutants drilled — 2 at their own sites, both landings read from `git diff` rather than from a
  mutator's report. Beyond those I drove the classifier's whole truth table, both refusal
  paths, the ancestor and normalisation shapes in both directions, the XS bound at 39/40/41
  across four sizes, the seal by recomputing both digests by hand, the phase 1 renderer against
  a 19,018-byte card, and the full dispatch ritual on six fixture cards in a scratch clone.
