# superpowers (obra), pinned b36e082 — the loop, measured

Read-only at `scratchpad/superpowers`. Sizes from `wc -c`. Bare `:N` = a line in `skills/subagent-driven-development/SKILL.md` (SDD).

## 1 The loop, start to finish

| Stage | Trigger (quoted) | Does | State artifact | Review | Stops a false "done" |
|---|---|---|---|---|---|
| 0 Bootstrap | `hooks/hooks.json:5` matcher `startup\|clear\|compact` | injects all of `using-superpowers` (`hooks/session-start:27`) | context only | — | `using-superpowers/SKILL.md:11`: 1% chance ⇒ must invoke |
| 1 Brainstorm | `brainstorming/SKILL.md:3` "before any creative work" | classify spike/bounded/architectural (`:22-49`) | chat, or `specs/…-design.md` (`:206`) | human approves each section (`:99`) | `<HARD-GATE>` `:14`: nothing before approval |
| 2 Plan | `writing-plans/SKILL.md:3` "before touching code" | right-sized tasks, TDD steps with real code | plan doc: `Global Constraints` (`:72`), `Interfaces:` (`:92`) | self-review checklist (`:141`) | `:131` "No Placeholders" — a TBD is a plan failure |
| 3 Worktree | `using-git-worktrees/SKILL.md:3` "before executing implementation plans" | detects `GIT_DIR != GIT_COMMON` | worktree + green baseline (`:121`) | — | dirty baseline ⇒ human decides (`:130`) |
| 4 Execute | `:3` "plans with independent tasks" | `task-brief` → implementer → `review-package` → reviewer | ledger `progress.md` + briefs/reports/diffs in `.superpowers/sdd/<plan>/` (`:136`) | 1 reviewer, 2 verdicts | `:312` never accept "a report missing either verdict" |
| 5 Fix loop | `:356` "spec ❌, any Critical or Important finding" | R1-3 resume implementer; R4-5 fresh, tier up | same report file, appended | scoped re-review: ADDRESSED / NOT | 5-round breaker `:373`; `:429` "a silent discard is forbidden" |
| 6 Final review | all tasks done | one whole-branch review, top model | package over `merge-base..HEAD` | 1 reviewer, 1 fix wave, 1 re-review | `:467` "There is no second fix wave" |
| 7 Finish | `finishing-a-development-branch/SKILL.md:3` "complete, all tests pass" | rerun suite, 3-option menu, clean up | git history; workspace `rm -rf`'d (`:483`) | human picks merge/PR/keep | `:18` "the menu comes after a green suite" |

Commits are the only durable state; scratch is git-ignored (`sdd-workspace` writes `printf '*\n' > "$base/.gitignore"`). Before deletion the controller lists every ruling under "Rulings I made" (`:475`).

## 2 The subagent model

- One task, never the plan: `:262` forbids making "a subagent read the whole plan file"; `scripts/task-brief PLAN N` awks the block to a file (`:252`). Dispatch = placement line, brief path, earlier interfaces, ambiguity resolutions, report path.
- Fresh context per task: `:10`, subagents "should never inherit your session's context or history." Measured failure `:269` — a dispatch "hit 42k chars of which 99% was pasted history."
- Results as files: full report to `task-N-report.md`, reply "ONLY (under 15 lines…)" (`implementer-prompt.md:140`). Reviewer reads `review-package`'s file — "The output never enters your own context" (`:320`).
- No parallel implementers (`:282`); parallelism is for independent debugging only (`dispatching-parallel-agents/SKILL.md:77`).
- Four statuses — DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED (`:288`); BLOCKED ⇒ more context, stronger model, smaller task, or a ruling. "**Never** ignore an escalation" (`:302`).
- No nested subagents — "every reviewer a worker spawned duplicated the task review" (`:275`).
- Controller keeps plan shape, ledger, rulings, interfaces, reviewer reports; never fixes code (`:408`).

## 3 Token economics — measured

**Standing cost.** `hooks/session-start` injects `using-superpowers/SKILL.md` (3,108 B) + 226-char wrapper = **3,322 chars ≈ 830 tokens**. Discovery is description-matched, not an always-loaded list: only 14 frontmatter blocks stay resident, **2,434 chars ≈ 608 tokens**. Standing total ≈ **1.4K tokens** — shrunk deliberately in v6.1.0, "its size is paid for constantly" (`RELEASE-NOTES.md:87`).

**Load-on-trigger** (`wc -c skills/*/SKILL.md`): 14 skills, 138,578 B, from executing-plans 2,305 to SDD 32,339 (brainstorming 15,456; debugging 9,465; TDD 9,015; finishing 7,781; worktrees 6,813; verification 3,646). Nothing loads unless its description matches.

