//! Resolution driver + unresolved taxonomy (plan §6).
//!
//! Resolution is a pure function of the walked file set + tsconfig data +
//! package.json data — it never probes the filesystem for candidates. A
//! specifier that would resolve to an unwalked on-disk file is honestly
//! `unresolved`. The closed reason taxonomy: `not_found`, `outside_root`,
//! `unsupported`, `asset`.

pub(crate) mod rust;
pub(crate) mod ts;
pub(crate) mod tsconfig;

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::rc::Rc;

use crate::extract::ExtractRecord;
use crate::graph::{file_id, package_id, symbol_id, Edge, Lang, Package, Unresolved};

use rust::{RustOutcome, RustWorld};

use ts::{
    candidates_for, is_asset, is_relative, is_unsupported, match_paths, normalize_join,
    package_ref, strip_query,
};
use tsconfig::TsconfigIndex;

pub(crate) struct Resolved {
    pub edges: Vec<Edge>,
    pub packages: Vec<Package>,
    pub unresolved: Vec<Unresolved>,
}

/// Parent dir of a root-relative POSIX path ("" for top-level entries).
pub(crate) fn parent_dir_of(rel: &str) -> &str {
    rel.rsplit_once('/').map(|(dir, _)| dir).unwrap_or("")
}

/// Contained read of `<root>/<dir>/<name>`: symlinks (file or dir target)
/// are never followed, and the canonical path must stay under the root —
/// same rules as every other read (T-003 idiom).
pub(crate) fn read_contained(root: &Path, dir: &str, name: &str) -> Option<String> {
    let path = if dir.is_empty() {
        root.join(name)
    } else {
        root.join(dir).join(name)
    };
    let meta = std::fs::symlink_metadata(&path).ok()?;
    if meta.file_type().is_symlink() || !meta.is_file() {
        return None;
    }
    let canon = path.canonicalize().ok()?;
    if !canon.starts_with(root) {
        return None;
    }
    std::fs::read_to_string(&canon).ok()
}

/// Nearest package.json data: the dir it lives in + its declared
/// dependency spec per name (dependencies > devDependencies >
/// optionalDependencies > peerDependencies).
#[derive(Debug, PartialEq)]
struct PkgData {
    dir: String,
    deps: BTreeMap<String, String>,
}

struct PackageIndex {
    root: PathBuf,
    memo: BTreeMap<String, Option<Rc<PkgData>>>,
}

impl PackageIndex {
    fn new(root: &Path) -> Self {
        Self {
            root: root.to_path_buf(),
            memo: BTreeMap::new(),
        }
    }

    fn nearest(&mut self, dir: &str) -> Option<Rc<PkgData>> {
        if let Some(hit) = self.memo.get(dir) {
            return hit.clone();
        }
        let own = read_contained(&self.root, dir, "package.json").and_then(|text| {
            // package.json is strict JSON; unparseable -> absent at this
            // level, search continues up.
            let value: serde_json::Value = serde_json::from_str(&text).ok()?;
            let mut deps = BTreeMap::new();
            for section in [
                "dependencies",
                "devDependencies",
                "optionalDependencies",
                "peerDependencies",
            ] {
                if let Some(map) = value.get(section).and_then(|v| v.as_object()) {
                    for (name, spec) in map {
                        if let Some(spec) = spec.as_str() {
                            deps.entry(name.clone()).or_insert_with(|| spec.to_string());
                        }
                    }
                }
            }
            Some(PkgData {
                dir: dir.to_string(),
                deps,
            })
        });
        let result = match own {
            Some(data) => Some(Rc::new(data)),
            None => {
                if dir.is_empty() {
                    None
                } else {
                    self.nearest(parent_dir_of(dir))
                }
            }
        };
        self.memo.insert(dir.to_string(), result.clone());
        result
    }

    /// The `file:`/`link:` decision (plan §6.6): a bare specifier whose
    /// nearest package.json declares it as a file:/link: dependency gets
    /// a repo-relative `path` on its package node — when the target lands
    /// inside the root. Declarative: no symlink is ever traversed.
    fn file_dep_path(&mut self, dir: &str, name: &str) -> Option<String> {
        let pkg = self.nearest(dir)?;
        let spec = pkg.deps.get(name)?;
        let target = spec
            .strip_prefix("file:")
            .or_else(|| spec.strip_prefix("link:"))?;
        if target.starts_with('/') {
            return None; // absolute target: not repo-relative, no path
        }
        normalize_join(&pkg.dir, target)
    }
}

