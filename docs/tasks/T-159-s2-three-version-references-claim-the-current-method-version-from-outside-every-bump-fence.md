---
id: T-159-s2
title: Three references claim the current method version and none is reachable from the fence a bump is given, so every bump ships them stale by construction
status: parked
suggested_by: executor claude-opus-5@subagent @T-159
touches: [docs/ARCHITECTURE.md, docs/architecture/components/C-01-method.md, docs/ROADMAP.md]
---

**CLASS PARENT: `T-145-s2`** (the bump-arithmetic class), whose general
question T-159 settled and whose fence half it did not. The first
gotcha in `docs/CONVENTIONS.md` already predicts this in as many words
— *"AND THEY ARE NOT ALL INSIDE ANY ONE FENCE, which is the practical
trap"* — so this card is that sentence with the paths filled in at a
ref.

**DISPOSITION HINT: promote as a size-S docs card, or fold into the
next card that already holds `docs/ARCHITECTURE.md`; it is three
one-word edits and a decision about the fourth.**

## Derived at 9c0da79, by the command the gotcha prescribes

`git grep -n "0\.1\.[0-9]"` from the repository root, then split by
the gotcha's own test — a reference that CLAIMS THE CURRENT VERSION
moves with the bump, a FIXTURE that merely needs some version string
does not. Three claim it and all three are outside
`[method/, docs/CONVENTIONS.md, app-agent]`:

- `docs/ARCHITECTURE.md:28` — the C-01 row reads `built (v0.1.7)`.
- `docs/architecture/components/C-01-method.md:9` — reads
  `(v0.1.6)`. **It was already one version stale before this bump**,
  which is the evidence that the gap is structural rather than one
  lane's omission: nobody has reached it for two releases.
- `docs/ROADMAP.md:22` — `v0.1.7)` in the F-01 paragraph.

The fixtures were checked and deliberately left: the `methodVersion:
"0.1.5"` literals across `app/test/**`, the `(v0.1.5, T-023)` comment
in `app/src/genesis/genesis-derive.ts`, the `v0.1.3`/`v0.1.4` strings
in the parser fixtures and `docs/rooms/governing-docs.md`'s record of
what ADR-019 landed. **Each needs A version string, not THE current
one**, and moving them is the churn the gotcha names.

## The half that is a decision rather than an edit

Three one-word edits close the instance. What they do not close is why
a bump's fence never reaches them. **Two shapes, both askable:**

1. **Widen the bump's standing fence** to the paths that claim the
   version — which means a bump card carries `docs/ARCHITECTURE.md`
   and the component file, and therefore collides with every lane that
   holds either.
2. **Stop claiming it outside the pinned three.** A component row
   saying `built (v0.1.7)` is a transcribed figure with no keeper —
   ADR-019's own Law 2 — and could point at the stamp instead of
   copying it. That is the cheaper answer and it is a docs-protocol
   argument rather than a fence argument.

**Arm 2 is probably right and is NOT ruled here.** Nothing is red
either way: no test reads any of the three, which is precisely why
they have drifted unnoticed for two versions and why this is a card
rather than a suite.

Discharged: closed_by the T-159 checkpoint (2026-08-30, integrator) — all three outside-fence claims moved with the bump at the integration seat: ARCHITECTURE row C-01, C-01-method.md status pin, ROADMAP F-01. The class (version claims outside every bump fence) stays this card's to retire structurally if it recurs.

Standing triage 2026-08-30 (architect seat): PARKED — INSTANCE DISCHARGED, CLASS ALIVE, and the split is why this is not a rejection. Re-derived at this ref: the current method version is 0.1.8 (`kit.rs:35` METHOD_SNAPSHOT_VERSION, cross-checked on every cargo test), and all three fenced claims now read v0.1.8 — `docs/ARCHITECTURE.md:28` row C-01, `C-01-method.md:9`'s status pin, `docs/ROADMAP.md:22`. The card's own body already records this discharge and names the T-159 checkpoint that did it. **The three edits are done; the STRUCTURE that made them go stale is untouched** — `docs/ARCHITECTURE.md:28` still COPIES the stamp rather than pointing at it, so it goes stale again at v0.1.9 by exactly the mechanism this card describes, and the card itself says the class "stays this card's to retire structurally if it recurs".
Not promoted, because the remaining work is one of two arms (widen the bump fence to reach these three, or stop claiming the version outside it) and choosing between them costs more than the three one-word edits it would save — the tie goes to parking. Its class parent `T-145-s2` is parked on the same vehicle, so the two travel together.
RESURFACES: the next method/ version bump (v0.1.9). That seat will meet the recurrence by construction — it is the seat that has to make the three edits again — and can measure the class rather than reason about it, which is the same argument T-132-s2's note made for choosing a method bump as its trigger. IF the bump ships with all three stale for a second time THEN the structural arm is evidenced and this promotes; IF the bump's own fence has been widened to reach them by then, this is DISCHARGED and says so with the commit.
