<!-- Provenance: written 2026-09-12 by the Codex orchestrator (gpt-6-astra) as a standalone product proposal,
     kept here verbatim as the source of docs/rooms/model-and-effort-settings.md on the owner's ruling of
     2026-09-12. sha256 of the original file: fef89cf2fbc13f34… (15,769 bytes). Not an approved ADR or plan. -->

# Model and effort settings: product proposal

12 September 2026 · For owner and architect review · Not an approved ADR or implementation plan

## Product promise

Choose how your development team spends its intelligence. Start with a useful preset, see exactly which model and effort each role will use, adjust it, and save your own version. The same configuration works through the CLI, app and skill, in Claude-only, Codex-only and mixed operation.

The standard of excellence is understandable choices, predictable execution, useful defaults and honest feedback. More switches alone do not establish an industry-leading product. This proposal does not claim a comparative industry benchmark.

## 1. Three independent controls

1. **Profile:** which models perform which roles and which substitutions are permitted.
2. **Effort:** how deeply those selected models reason, with explicit per-role overrides.
3. **Budget:** what further work may start, when to warn, and when to pause.

Provider selection is a separate filter: Claude Code, Codex, or an explicitly allowed mix. Diversity is a model-selection strategy, not a synonym for high effort. High effort does not grant permission to change models, spawn extra reviewers, widen scope or alter the method's tier.

The interface should not combine these dimensions into one ambiguous “quality” slider. Raising effort under Economy must preserve Economy's flagship restriction.

## 2. Preset families and ready-made variations

Show four families initially, with optional variations rather than an overwhelming first screen.

| Family | Model allocation | Initial effort policy | Intended use |
|---|---|---|---|
| Economy | Flagship permitted only for the active coordinator; every other role uses explicitly selected non-flagship models | Coordinator medium; worker roles low or medium where eligible; verification medium or high | Conserve premium-model usage while keeping the complete loop |
| Balanced | Lead model coordinates; capable workers execute; a curated stronger review assignment where warranted | Medium execution; high review on demanding work | General-purpose starting point |
| Quality | Strong models across implementation and review, with independent assignments where configured | High on substantive roles | Difficult work where deeper investigation is worth its potential cost |
| Deep | Strong configured models with the highest explicitly validated effort for the relevant roles | Extra-high or the model's supported deeper setting, shown exactly | Deliberately intensive work; not a promise of better results on every task |

Ready-made variations:

- **Economy / Simple:** one flagship coordinator and one capable worker model for every subagent role. This directly implements the user's simple two-model arrangement.
- **Economy / Lean:** retain flagship coordination; use eligible lighter models for narrow tasks and capable workers for implementation and review.
- **Economy / Thorough:** the same strict non-flagship worker restriction, with higher worker and review effort.
- **Balanced / Simple:** a small, understandable model roster.
- **Balanced / Diverse:** purposeful role assignments across more models; use another allowed provider where the profile requests independent perspective.
- **Quality / Diverse:** strong assignments with explicit review diversity.
- **Deep:** the high-model/high-effort preset, available with either provider or an approved mix.

These are proposed starter definitions, not measured savings or quality rankings. Populate them with concrete model IDs and effort values only after verifying availability and support. A saved preset revision must not silently follow a vendor's changing “best” alias. Offer reviewed preset updates with a visible assignment diff; the user chooses when to adopt them.

Economy is a precise assignment policy: only the active orchestrator/architect coordination role may use its configured flagship set. A separately spawned planner, consultant, executor, verifier, helper or integrator remains a worker for this restriction. Changing a role's label must not bypass it. If an assignment needs a prohibited model, pause and propose an explicit profile or assignment-policy change. Do not silently upgrade.

Users can define which concrete models are premium-restricted in their custom profiles. Supertaskr should not pretend there is one permanent, objective “second best” model.

## 3. Effort controls

At the top of the page, provide a keyboard-accessible stepped **Team effort** control with initial positions such as Lean, Standard, Thorough and Deep. This is a Supertaskr policy control, not a new provider parameter. Each preset revision maps these positions to concrete supported values for its assignments.

