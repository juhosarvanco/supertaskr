---
id: T-107-s4
title: A card fenced to app-interview alone cannot pin anything it builds, and T-107's fifth criterion is the first to notice
status: suggested
suggested_by: executor claude-opus-5 @T-107
---

**THIS IS A DISPATCH DEFECT, NOT A BUILD DEFECT, AND IT IS FILED WITH THE
BODY IT COULD NOT SHIP — VERIFIED GREEN AND VERIFIED TO RED.** T-107's
criterion 5 asks for *"A BODY [that] SHALL DRIVE THE `unsupportedVersion`
OUTCOME AND ASSERT THE NEXT STEP IS PRESENT AND REACHABLE"*. There is
nowhere inside `[app-interview]` for that body to live.

## Derived, not assumed

| what | where it lives | slug | free? |
|---|---|---|---|
| the code T-107 changed | `app/src/genesis/**` | `app-interview` (C-13) | **T-107's own fence** |
| every app test body | `app/test/**` | `app-shell` (C-05) | held by T-033 at that dispatch |
| the runner that collects them | `app/vitest.config.ts` | `app-shell` (C-05) | same |
| the E2E mirror of the outcome | `tools/e2e/tests/shell-harness.ts` | `tools/e2e` | held by T-091 |

`app/vitest.config.ts` reads `include: ["test/**/*.test.{ts,tsx}"]`, so a
colocated body under `app/src/genesis/` is **not collected by `npm test`
at all** — and it would still be compiled into the app program by
`app/tsconfig.json`'s `"include": ["src", …]`, which is a test file
shipped in source that nothing runs. That is worse than no pin.

**So `[app-interview]` is a fence in which no assertion can be added.**
C-13 declares one path glob and it is source-only; every one of this
project's four walks that could hold a genesis assertion sits in another
component. T-107 is the first card to hit it because it is the first
`[app-interview]`-only card whose criteria demand a NEW body — T-101
changed `app/src/genesis/**` too, but its pins landed with a fence that
carried `app-shell`.

## Two arms

1. **DISPATCH ARM — pair the slug.** A card fenced to `app-interview`
   that adds behaviour is dispatched as `[app-interview, app-shell]`, the
   way T-101 was. Costs nothing but a dispatcher's attention, and
   `app-shell` is a wide fence to hold for one test file.
2. **REGISTRY ARM — let the pane own its own tests.** C-13's `paths:`
   gains `app/test/interview-*.test.tsx` (five files at this filing), so
   the component that owns the behaviour owns the pin. **DECLARING A
   COMPONENT PATH MOVES THREE LIVE-REGISTRY FIXTURES** (CONVENTIONS'
   gotcha, T-024-s5), so this is a real card and not a one-line edit —
   and it collides with `T-110-s9`, which asks the neighbouring question
   about `app/src-tauri/tests/**`. Read them together.

**Arm 1 is the cheap right answer today; arm 2 is the one that stops the
question recurring.**

## The body, verified in `drill-T-107` at `458237a` and ready to paste

It goes in `app/test/interview-chat-dom.test.tsx`, inside the existing
`describe("no CLI is a route, never a dead end (criterion 6)")`, directly
after the `cliNotFound` body. It is **deliberately anti-brittle** — it
asserts the next step is PRESENT and REACHABLE, never the sentence, which
is prose and will be reworded — and it asserts the absence of a command
as a CLASS over install verbs rather than against one string the wording
could dodge.

```tsx
  it("an unsupported version is a route too, and the next step is present and reachable (T-107)", async () => {
    ipc.outcomes.set("genesis_start", {
      kind: "unsupportedVersion",
      found: "1.4.9 (Claude Code)",
    });
    ipc.outcomes.set("genesis_kickoff", {
      kind: "ready",
      prompt: "You are the planner. KIT ROOT: …",
      projectDir: PROJECT,
      kitRoot: `${PROJECT}/.nputer/genesis/kit`,
      methodVersion: "0.1.5",
      resuming: false,
      record: null,
    });
    await withStatus();
    render();
    await flush(() => Promise.resolve());

    // Its own card rather than the bare generic notice, and the
    // DIAGNOSIS is still the typed one it always was.
    const card = q("[data-testid=interview-cli-outdated]")!;
    expect(card).not.toBeNull();
    expect(q("[data-testid=interview-cli-found]")?.textContent).toBe("1.4.9 (Claude Code)");
    expect(q("[data-testid=interview-outdated-project]")?.textContent).toBe(PROJECT);

    // NO INSTALL-MANAGER COMMAND (criterion 2), asserted as a CLASS over
    // the verbs rather than against one string the wording could dodge.
    // Read BEFORE the click, because the kickoff block is a sibling.
    const shown = card.textContent ?? "";
    for (const verb of ["claude install", "claude update", "claude upgrade", "brew ", "npm i", "apt ", "pnpm ", "yarn "]) {
      expect(shown, `the notice must not print \`${verb}\``).not.toContain(verb);
    }
    // …nor the floor transcribed out of the Rust adapter (criterion 3).
    expect(shown).not.toContain("claude 2");
    expect(shown).not.toContain("version 2");

    // THE NEXT STEP IS PRESENT AND REACHABLE — the criterion, and
    // deliberately NOT the sentence, which is prose and will be reworded.
    const route = card.querySelector<HTMLElement>("[data-testid=interview-cli-hand-driven]");
    expect(route, "the notice offers the one mode that needs no CLI").not.toBeNull();
    expect(route!.hasAttribute("disabled")).toBe(false);
    // REACHABLE means it goes somewhere: the assembled prompt appears.
    await click("[data-testid=interview-cli-hand-driven]");
    expect(q("[data-testid=interview-hand-driven-block]")).not.toBeNull();
    expect(q("[data-testid=interview-kickoff]")?.textContent).toContain("You are the planner");
  });
```

**Every figure below was measured in a detached `drill-T-107` worktree at
`458237a`, outside the repository, with its own installs and its own
`npm run build`; the worktree was removed afterwards.**

| run | result | exit |
|---|---|---|
| the file with the body, unpoisoned | 46 passed (45 before) | **0** |
| the whole app suite with the body | **959 passed / 46 files** (958 without) | **0** |
| poison: `noticeRoutesToHandDriven`'s `unsupportedVersion` arm → `false` | **1 failed / 45**, on *"the notice offers the one mode that needs no CLI: expected null not to be null"* | **1** |
| poison: `OutcomeNotice`'s `outcome.kind === "unsupportedVersion"` branch → a kind that never arrives | **1 failed / 45** | **1** |

Both poisons mutated the CODE UNDER TEST and never the assertion or a
literal the two share; both mutations were read back with `git diff`
before their run; both sources restored with matching sha256 against
`git show HEAD:<path>`.

## Until it lands, the property is held INDIRECTLY and that is stated rather than implied

T-107 put the ruling in one exported function that the renderer READS, so
the affordance is not a hard-coded branch. **Flipping the `cliNotFound`
arm of `noticeRoutesToHandDriven` to `false` reds SEVEN existing bodies
across two files at exit 1** (`interview-chat-dom.test.tsx` and
`interview-resume-dom.test.tsx`, measured in the same drill). So the
function is genuinely load-bearing and genuinely pinned — by the sibling
arm. **What is unpinned is the `unsupportedVersion` arm's own answer**,
and only that. Deleting the arm is a compile error (the `never` guard);
flipping it from `true` to `false` is the one mutation nothing on this
tree catches.
