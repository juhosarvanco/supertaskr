---
id: T-303-s1
title: "Codex sessions can claim checkout ownership without sharing another task's identity — the seat-taking arm derives a Codex session's identity from the codex process and its thread id, refuses a missing or malformed thread id without touching the holder record, and keeps every Claude identity and holder record compatible"
feature: F-03
milestone: 4
size: M
tier: standard
priority: 1
status: verifying
suggested_by: "the Codex orchestrator's recovery sitting (2026-09-11): the seat-taking arm refused a real Codex ancestry because sessionIdentity recognised Claude only, and a Codex desktop task's nearest harness ancestor is one app-server process shared by every task on the machine; built and approved in the recovery clone at its commit 2ab710fa and reused here as a patch (sha256 51dffca9fbbd7e6e7c3235e9ebfa87fb36e8d0bfc78c4f7ab499f465e89c9a92), to be judged on this bench"
blocked_by: []
touches: [tools/e2e/scripts/checkout-currency.mjs, tools/e2e/scripts/brief.mjs, tools/e2e/tests/checkout-currency.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## What was measured

The seat-taking arm (`brief.mjs --take-seat` and `--release-seat`) derives who is asking from the process ancestry: `sessionIdentity` in checkout-currency.mjs walks up to a process whose program is `claude`, or a Node process running the Claude CLI, and records its pid and start time. A Codex session has no such ancestor. Its nearest harness process is a `codex` app-server that every Codex task on the machine shares, so the pid alone would make different tasks compare as one owner, and the arm answers COULD NOT RUN. The recovery sitting of 2026-09-11 measured on this host that a Codex task exposes its own logical id as `CODEX_THREAD_ID`, a UUID, while `CODEX_SESSION_ID` belongs to the parent session and is inherited by a subagent; the thread id is therefore the identity and the session id is never a fallback.

The recovery clone's implementation, its commit 2ab710fa, passed the whole battery there and received an independent verdict there. Neither is this card's evidence: the code re-enters this repository as a patch the executor applies and re-derives, and this lane's bench judges it.

Under the owner's ruling of 2026-09-12 no Codex session writes to this repository until a write-time fence exists for it, so the consumer of this card today is the loop's own Claude seat: the same patch tightens the Claude matcher (the Node form must be the executable itself, never an argument that mentions the package) and makes `--take-seat` refuse an unreadable holder record instead of replacing it, which changes the remedy T-238-s1 recorded.

## Acceptance criteria

- WHEN a supported Codex CLI or desktop task claims a checkout THE identity SHALL distinguish its logical task as well as the live process incarnation; two tasks sharing an app-server SHALL never compare as the same owner.
- WHEN CODEX_THREAD_ID is absent or malformed THE Codex identity SHALL be refused with an actionable diagnostic, without creating or releasing a holder record; CODEX_SESSION_ID SHALL NOT substitute for it. A valid distinct subagent thread SHALL remain identifiable when its inherited session ID differs.
- WHEN an existing Claude session uses the ownership commands THE current valid identity and holder records SHALL remain compatible, and unrelated executables or arguments mentioning a harness SHALL not identify a session.
- WHEN holder records are written and read THE logical identity SHALL survive the round trip, invalid records SHALL fail closed, and a different task SHALL be unable to release a live holder; focused bodies SHALL prove both acceptance and refusal.

## Implementation contract

- The executor starts from the recovery patch the seat exported to the scratch directory as `t303-s1-recovery.patch` (its sha256 is in the frontmatter), applies it in the lane with `git apply`, and then re-derives every criterion against the tree as if the code were its own. What the re-derivation finds wrong it changes, and the notes say what and why.
- The fence is the three files named in `touches:`. `brief.mjs` is in it because the arm's acquisition path otherwise proceeds from an unreadable holder record to a write; no other file is granted.
- A `CODEX_THREAD_ID` value is never echoed into a diagnostic, and appears in a holder record only inside its identity block.
- The integration seat proposes the exact dated amendment to T-238-s1 for the owner's approval and appends it during integration through the existing records process. The executor does not edit T-238-s1; its implementation notes identify the changed unreadable-holder remedy.
- The recovery verdict, its commit 330f43c7, may be read by the seat when dispatching; it is not shown to this lane's phase-two verifier before its own judgement is written.

## Implementation notes
<!-- executor appends before finishing -->

### The criteria echo, written before the code was read

Restated in my own words, one line each, from the card alone and before
the recovery patch was applied to this lane:

1. A Codex task's identity carries a LOGICAL id as well as the live pid
   and start time, so two tasks hanging off one shared app-server
   process never compare equal.
2. A missing or malformed thread id refuses the Codex identity with a
   diagnostic a reader can act on, writes and removes no holder record,
   and never falls back to the session id; two subagent threads under
   one session id stay distinguishable.
3. A Claude session's identity and every holder record it already wrote
   keep working unchanged, and a program that merely mentions a harness
   in its arguments identifies no session.
4. The logical id survives write then read of a holder record, a record
   of the wrong shape fails closed rather than reading as vacant or as
   a live holder, a different task cannot release a live holder, and
   bodies prove the yes and the no of each.

### How the patch entered, and what it is evidence of

The recovery patch was verified by its sha256 before anything else,
applied with `git apply` on the dispatch stamp, and then read as a diff
rather than as a result. The recovery clone's own battery and its own
verdict are named in the card and are not cited here: what follows is
this lane's re-derivation against this tree, and the corrections below
are the places where that re-derivation disagreed with what arrived.

### What the re-derivation changed

- **A sentence the patch broke in half.** The unreadable-record refusal
  in the seat arm prints three note lines. The middle line was reworded
  from "removing it would" to "replacing or removing it would" and the
  words "retire an" were lost with the old wording, leaving the arm
  printing "replacing or removing it would / unread claim and destroy
  the only evidence of whose it was." No body asserts that line, so
  nothing was red; the words are restored.
- **A branch no body can reach any more, said out loud.** The arm now
  derives the acting identity BEFORE it branches, and refuses with
  CANNOT_RUN when that derivation failed. That precondition is the only
  way the holder verdict ever returned its underivable code, so the
  later live-record branch is now unreachable. It is kept as the catch
  if the precondition is ever relaxed, and it now carries a comment
  saying no body reaches it, because a branch that reads as live
  coverage and is not is worse than no branch.
- **A missing body for the card's own opening sentence.** Every arriving
  body that proves two tasks sharing an app-server are told apart proves
  it at the comparison function or at the verdict. None proved it at the
  ownership commands, which is where the sentence is spent. A new body
  drives both commands through a process table where every invocation
  lands on ONE invented ancestor with ONE start time, so the process
  incarnation is identical by construction and the logical task is the
  only thing left that can separate them: one task takes the seat, the
  other is refused BOTH the takeover and the release with the record
  preserved byte for byte, and the task that took it releases it as the
  positive control.
- **Two header repairs.** The process-row reader had prose wedged
  between its parameter and return tags; it moves above them and now
  says WHY the executable is a second read rather than a wider column
  list — an executable value on this platform can itself hold spaces, so
  a single row carrying both has no parseable boundary. The Codex
  predicate's command argument is accepted and never read, which now
  says so in its header rather than reading as an oversight.

### The criteria, with what answers each

1. **Logical task as well as process incarnation.** The identity walk
   returns the nearest ancestor whose EXECUTABLE basename is the Codex
   one, and attaches the validated thread UUID to the pid and start time
   it already carried. The comparison is all four fields, so two tasks
   on one app-server row differ. Proved at the comparison, at the
   verdict, and now at the commands themselves.
2. **A missing or malformed thread refuses, touches no record, and the
   parent session id never substitutes.** The thread source is read
   once, checked against a canonical UUID shape, and refused otherwise;
   the refusal names the variable and never its value. The commands
   derive the identity before any branch that writes or removes, so a
   refusal returns CANNOT_RUN with nothing created and nothing removed,
   measured against a vacant seat, a dead record, a live record and an
   unreadable one. A subagent with its own valid thread is accepted
   whatever the inherited session context says, including a malformed
   one and an absent one.
3. **Claude sessions and their records stay compatible.** The native arm
   is unchanged in effect: the executable basename is the harness name.
   The interpreter arm now requires the executable itself to be the
   interpreter before it will read an argument at all, so a program that
   merely mentions the package in a positional argument, and every
   option-leading form, identifies nothing. Records with no logical
   identity read and write exactly as before, and every neighbouring
   suite that drives the seat arm under a fake harness stays green.
4. **The round trip, the closed failures and the refused release.** The
   logical identity is canonicalised at the write and at the read, so it
   survives; a record carrying half of it, or a provider this reader
   does not know, or a task id that is not a UUID, is refused rather
   than read as a legacy record; and the release refusal is proved end
   to end against a live holder belonging to another task on the same
   process. Every one of those has its positive control in the same
   fixture.

### What the record this changes, which this lane did not edit

`--take-seat` used to write over a record whose shape it could not read.
It now refuses, and that retires the remedy T-238-s1 recorded for that
state. Two places rest on the old one and both are the seat's to amend
at integration through the records process, not this lane's to touch:

- T-238-s1's item about the sibling arm states that the documented
  remedy is unchanged because re-taking the seat still does exactly
  what the verdict's sentence says. That sentence is now false.
- T-238-s4 is a live suggested card whose whole subject is that
  `--take-seat` replaces an unreadable record without announcing it, and
  whose premise is that re-taking is the right remedy. The replacement
  is gone, so the card is moot; its fence is a subset of this one.

The verdict's own sentence for the unreadable state was changed with the
behaviour it described, and the arm's finding now says the same thing:
inspect the record, then repair or delete it only once its claim is
established as retired.

### In-fence follow-through

- The broken refusal sentence, one line moved, restoring the property
  that the arm's own explanation of what it refused is a sentence.
- The unreachable-branch comment, eight lines added, restoring the
  property that a reader can tell live coverage from a kept fallback.

### Measured here, at this lane's own tip

- The executable is a SECOND process read per ancestor rather than a
  wider column list. Cost at the walk's own bound of twenty-four hops,
  measured on this host: thirty-three milliseconds for one read per hop
  against fifty-six for two. The walk is bounded and the verdict reaches
  it only when a record is present and parsed, so this is disclosed
  rather than optimised.
- The behaviour census goes stale on this diff: test titles changed and
  two were renamed, and the generated capability list carries them. That
  regeneration belongs to the merge commit by this project's own
  standing rule, and the generated documents are outside this fence, so
  nothing here regenerates them. The integrator owes
  `npm run capabilities` in the merge commit, which also refreshes the
  generated index.
- No ask file was written. Everything the re-derivation wanted to change
  was inside the armed fence, and the two things outside it are the
  merge's regeneration and the seat's records act, both already assigned
  elsewhere.

### For the verifier

- The interpreter arm reaches the FILESYSTEM to disambiguate a flattened
  spaced entrypoint. That is a new surface inside a predicate a guard
  calls, it is reached only after every cheaper refusal, and it is the
  subject of a suggested card that proposes reading the true argument
  vector instead.
- The refusal exit for a session that cannot name itself moved for one
  case: a release asked of a VACANT integration checkout used to be a
  clean nothing and is now an inability. That is the price of deriving
  the identity before the branch, it is the fail-closed direction, and
  it is the subject of the other suggested card.

## Verdicts

### 2026-09-12 — claude-opus-5@subagent (verifier, phase 2) — APPROVED WITH ASSIGNED CORRECTIONS

Tier standard, one pass at the tip 4c1fb0bc919283a681dc392ec64ffaa35ed6d6d0, base
3c6a7895dc22b1c6ed59c49d345b1e8ca85a6ec7, bench detached at that tip.

**The sealed inputs, cited.** The first was written in phase 1 from the card at the base and
hashed before any diff existed. The second was taken at the base by the arm, and carries the
seat's twelve further measurements appended under its own heading and sealed inside the same
digest — two of the twelve report themselves as NOT TAKEN, with the claim they would have
settled labelled as an attributed report.

attack set: sha256:e766374ffd719ac068d8b3ba1fdce9122699e09e1fa094fa471efed529166fd5 (attack-set-T-303-s1.md)
ground truths: sha256:66617324018b6d86dfb6332d6efc32859bc1b6bb3c2f62480dd88b40dddbfa02 (ground-T-303-s1.md)
card at the base: sha256:72011e1752ea3a344de7feac03352f34e5ce86e8aaa02cc326c51234aad22320 (docs/tasks/T-303-s1-codex-session-ownership.md at 3c6a7895)

All three recomputed on this bench and matched before anything else was opened; the bench's
working tree was empty at the tip named above.

**The frame I actually had.** Two spawns, guaranteed by the spawn and not by a discipline I
kept: phase 1 held no tools and no diff, and I am a fresh phase-2 spawn that cannot reach its
frame. The brief's duties section named no executor-derived specific — no mutant number, no
path count, no suite figure — so phase 1 was not broken above the line. I read the diff, the
tree at the tip, and my own measurements before the executor's notes, the report or the
lane's commit messages, and those three were opened only at step 5. I did not open the
recovery clone or the recovery verdict 330f43c7, and neither the diff, the notes nor the
report quotes either to me.

**A PACK GAP, and what it is and is not.** The brief carried a postscript of ground rules and
paths and NO context pack at all, so no rule this fence implicates was handed to me. This
project's own STATE already says the arm renders no verifier brief yet and that phase briefs
are hand-written until the card building one lands, so this is a known shortfall rather than a
dispatcher's slip — but the shortfall is real, and my role file's answer to it is to read the
conventions whole and say in the verdict that I did: 153943 bytes at the base, read end to end
through a helper briefed with the fence and the subject alone and never with the executor's
report, returning the bullets this surface implicates. Nothing it returned contradicts the
diff or this verdict, and the informative part of its answer is that the document names NONE
of this fence's own subject — no holder record, no seat arm, no session identity — so what a
pack for this fence could have carried is the adjacent process-reading, host-independence,
scratch, port, positive-control and poison-drill rules, all of which this pass kept. The two documents the standing read names were read at the base
directly. The card preflight this bench runs DOES render a pack, which is where a missing one
could come from at little cost.

**The suites the range owes.** Derived on this bench rather than taken from the brief, which
named only the end-to-end leg:
`gate-run.mjs --owed-set --range 3c6a7895..4c1fb0bc` answers app, e2e and parser, with the
end-to-end leg WHOLE. Graded through the blessed runner on the same range at the tip:

| leg | ref | count | exit | verdict |
|---|---|---|---|---|
| parser | 4c1fb0bc | 389 bodies | 0 | GREEN |
| app | 4c1fb0bc | 1171 bodies | 0 | GREEN |
| e2e | 4c1fb0bc | 1020 bodies | 0 | GREEN |

Each count is non-zero, so no leg is an exit over nothing. The owning spec of every property
drilled below ran alone as well: 53 bodies at the tip, 55 after the two bodies this verdict
commits.

## A row per acceptance criterion

| # | criterion | what decided it | verdict |
|---|---|---|---|
| 1 | a supported Codex task's identity distinguishes the logical task as well as the live incarnation; two tasks sharing an app-server never compare as one owner | `sameIdentity` compares provider and task id as well as pid and start time. Three bodies carry it — at the comparison, at the holder verdict, and at BOTH ownership commands against one invented ancestor row, so the incarnation is identical by construction. Mutant: drop the task-id term; three bodies red, at the site. My own probe: a Claude identity and a Codex identity on the same pid and start time do not compare equal, so the discriminator is part of the comparison | MET |
| 1b | the same criterion's "CLI or desktop" half | NOT MEASURABLE HERE and said so rather than assumed: the ground records that no Codex CLI or desktop task was running at the base, and none was running during this pass either. Both forms rest on ONE rule — the ancestor's executable basename — and I judged that rule's text and its behaviour against constructed rows and against the real neighbour executables running on this host. The claim that a desktop task's nearest harness ancestor carries that basename is an ATTRIBUTED report in the ground, not a measurement of mine | MET ON THE RULE, ONE HALF UNMEASURED |
| 2 | absent or malformed thread id refused with an actionable diagnostic, no record created or released; the parent session id never substitutes; a valid distinct subagent thread stays identifiable | Twenty-five boundary values driven through the Codex identity check on this bench: only a full-match UUID in either case is accepted; no trim, no case fold and no normalisation happens BEFORE validation, so padded, prefixed, suffixed, two-line, wrong-length, non-hex, braced, URN, zero-width and non-ASCII-digit values all refuse. The refusal names the variable and carries no value. Mutant: make the session id a fallback; three bodies red. At the commands: a refusal is an inability against a vacant seat, a dead record, a live record and an unreadable one, with the bytes preserved each time. The subagent clause is pinned in both directions rather than being true by construction | MET |
| 3 | an existing Claude session's identity and holder records remain compatible; unrelated executables or arguments mentioning a harness do not identify a session | The compatibility half is discharged against a BASE-CAPTURED fixture and not one the new writer made: the ground's own record, verbatim, parses identically under the base reader and the tip reader, still compares as the same owner, and its bytes are untouched. The tip's writer, handed a legacy identity, emits the base shape exactly. Unknown identity and top-level keys still parse, so the reader did not tighten forwards. On this host the live harness's executable basename still matches, and a symlink named for the harness keeps its name in the process table, which is the shape the neighbouring suite's stand-in rests on. The Claude negative half is drilled across nineteen constructed shapes and four real spawned processes. The CODEX negative half rests on ONE shape — CORRECTION 1 | MET, WITH CORRECTION 1 |
| 4 | the logical identity survives the round trip, invalid records fail closed, a different task cannot release a live holder, and focused bodies prove acceptance and refusal | The round trip runs through the real acquisition command and the real file, not through a serialise-parse pair. Four invalid logical shapes are refused rather than read as legacy, each with its legacy positive control in the same fixture. The foreign release is proved in the CODEX shape specifically — same process row, same start time, different task — and refused at both the takeover and the release with the record byte-identical, the task that took it releasing it as the control. Mutants at the two arm sites red one and two bodies respectively, at the site. The containment clause the implementation contract states is pinned only on the refusal path — CORRECTION 2 | MET, WITH CORRECTION 2 |

## The security sweep

Mandatory in this tier and run in full. The new input is an environment variable, and it is
validated against an anchored full-match UUID before it is used for anything; the value never
reaches a path, a filename, a lock name, a comparison key or a shell. The record is built by
serialisation and never by templating. The process table is read through an argument vector
with a numerically coerced pid and no shell. No dependency was added and no lockfile moved.
The refusal path leaks nothing, and I measured the SUCCESS path too: on a scratch fixture the
value appears exactly once in the whole checkout, inside the identity block, and in neither
stream of a successful acquisition, nor in the currency command's structured output, nor in
the board census arm. The derivation seam is in-process only — there is no environment
variable and no flag that mints an identity — and an environment carrying a well-formed thread
id with no supported ancestor derives nothing.

ONE NEW SURFACE, DISCLOSED RATHER THAN FAILED: the interpreter arm now reaches the filesystem
to disambiguate a spaced entrypoint that the process table has already flattened. It is
reached only after every cheaper refusal, its failure direction is closed rather than open,
and the lane's own T-303-s3 proposes removing the ambiguity class instead of guessing at it.

## Findings that are not failures

- **A second record the change makes stale.** The card's contract assigns the integration seat
  one amendment. There are two documents resting on the retired remedy, not one: T-238-s4 is a
  live suggested card whose whole premise is that re-taking the seat is the documented way past
  an unreadable record, and the acquisition arm no longer replaces one, so its criterion is
  unreachable. Its fence is a subset of this one. The seat's records act should reach it in the
  same sitting.
- **The nil UUID is accepted**, because it is well formed. The criterion says malformed, so
  this is inside the rule as written; naming it here so a later reader does not discover it.
- **One clause in the process reader's header** says the second read is omitted rather than
  guessed when the process table refuses it, "and every arm that reads `program` then declines
  to match". That is exactly true of the Codex predicate, which declines. The Claude arm falls
  back to the command form instead — which is the base behaviour, so nothing was loosened — and
  a reader can take the sentence to promise more than it delivers.
- **The fixture task ids.** Two of the three differ in their last character and are plainly
  invented. The third shares its version and variant shape with a value the ground reports as
  real, and a shape is not a value; I could not check further without opening the recovery
  clone, which this brief forbids. Named so the integration seat, which may open it, can.

## Assigned corrections

Two, each a body committed on this bench AFTER this verdict, in the spec the property lives in,
each run RED against an implementation lacking the property and GREEN against the one carrying
it. Two corrections and two mutant blocks, so there is no shortfall to explain.

**CORRECTION 1 — the Codex executable match is EXACT and CASE-SENSITIVE, and nothing proved it.**
The Claude matcher's negative half is drilled across nineteen unrelated shapes. The Codex
matcher's negative half had one: an executable named for the interpreter whose ARGUMENT mentions
codex. Nothing separated the exact name from a prefix of it or from a differently-cased one, and
both shapes are live on the machine this was measured on — a `codex-code-mode-host` process and
the desktop application's capitalised helpers, four of them, read from the process table during
this pass. RED reading: with the equality widened to a prefix test, the whole owning spec at the
tip stays GREEN over 53 bodies, which is the gap; with the new body present it reds alone,
naming the neighbour. GREEN reading: 55 bodies pass with the implementation unchanged. A second
mutant that folds the case reds the same body and nothing else.

```mutant
correction: the Codex executable match is exact and case-sensitive
file: tools/e2e/scripts/checkout-currency.mjs
spec: tools/e2e/tests/checkout-currency.spec.ts
body: the Codex harness is its EXACT executable name, so a neighbour binary is never a session
message: is a neighbour and not the harness
--- old
  return executable !== undefined && path.basename(executable) === CODEX_HARNESS_PROGRAM_BASENAME;
--- new
  return executable !== undefined && path.basename(executable).startsWith(CODEX_HARNESS_PROGRAM_BASENAME);
```

**CORRECTION 2 — the task id reaches the identity block and no other surface, and only the
refusal half was pinned.** The implementation contract says the value is never echoed into a
diagnostic and appears in a holder record only inside its identity block. A body asserts the
first clause for a MALFORMED value, which is the case where no real id exists to leak. The
success path — the one that has a real id in hand, writes it and prints three lines about what
it wrote — had no body at all. The implementation already carries the property; nothing held it
there. The new body drives the real acquisition command, hands it the UPPERCASE form so a leak
of either the given or the canonical form is caught, requires the record to name the value
exactly once and at the identity path, and keeps the padded mixed-case marker out of the
refusal so a redaction written as a strip of the exact input cannot pass. RED reading: with the
task id interpolated into the line the arm already prints, the whole owning spec at the tip
stays GREEN over 53 bodies; with the new body present it reds alone. GREEN reading: 55 bodies
pass with the implementation unchanged. Neither correction's kill set contains the other's.

```mutant
correction: the task id never reaches a diagnostic on the success path
file: tools/e2e/scripts/brief.mjs
spec: tools/e2e/tests/checkout-currency.spec.ts
body: the logical task id reaches the identity block and no other surface
message: the canonical form reaches no diagnostic
--- old
            `holder: pid ${String(mine.identity.pid)} started ${mine.identity.startedAt}`,
--- new
            `holder: pid ${String(mine.identity.pid)} started ${mine.identity.startedAt} ${String(mine.identity.taskId ?? "")}`,
```

## The pre-commitments phase 1 made, discharged

1. **AC3's compatibility half was pre-committed to be the degenerate one** unless a
   base-captured record was exercised. It was exercised, and it is NOT degenerate: the ground's
   own record from the base parses identically under both readers, compares as the same owner,
   and is left byte-identical. PROVEN rather than assumed.
2. **AC2's subagent clause was pre-committed to be probably true by construction.** It is pinned
   in both directions instead — one task under three different session contexts, and two tasks
   under one — so it is a live regression pin and not a vacuous pass.
3. **AC1's "CLI or desktop" was pre-committed to be unprovable on a host missing one form.**
   Neither form was running, at the base or now. Said in the row above rather than waved through.
4. **AC4 was pre-committed to be judged by mutation only.** Five mutants were planted and read
   from the diff rather than from a mutator's report; each landed at the site its property lives
   and killed one to three bodies, never the whole file.
5. Non-atomic acquisition is pre-existing and the diff does not widen the window; reported as an
   observation only, as promised.
6. In-fence, out-of-purpose edits: none. Every change to the acquisition arm serves the
   unreadable-record path the fence was granted for.
7. Automatic breaches checked and none found: no dependency added, no file outside the three
   named plus this card and two filings, T-238-s1 untouched, and no task id reachable in any
   diagnostic or anywhere in a record outside its identity block.
8. The recovery verdict was not read, and nothing quoted it to me.
9. The unruled tensions were checked: the restarted-task release case is decided by the
   incarnation half of the comparison and is inherited from the base rather than introduced
   here; the Claude-plus-Codex precedence case is ruled by nearest-ancestor order and a stale
   thread id in a Claude session's environment is never read; the unknown-field boundary is
   ruled and measured on both sides.

## The declared follow-through, graded

Two entries, both inside the manifest, neither adding a criterion, both small. The restored
refusal sentence is a property a reader meets and no body asserts, and it reads as a sentence at
the tip. The unreachable-branch comment is true: that branch's code is returned only when the
handed identity is not ok, and the precondition above it has already answered for exactly that —
confirmed by the mutant that removes the precondition, which makes the branch reachable again and
reds two bodies. Nothing else in the diff is undeclared surface.

## The claims I re-derived at step 5

The notes' figures were re-measured rather than taken: the process-read cost at the walk's bound
measures 30 ms against 56 ms here where the notes say 33 against 56; the census is stale at the
tip and the regeneration belongs to the merge by this project's own standing rule; no ask file
for this card exists; T-238-s4's fence is a subset of this one. The notes surface the filesystem
surface and the moved refusal exit themselves, and both are filed. They do not name the two gaps
this verdict corrects.
