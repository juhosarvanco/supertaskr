---
id: T-076-s5
title: The disk and pure layers are pinned deep-equal against a fixture that cannot see the difference
status: suggested
suggested_by: verifier claude-opus-5 @T-076
---

`parseProject` (disk) and `parseProjectFromFiles` (pure) are contracted
to be deep-equal on the same files — the contract T-076 leaned on when it
tightened `files.test.ts:48` ("the two layers are deep-equal by contract,
and that contract is what a missing field at one site would break
silently"). Both assemble their issue list in a declared LAYER ORDER,
task → roadmap → component, and both say so in a source comment:
`lib/parser/src/files.ts:181` ("their issues come last (task -> roadmap
-> component order, mirroring the disk layer)") and
`lib/parser/src/project.ts:202`.

Only one side is pinned. T-076 added the pin for the PURE side —
`lib/parser/test/files.test.ts:192` asserts
`['task','feature','component']` over one mixed model, and it is the only
test in the suite that does (verified: swapping `files.ts:181` to
`issues.push(...componentSet.issues, ...roadmap.issues)` reds exactly that
one body and nothing else). The DISK side has no equivalent.

**Measured.** One one-sided source mutant at `project.ts:202`:

    - issues: [...taskResult.issues, ...roadmapResult.issues, ...componentResult.issues],
    + issues: [...taskResult.issues, ...componentResult.issues, ...roadmapResult.issues],

`npx vitest run` from `lib/parser/`: **263 passed (263), exit 0** — it
survives. And it genuinely breaks the contract; the same fixture through
both entry points under the mutant:

    DISK order: duplicate-id:task | duplicate-id:component | duplicate-id:feature
    PURE order: duplicate-id:task | duplicate-id:feature | duplicate-id:component
    LAYERS AGREE? false

**Why the deep-equal pin does not catch it.** `files.test.ts:45` asserts
`expect(fromFiles).toEqual(fromDisk)` over the `broken-project` fixture,
whose issues are all task-layer (`lib/parser/test/fixtures/broken-project`
declares a good task, a broken-YAML task and a task missing `size`, with a
clean roadmap and no components). A parity assertion can only see the
layers it has issues from, and this one has one layer.

Pre-existing rather than introduced by T-076 — the disk side has been
unpinned for its whole life and the mutant would have survived at
`e4a5ae7` too. It surfaces now because T-076 built the first assertion
that the order is a contract at all, which makes the missing half
visible.

**What to take.** Either extend the parity fixture so it carries a
roadmap issue and a component issue as well as a task one — which makes
the single existing `toEqual` hold the whole contract and needs no new
body — or mirror `files.test.ts:192` on the disk side. The first is
strictly better: it fixes the parity pin's blindness rather than adding a
second place to remember. Note that the fixture is also read by
`files.test.ts`'s other parity bodies, so widening it moves those; check
each move rather than loosening any.
