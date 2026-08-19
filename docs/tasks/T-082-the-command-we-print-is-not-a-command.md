---
id: T-082
title: The recovery command the app prints does not exist — `claude login` is parsed as a prompt
feature: F-03
milestone: 4
priority: 40
size: S
status: planned
blocked_by: []
touches: [app-shell, app-agent, tools/e2e]
builder:
verifier:
built_by:
verified_by:
review:
---

**T-029 exists to stop the app sending a user to `claude login` when
their login is fine. It never checked whether `claude login` is a thing
you can run.** It is not.

Verified against the shipped CLI 2.1.226 on 2026-08-19:

    $ claude --help
    Commands:
      auth      Manage authentication
      …
    $ claude auth --help
      login [options]   Sign in to your Anthropic account
      logout            Log out from your Anthropic account
      status [options]  Show authentication status

There is no `login` command. `claude [options] [command] [prompt]` parses
an unrecognised leading word as **the prompt** — `claude login --help`
prints the general help rather than erroring, which is the tell. So a
user whose credentials really have expired, following the instruction the
app itself renders, does not get a login flow. They get a session that
sends the word "login" to a model they cannot reach.

**That is a worse failure than a wrong error message**, and it is in the
one path a first-time user is most likely to hit: the app has correctly
diagnosed an expired login, has correctly decided to help, and hands over
a command that silently does something else.

THE STRING IS SHIPPED IN THE PRODUCT AND PINNED BY THREE TESTS —
`app/src/genesis/interview-model.ts:584` is the rendered value;
`app/test/interview-model.test.ts:725`,
`app/test/interview-resume-dom.test.tsx:214` and
`tools/e2e/tests/resume-fallback.spec.ts:68` all assert it exactly. The
pins are doing their job: they will go red, and that is the point.

**THE ONE DISTINCTION THIS CARD MUST NOT COLLAPSE.** Three of the
occurrences are not the app's advice — they are a *fixture* and its
commentary: `app/src-tauri/src/bin/fake_agent.rs:176` prints
`credentials expired, please run \`claude login\`` as a stand-in for the
CLI's own stderr, and `runner.rs:116` / `agent_runner.rs:1372,1677` /
`agent-store.ts:38` describe the harm in prose. **If the real CLI's own
expired-credentials message says `claude login`, the fixture is a
faithful transcription and MUST NOT be "corrected"** — a fixture that
prints something the CLI never printed is worse than a wrong command,
because it makes the suite lie about the world. The app's *own* advice is
a separate thing and is what this card fixes.

Provenance for the correction is `docs/research/real-cli-observation.md`;
the auth-message provenance is the earlier 2.1.226 smoke recorded in
STATE.md.

## Acceptance criteria

- THE command the app renders as the recovery action for an expired login
  SHALL be a command the installed CLI actually accepts, and the card
  SHALL record how that was checked rather than asserting it.
- **THE FIXTURE'S TEXT SHALL BE DECIDED ON PROVENANCE, NOT ON
  CONSISTENCY.** The executor SHALL determine whether
  `fake_agent.rs:176`'s message is transcribed from a real CLI stderr or
  was composed, and SHALL state which. IF transcribed THEN it stays
  verbatim and the divergence from the app's advice SHALL be commented at
  the fixture with the reason. IF composed THEN it SHALL be marked as
  composed, because an untranscribed fixture standing in for real CLI
  output is exactly the defect T-029-s5 was filed about.
- THE three assertions that pin the old string SHALL be **corrected, never
  loosened** — no `toContain`, no regex that would pass for both the old
  and new value. A pin that survives the change unchanged is a pin that
  was not testing this.
- **THE ADVICE SHALL NOT BE ASSEMBLED FROM WHAT THE CLI SAID.** If the app
  relays a command out of the CLI's own error text it inherits whatever
  that text contains, including this defect. The rendered action SHALL be
  the app's own, and a pin SHALL prove it by driving a fixture whose
  stderr names a different command entirely and requiring the app's value
  to be unmoved.
- IF the app renders any other executable command anywhere in a failure
  path THEN this card SHALL enumerate them and state, for each, whether it
  was checked against the CLI — the class of defect is "a command nobody
  ran", and fixing one instance while leaving its siblings unexamined
  leaves the class open.
- THE prose occurrences in `runner.rs`, `agent_runner.rs` and
  `agent-store.ts` SHALL be updated only where they describe what the app
  now does; where they quote the historical harm they SHALL stay, since
  the harm was real and the record of it is the reason the guard exists.
- THE ROADMAP's two occurrences (`:337`, `:424`) SHALL be reconciled — the
  roadmap promises this exact behaviour and currently promises the broken
  form.

Verification: headless — `npm test` and `npm run build` from app/,
`cargo test` from app/src-tauri, `npx playwright test` for the e2e pin,
the boot gate if `app/src-tauri/**` moves. Each corrected assertion
poisoned back to the old value and shown RED. **No real model call** —
the CLI's command surface is read from `--help`, which spawns no turn.
@human: none; the correct command is checkable.

## Implementation notes

## Verdicts
