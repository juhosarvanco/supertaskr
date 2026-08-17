---
title: A refused genesis-turn subscription is invisible on screen — the interview just never shows a turn
status: suggested
suggested_by: executor claude-opus-5 @T-027
---

**This is T-050's shape, one screen over, and it was introduced by
T-027 rather than inherited.**

`startInterviewSource()` (`app/src/genesis/interview-source.ts`) awaits
`startGenesisListener()`, which awaits `listen("genesis-turn")`. T-027
wraps that await in a `try`/`catch` — it has to, because an unhandled
rejection at the app's root is exactly what T-050 spent a whole task
removing from `startDocsWatcher` — and the catch does this:

    console.error("[nputer] the interview event subscription was refused", err);

**That is the whole of the user-visible response.** The screen renders
normally, the input is enabled, the explicit "Start the interview"
button is there and works — and then no turn ever appears, because the
channel the turns arrive on was never opened. `genesis_start` will
happily report `started { turn: 1 }`; the planner really will be
running, really will be writing into `docs/`, and the RIGHT half of the
split will even show the files landing. The left half stays empty
forever with no explanation.

**Why it is not worse than it looks, and why it is still worth fixing:**
nothing is lost (docs/ is the record, ADR-017), the lens keeps telling
the truth, and `genesis_cancel` still works. But "the conversation is
silently gone while the plan visibly assembles beside it" is a confusing
enough state that it deserves a sentence.

**The reason T-027 did not just fix it:** the honest fix wants a piece
of state that does not exist yet. `GenesisState` has no "the
subscription failed" field, and adding one means editing
`app/src/lib/agent-store.ts`, which is **C-14** and not in T-027's
`touches` (§7's fence). The two shapes available:

1. **C-14 gains a `listenerFailed: boolean`** (or reuses `lastOutcome`
   with a new typed variant), `startGenesisListener` sets it, and the
   chat renders the existing inline-notice treatment over it. Small, and
   it puts the fact where every consumer can see it — T-029's resume
   flow will want it too.
2. **The source module keeps its own flag** and exposes it through
   `InterviewUiState`. Zero C-14 diff, but it means the store and the
   UI disagree about whether the interview is live, which is the class
   of split-brain §1 spent its length arguing against.

Shape 1 is the better one, and it is squarely T-029's territory (that
task already owns restart resume, rehydration and the fresh-session
fallback — every other "the conversation is not where you left it"
state).

**Reproduction**, no new machinery needed: in
`app/test/interview-harness.test.ts`'s Tauri-runtime fixture, make the
`listen` mock reject. The console line appears; nothing on screen does.
