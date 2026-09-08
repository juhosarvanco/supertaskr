/**
 * THE LANDING GATE (T-212) — nothing out-of-fence may LAND, at either
 * moment it could.
 *
 * **THE COMPLETE ACCOUNT OF WHAT A LANE WROTE IS ITS COMMITTED DIFF.**
 * `T-025-s4` proved that deciding what an arbitrary shell command will
 * write is not a parsing problem this project will win, and `T-199`'s
 * write-time fence sees only writes made with the write TOOLS — a
 * redirect, a `sed -i` or a script goes straight past it. This module is
 * the layer above both, and the only one whose coverage is total by
 * construction: whatever wrote a file, only COMMITTED content can land,
 * and committed content is fully visible in `git diff --name-only`. The
 * outcome is judged, never the intention.
 *
 * ── THE TWO MOMENTS ──────────────────────────────────────────────────
 * `laneLandingVerdict` answers a push of a LANE branch: the lane's own
 * merge-base-to-tip diff against the fence its card declares on main.
 * `mergeLandingVerdict` answers a push of the INTEGRATION branch: every
 * merge commit the push would carry, each judged over its own lane's
 * range with the fence read from the merge's FIRST parent. They are one
 * containment rule at two call sites, and the rule is `within`.
 *
 * ── THE FENCE COMES FROM MAIN AND FROM NOWHERE ELSE ──────────────────
 * Not from `.supertaskr/lane-fence.json`, which lives IN the lane and which
 * a lane can rewrite. Not from the lane's own copy of its card at any
 * tip, because `method/lane-protocol.md` rule 5 rules that "a fence is
 * not widened from inside the lane it fences" and a gate reading a card
 * the lane authored is precisely that widening. From
 * `git show <integration>:docs/tasks/…`, which is where a legitimate
 * widening lands, since the widening act is a card amendment COMMITTED
 * on main plus a re-run of `--write-fence` (`T-211`).
 *
 * ── THE PROPERTY THIS RESTS ON, STATED AS THE PROPERTY IT ACTUALLY IS ─
 * **`<integration>` is the ref the lane's own COMMITS cannot move**
 * (`T-223`). That is the whole of what the paragraph above needs and the
 * whole of what git guarantees here: committing on a lane branch
 * advances the LANE branch, so no commit a lane makes — including one
 * that rewrites its own card's `touches:`, and including one that
 * rewrites the manifest — changes what `<integration>` NAMES. Two bodies
 * measure exactly that and neither is about intentions:
 * `landing-gate.spec.ts`'s *"a manifest edited INSIDE the lane does not
 * widen this gate"* and *"a lane editing its OWN card's `touches:` does
 * not widen this gate either"*.
 *
 * **IT IS NOT "a ref the lane cannot move", WHICH IS WHAT THIS HEADER
 * SAID UNTIL `T-223`.** `integrationRefCandidates` tries the LOCAL
 * `main` FIRST, and a local ref is movable from inside a lane worktree
 * by a command that writes no commit at all. Measured three times — at
 * `T-212`'s verification, again by its executor, and again at `T-223` on
 * git 2.50.1 (Apple Git-155), each time in a throwaway repository with
 * `main` checked out in worktree A and a lane branch in worktree B, run
 * from B:
 *
 *     git branch -f main <sha>              -> fatal, exit 128: cannot
 *                                              force update the branch
 *                                              'main' used by worktree …
 *     git update-ref refs/heads/main <sha>  -> exit 0, main moved
 *
 * `git branch -f` carries the checked-out-elsewhere guard; `update-ref`
 * does not. So a lane CAN point local `main` at a commit whose copy of
 * its own card carries a wider `touches:`, and this gate will expand
 * THAT fence — limit 6 below, and `landing-gate.spec.ts`'s *"THE
 * DISCLOSED LIMIT, MEASURED: a lane moves local `main` with
 * `update-ref` and this gate follows it"* drives the whole route end to
 * end rather than arguing it. It is not a hole an ordinary lane falls
 * into: it takes a deliberate plumbing command, and a seat willing to
 * run it could reach for `git push --no-verify` instead. **The floor is
 * unchanged; what was wrong was an ABSOLUTE**, stated in the one
 * paragraph a reader consults to decide how far to trust this gate,
 * which is rule 5's *"a guard described as total is worse than no
 * guard."*
 *
 * ── AND PREFERRING THE REMOTE-TRACKING REF WOULD MAKE IT WORSE ───────
 * `T-223` WEIGHED reordering `integrationRefCandidates` to try
 * `refs/remotes/origin/<branch>` first and REFUSED the reorder, on three
 * counts. The first is measured, in the same drill as the pair above and
 * from the same lane worktree:
 *
 *     git update-ref refs/remotes/origin/main <sha>  -> exit 0
 *     git fetch . +<sha>:refs/remotes/origin/main    -> exit 0
 *
 * **ONE, a remote-tracking ref carries no checked-out-elsewhere guard at
 * all**, because no worktree can check one out — so the reorder would
 * trade a ref that at least refuses `git branch -f` for one that refuses
 * NOTHING, and the second line above reaches it with no plumbing command
 * at all. Against this card's own threat that is a weaker ref, not a
 * stronger one, which is why "narrows the window" was the right thing to
 * suspect and the wrong thing to assume.
 * **TWO, it would break the one widening route this file's `ROUTE` text
 * prescribes.** A fast-path-A amendment is COMMITTED on the integration
 * branch (`T-211`); it reaches `refs/remotes/origin/<branch>` only after
 * a push and a fetch, so a gate preferring the remote would refuse a
 * lane that had been widened exactly as instructed, for as long as the
 * two refs disagree.
 * **THREE, the order is not this file's to change.**
 * `dispatch-brief.mjs` OWNS it — its comment there argues bare-name-first
 * as a safety property for a DIFFERENT question, "which revision does
 * THIS checkout hold" — and `landing-gate.spec.ts`'s *"the
 * integration-ref candidates are dispatch-brief's, spelling for
 * spelling"* pins the two lists together, so a reorder here is a reorder
 * there. `T-153-s9` is why the fallbacks exist at all and is untouched:
 * on a `pull_request` checkout the bare name resolves to nothing and the
 * list is read in order until something does.
 *
 * **THE LANE'S OWN CARD IS STILL ITS OWN TO WRITE**, and that is not a
 * contradiction: rule 5 puts every card outside every fence including its
 * own, so a lane's status stamp and its implementation notes are protocol
 * writes that this gate admits to the diff and reads nothing from.
 *
 * ── ONE IMPLEMENTATION, IMPORTED, AT EVERY LAYER (T-057) ─────────────
 * The containment test is `within` from `lane-fence.mjs` — T-209's own
 * ruling, which built the fence-versus-fence comparison out of the
 * parser's `compareFences`/`sharedDomain` and left `within` for THIS call
 * site, where the question is one-directional: a PATH against a FENCE,
 * not a fence against a fence. The lane branch spelling is
 * `LANE_BRANCH_RE`. The frontmatter read is `frontmatterLineOf`. The
 * expansion is the parser's own `expandFence`, reached through
 * `expand-fence.mjs` for the reason that file's header gives. Nothing
 * here re-derives any of them.
 *
 * ── THREE ANSWERS, NEVER TWO ─────────────────────────────────────────
 * Rule 5: "an unresolved token is not disjoint from everything … a fence
 * that answers 'no overlap' when it means 'I do not know' is worse than
 * one that refuses. Three verdicts, never two." So this module answers
 * `in-fence` (proved), `outside-the-fence` (proved, and it REFUSES) and
 * CANNOT COMPARE — and it never spells the third as the first. What it
 * does with the third is the next paragraph, and it is the one decision
 * here worth attacking.
 *
 * ── WHY CANNOT-COMPARE ALLOWS, LOUDLY, AND WHERE THAT IS WRONG ───────
 * `push-guard.mjs`'s header argues its fail-open contract at length and
 * this arm keeps it: "the seat that pushes is the seat that dispatches,
 * merges and checkpoints; a guard that can halt it on its own inability
 * halts the project, and the first person it inconveniences turns it
 * off." A cannot-compare here is announced on stderr through
 * `ANNOUNCED_ALLOW_CODES`, names the tokens it could not resolve and the
 * paths it therefore could not judge, and never claims the diff was
 * clean.
 *
 * **THE COST IS MEASURED AND IT IS NOT SMALL.** A SLUG token
 * (`app-shell`, `app-agent`, `crate-index`, …) cannot be expanded inside
 * the hook budget, because the slug map is each component file's
 * `touch_slugs:` field and reading it needs `yaml`. On the live board
 * those tokens are common, so a slug-fenced lane gets its RESOLVED
 * domains enforced and an announcement for everything else. Closing that
 * is `T-222`, routed rather than taken: it wants the slug map published
 * in a form the hook budget can read, which is a change to what
 * `--write-fence` commits and belongs with `T-211`'s fast paths.
 *
 * ── AND `T-221` IS NARROWER THAN IT READS, MEASURED HERE ─────────────
 * That card says dropping the `/` from the parser's `sharedDomain` reds
 * NOTHING in the repository, and names this card as a third consumer
 * arriving on the same primitive. TRUE OF `sharedDomain`; NOT true of
 * `within`, which is the primitive THIS call site actually spends.
 * Drilled: dropping `within`'s separator reds two bodies by name —
 * `lane-fence.spec.ts`'s "a name that merely starts the same is not
 * inside", which pre-dates this card, and this card's own containment
 * body. So `T-221`'s hole is `lib/parser`'s alone, and this gate does
 * not widen it.
 *
 * ── WHAT THIS GATE CANNOT SEE, STATED SO IT IS NOT OVERSOLD ──────────
 * 1. **A lane writing ANOTHER lane's worktree never appears in its own
 *    diff.** That vector is `T-210`'s, and the two cards state each
 *    other's blind spots on purpose.
 * 2. It keys on the CHECKOUT's HEAD, exactly as `push-guard.mjs`'s
 *    existing lane arm does. A push of some ref that is not HEAD is not
 *    seen. So is a push from a checkout whose root this hook resolves
 *    wrongly — `T-216`, open, and it governs both arms of this file's
 *    host equally.
 * 3. It reads COMMITTED content only. Uncommitted work cannot land and is
 *    not the question.
 * 4. A push reached through an alias, a function, a script or an `eval`
 *    is not seen at all, which is `gitInvocations`' declared ceiling and
 *    the pre-guard state rather than a regression from it.
 * 5. **A `touches:` AMENDMENT NO LONGER RIDES IN UNDER THE UNFENCEABLE
 *    DIRECTORY — `T-224` CLOSED THAT, AND WHAT IT LEFT OPEN IS BELOW.**
 *    `judgePaths` still admits every changed path under `docs/tasks`, and
 *    must, since that is where every card's dispatch stamp and closing
 *    stamp are written; what is judged now is the `touches:` LINE rather
 *    than the file — `touchesAmendments` and the section below it. The
 *    SIX things that arm still cannot see: (a) a card the range ADDS UNDER
 *    AN ID NO ENDPOINT ALREADY CARRIES has no line at the base to have
 *    moved from, so a lane may commit a genuinely NEW card carrying any
 *    `touches:`, and that card carries a fence nobody triaged (`T-224-s2`).
 *    **THE JUSTIFICATION THIS RESIDUE USED TO CARRY WAS FALSE AND IS
 *    RETRACTED RATHER THAN SOFTENED**: it read *"it fences no live lane,
 *    since a lane's card exists before its branch does"*, which is exactly
 *    wrong for the case `T-224`'s own verifier drove — a card RENAMED in
 *    the range keeps its id while the lane it fences is live, and under a
 *    path-keyed comparison it looked like an ADD at the base and a DELETE
 *    at the tip and rode in unjudged at both landing moments. Resolution
 *    is BY ID now (`cardPathsById`, `cardTouchesOf`), so a rename, a
 *    delete-and-re-add and a re-slug are all JUDGED; this residue is the
 *    genuinely new id and nothing wider; (b) a card the range DELETES — no
 *    path at the tip carrying its id, which now includes a card FILED AWAY
 *    under `docs/tasks/rejected/`, since `CARD_FILE_RE` does not reach
 *    below `docs/tasks/` — is not an amendment either: it cannot widen
 *    anything, because the lane it named then has no card on the
 *    integration branch and `landing-gate-no-card` refuses that lane's next
 *    push WHOLE, so the reachable damage is a DENIAL rather than a
 *    licence; (c) the arm is
 *    asked only where the containment arm has nothing to refuse, so a
 *    range that is BOTH out-of-fence and amended is refused for the
 *    out-of-fence paths and meets this refusal on its next attempt —
 *    deliberate, because the alternative is preempting the refusal the
 *    two `T-212` bodies measure; (d) the lane arm reaches it only after
 *    the lane's OWN card expanded from the integration branch, so a card
 *    this gate cannot read there is a cannot-compare that never asks the
 *    question; (e) limit 6 reaches this arm too — the exoneration in the
 *    section below reads the integration branch through the same movable
 *    local ref; (f) a card id carried by two files under `docs/tasks/`
 *    NONE OF WHICH THIS RANGE ARRIVED AT — the ambiguity is already the
 *    BOARD's, at the range's base or on the fence of record — answers
 *    CANNOT-COMPARE, never a verdict, and so does an `ls-tree` that fails
 *    outright: both are announced on the existing cannot-compare code,
 *    neither is a silent allow, and while the board is ambiguous about
 *    which file IS a card this arm stops judging that id. **THE HALF THAT
 *    IS NOT A RESIDUE IS THE DUPLICATE THE RANGE ITSELF ARRIVES AT, WHICH
 *    IS REFUSED** (`duplicateReport`, `DUPLICATE_ID_ROUTE`): a
 *    cannot-compare ALLOW there was the fail-open shape, and it is the one
 *    `T-224`'s second verdict rode — see the decoy section below. So what
 *    (f) leaves open is a board somebody ELSE made ambiguous, which no
 *    lane reaches through this gate, and which triage repairs on main.
 *    **AND THE COMPARISON IS BYTES, SO A REFLOW IS A MOVE**: the line is
 *    compared character for character, because that is what the
 *    write-time guard compares (`method/lane-protocol.md`'s fast path A:
 *    "character for character"), and a reader that normalised whitespace
 *    here would be a second opinion about what a fence says.
 * 6. **A LOCAL REF REWRITE MOVES THE FENCE, AND THE LOCAL NAME IS TRIED
 *    FIRST.** `integrationRefCandidates` resolves the bare branch name
 *    ahead of either remote spelling, and `git update-ref
 *    refs/heads/<integration>` is accepted from inside a lane worktree
 *    where `git branch -f` is refused — measured above. A lane that runs
 *    it points this gate at a commit of its own choosing, and the
 *    `touches:` on THAT commit is the fence this gate then enforces.
 *    Preferring the remote-tracking ref does not close it, and the
 *    paragraph above measures why not. **The disclosure IS the fix**
 *    (`T-223`): the route costs a deliberate plumbing command that no
 *    ordinary lane runs, and the same seat could `--no-verify` past this
 *    hook entirely — so what was owed was an honest limit rather than a
 *    guard rebuilt around a threat it cannot reach.
 * 7. **THE DEPENDENCY CHECK READS FOUR MANIFEST FORMATS BY HAND, TAKES
 *    THE REGISTRY'S WORD, AND ITS BASE URL IS AN ENVIRONMENT VARIABLE**
 *    (`T-247`). The section below states all three costs and why each
 *    was paid rather than closed.
 *
 * ── THE FIFTH LIMIT IS NOW AN ARM: THE `touches:` LINE, NOT THE FILE ─
 * `T-224`. For every card ID the judged range changed, `touchesAmendments`
 * reads `frontmatterLineOf(text, "touches")` at the range's BASE and at
 * its TIP and compares the two strings. **The file may change freely** —
 * the status stamp, the implementation notes, a suggestion filed beside
 * it, a whole card added — and that is the point rather than a tolerance:
 * `docs/tasks` stays UNFENCEABLE (rule 5), because a lane holding it
 * would collide with every other lane's stamps. **A card whose
 * `touches:` LINE moved is a fence amendment and is REFUSED**, its own or
 * a sibling's alike, with the before and the after named. `T-212`'s two
 * bodies proved a lane cannot widen THIS push from inside; this arm is
 * the other half of that account — the amendment cannot LAND, so there is
 * no next push in which it is the card of record.
 *
 * ── AND THE CARD IS FOUND BY ITS ID, WHICH IS WHAT A SLUG CANNOT DO ──
 * A card's FILENAME carries its title, so retitling a card renames its
 * file while its id stands still — an ordinary editorial act, not an
 * evasion, which is exactly why an evasion can hide inside it. Keyed on
 * the path, this arm read a renamed card as a card ADDED (at the tip) and
 * a card DELETED (at the base), skipped both halves, and let a widened
 * `touches:` land at BOTH landing moments, on the lane's own card and on
 * a sibling's alike; `rangePaths`' `--no-renames` — right for the
 * containment arm, which judges paths — is what leaves the two names
 * unrelated. So `cardTouchesOf` resolves each endpoint by the id
 * `CARD_FILE_RE` captures, over one memoised `ls-tree` of `docs/tasks/`
 * per REVISION: a rename with the line preserved is ALLOWED, a rename that
 * moves the line is REFUSED with both paths printed, and delete-and-re-add
 * resolves the same way, which is the other half of the sentence the
 * card's contract states.
 *
 * ── AND A SECOND FILE CARRYING THE ID CANNOT STAND IN FOR THE CARD ───
 * **THE INDEX IS ASKED AT BOTH ENDPOINTS, AND THE FIRST VERSION OF THIS
 * ARM ASKED IT AT ONE.** It read `git show <rev>:<the path the diff
 * named>` FIRST and consulted the index only where that answered `absent`
 * — a fast path that looks free and is not, because the loop above is
 * keyed on the ID. Compose the two and the pair of endpoints ONE id is
 * judged on can straddle TWO FILES: plant a second file under
 * `docs/tasks/` carrying the card's id, sorting first in the range's path
 * list, repeating the card's CURRENT `touches:` line. At the base it is
 * absent, so the index resolves the id to the real card and yields the OLD
 * line; at the tip it exists, so the direct `show` short-circuits the
 * index and yields the DECOY's copy of that same old line. Equal, so
 * `continue` — and `seen` now holds the id, so the real card's own
 * widening is never examined at all. Not announced, not `unjudged`: an
 * ordinary inside-the-fence ALLOW, at BOTH landing moments, on the lane's
 * own card or a sibling's. `T-224`'s second verdict measured it through
 * this hook and ended with the widened fence as the unambiguous card of
 * record after three allowed pushes.
 * **THE FIX IS THE ORDER, AND THE PRICE IS ONE LISTING PER REVISION.**
 * The index answers first at every endpoint; the diff's path is read only
 * where the index maps the id to exactly that one path there, which is the
 * ordinary case and is the same single `git show` as before. So a range
 * that changes NO card still spends nothing, and a range that changes any
 * card spends one `ls-tree` per REVISION — not per card, which is the
 * property `index`'s memo exists for, and which is what the old
 * `absent`-gated version bought at the cost of correctness.
 * **AND THE AMBIGUITY ITSELF IS NOW A VERDICT RATHER THAN A SHRUG**: an
 * id the range ARRIVES at a duplicate of is REFUSED, because a
 * cannot-compare ALLOW is the one answer a lane can manufacture on
 * purpose. The residue that survives — a board already ambiguous when the
 * range was cut — is limit 5(f).
 *
 * ── THE ONE MOVED LINE THAT MOVES NOTHING, AND WHY IT IS EXONERATED ──
 * **A LEGITIMATE FAST-PATH-A GRANT CAN APPEAR INSIDE A LANE'S OWN RANGE,
 * AND THE BRIEF THAT DISPATCHED THIS CARD SAID IT COULD NOT.** Two of the
 * three deliveries never do: a lane CUT after the amendment carries the
 * new line at both endpoints, and a lane that MERGES main down moves its
 * own merge-base past the amendment, so both endpoints agree again. But
 * `method/lane-protocol.md`'s fast path A prescribes a THIRD, and it is
 * the ordinary one: *"the amendment goes onto the integration branch AND
 * into the lane's working copy of the card"* — and a lane that has not
 * synced then commits, in its own range, a line its base does not carry.
 * A gate refusing that would refuse the one widening route its own
 * `ROUTE` text prescribes, which is exactly the trap `T-223` refused for
 * the remote-tracking reorder one paragraph up.
 * So a move is exonerated when the TIP's line is character for character
 * the line the same card carries ON THE INTEGRATION BRANCH — the lane arm
 * reads that at `rev`, the merge arm at the FIRST PARENT, the two
 * endpoints no lane's commits can write. **That exoneration opens
 * nothing**: the fence in force is read from that same copy, so a line
 * the lane merely re-states there widens the fence by exactly zero. The
 * only way to make the two agree in the lane's favour is to move the
 * integration ref itself, which is limit 6 and is not new here.
 * A move this gate cannot exonerate because it could not READ that copy
 * is REFUSED, not allowed, and the refusal prints what it found there.
 *
 * ── AND IT IS ASKED AFTER THE CONTAINMENT ARM, ON PURPOSE ────────────
 * The containment refusal names actual out-of-fence paths and is the more
 * specific answer; more importantly, `landing-gate.spec.ts`'s *"a lane
 * editing its OWN card's `touches:` does not widen this gate either"* and
 * *"the merge's fence is read from its FIRST parent"* both drive a range
 * that widens a card AND writes outside the narrow fence, and their kill
 * power is the containment refusal. An amendment arm placed ahead of them
 * would refuse those pushes for a different reason and quietly retire two
 * bodies that measure where the fence is read from.
 *
 * ── THE SEVENTH LIMIT IS A CHECK, AND IT REFUSES WHERE THE OTHERS ALLOW
 * `T-247`. A lane's diff that ADDS a dependency name to a manifest or a
 * lockfile is answered by `dependencyRefusals`: the name must RESOLVE on
 * its registry, and its first publication must not be LATER than the day
 * its own card was suggested. A name that does not resolve, a package
 * younger than the card, a registry that cannot be reached and a manifest
 * that cannot be read all REFUSE the landing, naming the package.
 *
 * **THIS INVERTS THE FAIL-OPEN CONTRACT THE PARAGRAPH ABOVE ARGUES, ON
 * PURPOSE, AND THE INVERSION IS AFFORDABLE FOR ONE MEASURABLE REASON.**
 * A cannot-compare about PATHS is unavoidable — every push has paths, so
 * a guard that halted on its own inability would halt the project, and
 * `push-guard.mjs`'s header is right about what happens next. A
 * cannot-verify about DEPENDENCIES is not: this arm asks nothing at all
 * of a range that adds no dependency name, which is very nearly every
 * range this project pushes. So the seat inconvenienced by an unreachable
 * registry is exactly the seat that just added a package — the one
 * occasion where stopping is the point. That is the same rule GSD's
 * isolation guard states in its own header and this card's third
 * criterion states in as many words: **a guard that cannot verify never
 * answers "safe."**
 *
 * ── WHAT IS DERIVED FROM THE TREE AND WHAT CANNOT BE ─────────────────
 * The card rules "derive the manifest set from the tree, never list it",
 * and the split this module draws is exact. **The PATHS are derived**:
 * nothing here names `app/package.json` or `lib/parser/package-lock.json`
 * or any other instance, and a manifest added anywhere in the tree
 * tomorrow is judged with no edit to this file — `manifestKindOf` keys on
 * the BASENAME and the range supplies the paths. **The FORMATS cannot
 * be**: a reader for a file shape is code, and a shape nobody wrote a
 * reader for cannot be parsed by deriving it. So `MANIFEST_KINDS` is a
 * map from basename to reader, and `landing-gate.spec.ts`'s *"every
 * manifest and lockfile the tree carries has a reader in this gate"*
 * measures the tree's own inventory against that map's keys — so the day
 * a fifth format lands in this repository a body reds by name instead of
 * a whole ecosystem going silently unjudged.
 *
 * ── THE THREE COSTS, PRICED ──────────────────────────────────────────
 * **ONE, THE READERS ARE A SUBSET OF EACH FORMAT.** No `yaml` and no TOML
 * library fit the hook budget (`expandTouches`'s own comment prices that
 * budget one function up), so `cargoManifestDeps` scans the dependency
 * TABLES it recognises and `npmManifestDeps` reads the four dependency
 * objects `package.json` declares. A construct outside that subset is
 * read as declaring no dependency, which is a MISS and not a false
 * refusal. The lockfiles are the tighter half and are where the real
 * coverage is: `Cargo.lock` names every crate that will be compiled and
 * `package-lock.json` every package that will be installed, so a
 * dependency that reaches a machine reaches one of those two files.
 * **TWO, A NAME THAT RESOLVES IS TAKEN AT THE REGISTRY'S WORD.** This
 * gate asks whether the name EXISTS and WHEN it was first published. It
 * does not compare an integrity hash, does not look at who owns the name,
 * and cannot tell a typosquat that was registered two years ago from an
 * honest package — `T-247`'s card is about the hallucinated name and the
 * freshly-registered one, and those are the two this answers.
 * **THREE, `SUPERTASKR_REGISTRY_NPM` AND `SUPERTASKR_REGISTRY_CRATES` MOVE THE
 * BASE URL, AND A LANE CAN SET THEM.** They exist because
 * `landing-gate.spec.ts` drives its refusals through the REAL wired hook
 * against a REAL remote, and a suite that reached the live internet would
 * be neither hermetic nor honest. The bypass is limit 6's shape and takes
 * limit 6's ruling: it costs a deliberate act by a seat that could
 * `--no-verify` past this hook entirely, so what is owed is the honest
 * limit rather than a guard rebuilt around a threat it cannot reach.
 * **AND `MAX_DEPENDENCIES_PROBED` IS A FOURTH DECISION, NOT A LIMIT**: a
 * range adding more names than that is REFUSED rather than probed,
 * because an unbounded network loop inside a `PreToolUse` hook is a push
 * that hangs, and a lockfile regeneration that adds that many names at
 * once is the one supply-chain event that deserves a human eye anyway.
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { LANE_BRANCH_RE, frontmatterLineOf, within } from "./lane-fence.mjs";

/**
 * This project's integration branch, held here and COMPARED rather than
 * trusted.
 *
 * docs/CONVENTIONS.md's lane bullet publishes it — "integration branch
 * `main`; branch `task/T-NNN-<slug>`" — and `landing-gate.spec.ts` reads
 * that bullet through `laneSpellings`, the module that owns the fact, and
 * compares it against this constant. That is the treatment
 * `LANE_BRANCH_RE` and `GRAPH_REL_PATH` already get: the constant is
 * checked against the program or the document that owns it, so a rename
 * reds a body by name instead of going quiet.
 */
