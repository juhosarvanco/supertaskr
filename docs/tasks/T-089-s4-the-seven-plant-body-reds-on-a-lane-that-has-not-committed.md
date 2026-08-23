---
id: T-089-s4
title: The seven-plant control-byte body asserts a clean git diff, so any lane holding an uncommitted edit to one of its seven targets reds the E2E lane
status: suggested
suggested_by: executor claude-opus-5 @T-089
---

`tools/e2e/tests/token-scan.spec.ts`, in
`one runtime-built control byte reds all seven first-party roots at exact
byte offsets`, plants a NUL into seven tracked files, restores them in a
`finally`, and then proves the restoration TWICE:

    for (const [relative, expectedHash] of hashes) {
      expect(sha256(readFileSync(...)), `${relative} restored byte-exact`).toBe(expectedHash);
    }
    const diff = spawnSync("git", ["diff", "--quiet", "--", ...targets], { cwd: repoRoot });
    expect(diff.status, "all seven plant targets restore to an empty diff").toBe(0);

**The sha256 loop proves the restoration. The `git diff` does not — it
proves the WORKING TREE MATCHES HEAD**, which is a different claim and
not this body's business. The seven targets are `app/package.json`,
`docs/NORTH_STAR.md`, `lib/parser/package.json`,
`tools/e2e/package.json`, **`method/README.md`**, `AGENTS.md` and
`.github/workflows/ci.yml`.

## Measured at T-089, on its own lane

T-089's diff edits `method/README.md`. With that edit uncommitted, the
full lane is **120 passed / 1 failed, exit 1**, failing at line 145 on
*all seven plant targets restore to an empty diff*, `Expected: 0 /
Received: 1` — while every one of the seven sha256 assertions immediately
above it PASSED. Reverting `method/README.md` to HEAD and re-running the
same spec, changing nothing else: **8 passed, exit 0**. Restoring the
edit puts the failure back.

So the message is exactly wrong about what happened: the plants DID
restore byte-exact, and the body says they did not.

## Why it matters beyond one lane

- It makes a green lane **conditional on the executor having committed**,
  which no other body in this suite requires and which the CONVENTIONS
  workflow does not mention. An executor who follows the documented order
  (run the suites, then commit) meets a red they did not cause.
- The seven targets include `method/README.md`, `AGENTS.md` and
  `docs/NORTH_STAR.md` — three files a docs-or-method-fenced card is
  *likely* to edit. This will recur.
- It is the same conflation `T-072-s1` and `T-084-s4` are about from the
  other side: `git diff` and `git checkout --` are whole-tree operations
  being used to reason about one file's round trip.

## The fix, one line

Scope the diff to a per-path comparison against the file's own PRE-PLANT
bytes, which is what the sha256 loop already does — or drop the `git
diff` assertion entirely, since it adds nothing the loop does not already
prove and subtracts a property the suite should not have. If a
whole-tree-clean precondition IS wanted, assert it as a PRECONDITION
before planting, with a message that says so, rather than as evidence of
restoration afterwards.

Poison note for whoever takes this: the two assertions are not
independent, so mutate the PRODUCER (the restore in the `finally`) to
check that the sha256 loop still reds on its own.
