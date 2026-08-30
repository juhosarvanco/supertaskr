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
/// - `--verbose` — STILL REQUIRED by 2.1.226. The plan left this as an
///   open question for the smoke to answer, and the answer is measured,
///   not inherited: dropping the flag makes the CLI refuse at
///   ARGUMENT-VALIDATION time — `Error: When using --print,
///   --output-format=stream-json requires --verbose`, exit 1, on stderr,
///   before any model call. Load-bearing, not vestigial.
/// - `--permission-mode acceptEdits` — auto-accepts file writes INSIDE
///   THE CWD, which is the project directory. There is no `--add-dir`
///   anywhere, pinned by
///   [`tests::permission_mode_is_accept_edits_and_scoped_to_cwd`], so
///   this mode grants no directory beyond the project. The materialized
///   kit lives inside the project (`.nputer/genesis/kit/`, §3), so
///   reading it needs no extra grant either.
///   **AND THE SENTENCE THAT USED TO FOLLOW — that cwd scoping IS the
///   project-dir scoping T-025 criterion 2 demands — IS RETRACTED
///   (T-025-s4, 2026-08-30).** It is true of THIS FLAG and false of the
///   grant as a whole. `--allowedTools` matches a command's TEXT and
///   carries no path scope, so `Bash(cp:*)` and `Bash(mkdir:*)` reach
///   any path the user can write; and the CLI grants a read-only Bash
///   class of its own on top. The scope of the retraction, the evidence
///   for it and the questions the captures cannot answer are
///   [`EFFECTIVE_GRANT_TABLES`], where the next reader of this table
///   will meet them.
/// - `--allowedTools` with exactly six Bash patterns — the kit's
///   imperative surface as the T-023 verdict recorded it: `git init`,
///   `git add`, `git commit`, `git status` (stage 0's repo work),
///   `mkdir` (the empty docs/ subdirectories), `cp` (docs-templates and
///   the adapter files copied verbatim). Nothing wider: no `Bash(*)`, no
///   `rm`, no `git push`, no network verbs.
///   **AND THE GRANT IS SPELLING-SENSITIVE, WHICH THIS BULLET USED TO
///   READ AS THOUGH IT WERE NOT (T-124).** Each pattern is a PREFIX over
///   a fixed verb, so it covers a command's TEXT and not its EFFECT. A
///   planner that writes `git -C <projectdir> status --short` — the same
///   operation, spelled with a directory flag — reaches NONE of the six:
///   the four git grants begin `git init` / `git add` / `git commit` /
///   `git status`, and `git -C …` begins with none of those. **All four
///   git grants are lost to that one spelling, not merely `git status`.**
///   Measured, not reasoned: [`OBSERVED_PLANNER_REFUSALS`] below carries
///   the real refusal the real CLI returned for exactly this command.
///   THE GAP IS NOT CLOSED BY WIDENING, and that conclusion is recorded
///   with the evidence rather than left to the next reader — see that
///   const's own doc comment.
///   **AND THE SIX STAY — RULED 2026-08-30 (T-025-s4), the card's third
///   arm closed rather than parked a fourth time.** Three measured
///   reasons, none of them the one the card assumed. (a) `mkdir` is NOT
///   avoidable: `Write` creates parent directories, but stage 0's
///   `docs/decisions/`, `docs/tasks/` and `docs/rooms/` are wanted
///   EMPTY, and no file write creates an empty directory. (b) `cp` IS
///   avoidable — every observed use copies inside the cwd, which
///   `acceptEdits` already covers through `Write` — but the paired
///   change is the kit's own stage-0 instruction, which is
///   [`RefusalRemedy::PlannerInstruction`]'s fence and not this one; the
///   one observed stage 0 needed eight separate `cp` calls, so dropping
///   the grant unpaired buys eight in-band denials on the first genesis
///   a user ever runs, and pricing that needs the real turn T-025-s4 is
///   forbidden to spawn. (c) The six are the SMALLEST and only reviewed
///   member of [`EFFECTIVE_GRANT_TABLES`], so narrowing them moves the
///   union very little and the two tables it does not reach not at all —
///   but smallest by COUNT is largest by WRITE REACH: this is the only
///   member that auto-approves a write outside the cwd, so (a) and (b)
///   are what carry this ruling, not (c). (Corrected at verification:
///   as first written, (c) met its counterweight only on the card.)
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
///   **RIDING IT MEANS INHERITING IT, AND THAT IS A GRANT (T-025-s4).**
///   Whatever the user's own settings allow is in the spawned planner's
///   surface, it is reviewed by nobody here, and it DRIFTS — table three
///   of [`EFFECTIVE_GRANT_TABLES`] carries the measurement. Closing it
///   would mean passing `--setting-sources`, which also drops the user's
///   hooks and project settings and cannot be priced without a real
///   turn: ROUTED to @human rather than taken.
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

// ---- T-124: the observed refusals, classified where the grants live ----
//
// T-101 put the CLI's denial rows on screen, and on their first real day
// they showed that the planner is refused ITS OWN GRANTED SURFACE. The
// classification lives HERE, next to the grants it is about, because a
// finding kept only in a task file is a finding the next author of this
// table will not meet.

/// WHOSE MECHANISM REFUSED A COMMAND — the question that decides where a
/// fix can possibly go, and the reason "widen the allowlist" is an answer
/// to at most one third of what was observed.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RefusalMechanism {
    /// **OURS.** The command reached no pattern in [`CLAUDE_V1`]'s
    /// `--allowedTools`, so the CLI asked for approval. This is the only
    /// class an argv change can even address.
    OurAllowlist,
    /// **THE CLI'S OWN SAFETY HEURISTIC**, which fires on what a command
    /// DOES regardless of what we allowlisted. No `--allowedTools`
    /// pattern switches it off and no flag this adapter may pass reaches
    /// it — the only bypass is the one [`ADAPTERS`]' own pin forbids.
    CliSafetyHeuristic,
    /// **THE CLI'S OWN COMMAND ANALYSER** declining to reason about a
    /// command's text at all. Same containment as the heuristic: it is
    /// upstream of the allowlist, so nothing in argv moves it.
    CliCommandAnalyser,
}

impl std::fmt::Display for RefusalMechanism {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            Self::OurAllowlist => "our own --allowedTools patterns",
            Self::CliSafetyHeuristic => "the CLI's own safety heuristic",
            Self::CliCommandAnalyser => "the CLI's own command analyser",
        })
    }
}

/// What can actually move a refusal, once its mechanism is known.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RefusalRemedy {
    /// A change to THIS TABLE's argv. Nothing observed carries this, and
    /// [`tests::every_captured_refusal_is_classified_and_none_is_fixed_by_argv`]
    /// is what makes that a measured claim rather than a summary.
    AdapterArgv,
    /// A change to what the PLANNER WRITES — the kit's own instructions,
    /// `method/roles/planner.md` and `method/interview/plan-interview.md`.
    /// OUT OF THIS FENCE by construction: editing them is a method
    /// version bump whose third file is Rust (`METHOD_SNAPSHOT_VERSION`
    /// in `kit.rs`), routed to T-104 as `T-124-s1`.
    PlannerInstruction,
}

/// One refusal the real CLI returned, with what it is about.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ObservedRefusal {
    /// The CLI's own reason text. EVIDENCE — see the const's provenance.
    pub reason: &'static str,
    pub mechanism: RefusalMechanism,
    pub remedy: RefusalRemedy,
    /// Why that remedy and not the other one.
    pub why: &'static str,
}

/// **THE THREE REFUSALS A REAL `claude` 2.1.226 RETURNED TO THE PLANNER**
/// on a live genesis interview, 2026-08-24, and the classification each
/// one's own text supports.
///
/// # Provenance, stated exactly, because these strings cannot be regenerated
///
/// `real_cli_arms_forbidden` structurally forbids a test from resolving
/// the user's CLI (T-047-s6, T-060), so nothing in this suite can produce
/// them again; a fresh capture costs a real model call. They are data
/// here rather than prose in a comment for that reason.
///
/// They are transcribed from the CLI's rows AS RENDERED BY T-101's denial
/// notice, not from a JSONL capture — this project holds one of those
/// (`docs/research/captures/real-planner-turn-2026-08-19.jsonl`, five
/// days earlier) and it is a different turn. Two consequences, said out
/// loud so neither is mistaken for transcription:
///
/// - `<projectdir>` in the third reason is the TRANSCRIBER'S REDACTION of
///   the user's real project path (the 2026-08-19 capture shows the CLI
///   writes real paths);
/// - the source transcription wraps quoted fragments in markdown code
///   spans. Those backticks are the transcriber's and are removed here.
///   **That reading is not a guess**: the third reason's first 85 bytes
///   are byte-identical to the 2026-08-19 capture's own
///   `subcommandResults` message, which carries no backticks around the
///   command it quotes. `the_2026_08_24_transcription_agrees_with_the_2026_08_19_capture`
///   in `tests/agent_runner.rs` asserts that agreement against the file,
///   so a paraphrase here reds against real captured bytes.
///
/// # The classification, and why it does NOT end in a wider grant
///
/// Only ONE of the three is ours, and even that one is not fixed by argv.
/// The reason is refusal 1: it establishes that this CLI carries a
/// hook-safety guard on directory-changing git which fires INDEPENDENTLY
/// of the allowlist. Refusal 3's command IS directory-changing git. So a
/// pattern admitting it would still meet refusal 1's guard — **the
/// widening would be both wider and ineffective**, which is the strongest
/// possible reason not to make it.
///
/// And the only patterns that COULD admit it are worse than the gap:
/// `Bash(git -C:*)` grants every git subcommand in every directory on
/// disk (`push`, `reset --hard`, `clean -fdx`), and a runtime-substituted
/// project path would put a `/`-bearing user-controlled string into a
/// permission grant — the exact class [`validate_session_id`] refuses
/// from argv on purpose. ADR-012's narrowness lives in the signature;
/// there is no narrow spelling of "this directory" here.
///
/// **THE ADAPTER THEREFORE DID NOT MOVE.** `spawn_args` is byte-identical
/// to what T-023's verdict recorded, pinned by
/// [`tests::allowed_tools_are_exactly_the_kits_imperative_surface`].
pub const OBSERVED_PLANNER_REFUSALS: &[ObservedRefusal] = &[
    ObservedRefusal {
        reason: "This command changes directory before running git, which can execute \
                 untrusted hooks from the target directory. Approve only if you trust it.",
        mechanism: RefusalMechanism::CliSafetyHeuristic,
        remedy: RefusalRemedy::PlannerInstruction,
        why: "The reason names the CLI's OWN guard: changing directory before git can run \
              hooks from the target tree. It is a judgement about what the command DOES, \
              taken before ours is consulted, so no --allowedTools pattern and no other \
              flag can switch it off. The only thing that avoids it is not writing the \
              directory-changing spelling - and the planner never needs to, because its \
              cwd already IS the project directory.",
    },
    ObservedRefusal {
        reason: "Redirect target concatenation contains $/` — unanalyzable gap or substitution",
        mechanism: RefusalMechanism::CliCommandAnalyser,
        remedy: RefusalRemedy::PlannerInstruction,
        why: "The CLI's own analyser declining to parse a shell REDIRECT target that \
              carries a `$` or a backtick - upstream of any allowlist, so argv cannot \
              reach it. And the write should not have gone through the shell at all: \
              `--permission-mode acceptEdits` already auto-accepts a file write inside \
              the cwd through the Write tool, with no Bash grant involved. The adapter \
              ALREADY passes the flag that makes this unnecessary; what is missing is \
              the instruction to use it.",
    },
    ObservedRefusal {
        reason: "This Bash command contains multiple operations. The following part requires \
                 approval: git -C <projectdir> status --short",
        mechanism: RefusalMechanism::OurAllowlist,
        remedy: RefusalRemedy::PlannerInstruction,
        why: "OURS, and it names our narrowness exactly: it quotes the command and says \
              it requires approval. `git -C <dir> status --short` reaches no grant, \
              because every pattern here is a PREFIX over a fixed verb and none of the \
              four git prefixes is a prefix of it. THE REMEDY IS STILL NOT ARGV: refusal \
              1 above shows the same command meets a hook-safety guard our allowlist \
              cannot reach, so a widened pattern buys a wider grant and changes nothing. \
              The bare spelling is already granted; writing it is a planner instruction.",
    },
];

