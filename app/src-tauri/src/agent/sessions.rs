//! T-025 §5: the session registry and the transcript — both runtime
//! files under `.nputer/`, both losable by charter (ADR-017 clause 4).
//!
//! `docs/` is the only project truth; nothing here is. Losing
//! `sessions.json` loses the ability to RESUME a native CLI session;
//! losing `transcript.jsonl` loses a chat rehydration. Neither loses a
//! fact about the project, which is why both may be overwritten,
//! renamed-aside on corruption, and killed mid-write without ceremony.
//!
//! Field-for-field per `method/runtime/sessions-schema.md`.

use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use super::adapter::{validate_session_id, SessionIdRejection};
use super::kit::write_atomic;

/// `.nputer/sessions.json`, relative to the project root.
pub const SESSIONS_REL: &str = ".nputer/sessions.json";
/// `.nputer/genesis/transcript.jsonl`, relative to the project root.
pub const TRANSCRIPT_REL: &str = ".nputer/genesis/transcript.jsonl";
/// One transcript line's text cap (§4's cap discipline).
pub const TRANSCRIPT_TEXT_CAP: usize = 256 * 1024;

/// One registry entry — exactly the schema's field set, snake_case on
/// disk as the schema writes it.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct SessionEntry {
    /// `"S1"`, `"S2"`, … — max existing + 1.
    pub id: String,
    /// The adapter key (`"claude"`).
    pub agent: String,
    /// What the CLI's own init line reported. RECORDED TRUTH, not a
    /// configured value — we never pass `--model`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// The id the CLI's resume flag takes, captured from the stream.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub native_session_id: Option<String>,
    /// UTC ISO-8601, hand-rolled (§9: zero new crates — no chrono).
    pub created: String,
    /// Incremented per COMPLETED exchange; drives nputer.yaml's
    /// warn_after_turns sediment warning.
    pub turns: u64,
    pub tasks: Vec<String>,
    pub roles: Vec<String>,
    /// `running` during a turn, `idle` between and after a cancel (the
    /// kill is of the TURN; the native session stays resume-eligible),
    /// `dead` reserved for explicit abandonment (T-029's fresh-session
    /// choice) — never written by this task.
    pub status: String,
}

