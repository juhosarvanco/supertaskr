---
id: T-013-s9
title: GIT_ENV_REMOVED is right at twelve and can never be complete — HOME is a thirteenth and is not a GIT_ variable, so the doc comment must stop letting length read as coverage
status: suggested
suggested_by: verifier claude-opus-5 @T-013-verify2
---

**Raised as F8 on T-013's second (APPROVED) verdict and materialized
here by the integrator, crediting the verifier.** It arrived as verdict
body text on the card; a finding a triage can act on has to be a file.

## What was measured, and it is good news first

**Twelve is correct and the third addition is load-bearing.** With a
positive control on git 2.50.1:
`GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.fsmonitor GIT_CONFIG_VALUE_0=…`
**runs the program** on `git status`; the same pair with
`GIT_CONFIG_COUNT` removed does **not**. So gating the whole numbered
`GIT_CONFIG_KEY_n`/`GIT_CONFIG_VALUE_n` family on the one count variable
is a real neutralisation rather than an assumption, and there is no
per-`n` list to maintain.

## The finding

**There is a thirteenth, and it is not a `GIT_*` variable at all.**
`HOME` redirected at a directory holding a hostile `.gitconfig` reaches
exactly the surface `GIT_CONFIG_GLOBAL` does — the control fires on `git
status`. **It cannot be removed from a git child**, so no amount of
extending this list reaches it. `GIT_TRACE=<path>` is a fourteenth of a
different kind: an arbitrary-file append.

Neither is exploitable here, and the reason is the one that actually
carries the property: **neither `PROBE_ARGV` nor `LOG_ARGV` triggers
fsmonitor at all**, with or without the `-c core.fsmonitor=` clear
(re-confirmed on the second pass). The environment list is defence in
depth on top of that, which is exactly the right shape — but a reader
who counts twelve entries and concludes the environment is covered has
drawn the wrong conclusion from a correct list.

## The remedy

**Two sentences in `GIT_ENV_REMOVED`'s doc comment**, saying in as many
words that this list cannot be complete and naming what does carry the
property:

> This list can never be complete — `HOME` reaches the same
> configuration surface and cannot be removed from a git child, and
> `GIT_TRACE` is a file-append of a different kind. What carries the
> property is that these two argvs run no program: neither
> `PROBE_ARGV` nor `LOG_ARGV` triggers `core.fsmonitor` on git 2.50.1,
> with or without the clear. Length is not coverage.

Already closed by the second executor pass and recorded here so the
closure is not mistaken for the whole finding: `-c core.fsmonitor=` now
rides **both** argvs and the pin asserts it over `[PROBE_ARGV,
LOG_ARGV]`, so the asymmetry the first verdict named is gone. Confirmed
at the merge — both argvs carry the pair, and `-C` appears on neither.
