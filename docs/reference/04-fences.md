# 04 — Fences

A fence is the path set a lane may write. It is declared on the card as
`touches:`, expanded once at dispatch through one implementation,
compared for disjointness against every live lane, written into the
lane as a manifest, enforced by a hook at every write and by a gate at
every push, and widened only by the dispatching seat. The lane protocol
(method/lane-protocol.md rule 5) is the law; lib/parser/src/fence.ts
is the one expansion; .claude/hooks/lane-fence.mjs and
.claude/hooks/landing-gate.mjs are the two enforcements.

## Declaring a fence

`touches:` is a list of tokens. Each token is one of:

- **A path** — a file (`app/src/App.tsx`) or a directory prefix
  (`src/egress/`, `docs/architecture/components/`). A path and the same
  path with a trailing slash are one token. The supported shapes a
  fence can reason about are a directory claim and an exact file; a
  wildcard inside a filename (`app/test/map-*`) normalises to a prefix
  that matches nothing and reads as disjoint when it is not, which is
  the failure T-111-s3 named.
- **A component slug** — shorthand for the path set a component
  declares. The map from slug to paths is each component file's own
  `touch_slugs:` field in docs/architecture/components/C-NN-*.md,
  joined with that file's `paths:`. The ARCHITECTURE document's prose
  slug block is not consulted, because prose goes stale the day a
  component is added (method/roles/executor.md row 5). One component
  may carry two slugs, and two slugs may name one component, which is
  why tokens are never compared as strings.

The current slug map: `app-shell` (C-05, C-10, C-16), `lib-parser`
(C-06), `crate-index` (C-07), `app-board` (C-08, C-09, C-17, C-18),
`app-map` (C-12), `app-interview` (C-13), `app-agent` (C-14),
`app-dispatch` (C-15). C-01 (the method) and C-11 (design tokens) carry
no slug and enter a fence by bare path.

The norm is path-granular fences: name the paths the lane writes at the
narrowest granularity that still covers them. A component-sized fence
serialises lanes that never touch each other behind a word; measured on
the session that ran six lanes concurrently, every block was a naming
collision and not one real collision occurred.

## Expanding a fence

`expandFence` (lib/parser/src/fence.ts) classifies each token as
`slug`, `path`, `rejected` or `unresolved`, and returns the deduped,
sorted path domains the fence reserves, plus:

- **`excluded`** — the card's own file. A card's own file is never part
  of its own fence: the dispatch stamp lands there before the lane
  exists and the closing stamp after it ends, so a lane writing its own
  notes is a protocol write, not a fence breach. The carve-out is
  encoded in the expansion rather than left to each reader.
- **`unusable`** — every `rejected` and `unresolved` token. A non-empty
  list makes the fence uncomparable.
- **`issues`** — every refusal, flagged rather than hidden. Nothing here
  throws, reads the filesystem, or answers silence.

**The unfenceable directory.** `UNFENCEABLE_PATHS` is `['docs/tasks']`:
the protocol writes there on every card, so a lane holding it collides
with every other lane's opening and closing move. A token that is that
path or contains it (`docs`, `.`) is rejected; a token inside it
(`docs/tasks/T-108-….md`) stays fenceable, which is the narrowing the
protocol asks for. This is a list of one, deliberately not a rule about
directories. `..` and paths outside the repository are unresolved.

## Comparing two fences

`compareFences` answers one of three verdicts, never two:

- **disjoint** — no domain of one contains or equals a domain of the
  other. Containment is overlap: a directory fence and a fence naming a
  file inside it are not disjoint however far apart their strings sort.
- **overlapping** — with a witness path.
- **unusable** — one side carries an unresolved or rejected token, or
  declares no `touches:` at all. The comparison could not be made, and
  a fence that answers "no overlap" when it means "I do not know" is
  the defect this module exists to remove.

The dispatch derivation (chapter 05) runs this comparison between the
candidate card and every lane live at dispatch, naming the colliding
lane before anything is cut.

## Arming a fence: the manifest

After the lane is cut and before the session is briefed, the dispatcher
runs `brief.mjs --task T-NNN --write-fence <lane worktree>`. It expands
the card's `touches:` through the parser's one implementation and
writes `.supertaskr/lane-fence.json` into the lane worktree, with a
self-ignoring `.gitignore` beside it so no manifest ever lands on the
integration branch. The manifest carries the expanded paths, the
`excluded` list and the `touches:` line it was stamped from.

The expansion happens at dispatch and not at the write, because a lane
that computes its own fence can compute a wider one. The dispatcher
reads the manifest back before briefing: the read-back once caught the
writer stamping the parent card's fence. The dispatch ritual is serial
(cut one worktree, arm it, read the manifest back, then cut the next),
because the expansion refuses a dispatch against a lane whose fence it
cannot read.

## Enforcing at the write: the hook

`.claude/hooks/lane-fence-hook.mjs` runs as a PreToolUse hook on the
Edit, Write, NotebookEdit and Read tools; its decision function is
`decide` in `.claude/hooks/lane-fence.mjs`, zero dependencies, so it
runs in a worktree cut ninety seconds ago with nothing installed. It
resolves the target path's repository, not the writer's cwd, and
applies that repository's fences (T-199: the earlier cwd-based version
left every lane write unjudged for a night).

Two seats, two rules:

