# The golden — what a dispatch LEAVES, field by field

**A skill-driven turn and a hand-driven one leave the same files**
(ADR-021 decision 5). This file is what that sentence is checked
against: the four artifacts a dispatch and its verdict land, each one
enumerated as FIELDS, so the check is a comparison rather than an
impression.

**PROSE IS NOT THE CHECK.** Compare per field. A field that differs is
either a defect in this turn or a change this golden has not caught up
with — say which, and never leave it unsaid.

## Where each field came from

Derived in the Supertaskr repository at
`21f5325403a73e66204105d8746d246ee609e502`, from a **hand-driven lane**
and, where the comparison is worth making twice, from an arm-driven one:

| what | the hand-driven instance | the arm-driven instance |
|---|---|---|
| the stamp | `74ca530` — *Dispatch T-230*, 2026-09-02, an ancestor of the arm's own merge `0f3e7ae` (`git merge-base --is-ancestor 74ca530 0f3e7ae` exits 0) | `9d0e385` — *T-246: dispatch stamp* |
| the verdict | `2561553` — *V-223 verdict: APPROVED*, same pre-arm window | `7e7e188` — *T-246 VERDICT: APPROVED* |
| the fence manifest | one implementation, invoked identically by both — see FIELD SET 2 | as the hand |
| the lane | the project's published create command, substituted | as the hand |

**The refs are pinned because a figure without one is wrong as soon as
anybody writes again.** Re-derive at your own ref; the DELTA is the
invariant, not the endpoints.

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
own footprint is the three fields.

**THE COMMIT.** One commit, naming the card and the stamp:

    T-NNN: dispatch stamp — status: building, builder: <seat>, verifier: <seat>

**AND THE STAMP PRECEDES THE CUT.** Cards stamped after the cut met a
three-way conflict at the merge that cards stamped before did not; the
lane inherits the stamp in its own base rather than writing that line
itself.

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
one to keep true.

**THE PAIR IS THE GRANT.** A widening is `touchesLine` in this file AND
the card's own `touches:` line agreeing character for character. Either
half alone is a half-performed widening, and it refuses the paths the
lane ALREADY held.

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
REFUSED**, not read and not weighed, and the pass is re-run.

**WHAT DIFFERS BETWEEN THE TWO INSTANCES IS PRESENTATION, NOT A FIELD.**
The pre-arm verdict opens with a bare dated line under `## Verdicts`; the
later one opens with a third-level heading carrying the same date, seat
and word. Every field above is present in both. **Say that out loud when
you compare** — a golden that quietly graded a heading level would be
checking typography and calling it a contract.

---

## What this golden deliberately does NOT pin

- **The prose.** A verdict's argument, a card's dispatch note and a
  brief's rows are written by a seat and are supposed to differ.
- **A count of anything.** A count is a function of a tree; this file
  pins field SETS and their rules, and every instance it names carries
  the ref it was read at.
- **The exit codes.** They belong to the commands, and the commands'
  spellings belong to `host-commands.md` beside this file.
