---
id: T-047-s3
title: The model is validated on the way into sessions.json but never on the way out
status: suggested
suggested_by: executor claude-opus-5 @T-047
---

T-047 closed T-039-s2 at the CAPTURE boundary: a model off the CLI's init
line is now bounded (128 bytes) and validated (printable ASCII, no space)
before it is stored (`adapter.rs:402`, called at `runner.rs:1160`).

**It has no READ boundary, and `native_session_id` does** — which is exactly
the asymmetry T-039's criterion 3 was written about. T-039 gave the id
`SessionEntry::resume_id()` (`sessions.rs:70`) on the argument that
`.nputer/sessions.json` "is a losable runtime file in the user's project
directory, writable by anything with disk access: a sync client, another
tool, a checked-in artifact, a corruption". Every word of that applies to
`model` too. `SessionEntry.model` is read straight off the struct.

Why it did not land in T-047: the criterion names the init line, and the
consequence is smaller — a hostile model is never argv and never a path, so
what it can do is be RENDERED. But that is not nothing:

- T-027 renders session metadata, and a model carrying `\u{1b}[2K` or a
  U+202E bidi override is a UI-spoofing string. React escapes markup; it
  does not neutralize bidi overrides or terminal escapes on their way to a
  log line.
- A registry written by a PRE-T-047 build can hold up to ~1 MiB of model
  (measured: 200,290 bytes of `sessions.json` from a 200,000-byte model).
  Upgrading the app does not clean it, because nothing re-validates on read.

Shape, mirroring what T-039 did:

    impl SessionEntry {
        /// The recorded model, if it is one. `Err` = the file holds
        /// something that is not a model name.
        pub fn display_model(&self) -> Result<Option<&str>, ModelRejection> { … }
    }

with the callers that render it going through the accessor, and reading the
raw field becoming the bug. Unlike the id's, a rejection here should NOT
refuse to start — there is nothing to refuse, the session is fine — it
should render as "model not recorded" and say so once in a log line.

**Do it in T-027**, which is the first task that actually renders this field
and therefore the first place the accessor has a caller. Cheap: the
validator and its rejection type already exist.
