---
id: T-349
title: Expand repository-qualified task and component fences through one canonical pure model
feature: F-03
milestone: 4
priority: 1
size: M
tier: guarded
status: verifying
suggested_by: codex/gpt-6.1-sol @architect
blocked_by: [T-347, T-348]
touches: [lib/parser/src/fence.ts, lib/parser/src/pure.ts, lib/parser/test/fence.test.ts, method/tasks/TASK-FORMAT.md, method/interview/plan-interview.md, app/src-tauri/src/agent/kit.rs, docs/CONVENTIONS.md]
builder: gpt-6.1-sol@xhigh
verifier: gpt-6.1-sol@xhigh
review: independent
---

Give task fences a repository role as well as a path, so a product file and a private record with the same relative name are distinguishable. Preserve one component expander and collision rule. This contract produces a pure planning model; it does not authorize split writes or claim a live reservation.

## Finding and reconciliation

Prepared at product commit e5099a01c019e7a2df748d3447817d36a5e0d473. T-347 supplies explicit workspace roots and physically confined qualified resources. T-348 freezes committed cards and associations with a distinct product starting commit. The canonical parser fence model still consumes paths in one repository, and the existing write arms still use that model. The parser's pure entry already exports the canonical fence functions; component paths and task touches are string arrays. This is the remaining resource-token/component part of migration M1. It neither supersedes T-303's portability work nor qualifies T-244-s1's installed package. Writable reservation, native monitoring and landing consumers are later contracts.

## Acceptance criteria

- WHEN a caller requests a qualified fence THE pure model in lib/parser/src/fence.ts SHALL accept string path tokens of the form `product::path` or `records::path`, and bare component slugs expanded from the supplied frozen component registry. It SHALL retain the raw token, resolved role, normalized repository-relative domain, component identity and resolution rule. Task touches and component paths SHALL remain string arrays. Unknown namespaces, malformed qualifiers, unsafe domains and unresolved slugs SHALL make the result unusable with named issues, never an empty disjoint fence. Qualified tokens SHALL be rejected by the legacy one-repository expander, including when encountered in component paths, rather than treated as literal filesystem names.
- WHEN a bare legacy path is used in a split workspace THE caller SHALL supply an explicit ownership map for that exact legacy token or component path. Resolve a bare component slug before ownership lookup. Apply ownership mapping to each unqualified expanded path using its exact trimmed source string. Qualified paths fix their own roles; a same-spelled domain in another role SHALL NOT itself constitute a mapping conflict. No mapping, multiple owners for one unqualified key, or an attempt to remap a qualified token SHALL be unusable. The pure model SHALL not infer ownership from a directory spelling, the card's residence, the product branch or the existence of a file. With colocated roots, ordinary legacy tokens SHALL retain the existing normalization, slug expansion, own-card exclusion and overlap behavior. The mapping and registry are supplied data, not a second embedded component table.
- WHEN a component expands to paths in both repositories THE same canonical expansion SHALL retain every qualified path and its origin without flattening the roles or silently dropping one side. Unqualified paths in that component SHALL use the same explicit legacy mapping rule. The public browser-safe entry lib/parser/src/pure.ts SHALL expose the qualified model and its types without filesystem imports, import-time I/O or a duplicate YAML/component parser.
- WHEN a qualified fence is expanded or compared THE caller SHALL supply measured canonical filesystem roots and canonical Git common-directory identities for its roles. Missing or inconsistent facts SHALL make the result unusable. Distinct participating roots that share a Git common directory, or whose canonical filesystem roots are nested, SHALL be reported as unsupported and unusable; colocated roots SHALL remain supported. Association identity, commit identity and role labels SHALL NOT substitute for those facts. Comparison SHALL validate its supplied facts against the captured expansion facts and use the validated roots and normalized path containment: identical relative paths in supported independent repositories are disjoint, while overlapping domains in colocated roles collide. Any unusable input SHALL force the qualified comparison to return unusable, even when partial inputs provide overlap witnesses. Witnesses SHALL identify both roles, domains, filesystem roots and Git common-directory identities. The pure model SHALL not claim to perform the measurement, reserve a resource or enforce a writer.
- WHEN a fence would contain the protocol's task directory or exclude its own card THE existing unfenceable-domain and own-card rules SHALL be applied only after validating the identity/topology facts, to the actual records domain; exclusions SHALL be keyed by canonical filesystem root and normalized domain. A same-spelled product file in another repository SHALL not be excluded as the card itself. Root escape, directory containment, slash boundaries and unusable-input behavior SHALL remain conservative. Already supported legacy positive controls SHALL remain effective; a directory token SHALL not be advertised as a reservation merely because the pure model can describe it.
- WHEN the grammar is published THE method/tasks/TASK-FORMAT.md text SHALL state the qualified path and component rules, explicit legacy mapping, physical-identity limitation and the difference between a planning domain and write authority. The existing method-version stamp SHALL be advanced consistently in method/interview/plan-interview.md, app/src-tauri/src/agent/kit.rs and docs/CONVENTIONS.md through the standing bump/evaluation process. No room ruling, physical split binding or writable split route SHALL be introduced by this card.
- WHEN the model is verified THE bodies in lib/parser/test/fence.test.ts SHALL prove mixed components, same path in distinct repositories, colocated aliases, explicit legacy mapping and its ambiguous/missing refusals, a qualified product path beside a same-spelled path mapped to records, shared-common-directory and nested-root refusals, inconsistent comparison versus captured facts, unusable-with-witness precedence, unknown qualifier refusal, unsafe domains, directory containment, own-card versus same-spelled product file, legacy refusal of qualified component paths and browser-safe public exports. Controls SHALL demonstrate that removing role/physical distinctions or dropping a mixed component's path makes the relevant body fail. The final notes SHALL name the delivered API and distinguish pure comparison from live reservation/landing qualification.

