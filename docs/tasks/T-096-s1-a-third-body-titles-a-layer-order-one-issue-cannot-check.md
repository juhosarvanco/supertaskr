---
id: T-096-s1
title: A third parser body TITLES the layer order and carries one issue, so it cannot check it
status: suggested
suggested_by: executor claude-opus-5 @T-096
---

T-096 closed two instances of one shape — a pin on the mechanism instead
of on the property the mechanism exists to protect. A THIRD instance is
live in the same suite and was left alone because it is outside T-096's
criteria, not because it is different in kind.

`lib/parser/test/component.test.ts`, in `describe('project-level
integration')`, holds the body titled **`component issues surface in the
project model after task and roadmap issues`**. Its fixture is a roadmap
plus ONE component file with a dangling `depends_on`, and its whole
assertion is:

    expect(result.issues).toEqual([
      expect.objectContaining({ kind: 'dangling-reference', id: 'C-77' }),
    ]);

**A one-element list has no order.** The title names the pure layer's
declared assembly order (task -> roadmap -> component) and the body checks
that a component issue REACHES the project model at all — a real and worth
keeping property, and not the one the title claims. Measured at `3d870bb`:
the pure-side reorder mutant `D14` (swapping `roadmap.issues` and
`componentSet.issues` in `parseProjectFromFiles`) reds two bodies and
NEITHER of them is this one.

**THE FIX IS THE TITLE, NOT THE FIXTURE**, and that is the whole reason
this is filed rather than built. The pure layer's order already has a pin
that works — `reads .space off every duplicate without touching a message`
in `lib/parser/test/files.test.ts`, which asserts `['task', 'feature',
'component']` over a mixed model — and T-096's ruling on the disk side was
that a SECOND body remembering an order is a second place for it to be
forgotten. Widening this fixture would build exactly that. Retitle it to
what it checks (that a component issue reaches the assembled model beside
the roadmap's, on the path where the roadmap parses) and the suite stops
claiming a check it does not make.

Fence: `[lib-parser]`. One line of test title, no source change, no
fixture change.

**WHY IT MATTERS MORE THAN A TYPO.** Both mutants T-096 was cut for
survived precisely because a reader looking for "is the layer order
pinned?" could find a body whose TITLE said yes. This is the third such
title in one suite, and a title is what a reader greps.
