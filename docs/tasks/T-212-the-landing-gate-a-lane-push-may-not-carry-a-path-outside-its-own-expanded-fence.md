---
id: T-212
title: THE LANDING GATE — a lane push may not carry a path outside its own expanded fence, because the committed diff is the one account of a write no parser can be talked out of
feature: F-06
milestone: 4
priority: 1
size: M
status: done
blocked_by: [T-209]
touches: [.claude, tools/e2e]
suggested_by: "the enforcement stack's layer (a) (peer session nputer-10, direction approved by @human); split out of a planned T-203 amendment by nputer-10 so the token gate stays dispatch-ready and T-210's blocker names the thing it actually waits for"
builder: claude-opus-5@subagent
review: independent
---

**THE COMPLETE ACCOUNT OF WHAT A LANE WROTE IS ITS COMMITTED DIFF.**
`T-025-s4` proved that deciding what an arbitrary shell command will
write is not a parsing problem this project will win, and `T-210` builds
the physical layer that makes such writes *fail*. This card is the layer
above both, and the only one whose coverage is total by construction:
whatever wrote a file — Edit, bash, a script, a build tool — only
COMMITTED content can land, and committed content is fully visible in
`git diff --name-only`. Judge the outcome, not the intention.

## What to build

**An arm on the pre-push hook** (`.claude/hooks/push-guard.mjs`, which
already imports `LANE_BRANCH_RE` at line 68): when the pushed ref
matches a lane branch —

1. derive the changed paths **MERGE-BASE-to-tip**, never
   base-at-cut-to-tip — this is what keeps a lane that legitimately
   performed a checkpoint sync (fast path B, `T-211`) from being charged
   with main's own paths, because the merge-base moves past them;
2. expand the card's `touches:` **from the card AS COMMITTED ON MAIN
   at push time** (`git show main:docs/tasks/…`) — never from a
   manifest, which the lane could edit, and **never from the lane's own
   copy at any tip**: a gate that reads a card the lane authored lets a
   lane widen its own gate by editing its own `touches:`, which
   `lane-protocol.md:182` already forbids ("a fence is not widened from
   inside the lane it fences" — the architect seat flagged this hole
   before it shipped). Main is ~~a ref the lane cannot move, and it is~~
   exactly where a fast-path-A widening lands, because the widening act
   is a card amendment COMMITTED on main plus `--write-fence`
   (`T-211`);

   *THE STRUCK CLAUSE IS FALSE AND IS RECORDED RATHER THAN QUIETLY
   SWAPPED.* `integrationRefCandidates` tries the LOCAL `main` first, and
   local `main` IS movable from inside a lane worktree. Reproduced twice
   — by this card's verifier, and again by its executor in a throwaway
   repository with `main` checked out in worktree A and a lane branch in
   worktree B, run from B: `git branch -f main <sha>` is refused
   (*"cannot force update the branch 'main' used by worktree at …"*)
   while `git update-ref refs/heads/main <sha>` is ACCEPTED, exit 0, and
   main moves. `git branch -f` carries the checked-out-elsewhere guard;
   `update-ref` does not. The rest of the step stands — reading from the
   integration branch is still right, and it is still where a legitimate
   widening lands — but the ABSOLUTE was wrong, which is exactly what
   rule 5 means by *"a guard described as total is worse than no
   guard."* `T-223` owns the behaviour change;

   *AND THE PROPERTY THIS STEP ACTUALLY RESTS ON, WRITTEN BESIDE THE
   STRUCK CLAUSE RATHER THAN OVER IT* (`T-223`, 2026-09-02 — a record is
   appended, never rewritten). **Main is the ref the lane's own COMMITS
   cannot move.** That is narrower than the struck clause, it is all this
   step needs, and it is what git actually guarantees: committing on a
   lane branch advances the LANE branch, so no commit a lane makes —
   including one that rewrites its own card's `touches:`, and including
   one that rewrites the manifest — changes what `main` NAMES. The two
   bodies that measure it are `landing-gate.spec.ts`'s *"a manifest
   edited INSIDE the lane does not widen this gate"* and *"a lane editing
   its OWN card's `touches:` does not widen this gate either"*. What a
   lane CAN do is move the ref without committing at all, and that is now
   a DISCLOSED LIMIT rather than a contradicted absolute — limit 6 in
   `landing-gate.mjs`'s header, driven end to end by that spec's *"THE
   DISCLOSED LIMIT, MEASURED: a lane moves local `main` with
   `update-ref` and this gate follows it"*. `T-223` also WEIGHED
   preferring `refs/remotes/origin/main` here and REFUSED the reorder:
   measured at git 2.50.1 from a lane worktree, `git update-ref
   refs/remotes/origin/main` and a plain `git fetch .
   +<sha>:refs/remotes/origin/main` both exit 0, so that ref carries no
   checked-out-elsewhere guard at all and the reorder would have been a
   weaker guard wearing a stronger one's costume — and it would refuse a
   lane widened by the route this gate's own `ROUTE` text prescribes,
   since a fast-path-A amendment reaches origin only after a push and a
   fetch;
