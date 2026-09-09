# The golden — what a dispatch LEAVES, field by field

**A skill-driven turn and a hand-driven one leave the same files**
(ADR-021 decision 5). This file is what that sentence is checked
against: the four artifacts a dispatch and its verdict land, each one
enumerated as FIELDS, so the check is a comparison rather than an
impression.

**PROSE IS NOT THE CHECK, AND THIS FILE DOES NOT PERFORM IT.** Every
field below carries a machine line — the marker, then the artifact and
field, then `::`, then a check kind and its argument — and
`scripts/golden-check.mjs` beside this file reads THOSE LINES at run time
and performs the comparison. Nothing in that program carries a second
copy of the field list, because a rule with two statements is two chances
to disagree. Run it against a bare checkout, no install:

    node method/skills/supertaskr-seat/scripts/golden-check.mjs --repo . \
      --stamp <the dispatch stamp's sha> \
      --manifest <the lane>/.supertaskr/lane-fence.json \
      --card <the card, repo-relative> \
      --branch <the lane's full ref> --worktree <the lane worktree>
    node method/skills/supertaskr-seat/scripts/golden-check.mjs --selftest

It compares only the artifacts you supply and SKIPS the rest by name, so
a dispatch turn (stamp, manifest, lane) and a verdict turn (the card)
each get a real answer rather than a mixed one. **A field that differs is
either a defect in this turn or a change this golden has not caught up
with — say which, and never leave it unsaid.** Exit 0 everything supplied
matches · 1 a field differs · 2 called wrong · 3 the check could not run.

## Where each field came from

Derived in the Supertaskr repository at
`b2cdc650758059f928b8efb8888cf1020ab271b2`, from a **hand-driven lane**
and, where the comparison is worth making twice, from an arm-driven one:

| what | the hand-driven instance | the arm-driven instance |
|---|---|---|
| the stamp | `74ca530` — *Dispatch T-230*, 2026-09-02, an ancestor of the arm's own merge `0f3e7ae` (`git merge-base --is-ancestor 74ca530 0f3e7ae` exits 0, re-derived at this file's ref) | `9d0e385` — *T-246: dispatch stamp* |
| the verdict | `2561553` — *V-223 verdict: APPROVED*, same pre-arm window | `7e7e188` — *T-246 VERDICT: APPROVED* |
| the fence manifest | one implementation, invoked identically by both — see FIELD SET 2 | as the hand |
| the lane | the project's published create command, substituted | as the hand |

**The refs are pinned because a figure without one is wrong as soon as
anybody writes again.** Re-derive at your own ref; the DELTA is the
invariant, not the endpoints.

**THE MACHINE LINES ARE DERIVED FROM THE HAND INSTANCE FIRST.** Where the
two instances differ, this file says which one a field was taken from and
why — the two places that happens are the stamp's SUBJECT and the
verdict's digest line, and both are called out where they occur rather
than smoothed over.

---

## FIELD SET 1 — THE STAMP

A dispatch stamp is an edit to the card's frontmatter **on the
integration branch, committed before the lane is cut**, and it moves
exactly these fields:

| field | before | after | rule |
|---|---|---|---|
| `status:` | `planned` | `building` | in place; the key's position never moves |
| `builder:` | empty | the executor seat, `model@vehicle` | empty means the runtime default, so an empty field is a fact and not a blank |
| `verifier:` | empty or absent | the verifier seat, `model@vehicle` | added in its template position when the card lacks the line |
| `review:` | as filed | UNCHANGED unless the card is guard-class | a guard-class card is dispatched `independent`, and the field is set at this stamp rather than defaulted |

**NOTHING ELSE IN THE FRONTMATTER MOVES.** Measured on both instances:
`9d0e385` changes 3 lines and no others; `74ca530` changes the same
three plus a deliberate dispatch-time NARROWING of `touches:` and an
appended, dated `## DISPATCH` body section. **Those two extras are the
SEAT's editorial acts, not the ritual's** — a narrowing is a decision
somebody made and wrote down, and it belongs on the card. The ritual's
own footprint is the three fields, and `touches:` and `review:` are
therefore admitted as MAY-MOVE rather than pinned either way.

**THE COMMIT.** One commit, touching one card and no other file, whose
subject names the card and says it is a dispatch:

    T-NNN: dispatch stamp — status: building, builder: <seat>, verifier: <seat>

**THE TWO INSTANCES SPELL THAT SUBJECT DIFFERENTLY AND THE MACHINE LINE
ADMITS BOTH.** `9d0e385` uses the line above, which is what the arm
writes and therefore what a turn under this skill produces; `74ca530`,
from before the arm existed, opens *Dispatch T-230 — …*. The invariant
both keep is that the subject names the CARD and says DISPATCH; the exact
wording is presentation, and a golden that graded it would be checking
typography and calling it a contract.

