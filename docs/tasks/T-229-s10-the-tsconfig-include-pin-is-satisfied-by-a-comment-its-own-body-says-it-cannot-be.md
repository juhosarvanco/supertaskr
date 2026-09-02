---
id: T-229-s10
title: The tsconfig include pin regexes a whole JSON file and takes the first match, so a decoy in a comment satisfies it while app/src regains the whole test tree
feature: F-06
milestone: 4
size: S
priority: 4
status: planned
suggested_by: executor claude-opus-5@subagent @T-229-s8
blocked_by: []
touches: [app/test/crescendo-dom.test.tsx]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-229`** (a positive control that cannot fail is the
most common defect this project produces), and the SWEEP finding of
`T-229-s8`, which fixed the same shape in `app/test/select-board.test.ts`
and then went looking for siblings.

`CONVENTIONS`' POISON DRILL catalogue, **shape EIGHT**: *an assertion
that SEARCHES a corpus has no uniqueness floor, so one duplicate anywhere
keeps it green with its own subject deleted.*
`app/test/crescendo-dom.test.tsx`'s *"the app program still holds the
read-only node surface T-073 restored"* runs

    /"include"\s*:\s*\[([^\]]*)\]/.exec(readFileSync(resolve("tsconfig.json"), "utf8"))

over the WHOLE text of `app/tsconfig.json` and takes the FIRST match.

**AND THE BODY'S OWN COMMENT SAYS THIS CANNOT HAPPEN**, which is what
raises it above tidiness: *"Parsed rather than string-matched: the
include list is read out of the JSON, and the surface is read from the
DECLARATIONS, so neither assertion can be satisfied by a comment."* The
SECOND half is true — the declarations half really does read
`export function` names. The FIRST half is not: the include list is
string-matched by the regex above, and `app/tsconfig.json` already
carries block comments, so a comment is exactly what can satisfy it.

**MEASURED at `1e344d62fbc3f7db83e367b1e8592578459407cb`**, on a detached
drill worktree, one side only, restored and sha256-proved
(`9e477270eabafa11aeead39cc72767af9daa5e1d87b916a90d18e678ce1e9b91` before,
`eb17d38070311cefa9275e4069b41e785b0161fc735c92db9307ab6e3f871c8d` mutated,
the before hash again after `git checkout --`). With a decoy
`"include": ["src", "test/node-builtins.d.ts"]` planted inside a `/* */`
comment above the real key AND the real key widened to
`["src", "test"]` — the precise widening the body's own comment calls
*"the shape an editor complaint invites"* — the whole app suite from
`app/` exits **0**, 50 files / **1141** bodies passed, against a clean
baseline of the same 1141 on the same worktree. **The kill set is
EMPTY**: not one body in the suite notices that `app/src` has regained
the whole `test` tree.

## Acceptance criteria

1. The include half is read the way the body already claims it is — out
   of the JSON rather than out of the file's text — or narrowed to an
   ANCHOR that is not the needle, with the anchor's own uniqueness
   asserted (shape EIGHT's mechanical remedy).
2. The drill above is the positive control and it RUNS: the decoy in a
   comment plus the widened include list SHALL red the body, and the
   demonstration that it left the current body GREEN is the measurement
   recorded above.
3. The body's comment is corrected in the same commit — a claim that
   outlived its mechanism is the defect that makes this worth a card
   rather than a diff.

## Why it is a suggestion and not a rejection

Nothing is red today: `app/tsconfig.json` holds exactly ONE `"include"`
key at the ref above, so the pin reads the right one. This is the same
argument `T-229-s8` inherited from `T-229-s4` — the copy nothing anchors
is the copy that drifts — and the same reason it is filed rather than
built: `app/test/crescendo-dom.test.tsx` is outside `T-229-s8`'s fence
(`app/test/select-board.test.ts`, `method/lane-protocol.md`), so this
lane routed it instead of widening itself.

## TRIAGE, 2026-09-02 — promoted to `planned`, priority 4, at the T-229-s8 merge (d179821)

The architect seat. A sibling shape-eight instance measured with an empty kill set; the fence is one app test file, held behind T-214's app-shell lane until it lands.
