---
id: T-249-s1
title: The secret set's per-entry positive control is DELETED ALONG WITH THE ENTRY IT GUARDS — five of the seven entries can be dropped whole and lane-fence.spec.ts stays 71/71 green, because the loop takes its samples from the very list it is checking
feature: F-04
milestone: 4
size: S
priority: 5
status: planned
suggested_by: blind verifier claude-opus-5@subagent (phase 2), at T-249's tip e41ebef, 2026-09-08 — measured while running the per-entry mortality table the sealed attack set demanded
blocked_by: []
touches: [.claude/hooks/lane-fence.mjs, tools/e2e/tests/lane-fence.spec.ts]
builder:
verifier:
built_by:
verified_by:
review: independent
---

## The finding

**Class parent: `T-229`** — "a positive control that cannot fail is the
most common defect this project produces". That card is `status: done`
and delivered the METHOD rule; this is a concrete instance of the class
in shipped test code, and it needs a code fix rather than another rule,
which is why it is filed beside rather than appended there.

`T-249` added `SECRET_SET` to `.claude/hooks/lane-fence.mjs` — one frozen
list of seven entries, each carrying its own `sample` — and the card's
first acceptance criterion asks for "a positive control per entry". The
spec satisfies it with a loop:

    for (const entry of SECRET_SET) { ... askRead(fx.lane, entry.sample) ... }

The samples come from the list under test, so **one arrangement decides
both the subject's answer and the control's**. Deleting an entry deletes
its control in the same stroke, and the suite gets shorter instead of
red. Measured at `e41ebef` by dropping each entry whole and running all
71 bodies of `tools/e2e/tests/lane-fence.spec.ts`:

| entry dropped | bodies red |
|---|---|
| `env-file` | 6 |
| `local-override-file` | 1 |
| `private-key-file` | **0 — SURVIVES** |
| `ssh-directory` | **0 — SURVIVES** |
| `cloud-credentials-directory` | **0 — SURVIVES** |
| `credential-config-file` | **0 — SURVIVES** |
| `keychain-export` | **0 — SURVIVES** |

Five of seven — every non-env secret class: private keys, ssh, cloud
credentials, credential rc files, keychain exports — can be removed with
the whole suite green. `env-file` and `local-override-file` survive only
because OTHER bodies name `.env` literally and the derivation body binds
`*.local`; that is the literal planting the other five lack.

`SECRET_SET.length` is asserted `toBeGreaterThan(0)` — anti-vacuity, not
a pin. Nothing anywhere compares the list to a fixed expectation, so once
`docs/CONVENTIONS.md` publishes the clause naming "seven entries" that
sentence can silently become false.

**WHAT THE CONTROL DOES CATCH, so the fix does not throw it away.** The
loop's second arm requires each sample to be claimed by its own entry AND
BY NO OTHER, and that arm genuinely fires: adding `.aws` to
`ssh-directory`'s segments so two entries collide reds the body. Breaking
an entry's own rules reds it too. It is the DELETION direction, and only
that, which is unguarded. The asymmetry worth noting is that the same
spec already builds a LITERAL table for the negatives
(`PLANTED_NEGATIVES`) and a derived one for the positives.

## Acceptance criteria

- THE spec SHALL carry a LITERAL table of (path, expected entry name)
  pairs, written in the spec and not read from `SECRET_SET`, covering
  every entry — so that deleting an entry from the hook reds a body that
  names it.
- THE entry count SHALL be pinned, so a deletion or an unreviewed
  addition is visible rather than absorbed by a loop bound.
- A POSITIVE CONTROL SHALL show the new table failing where the
  arrangement that would decide it is ABSENT: drop one entry from the
  hook and record which bodies red, per `method/roles/verifier.md` 2b.
- THE existing per-entry loop SHALL be kept — it catches entry
  corruption and collision, which a literal table alone does not.

## Disposition hint

Promote to `planned` as an S. It is one body plus a table in a file the
next `lane-fence` lane will already hold, and it is worth doing before
the CONVENTIONS clause publishes an entry count that nothing checks.

## Triage (2026-09-08, the wave sitting)

Promoted as an S, guard-class (`review: independent`), F-04 milestone
4, p5, per the disposition hint. Absorbs T-249-s2 (the same file, the
same guard): decide() gains a term for tools that READ so a matcher
widened to Grep or Glob never routes a read through the write fence.

Absorbs: T-249-s2 (2026-09-08) — arming the read guard invites a matcher change
that routes Grep and Glob through the WRITE fence; the file is removed
in this commit, this line is the surviving record.

## Acceptance criteria

- WHEN any ONE entry of SECRET_SET is deleted whole THE lane-fence
  suite SHALL red, naming that entry — the per-entry control takes its
  subject and its control from sources that one deletion cannot move
  together (a frozen fixture list of samples, independent of the set).
- WHEN the set's entry COUNT is stated anywhere a reader meets it (the
  CONVENTIONS read clause, the hook header) THE suite SHALL hold a body
  that reds when the count and the set diverge.
- WHEN a tool whose request carries a path but whose name is in a
  READ class (Read, NotebookRead, Grep, Glob) reaches decide() THE
  verdict SHALL come from the read arm (the secret set) and never from
  the write fence, and a tool name outside both classes SHALL be
  reported as unclassified rather than fenced by default.
- IF `.claude/settings.json`'s PreToolUse matcher is widened to a name
  decide() does not classify THEN a body SHALL red, naming the tool.
- The drill SHALL plant the five-entry deletion the verdict measured
  (suite green at e41ebef) and show the new bodies red on it; landing
  read from `git diff`, restoration by sha256.