3. intersect with **`T-209`'s one implementation** — this card takes the
   push call site; the integrator ritual takes the merge call site on
   the RANGE RULE's integrator pair; a second copy of the intersection
   is `T-057`'s defect;
4. **REFUSE the push, naming every out-of-fence path.** A refusal that
   does not say what escaped sends the seat back to guessing.

A card with an ABSENT or EMPTY `touches:` is the universal set's dual at
this gate: every changed path is out-of-fence, so the push is refused
whole (`T-209`'s rule 2, same reasoning — the least careful card must
not get the widest licence).

## What this gate cannot see, stated so it is not oversold

**A lane writing ANOTHER lane's worktree never appears in its own
diff.** That vector is `T-210`'s, and the two cards state each other's
blind spots on purpose — a guard trusted further than it measures is
this project's most repeated defect.

**A `touches:` AMENDMENT RIDES IN UNDER THE UNFENCEABLE DIRECTORY AND
WIDENS THE NEXT PUSH** (`T-224`, found by this card's verifier and
undisclosed here until it was). Both arms admit every changed path under
`docs/tasks` — they must, since that is where every card's dispatch stamp
and closing stamp are written, and it is what makes these very notes
performable. So the two bodies proving that a lane editing its own card
does not widen THIS push are true and are **not the whole account**: the
amendment is itself an admitted path, so it pushes, it merges, and from
the next push onward this gate reads the widened `touches:` as the card
of record. That is `T-211`'s fast path A — which this gate's own refusal
text reserves to triage — taken unilaterally one merge later, and the
same route reaches **a sibling's** card, so lane A can widen lane B's
fence. `T-224` owns the fix and it is precise: judge the `touches:` LINE
across the range rather than the file. The directory stays unfenceable.

**AND THE LOCAL INTEGRATION REF IS MOVABLE FROM INSIDE A LANE**
(`T-223`) — see the correction under build step 2 above.

*Both were absent from this section until the verdict, which is the
defect this section exists to prevent: a limits paragraph that omits the
guard's own bypass is the shape this project keeps finding.*

2026-09-08 (`T-224`): the `touches:` AMENDMENT above is CLOSED — the gate
now judges the `touches:` LINE across the judged range at both landing
moments and REFUSES a card whose line moved, its own or a sibling's,
while `docs/tasks` stays unfenceable and every other write to a card
(the stamp, the notes, a suggestion, a whole new card) is admitted
exactly as before. What that arm still cannot see is FIVE things, listed
in `landing-gate.mjs`'s own limit 5 and not copied here: a card the range
ADDS, a card it DELETES, a range the containment arm already refuses, a
card whose fence this gate could not expand from the integration branch,
and limit 6, which reaches the new arm through the same movable local
ref. The line a legitimate fast-path-A grant leaves in a lane's working
copy is exonerated by comparing it against the integration branch's own
copy — argued in that module's header, since a gate refusing the route
its own `ROUTE` text prescribes would be the `T-223` trap one paragraph
over.

## Acceptance criteria

- A PUSH of a lane branch whose merge-base-to-tip diff contains a path
  outside the card's expanded fence SHALL be REFUSED, and the refusal
  SHALL name every out-of-fence path.
- **A POSITIVE CONTROL SHALL prove a lane push wholly inside its fence
  is ALLOWED**, and a second SHALL prove a NON-lane push is UNAFFECTED
  by this arm — a guard that refuses everything is indistinguishable
  from one that works.
- A lane carrying a legitimate checkpoint sync SHALL NOT be refused for
  main's own paths — a body SHALL prove the diff is computed
  merge-base-to-tip.
