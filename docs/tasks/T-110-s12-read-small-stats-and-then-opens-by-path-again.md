---
id: T-110-s12
title: read_small stats the link and then opens by path again, so the symlink policy has a TOCTOU window
status: suggested
suggested_by: executor claude-opus-5 @T-110-pass3
---

T-110's third pass closed the symlink follow in
`app/src-tauri/src/dispatch/lanes.rs`'s `read_small` — `fs::metadata` →
`fs::symlink_metadata` — and pinned it at all four sites the policy
exists. **This is the residual that fix does not close, filed rather than
folded in**, because it is a different vector with a different
precondition and taking it would have annexed scope on a pass that was
explicitly told not to.

## The shape

    fn read_small(path: &Path, max: u64) -> Result<String, SmallRead> {
        let meta = fs::symlink_metadata(path)…?;   // stats the LINK
        if !meta.is_file() { … }
        if meta.len() > max { … }
        let bytes = fs::read(path)…?;              // OPENS BY PATH AGAIN
        …
    }

The stat and the open are two separate resolutions of the same path.
Between them, anything that can write into
`<repo>/.git/worktrees/<name>/` can replace the regular file with a
symlink, and `fs::read` follows it — so the property the pass just
established ("this reader does not chase a symlink") holds against a
static tree and not against a tree being edited underneath it.

## Why it is much weaker than the defect that was fixed, stated honestly

The closed defect needed only a repository handed over as an archive, a
synced folder or a template — a passive artefact, with the symlink
already sitting in it. This one needs **concurrent write access to the
bookkeeping directory while the read is in flight**, which is a
strictly stronger position: an attacker who has it can simply write the
`gitdir` contents they want directly, and does not need a race at all.
So the race buys an attacker nothing they did not already have, **unless
the file is one they cannot write but can replace by renaming its parent
directory entry** — the shape worth thinking about before ranking this.

It is also still bounded: nothing is written, the read is capped at
`MAX_METADATA_BYTES`, and the reader is not wired into anything yet.

## The fix, if it is taken

Open ONCE and stat the handle, rather than stat-then-open:

    use std::os::unix::fs::OpenOptionsExt;
    let f = fs::OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NOFOLLOW)
        .open(path)…;
    let meta = f.metadata()?;   // stats the OPEN HANDLE

`O_NOFOLLOW` makes the kernel refuse the symlink at open time, and
`f.metadata()` cannot describe a different file from the one the
subsequent read drains. **It is not a free change**: it is
platform-specific (the crate would need a Windows arm or a `cfg`), and
`libc` is not currently a dependency of this crate — the diff would
carry a manifest, which is a dependency-addition decision rather than an
executor's.

## What the next reader should decide

1. Whether the precondition above (concurrent write access) makes this
   worth a manifest change at all, or whether it should be recorded as
   accepted.
2. If taken, whether it belongs with `T-110-s7`'s hardening (the
   un-normalised, possibly relative `worktree_path`) as one card rather
   than two — both are "the reader trusts a path more than it should",
   and both were deliberately left out of the third pass.
