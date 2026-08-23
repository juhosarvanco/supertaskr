---
id: T-061-s2
title: The seven-plant body asks git whether the tree is clean, not whether the lane restored what it planted — so any uncommitted edit to one of the seven reds it
status: suggested
suggested_by: executor claude-opus-5 @T-061
---

**Observed failing, on this lane, before anything was committed** —
reproduced from a real edit rather than reasoned.
`tools/e2e/tests/token-scan.spec.ts`, in
`one runtime-built control byte reds all seven first-party roots at
exact byte offsets`:

```ts
for (const [relative, expectedHash] of hashes) {
  expect(sha256(readFileSync(path.join(repoRoot, relative))), `${relative} restored byte-exact`).toBe(
    expectedHash,
  );
}
const diff = spawnSync("git", ["diff", "--quiet", "--", ...targets], { cwd: repoRoot });
expect(diff.status, "all seven plant targets restore to an empty diff").toBe(0);
```

The seven targets include **`tools/e2e/package.json`**. This lane added
one npm script to it. With that edit uncommitted, the lane ran
**128 passed / 1 failed**, and the failing assertion was the `git diff`
one — while the sha256 loop three lines above passed for all seven,
because the restore was byte-exact. Committing the edit and re-running,
with nothing else changed, gave **129 passed, exit 0**.

**THE TWO QUESTIONS ARE DIFFERENT AND ONLY ONE IS THIS BODY'S.**
`sha256(before) === sha256(after)` asks *did the lane put back exactly
what it took* — the property the plant/restore machinery owes.
`git diff --quiet` asks *is the working tree identical to the INDEX*,
which is a property of whoever ran the lane, not of the lane. The
second is strictly stronger and strictly off-topic, and it is the one
that fails.

**WHO IT BITES.** Precisely the lane that is most likely to be running
it: an executor fenced to `[tools/e2e]`, mid-task, with an uncommitted
edit to `tools/e2e/package.json`. Four of the seven targets are equally
reachable —`app/package.json`, `lib/parser/package.json`, `AGENTS.md`,
`.github/workflows/ci.yml` — and `docs/NORTH_STAR.md` and
`method/README.md` are edited by docs lanes. The remedy an executor
will reach for is "commit first, then run the lane", which is exactly
backwards: the point of a green lane is to decide whether to commit.

**IT IS ALSO A FALSE RED WITH THE WRONG MESSAGE.** The failure reads
*"all seven plant targets restore to an empty diff — Expected 0,
Received 1"*, which says the RESTORE failed. It did not; the assertion
two lines up proves it did not. A reader who trusts the message goes
looking for a bug in the plant loop.

**Options.**

1. **Delete the `git diff` assertion.** The sha256 loop already pins
   the property, per target, by name, with a better message. This is
   one line and loses nothing the body is about.
2. **Move it to a PRE-flight.** If the intent was "refuse to run this
   destructive body against a dirty tree" — a defensible intent, since
   a crashed worker would leave a planted NUL byte in a tracked file —
   then assert it BEFORE planting, with a message that says so
   (`test.skip` or a loud failure naming the dirty paths). As written
   it neither guards the plant nor describes the failure.
3. **Compare against the pre-test bytes with git.** `git stash`-free:
   the body already holds the originals in memory; nothing git adds is
   information the body does not have.

Arm 2 is the one I would take, because the guard it half-implements is
worth having: this body writes a NUL byte into `.github/workflows/ci.yml`
and six other tracked files, and it should not do that on top of
somebody's unsaved work.

**RELATED, AND NOT THE SAME.** `T-084-s4` records that the lane writes
into seven tracked files and restores them. That finding is about the
WRITES; this one is about the ASSERTION that checks them.
