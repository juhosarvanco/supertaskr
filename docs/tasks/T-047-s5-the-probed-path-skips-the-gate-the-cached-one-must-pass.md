---
id: T-047-s5
title: The freshly-probed binary path skips the gate the cached one must pass — and `which_on_path` can hand back a relative path
status: suggested
suggested_by: verifier claude-opus-5 @T-047
---

T-047 gates the CACHED binary path on absolute + no `.`/`..` + name ==
`adapter.binary` + executable. The FRESHLY-PROBED path is deliberately
exempt, and the exemption is recorded in the task's own silences: *"it came
from the user's own login shell in this process, this second — the same
trust level as `~/.zshrc`."*

**That justification is true of one of the two probe arms and false of the
other.** `login_shell_probe` (`runner.rs:498`) falls back to
`which_on_path` (`runner.rs:544`) whenever the login shell exits non-zero
or prints no usable line — a broken `~/.zprofile`, a `claude` that is not
on the login PATH, a shell that is not a shell. `which_on_path` reads
`std::env::var("PATH")` — the APP's inherited environment, not the login
shell — and hands each entry to `which_in`, which does
`dir.join(binary)`. **A relative PATH entry therefore produces a relative
binary path, which is executed.** Real PATHs carry them: `.`, an empty
element (which means CWD on unix), `relbin`.

Reproduced by the T-047 verifier with its own tattler (no real CLI
involved), driving `resolve_cli` through the same `which_in` the
production arm calls:

    [ATK-rel] resolve_cli -> Ok(ResolvedCli { path: "relbin/claude", version: Some("9.9.9 (Verifier Tattler)"), … })
    [ATK-rel] TATTLE EXISTS (a relative path was EXECUTED): true
    [ATK-rel] would the CACHE gate have accepted it? Err(NotAbsolute)
    [ATK-rel] was it written to the cache? None

So the two gates **disagree, in the direction of executing what the other
refuses**: `validate_cached_binary` calls `relbin/claude` `NotAbsolute` and
discards it, and the probe arm runs it. T-047's own write-side gate then
correctly declines to cache it — which is the tell: the code already knows
that value is not one it would trust from a file, and runs it anyway.

The precondition is a hostile `PATH` in the app's own environment, which is
the same equivalent-privilege surface T-047-s4 records for `$SHELL` — not a
boundary crossing. **The reason to file it is that it is the one channel
s4 does not name** (s4 is about which SHELL is executed; this is about
which `claude` is), and that the recorded justification for the exemption
does not cover it.

Options:

1. **Apply `validate_cached_binary` to the probe result too**, and treat a
   failure as "this probe found nothing" (fall through to the next arm,
   then to typed `cliNotFound`). The rule is already written and already
   named in the criterion's language — "what a fresh probe could have
   produced" becomes a rule the fresh probe also has to satisfy, which is
   the only reading under which the phrase is not circular. Smallest fix,
   and it makes the write-side gate redundant rather than load-bearing.
2. **Filter `which_in` to absolute directory entries only.** Narrower: it
   closes the relative-path case without changing the trust story.
3. **Nothing, and correct the silence** so it says the probe arm is trusted
   because it is the user's own environment, not because it is the user's
   own login shell.

(1). Blast radius: `runner.rs` only, ~5 lines, plus one pin. Folds
naturally into T-047-s1 if the resolver is being reshaped anyway.
