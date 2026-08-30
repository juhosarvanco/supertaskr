---
type: consultation
task: T-168
status: open
max_rounds: 1
---

# Room: what FORM does nputer's customization take?

**THE DECISION BRIEF FOR @HUMAN.** Opened 2026-08-30 by T-168, the card
@human's own ruling cut, and it gates every UI card in the
customization feature. One round: the analysis is below, the questions
are at the end, and the room closes when @human answers them.

The evidence base is `docs/research/customization-ux-benchmark.md` —
tools and open formats read out of their own current documentation on
2026-08-30, each claim carrying the URL it was read from, with that
sweep's limits stated in its own last section. **Count the entries
there rather than quoting a number here**; this brief transcribes no
figure it did not derive. Its lessons are cited as **L-1…L-12** rather
than restated.

**This brief obeys the ruling's prohibition.** It names the SURFACES
each form implies — which files and which screens would exist — and
draws none of them. No mockups, no layout, no visual design.

## The question, in @human's words

From docs/rooms/loop-customization.md, the binding condition on the
two-track sitting:

> before any UI visual design work, the FORM of the customization UX is
> decided from the ground up — is it a config system (files a developer
> edits, the `.claude/`-directory shape) or a setup area inside nputer
> where you write the rules (an in-app surface), or a designed hybrid?
> "The whole way of customization needs to be well designed and thought
> from ground up"

And the directive the room was opened on: customization *simple for
everyone, per-stage deep for professional hardcore developers*, with
organizations able to *import skills (brand, security, compliance, UX)
into a project easily* — for **developers, organizations, enterprises**.

## What is already settled, and therefore binds every answer

These are not arguments in this room. They are the walls it is in.

1. **The loop is already files.** Stages are `method/` role files and
   protocols, the project's law is docs/CONVENTIONS.md, per-card
   overrides exist (`review: independent`), and the kit ships the loop
   into new projects at genesis. Customization is therefore a LAYERING
   question, and the stack, most general first, is
   `method defaults → org skill packs → project CONVENTIONS →
   per-card overrides` (rooms/loop-customization.md).
2. **Files-first, git as truth.** Nothing coordinates except through
   files; no component holds project state the files don't; killing
   anything is safe by construction (ARCHITECTURE, Interfaces).
3. **Auditability is the output, not a feature.** Append-only records,
   provenance-stamped figures, committed verdicts — the
   team-enablement room's finding is that enterprise audit needs
   nothing added here.
4. **The fence is a property at the write.** A card's `touches:`
   expands through one implementation into a dispatch-stamped manifest,
   and the hook refuses writes outside it (T-154, T-160). Any
   customization artifact is inside somebody's fence or it is not
   writable at all.
   **AND NPUTER ALREADY SHIPS ITS STRONGEST GUARANTEE AS A CHECKED-IN
   CONFIG FILE.** `.claude/settings.json` in this repository registers
   the fence as a `PreToolUse` hook on `Edit|Write|NotebookEdit`,
   pointing at `.claude/hooks/lane-fence-hook.mjs` — read in the tree
   at this lane's base commit. That is the config-file school in
   production here today, carrying this project's hardest rule, and any
   form chosen below inherits it as a working existence proof that
   files are a sufficient enforcement surface here. **Its residual,
   named rather than implied (the benchmark's L-9 applied to
   ourselves): the matcher is `Edit|Write|NotebookEdit`, so the guard
   is on those write tools and not on every path a shell could take.**
5. **D3, ruled narrow 2026-08-30 (rooms/cockpit-or-mirror.md).** The
   app may write card frontmatter stamps (`builder:`, `verifier:`,
   `status:`) and APPEND to record-class locations. NORTH_STAR,
   ROADMAP, ARCHITECTURE, CONVENTIONS and `method/` are out of bounds:
   RULE- and TRUTH-tier sentences, and *a program gets no pen for
   them*.
