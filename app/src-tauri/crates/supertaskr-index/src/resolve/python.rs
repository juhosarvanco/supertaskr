//! Python resolution over walked files only. Project-root modules and packages
//! are supported; sys.path, namespace search roots, installed distributions,
//! dynamic attributes/re-exports and arbitrary runtime dispatch are not guessed.
use std::collections::{BTreeMap, BTreeSet};

use crate::extract::{ExtractRecord, NameBinding, RawImport};
use crate::graph::symbol_id;

pub(crate) struct PythonResolved {
    pub imports: Vec<(String, RawImport)>,
    pub candidates: BTreeSet<(String, String, &'static str)>,
    pub unresolved: BTreeSet<(String, &'static str)>,
}

fn parts(from: &str, specifier: &str) -> Result<Vec<String>, &'static str> {
    if specifier == "<dynamic-python-import>" {
        return Err("unsupported");
    }
    let dots = specifier.chars().take_while(|ch| *ch == '.').count();
    let mut prefix: Vec<String> = if dots > 0 {
        super::parent_dir_of(from)
            .split('/')
            .filter(|part| !part.is_empty())
            .map(str::to_string)
            .collect()
    } else {
        Vec::new()
    };
    if dots > prefix.len() {
        return Err("outside_root");
    }
    if dots > 0 {
        prefix.truncate(prefix.len() - (dots - 1));
    }
    let suffix = &specifier[dots..];
    if !suffix.is_empty() {
        for part in suffix.split('.') {
            if part.is_empty() || !part.chars().all(|ch| ch == '_' || ch.is_alphanumeric()) {
                return Err("unsupported");
            }
            prefix.push(part.to_string());
        }
    }
    if prefix.is_empty() {
        return Err("not_found");
    }
    Ok(prefix)
}

fn module_file(parts: &[String], files: &BTreeSet<&str>) -> Result<Option<String>, &'static str> {
    let base = parts.join("/");
    let candidates = [format!("{base}.py"), format!("{base}/__init__.py")];
    let found: Vec<_> = candidates
        .into_iter()
        .filter(|file| files.contains(file.as_str()))
        .collect();
    // Both forms are legal filenames, but selecting one would infer loader
    // precedence. Preserve that ambiguity rather than invent an edge.
    if found.len() > 1 {
        Err("unsupported")
    } else {
        Ok(found.into_iter().next())
    }
}

pub(crate) fn resolve_file(
    from: &str,
    record: &ExtractRecord,
    files: &BTreeSet<&str>,
    records: &BTreeMap<String, ExtractRecord>,
) -> PythonResolved {
    let mut result = PythonResolved {
        imports: Vec::new(),
        candidates: BTreeSet::new(),
        unresolved: BTreeSet::new(),
    };
    let mut bindings: BTreeMap<String, (String, String)> = BTreeMap::new();
    let mut ambiguous_bindings = BTreeSet::new();
    for import in &record.imports {
        let path = match parts(from, &import.specifier) {
            Ok(path) => path,
            Err(reason) => {
                result.unresolved.insert((import.specifier.clone(), reason));
                continue;
            }
        };
        let base = match module_file(&path, files) {
            Ok(base) => base,
            Err(reason) => {
                result.unresolved.insert((import.specifier.clone(), reason));
                continue;
            }
        };
        for binding in &import.names {
            let mut target = base.clone();
            let mut source = binding.source.clone();
            if source != "*" {
                let declared = base
                    .as_ref()
                    .and_then(|file| records.get(file))
                    .is_some_and(|target| {
                        target.symbols.iter().any(|symbol| symbol.name == source)
                    });
                if !declared {
                    let mut child = path.clone();
                    child.extend(source.split('.').map(str::to_string));
                    match module_file(&child, files) {
                        Ok(Some(file)) => {
                            target = Some(file);
                            source = "*".into();
                        }
                        Ok(None) => {
                            // The module exists, but neither its structural
                            // declarations nor a walked child define this name.
                            // A runtime re-export cannot be inferred here.
                            result
                                .unresolved
                                .insert((import.specifier.clone(), "unsupported"));
                        }
                        Err(reason) => {
                            result.unresolved.insert((import.specifier.clone(), reason));
                            continue;
                        }
                    }
                }
            }
            let Some(target) = target else {
                result
                    .unresolved
                    .insert((import.specifier.clone(), "not_found"));
                continue;
            };
            if let Some(local) = &binding.local {
                let value = (target.clone(), source.clone());
                if bindings.get(local).is_some_and(|prior| *prior != value) {
                    ambiguous_bindings.insert(local.clone());
                }
                bindings.insert(local.clone(), value);
            }
            if binding.source == "*" && binding.local.is_none() {
                result
                    .unresolved
                    .insert((import.specifier.clone(), "unsupported"));
            }
            if target != from {
                result.imports.push((
                    target,
                    RawImport {
                        specifier: import.specifier.clone(),
                        names: vec![NameBinding {
                            source,
                            local: binding.local.clone(),
                        }],
                        reexport: false,
                    },
                ));
            }
        }
    }
    let locals: BTreeSet<_> = record
        .symbols
        .iter()
        .map(|symbol| symbol.name.as_str())
        .collect();
    for (candidates, kind) in [(&record.calls, "call"), (&record.type_refs, "type_ref")] {
        for candidate in candidates {
            let first = candidate.name.split('.').next().unwrap_or("");
            if locals.contains(first)
                && bindings
                    .keys()
                    .any(|local| local == first || local.starts_with(&format!("{first}.")))
            {
                continue;
            }
            let mut target = locals
                .contains(candidate.name.as_str())
                .then(|| symbol_id(from, &candidate.name));
            if target.is_none() {
                // Longest explicit module prefix first (`pkg.mod.fn`), not a
                // guessed attribute on a package that happened to share a name.
                let mut choices: Vec<_> = bindings.iter().collect();
                choices.sort_by(|(a, _), (b, _)| b.len().cmp(&a.len()).then_with(|| a.cmp(b)));
                for (local, (file, source)) in choices {
                    if ambiguous_bindings.contains(local) {
                        continue;
                    }
                    let name = if source == "*" {
                        candidate.name.strip_prefix(&format!("{local}."))
                    } else {
                        (candidate.name == *local).then_some(source.as_str())
                    };
                    if let Some(name) = name.filter(|name| !name.contains('.')) {
                        if records.get(file).is_some_and(|record| {
                            record.symbols.iter().any(|symbol| symbol.name == name)
                        }) {
                            target = Some(symbol_id(file, name));
                            break;
                        }
                    }
                }
            }
            if let Some(target) = target {
                result
                    .candidates
                    .insert((symbol_id(from, &candidate.enclosing), target, kind));
            }
        }
    }
    result
}