export const INTEGRATION_BRANCH = "main";

/**
 * Every spelling of the integration branch a checkout might hold, in the
 * order to try them.
 *
 * WHICH ONE RESOLVES IS A LIVE FACT AND NOT A PREFERENCE (T-153-s9,
 * measured): `actions/checkout` on a `pull_request` event leaves the
 * workspace detached and creates no local branch, so the bare name
 * resolves to nothing on exactly the CI event a lane can fire. A read
 * site that spelled `origin/main` instead would break every checkout with
 * no remote. `dispatch-brief.mjs` owns this list; this is the hook-budget
 * copy and `landing-gate.spec.ts` asserts the two are identical, so a
 * fourth candidate added there reds a body here.
 *
 * **THE ORDER IS A GUARD SURFACE AND IT WAS WEIGHED, NOT ASSUMED**
 * (`T-223`). The bare name resolves first, and a lane can move that ref
 * with `git update-ref` — this module's header carries the measurement,
 * the three counts on which the reorder to a remote-first list was
 * REFUSED, and limit 6, which is what that leaves disclosed.
 *
 * @param {string} branch
 * @returns {string[]}
 */
export function integrationRefCandidates(branch) {
  return [branch, `origin/${branch}`, `refs/remotes/origin/${branch}`];
}

/**
 * Where the REMOTE's copy of the integration branch is looked for, which
 * is a different question from the one above.
 *
 * The merge arm needs to know which commits a push would ADD, and only a
 * remote-tracking ref answers that. The local branch is the thing being
 * pushed, so including it would compare main against itself and find no
 * new merge at all — an arm that always answers "nothing to judge" is an
 * arm no mutation can kill.
 *
 * @param {string} branch
 * @returns {string[]}
 */
