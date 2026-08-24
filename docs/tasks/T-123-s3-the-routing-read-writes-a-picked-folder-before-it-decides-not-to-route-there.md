---
id: T-123-s3
title: The routing read WRITES — picking a planned folder with an unparseable registry renames the user's file before the router decides not to route there
status: suggested
suggested_by: verifier claude-opus-5 @T-123-verify
---

Not a failure against any T-123 criterion, and not a blocker: the routing
ANSWER is correct in every case below. This is about a side effect the
routing question acquired on the way to answering.

**WHAT CHANGED.** Before T-123, `apply_genesis_folder`'s decision for a
folder holding a plan was a pure stat sweep — `probe_plan`, whose own
header promises it never reads file contents and lists no names, "which
is what makes it safe to point at a folder a user just chose". The
registry was never opened for such a folder. T-123 adds
`sessions::has_genesis_session(&canon)`, which is `genesis_record` ->
`sessions::load`, and `load` (`app/src-tauri/src/agent/sessions.rs:149`)
does this when the file does not parse:

```rust
let aside = path.with_extension("json.corrupt");
match fs::rename(&path, &aside) { ... }
```

So the front-door pick can now RENAME a file inside a folder the user
merely opened.

**MEASURED**, in a detached worktree at `14670e4`, through the real
`apply_genesis_pick` with a stage-0 tree (template `docs/ROADMAP.md`,
empty `docs/tasks/`) whose `.nputer/sessions.json` was the six bytes
`{ this is not json at all `:

```
original_still_there=false  aside_created=true  outcome_kind=Picked
```

The routing verdict (`Picked`, the ordinary open) is RIGHT — a registry
that does not parse registers no session, so the no-overwrite guarantee
holds. The folder was mutated anyway, while being declined.

**WHY IT IS NOT A REJECTION.** `.nputer/` is nputer's own runtime
directory and losable by charter (ADR-017 clause 4); the rename destroys
nothing, is loud on stdout, and preserves the original bytes beside the
new name. `sessions.rs`'s own doc comment already states the direction of
loss: it "costs a resume offer, never a fact about the project". No
criterion forbids it, and T-026 criterion 5 is about `docs/`.

**WHY IT IS WORTH A RULING ANYWAY.** Three properties are new here and
none of them was argued in the lane:

1. **A read-shaped question performs a write.** Every other input to a
   routing decision in this app is a stat. A reader of
   `routes_to_genesis` cannot see that asking it can modify the disk.
2. **The write is not confined to the picked folder by construction.**
   `apply_genesis_folder` canonicalizes and symlink-checks the ROOT, but
   `sessions_path` then appends `.nputer/sessions.json` and `fs::rename`
   resolves through any symlink on that interior path. A `.nputer`
   symlinked at a directory outside the tree moves a `sessions.json`
   there instead. Pre-T-123 this was reachable only for folders with NO
   plan (which route to genesis anyway); T-123 extends it to every
   plan-holding folder a user opens — the common case for a cloned
   repository.
3. **`fs::rename` clobbers an existing `sessions.json.corrupt`.**
   Repeated picks overwrite the previous aside, so the "never silently
   destroyed" promise holds only for the first corruption.

**THE CHEAP SHAPE OF A FIX**, if a ruling wants one: give C-14 a
read-only accessor for the routing question — a `load` variant that
returns `SessionsFile::default()` on a parse error WITHOUT the rename —
and let the rename stay on the paths that are already committing to act
on the registry (`start_genesis`, `resume_genesis`, `upsert`). That keeps
one owner for the read (criterion 2) while making the ROUTING probe as
side-effect-free as the stat sweep it sits beside.

Related: `fs::read_to_string` on that path also blocks indefinitely if
`.nputer/sessions.json` is a FIFO, which would hang the pick. Same
containment argument, same suggested fix site.
