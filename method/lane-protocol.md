# The lane

A lane is the isolated place one task gets built. One task, one branch,
one worktree, one session — and the integration branch is none of them.

**The names below are placeholders.** A project spells them once, in its
own CONVENTIONS, and every role reads that spelling instead of inventing
one: what the integration branch is called, the branch-name pattern, the
worktree-name pattern, and which commits qualify as a base. Nothing in
this file is a project's actual name.

## The rules

1. **One task, one branch, one worktree.** Two tasks never share a lane,
   and one task never spans two. A task that needs a second worktree was
   sliced too coarsely — split the task (interview/decomposition.md),
   never widen the lane.

2. **Cut the branch from the newest KNOWN-GREEN commit on the
   integration branch, and never from a merge commit.** A merge commit
   is the state *before* the integrator finished: whatever the checkpoint
   regenerates is still stale inside it, so a lane cut from one inherits
   a red gate it did not cause and its fence forbids it to fix. Which
   commits qualify is the project's to name — where a project
   checkpoints after every merge, the newest checkpoint is the base, and
   a later non-merge commit on the same branch is equally safe PROVIDED
   its own gates are green — a base is trusted for its green gates, not
   for being a checkpoint, and a non-merge commit can still trip a gate a
   graph check does not cover.
   **STATE THE BASE AS A HASH.** "Latest" names a different commit for
   every reader and a different one an hour later.

3. **The worktree is a sibling directory, never a path inside the
   repository.** A worktree under the repository's own root is a second
   copy of every file to everything that walks the tree — linters,
   indexers, test discovery, the project's own file watchers — and the
   duplicate findings arrive attributed to whoever is nearest. It also
   becomes an untracked directory in the integration checkout's own
   status, so a session that stages by wildcard there stages a whole
   second copy of the project.
   **STATE THE PATH ABSOLUTELY, OR VERIFY THE WORKING DIRECTORY FIRST.**
   This is a clarification of the sentence above rather than a new rule,
   and it is written because the rule has been obeyed and broken by the
   same command: a RELATIVE worktree path resolves against whatever
   directory the dispatching shell happens to sit in, `git` has no
   opinion about where a worktree lands, and there is no error — so a
   sibling path typed one directory too deep silently creates the inside
   case this rule forbids. Whoever cuts the lane owns this, and a lane
   that discovers it should report the real path rather than move itself.

