//! T-112 (F-04) — **A CARD HANDS YOU ITS BRIEF.**
//!
//! T-089 wrote the contract: a thirteen-row normative table in
//! `method/roles/executor.md`, each row naming what the brief carries,
//! what it is assembled from, and what a session guesses when the row is
//! absent. This module is the SECOND READER of that table — the first was
//! a hand-walk, and five of thirteen rows did not yield their content to
//! it.
//!
//! Four properties hold by construction, and each has a pin below.
//!
//! 1. **THE ROW SET IS READ, NEVER TRANSCRIBED.** [`read_contract`]
//!    parses the table out of the role file at run time. A row added to
//!    the document appears in the output with no edit here, and a table
//!    this module cannot parse is an `Err` — never an empty contract
//!    wearing a successful return's costume (poison shape TEN: an empty
//!    comparison reports agreement).
//! 2. **EVERY ROW IS ASSEMBLED FROM FILES.** The card reaches this module
//!    through [`CardSource`] and every other source through
//!    [`FileSource`]; there is no other input. The pin is T-028's shape:
//!    a card double that PANICS on every field the assembler is not
//!    entitled to read, and a brief required out the other side.
//! 3. **THE VERIFIER'S BRIEF WITHHOLDS THE EXECUTOR'S REASONING BY
//!    CONSTRUCTION.** [`CardField::ImplementationNotes`] and
//!    [`CardField::Verdicts`] are outside [`ENTITLED_FIELDS`] for EVERY
//!    role, so no brief this module assembles can carry them — proved by
//!    handing it a card whose notes section panics on read and requiring
//!    a verifier brief anyway. A human cannot un-read; this assembler can
//!    simply not send. **The interim discipline for a HAND-driven read is
//!    `T-121`'s and is deliberately not restated here** — read it there.
//!    What this module owns is the boundary that discipline needs, and it
//!    is [`notes_boundary`]: DERIVED from the card's own headings, never a
//!    line number. T-121 measured the number that used to stand here and
//!    refuted it in both directions.
//! 4. **NO SUBPROCESS, AND IN PARTICULAR NO `git`.** Row 4 carries the
//!    COMMAND that finds the commit to cut from, not the resolved answer;
//!    row 5's lane list comes from [`super::lanes::read_lanes`], which is
//!    a FILE READ of `<repo>/.git/worktrees`. `no_subprocess_in_this_file`
//!    sweeps this module's own source, the way `lanes.rs` sweeps its own.
//!    T-013 spent a rejection on a git subprocess getting its program from
//!    the opened project; this slice does not need one.
//!
//! **AND THIS MODULE EMITS NO FIGURE.** Every line it produces is a
//! quotation from a named file or a LIVE reading of the worktree list. A
//! count, a hash or a range would be a function of a tree, and the ref it
//! was measured at is not derivable without the subprocess property 4
//! forbids — so the assembler emits none, and row 13's standing
//! instruction to re-derive at the session's own ref carries the rest.
//!
//! **WHAT IS NOT HERE, AND WHY — READ THIS BEFORE CONCLUDING THE CARD IS
//! HALF-BUILT.** No `#[tauri::command]` wraps [`brief_for_card`] and
//! `lib.rs` does not register it. Registration lives in
//! `app/src-tauri/src/lib.rs` and the IPC census that would have to move
//! with it lives in `app/test/crescendo-dom.test.tsx`; both are C-05's
//! `app-shell`, outside this card's `[app-dispatch, app-board]` fence.
//! **Widening the fence from inside the lane is the one repair an
//! executor may never make**, so the wiring is routed as `T-112-s1` and
//! this module is compiled through `lib.rs`'s existing `pub mod dispatch;`
//! and proved by the bodies at the foot of this file. It is the same
//! disposition `lanes.rs` took at T-110 and `T-126` later discharged.
//! Because nothing is registered, the IPC census does NOT move and
//! `acl_pin.rs` is a 0-file diff — which is what that criterion's own
//! second clause requires either way: an app command is not a webview
//! grant.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

use super::lanes::{LaneScan, WorktreeEntry};

// ---------------------------------------------------------------------
// Roles.
// ---------------------------------------------------------------------

/// Which seat the brief puts to work.
///
/// **THE CONTRACT TABLE IS ONE TABLE FOR EVERY ROLE.** The table's own
/// note rules it: a verifier's brief follows the same thirteen rows,
/// substituting the role-specific ones, and *"read every 'this role file'
/// in the source column as 'the brief's own role file'"*. So the TABLE is
/// read from [`CONTRACT_FILE`] whatever the role, and every row whose
/// source column says *this role file* is read against [`Role::file`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Role {
    Executor,
    Verifier,
}

impl Role {
    /// The role file, repository-relative.
    pub fn file(self) -> &'static str {
        match self {
            Role::Executor => "method/roles/executor.md",
            Role::Verifier => "method/roles/verifier.md",
        }
    }
}

/// The file the normative table lives in.
///
/// It is `executor.md` for every role BY THE TABLE'S OWN NOTE, and that
/// is why this is a constant rather than [`Role::file`]: the table is the
/// contract, the role file is what its source column resolves against,
/// and conflating the two would give a verifier's brief a different row
/// set from an executor's — which the note forbids in as many words.
pub const CONTRACT_FILE: &str = "method/roles/executor.md";

/// The project's own root adapter files, in the order row 3 prefers them.
///
/// Row 3's source column names *"the filled-in `CLAUDE.md`/`AGENTS.md` at
/// the repo root"* and says NOT the template directory. Both spellings
/// are read; the first that exists is the one quoted, and the other is
/// compared so a brief cannot quietly prefer a stale copy.
pub const ADAPTER_FILES: [&str; 2] = ["CLAUDE.md", "AGENTS.md"];

// ---------------------------------------------------------------------
// The contract, READ from the role file.
// ---------------------------------------------------------------------

/// One row of the normative table, exactly as the document spells it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContractRow {
    pub number: u32,
    /// Column two — what the brief carries.
    pub carries: String,
    /// Column three — the source this row is assembled from.
    pub assembled_from: String,
    /// Column four — what a session guesses when the row is absent.
    pub if_absent: String,
}

/// A table this module could not read. **Never an empty contract.**
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ContractDefect {
    /// No `| # | ... |` header row was found at all.
    NoTable,
    /// A header row was found and no numbered row followed it.
    EmptyTable,
    /// A row whose first cell is not a row number.
    UnnumberedRow { text: String },
}

/// Parse the normative table out of a role file's text.
///
/// **THE ROW SET FOLLOWS THE DOCUMENT.** Nothing here knows the number
/// thirteen; a fourteenth row appears in the output the moment the
/// document grows one, and this is what makes the assembler a
/// TRANSCRIPTION rather than a second copy of the contract.
///
/// A table with a header and no data rows is [`ContractDefect::EmptyTable`]
/// rather than `Ok(vec![])`: an empty contract would make every "every row
/// is present" assertion downstream vacuously true, which is poison shape
/// TEN (an empty comparison reports agreement).
pub fn read_contract(text: &str) -> Result<Vec<ContractRow>, ContractDefect> {
    let mut rows: Vec<ContractRow> = Vec::new();
    let mut in_table = false;
    for line in text.lines() {
        let trimmed = line.trim();
        if !trimmed.starts_with('|') {
            // A blank line or prose ENDS the table; a table that resumed
            // after prose would be a second table read as one.
            if in_table && !rows.is_empty() {
                break;
            }
            continue;
        }
        let cells = table_cells(trimmed);
        if cells.len() != 4 {
            continue;
        }
        if cells[0] == "#" {
            in_table = true;
            continue;
        }
        if !in_table {
            continue;
        }
        if cells.iter().all(|c| c.chars().all(|ch| ch == '-' || ch == ':')) {
            continue;
        }
        match cells[0].parse::<u32>() {
            Ok(number) => rows.push(ContractRow {
                number,
                carries: cells[1].clone(),
                assembled_from: cells[2].clone(),
                if_absent: cells[3].clone(),
            }),
            Err(_) => {
                return Err(ContractDefect::UnnumberedRow {
                    text: cells[0].clone(),
                })
            }
        }
    }
    if !in_table {
        return Err(ContractDefect::NoTable);
    }
    if rows.is_empty() {
        return Err(ContractDefect::EmptyTable);
    }
    Ok(rows)
}

/// Split one markdown table line into its cells, dropping the leading and
/// trailing pipe. Escaped pipes are not a shape this document uses and are
/// deliberately not invented for.
fn table_cells(line: &str) -> Vec<String> {
    let inner = line.trim().trim_start_matches('|').trim_end_matches('|');
    inner.split('|').map(|c| c.trim().to_string()).collect()
}

// ---------------------------------------------------------------------
// The file side.
// ---------------------------------------------------------------------

/// Why a source the brief requires could not be read.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum SourceMiss {
    NotFound,
    Unreadable { because: String },
}

/// Every file this module reads arrives through here.
///
/// A trait rather than a bare `fs::read_to_string` for the reason
/// criterion 4 states: the pin that the brief comes from FILES has to be
/// able to hand the assembler a source that refuses, and a free function
/// cannot be refused.
pub trait FileSource {
    /// Read one repository-relative path as text.
    fn read_text(&self, rel: &str) -> Result<String, SourceMiss>;
    /// The repository-relative paths directly inside one directory,
    /// sorted. Used only by row 5's slug map.
    fn list_dir(&self, rel: &str) -> Result<Vec<String>, SourceMiss>;
}

/// The ordinary implementation: a project root on disk.
pub struct DiskFiles {
    root: PathBuf,
}

impl DiskFiles {
    pub fn new(root: &Path) -> Self {
        Self {
            root: root.to_path_buf(),
        }
    }
}

impl FileSource for DiskFiles {
    fn read_text(&self, rel: &str) -> Result<String, SourceMiss> {
        let full = self.root.join(rel);
        match fs::read_to_string(&full) {
            Ok(text) => Ok(text),
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => Err(SourceMiss::NotFound),
            Err(err) => Err(SourceMiss::Unreadable {
                because: err.kind().to_string(),
            }),
        }
    }

    fn list_dir(&self, rel: &str) -> Result<Vec<String>, SourceMiss> {
        let full = self.root.join(rel);
        let entries = match fs::read_dir(&full) {
            Ok(entries) => entries,
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
                return Err(SourceMiss::NotFound)
            }
            Err(err) => {
                return Err(SourceMiss::Unreadable {
                    because: err.kind().to_string(),
                })
            }
        };
        let mut names: Vec<String> = Vec::new();
        for entry in entries.flatten() {
            if entry.file_type().map(|t| t.is_file()).unwrap_or(false) {
                names.push(format!("{rel}/{}", entry.file_name().to_string_lossy()));
            }
        }
        names.sort();
        Ok(names)
    }
}

// ---------------------------------------------------------------------
// The card side.
// ---------------------------------------------------------------------

/// The fields of a card this module can ask for.
///
/// An enum rather than one method per field so that "entitled" is a SET
/// this file states once ([`ENTITLED_FIELDS`]) and a hostile double can
/// compare against, instead of a property spread over a dozen signatures.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CardField {
    Id,
    Path,
    Title,
    Status,
    Size,
    Feature,
    Milestone,
    Touches,
    /// **NOT ENTITLED, FOR ANY ROLE.** The executor's reasoning.
    ImplementationNotes,
    /// **NOT ENTITLED, FOR ANY ROLE.** The verifier's own earlier passes.
    Verdicts,
    /// **NOT ENTITLED.** The whole card body; the brief points at the
    /// card and never paraphrases it (row 2's own "if it is absent").
    Body,
}

/// Every field any role's brief may read, and nothing else.
///
/// **THE SET IS THE SAME FOR EVERY ROLE, WHICH IS THE POINT OF
/// CRITERION 5.** `verifier.md` forbids the verifier the executor's
/// reasoning and `executor.md` step 5 puts that reasoning in the file the
/// verifier reads. The two sentences hold at once here because this
/// assembler never reads the notes for anybody: there is no role for which
/// [`CardField::ImplementationNotes`] is entitled, so there is no code
/// path that could leak it and no flag anyone could set wrong.
pub const ENTITLED_FIELDS: [CardField; 8] = [
    CardField::Id,
    CardField::Path,
    CardField::Title,
    CardField::Status,
    CardField::Size,
    CardField::Feature,
    CardField::Milestone,
    CardField::Touches,
];

/// True when the assembler is allowed to ask for this field.
pub fn entitled(field: CardField) -> bool {
    ENTITLED_FIELDS.contains(&field)
}

