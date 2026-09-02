---
id: T-219-s2
title: "A bare dot token normalises to `.` and expands to a domain no repository-relative path can match, so the fence permits nothing, collides with nothing and reports no issue — T-227's shape in a spelling T-219 does not reach"
feature: F-06
milestone: 4
size: S
priority: 3
status: suggested
suggested_by: executor claude-opus-5@subagent @T-219
blocked_by: []
touches: [lib-parser]
builder:
verifier:
built_by:
verified_by:
review:
---

**Class parent: `T-219`** (`expandFence` answering confidently where it
should refuse). Found by that lane's own sweep and NOT built there: the
card's criteria name the containment refusal and the empty-`touches:`
refusal, and a third refusal is a criteria change an executor may not
make (`method/tasks/TASK-FORMAT.md`, and `roles/executor.md` step 5 —
suggestions never expand scope). **Latent today**: no live card carries
this spelling.

## Measured

At `3858818`, through the built parser's own `expandFence` with no
component registry:

    "."     -> "."     kind=path   paths=["."]   unusable=[]
    "./"    -> ""      kind=unresolved  paths=[] unusable=["./"]
    ".."    -> ".."    kind=path   paths=[".."]  unusable=[]
    ".//"   -> ""      kind=unresolved  paths=[] unusable=[".//"]
    ".//."  -> "."     kind=path   paths=["."]   unusable=[]

`normalizeFenceToken`'s step 4 drops a leading `./` RUN, so `./`
normalises to the empty string and is refused by the repository-root
branch that already exists. **A bare `.` is not a leading `./` run**, so
it survives normalisation intact, and `looksLikePath` then resolves it
because it contains a `.` — the token becomes `kind: 'path'` with the
domain `.`.

## What is wrong, stated no larger than it is

Every domain this module compares is REPOSITORY-RELATIVE and carries no
`./` prefix, so `sharedDomain('.', 'lib/parser')` is `undefined` and the
domain `.` meets nothing. The result is the pair T-227 measured for an
empty `touches:`, reached by a different route:

- `compareFences` reports a `.` fence DISJOINT from every other fence,
  so `T-209`'s dispatch guard would allow the lane;
- the write-time hook compares real relative paths against the domain
  `.` and matches none, so the lane can write nothing;
- and `expandFence` reports **no issue and no `unusable` entry**, so
  neither half says why.

`..` is worse in spelling and identical in effect: it resolves as a
path, names a domain outside the repository, and matches nothing.

Not a security hole — the halves disagree in the safe direction, which
is also exactly what T-227 concluded about its own instance before
T-219 absorbed it.

## What to build

- `expandFence` SHALL refuse a token whose normalised form names the
  repository root or escapes it — `.` and any leading `..` segment —
  with the reason the existing empty-normalisation branch already gives
  (*"a fence cannot reserve the repository root"*), so ONE sentence
  covers both spellings rather than two.
- The refusal SHALL be reached from `normalizeFenceToken` or from the
  branch that already exists, never as a fourth prefix rule beside them
  (`T-057`).
- A body SHALL prove `.`, `..` and `../elsewhere` are refused and that
  `docs/architecture` and a filename legitimately carrying a dot
  (`docs/ROADMAP.md`, `app/src/main.tsx`) are NOT — the `looksLikePath`
  test keys on the same character, so the refusal must not widen into
  every token with a dot in it.
- Verification: headless.

## Read beside

`T-219` (the class, and the sweep that found this), `T-227` (the same
two-halves-disagree shape for an empty `touches:`, absorbed into T-219),
`normalizeFenceToken`'s own declared ceiling in `lib/parser/src/fence.ts`.
