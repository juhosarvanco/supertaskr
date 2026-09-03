# Beyond the Playbook — the feature charter, checked in

**Provenance.** Written 2026-08-30 as a claude.ai artifact ("Beyond the Playbook", https://claude.ai/code/artifact/aa3d8ecb-8e32-4436-9222-56e809586cd5) at @human's direction, the day docs/rooms/version-planning.md opened; checked into the repository on 2026-09-03 at @human's ask at that day's sitting: *"can we check in the beyond the playbook features?"*. Every ring description and every entry below is the artifact's text verbatim with the HTML stripped; the status tag the artifact showed beside a title is kept as *Artifact status*. **The `Version:` line under each entry is NOT the artifact's** — it transcribes the ruling recorded in docs/rooms/version-planning.md (2026-08-30, @human: the draft partition approved as written) plus that room's addenda; the room stays the authority and this file is the reading copy.

**The standing rule holds.** This charter is a vision, not a queue: no entry enters the board without a version ruling from @human, and a card born from an entry cites the ruling that admitted it. The in-repo authorities remain docs/research/ai-native-sdlc-playbook-review.md, docs/rooms/loop-customization.md, docs/rooms/team-enablement.md and docs/rooms/version-planning.md; this file adds the text, not a fifth authority.

**One count to know.** The room's partition speaks of 31 entries and a "gift registry (23–31)"; the artifact as read on 2026-09-03 carries 32, with entry 23 (The Kit Is the Product) closing Ring 3 and the registry running 24–32. Ring 3 and Ring 4 are both v3+ under the ruling, so no entry's column turns on the off-by-one — but entry 32 (The Accountability Layer) was never named in a ruling, and its `v3+` below is the ring's, for @human to confirm or move.

---

The AI-native SDLC playbook describes the loop every serious team will run. nputer already runs most of it in stronger forms — **on itself, with the records to prove it**. This charter names the features that close the remaining gaps, productize what nobody else has, and then go past the playbook's horizon: for developers, for teams, for enterprises.

## The five unfair advantages everything below compounds

- **Everything is files in git.** The board, the lanes, the fences, the verdicts, the records — no database, no server, no drift between the tool and the truth.

- **Honesty is mechanical.** Byte-budgeted docs, provenance-stamped figures, gates that refuse — the system cannot quietly claim what it did not measure.

- **The board feeds itself.** Every gate red, band breach, and verdict correction becomes a card with a triage rule — the metabolism.

- **The method ships.** Genesis installs the whole loop into any repository — the kit is the product.

- **It is built by itself.** Every practice below has already survived contact with its own development — dogfooding as evidence, not slogan.

---

## Ring 1 — Close the playbook

The four places the playbook names a practice nputer doesn't have yet. Adopting these makes nputer a complete implementation of the reference — the floor, not the ceiling.

### 01 · Skill Packs

*Artifact status: room open.* **Version: v1** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"); skills into genesis, already building on @human's approval (T-167 done).

Organizations import brand, security, compliance, and UX policy as version-controlled skill packs — in the playbook's own `.claude/skills/<name>/SKILL.md` format, verbatim, so an org's existing skills drop in unchanged. nputer's job is the wiring: genesis and spec-writing sessions load matching skills, and every brief and verdict stamps which skill versions steered it.

**Beyond the playbook:** skills get provenance. The playbook logs versions; nputer stamps them into the ceremony, so "which policy shaped this decision" is answerable per card, forever.

### 02 · Stage Slots

*Artifact status: room open.* **Version: v2** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): stage slots.

Every stage of the loop — execution, verification, integration, testing, triage — exposes named extension points a skill or a project's conventions can fill: extra attack-set sources for the verifier, extra owed gates for the integrator, extra read-first docs for the executor. Customization declares itself instead of editing role files; the hard path (editing the method directly) stays open to experts and is gated by the method's own eval suite.

**Beyond:** the playbook customizes sessions; nputer customizes the process itself, with regression tests over the process change.