export function remoteRefCandidates(branch) {
  return [`refs/remotes/origin/${branch}`, `origin/${branch}`];
}

/**
 * A card file, and the id its NAME carries.
 *
 * THE FILENAME IS AUTHORITATIVE FOR LOCATING A CARD, and that is a
 * measurement rather than a hope: over the 420 cards live at this card's
 * base, the frontmatter `id:` and this pattern's capture agree **420
 * times and disagree 0**, and the board runs exactly two id shapes,
 * `T-N` and `T-N-sN`. `landing-gate.spec.ts` re-measures it over the
 * whole of `docs/tasks/` rather than trusting the figure.
 *
 * Locating by name is what keeps this arm from reading 420 files on a
 * push to answer one question.
 */
export const CARD_FILE_RE = /^docs\/tasks\/(T-\d+(?:-s\d+)?)-[^/]*\.md$/;

/**
 * THE SUFFIX IS PART OF THE ID (`normaliseTaskId`'s own comment, bought
 * at the T-153-s5 dispatch where `--write-fence` stamped T-153's fence
 * into an s5 lane). `LANE_BRANCH_RE` captures `(\d+)` only, so reading
 * the id off ITS capture would answer `T-163` for `task/T-163-s4-lane`
 * and fence the lane with its PARENT's card. This matcher takes the
 * suffix when the branch carries one.
 */
export const LANE_ID_RE = /^refs\/heads\/task\/(T-\d+(?:-s\d+)?)-/;

/**
 * The card ids a lane branch could name, MOST SPECIFIC FIRST.
 *
 * `task/T-163-s4-lane` names `T-163-s4` if such a card exists and
 * `T-163` otherwise — the same preference the published branch matcher
 * makes, for the same reason. Returning both and resolving against the
 * board is what makes the preference a lookup rather than a guess.
 *
 * @param {string} headRef a full ref
 * @returns {string[]}
 */
export function laneCardIds(headRef) {
  const m = LANE_ID_RE.exec(headRef);
  if (m === null) return [];
  const specific = /** @type {string} */ (m[1]);
  const parent = /^(T-\d+)-s\d+$/.exec(specific);
  return parent === null ? [specific] : [specific, /** @type {string} */ (parent[1])];
}

/**
 * @typedef {object} Ran
 * @property {number | null} status
 * @property {string} stdout
 * @property {string} stderr
 */

/**
 * Run one git command and hand back what it said. NEVER THROWS and never
 * interprets: every caller reads the status itself, because the
 * difference between "git answered no" and "git could not be run" is the
 * difference between a verdict and a cannot-compare.
 *
 * @param {string} root
 * @param {string[]} args
 * @returns {Ran}
 */
export function runGit(root, args) {
  try {
    const out = spawnSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    if (out.error !== undefined && out.error !== null) {
      return { status: null, stdout: "", stderr: out.error.message };
    }
    return {
      status: out.status,
      stdout: String(out.stdout ?? ""),
      stderr: String(out.stderr ?? ""),
    };
  } catch (err) {
    return { status: null, stdout: "", stderr: err instanceof Error ? err.message : String(err) };
  }
}

/** The expander this module drives — see `expand-fence.mjs` beside it. */
export const EXPANDER_PATH = fileURLToPath(new URL("./expand-fence.mjs", import.meta.url));

/**
 * @typedef {object} ExpandedFence
 * @property {string[]} paths       domains the fence reserves
 * @property {string[]} excluded    domains carved out — the card's own file
 * @property {string[]} unusable    raw tokens the expansion could not resolve
 * @property {string[]} unfenceable the parser's own `UNFENCEABLE_PATHS`
 */

/**
 * Expand a `touches:` token list through the project's ONE expansion.
 *
 * @param {{ touches: string[], id?: string, file?: string }} request
 * @returns {{ fence: ExpandedFence } | { problem: string }}
 */
