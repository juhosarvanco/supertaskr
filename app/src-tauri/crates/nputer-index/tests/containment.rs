//! Containment against a live walk (plan §8): outside-tree symlinks,
//! escape specifiers. Runtime scratch trees, unix-gated (no symlinks are
//! ever committed in fixtures — Windows checkout hazard).

mod common;

use nputer_index::{index, stable_json, IndexOptions};

fn graph_for(root: &std::path::Path) -> nputer_index::Graph {
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