## Implementation notes

### Executor criteria echo — 2026-10-04, before implementation

- [x] Accept role-qualified paths and frozen-registry slugs, preserving source and resolution metadata; refuse invalid inputs and legacy qualified tokens, including component paths.
- [x] Require exact explicit ownership for every bare split path after component expansion; refuse missing, ambiguous and qualified remapping; preserve colocated legacy semantics.
- [x] Preserve both sides and origins of mixed components, and expose the same pure model and types from the browser-safe entry.
- [x] Validate supplied canonical roots and Git common directories, reject inconsistent/shared/nested split identities, and make unusable comparison dominate retained witnesses.
- [x] Apply task-directory refusal and own-card exclusion to the actual records root after identity validation, preserving containment and legacy controls.
- [x] Publish the qualified planning grammar and advance all three method stamps consistently to 0.1.38 with the standing evaluation evidence.
- [x] Prove the listed behaviors, public exports and discriminating controls; report APIs, tests, per-body drills and the planning-only authority limit.

Draft v2 outside the product repository, incorporating independent review v1. Qualified domains reject absolute paths, root escape/traversal, control characters and Git/runtime control paths; qualifications designate paths, while bare component slugs expand through the supplied registry. The qualified comparator’s unusable precedence is explicit; legacy comparison behavior is unchanged. Supplied measurement facts are frozen in expansion results, not assumed from a workspace label. Size M is provisional: one canonical pure-fence test cycle, with the required method publication/bump checks. Derive the actual tier at dispatch; do not write a speculative tier into frontmatter. The two roots remain colocated in this project throughout the lane. Existing legacy guards must continue refusing unsupported qualified writes.

Requested implementation and independent code verification: GPT-6.1 Sol extra-high through native desktop workers. Requested identity is not observed provider identity. No separate workflow demonstration is required by this card; any deterministic workflow-only control that is needed uses GPT-5.6 Luna under the owner's setting.

### Executor delivery — 2026-10-04

