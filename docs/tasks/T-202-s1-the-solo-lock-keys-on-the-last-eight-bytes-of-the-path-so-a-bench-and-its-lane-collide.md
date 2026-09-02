---
id: T-202-s1
title: The gate runner's solo lock keys on the LAST EIGHT BYTES of the checkout path, so a verifier bench and its own lane share one lock for every eight-character card id and the two seats the method runs in parallel are serialised
feature: F-06
milestone: 4
size: S
priority: 2
status: verifying
suggested_by: verifier claude-opus-5@subagent @T-223-s3-verify, phase 1 at 695954f, 2026-09-02; filed by the architect seat
blocked_by: []
touches: [tools/e2e/scripts/gate-run.mjs, tools/e2e/tests/gate-run.spec.ts]
builder: claude-opus-5@subagent
verifier: claude-opus-5@subagent
built_by:
verified_by: claude-opus-5@subagent
review: independent
---

## The finding, measured

`lockPath(root)` in `tools/e2e/scripts/gate-run.mjs` derives the lock key
as `Buffer.from(root).toString("hex").slice(-16)` — the last eight
BYTES of the checkout path. For a card whose id is exactly eight
characters (every `T-NNN-sN`), the lane `…/nputer-T-223-s3` and its bench
`…/nputer-V-T-223-s3` end in the same eight bytes and produce the
identical key (`542d3232332d7333`); for `T-228` they do not. V-T-223-s3
verified both. The consequence: a bench's gate run is refused as
"solo-locked" while its own lane runs a suite, and vice versa — the
executor and the blind verifier, the two seats the method deliberately
runs side by side, are serialised on every eight-character card. Three
seats reported the refusal today (V-T-216-s8, V-T-223-s3, V-T-112-s6's
e2e baseline) and each read it as another checkout's lock, which the
runner's own header says cannot happen.

## What is asked

The key SHALL be a function of the WHOLE path (a digest of it, or the
full hex), so distinct checkouts never share a lock; the per-checkout
solo property is unchanged. A body plants two roots differing only
before their last eight bytes and requires distinct keys; a second body
keeps two runs in ONE root serialised.

## Acceptance criteria

- `lockPath` for `/x/nputer-T-223-s3` and `/x/nputer-V-T-223-s3` differ;
  for the same root twice they are equal.
- The positive control demonstrated failing: the base key function reds
  the distinct-roots body by name.
- Existing gate-run bodies green at the tip; the lock file's location
  and lifetime are unchanged, so no other reader moves.

## TRIAGE, 2026-09-02 — filed `planned`, priority 2, at the seat

Serialising the bench against its lane costs every eight-character card
a full suite length of wall-clock, silently, and misattributes the
refusal. Dispatch at the next free slot; the fence is free of every
live lane.

## Implementation notes, 2026-09-02 — built in lane `task/T-202-s1-solo-lock-whole-path-key`

**The key is a sha256 of the whole root path**, so every byte of it is
read: `createHash("sha256").update(root, "utf8").digest("hex")`. The
collision the card names is reproduced and killed — drill D1 restores
the base key and the body reds naming the shared lock
`nputer-gate-run-542d3232332d7333.lock`, the card's own figure.
Re-measured here: this lane's own checkout
`/Users/ujju/Projects/nputer-T-202-s1` and its bench
`…/nputer-V-T-202-s1` collide under the base key too.

**A DIGEST AND NOT THE PATH'S OWN FULL HEX, which the card also
offered.** The hex form is two bytes of basename per byte of root, so
the basename is `21 + 2 * root.length` and crosses NAME_MAX — 255 here,
`getconf NAME_MAX /` — at a root of **118 bytes**, `ceil((255 - 21) / 2)
+ 1`, where `acquireSolo`'s own `writeFileSync` throws ENAMETOOLONG.
The longest root that reaches `lockPath` in this suite today is **72
bytes** (a `mkdtempSync` root under a 48-byte `tmpdir()`), so the hex
form would not have failed HERE — the hazard is a checkout path an
ordinary home directory two projects deep already reaches, not a
fixture one. The sha256 form is FIXED at 85 bytes of basename for every
root on every machine. Drilled: D6 plants the hex form and the body
reds at 457 bytes against 255.

