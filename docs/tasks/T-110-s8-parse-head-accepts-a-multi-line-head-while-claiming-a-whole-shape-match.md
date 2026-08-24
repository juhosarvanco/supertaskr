---
id: T-110-s8
title: parse_head accepts a multi-line HEAD and a trailing tab, while its own comment claims both shapes are matched whole
status: suggested
suggested_by: verifier claude-opus-5 @T-110-verify
---

`parse_head`'s doc comment says git writes one of two things and *"Both
are matched as WHOLE shapes; anything else is a typed defect rather than
a guess."* What it actually matches is the whole FILE with trailing `\n`
and `\r` stripped, which is not the same thing. Measured in the T-110
verification at `c2fc3c6`:

    "ref: refs/heads/task/T-1-x\nref: refs/heads/main\n"
      -> Ok(Branch("task/T-1-x\nref: refs/heads/main"))
    "ref: refs/heads/task/T-1-x\t"
      -> Ok(Branch("task/T-1-x\t"))
    "ref: refs/heads/../../etc/passwd"
      -> Ok(Branch("../../etc/passwd"))

The first is the one worth closing: a two-line `HEAD` yields a branch
name carrying an embedded newline and the second line glued onto it.
`worktree_path` has the same property from the other file — a `gitdir` of
`/tmp/aaa\nbbb/.git` comes back as `"/tmp/aaa\nbbb"`.

**No forged LANE is reachable through any of these**, and that is worth
stating plainly: `lane_task_id`'s slug class refuses `\n`, `\t` and `/`,
so every one lands as `WorktreeEntry::NotALane` with the string carried
in `branch`. So this is defence in depth rather than a live hole — the
module header already declines to validate git ref names on purpose, and
`.git/worktrees/*/HEAD` is written by git. It is filed because the
comment overstates what the code does, because the criterion this module
answers is about strings *"this project does not author"*, and because
F-04's product is a brief a human pastes into a shell, where one string
carrying a newline is two commands. The narrow fix is to take the FIRST
line rather than the whole file, and to refuse any control character in
the branch — one `Err(EntryDefect::HeadUnrecognised)`, with the comment
corrected either way.
`app/src-tauri/src/dispatch/lanes.rs`, fence `[app-dispatch]`.
