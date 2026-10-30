//! Python is a structural graph over the walked source set, never an execution
//! or sys.path model. These fixtures pin useful edges and conservative limits.
mod common;

use common::TempTree;
use std::process::Command;
use supertaskr_index::{index, stable_json, DepthSite, Graph, IndexOptions, Lang};

fn options(tree: &TempTree) -> IndexOptions {
    IndexOptions {
        root: tree.root().to_path_buf(),
        languages: vec![Lang::Python],
        ..Default::default()
    }
}

fn has_edge(graph: &Graph, from: &str, to: &str, kind: &str) -> bool {
    graph
        .edges
        .iter()
        .any(|edge| edge.from == from && edge.to == to && edge.kind == kind)
}

fn fixture() -> TempTree {
    let tree = TempTree::new("python");
    tree.write("pkg/__init__.py", "PACKAGE = 'example'\n");
    tree.write("pkg/model.py", "class Thing:\n    def method(self):\n        return 1\n\nLIMIT: int = 3\ndef build() -> Thing:\n    return Thing()\n");
    tree.write("pkg/use.py", "from .model import Thing as Item, build as make\nfrom . import model as objects\nimport pkg.model\nimport pkg.model as module\n\nDEFAULT: Item = make()\nclass Child(Item):\n    pass\n\ndef run(value: Item) -> Item:\n    a = make()\n    b = objects.build()\n    c = pkg.model.build()\n    return module.build()\n");
    tree.write("unselected.ts", "export const ignored = 1;\n");
    tree
}

#[test]
fn python_modules_symbols_aliases_calls_and_annotations_are_real_graph_facts() {
    let tree = fixture();
    let graph = index(&options(&tree)).unwrap();
    assert_eq!(graph.languages, ["python"]);
    assert_eq!(
        graph
            .files
            .iter()
            .map(|file| file.path.as_str())
            .collect::<Vec<_>>(),
        ["pkg/__init__.py", "pkg/model.py", "pkg/use.py"]
    );
    let model = graph
        .files
        .iter()
        .find(|file| file.path == "pkg/model.py")
        .unwrap();
    assert_eq!(
        model
            .symbols
            .iter()
            .map(|symbol| (symbol.name.as_str(), symbol.kind.as_str()))
            .collect::<Vec<_>>(),
        [
            ("LIMIT", "variable"),
            ("Thing", "class"),
            ("build", "function")
        ]
    );
    assert!(has_edge(&graph, "f:pkg/use.py", "f:pkg/model.py", "import"));
    for caller in ["DEFAULT", "run"] {
        assert!(
            has_edge(
                &graph,
                &format!("s:pkg/use.py#{caller}"),
                "s:pkg/model.py#build",
                "call"
            ),
            "{caller}: {graph:#?}"
        );
    }
    for owner in ["DEFAULT", "Child", "run"] {
        assert!(
            has_edge(
                &graph,
                &format!("s:pkg/use.py#{owner}"),
                "s:pkg/model.py#Thing",
                "type_ref"
            ),
            "{owner}: {graph:#?}"
        );
    }
    assert!(has_edge(
        &graph,
        "s:pkg/model.py#build",
        "s:pkg/model.py#Thing",
        "call"
    ));
    assert!(graph.unresolved.is_empty(), "{:#?}", graph.unresolved);
    let mut mixed = options(&tree);
    mixed.languages.push(Lang::Ts);
    assert_eq!(index(&mixed).unwrap().languages, ["python", "ts"]);
}

#[test]
fn namespaces_have_exact_import_prefixes_and_shadowed_names_do_not_invent_calls() {
    let tree = fixture();
    tree.write("shadow.py", "from pkg.model import build\nimport pkg.model\n\ndef positive():\n    return build()\n\ndef parameter(build):\n    return build()\n\ndef assignment():\n    build = lambda: 1\n    return build()\n\ndef loop():\n    for build in []:\n        build()\n\ndef local_import():\n    from pkg.model import build\n    return build()\n\ndef nested():\n    def build():\n        return 1\n    return build()\n\ndef wrong_prefix():\n    return model.build()\n\ndef object_method():\n    return pkg.model.Thing().method()\n");
    let graph = index(&options(&tree)).unwrap();
    assert!(has_edge(
        &graph,
        "s:shadow.py#positive",
        "s:pkg/model.py#build",
        "call"
    ));
    for name in [
        "parameter",
        "assignment",
        "loop",
        "local_import",
        "nested",
        "wrong_prefix",
        "object_method",
    ] {
        assert!(
            !has_edge(
                &graph,
                &format!("s:shadow.py#{name}"),
                "s:pkg/model.py#build",
                "call"
            ),
            "{name}"
        );
    }
    assert!(has_edge(
        &graph,
        "s:shadow.py#object_method",
        "s:pkg/model.py#Thing",
        "call"
    ));
    tree.write("other.py", "def build():\n    return 2\n");
    tree.write(
        "rebound.py",
        "from pkg.model import build\nfrom other import build\ndef run():\n    return build()\n",
    );
    let rebound = index(&options(&tree)).unwrap();
    assert!(
        !rebound
            .edges
            .iter()
            .any(|edge| edge.from == "s:rebound.py#run" && edge.kind == "call"),
        "a conditional or repeated import must not guess runtime binding order"
    );
}

