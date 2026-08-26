---
id: T-150-s1
title: Two MORE standing prohibitions live only in a dispatching session's memory — and the repository's own suite already contradicts one of them
status: suggested
suggested_by: executor claude-opus-5 @T-150
---

**T-148's checkpoint `92a9181` found that `pkill` and `git update-ref`
appear ZERO times in `docs/CONVENTIONS.md`** and concluded they "have
lived only in briefs, which means only in the dispatching session's
memory". **T-150's brief carries TWO MORE, and its own text asks the lane
to check them:**

- **"no real model call in any test for any reason"**
- **"no CLI spawn from a test"**

**NEITHER IS IN `docs/CONVENTIONS.md`, AND NEITHER IS IN `method/`.**
Derived at `f174d5c` from the repo root; the nearest hit is
`docs/ARCHITECTURE.md`'s C-02 line, *"prompts from method/roles/; never
call model APIs directly"*, which is an architecture statement about a
COMPONENT and not a testing prohibition. Re-derive rather than trust this
sentence — a grep is one second and this exact class of claim is what
T-148 got wrong in the other direction.

## THE SECOND ONE IS NOT MERELY UNWRITTEN — THE TREE CONTRADICTS IT

`tools/e2e/tests/brief.spec.ts` spawns the brief CLI
(`spawnSync(process.execPath, [CLI, …])`, twice), and
`tools/e2e/tests/boot-check-guard.spec.ts` spawns
`tauri-boot-check.mjs`. Both are green, both are deliberate, and one of
them is how the boot gate's own refusal path is proven.

**So "no CLI spawn from a test" is either a NEW rule, a rule with
exceptions nobody has written, or a rule the dispatcher means only for
NEW tests.** All three are legitimate; the point is that a session
reading the brief cannot tell which, and the repository says the
opposite. T-150's lane obeyed the brief for its own new spec (every body
imports the module) and reported the divergence rather than resolving
it — a lane may not rule on a standing discipline.

## Why it is worth a card

**A rule that lives only in a brief lives only in one memory, and it
survives exactly as long as the same author writes every brief.** That is
T-146's thesis and T-148's finding; this is the third and fourth
instance, found by the card whose own subject is a figure that lived only
in one memory.

## Disposal

`touches:` would be `[docs/CONVENTIONS.md]` at minimum. The model-call
prohibition probably belongs beside the AUDIT GATE POLICY or the E2E
LANE'S HONEST SCOPE bullet; the spawn one needs its exception written
with it, because two live spawns already stand. **Ruling which the rule
actually is belongs to @human or the architect, not to a lane.**