**AND THE STAMP PRECEDES THE CUT.** Cards stamped after the cut met a
three-way conflict at the merge that cards stamped before did not; the
lane inherits the stamp in its own base rather than writing that line
itself. That ordering is not a field of any file and is therefore not
machine-checked here — it is `roles/orchestrator.md` 5b's, and the arm's
step order is what keeps it.

    GOLDEN> stamp.status :: frontmatter-moved
    GOLDEN> stamp.builder :: frontmatter-moved
    GOLDEN> stamp.verifier :: frontmatter-moved
    GOLDEN> stamp.review :: frontmatter-may-move
    GOLDEN> stamp.touches :: frontmatter-may-move
    GOLDEN> stamp.status :: frontmatter-value building
    GOLDEN> stamp.commit :: commit-one-file-under docs/tasks/
    GOLDEN> stamp.subject :: commit-subject-matches ^(T-[0-9]+(-s[0-9]+)?: dispatch stamp|Dispatch T-[0-9]+(-s[0-9]+)?)\b
    GOLDEN> stamp.frontmatter :: frontmatter-unmoved-otherwise

---

## FIELD SET 2 — THE FENCE MANIFEST

Written into the lane as its runtime manifest, under the lane's runtime
directory, behind a self-ignoring ignore file — **it is never a commit**.
One that reached the integration branch would hand every checkout one
lane's permanently stale fence.

**THIRTEEN TOP-LEVEL FIELDS**, in this order:

| field | type | what it is |
|---|---|---|
| `version` | number | the manifest schema's own version |
| `writtenAt` | string | ISO instant the manifest was expanded |
| `writtenFrom` | string | the checkout that expanded it |
| `ref` | string | the commit the expansion was derived at |
| `taskId` | string | the card |
| `branch` | string | the FULL ref the lane is on |
| `worktree` | string | absolute, a sibling of the repository root |
| `card` | string | repository-relative path to the card |
| `touchesLine` | string | the card's `touches:` line, verbatim — this is what the write-time guard compares |
| `paths` | array | the expansion |
| `excluded` | array | what the expansion subtracted |
| `alwaysWritable` | array | the unfenceable paths every manifest carries |
| `tokens` | array | one entry per `touches:` token |

Each `tokens` entry carries **five** fields: `raw`, `normalized`,
`kind`, `components`, `paths`.

**THE HAND AND THE ARM CANNOT DIFFER HERE, AND THE REASON IS BETTER
THAN A COMPARISON.** There is ONE implementation of the expansion and
ONE writer of the file; the arm's step 4 does not re-implement the hand
step, it **runs the hand step's own command**, spawning the same CLI with
`--write-fence` and the lane worktree. Same for the preflight (step 3)
and the brief (step 7). A comparison could find them equal by luck; this
is equal by construction, which is the stronger claim and the cheaper
one to keep true. What the machine lines below still buy is the SHAPE
against a future schema change, and the pair check in the next paragraph.

**THE PAIR IS THE GRANT.** A widening is `touchesLine` in this file AND
the card's own `touches:` line agreeing character for character. Either
half alone is a half-performed widening, and it refuses the paths the
lane ALREADY held. `equals-card-touches` is that comparison, and it is
the one field here that reads two artifacts at once.

    GOLDEN> manifest.version :: json-key-ordered 1
    GOLDEN> manifest.writtenAt :: json-key-ordered 2
    GOLDEN> manifest.writtenFrom :: json-key-ordered 3
    GOLDEN> manifest.ref :: json-key-ordered 4
    GOLDEN> manifest.taskId :: json-key-ordered 5
    GOLDEN> manifest.branch :: json-key-ordered 6
    GOLDEN> manifest.worktree :: json-key-ordered 7
    GOLDEN> manifest.card :: json-key-ordered 8
    GOLDEN> manifest.touchesLine :: json-key-ordered 9
    GOLDEN> manifest.paths :: json-key-ordered 10
    GOLDEN> manifest.excluded :: json-key-ordered 11
    GOLDEN> manifest.alwaysWritable :: json-key-ordered 12
    GOLDEN> manifest.tokens :: json-key-ordered 13
    GOLDEN> manifest.topLevelFields :: json-key-count 13
    GOLDEN> manifest.raw :: json-token-key
    GOLDEN> manifest.normalized :: json-token-key
    GOLDEN> manifest.kind :: json-token-key
    GOLDEN> manifest.components :: json-token-key
    GOLDEN> manifest.paths :: json-token-key
    GOLDEN> manifest.tokenFields :: json-token-key-count 5
    GOLDEN> manifest.touchesLine :: equals-card-touches
    GOLDEN> manifest.ref :: hash40
    GOLDEN> manifest.worktree :: absolute-path

---

## FIELD SET 3 — THE LANE

| field | shape | rule |
|---|---|---|
| branch | the project's task-branch pattern with the card id and a slug | the slug is the dispatcher's and is never invented for it |
| worktree | the project's lane-worktree pattern, resolved ABSOLUTELY against the repository root | a SIBLING directory, never a path inside the repository — a relative spelling resolves against whatever directory the dispatching shell happens to sit in, and there is no error |
| bench | the project's bench pattern, cut **detached** at the same commit | a detached entry is not a lane and holds no fence, which is what keeps it out of the lane list |
| base | a HASH | "latest" names a different commit for every reader, and a different one an hour later |
| port | derived from the card's own number | machine-wide defaults are how two concurrent lanes take one port |
| scratch stem | derived from the card id | the scratchpad is ONE directory shared by every seat a session spawns |