#[test]
fn external_dynamic_ambiguous_star_and_outside_imports_are_explicitly_unresolved() {
    let tree = fixture();
    tree.write("ambiguous.py", "VALUE = 1\n");
    tree.write("ambiguous/__init__.py", "VALUE = 2\n");
    tree.write("pkg/limits.py", "import external_distribution\nimport ambiguous\nfrom pkg.model import *\nfrom pkg.model import missing_member\nfrom ...escape import value\nfrom importlib import import_module as load\n\nDYNAMIC = load('pkg.model')\nOTHER = __import__('pkg.model')\n");
    let graph = index(&options(&tree)).unwrap();
    let unresolved = graph
        .unresolved
        .iter()
        .filter(|item| item.from == "f:pkg/limits.py")
        .map(|item| (item.specifier.as_str(), item.reason.as_str()))
        .collect::<Vec<_>>();
    for expected in [
        ("external_distribution", "not_found"),
        ("ambiguous", "unsupported"),
        ("pkg.model", "unsupported"),
        ("...escape", "outside_root"),
        ("<dynamic-python-import>", "unsupported"),
    ] {
        assert!(
            unresolved.contains(&expected),
            "{expected:?}: {unresolved:?}"
        );
    }
    assert!(!graph
        .edges
        .iter()
        .any(|edge| edge.from == "f:pkg/limits.py" && edge.to == "f:ambiguous.py"));
}

#[test]
fn cache_and_repeated_output_are_identical_and_deep_python_is_named() {
    let tree = fixture();
    let cold = index(&options(&tree)).unwrap();
    let mut cached = options(&tree);
    cached.cache_dir = Some(tree.root().join("cache"));
    let first = index(&cached).unwrap();
    let second = index(&cached).unwrap();
    assert_eq!(stable_json(&cold), stable_json(&first));
    assert_eq!(stable_json(&first), stable_json(&second));
    let expression = format!("VALUE = {}1{}\n", "[".repeat(180), "]".repeat(180));
    tree.write("deep.py", &expression);
    let deep = index(&options(&tree)).unwrap();
    assert_eq!(
        deep.files
            .iter()
            .find(|file| file.path == "deep.py")
            .unwrap()
            .depth_refused,
        Some(DepthSite::PythonTraversal)
    );
    assert!(deep
        .files
        .iter()
        .any(|file| file.path == "pkg/model.py" && !file.symbols.is_empty()));
}

#[test]
fn native_registry_and_explicit_selection_drive_the_real_executable() {
    let run = |args: &[&str]| {
        Command::new(env!("CARGO_BIN_EXE_supertaskr-index"))
            .args(args)
            .output()
            .unwrap()
    };
    let registry = run(&["--languages-json"]);
    assert!(registry.status.success());
    let registry: serde_json::Value = serde_json::from_slice(&registry.stdout).unwrap();
    assert_eq!(
        registry,
        serde_json::json!({"version": 1, "languages": ["ts", "js", "rust", "python"]})
    );
    let tree = fixture();
    let root = tree.root().to_str().unwrap();
    let graph = run(&[
        "index",
        "--emit-json",
        "--root",
        root,
        "--languages",
        "python",
    ]);
    assert!(
        graph.status.success(),
        "{}",
        String::from_utf8_lossy(&graph.stderr)
    );
    let graph: Graph = serde_json::from_slice(&graph.stdout).unwrap();
    assert!(has_edge(
        &graph,
        "s:pkg/use.py#run",
        "s:pkg/model.py#build",
        "call"
    ));
    assert!(!tree.root().join("docs").exists(), "emit is read-only");
    for selection in ["", "python,python", "python,unknown", "Python"] {
        let refusal = run(&[
            "index",
            "--emit-json",
            "--root",
            root,
            "--languages",
            selection,
        ]);
        assert_eq!(
            refusal.status.code(),
            Some(3),
            "{selection}: {}",
            String::from_utf8_lossy(&refusal.stderr)
        );
        assert!(String::from_utf8_lossy(&refusal.stderr).contains("index-language"));
    }
    assert_eq!(
        run(&["--languages-json", "--root", root]).status.code(),
        Some(2)
    );
}
