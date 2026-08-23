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
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use super::adapter::{validate_model, validate_session_id, ModelRejection, SessionIdRejection};
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

    /// THE MODEL'S READ BOUNDARY (T-029, folding T-047-s3), mirroring
    /// what [`Self::resume_id`] gives the id.
    ///
    /// T-047 validated the model at the CAPTURE boundary and left the READ
    /// side raw — the exact asymmetry T-039's criterion 3 was written
    /// about, and every word of its argument for the id applies here: this
    /// is a losable runtime file in the user's project directory, writable
    /// by anything with disk access. A registry written by a pre-T-047
    /// build can hold ~1 MiB of `model` (measured at T-047: 200,290 bytes
    /// of `sessions.json` from a 200,000-byte model), and upgrading does
    /// not clean it.
    ///
    /// **UNLIKE THE ID'S, A REJECTION HERE REFUSES NOTHING.** There is
    /// nothing to refuse — the session is fine, only the recorded name of
    /// what ran is unusable — so the caller renders "model not recorded"
    /// and says so once in a log line. Throwing away a resumable interview
    /// over a cosmetic field would be a worse failure than the one being
    /// prevented, which is the same reasoning `run_turn`'s capture-side
    /// gate already records.
    ///
    /// `Ok(None)` = no model recorded (not an error).
    pub fn display_model(&self) -> Result<Option<&str>, ModelRejection> {
        match self.model.as_deref() {
            None => Ok(None),
            Some(model) => validate_model(model).map(|()| Some(model)),
        }
    }

    /// The accessor's own answer, already logged: `Some(name)` when the
    /// registry holds a usable one, `None` otherwise. THE ONE CALL every
    /// renderer should use — reading `.model` raw is the bug this exists
    /// to make avoidable.
    pub fn model_for_display(&self) -> Option<String> {
        match self.display_model() {
            Ok(model) => model.map(str::to_string),
            Err(rejection) => {
                println!(
                    "[nputer] agent: session '{}' in {SESSIONS_REL} records an unusable model name ({rejection}) - showing it as not recorded",
                    truncate_utf8(&self.id, 32).escape_debug()
                );
                None
            }
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

/// THE FACT THAT "AN INTERVIEW WAS RUNNING ON <FOLDER>", and the ONE
/// place it lives (T-029 criterion, folding T-026-s3).
///
/// It is derived — never separately written — from the planner entry in
/// `.nputer/sessions.json`, which is runtime state in the user's own
/// project directory and losable by charter. **It is never written to
/// `docs/`**, which stays project truth: a folder whose `.nputer/` is
/// deleted has lost the ability to RESUME a native session and has lost
/// no fact about the project.
///
/// T-022 (the persisted view-state seam) consumes THIS rather than
/// inventing a second mechanism — which is the whole of T-026-s3. A
/// second home for the same fact is a second thing to keep true, and the
/// two would disagree the first time a user deleted one of them.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenesisRecord {
    /// The registry id (`"S1"`), not the CLI's native one.
    pub registry_id: String,
    pub turns: u64,
    pub status: String,
    pub created: String,
    /// Through [`SessionEntry::resume_id`] — `None` when there is no id
    /// or the recorded one is unusable, so a caller cannot resume from a
    /// value this boundary refused.
    pub native_session_id: Option<String>,
    /// Through [`SessionEntry::model_for_display`] — `None` also means
    /// "recorded, but not a usable name" (T-047-s3).
    pub model: Option<String>,
    /// Whether the recorded id was REFUSED, as opposed to absent. The
    /// difference is the whole of the affordance: "start fresh, your
    /// saved session is unusable" against "start fresh, there is nothing
    /// saved".
    pub session_id_rejected: Option<String>,
}

/// Read the one place. `None` = no interview was ever running here (or
/// the session was explicitly abandoned — `status: "dead"`).
pub fn genesis_record(project_dir: &Path) -> Option<GenesisRecord> {
    let file = load(project_dir);
    let entry = find_planner(&file)?;
    let (native_session_id, session_id_rejected) = match entry.resume_id() {
        Ok(id) => (id.map(str::to_string), None),
        Err(rejection) => (None, Some(rejection.to_string())),
    };
    Some(GenesisRecord {
        registry_id: entry.id.clone(),
        turns: entry.turns,
        status: entry.status.clone(),
        created: entry.created.clone(),
        native_session_id,
        model: entry.model_for_display(),
        session_id_rejected,
    })
}

/// Mark the recorded planner session ABANDONED — `status: "dead"`, which
/// `find_planner` skips, so the next start is a fresh one.
///
/// The method's own words (`method/runtime/sessions-schema.md`): "Killing
/// a session = mark status dead; the project resumes from docs/." Nothing
/// is deleted: the entry stays readable, and `docs/` — the only thing
/// that was ever project truth — is not touched at all.
pub fn mark_planner_dead(project_dir: &Path) -> io::Result<Option<String>> {
    let mut file = load(project_dir);
    let Some(entry) = file
        .sessions
        .iter_mut()
        .find(|s| s.roles.iter().any(|r| r == "planner") && s.status != "dead")
    else {
        return Ok(None);
    };
    entry.status = "dead".to_string();
    let id = entry.id.clone();
    let json = serde_json::to_vec_pretty(&file)
        .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err))?;
    write_atomic(&sessions_path(project_dir), &json)?;
    Ok(Some(id))
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
    /// T-029: this half-turn was ASSEMBLED BY THE APP, not typed by the
    /// human — a kickoff, or a resume nudge.
    ///
    /// It rides `role: "user"` because it genuinely is the user half of
    /// the protocol (the planner is answering it), and the transcript
    /// stays a complete protocol record. But a rehydrated chat must not
    /// draw "You are the planner. KIT ROOT: …" in the user's own bubble,
    /// and the alternative — recognising machine text by reading it — is
    /// exactly the classify-by-string this project bans everywhere else.
    /// So it is a TYPED FIELD.
    ///
    /// `default` on read, omitted on write when false: a transcript from
    /// a pre-T-029 build parses unchanged, and its turn-1 kickoff is
    /// already skipped by the chat's own `turn >= 2` rule.
    #[serde(default, skip_serializing_if = "std::ops::Not::not")]
    pub machine: bool,
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

