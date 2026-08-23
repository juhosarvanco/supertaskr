---
id: T-064-s5
title: The stat reading counts a DIRECTORY named `*.md` inside docs/tasks/ as a task file and the snapshot reading cannot — a second place where "one predicate, two inputs" is two questions
status: parked
suggested_by: executor claude-opus-5 @T-064
---

T-064 criterion 3 asks for ONE predicate over TWO inputs, and
`PlanProbe::has_plan` is that predicate. The two inputs are not quite
asking the same question, and this is the second way (see `T-064-s1`
for the first, about casing).

`has_any_task_file` (app/src-tauri/src/docs_watch.rs) is:

    entries.flatten().any(|entry| {
        entry.file_name().to_str().is_some_and(|name| name.ends_with(".md"))
    })

It never asks the entry's FILE TYPE. A DIRECTORY called
`docs/tasks/notes.md` therefore makes the stat reading answer
`tasks: true`. The snapshot reading cannot agree: `collect_docs_tree`
ships files, so a directory contributes no path and
`PlanProbe::from_docs_snapshot` answers `tasks: false`.

**NOTHING IS WRONG TODAY AND BOTH ERRORS POINT THE SAFE WAY**, which is
why this is a suggestion and not a defect. The stat reading is the GATE
— over-answering `has_plan` refuses genesis for a folder, and refusing
genesis is the conservative direction (there is no overwrite path
either way; the folder opens as an ordinary project). The snapshot
reading can only VETO — under-answering leaves the stat reading's
verdict standing, which is the pre-T-064 behaviour. So the two
disagreements cancel rather than compound.

It is filed because the card's own sentence is "one predicate, two
inputs", and a reader who takes that literally will be wrong about this
shape. The close is one `entry.file_type()` check, or `is_file()`, in
`has_any_task_file`; sized S, and it belongs with `T-064-s1`, which is
the same file, the same two readings and the same decision about what
the two inputs are allowed to disagree about.

**PARKED at the seventh triage (2026-08-24).** Unpark with T-026-s1 (same file, same two readings, one decision), or independently at the first directory named `*.md` under docs/tasks/.
