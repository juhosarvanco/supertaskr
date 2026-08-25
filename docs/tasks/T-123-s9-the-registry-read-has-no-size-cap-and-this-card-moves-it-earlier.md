---
id: T-123-s9
title: The session registry is read with no size cap, and T-123 moves that read to the moment a folder is picked
status: suggested
suggested_by: verifier claude-opus-5 @T-123-verify2
---

**THE CAP DISCIPLINE HAS A HOLE AT THE OUTERMOST LAYER.** This project
bounds everything it reads off a stream or a file — `MAX_LINE_BYTES`,
`TRANSCRIPT_TEXT_CAP` (256 KiB), `MODEL_MAX_LEN` (128),
`SESSION_ID_MAX_LEN`, the docs collector's `MAX_FILE_BYTES` (1 MiB).
`sessions::load` (app/src-tauri/src/agent/sessions.rs) has none:

    let Ok(raw) = fs::read_to_string(&path) else { … };

The whole of `.nputer/sessions.json` is pulled into memory before
`serde_json` sees a byte, and the per-FIELD boundaries T-039 and T-047
built (`resume_id`, `display_model`) all sit downstream of that read.
Those boundaries bound what a field may CONTAIN; nothing bounds what the
FILE may WEIGH. Measured through the real pick at `338a7e2`: a registry
carrying a 300 000-byte `model` routes correctly and the model is
dropped at the display boundary with its log line — the read itself is
never the thing that refuses.

**T-123 DOES NOT CREATE THIS AND IT DOES MOVE IT.** Before this card
`apply_genesis_folder` never opened the registry; a folder holding a
plan was routed to the ordinary open with `.nputer/` untouched. Now
`crate::agent::sessions::genesis_reachability(&canon)` runs
UNCONDITIONALLY on every genesis pick, before the routing decision, so
the read happens for folders that then route AWAY from genesis. The
class of readable input is unchanged — it is still exactly "a folder the
user picked through the genesis door" — which is why this is a
suggestion and not a rejection; what changes is that the read is no
longer downstream of the user having chosen to run an interview there.

**THE SECOND-ORDER SHAPE IS WORSE THAN THE FIRST.** `read_to_string`
follows symlinks. A repository can ship `.nputer/sessions.json` as a
symlink; git cannot ship a FIFO, but it can ship a link to one, and a
read of a FIFO BLOCKS. `apply_genesis_folder` runs on the pick's own
call path, so a blocking read there is a hung pick rather than a slow
one. `probe_plan` two lines above deliberately uses
`fs::symlink_metadata` for exactly this family of reasons; the registry
read does not.

**THE FIX IS ONE `metadata` CALL.** Stat first, refuse above a stated
cap (the registry's honest working size is hundreds of bytes; the
transcript's 256 KiB cap is a generous sibling), and open with
`symlink_metadata`-checked `is_file()` so a link to a pipe or a device
is refused rather than read. A refusal there costs a resume offer and
nothing else — the file is losable by charter, and `load` already has a
"start a fresh registry" path to fall into. Fence `[app-agent]`.