Delivered in implementation commit a95371fe5d7e603f1e872eed787cad5dcbb8e94e.
The public browser entry exports `expandQualifiedFence(task, components,
options)` and `compareQualifiedFences(a, b, repositories)`, with
`FenceRepositories`, `FenceRepositoryIdentity`, `FenceRepositoryRole`,
`FenceLegacyOwnership`, `ExpandQualifiedFenceOptions`, and the
`QualifiedFence*` result, token, path, issue, exclusion, rule and witness
types. Identity facts are `filesystemRoot` and `gitCommonDirectory`.
Ownership is a caller-supplied readonly map from exact trimmed path source
to one repository role. The captured result and its identities are frozen.
The canonical registry join serves the existing legacy model and the
qualified model. No YAML parser, component table, filesystem measurement,
writer, reservation or landing route was added.

Criteria evidence: mixed components retain every origin; explicit mappings
run after slug expansion and before normalization; role-qualified paths
fix ownership; comparisons validate their supplied facts against both
captured expansions and give unusable input precedence over witnesses.
Topology validation precedes records task-directory rules and exclusions,
which carry the canonical filesystem root and normalized domain. Legacy
consumers reject qualified task and component paths. The method grammar
states the planning and write-authority boundary; the three stamps advance
to 0.1.38 together.

Focused iteration at the candidate bytes subsequently committed as
a95371fe5d7e603f1e872eed787cad5dcbb8e94e: fence file 67 passed, comprising
52 existing and 15 new bodies; parser typecheck and parser/app builds exit
0. No assertion or fixture was weakened. Final graded suite readings run
AFTER this notes commit and are handed off separately with their exact
commit, counts, exits and logs. The last status-only commit deliberately
re-runs nothing under the executor's stamp exemption.

Method bump evaluation on those candidate method bytes: 13 model-free
evals pass (exit 0); model-in-loop cannot run (exit 3), runner NONE, so the
bump is not gated on a model-in-loop measurement. This block is in the
implementation commit message. An initial MF-01 module-load refusal before
tools/e2e installation cleared after completing setup; it was not a method
verdict. Known MF-09 selftest baseline RED remains separate from normal
evals. Neither normal evals nor replayed controls resolve that baseline or
the unknown model-in-loop result.

### Self-drill block

All drills are at a95371fe5d7e603f1e872eed787cad5dcbb8e94e, one production
side changed per drill, each planted diff read back before its run. Each
ran the FULL fence file (67 bodies), exited 1, and killed the target new
body. The other failures below are related properties in that same file;
no existing body failed. Logs and JSON assertions are `drill-NN-T-349.log`
and `drill-NN-T-349.json` in the assigned execution evidence directory;
`drills-T-349.json` retains exact mutations, exits, failure names and each
restoration receipt. Native execution confines commands to this admitted
lane, so no extra detached scratch worktree or helper was created.

| Drill | Production property removed | Failed / passed | Target body (new-body order) |
|---|---|---|---|
| 01 | retain only the first path origin per component | 1 / 66 | mixed component origins |
| 02 | remove filesystem-root distinction from comparison | 2 / 65 | independent same-spelled domains |
| 03 | separate colocated aliases by role label | 1 / 66 | colocated alias witness |
| 04 | normalize the ownership key before lookup | 2 / 65 | exact legacy source mapping |
| 05 | infer a split bare path's owner without a map | 2 / 65 | absent/ambiguous ownership refusal |
| 06 | allow remapping a qualified token | 1 / 66 | qualified remap refusal |
| 07 | return no identity-validation issues | 2 / 65 | identity/topology refusals |
| 08 | skip comparison versus captured-fact validation | 1 / 66 | captured-fact consistency |
| 09 | let overlap outrank unusable input | 1 / 66 | unusable-with-witness precedence |
| 10 | allow every normalized qualified domain | 1 / 66 | unsafe/unknown input refusals |
| 11 | apply records protocol rules to every root | 2 / 65 | actual records-root rules |
| 12 | drop filesystem root from exclusion matching | 1 / 66 | independent same-spelled own-card file |
| 13 | compare qualified domains only by equality | 2 / 65 | containment/slash boundaries/legacy parity |
| 14 | allow qualifications through legacy expansion | 1 / 66 | legacy qualified component refusal |
| 15 | omit qualified public function exports | 1 / 66 | browser-safe public entry |

