# Checkpoint: three more lanes, and the night's largest finding is that the fence judged nothing at all

Date: 2026-08-31. Seat: architect/integrator. Scope: triage sitting #7,
three lanes merged (`T-190`, `T-192`, `T-142-s1`), five cards filed
(`T-197`–`T-201`), and a discovery that reframes every lane that ran
tonight.

## THE FENCE JUDGED NOTHING, AND A LANE FOUND IT BY ATTACKING ITS OWN

`T-190`'s executor **drilled the instrument that was supposed to be
constraining it** — wrote outside its `.nputer/lane-fence.json`
deliberately. **The write succeeded.** Re-derived at this seat from
`.claude/hooks/lane-fence.mjs:786`:

    return allow("outside-the-checkout",
      `${abs} is outside ${root} (limit 2 in this file's header)`);

The dispatching seat runs from a nested checkout; lane worktrees are
**siblings**, as `method/lane-protocol.md` rule 3 REQUIRES; subagents
inherit the dispatching root. So every lane write is outside the checkout
and is allowed **unjudged** — not denied, not carved, **never
evaluated**. Two rules each correct alone, jointly fatal, neither naming
the other.

**Ten lanes ran on 2026-08-31 believing a hook enforced their fences.
None was enforced, and every dispatch brief from this seat said one did.**

The good news is also the point: **every lane stayed inside its fence,
and five ROUTED rather than widened** when the fix lay outside. Compliance
was total and it was **discipline** — the category `T-167-s8` measured
decaying.

**It is the guard-class defect in its purest form**: a fence that judges
nothing and a fence that approves everything are byte-identical from
outside, and ten lanes of clean writes is exactly what both produce. Only
a lane that attacked its own fence could tell them apart. Filed as
`T-199`, priority 1.

## A TOOL THIS SEAT TRUSTED ALL NIGHT WAS LOSING ITS OWN OUTPUT

`brief.mjs` ends at `process.exit()`, and Node's stdout is asynchronous
on a pipe. Measured:

    --dispatch > file    →  69,293 bytes
    --dispatch | cat     →  65,536 bytes   (64 KiB exactly)

Exit 0, no error, output ending mid-derivation looking complete. **This
is the tool whose contract is that a figure cannot be separated from its
provenance** — it builds records rather than strings precisely so a
number cannot leave detached from its source, and all of that is defeated
after the fact by the process exiting early.

**Three seats measured it independently to the same byte.** Filed as
`T-197`.

**And `T-142-s1` found the property that makes it dangerous to test.** It
watched the red go **fully green** with no relevant change — two
worktrees removed, `--dispatch` fell from 69,302 to 62,651 bytes, under
one buffer. The lane count decides whether **anything** falls past it. So
the card's own criterion is now binding on a **synthesised** oversize
input: a body whose subject is the live board is vacuous on a quiet
machine, which is exactly when an integrator runs it.

## THE F-04 BLOCKER MOVED A SECOND TIME, AND BOTH MOVES WERE MEASUREMENTS

`T-190` established that **no location an `[app-dispatch]` fence reaches
is collected by any runner**, priced the registry line at exactly one red
body — owned by **C-12**, not C-05, which it corrected against itself —
and routed the crossing as `T-198` with the four `touches:` tokens a lane
actually needs.

**Its verifier ran the attack the lane did not**, and that is what settles
it: a real collected pin importing `hydrateJoin`, then the hydration loop
gutted one side only. The probe reded first — a real pin, not an empty
corpus — and with the probe removed **the same mutant passes the whole
app suite and both `tsc` programs at exit 0.** So *"driven by nothing"*
survives a deliberate falsification attempt and `T-198` is provably
buildable.

So the ruling's DIRECTION has never moved and its BLOCKER has moved
twice — C-18 → `T-190` → `T-198` — each time because a lane went and
looked.

