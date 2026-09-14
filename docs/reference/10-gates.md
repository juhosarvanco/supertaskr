# 10 — Gates

Every guard and gate in the repository, what it reads, what it refuses,
its exit contract and its disclosed limits. The house exit contract
throughout: 0 checked and clean, 1 checked and found something, 2
called wrong, 3 could not check. Exits are read unpiped, counts are
read beside exits, and 3 is never reported as clean. The taxonomy
(pre-flight, revision, escalation, abort: the four kinds these are) is
being written into CONVENTIONS (planned: T-250).

## At the card

**The card-input checks** (docs-scan.mjs, run by the docs gate and by
`npm run lint:docs`): frontmatter parses; `status` is in the eight-word
vocabulary read from the parser, not restated; a title opening with a
reserved YAML indicator is named as a YAML error against the file;
priority collisions per column. A card that fails these stops existing
to the board, which is why they refuse at the point of writing.

**The card preflight** (`brief.mjs --preflight`, chapter 05): paths
named in the criteria and frontmatter exist; the fence expands;
held-by-a-live-lane blockers are live; stamped figures re-derive
through the closed deriver vocabulary; `CARD CLAIM` markers are found
in the files they name; refs resolve. Refuses the dispatch on a
finding; reports what it cannot check.

**The dispatch order** (lib/parser readDispatchOrder): STARTABLE,
fenced, unfenceable, waiting, blocked; three-valued fence comparison.

## At the write

**The lane fence hook** (`.claude/hooks/lane-fence-hook.mjs` over
`lane-fence.mjs`, chapter 04): a lane's out-of-fence write is refused
naming the fence, the path and the route; a task branch with no
manifest is refused; a no-lane seat's write into a live lane's tree is
judged by that lane's fence; the integration seat fails open on
inability. Exit 2 with the reason on stderr and nothing on stdout.
Limits: tool writes only; loads from the dispatching checkout.