export function expandTouches(request) {
  /** @type {ReturnType<typeof spawnSync>} */
  let out;
  try {
    out = spawnSync(process.execPath, [EXPANDER_PATH], {
      input: JSON.stringify(request),
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (err) {
    return { problem: `the fence expander could not be started (${err instanceof Error ? err.message : String(err)})` };
  }
  if (out.error !== undefined && out.error !== null) {
    return { problem: `the fence expander could not be started (${out.error.message})` };
  }
  if (out.status !== 0) {
    return {
      problem:
        `the fence expander exited ${String(out.status)} — ${String(out.stderr ?? "").trim() ||
          "it said nothing"}`,
    };
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(String(out.stdout ?? ""));
  } catch (err) {
    return { problem: `the fence expander printed no readable JSON (${err instanceof Error ? err.message : String(err)})` };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { problem: "the fence expander printed no object" };
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  /** @param {unknown} v @returns {v is string[]} */
  const isStrings = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
  const { paths, excluded, unusable, unfenceable } = obj;
  if (!isStrings(paths) || !isStrings(excluded) || !isStrings(unusable) || !isStrings(unfenceable)) {
    return { problem: "the fence expander's answer is missing a field this gate needs" };
  }
  return { fence: { paths, excluded, unusable, unfenceable } };
}

/**
 * The tokens a `touches:` line declares.
 *
 * ── ONE SPELLING, AND EVERYTHING ELSE IS A CANNOT-COMPARE ────────────
 * This reads exactly one shape: a single-line flow sequence,
 * `touches: [a, b]`. Measured at this card's base over every live card
 * that declares one — **317 of 317** match `^touches: \[[^]]*\]$`, and
 * not one carries a quote. A block sequence, a quoted scalar or a
 * continuation is answered `problem`, which becomes CANNOT COMPARE, never
 * an empty fence: an empty fence would be the widest possible refusal on
 * a card this reader simply did not understand, and a fence read wrong is
 * worse than a fence not read. `landing-gate.spec.ts` re-measures the
 * board rather than trusting that figure, so the day a card is written in
 * block form the body reds and this reader is extended deliberately.
 *
 * AN ABSENT OR EMPTY LIST IS NOT A PROBLEM — it is an ANSWER, and the
 * caller turns it into the universal set's dual. See `laneLandingVerdict`.
 *
 * @param {string | undefined} line the verbatim `touches:` line, or none
 * @returns {{ tokens: string[] } | { problem: string }}
 */
export function touchesTokens(line) {
  if (line === undefined) return { tokens: [] };
  const body = line.replace(/^touches:/, "").trim();
  if (body === "") return { tokens: [] };
  const flow = /^\[(.*)\]$/.exec(body);
  if (flow === null) {
    return {
      problem:
        `its \`touches:\` line is ${JSON.stringify(line)}, which is not the single-line flow ` +
        "sequence (`touches: [a, b]`) this gate reads — every live card uses that shape and this " +
        "reader will not guess at another one",
    };
  }
  return {
    tokens: /** @type {string} */ (flow[1])
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== ""),
  };
}

/**
 * The card one lane's branch names, AS COMMITTED at `rev`.
 *
 * @param {string} root
 * @param {string} rev       the revision to read the board at
 * @param {string[]} ids     candidate ids, most specific first
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ id: string, file: string } | { noBoard: string } | { problem: string }}
 */
export function cardAt(root, rev, ids, git = runGit) {
  if (ids.length === 0) return { problem: "its branch names no task id this gate can read" };
  const ls = git(root, ["ls-tree", "-r", "--name-only", "-z", rev, "--", "docs/tasks"]);
  if (ls.status !== 0) {
    return {
      problem: `\`git ls-tree ${rev} -- docs/tasks\` failed (${ls.stderr.trim() || "no message"})`,
    };
  }
  const files = ls.stdout.split("\0").filter((f) => f !== "");
  // NO BOARD AT ALL IS NOT A MISSING CARD, AND THE DIFFERENCE IS THE ONE
  // THIS FUNCTION EXISTS TO DRAW. A checkout whose integration branch
  // carries no `docs/tasks` cards is not this project's board — a
  // fixture, another repository, this repository before its first card —
  // and the gate has NO QUESTION to ask there, exactly as
  // `push-guard.mjs` has none in a checkout carrying no indexer crate.
  // A board that DOES carry cards and carries none for this lane is a
  // different thing entirely: a dispatch error, and the caller refuses
  // it. Collapsing the two would either refuse every fixture or hand a
  // lane the bypass of naming a branch no card answers to.
  if (files.filter((f) => CARD_FILE_RE.test(f)).length === 0) {
    return { noBoard: `${rev} carries no cards under docs/tasks/ at all` };
  }
  for (const id of ids) {
    const matches = files.filter((f) => {
      const m = CARD_FILE_RE.exec(f);
      return m !== null && m[1] === id;
    });
    if (matches.length === 1) return { id, file: /** @type {string} */ (matches[0]) };
    if (matches.length > 1) {
      return {
        problem:
          `${rev} carries ${matches.length} cards whose name declares ${id} ` +
          `(${matches.join(", ")}), so which card fences this lane is ambiguous`,
      };
    }
  }
  return {
    problem: `${rev} carries no card named for ${ids.join(" or ")} under docs/tasks/`,
  };
}

/**
 * @typedef {object} Judged
 * @property {string[]} outside every changed path outside the fence
 * @property {string[]} inside  every changed path the fence admits
 */

/**
 * The one-directional containment question, asked once per changed path.
 *
 * THE ORDER IS THE WRITE-TIME ARM'S, because it is the same ruling: what
 * no card may fence comes first (rule 5's unfenceable directory, where
 * every card's dispatch and closing stamp is written), then the card's
 * own file which is outside every fence including its own, then the fence
 * proper.
 *
 * @param {string[]} paths
 * @param {ExpandedFence} fence
 * @returns {Judged}
 */
export function judgePaths(paths, fence) {
  const domains = [...fence.unfenceable, ...fence.excluded, ...fence.paths];
  /** @type {string[]} */
  const outside = [];
  /** @type {string[]} */
  const inside = [];
  for (const rel of paths) {
    (domains.some((d) => within(rel, d)) ? inside : outside).push(rel);
  }
  return { outside, inside };
}

/**
 * The paths a range committed, MERGE-BASE-to-tip.
 *
 * **NEVER base-at-cut-to-tip**, and that is what keeps a lane which
 * legitimately performed a checkpoint sync (`T-211`'s fast path B) from
 * being charged with MAIN's own paths: the merge-base moves past them the
 * moment the sync lands, so main's work leaves the range by itself.
 *
 * `--no-renames` on purpose. With rename detection a file MOVED out of
 * the fence appears under its new name only, and the write that deleted
 * it inside the fence disappears from the account. Both halves of a
 * rename are writes and this gate judges both. `-z` on purpose too: git
 * QUOTES a path carrying a space or a quote in its ordinary output, and a
 * quoted path is a different string from the one a fence domain would
 * contain.
 *
 * @param {string} root
 * @param {string} base the left endpoint's revision
 * @param {string} tip  the right endpoint's revision
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ mergeBase: string, paths: string[] } | { problem: string }}
 */
export function rangePaths(root, base, tip, git = runGit) {
  const mb = git(root, ["merge-base", base, tip]);
  if (mb.status !== 0 || mb.stdout.trim() === "") {
    return {
      problem:
        `\`git merge-base ${base} ${tip}\` gave no answer (${mb.stderr.trim() || "no message"}), ` +
        "and this gate computes the diff merge-base-to-tip or not at all",
    };
  }
  const mergeBase = mb.stdout.trim();
  const diff = git(root, ["diff", "--name-only", "-z", "--no-renames", `${mergeBase}..${tip}`]);
  if (diff.status !== 0) {
    return { problem: `\`git diff ${mergeBase}..${tip}\` failed (${diff.stderr.trim() || "no message"})` };
  }
  return { mergeBase, paths: diff.stdout.split("\0").filter((p) => p !== "") };
}

/* ───────────── the fifth limit: the `touches:` LINE (T-224) ─────────── */

/**
 * How an absent `touches:` line is rendered where a line is expected.
 * Named rather than inlined so the three sites that print one cannot
 * describe the same state three ways.
 */
export const NO_TOUCHES_LINE = "(no `touches:` line)";

/**
 * One card's `touches:` line at one revision — or the fact that the card
 * IS NOT THERE, which is a different answer and not a missing line.
 *
 * THREE ANSWERS, NEVER TWO, the same rule this module keeps everywhere
 * else. `absent` is what a card the range ADDED looks like at the base
 * and a card it DELETED looks like at the tip: neither is a line that
 * moved, and reading either as an empty line would manufacture an
 * amendment out of an ordinary suggestion filing. `problem` is git
 * failing on a path the tree says is there, which is a cannot-compare and
 * never a verdict.
 *
 * The `ls-tree` is asked ONLY when `show` failed, so the ordinary case
 * costs one process and this second one is paid on the rare answer.
 *
 * @param {string} root
 * @param {string} rev
 * @param {string} file repository-relative
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ line: string | undefined } | { absent: true } | { problem: string }}
 */
export function cardTouchesAt(root, rev, file, git = runGit) {
  const show = git(root, ["show", `${rev}:${file}`]);
  if (show.status === 0) return { line: frontmatterLineOf(show.stdout, "touches") };
  const ls = git(root, ["ls-tree", "--name-only", "-z", rev, "--", file]);
  if (ls.status === 0 && ls.stdout.split("\0").filter((f) => f !== "").length === 0) {
    return { absent: true };
  }
  return {
    problem: `\`git show ${rev}:${file}\` failed (${show.stderr.trim() || "no message"})`,
  };
}

/**
 * Every card under `docs/tasks/` at one revision, indexed by THE ID ITS
 * NAME CARRIES — the listing that makes a RENAME resolvable.
 *
 * **A CARD IS RESOLVED BY ID, NEVER BY PATH, AND THAT IS THE CONTRACT
 * RATHER THAN AN OPTIMISATION.** A card's slug carries its title, so
 * rewording the title RENAMES the file while the id stays put; `rangePaths`
 * passes `--no-renames` (right for the containment arm, which judges paths),
 * so such a card reaches this arm as two unrelated strings — the old path,
 * gone at the tip, and the new path, absent at the base. Compared by path
 * both sides answer `absent`, and a widened `touches:` rides in unjudged at
 * BOTH landing moments, its own card or a sibling's. That is the hole
 * `T-224`'s own verifier found and it is why this listing exists.
 *
 * **THE FILTER IS `CARD_FILE_RE` ITSELF**, which is what keeps two
 * properties exact and both of them were measured rather than assumed:
 * `T-224` does not match `T-224-s1` (the pattern's optional `-s\d+` is
 * greedy, so the capture takes the suffix when the name carries one), and
 * `docs/tasks/rejected/**` is not a card path at all (the capture's
 * `[^/]*` cannot cross a slash), so a card FILED AWAY into that directory
 * still reads as a deletion — limit 5(b) — instead of being resolved to a
 * blob nothing fences. The listing is therefore NOT recursive: below
 * `docs/tasks/` there is no path this pattern can match, so recursing
 * would enumerate blobs only to discard them.
 *
 * A list per id rather than one path, because two files carrying one id is
 * a board this gate must not silently pick a winner in — and picking one
 * silently is precisely what the `absent`-gated fast path did through the
 * back door, by letting a second file answer for the id at one endpoint.
 * The caller decides what the list MEANS: a duplicate the judged range
 * arrived at is REFUSED, one it inherited is announced, and neither is a
 * blob chosen by sort order.
 *
 * @param {string} root
 * @param {string} rev
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ byId: Map<string, string[]> } | { problem: string }}
 */
export function cardPathsById(root, rev, git = runGit) {
  const ls = git(root, ["ls-tree", "--name-only", "-z", rev, "--", "docs/tasks/"]);
  if (ls.status !== 0) {
    return {
      problem:
        `\`git ls-tree ${rev} docs/tasks/\` failed (${ls.stderr.trim() || "no message"}), ` +
        "so a card this range renamed could not be resolved by its id",
    };
  }
  /** @type {Map<string, string[]>} */
  const byId = new Map();
  for (const p of ls.stdout.split("\0")) {
    const named = CARD_FILE_RE.exec(p);
    if (named === null) continue;
    const id = /** @type {string} */ (named[1]);
    const at = byId.get(id);
    if (at === undefined) byId.set(id, [p]);
    else at.push(p);
  }
  return { byId };
}

/**
 * One card's `touches:` line at one revision, BY ID — resolved through the
 * per-revision INDEX at both endpoints, never through the path the diff
 * happened to name.
 *
 * **THE INDEX IS THE AUTHORITY AND THE DIFF'S PATH IS AT MOST A FAST
 * PATH, AND THAT ORDER IS THE WHOLE OF `T-224`'s SECOND VERDICT.** This
 * function used to `git show <rev>:<file>` FIRST and consult the index
 * only where that answered `absent`. Composed with a loop keyed on the id,
 * that let the two endpoints of ONE id straddle TWO FILES: plant a second
 * file under `docs/tasks/` carrying the card's id, sorting first in the
 * range's path list and repeating the card's CURRENT `touches:` line, and
 * at the BASE it is absent so the index resolves the id to the real card
 * (the old line), while at the TIP the direct `show` short-circuits the
 * index and returns the DECOY's copy of that same line. The two compare
 * equal, the id is marked seen, the real card's own widening is never
 * examined, and the push is an ordinary inside-the-fence ALLOW. Resolving
 * BOTH ends through the index closes it: `paths[0]` is the only file this
 * gate will read for an id, and where that file IS the one the diff named
 * the read is the same single `git show` as before.
 *
 * FOUR ANSWERS, and the fourth is the one a resolver owes: a line (with
 * the path it was actually read at, which the refusal prints when it is
 * not the path the diff named), `absent` — no file at this revision
 * carries this id — and `problem`, which covers TWO files carrying one id,
 * a state this gate reports rather than guesses through. **WHO ANSWERS
 * FOR THAT AMBIGUITY IS THE CALLER'S**: `touchesAmendments` REFUSES one
 * the judged range created and announces one it merely inherited.
 *
 * @param {string} root
 * @param {string} rev
 * @param {string} id   the card id, as `CARD_FILE_RE` captured it
 * @param {string} file the path the range named, repository-relative
 * @param {(rev: string) => ({ byId: Map<string, string[]> } | { problem: string })} index
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ line: string | undefined, file: string } | { absent: true } | { problem: string } | { problem: string, duplicate: string[] }}
 */
export function cardTouchesOf(root, rev, id, file, index, git = runGit) {
  const listed = index(rev);
  if ("problem" in listed) return listed;
  const paths = listed.byId.get(id) ?? [];
  if (paths.length === 0) return { absent: true };
  if (paths.length > 1) {
    return {
      problem:
        `${paths.length} files under docs/tasks/ carry the id ${id} at ${rev} ` +
        `(${paths.join(", ")}), so this gate cannot say which one the range's ${file} stands for`,
      duplicate: paths,
    };
  }
  const only = /** @type {string} */ (paths[0]);
  const found = cardTouchesAt(root, rev, only, git);
  if ("problem" in found) return found;
  if ("absent" in found) {
    return {
      problem: `\`git ls-tree\` listed ${only} at ${rev} and \`git show\` then could not read it`,
    };
  }
  return { line: found.line, file: only };
}

/**
 * A card id MORE THAN ONE file carries, and the account of who put them
 * there — which is what decides whether this is a refusal or a notice.
 *
 * @typedef {object} DuplicateId
 * @property {string} id        the id carried more than once
 * @property {string[]} paths   every path carrying it at the range's TIP
 * @property {string[]} arrived those of them present at NEITHER the base nor the record
 * @property {string[]} base    every path carrying it at the range's base
 * @property {string[]} record  every path carrying it on the fence of record
 */

/**
 * @typedef {object} TouchesMove
 * @property {string} file       the card, repository-relative, as it stands at the range's tip
 * @property {string} id         the id both endpoints were resolved by
 * @property {string} before     its `touches:` line at the range's base
 * @property {string} beforeFile the path that line was read at
 * @property {string} after      its `touches:` line at the range's tip
 * @property {string} afterFile  the path that line was read at
 * @property {string} record     what the integration branch's own copy says
 * @property {string | undefined} recordFile the path THAT was read at, when there was one
 */

/**
 * Every `touches:` line the range MOVED — the fifth limit's arm.
 *
 * `record` is the revision whose copy of the card no lane's commits can
 * write: the integration ref for a lane push, a merge's FIRST PARENT at
 * the merge moment. A move whose tip line is character for character what
 * that copy carries is a fast-path-A grant delivered into the lane's
 * working copy (`method/lane-protocol.md`, fast path A) and is NOT an
 * amendment: it re-states the fence of record instead of moving it. The
 * module header argues both halves.
 *
 * **EVERY ENDPOINT IS RESOLVED BY THE CARD'S ID, NOT BY ITS PATH**
 * (`cardTouchesOf`, which asks the per-revision INDEX first and reads the
 * diff's own path only where the index maps the id to exactly that one
 * path there), which is what the amended contract requires in as many
 * words: *"a card id present on main under another path is resolved by id,
 * not path, so delete-and-re-add and rename do not evade the
 * comparison."* A rename that leaves the line alone is still ALLOWED — the
 * two lines are equal, whatever the file is called — and a rename that
 * moves it is REFUSED with BOTH paths named.
 *
 * **AND THE LOOP IS KEYED ON THE ID, WHICH IS NOT COSMETIC**: with
 * `--no-renames`, one renamed card enters `paths` TWICE, as a deletion of
 * the old name and an addition of the new one. Keyed on the path, one
 * amendment would be reported twice — and the second report would name the
 * endpoints in the opposite order, which reads like two findings about two
 * cards.
 *
 * **AND AN ID CARRIED BY TWO FILES IS ANSWERED BEFORE EITHER LINE IS
 * READ, BECAUSE THAT IS THE STATE THE DEDUPE IS DANGEROUS IN.** An id the
 * range itself arrives at a duplicate of — a path at the tip present at
 * NEITHER the base NOR the record — is REFUSED, naming every file, because
 * a cannot-compare ALLOW there is the fail-open shape: it lets a lane
 * manufacture the very ambiguity that stops the comparison. An id already
 * carried twice when the range was cut is the honest cannot-compare and is
 * ANNOUNCED, unchanged — limit 5(f).
 *
 * @param {string} root
 * @param {string} base   the range's left endpoint
 * @param {string} tip    the range's right endpoint
 * @param {string} record the revision the fence of record is read at
 * @param {string[]} paths the range's changed paths
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ moved: TouchesMove[], duplicated: DuplicateId[] } | { problem: string }}
 */
export function touchesAmendments(root, base, tip, record, paths, git = runGit) {
  /** @param {string | undefined} line */
  const show = (line) => (line === undefined ? NO_TOUCHES_LINE : line);
  /** ONE listing per REVISION, and never one per card. */
  /** @type {Map<string, { byId: Map<string, string[]> } | { problem: string }>} */
  const listings = new Map();
  /** @param {string} rev */
  const index = (rev) => {
    const had = listings.get(rev);
    if (had !== undefined) return had;
    const made = cardPathsById(root, rev, git);
    listings.set(rev, made);
    return made;
  };
  /**
   * Every path one id resolves to at one revision, out of the SAME memoised
   * listing `cardTouchesOf` reads — so asking this costs no process at all.
   *
   * @param {string} rev
   * @param {string} id
   * @returns {{ at: string[] } | { problem: string }}
   */
  const pathsOf = (rev, id) => {
    const listed = index(rev);
    return "problem" in listed ? listed : { at: listed.byId.get(id) ?? [] };
  };
  /** @type {TouchesMove[]} */
  const moved = [];
  /** @type {DuplicateId[]} */
  const duplicated = [];
  /** @type {Set<string>} */
  const seen = new Set();
  for (const rel of paths) {
    const named = CARD_FILE_RE.exec(rel);
    if (named === null) continue;
    const id = /** @type {string} */ (named[1]);
    if (seen.has(id)) continue;
    seen.add(id);

    // BOTH ENDPOINTS ARE RESOLVED BEFORE EITHER IS TRUSTED, because it is
    // the PAIR that gets compared and the defect was a pair that straddled
    // two files. The `absent` short-circuit that used to sit between them
    // is below the ambiguity arm on purpose: a range that FILES two cards
    // under one brand-new id is the same ambiguity, and skipping it on
    // `absent` would hand it back.
    const before = cardTouchesOf(root, base, id, rel, index, git);
    const after = cardTouchesOf(root, tip, id, rel, index, git);

    // AN ID CARRIED BY TWO FILES IS ANSWERED HERE, AND THE QUESTION IS WHO
    // MADE IT. `seen` marks this id done whatever happens next, so an
    // ambiguity read through rather than answered is an id nothing judges:
    // that composition is exactly what the decoy rode.
    if ("duplicate" in before || "duplicate" in after) {
      const atBase = pathsOf(base, id);
      if ("problem" in atBase) return { problem: atBase.problem };
      const atTip = pathsOf(tip, id);
      if ("problem" in atTip) return { problem: atTip.problem };
      const atRecord = pathsOf(record, id);
      if ("problem" in atRecord) return { problem: atRecord.problem };
      const known = new Set([...atBase.at, ...atRecord.at]);
      const arrived = atTip.at.filter((p) => !known.has(p));
      if (arrived.length > 0) {
        duplicated.push({ id, paths: atTip.at, arrived, base: atBase.at, record: atRecord.at });
        continue;
      }
      const every = [...new Set([...atBase.at, ...atTip.at])];
      return {
        problem:
          `${every.length} files under docs/tasks/ carry the id ${id} (${every.join(", ")}), and ` +
          "this range arrived at none of them — the ambiguity is the BOARD's rather than this " +
          `range's, so this gate stops judging ${id} instead of picking a file`,
      };
    }

    if ("problem" in before) return { problem: before.problem };
    if ("problem" in after) return { problem: after.problem };
    if ("absent" in before) continue;
    if ("absent" in after) continue;
    if (before.line === after.line) continue;
    const onRecord = cardTouchesOf(root, record, id, rel, index, git);
    if (!("problem" in onRecord) && !("absent" in onRecord) && onRecord.line === after.line) {
      continue;
    }
    moved.push({
      file: after.file,
      id,
      before: show(before.line),
      beforeFile: before.file,
      after: show(after.line),
      afterFile: after.file,
      record:
        "problem" in onRecord
          ? `UNREADABLE — ${onRecord.problem}`
          : "absent" in onRecord
            ? `(no such card at ${record})`
            : show(onRecord.line),
      recordFile: "problem" in onRecord || "absent" in onRecord ? undefined : onRecord.file,
    });
  }
  return { moved, duplicated };
}

/**
 * Render the moves for a human, once, so the two arms cannot describe the
 * same finding two ways.
 *
 * **A PATH IS NAMED WHERE IT DIFFERS FROM THE ONE ON THE FIRST LINE, AND
 * NOWHERE ELSE.** A renamed card has two names and a reader who is shown
 * only one cannot check the finding: the old name is where the BEFORE line
 * lives and it is what `git show <base>:<path>` needs. Where the card was
 * not renamed the annotation is absent entirely rather than repeating the
 * same string three times.
 *
 * @param {TouchesMove[]} moved
 * @param {string} record how to name the revision the third line was read at
 * @returns {string}
 */
export function amendmentReport(moved, record) {
  return moved
    .map((m) => {
      /** @param {string | undefined} at */
      const named = (at) =>
        at === undefined || at === m.file
          ? ""
          : `\n        (read at ${at} — the card was RESOLVED BY ITS ID ${m.id}, not by its path)`;
      return (
        `    ${m.file}\n` +
        `      before, at the range's base: ${m.before}${named(m.beforeFile)}\n` +
        `      after, at the range's tip:   ${m.after}${named(m.afterFile)}\n` +
        `      on ${record}: ${m.record}${named(m.recordFile)}\n`
      );
    })
    .join("");
}

/**
 * Render the DUPLICATED ids for a human, once, for the same reason
 * `amendmentReport` exists: two arms describing one state two ways is two
 * accounts of one finding.
 *
 * **THE ARRIVING PATH IS MARKED, BECAUSE IT IS THE WHOLE VERDICT.** The
 * refusal is not "this board has two files with one id" — that is a
 * notice — it is "this range PUT one of them there", and a reader who is
 * shown the set without being shown which member arrived cannot check
 * that.
 *
 * @param {DuplicateId[]} duplicated
 * @param {string} record how to name the revision the third line was read at
 * @returns {string}
 */
export function duplicateReport(duplicated, record) {
  /** @param {string[]} at */
  const list = (at) => (at.length === 0 ? "(no file carried this id)" : at.join(", "));
  return duplicated
    .map(
      (d) =>
        `    ${d.id} — ${d.paths.length} files under docs/tasks/ carry this id at the range's tip\n` +
        d.paths
          .map((p) => `      ${p}${d.arrived.includes(p) ? "   <- ARRIVED IN THIS RANGE" : ""}\n`)
          .join("") +
        `      at the range's base: ${list(d.base)}\n` +
        `      on ${record}: ${list(d.record)}\n`,
    )
    .join("");
}

/**
 * The route a refused DUPLICATED ID takes, which is neither of the two
 * above: the fence question is "who may write here", the amendment
 * question is "who may move the line that answers it", and this one is
 * "which file IS the card".
 */
export const DUPLICATE_ID_ROUTE =
  "A card id names ONE file under docs/tasks/, and this gate resolves every `touches:` endpoint " +
  "by that id — so a second file carrying an id the board already knows leaves the fence of " +
  "record ambiguous. THIS IS REFUSED RATHER THAN ANNOUNCED because the alternative is the " +
  "fail-open shape: a cannot-compare ALLOW here lets a lane manufacture the very ambiguity that " +
  "stops the comparison, which is how a widening rides in behind a file carrying the card's id " +
  "(T-224's second verdict measured that end to end, through this hook). The remedy is the " +
  "lane's and is inside its own range: give the new card an id of its own — `node " +
  "tools/e2e/scripts/brief.mjs --state` prints the board's — or drop the duplicate file. A " +
  "duplicate this range did NOT arrive at is a different state and is ANNOUNCED, never refused: " +
  "the board was already ambiguous when the range was cut, and repairing it is triage's, on main.";

/**
 * The route a refused AMENDMENT takes, which is not the route a refused
 * PATH takes — the fence question is "who may write here", and this one
 * is "who may move the line that answers it".
 */
export const AMENDMENT_ROUTE =
  "A card's `touches:` is the one line on it a lane never writes — its own or a sibling's " +
  "(method/lane-protocol.md rule 5, method/tasks/TASK-FORMAT.md's field clause). docs/tasks stays " +
  "UNFENCEABLE and every other write to a card is admitted here exactly as before: the status " +
  "stamp, the implementation notes, a suggestion filed beside it, a whole new card. This arm " +
  "judges the LINE, never the file. The widening itself is a card amendment COMMITTED ON MAIN " +
  "plus a re-run of `brief.mjs --task <id> --write-fence <worktree>` (T-211's fast path A) — on " +
  "main, by triage, and never from inside a lane. Taken that way it does not reach this refusal: " +
  "a lane cut after the amendment carries the same line at both endpoints, a lane that merges " +
  "main down moves its own merge-base past it, and a lane handed the amendment in its working " +
  "copy commits a line character for character identical to the integration branch's, which this " +
  "gate reads and allows. If the line above is NOT what the integration branch says, the grant " +
  "was never made — report the half-delivered widening to the seat that owes it, and route the " +
  "need as a `status: suggested` card rather than writing the field.";

/**
 * The route a refused push takes. A REFUSAL THAT DOES NOT SAY WHAT
 * ESCAPED SENDS THE SEAT BACK TO GUESSING, which is this card's fourth
 * build step; the paths are named by the caller and this is the sentence
 * after them.
 */
export const ROUTE =
  "A fence is not widened from inside the lane it fences (method/lane-protocol.md rule 5), and " +
  "this gate reads the card as committed on the integration branch precisely so that editing the " +
  "card here — or the manifest — cannot move it. An executor whose work reaches outside its own " +
  "`touches:` has found a DISPATCH ERROR and never a licence: record it, route it as a " +
  "`status: suggested` card under docs/tasks/ with `suggested_by:` set, and build the part that " +
  "fits. If the fence itself is wrong, the widening is a card amendment COMMITTED ON MAIN plus a " +
  "re-run of `brief.mjs --task <id> --write-fence <worktree>` (T-211's fast path A) — that is the " +
  "one route that moves this gate, and it is triage's to take, never this hook's.";

/* ───────────── THE SEVENTH LIMIT: dependency legitimacy (T-247) ─────── */

/**
 * Every name a manifest DECLARES that a registry would have to serve.
 *
 * A reader answers `{ names }` or `{ problem }` and NEVER throws: a
 * manifest this gate cannot parse is a manifest whose additions are
 * unknown, and the caller refuses on that rather than reading it as
 * empty. An empty answer and an unreadable one are the two states this
 * whole module exists to keep apart.
 *
 * @typedef {{ names: string[] } | { problem: string }} DepRead
 */

/**
 * Is this `package.json` version spec one the REGISTRY would answer for?
 *
 * A semver range carries neither `:` nor `/`. Everything that does is a
 * spec pointing somewhere else — `file:`, `link:`, `workspace:`,
 * `git+https:`, `npm:` aliasing, `github:owner/repo` and the bare
 * `owner/repo` shorthand — and this repository ships one of them:
 * `app/package.json` resolves `@supertaskr/parser` through `file:../lib/parser`
 * (docs/CONVENTIONS.md's fresh-clone ORDER). Judging that name against
 * npm would refuse this project's own tree on the first push.
 *
 * @param {unknown} spec
 * @returns {boolean}
 */
export function isRegistrySpec(spec) {
  if (typeof spec !== "string") return false;
  const s = spec.trim();
  if (s === "") return false;
  return !s.includes(":") && !s.includes("/") && !s.startsWith(".");
}

/**
 * `package.json` — the four dependency objects npm resolves from a
 * registry. `bundleDependencies` is a NAME LIST rather than a spec map
 * and every name in it must already appear in one of these four, so
 * reading it would add nothing but a second spelling.
 *
 * @param {string} text
 * @returns {DepRead}
 */
export function npmManifestDeps(text) {
  /** @type {unknown} */
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (err) {
    return { problem: `it is not readable JSON (${err instanceof Error ? err.message : String(err)})` };
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    return { problem: "it is not a JSON object" };
  }
  const obj = /** @type {Record<string, unknown>} */ (doc);
  /** @type {string[]} */
  const names = [];
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    const block = obj[field];
    if (block === null || typeof block !== "object" || Array.isArray(block)) continue;
    for (const [name, spec] of Object.entries(/** @type {Record<string, unknown>} */ (block))) {
      if (isRegistrySpec(spec)) names.push(name);
    }
  }
  return { names };
}

/**
 * `package-lock.json` — BOTH shapes, because which one a tree carries is
 * npm's choice and not this gate's. v2/v3 key a `packages` map on install
 * paths; v1 nests a `dependencies` tree. In either, the registry-bound
 * entries are exactly those whose `resolved` is an http(s) URL: a linked
 * workspace carries `link: true`, and a file dependency resolves to a
 * relative path.
 *
 * @param {string} text
 * @returns {DepRead}
 */
export function npmLockDeps(text) {
  /** @type {unknown} */
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (err) {
    return { problem: `it is not readable JSON (${err instanceof Error ? err.message : String(err)})` };
  }
  if (doc === null || typeof doc !== "object" || Array.isArray(doc)) {
    return { problem: "it is not a JSON object" };
  }
  const obj = /** @type {Record<string, unknown>} */ (doc);
  /** @type {string[]} */
  const names = [];
  /** @param {unknown} v */
  const fromRegistry = (v) =>
    v !== null && typeof v === "object" && !Array.isArray(v) &&
    typeof (/** @type {Record<string, unknown>} */ (v))["resolved"] === "string" &&
    /^https?:\/\//.test(/** @type {string} */ ((/** @type {Record<string, unknown>} */ (v))["resolved"]));

  const packages = obj["packages"];
  if (packages !== null && typeof packages === "object" && !Array.isArray(packages)) {
    for (const [key, entry] of Object.entries(/** @type {Record<string, unknown>} */ (packages))) {
      if (key === "" || !fromRegistry(entry)) continue;
      const declared = (/** @type {Record<string, unknown>} */ (entry))["name"];
      const name = typeof declared === "string" && declared !== ""
        ? declared
        : key.replace(/^.*node_modules\//, "");
      if (name !== "") names.push(name);
    }
  }
  /** @param {unknown} tree */
  const walk = (tree) => {
    if (tree === null || typeof tree !== "object" || Array.isArray(tree)) return;
    for (const [name, entry] of Object.entries(/** @type {Record<string, unknown>} */ (tree))) {
      if (fromRegistry(entry)) names.push(name);
      if (entry !== null && typeof entry === "object" && !Array.isArray(entry)) {
        walk((/** @type {Record<string, unknown>} */ (entry))["dependencies"]);
      }
    }
  };
  walk(obj["dependencies"]);
  return { names: [...new Set(names)] };
}

/** The `[…]` headers whose keys declare a crate this gate would judge. */
export const CARGO_DEP_TABLE_RE =
  /^(?:workspace\.)?(?:target\.[^\]]*?\.)?(?:dependencies|dev-dependencies|build-dependencies)(?:\.(.+))?$/;

/**
 * `Cargo.toml` — the dependency TABLES, scanned rather than parsed.
 *
 * A dependency is registry-bound unless it says otherwise: `path`, `git`
 * and `workspace` each point somewhere that is not crates.io, in every
 * spelling cargo accepts them — as a key of an inline table
 * (`serde = { path = "…" }`), as a dotted key inside the table
 * (`serde.workspace = true`), and as a line inside a
 * `[dependencies.serde]` sub-table. **A shape outside this subset is read
 * as declaring nothing**, which is the miss the header prices; there is
 * no TOML parser inside the hook's dependency budget and a hand-rolled
 * one pretending to be complete would be the worse of the two options.
 *
 * ── ONE NAME CAN BE DECLARED TWICE, AND THAT DECIDES THE ACCUMULATION ─
 * The rule is **AND within one declaration, OR across declarations**, and
 * this repository is the reason it is not one or the other.
 * `app/src-tauri/Cargo.toml` gives `serde` a real version under
 * `[workspace.dependencies]` and then writes `serde = { workspace = true }`
 * under `[dependencies]`. A single AND over every occurrence answers
 * NOT-registry-bound and `serde` goes unjudged; a single OR over every
 * occurrence answers registry-bound for `supertaskr-index`, whose
 * `[dependencies]` entry is a `path` — and THAT is a false refusal of
 * this project's own tree on the first push. Keying the accumulator on
 * the TABLE as well as the name keeps a local marker binding on its own
 * declaration and on no other. Both halves are measured in
 * `landing-gate.spec.ts` against the LIVE manifest rather than against a
 * fixture written to look like it.
 *
 * @param {string} text
 * @returns {DepRead}
 */
export function cargoManifestDeps(text) {
  /** One verdict per (table, name), ANDed over the lines of that one table. */
  const perDeclaration = new Map();
  /** @param {string} table @param {string} name @param {boolean} registryBound */
  const note = (table, name, registryBound) => {
    const clean = name.trim().replace(/^["']|["']$/g, "");
    if (clean === "") return;
    const key = `${table}\u0000${clean}`;
    perDeclaration.set(key, (perDeclaration.get(key) ?? true) && registryBound);
  };
  /** @param {string} v */
  const inlineIsLocal = (v) => /[{,]\s*(?:path|git|workspace)\s*=/.test(v);
  /** @param {string} k */
  const isLocalKey = (k) => /^(?:path|git|workspace)$/.test(k);

  /** The header of the dependency table being read, or none. */
  let table = /** @type {string | undefined} */ (undefined);
  /** The dependency a `[dependencies.<name>]` sub-table describes. */
  let subTable = /** @type {string | undefined} */ (undefined);
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    if (line === "") continue;
    const header = /^\[\[?([^\]]+)\]\]?$/.exec(line);
    if (header !== null) {
      const name = /** @type {string} */ (header[1]).trim();
      const m = CARGO_DEP_TABLE_RE.exec(name);
      table = undefined;
      subTable = undefined;
      if (m === null) continue;
      table = name;
      if (m[1] !== undefined) {
        subTable = /** @type {string} */ (m[1]);
        // Seeded registry-bound, then ANDed down by whatever local marker
        // this sub-table's own lines carry.
        note(table, subTable, true);
      }
      continue;
    }
    if (table === undefined) continue;
    const pair = /^([A-Za-z0-9_."'-]+)\s*=\s*(.*)$/.exec(line);
    if (pair === null) continue;
    const key = /** @type {string} */ (pair[1]).replace(/^["']|["']$/g, "");
    const value = /** @type {string} */ (pair[2]);
    if (subTable !== undefined) {
      if (isLocalKey(key)) note(table, subTable, false);
      continue;
    }
    const dotted = /^([^.]+)\.(.+)$/.exec(key);
    if (dotted !== null) {
      note(table, /** @type {string} */ (dotted[1]), !isLocalKey(/** @type {string} */ (dotted[2])));
      continue;
    }
    note(table, key, !inlineIsLocal(value));
  }
  /** @type {Map<string, boolean>} */
  const byName = new Map();
  for (const [key, bound] of perDeclaration) {
    const name = key.slice(key.indexOf("\u0000") + 1);
    byName.set(name, (byName.get(name) ?? false) || bound);
  }
  return { names: [...byName].filter(([, bound]) => bound).map(([name]) => name) };
}

/**
 * `Cargo.lock` — the tightest reader of the four, because cargo writes
 * this file and its shape is fixed. A `[[package]]` block carries a
 * `source` only when the crate came from somewhere other than this
 * workspace, and a registry source is spelled `registry+…`.
 *
 * @param {string} text
 * @returns {DepRead}
 */
export function cargoLockDeps(text) {
  /** @type {string[]} */
  const names = [];
  /** @type {{ name?: string, registry: boolean } | undefined} */
  let block;
  const close = () => {
    if (block !== undefined && block.name !== undefined && block.registry) names.push(block.name);
    block = undefined;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line === "[[package]]") {
      close();
      block = { registry: false };
      continue;
    }
    if (line.startsWith("[")) {
      close();
      continue;
    }
    if (block === undefined) continue;
    const name = /^name\s*=\s*"([^"]*)"$/.exec(line);
    if (name !== null) {
      block.name = /** @type {string} */ (name[1]);
      continue;
    }
    const source = /^source\s*=\s*"([^"]*)"$/.exec(line);
    if (source !== null) block.registry = /** @type {string} */ (source[1]).startsWith("registry+");
  }
  close();
  return { names: [...new Set(names)] };
}

/**
 * BASENAME to reader, and the registry the reader's names live on.
 *
 * THE KEYS ARE FORMATS AND THE PATHS ARE DERIVED — the header's own
 * paragraph on what can be derived from a tree and what cannot. A body in
 * `landing-gate.spec.ts` measures this map's key set against every
 * manifest and lockfile the live tree actually carries.
 */
export const MANIFEST_KINDS = Object.freeze({
  "package.json": { registry: "npm", read: npmManifestDeps },
  "package-lock.json": { registry: "npm", read: npmLockDeps },
  "Cargo.toml": { registry: "crates", read: cargoManifestDeps },
  "Cargo.lock": { registry: "crates", read: cargoLockDeps },
});

/**
 * @param {string} rel a repository-relative path
 * @returns {{ registry: string, read: (text: string) => DepRead } | undefined}
 */
export function manifestKindOf(rel) {
  const base = rel.slice(rel.lastIndexOf("/") + 1);
  return Object.hasOwn(MANIFEST_KINDS, base)
    ? /** @type {{ registry: string, read: (text: string) => DepRead }} */ (
        /** @type {Record<string, unknown>} */ (MANIFEST_KINDS)[base]
      )
    : undefined;
}

/**
 * Where each registry answers, and where the ANSWER's first-publication
 * date sits inside it. Both fields were measured by hand against the live
 * services at this card's build and both are on the card.
 *
 * The `env` spelling is limit 6's shape and takes limit 6's ruling; the
 * header's third cost says why it exists and what it gives away.
 */
export const REGISTRIES = Object.freeze({
  npm: { env: "SUPERTASKR_REGISTRY_NPM", base: "https://registry.npmjs.org", created: "time.created" },
  crates: {
    env: "SUPERTASKR_REGISTRY_CRATES",
    base: "https://crates.io/api/v1/crates",
    created: "crate.created_at",
  },
});

/** A range adding more names than this is refused rather than probed. */
export const MAX_DEPENDENCIES_PROBED = 50;

/**
 * The probe, as a program rather than a call.
 *
 * `laneLandingVerdict` is SYNCHRONOUS and every caller of it reads a
 * returned value, so an `await` here would have to ripple through
 * `push-guard.mjs` and both hook runners. `expandTouches` already spawns
 * a child for the same reason one function up, and this is that shape
 * with the fetch inside it. Written without a template literal and
 * without `${` so it can live inside one.
 */
export const PROBE_SOURCE = [
  "const [, url, field] = process.argv;",
  "const ctl = new AbortController();",
  "const timer = setTimeout(() => ctl.abort(), 8000);",
  "const say = (o) => { clearTimeout(timer); process.stdout.write(JSON.stringify(o)); process.exit(0); };",
  "fetch(url, { signal: ctl.signal, headers: { accept: 'application/json', 'user-agent': 'supertaskr-landing-gate' } })",
  "  .then(async (r) => {",
  "    if (r.status === 404) return say({ absent: true });",
  "    if (!r.ok) return say({ unreachable: 'the registry answered HTTP ' + r.status });",
  "    let body;",
  "    try { body = await r.json(); } catch (e) { return say({ unreachable: 'its answer was not JSON (' + String(e && e.message) + ')' }); }",
  "    let cur = body;",
  "    for (const part of field.split('.')) {",
  "      if (cur === null || typeof cur !== 'object') { cur = undefined; break; }",
  "      cur = cur[part];",
  "    }",
  "    if (typeof cur !== 'string') return say({ unreachable: 'its answer carries no ' + field });",
  "    say({ created: cur });",
  "  })",
  "  .catch((e) => say({ unreachable: String((e && e.message) || e) }));",
].join("\n");

/**
 * @typedef {{ created: string } | { absent: true } | { unreachable: string }} Probed
 */

/**
 * Ask one registry about one name. NEVER THROWS, and never reads an
 * inability as an absence: those are the two answers this whole check
 * turns on.
 *
 * @param {string} registry
 * @param {string} name
 * @param {Record<string, string | undefined>} [env]
 * @returns {Probed}
 */
export function probeRegistry(registry, name, env = process.env) {
  if (!Object.hasOwn(REGISTRIES, registry)) {
    return { unreachable: `this gate knows no registry called ${JSON.stringify(registry)}` };
  }
  const reg = /** @type {{ env: string, base: string, created: string }} */ (
    /** @type {Record<string, unknown>} */ (REGISTRIES)[registry]
  );
  if (name === "" || /[\u0000-\u001f]/.test(name)) {
    return { unreachable: `${JSON.stringify(name)} is not a name this gate will put in a URL` };
  }
  const override = (env[reg.env] ?? "").trim();
  const base = (override === "" ? reg.base : override).replace(/\/+$/, "");
  const url = `${base}/${encodeURIComponent(name)}`;
  /** @type {ReturnType<typeof spawnSync>} */
  let out;
  try {
    out = spawnSync(process.execPath, ["-e", PROBE_SOURCE, url, reg.created], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      timeout: 20000,
    });
  } catch (err) {
    return { unreachable: `the probe could not be started (${err instanceof Error ? err.message : String(err)})` };
  }
  if (out.error !== undefined && out.error !== null) {
    return { unreachable: `the probe could not be run (${out.error.message})` };
  }
  if (out.status !== 0) {
    return {
      unreachable: `the probe exited ${String(out.status)} — ${String(out.stderr ?? "").trim() || "it said nothing"}`,
    };
  }
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(String(out.stdout ?? ""));
  } catch (err) {
    return { unreachable: `the probe printed no readable JSON (${err instanceof Error ? err.message : String(err)})` };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { unreachable: "the probe printed no object" };
  }
  const obj = /** @type {Record<string, unknown>} */ (parsed);
  if (obj["absent"] === true) return { absent: true };
  if (typeof obj["created"] === "string") return { created: /** @type {string} */ (obj["created"]) };
  return {
    unreachable: typeof obj["unreachable"] === "string"
      ? /** @type {string} */ (obj["unreachable"])
      : "the probe answered nothing this gate understands",
  };
}