// ---- T-025-s4: the effective grant, in three tables --------------------

/// One member of the union that IS the spawned planner's grant.
///
/// The card this comes from exists because a sentence was written and
/// never checked: *"the effective grant is the union of three tables —
/// the adapter's six patterns, the CLI's own defaults, and whatever the
/// user happens to have configured — and only the first is reviewed."*
/// The type makes each member answer for itself, including for what
/// nobody can answer.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct GrantTable {
    /// Which table.
    pub name: &'static str,
    /// What it puts into the union.
    pub contributes: &'static str,
    /// Whether anything in THIS repository reviews it. Exactly one of
    /// these is `true`, and that asymmetry is the whole finding.
    pub reviewed: bool,
    /// What this adapter's argv can do about it. `"none"` is a real
    /// answer and is written as one rather than left blank.
    pub lever: &'static str,
    /// **The question the landed captures CANNOT answer about this
    /// table.** Named per member, because a gap left implicit is a gap
    /// the next reader mistakes for a measurement.
    pub unanswered: &'static str,
    /// Measured membership, where a capture on disk can keep it honest.
    /// **EMPTY IS A CLAIM, NOT AN OMISSION**: either the membership is
    /// derivable from live code (table one, which is
    /// [`AgentAdapter::allowed_tools`] and is never copied here), or
    /// nothing in this repository can keep it true (table three).
    pub observed: &'static [&'static str],
}

/// **THE EFFECTIVE GRANT, CHARACTERISED FROM THE LANDED CAPTURES AND
/// FROM THIS FILE — T-025-s4, 2026-08-30.**
///
/// # The verdict on the sentence
///
/// **TRUE, and it stays true.** Three tables, one reviewed. The adapter
/// can narrow table one (it is this file), can SUBTRACT from table two
/// by name through `--disallowedTools`, and can close table three only
/// by refusing to ride the user's own configuration. None of those makes
/// the sentence false: a denylist removes names known when this binary
/// was built, so a CLI that gains a tool tomorrow grants it by default.
///
/// # Provenance
///
/// Table two's [`GrantTable::observed`] is transcribed from the `tools`
/// array of the `system`/`init` line in
/// `docs/research/captures/real-planner-turn-2026-08-19.jsonl`, captured
/// under THIS adapter's own argv, and
/// `the_cli_default_tool_table_is_read_off_the_2026_08_19_capture` in
/// `tests/agent_runner.rs` asserts it against that file — so a
/// paraphrase reds against real captured bytes rather than merely
/// looking plausible. `real_cli_arms_forbidden` means no test can
/// produce a fresh one (T-047-s6, T-060).
///
/// # What is NOT here, and why
///
/// Table three's membership is a fact about the user's machine at a
/// moment, not a function of this tree. A literal here would be a figure
/// with no possible keeper — so the field is empty ON PURPOSE and
/// `unanswered` says what that costs.
pub const EFFECTIVE_GRANT_TABLES: &[GrantTable] = &[
    GrantTable {
        name: "the adapter's own --allowedTools patterns",
        contributes: "Auto-approval for a command whose TEXT begins with one of a fixed set of \
                      verbs. Carries NO path scope: `cp` and `mkdir` reach any path the user can \
                      write, which is precisely the capability the cwd-scoping argument was \
                      meant to deny.",
        reviewed: true,
        lever: "this file - the patterns ARE the lever, pinned by \
                `allowed_tools_are_exactly_the_kits_imperative_surface`",
        unanswered: "Whether the real CLI's matcher agrees with the word-boundary rule \
                     `granted_prefix_reached` models - i.e. whether `Bash(cp:*)` also admits \
                     `cpio`. One refusal calibrates the prefix half; nothing on disk tests the \
                     boundary half, and only a real turn can.",
        observed: &[],
    },
    GrantTable {
        name: "the CLI's own defaults",
        contributes: "The TOOL SET itself, plus a read-only Bash class the CLI approves without \
                      asking. `--allowedTools` does not restrict this set - the capture was taken \
                      with six Bash patterns passed and carries the whole array below - so every \
                      tool here is reachable unless it is denied by name.",
        reviewed: false,
        lever: "--disallowedTools, and it MEASURABLY bites: `WebFetch` and `WebSearch` are the \
                two names this adapter denies and the two names missing from the array below. It \
                is a denylist, so it can never close the table.",
        unanswered: "WHICH Bash commands the CLI approves on its own. Two ran unprompted on \
                     2026-08-19 (`ls`, `find`) and the rule that admitted them is unstated; the \
                     2026-08-30 capture carries tool LABELS only - deduplicated against the \
                     previous label - so it cannot even say which commands ran. The boundary of \
                     that class is unmeasured and only a real turn moves it.",
        observed: &[
            "Task",
            "Bash",
            "CronCreate",
            "CronDelete",
            "CronList",
            "DesignSync",
            "Edit",
            "EnterWorktree",
            "ExitWorktree",
            "ListAgents",
            "Monitor",
            "NotebookEdit",
            "PushNotification",
            "Read",
            "RemoteTrigger",
            "ReportFindings",
            "ScheduleWakeup",
            "SendMessage",
            "Skill",
            "TaskCreate",
            "TaskGet",
            "TaskList",
            "TaskOutput",
            "TaskStop",
            "TaskUpdate",
            "ToolSearch",
            "Workflow",
            "Write",
        ],
    },
    GrantTable {
        name: "whatever the user happens to have configured",
        contributes: "Every permission the user's own settings allow, inherited because this \
                      adapter deliberately passes no `--settings` and no `--setting-sources`. It \
                      is not a fixed table: it is whatever that file says at spawn time.",
        reviewed: false,
        lever: "none that keeps the auth posture - `--setting-sources` would close it and would \
                also drop the user's hooks and project settings. ROUTED to @human.",
        unanswered: "What it contains for any user but this one, and what it will contain here \
                     tomorrow. It has already drifted twice under observation, in both cases for \
                     reasons that had nothing to do with genesis. Nothing in this repository can \
                     keep a copy of it honest, which is why `observed` is empty.",
        observed: &[],
    },
];

/// The command prefix a `Bash(<prefix>:*)` grant covers, or `None` if the
/// pattern is not that shape. Parses OUR OWN literal — no claim about the
/// CLI is involved in this function.
pub fn bash_grant_prefix(pattern: &str) -> Option<&str> {
    pattern.strip_prefix("Bash(")?.strip_suffix(":*)")
}

/// Which of [`AgentAdapter::allowed_tools`]'s grants a command's TEXT
/// reaches, under the prefix rule the grant's own spelling states.
///
/// **THE ONE CLAIM ABOUT THE CLI HERE IS THE PREFIX RULE, AND IT IS
/// CALIBRATED RATHER THAN ASSUMED.** The single real data point this
/// project holds is [`OBSERVED_PLANNER_REFUSALS`]'s third entry: the real
/// CLI refused `git -C <projectdir> status --short` while `Bash(git
/// status:*)` was granted. A prefix rule predicts exactly that, and
/// nothing else among the six explains it. Note what does NOT depend on
/// the rule being exactly right: the classification above rests on the
/// captured text, which names its own mechanism.
///
/// The boundary is checked so `mkdir` cannot be claimed to cover
/// `mkdirfoo` — a grant over a verb ends at a word boundary or at the end
/// of the command.
pub fn granted_prefix_reached(adapter: &AgentAdapter, command: &str) -> Option<&'static str> {
    adapter.allowed_tools().iter().copied().find_map(|pattern| {
        let prefix = bash_grant_prefix(pattern)?;
        let rest = command.strip_prefix(prefix)?;
        (rest.is_empty() || rest.starts_with(' ')).then_some(prefix)
    })
}

// ---- T-039: the session-id gate ----------------------------------------
//
// The one value in a spawned argv that the bypass pin never saw was the
// SUBSTITUTED session id. `-r, --resume [value]` takes an OPTIONAL
// argument (verified in 2.1.226's own `--help`), so an id beginning with
// `-` does not become the resume VALUE — it parses as a standalone FLAG,
// and `--dangerously-skip-permissions` in that position turns a
// six-pattern Bash allowlist into unrestricted tool use for that turn.
// Everything below exists so that cannot happen from data.

/// Longest session id the runner will accept. The observed real id is 36
/// bytes; this is generous headroom with a hard stop, so an absurd id
/// (a megabyte of hex) is refused rather than handed to `execve`.
pub const SESSION_ID_MAX_LEN: usize = 128;