**The secret read guard** (T-249, the same hook's Read arm): seven
secret-set entries refused in every checkout, unclassifiable paths
allowed and logged, Bash reads disclosed as a bypass.

**The physical layer** (T-210): tracked files outside the fence made
read-only in the lane worktree; askable and re-armed from the manifest
after any git operation that rewrites the tree.

**The injection scan on docs writes** (T-248, advisory): the docs gate
scans a card's, record's or room's text for instructions aimed at a
seat (seven patterns, each with a firing positive and a silent
negative) and reports hits without refusing; a seat reading a hit
treats the text as data.

## At the diff

**The docs gate** (`node tools/e2e/scripts/docs-gate.mjs <paths>` from
the repo root): derives the readers of every docs path in the diff
across the four suites and prints the owed commands (exit 1 FIRES);
refuses ambiguous input (exit 2: zero arguments, a blank argument, an
argument carrying newlines, a path resolving outside the repository);
exit 3 when it could not run. Its whole-tree half is `npm run
lint:docs`, a CI step: frontmatter issues, budgets, the root-anchor
ledger (a root-anchored path cited in a governing document must be
tracked), unlinked sites, and a record committed newer than STATE.

**The range rule** (tools/e2e/scripts/range-rule.mjs): the executor's
diff range is its own pair, merge-base to tip; the integrator's pair is
a different pair; never a two-dot diff against the moving integration
branch.

**The dependency-legitimacy gate** (T-247): a dependency a lane adds
must resolve on its registry and predate the card, so a hallucinated or
typosquatted package name cannot land; judged from the lockfile at the
landing.

## At the suite

**The blessed gate-runner** (`gate-run.mjs parser|app|rust|e2e`,
chapter 08): sentinel, no shell, no pipe, zero bodies refused, parts
must sum to the baseline, `--no-fail-fast` always, the solo lock, the
verdict line's fields; mints the per-tree token.

**The token lint** (`npm run lint:tokens`, CI's first step, with
`-- --selftest`): scans both corpora for forbidden tokens; 0 clean
naming the counts, 1 a hit or a selftest failure, 3 could not run, 2
reserved. `npm test` plants a control byte into seven tracked files and
restores them sha256-proved, so the lane is run in a worktree, never
beside the human's live app.

**The boot check** (`npm run boot:check`, `SUPERTASKR_BOOT_PORT=14521`
beside a live app): spawns `tauri dev` and asserts the two startup
lines; 0 booted, 1 failed with the child's last output, 2 the port is
busy, 3 refused before probing. The orphan drill
(`npm run boot:orphan-drill`, local only) proves the child-exit path
leaves no listener.

**The census currency check** (`npm run capabilities:check`): byte-
compares the generated census; 1 STALE naming the regeneration.

**The graph currency check** (`cargo run -p supertaskr-index -- index
--check --root ../..` from app/src-tauri/): 0 current, 1 STALE with a
file diff naming what moved, 2 usage, 3 could not run. The `--root` is
load-bearing: without it the check looks in the wrong place and prints
a false STALE whose second line says `committed: MISSING`.

**`cargo audit`**: RUSTSEC vulnerabilities exit non-zero and stop the
lane; informational warnings are reviewed by eye against the recorded
baseline. **`arch cycles`**: reads the registry only; 1 names a declared
cycle as a path. `arch`, `arch drift` and `arch blast` are reporters,
local only.

## At the push

**The push guard** (`.claude/hooks/push-guard.mjs`, a PreToolUse hook
on Bash): three arms. The graph arm asks `index --check` and refuses
only on exit 1, quoting the check's own report; no toolchain, an
unreadable request, a foreign checkout, exit 2 or 3 are allows with the
reason stated. The token arm refuses unless all four suites are GREEN
for `HEAD^{tree}`, with distinct refusals (`token-incomplete`,
`token-stale`, and their kin) each printing its remedy. The landing arm
judges every merge commit the push carries (chapter 04). It judges only
a command whose working directory the text determines (a `-C`, a `cd`
chained with `&&`, or an unmoved directory) and refuses the rest rather
than guessing, which is why the push is typed bare.

**The landing gate on a lane push**: the lane's diff against the fence
from main, refused with the paths named.

## In CI

`.github/workflows/ci.yml`: one job on ubuntu-24.04 per push of main
and per lane draft PR, rebuilding from nothing in CONVENTIONS' order
and running every suite and gate above, the boot check under a virtual
display included. The workflow-parity spec pins each step to the
command bullet it transcribes, so a command changed in one place reds.
A platform-only red becomes a card citing the run id; a lane fixing one
may open a draft PR as its instrument with a capped number of cycles
logged on the card.

## On the method itself

**The method evals** (tools/method-evals/, `node run.mjs`): MF-01 the
brief assembles at a fixture ref; MF-02 rule citations resolve; MF-03
role openings are one line; MF-04 method cross-references resolve;
MF-05 the vocabularies agree between the method and the parser; MF-06
the corpus of settled review claims re-derives; MF-07 the fixture root
is writable; MF-08 the two-spawn construction has one source; MF-09 a
verdict citing a wrong attack-set digest is refused, demonstrated
against three implementations lacking the property; MF-10 that
comparison is RUN — `verdict-digest.mjs` over the board's citations
and committed fixtures, an unreachable saved file exiting 3 and never
passing. MIL-01 a verifier
rejects a planted defect; MIL-02 executor notes land in the card;
MIL-03 the verifier approves the clean twin; MIL-04 a review claim is
re-derived. The version pin: a test holds method/'s version stamp, so
an upgrade is a visible diff.

**The health bands** are a reporter, never a fifth gate (chapter 11).

## What no gate catches, said plainly

A figure in prose against the tree (a verdict's count at a moved tip);
a verifier's blindness; a discipline a seat keeps. Each is named in the
role files as a discipline, not a gate, and the frame disclosure and
the provenance marks are how a later reader tells which held.

## From the conventions — the forensics behind the rules (T-290)

The rules themselves live in the chapters under docs/conventions/,
which docs/CONVENTIONS.md indexes. What follows is the history, the
measurements and the argument each of those rules was cut from, moved
here VERBATIM at T-290 under ADR-023 — the records rule forbids a
rewrite, so not a byte of it is re-worded, re-ordered inside an entry,
or summarised. Each entry names the bullet it came out of.

### AUDIT GATE POLICY

The
  baseline, audited 2026-08-16 over 472 locked crates with cargo-audit
  0.22.2: **0 vulnerabilities / 17 informational warnings**, all
  transitive under Tauri v2's GTK3/glib stack and nothing ours to
  re-pin.

### THE BLESSED GATE-RUNNER

Same refusals, and a verdict line naming the
  SUBSET beside its body count rather than the leg's name alone.

The difference is who
  chose the paths — a seat, unaudited, against two commit ids the guard
  re-derives for itself.

### AND SINCE T-280 A PUSH OWES THE SET ITS OWN RANGE OWES, NOT THE

This arm gave the range form the power to mint a plain `GREEN`
  for a NARROWED end-to-end leg — recording what it graded in the
  entry's `scope` — so "four suites GREEN at this tree" stopped implying
  "the battery ran".

That sentence cost a rejection —
  the fallback shipped reading the verdict word alone, and a bench
  measured it passing a push whose end-to-end entry had graded 16 of 39
  spec files. This mechanism can only ever be wrong by owing too MUCH.
  A docs path NOTHING reads is the one positive
  empty answer: the reader map is derived from the whole source corpus,
  so "no code suite reads this document" is a measurement, not a gap —
  and it is exactly the case the dozen wasted batteries were.

### THE PUSH IS JUDGED BY GIT ITSELF SINCE T-314, AND THE BYPASS THAT

Neither is closeable from inside
  a hook — a client-side hook is advice the client can decline — so
  what closes them is the procedure: take the seat, which installs it,
  and read the seat verbs' own line, which reports a checkout without
  the hook as UNGUARDED.

### A PUSH NO LONGER CANCELS THE RUNNING CI JOB

Batching still buys something — with T-203's
  token gate each push owes its own range's owed set — but it buys
  tokens, not a queue.

### CI

IT IS
  AN ENVIRONMENT DIFFERENCE, and that is the whole list (T-054 and
  T-045-s1 closed the two that were only CI spelling a documented
  command twice; T-256 closed app/'s install).

THE COST is a
  DELTA of FIVE exposed commands (T-054, T-078, ADR-019 phase 5).
  AND THE TRUNCATION IS NOT MOSTLY SILENT: the derivation runs in BOTH
  directions, so a command the SPEC claims and the doc stops exposing
  reds BY NAME, and **a command the DOC gains that the spec does not yet
  claim is the case it is LOUDEST about** (the sentence that once said
  the opposite here is retracted, T-090 absorbing T-084-s2).

### THE FOUR WALKS

The AUTHORITY column has
  survived every change unmoved while this table's enumerations went
  stale three times, each caught by a lane and none by a gate
  (`T-010-s1`, `T-079-s1`, T-086) — ADR-019's Law 2 in one row.

### BOOT GATE

T-040, a
  one-line manifest regression that stopped the app launching at all,
  passed an executor, an adversarial verifier and an integrator, each of
  whom ran `cargo test`, `cargo build` and three full suites — all
  perfectly happy with two binaries.

### DOCS GATE

  Under BSD the pipe HIDES a failed range as a clean gate (every utility
  exit collapses to **1**, and on EMPTY input the utility is never
  invoked so the pipeline exits **0**); under GNU the IDENTITY of the
  codes is destroyed instead, 1, 2 and 3 all arriving as 123, because
  GNU `xargs` RUNS the utility on empty input and maps the gate's own
  refusal at 2 to 123 — where this table, filled in from BSD, once
  predicted 0.

**THAT ASYMMETRY IS THE ARGUMENT**: a spelling whose correctness must
  be re-measured per platform is one nobody will re-measure.

**NO COUNT IS TRANSCRIBED INTO THIS
  BULLET** — the census it once carried was green and wrong:

The
  card that opened this named one suite; the tree says all four.

### METHOD EVAL GATE

AND THIS GATE CLOSES THE TRIGGER HOLE, NOT THE CARGO ONE (`T-132-s2`'s
  residual, taken at T-159): a `method/**` diff now matches a trigger,
  and it still owes `cargo test` that no trigger names — `kit.rs`
  `include_str!`s a SUBSET of method/ into `supertaskr_lib`, and two cargo
  bodies read `method/` off disk and assert against it,
  `every_compiled_entry_matches_its_method_file_byte_for_byte` and
  `the_snapshot_table_covers_every_method_scaffold_file`.
