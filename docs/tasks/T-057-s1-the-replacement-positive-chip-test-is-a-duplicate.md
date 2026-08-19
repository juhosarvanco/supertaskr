---
title: T-057's replacement positive chip test is a byte-equivalent duplicate of the test three cases above it
status: suggested
suggested_by: verifier claude-opus-5 @T-057
---

T-057 removed T-027-s4's `byPlanner === byHuman` tautology — a test that
compared `f(x)` with `f(x)` for byte-identical arguments — and replaced
it, per criterion 3, with an honest positive. **The replacement asserts
exactly what another test in the same `describe` already asserts, by the
same call.** The tautology did not go away; it moved from *inside one
test* to *across two*.

`app/test/interview-model.test.ts`, both in
`describe("chip attribution across turn boundaries")`:

```ts
it("a file that lands AFTER completed still belongs to that turn", () => {
  const chips = bank([{ seq: 2, files: { "docs/NORTH_STAR.md": "v1" }, at: 1 }], docs(1, {}));
  expect(chips.get(1)).toEqual(["docs/NORTH_STAR.md"]);
});

it("a docs snapshot during an active turn produces a chip", () => {
  const observed = bank(
    [{ seq: 2, files: { "docs/NORTH_STAR.md": "written" }, at: 1 }],
    docs(1, {}),
  );
  expect(observed.get(1)).toEqual(["docs/NORTH_STAR.md"]);
});
```

Same helper, same `seq: 2`, same `at: 1`, same `docs(1, {})` prime, same
matcher, same expected value. The **only** difference is the content
string, `"v1"` vs `"written"` — and no code path reads it differently.
`bankedSince` compares `before === content` where `before` is `undefined`
in both (the prime tree is empty), so both take the identical branch:
absent → present → banked.

**Measured.** Rewriting the newer test's `"written"` to `"v1"` makes the
two calls character-for-character identical, and the file still passes:

```
 Test Files  1 passed (1)
      Tests  58 passed (58)
```

So the newer test can red only when the older one also reds. It kills no
mutant of its own. Confirmed across every drill run on this branch: under
the removed-project-rebaselining mutant and under the deleted
different-project-guard mutant, this test stayed green both times.

It is not vacuous in the *poison* sense — changing its expected value to
`["docs/POISON.md"]` does red it — which is why the card's poison
discipline passed it. It is vacuous in the sense T-057 exists to catch:
**it proves an outcome another test already covers.**

Worth noting the criterion asked for this. It says the honest property is
"the conjunction of a positive (a docs snapshot during an active turn
produces a chip) and the existing negative". The executor implemented the
criterion literally; the criterion itself named a positive the suite
already had. The fix is either to delete the duplicate and let the
existing test carry the positive half (its name can say so), or to give
the positive a distinct shape the other cases do not already drive.