Positive controls were seen failing against missing-property implementations:
drill 01 drops the records half of the mixed component, drill 02 removes
physical distinctions, drill 03 treats colocated aliases as separate, and
drill 11 removes the actual-root distinction. Their respective new bodies
fail rather than accepting the degraded implementations. These are pure
model controls, not live writer or native-monitor qualification.

Every restoration used `git restore --source=<implementation commit>
--staged --worktree -- <mutated path>` and matched SHA256 against the
commit's bytes; an empty diff against that explicit commit accompanied it.
For drills 01 through 14, `lib/parser/src/fence.ts` restored to
`5c3b06bf6fe3336823285c9c2cd5cfbde527fd57b0218223e1c41cef8ef8e0ca`.
For drill 15, `lib/parser/src/pure.ts` restored to
`862344184fb93d24a99a0858681a7e25b339027780265294f7354427c7645047`.
An initial drill-12 patch anchor was refused without changing the file;
the full-line anchor then landed and produced the recorded red result.

### Fence, gates and handoff limitations

Eight changed tracked paths at the implementation commit: seven exact
manifest source paths and this card's ordinary protocol notes. The armed
manifest and card agree on the seven paths. No widening, room ruling,
physical split binding or integration checkout write was performed. No
in-fence follow-through or out-of-fence implementation finding was needed.
Public planning domain support does not authorize writable split resources
or directory reservations. The current project remains colocated.

The actual lane range owes parser, app, rust and whole e2e according to
`gate-run --owed-set --range`; changing these notes keeps the same path set.
Graph regeneration, boot, docs-reader suites and model-free method evals
fire on that range. Generated graph and document currency repairs are
integration-owned and outside this manifest: report their actual gate
results and required regeneration, never edit them here. The final handoff
re-derives the set at the graded notes commit and reports all readings.

Brief corrections: STATE's completed-batch dispatch restriction is older
than the owner's grant18 supplied by the coordinator; the card's requested
builder differs from the brief's runtime-default Claude builder. The card
and native binding govern this execution. Actual provider identity,
effort and per-seat token usage were not exposed to this executor and
remain unknown; the requested identity is GPT-6.1 Sol extra-high. Setup
finished before the final graded run, and every owned job must cease
before the terminal report.

## Verdicts

### 2026-10-04 — APPROVED — gpt-6.1-sol-requested@01a1078e-19ad-76b1-a215-99cccb0e76b6

Independent approval of the pure planning implementation at
`f804657b315c1c7718b2a6dad9d4370e961b746d`, against frozen base
`902ab1b7cd74d532c879a3067326f58f7d6fda90`. This approves the delivered
`expandQualifiedFence` and `compareQualifiedFences` model. Publication
still requires integration-owned generated-output repairs and exact-tip
gates; the local browser battery is RED as recorded below. No source
correction is assigned: corrections 0, committed correction bodies 0,
mutant blocks 0.

attack set: sha256:4373da2eb42bb01cfd6a94975c9bebd211f3f163f6d892860f4849c11c41ec37 (attack-set-T-349.md)
ground: sha256:3fba81a741c30365ab6dc157cf860df7d75b32dcc72e9da0cb46fd890cdfbefe (ground-T-349.md)
raw base card: sha256:b18dc4c4dd0a274b464d721dbc6208afa61e448e5e6fa1674322cd4d116a75e5

