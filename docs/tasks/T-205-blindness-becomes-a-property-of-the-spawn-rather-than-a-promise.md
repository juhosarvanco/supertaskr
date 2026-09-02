---
id: T-205
title: BLINDNESS BECOMES A PROPERTY OF THE SPAWN, not a promise — a blind line inside one message is not a blind line, and a verifier can leak to itself
feature: F-06
milestone: 4
priority: 3
size: M
status: done
blocked_by: []
touches: [method/roles, docs/CONVENTIONS.md, tools/method-evals/evals/mf-08-two-spawn-single-source.mjs, tools/method-evals/evals/mf-09-attack-set-digest-refusal.mjs]
suggested_by: "the outgoing architect seat's fix plan (relayed 2026-08-31, approved in direction by @human); six disclosures on 2026-08-31 are the evidence, four against this seat and two self-inflicted"
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

**SIX CONTAMINATION DISCLOSURES IN ONE NIGHT, AND THE VERIFIERS FOUND
ALL SIX.** The current design asks a verifier to *promise* it will not
read something it has already been handed. That is not a property; it is
an honour system, and it failed in two distinct ways.

## The four this seat caused

The dispatch put lane context **below a "blind line" in the same
message**. An agent receives the whole prompt at once, so the line is
decoration. `T-184`'s verifier reported two lane facts reaching it before
phase 1 could start; `T-186`'s reported the same; `T-167-s8`'s and
`T-112-s4`'s each disclosed a leak from the brief's own wording — one
told a verifier to attend to *"fence claims and routing"*, which told it
the lane had made one.

**Three lanes and a verifier raised this independently before the seat
fixed it.**

## The two the verifiers caused THEMSELVES, which is why prose cannot fix it

- One ran `git log --oneline main..HEAD` while deriving a merge-base and
  **read the lane's commit subjects**, which leaked the fix's shape.
- One ran `git log --oneline -5` while orienting, read three of the
  lane's subjects, and **downgraded itself to "corroborator rather than
  independent finder"** on two of its four questions.

**A verifier can leak to itself with an ordinary orientation command.**
No wording in a brief prevents that, because the brief is not the leak.

## What to build

**Phase 1 becomes its own spawn**, with the contract pasted **inline**
and **no file or git tools at all**. It can do exactly one thing: return
an attack set. It cannot read the diff, the notes, the log, or the
worktree, because it has no way to.

**Phase 2 is a second spawn**, receiving the attack set plus the lane.

**Blindness stops being a promise and becomes a property of the spawn.**

## What a fix decides

1. **What phase 1 needs pasted inline** to be useful without tools — the
   card, the base state of the file under test, the role contract. **Too
   little and the attack set is uninformed; too much and the paste is
   itself a channel.** This is the whole design question.
2. **Whether phase 1's output should be hashed.** Three verifiers hashed
   their attack sets voluntarily on 2026-08-31 and it made their claims
   checkable. **Make it the contract rather than a habit.**
3. **What happens when phase 1 asks for something it cannot reach.** A
   refusal channel that returns to the dispatcher is better than a
   verifier guessing — say what it looks like.
4. **Whether the same shape serves a REJECTED verdict**, where phase 2
   may need to re-enter phase 1's frame after learning something.

## Acceptance criteria

- PHASE 1 SHALL run in a spawn with no file, git or shell access, and
  SHALL be able to return only an attack set.
- THE attack set SHALL be hashed, and phase 2's verdict SHALL cite that
  hash — a body SHALL prove a verdict citing a hash that does not match
  the saved file is refused.
- **A POSITIVE CONTROL SHALL prove phase 1 can still produce a USEFUL
  attack set from the inline contract alone** — a phase that returns
  nothing is blindness achieved by uselessness.
- THE method documents SHALL state the two-spawn shape in exactly one
  place, and `method/roles/verifier.md` SHALL point at it rather than
  restate it (`T-057`).
- Verification: the method eval gate plus headless bodies where the
  spawn shape is scriptable.

## Rides the release

This changes `method/`, so it joins the queued method release beside its
five existing riders (`T-112-s2`, `T-154-s3`, `T-159-s6`, `T-154-s4`'s
sentence, and the `T-173`/`T-176` bumps). **It is a method-doc change,
not a tooling change**, and should not be sequenced ahead of the fixes
that end classes which did measurable damage.