4. **NO SEAT BUT THE INTEGRATOR'S INSTALLS OR RUNS A SUITE IN THE
   INTEGRATION BRANCH'S CHECKOUT.** No dependency install and **no
   test-suite run** against that checkout, whatever seat you sit in.
   **THE FOUR WRITE PROHIBITIONS ARE THE LANE'S AND STAY THE LANE'S**:
   the executor makes no commit, no merge, no push and no branch move
   there. They are not generalised, and generalising them would break
   this method's own dispatch — roles/orchestrator.md 5b REQUIRES the
   `status: building` stamp to be written on the integration branch and
   committed BEFORE the lane is cut, and SEPARATE THE WRITE FROM THE
   VERIFICATION below says in as many words that a seat with standing to
   write there writes DIRECTLY and briefly. If the lane needs something
   that exists only there, it waits for the integrator or opens a room.
   **The one exception is the smallest ceremony tier**: a size-S card has
   no separate integrator (tasks/TASK-FORMAT.md), so its executor plays
   integrator for its OWN work once its tests pass — it merges,
   checkpoints and removes its own worktree, and it does so ONLY WHILE IT
   HOLDS THE INTEGRATION CHECKOUT (the STANDING, NOT THE SEAT clause at
   the end of this rule). Every larger tier keeps the two roles in
   different hands.
   **A SIZE-S CARD MAY STILL OWE A VERIFIER**, and the two questions are
   separate: the ceremony table gives an S card touching shipped code a
   verifier while leaving self-integration in place. Where it does, the
   executor waits for the VERDICT before playing integrator. "No separate
   integrator" has never meant "no verification"; read the table's row,
   not the tier letter.
   **THIS RULE SAID "THE EXECUTOR" UNTIL THE SEAT IT NEVER NAMED BROKE IT
   TWICE IN ONE SESSION.** `architect` appeared nowhere in this file nor
   in roles/orchestrator.md, and the seat that dispatches, triages and
   files cards is the one that writes to that checkout most often — so it
   read a rule addressed to somebody else and obeyed it exactly. **A
   prohibition that enumerates seats grows a hole for every seat added
   after it.** The complement of ONE seat has none, which is why the rule
   is now spelled that way round.
   **AND THE COMPLEMENT REACHES ONLY THE TWO PROHIBITIONS THAT NAME A
   COLLISION.** This clause first landed carrying all six across, and was
   rejected for it: `no commit, no merge, no push, no branch move` were
   calibrated for a LANE, whose writes there are never sanctioned, and
   widening them to every seat made this rule contradict SEPARATE THE
   WRITE FROM THE VERIFICATION below and forbid roles/orchestrator.md 5b
   outright. **The test of a prohibition here is whether it names a
   COLLISION or an AUTHORITY.** An install and a suite run CONTEND — for
   the tree, the runner, the installed dependencies — so they bind
   whoever is not the seat that owns the checkout. A commit does not
   contend; it is atomic, and who may make it is settled per seat in that
   seat's own file. **A rule that answers a collision question with an
   authority answer forbids the method's own dispatch**, which is exactly
   what happened here.
   **THE TEST RUN IS THE ADDITION AND IT IS THE WORSE HALF.** An install
   is the destructive case everyone anticipates. **A test run only READS,
   so it looks harmless — and it is the one that actually collided.**
   Every other shared surface a lane can corrupt obstructs or confuses;
   **this one CERTIFIES.** An integrator's suite result is what a merge is
   signed off on, and a second runner corrupts it in both directions at
   once: a spurious RED the integrator spends its time investigating, or a
   spurious GREEN that prompts no second look at all. **Nothing in the
   tree records that a second runner was present** — status is clean, no
   lock exists, and the checkout looks idle.
   **THE REMEDY IS TO SEPARATE THE WRITE FROM THE VERIFICATION, NOT TO
   FORBID THE CHECKOUT.** A blanket "never touch it" is wrong and will be
   ignored, because it is contradicted by practice every day: an atomic
   commit is safe, and has been performed under a running integrator at
   that integrator's own request. **What collides is the long-lived suite
   run.** So a seat with standing to write there writes DIRECTLY and
   briefly, and runs its gate-owed suites **in a checkout of its own** — a
   sibling detached worktree (rule 3) carrying its own installed
   dependencies. That checkout is cut and installed once and costs nothing
   afterwards; the first card on this method's own project to be gated
   from outside the integration tree is the card that added this clause.
   **DETECT-AND-REFUSE IS THE BACKSTOP AND IS DELIBERATELY NOT SPECIFIED
   HERE.** roles/integrator.md rule 1 already carries that shape in full,
   with the positive control that makes it a check rather than a ritual —
   read it there rather than re-deriving it. Note what it does and does
   not cover: it detects a live PRODUCT, and a live INTEGRATOR is a
   different holder needing a different probe. **Build that probe only if
   the clause above and the habit beside it leak.** It is machinery; the
   other two are a clause and a habit, and machinery is the expensive
   answer to a problem the cheap ones have not yet failed at.
   **RECORDED WITH ATTRIBUTION, BECAUSE AN UNATTRIBUTED RULE READS AS
   ADVICE.** Both violations are the ARCHITECT's, hours apart in one
   session on this method's own project. **(a)** Staging into the
   integration checkout's index while an integrator held it; that
   integrator spent about four minutes deciding whether the tree was safe
   to write. **(b)** Running the full end-to-end suite in that checkout
   while a *second* integrator worked there: **2 failed / 169 passed** — a
   thirty-second click timeout, and an `Invalid package config` naming a
   manifest that was valid and that the checkout's own status reported
   untouched. **Re-run alone: 171 / 171, exit 0.** Both failures were
   collision artifacts and neither was a defect. **The finding about (a)
   was filed three hours before (b) was committed**, by the same seat,
   which is the fact that decides the shape of this rule: the seat had
   read the finding, agreed with it, and still could not see itself in a
   sentence that named the executor.
   **AND THE ATOMICITY THE TEST RESTS ON IS AN OBLIGATION ON THE WRITER,
   NOT A PROPERTY OF GIT — SO A PERMITTED WRITE IS STAGE-AND-COMMIT IN
   ONE MOTION, LEAVING NOTHING STAGED BEHIND.** *"A commit does not
   contend; it is atomic"* is true of a COMPLETED commit and false of
   the staging step, and the counterexample is violation **(a)** above:
   the index is a shared surface, and an integrator spent four minutes
   deciding whether a tree it shared was safe to write because that
   index was dirty. **THAT ACT OPENED THIS WHOLE THREAD AND WAS
   PROHIBITED BY NOTHING.** Staging is not an install, not a suite run,
   and not one of the four write prohibitions — so it sat outside this
   rule's list before the seat was generalised, while it was
   generalised, and after the generalisation was scoped back. Three
   spellings of one rule, none of which reached the incident it was
   written for. The collision-or-authority discriminator was right and
   its supporting clause overstated; this sentence is the repair, and it
   is stated so that the ordinary case this rule explicitly blesses — an
   atomic stamp-and-commit under a running integrator, at that
   integrator's own request — still passes unchanged.
   **AND THIS RULE PARTITIONS BY CHECKOUT, WHICH IS NOT THE ONLY WAY A
   LANE CAN COLLIDE.** Every surface this protocol reasons about is
   scoped by LOCATION — an index, a ref namespace, a directory, a
   checkout, a board — and the isolation everybody reaches for is the
   worktree. **Some surfaces are scoped by the MACHINE instead**: a port
   number, the host's list of worktrees, anything keyed on a name that
   is global to the machine. **Two lanes with disjoint fences, disjoint
   trees, disjoint indexes and disjoint runners still share those**, and
   every written rule stays satisfied while they collide — so the
   collision probability rises with parallelism and nothing warns.
   Observed both ways on this method's own project: two lanes, each
   obeying this rule exactly, contending for one DEFAULTED port; and a
   check that joined a MACHINE-scoped list to a CHECKOUT-scoped one,
   which reddened in every older lane the moment a newer lane was cut.
   **NAME THE SCOPE OF EVERY SURFACE YOU DEPEND ON — machine or
   checkout — and where the answer is machine, DERIVE the value from the
   lane rather than defaulting it.** A construction beats a check: two
   lanes cannot pick the same number when the number comes from the
   lane. Where you must check instead, ask the operating system — never
   by connecting, never by binding to test, because taking a port for a
   microsecond is still taking it — and remember that proving it free
   NOW reserves nothing.
   **STANDING, NOT THE SEAT: THE SMALLEST TIER'S EXCEPTION AND THE
   CONCURRENT CEILING WERE WRITTEN WITHOUT EACH OTHER, AND THE
   RECONCILIATION IS THIS RULE'S OWN DISCRIMINATOR TURNED ON THIS RULE.**
   At tasks/TASK-FORMAT.md's ceiling of 3–5 concurrent lanes, the
   exception above tells up to five executors to merge into one branch
   and to regenerate one byte-banded state document, each in the same
   commit as its own record (docs-protocol.md rule 4). That reads as two
   rules in conflict and it is not. ***May an S executor merge its OWN
   work* is an AUTHORITY question, and the ceremony table answers it yes,
   unchanged. *May two seats hold the integration checkout at once* is a
   COLLISION question, and the first sentence of this rule already
   answers it no.** The exception was phrased as though the second were
   the first, so it issued a SEAT where it meant to issue STANDING. **The
   integrator seat has one holder at a time; the exception says who may
   TAKE it, never how many may sit in it.**
   **SO SELF-INTEGRATION IS CONDITIONED ON HOLDING THE CHECKOUT AND NEVER
   ON BEING THE ONLY LANE**, and the distinction is the whole of the
   repair: solitude is the proxy every reader reaches for, and it fails
   in the expensive direction, because **the holder is usually a seat
   with no lane at all.** Measured on this method's own project while
   this clause was written: rule 7's own lane derivation returned SIX
   lanes and did not return the integration checkout, since a filter
   selecting task branches excludes by construction the one checkout that
   is never on one. **A lane can be alone on the board and still be
   second into the tree**, so a rule keyed to the lane COUNT is an
   enumeration wearing a number, and this rule already knows what
   enumerations grow.
   **THE HOLDER IS THEREFORE DECLARED AT DISPATCH AND NEVER INFERRED.**
   The brief's deliverable row already owes *explicitly whether to merge*
   (roles/executor.md), and that answer is the holder and the handoff —
   so a dispatcher writing *do not merge* is TRANSCRIBING this contract
   rather than overriding it, which is the half that was missing when
   four briefs said it from memory and a lane had to report the conflict.
   Where a dispatcher departs from the ceremony ROW itself that IS an
   override, and it goes where tasks/TASK-FORMAT.md already rules an
   override goes: prose in the card's body, with the reason, and no
   field.
   **AND A LANE THAT WAS NOT TOLD DOES NOT TAKE THE SEAT.** It stamps its
   status in its own lane, reports ready-to-merge naming its branch and
   its tip to whoever integrates (roles/executor.md, "The report"),
   leaves its worktree standing (rule 6), and stops. It does not certify
   its own merge in that checkout on the way past — the first sentence of
   this rule forbids exactly that, and the in-lane merge forecast is the
   substitute the report already prescribes. **Refusing costs a handoff;
   guessing costs a certification**, and the attributions above are what
   a corrupted certification looked like.
   **ONE CONDITION COVERS THE MERGE AND THE CHECKPOINT, BECAUSE BOTH ARE
   ACTS IN THAT ONE CHECKOUT — BUT THEY FAIL DIFFERENTLY, WHICH IS THE
   REASON TO SAY SO RATHER THAN ASSUME IT.** Concurrent merges SERIALISE:
   the second is refused, retries, and loses nothing. Concurrent
   checkpoints CORRUPT: a state document regenerated by several seats
   breaches the byte budget its own gate enforces, and the staleness
   check then reds for whoever lost the race, reporting as a defect what
   is a scheduling artefact. **The checkpoint is the holder's, one per
   SITTING rather than one per merge** — which docs-protocol.md rule 4
   already permits and which the practice already is: the record written
   the day this clause landed carried four merges.
   **AND THIS IS THE LEAK THE LIVE-INTEGRATOR PROBE WAS HELD IN RESERVE
   FOR, CLOSED WITHOUT BUILDING ONE.** The clause above reserves that
   probe for the day the written rule and the habit beside it leak; they
   leaked here, not as a missed detection but as a contract that never
   named a holder. A probe would not have closed it: **a seat reading a
   diff, deciding a verdict or waiting for one holds the checkout while
   running nothing for any probe to find.** A declaration reaches a
   holder that is thinking; a probe reaches only one that is executing.
   The probe stays unbuilt, and this sentence is why.

