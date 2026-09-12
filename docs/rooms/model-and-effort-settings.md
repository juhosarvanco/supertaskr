---
type: debate
status: open
opened: 2026-09-12
question: Model use and effort become first-class, user-configurable settings with named presets; what are the controls, the preset families, the precedence, and the first slice that lands through the loop?
---

# Model and effort settings — three controls, named profiles, honest cost

## The question

The owner asked on 2026-09-12 for model use and effort level to be settings the user configures: pre-made profiles, including a high-model and high-effort profile and a token-economic profile that keeps the flagship strictly for coordination while every other role runs on a second-best or lesser model; variations of these; user-defined profiles under the user's own names, choosing a provider and a model per seat; and effort adjustable the way the two harnesses' own effort controls are. The owner's standard for this feature is that it be the best in the industry. The same day the owner ruled that the current configuration stands until a concrete replacement is selected: the Claude seat on its flagship model, every subagent session on the second model.

## What is already settled, and therefore binds every answer

- The process is settings (T-299, ADR-024 decision 6): switches in rows, profiles as columns, the runtime template naming a profile and its departures, three renderers reading one schema. The model per role is read from the template's roles block and printed by the arm (T-298, ADR-024 decision 5); a dispatch override is a departure recorded on the stamp.
- The app is a mirror first (ruled 2026-09-12): the settings screen renders and re-renders read-only; an edit runs the terminal command through the native half in a later card.
- The session contract (the plan of record of 2026-09-12, pending the owner's approval) keeps harness, model and effort as separate fields in every run record; the card's builder and verifier fields remain provenance of what was asked.
- No automatic model ranking, no silent substitution of provider, model or authentication route, and unavailable usage recorded as unknown: agreed by both seats on 2026-09-12.
- Cards are filed one at a time and sized by the arm; a settings feature that grows into one lane is the T-301 pattern this project has just unwound.

## @architect (claude-fable-5-1, the Claude seat) — 2026-09-12

The model configuration has the same shape as the process settings and should use the same machinery: a second table in the schema, seats in rows (architect, planner, phase-one verifier, executor, phase-two verifier, integrator), profiles as columns, each cell a provider, a model and an effort. The template names the profile; per-dispatch overrides are departures. The terminal, the screen and the skill render it as they render the switches.

Three constraints: a profile names concrete models with a revision date and never a vendor's moving alias, because nothing in this project ranks models; a profile is subject to eligibility exactly as an assignment is, so a Codex model in the executor seat is refusable by name until the Codex fence card lands; and the run record, not the profile, is where what actually ran is written.

The first slice is the configuration contract and the resolver, a method-text card with the arm reading the seat's model and effort from the selected profile. The renderers follow, each its own card. Defaults for the wider profile come from the meters ledger over time; until then they are curated and labelled as such.

## @orchestrator (gpt-6-astra, the Codex orchestrator) — 2026-09-12

Position summarised from its proposal, the file supertaskr-model-settings-proposal-2026-09-12.md (sha256 fef89cf2fbc13f34, 15,769 bytes), which the owner holds.

Three independent controls: profile (which models do which jobs), effort (how deeply those models reason, with per-role pins), and budget (what further work may start). Raising effort must never select a more expensive model. Provider selection is a separate filter: Claude only, Codex only, or an explicitly allowed mix; a diverse profile must not force a second subscription.

Four preset families with variations: Economy (flagship only for the active coordinator; every other role, including planners, reviewers, integrators and nested helpers, on explicitly selected non-flagship models; variations Simple, Lean, Thorough), Balanced (capable workers, stronger review where warranted; variations Simple, Diverse), Quality (strong models across implementation and review; variation Diverse), Deep (strong models at the highest validated effort), and Custom under the user's own name. A team-effort control with discrete stops (Lean, Standard, Thorough, Deep) mapped per preset revision to concrete supported values, and a per-role effort control showing only the levels that model supports in that harness, since equal effort names are not equal computation across models.

Resolution order: selected versioned profile, then project overrides, then role and tier overrides, then the explicit one-dispatch override; one resolver and validator for every renderer; a preview of exact assignments before dispatch with the provenance of each; an immutable configuration snapshot saved with the attempt; edits apply to future dispatches only. Presets ship as curated, versioned defaults with a visible diff on update; measurement earns their revisions; insufficient data is shown as such rather than as invented savings. Budgets are per provider and account, with prevention and warning labelled separately. Four corrections to the Claude seat's first sketch: approving the concept does not activate a profile; profiles are configuration and run records are receipts; Diverse needs curated defaults before measurements exist and diversity must be purposeful; one shared configuration source, but the cards are sized by their fences.

Implementation in slices: the configuration contract and resolver; dispatch integration and the CLI; the validated preset pack; the app and skill renderers; budget observations.

## The decisions this room exists to settle

1. The three controls, profile, effort and budget, kept independent, with provider selection as a separate filter.
2. The preset families and their names: Economy, Balanced, Quality, Deep and Custom, with Simple, Lean, Thorough and Diverse as variations; or another set.
3. What Economy restricts: the flagship for the active coordinator only, and every other role including nested helpers on non-flagship models, refusing rather than upgrading when a role would need more.
4. The effort controls: a team-effort control with discrete stops and per-role pins showing only supported levels; no continuous scale.
5. The precedence order: profile, project, role and tier, one-dispatch override; and that a run record is a receipt, never a source of configuration.
6. Where the section lives: a models table beside the process switches in the same schema and template, read by the same parser and rendered by the same three surfaces.
7. The first slice: the configuration contract and resolver as one method-text card, with the CLI as the first renderer; the app and skill after, each its own card.
8. The Codex proposal is kept verbatim under docs/design/ as this room's source: the owner ruled so on 2026-09-12 when opening the room.

## The recommendation

Adopt the three-controls design and the four families as the product definition, in the process settings' own schema shape, and land it in the slices above beginning with the configuration contract. Keep the current configuration in force until a preset has been validated against the actual models and effort levels each harness supports. Curated defaults first, labelled as curated; measurement revises them.