**Re-read per task:** the plan is read once, ever (`:156`); thereafter each task yields a brief, a report and a diff file, each read by a *subagent*, not the controller.

**Small change, arithmetic.** A small change takes the **bounded** path — no spec, no plan doc, no SDD (`brainstorming/SKILL.md:92`, "no plan document"). Skills loaded: 3,108+15,456+9,015+3,646+6,813+7,781 = **45,819 B ≈ 11.5K tokens**, one seat, zero subagents. With ~20-40 turns re-billing a 30-60K context: **≈0.6–1.5M cumulative billed tokens** — the whole cost.

**Full SDD plan, measured** (`docs/superpowers/specs/2026-06-10-strict-cost-sdd-design.md:12`, **~$13/run**, 10-13 tasks): controller ~$6-7 (~150 turns, "46% thinking/narration"); implementers ~$5-6 (~25 turns, ~13 pre-edit exploration calls each); reviewers ~$1-1.5; final review ~$1 ⇒ **≈$1/task**. At Sonnet input rates (~$3/M): ~$0.45/implementer ≈ 120-150K tokens, ~$0.12/reviewer ≈ 40K ⇒ **≈150-200K tokens/task**. *That conversion is mine; the corpus commits dollars, not tokens.*

**Keeping the controller small:** files not pastes ("A pasted diff parks itself permanently in the most expensive context", `RELEASE-NOTES.md:151`); the ≤15-line return; a named model per dispatch, since an omitted one inherits the session's — one run put all 26 reviewers on the top tier (`:152`); no controller fixes; bounded waits (`references/codex-tools.md`).

## 4 Safety — enforced vs stated

**Enforced: almost nothing.** Grepping every manifest and hook dir for event names returns only SessionStart ×4, Cursor/Kimi `sessionStart`, Hermes `pre_llm_call`, pi `session_compact`/`resources_discover`. No PreToolUse, no write gate, no path fence, no CI (`find .github -type f` = issue/PR templates only). Scripts enforce three narrow things: `review-package` rejects a bad BASE/HEAD (`git rev-parse --verify … || exit 2`), `task-brief` exits 3 on a missing heading, `sdd-workspace` self-ignores.

**Stated in skill text — the real control surface:**
- False completion: `verification-before-completion/SKILL.md:17` "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"; its table (`:40`) demands a VCS diff for "Agent completed", rejecting "Agent reports 'success'" (`:47`).
- Destructive git: the literal typed word `discard` (`finishing-a-development-branch/SKILL.md:143`); "Never `--force` on your own initiative" (`:179`); force-push only on explicit request (`:225`).
- Writes outside the tree: convention only — "Another plan's directory is never yours to read or write" (`:140`). Nothing checks.
- Skipped tests: implementer reports RED/GREEN (`implementer-prompt.md:133`); reviewer must "Do Not Trust the Report" (`task-reviewer-prompt.md:64`) yet must **not** re-run the suite (`:74`) — evidence is asserted by the party with the incentive to assert it.
- Autonomy bound: four stop conditions and only these (`:27`) — irreversible/destructive op, security-sensitive action, side effect outside the worktree, a plan where "every path forward is a guess."

**Per harness:** hooks for Claude Code, Cursor, Copilot CLI, Antigravity, Factory Droid, Grok. Codex has no session-start hook — `.codex-plugin/plugin.json` declares `"hooks": {}` to suppress auto-discovery. Gemini, Kimi, Devin, OpenCode, pi, Hermes are text-only. Enforcement is identically zero everywhere; only delivery differs.

## 5 Quality

- **Order:** per task one reviewer, two verdicts — spec compliance (`task-reviewer-prompt.md:94`) then code quality (`:115`). Two reviewers became one in v6.0 for cost: "one fix pass clears both" (`RELEASE-NOTES.md:148`). Then one whole-branch review on the top model. Re-reviews scoped — "Do NOT re-review code the fix did not touch" (`re-review-prompt.md:58`).
- **Independence, by prose only:** read-only; no re-running tests; no crawling — "one focused check per named risk" (`task-reviewer-prompt.md:46`); "a stated rationale never downgrades a finding's severity" (`:71`); batches checked file-by-file (`:105`); plan-mandated defects still reported (`:155`). Controller may not coach — "do not flag" means "stop: you are pre-judging" (`:342`).
- **TDD:** `test-driven-development/SKILL.md:34` "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST"; code written first is deleted, not adapted (`:37`). Held by a rationalization table, Red Flags, the plan's five-step template, the RED/GREEN block. Nothing mechanical verifies the red happened.
- **Debugging:** `systematic-debugging/SKILL.md:17` "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"; after three failed fixes, "If 3+ Fixes Failed: Question Architecture" (`:198`).
- **"Verified" carries** the command, full output, exit code, and "file:line references for every finding" (`task-reviewer-prompt.md:135`).
- **Skills tested as code:** `writing-skills/SKILL.md:36` maps "Test fails (RED)" to "Agent violates rule without skill"; pressure scenarios combine "time + sunk cost + exhaustion" (`:406`). Evals sit in another repo, "not part of CI today" (`docs/testing.md`).

