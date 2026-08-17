---
id: T-047-s2
title: The CLI flag/subcommand table is a snapshot of one version and will drift
status: parked
suggested_by: executor claude-opus-5 @T-047
---

T-047's widened argv gate carries two `const` tables read first-hand out of
`claude 2.1.226`'s `--help`: `KNOWN_CLI_FLAGS` (`adapter.rs:431`, every long
and short option) and `KNOWN_CLI_SUBCOMMANDS` (`adapter.rs:513`). They are
data about ANOTHER PROGRAM'S parser, pinned at a moment in time, and that
program updates itself (`claude update`).

**How much drift actually costs, stated honestly, because it is less than it
first looks:** `classify_arg_shape` refuses `LeadingDash` for anything
starting with `-` whether the table knows it or not, so a CLI that grows
`--new-dangerous-flag` is still covered — the tables only sharpen the
NAMING of an already-refused element. The real exposure is one-sided:

- **SUBCOMMANDS.** They carry no dash, so the table is the ONLY thing that
  catches them, and `validate_session_id` accepts every current one
  (`doctor`, `install`, `update`, `mcp`, `setup-token` are all pure
  `[A-Za-z0-9-]`). A CLI that adds `claude deploy` adds a shape this gate
  silently stops knowing about.
- A flag whose name stops existing costs nothing (a stale row refuses a
  string nobody sends).

Also worth knowing: the tables make the gate STRICTER than the criterion
required, so they carry a small false-positive surface in the other
direction — a CLI whose session ids ever looked like `install` would be
refused. That is vanishingly unlikely for a UUID-shaped id and the refusal
is typed and named, but it is the cost side of the same coin.

Options, cheapest first:

1. **Version-stamp and re-read on upgrade.** The resolver already records
   the `--version` line; a comment is not enough, but a test that FAILS when
   the locally installed CLI's major/minor differs from the stamped one
   would put the re-read on someone's desk exactly when it matters. Needs an
   env gate so CI without a `claude` install stays green.
2. **Scrape `--help` at resolve time** and union it into the table. Turns a
   compile-time constant into runtime data from a program we are trying to
   be careful about — probably the wrong trade, recorded so it is not
   re-proposed silently.
3. **Refuse the whole "bare word that is not obviously an id" class**
   instead of enumerating subcommands — e.g. require substituted values to
   match a positive shape rather than to miss a denylist. This is the
   structurally right answer and it is what `validate_session_id` already
   does for the one value that exists today; it only becomes work when a
   second substituted slot appears.

Do it whenever a second substituted slot lands (F-04 assembles argv from
worktree paths, branch names, task ids and `model@session` strings — all
file-borne), or the first time someone notices the tables are a version
behind.

Triage 2026-08-17 (architect): PARKED — the suggestion's own trigger
has not fired. `validate_session_id` is still the only substituted
value, so the second slot F-04 will bring does not exist yet. The
honest exposure is one-sided and small, and this file states it more
carefully than a triage could: `classify_arg_shape` refuses anything
leading with a dash whether the table knows it or not, so a new
dangerous FLAG is still covered and only SUBCOMMANDS are table-only.

Two notes for whoever unparks. Option 3 (require substituted values to
match a positive shape rather than to miss a denylist) is the
structurally right answer and is what `validate_session_id` already
does for the one value that exists — prefer it. Option 2 (scrape
`--help` at resolve time) is recorded here as the WRONG trade
specifically so it is not re-proposed silently; do not let it come
back as a fresh idea. Unpark with the second substituted slot, which
is F-04's argv assembly. **The resolver is being reshaped by T-060
meanwhile — if that card is open and this is cheap while it is, take
it there rather than waiting.**
