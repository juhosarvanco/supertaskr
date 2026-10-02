---
id: T-315-s1
title: "Native desktop workers use shared run records and automatic fence checks"
feature: F-04
milestone: 4
size: L
tier: guarded
priority: 1
status: done
blocked_by: [T-303-s1, T-311, T-314]
touches: [.codex/hooks.json, tools/e2e/scripts/native-codex-hook.mjs, tools/e2e/scripts/native-codex.mjs, tools/e2e/tests/native-codex.spec.ts, tools/e2e/scripts/run-record.mjs, tools/e2e/tests/run-record.spec.ts, tools/e2e/scripts/brief.mjs, tools/e2e/tests/brief.spec.ts, docs/CONVENTIONS.md, docs/conventions/lanes.md, docs/conventions/records-and-rooms.md, docs/CAPABILITIES.md, docs/INDEX.md]
builder: gpt-5.6-sol@fresh
verifier: gpt-5.6-sol@fresh
built_by: gpt-5.6-sol@fresh
verified_by: gpt-5.6-sol@fresh
review: independent
---

## Acceptance criteria

- **Admission and binding.** Before native spawn, the arm SHALL admit the approved card/base/fence/model/effort and atomically reserve its writer resource through T-311. A real native identity SHALL bind to that attempt. The bridge SHALL map every supported subagent tool event to the bound attempt using supported event or task identity. Parent `session_id`, cwd, a task name and transcript parsing SHALL NOT stand in for agent identity. Missing, duplicate or conflicting attribution SHALL persist a hold and refuse native writer eligibility. A second tool-using native writer SHALL be refused until distinct simultaneous routing is demonstrated; a no-tools phase-one participant may coexist only under its existing procedural restriction.
- **Shared cwd and resource authority.** The assigned worktree in the run record SHALL be the authority; the hook's shared session cwd SHALL not select a fence. The brief SHALL give absolute resource paths and every writer command SHALL name its working resource explicitly. Before supported worker operations, the monitor SHALL bind the event to its admitted resource and refuse or hold unknown attribution. After actual completion it SHALL check that assigned resource cumulatively against its canonical fence. Admission SHALL still check live reservation collisions. The monitor SHALL disclose that it does not detect every arbitrary shell write outside the assigned repository; shared cwd is not a sandbox. This is a repository safeguard, not OS filesystem or read isolation.
- **Automatic completion checks.** Synchronous `PostToolUse` SHALL inspect the full admitted-base-to-workspace change set after actual completion of Bash/unified exec and apply-patch operations. It SHALL include committed, staged, unstaged and untracked paths; additions, deletions, modes/types and both rename endpoints. Tracked files SHALL never be hidden by output policy. Ignored/untracked outputs SHALL be enumerated and allowed only by a coordinator-owned named policy; unexpected ignored files are findings. A checker error, unreadable authority, missing completion or unsupported mandatory event SHALL persist a hold and SHALL NOT be called clean. No model turn or product suite is required merely to inspect paths.
- **Hold and stop semantics.** An out-of-fence result SHALL preserve the candidate, persist an attempt-scoped hold and make later supported operations plus collect/continue refuse. It SHALL NOT auto-revert, auto-widen or trust worker-written authority. A PreToolUse denial or PostToolUse block is hook behavior only. Native interruption is a request to the harness, not proof of cessation. Releasing the hold or writer reservation SHALL require T-311 reconciliation of native task state and every registered owned job. Unknown remains unknown. Before collect or continue, the arm SHALL independently inspect the frozen base through the exact reported commit plus staged, unstaged, untracked and explicitly governed ignored residue, modes/types and both rename endpoints. An active or unreadable hold, unknown owned job, incomplete operation or out-of-fence result SHALL refuse collection; prior callback success alone SHALL NOT satisfy this final gate.
- **Bodies and live proof.** Model-free bodies SHALL cover exact routing, a parent event, an unbound child, a conflicting second writer, two disjoint identities, shared-cwd misrouting, patch source/destination, shell-created and ignored violations, tracked generated output, checker failure, unreadable hold, yielded completion and interrupt without job cessation. A real Luna-low desktop control SHALL prove project loading/trust, native attribution, allowed and refused paths, persistent hold and actual yielded completion. Only then may a fresh Sol extra-high verifier accept the mechanism for landing.

## Implementation notes

### Criteria echo

- [x] Admit the approved card, base, fence, model and effort before native spawn; reserve one writer atomically, bind the returned native identity, and refuse ambiguous or conflicting writer attribution without using cwd, parent session, task labels or transcripts as identity.
- [x] Treat the run record's absolute worktree as resource authority, require explicit writer working directories, route supported worker operations to the admitted resource, retain collision checks, and disclose that this repository safeguard is not an operating-system sandbox.
- [x] After actual Bash/unified-exec and apply-patch completion, synchronously inspect the complete admitted-base-to-workspace state, including committed, staged, unstaged, untracked, governed ignored, mode/type changes and both rename endpoints; persist a hold on any incomplete, unreadable or unsupported result.
- [x] Preserve out-of-fence candidates under an attempt-scoped hold, refuse later supported operations and collect/continue until T-311 reconciliation proves native and owned-job state, and make collection independently recheck the exact reported candidate rather than trusting callback success.
- [x] Add model-free bodies for every listed routing, writer, cwd, patch, shell, ignored/generated, failure, hold, yielded-completion and interrupt-with-live-job case; leave the real Luna-low desktop control explicitly pending for the coordinator and fresh Sol extra-high verifier.

Prepared against cfc18176bb4a4bda27f1d389ffd9cc117a6d5f4e from the native contract review. The reviewed contract is filed under the owner-approved native-first scope; dispatch still requires its pinned grant and actual monitored launch. Size is provisional from the monitor, lifecycle integration and its one guarded verification cycle. Re-estimate after the actual implementation map is settled.

The native hook entry is tools/e2e/scripts/native-codex-hook.mjs, under an existing tracked parent. The local configuration is .codex/hooks.json. Its parent is tracked by the neutral .codex/README.md bootstrap at 88cd61603789; structural preflight uses the resulting tree before dispatch. Do not commit the current machine-specific diagnostic configuration. Ship only the portable product definition after review.

No checkout-currency change is presumed necessary: native capability evidence belongs to the native inspection/admission path unless a concrete owning call requires otherwise. Do not create a second scheduler. The frozen external bootstrap is separate from candidate code and must remain active until the product replacement is independently verified and actually loaded.

Live native loading and direct agent_id attribution were observed after the desktop restart on 2026-09-24. That resolves the earlier unknown event-source premise; it does not establish holds, background-job reconciliation, concurrent routing or complete native delivery. Model-free controls should cover those mechanisms without repeated model qualification sessions. The real callback control is deliberately small; mandatory per-turn receipts are not reintroduced.

T-329 remains the separate seat-owned-job proposal. This work integrates the existing attempt-owned T-311 lifecycle only.

### Built mechanism

The portable project hook now routes synchronous native desktop events through one T-311 attempt record. Native launch admission validates the exact Git root, approved base, canonical lane fence and ignored-output policy before the existing exclusive writer reservation is taken. The coordinator explicitly binds the actual SubagentStart callback identity; the recorded start turn, admitted canonical task and child's completed exact `CODEX_THREAD_ID` probe must agree before the bind closes. A no-identity callback is accepted as a parent event only when its session and turn have been positively recorded as coordinator continuity; missing or invalid worker attribution persists a hold.

The assigned worktree is the resource authority. Bash admission uses the documented `tool_input.command` payload and requires the command to begin with an explicit absolute `cd` to that worktree; it does not rely on an undocumented hook `workdir`. Apply-patch admission checks every absolute source and move destination. PreToolUse persists an inflight operation only after a clean cumulative check. Its exact PostToolUse counterpart reruns the check after actual completion and stores the real callback receipt.

The cumulative check covers committed, staged and unstaged raw diffs, untracked paths and changes in ignored residue outside the coordinator-owned named policy. It records additions, deletions, modes/types and both rename endpoints. Tracked paths never inherit an ignored-output exception. Checker failures and unreadable authority persist holds. If the attempt document cannot carry its own hold, a one-shot sidecar beside that attempt preserves `unknown` and is absorbed into the real hold list before a repaired record can process another event. A missing PostToolUse stays inflight until T-311 reconciles native cessation and every owned job; release then records an explicit `actualPostCallback: false`, `outcome: unknown` receipt before an independent clean check. SubagentStop and Interrupt remain observations and do not claim cessation or stopped jobs.

Collect and continue require the exact reported 40-character commit, completed lifecycle reconciliation, no active hold, no incomplete operation, no owned job and a fresh independent cumulative check. Native replacement through `continue --replace` is refused; a new native identity needs a fresh start. The run report discloses that this is a repository safeguard rather than operating-system write or read isolation.

### Model-free evidence

- `native-codex.spec.ts`: 12/12 passed. These bodies cover the portable hook, exact binding and parent continuity, unbound children, writer collision, two disjoint identities, explicit shared-cwd resource selection, every apply-patch endpoint, shell-created and ignored violations, tracked generated files, raw mode/type and rename data, checker failures, unreadable holds, yielded completion with a missing callback, interrupt with a live job, and exact-ref collect/continue.
- `run-record.spec.ts`: 44/44 passed, including the native binding tuple and continuation-ref parser body.
- `brief.spec.ts --grep "ARM THIRTEEN"`: 1/1 passed, including stable refusal of an incomplete native assignment.
- `npm run typecheck`: passed. `npm run lint:tokens`: clean. `git diff --check`: clean.