- A card with absent or empty `touches:` SHALL have its push refused
  whole.
- THE fence SHALL be expanded from the card as committed on MAIN at
  push time; one body SHALL prove a manifest edited inside the lane
  does not widen this gate, and a second SHALL prove a lane that edits
  its own card's `touches:` does not widen it either — the lane's copy
  of its card is admitted to the diff as a protocol write (status,
  stamps) and has NO EFFECT on this gate's fence.
- THE intersection SHALL be `T-209`'s implementation, imported — not a
  second derivation.
- THE guard SHALL be proved to FIRE end to end per `T-167-s8`'s
  three-arm shape: a real out-of-fence commit, a real push attempt
  against a bare remote, and the remote ref asserted UNCHANGED.
- **This card is GUARD-CLASS**: `review: independent`, set at filing.
- Verification: headless.

## Why `blocked_by: [T-209]` and why this is not part of `T-203`

`T-209` builds the single intersection this gate calls; building a
second one here is the exact defect `T-209` exists to end. And `T-203`
is dispatch-ready TODAY — its token gate would have refused three real
pushes the night it was filed — so welding this gate onto it would park
a ready p1 guard behind two lanes. One hook, two arms, two cards:
`T-207`'s own precedent, one artifact per meaning.

## Read beside

`T-209` (the implementation this calls), `T-203` (the same hook's other
arm — the token gate), `T-210` (the physical layer covering this gate's
blind spot, blocked on this card), `T-211` (the fast paths whose sync
this gate's merge-base rule accommodates), `T-167-s8` (the fire-proof
shape), `T-025-s4` (why outcomes are judged, not intentions),
`method/lane-protocol.md:182`.

---

## Implementation notes (executor, 2026-09-01)

Built in `/Users/ujju/Projects/nputer-T-212` on `task/T-212-lane`.
**Base DERIVED, not transcribed**: `git merge-base main HEAD` =
`0a8dd586` — which agrees with the manifest's `ref`, and which is NOT
main's tip: main moved to `fcdae0c` while this lane ran (T-127-s7's
merge plus T-221's filing). Every figure below carries the ref it was
measured at.

### What was built

Three files under `.claude/hooks/`, one arm each on the two moments a
path can LAND, plus the spec:

- **`landing-gate.mjs`** — `laneLandingVerdict` (the push moment) and
  `mergeLandingVerdict` (the merge moment). Pure of the harness; every
  git call and the expansion are injectable seams.
- **`expand-fence.mjs`** — a subprocess that pipes a `touches:` token
  list through the project's ONE expansion and prints the answer.
- **`push-guard.mjs`** — wired: the lane arm runs BEFORE the manifest is
  opened (the `lane-cannot-regenerate` allow two arms down would
  otherwise return first), the merge arm on a push of the integration
  branch.
- **`lane-fence.mjs`** — `touchesLineOf` now delegates to a generic
  `frontmatterLineOf(text, field)`, so the gate's `id:` read and the
  `touches:` read are ONE scanner rather than two.
- **`tools/e2e/tests/landing-gate.spec.ts`** — **23** bodies
  (`grep -c '^test(' tools/e2e/tests/landing-gate.spec.ts`, and 23
  `✓` lines in the run). The first draft of these notes said 24: a
  figure carried across from a full-suite delta instead of derived from
  the file, which is the arithmetic this project's own rule against
  transcribed figures exists to stop.

### THE EXPANSION PROBLEM THE CARD DOES NOT NAME, AND HOW IT IS SOLVED

Step 2 says expand `touches:` at push time. `expandFence` is
`@nputer/parser`'s and the hook budget is node builtins only, because *a
fresh lane worktree has no `node_modules` and no `lib/parser/dist`* —
which is the whole reason `T-154` expands ONCE at dispatch into a
manifest. And the manifest is exactly what this card forbids reading.

**Resolved without a second implementation.** `lib/parser/src/fence.ts`
carries exactly one import and it is an `import type`, erased before
execution — so node's default type stripping imports the SOURCE with
nothing installed and nothing built. Verified at `0a8dd58`:

    IMPORT-OK {"paths":[".claude","tools/e2e"],"unusable":[],"excluded":[]}