5. **Concurrent lanes have disjoint `touches:`** — the orchestrator's
   guardrail (tasks/TASK-FORMAT.md), and the executor's too. An executor
   whose work reaches outside its own `touches:` has found a dispatch
   error, not a licence: record it, route it, and build the part that
   fits. A fence is not widened from inside the lane it fences.
   **A FENCE NAMES PATHS. A COMPONENT NAME IS SHORTHAND FOR THE PATH SET
   IT STANDS FOR, AND DISJOINTNESS IS COMPUTED OVER THE EXPANDED SETS —
   NEVER OVER THE TOKENS.** Both halves of that sentence were bought with
   a defect. Comparing tokens reports two lanes DISJOINT whenever their
   names differ, and two different names can stand for the same files:
   one component carrying two names is enough, and the pair that proved
   it went into flight overlapping and undetected for a whole lane,
   because the only thing that could have detected it was the work that
   lane was dispatched to build. And a vocabulary of names ALONE is worse
   than coarse — it is a lock on a name. A card that knows its three
   files has to claim its whole component, so lanes that never touch each
   other serialise behind a word. Measured on the session that ran six
   lanes concurrently: **every block was a naming collision and not one
   real collision occurred.**
   **THE EXPANSION READS ONE SOURCE AND MUST NEVER GROW A SECOND.** The
   map from a name to its paths is each component file's own slug field,
   which roles/executor.md row 5 already rules authoritative over the
   architecture document's prose block. A second copy of that map is two
   facts, not one fact checked twice.
   **ONE SPELLING, AND AN UNRESOLVED TOKEN IS NOT "DISJOINT FROM
   EVERYTHING".** A path and the same path with a trailing slash are one
   fence; containment is overlap, so a directory fence and a fence naming
   a file inside it are NOT disjoint however far apart their strings sort.
   A token that resolves to neither a name nor a path is the case that
   matters most: the honest answer is that the comparison could not be
   made, and a fence that answers "no overlap" when it means "I do not
   know" is worse than one that refuses. Three verdicts, never two.
   **A DIRECTORY THE PROTOCOL ITSELF WRITES TO ON EVERY CARD IS NOT
   FENCEABLE BY ANY CARD.** The task-file directory is the worked case:
   the dispatch stamp and the closing stamp are written there for every
   task, so a lane holding it collides with every other lane's opening
   and closing move. Name the individual files instead. **This has to be
   refused MECHANICALLY, where the fence is read, and the reason is
   structural rather than a matter of taste**: the collision is between a
   fence and a PROTOCOL WRITE, and the clause below means a
   fence-versus-fence comparison has no term for one. It cannot discover
   this, ever, so it must not be asked to.
   **A CARD'S OWN FILE IS NEVER PART OF ITS OWN FENCE, AND THE EXPANSION
   ENCODES THAT RATHER THAN LEAVING IT TO EACH READER.** The card is
   where the dispatch stamp lands before the lane exists and where the
   closing stamp lands after it ends; treating it as fenced territory
   would put every card in permanent collision with its own protocol.
   **SO THE FENCE DOES NOT GOVERN WRITES TO IT, AND A LANE WRITING TO ITS
   OWN CARD IS NOT A FENCE BREACH** — which is what makes the executor's
   own implementation notes performable under a path-granular fence
   instead of forbidden by one. That resolves a conflict, and it is worth
   being exact about how far it reaches: the fence answers WHERE a lane
   may write, and it now answers "not here, this file is outside every
   fence including your own". **WHO may write to a card and WHAT they may
   write is a different question with a different owner** —
   tasks/TASK-FORMAT.md for the fields, the acting role's own file for
   the act — and this clause does not touch it. Two lanes split on this
   in one night, which is the signature of an unruled conflict rather
   than of one session's mistake.
   **THE FENCE IS A PROPERTY AT THE MOMENT OF THE WRITE, NOT ONLY A
   DISCIPLINE AT THE HANDOFF.** Everything above describes a rule a
   session KEEPS. A project that can enforce it should: after cutting
   the lane and before briefing the session, the dispatcher EXPANDS the
   card's `touches:` once — through the project's single fence
   implementation, never a second copy of the expansion — and leaves the
   answer IN THE LANE as a manifest the lane's own tooling reads at
   every write. **The expansion happens at dispatch and not at the
   write** because a lane that computes its own fence can compute a
   wider one, which is widening from inside the lane by another route.
   **THREE ANSWERS AND A POSITIVE CONTROL.** A checkout that is not on a
   task branch is ALLOWED — the integrator, the coordinating seat and
   every detached scratch tree — and that is the control that keeps a
   refusal distinguishable from an absence. A task branch with NO
   manifest is REFUSED, because that is a dispatch that skipped its
   step. A path outside the manifest is refused, NAMING the fence, the
   path and the route. Anything the protocol itself writes on every card
   — the task-file directory — is allowed, per the clause above.
   **AND THE LIMITS ARE DISCLOSED IN THE SAME BREATH, BECAUSE A GUARD
   DESCRIBED AS TOTAL IS WORSE THAN NO GUARD.** A hook on the write
   TOOLS sees writes made with those tools. **A write mediated by a
   shell — a redirect, a `sed -i`, a script — does not pass through
   them**, and is answered by the physical layer below or by nothing at
   all. So is any write by a seat that holds no lane. And a guard that
   cannot locate its own program cannot refuse: it fails OPEN, silently,
   which is the harness's contract and not a defect to be argued away.
   **State these where the guard is documented**, and read the guard's
   own decision function rather than a page about it — a description of a
   guard drifts from the guard, and the description is the half that
   gets read.
   **THE SHELL-MEDIATED WRITE HAS A SECOND ANSWER AND IT IS PHYSICAL
   RATHER THAN ANALYTICAL.** Deciding what an arbitrary shell command
   will write is a parsing problem no project wins; asking the FILESYSTEM
   is not a parsing problem at all. So after the manifest is written,
   make every TRACKED file OUTSIDE that fence READ-ONLY in that lane's
   worktree. A stray write then fails with `EACCES` from the kernel,
   needing no intent analysis.
   **AND THE EDGE OF THAT COVERAGE BELONGS IN THE SAME BREATH AS THE
   PROMISE, NOT FOUR SENTENCES LATER.** What a mode bit refuses is an
   OPEN FOR WRITING on the existing file — a `>` redirect, an append, any
   program that opens the path and writes it. What it does NOT touch is a
   writer that creates a NEW file and RENAMES over the target, because a
   rename is authorised by the PARENT DIRECTORY, and the directory is
   deliberately left writable by the rule below. Measured four ways:

       >  redirect onto a 0444 file, writable dir   REFUSED, intact
       sed -i     on a 0444 file, writable dir      exit 0, CHANGED
       mv -f      onto a 0444 file, writable dir    exit 0, replaced
       sed -i     on a writable file, 0555 dir      REFUSED

   **SO THE CANONICAL IN-PLACE EDIT GOES STRAIGHT THROUGH THIS LAYER** —
   and an earlier draft of this very paragraph promised the opposite,
   listing the in-place edit among what it covers, four sentences before
   its own limits corrected it. That is the failure this rule's own
   *"a guard described as total is worse than no guard"* names, committed
   in the paragraph that quotes it. The first line above is the POSITIVE
   CONTROL, without which the other three would only be saying nothing was
   locked; the fourth shows WHY rather than merely that, since `sed -i`
   writes a temporary file and renames it. **Classify a writer by HOW IT
   WRITES, never by what it is called** — and note that the landing check
   catches exactly this residue, because a renamed-over file is a content
   change in the lane's own diff.
   **FILES ONLY, NEVER DIRECTORIES**, and all three reasons are
   load-bearing rather than tidy. The runtime directory a lane's own
   tooling writes to is created at the worktree ROOT, so a read-only root
   would stop the lane minting whatever its push gate demands and
   therefore stop it pushing at all; `git worktree remove` UNLINKS, and
   unlink is authorised by the PARENT directory rather than by the file,
   so a locked directory would break rule 6's cleanup; and a build writes
   only ignored trees, which are untracked and therefore never
   candidates. Take the corpus from what the repository TRACKS, and every
   runtime path is excluded by construction instead of by an exception
   list somebody has to maintain.
   **THE TWO LAYERS COVER EACH OTHER'S BLIND SPOTS AND NEITHER IS
   SUFFICIENT ALONE. SAY SO WHEREVER EITHER IS DOCUMENTED**, because a
   guard trusted further than it measures is worse than none. **A lane
   writing ANOTHER lane's worktree never appears in its own diff**, so no
   landing check can see it and only the physical layer can — the other
   lane's out-of-fence files are read-only to everybody. Conversely a
   landing check covers what the physical layer cannot: content that
   arrives through a path where the mode bit was legitimately dropped.
   **AND THE PHYSICAL LAYER'S OWN LIMITS ARE FIVE, MEASURED RATHER THAN
   REASONED.** **THE RENAME CASE ABOVE IS THE FIRST OF THEM**, and the
   sharpest, because it defeats the tool a reader is likeliest to reach
   for. So: it stops an OPEN FOR WRITING on an existing out-of-fence
   tracked file, and nothing else. **CREATION is not blocked** — directories stay
   writable, by the rule above. **DELETION is not blocked** — `rm` in a
   writable directory succeeds whatever the file's mode. **GIT IS NOT
   FENCED BY IT AT ALL**: measured at git 2.50.1, a merge writes straight
   through a read-only tracked file, because it unlinks and recreates,
   and the new file arrives at the umask default — so every git write
   also DISARMS the layer on the paths it touched, silently. And it is
   **not a security boundary**: the owner may `chmod` it back and root
   ignores it. The first two are exactly what a landing check sees, which
   is why the pair is kept; the third is why the layer must be
   re-armable and ASKABLE, and it is what fast path B is written around.

