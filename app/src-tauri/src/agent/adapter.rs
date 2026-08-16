//! T-025 §2: the adapter table — one declarative v1 entry, every flag
//! justified, the bypass ban executable.
//!
//! ADR-003's promise ("new agent support = one adapter entry") made
//! concrete: this table is the ONLY place in the runner that names
//! "claude". It is `const` data inside the binary, unreachable from the
//! webview — no command returns it, no command selects from it, and
//! nothing reads an environment variable to pick or override an entry.
//!
//! Verified against the installed CLI at build time of this task
//! (`claude 2.1.226`, `--help` recorded — no model was called): every
//! flag below exists as documented.

use std::path::Path;

/// How the runner reads a spawned CLI's stdout (§1's topology fixes one
/// mode for v1; a second adapter entry brings its own).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ParseMode {
    /// Newline-delimited JSON objects: a `system`/`init` line first, then
    /// `stream_event` deltas and `assistant` messages, then one `result`
    /// line carrying the turn's canonical text.
    StreamJsonV1,
}

/// One agent CLI, declaratively. Adding an agent is adding one of these
/// to [`ADAPTERS`] — nothing else in the runner changes (ADR-003).
#[derive(Clone, Copy, Debug)]
pub struct AgentAdapter {
    /// Registry key (`sessions.json`'s `agent` field).
    pub key: &'static str,
    /// Binary NAME, resolved on PATH by the login-shell probe (§6). Never
    /// an absolute path baked in: the user's install location is theirs.
    pub binary: &'static str,
    /// Below this major version the runner refuses with a typed
    /// `unsupportedVersion` rather than guessing at flag semantics.
    pub min_major: u32,
    /// argv after the binary for turn 1 (the spawn).
    pub spawn_args: &'static [&'static str],
    /// argv after the binary for turns N≥2 (the resume). Exactly one
    /// element is the [`SESSION_ID_SLOT`], substituted as ONE argv
    /// element — never string-interpolated into a command line.
    pub resume_args: &'static [&'static str],
    pub parse: ParseMode,
}

/// The one substituted slot in [`AgentAdapter::resume_args`].
pub const SESSION_ID_SLOT: &str = "{session_id}";

/// v1's single entry. Flag-by-flag justification (the verifier sweeps
/// these with grant-level suspicion — every one is load-bearing):
///
/// - `-p` — non-interactive print mode. Without it the CLI wants a TTY.
/// - `--output-format stream-json` — the machine-readable stream the
///   runner parses; print-mode only.
/// - `--include-partial-messages` — `content_block_delta` events, so the
///   pane shows text as it is generated (§4's 250 ms bound). Requires
///   print + stream-json, which we pass.
/// - `--verbose` — stream-json in print mode has historically required
///   it; harmless when it does not (the CLI's own extra lines are
///   non-JSON and land in the diagnostic ring, tolerated by §6).
/// - `--permission-mode acceptEdits` — auto-accepts file writes INSIDE
///   THE CWD, which is the project directory. That cwd scoping IS the
///   project-dir scoping criterion 2 demands; there is no `--add-dir`
///   anywhere, so no directory grant beyond the project exists. The
///   materialized kit lives inside the project (`.nputer/genesis/kit/`,
///   §3), so reading it needs no extra grant either.
/// - `--allowedTools` with exactly six Bash patterns — the kit's
///   imperative surface as the T-023 verdict recorded it: `git init`,
///   `git add`, `git commit`, `git status` (stage 0's repo work),
///   `mkdir` (the empty docs/ subdirectories), `cp` (docs-templates and
///   the adapter files copied verbatim). Nothing wider: no `Bash(*)`, no
///   `rm`, no `git push`, no network verbs.
/// - `--disallowedTools WebFetch WebSearch` — free ADR-010 narrowing; a
///   genesis interview has zero web business, and denying loudly beats
///   discovering it later.
///
/// Deliberately NOT passed, each with its reason:
/// - `--model` — the user's CLI default IS the model (ADR-003); the init
///   line reports what ran and the registry records it.
/// - `--bare` — forces API-key-only auth, never reading OAuth/keychain:
///   the exact opposite of our auth posture.
/// - `--settings` / `--setting-sources` / `--strict-mcp-config` — the
///   user's CLI configuration is the user's; we ride it.
/// - `--no-session-persistence` — resume is the whole topology.
/// - `--max-budget-usd` — silently capping the user's own session is not
///   ours to impose (named growth candidate, §10).
/// - `--session-id` — we CAPTURE the CLI's own id from the stream rather
///   than minting one (§1's rejected option).
/// - and never, in any form, a bypass-permissions flag — pinned by
///   [`tests::no_adapter_argv_can_ever_bypass_permissions`].
pub const CLAUDE_V1: AgentAdapter = AgentAdapter {
    key: "claude",
    binary: "claude",
    min_major: 2,
    spawn_args: &[
        "-p",
        "--output-format",
        "stream-json",
        "--include-partial-messages",
        "--verbose",
        "--permission-mode",
        "acceptEdits",
        "--allowedTools",
        "Bash(git init:*)",
        "Bash(git add:*)",
        "Bash(git commit:*)",
        "Bash(git status:*)",
        "Bash(mkdir:*)",
        "Bash(cp:*)",
        "--disallowedTools",
        "WebFetch",
        "WebSearch",
    ],
    resume_args: &[
        "-p",
        "--output-format",
        "stream-json",
        "--include-partial-messages",
        "--verbose",
        "--permission-mode",
        "acceptEdits",
        "--allowedTools",
        "Bash(git init:*)",
        "Bash(git add:*)",
        "Bash(git commit:*)",
        "Bash(git status:*)",
        "Bash(mkdir:*)",
        "Bash(cp:*)",
        "--disallowedTools",
        "WebFetch",
        "WebSearch",
        "--resume",
        SESSION_ID_SLOT,
    ],
    parse: ParseMode::StreamJsonV1,
};