/// The card, behind a boundary a test can make hostile.
pub trait CardSource {
    /// A scalar field. `Ok(None)` is a field the card does not set.
    fn scalar(&self, field: CardField) -> Result<Option<String>, SourceMiss>;
    /// A list field, in the card's own order.
    fn list(&self, field: CardField) -> Result<Vec<String>, SourceMiss>;
}

/// A card read off disk: frontmatter only.
///
/// **IT PARSES NO BODY SECTION AND HAS NO WAY TO RETURN ONE.** That is
/// not an omission to fill in later — it is criterion 5's guarantee
/// spelled in the type system rather than in a rule somebody has to
/// remember. The bytes of `## Implementation notes` never enter this
/// struct, so nothing downstream can send them.
pub struct FrontmatterCard {
    path: String,
    fields: BTreeMap<String, String>,
}

impl FrontmatterCard {
    /// Parse one card file's frontmatter.
    ///
    /// The delimiters and the flat `key: value` shape are the parser's
    /// (`lib/parser`); this is deliberately the narrowest reader that
    /// answers the eight entitled fields, and it reads only as far as the
    /// closing delimiter.
    pub fn parse(path: &str, text: &str) -> Self {
        let mut fields = BTreeMap::new();
        let mut lines = text.lines();
        if lines.next().map(|l| l.trim_end()) == Some("---") {
            for line in lines {
                if line.trim_end() == "---" {
                    break;
                }
                if let Some((key, value)) = line.split_once(':') {
                    if key.starts_with(char::is_whitespace) || key.trim().is_empty() {
                        continue;
                    }
                    fields.insert(
                        key.trim().to_string(),
                        strip_comment(value).trim().to_string(),
                    );
                }
            }
        }
        Self {
            path: path.to_string(),
            fields,
        }
    }

    fn get(&self, key: &str) -> Option<String> {
        self.fields
            .get(key)
            .map(|v| v.trim().to_string())
            .filter(|v| !v.is_empty())
    }
}

/// Drop a trailing ` # comment`, which the card template uses.
fn strip_comment(value: &str) -> &str {
    match value.find(" #") {
        Some(at) => &value[..at],
        None => value,
    }
}

impl CardSource for FrontmatterCard {
    fn scalar(&self, field: CardField) -> Result<Option<String>, SourceMiss> {
        Ok(match field {
            CardField::Id => self.get("id"),
            CardField::Path => Some(self.path.clone()),
            CardField::Title => self.get("title"),
            CardField::Status => self.get("status"),
            CardField::Size => self.get("size"),
            CardField::Feature => self.get("feature"),
            CardField::Milestone => self.get("milestone"),
            // Not a scalar, and not entitled either: both answers are
            // `None` rather than a panic, because a PRODUCTION reader that
            // panicked would turn a malformed card into a crashed app.
            CardField::Touches
            | CardField::ImplementationNotes
            | CardField::Verdicts
            | CardField::Body => None,
        })
    }

    fn list(&self, field: CardField) -> Result<Vec<String>, SourceMiss> {
        Ok(match field {
            CardField::Touches => parse_flow_list(self.get("touches").unwrap_or_default().as_str()),
            _ => Vec::new(),
        })
    }
}

/// `[a, b]` or a bare `a, b` into its entries.
fn parse_flow_list(raw: &str) -> Vec<String> {
    raw.trim()
        .trim_start_matches('[')
        .trim_end_matches(']')
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

// ---------------------------------------------------------------------
// The brief.
// ---------------------------------------------------------------------

/// Where one line came from.
///
/// **A TREE FACT AND A LIVE FACT ARE DIFFERENT SHAPES**, which is the
/// brief contract's own rule: a pid, a port holder and a worktree list are
/// not functions of a tree, so they carry when they were read rather than
/// a commit. This module emits no ref on the tree side because it computes
/// no ref — see the header — so a `Tree` provenance names the FILE and
/// row 13 carries the instruction to re-derive.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Provenance {
    /// Quoted out of a file in the tree.
    Tree { source: String },
    /// Read from the live environment; re-read it at dispatch.
    Live { source: String },
    /// Composed by this assembler out of file-derived parts, which are
    /// named. Used where a source states a RULE and no file states the
    /// command that obeys it — row 4's cut-commit command is the case.
    Composed { from: Vec<String> },
}

/// One line of one row.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BriefLine {
    pub label: String,
    pub text: String,
    pub provenance: Provenance,
}

impl BriefLine {
    fn tree(label: &str, text: impl Into<String>, source: &str) -> Self {
        Self {
            label: label.to_string(),
            text: text.into(),
            provenance: Provenance::Tree {
                source: source.to_string(),
            },
        }
    }

    fn live(label: &str, text: impl Into<String>, source: &str) -> Self {
        Self {
            label: label.to_string(),
            text: text.into(),
            provenance: Provenance::Live {
                source: source.to_string(),
            },
        }
    }

    fn composed(label: &str, text: impl Into<String>, from: &[&str]) -> Self {
        Self {
            label: label.to_string(),
            text: text.into(),
            provenance: Provenance::Composed {
                from: from.iter().map(|s| s.to_string()).collect(),
            },
        }
    }
}

/// One assembled row: the contract's own three columns, plus content.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BriefRow {
    pub number: u32,
    pub carries: String,
    pub assembled_from: String,
    pub if_absent: String,
    pub lines: Vec<BriefLine>,
    /// A residual the CONTRACT carries, surfaced rather than papered over.
    ///
    /// Distinct from a row that could not be assembled: the row IS
    /// assembled, and something about its own source column is open. The
    /// three known ones are `T-089-s9`'s and the card requires them
    /// surfaced rather than silently filled in.
    pub residual: Option<String>,
}

/// A row that could not be assembled: WHICH ROW and WHICH SOURCE.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MissingRow {
    pub number: u32,
    /// The row's own source column, verbatim — the thing that failed.
    pub source: String,
    /// The repository-relative path this assembler tried, when the source
    /// column named one.
    pub path: String,
    pub because: SourceMiss,
}

/// The whole brief.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Brief {
    pub role: Role,
    pub role_file: String,
    pub task_id: String,
    pub card_path: String,
    pub rows: Vec<BriefRow>,
    /// The line a verifier's brief is split at.
    ///
    /// Above it the duties, which are GENERIC; below it everything the
    /// executor produced. **This assembler puts NOTHING below it**, and
    /// the empty half is the guarantee rather than an oversight: a duties
    /// section that names the executor's findings has already told the
    /// verifier what they are, in the half it reads first.
    pub marker: Option<String>,
}

/// What the assembler answers with. **Typed, and never a partial brief.**
///
/// A brief with a silently missing gate list is worse than no brief, so a
/// row that cannot be assembled takes the WHOLE answer to
/// [`BriefOutcome::Unassemblable`] rather than shortening the output.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum BriefOutcome {
    Assembled { brief: Brief },
    /// The contract table itself could not be read. Nothing downstream is
    /// meaningful, so this is its own answer rather than a missing row.
    ContractUnreadable {
        source: String,
        defect: ContractDefect,
    },
    /// The contract table's file could not be read at all.
    ContractMissing { source: String, because: SourceMiss },
    /// One or more rows could not be assembled from their named source.
    Unassemblable { rows: Vec<MissingRow> },
    /// No card with this id is on the board.
    NoSuchCard { task_id: String },
}

// ---------------------------------------------------------------------
// The derived notes boundary.
// ---------------------------------------------------------------------

/// The headings that END the half of a card a verifier is entitled to.
pub const NOTES_HEADINGS: [&str; 2] = ["## Implementation notes", "## Verdicts"];

/// The DERIVED boundary: the 1-based line of the first heading in
/// [`NOTES_HEADINGS`], or `None` when the card carries neither.
///
/// **THIS REPLACES A NUMBER, AND THE NUMBER WAS REFUTED IN BOTH
/// DIRECTIONS.** An earlier revision of this card's criterion named a
/// fixed line count as the boundary of a hand-driven bounded read.
/// `T-121` measured it over every flat card and found it reads the
/// reasoning on some and truncates the criteria on others. A boundary
/// derived from the card's own bytes cannot be wrong on either side,
/// and it is the only form that stays right as a card grows.
///
/// The DISCIPLINE this boundary serves is `T-121`'s and is not restated
/// here: a rule with two implementations is two chances to disagree.
pub fn notes_boundary(card_text: &str) -> Option<usize> {
    card_text
        .lines()
        .enumerate()
        .find(|(_, line)| NOTES_HEADINGS.contains(&line.trim_end()))
        .map(|(index, _)| index + 1)
}

// ---------------------------------------------------------------------
// The assembler.
// ---------------------------------------------------------------------

/// Everything one row assembler may reach.
struct Ctx<'a> {
    files: &'a dyn FileSource,
    card: &'a dyn CardSource,
    role: Role,
    role_text: String,
    task_id: String,
    card_path: String,
    scan: &'a LaneScan,
}

/// Assemble a brief for one card.
///
/// **THE ARGUMENT SURFACE IS THE NARROWEST THAT WORKS** (ADR-012's
/// *narrowness lives in the command's own signature*): a task ID, a role,
/// and the two boundaries a test can make hostile. **No path crosses in
/// from a caller.** The project root the [`DiskFiles`] source is built
/// over is the app's own watched root, never the webview's — which is
/// what keeps the eventual command a zero-path one.
pub fn assemble(
    files: &dyn FileSource,
    card: &dyn CardSource,
    role: Role,
    scan: &LaneScan,
) -> BriefOutcome {
    let contract_text = match files.read_text(CONTRACT_FILE) {
        Ok(text) => text,
        Err(because) => {
            return BriefOutcome::ContractMissing {
                source: CONTRACT_FILE.to_string(),
                because,
            }
        }
    };
    let contract = match read_contract(&contract_text) {
        Ok(rows) => rows,
        Err(defect) => {
            return BriefOutcome::ContractUnreadable {
                source: CONTRACT_FILE.to_string(),
                defect,
            }
        }
    };

    let task_id = match card.scalar(CardField::Id) {
        Ok(Some(id)) => id,
        _ => {
            return BriefOutcome::NoSuchCard {
                task_id: String::new(),
            }
        }
    };
    let card_path = card
        .scalar(CardField::Path)
        .ok()
        .flatten()
        .unwrap_or_default();

    let role_text = match files.read_text(role.file()) {
        Ok(text) => text,
        Err(because) => {
            return BriefOutcome::Unassemblable {
                rows: vec![MissingRow {
                    number: 1,
                    source: contract
                        .iter()
                        .find(|r| r.number == 1)
                        .map(|r| r.assembled_from.clone())
                        .unwrap_or_default(),
                    path: role.file().to_string(),
                    because,
                }],
            }
        }
    };

    let ctx = Ctx {
        files,
        card,
        role,
        role_text,
        task_id: task_id.clone(),
        card_path: card_path.clone(),
        scan,
    };

    let mut rows: Vec<BriefRow> = Vec::new();
    let mut missing: Vec<MissingRow> = Vec::new();
    for row in &contract {
        match assemble_row(&ctx, row) {
            Ok((lines, residual)) => rows.push(BriefRow {
                number: row.number,
                carries: row.carries.clone(),
                assembled_from: row.assembled_from.clone(),
                if_absent: row.if_absent.clone(),
                lines,
                residual,
            }),
            Err(miss) => missing.push(miss),
        }
    }
    if !missing.is_empty() {
        return BriefOutcome::Unassemblable { rows: missing };
    }

    BriefOutcome::Assembled {
        brief: Brief {
            role,
            role_file: role.file().to_string(),
            task_id,
            card_path,
            rows,
            marker: match role {
                Role::Executor => None,
                Role::Verifier => Some(MARKER.to_string()),
            },
        },
    }
}

/// The line a verifier's brief is split at.
pub const MARKER: &str =
    "---- EXECUTOR-DERIVED FACTS BELOW THIS LINE ---- (this assembler puts none here)";

/// A row this assembler has no assembler for.
///
/// **THE HONEST ANSWER TO A ROW THE DOCUMENT GREW.** The row set follows
/// the document, so a fourteenth row arrives here with nothing to fill it
/// — and the card requires the outcome to name WHICH ROW and WHICH SOURCE
/// rather than to invent a value or to drop the row in silence.
fn unknown_row(row: &ContractRow) -> MissingRow {
    MissingRow {
        number: row.number,
        source: row.assembled_from.clone(),
        path: String::new(),
        because: SourceMiss::Unreadable {
            because: "this assembler transcribes no row with this number".to_string(),
        },
    }
}