A subprocess rather than a dynamic import because `decide` is
SYNCHRONOUS and is paid on every `Bash` call in the session;
`runCheck` in the same file already spawns a far heavier program for
that reason. One body drives seven token lists through both the
expander and the parser's own `expandFence` and requires
`paths`/`excluded`/`unusable` to agree field for field.

### Four decisions the card did not make, made here

1. **`alwaysWritable` PARTICIPATES at this call site, and that does not
   contradict `T-209`.** T-209 ruled it out of a fence-VERSUS-fence
   comparison, where rule 5 says a fence-versus-fence question "has no
   term for" a protocol write. This gate asks a PATH-versus-fence
   question, which is the write-time arm's question, and that arm has
   allowed `docs/tasks` since T-154 for rule 5's stated reason: every
   card's dispatch stamp and closing stamp are written there. Without it
   a lane's own implementation notes — this section — would be an
   out-of-fence path. The `unfenceable-dropped` drill reds two bodies.
2. **CANNOT COMPARE is an ANNOUNCED ALLOW, not a refusal**, and this is
   the decision most worth attacking. `push-guard.mjs`'s header argues
   its fail-open contract at length, and a landing gate that refused
   every fence it could not fully expand would refuse a large fraction
   of the board (see 4). The announcement names the unresolvable tokens
   AND every path it therefore could not judge, and says UNJUDGED rather
   than clean. A verifier who reads rule 5's *"worse than one that
   refuses"* as governing here should say so: the change is one `allow`
   to one `block`, and `T-222` is the card that makes it affordable.
3. **THREE STATES, NOT TWO, ON THE WAY IN.** A checkout with no
   integration ref, or whose integration branch carries NO cards at all,
   gets an ORDINARY SILENT allow — the gate has no question there, which
   is `push-guard.mjs`'s own `not-this-repository` shape. A board that
   DOES carry cards and carries none for this lane is a DISPATCH ERROR
   and is REFUSED. Collapsing them either way is wrong in a measured
   direction: refusing the first red three existing push-guard bodies
   (below); allowing the second hands a lane the bypass of naming a
   branch no card answers to. One body drives both halves; the
   `no-card-allows` drill reds two.
4. **The card is located by FILENAME, not by reading 420 files.**
   Measured over `docs/tasks/` at `0a8dd58`: **420 cards, 0 mismatches**
   between frontmatter `id:` and the filename's id, and exactly two id
   shapes live (`T-N`, `T-N-sN`). A body re-measures it rather than
   trusting the figure. `LANE_BRANCH_RE` captures `(\d+)` only, so
   `task/T-163-s4-lane` would resolve to `T-163` — `normaliseTaskId`'s
   own comment records that exact defect from the T-153-s5 dispatch — so
   the gate tries the SUFFIXED id first.

### Where the card and the brief are wrong, said plainly

1. **The brief assigns this card the merge moment; the card assigns it
   to "the integrator ritual".** Built anyway, as a second arm, because
   the brief is specific about it and because two cards wait on this
   one. But the merge arm has a limit the push arm does not: a merge's
   lane is identified from `git for-each-ref --points-at <M^2>`, and a
   merge whose lane branch has already been deleted is answered CANNOT
   COMPARE. It is NOT identified from the merge SUBJECT — this project
   writes custom merge subjects and no document publishes their shape,
   so a scanner over them would be a convention invented at a read site.
2. **The brief's merge range is a THIRD pair, and CONVENTIONS' RANGE
   RULE does not cover it.** That bullet's two pairs answer "what did
   the merge ADD to main"; this gate asks "what did the LANE write",
   which is `merge-base(M^1, M^2)..M^2`. It ends at the SECOND PARENT,
   so the forbidden `<merge-base>..<the merge commit>` prohibition — and
   its 9-against-36 measurement — does not reach it. Stated in the
   module header because the notation looks like the one that bullet
   forbids.
3. **The card's step 1 is right and its reason is incomplete.** It
   justifies merge-base-to-tip by the checkpoint sync. The sharper case
   is the UNSYNCED lane: after a sync `main` and `merge-base(main, HEAD)`
   are THE SAME COMMIT, so a synced fixture cannot tell the prescribed
   range from the two-dot `main..HEAD`. Found by a poison drill that
   SURVIVED — see the ledger.

### Gates, each with its exit read and not its code guessed

