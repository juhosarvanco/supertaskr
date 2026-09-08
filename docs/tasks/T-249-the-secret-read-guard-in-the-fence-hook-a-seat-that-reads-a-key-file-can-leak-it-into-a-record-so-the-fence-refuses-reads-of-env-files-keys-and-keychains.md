---
id: T-249
title: The secret read guard in the fence hook — a seat that reads a key file can leak it into a record, so the fence refuses reads of env files, private keys and keychains, not only writes outside the card
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — GSD Core's secret read guard (T-245); nputer's fence is write-only"
blocked_by: []
touches: [.claude/hooks/lane-fence-hook.mjs, .claude/hooks/lane-fence.mjs, tools/e2e/tests/lane-fence.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by:
review: independent
---

## Why this card exists

The fence is a property at the write (T-154): a hook refuses a write
outside the card's paths. Reads are free. A seat that reads `.env`, a
`*.pem`, `~/.ssh/*` or a keychain export can carry the value into a
card body, a verdict or a record — and records are append-only. GSD
Core ships a read guard for exactly this (hooks/gsd-secret-read-guard.js).

## Acceptance criteria

- WHEN a seat under a fence attempts to READ a path matching the
  secret set (env files, private keys, ssh and cloud credential
  directories, keychain exports — the set is ONE list in the hook with
  a positive control per entry, derived from the tree's own ignore
  files where it can be) THE hook SHALL refuse the read and name the
  entry that matched.
- WHEN the read is of a file the card's fence explicitly names THE hook
  SHALL still refuse — a fence widens writes, never secrets; the seat
  that needs a secret's SHAPE reads a redacted sample the human
  provides.
- IF the hook cannot classify the path THEN it SHALL allow and log —
  this guard fails open on classification, because a read guard that
  blocks the tree's own sources is a lane killer (the hook's own
  refusal must be inspectable: the log line names the path and the
  reason).
- The lane-fence spec SHALL gain the read arm with a planted positive
  and a planted negative; the drill SHALL show the guard red on a
  planted `.env` read and byte-exact restoration after.
- CONVENTIONS' fence sentence SHALL gain the read clause in the same
  merge (docs gate run).

## Implementation notes
<!-- executor appends before finishing -->

Built at `e641b57` on `task/T-249-secret-read-guard`, cut at
`828621f5`. Three files, +836 lines, no deletions.

THE SHAPE. `decide` asks the read guard FIRST for a read tool and never
reaches the fence, and the POSITION is the property rather than an
optimisation. Three things follow from it that no arm further down could
buy: a card's `touches:` cannot open a secret (no manifest is read on
that path at all — "a fence widens writes, never secrets" is an ABSENCE,
and an absence cannot be forgotten); a read OUTSIDE the fence is ALLOWED
(reads are screened, not fenced — a lane that may not read `docs/`
cannot work); and a pathless read cannot take limit 8's refusal, which
is right for a write and would silently reverse the fail-OPEN rule.

`SECRET_SET` is ONE list, as DATA, seven entries, each carrying a
`sample` the spec drives — so every entry has its own positive control
by construction, and the spec requires each sample to be claimed by its
own entry AND BY NO OTHER, which is what stops an entry becoming
decoration. Entries: `env-file`, `local-override-file`,
`private-key-file`, `ssh-directory`, `cloud-credentials-directory`,
`credential-config-file`, `keychain-export`.

DERIVED FROM THE TREE'S OWN IGNORE FILES — AND THE CARD IS OPTIMISTIC
ABOUT WHAT THAT YIELDS. Measured at `828621f5`: the NINE tracked ignore
files name exactly ONE secret-bearing pattern between them — `*.local`
in `app/.gitignore`. That is `local-override-file` and it is the only
entry with a `derivedFrom`; the other six are the hook's own. The spec
re-derives at its own ref and reds if a new ignore pattern goes
uncovered, so the clause is a live relation rather than a claim.

TWO DELIBERATE OVER-REFUSALS, DECLARED. `.env.example` and its siblings
are refused with every other `.env.*` — the suffix is chosen by whoever
named the file, and the card's own answer for a seat needing a secret's
SHAPE is a redacted sample the human pastes. And `.npmrc` is refused
though a project one is often harmless; this tree has none (measured:
zero tracked files match any entry).

FAILS OPEN, AND SAYS SO. Three unclassifiable shapes, each planted in
the spec: no path in the request, a NUL in the target, a target that
resolves to a filesystem root. Each is ALLOWED with `judged: false`, so
the existing runner LOGS it naming the path and the reason — the runner
needed not one line for any of this. Its two codes are their own frozen
`SECRET_READ_CODES` and deliberately NOT members of `DECLINE_CODES`:
that set is the WRITE fence's four limit-codes, which
`lane-fence.spec.ts` requires `docs/CONVENTIONS.md` to publish entry for
entry, so a fifth member would be a false claim about those limits AND
would red this lane over a page outside its fence.

THE GUARD IS UNARMED AT THE HARNESS. `.claude/settings.json` matches
`Edit|Write|NotebookEdit`; no read event reaches the hook. That file is
outside this card's fence. The hook says so in its own header and a spec
body is the record of which world it is in — it asserts the header
sentence today and asserts a real exit-2 refusal through the process
boundary the moment the matcher names a read tool.

TWO ARTEFACTS THIS LANE COULD NOT LAND, both outside the fence, both
owed by the SAME merge: `docs/CONVENTIONS.md`'s read clause (the card's
fifth criterion; the exact sentence is in the report) and
`docs/CAPABILITIES.md` (nine new spec names — `npm run capabilities`
gives +10/-1, census 652 -> 661, verified green in a detached tree).
`npm run capabilities:check` therefore exits 1 in this lane BY
CONSTRUCTION and is not a defect of the work.

VERIFIED. `tools/e2e` 661/661 green (exit 0, 11.0m); `lane-fence.spec.ts`
71/71 (62 pre-existing + 9 new); typecheck, lint:tokens, lint:docs all
exit 0. POISON DRILL 11-for-11 in a detached worktree at `e641b57`: every
mutant RED, every one of the nine new bodies killed by at least one, no
pre-existing body ever disturbed, both files restored BYTE-EXACT by
sha256 against the commit. The card's named drill is M1 — the `env-file`
entry stops matching a planted `.env` read and seven bodies go red.

## Verdicts
