//! Containment against a live walk (plan §8): outside-tree symlinks,
//! escape specifiers, and BUILD OUTPUT INSIDE the tree. Runtime scratch
//! trees; the symlink bodies are unix-gated (no symlinks are ever
//! committed in fixtures — Windows checkout hazard) and the cache-dir
//! body is not, because a `CACHEDIR.TAG` is an ordinary file.
//!
//! **THE THIRD MECHANISM IS HERE FOR THE SAME REASON AS THE FIRST TWO**
//! (`T-153-s3`): containment is the property that the graph describes
//! this repository and nothing else. A symlink leaks somebody else's
//! tree in; a cargo target directory under a chosen name leaks THIS
//! session's scratch build in — twelve build-script outputs measured
//! inside the graph with `index --check` then answering CURRENT over
//! them. `src/walk.rs`'s bodies pin the walk-level refusal; this one
//! drives `index()` end to end, because the graph is where the defect
//! was seen and a walk-level pass is not the same claim.

mod common;

use supertaskr_index::{index, stable_json, IndexOptions};

fn graph_for(root: &std::path::Path) -> supertaskr_index::Graph {
    index(&IndexOptions {
        root: root.to_path_buf(),
        ..Default::default()
    })
    .expect("index")
}

#[cfg(unix)]
#[test]
fn outside_tree_symlinks_never_enter_the_graph() {
    use std::os::unix::fs::symlink;
    let tree = common::TempTree::new("contain");
    tree.write("src/real.ts", "export const real = 1;\n");

    // Content a hostile repo would love to exfiltrate.
    let outside = common::TempTree::new("contain-outside");
    outside.write("secret-file.ts", "export const secretValue = 42;\n");
    outside.write("dir/secret-deep.ts", "export const secretDeep = 43;\n");

    // File symlink, dir symlink, and a nested dir symlink.
    symlink(
        outside.root().join("secret-file.ts"),
        tree.root().join("src/link.ts"),
    )
    .expect("file symlink");
    symlink(outside.root(), tree.root().join("linkdir")).expect("dir symlink");
    symlink(
        outside.root().join("dir"),
        tree.root().join("src/nested-linkdir"),
    )
    .expect("nested dir symlink");

    let graph = graph_for(tree.root());
    let doc = stable_json(&graph);
    let paths: Vec<&str> = graph.files.iter().map(|f| f.path.as_str()).collect();
    assert_eq!(paths, vec!["src/real.ts"], "only the real file walks");
    assert!(!doc.contains("secret"), "secret content never appears: {doc}");
}

#[cfg(unix)]
#[test]
fn a_symlinked_root_anchors_to_the_canonical_path_and_stays_contained() {
    use std::os::unix::fs::symlink;
    let real = common::TempTree::new("contain-real");
    real.write("a.ts", "export const a = 1;\n");
    let holder = common::TempTree::new("contain-alias");
    let alias = holder.root().join("alias");
    symlink(real.root(), &alias).expect("root symlink");

    let via_alias = graph_for(&alias);
    let direct = graph_for(real.root());
    assert_eq!(stable_json(&via_alias), stable_json(&direct));
    assert_eq!(via_alias.root, ".", "no machine identity in the payload");
}

/// A cargo `CACHEDIR.TAG` as cargo writes it, typed as a LITERAL — never
/// derived from the crate's own constant, which would move with it
/// (CONVENTIONS, *a test parametrised by the constant it checks cannot
/// pin that constant*).
const CARGO_CACHEDIR_TAG: &str = "Signature: 8a477f597d28d172789f06886806bc55\n\
     # This file is a cache directory tag created by cargo.\n\
     # For information about cache directory tags see https://bford.info/cachedir/\n";