### 03 · Customization by Interview

*Artifact status: room open.* **Version: v1** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"); gated only by the customization room's closing sentence, and its card T-173 is size L.

The simple UX is not a settings screen — it is more interview. Genesis asks "does your organization have skills to import? point me at them," banks the answer to disk, and files one auditable card per imported pack. Reversible, reviewable, zero new UI concepts for the common case.

**Beyond:** configuration acquires the same audit trail as code, because it arrives the same way everything arrives — as a conversation that becomes files.

### 04 · Environment Tiers & Rehearsed Rollback

*Artifact status: deferred, honestly.* **Version: v2** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): environment tiers, when services ship.

Development / staging / production gates with rollback as the most-rehearsed path — adopted as the playbook writes them, the day nputer ships running services. Deferred with reasoning on the record, which is itself the playbook's own standard for deviation.

---

## Ring 2 — Productize the edge

Practices already alive inside nputer that the playbook doesn't have — each one battle-tested on nputer's own development, each one a feature no competing tool ships today.

### 05 · Card Preflight

*Artifact status: shipped inside.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

Before any agent seat is paid for, every derivable claim on the work order — paths, fences, figures, blockers, refs — is re-derived against the current tree. A stale claim refuses the dispatch with the discrepancy named. Money is never spent executing yesterday's assumptions.

**Beyond:** the playbook validates the plan once, at approval. nputer re-validates at the moment of spend — and found a real defect on its first pass.

### 06 · Fences & Dispatch Sets

*Artifact status: shipped inside.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

Every task declares what it touches; declarations expand through the architecture into enforced write-fences, checked for disjointness at dispatch and enforced by hooks at every write. The board derives the maximal safe parallel set — which cards can run simultaneously, which collide, and through exactly which files — and prices every card's collision surface before anyone commits to it.

**Beyond:** the playbook's parallel worktrees share "engineer oversight." nputer makes collision mechanically impossible and turns scheduling into a solved derivation instead of a hunch.

### 07 · Proof-of-Teeth

*Artifact status: shipped inside.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

Every guard ships with its killed mutant: plant the defect the test exists to catch, watch the test red, restore byte-exactly with a hash proof. A test that never demonstrated it can fail is a ritual, not a check. Organizations can require drill coverage the way they require test coverage today.

**Beyond:** the playbook prevents weakening tests. nputer proves tests were ever strong.

### 08 · Blind Adversarial Verification

*Artifact status: shipped inside.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

The verifier seat writes its attack plan from the specification alone — before it may read the builder's notes — then attacks. Verdicts carry assigned corrections and measured counterfactuals, not vibes. Separation of duties by construction: the builder of a cage is never its inspector.

**Beyond:** the playbook's review passes read the diff. nputer's verifier is structurally prevented from inheriting the builder's blind spots.

### 09 · Record-First Landings

*Artifact status: shipped inside.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

A merge cannot land without its checkpoint record; a figure cannot appear without its derivation command or ref stamp; a session's own mistakes are stamped into the record beside the rule they broke. The audit trail is not extracted after the fact — the ceremony refuses to complete without it.

**Beyond:** "the audit trail is the commit chain" is the playbook's principle. nputer makes it a gate.

### 10 · Merge Pre-Proof

*Artifact status: demonstrated today.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

Before a branch merges, the exact merge object is built (`git merge-tree`), materialized, object-verified, and the full test battery runs against the merge's actual content — not the branch, not a prediction. The integration answer exists before the integration happens.

**Beyond:** no stage in the playbook tests the merged future. An nputer lane did it this morning, unprompted, because the discipline made it thinkable.

### 11 · Process Vital Signs

*Artifact status: shipped inside.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

Health bands don't just watch production — they watch the method: documentation headroom, gate latency, rejection rates by task size, drift incidents, cold-start pass rates. Every band has a declared keeper and a derivation; a band without a keeper is reported as unkept, loudly, instead of silently trusted. Your SDLC gets vital signs, and a breach lands on the board as work.