/// Read the WHOLE transcript back. **No production caller since T-070**
/// — [`read_transcript_tail`] is what the rehydration command uses, and
/// `agent::transcript` is its only caller.
///
/// This one survives as the TESTS' assertion channel: a body that wants
/// "everything that was ever appended" wants exactly this, and answering
/// it with a budgeted reader would be a test parametrised by the bound it
/// is checking. Unparseable lines are skipped, never fatal.
///
/// IT IS UNBOUNDED BY CONSTRUCTION and that is why it is named here
/// rather than left to be re-discovered: `fs::read_to_string` costs the
/// file, and the file is append-only with nothing rotating it. Putting it
/// back on an arrival path is the defect T-070 closed, and
/// `the_arrival_read_is_bounded_by_the_budget_and_not_by_the_file` in
/// `tests/agent_runner.rs` is what reds if anyone does — its fixture
/// opens with bytes this function cannot decode at all.
pub fn read_transcript(project_dir: &Path) -> Vec<TranscriptLine> {
    let Ok(raw) = fs::read_to_string(transcript_path(project_dir)) else {
        return Vec::new();
    };
    raw.lines()
        .filter(|l| !l.trim().is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect()
}

/// How much of a file's END one backward step pulls in (T-070).
///
/// It is a STEP SIZE, never a bound: a single half-turn may be up to
/// [`TRANSCRIPT_TEXT_CAP`] (256 KiB), four times this, so a chunk is not
/// promised to hold even one line and the loop simply takes another step.
/// What the size buys is the constant: the tail read costs the bytes of
/// the lines it returns, plus at most one step of overshoot.
const TAIL_CHUNK: usize = 64 * 1024;

/// THE BOUND, AT THE READ (T-070 criterion 1).
///
/// Read at most `max_lines` lines from the END of `src`, seeking backward
/// in [`TAIL_CHUNK`] steps and stopping the moment the buffer holds one
/// more newline than the budget. **Nothing before that point is ever
/// pulled through `src`** — which is the property, and the reason this
/// takes a `Read + Seek` rather than a path: a caller can wrap the file
/// in a counting reader and MEASURE what the read cost, instead of
/// trusting a figure this function reports about itself.
///
/// The first segment of the buffer is dropped unless the walk reached
/// byte 0, because a backward step lands mid-line far more often than
/// not. Returned raw, newest last, in the file's own order.
fn tail_lines<R: Read + Seek>(src: &mut R, max_lines: usize) -> io::Result<Vec<String>> {
    if max_lines == 0 {
        return Ok(Vec::new());
    }
    let mut pos = src.seek(SeekFrom::End(0))?;
    let mut buf: Vec<u8> = Vec::new();
    let mut newlines = 0usize;
    while pos > 0 && newlines <= max_lines {
        let step = std::cmp::min(TAIL_CHUNK as u64, pos);
        pos -= step;
        src.seek(SeekFrom::Start(pos))?;
        // `step` is at most TAIL_CHUNK, so the cast cannot lose bits.
        let mut chunk = vec![0u8; step as usize];
        src.read_exact(&mut chunk)?;
        newlines += chunk.iter().filter(|byte| **byte == b'\n').count();
        chunk.extend_from_slice(&buf);
        buf = chunk;
    }
    // LOSSY, and deliberately: a backward step may land inside a
    // multi-byte character, and the segment that split is the one dropped
    // below anyway. A strict decode would fail the whole read over a
    // boundary the caller never asked about — and would re-introduce
    // exactly the whole-file dependency this function exists to remove.
    let text = String::from_utf8_lossy(&buf);
    let mut segments: Vec<&str> = text.split('\n').collect();
    if pos > 0 && !segments.is_empty() {
        segments.remove(0);
    }
    let mut kept: Vec<String> = Vec::new();
    for segment in segments.iter().rev() {
        if kept.len() == max_lines {
            break;
        }
        if segment.trim().is_empty() {
            continue;
        }
        kept.push((*segment).to_string());
    }
    kept.reverse();
    Ok(kept)
}

/// The rehydration's read: at most `max_lines` half-turns off the END of
/// `transcript.jsonl`, costing the tail rather than the file (T-070).
///
/// LOSABLE BY CHARTER, unchanged: a missing file, an unreadable file and
/// a file of pure garbage all answer the same empty vector. So does a
/// budget of zero. Unparseable lines inside the tail are skipped exactly
/// as [`read_transcript`] skips them — the budget is on LINES READ, which
/// is what bounds the read, so a tail full of garbage answers with fewer
/// than `max_lines` entries rather than reaching further back for more.
pub fn read_transcript_tail(project_dir: &Path, max_lines: usize) -> Vec<TranscriptLine> {
    let Ok(mut file) = fs::File::open(transcript_path(project_dir)) else {
        return Vec::new();
    };
    let Ok(raw) = tail_lines(&mut file, max_lines) else {
        return Vec::new();
    };
    raw.iter().filter_map(|line| serde_json::from_str(line).ok()).collect()
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
            &TranscriptLine {
                turn: 1,
                role: "user".into(),
                text: "hello".into(),
                at_ms: 7,
                machine: false,
            },
        )
        .expect("user line");
        append_transcript(
            &t.0,
            &TranscriptLine {
                turn: 1,
                role: "planner".into(),
                text: "hi".into(),
                at_ms: 9,
                machine: false,
            },
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
            &TranscriptLine {
                turn: 2,
                role: "planner".into(),
                text: huge,
                at_ms: 11,
                machine: false,
            },
        )
        .expect("huge line");
        let lines = read_transcript(&t.0);
        assert_eq!(lines.len(), 3);
        assert_eq!(lines[2].text.len(), TRANSCRIPT_TEXT_CAP);
    }

    /// A `Read + Seek` that COUNTS the bytes actually pulled through it.
    ///
    /// THE MEASUREMENT BELONGS TO THE TEST, never to the code under test.
    /// A byte figure the reader reports about itself is a test
    /// parametrised by the constant it checks (CONVENTIONS' sibling rule
    /// to the positive control): the whole-file implementation would
    /// report `file_len` honestly today and could be made to report
    /// anything tomorrow. Counting at the `Read` impl makes the cost an
    /// observation rather than a claim.
    struct Counting<R> {
        inner: R,
        read: u64,
    }
    impl<R: Read> Read for Counting<R> {
        fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
            let got = self.inner.read(buf)?;
            self.read += got as u64;
            Ok(got)
        }
    }
    impl<R: Seek> Seek for Counting<R> {
        fn seek(&mut self, pos: SeekFrom) -> io::Result<u64> {
            self.inner.seek(pos)
        }
    }

    /// T-070 CRITERION 2 — BOUNDED BY CONSTRUCTION, NOT BY THE FIXTURE.
    ///
    /// The transcript here exceeds the rehydration budget by a wide
    /// margin in BOTH dimensions — 40x the lines and 40x the bytes — and
    /// the read has to cost the tail rather than the file. Every content
    /// assertion below is satisfied EQUALLY by an implementation that
    /// slurps the whole file and truncates afterwards; the byte count is
    /// the only one that separates them, which is exactly why the
    /// criterion is worded the way it is.
    #[test]
    fn the_tail_read_costs_the_budget_and_not_the_file() {
        const BUDGET: usize = 200;
        const LINES: usize = 10_000;
        let t = TempTree::new("tailcost");
        let path = transcript_path(&t.0);
        fs::create_dir_all(path.parent().expect("parent")).expect("mk .nputer/genesis");

        // Built here rather than through `append_transcript` so the test
        // owns the byte offsets it is about to assert against.
        let mut content = String::new();
        let mut starts: Vec<usize> = Vec::with_capacity(LINES);
        for turn in 1..=LINES {
            starts.push(content.len());
            let line = TranscriptLine {
                turn: turn as u32,
                role: if turn % 2 == 0 { "planner".into() } else { "user".into() },
                text: format!("turn {turn} {}", "z".repeat(2_000)),
                at_ms: turn as u64,
                machine: false,
            };
            content.push_str(&serde_json::to_string(&line).expect("encode"));
            content.push('\n');
        }
        fs::write(&path, &content).expect("write the transcript");

        let file_len = content.len() as u64;
        let tail_bytes = (content.len() - starts[LINES - BUDGET]) as u64;
        assert!(LINES >= 40 * BUDGET, "the fixture must exceed the budget in LINES");
        assert!(file_len >= 40 * tail_bytes, "…and in BYTES: {file_len} against {tail_bytes}");

        let mut src = Counting { inner: fs::File::open(&path).expect("open"), read: 0 };
        let tail = tail_lines(&mut src, BUDGET).expect("tail");

        // It is the RIGHT tail, in the file's own order…
        assert_eq!(tail.len(), BUDGET);
        let first: TranscriptLine = serde_json::from_str(&tail[0]).expect("first parses");
        let last: TranscriptLine = serde_json::from_str(&tail[BUDGET - 1]).expect("last parses");
        assert_eq!(first.turn, (LINES - BUDGET + 1) as u32);
        assert_eq!(last.turn, LINES as u32);

        // …and it cost the tail plus at most the overshoot the algorithm
        // is allowed: the step that crossed the budget's newline, and the
        // line that newline terminates.
        let ceiling = tail_bytes + 2 * TAIL_CHUNK as u64;
        assert!(src.read <= ceiling, "read {} bytes, ceiling {ceiling}", src.read);
        // THE DISCRIMINATING ASSERTION. A reader that pulls the whole
        // file and truncates afterwards returns the same 200 lines and
        // satisfies everything above; it lands at `file_len` and fails
        // here. This line is the difference between bounded by
        // construction and bounded by the fixture.
        assert!(src.read * 20 <= file_len, "read {} of {file_len} bytes", src.read);
    }

    /// The tail read answers what the whole-file read would have KEPT —
    /// the budget changes the cost, not the content.
    #[test]
    fn the_tail_read_answers_what_the_whole_file_read_would_have_kept() {
        let t = TempTree::new("tailsame");
        for turn in 1..=25u32 {
            append_transcript(
                &t.0,
                &TranscriptLine {
                    turn,
                    role: if turn % 2 == 0 { "planner".into() } else { "user".into() },
                    text: format!("turn {turn}"),
                    at_ms: u64::from(turn),
                    machine: turn % 3 == 0,
                },
            )
            .expect("append");
        }
        let whole = read_transcript(&t.0);
        assert_eq!(whole.len(), 25);

        for budget in [1usize, 7, 25, 40] {
            let kept = std::cmp::min(budget, whole.len());
            let tail = read_transcript_tail(&t.0, budget);
            assert_eq!(tail.len(), kept, "budget {budget}");
            assert_eq!(tail, whole[whole.len() - kept..], "budget {budget}");
        }

        // A budget of zero reads nothing and answers nothing.
        assert!(read_transcript_tail(&t.0, 0).is_empty());
        // A missing file is the losable-by-charter answer, never an error.
        let gone = TempTree::new("tailmissing");
        assert!(read_transcript_tail(&gone.0, 200).is_empty());

        // AND THE ONE PLACE THE TWO READERS DISAGREE, stated rather than
        // discovered: an unparseable line inside the tail is skipped by
        // both, but the budgeted reader does not reach FURTHER BACK to
        // make up the shortfall. That is the price of bounding the read.
        let mut handle = fs::OpenOptions::new()
            .append(true)
            .open(transcript_path(&t.0))
            .expect("reopen");
        handle.write_all(b"not json at all\n").expect("append garbage");
        drop(handle);
        assert_eq!(read_transcript(&t.0).len(), 25, "the whole-file read still keeps 25");
        let tail = read_transcript_tail(&t.0, 3);
        assert_eq!(tail.len(), 2, "three lines READ, two of them parseable");
        assert_eq!(tail[0].turn, 24);
        assert_eq!(tail[1].turn, 25);
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