**The lock file's LOCATION and LIFETIME are unchanged, and the two
bodies now pin them, because nothing at the base did.** Same `tmpdir()`,
same `nputer-gate-run-<key>.lock` name shape, same JSON payload, same
lifetime — written at acquire, removed by the holding pid at release,
reclaimed when the holder pid is gone. **The readers are two and both
are green**: `acquireSolo` in the same file, and this suite's
stale-reclaim body *"a lock left behind by a dead process is reclaimed…"*,
which plants a lock at `lockPath(root)` by hand and reads the pid back
out of it. Nothing outside `tools/e2e/` reads the path at all (sweep
below). At the base a key change could have carried the file out of
`tmpdir()` and every body would still have passed, so the first body now
asserts the directory (drill D4) and the name shape (D5).

**THE CENSUS IS OWED AND IT IS THE INTEGRATOR'S.** Two bodies were
added, so `docs/CAPABILITIES.md`'s `## gate-run` section moves from **39
entries to 41** and `npm run capabilities:check` reds until
`npm run capabilities` is run from `tools/e2e/` in the merge commit.
This lane's fence is `tools/e2e/scripts/gate-run.mjs` and
`tools/e2e/tests/gate-run.spec.ts`; `docs/CAPABILITIES.md` is outside it
and was deliberately not regenerated here.

**THE CLASS AND ITS SWEEP** — a machine-scoped identity keyed on a
SUFFIX of a path, so two distinct paths collide. `git grep -nE
'\.slice\(-[0-9]+\)|\.substr\(-'` over `*.mjs *.ts *.tsx *.js *.rs`
outside `docs/` returns **one instance, the one fixed** — shown capable
of answering otherwise by running it at the base `3676dd7`, where it
returns that instance plus three. The three survivors are triaged NOT
of the class: `tools/e2e/tests/push-guard.spec.ts:2750` feeds its slice
to `mkdtempSync` as a PREFIX, which appends six random characters, so no
two harnesses can collide however their roots end; the two in
`tools/method-evals/evals/mf-01-brief-assembles.mjs` slice an array of
text LINES for diagnostic output and key nothing. A second sweep for
deterministic (non-`mkdtemp`) machine-scoped names under `tmpdir()`
returns this lock and one path in `push-checks.spec.ts` that is
deliberately never created.

**THE DRILLS FOUND ONE THING IN THIS CARD'S OWN WORK.** Every poison
drill that reds the new serialisation body used to leave a lock file in
`tmpdir()`: a failing `expect` throws before a release placed after the
assertions can run, and under the cwd-keyed mutant the spawned probe is
GRANTED a lock and a one-line `node -e` child has no `finally` either.
Three files, in the machine-scoped directory this card is about. Not a
defect in the runner — a stale lock holding a dead pid is reclaimed
rather than wedging the gate, which the body above this one proves — but
litter a card about lock hygiene should not produce. The release now runs
from the `finally`, and the probe gives back anything it was granted; on
the passing path that clause is dead, because a refused acquire writes no
file. Re-drilled after the change: D3 and D8 kill the same two
assertions and **zero** locks are left behind. The key's width is what
makes this checkable — only this fix mints a 64-hex name, so every
64-hex lock on the machine is this lane's and every 16-hex one is
another checkout's.

## VERDICT

**APPROVED** — claude-opus-5@subagent, 2026-09-02, judged at
`18c88e3b9a494749554eb28eb79ac6101506188c` on a detached bench cut from
`3676dd7dc27e3ab720e71f5ce29de66f4d7bf0c2`.

attack set: sha256:8dcc9ca7e7b50a5084c8dd08d15e7ac8952ac60984ab133c5849d449ee8eabd1 (attack-V-T-202-s1.md)
ground truth: sha256:0efa6e921885d26b9d942348c4b4a28159aafc9558941872d7df963a2c800c17 (ground-V-T-202-s1.md)