## Read beside

`method/roles/verifier.md`, `T-204` (which generates the prompt this card
splits in two), and `T-131` — whose question about the ceremony's cost is
partly a question about how much of it is honour-system.


## Implementation notes (executor claude-opus-5@subagent)

**THE HOME IS `method/roles/orchestrator.md` 5d, AND THE CHOICE OF HOME
IS THE FIRST DECISION.** The two-spawn shape is an ACT, and the method's
own precedence rule gives an act to the acting role's file — the seat
that SPAWNS is the dispatcher. 5c already owned *cut the bench when you
cut the lane*, so 5d sits beside it and the two divide cleanly: **5c
buys the blindness with the CLOCK, 5d buys it with the TOOL GRANT.**
`roles/verifier.md` and `roles/executor.md` now point at 5d; neither
restates it.

**WHAT THE FOUR DECISIONS WERE DECIDED AS.**

1. **The paste has TWO bounds, not one, and that is what makes *too
   little / too much* answerable.** The BASE REF bounds what can LEAK —
   nothing that existed at the cut is downstream of the executor, so
   volume cannot contaminate, while a seat's SUMMARY can at any length.
   The CARD'S CRITERIA bound what is worth SENDING. A fence naming a
   directory or a 117KB document is the ordinary case, so the dispatcher
   chooses and then NAMES the ref and the sections it pasted — which is
   what makes an under-paste recoverable through the refusal rather than
   invisible.
2. **Hashed before phase 2 is spawned; the verdict cites the digest; a
   mismatch is REFUSED.** `MF-09` holds that refusal.
3. **The refusal channel is the only other thing phase 1 may return**,
   and it absorbed a conflict this card did not name: step 0 told phase
   1 to MEASURE a ground truth, and a spawn with no shell cannot. So
   phase 1 returns the LIST of measurements it wants and the dispatcher
   takes them AT THE BASE REF. `roles/verifier.md`'s sentence moved from
   *measure it in phase 1* to *ask for it in phase 1*.
4. **A REJECTED verdict re-enters by SPAWNING AGAIN, never by
   remembering** — a new phase 1 against the amended card, its own hash,
   stamped as a re-entry, and the fix judged against BOTH hashes.

**AND A FIFTH THING NOBODY ASKED FOR, BECAUSE THE BLIND ARMS BOTH NAMED
IT**: a CONTINUATION of phase 1's session is not a second spawn, and the
paste may never carry the diff, the notes, the report, the commit log or
a post-cut figure. Both clauses are in 5d.

### The positive control, and its result was NOT what was expected

Two blind phase-1 spawns were run on this card, both reporting
`tool_uses: 0`. **Arm A** got the paste 5d prescribes (card at the base
ref, `roles/verifier.md` step 0 at the base ref, 5c at the base ref) and
returned **20 attacks plus a refusal naming three things it could not
reach**. **Arm B** was starved to the title and the acceptance criteria
alone and returned **35 attacks plus a refusal**. **The naive
expectation — starved returns less — is false, and the criterion is met
by the arm that was supposed to fail.**

What the paste actually bought was **AIM, not volume**: roughly 26 of
arm B's 35 attacked a code implementation this card explicitly excludes
(*a method-doc change, not a tooling change*), while arm A's set was
aimed at the documents under change. **A counter of attacks would have
graded the starved arm better**, which is why `T-205-s3` exists and why
its criteria forbid a length assertion. The other measured result is
that **arm B's REFUSAL did the work the paste would have done** — it
named T-057's text, the spawn API and the eval registry as things it
lacked — which is decision 3 validating decision 1 rather than
duplicating it.

**THE LIMIT, DISCLOSED RATHER THAN CLOSED**: both arms were *asked* not
to use tools, because the harness this lane ran in has no tool-free
agent type. `tool_uses: 0` is the harness's own report, not a grant.
**An instruction not to look is the honour system this card exists to
end**, so the enforcement is routed as `T-205-s2` (app-dispatch), where
the grant can actually be narrowed.

### Measurement