- **A lane** (a checkout whose HEAD is a task branch) answers from its
  own manifest, and every uncertainty is a refusal. A task branch with
  no manifest is refused: a dispatch that skipped its step. A path
  outside the manifest is refused, naming the fence, the path and the
  route (file a suggestion naming the fence it needs). A write to
  docs/tasks/ is allowed, per the unfenceable rule. The manifest's
  stamped `touches:` line is compared against the lane's own copy of
  the card, and a mismatch refuses everything including the card
  itself, which is the half-delivered-widening window described below.
- **A seat with no lane** (the integration checkout, a detached scratch
  tree) answers from every live lane's manifest, walked from git's
  worktree administration in a fifth of a millisecond, and every
  uncertainty is an allow. A refusal here rests on a positive, readable
  reservation by another lane; a write into a lane's tree is judged by
  that lane's fence whoever is writing. The integration seat fails
  open because stopping it stops every dispatch, merge and checkpoint
  at once.

**The secret read guard** (T-249) is the same hook's read half: a Read
of an env file, a private key, an ssh or cloud credentials directory,
a credential rc file or a keychain export is refused in every checkout,
with the entry that matched named. A fence widens writes and never
secrets: naming such a file in `touches:` does not open it. An
unclassifiable path is allowed and logged. Bash reads bypass this
guard, disclosed.

**The disclosed limits**, stated where the guard is documented because
a guard believed total is worse than none: the hook sees writes made
with the write tools; a shell redirect, a `sed -i` or a script goes
past it. A seat that holds no lane is not fenced by it. A hook that
cannot locate its own program fails open, silently, which is the
harness's contract. The hook loads from the dispatching checkout, so a
lane cannot arm its own fix.

**The physical layer** (T-210) narrows the shell hole: after the
manifest is written, every tracked file outside the fence is made
read-only in the lane's worktree, so a stray open-for-write fails with
EACCES from the kernel. Measured limits: a rename over the file
succeeds (which is how `sed -i` writes), creation and deletion are not
blocked, git writes straight through and re-arms nothing, and the
owner can chmod it back. The landing gate catches exactly the residue:
a renamed-over file is a content change in the diff.

## Enforcing at the landing: the gate

`.claude/hooks/landing-gate.mjs` judges committed content, so its
coverage is total by construction whatever wrote the file. Two moments,
one containment rule (`within`):

- **A push of a lane branch** — the lane's merge-base-to-tip diff
  against the fence expanded from the card **as committed on main**
  (`git show main:docs/tasks/…`). Not from the manifest, which the lane
  can rewrite; not from the lane's copy of its card at any tip.
- **A push of the integration branch** — every merge commit the push
  carries, each judged over its own lane's range with the fence read
  from the merge's first parent.

The property this rests on: main is the ref the lane's own commits
cannot move. Its disclosed limits include that a lane can move local
main with `git update-ref` (a plumbing command; measured, and a seat
willing to run it could push `--no-verify` instead), and that the
expansion runs through `.claude/hooks/expand-fence.mjs`, a subprocess
importing the parser's source with type stripping, which answers
CANNOT COMPARE (exit 3) where stripping is unavailable rather than
guessing a fence.

## Widening a live fence: fast path A

The base protocol is the law and stays the fallback: an executor that
needs a path outside its fence builds everything that fits, routes the
need naming the exact paths, and ends. The fast path is an optimisation
layered on it, and never a wait.

1. The executor names the exact paths and why, parks that edit, and
   keeps building inside its fence.
2. The granting seat (the dispatcher) amends the card's `touches:` **on
   the integration branch**, commits it, and re-runs `--write-fence`
   for that lane. The expansion refuses the whole act unless the
   widened fence is disjoint from every other live lane.
3. The amendment is delivered to the lane's own working copy of the
   card as well, because the write-time guard compares the manifest's
   stamped line against that copy. A widening delivered to one reader
   and not the other refuses the paths the lane already held, and
   during that window the card itself is refused too, so routing
   cannot be written; the lane reports the half-delivered widening
   instead.
4. The grant is two agreeing files on disk in the lane: the manifest
   showing the new path, and the lane's copy of the card carrying,
   character for character, the `touches:` line the manifest was
   stamped from. The executor proceeds on its own read of them, never
   on a reply, and writes neither half itself.

**Fast path B**, the checkpoint sync, applies when the lane that held
the needed paths has merged and checkpointed: dry-run the sync with
`git merge-tree --write-tree` (three-valued: clean, conflict, unknown,
read from the output together with the code), widen by fast path A,
merge the checkpoint commit into the lane, drop and re-arm the physical
layer from the post-widening manifest. All or nothing, never a partial
file pick, never a conflict resolved as ours.

**The tripwire.** Where the three refusals are enforced, disjoint
write-sets cannot textually conflict, so a conflict in the forecast is
evidence of a breach, except in three classes where a conflict is the
protocol working: the unfenceable directory, each card's own file, and
the integration seat's standing writes (STATE and the checkpoint
record).

## What a fence is not

- Not a lock on a name: two lanes fencing different files of one
  component run in parallel.
- Not a security boundary: it stops mistakes, and it says so.
- Not exclusivity over the integrator's writes: STATE, the record and
  the regenerated artifacts are the integration seat's on every
  landing.
- Not a licence for the lane to write its own card's `touches:` line.
  That line is the one line on its own card a lane never writes.