| gate | exit | note |
|---|---|---|
| `tools/e2e` full suite | **0**, 443 passed | worktree count 12 → 12 either side (T-220) |
| `lib/parser` vitest | **0**, 344/344 | |
| `app` npm test | **0**, 1119/1119 | 14 red first, ALL of the unbuilt-`app/dist` class; `npm run build` then green |
| `docs-gate.mjs` (8 literal paths) | **1 = FIRES** | owed the three suites above, all run. Exit read from the OUTPUT: `docs-gate:` verdict lines, not a stack trace |
| `index --check` | **0 CURRENT** | 1153961 of 2145959 bytes; no regen owed |
| BOOT GATE | **not owed** | 0 of 8 paths match its trigger, measured on the RANGE RULE's executor pair (`merge-tree --write-tree fcdae0c HEAD` → `e5515ab`) |
| `capabilities:check` | **1 STALE** | `T-218`: `docs/CAPABILITIES.md` is outside this fence (`BLOCK judged=true outside-the-fence`, against `ALLOW inside-the-fence` controls). **NOT regenerated here — the integrator owes `npm run capabilities` in the merge commit.** |

### The drill ledger — 11 mutants, each landing decided by `git diff`

Every drill asserted its anchor matched EXACTLY ONCE, then asserted
`git diff --numstat` showed the change, then restored to a
byte-identical tree, `git status` clean after each.

**THE RESTORE HASHES CARRY THEIR REFS**, which the first draft of this
ledger omitted — a hash without one is a figure whose subject moves, and
this one did: `landing-gate.mjs` sha256 **`eca6da94…` AT `ad942b6`**,
where the first ten drills ran; `push-guard.mjs` **`e7cfaa41…` at
`ad942b6`**, still current; `lane-fence.mjs` **`ac322c73…` at `208f730`**,
where the eleventh ran. `landing-gate.mjs` is `0b0b8094…` at `f093b7a`
and moves again with this verdict's corrections. **Every delta since
`ad942b6` is inside the `/* */` module header** — comment-stripped, the
code is byte-identical — so all eleven drills still bind to the shipped
behaviour. The verifier derived and closed this rather than charging it;
the missing refs were the defect, not the drills.

| mutant | reds |
|---|---|
| the diff enumeration returns no paths | **7**, including THE POSITIVE CONTROL itself |
| the fence is read from `HEAD` instead of the integration ref | 2 |
| containment by string equality instead of `within` | 7 |
| the two-dot range instead of merge-base-to-tip | **0 at `ad942b6` — SURVIVED**; 1 after the body it exposed |
| `unusable` ignored, cannot-compare spelled as a refusal | 1 |
| the universal dual allows | 2 |
| `unfenceable` dropped from the admitted domains | 2 |
| the merge arm never refuses | 2 |
| a lane with no card on main is allowed | 2 |
| the arm decides and the hook ignores it | 8 |
| `within`'s separator dropped (`T-221`'s own mutant) | 2 |

**THE SURVIVOR IS THE FINDING.** At `ad942b6` the range mutant passed
22 of 22, and the reason is structural, not a weak assertion — see
"Where the card is wrong", 3. The body added at `6f6cd3b` measures both
ranges on its own fixture before pushing, so it fails loudly if the
fixture ever stops reproducing the disagreement, and the re-drill reds
exactly it.

### The gate run against REAL history, which the fixtures cannot answer

A read-only probe drove this gate's own `cardAt` / `fenceAt` /
`rangePaths` / `judgePaths` over the **40 most recent merges on main** at
`fcdae0c` (the probe identifies the lane from the merge SUBJECT, which
the gate itself deliberately does not do — that is why it is a
measurement and not the gate):

| | count |
|---|---|
| clean — every path the lane wrote is inside its fence | **21** |
| **would refuse** | **0** |
| unjudged | **19** |
| identifiable by a LIVE LANE BRANCH — the merge arm's own route | **21** |

**ZERO FALSE REFUSALS ACROSS 21 REAL, CORRECT MERGES.** That is the
positive control the fixtures cannot give: a guard that refused
correctly-fenced work would have shown it here.

**AND ALL 19 UNJUDGED ARE THE SLUG HOLE**, every one — `app-board`,
`app-agent`, `crate-index`, `app-shell`, `app-map`, `app-interview`,
`lib-parser`, `app-dispatch`. So `T-222`'s cost measured on real history
is **19 of 40 merges** rather than the token census's rough share, and
it is the single largest limit on this gate.