/// Why a session id was refused. Typed and named — the id is NEVER
/// coerced, truncated, or quietly reshaped into something acceptable: a
/// value that is not an id is a fact about the stream or the file it came
/// from, and the user is told which.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SessionIdRejection {
    /// No id at all where one was required.
    Empty,
    TooLong { len: usize },
    /// THE INJECTION CLASS THIS GATE CLOSES: an id that would parse as a
    /// flag rather than as `--resume`'s value.
    LeadingDash,
    /// Not a letter or a digit in the first position (a leading `.`, `_`
    /// or anything else): `..` must never be able to become a path
    /// component, and no real id starts that way.
    IllegalStart { ch: char },
    /// A character outside the shape — a path separator, whitespace, a
    /// NUL, a control character, a unicode lookalike, a shell
    /// metacharacter.
    IllegalChar { at: usize, ch: char },
    /// Defense in depth over the ASSEMBLED argv: an element the CLI would
    /// parse SPECIALLY sits where a plain value belongs. Nothing today can
    /// reach this after the checks above pass; it is the structural
    /// backstop for a future template that substitutes somewhere new.
    ///
    /// T-047 widens it past the leading-dash class — `shape` names which
    /// of the CLI's own parsing shapes the element matched.
    FlagInValuePosition { at: usize, arg: String, shape: ArgShape },
    /// T-047 (T-039-s4): the assembled vector and its template disagree on
    /// length. [`AgentAdapter::argv`] builds one element per slot, so this
    /// cannot happen from the shipped call site — and that is exactly why
    /// it is checked. The pre-T-047 rule `zip`ped the two slices, so ANY
    /// assembled tail past the template's end went uninspected: a template
    /// of 2 with a flag at index 2 returned `Ok(())`. A guard that silently
    /// skips part of its input is the shape of the bug T-039 closed.
    ArgvLengthMismatch { template: usize, assembled: usize },
}

/// Which of the CLI's own parsing shapes an argv element matched.
///
/// Read first-hand from `claude --help` (2.1.226 — `--help` only, no model
/// was called), because "looks like a flag" is a claim about a parser and
/// not about punctuation.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ArgShape {
    /// Begins with `-`. THE T-039 CLASS: `-r, --resume [value]` takes an
    /// OPTIONAL argument, so a `-`-leading value parses as a standalone
    /// flag rather than as the value it was substituted to be.
    LeadingDash,
    /// The element IS one of the CLI's documented option names, byte for
    /// byte (`--settings`, `--fork-session`, `-c`).
    KnownFlagName,
    /// The `--flag=value` form, which commander accepts interchangeably
    /// with `--flag value`. `--settings=/tmp/evil.json` is ONE argv element
    /// that loads an arbitrary settings file — the T-039 verifier's own
    /// probe, which it judged arguably worse than the injection T-039
    /// measured.
    FlagEqualsValue,
    /// One of the CLI's SUBCOMMANDS (`doctor`, `install`, `update`, …).
    /// The only shape here carrying no leading dash at all, which is why
    /// the leading-dash rule was too narrow: `claude doctor` runs a
    /// different program than `claude -p`.
    KnownSubcommand,
}

impl std::fmt::Display for ArgShape {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match self {
            Self::LeadingDash => "it begins with '-', so the CLI reads it as a flag",
            Self::KnownFlagName => "it is one of the CLI's own option names",
            Self::FlagEqualsValue => "it is the CLI's `--flag=value` form",
            Self::KnownSubcommand => "it is one of the CLI's own subcommands",
        })
    }
}

impl std::fmt::Display for SessionIdRejection {
    /// Rendered into the typed failure the webview shows, so every
    /// borrowed character is escaped: a hostile id cannot smuggle a
    /// terminal escape or a newline through the explanation of why it was
    /// refused.
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Empty => write!(f, "it is empty"),
            Self::TooLong { len } => write!(
                f,
                "it is {len} bytes, past the {SESSION_ID_MAX_LEN}-byte bound"
            ),
            Self::LeadingDash => write!(
                f,
                "it begins with '-', which the CLI would parse as a FLAG rather than as the value of --resume"
            ),
            Self::IllegalStart { ch } => write!(
                f,
                "it starts with '{}' (U+{:04X}); an id starts with a letter or a digit",
                ch.escape_debug(),
                *ch as u32
            ),
            Self::IllegalChar { at, ch } => write!(
                f,
                "it carries '{}' (U+{:04X}) at byte {at}, outside the id shape [A-Za-z0-9._-]",
                ch.escape_debug(),
                *ch as u32
            ),
            Self::FlagInValuePosition { at, arg, shape } => write!(
                f,
                "argv element {at} would be '{}', which is not one of the adapter's own literals and {shape}",
                arg.escape_debug()
            ),
            Self::ArgvLengthMismatch { template, assembled } => write!(
                f,
                "the assembled argv has {assembled} elements against a {template}-slot template; every slot yields exactly one element, so the two can only differ if something built the vector by another route"
            ),
        }
    }
}

/// THE VALIDATION. One function, used by BOTH boundaries — the capture of
/// an id off the CLI's init line and the read of one back out of
/// `.nputer/sessions.json` — so the two can never drift apart.
///
/// **The pattern: `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`.** Derived from
/// what the CLI actually produces, not from a guess:
///
/// - the one real id ever observed here is a hyphenated lowercase-hex
///   UUID (`e7954de6-…`, 36 bytes — T-025's real-CLI smoke, recorded in
///   T-025-s2), and
/// - 2.1.226's own `--help` documents the sibling flag as
///   `--session-id <uuid>  … (must be a valid UUID)`, so the CLI's own
///   name for the shape is "uuid".
///
/// A UUID-exact regex was considered and deliberately widened to this
/// ASCII token: a CLI that changes its id format (a prefix, a ULID, a
/// base58 blob) would otherwise make every recorded session unresumable
/// on upgrade — a loud failure, but a needless one — and the fake CLI the
/// whole suite runs against emits `fake-session-0001`. The security
/// property does not depend on the widening: every character in the
/// allowlist is INERT to an argument parser. No leading `-` (never a
/// flag), no `=` (never `--flag=value`), no `/` or `\` (never a path), no
/// whitespace, no NUL, no control character, nothing outside ASCII, and a
/// hard length bound. A UUID is a strict subset of it.
pub fn validate_session_id(id: &str) -> Result<(), SessionIdRejection> {
    if id.is_empty() {
        return Err(SessionIdRejection::Empty);
    }
    if id.len() > SESSION_ID_MAX_LEN {
        return Err(SessionIdRejection::TooLong { len: id.len() });
    }
    let first = id.chars().next().expect("non-empty");
    if first == '-' {
        return Err(SessionIdRejection::LeadingDash);
    }
    if !first.is_ascii_alphanumeric() {
        return Err(SessionIdRejection::IllegalStart { ch: first });
    }
    for (at, ch) in id.char_indices() {
        if !(ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.') {
            return Err(SessionIdRejection::IllegalChar { at, ch });
        }
    }
    Ok(())
}

// ---- T-047: the model string off the same init line --------------------

/// Longest model name the runner will record. The observed real names are
/// well under 40 bytes; before T-047 the ONLY bound anywhere was
/// `MAX_LINE_BYTES` (1 MiB), so ~1 MiB per turn could land in a registry
/// file that is otherwise a few hundred bytes — measured at 200,290 bytes
/// from a 200,000-byte model in this task's pre-fix probe.
pub const MODEL_MAX_LEN: usize = 128;

/// Why a model string was refused. Same shape as [`SessionIdRejection`],
/// same discipline: typed, named, never coerced, and never echoing the
/// refused bytes back.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ModelRejection {
    Empty,
    TooLong { len: usize },
    /// Not a letter or a digit in the first position.
    IllegalStart { ch: char },
    /// A control character, whitespace, DEL, or anything outside ASCII.
    IllegalChar { at: usize, ch: char },
}

impl std::fmt::Display for ModelRejection {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Empty => write!(f, "it is empty"),
            Self::TooLong { len } => {
                write!(f, "it is {len} bytes, past the {MODEL_MAX_LEN}-byte bound")
            }
            Self::IllegalStart { ch } => write!(
                f,
                "it starts with '{}' (U+{:04X}); a model name starts with a letter or a digit",
                ch.escape_debug(),
                *ch as u32
            ),
            Self::IllegalChar { at, ch } => write!(
                f,
                "it carries '{}' (U+{:04X}) at byte {at}, outside printable ASCII",
                ch.escape_debug(),
                *ch as u32
            ),
        }
    }
}

/// THE MODEL GATE (T-047, absorbing T-039-s2). The `model` field rides the
/// same init line the session id does, is written to
/// `.nputer/sessions.json`, and is RENDERED — and before this it was
/// accepted unbounded and unchecked.
///
/// **THE CHARACTER CLASS IS DELIBERATELY WIDER THAN
/// [`validate_session_id`]'s, and this header is where the criterion asks
/// that be justified.** The id's class is `[A-Za-z0-9._-]` because an id
/// becomes an ARGV ELEMENT: every character in it has to be inert to an
/// argument parser, which is what rules out `=`, `/`, `:` and `@`. A model
/// name is never argv (we never pass `--model` — ADR-003: the user's CLI
/// default IS the model) and never a path; it is a RECORDED FACT about
/// what ran. Reusing the id's class would therefore refuse real provider
/// spellings for no security gain — Bedrock's
/// `us.anthropic.claude-…-v1:0` carries `:`, Vertex's `claude-…@20240620`
/// carries `@`, and a router-style `vendor/model` carries `/`.
///
/// So the rule keeps the id validator's SHAPE — first character
/// alphanumeric, a hard byte bound, typed named rejections, no coercion —
/// and widens the body to **printable ASCII with no space** (U+0021–U+007E).
/// What that still refuses is exactly what can hurt a value that is stored
/// and shown: control characters and terminal escapes (it is rendered, and
/// it reaches log lines), newlines (which forge log records), DEL,
/// everything non-ASCII (homoglyph and bidi-override spoofing in the UI),
/// and size.
pub fn validate_model(model: &str) -> Result<(), ModelRejection> {
    if model.is_empty() {
        return Err(ModelRejection::Empty);
    }
    if model.len() > MODEL_MAX_LEN {
        return Err(ModelRejection::TooLong { len: model.len() });
    }
    let first = model.chars().next().expect("non-empty");
    if !first.is_ascii_alphanumeric() {
        return Err(ModelRejection::IllegalStart { ch: first });
    }
    for (at, ch) in model.char_indices() {
        // Printable ASCII, space excluded: '!'..='~'.
        if !matches!(ch, '\u{21}'..='\u{7e}') {
            return Err(ModelRejection::IllegalChar { at, ch });
        }
    }
    Ok(())
}

// ---- T-153-s2: the per-element bound `execve` itself imposes -----------