Each protected behavior was also run once with a narrow deliberate mutant and returned exit 1 for the intended assertion before the source was restored: hook coverage without Interrupt; relaxed impostor routing; an overbroad unbound probe; non-exclusive reservation creation; routing to every bound identity; trust in an undocumented hook workdir; checking only one patch endpoint; skipped untracked paths; hidden tracked paths; swallowed checker errors; a missing callback labelled successful; an optional final reported ref; a parser that discarded the continuation ref; an incomplete native assignment admitted as non-native; a bind detached from both callback and probe identity; and an unreadable authority without its durable sidecar. A first mutation that removed only the direct callback equality survived because the completed probe still rejected the impostor; the tightened two-correlation mutant is the one that demonstrated the body's discrimination. After restoration, the core hashes were `e1544d0be9733458ccc1546dbaf81175167de2e1dcf50b39b23d0abb32fa676c` for `.codex/hooks.json`, `00acbcb8dde4b5bb2d0475a7498390cb0fece384f9300b678f74738b5af16cf6` for `native-codex.mjs`, `b14253923f01a7b36881d78a6584b8fe1417977ae50a7081878c69ee5b2c482b` for `run-record.mjs`, and `34c214e3d3311cb3e91a2ee26568b1d095fc5a1526ee43e711d3f5749cc983dc` for `brief.mjs`.

The first full `e2e` graded reading at source commit `20b4bc0679eca26e08333023d8ab381499567d05` ran 1,266 bodies: 1,261 passed and five failed. Three failures produced the bounded fix pass above: the run arm's three redundant bind flags were not announced to the arm census, and the native fixture's synthetic `docs/tasks` path looked like an unlinked repository docs reader to two census bodies. The remaining failures were the live T-205-s5 verifier-fence collision and the protected generated census. The post-fix graded reading is reported in the executor handoff so its result can remain evidence about an unchanged commit.

### Pending independent evidence

The real Luna-low desktop control remains pending for the coordinator, as required by the acceptance criterion. The generated capabilities/index census also remains pending: the protected `npm run capabilities` attempt returned exit 3 with `EACCES` for `docs/CAPABILITIES.md`, which is outside this executor's exact fence. The coordinator retained that refusal and will perform the normal generated-artifact fence expansion and fresh generation/verification step. No protected-file retry or bypass was made here.
Coordinator fence expansion (2026-09-24): docs/CAPABILITIES.md is the generated census of the in-scope test bodies. The executor requested it after the physical fence refused regeneration. Its attempt was reconciled before this first-parent expansion; fresh verification regenerates and checks it. Acceptance criteria and product scope are unchanged.

Coordinator generated-index expansion (2026-09-24): the census generator also updates docs/INDEX.md when the new native spec adds a capability section. Its changed count was preserved after the verifier monitor held the write. The verifier attempt and owned jobs are reconciled; this derived INDEX path joins the same generated-artifact fence. Criteria are unchanged.

### 2026-09-24 scoped correction evidence

The correction started from `98fcffe4b33c438617b5d2ea110ef9b40267a07f`; the two verifier bodies were already committed at `f480ca6c64d7e0a35b6341c5501bddfb83caa13a`. At that base, `canonical native resource aliases share one atomic T-311 reservation` exited 1 because the second start returned no refusal. The yielded-operation body independently passed before the fix. The corrected source is `15b71a32d75ec19fb09cc1c298d889b80c047529` (`run-record.mjs` sha256 `bbd45a15e401385a0a7298e2edaf1c0c9f0a0f99f561b20aed29abee5fb9e6f8`). Reservation filenames now use the real path for an existing resource, so a worktree and a symlink alias contend on one exclusive file. Only `ENOENT` retains the lexical key needed by the low-level reservation primitive for an absent resource; permission and all other canonicalization failures still propagate.

The first direct-realpath correction made the alias body green but exposed the adjacent exclusive-create control: the full run-record sweep reported 43 passed and one failure because its deliberately absent pre-warm resources could no longer reach the race. The `ENOENT` fallback made that control and the alias control green together. Against the final source bytes, `SUPERTASKR_E2E_PORT=15315 npx playwright test tests/native-codex.spec.ts` passed 14/14, including the real yielded-shell body; the same port with `tests/run-record.spec.ts` passed 44/44; and `tests/brief.spec.ts --grep "ARM THIRTEEN"` passed 1/1. `npm run typecheck`, `npm run lint:tokens`, `npm run capabilities:check`, `npm run lint:docs`, `git diff --check`, and the graph currency check all exited 0. The graph check derived 203 files, 2,631 symbols and 2,505 edges at the final source tree.

The final range gate fired, as required for this source-and-generated-doc range, and named all three full legs. The parser leg passed 454/454. The app leg first reported 1,157 passed and 14 failures, all naming the absent `app/dist/assets` prerequisite; `npm run build` then exited 0 and the app leg passed 1,171/1,171. The end-to-end leg passed 1,267/1,268. Its sole failure, `THE VERIFIER'S BRIEF ASSEMBLES`, named a live board-state collision between T-315-s1 and T-205-s5 over `tools/e2e/tests/brief.spec.ts`; the mandated one-time exact rerun reproduced that same named collision. All native and run-record bodies, including both correction bodies, passed within the full leg. No second full run followed because this evidence-only append changes none of the measured inputs.

The normal `npm run capabilities` command wrote `docs/CAPABILITIES.md` (123,249 bytes, 1,264 behaviours across 43 spec files) and `docs/INDEX.md` (7,747 bytes), then exited 1 when its chained interview-skill writer met the expected out-of-fence `EACCES` at `method/skills/supertaskr-interview/SKILL.md`. No widening or protected retry followed. The read-only currency command then confirmed both generated documents and the unchanged interview skill current.

Provenance correction, appended without changing the preserved verdict below: the native tool dispatched the verifier as `gpt-5.6-sol` at `xhigh`; the verdict heading's `gpt-6` self-label is not measured identity. Phase one's no-tools restriction was procedural rather than mechanically guaranteed, as the sealed launch addendum states. The yielded correction body starts and awaits a real shell process, then invokes the handler with a supplied Post callback in the model-free fixture; proof of an actual desktop Post callback remains part of the coordinator-owned Luna control. These corrections do not change the confirmed alias defect or the failing pre-fix body.

### 2026-09-24 scoped correction evidence: ignored residue and identity holds

This correction started from `0259aecbe1f5f1e6fe1e19abac26e03e5f5b734f`, which already contained both verifier regression bodies. Against that base, the focused pair exited 1 with both bodies failing exactly as the preserved verdict records: admission did not throw for `ignored/unexpected.log`, and completion of the bound worker released reservation `T-915-a1` instead of retaining the `unknown-worker` hold. After the scoped implementation change, the same pair passed 2/2. The corrected source is `23c5335f46d9273c59c2879ce427f8e538f84134`; `tools/e2e/scripts/native-codex.mjs` has sha256 `8943d3f396490d84a9cbc9b965f1d22d585af080817bed566e31d4d670000ab1` at that commit.

Admission now rejects every ignored baseline entry outside the coordinator-owned named policy except the canonical lane-fence manifest, which is the ignored authority required to perform admission. Generic lifecycle reconciliation now leaves `unknown-worker`, `duplicate-agent-attribution`, `ambiguous-agent-attribution`, `missing-agent-unrecognized-turn` and `session-mismatch` holds active; it still clears ordinary lifecycle and workspace holds after T-311 establishes native cessation and reconciles every owned job. No recovery bypass or inference about the unknown identity was added.

The adjacent positive controls passed 3/3: unexpected ignored output remains detectable after start, ordinary reconciled lifecycle holds still clear and release a clean writer reservation, live owned jobs still prevent release, and collect/continue still perform their independent final checks. The full native bridge spec passed 16/16, including the canonical-alias and actual-yielded-operation corrections; the run-record spec passed 44/44; and the brief's `ARM THIRTEEN` body passed 1/1. `npm run typecheck`, `npm run lint:tokens`, `npm run capabilities:check`, `npm run lint:docs`, `git diff --check` and the graph currency check all exited 0. The graph check reported 203 files, 2,631 symbols and 2,505 edges.

The normal `npm run capabilities` command updated `docs/CAPABILITIES.md` to 123,435 bytes and 1,266 behaviours and rewrote the already-current `docs/INDEX.md` at 7,747 bytes, then exited 1 when its chained interview-skill writer met the expected out-of-fence `EACCES` at `method/skills/supertaskr-interview/SKILL.md`. No widening or protected retry followed; the read-only currency command confirmed both approved generated documents and the unchanged interview skill current.

The range derivation for `0259aecbe1f5f1e6fe1e19abac26e03e5f5b734f..23c5335f46d9273c59c2879ce427f8e538f84134` owed only the end-to-end package over 17 owning specs. Its graded run executed 983 bodies: 982 passed and the sole failure was `THE VERIFIER'S BRIEF ASSEMBLES`, naming the live T-315-s1/T-205-s5 collision over `tools/e2e/tests/brief.spec.ts`. The mandated one-time exact rerun reproduced the same board-state collision. All 16 native bodies passed in the graded run, so no whole-battery repetition followed. The real Luna-low desktop product-hook demonstration remains coordinator-owned and pending.

### 2026-09-24 scoped correction evidence: conflicting native starts

This correction started from `d1fcc9242d83b591213d11171c42386924e25980`,
which already carried the verifier's committed conflicting-start regression.
Against that base, the isolated body exited 1 because the already-bound attempt
received `duplicate-agent-attribution` while the pending attempt's active-hold
array was empty. The source fix defines the affected attempts as the union of
the already-routed and pending records. At source commit
`285293a5434d7f512c5b399314953113646ff356`, the same regression plus the normal
exact-binding and two-disjoint-identity positive controls passed 3/3. The final
source sha256 is `04ea267758308425bc8966dca536431c3f78e1b1bb9510f01d2d0c5a0ecb8587`;
the committed regression spec sha256 is
`46ed08f28d184fa692b8fd9244e430717ec863cb3b716ad31c0ae993edf47e89`.