impl SessionEntry {
    /// THE REGISTRY READ BOUNDARY (T-039 criterion 3).
    ///
    /// `native_session_id` is a value that came off a stream once and has
    /// been sitting in a FILE ever since — `.nputer/sessions.json`, in the
    /// user's own project directory, losable by charter and writable by
    /// anything with disk access: a sync client, another tool, a
    /// checked-in artifact, a corruption. T-029 resumes from this field,
    /// so it is validated here, on the way OUT of the file, and not only
    /// where it went in. Reading the raw field to spawn with is a bug;
    /// `adapter::argv` refuses it a second time if anyone tries.
    ///
    /// `Ok(None)` = no id recorded (nothing to resume, not an error).
    pub fn resume_id(&self) -> Result<Option<&str>, SessionIdRejection> {
        match self.native_session_id.as_deref() {
            None => Ok(None),
            Some(id) => validate_session_id(id).map(|()| Some(id)),
        }
    }
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct SessionsFile {
    #[serde(default)]
    pub sessions: Vec<SessionEntry>,
}

pub fn sessions_path(project_dir: &Path) -> PathBuf {
    rel_path(project_dir, SESSIONS_REL)
}

pub fn transcript_path(project_dir: &Path) -> PathBuf {
    rel_path(project_dir, TRANSCRIPT_REL)
}

fn rel_path(project_dir: &Path, rel: &str) -> PathBuf {
    let mut path = project_dir.to_path_buf();
    for part in rel.split('/') {
        path.push(part);
    }
    path
}

/// Read the registry. A file that does not parse is RENAMED ASIDE to
/// `sessions.json.corrupt` with a log line and a fresh registry is
/// returned — losable by charter, never silently destroyed, never a
/// panic.
pub fn load(project_dir: &Path) -> SessionsFile {
    let path = sessions_path(project_dir);
    let Ok(raw) = fs::read_to_string(&path) else {
        return SessionsFile::default();
    };
    match serde_json::from_str::<SessionsFile>(&raw) {
        Ok(parsed) => parsed,
        Err(err) => {
            let aside = path.with_extension("json.corrupt");
            match fs::rename(&path, &aside) {
                Ok(()) => println!(
                    "[nputer] agent: {} did not parse ({err}) - moved to {} and starting a fresh registry",
                    path.display(),
                    aside.display()
                ),
                Err(rename_err) => eprintln!(
                    "[nputer] agent: {} did not parse ({err}) and could not be moved aside ({rename_err}) - starting a fresh registry in memory",
                    path.display()
                ),
            }
            SessionsFile::default()
        }
    }
}

/// Next free `S<n>` id for this project's registry.
pub fn next_id(file: &SessionsFile) -> String {
    let max = file
        .sessions
        .iter()
        .filter_map(|s| s.id.strip_prefix('S').and_then(|n| n.parse::<u64>().ok()))
        .max()
        .unwrap_or(0);
    format!("S{}", max + 1)
}

/// Read-modify-write the registry with `edit` applied to the entry whose
/// `id` matches (appending it when absent). Atomic temp+rename, so a
/// concurrent reader never sees a torn file and a kill mid-write leaves
/// either the old file or the new one.
pub fn upsert(project_dir: &Path, entry: SessionEntry) -> io::Result<()> {
    let mut file = load(project_dir);
    match file.sessions.iter_mut().find(|s| s.id == entry.id) {
        Some(existing) => *existing = entry,
        None => file.sessions.push(entry),
    }
    let json = serde_json::to_vec_pretty(&file)
        .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err))?;
    write_atomic(&sessions_path(project_dir), &json)
}

/// The in-flight planner session for this project, if the registry
/// remembers one (§4's `resumeAvailable` — T-029 renders the choice).
pub fn find_planner(file: &SessionsFile) -> Option<&SessionEntry> {
    file.sessions
        .iter()
        .find(|s| s.roles.iter().any(|r| r == "planner") && s.status != "dead")
}

/// One protocol half-turn, appended to `transcript.jsonl`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscriptLine {
    pub turn: u32,
    /// `"user"` or `"planner"`.
    pub role: String,
    pub text: String,
    pub at_ms: u64,
}

/// Append one half-turn. Deltas are NEVER cached here — only the final
/// texts, capped. Append-only and best-effort: a transcript write that
/// fails degrades the chat rehydration T-027 will build, never the turn.
pub fn append_transcript(project_dir: &Path, line: &TranscriptLine) -> io::Result<()> {
    let path = transcript_path(project_dir);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let mut capped = line.clone();
    if capped.text.len() > TRANSCRIPT_TEXT_CAP {
        capped.text = truncate_utf8(&capped.text, TRANSCRIPT_TEXT_CAP);
    }
    let mut json = serde_json::to_vec(&capped)
        .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err))?;
    json.push(b'\n');
    let mut handle = fs::OpenOptions::new().create(true).append(true).open(&path)?;
    handle.write_all(&json)
}