/// Longest single string this runner will hand to `execve` — one argv
/// element, or one `KEY=VALUE` environment pair, NUL included.
///
/// **THE CONSTRAINT IS A PER-ELEMENT KERNEL CAP AND IT IS NOT
/// `ARG_MAX`.** Linux bounds each string `execve` copies — argv strings
/// and envp strings alike, since one routine copies both — at
/// `MAX_ARG_STRLEN`, defined in the kernel's `binfmts.h` as `PAGE_SIZE *
/// 32`. It is independent of `ARG_MAX`, which bounds the TOTAL and is
/// megabytes larger; over the per-element cap `execve` returns `E2BIG`
/// however small the total is. The cap therefore MOVES WITH THE PAGE
/// SIZE: 131,072 bytes on the 4 KiB-page x86-64 this project's CI runs
/// on, and larger on a 16 KiB- or 64 KiB-page kernel.
///
/// **macOS HAS NO CAP OF THAT SHAPE, which is why this went unseen
/// locally for the life of the repository.** Measured at this task's ref
/// on Darwin 25.6.0 arm64 by `exec`ing `/usr/bin/true` under a single
/// oversized env pair: 200,000 bytes succeeds, 1,000,000 succeeds,
/// 1,040,000 succeeds, and the first failure is at 1,048,000 — i.e.
/// against `getconf ARG_MAX` = 1,048,576, a TOTAL. There is no
/// per-element limit to find; the one that exists is the sum.
///
/// **SO THE BOUND IS THE SMALLEST PLATFORM'S PER-ELEMENT CAP WITH
/// MARGIN, NOT THAT CAP.** 65,536 is half of 32 × 4 KiB, which leaves
/// room for the NUL the kernel counts inside its own length (a string of
/// exactly the cap does not fit — the terminator does not come free) and
/// for a page size smaller than any kernel now ships. It costs nothing:
/// the longest value this runner legitimately places is 128 bytes
/// ([`SESSION_ID_MAX_LEN`], [`MODEL_MAX_LEN`]), so the bound sits 512×
/// above everything real and only an absurd value can reach it.
pub const SPAWN_ELEMENT_MAX_LEN: usize = 65_536;

/// Does this environment pair fit [`SPAWN_ELEMENT_MAX_LEN`]?
///
/// `execve` sees ONE string per pair — `KEY=VALUE`, then a NUL — so the
/// accounting is the key, the `=`, the value and the terminator. It lives
/// here, in one place, because a size rule counted twice is two rules:
/// the caller supplies the pair and never the arithmetic.
///
/// Byte lengths, not character counts: `OsStr::len` is what `execve`
/// copies on unix, and no lossy conversion happens on the way.
pub fn child_env_pair_fits(key: &std::ffi::OsStr, value: &std::ffi::OsStr) -> bool {
    key.len() + "=".len() + value.len() + 1 <= SPAWN_ELEMENT_MAX_LEN
}

/// EVERY OPTION `claude 2.1.226` DOCUMENTS, long and short, read
/// first-hand from its own `--help` at build time of this task (`--help`
/// only — no model was called). Aliases are listed separately because the
/// CLI accepts either spelling (`--allowedTools` / `--allowed-tools`).
///
/// This is a table of what the CLI parses specially, NOT a denylist of the
/// dangerous ones: the rule below refuses the whole class, so a flag that
/// looks harmless today (and a flag added by a future CLI whose name
/// happens to be here) is refused in a value position too.
pub const KNOWN_CLI_FLAGS: &[&str] = &[
    "--add-dir",
    "--agent",
    "--agents",
    "--allow-dangerously-skip-permissions",
    "--allowedTools",
    "--allowed-tools",
    "--append-system-prompt",
    "--append-system-prompt-file",
    "--autocompact",
    "--ax-screen-reader",
    "--background",
    "--bare",
    "--betas",
    "--bg",
    "--brief",
    "--chrome",
    "--cloud",
    "--continue",
    "--dangerously-skip-permissions",
    "--debug",
    "--debug-file",
    "--disable-slash-commands",
    "--disallowedTools",
    "--disallowed-tools",
    "--effort",
    "--environment",
    "--exclude-dynamic-system-prompt-sections",
    "--fallback-model",
    "--file",
    "--fork-session",
    "--forward-subagent-text",
    "--from-pr",
    "--help",
    "--ide",
    "--include-hook-events",
    "--include-partial-messages",
    "--input-format",
    "--json-schema",
    "--max-budget-usd",
    "--mcp-config",
    "--model",
    "--name",
    "--no-chrome",
    "--no-session-persistence",
    "--output-format",
    "--permission-mode",
    "--plugin-dir",
    "--plugin-url",
    "--print",
    "--prompt-suggestions",
    "--remote-control",
    "--remote-control-session-name-prefix",
    "--replay-user-messages",
    "--resume",
    "--safe-mode",
    "--session-id",
    "--setting-sources",
    "--settings",
    "--strict-mcp-config",
    "--system-prompt",
    "--system-prompt-file",
    "--teleport",
    "--tmux",
    "--tools",
    "--verbose",
    "--version",
    "--worktree",
    "-c",
    "-d",
    "-h",
    "-n",
    "-p",
    "-r",
    "-v",
    "-w",
];

/// The CLI's SUBCOMMANDS, from the same `--help` (`Commands:`). These
/// carry NO leading dash, which is the entire reason the leading-dash rule
/// was too narrow to be called an argv gate: `claude doctor` and
/// `claude install` are different programs, not different values.
pub const KNOWN_CLI_SUBCOMMANDS: &[&str] = &[
    "agents",
    "auth",
    "auto-mode",
    "doctor",
    "gateway",
    "import",
    "install",
    "mcp",
    "plugin",
    "plugins",
    "project",
    "setup-token",
    "ultrareview",
    "update",
    "upgrade",
];

/// Does this argv element match a shape the CLI parses specially?
/// `None` = an inert value.
///
/// Ordered most-specific-first so the refusal NAMES the sharpest true
/// thing: `--settings=/tmp/evil.json` is reported as the `--flag=value`
/// form rather than merely as "begins with a dash". Comparison is
/// ASCII-case-insensitive — stricter than the CLI, which cannot cost a
/// legitimate value anything, since nothing this runner substitutes is
/// ever a flag or subcommand spelling in any case.
pub fn classify_arg_shape(arg: &str) -> Option<ArgShape> {
    fn known(table: &[&str], needle: &str) -> bool {
        table.iter().any(|k| k.eq_ignore_ascii_case(needle))
    }
    // `--flag=value`: one element the CLI splits into two.
    if let Some((head, _)) = arg.split_once('=') {
        if known(KNOWN_CLI_FLAGS, head) {
            return Some(ArgShape::FlagEqualsValue);
        }
    }
    if known(KNOWN_CLI_FLAGS, arg) {
        return Some(ArgShape::KnownFlagName);
    }
    if arg.starts_with('-') {
        return Some(ArgShape::LeadingDash);
    }
    if known(KNOWN_CLI_SUBCOMMANDS, arg) {
        return Some(ArgShape::KnownSubcommand);
    }
    None
}

/// THE ASSEMBLED-ARGV RULE, in production and not only in the pin: an
/// element of a spawned argv may be something the CLI parses specially
/// ONLY by being the template's own literal at that index, byte for byte.
/// Everything else — every substituted value, and every element past the
/// template's end — must be inert to the CLI's parser.
///
/// The template is `const` data compiled into the binary (ADR-017 clause
/// 2, unreachable from the webview), which is what makes "equal to its own
/// slot" a safe exemption; anything that DIFFERS from its slot arrived
/// from somewhere else and is treated as hostile.
///
/// **T-047 rewrites this function twice over** (T-039-s4, found by T-039's
/// own verifier):
/// 1. it inspects the WHOLE assembled vector. The old body `zip`ped the
///    two slices, and `zip` stops at the shorter — so an assembled tail
///    longer than its template was never looked at, and a 2-slot template
///    with a flag at index 2 returned `Ok(())`. A length disagreement is
///    now itself a refusal, whatever the tail contains;
/// 2. it refuses every shape the CLI treats specially ([`ArgShape`]), not
///    only the leading-dash one the doc comment used to promise.
///
/// A real check returning a typed refusal rather than a `debug_assert!`:
/// a test-only pin leaves the shipped binary unguarded, and a panic in
/// the spawn path would be worse than the typed turn failure the runner
/// already knows how to report.
pub fn check_no_data_borne_flag(
    template: &[&str],
    assembled: &[String],
) -> Result<(), SessionIdRejection> {
    for (at, arg) in assembled.iter().enumerate() {
        // The template's OWN literal at this index — trusted, byte for
        // byte. `template.get` rather than `template[at]`, so the tail past
        // the template's end takes the hostile branch instead of panicking.
        if template.get(at).is_some_and(|slot| *slot == arg.as_str()) {
            continue;
        }
        if let Some(shape) = classify_arg_shape(arg) {
            return Err(SessionIdRejection::FlagInValuePosition { at, arg: arg.clone(), shape });
        }
    }
    if template.len() != assembled.len() {
        return Err(SessionIdRejection::ArgvLengthMismatch {
            template: template.len(),
            assembled: assembled.len(),
        });
    }
    Ok(())
}

impl AgentAdapter {
    /// The argv AFTER the binary for one turn. `resume` = `None` spawns a
    /// fresh session; `Some(id)` resumes, with the id substituted as ONE
    /// argv element (never interpolated into a string).
    ///
    /// THE CHOKE POINT (T-039). Assembly is fallible: an id that fails
    /// [`validate_session_id`] never becomes argv at all, whatever code
    /// path produced it — the stream, the registry file, or a caller that
    /// does not exist yet. There is no infallible way to assemble a resume
    /// argv, by construction.
    pub fn argv(&self, resume: Option<&str>) -> Result<Vec<String>, SessionIdRejection> {
        let (template, id) = match resume {
            None => (self.spawn_args, None),
            Some(id) => {
                validate_session_id(id)?;
                (self.resume_args, Some(id))
            }
        };
        let assembled: Vec<String> = template
            .iter()
            .map(|s| match id {
                Some(id) if *s == SESSION_ID_SLOT => id.to_string(),
                _ => (*s).to_string(),
            })
            .collect();
        check_no_data_borne_flag(template, &assembled)?;
        Ok(assembled)
    }

    /// argv for the one-shot version probe (§6).
    pub fn version_argv(&self) -> Vec<String> {
        vec!["--version".to_string()]
    }