**Beyond:** the playbook monitors the product. nputer also monitors the process that builds the product, with the same statistical machinery.

### 12 · The Metabolism

*Artifact status: shipped inside.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

Findings never rot in a backlog. Every suggestion is promoted, parked with a machine-checkable resurfacing condition ("wakes when X lands"), or discharged with the reason on record — and discharged-not-declined is a first-class outcome, so a true finding consumed by other work keeps its dignity and its audit trail. Planning happens at the last responsible moment because staleness is measured, not feared.

**Beyond:** the playbook triages. nputer legislates triage, and its backlog provably cannot silently decay.

### 13 · Seat Economics

*Artifact status: shipped inside.* **Version: v1 as it already is** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): Ring 2 ships as working internals, documented, no productization pass owed for v1; the productization pass (dashboards and surfaces) is v2.

Every card records what it actually cost — tokens, tool uses, minutes, rework cycles, per seat and per model. Model strength is routed from measured evidence (known-versus-try derivations per task shape), and the spend of every stage is a queryable fact. The playbook's metrics framework, with money attached.

**Beyond:** the playbook measures speed and quality. nputer also measures cost per decision, which is the number enterprises actually budget with.

---

## Ring 3 — The horizon

Features no playbook describes yet — each one a natural next step of the five advantages, none of them possible for a tool whose truth lives outside git.

### 14 · Purpose-Drift Signal

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

Every card traces to the north-star clause it serves, and the lineage is computed like the architecture graph: intent → spec → card → diff. When the board's center of gravity drifts from the stated purpose, that drift is a first-class finding on the map — the same way architectural drift already is.

**Why it matters:** teams don't fail by writing bad code; they fail by efficiently building the wrong thing. Nobody instruments that today.

### 15 · Counterfactual Policy Replay

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

When an organization changes a skill — a new security rule, a revised brand voice — nputer replays it against the record: which past verdicts would have flipped, which shipped decisions the new policy contradicts, what remediation the delta implies. A policy change arrives with its blast radius attached.

**Why:** possible only because every decision is a file with its steering context stamped. This is governance no review tool can offer.

### 16 · Fleet Fences

*Artifact status: none shown.* **Version: v2** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): fleet fences / team-enablement.

The fence system crosses machines: a committed claim stamp is the distributed lock, pull-before-dispatch is enforced by the preflight, and every derived reading names its scope — checkout, machine, or fleet. Ten developers and forty agents on one repo, with collisions as impossible across the office as they are across a laptop.

**Why:** one authority inversion away from working — already designed in the team-enablement room.

### 17 · Compliance for Free

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

The record chain renders directly into change-management evidence: who asked, who ruled, what was planned, what was verified, who approved, what it cost — every row provenance-stamped. SOC 2 and ISO change-control exports become a report over files that already exist, not a quarterly archaeology project.

**Why:** everyone else bolts audit onto the process. Here the process is made of audit.

### 18 · The Self-Confessing Eval Corpus

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

Sessions stamp their own slips into the record — the wrong oracle consulted, the ritual step skipped — and every confessed slip drafts an eval case automatically. The tool's honesty about itself becomes the training set that makes the next session better. Incidents already become permanent regression tests; this extends the rule to the agents' own process errors.

**Why:** a loop that documents its own failure modes compounds; one that hides them plateaus.

### 19 · Method SemVer & the Method Marketplace

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

The process itself is versioned, eval-gated, and rollbackable — every method change owes its eval block before it lands. Organizations publish their tuned loops (a fintech's compliance-heavy variant, a game studio's playtest-first variant) as versioned method packs others can adopt, diff, and fork — with the eval suite proving a variant still holds the invariants it claims.

**Why:** the playbook is one document. This makes playbooks a package ecosystem.

### 20 · Rooms & Standing Presence

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

