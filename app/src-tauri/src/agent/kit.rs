//! T-025 §3: the method snapshot — compiled into the binary, materialized
//! per genesis into `<project>/.supertaskr/genesis/kit/`.
//!
//! WHY COMPILED IN, not a Tauri resource (the criterion's amended
//! parenthetical): `cargo test` has no `AppHandle` and no `resource_dir`,
//! so a resource-based kit would make tests read a DIFFERENT path than
//! production; dev and bundle resolution diverge; and pointing the spawned
//! CLI at the app's install Resources would need an `--add-dir` grant into
//! the application bundle that `acceptEdits` could write through. An
//! `include_str!` table has none of those properties and recompiles
//! whenever a method file changes.
//!
//! WHY MATERIALIZED, not embedded in the prompt: the kit then exists on
//! disk INSIDE the agent's cwd, so read access rides the project-dir scope
//! with no extra grant; the exact kit version this genesis ran is
//! auditable (`kit.json`); stage 0's `.gitignore` line keeps it out of the
//! project's git; and T-029's hand-driven mode can point any CLI at the
//! same path.
//!
//! Drift is loud three ways, all in this file's tests: content is
//! by-construction (include_str! recompiles on change); a directory walk
//! asserts every method template/adapter/task file is IN the table, so a
//! new one turns cargo red until the table is deliberately updated; and
//! the version const is cross-checked against the two live stamps.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use super::skills;

/// The method version this snapshot was taken at. Cross-checked against
/// the live stamps in `method/interview/plan-interview.md` and
/// `docs/CONVENTIONS.md` by [`tests::snapshot_version_matches_the_live_method_stamps`],
/// so a method bump that forgets this const is red.
pub const METHOD_SNAPSHOT_VERSION: &str = "0.1.24";

/// Where the kit is written inside a project (relative, POSIX).
pub const KIT_REL_DIR: &str = ".supertaskr/genesis/kit";

/// One file of the compiled-in kit.
pub struct KitFile {
    /// Path relative to the KIT ROOT — exactly the path
    /// `method/roles/planner.md` uses when it says "kit-internal
    /// references resolve relative to that root".
    pub rel: &'static str,
    pub content: &'static str,
}

/// THE SNAPSHOT TABLE — the planner's driver-contract kickoff set plus
/// its operational references, in kit-root-relative paths.
///
/// The set is exactly what `method/roles/planner.md`'s Driver contract
/// enumerates ("this role file + interview/plan-interview.md +
/// interview/decomposition.md + docs-templates/** + adapters/* +
/// tasks/TASK-FORMAT.md + tasks/T-000-template.md"), plus
/// `runtime/supertaskr.yaml` because planner.md step 1's MAY-seed reads it,
/// plus `skills/**` — T-241's seat skill, which is not the planner's
/// input at all but the ARCHITECT's, and rides for ADR-021's reason: what
/// this product ships for that chair is the seat's hand work as a skill,
/// so a project that got the method without it got the method without its
/// operating instructions.
/// Deliberately NOT included: the other role files (a planner does not
/// need executor.md), `interview/archaeology.md` (adoption is explicitly
/// not the planner's job — planner.md's overwrite rule points at it but a
/// greenfield genesis never runs it) and `rooms/ROOM-FORMAT.md`.
pub const KIT_FILES: &[KitFile] = &[
    KitFile {
        rel: "roles/planner.md",
        content: include_str!("../../../../method/roles/planner.md"),
    },
    KitFile {
        rel: "interview/plan-interview.md",
        content: include_str!("../../../../method/interview/plan-interview.md"),
    },
    KitFile {
        rel: "interview/decomposition.md",
        content: include_str!("../../../../method/interview/decomposition.md"),
    },
    KitFile {
        rel: "docs-templates/NORTH_STAR.md",
        content: include_str!("../../../../method/docs-templates/NORTH_STAR.md"),
    },
    KitFile {
        rel: "docs-templates/ROADMAP.md",
        content: include_str!("../../../../method/docs-templates/ROADMAP.md"),
    },
    KitFile {
        rel: "docs-templates/ARCHITECTURE.md",
        content: include_str!("../../../../method/docs-templates/ARCHITECTURE.md"),
    },
    KitFile {
        rel: "docs-templates/CONVENTIONS.md",
        content: include_str!("../../../../method/docs-templates/CONVENTIONS.md"),
    },
    KitFile {
        rel: "docs-templates/STATE.md",
        content: include_str!("../../../../method/docs-templates/STATE.md"),
    },
    KitFile {
        rel: "docs-templates/decisions/000-template.md",
        content: include_str!("../../../../method/docs-templates/decisions/000-template.md"),
    },
    KitFile {
        rel: "adapters/CLAUDE.md",
        content: include_str!("../../../../method/adapters/CLAUDE.md"),
    },
    KitFile {
        rel: "adapters/AGENTS.md",
        content: include_str!("../../../../method/adapters/AGENTS.md"),
    },
    KitFile {
        rel: "tasks/TASK-FORMAT.md",
        content: include_str!("../../../../method/tasks/TASK-FORMAT.md"),
    },
    KitFile {
        rel: "tasks/T-000-template.md",
        content: include_str!("../../../../method/tasks/T-000-template.md"),
    },
    KitFile {
        rel: "runtime/supertaskr.yaml",
        content: include_str!("../../../../method/runtime/supertaskr.yaml"),
    },
    // T-241: THE SEAT SKILL, carried whole. The pack is five files and
    // each rides as its own entry, because the kit materializes FILES and
    // a pack whose SKILL.md arrives without its references is a skill
    // whose every "see the file beside this one" is a dead pointer. The
    // two scripts ride for the same reason: `SKILL.md` tells the seat to
    // RUN them, and a check that is not on disk is a check nobody runs.
    KitFile {
        rel: "skills/supertaskr-seat/SKILL.md",
        content: include_str!("../../../../method/skills/supertaskr-seat/SKILL.md"),
    },
    KitFile {
        rel: "skills/supertaskr-seat/references/golden-lane.md",
        content: include_str!("../../../../method/skills/supertaskr-seat/references/golden-lane.md"),
    },
    KitFile {
        rel: "skills/supertaskr-seat/references/host-commands.md",
        content: include_str!(
            "../../../../method/skills/supertaskr-seat/references/host-commands.md"
        ),
    },
    KitFile {
        rel: "skills/supertaskr-seat/scripts/golden-check.mjs",
        content: include_str!("../../../../method/skills/supertaskr-seat/scripts/golden-check.mjs"),
    },
    KitFile {
        rel: "skills/supertaskr-seat/scripts/host-command-check.mjs",
        content: include_str!(
            "../../../../method/skills/supertaskr-seat/scripts/host-command-check.mjs"
        ),
    },
];

