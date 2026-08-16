---
id: T-025-s6
title: The captured native session id rides into argv unvalidated — and `--resume [value]` takes an OPTIONAL argument
status: suggested
suggested_by: verifier claude-opus-5 @T-025
---

**Close this before T-029 makes `.nputer/sessions.json` a spawn input.**

§2's bypass pin is sound for what it covers: it iterates the static
adapter table (binary + spawn argv + resume argv with a UUID in the
slot + version argv) and is red on either CLI spelling or the
`bypassPermissions` mode string. The verifier planted all three in
`CLAUDE_V1.spawn_args` one at a time and got the named failure each
time; reverted clean. It also survives the obvious dodges — a
`--permission-mode=bypassPermissions` single element is caught, and the
search is case-insensitive.

**The one value in the spawned argv that the pin never sees is the
substituted session id.** `AgentAdapter::argv(Some(id))` puts `id`
verbatim where `SESSION_ID_SLOT` sat, with no validation anywhere
between capture and spawn. Measured:

    injected id "--dangerously-skip-permissions"
      -> argv tail ["WebSearch", "--resume", "--dangerously-skip-permissions"]
    injected id "--permission-mode=bypassPermissions"
      -> argv tail ["WebSearch", "--resume", "--permission-mode=bypassPermissions"]

…while `no_adapter_argv_can_ever_bypass_permissions` stays green,
because it only ever substitutes a UUID.

**Why the shape of `--resume` matters.** From `claude --help` on
2.1.226:

    -r, --resume [value]   Resume a conversation by session ID, or
                           open interactive picker with optional search term

Square brackets: the argument is OPTIONAL. Commander does not consume a
following `-`-prefixed token as an optional option's value, so
`… --resume --dangerously-skip-permissions` most likely parses as
`--resume` with no value **plus a standalone bypass flag** — turning a
six-pattern Bash allowlist into unrestricted tool use for that turn.
(The existing pin `a_hostile_session_id_stays_one_inert_argv_element`
proves the id stays ONE element; it does not prove the element cannot
BE a flag.)

**Reachability today: requires a substituted binary, so effectively
nil.** The id comes only from the `system`/`init` line the CLI itself
emits — a field the model cannot author — and `send_turn` resumes from
in-memory state, never from the registry file. An attacker who can
author that line already runs code as the user.

**Reachability at T-029: a file.** Restart-resume reads
`native_session_id` out of `.nputer/sessions.json`, which lives in the
user's project directory and can be written by anything with disk
access — a sync client, another tool, a checked-in artifact. At that
point this becomes a bypass-flag injection reachable from a file, which
is a materially different threat model. `start_genesis` already reads
that field today (for `resumeAvailable`); it just does not spawn with
it yet.

**The fix is one line, and it belongs in the adapter next to the pin:**
reject or reshape any captured id that is not `^[A-Za-z0-9_.-]{1,128}$`
and does not start with `-` (a typed `MalformedStream` is the natural
failure), or pass `--resume=<id>` as a single argv element so the value
is unambiguous whatever it contains. Then extend
`no_adapter_argv_can_ever_bypass_permissions` to substitute the three
forbidden strings into the slot, so the pin covers the substitution
path it currently steps over.
