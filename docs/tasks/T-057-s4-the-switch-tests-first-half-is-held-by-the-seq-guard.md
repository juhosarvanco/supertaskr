---
title: The project-switch test's "no chip on the switch" half is held by the seq guard, not the project guard it names
status: suggested
suggested_by: verifier claude-opus-5 @T-057
---

T-057's new test in `app/test/interview-model.test.ts` asserts two things
at once:

```ts
expect({ equal: switchAt(8), lower: switchAt(3) }).toEqual({
  equal: { switched: undefined, changed: ["docs/STATE.md"] },
  lower: { switched: undefined, changed: ["docs/STATE.md"] },
});
```

The `changed` half is genuinely load-bearing and is the half the criterion
asked for. Removing the project-directory clause from `observeBanking`'s
`shouldRebaseline` reds it in both arms — measured:

```
-     "changed": ["docs/STATE.md"],
+     "changed": undefined,
```

The `switched: undefined` half never moves. The baseline is primed at
seq 8, and both arms drive the switch at seq 8 (equal) and seq 3 (lower),
so `bankedSince`'s **stale-snapshot** guard (`docs.seq <= baseline.seq`)
returns `[]` before the different-project guard is ever consulted.
Measured by deleting the different-project guard outright:

```
 FAIL  bankedSince diffs the tree and claims nothing else > a DIFFERENT project yields nothing
 FAIL  bankedSince diffs the tree and claims nothing else > …but a baseline that knows NO project is not a switch
 Test Files  1 failed (1)
      Tests  2 failed | 56 passed (58)
```

Two pre-existing tests caught it; the new switch test stayed green. It
also stayed `undefined` under the rebaselining mutant. So no
project-mechanism mutant moves that half of the assertion — it is pinned
by the seq guard, which two other tests already own.

**This is a tension, not a mistake.** The equal/lower watermarks are
exactly what makes the `changed` half isolate the projectDir clause: at a
*higher* switch seq, `docs.seq > baseline.seq` would rebaseline anyway and
the criterion's mutant would survive. You cannot have both halves pinned
by the project guard in one arm. The executor optimised for the half the
criterion names, which is the right call.

Recording it so the test's name is not read as more than it proves: a
reader who sees "rebaselines a project switch" and `switched: undefined`
will reasonably assume the switch produced no chip *because it was a
different project*. On this data it produced none because the snapshot was
stale. A one-line comment beside the assertion, or a third arm at a higher
seq asserting `switched: undefined` for the project reason, would close
the gap.
