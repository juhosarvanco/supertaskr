# 07 — Verification

Verification is an independent attack on the work, by a seat that
cannot see the builder's reasoning. The guarantee is informational
blindness, not model diversity: the failure a builder cannot catch is
almost always a shared assumption, and an assumption is shared through
the reasoning, not through the weights. The construction that makes
blindness a property rather than a promise is stated once, in
method/roles/orchestrator.md step 5d; the verifier's conduct inside it
is method/roles/verifier.md; the spellings are docs/CONVENTIONS.md's
bench bullet.

## The bench

The verifier works on a bench: its own detached sibling worktree
(`supertaskr-V-T-NNN`), cut at the lane's base when the lane is cut,
holding no fence manifest. It installs and builds its own dependencies
and runs suites on its own port. It never runs a suite in the
integration checkout (lane-protocol rule 4).

## Phase 1: the attack set, written blind

Phase 1 is its own spawn, and it has no file, git or shell tools. Its
contract arrives pasted inline, and it returns one artifact.

**What it receives**, all at the base ref, chosen and named by the
dispatcher: the card as it stood when the lane was cut (which is the
card without the executor's notes), the verifier contract, and the
base text of what the criteria are judged against, by ref and by
section. Never the diff, the notes, the executor's report, the commit
log or any figure measured after the cut.

**What it returns:**

- **The attack set** — per criterion, at least one attack naming a way
  to satisfy the letter while failing the purpose; the mutants it
  wants planted; what would falsify the work; the ground it will judge
  on. Under the floor of one attack per criterion the return is a
  refusal, handled as one.
- **The ground truths it wants** — every measurement the card's claims
  about a platform, a tool or an exit code need. A spawn with no shell
  cannot take one, so it asks.
- **A refusal**, where it cannot reach something it needs, naming what
  and why. A refusal is stamped and hashed like an attack set.

**What the dispatcher does with it:** saves the return as
`attack-set-<card id>.md`, hashes it (`shasum -a 256`), takes the
requested measurements at the base ref where no lane branch exists to
shape the answer, saves and hashes those too, and checks the useful
half before spending phase 2.

The property: nothing that existed when the lane was cut is downstream
of the executor, so volume cannot contaminate; the criteria bound what
is worth sending. And the attack set never reaches the executor: early
is a scheduling change, never a sharing one.

**A contract amended after dispatch** (a correction, a widened scope, a
routed finding) reaches the verifier before the work does, by ref and
heading, never as the dispatcher's summary; phase 1 re-stamps against
the text.

## Phase 2: the attack, on the bench

A second spawn, receiving the digests and the lane. A continuation of
phase 1's session is not a second spawn. Phase 2:

1. Verifies the attack set's digest before opening it, then reads the
   ground truths, the standing set, the verifier contract, and only
   then the diff. It reads the executor's notes only to enumerate
   claims, and re-derives each itself.
2. Re-runs every owed suite personally through the blessed runner.
   Every stamped figure is its own measurement at a named ref; the
   executor's numbers are claims.
3. Drills with its own mutants under the poison drill rules below,
   including at least one the executor did not run, and both sides of
   any allowlist or exception the diff touched.
4. Classifies every red's ownership against the fence before
   attributing it: in-fence is a defect; out-of-fence is routing
   material; "machine load" is never an explanation until the red has
   been re-run alone.
5. Runs the security sweep.
6. Appends the verdict to the card, dated, stamped `model@session`,
   citing `attack set: sha256:<hex> (<file>)` and the ground-truth
   digest on lines of their own, and saying which frame it actually
   had. Commits on the bench.
7. Re-runs whatever gate its own commits could move.

**The frame disclosure.** Two spawns is a property of the spawn; one
message with a marker in it is a discipline the seat kept, and a later
reader cannot tell them apart. So the verdict says which it had. In
this harness the phase-1 spawn cannot be denied tools; the no-tool
property is kept by instruction, every phase-1 return reports its tool
count, and every verdict discloses it. That is the honest weaker thing,
and it is written down rather than rounded off.

## The poison drill

Every protective change is proven by mutation, and the rules each carry
the incident that wrote them (method/roles/verifier.md step 2b;
docs/CONVENTIONS.md's drill bullet).

- **Mutate the producer, never the assertion**, in a detached scratch
  worktree with its own build-cache directory, work committed first.
- **Read the mutant's landing from `git diff`**, never from the
  mutator's own report: a pattern that fails to match reports
  "survived", and `--numstat` is blind to a one-for-one swap.
- **Kill-set containment, never the count.** Two bodies are both
  load-bearing when neither kill set contains the other; where one
  contains the other, the contained body is a restatement. A kill count
  of one is a property of a well-chosen mutant, not an invariant.
- **Something died at the site the property lives.** "The bytes moved,
  the suite ran, something died" is satisfied by a mutant aimed
  anywhere; the failure mode is aiming.
- **Where the property lives in data, the mutant is a data mutant.** A
  code-only drill mis-grades a derivation guard by construction.
- **A control is only a control where the arming differs.** A positive
  control is run against an implementation that lacks the property and
  seen to red, and the card records the demonstration. Where one
  arrangement decides both the subject's answer and the control's,
  that is a defect, named by whoever notices; the remedy is a fresh
  clone, a planted fixture, a data mutant.
- **Restore with a sha256 proof**, and an empty per-path diff is a
  companion, never an alternative: a restore that writes the index as
  well as the worktree leaves a rangeless diff comparing the file
  against the mutation's own source.
- **A control you propose is yours to check.** Suggesting a body is
  writing test code at one remove.

## The security sweep

Mandatory, not optional, because a large share of generated code ships
flaws: injection points on any new input path, authorisation on any new
endpoint or query, secrets or keys in the diff, unsafe defaults,
dependency additions (why this package, is it maintained). Findings
here are REJECTED-level. The dependency-legitimacy gate (T-247) and the
injection scan on docs writes (T-248) mechanise two of these at the
landing; the sweep still reads the rest.

## Verdicts

- **APPROVED.**
- **APPROVED WITH ASSIGNED CORRECTIONS** — each correction named
  precisely; the integrator performs them at the landing, held to lane
  standards, with its own mutants drilled where the correction is code.
- **REJECTED** — with concrete, reproducible failures: commands, inputs,
  expected versus actual.

A verdict whose cited digest does not match the saved file is refused,
not read, and the pass is re-run; the MF-09 method eval demonstrates the
refusal against three implementations that lack the property. A verdict
measured at a commit that no longer exists says so: figures carry the
ref they were measured at, and gates are re-run at the tip the verdict
itself created.

## Rejections

Rejected work returns to a fresh executor with the falsifying evidence.
A re-verification that needs a fresh attack set (the card was amended,
or the rejection taught something the first set could not know) is a
new phase 1 spawn against the amended card, stamped as a re-entry and
naming the verdict that caused it; the fix is judged against both
digests. The rework cycle is counted in the checkpoint's metrics. The
stop condition weighs rejections rather than counting them (chapter
02, lifecycle); the one rejection recorded to date was a README carrying
a single false sentence about verification itself.

## What verification does not claim

It does not claim the verifier stayed blind: that is a discipline the
role file states and the frame disclosure reports. It does not claim
the attack set is complete: the floor is one attack per criterion. It
does not claim same-model is weaker than independent: the two are one
blindness with different provenance, and the sharpest rejections a
pipeline records are routinely same-model.

## From the conventions — the forensics behind the rules (T-290)

The rules themselves live in the chapters under docs/conventions/,
which docs/CONVENTIONS.md indexes. What follows is the history, the
measurements and the argument each of those rules was cut from, moved
here VERBATIM at T-290 under ADR-023 — the records rule forbids a
rewrite, so not a byte of it is re-worded, re-ordered inside an entry,
or summarised. Each entry names the bullet it came out of.

### POISON DRILL

A `ctime` move after a byte-exact restore was seen once and
  never reproduced; prove restoration BY HASH, immune either way.

**SHAPE FIVE — the assertion SET has no cardinality or coverage floor,
  so deleting an assertion deletes its own failure.** TELL: a printed
  count that falls with a deletion and stays green (T-058-s2, absorbed
  by T-080). MECHANICAL REMEDY: YES — a coverage floor per pattern id,
  or a cardinality pin, the shape `MUST_TOKEN_COVER` uses.
  **SHAPE SIX — a body that reds under an expected-value poison while
  killing no mutant another test does not already kill.** TELL: every
  mutant the body kills is already killed elsewhere (T-057-s1, absorbed
  by T-072). NO MECHANICAL REMEDY — the drill has to ASK, and the asking
  is (T-072-s2): **name a mutation of the code under test that this
  body kills, run the WHOLE suite under it, and require the failing-body
  count to be ONE**; a count above one names the bodies that already
  cover you, and if no such mutant exists THAT is the finding.
  **SHAPE SEVEN — a mutant NO BODY KILLS, because the mutant set was
  derived from the PINS rather than from the CRITERIA.** The dual of
  six, and worth more, because this costs the criterion. TELL: "zero
  survivors" against a mutant set every member of which aims at a pin.
  NO MECHANICAL REMEDY, but a PROCEDURE: derive the mutants from the
  acceptance criteria **with the test file closed**, and mutate every
  clause the pins do not mention — a criterion's PLURAL first. Named by
  `T-076`; `git grep -il "shape seven" -- docs/` counts the sightings.
  **SHAPE EIGHT — an assertion that SEARCHES a corpus has no uniqueness
  floor, so one duplicate anywhere keeps it green with its own subject
  deleted.** `String::contains`, `toContain` and `.includes()` are
  satisfied by ANY occurrence. TELL: the assertion pins *that the
  string exists somewhere* while every reader takes it to pin *the
  sentence* — plant a second copy FIRST and then rewrite the sentence
  and it PASSES (T-092). **The likeliest author of that second copy is
  documentation ABOUT the pin**, which is why the live-readers paragraph
  above writes `currently v<METHOD_SNAPSHOT_VERSION>` with a placeholder.
  MECHANICAL REMEDY: YES — **NARROW THE HAYSTACK** to the line or
  section pinned, with an ANCHOR that is not the needle, and assert the
  ANCHOR's own uniqueness; a bare occurrence count is a number with no
  keeper. Worked twice: `snapshot_version_matches_the_live_method_stamps`
  (kit.rs) and
  `the_only_production_path_to_the_transcript_is_the_bounded_one`
  (agent/mod.rs).
  **SHAPE NINE — a mutation that MOVES a generated row between families
  leaves the cardinality invariant, so a COUNT floor is blind to it.**
  RATIFIED here, not minted: `T-080` and `T-083` call it nine and
  `T-095` carries the shape. TELL: an argument against FIVE's remedy — a
  cardinality floor answers DELETION and nothing else. MECHANICAL
  REMEDY: YES, a CONTENT floor DERIVED FROM THE TREE, never a
  hand-written class list.
  **SHAPE TEN — an empty comparison reports AGREEMENT.** The producer
  fails, both sides come back empty, and `cmp` calls it a match. TELL:
  a comparison nothing proved had anything on either side (`T-083-s3`:
  a `merge-tree --write-tree` that exited 1, and a loop that word-splits
  under `bash` and not `zsh`). Eight's opposite end, deliberately not
  folded: a corpus that GAINED a member wants an upper floor, one with
  NO members a lower one. MECHANICAL REMEDY: YES, one line, carried by
  the proof clause above.
  **SHAPE ELEVEN — an order assertion whose WITNESS IS BUFFERED dates
  nothing** (`T-081-s5`: a text-delta witness COALESCED by
  `flush_pending` passed under the very batching mutant it was written
  to detect; the fix was a witness EMITTED rather than buffered). TELL,
  and it is the rule: **when a test asserts A precedes B, ask whether
  B's arrival time is a property of B or of the TRANSPORT; if the
  transport can hold B, B cannot date A.** NO MECHANICAL REMEDY — name
  the witness's emission path in the body so the next reader can check
  it.

### A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL

A census about censuses.

### THE E2E LANE'S HONEST SCOPE

The two unused arms are a DEV-only attempt counter and
  rendering the gated pair disabled in browser mode; the recorded
  sentence was preferred over a second DEV-gated surface, which T-041's
  single-gate argument disfavours.