/// Read the transcript back (T-027's rehydration; here it is the test's
/// assertion channel). Unparseable lines are skipped, never fatal.
pub fn read_transcript(project_dir: &Path) -> Vec<TranscriptLine> {
    let Ok(raw) = fs::read_to_string(transcript_path(project_dir)) else {
        return Vec::new();
    };
    raw.lines()
        .filter(|l| !l.trim().is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect()
}

/// Truncate to at most `max` BYTES without splitting a UTF-8 boundary.
pub fn truncate_utf8(text: &str, max: usize) -> String {
    if text.len() <= max {
        return text.to_string();
    }
    let mut end = max;
    while end > 0 && !text.is_char_boundary(end) {
        end -= 1;
    }
    text[..end].to_string()
}

// ---- the hand-rolled ISO-8601 formatter (§9: no chrono) ----------------

const DAYS_IN_MONTH: [u64; 12] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

fn is_leap(year: u64) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

/// Format epoch milliseconds as `YYYY-MM-DDTHH:MM:SSZ` (UTC).
///
/// Civil-from-days by the ordinary proleptic-Gregorian walk: cheap,
/// obvious, and unit-tested against known epochs and every leap-year
/// edge below. Buying `chrono` for this would be a new external crate for
/// twenty lines (§9's zero-new-crates fence).
pub fn iso8601_utc(epoch_ms: u64) -> String {
    let total_secs = epoch_ms / 1000;
    let mut days = total_secs / 86_400;
    let secs_of_day = total_secs % 86_400;

    let mut year = 1970u64;
    loop {
        let len = if is_leap(year) { 366 } else { 365 };
        if days < len {
            break;
        }
        days -= len;
        year += 1;
    }
    let mut month = 0usize;
    loop {
        let mut len = DAYS_IN_MONTH[month];
        if month == 1 && is_leap(year) {
            len += 1;
        }
        if days < len {
            break;
        }
        days -= len;
        month += 1;
    }
    format!(
        "{year:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        month + 1,
        days + 1,
        secs_of_day / 3600,
        (secs_of_day % 3600) / 60,
        secs_of_day % 60
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct TempTree(PathBuf);
    impl TempTree {
        fn new(tag: &str) -> Self {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_millis())
                .unwrap_or(0);
            let dir = std::env::temp_dir().join(format!(
                "nputer-t025-sess-{}-{}-{}",
                tag,
                std::process::id(),
                now
            ));
            fs::create_dir_all(&dir).expect("mk temp");
            Self(dir)
        }
    }
    impl Drop for TempTree {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn entry(id: &str) -> SessionEntry {
        SessionEntry {
            id: id.into(),
            agent: "claude".into(),
            model: Some("claude-opus-5".into()),
            native_session_id: Some("abc-123".into()),
            created: iso8601_utc(1_755_000_000_000),
            turns: 0,
            tasks: vec![],
            roles: vec!["planner".into()],
            status: "running".into(),
        }
    }

    /// The registry file is byte-checkable against the schema's field
    /// set: every documented key present, spelled as the schema spells it.
    #[test]
    fn the_written_registry_matches_the_sessions_schema_field_for_field() {
        let t = TempTree::new("schema");
        upsert(&t.0, entry("S1")).expect("upsert");

        let raw = fs::read_to_string(sessions_path(&t.0)).expect("sessions.json");
        let value: serde_json::Value = serde_json::from_str(&raw).expect("parses");
        let session = &value["sessions"][0];
        for key in [
            "id",
            "agent",
            "model",
            "native_session_id",
            "created",
            "turns",
            "tasks",
            "roles",
            "status",
        ] {
            assert!(
                session.get(key).is_some(),
                "method/runtime/sessions-schema.md names `{key}`; the written entry lacks it"
            );
        }
        assert_eq!(session["id"], "S1");
        assert_eq!(session["agent"], "claude");
        assert_eq!(session["roles"], serde_json::json!(["planner"]));
        assert_eq!(session["tasks"], serde_json::json!([]));
        assert_eq!(session["turns"], 0);
        // No key the schema does not name (a runtime file is small on purpose).
        let keys: Vec<&String> = session.as_object().expect("object").keys().collect();
        assert_eq!(keys.len(), 9, "unexpected extra keys: {keys:?}");
    }

    #[test]
    fn upsert_replaces_in_place_and_appends_new_ids() {
        let t = TempTree::new("upsert");
        upsert(&t.0, entry("S1")).expect("first");
        let mut second = entry("S1");
        second.turns = 4;
        second.status = "idle".into();
        upsert(&t.0, second).expect("second");
        upsert(&t.0, entry("S2")).expect("third");

        let file = load(&t.0);
        assert_eq!(file.sessions.len(), 2);
        assert_eq!(file.sessions[0].turns, 4);
        assert_eq!(file.sessions[0].status, "idle");
        assert_eq!(file.sessions[1].id, "S2");
        assert_eq!(next_id(&file), "S3");
    }

    #[test]
    fn next_id_is_max_plus_one_even_with_gaps_and_foreign_ids() {
        let mut file = SessionsFile::default();
        assert_eq!(next_id(&file), "S1");
        file.sessions.push(entry("S7"));
        file.sessions.push(entry("S2"));
        file.sessions.push(SessionEntry { id: "weird".into(), ..entry("S1") });
        assert_eq!(next_id(&file), "S8");
    }

    /// THE READ BOUNDARY (T-039 criterion 3). A registry file is a losable
    /// runtime file in the user's project directory: it parses as JSON and
    /// is still not trusted. An id that would parse as a FLAG is refused on
    /// the way out — loudly, with the reason named — and the entry is
    /// neither dropped nor rewritten (nothing here destroys a file the user
    /// may want to look at).
    #[test]
    fn a_session_id_read_back_out_of_the_registry_is_validated() {
        let t = TempTree::new("readgate");
        let path = sessions_path(&t.0);
        fs::create_dir_all(path.parent().expect("parent")).expect("mkdir");
        fs::write(
            &path,
            serde_json::json!({
                "sessions": [{
                    "id": "S1",
                    "agent": "claude",
                    "model": "claude-sonnet-5",
                    // The T-025 verifier's exact injection, planted in a
                    // file rather than in a stream — T-029's threat model.
                    "native_session_id": "--dangerously-skip-permissions",
                    "created": "2026-08-16T09:20:02Z",
                    "turns": 3,
                    "tasks": [],
                    "roles": ["planner"],
                    "status": "idle"
                }]
            })
            .to_string(),
        )
        .expect("write hostile registry");

        let file = load(&t.0);
        let planner = find_planner(&file).expect("the entry is found, not silently dropped");
        assert_eq!(
            planner.resume_id(),
            Err(super::super::adapter::SessionIdRejection::LeadingDash),
            "a '-'-leading id must not survive the read boundary"
        );
        // The file itself is untouched: refusing to resume is not a licence
        // to rewrite the user's runtime state.
        assert!(path.exists());
        assert!(fs::read_to_string(&path).expect("still there").contains("--dangerously"));

        // Other file-borne shapes, each named.
        for (id, expected) in [
            ("../../../etc/passwd", SessionIdRejection::IllegalStart { ch: '.' }),
            ("ok\0--dangerously-skip-permissions", SessionIdRejection::IllegalChar { at: 2, ch: '\0' }),
            ("has space", SessionIdRejection::IllegalChar { at: 3, ch: ' ' }),
            ("", SessionIdRejection::Empty),
        ] {
            let entry = SessionEntry { native_session_id: Some(id.into()), ..entry("S1") };
            assert_eq!(entry.resume_id(), Err(expected), "registry-borne id {id:?}");
        }

        // …and the shapes that ARE ids come back untouched.
        let good = SessionEntry {
            native_session_id: Some("e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77".into()),
            ..entry("S1")
        };
        assert_eq!(good.resume_id(), Ok(Some("e7954de6-2ac1-4b62-9f0b-8c0d5b3a1e77")));
        let none = SessionEntry { native_session_id: None, ..entry("S1") };
        assert_eq!(none.resume_id(), Ok(None), "no id recorded is not an error");
    }

    /// The corrupt-registry drill (§10 obligation 8): garbage in, renamed
    /// aside, fresh registry, nothing destroyed.
    #[test]
    fn a_corrupt_registry_is_moved_aside_not_destroyed() {
        let t = TempTree::new("corrupt");
        let path = sessions_path(&t.0);
        fs::create_dir_all(path.parent().expect("parent")).expect("mkdir");
        fs::write(&path, "{ this is not json at all").expect("write garbage");

        let loaded = load(&t.0);
        assert!(loaded.sessions.is_empty(), "a fresh registry starts");
        let aside = path.with_extension("json.corrupt");
        assert!(aside.exists(), "the unparseable bytes are kept, not deleted");
        assert_eq!(
            fs::read_to_string(&aside).expect("read aside"),
            "{ this is not json at all"
        );
        assert!(!path.exists(), "the corrupt file no longer occupies the real path");

        // And the next write starts clean.
        upsert(&t.0, entry("S1")).expect("upsert after corruption");
        assert_eq!(load(&t.0).sessions.len(), 1);
    }

    #[test]
    fn transcript_appends_one_line_per_half_turn_and_caps_text() {
        let t = TempTree::new("transcript");
        append_transcript(
            &t.0,
            &TranscriptLine { turn: 1, role: "user".into(), text: "hello".into(), at_ms: 7 },
        )
        .expect("user line");
        append_transcript(
            &t.0,
            &TranscriptLine { turn: 1, role: "planner".into(), text: "hi".into(), at_ms: 9 },
        )
        .expect("planner line");

        let lines = read_transcript(&t.0);
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0].role, "user");
        assert_eq!(lines[1].role, "planner");
        assert_eq!(lines[1].at_ms, 9);

        // camelCase on the wire (the store mirrors it).
        let raw = fs::read_to_string(transcript_path(&t.0)).expect("jsonl");
        assert!(raw.lines().all(|l| l.contains("\"atMs\"")), "{raw}");

        // Cap: a huge planner turn is truncated, never dropped.
        let huge = "x".repeat(TRANSCRIPT_TEXT_CAP + 5_000);
        append_transcript(
            &t.0,
            &TranscriptLine { turn: 2, role: "planner".into(), text: huge, at_ms: 11 },
        )
        .expect("huge line");
        let lines = read_transcript(&t.0);
        assert_eq!(lines.len(), 3);
        assert_eq!(lines[2].text.len(), TRANSCRIPT_TEXT_CAP);
    }

    #[test]
    fn truncate_never_splits_a_utf8_boundary() {
        let text = "é".repeat(10); // 2 bytes each
        let cut = truncate_utf8(&text, 5);
        assert_eq!(cut.len(), 4, "backs off to the boundary");
        assert!(cut.chars().all(|c| c == 'é'));
        assert_eq!(truncate_utf8("abc", 99), "abc");
    }

    #[test]
    fn iso8601_formats_known_epochs_including_leap_edges() {
        assert_eq!(iso8601_utc(0), "1970-01-01T00:00:00Z");
        assert_eq!(iso8601_utc(1_000), "1970-01-01T00:00:01Z");
        // Cross-checked against `date -u -r <secs>` for each of these.
        assert_eq!(iso8601_utc(1_776_342_896_000), "2026-04-16T12:34:56Z");
        // Leap day 2024-02-29T23:59:59Z = 1709251199
        assert_eq!(iso8601_utc(1_709_251_199_000), "2024-02-29T23:59:59Z");
        // The day after: 2024-03-01T00:00:00Z
        assert_eq!(iso8601_utc(1_709_251_200_000), "2024-03-01T00:00:00Z");
        // 2000 IS a leap year (the %400 rule): 2000-02-29T00:00:00Z = 951782400
        assert_eq!(iso8601_utc(951_782_400_000), "2000-02-29T00:00:00Z");
        // 2100 is NOT (the %100 rule): 2100-03-01T00:00:00Z = 4107542400
        assert_eq!(iso8601_utc(4_107_542_400_000), "2100-03-01T00:00:00Z");
        // Sub-second input truncates rather than rounding.
        assert_eq!(iso8601_utc(1_999), "1970-01-01T00:00:01Z");
        // Every output is a fixed-width, sortable stamp.
        assert_eq!(iso8601_utc(0).len(), 20);
    }
}
