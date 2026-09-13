---
id: T-033-s11
title: The Rust reader cannot see `non_code`, so `arch drift --fail-on any` can never go green — and this is the FIRST LIVE two-engine divergence ADR-015 names as its own revisit trigger
status: parked
wake: T-059
suggested_by: verifier claude-opus-5 @T-033-verify
---

Absorbs: T-141-s1 (Amnesty triage 2026-08-29 (triage seat)) — the same engine and the same asymmetry from the other side: the CYCLE census has an exact-set both-directions ratchet in cargo and the DRIFT census has none, so unmapped opens and closes with cargo test byte-identical and the only tripwire is two React fixtures. Read with this card's own finding — the Rust reader cannot see non_code — the picture is one engine that neither sees the registry's opt-in flag nor ratchets its own answer, which is why one crate-index lane should take both.

T-033 added `non_code:` to the component-file format and taught the
TypeScript derivation to downgrade a `non_code` component's D3 to
informational. **`app/src-tauri/crates/nputer-index/` was not taught
anything** — `grep -rn 'non_code\|nonCode' app/src-tauri/crates/nputer-index/`
returns **zero hits at `935693f`**. That is not a defect in T-033: no
criterion asked for it, criterion 2 is written about *"the map's
findings"*, and the crate's reader is deliberately narrow. But it leaves
two consequences nobody owns.

## THE TWO ENGINES NOW CLASSIFY THE SAME LIVE FINDING DIFFERENTLY

Derived at `935693f`, from `app/src-tauri`:

    cargo run -p nputer-index -- arch --root ../..
      component  C-01  ...  drift=D3
      component  C-11  ...  drift=D3
      summary  ...  findings=3  drift_components=3

    app/test/architecture-dogfood.test.ts, same tree, same graph:
      derived.components.filter(c => c.hasDrift)  ->  ["C-10"]

Both engines emit the same three finding ids (`D1:C-10->C-14`,
`D3:C-01`, `D3:C-11`) — they agree on every FACT. They disagree on
whether two of them are drift, because only one of them has the concept.

**ADR-015's 2026-08-17 addendum names its own revisit trigger in as many
words: *"a third join, or the FIRST LIVE DIVERGENCE, or a consumer that
needs the Rust side to answer a question the reader deliberately does
not."*** The three divergence classes that addendum enumerates (a YAML
escape in `paths:`, a duplicate `paths:` key, a tab-indented item) are
all still latent — no live component file triggers one, re-checked here.
This one is **not latent**: it is live on this tree today, on two of the
thirteen components. T-033's own addendum says *"the three latent
divergence classes it names are unchanged and still latent"*, which is
true, and did not notice that a fourth had just been created that is not.

Whether it counts as a *divergence* in the addendum's sense is a fair
question — the facts agree and only a severity label differs — and that
is exactly why it wants an architect's line rather than a lane's.

## THE OPERATIONAL HALF: `--fail-on any` CAN NEVER GO GREEN

    arch drift --root ../.. --fail-on unmapped     -> exit 0
    arch drift --root ../.. --fail-on undeclared   -> exit 1  (D1:C-10->C-14, T-125's)
    arch drift --root ../.. --fail-on any          -> exit 1  (the same D1 + D3:C-01 + D3:C-11)

`docs/CONVENTIONS.md` says the gating form *"stays unwired while the
registry carries live undeclared edges by design"*. **T-125 removes the
last one.** After T-125, `--fail-on undeclared` goes green and the repo
becomes wirable for the first time — and `--fail-on any` will still exit
1 forever, on two findings this project has ruled are not drift. So the
day the strongest gate becomes reachable is the day it becomes
permanently unreachable, for a reason recorded nowhere in the gate.

## THREE ARMS, none of them this card's

**(a) Teach the crate the field.** `registry.rs` reads the frontmatter
already; `non_code` is one boolean. `arch` would print `drift=D3(info)`
or drop it from `drift_components`, and `--fail-on any` would mean what
its name says. Cost: a second implementation of a rule that already has
one — which is what T-059 exists to pin, so it should land *with* T-059
rather than before it.

**(b) Say the crate deliberately does not know.** Add a clause to
ADR-015's Decision section: the reality-side join reports FACTS and the
intent layer owns SEVERITY, so `non_code` is out of the crate's scope by
design and `--fail-on any` is documented as strictly wider than the map.
Cheapest, and consistent with T-033's own arm (a) split.

**(c) Retire `--fail-on any`** in favour of the two narrow forms, which
are the ones CI would actually wire.

**Route:** this is `T-059`'s neighbourhood — T-059 is
`blocked_by: [T-033]` and stays alive precisely to stop *"one clause in
two documents from drifting into two answers."* This is that drift,
arriving in code instead of in prose, before T-059 was dispatched. Fold
it into T-059's brief or rule (b) in one line; either closes it.

## ADJACENCY, verified on disk rather than assumed

A card absorbing `T-033-s7` and `T-033-s10` was in draft in the main
checkout at the time of this verdict — **untracked, on no committed
ref** — proposing a cycle gate whose *"natural home is `nputer-index`,
which already walks the registry."* If that lands, the crate is already
open and already reading `depends_on:`; teaching the same reader one
boolean is then nearly free, and arm (a) above becomes the cheap arm
rather than the expensive one. **That card does not mention `non_code`,
`informational` or `--fail-on any`**, so this is a second gap in the same
crate and not a duplicate of it.

Amnesty triage 2026-08-29 (triage seat): PARKED — the needle is live — grep for non_code across the crate returns nothing while app/src/lib/architecture/derive.ts reads the flag — so the two engines really do disagree, but the consequence is bounded: CONVENTIONS records arch drift --fail-on as LOCAL ONLY and no gate in this repository runs it, so the divergence costs a hand-run command and nothing else today. RESURFACES: the next crate-index dispatch, or the moment arch drift becomes a gate — ADR-015 names a live two-engine divergence as its own revisit trigger and this is it.

Parked 2026-09-13 (the pruning sitting (T-306), the owner's ruling of 2026-09-13): kept with a wake — wake T-059; one engine cannot see a field the other emits, the first live two-engine divergence the decision named as its revisit.