Immediately show the assignments it changes. For example, moving Economy / Simple from Standard to Thorough might change a worker from medium to high while leaving the coordinator and all model selections unchanged. The actual mapping belongs to the versioned preset, not an implicit percentile conversion.

Each role row has its own stepped effort control containing only levels supported by that model in that harness and launch mode. Show native names such as medium, high or xhigh; include Default only when its resolution or uncertainty is visible. A model without configurable effort displays “Not configurable,” not a decorative disabled slider with a made-up value.

A role can follow Team effort or use a pinned value. Team adjustments leave pinned roles unchanged and show how many roles are pinned. Switching models requires revalidating effort; never silently clamp an unsupported level or choose the nearest value without making the change explicit.

Use discrete stops, labels, keyboard controls and direct selection rather than a fictional continuous 0–100 scale. The same effort label is not a common unit of compute across providers or even models.

Keep harness modes that enable additional planning or subagent orchestration separate from effort. A setting that changes workflow behavior cannot be hidden at the end of a reasoning slider.

## 4. Screen structure

The ordinary view contains:

- Profile picker with family, variation and user-named saved profiles.
- Allowed providers/harnesses.
- Team effort control.
- A compact assignment table: role, harness, model, effort, inherited/custom indicator and availability.
- “Preview next dispatch,” “Save as…” and “Reset overrides.”

The expanded view adds rules for bounded, standard and guarded work, permitted fallback choices, spending policies, concurrency and version information. Derive roles from the method's actual role definitions; phase-one and phase-two verification remain independently configurable. Do not add another disconnected list of seat names.

Selecting a role reveals why the assignment was chosen and where the setting came from. Keep technical provenance available without making ordinary users read a configuration trace to choose a model.

Editing a built-in profile creates a modified working copy. The user can save it under their own name, duplicate it, export it or restore defaults. Shared exports include model configuration but never credentials. New built-in defaults do not overwrite named user profiles.

## 5. Resolution and predictable changes

Resolve configuration in this order:

**Selected versioned profile → project overrides → role/tier overrides → explicit one-dispatch overrides.**

Global user settings choose a default when a project has no selection; they must not become a hidden extra override over project decisions. Mandatory account restrictions, role eligibility and explicitly accepted budget/model prohibitions validate the resolved result. An ordinary per-dispatch override cannot silently defeat an Economy prohibition.

Use one resolver and validator for all renderers. It returns concrete assignments, their provenance, unavailable capabilities, and explanations for refusal. Profiles are authoritative configuration; attempt records are receipts of resolved assignments and observed execution.

Before dispatch, show a compact preview: role, harness, exact requested model and effort, reason, independent-review arrangement, applicable limits, and unknowns. Existing authorization need not be reconfirmed on every dispatch; previews can be informational. Newly increased spending or a prohibited assignment follows the owner's chosen approval policy.

Save an immutable configuration snapshot with the attempt. Record requested and observed settings separately, including profile revision and an explicit unknown where the harness does not attest to a field.

Editing a profile applies to future dispatches. It does not change active runs. For an active session, a separate explicit action can request a change at the next supported request boundary; where unsupported, park and replace according to the session contract. Resuming an existing attempt retains its pinned assignment unless a deliberate, recorded change is supported and authorized. Never resume a rejected bench as a convenience of the settings UI.

## 6. Budgets and execution boundaries

Expose separate budgets per provider/account. Distinguish raw token usage, API cost estimates, subscription allowance and elapsed time. Do not convert tokens into an exact percentage of weekly subscription usage without an authoritative mapping. Display unavailable balances as unknown.

Useful controls include per-attempt and per-sitting alerts, an allowed premium-model roster, worker concurrency, and a reserve for required verification/closure. A preview should distinguish measured history from a forecast; cold starts and task complexity can change consumption.

Hard prevention and warnings must be labelled separately. A rule can prevent another launch at a known threshold; it cannot promise to prevent all in-flight usage when the harness lacks a corresponding enforced cap or timely telemetry. Do not market monitoring as a strict spending ceiling.