6. **The integrator removes the worktree** — after the merge and the
   checkpoint, not before. The executor never removes its own: a
   worktree deleted before the verdict destroys the only reproducible
   copy of what was measured. Whether the branch survives the worktree
   is the project's rule. **On a size-S card there is no separate
   integrator (rule 4, tasks/TASK-FORMAT.md): the executor IS the
   integrator and removes its OWN worktree — after it has merged and
   checkpointed.**
   **AND IT IS THAT INTEGRATOR ONLY WHILE IT HOLDS THE INTEGRATION
   CHECKOUT (rule 4, STANDING, NOT THE SEAT).** A lane that does not hold
   it merges nothing, checkpoints nothing and removes nothing: it reports
   ready-to-merge and leaves its worktree standing for the holder, who
   removes it under the first sentence of this rule. **Being the only
   live lane is not the condition and never was** — the holder is
   declared at dispatch, and a lane that was not told does not take the
   seat.
   **WHETHER THERE IS A VERDICT TO PRESERVE IT FOR
   DEPENDS ON THE CEREMONY TABLE'S ROW, NOT ON THE TIER LETTER.** An S
   card whose diff is outside shipped code has none, and its worktree may
   go as soon as the checkpoint lands. An S card that took a verifier has
   one, and the sentence at the top of this rule binds it exactly as it
   binds M and L: the worktree survives until the verdict, because a
   worktree deleted before the verdict destroys the only reproducible
   copy of what was measured.

