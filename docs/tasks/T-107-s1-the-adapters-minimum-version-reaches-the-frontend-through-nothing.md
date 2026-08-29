---
id: T-107-s1
title: The adapter's minimum version reaches the frontend through nothing, so the notice can refuse to transcribe it and cannot name it either
status: parked
suggested_by: executor claude-opus-5 @T-107
---

**T-107's criterion 3 says `CLAUDE_V1.min_major` is the authority and a
notice hard-coding "2" is a second implementation (T-057). It is right,
and the honest consequence is that the notice can currently name NOTHING
— because the authority reaches this side through no channel at all.**

Derived at `c4c15c8`, from both ends:

- `app/src-tauri/src/agent/adapter.rs` — `AgentAdapter::min_major`, and
  `CLAUDE_V1.min_major = 2`. Read by `runner.rs`'s `finish`, which
  compares it against `parse_major(<the --version line>)` and returns
  `ResolveError::Unsupported { found }` on a miss.
- `StartOutcome::UnsupportedVersion { found: String }` in
  `app/src-tauri/src/agent/mod.rs` carries **the version line and nothing
  else** — no floor, no resolved path, no manager, no channel.
- Frontend side: `grep -rn "minMajor\|min_major" app/src/` returns
  **zero** rows outside unrelated CSS-ish `min-` identifiers, and
  `GenesisStatusPayload` carries `cliVersion` and no floor.

**SO T-107 SHIPPED THE ONLY HONEST SENTENCE AVAILABLE** — "older than
this app can drive" — which is exactly what this side can derive from
the type, and it deliberately does not say "2". **THE CARD'S OWN
SUGGESTED SHAPE-2 WORDING CANNOT BE TAKEN AS WRITTEN**: it reads *"nputer
needs claude 2 or newer; update it however you installed it"*, and that
first clause is precisely the transcription its own criterion 3 forbids.
That contradiction is recorded on the card's implementation notes and is
the reason this finding exists rather than a wording preference.

## The fix, and it is small

Add the floor to the payload where the refusal is already produced:

    UnsupportedVersion { found: String, min_major: u32 }

`mod.rs` has three construction sites (all `return
StartOutcome::UnsupportedVersion { found }` on the `ResolveError::
Unsupported` arm of `resolve_cli`), and each already has `adapter` in
scope — `let adapter = planner_adapter();` sits directly above every one
of them — so the value is one field, not a plumbing exercise. The mirror
in `app/src/lib/agent-store.ts` gains `minMajor: number` (serde is
`rename_all_fields = "camelCase"` on that enum, so the wire name is
free), and `tools/e2e/tests/shell-harness.ts` carries the same mirror.

Then the notice can say the floor from its authority, and a future
adapter with a different floor moves the sentence without anybody
editing it.

## Why T-107 did not build it

`app/src-tauri/**` is C-14 `app-agent`, outside T-107's `[app-interview]`
fence and held by a live lane (T-102) at that dispatch. The mirror in
`agent-store.ts` is C-05 `app-shell`, also outside it, and the e2e mirror
is `[tools/e2e]`, held by T-091. **Three fences for one field**, which is
worth stating because it is the reason a one-word improvement to a
sentence is a card rather than an edit.

## The one thing to decide first

**Whether the notice should name a number at all.** T-107 argues in the
renderer that it should not need to: the user's actionable instruction is
"update to the current release", which is right under any floor, and a
major-version integer on a user-facing screen is a fact about nputer's
internals rather than about the user's machine. If that reading wins,
this finding is closed by ruling rather than by code — and the ruling
should be written beside `noticeRoutesToHandDriven` in
`app/src/genesis/interview-model.ts`, which is where the refusal to
transcribe is already recorded.

Amnesty triage 2026-08-29 (triage seat): PARKED — TRIAGE TAKES THE RULING THE CARD ASKED FOR: the notice names no number. T-107's shipped sentence — "older than this app can drive" — is the honest one, criterion 3 forbids the transcription, and a major-version integer on a user-facing screen is a fact about nputer's internals rather than about the user's machine. The plumbing this card designs (min_major on the payload, one field at three construction sites) is correct and is not owed until the ruling changes. RESURFACES: the arrival of a SECOND adapter with a different min_major, at which point the floor must reach the frontend from its authority rather than from a sentence; or the next app-agent dispatch, if the ruling above is to be written down beside noticeRoutesToHandDriven where the refusal to transcribe already lives.
