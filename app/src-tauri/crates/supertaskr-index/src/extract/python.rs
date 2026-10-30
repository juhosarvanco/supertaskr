//! Python module bindings and literal imports. Resolution remains over the
//! walked set; this does not execute Python or infer dynamic runtime objects.
//! Methods/inner functions and arbitrary attribute dispatch are not symbols.
use std::collections::{BTreeMap, BTreeSet};
use tree_sitter::{Node, Tree};

use super::{Candidate, ExtractRecord, Extractor, NameBinding, RawImport, RawSymbol, MAX_DEPTH};
use crate::graph::DepthSite;

pub(crate) struct PythonExtractor;

fn text<'a>(node: Node, source: &'a str) -> &'a str {
    node.utf8_text(source.as_bytes()).unwrap_or("")
}

fn scope(kind: &str) -> bool {
    matches!(kind, "function_definition" | "class_definition" | "lambda")
}

/// One bounded iterative AST walk. `module` describes the node's enclosing
/// scope; declarations themselves still belong to their surrounding scope.
fn walk(root: Node, stop_inner_scopes: bool) -> (Vec<(Node, bool)>, bool) {
    let mut stack = vec![(root, 0, true)];
    let mut result = Vec::new();
    let mut refused = false;
    while let Some((node, depth, module)) = stack.pop() {
        if depth > MAX_DEPTH {
            refused = true;
            continue;
        }
        result.push((node, module));
        if stop_inner_scopes
            && node.id() != root.id()
            && (scope(node.kind()) || node.kind() == "decorator")
        {
            continue;
        }
        let mut cursor = node.walk();
        let children: Vec<_> = node.named_children(&mut cursor).collect();
        for child in children.into_iter().rev() {
            stack.push((child, depth + 1, module && !scope(node.kind())));
        }
    }
    (result, refused)
}

fn bindings(node: Node, source: &str) -> (BTreeSet<String>, bool) {
    let mut out = BTreeSet::new();
    let mut stack = vec![(node, 0)];
    let mut refused = false;
    while let Some((node, depth)) = stack.pop() {
        if depth > MAX_DEPTH {
            refused = true;
            continue;
        }
        if node.kind() == "identifier" {
            out.insert(text(node, source).to_string());
            continue;
        }
        if matches!(node.kind(), "default_parameter" | "typed_default_parameter") {
            if let Some(name) = node.child_by_field_name("name") {
                stack.push((name, depth + 1));
            }
        } else if matches!(
            node.kind(),
            "parameters" | "typed_parameter" | "pattern_list"
        ) || node.kind().ends_with("_pattern")
        {
            let mut cursor = node.walk();
            for child in node.named_children(&mut cursor) {
                if child.kind() != "type" {
                    stack.push((child, depth + 1));
                }
            }
        }
    }
    (out, refused)
}

fn reference(node: Node, source: &str) -> Option<String> {
    let mut names = Vec::new();
    let mut at = node;
    for _ in 0..=MAX_DEPTH {
        match at.kind() {
            "identifier" | "dotted_name" => {
                names.push(text(at, source).to_string());
                names.reverse();
                return Some(names.join("."));
            }
            "attribute" => {
                names.push(text(at.child_by_field_name("attribute")?, source).to_string());
                at = at.child_by_field_name("object")?;
            }
            _ => return None,
        }
    }
    None
}

fn imported(node: Node, source: &str) -> (String, Option<String>) {
    if node.kind() == "aliased_import" {
        (
            node.child_by_field_name("name")
                .map(|n| text(n, source))
                .unwrap_or("")
                .to_string(),
            node.child_by_field_name("alias")
                .map(|n| text(n, source).to_string()),
        )
    } else {
        (text(node, source).to_string(), None)
    }
}

fn imports(node: Node, source: &str, module: bool) -> Vec<RawImport> {
    if node.kind() == "import_statement" {
        let mut cursor = node.walk();
        return node
            .children_by_field_name("name", &mut cursor)
            .map(|name| {
                let (specifier, alias) = imported(name, source);
                // An unaliased dotted import binds this exact attribute prefix,
                // not the final component as a bare callable name.
                RawImport {
                    names: vec![NameBinding {
                        source: "*".into(),
                        local: module.then(|| alias.unwrap_or_else(|| specifier.clone())),
                    }],
                    specifier,
                    reexport: false,
                }
            })
            .collect();
    }
    if node.kind() != "import_from_statement" {
        return Vec::new();
    }
    let specifier = node
        .child_by_field_name("module_name")
        .map(|n| text(n, source))
        .unwrap_or("")
        .to_string();
    let mut cursor = node.walk();
    let mut names: Vec<_> = node
        .children_by_field_name("name", &mut cursor)
        .map(|name| {
            let (source_name, alias) = imported(name, source);
            NameBinding {
                local: module.then(|| alias.unwrap_or_else(|| source_name.clone())),
                source: source_name,
            }
        })
        .collect();
    if names.is_empty() {
        names.push(NameBinding {
            source: "*".into(),
            local: None,
        });
    }
    vec![RawImport {
        specifier,
        names,
        reexport: false,
    }]
}