/**
 * @typedef {object} AddedDep
 * @property {string} file     the manifest that gained it
 * @property {string} registry which registry answers for it
 * @property {string} name
 */

/**
 * What a range ADDS, which is the after-set minus the before-set and not
 * the after-set. A lockfile that merely moved a version carries every
 * name it already carried, so reading the tip alone would put this gate's
 * whole network cost on every routine `npm ci`.
 *
 * A manifest ABSENT at the tip is skipped rather than read as empty: the
 * range deleted it, and a deletion adds nothing.
 *
 * @param {string} root
 * @param {string} base
 * @param {string} tip
 * @param {string[]} paths
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ manifests: string[], added: AddedDep[], problems: string[] }}
 */
export function addedDependencies(root, base, tip, paths, git = runGit) {
  const manifests = paths.filter((p) => manifestKindOf(p) !== undefined);
  /** @type {AddedDep[]} */
  const added = [];
  /** @type {string[]} */
  const problems = [];
  const seen = new Set();
  for (const rel of manifests) {
    const kind = /** @type {{ registry: string, read: (text: string) => DepRead }} */ (manifestKindOf(rel));
    /** @param {string} rev */
    const at = (rev) => {
      const show = git(root, ["show", `${rev}:${rel}`]);
      return show.status === 0 ? show.stdout : undefined;
    };
    const afterText = at(tip);
    if (afterText === undefined) continue;
    const after = kind.read(afterText);
    if ("problem" in after) {
      problems.push(`${rel} at ${tip}: ${after.problem}`);
      continue;
    }
    const beforeText = at(base);
    /** @type {Set<string>} */
    let before = new Set();
    if (beforeText !== undefined) {
      const read = kind.read(beforeText);
      if ("problem" in read) {
        problems.push(`${rel} at ${base}: ${read.problem}`);
        continue;
      }
      before = new Set(read.names);
    }
    for (const name of after.names) {
      if (before.has(name)) continue;
      const key = `${kind.registry}\u0000${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      added.push({ file: rel, registry: kind.registry, name });
    }
  }
  return { manifests, added, problems };
}

/**
 * The day a card was suggested, from the card AS COMMITTED at `rev` — the
 * same copy the fence is read from, for the same reason.
 *
 * @param {string} root
 * @param {string} rev
 * @param {string} file
 * @param {(root: string, args: string[]) => Ran} [git]
 * @returns {{ date: string } | { why: string }}
 */
export function cardSuggestedDate(root, rev, file, git = runGit) {
  const show = git(root, ["show", `${rev}:${file}`]);
  if (show.status !== 0) {
    return { why: `\`git show ${rev}:${file}\` failed (${show.stderr.trim() || "no message"})` };
  }
  const line = frontmatterLineOf(show.stdout, "suggested_by");
  if (line === undefined) return { why: `${file} at ${rev} declares no \`suggested_by:\`` };
  const date = /(\d{4}-\d{2}-\d{2})/.exec(line);
  if (date === null) return { why: `${file}'s \`suggested_by:\` at ${rev} carries no YYYY-MM-DD date` };
  return { date: /** @type {string} */ (date[1]) };
}

