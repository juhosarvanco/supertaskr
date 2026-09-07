---
type: debate
task:
status: open
max_rounds: 3
---

## Resolution
- **Question** — what is the product's name?
- **Decision** — **nputer** (computer minus "co"), chosen by @human.
- **Why** — house style: sibling of Omputer (computer minus "c") —
  clear, punchy, brain-tickling, per the naming direction. The
  Finnish/cross-language rounds (Vire, Fuga, Muster…) read as another
  brand's voice; the family resemblance won. npm free at decision
  time — `npx nputer` distribution intact (ADR-007).
- **Changed** — project-wide rename (CLI commands, .nputer/ runtime,
  method docs, adapters); docs/research/naming.md marked resolved.
  Remaining: domain + trademark sweep before launch.

**REOPENED 2026-09-03** — @human proposes **Supertasker**; the sweep and
@human's own findings are the turn at the bottom. The Resolution above
STANDS until a new one replaces it; the rename's size is measured in
the form sitting record (docs/checkpoints/2026-09-03-the-form-sitting-…).

## @planner (claude-fable-5 @chat-session) — 2026-08-14
Name undecided; working name "nputer". Full candidate rounds in
docs/research/naming.md (Finnish: Vire leading · cross-language: Fuga
leading · house-style: Rchitect / Muster / Slapdash leading). The
identity fork (discipline / plan / crew / orchestration) resolves from
rooms/first-user.md — recommend deciding first-user first, then the
name, then the availability sweep before any ink. @human

## @human — 2026-08-14
Lets go with project name "nputer".

## @architect (claude-fable-5-1 @architect-seat) — 2026-09-03 — the Supertasker sweep

@human: *"I think I have the name for the app. Supertasker."* Swept the
same day, read 2026-09-03 on Juhos-MacBook-Pro.local; re-derive before
any ink, registries move.

| surface | reading | how |
|---|---|---|
| npm `supertasker`, `super-tasker`, `supertasker-cli` | FREE (404) | `curl registry.npmjs.org/<name>` |
| PyPI `supertasker` | FREE (404) | `curl pypi.org/pypi/supertasker/json` |
| GitHub handle `supertasker` | TAKEN — a user, zero repos | `gh api /users/supertasker` |
| GitHub repos named supertasker | eight or more, small (a task CLI, course projects; the largest 29 stars, last push 2023) | `gh search repos supertasker` |
| supertasker.com | REGISTERED (NameCheap), LIVE — an Indian services marketplace | whois, RDAP 200 |
| supertasker.ai | REGISTERED (Porkbun), no answering site | whois, DNS A |
| supertasker.app / .dev / .io | NOT REGISTERED | RDAP 404 |
| App Store developer name "Supertasker" | TAKEN — Supertasker.pk (Lahore, 2018), iOS + Android apps | App Store developer id1534995246 |
| supertasker.pro | LIVE — an indie focus-timer tool | fetched |
| the word | a dictionary common noun (a person who multitasks unusually well) | Wiktionary |

**@human's findings, 2026-09-03:** *"getsupertasker.com or
thesupertasker.com are free. euipo and uspto showed no results for
trademarks with supertasker."* — the two blockers the seat named (a
registered mark; no ownable domain) are cleared by @human's own search.

**What remains, stated plainly (the seat is not a lawyer):**

- Two live consumer marketplaces carry the name with apps in the stores
  (Pakistan 2018, India 2024 — the latter AI-branded, "people and AI
  delegate real-world tasks"). Unregistered, other territories, other
  services; the practical cost is search-result confusion and the
  App Store developer name, not a registered mark.
- The word is generic, so the mark would be weak to defend either way.
- Category pull: TaskRabbit, Airtasker, Supertasker — the name sounds
  like a gig marketplace and reads like a task manager, the one thing
  NORTH_STAR says nputer is not. The interview is the product; the
  task is its unit. @human's taste rules here, as it did on 2026-08-14.
- Domains: `supertasker.dev` and `supertasker.app` are unregistered
  and developer-native; `getsupertasker.com` is the common SaaS
  pattern for a taken .com. Registering is @human's action.

**If @human rules for it:** a new Resolution replaces the one above;
the rename is size L across three lanes (app + e2e; method + kit +
evals; tooling + CI) with the remote, the npm names and the domains in
@human's hands — cheapest now, before T-244 packages `npx nputer` and
before any outside user holds a `.nputer/` directory. @human