7. **The lane list is a fact on disk, not a memory.** Which lanes exist
   is answered by asking the repository (its worktrees and branches),
   which is what makes the fence checkable by a session that was not
   present when the others were dispatched.

## Why the branch carries the dispatch stamp and the lane does not

`status: building` is written on the integration branch **before** the
branch is cut (tasks/TASK-FORMAT.md, lifecycle). The lane therefore
inherits the stamp in its own base commit and never writes that line at
all — which is the whole reason the order is fixed rather than
conventional. A stamp written inside the lane and a stamp written on the
integration branch are two edits to one line, and the merge has to be
resolved by hand.

## The two fast paths — when a fence has to move while a lane is live

**THE BASE PROTOCOL IS THE LAW AND STAYS THE FALLBACK OF BOTH PATHS.**
An executor that discovers an out-of-fence need builds everything that
fits inside its fence, records the discovery naming the exact paths and
the fence they need, routes it, and ends (rule 5, roles/executor.md).
That answer is complete on its own and costs one handoff. **The two
paths below are optimizations layered on it, and neither is a way for a
lane to WAIT**: under both, the lane keeps building the whole time, so
no lane ever blocks idle anywhere in this design.

**THEY ARE WRITTEN DOWN ONLY BECAUSE THE REFUSALS THAT MAKE THEM SAFE
EXIST, AND THAT ORDER IS THE POINT RATHER THAN A SCHEDULING ACCIDENT.**
A widening decided by whoever remembers which lanes are live is the
decayed instrument rule 5 already measured failing — six lanes, every
block a naming collision — and law that lands before its enforcement is
a false document that reads exactly like a true one. Three refusals
carry these paths: an out-of-fence WRITE is refused at the write, an
overlapping DISPATCH is refused when the fence is expanded, and an
out-of-fence LANDING is refused against the fence the card declares on
the integration branch. **Name the ones your own project actually holds
when you adopt this section, and claim no others** — every sentence
below is only as sound as the refusal under it.

### Fast path A — widening a live fence, when nothing overlaps