Defaults: no automatic provider, model or authentication-route substitution; no escalation to paid API usage when a subscription is exhausted. Users may configure an explicit permitted fallback chain later, with each transition recorded and revalidated against role independence and profile restrictions. If the adapter cannot control a harness's internal fallback, disclose that eligibility limit and capture reported changes; do not promise an enforceable exact-model rule that the runtime cannot provide.

The strict Economy policy must also cover nested helper sessions where the harness can create them. Use permitted launch configuration to prevent unapproved premium helpers; if unavailable, the adapter cannot label that execution strictly Economy. An effort setting must not quietly activate a harness feature that fans out extra sessions.

Economy still runs the method's required verification. A cheaper model that produces more rework may cost more overall. Raising effort, changing model and authorizing another attempt are separate decisions. A rejected verdict retains its existing consequences regardless of remaining budget.

## 7. Measurement that earns better presets

For each completed card, retain available input, cached-input, output and reasoning-token measurements separately, elapsed time, retries, corrective work and eventual acceptance. Link later escaped defects when supported by evidence. Do not double-count usage already included in aggregate harness reports.

Show observed ranges and sample counts for reasonably comparable work. Initially say “insufficient data” instead of displaying invented savings. Curated presets can ship before a statistically useful dataset exists, provided their intended allocation is stated honestly.

Evaluate total cost of accepted work, not just the first executor response. A high-effort preset earns its place through results, and an economy preset through lower total consumption without unacceptable rework. Neither outcome follows from its name.

## 8. Implementation slices through the existing loop

These are scope proposals, not newly authorized cards or fixed tier estimates.

1. **Configuration contract and resolver:** versioned profiles, concrete role assignments, effort support, precedence and eligibility. Keep method records and their required evaluations within the existing process.
2. **Dispatch integration and CLI:** resolve a profile, preview it, launch with exact settings and preserve the snapshot. Verify native and foreign launches through the shared session contract, including requested versus observed values.
3. **Preset pack:** validate concrete Simple/Economy, Balanced, Quality and Deep mappings for supported single-provider and mixed operation. Avoid expanding to unsupported combinations merely to fill a table.
4. **App and skill renderers:** read the same resolver/schema. Start with accurate preview; editable app controls use the approved command path when available, preserving the current mirror-first decision until that capability lands.
5. **Budget observations and optional policies:** add only measurements and controls the adapters can support honestly. A full scheduler, adaptive routing engine or new daemon is not a prerequisite.

The model capability information can begin as two small validated adapter tables with version/source metadata. Dynamic capability negotiation and a model marketplace are not required. If a capability is unknown, say so and refuse the affected exact guarantee rather than invent support.

## 9. Acceptance examples

- A user selects Economy / Thorough: every non-coordinator assignment resolves to an allowed non-flagship model, including verification and permitted helpers.
- Raising Team effort never changes a model, provider, method tier, number of required sessions or pinned row without an explicit separate action.
- Switching to a model with fewer effort levels produces a visible resolution request, not an unnoticed downgrade.
- A CLI preview and the app show identical resolved assignments for the same configuration revision.
- Changing a saved profile leaves active attempts and their records unchanged.
- A quota failure cannot select another account, provider or billing route automatically unless an explicit permitted fallback policy authorizes it.
- A missing model/effort capability makes the affected assignment unavailable with a concrete explanation.
- A method-required independent verifier remains independent under every preset.
- Preset updates display a diff and leave user-named profiles untouched.
- Cost feedback distinguishes measured totals, estimates and missing data.

## Evidence behind the design

The following sources were read on 12 September 2026. They inform adapter validation, not universal defaults or model rankings.

- [Claude Code model configuration](https://code.claude.com/docs/en/model-config#adjust-effort-level): effort support and effective values vary by model/configuration; documented unsupported-level fallback means Supertaskr must validate before promising an exact setting. The documentation also distinguishes workflow-changing modes from pure effort and notes that equal effort names are not equal underlying values.
- [Codex configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference): effort is a separate configuration parameter with model-dependent support. Documentation and installed runtime can differ; concrete preset compatibility must be verified against the selected launch surface.

No existing model settings, cards, records, lanes or checkouts were changed. This standalone proposal is for review and refinement before implementation authorization.