6. **ADR-017's division of labour.** The spawned session is the WRITER;
   the app renders what lands and never believes what a model said.
7. **Follower-first, and the property to defend** (cockpit-or-mirror):
   the repository cannot tell whether a lane was driven from the app or
   pasted into a terminal. Terminal-forever is a hard constraint.
8. **Three audiences, one repository.** Team and enterprise
   participation is already git-mediated; access control rides the git
   host and *should never be built here* (rooms/team-enablement.md).

### The consequence of (5) that the form question runs straight into

Take D3 to the four layers of the stack and read what a program is
allowed to author today:

| Layer | Artifact | May the APP write it? |
|---|---|---|
| method defaults | `method/**` | **No** — D3 names `method/` out of bounds |
| org skill packs | `.claude/skills/<name>/SKILL.md` | **Ungranted** — outside docs/, neither granted nor forbidden |
| project CONVENTIONS | `docs/CONVENTIONS.md` | **No** — D3 names it out of bounds |
| per-card overrides | a card's `review:` field | **Ungranted** — D3 grants `builder:`/`verifier:`/`status:` by name, not this |

So under law as it stands, **an in-app surface that WRITES the rules
can reach none of the four layers without a new ruling** — two are
forbidden outright and two are unaddressed. That is not an argument
against the in-app form; it is the price list. It means "in-app setup
area" is really the question *how much of D3 does @human wish to
reopen*, and the brief has to say so rather than design around it.

## Form (a) — the config system

**What it is.** Customization is files a developer edits, discovered by
convention, layered by a published precedence rule, reviewed as diffs.
nputer ships the layout, the precedence, the validators and the
documentation; it ships no authoring surface at all.

**Surfaces it implies.** `.claude/skills/<name>/SKILL.md` for org packs
in the Agent Skills format; a customization section in
docs/CONVENTIONS.md for project law; `method/` edits for the expert
path, gated by the method-eval `--bump` obligation; the card's own
override fields for the per-card layer. **New screens: none.** New
commands: a validator and an explain command in the `tools/` family.

**For each audience.** Developers get the thing they already know and
can grep, diff, revert and review. Organizations get distribution for
free — a git repository of packs, adopted by commit, versioned by the
host. Enterprises get CODEOWNERS on the pack directory plus branch
protection, which is exactly the benchmark's model of policy-as-file
with enforcement on the host (L-8).

**Strongest argument for.** It is already true. Every invariant above
holds with zero new mechanism, D3 is untouched, terminal-forever is
trivial, the fence needs at most one carve-out, and the benchmark's
whole config-file school says this is what durable developer tools
actually ship. Nothing in this form can ever produce a state the repo
cannot explain.

**Where the benchmark bites.** Every layered file system in the sweep
needed a second tool to answer "which layer won" (L-3), and the most
file-first tool benchmarked still cannot report per-key provenance and
needs seven diagnostic commands (L-4). A pure config system does not
fail at editing; it fails at DISCOVERY and EXPLANATION — the developer
does not know which knobs exist, the organization cannot see what its
pack actually changed, and nobody can answer "why did the verifier do
that" without reading four files in order.

**Cost to the invariants.** None. This is the only form with that
property.

**Open questions it creates.**
- Which file holds project-level customization: a section of
  CONVENTIONS (RULE-tier, gated, human-kept) or a new document? If
  CONVENTIONS, every customization edit is a governing-document edit
  under the byte budgets and the DOCS GATE.
- Does `method/` stay hand-editable for experts, and does the eval
  `--bump` obligation cover a project's LOCAL method edits?
- What does the explain command actually derive from — the same fence
  and parser implementations, or a second reader (T-057's failure
  shape)?
- Does the fence need a `.claude/skills/` carve-out: readable by every
  seat, writable only by an import card? (Already open in the parent
  room.)

## Form (b) — the in-app setup area

