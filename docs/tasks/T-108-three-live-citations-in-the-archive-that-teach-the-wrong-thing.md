---
id: T-108
title: Three live citations in the archive teach the wrong thing — a falsified number labelled "measured", a figure that should be deleted rather than corrected, and a pin name no function carries
feature: F-01
milestone: 4
priority: 64
size: S
status: building
blocked_by: []
touches: [docs/tasks/T-027-interview-split-view.md, docs/tasks/T-025-agent-runner.md, docs/tasks/T-081-denial-reaches-the-screen.md]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

## ARCHITECT'S FENCE RULING — 2026-08-25, at `765924d`

**THIS CARD'S FENCE WAS `[docs/tasks/]` AND HAS BEEN NARROWED TO THE
THREE FILES IT ACTUALLY WRITES**, before dispatch, by the architect:

    docs/tasks/T-027-interview-split-view.md
    docs/tasks/T-025-agent-runner.md
    docs/tasks/T-081-denial-reaches-the-screen.md

All three are `status: done`. No live lane writes them.

**THE OLD FENCE WAS NOT MERELY WIDE — IT WAS UNSHIPPABLE, AND THE REASON
IS THE LANE PROTOCOL ITSELF.** `docs/tasks/` is where every dispatch
stamps `status: building` and where every integrator stamps `status:
done` and the `built_by` / `verified_by` / `review` fields. A lane
holding `docs/tasks/` as a directory therefore collides with **every
other lane's opening and closing move**, including its own integrator's.
Held strictly, it serialises the entire board behind one small
docs-correction card; held loosely, the fence is being ignored, which is
worse than not having one. **A fence that the project's own protocol
must violate to make progress is not a fence.**

**THE GENERAL RULE THIS EARNS, which is worth more than the card:**
a fence names the paths a lane WRITES, at the narrowest granularity that
still covers them — and **a bare `docs/tasks/` directory fence is never
correct**, for the reason above. Where a card edits a knowable, listed
set of cards, it fences those cards by path. Where a card genuinely
rewrites the whole archive, that is an L card whose plan pass has to
argue for stopping the board, not an S card that takes the directory by
default. **This belongs in the method rather than in this card**, and is
routed to `T-104`, the rulings vehicle, rather than written into
`docs/CONVENTIONS.md` from inside a lane.

**A CARD'S OWN FILE IS NEVER PART OF ITS FENCE, and this card is where
that became visible.** The dispatch stamp (`status: building`, `builder`)
and the integrator's closing stamp (`status: done`, `built_by`,
`verified_by`, `review`) are **protocol writes, not lane writes**: they
are made by the architect and the integrator, on a file no other lane
has any reason to touch, and they happen to every card whatever its
fence says. So the fence above deliberately omits
`docs/tasks/T-108-three-live-citations-*.md` even though this lane's
first commit writes it — the omission is correct, and listing it would
be the error. **This is the second reason a `docs/tasks/` directory
fence is wrong**: it makes every card's own protocol stamp look like a
fence violation, so the check has to be disabled to be usable, and a
check nobody can leave on is not a check.

**WHAT THE EXECUTOR MAY NOT DO** follows from that distinction rather
than from a list. It SHALL NOT write any `docs/tasks/` path outside the
three named above, and **suggestion files are the case to watch**: a
finding on this lane does not become `docs/tasks/T-108-sN-*.md` while
the lane runs. Findings go in the lane's report; the integrator files
them. The executor's own frontmatter is already stamped and SHALL be
left alone.

> **DRAFTER'S NOTE — remove before landing.** All three reproduce at
> HEAD `4d2f03c`, and I re-derived the one figure that could have
> drifted: the kit's fourteen `include_str!` sources total **23,890
> bytes** today, exactly what `T-043-s2` measured. Enumerated rather
> than grepped — `KIT_FILES` has 14 `rel:` entries and there are exactly
> 14 `include_str!` calls, so the two agree.

Absorbs: T-074-s5, T-043-s2, T-081-s8 (sixth triage, 2026-08-20). All
three files removed in this commit.