type RowContent = (Vec<BriefLine>, Option<String>);

fn assemble_row(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    match row.number {
        1 => row_role(ctx),
        2 => row_task(ctx),
        3 => row_read_first(ctx, row),
        4 => row_lane(ctx, row),
        5 => row_fence(ctx, row),
        6 => row_setup(ctx, row),
        7 => row_commands(ctx, row),
        8 => row_gates(ctx, row),
        9 => row_disciplines(ctx, row),
        10 => row_prohibitions(ctx, row),
        11 => row_deliverable(ctx, row),
        12 => row_report(ctx, row),
        13 => row_correction(ctx, row),
        _ => Err(unknown_row(row)),
    }
}

/// Read one source, turning a miss into this row's own `MissingRow`.
fn need(ctx: &Ctx<'_>, row: &ContractRow, path: &str) -> Result<String, MissingRow> {
    ctx.files.read_text(path).map_err(|because| MissingRow {
        number: row.number,
        source: row.assembled_from.clone(),
        path: path.to_string(),
        because,
    })
}

/// The row is present and its source yielded nothing usable.
fn empty(row: &ContractRow, path: &str, what: &str) -> MissingRow {
    MissingRow {
        number: row.number,
        source: row.assembled_from.clone(),
        path: path.to_string(),
        because: SourceMiss::Unreadable {
            because: format!("read, but it names no {what}"),
        },
    }
}

// ---- row 1 -----------------------------------------------------------

fn row_role(ctx: &Ctx<'_>) -> Result<RowContent, MissingRow> {
    let file = ctx.role.file();
    let heading = ctx
        .role_text
        .lines()
        .find(|l| l.starts_with("# "))
        .unwrap_or_default()
        .to_string();
    // Row 1's source column says the role file's OPENING LINE is the
    // one-line summary — so it is quoted, never composed.
    let one_line = ctx
        .role_text
        .lines()
        .skip_while(|l| !l.starts_with("# "))
        .skip(1)
        .find(|l| !l.trim().is_empty())
        .unwrap_or_default()
        .to_string();
    Ok((
        vec![
            BriefLine::tree("role file", file, file),
            BriefLine::tree("heading", heading, file),
            BriefLine::tree("one line", one_line, file),
        ],
        None,
    ))
}

// ---- row 2 -----------------------------------------------------------

fn row_task(ctx: &Ctx<'_>) -> Result<RowContent, MissingRow> {
    let mut lines = vec![
        BriefLine::tree("task", ctx.task_id.clone(), &ctx.card_path),
        BriefLine::tree("card", ctx.card_path.clone(), &ctx.card_path),
    ];
    for (label, field) in [
        ("title", CardField::Title),
        ("status", CardField::Status),
        ("size", CardField::Size),
        ("feature", CardField::Feature),
        ("milestone", CardField::Milestone),
    ] {
        if let Ok(Some(value)) = ctx.card.scalar(field) {
            lines.push(BriefLine::tree(label, value, &ctx.card_path));
        }
    }
    // The instruction to confirm understanding is the ROLE FILE's, quoted
    // from the reading step rather than paraphrased into this file.
    if let Some(sentence) = sentence_containing(&ctx.role_text, "Confirm your understanding") {
        lines.push(BriefLine::tree(
            "read it IN FULL, then",
            sentence,
            ctx.role.file(),
        ));
    }
    // The boundary a hand-driven bounded read needs, DERIVED. The card's
    // own bytes decide it; no number is written down anywhere.
    if ctx.role == Role::Verifier {
        lines.push(BriefLine::composed(
            "the card's derived notes boundary",
            // **NO NUMBER APPEARS IN THIS TEXT AND THAT IS THE POINT.**
            // The boundary is the card's own heading; a line count here
            // would be the value T-121 refuted in both directions. The
            // discipline the boundary serves is cross-referenced through
            // this line's provenance rather than restated in it.
            "read the card up to, and not including, the first of "
                .to_string()
                + &NOTES_HEADINGS.join(" / ")
                + " — derived from the card's own headings at read time, never written down",
            &[
                "method/roles/verifier.md",
                "docs/tasks/T-121-the-bounded-read-a-verifier-can-actually-perform.md",
            ],
        ));
    }
    Ok((lines, None))
}

// ---- row 3 -----------------------------------------------------------

fn row_read_first(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let mut adapter: Option<(String, Vec<String>)> = None;
    let mut checked: Vec<String> = Vec::new();
    for name in ADAPTER_FILES {
        checked.push(name.to_string());
        if let Ok(text) = ctx.files.read_text(name) {
            let named = docs_named(&text);
            if !named.is_empty() {
                adapter = Some((name.to_string(), named));
                break;
            }
        }
    }
    let (adapter_file, named) = match adapter {
        Some(found) => found,
        None => return Err(empty(row, &checked.join(" / "), "read-first document")),
    };

    // **THE ROLE FILE'S READING STEP IS APPLIED, NOT PRINTED BESIDE THE
    // LIST.** Row 3's source column says so in as many words, and it is
    // the row the table's own rules single out: the adapter is addressed
    // to every seat and the role file to one, so where they differ the
    // ROLE FILE WINS. Both halves are DERIVED from the role file's text;
    // neither is written down here.
    let subtractions = read_subtractions(&ctx.role_text);
    let additions = read_additions(&ctx.role_text);
    let applied: Vec<String> = named
        .iter()
        .filter(|d| !subtractions.contains(d))
        .cloned()
        .chain(additions.iter().cloned())
        .collect();

    let mut lines = vec![BriefLine::tree(
        "the adapter names",
        named.join(" "),
        &adapter_file,
    )];
    for gone in &subtractions {
        lines.push(BriefLine::tree(
            "the role file SUBTRACTS",
            gone.clone(),
            ctx.role.file(),
        ));
    }
    for gained in &additions {
        lines.push(BriefLine::tree(
            "the role file ADDS",
            gained.clone(),
            ctx.role.file(),
        ));
    }
    lines.push(BriefLine::composed(
        "READ FIRST, the role file's step applied",
        applied.join(" "),
        &[adapter_file.as_str(), ctx.role.file()],
    ));
    Ok((lines, None))
}

/// Every `docs/<NAME>.md` the adapter names, first mention wins.
fn docs_named(text: &str) -> Vec<String> {
    let mut found: Vec<String> = Vec::new();
    let bytes: Vec<char> = text.chars().collect();
    let needle: Vec<char> = "docs/".chars().collect();
    let mut i = 0;
    while i + needle.len() <= bytes.len() {
        if bytes[i..i + needle.len()] == needle[..] {
            let mut j = i + needle.len();
            while j < bytes.len()
                && (bytes[j].is_ascii_uppercase()
                    || bytes[j].is_ascii_lowercase()
                    || bytes[j].is_ascii_digit()
                    || bytes[j] == '_'
                    || bytes[j] == '-'
                    || bytes[j] == '.')
            {
                j += 1;
            }
            let candidate: String = bytes[i..j].iter().collect();
            if candidate.ends_with(".md") && !found.contains(&candidate) {
                found.push(candidate);
            }
            i = j;
        } else {
            i += 1;
        }
    }
    found
}

/// Documents this role file removes from the adapter's list.
///
/// DERIVED from the role file's own sentence. `executor.md` writes *"You
/// do NOT read docs/ROADMAP.md"*; a role file with no such sentence
/// subtracts nothing and the adapter's list stands unchanged.
fn read_subtractions(role_text: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for line in role_text.lines() {
        if let Some(at) = line.find("do NOT read ") {
            let rest = &line[at + "do NOT read ".len()..];
            for doc in docs_named(rest).into_iter().take(1) {
                if !out.contains(&doc) {
                    out.push(doc);
                }
            }
        }
    }
    out
}

/// Documents this role file adds to the adapter's list.
///
/// DERIVED the same way, from the role file's own *"ADDITION TO THAT SET
/// IS ..."* sentence and its backticked path.
fn read_additions(role_text: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for line in role_text.lines() {
        if let Some(at) = line.find("ADDITION TO THAT SET IS ") {
            let rest = &line[at + "ADDITION TO THAT SET IS ".len()..];
            if let Some(quoted) = backticked(rest).into_iter().next() {
                if !out.contains(&quoted) {
                    out.push(quoted);
                }
            }
        }
    }
    out
}

/// Every backtick-delimited run in a line, in order.
fn backticked(line: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut rest = line;
    while let Some(open) = rest.find('`') {
        let after = &rest[open + 1..];
        match after.find('`') {
            Some(close) => {
                let inner = &after[..close];
                if !inner.is_empty() {
                    out.push(inner.to_string());
                }
                rest = &after[close + 1..];
            }
            None => break,
        }
    }
    out
}

// ---- row 4 -----------------------------------------------------------

/// The bullet in CONVENTIONS that names this project's lane spellings.
const CONVENTIONS: &str = "docs/CONVENTIONS.md";
const LANE_PROTOCOL: &str = "method/lane-protocol.md";

fn row_lane(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let conventions = need(ctx, row, CONVENTIONS)?;
    let protocol = need(ctx, row, LANE_PROTOCOL)?;
    let spellings = match bullet_containing(&conventions, "integration branch `") {
        Some(text) => text,
        None => return Err(empty(row, CONVENTIONS, "lane spelling bullet")),
    };
    let branch = backticked(&spellings)
        .into_iter()
        .find(|b| b.starts_with("task/"))
        .unwrap_or_default();
    let worktree = backticked(&spellings)
        .into_iter()
        .find(|b| b.contains("../"))
        .unwrap_or_default();
    let create = backticked(&spellings)
        .into_iter()
        .find(|b| b.starts_with("git worktree add"))
        .unwrap_or_default();
    let integration = backticked(&spellings)
        .into_iter()
        .next()
        .unwrap_or_default();
    if branch.is_empty() || worktree.is_empty() || create.is_empty() {
        return Err(empty(row, CONVENTIONS, "complete lane spelling"));
    }

    // **THE COMMAND, NOT THE ANSWER.** The card rules it: this assembler
    // runs no `git`, so the brief carries the command that finds the
    // commit to cut from and the dispatcher runs it. Both of the
    // command's moving parts are file-derived — the integration branch
    // from the bullet above, the marker from the dispatch bullet — and
    // the composition is named as this assembler's own.
    let dispatch_bullet = match bullet_containing(&conventions, "DISPATCH FROM THE LAST CHECKPOINT")
    {
        Some(text) => text,
        None => return Err(empty(row, CONVENTIONS, "dispatch-from bullet")),
    };
    let marker = backticked(&dispatch_bullet)
        .into_iter()
        .find(|b| b.ends_with(':') && b.chars().next().is_some_and(|c| c.is_uppercase()))
        .unwrap_or_else(|| "Checkpoint:".to_string());
    let find_base = format!(
        "git log --first-parent --format='%H %s' {integration} | grep -m1 ' {marker}' | cut -d' ' -f1"
    );

    Ok((
        vec![
            BriefLine::tree("integration branch", integration.clone(), CONVENTIONS),
            BriefLine::tree(
                "branch",
                branch.replace("T-NNN", &ctx.task_id),
                CONVENTIONS,
            ),
            BriefLine::tree(
                "worktree",
                worktree.replace("T-NNN", &ctx.task_id),
                CONVENTIONS,
            ),
            BriefLine::tree(
                "create",
                create.replace("T-NNN", &ctx.task_id),
                CONVENTIONS,
            ),
            BriefLine::composed(
                "the base is a HASH, and this is the command that finds it",
                find_base,
                &[CONVENTIONS],
            ),
            BriefLine::tree("the rule the base obeys", dispatch_bullet, CONVENTIONS),
            BriefLine::tree(
                "lane-protocol rule two",
                numbered_rule(&protocol, 2).unwrap_or_default(),
                LANE_PROTOCOL,
            ),
            BriefLine::tree(
                "lane-protocol rule three",
                numbered_rule(&protocol, 3).unwrap_or_default(),
                LANE_PROTOCOL,
            ),
        ],
        None,
    ))
}

// ---- row 5 -----------------------------------------------------------

const COMPONENTS_DIR: &str = "docs/architecture/components";