## 6 The fourteen harnesses

| Harness | Mechanism |
|---|---|
| Claude Code | manifest + convention-discovered `hooks/hooks.json` → `session-start`; `hookSpecificOutput.additionalContext` |
| Cursor | `.cursor-plugin/plugin.json` names `./skills/` + `hooks-cursor.json`; same script, `additional_context` |
| Copilot CLI | same hook; `COPILOT_CLI` env picks top-level `additionalContext` (`hooks/session-start:45`) |
| Antigravity | installs the Claude Code plugin as-is, runs its hook; adds only a tool map (`tests/antigravity/test-antigravity-tools.sh:3-5`) |
| Factory Droid | Claude Code plugin via `droid plugin marketplace add` — "needs no new files here" (`porting-to-a-new-harness.md:128`) |
| Grok Build CLI | xAI marketplace against the same Claude Code manifest; no repo-local scaffold |
| Codex App / CLI | `.codex-plugin/plugin.json` + `.agents/plugins/marketplace.json`; **no session-start hook** — native discovery + `codex-tools.md` |
| Gemini CLI | `gemini-extension.json` `contextFileName` → `GEMINI.md`, two `@`-includes |
| Kimi Code | manifest `sessionStart.skill: "using-superpowers"` + 1,961-char inline `skillInstructions` |
| Devin CLI | skills only; Devin surfaces name+description in its system prompt — no hook (`tests/devin/test-devin-plugin.sh:3-7`) |
| OpenCode | `config` hook registers skills; `messages.transform` prepends to the first user message — system messages caused "token bloat … repeated every turn" (`RELEASE-NOTES.md:318`) |
| Pi | `resources_discover` registers skills; `context` injects, re-armed on `session_start` and `session_compact` |
| Hermes | `pre_llm_call` returning `{"context": …}` on `is_first_turn`; README warns compaction loses the bootstrap |

**Without a hook, a harness loses** guaranteed pre-first-response injection: "**The bootstrap is the entire integration.** Without it, the skill files are inert" (`docs/porting-to-a-new-harness.md:53`). Acceptance test = one prompt, "Let's make a react todo list" (`CLAUDE.md:80`). Codex and Devin survive with zero injection — the harness itself surfaces skill descriptions.

## 7 Compared with supertaskr

| Stage | superpowers | supertaskr |
|---|---|---|
| Standing read | ≈ **1.4K tokens** | the five mandated docs = **242,673 B ≈ 61K tokens** (CONVENTIONS 138,421 B; CAPABILITIES 74,270 B) |
| Design | three paths; bounded = chat design, no documents | every change is a card in `docs/tasks/` (686 exist) with a fence |
| Plan | plan doc only on the architectural path | the card is always the plan |
| Scope control | prose — "don't restructure things outside your task" (`implementer-prompt.md:73`) | **fence, enforced by a write hook** |
| Build | 1 implementer, fresh, brief-only | 1 executor, brief + context pack |
| Review | 1 reviewer that **reads the implementer's report** | blind 2-phase verifier: attack set from the card, then diff + mutants |
| Fix | ≤5 rounds, resume implementer, scoped re-review | corrections assigned as committed test bodies |
| Merge | human picks from a 3-option menu | architect ritual: re-drill, census, code graph, version bump |
| Final gate | full suite once, in-session; **no CI in the repo** | four-suite battery + CI ~36 min |
| Record | git history; workspace deleted | checkpoints, census, graph, ADRs, rooms |
| **Cost / small change** | bounded: ~11.5K tokens, 1 seat, 0 subagents. SDD: **≈$1/task ≈ 150-200K tokens/task** | **~520K subagent tokens** per size-S card (221K + 58K + 244K); **~310K verifier alone** with a fix pass |
| **Wall clock** | 31-41 min for a whole multi-task run (`strict-cost-sdd-design.md:162`) | **~2.5 h** per size-S card (29+51+15+30+36 min) |

