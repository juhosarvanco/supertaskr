---
id: T-123-s3
title: The routing question performs a WRITE — opening a planned folder with an unparseable registry renames a file inside it, and the rename is not confined to that folder by construction
feature: F-03
milestone: 4
priority: 16
size: M
status: planned
blocked_by: []
touches: [app-agent]
suggested_by: verifier claude-opus-5 @T-123-verify
builder:
verifier:
built_by:
verified_by:
review:
---

**PROMOTED at the amnesty triage, 2026-08-29.** The routing ANSWER is
correct in every case the card measures, and that is not what this is
about. Before T-123, the decision for a plan-holding folder was a pure
stat sweep whose own header promises it never reads file contents —
*"which is what makes it safe to point at a folder a user just chose"*.
T-123 put a registry read into that decision, and the read renames.

**Three properties are new and none of them was argued in the lane. The
second is the one that promotes this card:**

1. A read-shaped question performs a write. A reader of
   `routes_to_genesis` cannot see that asking it can modify the disk.
2. **The write is not confined to the picked folder by construction.**
   `apply_genesis_folder` canonicalizes and symlink-checks the ROOT, and
   then `sessions_path` appends `.nputer/sessions.json` and `fs::rename`
   resolves through any symlink on that INTERIOR path — so a `.nputer`
   symlinked at a directory outside the tree moves a file there instead.
   Before T-123 this was reachable only for folders with no plan, which
   route to genesis anyway; now it is reachable for **every plan-holding
   folder a user opens**, which is the common case for a cloned
   repository.
3. `fs::rename` clobbers an existing `sessions.json.corrupt`, so the
   "never silently destroyed" promise holds only for the first
   corruption.

A fourth, same site and same containment argument:
`fs::read_to_string` on that path blocks indefinitely if
`.nputer/sessions.json` is a FIFO, which hangs the pick.

**What this card is NOT.** It is not a claim that data is lost —
`.nputer/` is nputer's own runtime directory and losable by charter
(ADR-017 clause 4), the rename is loud on stdout, and the original bytes
survive beside the new name. It is that the app performs an unargued,
unconfined write on a folder it is in the act of DECLINING to route to.

## Acceptance criteria

- WHEN the routing question reads the registry THE read SHALL be
  side-effect-free — the shape the card names is a `load` variant
  returning the default on a parse error WITHOUT the rename, leaving the
  rename on the paths already committing to act on the registry
  (`start_genesis`, `resume_genesis`, `upsert`). ONE owner for the read
  is criterion 2 of T-123 and SHALL be preserved.
- THE write, wherever it survives, SHALL be confined to the canonicalized
  project root by construction rather than by the caller's care — a
  symlink on the interior path SHALL NOT move a file outside the tree.
  The pin SHALL be a fixture with a `.nputer` symlinked out of the tree,
  and it SHALL fail before the fix.
- WHEN an aside already exists THE second corruption SHALL NOT clobber
  the first, or the card SHALL rule that it may and say why.
- THE FIFO case SHALL be answered — bounded, refused, or ruled
  acceptable with the reason recorded at the read site.
- THE lane SHALL re-derive the measurement this card carries at its own
  ref: `original_still_there=false  aside_created=true
  outcome_kind=Picked`, driven through the real `apply_genesis_pick`
  with a six-byte unparseable registry.

## The record, kept verbatim

Not a failure against any T-123 criterion, and not a blocker: the routing
ANSWER is correct in every case below. This is about a side effect the
routing question acquired on the way to answering.

**WHAT CHANGED.** Before T-123, `apply_genesis_folder`'s decision for a
folder holding a plan was a pure stat sweep — `probe_plan`, whose own
header promises it never reads file contents and lists no names, "which
is what makes it safe to point at a folder a user just chose". The
registry was never opened for such a folder. T-123 adds a registry read
to that decision, and it reaches `sessions::load`, which
(`app/src-tauri/src/agent/sessions.rs:149`) does this when the file does
not parse:

> **POINTER CORRECTED by `executor claude-opus-5 @T-123-rebuild`.** This
> finding was written against the REJECTED first pass, which called
> `sessions::has_genesis_session(&canon)`. That symbol no longer exists:
> the rebuild replaced it with `sessions::genesis_reachability(&canon)`,
> because a `bool` could not tell a REFUSED session id from an absent one.
> **The finding itself is unchanged and still open** — the call chain is
> now `genesis_reachability` -> `genesis_record` -> `load`, one read
> exactly as before, with the same rename-aside on the same line. Only the
> first name in the chain moved.

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

Absorbs (eleventh triage, 2026-08-26): T-123-s9 — files removed in this
commit. Same defect seen from more than one side; this file is the
survivor because it carries the measurement or the general fix.

## Implementation notes
<!-- executor appends before finishing -->

## Verdicts