**THE BRANCH SURVIVES THE WORKTREE.** The worktree is removed after the
merge and the checkpoint, by the integrator; the branch is kept. So the
branch list is every lane this repository has ever run, and the worktree
list is the authority on which fences are held right now.

**THREE OF THE SIX ROWS ARE MACHINE-CHECKED AND THREE ARE NOT, WHICH IS
SAID RATHER THAN LEFT TO BE NOTICED.** The branch pattern, the worktree's
absoluteness and its siblinghood are properties of two strings and are
checked below. The bench's detachment, the base being a hash and the port
and scratch stem being derived are properties of a live git tree and of
the arm's step 8, and this file does not have them in hand — the arm
refuses at the step that fails, and that refusal is their check.

    GOLDEN> lane.branch :: branch-matches ^refs/heads/task/T-[0-9]+(-s[0-9]+)?-[a-z0-9][a-z0-9-]*$
    GOLDEN> lane.worktree :: worktree-sibling
    GOLDEN> lane.worktree :: worktree-absolute

---

## FIELD SET 4 — THE VERDICT

Appended to the card's `## Verdicts` section — never to a separate file,
because the card is the record.

| field | rule |
|---|---|
| the date | present on both instances |
| the seat | `model@session`, named |
| the word | `APPROVED`, or `REJECTED` with concrete, reproducible failures — commands, inputs, expected vs actual. Vague objections are not verdicts |
| the attack set's digest | `attack set: sha256:<hex> (<file>)` **on a line of its own**, so a later reader re-runs one command and gets a yes or a no instead of an impression |
| the ground truths' digest | the same shape, where the dispatcher took any |
| the blindness disclosure | which guarantee actually held — a clock-shaped blindness, a two-spawn one, or a discipline the seat kept by hand |
| the seat-mismatch line | where the verifier is not the assigned model: *verified by the builder's own model family, not an outside one* |

**A VERDICT CITING A DIGEST THAT DOES NOT MATCH THE SAVED FILE IS
REFUSED**, not read and not weighed, and the pass is re-run. That
comparison is the method eval gate's `MF-09`, not this file's: this file
pins the LINE'S SHAPE, which is what makes the comparison performable at
all.

**THE ONE FIELD THE TWO INSTANCES DO NOT SHARE, NAMED.** An earlier
edition of this file said every field above is present in both. **That
was wrong and it is corrected here rather than quietly dropped**: the
attack-set digest is present in both, but only `7e7e188` spells it on a
line of its own as `attack set: sha256:<hex> (<file>)`. `2561553`
predates that spelling and carries the same digest inside a sentence.
**The machine line pins the RULE, not the older instance** — the rule is
`docs/CONVENTIONS.md`'s THE VERIFIER'S BENCH IS TWO SPAWNS bullet, and a
golden that pinned the older instance would pin a shape the conventions
have since replaced. What DOES differ as presentation, and is not pinned:
the pre-arm verdict opens with a bare dated line under `## Verdicts`, the
later one with a third-level heading carrying the same date, seat and
word.

**AN EMPTY `## Verdicts` SECTION IS NOT A DIFFERING FIELD.** A lane
before its verdict has the heading and nothing under it, and the check
skips the verdict fields by name. A card with NO `## Verdicts` heading at
all is a differing field, because the card is the record and the section
is where the record goes.

    GOLDEN> verdict.date :: section-regex \b20[0-9]{2}-[0-9]{2}-[0-9]{2}\b
    GOLDEN> verdict.seat :: section-regex [A-Za-z0-9._-]+@[A-Za-z0-9._-]+
    GOLDEN> verdict.word :: section-regex \b(APPROVED|REJECTED)\b
    GOLDEN> verdict.attackSetDigest :: section-regex-line ^attack set: sha256:[0-9a-f]{64} \(.+\)$
    GOLDEN> verdict.blindness :: section-regex [Bb]lind
    GOLDEN> verdict.groundTruthDigest :: section-regex-optional ^ground truth: sha256:[0-9a-f]{64} \(.+\)$
    GOLDEN> verdict.seatMismatch :: section-regex-optional builder's own model family

---

## What this golden deliberately does NOT pin

- **The prose.** A verdict's argument, a card's dispatch note and a
  brief's rows are written by a seat and are supposed to differ.
- **A count of anything.** A count is a function of a tree; this file
  pins field SETS and their rules, and every instance it names carries
  the ref it was read at.
- **The exit codes.** They belong to the commands, and the commands'
  spellings belong to `host-commands.md` beside this file.
- **The stamp's ordering against the cut, the bench's detachment, and
  the derived port.** Each is a property of a live tree rather than of a
  file's fields; FIELD SETS 1 and 3 say so where they occur, and the
  arm's refusal at the failing step is what holds them.