impl Extractor for PythonExtractor {
    fn extract(&self, source: &str, tree: &Tree) -> ExtractRecord {
        let (all, mut refused) = walk(tree.root_node(), false);
        let mut symbols: BTreeMap<String, RawSymbol> = BTreeMap::new();
        let mut spans = Vec::new();
        let mut found_imports = Vec::new();
        for (node, module) in &all {
            found_imports.extend(imports(*node, source, *module));
            if !module {
                continue;
            }
            let declared = if matches!(node.kind(), "function_definition" | "class_definition") {
                node.child_by_field_name("name").map(|n| {
                    (
                        vec![text(n, source).to_string()],
                        if node.kind() == "function_definition" {
                            "function"
                        } else {
                            "class"
                        },
                    )
                })
            } else if node.kind() == "assignment" {
                node.child_by_field_name("left").map(|left| {
                    let (names, depth) = bindings(left, source);
                    refused |= depth;
                    (names.into_iter().collect(), "variable")
                })
            } else {
                None
            };
            if let Some((names, kind)) = declared {
                for name in names {
                    let range = [node.start_position().row + 1, node.end_position().row + 1];
                    symbols
                        .entry(name.clone())
                        .and_modify(|prior| {
                            prior.range[0] = prior.range[0].min(range[0]);
                            prior.range[1] = prior.range[1].max(range[1]);
                        })
                        .or_insert(RawSymbol {
                            name: name.clone(),
                            kind: kind.into(),
                            exported: true,
                            range,
                        });
                    spans.push((name, *node));
                }
            }
        }
        // Dynamic import execution cannot be resolved by the walked set.
        // Keep one explicit unsupported occurrence per file, not a guessed edge.
        let mut dynamic_names = BTreeSet::from([
            "__import__".to_string(),
            "importlib.import_module".to_string(),
        ]);
        for (node, _) in &all {
            for import in imports(*node, source, true) {
                if import.specifier != "importlib" {
                    continue;
                }
                for binding in &import.names {
                    if let Some(local) = &binding.local {
                        if binding.source == "*" {
                            dynamic_names.insert(format!("{local}.import_module"));
                        }
                        if binding.source == "import_module" {
                            dynamic_names.insert(local.clone());
                        }
                    }
                }
            }
        }
        if all.iter().any(|(node, _)| {
            node.kind() == "call"
                && node
                    .child_by_field_name("function")
                    .and_then(|n| reference(n, source))
                    .is_some_and(|name| dynamic_names.contains(&name))
        }) {
            found_imports.push(RawImport {
                specifier: "<dynamic-python-import>".into(),
                names: Vec::new(),
                reexport: false,
            });
        }
        let mut calls = BTreeSet::new();
        let mut types = BTreeSet::new();
        for (enclosing, declaration) in spans {
            let (nodes, depth) = walk(declaration, true);
            refused |= depth;
            let mut shadowed = BTreeSet::new();
            if let Some(parameters) = declaration.child_by_field_name("parameters") {
                let (names, depth) = bindings(parameters, source);
                shadowed.extend(names);
                refused |= depth;
            }
            if scope(declaration.kind()) {
                for (node, _) in &nodes {
                    if matches!(
                        node.kind(),
                        "assignment" | "for_statement" | "for_in_clause"
                    ) {
                        if let Some(left) = node.child_by_field_name("left") {
                            let (names, depth) = bindings(left, source);
                            shadowed.extend(names);
                            refused |= depth;
                        }
                    }
                    if node.kind() == "named_expression" {
                        if let Some(name) = node.child_by_field_name("name") {
                            let (names, depth) = bindings(name, source);
                            shadowed.extend(names);
                            refused |= depth;
                        }
                    }
                    if node.kind() == "as_pattern" {
                        if let Some(alias) = node.child_by_field_name("alias") {
                            let (names, depth) = bindings(alias, source);
                            shadowed.extend(names);
                            refused |= depth;
                        }
                    }
                    if node.id() != declaration.id() && scope(node.kind()) {
                        if let Some(name) = node.child_by_field_name("name") {
                            shadowed.insert(text(name, source).to_string());
                        }
                    }
                    for import in imports(*node, source, true) {
                        shadowed.extend(
                            import
                                .names
                                .into_iter()
                                .filter_map(|b| b.local)
                                .map(|name| name.split('.').next().unwrap_or("").to_string()),
                        );
                    }
                }
            }
            for (node, _) in nodes {
                if node.kind() != "call" {
                    continue;
                }
                if let Some(name) = node
                    .child_by_field_name("function")
                    .and_then(|n| reference(n, source))
                {
                    if !shadowed.contains(name.split('.').next().unwrap_or(""))
                        && !dynamic_names.contains(&name)
                    {
                        calls.insert(Candidate {
                            enclosing: enclosing.clone(),
                            name,
                        });
                    }
                }
            }
            let mut type_roots = Vec::new();
            if let Some(parameters) = declaration.child_by_field_name("parameters") {
                let (nodes, depth) = walk(parameters, true);
                refused |= depth;
                type_roots.extend(
                    nodes
                        .into_iter()
                        .filter_map(|(node, _)| node.child_by_field_name("type")),
                );
            }
            if let Some(returns) = declaration.child_by_field_name("return_type") {
                type_roots.push(returns);
            }
            if let Some(annotation) = declaration.child_by_field_name("type") {
                type_roots.push(annotation);
            }
            if let Some(bases) = declaration.child_by_field_name("superclasses") {
                type_roots.push(bases);
            }
            for root in type_roots {
                let (nodes, depth) = walk(root, true);
                refused |= depth;
                for (node, _) in nodes {
                    if node
                        .parent()
                        .is_some_and(|parent| parent.kind() == "attribute")
                    {
                        continue;
                    }
                    if let Some(name) = reference(node, source) {
                        types.insert(Candidate {
                            enclosing: enclosing.clone(),
                            name,
                        });
                    }
                }
            }
        }
        ExtractRecord {
            symbols: symbols.into_values().collect(),
            imports: found_imports,
            calls: calls.into_iter().collect(),
            type_refs: types.into_iter().collect(),
            mods: Vec::new(),
            depth_refused: refused.then_some(DepthSite::PythonTraversal),
        }
    }
}
