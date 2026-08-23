---
id: T-064-s1
title: The casing rule did NOT move with arm (a) — one predicate now has two constructors whose NAME MATCHING is filesystem-dependent on one side and exact on the other
status: suggested
suggested_by: executor claude-opus-5 @T-064
---

T-026-s1's third-triage note says: *"T-064 was created at this triage
over the OTHER way the probe and the filesystem can disagree ... and its
preferred arm re-derives `has_plan` from the snapshot rather than from a
separate stat. If that arm is taken, the casing rule moves with it — one
predicate, one place to decide the rule. Read this file before building
T-064."*

**IT WAS READ, ARM (a) WAS TAKEN, AND THE CASING RULE DID NOT MOVE.**
What moved is the PREDICATE (`PlanProbe::has_plan`), which was already
in one place and still is. What did NOT move — and what the casing
question is actually about — is the NAME MATCHING, and that is now in
TWO places rather than one:

- `probe_plan` (app/src-tauri/src/docs_watch.rs) joins `ROADMAP_NAME`
  onto `<root>/docs` and calls `fs::symlink_metadata`. The FILESYSTEM
  decides whether `docs/roadmap.md` answers that stat: yes on macOS and
  Windows by default, no on Linux.
- `PlanProbe::from_docs_snapshot` (same file) compares
  `under_docs_dir(rel)` against the same `ROADMAP_NAME` constant with
  `==`. A string comparison is EXACT on every platform.

T-064 made the two readings share the LITERALS — that is real and is
what the constants are for — but it cannot make them share the
SEMANTICS, because one of them is a syscall and the other is a string
compare. So the number of places that decide "what is a ROADMAP.md"
went from one to two, and they can disagree on a case-insensitive
filesystem.

**MEASURED, one direction at a time, at T-064's tip:**

- macOS, a folder holding `docs/roadmap.md` and nothing else: the STAT
  arm answers `roadmap: true`, `has_plan()` is true, and
  `apply_genesis_folder` routes to `open_as_project` BEFORE anything is
  armed. The snapshot arm never runs. **No behaviour change, and no
  contradiction reaches a screen.**
- Linux, same folder: the STAT arm answers `roadmap: false`, genesis is
  armed, and the snapshot arm compares `"roadmap.md" == "ROADMAP.md"`
  and also answers false. **Both readings agree, and both are the
  answer T-026-s1 already calls wrong.** T-064 neither fixed nor
  worsened it.

So T-026-s1 is UNCHANGED in substance and its stated expectation is
now falsified: the arm it hoped would carry the decision does not
reach it. The close is still one decision — (a) exact match is the
rule, said out loud in CONVENTIONS, or (b) both readings lowercase —
and (b) is now the cheaper of the two precisely BECAUSE the constants
are shared: one `eq_ignore_ascii_case` on each side, against one
literal. Whoever takes T-026-s1 should take this with it; it is the
same decision and it now has two implementations waiting for it.