`MF-08` (single source + pointer) and `MF-09` (digest refusal) are the
committed readers. Before they existed the criteria were measured by a
reader run **both ways** over the base tree and the lane tree — 7
findings at the base, 0 in the lane, and 8 of 8 hand degradations of the
NEW text detected, so the reader can fail on the new text and not only
on the old. `MF-08`/`MF-09` carry the arms that survive as a gate; the
scratch reader additionally covered decisions 3 and 4 and AC-1's
return-bound, which stay document properties with no committed reader.

### Routed, with the fence each needs

- `T-205-s1` — nothing INVOKES MF-09's comparison against a real
  verdict; the saved file is in a scratchpad no gate may walk.
- `T-205-s2` — the two-spawn shape has no EMITTER; `brief.rs` assembles
  one brief with a marker, which 5d names as the fallback.
- `T-205-s3` — the usefulness floor has no mechanical reader, and the
  control above says why a naive one would be worse than none.
- `T-205-s4` — MF-02 cannot resolve a LETTERED sub-step, so every
  pointer at `5d` dangles silently the day 5d is renamed.
- `T-205-s5` — `brief.mjs --role verifier` exits 3 for EVERY verifier
  brief; blocked_by `T-225-s2`, which holds that fence.
- `T-205-s6` — GRAPH REGEN's trigger omits `.mjs`, so this lane's own
  gate derivation had two readings and the right answer was reached from
  the graph rather than from the bullet.

### Not done, deliberately

**No method version bump.** This card's own *Rides the release* section
says it joins the queued release, and `docs/CONVENTIONS.md`'s
`currently v0.1.9` line is untouched.

## VERDICT

**APPROVED** — claude-opus-5@subagent, 2026-09-02, judged at
`48285b59436f09dde15add678968958a53ade4b5` on a detached bench cut from
`c08f2604ca23cc69a7afd6c4c5fc8fb4891e8762`.

attack set: sha256:0fdbb5510c29ad202944a814df3f602d68c4e75bb366f2905ff06ca280f9d2a7 (attack-V-T-205.md)
ground truth: sha256:a34b2998386332d9e6a59c5a6be395513dc67b853483e60dfd7108d6a11af912 (ground-V-T-205.md)