**THE FRAME I ACTUALLY HAD.** Phase 1 was its own message and named
nothing executor-derived — no algorithm, no body count, no mutant count,
no suite figure, no tip, no branch. It DID hold a shell, because my
dispatcher asked me to take the ground truth myself at the base rather
than request it, so this was the shell-holding phase 1 `roles/verifier.md`
describes at the base ref, not the tool-less spawn `orchestrator.md` 5d
prescribes. Both files were sealed at **2026-09-02T12:32:08Z**, before
the tip existed to me. **PHASE 2'S BRIEF DID CARRY THE EXECUTOR'S
FIGURES** — the key's algorithm, 41 bodies, eight mutants, 372/1141/623,
the census delta — under a heading naming them as the executor's. That
is after the line and costs the pass nothing, but it is why every figure
below was re-derived on this bench with my own scripts, and why the drill
is MY sealed mutant list rather than the lane's. Two naming divergences:
my files are `attack-V-T-202-s1.md` and `ground-V-T-202-s1.md`, not the
`attack-set-<card id>.md` CONVENTIONS prescribes, because my dispatcher
named them; both digests are cited above so the hand comparison resolves.

### Every criterion re-derived, not transcribed

**Criterion 1a — `lockPath` differs for the two roots.** Re-derived over
the family I sealed BEFORE seeing the diff: every
`/Users/ujju/Projects/nputer[-V]-T-<000..999>-s<0..9>` plus the bare
integration root, **20001 roots**. At the base that family produced
**10001 distinct keys and 10000 colliding groups** — every lane/bench
pair. At the tip it produces **20001 distinct keys and 0 colliding
groups**. The card's own pair separates; so do all five live pairs on
this machine (`T-112-s6`, `T-202-s1`, `T-216-s8`, `T-223-s3`,
`T-225-s2`); so does a pair sharing a basename under different parents,
which a basename-only key would have merged.

**Criterion 1b — the same root twice is equal.** Equal in one process,
equal across a `chdir`, equal with the environment rewritten, equal in a
child process spawned in a different working directory, and equal for a
root that does not exist — `lockPath` reads no filesystem, which matters
because criterion 1's own `/x/…` roots are not real and a `realpathSync`
would have thrown rather than compared.

**Criterion 2 — the positive control, DEMONSTRATED and not asserted.** I
restored the base key by hand, read the landing back from `git diff`, and
ran the file: **the distinct-roots body reds by name**, quoting the
shared lock `nputer-gate-run-542d3232332d7333.lock` — the card's own
figure, reached independently. 40 of 41 passed; nothing else moved.
**AND AGAIN END-TO-END, THROUGH `acquireSolo` RATHER THAN `lockPath`**,
over synthetic roots so no live run on this host could confound it: with
a live foreign pid holding the LANE's lock, the BENCH's acquire in a
separate process is `{"ok":true}` at the tip and `{"ok":false, …REFUSING
rather than waiting…}` with the base key restored. One script, one pair
of roots, one machine; the key function is the only thing that differs.

**Criterion 3a — the existing bodies are green.** All 39 pre-existing
bodies pass at the tip, and under every one of my eleven mutants.

**Criterion 3b — the location and lifetime are unchanged, so no other
reader moves.** The lock is still `path.join(tmpdir(),
"nputer-gate-run-<key>.lock")`; `dirname` is `os.tmpdir()` for every root
I tried, including ones with spaces, quotes, `..`, non-ASCII and 400
bytes. `acquireSolo` is untouched byte for byte, and I exercised its
lifetime directly: acquire writes `{pid, suite, at}`, same-pid re-entry
is still allowed, release by the holding pid removes the file, and a lock
left by a dead pid is still reclaimed. **The reader census I took at the
base holds at the tip**: `git grep 'nputer-gate-run'` returns exactly one
line in the tracked tree, and `lockPath` has exactly two code callers —
`acquireSolo` and this suite's stale-reclaim body. Nothing outside
`tools/e2e/` reads the path, so there was no other reader to move.

### The drill — eleven mutants, all killed, landings read from `git diff`

Every mutant is one-sided; each landing was read back from `git diff -U0`
rather than from the mutator, and each restore was proved by `sha256`
against `0dfdc8c8663dc07e65ed5d9f4d6961e4e3316d361322e00459bd02fa4e06a317`.

