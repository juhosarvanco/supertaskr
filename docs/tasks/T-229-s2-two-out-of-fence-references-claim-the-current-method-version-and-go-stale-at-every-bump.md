---
id: T-229-s2
title: Two out-of-fence references claim the CURRENT method version, so every bump leaves them stale — docs/ARCHITECTURE.md's C-01 row and C-01-method.md's status comment
feature: F-06
milestone: 4
size: S
priority: 4
status: done
suggested_by: executor claude-opus-5@subagent @T-229
blocked_by: []
touches: [docs/ARCHITECTURE.md, docs/architecture/components/C-01-method.md]
builder:
verifier:
built_by: the architect/integrator seat, claude-fable-5-1
verified_by: the same seat — a two-word reconciling write, read back by grep
review:
---

**Class parent: none live.** The class is named in
`docs/CONVENTIONS.md`'s first gotcha — *"a reference that CLAIMS THE
CURRENT VERSION goes stale and moves with the bump; a FIXTURE that
merely needs some version string does not"*, followed by *"AND THEY ARE
NOT ALL INSIDE ANY ONE FENCE ... Route what you cannot reach."* This is
the routing that bullet asks for. **Disposition hint: promote, or hand
it to whichever seat next holds the integration checkout — it is two
one-word edits and it recurs at EVERY bump.**

Derived at `179a7cc` with `git grep -n "0\.1\.[0-9]"` from the repo
root, as that bullet prescribes. Two hits claim the current version and
are stale at v0.1.9:

- `docs/ARCHITECTURE.md`, the component table's C-01 row — `built
  (v0.1.8)`.
- `docs/architecture/components/C-01-method.md`, the `status:` line's
  trailing comment — `pinned: built and versioned (v0.1.8)`.

Everything else that hit is correctly left alone and is recorded so the
next bump does not re-derive it: `docs/ROADMAP.md`'s `(v0.1.8: T-159)`
is a pointer to a release CARD and is history, not a current-version
claim (that file says in as many words that the live version is
CONVENTIONS' stamp and is never quoted there); CONVENTIONS' own
`(v0.1.4, T-016)` and `(ratified v0.1.5, T-023)` are ratification
records; `app/src/genesis/genesis-derive.ts`'s `(v0.1.5, T-023)` is the
same; and the `methodVersion: "0.1.5"` lines across `app/test/**` are
FIXTURES that merely need some version string, which the bullet calls
churn to move.

**THE STANDING FIX IS WORTH MORE THAN THE TWO EDITS.** Three places are
pinned by `snapshot_version_matches_the_live_method_stamps` and these
two are pinned by nothing, which is why they go stale silently. Either
give them a keeper — the same assertion, widened to read the component
row — or replace the value with a pointer to CONVENTIONS' stamp, the
way ROADMAP already does. The second is cheaper and is what ROADMAP's
own sentence recommends.

## TRIAGE, 2026-09-02 — `planned`, the integrator's, no lane

The architect seat, at the stamp of T-229's merge (d641846). Both
references are reconciling writes of the kind the checkpoint already
owns (docs/ARCHITECTURE.md is a checkpoint document): the seat holding
the integration checkout makes the two one-word edits in the next
checkpoint commit and closes this card there, naming the bump they
follow. The recurrence at every bump is the CONVENTIONS gotcha's own
routing rule, kept.

## CLOSED, 2026-09-02 — by the integrator's reconciling write

Both references now read v0.1.9 (docs/ARCHITECTURE.md line 28,
docs/architecture/components/C-01-method.md line 9), following the bump
T-229 merged at d641846. `git grep 'v0\.1\.8'` over docs/ARCHITECTURE.md,
docs/architecture/components/ and method/ returns nothing at this commit;
kit.rs's own stamp is v0.1.9 and pinned by cargo test. The recurrence at
every bump stays the CONVENTIONS gotcha's routing rule.
