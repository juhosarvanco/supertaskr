---
id: T-249
title: The secret read guard in the fence hook — a seat that reads a key file can leak it into a record, so the fence refuses reads of env files, private keys and keychains, not only writes outside the card
feature: F-06
milestone: 4
size: S
priority: 2
status: done
suggested_by: "@human ruling (2026-09-08, version sitting): \"approve the v1 five\" — GSD Core's secret read guard (T-245); nputer's fence is write-only"
blocked_by: []
touches: [.claude/hooks/lane-fence-hook.mjs, .claude/hooks/lane-fence.mjs, tools/e2e/tests/lane-fence.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by: claude-opus-5@subagent
verified_by: claude-opus-5@subagent
review: independent
---

## Why this card exists

The fence is a property at the write (T-154): a hook refuses a write
outside the card's paths. Reads are free. A seat that reads `.env`, a
`*.pem`, `~/.ssh/*` or a keychain export can carry the value into a
card body, a verdict or a record — and records are append-only. GSD
Core ships a read guard for exactly this (hooks/gsd-secret-read-guard.js).

## Acceptance criteria

- WHEN a seat under a fence attempts to READ a path matching the
  secret set (env files, private keys, ssh and cloud credential
  directories, keychain exports — the set is ONE list in the hook with
  a positive control per entry, derived from the tree's own ignore
  files where it can be) THE hook SHALL refuse the read and name the
  entry that matched.
- WHEN the read is of a file the card's fence explicitly names THE hook
  SHALL still refuse — a fence widens writes, never secrets; the seat
  that needs a secret's SHAPE reads a redacted sample the human
  provides.
- IF the hook cannot classify the path THEN it SHALL allow and log —
  this guard fails open on classification, because a read guard that
  blocks the tree's own sources is a lane killer (the hook's own
  refusal must be inspectable: the log line names the path and the
  reason).
- The lane-fence spec SHALL gain the read arm with a planted positive
  and a planted negative; the drill SHALL show the guard red on a
  planted `.env` read and byte-exact restoration after.
- CONVENTIONS' fence sentence SHALL gain the read clause in the same
  merge (docs gate run).

## Implementation notes
<!-- executor appends before finishing -->

Built at `e641b57` on `task/T-249-secret-read-guard`, cut at
`828621f5`. Three files, +836 lines, no deletions.

THE SHAPE. `decide` asks the read guard FIRST for a read tool and never
reaches the fence, and the POSITION is the property rather than an
optimisation. Three things follow from it that no arm further down could
buy: a card's `touches:` cannot open a secret (no manifest is read on
that path at all — "a fence widens writes, never secrets" is an ABSENCE,
and an absence cannot be forgotten); a read OUTSIDE the fence is ALLOWED
(reads are screened, not fenced — a lane that may not read `docs/`
cannot work); and a pathless read cannot take limit 8's refusal, which
is right for a write and would silently reverse the fail-OPEN rule.

`SECRET_SET` is ONE list, as DATA, seven entries, each carrying a
`sample` the spec drives — so every entry has its own positive control
by construction, and the spec requires each sample to be claimed by its
own entry AND BY NO OTHER, which is what stops an entry becoming
decoration. Entries: `env-file`, `local-override-file`,
`private-key-file`, `ssh-directory`, `cloud-credentials-directory`,
`credential-config-file`, `keychain-export`.

DERIVED FROM THE TREE'S OWN IGNORE FILES — AND THE CARD IS OPTIMISTIC
ABOUT WHAT THAT YIELDS. Measured at `828621f5`: the NINE tracked ignore
files name exactly ONE secret-bearing pattern between them — `*.local`
in `app/.gitignore`. That is `local-override-file` and it is the only
entry with a `derivedFrom`; the other six are the hook's own. The spec
re-derives at its own ref and reds if a new ignore pattern goes
uncovered, so the clause is a live relation rather than a claim.