#[test]
fn a_cargo_target_directory_under_a_chosen_name_never_enters_the_graph() {
    // THE DEFECT AS IT WAS ACTUALLY SEEN (`T-153-s3`, `T-111-s10`,
    // `T-111-s11`): the drill's `CARGO_TARGET_DIR` sits inside the
    // worktree because CONVENTIONS' POISON DRILL puts it there, it is
    // NOT called `target` because `T-092` requires the lane's derived
    // stem, `.gitignore` excludes only the name `target`, and the build
    // script outputs under `debug/build/*/out/` are `.rs` and `.js` — so
    // they are indexed as repository content and the graph gains files
    // that exist in one session's scratch directory and nowhere else.
    let tree = common::TempTree::new("contain-cachedir");
    tree.write("src/real.ts", "export const real = 1;\n");

    // The build directory, with the three shapes the two sightings
    // measured: a build-script Rust emit, a tauri JS emit, and a
    // dependency's own `out/` Rust emit.
    tree.write(".t153s3-target/CACHEDIR.TAG", CARGO_CACHEDIR_TAG);
    tree.write(
        ".t153s3-target/debug/build/serde_core-1a2b3c/out/private.rs",
        "pub fn phantom() -> u8 { 1 }\n",
    );
    tree.write(
        ".t153s3-target/debug/build/tauri-9f8e7d/out/__global-api-script.js",
        "var phantomApi = 1;\n",
    );
    tree.write(
        ".t153s3-target/debug/build/web_atoms-4d5e6f/out/named_entities.rs",
        "pub const PHANTOM: u8 = 2;\n",
    );

    // THE FIXTURE'S STATE, before anything is exercised: the stem is not
    // the one name any ignore rule carries, and there is no ignore file
    // in this tree at all, so nothing name-based can be what refuses it.
    let dir = tree.root().join(".t153s3-target");
    assert!(dir.is_dir(), "the build directory is not a directory");
    assert_ne!(
        dir.file_name().and_then(|n| n.to_str()),
        Some("target"),
        "the stem must be one no ignore rule names — that is the case"
    );
    assert!(
        !tree.root().join(".gitignore").exists() && !tree.root().join(".supertaskrignore").exists(),
        "no ignore file may exist here, or the refusal could be an ignore rule's"
    );

    let graph = graph_for(tree.root());
    let paths: Vec<&str> = graph.files.iter().map(|f| f.path.as_str()).collect();
    assert_eq!(paths, vec!["src/real.ts"], "only repository content walks");
    let doc = stable_json(&graph);
    assert!(
        !doc.contains("phantom") && !doc.contains("t153s3-target"),
        "no build artefact reaches the payload: {doc}"
    );

    // POSITIVE CONTROL, isolating the TAG and not the directory: the same
    // stem, the same three files, with ONLY the tag removed. This is the
    // graph the defect produced, and it is the sentence a checkpoint
    // decides on — three phantom files where `files +0 -0` was owed.
    std::fs::remove_file(dir.join("CACHEDIR.TAG")).expect("rm tag");
    let untagged = graph_for(tree.root());
    let untagged_paths: Vec<&str> = untagged.files.iter().map(|f| f.path.as_str()).collect();
    assert_eq!(
        untagged_paths,
        vec![
            ".t153s3-target/debug/build/serde_core-1a2b3c/out/private.rs",
            ".t153s3-target/debug/build/tauri-9f8e7d/out/__global-api-script.js",
            ".t153s3-target/debug/build/web_atoms-4d5e6f/out/named_entities.rs",
            "src/real.ts",
        ],
        "untagged, every artefact is indexed — the walk this skip closes"
    );
}

#[test]
fn escape_specifiers_resolve_to_outside_root_never_reads() {
    let tree = common::TempTree::new("contain-spec");
    tree.write(
        "src/a.ts",
        "import esc from \"../../outside\";\nimport tricky from \"./x/../../../etc/passwd\";\nexport const a = 1;\n",
    );
    let graph = graph_for(tree.root());
    let reasons: Vec<(&str, &str)> = graph
        .unresolved
        .iter()
        .map(|u| (u.specifier.as_str(), u.reason.as_str()))
        .collect();
    assert_eq!(
        reasons,
        vec![
            ("../../outside", "outside_root"),
            ("./x/../../../etc/passwd", "outside_root"),
        ]
    );
    assert_eq!(graph.edges.len(), 0, "no edge for an escape");
}