**The merge arm's identification is the second limit and it is
comparable in size**: **21 of 40** merges had a live lane branch at their
second parent when this was run, so the rest are answered CANNOT COMPARE
by the arm even where the fence would resolve.

**THAT FIGURE NEEDS A CLOCK AS WELL AS A REF, AND THIS IS THE CORRECTION
THAT SAYS SO.** The verifier derived **22** where this lane derived 21,
at a different moment, and neither is wrong: the count is a live property
of BRANCH-CLEANUP STATE, not of the code. `lane-protocol.md` rule 6 has
the integrator remove the **WORKTREE** — it does not delete the branch —
so lane branches accumulate and this number DRIFTS UPWARD until somebody
prunes, then falls. Read at **2026-09-01, main `fcdae0c`: 21 of 40**;
re-derive it before quoting it, exactly as docs/STATE.md's LANES line
demands of every lane fact. The verifier's own R3 predicted retrospective
coverage near zero on the belief that rule 6 deletes the branch, and
retracted it for this reason — recorded because the retraction is the
part worth carrying.

The limit may deserve a card of its own; it is reported rather than filed
because the board took **four** new ids under this lane while it ran
(`T-221` by another lane, `T-222` by this one after a collision, `T-223`
and `T-224` by the verifier).

### Routed, not taken

- **`T-222`** filed: a SLUG token cannot be expanded inside the hook
  budget (the slug map needs `yaml`), so a slug-fenced lane's
  out-of-fence paths are ANNOUNCED rather than refused. Measured census
  on the card — `app-shell` 79 cards, `app-agent` 43, `crate-index` 26,
  `app-board` 25, `app-map` 23, `lib-parser` 22, `app-interview` 19,
  `app-dispatch` 10. **Filed first as T-221 and renumbered**: another
  lane took that id on main while this one ran, and the free id was
  re-derived from `git ls-tree main`, never from this lane's copy.
- **`T-221` is narrower than it reads, measured.** It says dropping the
  containment separator reds nothing anywhere. True of `sharedDomain`;
  NOT true of `within` — the drill reds `lane-fence.spec.ts`'s "a name
  that merely starts the same is not inside", which pre-dates this card,
  plus this card's own body. `T-221`'s hole is `lib/parser`'s alone.
- **`T-216`** governs this arm exactly as it governs the graph arm: the
  root is the WRITER's cwd. Not fixed here; both arms share it, and
  fixing one would leave the file with two rootings. *The verdict judges
  this rooting CORRECT for this arm — at a lane push the writer's cwd IS
  the lane worktree — so T-216's concern lands on the graph arm and not
  on this one.*
- **`T-218`**: `capabilities:check` red, integrator regenerates.

### Filed by the verifier, disclosed here (the verdict's three corrections)

- **`T-224`** — the transitive widening: a `touches:` amendment rides in
  under the unfenceable directory and is the card of record from the next
  push on. Now in this card's "cannot see" section and in the module
  header's limits, where its absence was the real finding.
- **`T-223`** — local `main` is movable from a lane with `update-ref`.
  The false absolute is struck at build step 2 and corrected in the
  module header; reproduced independently by this executor before
  writing the correction.
- The ledger hashes now carry their refs, and the body count is derived
  from the file (**23**, not 24).

### For the verifier

- The positive control is one body, refuse-then-allow, one armed lane,
  with the REMOTE REF asserted unchanged on the refusal and moved on the
  allow. The decisive mutant (no changed paths) reds it directly.
- Decision 2 above — cannot-compare allows — is the one most worth
  attacking, and it is a one-word change if the verifier reads rule 5
  the other way.
