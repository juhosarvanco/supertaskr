# Real-CLI observation — one authenticated planner turn, 2026-08-19

**The first and so far only turn this project has ever run against a
real model.** Every other stream the app has seen is a scripted fixture
that lands in milliseconds. Recorded here because the succession rule
requires it and because the capture answers three questions no suite
can ever cover.

Protocol lines preserved verbatim at
`docs/research/captures/real-planner-turn-2026-08-19.jsonl` — 27 lines:
the `init`, the 12 `status`, the 10 `thinking_tokens`, both
`permission_denied`, the `rate_limit_event` and the `result`. The
streaming deltas and the turn's prose are omitted; they are content,
not protocol.

## Provenance

Driven directly against `/opt/homebrew/bin/claude` with the argv the
app itself assembles (`adapter.rs` / `kit.rs` / `runner.rs`
reproduced by hand), in a throwaway project outside this repo, with
`env_clear()` + the allowlist + `TERM=dumb` + a login-shell PATH,
prompt on stdin, own process group.

    -p --output-format stream-json --include-partial-messages --verbose
    --permission-mode acceptEdits
    --allowedTools Bash(git init:*) Bash(git add:*) Bash(git commit:*)
                   Bash(git status:*) Bash(mkdir:*) Bash(cp:*)
    --disallowedTools WebFetch WebSearch

CLI 2.1.226. Model reported as `claude-opus-5[1m]`. Exit 0, stderr
zero bytes, `is_error: false`, `stop_reason: "end_turn"`,
`num_turns: 32`, 385 lines over 74.9 s, $0.58.

**What this does NOT establish:** the runner's own parse / registry /
emit path was not re-exercised — this drove the CLI, not the app.
n=1, one model, one turn shape, no resume turn, no failing denial.

## 1. Stage 0 completes and the turn ends in one question

The planner scaffolded `docs/` from the templates, wrote `CLAUDE.md`
and `AGENTS.md`, seeded `.nputer/nputer.yaml`, ran `git init`, and
stamped `docs/STATE.md` with the literal string `planner.md` demands
(`In progress: genesis interview running — next stage: 1 (Q1)`).

It closed with **one question, not a wall** — Q1, problem-and-person,
asking for a concrete person at a concrete moment rather than a market.
Full text on the `result` line of the capture. Quality is @human's call.

## 2. The six-pattern allowlist bit twice, and neither bite is a
   pattern being too narrow

| # | shape | outcome |
|---|---|---|
| 3 | `KIT=… && mkdir … && cp …/*.md … && printf … && git init` | **DENIED** |
| 4 | `mkdir -p … && cp …/*.md docs/ && cp … && cp …` | **DENIED** |
| 14 | `git init -q && git status --short` | OK — compound, but both halves match |

The gate is **compound-command decomposition**: every sub-command must
be covered, and `printf`, a `KIT=` assignment and `find` are not.
Denial #14's success proves the mechanism. The agent recovered unaided
by splitting into single-verb commands, so the turn still succeeded.

**`cp <glob>` is structurally blocked, independent of the pattern** —
*"Glob patterns are not allowed in write operations. Please specify an
exact file path."* Stage 0's literal instruction is *copy
docs-templates/\*.md into docs/*, so the natural command can never be
granted by widening `Bash(cp:*)`. Eight separate `cp` calls were needed.

**The six patterns are not the whole grant surface.** `ls -la` and
`find … | head -100` both ran unprompted, and the confound is ruled
out — this machine's `~/.claude/settings.json` allows only
`Bash(git add|rm|mv|commit:*)`. The CLI itself permits a read-only
Bash class under `acceptEdits`. See `T-025-s4` for what this does to
the containment argument.

`Bash(git add:*)` and `Bash(git commit:*)` were never exercised —
stage 0 does not commit.

## 3. `permission_denials` — the runner's guess was right, and there
   is a second delivery channel

On the `result` line, entries are **objects carrying `tool_name`**,
plus `tool_use_id` and a full `tool_input`. `denial_names()` reads
`tool_name` first, so it is correct as written. Both denials are
present cumulatively on the single `result` line. This closes
`T-029-s5`.

**And a live in-band line the runner currently drops**:
`{"type":"system","subtype":"permission_denied", …}`, carrying
`tool_name`, `tool_use_id`, `decision_reason_type`, `message` and
sometimes `decision_reason` — but **never `error` or `error_status`**,
so `classify_line`'s `"system"` arm returns `Ignored`. The user sees
nothing at the moment of denial; the record survives only to the end
of the turn. Filed as its own card.

**`terminal_reason` on a completed turn reads `"completed"`** — not
the fixture's guessed `"refusal"`. This *vindicates* T-029-s7's narrow
guard (`result_is_error && !denials.is_empty()`): the wider
"`terminal_reason` outside the normal set" formulation would have
needed `"completed"` in that set, and this run — two denials with
`is_error: false` — is exactly the denial-then-recover turn that must
not be reported as a failure.

## 4. `api_error_status` on a healthy turn (T-069)

Rides the `result` line, present as JSON `null`. `as_status_u32` maps
`Value::Null` to `None`, so T-069's disclosure rests on real ground.

Full `result` key set: `api_error_status, duration_api_ms, duration_ms,
fast_mode_disabled_reason, fast_mode_state, is_error, modelUsage,
num_turns, permission_denials, result, session_id, stop_reason,
subtype, terminal_reason, time_to_request_ms, total_cost_usd, ttft_ms,
ttft_stream_ms, type, usage, uuid`.

## 5. The 150 ms coalescing window against real cadence

385 lines / 74.9 s. First line at **1272 ms** (`start_timeout` 30 s);
longest gap between any two lines **2210 ms** (`stall_timeout` 300 s).
Both bounds comfortable.

Of 177 `content_block_delta` events only **11 were `text_delta`** —
the other 166 were `input_json_delta`, correctly `Ignored`. Text-delta
gaps: median **530 ms**, p90 719, max 857. Only 4 of 11 fall under
150 ms, and three of those are the ~0.2 ms delta riding
`content_block_start`.

**The CLI already coalesces server-side** into 100–180 char chunks
~0.7 s apart. A 150 ms window turns 11 emits into ~7: it merges the
burst-start pairs and otherwise adds up to 150 ms of latency to every
visible chunk. Not harmful — the 250 ms bound holds — but it bought
little on this turn. Tool-heavy turn, n=1; a prose-heavy turn may
stream differently.

## 6. Line shapes seen for the first time

- **`system`/`init`** carries `permissionMode`, `apiKeySource:"none"`,
  `claude_code_version`, `cwd`, `session_id` (UUID) and `model`.
- **The model string is `claude-opus-5[1m]`** — with brackets. It
  passes the T-047 model gate (printable ASCII, no space) but a
  stricter character class would have refused it. The deliberate
  widening earned itself.
- **`rate_limit_event`** — a top-level type the runner silently
  ignores, carrying real actionable state: `status`, `rateLimitType`,
  `utilization`, `surpassedThreshold`, `resetsAt`. On this run the
  seven-day quota read 0.85 against a 0.75 threshold. Arguably a thing
  the app should surface rather than discard.
- **`system`/`status`** (12×, `{"status":"requesting"}`) and
  **`system`/`thinking_tokens`** (10×) — both correctly `Ignored`.
- No `api_retry`, no non-JSON line, **zero bytes on stderr** —
  consistent with the earlier smoke: this CLI reports in band.