/// What `kit.json` records beside the materialized files — the version
/// stamp ON DISK, so an audit never has to guess which kit a genesis ran.
#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KitManifest {
    pub method_version: String,
    pub app_version: String,
    pub files: Vec<String>,
    pub written_at_ms: u64,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// The kit root for a project: `<project>/.supertaskr/genesis/kit`.
pub fn kit_root(project_dir: &Path) -> PathBuf {
    let mut path = project_dir.to_path_buf();
    for part in KIT_REL_DIR.split('/') {
        path.push(part);
    }
    path
}

/// Write `<project>/.supertaskr/genesis/kit/**` plus `kit.json`.
///
/// Idempotent overwrite: this is app-owned runtime data, losable by
/// charter (ADR-017 clause 4), so re-running a genesis simply refreshes
/// it. Nothing under `docs/` is touched — the AGENT writes docs/, never
/// the app.
pub fn materialize(project_dir: &Path) -> io::Result<KitManifest> {
    let root = kit_root(project_dir);
    for file in KIT_FILES {
        let target = root.join(file.rel);
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)?;
        }
        write_atomic(&target, file.content.as_bytes())?;
    }
    let manifest = KitManifest {
        method_version: METHOD_SNAPSHOT_VERSION.to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        files: KIT_FILES.iter().map(|f| f.rel.to_string()).collect(),
        written_at_ms: now_ms(),
    };
    let json = serde_json::to_vec_pretty(&manifest)
        .map_err(|err| io::Error::new(io::ErrorKind::InvalidData, err))?;
    write_atomic(&root.join("kit.json"), &json)?;
    Ok(manifest)
}

/// Temp + rename, so a reader never sees a half-written file and a
/// symlink at the destination is REPLACED rather than written through
/// (the T-012 `write_graph` discipline).
pub fn write_atomic(path: &Path, bytes: &[u8]) -> io::Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "path has no parent"))?;
    fs::create_dir_all(parent)?;
    let tmp = parent.join(format!(
        ".{}.tmp{}-{}",
        path.file_name().and_then(|n| n.to_str()).unwrap_or("kit"),
        std::process::id(),
        now_ms()
    ));
    fs::write(&tmp, bytes)?;
    match fs::rename(&tmp, path) {
        Ok(()) => Ok(()),
        Err(err) => {
            let _ = fs::remove_file(&tmp);
            Err(err)
        }
    }
}

/// THE ORG SKILL-PACK CLAUSE (T-167), appended to a kickoff that has
/// packs to name — and to NOTHING otherwise.
///
/// **THE EMPTY CASE IS THE CONTRACT**: with no packs this returns the
/// empty string, so every kickoff in this module is BYTE-IDENTICAL to
/// what it was before T-167. The card asks for that measured rather than
/// assumed, and [`tests::the_no_packs_kickoffs_are_byte_identical_to_the_unskilled_text`]
/// measures it against the literal text.
///
/// CARRIED THE WAY THE KIT IS CARRIED: the kit's own clause NAMES a root
/// on disk and tells the planner to read the role file there, rather than
/// inlining method text into the prompt. Packs get the same treatment —
/// they are already files inside the project, so the prompt names each
/// one's path and hands over the description that says when it applies,
/// and the planner reads the guidance itself. One paragraph, no line
/// breaks: every value comes through `skills::flatten`.
///
/// **THE PRECEDENCE QUESTION IS NOT RULED HERE.**
/// `docs/rooms/loop-customization.md` carries it open ("when an org skill
/// and project CONVENTIONS disagree, who wins"), so this clause asks the
/// planner to SURFACE a conflict rather than resolve one — which is a
/// statement of the current state, not an answer to the open question.
fn skills_clause(packs: &[skills::SkillPack]) -> String {
    if packs.is_empty() {
        return String::new();
    }
    let named: Vec<String> = packs
        .iter()
        .map(|pack| format!("'{}' at {} - {}", pack.name, pack.rel_path, pack.triggers))
        .collect();
    format!(
        " ORGANIZATION SKILL PACKS ({count}), inside the project directory: {named}. \
Read each of those {file} files before you write anything and follow the \
guidance in each one where its conditions apply - they are the \
organization's own policy for this project. Their precedence against the \
method is NOT yet decided, so where a pack and the method conflict, say \
so in your turn instead of choosing silently.",
        count = packs.len(),
        named = named.join("; "),
        file = skills::SKILL_FILE,
    )
}

/// The kickoff prompt, assembled Rust-side from the open project and the
/// materialized kit — never from the webview (criterion 1).
///
/// Exported (rather than inlined at the spawn) because T-029's
/// hand-driven fallback renders exactly this block for the human to paste
/// into their own terminal: one text, one source of truth.
///
/// T-167: the one-argument form DISCOVERS the project's skill packs
/// itself, so its signature and its no-packs output are unchanged. A
/// caller that already holds a discovery — because it is also stamping it
/// into the session registry — passes it to [`assemble_kickoff_with`]
/// instead, so one genesis reads the packs ONCE and the prompt and the
/// stamp cannot disagree about them.
pub fn assemble_kickoff(project_dir: &Path) -> String {
    assemble_kickoff_with(project_dir, &skills::discover(project_dir).packs)
}

/// [`assemble_kickoff`] over an already-discovered pack list.
pub fn assemble_kickoff_with(project_dir: &Path, packs: &[skills::SkillPack]) -> String {
    let root = kit_root(project_dir);
    format!(
        "You are the planner. KIT ROOT: {kit} - PROJECT DIRECTORY: {project}. \
Read roles/planner.md at the kit root now and follow it exactly: stage 0 \
scaffold first, then the interview, one question at a time. Kit-internal \
paths resolve against the kit root; every docs/ path resolves inside the \
project directory. Turns are plain text. Method v{version}.{skills}",
        kit = root.display(),
        project = project_dir.display(),
        version = METHOD_SNAPSHOT_VERSION,
        skills = skills_clause(packs),
    )
}