**Actual frame.** A fresh native-desktop phase-two spawn, registered and
explicitly bound as `T-349-a3` to observed thread
`01a1078e-19ad-76b1-a215-99cccb0e76b6`, canonical task
`/root/migration349_phase2_gpt61`, under the prepared `detached-verifier`
profile. The complete canonical packet was delivered by its immutable
file, not pasted inline. Requested identity: GPT-6.1 Sol, xhigh; observed
backing model, effort and usage: unknown. No helper agent was used.
The boundary is procedural, not filesystem or operating-system isolation.

A metadata probe accidentally displayed the preparation's frozen raw
base-card Implementation notes before the candidate diff. This orientation
was therefore not unexposed. The displayed base notes contained planning
limits and model assignments; no candidate executor rationale, transcript,
report or prior verdict was displayed. The coordinator explicitly ruled
that this disclosed breach did not require another pass. Subsequent raw
authority checks emitted only metadata and digests. Raw base bytes,
embedded card bytes, resource/profile/base/candidate and authority digest
all matched; preparation digest was
`4fabed4d4c2a07208d12e10ca11e70534426ca062a3fff2253e34691ee9d13de`.
I read the diff before the candidate card's delivery notes, and did not
read executor conversations, reports or commit messages.

**Criterion evidence at the candidate above.** Independent attacks used
the freshly built public entry and remeasured canonical roots and Git
common directories from the sealed disposable fixtures, including the
colocated symlink alias. All 41 checks passed; their concrete inputs and
outputs are in `phase2-v1/independent-attacks-T-349.json`.

| Criterion | Judgment and deciding evidence |
|---|---|
| C1 — grammar, provenance and legacy refusal | PASS. Direct and mixed-component expansions preserve raw/source/role/domain/component/rule. Independent invalid-token checks run alone and beside a valid resource and remain unusable. The delivered named-issue body distinguishes malformed, unknown, unresolved and unsafe cases. The legacy component-path control removes only component qualification refusal and makes its body fail. |
| C2 — explicit legacy ownership and compatibility | PASS. Independent checks distinguish the exact trimmed `docs//plans/design.md` key from its normalized spelling and refuse slug-only maps. Split bare paths require one explicit owner; ambiguous arrays preserve both owners in the fixture. Qualified product and bare mapped-records resources with equal domains remain usable and disjoint. Existing colocated legacy normalization, component expansion, exclusions and overlap controls agree. Ownership-key, missing-owner and ambiguous-owner mutants fail their intended assertions. |
| C3 — mixed components and public pure surface | PASS. Independent mixed-component checks collide separately with product and records paths and are disjoint from an unrelated path; a changed supplied registry changes expansion. Data controls drop each mixed fixture member separately and fail the exact origin body. A fresh source bundle with browser platform and an import of that bundle expose both functions. The typecheck compiles public types, and the inspected 89-input dependency closure adds no filesystem/import-time I/O layer or second YAML/component parser. |
| C4 — measured physical identities and comparison | PASS. Remeasured independent roots separate equal domains; the canonical colocated alias collides with both identities in the witness. Missing, inconsistent, shared-common-directory and nested-root arrangements refuse. Comparison rejects changed root/common-directory facts versus captured expansions. Partial invalid input remains unusable with an actual overlap witness. Physical-root, role-alias, shared-common-directory, nested-root, captured-fact and unusable-priority controls fail at those properties. |
| C5 — records protocol rules, exclusions and containment | PASS. An independent product file survives the same-spelled records own-card exclusion. Colocated roles share physical exclusions. Invalid identity facts cannot be erased by own-card handling. Records task-directory/parent refusal, independent product directories, sibling boundaries and supported legacy positives are exercised. Protocol-directory, records-root, own-root, containment and slash-boundary controls distinguish those properties. |
| C6 — publication, consistent bump and scope | PASS for published grammar, consistent advancement to 0.1.38, and the required evaluation attempts. The format states exact ownership, mixed origins, physical topology limits and planning versus write authority. Rust snapshot/version checks pass. Normal model-free evaluation passes 13 evals, exit 0. Positive-control selftest remains the sealed MF-09 baseline RED, exit 1. Model-in-loop is UNMEASURED, exit 3, because its runner is unset; no method-effectiveness pass is claimed. The diff introduces no room ruling, physical split binding or writable split route. |
| C7 — required bodies, controls and delivery claims | PASS. The candidate fence file executes 67 bodies, including 15 new bodies, within the green 469-body parser leg. All 71 new matcher sites were individually poisoned and went red. The 23 targeted production/data controls also went red, with the intended body failing in each full 67-body run. Role/physical erasure, each mixed-member removal and legacy qualified-component refusal were demonstrated rather than inferred from body names. Delivery notes name the public APIs and retain the pure-planning authority limit. |