| mutant | kill set (bodies, by line) |
|---|---|
| the base suffix key restored | `590` |
| `sha256` of the same last eight bytes | `590` |
| `sha256` of `path.basename(root)` | `590` |
| the path's own FULL hex | `590` — at 457 bytes against NAME_MAX 255 |
| a constant key | `590` |
| the file moved out of `tmpdir()` | `590` |
| the `nputer-gate-run-` prefix changed | `590` |
| `process.pid` mixed into the key | `526`, `636` |
| `process.cwd()` mixed into the key | `636` |
| the refusal branch disabled | `526`, `636` |
| `pidAlive` dropped from the refusal | `557` |

**CONTAINMENT, WHICH IS THE GRADE AND NOT THE COUNT.** The two new
bodies' kill sets are DISJOINT — `590` dies to seven mutants that `636`
survives, `636` dies to three that `590` survives — so neither is a
restatement of the other and both are load-bearing. Every kill lands at
the site the property lives: inside the key derivation, or inside the
guard that consumes it.

**AND THE NEW SERIALISATION BODY IS STRICTLY STRONGER THAN THE ONE IT
SITS BESIDE.** `K(526) = {pid-mixed, refusal-disabled}` is a proper
subset of `K(636)`; the cwd-keyed mutant is caught by `636` alone,
because `526`'s probe inherits this process's working directory and a
cwd-keyed lock still refuses there. Under this drill set the PRE-EXISTING
body is the contained one. It is not thereby redundant — it is the only
body asserting the refusal's wording — but the new one is not a
restatement of it in either direction.

**AND THE MUTANTS I AIMED AT THE GAP I FOUND AT THE BASE BOTH DIE.** My
sealed attack set recorded that nothing at the base asserted the lock's
directory or its name shape, so a key change could have carried the file
out of `tmpdir()` and passed the whole suite silently. I predicted those
two mutants would SURVIVE. They do not: the first body pins both, and my
move-the-directory and change-the-prefix mutants each red it. The gap I
went looking for was closed before I got there.

### The card's own claims, checked rather than taken

- **The class sweep.** Re-run at the tip: three `.slice(-N)` survivors,
  and I triaged each myself. `push-guard.spec.ts:2750` feeds its slice to
  `mkdtempSync` as a PREFIX — I read `harnessLink` — so six random bytes
  are appended and no two harnesses can collide however their roots end;
  the two in `mf-01-brief-assembles.mjs` slice arrays of text LINES for
  diagnostics and key nothing. **And the sweep can answer otherwise**: at
  `3676dd7` the same command returns four — those three plus the one this
  card fixed.
- **The width argument.** Measured independently at the base and
  recorded there before I saw the diff: the basename is `21 + 2 *
  len(root)`, `NAME_MAX` is 255, and I wrote real files to find the break
  at **118 bytes of root** (117 gives 255 and succeeds; 118 gives 257 and
  is ENAMETOOLONG). The card derives the same 118 from
  `ceil((255 - 21) / 2) + 1`. **The hazard is nearer than the card says**:
  this machine already carries a **111-byte** worktree root under
  `tmpdir()`, created by this repository's own fixtures — seven bytes of
  margin, not a fixture-only concern. The sha256 form is 85 bytes for
  every root, which I confirmed over a corpus including a 400-byte one.
- **The census.** 41 bodies in the file, 39 entries under `## gate-run`
  in `docs/CAPABILITIES.md`: **stale by two, and it is the integrator's**,
  exactly as the notes say and as CONVENTIONS' `capabilities` bullet
  rules. Not a defect of this lane, whose fence leaves that file
  read-only.
- **The hygiene claim.** Verified by set difference over
  `nputer-gate-run-*.lock` in `tmpdir()`, before against after: a mutant
  that reds ONLY the new serialisation body leaves **zero** files. The
  claim holds.

### Security sweep (step 3, mandatory)

No new input path — `lockPath`'s argument is a root the runner already
controls. `root` is never interpolated into a shell; every spawn is an
argv array. The key is `[0-9a-f]{64}`, so no separator, NUL or `..` can
enter a filename, and the basename cannot outgrow `NAME_MAX` — the
`base64` digest that would have put a `/` in the path was available and
was not taken. **No dependency was added**: `node:crypto` is a built-in,
and no `package.json` or lockfile moves in the diff. No secret, key or
token appears. `tmpdir()` here is `drwx------` and per-user, so the
predictable name is not a cross-user surface, and it was not one before.
One small improvement, unasked for: the old filename LEAKED the last
eight bytes of the checkout path to anything listing `tmpdir()`; a digest
leaks nothing. Nothing here is REJECTED-level.