**What it is.** A surface inside nputer where you write the rules:
choose stages, fill slots, import org packs, set per-stage depth. The
app is where customization is authored, and something on disk is the
result.

**Surfaces it implies.** A Customization screen with per-stage sections
(executor, verifier, integrator, testing); an Org Packs screen for
import and enable/disable; a per-card override control on the card
panel. On disk: whatever the app is permitted to write. **This is the
form whose cost is (5) above.**

**For each audience.** Developers who do not want to learn a file
layout get the shallow end immediately — this is the strongest case for
the form, and it is @human's own "simple for everyone" clause.
Organizations get an import flow with a button instead of a README.
Enterprises get a place to look at what is configured.

**Strongest argument for.** Discovery. A file-based system's knobs are
invisible until documented, and documentation goes stale; a surface
that ENUMERATES the extension points teaches the loop's shape by
existing. The benchmark's best settings surface earns trust with four
honesty features — published scope order, a modified marker, a filter
listing exactly what you changed, and an escape hatch to the file
(L-4, L-5) — and none of those are available to a system with no
surface at all.

**Where the benchmark bites.** Hard, in three places. First, Linear is
the school's limit case: settings that exist only in the app have no
diff, no blame, no review, no revert, and cannot travel with a branch —
disqualifying for a tool whose premise is an auditable process.
Second, a UI that writes at one layer while another layer decides
produces a click that does nothing, documented as a common support case
by two vendors (L-6). Third, the artifacts nputer would be authoring
are mostly PROSE — role files, CONVENTIONS sentences, SKILL.md bodies —
and a form cannot render prose. What a form CAN render is the schema'd
part, which in nputer is small and enumerable.

**Cost to the invariants.** The largest. It reopens D3 for two
forbidden layers or invents a new writable one; it creates a second
model of the same state (the benchmark's own warning that a settings
menu is not a view of the file); and it puts an app write inside a
fence that a lane may be holding, which is the one collision class the
fence system exists to make impossible.

**Open questions it creates.**
- Which of the four layers does the app get a pen for, and does the
  answer amend D3 or route around it with a new record-tier file?
- What happens when the app wants to write a path a live lane's fence
  holds — refuse, queue, or open a card?
- Does an in-app edit produce a commit, and under whose authorship?
- Terminal-forever: what is the hand-driven spelling of every control
  the screen offers, and who keeps the two in step?
- Does the surface show the WRITTEN value or the RESOLVED one (L-6)?

## Form (c) — the designed hybrid

**What it is.** Files remain the only store and the only truth. The app
is a first-class surface over them — but the sweep shows "hybrid" names
at least two different machines, and the difference decides everything:

- **c1, the symmetric hybrid** (VS Code's shape): the surface reads and
  WRITES the same files a human edits, with the file conceded as the
  store and a door to it on every control the form cannot render.
- **c2, the asymmetric hybrid**: the surface READS, EXPLAINS and
  PROPOSES; a session or the human COMMITS. The app's pen stays exactly
  where D3 already put it.

**Surfaces it implies.** On disk: identical to form (a) — the same
skill packs, the same project law, the same card fields. In the app,
named not drawn: a **Customization lens** that answers, for any
effective rule, WHICH LAYER SET IT AND IN WHICH FILE; an **Org Packs
view** listing what is imported, from where, at which version, and what
it changed; a **stage-0 interview question** at genesis ("does your
organization have skills to import? point me at them"); a **brief row**
naming which packs were active for a seat (provenance); and an **import
card** per pack so the import is a board object with a diff. Under c1,
add a write path with a destination picker; under c2, add a proposal
that becomes a card and a session's commit.

**For each audience.** Developers keep files and gain the explanation
they otherwise build by hand. Organizations get the import flow AND the
PR — the pack lands as a reviewable diff on a branch, which is the only
form in which an org's policy change can be argued with. Enterprises
get the benchmark's actual enterprise pattern: policy as committed
files, enforcement on the git host, distribution through a channel that
can be allowlisted (L-8, L-10).

**Strongest argument for.** It is the only form that serves the
"simple for everyone" clause without spending an invariant, because it
splits the two things the other forms conflate: AUTHORING a rule and
UNDERSTANDING one. The benchmark says the second is where file systems
fail (L-3, L-4) and the first is where UIs fail (L-5, L-6). Nothing
requires the same surface to do both.

**Where the benchmark bites.** A hybrid is the most expensive form to
build and the easiest to let rot into form (b): VS Code's works because
settings are a flat, schema'd key-value space, and Vercel's is
incoherent precisely because authority is decided per property with no
sentence covering the system (L-6). A hybrid without ONE published
authority sentence is worse than either pure form.

**Cost to the invariants.** c2 costs nothing — it is ADR-017's own
division of labour applied to customization, and the repository still
cannot tell whether a change came from the app or the terminal. c1
costs what form (b) costs, in smaller amounts.

**Open questions it creates.**
- Which is it, c1 or c2 — does the app WRITE or only PROPOSE?
- What is the ONE authority sentence (the direction of the stack), and
  is it published where a program can enforce it?
- Which parts of the loop are SLOTS (enumerable: extra gate commands,
  extra read-first docs, extra attack-set sources, `review:` class) and
  which are PROSE? Only the first can be rendered as controls; the
  second gets an editor and an explanation.
- Does the explain lens derive from the same fence/parser
  implementations the gates use, or does it become a second reader?

## The recommendation

**Form (c), in its asymmetric shape — c2. One sentence: the files are
the customization system; the app reads, explains, proposes and routes,
and never authors a rule.**

The reasoning, in the order the arguments actually carry:

1. **D3 is not an obstacle to route around; it is the correct
   architecture, already ruled.** Two of the four layers are RULE-tier
   by construction — project law and the method itself — and @human has
   already decided a program gets no pen for them. c2 is the only form
   that takes that ruling as its design rather than as a constraint to
   negotiate. It needs no amendment to ship.
2. **It is the one form that fixes the failure the benchmark actually
   documents.** Every file-first tool swept grew an explain surface
   because layering is unreadable without one (L-3, L-4), and the most
   disciplined of them still cannot say which file supplied a given
   key. nputer would ship that answer as a first-class lens instead of
   as seven commands accreted over years. This is also the "simple for
   everyone" clause's real content: a newcomer's problem is not typing
   a file, it is not knowing what governs them.
3. **It preserves the property cockpit-or-mirror told us to defend.**
   A proposal that becomes a card and a session's commit is
   indistinguishable on disk from a human editing a file — so follower
   mode is not a degraded mode, and the app never becomes load-bearing
   for a customization somebody else's terminal has to reproduce.
4. **The org and enterprise stories are already solved by it.** An org
   pack is a git repository in the Agent Skills format, which the
   benchmark shows is a genuinely portable standard with a large
   adopter set — so an organization's existing skills drop in
   unchanged, and nputer spends its budget on the WIRING nobody
   standardized (L-7): when a pack applies, whether it binds, and who
   wins a conflict. Enterprise distribution is the git host's, exactly
   as the team-enablement room already concluded, plus one allowlist of
   permitted pack sources (L-10).
5. **It keeps the fence honest.** Nothing in c2 writes into a path a
   lane may hold. A customization change enters the tree the way every
   other change does: a card, a `touches:` line, a fence, a diff, a
   verdict.
6. **The existence proof is already in the tree.** The fence — the one
   rule in this project that nothing may bypass — is delivered as a
   committed `.claude/settings.json` hook. The config-file school is
   not a hypothesis here; it is how nputer's hardest guarantee already
   ships, and the benchmark's enforcement lesson (L-2: settings
   enforce, instructions guide, hooks block) is already obeyed.
7. **It is the cheapest thing that is also the most complete**, because
   the disk layout it implies is identical to form (a)'s. Choosing c2
   is choosing form (a) PLUS a lens and a proposal route — so form (a)
   is not foregone, it is the substrate, and if the app half is never
   built the system still works from a terminal.

**What this recommendation does NOT decide**, and deliberately leaves
to the questions below: the direction of the stack, whether binding-ness
is declared per skill or per layer, whether the app may stamp a
`review:`-class field, and whether a customization change owes a card.

## The strongest counter-argument to the recommendation

Stated as strongly as I can make it, because it may be right.

**"c2 is form (a) with a reading pane, and calling it a hybrid oversells
it."** If the app may not write, then every actual customization act is
still: open a file, type prose, commit. The lens explains a system the
user still has to author by hand — so the "simple for everyone" clause
is not served at all, it is answered with a better manual. A newcomer
who wanted a setup screen gets a diagram of one. And the position goes
further, in its own words: the schema'd, form-renderable part of
nputer's loop is CLAIMED to be small, while the part carrying the real
customization is prose — so a writing surface would be a text editor
with a save button, which the user's own editor already is, and better.
That claim is asserted here, not established; the paragraph below says
what would establish it.

If that is right, the correct answer is form (a) plus the explain
command, no app surface at all, and the design budget goes into the
interview instead — since nputer's genuinely simple path is already
"more interview, not a settings screen" (the parent room's seed 3).

**What would settle it:** count the SLOTS. If the enumerable extension
points across the four stages are few and mostly prose-valued, the
counter-argument wins and the recommendation collapses into form (a).
If they are many and typed — gate commands, read-first document lists,
attack-set sources, ceremony rows, model assignments, review modes —
then a surface has something real to render and c2's proposal route has
something to propose. **That count does not exist yet and this brief
did not invent one**; it is the first thing the next card should
produce, and it is cheap.

## Questions that survive whichever form is chosen

- Override semantics: when an org pack and project CONVENTIONS
  disagree, who wins (the parent room's own open question, and the
  benchmark's most decision-relevant finding — four tools run three
  different directions, each on purpose, L-12).
- Provenance in the ceremony: does a verdict record which packs steered
  the build?
- The fence carve-out for `.claude/skills/`.
- The smallest first slice: wire packs into genesis only, before any
  per-stage slot exists.

## THE DECISION QUESTIONS FOR @HUMAN

Each answerable in one word. **Q1 alone unblocks the UI cards**; the
rest can be answered in the same sitting or deferred to the cards they
gate.

**Q1 — THE FORM.** Config system, in-app setup area, or designed
hybrid?
→ **config** / **in-app** / **hybrid**

**Q2 — THE PEN.** If hybrid: does the app ever WRITE a customization
itself, or only PROPOSE one that a session or you commits?
→ **write** / **propose**

**Q3 — THE SKILLS DIRECTORY.** Does the app get a pen for
`.claude/skills/` (org-pack imports), which D3 neither granted nor
forbade?
→ **yes** / **no**

**Q4 — THE CARD FIELD.** Does a `review:`-class per-card override join
the fields D3 already lets a program stamp?
→ **yes** / **no**

**Q5 — THE DIRECTION.** When an org pack and project CONVENTIONS
disagree, who wins?
→ **org** / **project** / **per-skill**

**Q6 — THE GRAIN.** Is advisory-versus-binding declared per SKILL (in
its frontmatter) or per LAYER (one rule for the whole tier)?
→ **skill** / **layer**

**Q7 — THE ORDER.** Does the explain surface — which layer set this,
and in which file — ship BEFORE any authoring surface?
→ **yes** / **no**

**Q8 — THE AUDIT.** Does every customization change owe a card?
→ **yes** / **no**

**Q9 — THE ENTERPRISE TIER.** Is distribution the git host's job only,
or does nputer ship a managed tier of its own?
→ **host** / **own**

RESOLUTION: none yet — @human's to rule. T-168 is done when this brief
is ROUTED, not when the form is chosen. Track 1 (T-167, wiring packs
into genesis) is form-independent and proceeds regardless; every UI
card in this feature waits on Q1.

RESOLUTION (2026-08-30, @human, all nine ruled the same day the brief landed):
Q1 **hybrid** in the asymmetric shape — files ARE the system; the app reads, explains, proposes, routes. Q2 **propose** — the app never authors a rule; a session or @human commits. Q3 **yes, imports only** — the app may copy a pack in verbatim, every import owing a card. Q4 **yes** — a `review:`-class per-card field joins D3's stampable set. Q5 **drift → card, per-skill interim** — @human's own reframing: harmony is the birthright (packs at genesis, CONVENTIONS grown from them); a LATER disagreement (pack updated, project learned, pack adopted mid-life) is DRIFT, surfaced as a card and never silently resolved, with the skill's own binding declaration deciding which side holds until reconciled. Q6 **per skill** — advisory-vs-binding in each SKILL.md's frontmatter. Q7 **yes** — the explain surface ships BEFORE any authoring surface. Q8 **yes** — every customization change owes a card. Q9 **host** — distribution rides the git host (the team-enablement room's standing answer, unobjected). The UI cards these rulings unblock are cut at a sitting under the version-planning room's standing rule, not automatically.

## REOPENED BY @human, 2026-08-31 — the ruling may not answer the question @human was asking

**@human, verbatim, on being told the form was decided:** *"I dont
think it is. I mean the form of how those rules are edited/customized in
practise. I want it to be easy and simple. I don't want users to need to
open files."*

**THE TENSION, STATED AND NOT RESOLVED HERE.** Q1's ruled answer is the
ASYMMETRIC hybrid: files are the system, and the app reads, explains,
proposes and routes but never authors. That answer settles WHERE THE
RULES LIVE and WHO HOLDS THE PEN. **It does not give a user a way to
customize without opening a file** — under c2 every authoring act is
still open a file, type prose, commit, and the app's contribution is a
better explanation of a system the user still authors by hand. The
room's own brief said exactly this against c2, in the counter-argument
it recorded and did not adopt: *"the 'simple for everyone' clause is not
served at all, it is answered with a better manual. A newcomer who
wanted a setup screen gets a diagram of one."*

So the brief already contained @human's objection, argued, before the
ruling was taken. That is the fact that makes this a reopening rather
than a new question.

**WHAT IS NOT IN DOUBT and should not be re-litigated tomorrow:** Q2
through Q9 are about provenance, imports, drift, binding strength,
ordering and distribution, and none of them depends on who holds the pen
for AUTHORING. The propose-only pen (Q2) is the one that does — it is
the same axis as Q1 and moves with it.

**WHAT THE NEXT SITTING HAS TO WEIGH**, since the brief already did the
analysis: c1 (the symmetric hybrid — the surface WRITES the same files a
human edits, with a door to the file on every control the form cannot
render) is the form that serves *"I don't want users to need to open
files"* while keeping files as the store. Its cost is the one the brief
priced: it reopens D3 for two surfaces and it is the form most likely to
rot into a settings screen unless one published authority sentence
governs the whole stack. **That is a cost, not a refusal** — and it is
@human's to weigh, not a seat's.

**AND THE SLOT COUNT IS NOW LOAD-BEARING RATHER THAN CHEAP HOUSEKEEPING.**
The brief refused to invent it: *"If they are many and typed — gate
commands, read-first document lists, attack-set sources, ceremony rows,
model assignments, review modes — then a surface has something real to
render."* Under c2 that count was interesting. Under a c1 reconsideration
it decides whether an editing surface is even possible, because a form
can only render what is enumerable.

**STATUS: @human deferred this to 2026-08-31's waking hours and
explicitly asked that the night's work be planned without it.** No seat
rules it, and no card is cut from it, until @human returns.