**Drill and restoration evidence.** All 94 controls above exited 1 with
executed bodies, never a syntax/setup failure or a zero-body grade. Each
landed mutation was read from its diff, then restored from the named
candidate with a SHA256 comparison and an explicit-ref empty diff. The
native preparation confines this seat to its admitted detached bench;
the controls ran there with no added worktree or writer. The initial whole
battery had actually ceased before any mutant or tracked write.

Kill-set judgment excludes matcher-site poisons. The preliminary mutation
set had four containments; targeted protocol-directory, slash-boundary,
ambiguous-owner and direct-role data controls supplied the missing
discriminators. Across the completed property/data set, none of the 15
target-body kill sets contains another. A one-kill count was not treated
as independence. `phase2-v1/kill-set-preliminary-T-349.json` and
`phase2-v1/kill-set-analysis-T-349.json` preserve both readings.
`phase2-v1/independent-drills-T-349.json` retains every mutant, exit,
failure set and restoration receipt; `phase2-v1/final-restoration-T-349.json`
rechecks all mutated source/spec paths against the candidate. No test
assertion or fixture was weakened in the accepted tree.

**Whole battery and other gates at the candidate.** The guarded run ran
once with the tracked tree unchanged: parser exit 0, 469 bodies; app exit
0, 1171 bodies; Rust exit 0, 662 bodies over 18 targets; whole e2e exit 1,
1313 bodies, 1308 passed and 5 failed. All five browser failures are the
generated interview skill's currency/embedding drift or the corresponding
pack refusal. The raw logs are retained in `phase2-v1/initial-*-raw-T-349.log`;
`phase2-v1/initial-battery-T-349.json` retains every leg's actual verdict.

Parser/app builds, parser/e2e types, token lint and the boot check pass.
Boot exit 0 observed both startup lines, project-folder and window creation,
and stopped its captured process tree. The docs whole-tree half exits 0;
the diff half exits 1 because it FIRES all four reader suites, with no
content finding. CAPABILITIES and INDEX are current. The combined currency
check exits 1 because `method/skills/supertaskr-interview/SKILL.md` is stale
after the method bump: integration must run `npm run skill` from tools/e2e
and commit the generated result. Graph check exits 1 STALE from the new
API/spec symbols: integration must regenerate the committed code graph
and reconcile its derived dogfood pins. Both artifacts are outside this
manifest and were not repaired by this seat. These red readings have not
been converted to green.

**Security and adjacent behavior.** Mandatory input-path and diff review
found no introduced execution, filesystem measurement/write, endpoint,
authorization bypass, dependency addition or secret. A planted eval hit
demonstrated the supplementary source scan before its zero was recorded.
Cargo audit exits 0 with seven allowed informational warnings and no
vulnerability finding. The new domain checks refuse escapes and Git/runtime
controls; writer/landing adapters still consume the legacy model and now
refuse qualified component paths. The architecture's read-only foundations
and deferred split-writer boundary hold. No undeclared follow-through,
pack gap, missing-tier fault or source expansion was found.

This entry changes no frontmatter. Post-verdict gates and owned-job
cessation are recorded separately at the verifier-created tip, so none of
the candidate figures above is represented as a measurement of that later
tree. The approval remains local implementation evidence; push, CI and
landing qualification are the coordinator's separate observations.
