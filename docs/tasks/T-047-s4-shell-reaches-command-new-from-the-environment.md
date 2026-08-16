---
id: T-047-s4
title: $SHELL reaches Command::new from the app's own environment, gated on shape but not on name
status: suggested
suggested_by: executor claude-opus-5 @T-047
---

Found while sweeping the component for the class T-047 closes: the same
"unvalidated string → `Command::new`" shape exists one source removed —
the app's own ENVIRONMENT rather than a file on disk.

`login_shell_probe` (`runner.rs:438`) and `probe_login_path`
(`runner.rs:493`) both do:

    let shell = std::env::var("SHELL")
        .ok().map(PathBuf::from)
        .filter(|p| p.is_absolute() && is_executable_file(p))
        .unwrap_or_else(|| PathBuf::from("/bin/zsh"));
    Command::new(&shell).arg("-l").arg("-c").arg(script)

So `SHELL` decides which program is executed with `-l -c <script>`. It is
gated — absolute, executable, `/bin/zsh` fallback — which is meaningfully
better than the cached binary path was before T-047, and the script it
carries is a compile-time constant with no interpolation. What it is NOT
gated on is **what the program is**: any absolute executable named anything
will do, and `-l -c` is a spelling most shells honor but plenty of other
binaries would simply ignore while still being run.

**Why this is a note and not an emergency, said plainly.** The precondition
is control of the app's own environment, which in a GUI launch comes from
the user's directory-services login record and in dev from the terminal that
started it. Anything holding that also holds `~/.zshrc`, which is what the
login shell is about to execute anyway — so it is the same
equivalent-privilege persistence surface T-039's verifier named for
`agent-paths.json`, not a boundary crossing. **The reason to file it is
composition, exactly as with s1**: `RunnerConfig`'s doc comment says
"production reads NOTHING from the environment" and a test pins that
(`default_config_reads_nothing_from_the_environment`) — which is true of the
CONFIG and false of the resolver two functions away. A reader of that pin
would not guess `SHELL` picks the program.

Options:

1. **Name-check it** against the shells whose `-l -c` semantics we actually
   rely on (`zsh`, `bash`, `sh`, `fish` — noting fish's `-l -c` differs) and
   fall back to `/bin/zsh` otherwise. Small, and makes the gate match the
   assumption the script already encodes.
2. **Skip `SHELL` entirely** and always use `/bin/zsh` (macOS) / `$0` from
   `getpwuid` — the OS's own record of the user's shell rather than an
   inherited variable. Removes the environment as an input.
3. **Leave it and correct the comment**, so the "reads nothing from the
   environment" claim is scoped to `RunnerConfig` where it is true.

(1) or (2) plus (3). Fold into T-043 (kill path / runner hygiene) or into
T-047-s1's work if the resolver is being reshaped anyway — both touch the
same forty lines.