- Everything the gate cannot see is in the module header rather than
  here: another lane's worktree (`T-210`'s), a push of a ref that is not
  HEAD, uncommitted work, and a push reached through an alias or a
  script (`gitInvocations`' declared ceiling).

---

## Verdicts

2026-09-01 — claude-opus-5@subagent (verifier, BLIND TWO-PHASE,
`review: independent`): **APPROVED.**

**THE BLINDNESS WAS KEPT AND IS AUDITABLE.** The attack set was written
from the card at its base `0a8dd58` plus `T-209`, `method/lane-protocol.md`
rule 5, CONVENTIONS' RANGE RULE and `roles/verifier.md` — and SEALED at
sha256 `6257af6c6a56b70438ccd9516e51f5f8b50af5afa8c52c6377cf7eb688e3ceee`
before the diff, the notes, the branch or any spec was opened. The card's
headings were checked first for `T-213`'s hazard: none present at
`0a8dd58`. Lane context arrived in a second message, after the seal.

### The gates, at the commit under review `f093b7a`, each exit read from its output

| gate | exit | figure |
|---|---|---|
| `tools/e2e` full suite (`NPUTER_E2E_PORT=22212`) | **0** | **443 passed**, 23 of them `landing-gate.spec.ts` |
| `lib/parser` `npx vitest run` | **0** | **344 passed** |
| `app` `npm test` | **0** | **1119 passed** |
| `docs-gate.mjs`, repo root, 9 separate literal paths | **1 = FIRES** | **7 `docs-gate:` lines, 0 stack frames** — a verdict, not a crash |

The first e2e attempt exited **1** and it was NOT a red: `app/node_modules
is missing`, a config-load precondition. Cleared through the ADR-011 order
(`lib/parser` ci+build, then `app` ci+build, both 0). Recorded because the
exit alone would have been charged to this diff.

### Every criterion, reproduced rather than accepted

- **Refusal, naming every out-of-fence path** — proved, and the body
  additionally asserts the refusal does NOT name the in-fence path.
- **THE POSITIVE CONTROL** — met at the standard `T-209` set. One body,
  one armed lane, refuse-then-allow, remote ref asserted UNCHANGED on the
  refusal and MOVED on the allow. **Re-drilled independently**: the
  decisive mutant (`rangePaths` returns no paths) reds **7 bodies
  including the positive control itself**, 41 passed — so an ALLOW here
  cannot be a mechanism that failed to arm. Anchor asserted unique before
  mutation; restored and **verified by sha256 against the pre-mutant file**
  (`0b0b8094b9d05263072bf1468b2345064bbafa9a6505822a4708225461e7f548`),
  never by `--numstat` and never against HEAD.
- **Non-lane push unaffected** — proved, and asserted silent.
- **merge-base-to-tip** — both range bodies MEASURE their own precondition
  (that the prescribed and forbidden ranges actually disagree on that
  fixture) before pushing. The unsynced body is the one that matters and
  the surviving poison drill that produced it is the honest finding.
- **Absent/empty `touches:` refused whole** — proved, both halves.
- **Fence from MAIN** — two separate bodies, manifest and card, and the
  decisive mutant reds both.
- **The intersection imported** — `within` is imported from
  `lane-fence.mjs`, which is the primitive `T-209`'s notes twice rule
  correct for this one-directional question. No second derivation.
  Driven directly: `tools/e2e-old/x.ts` is OUTSIDE fence `tools/e2e`.
- **Three-arm fire proof** — and the fixture runs the command
  `.claude/settings.json` actually wires, which closes the gap between
  "the module refuses" and "the armed guard refuses".
- **`--no-renames`, `-z`, no `--diff-filter`** — the three diff-derivation
  false-ALLOWs my attack set aimed at (a rename hiding its source, a
  filtered deletion, a quoted path) are all closed, each reasoned in place.

### The lane's own figures, re-derived at my refs

420 cards / **0** id-filename mismatches, and **317 of 317** `touches:`
lines in the single-line flow shape, both at `0a8dd58`. `push-guard.mjs`
restored to `e7cfaa41…` — matches the committed file exactly.

### Where my sealed rulings were WRONG, said before the ones where they held

1. **`excluded` does not subtract here.** My attack set demanded it. The
   parser's `excluded` is *the card's own file carved out of a directory
   domain*, not a deny-list, so admitting it is correct. Wrong assumption
   about this codebase, not a defect in the build.
2. **The merge arm's ref-derived identification is sounder than I ruled.**
   I predicted retrospective coverage near zero because rule 6 deletes the
   branch. Rule 6 deletes the **worktree**, not the branch. Derived over
   the 40 most recent first-parent merges at `fcdae0c` with this gate's own
   `LANE_BRANCH_RE`: **22 judgeable, 18 with no ref, 0 ambiguous.** The
   executor reported 21 at the same ref hours earlier; neither is wrong,
   and that is the point — **the number is a live property of branch-cleanup
   state, not of the code**, and should be reported with a clock and not
   only a ref.

### CANNOT-COMPARE AS AN ANNOUNCED ALLOW: the executor nominated it, and I do not reject it

My sealed ruling was that the third verdict must REFUSE at landing. On
the merits, against my own list:

1. **Rule 5's letter is satisfied.** Its objection is to a fence that
   answers "no overlap" when it means "I do not know". This gate answers
   `THE LANDING GATE DID NOT JUDGE …`, names the unresolvable tokens AND
   every path it could not judge, and closes "which is not a claim that
   they are inside the fence". Three verdicts exist and are
   distinguishable; rule 5 does not itself require the third to be a
   refusal.
2. **The measurement I did not have when I sealed the list is decisive.**
   19 of 40 real merges carry a slug token the hook budget cannot expand.
   A refusal would block roughly half of real lane pushes, and a guard
   routinely cleared with `--no-verify` teaches the bypass. My own
   "`--no-verify` exists, so refusing is cheap" argument reverses at that
   frequency.
3. **It is mechanically distinguishable, not merely prose** — a distinct
   `code` in the exported, spec-pinned `ANNOUNCED_ALLOW_CODES`, carried as
   `notices` so it stands ALONGSIDE the graph verdict instead of replacing
   it, and written unconditionally by the hook.
4. **My carve-out was honoured one level finer than I asked.** I required
   that an internal cannot-compare not hide inside the harness's fail-open
   concession. The lane split absent QUESTION (no integration ref, no
   board, no remote — ordinary SILENT allow) from unanswered QUESTION
   (announced), and pinned the split in `push-guard.spec.ts`.

Residual risk, named not charged: the announcement is exit 0, so nothing
consumes it and it decays by `T-207`'s pattern. That is the project's
pre-existing announced-allow contract, and `T-222` is the card that makes
the refusal affordable.

### FINDINGS — none blocking, two filed, one owed as a correction

- **The drill ledger's sha256 is a figure without a ref.** It reads
  `eca6da94…`; the committed file is `0b0b8094…`. Derived: `eca6da94` is
  the file at `ad942b6`/`6f6cd3b` — the drills' own refs — and it moved
  twice after. **Closed here rather than charged**: both post-drill deltas
  are inside the `/* */` module header, and with block comments stripped
  the code is byte-identical at both refs (`08845ea97880ea0d…`), so all 11
  drills still bind. This is `roles/verifier.md`'s FIGURE CASE landing on
  the executor. **One line owed: give that hash its ref.** (The notes also
  say "24 bodies"; `landing-gate.spec.ts` declares and runs **23**.)
- **`T-223` filed** — "main is a ref the lane cannot move" is false, and
  it is asserted in this card's build step 2 and repeated at
  `landing-gate.mjs:29`. Reproduced: `git branch -f main` refuses from a
  lane worktree, `git update-ref refs/heads/main` is ACCEPTED, and
  `integrationRefCandidates` tries LOCAL main first. The floor is
  unchanged — a seat that can do that can `--no-verify` — but a guard must
  not state an absolute it does not have.
- **`T-224` filed** — a `touches:` amendment rides in under the
  unfenceable directory. Both arms correctly admit every `docs/tasks`
  path, so the amendment pushes, merges, lands on main, and is the card of
  record from the next push onward. That is `T-211`'s fast path A taken
  unilaterally from inside the lane, which this gate's own `ROUTE` text
  reserves to triage, and it reaches a SIBLING's card too. Named in
  neither this card's "cannot see" section nor the module header's four
  limits.

### Owed at the merge, not here

`capabilities:check` is **1 STALE** (`T-218`) — the integrator runs
`npm run capabilities` in the merge commit, where every regeneration in
`git log -- docs/CAPABILITIES.md` has landed. `T-216` governs this arm's
rooting and is disclosed in the module header rather than fixed, correctly.

### Bench hygiene (`T-220`)

Three whole-line `git worktree list` set differences across this pass, all
at **count 15 → 15**: `nputer-V-167s5` `7b712c1`→`d17258e`, then
`nputer-V-175` and its bench `a7eb25a`→`f4cbc62`, then `nputer` itself
`cac24d6`→`a5ad66f`. **An entry MUTATING IN PLACE** — invisible to a count
and to a path-only set difference alike. `main` moved twice under this
verification (`fcdae0c` → `cac24d6` → `a5ad66f`), which is why every
figure above carries its ref.