/**
 * Every reason this range's added dependencies refuse the landing, one
 * sentence each and each naming its package.
 *
 * @param {string} root
 * @param {string} base
 * @param {string} tip
 * @param {string[]} paths
 * @param {{ rev: string, file: string }} card where `suggested_by:` is read IF it is ever needed
 * @param {{ git?: (root: string, args: string[]) => Ran, probe?: (registry: string, name: string) => Probed }} [opts]
 * @returns {{ refusals: string[], added: AddedDep[], manifests: string[] }}
 */
export function dependencyRefusals(root, base, tip, paths, card, opts = {}) {
  const git = opts.git ?? runGit;
  const probe = opts.probe ?? ((registry, name) => probeRegistry(registry, name));
  const found = addedDependencies(root, base, tip, paths, git);
  // THE ZERO-COST PATH, AND IT IS THE ONE ALMOST EVERY PUSH TAKES. The
  // card's date is read LAZILY rather than handed in, because reading it
  // eagerly would put a `git show` of the card on every push in this
  // repository to answer a question no manifest asked.
  // `landing-gate.spec.ts`'s *"a range that changes no manifest asks the
  // registry nothing and reads no card"* COUNTS the calls rather than
  // trusting this comment.
  if (found.added.length === 0 && found.problems.length === 0) {
    return { refusals: [], added: [], manifests: found.manifests };
  }
  const card_ = cardSuggestedDate(root, card.rev, card.file, git);
  /** @type {string[]} */
  const refusals = [];
  for (const problem of found.problems) {
    refusals.push(
      `a changed manifest could not be READ, so what it adds is unknown — ${problem}`,
    );
  }
  if (found.added.length > MAX_DEPENDENCIES_PROBED) {
    refusals.push(
      `this range adds ${found.added.length} dependency name(s), past the ${MAX_DEPENDENCIES_PROBED} ` +
        "this gate will probe in one push — so NONE of them was checked, and a lockfile " +
        "regeneration this large is the one supply-chain event that wants a human eye",
    );
    return { refusals, added: found.added, manifests: found.manifests };
  }
  for (const dep of found.added) {
    const where = `${dep.name} (${dep.registry}, added in ${dep.file})`;
    const answer = probe(dep.registry, dep.name);
    if ("unreachable" in answer) {
      refusals.push(`${where}: THE REGISTRY COULD NOT BE REACHED — ${answer.unreachable}`);
      continue;
    }
    if ("absent" in answer) {
      refusals.push(`${where}: DOES NOT RESOLVE on its registry`);
      continue;
    }
    if ("why" in card_) {
      refusals.push(
        `${where}: resolves, but ${card_.why}, so whether it predates this card cannot be answered`,
      );
      continue;
    }
    // A DATE COMPARED AS A STRING, DELIBERATELY. Both sides are
    // `YYYY-MM-DD`, where lexicographic order IS chronological order, and
    // that keeps a timezone out of a comparison whose two sides come from
    // a registry's clock and a human's card. A package published ON the
    // card's own day is not younger than it.
    const born = answer.created.slice(0, 10);
    if (born > card_.date) {
      refusals.push(
        `${where}: first published ${born}, AFTER this card was suggested (${card_.date})`,
      );
    }
  }
  return { refusals, added: found.added, manifests: found.manifests };
}

