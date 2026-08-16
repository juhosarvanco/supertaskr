---
id: T-047
title: What the runner trusts from disk — the cached path, the cached PATH, the pin's blind tail
feature: F-03
milestone: 3
priority: 8
size: M
status: building
blocked_by: []
touches: [app-agent]
builder: claude-opus-5
verifier:
built_by:
verified_by:
review:
---

Absorbs: T-039-s1, T-039-s2, T-039-s4. Triage 2026-08-16 (architect,
straight from T-039's verdict): T-039 closed one unvalidated
file→exec path and its verifier found three more in the same
component, two of them live in shipped code today. One task, because
they are one question — what does the runner believe without checking?

**s1, the live one, ruled by the T-039 verifier as backlog rather
than a gate — but with a real argument for priority.** `read_cache`
validates nothing; `resolve_cli` gates only on "is an executable
file"; `probe_version` then runs `Command::new(path)` — so a poisoned
`agent-paths.json` executes its binary AT RESOLVE TIME, before any
turn, and `resolve_cli` runs on both `start_genesis` and
`send_turn`, so the file is read live every time. The cached
`login_path` reaches the child's `PATH` with NO gate at all. The
honest counterweight, recorded so nobody over-reads this: the
precondition is write access to the user's own config dir, and
anything with that also has `~/.zshrc` — an equivalent-privilege
persistence surface, not a boundary crossing. What lifts it above
ordinary backlog is the composition: nputer ADVERTISES a six-pattern
Bash allowlist as containment, T-025-s4 (parked) records that those
patterns match command strings and carry no path scope, and an
ungated `login_path` decides which `git` and which `cp` they resolve
to. The verifier's recorded preference is the order below.

**s4, the pin's blind tail.** `check_no_data_borne_flag` zips two
slices, so ANY assembled tail longer than the template is never
inspected — a template of 2 with a flag at index 2 returns `Ok(())`.
The TEST copy of the rule carries the `assert_eq!(template.len(),
assembled.len())` the production function lacks: two copies of one
rule that disagree. Unreachable today, and exactly the shape of the
bug T-039 just closed.

Verified despite the size: every criterion here is a trust boundary.
Executor + adversarial verifier.

## Acceptance criteria
- THE cached login `PATH` SHALL stop being trusted as stored: either
  it is not cached at all (re-probed when needed) or every element is
  validated absolute and existing before it reaches the child's
  environment. Take the not-cached arm first unless the re-probe cost
  is measured and recorded as unacceptable — it is both the
  completely ungated half and the cheap one (T-039-s1).
- THE cached binary path SHALL be validated before `Command::new`
  and before `probe_version`: absolute, no `..` component, and the
  file check kept — so the resolve-time execution of an
  attacker-chosen binary requires beating the same rules a fresh
  probe would apply. IF validation fails THEN the cache entry SHALL
  be discarded and a fresh login-shell probe run, surfacing
  `cliNotFound` if that also fails — never a silent fallback to the
  poisoned value (T-039-s1).
- THE `is_executable_file` helper SHALL NOT return true by default
  on non-unix (`cfg(not(unix))` currently does), so a future Windows
  lane inherits a refusal rather than a hole — recorded by the T-039
  verifier as harmless today and deliberately unfiled (T-039-s1).
- THE `model` string captured from the init line SHALL be validated
  and bounded like the session id is — it is written to
  `.nputer/sessions.json`, rendered, and today accepted unbounded
  behind only the 1 MiB line cap. Reuse the session-id validator's
  shape rather than inventing a second rule if the character class
  fits; if it does not, say why in the header beside it (T-039-s2).
- THE `check_no_data_borne_flag` production function SHALL inspect
  the WHOLE assembled argv, not the zipped prefix: an assembled
  vector longer than its template SHALL be a refusal in production,
  not only in the test copy — and the test copy's length assertion
  SHALL be derived from the production rule rather than restated, so
  the two cannot drift apart again (T-039-s4).
- THE data-borne flag check SHALL be widened past the leading-dash
  class to the shapes the CLI actually treats specially — at minimum
  a value that is exactly a known flag name, and `--flag=value` forms
  — with each shape pinned by a plant-and-revert drill. The T-039
  verifier's own probe (`--settings=/tmp/evil.json`, which loads
  arbitrary settings and it judged arguably worse than the measured
  injection) SHALL be one of them (T-039-s4).
- THE existing behavior SHALL be otherwise unchanged: the
  spawn/resume round trip, capture, transcript, kill semantics, typed
  failures and T-039's own gate all keep their tests green; no new
  grant, dependency, command, or IPC variant.

Verification: headless — cargo tests against the fake CLI, including
a poisoned `agent-paths.json` proving no binary executes at resolve
time, and the s4 blind-tail case as a failing→passing pin. No real
model calls. @human: none.

## Implementation notes

## Verdicts