fn row_fence(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let touches = ctx.card.list(CardField::Touches).unwrap_or_default();
    let map = slug_map(ctx.files).map_err(|because| MissingRow {
        number: row.number,
        source: row.assembled_from.clone(),
        path: COMPONENTS_DIR.to_string(),
        because,
    })?;
    if map.is_empty() {
        return Err(empty(row, COMPONENTS_DIR, "touch_slugs field"));
    }

    let mut lines = vec![BriefLine::tree(
        "this card's touches, verbatim",
        touches.join(", "),
        &ctx.card_path,
    )];

    // The lane list is a LIVE fact and it is a FILE READ — `read_lanes`
    // opens `<repo>/.git/worktrees` and runs no subprocess.
    let mine = ctx.task_id.clone();
    let mut live: Vec<(String, String, String)> = Vec::new();
    match ctx.scan {
        LaneScan::Scanned { entries, .. } => {
            for entry in entries {
                if let WorktreeEntry::Lane {
                    task_id,
                    branch,
                    worktree_path,
                    exists_on_disk,
                    ..
                } = entry
                {
                    if *exists_on_disk {
                        live.push((task_id.clone(), branch.clone(), worktree_path.clone()));
                    }
                }
            }
        }
        other => {
            // The refusal's SENTENCE has one spelling in this crate —
            // `join::LaneScanRefusal::sentence` — and this row takes it
            // rather than writing a second copy (T-057).
            let sentence = super::join::LaneScanRefusal::of(other)
                .map(|r| r.sentence().to_string())
                .unwrap_or_default();
            lines.push(BriefLine::live(
                "the lane list REFUSED, so no fence can be certified disjoint",
                sentence,
                ".git/worktrees",
            ));
        }
    }
    if live.is_empty() {
        lines.push(BriefLine::live(
            "lanes live right now",
            "none",
            ".git/worktrees",
        ));
    }
    for (task_id, branch, worktree_path) in &live {
        lines.push(BriefLine::live(
            "lane",
            format!("{task_id} on {branch} at {worktree_path}"),
            ".git/worktrees",
        ));
        if task_id == &mine {
            continue;
        }
        match lane_touches(ctx.files, task_id) {
            Some(other) => {
                let shared = shared_paths(&touches, &other, &map);
                lines.push(BriefLine::tree(
                    "lane touches",
                    format!("{task_id}: {}", other.join(", ")),
                    "docs/tasks",
                ));
                lines.push(BriefLine::composed(
                    "disjoint?",
                    if shared.is_empty() {
                        format!("{mine} and {task_id}: DISJOINT")
                    } else {
                        format!(
                            "{mine} and {task_id}: OVERLAP on {}",
                            shared.join(", ")
                        )
                    },
                    &[&ctx.card_path, "docs/tasks", COMPONENTS_DIR],
                ));
            }
            None => {
                // A lane with no card in this checkout has an UNKNOWN
                // fence, which is not an empty one. Nothing can be
                // certified disjoint from it, and saying DISJOINT here
                // would be the FREE-column lie one layer up.
                lines.push(BriefLine::composed(
                    "disjoint?",
                    format!(
                        "{mine} and {task_id}: UNKNOWN — no card in this checkout declares that lane's fence, so nothing can be certified disjoint from it"
                    ),
                    &["docs/tasks"],
                ));
            }
        }
    }

    for (slug, components) in &map {
        lines.push(BriefLine::tree(
            "slug map, from each component file's own touch_slugs FIELD",
            format!(
                "{slug} -> {}",
                components
                    .iter()
                    .map(|c| c.id.clone())
                    .collect::<Vec<_>>()
                    .join(", ")
            ),
            COMPONENTS_DIR,
        ));
    }
    Ok((lines, None))
}

/// One component, as row 5's map reads it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Component {
    pub id: String,
    pub paths: Vec<String>,
}

/// slug -> components, from each component file's own `touch_slugs:`.
///
/// **THE FIELD IS THE AUTHORITY AND THE PROSE BLOCK IS NOT READ.** Row 5's
/// source column rules it: the architecture doc's block is prose that goes
/// stale the day a component is added, so this map never opens it.
pub fn slug_map(files: &dyn FileSource) -> Result<BTreeMap<String, Vec<Component>>, SourceMiss> {
    let mut map: BTreeMap<String, Vec<Component>> = BTreeMap::new();
    for path in files.list_dir(COMPONENTS_DIR)? {
        if !path.ends_with(".md") {
            continue;
        }
        let text = match files.read_text(&path) {
            Ok(text) => text,
            Err(_) => continue,
        };
        let id = frontmatter_scalar(&text, "id").unwrap_or_default();
        if id.is_empty() {
            continue;
        }
        let paths = frontmatter_block_list(&text, "paths");
        for slug in parse_flow_list(&frontmatter_scalar(&text, "touch_slugs").unwrap_or_default()) {
            map.entry(slug).or_default().push(Component {
                id: id.clone(),
                paths: paths.clone(),
            });
        }
    }
    Ok(map)
}

/// Expand one `touches:` entry to the paths it reserves.
fn expand(token: &str, map: &BTreeMap<String, Vec<Component>>) -> Vec<String> {
    match map.get(token) {
        Some(components) => components
            .iter()
            .flat_map(|c| c.paths.iter().cloned())
            .map(|p| normalise(&p))
            .collect(),
        // A bare path token reserves itself.
        None => vec![normalise(token)],
    }
}

/// Trailing slashes and a trailing glob tail are noise.
fn normalise(token: &str) -> String {
    token
        .trim()
        .trim_end_matches("/**")
        .trim_end_matches("/*")
        .trim_end_matches('/')
        .to_string()
}

/// The paths two `touches:` lists BOTH reserve.
///
/// **COMPUTED AS SETS THROUGH THE MAP, never as a string compare of two
/// slugs.** Containment is overlap: `docs` reserves `docs/CONVENTIONS.md`.
fn shared_paths(
    mine: &[String],
    theirs: &[String],
    map: &BTreeMap<String, Vec<Component>>,
) -> Vec<String> {
    let ours: Vec<String> = mine.iter().flat_map(|t| expand(t, map)).collect();
    let others: Vec<String> = theirs.iter().flat_map(|t| expand(t, map)).collect();
    let mut shared: Vec<String> = Vec::new();
    for a in &ours {
        for b in &others {
            if contains_path(a, b) || contains_path(b, a) {
                let hit = if a.len() >= b.len() { a } else { b };
                if !shared.contains(hit) {
                    shared.push(hit.clone());
                }
            }
        }
    }
    shared.sort();
    shared
}

/// `outer` reserves `inner` — equality, or containment at a separator.
fn contains_path(outer: &str, inner: &str) -> bool {
    inner == outer || inner.starts_with(&format!("{outer}/"))
}

/// One live lane's `touches:`, read from its own card.
fn lane_touches(files: &dyn FileSource, task_id: &str) -> Option<Vec<String>> {
    let prefix = format!("{task_id}-");
    let names = files.list_dir("docs/tasks").ok()?;
    let path = names.into_iter().find(|p| {
        p.rsplit('/')
            .next()
            .is_some_and(|name| name.starts_with(&prefix))
    })?;
    let text = files.read_text(&path).ok()?;
    Some(parse_flow_list(
        &frontmatter_scalar(&text, "touches").unwrap_or_default(),
    ))
}

// ---- rows 6 to 10, all out of CONVENTIONS ---------------------------

fn row_setup(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let conventions = need(ctx, row, CONVENTIONS)?;
    let order = bullet_containing(&conventions, "Fresh-clone ORDER")
        .ok_or_else(|| empty(row, CONVENTIONS, "build ORDER bullet"))?;
    let fresh = bullet_containing(&conventions, "A FRESH WORKTREE HAS NOTHING INSTALLED")
        .ok_or_else(|| empty(row, CONVENTIONS, "fresh-worktree ordering"))?;
    Ok((
        vec![
            BriefLine::tree("build order", order, CONVENTIONS),
            BriefLine::tree("what a fresh worktree lacks", fresh, CONVENTIONS),
        ],
        None,
    ))
}

fn row_commands(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let conventions = need(ctx, row, CONVENTIONS)?;
    let mut lines: Vec<BriefLine> = Vec::new();
    for (dir, command) in package_commands(&conventions) {
        lines.push(BriefLine::tree(
            &format!("from {dir}"),
            command,
            CONVENTIONS,
        ));
    }
    if lines.is_empty() {
        return Err(empty(row, CONVENTIONS, "package command bullet"));
    }
    Ok((lines, None))
}

/// Every command CONVENTIONS exposes, VERBATIM, with the package it is
/// run from.
///
/// **THE DOCUMENT'S OWN SHAPE DECIDES THE SET.** A bullet becomes a
/// command list by carrying a `run from <dir>/:` marker; commands are
/// backtick-delimited and separated by the middle dot; and the read stops
/// at the first separated segment that does not OPEN with a backtick.
/// That last clause is the document's own rule, stated in its CI bullet,
/// and it is transcribed rather than re-invented.
pub fn package_commands(conventions: &str) -> Vec<(String, String)> {
    let mut out: Vec<(String, String)> = Vec::new();
    for bullet in top_level_bullets(conventions) {
        let marker = "run from ";
        let Some(at) = bullet.find(marker) else {
            continue;
        };
        let rest = &bullet[at + marker.len()..];
        let Some(colon) = rest.find(':') else { continue };
        let dir = rest[..colon].trim().to_string();
        if dir.is_empty() || dir.contains(' ') {
            continue;
        }
        for segment in rest[colon + 1..].split('\u{00b7}') {
            let segment = segment.trim();
            if !segment.starts_with('`') {
                break;
            }
            if let Some(command) = backticked(segment).into_iter().next() {
                out.push((dir.clone(), command));
            }
        }
    }
    out
}

fn row_gates(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let conventions = need(ctx, row, CONVENTIONS)?;
    let gates = standing_gates(&conventions);
    if gates.is_empty() {
        return Err(empty(row, CONVENTIONS, "standing gate bullet"));
    }
    let mut lines: Vec<BriefLine> = gates
        .into_iter()
        .map(|(name, trigger)| BriefLine::tree(&name, trigger, CONVENTIONS))
        .collect();
    lines.push(BriefLine::composed(
        "and the range the trigger is read over",
        "DERIVE fire or not-owed from your OWN diff — a gate you were told about is a gate nobody checked; the RANGE RULE bullet names which two commits that diff means, and it is a different pair before the merge exists than at it",
        &[CONVENTIONS],
    ));
    Ok((lines, None))
}

/// Each standing gate and its TRIGGER, enumerated from the document.
///
/// A standing gate is a top-level bullet that states a merge-diff trigger
/// in the document's own words. The name is the bullet's leading
/// upper-case run — the shape every one of them is written in.
pub fn standing_gates(conventions: &str) -> Vec<(String, String)> {
    let mut out: Vec<(String, String)> = Vec::new();
    for bullet in top_level_bullets(conventions) {
        let Some(at) = bullet.find("at any merge whose diff touches") else {
            continue;
        };
        let name = leading_caps(&bullet);
        if name.is_empty() {
            continue;
        }
        let tail = &bullet[at..];
        let end = tail.find(" — ").unwrap_or_else(|| {
            tail.find(". ")
                .map(|i| i + 1)
                .unwrap_or(tail.len().min(400))
        });
        out.push((name, tail[..end].trim().to_string()));
    }
    out
}

fn row_disciplines(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let conventions = need(ctx, row, CONVENTIONS)?;
    let named = named_bullets(&conventions);
    if named.is_empty() {
        return Err(empty(row, CONVENTIONS, "named discipline bullet"));
    }
    let mut lines: Vec<BriefLine> = named
        .into_iter()
        .map(|name| BriefLine::tree("named bullet", name, CONVENTIONS))
        .collect();
    lines.push(BriefLine::composed(
        "how to read this row",
        "each bullet in full before you rely on it — this row NAMES them and does not summarise them",
        &[CONVENTIONS],
    ));
    Ok((
        lines,
        // **THE RESIDUAL, SURFACED RATHER THAN PAPERED OVER** (`T-089-s9`).
        Some(
            "row 9's source column is the bare `the project's CONVENTIONS`, where row 8's names the ENUMERATION — `each standing gate is a bullet naming a merge-diff TRIGGER; enumerate those bullets`. Row 9 is row 8's untwinned twin: the mechanism used above (a top-level bullet opening with an upper-case run) is BORROWED from row 8's clause and is not stated by row 9's own source. THE SYMPTOM IS MEASURED RATHER THAN PREDICTED: a named bullet whose name runs through a lower-case word is CUT at that word, and the independent reader in tools/e2e cuts the same one at the same place. Filed as T-112-s2; the original suggestion T-089-s9 was absorbed into T-104 at the seventh triage and its file removed."
                .to_string(),
        ),
    ))
}

