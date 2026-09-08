//! T-025 §5: the session registry and the transcript — both runtime
//! files under `.supertaskr/`, both losable by charter (ADR-017 clause 4).
//!
//! `docs/` is the only project truth; nothing here is. Losing
//! `sessions.json` loses the ability to RESUME a native CLI session;
//! losing `transcript.jsonl` loses a chat rehydration. Neither loses a
//! fact about the project, which is why both may be overwritten,
//! renamed-aside on corruption, and killed mid-write without ceremony.
//!
//! Field-for-field per `method/runtime/sessions-schema.md`, and that
//! sentence is MECHANICAL rather than aspirational since T-167-s1:
//! [`tests::the_written_registry_matches_the_sessions_schema_field_for_field`]
//! parses that document's own JSON example off disk and compares it with a
//! written entry BOTH WAYS — nothing the schema names may be missing, and
//! nothing written here may be unnamed there. It used to walk one
//! direction against a transcribed list of nine keys, which is how a tenth
//! key went unnoticed: a transcription is a second implementation of the
//! field set, and the two disagree in silence.
//!
//! **AND THE SAME NOW HOLDS FOR THE OTHER HALF OF THE PAIR** (T-167-s9,
//! repairing the asymmetry T-167-s1 left): `transcript.jsonl` has its own
//! page, `method/runtime/transcript-schema.md`, and
//! [`tests::the_written_transcript_matches_the_transcript_schema_field_for_field`]
//! reads it the same way, over BOTH the machine-assembled line and the
//! typed one — the second being the arm no single fixture can see, since
//! `machine` is skipped on write when false.

use std::fs;
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use super::adapter::{validate_model, validate_session_id, ModelRejection, SessionIdRejection};
use super::kit::write_atomic;

/// `.supertaskr/sessions.json`, relative to the project root.
pub const SESSIONS_REL: &str = ".supertaskr/sessions.json";
/// `.supertaskr/genesis/transcript.jsonl`, relative to the project root.
pub const TRANSCRIPT_REL: &str = ".supertaskr/genesis/transcript.jsonl";
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
    /// Incremented per COMPLETED exchange; drives supertaskr.yaml's
    /// warn_after_turns sediment warning.
    pub turns: u64,
    pub tasks: Vec<String>,
    pub roles: Vec<String>,
    /// `running` during a turn, `idle` between and after a cancel (the
    /// kill is of the TURN; the native session stays resume-eligible),
    /// `dead` reserved for explicit abandonment (T-029's fresh-session
    /// choice) — never written by this task.
    pub status: String,
    /// T-167: WHICH ORGANIZATION SKILL PACKS SHAPED THIS SESSION, by name
    /// and content hash — "which policy shaped this decision" answerable
    /// later from files alone.
    ///
    /// **IT IS SKIPPED WHEN EMPTY, AND THAT IS LOAD-BEARING TWICE.** A
    /// genesis with no packs writes the same nine keys it always wrote, so
    /// T-167's byte-identity criterion holds at the FILE and not only in
    /// the prompt, and an entry written before this field existed reads
    /// back unchanged. The schema document states the rule in its own
    /// words, and the pin now checks the packless entry against it rather
    /// than against a count.
    ///
    /// **THE CONFLICT THIS FIELD CARRIED IS CLOSED (T-167-s1), AND IS KEPT
    /// HERE BECAUSE THE MECHANISM THAT HID IT IS THE LESSON.** T-167
    /// recorded it rather than papering over it: the schema named nine
    /// keys, this module claimed "field-for-field per" it, and a populated
    /// `skills` was a tenth the document did not name. It could not RED —
    /// the field is skipped when empty, so the only fixture the pin had
    /// wrote nine keys, and the pin walked the schema's side only. **A
    /// disagreement that no fixture can reach is not a weak test, it is an
    /// absent one.** The document now names the key; the pin derives its
    /// key set FROM the document and checks both directions over a fixture
    /// that loads a pack.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub skills: Vec<super::skills::SkillPack>,
}

