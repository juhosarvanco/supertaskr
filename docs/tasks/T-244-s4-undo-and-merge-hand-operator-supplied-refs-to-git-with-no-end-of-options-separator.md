---
id: T-244-s4
title: "`undo` and `merge` hand operator-supplied refs to git with no `--` separator, so a value shaped like a git option is parsed as one — `git log --output=<file>` writes a file"
feature: F-01
milestone: 4
size: S
priority: 2
status: planned
suggested_by: "verifier claude-opus-5@subagent, in T-244's verification bench, 2026-09-09 — measured while probing the CLI front's argument handling"
blocked_by: []
touches: [tools/e2e/]
builder:
verifier:
built_by:
verified_by:
review: independent
---

Absorbs: T-244-s5 (2026-09-14, the owner's approval of 2026-09-14, pile 2 batch 3b, after the Codex orchestrator's reviews): its unescaped-id arm, as this card's promotion line already says, and the canonical section is created below from both records.

## The finding

`tools/e2e/scripts/undo.mjs` and `tools/e2e/scripts/merge.mjs` place
operator-supplied values into a git argv without the `--` end-of-options
separator. `--branch <name>` reaches `git log --first-parent --merges
--format=... <branch>`; `--force <sha>` and `--merge <sha>` reach
`git rev-parse <value>^{commit}`; `--verdict <sha>` the same. git parses
options anywhere ahead of `--`, so a value that looks like an option is
taken as one.

Measured on this machine, 2026-09-09:

    git log --first-parent --merges --format=%H --output=/tmp/probe.txt main
    exit=0, /tmp/probe.txt created

This is NOT a privilege boundary and it is not why it is worth fixing:
every value comes from the operator's own command line, and an operator
who can pass `--branch` can already run git. It is worth fixing because
it is the shape that becomes a hole the moment either verb is called by
something other than a hand — the seat skill (T-241), a CI step, or the
`merge` verb driven from a card id read off a file. The house already
treats this class as real: the fence hook and the push guard both parse
git invocations rather than trusting them.

There is no shell anywhere in these scripts — every spawn is `spawnSync`
with an argv array and no `shell: true` — so nothing here is command
injection, and the verifier's probes with `;id`, `$(...)` and backticks
were all refused or passed through verbatim. This is git's own option
parsing, and only that.

## What a fix would do

Insert `--` before the first operator-supplied ref in each invocation
(`git log ... -- <branch>` needs the branch ahead of `--`, so the shape
there is `git log <branch> --` or a `--end-of-options` guard, which git
2.24+ carries), or validate each value against a ref-shape pattern before
it is spawned and refuse a leading `-` the way `undo`'s positional
argument already does.

## How to know it is fixed

A body in `tools/e2e/tests/cli.spec.ts` passing `--branch
'--output=<tmpfile>'` and `--force '--output=<tmpfile>'` to a fixture
repository and asserting a non-zero refusal with the file NOT created —
with the positive control that the same fixture accepts an ordinary
branch name and an ordinary sha.

Promoted 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): to planned at priority 2 — operator-supplied refs reach git with no separator, so a value shaped like an option is parsed as one; absorbs T-244-s5's unescaped-id arm. Not dispatched by this sitting.

## Acceptance criteria

- WHEN a user-supplied ref reaches any exposed git entry point the command carries — the branch, sha and tip arguments the parent names, the merge and verdict ref paths included — THE command SHALL pass it with command-appropriate option termination or validated ref input (a ref-shape check refusing a leading dash where a subcommand gives the separator another meaning, as `git log` does for paths); a body SHALL pass option-shaped probes to a fixture repository and assert a named refusal with no file created, and the positive control SHALL show that an ordinary branch name and an ordinary sha select the intended revision, not merely that the command exited.
- WHEN a card id is looked up THE lookup SHALL match the id literally (the escape mentionsCard already performs, or a comparison of the parsed id), a malformed id SHALL be a named refusal and never a SyntaxError, and a pattern-shaped id SHALL resolve no card — on a populated card fixture where a valid id still resolves.
- WHEN the installer's destination is unreadable (a directory at the collision check) THE command SHALL answer a named collision refusal and never an uncaught error. (the three bullets absorb T-244-s5, 2026-09-14)