**Three citations in `docs/tasks/` are live, wrong, and teach a reader
something false. Each one has already been copied forward at least
once, and one of them is the SOURCE of a comment another card had to
correct.** They are one card because the fix is the same act — correct
in place, dated, with the derivation — and because the general rules
they earn are three faces of one discipline: **a figure or a name in the
archive is read as a measurement, so it has to be one.**

## ONE — T-027's plan section still teaches W−641, and calls it measured

`docs/tasks/T-027-interview-split-view.md` says all three of these,
verified live at `4d2f03c`:

- **Plan section**: *"Degradation, **measured rather than guessed**. …
  640 chat + 1px rule leaves the lens W−641: at 1440 → 799 (the design's
  own number), at 1280 → 639, at 1024 → 383, at 800 → 159."*
- **Implementation notes**: *"THE LENS GETS W−640, NOT W−641. The plan
  computed 799 at 1440 by adding the 1px rule to the 640. The app's box
  model is border-box, so the rule is INSIDE the 640 … 800 at 1440, 640
  at 1280, 384 at 1024."*
- **Verdict**: *"The lens is W−640 — 384 / 640 / 800 — which confirms
  the notes' correction of the plan's W−641."*

**Two corrections and the wrong original, in one file, with the wrong
one first and labelled MEASURED.** It was not measured; it was computed,
and computed wrongly. **That label is what makes this worse than the
sibling case T-074 already fixed**: a reader who stops at the plan
section has been told the number came from the app.

**IT IS THE SOURCE, NOT A COPY.** The falsified arithmetic reached
`GenesisScreen.tsx`'s comment from here — T-074 corrected the comment —
and the two lane specs that quote "W-641" quote it correctly, as the
thing that was wrong. **After T-074 the only live site still teaching
the wrong number is the plan section of the card that invented it.**

**And the fix adds the half T-027 never had.** The design of record does
not say 799 either: measured at `e83ee1d` over the
`data-screen-label="Interview"` artboard of
`docs/design/claudedesign_handoff/nputer app.dc.html` (file present at
`4d2f03c`), the chat rect is 640 / client 639 and the right half is
**798**, because the artboard is a 1440px border-box frame with 1px
window chrome; the same ratio in the app's chrome-less viewport gives
**800**. **799 is neither — it is what you get by subtracting the 1px
rule twice.**

## TWO — a plan figure that should be DELETED rather than corrected

`docs/tasks/T-025-agent-runner.md` §3 reads *"(14 files, ~60 KB — the
count CORRECTED BY T-043 from the plan's '13' … The byte figure is a
separate, still-wrong number and is left alone here: see T-043-s2)"*.
**Measured at `4d2f03c` over exactly the fourteen `include_str!`
sources: 14 files, 23,890 bytes (23.3 KiB)** — against "~60 KB", off by
a factor of about 2.5, in the opposite direction from the file count
that was already corrected.