TWO DELIBERATE OVER-REFUSALS, DECLARED. `.env.example` and its siblings
are refused with every other `.env.*` — the suffix is chosen by whoever
named the file, and the card's own answer for a seat needing a secret's
SHAPE is a redacted sample the human pastes. And `.npmrc` is refused
though a project one is often harmless; this tree has none (measured:
zero tracked files match any entry).

FAILS OPEN, AND SAYS SO. Three unclassifiable shapes, each planted in
the spec: no path in the request, a NUL in the target, a target that
resolves to a filesystem root. Each is ALLOWED with `judged: false`, so
the existing runner LOGS it naming the path and the reason — the runner
needed not one line for any of this. Its two codes are their own frozen
`SECRET_READ_CODES` and deliberately NOT members of `DECLINE_CODES`:
that set is the WRITE fence's four limit-codes, which
`lane-fence.spec.ts` requires `docs/CONVENTIONS.md` to publish entry for
entry, so a fifth member would be a false claim about those limits AND
would red this lane over a page outside its fence.

THE GUARD IS UNARMED AT THE HARNESS. `.claude/settings.json` matches
`Edit|Write|NotebookEdit`; no read event reaches the hook. That file is
outside this card's fence. The hook says so in its own header and a spec
body is the record of which world it is in — it asserts the header
sentence today and asserts a real exit-2 refusal through the process
boundary the moment the matcher names a read tool.

TWO ARTEFACTS THIS LANE COULD NOT LAND, both outside the fence, both
owed by the SAME merge: `docs/CONVENTIONS.md`'s read clause (the card's
fifth criterion; the exact sentence is in the report) and
`docs/CAPABILITIES.md` (nine new spec names — `npm run capabilities`
gives +10/-1, census 652 -> 661, verified green in a detached tree).
`npm run capabilities:check` therefore exits 1 in this lane BY
CONSTRUCTION and is not a defect of the work.

VERIFIED. `tools/e2e` 661/661 green (exit 0, 11.0m); `lane-fence.spec.ts`
71/71 (62 pre-existing + 9 new); typecheck, lint:tokens, lint:docs all
exit 0. POISON DRILL 11-for-11 in a detached worktree at `e641b57`: every
mutant RED, every one of the nine new bodies killed by at least one, no
pre-existing body ever disturbed, both files restored BYTE-EXACT by
sha256 against the commit. The card's named drill is M1 — the `env-file`
entry stops matching a planted `.env` read and seven bodies go red.

## Verdicts

## VERDICT — APPROVED at `e41ebef`, 2026-09-08, blind verifier claude-opus-5@subagent (phase 2)

attack set: sha256:fffebf7dd36857bddc41c33c18b66348730c05f9eede0417b648c08baea916c6 (attack-set-T-249.md)
ground truth: sha256:2f3855f800af251fee74f708f93530b7e8b1df4d889d19c82c4eb0c600ce87c3 (ground-T-249.md)

**FRAME.** Read in this order, on a detached bench at
`/Users/ujju/Projects/nputer-V-T-249` pinned to `e41ebef`: (1) the card
at its BASE ref `828621f5` via `git show`, (2) the sealed phase-1 attack
set, digest verified BEFORE opening it, (3) the dispatcher's ground
truths taken at the base ref, digest verified, (4) the standing set at
the tip — `docs/STATE.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`,
(5) `method/roles/verifier.md` whole, (6) THEN `git diff 828621f..e41ebef`.
I read the card's Implementation notes ONLY to enumerate what is claimed,
and re-derived every claim below myself; I did not read the executor's
report, and the two commit subjects in `git log --oneline` were seen as
tree facts while resolving refs, not read for their arguments.
**Phase 1's no-tool property was kept BY INSTRUCTION, not by the
harness** — this harness cannot deny tools, so that spawn's zero-tool
claim is a discipline it reports of itself and not a guarantee anyone
can check. Phase 2 (this seat) had full tools throughout. Every figure
below is re-derived at `e41ebef` on the bench, not quoted from the card.