**THE FRAME I ACTUALLY HAD, which 5d now requires me to name.** Phase 1
was a fact about the CLOCK, not a discipline: this bench was cut at the
base stamp and the attack set and ground truth were sealed at
2026-09-02T10:41:15Z, before the lane tip, its branch, or any diff of it
was named to me. **But my phase 1 was NOT the tool-less spawn 5d
describes** — it held a shell and measured its own ground truth, which is
what `roles/verifier.md` at the BASE REF told it to do (*"measure it in
phase 1"*). The card is judged at its base ref, so that was the contract
in force; 5d changes it to *ask*, and this pass is the last one that will
have been run the old way. Two further disclosures: my saved file is
`attack-V-T-205.md`, not the `attack-set-<card id>.md` the new CONVENTIONS
bullet prescribes, because the name predates the rule; and while checking
whether my own `gate-run` was blocked on the solo lock, `pgrep` surfaced a
peer seat's command line showing the lane was running its e2e suite — a
scheduling fact, no content, recorded at seal time rather than omitted.

### Every criterion re-derived, not transcribed

**AC-1 — phase 1 in a spawn with no file, git or shell access, returning
only an attack set. MET for the document half; enforcement correctly
ROUTED.** `roles/orchestrator.md` 5d states the construction normatively,
and it answers all four of the card's *What a fix decides* questions:
the two bounds on the paste (base ref bounds what can LEAK, criteria
bound what is worth SENDING) with an explicit prohibition on ever pasting
the diff, notes, report, commit log or a post-cut figure; the hash; the
refusal channel as *the only other thing phase 1 may return*; and
re-entry after a REJECTED verdict by spawning again. It also carries a
clause the card did not ask for and needed — **a CONTINUATION of phase
1's session is not a second spawn** — which closes the obvious cheap
reading of the rule. No emitter narrows the grant today; that is
`T-205-s2`, routed by exact fence (app-dispatch), and the card says
plainly that the control arms' `tool_uses: 0` was the harness's own
report and not a grant. **I pre-committed, before seeing the diff, that a
`SHALL` with no artifact outside prose would be a rejection, and that a
correctly-routed out-of-fence criterion would not be. This is the second
case, and it is disclosed rather than concealed.**

**AC-2 — the attack set hashed, the verdict citing it, a body proving a
mismatch is refused. MET.** 5d mandates it, `verifier.md` puts the
citation on the verifier, `docs/CONVENTIONS.md` spells `shasum -a 256`
and the citation line. `MF-09` is the body: a five-row matrix
(MATCH/MISMATCH/MISSING/ABSENT/PREFIX) whose MISMATCH row uses a
well-formed digest of DIFFERENT REAL content rather than a fake value.
I drilled the subject rather than reading it:
- fail-closed → fail-open on the unreadable file: **RED at MISSING**.
- the ACCEPT branch → REFUSE (a judge that refuses everything passes four
  of five rows): **RED at MATCH**. The happy path carries weight.
- equality → `startsWith`: **survived**, and it is an EQUIVALENT mutant,
  not a defect — the citation regex is 64-hex anchored, so on reachable
  inputs the two are the same function. I proved that rather than argued
  it: loose regex + equality stays green (correct), loose regex +
  `startsWith` **REDs at PREFIX**. The row is load-bearing against the
  realistic composite.
- the CONVENTIONS citation grammar struck: **RED**.

**AC-3 — a positive control proving phase 1 can still produce a USEFUL
attack set from the inline contract alone. MET, with its limit named.**
The control was run with two differently-armed spawns, so no single
arrangement decides both sides. Its result contradicted the builder's own
expectation — the STARVED arm returned more attacks (35 v 20) — and the
card reports that against itself, concluding the paste buys AIM rather
than volume and that a counter would have graded the starved arm better.
That is a control that could fail and nearly did. **The limit, which the
card states first and I confirm: the arms' outputs are not in the tree and
their counts are not re-derivable by me, and `tool_uses: 0` was
self-reported.** `T-205-s3` owns the mechanical floor and its criteria
forbid a length assertion, which is the right lesson from the result.

**AC-4 — the shape stated in exactly one place, `verifier.md` pointing
rather than restating. MET.** My own census, run with the whitespace
flattening the phrase requires (my first grep found nothing because the
phrase spans a newline — the flattening is load-bearing, and I was wrong
before the eval was): **exactly one declarer in `method/`,
`roles/orchestrator.md`, and none in `docs/`.** At the base I had recorded
three declarers — `verifier.md` step 0, `orchestrator.md` 5c,
`executor.md`'s brief rules. `verifier.md` now cites
`roles/orchestrator.md` three times and carries only the conduct that is
its own; `executor.md` points and keeps only the fallback. The new
`docs/CONVENTIONS.md` bullet is a SPELLING (names and commands), says so
in its own first line, and does not restate the shape.
`MF-08` holds both halves. I drilled it three ways against the real tree:
- the shape COPIED into `verifier.md`: **RED**, naming 2 files.
- the pointer STRUCK from `verifier.md`: **RED**, naming the missing cite.
- **the declaration DELETED entirely — the zero case, which neither of
  MF-08's own degrade arms exercises**: **RED**, *"no method file
  declares phase 1 as its own spawn…"*. I checked the branch the eval's
  own control leaves untested, and it holds.

Every mutation was read back from `git diff` before its run, and every
restoration proved by `sha256` against the tip.

**Kill-set containment (step 2b).** Neither eval's kill set contains the
other's: MF-08's three arms leave MF-09 green and MF-09's four leave
MF-08 green. Both are load-bearing; neither is a restatement.

**Verification line — the method eval gate. MET.** 9 of 9 model-free,
exit 0; `--selftest` 9 of 9, exit 0. Both read un-piped.

### Gates, all measured by me at the ref stated

| gate | result | ref |
|---|---|---|
| `gate-run parser` | exit 0, **372** bodies, GREEN | `48285b5` |
| `gate-run app` | exit 0, **1141** bodies, GREEN | `48285b5` |
| `gate-run rust` | exit 0, **639** bodies, 18 targets, GREEN | `48285b5` |
| `gate-run e2e` | exit 1, **619** bodies, RED — **2 failures, both environmental; attributed by control below** | `48285b5` |
| method evals | exit 0, 9 of 9 | `48285b5` |
| method evals `--selftest` | exit 0, 9 of 9 | `48285b5` |
| docs-gate, touched paths | exit **1** — FIRES, correctly | `48285b5` |

**THE E2E LEG IS RED, AND IT IS NOT THIS DIFF — PROVED BY CONTROL, NOT BY
READING.** `gate-run e2e` at the tip: exit 1, 619 bodies, **2 failed /
617 passed**. Both failures are in `tests/session-economics.spec.ts`
(:179 and :365) and both carry ONE cause, printed by the assembler
itself:

    T-216-s8 holds a worktree on refs/heads/task/T-216-s8-unjudged-push-refused
    and no live card declares that id

Both bodies assert `brief.mjs` exits 0; `brief.mjs` exits 1 because a
PEER SEAT's live worktree names an id no card on the board declares
(`T-216-s4` and `T-216-s7` exist; `T-216-s8` does not, at the tip and at
the base alike). **The attribution is a measurement:**

- the same spec run alone at the tip `48285b5` — 2 failed, 8 passed;
- the same spec run alone at the base `c08f260`, **where this diff does
  not exist** — **the same 2 failed, the same 8 passed, the same
  `T-216-s8` line**;
- and this bench measured `c08f260` at **619 bodies GREEN** at
  2026-09-02T10:39:44Z during phase 1. **The same ref went green to red
  with no commit between them**, which no diff can do.
- the diff touches nothing under `tools/e2e` and does not touch
  `docs/STATE.md`.

I was offered a pre-supplied attribution for this leg — a known
`push-guard.spec.ts` holder control near line 2718. **It is not what
failed here**, and I did not apply it. The failing bodies are
`session-economics.spec.ts` :179 and :365, and I attributed them by
running the base ref rather than by accepting a name. Filed as
`T-205-s8`.

**A RED I CREATED AND CHASED DOWN, recorded because attribution is this
seat's most common failure.** My first `gate-run app` was **RED**, 14
bodies failing across 6 files. Every one was a *"no build output at
app/dist/assets"* refusal: my bench had `npm install` but no `npm run
build`. It is the diff's innocence and my bench's fault, and the bodies
refuse to skip rather than passing vacuously, which is the right design.
After building: 1141 GREEN. **`rust` I measured at the tip
`48285b5`, not at `7547c96`** — the second commit touches only
`docs/tasks`, which no cargo body reads (the `docs/tasks` strings under
`app/src-tauri` are all fixture writes into temp trees), but the whole
point of this seat is not to accept that reasoning from the lane.

### The invariants I pre-committed at the base, re-checked

- Fence: writes land only in `docs/CONVENTIONS.md`, `method/roles/**`,
  the two eval files the fence was widened to, and `docs/tasks`. **The
  six routed cards are not a breach**: `UNFENCEABLE_PATHS` is
  `['docs/tasks']`, so no card may reserve it and every card writes
  there. I re-derived the widened fence through `expandFence` myself —
  4 paths, 0 issues, 0 unusable. **The widening is the dispatching
  seat's, made on main at `a2335c6` at the executor's request by exact
  path, and that commit touches only this card.** Widening from inside
  the lane is the one repair the executor may never make, and it did not.
- **No method version bump**: `docs/CONVENTIONS.md` still holds exactly
  ONE `formats are version-bumped` line and it still reads
  `currently v0.1.9`, against `METHOD_SNAPSHOT_VERSION = "0.1.9"`. Two of
  the three stamps are outside this fence, so a bump here would have red
  `cargo test`; the card rides the queued release instead. **`cargo test`
  green confirms it.**
- `executor.md`'s normative brief table is still **13 rows** — a
  fourteenth would have red MF-01 with no deriver in `brief.mjs`.
- All five role files still open `# Role: <stem>` (MF-03).
- The prose couplings `dispatch-brief.mjs` reads off the role files are
  **unchanged**: `readSubtractions(verifier.md) === ["docs/ROADMAP.md"]`,
  `readAdditions === []`, `docsNamed` in its four-entry order, and both
  executor figures. This is the region the lane rewrote, so it was the
  likeliest silent break; it did not happen, and the e2e suite agrees.
- `docs/CONVENTIONS.md` is **122,043** bytes against a 146,878 warn line.
- Board frontmatter parses with legal statuses; no new title opens with a
  YAML reserved indicator.

### Security sweep (mandatory, step 3)

Two new `.mjs` files, both eval-only. No `child_process`, no `exec`, no
`eval`, no network, no environment reads. Writes are confined to
`mkdtempSync` under the system temp dir and removed in a `finally`. No
dependency additions anywhere in the diff. `judge()` takes the saved
file's path from its INVOKER and never parses it out of the verdict text,
so there is no traversal surface from untrusted verdict content today —
**and that is the one thing `T-205-s1` should not change casually**: an
invoker that learns the path from the verdict it is judging lets the
verdict choose the file it is checked against. Nothing here is
REJECTED-level.

### Findings — not failures, and they block nothing (step 6)

- **`T-205-s7` (filed by this seat).** `MF-09`'s digest-command conjunct
  is inert: `docs/CONVENTIONS.md` has carried `shasum -a 256` in the
  POISON DRILL bullet since long before this card, so striking the T-205
  bullet's own command spelling leaves the eval at **exit 0** (measured).
  The citation-grammar conjunct beside it is load-bearing (measured RED),
  so the check as a whole is not vacuous — but one half of it cannot
  fail, inside a guard written to end exactly that.

- **`T-205-s8` (filed by this seat).** Two `session-economics` bodies
  assert the assembler exits 0 and therefore inherit `git worktree list`,
  which is machine-scoped and belongs to no ref. Under the concurrent
  lanes this project runs by design, they red for whoever measures last
  and the red is attributed to their diff. Fourth member of the family
  the SCRATCH RULE, the PORT RULE and the E2E PORT rule already name.
  Independent of T-205; found while attributing this pass's own red.

**What I looked for and did not find**, recorded so a later reader can
tell a checked claim from an unexamined one: no claim anywhere in the
lane that the method eval gate covers what it does not — the card states
outright that AC-1's return-bound and decisions 3 and 4 *"stay document
properties with no committed reader"*; no restatement of the shape
smuggled into `docs/CONVENTIONS.md`; no figure quoted without its ref;
and no edit to `method/tasks/TASK-FORMAT.md`, whose *"nothing can verify
that a verifier stayed blind"* sentence this card's thesis strains. That
sentence is out of fence and in a SHIPPED kit file, and leaving it for
the release rather than reaching outside the fence was the correct call
— **but it is now the one place in `method/` that argues against the
construction 5d builds, and the queued release should not land without
it being revisited.**

### Gates re-run at MY OWN tip (step 7)

This verdict and the two findings are commits, and prose is a code input.
The DOCS GATE, handed the three paths my own commit touched, answered
**exit 1 — FIRES**, and named `npm test` from `app/`, `npm test` from
`tools/e2e/` and `npx vitest run` from `lib/parser/`. Discharged, every
figure measured at the commit this verdict created:

| gate | result | ref |
|---|---|---|
| `gate-run parser` | exit 0, **372** bodies, GREEN | this verdict's own commit |
| `gate-run app` | exit 0, **1141** bodies, GREEN | this verdict's own commit |
| method evals | exit 0, 9 of 9 | this verdict's own commit |
| method evals `--selftest` | exit 0, 9 of 9 | this verdict's own commit |
| the four e2e specs that READ `docs/tasks` — `landing-gate`, `push-checks`, `shell-frame`, `window-contract` | exit 0, **46** bodies | this verdict's own commit |
| docs-gate, my own three paths | exit **1** — FIRES, correctly | this verdict's own commit |

**Why the e2e half is discharged by four spec files and not by the whole
suite.** The full leg's only red is the `T-216-s8` worktree condition
established above — environmental, reproduced at the base ref, and
independent of anything either commit contains. What MY commit could
newly move is the set of bodies that READ `docs/tasks`, because it adds
two cards there; the DOCS GATE names those four spec files by path, and
all 46 of their bodies pass at this verdict's own commit. Running the other 34 spec files
again would re-measure a red I have already attributed and would not
answer a question about this commit. **The figures above were measured at the commit this verdict creates** —
a commit cannot carry its own sha, so git's history is the ref and the
verifier's report names it. Every figure quoted ABOVE this section
carries the ref it was measured at, which is the only form that stays
true after the next write.