**The recommendation is deletion, not correction, and the asymmetry is
the argument.** The COUNT is stable and load-bearing: adding a template
moves it, the parity walk asserts the table matches the directory, and a
wrong count sends a reader looking for a fifteenth file. **The byte
total is neither** — it is `include_str!` of fourteen live `method/`
documents that every method version bump rewrites, so it was already
stale by the next commit and will be stale again by the next reader. **A
number that no test can hold and that drifts by construction is worse in
a plan than no number.** If a size claim is wanted, the honest form is a
bound with a reason (*"the kickoff prompt carries tens of KB, not
hundreds"*) rather than a figure that reads like a measurement.

## THREE — a criterion cites a pin that does not exist, and the obvious check confirms it

T-081's seventh criterion requires *"THE existing
`an_in_band_auth_failure_surfaces_the_clis_own_words_not_an_empty_tail`
pin SHALL stay green"*. **No Rust function has that name.** At
`4d2f03c` the string appears in exactly three files, all prose
(`T-025-agent-runner.md`, T-081's card, and the finding), and `git grep
-n "fn an_in_band_auth_failure" -- '*.rs'` returns exactly one
definition:
`an_in_band_auth_failure_is_typed_authfailed_not_a_relayed_exit_code`
in `app/src-tauri/tests/agent_runner.rs`, which is green. **The
criterion's SUBSTANCE is satisfied and its CITATION is unverifiable as
written.** The bad name predates T-081 — T-025's notes coined it and
T-081's planner copied it forward, while T-029's and T-069's notes cite
the CORRECT name four times between them, so the two spellings have
coexisted for several cards.

**AND THE MECHANICAL ROUTE DOES NOT FAIL — IT LIES.** Measured at
`5b14603`: `cargo test --test agent_runner <the phantom name>` prints
`test result: ok. 0 passed; 0 failed; 0 ignored; 73 filtered out` and
exits **0**. **A phantom pin name run as a filter reports SUCCESS** —
the same non-answer class as an empty exit code, and the reason this is
not cosmetic: the obvious way to check a cited pin actively confirms it.

**The rule this earns needs its own pathspec, which the finding learned
on itself.** The first draft said `git grep -- .`; that is self-defeating
and was measured so — writing the finding put the phantom string into
`docs/`, so the unrestricted search now reports a definition that does
not exist. **Restricted to `-- '*.rs'` it exits 1, correctly.**

## Acceptance criteria

- **T-027's PLAN SECTION SHALL BE CORRECTED IN PLACE, dated, with the
  derivation**, keeping its qualitative claims and removing the
  "measured" label from a computed number. THE DESIGN HALF SHALL BE
  ADDED — 798 in the artboard's border-box frame, 800 in the app's
  chrome-less viewport, and 799 is neither.
- **T-025 §3's BYTE FIGURE SHALL BE DELETED, not corrected**, and the
  reason SHALL be recorded in one clause: a number no test can hold and
  that every method bump moves is worse than none. IF a size claim
  survives THEN it is a bound with a reason, never digits.
- **T-025 §3's FILE COUNT SHALL BE LEFT AS IT IS** — 14, corrected, and
  load-bearing because the parity walk asserts the table matches the
  directory. The asymmetry between the two numbers is the point of this
  criterion and SHALL be stated where they sit.
- **BOTH LIVE CITATIONS OF THE PHANTOM PIN SHALL BE CORRECTED** —
  T-025's notes and T-081's criterion 7 — to the name the suite actually
  carries, and the corrected name SHALL be verified by a definition
  search restricted to `-- '*.rs'` before it is written.
- **THE RULE SHALL BE WRITTEN WHERE CRITERIA ARE WRITTEN**: a criterion
  that names a test names it by a string `git grep -- '*.rs'` finds as a
  DEFINITION. THE PATHSPEC IS PART OF THE RULE — the unrestricted form
  matches this very card's prose and reports a definition that does not
  exist.
- **THE FILTER TRAP SHALL BE NAMED BESIDE IT**: `cargo test --test <t>
  <name>` exits 0 on a name that matches nothing, so "the pin passes"
  and "the pin is not there" are the same output. Read the counts, not
  the code.
- **NO CORRECTION HERE SHALL DELETE HISTORY.** Every fix is in place with
  its date and derivation, on the precedent T-074 set twice — a card's
  own record of having been wrong is the thing that makes the archive
  trustworthy.
- **EVERY FIGURE THIS CARD WRITES SHALL CARRY THE REF IT WAS MEASURED
  AT**, and the kit byte total SHALL be re-derived at the card's own ref
  rather than copied from here — it is the exact class of number this
  card is about.

Verification: headless — the DOCS GATE fires on every `docs/tasks/`
path this card edits (a flat card owes three commands); run what it owes
and record which and their exits, including the parser suite, whose
smoke body parses the live tree. `cargo test` is NOT owed by these edits
and SHALL NOT be claimed as evidence — but the corrected pin name SHALL
be run once, by its real name, with the passed/filtered counts quoted
rather than the exit code. **This card adds no test body; that is stated
here rather than left silent**, per the drill's clause about bodies that
cannot be poisoned. @human: none.