fn row_prohibitions(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let conventions = need(ctx, row, CONVENTIONS)?;
    let protocol = need(ctx, row, LANE_PROTOCOL)?;
    let port = bullet_containing(&conventions, "PORT RULE")
        .ok_or_else(|| empty(row, CONVENTIONS, "PORT RULE bullet"))?;
    let mut lines = vec![
        BriefLine::tree("PORT RULE", port, CONVENTIONS),
        BriefLine::tree(
            "never touch the integration branch",
            numbered_rule(&protocol, 4).unwrap_or_default(),
            LANE_PROTOCOL,
        ),
    ];
    // **THE LIVE HALF IS A COMMAND, NOT A READING.** Row 10's source is
    // *the live environment at dispatch*, and the contract's own figure
    // rule says a live fact carries the time it was READ at and is
    // re-read at dispatch rather than trusted from the brief. This
    // assembler runs no subprocess, so it hands over the one command
    // CONVENTIONS permits and the session reads it itself.
    lines.push(BriefLine::composed(
        "the live half — RE-READ IT, never trust a brief's copy",
        "lsof -nP -iTCP:1420 -sTCP:LISTEN",
        &[CONVENTIONS],
    ));
    match ctx.scan {
        LaneScan::Scanned { entries, .. } => {
            for entry in entries {
                let (name, path) = match entry {
                    WorktreeEntry::Lane {
                        task_id,
                        worktree_path,
                        ..
                    } => (task_id.clone(), worktree_path.clone()),
                    WorktreeEntry::Detached { worktree_path, .. } => {
                        ("a detached checkout, NOT a lane".to_string(), worktree_path.clone())
                    }
                    WorktreeEntry::NotALane { worktree_path, .. } => {
                        ("not a lane".to_string(), worktree_path.clone())
                    }
                    WorktreeEntry::Unreadable { name, .. } => (name.clone(), String::new()),
                };
                if name == ctx.task_id {
                    continue;
                }
                lines.push(BriefLine::live(
                    "another checkout exists and is not yours",
                    format!("{path} ({name})"),
                    ".git/worktrees",
                ));
            }
        }
        _ => lines.push(BriefLine::live(
            "the worktree list could not be read, so the other-checkouts half is UNKNOWN",
            "re-read it at dispatch",
            ".git/worktrees",
        )),
    }
    Ok((lines, None))
}

// ---- rows 11 to 13 ---------------------------------------------------

const TASK_FORMAT: &str = "method/tasks/TASK-FORMAT.md";

fn row_deliverable(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    let format = need(ctx, row, TASK_FORMAT)?;
    let protocol = need(ctx, row, LANE_PROTOCOL)?;
    let size = ctx
        .card
        .scalar(CardField::Size)
        .ok()
        .flatten()
        .unwrap_or_default();
    let ceremony = ceremony_row(&format, &size)
        .ok_or_else(|| empty(row, TASK_FORMAT, "ceremony row for this card's size"))?;
    let mut lines = vec![
        BriefLine::tree(
            &format!("ceremony ROW for size {size}"),
            ceremony,
            TASK_FORMAT,
        ),
        BriefLine::tree(
            "who merges and who removes the worktree",
            numbered_rule(&protocol, 6).unwrap_or_default(),
            LANE_PROTOCOL,
        ),
    ];
    // The status to stamp on exit is the ROLE FILE's, quoted.
    if let Some(step) = numbered_rule(&ctx.role_text, 6) {
        lines.push(BriefLine::tree("status to stamp", step, ctx.role.file()));
    }
    Ok((
        lines,
        // **THE SECOND RESIDUAL** (`T-089-s9`), re-derived at this ref
        // rather than taken from the card that named it.
        Some(
            "row 11's three named sources — TASK-FORMAT's ceremony table, lane-protocol.md and the role file — all USE the word `checkpoint` and none of them DEFINES one or says how to make it; the size-S row tells an executor to checkpoint and routes only to lane-protocol rules 4 and 6, neither of which is a definition. The definition lives in method/docs-protocol.md and method/roles/integrator.md, which row 11's source column does not name. Filed as T-112-s2."
                .to_string(),
        ),
    ))
}

/// The ceremony table's row for one size letter.
fn ceremony_row(task_format: &str, size: &str) -> Option<String> {
    if size.is_empty() {
        return None;
    }
    for line in task_format.lines() {
        let trimmed = line.trim();
        if !trimmed.starts_with('|') {
            continue;
        }
        let cells = table_cells(trimmed);
        if cells.len() != 2 {
            continue;
        }
        // The first cell is the size, possibly qualified ("S, touching
        // shipped code"). The letter alone does not decide the row, which
        // is what the table's own note warns about.
        let head = cells[0].trim();
        if head == size || head.starts_with(&format!("{size},")) {
            return Some(format!("{head} | {}", cells[1]));
        }
    }
    None
}

fn row_report(ctx: &Ctx<'_>, _row: &ContractRow) -> Result<RowContent, MissingRow> {
    let mut lines: Vec<BriefLine> = section_bullets(&ctx.role_text, "## The report")
        .into_iter()
        .map(|b| BriefLine::tree("report", b, ctx.role.file()))
        .collect();
    if lines.is_empty() {
        lines.push(BriefLine::tree(
            "report",
            "this role file states no `## The report` section — report to the role that dispatched you and to whoever integrates",
            ctx.role.file(),
        ));
    }
    Ok((lines, None))
}

fn row_correction(ctx: &Ctx<'_>, row: &ContractRow) -> Result<RowContent, MissingRow> {
    // **ROW 13'S SOURCE IS THIS ROW**, which the contract states in as
    // many words — so the clause is the table's own second column,
    // quoted, and never a sentence this file writes.
    let mut lines = vec![BriefLine::tree(
        "the clause, from the row itself",
        row.carries.clone(),
        CONTRACT_FILE,
    )];
    for needle in [
        "A brief is evidence, never authority",
        "Every figure carries the ref it was measured at",
    ] {
        if let Some(bullet) = bullet_containing(&ctx.role_text, needle) {
            lines.push(BriefLine::tree("and the rule behind it", bullet, CONTRACT_FILE));
        }
    }
    Ok((lines, None))
}

// ---------------------------------------------------------------------
// Small readers over markdown, shared by the rows above.
// ---------------------------------------------------------------------

/// Every top-level `- ` bullet, folded into one line each.
fn top_level_bullets(text: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut current: Option<String> = None;
    for line in text.lines() {
        if let Some(rest) = line.strip_prefix("- ") {
            if let Some(done) = current.take() {
                out.push(done);
            }
            current = Some(rest.trim().to_string());
        } else if line.starts_with(char::is_whitespace) {
            if let Some(buf) = current.as_mut() {
                buf.push(' ');
                buf.push_str(line.trim());
            }
        } else if !line.trim().is_empty() && !line.starts_with('-') {
            if let Some(done) = current.take() {
                out.push(done);
            }
        }
    }
    if let Some(done) = current {
        out.push(done);
    }
    out
}

/// The first top-level bullet containing a needle, folded.
fn bullet_containing(text: &str, needle: &str) -> Option<String> {
    top_level_bullets(text)
        .into_iter()
        .find(|b| b.contains(needle))
}

/// A bullet's leading upper-case run — how every named bullet opens.
fn leading_caps(bullet: &str) -> String {
    let mut out = String::new();
    for ch in bullet.chars() {
        if ch.is_lowercase() {
            break;
        }
        out.push(ch);
    }
    let trimmed = out.trim_end_matches(|c: char| !c.is_alphanumeric());
    // Two words at minimum: a single capital is an ordinary sentence start.
    if trimmed.split_whitespace().count() < 2 {
        return String::new();
    }
    trimmed.to_string()
}

/// Every top-level bullet that opens with an upper-case run — the shape a
/// NAMED discipline is written in here.
fn named_bullets(text: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for bullet in top_level_bullets(text) {
        let name = leading_caps(&bullet);
        if !name.is_empty() && !out.contains(&name) {
            out.push(name);
        }
    }
    out
}

/// A `N. ` numbered rule, folded into one line.
fn numbered_rule(text: &str, number: u32) -> Option<String> {
    let head = format!("{number}. ");
    let mut buf: Option<String> = None;
    for line in text.lines() {
        if let Some(rest) = line.strip_prefix(&head) {
            buf = Some(rest.trim().to_string());
            continue;
        }
        if buf.is_some() {
            if line.starts_with(char::is_whitespace) && !line.trim().is_empty() {
                if let Some(b) = buf.as_mut() {
                    b.push(' ');
                    b.push_str(line.trim());
                }
            } else if line.trim().is_empty() {
                continue;
            } else {
                break;
            }
        }
    }
    buf
}

/// The `- **Name** — ...` bullets under one `## Heading`, names only.
fn section_bullets(text: &str, heading: &str) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut inside = false;
    for line in text.lines() {
        if line.trim_end() == heading {
            inside = true;
            continue;
        }
        if inside && line.starts_with("## ") {
            break;
        }
        if inside {
            if let Some(rest) = line.strip_prefix("- **") {
                if let Some(end) = rest.find("**") {
                    out.push(rest[..end].to_string());
                }
            }
        }
    }
    out
}

/// The sentence containing a needle, folded across the document's wrap.
fn sentence_containing(text: &str, needle: &str) -> Option<String> {
    let flat: String = text
        .lines()
        .map(|l| l.trim())
        .collect::<Vec<_>>()
        .join(" ");
    let at = flat.find(needle)?;
    let start = flat[..at].rfind(". ").map(|i| i + 2).unwrap_or(0);
    let end = flat[at..]
        .find(". ")
        .map(|i| at + i + 1)
        .unwrap_or(flat.len());
    Some(flat[start..end].trim().to_string())
}

/// One scalar frontmatter field.
fn frontmatter_scalar(text: &str, key: &str) -> Option<String> {
    let head = format!("{key}:");
    let mut lines = text.lines();
    if lines.next().map(|l| l.trim_end()) != Some("---") {
        return None;
    }
    for line in lines {
        if line.trim_end() == "---" {
            return None;
        }
        if let Some(rest) = line.strip_prefix(&head) {
            return Some(strip_comment(rest).trim().to_string());
        }
    }
    None
}

/// A block-list frontmatter field: `key:` then `  - value` lines.
fn frontmatter_block_list(text: &str, key: &str) -> Vec<String> {
    let head = format!("{key}:");
    let mut out: Vec<String> = Vec::new();
    let mut inside = false;
    let mut lines = text.lines();
    if lines.next().map(|l| l.trim_end()) != Some("---") {
        return out;
    }
    for line in lines {
        if line.trim_end() == "---" {
            break;
        }
        if line.starts_with(&head) {
            inside = true;
            continue;
        }
        if inside {
            let trimmed = line.trim();
            if trimmed.starts_with('#') {
                continue;
            }
            if let Some(value) = trimmed.strip_prefix("- ") {
                out.push(strip_comment(value).trim().to_string());
            } else if !line.starts_with(char::is_whitespace) {
                break;
            }
        }
    }
    out
}

// ---------------------------------------------------------------------
// The one entry point a Tauri command would wrap.
// ---------------------------------------------------------------------

/// Assemble a brief for one card in one project.
///
/// **THIS IS THE COMMAND'S SHAPE.** One task id and one role cross the
/// boundary — both are strings the board already holds — and the project
/// root is the app's own, never the webview's, which is what keeps the
/// registered command a zero-path one under ADR-012.
///
/// The registration itself is `app-shell`'s and is routed (`T-112-s1`);
/// see this module's header.
pub fn brief_for_card(project_root: &Path, task_id: &str, role: Role) -> BriefOutcome {
    let files = DiskFiles::new(project_root);
    let path = match files.list_dir("docs/tasks") {
        Ok(names) => names.into_iter().find(|p| {
            p.rsplit('/')
                .next()
                .is_some_and(|name| name.starts_with(&format!("{task_id}-")))
        }),
        Err(_) => None,
    };
    let Some(path) = path else {
        return BriefOutcome::NoSuchCard {
            task_id: task_id.to_string(),
        };
    };
    let Ok(text) = files.read_text(&path) else {
        return BriefOutcome::NoSuchCard {
            task_id: task_id.to_string(),
        };
    };
    let card = FrontmatterCard::parse(&path, &text);
    let scan = super::lanes::read_lanes(project_root);
    assemble(&files, &card, role, &scan)
}