/// Does `docs/` already hold banked work?
///
/// FILE EVIDENCE, not registry state, and deliberately so: it is what a
/// human hand-driving the method would see, and ADR-017's whole rule is
/// that `docs/` is the truth and `.supertaskr/` is a convenience. A genesis
/// with an intact registry and an empty `docs/` is a stage-0 start; a
/// genesis whose registry was deleted and whose `docs/` is full is a
/// resume.
pub fn has_banked_docs(project_dir: &Path) -> bool {
    fs::read_dir(project_dir.join("docs"))
        .map(|mut entries| entries.any(|entry| entry.is_ok()))
        .unwrap_or(false)
}

/// THE RESUME KICKOFF (T-029 criterion 3), for a FRESH session over a
/// project that already holds banked artifacts.
///
/// It is the plain kickoff with the planner role's own Resume rule stated
/// in the prompt rather than left to be found — `method/roles/planner.md`
/// § Resume rule, whose words this transcribes: *"A fresh session given
/// only this kit and the project folder must state which stage is next,
/// then continue the interview from there. Derive it from disk… On
/// disagreement the artifacts win… Re-ask nothing that is already on
/// disk."*
///
/// **THAT CITATION WAS VERIFIED AGAINST THE REPO BEFORE IT WAS BUILT ON**
/// (`method/roles/planner.md:79`) — the habit T-028's missing "completion
/// signal" earned.
pub fn assemble_resume_kickoff(project_dir: &Path) -> String {
    assemble_resume_kickoff_with(project_dir, &skills::discover(project_dir).packs)
}

/// [`assemble_resume_kickoff`] over an already-discovered pack list.
pub fn assemble_resume_kickoff_with(project_dir: &Path, packs: &[skills::SkillPack]) -> String {
    let root = kit_root(project_dir);
    format!(
        "You are the planner. KIT ROOT: {kit} - PROJECT DIRECTORY: {project}. \
Read roles/planner.md at the kit root now and follow it exactly. THIS \
GENESIS IS ALREADY UNDER WAY: docs/ holds banked artifacts from earlier \
turns. Apply the RESUME RULE - derive the next stage from disk (the first \
row of the banking map whose artifacts are missing or still \
template-empty), state which stage is next, then continue the interview \
from there, one question at a time. The banked files are ground truth; \
re-ask nothing that is already on disk, and never overwrite real content. \
Kit-internal paths resolve against the kit root; every docs/ path resolves \
inside the project directory. Turns are plain text. Method v{version}.{skills}",
        kit = root.display(),
        project = project_dir.display(),
        version = METHOD_SNAPSHOT_VERSION,
        skills = skills_clause(packs),
    )
}

/// The kickoff this project wants — stage-0 or resume — chosen from what
/// is on disk. ONE call site for both, so the spawned path and the
/// hand-driven path cannot drift apart.
pub fn assemble_kickoff_for(project_dir: &Path) -> String {
    if has_banked_docs(project_dir) {
        assemble_resume_kickoff(project_dir)
    } else {
        assemble_kickoff(project_dir)
    }
}

/// [`assemble_kickoff_for`] over an already-discovered pack list (T-167).
pub fn assemble_kickoff_for_with(project_dir: &Path, packs: &[skills::SkillPack]) -> String {
    if has_banked_docs(project_dir) {
        assemble_resume_kickoff_with(project_dir, packs)
    } else {
        assemble_kickoff_with(project_dir, packs)
    }
}

/// The nudge sent into a RESUMED NATIVE session (T-029 criterion 1).
///
/// Short on purpose: the CLI's own session already carries the whole
/// conversation, so re-sending the kickoff would re-brief a planner that
/// is already briefed. The resume-rule fallback is named anyway, because
/// a long session may have been compacted and "derive it from disk" is
/// the recovery the method already defines.
pub fn assemble_resume_nudge(project_dir: &Path) -> String {
    let root = kit_root(project_dir);
    format!(
        "Continue the interview from where it stopped - the next question, \
one question at a time. IF you have lost the thread, apply the resume rule \
in roles/planner.md at KIT ROOT: {kit} - derive the next stage from disk \
under PROJECT DIRECTORY: {project}, state which stage is next, and \
continue. Re-ask nothing that is already on disk. Turns are plain text.",
        kit = root.display(),
        project = project_dir.display(),
    )
}

/// The heading the cold-start answer's actionable half sits under — one
/// spelling, read by the prompt below and by the pane that renders the
/// answer, so the two cannot drift.
pub const COLD_START_GAPS_HEADING: &str = "GAPS:";