impl SessionEntry {
    /// THE REGISTRY READ BOUNDARY (T-039 criterion 3).
    ///
    /// `native_session_id` is a value that came off a stream once and has
    /// been sitting in a FILE ever since — `.supertaskr/sessions.json`, in the
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
                    "[supertaskr] agent: session '{}' in {SESSIONS_REL} records an unusable model name ({rejection}) - showing it as not recorded",
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
                    "[supertaskr] agent: {} did not parse ({err}) - moved to {} and starting a fresh registry",
                    path.display(),
                    aside.display()
                ),
                Err(rename_err) => eprintln!(
                    "[supertaskr] agent: {} did not parse ({err}) and could not be moved aside ({rename_err}) - starting a fresh registry in memory",
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
/// `.supertaskr/sessions.json`, which is runtime state in the user's own
/// project directory and losable by charter. **It is never written to
/// `docs/`**, which stays project truth: a folder whose `.supertaskr/` is
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

/// CAN WE GET BACK INTO AN INTERVIEW ON THIS FOLDER? (T-123, REBUILT.)
///
/// **THE FIRST PASS OF T-123 ASKED THE WRONG QUESTION AND A VERIFIER
/// CAUGHT IT.** It asked *"is one of our interviews registered here?"* —
/// `genesis_record(..).is_some()` — and routed every folder that answered
/// yes to the genesis screen. But [`genesis_record`] answers `Some` for
/// ANY non-dead planner entry, including two that cannot be resumed at
/// all: one with no `native_session_id` recorded, and one whose recorded
/// id [`SessionEntry::resume_id`]'s T-039 boundary REFUSES. For those two,
/// the screen the routing sent the user to has no resume offer on it and
/// nothing else that can succeed — a dead end newly created by the change
/// that existed to remove one (T-050). Measured through the real
/// `apply_genesis_pick`, both shapes routed to genesis.
///
/// So the routing predicate means RESUMABLE, not PRESENT, and this type
/// says which of the three states a folder is in rather than collapsing
/// two of them into one `false`. **The collapse is what let the defect
/// through**: a bool cannot tell a REFUSAL from an ABSENCE, and CONVENTIONS'
/// A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL is precisely the rule
/// that a refusal must be shown to differ from an absence. Two values that
/// are literally the same value cannot be shown to differ by any test.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GenesisReachability {
    /// Nothing of ours is here: no registry file, no planner entry, or a
    /// planner entry the user explicitly abandoned (`status: "dead"`,
    /// which [`find_planner`] skips). A registry that does not parse is
    /// renamed aside by [`load`] and lands here too, which is the
    /// losable-by-charter direction: it costs a resume offer, never a fact
    /// about the project.
    NoSession,
    /// A planner entry IS registered and there is no way back into it —
    /// no id was ever recorded, or the recorded one was refused on the way
    /// out of the file. **Not a way in, so not a reason to route to the
    /// interview screen.** The folder's plan is on disk and the board is
    /// the honest destination for it.
    NotResumable,
    /// A planner entry with an id [`SessionEntry::resume_id`] accepted.
    /// THIS is the state the card was written for: the interview that
    /// banked stage 0 thirty seconds ago and can be picked back up.
    Resumable,
}

/// THE CLASSIFICATION, over a record already in hand. ONE implementation
/// (T-057), so a caller that has read the registry for another reason —
/// `resume_genesis` and `start_genesis` both have — spends that one read
/// on the routing question too instead of opening the file twice. Two
/// reads of a losable file are two chances to disagree about it.
pub fn reachability_of(record: Option<&GenesisRecord>) -> GenesisReachability {
    match record {
        None => GenesisReachability::NoSession,
        Some(record) if record.native_session_id.is_some() => GenesisReachability::Resumable,
        Some(_) => GenesisReachability::NotResumable,
    }
}