**THE ASK IS NOT A PAUSE.** The executor names the exact paths and why
it needs them, PARKS that edit, and KEEPS BUILDING everything else
inside its fence. If in-fence work runs out before a grant arrives, it
routes under the base protocol and ends. The fast path expires; it
never becomes a wait.

**THE GRANT IS THE DISPATCH STEP PERFORMED AGAIN, NEVER A DIFFERENT
ACT.** The granting seat amends the card's `touches:` and re-expands
that lane's fence with the project's own dispatch-time expansion.
Nothing new is built for this and nothing new is trusted: that
expansion already refuses to write a manifest for a fence overlapping a
live lane, so the intersection is not a step somebody performs — it is
a step somebody cannot skip. **A re-run over a lane that already has a
manifest is an ordinary case and not a collision with itself**; an
expansion that cannot tell those apart is not yet ready to carry this
path.

**AND THE AMENDMENT IS TWO WRITES, NOT ONE, BECAUSE MORE THAN ONE
READER READS THE CARD AND THEY READ IT FROM DIFFERENT PLACES.** The
expansion reads the card from the INTEGRATION CHECKOUT, which is what
keeps the grant the granting seat's. A landing check reads it from the
INTEGRATION BRANCH, which is where a legitimate widening lands. **The
write-time guard reads it from the checkout the write LANDS IN — the
lane's own working tree — and compares that copy against the line the
manifest was stamped from.** So the amendment goes onto the integration
branch AND into the lane's working copy of the card, in that order,
because the expansion happens between them.

**THE HALF-PERFORMED WIDENING IS WORSE THAN NO WIDENING, AND THAT IS
MEASURED RATHER THAN REASONED.** Driving a write-time guard of this
shape over a lane whose card had been amended on the integration branch
and whose manifest had been re-expanded, while the lane's own copy of
the card still carried the old line: the guard refused the newly
granted path AND **every path the lane already held**, as a stale
stamp. A widening delivered to one reader out of two does not fail to
grant — it STOPS THE LANE DEAD, on the paths it was already building
in, for a reason no one is looking for. Both were allowed again the
moment the lane's copy carried the amendment, while a never-granted
path stayed refused: **that PAIR is the positive control**, and it is a
pair because only the two together separate a refusal from an absence.

**AND THE WINDOW REFUSES THE CARD ITSELF, WHICH MAKES THE REMEDY THIS
SECTION PRESCRIBES UNPERFORMABLE WHILE IT IS OPEN.** The stamp
comparison happens BEFORE the unfenceable carve-out is consulted, so
while the two copies disagree there is no allow at all — not the fence,
not the card, not a new file in the directory no card may fence.
Measured in the same drill, in the state the first reading of it never
asked about: the card's own file and a fresh suggestion file both
refused, with the same stale stamp. **So ROUTING — which is notes on
the card and a suggestion beside it, both in that directory
(roles/executor.md) — cannot be WRITTEN during the window.** Say that
to the reader rather than letting them find it: a lane that meets the
refusal, reaches for the prescribed remedy and is refused again will
conclude the guard is broken, and it is not. The move is to REPORT the
half-delivered widening to the seat that owes the other half, which
needs no write at all; the notes go in once the window closes.
**THIS IS DOCUMENTED RATHER THAN REPAIRED, AND DELIBERATELY.** Whether
that carve-out should precede the stamp comparison is a question about
a guard's own ordering, and a lane holding no fence over that guard is
the last seat that should answer it — which is the rule this whole
section exists to serve, turned on the section itself.

**SO THE GRANT IS TWO AGREEING FILES ON DISK IN THE LANE, AND THE
EXECUTOR PROCEEDS ON ITS OWN READ OF THEM AND ON NOTHING ELSE.** The
manifest must show the new path, and the lane's own copy of the card
must carry, character for character, the `touches:` line the manifest
was stamped from — because that pair is exactly what the guard
compares. **Never a reply**, and the reason is structural rather than a
story about a lost message: a reply is somebody's CLAIM about those two
files, the read IS the files, and it is the same read the guard itself
makes at the lane's next write. Two reads, both performable by the lane,
neither of them a question to anybody — **a grant a lane was told about
is a grant nobody checked.**

**BOTH HALVES ARE THE GRANTING SEAT'S, AND A LANE THAT FINDS ONE HALF
MISSING ROUTES RATHER THAN SUPPLYING IT.** The lane COULD write the
lane-side half — every card is outside every fence including its own
(rule 5) — and it must not. Be exact about why, because the obvious
reason is the wrong one: writing that half cannot widen anything, since
the manifest governs the path set and is outside every fence. **The
rule is about EVIDENCE, not escalation.** A lane that completes its own
grant is the one party that cannot afterwards tell a grant that was
made from a grant that was half-made, and the refusal it silences is
the only signal that something went wrong upstream.

### Fast path B — the checkpoint sync, when the blocker lands in time

Where a lane is fenced out by work another lane holds, and that lane
merges, checkpoints and gives up its worktree before this one runs out
of in-fence work, the intersection now passes and the fence can move.
**The sync is what makes the widened lane's green a claim about a tree
that will actually exist.**

**THE SYNC TARGET IS THE COMMIT THE OTHER INTEGRATION ENDED AT — THE
CHECKPOINT, NOT THE MERGE — AND IT IS DERIVED, NEVER REMEMBERED.** Rule
2 gives the reason already: a merge commit is the state *before* the
integrator finished, so a lane that syncs one inherits the stale half.
How a checkpoint commit is recognised is the project's own spelling to
publish; ask for it at your own ref rather than carrying it.

**DRY-RUN THE SYNC MECHANICALLY AND READ THE ANSWER BEFORE ACTING ON
IT** — `git merge-tree --write-tree`, the same forecast this method's
integrator step already runs before every merge, with `$?` read
unpiped and first.