/// Every adapter this build knows. Exactly one entry in v1 (ADR-017
/// clause 6); the bypass pin below iterates this slice, so a second entry
/// inherits the ban automatically.
pub const ADAPTERS: &[&AgentAdapter] = &[&CLAUDE_V1];

/// The adapter the planner role runs under. v1 hard-codes the single
/// entry — reading a role→agent map out of `.nputer/nputer.yaml` is named
/// growth (§9), not this task.
pub fn planner_adapter() -> &'static AgentAdapter {
    &CLAUDE_V1
}

impl AgentAdapter {
    /// The argv AFTER the binary for one turn. `resume` = `None` spawns a
    /// fresh session; `Some(id)` resumes, with the id substituted as ONE
    /// argv element (never interpolated into a string).
    pub fn argv(&self, resume: Option<&str>) -> Vec<String> {
        match resume {
            None => self.spawn_args.iter().map(|s| (*s).to_string()).collect(),
            Some(id) => self
                .resume_args
                .iter()
                .map(|s| {
                    if *s == SESSION_ID_SLOT {
                        id.to_string()
                    } else {
                        (*s).to_string()
                    }
                })
                .collect(),
        }
    }

    /// argv for the one-shot version probe (§6).
    pub fn version_argv(&self) -> Vec<String> {
        vec!["--version".to_string()]
    }
}

/// Pull the leading major version out of a `--version` line such as
/// `2.1.226 (Claude Code)`. `None` when nothing numeric leads it — the
/// caller treats that as "cannot tell" and proceeds rather than blocking
/// on a cosmetic banner change.
pub fn parse_major(version_line: &str) -> Option<u32> {
    let trimmed = version_line.trim();
    let digits: String = trimmed.chars().take_while(|c| c.is_ascii_digit()).collect();
    if digits.is_empty() {
        return None;
    }
    digits.parse().ok()
}