/** The route a dependency refusal takes, which is not the fence's. */
export const DEPENDENCY_ROUTE =
  "A dependency this gate refuses is not a fence question and widening a `touches:` does not move " +
  "it. If the name is a MISTAKE — a package that was never real, or one whose spelling is one " +
  "character from a real one — remove it and say so on the card: that is the whole reason this " +
  "check exists. If the package is real, young and genuinely wanted, the age rule is the card's " +
  "own (`suggested_by:`), so the route is a card amendment COMMITTED ON MAIN that re-dates the " +
  "need, taken by triage and never by the lane. And if the registry was merely unreachable, this " +
  "gate refused because it could not verify rather than because it found anything — run the push " +
  "again once it answers.";

/** @param {string} code @param {string} reason */
const allow = (code, reason) => ({ verdict: /** @type {const} */ ("allow"), code, reason });
/** @param {string} code @param {string} reason */
const block = (code, reason) => ({ verdict: /** @type {const} */ ("block"), code, reason });

/**
 * Render a fence for a human, once, so the three refusals below cannot
 * describe it three different ways.
 *
 * @param {string} touchesLine
 * @param {ExpandedFence} fence
 * @returns {string}
 */
function fenceReport(touchesLine, fence) {
  return (
    `  the fence (${touchesLine}) expands to:\n` +
    (fence.paths.length > 0 ? fence.paths.map((p) => `    ${p}\n`).join("") : "    (nothing)\n") +
    `  always writable: ${fence.unfenceable.join(", ")}\n` +
    (fence.excluded.length > 0 ? `  carved out (outside every fence): ${fence.excluded.join(", ")}\n` : "")
  );
}

/**
 * @typedef {object} GateOptions
 * @property {(root: string, args: string[]) => Ran} [git]
 * @property {(request: { touches: string[], id?: string, file?: string }) => ({ fence: ExpandedFence } | { problem: string })} [expand]
 * @property {string} [branch] the integration branch, injectable for a fixture
 * @property {(registry: string, name: string) => Probed} [probe] the registry, injectable for a fixture
 */

/**
 * The fence one card declares at one revision, expanded.
 *
 * @param {string} root
 * @param {string} rev
 * @param {{ id: string, file: string }} card
 * @param {GateOptions} opts
 * @returns {{ touchesLine: string, fence: ExpandedFence } | { universalDual: string } | { problem: string }}
 */
export function fenceAt(root, rev, card, opts = {}) {
  const git = opts.git ?? runGit;
  const show = git(root, ["show", `${rev}:${card.file}`]);
  if (show.status !== 0) {
    return { problem: `\`git show ${rev}:${card.file}\` failed (${show.stderr.trim() || "no message"})` };
  }
  const line = frontmatterLineOf(show.stdout, "touches");
  const read = touchesTokens(line);
  if ("problem" in read) return { problem: read.problem };
  if (read.tokens.length === 0) {
    return {
      universalDual:
        line === undefined
          ? `${card.file} declares no \`touches:\` at ${rev}`
          : `${card.file}'s \`touches:\` is empty at ${rev} (${line})`,
    };
  }
  const expanded = opts.expand === undefined
    ? expandTouches({ touches: read.tokens, id: card.id, file: card.file })
    : opts.expand({ touches: read.tokens, id: card.id, file: card.file });
  if ("problem" in expanded) return { problem: expanded.problem };
  return { touchesLine: /** @type {string} */ (line), fence: expanded.fence };
}

/**
 * THE PUSH MOMENT: a lane branch's own diff against its own fence.
 *
 * @param {string} root    the checkout being pushed from
 * @param {string} headRef its HEAD, already known to match `LANE_BRANCH_RE`
 * @param {GateOptions} [opts]
 * @returns {{ verdict: "allow" | "block", code: string, reason: string }}
 */
export function laneLandingVerdict(root, headRef, opts = {}) {
  const git = opts.git ?? runGit;
  const branch = opts.branch ?? INTEGRATION_BRANCH;

  /** @type {string | undefined} */
  let rev;
  const tried = integrationRefCandidates(branch);
  for (const candidate of tried) {
    const probe = git(root, ["rev-parse", "--verify", "--quiet", `${candidate}^{commit}`]);
    if (probe.status === 0 && /^[0-9a-f]{40}$/.test(probe.stdout.trim())) {
      rev = candidate;
      break;
    }
  }
  if (rev === undefined) {
    // NO QUESTION HERE, rather than a question this gate could not
    // answer — so an ORDINARY allow and not an announced one. A checkout
    // with no integration branch is not a checkout whose lanes this gate
    // has anything to say about, which is `push-guard.mjs`'s own
    // `not-this-repository` shape one arm over.
    return allow(
      "landing-gate-no-integration-ref",
      `${root} holds no revision spelling the integration branch ${JSON.stringify(branch)} ` +
        `(asked for ${tried.join(", ")}), so there is no committed card to read a fence from`,
    );
  }

  const card = cardAt(root, rev, laneCardIds(headRef), git);
  if ("noBoard" in card) {
    return allow("landing-gate-no-board", `${card.noBoard}, so no lane here has a fence to read`);
  }
  if ("problem" in card) {
    return block(
      "landing-gate-no-card",
      `PUSH REFUSED: ${headRef} is a lane branch and ${card.problem}.\n` +
        "  A lane's fence is the card's `touches:` AS COMMITTED ON THE INTEGRATION BRANCH, and a " +
        "lane whose card is not there has no fence at all — which is a dispatch error, not a wide " +
        "fence. The least careful card must not get the widest licence (T-209's rule 2).\n" +
        `  ${ROUTE}`,
    );
  }

  const read = fenceAt(root, rev, card, { ...opts, git });
  if ("problem" in read) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE THIS PUSH: ${card.file} at ${rev} could not be expanded — ` +
        `${read.problem}. The push is allowed and the diff is UNJUDGED — a fence that cannot be ` +
        "read is not a fence that admits everything, and this guard says so rather than " +
        "pretending it looked.",
    );
  }

  const range = rangePaths(root, rev, "HEAD", git);
  if ("problem" in range) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE THIS PUSH: ${range.problem}. The push is allowed and the ` +
        "diff is UNJUDGED.",
    );
  }

  // THE SEVENTH LIMIT, ASKED BEFORE ANY FENCE QUESTION AND INDEPENDENT
  // OF ALL OF THEM (T-247). A dependency is not a containment question:
  // widening a `touches:` does not make a hallucinated package real, and
  // a card with no fence at all still must not carry one in. It is asked
  // here because `range` is the first thing that knows which paths the
  // lane committed, and it costs NOTHING — not a git call, not a spawn —
  // on a range whose paths include no manifest, which is nearly all of
  // them.
  const deps = dependencyRefusals(
    root,
    range.mergeBase,
    "HEAD",
    range.paths,
    { rev, file: card.file },
    { ...opts, git },
  );
  if (deps.refusals.length > 0) {
    return block(
      "landing-gate-dependency-refused",
      `PUSH REFUSED: ${deps.refusals.length} dependency finding(s) in ${card.id}'s range.\n` +
        `  the card, as committed on ${rev}: ${card.file}\n` +
        `  the manifests this range changed: ${deps.manifests.join(", ")}\n` +
        `  the range judged: ${range.mergeBase}..HEAD (merge-base-to-tip, the same range the ` +
        "fence arm takes), and what is judged is what the range ADDED\n" +
        deps.refusals.map((r) => `    ${r}\n`).join("") +
        "  A guard that cannot verify does not answer `safe`, so an unreachable registry and an " +
        "unreadable manifest refuse here exactly as a missing package does.\n" +
        `  ${DEPENDENCY_ROUTE}`,
    );
  }

  if ("universalDual" in read) {
    return block(
      "landing-gate-no-fence",
      `PUSH REFUSED: ${read.universalDual}.\n` +
        "  A card with an ABSENT or EMPTY `touches:` is the universal set's DUAL at this gate: it " +
        "reserves nothing, so every changed path is outside it and the push is refused WHOLE. " +
        "Deleting the declaration must not be the bypass, and the least careful card must not get " +
        "the widest licence (T-209's rule 2, same reasoning).\n" +
        `  the range judged: ${range.mergeBase}..HEAD (merge-base-to-tip, ${range.paths.length} path(s))\n` +
        `  ${ROUTE}`,
    );
  }

  const judged = judgePaths(range.paths, read.fence);
  if (judged.outside.length > 0 && read.fence.unusable.length === 0) {
    return block(
      "landing-gate-outside-the-fence",
      `PUSH REFUSED: ${judged.outside.length} committed path(s) are outside ${card.id}'s fence.\n` +
        `  the card, as committed on ${rev}: ${card.file}\n` +
        fenceReport(read.touchesLine, read.fence) +
        `  the range judged: ${range.mergeBase}..HEAD (merge-base-to-tip, never base-at-cut-to-tip, ` +
        "so a checkpoint sync is not charged with main's own paths)\n" +
        "  the paths refused:\n" +
        judged.outside.map((p) => `    ${p}\n`).join("") +
        `  ${ROUTE}`,
    );
  }

  // THE FIFTH LIMIT'S ARM (T-224), ASKED WHERE THE CONTAINMENT ARM HAS
  // NOTHING TO REFUSE. The order is argued in this module's header: the
  // two `T-212` bodies that measure WHERE THE FENCE IS READ FROM drive a
  // range that is out-of-fence AND amended, and an amendment refusal
  // placed ahead of them would answer those pushes for a different reason
  // and retire both.
  const amended = touchesAmendments(root, range.mergeBase, "HEAD", rev, range.paths, git);
  if ("problem" in amended) {
    return allow(
      "landing-gate-cannot-compare",
      "THE LANDING GATE DID NOT JUDGE THE `touches:` LINES THIS RANGE CHANGED: " +
        `${amended.problem}. The push is allowed and no card's \`touches:\` was compared — which ` +
        "is not a claim that none of them moved.",
    );
  }
  if (amended.duplicated.length > 0) {
    return block(
      "landing-gate-card-id-duplicated",
      `PUSH REFUSED: ${amended.duplicated.length} card id(s) in ${card.id}'s range are carried by ` +
        "MORE THAN ONE file under docs/tasks/ at the range's tip, and this range is what put one " +
        "of them there.\n" +
        `  the range judged: ${range.mergeBase}..HEAD (merge-base-to-tip, the same range the ` +
        "containment arm takes)\n" +
        duplicateReport(amended.duplicated, `the integration branch (${rev})`) +
        `  ${DUPLICATE_ID_ROUTE}`,
    );
  }
  if (amended.moved.length > 0) {
    return block(
      "landing-gate-touches-amended",
      `PUSH REFUSED: ${amended.moved.length} card(s) in ${card.id}'s range carry a \`touches:\` ` +
        "AMENDMENT, which is a FENCE WIDENING and is not a lane's to make.\n" +
        `  the range judged: ${range.mergeBase}..HEAD (merge-base-to-tip, the same range the ` +
        "containment arm takes)\n" +
        amendmentReport(amended.moved, `the integration branch (${rev})`) +
        `  ${AMENDMENT_ROUTE}`,
    );
  }

  if (judged.outside.length === 0) {
    return allow(
      "landing-gate-inside-the-fence",
      `every path ${card.id}'s range committed is inside its fence (${range.paths.length} path(s), ` +
        `merge-base ${range.mergeBase})`,
    );
  }
  return allow(
    "landing-gate-cannot-compare",
    `THE LANDING GATE DID NOT JUDGE ${judged.outside.length} PATH(S): ${card.id}'s fence carries ` +
      `token(s) this gate could not resolve — ${read.fence.unusable.join(", ")}.\n` +
      "  A token that resolves to nothing is not `disjoint from everything` " +
      "(method/lane-protocol.md rule 5), so a path outside the RESOLVED domains cannot be " +
      "called out-of-fence: it may sit inside a domain that token stands for. The expansion " +
      "reads no component slug map inside the hook's dependency budget (T-220).\n" +
      fenceReport(read.touchesLine, read.fence) +
      `  the range judged: ${range.mergeBase}..HEAD\n` +
      "  paths NOT judged:\n" +
      judged.outside.map((p) => `    ${p}\n`).join("") +
      "  The push is allowed and those paths are UNJUDGED — which is not a claim that they are " +
      "inside the fence.",
  );
}