### The fence, and the adjacent features

Four paths move, all inside the card's `touches:` plus `docs/tasks`,
which the fence hook holds open. `docs/ARCHITECTURE.md`'s interfaces are
untouched — `lockPath`'s signature and return shape are unchanged, and
the change is one expression behind it. `T-203`'s verdict token, the
four-code legend, the registry and `workflow-parity`'s derivation are all
green.

### The gates I ran, at the tip and at my own commit

Run from this bench with the EDITED runner, `npm ci` in `tools/e2e` and
`npm ci` + `npm run build` in `app/` first, on `NPUTER_E2E_PORT=25202`:

    gate-verdict suite=parser exit=0 bodies=372  ref=18c88e3 verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1141 ref=18c88e3 verdict=GREEN
    gate-verdict suite=e2e    exit=1 bodies=623  ref=18c88e3 verdict=RED

`docs-gate.mjs` on both card paths FIRES and names exactly those three
suites — which is why `rust` was not run: no Rust byte moves.

**THE e2e RED IS REF SKEW, AND I DID NOT TAKE THAT ON ANYONE'S WORD.**
Two bodies fail, `session-economics.spec.ts:179` and `:365`, both because
`brief.mjs` REFUSES with exit 1 over seven unsettled things. The first is
`T-225-s12 holds a worktree … and no live card declares that id` — that
lane was cut after my base was stamped, and **no card for that id exists
at `3676dd7` OR at `18c88e3`**; it is machine state that belongs to no
ref, the class `docs/STATE.md` names in its own words. The other six are
`T-205-s8`'s whole-directory fence (`touches: [tools/e2e]` at my base,
untouched by this diff) overlapping `T-202-s1`, `T-216-s8` and `T-239`.
**The control, run where the diff's arming is ABSENT**: I reverted both
card paths to their base state — the T-202-s1 card to `3676dd7`, the
routed `T-202-s2` deleted — and re-ran those two bodies. **Both still
red.** The diff owns none of it. The routed card appears nowhere in the
complaint, being `status: suggested` rather than a lane. 621 of 623
bodies pass, including all 41 in `gate-run.spec.ts`.

**AND AT THE TIP THIS VERDICT ITSELF CREATED**, because appending prose
is a write and prose is a code input here. Measured at
`ad01e80e59d3554a9d465d54469e97463c4fd239` — the commit carrying this
verdict and the finding below, before the amend that added this
paragraph, so the figures are HISTORY bound to a named occasion and
cannot go stale:

    gate-verdict suite=parser exit=0 bodies=372  ref=ad01e80 verdict=GREEN
    gate-verdict suite=app    exit=0 bodies=1141 ref=ad01e80 verdict=GREEN
    gate-verdict suite=e2e    exit=1 bodies=623  ref=ad01e80 verdict=RED

**Identical to the tip in every figure, including which two bodies fail**
— 621 of 623 pass at both refs. `brief.mjs --task T-202-s1` finds the
same SEVEN unsettled things at my commit as at `18c88e3`, and the card
this verdict files appears in none of them, being `status: suggested`
rather than a lane. The 152 bodies in the seven e2e specs that actually
read `docs/tasks` — landing-gate, push-checks, shell-frame,
window-contract, card-preflight, dispatch-order and gate-run — are green
at my commit. `docs-gate.mjs` on this card and the filed one reports zero
frontmatter issues and every live card parsing with a legal status.

### Filed, not blocking (step 6)

`T-202-s3` — the solo-guard body at `gate-run.spec.ts:526` releases its
lock on the last line of the `try`, so a failing `expect` throws first
and the lock is left in `tmpdir()`: the pid-keyed mutant left 2 files,
the refusal-disabled mutant 1, all holding dead pids and all removed by
hand. It is the same hygiene wart this lane found and fixed in the body
it ADDED, still live one body above it. Litter rather than a defect — a
dead holder is reclaimed — and it is not part of this card's ask, so it
is filed and does not touch this verdict.