/// Is `path` an executable regular file (or a symlink to one)? Used by
/// the cached-path check in §6's resolution order.
pub fn is_executable_file(path: &Path) -> bool {
    let Ok(meta) = std::fs::metadata(path) else {
        return false;
    };
    if !meta.is_file() {
        return false;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        meta.permissions().mode() & 0o111 != 0
    }
    #[cfg(not(unix))]
    {
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Every argv string any adapter can ever produce, spawn and resume.
    fn all_argv_strings() -> Vec<String> {
        let mut out = Vec::new();
        for adapter in ADAPTERS {
            out.push(adapter.binary.to_string());
            out.extend(adapter.argv(None));
            out.extend(adapter.argv(Some("00000000-0000-0000-0000-000000000000")));
            out.extend(adapter.version_argv());
        }
        out
    }

    /// THE BYPASS PIN (§2). The standing rule "never a bypass-permissions
    /// flag" stops depending on verifier memory: it is red the moment any
    /// adapter entry — this one or a future one — carries either CLI
    /// spelling or the permission-mode string itself.
    ///
    /// Drill (run at build time, output quoted in the implementation
    /// notes): planting `--dangerously-skip-permissions` in
    /// `CLAUDE_V1::spawn_args` turns this test red; reverting restores it.
    #[test]
    fn no_adapter_argv_can_ever_bypass_permissions() {
        const FORBIDDEN: &[&str] = &[
            "--dangerously-skip-permissions",
            "--allow-dangerously-skip-permissions",
            "bypassPermissions",
        ];
        for arg in all_argv_strings() {
            let lowered = arg.to_ascii_lowercase();
            for needle in FORBIDDEN {
                assert!(
                    !lowered.contains(&needle.to_ascii_lowercase()),
                    "ADAPTER BYPASS BAN VIOLATED (T-025 §2): the argv element {arg:?} \
                     contains {needle:?}. The runner may never ask a spawned CLI to skip \
                     its own permission checks - the CLI's cwd-scoped permission model IS \
                     the containment (criterion 2). Remove the flag; do not silence this test."
                );
            }
        }
    }

    /// The permission mode we DO pass is the scoped one, named exactly
    /// once, and it is an argv element of its own (not glued to the flag).
    #[test]
    fn permission_mode_is_accept_edits_and_scoped_to_cwd() {
        let argv = CLAUDE_V1.argv(None);
        let idx = argv
            .iter()
            .position(|a| a == "--permission-mode")
            .expect("the adapter passes an explicit permission mode");
        assert_eq!(argv[idx + 1], "acceptEdits");
        assert_eq!(
            argv.iter().filter(|a| *a == "--permission-mode").count(),
            1,
            "one permission mode, once"
        );
        // No directory grant beyond the project's own cwd exists.
        assert!(
            !argv.iter().any(|a| a == "--add-dir" || a.starts_with("--add-dir=")),
            "--add-dir would grant the CLI a directory outside the project - §3 keeps the kit inside it instead"
        );
    }

    /// The allowlist is exactly the kit's imperative surface — six Bash
    /// patterns, no wildcards wider than a verb, and web tools denied.
    #[test]
    fn allowed_tools_are_exactly_the_kits_imperative_surface() {
        let argv = CLAUDE_V1.argv(None);
        let start = argv.iter().position(|a| a == "--allowedTools").expect("allowlist present");
        let end = argv.iter().position(|a| a == "--disallowedTools").expect("denylist present");
        let allowed: Vec<&str> = argv[start + 1..end].iter().map(String::as_str).collect();
        assert_eq!(
            allowed,
            vec![
                "Bash(git init:*)",
                "Bash(git add:*)",
                "Bash(git commit:*)",
                "Bash(git status:*)",
                "Bash(mkdir:*)",
                "Bash(cp:*)",
            ],
            "the allowlist is the T-023 kit's imperative surface; widening it is a security change"
        );
        // No unbounded Bash grant can hide in there.
        for pattern in &allowed {
            // Every pattern is a SCOPED Bash grant: a named command (with
            // its subcommand where git has one) and a `:` prefix match —
            // never a bare tool grant that would allow arbitrary shell.
            assert!(
                pattern.starts_with("Bash(") && pattern.ends_with(":*)"),
                "every Bash pattern is prefix-scoped to one named command: {pattern}"
            );
            assert_ne!(*pattern, "Bash(*)", "an unbounded Bash grant is never acceptable");
            assert_ne!(*pattern, "Bash", "a bare Bash grant is never acceptable");
        }
        let denied: Vec<&str> = argv[end + 1..].iter().map(String::as_str).collect();
        assert_eq!(denied, vec!["WebFetch", "WebSearch"]);
    }

    /// The resume template substitutes the id as ONE argv element, and the
    /// spawn template carries no `--resume` at all.
    #[test]
    fn resume_substitutes_one_argv_element_and_spawn_carries_none() {
        let spawn = CLAUDE_V1.argv(None);
        assert!(!spawn.iter().any(|a| a == "--resume"));
        assert!(!spawn.iter().any(|a| a.contains(SESSION_ID_SLOT)));

        let id = "1f2e3d4c-0000-4444-8888-aaaabbbbcccc";
        let resume = CLAUDE_V1.argv(Some(id));
        let idx = resume.iter().position(|a| a == "--resume").expect("resume flag");
        assert_eq!(resume[idx + 1], id, "the id is its own argv element");
        assert!(
            !resume.iter().any(|a| a.contains(SESSION_ID_SLOT)),
            "no unsubstituted slot survives"
        );
        // The resume argv is the spawn argv plus exactly the two elements.
        assert_eq!(resume.len(), spawn.len() + 2);
        assert_eq!(&resume[..spawn.len()], &spawn[..]);
    }

    /// A hostile session id cannot become anything but one argv element —
    /// there is no shell, so quoting/metacharacters are inert data.
    #[test]
    fn a_hostile_session_id_stays_one_inert_argv_element() {
        let evil = "x; rm -rf ~ #`whoami`$(id)";
        let argv = CLAUDE_V1.argv(Some(evil));
        assert_eq!(argv.iter().filter(|a| a.as_str() == evil).count(), 1);
        assert_eq!(argv.len(), CLAUDE_V1.argv(None).len() + 2);
    }

    #[test]
    fn exactly_one_v1_entry_and_the_runner_names_claude_only_here() {
        assert_eq!(ADAPTERS.len(), 1, "ADR-017 clause 6: one declarative entry in v1");
        assert_eq!(planner_adapter().key, "claude");
        assert_eq!(planner_adapter().binary, "claude");
        assert_eq!(planner_adapter().min_major, 2);
        assert_eq!(planner_adapter().parse, ParseMode::StreamJsonV1);
    }

    #[test]
    fn parse_major_reads_the_real_banner_shape() {
        assert_eq!(parse_major("2.1.226 (Claude Code)"), Some(2));
        assert_eq!(parse_major("  10.0.0 (Claude Code)\n"), Some(10));
        assert_eq!(parse_major("1.9.9"), Some(1));
        assert_eq!(parse_major("Claude Code 2.0"), None); // cannot tell: not a refusal
        assert_eq!(parse_major(""), None);
    }
}