/**
 * THE MERGE MOMENT: every merge commit a push of the integration branch
 * would carry, judged over ITS OWN lane's range.
 *
 * ── THE ORDERING IS WHAT PRESERVES NO-SELF-WIDENING ──────────────────
 * For a merge `M` of a lane, the fence is read from `M^1` — main BEFORE
 * the merge — and the diff is `merge-base(M^1, M^2)..M^2`, the lane's own
 * contribution. Read from `M` itself, or from `M^2`, the fence would be
 * whatever the lane's own card said after the lane edited it, and the
 * merge would be a lane widening its own gate one commit later than the
 * push gate refused it. The first parent is the only endpoint of a merge
 * that no lane has ever written to.
 *
 * ── AND THE RANGE IS THE LANE'S, WHICH IS A THIRD PAIR ───────────────
 * docs/CONVENTIONS.md's RANGE RULE names two pairs, for "what the merge
 * ADDED to main" — the integrator's `<main-before>..<the merge commit>`
 * and the executor's `merge-tree`. This gate asks a different question:
 * WHAT DID THE LANE WRITE, which is its own merge-base-to-tip range and
 * the identical question the push arm asks. Stated because the notation
 * looks like the range that bullet forbids, and it is not the same
 * endpoint: the forbidden one ends at the MERGE COMMIT and therefore
 * carries main's own meantime work; this one ends at the SECOND PARENT
 * and cannot.
 *
 * ── HOW A MERGE'S LANE IS IDENTIFIED, AND THE LIMIT THAT LEAVES ──────
 * From `git for-each-ref --points-at <M^2>` filtered by the published
 * lane branch spelling. NOT from the merge's SUBJECT: this project writes
 * custom merge subjects and no document publishes their shape, so a
 * scanner over them would be a convention invented at a read site. The
 * limit is that a merge whose lane branch has already been deleted is
 * answered CANNOT COMPARE — announced, per path, never as an allow that
 * claims it looked.
 *
 * @param {string} root
 * @param {string} headRef its HEAD, expected to be the integration branch
 * @param {GateOptions} [opts]
 * @returns {{ verdict: "allow" | "block", code: string, reason: string }}
 */
export function mergeLandingVerdict(root, headRef, opts = {}) {
  const git = opts.git ?? runGit;
  const branch = opts.branch ?? INTEGRATION_BRANCH;

  /** @type {string | undefined} */
  let remote;
  const tried = remoteRefCandidates(branch);
  for (const candidate of tried) {
    const probe = git(root, ["rev-parse", "--verify", "--quiet", `${candidate}^{commit}`]);
    if (probe.status === 0 && /^[0-9a-f]{40}$/.test(probe.stdout.trim())) {
      remote = candidate;
      break;
    }
  }
  if (remote === undefined) {
    // As above: no remote-tracking ref means there is no such thing as
    // "the merges this push would add" to ask about, which is an absent
    // question and not an unanswered one.
    return allow(
      "landing-gate-no-remote",
      `${root} holds no remote-tracking ref for ${JSON.stringify(branch)} (asked for ` +
        `${tried.join(", ")}), so which merge commits a push would add is not a question that ` +
        "can be asked here",
    );
  }

  const list = git(root, ["rev-list", "--merges", `${remote}..HEAD`]);
  if (list.status !== 0) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE THIS PUSH: \`git rev-list --merges ${remote}..HEAD\` failed ` +
        `(${list.stderr.trim() || "no message"}). The push is allowed and its merges are UNJUDGED.`,
    );
  }
  const merges = list.stdout.split("\n").map((l) => l.trim()).filter((l) => l !== "");
  if (merges.length === 0) {
    return allow("landing-gate-no-new-merges", `${remote}..HEAD carries no merge commit to judge`);
  }

  /** @type {string[]} */
  const refusals = [];
  /** @type {string[]} */
  const depRefusals = [];
  /** @type {string[]} */
  const amendments = [];
  /** @type {string[]} */
  const duplicates = [];
  /** @type {string[]} */
  const unjudged = [];
  for (const merge of merges) {
    const parents = git(root, ["rev-list", "--parents", "-n", "1", merge]);
    const fields = parents.stdout.trim().split(/\s+/);
    if (parents.status !== 0 || fields.length !== 3) {
      unjudged.push(
        `    ${merge}: it has ${fields.length > 0 ? fields.length - 1 : 0} parent(s); this gate ` +
          "reads a two-parent merge and will not guess which parent an octopus merged a lane on",
      );
      continue;
    }
    const first = /** @type {string} */ (fields[1]);
    const second = /** @type {string} */ (fields[2]);

    const refs = git(root, ["for-each-ref", "--format=%(refname)", "--points-at", second, "refs/heads/"]);
    const laneRefs = refs.stdout
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => LANE_BRANCH_RE.test(l));
    if (refs.status !== 0 || laneRefs.length !== 1) {
      unjudged.push(
        `    ${merge}: ${laneRefs.length} lane branch(es) point at its second parent ${second}, ` +
          "so which card fences it cannot be derived (the branch is deleted, or several name it)",
      );
      continue;
    }
    const laneRef = /** @type {string} */ (laneRefs[0]);

    const card = cardAt(root, first, laneCardIds(laneRef), git);
    if ("noBoard" in card) continue;
    if ("problem" in card) {
      refusals.push(
        `    ${merge} (${laneRef}): ${card.problem} — a merge whose lane has no card on its first ` +
          "parent carries no fence, and an unfenced merge is refused rather than admitted",
      );
      continue;
    }
    const read = fenceAt(root, first, card, { ...opts, git });
    if ("problem" in read) {
      unjudged.push(`    ${merge} (${card.id}): ${read.problem}`);
      continue;
    }
    const range = rangePaths(root, first, second, git);
    if ("problem" in range) {
      unjudged.push(`    ${merge} (${card.id}): ${range.problem}`);
      continue;
    }
    // THE SEVENTH LIMIT AT THE MERGE MOMENT (T-247), and this is the
    // moment the card's title actually names: "so a hallucinated or
    // typosquatted package cannot RIDE A MERGE into main". The lane arm
    // above only sees a lane that pushes its own branch; a lane merged
    // locally by the seat that holds the integration checkout reaches
    // origin through this arm and no other.
    const merged = dependencyRefusals(
      root,
      range.mergeBase,
      second,
      range.paths,
      { rev: first, file: card.file },
      { ...opts, git },
    );
    if (merged.refusals.length > 0) {
      depRefusals.push(
        `    ${merge} (${card.id}, manifests ${merged.manifests.join(", ")}):\n` +
          merged.refusals.map((r) => `      ${r}\n`).join("").replace(/\n$/, ""),
      );
      continue;
    }
    if ("universalDual" in read) {
      refusals.push(
        `    ${merge} (${card.id}): ${read.universalDual}, so every one of the ` +
          `${range.paths.length} path(s) it carries is outside it`,
      );
      continue;
    }
    const judged = judgePaths(range.paths, read.fence);
    if (judged.outside.length > 0 && read.fence.unusable.length === 0) {
      refusals.push(
        `    ${merge} (${card.id}, fence ${read.touchesLine} read from first parent ${first}):\n` +
          judged.outside.map((p) => `      ${p}\n`).join("").replace(/\n$/, ""),
      );
      continue;
    }
    // THE FIFTH LIMIT'S ARM AT THE MERGE MOMENT (T-224), asked where the
    // containment arm has nothing to refuse — the ordering, and what it
    // protects, are this module's header. The record is the FIRST PARENT
    // for the same reason the fence is: it is the only endpoint of a
    // merge no lane has written to.
    const amended = touchesAmendments(root, range.mergeBase, second, first, range.paths, git);
    if ("problem" in amended) {
      unjudged.push(`    ${merge} (${card.id}): ${amended.problem}`);
      continue;
    }
    if (amended.duplicated.length > 0) {
      duplicates.push(
        `    ${merge} (${card.id}):\n` +
          duplicateReport(amended.duplicated, `its first parent ${first}`).replace(/\n$/, ""),
      );
      continue;
    }
    if (amended.moved.length > 0) {
      amendments.push(
        `    ${merge} (${card.id}):\n` +
          amendmentReport(amended.moved, `its first parent ${first}`).replace(/\n$/, ""),
      );
      continue;
    }
    if (judged.outside.length > 0) {
      unjudged.push(
        `    ${merge} (${card.id}): ${judged.outside.length} path(s) sit outside the RESOLVED ` +
          `domains of a fence carrying unresolvable token(s) ${read.fence.unusable.join(", ")} — ` +
          `${judged.outside.join(", ")}`,
      );
      continue;
    }
  }

  if (depRefusals.length > 0) {
    return block(
      "landing-gate-merge-dependency-refused",
      `PUSH REFUSED: ${depRefusals.length} of the ${merges.length} merge commit(s) this push would ` +
        "add to the integration branch ADD a dependency this gate refuses.\n" +
        "  each merge is judged over merge-base(first parent, second parent)..second parent — the " +
        "LANE's own range — with the card, and therefore its `suggested_by:` date, read from the " +
        "FIRST parent, which is the only endpoint of a merge no lane has written to.\n" +
        `${depRefusals.join("\n")}\n` +
        (unjudged.length > 0 ? `  and ${unjudged.length} merge(s) could not be judged:\n${unjudged.join("\n")}\n` : "") +
        `  ${DEPENDENCY_ROUTE}`,
    );
  }
  if (refusals.length > 0) {
    return block(
      "landing-gate-merge-outside-the-fence",
      `PUSH REFUSED: ${refusals.length} of the ${merges.length} merge commit(s) this push would ` +
        "add to the integration branch carry paths outside the fence their own lane declared.\n" +
        "  each merge is judged over merge-base(first parent, second parent)..second parent — the " +
        "LANE's own range — with the fence read from the FIRST parent, which is the only endpoint " +
        "of a merge no lane has written to.\n" +
        `${refusals.join("\n")}\n` +
        (amendments.length > 0
          ? `  and ${amendments.length} merge(s) carry a \`touches:\` AMENDMENT:\n` +
            `${amendments.join("\n")}\n  ${AMENDMENT_ROUTE}\n`
          : "") +
        (duplicates.length > 0
          ? `  and ${duplicates.length} merge(s) ARRIVE at a DUPLICATED card id:\n` +
            `${duplicates.join("\n")}\n  ${DUPLICATE_ID_ROUTE}\n`
          : "") +
        (unjudged.length > 0 ? `  and ${unjudged.length} merge(s) could not be judged:\n${unjudged.join("\n")}\n` : "") +
        `  ${ROUTE}`,
    );
  }
  if (duplicates.length > 0) {
    return block(
      "landing-gate-merge-card-id-duplicated",
      `PUSH REFUSED: ${duplicates.length} of the ${merges.length} merge commit(s) this push would ` +
        "add to the integration branch ARRIVE at a card id carried by MORE THAN ONE file under " +
        "docs/tasks/, which leaves the fence of record ambiguous.\n" +
        "  each merge is judged over merge-base(first parent, second parent)..second parent — the " +
        "LANE's own range — with the files of record read from the FIRST parent, which is the only " +
        "endpoint of a merge no lane has written to.\n" +
        `${duplicates.join("\n")}\n` +
        (amendments.length > 0
          ? `  and ${amendments.length} merge(s) carry a \`touches:\` AMENDMENT:\n` +
            `${amendments.join("\n")}\n  ${AMENDMENT_ROUTE}\n`
          : "") +
        (unjudged.length > 0 ? `  and ${unjudged.length} merge(s) could not be judged:\n${unjudged.join("\n")}\n` : "") +
        `  ${DUPLICATE_ID_ROUTE}`,
    );
  }
  if (amendments.length > 0) {
    return block(
      "landing-gate-merge-touches-amended",
      `PUSH REFUSED: ${amendments.length} of the ${merges.length} merge commit(s) this push would ` +
        "add to the integration branch carry a `touches:` AMENDMENT, which is a FENCE WIDENING " +
        "and is not a lane's to make.\n" +
        "  each merge is judged over merge-base(first parent, second parent)..second parent — the " +
        "LANE's own range — with the line of record read from the FIRST parent, which is the only " +
        "endpoint of a merge no lane has written to.\n" +
        `${amendments.join("\n")}\n` +
        (unjudged.length > 0 ? `  and ${unjudged.length} merge(s) could not be judged:\n${unjudged.join("\n")}\n` : "") +
        `  ${AMENDMENT_ROUTE}`,
    );
  }
  if (unjudged.length > 0) {
    return allow(
      "landing-gate-cannot-compare",
      `THE LANDING GATE DID NOT JUDGE ${unjudged.length} of the ${merges.length} merge commit(s) ` +
        "this push would add:\n" +
        `${unjudged.join("\n")}\n` +
        "  The push is allowed and those merges are UNJUDGED — which is not a claim that they are " +
        "inside any fence.",
    );
  }
  return allow(
    "landing-gate-merges-inside-the-fence",
    `all ${merges.length} merge commit(s) in ${remote}..HEAD carry only paths inside the fence ` +
      "their own lane declared",
  );
}