Open questions live in rooms; resolutions are records; agents join the team's channels under their own identity, triage incidents into intents, and escalate to humans only at genuine judgment lines — the playbook's on-call story, grounded in nputer's record discipline so every conversation that decided something becomes a citable file.

### 21 · Competitive Execution

*Artifact status: carded.* **Version: v2** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): competitive execution; carded as T-170, parked on its own trigger.

The same card, two or more assigned models, sibling lanes cut from one checkpoint — with one deliberately shared fence, legal because at most one contender ever merges. A blinded comparative judge applies the card's own criteria identically to every build; the winner merges with full ceremony, and where the contenders diverged is filed as a finding about the card's ambiguity — often the most valuable output. The economics layer names which cards deserve it: the uncertain ones, where paying 2–3× for competing builds beats one attempt plus rework.

**Beyond:** best-of-N with a judge lives in research harnesses. Nobody ships it as a governed SDLC primitive — with fences, records, binding assignments, and the losers' divergences kept as evidence.

### 22 · The Version Table

*Artifact status: @human's idea.* **Version: unassigned** — the room's addendum (2026-08-30, @human's idea, reviewed and adopted) says it builds under the standing rule at a version sitting; no column was ruled.

A planning surface where this charter's own entries — and any feature-shaped card — are dragged between version columns: v1, v2, v3, someday. No new storage and no new concept: versions are milestones, which have lived in card frontmatter since the project's birth. A drag is a proposal the session commits as milestone stamps (the propose-only pen; the stampable-field ruling), and every planning sitting lands as one record with its moves listed (the everything-owes-a-card rule, applied to planning itself). The vision-not-a-queue rule gets its instrument.

**Beyond:** roadmap tools store plans in databases beside the code. Here the plan IS the repository — dragging a card is drafting a commit, and the version history of your versioning is just git log.

### 23 · The Kit Is the Product

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

Genesis ships the entire loop — roles, protocols, gates, drills, bands, skills wiring — into any empty folder, through an interview, in minutes. And the ultimate demo remains permanently public: nputer's own repository, where every feature on this page was forged by the loop it describes, with the records to read.

**Why it wins:** competitors can copy features. They cannot copy a self-hosted proof.

---

## Ring 4 — The gift registry

What the record discipline is secretly building toward. Every entry here becomes possible the moment models get strong enough — and only for a tool whose entire history is legible files. The gifts arrive addressed to whoever kept the records.

### 24 · Retroactive Verification

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

Every new model generation re-audits the entire record chain overnight: every verdict re-attacked, every measured claim re-derived, every drill re-planted by a mind stronger than the one that wrote it. The deltas arrive as findings; the confirmations arrive as a rising tide of confidence with a date on every layer. A codebase's trustworthiness stops being a snapshot and becomes a time series that improves after the work is done.

**Why nputer receives it:** re-verification needs the full inputs of every past decision. nputer is the only tool that kept them.

### 25 · Session Ghosts

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

The two-phase blindness discipline records exactly what every seat was allowed to see. A future system reconstructs any past seat from those recorded inputs — and you can ask it questions: summon the executor of six months ago, in its exact epistemic state, and ask why it chose the shape it chose. Handoff stops being an art; institutional memory stops dying with sessions.

**Why:** the blindness rules were never just fairness — they were unknowingly building resumable minds.

### 26 · Counterfactual Gardens

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

The roads not taken, kept alive. Every ADR's rejected alternative grows in a shadow worktree — maintained, tested, measured against the same suites as the chosen path. "Should we have picked the other design?" becomes a query with numbers, and a decision that ages badly is caught by its own living counterexample instead of by regret.

**Why:** worktrees, fences, and gate batteries already make a parallel world cheap. Future capacity makes a garden of them free.

### 27 · Dream Lanes

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

Idle capacity works the parked backlog overnight — speculative lanes in shadow worktrees, full ceremony, verified and priced but never merged. Morning brings not suggestions but finished options: the board becomes a menu of already-built, already-tested futures, each with its cost attached, and the human's role shifts from approving work to choosing among completed realities.

**Why:** the metabolism's resurfacing conditions already know what's worth dreaming about. The records make every dream auditable — and discardable without loss.

### 28 · Intent Compilation

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

The interview becomes the source code. When card-to-code becomes as reliable as compilation, everything below the record chain is a build artifact: change the north star's answer to Q3, and the delta propagates down through specs, cards, and code as a verified derivation — with the interview never ending, because users' needs keep arriving as banked answers too. The one human-owned artifact left is the conversation about what should exist.

**Why:** nputer already treats the docs as the authority and the code as their consequence. This is that bet, fully paid out.

### 29 · The Proof Economy

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

Every nputer project's drills, mutants, and confessed slips federate into a shared adversarial corpus — anonymized diseases with named cures. New projects are born immune to every failure class the ecosystem has ever caught; verifier models train against the whole fleet's history of being wrong. Herd immunity, for software.

**Why:** proof-of-teeth made failure a first-class, portable artifact. Portable artifacts compound.

### 30 · The Method Breeds

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

Fleets of projects publish their method-eval outcomes; variants that measurably cut rework or rejection rates propagate as proposed method bumps with the evidence attached; variants that decay die with their numbers showing. The playbook stops being a document anyone writes — it becomes a population that evolves, and the best process ever discovered is always one `method upgrade` away.

**Why:** Method SemVer plus eval gates is a genome plus a fitness function. Evolution is the free feature on top.

### 31 · Judgment Scheduling

*Artifact status: none shown.* **Version: v3+** — ruled (docs/rooms/version-planning.md, 2026-08-30, @human: "the draft partition above is approved as written"): entries 14–20 and the gift registry, revisited when v2 lands.

The loop learns where human judgment will be needed before it is — which cards are heading toward an escalation line, which rulings unblock the most downstream work — and schedules it: "your judgment is needed for twelve minutes at three o'clock, here are the three decisions, pre-briefed." The human is never interrupted and never the bottleneck; their scarcest resource gets an optimizer of its own.

**Why:** escalation lines are already named and parked cards already carry wake conditions. Prediction is the only missing piece, and it is the piece models get free.

### 32 · The Accountability Layer

*Artifact status: none shown.* **Version: v3+ by the ring** — never named in a ruling (see the count note at the top); for @human to confirm or move.

The inversion at the end of the road: as models grow past human review speed, the scarce thing stops being capability and becomes legibility. nputer's records, fences, verdicts, and provenance stamps become the harness that makes superhuman engineering auditable — every decision reconstructable, every claim re-derivable, every power bounded by a fence a human once ruled. Today nputer coordinates agents safely. Tomorrow it is the reason anyone can trust what the strong ones built.

**Why this is the golden gift:** every other tool bet on the models. nputer bet on the records — and the stronger models get, the more that bet is worth.

---

## What "ultimate" actually means

Not the most features — the strongest loop. The playbook's own six principles, held mechanically instead of habitually: policy enforced at the write, honesty enforced at the record, judgment reserved for humans at named lines, and a process that measures, versions, and improves itself with the same rigor it applies to code. Everything in Ring 1 has a room and a parked sitting already on the board; Ring 2 needs productization, not invention; Ring 3 is the roadmap after that. And Ring 4 is why the discipline is worth it now: every gift on that list arrives addressed to whoever kept the records.

**This charter is a vision, not a queue.** By @human's standing rule (2026-08-30, recorded in `docs/rooms/version-planning.md`), no entry here enters the execution queue without a version ruling — which features build v1 and which wait for v2 or later is decided at a version-planning sitting, and a card born from this page must cite the ruling that admitted it. Every entry becomes real the same way everything becomes real in nputer: a ruling, a sitting, cards, lanes, verdicts, records.

*nputer · rings 1–4 · sources: docs/research/ai-native-sdlc-playbook-review.md · rooms/loop-customization.md · rooms/team-enablement.md*