## Absorbed from T-244-s5 — `cardFile` interpolates the operator's card id into a `RegExp` unescaped, so a malformed id is an uncaught SyntaxError and a wildcard is a card lookup — `undo`/`merge` throw where they should refuse (kept whole)

Title as filed: "`cardFile` interpolates the operator's card id into a `RegExp` unescaped, so a malformed id is an uncaught SyntaxError and a wildcard is a card lookup — `undo`/`merge` throw where they should refuse"

Filed as: status suggested, priority 8, size S, touches [tools/e2e/], wake None, suggested_by "verifier claude-opus-5[1m]@subagent, in T-244's verification bench (second pass, at 870c14e), 2026-09-09 — found by the security sweep on undo.mjs, which the fix pass moved".

### What was measured (T-244-s5)

`tools/e2e/scripts/undo.mjs`'s `cardFile` — which `merge.mjs` imports and
shares — resolves a card by building a regular expression out of the
operator's own argument:

    return new RegExp(`^id: ${id}\\s*$`, "m").test(text);

The id is never escaped. `mentionsCard`, ten lines away in the same file,
DOES escape (`id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`), which is what
makes the asymmetry visible.

Two consequences, both reproduced at `870c14e` on the verification bench:

**A malformed id is an uncaught `SyntaxError`, not a refusal.**

    $ node tools/e2e/scripts/undo.mjs 'T-((((((((((a' --root <fixture> --dry-run
    SyntaxError: Invalid regular expression: /^id: T-((((((((((a\s*$/m: Unterminated group
        at new RegExp (<anonymous>)
    exit=1

Every other bad input to these two verbs is a NAMED refusal on exit 3
with nothing spawned — the verifier's first pass recorded that as one of
the things the lane got right. This one path is a stack trace.

**And the card lookup is a REGEX, not an id.** On this repository's board
at the same ref, `cardFile("T-24.")` reports *10 cards carry `id: T-24.`*
and `cardFile("T-2[0-9][0-9]")` reports 74. Where the pattern matches
exactly one card, the verb proceeds having resolved a card the operator
did not name. Today that is blocked only by accident: `mentionsCard`
escapes, so the merge-subject lookup then fails to find the literal
pattern text and the verb refuses. The two lookups disagree, and the
disagreement happens to fail safe.

**A third, same class, at a site the fix pass added.** `runInstall`'s new
collision check does `readFileSync(to, "utf8")` on every existing
destination; where the destination is a DIRECTORY it throws `EISDIR`
uncaught. Measured with `.codex/prompts/seat.md` made a directory: exit
1, stack trace, no named refusal.

### Why this is filed as a suggestion and not a defect (T-244-s5)

Every value here comes from the operator's own command line; there is no
shell anywhere in these scripts; no probe of mine ever escaped an argv
array. The consequence is a crash or a refusal, never an escalation —
the same reasoning the first verdict applied to T-244-s4. It stops being
harmless the moment either verb is driven by the seat skill (T-241) or a
CI step rather than a hand, which is why it is written down.

### What would close it (T-244-s5)

Match the id LITERALLY — reuse the escape `mentionsCard` already
performs, or compare the parsed `id:` value rather than pattern-match the
text — and let `runInstall` treat an unreadable destination as a
collision to be named rather than a throw.

### The control, and it is the verifier's to check (T-244-s5)

The body: `cardFile("T-((((((((((a", <the real board>)` returns a
`{ problem }` and does not throw; `cardFile("T-24.", …)` reports **no
card**, not many; and — the positive control — `cardFile("T-244", …)`
still resolves to its one file.

**Run at `870c14e`, against the implementation that LACKS the property,
it FAILS**, and it fails on the very throw it exists to refuse:

    SyntaxError: Invalid regular expression: /^id: T-((((((((((a\s*$/m: Unterminated group

so its green would mean something. Run where the arrangement that decides
it is absent — a fixture board with no cards at all — the same body would
pass for the wrong reason, because every lookup returns *no card*
whatever the id; the real board, with `T-244` present to answer the
positive control, is what separates the control from a tautology.

## Implementation notes

## Verdicts