### What I ran, with exits read UNPIPED and counts read

| command (from `tools/e2e/`, `NPUTER_E2E_PORT=25249`) | exit | count |
|---|---|---|
| `npx playwright test tests/lane-fence.spec.ts` | 0 | **71 passed** (62 base + 9 new) |
| `npx playwright test --shard=1/3` | 0 | 224 passed (2.6m) |
| `npx playwright test --shard=2/3` | 0 | 220 passed (4.6m) |
| `npx playwright test --shard=3/3` | 0 | 217 passed (2.5m) |
| — full suite total | 0 | **661 passed**, 0 failed, 0 skipped |
| `npm run typecheck` | 0 | — |
| `npm run lint:tokens -- --selftest` | 0 | 65 TOKEN + 4 CONTROL, 90 walk-policy, 9 evidence-floor |
| `npm run lint:tokens` | 0 | TOKEN 175 files, CONTROL 1217 tracked |
| `npm run lint:docs` | 0 | whole-tree half, 0 findings |
| `npm run capabilities:check` | **1** | STALE — 55273 committed vs 56156 fresh |

I sharded the suite because a single run exceeds this harness's 10-minute
foreground ceiling; the three shards are disjoint and sum to 661. The
first pass of the last two rows was measured through a pipe to `tail` and
therefore reported `tail`'s exit — re-run unpiped, which is how the
`capabilities:check` **1** was found. That 1 is **correct and owed**: per
CONVENTIONS' capabilities bullet the census is the INTEGRATOR's to
regenerate at the merge, and a lane that adds bodies leaves it stale by
construction. I regenerated in the working tree to measure the delta —
**+10/-1, census 652 -> 661** — read the nine new sentences, and restored
`docs/CAPABILITIES.md` (`git status --porcelain` empty after).

### The criteria, one at a time

**Criterion 1 — refuse a read matching the secret set, naming the entry.
MET in `decide`, INERT at the harness until the integrator's write.**
`SECRET_SET` is one frozen list of seven entries as DATA. I drove 36
paths through `decide` at my own ref: every must-BLOCK row of the attack
set's A-10 table blocks — `.env`, `.env.local`, `.env.production`,
`config/.env`, `/abs/path/.env`, `./.env`, `id_rsa`, `id_ed25519`,
`server.pem`, `key.p12`, `.ssh/config`, `.ssh/known_hosts`,
`.aws/credentials`, `.config/gcloud/credentials.db`, `login.keychain-db`,
`export.keychain` — each naming its entry. Traversal is classified on the
RESOLVED path, not the raw string: `docs/../.env` blocks. The refusal
names the path, the entry, the entry's reason, the tool, the whole set
and the route.

**Criterion 2 — a fence that NAMES the file still does not open it. MET,
and met structurally.** The read branch is the first thing `decide` does
(`lane-fence.mjs`, immediately after `cwd` resolution and BEFORE
`targetOf`/`noTargetVerdict`), so no manifest is opened on the read path
at all — the property is an absence, not an arm that could be forgotten.
The spec's own body drives the live control: the fixture card really
holds `tools/e2e`, the WRITE of `tools/e2e/.env` is allowed
`inside-the-fence`, and the READ of the same path is refused
`secret-read`. I confirmed the ordering by reading `decide` and by
mutation, below.

**Criterion 3 — fail open on classification, allow and LOG naming path
and reason. MET, and the envelope is narrow.** There is **no try/catch
anywhere in the new code** — the attack set's A-5 (a catch that swallows
every path into a permanent allow) is structurally impossible here.
Classification is pure path arithmetic over a frozen list; the only
unclassifiable shapes are three declared ones — no readable path field, a
NUL in the target, a target resolving to a filesystem root — each planted
in the spec and each returning `judged: false` so the existing runner
logs it. Field-name probe: `file_path`, `path` and `notebook_path` all
block `.env`; `filePath` and `target` fail open as `secret-unclassified`,
which is the same field list limit 8 already declares for writes.