// ---------------------------------------------------------------------
// PINS.
// ---------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dispatch::fixtures;
    use std::panic::{catch_unwind, AssertUnwindSafe};

    // ---- the fixture project -----------------------------------------
    //
    // **NOTHING BELOW READS THIS REPOSITORY'S OWN `.git`**, for the
    // reason `fixtures.rs`'s header gives: several lanes are live in this
    // project at any moment, so a body that read the live worktree list
    // would go red on a colleague's work and green again at their merge.
    // The two live-tree bodies at the foot read docs/ and method/ ONLY —
    // the same surface `cargo test` already reads docs/CONVENTIONS.md
    // over — and they are marked as such.

    /// A source with nothing in it — every read is a miss.
    struct NoFiles;

    impl FileSource for NoFiles {
        fn read_text(&self, _rel: &str) -> Result<String, SourceMiss> {
            Err(SourceMiss::NotFound)
        }
        fn list_dir(&self, _rel: &str) -> Result<Vec<String>, SourceMiss> {
            Err(SourceMiss::NotFound)
        }
    }

    /// The real repository root, for the two live-tree bodies.
    fn repo_root() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("..")
            .join("..")
            .canonicalize()
            .expect("the repository root is two directories above app/src-tauri")
    }

    fn live_files() -> DiskFiles {
        DiskFiles::new(&repo_root())
    }

    /// The one card every body below assembles for, unless it says
    /// otherwise.
    fn a_card() -> FrontmatterCard {
        FrontmatterCard::parse(
            "docs/tasks/T-900-a-fixture-card.md",
            concat!(
                "---\n",
                "id: T-900\n",
                "title: A fixture card\n",
                "feature: F-04\n",
                "milestone: 4\n",
                "size: M\n",
                "status: building\n",
                "touches: [app-dispatch]\n",
                "---\n",
                "\n",
                "Body text the assembler must never read.\n",
                "\n",
                "## Implementation notes\n",
                "\n",
                "The executor's reasoning, which a verifier may not see.\n",
            ),
        )
    }

    fn no_lanes() -> LaneScan {
        LaneScan::Scanned {
            entries: Vec::new(),
            truncated: false,
        }
    }

    fn assembled(outcome: BriefOutcome) -> Brief {
        match outcome {
            BriefOutcome::Assembled { brief } => brief,
            other => panic!("expected an assembled brief, got {other:?}"),
        }
    }

    // ---- the contract is READ, never transcribed ---------------------

    #[test]
    fn the_row_set_follows_the_document_rather_than_a_constant_here() {
        let live = live_files();
        let text = live
            .read_text(CONTRACT_FILE)
            .expect("the role file carrying the contract");
        let rows = read_contract(&text).expect("a readable contract table");
        // The COUNT is not pinned — the row set follows the document, and
        // a number here would be the transcription this module exists to
        // avoid. What IS pinned is that the numbers are the document's
        // own, contiguous from one, and that every row carries all three
        // of its columns.
        assert!(rows.len() >= 2, "a contract with fewer than two rows is not a table");
        for (index, row) in rows.iter().enumerate() {
            assert_eq!(row.number as usize, index + 1, "row numbers are contiguous");
            assert!(!row.carries.is_empty(), "row {} carries nothing", row.number);
            assert!(
                !row.assembled_from.is_empty(),
                "row {} names no source",
                row.number
            );
            assert!(
                !row.if_absent.is_empty(),
                "row {} says nothing about its absence",
                row.number
            );
        }
    }

    #[test]
    fn a_contract_table_this_module_cannot_read_is_an_error_never_an_empty_contract() {
        // No table at all.
        assert_eq!(read_contract("# Role: nobody\n\nprose"), Err(ContractDefect::NoTable));
        // A header and no data rows: the shape that would otherwise make
        // every downstream "every row is present" assertion vacuously
        // true (poison shape TEN).
        assert_eq!(
            read_contract("| # | The brief carries | Assembled from | If it is absent |\n|---|---|---|---|\n"),
            Err(ContractDefect::EmptyTable)
        );
        // A row whose first cell is not a number.
        assert_eq!(
            read_contract(
                "| # | The brief carries | Assembled from | If it is absent |\n|---|---|---|---|\n| one | Role | roles/x.md | it guesses |\n"
            ),
            Err(ContractDefect::UnnumberedRow { text: "one".to_string() })
        );
    }

    // ---- every row accounted for -------------------------------------

    #[test]
    fn every_row_of_the_live_contract_is_present_and_non_empty_in_the_brief() {
        // **THE CRITERION, AGAINST THE LIVE DOCUMENT.** The row set is
        // the file's; the assertion is that not one of them comes back
        // empty and that the set is exactly the document's.
        let live = live_files();
        let contract = read_contract(&live.read_text(CONTRACT_FILE).expect("contract"))
            .expect("a readable contract");
        let brief = assembled(assemble(&live, &a_card(), Role::Executor, &no_lanes()));
        assert_eq!(
            brief.rows.iter().map(|r| r.number).collect::<Vec<_>>(),
            contract.iter().map(|r| r.number).collect::<Vec<_>>(),
            "the brief's rows are the document's rows"
        );
        for row in &brief.rows {
            assert!(
                !row.lines.is_empty(),
                "row {} came back with no content",
                row.number
            );
            for line in &row.lines {
                assert!(
                    !line.text.trim().is_empty(),
                    "row {} line `{}` is empty",
                    row.number,
                    line.label
                );
            }
        }
    }

    #[test]
    fn a_row_the_document_grows_is_reported_by_number_and_source_rather_than_dropped() {
        // **THE ROW SET FOLLOWS THE DOCUMENT, SO THE DOCUMENT CAN GROW A
        // ROW THIS MODULE HAS NO ASSEMBLER FOR** — and the answer is the
        // criterion's: which row, which source, never a silent omission
        // and never an invented value.
        let live = live_files();
        let text = live.read_text(CONTRACT_FILE).expect("contract");
        let last = text
            .lines()
            .filter(|l| l.trim_start().starts_with("| 1"))
            .next_back()
            .expect("the table's last numbered row")
            .to_string();
        let grown = format!(
            "{last}\n| 14 | **A row nobody wrote an assembler for** | some future source | the session guesses |"
        );
        let contract = text.replacen(&last, &grown, 1);
        assert_ne!(contract, text, "the mutation must actually land");
        let files = OverlayFiles {
            inner: live_files(),
            path: CONTRACT_FILE.to_string(),
            text: contract,
        };
        match assemble(&files, &a_card(), Role::Executor, &no_lanes()) {
            BriefOutcome::Unassemblable { rows } => {
                assert!(
                    rows.iter().any(|r| r.number == 14
                        && r.source == "some future source"),
                    "the fourteenth row is named with its own source: {rows:?}"
                );
            }
            other => panic!("expected Unassemblable, got {other:?}"),
        }
    }

    #[test]
    fn a_source_a_row_names_and_cannot_read_names_the_row_and_the_source() {
        // A row whose named file is gone takes the WHOLE answer down:
        // a brief with a silently missing gate list is worse than no
        // brief. Both dispositions are asserted, so the body is not
        // satisfied by "nothing was produced".
        let live = live_files();
        let whole = DiskFiles::new(&repo_root());
        assert!(
            matches!(
                assemble(&whole, &a_card(), Role::Executor, &no_lanes()),
                BriefOutcome::Assembled { .. }
            ),
            "the positive control: with every source present this assembles"
        );
        let files = RefusingFiles {
            inner: live,
            refuse: CONVENTIONS.to_string(),
        };
        match assemble(&files, &a_card(), Role::Executor, &no_lanes()) {
            BriefOutcome::Unassemblable { rows } => {
                assert!(
                    rows.iter().all(|r| r.path == CONVENTIONS),
                    "every missing row names the file it tried: {rows:?}"
                );
                assert!(
                    rows.iter().all(|r| !r.source.is_empty()),
                    "every missing row quotes its own source column"
                );
                // Rows 6 to 10 are CONVENTIONS' — the answer names all of
                // them rather than stopping at the first.
                for number in [6, 7, 8, 9, 10] {
                    assert!(
                        rows.iter().any(|r| r.number == number),
                        "row {number} is one of CONVENTIONS' and is missing from {rows:?}"
                    );
                }
            }
            other => panic!("expected Unassemblable, got {other:?}"),
        }
    }

    /// A source that answers one path with substituted text and
    /// delegates every other to disk.
    struct OverlayFiles {
        inner: DiskFiles,
        path: String,
        text: String,
    }
    impl FileSource for OverlayFiles {
        fn read_text(&self, rel: &str) -> Result<String, SourceMiss> {
            if rel == self.path {
                return Ok(self.text.clone());
            }
            self.inner.read_text(rel)
        }
        fn list_dir(&self, rel: &str) -> Result<Vec<String>, SourceMiss> {
            self.inner.list_dir(rel)
        }
    }

    /// A source that refuses exactly one path.
    struct RefusingFiles {
        inner: DiskFiles,
        refuse: String,
    }
    impl FileSource for RefusingFiles {
        fn read_text(&self, rel: &str) -> Result<String, SourceMiss> {
            if rel == self.refuse {
                return Err(SourceMiss::NotFound);
            }
            self.inner.read_text(rel)
        }
        fn list_dir(&self, rel: &str) -> Result<Vec<String>, SourceMiss> {
            self.inner.list_dir(rel)
        }
    }

    #[test]
    fn a_contract_file_that_cannot_be_read_is_its_own_answer() {
        let files = NoFiles;
        assert_eq!(
            assemble(&files, &a_card(), Role::Executor, &no_lanes()),
            BriefOutcome::ContractMissing {
                source: CONTRACT_FILE.to_string(),
                because: SourceMiss::NotFound,
            }
        );
    }

    // ---- assembled from FILES, never from what a model said -----------

    /// A card that PANICS on any field the assembler is not entitled to.
    struct HostileCard {
        inner: FrontmatterCard,
        /// Fields this double refuses even though they ARE entitled —
        /// the positive control that keeps the pin from being vacuous.
        also_refuse: Vec<CardField>,
    }

    impl HostileCard {
        fn refuses_unentitled() -> Self {
            Self {
                inner: a_card(),
                also_refuse: Vec::new(),
            }
        }
        fn also_refusing(field: CardField) -> Self {
            Self {
                inner: a_card(),
                also_refuse: vec![field],
            }
        }
        fn guard(&self, field: CardField) {
            if !entitled(field) || self.also_refuse.contains(&field) {
                panic!("the assembler read {field:?}, which it is not entitled to");
            }
        }
    }

    impl CardSource for HostileCard {
        fn scalar(&self, field: CardField) -> Result<Option<String>, SourceMiss> {
            self.guard(field);
            self.inner.scalar(field)
        }
        fn list(&self, field: CardField) -> Result<Vec<String>, SourceMiss> {
            self.guard(field);
            self.inner.list(field)
        }
    }

    #[test]
    fn a_card_that_refuses_every_unentitled_field_still_yields_a_brief() {
        // **T-028's SHAPE, ONE SLICE OVER.** The brief is assembled from
        // FILES; a field the assembler is not entitled to is one it never
        // asks for, and the double turns any such ask into a panic. A
        // brief coming back is the proof.
        let live = live_files();
        let brief = assembled(assemble(
            &live,
            &HostileCard::refuses_unentitled(),
            Role::Executor,
            &no_lanes(),
        ));
        assert_eq!(brief.task_id, "T-900");
        assert!(!brief.rows.is_empty());
    }

    #[test]
    fn and_that_double_really_does_refuse_a_positive_control() {
        // **A NEGATIVE ASSERTION NEEDS A POSITIVE CONTROL.** The body
        // above is satisfied equally by a working guard and by a guard
        // that never fires. Refuse a field the assembler DOES read, and
        // the same call must blow up.
        let live = live_files();
        let hostile = HostileCard::also_refusing(CardField::Title);
        let outcome = catch_unwind(AssertUnwindSafe(|| {
            assemble(&live, &hostile, Role::Executor, &no_lanes())
        }));
        assert!(
            outcome.is_err(),
            "refusing an ENTITLED field must reach the assembler and panic"
        );
    }

    #[test]
    fn the_entitled_set_excludes_the_executors_reasoning_for_every_role() {
        // The set is stated once and this is the assertion that keeps it
        // honest: no role can read the notes, because the set is not
        // parameterised by role at all.
        assert!(!entitled(CardField::ImplementationNotes));
        assert!(!entitled(CardField::Verdicts));
        assert!(!entitled(CardField::Body));
        assert!(entitled(CardField::Id));
    }

    // ---- the verifier's brief withholds by construction ---------------

    /// A card whose implementation-notes section throws on read.
    struct NotesThrowCard(FrontmatterCard);

    impl CardSource for NotesThrowCard {
        fn scalar(&self, field: CardField) -> Result<Option<String>, SourceMiss> {
            if field == CardField::ImplementationNotes {
                panic!("the assembler read the executor's implementation notes");
            }
            self.0.scalar(field)
        }
        fn list(&self, field: CardField) -> Result<Vec<String>, SourceMiss> {
            if field == CardField::ImplementationNotes {
                panic!("the assembler read the executor's implementation notes");
            }
            self.0.list(field)
        }
    }

    #[test]
    fn a_card_whose_notes_throw_on_read_still_yields_a_verifier_brief() {
        // **THE EXCLUSION, PROVED BY CONSTRUCTION.** `verifier.md`
        // forbids the verifier the executor's reasoning and `executor.md`
        // step 5 writes that reasoning into the file the verifier reads.
        // Both sentences hold here because this assembler never opens the
        // section: the double turns an open into a panic and a verifier
        // brief comes back anyway.
        let live = live_files();
        let brief = assembled(assemble(
            &live,
            &NotesThrowCard(a_card()),
            Role::Verifier,
            &no_lanes(),
        ));
        assert_eq!(brief.role, Role::Verifier);
        assert_eq!(brief.role_file, "method/roles/verifier.md");
        assert_eq!(brief.marker.as_deref(), Some(MARKER));
        // And nothing in the assembled text carries the notes' bytes.
        let rendered: String = brief
            .rows
            .iter()
            .flat_map(|r| r.lines.iter())
            .map(|l| l.text.clone())
            .collect::<Vec<_>>()
            .join("\n");
        assert!(
            !rendered.contains("The executor's reasoning"),
            "the notes' own bytes reached the brief"
        );
    }

    #[test]
    fn the_notes_boundary_is_derived_from_the_card_and_is_right_in_both_directions() {
        // **THE CORRECTED CRITERION.** A fixed line number reads the
        // reasoning on a card whose notes come early and truncates the
        // criteria on one whose notes come late; T-121 measured both.
        // A derived boundary cannot be wrong on either side.
        let early = format!("---\nid: T-1\n---\n{}\n## Implementation notes\nx\n", "body");
        let late = format!(
            "---\nid: T-2\n---\n{}\n## Implementation notes\nx\n",
            "body\n".repeat(400)
        );
        assert_eq!(notes_boundary(&early), Some(5));
        assert_eq!(notes_boundary(&late), Some(405));
        // `## Verdicts` first is the other heading the criterion names.
        assert_eq!(
            notes_boundary("---\nid: T-3\n---\n\n## Verdicts\nx\n"),
            Some(5)
        );
        // A card with neither has no boundary — and `None` is not zero.
        assert_eq!(notes_boundary("---\nid: T-4\n---\n\nbody\n"), None);
        // BOTH headings, notes first: the boundary is the FIRST, or the
        // bounded read runs straight through the reasoning it exists to
        // stop at — V-M2 (.find -> .filter(..).last()) survived every
        // single-heading fixture above.
        assert_eq!(
            notes_boundary("---\nid: T-5\n---\n\n## Implementation notes\nx\n\n## Verdicts\ny\n"),
            Some(5)
        );
        // And the other order, so the assertion is about FIRST and not
        // about which heading it is.
        assert_eq!(
            notes_boundary("---\nid: T-6\n---\n\n## Verdicts\ny\n\n## Implementation notes\nx\n"),
            Some(5)
        );
    }

    #[test]
    fn a_verifier_brief_names_the_derived_boundary_and_never_a_number() {
        let live = live_files();
        let brief = assembled(assemble(&live, &a_card(), Role::Verifier, &no_lanes()));
        let row2 = brief.rows.iter().find(|r| r.number == 2).expect("row 2");
        let line = row2
            .lines
            .iter()
            .find(|l| l.label.contains("boundary"))
            .expect("the verifier's brief carries the derived boundary");
        assert!(line.text.contains("## Implementation notes"));
        assert!(line.text.contains("## Verdicts"));
        assert!(
            !line.text.chars().any(|c| c.is_ascii_digit()),
            "the boundary is derived, so the brief states no line number: {}",
            line.text
        );
        // And an executor's brief does not carry it at all.
        let exec = assembled(assemble(&live, &a_card(), Role::Executor, &no_lanes()));
        let row2 = exec.rows.iter().find(|r| r.number == 2).expect("row 2");
        assert!(row2.lines.iter().all(|l| !l.label.contains("boundary")));
    }

    // ---- row 3's applied reading step --------------------------------

    #[test]
    fn row_three_applies_the_role_files_reading_step_rather_than_printing_it_beside_the_list() {
        // **THE ROW THE TABLE'S OWN RULES SINGLE OUT.** The adapter is
        // addressed to every seat and the role file to one, so where they
        // differ the ROLE FILE WINS — and the failure class is a brief
        // whose every row is individually faithful and which is
        // internally inconsistent. Here the adapter names ROADMAP and
        // the executor's role file subtracts it.
        let live = live_files();
        let adapter = live.read_text("CLAUDE.md").expect("the root adapter");
        assert!(
            docs_named(&adapter).contains(&"docs/ROADMAP.md".to_string()),
            "the positive control: the adapter really does name ROADMAP"
        );
        let brief = assembled(assemble(&live, &a_card(), Role::Executor, &no_lanes()));
        let row3 = brief.rows.iter().find(|r| r.number == 3).expect("row 3");
        let applied = row3
            .lines
            .iter()
            .find(|l| l.label.starts_with("READ FIRST"))
            .expect("the applied list");
        assert!(
            !applied.text.contains("docs/ROADMAP.md"),
            "the role file's subtraction was not applied: {}",
            applied.text
        );
        assert!(
            applied.text.contains("docs/STATE.md"),
            "the rest of the adapter's list survives: {}",
            applied.text
        );
        assert!(
            applied.text.contains("TASK-FORMAT.md"),
            "the role file's own addition is applied: {}",
            applied.text
        );
    }

    #[test]
    fn the_subtraction_and_addition_are_derived_from_the_role_file_and_are_not_vacuous() {
        // Both halves are read out of the document, so a role file that
        // subtracts nothing leaves the adapter's list alone — which is
        // what makes the assertion above evidence rather than a constant.
        assert_eq!(
            read_subtractions("You do NOT read docs/ROADMAP.md, deliberately."),
            vec!["docs/ROADMAP.md".to_string()]
        );
        assert!(read_subtractions("You read everything.").is_empty());
        assert_eq!(
            read_additions("YOUR ONE ADDITION TO THAT SET IS `tasks/TASK-FORMAT.md`'s TABLE"),
            vec!["tasks/TASK-FORMAT.md".to_string()]
        );
        assert!(read_additions("no additions here").is_empty());
    }

    // ---- row 4: the command, never the answer ------------------------

    #[test]
    fn row_four_carries_the_command_that_finds_the_base_and_not_a_resolved_hash() {
        let live = live_files();
        let brief = assembled(assemble(&live, &a_card(), Role::Executor, &no_lanes()));
        let row4 = brief.rows.iter().find(|r| r.number == 4).expect("row 4");
        let base = row4
            .lines
            .iter()
            .find(|l| l.label.contains("command that finds it"))
            .expect("the cut-commit command");
        assert!(base.text.starts_with("git log --first-parent"));
        assert!(base.text.contains("Checkpoint:"));
        // A resolved answer would be a 40-hex run. There is none, in any
        // line of the row — the card rules it and this is the assertion.
        for line in &row4.lines {
            assert!(
                !looks_like_a_commit_hash(&line.text),
                "row 4 carries a resolved hash, which this card forbids: {}",
                line.text
            );
        }
        // The lane spellings ARE resolved, from the document, with this
        // card's id substituted.
        assert!(row4
            .lines
            .iter()
            .any(|l| l.label == "branch" && l.text.starts_with("task/T-900-")));
        assert!(row4
            .lines
            .iter()
            .any(|l| l.label == "worktree" && l.text.contains("nputer-T-900")));
    }

    /// A 40-hex run anywhere in the text.
    fn looks_like_a_commit_hash(text: &str) -> bool {
        let chars: Vec<char> = text.chars().collect();
        let mut run = 0usize;
        for ch in chars {
            if ch.is_ascii_hexdigit() {
                run += 1;
                if run >= 40 {
                    return true;
                }
            } else {
                run = 0;
            }
        }
        false
    }

    #[test]
    fn no_subprocess_in_this_file() {
        // `lanes.rs` sweeps its own source for the process API and this
        // module owes the same proof, because the card bans a git
        // subprocess by name. The sweep is shown capable of failing: the
        // needle it looks for is present in this very assertion's own
        // fixture line below.
        let source = include_str!("brief.rs");
        let needles = ["std::process", "Command::new"];
        let planted = "std::process::Command::new";
        assert!(
            needles.iter().any(|n| planted.contains(n)),
            "the sweep's needles must be able to match something"
        );
        // The scan skips this body's own text by cutting the file at the
        // marker below, exactly as `lanes.rs` does for its own sweep.
        let production = source
            .split("// ---------------------------------------------------------------------\n// PINS.")
            .next()
            .expect("the production half");
        for needle in needles {
            assert!(
                !production.contains(needle),
                "the production half of this module reaches for {needle}"
            );
        }
    }

    // ---- row 5: the fence, as sets through the map -------------------

    #[test]
    fn row_five_computes_disjointness_as_sets_through_the_slug_map() {
        let live = live_files();
        let map = slug_map(&live).expect("the slug map");
        assert!(
            map.contains_key("app-dispatch") && map.contains_key("app-board"),
            "the positive control: the live registry declares these slugs"
        );
        // Two slugs that expand to different components are disjoint…
        assert!(shared_paths(
            &["app-dispatch".to_string()],
            &["app-map".to_string()],
            &map
        )
        .is_empty());
        // …and one that expands to a path the other CONTAINS is not,
        // which is why this is a set comparison and not a string one.
        let overlap = shared_paths(
            &["app-dispatch".to_string()],
            &["app/src-tauri/src/dispatch/brief.rs".to_string()],
            &map,
        );
        assert!(
            !overlap.is_empty(),
            "a bare path inside a slug's territory overlaps it: {overlap:?}"
        );
    }

    #[test]
    fn a_lane_whose_card_this_checkout_lacks_is_unknown_and_never_disjoint() {
        // **THE `FREE` COLUMN'S LIE, ONE LAYER UP.** A worktree on a task
        // branch that no card in this checkout declares has an UNKNOWN
        // fence, not an empty one, and nothing can be certified disjoint
        // from it.
        let live = live_files();
        let scan = LaneScan::Scanned {
            entries: vec![WorktreeEntry::Lane {
                name: "nputer-T-999".to_string(),
                task_id: "T-999".to_string(),
                branch: "task/T-999-no-card".to_string(),
                worktree_path: "/tmp/nputer-T-999".to_string(),
                exists_on_disk: true,
            }],
            truncated: false,
        };
        let brief = assembled(assemble(&live, &a_card(), Role::Executor, &scan));
        let row5 = brief.rows.iter().find(|r| r.number == 5).expect("row 5");
        let verdict = row5
            .lines
            .iter()
            .find(|l| l.label == "disjoint?")
            .expect("a disjointness verdict for the live lane");
        assert!(
            verdict.text.contains("UNKNOWN"),
            "expected UNKNOWN, got {}",
            verdict.text
        );
        assert!(
            !verdict.text.contains("DISJOINT"),
            "a lane with no card must never be reported disjoint"
        );
    }

    // ---- rows 7 and 8: the document's own shape ----------------------

    #[test]
    fn the_commands_are_transcribed_verbatim_from_the_per_package_bullets() {
        let live = live_files();
        let conventions = live.read_text(CONVENTIONS).expect("CONVENTIONS");
        let commands = package_commands(&conventions);
        assert!(!commands.is_empty(), "the derivation is not vacuous");
        // Four packages carry command bullets on this tree; the count is
        // deliberately NOT pinned (it is a figure with no keeper). What
        // is pinned is that the commands are the document's own strings.
        assert!(commands
            .iter()
            .any(|(dir, cmd)| dir == "lib/parser/" && cmd == "npm ci"));
        assert!(commands
            .iter()
            .any(|(dir, cmd)| dir == "app/" && cmd == "npm test"));
        assert!(commands
            .iter()
            .any(|(dir, cmd)| dir == "app/src-tauri/" && cmd == "cargo test"));
        // **THE MIDDLE-DOT RULE, TRANSCRIBED RATHER THAN RE-INVENTED**:
        // the read stops at the first separated segment that does not
        // open with a backtick.
        let synthetic = "- x, run from x/: `one` \u{00b7} `two` \u{00b7} (a parenthetical) \u{00b7} `three`\n";
        let got = package_commands(synthetic);
        assert_eq!(
            got.iter().map(|(_, c)| c.as_str()).collect::<Vec<_>>(),
            vec!["one", "two"],
            "everything behind the first non-backtick segment is dropped, exactly as the document says"
        );
    }

    #[test]
    fn the_gates_are_enumerated_from_the_document_and_a_removed_gate_is_not_still_named() {
        let live = live_files();
        let conventions = live.read_text(CONVENTIONS).expect("CONVENTIONS");
        let gates = standing_gates(&conventions);
        let names: Vec<String> = gates.iter().map(|(n, _)| n.clone()).collect();
        assert!(
            names.iter().any(|n| n.contains("BOOT GATE")),
            "the enumeration finds the document's own gates: {names:?}"
        );
        assert!(
            gates.iter().all(|(_, trigger)| trigger.contains("at any merge")),
            "every gate comes back with its TRIGGER, not just its name"
        );
        // A gate the document loses is not still named — the derivation
        // runs over the text it is given, so removing a bullet removes
        // the gate.
        let without = conventions.replace("at any merge whose diff touches `app/src-tauri/**`", "at some other time");
        let after: Vec<String> = standing_gates(&without)
            .iter()
            .map(|(n, _)| n.clone())
            .collect();
        assert!(
            !after.iter().any(|n| n.contains("BOOT GATE")),
            "a gate whose trigger left the document is still named: {after:?}"
        );
        assert!(
            after.len() < names.len(),
            "the mutation really did remove one"
        );
    }

    // ---- rows 11 and 12 ----------------------------------------------

    #[test]
    fn the_ceremony_row_is_read_from_the_table_and_the_letter_alone_does_not_decide_it() {
        let live = live_files();
        let format = live.read_text(TASK_FORMAT).expect("TASK-FORMAT");
        let m = ceremony_row(&format, "M").expect("a row for M");
        assert!(m.contains("verifier"), "M owes a verifier: {m}");
        // S is QUALIFIED in this table — two rows open with it — and the
        // first is the one the letter alone would wrongly settle on.
        let s = ceremony_row(&format, "S").expect("a row for S");
        assert!(
            s.starts_with("S,"),
            "the S row is qualified rather than bare: {s}"
        );
        assert_eq!(ceremony_row(&format, "XL"), None);
    }

    #[test]
    fn row_twelve_is_the_briefs_own_role_files_report_spec() {
        let live = live_files();
        let exec = assembled(assemble(&live, &a_card(), Role::Executor, &no_lanes()));
        let row12 = exec.rows.iter().find(|r| r.number == 12).expect("row 12");
        assert!(row12
            .lines
            .iter()
            .any(|l| l.text.contains("Every command with its exit code")));
        assert!(row12
            .lines
            .iter()
            .all(|l| matches!(&l.provenance, Provenance::Tree { source } if source == "method/roles/executor.md")));
        // For a verifier the SAME row is read against verifier.md, per
        // the table's own note.
        let vfy = assembled(assemble(&live, &a_card(), Role::Verifier, &no_lanes()));
        let row12 = vfy.rows.iter().find(|r| r.number == 12).expect("row 12");
        assert!(row12
            .lines
            .iter()
            .all(|l| matches!(&l.provenance, Provenance::Tree { source } if source == "method/roles/verifier.md")));
    }

    // ---- the residuals, surfaced -------------------------------------

    #[test]
    fn the_two_open_t089_s9_residuals_are_carried_on_their_own_rows() {
        // **THE CARD FORBIDS PAPERING THEM OVER.** Row 9 is row 8's
        // untwinned twin and row 11's sources use `checkpoint` without
        // defining it. Both rows still assemble; the outcome says what is
        // open about each.
        let live = live_files();
        let brief = assembled(assemble(&live, &a_card(), Role::Executor, &no_lanes()));
        let nine = brief.rows.iter().find(|r| r.number == 9).expect("row 9");
        let eleven = brief.rows.iter().find(|r| r.number == 11).expect("row 11");
        assert!(nine.residual.as_ref().is_some_and(|r| r.contains("untwinned")));
        assert!(eleven.residual.as_ref().is_some_and(|r| r.contains("checkpoint")));
        // The HOLDER each residual routes to is part of the claim: both
        // are T-112-s2's, and V-M7 at verification proved the citation
        // was unpinned — a wrong card id survived 28 bodies.
        assert!(nine.residual.as_ref().is_some_and(|r| r.contains("T-112-s2")));
        assert!(eleven.residual.as_ref().is_some_and(|r| r.contains("T-112-s2")));
        // And a row with nothing open carries none — the field is not a
        // decoration every row wears.
        assert!(brief
            .rows
            .iter()
            .find(|r| r.number == 1)
            .expect("row 1")
            .residual
            .is_none());
    }

    #[test]
    fn row_nines_borrowed_mechanism_truncates_a_name_and_the_symptom_is_asserted() {
        // **THE RESIDUAL'S MEASURED SYMPTOM, PINNED RATHER THAN
        // DESCRIBED.** Row 9's source column states no enumeration, so
        // the mechanism used above is row 8's clause borrowed — *a bullet
        // opening with an upper-case run* — and a named bullet whose name
        // runs through a lower-case word is CUT at that word. The live
        // document has one: the merge-into-main bullet, whose name runs
        // through `@human'S GATE`.
        //
        // It is asserted here rather than repaired, because repairing it
        // means INVENTING a rule row 9 does not state, which is the
        // paper-over this card forbids. `dispatch-brief.mjs` — an
        // independent reader of the same row — cuts the same name at the
        // same word, which is what makes this the CONTRACT's defect and
        // not one implementation's.
        let live = live_files();
        let conventions = live.read_text(CONVENTIONS).expect("CONVENTIONS");
        let names = named_bullets(&conventions);
        let cut = names
            .iter()
            .find(|n| n.starts_with("THE MERGE INTO MAIN"))
            .expect("the merge-into-main bullet is named");
        assert_eq!(
            cut, "THE MERGE INTO MAIN IS",
            "the borrowed mechanism's cut moved; re-derive the residual"
        );
        assert!(
            bullet_containing(&conventions, "THE MERGE INTO MAIN IS")
                .is_some_and(|b| b.contains("GATE, BY DESIGN")),
            "the positive control: the bullet really does continue past the cut"
        );
    }

    #[test]
    fn row_fives_residual_is_closed_at_this_ref_and_the_document_says_so() {
        // The third residual the card names — *the slug/path map is named
        // but not located* — is closed in the live document, so nothing
        // is filed for it. This body is what keeps that claim honest: it
        // reds if the locating clause ever leaves row 5's source column.
        let live = live_files();
        let contract = read_contract(&live.read_text(CONTRACT_FILE).expect("contract"))
            .expect("a readable contract");
        let row5 = contract.iter().find(|r| r.number == 5).expect("row 5");
        assert!(
            row5.assembled_from.contains("touch_slugs:"),
            "row 5 no longer LOCATES the slug map: {}",
            row5.assembled_from
        );
        assert!(
            row5.assembled_from.contains("FIELD is authoritative"),
            "row 5 no longer names which of the two copies wins"
        );
    }

    // ---- the end-to-end pin, over a fixture repository ----------------

    #[test]
    fn a_hand_dispatch_from_this_brief_needs_to_tell_the_app_nothing() {
        // **THE SLICE'S CLOSING PROPERTY, DRIVEN END TO END.** Assemble
        // the brief for a card in a fixture repository, perform by hand
        // exactly what row 4's create command performs — git's own
        // bookkeeping under `.git/worktrees` — and the lane appears
        // through T-110's reader with nothing told to anything.
        let root = fixtures::repo_with_worktrees_dir("t112-e2e");
        std::fs::create_dir_all(root.join("docs").join("tasks")).expect("docs/tasks");
        std::fs::write(
            root.join("docs").join("tasks").join("T-901-a-card.md"),
            "---\nid: T-901\ntitle: A card\nsize: M\nstatus: building\ntouches: [app-dispatch]\n---\n",
        )
        .expect("the card");
        // The method and docs sources the brief reads, copied from this
        // repository so the fixture's brief is assembled from the SAME
        // documents a real dispatch would use.
        let here = repo_root();
        for rel in [
            "CLAUDE.md",
            "docs/CONVENTIONS.md",
            "method/roles/executor.md",
            "method/lane-protocol.md",
            "method/tasks/TASK-FORMAT.md",
        ] {
            let dest = root.join(rel);
            std::fs::create_dir_all(dest.parent().expect("a parent")).expect("dirs");
            std::fs::copy(here.join(rel), &dest).expect("copy a source");
        }
        for rel in ["docs/architecture/components"] {
            let dest = root.join(rel);
            std::fs::create_dir_all(&dest).expect("dirs");
            for entry in std::fs::read_dir(here.join(rel)).expect("components") {
                let entry = entry.expect("a component file");
                std::fs::copy(entry.path(), dest.join(entry.file_name())).expect("copy");
            }
        }

        // BEFORE: the brief assembles and the reader sees no lane.
        let brief = assembled(brief_for_card(&root, "T-901", Role::Executor));
        let row4 = brief.rows.iter().find(|r| r.number == 4).expect("row 4");
        let create = row4
            .lines
            .iter()
            .find(|l| l.label == "create")
            .expect("the create command");
        assert!(create.text.contains("git worktree add"));
        assert!(create.text.contains("T-901"));
        assert!(matches!(
            super::super::lanes::read_lanes(&root),
            LaneScan::Scanned { ref entries, .. } if entries.is_empty()
        ));

        // THE HAND DISPATCH: what the create command leaves on disk.
        fixtures::register(
            &root,
            "nputer-T-901",
            &fixtures::branch_head("task/T-901-a-card"),
            true,
        );

        // AFTER: nothing was told to anything, and the lane is there.
        let scan = super::super::lanes::read_lanes(&root);
        let LaneScan::Scanned { entries, .. } = &scan else {
            panic!("the reader refused: {scan:?}");
        };
        assert!(
            entries.iter().any(|e| matches!(
                e,
                WorktreeEntry::Lane { task_id, exists_on_disk: true, .. } if task_id == "T-901"
            )),
            "the lane did not appear through the reader: {entries:?}"
        );
        // And the brief re-assembled now names its own lane, which is the
        // reason row 5 reads the list rather than a stamp.
        let after = assembled(brief_for_card(&root, "T-901", Role::Executor));
        let row5 = after.rows.iter().find(|r| r.number == 5).expect("row 5");
        assert!(
            row5.lines
                .iter()
                .any(|l| l.label == "lane" && l.text.contains("T-901")),
            "row 5 did not pick up the new lane: {:?}",
            row5.lines
        );
        std::fs::remove_dir_all(&root).ok();
    }

    #[test]
    fn a_task_id_no_card_carries_is_its_own_answer() {
        let root = fixtures::repo_with_worktrees_dir("t112-nocard");
        std::fs::create_dir_all(root.join("docs").join("tasks")).expect("docs/tasks");
        std::fs::write(root.join("docs").join("tasks").join("T-902-x.md"), "---\nid: T-902\n---\n")
            .expect("a card");
        assert_eq!(
            brief_for_card(&root, "T-903", Role::Executor),
            BriefOutcome::NoSuchCard {
                task_id: "T-903".to_string()
            }
        );
        // The positive control: the card that IS there is found.
        assert!(!matches!(
            brief_for_card(&root, "T-902", Role::Executor),
            BriefOutcome::NoSuchCard { .. }
        ));
        std::fs::remove_dir_all(&root).ok();
    }

    // ---- the serialized shape the TS half mirrors ---------------------

    #[test]
    fn the_wire_form_is_tagged_and_camel_cased_the_way_the_ts_mirror_expects() {
        let live = live_files();
        let outcome = assemble(&live, &a_card(), Role::Executor, &no_lanes());
        let json = serde_json::to_value(&outcome).expect("serializable");
        assert_eq!(json["kind"], "assembled");
        assert_eq!(json["brief"]["role"], "executor");
        assert!(json["brief"]["rows"][0]["assembledFrom"].is_string());
        assert!(json["brief"]["rows"][0]["lines"][0]["provenance"]["kind"].is_string());
        let refused = BriefOutcome::NoSuchCard {
            task_id: "T-1".to_string(),
        };
        assert_eq!(
            serde_json::to_value(&refused).expect("serializable")["kind"],
            "noSuchCard"
        );
    }
}