**THE ANSWER IS THREE-VALUED — CLEAN, CONFLICT, UNKNOWN — AND THE TYPE
IS NOT THE EXIT CODE ALONE. THAT CORRECTION IS THE FIRST THING
MEASUREMENT DID TO THIS RULE.** The natural typing, and the one this
section was drafted with, reads it straight off the code: 0 clean, 1
conflict, above 1 the instrument itself failed. **It is wrong in the
one direction that costs.** Measured at git 2.50.1: a forecast against
a ref that does not exist exits **1** — character for character the
conflict code — printing its complaint on stderr and NOTHING on stdout,
while a genuine conflict exits 1 having printed the merged tree's
object id on stdout first. An unknown option exits 129, which the
naive typing does catch. **So the discriminator is the OUTPUT together
with the code, never the code alone: the forecast RAN if and only if it
produced a tree.** This is not a new rule — it is this method's
standing reading rule (an exit 1 may mean the check COULD NOT RUN; a
verdict prints a verdict and a failure prints a complaint) applied to
one instrument. Derive the shape at your own version rather than
trusting this paragraph's.

**UNKNOWN ROUTES; IT NEVER PROCEEDS AND IT NEVER FIRES THE TRIPWIRE.**
A miscast instrument failure sends a seat hunting a fence violation
that never happened, which is worse than a missed conflict: the missed
conflict surfaces at the real merge, and the phantom breach spends a
seat's whole session on an invariant that was never broken.

**CLEAN → widen the fence by fast path A, then the lane merges the
checkpoint commit into its own branch.** After a clean sync the lane's
diff, its merge base and every gate derivation recompute against the
new base — which is also what stops a landing check charging the lane
with the paths the sync brought in.

**AND A PHYSICAL LAYER IS DROPPED ENTIRELY FOR THE DURATION OF THE SYNC,
THEN RE-ARMED FROM THE POST-WIDENING MANIFEST ONCE THE MERGE COMMIT
EXISTS.** Not a narrowing and not an exception list: off, then on again
from the new answer. **This is the one self-violation this whole section
had built into it**, and it is structural rather than unlucky — the sync
is a merge THE PROTOCOL ITSELF PERFORMS, and the files it must write are
by definition the ones outside the pre-widening fence, which is exactly
what made the sync necessary. A layer armed over those paths is a guard
aimed at its own project's fast path.

**AND THE SHAPE OF THAT SELF-VIOLATION IS NOT THE ONE IT WAS PREDICTED
TO HAVE, WHICH IS WHY IT IS STATED FROM MEASUREMENT.** The prediction was
an `EACCES`: git writes tracked files, the tracked files are locked, so
the sync fails loudly. **At git 2.50.1 on macOS/APFS it does not fail at
all.** Merges of all three shapes — fast-forward, three-way, conflicting —
write
straight through a read-only tracked file, because git unlinks and
recreates rather than opening for write, and the recreated file arrives
at the umask default. **So the sync SILENTLY DISARMS the layer on
precisely the paths it most needed to hold**, with no error, no output
and nothing in `git status` to see. That is worse than the predicted
failure in the direction that costs: a refusal stops you, and a guard
that has quietly stopped guarding does not. Derive this at your own git
version rather than trusting this paragraph — the remedy is the same
either way, but WHICH half of it is load-bearing is not: under the
prediction it is the drop, and under the measurement it is the re-arm.

**SO THE LAYER MUST BE ASKABLE AND THE ANSWER MUST BE CHECKED AFTER ANY
GIT OPERATION THAT REWRITES THE TREE** — a sync, a branch switch, a stash
pop. A command that reports which out-of-fence paths are writable again
is the whole difference between a decayed guard and a detected one. And
ALL OR NOTHING below governs the re-arm as well: it is recomputed from
the manifest, never from a memory of what was locked, because a layer
restored from a remembered set is a claim about a tree that has moved.

**ALL OR NOTHING. NEVER A PARTIAL FILE PICK.** A mixed base makes the
lane's green a claim about a tree that will never exist, and the subset
argument defeats itself: the only files worth picking are the ones the
lane depends on, which is exactly where the risk lives, so the safe
subset is the worthless subset.

**AND NEVER A CONFLICT RESOLVED AS `ours`.** A merge commit is a CLAIM
of reconciliation. Taking `ours` silently reverts the landed lane's
work at the final merge — an exit 0 for a reconciliation nobody
performed, which is strictly worse than the conflict it hid, because
the conflict was visible.

**AFTER A CLEAN SYNC, BREAKAGE IS THE LANE'S WORK BY CONSTRUCTION.**
The lane asked for the new base, so what the new base breaks in the
lane's own work is the lane's to adapt, in fence. A fix that needs
paths the fence does not carry re-enters fast path A, which now passes
by construction — the lane that held those paths has ended. **A red the
lane did not cause is attributed against the synced commit and ROUTED**,
never repaired: the lane holds no fence over it, and a lane that
quietly fixes somebody else's red spends its own verification on work
nobody reviewed.

### The tripwire, and the honest size of it

**A CONFLICT IN THAT DRY-RUN IS NOT BAD LUCK.** Where the three
refusals above are actually enforced, disjoint enforced write-sets
cannot textually conflict — so a CONFLICT is EVIDENCE that an invariant
was breached somewhere. Route it and investigate. **Never resolve it
locally**, which buries the evidence inside a merge commit that then
reads as a reconciliation.

**AND IT FIRES ON THE ENFORCED WRITE-SETS ONLY, WHICH EXCLUDES THREE
CLASSES WHERE A CONFLICT IS THE PROTOCOL WORKING.** Check the
conflicting PATHS against those classes before you conclude anything.

