---
id: T-118
title: The seven-plant body asks git whether the tree is clean, not whether the lane restored what it planted — so any uncommitted edit to one of the seven reds the whole E2E lane
feature: F-02
milestone: 4
priority: 57
size: S
status: planned
blocked_by: []
touches: [tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

Absorbs (seventh triage, 2026-08-24): T-061-s2, T-089-s4 — files removed
in this commit.

`tools/e2e/tests/token-scan.spec.ts`'s
`one runtime-built control byte reds all seven first-party roots at
exact byte offsets` plants a NUL into seven tracked files, restores them
in a `finally`, and then proves the restoration **twice**. Read at
`6b0cf47`:

```ts
for (const [relative, expectedHash] of hashes) {
  expect(sha256(readFileSync(path.join(repoRoot, relative))), `${relative} restored byte-exact`).toBe(
    expectedHash,
  );
}
const diff = spawnSync("git", ["diff", "--quiet", "--", ...targets], { cwd: repoRoot });
expect(diff.status, "all seven plant targets restore to an empty diff").toBe(0);
```

**THE TWO QUESTIONS ARE DIFFERENT AND ONLY ONE IS THIS BODY'S.**
`sha256(before) === sha256(after)` asks *did the lane put back exactly
what it took* — the property the plant/restore machinery owes.
`git diff --quiet` asks *does the working tree match the index*, which
is a property of whoever ran the lane. The second is strictly stronger,
strictly off-topic, and it is the one that fails.

## Observed twice, on two different lanes, from real edits

**T-061's lane** added one npm script to `tools/e2e/package.json` — one
of the seven. With that edit uncommitted the lane ran **128 passed / 1
failed**, the failure being the `git diff` assertion while the sha256
loop three lines above passed for all seven. Committing the edit and
re-running, nothing else changed: **129 passed, exit 0**.

**T-089's lane** edited `method/README.md` — another of the seven. Full
lane **120 passed / 1 failed, exit 1**, failing on *all seven plant
targets restore to an empty diff*, `Expected: 0 / Received: 1`, while
every one of the seven sha256 assertions immediately above it PASSED.
Reverting that file to HEAD and re-running the spec alone: **8 passed,
exit 0**. Restoring the edit put the failure back.

**So the message is exactly wrong about what happened**: the plants DID
restore byte-exact, and the body says they did not. A reader who trusts
it goes looking for a bug in the plant loop.

## Who it bites, and why it will recur

The seven targets, read at `6b0cf47`: `app/package.json`,
`docs/NORTH_STAR.md`, `lib/parser/package.json`,
`tools/e2e/package.json`, `method/README.md`, `AGENTS.md`,
`.github/workflows/ci.yml`. **Precisely the lane most likely to be
running this suite** — an executor fenced `[tools/e2e]`, mid-task, with
an uncommitted edit to `tools/e2e/package.json`. Three more are the
ordinary blast radius of a docs-or-method lane. It makes a green lane
conditional on the executor having committed, which no other body in
this suite requires and which no documented workflow mentions; and the
remedy an executor reaches for — "commit first, then run the lane" — is
exactly backwards, because the point of a green lane is to decide
whether to commit.

**RELATED AND NOT THE SAME.** The finding that the lane WRITES into
seven tracked files at all was absorbed by `T-093` (planned,
`[docs/CONVENTIONS.md]`, sixth triage). That card is about the writes;
this one is about the assertion that checks them, and neither settles
the other.

## The arm to weigh, because the guard it half-implements is worth having

Deleting the assertion is one line and loses nothing the body is about.
But if the intent was *refuse to run this destructive body against a
dirty tree* — defensible, since a crashed worker leaves a planted NUL
byte in `.github/workflows/ci.yml` and six other tracked files — then it
belongs BEFORE the plant, with a message that says so. **As written it
neither guards the plant nor describes the failure.**

## Acceptance criteria

- **THE RESTORATION ASSERTION SHALL ASK ONLY WHETHER THE LANE RESTORED
  WHAT IT PLANTED.** The per-target sha256 comparison against the
  PRE-PLANT bytes is that question and already answers it; nothing
  downstream of the `finally` may fail because of an edit the body did
  not make.
- IF a whole-tree-clean precondition is wanted THEN it SHALL be asserted
  **before anything is planted**, with a message naming the dirty paths
  and saying that the body refuses to write over unsaved work — never
  after the restore as evidence about the restore.
- **A PIN SHALL PROVE THE BODY STILL CATCHES A FAILED RESTORE.** The two
  assertions were never independent, so the drill SHALL mutate the
  PRODUCER — the restore loop in the `finally` — and require the sha256
  loop to red on its own. **Deleting an assertion must not delete its
  own failure** (poison shape five).
- **THE FALSE RED SHALL BE PROVED GONE THE WAY IT WAS PROVED PRESENT**:
  with an uncommitted edit to one of the seven in the working tree, the
  spec SHALL pass; with the restore broken, it SHALL fail. Both runs
  recorded with their exits read unpiped from `$?`. **One run cannot
  distinguish "fixed" from "the condition was absent"** — the same
  lesson `T-063` records from the other direction.
- IF the precondition arm is taken THEN it SHALL be driven in BOTH
  directions — a clean tree runs, a dirty tree refuses loudly — because
  a guard proved only on the clean side cannot tell refusal from
  absence (CONVENTIONS: A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL).
- **THE SEVEN TARGETS SHALL NOT CHANGE**, and the `[P5:` hit count, the
  byte offsets and the exit-1 assertion that follow SHALL stay exactly
  as they are. This card changes one question the body asks and nothing
  about what it plants.
- **THE CARD SHALL STATE WHICH ARM IT TOOK AND WHY**, in the notes:
  delete, or pre-flight. Both are defensible and the choice is the
  record.

Verification: headless — `npm test`, `npm run typecheck` and
`npm run lint:tokens` (plus `-- --selftest`) from tools/e2e/, exits read
unpiped from `$?` and stated. The lane runs workers 1, retries 0, no
skips. **POISON DRILL on every new or changed assertion, one side
only**, producer mutated and never the assertion; each mutated text read
back with `git diff` before its run; restores per-path proved by sha256
at the drill's own commit. **Take care with the drill on THIS body** —
it plants into seven tracked files and its own restore is the producer
being mutated, so mutate in a detached scratch worktree and never in a
tree anybody else is reading. Then the shape-six check per changed body.
The DOCS GATE fires on this card; ask
`node tools/e2e/scripts/docs-gate.mjs <changed path>...` directly, never
through `xargs` — two of the four exit codes do not survive that pipe on
Darwin (T-061-s3). @human: none.