**Criterion 4 — the spec's read arm with a planted positive and a planted
negative, and a drill. MET, with one named defect (below).** +9 bodies,
62 -> 71. The negatives are a LITERAL table (`PLANTED_NEGATIVES`, 11
near-misses: `settings.local.json` does not end in `.local`, `keys.ts`
not in `.key`, `id_ed25519.pub` is not private, `docker/` is not
`.docker/`), and each allow body carries a discriminating half that reds
if the guard allows everything.

**Criterion 5 — CONVENTIONS' read clause. NOT MET INSIDE THIS FENCE; the
proposal is sound and TRUE.** `docs/CONVENTIONS.md` is outside `touches:`
and the lane could not write it. I judged the seat's proposed text as a
proposal: it is accurate against the tree at `e41ebef`, and critically it
does NOT overstate — it says in terms that the guard "IS UNARMED AT THE
HARNESS UNTIL `.claude/settings.json` MATCHES A READ TOOL" and that the
matcher reads `Edit|Write|NotebookEdit` at this tip. The attack set's A-12
failure shape (a flat present-tense claim over an inert guard, becoming
the most durable false statement in the repo) is **avoided**. One gap
worth the integrator's eye: the clause names the unarmed limit and the
two over-refusals but NOT the `Bash`/`Grep` bypass, which lives only in
the hook's own header. A reader of CONVENTIONS alone would not learn it.

### Which criteria land only with the integrator's three writes

- `.claude/settings.json` — the matcher must gain a read tool. **Until it
  does, criterion 1 is true of `decide` and FALSE of the running seat**:
  I confirmed at the tip that the matcher is still
  `Edit|Write|NotebookEdit` and that no `settings.local.json` exists.
  This is disclosed in three durable places, which is what turns it from
  a dead guard into a declared one: the `decide` header, the runner's
  header, and a spec body that reads `settings.json` and asserts the
  disclosure sentence is present while the guard is unarmed — and flips
  to spawning a real exit-2 refusal through the process boundary the
  moment a read tool is named. That last body is the answer to A-1's
  corollary: the inertness IS self-policing at the site the property
  lives, which the attack set doubted was possible here.
- `docs/CONVENTIONS.md` — criterion 5, in the same merge, docs gate run.
- `docs/CAPABILITIES.md` — the regeneration, which clears the
  `capabilities:check` exit 1.

### The drill — re-run by me, mutants re-planted, landings read from `git diff`

Baseline digests before mutating: `lane-fence.mjs`
`fc23cbc809f8b2a51bcfc7b434173dc0215451568430adef8b25707d9d9d778d`,
`lane-fence.spec.ts`
`fa68f0b7fbb9da4176af40d31bc0f5e96f771954771630cd5edb38da116eb114`.
Eleven mutants planted and restored; **both files byte-exact by sha256
after every one**, `git status --porcelain` empty.

| mutant | landing (`git diff --numstat`) | bodies red |
|---|---|---|
| M2 — the read branch moved BELOW limit 8's pathless refusal | 3/3 | **3** |
| M4 — the read branch deleted from `decide` | 0/4 | **8** |
| M5 — `ssh-directory` also claims `.aws` (entries collide) | 1/1 | **1** |
| M3 — spec-side DATA mutant: `config/.env` planted in the negatives | 1/0 | **1** |

M2 is the one I most wanted and it is the strongest result on the card:
moving the guard three lines down — the difference between screening a
read and letting limit 8 refuse a pathless one — kills three bodies. The
guard's POSITION, which the header claims is the property rather than an
optimisation, is genuinely under test. M5 shows the per-entry control can
fail, so it is a control and not decoration (verifier.md 2b: show it
failing before you trust it passing).

### THE ONE DEFECT, NAMED — the per-entry control disappears with its entry

Criterion 1 asks for "a positive control per entry". I ran the per-entry
mortality table the attack set demanded — dropping each entry whole and
running all 71 bodies:

| entry dropped | lines removed | bodies red |
|---|---|---|
| `env-file` | 8 | 6 |
| `local-override-file` | 7 | 1 |
| `private-key-file` | 18 | **0 — SURVIVES** |
| `ssh-directory` | 6 | **0 — SURVIVES** |
| `cloud-credentials-directory` | 7 | **0 — SURVIVES** |
| `credential-config-file` | 14 | **0 — SURVIVES** |
| `keychain-export` | 13 | **0 — SURVIVES** |

**Five of seven entries can be deleted whole and the suite stays
71/71 green** — every non-env secret class: private keys, ssh, cloud
credentials, credential rc files, keychains. The cause is the one
verifier.md 2b names as the defect this method produces most: the
per-entry loop iterates `SECRET_SET` and drives each entry's OWN
`sample`, so one arrangement decides both the subject and its control,
and deleting the entry deletes the control with it. `SECRET_SET.length`
is asserted `toBeGreaterThan(0)`, never pinned to 7. `env-file` and
`local-override-file` survive only because OTHER bodies name `.env`
literally and the derivation body binds `*.local` — i.e. by the literal
planting the other five lack. Note the asymmetry: the executor built a
LITERAL table for the negatives and a derived one for the positives.

The card's implementation notes claim "every entry has its own positive
control by construction, and an entry added without one cannot pass". I
measured that claim: it holds in the ADDITION and CORRUPTION directions
(M5 reds when two entries grow into each other; breaking an entry's rules
reds its own sample) and it does NOT hold in the DELETION direction. The
record should say so.

**Why this is APPROVED and not REJECTED.** Every acceptance criterion is
literally met: a per-entry control exists, runs for every entry, and
demonstrably fails (M5). The guard's BEHAVIOUR is correct on all 36
probed paths, the write fence is unregressed (661/661), and the gap is a
hardening of a control rather than a broken property or a wrong answer.
It is filed as `T-249-s1` with `T-229` named as its class parent, and it
is a one-body fix: a literal path/entry expectation table plus a count
pin. I record it here rather than only on the sibling card because a
reader of this verdict should be able to disagree with my call on the
evidence.

### Security sweep (step 3) — clean

Classification is **path-only**: no route reads the bytes of the file it
is about to refuse, and no hash of any content is taken. The only
`readFileSync` additions in the diff are in the SPEC and read tracked
ignore files and `.claude/settings.json`, never a classified target. No
secret-shaped literal anywhere in the diff (grepped `AKIA`, `BEGIN …
PRIVATE KEY`, `sk-…`, `ghp_`, `password=`, `token=`). No fixture plants a
`.env` on disk — the spec's paths are fixture-rooted or under a
`/Users/somebody/…` stem that exists on no machine. **No `console.log` or
`process.stdout.write` is added**, and I confirmed through the real
process boundary that the refusal is exit 2 with the reason on stderr and
**stdout exactly 0 bytes** — the base header's rule, since a secret path
on stdout is the channel a harness parses for a permission decision. The
fail-open route is exit 0, stdout 0 bytes, stderr carrying
`LANE FENCE (not judged) secret-unclassified` with the path and reason.
An ordinary read is exit 0 and silent. **No dependency was added.**

### The lane-killer question, measured

Criterion 3's fear is a guard that blocks the tree's own sources. I drove
**every one of the 1235 tracked files** through `decide` as a `Read`:
**0 refused, 0 unclassified**. The card's claim of zero tracked matches
holds at my ref.

Two over-refusals are deliberate and declared in both the hook header and
the CONVENTIONS proposal: `.env.example`/`.env.sample`/`.env.template`
block with every other `.env.*`, and `.npmrc` blocks. Phase 1's A-10
table listed `.env.example` and `.env.sample` in its must-ALLOW column.
**That column was mine and it was wrong about this tree's intent** —
phase 1 pre-committed to owning that table, and the lane's argument (a
suffix is chosen by whoever names the file, and a real key in a
`.env.example` is a thing that happens; the card's own remedy is a
redacted sample the human pastes) is better than my prior. Recording it
as my miss, not the lane's.