The decisive difference is not seat count: superpowers has **no fixed floor**. A bounded change pays 11.5K tokens and one seat; ours pays the standing read, three subagents and a merge ritual regardless of size.

## 8 What superpowers does NOT do that we do

| Ours | Their cover | Saving or risk |
|---|---|---|
| Fence | prose only (`implementer-prompt.md:73`) | **Risk.** Batches checked file-by-file (`task-reviewer-prompt.md:105`); nothing prevents a write. |
| Blind bench | reviewer reads the report, mitigated by "Do Not Trust the Report" (`:64`) | **Risk, partly covered** — that section exists because rationales talked reviewers out of findings. |
| Mutants | "tests that assert nothing" as an Important finding (`:151`) | **Saving.** Our costliest seat (244K); their cover is judgment, not proof. |
| Version stamp | `scripts/bump-version.sh` versions the plugin, not the process | **Saving** — no per-merge stamp, no drift to detect. |
| Docs gate | none; self-review checklists; skill edits need eval evidence (`CLAUDE.md:93`) | **Risk, accepted** — docs *are* the spec and plan, discarded at merge. |
| Behaviour census | 14 descriptions + `docs/testing.md` | **Saving with a cost:** cannot answer "does it still do X?" without evals not in CI. |
| Code graph | "one focused check per named risk" (`task-reviewer-prompt.md:46`) | **Saving.** |
| Checkpoints | the ledger — controllers losing their place "re-dispatched entire completed task sequences" (`:131`) | **Saving.** ~1 line/task. |

## 9 Candidate moves for supertaskr

1. **Cut the standing read set** — theirs ~1.4K tokens, ours ~61K; swap the five-document order for a description index plus load-on-demand (`hooks/session-start:27`). Every seat. **Room + ADR.**
2. **Add a bounded path** — a scoped change to existing code gets a chat design and no documents (`brainstorming/SKILL.md:35-44`). Card creation. **Room + ADR.**
3. **Right-size cards** — "the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate" (`writing-plans/SKILL.md:38`). Planning. **Room + ADR.**
4. **Name a model tier on every dispatch** — an unnamed one put all 26 reviewers of a run on the top tier (`RELEASE-NOTES.md:152`). The arm. **Card.**
5. **Diff to a file the verifier reads, never through the seat** (`scripts/review-package`; `:320`). Blind-bench dispatch. **Card.**
6. **Cap the executor's return at ~15 lines, report to a file** (`implementer-prompt.md:140`). Card stamp. **Card.**
7. **Scope the re-drill** to ADDRESSED / NOT over the fix diff only (`re-review-prompt.md:58`). Merge ritual. **Card.**
8. **REMOVE code-graph regeneration from the merge ritual** — an on-demand reporter instead (`task-reviewer-prompt.md:46` is their whole structural cover). **Room + ADR.**
9. **REMOVE behaviour-census regeneration from the per-merge path**, keeping it nightly or in CI. **Room + ADR.**
10. **Circuit-break the fix loop** — five rounds, adjudicate, park, list every ruling (`:373`, `:411`, `:475`). Verifier loop. **Room + ADR.**
11. **Bounded waiting** — "roughly two-thirds of all wait calls were short polls that timed out" (`references/codex-tools.md`). The arm. **Card.**
12. **Ban seat-side fixes** — "Never fix findings yourself in the controller session" (`:408`); our architect re-drills in-seat. Merge ritual. **Room + ADR.**

## 10 What I could not determine

- Token counts per seat: no telemetry committed; `tests/claude-code/analyze-token-usage.py` exists, its outputs do not. My per-task token figures derive from dollars at assumed rates.
- Wall clock for one small change: 31-41 min is a whole multi-task run under a sonnet controller (`strict-cost-sdd-design.md:162`); no bounded-path timing exists.
- Whether the loop holds in the wild: evals live in `prime-radiant-inc/superpowers-evals`, not cloned, "not part of CI today" (`docs/testing.md`). Compliance rates absent.
- How Grok Build CLI and Factory Droid load the bootstrap: README install sections only; neither is in Appendix A's table, neither has tests.
- Antigravity's real shape: `porting-to-a-new-harness.md:295,698` describe an `.antigravity-plugin/` with `install.sh`; that directory does not exist at this pin (`ls -d .antigravity-plugin` → No such file), and `tests/antigravity/` says agy just runs the Claude Code hook. Doc and tree disagree.
- Fix-round frequency: "Review-loop count (2-4 per run)" is the biggest cost variance; the per-task distribution is unrecorded.
- Whether any harness enforces anything: no PreToolUse-class hook exists here; host-side sandboxing outside this repo cannot be ruled out.