The full focused native and run-record sweep passed 61/61: 17 native bridge
bodies and 44 shared run-record bodies. `npm run typecheck`, `npm run
lint:tokens`, `npm run capabilities:check`, `npm run lint:docs`, `git diff
--check` and the graph currency check all exited 0. Direct capability generation
updated the approved `docs/CAPABILITIES.md` census to 1,267 behaviours across 43
spec files and confirmed `docs/INDEX.md` was already byte-current; it did not
write the out-of-fence interview skill. The class sweep found two native
affected-set selections: this SubagentStart branch and the generic unknown
worker branch, which already holds every record in the admitted session.

The exact correction range owed only the end-to-end package over 17 owning
specs. Its one graded run executed 984 bodies: 983 passed and the sole failure
was `THE VERIFIER'S BRIEF ASSEMBLES`, naming the known live T-315-s1/T-205-s5
collision over `tools/e2e/tests/brief.spec.ts`. The mandated one exact rerun
reproduced that same board-state collision. All 17 native bodies and all 44
run-record bodies passed inside the graded run, so no whole-battery repetition
followed. The real Luna-low desktop product-hook demonstration remains
coordinator-owned and pending.

## Repair ledger

2026-09-25 native callback transaction repair

### Repair criteria echo

- [x] Serialize each native event's authority selection, validation and
  mutation so concurrent callback processes retain every accepted operation,
  completion, finding and hold; a clean completion must not overwrite an
  unrelated hold.
- [x] Put coordinator bind, observe/reconcile, answer, collect, continue and
  stop record mutations under the same project-wide authority protocol while
  keeping status-only inspection read-only.
- [x] Bound lock acquisition within native hook budgets, persist a named
  fail-closed refusal on contention, recover an abandoned owner only when the
  recorded process is provably absent, and release ownership on exceptions and
  nested calls.
- [x] Preserve unknown-attribution and unreadable-authority evidence through
  later collection, with no stale snapshot, dropped completion, cleared hold
  or abandoned temporary file reported as success.
- [x] Add deterministic separate-process barrier controls for the lost-update
  interleaving and competing lifecycle writers, then run focused native and
  run-record regressions plus the range-derived gates before handoff.

The repair serializes one complete authority transaction per native callback:
selection, validation, cumulative inspection, mutation and atomic publication
share the project reservation lock. The coordinator's start, bind,
observe/reconcile, answer, collect, continue and stop operations use the same
lock. Status reads remain read-only, including when an unreadable-authority
sidecar exists. Nested calls are re-entrant only inside their owning process;
the shared directory remains the cross-process exclusion primitive.

Contention waits at most 1.5 seconds for acquisition and then writes a named,
uniquely-created refusal sidecar. A later successful transaction absorbs that
evidence into every readable native attempt before its own operation and
unlinks the sidecar only after all writes succeed. The controlled absorption
failure left both concurrent sidecars present; after the damaged record was
restored, the next locked writer absorbed both and collection still refused
their sticky unknown outcome. The 1.5-second value bounds acquisition rather
than the full hook. The Interrupt hook budget is 3 seconds, while five ordinary
full workspace scans on this dirty repair tree measured 479.2–518.5 ms; the
observed acquisition ceiling plus the slowest measured scan is about 2.02
seconds, leaving startup and publication margin without claiming a hard
full-hook duration bound. Other native hooks retain their 30-second budget.

Dead-owner recovery is fenced by a separate exclusive recovery directory.
Every new owner checks that gate before and after publishing its token and
backs out if recovery appeared. A claimant may remove the lock only after it
re-reads the same PID and token while holding the recovery gate and again
proves the PID absent. The two-reclaimer control holds one process after its
dead-owner observation, lets the other reclaim and hold the successor lock,
then releases the stale claimant: it preserves the successor, waits for its
release and retains both tool identities. The dead owner's temporary record
file is removed only inside the reconciled recovery section. A crashed or
unreadable recovery owner therefore remains a named fail-closed refusal rather
than permitting pathname reuse to break mutual exclusion.

The four deterministic concurrency bodies passed 4/4 after three matching
controls were made red: bypassing the native-event transaction failed before
the holder barrier, bypassing the coordinator observe transaction failed its
contention barrier, and replacing unique refusal names with a constant made
the second reporter fail `EEXIST`. The stale-recovery mutant that removed the
current pathname from the old PID snapshot deleted the live successor and
failed at its missing owner document. Restoring the exact implementation made
the same body pass. The complete native bridge passed 21/21, the shared
run-record suite passed 44/44, typecheck, capability/index currency, token
lint and the whole-tree docs census were green. No spawned fixture remained.
The graded range from `2cb2902237841070a6865b2a500117114454f3cd` to
implementation commit `77f104d4ea0782750cfdb1c62af979dec86f574b`
derived parser, app and 18 end-to-end specs. Parser passed 454/454. The first
app leg passed 1,157/1,171; all 14 failures named the absent `app/dist/assets`
setup prerequisite. After the documented app build, the graded app leg passed
1,171/1,171. End to end passed 1,001/1,002, including all 21 native and all 44
run-record bodies. Its only failure is the previously documented live board
collision: verifier brief assembly finds T-315-s1 and T-205-s5 both fencing
`tools/e2e/tests/brief.spec.ts`. That unrelated scope collision is preserved as
the actual range verdict; no repair-owned body failed and this executor did
not alter either integration state or T-205-s5 authority to manufacture green.

Dispatch format correction: the external repair brief supplied the precise
role, fence and acceptance draft but no labeled `CONTEXT PACK`. Following the
executor correction clause, this run used the standing read and the full
`docs/CONVENTIONS.md` fallback rather than guessing an omitted section. No
additional source path or scope grant was needed.

2026-09-25 CI shell portability repair

### Repair criteria echo

- [x] Replace the yielded-operation body's hardcoded zsh executable with a
  shell route available on the Linux CI runner and macOS development hosts;
  the command body must remain free of shell-specific syntax.
- [x] Preserve proof that early stdout arrives before process completion, the
  process exits successfully, the late write occurs, and the actual
  PostToolUse scan persists the out-of-fence hold.
- [x] Retain process error propagation and fixture cleanup, change no product
  hook or manifest, run the focused yielded body and full native bridge spec,
  and commit the repair evidence on this card.

CI run `36108412263`, shard 3, failed only this body at line 550 because
`/bin/zsh` does not exist on the Linux runner (`spawn ENOENT`); the other 279
shard bodies and every other job were green. The body now launches `/bin/sh`,
which is available on both target host families. Its command uses only the
project-required explicit `cd`, `printf`, `sleep`, ordinary output redirection
and `&&`; it has no zsh-specific expansion, option or control syntax. The
existing child `error` rejection, `close`-based completion, explicit zero-exit
assertion and fixture `finally` cleanup remain unchanged.

The isolated yielded-operation body passed 1/1 and the full native bridge spec
passed 17/17 with the portable route. The assertions still observe stdout
while `completed` is false, await exit 0, then deliver the actual PostToolUse
callback and require both `post-held` and the `late.tmp`
`untracked-out-of-fence` finding. No test was skipped or weakened, and no
product hook, manifest or dependency file changed.

### Separate native monitor finding

During context reads, four read-only shell operations were submitted
concurrently. Their callbacks raced: one completion left a persistent hold and
three completion callbacks could not find exact persisted pre-command
records. The coordinator preserved the independently reconciled incident in
`ci-portability-repair/CONCURRENT-CALLBACK-FINDING.md`. All subsequent repair
operations were serialized. This patch does not change the native monitor.

### 2026-09-25 — REJECTED — gpt-6@01a0d7db-a871-7862-852f-be88efec885f

This was one fresh native verifier task scoped to the post-publication CI
repair, not a fresh two-spawn requalification of the guarded card. The repair
brief disclosed the Linux CI failure and the exact repair range. The original
qualification's separately saved attack set and ground were supplied only as
historical sealed inputs; they are not relabelled as repair-specific phase one.
This review examined candidate
`3f3b76679b90590022b6b831a7fb22f0528a8dfd` against repair base
`989b776b5f4b6eaf8c35620659be263ded982d96`.

The original sealed attack set is
`sha256:56b5840add858d591fa508d22ed9e23289ea8c83d411645d33193ca189a68a64`,
the original sealed ground is
`sha256:d8f4aa21919f8d019ba85d7f548e614942b0f6733de87698158eb048fdb5e3ca`,
and the repair-base card is
`sha256:dbfbea972abb045fa808554e454891e4cbd3ec1a240282dadc78e3212d7ac13d`.
The two sealed files were re-hashed and the repair-base card was read before
the repair diff was opened; the card's displayed digest was derived later in
this review.

The shell replacement itself is portable in the stated target family. The
focused body passed 1/1 and the complete native bridge spec passed 17/17 at
the candidate. The same command language (`cd --`, `printf`, `sleep`, output
redirection and `&&`) also exited 0 under `/bin/dash`, independently of the
body's `/bin/sh` run. The body still observes early stdout while `completed`
is false, waits for exit 0, delivers PostToolUse only afterwards, and requires
the persistent `late.tmp` out-of-fence finding. A targeted executable-path
mutant produced the intended `spawn ... ENOENT` red, and the candidate spec
was restored to
`sha256:dd7e9ca559450269646604babb77354e1a65ecf5ea8b496e73bc65ba79437377`.

The candidate does not, however, retain cleanup on the error path it claims.
When the changed spawn route was replaced temporarily with the guaranteed
missing `/definitely-missing-native-test-shell`, the child `error` rejected
the `completion` promise while the test was still awaiting a different
stdout-only promise. Playwright reported `spawn ... ENOENT`, but the outer
`finally` never ran and left
`t315-yielded-late-write-Mgcme6` under the host temporary directory. Expected:
the currently awaited operation rejects on the child error and the fixture is
removed. Actual: the rejection is observed out of band and the fixture
survives. The residue was recorded, then removed by its exact path after the
evidence was captured.

