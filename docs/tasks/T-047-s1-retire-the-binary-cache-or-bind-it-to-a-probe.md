---
id: T-047-s1
title: The resolved-binary cache now buys almost nothing — retire it, or bind it to a probe signature
status: suggested
suggested_by: executor claude-opus-5 @T-047
---

T-047 validates the cached binary path before anything executes it —
absolute, no `.`/`..` component, file name == `adapter.binary`, executable —
which is "the same rules a fresh probe would apply", as its criterion asked.
**The honest residual it leaves, recorded in the function's own header
(`runner.rs:273`): an absolute, traversal-free path named `claude` pointing
at an attacker's binary still passes.** An attacker who can write
`agent-paths.json` can write `/Users/x/Library/Caches/evil/claude`.

That residual was worth accepting inside T-047 because the alternative is a
design call, not a one-liner. What CHANGED underneath it is the economics,
and that is the actual finding:

- **The cache's stated justification is gone.** `runner.rs:227` says the
  file exists "so the login-shell probe runs once per install rather than
  once per turn". T-047 took the not-cached arm on the PATH, so the login
  shell is now spawned on **every resolve anyway** (`probe_login_path`).
- **The probe already returns the binary path.** `login_shell_probe` runs
  `command -v claude && echo NPUTER_LOGIN_PATH=$PATH` — one spawn, both
  answers. So a resolve that re-probes the PATH has the binary path in hand
  and reads the cache for nothing.
- **The measured cost of not caching is ~7 ms.** `zsh -l -c` measured
  6–8 ms across five runs, against 47–50 ms for the `claude --version` probe
  the same resolve already runs unconditionally.

So the choice is between two shapes, and the second is now nearly free:

1. **Retire the file.** Delete `CacheFile`/`CacheEntry`/`read_cache`/
   `write_cache`/`invalidate_cache` and resolution step (1); `resolve_cli`
   becomes probe-then-typed-not-found. The whole file→exec class T-047 was
   written about stops existing rather than being narrowed. Cost: one login
   shell per turn instead of zero, already paid.
2. **Keep it and bind it.** Store the probe's own answer alongside the path
   (the login PATH's hash, the `--version` line, an mtime+inode) and refuse
   any entry whose binding does not re-derive. Strictly more code than (1)
   for strictly less guarantee.

**(1) unless someone measures the shell spawn as a real cost on a slow
login shell** — a `~/.zshrc` doing nvm/rbenv/conda init can be hundreds of
milliseconds, and that is the one input this suggestion does not have.
Worth measuring on a heavy shell before deciding; if it IS heavy, the right
answer is probably a PROCESS-LIFETIME memo of the probe result (never a
file), which keeps both the cheapness and the no-file-to-poison property.

Blast radius: `runner.rs` only. T-047's `validate_cached_binary` and its
pins would be deleted with the code they guard; `the_resolution_cache_stores
_a_path_and_never_a_login_path` and the poisoned-cache integration tests
would be rewritten as "there is no cache to poison", which is a stronger
assertion than either.