enum Outcome {
    File(String),
    Pkg(Package),
    Un(&'static str),
}

fn resolve_specifier(
    raw: &str,
    dir: &str,
    walked: &BTreeSet<&str>,
    tsconfigs: &mut TsconfigIndex,
    packages: &mut PackageIndex,
) -> Outcome {
    let spec = strip_query(raw);
    if is_unsupported(spec) {
        return Outcome::Un("unsupported");
    }
    if is_asset(spec) {
        return Outcome::Un("asset");
    }
    if is_relative(spec) {
        let Some(base) = normalize_join(dir, spec) else {
            return Outcome::Un("outside_root");
        };
        if let Some(hit) = first_hit(&base, walked) {
            return Outcome::File(hit);
        }
        return Outcome::Un("not_found");
    }
    // Non-relative: nearest tsconfig's paths, then plain baseUrl, then bare.
    if let Some(cfg) = tsconfigs.nearest(dir) {
        if let Some(bases) = match_paths(spec, &cfg) {
            for base in bases {
                if let Some(hit) = first_hit(&base, walked) {
                    return Outcome::File(hit);
                }
            }
            // All targets missed -> fall through (TS behavior).
        }
        if let Some(base_url) = &cfg.base_url {
            if let Some(base) = normalize_join(base_url, spec) {
                if let Some(hit) = first_hit(&base, walked) {
                    return Outcome::File(hit);
                }
            }
        }
    }
    match package_ref(spec) {
        None => Outcome::Un("not_found"), // malformed bare (e.g. "@/x" post-alias-miss)
        Some((name, ecosystem)) => {
            let path = if ecosystem == "npm" {
                packages.file_dep_path(dir, &name)
            } else {
                None
            };
            Outcome::Pkg(Package {
                id: package_id(&name),
                name,
                ecosystem,
                path,
            })
        }
    }
}

fn first_hit(base: &str, walked: &BTreeSet<&str>) -> Option<String> {
    candidates_for(base)
        .into_iter()
        .find(|c| walked.contains(c.as_str()))
}

struct EdgeAcc {
    symbols: BTreeSet<String>,
    all_reexport: bool,
}

/// Resolve every import + gate every call/type_ref candidate across the
/// walked set. Output arrays arrive fully sorted (edges by
/// (from, to, kind); packages by id; unresolved by (from, specifier,
/// reason)) and deduped.
pub(crate) fn resolve_all(
    canon_root: &Path,
    records: &BTreeMap<String, ExtractRecord>,
    langs: &BTreeMap<String, Lang>,
) -> Resolved {
    let walked: BTreeSet<&str> = records.keys().map(String::as_str).collect();
    let mut tsconfigs = TsconfigIndex::new(canon_root);
    let mut pkg_index = PackageIndex::new(canon_root);
    // T-010: Rust resolves against a MODULE TREE rather than filename
    // candidates, so it gets its own world — built once, from the walked
    // Rust files and the `mod` declarations already in the records.
    let rust_files: BTreeSet<&str> = langs
        .iter()
        .filter(|(_, lang)| **lang == Lang::Rust)
        .map(|(rel, _)| rel.as_str())
        .collect();
    let rust_world = (!rust_files.is_empty())
        .then(|| RustWorld::build(canon_root, &rust_files, records));

    // Exported symbol names per file, for candidate gating rule (b).
    let exported: BTreeMap<&str, BTreeSet<&str>> = records
        .iter()
        .map(|(rel, record)| {
            (
                rel.as_str(),
                record
                    .symbols
                    .iter()
                    .filter(|s| s.exported)
                    .map(|s| s.name.as_str())
                    .collect(),
            )
        })
        .collect();

    let mut import_edges: BTreeMap<(String, String), EdgeAcc> = BTreeMap::new();
    let mut candidate_edges: BTreeSet<(String, String, &'static str)> = BTreeSet::new();
    let mut packages: BTreeMap<String, Package> = BTreeMap::new();
    let mut unresolved: BTreeSet<(String, String, String)> = BTreeSet::new();

    for (rel, record) in records {
        let from_id = file_id(rel);
        let dir = parent_dir_of(rel);

        if let Some(world) = rust_world.as_ref().filter(|_| rust_files.contains(rel.as_str())) {
            // Rust: import edges, packages and unresolved only — no
            // call/type_ref candidates are extracted (see resolve::rust).
            for import in &record.imports {
                match world.resolve(rel, &import.specifier) {
                    RustOutcome::File { target, name } => accumulate_one(
                        &mut import_edges,
                        from_id.clone(),
                        file_id(&target),
                        Some(&name),
                        import.reexport,
                    ),
                    RustOutcome::Pkg { name } => {
                        let id = package_id(&name);
                        // A package edge names the LAST segment — the name
                        // the `use` actually binds — because the crate's
                        // own module split is outside the walked set.
                        let bound = import
                            .specifier
                            .rsplit("::")
                            .next()
                            .filter(|s| !s.is_empty())
                            .unwrap_or("*")
                            .to_string();
                        accumulate_one(
                            &mut import_edges,
                            from_id.clone(),
                            id.clone(),
                            Some(&bound),
                            import.reexport,
                        );
                        packages.entry(id.clone()).or_insert(Package {
                            id,
                            name,
                            ecosystem: "cargo".to_string(),
                            path: None,
                        });
                    }
                    // A path that resolved back to its own file carries no
                    // edge — `use super::*` inside `mod tests` is the
                    // ordinary case, and a self-edge says nothing.
                    RustOutcome::SelfRef => {}
                    RustOutcome::Unresolved(reason) => {
                        unresolved.insert((
                            from_id.clone(),
                            import.specifier.clone(),
                            reason.to_string(),
                        ));
                    }
                }
            }
            continue;
        }
        // Local name -> (target file, source name) for resolved named
        // imports; feeds candidate gating rule (b). Document order;
        // a later binding of the same local wins (deterministic).
        let mut bindings: BTreeMap<&str, (String, &str)> = BTreeMap::new();

        for import in &record.imports {
            match resolve_specifier(&import.specifier, dir, &walked, &mut tsconfigs, &mut pkg_index)
            {
                Outcome::File(target) => {
                    for binding in &import.names {
                        if let Some(local) = &binding.local {
                            bindings
                                .insert(local.as_str(), (target.clone(), binding.source.as_str()));
                        }
                    }
                    accumulate(
                        &mut import_edges,
                        from_id.clone(),
                        file_id(&target),
                        import,
                    );
                }
                Outcome::Pkg(pkg) => {
                    accumulate(&mut import_edges, from_id.clone(), pkg.id.clone(), import);
                    packages
                        .entry(pkg.id.clone())
                        .and_modify(|existing| {
                            // Merge: a known repo-internal path wins over none.
                            if existing.path.is_none() {
                                existing.path = pkg.path.clone();
                            }
                        })
                        .or_insert(pkg);
                }
                Outcome::Un(reason) => {
                    unresolved.insert((from_id.clone(), import.specifier.clone(), reason.into()));
                }
            }
        }

        // Candidate gating (plan §6): a name binds to (a) a module-level
        // symbol of this file, or (b) a named import whose target file
        // declares that exported name — otherwise no edge.
        let locals: BTreeSet<&str> = record.symbols.iter().map(|s| s.name.as_str()).collect();
        for (candidates, kind) in [(&record.calls, "call"), (&record.type_refs, "type_ref")] {
            for candidate in candidates {
                let to = if locals.contains(candidate.name.as_str()) {
                    Some(symbol_id(rel, &candidate.name))
                } else if let Some((target, source)) = bindings.get(candidate.name.as_str()) {
                    exported
                        .get(target.as_str())
                        .filter(|names| names.contains(source))
                        .map(|_| symbol_id(target, source))
                } else {
                    None
                };
                if let Some(to) = to {
                    candidate_edges.insert((symbol_id(rel, &candidate.enclosing), to, kind));
                }
            }
        }
    }

    let mut edges: Vec<Edge> = Vec::with_capacity(import_edges.len() + candidate_edges.len());
    for ((from, to), acc) in import_edges {
        edges.push(Edge {
            from,
            to,
            kind: "import".to_string(),
            symbols: (!acc.symbols.is_empty()).then(|| acc.symbols.into_iter().collect()),
            reexport: acc.all_reexport.then_some(true),
            confidence: None,
        });
    }
    for (from, to, kind) in candidate_edges {
        edges.push(Edge {
            from,
            to,
            kind: kind.to_string(),
            symbols: None,
            reexport: None,
            confidence: Some("resolved".to_string()),
        });
    }
    edges.sort_by(|a, b| {
        (a.from.as_str(), a.to.as_str(), a.kind.as_str())
            .cmp(&(b.from.as_str(), b.to.as_str(), b.kind.as_str()))
    });

    Resolved {
        edges,
        packages: packages.into_values().collect(),
        unresolved: unresolved
            .into_iter()
            .map(|(from, specifier, reason)| Unresolved {
                from,
                specifier,
                reason,
            })
            .collect(),
    }
}

fn accumulate(
    edges: &mut BTreeMap<(String, String), EdgeAcc>,
    from: String,
    to: String,
    import: &crate::extract::RawImport,
) {
    if import.names.is_empty() {
        accumulate_one(edges, from, to, None, import.reexport);
        return;
    }
    for binding in &import.names {
        accumulate_one(
            edges,
            from.clone(),
            to.clone(),
            Some(&binding.source),
            import.reexport,
        );
    }
}

/// One (from, to) occurrence with at most one imported name.
///
/// `reexport` survives dedupe only if ALL merged occurrences are
/// re-exports (a plain import subsumes) — the same rule for `export … from`
/// on the TS side and `pub use` on the Rust side.
fn accumulate_one(
    edges: &mut BTreeMap<(String, String), EdgeAcc>,
    from: String,
    to: String,
    name: Option<&str>,
    reexport: bool,
) {
    let acc = edges.entry((from, to)).or_insert(EdgeAcc {
        symbols: BTreeSet::new(),
        all_reexport: true,
    });
    acc.all_reexport &= reexport;
    if let Some(name) = name {
        acc.symbols.insert(name.to_string());
    }
}
