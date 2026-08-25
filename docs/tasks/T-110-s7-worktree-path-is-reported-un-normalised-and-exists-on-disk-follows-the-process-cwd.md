---
id: T-110-s7
title: worktree_path is reported un-normalised, may be relative, and exists_on_disk then answers from the process cwd
status: suggested
suggested_by: verifier claude-opus-5 @T-110-verify
---

Measured in the T-110 verification, against hostile `gitdir` bytes in a
temp directory — no repository this project wrote. `read_entry` takes
`gitdir`'s contents, trims trailing newlines, climbs one `parent()`, and
reports the result verbatim. It never canonicalizes, never requires an
absolute path, and never asks whether the result is inside anything:

    gitdir = <fixture>/repo/../CANARY/../../../../../../etc/.git
      -> Lane { worktree_path: "<fixture>/repo/../CANARY/../../../../../../etc",
                exists_on_disk: true }
    gitdir = /.git            -> Lane { worktree_path: "/", exists_on_disk: true }
    gitdir = ../../../../CANARY/.git
      -> Lane { worktree_path: "../../../../CANARY", exists_on_disk: false }
    gitdir = somewhere/.git   -> exists_on_disk resolved against the PROCESS cwd
                                 (measured with cwd = app/src-tauri: false)

**Nothing escapes here and this is not a criterion failure** — the reader
writes nothing (a canary beside the fixture was untouched), reads no file
at the named path, and a symlinked entry directory is already refused
`NotADirectory` by `symlink_metadata`. What it is: a directory-existence
oracle over an attacker-named path, plus an un-normalised and possibly
RELATIVE string handed to the board as a worktree location. **The
relative arm is the shape T-060 closed one door down** — ARCHITECTURE
records `which_in`'s `dir.join(binary)` resolving a relative PATH element
*"against whatever CWD the app was launched with"*, and the remedy there
was `validate_resolved_binary`: absolute, no `.`/`..` component. The same
standard applied to a `stat` rather than an `execve` would make
`exists_on_disk` independent of how the app was started, which it is not
today. It matters more the moment T-112 assembles a brief: F-04's product
is commands a human pastes, and `<repo>/../../../../..` is not a lane
path anyone should be handed. `app/src-tauri/src/dispatch/lanes.rs`,
fence `[app-dispatch]`.