/// [`reachability_of`] over the ONE place the fact lives, for a caller
/// that wants the routing answer and nothing else. C-05's `docs_watch`
/// asks THIS rather than statting `.supertaskr/` or re-parsing that JSON
/// itself: a rule with two implementations is two chances to disagree
/// (T-057).
pub fn genesis_reachability(project_dir: &Path) -> GenesisReachability {
    reachability_of(genesis_record(project_dir).as_ref())
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
/// What the size buys is the CONSTANT in the bound: the tail read costs
/// the bytes of the lines it returns, plus the one line that carries the
/// newline which ends the walk, plus at most one further step — which is
/// the ceiling `the_tail_read_costs_the_budget_and_not_the_file` asserts
/// against, spelled there as `tail_bytes + 2 * TAIL_CHUNK`.
const TAIL_CHUNK: usize = 64 * 1024;

/// THE WALK'S SECOND EXIT, IN BYTES (T-070 rebuild, closing the verdict's
/// BLOCKING 2).
///
/// The newline count alone is not a budget: a file with NO newline in it
/// never satisfies it, and the walk runs to byte 0 — the whole-file read
/// this card exists to remove, reachable on an input `transcript.jsonl`
/// is losable-by-charter open to. The natural constant is the budget
/// times the module's OWN per-line cap: [`TRANSCRIPT_TEXT_CAP`] is the
/// largest `text` [`append_transcript`] will write, so `max_lines` of
/// them is the largest tail this reader was ever asked for.
///
/// IT WINS OVER THE LINE BUDGET, and that is deliberate rather than
/// regrettable: on an input where the ceiling bites, the walk answers
/// with FEWER lines than the budget instead of costing the file. That
/// only happens on lines the module's own writer cannot produce (JSON
/// escaping can expand a capped `text` past its cap on the wire), and it
/// is the same trade `T-070-s3` already records one level in — the
/// budget is on what is READ, never on what is found.
fn tail_byte_ceiling(max_lines: usize) -> u64 {
    max_lines.saturating_mul(TRANSCRIPT_TEXT_CAP) as u64
}

/// THE BOUND, AT THE READ (T-070 criterion 1).
///
/// Read at most `max_lines` lines from the END of `src`, seeking backward
/// in [`TAIL_CHUNK`] steps and stopping at the FIRST of two budgeted
/// exits: the buffer holds one more newline than the budget, or the walk
/// has pulled [`tail_byte_ceiling`] bytes. **Nothing before that point is
/// ever pulled through `src`, and there is such a point on EVERY input**
/// — the byte ceiling is what makes that sentence true of a file with no
/// newline in it, which the newline count alone left running to byte 0.
///
/// That is the property, and it is also the reason this takes a
/// `Read + Seek` rather than a path: `src` is the function's ONLY channel
/// to any byte, so a caller can wrap the file in a counting reader and
/// MEASURE what the read cost, instead of trusting a figure this function
/// reports about itself.
/// `the_tail_read_costs_the_budget_and_not_the_file` and
/// `the_tail_walk_stops_at_a_byte_ceiling_with_no_newline_in_the_file`
/// are the two bodies that do it.
///
/// The first segment of the buffer is dropped unless the walk reached
/// byte 0, because a backward step lands mid-line far more often than
/// not — and a walk stopped by the ceiling has by definition not reached
/// it, so a newline-free file answers with nothing at all.
///
/// ONE JOIN, AT THE END (`T-070-s4`). The steps are kept as chunks and
/// concatenated once when the walk stops; prepending each step onto the
/// accumulated buffer copies it forward every time and makes the walk
/// O(steps²) in a function whose whole purpose is a bounded cost.
fn tail_lines<R: Read + Seek>(src: &mut R, max_lines: usize) -> io::Result<Vec<String>> {
    if max_lines == 0 {
        return Ok(Vec::new());
    }
    let ceiling = tail_byte_ceiling(max_lines);
    let mut pos = src.seek(SeekFrom::End(0))?;
    let mut chunks: Vec<Vec<u8>> = Vec::new();
    let mut taken: u64 = 0;
    let mut newlines = 0usize;
    while pos > 0 && newlines <= max_lines && taken < ceiling {
        let step = std::cmp::min(TAIL_CHUNK as u64, pos);
        pos -= step;
        src.seek(SeekFrom::Start(pos))?;
        // `step` is at most TAIL_CHUNK, so the cast cannot lose bits.
        let mut chunk = vec![0u8; step as usize];
        src.read_exact(&mut chunk)?;
        newlines += chunk.iter().filter(|byte| **byte == b'\n').count();
        taken += step;
        chunks.push(chunk);
    }
    // `pop` hands back the LAST step first, which is the EARLIEST in the
    // file — so this reassembles the file's own order, and frees each
    // chunk as it goes rather than holding two copies of the tail.
    let mut buf: Vec<u8> = Vec::with_capacity(taken as usize);
    while let Some(chunk) = chunks.pop() {
        buf.extend_from_slice(&chunk);
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
/// A file with no newline inside [`tail_byte_ceiling`] answers the same
/// empty vector for the same reason, and costs the ceiling rather than
/// the file.
///
/// THIS IS THE ONLY PRODUCTION READER OF `transcript.jsonl`, and that is
/// pinned rather than asserted:
/// `the_only_production_path_to_the_transcript_is_the_bounded_one` in
/// `agent/mod.rs` derives the callee set of every hop from
/// `genesis_transcript` down to [`tail_lines`] and reds if any of them
/// gains a way to reach the file that is not the next hop. Without it the
/// `Counting` measurement one level down binds a HELPER, never the
/// arrival read — which is the defect T-070's first verdict rejected on.
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
    use super::super::skills::SkillPack;
    use super::*;
    use std::collections::BTreeSet;
    use std::time::{SystemTime, UNIX_EPOCH};

    struct TempTree(PathBuf);
    impl TempTree {
        fn new(tag: &str) -> Self {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_millis())
                .unwrap_or(0);
            let dir = std::env::temp_dir().join(format!(
                "supertaskr-t025-sess-{}-{}-{}",
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
            // T-167: the ordinary case is no packs. The schema pin below
            // uses this fixture for the packless arm and a packed one
            // beside it — one fixture alone cannot see both.
            skills: vec![],
        }
    }

    /// **THE SCHEMA DOCUMENT ITSELF, COMPILED IN** — the same mechanism
    /// [`super::super::kit`] uses for every method file it pins, and for
    /// the same two reasons: `include_str!` recompiles when the file
    /// changes, so this can never read a stale copy, and it needs no
    /// working directory, so the pin answers the same in a lane, a drill
    /// worktree and CI.
    ///
    /// **IT IS DELIBERATELY NOT A RUNTIME CLIMB TO THE REPOSITORY ROOT.**
    /// The first pass here formed the path from `CARGO_MANIFEST_DIR` and
    /// two `parent()` hops, and `npm run lint:docs` refused it by name —
    /// a file that holds the repository root can reach `docs/`, so the
    /// DOCS GATE requires every one to be argued in `ROOT_ANCHOR_LEDGER`.
    /// A fixed relative path resolved by the compiler holds no root and
    /// can reach exactly one file, so the question does not arise.
    const SCHEMA_DOC: &str = include_str!("../../../../method/runtime/sessions-schema.md");

    /// The TRANSCRIPT's page, compiled in for the same two reasons and by
    /// the same mechanism as [`SCHEMA_DOC`] above — stated once there and
    /// deliberately not restated here (T-167-s9).
    const TRANSCRIPT_DOC: &str = include_str!("../../../../method/runtime/transcript-schema.md");

    /// One fenced ```json block out of a markdown file, parsed.
    fn json_example(doc: &str, whose: &str) -> serde_json::Value {
        const FENCE: &str = "```json";
        let start = doc
            .find(FENCE)
            .unwrap_or_else(|| panic!("{whose} must carry a {FENCE} example"))
            + FENCE.len();
        let rest = &doc[start..];
        let end = rest
            .find("```")
            .unwrap_or_else(|| panic!("{whose}'s json example is never closed"));
        serde_json::from_str(&rest[..end])
            .unwrap_or_else(|err| panic!("{whose}'s json example must parse: {err}"))
    }

    /// **WHAT THE SCHEMA NAMES, READ OFF THE SCHEMA (T-167-s1).**
    ///
    /// Derived from `method/runtime/sessions-schema.md`'s own JSON example
    /// rather than transcribed into this file, and that is the whole
    /// repair. A transcribed list is a SECOND IMPLEMENTATION of the field
    /// set, and the two disagree silently: this pin held a hard-coded nine
    /// keys while a pack-loading genesis wrote ten, the extra key is
    /// `skip_serializing_if`, and nothing in the tree could ever say so.
    /// Now the document is the one authority and this body is a reader of
    /// it, so the NEXT key added without the document reds here by name.
    ///
    /// **THE EXPECTED SIDE IS ASSERTED NON-EMPTY BEFORE ANYTHING IS
    /// COMPARED AGAINST IT** (CONVENTIONS: a comparison is evidence only
    /// once its expected side is). A renamed fence or a reflow that
    /// emptied this set would make every containment assertion below
    /// vacuously true — which is this pin's own failure mode, one level up.
    fn schema_entry_keys() -> (BTreeSet<String>, BTreeSet<String>) {
        let example = json_example(SCHEMA_DOC, "method/runtime/sessions-schema.md");
        let entry = example["sessions"][0]
            .as_object()
            .expect("the schema's example carries one session entry");
        let keys: BTreeSet<String> = entry.keys().cloned().collect();
        assert!(
            keys.contains("id") && keys.contains("status"),
            "the parsed block must be the session ENTRY, not some other object: {keys:?}"
        );
        assert!(
            keys.contains("skills"),
            "method/runtime/sessions-schema.md must NAME the tenth key a pack-loading \
             genesis writes (T-167-s1): {keys:?}"
        );
        // …and the pack object's own keys, one level down, for the same
        // reason: a field added to `SkillPack` is as silent as a field
        // added to `SessionEntry` was.
        let pack = entry["skills"][0]
            .as_object()
            .expect("the schema's `skills` example carries one pack");
        let pack_keys: BTreeSet<String> = pack.keys().cloned().collect();
        assert!(pack_keys.contains("hash"), "the pack example is a pack: {pack_keys:?}");
        (keys, pack_keys)
    }

    /// **WHAT THE TRANSCRIPT'S PAGE NAMES, READ OFF THE PAGE (T-167-s9).**
    ///
    /// The sibling of [`schema_entry_keys`], over the OTHER runtime file
    /// this module owns, and derived the same way: the document's own
    /// `json` example is the authority and this body is a reader of it,
    /// so a key added to [`TranscriptLine`] without the page reds here by
    /// name. Until this existed the transcript's only pin was a
    /// `contains("\"atMs\"")` substring in
    /// [`transcript_appends_one_line_per_half_turn_and_caps_text`], which
    /// fixes ONE key's spelling and says nothing about the SET.
    ///
    /// **THE EXPECTED SIDE IS ASSERTED NON-EMPTY BEFORE ANYTHING IS
    /// COMPARED AGAINST IT**, for the reason [`schema_entry_keys`] gives.
    fn transcript_line_keys() -> BTreeSet<String> {
        let example = json_example(TRANSCRIPT_DOC, "method/runtime/transcript-schema.md");
        let line = example
            .as_object()
            .expect("the transcript page's example is ONE line object");
        let keys: BTreeSet<String> = line.keys().cloned().collect();
        assert!(
            keys.contains("turn") && keys.contains("role") && keys.contains("text"),
            "the parsed block must be the transcript LINE, not some other object: {keys:?}"
        );
        assert!(
            keys.contains("atMs"),
            "method/runtime/transcript-schema.md must carry the camelCase wire spelling \
             the struct's `rename_all` produces - `atMs`, never `at_ms`: {keys:?}"
        );
        assert!(
            keys.contains("machine"),
            "the page's example must be the MACHINE-ASSEMBLED half-turn, which is the \
             only line that carries every key: `machine` is skipped on write when false, \
             so an example built from a typed turn could never show the full set and \
             every comparison below would be short by one: {keys:?}"
        );
        keys
    }

    /// ONE WRITTEN OBJECT AGAINST ONE DOCUMENTED KEY SET, BOTH DIRECTIONS
    /// AT ONCE: what the schema names and the writer omitted, and what the
    /// writer wrote and the schema never named. The second half is the one
    /// this pin did not have.
    fn against_the_schema(
        written: &serde_json::Value,
        schema: &BTreeSet<String>,
    ) -> (Vec<String>, Vec<String>) {
        let keys: BTreeSet<String> =
            written.as_object().expect("an object").keys().cloned().collect();
        (
            schema.difference(&keys).cloned().collect(),
            keys.difference(schema).cloned().collect(),
        )
    }

    /// A LOADED PACK, constructed by hand — the fixture that makes the
    /// tenth key visible at all. `skills` is skipped when empty, so a
    /// packless fixture exercises the subset arm over nine keys and can
    /// never see the tenth; that is exactly how the disagreement stayed
    /// silent.
    fn pack() -> SkillPack {
        SkillPack {
            dir: "brand".into(),
            name: "brand".into(),
            description: "House voice and naming rules.".into(),
            triggers: "Use when naming anything user-facing.".into(),
            rel_path: ".claude/skills/brand/SKILL.md".into(),
            hash: format!("sha256:{}", "a".repeat(64)),
        }
    }

    /// The registry file is byte-checkable against the schema's field set:
    /// every documented key present, spelled as the schema spells it —
    /// **and no key the schema does not name**, which is the direction
    /// T-167-s1 added.
    ///
    /// THE PACKED FIXTURE IS THE POINT. A pack-loading genesis writes the
    /// tenth key, and before this body existed the only fixture here had
    /// no packs — so the "no extra keys" arm was a count of nine that
    /// nothing could ever push past.
    #[test]
    fn the_written_registry_matches_the_sessions_schema_field_for_field() {
        let (schema, schema_pack) = schema_entry_keys();
        let t = TempTree::new("schema");

        // (1) A PACK-LOADING GENESIS: the entry and the document agree
        // exactly, in both directions.
        upsert(&t.0, SessionEntry { skills: vec![pack()], ..entry("S1") }).expect("upsert packed");
        let raw = fs::read_to_string(sessions_path(&t.0)).expect("sessions.json");
        let value: serde_json::Value = serde_json::from_str(&raw).expect("parses");
        let session = &value["sessions"][0];
        let (missing, extra) = against_the_schema(session, &schema);
        assert!(
            missing.is_empty(),
            "method/runtime/sessions-schema.md names {missing:?}; the written entry lacks them"
        );
        assert!(
            extra.is_empty(),
            "the entry writes {extra:?}, which method/runtime/sessions-schema.md does not name - \
             add the key to the document (T-167-s1) rather than to this list"
        );
        // …and one level down, the pack object itself.
        let (pack_missing, pack_extra) = against_the_schema(&session["skills"][0], &schema_pack);
        assert!(pack_missing.is_empty(), "the schema names pack keys {pack_missing:?}; unwritten");
        assert!(pack_extra.is_empty(), "a pack writes {pack_extra:?}, undocumented");
        assert_eq!(session["skills"][0]["relPath"], ".claude/skills/brand/SKILL.md");

        // (2) THE PACKLESS GENESIS, unchanged: the same nine keys it has
        // always written, and the tenth ABSENT rather than empty. This is
        // T-167's byte-identity behaviour, now stated as the schema's own
        // skip-when-empty rule instead of as a bare count.
        upsert(&t.0, entry("S1")).expect("upsert packless");
        let raw = fs::read_to_string(sessions_path(&t.0)).expect("sessions.json");
        let value: serde_json::Value = serde_json::from_str(&raw).expect("parses");
        let session = &value["sessions"][0];
        let (missing, extra) = against_the_schema(session, &schema);
        assert_eq!(
            missing,
            vec!["skills".to_string()],
            "a packless entry omits `skills` and NOTHING else the schema names"
        );
        assert!(extra.is_empty(), "unexpected extra keys: {extra:?}");

        assert_eq!(session["id"], "S1");
        assert_eq!(session["agent"], "claude");
        assert_eq!(session["roles"], serde_json::json!(["planner"]));
        assert_eq!(session["tasks"], serde_json::json!([]));
        assert_eq!(session["turns"], 0);

        // (3) THE POSITIVE CONTROL (CONVENTIONS: a negative assertion needs
        // one). The two arms above assert that nothing is missing and
        // nothing is extra; a comparison that CANNOT report an extra key
        // satisfies them both forever. So an entry carrying a key the
        // schema does not name is put through the SAME function, and it is
        // the same shape the silent one had: an undocumented field beside
        // nine documented ones.
        let mut planted = session.as_object().expect("object").clone();
        planted.insert("sediment_score".into(), serde_json::json!(7));
        let (_, extra) = against_the_schema(&serde_json::Value::Object(planted), &schema);
        assert_eq!(
            extra,
            vec!["sediment_score".to_string()],
            "the subset arm must be able to FAIL, or the arms above are decoration"
        );
    }

    /// The transcript is byte-checkable against its page's field set, in
    /// both directions, exactly as the registry became at T-167-s1 — the
    /// repair of the ASYMMETRY that card left behind (T-167-s9). One
    /// module owns two runtime files and its header names both in one
    /// sentence; only one of them was documented, and only one was
    /// checked.
    ///
    /// **THE MACHINE-ASSEMBLED LINE IS THE POINT, and it is the same
    /// shape the registry's packed fixture was.** `machine` is
    /// `skip_serializing_if`, so a fixture built from an ordinary typed
    /// half-turn writes four keys and can NEVER see the fifth — which is
    /// precisely how the registry's tenth key stayed silent. Both arms
    /// are written here, from one file, so neither can hide the other.
    #[test]
    fn the_written_transcript_matches_the_transcript_schema_field_for_field() {
        let schema = transcript_line_keys();
        let t = TempTree::new("transcript-schema");

        append_transcript(
            &t.0,
            &TranscriptLine {
                turn: 1,
                role: "user".into(),
                text: "You are the planner.".into(),
                at_ms: 7,
                machine: true,
            },
        )
        .expect("machine-assembled line");
        append_transcript(
            &t.0,
            &TranscriptLine {
                turn: 2,
                role: "user".into(),
                text: "solo founders".into(),
                at_ms: 9,
                machine: false,
            },
        )
        .expect("typed line");

        // Read the BYTES rather than the parsed struct: a round-trip
        // through `TranscriptLine` would re-materialise `machine` and
        // report the writer's defaults instead of the writer's output.
        let raw = fs::read_to_string(transcript_path(&t.0)).expect("jsonl");
        let mut written = raw.lines();
        let machine: serde_json::Value =
            serde_json::from_str(written.next().expect("line 1")).expect("line 1 parses");
        let typed: serde_json::Value =
            serde_json::from_str(written.next().expect("line 2")).expect("line 2 parses");
        assert!(written.next().is_none(), "one line per half-turn, and no more: {raw}");

        // (1) THE MACHINE HALF-TURN: the line and the page agree exactly,
        // in both directions.
        let (missing, extra) = against_the_schema(&machine, &schema);
        assert!(
            missing.is_empty(),
            "method/runtime/transcript-schema.md names {missing:?}; the written line lacks them"
        );
        assert!(
            extra.is_empty(),
            "the line writes {extra:?}, which method/runtime/transcript-schema.md does not \
             name - add the key to the document (T-167-s9) rather than to this list"
        );
        // The camelCase spelling is now pinned as a SET MEMBERSHIP by the
        // arms above rather than by a substring, so these two only fix
        // the VALUES the writer put behind the documented keys.
        assert_eq!(machine["atMs"], 7);
        assert_eq!(machine["machine"], true);

        // (2) THE TYPED HALF-TURN: `machine` ABSENT rather than false,
        // and nothing else the page names missing with it. This arm is
        // also the positive control for the FIRST direction - it proves
        // `against_the_schema` can report a missing key, which the
        // registry's pin next door demonstrates only for the second.
        let (missing, extra) = against_the_schema(&typed, &schema);
        assert_eq!(
            missing,
            vec!["machine".to_string()],
            "a typed half-turn omits `machine` and NOTHING else the page names"
        );
        assert!(extra.is_empty(), "unexpected extra keys: {extra:?}");

        // (3) THE POSITIVE CONTROL for the second direction (CONVENTIONS:
        // a negative assertion needs one). A comparison that CANNOT
        // report an extra key satisfies arm (1) forever, so a line
        // carrying an undocumented field goes through the SAME function -
        // and it is the shape the silent one had: one plausible extra
        // field beside the documented ones.
        let mut planted = typed.as_object().expect("object").clone();
        planted.insert("tokens".into(), serde_json::json!(412));
        let (_, extra) = against_the_schema(&serde_json::Value::Object(planted), &schema);
        assert_eq!(
            extra,
            vec!["tokens".to_string()],
            "the subset arm must be able to FAIL, or the arms above are decoration"
        );
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

    /// **T-123's REBUILT PREDICATE, PINNED AT THE LEVEL IT LIVES ON.**
    ///
    /// The first pass of T-123 routed on `genesis_record(..).is_some()`
    /// and a verifier rejected it: that answers TRUE for a planner entry
    /// with no id recorded and for one whose id the T-039 boundary
    /// refuses, and neither can be resumed. Routing those to the interview
    /// screen puts the user somewhere nothing can happen.
    ///
    /// **THE ACCEPTANCE IS ASSERTED BEFORE EITHER REFUSAL, AND EVERY ARM
    /// IS ONE FIELD AWAY FROM IT** (CONVENTIONS: A NEGATIVE ASSERTION
    /// NEEDS A POSITIVE CONTROL — "a test that asserts something is
    /// REFUSED must first prove the fixture would otherwise have been
    /// ACCEPTED"). And the two refusals are asserted to differ from the
    /// two ABSENCES by VALUE and not only by outcome, which a `bool`
    /// predicate could not express at all — that collapse is what let the
    /// defect through.
    #[test]
    fn reachability_tells_a_refused_session_id_from_an_absent_one_and_both_from_no_session() {
        let t = TempTree::new("reach");

        // ABSENCE (a): no registry file at all.
        assert_eq!(genesis_reachability(&t.0), GenesisReachability::NoSession);
        assert_eq!(reachability_of(None), GenesisReachability::NoSession);

        // THE ACCEPTANCE, first: one planner with a usable id.
        upsert(&t.0, entry("S1")).expect("resumable");
        assert_eq!(genesis_reachability(&t.0), GenesisReachability::Resumable);

        // REFUSAL (a): the same entry with the id field GONE. Nothing to
        // resume — and this is the shape `start_genesis` writes before the
        // CLI's init line has reported an id, so it is the ordinary
        // mid-flight state and not an exotic one.
        upsert(&t.0, SessionEntry { native_session_id: None, ..entry("S1") })
            .expect("no id");
        assert_eq!(
            genesis_reachability(&t.0),
            GenesisReachability::NotResumable,
            "a planner with no recorded id is present, and is not a way back in"
        );

        // REFUSAL (b): an id present and REFUSED by the T-039 boundary.
        upsert(
            &t.0,
            SessionEntry {
                native_session_id: Some("--dangerously-skip-permissions".into()),
                ..entry("S1")
            },
        )
        .expect("refused id");
        assert_eq!(genesis_reachability(&t.0), GenesisReachability::NotResumable);
        // …and the refusal is still NAMED on the record, so narrowing the
        // routing predicate loses no information about why.
        assert!(
            genesis_record(&t.0)
                .expect("a record")
                .session_id_rejected
                .is_some(),
            "the record still says the id was refused rather than absent"
        );

        // ABSENCE (b): a session the user explicitly abandoned is an
        // absence again, not a refusal — `find_planner` skips it.
        upsert(&t.0, SessionEntry { status: "dead".into(), ..entry("S1") }).expect("dead");
        assert_eq!(genesis_reachability(&t.0), GenesisReachability::NoSession);
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

        // camelCase on the wire (the store mirrors it). ONE key by
        // substring, and deliberately left alone: the FIELD SET is
        // [`the_written_transcript_matches_the_transcript_schema_field_for_field`]'s
        // (T-167-s9), which is the body to read for what the wire carries.
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
        fs::create_dir_all(path.parent().expect("parent")).expect("mk .supertaskr/genesis");

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

    /// T-070 CRITERION 1 ON THE INPUT THE FIRST BUILD MISSED — the walk's
    /// byte ceiling, pinned with a file that holds NO newline at all.
    ///
    /// The newline count was the walk's only budgeted exit, so this input
    /// had no exit: `tail_lines` read all 20,971,520 bytes of a 20 MiB
    /// newline-free file, measured by T-070's verifier. `append_transcript`
    /// always writes the newline, so this is not a shape production
    /// writes — and `transcript.jsonl` is LOSABLE BY CHARTER, which is
    /// exactly the sentence that says anything may have written it.
    ///
    /// THE FIXTURE IS NEWLINE-FREE AND THE BUDGETS ARE SMALL, on purpose.
    /// A ceiling that is a fixed constant and a ceiling that is
    /// `budget × TRANSCRIPT_TEXT_CAP` are indistinguishable at one
    /// budget; three budgets separate them, and the cost has to MOVE with
    /// the budget. The `Counting` wrapper is the same observation at the
    /// `Read` impl as the body above — never a figure the reader reports
    /// about itself.
    #[test]
    fn the_tail_walk_stops_at_a_byte_ceiling_with_no_newline_in_the_file() {
        const FILE: usize = 5 * 1024 * 1024;
        let t = TempTree::new("tailnonewline");
        let path = transcript_path(&t.0);
        fs::create_dir_all(path.parent().expect("parent")).expect("mk .supertaskr/genesis");
        // Five mebibytes, not one newline in it. Written as bytes so no
        // formatting helper can slip a line ending in.
        let content = vec![b'x'; FILE];
        assert!(!content.contains(&b'\n'), "the fixture's whole point");
        fs::write(&path, &content).expect("write the transcript");
        let file_len = fs::metadata(&path).expect("stat").len();
        assert_eq!(file_len, FILE as u64);

        let mut costs: Vec<u64> = Vec::new();
        for budget in [1usize, 2, 4] {
            let mut src = Counting { inner: fs::File::open(&path).expect("open"), read: 0 };
            let out = tail_lines(&mut src, budget).expect("tail");
            // There is no complete line in this file, so there is nothing
            // to answer with — losable by charter, not an error.
            assert!(out.is_empty(), "budget {budget} answered {} lines", out.len());
            // THE DISCRIMINATING ASSERTION, and it is the one the newline
            // count could not make: the walk stopped, and it stopped at
            // the budget's own multiple of the per-line cap plus at most
            // the one step that crossed it.
            let ceiling = (budget * TRANSCRIPT_TEXT_CAP + TAIL_CHUNK) as u64;
            assert!(src.read <= ceiling, "budget {budget}: read {} > {ceiling}", src.read);
            assert!(
                src.read * 2 <= file_len,
                "budget {budget}: read {} of {file_len} - the walk reached byte 0",
                src.read
            );
            costs.push(src.read);
        }
        // …and the ceiling is the BUDGET's, not a constant: doubling the
        // budget doubles what the walk is allowed to pull. A hard-coded
        // ceiling satisfies every assertion above and dies here.
        assert!(costs[1] > costs[0] && costs[2] > costs[1], "costs {costs:?}");
        assert_eq!(costs[2], 4 * costs[0], "the cost is linear in the budget: {costs:?}");

        // AND THE COMMAND-FACING READER ANSWERS EMPTY on the same file,
        // which is the losable-by-charter contract one level up.
        assert!(read_transcript_tail(&t.0, 200).is_empty());
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
