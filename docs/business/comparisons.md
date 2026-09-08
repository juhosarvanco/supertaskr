# Comparisons — why nputer, class by class (draft skeleton, 2026-09-08)

The source for the website's "why use nputer instead of X" pages. Asked
for by @human on 2026-09-08 (*"Should we create a doc where we collect
features and ways in which we are better than our competition?"*) and
owed since 2026-08-30 by docs/business/marketing.md's open-work line
("the comparison-page plan") and docs/business/plan.md's launch phase
("honest 'nputer vs X' comparison pages — re-verify all vendor claims
before publishing — they churn monthly").

## The rules this file is under

1. **Every claim traces to docs/research/competitors.md** — the map is
   the evidence, this file is the copy. A row here carries the map's
   read date; a row with no map entry is marked NOT YET MAPPED and
   cannot be published.
2. **Re-verify before publishing.** Vendor pages churn monthly; the
   map's open items name the claims most likely to flip (Rovo Dev
   gaining a blocking mode would break the "binding" clause).
3. **Never generalise one competitor's restraint into a category gap**
   (the map's negative lesson: Linear declined accountability in
   writing; Atlassian did not).
4. **Say what they do well, in their words, before saying where they
   stop.** A comparison page that cannot name the other side's
   strength is not honest and will not rank.
5. **The official route is always a named alternative** (Ring 0:
   Claude Code agent teams, the Codex app, Cursor background agents).
6. **The applause-metrics exclusion applies** (NORTH_STAR): stars are
   context, never the argument; "acted, not liked" is the bar.

## The claim, as ruled (marketing.md M3, @human, 2026-08-30)

> One interview turns your idea into a fenced, criteria-bearing
> board; agents build it in parallel lanes that cannot collide; a
> different model — denied the builder's reasoning — returns a
> binding verdict on every card; and the whole history lands as
> records in your repo. nputer runs the entire AI-native SDLC, and
> built itself with it.

The four clauses of the narrowed claim (map conclusion 1), each of
which must exclude a named competitor to be worth writing: **a
different model** · **denied the builder's reasoning** · **a binding
verdict that stops the merge** · **a file in your repo**. Supporting
clauses: safe parallelism (the fence at the write), never in the
inference billing path, the self-hosted proof, data ownership.

## Class 1 — trackers that grew agents (Linear, Jira, Plane, Notion)

| | what they do well | where they stop short of the claim | map reading |
|---|---|---|---|
| **Linear** | the best product in the class; AgentSession protocol with typed states; Linear Agent (AI PM, triage, grooming) shipped from the Free tier | issues assign only to humans; "an agent cannot be held accountable"; no acceptance criteria, no verifier, no rejection path — fails "binding" and "denied the builder's reasoning" by their own stated non-goals | 2026-08-30 |
| **Jira / Rovo Dev** | the only one contesting the differentiator: checks PR code against the work item's criteria, per criterion, met / missing / needs manual checking | same vendor plans, builds and reviews (not a different model, not denied the reasoning); no blocking, no merge stop (not binding); criteria are prose fields; discovery brittle; paid tier only | 2026-08-30 |
| **Plane** | AGPL, self-hosted and air-gapped editions; agents assignable and @mentionable; MCP server; owns the data-ownership argument | a database, not files (an agent needs an API round trip where ours runs `cat`); AI metered as credits on every tier — in the billing path NORTH_STAR forbids; no verdict of any kind | 2026-08-30 |
| **Notion** | NOT YET MAPPED — @human named it 2026-09-08; the map has no entry, so no row can be written | — | — |

What to lead with here: the verdict and the fence. What not to lead
with: data ownership (Plane owns it) or the board (do not be a fourth
tracker — map negative lessons).

## Class 2 — skills frameworks for the agent CLI (Superpowers, GSD, gstack)

VERIFIED 2026-09-08 under T-245 (built by the architect seat at
@human's instruction, no lane): every row below is read from the
project's own agent prompts, hooks and workflow files, named in the
competitor map's Ring 2 addendum. Star counts: `gh api
repos/<owner>/<repo> --jq '.stargazers_count'`, read 2026-09-08. **The
honest line for this class:** their verifier is TOLD not to trust the
builder; ours CANNOT read the builder — an instruction versus a
mechanism — and that is a sentence any of them can close in one
release, so the pages must also carry what they cannot copy in one:
the fence refused at the write, the record that keeps itself honest,
the map, the rejection corpus.

| | what they do well | where they stop short of the claim | reading |
|---|---|---|---|
| **Superpowers** (obra/superpowers, 282,947 stars) | auto-triggering skills; Socratic brainstorm to spec; worktree per branch; fresh implementer subagent per task with a task review that is told "Do Not Trust the Report"; TDD enforced; on the official Claude and Codex marketplaces; 14 harnesses | the reviewer READS the implementer's report (an instruction, not a denial); its model is chosen per role inside one harness (not a different vendor by construction); the verdict binds the orchestrator's loop only, nothing refuses a merge; the ledger, briefs and reports are DELETED when the final review is clean — no verdict survives in the repo | 2026-09-08, `task-reviewer-prompt.md`, `subagent-driven-development/SKILL.md` |
| **GSD Core** (open-gsd/gsd-core, 9,217; the archived original 64,580) | the closest neighbour we have: `.planning/` committed with PROJECT, REQUIREMENTS, ROADMAP and STATE.md; fresh-context executors in waves with worktree isolation hard-blocked by a hook; a plan-checker; an ADVERSARIAL verifier ("assume the phase goal was not achieved … falsify the SUMMARY.md narrative") writing a committed VERIFICATION.md; a ship step that refuses anything but `passed`; reviewer instances across Codex, Gemini, OpenCode and Ollama; per-phase model tiers; a package-legitimacy gate, a prompt-injection scanner and a secret read guard | the verifier is NOT denied the builder's notes — it reads SUMMARY.md and is told to distrust it; its model is Sonnet in every default profile, the executor's tier and vendor — a different vendor is a config, not the design; the binding lives in the ship WORKFLOW file, a raw `git push` is not refused, and on Claude Code's autonomous path the verify step itself is silently skipped unless a default-off BETA capability is enabled (their own doc, read 2026-09-08); plans name their files and worktrees isolate, but nothing proves two plans disjoint or refuses a write outside the plan; no derivation-stamped figures, doc budgets, health bands or killed mutants | 2026-09-08, `agents/gsd-verifier.md`, `workflows/ship.md`, `hooks/gsd-agent-isolation-guard.js`, `docs/CONFIGURATION.md` |
| **gstack** (garrytan/gstack, 132,009) | 23 role skills: office hours (six forcing questions), CEO and eng review, review, QA in a real browser, OWASP+STRIDE audit, ship, deploy, canary, retro, memory; an OUTSIDE-model review by default — every diff gets a Claude subagent and a Codex pass, with an honest "same model family" line when Codex is missing; a one-directory edit lock | the review is advisory — it "never blocks" and `/ship` opens the PR without reading any review result; the reviewers read the diff in the same session's context, nothing is denied; the record is a decision log and telemetry, not a per-change verdict file in the repo; the lock is manual and per directory, not derived from the work | 2026-09-08, `review/sections/adversarial.md`, `ship/SKILL.md` |

What to lead with here: they have converged on our shape (file-based
state, fresh-context seats, plans naming files and criteria, an
adversarial verifier) — which is the argument that the shape is right
— and none of them has a verifier that CANNOT read the builder, a
fence that is proved disjoint and refused at the write, or a record
that keeps itself honest. What to concede, in their words: install,
breadth (browser QA, security audits, deploy and canary, memory),
community, lighter ceremony for small work — and, for GSD Core, a
verifier that is adversarial and a ship step that is binding. Never
write "they have no verdict"; it stopped being true in 2026.

## Class 3 — agent apps and boards (defract, Conductor, Vibe Kanban, Nimbalyst)

| | what they do well | where they stop short | reading |
|---|---|---|---|
| **defract** | a desktop app, local-first, bring-your-own Claude: story → HTML mockups → architecture → parallel worktree agents → review → release; pitches "the app instead of a skills stack" | as far as a product site shows (no repository to read): no verdict, no fence beyond the worktree, no planning interview producing governing docs, no architecture map; Claude-only today | 2026-09-08, defract.dev only (T-245) |
| **Conductor / Vibe Kanban / Nimbalyst** | polished parallel-session boards; Vibe Kanban had the most stars in the category | all start AFTER someone decided what the tasks are; category mortality — the two highest-starred died or went dormant in 2026 with traction | 2026-08-30 |

## Class 4 — spec methods (Spec Kit, Kiro, agentplane)

| | what they do well | where they stop short | reading |
|---|---|---|---|
| **GitHub Spec Kit** | the open, agent-agnostic SDD standard-bearer; constitution.md; 30+ agents | discipline without the interview, the rooms, or multi-model session control | Aug 2026 (not re-verified) |
| **AWS Kiro** | spec-first IDE; EARS-native; SMT contradiction checking on requirements | same | Aug 2026 (not re-verified) |
| **agentplane** | the nearest architectural neighbour: repo-local task files, machine-readable change records, git as the review surface | no adversarial verifier; recovery hands control to a human, not a second model; criteria not first-class | 2026-08-30 |

## Class 5 — planning tools (ChatPRD, Figr)

| | what they do well | where they stop short | reading |
|---|---|---|---|
| **ChatPRD** | the existence proof for a paid interview: a sitting CPO's craft, >100k PMs, $15/mo | the document ends where our pipeline begins | Aug 2026 (not re-verified) |

## Owed before any page ships

- T-245 LANDED 2026-09-08 (Class 2 verified from the projects' own files; defract from its site only).
- Notion mapped, or dropped from the page list.
- The timed genesis run exists (the "30 minutes from idea to a fenced
  board" claim counts only once it is measured — map, supporting moves).
- A rename, if ruled in docs/rooms/naming.md, before any copy is written.