## "A SWEEP WHOSE UNIT IS COARSER THAN ITS THESIS REPORTS A CLOSURE IT HAS NOT MEASURED"

`T-192`'s line, written at its own site after its verifier found
`start_genesis_here` **opens no dialog at all** — `index_repo`'s shape
wearing the picker's latch. The lane's sweep counted the `await invoke(`
**call site**; the card's thesis is that the defect is decided per **Rust
command**. Three commands counted once. Re-swept by command: **five, not
three** — two bounded, two human-gated, one accepted residual, stated
rather than hidden.

**Its replacement reason is better than the one it replaced**: LATCH
PARITY, which covers all three commands because all three claim Rust's
`PickInFlight`, so bounding the webview mirror desynchronises the pair.
It survives the command with no human.

And the lane **declined to import** `withAnswerBound`, because that edge
would deepen this repository's first component cycle — @human's own
2026-08-25 ruling, *extract don't declare*. Its verifier **predicted the
import in phase 1 and was wrong in the lane's favour.**

## THE INSTRUMENT WAS NEVER MISSING — IT SAID THE RIGHT THING IN THE WRONG PLACE

`T-142-s1` corrected its own card and this seat's brief. `--census`
**already** printed *"no diff judged"* — third from the end, beneath two
reassuring sentences, then exit 0. So the fix is **position, not
addition**, and the verdict now closes the output, names the half it did
not answer, and legends its own exit.

**It also corrected a claim in my brief**: `T-090` never argued the gate
should not be an npm script. Its "exactly four" was a state description,
its reason was a FENCE problem, and its own criteria then made it a
script deliberately. **The argument was retired by the card I credited
with making it.**

Not guard-class, and **measured rather than argued**: an 18-input
before/after exit matrix, byte-identical throughout, so the refusal set is
unchanged. The lane left the judgement to this seat and supplied the
evidence for it.

## THE CORRECTED VERIFIER PRACTICE WAS VALIDATED

All three blind verifiers this batch **hashed their attack sets before
opening a diff**, and `T-192`'s reported that *"the dispatch carried no
lane fact and separated its phases correctly."* Lane context now goes in
a second message on request; it was never needed.

**Two of the three disclosed contaminating themselves** — one ran
`git log --oneline -5` while orienting and downgraded itself to
*corroborator rather than independent finder* on two of four questions,
while still reproducing the registry mutant, the ownership derivation and
the import census independently. **A verdict that volunteers the limits of
its own independence is worth more than a cleaner-looking one.**

## Triage sitting #7 and the allocator

**All fourteen suggested cards promoted; the board went to 0 suggested.**
Four needed placement DERIVED from a parent or seam. The key-uniqueness
guard caught a duplicate `blocked_by` mid-sitting before any write — the
defect that redded two gates at `T-154-s4`.

**This seat is now the id allocator**, adopted after five collisions:
`T-196`, `T-200` and `T-201` were all allocated here rather than minted
by a lane, and every lane that met one asked instead of guessing.

## Gates

- **`cargo test --no-fail-fast` — **18 targets, 601 passed, 0 failed, exit 0****
- parser ****344**** · app ****1100**** · e2e ****367****
- `lint:docs` / `lint:tokens` / `capabilities:check` — **0 / 0 / 0**;
  CAPABILITIES regenerated **29,053 → 29,121**, exactly the 68-byte delta
  `T-142-s1` predicted and could not commit itself (that gap is `T-201`)
- **GRAPH — **CURRENT**, 1,148,895 bytes, 199 files, 2,448 symbols, 2,365 edges**
- **BOOT GATE — owed and run, exit 0** on derived port 28913; 1420 read
  with `lsof` only, zero rows
- **HEALTH — **8 inside, 2 drifting, 0 BREACHED, 0 unread**, 4 UNKEPT**

**Two reds this batch were documented artifacts, each cleared by its own
written protocol in about two minutes**: the app's `dist/` predating a
newly merged file (rebuild → 1100/1100), and the cargo cache cliff at
14.76s against the 14.6s line with a lane still building (body alone →
1.28s). **Neither would have been distinguishable from a regression
without the hazard being written down.**