    /// The values this adapter grants after `--allowedTools`, derived from
    /// the spawn template rather than transcribed (T-124).
    ///
    /// ONE derivation, so the classification bodies and the production
    /// code cannot disagree about what is granted — the same reason T-047
    /// moved the argv length rule out of its pin and into
    /// [`check_no_data_borne_flag`]. The slice ends at `--disallowedTools`
    /// because that is the next flag in this template; a template without
    /// one yields everything to the end, which is the honest answer for a
    /// shape this table does not currently have.
    pub fn allowed_tools(&self) -> &'static [&'static str] {
        let Some(start) = self.spawn_args.iter().position(|a| *a == "--allowedTools") else {
            return &[];
        };
        let rest = &self.spawn_args[start + 1..];
        let end = rest
            .iter()
            .position(|a| a.starts_with("--"))
            .unwrap_or(rest.len());
        &rest[..end]
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
///
/// **T-047: the non-unix arm answers `false`, not `true`.** It used to
/// return `true` unconditionally — a stub that read as "we cannot check
/// the executable bit here", but SPELLED "every file is executable",
/// which is the permissive default for the one check standing between a
/// cached path and `Command::new`. Recorded by the T-039 verifier as
/// harmless today (Windows is not a target) and deliberately unfiled;
/// closed here so a future Windows lane inherits a REFUSAL it must
/// deliberately implement rather than a hole it must remember to find.
/// The refusal is loud by construction: `resolve_cli` falls through to a
/// fresh probe and then to typed `cliNotFound { probed }`.
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
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Ids that are legitimately shaped — the real observed form and the
    /// fixtures — every one of which must assemble into a spawnable argv.
    const REAL_IDS: &[&str] = &[
        // The one real id ever observed here (T-025's smoke, T-025-s2).
        "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77",
        // The fake CLI the whole suite runs against.
        "fake-session-0001",
        // Shapes a future CLI id could plausibly take, all inert.
        "01JQ8ZC4M7Q9K2VYB3T5N6XW0R",
        "sess_2f8a.9c",
    ];

    /// Every argv string any adapter can ever produce, spawn and resume.
    fn all_argv_strings() -> Vec<String> {
        let mut out = Vec::new();
        for adapter in ADAPTERS {
            out.push(adapter.binary.to_string());
            out.extend(adapter.argv(None).expect("the spawn template assembles"));
            for id in REAL_IDS {
                out.extend(adapter.argv(Some(id)).expect("a real id assembles"));
            }
            out.extend(adapter.version_argv());
        }
        out
    }

    /// THE BYPASS PIN (§2, widened by T-039). The standing rule "never a
    /// bypass-permissions flag" stops depending on verifier memory: it is
    /// red the moment any adapter entry — this one or a future one —
    /// carries either CLI spelling or the permission-mode string itself.
    ///
    /// **T-039 widens it from the TABLE to the FULLY ASSEMBLED argv.** The
    /// T-025 verifier's finding was that this pin searched only static
    /// template strings, so a forbidden flag arriving as DATA — the
    /// captured session id substituted into the resume slot — walked past
    /// it while it stayed green. The pin now also asserts the structural
    /// property that makes the whole class impossible: in a spawned argv,
    /// an element may begin with `-` ONLY by being one of the template's
    /// own literal flags. Anything substituted sits in a value position and
    /// cannot be read as a flag by a CLI whose `--resume [value]` takes an
    /// OPTIONAL argument.
    ///
    /// Drills (run at build time, output quoted in the implementation
    /// notes): planting `--dangerously-skip-permissions` in
    /// `CLAUDE_V1::spawn_args` turns the search half red; removing the
    /// validation from `AgentAdapter::argv` turns the assembled half red.
    #[test]
    fn no_adapter_argv_can_ever_bypass_permissions() {
        const FORBIDDEN: &[&str] = &[
            "--dangerously-skip-permissions",
            "--allow-dangerously-skip-permissions",
            "bypassPermissions",
        ];

        // --- half one, unchanged: the three-spelling table search --------
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

        // --- half two (T-039): the FULLY ASSEMBLED argv ------------------
        // Template plus every substituted value. An element may begin with
        // `-` only by BEING one of the template's own flags; a value
        // position that begins with `-` is a flag arriving as data.
        for adapter in ADAPTERS {
            for (template, assembled) in [
                (adapter.spawn_args, adapter.argv(None).expect("spawn assembles")),
            ]
            .into_iter()
            .chain(REAL_IDS.iter().map(|id| {
                (adapter.resume_args, adapter.argv(Some(id)).expect("a real id assembles"))
            })) {
                // T-047: THE LENGTH RULE IS DERIVED, NOT RESTATED. This
                // used to be the pin's own `assert_eq!(template.len(),
                // assembled.len())` — one of TWO copies of one rule, and
                // the copy the PRODUCTION function lacked (T-039-s4). The
                // production function now owns it, and the pin asserts
                // through it, so the two cannot disagree again: weaken
                // `check_no_data_borne_flag` and this line reds.
                assert_eq!(
                    check_no_data_borne_flag(template, &assembled),
                    Ok(()),
                    "the PRODUCTION rule must accept a legitimately assembled argv - \
                     one template slot, one argv element, nothing flag-shaped in a value \
                     position"
                );
                for (at, (slot, arg)) in template.iter().zip(assembled.iter()).enumerate() {
                    if arg.starts_with('-') {
                        assert_eq!(
                            arg, slot,
                            "ADAPTER VALUE-POSITION VIOLATED (T-039): assembled argv element {at} \
                             is {arg:?}, which begins with '-' without being the template's own \
                             flag {slot:?}. `--resume [value]` takes an OPTIONAL argument, so a \
                             '-'-leading value parses as a STANDALONE FLAG - which is how \
                             --dangerously-skip-permissions reached a spawned argv through DATA \
                             while the search above stayed green (T-025-s6)."
                        );
                    }
                }
            }
        }

        // --- half three (T-039): the verifier's exact injection ----------
        // The measured attack, as a regression pin: these are REFUSED at
        // assembly, so there is no argv to search. Without the validation
        // in `AgentAdapter::argv` this loop panics on the first unwrap and
        // half two reds on the substituted element.
        for injection in [
            "--dangerously-skip-permissions",
            "--permission-mode=bypassPermissions",
            "--allow-dangerously-skip-permissions",
            "-r",
        ] {
            assert_eq!(
                CLAUDE_V1.argv(Some(injection)),
                Err(SessionIdRejection::LeadingDash),
                "a session id beginning with '-' must never assemble into argv: {injection:?}"
            );
        }
    }

    /// THE GATE'S TABLE: what an id may be, and everything it may not.
    /// The accepted row is the shape the CLI actually produces; every
    /// rejected row is a class the criterion names.
    #[test]
    fn the_session_id_gate_is_an_allowlist_not_a_denylist() {
        // Accepted: the observed real id, the fixtures, and shapes a
        // future CLI could plausibly emit.
        for id in REAL_IDS {
            assert_eq!(validate_session_id(id), Ok(()), "must accept a real id: {id:?}");
            assert!(CLAUDE_V1.argv(Some(id)).is_ok());
        }
        for id in ["a", "A1", "0", &"a".repeat(SESSION_ID_MAX_LEN)] {
            assert_eq!(validate_session_id(id), Ok(()), "inside the shape: {id:?}");
        }

        use SessionIdRejection::*;
        let cases: &[(&str, SessionIdRejection)] = &[
            // The injection class, in every spelling that reaches argv.
            ("--dangerously-skip-permissions", LeadingDash),
            ("--permission-mode=bypassPermissions", LeadingDash),
            ("-r", LeadingDash),
            ("-", LeadingDash),
            // Path separators: an id must never be able to act as a path.
            ("../../etc/passwd", IllegalStart { ch: '.' }),
            ("a/../b", IllegalChar { at: 1, ch: '/' }),
            ("a\\b", IllegalChar { at: 1, ch: '\\' }),
            // Whitespace of every kind — a space would split nothing (argv
            // is an array, not a line) but it is outside the shape, and an
            // id that carries one is not an id.
            ("has space", IllegalChar { at: 3, ch: ' ' }),
            ("tab\there", IllegalChar { at: 3, ch: '\t' }),
            ("line\nbreak", IllegalChar { at: 4, ch: '\n' }),
            // NUL: `execve` would truncate at it, so what the CLI parses
            // would not be what we checked.
            ("abc\0--dangerously-skip-permissions", IllegalChar { at: 3, ch: '\0' }),
            // Control characters, including a terminal escape.
            ("abc\u{1b}[2Kdef", IllegalChar { at: 3, ch: '\u{1b}' }),
            ("abc\u{7f}", IllegalChar { at: 3, ch: '\u{7f}' }),
            // Unicode lookalikes: a Cyrillic 'е' and a full-width hyphen
            // are not ASCII, whatever they look like in a font.
            ("\u{435}7954de6", IllegalStart { ch: '\u{435}' }),
            ("\u{ff0d}-abc", IllegalStart { ch: '\u{ff0d}' }),
            ("e7954de6\u{2010}2ac1", IllegalChar { at: 8, ch: '\u{2010}' }),
            // Shell metacharacters (inert without a shell, still not an id).
            ("x; rm -rf ~ #`whoami`$(id)", IllegalChar { at: 1, ch: ';' }),
            ("a=b", IllegalChar { at: 1, ch: '=' }),
            // The empty string, and something absurdly long.
            ("", Empty),
            (".hidden", IllegalStart { ch: '.' }),
            ("_leading", IllegalStart { ch: '_' }),
        ];
        for (id, expected) in cases {
            assert_eq!(
                validate_session_id(id),
                Err(expected.clone()),
                "must reject {id:?} as {expected:?}"
            );
            assert_eq!(
                CLAUDE_V1.argv(Some(id)),
                Err(expected.clone()),
                "…and it must never assemble into argv: {id:?}"
            );
        }
        // Absurdly long, checked by length rather than by a literal.
        let absurd = "a".repeat(SESSION_ID_MAX_LEN + 1);
        assert_eq!(
            validate_session_id(&absurd),
            Err(TooLong { len: SESSION_ID_MAX_LEN + 1 })
        );
        assert_eq!(validate_session_id(&"b".repeat(1024 * 1024)), Err(TooLong { len: 1024 * 1024 }));
    }

    /// The rejection explains itself in words a human can act on, and it
    /// ESCAPES what it quotes: the id is hostile data, so the explanation
    /// of why it was refused must not become a second injection (a
    /// terminal escape in a log, a newline forging a line).
    #[test]
    fn a_rejection_names_itself_without_relaying_raw_bytes() {
        let why = validate_session_id("--dangerously-skip-permissions").unwrap_err().to_string();
        assert!(why.contains("begins with '-'"), "{why}");
        assert!(why.contains("--resume"), "{why}");
        assert!(!why.contains("dangerously"), "the refused id is not echoed back: {why}");

        let why = validate_session_id("abc\u{1b}[2K").unwrap_err().to_string();
        assert!(why.contains("U+001B"), "{why}");
        assert!(!why.contains('\u{1b}'), "a terminal escape must never survive: {why}");

        let why = validate_session_id("a\nb").unwrap_err().to_string();
        assert!(!why.contains('\n'), "no forged log line: {why}");
        assert_eq!(validate_session_id("").unwrap_err().to_string(), "it is empty");
        assert!(validate_session_id(&"a".repeat(200)).unwrap_err().to_string().contains("200 bytes"));
    }

    /// The assembled-argv rule is a REAL check in the spawn path, not only
    /// an assertion in a test: fed a template it has never seen, it still
    /// refuses a substituted flag.
    #[test]
    fn the_assembled_argv_rule_refuses_a_flag_in_any_value_position() {
        let template = &["--resume", SESSION_ID_SLOT, "--verbose"];
        let good = vec!["--resume".to_string(), "abc".to_string(), "--verbose".to_string()];
        assert_eq!(check_no_data_borne_flag(template, &good), Ok(()));

        let bad = vec![
            "--resume".to_string(),
            "--dangerously-skip-permissions".to_string(),
            "--verbose".to_string(),
        ];
        assert_eq!(
            check_no_data_borne_flag(template, &bad),
            Err(SessionIdRejection::FlagInValuePosition {
                at: 1,
                arg: "--dangerously-skip-permissions".into(),
                shape: ArgShape::KnownFlagName,
            })
        );
        // A flag position whose element was REPLACED is caught too, not
        // just the slot: the rule is "only the template's own flags".
        let swapped = vec![
            "--dangerously-skip-permissions".to_string(),
            "abc".to_string(),
            "--verbose".to_string(),
        ];
        assert!(matches!(
            check_no_data_borne_flag(template, &swapped),
            Err(SessionIdRejection::FlagInValuePosition { at: 0, .. })
        ));
    }

    /// T-047 / T-039-s4, HALF ONE: THE BLIND TAIL.
    ///
    /// The pre-T-047 body `zip`ped `template` with `assembled`, and `zip`
    /// stops at the shorter of the two — so every element past the
    /// template's end went uninspected. The exact case the T-039 verifier
    /// described, measured against the unfixed function before the fix was
    /// written, returned `Ok(())`:
    ///
    ///     [t047-probe-a] template len 2 assembled len 3
    ///     [t047-probe-a] assembled: ["--resume", "e7954de6-…", "--dangerously-skip-permissions"]
    ///     [t047-probe-a] check_no_data_borne_flag -> Ok(())
    ///
    /// It is unreachable from `argv`, which builds one element per slot —
    /// which is exactly why it is worth pinning: an unreachable hole is
    /// one refactor away from being the reachable one, and this is the
    /// same shape as the bug T-039 closed (a guard that looks like it
    /// covers a class while silently skipping part of its input).
    #[test]
    fn the_argv_rule_inspects_the_whole_vector_not_the_zipped_prefix() {
        let template = &["--resume", SESSION_ID_SLOT];

        // THE VERIFIER'S CASE: a flag PAST the zip boundary.
        let past_the_end = vec![
            "--resume".to_string(),
            "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77".to_string(),
            "--dangerously-skip-permissions".to_string(),
        ];
        assert_eq!(
            check_no_data_borne_flag(template, &past_the_end),
            Err(SessionIdRejection::FlagInValuePosition {
                at: 2,
                arg: "--dangerously-skip-permissions".into(),
                shape: ArgShape::KnownFlagName,
            }),
            "an element past the template's end must be INSPECTED, not skipped by zip"
        );

        // A length disagreement is a refusal even when the tail is inert:
        // one slot yields one element, so anything else means the vector
        // was built by a route this function cannot vouch for.
        let inert_tail = vec![
            "--resume".to_string(),
            "abc".to_string(),
            "harmless".to_string(),
        ];
        assert_eq!(
            check_no_data_borne_flag(template, &inert_tail),
            Err(SessionIdRejection::ArgvLengthMismatch { template: 2, assembled: 3 })
        );
        // …and SHORTER is refused too: a dropped element shifts every
        // value that follows it into a different slot's meaning.
        assert_eq!(
            check_no_data_borne_flag(template, &["--resume".to_string()]),
            Err(SessionIdRejection::ArgvLengthMismatch { template: 2, assembled: 1 })
        );
        assert_eq!(
            check_no_data_borne_flag(template, &[]),
            Err(SessionIdRejection::ArgvLengthMismatch { template: 2, assembled: 0 })
        );
        // The legitimate shape still passes, unchanged.
        assert_eq!(
            check_no_data_borne_flag(template, &["--resume".to_string(), "abc".to_string()]),
            Ok(())
        );
    }

    /// T-047 / T-039-s4, HALF TWO: THE SHAPES THE CLI ACTUALLY PARSES.
    ///
    /// The old rule was `starts_with('-')`, which is a claim about
    /// punctuation. This is the claim about the PARSER, and every row was
    /// read first-hand out of `claude --help` (2.1.226 — `--help` only, no
    /// model was called):
    ///
    /// - `--settings=/tmp/evil.json` — the T-039 verifier's own probe,
    ///   which it judged arguably WORSE than the injection T-039 measured,
    ///   because it loads an arbitrary settings file. One argv element,
    ///   `--flag=value`, which commander splits itself;
    /// - `doctor`, `install`, … — SUBCOMMANDS, and the reason the old rule
    ///   was too narrow rather than merely imprecise: they carry no dash
    ///   at all, and `claude doctor` is a different program.
    #[test]
    fn the_argv_rule_refuses_every_shape_the_cli_parses_specially() {
        let template = &["--resume", SESSION_ID_SLOT];
        let refuse = |value: &str| {
            check_no_data_borne_flag(
                template,
                &["--resume".to_string(), value.to_string()],
            )
        };

        for (value, shape) in [
            // The `--flag=value` form.
            ("--settings=/tmp/evil.json", ArgShape::FlagEqualsValue),
            ("--permission-mode=bypassPermissions", ArgShape::FlagEqualsValue),
            ("--add-dir=/", ArgShape::FlagEqualsValue),
            ("--mcp-config=/tmp/evil.json", ArgShape::FlagEqualsValue),
            // Case is not a way through: the table compares ASCII-folded.
            ("--SETTINGS=/tmp/evil.json", ArgShape::FlagEqualsValue),
            // Exactly a known option name.
            ("--settings", ArgShape::KnownFlagName),
            ("--dangerously-skip-permissions", ArgShape::KnownFlagName),
            ("--fork-session", ArgShape::KnownFlagName),
            ("--safe-mode", ArgShape::KnownFlagName),
            ("--bare", ArgShape::KnownFlagName),
            ("--session-id", ArgShape::KnownFlagName),
            ("-c", ArgShape::KnownFlagName),
            ("-r", ArgShape::KnownFlagName),
            // Dash-leading but not a name this CLI knows: still refused,
            // because the class is the danger, not the membership.
            ("--a-flag-this-cli-has-never-heard-of", ArgShape::LeadingDash),
            ("-", ArgShape::LeadingDash),
            ("-zzz", ArgShape::LeadingDash),
            ("--unknown=value", ArgShape::LeadingDash),
            // SUBCOMMANDS — no leading dash anywhere in sight.
            ("doctor", ArgShape::KnownSubcommand),
            ("install", ArgShape::KnownSubcommand),
            ("update", ArgShape::KnownSubcommand),
            ("mcp", ArgShape::KnownSubcommand),
            ("setup-token", ArgShape::KnownSubcommand),
            ("Doctor", ArgShape::KnownSubcommand),
        ] {
            assert_eq!(
                refuse(value),
                Err(SessionIdRejection::FlagInValuePosition {
                    at: 1,
                    arg: value.to_string(),
                    shape,
                }),
                "a value position must never carry {value:?}"
            );
            assert_eq!(classify_arg_shape(value), Some(shape), "{value:?}");
        }

        // INERT values pass — the rule refuses shapes, not strings. Every
        // one of these is a real element of this adapter's own argv or a
        // real session id.
        for value in [
            "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77",
            "fake-session-0001",
            "01JQ8ZC4M7Q9K2VYB3T5N6XW0R",
            "stream-json",
            "acceptEdits",
            "WebSearch",
            "Bash(git init:*)",
            "claude",
        ] {
            assert_eq!(classify_arg_shape(value), None, "{value:?} is an inert value");
            assert_eq!(refuse(value), Ok(()), "{value:?}");
        }

        // The exemption is EXACT and per-index: the template's own literal
        // is trusted where the template puts it, and nowhere else.
        assert_eq!(
            check_no_data_borne_flag(
                &["--verbose", "--resume", SESSION_ID_SLOT],
                &["--verbose".to_string(), "--resume".to_string(), "abc".to_string()]
            ),
            Ok(())
        );
        assert!(matches!(
            check_no_data_borne_flag(
                &["--verbose", "--resume", SESSION_ID_SLOT],
                &["--resume".to_string(), "--verbose".to_string(), "abc".to_string()]
            ),
            Err(SessionIdRejection::FlagInValuePosition { at: 0, .. })
        ));

        // The whole shipped argv still assembles, which is the half that
        // stops this from being a gate nobody can pass.
        for adapter in ADAPTERS {
            adapter.argv(None).expect("the spawn template assembles");
            for id in REAL_IDS {
                adapter.argv(Some(id)).expect("a real id assembles");
            }
        }
    }

    /// T-047 (absorbing T-039-s2): THE MODEL GATE, and the recorded reason
    /// its character class is WIDER than the session id's.
    ///
    /// An id becomes an argv element, so every character in it must be
    /// inert to an argument parser. A model name is never argv and never a
    /// path — it is a recorded fact that gets stored and rendered — so the
    /// classes that matter are the ones that hurt a stored, displayed
    /// string: size, control characters, newlines, and non-ASCII
    /// lookalikes. Refusing `:` and `@` would only refuse real provider
    /// spellings.
    #[test]
    fn a_model_name_is_bounded_and_validated_with_a_wider_class_than_an_id() {
        for model in [
            "claude-opus-5",
            "fake-model-1",
            "claude-3-5-sonnet-20241022",
            // Bedrock and Vertex spellings, which are exactly why the id's
            // class does not fit: `:` and `@` are real here.
            "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            "claude-3-5-sonnet@20240620",
            "vendor/model-name",
            &"m".repeat(MODEL_MAX_LEN),
        ] {
            assert_eq!(validate_model(model), Ok(()), "a real model name: {model:?}");
        }
        // The contrast, asserted rather than asserted-about: the same
        // strings the id validator refuses.
        assert!(validate_session_id("us.anthropic.claude-3-5-sonnet-20241022-v2:0").is_err());
        assert!(validate_session_id("claude-3-5-sonnet@20240620").is_err());

        use ModelRejection::*;
        let cases: &[(&str, ModelRejection)] = &[
            ("", Empty),
            // Control characters and a terminal escape: it is RENDERED.
            ("claude\u{1b}[2K-opus", IllegalChar { at: 6, ch: '\u{1b}' }),
            ("claude\u{7}-opus", IllegalChar { at: 6, ch: '\u{7}' }),
            ("claude\u{7f}", IllegalChar { at: 6, ch: '\u{7f}' }),
            // A newline forges a log record.
            ("claude\nSTOLEN", IllegalChar { at: 6, ch: '\n' }),
            ("claude\r\nx", IllegalChar { at: 6, ch: '\r' }),
            ("abc\0def", IllegalChar { at: 3, ch: '\0' }),
            ("claude opus", IllegalChar { at: 6, ch: ' ' }),
            ("claude\topus", IllegalChar { at: 6, ch: '\t' }),
            // Non-ASCII: homoglyphs and bidi overrides spoof a UI.
            ("claude\u{202e}sunop", IllegalChar { at: 6, ch: '\u{202e}' }),
            ("\u{43a}laude", IllegalStart { ch: '\u{43a}' }),
            // First character, same rule the id uses.
            ("-model", IllegalStart { ch: '-' }),
            (".hidden", IllegalStart { ch: '.' }),
            ("/etc/passwd", IllegalStart { ch: '/' }),
        ];
        for (model, expected) in cases {
            assert_eq!(validate_model(model), Err(expected.clone()), "must refuse {model:?}");
        }
        // The bound, by length rather than by literal — the pre-fix probe
        // put 200,000 bytes of model into a registry file.
        assert_eq!(
            validate_model(&"m".repeat(MODEL_MAX_LEN + 1)),
            Err(TooLong { len: MODEL_MAX_LEN + 1 })
        );
        assert_eq!(validate_model(&"m".repeat(200_000)), Err(TooLong { len: 200_000 }));

        // And the refusal never relays the raw bytes back, exactly like
        // the id's does: a hostile model cannot paint a terminal on its
        // way through the explanation of why it was refused.
        let why = validate_model("claude\u{1b}[2K").unwrap_err().to_string();
        assert!(why.contains("U+001B"), "{why}");
        assert!(!why.contains('\u{1b}'), "a terminal escape must never survive: {why}");
        let why = validate_model("claude\nSTOLEN").unwrap_err().to_string();
        assert!(!why.contains('\n'), "no forged log line: {why}");
        assert!(!why.contains("STOLEN"), "the refused value is not echoed back: {why}");
    }

    /// The permission mode we DO pass is the scoped one, named exactly
    /// once, and it is an argv element of its own (not glued to the flag).
    #[test]
    fn permission_mode_is_accept_edits_and_scoped_to_cwd() {
        let argv = CLAUDE_V1.argv(None).expect("the spawn template assembles");
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
        let argv = CLAUDE_V1.argv(None).expect("the spawn template assembles");
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

    /// T-025-s4: THE EFFECTIVE GRANT IS THREE TABLES AND EXACTLY ONE OF
    /// THEM IS REVIEWED — the card's own sentence, asserted instead of
    /// believed.
    ///
    /// The card had carried that sentence through three triages as
    /// prose. Prose is what let the 2026-08-19 finding sit for eleven
    /// days beside a doc comment that contradicted it. What this body
    /// buys over a paragraph is the ASYMMETRY (one reviewed, two not)
    /// and the GAPS: every table must still name the question the
    /// captures cannot answer, so a later editor cannot quietly delete a
    /// gap and leave a table looking measured.
    #[test]
    fn the_effective_grant_is_three_tables_and_exactly_one_is_reviewed() {
        // A CARDINALITY FLOOR (poison shape five): dropping a table must
        // not drop its own check. "Three" is the card's claim, not a
        // convenience.
        assert_eq!(
            EFFECTIVE_GRANT_TABLES.len(),
            3,
            "the union is three tables; a fourth needs characterising and a missing one is a \
             grant nobody is accounting for"
        );
        for (i, a) in EFFECTIVE_GRANT_TABLES.iter().enumerate() {
            for b in &EFFECTIVE_GRANT_TABLES[i + 1..] {
                assert_ne!(a.name, b.name, "three DIFFERENT tables, or the union is not a union");
            }
            assert!(!a.contributes.is_empty(), "{}: a table says what it contributes", a.name);
            assert!(!a.lever.is_empty(), "{}: \"none\" is written out, never left blank", a.name);
            assert!(
                !a.unanswered.is_empty(),
                "{}: T-025-s4 criterion 1 - every table NAMES the question the captures cannot \
                 answer, rather than leaving the gap implicit",
                a.name
            );
        }

        // THE ASYMMETRY THAT IS THE WHOLE FINDING.
        let reviewed: Vec<&GrantTable> =
            EFFECTIVE_GRANT_TABLES.iter().filter(|t| t.reviewed).collect();
        assert_eq!(
            reviewed.len(),
            1,
            "exactly one table is reviewed - if this ever reads 3, the sentence this card exists \
             for has become false and the doc comments above are owed the news"
        );
        assert!(
            reviewed[0].name.contains("--allowedTools"),
            "the reviewed one is OURS: {:?}",
            reviewed[0].name
        );

        // TABLE ONE IS NOT COPIED HERE, AND THE CONTROL IS WHAT MAKES
        // THAT A MEASUREMENT: an empty `observed` beside an empty
        // `allowed_tools()` would prove nothing at all.
        assert!(
            reviewed[0].observed.is_empty(),
            "table one's membership is `allowed_tools()` itself - a copy here is a second \
             implementation that can disagree with the argv it describes"
        );
        assert!(!CLAUDE_V1.allowed_tools().is_empty(), "…and the live source is non-empty");

        // TABLE TWO: the CLI's own set, with both controls. The denied
        // names are READ OFF THE LIVE ARGV rather than re-typed, so
        // changing the denylist moves this body with it.
        let cli = EFFECTIVE_GRANT_TABLES
            .iter()
            .find(|t| t.name.contains("CLI's own"))
            .expect("the CLI's own defaults are one of the three");
        assert!(!cli.reviewed);
        assert!(
            cli.observed.contains(&"Bash"),
            "the positive control: the tool the six patterns are about is in the CLI's set"
        );
        let argv = CLAUDE_V1.argv(None).expect("the spawn template assembles");
        let end = argv.iter().position(|a| a == "--disallowedTools").expect("denylist present");
        let denied: Vec<&str> = argv[end + 1..].iter().map(String::as_str).collect();
        assert!(!denied.is_empty(), "a denylist we can check against");
        for name in &denied {
            assert!(
                !cli.observed.contains(name),
                "THE MEASURED LEVER: {name:?} is denied by this adapter and is absent from the \
                 captured tool array. If it turns up there, `--disallowedTools` stopped biting \
                 and table two has no lever at all"
            );
        }

        // TABLE THREE IS UNPINNABLE BY CONSTRUCTION, and says so.
        let user = EFFECTIVE_GRANT_TABLES
            .iter()
            .find(|t| t.name.contains("user"))
            .expect("the user's own configuration is one of the three");
        assert!(!user.reviewed);
        assert!(
            user.observed.is_empty(),
            "a copy of the user's settings would be a figure with no possible keeper - it goes \
             stale the next time they edit that file, and nothing here would notice"
        );
        assert!(user.lever.starts_with("none"), "the honest answer, written out: {:?}", user.lever);
    }

    /// T-124: THE GRANT COVERS A SPELLING, NOT AN OPERATION — and the
    /// positive control is what makes that a measurement.
    ///
    /// A body asserting a command is NOT covered cannot tell "refused" from
    /// "there was nothing there" (CONVENTIONS: a negative assertion needs a
    /// positive control). So each refused spelling is asserted BESIDE the
    /// accepted twin that differs from it only by the directory flag: the
    /// twin reaching its grant is what proves the miss is about the
    /// spelling and not about the fixture.
    #[test]
    fn the_granted_spelling_and_the_planners_spelling_are_not_the_same_command() {
        let reach = |command: &str| granted_prefix_reached(&CLAUDE_V1, command);

        // --- THE POSITIVE CONTROL: the bare spellings DO reach a grant ---
        for (command, prefix) in [
            ("git status --short", "git status"),
            ("git init -q", "git init"),
            ("git add -A", "git add"),
            ("git commit -m \"genesis\"", "git commit"),
            ("mkdir -p docs/decisions docs/tasks docs/rooms", "mkdir"),
            ("cp .nputer/genesis/kit/adapters/CLAUDE.md .", "cp"),
        ] {
            assert_eq!(reach(command), Some(prefix), "the granted spelling: {command:?}");
        }

        // --- AND THE `-C` SPELLING OF THE SAME OPERATION REACHES NONE ----
        // Not merely `git status`: ALL FOUR git grants are lost to it,
        // which is more than the finding that opened this card claimed.
        for command in [
            "git -C /Users/x/proj status --short",
            "git -C /Users/x/proj init -q",
            "git -C /Users/x/proj add -A",
            "git -C /Users/x/proj commit -m \"genesis\"",
        ] {
            assert_eq!(
                reach(command),
                None,
                "T-124: the planner's own spelling must reach no grant - if this passes, \
                 the six patterns are no longer prefixes over fixed verbs: {command:?}"
            );
        }

        // THE REASON, asserted rather than narrated: every grant is a
        // prefix over a FIXED VERB. There is no directory slot to fill, so
        // no spelling that begins with one can reach any of them.
        for pattern in CLAUDE_V1.allowed_tools() {
            let prefix = bash_grant_prefix(pattern)
                .unwrap_or_else(|| panic!("every grant is `Bash(<prefix>:*)`: {pattern}"));
            assert!(
                !prefix.contains('/') && !prefix.contains(" -"),
                "a grant prefix is a fixed verb, never a path or a flag: {prefix:?} - a \
                 pattern admitting an arbitrary DIRECTORY is a wider grant than the one it \
                 replaces (ADR-012: narrowness lives in the signature)"
            );
        }
        // …and the check discriminates: the two widenings T-124 considered
        // and REJECTED are exactly what it catches.
        for rejected in ["Bash(git -C:*)", "Bash(cp /:*)"] {
            let prefix = bash_grant_prefix(rejected).expect("shaped like a grant");
            assert!(
                prefix.contains('/') || prefix.contains(" -"),
                "the fixed-verb check must be able to fail: {rejected:?}"
            );
        }

        // The boundary is real: a grant over a verb does not cover a
        // longer word that merely starts with it.
        assert_eq!(reach("mkdirfoo bar"), None);
        assert_eq!(reach("cpio -i"), None);
        assert_eq!(reach("mkdir"), Some("mkdir"));
        // And nothing outside the surface reaches anything.
        assert_eq!(reach("rm -rf /"), None);
        assert_eq!(reach("git push origin main"), None);
    }

    /// T-124: EVERY CAPTURED REFUSAL CARRIES ITS MECHANISM, AND NONE OF
    /// THEM IS FIXED BY AN ARGV CHANGE.
    ///
    /// The card's premise was that the classification drives the fix. It
    /// does — and it drives it OUT of this file: one refusal is ours and
    /// two are the CLI's own, and the one that is ours meets a second,
    /// independent guard that our allowlist cannot reach. This body is
    /// what stops that conclusion from being a paragraph somebody can
    /// quietly disagree with while widening a pattern.
    #[test]
    fn every_captured_refusal_is_classified_and_none_is_fixed_by_argv() {
        // A CARDINALITY FLOOR (poison shape five): deleting a refusal must
        // not delete its own check.
        assert_eq!(
            OBSERVED_PLANNER_REFUSALS.len(),
            3,
            "three refusals were captured; a fourth needs classifying and a missing one is \
             evidence this project cannot regenerate"
        );

        // THEY CLASSIFY THEMSELVES, AND INTO THREE DIFFERENT MECHANISMS —
        // the card's central claim, pinned. If two collapsed into one, the
        // "the fix is therefore not one fix" reasoning would not hold.
        // Pairwise rather than by `dedup`, which only removes ADJACENT
        // duplicates and would have reported three distinct mechanisms for
        // a list whose first and last agreed.
        for (i, a) in OBSERVED_PLANNER_REFUSALS.iter().enumerate() {
            for b in &OBSERVED_PLANNER_REFUSALS[i + 1..] {
                assert_ne!(
                    a.mechanism, b.mechanism,
                    "three refusals, three DIFFERENT mechanisms - that is what makes \
                     \"the fix is therefore not one fix\" true rather than rhetorical"
                );
            }
        }
        assert_eq!(
            OBSERVED_PLANNER_REFUSALS
                .iter()
                .filter(|r| r.mechanism == RefusalMechanism::OurAllowlist)
                .count(),
            1,
            "EXACTLY ONE is ours - a classification that found none of them ours would be \
             the comfortable answer rather than the measured one"
        );

        // THE CONCLUSION THAT KEPT THE ADAPTER STILL.
        for refusal in OBSERVED_PLANNER_REFUSALS {
            assert_ne!(
                refusal.remedy,
                RefusalRemedy::AdapterArgv,
                "T-124 measured that no argv change helps: the two CLI-side mechanisms are \
                 upstream of --allowedTools, and the one allowlist miss is the SAME command \
                 the hook-safety heuristic refuses independently. If a future capture is \
                 genuinely argv-fixable, change this line deliberately and widen with a \
                 reason - do not widen and then relax the pin. Refusal: {}",
                refusal.mechanism
            );
            assert!(!refusal.why.is_empty(), "a classification carries its reason");
        }

        // THE EVIDENCE IS INTACT: each reason is the CLI's own text, and
        // each carries the phrase its classification turns on.
        for (refusal, phrase) in OBSERVED_PLANNER_REFUSALS.iter().zip([
            "changes directory before running git",
            "unanalyzable",
            "requires approval",
        ]) {
            assert!(
                refusal.reason.contains(phrase),
                "the mechanism is read out of the CLI's own words: {phrase:?} is missing from \
                 {:?}",
                refusal.reason
            );
        }

        // AND THE THIRD ONE'S COMMAND IS THE ONE THE GRANTS CANNOT REACH.
        // This is the join between the evidence and the table above it:
        // the refused command, lifted out of the CLI's own sentence,
        // reaches no grant - while its bare twin does.
        let refused = OBSERVED_PLANNER_REFUSALS[2]
            .reason
            .rsplit_once("requires approval: ")
            .expect("the third reason quotes the command it refused")
            .1;
        assert_eq!(refused, "git -C <projectdir> status --short");
        assert_eq!(granted_prefix_reached(&CLAUDE_V1, refused), None);
        assert_eq!(
            granted_prefix_reached(&CLAUDE_V1, "git status --short"),
            Some("git status"),
            "the twin the planner should have written is already granted, which is why the \
             fix is an instruction and not a wider pattern"
        );
    }

    /// The resume template substitutes the id as ONE argv element, and the
    /// spawn template carries no `--resume` at all.
    #[test]
    fn resume_substitutes_one_argv_element_and_spawn_carries_none() {
        let spawn = CLAUDE_V1.argv(None).expect("the spawn template assembles");
        assert!(!spawn.iter().any(|a| a == "--resume"));
        assert!(!spawn.iter().any(|a| a.contains(SESSION_ID_SLOT)));

        let id = "1f2e3d4c-0000-4444-8888-aaaabbbbcccc";
        let resume = CLAUDE_V1.argv(Some(id)).expect("a real id assembles");
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

    /// A hostile session id never becomes an argv element at all.
    ///
    /// T-025 proved this id stayed ONE INERT ELEMENT (there is no shell,
    /// so quoting and metacharacters are data) — true, and not enough:
    /// T-025-s6 showed the element could BE a flag. Since T-039 the id is
    /// refused before assembly, so the older property is now vacuous for
    /// this input and is asserted below for a well-shaped id instead.
    #[test]
    fn a_hostile_session_id_never_reaches_argv_at_all() {
        let evil = "x; rm -rf ~ #`whoami`$(id)";
        assert_eq!(
            CLAUDE_V1.argv(Some(evil)),
            Err(SessionIdRejection::IllegalChar { at: 1, ch: ';' })
        );

        // A WELL-SHAPED id still rides as exactly one element, unchanged.
        let ok = "e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77";
        let argv = CLAUDE_V1.argv(Some(ok)).expect("a real id assembles");
        assert_eq!(argv.iter().filter(|a| a.as_str() == ok).count(), 1);
        assert_eq!(argv.len(), CLAUDE_V1.argv(None).expect("spawn").len() + 2);
    }

    #[test]
    fn exactly_one_v1_entry_and_the_runner_names_claude_only_here() {
        assert_eq!(ADAPTERS.len(), 1, "ADR-017 clause 6: one declarative entry in v1");
        assert_eq!(planner_adapter().key, "claude");
        assert_eq!(planner_adapter().binary, "claude");
        assert_eq!(planner_adapter().min_major, 2);
        assert_eq!(planner_adapter().parse, ParseMode::StreamJsonV1);
    }

    /// **T-153-s2: THE ARGV SIDE OF THE `execve` BOUND IS HELD BY THE ID
    /// GATE, AND THIS BODY IS WHAT SAYS SO OUT LOUD.**
    ///
    /// The runner hands `execve` two kinds of string, and they are
    /// bounded by different owners. The ENVIRONMENT is bounded at the
    /// spawn site by [`child_env_pair_fits`]. ARGV is bounded HERE, one
    /// step earlier and much more tightly: every element is a literal
    /// from a fixed template except the one substituted
    /// [`SESSION_ID_SLOT`], and [`validate_session_id`] has already
    /// refused anything past [`SESSION_ID_MAX_LEN`] before assembly
    /// begins. So a second length check inside [`AgentAdapter::argv`]
    /// would be unreachable code, and a bound nothing can reach is a
    /// second owner of a rule rather than a safeguard.
    ///
    /// What this pins instead is the RELATION the argument rests on —
    /// that the id gate's bound stays under the spawn bound, and that no
    /// template literal has quietly grown past it. Raise
    /// `SESSION_ID_MAX_LEN` above [`SPAWN_ELEMENT_MAX_LEN`], or paste a
    /// 64 KiB system prompt into a template, and this reds by name rather
    /// than becoming a `SpawnFailed` on Linux only.
    #[test]
    fn every_argv_element_an_adapter_can_assemble_fits_the_spawn_bound() {
        assert!(
            SESSION_ID_MAX_LEN < SPAWN_ELEMENT_MAX_LEN,
            "the id gate is what keeps the substituted element inside the execve bound; \
             at {SESSION_ID_MAX_LEN} vs {SPAWN_ELEMENT_MAX_LEN} it no longer does"
        );

        // The widest argv the id gate can let through: a maximum-length
        // id in the slot, every literal beside it.
        let widest_id = "a".repeat(SESSION_ID_MAX_LEN);
        validate_session_id(&widest_id).expect("a maximum-length id is legal");
        for argv in [
            CLAUDE_V1.argv(None).expect("the spawn template assembles"),
            CLAUDE_V1.argv(Some(&widest_id)).expect("the resume template assembles"),
        ] {
            for element in &argv {
                assert!(
                    element.len() <= SPAWN_ELEMENT_MAX_LEN,
                    "argv element {element:?} is {} bytes, past the {SPAWN_ELEMENT_MAX_LEN}-byte \
                     bound execve enforces per element",
                    element.len()
                );
            }
        }
    }

    /// The pair accounting is `KEY=VALUE` plus its NUL, and the boundary
    /// is checked one byte either side rather than described.
    #[test]
    fn a_child_env_pair_fits_up_to_the_bound_and_not_one_byte_past_it() {
        use std::ffi::OsStr;

        let key = OsStr::new("NPUTER_FAKE_MODEL");
        let widest = SPAWN_ELEMENT_MAX_LEN - key.len() - "=".len() - 1;
        assert!(child_env_pair_fits(key, OsStr::new(&"M".repeat(widest))));
        assert!(!child_env_pair_fits(key, OsStr::new(&"M".repeat(widest + 1))));

        // A longer KEY takes its bytes out of the same budget — the bound
        // is on the assembled string, not on the value.
        let longer = OsStr::new("NPUTER_FAKE_MODEL_XX");
        assert!(!child_env_pair_fits(longer, OsStr::new(&"M".repeat(widest))));

        // And an ordinary pair is nowhere near it.
        assert!(child_env_pair_fits(OsStr::new("TERM"), OsStr::new("dumb")));
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