1. **The unfenceable directory every card writes to.** Outside every
   fence by construction (rule 5), so outside the premise as well.
2. **Each card's own file.** Same construction, and the collision is
   not rare: the dispatch stamp and the closing stamp are two writers
   on one frontmatter line whenever the stamp lands after the branch is
   cut, which `tasks/TASK-FORMAT.md`'s dispatch-stamp bullet already
   describes. **Measured while this section was being written**, on the
   very lane that wrote it: its own forecast came back CONFLICT, in
   exactly one file — the card — on exactly the `status:` line, with
   every fenced path merging clean.
3. **The integration seat's own standing writes** — the state document
   it regenerates at every checkpoint, and the checkpoint record
   itself. **THIS CLASS IS DIFFERENT IN KIND FROM THE FIRST TWO AND IS
   THE ONE THAT WOULD HAVE COST A SESSION.** The others are outside
   every fence; this one a card MAY name, so a conflict here lands
   INSIDE an enforced write-set and the rule above would call it the
   evidence. It is not. A fence says which paths are the LANE's to
   write; it never gave the lane exclusivity over the writes that seat
   owes on every integration, and a project that enforces the fence
   between seats already has to encode this class for exactly that
   reason. **And fast path B walks straight into it**: the sync target
   IS a checkpoint commit, so those paths are on the right-hand side
   essentially every time. Measured on this method's own project: every
   one of the last ten checkpoint commits touched both the state
   document and the checkpoint record.

**A TRIPWIRE THAT FIRES ON ANY OF THE THREE TEACHES A PROJECT TO IGNORE
IT**, which costs more than the tripwire is worth. A conflict inside an
enforced write-set and outside all three classes is the evidence;
anything else is the protocol working.

**AND THE TRIPWIRE IS ONLY AS TRUE AS THE ENFORCEMENT UNDER IT, WHICH
IS WHY ITS HOLES ARE PUBLISHED HERE RATHER THAN DISCOVERED.** A write
that reaches disk without passing through the guarded write tools — a
redirect, an in-place edit, a script — is outside the write refusal by
construction (rule 5 states that limit already), and every such write
is a way for two disjoint fences to conflict honestly. **THE PHYSICAL
LAYER NARROWS THIS HOLE AND DOES NOT CLOSE IT**, which is a distinction
worth keeping rather than rounding off: where it is armed, a shell can
no longer MODIFY an existing out-of-fence tracked file, so what remains
are creations, deletions, and whatever git itself writes — and a
conflict is a textual disagreement about a file's CONTENT, which a
creation on both sides still produces. **A tripwire believed wider than
it is sends a seat hunting a violation that never happened**, which is
the same cost as the miscast instrument failure above, arriving by a
different road. State what your project enforces; claim nothing beyond
it.

### The standing warning both paths are an instance of

**A RULE THAT NAMES A HAZARD DOES NOT MAKE THE TOOLING OBEY IT.**
Everything above is prose, and every step of it is performed by a
command somebody wrote separately. Three times while this section was
being written the prose and the machinery disagreed, and in all three
the prose was the confident half: a widening described as ONE act that
the guard makes TWO; an intersection cited as a flag of its own, which
no command has, because it lives inside the expansion instead; an exit
code typed by argument that the instrument spends on its own failures
too. **None of the three was a defect in the machinery.** Each was a
rule written from what its author expected the machinery to do, by
authors who had read the machinery. So when you adopt these paths,
DERIVE every step against the commands your project actually has and
write down what they actually refuse — **a fast path is only as fast as
its slowest guard, and only as safe as the one it does not have.**

## The revert play — the undo, written before the first bad merge

**A merge that should not have landed is not a rare event; it is an
event this method had no move for.** Written down now, in the calm,
because the alternative is that the first one is improvised by whoever
is holding the branch at the time — and an improvised undo is how a
project loses the record of what went wrong along with the work.

1. **REVERT THE MERGE COMMIT, mainline first** — `git revert -m 1
   <merge>` — and never rebase, amend or force the integration branch.
   The bad merge STAYS in the history: it is the evidence, the verdict
   names it, and a branch rewritten to hide it makes every citation of
   that commit dangle. The revert is a new commit that undoes the
   content and preserves the fact.
2. **THE CARD RETURNS TO `planned`, AND THE REVERT IS RECORDED IN THE
   CARD'S OWN BODY** — dated, naming the reverting commit and the
   reason. It is a RECORD, so it is appended and never erased, and it
   survives the card being rebuilt. A card that goes back to `planned`
   with no trace of why is a card the next executor will rebuild
   identically. Its fields unlock with the status (tasks/TASK-FORMAT.md,
   lifecycle), and the rebuild is dispatched to a FRESH seat by the same
   rule that sends a rejected card to one.
3. **RECONCILE THE GENERATED ARTIFACTS AT THE REVERTING CHECKPOINT, NOT
   IN THE REVERT.** Fixtures, indexes, generated documents and anything
   else derived from the tree are regenerated in the checkpoint commit
   that follows, exactly as at any other integration — a revert is a
   merge-shaped event and it takes the two-commit shape for the same
   reason (roles/integrator.md step 1). A revert whose generated half
   was reverted textually is stale in a new way.
4. **THE CHECKPOINT RECORD CARRIES THE WHY**, at the loudness a skipped
   gate gets: what landed, what it broke, how it was found, and what
   would have caught it earlier. That last clause is the whole return on
   the play — the revert costs a commit, and the record is what makes it
   cost less than once.

**AND A REVERT IS NOT A DISPOSITION.** It undoes a merge; it does not
close, reject or park anything. Which of those the card gets is
triage's, by the same single-writer rule that governs every other
placement field.