A temporary correction made first output race process completion/error and
added a missing-executable cleanup arm to the existing yielded body. The body
then passed 1/1 and left no yielded fixture. Replacing only that race with the
candidate's stdout-only wait made the same body red with `ENOENT` and left
both its normal and spawn-error fixtures; restoration returned it to 1/1 with
no residue. This is a failure of the repair's explicit process-error and
fixture-cleanup criterion, even though the normal `/bin/sh` path is green.

| Repair criterion | Evidence and verdict |
|---|---|
| Portable shell route | **Met.** The only executable change is `/bin/zsh` to `/bin/sh`; the exact command passed through `/bin/sh` in the focused run and through `/bin/dash` in the independent grammar control. |
| Preserve early output, completion, late write and cumulative hold assertions | **Met.** Focused 1/1 and native bridge 17/17 at the candidate; direct reading confirms early output precedes `completed`, exit 0 precedes PostToolUse, and `late.tmp` must appear in the persisted hold. |
| Retain error propagation and cleanup; keep scope to the spec/card | **Not met.** The two changed paths are admitted by the frozen card and detached verifier manifest; no product hook, manifest or dependency changed. The missing-executable drill demonstrates that the stdout-only await bypasses the body's `finally`, leaving its fixture behind. |

The exact repair range derives `app`, `parser` and a scoped 13-spec end-to-end
leg, with no unplaceable or generated-unplaceable paths. Those publication
range gates were not run in this repair review and remain coordinator-owned
obligations after correction; this verdict is not a full guarded
requalification. The security sweep found no dependency, credential, external
endpoint or product execution change. The separately recorded concurrent
callback race was outside this repair and was neither investigated nor
attributed to this diff. One initial verifier command also used the bench root
instead of the package directory, creating a preserved out-of-fence Playwright
result; the coordinator archived and reconciled that verifier error, and it is
not counted as repair evidence.

Corrections: **1**. Committed correction bodies: **1**, in the commit after
this verdict. Mutant blocks: **1**.

```mutant
correction: settle the early-output wait on process completion or spawn error so fixture cleanup runs
file: tools/e2e/tests/native-codex.spec.ts
spec: tools/e2e/tests/native-codex.spec.ts
body: a yielded Bash operation is checked at actual PostToolUse and its late violation persists a hold
message: spawn /definitely-missing-native-test-shell ENOENT
--- old
  return Promise.race([
    new Promise<string>((resolve, reject) => {
      child.once("error", reject);
      child.stdout?.once("data", (chunk) => resolve(String(chunk)));
    }),
    completion.then((code) => {
      throw new Error(`yielded process exited before stdout (code ${String(code)})`);
    }),
  ]);
--- new
  return new Promise<string>((resolve) => {
    child.stdout?.once("data", (chunk) => resolve(String(chunk)));
  });
```

The required correction body is commit
`626656b67a753ebbb8fc58fd543796c49146b607`. At that ref the focused body
passed 1/1, the complete native bridge spec passed 17/17, typecheck passed,
the capability/index and interview-skill currency checks passed, token lint
was clean and the whole-tree docs census reported zero findings. No yielded
fixture remained and port 25315 had no listener. These readings grade the
committed handoff body; they do not change the REJECTED verdict on candidate
`3f3b76679b90590022b6b831a7fb22f0528a8dfd` or satisfy the outstanding
publication range.

No pack gap was encountered. The repair-specific single-task frame and the
outstanding publication gates are disclosed rather than presented as a fresh
guarded pass.

### 2026-09-25 — APPROVED — gpt-5.6-sol@01a0d7ef-52b0-7790-9d62-d3dd39698194

This was one fresh native verifier task bound as attempt `T-315-s1-a12` and
scoped to the corrected post-publication CI repair. It was not a new two-spawn
qualification of the guarded card. The original qualification attack set and
ground were historical inputs only: their re-derived hashes are respectively
`sha256:56b5840add858d591fa508d22ed9e23289ea8c83d411645d33193ca189a68a64`
and
`sha256:d8f4aa21919f8d019ba85d7f548e614942b0f6733de87698158eb048fdb5e3ca`.
The repair-base card at `989b776b5f4b6eaf8c35620659be263ded982d96`
re-hashed to
`sha256:dbfbea972abb045fa808554e454891e4cbd3ec1a240282dadc78e3212d7ac13d`.
The configured verifier was gpt-5.6-sol at xhigh; provider-observed model
identity was unavailable and is not inferred from that configuration.

This review examined candidate
`5ca0088a84bdc25294ea6724809bf5f36728695a` against repair base
`989b776b5f4b6eaf8c35620659be263ded982d96`. The range changes only the task
card and `tools/e2e/tests/native-codex.spec.ts`. The detached verifier manifest
contains every path in the card fence, no extra scoped path, and the separate
verifier allowance for `docs/tasks`; its purpose explicitly says that it is
coordinator-prepared frozen verifier authority for a detached bench, not an
executor lane. No product hook, project hook manifest, dependency or runtime
source changes in this repair.

The corrected helper races first stdout against both process completion and
spawn error. The normal branch therefore proves that `yielded` arrives while
`completed` is still false, then requires exit zero before the actual
PostToolUse event. That callback must persist `post-held` with the late
`late.tmp` path as `untracked-out-of-fence`. The separate missing-executable
branch requires `ENOENT`, always executes its fixture cleanup, and asserts the
fixture directory is absent afterwards. The spawned command uses `/bin/sh`
and only portable `cd`, quoting, `printf`, `sleep`, sequencing and output
redirection syntax.

The focused body passed 1/1 at the candidate, and the complete native bridge
spec passed 17/17 at the same ref. A temporary negative drill then restored
the old stdout-only wait. The focused body failed 0/1 with
`spawn /definitely-missing-native-test-shell ENOENT` and left both
`t315-yielded-late-write-iXvmmN` and
`t315-yielded-spawn-error-rZDBdq`, proving that the new error/completion race
and cleanup assertion are load-bearing. After the exact mutant was removed,
the focused body passed 1/1, the two deliberate residue directories were
removed, and no `t315-yielded-*` fixture remained. The restored spec hash was
`sha256:938d248bf2f66c51ffe45338d692700ddf4875b2224c0e95e1df58369ea737d9`,
byte-identical at correction commit
`626656b67a753ebbb8fc58fd543796c49146b607` and the reviewed candidate.

| Repair criterion | Evidence and verdict |
|---|---|
| Portable shell route | **Met.** Direct diff inspection shows the executable changed from `/bin/zsh` to `/bin/sh`; the command language is portable across the stated Linux and macOS target family, and the focused `/bin/sh` run passed 1/1. |
| Preserve early output, completion, late write and cumulative hold assertions | **Met.** The focused body passed 1/1 and the full native spec passed 17/17 at the candidate. The body observes early output before completion, requires exit zero, sends PostToolUse only afterwards and requires the late out-of-fence hold. |
| Retain error propagation and cleanup; keep scope to the spec/card | **Met.** The missing-executable control rejects with `ENOENT` and its `finally` cleanup leaves no fixture. Reverting to the stdout-only wait made the same body red and left both fixtures. The exact range contains only the admitted spec and task card. |

The security and scope sweep found no credential, dependency, external
endpoint, dynamic product execution or runtime behavior change. The preserved
concurrent callback finding belongs to the native monitor and was neither
repaired nor attributed to this test-only diff. Publication app, parser and
scoped end-to-end gates remain coordinator-owned as the recheck brief states;
this approval does not claim them or a fresh full-card requalification.

Corrections: **0**. Committed correction bodies: **0**. Mutant blocks: **0**.
The temporary drill changed no committed bytes. No pack gap or dispatch fault
was encountered.

## Verdicts
<!-- Fresh independent verifier appends; no predecessor verdict is altered. -->

### 2026-09-24 — REJECTED — gpt-6@01a0d44e-fa36-7aa0-9529-5bf3d8d85d1f

This was the guaranteed two-spawn frame: a separate tool-less phase one
produced the frozen attack set, and this fresh phase two first received the
sealed set plus candidate `3b5deae5334777a26781d54f382e13d47da03590`.
The attack set is
`sha256:56b5840add858d591fa508d22ed9e23289ea8c83d411645d33193ca189a68a64`;
the base ground is
`sha256:7dee402c500d15dc5c59931598f75657323928492d623d782831aa693c42c6d2`;
and the base card is
`sha256:e6aff1cff2f0a8369df32cef2f0507f20c249de0c08a233ab028c24d91399bca`.
All three re-hashed to those saved values before review.

The candidate does not reserve the canonical resource atomically. T-311's
`reservationPath` hashes `path.resolve(resource)`, then native admission later
canonicalizes the resource with `realpathSync`. A real worktree and a symlink
to it therefore take different reservation files. The correction body
`canonical native resource aliases share one atomic T-311 reservation` starts
one attempt through the real path and a second through the alias. Expected:
the second start throws `RESOURCE_RESERVED` and both spellings read the first
attempt's reservation. Actual at the candidate: the second start succeeds and
the refusal is `undefined`. The isolated body exits 1, and the whole corrected
native spec reports 13 passed and this body alone failed. Temporarily making
`reservationPath` key on `realpathSync(resource)` makes the body pass; the
product file was then restored to candidate hash
`sha256:b14253923f01a7b36881d78a6584b8fe1417977ae50a7081878c69ee5b2c482b`.
This reproduces attack A6 and violates admission/binding's atomic canonical
writer reservation.