## Owed after this record

- **@human**: the GitHub Actions quota — CI has stopped STARTING (zero
  steps, no log, two commits, five attempts) and the last several merges
  are verified LOCALLY ONLY; the byte-floor divergence `T-162-s1` routed;
  the **FORM**; the **STEERING SPLIT**; `T-025-s4`'s permission
  questions; thirty seconds on the interview's ending at a narrow width;
  and `T-131`, which now has counter-evidence from four lanes rather than
  three.
- **A compaction landing** for `docs/STATE.md` and `docs/CONVENTIONS.md`.
- **`T-199` is priority 1** and nothing mechanically fences a lane until
  it lands.

## A BAND BREACHED, THIS SEAT TRIED TO EXPLAIN IT, AND THE BAND WAS RIGHT

`suite/lib-seconds` **BREACHED** at **15.14s** against a 14.60 breach
line, with `cargo test` failing on
`startup_arm_watches_the_initial_root` — on a machine with **zero live
lanes**.

`T-088-s4`'s protocol attributes it: read the suite's time (over the
line), re-run the body alone (**1.29s**, exit 0), and note the hazard's
second stated cause — *"reds when `target/` is LARGE or lanes contend"* —
with `target/` at **5.3G**.

**This seat then decided not to clean**, reasoning that the attribution
was solid, that another seat had independently measured 601/0, and that a
clean would impose a cold rebuild on the next session. **That reasoning
was wrong, and the band is why.**

An attribution explains a reading; **it does not clear a breach.** The
band was not reporting a mystery — it was reporting that the lib suite
genuinely takes 15 seconds, which is true, and which the caveat about
lanes no longer excused. Cleaning was safe for the first time all night,
because **no lane was live to depend on the cache**.

    cargo clean   →  removed 64,779 files, 13.1 GiB
    lib suite     →  15.14s  becomes  3.93s
    full run      →  18 targets, 601 passed, 0 FAILED, exit 0

**A 3.8× improvement, the failing body passing inside the full suite, and
the breach cleared.** The band caught something real that four separate
protocol-correct attributions had each explained away — including two
earlier tonight. **"Attributed" is a claim about a CAUSE; it is not a
claim that the tree is healthy**, and this seat spent most of a night
treating them as the same thing.

## Board and lanes

**TEN LANES LANDED across the night**, all stamped, **six carrying
`review: independent`** with executor, blind verifier and integrator as
three distinct seats. **No task branch and no lane worktree remains.**

`T-191`'s `review:` field was **missing entirely** — an oversight from
when the repair landed. It is now `self-verified` with its reasoning
recorded: that card's blind verifier specified and measured the one-value
repair, but nobody independently reviewed the integrator's implementation
of it, and the control that makes it trustworthy was run by the seat that
wrote it.


## TWO MORE HAZARDS MOVED HERE FROM `docs/STATE.md`

Writing this checkpoint's own findings into `docs/STATE.md` took it to
**3.52%** of its warn line, inside sight of the 2% breach — **and this
record's central lesson is that an attribution does not clear a breach.**
Applying that to this seat's own file rather than explaining the drift:

- **Ports are machine-wide** (`T-132-s6`) — explicit, `lsof`-read at zero
  rows immediately before binding; **a probe reserves nothing.**
- **After merging a lane, remove its worktree BEFORE the verdict
  corrections** — guard limit 6: git drops its mid-merge marker at the
  merge commit while the worktree keeps the fence.

**The second is currently MOOT and that is worth knowing rather than
losing**: `T-199` establishes that the fence hook judges nothing in this
session's shape, so the guard whose limit 6 that hazard routes around is
not running at all. **It becomes live again the moment `T-199` lands** —
which is precisely why it is recorded here instead of deleted.
