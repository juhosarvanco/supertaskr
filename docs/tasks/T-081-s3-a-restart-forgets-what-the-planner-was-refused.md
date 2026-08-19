---
id: T-081-s3
title: A restart forgets what the planner was refused
status: suggested
suggested_by: executor claude-opus-5 @T-081
---

`.nputer/genesis/transcript.jsonl` banks one `TranscriptLine` per
half-turn — `turn`, `role`, `text`, `atMs`, `machine` — and nothing else.
`rehydrate` in `app/src/genesis/interview-model.ts` therefore rebuilds a
past turn with `activity: []` and, since T-081, `denials: []`. Both are
honest: the file genuinely does not hold either fact.

So a denial is live-only. Close the app mid-interview, reopen it, and the
turn that was refused two `Bash` invocations shows no sign of it — while
the DOCS the planner did or did not write are still there, banked, on
disk. The two halves of the same interview survive a restart with
different fidelity.

**Whether that matters is a judgement, and the judgement is not
obvious.** Arguments for leaving it:

- The transcript is LOSABLE BY CHARTER (T-029). Anything added to it is
  another thing a corrupted file can lose, and the chat already degrades
  to banked-progress from `docs/` when it does.
- `activity` has the same gap and nobody has minded. A tool label is
  ephemeral furniture.

Arguments for closing it:

- **A denial is not furniture.** It is the reason a stage took forty
  seconds longer, and it is evidence about the ADAPTER's allowlist rather
  than about one turn. `docs/research/real-cli-observation.md` §2 exists
  because a human read denials off a live stream; a user who restarts
  cannot.
- It is the only fact in the turn that says something about the app's own
  configuration rather than about the model's answer.

The cheap version is one optional field on `TranscriptLine`, written by
the runner when it banks the planner half, read back by `rehydrate`. The
cost is a wire-format addition to a file older builds also write, so it
must be optional and every read must tolerate its absence — the same
discipline `machine?: boolean` already carries and for the same reason.

Filed rather than built: it needs both `app-agent` and `app-interview`,
and T-081's fence is the first alone.