### Regression and adjacent-feature check (step 4)

All 62 pre-existing `lane-fence.spec.ts` bodies pass, including "in a
lane, a request with no readable path is refused rather than waved
through". The two fail-directions stay separated by tool kind and the
spec asserts the pair in one body: a pathless WRITE in a lane still
blocks, a pathless READ allows. `SECRET_READ_CODES` is deliberately
disjoint from `DECLINE_CODES`, so the existing keeper bodies that require
CONVENTIONS to publish the write fence's four limit codes entry for entry
are untouched — the lane avoided reddening itself over a page outside its
fence. `lane-fence-hook.mjs` gained header text only; no executable line
changed, which I verified from the diff.

One forward hazard, filed as `T-249-s2` rather than held against this
lane: `decide` never branched on `toolName` before this card, so any tool
the matcher routes here that is NOT in `READ_TOOL_NAMES` takes the WRITE
fence. `Grep` and `Glob` both carry a `path` field. If the integrator
arms the guard by adding read tools to the matcher and includes `Grep`,
greps of out-of-fence paths would be refused `outside-the-fence` — a lane
killer arriving through the wiring rather than the guard. The hook's
header already names `Grep` as a routed suggestion; the card makes it
routable.

**APPROVED.** The work is honest about its own inertness in three durable
places and pins that honesty with a body that flips when the wiring
lands, which is the rarest thing on this card: the attack set was built
around the expectation that no spec in this tree could detect a wrong
matcher, and this one can. Its position in `decide` is load-bearing and
proven so by mutation, its fail-open envelope is narrow because there is
no catch to widen, and it reads no bytes of anything it refuses.

### GATES RE-RUN AT THE TIP THIS VERDICT ITSELF CREATED (`5ca35d5`)

`method/roles/verifier.md` step 7 — appending a verdict and filing two
cards are WRITES, and prose is a code input here. The DOCS GATE's diff
half, run from the repo root against `main` at `dc9b124` with the one
spelling CONVENTIONS publishes, **exits 1 and FIRES**: three paths under
`docs/` are code inputs, and it names the suites owed. All were run at
`5ca35d5` and all are green:

| owed suite | exit | count |
|---|---|---|
| `npx vitest run` from `lib/parser/` | 0 | **377 passed**, 16 files |
| `npm test` from `app/` | 0 | **1163 passed**, 51 files |
| `npm test` from `tools/e2e/` (3 disjoint shards) | 0 | **661 passed** (224 + 220 + 217) |

The gate also reports **every live task card's frontmatter parses, with a
legal status** — the two cards this verdict filed included — and
**governing-document budgets hold, 4 gated, 0 awaiting compaction**. The
three dogfood pins `docs/STATE.md` warns a card write can move
(`architecture-dogfood`, `map-dogfood-render`, `select-board`) were run
first and separately: **113 passed, exit 0**.

**A figure with its ref stays true.** Every number in this verdict was
derived at `e41ebef` and the suite counts re-derived at `5ca35d5`; the
census figures (652 -> 661, +10/-1) are measured at `e41ebef` and are
unmoved by this commit, which adds no spec body. One process note worth
leaving for the next seat in this chair: my first reading of
`capabilities:check` and `lint:docs` was taken through a pipe to `tail`,
so `$?` reported `tail`'s exit and both looked like 0. Re-run unpiped,
`capabilities:check` is 1. The Run hygiene line about reading the count
as well as the exit has a twin — read the exit of the thing you ran, not
of what you piped it into.

The docs gate REFUSED my first invocation of it, correctly and usefully:
`$PATHS` unquoted does not word-split in zsh, so the whole path list
arrived as one argument and the gate exited 2 `called wrong` rather than
answering over nothing. Recorded because a 2 there is not a clean gate.
