//! T-025 §3: the method snapshot — compiled into the binary, materialized
//! per genesis into `<project>/.nputer/genesis/kit/`.
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

/// The method version this snapshot was taken at. Cross-checked against
/// the live stamps in `method/interview/plan-interview.md` and
/// `docs/CONVENTIONS.md` by [`tests::snapshot_version_matches_the_live_method_stamps`],
/// so a method bump that forgets this const is red.
pub const METHOD_SNAPSHOT_VERSION: &str = "0.1.7";

/// Where the kit is written inside a project (relative, POSIX).
pub const KIT_REL_DIR: &str = ".nputer/genesis/kit";

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
/// `runtime/nputer.yaml` because planner.md step 1's MAY-seed reads it.
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
        rel: "runtime/nputer.yaml",
        content: include_str!("../../../../method/runtime/nputer.yaml"),
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

/// The kit root for a project: `<project>/.nputer/genesis/kit`.
pub fn kit_root(project_dir: &Path) -> PathBuf {
    let mut path = project_dir.to_path_buf();
    for part in KIT_REL_DIR.split('/') {
        path.push(part);
    }
    path
}

/// Write `<project>/.nputer/genesis/kit/**` plus `kit.json`.
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

/// The kickoff prompt, assembled Rust-side from the open project and the
/// materialized kit — never from the webview (criterion 1).
///
/// Exported (rather than inlined at the spawn) because T-029's
/// hand-driven fallback renders exactly this block for the human to paste
/// into their own terminal: one text, one source of truth.
pub fn assemble_kickoff(project_dir: &Path) -> String {
    let root = kit_root(project_dir);
    format!(
        "You are the planner. KIT ROOT: {kit} - PROJECT DIRECTORY: {project}. \
Read roles/planner.md at the kit root now and follow it exactly: stage 0 \
scaffold first, then the interview, one question at a time. Kit-internal \
paths resolve against the kit root; every docs/ path resolves inside the \
project directory. Turns are plain text. Method v{version}.",
        kit = root.display(),
        project = project_dir.display(),
        version = METHOD_SNAPSHOT_VERSION,
    )
}

/// Does `docs/` already hold banked work?
///
/// FILE EVIDENCE, not registry state, and deliberately so: it is what a
/// human hand-driving the method would see, and ADR-017's whole rule is
/// that `docs/` is the truth and `.nputer/` is a convenience. A genesis
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
inside the project directory. Turns are plain text. Method v{version}.",
        kit = root.display(),
        project = project_dir.display(),
        version = METHOD_SNAPSHOT_VERSION,
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
                "nputer-t025-kit-{}-{}-{}",
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
    #[test]
    fn the_snapshot_table_covers_every_method_scaffold_file() {
        let root = repo_root().join("method");
        let table: BTreeSet<&str> = KIT_FILES.iter().map(|f| f.rel).collect();
        for dir in ["docs-templates", "adapters", "tasks"] {
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
            "runtime/nputer.yaml",
        ] {
            assert!(table.contains(rel), "{rel} must ride the kit");
        }
        assert_eq!(KIT_FILES.len(), table.len(), "no duplicate rel path in the table");
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
        // planner creates the .gitignore line that keeps .nputer/ (and so
        // the materialized kit) out of the project's git.
        assert!(interview.contains("`.nputer/`"), "stage 0 must still bank the .gitignore line");
        assert!(interview.contains("docs-templates/"));
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
        assert!(text.contains("/tmp/some project/with space/.nputer/genesis/kit"));
        assert!(text.contains("PROJECT DIRECTORY: /tmp/some project/with space"));
        assert!(text.contains("roles/planner.md"));
        assert!(text.contains("Turns are plain text"));
        assert!(text.contains(&format!("Method v{METHOD_SNAPSHOT_VERSION}")));
        // The prompt is data on stdin; it is never a command line, so it
        // needs no quoting and must not carry any.
        assert!(!text.contains('\n'), "one paragraph, no line breaks to mangle");
    }
}