The required yielded-completion body was also a name-only control. The
candidate body carrying “yielded” creates an inflight event but never starts a
yielding operation and never introduces a late violation. The correction body
`a yielded Bash operation is checked at actual PostToolUse and its late violation persists a hold`
starts a real shell command, observes its early output while the process is
still running, lets it create `late.tmp` after the yield, and only then sends
the actual Post callback. It passes against the candidate. Removing the
PostToolUse workspace scan makes that body fail with expected `post-held`,
received `post-clean`; the source was restored to candidate hash
`sha256:00acbcb8dde4b5bb2d0475a7498390cb0fece384f9300b678f74738b5af16cf6`.
The missing body is an acceptance failure under the card's explicit
model-free evidence list and attack A14/A22 even though the implementation
survives the added control.

| Acceptance criterion | Evidence and verdict |
|---|---|
| Admission and binding | **Not met.** The exact callback/probe bind, unbound child and literal-path collision bodies pass, but the canonical alias correction above admits two native writers to one resource. |
| Shared cwd and resource authority | **Met in the reviewed mechanism.** `shared cwd cannot select a resource…` and `apply_patch checks every absolute source and move destination…` pass; `collectNativeWorkspace` reads the admitted record resource and canonical fence rather than callback cwd. The disclosed repository-only boundary is present. |
| Automatic completion checks | **Met in the reviewed mechanism, with the evidence correction below.** The candidate's original shell/ignored/tracked/raw-layer and checker-failure bodies pass. The added real yielded-late body passes and its Post-scan mutant dies. |
| Hold and stop semantics | **Met by the focused model-free evidence inspected.** Stop/interrupt remain observations, live owned jobs retain the reservation, collect/continue re-scan the exact reported ref, and unreadable authority persists a sidecar hold. This row cannot cure criterion 1's double admission. |
| Bodies and live proof | **Not met.** The yielded body did not exercise its named property until the correction below. The required real Luna-low desktop product-hook control is still pending; temporary bootstrap callbacks are expressly not that proof. |

Focused readings at candidate `3b5deae5334777a26781d54f382e13d47da03590`:

- Original native spec: exit 0, 12 passed.
- Alias correction alone: exit 1, expected `RunRecordFinding`, received no
  refusal; with the temporary canonical key: exit 0, 1 passed.
- Yielded-late correction: exit 0, 1 passed; with the Post scan removed:
  exit 1, expected `post-held`, received `post-clean`.
- Native spec with both correction bodies and candidate product: exit 1,
  13 passed and the alias correction alone failed.
- `npm run typecheck`: exit 0. `npm run lint:tokens`: exit 0 over 193 TOKEN
  files and 1683 CONTROL files. The T-315 run-record body plus the brief arm
  body: exit 0, 2 passed.
- `npm run lint:docs`: exit 1 solely because the coordinator intentionally
  restored generated `docs/INDEX.md` after preserving its generated patch;
  regenerated `docs/CAPABILITIES.md` remains in the bench. This is the known
  pending integration generation obligation, not a green docs claim.
- The four-leg range battery was not spent after the canonical-resource
  rejection, per the coordinator's instruction. The real Luna-low control
  remains open and no approval may be inferred from these model-free checks.

Corrections: **2**. Committed correction bodies: **2**, in the following
commit after this verdict. Mutant blocks: **2**.

```mutant
correction: canonicalize native resource aliases before T-311 reservation lookup
file: tools/e2e/scripts/run-record.mjs
spec: tools/e2e/tests/native-codex.spec.ts
body: canonical native resource aliases share one atomic T-311 reservation
message: Expected constructor: RunRecordFinding
--- old
  const resolved = realpathSync(resource);
--- new
  const resolved = path.resolve(resource);
```

```mutant
correction: exercise actual yielded completion with a late filesystem violation
file: tools/e2e/scripts/native-codex.mjs
spec: tools/e2e/tests/native-codex.spec.ts
body: a yielded Bash operation is checked at actual PostToolUse and its late violation persists a hold
message: Expected: "post-held"
--- old
  let check = null;
  try {
    check = collectNativeWorkspace(rec, {});
    if (!check.clean) findingHold(rec, at, "post", check);
--- new
  let check = null;
  try {
    check = { clean: true, findings: [] };
```

No pack gap or dispatch fault was encountered. The generated INDEX hold was a
temporary bootstrap enforcement result, preserved and reconciled by the
coordinator; it is not product-hook evidence.

### 2026-09-24 — REJECTED — gpt-5.6-sol@01a0d47f-8a6e-7493-90c2-62c692ac622a

This was the guaranteed two-spawn frame. A separate fresh phase one received
the frozen base card without the implementation and returned the attack set;
its no-tools restriction was procedural, as the preserved launch addendum
discloses. This fresh phase two reviewed candidate
`4cb63205ac18398715fbd37c99e1064f318923ef` against base
`3ec4b8ee9dcbaaa9778372e3562d4360d82fd853`. The configured seat was
gpt-5.6-sol at xhigh; no provider-reported model identity was available.

The sealed attack set is
`sha256:56b5840add858d591fa508d22ed9e23289ea8c83d411645d33193ca189a68a64`,
the sealed ground is
`sha256:d8f4aa21919f8d019ba85d7f548e614942b0f6733de87698158eb048fdb5e3ca`,
and the base card is
`sha256:e6aff1cff2f0a8369df32cef2f0507f20c249de0c08a233ab028c24d91399bca`.
All three re-hashed to those saved values before this verdict.

The candidate silently turns every ignored file present at admission into an
unnamed allowance. `prepareNativeRecord` records
`nativeIgnoredSnapshot(resource, ignoredOutputs)` as `ignoredBaseline`, then
the admission check compares the same snapshot to itself and never rejects a
non-empty `ignoredOutsidePolicy`. The correction body creates
`ignored/unexpected.log` before start while the coordinator policy names only
`ignored/allowed`. Expected: start refuses with `NativeCodexFinding`. Actual at
the candidate: start succeeds. This violates the requirement that ignored
outputs are allowed only by a coordinator-owned named policy; a frozen
baseline records residue but does not authorize it. A temporary admission
check that exempts only the canonical fence manifest and refuses every other
baseline entry made the body pass. The product file was restored to candidate
sha256 `00acbcb8dde4b5bb2d0475a7498390cb0fece384f9300b678f74738b5af16cf6`.

The final gate also clears attribution holds using evidence about the wrong
identity. An event from `agent-impostor` correctly creates an `unknown-worker`
hold on the bound attempt, but `clearReconciledHolds` clears every active hold
when `agent-1` later reports `RUN-DONE ok` and its registered jobs are gone.
Expected: the unknown-worker hold and writer reservation remain because no
evidence established cessation for the unknown identity. Actual: the hold is
cleared and `readReservation` returns no reservation. This violates “unknown
remains unknown” and makes a conflicting second identity eligible to disappear
through reconciliation of the known worker. A temporary change that excluded
identity-attribution holds from generic lifecycle clearing made the body pass;
the same candidate product hash was then restored.

| Acceptance criterion | Evidence and verdict |
|---|---|
| Admission and binding | **Not met.** The corrected canonical-alias body passes at candidate `4cb63205ac18398715fbd37c99e1064f318923ef`, but the new unknown-identity body shows conflicting attribution is cleared by completion evidence belonging only to the bound identity. |
| Shared cwd and resource authority | **Met in the model-free mechanism.** The shared-cwd, explicit Bash root, apply-patch endpoint and canonical reservation bodies pass; the record resource and canonical fence, rather than callback cwd, drive inspection. |
| Automatic completion checks | **Not met.** Post-completion coverage bodies pass, including the real yielded shell process, but a pre-existing unexpected ignored file is admitted as an unnamed baseline allowance. |
| Hold and stop semantics | **Not met.** Interrupt and live-job controls pass, but generic final reconciliation clears `unknown-worker` and releases the reservation without reconciling that identity or its possible jobs. |
| Bodies and live proof | **Not met.** Two required edge properties were unpinned until the correction bodies below, and the real Luna-low desktop product-hook control remains pending and inactive. |

The guarded range invocation at candidate
`4cb63205ac18398715fbd37c99e1064f318923ef` selected the whole battery.
Parser passed 454/454, app passed 1171/1171, and the Rust log reported 658
passed, zero failed and three intentionally ignored across its groups. End to
end passed 1267/1268; its sole failure was `THE VERIFIER'S BRIEF ASSEMBLES`,
which named the live T-315-s1/T-205-s5 collision over
`tools/e2e/tests/brief.spec.ts`. The preserved output establishes that this
was board state rather than a product-body failure. The focused native spec
passed 14/14 before the corrections were introduced. The two correction
bodies then failed against candidate source and passed with the temporary
source changes described by the mutant blocks. No dependency was added, and
the security sweep found no credential material or new external input path
beyond the reviewed callback and assignment parsers.

Corrections: **2**. Committed correction bodies: **2**, in the commit after
this verdict. Mutant blocks: **2**.

```mutant
correction: refuse ignored residue present at admission unless a coordinator-owned named policy allows it
file: tools/e2e/scripts/native-codex.mjs
spec: tools/e2e/tests/native-codex.spec.ts
body: native admission refuses pre-existing ignored residue that no coordinator policy names
message: Expected constructor: NativeCodexFinding
--- old
  const ignoredOutputs = rec.assignment.native.ignoredOutputs.map(nativeDomain);
  const ignoredBaseline = nativeIgnoredSnapshot(resource, ignoredOutputs);
  const fenceRel = path.relative(resource, manifest).replaceAll("\\", "/");
  const unexpectedIgnoredAtAdmission = ignoredBaseline.filter((entry) => entry.path !== fenceRel);
  if (unexpectedIgnoredAtAdmission.length > 0) {
    throw new NativeCodexFinding(
      "NATIVE_ADMISSION_DIRTY",
      `native-codex: assigned resource has ignored residue outside named policy: ${JSON.stringify(unexpectedIgnoredAtAdmission)}`,
    );
  }
--- new
  const ignoredOutputs = rec.assignment.native.ignoredOutputs.map(nativeDomain);
  const ignoredBaseline = nativeIgnoredSnapshot(resource, ignoredOutputs);
```