/// THE COLD-START PROMPT (T-175) — and it takes NO ARGUMENTS, which is
/// the point rather than a convenience.
///
/// `method/interview/plan-interview.md` ends: *"Then: cold-start test. A
/// fresh session reads only docs/ and explains the project back. Gaps in
/// its answer are gaps in the docs — fix and repeat."* Verified against
/// the repo before being built on, the habit T-028's missing "completion
/// signal" earned: that sentence is the last line of that file.
///
/// **EVERY OTHER PROMPT IN THIS MODULE NAMES TWO ABSOLUTE PATHS — the kit
/// root and the project directory — AND THIS ONE NAMES NONE.** A path
/// above `docs/` written into the prompt is a path the session has been
/// told about, and telling a cold reader where `.supertaskr/` lives would undo
/// in one sentence what the spawn's cwd is doing. So this function takes
/// no `project_dir`: it CANNOT interpolate one, and
/// `the_cold_start_prompt_names_no_path_at_all` pins that the result stays
/// path-free. The session's working directory IS the docs tree, so
/// "everything you can read" needs no path to be unambiguous.
///
/// **AND IT ASKS FOR THE GAPS AS THE OUTPUT, NEVER A SCORE.** The method's
/// loop is fix-and-repeat over named gaps; a number would be a verdict on
/// the project, which is precisely the planning theater NORTH_STAR names.
pub fn assemble_cold_start_prompt() -> String {
    format!(
        "You are a COLD READER. You have never seen this project before, \
you have no interview transcript, and everything you can read is in and \
below your current working directory - that directory is this project's \
docs tree and it is the whole of what you are allowed to know. Do not \
ask for anything outside it; there is nothing outside it for you.\n\n\
Read it, then do two things, in this order.\n\n\
FIRST: explain the project back in plain prose - what it is, who it is \
for, what the first slice ships, and what would make it fail. Write it \
the way you would to a person about to work on it.\n\n\
SECOND, on its own line, the exact word {heading} and then one \
'- ' bullet per GAP: a question about this project that its docs did not \
answer, a claim two documents make differently, or a reference you could \
not resolve. Gaps in your answer are gaps in the docs, so name them \
plainly and specifically enough to fix. Write '- none' if there are \
none. Do not score, rate or grade anything - a number is not actionable \
and this is a fix-and-repeat loop, not a report card.",
        heading = COLD_START_GAPS_HEADING,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;

    /// The repo root, from this crate's manifest dir (app/src-tauri).
    fn repo_root() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .and_then(Path::parent)
            .expect("app/src-tauri has two ancestors")
            .to_path_buf()
    }

    /// THE ONE LINE A STAMP PIN IS ACTUALLY ABOUT — poison shape EIGHT's
    /// remedy (CONVENTIONS' catalogue, under POISON DRILL). A `contains`
    /// over a WHOLE FILE is satisfied by any occurrence anywhere, so one
    /// duplicate — documentation ABOUT the pin is the likeliest author —
    /// keeps the assertion green with its own subject deleted. Narrowing
    /// the haystack is preferred to counting occurrences of it: an ANCHOR
    /// that is NOT the stamp picks the sentence out, so no number is
    /// written down that a second legitimate copy could tempt anyone to
    /// bump; and the anchor's OWN uniqueness is asserted here, so an
    /// anchor that stops identifying one line fails loudly instead of
    /// quietly widening back into a whole-file search.
    fn the_one_line_carrying(haystack: &str, anchor: &str, whose: &str) -> String {
        let mut hits = haystack.lines().filter(|line| line.contains(anchor));
        let line = hits
            .next()
            .unwrap_or_else(|| {
                panic!(
                    "{whose} has no line containing {anchor:?} - the anchor this pin narrows \
                     on has moved; re-anchor it on the sentence that carries the stamp"
                )
            })
            .to_string();
        assert!(
            hits.next().is_none(),
            "{whose} has more than one line containing {anchor:?} - the anchor no longer \
             identifies the stamped sentence; pick one that does"
        );
        line
    }

    struct TempTree(PathBuf);
    impl TempTree {
        fn new(tag: &str) -> Self {
            let dir = std::env::temp_dir().join(format!(
                "supertaskr-t025-kit-{}-{}-{}",
                tag,
                std::process::id(),
                now_ms()
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

    /// Recursive file walk, returning kit-root-relative POSIX paths.
    fn walk_rel(base: &Path, prefix: &str) -> BTreeSet<String> {
        let mut out = BTreeSet::new();
        let mut stack = vec![(base.to_path_buf(), prefix.to_string())];
        while let Some((dir, rel)) = stack.pop() {
            for entry in fs::read_dir(&dir).expect("method dir readable").flatten() {
                let name = entry.file_name().to_string_lossy().into_owned();
                if name.starts_with('.') {
                    continue;
                }
                let child_rel = if rel.is_empty() { name.clone() } else { format!("{rel}/{name}") };
                let path = entry.path();
                if path.is_dir() {
                    stack.push((path, child_rel));
                } else {
                    out.insert(child_rel);
                }
            }
        }
        out
    }

    /// PARITY (b): every file in the method's SCAFFOLD directories must be
    /// in the table. Adding `method/docs-templates/GLOSSARY.md` — a file
    /// the planner would be told to copy verbatim — turns this red until
    /// someone deliberately adds it to the snapshot.
    ///
    /// Drill (output quoted in the implementation notes): dropping a
    /// scratch file into method/docs-templates/ fails this test by name.
    ///
    /// **`skills` JOINED THE WALK AT T-241 AND THAT IS THE WHOLE POINT OF
    /// ADDING IT.** The seat skill is a PACK — a `SKILL.md` plus the
    /// references and scripts it tells the reader to open and to run — and
    /// a pack half-carried is worse than one not carried at all, because
    /// every pointer in the shipped file resolves to nothing. Before this
    /// line the directory was invisible to the parity walk, so a sixth
    /// pack file would have ridden nowhere in silence.
    #[test]
    fn the_snapshot_table_covers_every_method_scaffold_file() {
        let root = repo_root().join("method");
        let table: BTreeSet<&str> = KIT_FILES.iter().map(|f| f.rel).collect();
        for dir in ["docs-templates", "adapters", "tasks", "skills"] {
            for rel in walk_rel(&root.join(dir), dir) {
                assert!(
                    table.contains(rel.as_str()),
                    "method/{rel} exists but is NOT in the compiled kit snapshot (T-025 §3). \
                     A new scaffold file must be added to KIT_FILES deliberately - the spawned \
                     planner can only copy what it was given."
                );
            }
        }
    }

    /// The three named non-scaffold files are present too (the driver
    /// contract's kickoff set is not only docs-templates).
    #[test]
    fn the_snapshot_carries_the_driver_contracts_kickoff_set() {
        let table: BTreeSet<&str> = KIT_FILES.iter().map(|f| f.rel).collect();
        for rel in [
            "roles/planner.md",
            "interview/plan-interview.md",
            "interview/decomposition.md",
            "runtime/supertaskr.yaml",
        ] {
            assert!(table.contains(rel), "{rel} must ride the kit");
        }
        assert_eq!(KIT_FILES.len(), table.len(), "no duplicate rel path in the table");
    }

    /// T-241 criterion 1, the GENESIS half: the seat skill's whole pack
    /// rides the kit, so a project scaffolded by a genesis gets the
    /// architect's operating instructions beside the rest of method/.
    ///
    /// The list is spelled out rather than derived from a prefix scan on
    /// purpose: a scan would pass a table that carried only `SKILL.md`,
    /// which is exactly the half-carried pack this test exists to refuse.
    #[test]
    fn the_snapshot_carries_the_whole_seat_skill_pack() {
        let table: BTreeSet<&str> = KIT_FILES.iter().map(|f| f.rel).collect();
        for rel in [
            "skills/supertaskr-seat/SKILL.md",
            "skills/supertaskr-seat/references/golden-lane.md",
            "skills/supertaskr-seat/references/host-commands.md",
            "skills/supertaskr-seat/scripts/golden-check.mjs",
            "skills/supertaskr-seat/scripts/host-command-check.mjs",
        ] {
            assert!(
                table.contains(rel),
                "{rel} must ride the kit - SKILL.md points at every one of these by name, \
                 and a pointer to a file the kit did not carry resolves to nothing (T-241)"
            );
        }
    }

    /// T-241 criterion 1, the FORMAT half, and criterion 7's mechanism:
    /// the shipped `SKILL.md` is read by the SAME discoverer an
    /// organization's own packs go through ([`super::super::skills`],
    /// T-167) rather than by a replica of it, because a replica is a
    /// second implementation of the format and two implementations of one
    /// rule are two chances to disagree.
    ///
    /// **THE CONTROL IS IN THE SAME TEST AND IT IS DELIBERATE.** A test
    /// that only shows the good pack accepted cannot tell "the format is
    /// satisfied" from "this discoverer accepts anything", so the second
    /// half plants the same pack with its `description:` removed and
    /// requires it to come back REJECTED, naming the missing key.
    #[test]
    fn the_shipped_seat_skill_parses_under_the_discoverer_that_reads_real_packs() {
        let entry = KIT_FILES
            .iter()
            .find(|f| f.rel == "skills/supertaskr-seat/SKILL.md")
            .expect("the seat skill rides the kit");

        let tmp = TempTree::new("seat-skill");
        let pack_dir = tmp.0.join(skills::SKILLS_REL_DIR).join("supertaskr-seat");
        fs::create_dir_all(&pack_dir).expect("mk pack dir");
        fs::write(pack_dir.join(skills::SKILL_FILE), entry.content).expect("write SKILL.md");

        let found = skills::discover(&tmp.0);
        assert!(
            found.rejected.is_empty(),
            "the shipped pack was REJECTED by the discoverer: {:?}",
            found.rejected.iter().map(|r| (&r.dir, &r.why)).collect::<Vec<_>>()
        );
        assert_eq!(found.packs.len(), 1, "exactly one pack");
        let pack = &found.packs[0];
        assert_eq!(pack.name, "supertaskr-seat", "the frontmatter name");
        assert_eq!(pack.dir, "supertaskr-seat", "name matches the directory it lives in");

        // CRITERION 7: the INTENT trigger lives in the `description:`,
        // which is what the harness reads. The cap TRUNCATES rather than
        // refuses, so a trigger clause pushed past 300 characters would
        // vanish in silence - assert the clause SURVIVED the flatten,
        // which is the only thing that proves it is still a trigger.
        assert!(
            pack.description.contains("Use when"),
            "the description must carry its own trigger clause: {:?}",
            pack.description
        );
        for intent in ["card", "lane", "verdict", "merge", "push", "what to work on next"] {
            assert!(
                pack.description.contains(intent),
                "the description must name the intent {intent:?} - it is what the harness \
                 matches on, and a trigger this file states only in its BODY never fires: {:?}",
                pack.description
            );
        }
        assert!(
            pack.description.chars().count() < skills::MAX_DESCRIPTION_CHARS,
            "the description is {} chars against a {}-char cap that TRUNCATES rather than \
             refuses - at the cap the trailing trigger clause disappears silently",
            pack.description.chars().count(),
            skills::MAX_DESCRIPTION_CHARS
        );

        // THE POSITIVE CONTROL: the same bytes, one required key removed.
        let ctl = TempTree::new("seat-skill-control");
        let ctl_dir = ctl.0.join(skills::SKILLS_REL_DIR).join("supertaskr-seat");
        fs::create_dir_all(&ctl_dir).expect("mk control dir");
        let degraded: String = entry
            .content
            .lines()
            .filter(|l| !l.starts_with("description:"))
            .collect::<Vec<_>>()
            .join("\n");
        fs::write(ctl_dir.join(skills::SKILL_FILE), degraded).expect("write control");
        let ctl_found = skills::discover(&ctl.0);
        assert!(
            ctl_found.packs.is_empty(),
            "CONTROL FAILED: a pack with no `description:` was ACCEPTED, so the acceptance \
             above proves nothing about the format"
        );
        assert_eq!(ctl_found.rejected.len(), 1, "the control is rejected, once");
        assert!(
            ctl_found.rejected[0].why.contains("description"),
            "the refusal must name the missing key: {:?}",
            ctl_found.rejected[0].why
        );
    }

    /// T-241 criteria 5, 6 and 8: the three clauses the seat skill exists
    /// to carry are pinned in the SHIPPED bytes, the way
    /// [`the_shipped_plan_interview_still_carries_the_normative_banking_map`]
    /// pins the banking map — because a clause that only lives in a card's
    /// acceptance criteria is a clause the next edit deletes in silence.
    ///
    /// Each anchor is checked for UNIQUENESS by `the_one_line_carrying`
    /// where it is a single line, so an anchor that stops identifying its
    /// sentence fails loudly instead of widening into a whole-file search.
    #[test]
    fn the_shipped_seat_skill_still_carries_its_three_load_bearing_clauses() {
        let skill = KIT_FILES
            .iter()
            .find(|f| f.rel == "skills/supertaskr-seat/SKILL.md")
            .expect("the seat skill rides the kit")
            .content;

        // CRITERION 5 - no second spawn path: the refusal names the arm.
        // The ANCHOR's uniqueness is asserted on one line; the CLAUSE is
        // asserted against the whitespace-collapsed file, because the
        // pack is hard-wrapped at about seventy columns and a sentence
        // split across two lines is absent from either of them.
        let _ = the_one_line_carrying(skill, "A SECOND SPAWN PATH.", "the seat skill");
        let flat = skill.split_whitespace().collect::<Vec<_>>().join(" ");
        assert!(
            flat.contains("REFUSE and name the arm"),
            "the second-spawn refusal must name the ARM as what to do instead"
        );
        assert!(
            flat.contains("Where the arm is genuinely unavailable, say so, name its absence, and ask"),
            "the refusal must say what to do when the arm is absent - a refusal with no \
             alternative is what a seat reconstructs the ritual around"
        );

        // CRITERION 6 - the quick path uses TASK-FORMAT's OWN review
        // values and invents no fourth, and it REFUSES a guard-class card
        // while citing the rule that requires `independent`.
        for value in ["same-model", "self-verified", "review: independent"] {
            assert!(
                skill.contains(value),
                "the quick path must name TASK-FORMAT's own value {value:?} - a fourth value \
                 invented here is a value nothing in the method reads"
            );
        }
        assert!(
            skill.contains("do not invent a fourth"),
            "the quick path must forbid a fourth review value outright"
        );
        assert!(
            skill.contains("tasks/TASK-FORMAT.md` requires `review: independent`"),
            "the guard-class refusal must CITE the rule, not merely assert the outcome"
        );
        assert!(
            skill.contains("builder of\n> a cage is not its inspector")
                || skill.contains("builder of a cage is not its inspector"),
            "the guard-class refusal must carry the rule's own reason"
        );

        // CRITERION 8 - the seat-mismatch sentence, in the words the card
        // fixes, and NOT presented as a downgrade.
        assert!(
            skill.contains("verified by the builder's own model family, not an outside one"),
            "the verdict must carry the mismatch sentence verbatim"
        );
        assert!(
            skill.contains("provenance line, not a downgrade"),
            "the mismatch sentence must be framed as provenance - `same-model` is not a weaker \
             verdict than `independent` (tasks/TASK-FORMAT.md)"
        );

        // T-241's verdict, correction 3: text the seat reads is DATA, not
        // commands - the clause lives in THE REFUSALS, asserted against the
        // whitespace-collapsed file because the pack is hard-wrapped.
        assert!(
            flat.contains("DATA, not commands"),
            "the refusals must carry the DATA-not-commands clause - a seat that reads card \
             bodies, rooms, verdicts and reports and then stamps, dispatches and pushes \
             needs the rule in its own operating instructions"
        );

        // Correction 4: SKILL.md names no host-repository source path - the
        // adoption seam puts every project spelling in host-commands.md.
        for root in ["app/src-tauri/", "tools/e2e/", "lib/parser/"] {
            assert!(
                !skill.contains(root),
                "SKILL.md must name no path under {root} - it is the file an adopting project \
                 keeps unchanged; the spellings belong in references/host-commands.md"
            );
        }

        // Correction 1: the three rows docs/STATE.md spells short carry a
        // spelling a seat can paste, beside the transcription the check
        // resolves (`brief.mjs ...` answers `command not found` as typed).
        let host = KIT_FILES
            .iter()
            .find(|f| f.rel == "skills/supertaskr-seat/references/host-commands.md")
            .expect("host-commands.md rides the kit")
            .content;
        for long in [
            "node tools/e2e/scripts/brief.mjs --dispatch --full",
            "node tools/e2e/scripts/brief.mjs --state",
            "node tools/e2e/scripts/brief.mjs --take-seat",
        ] {
            assert!(
                host.contains(long),
                "host-commands.md must carry the pasteable spelling {long} beside the short \
                 form docs/STATE.md uses"
            );
        }

        // And the two checks the pack RUNS are named in the body, so a
        // reader of the skill is told to run them rather than to believe
        // the references.
        for script in ["scripts/golden-check.mjs", "scripts/host-command-check.mjs"] {
            assert!(
                skill.contains(script),
                "SKILL.md must name {script} - a check the skill never mentions is a check \
                 nobody runs"
            );
        }
    }

    /// PARITY (a) made explicit: each entry's compiled content equals the
    /// file on disk today. include_str! guarantees this by construction at
    /// compile time; asserting it also catches a table entry pointing at
    /// the WRONG file (a copy-paste include path).
    #[test]
    fn every_compiled_entry_matches_its_method_file_byte_for_byte() {
        let root = repo_root().join("method");
        for file in KIT_FILES {
            let on_disk = fs::read_to_string(root.join(file.rel))
                .unwrap_or_else(|err| panic!("method/{} unreadable: {err}", file.rel));
            assert_eq!(
                on_disk, file.content,
                "method/{} drifted from its compiled snapshot entry",
                file.rel
            );
        }
    }

    /// THE BANKING MAP IS NORMATIVE (CONVENTIONS gotcha: "programs
    /// transcribe it as written"). This snapshot's job is to hand the
    /// planner that table verbatim, so pin that the shipped
    /// plan-interview.md still carries all nine stage rows and the
    /// stage-0 scaffold row's load-bearing clauses.
    #[test]
    fn the_shipped_plan_interview_still_carries_the_normative_banking_map() {
        let interview = KIT_FILES
            .iter()
            .find(|f| f.rel == "interview/plan-interview.md")
            .expect("plan-interview rides the kit")
            .content;
        assert!(interview.contains("table is normative"));
        for stage in 0..=8 {
            assert!(
                interview.contains(&format!("| {stage} |")),
                "banking map row for stage {stage} is missing from the shipped kit"
            );
        }
        // Stage 0 is what the runner's own security posture leans on: the
        // planner creates the .gitignore line that keeps the runtime
        // directory (and so the materialized kit) out of the project's git.
        //
        // T-265: the needle is the SHIPPED spelling, which is now the
        // renamed one. `interview` is `method/interview/plan-interview.md`
        // compiled in verbatim, so this assertion and that file's stage-0
        // cell move together; T-264 held both at the old spelling because
        // method/ was outside its fence (ADR-022 decision 2).
        assert!(interview.contains("`.supertaskr/`"), "stage 0 must still bank the .gitignore line");
        assert!(interview.contains("docs-templates/"));
    }

    /// T-175: THE COLD-START TEST THIS PROMPT AUTOMATES IS STILL THE ONE
    /// THE SHIPPED METHOD ASKS FOR.
    ///
    /// The kit materializes `plan-interview.md` VERBATIM into every
    /// project this system creates, so its last line is the spec the
    /// spawned cold reader answers to. If that sentence is edited, the
    /// prompt below is answering a question the method no longer asks —
    /// and this body is what says so instead of leaving the drift to be
    /// noticed by a human reading two files.
    #[test]
    fn the_shipped_method_still_asks_for_the_cold_start_test_this_prompt_automates() {
        let interview = KIT_FILES
            .iter()
            .find(|f| f.rel == "interview/plan-interview.md")
            .expect("plan-interview rides the kit")
            .content;
        // WHITESPACE-NORMALISED, because the sentence is WRAPPED in the
        // file and a re-flow is not a change of meaning. Matching the raw
        // bytes made this body red over a newline the first time it ran.
        let flat = interview.split_whitespace().collect::<Vec<_>>().join(" ");
        assert!(
            flat.contains("A fresh session reads only docs/ and explains the project back."),
            "the method's cold-start sentence has moved; T-175's spawn is built on it verbatim"
        );
        assert!(
            flat.contains("Gaps in its answer are gaps in the docs"),
            "the GAPS half is what the prompt asks for as output; it must still be the method's"
        );
        // The CONTROL that keeps the two lines above from being green over
        // a normalisation that ate the file.
        assert!(!flat.is_empty() && flat.len() > 1000, "the shipped interview text is present");
    }

    /// T-175: THE COLD-START PROMPT NAMES NO PATH AT ALL, AND THE
    /// COMPARISON THAT MAKES THAT MEAN SOMETHING IS RIGHT BESIDE IT.
    ///
    /// Every other prompt in this module interpolates two absolute paths.
    /// A body that only asserted "no `/` appears" would be green over an
    /// empty string and green over a prompt that had quietly stopped being
    /// assembled, so this one asserts the kickoff DOES carry a path in the
    /// same breath: the difference between the two is the property.
    #[test]
    fn the_cold_start_prompt_names_no_path_at_all() {
        let t = TempTree::new("coldpath");
        let project = t.0.join("proj");
        fs::create_dir_all(&project).expect("mk project");
        let project = project.as_path();
        let cold = assemble_cold_start_prompt();

        // THE CONTROL: the interview's own kickoff names the project, so
        // "no path here" is a difference and not an absence.
        let kickoff = assemble_kickoff_with(project, &[]);
        assert!(
            kickoff.contains(&project.display().to_string()),
            "the kickoff names the project directory - if it stopped, the assertion below is vacuous"
        );

        assert!(
            !cold.contains(&project.display().to_string()),
            "the cold-start prompt must not name the project directory: {cold}"
        );
        assert!(
            !cold.contains(KIT_REL_DIR) && !cold.contains(".supertaskr"),
            "the cold-start prompt must not name the runtime directory it is fenced out of: {cold}"
        );
        assert!(
            !cold.contains('/'),
            "no path separator may appear in the cold-start prompt at all - its cwd is the whole \
             of what it is told: {cold}"
        );
    }

    /// T-175: THE PROMPT ASKS FOR NAMED GAPS AND REFUSES A SCORE.
    ///
    /// Criterion 3 makes the gaps the actionable output — "the method's
    /// fix-and-repeat loop, not a score".
    ///
    /// **THE HEADING IS PINNED AS A BARE LITERAL, NOT THROUGH THE
    /// CONSTANT, AND THE FIRST DRAFT OF THIS BODY GOT THAT WRONG.** It
    /// read `cold.contains(COLD_START_GAPS_HEADING)` — a test PARAMETRISED
    /// BY THE CONSTANT IT CHECKS, which is T-063's catalogued vacuity:
    /// move the constant and the prompt moves with it, so the assertion
    /// re-states itself in the new spelling and stays green while the
    /// TypeScript parser — which matches its own copy — silently stops
    /// splitting the answer. Measured: mutating this constant alone left
    /// `cargo test` AND `npm test` both at exit 0 while criterion 3's
    /// output stopped working. The literal below is what closes the
    /// producer's half; `app/test/crescendo.test.ts`'s
    /// `the cold reader's heading is ONE string…` closes the agreement
    /// between the two copies.
    #[test]
    fn the_cold_start_prompt_asks_for_named_gaps_and_never_a_score() {
        let cold = assemble_cold_start_prompt();
        assert!(
            cold.contains("GAPS:"),
            "the prompt must ask for the answer's actionable half under the heading the pane's \
             parser looks for - written out here rather than read from the constant, so moving \
             the constant reds this line instead of renaming it"
        );
        assert!(
            cold.contains("explain the project back"),
            "the explain-back is the first half of the method's own sentence"
        );
        assert!(
            cold.contains("Do not score, rate or grade anything"),
            "a score is the failure mode this criterion names; the refusal is IN the prompt"
        );
    }

    /// PARITY (c): the const cross-checks the two live stamps, so bumping
    /// the method without touching this file is red.
    ///
    /// Both stamps are pinned on the ONE LINE that carries them, via
    /// [`the_one_line_carrying`] — never over the whole file. Each
    /// haystack held exactly one copy of its stamp when this was written,
    /// so each was one planted duplicate away from passing with its own
    /// subject deleted, and a method bump is the single commit that edits
    /// both files at once.
    #[test]
    fn snapshot_version_matches_the_live_method_stamps() {
        let interview = KIT_FILES
            .iter()
            .find(|f| f.rel == "interview/plan-interview.md")
            .expect("plan-interview rides the kit")
            .content;
        let output_heading = the_one_line_carrying(
            interview,
            "## Output",
            "the shipped method/interview/plan-interview.md",
        );
        assert!(
            output_heading.contains(&format!("(v{METHOD_SNAPSHOT_VERSION}")),
            "plan-interview.md's Output heading no longer stamps v{METHOD_SNAPSHOT_VERSION} - \
             bump METHOD_SNAPSHOT_VERSION with the method"
        );
        let conventions = fs::read_to_string(repo_root().join("docs/CONVENTIONS.md"))
            .expect("docs/CONVENTIONS.md readable");
        let version_bump_clause = the_one_line_carrying(
            &conventions,
            "formats are version-bumped",
            "docs/CONVENTIONS.md",
        );
        assert!(
            version_bump_clause.contains(&format!("currently v{METHOD_SNAPSHOT_VERSION}")),
            "docs/CONVENTIONS.md's first gotcha no longer says \
             'currently v{METHOD_SNAPSHOT_VERSION}' - \
             bump METHOD_SNAPSHOT_VERSION with the method"
        );
    }

    #[test]
    fn materialize_writes_the_whole_kit_plus_a_stamped_manifest() {
        let t = TempTree::new("materialize");
        let project = t.0.join("proj");
        fs::create_dir_all(&project).expect("mk project");

        let manifest = materialize(&project).expect("materialize");
        assert_eq!(manifest.method_version, METHOD_SNAPSHOT_VERSION);
        assert_eq!(manifest.files.len(), KIT_FILES.len());
        assert!(manifest.written_at_ms > 0);

        let root = kit_root(&project);
        for file in KIT_FILES {
            let written = fs::read_to_string(root.join(file.rel))
                .unwrap_or_else(|err| panic!("{} not materialized: {err}", file.rel));
            assert_eq!(written, file.content);
        }
        let on_disk: KitManifest =
            serde_json::from_slice(&fs::read(root.join("kit.json")).expect("kit.json"))
                .expect("kit.json parses");
        assert_eq!(on_disk.method_version, METHOD_SNAPSHOT_VERSION);
        assert_eq!(on_disk.app_version, env!("CARGO_PKG_VERSION"));

        // Nothing was created under docs/ - the app is not the docs writer.
        assert!(!project.join("docs").exists(), "the runner never touches docs/");

        // Idempotent: a second materialize over hand-edited content
        // restores the snapshot (runtime data, losable by charter).
        fs::write(root.join("roles/planner.md"), "clobbered").expect("clobber");
        materialize(&project).expect("re-materialize");
        assert_eq!(
            fs::read_to_string(root.join("roles/planner.md")).expect("read"),
            KIT_FILES.iter().find(|f| f.rel == "roles/planner.md").unwrap().content
        );
        // No temp files survive the writes.
        let leftovers: Vec<String> = fs::read_dir(&root)
            .expect("kit root")
            .flatten()
            .map(|e| e.file_name().to_string_lossy().into_owned())
            .filter(|n| n.contains(".tmp"))
            .collect();
        assert!(leftovers.is_empty(), "atomic writes leave no temp files: {leftovers:?}");
    }

    #[test]
    fn the_kickoff_names_the_kit_root_the_project_and_the_method_version() {
        let project = Path::new("/tmp/some project/with space");
        let text = assemble_kickoff(project);
        assert!(text.contains("/tmp/some project/with space/.supertaskr/genesis/kit"));
        assert!(text.contains("PROJECT DIRECTORY: /tmp/some project/with space"));
        assert!(text.contains("roles/planner.md"));
        assert!(text.contains("Turns are plain text"));
        assert!(text.contains(&format!("Method v{METHOD_SNAPSHOT_VERSION}")));
        // The prompt is data on stdin; it is never a command line, so it
        // needs no quoting and must not carry any.
        assert!(!text.contains('\n'), "one paragraph, no line breaks to mangle");
    }

    // ---- T-167: the org skill packs in the kickoff ---------------------

    /// One well-formed pack, as `skills::discover` would answer it.
    fn pack(dir: &str, triggers: &str) -> skills::SkillPack {
        skills::SkillPack {
            dir: dir.to_string(),
            name: dir.to_string(),
            description: triggers.to_string(),
            triggers: triggers.to_string(),
            rel_path: format!("{}/{dir}/{}", skills::SKILLS_REL_DIR, skills::SKILL_FILE),
            hash: skills::sha256_hex(dir.as_bytes()),
        }
    }

    /// GUARD RULE 3, MEASURED AGAINST THE LITERAL TEXT rather than against
    /// this build's own other function (T-167's third guard: "a no-packs
    /// run proven identical").
    ///
    /// The two expected strings below are the PRE-T-167 bodies of
    /// `assemble_kickoff` and `assemble_resume_kickoff`, transcribed at
    /// `1d297c9`. Comparing the new function to the old TEXT is what makes
    /// this a pin: comparing it to `assemble_kickoff_with(.., &[])` would
    /// pass for any pair of functions that agree with each other, however
    /// far both had drifted from what genesis used to send.
    #[test]
    fn the_no_packs_kickoffs_are_byte_identical_to_the_unskilled_text() {
        let project = Path::new("/tmp/some project/with space");
        let stage0 = format!(
            "You are the planner. KIT ROOT: /tmp/some project/with space/.supertaskr/genesis/kit - \
PROJECT DIRECTORY: /tmp/some project/with space. Read roles/planner.md at the kit root now and \
follow it exactly: stage 0 scaffold first, then the interview, one question at a time. \
Kit-internal paths resolve against the kit root; every docs/ path resolves inside the project \
directory. Turns are plain text. Method v{METHOD_SNAPSHOT_VERSION}."
        );
        let resume = format!(
            "You are the planner. KIT ROOT: /tmp/some project/with space/.supertaskr/genesis/kit - \
PROJECT DIRECTORY: /tmp/some project/with space. Read roles/planner.md at the kit root now and \
follow it exactly. THIS GENESIS IS ALREADY UNDER WAY: docs/ holds banked artifacts from earlier \
turns. Apply the RESUME RULE - derive the next stage from disk (the first row of the banking map \
whose artifacts are missing or still template-empty), state which stage is next, then continue \
the interview from there, one question at a time. The banked files are ground truth; re-ask \
nothing that is already on disk, and never overwrite real content. Kit-internal paths resolve \
against the kit root; every docs/ path resolves inside the project directory. Turns are plain \
text. Method v{METHOD_SNAPSHOT_VERSION}."
        );

        assert_eq!(assemble_kickoff_with(project, &[]), stage0);
        assert_eq!(assemble_resume_kickoff_with(project, &[]), resume);
        // The one-argument forms over a project that HAS no `.claude/`
        // reach the same bytes — the ordinary case for every genesis run
        // before this card and after it.
        assert_eq!(assemble_kickoff(project), stage0);
        assert_eq!(assemble_resume_kickoff(project), resume);
        // And the clause itself is empty rather than "empty-looking".
        assert_eq!(skills_clause(&[]), "");
    }

    /// GUARD RULE 1 (the positive control): a discovered pack MUST appear
    /// in the assembled kickoff — by name, by path, and with the
    /// conditions that say when it applies.
    #[test]
    fn a_discovered_pack_appears_in_the_assembled_kickoff() {
        let project = Path::new("/tmp/skilled project");
        let packs = [
            pack("brand", "Brand voice. Use when writing user-facing copy."),
            pack("security", "Use when touching authentication or secrets."),
        ];
        for text in [
            assemble_kickoff_with(project, &packs),
            assemble_resume_kickoff_with(project, &packs),
        ] {
            assert!(text.contains("ORGANIZATION SKILL PACKS (2)"), "{text}");
            assert!(text.contains("'brand' at .claude/skills/brand/SKILL.md"), "{text}");
            assert!(text.contains("Brand voice. Use when writing user-facing copy."), "{text}");
            assert!(text.contains("'security' at .claude/skills/security/SKILL.md"), "{text}");
            assert!(text.contains("Use when touching authentication or secrets."), "{text}");
            // The kit's own brief is still whole — the clause is an
            // ADDITION, never a replacement.
            assert!(text.contains("roles/planner.md"), "{text}");
            assert!(text.contains(&format!("Method v{METHOD_SNAPSHOT_VERSION}")), "{text}");
            // Still one paragraph on a child's stdin.
            assert!(!text.contains('\n'), "one paragraph, no line breaks to mangle: {text}");
            // The open precedence question is surfaced, not answered.
            assert!(text.contains("NOT yet decided"), "{text}");
        }
    }

    /// THE CLAUSE IS APPENDED, so the pre-T-167 text is a PREFIX of the
    /// skilled one — the sharpest available statement of "carried the way
    /// the kit is carried, and nothing about the kit moved".
    #[test]
    fn the_skilled_kickoff_extends_the_unskilled_one_rather_than_rewriting_it() {
        let project = Path::new("/tmp/skilled project");
        let packs = [pack("brand", "Use when writing copy.")];
        let plain = assemble_kickoff_with(project, &[]);
        let skilled = assemble_kickoff_with(project, &packs);
        assert!(skilled.starts_with(&plain), "plain:\n{plain}\nskilled:\n{skilled}");
        assert!(skilled.len() > plain.len());
    }
}
