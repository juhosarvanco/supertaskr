---
id: T-108-s4
title: The pathspec rule T-108 just landed is missing its third clause — a definition search run from a subdirectory silently scopes itself and answers exit 1, so the honest-looking form refutes a symbol that exists
status: suggested
suggested_by: integrator claude-opus-5 @T-108
---

Walked into live at T-108's merge `188262e`, by the integrator, while
checking the rule T-108 itself had just written. Filed because a rule
falsified by the first person to apply it is worth more than a rule
nobody tested.

## The rule as landed

T-108 wrote this into `docs/tasks/T-081-denial-reaches-the-screen.md`,
beside criterion 7, and it is right as far as it goes:

> **A CRITERION THAT NAMES A TEST SHALL NAME IT BY A STRING
> `git grep -- '*.rs'` FINDS AS A DEFINITION**, and **THE PATHSPEC IS
> PART OF THE RULE.** … **UNRESTRICTED (`-- .`) IT EXITS 0**, matching
> this card's own prose about the phantom, so the search that looks like
> the obvious one confirms a definition that does not exist.

Two clauses: restrict to `'*.rs'`, and know that `-- .` is
self-defeating once anybody writes prose about the name.

## The third clause, measured

**The rule says nothing about the working directory, and the same two
commands answer differently depending on it.** Both run at `188262e`,
same tree, same pathspec, seconds apart:

| run from | command | result |
|---|---|---|
| repository ROOT | `git grep -n "<phantom>" -- .` | **exit 0**, six hits in three files under `docs/tasks/` |
| `app/src-tauri/` | `git grep -n "<phantom>" -- .` | **exit 1**, no match |

**The subdirectory run is the dangerous one and it is the one that looks
like a pass.** `-- .` means "this directory", not "this repository", so
the search silently narrows to wherever the shell happened to sit and
comes back clean. In this exact case it produced a *correct-looking*
refutation of a string that is demonstrably present — the reader
concludes the phantom has been cleaned up when six live occurrences
remain.

**And the restricted form is not immune either, it is merely lucky
here.** `git grep -n "fn an_in_band_auth_failure" -- '*.rs'` run from
`app/src-tauri/` still found the definition — because that definition
happens to live under `app/src-tauri/`. Move the body, or run from
`lib/parser/`, and the same command exits 1 on a symbol that exists.
**A check that passes for a reason unrelated to the property is not a
check**, which is this project's own NEGATIVE ASSERTION rule pointed at a
shell command instead of a test body.

## This is already written down once, and that is the argument

`docs/CONVENTIONS.md`'s **A CITATION NAMES A SYMBOL, NOT A LINE** gotcha
carries it:

> Search from the repo ROOT — `git grep` run from a subdirectory silently
> scopes itself to that subdirectory and returns nothing, which reads
> like a refutation rather than a miss.

**So the knowledge exists and the rule that most needs it does not carry
it** — which is exactly the failure T-108 documents about names and
figures, one layer up: a true statement in one file, and the file where a
reader will act on it saying something incomplete. The integrator read
both files in this session, wrote the check, and still ran it from
`app/src-tauri/` because that is where the previous command had left the
shell.

## The fix

Add the clause where the rule is stated, not only where the gotcha is:
**the ROOT is part of the rule too.** The stronger spelling removes the
dependency on a working directory altogether —
`git -C "$(git rev-parse --show-toplevel)" grep -n "fn <name>" -- '*.rs'`
— and that is worth preferring over a sentence, on this project's own
"a rule that only holds when the setup is right is not a rule".

Fence: `[docs/tasks/T-081-denial-reaches-the-screen.md]` at path
granularity for the criterion-side rule. If it is promoted to a
CONVENTIONS clause instead, `docs/CONVENTIONS.md` is **held by `T-104`**.