```mutant
correction: keep identity-attribution holds until that unknown or conflicting identity is explicitly reconciled
file: tools/e2e/scripts/native-codex.mjs
spec: tools/e2e/tests/native-codex.spec.ts
body: completion of the bound worker does not reconcile a hold created by an unknown second identity
message: Received: undefined
--- old
function clearReconciledHolds(rec, at, why) {
  for (const hold of activeNativeHolds(rec)) {
    if (
      [
        "unknown-worker",
        "duplicate-agent-attribution",
        "ambiguous-agent-attribution",
        "missing-agent-unrecognized-turn",
        "session-mismatch",
      ].includes(hold.code)
    ) {
      continue;
    }
    hold.clearedAt = at;
--- new
function clearReconciledHolds(rec, at, why) {
  for (const hold of activeNativeHolds(rec)) {
    hold.clearedAt = at;
```

No pack gap or dispatch fault was encountered. The bootstrap runtime-ignore
hold was preserved as failed evidence and reconciled only after the native
turn and every registered job ended; it is not product-hook evidence and did
not alter this verdict.

### 2026-09-24 — REJECTED — gpt-5.6-sol@01a0d4eb-8d76-7330-b924-ef0a4c41c73d

This was the guaranteed two-spawn frame. The separate phase-one task received
the base card without the implementation and produced the frozen attack set;
its no-tools restriction was procedural, as the preserved launch addendum
discloses. This fresh phase two reviewed candidate
`92e39d1611900565104f142b842825047b27d073` against base
`3ec4b8ee9dcbaaa9778372e3562d4360d82fd853`. The requested seat was
gpt-5.6-sol at xhigh; provider-observed model identity was unavailable.

The sealed attack set is
`sha256:56b5840add858d591fa508d22ed9e23289ea8c83d411645d33193ca189a68a64`,
the sealed ground is
`sha256:d8f4aa21919f8d019ba85d7f548e614942b0f6733de87698158eb048fdb5e3ca`,
and the base card is
`sha256:e6aff1cff2f0a8369df32cef2f0507f20c249de0c08a233ab028c24d91399bca`.
All three re-hashed to those saved values before review.

Conflicting native start attribution does not hold every affected attempt.
With `agent-left` already bound to one resource and exactly one second attempt
pending in the same admitted session, a new `SubagentStart` claiming
`agent-left` enters the duplicate-attribution branch. `handleNativeEvent`
chooses only the records returned by `routedRecords` when that set is non-empty,
so it persists `duplicate-agent-attribution` on the already-bound attempt and
leaves the pending attempt with no hold. The correction body
`a duplicate native identity claimed while another attempt is pending holds both attempts`
expected both records to retain that hold. Actual at the candidate: the bound
record carried it and the pending record's active-hold array was empty. The
isolated body exited 1 with `Received array: []`. Temporarily defining the
affected set as the union of the already-routed and pending records made the
same body pass 1/1. Product and test bytes were then restored to candidate
sha256 values `8943d3f396490d84a9cbc9b965f1d22d585af080817bed566e31d4d670000ab1`
and `bfd70d625acf9347435018bdd14907a8657b3e32611725b0733641c581398f4e`.
This reproduces attack A3 and violates the admission criterion's requirement
that duplicate or conflicting attribution persist a hold and remove native
writer eligibility.

The required real Luna-low desktop product-hook control is also absent. The
sealed ground's seat addendum contains no callback, lifecycle or loading
measurements, and the coordinator addendum expressly says the live proof is
pending. Bootstrap registration and model-free handler calls do not prove that
the candidate hook is loaded and trusted by the product, receives real allowed
and refused path events, retains a hold into a later native operation, or sees
an actual yielded completion. The card says only that real control permits a
fresh Sol extra-high verifier to accept the mechanism, so this pass cannot
approve landing.

| Acceptance criterion | Evidence and verdict |
|---|---|
| Admission and binding | **Not met.** Exact callback/probe binding, parent-event separation, unbound-child refusal, canonical reservation collision and two disjoint identities pass model-free controls. The new conflicting-start control shows the pending attempt remains hold-free when an already-bound identity is claimed again. |
| Shared cwd and resource authority | **Met in the model-free mechanism.** The shared-cwd, explicit Bash root, apply-patch source/destination, canonical resource and repository-boundary bodies pass. The record resource and canonical fence drive inspection. |
| Automatic completion checks | **Met in the model-free mechanism.** The shell-created, ignored, tracked-output, raw mode/type/rename, checker-error, unreadable-authority and actual yielded-late bodies pass. Mutants removing the post-completion scan and ignored-admission refusal both died at their intended assertions. Real product delivery remains unproved under criterion five. |
| Hold and stop semantics | **Met by the focused model-free controls inspected.** Unknown-worker holds survive reconciliation, live owned jobs retain the reservation, interrupt/stop callbacks claim no cessation, and collect/continue independently recheck the exact reported ref. This row does not repair the different conflicting-start attribution failure above. |
| Bodies and live proof | **Not met.** The candidate omitted the conflicting-start body until the correction below, and the mandatory real Luna-low desktop control remains pending. |

Readings at candidate `92e39d1611900565104f142b842825047b27d073`:

- The native bridge spec passed 16/16. Four targeted product mutants each
  landed at the intended source site and killed the alias-reservation,
  admission-time ignored-residue, unknown-identity hold and actual
  PostToolUse scan bodies. After every mutant, product hashes and an empty
  file diff proved restoration.
- The added conflicting-attribution body was red 0/1 against candidate
  product and green 1/1 against the temporary union fix, after which both
  files were restored.
- The required range run selected the whole battery because
  `.codex/hooks.json` is outside the package map. Parser passed 454/454; app
  passed 1171/1171; Rust was GREEN over 662 counted bodies and 18 targets.
  End to end passed 1269/1270. Its sole red was
  `THE VERIFIER'S BRIEF ASSEMBLES`, which named the live T-315-s1/T-205-s5
  collision over `tools/e2e/tests/brief.spec.ts`; this is the coordinator's
  named live collision, not a native product-body failure. The range battery
  was run once, as instructed.
- No dependency file changed. The security sweep found no credential
  material, new endpoint, direct model/API path or shell interpolation in the
  product bridge; Git is invoked with a fixed executable and argv array.
- All verifier-started Playwright and gate-run processes ended, and port 25315
  had no listener at the final process check.

Corrections: **1 source correction**. Committed correction bodies: **1**, in
the commit after this verdict. Mutant blocks: **1**. The missing Luna control
is a product evidence obligation rather than a model-free source correction,
so it has no mutant block; it must be performed through the actual desktop
hook before another fresh verifier may approve.

```mutant
correction: persist conflicting SubagentStart attribution on both the already-bound and pending attempts
file: tools/e2e/scripts/native-codex.mjs
spec: tools/e2e/tests/native-codex.spec.ts
body: a duplicate native identity claimed while another attempt is pending holds both attempts
message: Received array: []
--- old
      const affected =
        already.length > 0
          ? [...new Set([...already, ...pending])]
          : records.filter((rec) => rec.native.launch.sessionId === sessionId);
--- new
      const affected = already.length > 0 ? already : records.filter((rec) => rec.native.launch.sessionId === sessionId);
```

No pack gap was encountered. The ground addendum's missing requested callback,
T-311 oracle and product-loading measurements are recorded here as an evidence
gap; they were not inferred from the candidate or the external bootstrap.

### 2026-09-25 — APPROVED — gpt-5.6-sol@01a0d710-6e7c-70e3-9323-e3bc7c9adc79

This was the guaranteed two-spawn frame. A separate fresh phase one received
the base card without the implementation and produced the frozen attack set;
this fresh phase two opened the candidate diff before the executor notes and
reviewed candidate `bbf858fa8362ec4bdd160c0ed9fd388d12563a1d` against base
`3ec4b8ee9dcbaaa9778372e3562d4360d82fd853`. The requested verifier was
gpt-5.6-sol at xhigh. Provider-observed model identity was unavailable and is
not inferred from that request.

The sealed attack set is
`sha256:56b5840add858d591fa508d22ed9e23289ea8c83d411645d33193ca189a68a64`,
the sealed ground is
`sha256:d8f4aa21919f8d019ba85d7f548e614942b0f6733de87698158eb048fdb5e3ca`,
and the base card is
`sha256:e6aff1cff2f0a8369df32cef2f0507f20c249de0c08a233ab028c24d91399bca`.
All three re-hashed to those saved values before review.

The corrected bridge closes the previously rejected cases. Native reservation
keys canonicalize existing resources before the exclusive T-311 create;
admission rejects ignored residue outside the named policy; lifecycle
reconciliation cannot clear attribution holds belonging to an unknown or
conflicting identity; and duplicate start attribution holds both the already
bound and pending attempts. The committed correction bodies remain
load-bearing in the full end-to-end run. The cumulative checker independently
reads committed, staged and unstaged raw layers plus untracked and ignored
residue, retains modes/types and both rename endpoints, freezes the admitted
fence, and persists checker or authority failures rather than calling them
clean. No dependency was added. The security sweep found no credential
material, dynamic shell execution, model/API path or unsafe new endpoint; Git
is invoked through a fixed executable and argv array, and assignment path
domains reject absolute paths and traversal.

The separate post-candidate desktop control is accepted as live evidence, not
as sealed base ground. Its six-file inventory re-hashed byte-for-byte; the
inventory itself is
`sha256:8f37e6c907b346426e5771eb88820f9abd6b24d05c42a124eedff58332b0abcf`.
The control ran source commit
`285293a5434d7f512c5b399314953113646ff356`; its bridge, hook, run-record and
brief source hashes are byte-identical to the same files at the reviewed tip,
which adds only evidence notes after that source commit. The first record
shows the actual `UserPromptSubmit` extending coordinator-turn continuity,
then a real `SubagentStart`, completed identity probe and explicit bind. The
second record, native identity
`01a0d705-513f-78a3-a33a-1118996a8508`, records a clean actual PostToolUse for
the allowed `docs/tasks/native-control-proof.txt`, followed by a yielded Bash
operation whose actual PostToolUse found preserved
`outside-control.txt` as `untracked-out-of-fence`. The next allowed append was
denied by the persistent hold. T-311 then recorded the task ended with no
owned job, while the independent final collect gate remained ineligible with
no inflight operation and the out-of-fence holds active. The live assignment
requested gpt-5.6-luna at low; its provider-observed model is `unknown` and is
not substituted.

| Acceptance criterion | Evidence and verdict |
|---|---|
| Admission and binding | **Met.** `startRun`, `prepareNativeRecord`, `bindNativeIdentity` and `handleNativeEvent` implement pre-spawn admission, canonical exclusive reservation, exact callback/probe binding and identity-only routing. The exact-routing, unbound-child, conflicting-writer, canonical-alias, disjoint-identity and conflicting-start bodies all passed at `bbf858fa8362ec4bdd160c0ed9fd388d12563a1d`; the live records independently show real start/probe/bind tuples. |
| Shared cwd and resource authority | **Met.** The shared-cwd and apply-patch endpoint bodies passed. The live first control was refused when it supplied only a workdir; the second succeeded only with the explicit assigned-root prefix. Record resource and frozen fence, not callback cwd, drive the checks, and the run report carries the repository-only boundary. |
| Automatic completion checks | **Met.** The shell-created, ignored-residue, tracked-output, raw mode/type/rename, checker-error, unreadable-authority and actual yielded-late bodies passed. The live yielded operation returned early output, completed later, and its actual product PostToolUse persisted the out-of-fence finding. No model turn or product suite participates in the path decision. |
| Hold and stop semantics | **Met.** Model-free stop/interrupt, unknown-identity, live-owned-job and exact-ref collect/continue controls passed. The live violation remained on disk, denied a later supported operation, survived native task cessation and no-owned-job reconciliation, retained the reservation, and made the independent collect gate refuse; neither hook refusal nor stop callback was treated as cessation. |
| Bodies and live proof | **Met.** All 17 native bridge bodies and all 44 shared run-record bodies passed inside the one graded end-to-end leg. The hashed real desktop control establishes loading/trust, native attribution, an allowed path, a refused path, a persistent hold and actual yielded completion against byte-identical corrected source. Requested Luna-low and observed-model-unknown are reported separately. |

The required one graded range invocation at
`bbf858fa8362ec4bdd160c0ed9fd388d12563a1d` derived 13 changed paths and failed
closed to the whole battery because `.codex/hooks.json` is outside the package
map. Parser passed 454/454; app passed 1,171/1,171; Rust was green over 662
counted bodies and 18 targets. End to end ran 1,271 bodies: 1,270 passed and
one failed. The sole failure was `THE VERIFIER'S BRIEF ASSEMBLES`, whose
message names the known live T-315-s1/T-205-s5 collision over
`tools/e2e/tests/brief.spec.ts`. It is attributed board state, not a native
product-body failure; the coordinator required one run, so no duplicate rerun
was made.

Corrections: **0**. Committed correction bodies: **0**. Mutant blocks: **0**.
All prior rejected verdicts remain unchanged. No pack gap occurred. The guarded
ground addendum did not contain phase one's requested hand measurements; that
is recorded as a ground-evidence gap rather than silently backfilled. The
later live control is independently hashed post-candidate evidence and cannot
retroactively become sealed ground, but it directly decides the card's live
proof criterion.


### 2026-10-02 — APPROVED — gpt-6.1-sol@01a0fbe2-4f40-7d01-9382-21b506b533ce — scoped callback transaction candidate

This approves the reviewed code candidate for coordinator staging and its
subsequent deployed-hook control. It does not establish final native
qualification or permit publication. The actual integration hook still loads
the older integration source; the new real desktop control is **pending**.
The coordinator sequencing note in ask-verifier-T-315-s1.md preserves that
remaining obligation, including actual callback identities, exact source and
an independent final full-range scan before final acceptance.

Attempt T-315-s1-a15 was a fresh native scoped repair verifier, explicitly
bound after the completed identity probe. The configured assignment was
GPT-6.1 Sol at xhigh; provider-observed model identity is unavailable and is
not inferred from the request. This was not a fresh two-spawn qualification:
the original attack set and ground are historical sealed inputs. The initial
repair-base card read included historical implementation notes before the
candidate diff, and the supplied brief named recovery specifics. No blind
repair-specific phase one or executor conversation is claimed. The brief did
not print a tier; the canonical card is guarded, and the range-derived
verifier gates were run rather than selecting a cheaper tier.

Reviewed repair base: `2cb2902237841070a6865b2a500117114454f3cd`.
Reviewed candidate: `81eb07db02499675db126bd9ae8a0642c0ebab5c`.
The five-file range and the detached verifier authority agree; no manifest,
hook definition, other checkout, merge or push was changed.

attack set: sha256:56b5840add858d591fa508d22ed9e23289ea8c83d411645d33193ca189a68a64 (attack-set-T-315-s1.md)

ground: sha256:d8f4aa21919f8d019ba85d7f548e614942b0f6733de87698158eb048fdb5e3ca (ground-T-315-s1.md)

The entire five-input verifier-inputs-gpt61.sha256 inventory re-hashed before
review. The independent controls are preserved as verifier-controls-T-315-s1.ts,
sha256:6d45539205d6d35126e5ada24ac4e1e0d579a615461b47d098d0e92fcd92e6d2,
in the coordinator's repair evidence packet. They were temporarily appended
to the candidate spec for the bench run and then removed by the saved-byte
snapshot; they are reproducible proof, not new shipped correction bodies.

The project lock covers authority selection, validation, cumulative checking
and publication, not merely atomic rename. Public start, bind, observe,
answer, collect, continue and stop enter that same transaction; wait delegates
its mutations to observe. A call-site sweep found no separate coordinator
writer bypassing those public paths. Status inspection includes an unreadable
sidecar only in memory: the independent control asserted unchanged record
bytes and nanosecond mtime and retained sidecar bytes. Old native version-one
records remain readable; the transaction metadata adds no required record
field.

Primary-lock recovery revalidates the exact PID and token inside an exclusive
recovery gate. Cooperating acquirers check the gate before and after identity
publication. The deterministic two-reclaimer control preserves a live
successor after the stale claimant resumes. Independent controls also refused
a missing owner and a live PID, recovered a genuinely exited primary owner,
and killed a claimant after recovery-gate acquisition: that abandoned gate
remained a named fail-closed refusal. It is not automatically recoverable.
A live reused PID remains uncertain rather than being treated as dead.

Four independent controls passed 4/4 against candidate source. Candidate
adapter subprocesses, supplied with fixture event envelopes, retained three
exact pre/post receipts and an earlier violation hold after a later completion
check was independently clean. Forced actual adapter Interrupt contention
returned durable NATIVE_TRANSACTION_BUSY in 1,563 ms on the restored run,
inside the deployed 3,000 ms budget. The 1,500 ms bound is lock acquisition,
not a hard full-hook bound; checker Git calls have no individual timeout.
Separate atomic-replacement error and synchronous-nesting controls confirmed
temporary-file cleanup and usable ownership after an exception. None of these
supplied envelopes substitutes for a deployed native callback.

Seven independent source inverse drills returned red at their intended
properties: non-exclusive lock creation missed the callback contention
barrier; removing observe's transaction missed coordinator contention;
a constant refusal filename changed the second reporter to EEXIST; removing
owner revalidation replaced the live successor's PID; clearing holds on a
clean completion made the adapter return no block; a status-side write changed
the record bytes; and a 3,200 ms acquisition ceiling failed both the literal
hook-budget assertion and the actual adapter timeout control. Every landing
was read from git diff. After restoration, the four independent bodies passed
4/4 again and source hashes matched the reviewed candidate:

- native-codex.mjs: sha256:cd55491f80276d0055401f12b1a0246300c07cf63bd78a33565c781262f296b2
- run-record.mjs: sha256:0fe2512bf7bcbeff93880807ef0ec604eb43f054119eb5c07e5b2e8e30f7080e
- native-codex.spec.ts: sha256:181de3c32bef88286789e825a23b2f410c8dbcefd795e17c57ac4f6a1f95e026

| Criterion | Evidence and scoped judgement |
|---|---|
| Original admission and binding | Existing exact binding, unbound-child, duplicate identity, canonical alias and reservation bodies passed at the candidate; public admission/bind now share the callback transaction. No new live attribution is claimed. |
| Original resource authority | Shared-cwd and every patch-endpoint body passed; resource and frozen fence remain record authority. Repository-only isolation limitations remain unchanged. |
| Original automatic completion checks | All candidate native bodies passed, including raw layers, ignored/tracked paths, checker failure and yielded completion. Independent candidate adapter controls retained exact receipts and the earlier hold across a later clean check. |
| Original hold and stop semantics | Candidate live-owned-job, identity-hold, exact-ref collect/continue and sticky contention controls passed. A refusal remains unknown through lifecycle reconciliation and collection. |
| Original bodies and live proof | Model-free coverage is green; the new deployed-hook desktop control is pending. This scoped code verdict does not re-establish the full card's live-proof claim. |
| Repair serialized event transactions | Separate-process Pre/Pre and Post/Post barrier body retained both identities, both completions and the late violation hold. Non-exclusive acquisition was discriminated. |
| Repair coordinator authority protocol | Observe-versus-callback barrier and its inverse mutant discriminated the shared protocol; source sweep covers start/bind/answer/collect/continue/stop and wait delegation. Independent status control preserved disk bytes and clock. |
| Repair bounded contention and owner recovery | Unique fail-closed reporters, exception/nested controls, real-dead primary owner, uncertain/live PID and two-reclaimer successor proof passed. The abandoned recovery gate refused conservatively; actual adapter contention took 1,563 ms. |
| Repair concurrent failure evidence | Two contention reporters survived damaged-authority absorption and later collection; the constant-name inverse failed. Existing unknown-attribution and unreadable-authority bodies passed inside the candidate range. |
| Repair serial route and real native demonstration | Candidate adapter serial positive controls passed. Deployed source, real native envelopes/identities, concurrent read-only operations and the final unauthorized-residue control remain coordinator-owned and unobserved. Publication remains held. |

The one graded candidate-range invocation at
`81eb07db02499675db126bd9ae8a0642c0ebab5c` derived parser, app and 18
end-to-end specs. Parser passed 454/454 and app passed 1,171/1,171.
End to end passed 1,001/1,002, including all 21 native and all 44 run-record
bodies. Its sole failure was THE VERIFIER'S BRIEF ASSEMBLES, explicitly
naming the known T-315-s1/T-205-s5 collision over
`tools/e2e/tests/brief.spec.ts`. This is the preserved board-state red,
not a repair-owned assertion failure. Live authority was not changed.
This verdict's prose-write gates are checked after its commit; their actual
readings belong to the handoff rather than being marked observed in advance.

The security/interface sweep found no new dependency, credential, endpoint,
dynamic shell execution or broadened filesystem authority. New disk paths are
fixed metadata paths under the coordinator root, and child processes used by
the independent controls terminate in isolated fixtures. One process census
mistakenly matched its own shell and terminated that shell; the source was
immediately restored by hash, and a corrected executable-based census found
no surviving fixture child. That verifier command error is not product evidence.

Corrections: **0**. Committed correction bodies: **0**. Mutant blocks: **0**.
The supplied context pack's named chapters were read; no additional pack gap
occurred. The missing printed tier and non-blind scoped repair frame are
disclosed above. No deployed event or future gate result is marked observed.

### 2026-10-02 — APPROVED — gpt-6.1-sol@01a0fc1a-2829-7ad1-a079-ab07843f6a56 — final scoped callback repair evidence acceptance

This accepts the callback transaction repair at frozen source-review tip
`4609d220bd8a89383d3d989de20c2f3977e86562`, combining the independent
T-315-s1-a15 source verdict with the real deployed T-315-s1-a17 control.
The coordinator still owes the exact merged-tree publication range and its
named runner evidence before publication. This entry records no future push
or CI result, and does not establish T-315-s2 full native delivery.

T-315-s1-a18 is a fresh independent final evidence acceptance, explicitly
bound after its completed identity probe. The configured assignment is
GPT-6.1 Sol at xhigh; provider-observed model identity remains unknown.
There was no new blind repair-specific phase one, executor conversation,
source review, inverse drill or full-suite rerun in this pass. The narrow
final brief names the evidence and source hashes; it supplies neither a new
CONTEXT PACK nor a tier. The standing state/index, verifier role and relevant
shell/docs-gate chapters were read on demand. This is a disclosed scoped
acceptance supplement to a15, not a replacement guarded qualification.

Historical sealed inputs were re-hashed, without claiming a fresh
precommitment:

attack set: sha256:56b5840add858d591fa508d22ed9e23289ea8c83d411645d33193ca189a68a64 (T-315-s1-review4/attack-set-T-315-s1.md)

ground: sha256:d8f4aa21919f8d019ba85d7f548e614942b0f6733de87698158eb048fdb5e3ca (T-315-s1-review4/ground-T-315-s1.md)

The a15 reviewed source bytes and the actual deployed integration bytes
match. The trusted hook definition is unchanged:

- native-codex.mjs: sha256:cd55491f80276d0055401f12b1a0246300c07cf63bd78a33565c781262f296b2
- run-record.mjs: sha256:0fe2512bf7bcbeff93880807ef0ec604eb43f054119eb5c07e5b2e8e30f7080e
- native-codex.spec.ts: sha256:181de3c32bef88286789e825a23b2f410c8dbcefd795e17c57ac4f6a1f95e026
- trusted hooks.json: sha256:e1544d0be9733458ccc1546dbaf81175167de2e1dcf50b39b23d0abb32fa676c

Evidence below is relative to the coordinator's native-transaction-repair
packet. The raw a17 run record exactly matches the record retained in
`deployed-control-collected.json`; a15 and a17 both have observed terminal
outcomes and no registered owned jobs remaining. Raw receipts retain actual
Post callback flags, exact tool-use/agent/turn identities and completion
check results. No supplied fixture envelope or fabricated Post is used as
real desktop proof in this acceptance.

| Criterion | Evidence and final scoped judgement |
|---|---|
| Admission and binding | a15 retains the independent source judgement. a17's launch, completed identity probe and explicit binding agree with every serial, paired and delayed completion receipt. No distinct simultaneous writer routing is claimed. |
| Shared cwd and resource authority | a17 commands and receipts belong to its admitted resource at the frozen tip. The earlier a16 coordinator command lacked the required exact resource prefix and was correctly held; `deployed-control-prefix-refusal.json` records that failed attempt and reconciled release. This is a coordinator preparation error, not a source defect. |
| Automatic completion checks | `deployed-control-serial.json` matches six actual clean Pre/completion pairs. `deployed-control-pair.json` matches two actual clean read-only completions whose intervals overlap, with neither receipt lost and no inflight operation or hold remaining at that observation. The later artifact is present before the actual delayed Post records its violation. |
| Hold and stop semantics | `deployed-control-negative.json` and `deployed-control-record-before-cleanup.json` retain the out-of-fence artifact, full negative scan and attempt hold. The delayed process probe reports exit 1 for the exact PID. `deployed-control-terminal-held.json` retains both the Post and final-release holds after RUN-DONE reconciliation. Only subsequent exact artifact cleanup, the independent clean full scan and built collection clear the ordinary holds and release the reservation. |
| Bodies and live proof | a15's unchanged model-free and inverse evidence is preserved. a17 supplies the new real deployed callback demonstration for this repair. Its requested model was Sol xhigh and its observed model is unknown; it is not relabelled Luna-low or treated as a new fulfilment of every original live-proof obligation. |
| Repair transaction and coordinator protocol | The source hashes preserve a15's accepted serialization, shared coordinator protocol, bounded contention, recovery and concurrent failure evidence. The deployed overlapping read-only pair adds observed receipt retention under callback overlap; it does not prove arbitrary tool or multiwriter concurrency. |
| Repair serial route and deployed negative control | At the frozen tip, serial completion receipts are clean; the delayed actual completion records `untracked-out-of-fence` for `native-control-outside-fence-T-315-s1.txt` and persists `cumulative-check-failed`. The subsequent clean scan and built collect retain the earlier finding as history while clearing reconciled ordinary holds. |

The observed pair intervals are 10:07:54.569Z–10:07:54.926Z and
10:07:54.744Z–10:07:55.102Z on 2026-10-02 in the a17 packet. The delayed
artifact's mtime is 10:09:03.775Z, before its actual completion receipt at
10:09:05.100Z. The negative full scan was preserved before cleanup; the
collected record retains the prior failure after lifecycle reconciliation.
The safeguard remains repository scoped, with no arbitrary shell-write,
OS filesystem or read-isolation claim. Native interruption or a Stop callback
alone is not treated as proof of cessation.

| Packet file | sha256 |
|---|---|
| verifier-result-T-315-s1.json | a4805e142468f335e07ed579748526ee88c2c9ee09115ec8facb347c31ed6424 |
| deployed-control-serial.json | 0c8432fca024e2b07892819ec5039c9cbd73b729b4f68668b0226b02a936e1e0 |
| deployed-control-pair.json | a04cc845a2ccaa3acf04a107769f2c0f2a273dbd272a6f57e767a2a131b1bf8d |
| deployed-control-negative.json | a615acbdfc0d9807f9987fd2f41d64166f7ad268dcd5644b030e1d4d3c7c14cb |
| deployed-control-record-before-cleanup.json | c91c59312f272efecf1bf24380e5d59fa33aa1c1fa4233c29b82361c908d5f37 |
| deployed-control-terminal-held.json | 75075711c79dd558e9bce7a2aecad271648710357a72f0d175e91f5644e9d299 |
| deployed-control-cleanup-scan.json | 92d0d2b42b8d48d7281523fc7ea7b735b0733680e2cc1d095a0ca6ad3e8496ee |
| deployed-control-collected.json | 4f5dce5d72936b7fd4cee28bdcb7c1ce4b14f8507632b04a9d9da0945d85b19e |
| deployed-control-prefix-refusal.json | 40f2c40932203b4d89453973d15e30ac7bee51bbaa9cbe6fc2ba4b5049f736b2 |

Structural record correction: the intact historical Repair ledger moved
before the single canonical Verdicts section. At the frozen input tip,
`newestVerdict()` selected its trailing September 25 entry, hiding a15's
October 2 source verdict. The canonical section now ends the card, preserves
a15's entry verbatim and receives this final entry. This corrects card order;
it is not a source repair or a rewrite of historical findings. The active
Acceptance criteria and frontmatter are unchanged. The direct reader and
byte-preservation checks are the focused proof; no product property needs a
new committed correction body or mutant block.

Source correction bodies: **0**. Mutant blocks: **0**. No new source,
test, census, trust, authority or hook edit is part of this pass. The existing
a15 known T-315-s1/T-205-s5 brief-fence collision remains named evidence, not
an assertion that future gates will be green. The document gate identifies
parser, app and end-to-end obligations for this card write; those exact
merged-tree suite readings remain coordinator owned and pending. Focused
provenance, document, section-order and full-scope checks follow this write;
their actual results and final full tip are reported in the handoff. This
seat launched no background or owned job; its own native terminal state is
reconciled by the coordinator after its final notification.
